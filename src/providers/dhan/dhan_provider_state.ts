/**
 * Institutional Investment Platform System (IIPS)
 * D-7 Provider State Model — IPD implementation of the governed vocabulary
 *
 * Governed under: DHAN-LIVE-ROADMAP-2026-11-11 (v1.1) D-7, and the IPD decision record
 * `docs/integration/DHAN-D7-PROVIDER-STATE-MODEL-AND-DIAGNOSTICS-POLICY-2026-11-12.md`.
 *
 * PURPOSE:
 *  One place that turns observed evidence into one of the eight D-7 states. Diagnostics,
 *  health and (later) the IRR mapping read this value; none of them derives its own.
 *
 * WHAT THIS MODULE DELIBERATELY DOES NOT DO:
 *  - It never performs I/O. It cannot read a carrier, call a vendor or observe a clock.
 *  - It never predicts. "AUTHENTICATED" and "OPERATIONAL" require an observed vendor
 *    outcome passed in by the caller; local readiness can never reach them (D-7 §2.1).
 *  - It never upgrades on missing evidence: unknown or contradictory input reports the
 *    least capable applicable state, and outright unusable input reports UNAVAILABLE
 *    (D-7 §2.3, fail-closed).
 *
 * EVIDENCE CLASSES (roadmap §8): the local inputs are E1/E3; the vendor inputs are E4.
 * A caller that has no E4 evidence simply omits `lastVendorOutcome`, and the state can then
 * be no higher than CREDENTIALS_RESOLVED.
 */

/** The eight governed states, in the ladder order declared by D-7 §2, off-ladder last. */
export const DHAN_PROVIDER_STATES = [
  'UNCONFIGURED',
  'CONFIGURED',
  'CREDENTIALS_RESOLVED',
  'AUTHENTICATED',
  'OPERATIONAL',
  'EXPIRED',
  'DEGRADED',
  'UNAVAILABLE',
] as const;

export type DhanProviderState = (typeof DHAN_PROVIDER_STATES)[number];

/** Capability ladder, without the off-ladder states. */
export const DHAN_PROVIDER_STATE_LADDER = [
  'UNCONFIGURED',
  'CONFIGURED',
  'CREDENTIALS_RESOLVED',
  'AUTHENTICATED',
  'OPERATIONAL',
] as const satisfies readonly DhanProviderState[];

/**
 * What a locally observed vendor interaction did. Only these four values exist, and only
 * `ACCEPTED` may justify AUTHENTICATED (D-7 §2.1).
 */
export type DhanVendorOutcome =
  | 'ACCEPTED'
  | 'AUTH_REJECTED'
  | 'TRANSPORT_FAILED'
  | 'VENDOR_FAILED';

/** Local readiness of the credential store, as observed — never as predicted. */
export type DhanVaultReadinessObservation = 'SUPPORTED' | 'NOT_SUPPORTED' | 'NOT_PROBED';

/** Configuration observation: the governed pre-access readiness values, or "absent". */
export type DhanConfigObservation =
  | 'CREDENTIAL_REFERENCES_CONFIGURED'
  | 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE'
  | 'ABSENT';

export interface DhanProviderStateEvidence {
  /** What configuration resolution actually reported. */
  readonly config: DhanConfigObservation;
  /** What the awaited readiness probe actually reported. */
  readonly vaultReadiness: DhanVaultReadinessObservation;
  /** True only when carrier/SecretRef metadata shows the token at or past its expiry. */
  readonly credentialsExpired?: boolean;
  /** The most recent observed vendor outcome in this process, if any (E4). */
  readonly lastVendorOutcome?: DhanVendorOutcome;
  /** True only when a vendor-sourced market-data response has actually been served. */
  readonly marketDataServed?: boolean;
}

const CONFIG_OBSERVATIONS: readonly DhanConfigObservation[] = [
  'CREDENTIAL_REFERENCES_CONFIGURED',
  'PRE_ACCESS_CREDENTIALS_UNAVAILABLE',
  'ABSENT',
];

