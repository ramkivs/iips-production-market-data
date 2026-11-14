// W04 C4/C5 — read-only probe of the identifier columns of the broker files TRACKED in IRR.
//
// What it is: for each file under IRR `evidence/broker-import/operator-supplied/`, which
// identifier columns the header has, and what the unmodified compiled IPD functions return
// for its rows: the IPC company gate, and the security qualification with (a) the registry
// the application loads and (b) the in-memory re-qualified registry of the sibling probe.
//
// What it is not: these files are tracked repository evidence. NO LINK between any of them
// and the captured portfolio revision 1 is established, and none is inferred here. The probe
// reads no database, capture or host state, writes no file, opens no socket, and assigns no
// identifier to anything.
//
// Output: counts and file digests only. No symbol, ISIN, company, quantity or value is printed.
//
// Run from the IPD repository root after `npm ci && npm run build:tsc`:
//   node evidence/integration/w04-c4-c5-identifier-supply-2026-11-14/tracked-broker-file-identifier-probe.mjs <IRR checkout root>
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const irrRoot = resolve(process.argv[2] ?? '');
const dist = (p) => new URL(`../../../dist/src/${p}`, import.meta.url).href;
const repo = (p) => fileURLToPath(new URL(`../../../${p}`, import.meta.url));
const dhan = await import(dist('providers/dhan/index.js'));
const gm = await import(dist('identity/governed_fixture_master.js'));
const { createGovernedBrokerObservationResolver } = await import(dist('identity/broker_observation_resolver.js'));
const { qualifyHoldingSecurityIdentity } = await import(dist('providers/dhan/dhan_security_identity_service.js'));
const { composeBrokerImportIdentityDependencies } = await import(dist('ipc/brokerImportComposition.js'));

const bump = (o, k) => { o[k] = (o[k] ?? 0) + 1; };
const sorted = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
const sha256 = (b) => createHash('sha256').update(b).digest('hex');

const master = gm.getGovernedBroadSecurityMaster();
const gate = createGovernedBrokerObservationResolver();
const loaded = composeBrokerImportIdentityDependencies().registry;
// The same in-memory re-qualification as p7-series-evidence-probe.mjs. Nothing is written.
const retrieval = JSON.parse(readFileSync(repo('evidence/dhan-p7/source-retrieval-manifest.json'), 'utf8').replace(/^\uFEFF/, ''));
const meta = retrieval.files.find((f) => f.filename === 'api-scrip-master-detailed.csv');
const detailed = readFileSync(repo('evidence/dhan-p7/source/api-scrip-master-detailed.csv'));
const parsed = dhan.parseInstrumentMasterCsv(detailed.toString('utf8'), dhan.DETAILED_REQUIRED_COLUMNS);
if (parsed.schemaError) throw new Error(parsed.schemaError);
const requalified = dhan.qualifyInstrumentMaster(parsed, master, {
  url: meta.sourceUrl, retrievedAtUtc: meta.retrievedAtUtc, httpStatus: 200, contentType: 'text/csv',
  contentLength: meta.sizeBytes, rawSha256: sha256(detailed), byteSize: meta.sizeBytes, ok: true,
}).registry;

// IRR's wire rule for a holding symbol (frontend/server/broker-import/brokerImportStage4.ts).
const WIRE_SYMBOL = /^[A-Za-z0-9][A-Za-z0-9._&-]{0,39}$/;
const asOf = '2026-11-14T00:00:00.000Z';

function cells(line) {
  const out = []; let cell = ''; let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (quoted) { if (c === '"') { if (line[i + 1] === '"') { cell += '"'; i += 1; } else quoted = false; } else cell += c; continue; }
    if (c === '"') quoted = true; else if (c === ',') { out.push(cell.trim()); cell = ''; } else cell += c;
  }
  out.push(cell.trim()); return out;
}

