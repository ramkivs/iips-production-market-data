/**
 * Institutional Investment Platform System (IIPS)
 * Local Principal Boundary — Binding Record (A-2) & Local Audit Line (A-3)
 * G-2 / Gate A — NP04-G24 identity-boundary extension
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Execution Mode: NON_PRODUCTION
 *
 * Authority: the A-2/A-3 additions were accepted under the L-IPC-1 rev 2 contract and
 * authorized — exactly and only as the A-2/A-3 enablement — by the rendered Gate A
 * decision `IIPS-V3-G2-IPD-GATE-A-PA-DECISION-2026-10-16-01`.
 *
 * Invariants enforced here:
 *  - the binding record is local and act-provisioned; it is deliberately NOT
 *    `external_identity_mappings` (a transport fact must never be conflated with an
 *    external-identity claim: no issuer/subject, no mapping lifecycle reuse);
 *  - exactly ONE ACTIVE binding is resolvable; zero or more than one REFUSES and
 *    discloses no owner (fail-closed, never guessed);
 *  - revocation is ONE-WAY: `ACTIVE -> REVOKED`. There is no restore/re-bind path in
 *    this boundary, a second revocation on a REVOKED row is refused, and a binding
 *    that has been revoked is never revived by reuse;
 *  - re-provisioning after revocation requires a NEW explicit act: provisioning
 *    refuses when a membership or binding already exists for the application user;
 *  - every audit row is written in the SAME transaction as the mutation it audits;
 *    the audit line is LOCAL ONLY — no cross-system destination exists or is implied.
 */

import { randomUUID } from 'node:crypto';
import type { PersistenceConnection } from '../persistence/connection.js';
import { IdentityRepository } from './repository.js';
import { IdentityService } from './service.js';
import type { GovernanceActorContext, TenantMembership } from './types.js';

/** Governed binding lifecycle. One-way: ACTIVE -> REVOKED. */
export type LocalPrincipalBindingState = 'ACTIVE' | 'REVOKED';

/** Audit subjects: the binding record and the tenant membership. */
export type LocalPrincipalAuditSubjectType = 'BINDING' | 'MEMBERSHIP';

/** The four lifecycle events written by the A-3 audit line. */
export type LocalPrincipalAuditAction =
  | 'BINDING_CREATED'
  | 'BINDING_REVOKED'
  | 'MEMBERSHIP_CREATED'
  | 'MEMBERSHIP_REVOKED';

export interface LocalPrincipalBinding {
  readonly endpointId: string;
  readonly applicationUserId: string;
  readonly tenantId: string;
  readonly state: LocalPrincipalBindingState;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly revokedAt: string | null;
}

export interface LocalPrincipalAuditEvent {
  /** Monotonic sequence: the total, reproducible ordering authority of the audit line. */
  readonly seq: number;
  readonly auditId: string;
  readonly subjectType: LocalPrincipalAuditSubjectType;
  readonly subjectId: string;
  readonly action: LocalPrincipalAuditAction;
  readonly previousState: string | null;
  readonly newState: string | null;
  readonly actor: string;
  readonly context: string | null;
  readonly occurredAt: string;
}

export type LocalPrincipalErrorCode =
  | 'LOCAL_PRINCIPAL_SUBJECT_UNKNOWN'
  | 'LOCAL_PRINCIPAL_BINDING_CONFLICT'
  | 'LOCAL_PRINCIPAL_BINDING_UNRESOLVED'
  | 'LOCAL_PRINCIPAL_REVOCATION_INVALID'
  | 'LOCAL_PRINCIPAL_MEMBERSHIP_CONFLICT';

/** Every one of these is a FAIL-CLOSED outcome. None is a licence to create, guess,
 *  re-bind, or restore anything. */
export class LocalPrincipalError extends Error {
  public readonly code: LocalPrincipalErrorCode;

  constructor(code: LocalPrincipalErrorCode, message: string) {
    super(message);
    this.name = 'LocalPrincipalError';
    this.code = code;
  }
}

/** The referenced application user (or binding endpoint) does not exist. */
export class LocalPrincipalSubjectUnknownError extends LocalPrincipalError {
  constructor(subject: string) {
    super('LOCAL_PRINCIPAL_SUBJECT_UNKNOWN', `No local principal subject exists for "${subject}".`);
    this.name = 'LocalPrincipalSubjectUnknownError';
  }
}

/** A binding already exists for this application user; one deployment, one principal.
 *  Re-binding by reuse is not authorized (a new act would be required). */
