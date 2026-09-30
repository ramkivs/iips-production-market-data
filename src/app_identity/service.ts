/**
 * Institutional Investment Platform System (IIPS)
 * Governed Application-User Registry, External Identity Mapping, Mapping Audit
 * and Tenant Boundary (NP04-G24 / Phases D, E, F, G)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Execution Mode: NON_PRODUCTION
 *
 * Invariants enforced here:
 *  - An application-user identifier is opaque, stable and separately governed.
 *    It is never derived from preferred_username, a raw OIDC subject, a
 *    browser-supplied user id, companyId, runtimeCompanyId, a portfolio id, or
 *    operator identity.
 *  - The mapping key is (issuer + subject) and resolves to exactly ONE
 *    application user.
 *  - Lifecycle is explicit: PENDING -> APPROVED -> ACTIVE -> RETIRED.
 *  - Every mapping mutation and its audit record are written in ONE transaction.
 *  - Missing or conflicting mappings FAIL CLOSED. No application user is ever
 *    created implicitly from an incoming token.
 *  - Tenant membership is a separate authority from external identity and is
 *    only ever created by explicit provisioning.
 */

import { randomUUID } from 'node:crypto';
import type { PersistenceConnection } from '../persistence/connection.js';
import {
  IdentityCorrectionConflictError,
  IdentityLifecycleError,
  IdentityMappingConflictError,
  IdentityNotMappedError,
  TenantMembershipMissingError,
  TenantMembershipRevokedError,
} from './errors.js';
import { IdentityRepository } from './repository.js';
import type {
  ApplicationUser,
  ExternalIdentityMapping,
  GovernanceActorContext,
  MappingAuditAction,
  MappingLifecycleState,
  ResolvedIdentity,
  TenantMembership,
} from './types.js';

/** Transitions permitted by the governed lifecycle state machine. */
const ALLOWED_TRANSITIONS: Record<MappingLifecycleState, readonly MappingLifecycleState[]> = {
  PENDING: ['APPROVED', 'RETIRED'],
  APPROVED: ['ACTIVE', 'RETIRED'],
  ACTIVE: ['RETIRED'],
  RETIRED: ['ACTIVE'], // explicit reactivation only
};

export interface ProvisionMappingRequest extends GovernanceActorContext {
  readonly issuer: string;
  readonly subject: string;
  /** Existing application user to map to; when absent a new user is provisioned. */
  readonly applicationUserId?: string;
}

export interface ProvisionMappingResult {
  readonly applicationUser: ApplicationUser;
  readonly mapping: ExternalIdentityMapping;
  readonly userCreated: boolean;
}

export class IdentityService {
  private readonly repository: IdentityRepository;

  constructor(private readonly connection: PersistenceConnection) {
    this.repository = new IdentityRepository(connection);
  }

  /** Generates a stable, opaque application-user identifier. */
  private newApplicationUserId(): string {
    return randomUUID();
  }

  private now(): string {
    return new Date().toISOString();
  }

  private recordAudit(input: {
    mappingId: string;
    action: MappingAuditAction;
    previousState: MappingLifecycleState | null;
    newState: MappingLifecycleState | null;
    actor: string;
    context?: string;
    occurredAt: string;
  }): void {
    this.repository.insertAuditEvent({
      auditId: randomUUID(),
      mappingId: input.mappingId,
      action: input.action,
      previousState: input.previousState,
      newState: input.newState,
      actor: input.actor,
      context: input.context ?? null,
      occurredAt: input.occurredAt,
    });
  }

  /**
   * Explicitly provisions an application user. This is a governed act and is
   * never triggered by token resolution.
   */
  public createApplicationUser(
    actorContext: GovernanceActorContext,
    now: string = this.now()
  ): ApplicationUser {
    return this.connection.immediateTransaction(() => {
      const user: ApplicationUser = {
        applicationUserId: this.newApplicationUserId(),
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      };
      this.repository.insertApplicationUser(user);
      return user;
    });
  }

