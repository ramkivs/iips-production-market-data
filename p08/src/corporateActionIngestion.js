/**
 * P08-02 — CORPORATE-ACTION INGESTION (`CA-*`)
 *
 * Tracker (`Work Tracker` / `Dependency Matrix`, authoritative XLSX), verbatim:
 *   · Work item   : **P08-02** · P08 · Corporate Actions · *"Corporate action ingestion"*
 *   · Requirement : *"Dividends, splits, bonuses and other approved actions."*
 *   · Deliverable : *"CA pipeline"*   · Dependencies: **P04-03, P05, P06** (Hard)
 *   · Entry       : *"Instrument lifecycle stable"* · Exit: *"Actions linked to instruments"*
 *   · Tests       : *"Scenario tests"* · Evidence: *"CA fixtures"*
 *
 * Authority: **D23** (`docs/D23_PHASE_08_02_WORK_ITEM_AUTHORIZATION.md`, `9e14124`) §11.
 *
 * ── THE ADJUSTMENT FIREWALL (read before adding anything) ────────────────────────────────────
 *   **P08-03** owns adjustment computation, adjustment application and adjusted/unadjusted series
 *   (tracker: *"Define adjusted/unadjusted series and portfolio reconciliation behavior"*, deps
 *   `P08-02,P07-03`). `P04_LIFECYCLE_AND_EFFECTIVE_DATING.md` **LX-2** excludes *"price/series
 *   adjustment logic"*; `P01_SCHEMA_CATALOG.md` D04 records *"Deferred: Adjustment engine — P08"*.
 *
 *   ⚠ This module INGESTS a **declared** `adjustmentFactor` as an opaque value. It never
 *   computes one, never applies one, never rewrites a price and never derives a series.
 *   `assertNoAdjustmentApplied()` and the test-suite source scan enforce that mechanically.
 *
 * ── WHAT THIS MODULE DELIBERATELY DOES NOT DO ────────────────────────────────────────────────
 *   • No adjustment computation/application — **P08-03** (above).
 *   • No durable persistence, no database, no filesystem. In-memory only (F-6 / D22 §5).
 *   • No network, no credentials, no `process.env`, no provider acquisition.
 *   • **No executable P04 lifecycle service.** ⚠ P04-03 is accepted as **SPECIFICATION ONLY**
 *     (`P04_GATE_ACCEPTANCE.md`:109/:198; `OI-P04-05` executable validation **DEFERRED**). This
 *     module CONSUMES the lifecycle contract as data; it does not provide, simulate or stand in
 *     for a P04 service, and it computes **no lifecycle transitions** (outside P08-02 scope).
 *   • No **P07-03** reconciliation — that is P08-03's dependency, not P08-02's.
 *   • No P05-04 reliance; no licensed acquisition claim; AD-17 untouched.
 *   • No acceptance, no certification, no A3 designation, no production activation.
 */

import { createPitStore, PitStorageError } from './pitStorageModel.js';

/** CA-1 — OI-10: the resolved namespace token and canonical key form `MD:<domain>.<field>`. */
export const NAMESPACE_TOKEN = 'MD:';
export const CA_DOMAIN = 'D04';
export const CA_SEGMENT = 'corpaction';

/** Build a canonical corporate-action field key. Never hand-assembled elsewhere. */
export function caKey(field) {
  return `${NAMESPACE_TOKEN}${CA_SEGMENT}.${field}`;
}

/**
 * CA-2 — **THE D04 FIELD CONTRACT**, transcribed from `P01_FIELD_DICTIONARY.md`:120-126.
 * `R` = required, `C` = conditional. ⚠ No field is added, renamed or dropped.
 */
