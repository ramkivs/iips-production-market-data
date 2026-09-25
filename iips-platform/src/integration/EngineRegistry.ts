/**
 * IIPS v3.0 — E2E-025 Engine Integration — Certified Engine Registry (read-only, frozen)
 *
 * Governed registry mapping the 10 Program v1.1 LTS certified sector engines.
 * This file is the single source for engine ↔ IES ↔ sectorFamily ↔ capabilities
 * used by the EngineApiAdapter, the HTTP adapter, and the frontend API client.
 *
 * Frozen semantics: no engine identity is fabricated. Every entry corresponds to
 * a freeze-manifest + final-readiness-certificate + replay-baseline entry.
 * Adding a new sector (e.g. IES-016 Telecom, IES-020 Materials) requires a new
 * freeze manifest and certification — it is a governance event, never a coding
 * shortcut (see IIPS_v3.0_ENGINE_INTEGRATION_DISCOVERY.md authority block).
 */

import { BANKING_ENGINE_ID } from '../sector-engines/banking/BankingEngine';
import { INSURANCE_ENGINE_ID } from '../sector-engines/insurance/InsuranceEngine';
import { CAPITAL_MARKETS_ENGINE_ID } from '../sector-engines/capital-markets/CapitalMarketsEngine';
import { HEALTHCARE_ENGINE_ID } from '../sector-engines/healthcare/HealthcareEngine';
import { HOSPITALITY_ENGINE_ID } from '../sector-engines/hospitality/HospitalityEngine';
import { ENERGY_ENGINE_ID } from '../sector-engines/energy/EnergyEngine';
import { UTILITIES_ENGINE_ID } from '../sector-engines/utilities/UtilitiesEngine';
import { CONSUMER_ENGINE_ID } from '../sector-engines/consumer/ConsumerEngine';
import { INDUSTRIALS_ENGINE_ID } from '../sector-engines/industrials/IndustrialsEngine';
import { TECHNOLOGY_ENGINE_ID } from '../sector-engines/technology/TechnologyEngine';

export interface EngineRegistryEntry {
  readonly engineId: string;
  readonly ies: string;
  readonly iesTitle: string;
  readonly sectorFamily: string;
  readonly engineVersion: string;
  readonly secVersion: string;
  readonly semcVersion: string;
  readonly calibrationProfile: string;
  readonly calibrationVersion: string;
  readonly contractVersion: string;
  readonly capabilities: readonly string[];
  readonly ontologyDimensions: 8;
  readonly freezeManifest: string;
  readonly readinessCertificate: string;
}

/**
 * The 10 Program v1.1 LTS certified engines — frozen list.
 * Values mirror the freeze manifests (IES-006…015) and
 * program-v1.1-certification/PROGRAM_v1.1_REPLAY_BASELINE.json.
 */
