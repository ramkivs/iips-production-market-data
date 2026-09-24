/**
 * Program v3.0 — Phase 9: Typed API client for the Decision Matrix.
 *
 * ADAPTER of the donor `api/decisionMatrix.ts`: donor body verbatim, plus the current-lineage
 * NodeNext `.js` import specifiers.
 *
 * Mirrors the certified v2.0 transport DTO. Presentational scatter of CERTIFIED axes only.
 * No quadrant/band/threshold computation in React — and none in the transport either.
 *
 * NOTE: this is a READ AUTHORITY CLIENT used by Company/Sector Intelligence for their governed
 * sector universe and the Sector "universe position" panel. It does NOT recover the standalone
 * Decision Matrix UI surface, which remains outside this gate.
 */
import type { Verdict } from '../components/decision/DecisionComponents.js';
import type { ExecutiveProvenance } from './executive.js';
import { authFetch } from './authFetch.js';

export interface MatrixCompany {
  readonly companyId: string;
  readonly sector: string;
  readonly verdict: Verdict;
  readonly composite: number;
  readonly quality: number | null;   // certified quality axis
  readonly valuation: number | null; // certified valuation axis (null where engine lacks it)
}

export interface DecisionMatrixData {
  readonly matrixType: 'scatter';
  readonly note: string;
  readonly companies: readonly MatrixCompany[];
  readonly universe: { readonly avgConviction: number; readonly avgQuality: number; readonly holdings: number };
  readonly provenance: ExecutiveProvenance;
}

export async function fetchDecisionMatrixData(baseUrl = ''): Promise<DecisionMatrixData> {
  const res = await authFetch(`${baseUrl}/api/decision-matrix`);
  if (!res.ok) throw new Error(`decision-matrix transport returned ${res.status}`);
  return (await res.json()) as DecisionMatrixData;
}
