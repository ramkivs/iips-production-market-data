/**
 * Institutional Investment Platform System (IIPS)
 * Product Transport DTOs & Executive Provenance Types (P12 / AD-13)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W3-AUTH-2026-01
 * Authority Status: Product Transport / Typed Client DTOs AUTHORITATIVE (G2 RETIRED)
 */

import { QualityState, SourceClassification } from '../contracts/types.js';

export type ProductTransportMode = 'LIVE' | 'SNAPSHOT' | 'PIT';

export interface ExecutiveProvenance {
  sourceClassification: SourceClassification;
  asOf: string;          // ISO-8601 UTC
  evaluatedAt: string;   // ISO-8601 UTC
  dataVersion: string;
  lineageDigest: string; // Cryptographic SHA-256 hash
  quality: QualityState;
  replayConstraintApplied: boolean;
  replayConstraintText?: string; // Contains AD17_CONSTRAINT when applicable
  correlationId?: string;
  tenantId?: string;
}

export const AD17_CONSTRAINT_TEXT =
  'AD17_CONSTRAINT: Replay/Simulation data derived from governed stub model; not live commercial feed execution';
