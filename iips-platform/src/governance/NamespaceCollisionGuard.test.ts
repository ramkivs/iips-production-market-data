/**
 * ADR-01 C1–C6 Namespace Collision Guard — Test Suite
 * 
 * Authority: D41 External Remediation Work Request (Workstream A, E-A4)
 * 
 * Tests prove:
 *   - C1: Market-data fields must carry MD: prefix
 *   - C2/C3: Collision detection fails closed
 *   - C4: High-risk bare keys rejected
 *   - C5: Duplicate contributing IDs rejected
 *   - C6: Company inputs must not carry MD: prefix
 *   - guardedMerge: Produces correct output when guard passes
 *   - Mutation proof: Tests detect literal/guard removal
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  NAMESPACE_TOKEN,
  HIGH_RISK_COLLISION_KEYS,
  NamespaceCollisionViolation,
  isNamespaced,
  assertC1,
  assertC2C3,
  assertC4,
  assertC5,
  assertC6,
  assertCollisionGuard,
  guardedMerge,
} from './NamespaceCollisionGuard';

describe('NamespaceCollisionGuard', () => {
  describe('C1 — MD: namespace prefix required', () => {
    it('passes when all fields carry MD: prefix', () => {
      assert.doesNotThrow(() => assertC1(['MD:D01.price', 'MD:D02.open', 'MD:D03.revenue']));
    });
    it('fails when a field lacks MD: prefix', () => {
      assert.throws(() => assertC1(['MD:D01.price', 'peRatio']), (err: any) => {
        assert.equal(err.name, 'NamespaceCollisionViolation');
        assert.equal(err.rule, 'C1');
        return true;
      });
    });
  });

  describe('C2/C3 — collision detection (fail-closed)', () => {
    it('passes when no collision between fields and company inputs', () => {
      assert.doesNotThrow(() => assertC2C3(
        ['MD:D01.price', 'MD:D02.open'],
        ['companyName', 'ticker']
      ));
    });
    it('fails when collision detected', () => {
      assert.throws(() => assertC2C3(
        ['MD:D01.peRatio', 'MD:D02.open'],
        ['peRatio', 'companyName']
      ), (err: any) => {
        assert.equal(err.rule, 'C2');
        assert.ok(err.detail.collisions.includes('peRatio'));
        return true;
      });
    });
  });

  describe('C4 — high-risk bare keys rejected', () => {
    it('passes when high-risk keys are namespaced', () => {
      assert.doesNotThrow(() => assertC4(['MD:D01.peRatio', 'MD:D01.evEbitda']));
    });
    it('fails when high-risk keys are bare', () => {
      assert.throws(() => assertC4(['peRatio', 'MD:D02.open']), (err: any) => {
        assert.equal(err.rule, 'C4');
        return true;
      });
    });
  });

  describe('C5 — unique contributing IDs', () => {
    it('passes when IDs are unique', () => {
      assert.doesNotThrow(() => assertC5(['snap-1', 'snap-2', 'snap-3']));
    });
    it('fails on duplicate IDs', () => {
      assert.throws(() => assertC5(['snap-1', 'snap-2', 'snap-1']), (err: any) => {
        assert.equal(err.rule, 'C5');
        return true;
      });
    });
  });

  describe('C6 — company inputs must not carry MD:', () => {
    it('passes when company inputs have no MD: prefix', () => {
      assert.doesNotThrow(() => assertC6(['companyName', 'ticker', 'revenue']));
    });
    it('fails when company input carries MD: prefix', () => {
      assert.throws(() => assertC6(['MD:D01.price', 'companyName']), (err: any) => {
        assert.equal(err.rule, 'C6');
        return true;
      });
    });
  });

  describe('guardedMerge — safe merge after guard', () => {
    it('produces correct merged output', () => {
      const result = guardedMerge(
        { 'MD:D01.price': 100, 'MD:D02.open': 99 },
        { companyName: 'ACME', ticker: 'ACM' }
      );
      assert.equal(result.price, 100);
      assert.equal(result.open, 99);
      assert.equal(result.companyName, 'ACME');
      assert.equal(result.ticker, 'ACM');
    });

    it('fails closed on C1 violation (bare field key)', () => {
      assert.throws(() => guardedMerge(
        { peRatio: 15.2 },  // bare high-risk key
        { companyName: 'ACME' }
      ), (err: any) => err.name === 'NamespaceCollisionViolation');
    });

    it('fails closed on C2 violation (collision)', () => {
      assert.throws(() => guardedMerge(
        { 'MD:D01.peRatio': 15.2 },
        { peRatio: 12.0 }  // collision after stripping
      ), (err: any) => err.name === 'NamespaceCollisionViolation');
    });

    it('fails closed on C5 violation (duplicate contributing IDs)', () => {
      assert.throws(() => guardedMerge(
        { 'MD:D01.price': 100 },
        { companyName: 'ACME' },
        ['snap-1', 'snap-1']  // duplicate
      ), (err: any) => err.name === 'NamespaceCollisionViolation');
    });

    it('C2 prevents silent overwrite when company input collides with stripped field', () => {
      // Guard correctly detects collision: MD:D01.price strips to 'price',
      // which collides with company input 'price'. Fail-closed is correct.
      assert.throws(() => guardedMerge(
        { 'MD:D01.price': 100, 'MD:D02.volume': 50000 },
        { price: 105 }
      ), (err: any) => {
        assert.equal(err.rule, 'C2');
        return true;
      });
    });

    it('safe merge with non-colliding namespaced fields and company inputs', () => {
      const result = guardedMerge(
        { 'MD:D01.price': 100, 'MD:D02.volume': 50000 },
        { companyName: 'ACME', ticker: 'ACM' }
      );
      assert.equal(result.price, 100);
      assert.equal(result.volume, 50000);
      assert.equal(result.companyName, 'ACME');
      assert.equal(result.ticker, 'ACM');
    });
  });

  describe('assertCollisionGuard — full C1–C6 integration', () => {
    it('passes with valid inputs', () => {
      assert.doesNotThrow(() => assertCollisionGuard({
        fieldKeys: ['MD:D01.price', 'MD:D02.open', 'MD:D03.revenue'],
        companyInputKeys: ['companyName', 'ticker'],
        contributingIds: ['snap-1', 'snap-2'],
      }));
    });

    it('fails on any single violation', () => {
      assert.throws(() => assertCollisionGuard({
        fieldKeys: ['MD:D01.price', 'bareField'],
        companyInputKeys: ['companyName'],
      }));
    });
  });

  describe('Mutation proof — tests detect guard removal', () => {
    it('C1 test would fail if assertC1 returned without checking', () => {
      // If assertC1 were replaced with `() => {}`, this test would fail
      assert.throws(() => assertC1(['bareKey']));
    });

    it('C4 test would fail if assertC4 returned without checking', () => {
      assert.throws(() => assertC4(['peRatio']));
    });

    it('guardedMerge test would fail if merge skipped guard', () => {
      // If guardedMerge were replaced with plain spread, this would not throw
      assert.throws(() => guardedMerge({ peRatio: 15 }, { companyName: 'X' }));
    });
  });
});
