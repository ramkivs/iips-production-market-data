/**
 * Personal-local authorization decision tests.
 *
 * Verifies that evaluatePortSaveGuard() recognizes the explicitly enabled
 * personal-local principal within the authorization model itself (env switch
 * + validated binding), while preserving W-1 default-deny for every other
 * caller and execution context.
 *
 * These are pure unit tests of the authorization decision — they do not
 * provision, reset, or touch any user database.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluatePortSaveGuard, type AuthorizationContext } from '../src/persistence/portfolio_store.js';

const PERSONAL_ENV = { IIPS_LOCAL_PERSONAL_USE: '1' };
const GOVERNED_ENV = {};

function context(env: Record<string, string>, owner?: string, tenant?: string): AuthorizationContext {
  return { env, canonicalOwnerId: owner, tenantId: tenant };
}

describe('personal-local authorization decision', () => {
  it('authorizes personal-local principal through env switch + binding', () => {
    const guard = evaluatePortSaveGuard(context(PERSONAL_ENV, 'personal-owner', 'personal-tenant'));
    assert.equal(guard.authorized, true);
    assert.ok(guard.reasons.some((r) => r.includes('personal-local authorization')));
    assert.ok(guard.reasons.some((r) => r.includes('personal-owner@personal-tenant')));
  });

  it('denies when env switch is set but no binding context is provided', () => {
    const guard = evaluatePortSaveGuard(context(PERSONAL_ENV));
    assert.equal(guard.authorized, false);
    assert.ok(guard.reasons.some((r) => r.includes('no validated principal/membership binding')));
  });

  it('denies when binding context is provided but env switch is absent', () => {
    const guard = evaluatePortSaveGuard(context(GOVERNED_ENV, 'personal-owner', 'personal-tenant'));
    assert.equal(guard.authorized, false);
    assert.deepEqual(guard.reasons, [
      'W-1(3): Gate 4 qualification not accepted',
      'W-1(4): Gate 5 admission not accepted',
    ]);
  });

  it('denies when neither env switch nor binding is provided (no args)', () => {
    const guard = evaluatePortSaveGuard();
    assert.equal(guard.authorized, false);
    assert.deepEqual(guard.reasons, [
      'W-1(3): Gate 4 qualification not accepted',
      'W-1(4): Gate 5 admission not accepted',
    ]);
  });

  it('denies when env switch is set to a non-"1" value even with binding', () => {
    const guard = evaluatePortSaveGuard(context({ IIPS_LOCAL_PERSONAL_USE: '0' }, 'personal-owner', 'personal-tenant'));
    assert.equal(guard.authorized, false);
    assert.deepEqual(guard.reasons, [
      'W-1(3): Gate 4 qualification not accepted',
      'W-1(4): Gate 5 admission not accepted',
    ]);
  });

  it('W-1 default deny is preserved for governed callers (no context)', () => {
    // Simulates DurablePortfolioStorePort.assertWritable(), gateAPrimeValidation,
    // directP1Provisioning — all call evaluatePortSaveGuard() with no context.
    const guard = evaluatePortSaveGuard();
    assert.equal(guard.authorized, false);
    assert.equal(guard.reasons.length, 2);
  });
});
