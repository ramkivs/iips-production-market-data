// W04 C4/C5 — read-only probe of the series evidence already tracked in IPD.
//
// What it is: the unmodified compiled P7 qualification function, run in memory over the
// TRACKED Dhan instrument-master snapshot (retrieved 2026-11-06), once against the legacy
// 2,250-record P04 master that the retained P7 manifest was generated with, and once
// against the 2,390-record P04 master the application composes today. It then compares the
// result with the two exchange files in the tracked D05 Wave-3 source bundle.
//
// What it is not: it does not regenerate, replace or load any registry for the application,
// writes no file, opens no socket, reads no database, portfolio, capture or host state, and
// qualifies no holding. Every input row is an entry of a tracked source file. It says
// nothing about any actual holding.
//
// Output: counts and source digests only. No ISIN, symbol or company is printed.
//
// Run from the repository root after `npm ci && npm run build:tsc` (needs `unzip` on PATH):
//   node evidence/integration/w04-c4-c5-identifier-supply-2026-11-14/p7-series-evidence-probe.mjs
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const dist = (p) => new URL(`../../../dist/src/${p}`, import.meta.url).href;
const repo = (p) => fileURLToPath(new URL(`../../../${p}`, import.meta.url));
const dhan = await import(dist('providers/dhan/index.js'));
const gm = await import(dist('identity/governed_fixture_master.js'));
const { qualifyHoldingSecurityIdentity } = await import(dist('providers/dhan/dhan_security_identity_service.js'));
const { composeBrokerImportIdentityDependencies } = await import(dist('ipc/brokerImportComposition.js'));

const bump = (o, k) => { o[k] = (o[k] ?? 0) + 1; };
const sorted = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
const sha256 = (b) => createHash('sha256').update(b).digest('hex');

// ---- Tracked Dhan snapshot ------------------------------------------------
const retrieval = JSON.parse(readFileSync(repo('evidence/dhan-p7/source-retrieval-manifest.json'), 'utf8').replace(/^\uFEFF/, ''));
const detailedMeta = retrieval.files.find((f) => f.filename === 'api-scrip-master-detailed.csv');
const detailedBytes = readFileSync(repo('evidence/dhan-p7/source/api-scrip-master-detailed.csv'));
const parsed = dhan.parseInstrumentMasterCsv(detailedBytes.toString('utf8'), dhan.DETAILED_REQUIRED_COLUMNS);
if (parsed.schemaError) throw new Error(parsed.schemaError);
const sourceEvidence = {
  url: detailedMeta.sourceUrl, retrievedAtUtc: detailedMeta.retrievedAtUtc, httpStatus: 200, contentType: 'text/csv',
  contentLength: detailedMeta.sizeBytes, rawSha256: sha256(detailedBytes), byteSize: detailedMeta.sizeBytes, ok: true,
};

// ---- Retained manifest (what the application loads) ------------------------
const retainedBytes = readFileSync(repo('evidence/dhan-p7/qualification-manifest.json'));
const retained = JSON.parse(retainedBytes.toString('utf8'));
// Registry entry key: companyId|exchangeSegment|ISIN:<isin>:<series>
const parts = (entry) => {
  const [companyId, segment, securityId] = String(entry).split('|');
  const [, isin, series] = securityId.split(':');
  return { companyId, segment, isin, series };
};

