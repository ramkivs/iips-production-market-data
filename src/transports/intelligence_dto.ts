/**
 * Institutional Investment Platform System (IIPS)
 * Canonical Intelligence Product Transport DTO (P12 / D06..D09)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W3-AUTH-2026-01
 */

import { ExecutiveProvenance } from './types.js';
import { QualityState } from '../contracts/types.js';
import { FilteredNewsResult } from '../intelligence/news_engine.js';
import { AggregatedConsensusResult } from '../intelligence/estimates_engine.js';
import { MacroQueryResult } from '../intelligence/macro_engine.js';
import { CompositeAlternativeSignal } from '../intelligence/altdata_engine.js';

export interface IntelligenceDTO {
  companyId: string;
  news: FilteredNewsResult;
  estimates?: AggregatedConsensusResult | null;
  macro?: MacroQueryResult[] | null;
  altData?: CompositeAlternativeSignal | null;
  quality: QualityState;
  provenance: ExecutiveProvenance;
}
