import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  assertEngineDispatchGuard,
  detectBareEngineCollisionKeys,
  assertNoBareEngineCollisionKeys,
  validateEngineDispatch,
  ENGINE_COLLISION_SURFACE,
  P11_02_MODULE,
} from '../src/namespaceCollisionGuard.js';
import { NAMESPACE_TOKEN, NamespaceViolation } from '../../p05/src/namespace.js';

const NS = NAMESPACE_TOKEN;

describe('P11-02 namespaceCollisionGuard', () => {
  describe('assertEngineDispatchGuard', () => {
    it('passes when all field keys are namespaced and no collisions', () => {
      const result = assertEngineDispatchGuard({
        fieldKeys: [`${NS}fundamentals.revenue`, `${NS}fundamentals.ebitda`],
        companyInputKeys: ['id', 'segment'],
        contributing: [{ snapshotId: 'snap-1', keys: ['revenue', 'ebitda'] }],
      });
      assert.equal(result.valid, true);
      assert.equal(result.guard, 'C1-C6');
    });

    it('fails when a field key is not namespaced (C1)', () => {
      assert.throws(
        () => assertEngineDispatchGuard({
          fieldKeys: ['revenue', `${NS}fundamentals.ebitda`],
          companyInputKeys: ['id'],
          contributing: [{ snapshotId: 'snap-1', keys: ['revenue', 'ebitda'] }],
        }),
        NamespaceViolation,
      );
    });

    it('fails when a company input key is namespaced (C2)', () => {
      assert.throws(
        () => assertEngineDispatchGuard({
          fieldKeys: [`${NS}fundamentals.revenue`],
          companyInputKeys: [`${NS}fundamentals.ebitda`],
          contributing: [{ snapshotId: 'snap-1', keys: ['revenue'] }],
        }),
        NamespaceViolation,
      );
    });

    it('fails when field keys and company input keys collide (C3)', () => {
      assert.throws(
        () => assertEngineDispatchGuard({
          fieldKeys: [`${NS}fundamentals.revenue`],
          companyInputKeys: [`${NS}fundamentals.revenue`],
          contributing: [{ snapshotId: 'snap-1', keys: ['revenue'] }],
        }),
        NamespaceViolation,
      );
    });

    it('fails when contributing snapshots have overlapping keys (C4)', () => {
      assert.throws(
        () => assertEngineDispatchGuard({
          fieldKeys: [`${NS}fundamentals.revenue`],
          companyInputKeys: ['id'],
          contributing: [
            { snapshotId: 'snap-1', keys: ['revenue'] },
            { snapshotId: 'snap-2', keys: ['revenue'] },
          ],
        }),
        NamespaceViolation,
      );
    });
  });

  describe('detectBareEngineCollisionKeys', () => {
    it('detects bare collision keys', () => {
      const result = detectBareEngineCollisionKeys([
        'peRatio', `${NS}fundamentals.revenue`, 'evEbitda', 'id',
      ]);
      assert.equal(result.safe, false);
      assert.deepEqual(result.offenders, ['evEbitda', 'id', 'peRatio']);
    });

    it('returns safe when all collision keys are namespaced', () => {
      const result = detectBareEngineCollisionKeys([
        `${NS}valuation.peRatio`, `${NS}fundamentals.revenue`, `${NS}valuation.evEbitda`,
      ]);
      assert.equal(result.safe, true);
      assert.deepEqual(result.offenders, []);
    });

    it('returns safe when no collision keys are present', () => {
      const result = detectBareEngineCollisionKeys([
        `${NS}fundamentals.revenue`, `${NS}fundamentals.ebitda`, 'segment_code',
      ]);
      assert.equal(result.safe, true);
    });
  });

  describe('assertNoBareEngineCollisionKeys', () => {
    it('passes when no bare collision keys', () => {
      assert.doesNotThrow(() => {
        assertNoBareEngineCollisionKeys([
          `${NS}valuation.peRatio`, `${NS}fundamentals.revenue`,
        ]);
      });
    });

    it('throws when bare collision keys detected', () => {
      assert.throws(
        () => assertNoBareEngineCollisionKeys(['peRatio', `${NS}fundamentals.revenue`]),
        NamespaceViolation,
      );
    });
  });

  describe('validateEngineDispatch', () => {
    it('passes complete validation', () => {
      const result = validateEngineDispatch({
        fieldKeys: [`${NS}fundamentals.revenue`, `${NS}valuation.peRatio`],
        companyInputKeys: ['id', 'segment_code'],
        contributing: [{ snapshotId: 'snap-1', keys: ['revenue', 'peRatio'] }],
      });
      assert.equal(result.valid, true);
      assert.equal(result.guard, 'C1-C6+NG-5');
      assert.equal(result.collisionSurfaceChecked, true);
    });

    it('allows bare collision keys in company inputs (C2 — company inputs are intentionally non-namespaced)', () => {
      // Company inputs are intentionally non-namespaced (C2).
      // The collision guard prevents provider-native names from leaking via market data,
      // not via company inputs. Bare collision keys in company inputs are legal.
      assert.doesNotThrow(() => validateEngineDispatch({
        fieldKeys: [`${NS}fundamentals.revenue`],
        companyInputKeys: ['id', 'peRatio'],
        contributing: [{ snapshotId: 'snap-1', keys: ['revenue'] }],
      }));
    });
  });

  describe('ENGINE_COLLISION_SURFACE', () => {
    it('contains the expected high-risk keys', () => {
      assert.ok(ENGINE_COLLISION_SURFACE.includes('peRatio'));
      assert.ok(ENGINE_COLLISION_SURFACE.includes('evEbitda'));
      assert.ok(ENGINE_COLLISION_SURFACE.includes('evRevenue'));
      assert.ok(ENGINE_COLLISION_SURFACE.includes('fcfYield'));
    });

    it('is frozen', () => {
      assert.ok(Object.isFrozen(ENGINE_COLLISION_SURFACE));
    });
  });

  describe('module identity', () => {
    it('has correct module identifier', () => {
      assert.equal(P11_02_MODULE, 'P11-02-NAMESPACE-COLLISION-GUARD');
    });
  });
});
