/**
 * Institutional Investment Platform System (IIPS)
 * Workstream WS-H / Package D114 — IU-6
 * NON-PRODUCTION D114 -> PIT STORE POPULATION
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01 / D114 / OI-HIST-01
 * Operating Mode: OFFLINE_BOOTSTRAP / LOCAL_FIXTURE_AND_OFFLINE_DEV
 *
 * ===========================================================================
 * THIS IS EXPLICITLY NON-PRODUCTION.
 * ===========================================================================
 *
 * What this module IS:
 *
 *   A deterministic, offline, in-repository population path that drives the
 *   ALREADY EXISTING D114 machinery end to end:
 *
 *     embedded D114 archive fixture (CSV, both eras)
 *       -> UnifiedHistoricalAdapter.parseAndNormalize   (existing parser)
 *         -> CmUdiffParser / LegacyBhavcopyParser        (existing normalization)
 *           -> canonical D01_QUOTES / D02_OHLCV records  (existing contracts)
 *             -> HistoricalPitIngestionLoader            (existing loader)
 *               -> PointInTimeStore.append()             (existing PIT authority)
 *
 * What this module is NOT:
 *
 *   - It is NOT a second PIT store, a second PIT service, a second key
 *     grammar, a second identity grammar or a second persistence mechanism.
 *     It owns no state: it hands the authoritative `PointInTimeStore` to the
 *     authoritative `HistoricalPitIngestionLoader` and gets out of the way.
 *   - It is NOT production ingestion. There is no NSE call, no Dhan call, no
 *     provider, no socket, no credential and no network access of any kind.
 *     The archive bytes below are literals committed to this repository.
 *   - It introduces NO tenant, user or company ownership semantics into PIT.
 *
 * Idempotency, fail-closed admission, provenance stamping, series-aware
 * keying and asOf/vintage semantics are NOT reimplemented here. They are
 * properties of `HistoricalPitIngestionLoader` and `PointInTimeStore`, and
 * this module exists precisely so that those existing properties are the ones
 * exercised.
 */

import { PointInTimeStore } from '../pit/pit_store.js';
import { MarketQuotePayload } from '../contracts/d01_quotes.js';
import { OHLCVCandle } from '../contracts/d02_ohlcv.js';
import { ArchiveIngestionResult, HistoricalPitIngestionLoader } from './pit_ingestion_loader.js';
import { HistoricalArchiveFormat } from './unified_historical_adapter.js';

/** Plain, unmistakable label carried alongside every export of this module. */
export const NON_PRODUCTION_D114_DISPOSITION =
  'NON_PRODUCTION / OFFLINE_BOOTSTRAP / LOCAL_FIXTURE_ONLY / NOT AUTHORIZED FOR PRODUCTION' as const;

/**
 * The single non-production security used by this population path.
 *
 * It is deliberately a DIFFERENT ISIN from the one used by IRR's synthetic
 * fixture bootstrap, so the two non-production populations are observably
 * independent and neither can mask the other.
 */
export const NON_PRODUCTION_D114_ISIN = 'INE467B01029';
export const NON_PRODUCTION_D114_SYMBOL = 'TCS';

/**
 * The two series-aware security identities this path admits.
 *
 * These are the authoritative `D114SecurityIdentity.securityId` grammar
 * (`ISIN:<isin>:<series>`) produced by the existing parsers from the raw
 * `SctySrs` / `SERIES` column. No identity is constructed by hand here — the
 * constants below are assertions about what the parsers must produce, and the
 * tests compare the admitted PIT keys against them.
 */
export const NON_PRODUCTION_D114_EQ = `ISIN:${NON_PRODUCTION_D114_ISIN}:EQ`;
export const NON_PRODUCTION_D114_BL = `ISIN:${NON_PRODUCTION_D114_ISIN}:BL`;

/**
 * The three deterministic historical vintages this path admits.
 *
 * The loader stamps `provenance.asOf` as `${dateIso}T15:30:00.000Z` (NSE close).
 * These constants restate that so callers can assert historical selection and
 * future-vintage exclusion without re-deriving the rule.
 */
