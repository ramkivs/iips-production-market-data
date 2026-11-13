// W04 identity coverage — read-only probe of the TRACKED IPD identity sources.
//
// What it is: a census of the governed P04 security master and the retained P7
// qualification manifest as tracked in this checkout, run through the unmodified
// compiled application functions. It reads tracked files only.
//
// What it is not: it reads no database, no portfolio, no capture and no host
// state, opens no socket and writes nothing. Every input row is an entry of the
// tracked P04 master itself. It says nothing about any actual holding.
//
// Output: counts and source digests only. No ISIN, symbol or company is printed.
//
// Run from the repository root after `npm run build:tsc`:
//   node evidence/integration/w04-identity-coverage-2026-11-13/ipd-identity-source-probe.mjs
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const dist = (p) => new URL(`../../../dist/src/${p}`, import.meta.url).href;
const { getGovernedBroadSecurityMaster } = await import(dist('identity/governed_fixture_master.js'));
const { createGovernedBrokerObservationResolver } = await import(dist('identity/broker_observation_resolver.js'));
const { composeBrokerImportIdentityDependencies } = await import(dist('ipc/brokerImportComposition.js'));
const { qualifyHoldingSecurityIdentity } = await import(dist('providers/dhan/dhan_security_identity_service.js'));
const { DhanInstrumentRegistry } = await import(dist('providers/dhan/dhan_instrument_map.js'));
const { mapBrokerImportHoldings } = await import(dist('persistence/brokerImportPersistence.js'));

const bump = (o, k) => { o[k] = (o[k] ?? 0) + 1; };
const sorted = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));

// ---- P04 security master -------------------------------------------------
const master = getGovernedBroadSecurityMaster();
const entities = master.listAllCompanyIds().map((id) => master.getEntity(id));
const p04Isins = new Set(entities.map((e) => e.isin));
const listingsByExchangeStatus = {};
for (const e of entities) for (const l of e.listings) bump(listingsByExchangeStatus, `${l.exchange}:${l.status}`);

// ---- P7 qualification manifest ------------------------------------------
const manifestPath = fileURLToPath(new URL('../../dhan-p7/qualification-manifest.json', import.meta.url));
const manifestBytes = readFileSync(manifestPath);
const manifest = JSON.parse(manifestBytes.toString('utf8'));
const deps = composeBrokerImportIdentityDependencies();
const mappings = deps.registry.list();
const registryIsins = [...new Set(mappings.map((m) => m.isin))];
const bySegmentSeries = {}; const byProvenance = {}; const byActive = {};
for (const m of mappings) {
  bump(bySegmentSeries, `${m.exchangeSegment}:${String(m.securityId).split(':')[2]}`);
  bump(byProvenance, m.mappingProvenance);
  bump(byActive, String(m.active));
}

// ---- Security-level qualification, exhaustively --------------------------
const outcome = (isin, exchange) => {
  const q = qualifyHoldingSecurityIdentity({ isin, exchange }, deps.securityMaster, deps.registry);
  return q.status === 'QUALIFIED' ? `QUALIFIED:${q.securityIdentity.series}:${q.isinAuthority}` : q.reason;
};
const registryOutcomes = {}; const allOutcomes = {}; const qualifyingIsins = new Set();
for (const isin of registryIsins) for (const ex of ['NSE', 'BSE']) {
  const o = outcome(isin, ex); bump(registryOutcomes, `${ex}:${o}`);
  if (o.startsWith('QUALIFIED')) qualifyingIsins.add(isin);
}
for (const e of entities) for (const l of e.listings) bump(allOutcomes, `${l.exchange}:${outcome(e.isin, l.exchange).split(':')[0]}`);
// Registry ISINs that do not qualify: does the registry company equal the P04 company for the ISIN?
let registryCompanyDiffersFromP04 = 0;
for (const isin of registryIsins) {
  if (qualifyingIsins.has(isin)) continue;
  const p04Company = master.resolveCompanyId({ identifierType: 'ISIN', identifierValue: isin });
  if (mappings.filter((m) => m.isin === isin).every((m) => m.companyId !== p04Company)) registryCompanyDiffersFromP04 += 1;
}

// ---- Company-level gate (the source of RESOLVED / CANONICAL_P04) ----------
const resolver = createGovernedBrokerObservationResolver();
const asOf = '2026-11-13T00:00:00.000Z';
const gate = {};
for (const e of entities) for (const l of e.listings) for (const withIsin of [true, false]) {
  const r = resolver.resolve({ symbol: l.symbol, exchange: l.exchange, ...(withIsin ? { isin: e.isin } : {}) }, asOf);
  bump(gate, `${l.exchange}|isinSupplied=${withIsin}|${r.status}`);
}
const noExchange = resolver.resolve({ symbol: entities[0].listings[0].symbol, isin: entities[0].isin }, asOf);

