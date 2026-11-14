// W04 — behaviour probe of the IRR route
//   GET /api/investment/portfolio/<portfolioId>/identities
//
// SYNTHETIC ONLY. The identity sources are IRR's tracked synthetic fixture
// (iips-platform/tests/investment/fixtures/identity). The portfolio, its holdings,
// revisions and digests are made up. Nothing here is host data, portfolio data or
// capture content, and nothing is a statement about any actual holding.
//
// The probe drives the UNMODIFIED IRR production functions:
//   handleHoldingIdentityRequest        (frontend/server/investment/holding-identity-transport.ts)
//   createPortfolioHoldingsProvider     (frontend/server/investment/sources.ts)
//   IpcUserPortfolioPort                (frontend/server/user-portfolio/ipcPortAdapter.ts)
//   handleUserPortfolioRequest          (frontend/server/user-portfolio-transport.ts)
// The only substitution is the adapter's own documented transport seam: instead of a
// socket, a function records each IPC request and answers with a synthetic IPD result.
//
// Run from `<IRR checkout>/frontend`, passing the checkout root:
//   ./node_modules/.bin/tsx <path>/irr-identities-endpoint-probe.ts <IRR checkout root>
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, join } from 'node:path';

const root = process.argv[2]!;
const ENV = { IIPS_G3_IPC_BINDING_PROVISIONED: 'true' } as NodeJS.ProcessEnv;
const PORTFOLIO = 'synthetic-portfolio';
const DIGEST_REV1 = 'synthetic-provenance-digest-for-revision-1';
const DIGEST_REV7 = 'synthetic-provenance-digest-for-revision-7';

type Json = Record<string, unknown>;

function holding(symbol: string, securityIdentity: unknown): Json {
  return {
    symbol, companyId: 'EQ_SYNTHETIC_IN', quantity: 1, averageBuyPrice: 1, currentPrice: 1, marketValue: 1,
    weightPercentage: 50, active: true, sourceBroker: 'synthetic', lineageDigest: 'synthetic',
    identityStatus: 'RESOLVED', resolutionDisposition: 'CANONICAL_P04', securityIdentity,
  };
}
const POPULATED = { securityId: 'ISIN:IN0000000011:EQ', isin: 'IN0000000011', series: 'EQ', isinAuthority: 'NON_AUTHORITATIVE' };
const HOLDINGS_A = [holding('AARAV', POPULATED), holding('AARAV', null)];
const HOLDINGS_B = [holding('SYNTHB', null), holding('SYNTHC', null), holding('SYNTHD', null)];

function detail(revision: number, provenanceDigest: string, holdings: readonly Json[]): Json {
  return {
    portfolioId: PORTFOLIO, portfolioName: 'Synthetic', revision, holdingsCount: holdings.length,
    totalMarketValue: holdings.length, weightSumPercentage: 100, lastUpdated: '2026-01-01T00:00:00.000Z',
    provenanceDigest, isSaved: true, holdings, contributions: [], importEvidence: [],
  };
}

function fakeRequest(url: string, method = 'GET'): never {
  return { url, method, headers: {} } as never;
}
function fakeResponse(): { res: never; out: () => { status: number; body: string } } {
  let status = 0;
  let body = '';
  const res = {
    headersSent: false, destroyed: false,
    writeHead(code: number) { status = code; return this; },
    setHeader() { /* not needed */ },
    end(chunk?: string) { body = chunk ?? ''; },
  };
  return { res: res as never, out: () => ({ status, body }) };
}