const VAULT_OBSERVATIONS: readonly DhanVaultReadinessObservation[] = [
  'SUPPORTED',
  'NOT_SUPPORTED',
  'NOT_PROBED',
];

const VENDOR_OUTCOMES: readonly DhanVendorOutcome[] = [
  'ACCEPTED',
  'AUTH_REJECTED',
  'TRANSPORT_FAILED',
  'VENDOR_FAILED',
];

function isOneOf<T extends string>(candidates: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (candidates as readonly string[]).includes(value);
}

function isUnusableEvidence(evidence: DhanProviderStateEvidence): boolean {
  if (isOneOf(CONFIG_OBSERVATIONS, evidence.config) === false) return true;
  if (isOneOf(VAULT_OBSERVATIONS, evidence.vaultReadiness) === false) return true;
  if (evidence.lastVendorOutcome !== undefined && isOneOf(VENDOR_OUTCOMES, evidence.lastVendorOutcome) === false) {
    return true;
  }
  return false;
}

/**
 * The D-7 derivation, in fail-closed order.
 *
 * Order matters and is normative:
 *  1. unusable evidence                      → UNAVAILABLE (nothing can be claimed)
 *  2. no governed configuration at all        → UNCONFIGURED
 *  3. expired material                       → EXPIRED   (local pre-flight, no vendor call)
 *  4. references present but not configured   → UNCONFIGURED
 *  5. vendor outcome observed:
 *       ACCEPTED (+ market data served)      → OPERATIONAL
 *       ACCEPTED                             → AUTHENTICATED
 *       any failure                          → DEGRADED
 *  6. no vendor outcome:
 *       probe supported                      → CREDENTIALS_RESOLVED
 *       probe unsupported / not probed       → CONFIGURED
 *
 * A vendor outcome cannot outrank a local contradiction: if the caller reports an accepted
 * interaction while the store is not supported or the material is expired, the least capable
 * applicable state is reported instead (D-7 §2.3(3)).
 */
export function deriveDhanProviderState(evidence: DhanProviderStateEvidence): DhanProviderState {
  if (evidence === null || typeof evidence !== 'object' || isUnusableEvidence(evidence)) {
    return 'UNAVAILABLE';
  }

  // No governed configuration at all: nothing else can be claimed, even if a caller also
  // reports expiry (that combination is contradictory and resolves to the least capable state).
  if (evidence.config === 'ABSENT') {
    return 'UNCONFIGURED';
  }

  // Expiry is a local pre-flight verdict and outranks the ladder (D-7 §2.3(4)).
  if (evidence.credentialsExpired === true) {
    return 'EXPIRED';
  }

  if (evidence.config !== 'CREDENTIAL_REFERENCES_CONFIGURED') {
    return 'UNCONFIGURED';
  }

  const locallyResolved = evidence.vaultReadiness === 'SUPPORTED';

  if (evidence.lastVendorOutcome !== undefined) {
    // A vendor observation without a locally supported store is contradictory evidence.
    if (!locallyResolved) return 'CONFIGURED';
    if (evidence.lastVendorOutcome === 'ACCEPTED') {
      return evidence.marketDataServed === true ? 'OPERATIONAL' : 'AUTHENTICATED';
    }
    return 'DEGRADED';
  }

  return locallyResolved ? 'CREDENTIALS_RESOLVED' : 'CONFIGURED';
}

/** True only for the two states that require observed vendor evidence (E4). */
export function isVendorEvidencedProviderState(state: DhanProviderState): boolean {
  return state === 'AUTHENTICATED' || state === 'OPERATIONAL';
}

/**
 * Position on the capability ladder, for tests and for any future ordering logic.
 * Off-ladder states return -1: they may not be compared with ladder states.
 */
export function dhanProviderStateRank(state: DhanProviderState): number {
  return (DHAN_PROVIDER_STATE_LADDER as readonly string[]).indexOf(state);
}
