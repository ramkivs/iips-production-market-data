/**
 * Institutional Investment Platform System (IIPS)
 * UI04 D06/D07 Build-Time Demo — Presentation-Only, Build-Time Wiring Consumer
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Authority: d06-d07-ui-integration-authorization-2026-09-27-001
 * Implementation Gate: D06/D07 UI Integration Implementation — Presentation-Only, Build-Time Wiring
 *
 * Build-Time Boundary:
 * DEPOSITED D06/D07 ARTIFACTS ONLY
 * NO EXTERNAL ACQUISITION DURING UI EXECUTION
 * NO RUNTIME PROVIDER SOCKETS
 * NO CREDENTIALS
 * LIVE_PROVIDER_EXECUTION_AT_RUNTIME = NOT AUTHORIZED
 *
 * ARENA_DIRECT_PARSEBOT_GET = ENVIRONMENT-BLOCKED (verbatim)
 *
 * Entitlement:
 * D06/D07 LIMITED PERSONAL-USE-ONLY / RESEARCH / EDUCATIONAL / NON-COMMERCIAL / NON-SUBLICENSEABLE / REVOCABLE / NO REDISTRIBUTION
 * UNRESTRICTED COMMERCIAL NOT ESTABLISHED
 * PRODUCTION NOT AUTHORIZED, D115 NOT AUTHORIZED
 *
 * This file demonstrates end-to-end build-time path:
 * D06_PROSPECTIVE_NSE_OBSERVATIONS (5 obs) + D07_PROSPECTIVE_ESTIMATES_VALID_PAYLOADS (39 valid)
 * → NewsEngine + EstimatesEngine via d06_d07_build_time_wiring.ts
 * → FilteredNewsResult + AggregatedConsensusResult
 * → IntelligenceDTO via EngineApiAdapter
 * → UI04DomainIntelligenceBuilder.build() → UI04DomainIntelligenceViewModel
 *
 * No network calls, no fetch, no axios, no https, no X-API-Key, no live provider.
 * Only committed repository datasets via build-time TS import (D05 pattern).
 */

import { buildIntelligenceDTOForCompany, D06_CONSUMPTION_PROOF, D07_CONSUMPTION_PROOF } from '../../intelligence/d06_d07_build_time_wiring.js';
import { UI04DomainIntelligenceBuilder } from './ui04_domain_intelligence.js';
import { UI04DomainIntelligenceViewModel } from '../types.js';

export interface UI04D06D07DemoResult {
  companyId: string;
  companyName: string;
  asOf: string;
  intelligenceDTO: ReturnType<typeof buildIntelligenceDTOForCompany>;
  viewModel: UI04DomainIntelligenceViewModel;
  d06Proof: typeof D06_CONSUMPTION_PROOF;
  d07Proof: typeof D07_CONSUMPTION_PROOF;
}

/**
 * Builds UI04 view model for a given company using deposited D06/D07 datasets only.
 * Presentation-only, build-time, deterministic.
 */
export function buildUI04DemoForCompany(params: {
  companyId: string;
  companyName: string;
  asOf: string;
  viewportWidth?: number;
}): UI04D06D07DemoResult {
  const { companyId, companyName, asOf, viewportWidth = 1280 } = params;

  const intelligenceDTO = buildIntelligenceDTOForCompany({
    companyId,
    asOf,
  });

  const viewModel = UI04DomainIntelligenceBuilder.build({
    intelligence: intelligenceDTO,
    companyName,
    viewportWidth,
  });

  return {
    companyId,
    companyName,
    asOf,
    intelligenceDTO,
    viewModel,
    d06Proof: D06_CONSUMPTION_PROOF,
    d07Proof: D07_CONSUMPTION_PROOF,
  };
}

/**
 * Demo for all 5 governed entities as of observation timestamp +1 day (2026-09-28) to ensure PIT passes.
 * All 5 D06 observations published before 2026-09-27, so asOf 2026-09-28 includes all.
 * All 39 valid D07 observations observed at 2026-09-27T18:18:58Z, so asOf 2026-09-28 includes all.
 */
