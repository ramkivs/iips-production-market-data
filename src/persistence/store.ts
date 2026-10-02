/**
 * NP-04 — Common Governed Persistence: the governed artifact store.
 *
 * Implements the NP-06 Reports P2 consumer contract:
 *   createInstance, appendVersion, resolveById, queryByOwner, listSupersededBy
 *
 * Design constraints honoured here:
 *  - instance identity is minted independently of canonical content;
 *  - a version chain belongs to a DURABLE INSTANCE, not to a content identity, so two separate
 *    instances of byte-identical content can coexist (each starting at artifact_version 1);
 *  - ownership is taken ONLY from the authenticated principal argument, never from a payload;
 *  - artifacts are append-only: no operation updates or deletes a stored row;
 *  - every mutation runs inside a transaction that rolls back on any failure;
 *  - every read is ownership-scoped, and a cross-owner read is indistinguishable from absence.
 */
import { assertOwner, mintReportId, sameOwner, type AuthenticatedOwner, type ReportId } from './identity.js';
import {
  CANONICAL_SCHEMA_VERSION,
  deriveReportKey,
  type CanonicalParameterValue,
  type CanonicalReportKeyInput,
} from './reportKey.js';
import {
  PersistenceImmutableError,
  PersistenceNotFoundError,
  PersistenceSupersessionError,
  PersistenceTransactionError,
  PersistenceValidationError,
} from './errors.js';
import type { GovernedDatabase } from './db.js';

/** A stored governed artifact, as returned to a consumer. */
export interface GovernedArtifact {
  readonly reportId: ReportId;
  /** Durable instance chain this version belongs to. Equal to the root reportId of the chain. */
  readonly chainId: ReportId;
  readonly tenantId: string;
  readonly userId: string;
  readonly reportKey: string;
  readonly reportType: string;
  readonly portfolioId: string;
  readonly scenario: string | null;
  readonly parameters: Readonly<Record<string, CanonicalParameterValue>> | null;
  readonly schemaVersion: number;
  readonly artifactVersion: number;
  readonly supersedesReportId: ReportId | null;
  readonly generatedAt: string;
  readonly canonicalPayload: string;
  readonly provenance: Readonly<Record<string, unknown>>;
  readonly createdAt: string;
}

/** The content a consumer asks to be persisted. Ownership is NOT part of this shape. */
export interface ArtifactContent {
  readonly reportType: string;
  readonly portfolioId: string;
  readonly scenario?: string | null;
  readonly parameters?: Readonly<Record<string, CanonicalParameterValue>> | null;
  /** Canonical structured representation. Per R5 this is the canonical form; UI/export are projections. */
  readonly canonicalPayload: string;
  readonly provenance: Readonly<Record<string, unknown>>;
  readonly schemaVersion?: number;
  readonly generatedAt?: string;
}

export interface QueryOptions {
  readonly limit?: number;
  /** Opaque cursor: the `reportId` of the last item of the previous page. */
  readonly cursor?: ReportId;
}

export interface QueryPage {
  readonly items: ReadonlyArray<GovernedArtifact>;
  readonly nextCursor: ReportId | null;
}

/**
 * Documented test seam.
 *
 * `afterInsert` is invoked inside the transaction, after the artifact row is written and before
 * the transaction commits. It exists so that atomicity can be demonstrated by provoking a real
 * mid-transaction failure rather than by asserting against a mock. It is optional and is never
 * set on a production path.
 */
export interface StoreHooks {
  readonly afterInsert?: (reportId: ReportId) => void;
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;

interface Row {
  report_id: string;
  chain_id: string;
  tenant_id: string;
  user_id: string;
  report_key: string;
  report_type: string;
  portfolio_id: string;
  scenario: string | null;
  parameters_json: string;
  schema_version: number;
  artifact_version: number;
  supersedes_report_id: string | null;
  generated_at: string;
  canonical_payload: string;
  provenance_json: string;
  created_at: string;
}

function toArtifact(row: Row): GovernedArtifact {
  return {
    reportId: String(row.report_id),
    chainId: String(row.chain_id),
    tenantId: String(row.tenant_id),
    userId: String(row.user_id),
    reportKey: String(row.report_key),
    reportType: String(row.report_type),
    portfolioId: String(row.portfolio_id),
    scenario: row.scenario === null ? null : String(row.scenario),
    parameters: JSON.parse(String(row.parameters_json)) as Record<string, CanonicalParameterValue> | null,
    schemaVersion: Number(row.schema_version),
    artifactVersion: Number(row.artifact_version),
    supersedesReportId: row.supersedes_report_id === null ? null : String(row.supersedes_report_id),
    generatedAt: String(row.generated_at),
    canonicalPayload: String(row.canonical_payload),
    provenance: JSON.parse(String(row.provenance_json)) as Record<string, unknown>,
    createdAt: String(row.created_at),
  };
}

function requireGeneratedAt(value: string | undefined): string {
  const generatedAt = value ?? new Date().toISOString();
  if (Number.isNaN(Date.parse(generatedAt))) {
    throw new PersistenceValidationError('generatedAt must be a parseable ISO-8601 timestamp', { generatedAt });
  }
  return generatedAt;
}

function keyInputOf(content: ArtifactContent): CanonicalReportKeyInput {
  return {
    reportType: content.reportType,
    portfolioId: content.portfolioId,
    scenario: content.scenario ?? null,
    parameters: content.parameters ?? null,
  };
}

export class GovernedArtifactStore {
  private readonly hooks: StoreHooks;

