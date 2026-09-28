/**
 * Institutional Investment Platform System (IIPS)
 * Canonical Envelope & Validation Engine (P01-01 / P01-04)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 */

import { DataDomain, OperatingMode, ValidationResult } from './types.js';
import { DataProvenanceDTO } from './provenance.js';

export interface CanonicalEnvelope<T> {
  envelopeId: string;
  domain: DataDomain;
  mode: OperatingMode;
  companyId: string;
  /**
   * IU-1 additive: series-aware security identity, carried verbatim from
   * `D114SecurityIdentity.securityId` (grammar `ISIN:<isin>:<series>`) when the
   * payload carries one.
   *
   * Optional at the type level so every existing producer and consumer remains
   * source-compatible. Envelopes without a series-aware identity are unchanged
   * and keep their existing PIT identity. `companyId` is NOT repurposed for this
   * identity — it remains the company/resource key.
   */
  securityId?: string;
  payload: T;
  provenance: DataProvenanceDTO;
  timestamp: string; // ISO-8601 UTC
  schemaVersion: string;
}

export function createCanonicalEnvelope<T>(params: {
  envelopeId: string;
  domain: DataDomain;
  mode: OperatingMode;
  companyId: string;
  /**
   * IU-1 additive: optional series-aware security identity
   * (`D114SecurityIdentity.securityId`). Emitted only when supplied, so an
   * envelope built without one keeps exactly its previous shape.
   */
  securityId?: string;
  payload: T;
  provenance: DataProvenanceDTO;
  timestamp?: string;
  schemaVersion?: string;
}): CanonicalEnvelope<T> {
  return {
    envelopeId: params.envelopeId,
    domain: params.domain,
    mode: params.mode,
    companyId: params.companyId,
    ...(params.securityId !== undefined ? { securityId: params.securityId } : {}),
    payload: params.payload,
    provenance: params.provenance,
    timestamp: params.timestamp || new Date().toISOString(),
    schemaVersion: params.schemaVersion || '1.0.0',
  };
}

export function validateEnvelopeStructure<T>(
  envelope: CanonicalEnvelope<T>
): ValidationResult {
  const errors: ValidationResult['errors'] = [];
  const anomalyCodes: string[] = [];

  if (!envelope.envelopeId || typeof envelope.envelopeId !== 'string') {
    errors.push({
      field: 'envelopeId',
      code: 'MISSING_MANDATORY_FIELD',
      message: 'envelopeId is required and must be a string',
      severity: 'CRITICAL',
    });
    anomalyCodes.push('MISSING_MANDATORY_FIELD');
  }

  if (!envelope.domain) {
    errors.push({
      field: 'domain',
      code: 'MISSING_MANDATORY_FIELD',
      message: 'domain is required',
      severity: 'CRITICAL',
    });
    anomalyCodes.push('MISSING_MANDATORY_FIELD');
  }

  if (!['LIVE', 'SNAPSHOT', 'PIT'].includes(envelope.mode)) {
    errors.push({
      field: 'mode',
      code: 'UNRECOGNIZED_ENUM_OR_CODE',
      message: `Invalid operating mode: ${envelope.mode}`,
      severity: 'CRITICAL',
    });
    anomalyCodes.push('UNRECOGNIZED_ENUM_OR_CODE');
  }

  if (!envelope.companyId || typeof envelope.companyId !== 'string') {
    errors.push({
      field: 'companyId',
      code: 'MISSING_MANDATORY_FIELD',
      message: 'companyId is required and must be a string',
      severity: 'CRITICAL',
    });
    anomalyCodes.push('MISSING_MANDATORY_FIELD');
  }

  if (!envelope.provenance) {
    errors.push({
      field: 'provenance',
      code: 'MISSING_MANDATORY_FIELD',
      message: 'provenance block is required',
      severity: 'CRITICAL',
    });
    anomalyCodes.push('MISSING_MANDATORY_FIELD');
  } else {
    if (!envelope.provenance.lineageHash) {
      errors.push({
        field: 'provenance.lineageHash',
        code: 'MISSING_MANDATORY_FIELD',
        message: 'provenance.lineageHash is required',
        severity: 'CRITICAL',
      });
      anomalyCodes.push('MISSING_MANDATORY_FIELD');
    }
  }

  // Validate ISO timestamp
  if (!envelope.timestamp || isNaN(Date.parse(envelope.timestamp))) {
    errors.push({
      field: 'timestamp',
      code: 'STRUCTURAL_MALFORMATION',
      message: 'timestamp must be a valid ISO-8601 string',
      severity: 'CRITICAL',
    });
    anomalyCodes.push('STRUCTURAL_MALFORMATION');
  }

  const isValid = errors.length === 0;
  return {
    isValid,
    quality: isValid ? envelope.provenance?.qualityState || 'GOOD' : 'UNAVAILABLE',
    errors,
    anomalyCodes,
  };
}
