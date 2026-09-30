/**
 * Institutional Investment Platform System (IIPS)
 * Identity Boundary Errors (NP04-G24 / Phases E, F, G)
 *
 * Every one of these is a FAIL-CLOSED outcome. None of them may be treated as
 * a licence to create, guess, or implicitly link an identity.
 */

export type IdentityErrorCode =
  | 'IDENTITY_NOT_MAPPED'
  | 'IDENTITY_AMBIGUOUS'
  | 'IDENTITY_LIFECYCLE_INVALID'
  | 'IDENTITY_MAPPING_CONFLICT'
  | 'IDENTITY_CORRECTION_CONFLICT'
  | 'TENANT_MEMBERSHIP_MISSING'
  | 'TENANT_MEMBERSHIP_REVOKED';

export class IdentityError extends Error {
  public readonly code: IdentityErrorCode;

  constructor(code: IdentityErrorCode, message: string) {
    super(message);
    this.name = 'IdentityError';
    this.code = code;
  }
}

/**
 * No external identity mapping exists for (issuer, subject), or the mapping is
 * not in a state that permits resolution. Resolution fails closed: an
 * application user is never created implicitly from an incoming token.
 */
export class IdentityNotMappedError extends IdentityError {
  public readonly issuer: string;
  public readonly subject: string;

  constructor(issuer: string, subject: string, detail = 'no ACTIVE mapping') {
    super(
      'IDENTITY_NOT_MAPPED',
      `External identity (issuer="${issuer}", subject="${subject}") is not mapped to an application user: ${detail}.`
    );
    this.name = 'IdentityNotMappedError';
    this.issuer = issuer;
    this.subject = subject;
  }
}

/** More than one mapping resolved where exactly one is required. */
export class IdentityAmbiguousError extends IdentityError {
  constructor(message: string) {
    super('IDENTITY_AMBIGUOUS', message);
    this.name = 'IdentityAmbiguousError';
  }
}

/** A lifecycle transition was rejected by the governed state machine. */
export class IdentityLifecycleError extends IdentityError {
  constructor(message: string) {
    super('IDENTITY_LIFECYCLE_INVALID', message);
    this.name = 'IdentityLifecycleError';
  }
}

/** The external identity (issuer + subject) is already mapped. */
export class IdentityMappingConflictError extends IdentityError {
  constructor(issuer: string, subject: string) {
    super(
      'IDENTITY_MAPPING_CONFLICT',
      `External identity (issuer="${issuer}", subject="${subject}") is already mapped.`
    );
    this.name = 'IdentityMappingConflictError';
  }
}

/** An explicit correction was rejected because it would transfer ownership. */
export class IdentityCorrectionConflictError extends IdentityError {
  constructor(message: string) {
    super('IDENTITY_CORRECTION_CONFLICT', message);
    this.name = 'IdentityCorrectionConflictError';
  }
}

/** The application user holds no tenant membership. Fail closed. */
export class TenantMembershipMissingError extends IdentityError {
  public readonly applicationUserId: string;

  constructor(applicationUserId: string) {
    super(
      'TENANT_MEMBERSHIP_MISSING',
      `No tenant membership is provisioned for application user "${applicationUserId}". ` +
        `Tenant identity is not derived from any request-supplied field.`
    );
    this.name = 'TenantMembershipMissingError';
    this.applicationUserId = applicationUserId;
  }
}

/** The tenant membership exists but has been revoked. */
export class TenantMembershipRevokedError extends IdentityError {
  public readonly applicationUserId: string;
  public readonly tenantId: string;

  constructor(applicationUserId: string, tenantId: string) {
    super(
      'TENANT_MEMBERSHIP_REVOKED',
      `Tenant membership for application user "${applicationUserId}" in tenant "${tenantId}" is REVOKED.`
    );
    this.name = 'TenantMembershipRevokedError';
    this.applicationUserId = applicationUserId;
    this.tenantId = tenantId;
  }
}

export function isIdentityError(error: unknown): error is IdentityError {
  return error instanceof IdentityError;
}
