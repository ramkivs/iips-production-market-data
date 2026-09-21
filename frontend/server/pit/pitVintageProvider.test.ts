/**
 * D-PIT-WIRE-01 — T2: PIT VINTAGE PROVIDER tests.
 *
 * Proves at the transport boundary (over the frozen P08 store):
 *   • strict PS-9 semantics: resolved asOf <= requested asOf, latest such vintage;
 *   • empty/unloaded store → null (fail-closed);
 *   • store error → null (fail-closed, never a substitute);
 *   • manifest loading: sha256 mismatch / era mismatch / path traversal / cap → corpus
 *     refused atomically, provider stays unbound;
 *   • successful load → bounded corpus bound, retrieval serves both eras.
 */
import { describe, it, expect } from 'vitest';
import {
  createPitVintageProvider,
  bindProviderCorpus,
  loadCorpusIntoProvider,
  getSharedPitVintageProvider,
  resetSharedPitVintageProvider,
} from './pitVintageProvider';
import { createPitStore } from './p08PitStore';
import type { PitSnapshot, PitStore } from './pitStorageModel';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';

const CORPUS_DIR = path.join(process.cwd(), 'server', 'pit', 'fixtures', 'corpus');

function snap(partial: { asOf: string; securityId?: string; close?: number; domain?: string }): PitSnapshot {
  const asOf = partial.asOf;
  return {
    snapshotId: `data-NSE_D114-d114-dualera-v1-${asOf}`,
    provider: 'NSE_D114',
    dataVersion: 'd114-dualera-v1',
    asOf,
    domain: partial.domain ?? 'D02',
    quality: 'good',
    securityId: partial.securityId ?? 'RELIANCE',
    mode: 'PIT',
    pitBoundary: asOf,
    payload: { close: partial.close ?? 100 },
  } as PitSnapshot;
}

function tmpCorpusDir(manifest: unknown, files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pit-corpus-'));
  fs.writeFileSync(path.join(dir, 'pit-corpus-manifest.json'), JSON.stringify(manifest));
  for (const [name, content] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), content);
  return dir;
}

/** Minimal single-file PKZIP accepted by the FROZEN D114 extractor (test-only bytes). */
function syntheticZip(filename: string, csv: string): Buffer {
  const content = Buffer.from(csv, 'utf8');
  const compressed = zlib.deflateRawSync(content);
  const name = Buffer.from(filename, 'utf8');
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0, 6);
  header.writeUInt16LE(8, 8);
  header.writeUInt32LE(compressed.length, 18);
  header.writeUInt32LE(content.length, 22);
  header.writeUInt16LE(name.length, 26);
  return Buffer.concat([header, name, compressed]);
}

