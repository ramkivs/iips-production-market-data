/**
 * D-PIT-WIRE-01 — T3: D114 → P08 ADMISSION BRIDGE tests (bounded fixture corpus).
 *
 * Proves, against D114 (including the authorized identity-only correction) and the FROZEN P08 store:
 *   • LEGACY_BHAVCOPY record admission;
 *   • CM_UDIFF record admission;
 *   • the 2024-07-07 → 2024-07-08 era boundary is preserved and enforced;
 *   • provenance (era / archiveRef / sha256 / corpusId) survives into the stored snapshot;
 *   • snapshotId composition (AD-6) and PS-8 idempotency / PS-E9 vintage-ambiguity refusal;
 *   • corpus admission is all-or-nothing (any failure → nothing admitted → fail-closed);
 *   • parser prices/times and every P08 semantic remain unchanged; PS-E9 stays fully active.
 */
import { describe, it, expect } from 'vitest';
import { UnifiedHistoricalAdapter } from '../../../d114/src/d114/unified_historical_adapter.js';
import { createPitStore, PIT_CAPABILITY } from './p08PitStore';
import {
  ERA_WINDOWS,
  PIT_DOMAIN,
  admitCorpusEntry,
  buildCorpusSnapshots,
  candleToPitSnapshot,
  isWithinEraWindow,
} from './d114AdmissionBridge';
import fs from 'node:fs';
import path from 'node:path';

const CORPUS_DIR = path.join(process.cwd(), 'server', 'pit', 'fixtures', 'corpus');
const legacyCsv = fs.readFileSync(path.join(CORPUS_DIR, 'legacy-fixture.csv'), 'utf8');
const udiffCsv = fs.readFileSync(path.join(CORPUS_DIR, 'udiff-fixture.csv'), 'utf8');
const RELIANCE_SECURITY_ID = 'ISIN:INE002A01018';
const mmfinMultiSeriesLegacyCsv = `SYMBOL,SERIES,OPEN,HIGH,LOW,CLOSE,LAST,PREVCLOSE,TOTTRDQTY,TOTTRDVAL,TIMESTAMP,TOTALTRADES,ISIN
M&MFIN,EQ,299.80,302.10,297.75,300.50,300.70,298.20,3303110,992336000.00,05-JUL-2024,29778,INE774D01024
M&MFIN,N3,2048.00,2048.00,2048.00,2048.00,2048.00,2050.00,91,186368.00,05-JUL-2024,2,INE774D08MG3`;

const CORPUS = { corpusId: 'pit-fixture-corpus-v1', provider: 'NSE_D114', dataVersion: 'd114-dualera-v1' };

describe('T3 — D114 adapter price/time pins plus authorized security identity metadata', () => {
  it('detects both frozen eras by header fingerprint', () => {
    expect(UnifiedHistoricalAdapter.detectFormat(['TradDt', 'TckrSymb', 'ClsPric'])).toBe('CM_UDIFF');
    expect(UnifiedHistoricalAdapter.detectFormat(['SYMBOL', 'CLOSE', 'TIMESTAMP'])).toBe('LEGACY_BHAVCOPY');
    expect(UnifiedHistoricalAdapter.detectFormat(['a', 'b'])).toBe('UNKNOWN');
  });

  it('parses legacy rows with the frozen DD-MMM-YYYY normalisation', () => {
    const r = UnifiedHistoricalAdapter.parseAndNormalize(legacyCsv);
    expect(r.format).toBe('LEGACY_BHAVCOPY');
    expect(r.isValid).toBe(true);
    expect(r.candles).toHaveLength(6);
    const reliance = r.candles.find((c) => c.symbol === 'RELIANCE');
    expect(reliance?.candleStart).toBe('2023-12-29T09:15:00.000Z');
    expect(reliance?.close).toBeCloseTo(2869.35, 2);
  });

  it('parses CM-UDiFF rows with the frozen session window', () => {
    const r = UnifiedHistoricalAdapter.parseAndNormalize(udiffCsv);
    expect(r.format).toBe('CM_UDIFF');
    expect(r.isValid).toBe(true);
    expect(r.candles).toHaveLength(4);
    const tcs = r.candles.find((c) => c.symbol === 'TCS');
    expect(tcs?.candleStart).toBe('2024-07-08T09:15:00.000Z');
    expect(tcs?.candleEnd).toBe('2024-07-08T15:30:00.000Z');
  });
});

