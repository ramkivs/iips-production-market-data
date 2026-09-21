/**
 * D-PIT-WIRE-01 — D114 → P08 PIT ADMISSION BRIDGE.
 *
 * Authority: **D-PIT-WIRE-01 = AUTHORIZED** (all seven decision points, incl. §5) over the
 * governing scope `docs/PIT_TRANSPORT_WIRING_SCOPE_PREPARATION.md` @ `79d05d7`.
 *
 * ══ WHAT THIS MODULE IS ════════════════════════════════════════════════════════════════════
 *   The single translation point between the frozen D114 dual-era canonical family
 *   (`d114/src/d114/unified_historical_adapter.ts` output: D01 `MarketQuotePayload` /
 *   D02 `OHLCVCandle`) and the accepted P05/P01 canonical snapshot boundary admissible by
 *   the frozen P08 PIT store (`p08/src/pitStorageModel.js` `append()`, PS-6 admission).
 *   BOTH ENDS ARE FROZEN — this bridge modifies neither. It maps, validates, and refuses.
 *
 * ══ ERA BOUNDARY (governed, from the D114 evidence packages) ═══════════════════════════════
 *   LEGACY_BHAVCOPY : 2016-09-20 → 2024-07-07   (`evidence/d114-legacy/historical-coverage-summary.json`)
 *   CM_UDIFF        : 2024-07-08 → 2026-09-18   (`evidence/d114/historical-coverage-summary.json`)
 *   The format boundary 2024-07-07 | 2024-07-08 is ENFORCED per record: a record whose trade
 *   date falls outside its declared era window is REFUSED (fail-closed), never reclassified.
 *
 * ══ FAIL-CLOSED ═════════════════════════════════════════════════════════════════════════════
 *   Any admission failure (schema invalid, era mismatch, out-of-era date, sha mismatch at the
 *   loader, PS-E9 vintage ambiguity from the store) refuses the affected corpus ATOMICALLY —
 *   a partial corpus is never served. `buildCorpusSnapshots` returns per-entry errors; the
 *   provider loads the store ONLY when every entry admits cleanly.
 *
 * ══ PIT BOUNDARY (P01 ST-5 / MD-3) ═════════════════════════════════════════════════════════
 *   `pitBoundary` = the canonical record's own session end (`candleEnd`) — the instant at
 *   which this EOD bar became knowable. Derived from the record; never invented.
 *
 * Operating Mode: LOCAL_FIXTURE_AND_OFFLINE_DEV. NON_PRODUCTION_HOLD. OI-HIST-01 / G-004 OPEN.
 */
import {
  UnifiedHistoricalAdapter,
  type HistoricalArchiveFormat,
} from '../../../d114/src/d114/unified_historical_adapter.js';
import type { OHLCVCandle } from '../../../d114/src/contracts/d02_ohlcv.js';
import type { PitSnapshot } from './pitStorageModel';

/** Governed era identifiers (D114 dual-era facts, disclosed verbatim in responses). */
export type D114Era = 'LEGACY_BHAVCOPY' | 'CM_UDIFF';

/** Governed era windows — from the deposited D114 coverage summaries. Format boundary preserved. */
export const ERA_WINDOWS: Readonly<Record<D114Era, { readonly start: string; readonly end: string }>> =
  Object.freeze({
    LEGACY_BHAVCOPY: Object.freeze({ start: '2016-09-20', end: '2024-07-07' }),
    CM_UDIFF: Object.freeze({ start: '2024-07-08', end: '2026-09-18' }),
  });

/** The D114 unified adapter's format ids — identical to `HistoricalArchiveFormat` minus UNKNOWN. */
const ERA_TO_FORMAT: Readonly<Record<D114Era, HistoricalArchiveFormat>> = Object.freeze({
  LEGACY_BHAVCOPY: 'LEGACY_BHAVCOPY',
  CM_UDIFF: 'CM_UDIFF',
});

/** PIT domain served by this bridge: D02 (historical OHLCV bars). Bounded corpus discipline. */
export const PIT_DOMAIN = 'D02';

