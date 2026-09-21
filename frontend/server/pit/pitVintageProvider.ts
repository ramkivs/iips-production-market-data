/**
 * D-PIT-WIRE-01 — PIT VINTAGE PROVIDER (transport-side retrieval point).
 *
 * Authority: **D-PIT-WIRE-01 = AUTHORIZED** over the governing scope
 * `docs/PIT_TRANSPORT_WIRING_SCOPE_PREPARATION.md` @ `79d05d7`.
 *
 * The provider is the FIRST transport consumer of the frozen P08 PIT capability. It owns ONE
 * authoritative `createPitStore()` instance, loads a GOVERNED BOUNDED corpus through the D114
 * admission bridge, and exposes strict PS-9 retrieval (`resolved asOf <= requested asOf`).
 *
 * PHYSICAL D114 MODE (`corpusKind: D114_ARCHIVE`):
 *   • validates BOTH deposited six-file evidence packages through the frozen
 *     `HistoricalEvidenceHandoff.validateAndLoadEvidencePackage()` intake contract;
 *   • reads selected archives in-place from the TWO separate configured archive roots (never
 *     merges or modifies them), verifies each archive against the D114 SHA-256 manifest, then
 *     extracts through the frozen D114 archive extractor and normalizes through the governed
 *     dual-era adapter (including the authorized ISIN/SERIES identity correction);
 *   • carries acquisition-manifest + SHA-entry + handoff-lineage provenance into every vintage;
 *   • derives non-trading/failure dates from the evidence manifests and refuses them.
 *
 * FIXTURE MODE (`corpusKind: FIXTURE_CSV`) is an explicit repository-test path only. It hashes
 * fixture CSVs, admits both eras through the same governed adapter/bridge/frozen-store path, and can
 * declare synthetic unavailable dates. Fixture success is NOT actual NSE verification.
 *
 * FAIL-CLOSED: unconfigured, rejected evidence, sha mismatch, archive/admission error, empty
 * store, date outside corpus, date absent from the bounded corpus, known HTTP_404/weekend/
 * holiday, PS-E9/PS-11 ambiguity, provenance failure, no vintage <= asOf, or store error all
 * return null → the existing byte-identical PIT_UNAVAILABLE response. No SNAPSHOT/LIVE/replay
 * substitution. IN_MEMORY_ONLY; no persistence, network, credentials, or archive writes.
 */
import * as nodeCrypto from 'node:crypto';
import * as nodeFs from 'node:fs';
import * as nodePath from 'node:path';
import { HistoricalEvidenceHandoff } from '../../../d114/src/d114/evidence_handoff.js';
import { CmUdiffParser } from '../../../d114/src/d114/cm_udiff_parser.js';
import type {
  CompleteEvidencePackage,
  DetailedDateAssessment,
  Sha256ManifestEntry,
} from '../../../d114/src/d114/historical_feasibility_runner.js';
import { createPitStore } from './p08PitStore';
import type { PitSnapshot, PitStore } from './pitStorageModel';
import {
  buildCorpusSnapshots,
  BRIDGE_IDENTITY,
  ERA_WINDOWS,
  type D114CorpusDescriptor,
  type D114CorpusEntry,
  type D114Era,
} from './d114AdmissionBridge';

/** Result of a PIT retrieval: the resolved vintage, or null (fail-closed → PIT_UNAVAILABLE). */
export interface PitQueryResult {
  readonly found: true;
  /** The instant the request asked for (echoed verbatim). */
  readonly requestedAsOf: string;
  /** The RESOLVED vintage instant — satisfies `resolvedAsOf <= requestedAsOf` (PS-9). */
  readonly resolvedAsOf: string;
  /** The stored canonical snapshot, VERBATIM (deep-frozen by the store at admission). */
  readonly snapshot: PitSnapshot;
}

export type PitCorpusKind = 'FIXTURE_CSV' | 'D114_ARCHIVE';

export interface PitCorpusInfo {
  readonly loaded: boolean;
  readonly corpusId: string | null;
  readonly corpusKind: PitCorpusKind | null;
  readonly snapshots: number;
  readonly loadedDates: number;
  readonly unavailableDates: number;
  readonly coverageStart: string | null;
  readonly coverageEnd: string | null;
  readonly evidenceValidated: boolean;
}