export const NON_PRODUCTION_D114_DATE_1 = '2024-06-28';
export const NON_PRODUCTION_D114_DATE_2 = '2026-01-05';
export const NON_PRODUCTION_D114_DATE_3 = '2026-02-10';

export const NON_PRODUCTION_D114_VINTAGE_1 = `${NON_PRODUCTION_D114_DATE_1}T15:30:00.000Z`;
export const NON_PRODUCTION_D114_VINTAGE_2 = `${NON_PRODUCTION_D114_DATE_2}T15:30:00.000Z`;
export const NON_PRODUCTION_D114_VINTAGE_3 = `${NON_PRODUCTION_D114_DATE_3}T15:30:00.000Z`;

/**
 * Legacy NSE Bhavcopy era archive (pre-July-2024 layout).
 *
 * Two rows for one ISIN in two DIFFERENT series. They are distinct securities
 * and must never be collapsed: the EQ and BL closes differ so any collision
 * between them is directly observable in the payload, not merely in a key.
 */
const LEGACY_BHAVCOPY_2024_06_28 = [
  'SYMBOL,SERIES,OPEN,HIGH,LOW,CLOSE,LAST,PREVCLOSE,TOTTRDQTY,TOTTRDVAL,TIMESTAMP,TOTALTRADES,ISIN',
  'TCS,EQ,3800.00,3825.50,3790.10,3812.40,3812.40,3795.00,1500000,5718600000.00,28-JUN-2024,120000,INE467B01029',
  'TCS,BL,3805.00,3830.00,3800.00,3820.75,3820.75,3800.00,250000,955187500.00,28-JUN-2024,300,INE467B01029',
].join('\n');

/** Contemporary NSE CM-UDiFF era archive. Same two series, later vintage. */
const CM_UDIFF_2026_01_05 = [
  'TradDt,BizDt,Sgmt,Src,ISIN,TckrSymb,SctySrs,ClsPric,LastPric,PrvsClsgPric,SttlmPric,OpnPric,HghPric,LwPric,TtlTradgVol,TtlTrfVal',
  '2026-01-05,2026-01-05,CM,NSE,INE467B01029,TCS,EQ,4010.25,4010.25,3995.00,4010.25,4000.00,4020.00,3990.00,1800000,7218450000.00',
  '2026-01-05,2026-01-05,CM,NSE,INE467B01029,TCS,BL,4015.80,4015.80,4000.00,4015.80,4005.00,4022.00,4002.00,300000,1204740000.00',
].join('\n');

/** Contemporary NSE CM-UDiFF era archive. Same two series, latest vintage. */
const CM_UDIFF_2026_02_10 = [
  'TradDt,BizDt,Sgmt,Src,ISIN,TckrSymb,SctySrs,ClsPric,LastPric,PrvsClsgPric,SttlmPric,OpnPric,HghPric,LwPric,TtlTradgVol,TtlTrfVal',
  '2026-02-10,2026-02-10,CM,NSE,INE467B01029,TCS,EQ,4125.60,4125.60,4110.00,4125.60,4110.00,4130.00,4105.00,1650000,6807240000.00',
  '2026-02-10,2026-02-10,CM,NSE,INE467B01029,TCS,BL,4131.05,4131.05,4115.00,4131.05,4115.00,4135.00,4110.00,275000,1136038750.00',
].join('\n');

export interface NonProductionD114Archive {
  readonly dateIso: string;
  readonly sourceFilename: string;
  readonly expectedFormat: HistoricalArchiveFormat;
  readonly csv: string;
}

/**
 * The complete, frozen, deterministic non-production archive corpus.
 *
 * Declaration order is the ingestion order. Both D114 eras are represented so
 * the population path exercises both existing parsers rather than only one.
 */
