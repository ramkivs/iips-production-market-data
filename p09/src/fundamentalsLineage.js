/**
 * P09-04 — FUNDAMENTALS LINEAGE AND PROVIDER ABSTRACTION
 *
 * ── Authority ──────────────────────────────────────────────────────────────────────────────
 *   TRACKER `Work Tracker`!P09: Minimum evidence *Fundamentals lineage*.
 *
 *   `D4_02_DATA_DOMAINS.md` §D.4:
 *     *"Market-data-sourced fundamentals arrive namespaced (AD-16) and are explicitly mapped
 *      into engine input keys — never merged by name coincidence."*
 *
 *   `P01_DATA_CONTRACT.md` §3.1:
 *     Complete lineage block required: sourceRef, adapterId, adapterVersion,
 *     transformationChainRef, receivedAt, namespaceVersion.
 *
 * ── Lineage model ──────────────────────────────────────────────────────────────────────────
 *   Fundamentals lineage tracks:
 *     1. **Source** — where the data came from (provider, filing, document)
 *     2. **Adapter** — which adapter processed it (id, version)
 *     3. **Transformation** — what transformations were applied (chain reference)
 *     4. **Metric-code namespace** — the frozen engine metric codes that the data maps to
 *     5. **Provider abstraction** — provider-native shapes are behind the P02 data-plane
 *
 *   ⚠ **FL-1** Lineage is COMPLETE — no field may lack a provenance reference (RF-7).
 *   ⚠ **FL-2** Provider-native data shapes are behind the P02 data-plane abstraction.
 *   ⚠ **FL-3** Metric-code namespace is FROZEN — no new engine key may be invented (D4_02).
 *   ⚠ **FL-4** Provider identity is preserved — never flattened (RI-3, PN-5).
 *   ⚠ **FL-5** Lineage is IMMUTABLE — once recorded, never modified (L-1).
 *   ⚠ **FL-6** No provider execution, credentials, entitlements or connectivity.
 *
 * ── Boundaries (hard) ──────────────────────────────────────────────────────────────────────
 *   ⚠ **NOT P11.** No engine-input mapping. Engine mapping is P11 (N-5).
 *   ⚠ **NOT P02.** No provider adapter implementation. P02 is the abstraction contract.
 *   ⚠ **NOT P06.** No normalization pipeline execution. P06 owns normalization.
 *   ⚠ **No wall clock, no randomness, no ambient input.**
 *   ⚠ **No acceptance, no certification, no production activation.**
 *
 * ── Reuse, not duplication ─────────────────────────────────────────────────────────────────
 *   ⚠ `NAMESPACE_VERSION` imported from `p05/src/namespace.js`.
 *   ⚠ `canonicalDigest` imported from `p05/src/serialize.js`.
 */

import { NAMESPACE_VERSION } from '../../p05/src/namespace.js';
import { canonicalDigest, assertIsoUtc, ContractViolation } from '../../p05/src/serialize.js';

export const P09_04_MODULE = 'P09-04-FUNDAMENTALS-LINEAGE';

/**
 * FL-3 — The frozen metric-code namespace from D4_02 §D.4.
 * 52 coded keys (7 sector engines × ~8 keys each) + 54 free-form keys (6 engines).
 * This is a DECLARATION, not an implementation. P11 owns the actual mapping.
 *
 * Coded namespaces (D4_02):
 *   BM-* Banking (8) · IM-* Insurance (8) · CM-* Capital Markets (7)
 *   HC-* Healthcare (5) · TL-* Telecom (8) · AU-* Auto (8) · MM-* Materials (8)
 *
 * Free-form collision surface (D4_02):
 *   id(6), ebitdaMargin(6), debtEbitda(6), revenueGrowth(5), fcfYield(4),
 *   segment(3), businessModel, roic, roce, evEbitda, peRatio, subsegment, archetype
 */
export const CODED_NAMESPACE_PREFIXES = Object.freeze([
  'BM', 'IM', 'CM', 'HC', 'TL', 'AU', 'MM',
]);

