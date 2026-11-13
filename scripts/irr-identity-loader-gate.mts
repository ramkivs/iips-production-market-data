// W04 — gate: do IRR's own loader and resolver accept a directory of identity files?
//
// This script contains no validation rule of its own. It imports the loader and the resolver from
// an IRR checkout and reports what they return. It is the acceptance gate of
// scripts/provision-irr-identity-sources.mjs, which runs it with IRR's TypeScript runner:
//
//   node <IRR>/frontend/node_modules/tsx/dist/cli.mjs --no-cache \
//        <IPD>/scripts/irr-identity-loader-gate.mts <IRR root> <identity directory> <as-of YYYY-MM-DD>
//
// READ-ONLY. It reads the three identity files and IRR source files. It writes nothing and opens
// no socket. Standard output is one JSON document. It never prints an ISIN, a symbol, an issuer or
// a name: issue subjects are counted, not listed.
//
// The resolver self-check answers one question for each exported record, using IRR's own
// `resolveIdentity`: does an observation that carries exactly this identifier resolve to exactly
// this record?
//   - every roster security, observed by ISIN alone;
//   - every listing, observed by exchange and symbol alone.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const GATE_SCHEMA = 'IPD_IRR_IDENTITY_LOADER_GATE_V1';
const FILES = ['eligible-roster.json', 'listing-map.json', 'corporate-actions.json'] as const;

type Json = Record<string, unknown>;

function emit(document: Json, exitCode: number): never {
  process.stdout.write(`${JSON.stringify(document, null, 2)}\n`);
  process.exit(exitCode);
}

function tally(values: readonly string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const value of values) counts[value] = (counts[value] ?? 0) + 1;
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}

const [irrRootArg, identityDirArg, asOf] = process.argv.slice(2);
if (irrRootArg === undefined || identityDirArg === undefined || asOf === undefined || !/^\d{4}-\d{2}-\d{2}$/.test(asOf)) {
  emit({ gate: GATE_SCHEMA, ran: false, error: 'USAGE', detail: 'arguments: <IRR root> <identity directory> <as-of YYYY-MM-DD>' }, 2);
}

const irrRoot = resolve(irrRootArg);
const identityDir = resolve(identityDirArg);
const loaderPath = join(irrRoot, 'iips-platform', 'src', 'investment', 'identity', 'sources.ts');
const resolverPath = join(irrRoot, 'iips-platform', 'src', 'investment', 'identity', 'resolver.ts');

if (!existsSync(loaderPath) || !existsSync(resolverPath)) {
  emit({ gate: GATE_SCHEMA, ran: false, error: 'IRR_LOADER_NOT_FOUND', detail: 'the IRR identity loader or resolver source file is absent from the IRR root' }, 2);
}
const absent = FILES.filter((name) => !existsSync(join(identityDir, name)));
if (absent.length > 0) {
  emit({ gate: GATE_SCHEMA, ran: false, error: 'IDENTITY_FILES_ABSENT', detail: `absent: ${absent.join(', ')}` }, 2);
}

let loaderModule: Json;
let resolverModule: Json;
try {
  loaderModule = (await import(pathToFileURL(loaderPath).href)) as Json;
  resolverModule = (await import(pathToFileURL(resolverPath).href)) as Json;
} catch (error) {
  emit({ gate: GATE_SCHEMA, ran: false, error: 'IRR_LOADER_IMPORT_FAILED', detail: String((error as Error).name) }, 2);
}

const loadFromDir = loaderModule.loadIdentitySourcesFromDir;
const resolveIdentity = resolverModule.resolveIdentity;
if (typeof loadFromDir !== 'function' || typeof resolveIdentity !== 'function') {
  emit({ gate: GATE_SCHEMA, ran: false, error: 'IRR_LOADER_CONTRACT_CHANGED', detail: 'loadIdentitySourcesFromDir or resolveIdentity is not exported' }, 2);
}

// Digests of the bytes the loader is about to read, so the result is bound to exact file content.
const files = Object.fromEntries(
  FILES.map((name) => {
    const bytes = readFileSync(join(identityDir, name));
    return [name, { sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length }];
  }),
);