export interface PitVintageProvider {
  /** Strict PS-9 retrieval at the transport boundary; null on every governed refusal. */
  query(domain: string, securityId: string, asOf: string): PitQueryResult | null;
  /** Whether a fully admitted non-empty corpus is available to serve. */
  isBound(): boolean;
  /** Deterministic corpus facts for evidence/logging (never exposes mutable policy state). */
  corpusInfo(): PitCorpusInfo;
  /** The underlying frozen store (test/evidence access only). */
  readonly store: PitStore;
}

export interface CreatePitProviderOptions {
  /** Inject a store (tests); default `createPitStore()` — the frozen P08 factory. */
  readonly store?: PitStore;
}

interface UnavailableDate {
  readonly date: string;
  readonly status: string;
  readonly evidenceRef: string;
}

type SecurityAliasIndex = ReadonlyMap<string, readonly string[]>;

interface QueryPolicy {
  readonly corpusId: string;
  readonly corpusKind: PitCorpusKind;
  readonly coverageStart: string;
  readonly coverageEnd: string;
  readonly loadedDates: ReadonlySet<string>;
  readonly unavailableDates: ReadonlyMap<string, UnavailableDate>;
  /** Candidate source-security keys for company/symbol/ISIN/series-qualified queries. */
  readonly securityAliases: SecurityAliasIndex;
  /** Same candidate relation scoped to the requested trading date (P04 1:N stays explicit). */
  readonly datedSecurityAliases: SecurityAliasIndex;
  readonly enforceLoadedDates: boolean;
  readonly requireProvenance: boolean;
  readonly evidenceValidated: boolean;
}

/** Loader-side policy registry (kept off the public provider/store interface). */
const policies = new WeakMap<object, QueryPolicy | null>();

const aliasKey = (domain: string, alias: string): string => JSON.stringify([domain, alias]);
const datedAliasKey = (date: string, domain: string, alias: string): string =>
  JSON.stringify([date, domain, alias]);

function freezeAliasIndex(source: Map<string, Set<string>>): SecurityAliasIndex {
  const frozen = new Map<string, readonly string[]>();
  for (const [key, candidates] of source) {
    frozen.set(key, Object.freeze([...candidates].sort()));
  }
  return frozen;
}

/**
 * Build a SET-valued company/symbol query relation from already-admitted canonical records.
 *
 * This is deliberately not a P04 canonical-security mapping: D114's ISIN remains explicitly
 * non-authoritative. A company/symbol may point to 0..N source securities; only a singleton may
 * be queried as one D02 series. Multi-series aliases (for example M&MFIN) fail closed rather than
 * selecting EQ, the first row, or any other heuristic. Raw ISIN, the typed source key, and
 * SYMBOL:SERIES remain deterministic direct aliases.
 */
function buildSecurityAliasIndexes(snapshots: readonly PitSnapshot[]): {
  securityAliases: SecurityAliasIndex;
  datedSecurityAliases: SecurityAliasIndex;
} {
  const aliases = new Map<string, Set<string>>();
  const datedAliases = new Map<string, Set<string>>();

  const register = (map: Map<string, Set<string>>, key: string, securityId: string): void => {
    const existing = map.get(key);
    if (existing !== undefined) existing.add(securityId);
    else map.set(key, new Set([securityId]));
  };

  for (const snapshot of snapshots) {
    const securityId = snapshot.securityId;
    if (typeof securityId !== 'string' || securityId.length === 0) continue;
    const payload = snapshot.payload;
    if (payload === null || typeof payload !== 'object') continue;
    const record = payload as {
      companyId?: unknown;
      symbol?: unknown;
      securityIdentity?: {
        securityId?: unknown;
        isin?: unknown;
        series?: unknown;
      };
    };
    if (record.securityIdentity?.securityId !== securityId) continue;

    const companyId = typeof record.companyId === 'string' ? record.companyId : undefined;
    const symbol = typeof record.symbol === 'string' ? record.symbol : undefined;
    const isin = typeof record.securityIdentity.isin === 'string'
      ? record.securityIdentity.isin
      : undefined;
    const series = typeof record.securityIdentity.series === 'string'
      ? record.securityIdentity.series
      : undefined;
    const queryAliases = new Set<string>([
      securityId,
      ...(companyId ? [companyId] : []),
      ...(symbol ? [symbol] : []),
      ...(isin ? [isin] : []),
      ...(symbol && series ? [`${symbol}:${series}`] : []),
    ]);
    const date = snapshot.asOf.slice(0, 10);
    for (const alias of queryAliases) {
      register(aliases, aliasKey(snapshot.domain, alias), securityId);
      register(datedAliases, datedAliasKey(date, snapshot.domain, alias), securityId);
    }
  }

  return {
    securityAliases: freezeAliasIndex(aliases),
    datedSecurityAliases: freezeAliasIndex(datedAliases),
  };
}