describe('T2 — strict PS-9 asOf <= retrieval at the transport boundary', () => {
  it('resolves the LATEST vintage at or below the requested instant', () => {
    const p = createPitVintageProvider();
    bindProviderCorpus(p, 'ps9-test-corpus');
    for (const s of [
      snap({ asOf: '2024-07-05T09:15:00.000Z', close: 2931.1 }),
      snap({ asOf: '2024-07-07T09:15:00.000Z', close: 2940.85 }),
      snap({ asOf: '2024-07-08T09:15:00.000Z', close: 2951.2 }),
    ]) p.store.append(s);
    p.store.append({ ...snap({ asOf: '2024-07-08T09:15:00.000Z', close: 2951.2 }), securityId: 'TCS' } as PitSnapshot);

    const r = p.query('D02', 'RELIANCE', '2024-07-07T23:59:59.999Z');
    expect(r?.found).toBe(true);
    expect(r?.resolvedAsOf).toBe('2024-07-07T09:15:00.000Z');
    expect(r?.requestedAsOf).toBe('2024-07-07T23:59:59.999Z');
    expect((r?.snapshot.payload as { close: number }).close).toBeCloseTo(2940.85, 2);

    // exact-instant hit
    expect(p.query('D02', 'RELIANCE', '2024-07-08T09:15:00.000Z')?.resolvedAsOf).toBe('2024-07-08T09:15:00.000Z');
    // a query BEFORE the first vintage returns null — never a guess
    expect(p.query('D02', 'RELIANCE', '2016-09-19T00:00:00.000Z')).toBeNull();
    // series isolation
    expect(p.query('D02', 'TCS', '2024-07-07T23:59:59.999Z')).toBeNull();
    expect(p.query('D02', 'TCS', '2024-07-08T09:15:00.000Z')?.resolvedAsOf).toBe('2024-07-08T09:15:00.000Z');
    // a mid-range gap (no bar on 2024-07-06/07 for TCS) resolves BACKWARD under PS-9 —
    // the response always discloses resolvedAsOf so backward resolution is never hidden.
    expect(p.query('D02', 'TCS', '2024-07-07T23:59:59.999Z')).toBeNull(); // TCS has no vintage ≤ 07-07
    const backward = p.query('D02', 'RELIANCE', '2024-07-06T00:00:00.000Z');
    expect(backward?.resolvedAsOf).toBe('2024-07-05T09:15:00.000Z');
    expect(backward?.requestedAsOf).toBe('2024-07-06T00:00:00.000Z');
  });

  it('unloaded provider → null; store error → null (fail-closed, no substitute)', () => {
    const p = createPitVintageProvider();
    expect(p.isBound()).toBe(false);
    expect(p.query('D02', 'RELIANCE', '2024-07-08T09:15:00.000Z')).toBeNull();

    const throwingStore: PitStore = {
      append: () => {
        throw new Error('boom');
      },
      asOfQuery: () => {
        throw new Error('boom');
      },
      seriesOf: () => [],
      detectVintageAmbiguity: () => [],
      size: () => 0,
    };
    const broken = createPitVintageProvider({ store: throwingStore });
    expect(broken.query('D02', 'RELIANCE', '2024-07-08T09:15:00.000Z')).toBeNull();
  });
});