export const NON_PRODUCTION_D114_ARCHIVES: ReadonlyArray<NonProductionD114Archive> = Object.freeze([
  Object.freeze({
    dateIso: NON_PRODUCTION_D114_DATE_1,
    sourceFilename: 'cm28JUN2024bhav.csv',
    expectedFormat: 'LEGACY_BHAVCOPY' as HistoricalArchiveFormat,
    csv: LEGACY_BHAVCOPY_2024_06_28,
  }),
  Object.freeze({
    dateIso: NON_PRODUCTION_D114_DATE_2,
    sourceFilename: 'BhavCopy_NSE_CM_0_0_0_20260105_F_0000.csv',
    expectedFormat: 'CM_UDIFF' as HistoricalArchiveFormat,
    csv: CM_UDIFF_2026_01_05,
  }),
  Object.freeze({
    dateIso: NON_PRODUCTION_D114_DATE_3,
    sourceFilename: 'BhavCopy_NSE_CM_0_0_0_20260210_F_0000.csv',
    expectedFormat: 'CM_UDIFF' as HistoricalArchiveFormat,
    csv: CM_UDIFF_2026_02_10,
  }),
]);

export interface NonProductionD114Population {
  /**
   * The authoritative IPD `PointInTimeStore` the D114 loader admitted into.
   *
   * One store carries BOTH domains. That is safe and is not a shortcut: the
   * authoritative PIT key grammar is `${companyId}:${domain}[:${securityId}]`,
   * so `D01_QUOTES` and `D02_OHLCV` occupy disjoint keys by construction. It
   * matters because the read boundary (`PitReadService`) is constructed over a
   * single store, so a single store is what the composed read path requires.
   */
  readonly store: PointInTimeStore<unknown>;
  /**
   * The loader that performed the admission. It is the idempotency authority:
   * re-running `ingestNonProductionD114Archives` with THIS loader is a no-op.
   */
  readonly loader: HistoricalPitIngestionLoader;
  /** One result per archive, in ingestion order. */
  readonly results: ReadonlyArray<ArchiveIngestionResult>;
  readonly disposition: typeof NON_PRODUCTION_D114_DISPOSITION;
}

/**
 * Runs the frozen non-production archive corpus through an existing loader.
 *
 * Nothing is parsed, normalized, validated, keyed, stamped or deduplicated
 * here: every archive is handed to `HistoricalPitIngestionLoader`, which is
 * the existing authority for all of it. Passing the same loader twice is the
 * idempotency demonstration — the loader's own signature set suppresses the
 * second admission.
 */
export function ingestNonProductionD114Archives(
  loader: HistoricalPitIngestionLoader,
): ReadonlyArray<ArchiveIngestionResult> {
  return NON_PRODUCTION_D114_ARCHIVES.map((archive) =>
    loader.ingestArchiveContent(archive.csv, {
      dateIso: archive.dateIso,
      sourceFilename: archive.sourceFilename,
    }),
  );
}

/**
 * Populate a caller-supplied authoritative `PointInTimeStore` from D114.
 *
 * The SAME store instance is handed to the loader as both its D01 quote store
 * and its D02 candle store. The two casts below are the only casts in this
 * module and they are safe for exactly the reason given on
 * `NonProductionD114Population.store`: the domain is part of the PIT key, so
 * the two payload types never share a key and never alias one another.
 *
 * Handing in an existing store is what lets a caller (for example a
 * non-production IRR runtime composition) keep ONE authoritative IPD PIT store
 * rather than acquiring a second one.
 */
export function populateNonProductionD114Pit(
  store: PointInTimeStore<unknown>,
): NonProductionD114Population {
  const loader = new HistoricalPitIngestionLoader({
    quoteStore: store as unknown as PointInTimeStore<MarketQuotePayload>,
    candleStore: store as unknown as PointInTimeStore<OHLCVCandle>,
  });

  const results = ingestNonProductionD114Archives(loader);

  return {
    store,
    loader,
    results,
    disposition: NON_PRODUCTION_D114_DISPOSITION,
  };
}

/**
 * Build a fresh authoritative IPD `PointInTimeStore` populated from D114.
 *
 * Deterministic: two invocations produce byte-identical store contents,
 * because every input is a frozen literal and every timestamp the loader
 * stamps is derived from the archive date rather than from the clock.
 */
export function createNonProductionD114PitStore(): NonProductionD114Population {
  return populateNonProductionD114Pit(new PointInTimeStore<unknown>());
}
