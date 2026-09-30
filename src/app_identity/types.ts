/**
 * Institutional Investment Platform System (IIPS)
 * Application-User / External-Identity / Tenant Domain Types (NP04-G24)
 * Phases D, E, F, G
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Execution Mode: NON_PRODUCTION
 */

/** Governed external identity mapping lifecycle. */
export type MappingLifecycleState = 'PENDING' | 'APPROVED' | 'ACTIVE' | 'RETIRED';

/** Ordering authority for the governed lifecycle. */
export const MAPPING_LIFECYCLE_ORDER: readonly MappingLifecycleState[] = [
  'PENDING',
  'APPROVED',
  'ACTIVE',
  'RETIRED',
];

export type MappingAuditAction =
  | 'CREATE_APPLICATION_USER'
  | 'CREATE_MAPPING'
  | 'APPROVE_MAPPING'
  | 'ACTIVATE_MAPPING'
  | 'RETIRE_MAPPING'
  | 'REACTIVATE_MAPPING'
  | 'CORRECT_MAPPING'
  | 'LINK_EXTERNAL_IDENTITY';

export type TenantMembershipState = 'ACTIVE' | 'REVOKED';

export interface ApplicationUser {
  readonly applicationUserId: string;
  readonly status: 'ACTIVE' | 'SUSPENDED';
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ExternalIdentityMapping {
  readonly mappingId: string;
  readonly issuer: string;
  readonly subject: string;
  readonly applicationUserId: string;
  readonly lifecycleState: MappingLifecycleState;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly retiredAt: string | null;
}

export interface MappingAuditEvent {
  readonly auditId: string;
  readonly mappingId: string;
  readonly action: MappingAuditAction;
  readonly previousState: MappingLifecycleState | null;
  readonly newState: MappingLifecycleState | null;
  readonly actor: string;
  readonly context: string | null;
  readonly occurredAt: string;
}

export interface TenantMembership {
  readonly applicationUserId: string;
  readonly tenantId: string;
  readonly state: TenantMembershipState;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * The resolved, governed principal. Nothing in this shape is derived from
 * preferred_username, companyId, runtimeCompanyId, a portfolio id, a raw
 * OIDC subject, browser fields, or operator context.
 */
export interface ResolvedIdentity {
  readonly applicationUserId: string;
  readonly issuer: string;
  readonly subject: string;
  readonly mappingId: string;
  readonly lifecycleState: MappingLifecycleState;
}

/** Actor/context captured at the boundary for audit records. */
export interface GovernanceActorContext {
  /** Governing actor identifier available at the boundary. */
  readonly actor: string;
  /** Free-form governing context (correlation id, provisioning reference, ...). */
  readonly context?: string;
}
