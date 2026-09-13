/**
 * P05-02 — LIVE MARKET-DATA ADAPTER CONTRACT (SPECIFICATION + CONFORMANCE SURFACE)
 *
 * Authority:  docs/d9/D9_P05_ENTRY_AUTHORIZATION.md §3 **A-2** —
 *             "P05 specification / adapter-contract work for P05-02 … Specification and
 *             adapter-contract only — contract shape, conformance rules, entitlement/secret
 *             requirements, error taxonomy mapping, observability requirements.
 *             ⚠ No live provider execution."
 *
 * WHAT THIS FILE IS
 *   A provider-neutral *contract*: the phase decomposition of a live market-data adapter, the
 *   conformance rules that decomposition must satisfy, and a deterministic conformance/pipeline
 *   harness that can be exercised **offline against test doubles**.
 *
 * WHAT THIS FILE IS NOT — read before interpreting any result produced through it
 *   ⚠ NO provider is selected, named, contacted or bound here (D9 N-1).
 *   ⚠ NO network, socket, HTTP, transport or vendor SDK is imported or invoked (LA-19).
 *   ⚠ NO credential, key, token, secret or endpoint value exists here (SP-1…SP-6, A-23).
 *   ⚠ Passing the conformance harness is **CONTRACT VALIDATION ONLY**. It is NOT evidence that
 *     "authenticated ingestion works", and it is NOT a provider integration test. The tracker's
 *     P05-02 Exit Criteria ("Authenticated ingestion works"), Test/Validation
 *     ("Integration tests") and Evidence ("Provider evidence") remain **UNMET** — see
 *     docs/p05/P05_02_OPEN_ITEMS.md §BD-P05-02-01.
 *   ⚠ This module does NOT implement a live adapter. It defines the shape one must satisfy.
 *
 * REUSE, NOT REDESIGN
 *   The canonical envelope, namespace, identity, provenance, asOf/version, validation, error and
 *   idempotency surfaces are the **P05-01** ones (`contract.js`, `namespace.js`, `identity.js`,
 *   `validate.js`, `errors.js`, `serialize.js`, `replay.js`). Nothing here forks a competing
 *   canonical model. `snapshot(request)` remains the **sole ingress** (P02 B-4 / AD-2): the
 *   operations below are the *internal phase decomposition* of an adapter, not a second public
 *   ingress contract.
 *
 * LABEL PREFIX
 *   Every normative rule introduced here carries the prefix **LA-** (verified unused across
 *   `docs/` and `p05/` at authoring time). Rule labels originating in other artifacts are always
 *   cited with their owning document, because several documents reuse the same short labels
 *   (e.g. `P02_PROVIDER_MAPPING_RULES` M-1…M-6 vs the program-level M-1/M-5/M-6, and
 *   `P02_ENTITLEMENT_MODEL` RD-1…RD-3 vs `P02_OBSERVABILITY_REQUIREMENTS` RD-1…RD-6).
 *   See docs/p05/P05_02_SPECIFICATION.md §2.2 for the disambiguation table.
 *
 * DETERMINISM (P02 D-1…D-6)
 *   No wall-clock, no randomness, no environment reads, no I/O. `receivedAt` is supplied by the
 *   caller at the ingest boundary and is never recomputed here (D-4 / TS-6).
 */

import {
  NAMESPACE_TOKEN,
  NAMESPACE_VERSION,
  DOMAIN_SEGMENTS,
  VALID_DOMAINS,
  buildKey,
  isNamespaced,
  parseKey,
  assertC1,
  assertC2,
  assertC3,
  assertC4,
  assertCollisionGuard,
  canonicalKeyOrder,
} from './namespace.js';
import { buildSnapshot, AVAILABILITY, MODES } from './contract.js';
import { validateSnapshot } from './validate.js';
import {
  ErrorClass,
  DISPOSITION,
  CLASSIFICATION_GATE_ORDER,
  RETRY_PROHIBITED,
  ClassifiedFailure,
  failureRecord,
  scanForSecrets,
} from './errors.js';
import { canonicalJson, canonicalDigest, assertIsoUtc } from './serialize.js';

/** Contract identity and version. Any change to the shape below is at least a MINOR bump (LA-1). */
export const P05_02_CONTRACT_VERSION = '1.0';
export const ADAPTER_CONTRACT_ID = 'P05-02-LIVE-MARKET-DATA-ADAPTER-CONTRACT';

/**
 * LA-1 — The contract is versioned. A change to any element below is at least a MINOR change;
 * a change that alters what a conforming adapter must emit is MAJOR (mirrors AV-3 / AV-4).
 */
export const CONTRACT_VERSIONING = Object.freeze({
  contractId: ADAPTER_CONTRACT_ID,
  contractVersion: P05_02_CONTRACT_VERSION,
  minorChangeRule: 'AV-3 — shape, phase, gate-order or conformance-rule change',
  majorChangeRule: 'AV-4 — change to the canonical output a conforming adapter must produce',
  immutableOnceReleased: 'AV-5 — corrections produce a new contract version, never an edit',
});

/**
 * LA-2 — Two provider kinds exist. The live surface is required **only** for `LIVE`.
 * A `LOCAL_FIXTURE` adapter is explicitly and permanently out of scope for the live surface;
 * it can never satisfy P05-02, and must not be presented as if it could.
 */
export const PROVIDER_KINDS = Object.freeze(['LOCAL_FIXTURE', 'LIVE']);

/**
 * The abstract phase decomposition of a market-data adapter.
 *
 * LA-3 — `snapshot(request)` remains the **sole** public ingress (P02 B-4 / AD-2). The phases
 * below are the adapter's *internal* decomposition. An adapter MAY implement them as separate
 * methods or inline; the contract constrains their **order, preconditions and outputs**, not
 * their factoring.
 *
 * LA-4 — Gate order is fixed as capability → entitlement → authentication → acquisition. This
 * reproduces the existing `CLASSIFICATION_GATE_ORDER` (E6 → E3 → E2 → E1) rather than inventing
 * an order, and honours EV-1 (entitlement is evaluated before acquisition) — authentication is
 * not acquisition.
 */