export const CA_FIELDS = Object.freeze({
  actionType:             Object.freeze({ req: 'R', type: 'enum' }),
  exDate:                 Object.freeze({ req: 'C', type: 'ts' }),
  recordDate:             Object.freeze({ req: 'C', type: 'ts' }),
  payDate:                Object.freeze({ req: 'C', type: 'ts' }),
  effectiveDate:          Object.freeze({ req: 'R', type: 'ts' }),
  ratio:                  Object.freeze({ req: 'C', type: 'dec' }),
  cashAmount:             Object.freeze({ req: 'C', type: 'dec' }),
  resultingInstrumentRef: Object.freeze({ req: 'C', type: 'id' }),
  adjustmentFactor:       Object.freeze({ req: 'C', type: 'dec' }),
});

/**
 * CA-3 — **ACTION TYPES — ⚠ AUTHORITY GAP, BOUNDED NOT GUESSED.**
 *
 * `P01_FIELD_DICTIONARY.md`:120 declares `actionType` an **`enum`** but the corpus contains **no
 * enumeration of its values** — searched; zero hits. The only authoritative enumeration is the
 * P08-02 tracker requirement itself: *"**Dividends, splits, bonuses** and other approved actions."*
 *
 * ⚠ The three NAMED types are implemented. *"other approved actions"* names no values and
 * identifies no approver, so **no fourth value is invented**. An unlisted type is REJECTED
 * (`CA-E2`), never silently admitted — rejection keeps the gap visible instead of papering it
 * over. Widening this list requires an explicit authority act (recorded as **AG-1**).
 */
export const ACTION_TYPES = Object.freeze(['dividend', 'split', 'bonus']);

/**
 * CA-4 — **LIFECYCLE — CONSUMED, NOT IMPLEMENTED.**
 * The five-value enumeration is fixed by `P04_LIFECYCLE_AND_EFFECTIVE_DATING.md` §2
 * (*"five values, unchanged, none added"*). ⚠ Consumed verbatim; not extended; no transition
 * logic is implemented here (LC-* transitions are outside P08-02's accepted scope).
 */
export const LIFECYCLE_STATUS = Object.freeze([
  'active', 'suspended', 'delisted', 'merged', 'superseded',
]);

/**
 * CA-5 — **LC-3 / ED-4.** A retired identity remains resolvable for historical/PIT queries, so a
 * corporate action on a `delisted`, `merged` or `superseded` instrument is **admissible**.
 * ⚠ Absence of data is never a lifecycle state (LC-6) — `lifecycleStatus` must be stated.
 */
export const CA_RULES = Object.freeze({
  lifecycleConsumedFrom: 'P04-03 specification (P04_LIFECYCLE_AND_EFFECTIVE_DATING.md §2)',
  executableP04ServiceProvided: false,
  lifecycleTransitionsImplemented: false,
  datesCollapsed: false,
  adjustmentComputed: false,
  adjustmentApplied: false,
  p07_03ReconciliationInvoked: false,
});

/** Typed P08-02 violation carrying a stable machine-readable code. */
export class CorporateActionError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'CorporateActionError';
    this.code = code;
  }
}

const ISO_MS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
/** OI-09: FIGI/OpenFIGI — 12 chars, `BBG` prefix, uppercase alphanumeric. */
const FIGI = /^BBG[A-Z0-9]{9}$/;

/**
 * CA-6 — **INGESTION VALIDATION.** Validates and REJECTS; never coerces, defaults or repairs
 * (P07 `INV-7`, reused). A rejected action is not ingested.
 */
