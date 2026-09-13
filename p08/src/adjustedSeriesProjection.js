/**
 * P08-03 — ADJUSTMENT / RECONCILIATION — ADJUSTED & UNADJUSTED SERIES (`AS-*`)
 *
 * Tracker (`Work Tracker` / `Dependency Matrix`, authoritative XLSX), verbatim:
 *   · Work item   : **P08-03** · P08 · Corporate Actions · *"Adjustment/reconciliation"*
 *   · Requirement : *"Define adjusted/unadjusted series and portfolio reconciliation behavior."*
 *   · Deliverable : *"Adjustment engine/rules"* · Dependencies: **P08-02, P07-03** (Hard)
 *   · Entry       : *"CA data validated"* · Exit: *"Series and holdings reconcile"*
 *   · Tests       : *"Golden scenarios"*   · Evidence: *"Adjustment evidence"*
 *
 * Authority: **D24** (`docs/D24_PHASE_08_03_WORK_ITEM_AUTHORIZATION.md`, `085bf7a`) §13.
 *
 * ══ AG-2 — RE-VERIFIED AT IMPLEMENTATION TIME, STILL OPEN ════════════════════════════════════
 *   The corpus was re-searched at baseline `085bf7a` for adjustment arithmetic, derivation
 *   formulas, cumulative-factor rules, adjustment precedence, multi-action ordering and rounding
 *   rules. **ZERO authoritative hits.** AG-2 therefore remains **OPEN**.
 *
 *   ⚠ **NO ADJUSTMENT METHODOLOGY IS INVENTED HERE.** This module **consumes** a declared,
 *   evidence-bearing `adjustmentFactor` and **never manufactures one**. It does not convert a
 *   split `ratio` into a factor, does not derive a factor from `cashAmount`, price or action
 *   type, and composes nothing across multiple actions.
 *
 *   ⚠ **AG-2 is NON-BLOCKING for the authoritative exit criterion** — *"Series and holdings
 *   reconcile"* is reachable from declared factors alone (`AS-4`, `AS-8`). Where the corpus is
 *   silent the behaviour is **explicit refusal** (`AS-E3`, `AS-E6`), never a guess. Refusal keeps
 *   the gap visible; a default would bury it.
 *
 *   The governing contract is `P01_SCHEMA_CATALOG.md` D02 Provenance, verbatim:
 *       *"Adjustment factors are **evidence-bearing, never silently applied**."*
 *
 * ══ AG-1 — PRESERVED, NOT WIDENED ════════════════════════════════════════════════════════════
 *   `actionType` has no authoritative enumeration. The bounded vocabulary stays exactly the three
 *   tracker-named values enforced by P08-02 (`dividend`, `split`, `bonus`). ⚠ P08-03 adds no
 *   value and — because it never branches on action type (AG-2) — needs none.
 *
 * ── WHAT THIS MODULE DELIBERATELY DOES NOT DO ────────────────────────────────────────────────
 *   • No adjustment arithmetic, ordering, compounding, precedence or rounding rule (AG-2).
 *   • **No mutation of any stored PIT vintage.** Adjustment is a READ-SIDE PROJECTION only.
 *   • No second persistence architecture; P08-01 is used as-is and is not redesigned.
 *   • No change to P08-02 ingestion, to P07-03 reconciliation methodology, or to ADR-02.
 *   • No durable persistence, no database, no filesystem, no network, no `process.env`,
 *     no credentials, no provider acquisition.
 *   • No acceptance, no certification, no A3 designation, no production activation.
 */

import { caKey, CA_DOMAIN, declaredAdjustmentFactor } from './corporateActionIngestion.js';
import { DISPOSITION_TYPES, COMPARISON_DIMENSIONS } from '../../p07/src/providerReconciliation.js';

/** AS-1 — the P01 D02 adjusted-vs-unadjusted flag. A closed, two-value vocabulary. */
export const SERIES_BASIS = Object.freeze(['unadjusted', 'adjusted']);

/** Typed P08-03 violation carrying a stable machine-readable code. */
export class AdjustmentError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'AdjustmentError';
    this.code = code;
  }
}

