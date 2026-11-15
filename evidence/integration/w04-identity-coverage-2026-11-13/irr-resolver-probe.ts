// W04 identity coverage — behaviour probe of the IRR holding-identity resolver.
//
// SYNTHETIC ONLY. The identity sources are the tracked synthetic fixture
// (iips-platform/tests/investment/fixtures/identity); the two holdings are made up
// and use the fixture's own synthetic ISIN. The probe shows how the unmodified IRR
// function `resolveHoldingIdentities` treats a holding shaped the way IPD projects
// a persisted holding: symbol, companyId and the nested `securityIdentity` object,
// with no flat `isin` and no `exchange`. It says nothing about any actual holding.
//
// Run from `<IRR checkout>/frontend`, passing the checkout root:
//   ./node_modules/.bin/tsx <path>/irr-resolver-probe.ts <IRR checkout root>
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2]!;

async function main(): Promise<void> {
  const { resolveHoldingIdentities } = await import(join(root, 'frontend/server/investment/holding-identity-transport.ts'));
  const { loadIdentitySources } = await import(join(root, 'iips-platform/src/investment/identity/sources.ts'));
  const fixture = join(root, 'iips-platform/tests/investment/fixtures/identity');
  const loaded = loadIdentitySources({
    roster: readFileSync(join(fixture, 'eligible-roster.json'), 'utf8'),
    listingMap: readFileSync(join(fixture, 'listing-map.json'), 'utf8'),
    corporateActions: readFileSync(join(fixture, 'corporate-actions.json'), 'utf8'),
  });
  if (!loaded.available) throw new Error('synthetic identity fixture did not load');

  const base = {
    quantity: 1, averageBuyPrice: 1, currentPrice: 1, marketValue: 1, weightPercentage: 50, active: true,
    sourceBroker: 'synthetic', lineageDigest: 'synthetic', identityStatus: 'RESOLVED', resolutionDisposition: 'CANONICAL_P04',
  };
  const holdings = [
    {
      ...base, symbol: 'AARAV', companyId: 'EQ_SYNTHETIC_IN',
      securityIdentity: { securityId: 'ISIN:IN0000000011:EQ', isin: 'IN0000000011', series: 'EQ', isinAuthority: 'NON_AUTHORITATIVE' },
    },
    { ...base, symbol: 'AARAV', companyId: 'EQ_SYNTHETIC_IN', securityIdentity: null },
  ];
  const labels = ['securityIdentity populated', 'securityIdentity null'];
  const out = resolveHoldingIdentities('synthetic-portfolio', holdings as never, loaded.sources, '2026-11-13');
  out.forEach((r: Record<string, unknown>, i: number) => {
    console.log(JSON.stringify({
      holding: labels[i], state: r.state, reason: r.reason, issuerResolved: r.issuerId !== null,
      securityResolved: r.securityId !== null, listingResolved: (r.listingId ?? null) !== null,
      resolutionBasis: r.resolutionBasis, assessable: r.assessable,
    }));
  });
}

main().catch((error) => { console.error(error); process.exit(1); });
