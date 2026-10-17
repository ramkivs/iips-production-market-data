/**
 * Institutional Investment Platform System (IIPS)
 * G-2 / Gate B — Canonical Identity Resolution-or-Refusal Tests (L-IPC-1 C12 / DP-2 Option 2F)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Execution Mode: NON_PRODUCTION
 *
 * These tests pin the verified off-main gap closed by this workstream: the existing write
 * path defaults `companyId` to '', `identityStatus` to 'RESOLVED', `resolutionDisposition`
 * to 'CANONICAL_P04' and tolerates an operator bypass. The boundary under test may produce
 * those fields ONLY as the product of a real single-match resolution.
 *
 * A ticker-shaped value is NOT canonical identity: an unmapped symbol refuses rather than
 * being echoed back as an identifier.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { CanonicalIdentityBoundary } from '../src/user_portfolio/canonical_identity.js';
import { UserPortfolioOperations } from '../src/user_portfolio/operations.js';
import { isUserPortfolioRefusal, type UserPortfolioRefusalCode } from '../src/user_portfolio/errors.js';
import type { EffectiveDatedMapping } from '../src/identity/mapping_store.js';

import { createFixture } from './gate_b_support.test.js';

const ISIN = 'INE009A01021';

const CANONICAL_MAPPING: EffectiveDatedMapping = {
  companyId: ISIN,
  identifierType: 'NSE_SYMBOL',
  identifierValue: 'INFY',
  effectiveFrom: '2020-01-01',
};

function boundaryWith(mappings: readonly EffectiveDatedMapping[] = [CANONICAL_MAPPING]): CanonicalIdentityBoundary {
  const boundary = new CanonicalIdentityBoundary();
  boundary.seed(mappings);
  return boundary;
}

function refusalCode(error: unknown): UserPortfolioRefusalCode {
  assert.ok(isUserPortfolioRefusal(error), `expected a governed refusal, observed: ${String(error)}`);
  return error.code;
}

test('GATE-B-C1: a single canonical match resolves, and the status fields are PRODUCED', () => {
  const resolution = boundaryWith().resolve({ identifierType: 'NSE_SYMBOL', identifierValue: 'INFY' });

  assert.equal(resolution.companyId, ISIN, 'the mapped canonical identifier is returned');
  assert.equal(resolution.identityStatus, 'RESOLVED');
  assert.equal(resolution.resolutionDisposition, 'CANONICAL_P04');
  assert.equal(resolution.identifierType, 'NSE_SYMBOL');
  assert.equal(resolution.identifierValue, 'INFY');
  assert.equal(typeof resolution.asOf, 'string');

  // The result carries exactly the six governed fields — no bypass, no claim, no debug data.
  assert.deepEqual(Object.keys(resolution).sort(), [
    'asOf',
    'companyId',
    'identifierType',
    'identifierValue',
    'identityStatus',
    'resolutionDisposition',
  ]);
});

test('GATE-B-C2: a ticker-shaped value is NOT used as canonical identity when no mapping exists', () => {
  const boundary = boundaryWith([]);

  // Unmapped: refuse. Never echo identifierValue back as companyId; never default to ''.
  assert.throws(() => boundary.resolve({ identifierType: 'NSE_SYMBOL', identifierValue: 'INFY' }), (error: unknown) => {
    assert.equal(refusalCode(error), 'CANONICAL_IDENTITY_UNRESOLVED');
    assert.equal((error as { resolution?: unknown }).resolution, undefined, 'no partial resolution may escape');
    return true;
  });

  const evidence = boundary.quarantineEvidence();
  assert.equal(evidence.length, 1, 'the refusal retains LOCAL quarantine evidence');
  assert.equal(evidence[0]?.reason, 'UNMAPPED_IDENTIFIER');
  assert.equal(evidence[0]?.rawIdentifier, 'INFY');
});

test('GATE-B-C3: an ambiguous collision refuses, and unmapped ≡ ambiguous to the caller', () => {
  const boundary = boundaryWith([
    CANONICAL_MAPPING,
    { ...CANONICAL_MAPPING, companyId: 'INE002A01018' }, // second company, same symbol + window
  ]);

  const capture = (request: unknown): string => {
    try {
      boundary.resolve(request);
    } catch (error) {
      return refusalCode(error);
    }
    throw new Error('expected a refusal');
  };

  const ambiguous = capture({ identifierType: 'NSE_SYMBOL', identifierValue: 'INFY' });
  const unmapped = capture({ identifierType: 'NSE_SYMBOL', identifierValue: 'NOT-A-SYMBOL' });
  assert.equal(ambiguous, 'CANONICAL_IDENTITY_UNRESOLVED');
  assert.equal(ambiguous, unmapped, 'C6 — the two failure modes are not distinguishable');

  const reasons = boundary.quarantineEvidence().map((record) => record.reason);
  assert.deepEqual(reasons, ['AMBIGUOUS_COLLISION', 'UNMAPPED_IDENTIFIER']);
});

test('GATE-B-C4: duplicate mappings to the SAME canonical id resolve (not a false ambiguity)', () => {
  const boundary = boundaryWith([CANONICAL_MAPPING, { ...CANONICAL_MAPPING, effectiveFrom: '2021-01-01' }]);
  assert.equal(boundary.resolve({ identifierType: 'NSE_SYMBOL', identifierValue: 'infy' }).companyId, ISIN);
  assert.deepEqual(boundary.quarantineEvidence(), []);
});

test('GATE-B-C5: effective dating is honoured — expired mappings do not resolve', () => {
  const boundary = boundaryWith([
    {
      companyId: ISIN,
      identifierType: 'NSE_SYMBOL',
      identifierValue: 'INFY',
      effectiveFrom: '2020-01-01',
      effectiveTo: '2020-12-31',
    },
  ]);

  const inside = boundary.resolve({
    identifierType: 'NSE_SYMBOL',
    identifierValue: 'INFY',
    asOf: '2020-06-01',
  });
  assert.equal(inside.companyId, ISIN);

  assert.throws(
    () => boundary.resolve({ identifierType: 'NSE_SYMBOL', identifierValue: 'INFY', asOf: '2024-06-01' }),
    (error: unknown) => refusalCode(error) === 'CANONICAL_IDENTITY_UNRESOLVED'
  );
});

test('GATE-B-C6: caller-supplied identity is REFUSED first, before the mapping store is consulted (C7)', () => {
  const boundary = boundaryWith();
  const claims: Array<Record<string, unknown>> = [
    { identifierType: 'NSE_SYMBOL', identifierValue: 'INFY', companyId: ISIN },
    { identifierType: 'NSE_SYMBOL', identifierValue: 'INFY', runtimeCompanyId: ISIN },
    { identifierType: 'NSE_SYMBOL', identifierValue: 'INFY', identityStatus: 'RESOLVED' },
    { identifierType: 'NSE_SYMBOL', identifierValue: 'INFY', resolutionDisposition: 'CANONICAL_P04' },
    { identifierType: 'NSE_SYMBOL', identifierValue: 'INFY', tenantId: 'T-1' },
    { identifierType: 'NSE_SYMBOL', identifierValue: 'INFY', applicationUserId: 'u-1' },
    { identifierType: 'NSE_SYMBOL', identifierValue: 'INFY', owner: 'u-1' },
    { identifierType: 'NSE_SYMBOL', identifierValue: 'INFY', bypass: true },
    { identifierType: 'NSE_SYMBOL', identifierValue: 'INFY', operatorBypass: true },
  ];

  for (const claim of claims) {
    const key = Object.keys(claim).find((candidate) => !['identifierType', 'identifierValue'].includes(candidate));
    assert.throws(
      () => boundary.resolve(claim),
      (error: unknown) => refusalCode(error) === 'CALLER_SUPPLIED_AUTHORITY',
      `claim ${key} must be refused`
    );
  }

  // Refused BEFORE resolution: no quarantine row, no partial match, no evidence leak.
  assert.deepEqual(boundary.quarantineEvidence(), []);
});

test('GATE-B-C7: the operator-bypass token is refused as a value', () => {
  const boundary = boundaryWith();
  assert.throws(
    () => boundary.resolve({ identifierType: 'NSE_SYMBOL', identifierValue: 'NON_PRODUCTION_OPERATOR_BYPASS' }),
    (error: unknown) => refusalCode(error) === 'CANONICAL_IDENTITY_UNRESOLVED'
  );
  // The token is treated as data, is never mapped, and never yields a resolution.
  const evidence = boundary.quarantineEvidence();
  assert.equal(evidence.length, 1);
  assert.equal(evidence[0]?.rawIdentifier, 'NON_PRODUCTION_OPERATOR_BYPASS');
});

test('GATE-B-C8: malformed requests are refused, never defaulted to a resolution', () => {
  const boundary = boundaryWith();
  const malformed: unknown[] = [
    undefined,
    null,
    [],
    'INFY',
    {},
    { identifierValue: 'INFY' },
    { identifierType: 'NSE_SYMBOL' },
    { identifierType: 'NSE_SYMBOL', identifierValue: '   ' },
    { identifierType: 'NSE_SYMBOL', identifierValue: 'x'.repeat(65) },
    { identifierType: 'TICKER', identifierValue: 'INFY' },
    { identifierType: 'NSE_SYMBOL', identifierValue: 'INFY', asOf: 'yesterday' },
    { identifierType: 'NSE_SYMBOL', identifierValue: 'INFY', asOf: '2024-13-45' },
    { identifierType: 'NSE_SYMBOL', identifierValue: 'INFY', extraKey: 'x' },
  ];

  for (const request of malformed) {
    assert.throws(
      () => boundary.resolve(request),
      (error: unknown) => refusalCode(error) === 'MALFORMED_REQUEST',
      `request ${JSON.stringify(request)} must be refused as malformed`
    );
  }
  assert.deepEqual(boundary.quarantineEvidence(), [], 'a malformed request never reaches the store');
});

test('GATE-B-C9: the C12 boundary is re-enforced at the operations layer, not only at IPC', () => {
  const fixture = createFixture();
  try {
    const boundary = boundaryWith();
    const operations = new UserPortfolioOperations(fixture.store, boundary);

    const resolved = operations.resolveHoldingIdentity({ identifierType: 'NSE_SYMBOL', identifierValue: 'INFY' });
    assert.equal(resolved.resolution.companyId, ISIN);

    assert.throws(
      () => operations.resolveHoldingIdentity({ identifierType: 'NSE_SYMBOL', identifierValue: 'INFY', companyId: ISIN }),
      (error: unknown) => refusalCode(error) === 'CALLER_SUPPLIED_AUTHORITY'
    );
    assert.throws(
      () => operations.resolveHoldingIdentity({ identifierType: 'NSE_SYMBOL', identifierValue: 'NOPE' }),
      (error: unknown) => refusalCode(error) === 'CANONICAL_IDENTITY_UNRESOLVED'
    );
  } finally {
    fixture.cleanup();
  }
});