/**
 * AS-2 — **THE AG-2 FIREWALL, ASSERTED IN CODE.**
 * Every property is a standing claim about what this module does not do; the test suite and the
 * source scan bind them.
 */
export const ADJUSTMENT_RULES = Object.freeze({
  ag2Status: 'OPEN — re-verified at 085bf7a, zero authoritative hits',
  methodologyInvented: false,
  factorDerivedFromRatio: false,
  factorDerivedFromCashAmount: false,
  factorDerivedFromPrice: false,
  factorDerivedFromActionType: false,
  cumulativeCompositionImplemented: false,
  multiActionOrderingImplemented: false,
  roundingRuleImplemented: false,
  adjustmentPrecedenceImplemented: false,
  declaredFactorOnly: true,
  storedVintageMutated: false,
  p08_02Modified: false,
  p07_03Modified: false,
  p07_03MethodologyDuplicated: false,
  governingRule: 'P01_SCHEMA_CATALOG.md D02 — adjustment factors are evidence-bearing, never silently applied',
});

/**
 * AS-3 — **ADJUSTMENT BASIS (provenance).** `P01_IDENTITY_AND_LINEAGE.md` **L-11**:
 * `adjustmentBasisRef` is **REQUIRED for adjusted series (D02/D04)**.
 *
 * ⚠ The reference is **derived from the corporate action's own identity** — it is not invented,
 * not random and not time-dependent, so it is deterministic and independently checkable.
 */
export function adjustmentBasisRef(caSnapshot) {
  if (caSnapshot === null || typeof caSnapshot !== 'object') {
    throw new AdjustmentError('AS-E1', 'an adjustment basis requires the corporate-action snapshot');
  }
  const { snapshotId, securityId } = caSnapshot;
  const effective = caSnapshot.fields?.[caKey('effectiveDate')];
  const actionType = caSnapshot.fields?.[caKey('actionType')];
  if (!snapshotId || !securityId || !effective || !actionType) {
    throw new AdjustmentError('AS-E2', 'adjustmentBasisRef requires snapshotId, securityId, actionType and effectiveDate');
  }
  // A structured, deterministic reference back to the evidence. No fabricated identifier.
  return `caref:${securityId}:${actionType}:${effective}:${snapshotId}`;
}

/**
 * AS-4 — **RESOLVE THE DECLARED FACTOR. NEVER MANUFACTURE ONE.**
 *
 * ⚠ If the corporate action carries no declared `adjustmentFactor`, this **refuses** with
 * `AS-E3`. It does **not** fall back to `ratio`, `cashAmount`, price or action type — doing so
 * would be exactly the invented methodology AG-2 forbids.
 */
export function resolveDeclaredFactor(caSnapshot) {
  const factor = declaredAdjustmentFactor(caSnapshot);
  if (factor === null) {
    throw new AdjustmentError(
      'AS-E3',
      'no declared adjustmentFactor on the corporate action — P08-03 may NOT derive one from '
      + 'ratio, cashAmount, price or actionType (AG-2 OPEN: the corpus specifies no adjustment '
      + 'arithmetic). A declared, evidence-bearing factor is required.',
    );
  }
  if (!Number.isFinite(factor) || factor <= 0) {
    throw new AdjustmentError('AS-E4', 'a declared adjustmentFactor must be a positive finite number');
  }
  return factor;
}

/** Price-like canonical fields eligible for an adjusted projection (P01 D02 `<NS>ohlcv.*`). */
const PRICE_FIELDS = Object.freeze([
  'MD:ohlcv.open', 'MD:ohlcv.high', 'MD:ohlcv.low', 'MD:ohlcv.close',
]);

/**
 * AS-5 — **THE UNADJUSTED SERIES.** Returned exactly as stored, flagged `unadjusted`.
 * ⚠ The stored vintages are returned by reference from the frozen P08-01 store — unchanged,
 * not copied-and-edited, not recomputed.
 */
export function unadjustedSeries(store, domain, securityId) {
  const bars = store.seriesOf(domain, securityId);
  return Object.freeze({
    basis: 'unadjusted',
    securityId,
    domain,
    bars,
    adjustmentBasisRef: null,
    adjustmentApplied: false,
  });
}

