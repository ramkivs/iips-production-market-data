/**
 * Institutional Investment Platform System (IIPS)
 * Identity Boundary Data Access (NP04-G24 / Phases D, E, F, G)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Execution Mode: NON_PRODUCTION
 *
 * All access is expressed through the PersistenceConnection transactional
 * surface. This module never holds a raw database handle.
 */

import type { PersistenceConnection } from '../persistence/connection.js';
import type {
  ApplicationUser,
  ExternalIdentityMapping,
  MappingAuditAction,
  MappingAuditEvent,
  MappingLifecycleState,
  TenantMembership,
  TenantMembershipState,
} from './types.js';

interface ApplicationUserRow {
  application_user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface MappingRow {
  mapping_id: string;
  issuer: string;
  subject: string;
  application_user_id: string;
  lifecycle_state: string;
  created_at: string;
  updated_at: string;
  retired_at: string | null;
}

interface AuditRow {
  seq: number;
  audit_id: string;
  mapping_id: string;
  action: string;
  previous_state: string | null;
  new_state: string | null;
  actor: string;
  context: string | null;
  occurred_at: string;
}

interface MembershipRow {
  application_user_id: string;
  tenant_id: string;
  state: string;
  created_at: string;
  updated_at: string;
}

function toApplicationUser(row: ApplicationUserRow): ApplicationUser {
  return {
    applicationUserId: row.application_user_id,
    status: row.status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toMapping(row: MappingRow): ExternalIdentityMapping {
  return {
    mappingId: row.mapping_id,
    issuer: row.issuer,
    subject: row.subject,
    applicationUserId: row.application_user_id,
    lifecycleState: row.lifecycle_state as MappingLifecycleState,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    retiredAt: row.retired_at,
  };
}

function toAuditEvent(row: AuditRow): MappingAuditEvent {
  return {
    seq: row.seq,
    auditId: row.audit_id,
    mappingId: row.mapping_id,
    action: row.action as MappingAuditAction,
    previousState: row.previous_state as MappingLifecycleState | null,
    newState: row.new_state as MappingLifecycleState | null,
    actor: row.actor,
    context: row.context,
    occurredAt: row.occurred_at,
  };
}

function toMembership(row: MembershipRow): TenantMembership {
  return {
    applicationUserId: row.application_user_id,
    tenantId: row.tenant_id,
    state: row.state as TenantMembershipState,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class IdentityRepository {
  constructor(private readonly connection: PersistenceConnection) {}

  public insertApplicationUser(user: ApplicationUser): void {
    this.connection
      .prepare(
        `INSERT INTO application_users (application_user_id, status, created_at, updated_at)
         VALUES (?, ?, ?, ?)`
      )
      .run(user.applicationUserId, user.status, user.createdAt, user.updatedAt);
  }

  public findApplicationUser(applicationUserId: string): ApplicationUser | null {
    const row = this.connection
      .prepare(`SELECT * FROM application_users WHERE application_user_id = ?`)
      .get(applicationUserId) as ApplicationUserRow | undefined;
    return row ? toApplicationUser(row) : null;
  }

  public insertMapping(mapping: ExternalIdentityMapping): void {
    this.connection
      .prepare(
        `INSERT INTO external_identity_mappings
           (mapping_id, issuer, subject, application_user_id, lifecycle_state, created_at, updated_at, retired_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        mapping.mappingId,
        mapping.issuer,
        mapping.subject,
        mapping.applicationUserId,
        mapping.lifecycleState,
        mapping.createdAt,
        mapping.updatedAt,
        mapping.retiredAt
      );
  }

  /** Exact lookup by the governed composite key (issuer + subject). */
  public findMappingByExternalIdentity(
    issuer: string,
    subject: string
  ): ExternalIdentityMapping | null {
    const row = this.connection
      .prepare(
        `SELECT * FROM external_identity_mappings WHERE issuer = ? AND subject = ?`
      )
      .get(issuer, subject) as MappingRow | undefined;
    return row ? toMapping(row) : null;
  }

  public findMappingById(mappingId: string): ExternalIdentityMapping | null {
    const row = this.connection
      .prepare(`SELECT * FROM external_identity_mappings WHERE mapping_id = ?`)
      .get(mappingId) as MappingRow | undefined;
    return row ? toMapping(row) : null;
  }

  public listMappingsForUser(applicationUserId: string): ExternalIdentityMapping[] {
    const rows = this.connection
      .prepare(
        `SELECT * FROM external_identity_mappings
          WHERE application_user_id = ?
          ORDER BY created_at ASC, mapping_id ASC`
      )
      .all(applicationUserId) as MappingRow[];
    return rows.map(toMapping);
  }

  public updateMappingState(
    mappingId: string,
    state: MappingLifecycleState,
    updatedAt: string,
    retiredAt: string | null
  ): void {
    this.connection
      .prepare(
        `UPDATE external_identity_mappings
            SET lifecycle_state = ?, updated_at = ?, retired_at = ?
          WHERE mapping_id = ?`
      )
      .run(state, updatedAt, retiredAt, mappingId);
  }

  /**
   * Explicit governed correction: re-points a mapping at a different application
   * user. Never invoked implicitly; ownership is never transferred silently.
   */
  public updateMappingOwner(
    mappingId: string,
    applicationUserId: string,
    updatedAt: string
  ): void {
    this.connection
      .prepare(
        `UPDATE external_identity_mappings
            SET application_user_id = ?, updated_at = ?
          WHERE mapping_id = ?`
      )
      .run(applicationUserId, updatedAt, mappingId);
  }

  public insertAuditEvent(event: Omit<MappingAuditEvent, 'seq'>): void {
    this.connection
      .prepare(
        `INSERT INTO mapping_audit_events
           (audit_id, mapping_id, action, previous_state, new_state, actor, context, occurred_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        event.auditId,
        event.mappingId,
        event.action,
        event.previousState,
        event.newState,
        event.actor,
        event.context,
        event.occurredAt
      );
  }

  public listAuditEvents(mappingId: string): MappingAuditEvent[] {
    const rows = this.connection
      .prepare(
        `SELECT * FROM mapping_audit_events
          WHERE mapping_id = ?
          ORDER BY seq ASC`
      )
      .all(mappingId) as AuditRow[];
    return rows.map(toAuditEvent);
  }

  public upsertTenantMembership(membership: TenantMembership): void {
    this.connection
      .prepare(
        `INSERT INTO tenant_memberships
           (application_user_id, tenant_id, state, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (application_user_id, tenant_id)
         DO UPDATE SET state = excluded.state, updated_at = excluded.updated_at`
      )
      .run(
        membership.applicationUserId,
        membership.tenantId,
        membership.state,
        membership.createdAt,
        membership.updatedAt
      );
  }

  public findMembership(
    applicationUserId: string,
    tenantId: string
  ): TenantMembership | null {
    const row = this.connection
      .prepare(
        `SELECT * FROM tenant_memberships
          WHERE application_user_id = ? AND tenant_id = ?`
      )
      .get(applicationUserId, tenantId) as MembershipRow | undefined;
    return row ? toMembership(row) : null;
  }

  public listMemberships(applicationUserId: string): TenantMembership[] {
    const rows = this.connection
      .prepare(
        `SELECT * FROM tenant_memberships
          WHERE application_user_id = ?
          ORDER BY tenant_id ASC`
      )
      .all(applicationUserId) as MembershipRow[];
    return rows.map(toMembership);
  }
}