describe('T3 — frozen P08 store surface (0 P08 semantic modification pin)', () => {
  it('PIT_CAPABILITY remains IN_MEMORY_ONLY with persistence/durability/network refused', () => {
    expect(PIT_CAPABILITY.storage).toBe('IN_MEMORY_ONLY');
    expect(PIT_CAPABILITY.persistenceAuthorized).toBe(false);
    expect(PIT_CAPABILITY.durableMediaAuthorized).toBe(false);
    expect(PIT_CAPABILITY.networkAuthorized).toBe(false);
    expect(PIT_CAPABILITY.credentialsAuthorized).toBe(false);
    expect(PIT_CAPABILITY.p05RefusalModified).toBe(false);
  });
});

describe('T3 — era windows and the 2024-07-07 → 2024-07-08 format boundary', () => {
  it('governed windows match the deposited D114 coverage summaries', () => {
    expect(ERA_WINDOWS.LEGACY_BHAVCOPY).toEqual({ start: '2016-09-20', end: '2024-07-07' });
    expect(ERA_WINDOWS.CM_UDIFF).toEqual({ start: '2024-07-08', end: '2026-09-18' });
  });

  it('boundary dates fall on the correct side (2024-07-07 LEGACY; 2024-07-08 CM_UDIFF)', () => {
    expect(isWithinEraWindow('LEGACY_BHAVCOPY', '2024-07-07')).toBe(true);
    expect(isWithinEraWindow('LEGACY_BHAVCOPY', '2024-07-08')).toBe(false);
    expect(isWithinEraWindow('CM_UDIFF', '2024-07-08')).toBe(true);
    expect(isWithinEraWindow('CM_UDIFF', '2024-07-07')).toBe(false);
  });

  it('refuses a CM-UDiFF record dated inside the LEGACY window (era ambiguity, D114-E4)', () => {
    // A CM_UDIFF-declared CSV whose content carries a 2024-07-07 trade date.
    const crossEra = udiffCsv.replace(/2024-07-08/g, '2024-07-07');
    const r = admitCorpusEntry(CORPUS, { archiveRef: 'cross-era', era: 'CM_UDIFF', csvText: crossEra });
    expect(r.snapshots).toHaveLength(0);
    expect(r.errors[0]?.code).toBe('D114-E4');
    expect(r.errors[0]?.detail).toMatch(/format boundary 2024-07-07\|2024-07-08 is preserved/);
  });

  it('refuses a LEGACY record dated inside the CM-UDiFF window (era ambiguity, D114-E4)', () => {
    const crossEra = legacyCsv.replace(/07-JUL-2024/g, '08-JUL-2024').replace(/05-JUL-2024/g, '15-JUL-2024');
    const r = admitCorpusEntry(CORPUS, { archiveRef: 'cross-era-legacy', era: 'LEGACY_BHAVCOPY', csvText: crossEra });
    expect(r.snapshots).toHaveLength(0);
    expect(r.errors[0]?.code).toBe('D114-E4');
  });

  it('refuses a declared-era mismatch against content-detected format (D114-E3)', () => {
    const r = admitCorpusEntry(CORPUS, { archiveRef: 'wrong-era', era: 'CM_UDIFF', csvText: legacyCsv });
    expect(r.errors[0]?.code).toBe('D114-E3');
    expect(r.errors[0]?.detail).toMatch(/era ambiguity is refused, never resolved/);
  });

  it('refuses a structurally invalid D02 canonical candle (bridge never repairs/coerces)', () => {
    const candle = UnifiedHistoricalAdapter.parseAndNormalize(legacyCsv).candles[0]!;
    const r = candleToPitSnapshot(
      { ...candle, high: candle.low - 1 }, // contradictory high < low/open/close
      CORPUS,
      { archiveRef: 'invalid-canonical', era: 'LEGACY_BHAVCOPY' },
    );
    expect(r.snapshot).toBeUndefined();
    expect(r.error).toMatchObject({ code: 'D114-E5' });
    expect(r.error?.detail).toMatch(/D02 canonical validation refused/);
  });
});