describe('T2 — corpus manifest loading is attested, era-checked and atomic', () => {
  it('loads the governed fixture corpus and serves BOTH eras', () => {
    const p = createPitVintageProvider();
    const r = loadCorpusIntoProvider(p, CORPUS_DIR);
    expect(r.ok).toBe(true);
    expect(r.corpusId).toBe('pit-fixture-corpus-v1');
    expect(r.snapshotsAppended).toBe(10);
    expect(p.isBound()).toBe(true);
    expect(p.query('D02', 'RELIANCE', '2024-07-07T15:30:00.000Z')?.snapshot.historicalProvenance).toMatchObject({ era: 'LEGACY_BHAVCOPY' });
    expect(p.query('D02', 'RELIANCE', '2024-07-08T15:30:00.000Z')?.snapshot.historicalProvenance).toMatchObject({ era: 'CM_UDIFF' });
    // Bounded corpus + D114 availability policy: a registered HTTP_404, holiday, weekend,
    // absent bounded-corpus date, or date outside coverage refuses BEFORE ordinary PS-9
    // backward resolution. No nearest-vintage substitution across a known/implicit gap.
    expect(p.query('D02', 'RELIANCE', '2024-07-10T15:30:00.000Z')).toBeNull();
    expect(p.query('D02', 'RELIANCE', '2024-07-11T15:30:00.000Z')).toBeNull();
    expect(p.query('D02', 'RELIANCE', '2024-07-13T15:30:00.000Z')).toBeNull();
    expect(p.query('D02', 'RELIANCE', '2024-07-09T15:30:00.000Z')).toBeNull();
    expect(p.query('D02', 'RELIANCE', '2024-07-16T15:30:00.000Z')).toBeNull();
    expect(p.query('D02', 'RELIANCE', '2023-12-28T15:30:00.000Z')).toBeNull();
    expect(p.corpusInfo()).toMatchObject({
      corpusKind: 'FIXTURE_CSV', loadedDates: 5, unavailableDates: 3,
      coverageStart: '2023-12-29', coverageEnd: '2024-07-15', evidenceValidated: false,
    });
  });

  it('refuses a corpus whose sha256 does not match the attested manifest', () => {
    const p = createPitVintageProvider();
    const manifest = JSON.parse(fs.readFileSync(path.join(CORPUS_DIR, 'pit-corpus-manifest.json'), 'utf8')) as {
      entries: { file: string; era: string; sha256?: string }[];
    };
    manifest.entries[0]!.sha256 = 'cd'.repeat(32);
    const dir = tmpCorpusDir(manifest, {
      'legacy-fixture.csv': fs.readFileSync(path.join(CORPUS_DIR, 'legacy-fixture.csv'), 'utf8'),
      'udiff-fixture.csv': fs.readFileSync(path.join(CORPUS_DIR, 'udiff-fixture.csv'), 'utf8'),
    });
    const r = loadCorpusIntoProvider(p, dir);
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/sha256 mismatch/);
    expect(p.isBound()).toBe(false);
  });

  it('refuses path traversal, unknown eras, malformed manifests and oversized corpora', () => {
    const base = {
      corpusId: 'c', provider: 'NSE_D114', dataVersion: 'v1',
      entries: [{ file: 'legacy-fixture.csv', era: 'LEGACY_BHAVCOPY' }],
    };
    const legacy = fs.readFileSync(path.join(CORPUS_DIR, 'legacy-fixture.csv'), 'utf8');
    expect(loadCorpusIntoProvider(createPitVintageProvider(), tmpCorpusDir(
      { ...base, entries: [{ file: '../evil.csv', era: 'LEGACY_BHAVCOPY' }] }, { 'evil.csv': legacy },
    )).errors[0]).toMatch(/bare file name/);
    expect(loadCorpusIntoProvider(createPitVintageProvider(), tmpCorpusDir(
      { ...base, entries: [{ file: 'legacy-fixture.csv', era: 'UNKNOWN_ERA' }] }, { 'legacy-fixture.csv': legacy },
    )).errors[0]).toMatch(/unknown era/);
    expect(loadCorpusIntoProvider(createPitVintageProvider(), tmpCorpusDir(
      { provider: 'BAD PROVIDER!', dataVersion: 'v1', corpusId: 'c', entries: base.entries }, { 'legacy-fixture.csv': legacy },
    )).errors[0]).toMatch(/provider/);
    expect(loadCorpusIntoProvider(createPitVintageProvider(), tmpCorpusDir(
      { ...base, entries: [] }, {},
    )).errors[0]).toMatch(/non-empty array/);
    const p = createPitVintageProvider();
    const r = loadCorpusIntoProvider(p, CORPUS_DIR, { maxRecords: 5 });
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/bounded-corpus cap/);
    expect(p.isBound()).toBe(false);
  });
});