const loaded = (loadFromDir as (dir: string) => Json)(identityDir);
if (loaded.available !== true) {
  const issues = (loaded.issues ?? []) as Json[];
  emit(
    {
      gate: GATE_SCHEMA,
      ran: true,
      asOf,
      files,
      available: false,
      issueCount: issues.length,
      issuesByFileAndCode: tally(issues.map((issue) => `${String(issue.file)}:${String(issue.code)}`)),
    },
    1,
  );
}

const sources = loaded.sources as {
  roster: { rosterLabel: string; issuers: Json[]; securities: Json[] };
  listingMap: { entries: Json[] };
  corporateActionTable: { actions: Json[] };
  versions: Json;
  rosterDataClass: string;
};

type Resolution = { state: string; issuerId: string | null; securityId: string | null; listingId: string | null; resolutionBasis: string | null; failure: { reason: string } | null };
const resolveOne = resolveIdentity as (input: Json, context: Json) => Resolution;
const context = { sources, asOf };
const blank = { source: 'HOLDING', isin: null, symbol: null, exchange: null, series: null, cin: null, companyIdHint: null };

// 1. Every security, by ISIN alone.
const byIsinOutcome: string[] = [];
let byIsinExact = 0;
const activeListingIdsBySecurity = new Map<string, Set<string>>();
for (const entry of sources.listingMap.entries) {
  const securityId = String(entry.securityId);
  const set = activeListingIdsBySecurity.get(securityId) ?? new Set<string>();
  set.add(String(entry.listingId));
  activeListingIdsBySecurity.set(securityId, set);
}
sources.roster.securities.forEach((security, index) => {
  const resolution = resolveOne({ ...blank, observationId: `gate:isin:${index}`, isin: security.isin }, context);
  byIsinOutcome.push(resolution.failure === null ? resolution.state : `${resolution.state}/${resolution.failure.reason}`);
  if (
    resolution.state === 'RESOLVED' &&
    resolution.resolutionBasis === 'ISIN' &&
    resolution.securityId === security.securityId &&
    resolution.issuerId === security.issuerId &&
    resolution.listingId !== null &&
    (activeListingIdsBySecurity.get(String(security.securityId))?.has(resolution.listingId) ?? false)
  ) {
    byIsinExact += 1;
  }
});

// 2. Every listing, by exchange and symbol alone.
const bySymbolOutcome: string[] = [];
let bySymbolExact = 0;
sources.listingMap.entries.forEach((entry, index) => {
  const resolution = resolveOne(
    { ...blank, observationId: `gate:symbol:${index}`, exchange: entry.exchange, symbol: entry.symbol },
    context,
  );
  bySymbolOutcome.push(resolution.failure === null ? resolution.state : `${resolution.state}/${resolution.failure.reason}`);
  if (
    resolution.state === 'RESOLVED' &&
    resolution.resolutionBasis === 'EXCHANGE_SYMBOL' &&
    resolution.securityId === entry.securityId &&
    resolution.issuerId === entry.issuerId &&
    resolution.listingId === entry.listingId
  ) {
    bySymbolExact += 1;
  }
});

emit(
  {
    gate: GATE_SCHEMA,
    ran: true,
    asOf,
    files,
    available: true,
    issueCount: 0,
    rosterLabel: sources.roster.rosterLabel,
    rosterDataClass: sources.rosterDataClass,
    versions: sources.versions,
    counts: {
      issuers: sources.roster.issuers.length,
      issuersByKeyBasis: tally(sources.roster.issuers.map((issuer) => String(issuer.issuerKeyBasis))),
      issuersByStatus: tally(sources.roster.issuers.map((issuer) => String(issuer.status))),
      issuersBySector: tally(sources.roster.issuers.map((issuer) => String(issuer.sector))),
      securities: sources.roster.securities.length,
      securitiesByStatus: tally(sources.roster.securities.map((security) => String(security.status))),
      listings: sources.listingMap.entries.length,
      listingsByExchangeAndSeries: tally(sources.listingMap.entries.map((entry) => `${String(entry.exchange)}:${String(entry.series)}`)),
      corporateActions: sources.corporateActionTable.actions.length,
    },
    resolverSelfCheck: {
      byIsin: { observed: sources.roster.securities.length, resolvedToTheSameRecord: byIsinExact, outcomes: tally(byIsinOutcome) },
      byExchangeAndSymbol: { observed: sources.listingMap.entries.length, resolvedToTheSameRecord: bySymbolExact, outcomes: tally(bySymbolOutcome) },
    },
  },
  0,
);