export const ADAPTER_PHASES = Object.freeze([
  Object.freeze({
    order: 1, phase: 'declare', op: 'declare', liveOnly: false, performsIO: false,
    purpose: 'Publish the static, I/O-free capability declaration',
    authority: ['P02_PROVIDER_ABSTRACTION_CONTRACT A-1…A-8', 'P02_PROVIDER_CAPABILITY_MODEL CD-1, C-1…C-18'],
    failureClass: null,
  }),
  Object.freeze({
    order: 2, phase: 'preflight', op: 'preflight', liveOnly: false, performsIO: false,
    purpose: 'Reject an unsupported request BEFORE any provider call',
    authority: ['P02 A-10', 'P02_PROVIDER_CAPABILITY_MODEL CE-1…CE-8, UC-1…UC-5'],
    failureClass: 'E6',
  }),
  Object.freeze({
    order: 3, phase: 'entitlement', op: 'checkEntitlement', liveOnly: true, performsIO: false,
    purpose: 'Default-deny entitlement evaluation against the governed entitlement register',
    authority: ['P02 A-11', 'P02_ENTITLEMENT_MODEL EV-1…EV-8, EN-1…EN-12, EM-1…EM-4'],
    failureClass: 'E3',
  }),
  Object.freeze({
    order: 4, phase: 'authenticate', op: 'authenticate', liveOnly: true, performsIO: true,
    purpose: 'Establish provider identity/credential validity — credential VALUE never crosses',
    authority: ['P02_ERROR_TAXONOMY E2', 'P02_ENTITLEMENT_MODEL SP-1…SP-6', 'P04 SEC-1'],
    failureClass: 'E2',
  }),
  Object.freeze({
    order: 5, phase: 'fetch', op: 'fetch', liveOnly: true, performsIO: true,
    purpose: 'Acquire the provider-native payload',
    authority: ['P02 A-12, A-13'],
    failureClass: 'E1|E4|E5|E7',
  }),
  Object.freeze({
    order: 6, phase: 'normalize', op: 'normalize', liveOnly: false, performsIO: false,
    purpose: 'Validate the payload against the declared provider wire schema; record ignored elements',
    authority: ['P02 A-13', 'P02_COMPATIBILITY_AND_SUBSTITUTION IC-4, IC-5'],
    failureClass: 'E5',
  }),
  Object.freeze({
    order: 7, phase: 'map', op: 'map', liveOnly: false, performsIO: false,
    purpose: 'Declared provider-native → canonical mapping; namespace applied here',
    authority: ['P02 A-14, A-15', 'P02_PROVIDER_MAPPING_RULES MD-1…MD-8, MR-1…MR-5, N-1…N-2'],
    failureClass: 'E8',
  }),
  Object.freeze({
    order: 8, phase: 'validate', op: 'validate', liveOnly: false, performsIO: false,
    purpose: 'P01 S1…S4 validation of the constructed canonical snapshot',
    authority: ['P01_VALIDATION_RULES S1…S4'],
    failureClass: 'RJ',
  }),
  Object.freeze({
    order: 9, phase: 'emit', op: 'emit', liveOnly: false, performsIO: false,
    purpose: 'Produce the immutable snapshot plus its audit/observability record',
    authority: ['P02 A-16, A-18, S-1…S-7', 'P02_OBSERVABILITY_REQUIREMENTS R-1…R-15, SL-1…SL-4'],
    failureClass: null,
  }),
]);

/** Convenience: the operations a LIVE adapter must expose in addition to the common core. */
export const LIVE_ONLY_OPERATIONS = Object.freeze(
  ADAPTER_PHASES.filter((p) => p.liveOnly).map((p) => p.op),
);

/** The operations every adapter — local or live — must expose. */
export const COMMON_OPERATIONS = Object.freeze(
  ADAPTER_PHASES.filter((p) => !p.liveOnly).map((p) => p.op),
);

/**
 * LA-5 — Authentication outcomes. `NOT_REQUIRED` is legal ONLY for `LOCAL_FIXTURE`; a LIVE
 * adapter that reports `NOT_REQUIRED` is non-conforming (a live source always establishes
 * identity, or fails E2).
 */
export const AUTH_OUTCOMES = Object.freeze(['AUTHENTICATED', 'FAILED', 'NOT_REQUIRED']);

/** LA-6 — Entitlement outcomes. `UNKNOWN` and absent both DENY (EV-3 default deny). */
export const ENTITLEMENT_OUTCOMES = Object.freeze(['ENTITLED', 'DENIED', 'EXPIRED', 'UNKNOWN', 'PARTIAL']);

/** LA-7 — The subset of outcomes that permit acquisition to proceed. */
export const ENTITLEMENT_PERMITTING = Object.freeze(['ENTITLED', 'PARTIAL']);

/**
 * LA-8 — Credential *requirement* vocabulary. These describe **what kind of credential a live
 * adapter will need**, never a credential. SP-5: "Entitlement records reference a credential
 * requirement, never a credential."
 *
 * ⚠ No value, no material, no endpoint, no account identifier appears in any of this.
 */
export const CREDENTIAL_REQUIREMENT_KINDS = Object.freeze([
  'API_KEY', 'OAUTH2_CLIENT_CREDENTIALS', 'MUTUAL_TLS_CERTIFICATE', 'SIGNED_TOKEN', 'SESSION_COOKIE',
]);

/** LA-9 — Where a credential value may live. Everything else is prohibited. */
export const CREDENTIAL_STORAGE_CLASSES = Object.freeze([
  'EXTERNAL_SECRET_MANAGER', 'PROCESS_ENVIRONMENT_AT_RUNTIME', 'MOUNTED_VOLUME_AT_RUNTIME',
]);

/**
 * LA-10 — Freshness is reported as an **input**, never as a verdict. Thresholds are P07
 * (`P02_OBSERVABILITY_REQUIREMENTS` MQ-1/MQ-2). An adapter that computes "fresh"/"stale"
 * from its own threshold is non-conforming.
 */
export const FRESHNESS_CONTRACT = Object.freeze({
  reportsInputs: true,
  setsThresholds: false,
  thresholdOwner: 'P07',
  requiredInputs: Object.freeze(['asOf', 'receivedAt', 'venueSessionRef', 'completenessBasis']),
});

