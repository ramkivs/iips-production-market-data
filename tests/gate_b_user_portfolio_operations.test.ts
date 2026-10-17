/**
 * Institutional Investment Platform System (IIPS)
 * G-2 / Gate B — User-Portfolio Operation Tests (L-IPC-1 C8, C9, C11)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Execution Mode: NON_PRODUCTION
 *
 * Covers the four read operations; scope binding to the ACTIVE local principal (a caller
 * cannot widen or replace the scope, and tenant is part of the scope); the read-only posture
 * (every write intent refuses, nothing is mutated); empty-portfolio aggregates; malformed
 * payload handling; and fail-closed behaviour when the store is unavailable.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { createPortfolioDispatcher } from '../src/ipc/entrypoint.js';
import { isIpcRefusal, type IpcRefusalReason } from '../src/ipc/errors.js';
import { UserPortfolioOperations } from '../src/user_portfolio/operations.js';
import { CanonicalIdentityBoundary } from '../src/user_portfolio/canonical_identity.js';
import { isUserPortfolioRefusal, type UserPortfolioRefusalCode } from '../src/user_portfolio/errors.js';

import { createFixture, provisionSecondPrincipal, type Fixture } from './gate_b_support.test.js';

function scopeOf(fixture: Fixture): { applicationUserId: string; tenantId: string } {
  return { applicationUserId: fixture.applicationUserId, tenantId: fixture.tenantId };
}

function operationsOf(fixture: Fixture): UserPortfolioOperations {
  return new UserPortfolioOperations(fixture.store, new CanonicalIdentityBoundary());
}

function refusalCode(error: unknown): UserPortfolioRefusalCode {
  assert.ok(isUserPortfolioRefusal(error), `expected a governed refusal, observed: ${String(error)}`);
  return error.code;
}

/** The dispatcher speaks the IPC vocabulary: portfolio refusals are mapped before they leave. */
function ipcReason(error: unknown): IpcRefusalReason {
  assert.ok(isIpcRefusal(error), `expected an IPC refusal, observed: ${String(error)}`);
  return error.reason;
}

test('GATE-B-O1: list returns ONLY the bound principal\'s portfolios', () => {
  const fixture = createFixture();
  try {
    const second = provisionSecondPrincipal(fixture);
    fixture.store.createPortfolio({ ...scopeOf(fixture), portfolioId: 'P-MINE', portfolioName: 'Mine' });
    fixture.store.createPortfolio({
      applicationUserId: second.applicationUserId,
      tenantId: second.tenantId,
      portfolioId: 'P-THEIRS',
      portfolioName: 'Theirs',
    });

    const listed = operationsOf(fixture).list(scopeOf(fixture));
    assert.deepEqual(
      listed.map((entry) => entry.portfolioId),
      ['P-MINE'],
      'a foreign portfolio must never appear in the bound list'
    );
    assert.equal(listed[0]?.portfolioName, 'Mine');
    assert.equal(listed[0]?.revision, 0);
  } finally {
    fixture.cleanup();
  }
});

test('GATE-B-O2: list is empty (not an error) for a principal with no portfolios', () => {
  const fixture = createFixture();
  try {
    assert.deepEqual(operationsOf(fixture).list(scopeOf(fixture)), []);
  } finally {
    fixture.cleanup();
  }
});

test('GATE-B-O3: get returns the caller\'s own portfolio and collapses foreign ≡ missing', () => {
  const fixture = createFixture();
  try {
    const second = provisionSecondPrincipal(fixture);
    fixture.store.createPortfolio({ ...scopeOf(fixture), portfolioId: 'P-MINE', portfolioName: 'Mine' });
    fixture.store.createPortfolio({
      applicationUserId: second.applicationUserId,
      tenantId: second.tenantId,
      portfolioId: 'P-THEIRS',
      portfolioName: 'Theirs',
    });

    const operations = operationsOf(fixture);
    const own = operations.get(scopeOf(fixture), { portfolioId: 'P-MINE' });
    assert.equal(own.portfolioId, 'P-MINE');
    assert.equal(own.portfolioName, 'Mine');

    const capture = (portfolioId: string): string => {
      try {
        operations.get(scopeOf(fixture), { portfolioId });
      } catch (error) {
        return refusalCode(error);
      }
      throw new Error('expected a refusal');
    };

    assert.equal(capture('P-THEIRS'), 'RESOURCE_UNAVAILABLE');
    assert.equal(capture('P-DOES-NOT-EXIST'), 'RESOURCE_UNAVAILABLE');
    assert.equal(capture('P-THEIRS'), capture('P-DOES-NOT-EXIST'), 'foreign and missing must be identical');
  } finally {
    fixture.cleanup();
  }
});

