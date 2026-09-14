/**
 * P13-B — P12 GOVERNED TRANSPORT ADAPTER
 *
 * Authority:
 *   D54 P13-B Implementation Authorization (commit dce5cdb4)
 *   D53 P13-B A3 Acceptor Designation (Sai) — gate acceptance only
 *   P12 C6/C7 certified within P12 API/DTO Gate scope (PHASE_12_CERTIFICATION_DECISION.md)
 *
 * Purpose (P13-B-01):
 *   Bind the certified P12 contract modules to HTTP as ADDITIVE endpoints. This module
 *   is a TRANSPORT ADAPTER ONLY: it performs no screening, no resolution, no scoring and
 *   no quality arithmetic of its own. Every governed decision is delegated to the
 *   certified P12 modules under `p12/src/`.
 *
 * Work items bound here:
 *   P13-B-01  transport adapter (handleApiRequest / buildApiResponse / assertAdditiveEndpoint
 *             / buildPaginatedResponse)
 *   P13-B-02  server-side tenant/security enforcement (enforceTenantScoping,
 *             assertTenantAuthorized, applyClassification, sanitizeForTransport,
 *             checkProviderEntitlement, assertNoSecurityCertificationClaimed)
 *   P13-B-03  derived provenance DTO pipeline (buildDataProvenance / provenanceFromSnapshot /
 *             assertProvenanceValid)
 *   P13-B-04  quality/degradation propagation (worstQuality, worstCompleteness,
 *             aggregateProvenance, assertQualityTransition, buildAbsentQualityProvenance,
 *             attachProvenance)
 *   P13-B-05  screener → C6 (executeScreen / saveScreenDefinition / applyFilter /
 *             evaluateFilters / deterministicSort / classifyRowDegradation)
 *   P13-B-06  search + object resolution → C7 (buildResolutionRequest / resolveObject /
 *             executeSearch / buildObjectReference)
 *   P13-B-07  evidence/replay linkage (buildEvidenceLinkage / buildReplayLinkage /
 *             assertAd17ConstraintPreserved)
 *   P13-B-08  dual-transport lineage disclosure
 *   P13-B-09  derived as-of exposure
 *
 * Boundaries (hard — per D54 §5):
 *   ⚠ ADDITIVE ONLY. This module registers NEW paths. The 13 existing v2.0 routes are
 *     not read, not wrapped and not modified by this file.
 *   ⚠ NO `iips-platform` import. This adapter never reaches into the certified platform;
 *     the v2.0 universe is passed in by the caller as already-computed governed rows.
 *   ⚠ AD-17/M-2 PRESERVED. Replay linkage is produced by P12 `buildReplayLinkage`, which
 *     hardcodes `verifiedReproduction: false` / `verifiedByteIdentical: false`, and is
 *     re-checked here by `assertAd17ConstraintPreserved` before transport. This adapter
 *     MUST NOT assert verified replay or verified byte identity.
 *   ⚠ NO FABRICATED PROVENANCE. Provenance is DERIVED from the governed payload the
 *     caller supplies. There is no synthesized U1 provenance anywhere in this file.
 *   ⚠ NO CERTIFICATION. Binding C6/C7 to transport does not broaden C6/C7 certification
 *     scope and does not certify UI05 or any other surface.
 *   ⚠ Tenant scoping is SERVER-ENFORCED and FAIL-CLOSED. No client-supplied tenant is
 *     trusted as an authorization decision.
 */