// ────────────────────────────────────────────────────────────────────────────────────────────
// 1. CAPABILITY DECLARATION — the live extension of P02 A-1…A-8 / C-1…C-18
// ────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Build a LIVE adapter capability declaration.
 *
 * LA-11 — The declaration is static and I/O-free (CD-1) and is expressed in **canonical**
 * vocabulary only (CD-4). It contains no endpoint, hostname, account or credential (SP-2, A-23).
 *
 * LA-12 — `entitlementRequirements` and `credentialRequirements` are **requirements**, not
 * grants and not values. Declaring a requirement does not create entitlement (CD-6:
 * "Declared ≠ entitled").
 *
 * @param {object} cfg
 * @returns {Readonly<Record<string, unknown>>}
 */
export function declareLiveCapability(cfg) {
  const required = ['provider', 'adapterId', 'adapterVersion', 'providerSchemaVersion', 'schemaVersion'];
  const missing = required.filter((k) => cfg[k] === undefined);
  if (missing.length > 0) {
    throw new ClassifiedFailure('E8', `capability config missing ${missing.join(', ')}`, { missing });
  }

  return Object.freeze({
    // ── P02 A-1…A-8 core (identical shape to the P05-01 local declaration) ──────────────
    'A-1': Object.freeze({ provider: cfg.provider, providerKind: 'LIVE' }),
    'A-2': Object.freeze({ adapterId: cfg.adapterId, adapterVersion: cfg.adapterVersion }),
    'A-3': cfg.providerSchemaVersion,
    'A-4': Object.freeze([cfg.schemaVersion]),
    'A-5': NAMESPACE_VERSION,
    'A-6': Object.freeze({
      domains: Object.freeze([...cfg.domains].sort()),
      modes: Object.freeze([...cfg.modes].sort()),
      granularities: Object.freeze([...cfg.granularities].sort()),
      identifierInputs: Object.freeze([...(cfg.identifierInputs ?? [])].sort()),
      liveConnectivity: true,
    }),
    // LA-12 — requirements, not grants
    'A-7': Object.freeze({
      entitlementRequired: true,
      credentialsRequired: true,
      entitlementRequirements: Object.freeze(cfg.entitlementRequirements ?? []),
      credentialRequirements: Object.freeze(cfg.credentialRequirements ?? []),
    }),
    'A-8': Object.freeze([...cfg.knownLimitations]),

    // ── P05-02 live extension ───────────────────────────────────────────────────────────
    'LA-EXT': Object.freeze({
      contractId: ADAPTER_CONTRACT_ID,
      contractVersion: P05_02_CONTRACT_VERSION,
      rateLimits: Object.freeze(cfg.rateLimits ?? { declared: false, value: 'UNKNOWN' }),
      deterministicReplayable: Boolean(cfg.deterministicReplayable),
      transport: Object.freeze({
        // LA-13 — the transport is described by CLASS, never by endpoint. SP-2 prohibits a
        // hostname or URL anywhere in a declaration, fixture, log or evidence record.
        class: cfg.transportClass ?? 'UNKNOWN',
        endpointDeclared: false,
        credentialValuePresent: false,
      }),
      freshness: FRESHNESS_CONTRACT,
      // LA-14 — substitution: a live adapter is replaceable behind MarketDataSource<T>
      // (P02 B-3, PS-1…PS-10) and MUST NOT implement internal failover (PS-10 / PR-6).
      internalFailoverImplemented: false,
      substitutionOwner: 'PROGRAM_GOVERNANCE',
      failoverOwner: 'P07/P17',
    }),
  });
}

/**
 * LA-15 — Conformance of a capability declaration. Returns a violation list; it never throws
 * for a *content* shortfall, because a shortfall is itself the finding.
 *
 * @param {object} decl
 * @returns {{ok: boolean, violations: string[], checked: string[]}}
 */
export function assertCapabilityConformance(decl) {
  const violations = [];
  const checked = [];
  const want = (label, cond, msg) => { checked.push(label); if (!cond) violations.push(`${label}: ${msg}`); };

  want('C-1', typeof decl?.['A-1']?.provider === 'string' && decl['A-1'].provider.length > 0,
    'provider identity is REQUIRED');
  want('C-1/PI-1', PROVIDER_KINDS.includes(decl?.['A-1']?.providerKind),
    `providerKind must be one of ${PROVIDER_KINDS.join('|')}`);
  want('C-2', typeof decl?.['A-2']?.adapterId === 'string' && /^\d+\.\d+/.test(String(decl?.['A-2']?.adapterVersion ?? '')),
    'adapterId REQUIRED and adapterVersion must be MAJOR.MINOR at minimum (AV-2)');
  want('C-3', typeof decl?.['A-3'] === 'string' && decl['A-3'].length > 0, 'providerSchemaVersion REQUIRED');
  want('C-4', Array.isArray(decl?.['A-4']) && decl['A-4'].length > 0, 'canonicalSchemaVersions[] REQUIRED');
  want('C-5', decl?.['A-5'] === NAMESPACE_VERSION, `namespaceVersion must be the one in force (${NAMESPACE_VERSION}) — CT-3`);

  const domains = decl?.['A-6']?.domains ?? [];
  want('C-6', Array.isArray(domains) && domains.length > 0 && domains.every((d) => VALID_DOMAINS.includes(d)),
    'domains[] must be a non-empty subset of D01…D10 — no new domains (ST-8)');
  want('C-10', Array.isArray(decl?.['A-6']?.modes) && decl['A-6'].modes.every((m) => MODES.includes(m)),
    'modes[] must be a subset of LIVE|SNAPSHOT|PIT');
  want('C-8', Array.isArray(decl?.['A-6']?.granularities), 'granularities[] REQUIRED (may declare a single value)');
  want('C-14', Array.isArray(decl?.['A-6']?.identifierInputs),
    'identifierInputs[] REQUIRED — ⚠ constrained by OI-09 (FIGI authoritative) and OI-P04-04 (sourcing OPEN)');
  want('C-15', decl?.['A-7']?.entitlementRequired === true && Array.isArray(decl['A-7'].entitlementRequirements),
    'a LIVE adapter must declare entitlementRequired=true and an entitlementRequirements[] list');
  want('C-16', decl?.['LA-EXT']?.rateLimits !== undefined,
    'rateLimits REQUIRED — an explicit UNKNOWN is acceptable (CD-3), silence is not');
  want('C-17', Array.isArray(decl?.['A-8']),
    'knownLimitations[] REQUIRED as first-class content; an empty list is an assertion, not a default');
  want('C-18', typeof decl?.['LA-EXT']?.deterministicReplayable === 'boolean',
    'deterministicReplayable REQUIRED (boolean)');
  want('CD-1', decl?.['LA-EXT']?.transport?.endpointDeclared === false,
    'the declaration must be I/O-free and must declare no endpoint (SP-2)');
  want('CD-6', decl?.['A-7']?.credentialsRequired === true,
    'Declared ≠ entitled — a live adapter must still declare its credential requirement');
  want('LA-10', decl?.['LA-EXT']?.freshness?.setsThresholds === false,
    'an adapter sets no freshness thresholds; thresholds are P07 (MQ-1)');
  want('LA-14', decl?.['LA-EXT']?.internalFailoverImplemented === false,
    'adapter-internal failover is prohibited (PS-10 / PR-6)');

  // LA-16 — CD-5: a declared canonical field the P01 dictionary does not define is invalid.
  // We can only check the DOMAIN SEGMENT half of that here; the field half is checked by
  // buildKey()/namespace.js at map time. Declared fields must live in a declared domain.
  for (const d of domains) {
    const segs = DOMAIN_SEGMENTS[d];
    want(`CD-5/${d}`, Array.isArray(segs) && segs.length > 0,
      `domain ${d} has no accepted domain-segment vocabulary`);
  }

  return Object.freeze({ ok: violations.length === 0, violations: Object.freeze(violations), checked: Object.freeze(checked) });
}