test('GATE-B-O4: the tenant is part of the scope — the same user in another tenant sees nothing', () => {
  const fixture = createFixture();
  try {
    // Same application user, deliberately provisioned under a DIFFERENT tenant.
    fixture.store.createPortfolio({
      applicationUserId: fixture.applicationUserId,
      tenantId: 'TENANT-OTHER',
      portfolioId: 'P-OTHER-TENANT',
      portfolioName: 'Other tenant',
    });

    const operations = operationsOf(fixture);
    assert.deepEqual(operations.list(scopeOf(fixture)), [], 'tenant is not a display filter');
    assert.throws(() => operations.get(scopeOf(fixture), { portfolioId: 'P-OTHER-TENANT' }), (error: unknown) =>
      refusalCode(error) === 'RESOURCE_UNAVAILABLE'
    );
  } finally {
    fixture.cleanup();
  }
});

test('GATE-B-O5: analytics on an empty portfolio reports zeroes consistently', () => {
  const fixture = createFixture();
  try {
    fixture.store.createPortfolio({ ...scopeOf(fixture), portfolioId: 'P-EMPTY', portfolioName: 'Empty' });
    const analytics = operationsOf(fixture).analytics(scopeOf(fixture), { portfolioId: 'P-EMPTY' });

    assert.equal(analytics.portfolioId, 'P-EMPTY');
    assert.equal(analytics.holdingsCount, 0);
    assert.equal(analytics.totalMarketValue, 0);
    assert.equal(analytics.weightSumPercentage, 0);
    assert.equal(analytics.largestHoldingWeightPercentage, 0);
    assert.equal(analytics.contributionsCount, 0);
  } finally {
    fixture.cleanup();
  }
});

test('GATE-B-O6: EVERY write intent is refused and NOTHING is created or mutated', () => {
  const fixture = createFixture();
  try {
    const operations = operationsOf(fixture);
    const before = operations.list(scopeOf(fixture));

    const attempts: Array<Record<string, unknown>> = [
      { portfolioId: 'P-NEW', portfolioName: 'Should not exist', holdings: [] },
      { portfolioId: 'P-EMPTY-2', portfolioName: 'Also not', holdings: [{ symbol: 'INFY', weightPercentage: 10 }] },
      {}, // even a shapeless write refuses rather than being dispatched elsewhere
    ];

    for (const payload of attempts) {
      assert.throws(() => operations.save(scopeOf(fixture), payload), (error: unknown) =>
        refusalCode(error) === 'WRITE_NOT_AUTHORIZED'
      );
    }

    assert.deepEqual(operations.list(scopeOf(fixture)), before, 'the read model must be unchanged');
    assert.throws(() => operations.get(scopeOf(fixture), { portfolioId: 'P-NEW' }), (error: unknown) =>
      refusalCode(error) === 'RESOURCE_UNAVAILABLE'
    );
  } finally {
    fixture.cleanup();
  }
});

test('GATE-B-O7: malformed payloads and an incomplete scope are refused, never defaulted', () => {
  const fixture = createFixture();
  try {
    const operations = operationsOf(fixture);
    const malformed: unknown[] = [
      undefined,
      null,
      [],
      'P-1',
      {},
      { portfolioId: '' },
      { portfolioId: '../etc/passwd' },
      { portfolioId: 'x'.repeat(200) },
      { portfolioId: 7 },
    ];

    for (const payload of malformed) {
      assert.throws(() => operations.get(scopeOf(fixture), payload), (error: unknown) =>
        refusalCode(error) === 'MALFORMED_REQUEST'
      );
      assert.throws(() => operations.analytics(scopeOf(fixture), payload), (error: unknown) =>
        refusalCode(error) === 'MALFORMED_REQUEST'
      );
    }

    // A scope that is not fully specified refuses; it is never widened or inferred.
    assert.throws(
      () => operations.list({ applicationUserId: fixture.applicationUserId, tenantId: '   ' }),
      (error: unknown) => refusalCode(error) === 'MALFORMED_REQUEST'
    );
    assert.throws(
      () => operations.list({ tenantId: fixture.tenantId } as unknown as { applicationUserId: string; tenantId: string }),
      (error: unknown) => refusalCode(error) === 'MALFORMED_REQUEST'
    );
  } finally {
    fixture.cleanup();
  }
});