function resolveQuerySecurityId(
  policy: QueryPolicy,
  domain: string,
  requestedSecurityId: string,
  requestedDate: string,
): string | null {
  const datedCandidates = policy.datedSecurityAliases.get(
    datedAliasKey(requestedDate, domain, requestedSecurityId),
  );
  const candidates = datedCandidates ?? policy.securityAliases.get(
    aliasKey(domain, requestedSecurityId),
  );
  if (candidates === undefined) return requestedSecurityId;
  return candidates.length === 1 ? candidates[0]! : null;
}

function isCompleteProvenance(snapshot: PitSnapshot): boolean {
  const hp = snapshot.historicalProvenance;
  if (hp === null || typeof hp !== 'object') return false;
  const p = hp as Record<string, unknown>;
  return (
    (p.era === 'LEGACY_BHAVCOPY' || p.era === 'CM_UDIFF') &&
    typeof p.archiveRef === 'string' && p.archiveRef.length > 0 &&
    typeof p.sha256 === 'string' && SHA256_HEX.test(p.sha256) &&
    typeof p.corpusId === 'string' && p.corpusId.length > 0
  );
}

/** Create an UNLOADED provider. Binding happens only through a successful corpus load. */
export function createPitVintageProvider(options: CreatePitProviderOptions = {}): PitVintageProvider {
  const store: PitStore = options.store ?? createPitStore();
  const provider: PitVintageProvider = {
    store,
    query(domain: string, securityId: string, asOf: string): PitQueryResult | null {
      const policy = policies.get(provider) ?? null;
      if (policy === null) return null; // unloaded → fail-closed
      const requestedDate = asOf.slice(0, 10);
      // Bounded-corpus and D114 gap rules OVERRIDE ordinary backward resolution. PS-9 still
      // selects a vintage within an admitted date and guarantees no future value is observed.
      if (requestedDate < policy.coverageStart || requestedDate > policy.coverageEnd) return null;
      if (policy.unavailableDates.has(requestedDate)) return null;
      if (policy.enforceLoadedDates && !policy.loadedDates.has(requestedDate)) return null;

      const resolvedSecurityId = resolveQuerySecurityId(policy, domain, securityId, requestedDate);
      if (resolvedSecurityId === null) return null; // 1:N company/symbol alias → explicit ambiguity

      try {
        // PS-11 — detection only. Any finding is refused; never ranked or resolved here.
        if (store.detectVintageAmbiguity(domain, resolvedSecurityId).length > 0) return null;
        const snap = store.asOfQuery(domain, resolvedSecurityId, asOf);
        if (snap === null || snap === undefined) return null;
        // Belt-and-braces: preserve the frozen PS-9 contract at the transport boundary.
        if (!(snap.asOf <= asOf)) return null;
        if (policy.requireProvenance && !isCompleteProvenance(snap)) return null;
        return Object.freeze({
          found: true as const,
          requestedAsOf: asOf,
          resolvedAsOf: snap.asOf,
          snapshot: snap,
        });
      } catch {
        return null; // ambiguity/store/provenance error → PIT_UNAVAILABLE, never a substitute
      }
    },
    isBound(): boolean {
      return policies.get(provider) !== null && policies.get(provider) !== undefined && store.size() > 0;
    },
    corpusInfo(): PitCorpusInfo {
      const p = policies.get(provider) ?? null;
      return Object.freeze({
        loaded: p !== null,
        corpusId: p?.corpusId ?? null,
        corpusKind: p?.corpusKind ?? null,
        snapshots: store.size(),
        loadedDates: p?.loadedDates.size ?? 0,
        unavailableDates: p?.unavailableDates.size ?? 0,
        coverageStart: p?.coverageStart ?? null,
        coverageEnd: p?.coverageEnd ?? null,
        evidenceValidated: p?.evidenceValidated ?? false,
      });
    },
  };
  policies.set(provider, null);
  return Object.freeze(provider);
}

