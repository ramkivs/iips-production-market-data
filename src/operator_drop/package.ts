/**
 * Public server-side Operator Drop boundary (REG-06 admission, 2026-11-01).
 *
 * Server-side only: this subpath reaches `node:sqlite` and `node:fs` through the
 * durable PIT store and must never be pulled into the browser closure.
 */
export { OperatorDropParser } from './parser.js';
export type {
  OperatorDropManifest,
  OperatorDropPayload,
  OperatorDropIngestionSummary,
} from './parser.js';
export {
  OperatorDropIngestionService,
  resolveDropSecurityIdentity,
} from './drop_ingestion.js';
export type {
  PitSnapshotSink,
  OperatorDropIngestionReport,
  OperatorDropRecordRejection,
  OperatorDropRejectionReason,
} from './drop_ingestion.js';
export { OperatorDropProductRuntime } from './product_runtime.js';
export type {
  OperatorDropRuntimeOptions,
  OperatorDropScreeningOutcome,
  OperatorDropScreeningHit,
  OperatorDropScreeningMiss,
} from './product_runtime.js';
export {
  DurablePointInTimeStore,
  PitDurableStoreError,
  PitSnapshotConflictError,
  computeSnapshotDigest,
} from '../pit/pit_durable_store.js';
export type {
  PitAppendResult,
  PitAppendStatus,
} from '../pit/pit_durable_store.js';
export { PitReadService } from '../pit/pit_read_service.js';
export type { PitReadRequest, PitReadResult } from '../pit/pit_read_service.js';
export type { CanonicalEnvelope } from '../contracts/envelope.js';
export type { DataDomain } from '../contracts/types.js';
