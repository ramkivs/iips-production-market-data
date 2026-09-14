import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ActivationService } from './ActivationService';

const service = new ActivationService();

test('activation activates only when qualified', () => {
  const r = service.activate('sector.banking', true);
  assert.ok(r);
  assert.equal(r?.toState, 'ACTIVE');
  assert.equal(service.getState('sector.banking'), 'ACTIVE');
});

test('activation blocked when not qualified', () => {
  const s = new ActivationService();
  assert.equal(s.activate('sector.banking', false), null);
  assert.equal(s.getState('sector.banking'), 'INACTIVE');
});

test('deactivation returns to INACTIVE', () => {
  const s = new ActivationService();
  s.activate('sector.banking', true);
  const d = s.deactivate('sector.banking');
  assert.ok(d);
  assert.equal(d?.toState, 'INACTIVE');
});
