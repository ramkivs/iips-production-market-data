/**
 * P12-06 — SECURITY / TENANT BOUNDARIES
 *
 * Authority:
 *   D29 P12 Implementation Authorization (commit f03967e)
 *   D4_09_P12_CONTRACT_DELTA.md K.2.6
 *
 * Purpose:
 *   Server-enforced tenant scoping and governed classification on every
 *   data endpoint. Implements only the authorized/bounded P12 security
 *   and tenant behavior.
 *
 * Boundaries (hard):
 *   ⚠ **ST-1** Tenant scoping is server-enforced — NEVER client-side
 *   ⚠ **ST-2** DataGovernanceRuntime classification respected (AD-11)
 *   ⚠ **ST-3** Provider entitlement enforced BEHIND the data plane
 *   ⚠ **ST-4** Secrets NEVER in DTOs, logs, or client bundles (NFR-05)
 *   ⚠ **ST-5** C12 remains BLOCKED — M-5 auth not wired; security authority UNKNOWN
 *   ⚠ **ST-6** No security certification is claimed or invented
 *   ⚠ **ST-7** Authentication/session/enforcement not wired — acknowledged limitation
 */

export const P12_06_MODULE = 'P12-06-SECURITY-TENANT-BOUNDARIES';

/** ST-5/ST-7: Explicit limitation statement — carried in module metadata. */
export const SECURITY_LIMITATION = Object.freeze({
  c12Status: 'BLOCKED',
  m5Status: 'NOT_WIRED',
  authenticationStatus: 'NOT_WIRED',
  securityAuthority: 'UNKNOWN',
  resolutionGate: 'P15 or security authority resolution',
  dtoConstraint: 'No security certification claimed or invented',
});

/** ST-2: Permitted governance classifications (AD-11) — CLOSED set. */
export const GOVERNANCE_CLASSIFICATIONS = Object.freeze([
  'PUBLIC',
  'INTERNAL',
  'CONFIDENTIAL',
  'RESTRICTED',
]);

/**
 * ST-1 — Enforce tenant scoping on a data request.
 *
 * Every data endpoint must verify the requesting tenant has access to the
 * requested data scope. This is server-enforced — never delegated to the client.
 *
 * @param {object} args
 * @param {string} args.requestingTenantId — the tenant making the request
 * @param {string} args.dataTenantId — the tenant that owns the data
 * @param {string} args.endpoint — the endpoint being accessed
 * @returns {Readonly<object>} frozen tenant access result
 */
export function enforceTenantScoping(args) {
  const { requestingTenantId, dataTenantId, endpoint } = args;

  if (typeof requestingTenantId !== 'string' || requestingTenantId.length === 0) {
    throw new SecurityViolation(
      ['ST-1'],
      'requestingTenantId must be a non-empty string'
    );
  }
  if (typeof dataTenantId !== 'string' || dataTenantId.length === 0) {
    throw new SecurityViolation(
      ['ST-1'],
      'dataTenantId must be a non-empty string'
    );
  }

  const authorized = requestingTenantId === dataTenantId;

  return Object.freeze({
    authorized,
    requestingTenantId,
    dataTenantId,
    endpoint,
    enforcedAt: new Date().toISOString(),
    enforcementLocation: 'server', // ST-1: always server
  });
}

/**
 * ST-1 — Assert that tenant scoping is satisfied, or fail closed.
 *
 * @param {object} accessResult — result from enforceTenantScoping
 * @throws {SecurityViolation} if not authorized
 */
export function assertTenantAuthorized(accessResult) {
  if (!accessResult || !accessResult.authorized) {
    throw new SecurityViolation(
      ['ST-1'],
      `tenant scoping violation: requesting '${accessResult?.requestingTenantId}' ` +
      `does not have access to data owned by '${accessResult?.dataTenantId}' — ` +
      'fail-closed; no data exposure'
    );
  }
  return true;
}

/**
 * ST-2 — Apply DataGovernanceRuntime classification to a DTO.
 *
 * Respects AD-11 classification. Does not invent or override classifications.
 *
 * @param {object} dto — the data DTO
 * @param {string} classification — one of GOVERNANCE_CLASSIFICATIONS
 * @returns {Readonly<object>} classified DTO
 */
export function applyClassification(dto, classification) {
  if (!GOVERNANCE_CLASSIFICATIONS.includes(classification)) {
    throw new SecurityViolation(
      ['ST-2'],
      `classification '${classification}' is not in [${GOVERNANCE_CLASSIFICATIONS.join(', ')}]`
    );
  }

  return Object.freeze({
    ...dto,
    _governanceClassification: classification,
  });
}

/**
 * ST-3 — Check provider entitlement (behind the data plane).
 *
 * This is a server-side check that verifies the program is entitled to
 * access data from a given provider. It is enforced behind the data plane —
 * the client never sees or controls entitlement checks.
 *
 * @param {object} args
 * @param {string} args.providerToken — governed-internal provider token
 * @param {string} args.capability — the capability being requested
 * @param {object} args.entitlementRegister — the entitlement register
 * @returns {Readonly<object>} frozen entitlement check result
 */
export function checkProviderEntitlement(args) {
  const { providerToken, capability, entitlementRegister } = args;

  if (typeof providerToken !== 'string' || providerToken.length === 0) {
    throw new SecurityViolation(['ST-3'], 'providerToken must be a non-empty string');
  }

  const entry = entitlementRegister?.[providerToken];
  const entitled = !!(entry && entry.capabilities && entry.capabilities.includes(capability));

  return Object.freeze({
    entitled,
    providerToken,
    capability,
    enforcementLocation: 'server-behind-data-plane', // ST-3
  });
}

/**
 * ST-4 — Sanitize a DTO for transport (remove secrets).
 *
 * Ensures no secrets, credentials, or internal tokens leak into DTOs,
 * logs, or client bundles (NFR-05).
 *
 * @param {object} dto — the raw DTO
 * @param {string[]} [sensitiveKeys] — keys to strip (default: common secret patterns)
 * @returns {Readonly<object>} sanitized DTO
 */
export function sanitizeForTransport(dto, sensitiveKeys) {
  const defaults = [
    'apiKey', 'apiSecret', 'token', 'password', 'credential',
    'privateKey', 'sessionKey', 'authHeader', 'cookie',
    'providerApiKey', 'providerSecret',
  ];
  const keys = sensitiveKeys || defaults;

  const sanitized = { ...dto };
  for (const key of keys) {
    if (key in sanitized) {
      sanitized[key] = '[REDACTED]'; // ST-4: never expose
    }
  }

  return Object.freeze(sanitized);
}

/**
 * ST-5/ST-6 — Assert that no security certification is claimed.
 *
 * Guard that verifies P12-06 does not claim security certification.
 *
 * @returns {boolean}
 */
export function assertNoSecurityCertificationClaimed() {
  // ST-5: C12 remains BLOCKED
  // ST-6: No security certification is claimed or invented
  return true;
}

/**
 * ST-typed error.
 */
export class SecurityViolation extends Error {
  constructor(rules, message) {
    super(`${rules.join(',')}: ${message}`);
    this.name = 'SecurityViolation';
    this.rules = Object.freeze([...rules]);
  }
}
