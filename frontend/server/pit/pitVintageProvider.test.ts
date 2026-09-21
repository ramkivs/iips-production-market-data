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
    expect(p.query('D02', 'RELIANCE', '2024-07-07T00:00:00.000Z')?.snapshot.historicalProvenance).toMatchObject({ era: 'LEGACY_BHAVCOPY' });
    expect(p.query('D02', 'RELIANCE', '2024-07-09T00:00:00.000Z')?.snapshot.historicalProvenance).toMatchObject({ era: 'CM_UDIFF' });
    // PS-9 truth: a requested date carrying no bar resolves BACKWARD to the latest earlier
    // vintage (disclosed via resolvedAsOf) — never interpolated, never substituted with a
    // different series. Fail-closed applies when NO vintage exists at or below the instant.
    const backward = p.query('D02', 'RELIANCE', '2024-07-10T00:00:00.000Z');
    expect(backward?.resolvedAsOf).toBe('2024-07-08T09:15:00.000Z');
    expect(p.query('D02', 'RELIANCE', '2016-09-19T00:00:00.000Z')).toBeNull();
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