// --- Certified P12 contract modules (C6/C7 within P12 API/DTO Gate scope) ---
// @ts-expect-error — P12 is certified JavaScript; imported without modification (ER-3/ED-1).
import * as endpointDelta from '../../p12/src/endpointDelta.js';
// @ts-expect-error — certified JS module.
import * as screenerContract from '../../p12/src/screenerContract.js';
// @ts-expect-error — certified JS module.
import * as objectResolution from '../../p12/src/objectResolutionContract.js';
// @ts-expect-error — certified JS module.
import * as provenanceDto from '../../p12/src/dataProvenanceDto.js';
// @ts-expect-error — certified JS module.
import * as qualityPropagation from '../../p12/src/qualityPropagation.js';
// @ts-expect-error — certified JS module.
import * as security from '../../p12/src/securityTenantBoundaries.js';
// @ts-expect-error — certified JS module.
import * as evidenceLinkage from '../../p12/src/evidenceReplayLinkage.js';

/* ------------------------------------------------------------------------- *
 * P13-B-08 — DUAL-TRANSPORT LINEAGE DISCLOSURE
 * ------------------------------------------------------------------------- */

/**
 * Lineage of a served payload. This is DISCLOSURE, not inference: a payload is only
 * ever labelled `P12-GOVERNED` when it was actually produced by a certified P12 module
 * in this process. Structural similarity to P12 output is never sufficient.
 */
export type TransportLineage = 'P12-GOVERNED' | 'V2.0-CERTIFIED' | 'DUAL';

/** P13-B-08 — the explicit dual-transport disclosure carried on every P12 response. */
export const TRANSPORT_DISCLOSURE = Object.freeze({
  dualTransport: true,
  statement:
    'This deployment operates TWO distinct governed transports. P12-GOVERNED payloads are ' +
    'produced by the certified P12 API/DTO Gate contracts. V2.0-CERTIFIED payloads are produced ' +
    'by the existing certified v2.0 platform transport. The two are NOT interchangeable and ' +
    'lineage is never inferred from structural similarity.',
  p12Scope: 'P12 API/DTO Gate scope only (C6 screener contract, C7 object-resolution contract).',
  v2Scope: 'The 13 pre-existing certified v2.0 read routes — unchanged by P13-B.',
  certificationNote:
    'Transport binding does NOT broaden C6/C7 certification scope and does NOT certify any UI surface.',
});

/** Governance limitations restated on every P12 response — no claim is implied by exposure. */
export const P12_TRANSPORT_LIMITATIONS = Object.freeze({
  ad17: evidenceLinkage.AD17_CONSTRAINT,
  security: security.SECURITY_LIMITATION,
  ui05Certified: false,
  uiSurfaceCertified: false,
  productionAuthorized: false,
});

/* ------------------------------------------------------------------------- *
 * P13-B-02 — TENANT / SECURITY ENFORCEMENT (server-side, fail-closed)
 * ------------------------------------------------------------------------- */

/** Thrown when the request is refused before any data is produced (fail-closed). */
export class P12TransportError extends Error {
  constructor(readonly status: number, message: string, readonly rules: readonly string[] = []) {
    super(message);
    this.name = 'P12TransportError';
  }
}

/**
 * P13-B-02 — Resolve the server-enforced tenant for a request.
 *
 * ST-1: the tenant is an authenticated server-side fact. A client-supplied tenant header
 * is accepted ONLY as an assertion to be checked against the authenticated principal; it
 * can never widen access. Absent an authenticated tenant the request FAILS CLOSED.
 */
export function resolveTenant(principalTenantId: string | null | undefined, requestedTenantId?: string | null): string {
  if (typeof principalTenantId !== 'string' || principalTenantId.length === 0) {
    throw new P12TransportError(401, 'tenant unresolved — fail-closed; no data exposure', ['ST-1']);
  }
  if (typeof requestedTenantId === 'string' && requestedTenantId.length > 0) {
    // Delegate the comparison to the certified module rather than re-implementing it.
    const access = security.enforceTenantScoping({
      requestingTenantId: requestedTenantId,
      dataTenantId: principalTenantId,
      endpoint: 'tenant-assertion',
    });
    try {
      security.assertTenantAuthorized(access);
    } catch (e) {
      throw new P12TransportError(403, (e as Error).message, ['ST-1']);
    }
  }
  return principalTenantId;
}

