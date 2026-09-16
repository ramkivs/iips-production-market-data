/**
 * D112-A Canonical Security Master Contract.
 *
 * Responsibilities:
 * - Deterministic, bidirectional resolution between official NSE exchange identities
 *   (Ticker Symbol, ISIN, Exchange Instrument ID) and governed IIPS platform entity IDs
 *   (e.g., 'ENERGY-H1', 'TECH-H1', 'BANK-H1').
 * - Preserves temporal validity windows (effectiveFrom / effectiveTo) for renames and lifecycle events.
 * - Enforces fail-closed semantics: unmapped, ambiguous, or delisted securities return null.
 * - Strict negative boundary: zero valuation calculation, zero dynamic engine execution,
 *   zero mutation of SNAPSHOT / GOLDEN_PILLARS.
 */

export type NseSecuritySeries = 'EQ' | 'BE' | 'SM' | 'ST';
export type ListingStatus = 'ACTIVE' | 'SUSPENDED' | 'DELISTED';

export interface SecurityMasterEntry {
  /** Governed IIPS Canonical Entity Identifier (e.g. 'ENERGY-H1', 'TECH-H1') */
  readonly canonicalSecurityId: string;

  /** Primary Trading Symbol on the National Stock Exchange of India (e.g. 'RELIANCE', 'TCS') */
  readonly tickerSymbol: string;

  /** International Securities Identification Number (12-character ISO 6166 verified) */
  readonly isin: string;

  /** Exchange Identifier — strictly 'NSE' for Layer-2 CM-UDiFF scope */
  readonly exchange: 'NSE';

  /** Permitted Equity Trading Series */
  readonly series: NseSecuritySeries;

  /** Target Certified Sector Engine Family (e.g. 'Energy', 'Technology', 'Banking') */
  readonly sector: string;

  /** Official Registered Corporate Name */
  readonly companyName: string;

  /** Optional Exchange Financial Instrument Identifier (FinInstrmId from CM-UDiFF) */
  readonly nseInstrumentId?: string;

  /** Optional Broker/Dhan Specific Scrip Identifier (SEM_SMST_SECURITY_ID) */
  readonly dhanSecurityId?: string;

  /** Active listing state */
  readonly listingStatus: ListingStatus;

  /** ISO Date string (YYYY-MM-DD) from which this mapping is authoritative */
  readonly effectiveFrom: string;

  /** ISO Date string (YYYY-MM-DD) when this mapping was retired or superseded (optional) */
  readonly effectiveTo?: string;

  /** Semantic version of the governing mapping policy */
  readonly mappingVersion: string;

  /** Authoritative evidence source validating this mapping */
  readonly evidenceSource: string;
}

export interface SecurityMasterRegistry {
  readonly schemaVersion: '1.0.0';
  readonly publishedDate: string;
  readonly authoritativeSource: string;
  readonly description: string;
  readonly entries: readonly SecurityMasterEntry[];
}
