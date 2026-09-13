import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CERTIFIED_ENGINES,
  CERTIFIED_ENGINE_COUNT,
  getEngine,
  listEngineIds,
  listEnginesByInputStyle,
  listHighCollisionRiskEngines,
  AD4_REVALIDATION_CLAIM,
  P11_04_MODULE,
} from '../src/engineRegistry.js';

describe('P11-04 engineRegistry', () => {
  describe('CERTIFIED_ENGINES', () => {
    it('contains exactly 13 engines', () => {
      assert.equal(CERTIFIED_ENGINES.length, 13);
      assert.equal(CERTIFIED_ENGINE_COUNT, 13);
    });

    it('is frozen', () => {
      assert.ok(Object.isFrozen(CERTIFIED_ENGINES));
    });

    it('all engines have engineVersion 1.0.0', () => {
      for (const engine of CERTIFIED_ENGINES) {
        assert.equal(engine.engineVersion, '1.0.0');
      }
    });

    it('all engines have calibrationVersion 1.0.0', () => {
      for (const engine of CERTIFIED_ENGINES) {
        assert.equal(engine.calibrationVersion, '1.0.0');
      }
    });

    it('all engines have ontologyDimensions 8', () => {
      for (const engine of CERTIFIED_ENGINES) {
        assert.equal(engine.ontologyDimensions, 8);
      }
    });

    it('contains the expected engine IDs', () => {
      const ids = listEngineIds();
      assert.ok(ids.includes('sector.banking'));
      assert.ok(ids.includes('sector.insurance'));
      assert.ok(ids.includes('sector.capital-markets'));
      assert.ok(ids.includes('sector.healthcare'));
      assert.ok(ids.includes('sector.hospitality'));
      assert.ok(ids.includes('sector.energy'));
      assert.ok(ids.includes('sector.utilities'));
      assert.ok(ids.includes('sector.consumer'));
      assert.ok(ids.includes('sector.industrials'));
      assert.ok(ids.includes('sector.technology'));
      assert.ok(ids.includes('sector.telecom'));
      assert.ok(ids.includes('sector.auto'));
      assert.ok(ids.includes('sector.materials'));
    });

    it('7 coded engines have Low collision risk', () => {
      const coded = listEnginesByInputStyle('coded');
      assert.equal(coded.length, 7);
      for (const engine of coded) {
        assert.equal(engine.collisionRisk, 'Low');
      }
    });

    it('6 free-form engines have HIGH collision risk', () => {
      const freeform = listEnginesByInputStyle('free-form');
      assert.equal(freeform.length, 6);
      for (const engine of freeform) {
        assert.equal(engine.collisionRisk, 'HIGH');
      }
    });
  });

  describe('getEngine', () => {
    it('returns engine metadata by ID', () => {
      const engine = getEngine('sector.banking');
      assert.equal(engine.engineId, 'sector.banking');
      assert.equal(engine.ies, 'IES-006');
      assert.equal(engine.sector, 'Banking');
      assert.equal(engine.inputStyle, 'coded');
    });

    it('throws for unknown engine ID', () => {
      assert.throws(() => getEngine('sector.unknown'));
    });
  });

  describe('listHighCollisionRiskEngines', () => {
    it('returns 6 HIGH collision-risk engines', () => {
      const highRisk = listHighCollisionRiskEngines();
      assert.equal(highRisk.length, 6);
      const ids = highRisk.map((e) => e.engineId);
      assert.ok(ids.includes('sector.hospitality'));
      assert.ok(ids.includes('sector.energy'));
      assert.ok(ids.includes('sector.utilities'));
      assert.ok(ids.includes('sector.consumer'));
      assert.ok(ids.includes('sector.industrials'));
      assert.ok(ids.includes('sector.technology'));
    });
  });

  describe('AD4_REVALIDATION_CLAIM', () => {
    it('does NOT claim 13-engine baseline certification', () => {
      assert.equal(AD4_REVALIDATION_CLAIM.claimed, false);
    });

    it('is deferred to P15', () => {
      assert.equal(AD4_REVALIDATION_CLAIM.deferredTo, 'P15');
    });

    it('is frozen', () => {
      assert.ok(Object.isFrozen(AD4_REVALIDATION_CLAIM));
    });
  });

  describe('module identity', () => {
    it('has correct module identifier', () => {
      assert.equal(P11_04_MODULE, 'P11-04-ENGINE-REGISTRY');
    });
  });
});