/** Governance identity of this bridge (disclosed in snapshot provenance). */
export const BRIDGE_IDENTITY = Object.freeze({
  source: 'D114',
  bridge: 'd114AdmissionBridge v1 (D-PIT-WIRE-01)',
  store: 'p08 createPitStore (frozen, IN_MEMORY_ONLY)',
  recordKind: 'D02 OHLCV daily bar (1d)',
});

/** One governed corpus input: a CSV text plus its attested provenance. */
export interface D114CorpusEntry {
  /** File/archive reference disclosed in responses (where available). */
  readonly archiveRef: string;
  /** Declared era — must match the adapter's content-detected format. */
  readonly era: D114Era;
  /** SHA-256 of the CSV content, when attested by the corpus manifest (hex, 64 chars). */
  readonly sha256?: string;
  /** Raw CSV text (already extracted from its archive by the caller). */
  readonly csvText: string;
}

/** Corpus-level descriptor (from `pit-corpus-manifest.json` via the provider loader). */
export interface D114CorpusDescriptor {
  readonly corpusId: string;
  readonly provider: string;
  readonly dataVersion: string;
  readonly entries: readonly D114CorpusEntry[];
}

/** Admission failure — stable machine-readable code + human explanation. */
export interface D114AdmissionError {
  readonly code:
    | 'D114-E1' // empty CSV content
    | 'D114-E2' // adapter rejected the content (schema/parse failure)
    | 'D114-E3' // declared era does not match content-detected format
    | 'D114-E4' // record trade date outside the declared era window (format boundary)
    | 'D114-E5' // record not convertible to a PIT-admissible snapshot
    | 'D114-E6'; // store admission rejected the snapshot (PS-E*)
  readonly archiveRef: string;
  readonly detail: string;
}

export interface D114AdmissionOutcome {
  readonly snapshots: readonly PitSnapshot[];
  readonly errors: readonly D114AdmissionError[];
}

const ISO_MS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

/** Trade date (UTC calendar day) of a canonical candle — the era-boundary comparison key. */
function tradeDateOf(candle: OHLCVCandle): string {
  return candle.candleStart.slice(0, 10);
}

/** True when the trade date is inside the declared era's governed window. */
export function isWithinEraWindow(era: D114Era, tradeDate: string): boolean {
  const w = ERA_WINDOWS[era];
  return tradeDate >= w.start && tradeDate <= w.end;
}

/**
 * Map ONE canonical D02 candle to a P08-admissible PIT snapshot.
 * Refuses (returns an error) rather than coercing — INV-7 no-coercion, reused.
 */
export function candleToPitSnapshot(
  candle: OHLCVCandle,
  corpus: { corpusId: string; provider: string; dataVersion: string },
  entry: { archiveRef: string; era: D114Era; sha256?: string },
): { snapshot?: PitSnapshot; error?: D114AdmissionError } {
  const refuse = (code: D114AdmissionError['code'], detail: string): D114AdmissionError => ({
    code, archiveRef: entry.archiveRef, detail,
  });
  if (typeof candle.symbol !== 'string' || candle.symbol.length === 0) {
    return { error: refuse('D114-E5', 'canonical candle carries no symbol — no PIT series identity') };
  }
  const asOf = candle.candleStart;
  if (!ISO_MS.test(asOf)) {
    return { error: refuse('D114-E5', `candleStart '${asOf}' is not an ISO-8601 UTC instant with milliseconds`) };
  }
  if (!isWithinEraWindow(entry.era, tradeDateOf(candle))) {
    const w = ERA_WINDOWS[entry.era];
    return {
      error: refuse(
        'D114-E4',
        `trade date ${tradeDateOf(candle)} is outside the governed ${entry.era} window ${w.start}..${w.end} — format boundary 2024-07-07|2024-07-08 is preserved, record refused`,
      ),
    };
  }
  const snapshotId = `data-${corpus.provider}-${corpus.dataVersion}-${asOf}`;
  const snapshot: PitSnapshot = Object.freeze({
    snapshotId,
    provider: corpus.provider,
    dataVersion: corpus.dataVersion,
    asOf,
    domain: PIT_DOMAIN,
    quality: 'good', // schema-validated ACQUIRED_VALID bar — the four-state vocabulary, reused
    securityId: candle.symbol,
    mode: 'PIT',
    // P01 ST-5/MD-3 — pitBoundary present IFF mode is PIT: the session end of this EOD bar.
    pitBoundary: candle.candleEnd,
    payload: Object.freeze({
      symbol: candle.symbol,
      companyId: candle.companyId,
      interval: candle.interval,
      candleStart: candle.candleStart,
      candleEnd: candle.candleEnd,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume,
      isAdjusted: candle.isAdjusted,
    }),
    historicalProvenance: Object.freeze({
      ...BRIDGE_IDENTITY,
      era: entry.era,
      tradeDate: tradeDateOf(candle),
      archiveRef: entry.archiveRef,
      ...(entry.sha256 !== undefined ? { sha256: entry.sha256 } : {}),
      corpusId: corpus.corpusId,
    }),
  });
  return { snapshot };
}