/**
 * TEST-ONLY binding for an injected/manual P08 store. Production/fixture corpus loading MUST use
 * `loadCorpusIntoProvider`, which enforces bounds, provenance and date admission. This helper
 * deliberately leaves loaded-date enforcement/provenance off so T2 can isolate frozen PS-9.
 */
export function bindProviderCorpus(provider: PitVintageProvider, corpusId: string): void {
  policies.set(provider, Object.freeze({
    corpusId,
    corpusKind: 'FIXTURE_CSV' as const,
    coverageStart: '0000-01-01',
    coverageEnd: '9999-12-31',
    loadedDates: new Set<string>(),
    unavailableDates: new Map<string, UnavailableDate>(),
    securityAliases: new Map<string, readonly string[]>(),
    datedSecurityAliases: new Map<string, readonly string[]>(),
    enforceLoadedDates: false,
    requireProvenance: false,
    evidenceValidated: false,
  }));
}

// ─── Corpus manifest + governed handoff loading ─────────────────────────────────────────────

export interface PitCorpusManifest {
  readonly corpusId: string;
  readonly corpusKind?: PitCorpusKind;
  readonly provider: string;
  readonly dataVersion: string;
  /** Explicit query bounds for fixtures; physical D114 bounds are fixed by ERA_WINDOWS. */
  readonly coverage?: { readonly start: string; readonly end: string };
  /** Fixture-only synthetic gaps used to prove fail-closed behavior. */
  readonly unavailableDates?: readonly {
    readonly date: string;
    readonly status: string;
    readonly evidenceRef: string;
  }[];
  /** Physical mode: the two archive roots remain separate and are read in-place. */
  readonly archiveRoots?: Partial<Record<D114Era, string>>;
  /** Physical mode: one governed six-file evidence intake directory per era. */
  readonly evidenceIntakes?: readonly { readonly era: D114Era; readonly directory: string }[];
  readonly entries: readonly {
    /** Bare filename only. Physical mode resolves it under archiveRoots[era]. */
    readonly file: string;
    readonly era: D114Era;
    /** Fixture defaults CSV; physical D114 entries MUST be ZIP. */
    readonly source?: 'CSV' | 'ZIP';
    /** REQUIRED in physical mode; ties archive → SHA manifest → canonical record day. */
    readonly tradeDate?: string;
    /** Fixture hash or optional redundant physical archive hash (must match D114 evidence). */
    readonly sha256?: string;
    readonly archiveRef?: string;
  }[];
}

export interface CorpusLoadResult {
  readonly ok: boolean;
  readonly snapshotsAppended: number;
  readonly corpusId: string | null;
  readonly errors: readonly string[];
}

const SHA256_HEX = /^[0-9a-f]{64}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const PROVIDER_PATTERN = /^[A-Za-z0-9_]+$/;
const DATA_VERSION_PATTERN = /^[A-Za-z0-9_.\-]+$/;

export interface LoadCorpusOptions {
  /** Bounded-corpus discipline: refuse corpora beyond this many snapshots. */
  readonly maxRecords?: number;
  readonly readText?: (absolutePath: string) => string;
  readonly readBuffer?: (absolutePath: string) => Buffer;
  readonly sha256OfFile?: (absolutePath: string) => string;
}

interface EvidenceContext {
  readonly era: D114Era;
  readonly intakeDirectory: string;
  readonly intakeLineageDigest: string;
  readonly evidence: CompleteEvidencePackage;
}

function resolvedFrom(base: string, configuredPath: string): string {
  return nodePath.isAbsolute(configuredPath) ? configuredPath : nodePath.resolve(base, configuredPath);
}