function keysDeep(value: unknown, into: Set<string> = new Set()): Set<string> {
  if (Array.isArray(value)) value.forEach((item) => keysDeep(item, into));
  else if (value !== null && typeof value === 'object') {
    for (const [key, inner] of Object.entries(value as Json)) { into.add(key); keysDeep(inner, into); }
  }
  return into;
}
function tally(identities: readonly Json[]): Json {
  const counts: Record<string, number> = {};
  for (const identity of identities) {
    const key = `${String(identity.state)} / ${String(identity.reason)}`;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}
function line(label: string, value: unknown): void {
  console.log(`${label}: ${JSON.stringify(value)}`);
}

async function main(): Promise<void> {
  const transport = await import(join(root, 'frontend/server/investment/holding-identity-transport.ts'));
  const sourcesModule = await import(join(root, 'frontend/server/investment/sources.ts'));
  const adapter = await import(join(root, 'frontend/server/user-portfolio/ipcPortAdapter.ts'));
  const userPortfolio = await import(join(root, 'frontend/server/user-portfolio-transport.ts'));
  const identitySources = await import(join(root, 'iips-platform/src/investment/identity/sources.ts'));
  const runtime = await import(join(root, 'iips-platform/src/investment/identity/runtime.ts'));

  const fixture = join(root, 'iips-platform/tests/investment/fixtures/identity');
  const loaded = identitySources.loadIdentitySources({
    roster: readFileSync(join(fixture, 'eligible-roster.json'), 'utf8'),
    listingMap: readFileSync(join(fixture, 'listing-map.json'), 'utf8'),
    corporateActions: readFileSync(join(fixture, 'corporate-actions.json'), 'utf8'),
  });
  if (!loaded.available) throw new Error('synthetic identity fixture did not load');

  // The synthetic upstream. `current` is what a synthetic IPD holds as the CURRENT revision.
  let current = detail(1, DIGEST_REV1, HOLDINGS_A);
  const wire: Array<{ op: string; payloadKeys: string[] }> = [];
  const ipc = async (op: string, payload?: Json) => {
    wire.push({ op, payloadKeys: Object.keys(payload ?? {}).sort() });
    const result = op === 'portfolio.get' ? current
      : op === 'portfolio.revisions' ? [
          { revision: 1, operation: 'REPLACE', committedAt: '2026-01-01T00:00:00.000Z', totalMarketValue: 2, provenanceDigest: DIGEST_REV1, holdingsCount: 2 },
        ]
      : [];
    return { kind: 'SUCCESS' as const, bytesReceived: 1, frame: { v: 1 as const, ok: true as const, op, result } };
  };
  const portFactory = () => new adapter.IpcUserPortfolioPort({ precondition: { bindingProvisioned: true }, transport: ipc });
  const providers = {
    holdings: sourcesModule.createPortfolioHoldingsProvider({ env: ENV, portFactory }),
    loadSources: () => loaded,
    today: () => '2026-11-13',
  };
  const get = async (url: string, method = 'GET', override: Json = {}) => {
    const { res, out } = fakeResponse();
    const claimed = await transport.handleHoldingIdentityRequest(fakeRequest(url, method), res, { ...providers, ...override });
    const { status, body } = out();
    return { claimed, status, body, json: body === '' ? null : (JSON.parse(body) as Json) };
  };
  const base = `/api/investment/portfolio/${PORTFOLIO}/identities`;

  console.log('== 1. Request shape');
  line('route table', transport.HOLDING_IDENTITY_ROUTES);
  line('path claimed without query', transport.isHoldingIdentityPath(base));
  line('path claimed with ?revision=1&provenanceDigest=x', transport.isHoldingIdentityPath(`${base}?revision=1&provenanceDigest=x`));
  line('portfolioId parsed from the URL with that query', transport.parsePortfolioIdOf(`${base}?revision=1&provenanceDigest=x`));
  line('path claimed for /identities/1 (a revision path segment)', transport.isHoldingIdentityPath(`${base}/1`));

  console.log('== 2. Call path and what crosses the IPC boundary');
  const a = await get(base);
  line('HTTP status', a.status);
  line('IPC requests sent for one GET', wire);

  console.log('== 3. Response shape (upstream current revision 1)');
  const bodyA = a.json!;
  line('top-level keys', Object.keys(bodyA));
  line('keys of one identities[] item', Object.keys((bodyA.identities as Json[])[0]!));
  line('directory keys', Object.keys(bodyA.directory as Json));
  line('rosterVersion equals rosterDigest', (bodyA.directory as Json).rosterVersion === (bodyA.directory as Json).rosterDigest);
  line('rosterDataClass (synthetic fixture)', (bodyA.directory as Json).rosterDataClass);
  line('disclosures', bodyA.disclosures);
  const allKeys = [...keysDeep(bodyA)];
  line('any key named revision / provenanceDigest / contentDigest / lastUpdated', allKeys.filter((k) => /revision|provenance|contentDigest|lastUpdated/i.test(k)));
  line('any key carrying aggregate counts by state or reason', allKeys.filter((k) => /counts|byState|byReason|summary|tally/i.test(k)));
  line('keys naming a listing-map or corporate-action version or digest', allKeys.filter((k) => /(listingMap|corporateAction).*(Version|Digest)/i.test(k)));
  line('body contains the upstream provenance digest value', a.body.includes(DIGEST_REV1));
  line('count', bodyA.count);
  line('tally by state / reason, computed by the probe from identities[]', tally(bodyA.identities as Json[]));

  console.log('== 4. Same holdings, upstream current revision changed from 1 to 7');
  current = detail(7, DIGEST_REV7, HOLDINGS_A);
  const b = await get(base);
  line('HTTP status', b.status);
  line('response byte-identical to the revision-1 response', b.body === a.body);
  line('body contains the revision-7 provenance digest value', b.body.includes(DIGEST_REV7));

  console.log('== 5. Request names revision 1 in the query; upstream is at revision 7 with different holdings');
  current = detail(7, DIGEST_REV7, HOLDINGS_B);
  wire.length = 0;
  const c = await get(`${base}?revision=1&provenanceDigest=${DIGEST_REV1}`);
  line('HTTP status', c.status);
  line('IPC requests sent', wire);
  line('count returned (revision-1 holdings: 2; current holdings: 3)', c.json!.count);
  line('symbols returned are the CURRENT holdings', (c.json!.identities as Json[]).map((i) => i.symbol).join(',') === HOLDINGS_B.map((h) => h.symbol).join(','));

  console.log('== 6. Failure responses');
  const noSources = await get(base, 'GET', { loadSources: () => runtime.loadRuntimeIdentitySources(mkdtempSync(join(tmpdir(), 'w04-probe-'))) });
  line('identity files missing: status, error', [noSources.status, noSources.json!.error]);
  const issue = ((noSources.json!.issues as Json[]) ?? [])[0] ?? {};
  line('identity files missing: keys of one issues[] item', Object.keys(issue));
  line('identity files missing: issue code', issue.code);
  line('identity files missing: issue subject is an absolute local directory path', typeof issue.subject === 'string' && isAbsolute(issue.subject));
  const noOwner = await get(base, 'GET', { holdings: sourcesModule.createPortfolioHoldingsProvider({ env: {}, portFactory }) });
  line('owner precondition not set: status, error', [noOwner.status, noOwner.json!.error]);
  const upstreamDown = await get(base, 'GET', { holdings: async () => { throw new Error('synthetic'); } });
  line('holdings read fails: status, error', [upstreamDown.status, upstreamDown.json!.error]);
  const put = await get(base, 'PUT');
  line('PUT: status', put.status);
  const head = await get(base, 'HEAD');
  line('HEAD: status, body length', [head.status, head.body.length]);

  console.log('== 7. Existing revision-bearing reads on the same adapter (GET only)');
  current = detail(1, DIGEST_REV1, HOLDINGS_A);
  wire.length = 0;
  const read = async (url: string) => {
    const { res, out } = fakeResponse();
    await userPortfolio.handleUserPortfolioRequest(fakeRequest(url), res, { env: ENV, portFactory });
    const { status, body } = out();
    return { status, json: JSON.parse(body) as Json };
  };
  const d = await read(`/api/user-portfolios/${PORTFOLIO}`);
  const portfolio = d.json.portfolio as Json;
  line('GET /api/user-portfolios/<id>: status', d.status);
  line('GET /api/user-portfolios/<id>: keys of portfolio', Object.keys(portfolio));
  line('  revision', portfolio.revision);
  line('  provenanceDigest equals the upstream value', portfolio.provenanceDigest === DIGEST_REV1);
  line('  holdings[0] carries securityIdentity (object)', typeof (portfolio.holdings as Json[])[0]!.securityIdentity === 'object' && (portfolio.holdings as Json[])[0]!.securityIdentity !== null);
  line('  holdings[1] carries securityIdentity === null', (portfolio.holdings as Json[])[1]!.securityIdentity === null);
  const again = await get(base);
  line('  holdings order equals identities[].holdingIndex order', (portfolio.holdings as Json[]).map((h) => h.symbol).join(',') === (again.json!.identities as Json[]).map((i) => i.symbol).join(','));
  const r = await read(`/api/user-portfolios/${PORTFOLIO}/revisions`);
  line('GET /api/user-portfolios/<id>/revisions: status', r.status);
  line('GET /api/user-portfolios/<id>/revisions: keys of one entry', Object.keys((r.json.revisions as Json[])[0]!));
  line('IPC requests sent by these reads', wire);
}

main().catch((error) => { console.error(error); process.exit(1); });