  /**
   * Provisions an external identity mapping in the PENDING state.
   * Mapping creation and audit are atomic.
   */
  public provisionExternalIdentityMapping(
    request: ProvisionMappingRequest,
    now: string = this.now()
  ): ProvisionMappingResult {
    return this.connection.immediateTransaction(() => {
      const existing = this.repository.findMappingByExternalIdentity(
        request.issuer,
        request.subject
      );
      if (existing) {
        throw new IdentityMappingConflictError(request.issuer, request.subject);
      }

      let userCreated = false;
      let applicationUser: ApplicationUser | null = null;

      if (request.applicationUserId) {
        applicationUser = this.repository.findApplicationUser(request.applicationUserId);
        if (!applicationUser) {
          throw new IdentityCorrectionConflictError(
            `Application user "${request.applicationUserId}" does not exist; ` +
              `mapping cannot be provisioned against an unknown user.`
          );
        }
      } else {
        applicationUser = {
          applicationUserId: this.newApplicationUserId(),
          status: 'ACTIVE',
          createdAt: now,
          updatedAt: now,
        };
        this.repository.insertApplicationUser(applicationUser);
        userCreated = true;
      }

      const mapping: ExternalIdentityMapping = {
        mappingId: randomUUID(),
        issuer: request.issuer,
        subject: request.subject,
        applicationUserId: applicationUser.applicationUserId,
        lifecycleState: 'PENDING',
        createdAt: now,
        updatedAt: now,
        retiredAt: null,
      };
      this.repository.insertMapping(mapping);

      if (userCreated) {
        this.recordAudit({
          mappingId: mapping.mappingId,
          action: 'CREATE_APPLICATION_USER',
          previousState: null,
          newState: null,
          actor: request.actor,
          context: request.context,
          occurredAt: now,
        });
      }
      this.recordAudit({
        mappingId: mapping.mappingId,
        action: 'CREATE_MAPPING',
        previousState: null,
        newState: 'PENDING',
        actor: request.actor,
        context: request.context,
        occurredAt: now,
      });

      return { applicationUser, mapping, userCreated };
    });
  }

  /**
   * Links an ADDITIONAL external identity to an existing application user.
   * Linking is always explicit and always audited; there is no implicit linking.
   */
  public linkExternalIdentity(
    request: ProvisionMappingRequest & { readonly applicationUserId: string },
    now: string = this.now()
  ): ProvisionMappingResult {
    return this.connection.immediateTransaction(() => {
      const existing = this.repository.findMappingByExternalIdentity(
        request.issuer,
        request.subject
      );
      if (existing) {
        throw new IdentityMappingConflictError(request.issuer, request.subject);
      }

      const applicationUser = this.repository.findApplicationUser(request.applicationUserId);
      if (!applicationUser) {
        throw new IdentityCorrectionConflictError(
          `Application user "${request.applicationUserId}" does not exist.`
        );
      }

      const mapping: ExternalIdentityMapping = {
        mappingId: randomUUID(),
        issuer: request.issuer,
        subject: request.subject,
        applicationUserId: applicationUser.applicationUserId,
        lifecycleState: 'PENDING',
        createdAt: now,
        updatedAt: now,
        retiredAt: null,
      };
      this.repository.insertMapping(mapping);

      this.recordAudit({
        mappingId: mapping.mappingId,
        action: 'LINK_EXTERNAL_IDENTITY',
        previousState: null,
        newState: 'PENDING',
        actor: request.actor,
        context: request.context,
        occurredAt: now,
      });

      return { applicationUser, mapping, userCreated: false };
    });
  }