export class LocalPrincipalBindingConflictError extends LocalPrincipalError {
  constructor(applicationUserId: string) {
    super(
      'LOCAL_PRINCIPAL_BINDING_CONFLICT',
      `A local principal binding already exists for application user "${applicationUserId}"; ` +
        `re-binding by reuse is not authorized.`
    );
    this.name = 'LocalPrincipalBindingConflictError';
  }
}

/** Zero or more than one ACTIVE binding: refuse. No owner is disclosed. */
export class LocalPrincipalBindingUnresolvedError extends LocalPrincipalError {
  constructor() {
    super(
      'LOCAL_PRINCIPAL_BINDING_UNRESOLVED',
      'No single active local principal binding is resolvable; resolution refuses and discloses no owner.'
    );
    this.name = 'LocalPrincipalBindingUnresolvedError';
  }
}

/** The binding/membership is already REVOKED: revocation is one-way, and neither a
 *  repeat revocation nor a restoration is authorized. */
export class LocalPrincipalRevocationInvalidError extends LocalPrincipalError {
  constructor(subject: string) {
    super(
      'LOCAL_PRINCIPAL_REVOCATION_INVALID',
      `Subject "${subject}" is already REVOKED; revocation is one-way and restoration is not authorized.`
    );
    this.name = 'LocalPrincipalRevocationInvalidError';
  }
}

/** A membership already exists for this application user; re-provisioning (and the
 *  implicit restoration behaviour of the upsert) is never exercised from this boundary. */
export class LocalPrincipalMembershipConflictError extends LocalPrincipalError {
  constructor(applicationUserId: string) {
    super(
      'LOCAL_PRINCIPAL_MEMBERSHIP_CONFLICT',
      `A tenant membership already exists for application user "${applicationUserId}"; ` +
        `re-provisioning requires a new explicit act.`
    );
    this.name = 'LocalPrincipalMembershipConflictError';
  }
}

/**
 * The membership audit subject key: the membership primary key
 * `(application_user_id, tenant_id)` joined by `:`. Both parts are opaque provisioned
 * values; nothing is derived from any external identifier.
 */
export function membershipSubjectId(applicationUserId: string, tenantId: string): string {
  return `${applicationUserId}:${tenantId}`;
}

interface BindingRow {
  endpoint_id: string;
  application_user_id: string;
  tenant_id: string;
  state: LocalPrincipalBindingState;
  created_at: string;
  updated_at: string;
  revoked_at: string | null;
}

interface AuditRow {
  seq: number;
  audit_id: string;
  subject_type: LocalPrincipalAuditSubjectType;
  subject_id: string;
  action: LocalPrincipalAuditAction;
  previous_state: string | null;
  new_state: string | null;
  actor: string;
  context: string | null;
  occurred_at: string;
}

function toBinding(row: BindingRow): LocalPrincipalBinding {
  return {
    endpointId: row.endpoint_id,
    applicationUserId: row.application_user_id,
    tenantId: row.tenant_id,
    state: row.state,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    revokedAt: row.revoked_at,
  };
}

function toAuditEvent(row: AuditRow): LocalPrincipalAuditEvent {
  return {
    seq: row.seq,
    auditId: row.audit_id,
    subjectType: row.subject_type,
    subjectId: row.subject_id,
    action: row.action,
    previousState: row.previous_state,
    newState: row.new_state,
    actor: row.actor,
    context: row.context,
    occurredAt: row.occurred_at,
  };
}

/** SQL-only statement boundary for the A-2/A-3 records. No decision logic here. */
export class LocalPrincipalRepository {
  constructor(private readonly connection: PersistenceConnection) {}