// ---- Re-qualification in memory -------------------------------------------
function requalify(master) {
  const { manifest, registry } = dhan.qualifyInstrumentMaster(parsed, master, sourceEvidence);
  const entries = manifest.registryEntries.map(parts);
  const exchangesByIsin = new Map(); const seriesByPair = new Map();
  for (const e of entries) {
    exchangesByIsin.set(e.isin, (exchangesByIsin.get(e.isin) ?? new Set()).add(e.segment));
    const k = `${e.isin}|${e.segment}`; seriesByPair.set(k, (seriesByPair.get(k) ?? new Set()).add(e.series));
  }
  let both = 0; let nseOnly = 0; let bseOnly = 0;
  for (const s of exchangesByIsin.values()) {
    if (s.has('NSE_EQ') && s.has('BSE_EQ')) both += 1; else if (s.has('NSE_EQ')) nseOnly += 1; else bseOnly += 1;
  }
  return {
    registry, entryKeys: new Set(manifest.registryEntries.map(String)), entries, seriesByPair,
    summary: {
      detailedRows: manifest.totalRows, equityCandidates: manifest.equityCandidates, qualifiedMappings: manifest.qualified,
      countsByDisposition: sorted(manifest.counts), coverageByExchangeSeries: sorted(manifest.coverageByExchangeSeries),
      distinctQualifiedIsins: exchangesByIsin.size, isinsOnBothExchanges: both, isinsNseOnly: nseOnly, isinsBseOnly: bseOnly,
      isinExchangePairs: seriesByPair.size,
      isinExchangePairsWithMoreThanOneSeries: [...seriesByPair.values()].filter((s) => s.size > 1).length,
    },
  };
}
const legacyMaster = gm.getGovernedLegacyWave1SecurityMaster();
const currentMaster = gm.getGovernedBroadSecurityMaster();
const legacy = requalify(legacyMaster);
const current = requalify(currentMaster);
const retainedKeys = retained.registryEntries.map(String);
const retainedIsins = new Set(retained.registryEntries.map((e) => parts(e).isin));

// ---- Holding-level qualification over every P04 ISIN and listing -----------
// The input rows are the P04 master's own entities, exactly as in the 2026-11-13 probe.
const entities = currentMaster.listAllCompanyIds().map((id) => currentMaster.getEntity(id));
const loaded = composeBrokerImportIdentityDependencies();
function census(registry) {
  const out = {}; const qualifiedIsins = new Set();
  for (const e of entities) for (const l of e.listings) {
    const q = qualifyHoldingSecurityIdentity({ isin: e.isin, exchange: l.exchange }, currentMaster, registry);
    bump(out, `${l.exchange}:${q.status === 'QUALIFIED' ? `QUALIFIED:${q.securityIdentity.series}:${q.isinAuthority}` : q.reason}`);
    if (q.status === 'QUALIFIED') qualifiedIsins.add(e.isin);
  }
  return { byExchangeAndOutcome: sorted(out), distinctQualifiedIsins: qualifiedIsins.size };
}

// ---- Exchange files in the tracked D05 Wave-3 bundle ----------------------
const bundlePath = repo('evidence/D05-Wave3/D05_Wave3_EQ_Source_and_Evidence_Bundle_2026-11-07.zip');
const member = (name) => execFileSync('unzip', ['-p', bundlePath, name], { maxBuffer: 1 << 28 });
function csv(text) {
  const rows = []; let row = []; let cell = ''; let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quoted) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i += 1; } else quoted = false; } else cell += c; continue; }
    if (c === '"') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (c !== '\r') cell += c;
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  const header = rows[0].map((h) => h.replace(/^\uFEFF/, '').trim());
  // The BSE member carries empty trailing cells on its data rows, so a row may be longer than the header.
  return rows.slice(1).filter((r) => r.length >= header.length)
    .map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? '').trim()])));
}
const nseBytes = member('01_source_material/NSE/EQUITY_L(1).csv');
const bseBytes = member('01_source_material/BSE/BSE_ACTIVE_EQUITY_original.csv');
const nseRows = csv(nseBytes.toString('utf8'));
const bseRows = csv(bseBytes.toString('utf8'));
const nseSeriesByIsin = new Map(); const nseSeriesCounts = {};
for (const r of nseRows) { bump(nseSeriesCounts, r.SERIES); nseSeriesByIsin.set(r['ISIN NUMBER'], (nseSeriesByIsin.get(r['ISIN NUMBER']) ?? new Set()).add(r.SERIES)); }
const bseGroupByIsin = new Map(); const bseGroupCounts = {};
for (const r of bseRows) bump(bseGroupCounts, r.Group);
for (const r of bseRows) bseGroupByIsin.set(r['ISIN No'], (bseGroupByIsin.get(r['ISIN No']) ?? new Set()).add(r.Group));
// Row-level comparison: the vendor series of each re-qualified mapping against the exchange file's own value.
const agreement = { NSE_EQ: {}, BSE_EQ: {} };
for (const e of current.entries) {
  const official = e.segment === 'NSE_EQ' ? nseSeriesByIsin.get(e.isin) : bseGroupByIsin.get(e.isin);
  const verdict = !official ? 'ISIN_ABSENT_FROM_EXCHANGE_FILE'
    : official.size > 1 ? 'EXCHANGE_FILE_HAS_MORE_THAN_ONE_VALUE'
      : official.has(e.series) ? 'SAME_VALUE' : 'DIFFERENT_VALUE';
  bump(agreement[e.segment], verdict);
}

