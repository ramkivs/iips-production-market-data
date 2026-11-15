// W04 decision D4 — probe: how does IRR's own loader and resolver treat a BSE listing?
//
// READ-ONLY. It imports IRR's identity loader and resolver from an IRR checkout, unmodified, and
// builds three small identity sets IN MEMORY from one record of a staged export. Nothing is
// written, nothing is installed and no socket is opened. The sets exist only inside this process;
// they are not provisioning data.
//
//   cd <IRR checkout>/frontend
//   ./node_modules/.bin/tsx <this file> <IRR checkout> <staging directory>
//
// The staging directory is the output of `provision-irr-identity-sources.mjs generate`.
// Output: one JSON document of codes and counts. It prints no ISIN, symbol or name.
//
// Question 1. Does IRR's loader accept a BSE listing whose series is the BSE group ("A")?
// Question 2. Does it accept a BSE listing whose series is "EQ", the form IRR's tracked rosters use?
// Question 3. With the export as it stands (one NSE listing, series EQ), how does IRR's resolver
//             answer an observation that carries the ISIN and the series "A" — the series token an
//             IPD D114 identity carries for a BSE group-A holding?
// Question 4. With the set of question 2 (NSE EQ and BSE EQ listings), how does the resolver answer
//             the same observation, and which listing does it choose for the others?
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
const ids = (await import(pathToFileURL(join(irrRoot, 'iips-platform', 'src', 'investment', 'contracts', 'ids.ts')).href)) as Record<string, any>;

const roster = JSON.parse(readFileSync(join(identityDir, 'eligible-roster.json'), 'utf8'));
const listingMap = JSON.parse(readFileSync(join(identityDir, 'listing-map.json'), 'utf8'));
const corporateActions = readFileSync(join(identityDir, 'corporate-actions.json'), 'utf8');

// One exported record: the first security, its issuer and its NSE listing.
const security = roster.securities[0];
const issuer = roster.issuers.find((candidate: any) => candidate.issuerId === security.issuerId);
const nseListing = listingMap.entries.find((entry: any) => entry.securityId === security.securityId);
const oneRoster = JSON.stringify({ ...roster, issuers: [issuer], securities: [security] });

// A placeholder BSE symbol. It is a syntactically valid token, not a real scrip code: the probe
// asks about the series, and the symbol plays no part in the answer.
const BSE_SYMBOL = '999999';
const bseListing = (series: string) => ({
  ...nseListing,
  listingId: `IN:BSE:${BSE_SYMBOL}:${series}:${nseListing.instrumentType}`,
  exchange: 'BSE',
  symbol: BSE_SYMBOL,
  series,
});

const load = (entries: unknown[]) =>
  sources.loadIdentitySources({
    roster: oneRoster,
    listingMap: JSON.stringify({ schemaVersion: listingMap.schemaVersion, entries }),
    corporateActions,
  });
const codes = (result: any): string[] =>
  result.available ? [] : [...new Set<string>(result.issues.map((issue: any) => `${issue.file}:${issue.code}`))].sort();

const nseOnly = load([nseListing]);
const withGroupSeries = load([nseListing, bseListing('A')]);
const withEqSeries = load([nseListing, bseListing('EQ')]);

const observe = (loaded: any, series: string | null, exchange: string | null, symbol: string | null) => {
  if (!loaded.available) return null;
  const resolution = resolver.resolveIdentity(
    { observationId: 'probe', source: 'HOLDING', isin: security.isin, symbol, exchange, series, cin: null, companyIdHint: null },
    { sources: loaded.sources, asOf: '2026-11-13' },
  );
  const chosen = resolution.listingId === null ? null : withEqSeries.sources.listingMap.entries.find((entry: any) => entry.listingId === resolution.listingId);
  return {
    state: resolution.state,
    reason: resolution.failure?.reason ?? null,
    chosenListing: chosen === null || chosen === undefined ? null : `${chosen.exchange}/${chosen.series}`,
  };
};

process.stdout.write(
  `${JSON.stringify(
    {
      probe: 'IPD_W04_IRR_BSE_SERIES_PROBE_V1',
      irrClosedSeriesList: ids.LISTING_SERIES,
      q1_bseListingWithSeriesA: { loaderAccepted: withGroupSeries.available, issueCodes: codes(withGroupSeries) },
      q2_bseListingWithSeriesEQ: { loaderAccepted: withEqSeries.available, issueCodes: codes(withEqSeries) },
      q3_exportAsItStands_nseEqListingOnly: {
        loaderAccepted: nseOnly.available,
        isinAndSeriesA: observe(nseOnly, 'A', null, null),
        isinAndSeriesEQ: observe(nseOnly, 'EQ', null, null),
        isinOnly: observe(nseOnly, null, null, null),
      },
      q4_nseEqAndBseEqListings: {
        isinAndSeriesA: observe(withEqSeries, 'A', null, null),
        isinSeriesAAndBseSymbol: observe(withEqSeries, 'A', 'BSE', BSE_SYMBOL),
        isinSeriesEQAndBseSymbol: observe(withEqSeries, 'EQ', 'BSE', BSE_SYMBOL),
        isinSeriesEQAndNseSymbol: observe(withEqSeries, 'EQ', 'NSE', nseListing.symbol),
        isinAndSeriesEQ_noSymbol: observe(withEqSeries, 'EQ', null, null),
        isinOnly: observe(withEqSeries, null, null, null),
        note:
          'Without an exchange and symbol the resolver breaks the tie by series EQ, then earliest effectiveFrom, then listing id. ' +
          'The probe gives both listings the same effectiveFrom, so the listing id decided; with real dates the earlier listing wins.',
      },
    },
    null,
    2,
  )}\n`,
);
