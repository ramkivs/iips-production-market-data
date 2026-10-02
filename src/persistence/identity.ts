/**
 * NP-04 — Common Governed Persistence: durable instance identity and ownership.
 *
 * Instance identity is established INDEPENDENTLY of canonical report content.
 *
 * This is the direct remedy for the collision recorded against the frozen CSIP ReportingEngine,
 * which derives `report-${reportType}-${portfolioId}` from content alone. That form cannot
 * distinguish two separately-created instances of identical content. The frozen engine is not
 * modified; this module simply provides an instance identity that does not depend on it.
 */
import { randomUUID } from 'node:crypto';

import { PersistenceOwnershipError } from './errors.js';

/** A stored artifact identity. Globally unique; never derived from canonical content. */
export type ReportId = string;

/**
 * Mint a globally unique durable instance identifier.
 *
 * Uses a random UUIDv4. Independence from content is the required property: two calls with
 * identical canonical input MUST return different identifiers.
 */
export function mintReportId(): ReportId {
  return randomUUID();
}

/**
 * The authenticated owner of a governed artifact.
 *
 * Per closed decisions R2 and C4, ownership is exactly (tenantId, userId). `companyId` and
 * `runtimeCompanyId` are NOT part of this contract and are not modelled.
 *
 * This value is expected to originate from the authenticated principal established by the
 * identity authority, never from request payloads. The store never reads ownership from an
 * artifact payload.
 */
export interface AuthenticatedOwner {
  readonly tenantId: string;
  readonly userId: string;
}

/** Structural shape equality for the ownership pair. */
export function sameOwner(a: AuthenticatedOwner, b: AuthenticatedOwner): boolean {
  return a.tenantId === b.tenantId && a.userId === b.userId;
}

/**
 * Validate that an ownership pair is complete and well-formed.
 *
 * Rejects empty strings and non-string values. There is no default tenant and no implicit user.
 */
export function assertOwner(owner: unknown): AuthenticatedOwner {
  if (owner === null || typeof owner !== 'object') {
    throw new PersistenceOwnershipError('owner must be an object with tenantId and userId');
  }
  const { tenantId, userId } = owner as Partial<AuthenticatedOwner>;
  if (typeof tenantId !== 'string' || tenantId.length === 0) {
    throw new PersistenceOwnershipError('owner.tenantId must be a non-empty string');
  }
  if (typeof userId !== 'string' || userId.length === 0) {
    throw new PersistenceOwnershipError('owner.userId must be a non-empty string');
  }
  return { tenantId, userId };
}