export const FREE_FORM_COLLISION_KEYS = Object.freeze([
  'id', 'ebitdaMargin', 'debtEbitda', 'revenueGrowth', 'fcfYield',
  'segment', 'businessModel', 'roic', 'roce', 'evEbitda', 'peRatio',
  'subsegment', 'archetype',
]);

/**
 * FL-1 — Build a complete fundamentals lineage block.
 *
 * @param {object} args
 * @param {string} args.sourceRef           reference to the source filing/document
 * @param {string} args.adapterId           adapter identifier
 * @param {string} args.adapterVersion      adapter version (MAJOR.MINOR)
 * @param {string} args.transformationChainRef  reference to the transformation chain
 * @param {string} args.receivedAt          ISO-8601 UTC — when the data was received
 * @param {string} [args.namespaceVersion]  defaults to NAMESPACE_VERSION
 * @param {string} [args.providerSchemaVersion]  provider-native schema version
 * @param {string} [args.filingRef]         reference to the specific filing
 * @param {string} [args.governanceClassification]  AD-11 governance classification
 * @returns {Readonly<Record<string, unknown>>}
 */
export function buildFundamentalsLineage(args) {
  const {
    sourceRef, adapterId, adapterVersion, transformationChainRef,
    receivedAt, namespaceVersion = NAMESPACE_VERSION,
    providerSchemaVersion, filingRef, governanceClassification,
  } = args;

  // FL-1 — all required fields
  if (typeof sourceRef !== 'string' || sourceRef.length === 0) {
    throw new ContractViolation(['FL-1', 'RF-6', 'LN-1'],
      'sourceRef is required for fundamentals lineage', { sourceRef });
  }
  if (typeof adapterId !== 'string' || adapterId.length === 0) {
    throw new ContractViolation(['FL-1', 'RF-6', 'LN-1'],
      'adapterId is required for fundamentals lineage', { adapterId });
  }
  if (typeof adapterVersion !== 'string' || adapterVersion.length === 0) {
    throw new ContractViolation(['FL-1', 'RF-6', 'LN-1'],
      'adapterVersion is required for fundamentals lineage', { adapterVersion });
  }
  if (typeof transformationChainRef !== 'string' || transformationChainRef.length === 0) {
    throw new ContractViolation(['FL-1', 'RF-6', 'LN-1'],
      'transformationChainRef is required for fundamentals lineage',
      { transformationChainRef });
  }

  assertIsoUtc(receivedAt, 'lineage receivedAt');

  return Object.freeze({
    sourceRef,
    adapterId,
    adapterVersion,
    transformationChainRef,
    receivedAt,
    namespaceVersion,
    ...(providerSchemaVersion !== undefined ? { providerSchemaVersion } : {}),
    ...(filingRef !== undefined ? { filingRef } : {}),
    ...(governanceClassification !== undefined ? { governanceClassification } : {}),
    module: P09_04_MODULE,
  });
}

/**
 * FL-2 — Build a provider abstraction record.
 * Provider-native data shapes are behind the P02 data-plane abstraction.
 *
 * @param {object} args
 * @param {string} args.provider           provider identity
 * @param {string} args.providerKind       'LOCAL_FIXTURE' (D9 N-1)
 * @param {string} args.providerSchemaVersion  provider-native schema version
 * @param {string} args.providerDocumentRef    reference to the provider-native document
 * @param {Record<string, unknown>} [args.providerMetadata]  additional provider metadata
 * @returns {Readonly<Record<string, unknown>>}
 */
export function buildProviderAbstraction(args) {
  const {
    provider, providerKind, providerSchemaVersion,
    providerDocumentRef, providerMetadata,
  } = args;

  // FL-4 — provider identity preserved
  if (typeof provider !== 'string' || provider.length === 0) {
    throw new ContractViolation(['FL-4', 'PN-5'],
      'provider identity is required — never flattened', { provider });
  }

  // FL-6 — no live provider execution
  if (providerKind !== 'LOCAL_FIXTURE') {
    throw new ContractViolation(['FL-6'],
      `providerKind '${providerKind}' is not LOCAL_FIXTURE — live provider execution is NOT AUTHORIZED`,
      { providerKind });
  }

  return Object.freeze({
    provider,
    providerKind,
    providerSchemaVersion,
    ...(providerDocumentRef !== undefined ? { providerDocumentRef } : {}),
    ...(providerMetadata !== undefined ? { providerMetadata: Object.freeze({ ...providerMetadata }) } : {}),
    module: P09_04_MODULE,
  });
}

