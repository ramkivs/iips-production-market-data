/**
 * Institutional Investment Platform System (IIPS)
 * Domain D06: News & Events Canonical Contract
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 */

import { ValidationResult, ValidationIssue } from './types.js';

export interface NewsEventPayload {
  companyId?: string;
  newsId: string;
  headline: string;
  summary: string;
  publishedAt: string; // ISO-8601 UTC
  category: 'CORPORATE' | 'EARNINGS' | 'REGULATORY' | 'MACRO' | 'MARKET_ROUNDUP';
  sentimentScore: number; // Normalized -1.0 to +1.0
  relevanceScore: number; // Normalized 0.0 to 1.0
  sourcePublisher: string; // Governed sanitized publisher name
  tags: string[];
}

export function validateNewsEvent(payload: NewsEventPayload): ValidationResult {
  const errors: ValidationIssue[] = [];
  const anomalyCodes: string[] = [];

  if (!payload.newsId) {
    errors.push({ field: 'newsId', code: 'MISSING_MANDATORY_FIELD', message: 'newsId is required', severity: 'CRITICAL' });
    anomalyCodes.push('MISSING_MANDATORY_FIELD');
  }
  if (!payload.headline) {
    errors.push({ field: 'headline', code: 'MISSING_MANDATORY_FIELD', message: 'headline is required', severity: 'CRITICAL' });
    anomalyCodes.push('MISSING_MANDATORY_FIELD');
  }
  if (isNaN(Date.parse(payload.publishedAt))) {
    errors.push({ field: 'publishedAt', code: 'STRUCTURAL_MALFORMATION', message: 'publishedAt must be valid ISO-8601', severity: 'CRITICAL' });
    anomalyCodes.push('STRUCTURAL_MALFORMATION');
  }
  if (payload.sentimentScore < -1.0 || payload.sentimentScore > 1.0) {
    errors.push({ field: 'sentimentScore', code: 'OUT_OF_RANGE_VALUE', message: 'sentimentScore must be between -1.0 and 1.0', severity: 'CRITICAL' });
    anomalyCodes.push('OUT_OF_RANGE_VALUE');
  }
  if (payload.relevanceScore < 0.0 || payload.relevanceScore > 1.0) {
    errors.push({ field: 'relevanceScore', code: 'OUT_OF_RANGE_VALUE', message: 'relevanceScore must be between 0.0 and 1.0', severity: 'CRITICAL' });
    anomalyCodes.push('OUT_OF_RANGE_VALUE');
  }

  const isValid = errors.length === 0;
  return {
    isValid,
    quality: isValid ? 'GOOD' : 'UNAVAILABLE',
    errors,
    anomalyCodes,
  };
}