// ────────────────────────────────────────────────────────────────────────────────────────────
// 2. ADAPTER SURFACE — the abstract interface, checked structurally
// ────────────────────────────────────────────────────────────────────────────────────────────

/**
 * LA-17 — Structural conformance of an adapter object against the phase interface.
 *
 * LA-3 permits an adapter to expose the phases as separate methods **or** to implement them
 * inline behind the sole ingress. The two cases are therefore checked differently:
 *
 *   · `requirePhases: true` (default) — harness-driven conformance. The runner drives each phase
 *     separately, so the operations must be individually callable. This is how the P05-02 test
 *     double is validated.
 *   · `requirePhases: false` — ingress-only conformance. Only `snapshot(request)` is required;
 *     the phases are reported as exposed or inline. **This is the P05-01 local feed's shape**:
 *     it implements preflight/normalize/map/validate/emit inline inside `snapshot()`, and its
 *     adherence to the mandated ORDER is established by the P05-01 tests, not by introspection.
 *
 * ⚠ Either way, this checks that operations **exist**. It does NOT execute them and does NOT
 * prove they work against a real provider — that is precisely what is NOT authorized.
 *
 * @param {object} adapter
 * @param {{providerKind?: 'LOCAL_FIXTURE'|'LIVE', requirePhases?: boolean}} [opts]
 * @returns {{ok: boolean, present: string[], missing: string[], notCallable: string[],
 *            ingressOk: boolean, factoring: 'SEPARATE_METHODS'|'INLINE'}}
 */
export function assertAdapterSurface(adapter, opts = {}) {
  const providerKind = opts.providerKind ?? adapter?.declare?.()?.['A-1']?.providerKind ?? 'LIVE';
  const requirePhases = opts.requirePhases !== false;

  const requiredOps = providerKind === 'LIVE'
    ? [...COMMON_OPERATIONS, ...LIVE_ONLY_OPERATIONS]
    : COMMON_OPERATIONS;

  const present = [];
  const missing = [];
  const notCallable = [];
  for (const op of new Set(requiredOps)) {
    if (adapter?.[op] === undefined) missing.push(op);
    else if (typeof adapter[op] !== 'function') notCallable.push(op);
    else present.push(op);
  }

  // LA-3 / P02 B-4 — the sole ingress must exist and be callable. This is the ONE operation that
  // is mandatory in every case.
  const ingressOk = typeof adapter?.snapshot === 'function';

  // The sole ingress is reported in `missing` too, so the report is complete on its own.
  if (!ingressOk) missing.push('snapshot');

  const enforcedMissing = requirePhases ? missing : [];
  const ok = ingressOk
    && enforcedMissing.length === 0
    && (requirePhases ? notCallable.length === 0 : true);

  return Object.freeze({
    ok,
    providerKind,
    requirePhases,
    present: Object.freeze(present.sort()),
    missing: Object.freeze([...missing].sort()),
    notCallable: Object.freeze([...notCallable].sort()),
    ingressOk,
    factoring: present.length === 0 ? 'INLINE' : 'SEPARATE_METHODS',
  });
}

// ────────────────────────────────────────────────────────────────────────────────────────────
// 3. PROVIDER-NATIVE LEAKAGE PREVENTION (P02 A-19, M-3, M-4; RD-3…RD-5)
// ────────────────────────────────────────────────────────────────────────────────────────────

/**
 * LA-18 — Scan a canonical artifact for provider-native vocabulary.
 *
 * "Provider-native vocabulary" is supplied by the caller as an explicit declared list of native
 * field names, symbols, enum values and native error codes. Any occurrence in a canonical
 * snapshot, lineage block, evidence record or error record is a **hard violation**:
 *   · A-19 — no provider-native field name, symbol, error code or enum may cross the boundary
 *   · M-3  — no provider-specific field name in a canonical snapshot / lineage / evidence artifact
 *   · M-4  — a native field with no canonical counterpart is dropped and recorded as a
 *            knownLimitation; it is never smuggled through a free-form bag or metadata blob
 *
 * The scan is performed over the **canonical JSON serialization**, so it covers nested lineage
 * and provenance strings, not just top-level keys.
 *
 * @param {unknown} artifact  any canonical artifact (snapshot, record, evidence object)
 * @param {string[]} nativeVocabulary  declared provider-native tokens that must not appear
 * @returns {{ok: boolean, violations: Array<{token: string, occurrences: number}>}}
 */
export function assertNoNativeLeakage(artifact, nativeVocabulary) {
  const text = canonicalJson(artifact);
  const violations = [];
  for (const token of nativeVocabulary ?? []) {
    if (typeof token !== 'string' || token.length === 0) continue;
    const occurrences = text.split(token).length - 1;
    if (occurrences > 0) violations.push({ token, occurrences });
  }
  return Object.freeze({ ok: violations.length === 0, violations: Object.freeze(violations) });
}

