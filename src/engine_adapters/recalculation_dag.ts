/**
 * Institutional Investment Platform System (IIPS)
 * Recalculation DAG Dependency Tracker & Governed Triggers (P11-04 / AD-12)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W3-AUTH-2026-01
 */

import { DataDomain } from '../contracts/types.js';
import { CertifiedSectorEngineId } from './types.js';

export interface RecalculationTriggerEvent {
  companyId: string;
  triggeredByDomain: DataDomain;
  targetEngines: CertifiedSectorEngineId[];
  timestamp: string;
  reason: string;
}

export class RecalculationDAG {
  // Domain -> Engines that depend on this domain
  private dependencyMap: Map<DataDomain, CertifiedSectorEngineId[]> = new Map();
  private pendingRecalculations: RecalculationTriggerEvent[] = [];

  constructor() {
    // D01 (Market Quotes) triggers valuation and momentum factors
    this.dependencyMap.set('D01_QUOTES', [
      'SECTOR_IT', 'SECTOR_BANKING', 'SECTOR_AUTO', 'SECTOR_PHARMA', 'SECTOR_FMCG',
      'SECTOR_METALS', 'SECTOR_OIL_GAS', 'SECTOR_POWER', 'SECTOR_CEMENT', 'SECTOR_TELECOM',
      'SECTOR_CONSUMER_DURABLES', 'SECTOR_CAPITAL_GOODS', 'SECTOR_CHEMICALS', 'CSIP_COMPOSITE'
    ]);

    // D03 (Fundamentals) triggers full fundamental and ratio scoring
    this.dependencyMap.set('D03_FUNDAMENTALS', [
      'SECTOR_IT', 'SECTOR_BANKING', 'SECTOR_AUTO', 'SECTOR_PHARMA', 'SECTOR_FMCG',
      'SECTOR_METALS', 'SECTOR_OIL_GAS', 'SECTOR_POWER', 'SECTOR_CEMENT', 'SECTOR_TELECOM',
      'SECTOR_CONSUMER_DURABLES', 'SECTOR_CAPITAL_GOODS', 'SECTOR_CHEMICALS', 'CSIP_COMPOSITE'
    ]);

    // D04 (Corporate Actions) triggers price & EPS adjustments
    this.dependencyMap.set('D04_CORPORATE_ACTIONS', [
      'SECTOR_IT', 'SECTOR_BANKING', 'SECTOR_AUTO', 'SECTOR_PHARMA', 'SECTOR_FMCG',
      'SECTOR_METALS', 'SECTOR_OIL_GAS', 'SECTOR_POWER', 'SECTOR_CEMENT', 'SECTOR_TELECOM',
      'SECTOR_CONSUMER_DURABLES', 'SECTOR_CAPITAL_GOODS', 'SECTOR_CHEMICALS', 'CSIP_COMPOSITE'
    ]);
  }

  /**
   * Registers an upstream domain update and returns the affected downstream engines.
   */
  public triggerUpdate(
    companyId: string,
    domain: DataDomain,
    assignedSectorEngine?: CertifiedSectorEngineId
  ): RecalculationTriggerEvent {
    let affected = this.dependencyMap.get(domain) || [];
    if (assignedSectorEngine) {
      affected = affected.filter((e) => e === assignedSectorEngine || e === 'CSIP_COMPOSITE');
    }

    const event: RecalculationTriggerEvent = {
      companyId,
      triggeredByDomain: domain,
      targetEngines: affected,
      timestamp: new Date().toISOString(),
      reason: `Upstream update in domain ${domain} for ${companyId}`,
    };

    this.pendingRecalculations.push(event);
    return event;
  }

  public getPendingTriggers(): ReadonlyArray<RecalculationTriggerEvent> {
    return this.pendingRecalculations;
  }

  public clearPending(): void {
    this.pendingRecalculations = [];
  }
}
