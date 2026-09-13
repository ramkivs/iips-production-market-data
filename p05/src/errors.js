/**
 * P05-01 — PROVIDER ERROR AND FAILURE TAXONOMY (E1–E8)
 *
 * Authority: docs/p02/P02_ERROR_TAXONOMY.md
 *   Eight mandatory classes. Every failure maps to EXACTLY ONE (CL-1).
 *   Only E1 is quality-bearing (§1.2). E2–E8 are rejections (§2).
 *   FC-6 (docs/p04/P04_IDENTITY_ADAPTER_CONTRACT.md §6): E1–E8 is UNCHANGED — no class is
 *   added, removed or reclassified by P04 or by P05.
 */

/** @readonly @enum {string} */
export const ErrorClass = Object.freeze({
  E1: 'PROVIDER_UNAVAILABLE',
  E2: 'AUTHENTICATION_FAILURE',
  E3: 'ENTITLEMENT_FAILURE',
  E4: 'TRANSIENT_FAILURE',
  E5: 'MALFORMED_RESPONSE',
  E6: 'UNSUPPORTED_CAPABILITY',
  E7: 'RATE_LIMIT_FAILURE',
  E8: 'CONTRACT_MAPPING_FAILURE',
});

/**
 * Disposition per class (P02_ERROR_TAXONOMY.md §2).
 * `producesSnapshot` true only for E1 (and the explicit E3-partial case, handled separately).
 */
export const DISPOSITION = Object.freeze({
  E1: Object.freeze({ code: 'E1', label: ErrorClass.E1, kind: 'DATA_CONDITION', producesSnapshot: true, quality: 'unavailable', retryable: false }),
  E2: Object.freeze({ code: 'E2', label: ErrorClass.E2, kind: 'REJECTION', producesSnapshot: false, quality: null, retryable: false }),
  E3: Object.freeze({ code: 'E3', label: ErrorClass.E3, kind: 'REJECTION', producesSnapshot: false, quality: null, retryable: false }),
  E4: Object.freeze({ code: 'E4', label: ErrorClass.E4, kind: 'REJECTION', producesSnapshot: false, quality: null, retryable: true }),
  E5: Object.freeze({ code: 'E5', label: ErrorClass.E5, kind: 'REJECTION', producesSnapshot: false, quality: null, retryable: false }),
  E6: Object.freeze({ code: 'E6', label: ErrorClass.E6, kind: 'REJECTION', producesSnapshot: false, quality: null, retryable: false }),
  E7: Object.freeze({ code: 'E7', label: ErrorClass.E7, kind: 'REJECTION', producesSnapshot: false, quality: null, retryable: true }),
  E8: Object.freeze({ code: 'E8', label: ErrorClass.E8, kind: 'REJECTION', producesSnapshot: false, quality: null, retryable: false }),
});

/** CL-7: a failure that could plausibly be two classes is classified by the earliest gate. */
export const CLASSIFICATION_GATE_ORDER = Object.freeze(['E6', 'E3', 'E2', 'E1']);

/** ES-4: retry must never be applied to these — retrying a deterministic failure is prohibited. */
export const RETRY_PROHIBITED = Object.freeze(['E2', 'E3', 'E5', 'E6', 'E8']);

/**
 * Typed, classified adapter failure. CL-2: never a bare exception, string or provider-native code.
 */
export class ClassifiedFailure extends Error {
  /**
   * @param {'E1'|'E2'|'E3'|'E4'|'E5'|'E6'|'E7'|'E8'} code
   * @param {string} reason
   * @param {Record<string, unknown>} [detail]
   */
  constructor(code, reason, detail = {}) {
    super(`${code} ${DISPOSITION[code].label}: ${reason}`);
    this.name = 'ClassifiedFailure';
    this.code = code;
    this.class = DISPOSITION[code].label;
    this.kind = DISPOSITION[code].kind;
    this.producesSnapshot = DISPOSITION[code].producesSnapshot;
    this.reason = reason;
    this.detail = Object.freeze({ ...detail });
  }
}