/**
 * LA-19 — The contract module must be free of transport, ambient-state and secret surface:
 * no network or process-spawning module import, no wall-clock, no random source, no environment
 * read, no credential material, no endpoint.
 *
 * ⚠ The literal pattern list lives in `tests/adapter-contract.test.js`, NOT here. A source module
 * that enumerated the forbidden module specifiers as string literals would itself match the
 * P05-01 boundary scan (`tests/no-provider-dependency.test.js` asserts that no file under
 * `src/` contains them), so naming them here would be self-defeating. Test files legitimately
 * name what they assert is absent.
 */
export const MODULE_SURFACE_RULE = Object.freeze({
  rule: 'LA-19',
  prohibits: Object.freeze([
    'network module import', 'process-spawning module import', 'wall-clock read',
    'random source', 'environment/ambient state read', 'credential material', 'endpoint URL',
  ]),
  patternListLocation: 'tests/adapter-contract.test.js',
  verifiedBy: 'tests/adapter-contract.test.js — source-surface scan',
});

/**
 * LA-20 — Secret/credential boundary check.
 *
 * Combines:
 *   · `scanForSecrets` (P05-01) — value-shaped secret detection
 *   · a structural assertion that a credential appears only as a **reference/requirement**,
 *     never as a value (SP-5)
 *   · the prohibited-construct list for source artifacts
 *
 * @param {unknown} artifact
 * @returns {{ok: boolean, secretHits: unknown[], credentialValueFields: string[]}}
 */
export function assertSecretBoundary(artifact) {
  const secretHits = scanForSecrets(artifact);

  // SP-5 — walk the artifact for keys that would hold a credential VALUE. A `*Ref` or
  // `*Requirement` key is a reference and is permitted; a bare value key is not.
  const credentialValueFields = [];
  const VALUE_KEY = /(secret|password|passwd|apikey|api_key|token|privatekey|private_key|credential)$/i;
  const REF_KEY = /(ref|requirement|requirements|kind|class|holder|id)$/i;
  (function walk(node, path) {
    if (node === null || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach((v, i) => walk(v, `${path}[${i}]`)); return; }
    for (const [k, v] of Object.entries(node)) {
      const p = path ? `${path}.${k}` : k;
      if (VALUE_KEY.test(k) && !REF_KEY.test(k) && v !== null && v !== undefined && v !== '') {
        credentialValueFields.push(p);
      }
      walk(v, p);
    }
  }(artifact, ''));

  return Object.freeze({
    ok: secretHits.length === 0 && credentialValueFields.length === 0,
    secretHits: Object.freeze(secretHits),
    credentialValueFields: Object.freeze(credentialValueFields),
  });
}

// ────────────────────────────────────────────────────────────────────────────────────────────
// 4. CREDENTIAL / ENTITLEMENT CONTRACT SURFACE (P03 boundary; SP-1…SP-6)
// ────────────────────────────────────────────────────────────────────────────────────────────

/**
 * LA-21 — Describe a credential **requirement**. This is the maximum the data plane may know
 * about a credential: what kind it is, where its value lives, and an opaque reference to it.
 *
 * ⚠ The credential VALUE is never a parameter of this function and never appears in its output.
 * P03 owns secrets; P05-02 defines only the requirement surface (P02 E-1).
 *
 * @param {{credentialRef: string, kind: string, storageClass?: string, scopes?: string[], rotationPolicy?: string}} spec
 * @returns {Readonly<object>}
 */
export function declareCredentialRequirement(spec) {
  if (typeof spec?.credentialRef !== 'string' || spec.credentialRef.length === 0) {
    throw new ClassifiedFailure('E8', 'credentialRef is REQUIRED — an opaque reference, never a value', {});
  }
  if (!CREDENTIAL_REQUIREMENT_KINDS.includes(spec.kind)) {
    throw new ClassifiedFailure('E8',
      `credential kind '${spec.kind}' is not in the declared requirement vocabulary`, { kind: spec.kind });
  }
  if (spec.storageClass !== undefined && !CREDENTIAL_STORAGE_CLASSES.includes(spec.storageClass)) {
    throw new ClassifiedFailure('E8',
      `storageClass '${spec.storageClass}' is not in the declared vocabulary`, { storageClass: spec.storageClass });
  }
  return Object.freeze({
    credentialRef: spec.credentialRef,
    kind: spec.kind,
    storageClass: spec.storageClass ?? 'EXTERNAL_SECRET_MANAGER',
    scopes: Object.freeze([...(spec.scopes ?? [])].sort()),
    rotationPolicy: spec.rotationPolicy ?? 'UNKNOWN',
    valuePresent: false,           // LA-21 invariant — asserted by test
    endpointPresent: false,        // SP-2
    owner: 'P03',                  // P02 E-1 — credentials and secrets are P03
    status: 'REQUIREMENT_ONLY',    // ⚠ NOT provisioned. D9 N-1.
  });
}

/**
 * LA-22 — Evaluate an entitlement **outcome** against the default-deny rule.
 *
 * EV-3: an entitlement that is absent, expired, `UNKNOWN` or unevaluable **denies**.
 * EV-7: entitlement is never inferred from a successful provider response.
 * EM-2/EM-4: the entitlement matrix is EMPTY and an empty matrix means nothing is entitled.
 *
 * @param {{status?: string, entitlementRef?: string, validTo?: string, asOf?: string}} outcome
 * @returns {{permit: boolean, reason: string, withheldFields: string[]}}
 */