function manifestHash(entry: Sha256ManifestEntry | Record<string, unknown>): string | undefined {
  const e = entry as unknown as Record<string, unknown>;
  const v = e.sha256Hex ?? e.sha256;
  return typeof v === 'string' ? v.toLowerCase() : undefined;
}

function manifestFilename(entry: Sha256ManifestEntry | Record<string, unknown>): string | undefined {
  const e = entry as unknown as Record<string, unknown>;
  const v = e.localFilename ?? e.filename;
  return typeof v === 'string' ? v : undefined;
}

function recordsOf(evidence: CompleteEvidencePackage): Record<string, DetailedDateAssessment> {
  return evidence.manifest.records as Record<string, DetailedDateAssessment>;
}

function loadEvidenceContexts(
  corpusDir: string,
  manifest: PitCorpusManifest,
): { contexts?: ReadonlyMap<D114Era, EvidenceContext>; errors: string[] } {
  const errors: string[] = [];
  if (!Array.isArray(manifest.evidenceIntakes)) {
    return { errors: ['D114_ARCHIVE corpus requires evidenceIntakes for BOTH governed eras'] };
  }
  const contexts = new Map<D114Era, EvidenceContext>();
  for (const era of ['LEGACY_BHAVCOPY', 'CM_UDIFF'] as const) {
    const configured = manifest.evidenceIntakes.find((x) => x.era === era);
    if (!configured || typeof configured.directory !== 'string' || configured.directory.length === 0) {
      errors.push(`missing governed D114 evidence intake directory for ${era}`);
      continue;
    }
    const intakeDirectory = resolvedFrom(corpusDir, configured.directory);
    const intake = HistoricalEvidenceHandoff.validateAndLoadEvidencePackage(intakeDirectory);
    if (intake.status !== 'ACCEPTED' || !intake.evidencePackage) {
      errors.push(
        `D114 handoff intake REJECTED for ${era} at ${intakeDirectory}: ${[
          ...intake.errors,
          ...(intake.quarantineReason ? [intake.quarantineReason] : []),
        ].join('; ')}`,
      );
      continue;
    }
    contexts.set(era, Object.freeze({
      era,
      intakeDirectory,
      intakeLineageDigest: intake.intakeLineageDigest,
      evidence: intake.evidencePackage,
    }));
  }
  return errors.length > 0 ? { errors } : { contexts, errors };
}

/**
 * Load a bounded fixture or physical D114 archive corpus into `provider`.
 * Serving is atomic: the provider is bound ONLY after every entry validates and every snapshot
 * appends cleanly. A failed provider cannot be retried or served (`store.size() > 0` is refused).
 */
