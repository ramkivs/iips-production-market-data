/**
 * Program v3.0 — Phase 9: Typed API client for the Decision Matrix.
 * Mirrors the certified v2.0 transport DTO. Presentational scatter of CERTIFIED axes only.
 * No quadrant/band/threshold computation in React.
 *
 * D96: Widened return type to represent successful DecisionMatrixData | DegradedData.
 */
import type { Verdict } from '../components/decision/DecisionComponents';
import type { ExecutiveProvenance } from './executive';
import type { DegradedData } from './dataMode';
import { authFetch } from './authFetch';

export interface MatrixCompany {
  readonly companyId: string;
  readonly sector: string;
  readonly verdict: Verdict;
  readonly composite: number;
  readonly quality: number | null;   // certified quality axis
  readonly valuation: number | null; // certified valuation axis (null where engine lacks it)
}

export interface DecisionMatrixData {
  readonly dataAvailable?: undefined;
  readonly matrixType: 'scatter';
  readonly note: string;
  readonly companies: readonly MatrixCompany[];
  readonly universe: { readonly avgConviction: number; readonly avgQuality: number; readonly holdings: number };
  readonly provenance: ExecutiveProvenance;
}

export type DecisionMatrixResponse = DecisionMatrixData | DegradedData;

export async function fetchDecisionMatrixData(baseUrl = ''): Promise<DecisionMatrixResponse> {
  const res = await authFetch(`${baseUrl}/api/decision-matrix`);
  if (!res.ok) throw new Error(`decision-matrix transport returned ${res.status}`);
  return (await res.json()) as DecisionMatrixResponse;
}