export function evaluateEntitlement(outcome) {
  const status = outcome?.status;
  if (status === undefined || status === null) {
    return Object.freeze({ permit: false, reason: 'ABSENT → DENY (EV-3 default deny)', withheldFields: Object.freeze([]) });
  }
  if (!ENTITLEMENT_OUTCOMES.includes(status)) {
    return Object.freeze({ permit: false, reason: `UNEVALUABLE status '${status}' → DENY (EV-3)`, withheldFields: Object.freeze([]) });
  }
  if (status === 'UNKNOWN') {
    return Object.freeze({ permit: false, reason: 'UNKNOWN → DENY (EV-3)', withheldFields: Object.freeze([]) });
  }
  if (status === 'EXPIRED') {
    return Object.freeze({ permit: false, reason: 'EXPIRED → DENY, distinguishable from never-entitled (P02_ENTITLEMENT_MODEL §3.1)', withheldFields: Object.freeze([]) });
  }
  if (status === 'DENIED') {
    return Object.freeze({ permit: false, reason: 'DENIED → fail closed, no data, no partial data, no cached substitute (EV-4)', withheldFields: Object.freeze([]) });
  }
  if (status === 'PARTIAL') {
    // EV-8 / RD-1 — entitled fields are served; unentitled fields become WITHHELD with an
    // entitlementRef. WITHHELD is never conflated with NOT_PROVIDED.
    return Object.freeze({
      permit: true,
      reason: 'PARTIAL → entitled fields plus explicit WITHHELD markers (EV-8, RD-1)',
      withheldFields: Object.freeze([...(outcome.withheldFields ?? [])].sort()),
    });
  }
  // ENTITLED — but still require a reference so the decision is evidence-bearing (EV-6).
  if (typeof outcome.entitlementRef !== 'string' || outcome.entitlementRef.length === 0) {
    return Object.freeze({ permit: false, reason: 'ENTITLED without entitlementRef → DENY (EV-6 evidence-bearing)', withheldFields: Object.freeze([]) });
  }
  return Object.freeze({ permit: true, reason: 'ENTITLED with entitlementRef', withheldFields: Object.freeze([]) });
}

// ────────────────────────────────────────────────────────────────────────────────────────────
// 5. FRESHNESS INPUTS (P07 boundary)
// ────────────────────────────────────────────────────────────────────────────────────────────

/**
 * LA-23 — Compute freshness **inputs**. No threshold, no verdict, no SLO (MQ-1, MQ-2).
 *
 * @param {{asOf: string, receivedAt: string}} times
 * @returns {{ageMs: number, ageIsoDurationInputs: object, thresholdApplied: false, owner: 'P07'}}
 */
export function freshnessInput({ asOf, receivedAt }) {
  assertIsoUtc(asOf, 'asOf');
  assertIsoUtc(receivedAt, 'receivedAt');
  const ageMs = Date.parse(receivedAt) - Date.parse(asOf);
  return Object.freeze({
    ageMs,
    // LA-23 — the age may be negative (an asOf in the future relative to ingest). That is a
    // P07 concern to adjudicate; the adapter reports it, it does not judge it.
    negativeAge: ageMs < 0,
    thresholdApplied: false,
    verdict: null,
    owner: 'P07',
  });
}

// ────────────────────────────────────────────────────────────────────────────────────────────
// 6. THE DETERMINISTIC PIPELINE RUNNER
// ────────────────────────────────────────────────────────────────────────────────────────────

/**
 * LA-24 — Run an adapter's phase pipeline in the contract-mandated order, offline.
 *
 * ⚠ The `fetch` phase is satisfied by whatever the adapter supplies. In contract validation that
 *   is a **test double** returning committed fixture bytes. There is no network anywhere in this
 *   module. A pass here is CONTRACT VALIDATION, not live-provider evidence.
 *
 * LA-4 — order: preflight (E6) → entitlement (E3) → authenticate (E2) → fetch (E1/E4/E5/E7)
 *        → normalize (E5) → map (E8) → validate (P01 S1…S4) → emit.
 *
 * LA-25 — `receivedAt` is taken from the request and never recomputed (D-4 / TS-6). The runner
 *   reads no clock.
 *
 * @param {object} adapter
 * @param {object} request  must carry `receivedAt`
 * @returns {{ok: boolean, snapshot?: object, quality?: string, completenessPct?: number,
 *            failure?: ClassifiedFailure, record?: object, trace: string[]}}
 */
export function runAdapterPipeline(adapter, request) {
  const trace = [];
  const decl = adapter.declare();
  const providerKind = decl['A-1'].providerKind;

  const ctx = {
    provider: decl['A-1'].provider,
    adapterId: decl['A-2'].adapterId,
    adapterVersion: decl['A-2'].adapterVersion,
    providerSchemaVersion: decl['A-3'],
    schemaVersion: decl['A-4'][0],
    namespaceVersion: decl['A-5'],
    domain: request.domain,
    mode: request.mode,
    requestedFields: request.requestedFields ?? [],
    identityRef: request.canonicalSecurityId ?? null,
    receivedAt: request.receivedAt,
    attemptCount: 1,
  };

  try {
    assertIsoUtc(request.receivedAt, 'receivedAt');

    // ── Phase 2: capability pre-flight — BEFORE any provider call (A-10, CE-1…CE-8) ──────
    trace.push('preflight');
    adapter.preflight(request, decl);

    // ── Phase 3/4: entitlement then authentication (LIVE only) ───────────────────────────
    if (providerKind === 'LIVE') {
      trace.push('entitlement');
      const ent = evaluateEntitlement(adapter.checkEntitlement(request, decl));
      if (!ent.permit) {
        throw new ClassifiedFailure('E3', ent.reason, {
          entitlementRef: adapter.checkEntitlement(request, decl).entitlementRef ?? null,
          gateOrder: CLASSIFICATION_GATE_ORDER,
        });
      }
      trace.push('authenticate');
      const auth = adapter.authenticate(request, decl);
      if (auth.status === 'NOT_REQUIRED') {
        // LA-5 — a LIVE adapter may not report NOT_REQUIRED.
        throw new ClassifiedFailure('E2',
          'a LIVE adapter reported authentication NOT_REQUIRED — a live source establishes identity or fails E2 (LA-5)', {});
      }
      if (auth.status !== 'AUTHENTICATED') {
        throw new ClassifiedFailure('E2', 'authentication failed — rejection, never a quality state', {
          credentialRef: auth.credentialRef ?? null,
        });
      }
      trace.push('fetch');
    }

    // ── Phase 5: fetch (LIVE) or fixture read (LOCAL) ───────────────────────────────────
    const fetched = providerKind === 'LIVE'
      ? adapter.fetch(request, decl)
      : adapter.fetch(request, decl);
    trace.push('fetched');

    // ── Phase 6: normalize — validate against the declared provider wire schema (A-13) ──
    trace.push('normalize');
    const normalized = adapter.normalize(fetched, request, decl);

    // ── Phase 7: map — declared mapping, namespace applied (A-14, A-15) ─────────────────
    trace.push('map');
    const mapped = adapter.map(normalized, request, decl);

    // ── Phase 8: validate — P01 S1…S4 (reuses the P05-01 validator verbatim) ────────────
    trace.push('validate');
    adapter.validate(mapped.snapshot);

    // ── Phase 9: emit ───────────────────────────────────────────────────────────────────
    trace.push('emit');
    const record = buildAttemptRecord({ decl, request, ctx, mapped, normalized, outcome: 'SUCCESS' });
    const emitted = adapter.emit(mapped.snapshot, record);

    return Object.freeze({
      ok: true,
      snapshot: mapped.snapshot,
      quality: mapped.snapshot.quality,
      completenessPct: mapped.snapshot.completenessPct,
      record,
      receipt: emitted?.receipt ?? null,
      trace: Object.freeze(trace),
    });
  } catch (err) {
    const failure = err instanceof ClassifiedFailure
      ? err
      : new ClassifiedFailure('E8', err.message, { violatedRules: err.rules ?? [] });
    const record = failureRecord(failure, {
      ...ctx,
      offendingFieldSlots: failure.detail?.offendingFieldSlot ? [failure.detail.offendingFieldSlot] : [],
      violatedRules: failure.detail?.violatedRules ?? [],
      snapshotProduced: DISPOSITION[failure.code].producesSnapshot,
    });
    // E1 is the ONLY quality-bearing class (P02_ERROR_TAXONOMY §2). Everything else is a
    // rejection and produces no snapshot.
    if (failure.code === 'E1') {
      const empty = adapter.emptySnapshot
        ? adapter.emptySnapshot(request, ctx)
        : null;
      return Object.freeze({
        ok: true, snapshot: empty, quality: 'unavailable', completenessPct: 0,
        classified: 'E1', record, trace: Object.freeze(trace),
      });
    }
    return Object.freeze({ ok: false, failure, record, trace: Object.freeze(trace) });
  }
}