describe('T3 — admission and provenance preservation', () => {
  it('admits the LEGACY fixture and preserves era/archiveRef/sha256 in the stored snapshot', () => {
    const store = createPitStore();
    const r = admitCorpusEntry(CORPUS, {
      archiveRef: 'C:\\IIPS_Data\\NSE_Legacy_Acquisition\\archives\\cm05JUL2024bhav.csv.zip',
      era: 'LEGACY_BHAVCOPY',
      sha256: 'aa'.repeat(32),
      csvText: legacyCsv,
    });
    expect(r.errors).toHaveLength(0);
    for (const s of r.snapshots) store.append(s);
    expect(store.size()).toBe(6);

    const vintage = store.asOfQuery(PIT_DOMAIN, RELIANCE_SECURITY_ID, '2024-07-05T23:59:59.999Z');
    expect(vintage).not.toBeNull();
    expect(vintage?.snapshotId).toBe('data-NSE_D114-d114-dualera-v1-2024-07-05T09:15:00.000Z');
    expect(vintage?.provider).toBe('NSE_D114');
    expect(vintage?.dataVersion).toBe('d114-dualera-v1');
    expect(vintage?.quality).toBe('good');
    expect(vintage?.domain).toBe(PIT_DOMAIN);
    expect(vintage?.securityId).toBe(RELIANCE_SECURITY_ID);
    expect(vintage?.mode).toBe('PIT');
    // P01 ST-5/MD-3 — pitBoundary present under PIT, set to the record's own session end.
    expect(vintage?.pitBoundary).toBe('2024-07-05T15:30:00.000Z');
    const hp = vintage?.historicalProvenance as Record<string, unknown>;
    expect(hp.era).toBe('LEGACY_BHAVCOPY');
    expect(hp.archiveRef).toMatch(/^C:\\IIPS_Data\\/);
    expect(hp.sha256).toBe('aa'.repeat(32));
    expect(hp.corpusId).toBe('pit-fixture-corpus-v1');
    expect(hp.source).toBe('D114');
    // Record payload is the canonical D02 bar byte-faithful through the bridge — exact
    // JSON/property order, not a selected-field reconstruction.
    const payload = vintage?.payload as Record<string, unknown>;
    const canonical = UnifiedHistoricalAdapter.parseAndNormalize(legacyCsv).candles.find(
      (c) => c.symbol === 'RELIANCE' && c.candleStart === '2024-07-05T09:15:00.000Z',
    );
    expect(JSON.stringify(payload)).toBe(JSON.stringify(canonical));
    expect(payload.close).toBeCloseTo(2931.1, 2);
    expect(payload.interval).toBe('1d');
    expect(payload.isAdjusted).toBe(false);
  });

  it('admits exact 05-Jul-2024 M&MFIN EQ/N3 rows as coexisting P08 series without PS-E9', () => {
    const admitted = admitCorpusEntry(CORPUS, {
      archiveRef: 'cm05JUL2024bhav.csv.zip',
      era: 'LEGACY_BHAVCOPY',
      sha256: 'e08c8c0650e6807f8b1abd0658bc8d87cbe2d78c2fc77e05c82878f30be46665',
      csvText: mmfinMultiSeriesLegacyCsv,
    });
    expect(admitted.errors).toHaveLength(0);
    expect(admitted.snapshots).toHaveLength(2);
    expect(admitted.snapshots.map((s) => s.asOf)).toEqual([
      '2024-07-05T09:15:00.000Z',
      '2024-07-05T09:15:00.000Z',
    ]);
    expect(admitted.snapshots.map((s) => s.securityId).sort()).toEqual([
      'ISIN:INE774D01024',
      'ISIN:INE774D08MG3',
    ]);

    const store = createPitStore();
    expect(() => {
      for (const snapshot of admitted.snapshots) store.append(snapshot);
    }).not.toThrow();
    expect(store.size()).toBe(2);

    const eq = store.asOfQuery(PIT_DOMAIN, 'ISIN:INE774D01024', '2024-07-05T09:15:00.000Z');
    const n3 = store.asOfQuery(PIT_DOMAIN, 'ISIN:INE774D08MG3', '2024-07-05T09:15:00.000Z');
    expect(eq?.asOf).toBe('2024-07-05T09:15:00.000Z');
    expect(n3?.asOf).toBe('2024-07-05T09:15:00.000Z');
    expect(eq?.payload).toMatchObject({
      companyId: 'M&MFIN', symbol: 'M&MFIN', close: 300.5,
      securityIdentity: { isin: 'INE774D01024', series: 'EQ' },
    });
    expect(n3?.payload).toMatchObject({
      companyId: 'M&MFIN', symbol: 'M&MFIN', close: 2048,
      securityIdentity: { isin: 'INE774D08MG3', series: 'N3' },
    });
    expect(store.asOfQuery(PIT_DOMAIN, 'M&MFIN', '2024-07-05T09:15:00.000Z')).toBeNull();
    expect(store.detectVintageAmbiguity(PIT_DOMAIN, 'ISIN:INE774D01024')).toEqual([]);
    expect(store.detectVintageAmbiguity(PIT_DOMAIN, 'ISIN:INE774D08MG3')).toEqual([]);
  });

  it('admits the CM_UDIFF fixture across the era boundary from the same series', () => {
    const store = createPitStore();
    const legacy = admitCorpusEntry(CORPUS, { archiveRef: 'legacy', era: 'LEGACY_BHAVCOPY', csvText: legacyCsv });
    const udiff = admitCorpusEntry(CORPUS, { archiveRef: 'udiff', era: 'CM_UDIFF', sha256: 'bb'.repeat(32), csvText: udiffCsv });
    expect(legacy.errors).toHaveLength(0);
    expect(udiff.errors).toHaveLength(0);
    for (const s of [...legacy.snapshots, ...udiff.snapshots]) store.append(s);
    expect(store.size()).toBe(10);

    // Continuous series across the 2024-07-07 | 2024-07-08 format boundary.
    const at = (asOf: string) => store.asOfQuery(PIT_DOMAIN, RELIANCE_SECURITY_ID, asOf);
    expect(at('2024-07-07T23:59:59.999Z')?.asOf).toBe('2024-07-07T09:15:00.000Z');
    expect(at('2024-07-08T23:59:59.999Z')?.asOf).toBe('2024-07-08T09:15:00.000Z');
    expect((at('2024-07-08T23:59:59.999Z')?.historicalProvenance as Record<string, unknown>).era).toBe('CM_UDIFF');
    expect((at('2024-07-07T23:59:59.999Z')?.historicalProvenance as Record<string, unknown>).era).toBe('LEGACY_BHAVCOPY');
  });

  it('is idempotent on re-admission (PS-8) and refuses conflicting vintages (PS-E9)', () => {
    const store = createPitStore();
    const first = admitCorpusEntry(CORPUS, { archiveRef: 'a', era: 'LEGACY_BHAVCOPY', csvText: legacyCsv });
    for (const s of first.snapshots) store.append(s);
    const sizeBefore = store.size();
    // Identical re-admission: idempotent no-op.
    const again = admitCorpusEntry(CORPUS, { archiveRef: 'a', era: 'LEGACY_BHAVCOPY', csvText: legacyCsv });
    for (const s of again.snapshots) store.append(s);
    expect(store.size()).toBe(sizeBefore);
    // Conflicting payload at the SAME asOf: vintage ambiguity → refused, never overwritten.
    const conflicting = candleToPitSnapshot(
      { ...UnifiedHistoricalAdapter.parseAndNormalize(legacyCsv).candles[0]!, volume: 999_999 },
      CORPUS,
      { archiveRef: 'conflict', era: 'LEGACY_BHAVCOPY' },
    );
    expect(() => store.append(conflicting.snapshot!)).toThrowError(/vintage ambiguity/);
  });
});

