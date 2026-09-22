/**
 * Institutional Investment Platform System (IIPS)
 * Security Master Object Resolution Service (P12 / Contract C7)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W3-AUTH-2026-01
 */

import { SecurityMaster } from '../identity/security_master.js';
import { IdentityQuery } from '../identity/mapping_store.js';
import { ExecutiveProvenance } from './types.js';
import { computeLineageHash } from '../contracts/provenance.js';

export interface ResolvedSecurityObject {
  companyId: string;
  isin: string;
  cin?: string;
  companyName: string;
  industry: string;
  sector: string;
  listings: Array<{
    exchange: 'NSE' | 'BSE';
    symbol: string;
    scripCode?: string;
    status: string;
    lotSize: number;
    tickSize: number;
  }>;
  faceValue: number;
  currency: 'INR';
  provenance: ExecutiveProvenance;
}

export class ObjectResolverService {
  private securityMaster: SecurityMaster;

  constructor(securityMaster?: SecurityMaster) {
    this.securityMaster = securityMaster || new SecurityMaster();
  }

  /**
   * Resolves an incoming identifier query to the authoritative canonical object descriptor (Contract C7).
   */
  public resolveObject(query: IdentityQuery): ResolvedSecurityObject {
    const companyId = this.securityMaster.resolveCompanyId(query);
    const entity = this.securityMaster.getEntity(companyId);

    if (!entity) {
      throw new Error(`Integrity error: Company '${companyId}' mapped but entity record missing in Security Master`);
    }

    const asOf = query.asOf || new Date().toISOString();
    const lineageDigest = computeLineageHash(entity, {
      sourceClassification: 'REAL',
      asOf,
      dataVersion: 'v1.0.0-sec-master',
    });

    const provenance: ExecutiveProvenance = {
      sourceClassification: 'REAL',
      asOf,
      evaluatedAt: new Date().toISOString(),
      dataVersion: 'v1.0.0-sec-master',
      lineageDigest,
      quality: 'GOOD',
      replayConstraintApplied: false,
    };

    return {
      companyId: entity.companyId,
      isin: entity.isin,
      cin: entity.cin,
      companyName: entity.companyName,
      industry: entity.industry,
      sector: entity.sector,
      listings: entity.listings.map((l) => ({
        exchange: l.exchange,
        symbol: l.symbol,
        scripCode: l.scripCode,
        status: l.status,
        lotSize: l.lotSize,
        tickSize: l.tickSize,
      })),
      faceValue: 1, // Base standard face value
      currency: 'INR',
      provenance,
    };
  }
}
