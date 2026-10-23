/**
 * Deterministic NON-PRODUCTION D114 -> PIT population.
 *
 * Embedded local CSV fixtures drive the authoritative parser, normalizer and
 * HistoricalPitIngestionLoader. There is no acquisition, provider, credential,
 * network, production persistence or second PIT store in this module.
 */

import { PointInTimeStore } from '../pit/pit_store.js';
import { MarketQuotePayload } from '../contracts/d01_quotes.js';
import { OHLCVCandle } from '../contracts/d02_ohlcv.js';
import { ArchiveIngestionResult, HistoricalPitIngestionLoader } from './pit_ingestion_loader.js';
import { HistoricalArchiveFormat } from './unified_historical_adapter.js';

export const NON_PRODUCTION_D114_DISPOSITION =
  'NON_PRODUCTION / OFFLINE_BOOTSTRAP / LOCAL_FIXTURE_ONLY / NOT AUTHORIZED FOR PRODUCTION' as const;

export const NON_PRODUCTION_D114_ISIN = 'INE467B01029';
export const NON_PRODUCTION_D114_SYMBOL = 'TCS';
export const NON_PRODUCTION_D114_EQ = `ISIN:${NON_PRODUCTION_D114_ISIN}:EQ`;
export const NON_PRODUCTION_D114_BL = `ISIN:${NON_PRODUCTION_D114_ISIN}:BL`;

export const NON_PRODUCTION_D114_DATE_1 = '2024-06-28';
export const NON_PRODUCTION_D114_DATE_2 = '2026-01-05';
export const NON_PRODUCTION_D114_DATE_3 = '2026-02-10';
export const NON_PRODUCTION_D114_VINTAGE_1 = `${NON_PRODUCTION_D114_DATE_1}T15:30:00.000Z`;
export const NON_PRODUCTION_D114_VINTAGE_2 = `${NON_PRODUCTION_D114_DATE_2}T15:30:00.000Z`;
export const NON_PRODUCTION_D114_VINTAGE_3 = `${NON_PRODUCTION_D114_DATE_3}T15:30:00.000Z`;

const LEGACY_BHAVCOPY_2024_06_28 = [
  'SYMBOL,SERIES,OPEN,HIGH,LOW,CLOSE,LAST,PREVCLOSE,TOTTRDQTY,TOTTRDVAL,TIMESTAMP,TOTALTRADES,ISIN',
  'TCS,EQ,3800.00,3825.50,3790.10,3812.40,3812.40,3795.00,1500000,5718600000.00,28-JUN-2024,120000,INE467B01029',
  'TCS,BL,3805.00,3830.00,3800.00,3820.75,3820.75,3800.00,250000,955187500.00,28-JUN-2024,300,INE467B01029',
].join('\n');

const CM_UDIFF_2026_01_05 = [
  'TradDt,BizDt,Sgmt,Src,ISIN,TckrSymb,SctySrs,ClsPric,LastPric,PrvsClsgPric,SttlmPric,OpnPric,HghPric,LwPric,TtlTradgVol,TtlTrfVal',
  '2026-01-05,2026-01-05,CM,NSE,INE467B01029,TCS,EQ,4010.25,4010.25,3995.00,4010.25,4000.00,4020.00,3990.00,1800000,7218450000.00',
  '2026-01-05,2026-01-05,CM,NSE,INE467B01029,TCS,BL,4015.80,4015.80,4000.00,4015.80,4005.00,4022.00,4002.00,300000,1204740000.00',
].join('\n');

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

/** Frozen local fixtures; declaration order is deterministic ingestion order. */
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
  readonly store: PointInTimeStore<unknown>;
  readonly loader: HistoricalPitIngestionLoader;
  readonly results: ReadonlyArray<ArchiveIngestionResult>;
  readonly disposition: typeof NON_PRODUCTION_D114_DISPOSITION;
}

/** Runs the frozen corpus through the authoritative loader, with no new parsing logic. */
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
 * Populates the caller's store. D01 and D02 deliberately share that one store;
 * domain and series-qualified identity keep their keys disjoint.
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

export function createNonProductionD114PitStore(): NonProductionD114Population {
  return populateNonProductionD114Pit(new PointInTimeStore<unknown>());
}
