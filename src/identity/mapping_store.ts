/**
 * Institutional Investment Platform System (IIPS)
 * Identity Mapping Store & Point-in-Time Effective Dating (P04)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 */

import { IdentityQuarantineRecord, IdentityAmbiguityError } from './quarantine.js';

export interface EffectiveDatedMapping {
  companyId: string;
  identifierType: 'ISIN' | 'CIN' | 'NSE_SYMBOL' | 'BSE_SYMBOL' | 'COMPOSITE_TICKER';
  identifierValue: string;
  effectiveFrom: string; // ISO-8601 UTC date
  effectiveTo?: string;   // ISO-8601 UTC date or undefined if current
}

export interface IdentityQuery {
  identifierType: 'ISIN' | 'CIN' | 'NSE_SYMBOL' | 'BSE_SYMBOL' | 'COMPOSITE_TICKER';
  identifierValue: string;
  asOf?: string; // ISO-8601 UTC
}

export class IdentityMappingStore {
  private mappings: EffectiveDatedMapping[] = [];
  private quarantineSink: IdentityQuarantineRecord[] = [];

  public addMapping(mapping: EffectiveDatedMapping): void {
    this.mappings.push(mapping);
  }

  public getQuarantinedRecords(): ReadonlyArray<IdentityQuarantineRecord> {
    return this.quarantineSink;
  }

  public clearQuarantine(): void {
    this.quarantineSink = [];
  }

  /**
   * Resolves an identifier to an authoritative companyId at a specific point in time.
   * Fails closed with IdentityAmbiguityError if unmapped or conflicting.
   */
  public resolveCompanyId(query: IdentityQuery): string {
    const asOfMs = query.asOf ? Date.parse(query.asOf) : Date.now();
    const cleanVal = query.identifierValue.trim().toUpperCase();

    const matched = this.mappings.filter((m) => {
      if (m.identifierType !== query.identifierType) return false;
      if (m.identifierValue.toUpperCase() !== cleanVal) return false;

      const fromMs = Date.parse(m.effectiveFrom);
      const toMs = m.effectiveTo ? Date.parse(m.effectiveTo) : Infinity;

      return asOfMs >= fromMs && asOfMs <= toMs;
    });

    if (matched.length === 0) {
      const qRecord: IdentityQuarantineRecord = {
        quarantineId: `ident-quar-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        identifierType: query.identifierType,
        rawIdentifier: query.identifierValue,
        reason: 'UNMAPPED_IDENTIFIER',
        asOf: query.asOf || new Date().toISOString(),
        receivedAt: new Date().toISOString(),
        details: `No active mapping found for ${query.identifierType}:${query.identifierValue} at asOf ${query.asOf || 'CURRENT'}`,
      };
      this.quarantineSink.push(qRecord);
      throw new IdentityAmbiguityError(qRecord);
    }

    if (matched.length > 1) {
      // Check if all matched point to the same companyId
      const uniqueCompanyIds = Array.from(new Set(matched.map((m) => m.companyId)));
      if (uniqueCompanyIds.length > 1) {
        const qRecord: IdentityQuarantineRecord = {
          quarantineId: `ident-quar-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          identifierType: query.identifierType,
          rawIdentifier: query.identifierValue,
          reason: 'AMBIGUOUS_COLLISION',
          asOf: query.asOf || new Date().toISOString(),
          receivedAt: new Date().toISOString(),
          details: `Multiple conflicting companyIds found: ${uniqueCompanyIds.join(', ')}`,
        };
        this.quarantineSink.push(qRecord);
        throw new IdentityAmbiguityError(qRecord);
      }
      return uniqueCompanyIds[0];
    }

    return matched[0].companyId;
  }
}