  /** Executes a governed lifecycle transition with an atomic audit record. */
  private transition(
    mappingId: string,
    target: MappingLifecycleState,
    action: MappingAuditAction,
    actorContext: GovernanceActorContext,
    now: string
  ): ExternalIdentityMapping {
    return this.connection.immediateTransaction(() => {
      const mapping = this.repository.findMappingById(mappingId);
      if (!mapping) {
        throw new IdentityNotMappedError('<unknown>', '<unknown>', `mapping "${mappingId}" not found`);
      }

      const allowed = ALLOWED_TRANSITIONS[mapping.lifecycleState] ?? [];
      if (!allowed.includes(target)) {
        throw new IdentityLifecycleError(
          `Invalid lifecycle transition: ${mapping.lifecycleState} -> ${target} for mapping "${mappingId}".`
        );
      }

      const retiredAt = target === 'RETIRED' ? now : null;
      this.repository.updateMappingState(mappingId, target, now, retiredAt);

      this.recordAudit({
        mappingId,
        action,
        previousState: mapping.lifecycleState,
        newState: target,
        actor: actorContext.actor,
        context: actorContext.context,
        occurredAt: now,
      });

      return {
        ...mapping,
        lifecycleState: target,
        updatedAt: now,
        retiredAt,
      };
    });
  }

  public approveMapping(
    mappingId: string,
    actorContext: GovernanceActorContext,
    now: string = this.now()
  ): ExternalIdentityMapping {
    return this.transition(mappingId, 'APPROVED', 'APPROVE_MAPPING', actorContext, now);
  }

  public activateMapping(
    mappingId: string,
    actorContext: GovernanceActorContext,
    now: string = this.now()
  ): ExternalIdentityMapping {
    return this.transition(mappingId, 'ACTIVE', 'ACTIVATE_MAPPING', actorContext, now);
  }

  public retireMapping(
    mappingId: string,
    actorContext: GovernanceActorContext,
    now: string = this.now()
  ): ExternalIdentityMapping {
    return this.transition(mappingId, 'RETIRED', 'RETIRE_MAPPING', actorContext, now);
  }

  public reactivateMapping(
    mappingId: string,
    actorContext: GovernanceActorContext,
    now: string = this.now()
  ): ExternalIdentityMapping {
    return this.transition(mappingId, 'ACTIVE', 'REACTIVATE_MAPPING', actorContext, now);
  }

  /**
   * Explicit governed correction of the application user a mapping points at.
   * This is the ONLY path that re-points ownership, and it is always audited.
   * It refuses to re-point a mapping at a non-existent user and refuses to act
   * as an implicit ownership transfer.
   */
  public correctMappingOwner(
    mappingId: string,
    newApplicationUserId: string,
    actorContext: GovernanceActorContext,
    now: string = this.now()
  ): ExternalIdentityMapping {
    return this.connection.immediateTransaction(() => {
      const mapping = this.repository.findMappingById(mappingId);
      if (!mapping) {
        throw new IdentityNotMappedError('<unknown>', '<unknown>', `mapping "${mappingId}" not found`);
      }
      const target = this.repository.findApplicationUser(newApplicationUserId);
      if (!target) {
        throw new IdentityCorrectionConflictError(
          `Cannot re-point mapping "${mappingId}": application user "${newApplicationUserId}" does not exist.`
        );
      }
      if (mapping.applicationUserId === newApplicationUserId) {
        throw new IdentityCorrectionConflictError(
          `Mapping "${mappingId}" already points at application user "${newApplicationUserId}".`
        );
      }

      this.repository.updateMappingOwner(mappingId, newApplicationUserId, now);
      this.recordAudit({
        mappingId,
        action: 'CORRECT_MAPPING',
        previousState: mapping.lifecycleState,
        newState: mapping.lifecycleState,
        actor: actorContext.actor,
        context: `OWNERSHIP ${mapping.applicationUserId} -> ${newApplicationUserId}${
          actorContext.context ? ` | ${actorContext.context}` : ''
        }`,
        occurredAt: now,
      });

      return {
        ...mapping,
        applicationUserId: newApplicationUserId,
        updatedAt: now,
      };
    });
  }