export const CERTIFIED_ENGINES: readonly EngineRegistryEntry[] = [
  {
    engineId: BANKING_ENGINE_ID,
    ies: 'IES-006',
    iesTitle: 'Banking Sector Engine',
    sectorFamily: 'Banking',
    engineVersion: '1.0.0',
    secVersion: '1.0',
    semcVersion: '1.0',
    calibrationProfile: 'banking-calibration-1.0.0',
    calibrationVersion: '1.0.0',
    contractVersion: 'IES-006 v1.0',
    capabilities: ['metrics', 'scoring', 'calibration', 'decision', 'evidence'],
    ontologyDimensions: 8,
    freezeManifest: 'iips-platform — IES-006 v1.0 (banking)',
    readinessCertificate: 'program-v1.1-certification (Banking)',
  },
  {
    engineId: INSURANCE_ENGINE_ID,
    ies: 'IES-007',
    iesTitle: 'Insurance Sector Engine',
    sectorFamily: 'Insurance',
    engineVersion: '1.0.0',
    secVersion: '1.0',
    semcVersion: '1.0',
    calibrationProfile: 'insurance-calibration-1.0.0',
    calibrationVersion: '1.0.0',
    contractVersion: 'IES-007 v1.0',
    capabilities: ['metrics', 'scoring', 'calibration', 'decision', 'evidence'],
    ontologyDimensions: 8,
    freezeManifest: 'iips-platform — IES-007 v1.0 (insurance)',
    readinessCertificate: 'program-v1.1-certification (Insurance)',
  },
  {
    engineId: CAPITAL_MARKETS_ENGINE_ID,
    ies: 'IES-008',
    iesTitle: 'Capital Markets Sector Engine',
    sectorFamily: 'Capital Markets',
    engineVersion: '1.0.0',
    secVersion: '1.0',
    semcVersion: '1.0',
    calibrationProfile: 'capital-markets-calibration-1.0.0',
    calibrationVersion: '1.0.0',
    contractVersion: 'IES-008 v1.0',
    capabilities: ['metrics', 'scoring', 'calibration', 'decision', 'evidence'],
    ontologyDimensions: 8,
    freezeManifest: 'iips-platform — IES-008 v1.0 (capital-markets)',
    readinessCertificate: 'program-v1.1-certification (Capital Markets)',
  },
  {
    engineId: HEALTHCARE_ENGINE_ID,
    ies: 'IES-009',
    iesTitle: 'Healthcare Sector Engine',
    sectorFamily: 'Healthcare',
    engineVersion: '1.0.0',
    secVersion: '1.0',
    semcVersion: '1.0',
    calibrationProfile: 'healthcare-calibration-1.0.0',
    calibrationVersion: '1.0.0',
    contractVersion: 'IES-009 v1.0',
    capabilities: ['metrics', 'scoring', 'calibration', 'decision', 'evidence'],
    ontologyDimensions: 8,
    freezeManifest: 'iips-platform — IES-009 v1.0 (healthcare)',
    readinessCertificate: 'program-v1.1-certification (Healthcare)',
  },
  {
    engineId: HOSPITALITY_ENGINE_ID,
    ies: 'IES-010',
    iesTitle: 'Hospitality Sector Engine',
    sectorFamily: 'Hospitality',
    engineVersion: '1.0.0',
    secVersion: '1.0',
    semcVersion: '1.0',
    calibrationProfile: 'hospitality-calibration-1.0.0',
    calibrationVersion: '1.0.0',
    contractVersion: 'IES-010 v1.0',
    capabilities: ['metrics', 'scoring', 'calibration', 'decision', 'evidence', 'ontology'],
    ontologyDimensions: 8,
    freezeManifest: 'ies-010-hospitality/IES-010_FREEZE_MANIFEST.json',
    readinessCertificate: 'iips-platform/IES010_FINAL_READINESS_CERTIFICATE.md',
  },
  {
    engineId: ENERGY_ENGINE_ID,
    ies: 'IES-011',
    iesTitle: 'Energy Sector Engine',
    sectorFamily: 'Energy',
    engineVersion: '1.0.0',
    secVersion: '1.0',
    semcVersion: '1.0',
    calibrationProfile: 'energy-calibration-1.0.0',
    calibrationVersion: '1.0.0',
    contractVersion: 'IES-011 v1.0',
    capabilities: ['metrics', 'scoring', 'calibration', 'decision', 'evidence', 'ontology'],
    ontologyDimensions: 8,
    freezeManifest: 'ies-011-energy/IES-011_FREEZE_MANIFEST.json',
    readinessCertificate: 'iips-platform/IES011_FINAL_READINESS_CERTIFICATE.md',
  },
  {
    engineId: UTILITIES_ENGINE_ID,
    ies: 'IES-012',
    iesTitle: 'Utilities Sector Engine',
    sectorFamily: 'Utilities',
    engineVersion: '1.0.0',
    secVersion: '1.0',
    semcVersion: '1.0',
    calibrationProfile: 'utilities-calibration-1.0.0',
    calibrationVersion: '1.0.0',
    contractVersion: 'IES-012 v1.0',
    capabilities: ['metrics', 'scoring', 'calibration', 'decision', 'evidence', 'ontology'],
    ontologyDimensions: 8,
    freezeManifest: 'ies-012-utilities/IES-012_FREEZE_MANIFEST.json',
    readinessCertificate: 'iips-platform/IES012_FINAL_READINESS_CERTIFICATE.md',
  },
  {
    engineId: CONSUMER_ENGINE_ID,
    ies: 'IES-013',
    iesTitle: 'Consumer Sector Engine',
    sectorFamily: 'Consumer',
    engineVersion: '1.0.0',
    secVersion: '1.0',
    semcVersion: '1.0',
    calibrationProfile: 'consumer-calibration-1.0.0',
    calibrationVersion: '1.0.0',
    contractVersion: 'IES-013 v1.0',
    capabilities: ['metrics', 'scoring', 'calibration', 'decision', 'evidence', 'ontology'],
    ontologyDimensions: 8,
    freezeManifest: 'ies-013-consumer/IES-013_FREEZE_MANIFEST.json',
    readinessCertificate: 'iips-platform/IES013_FINAL_READINESS_CERTIFICATE.md',
  },
  {
    engineId: INDUSTRIALS_ENGINE_ID,
    ies: 'IES-014',
    iesTitle: 'Industrials Sector Engine',
    sectorFamily: 'Industrials',
    engineVersion: '1.0.0',
    secVersion: '1.0',
    semcVersion: '1.0',
    calibrationProfile: 'industrials-calibration-1.0.0',
    calibrationVersion: '1.0.0',
    contractVersion: 'IES-014 v1.2 (D15)',
    capabilities: ['metrics', 'scoring', 'calibration', 'decision', 'evidence', 'ontology'],
    ontologyDimensions: 8,
    freezeManifest: 'ies-014-industrials/IES-014_FREEZE_MANIFEST.json',
    readinessCertificate: 'iips-platform/IES014_FINAL_READINESS_CERTIFICATE.md',
  },
  {
    engineId: TECHNOLOGY_ENGINE_ID,
    ies: 'IES-015',
    iesTitle: 'Technology Sector Engine',
    sectorFamily: 'Technology',
    engineVersion: '1.0.0',
    secVersion: '1.0',
    semcVersion: '1.0',
    calibrationProfile: 'technology-calibration-1.0.0',
    calibrationVersion: '1.0.0',
    contractVersion: 'IES-015 v1.3 (D15)',
    capabilities: ['metrics', 'scoring', 'calibration', 'decision', 'evidence', 'ontology'],
    ontologyDimensions: 8,
    freezeManifest: 'ies-015-technology/IES-015_FREEZE_MANIFEST.json',
    readinessCertificate: 'iips-platform/IES015_FINAL_READINESS_CERTIFICATE.md',
  },
] as const;

