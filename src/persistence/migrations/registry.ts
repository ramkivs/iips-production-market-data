/**
 * Institutional Investment Platform System (IIPS)
 * Migration Registry (NP04-G24 / Phase B)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Execution Mode: NON_PRODUCTION
 *
 * APPEND-ONLY. The order of this array is the authoritative migration order.
 */

import { migration001InitialSchema } from './001_initial_schema.js';
import { migration002AuditEventSequence } from './002_audit_event_sequence.js';
import type { MigrationDefinition } from './types.js';

export const MIGRATIONS: readonly MigrationDefinition[] = [
  migration001InitialSchema,
  migration002AuditEventSequence,
];

/** Human-readable schema identity for diagnostics. */
export const SCHEMA_VERSION_TARGET = MIGRATIONS[MIGRATIONS.length - 1]?.id ?? '000';
