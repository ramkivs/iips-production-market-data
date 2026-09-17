import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { SecurityMasterEntry } from '../security-master/security-master-contract.ts';
import type { ValuationCompanyFundamentals } from '../valuation/valuation-contract.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface AssembledEngineInput {
  readonly subsegment: string;
  readonly archetype: string;
  readonly metrics: Record<string, number | boolean | string | undefined>;
  readonly valuationInputKey: string;
  readonly valuationMultiple: number;
}

export class DynamicEngineInputBuilder {
  private readonly referenceFixtures = new Map<string, Record<string, unknown>>();

  constructor() {
    this.loadReferenceFixtures();
  }

  private loadReferenceFixtures(): void {
    const fixtureMap: Record<string, string> = {
      Technology: 'technology/technology-golden-reference-1.0.0.json',
      Industrials: 'industrials/industrials-golden-reference-1.0.0.json',
      Energy: 'energy/energy-golden-reference-1.0.0.json',
      'Materials & Metals': 'materials-metals/materials-metals-golden-reference-1.0.0.json',
      Telecommunications: 'telecommunications/telecommunications-golden-reference-1.0.0.json',
      Automobile: 'automobile/automobile-golden-reference-1.0.0.json',
      Consumer: 'consumer/consumer-golden-reference-1.0.0.json',
      Utilities: 'utilities/utilities-golden-reference-1.0.0.json',
      Banking: 'banking/frozen-assets/banking-golden-reference-1.0.0.json',
    };

    for (const [sec, relPath] of Object.entries(fixtureMap)) {
      const fullPath = path.resolve(__dirname, `../../../iips-platform/src/sector-engines/${relPath}`);
      if (fs.existsSync(fullPath)) {
        const raw = fs.readFileSync(fullPath, 'utf8');
        const parsed = JSON.parse(raw) as { providers?: Array<Record<string, unknown>>; banks?: Array<Record<string, unknown>> };
        if (parsed.providers && parsed.providers.length > 0) {
          // Use the primary representative benchmark scenario (index 0) as the development fundamental base
          this.referenceFixtures.set(sec, parsed.providers[0]);
        } else if (parsed.banks && parsed.banks.length > 0) {
          // Banking golden reference uses "banks" array
          this.referenceFixtures.set(sec, parsed.banks[0]);
        }
      }
    }
  }

  /**
   * Retrieves static balance sheet fundamentals for a given sector and canonical ID.
   * Under D112-B, these serve strictly as fixed development denominators.
   */
  public getDevelopmentFundamentals(security: SecurityMasterEntry): ValuationCompanyFundamentals | null {
    const ref = this.referenceFixtures.get(security.sector);
    if (!ref) return null;

    // Standard representative balance-sheet denominators for Indian sector leaders
    // (Consistently scaled in INR Crores)
    const denominatorsBySector: Record<string, {
      shares: number;
      debt: number;
      cash: number;
      rev?: number;
      ebitda?: number;
      eps?: number;
      tangibleNetWorth?: number;
      netNpa?: number;
    }> = {
      Technology: { shares: 36.18, debt: 5000, cash: 12000, rev: 240000, ebitda: 65000, eps: 125.0 },
      Industrials: { shares: 13.7, debt: 25000, cash: 6000, rev: 180000, ebitda: 22000, eps: 85.0 },
      Energy: { shares: 67.6, debt: 300000, cash: 100000, rev: 890000, ebitda: 175000, eps: 105.0 },
      'Materials & Metals': { shares: 125.0, debt: 80000, cash: 12000, rev: 230000, ebitda: 35000, eps: 15.0 },
      Telecommunications: { shares: 59.8, debt: 210000, cash: 25000, rev: 150000, ebitda: 75000, eps: 25.0 },
      Automobile: { shares: 33.2, debt: 60000, cash: 15000, rev: 430000, ebitda: 58000, eps: 95.0 },
      Consumer: { shares: 23.5, debt: 1500, cash: 8000, rev: 61000, ebitda: 15000, eps: 45.0 },
      Utilities: { shares: 96.9, debt: 220000, cash: 10000, rev: 175000, ebitda: 52000, eps: 22.0 },
      // D113 Q-CAL-09: Banking representative denominator (HDFC Bank scale in INR Crores)
      Banking: { shares: 760.0, debt: 0, cash: 0, tangibleNetWorth: 450000.0, netNpa: 9000.0 },
    };

    const den = denominatorsBySector[security.sector];
    if (!den) return null;

    return {
      canonicalSecurityId: security.canonicalSecurityId,
      sector: security.sector,
      sharesOutstanding: den.shares,
      debt: den.debt,
      cash: den.cash,
      ltmRevenue: den.rev,
      ltmEbitda: den.ebitda,
      ltmEps: den.eps,
      tangibleNetWorth: den.tangibleNetWorth,
      netNpa: den.netNpa,
    };
  }

  /**
   * Assembles a complete, validated SectorInput payload for engine execution.
   * Injects the dynamic multiple from D112-C into the sector's valuation input field.
   */
  public assembleEngineInput(
    sector: string,
    synthesizedMultiple: number
  ): AssembledEngineInput {
    const ref = this.referenceFixtures.get(sector);
    if (!ref) {
      throw new Error(`MISSING_FIXTURE: No reference fundamental fixture found for sector ${sector}`);
    }

    const subsegment = (ref.subsegment as string) ?? (ref.segment as string) ?? (ref.category as string) ?? 'default';
    const archetype = (ref.archetype as string) ?? (ref.businessModel as string) ?? 'default';

    // Clone all non-valuation fundamental ratios from the certified reference scenario
    const metrics: Record<string, number | boolean | string | undefined> = { ...ref };

    let valuationInputKey = 'peRatio';
    switch (sector) {
      case 'Technology':
        valuationInputKey = 'evRevenue';
        metrics.evRevenue = synthesizedMultiple;
        break;
      case 'Industrials':
      case 'Energy':
      case 'Materials & Metals':
      case 'Telecommunications':
        valuationInputKey = 'evEbitda';
        metrics.evEbitda = synthesizedMultiple;
        break;
      case 'Automobile':
      case 'Consumer':
      case 'Utilities':
        valuationInputKey = 'peRatio';
        metrics.peRatio = synthesizedMultiple;
        break;
      case 'Banking':
        // D113-QCAL09: Banking valuation multiple key
        valuationInputKey = 'pAbv';
        metrics.pAbv = synthesizedMultiple;
        break;
      default:
        throw new Error(`UNSUPPORTED_SECTOR: ${sector}`);
    }

    return {
      subsegment,
      archetype,
      metrics,
      valuationInputKey,
      valuationMultiple: synthesizedMultiple,
    };
  }
}
