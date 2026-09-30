/**
 * Institutional Investment Platform System (IIPS)
 * Portfolio Authorization (NP04-G24 / Phase I)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Execution Mode: NON_PRODUCTION
 *
 * The logical sequence enforced here:
 *
 *   verified OIDC identity
 *           |
 *       issuer + subject
 *           |
 *   applicationUserId
 *           |
 *   tenant membership
 *           |
 *       tenantId
 *           |
 *   portfolio authorization
 *
 * Authorization is evaluated from:
 *      applicationUserId + tenantId + portfolioId
 *
 * Portfolio ownership supplied by the browser is never trusted: ownership is
 * always re-derived from the governed mapping and the durable store.
 */

import type { IdentityService } from '../app_identity/service.js';
import type { ResolvedIdentity } from '../app_identity/types.js';
import type { DurablePortfolioStore } from '../portfolio/durable-store.js';
import type { VerifiedOidcCredential } from '../auth/oidc-verifier.js';
import { ResourceNotFoundError } from '../persistence/errors.js';

export interface AuthorizedPortfolioContext {
  readonly applicationUserId: string;
  readonly tenantId: string;
  readonly portfolioId: string;
  readonly identity: ResolvedIdentity;
}

export class PortfolioAuthorizer {
  constructor(
    private readonly identityService: IdentityService,
    private readonly portfolioStore: DurablePortfolioStore
  ) {}

  /**
   * Resolves identity -> tenant, then authorizes the portfolio.
   *
   * Every failure path (unknown identity, unmapped identity, no membership,
   * revoked membership, foreign portfolio, tenant mismatch, tombstoned
   * portfolio) is failure-closed. A portfolio that is not authorized for the
   * caller is indistinguishable from one that does not exist.
   */
  public authorize(
    credential: VerifiedOidcCredential,
    portfolioId: string,
    requestedTenantId?: string
  ): AuthorizedPortfolioContext {
    // 1. External identity -> governed application user (fails closed).
    const identity = this.identityService.resolveExternalIdentity(
      credential.issuer,
      credential.subject
    );

    // 2. Tenant membership is a separate authority (fails closed).
    const tenantId = this.identityService.resolveTenant(
      identity.applicationUserId,
      requestedTenantId
    );

    // 3. Owner + tenant + lifecycle check. Existence is never disclosed.
    const portfolio = this.portfolioStore.getPortfolio({
      applicationUserId: identity.applicationUserId,
      tenantId,
      portfolioId,
    });

    if (!portfolio) {
      throw new ResourceNotFoundError();
    }

    return {
      applicationUserId: identity.applicationUserId,
      tenantId,
      portfolioId,
      identity,
    };
  }

  /** Resolves identity + tenant without referencing a specific portfolio. */
  public authorizeScope(
    credential: VerifiedOidcCredential,
    requestedTenantId?: string
  ): { applicationUserId: string; tenantId: string; identity: ResolvedIdentity } {
    const identity = this.identityService.resolveExternalIdentity(
      credential.issuer,
      credential.subject
    );
    const tenantId = this.identityService.resolveTenant(
      identity.applicationUserId,
      requestedTenantId
    );
    return { applicationUserId: identity.applicationUserId, tenantId, identity };
  }
}