export function isCertifiedEngine(engineId: string): boolean {
  return CERTIFIED_ENGINES.some((e) => e.engineId === engineId);
}

export function getEngineEntry(engineId: string): EngineRegistryEntry | undefined {
  return CERTIFIED_ENGINES.find((e) => e.engineId === engineId);
}

export function getIesForEngine(engineId: string): string | undefined {
  return getEngineEntry(engineId)?.ies;
}

export function getEngineForSector(sectorFamily: string): EngineRegistryEntry | undefined {
  return CERTIFIED_ENGINES.find(
    (e) => e.sectorFamily.toLowerCase() === sectorFamily.toLowerCase(),
  );
}

/**
 * Taxonomy-resolved sectors that are NOT separate engines (prompt §1).
 * Resolution is authority-driven; this helper guards against accidentally
 * creating a new engine for one of these sectors.
 */
export const TAXONOMY_RESOLVED: Readonly<Record<string, string>> = {
  // Prompt §1: IT → IES-015 Technology, Chemicals → IES-014 Industrials, Realty → IES-015 Technology
  // Realty mapping is per prompt directive (even though cross-sector docs list Real Estate separately).
  IT: 'IES-015 Technology (sector.technology)',
  Chemicals: 'IES-014 Industrials (sector.industrials)',
  Realty: 'IES-015 Technology (sector.technology)',
  'Real Estate': 'IES-015 Technology (sector.technology) — prompt-resolved',
};

export function assertNotTaxonomyResolved(requestedSector: string): void {
  const resolved = TAXONOMY_RESOLVED[requestedSector];
  if (resolved) {
    throw new Error(
      `Taxonomy-resolved sector: ${requestedSector} resolves into ${resolved}. ` +
        `Do not create a separate engine — see discovery authority block.`,
    );
  }
}