export function loadCorpusIntoProvider(
  provider: PitVintageProvider,
  corpusDir: string,
  options: LoadCorpusOptions = {},
): CorpusLoadResult {
  const maxRecords = options.maxRecords ?? 100_000;
  const fail = (...errors: string[]): CorpusLoadResult =>
    Object.freeze({ ok: false, snapshotsAppended: 0, corpusId: null, errors: Object.freeze(errors) });
  if (provider.isBound() || provider.store.size() !== 0) {
    return fail('provider/store must be empty and unbound before corpus load — reload/refill is refused');
  }

  const readText = options.readText ?? ((p: string) => nodeFs.readFileSync(p, 'utf8'));
  const readBuffer = options.readBuffer ?? ((p: string) => nodeFs.readFileSync(p));
  const sha256Of = options.sha256OfFile ?? ((p: string) =>
    nodeCrypto.createHash('sha256').update(nodeFs.readFileSync(p)).digest('hex'));

  let manifestText: string;
  try {
    manifestText = readText(nodePath.join(corpusDir, 'pit-corpus-manifest.json'));
  } catch (e) {
    return fail(`manifest unreadable: ${String(e)}`);
  }
  let manifest: PitCorpusManifest;
  try {
    manifest = JSON.parse(manifestText) as PitCorpusManifest;
  } catch (e) {
    return fail(`manifest is not valid JSON: ${String(e)}`);
  }

  const kind = manifest.corpusKind ?? 'FIXTURE_CSV';
  if (kind !== 'FIXTURE_CSV' && kind !== 'D114_ARCHIVE') return fail(`unknown corpusKind '${String(kind)}'`);
  if (typeof manifest.corpusId !== 'string' || manifest.corpusId.length === 0) return fail('manifest.corpusId is required');
  if (typeof manifest.provider !== 'string' || !PROVIDER_PATTERN.test(manifest.provider)) {
    return fail(`manifest.provider '${String(manifest.provider)}' must match ${PROVIDER_PATTERN}`);
  }
  if (typeof manifest.dataVersion !== 'string' || !DATA_VERSION_PATTERN.test(manifest.dataVersion)) {
    return fail(`manifest.dataVersion '${String(manifest.dataVersion)}' must match ${DATA_VERSION_PATTERN}`);
  }
  if (!Array.isArray(manifest.entries) || manifest.entries.length === 0) return fail('manifest.entries must be a non-empty array');

  let evidenceContexts: ReadonlyMap<D114Era, EvidenceContext> | undefined;
  if (kind === 'D114_ARCHIVE') {
    const loaded = loadEvidenceContexts(corpusDir, manifest);
    if (loaded.errors.length > 0 || !loaded.contexts) return fail(...loaded.errors);
    evidenceContexts = loaded.contexts;
    if (!manifest.archiveRoots?.LEGACY_BHAVCOPY || !manifest.archiveRoots?.CM_UDIFF) {
      return fail('D114_ARCHIVE corpus requires TWO separate archiveRoots: LEGACY_BHAVCOPY and CM_UDIFF');
    }
    if (!manifest.entries.some((x) => x.era === 'LEGACY_BHAVCOPY') || !manifest.entries.some((x) => x.era === 'CM_UDIFF')) {
      return fail('D114_ARCHIVE bounded corpus must include at least one archive from BOTH physical eras');
    }
  }

  const corpus = { corpusId: manifest.corpusId, provider: manifest.provider, dataVersion: manifest.dataVersion };
  const bridgeEntries: D114CorpusEntry[] = [];
  const unavailable = new Map<string, UnavailableDate>();

  // Physical policy derives EVERY unavailable/non-trading day from the governed evidence records.
  if (evidenceContexts) {
    for (const [era, ctx] of evidenceContexts) {
      const w = ERA_WINDOWS[era];
      for (const [date, assessment] of Object.entries(recordsOf(ctx.evidence))) {
        if (date < w.start || date > w.end || assessment.status === 'ACQUIRED_VALID') continue;
        unavailable.set(date, Object.freeze({
          date,
          status: assessment.status,
          evidenceRef: nodePath.join(ctx.intakeDirectory, 'failure-unavailable-date-register.json'),
        }));
      }
    }
  } else {
    for (const u of manifest.unavailableDates ?? []) {
      if (!DATE.test(u.date) || typeof u.status !== 'string' || typeof u.evidenceRef !== 'string') {
        return fail(`invalid fixture unavailableDates entry '${JSON.stringify(u)}'`);
      }
      unavailable.set(u.date, Object.freeze({ ...u }));
    }
  }

  for (const entry of manifest.entries) {
    if (
      typeof entry.file !== 'string' || entry.file.length === 0 ||
      entry.file.includes('/') || entry.file.includes('\\') || entry.file.includes('..')
    ) {
      return fail(`manifest entry file '${String(entry.file)}' must be a bare file name`);
    }
    if (entry.era !== 'LEGACY_BHAVCOPY' && entry.era !== 'CM_UDIFF') {
      return fail(`manifest entry '${entry.file}' declares unknown era '${String(entry.era)}'`);
    }
    if (entry.sha256 !== undefined && !SHA256_HEX.test(entry.sha256)) {
      return fail(`manifest entry '${entry.file}' sha256 is not lowercase 64-hex`);
    }

    const era = entry.era as D114Era; // runtime-validated immediately above

    if (kind === 'D114_ARCHIVE') {
      if (entry.source !== undefined && entry.source !== 'ZIP') {
        return fail(`physical D114 entry '${entry.file}' must use source ZIP`);
      }
      if (typeof entry.tradeDate !== 'string' || !DATE.test(entry.tradeDate)) {
        return fail(`physical D114 entry '${entry.file}' requires tradeDate YYYY-MM-DD`);
      }
      const w = ERA_WINDOWS[era];
      if (entry.tradeDate < w.start || entry.tradeDate > w.end) {
        return fail(`physical entry '${entry.file}' date ${entry.tradeDate} is outside ${entry.era} window ${w.start}..${w.end}`);
      }
      const ctx = evidenceContexts!.get(era)!;
      const shaEntry = ctx.evidence.sha256Manifest[entry.tradeDate] as Sha256ManifestEntry | undefined;
      const assessment = recordsOf(ctx.evidence)[entry.tradeDate];
      if (!shaEntry || !assessment || assessment.status !== 'ACQUIRED_VALID') {
        return fail(`physical entry '${entry.file}' has no ACQUIRED_VALID D114 evidence for ${entry.tradeDate}`);
      }
      const expectedFilename = manifestFilename(shaEntry);
      const expectedHash = manifestHash(shaEntry);
      if (expectedFilename !== entry.file || !expectedHash || !SHA256_HEX.test(expectedHash)) {
        return fail(
          `D114 SHA manifest mismatch for ${entry.tradeDate}: expected filename '${String(expectedFilename)}' / valid hash, manifest requested '${entry.file}'`,
        );
      }
      if (entry.sha256 !== undefined && entry.sha256 !== expectedHash) {
        return fail(`entry '${entry.file}' redundant sha256 does not equal the governed D114 SHA manifest`);
      }
      const root = resolvedFrom(corpusDir, manifest.archiveRoots![era]!);
      const archivePath = nodePath.join(root, entry.file);
      let actualHash: string;
      let archiveBytes: Buffer;
      try {
        actualHash = sha256Of(archivePath).toLowerCase();
        archiveBytes = readBuffer(archivePath);
      } catch (e) {
        return fail(`physical archive '${archivePath}' unreadable: ${String(e)}`);
      }
      if (actualHash !== expectedHash) {
        return fail(`physical archive '${archivePath}' sha256 mismatch — D114=${expectedHash}, actual=${actualHash}`);
      }
      const extracted = CmUdiffParser.extractZipArchive(archiveBytes);
      if (!extracted.isValid) return fail(`D114 archive extraction failed for '${archivePath}': ${extracted.error}`);
      bridgeEntries.push({
        archiveRef: entry.archiveRef ?? archivePath,
        era,
        tradeDate: entry.tradeDate,
        sha256: expectedHash,
        evidence: Object.freeze({
          acquisitionManifestId: ctx.evidence.manifest.manifestId,
          sha256ManifestEntry: Object.freeze({ ...(shaEntry as unknown as Record<string, unknown>) }),
          intakeLineageDigest: ctx.intakeLineageDigest,
          intakeDirectory: ctx.intakeDirectory,
          failureRegisterRef: nodePath.join(ctx.intakeDirectory, 'failure-unavailable-date-register.json'),
        }),
        csvText: extracted.rawCsvContent,
      });
      continue;
    }

    // Explicit repository fixture path — CSV only, hashed and bounded.
    if (entry.source !== undefined && entry.source !== 'CSV') {
      return fail(`fixture entry '${entry.file}' must use source CSV`);
    }
    if (entry.sha256 === undefined) return fail(`fixture entry '${entry.file}' requires sha256 provenance`);
    const filePath = nodePath.join(corpusDir, entry.file);
    let text: string;
    let actual: string;
    try {
      text = readText(filePath);
      actual = sha256Of(filePath).toLowerCase();
    } catch (e) {
      return fail(`fixture entry '${entry.file}' unreadable: ${String(e)}`);
    }
    if (actual !== entry.sha256) {
      return fail(`fixture entry '${entry.file}' sha256 mismatch — attested ${entry.sha256}, actual ${actual} — corpus refused`);
    }
    bridgeEntries.push({
      archiveRef: entry.archiveRef ?? `fixture://${entry.file}`,
      era,
      ...(entry.tradeDate !== undefined ? { tradeDate: entry.tradeDate } : {}),
      sha256: entry.sha256,
      csvText: text,
    });
  }

  const outcome = buildCorpusSnapshots({ ...corpus, entries: bridgeEntries });
  if (outcome.errors.length > 0) {
    return fail(...outcome.errors.map((e) => `${e.code} @ ${e.archiveRef}: ${e.detail}`));
  }
  if (outcome.snapshots.length === 0) return fail('corpus produced no snapshots');
  if (outcome.snapshots.length > maxRecords) {
    return fail(`corpus exceeds the bounded-corpus cap (${outcome.snapshots.length} > ${maxRecords}) — corpus refused`);
  }

  const loadedDates = new Set(outcome.snapshots.map((s) => s.asOf.slice(0, 10)));
  const aliasIndexes = buildSecurityAliasIndexes(outcome.snapshots);
  const sortedDates = [...loadedDates].sort();
  let coverageStart: string;
  let coverageEnd: string;
  if (kind === 'D114_ARCHIVE') {
    coverageStart = ERA_WINDOWS.LEGACY_BHAVCOPY.start;
    coverageEnd = ERA_WINDOWS.CM_UDIFF.end;
  } else if (manifest.coverage) {
    if (!DATE.test(manifest.coverage.start) || !DATE.test(manifest.coverage.end) || manifest.coverage.start > manifest.coverage.end) {
      return fail('fixture coverage must contain ordered YYYY-MM-DD start/end');
    }
    coverageStart = manifest.coverage.start;
    coverageEnd = manifest.coverage.end;
  } else {
    coverageStart = sortedDates[0]!;
    coverageEnd = sortedDates[sortedDates.length - 1]!;
  }

  try {
    for (const s of outcome.snapshots) provider.store.append(s); // PS-8 idempotent; PS-E9 on conflict
  } catch (e) {
    // The provider remains UNBOUND even if the rejected load left non-authoritative entries in
    // memory; a non-empty failed provider cannot be retried and can never serve.
    return fail(`store admission failed (provider remains unbound): ${String(e)}`);
  }
  policies.set(provider, Object.freeze({
    corpusId: corpus.corpusId,
    corpusKind: kind,
    coverageStart,
    coverageEnd,
    loadedDates,
    unavailableDates: unavailable,
    securityAliases: aliasIndexes.securityAliases,
    datedSecurityAliases: aliasIndexes.datedSecurityAliases,
    enforceLoadedDates: true,
    requireProvenance: true,
    evidenceValidated: kind === 'D114_ARCHIVE',
  }));
  return Object.freeze({
    ok: true,
    snapshotsAppended: outcome.snapshots.length,
    corpusId: corpus.corpusId,
    errors: Object.freeze([]),
  });
}

