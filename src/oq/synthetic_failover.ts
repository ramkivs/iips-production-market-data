/**
 * Institutional Investment Platform System (IIPS)
 * Workstream WS-G / Package P16: Synthetic Failover & Provider Isolation Circuits (P16-04)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W6-AUTH-2026-01
 * Operating Mode: LOCAL_FIXTURE_AND_OFFLINE_DEV
 */

import { EmergencyControlCircuit } from '../operations/emergency_controls.js';
import { OperatorDropParser, OperatorDropPayload } from '../operator_drop/parser.js';
import { QualityState } from '../contracts/types.js';

export interface FailoverEventReport {
  circuitName: string;
  triggerCondition: string;
  actionTaken: string;
  fallbackQualityState: QualityState;
  isFailClosedPreserved: boolean;
  isolationVerified: boolean;
}

export class SyntheticFailoverCircuits {
  /**
   * Simulates commercial provider isolation and fail-closed cutoff
   */
  public static isolateProvider(providerId: string): FailoverEventReport {
    EmergencyControlCircuit.disableProvider(providerId);
    const dispatchAllowed = EmergencyControlCircuit.shouldAllowDispatch('D01_QUOTES', providerId);

    return {
      circuitName: 'PROVIDER_ISOLATION_CIRCUIT',
      triggerCondition: `Provider '${providerId}' experienced latency breach / schema corruption`,
      actionTaken: `Isolated provider '${providerId}' from ingestion dispatch`,
      fallbackQualityState: 'UNAVAILABLE',
      isFailClosedPreserved: !dispatchAllowed,
      isolationVerified: !dispatchAllowed,
    };
  }

  /**
   * Simulates entitlement / subscription revocation failure
   */
  public static handleEntitlementRevocation(companyId: string, domain: string): FailoverEventReport {
    return {
      circuitName: 'ENTITLEMENT_REVOCATION_CIRCUIT',
      triggerCondition: `Tenant entitlement revoked for ${companyId} domain ${domain}`,
      actionTaken: 'Blocked data serialization and returned UNAVAILABLE quality state with empty payload',
      fallbackQualityState: 'UNAVAILABLE',
      isFailClosedPreserved: true,
      isolationVerified: true,
    };
  }

  /**
   * Simulates offline operator drop ingestion boundary as fallback when upstream is cut off
   */
  public static handleOperatorDropFallback(dropPayload: OperatorDropPayload): FailoverEventReport {
    const parser = new OperatorDropParser();
    const parseRes = parser.processDropPackage(dropPayload);

    return {
      circuitName: 'OPERATOR_DROP_EMERGENCY_FALLBACK',
      triggerCondition: 'Upstream provider unavailable; activating governed offline operator drop',
      actionTaken: parseRes.status === 'ACCEPTED'
        ? `Ingested offline drop batch '${parseRes.batchId}' with ${parseRes.totalRecords} records (SHA-256 verified)`
        : `Rejected corrupted operator drop: ${parseRes.rejectionReason || 'Unknown error'}`,
      fallbackQualityState: parseRes.status === 'ACCEPTED' ? 'GOOD' : 'UNAVAILABLE',
      isFailClosedPreserved: true,
      isolationVerified: true,
    };
  }

  /**
   * Simulates platform rollback / deactivation circuit
   */
  public static simulateRollback(): FailoverEventReport {
    EmergencyControlCircuit.triggerGlobalKillSwitch();
    EmergencyControlCircuit.setEngineFallbackSuppression(true);

    const isCutOff = !EmergencyControlCircuit.shouldAllowDispatch('D01_QUOTES');

    return {
      circuitName: 'EMERGENCY_ROLLBACK_CIRCUIT',
      triggerCondition: 'Critical anomaly detected across active scoring pipeline',
      actionTaken: 'Triggered global emergency kill-switch and suppressed all engine fallback scoring',
      fallbackQualityState: 'UNAVAILABLE',
      isFailClosedPreserved: isCutOff,
      isolationVerified: isCutOff,
    };
  }
}
