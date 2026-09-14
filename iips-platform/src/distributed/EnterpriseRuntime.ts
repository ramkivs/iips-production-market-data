/**
 * Program v2.0 — WP-4: Enterprise / RBAC / Tenancy.
 *
 * Establishes identity, authentication, RBAC, tenant isolation, authorization boundaries,
 * auditability, resource quotas, and tenant-aware execution context — WITHOUT letting tenant
 * identity become an input to the mathematical meaning of a frozen sector engine.
 *
 * Constitutional guard (WP-0-style for enterprise):
 *   Tenant identity must NEVER become an input to the mathematical meaning of a frozen
 *   sector engine unless explicitly part of that engine's contract. Tenant metadata may
 *   affect WHO may run WHAT and resource quotas, but never the deterministic score.
 */
export type Role = 'admin' | 'analyst' | 'viewer';

export interface Principal {
  readonly userId: string;
  readonly tenantId: string;
  readonly roles: readonly Role[];
}

export interface Permission {
  readonly action: string;   // e.g. 'execute', 'read', 'admin'
  readonly resource: string; // e.g. 'sector.technology', 'portfolio', 'tenant'
}

/** RBAC policy: role -> allowed (action, resource) pairs. */
const ROLE_POLICY: Record<Role, ReadonlyArray<{ action: string; resource: string }>> = {
  admin: [{ action: '*', resource: '*' }],
  analyst: [
    { action: 'execute', resource: '*' },
    { action: 'read', resource: '*' },
  ],
  viewer: [{ action: 'read', resource: '*' }],
};

/** Immutable audit record. */
export interface AuditRecord {
  readonly auditId: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly action: string;
  readonly resource: string;
  readonly allowed: boolean;
  readonly at: string; // deterministic execution clock time
}

export class EnterpriseRuntime {
  private readonly audit: AuditRecord[] = [];

  constructor(private readonly clock: { now(): string }) {}

  /** Deterministic permission check. */
  authorize(principal: Principal, action: string, resource: string): boolean {
    for (const role of principal.roles) {
      const perms = ROLE_POLICY[role];
      for (const p of perms) {
        if ((p.action === '*' || p.action === action) && (p.resource === '*' || p.resource === resource)) {
          return true;
        }
      }
    }
    return false;
  }

  /** Perform a permission check and record an immutable audit entry. */
  check(principal: Principal, action: string, resource: string): boolean {
    const allowed = this.authorize(principal, action, resource);
    this.audit.push(Object.freeze({
      auditId: `audit-${this.audit.length + 1}`,
      tenantId: principal.tenantId,
      userId: principal.userId,
      action,
      resource,
      allowed,
      at: this.clock.now(),
    }));
    return allowed;
  }

  /**
   * Enforce tenant isolation + quota: an execution is allowed only if the principal is
   * authorized AND within quota. The returned context carries tenant metadata for
   * authorization/quota, but NOT into the engine math.
   */
  authorizeExecution(principal: Principal, resource: string, quotaUsed: number, quotaMax: number): { allowed: boolean; reason: string } {
    if (!this.check(principal, 'execute', resource)) return { allowed: false, reason: 'unauthorized' };
    if (quotaUsed >= quotaMax) return { allowed: false, reason: 'quota-exceeded' };
    return { allowed: true, reason: 'ok' };
  }

  /** Tenant isolation: a principal may only access resources within their own tenant. */
  isTenantResource(principal: Principal, resource: string, resourceTenant: string): boolean {
    return principal.tenantId === resourceTenant;
  }

  /**
   * Audited tenant-isolation check. Returns the SAME boolean as `isTenantResource` (authorization
   * semantics are unchanged) but ALSO records a governed AuditRecord reflecting the tenant
   * decision (allowed = tenant match). This is additive: it lets the G2/transport boundary emit a
   * governed DENY audit for a cross-tenant attempt, which plain RBAC cannot do for an admin whose
   * ROLE_POLICY grants wildcard `*`.
   */
  checkIsTenantResource(principal: Principal, resource: string, resourceTenant: string): boolean {
    const allowed = this.isTenantResource(principal, resource, resourceTenant);
    this.audit.push(Object.freeze({
      auditId: `audit-${this.audit.length + 1}`,
      tenantId: principal.tenantId,
      userId: principal.userId,
      action: 'tenant',
      resource,
      allowed,
      at: this.clock.now(),
    }));
    return allowed;
  }

  auditLog(): readonly AuditRecord[] { return [...this.audit]; }
}
