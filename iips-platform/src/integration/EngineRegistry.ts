/**
 * IIPS v3.0 — E2E-025 Engine Integration — Certified Engine Registry (read-only, frozen)
 *
 * Governed registry: 13 registered sector engines after Gate B adoption — the 10
 * Program v1.1 LTS engines (IES-006…015) plus IES-016 / IES-017 / IES-020 adopted into
 * B1 under RAMKI authority `b1-three-engine-a1-adoption-2026-09-25-001` (Gate B).
 * This file is the single source for engine ↔ IES ↔ sectorFamily ↔ capabilities
 * used by the EngineApiAdapter, the HTTP adapter, and the frontend API client.
 *
 * Frozen semantics: no engine identity is fabricated. Every entry corresponds to
 * a freeze-manifest + final-readiness-certificate + replay-baseline entry.
 * Adding a new sector requires a new freeze manifest and certification — it is a
 * governance event, never a coding shortcut (see IIPS_v3.0_ENGINE_INTEGRATION_DISCOVERY.md
 * authority block). The three Gate B engines carry HISTORICAL A1 LINEAGE (phase13-next)
 * and are B1 ADOPTION PENDING CERTIFICATION (Gate C): they are NOT B1-certified and no
 * A1 certification is transferred. See `getCertificationLineage`.
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
import { TELECOMMUNICATIONS_ENGINE_ID } from '../sector-engines/telecommunications/TelecommunicationsEngine';
import { AUTOMOBILE_ENGINE_ID } from '../sector-engines/automobile/AutomobileEngine';
import { MATERIALS_METALS_ENGINE_ID } from '../sector-engines/materials-metals/MaterialsMetalsEngine';

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
 * The 13 registered engines — frozen list: the 10 Program v1.1 LTS engines (IES-006…015,
 * order and values unchanged) followed by the 3 Gate B adopted engines (IES-016, IES-017,
 * IES-020). The exported name is retained for compatibility; membership is registration,
 * not a B1 certification claim (see `getCertificationLineage`).
 * Values mirror the freeze manifests (IES-006…015; ies-016/017/020 packs) and
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
  // ── GATE B (b1-three-engine-a1-adoption-2026-09-25-001): B1 three-engine adoption.
  // Historical A1 lineage (phase13-next) / B1 adoption pending certification — NOT B1-certified.
  // readinessCertificate = the existing A2 readiness certificates (unmodified).
  {
    engineId: TELECOMMUNICATIONS_ENGINE_ID,
    ies: 'IES-016',
    iesTitle: 'Telecommunications Sector Engine',
    sectorFamily: 'Telecommunications',
    engineVersion: '1.0.0',
    secVersion: '1.0',
    semcVersion: '1.0',
    calibrationProfile: 'telecommunications-calibration-1.0.0',
    calibrationVersion: '1.0.0',
    contractVersion: 'IES-016 v1.0 (D16)',
    capabilities: ['metrics', 'scoring', 'calibration', 'decision', 'evidence', 'ontology'],
    ontologyDimensions: 8,
    freezeManifest: 'ies-016-telecommunications/IES-016_FREEZE_MANIFEST.json',
    readinessCertificate: 'iips-platform/IES016_FINAL_READINESS_CERTIFICATE.md',
  },
  {
    engineId: AUTOMOBILE_ENGINE_ID,
    ies: 'IES-017',
    iesTitle: 'Automobile Sector Engine',
    sectorFamily: 'Automobile',
    engineVersion: '1.0.0',
    secVersion: '1.0',
    semcVersion: '1.0',
    calibrationProfile: 'automobile-calibration-1.0.0',
    calibrationVersion: '1.0.0',
    contractVersion: 'IES-017 v1.0 (D17)',
    capabilities: ['metrics', 'scoring', 'calibration', 'decision', 'evidence', 'ontology'],
    ontologyDimensions: 8,
    freezeManifest: 'ies-017-automobile/IES-017_FREEZE_MANIFEST.json',
    readinessCertificate: 'iips-platform/IES017_FINAL_READINESS_CERTIFICATE.md',
  },
  {
    engineId: MATERIALS_METALS_ENGINE_ID,
    ies: 'IES-020',
    iesTitle: 'Materials & Metals Sector Engine',
    sectorFamily: 'Materials & Metals',
    engineVersion: '1.0.0',
    secVersion: '1.0',
    semcVersion: '1.0',
    calibrationProfile: 'materials-metals-calibration-1.0.0',
    calibrationVersion: '1.0.0',
    contractVersion: 'IES-020 v1.0 (D20)',
    capabilities: ['metrics', 'scoring', 'calibration', 'decision', 'evidence', 'ontology'],
    ontologyDimensions: 8,
    freezeManifest: 'ies-020-materials-metals/IES-020_FREEZE_MANIFEST.json',
    readinessCertificate: 'iips-platform/IES020_FINAL_READINESS_CERTIFICATE.md',
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

/**
 * GATE B — certification-lineage distinction (RAMKI Decision 5). The registry is 13 engines,
 * but they do NOT share one certification lineage:
 *   - IES-006…015: 'Program v1.1 LTS' (the lineage recorded by this frozen registry);
 *   - IES-016 / IES-017 / IES-020: 'historical A1 lineage / B1 adoption pending certification'.
 * Historical A1 certification remains anchored to phase13-next and is NOT transferred into B1;
 * B1 certification of the three is pending Gate C. Unknown engines fail closed (throw).
 */
export type CertificationLineage =
  | 'Program v1.1 LTS'
  | 'historical A1 lineage / B1 adoption pending certification';

export const B1_CERTIFIED_ENGINES: readonly string[] = Object.freeze([
  TELECOMMUNICATIONS_ENGINE_ID,
  AUTOMOBILE_ENGINE_ID,
  MATERIALS_METALS_ENGINE_ID,
]);

export const B1_CERTIFICATION_ID =
  'B1-CERT-IES016-IES017-IES020-2026-09-25-001';

export const B1_CERTIFICATION_DISCLOSURE =
  'CERTIFIED — WITH RECORDED PERMANENT QUALIFICATIONS';

export function getCertificationDisclosure(
  engineId: string,
): {
  readonly status: 'CERTIFIED';
  readonly certificateId: string;
  readonly disclosure: 'CERTIFIED — WITH RECORDED PERMANENT QUALIFICATIONS';
} | undefined {
  if (!B1_CERTIFIED_ENGINES.includes(engineId)) {
    return undefined;
  }

  return {
    status: 'CERTIFIED',
    certificateId: B1_CERTIFICATION_ID,
    disclosure: B1_CERTIFICATION_DISCLOSURE,
  };
}

export const B1_ADOPTION_PENDING_CERTIFICATION: readonly string[] = Object.freeze([
  TELECOMMUNICATIONS_ENGINE_ID,
  AUTOMOBILE_ENGINE_ID,
  MATERIALS_METALS_ENGINE_ID,
]);

export function getCertificationLineage(engineId: string): CertificationLineage {
  if (!isCertifiedEngine(engineId)) {
    throw new Error(`unregistered-engine: ${engineId} is not a registered engine`);
  }
  if (B1_ADOPTION_PENDING_CERTIFICATION.includes(engineId)) {
    return 'historical A1 lineage / B1 adoption pending certification';
  }
  return 'Program v1.1 LTS';
}