/**
 * Build the mandatory evidence-bearing failure record (P02 §5, F-1…F-11).
 * FR-2: must NOT contain secrets, credentials, endpoints or unredacted provider payloads.
 *
 * @param {ClassifiedFailure} failure
 * @param {object} ctx
 * @param {string} ctx.provider
 * @param {string} ctx.adapterId
 * @param {string} ctx.adapterVersion
 * @param {string} ctx.domain
 * @param {string} ctx.mode
 * @param {string[]} ctx.requestedFields
 * @param {string|null} ctx.identityRef
 * @param {string} ctx.receivedAt
 * @param {number} ctx.attemptCount
 * @param {string} ctx.schemaVersion
 * @param {string} ctx.namespaceVersion
 * @param {string|null} [ctx.entitlementRef]
 * @param {string[]|null} [ctx.offendingFieldSlots]
 * @param {string[]|null} [ctx.violatedRules]
 * @param {boolean} [ctx.snapshotProduced]
 * @returns {Readonly<Record<string, unknown>>}
 */
export function failureRecord(failure, ctx) {
  return Object.freeze({
    'F-1': Object.freeze({ errorClass: failure.code, errorLabel: failure.class, kind: failure.kind }),
    'F-2': ctx.provider,
    'F-3': Object.freeze({ adapterId: ctx.adapterId, adapterVersion: ctx.adapterVersion }),
    'F-4': Object.freeze({
      domain: ctx.domain,
      mode: ctx.mode,
      fieldSet: Object.freeze([...ctx.requestedFields].sort()),
    }),
    // F-5: identity reference of the request — NEVER a provider-native symbol (PN-2, ID-6).
    'F-5': ctx.identityRef,
    'F-6': Object.freeze({ receivedAt: ctx.receivedAt, attempts: ctx.attemptCount }),
    'F-7': Object.freeze({
      attemptCount: ctx.attemptCount,
      terminalDisposition: DISPOSITION[failure.code].kind,
      retryProhibited: RETRY_PROHIBITED.includes(failure.code),
    }),
    'F-8': Object.freeze({ schemaVersion: ctx.schemaVersion, namespaceVersion: ctx.namespaceVersion }),
    // F-9: the entitlement REQUIREMENT, never the credential.
    'F-9': ctx.entitlementRef ?? null,
    // F-10: offending canonical slots and the rule violated — NOT the provider payload verbatim.
    'F-10': Object.freeze({
      offendingFieldSlots: Object.freeze([...(ctx.offendingFieldSlots ?? [])].sort()),
      violatedRules: Object.freeze([...(ctx.violatedRules ?? failure.rules ?? [])].sort()),
      reason: failure.reason,
    }),
    'F-11': ctx.snapshotProduced ?? failure.producesSnapshot,
  });
}

/**
 * PR-8 / FR-2 guard — detects actual credential MATERIAL, not prose about credentials.
 *
 * ⚠ Deliberately narrow: a bare word such as "secret" appears legitimately in contract
 *   documentation ("no credential, token, key, secret or endpoint URL may appear here").
 *   Flagging the word would make the guard useless. Each pattern below requires a VALUE.
 */
const SECRET_PATTERNS = Object.freeze([
  // An assignment of a credential-looking value.
  /\b(api[_-]?key|apikey|secret|secret[_-]?key|passwd|password|access[_-]?token|auth[_-]?token|credential)\b\s*[:=]\s*["'][^"']{8,}["']/i,
  // A PEM private key block.
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  // A URL carrying embedded userinfo (user:pass@host).
  /https?:\/\/[^\s"'/?#]+:[^\s"'/?#]+@/i,
  // A bearer token literal.
  /\bbearer\s+[A-Za-z0-9._\-]{16,}/i,
  // A long base64-ish opaque literal (candidate key material). Pure-hex strings are excluded
  // by `scanForSecrets` below: 40/64-char hex values are git OIDs and sha256 evidence digests,
  // which this program records deliberately.
  /["'][A-Za-z0-9+/]{40,}={0,2}["']/,
]);

/** Pure-hex digests (git OIDs, sha256 evidence) are legitimate, not credential material. */
const PURE_HEX_LITERAL = /^["'][0-9a-fA-F]{32,}["']$/;

/**
 * @param {unknown} value
 * @returns {string[]} list of pattern names that matched (empty = clean)
 */
export function scanForSecrets(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? '');
  const hits = [];
  for (const re of SECRET_PATTERNS) {
    const m = text.match(re);
    if (m === null) continue;
    // A matched literal that is nothing but a hex digest is evidence, not a secret.
    if (PURE_HEX_LITERAL.test(m[0])) continue;
    hits.push(String(re));
  }
  return hits;
}