/** P13-B-02 — Assert the requesting tenant may read data owned by `dataTenantId`. */
export function assertTenantMayRead(requestingTenantId: string, dataTenantId: string, endpoint: string): void {
  const access = security.enforceTenantScoping({ requestingTenantId, dataTenantId, endpoint });
  try {
    security.assertTenantAuthorized(access);
  } catch (e) {
    throw new P12TransportError(403, (e as Error).message, ['ST-1']);
  }
}

/* ------------------------------------------------------------------------- *
 * P13-B-03 / P13-B-04 / P13-B-09 — DERIVED PROVENANCE + QUALITY
 * ------------------------------------------------------------------------- */

/** A governed row as supplied by the caller. Quality/as-of are the row's own governed facts. */
export interface GovernedRow {
  readonly [field: string]: unknown;
}

/**
 * P13-B-03/P13-B-09 — DERIVE provenance for a P12 response.
 *
 * The provenance is derived from the governed source payload actually used. Nothing is
 * invented: `asOf`, `quality` and `completenessPct` are taken from the source, and the
 * classification is supplied by the caller from the source's own governance classification.
 */
export function deriveProvenance(args: {
  dataSource: string;
  asOf: string;
  receivedAt?: string;
  dataVersion: string;
  mode: string;
  quality: string;
  completenessPct: number;
  contributingSnapshotIds?: readonly string[];
  classification: string;
  freshness?: string;
  transportSemantics?: string;
}): Readonly<Record<string, unknown>> {
  return provenanceDto.buildDataProvenance({
    dataSource: args.dataSource,
    freshness: args.freshness ?? (args.mode === 'LIVE' ? 'LIVE' : 'SNAPSHOT'),
    calibratedAt: args.asOf,
    transportSemantics: args.transportSemantics ?? 'p12-governed-transport',
    asOf: args.asOf,
    receivedAt: args.receivedAt ?? args.asOf,
    dataVersion: args.dataVersion,
    mode: args.mode,
    quality: args.quality,
    completenessPct: args.completenessPct,
    contributingSnapshotIds: [...(args.contributingSnapshotIds ?? [])],
    classification: args.classification,
  });
}

/**
 * P13-B-04 — Propagate quality across contributing rows using WORST-CASE aggregation.
 *
 * Delegates to the certified P12 `worstQuality` / `worstCompleteness`. A response can
 * never be better than its worst contributing row. Rows with no quality are treated as
 * `unavailable` via the certified absent-quality path, never silently upgraded.
 */
export function propagateRowQuality(rows: readonly GovernedRow[]): { quality: string; completenessPct: number } {
  if (rows.length === 0) {
    // No rows contributed — the certified absent-quality provenance path applies.
    return { quality: 'unavailable', completenessPct: 0 };
  }
  const qualities = rows.map((r) => (typeof r.quality === 'string' ? r.quality : 'unavailable'));
  const completenesses = rows.map((r) => (typeof r.completenessPct === 'number' ? r.completenessPct : 0));
  return {
    quality: qualityPropagation.worstQuality(qualities),
    completenessPct: qualityPropagation.worstCompleteness(completenesses),
  };
}

/** P13-B-04 — Aggregate several governed provenances into one (worst-case, certified). */
export function aggregateGovernedProvenance(
  provenances: readonly Readonly<Record<string, unknown>>[],
  dataSource: string,
  classification: string,
): Readonly<Record<string, unknown>> {
  return qualityPropagation.aggregateProvenance({ provenances: [...provenances], dataSource, classification });
}

/* ------------------------------------------------------------------------- *
 * P13-B-01 — RESPONSE ENVELOPE
 * ------------------------------------------------------------------------- */

/**
 * P13-B-01/P13-B-08 — Build the governed P12 response envelope.
 *
 * Wraps the certified `buildApiResponse` envelope and adds the explicit lineage
 * disclosure. Provenance is validated before transport (fail-closed on invalid).
 */