  /**
   * Resolves an external identity to exactly one application user.
   * FAILS CLOSED for missing mappings, inactive lifecycle states, and suspended
   * users. Never creates an application user.
   */
  public resolveExternalIdentity(issuer: string, subject: string): ResolvedIdentity {
    const mapping = this.repository.findMappingByExternalIdentity(issuer, subject);

    if (!mapping) {
      throw new IdentityNotMappedError(issuer, subject, 'no mapping exists');
    }
    if (mapping.lifecycleState !== 'ACTIVE') {
      throw new IdentityNotMappedError(
        issuer,
        subject,
        `mapping exists but lifecycle state is ${mapping.lifecycleState}`
      );
    }

    const user = this.repository.findApplicationUser(mapping.applicationUserId);
    if (!user) {
      throw new IdentityNotMappedError(issuer, subject, 'mapped application user does not exist');
    }
    if (user.status !== 'ACTIVE') {
      throw new IdentityNotMappedError(
        issuer,
        subject,
        `mapped application user status is ${user.status}`
      );
    }

    return {
      applicationUserId: mapping.applicationUserId,
      issuer,
      subject,
      mappingId: mapping.mappingId,
      lifecycleState: mapping.lifecycleState,
    };
  }

  /**
   * Explicit tenant membership provisioning. This is the ONLY way a membership
   * comes into existence — it is never inferred from request context.
   */
  public provisionTenantMembership(
    input: { applicationUserId: string; tenantId: string } & GovernanceActorContext,
    now: string = this.now()
  ): TenantMembership {
    return this.connection.immediateTransaction(() => {
      const user = this.repository.findApplicationUser(input.applicationUserId);
      if (!user) {
        throw new TenantMembershipMissingError(input.applicationUserId);
      }
      const membership: TenantMembership = {
        applicationUserId: input.applicationUserId,
        tenantId: input.tenantId,
        state: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      };
      this.repository.upsertTenantMembership(membership);
      return membership;
    });
  }

  public revokeTenantMembership(
    input: { applicationUserId: string; tenantId: string } & GovernanceActorContext,
    now: string = this.now()
  ): TenantMembership {
    return this.connection.immediateTransaction(() => {
      const existing = this.repository.findMembership(input.applicationUserId, input.tenantId);
      if (!existing) {
        throw new TenantMembershipMissingError(input.applicationUserId);
      }
      const membership: TenantMembership = {
        ...existing,
        state: 'REVOKED',
        updatedAt: now,
      };
      this.repository.upsertTenantMembership(membership);
      return membership;
    });
  }

  public listTenantMemberships(applicationUserId: string): TenantMembership[] {
    return this.repository.listMemberships(applicationUserId);
  }

  /**
   * Resolves the tenant for an application user.
   * Fails closed when no membership exists or the membership is revoked.
   */
  public resolveTenant(applicationUserId: string, tenantId?: string): string {
    const memberships = this.repository.listMemberships(applicationUserId);

    if (memberships.length === 0) {
      throw new TenantMembershipMissingError(applicationUserId);
    }

    if (tenantId) {
      const membership = this.repository.findMembership(applicationUserId, tenantId);
      if (!membership) {
        throw new TenantMembershipMissingError(applicationUserId);
      }
      if (membership.state !== 'ACTIVE') {
        throw new TenantMembershipRevokedError(applicationUserId, tenantId);
      }
      return membership.tenantId;
    }

    const active = memberships.filter((m) => m.state === 'ACTIVE');
    if (active.length === 0) {
      const revoked = memberships[memberships.length - 1]!;
      throw new TenantMembershipRevokedError(applicationUserId, revoked.tenantId);
    }
    if (active.length > 1) {
      // Ambiguous tenancy is not resolved by guessing.
      throw new TenantMembershipMissingError(applicationUserId);
    }
    return active[0]!.tenantId;
  }
}
