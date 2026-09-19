/**
 * Institutional Investment Platform System (IIPS)
 * Security Master Store & Entity Authority (P04)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 */

import { IdentityMappingStore, IdentityQuery } from './mapping_store.js';

export interface ExchangeListing {
  exchange: 'NSE' | 'BSE';
  symbol: string;
  scripCode?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELISTED';
  lotSize: number;
  tickSize: number;
}

export interface SecurityMasterEntity {
  companyId: string; // Authoritative engine-compatible ID
  isin: string;
  cin?: string;
  companyName: string;
  industry: string;
  sector: string;
  listings: ExchangeListing[];
  effectiveFrom: string;
  effectiveTo?: string;
}

export class SecurityMaster {
  private entities: Map<string, SecurityMasterEntity> = new Map();
  public readonly mappingStore: IdentityMappingStore = new IdentityMappingStore();

  public registerEntity(entity: SecurityMasterEntity): void {
    this.entities.set(entity.companyId, entity);

    // Auto-index ISIN
    if (entity.isin) {
      this.mappingStore.addMapping({
        companyId: entity.companyId,
        identifierType: 'ISIN',
        identifierValue: entity.isin,
        effectiveFrom: entity.effectiveFrom,
        effectiveTo: entity.effectiveTo,
      });
    }

    // Auto-index CIN
    if (entity.cin) {
      this.mappingStore.addMapping({
        companyId: entity.companyId,
        identifierType: 'CIN',
        identifierValue: entity.cin,
        effectiveFrom: entity.effectiveFrom,
        effectiveTo: entity.effectiveTo,
      });
    }

    // Auto-index Listings
    for (const listing of entity.listings) {
      if (listing.exchange === 'NSE') {
        this.mappingStore.addMapping({
          companyId: entity.companyId,
          identifierType: 'NSE_SYMBOL',
          identifierValue: listing.symbol,
          effectiveFrom: entity.effectiveFrom,
          effectiveTo: entity.effectiveTo,
        });
        this.mappingStore.addMapping({
          companyId: entity.companyId,
          identifierType: 'COMPOSITE_TICKER',
          identifierValue: `NSE:${listing.symbol}`,
          effectiveFrom: entity.effectiveFrom,
          effectiveTo: entity.effectiveTo,
        });
      } else if (listing.exchange === 'BSE') {
        this.mappingStore.addMapping({
          companyId: entity.companyId,
          identifierType: 'BSE_SYMBOL',
          identifierValue: listing.symbol,
          effectiveFrom: entity.effectiveFrom,
          effectiveTo: entity.effectiveTo,
        });
        this.mappingStore.addMapping({
          companyId: entity.companyId,
          identifierType: 'COMPOSITE_TICKER',
          identifierValue: `BSE:${listing.symbol}`,
          effectiveFrom: entity.effectiveFrom,
          effectiveTo: entity.effectiveTo,
        });
        if (listing.scripCode) {
          this.mappingStore.addMapping({
            companyId: entity.companyId,
            identifierType: 'COMPOSITE_TICKER',
            identifierValue: `BSE:${listing.scripCode}`,
            effectiveFrom: entity.effectiveFrom,
            effectiveTo: entity.effectiveTo,
          });
        }
      }
    }
  }

  public getEntity(companyId: string): SecurityMasterEntity | undefined {
    return this.entities.get(companyId);
  }

  public listAllCompanyIds(): string[] {
    return Array.from(this.entities.keys());
  }

  public resolveCompanyId(query: IdentityQuery): string {
    return this.mappingStore.resolveCompanyId(query);
  }
}
