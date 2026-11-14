// W04 decision D2 — probe: does IRR's own loader accept ONE issuer with TWO equity securities?
//
// READ-ONLY. It imports IRR's identity loader and resolver from an IRR checkout, unmodified, and
// builds one small identity set IN MEMORY. Nothing is written, nothing is installed and no socket
// is opened. The set exists only inside this process. It is NOT an approved supplement and NOT
// provisioning data.
//
//   cd <IRR checkout>/frontend
//   ./node_modules/.bin/tsx <this file> <IRR checkout> <staging directory>
//
// The staging directory is the output of `provision-irr-identity-sources.mjs generate`; it is used
// only for the shape of an exported record. The two securities are the two the export withholds.
// Their ISINs, symbols and listing dates are the values of the NSE listing file tracked in the
// Wave-3 bundle; the CIN is the one the issuer publishes (decision record, section 3).
//
// Output: one JSON document of codes. It prints no identifier.
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [irrRootArg, stagingArg] = process.argv.slice(2);
if (irrRootArg === undefined || stagingArg === undefined) {
  process.stderr.write('arguments: <IRR checkout> <staging directory>\n');
  process.exit(2);
}
const irrRoot = resolve(irrRootArg);
const identityDir = join(resolve(stagingArg), 'identity');
const identityModuleDir = join(irrRoot, 'iips-platform', 'src', 'investment', 'identity');
const sources = (await import(pathToFileURL(join(identityModuleDir, 'sources.ts')).href)) as Record<string, any>;
const resolver = (await import(pathToFileURL(join(identityModuleDir, 'resolver.ts')).href)) as Record<string, any>;

const roster = JSON.parse(readFileSync(join(identityDir, 'eligible-roster.json'), 'utf8'));
const listingMap = JSON.parse(readFileSync(join(identityDir, 'listing-map.json'), 'utf8'));
const corporateActions = readFileSync(join(identityDir, 'corporate-actions.json'), 'utf8');
const issuerShape = roster.issuers[0];
const securityShape = roster.securities[0];
const listingShape = listingMap.entries[0];

const CIN = 'L29120MH1986PLC042028';
const ORDINARY = { isin: 'INE175A01038', symbol: 'JISLJALEQS', listedOn: '2001-08-13' };
const DVR = { isin: 'IN9175A01010', symbol: 'JISLDVREQS', listedOn: '2011-11-30' };
const issuerId = `IN:CIN:${CIN}`;

const issuer = { ...issuerShape, issuerId, legalName: 'Jain Irrigation Systems Limited', cin: CIN, equityIsin: ORDINARY.isin, issuerKeyBasis: 'CIN' };
const security = (share: typeof ORDINARY, instrumentType: string) => ({ ...securityShape, securityId: `IN:ISIN:${share.isin}`, issuerId, isin: share.isin, instrumentType });
const listing = (share: typeof ORDINARY, instrumentType: string) => ({
  ...listingShape,
  listingId: `IN:NSE:${share.symbol}:EQ:${instrumentType}`,
  securityId: `IN:ISIN:${share.isin}`,
  issuerId,
  symbol: share.symbol,
  series: 'EQ',
  instrumentType,
  effectiveFrom: share.listedOn,
  sourceRef: 'probe',
});

const attempt = (dvrType: string) => {
  const loaded = sources.loadIdentitySources({
    roster: JSON.stringify({ ...roster, issuers: [issuer], securities: [security(ORDINARY, 'EQUITY'), security(DVR, dvrType)] }),
    listingMap: JSON.stringify({ schemaVersion: listingMap.schemaVersion, entries: [listing(ORDINARY, 'EQUITY'), listing(DVR, dvrType)] }),
    corporateActions,
  });
  if (!loaded.available) {
    return { loaderAccepted: false, issueCodes: [...new Set<string>(loaded.issues.map((issue: any) => `${issue.file}:${issue.code}`))].sort() };
  }
  const observe = (share: typeof ORDINARY) => {
    const resolution = resolver.resolveIdentity(
      { observationId: 'probe', source: 'HOLDING', isin: share.isin, symbol: share.symbol, exchange: 'NSE', series: 'EQ', cin: null, companyIdHint: null },
      { sources: loaded.sources, asOf: '2026-11-13' },
    );
    return {
      state: resolution.state,
      reason: resolution.failure?.reason ?? null,
      resolvedToTheOneIssuer: resolution.issuerId === issuerId,
      resolvedToItsOwnSecurity: resolution.securityId === `IN:ISIN:${share.isin}`,
    };
  };
  return { loaderAccepted: true, issueCodes: [], ordinaryShare: observe(ORDINARY), dvrShare: observe(DVR) };
};

process.stdout.write(
  `${JSON.stringify(
    {
      probe: 'IPD_W04_IRR_TWO_SECURITY_ISSUER_PROBE_V1',
      note: 'IRR has no instrument type for differential-voting-rights shares. The two variants type the DVR share as EQUITY and as OTHER.',
      oneCinKeyedIssuer_bothSecuritiesTypedEQUITY: attempt('EQUITY'),
      oneCinKeyedIssuer_dvrTypedOTHER: attempt('OTHER'),
    },
    null,
    2,
  )}\n`,
);