  public insertBinding(binding: LocalPrincipalBinding): void {
    this.connection
      .prepare(
        `INSERT INTO local_principal_bindings
           (endpoint_id, application_user_id, tenant_id, state, created_at, updated_at, revoked_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        binding.endpointId,
        binding.applicationUserId,
        binding.tenantId,
        binding.state,
        binding.createdAt,
        binding.updatedAt,
        binding.revokedAt
      );
  }

  public findBindingByEndpointId(endpointId: string): LocalPrincipalBinding | null {
    const row = this.connection
      .prepare(`SELECT * FROM local_principal_bindings WHERE endpoint_id = ?`)
      .get(endpointId) as BindingRow | undefined;
    return row ? toBinding(row) : null;
  }

  public listBindingsForUser(applicationUserId: string): LocalPrincipalBinding[] {
    const rows = this.connection
      .prepare(
        `SELECT * FROM local_principal_bindings
          WHERE application_user_id = ?
          ORDER BY created_at ASC, endpoint_id ASC`
      )
      .all(applicationUserId) as BindingRow[];
    return rows.map(toBinding);
  }

  public listActiveBindings(): LocalPrincipalBinding[] {
    const rows = this.connection
      .prepare(`SELECT * FROM local_principal_bindings WHERE state = 'ACTIVE' ORDER BY endpoint_id ASC`)
      .all() as BindingRow[];
    return rows.map(toBinding);
  }

  /** One-way transition. Refuses implicitly (no row) when the row is not ACTIVE. */
  public revokeBinding(endpointId: string, revokedAt: string): void {
    this.connection
      .prepare(
        `UPDATE local_principal_bindings
            SET state = 'REVOKED', updated_at = ?, revoked_at = ?
          WHERE endpoint_id = ? AND state = 'ACTIVE'`
      )
      .run(revokedAt, revokedAt, endpointId);
  }

  public insertAuditEvent(event: Omit<LocalPrincipalAuditEvent, 'seq'>): void {
    this.connection
      .prepare(
        `INSERT INTO local_principal_audit_events
           (audit_id, subject_type, subject_id, action, previous_state, new_state, actor, context, occurred_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        event.auditId,
        event.subjectType,
        event.subjectId,
        event.action,
        event.previousState,
        event.newState,
        event.actor,
        event.context,
        event.occurredAt
      );
  }

  public listAuditEvents(): LocalPrincipalAuditEvent[] {
    const rows = this.connection
      .prepare(`SELECT * FROM local_principal_audit_events ORDER BY seq ASC`)
      .all() as AuditRow[];
    return rows.map(toAuditEvent);
  }
}

export interface CreateBindingInput extends GovernanceActorContext {
  readonly applicationUserId: string;
  readonly tenantId: string;
}

export interface MembershipMutationInput extends GovernanceActorContext {
  readonly applicationUserId: string;
  readonly tenantId: string;
}

/**
 * The A-2/A-3 lifecycle boundary. Every mutation is transactional on its own and
 * composes (as a savepoint) inside an enclosing `immediateTransaction`, so an outer
 * act can make the whole provisioning ONE transaction.
 */
export class LocalPrincipalService {
  private readonly repository: LocalPrincipalRepository;
  private readonly identity: IdentityService;
  private readonly identityRepository: IdentityRepository;

  constructor(private readonly connection: PersistenceConnection) {
    this.repository = new LocalPrincipalRepository(connection);
    this.identity = new IdentityService(connection);
    this.identityRepository = new IdentityRepository(connection);
  }

  private now(): string {
    return new Date().toISOString();
  }

  /** `ep-` + lowercase UUIDv4 — generated ONCE, opaque, never a wire field. */
  private newEndpointId(): string {
    return `ep-${randomUUID().toLowerCase()}`;
  }

  private recordAudit(input: {
    subjectType: LocalPrincipalAuditSubjectType;
    subjectId: string;
    action: LocalPrincipalAuditAction;
    previousState: string | null;
    newState: string | null;
    actor: string;
    context?: string;
    occurredAt: string;
  }): void {
    this.repository.insertAuditEvent({
      auditId: randomUUID(),
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      action: input.action,
      previousState: input.previousState,
      newState: input.newState,
      actor: input.actor,
      context: input.context ?? null,
      occurredAt: input.occurredAt,
    });
  }

  /**
   * Creates the ONE local principal binding (ACTIVE) and writes its A-3 audit row in
   * the same transaction. Refuses when a binding already exists for the user.
   */
  public createBinding(input: CreateBindingInput, now: string = this.now()): LocalPrincipalBinding {
    return this.connection.immediateTransaction(() => {
      const user = this.identityRepository.findApplicationUser(input.applicationUserId);
      if (!user) {
        throw new LocalPrincipalSubjectUnknownError(input.applicationUserId);
      }
      if (this.repository.listBindingsForUser(input.applicationUserId).length > 0) {
        throw new LocalPrincipalBindingConflictError(input.applicationUserId);
      }

      const binding: LocalPrincipalBinding = {
        endpointId: this.newEndpointId(),
        applicationUserId: input.applicationUserId,
        tenantId: input.tenantId,
        state: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
        revokedAt: null,
      };
      this.repository.insertBinding(binding);
      this.recordAudit({
        subjectType: 'BINDING',
        subjectId: binding.endpointId,
        action: 'BINDING_CREATED',
        previousState: null,
        newState: 'ACTIVE',
        actor: input.actor,
        context: input.context,
        occurredAt: now,
      });
      return binding;
    });
  }