  constructor(
    private readonly database: GovernedDatabase,
    hooks: StoreHooks = {},
  ) {
    this.hooks = hooks;
  }

  /** Run a mutation inside a transaction, rolling back completely on any failure. */
  private transact<T>(work: () => T): T {
    const { handle } = this.database;
    handle.exec('BEGIN');
    try {
      const result = work();
      handle.exec('COMMIT');
      return result;
    } catch (error) {
      try {
        handle.exec('ROLLBACK');
      } catch {
        // A rollback failure must not mask the original cause.
      }
      if (error instanceof PersistenceValidationError) throw error;
      if (error instanceof PersistenceNotFoundError) throw error;
      if (error instanceof PersistenceImmutableError) throw error;
      if (error instanceof PersistenceSupersessionError) throw error;
      throw new PersistenceTransactionError('transaction rolled back; no partial artifact was written', {
        cause: String(error),
      });
    }
  }

  private insertRow(
    owner: AuthenticatedOwner,
    reportId: ReportId,
    content: ArtifactContent,
    artifactVersion: number,
    chainId: ReportId,
    supersedes: ReportId | null,
  ): GovernedArtifact {
    const reportKey = deriveReportKey(keyInputOf(content));
    const generatedAt = requireGeneratedAt(content.generatedAt);
    const createdAt = new Date().toISOString();

    this.database.handle
      .prepare(
        `INSERT INTO governed_artifacts
           (report_id, chain_id, tenant_id, user_id, report_key, report_type, portfolio_id, scenario,
            parameters_json, schema_version, artifact_version, supersedes_report_id, generated_at,
            canonical_payload, provenance_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        reportId,
        chainId,
        owner.tenantId,
        owner.userId,
        reportKey,
        content.reportType,
        content.portfolioId,
        content.scenario ?? null,
        JSON.stringify(content.parameters ?? null),
        content.schemaVersion ?? CANONICAL_SCHEMA_VERSION,
        artifactVersion,
        supersedes,
        generatedAt,
        content.canonicalPayload,
        JSON.stringify(content.provenance ?? {}),
        createdAt,
      );

    this.hooks.afterInsert?.(reportId);

    return {
      reportId,
      chainId,
      tenantId: owner.tenantId,
      userId: owner.userId,
      reportKey,
      reportType: content.reportType,
      portfolioId: content.portfolioId,
      scenario: content.scenario ?? null,
      parameters: content.parameters ?? null,
      schemaVersion: content.schemaVersion ?? CANONICAL_SCHEMA_VERSION,
      artifactVersion,
      supersedesReportId: supersedes,
      generatedAt,
      canonicalPayload: content.canonicalPayload,
      provenance: content.provenance ?? {},
      createdAt,
    };
  }

  /** The highest artifact_version within one instance chain. */
  private chainHead(owner: AuthenticatedOwner, chainId: ReportId): Row | undefined {
    return this.database.handle
      .prepare(
        `SELECT * FROM governed_artifacts
          WHERE tenant_id = ? AND user_id = ? AND chain_id = ?
          ORDER BY artifact_version DESC LIMIT 1`,
      )
      .get(owner.tenantId, owner.userId, chainId) as unknown as Row | undefined;
  }

  private rowFor(owner: AuthenticatedOwner, reportId: ReportId): Row | undefined {
    return this.database.handle
      .prepare(`SELECT * FROM governed_artifacts WHERE report_id = ? AND tenant_id = ? AND user_id = ?`)
      .get(reportId, owner.tenantId, owner.userId) as unknown as Row | undefined;
  }

  /**
   * Create a new durable instance.
   *
   * The instance identifier is minted here and is independent of content: calling this twice
   * with byte-identical content yields the same reportKey and two different reportIds, each
   * starting a separate version chain at artifact_version 1.
   */
  createInstance(authenticated: unknown, content: ArtifactContent): GovernedArtifact {
    const owner = assertOwner(authenticated);
    if (typeof content?.canonicalPayload !== 'string') {
      throw new PersistenceValidationError('canonicalPayload must be a string');
    }
    deriveReportKey(keyInputOf(content)); // validate before opening a transaction
    return this.transact(() => {
      // The root of a chain is its own report_id, so the chain is addressable by instance identity.
      const reportId = mintReportId();
      return this.insertRow(owner, reportId, content, 1, reportId, null);
    });
  }

  /**
   * Append a new version, superseding the current head of the given instance chain.
   *
   * `supersedesReportId` identifies the artifact being superseded. It must be the current head of
   * its chain; superseding an already-superseded version is rejected. Version increment and
   * supersession are one coherent transactional operation, and the prior row is never modified.
   */
  appendVersion(authenticated: unknown, supersedesReportId: ReportId, content: ArtifactContent): GovernedArtifact {
    const owner = assertOwner(authenticated);
    if (typeof supersedesReportId !== 'string' || supersedesReportId.length === 0) {
      throw new PersistenceValidationError('supersedesReportId must be a non-empty string');
    }
    if (typeof content?.canonicalPayload !== 'string') {
      throw new PersistenceValidationError('canonicalPayload must be a string');
    }
    deriveReportKey(keyInputOf(content));

    return this.transact(() => {
      const parent = this.rowFor(owner, supersedesReportId);
      if (!parent) {
        throw new PersistenceNotFoundError('artifact to supersede not found for this owner', { supersedesReportId });
      }
      const chainId = String(parent.chain_id);
      const head = this.chainHead(owner, chainId);
      if (!head) {
        throw new PersistenceSupersessionError('instance chain has no head', { chainId });
      }
      if (String(head.report_id) !== supersedesReportId) {
        throw new PersistenceSupersessionError(
          'only the current head of an instance chain may be superseded',
          { expected: String(head.report_id), received: supersedesReportId },
        );
      }
      if (Number(head.artifact_version) < 1) {
        throw new PersistenceImmutableError('existing artifact has an invalid version');
      }
      return this.insertRow(owner, mintReportId(), content, Number(head.artifact_version) + 1, chainId, supersedesReportId);
    });
  }

  /**
   * Resolve one artifact by its durable instance identifier.
   *
   * `reportId` identifies a single stored artifact, not a chain: every version has its own
   * identifier. Use `listSupersededBy` to walk a chain.
   *
   * Ownership-scoped. A cross-owner request is reported as NOT_FOUND so that the existence of
   * another owner's artifact is never disclosed.
   */
  resolveById(authenticated: unknown, reportId: ReportId): GovernedArtifact {
    const owner = assertOwner(authenticated);
    if (typeof reportId !== 'string' || reportId.length === 0) {
      throw new PersistenceValidationError('reportId must be a non-empty string');
    }
    const row = this.rowFor(owner, reportId);
    if (!row) throw new PersistenceNotFoundError('artifact not found for this owner', { reportId });
    return toArtifact(row);
  }

  /**
   * List the current version of each instance chain owned by the authenticated principal.
   *
   * Scoped implicitly and mandatorily to the owner: a caller cannot widen the scope.
   */
  queryByOwner(authenticated: unknown, options: QueryOptions = {}): QueryPage {
    const owner = assertOwner(authenticated);
    const raw = options.limit ?? DEFAULT_LIMIT;
    if (!Number.isInteger(raw) || raw < 1) {
      throw new PersistenceValidationError('limit must be a positive integer', { limit: raw });
    }
    const limit = Math.min(raw, MAX_LIMIT);

    const rows = this.database.handle
      .prepare(
        `SELECT g.* FROM governed_artifacts g
          JOIN (
            SELECT chain_id, MAX(artifact_version) AS head
              FROM governed_artifacts
             WHERE tenant_id = ? AND user_id = ?
             GROUP BY chain_id
          ) h
            ON h.chain_id = g.chain_id AND h.head = g.artifact_version
          WHERE g.tenant_id = ? AND g.user_id = ?
          ORDER BY g.generated_at ASC, g.report_id ASC
          LIMIT ?`,
      )
      .all(owner.tenantId, owner.userId, owner.tenantId, owner.userId, limit + 1) as unknown as Row[];

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const items = page.map(toArtifact);
    return { items, nextCursor: hasMore ? (items[items.length - 1]?.reportId ?? null) : null };
  }

  /**
   * Walk the single-parent supersession chain ending at the current version.
   *
   * Returns the current version plus every superseded predecessor, newest first. Every version
   * remains readable and unmutated.
   */
  listSupersededBy(
    authenticated: unknown,
    reportId: ReportId,
  ): { current: GovernedArtifact; versions: ReadonlyArray<GovernedArtifact> } {
    const owner = assertOwner(authenticated);
    const current = this.resolveById(owner, reportId);

    const chain: Row[] = [];
    let cursor: string | null = current.supersedesReportId;
    const seen = new Set<string>([current.reportId]);

    while (cursor !== null) {
      if (seen.has(cursor)) {
        throw new PersistenceSupersessionError('supersession chain contains a cycle', { reportId: cursor });
      }
      seen.add(cursor);
      const row = this.rowFor(owner, cursor);
      if (!row) {
        throw new PersistenceSupersessionError('supersession chain is broken', { reportId: cursor });
      }
      chain.push(row);
      cursor = row.supersedes_report_id === null ? null : String(row.supersedes_report_id);
    }

    return { current, versions: chain.map(toArtifact) };
  }
}

export { sameOwner };
