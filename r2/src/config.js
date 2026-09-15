/**
 * R-2 — CONFIGURATION / SECRETS INTERFACE
 *
 * ── Authority ────────────────────────────────────────────────────────────────────────────────
 *   R-2 §M.69 — credentials and secrets must **NEVER** be hard-coded.
 *   R-2 §M.70 — never commit credentials, tokens, API keys or passwords.
 *   R-2 §M.71 — define configuration/secrets interfaces for eventual production acquisition.
 *   R-2 §M.72 — follow existing repository secret-management conventions.
 *   R-2 §L.66 — licensing / credentials / entitlements / provider agreement / production access
 *               are explicit production gates.
 *
 * ── Repository convention observed ───────────────────────────────────────────────────────────
 *   There is no secret store, vault integration or `.env` loader anywhere in this repository
 *   (0 hits for any secret-management dependency). The established convention — visible in
 *   `docs/D22_F6_PHASE_08_IMPLEMENTATION_AUTHORIZATION.md`:139, which forbids **network and
 *   credential access** outright, and in the `p06` package description ("NO credentials, NO
 *   network") — is that credentials are **out of scope in code** and provisioning is an external,
 *   recorded act. This module follows that convention exactly: it models the *shape* of a
 *   credential requirement without ever holding a value.
 *
 * ── What this module guarantees ──────────────────────────────────────────────────────────────
 *   · `SecretRef` is a **name**, never a value. Nothing here can read, log or serialise a secret.
 *   · `resolveSecret` is intentionally **absent**. There is no code path by which a secret could
 *     enter this package, so §M.69/§M.70 hold structurally rather than by review discipline.
 *   · `redact` exists so that any future log line passes through it, and a test asserts that a
 *     value resembling a secret never survives it.
 *   · `assertNoLiterals` scans a config object for anything that looks like an embedded
 *     credential, so a hard-coded key fails a test rather than reaching a commit.
 */

/**
 * A reference to a secret held outside the process. Carries only a name and its expected shape.
 *
 * @typedef {object} SecretRef
 * @property {string} name          logical name, e.g. 'NSE_ACQUISITION_API_KEY'
 * @property {string} [providedBy]  where it will come from, e.g. 'process environment'
 * @property {boolean} [required]
 */

/**
 * Build a SecretRef. Deliberately cannot hold a value.
 *
 * @param {string} name
 * @param {object} [opts]
 * @returns {SecretRef}
 * @throws {Error} if the "name" looks like it contains an actual secret value
 */
export function secretRef(name, opts = {}) {
  const n = String(name ?? '').trim();
  if (n === '') throw new Error('R-2/§M.71: a SecretRef requires a non-empty logical name');
  // A name containing an '=' or a long token is almost certainly a pasted value, not a name.
  if (n.includes('=') || /[A-Za-z0-9+/_-]{32,}/.test(n)) {
    throw new Error(
      'R-2/§M.69: the supplied SecretRef name looks like it contains a credential VALUE. ' +
      'SecretRefs carry names only; values must never be hard-coded or committed.',
    );
  }
  return Object.freeze({ name: n, providedBy: opts.providedBy ?? 'process environment', required: opts.required !== false });
}

/**
 * The configuration shape eventual production acquisition will need (§M.71).
 * Every credential is a `SecretRef`; no field can hold a value.
 */
export const PRODUCTION_CONFIG_SHAPE = Object.freeze({
  acquisition: Object.freeze({
    mechanism: 'string — the authorised acquisition mechanism identifier',
    baseUrl: 'string|null — endpoint, when the mechanism has one',
    apiKey: 'SecretRef',
    apiSecret: 'SecretRef|null',
    entitlementToken: 'SecretRef|null',
    userId: 'SecretRef|null',
  }),
  entitlements: Object.freeze({
    exchange: 'string — e.g. NSE',
    segment: 'string — e.g. CM',
    dataClass: 'string — e.g. delayed-15min | eod',
    redistributionPermitted: 'boolean — §K.61, must be explicitly verified',
  }),
  refresh: Object.freeze({
    intervalMs: 'number — §A.8, default 900000',
    staleAfterIntervals: 'number — §Q.88, default 2',
  }),
  backfill: Object.freeze({
    years: 'number — §I.51 default 10, §I.52 always overridable',
    from: 'string|null',
    to: 'string|null',
  }),
});

