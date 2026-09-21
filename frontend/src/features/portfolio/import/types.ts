/**
 * IIPS — BI-03: FINAPP broker-adapter foundation contracts (IIPS side).
 *
 * Sourced from ramkivs/finapp (WP-FB-IMPORT-BROKER-01)
 * Deposited under Governed Reuse Handoff (Commit b97b103)
 * Ported to IIPS under Program BI-02 / BI-03
 *
 * ══ SCOPE (BI-02 → BI-03 boundary) ══════════════════════════════════════════════════════
 *  This module establishes the IIPS-side contracts required to consume FINAPP
 *  broker-adapter output WITHOUT importing the Finapp ledger model or any
 *  Finapp runtime code. The FINAPP canonical `Holding` shape is re-declared
 *  structurally (minimum-field projection) so a future adapter port (BI-04+)
 *  is consumed through this contract alone.
 *
 *  Deliberately NOT part of BI-03 (per the BI-02 assessment and BI-03
 *  authorization):
 *    · Zerodha / Dhan / Groww adapter implementations → later BI stage
 *    · BrokerFormatDetector implementation            → later BI stage
 *    · Finapp BrokerImportService                     → EXCLUDED (not reusable:
 *      coupled to Finapp's local ledger / MemoryHoldingRepository / lifecycle
 *      reconciliation, incompatible with IIPS multi-tenant event journal)
 *    · Finapp lifecycle services, repositories, hooks → EXCLUDED
 *
 *  P04/P12 governance is preserved: nothing in this module resolves or
 *  invents security identity. The mapper forwards only the identifiers the
 *  source export actually contains; the existing governed resolver
 *  (frontend/server/portfolio/portfolio-resolver.ts) remains the sole
 *  authority for canonical resolution and fails closed on unknown securities.
 */

/**
 * Broker identifiers covered by the governed reuse handoff.
 * `ANGELONE` is deliberately NOT included: the AngelOne adapter was not
 * deposited in the handoff and is out of scope (BI-02 assessment §6).
 */
export type BrokerKind = 'ZERODHA' | 'DHAN' | 'GROWW';

/**
 * Minimum structural projection of the FINAPP canonical `Holding` record —
 * exactly the fields the IIPS import boundary consumes.
 *
 * The full Finapp record additionally carries ledger fields the IIPS Option A
 * overlay does NOT consume (`id`, `averageCost`, `investedValue`,
 * `unrealisedPnL`, `unrealisedPnLPercent`, `xirrPercent`,
 * `securityClassification`); those remain outside this contract by design so
 * no Finapp ledger model leaks into IIPS.
 *
 * Structural typing: a ported Finapp adapter's `Holding` (i.e. the
 * `BrokerParseOutput.holdings` entries of the deposited adapters) satisfies
 * this interface without any import from the Finapp dependency graph.
 */
export interface FinappHoldingProjection {
  readonly instrumentName: string;
  /** Exchange ticker when the source export provides one (e.g. Zerodha equities). */
  readonly ticker?: string;
  /** ISIN when the source export provides one (e.g. Groww stocks). */
  readonly isin?: string;
  readonly quantity: number;
  readonly currentPrice: number;
  /** Market value as normalized by the parser (quantity × currentPrice). */
  readonly currentValue: number;
  /** Finapp lifecycle status; deposited parsers emit `'active'` for import candidates. */
  readonly status: string;
  /** Source filename (provenance). */
  readonly sourceFile?: string;
  /** Parser execution time, ISO 8601 (provenance). */
  readonly importedAt?: string;
}

/**
 * The IIPS broker-import representation — the canonical intermediate form.
 *
 * Pipeline (BI-02 §5, BI-03 contract):
 *
 *   FINAPP Holding[]
 *        ↓  adaptFinappHoldings()          [compatibility.ts — this boundary]
 *   NormalizedBrokerHolding[]
 *        ↓  mapBrokerOutputToUserHoldings() [mapper.ts]
 *   UserHoldingInput[]                        (frontend/src/api/portfolio.ts)
 *        ↓  saveUserPortfolio()
 *   Portfolio Service → P04/P12 resolution → CSIP overlay
 *
 * One entry per source holding. No filtering and no aggregation happen at the
 * boundary — that is the mapper's responsibility — so nothing is silently
 * dropped before governance (fail-closed principle).
 */
export interface NormalizedBrokerHolding {
  /** IIPS-side broker classification, supplied by the importer (authoritative). */
  readonly broker: BrokerKind;
  readonly instrumentName: string;
  readonly symbol?: string;
  readonly isin?: string;
  readonly quantity: number;
  readonly currentPrice: number;
  /** Market value in the export's currency, carried from the parser output. */
  readonly marketValue: number;
  /** `true` when the source holding is active (`status === 'active'`). */
  readonly active: boolean;
  readonly sourceFile?: string;
  readonly importedAt?: string;
}
