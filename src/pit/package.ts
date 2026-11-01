/**
 * Public server-side PIT boundary.
 *
 * REG-06 admission (2026-11-01) added durable PIT market-data persistence to
 * this boundary. IPC and provisioning remain excluded: this subpath exposes
 * market-data storage and reads only, never a Gate 3 / Gate A' surface.
 */
export { PitReadService } from './pit_read_service.js';
export type {
  PitReadRequest,
  PitReadResult,
  PitReadHit,
  PitReadMiss,
  PitReadFailureReason,
} from './pit_read_service.js';
export { PointInTimeStore } from './pit_store.js';
export type { PITQuery } from './pit_store.js';
export type { CanonicalEnvelope } from '../contracts/envelope.js';
export type { DataDomain } from '../contracts/types.js';
export type { DataProvenanceDTO } from '../contracts/provenance.js';
export {
  DurablePointInTimeStore,
  PitDurableStoreError,
  PitSnapshotConflictError,
  computeSnapshotDigest,
} from './pit_durable_store.js';
export type {
  PitAppendResult,
  PitAppendStatus,
} from './pit_durable_store.js';
export type { PitSnapshotStore } from './pit_store.js';
