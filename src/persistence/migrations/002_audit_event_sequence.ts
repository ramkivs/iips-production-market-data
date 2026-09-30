/**
 * Institutional Investment Platform System (IIPS)
 * Migration 002 — Deterministic Mapping Audit Ordering (NP04-G24 / Phase B + F)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Execution Mode: NON_PRODUCTION
 *
 * IMMUTABLE: this SQL text is checksummed into the migration ledger.
 * Never edit an applied migration. Append a new migration instead.
 *
 * Rationale: mapping_audit_events was ordered by (occurred_at, audit_id). Two
 * audit records written inside the same millisecond share an identical
 * occurred_at, and audit_id is an opaque UUID, so the ordering of the audit
 * trail was non-deterministic. An audit ledger must have a total, reproducible
 * order, so a monotonic sequence is added.
 *
 * Migration 001 is intentionally left untouched.
 */

import type { MigrationDefinition } from './types.js';

export const migration002AuditEventSequence: MigrationDefinition = {
  id: '002',
  name: 'audit_event_sequence',
  sql: `
-- 1. Preserve the existing rows under a temporary name.
ALTER TABLE mapping_audit_events RENAME TO mapping_audit_events_v1;

-- 2. Recreate the audit table with a monotonic sequence as its ordering key.
CREATE TABLE mapping_audit_events (
    seq            INTEGER PRIMARY KEY AUTOINCREMENT,
    audit_id       TEXT NOT NULL UNIQUE,
    mapping_id     TEXT NOT NULL REFERENCES external_identity_mappings(mapping_id),
    action         TEXT NOT NULL,
    previous_state TEXT,
    new_state      TEXT,
    actor          TEXT NOT NULL,
    context        TEXT,
    occurred_at    TEXT NOT NULL
);

-- 3. Carry existing rows across in their previously observable order.
INSERT INTO mapping_audit_events
    (audit_id, mapping_id, action, previous_state, new_state, actor, context, occurred_at)
SELECT audit_id, mapping_id, action, previous_state, new_state, actor, context, occurred_at
  FROM mapping_audit_events_v1
 ORDER BY occurred_at ASC, audit_id ASC;

-- 4. Drop the temporary table (this also drops the index that followed it).
DROP TABLE mapping_audit_events_v1;

-- 5. Recreate the lookup index, now ordered by the monotonic sequence.
CREATE INDEX idx_mapping_audit_events_mapping
    ON mapping_audit_events (mapping_id, seq);
`,
};