/**
 * Admit ONE corpus entry: detect format, validate schema, refuse era mismatches, and map
 * every record to a PIT snapshot. ALL-OR-NOTHING per entry: any record failure fails the
 * whole entry (a partial day is never served).
 */
export function admitCorpusEntry(
  corpus: { corpusId: string; provider: string; dataVersion: string },
  entry: D114CorpusEntry,
): { snapshots: readonly PitSnapshot[]; errors: readonly D114AdmissionError[] } {
  const refuse = (code: D114AdmissionError['code'], detail: string): D114AdmissionError => ({
    code, archiveRef: entry.archiveRef, detail,
  });
  if (!entry.csvText || entry.csvText.trim().length === 0) {
    return { snapshots: [], errors: [refuse('D114-E1', 'empty CSV content')] };
  }
  const parsed = UnifiedHistoricalAdapter.parseAndNormalize(entry.csvText);
  if (!parsed.isValid) {
    return { snapshots: [], errors: [refuse('D114-E2', parsed.error ?? 'adapter rejected the archive content')] };
  }
  const expectedFormat = ERA_TO_FORMAT[entry.era];
  if (parsed.format !== expectedFormat) {
    return {
      snapshots: [],
      errors: [
        refuse(
          'D114-E3',
          `declared era ${entry.era} does not match content-detected format ${parsed.format} — era ambiguity is refused, never resolved`,
        ),
      ],
    };
  }
  const snapshots: PitSnapshot[] = [];
  const errors: D114AdmissionError[] = [];
  for (const candle of parsed.candles) {
    const r = candleToPitSnapshot(candle, corpus, entry);
    if (r.error) {
      // Era-boundary violations fail the WHOLE entry (no partial day), per fail-closed §8.
      return { snapshots: [], errors: [r.error] };
    }
    if (r.snapshot) snapshots.push(r.snapshot);
  }
  if (snapshots.length === 0) {
    return { snapshots: [], errors: [refuse('D114-E5', 'entry produced no admissible records')] };
  }
  return { snapshots, errors };
}

/**
 * Admit a WHOLE corpus atomically: snapshots are returned ONLY if every entry admits
 * cleanly. Any admission failure fails the corpus (the provider then serves nothing and
 * the transport fails closed as PIT_UNAVAILABLE).
 */
export function buildCorpusSnapshots(corpus: D114CorpusDescriptor): D114AdmissionOutcome {
  const snapshots: PitSnapshot[] = [];
  const errors: D114AdmissionError[] = [];
  for (const entry of corpus.entries) {
    const r = admitCorpusEntry(corpus, entry);
    if (r.errors.length > 0) {
      errors.push(...r.errors);
      continue;
    }
    snapshots.push(...r.snapshots);
  }
  return errors.length > 0 ? { snapshots: [], errors } : { snapshots, errors };
}