describe('T3 — corpus admission is atomic (all-or-nothing)', () => {
  it('refuses the WHOLE corpus when one entry fails (no partial corpus is ever served)', () => {
    const r = buildCorpusSnapshots({
      ...CORPUS,
      entries: [
        { archiveRef: 'good-legacy', era: 'LEGACY_BHAVCOPY', csvText: legacyCsv },
        { archiveRef: 'era-violating', era: 'CM_UDIFF', csvText: udiffCsv.replace(/2024-07-15/g, '2024-07-01') },
      ],
    });
    expect(r.snapshots).toHaveLength(0); // the good entry is NOT admitted either
    expect(r.errors[0]?.code).toBe('D114-E4');
  });

  it('admits the WHOLE corpus only when every entry admits cleanly', () => {
    const r = buildCorpusSnapshots({
      ...CORPUS,
      entries: [
        { archiveRef: 'legacy', era: 'LEGACY_BHAVCOPY', csvText: legacyCsv },
        { archiveRef: 'udiff', era: 'CM_UDIFF', csvText: udiffCsv },
      ],
    });
    expect(r.errors).toHaveLength(0);
    expect(r.snapshots).toHaveLength(10);
  });

  it('rejects empty and schema-invalid content (D114-E1/D114-E2)', () => {
    expect(admitCorpusEntry(CORPUS, { archiveRef: 'e', era: 'CM_UDIFF', csvText: '   ' }).errors[0]?.code).toBe('D114-E1');
    expect(admitCorpusEntry(CORPUS, { archiveRef: 'e', era: 'CM_UDIFF', csvText: 'A,B\n1,2' }).errors[0]?.code).toBe('D114-E2');
  });
});
