/**
 * IIPS — BI-03: FINAPP broker-import foundation (public surface).
 *
 * Sourced from ramkivs/finapp (WP-FB-IMPORT-BROKER-01)
 * Deposited under Governed Reuse Handoff (Commit b97b103)
 * Ported to IIPS under Program BI-02 / BI-03
 *
 * Foundation contracts only: types, the FINAPP→IIPS compatibility boundary
 * and the mapper contract. Adapter implementations (Zerodha/Dhan/Groww), the
 * format detector and the Finapp import service are NOT part of BI-03.
 */
export type {
  BrokerKind,
  FinappHoldingProjection,
  NormalizedBrokerHolding,
} from './types';
export { adaptFinappHoldings } from './compatibility';
export type {
  BrokerExclusionReason,
  BrokerHoldingExclusion,
  BrokerMappingFailureCode,
  BrokerMappingResult,
} from './mapper';
export { mapBrokerOutputToUserHoldings } from './mapper';
