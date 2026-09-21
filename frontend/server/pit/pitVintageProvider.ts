/**
 * D-PIT-WIRE-01 — PIT VINTAGE PROVIDER (transport-side retrieval point).
 *
 * Authority: **D-PIT-WIRE-01 = AUTHORIZED** over the governing scope
 * `docs/PIT_TRANSPORT_WIRING_SCOPE_PREPARATION.md` @ `79d05d7`.
 *
 * ══ WHAT THIS MODULE IS ════════════════════════════════════════════════════════════════════
 *   The FIRST transport consumer of the frozen P08 PIT capability. Holds ONE
 *   `createPitStore()` instance (no second store), loads a GOVERNED BOUNDED corpus through
 *   the D114 admission bridge, and exposes strict PS-9 retrieval (`resolved asOf <= requested
 *   asOf`) to the data-mode seam.
 *
 * ══ BINDING / FAIL-CLOSED ══════════════════════════════════════════════════════════════════
 *   • No corpus configured (env `IIPS_PIT_CORPUS_DIR` unset) → provider UNBOUND → the seam
 *     serves the existing governed `PIT_UNAVAILABLE` degraded response. Default posture.
 *   • Corpus configured but load fails for ANY reason (manifest invalid, sha mismatch, era
 *     mismatch, out-of-era record, admission failure, record cap exceeded) → provider stays
 *     UNBOUND (atomic all-or-nothing) → PIT_UNAVAILABLE. A partial corpus is never served.
 *   • Empty store / no vintage ≤ asOf / store error → `query()` returns null → PIT_UNAVAILABLE.
 *   NEVER a SNAPSHOT fallback, never a substituted value.
 *
 * ══ BOUNDARIES ══════════════════════════════════════════════════════════════════════════════
 *   • IN_MEMORY_ONLY — this module introduces NO persistence/durability (separate future act).
 *   • The env var is read at the TRANSPORT layer only; the frozen P08 module still touches no
 *     `process.env` (PS-2 preserved).
 *   • The verification corpus is BOUNDED (`maxRecords`, default 100,000 snapshots).
 *
 * Operating Mode: LOCAL_FIXTURE_AND_OFFLINE_DEV. NON_PRODUCTION_HOLD. OI-HIST-01 / G-004 OPEN.
 */