const output = {
  inputs: {
    dhanDetailedSnapshot: {
      path: 'evidence/dhan-p7/source/api-scrip-master-detailed.csv', sha256: sha256(detailedBytes),
      sha256EqualsRetrievalManifest: sha256(detailedBytes).toUpperCase() === String(detailedMeta.sha256).toUpperCase(),
      retrievedAtUtc: detailedMeta.retrievedAtUtc, rows: parsed.records.length,
    },
    retainedManifest: {
      path: 'evidence/dhan-p7/qualification-manifest.json', sha256: sha256(retainedBytes), generatedAtUtc: retained.generatedAtUtc,
      pipelineCommit: retained.pipelineCommit, registryEntries: retainedKeys.length, distinctIsins: retainedIsins.size,
    },
    legacyMaster: legacyMaster.sourceRevision, currentMaster: currentMaster.sourceRevision,
    wave3Bundle: {
      path: 'evidence/D05-Wave3/D05_Wave3_EQ_Source_and_Evidence_Bundle_2026-11-07.zip', sha256: sha256(readFileSync(bundlePath)),
      nseMember: { name: '01_source_material/NSE/EQUITY_L(1).csv', sha256: sha256(nseBytes), rows: nseRows.length, rowsBySeries: sorted(nseSeriesCounts) },
      bseMember: { name: '01_source_material/BSE/BSE_ACTIVE_EQUITY_original.csv', sha256: sha256(bseBytes), rows: bseRows.length, rowsByGroup: sorted(bseGroupCounts) },
    },
  },
  requalifiedAgainstLegacyMaster: legacy.summary,
  requalifiedAgainstCurrentMaster: current.summary,
  retainedManifestComparedWithRequalification: {
    retainedEntriesEqualLegacyRequalification: retainedKeys.length === legacy.entryKeys.size && retainedKeys.every((k) => legacy.entryKeys.has(k)),
    retainedEntriesPresentUnchangedInCurrentRequalification: retainedKeys.filter((k) => current.entryKeys.has(k)).length,
    retainedEntriesAbsentFromCurrentRequalification: retainedKeys.filter((k) => !current.entryKeys.has(k)).length,
    retainedIsinsPresentInCurrentRequalification: [...retainedIsins].filter((i) => current.entries.some((e) => e.isin === i)).length,
  },
  holdingLevelQualificationOverEveryP04Listing: {
    p04Entities: entities.length, p04Listings: entities.reduce((n, e) => n + e.listings.length, 0),
    withRegistryLoadedByTheApplication: { mappings: loaded.registry.list().length, ...census(loaded.registry) },
    withInMemoryRequalifiedRegistry: { mappings: current.registry.list().length, ...census(current.registry) },
  },
  vendorSeriesComparedWithExchangeFiles: { NSE_EQ: sorted(agreement.NSE_EQ), BSE_EQ: sorted(agreement.BSE_EQ) },
};
process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
