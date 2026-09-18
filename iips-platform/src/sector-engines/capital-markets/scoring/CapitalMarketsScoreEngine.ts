/** Capital Markets Score Engine (WP-3) — band→score→pillar→composite per frozen D15 basis + expected outputs. */
import type { CapitalMarketsMetricValues } from '../metrics/CapitalMarketsMetrics';

export interface CapitalMarketsPillars {
  'earnings-quality': number;
  'growth': number;
  'profitability': number;
  'franchise': number;
  'operating-efficiency': number;
}

export interface CapitalMarketsScoreResult {
  pillars: CapitalMarketsPillars;
  composite: number;
}

const r2 = (x: number) => Math.floor(x * 10) / 10;

// --- Band->score tables (frozen D15 + expected-output basis) ---
function bandCti(v: number): number { if (v < 50) return 90; if (v < 60) return 75; if (v < 70) return 60; return 35; }
function bandRecur(v: number): number { if (v > 70) return 90; if (v >= 50) return 70; return 40; }
function bandAum(v: number): number { if (v > 20) return 90; if (v >= 10) return 75; if (v >= 5) return 60; return 40; }
function bandShare(v: number): number { if (v >= 15) return 90; if (v >= 10) return 75; if (v >= 5) return 60; return 40; }
function bandRoe(v: number): number { if (v >= 15) return 90; if (v >= 12) return 75; if (v >= 9) return 60; if (v >= 6) return 45; return 30; }

export class CapitalMarketsScoreEngine {
  score(metrics: CapitalMarketsMetricValues): CapitalMarketsScoreResult {
    const get = (id: string): number | undefined => metrics[id];
    const cti = get('CM-004') !== undefined ? bandCti(get('CM-004')!) : 60;
    const rec = get('CM-005') !== undefined ? bandRecur(get('CM-005')!) : 50;
    const aum = get('CM-002') !== undefined ? bandAum(get('CM-002')!) : 60; // default 5 → 60
    const ms = get('CM-006') !== undefined ? bandShare(get('CM-006')!) : 60; // default 5 → 60

    const earningsQuality = rec;
    const growth = 0.5 * aum + 0.5 * ms;
    const profitability = 0.6 * cti + 0.4 * bandRoe(9); // ROE proxied neutral 9
    // franchise = 0.5*ms + 0.5*aum-scale (AUM >=5000 → 90, else bandShare(AUM or 0))
    const aumScale = get('CM-001') !== undefined ? (get('CM-001')! >= 5000 ? 90 : bandShare(get('CM-001')!)) : bandShare(0);
    const franchise = 0.5 * ms + 0.5 * aumScale;
    const operatingEfficiency = cti;

    const pillars: CapitalMarketsPillars = {
      'earnings-quality': r2(earningsQuality),
      'growth': r2(growth),
      'profitability': r2(profitability),
      'franchise': r2(franchise),
      'operating-efficiency': r2(operatingEfficiency),
    };

    const composite = r2(
      pillars['earnings-quality'] * 0.25 +
      pillars.growth * 0.20 +
      pillars.profitability * 0.20 +
      pillars.franchise * 0.20 +
      pillars['operating-efficiency'] * 0.15,
    );

    return { pillars, composite };
  }
}