/** Governance identity disclosure (who produced the served vintages). */
export function pitProvenanceIdentity(): Readonly<typeof BRIDGE_IDENTITY> {
  return BRIDGE_IDENTITY;
}

// ─── Shared transport singleton (lazy, fail-closed, env-configured) ──────────────────────────

let shared: PitVintageProvider | null | undefined; // undefined = init not yet attempted

/**
 * The transport's shared provider. UNBOUND (null) unless `IIPS_PIT_CORPUS_DIR` names a
 * corpus directory that loads cleanly. Any failure → null → PIT_UNAVAILABLE (fail-closed).
 */
export function getSharedPitVintageProvider(): PitVintageProvider | null {
  if (shared !== undefined) return shared;
  shared = null;
  try {
    const dir = process.env.IIPS_PIT_CORPUS_DIR;
    if (!dir || dir.length === 0) return shared; // unbound by default — governed posture
    const provider = createPitVintageProvider();
    const res = loadCorpusIntoProvider(provider, dir);
    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.error('[pit] corpus load FAILED — PIT retrieval stays UNAVAILABLE:', res.errors);
      return shared;
    }
    const info = provider.corpusInfo();
    // eslint-disable-next-line no-console
    console.log(
      `[pit] corpus '${res.corpusId}' loaded: ${res.snapshotsAppended} snapshots / ${info.loadedDates} dates (${info.corpusKind}; evidence=${info.evidenceValidated}; IN_MEMORY_ONLY)`,
    );
    shared = provider;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[pit] provider initialisation failed — PIT retrieval stays UNAVAILABLE:', e);
    shared = null;
  }
  return shared;
}

/** Reset the singleton (tests only). */
export function resetSharedPitVintageProvider(): void {
  shared = undefined;
}