export function buildP12Response(args: {
  data: unknown;
  provenance: Readonly<Record<string, unknown>>;
  tenantId: string;
  endpoint: string;
  lineage?: TransportLineage;
}): Readonly<Record<string, unknown>> {
  provenanceDto.assertProvenanceValid(args.provenance);

  const envelope = endpointDelta.buildApiResponse({
    data: args.data,
    provenance: args.provenance,
    tenantId: args.tenantId,
    endpoint: args.endpoint,
  });

  return Object.freeze({
    ...envelope,
    // P13-B-08 — explicit, non-inferred lineage disclosure.
    lineage: args.lineage ?? 'P12-GOVERNED',
    transportDisclosure: TRANSPORT_DISCLOSURE,
    governanceLimitations: P12_TRANSPORT_LIMITATIONS,
  });
}

/** P13-B-01 — Paginated variant, delegating to the certified pagination builder. */
export function buildP12PaginatedResponse(args: {
  items: readonly unknown[];
  totalCount: number;
  offset: number;
  limit: number;
  provenance: Readonly<Record<string, unknown>>;
  tenantId: string;
  endpoint: string;
  lineage?: TransportLineage;
}): Readonly<Record<string, unknown>> {
  provenanceDto.assertProvenanceValid(args.provenance);

  const envelope = endpointDelta.buildPaginatedResponse({
    items: [...args.items],
    totalCount: args.totalCount,
    offset: args.offset,
    limit: args.limit,
    provenance: args.provenance,
    tenantId: args.tenantId,
    endpoint: args.endpoint,
  });

  return Object.freeze({
    ...envelope,
    lineage: args.lineage ?? 'P12-GOVERNED',
    transportDisclosure: TRANSPORT_DISCLOSURE,
    governanceLimitations: P12_TRANSPORT_LIMITATIONS,
  });
}

/* ------------------------------------------------------------------------- *
 * P13-B-05 — SCREENER → C6
 * ------------------------------------------------------------------------- */

/**
 * P13-B-05 — Execute a governed screen through the certified C6 contract.
 *
 * The transport performs NO filtering, NO sorting and NO degradation classification of
 * its own — all three are delegated to `executeScreen`, which enforces the closed
 * operator set, the deterministic total order with tie-break, and row degradation labels.
 */
export function executeGovernedScreen(args: {
  universe: readonly GovernedRow[];
  filters: readonly unknown[];
  sort: readonly unknown[];
  tieBreakField: string;
  asOf: string;
  screenId: string;
  tenantId: string;
}): Readonly<Record<string, unknown>> {
  try {
    return screenerContract.executeScreen({
      universe: [...args.universe],
      filters: [...args.filters],
      sort: [...args.sort],
      tieBreakField: args.tieBreakField,
      asOf: args.asOf,
      screenId: args.screenId,
      tenantId: args.tenantId,
    });
  } catch (e) {
    // C6 violations are CONTRACT failures — surfaced as 400, never silently coerced.
    throw new P12TransportError(400, (e as Error).message, ['C6']);
  }
}

/** P13-B-05 — Persist-free saved-screen definition, validated by the certified contract. */
export function saveGovernedScreenDefinition(args: Record<string, unknown>): Readonly<Record<string, unknown>> {
  try {
    return screenerContract.saveScreenDefinition(args);
  } catch (e) {
    throw new P12TransportError(400, (e as Error).message, ['C6']);
  }
}

/* ------------------------------------------------------------------------- *
 * P13-B-06 — SEARCH / OBJECT RESOLUTION → C7
 * ------------------------------------------------------------------------- */

/**
 * P13-B-06 — Resolve an object through the certified C7 contract.
 *
 * OR-2 fail-closed: an unresolved identity raises rather than returning a placeholder.
 * The transport maps that to 404 and NEVER synthesizes a result.
 */
