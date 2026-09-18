/**
 * Correlation Engine — stage 8 of the CSIP execution pipeline.
 * Detects hidden concentration / macro / economic / interest-rate / regulatory /
 * cyclicality exposure using ONLY platform metadata (sector exposure + aggregate risk).
 * It does NOT compute market correlation from prices — price-based correlation is
 * explicitly prohibited (frozen CSIP v1.0.0).
 */
import type { PortfolioIntelligenceReport, NormalizedHolding, CorrelationReport } from '../types';

export class CorrelationEngine {
  /** Produce sensitivity flags from platform metadata only. Deterministic. */
  analyze(report: PortfolioIntelligenceReport, holdings: NormalizedHolding[]): CorrelationReport {
    const flags: string[] = [];
    const concentrationSectors = Object.entries(report.sectorExposure)
      .filter(([, pct]) => pct >= 50)
      .map(([sector]) => sector);

    if (report.concentration >= 50) flags.push('hidden sector concentration');
    if (report.avgRisk > 55) flags.push('elevated systematic risk');

    // Sector-attribute sensitivity from platform metadata (sector names), not prices.
    const hasFinancial = report.sectorExposure['Banking'] !== undefined || report.sectorExposure['Capital Markets'] !== undefined;
    const hasInsurance = report.sectorExposure['Insurance'] !== undefined;
    const hasHealthcare = report.sectorExposure['Healthcare'] !== undefined;

    if (hasFinancial) flags.push('interest-rate sensitivity (financials exposure)');
    if (hasInsurance) flags.push('regulatory / catastrophe sensitivity (insurance)');
    if (hasHealthcare) flags.push('regulatory / healthcare-policy sensitivity');
    if (hasFinancial && hasInsurance) flags.push('financial-sector cyclicality');

    return { flags, concentrationSectors };
  }
}