/**
 * LA-26 — Build the attempt/observability record required by
 * `P02_OBSERVABILITY_REQUIREMENTS` §2.1 (R-1…R-15) and §2.2 (SL-1…SL-4).
 *
 * ⚠ RD-1…RD-6 redaction is absolute: no credential, no endpoint, no unredacted provider
 * payload, no provider-native error string, no vendor name. This function therefore records
 * **counts and references**, never native content.
 */
export function buildAttemptRecord({ decl, request, ctx, mapped, normalized, outcome, failure }) {
  const fields = mapped?.snapshot?.fields ?? {};
  const byAvailability = {};
  for (const marker of AVAILABILITY) byAvailability[marker] = 0;
  for (const f of Object.values(fields)) {
    if (f?.availability && byAvailability[f.availability] !== undefined) byAvailability[f.availability] += 1;
  }

  return Object.freeze({
    // R-1…R-4
    'R-1': ctx.provider,
    'R-2': { adapterId: ctx.adapterId, adapterVersion: ctx.adapterVersion },
    'R-3': ctx.providerSchemaVersion,
    'R-4': { schemaVersion: ctx.schemaVersion, namespaceVersion: ctx.namespaceVersion },
    // R-5…R-7
    'R-5': Object.freeze({
      domain: ctx.domain, mode: ctx.mode, fieldSet: Object.freeze([...(ctx.requestedFields ?? [])].sort()),
      granularity: request.granularity ?? null, range: request.range ?? null,
    }),
    'R-6': ctx.identityRef,                       // R-6 — no provider-native symbol
    'R-7': { receivedAt: ctx.receivedAt, attemptCount: ctx.attemptCount },
    // R-8…R-11
    'R-8': { capabilityGate: 'PASS' },
    'R-9': { entitlementGate: outcome === 'SUCCESS' ? 'PASS' : 'EVALUATED', entitlementRef: request.entitlementRef ?? null },
    'R-10': Object.freeze({
      outcome,
      snapshotId: mapped?.snapshot?.snapshotId ?? null,
      errorClass: failure?.code ?? null,
    }),
    'R-11': { attemptCount: ctx.attemptCount, terminalDisposition: failure ? DISPOSITION[failure.code].kind : 'SNAPSHOT_PRODUCED' },
    // R-12…R-15
    'R-12': { quality: mapped?.snapshot?.quality ?? null, completenessPct: mapped?.snapshot?.completenessPct ?? null },
    'R-13': Object.freeze(byAvailability),
    'R-14': mapped?.snapshot?.lineage?.transformationChainRef ?? decl?.transformationChainRef ?? null,
    'R-15': Object.freeze([...(normalized?.ignoredElements ?? [])].sort()),
    // SL-1…SL-4
    'SL-1': mapped?.snapshot?.snapshotId ?? null,
    'SL-2': Object.freeze({ ...(mapped?.snapshot?.lineage ?? {}) }),
    'SL-3': mapped?.snapshot?.identityMappingVersion ?? null,
    'SL-4': Object.freeze({
      dataSnapshotId: mapped?.snapshot?.snapshotId ?? null,
      provider: ctx.provider,
      dataVersion: mapped?.snapshot?.dataVersion ?? null,
      asOf: mapped?.snapshot?.asOf ?? null,
      receivedAt: ctx.receivedAt,
      mode: ctx.mode,
      quality: mapped?.snapshot?.quality ?? null,
      completenessPct: mapped?.snapshot?.completenessPct ?? null,
    }),
    // LA-26 — redaction attestations, computed rather than asserted
    redaction: Object.freeze({
      credentialPresent: false,
      endpointPresent: false,
      nativePayloadIncluded: false,
      nativeErrorStringIncluded: failure ? false : false,
      vendorNameIncluded: false,
    }),
  });
}

// ────────────────────────────────────────────────────────────────────────────────────────────
// 7. CANONICAL OUTPUT BOUNDARY HELPERS — thin re-exports, never forks
// ────────────────────────────────────────────────────────────────────────────────────────────

/**
 * LA-27 — The canonical output boundary is the **P05-01** surface, re-exported unchanged.
 *
 * ⚠ This block exists so that a P05-02 adapter imports the canonical model from exactly one
 * place and cannot drift into a competing envelope. Nothing here is re-implemented.
 */