test('GATE-B-O8: an unavailable store fails CLOSED — it never degrades to an empty success', () => {
  const fixture = createFixture();
  try {
    const broken = {
      listPortfolios(): never {
        throw new Error('store is down');
      },
      getPortfolio(): never {
        throw new Error('store is down');
      },
      createPortfolio(): never {
        throw new Error('store is down');
      },
      saveHoldings(): never {
        throw new Error('store is down');
      },
    } as unknown as ConstructorParameters<typeof UserPortfolioOperations>[0];

    const operations = new UserPortfolioOperations(broken, new CanonicalIdentityBoundary());

    assert.throws(() => operations.list(scopeOf(fixture)), (error: unknown) =>
      refusalCode(error) === 'RESOURCE_UNAVAILABLE'
    );
    assert.throws(() => operations.get(scopeOf(fixture), { portfolioId: 'P-1' }), (error: unknown) =>
      refusalCode(error) === 'RESOURCE_UNAVAILABLE'
    );
  } finally {
    fixture.cleanup();
  }
});

test('GATE-B-O9: the dispatcher takes scope from the resolved principal and refuses any caller scope', () => {
  const fixture = createFixture();
  try {
    const second = provisionSecondPrincipal(fixture);
    fixture.store.createPortfolio({ ...scopeOf(fixture), portfolioId: 'P-MINE', portfolioName: 'Mine' });
    fixture.store.createPortfolio({
      applicationUserId: second.applicationUserId,
      tenantId: second.tenantId,
      portfolioId: 'P-THEIRS',
      portfolioName: 'Theirs',
    });

    const dispatcher = createPortfolioDispatcher(operationsOf(fixture));
    const principal = {
      applicationUserId: fixture.applicationUserId,
      tenantId: fixture.tenantId,
      endpointId: fixture.endpointId,
    };

    assert.deepEqual([...dispatcher.operations], [
      'portfolio.list',
      'portfolio.get',
      'portfolio.analytics',
      'portfolio.save',
    ]);

    const listed = dispatcher.execute('portfolio.list', {}, { principal }) as Array<{ portfolioId: string }>;
    assert.deepEqual(listed.map((entry) => entry.portfolioId), ['P-MINE']);

    // There is no parameter for a caller scope; authority fields inside the payload REFUSE.
    assert.throws(
      () => dispatcher.execute('portfolio.list', { tenantId: second.tenantId }, { principal }),
      (error: unknown) => ipcReason(error) === 'CALLER_SUPPLIED_AUTHORITY'
    );
    assert.throws(
      () =>
        dispatcher.execute(
          'portfolio.get',
          { portfolioId: 'P-THEIRS', applicationUserId: second.applicationUserId },
          { principal }
        ),
      (error: unknown) => ipcReason(error) === 'CALLER_SUPPLIED_AUTHORITY'
    );

    // A foreign resource is still indistinguishable after dispatch.
    assert.throws(
      () => dispatcher.execute('portfolio.get', { portfolioId: 'P-THEIRS' }, { principal }),
      (error: unknown) => ipcReason(error) === 'RESOURCE_UNAVAILABLE'
    );

    // An operation outside the fixed set refuses; it is never routed dynamically.
    assert.throws(
      () => dispatcher.execute('portfolio.deleteAll', {}, { principal }),
      (error: unknown) => ipcReason(error) === 'UNKNOWN_OPERATION'
    );

    // A write dispatched through the fixed table still refuses.
    assert.throws(
      () => dispatcher.execute('portfolio.save', { portfolioId: 'P-MINE', holdings: [] }, { principal }),
      (error: unknown) => ipcReason(error) === 'WRITE_NOT_AUTHORIZED'
    );
  } finally {
    fixture.cleanup();
  }
});