export function resolveGovernedObject(args: {
  inputType: string;
  inputValue: string;
  asOf: string;
  tenantId: string;
  securities: readonly GovernedRow[];
  register?: Record<string, unknown>;
}): Readonly<Record<string, unknown>> {
  let request: unknown;
  try {
    request = objectResolution.buildResolutionRequest({
      inputType: args.inputType,
      inputValue: args.inputValue,
      asOf: args.asOf,
      tenantId: args.tenantId,
    });
  } catch (e) {
    throw new P12TransportError(400, (e as Error).message, ['C7', 'OR-1']);
  }

  try {
    return objectResolution.resolveObject({
      request,
      securities: [...args.securities],
      register: args.register,
    });
  } catch (e) {
    // OR-2: fail-closed — no coercion, no placeholder, no synthesized result.
    throw new P12TransportError(404, (e as Error).message, ['C7', 'OR-2']);
  }
}

/** P13-B-06 — Deterministic governed search through the certified C7 contract. */
export function executeGovernedSearch(args: {
  universe: readonly GovernedRow[];
  query: string;
  objectTypes?: readonly string[];
  asOf: string;
  tenantId: string;
  maxResults?: number;
}): Readonly<Record<string, unknown>> {
  try {
    return objectResolution.executeSearch({
      universe: [...args.universe],
      query: args.query,
      ...(args.objectTypes ? { objectTypes: [...args.objectTypes] } : {}),
      asOf: args.asOf,
      tenantId: args.tenantId,
      ...(typeof args.maxResults === 'number' ? { maxResults: args.maxResults } : {}),
    });
  } catch (e) {
    throw new P12TransportError(400, (e as Error).message, ['C7', 'OR-7']);
  }
}

/**
 * P13-B-06 — Build a governed object reference via the certified contract.
 * Note: the certified `buildObjectReference` takes POSITIONAL arguments.
 */
export function buildGovernedObjectReference(
  objectType: string,
  objectId: string,
  asOf: string,
): Readonly<Record<string, unknown>> {
  try {
    return objectResolution.buildObjectReference(objectType, objectId, asOf);
  } catch (e) {
    throw new P12TransportError(400, (e as Error).message, ['C7', 'OR-1']);
  }
}

/* ------------------------------------------------------------------------- *
 * P13-B-07 — EVIDENCE / REPLAY LINKAGE (AD-17 FIREWALL)
 * ------------------------------------------------------------------------- */

/** P13-B-07 — Evidence lineage DTO via the certified contract (additive; P11 untouched). */
export function buildGovernedEvidenceLinkage(args: Record<string, unknown>): Readonly<Record<string, unknown>> {
  try {
    return evidenceLinkage.buildEvidenceLinkage(args);
  } catch (e) {
    throw new P12TransportError(400, (e as Error).message, ['ER-7']);
  }
}

/**
 * P13-B-07 — Replay linkage DTO with the AD-17 guard applied AT THE TRANSPORT BOUNDARY.
 *
 * ⚠ AD-17/M-2 FIREWALL. `ReplayService` returns `reproduced`/`byteIdentical` as LITERALS.
 * They are carried under `replayServiceLiterals` and are explicitly NOT verified claims.
 * `assertAd17ConstraintPreserved` is invoked on every DTO before it can leave this
 * process; if any caller ever sets a verified flag, the request fails rather than
 * emitting an unsupported reproduction claim. This PRESERVES AD-17 — it does not repair it.
 */
export function buildGovernedReplayLinkage(args: {
  replayId: string;
  originalExecutionId: string;
  contributingSnapshotIds: readonly string[];
  dataVersion: string;
  asOf: string;
  mode: string;
  replayServiceReproduced?: boolean | null;
  replayServiceByteIdentical?: boolean | null;
}): Readonly<Record<string, unknown>> {
  let dto: Record<string, unknown>;
  try {
    dto = evidenceLinkage.buildReplayLinkage({
      replayId: args.replayId,
      originalExecutionId: args.originalExecutionId,
      contributingSnapshotIds: [...args.contributingSnapshotIds],
      dataVersion: args.dataVersion,
      asOf: args.asOf,
      mode: args.mode,
      replayServiceReproduced: args.replayServiceReproduced ?? null,
      replayServiceByteIdentical: args.replayServiceByteIdentical ?? null,
    });
  } catch (e) {
    throw new P12TransportError(400, (e as Error).message, ['ER-7']);
  }

  // ER-1 guard — MUST hold before transport. Fail-closed on any verified-replay claim.
  evidenceLinkage.assertAd17ConstraintPreserved(dto);
  return dto;
}