/**
 * AS-6 — **THE ADJUSTED SERIES — A READ-SIDE PROJECTION.**
 *
 * ⚠ **The stored PIT vintages are never rewritten.** This builds NEW objects and leaves the store
 * byte-identical; `AS-9` proves it.
 *
 * ⚠ Exactly **one** corporate action may be supplied. Composing several requires cumulative
 * ordering and precedence rules the corpus does not define — so multiple actions are **refused**
 * (`AS-E6`) rather than composed by guesswork.
 *
 * The projection multiplies the declared factor into the price fields. ⚠ That single operation is
 * the *application* of a declared, evidence-bearing factor — which the contract contemplates
 * (*"never **silently** applied"*, hence the mandatory `adjustmentBasisRef`) — and is **not** the
 * derivation of one. No rounding is imposed, because no rounding rule is authoritative (AG-2).
 */
export function adjustedSeries(store, securityId, corporateActions, { domain = 'D02' } = {}) {
  if (!Array.isArray(corporateActions)) {
    throw new AdjustmentError('AS-E5', 'corporateActions must be an array');
  }
  if (corporateActions.length !== 1) {
    throw new AdjustmentError(
      'AS-E6',
      `exactly one corporate action may be applied (received ${corporateActions.length}) — `
      + 'cumulative composition, ordering and precedence across multiple actions are NOT defined '
      + 'by the authoritative corpus (AG-2 OPEN) and are not invented here',
    );
  }
  const [ca] = corporateActions;
  if (ca?.domain !== CA_DOMAIN) {
    throw new AdjustmentError('AS-E7', 'the adjustment basis must be a D04 corporate-action snapshot');
  }
  if (ca.securityId !== securityId) {
    throw new AdjustmentError('AS-E8', 'the corporate action must belong to the same instrument (FIGI)');
  }
  const factor = resolveDeclaredFactor(ca);
  const basisRef = adjustmentBasisRef(ca);

  const bars = store.seriesOf(domain, securityId).map((bar) => {
    const fields = { ...bar.fields };
    for (const key of PRICE_FIELDS) {
      if (typeof fields[key] === 'number') fields[key] = fields[key] * factor;
    }
    // The factor travels with the projection as evidence, never silently.
    fields['MD:ohlcv.adjustmentFactor'] = factor;
    return Object.freeze({ ...bar, fields: Object.freeze(fields), basis: 'adjusted', adjustmentBasisRef: basisRef });
  });

  return Object.freeze({
    basis: 'adjusted',
    securityId,
    domain,
    bars: Object.freeze(bars),
    adjustmentBasisRef: basisRef,
    adjustmentApplied: true,
    declaredFactor: factor,
    factorDerived: false,
  });
}

/**
 * AS-7 — **PIT-BOUNDED PROJECTION.** The series as knowable at `asOf`
 * (`P01_SCHEMA_CATALOG.md` D02: *"Query returns data **as knowable** at the as-of boundary"*).
 * ⚠ A corporate action ingested after `asOf` is invisible, so an adjusted historical query is
 * reproducible and an earlier PIT result is never retroactively altered.
 */
export function seriesAsOf(store, securityId, asOf, { domain = 'D02', basis = 'unadjusted' } = {}) {
  if (!SERIES_BASIS.includes(basis)) {
    throw new AdjustmentError('AS-E9', `basis must be one of ${SERIES_BASIS.join('|')}`);
  }
  const visibleBars = store.seriesOf(domain, securityId).filter((b) => b.asOf <= asOf);
  if (basis === 'unadjusted') {
    return Object.freeze({
      basis: 'unadjusted', securityId, domain, asOf,
      bars: Object.freeze(visibleBars), adjustmentBasisRef: null, adjustmentApplied: false,
    });
  }
  const visibleCa = store.seriesOf(CA_DOMAIN, securityId).filter((c) => c.asOf <= asOf);
  if (visibleCa.length === 0) {
    throw new AdjustmentError(
      'AS-E10',
      `no corporate action is knowable at asOf=${asOf} — an adjusted series requires a declared, `
      + 'evidence-bearing factor (AG-2 OPEN); none is invented',
    );
  }
  const projected = adjustedSeries(store, securityId, visibleCa, { domain });
  return Object.freeze({ ...projected, asOf, bars: Object.freeze(projected.bars.filter((b) => b.asOf <= asOf)) });
}

