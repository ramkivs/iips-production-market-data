/**
 * Institutional Investment Platform System (IIPS)
 * Identity Ambiguity Quarantine & Quarantine Records (P04 / AD-12)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 */

export interface IdentityQuarantineRecord {
  quarantineId: string;
  identifierType: 'ISIN' | 'CIN' | 'NSE_SYMBOL' | 'BSE_SYMBOL' | 'COMPOSITE_TICKER' | 'UNKNOWN';
  rawIdentifier: string;
  reason: 'UNMAPPED_IDENTIFIER' | 'AMBIGUOUS_COLLISION' | 'EXPIRED_EFFECTIVE_DATE' | 'MISSING_EXCHANGE';
  asOf: string;
  receivedAt: string;
  details: string;
}

export class IdentityAmbiguityError extends Error {
  public readonly quarantineRecord: IdentityQuarantineRecord;

  constructor(record: IdentityQuarantineRecord) {
    super(`Identity ambiguity detected for '${record.rawIdentifier}': ${record.reason} (${record.details})`);
    this.name = 'IdentityAmbiguityError';
    this.quarantineRecord = record;
  }
}