function assertValidAction(action) {
  if (action === null || typeof action !== 'object') {
    throw new CorporateActionError('CA-E1', 'corporate action must be an object');
  }
  // CA-6a — actionType (R), bounded by CA-3.
  if (!ACTION_TYPES.includes(action.actionType)) {
    throw new CorporateActionError(
      'CA-E2',
      `actionType must be one of ${ACTION_TYPES.join('|')} — "other approved actions" is an open `
      + 'authority item (AG-1) and no value is invented',
    );
  }
  // CA-6b — effectiveDate (R) and effectiveTime (REQUIRED for effective-dated data,
  //         P01_FIELD_DICTIONARY:47). ⚠ P04 ED-7/INV-5: no sixth timestamp is introduced.
  for (const f of ['effectiveDate', 'effectiveTime']) {
    if (typeof action[f] !== 'string' || !ISO_MS.test(action[f])) {
      throw new CorporateActionError('CA-E3', `${f} is REQUIRED as an ISO-8601 UTC instant`);
    }
  }
  // CA-6c — ⚠ ex/record/pay are DISTINCT contract fields and are NEVER collapsed
  //         (`P01_SCHEMA_CATALOG.md` D04). Each is optional, but each is its own field.
  for (const f of ['exDate', 'recordDate', 'payDate']) {
    if (typeof action[f] !== 'undefined' && !ISO_MS.test(action[f])) {
      throw new CorporateActionError('CA-E4', `${f} must be an ISO-8601 UTC instant when present`);
    }
  }
  // CA-6d — identity. OI-09 FIGI is the authoritative external identifier; OI-08 is 1:N, so the
  // instrument — not the company — is the linkage target.
  if (!FIGI.test(String(action.securityId ?? ''))) {
    throw new CorporateActionError(
      'CA-E5',
      'securityId must be a FIGI (OI-09). A provider symbol, a companyId or a synthetic '
      + '${sector}-H1 value is NEVER a canonical security identity',
    );
  }
  if (typeof action.companyId !== 'undefined' && action.companyId === action.securityId) {
    throw new CorporateActionError('CA-E6', 'companyId must not be substituted for securityId (OI-08 is 1:N)');
  }
  // CA-6e — lifecycleStatus must be stated and within the five accepted values (LC-6).
  if (!LIFECYCLE_STATUS.includes(action.lifecycleStatus)) {
    throw new CorporateActionError(
      'CA-E7',
      `lifecycleStatus must be one of ${LIFECYCLE_STATUS.join('|')} — the P04-03 enumeration is `
      + 'fixed at five values and is not expanded here',
    );
  }
  // CA-6f — LC-4: merged/superseded require a successor reference.
  if ((action.lifecycleStatus === 'merged' || action.lifecycleStatus === 'superseded')
      && !FIGI.test(String(action.resultingInstrumentRef ?? ''))) {
    throw new CorporateActionError(
      'CA-E8', 'merged/superseded require resultingInstrumentRef as a FIGI (LC-4)',
    );
  }
  // CA-6g — numeric conditionals are declared values, parsed not computed.
  for (const f of ['ratio', 'cashAmount', 'adjustmentFactor']) {
    if (typeof action[f] !== 'undefined' && (typeof action[f] !== 'number' || !Number.isFinite(action[f]))) {
      throw new CorporateActionError('CA-E9', `${f} must be a finite number when present`);
    }
  }
}

/**
 * CA-7 — **MAP A CORPORATE ACTION TO A CANONICAL D04 SNAPSHOT.**
 *
 * Output conforms to the accepted P01/P02 envelope: scalar `asOf`, six version axes,
 * `data-${provider}-${dataVersion}-${asOf}` identity, `MD:corpaction.*` keys.
 *
 * ⚠ `asOf` is the **ingestion vintage** (when the action became known), which is distinct from
 * `effectiveDate` (when the action takes effect). Collapsing them would destroy PIT semantics —
 * it is precisely what lets a later-ingested action leave earlier vintages untouched.
 */
export function toCanonicalSnapshot(action, { provider, dataVersion, asOf }) {
  assertValidAction(action);
  if (!ISO_MS.test(String(asOf))) {
    throw new CorporateActionError('CA-E10', 'asOf must be an ISO-8601 UTC instant');
  }
  const fields = {};
  for (const name of Object.keys(CA_FIELDS)) {
    if (typeof action[name] !== 'undefined') fields[caKey(name)] = action[name];
  }
  return Object.freeze({
    snapshotId: `data-${provider}-${dataVersion}-${asOf}`,
    provider,
    dataVersion,
    schemaVersion: '1.2',
    namespaceVersion: 'NSv1.0',
    asOf,
    mode: 'PIT',
    quality: action.quality ?? 'good',
    domain: CA_DOMAIN,
    securityId: action.securityId,
    lifecycleStatus: action.lifecycleStatus,
    effectiveTime: action.effectiveTime,
    fields: Object.freeze(fields),
  });
}