/**
 * FL-3 — Declare a metric-code mapping from canonical fundamentals to engine input keys.
 * This is a DECLARATION only — execution is P11.
 *
 * @param {object} args
 * @param {string} args.mappingId          unique mapping identifier
 * @param {string} args.mappingVersion     mapping version
 * @param {string} args.engineId           target engine identifier
 * @param {Array<{canonicalKey: string, engineKey: string, sectorNamespace: string}>} args.entries
 * @returns {Readonly<Record<string, unknown>>}
 */
export function declareMetricCodeMapping(args) {
  const { mappingId, mappingVersion, engineId, entries } = args;

  if (typeof mappingId !== 'string' || mappingId.length === 0) {
    throw new ContractViolation(['FL-3'], 'mappingId is required', { mappingId });
  }
  if (typeof engineId !== 'string' || engineId.length === 0) {
    throw new ContractViolation(['FL-3'], 'engineId is required', { engineId });
  }
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new ContractViolation(['FL-3'], 'entries must be a non-empty array', { entries });
  }

  const violations = [];

  for (const entry of entries) {
    // FL-3 — engine key must be in the frozen namespace
    if (typeof entry.engineKey !== 'string' || entry.engineKey.length === 0) {
      violations.push(`FL-3: engineKey is required for entry`);
      continue;
    }

    // FL-3 — sector namespace must be in the coded set
    if (!CODED_NAMESPACE_PREFIXES.includes(entry.sectorNamespace)) {
      // Free-form keys don't have a sector namespace — they use the collision keys
      if (!FREE_FORM_COLLISION_KEYS.includes(entry.engineKey)) {
        violations.push(
          `FL-3: sectorNamespace '${entry.sectorNamespace}' is not in the coded set ` +
          `and engineKey '${entry.engineKey}' is not a free-form collision key`
        );
      }
    }

    // N-5 — canonical key must be namespaced
    if (typeof entry.canonicalKey !== 'string' || !entry.canonicalKey.startsWith('MD:')) {
      violations.push(
        `N-5: canonicalKey '${entry.canonicalKey}' must carry the MD: namespace`
      );
    }
  }

  if (violations.length > 0) {
    throw new ContractViolation(['FL-3', 'N-5'],
      `metric-code mapping has ${violations.length} violation(s): ${violations.join('; ')}`,
      { violations });
  }

  return Object.freeze({
    mappingId,
    mappingVersion,
    engineId,
    entries: Object.freeze(entries.map((e) => Object.freeze({ ...e }))),
    entryCount: entries.length,
    digest: canonicalDigest(entries),
    module: P09_04_MODULE,
  });
}

/**
 * FL-1 — Verify that a lineage block is complete.
 *
 * @param {Record<string, unknown>} lineage
 * @returns {Readonly<Record<string, unknown>>}
 */
export function verifyLineageComplete(lineage) {
  const required = [
    'sourceRef', 'adapterId', 'adapterVersion',
    'transformationChainRef', 'receivedAt', 'namespaceVersion',
  ];

  const missing = required.filter((k) => lineage?.[k] === undefined);

  return Object.freeze({
    complete: missing.length === 0,
    missing: Object.freeze(missing),
    present: Object.freeze(required.filter((k) => lineage?.[k] !== undefined)),
    module: P09_04_MODULE,
  });
}

/**
 * FL-5 — Compute a lineage digest for immutability verification.
 *
 * @param {Record<string, unknown>} lineage
 * @returns {string}
 */
export function lineageDigest(lineage) {
  return canonicalDigest(lineage);
}
