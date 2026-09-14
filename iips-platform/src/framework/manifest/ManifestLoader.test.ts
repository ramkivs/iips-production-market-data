import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ManifestLoader } from './ManifestLoader';

const loader = new ManifestLoader();

test('manifest loader validates + loads a valid manifest', () => {
  const m = { engineId: 'sector.banking', sectorFamily: 'Banking', engineVersion: '1.0.0', capabilities: ['run'], compatibility: { framework: '1.0' } };
  assert.equal(loader.validate(m), true);
  const loaded = loader.load(m);
  assert.equal(Object.isFrozen(loaded), true);
  assert.equal(loaded.engineId, 'sector.banking');
});

test('manifest loader rejects invalid manifest', () => {
  const bad = { engineId: '', sectorFamily: 'Banking', engineVersion: '1.0.0', capabilities: [], compatibility: {} };
  assert.equal(loader.validate(bad), false);
  assert.throws(() => loader.load(bad), /Invalid manifest/);
});
