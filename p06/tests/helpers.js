/**
 * Shared deterministic harness for P06-01.
 *
 * ⚠ No wall clock, no randomness, no network, no filesystem writes. Every input is a fixed literal
 *   or a committed repository file, so every run is byte-identical.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { declareNormalizationMapping } from '../src/mappingDeclaration.js';
import { normalizePayload } from '../src/normalizationPipeline.js';
import { buildMappingRegister, resolveIdentityRef } from '../src/identityResolution.js';

const here = dirname(fileURLToPath(import.meta.url));
export const repoRoot = join(here, '..', '..');
export const p06Root = join(here, '..');
export const p05Root = join(repoRoot, 'p05');

export function readRepo(relPath) {
  return readFileSync(join(repoRoot, relPath), 'utf8');
}

/** The P06-01 fixtures (provider payloads + declared mappings + golden canonical output). */
export function normalizationFixtures() {
  return JSON.parse(readFileSync(join(p06Root, 'fixtures', 'normalization-fixtures.json'), 'utf8'));
}

/** The accepted P05/P04 identity fixtures — REUSED, not copied into a P06 fixture. */
export function identityFixtures() {
  return JSON.parse(readFileSync(join(p05Root, 'fixtures', 'identity-fixtures.json'), 'utf8'));
}

/** The accepted P05 provider register — asserted unchanged by the guard tests. */
export function providerRegister() {
  return JSON.parse(readFileSync(join(p05Root, 'fixtures', 'provider-register.json'), 'utf8'));
}

/** Declare (and validate) a mapping from the fixture set. */
export function declared(mappingRef) {
  return declareNormalizationMapping(normalizationFixtures().mappings[mappingRef]);
}

/** The shared P04-shaped register, built once from the accepted identity fixtures. */
export const REGISTER = buildMappingRegister(identityFixtures());

/**
 * Resolve the identity for a case's payload, exactly as the accepted P04 machinery requires
 * (RF-1: instrument-keyed domains must carry an identity reference). No P06 identity logic.
 */
export function identityFor(decl, payload) {
  const env = decl.envelope.asOf;
  let asOf = payload[env.source];
  if (env.transform === 'dateToIsoUtc') asOf = `${asOf}T00:00:00.000Z`;
  const venueEntry = decl.entries.find((e) => e['MD-1'].fieldSegment === 'venueRef');
  const venueRef = venueEntry !== undefined ? payload[venueEntry['MD-2'].providerElement] : undefined;
  const identity = resolveIdentityRef({
    securities: identityFixtures().securities,
    register: REGISTER,
    canonicalSecurityId: payload[decl.envelope.identitySource],
    asOf,
    venueRef,
  });
  return identity;
}

/**
 * Run ONE fixture case through the pipeline.
 * @param {string} caseId
 * @param {object} [overrides]  context overrides (e.g. `{ mode: 'PIT' }`)
 */
export function runCase(caseId, overrides = {}) {
  const fx = normalizationFixtures();
  const c = fx.cases.find((x) => x.caseId === caseId);
  if (c === undefined) throw new Error(`unknown case '${caseId}'`);
  const decl = declared(c.mappingRef);
  const identity = identityFor(decl, c.payload);
  return normalizePayload({
    payload: c.payload,
    mapping: decl,
    context: {
      ...fx.context,
      mode: c.mode,
      // M-3: the provenance reference points at the SOURCE RECORD, never a provider field name.
      sourceRecordRef: c.payload._fixtureId,
      identity,
      identityMappingVersion: identity.identityMappingVersion,
      ...overrides,
    },
  });
}

/** The golden canonical output committed for a case (generated, never hand-edited). */
export function goldenFor(caseId) {
  return normalizationFixtures().golden[caseId];
}

/** Provider-native names that must never appear in a canonical record (M-3). */
export const PROVIDER_NATIVE_VOCABULARY = Object.freeze([
  'sym', 'tradePrice', 'bidPx', 'askPx', 'bidSz', 'askSz', 'ccy', 'quoteTs',
  'officialClose', 'prevClose', 'vol', 'trades', 'vwap', 'sessionDate',
  'pe', 'evEbitda', 'fcfYield', 'asOfTs',
]);