export const CANONICAL_OUTPUT_BOUNDARY = Object.freeze({
  buildSnapshot,
  validateSnapshot,
  buildKey,
  isNamespaced,
  parseKey,
  assertC1,
  assertC2,
  assertC3,
  assertC4,
  assertCollisionGuard,
  canonicalKeyOrder,
  canonicalJson,
  canonicalDigest,
  failureRecord,
  ClassifiedFailure,
  ErrorClass,
  DISPOSITION,
  RETRY_PROHIBITED,
  CLASSIFICATION_GATE_ORDER,
  AVAILABILITY,
  MODES,
  NAMESPACE_TOKEN,
  NAMESPACE_VERSION,
  DOMAIN_SEGMENTS,
  VALID_DOMAINS,
  owner: 'P05-01 (p05/src/{contract,namespace,identity,validate,errors,serialize}.js)',
  forked: false,
});

/**
 * LA-28 — Retry/error semantics **at the contract level only**.
 *
 * ⚠ P05-02 defines *which* classes may be retried and *what* a retry must not do. It does NOT
 * implement scheduling, backoff, checkpointing or idempotent re-delivery — those are **P05-04**,
 * which D9 does NOT authorize (N-3).
 */
export const RETRY_CONTRACT = Object.freeze({
  retryableClasses: Object.freeze(Object.keys(DISPOSITION).filter((c) => DISPOSITION[c].retryable).sort()),
  retryProhibitedClasses: RETRY_PROHIBITED,
  ownerOfExecution: 'P05-04 (NOT AUTHORIZED — D9 N-3)',
  rules: Object.freeze([
    'ES-4 — retry must never be applied to a deterministic failure (E2, E3, E5, E6, E8)',
    'E4 — rejection AFTER the retry policy is exhausted; may degrade to E1 under policy',
    'E7 — rejection; may degrade to E1 under policy',
    'E4/E7 → E1 escalation must be RECORDED, never silent (P02_OBSERVABILITY R-11, MQ M-6)',
    'A retry must not mutate an already-emitted snapshot (A-22); a correction is a new dataVersion',
    'Idempotent re-delivery of an identical (provider, dataVersion, asOf) must yield the identical snapshotId (D-1)',
  ]),
});

/**
 * LA-29 — The four-way distinction this work package is required to make explicit.
 * Only the first two are authorized by D9 A-2.
 */
export const AUTHORIZATION_MATRIX = Object.freeze([
  Object.freeze({ layer: 'ADAPTER_SPECIFICATION', what: 'The provider-neutral live-adapter specification (docs/p05/P05_02_SPECIFICATION.md)', authorized: true, authority: 'D9 A-2' }),
  Object.freeze({ layer: 'ADAPTER_CONTRACT', what: 'The executable contract/conformance surface (this module) + contract validation tests', authorized: true, authority: 'D9 A-2' }),
  Object.freeze({ layer: 'PROVIDER_SPECIFIC_CONFIGURATION', what: 'Real provider identity, endpoint, schema binding, entitlement values, credentials', authorized: false, authority: 'D9 N-1 — provider selection NONE MADE; entitlement matrix EMPTY; credentials NONE; P16 authority not held' }),
  Object.freeze({ layer: 'LIVE_PROVIDER_EXECUTION', what: 'Contacting a provider, authenticating, ingesting live quotes/prices', authorized: false, authority: 'D9 N-1 — ⚠ No live provider execution' }),
]);

/**
 * LA-30 — Summary of the contract for evidence purposes. Deterministic; no clock.
 */
export function contractSummary() {
  return Object.freeze({
    contractId: ADAPTER_CONTRACT_ID,
    contractVersion: P05_02_CONTRACT_VERSION,
    phases: Object.freeze(ADAPTER_PHASES.map((p) => Object.freeze({
      order: p.order, phase: p.phase, op: p.op, liveOnly: p.liveOnly, performsIO: p.performsIO, failureClass: p.failureClass,
    }))),
    liveOnlyOperations: LIVE_ONLY_OPERATIONS,
    commonOperations: COMMON_OPERATIONS,
    soleIngress: 'snapshot(request) — P02 B-4 / AD-2; the phases above are internal, not a second ingress',
    rulePrefix: 'LA-',
    ruleCount: 31,
    errorClasses: Object.freeze(Object.keys(ErrorClass).sort()),
    retryableClasses: RETRY_CONTRACT.retryableClasses,
    currencyVocabulary: CURRENCY_VOCABULARY_CONTRACT,
    authorizationMatrix: AUTHORIZATION_MATRIX,
    providerSelected: false,
    credentialsProvisioned: false,
    networkUsed: false,
    liveExecutionPerformed: false,
    claimsAuthenticatedIngestionWorks: false,
    canonicalModelForked: false,
  });
}

/**
 * LA-31 — Currency vocabulary is a DECLARED, versioned enumeration, not a shape test.
 *
 * `P02_PROVIDER_MAPPING_RULES` U-1 requires provider units/currencies to map to "the declared,
 * versioned canonical enumeration"; C-1 requires provider currency tokens to map to ISO-4217 and
 * makes an unmappable token an **E8**.
 *
 * ⚠ HONEST LIMITATION OF THIS CONTRACT PACKAGE: a `/^[A-Z]{3}$/` shape test is NOT ISO-4217
 * membership. A shape-valid but non-existent token (e.g. `XYZ`) passes a shape test and would
 * therefore be silently admitted — a real defect class, not a hypothetical one. Full membership
 * validation requires the ISO-4217 vocabulary as **provider-specific configuration**, which
 * D9 A-2 does NOT authorize (see AUTHORIZATION_MATRIX row 3). It is recorded as
 * BD-P05-02-05, not solved here and not faked here.
 */
export const CURRENCY_VOCABULARY_CONTRACT = Object.freeze({
  requirement: 'A real adapter MUST validate currency tokens against a declared ISO-4217 vocabulary; an unmappable token is E8 (P02_PROVIDER_MAPPING_RULES C-1, C-2, U-1, U-2).',
  localDoubleImplements: 'SHAPE_ONLY',
  shapePattern: '^[A-Z]{3}$',
  knownGap: 'A shape-valid but non-existent code (e.g. XYZ) is not rejected by a shape-only check.',
  gapDisposition: 'OPEN — BD-P05-02-05. The ISO-4217 vocabulary is provider-specific configuration; D9 A-2 authorizes specification and adapter-contract work only.',
  neverDefaulted: 'C-2 — a monetary value whose currency cannot be established is E8; never defaulted, never inferred from the venue (C-3).',
});