import { createPitStore } from './p08PitStore';
import type { PitSnapshot, PitStore } from './pitStorageModel';
import {
  buildCorpusSnapshots,
  BRIDGE_IDENTITY,
  type D114CorpusDescriptor,
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

export interface PitCorpusInfo {
  readonly loaded: boolean;
  readonly corpusId: string | null;
  readonly snapshots: number;
}

export interface PitVintageProvider {
  /** Strict PS-9 retrieval at the transport boundary; null on not-found/store-error. */
  query(domain: string, securityId: string, asOf: string): PitQueryResult | null;
  /** Whether a vintage would be served at all (bound + non-empty). */
  isBound(): boolean;
  /** Deterministic corpus facts for evidence/logging. */
  corpusInfo(): PitCorpusInfo;
  /** The underlying frozen store (test/evidence access only). */
  readonly store: PitStore;
}

export interface CreatePitProviderOptions {
  /** Inject a store (tests); default `createPitStore()` — the frozen P08 factory. */
  readonly store?: PitStore;
}

/** Loader-side corpus-id registry (kept off the public provider interface). */
const corpusIds = new WeakMap<object, string | null>();

/** Create an UNLOADED provider. Binding happens only through a successful `loadCorpus`. */
export function createPitVintageProvider(options: CreatePitProviderOptions = {}): PitVintageProvider {
  const store: PitStore = options.store ?? createPitStore();
  const provider = {
    store,
    query(domain: string, securityId: string, asOf: string): PitQueryResult | null {
      if ((corpusIds.get(provider) ?? null) === null) return null; // unloaded → fail-closed
      let snap: PitSnapshot | null = null;
      try {
        snap = store.asOfQuery(domain, securityId, asOf);
      } catch {
        return null; // store error → PIT_UNAVAILABLE, never a substitute
      }
      if (snap === null || snap === undefined) return null;
      // Belt-and-braces: the frozen PS-9 contract is `resolved <= requested`. Refuse otherwise.
      if (!(snap.asOf <= asOf)) return null;
      return Object.freeze({ found: true as const, requestedAsOf: asOf, resolvedAsOf: snap.asOf, snapshot: snap });
    },
    isBound(): boolean {
      return (corpusIds.get(provider) ?? null) !== null && store.size() > 0;
    },
    corpusInfo(): PitCorpusInfo {
      const corpusId = corpusIds.get(provider) ?? null;
      return Object.freeze({ loaded: corpusId !== null, corpusId, snapshots: store.size() });
    },
  };
  corpusIds.set(provider, null);
  return Object.freeze(provider);
}

/** Loader-internal: mark the corpus bound AFTER a successful atomic load. */
export function bindProviderCorpus(provider: PitVintageProvider, corpusId: string): void {
  corpusIds.set(provider, corpusId);
}

// ——— Corpus manifest loading (bounded, sha-attested, era-checked, atomic) ———

export interface PitCorpusManifest {
  readonly corpusId: string;
  readonly provider: string;
  readonly dataVersion: string;
  readonly entries: readonly {
    readonly file: string;
    readonly era: D114Era;
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
const PROVIDER_PATTERN = /^[A-Za-z0-9_]+$/;
const DATA_VERSION_PATTERN = /^[A-Za-z0-9_.\-]+$/;

export interface LoadCorpusOptions {
  /** Bounded-corpus discipline: refuse corpora beyond this many snapshots. */
  readonly maxRecords?: number;
  /** File reader injection (tests); default node:fs readFileSync utf8. */
  readonly readCsvText?: (absolutePath: string) => string;
  /** Manifest reader injection (tests); default node:fs readFileSync utf8. */
  readonly readManifest?: (absolutePath: string) => string;
  /** sha256 of file bytes injection (tests); default node:crypto. */
  readonly sha256OfFile?: (absolutePath: string) => string;
}

/**
 * Load `pit-corpus-manifest.json` + CSV entries from `corpusDir` into `provider`.
 * ATOMIC: the store receives snapshots ONLY if the whole corpus validates and admits.
 */
export function loadCorpusIntoProvider(
  provider: PitVintageProvider,
  corpusDir: string,
  options: LoadCorpusOptions = {},
): CorpusLoadResult {
  const maxRecords = options.maxRecords ?? 100_000;
  const errors: string[] = [];
  const fail = (...msgs: string[]): CorpusLoadResult =>
    Object.freeze({ ok: false, snapshotsAppended: 0, corpusId: null, errors: Object.freeze([...errors, ...msgs]) });

  let manifestText: string;
  try {
    const read = options.readManifest ?? defaultRead;
    manifestText = read(`${corpusDir}/pit-corpus-manifest.json`);
  } catch (e) {
    return fail(`manifest unreadable: ${String(e)}`);
  }
  let manifest: PitCorpusManifest;
  try {
    manifest = JSON.parse(manifestText) as PitCorpusManifest;
  } catch (e) {
    return fail(`manifest is not valid JSON: ${String(e)}`);
  }
  if (typeof manifest.corpusId !== 'string' || manifest.corpusId.length === 0) return fail('manifest.corpusId is required');
  if (typeof manifest.provider !== 'string' || !PROVIDER_PATTERN.test(manifest.provider)) {
    return fail(`manifest.provider '${String(manifest.provider)}' must match ${PROVIDER_PATTERN}`);
  }
  if (typeof manifest.dataVersion !== 'string' || !DATA_VERSION_PATTERN.test(manifest.dataVersion)) {
    return fail(`manifest.dataVersion '${String(manifest.dataVersion)}' must match ${DATA_VERSION_PATTERN}`);
  }
  if (!Array.isArray(manifest.entries) || manifest.entries.length === 0) return fail('manifest.entries must be a non-empty array');

  const corpus = { corpusId: manifest.corpusId, provider: manifest.provider, dataVersion: manifest.dataVersion };
  const readCsv = options.readCsvText ?? defaultRead;
  const sha256Of = options.sha256OfFile ?? defaultSha256;

  const csvTexts: { archiveRef: string; era: D114Era; sha256?: string; csvText: string }[] = [];
  for (const entry of manifest.entries) {
    if (typeof entry.file !== 'string' || entry.file.length === 0 || entry.file.includes('/') || entry.file.includes('\\') || entry.file.includes('..')) {
      return fail(`manifest entry file '${String(entry.file)}' must be a bare file name inside the corpus directory`);
    }
    if (entry.era !== 'LEGACY_BHAVCOPY' && entry.era !== 'CM_UDIFF') {
      return fail(`manifest entry '${entry.file}' declares unknown era '${String(entry.era)}'`);
    }
    if (entry.sha256 !== undefined && !SHA256_HEX.test(entry.sha256)) {
      return fail(`manifest entry '${entry.file}' sha256 is not 64-hex`);
    }
    let text: string;
    try {
      text = readCsv(`${corpusDir}/${entry.file}`);
    } catch (e) {
      return fail(`entry '${entry.file}' unreadable: ${String(e)}`);
    }
    if (entry.sha256 !== undefined) {
      let actual: string;
      try {
        actual = sha256Of(`${corpusDir}/${entry.file}`);
      } catch (e) {
        return fail(`entry '${entry.file}' sha256 could not be computed: ${String(e)}`);
      }
      if (actual.toLowerCase() !== entry.sha256.toLowerCase()) {
        return fail(`entry '${entry.file}' sha256 mismatch — attested ${entry.sha256}, actual ${actual} — corpus refused`);
      }
    }
    csvTexts.push({
      archiveRef: entry.archiveRef ?? entry.file,
      era: entry.era,
      ...(entry.sha256 !== undefined ? { sha256: entry.sha256 } : {}),
      csvText: text,
    });
  }

  const outcome = buildCorpusSnapshots({ ...corpus, entries: csvTexts });
  if (outcome.errors.length > 0) {
    return fail(...outcome.errors.map((e) => `${e.code} @ ${e.archiveRef}: ${e.detail}`));
  }
  if (outcome.snapshots.length === 0) return fail('corpus produced no snapshots');
  if (outcome.snapshots.length > maxRecords) {
    return fail(`corpus exceeds the bounded-corpus cap (${outcome.snapshots.length} > ${maxRecords}) — corpus refused`);
  }
  try {
    for (const s of outcome.snapshots) provider.store.append(s); // PS-8 idempotent; PS-E9 on conflict
    bindProviderCorpus(provider, corpus.corpusId);
  } catch (e) {
    return fail(`store admission failed: ${String(e)}`);
  }
  return Object.freeze({ ok: true, snapshotsAppended: outcome.snapshots.length, corpusId: corpus.corpusId, errors: Object.freeze([]) });
}

/** Governance identity disclosure (who produced the served vintages). */
export function pitProvenanceIdentity(): Readonly<typeof BRIDGE_IDENTITY> {
  return BRIDGE_IDENTITY;
}

// ——— Shared transport singleton (lazy, fail-closed, env-configured) ———

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
    // eslint-disable-next-line no-console
    console.log(`[pit] corpus '${res.corpusId}' loaded: ${res.snapshotsAppended} snapshots (IN_MEMORY_ONLY)`);
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

import * as nodeFs from 'node:fs';
import * as nodeCrypto from 'node:crypto';

function defaultRead(absolutePath: string): string {
  return nodeFs.readFileSync(absolutePath, 'utf8');
}
function defaultSha256(absolutePath: string): string {
  return nodeCrypto.createHash('sha256').update(nodeFs.readFileSync(absolutePath)).digest('hex');
}