/**
 * Patterns that indicate a credential has been embedded as a literal. Used by `assertNoLiterals`
 * and by the secrets test.
 */
const SECRET_LIKE = Object.freeze([
  { re: /(api[_-]?key|apikey|secret|token|password|passwd|credential)\s*[:=]\s*['"][^'"]{8,}['"]/i, kind: 'assigned credential literal' },
  { re: /\b(?:ghp|gho|github_pat)_[A-Za-z0-9]{20,}\b/, kind: 'GitHub token' },
  { re: /\bAKIA[0-9A-Z]{16}\b/, kind: 'AWS access key id' },
  { re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/, kind: 'Slack token' },
  { re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/, kind: 'private key block' },
]);

/**
 * Recursively scan an object for embedded credential literals (§M.69/§M.70).
 *
 * @param {unknown} value
 * @param {string} [path]
 * @returns {{clean: boolean, findings: string[]}}
 */
export function assertNoLiterals(value, path = '$') {
  const findings = [];
  const walk = (v, p) => {
    if (typeof v === 'string') {
      for (const { re, kind } of SECRET_LIKE) {
        if (re.test(v)) findings.push(`${p}: ${kind}`);
      }
      return;
    }
    if (Array.isArray(v)) { v.forEach((x, i) => walk(x, `${p}[${i}]`)); return; }
    if (v && typeof v === 'object') {
      for (const [k, x] of Object.entries(v)) walk(x, `${p}.${k}`);
    }
  };
  walk(value, path);
  return Object.freeze({ clean: findings.length === 0, findings: Object.freeze(findings) });
}

/**
 * Redact anything secret-like from a string before it is logged.
 *
 * @param {string} text
 * @returns {string}
 */
export function redact(text) {
  let out = String(text ?? '');
  out = out.replace(/(api[_-]?key|apikey|secret|token|password|passwd|credential)(\s*[:=]\s*)(['"]?)([^'"\s,}]{6,})(\3)/gi, '$1$2$3[REDACTED]$5');
  out = out.replace(/\b(?:ghp|gho|github_pat)_[A-Za-z0-9]{20,}\b/g, '[REDACTED]');
  out = out.replace(/\bAKIA[0-9A-Z]{16}\b/g, '[REDACTED]');
  out = out.replace(/\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g, '[REDACTED]');
  return out;
}

/**
 * Validate a supplied configuration against the production shape, without requiring any secret
 * value to be present. Used to prove §L.66 gates are *described* before any acquisition attempt.
 *
 * @param {object} config
 * @returns {{valid: boolean, problems: string[]}}
 */
export function validateConfig(config) {
  const problems = [];
  const a = config?.acquisition;
  if (!a) problems.push('acquisition block is required (§M.71)');
  else {
    if (!a.mechanism) problems.push('acquisition.mechanism is required');
    if (a.apiKey !== undefined && a.apiKey !== null && typeof a.apiKey === 'object' && !a.apiKey.name) {
      problems.push('acquisition.apiKey must be a SecretRef with a name');
    }
    if (typeof a.apiKey === 'string') {
      problems.push('§M.69: acquisition.apiKey must be a SecretRef, not a literal string');
    }
  }
  const e = config?.entitlements;
  if (e && e.redistributionPermitted !== true && e.redistributionPermitted !== false) {
    problems.push('entitlements.redistributionPermitted must be explicitly true or false (§K.61)');
  }
  const literals = assertNoLiterals(config);
  if (!literals.clean) problems.push(...literals.findings.map((f) => `§M.70 ${f}`));
  return Object.freeze({ valid: problems.length === 0, problems: Object.freeze(problems) });
}