/* ------------------------------------------------------------------------- *
 * P13-B-01 — ADDITIVE ENDPOINT REGISTRATION
 * ------------------------------------------------------------------------- */

/** The P12 endpoints bound by P13-B. A strict SUBSET of the certified P12_ENDPOINTS. */
export const P13B_BOUND_ENDPOINTS = Object.freeze([
  endpointDelta.P12_ENDPOINTS.SCREENER_EXECUTE,
  endpointDelta.P12_ENDPOINTS.SCREENER_SAVED,
  endpointDelta.P12_ENDPOINTS.RESOLVE,
  endpointDelta.P12_ENDPOINTS.SEARCH,
] as string[]);

/**
 * P13-B-01 — ED-1 additive guard.
 *
 * Every endpoint this adapter binds is checked against the certified
 * `assertAdditiveEndpoint`, which refuses any path that collides with a preserved v2.0
 * endpoint. Called at module init so a violation fails fast rather than at request time.
 */
export function assertAllBoundEndpointsAdditive(): true {
  for (const ep of P13B_BOUND_ENDPOINTS) {
    endpointDelta.assertAdditiveEndpoint(ep);
  }
  // ST-5/ST-6: no security certification is claimed by exposing these endpoints.
  security.assertNoSecurityCertificationClaimed();
  return true;
}

/** Map a URL path to a P12 surface name, or null when it is not a P12 path. */
export function p12SurfaceFor(url: string | undefined): string | null {
  if (!url) return null;
  const path = url.split('?')[0];
  if (path === '/api/screener/execute') return 'screener';
  if (path === '/api/screener/saved') return 'screener';
  if (path === '/api/resolve') return 'resolve';
  if (path === '/api/search') return 'search';
  return null;
}

/** True when the path belongs to the additive P12 surface (never a v2.0 route). */
export function isP12Path(url: string | undefined): boolean {
  return p12SurfaceFor(url) !== null;
}

/* ------------------------------------------------------------------------- *
 * REQUEST CONTEXT
 * ------------------------------------------------------------------------- */

/** P13-B-01 — Build the governed request context via the certified `handleApiRequest`. */
export function buildRequestContext(args: {
  tenantId: string;
  endpoint: string;
  body?: Record<string, unknown>;
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
}): Readonly<Record<string, unknown>> {
  try {
    return endpointDelta.handleApiRequest({
      tenantId: args.tenantId,
      endpoint: args.endpoint,
      body: args.body ?? {},
      params: args.params ?? {},
      query: args.query ?? {},
    });
  } catch (e) {
    throw new P12TransportError(400, (e as Error).message, ['ED-4']);
  }
}

/** P13-B-02 — Apply governance classification + transport sanitization before emission. */
export function sanitizeGoverned(dto: Record<string, unknown>, classification: string): Readonly<Record<string, unknown>> {
  const classified = security.applyClassification(dto, classification);
  return security.sanitizeForTransport(classified);
}

/** P13-B-02 — Provider entitlement check (server-side, behind the data plane). */
export function checkGovernedProviderEntitlement(args: {
  providerToken: string;
  capability: string;
  entitlementRegister: Record<string, unknown>;
}): Readonly<Record<string, unknown>> {
  return security.checkProviderEntitlement(args);
}

// ED-1 fail-fast: verify additivity at module load.
assertAllBoundEndpointsAdditive();