describe('T2/W1 preparation — physical D114 archive mode uses the governed handoff', () => {
  const legacyFile = 'cm05JUL2024bhav.csv.zip';
  const udiffFile = 'BhavCopy_NSE_CM_0_0_0_20240708_F_0000.csv.zip';
  const legacyHash = 'e08c8c0650e6807f8b1abd0658bc8d87cbe2d78c2fc77e05c82878f30be46665';
  const udiffHash = '0ef55b77c30c8a57d5451cd371424242ad515f708630736ea6dc44c38d6e1e85';
  const legacyCsv = `SYMBOL,SERIES,OPEN,HIGH,LOW,CLOSE,LAST,PREVCLOSE,TOTTRDQTY,TOTTRDVAL,TIMESTAMP,TOTALTRADES,ISIN\nRELIANCE,EQ,2912.00,2935.75,2906.40,2931.10,2930.50,2869.35,4810200,14083412760.00,05-JUL-2024,131570,INE002A01018`;
  const udiffCsv = `TradDt,BizDt,Sgmt,Src,ISIN,TckrSymb,SctySrs,ClsPric,LastPric,PrvsClsgPric,SttlmPric,OpnPric,HghPric,LwPric,TtlTradgVol\n2024-07-08,2024-07-08,CM,NSE,INE002A01018,RELIANCE,EQ,2951.20,2951.00,2940.85,2950.75,2944.00,2962.00,2938.10,4398120`;

  function physicalManifest() {
    return {
      corpusId: 'windows-d114-bounded-two-era',
      corpusKind: 'D114_ARCHIVE',
      provider: 'NSE_D114',
      dataVersion: 'd114-dualera-v1',
      archiveRoots: {
        LEGACY_BHAVCOPY: 'C:\\IIPS_Data\\NSE_Legacy_Acquisition\\archives',
        CM_UDIFF: 'C:\\IIPS_Data\\NSE_CM_UDiFF_10Y\\archives',
      },
      evidenceIntakes: [
        { era: 'LEGACY_BHAVCOPY', directory: path.resolve(process.cwd(), '..', 'evidence', 'd114-legacy') },
        { era: 'CM_UDIFF', directory: path.resolve(process.cwd(), '..', 'evidence', 'd114') },
      ],
      entries: [
        { file: legacyFile, source: 'ZIP', era: 'LEGACY_BHAVCOPY', tradeDate: '2024-07-05' },
        { file: udiffFile, source: 'ZIP', era: 'CM_UDIFF', tradeDate: '2024-07-08' },
      ],
    };
  }

  const archives: Record<string, Buffer> = {
    [legacyFile]: syntheticZip('cm05JUL2024bhav.csv', legacyCsv),
    [udiffFile]: syntheticZip('BhavCopy_NSE_CM_0_0_0_20240708_F_0000.csv', udiffCsv),
  };
  const governedHashes: Record<string, string> = { [legacyFile]: legacyHash, [udiffFile]: udiffHash };

  it('accepts BOTH evidence packages, verifies their SHA entries, and admits both archive eras', () => {
    const dir = tmpCorpusDir(physicalManifest(), {});
    const p = createPitVintageProvider();
    const r = loadCorpusIntoProvider(p, dir, {
      // Test injection supplies tiny ZIP bytes while the SHA callback supplies the matching
      // deposited D114 archive hash. Default production paths read/hash the real files.
      readBuffer: (archivePath) => archives[path.basename(archivePath)]!,
      sha256OfFile: (archivePath) => governedHashes[path.basename(archivePath)]!,
    });
    expect(r).toMatchObject({ ok: true, snapshotsAppended: 2, corpusId: 'windows-d114-bounded-two-era' });
    expect(p.corpusInfo()).toMatchObject({
      corpusKind: 'D114_ARCHIVE', evidenceValidated: true, loadedDates: 2,
      coverageStart: '2016-09-20', coverageEnd: '2026-09-18',
    });
    expect(p.corpusInfo().unavailableDates).toBeGreaterThan(100); // 94+34 failures + weekends/holidays in era windows

    const legacy = p.query('D02', 'RELIANCE', '2024-07-05T15:30:00.000Z');
    const udiff = p.query('D02', 'RELIANCE', '2024-07-08T15:30:00.000Z');
    expect(legacy?.snapshot.historicalProvenance).toMatchObject({
      era: 'LEGACY_BHAVCOPY', sha256: legacyHash,
      acquisitionManifestId: expect.stringMatching(/^d114-manifest-/),
      intakeLineageDigest: expect.stringMatching(/^[0-9a-f]{64}$/),
    });
    expect(udiff?.snapshot.historicalProvenance).toMatchObject({
      era: 'CM_UDIFF', sha256: udiffHash,
      acquisitionManifestId: expect.stringMatching(/^d114-manifest-/),
      intakeLineageDigest: expect.stringMatching(/^[0-9a-f]{64}$/),
    });
    const hp = udiff?.snapshot.historicalProvenance as Record<string, unknown>;
    expect(hp.sha256ManifestEntry).toMatchObject({ date: '2024-07-08', filename: udiffFile, sha256: udiffHash });

    // Bounded means bounded: a real acquired date omitted from this boot corpus is unavailable,
    // as are a deposited HTTP_404 day, weekend, pre-range and post-range instants.
    expect(p.query('D02', 'RELIANCE', '2024-07-09T15:30:00.000Z')).toBeNull();
    expect(p.query('D02', 'RELIANCE', '2023-04-07T15:30:00.000Z')).toBeNull();
    expect(p.query('D02', 'RELIANCE', '2024-07-13T15:30:00.000Z')).toBeNull();
    expect(p.query('D02', 'RELIANCE', '2016-09-19T15:30:00.000Z')).toBeNull();
    expect(p.query('D02', 'RELIANCE', '2026-09-19T15:30:00.000Z')).toBeNull();
  });

  it('refuses physical mode when evidence intake, archive SHA, one era, or record date is wrong', () => {
    const noIntake = physicalManifest();
    noIntake.evidenceIntakes = [];
    expect(loadCorpusIntoProvider(createPitVintageProvider(), tmpCorpusDir(noIntake, {})).errors[0]).toMatch(/evidence intake/);

    const oneEra = physicalManifest();
    oneEra.entries = oneEra.entries.slice(0, 1);
    expect(loadCorpusIntoProvider(createPitVintageProvider(), tmpCorpusDir(oneEra, {})).errors[0]).toMatch(/BOTH physical eras/);

    const dir = tmpCorpusDir(physicalManifest(), {});
    const hashFail = loadCorpusIntoProvider(createPitVintageProvider(), dir, {
      readBuffer: (archivePath) => archives[path.basename(archivePath)]!,
      sha256OfFile: () => '00'.repeat(32),
    });
    expect(hashFail.ok).toBe(false);
    expect(hashFail.errors[0]).toMatch(/sha256 mismatch/);

    const badDate = physicalManifest();
    badDate.entries[0] = { ...badDate.entries[0]!, tradeDate: '2024-07-08' };
    expect(loadCorpusIntoProvider(createPitVintageProvider(), tmpCorpusDir(badDate, {}), {
      readBuffer: (archivePath) => archives[path.basename(archivePath)]!,
      sha256OfFile: (archivePath) => governedHashes[path.basename(archivePath)]!,
    }).errors[0]).toMatch(/outside LEGACY_BHAVCOPY window/);
  });
});