/**
 * AS-8 — **PORTFOLIO RECONCILIATION BEHAVIOUR** (tracker exit: *"Series and holdings reconcile"*).
 *
 * ⚠ **Definition, not a new methodology.** Reconciliation delegates classification to the
 * **accepted P07-03 surface vocabulary** (`DISPOSITION_TYPES`, `COMPARISON_DIMENSIONS`), which is
 * imported and **not duplicated or modified**. A holding reconciles when the adjusted series it
 * references carries the same declared factor and the same `adjustmentBasisRef`.
 *
 * ⚠ It reports `CLASSIFIED_PRESENTED` / `UNRESOLVED_PRESENTED` and **presents both sides** — it
 * never collapses them, matching P07-03's accepted *"classify and present, never collapse"*.
 * ⚠ No valuation, no P&L, no holdings arithmetic: those are not assigned to P08-03.
 */
export function reconcileHoldings(series, holding) {
  if (series?.basis !== 'adjusted') {
    throw new AdjustmentError('AS-E11', 'holdings reconcile against an adjusted series projection');
  }
  const dimensions = [];
  if (holding?.adjustmentBasisRef !== series.adjustmentBasisRef) dimensions.push('CD-5');
  if (holding?.declaredFactor !== series.declaredFactor) dimensions.push('CD-1');
  if (holding?.securityId !== series.securityId) dimensions.push('CD-5');

  const reconciled = dimensions.length === 0;
  return Object.freeze({
    reconciled,
    disposition: reconciled ? DISPOSITION_TYPES[0] : DISPOSITION_TYPES[1],
    dimensions: Object.freeze(dimensions.filter((d) => COMPARISON_DIMENSIONS.includes(d))),
    // Both sides are always presented — never collapsed into one "winning" value.
    presented: Object.freeze({
      series: Object.freeze({ basis: series.basis, factor: series.declaredFactor, ref: series.adjustmentBasisRef }),
      holding: Object.freeze({ factor: holding?.declaredFactor ?? null, ref: holding?.adjustmentBasisRef ?? null }),
    }),
    methodologyInvented: false,
    p07_03SurfaceUsed: true,
  });
}

/**
 * AS-9 — **IMPLEMENTATION EVIDENCE** (tracker: *"Adjustment evidence"*).
 * ⚠ Implementation evidence is **NOT** certification evidence.
 */
export const ADJUSTMENT_EVIDENCE = Object.freeze({
  workItem: 'P08-03',
  requirement: 'Define adjusted/unadjusted series and portfolio reconciliation behavior.',
  exitCriterion: 'Series and holdings reconcile',
  dependencies: Object.freeze(['P08-02', 'P07-03']),
  projection: 'READ_SIDE_ONLY — stored PIT vintages are never rewritten',
  factorSource: 'DECLARED, evidence-bearing (P08-02 MD:corpaction.adjustmentFactor)',
  openAuthorityGaps: Object.freeze([
    'AG-1 — actionType enum values are not authoritatively enumerated; the bounded vocabulary '
    + '(dividend, split, bonus) from P08-02 is preserved and NOT widened.',
    'AG-2 — no adjustment arithmetic, derivation formula, cumulative-factor rule, multi-action '
    + 'ordering, precedence or rounding rule exists in the corpus. Re-verified OPEN at 085bf7a. '
    + 'P08-03 consumes declared factors only and REFUSES (AS-E3/AS-E6) rather than inventing. '
    + 'NON-BLOCKING for the exit criterion.',
  ]),
  notImplemented: Object.freeze([
    'factor derivation', 'cumulative multi-action composition', 'adjustment ordering/precedence',
    'rounding/precision policy', 'valuation or P&L arithmetic',
  ]),
  acceptance: 'NOT_ACCEPTED',
  a3Acceptor: 'NOT DESIGNATED',
  c7: 'NOT CERTIFIED',
  certification: 'NONE_GRANTED',
  productionActivation: 'NOT_AUTHORIZED',
});
