/**
 * IIPS — BI-03: FINAPP → IIPS compatibility boundary.
 *
 * Sourced from ramkivs/finapp (WP-FB-IMPORT-BROKER-01)
 * Deposited under Governed Reuse Handoff (Commit b97b103)
 * Ported to IIPS under Program BI-02 / BI-03
 *
 * `adaptFinappHoldings` is the single boundary function that converts FINAPP
 * `Holding[]` candidates (as produced by the deposited broker adapters) into
 * the IIPS `NormalizedBrokerHolding[]` intermediate form.
 *
 * Rules:
 *   · Pure, side-effect free, never throws for ordinary data problems.
 *   · 1:1 mapping — NO filtering, NO aggregation, NO value recomputation.
 *     Exclusion and aggregation are mapper responsibilities so nothing is
 *     silently dropped before governance (fail-closed principle).
 *   · Whitespace-only identifier fields are dropped (become absent); other
 *     values are carried through unmodified — no coercion (P07 INV-7
 *     discipline, reused).
 *   · The `broker` classification is supplied by the IIPS importer (the
 *     future BrokerFormatDetector port, BI-04+). The parser-reported broker
 *     string is NOT trusted for classification.
 *   · Finapp ledger fields (`id`, `averageCost`, `investedValue`,
 *     `unrealisedPnL`, …) are dropped at this boundary — they never enter
 *     IIPS.
 */
import type {
  BrokerKind,
  FinappHoldingProjection,
  NormalizedBrokerHolding,
} from './types';

/** Trim a string identifier; whitespace-only or undefined becomes undefined. */
function clean(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

/**
 * Convert FINAPP `Holding[]` candidates to the IIPS normalized intermediate
 * form. See module header for the boundary rules.
 */
export function adaptFinappHoldings(
  holdings: readonly FinappHoldingProjection[],
  broker: BrokerKind,
): readonly NormalizedBrokerHolding[] {
  if (!Array.isArray(holdings)) return [];

  return holdings.map((h) => {
    const symbol = clean(h.ticker);
    const isin = clean(h.isin);
    const sourceFile = clean(h.sourceFile);
    const importedAt = clean(h.importedAt);

    return Object.freeze({
      broker,
      instrumentName: h.instrumentName === undefined ? '' : h.instrumentName.trim(),
      ...(symbol !== undefined ? { symbol } : {}),
      ...(isin !== undefined ? { isin } : {}),
      quantity: h.quantity,
      currentPrice: h.currentPrice,
      marketValue: h.currentValue,
      active: h.status === 'active',
      ...(sourceFile !== undefined ? { sourceFile } : {}),
      ...(importedAt !== undefined ? { importedAt } : {}),
    });
  });
}