  /** Exactly one ACTIVE binding or refuse — no owner is ever disclosed. */
  public resolveActiveBinding(): LocalPrincipalBinding {
    const active = this.repository.listActiveBindings();
    if (active.length !== 1) {
      throw new LocalPrincipalBindingUnresolvedError();
    }
    return active[0]!;
  }

  /**
   * One-way revocation of the binding and its A-3 audit row, in one transaction.
   * Refuses when the binding is missing or already REVOKED. There is no restore path.
   */
  public revokeBinding(
    endpointId: string,
    actorContext: GovernanceActorContext,
    now: string = this.now()
  ): LocalPrincipalBinding {
    return this.connection.immediateTransaction(() => {
      const binding = this.repository.findBindingByEndpointId(endpointId);
      if (!binding) {
        throw new LocalPrincipalSubjectUnknownError(endpointId);
      }
      if (binding.state !== 'ACTIVE') {
        throw new LocalPrincipalRevocationInvalidError(endpointId);
      }

      this.repository.revokeBinding(endpointId, now);
      this.recordAudit({
        subjectType: 'BINDING',
        subjectId: endpointId,
        action: 'BINDING_REVOKED',
        previousState: 'ACTIVE',
        newState: 'REVOKED',
        actor: actorContext.actor,
        context: actorContext.context,
        occurredAt: now,
      });
      return { ...binding, state: 'REVOKED', updatedAt: now, revokedAt: now };
    });
  }

  /**
   * Explicit membership provisioning (the ONLY membership creation path) with its A-3
   * audit row in the same transaction. Refuses when any membership already exists for
   * the user — the implicit `REVOKED -> ACTIVE` upsert restoration is never exercised
   * from this boundary.
   */
  public provisionMembershipWithAudit(
    input: MembershipMutationInput,
    now: string = this.now()
  ): TenantMembership {
    return this.connection.immediateTransaction(() => {
      const user = this.identityRepository.findApplicationUser(input.applicationUserId);
      if (!user) {
        throw new LocalPrincipalSubjectUnknownError(input.applicationUserId);
      }
      if (this.identityRepository.listMemberships(input.applicationUserId).length > 0) {
        throw new LocalPrincipalMembershipConflictError(input.applicationUserId);
      }

      const membership = this.identity.provisionTenantMembership(
        {
          applicationUserId: input.applicationUserId,
          tenantId: input.tenantId,
          actor: input.actor,
          context: input.context,
        },
        now
      );

      this.recordAudit({
        subjectType: 'MEMBERSHIP',
        subjectId: membershipSubjectId(membership.applicationUserId, membership.tenantId),
        action: 'MEMBERSHIP_CREATED',
        previousState: null,
        newState: 'ACTIVE',
        actor: input.actor,
        context: input.context,
        occurredAt: now,
      });
      return membership;
    });
  }

  /**
   * One-way membership revocation with its A-3 audit row, in one transaction.
   * Refuses when the membership is missing or already REVOKED.
   */
  public revokeMembershipWithAudit(
    input: MembershipMutationInput,
    now: string = this.now()
  ): TenantMembership {
    return this.connection.immediateTransaction(() => {
      const existing = this.identityRepository.findMembership(
        input.applicationUserId,
        input.tenantId
      );
      if (!existing) {
        throw new LocalPrincipalSubjectUnknownError(
          membershipSubjectId(input.applicationUserId, input.tenantId)
        );
      }
      if (existing.state !== 'ACTIVE') {
        throw new LocalPrincipalRevocationInvalidError(
          membershipSubjectId(input.applicationUserId, input.tenantId)
        );
      }

      const membership = this.identity.revokeTenantMembership(
        {
          applicationUserId: input.applicationUserId,
          tenantId: input.tenantId,
          actor: input.actor,
          context: input.context,
        },
        now
      );

      this.recordAudit({
        subjectType: 'MEMBERSHIP',
        subjectId: membershipSubjectId(membership.applicationUserId, membership.tenantId),
        action: 'MEMBERSHIP_REVOKED',
        previousState: 'ACTIVE',
        newState: 'REVOKED',
        actor: input.actor,
        context: input.context,
        occurredAt: now,
      });
      return membership;
    });
  }

  /** The local audit line, ordered by its monotonic sequence. */
  public readAuditTrail(): LocalPrincipalAuditEvent[] {
    return this.repository.listAuditEvents();
  }

  /** Reads (never guesses) the bindings of an application user. */
  public readBindingsForUser(applicationUserId: string): LocalPrincipalBinding[] {
    return this.repository.listBindingsForUser(applicationUserId);
  }
}
