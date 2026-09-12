/**
 * P14 test helpers — shared fixtures and factory functions for P14 validation.
 */
import { buildDataProvenance } from '../../p12/src/dataProvenanceDto.js';

export const PROVIDER = 'LocalFixture';
export const DATA_VERSION = 'v1';
export const AS_OF = '2026-09-13T10:00:00.000Z';
export const RECEIVED_AT = '2026-09-13T10:00:01.000Z';
export const TENANT_ID = 'tenant-001';

/**
 * Build a valid governed provenance for P14 testing.
 */
export function p14Provenance(overrides = {}) {
  return buildDataProvenance({
    dataSource: 'governed:D03',
    freshness: 'SNAPSHOT',
    calibratedAt: AS_OF,
    transportSemantics: 'canonical-snapshot',
    asOf: AS_OF,
    receivedAt: RECEIVED_AT,
    dataVersion: DATA_VERSION,
    mode: 'SNAPSHOT',
    quality: 'good',
    completenessPct: 100,
    contributingSnapshotIds: ['snap-001'],
    classification: 'REAL',
    ...overrides,
  });
}

/**
 * Build a minimal valid view model for P14 testing.
 */
export function p14ViewModel(surfaceId, overrides = {}) {
  const provenance = p14Provenance();
  return {
    surfaceId,
    provenance,
    asOfDisplay: { label: 'As of', value: AS_OF },
    degradationDisplay: {
      label: 'Current',
      severity: 'normal',
      a11yLabel: 'Data quality: Current',
    },
    provenanceBadge: {
      label: 'REAL',
      a11yLabel: 'Provenance: Real — governed market-data provider',
    },
    a11y: {
      role: 'region',
      label: `${surfaceId} surface`,
      description: `${surfaceId} view model for P14 testing`,
    },
    ...overrides,
  };
}

/**
 * Build a view model with degraded quality for testing.
 */
export function p14DegradedViewModel(surfaceId, quality = 'stale') {
  const provenance = p14Provenance({ quality, completenessPct: 80 });
  return p14ViewModel(surfaceId, {
    provenance,
    degradationDisplay: {
      label: quality === 'stale' ? 'Stale — data may be outdated' : 'Partial — some data missing',
      severity: 'warning',
      a11yLabel: `Data quality: ${quality}`,
    },
  });
}

/**
 * Build all 19 P13 surface view models for comprehensive testing.
 */
export function buildAllSurfaceViewModels() {
  const surfaces = [
    'UI01', 'UI02', 'UI03', 'UI04', 'UI05', 'UI06', 'UI07',
    'UI08', 'UI09', 'UI10', 'UI11', 'UI12', 'UI13', 'UI14',
    'UI15', 'UI16', 'UI17', 'UI18', 'UI19',
  ];

  return surfaces.map(id => ({
    surfaceId: id,
    viewModel: p14ViewModel(id),
  }));
}