// ---- What mapBrokerImportHoldings persists, per input shape ---------------
const nseRows = (shape) => entities.filter((e) => e.listings.some((l) => l.exchange === 'NSE')).map((e) => ({
  symbol: e.listings.find((l) => l.exchange === 'NSE').symbol, exchange: 'NSE',
  ...(shape.isin ? { isin: e.isin } : {}), ...(shape.series ? { series: shape.series } : {}),
  quantity: 1, averageBuyPrice: 1, currentPrice: 1, marketValue: 1, weightPercentage: 0, active: true,
  sourceBroker: 'probe', lineageDigest: 'probe', companyId: e.companyId,
  identityStatus: 'RESOLVED', resolutionDisposition: 'CANONICAL_P04',
}));
const populated = (rows, options) => {
  const out = mapBrokerImportHoldings(rows, options);
  const n = out.filter((h) => h.securityIdentity !== null && h.securityIdentity !== undefined).length;
  return { rows: out.length, securityIdentityPopulated: n, securityIdentityNull: out.length - n };
};
const governed = { securityMaster: deps.securityMaster, registry: deps.registry };
const emptyRegistry = { securityMaster: deps.securityMaster, registry: new DhanInstrumentRegistry() };

const result = {
  probe: 'iips.w04.ipd-identity-source-probe/v1',
  scope: 'tracked IPD sources only; no portfolio, capture, database or host state',
  p04SecurityMaster: {
    sourceRevision: master.sourceRevision,
    entities: entities.length,
    distinctIsins: p04Isins.size,
    listingsByExchangeStatus: sorted(listingsByExchangeStatus),
    entitiesWithEffectiveTo: entities.filter((e) => e.effectiveTo !== undefined).length,
    latestEffectiveFrom: entities.map((e) => e.effectiveFrom).sort().slice(-1)[0],
  },
  p7QualificationManifest: {
    path: 'evidence/dhan-p7/qualification-manifest.json',
    sha256: createHash('sha256').update(manifestBytes).digest('hex'),
    bytes: manifestBytes.length,
    task: manifest.task,
    generatedAtUtc: manifest.generatedAtUtc,
    pipelineCommit: manifest.pipelineCommit,
    sources: manifest.sources.map((s) => ({ filename: s.filename, retrievedAtUtc: s.retrievedAtUtc, sha256: s.sha256, sha256Verified: s.sha256Verified, dataRows: s.dataRows })),
    declaredTotals: manifest.totals,
    declaredCountsByDisposition: manifest.countsByDisposition,
    declaredCoverageByExchangeSeries: manifest.coverageByExchangeSeries,
  },
  p7RegistryAsLoaded: {
    mappings: mappings.length,
    distinctIsins: registryIsins.length,
    distinctCompanies: new Set(mappings.map((m) => m.companyId)).size,
    bySegmentSeries: sorted(bySegmentSeries),
    byProvenance: sorted(byProvenance),
    byActive: sorted(byActive),
    distinctLastVerifiedAt: [...new Set(mappings.map((m) => m.lastVerifiedAt))].sort(),
  },
  securityQualification: {
    registryIsinsByExchange: sorted(registryOutcomes),
    distinctIsinsThatQualify: qualifyingIsins.size,
    registryIsinsThatDoNotQualify: registryIsins.length - qualifyingIsins.size,
    ofThoseRegistryCompanyDiffersFromP04Company: registryCompanyDiffersFromP04,
    everyP04IsinOnEveryP04ListedExchange: sorted(allOutcomes),
  },
  companyLevelGate: {
    note: 'the gate that stamps identityStatus=RESOLVED / resolutionDisposition=CANONICAL_P04',
    everyP04Listing: sorted(gate),
    symbolWithoutExchange: `${noExchange.status}:${String(noExchange.reason ?? '').split(':')[0]}`,
  },
  persistedSecurityIdentityByInputShape: {
    note: 'every P04 entity with an NSE listing, passed to mapBrokerImportHoldings as an already company-resolved row',
    governedDeps_isinSupplied: populated(nseRows({ isin: true }), governed),
    governedDeps_isinNotSupplied: populated(nseRows({ isin: false }), governed),
    governedDeps_isinNotSupplied_seriesSupplied: populated(nseRows({ isin: false, series: 'EQ' }), governed),
    emptyRegistry_isinSupplied: populated(nseRows({ isin: true }), emptyRegistry),
    noDeps_isinSupplied_noSeries: populated(nseRows({ isin: true }), {}),
    noDeps_isinSupplied_seriesSupplied: populated(nseRows({ isin: true, series: 'EQ' }), {}),
  },
};
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