function probe(name) {
  const path = join(irrRoot, 'evidence/broker-import/operator-supplied', name);
  const bytes = readFileSync(path);
  const lines = bytes.toString('utf8').replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.length > 0);
  const header = cells(lines[0]);
  const col = (...names) => header.findIndex((h) => names.includes(h.toLowerCase()));
  const symbolCol = col('trading symbol', 'instrument', 'name');
  const isinCol = col('isin'); const exchangeCol = col('exchange');
  // Exchange as the IPD adapters assign it: the Dhan adapter reads an Exchange column only;
  // the Zerodha adapter assigns NSE unless the instrument is prefixed `BSE:`.
  const zerodha = header.some((h) => h.toLowerCase() === 'instrument');
  const exchangeOf = (row) => {
    if (exchangeCol >= 0) return row[exchangeCol] ? (row[exchangeCol].toUpperCase().includes('BSE') ? 'BSE' : 'NSE') : undefined;
    if (zerodha) return row[symbolCol].startsWith('BSE:') ? 'BSE' : 'NSE';
    return undefined;
  };
  const rows = lines.slice(1).map(cells);
  const out = {
    file: `evidence/broker-import/operator-supplied/${name}`, sha256: sha256(bytes), dataRows: rows.length,
    header: { columns: header.filter((h) => h.length > 0).length, hasIsinColumn: isinCol >= 0, hasExchangeColumn: exchangeCol >= 0, hasSeriesColumn: col('series') >= 0 },
    exchangeAssignedBy: exchangeCol >= 0 ? 'FILE_COLUMN' : zerodha ? 'ADAPTER_DEFAULT' : 'NONE',
    rowsWithIsin: 0, rowsByExchange: {}, rowsWithWireValidSymbol: 0,
    ipcCompanyGate: {}, ipcCompanyGateRefusalByReason: {},
    securityQualificationOfRowsWithIsinAndExchange: { rows: 0, withRegistryLoadedByTheApplication: {}, withInMemoryRequalifiedRegistry: {} },
    ofRowsPassingTheCompanyGate: { rows: 0, withRegistryLoadedByTheApplication: {}, withInMemoryRequalifiedRegistry: {} },
  };
  const outcome = (isin, exchange, registry) => {
    const q = qualifyHoldingSecurityIdentity({ isin, exchange }, master, registry);
    return q.status === 'QUALIFIED' ? `QUALIFIED:${q.securityIdentity.series}:${q.isinAuthority}` : q.reason;
  };
  for (const row of rows) {
    const symbol = row[symbolCol] ?? ''; const isin = isinCol >= 0 && row[isinCol] ? row[isinCol].toUpperCase() : undefined;
    const exchange = exchangeOf(row);
    if (isin) out.rowsWithIsin += 1;
    bump(out.rowsByExchange, exchange ?? 'NONE');
    if (WIRE_SYMBOL.test(symbol)) out.rowsWithWireValidSymbol += 1;
    const g = gate.resolve({ symbol, ...(isin ? { isin } : {}), ...(exchange ? { exchange } : {}) }, asOf);
    bump(out.ipcCompanyGate, g.status);
    if (g.status !== 'RESOLVED') {
      const code = String(g.reason).split(':')[0];
      // The gate names the failing identifier type for an unmapped identifier only.
      const id = /(ISIN|NSE_SYMBOL|BSE_SYMBOL)/.exec(String(g.reason))?.[1];
      bump(out.ipcCompanyGateRefusalByReason, id ? `${code}|${id}` : code);
    }
    if (isin && exchange) {
      const s = out.securityQualificationOfRowsWithIsinAndExchange; s.rows += 1;
      bump(s.withRegistryLoadedByTheApplication, outcome(isin, exchange, loaded));
      bump(s.withInMemoryRequalifiedRegistry, outcome(isin, exchange, requalified));
      if (g.status === 'RESOLVED') {
        const p = out.ofRowsPassingTheCompanyGate; p.rows += 1;
        bump(p.withRegistryLoadedByTheApplication, outcome(isin, exchange, loaded));
        bump(p.withInMemoryRequalifiedRegistry, outcome(isin, exchange, requalified));
      }
    } else if (g.status === 'RESOLVED') {
      out.ofRowsPassingTheCompanyGate.rows += 1;
      bump(out.ofRowsPassingTheCompanyGate.withRegistryLoadedByTheApplication, 'NO_ISIN_ON_ROW');
      bump(out.ofRowsPassingTheCompanyGate.withInMemoryRequalifiedRegistry, 'NO_ISIN_ON_ROW');
    }
  }
  for (const k of ['rowsByExchange', 'ipcCompanyGate', 'ipcCompanyGateRefusalByReason']) out[k] = sorted(out[k]);
  for (const k of ['securityQualificationOfRowsWithIsinAndExchange', 'ofRowsPassingTheCompanyGate']) {
    out[k].withRegistryLoadedByTheApplication = sorted(out[k].withRegistryLoadedByTheApplication);
    out[k].withInMemoryRequalifiedRegistry = sorted(out[k].withInMemoryRequalifiedRegistry);
  }
  out.wholeImportWouldBeRefusedByTheIpcGate = Object.keys(out.ipcCompanyGate).some((k) => k !== 'RESOLVED');
  return out;
}

const irrCommit = execFileSync('git', ['-C', irrRoot, 'rev-parse', 'HEAD']).toString().trim();
const output = {
  note: 'Tracked IRR evidence files. No link to the captured portfolio revision 1 is established or inferred.',
  irrCommit, p04Master: master.sourceRevision,
  registries: { loadedByTheApplication: loaded.list().length, inMemoryRequalified: requalified.list().length },
  files: ['dhan-holdings-withisin.csv', 'dhan-holdings.csv', 'zerodha-holdings.csv'].map(probe),
};
process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