/**
 * CA-8 — **THE CA PIPELINE** (tracker deliverable). Ingests corporate actions into the **existing
 * P08-01 PIT store**. ⚠ P08-01 is used as-is — not redesigned, not subclassed, not forked.
 */
export function createCorporateActionPipeline(store = createPitStore()) {
  return Object.freeze({
    store,

    /** CA-9 — Ingest one action. Exit criterion: *"Actions linked to instruments"*. */
    ingest(action, meta) {
      const snapshot = toCanonicalSnapshot(action, meta);
      try {
        store.append(snapshot);
      } catch (e) {
        // ⚠ A conflicting vintage is surfaced, never overwritten (P08-01 PS-8).
        if (e instanceof PitStorageError) {
          throw new CorporateActionError('CA-E11', `rejected by the PIT store: ${e.message}`);
        }
        throw e;
      }
      return snapshot;
    },

    /** CA-10 — The actions linked to one instrument, in historical order. */
    actionsFor(securityId) {
      return store.seriesOf(CA_DOMAIN, securityId);
    },

    /**
     * CA-11 — **PIT reproducibility.** The corporate-action view of an instrument as it was known
     * at `asOf`. ⚠ Delegates to P08-01; an action ingested later is invisible to earlier vintages.
     */
    asOfView(securityId, asOf) {
      return store.asOfQuery(CA_DOMAIN, securityId, asOf);
    },

    /** CA-12 — Vintage ambiguity is reported, never resolved here (owner: P07-03 / P08-03). */
    ambiguities(securityId) {
      return store.detectVintageAmbiguity(CA_DOMAIN, securityId);
    },
  });
}

/**
 * CA-13 — **THE ADJUSTMENT FIREWALL, ASSERTED IN CODE.**
 * Reads a declared `adjustmentFactor` back out without applying it. ⚠ Any caller wanting an
 * adjusted price must wait for **P08-03**; this returns the raw declared value only.
 */
export function declaredAdjustmentFactor(snapshot) {
  const v = snapshot?.fields?.[caKey('adjustmentFactor')];
  return typeof v === 'number' ? v : null;
}

/**
 * CA-14 — **IMPLEMENTATION EVIDENCE** (tracker evidence: *"CA fixtures"*).
 * ⚠ Implementation evidence is **NOT** certification evidence.
 */
export const CA_EVIDENCE = Object.freeze({
  workItem: 'P08-02',
  requirement: 'Dividends, splits, bonuses and other approved actions.',
  exitCriterion: 'Actions linked to instruments',
  dependencies: Object.freeze(['P04-03', 'P05', 'P06']),
  p07_03IsDependency: false,
  p04LifecycleConsumedAsSpecification: true,
  p04ExecutableServiceClaimed: false,
  p05_04Relied: false,
  authorityGaps: Object.freeze([
    'AG-1 — actionType is declared enum but the corpus enumerates no values; only the three '
    + 'tracker-named types (dividend, split, bonus) are implemented. "other approved actions" '
    + 'names no values and no approver — widening requires an explicit authority act.',
  ]),
  deferredToP08_03: Object.freeze([
    'adjustment computation', 'adjustment application', 'adjusted/unadjusted series',
    'portfolio reconciliation', 'P07-03 reconciliation policy invocation',
  ]),
  acceptance: 'NOT_ACCEPTED',
  a3Acceptor: 'NOT DESIGNATED',
  c7: 'NOT CERTIFIED',
  certification: 'NONE_GRANTED',
  productionActivation: 'NOT_AUTHORIZED',
});
