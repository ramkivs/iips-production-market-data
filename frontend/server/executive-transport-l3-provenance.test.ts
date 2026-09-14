/**
 * L-3 (D79) — transport provenance/dataSource accuracy regression guards.
 *
 * Authority: D78 decision A — bounded disclosure/provenance correction.
 *
 * WHAT THESE GUARD
 *   `computeCertifiedReplay()` and `computeCertifiedEvidence()` emit hardcoded
 *   `reproduced: true` / `byteIdentical: true`. Their `provenance.dataSource` previously
 *   attributed those constants to a runtime "ReplayService ReplayResult" /
 *   "EvidencePipeline + Snapshot + Replay" execution. Neither function invokes
 *   ReplayService. That attribution was FALSE and is user-rendered
 *   (`ReplayExplorer.tsx`:70,138 and `EvidenceExplorer.tsx`:51,92).
 *
 * WHAT THESE DO NOT ASSERT
 *   Nothing here claims replay verification or byte identity. The booleans are deliberately
 *   asserted as STILL hardcoded `true` — D79 corrected the description, not the values.
 *   AD-17 / M-2 remain UNRESOLVED and the underlying hardcoding remains a recorded limitation.
 */
import { describe, it, expect } from 'vitest';
import { computeCertifiedReplay, computeCertifiedEvidence } from './executive-transport';

type ReplayDto = {
  replay: { reproduced: boolean; byteIdentical: boolean };
  provenance: { dataSource: string };
};

const SECTOR = 'banking';

/** The stale attributions that must never return. */
const STALE_REPLAY = /ReplayService\s+ReplayResult/i;
const STALE_EVIDENCE = /EvidencePipeline\s*\+\s*Snapshot\s*\+\s*Replay/i;

describe('L-3 (D79) — computeCertifiedReplay provenance accuracy', () => {
  const dto = computeCertifiedReplay(SECTOR) as ReplayDto;

  it('does NOT attribute the hardcoded values to a ReplayService runtime result', () => {
    expect(dto.provenance.dataSource).not.toMatch(STALE_REPLAY);
  });

  it('states that the values are hardcoded by executive-transport', () => {
    expect(dto.provenance.dataSource).toMatch(/hardcoded by executive-transport/i);
  });

  it('states that no runtime verification produced them', () => {
    expect(dto.provenance.dataSource).toMatch(/NOT produced by a runtime/i);
  });

  it('claims no verified replay or byte identity in the provenance text', () => {
    expect(dto.provenance.dataSource).not.toMatch(/verified (replay|reproduction|byte)/i);
  });

  it('leaves the hardcoded replay values UNCHANGED (D79 corrected wording, not values)', () => {
    expect(dto.replay.reproduced).toBe(true);
    expect(dto.replay.byteIdentical).toBe(true);
  });
});

describe('L-3 (D79) — computeCertifiedEvidence provenance accuracy', () => {
  const dto = computeCertifiedEvidence(SECTOR) as ReplayDto;

  it('does NOT attribute the hardcoded values to an EvidencePipeline/Replay runtime execution', () => {
    expect(dto.provenance.dataSource).not.toMatch(STALE_EVIDENCE);
  });

  it('states that the values are hardcoded by executive-transport', () => {
    expect(dto.provenance.dataSource).toMatch(/hardcoded by executive-transport/i);
  });

  it('states that no runtime verification produced them', () => {
    expect(dto.provenance.dataSource).toMatch(/NOT produced by a runtime/i);
  });

  it('leaves the hardcoded replay values UNCHANGED', () => {
    expect(dto.replay.reproduced).toBe(true);
    expect(dto.replay.byteIdentical).toBe(true);
  });
});