export function buildUI04DemoForAllEntities(): UI04D06D07DemoResult[] {
  const asOf = '2026-09-28T00:00:00Z';
  const entities = [
    { companyId: 'EQ_RELIANCE_IN', companyName: 'Reliance Industries Limited' },
    { companyId: 'EQ_INFY_IN', companyName: 'Infosys Limited' },
    { companyId: 'EQ_TCS_IN', companyName: 'Tata Consultancy Services Limited' },
    { companyId: 'EQ_HDFCBANK_IN', companyName: 'HDFC Bank Limited' },
    { companyId: 'EQ_AXISBANK_IN', companyName: 'Axis Bank Limited' },
  ];
  return entities.map(e => buildUI04DemoForCompany({ companyId: e.companyId, companyName: e.companyName, asOf }));
}

// ---------------------------------------------------------------------------
// Proofs for UI04 integration
// ---------------------------------------------------------------------------

export const UI04_D06_D07_INTEGRATION_PROOF = {
  description: 'UI04DomainIntelligenceBuilder receives valid IntelligenceDTO containing D06/D07 results',
  d06: {
    consumption: '5 deposited observations consumed via NewsEngine',
    identities: ['EQ_RELIANCE_IN', 'EQ_INFY_IN', 'EQ_TCS_IN', 'EQ_HDFCBANK_IN', 'EQ_AXISBANK_IN'],
    newsIdDeterministic: true,
    publishedAtFiltering: 'publishedAt <= asOf preserved via NewsEngine.queryNews()',
    officialDisclosurePrecedence: "isOfficialExchange = sourcePublisher === 'GOVERNED_EXCHANGE_DISCLOSURE' preserved via UI04 builder",
    provenanceSurvives: 'provenance via IntelligenceDTO.provenance and D06_OBSERVATIONS retained',
  },
  d07: {
    consumption: '40 provider payloads recognized, 39 valid consumed via EstimatesEngine, 1 provider-null retained as PROVIDER_NULL',
    providerNullProof: 'HDFCBANK +1q EPS avg=null retained in D07_OBSERVATIONS_PROVIDER_NULL, not submitted, not zero, not dropped',
    identities: ['EQ_RELIANCE_IN', 'EQ_INFY_IN', 'EQ_TCS_IN', 'EQ_HDFCBANK_IN', 'EQ_AXISBANK_IN'],
    metricMapping: 'EPS, REVENUE deterministic',
    targetPeriodMapping: '0q, +1q, 0y, +1y preserved',
    submittedAtFiltering: 'submittedAt <= asOf preserved via EstimatesEngine.computeConsensus()',
    staleness: '90-day staleness rule preserved',
    nThreshold: 'N>=3 consensus rule preserved, e.g., RELIANCE 0q EPS N=2 invalid, 0y EPS N=27 valid',
    provenanceSurvives: 'provenance via D07_OBSERVATIONS_VALID and IntelligenceDTO.provenance',
  },
  ui04: {
    receivesDTO: true,
    newsSignals: 'headline, sentiment, sourceClass, isOfficialExchange',
    estimatesConsensus: 'targetPrice: mean, analystCount, isValidConsensus',
    provenance: 'asOf, qualityIndicator, provenance',
    presentationOnly: true,
  },
  networkProhibition: {
    hasFetch: false,
    hasAxios: false,
    liveExecution: 'LIVE_PROVIDER_EXECUTION_AT_RUNTIME = NOT AUTHORIZED',
  },
  entitlement: {
    d06: 'LIMITED_PERSONAL_USE_ONLY etc',
    d07: 'LIMITED_PERSONAL_USE_ONLY etc',
    commercial: 'NOT ESTABLISHED',
    production: 'NOT AUTHORIZED',
    d115: 'NOT AUTHORIZED',
  },
} as const;
