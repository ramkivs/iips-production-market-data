import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Transport } from './Transport';
import { createClock } from '../../infrastructure/Clock';

const clock = createClock('fixed');
const transport = new Transport(clock);

test('transport builds a validated DTO with stable checksum', () => {
  const dto = transport.build('sector.banking', [
    { sectorId: 'SEC-BANK', sectorFamily: 'Banking', companyName: 'Alpha', metrics: { ROA: 1.5 }, scores: { Q: 80 } },
  ]);
  assert.equal(transport.validate(dto), true);
  assert.equal(dto.metadata.engineId, 'sector.banking');
  assert.equal(Object.isFrozen(dto), true);
  // checksum is stable (no self-reference)
  assert.equal(transport.checksum(dto), transport.checksum(dto));
});

test('transport serialization is deterministic', () => {
  const dto = transport.build('sector.banking', [
    { sectorId: 'SEC-BANK', sectorFamily: 'Banking', companyName: 'Alpha', metrics: { ROA: 1.5 }, scores: { Q: 80 } },
  ]);
  assert.equal(transport.serialize(dto), transport.serialize(dto));
});

test('transport validate rejects empty rows', () => {
  const dto = transport.build('sector.banking', []);
  assert.equal(transport.validate(dto), false);
});
