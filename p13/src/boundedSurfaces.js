/**
 * P13 — BOUNDED SURFACES (UI17, UI18, UI19)
 *
 * Authority:
 *   D32 P13 Implementation Authorization (commit 2f131d9)
 *   D4_10_P13_UI_DELTA.md L.2
 *
 *   UI17 ReplayExplorer  — EXTEND: ⚠ AD-17 bounded
 *   UI18 EngineRegistry  — REUSE: ⚠ AD-4 bounded
 *   UI19 AiAdvisory      — ADAPT: ⚠ SYNTHESIZED labelling
 *
 * Boundaries (hard):
 *   ⚠ **BS-1** UI17 MUST NOT assert verified replay/reproduction (AD-17/M-2)
 *   ⚠ **BS-2** UI18 MUST NOT imply AD-4 revalidation has occurred
 *   ⚠ **BS-3** UI19 MUST label output as SYNTHESIZED where specified
 *   ⚠ **BS-4** UI19 MUST NOT alter Existing-IIPS methodology
 *   ⚠ **BS-5** All bounded surfaces carry explicit constraint statements
 */

import {
  assertNoFabricatedProvenance,
  assertSynthesizedLabelled,
  CrossSurfaceViolation,
} from './crossSurfaceRules.js';
import { buildProvenanceView } from './provenanceView.js';
import { AD17_CONSTRAINT } from '../../p12/src/evidenceReplayLinkage.js';

export const P13_BS_MODULE = 'P13-BOUNDED-SURFACES';

/** BS-1: AD-17 constraint for UI17 — carried in every replay view. */
export const UI17_AD17_CONSTRAINT = Object.freeze({
  surface: 'UI17',
  ad17Status: 'UNRESOLVED',
  m2Defect: 'ReplayService returns reproduced/byteIdentical as literals',
  uiConstraint: 'UI MUST NOT assert verified replay or reproduction',
  resolutionGate: 'P15 (E2E Certification)',
});

/** BS-2: AD-4 constraint for UI18 — carried in every engine registry view. */
export const UI18_AD4_CONSTRAINT = Object.freeze({
  surface: 'UI18',
  ad4Status: 'DEFERRED',
  resolutionGate: 'P15 (E2E Certification)',
  uiConstraint: 'UI MUST NOT imply AD-4 revalidation has occurred',
  displayedCertificationStatus: 'REVALIDATION_PENDING',
});

/**
 * UI17 ReplayExplorer — EXTEND (AD-17 bounded).
 *
 * Show data vintage/evidence. MUST NOT assert verified replay/reproduction.
 *
 * @param {object} args
 * @param {Readonly<object>} args.replayLinkage — P12-05 replay linkage DTO
 * @param {Readonly<object>} args.provenance — provenance DTO
 * @param {string} args.tenantId
 * @returns {Readonly<object>}
 */
export function buildReplayExplorerView(args) {
  const { replayLinkage, provenance, tenantId } = args;

  assertNoFabricatedProvenance(provenance);

  // BS-1: MUST NOT assert verified replay
  if (replayLinkage.verifiedReproduction === true) {
    throw new CrossSurfaceViolation(
      ['BS-1', 'AD-17'],
      'UI17: verifiedReproduction=true is prohibited while AD-17/M-2 is UNRESOLVED'
    );
  }

  return Object.freeze({
    surfaceName: 'UI17',
    disposition: 'EXTEND',
    tenantId,
    replayId: replayLinkage.replayId,
    originalExecutionId: replayLinkage.originalExecutionId,
    contributingSnapshotIds: replayLinkage.contributingSnapshotIds,
    dataVersion: replayLinkage.dataVersion,
    asOf: replayLinkage.asOf,
    mode: replayLinkage.mode,

    // BS-1: ReplayService literals carried but NOT verified
    replayServiceLiterals: replayLinkage.replayServiceLiterals,
    verifiedReproduction: false,
    verifiedByteIdentical: false,

    // BS-5: explicit constraint statement
    ad17Constraint: UI17_AD17_CONSTRAINT,
    provenanceView: buildProvenanceView(provenance),
  });
}

/**
 * UI18 EngineRegistry — REUSE (AD-4 bounded).
 *
 * Reflect actual AD-4 revalidation status.
 * MUST NOT imply AD-4 revalidation has occurred.
 *
 * @param {object} args
 * @param {object[]} args.engines — the 13 certified engines
 * @param {Readonly<object>} args.provenance — provenance DTO
 * @param {string} args.tenantId
 * @returns {Readonly<object>}
 */
export function buildEngineRegistryView(args) {
  const { engines, provenance, tenantId } = args;

  assertNoFabricatedProvenance(provenance);

  // BS-2: mark each engine's certification status with AD-4 awareness
  const enginesWithStatus = engines.map((engine) =>
    Object.freeze({
      ...engine,
      // BS-2: certification status reflects AD-4 revalidation state
      _certificationStatus: 'CERTIFIED_REVALIDATION_PENDING',
      _ad4Revalidated: false,
    })
  );

  return Object.freeze({
    surfaceName: 'UI18',
    disposition: 'REUSE',
    tenantId,
    engines: Object.freeze(enginesWithStatus),
    totalEngines: engines.length,

    // BS-2/BS-5: explicit constraint statement
    ad4Constraint: UI18_AD4_CONSTRAINT,
    ad4RevalidationOccurred: false,
    provenanceView: buildProvenanceView(provenance),
  });
}

/**
 * UI19 AiAdvisory — ADAPT (SYNTHESIZED labelling).
 *
 * Label output as SYNTHESIZED where specified.
 * Pin grounding vintage. Do not alter Existing-IIPS methodology.
 *
 * @param {object} args
 * @param {object} args.advisoryContent — the AI advisory output
 * @param {Readonly<object>} args.groundingProvenance — provenance grounding the narrative
 * @param {string} args.tenantId
 * @returns {Readonly<object>}
 */
export function buildAiAdvisoryView(args) {
  const { advisoryContent, groundingProvenance, tenantId } = args;

  assertNoFabricatedProvenance(groundingProvenance);

  // BS-3: advisory narrative is SYNTHESIZED
  const advisoryWithLabel = Object.freeze({
    ...advisoryContent,
    classification: 'SYNTHESIZED',
    isLabelled: true, // BS-3: labelled as SYNTHESIZED
  });

  // BS-3: verify label is present
  assertSynthesizedLabelled(advisoryWithLabel);

  return Object.freeze({
    surfaceName: 'UI19',
    disposition: 'ADAPT',
    tenantId,
    advisory: advisoryWithLabel,

    // BS-3: SYNTHESIZED classification explicit
    narrativeClassification: 'SYNTHESIZED',
    synthesizedLabel: 'AI-generated narrative — not sourced from a governed provider',

    // BS-4: grounding vintage pinned
    groundingVintage: Object.freeze({
      dataVersion: groundingProvenance.dataVersion,
      asOf: groundingProvenance.asOf,
      mode: groundingProvenance.mode,
      classification: groundingProvenance.classification,
    }),

    provenanceView: buildProvenanceView(groundingProvenance),
  });
}