describe('T2 — shared transport singleton is fail-closed by default', () => {
  it('returns null (unbound) without IIPS_PIT_CORPUS_DIR; never throws', () => {
    resetSharedPitVintageProvider();
    const previous = process.env.IIPS_PIT_CORPUS_DIR;
    delete process.env.IIPS_PIT_CORPUS_DIR;
    try {
      expect(getSharedPitVintageProvider()).toBeNull();
    } finally {
      if (previous !== undefined) process.env.IIPS_PIT_CORPUS_DIR = previous;
      resetSharedPitVintageProvider();
    }
  });

  it('binds when IIPS_PIT_CORPUS_DIR names a valid corpus; stays null on a bad corpus', () => {
    resetSharedPitVintageProvider();
    const previous = process.env.IIPS_PIT_CORPUS_DIR;
    try {
      process.env.IIPS_PIT_CORPUS_DIR = CORPUS_DIR;
      const p = getSharedPitVintageProvider();
      expect(p?.isBound()).toBe(true);
      expect(p?.query('D02', 'TCS', '2024-07-15T23:59:59.999Z')?.resolvedAsOf).toBe('2024-07-15T09:15:00.000Z');

      resetSharedPitVintageProvider();
      const bad = tmpCorpusDir({ corpusId: 'x', provider: 'NSE_D114', dataVersion: 'v1', entries: [{ file: 'missing.csv', era: 'CM_UDIFF' }] }, {});
      process.env.IIPS_PIT_CORPUS_DIR = bad;
      expect(getSharedPitVintageProvider()).toBeNull();
    } finally {
      if (previous !== undefined) process.env.IIPS_PIT_CORPUS_DIR = previous;
      else delete process.env.IIPS_PIT_CORPUS_DIR;
      resetSharedPitVintageProvider();
    }
  });
});
