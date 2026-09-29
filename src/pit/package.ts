/** Public PIT package boundary. Keep implementation and contract dependencies internal. */
export { PitReadService } from './pit_read_service.js';
export type { PitReadRequest, PitReadResult, PitReadHit, PitReadMiss, PitReadFailureReason } from './pit_read_service.js';
export { PointInTimeStore, buildPitKey } from './pit_store.js';
export type { PITQuery } from './pit_store.js';
export type { CanonicalEnvelope } from '../contracts/envelope.js';
export type { DataDomain } from '../contracts/types.js';
export type { DataProvenanceDTO } from '../contracts/provenance.js';
