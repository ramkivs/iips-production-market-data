/**
 * P13 — UI13/UI14 RESOLVER SURFACE
 *
 * Authority:
 *   D32 P13 Implementation Authorization (commit 2f131d9)
 *   D4_10_P13_UI_DELTA.md L.2 (UI13: NEW, UI14: NEW)
 *
 * Purpose:
 *   UI13 Global Search and UI14 Command Palette surfaces — consume certified
 *   P12 C7 object-resolution/search contract. Single resolver (U6).
 *
 * Boundaries (hard):
 *   ⚠ **RS-1** Consumes C7 ONLY — does not redefine resolution behavior
 *   ⚠ **RS-2** C7 certification scope is P12 API/DTO Gate only — NOT broadened
 *   ⚠ **RS-3** Single resolver — UI13 and UI14 share the SAME contract (U6)
 *   ⚠ **RS-4** No second/raw-provider resolver
 *   ⚠ **RS-5** P04 identity authority preserved — not reimplemented
 */

import {
  buildResolutionRequest,
  resolveObject,
  executeSearch,
  buildObjectReference,
} from '../../p12/src/objectResolutionContract.js';
import {
  buildUIView,
  assertNoFabricatedProvenance,
  buildAsOfDisplay,
  CrossSurfaceViolation,
} from './crossSurfaceRules.js';
import { buildProvenanceView } from './provenanceView.js';

export const P13_UI13_MODULE = 'P13-UI13-RESOLVER-SURFACE';

/**
 * RS-1/RS-3 — Build a search UI view from a C7 search result.
 *
 * Shared by UI13 (Global Search) and UI14 (Command Palette).
 *
 * @param {object} args
 * @param {Readonly<object>} args.searchResult — result from P12 executeSearch
 * @param {Readonly<object>} args.provenance — P12 provenance DTO
 * @param {'UI13'|'UI14'} args.surface — which surface is consuming
 * @returns {Readonly<object>}
 */
export function buildSearchView(args) {
  const { searchResult, provenance, surface } = args;

  if (surface !== 'UI13' && surface !== 'UI14') {
    throw new CrossSurfaceViolation(
      ['RS-3'],
      `surface '${surface}' is not authorized for the resolver contract — only UI13/UI14`
    );
  }

  assertNoFabricatedProvenance(provenance);
  const provenanceView = buildProvenanceView(provenance);

  return Object.freeze({
    surfaceName: surface,
    disposition: 'NEW',
    query: searchResult.query,
    asOf: searchResult.asOf,
    tenantId: searchResult.tenantId,
    totalMatches: searchResult.totalMatches,
    truncated: searchResult.truncated,
    results: searchResult.results,
    provenanceView,
    // RS-3: both surfaces share the same resolver
    resolverContract: 'P12-C7',
  });
}

/**
 * RS-1/RS-3 — Execute a search and build UI view.
 *
 * @param {object} args
 * @param {object[]} args.universe
 * @param {string} args.query
 * @param {string} args.asOf
 * @param {string} args.tenantId
 * @param {Readonly<object>} args.provenance
 * @param {'UI13'|'UI14'} args.surface
 * @returns {Readonly<object>}
 */
export function searchAndBuildView(args) {
  const { provenance, surface, ...searchArgs } = args;
  const searchResult = executeSearch(searchArgs);
  return buildSearchView({ searchResult, provenance, surface });
}

/**
 * RS-1 — Resolve a single object and build UI view.
 *
 * @param {object} args
 * @param {Readonly<object>} args.request — resolution request
 * @param {object[]} args.securities
 * @param {object} args.register
 * @param {Readonly<object>} args.provenance
 * @param {'UI13'|'UI14'} args.surface
 * @returns {Readonly<object>}
 */
export function resolveAndBuildView(args) {
  const { request, securities, register, provenance, surface } = args;

  if (surface !== 'UI13' && surface !== 'UI14') {
    throw new CrossSurfaceViolation(
      ['RS-3'],
      `surface '${surface}' is not authorized for the resolver contract`
    );
  }

  assertNoFabricatedProvenance(provenance);
  const resolutionResult = resolveObject({ request, securities, register });
  const provenanceView = buildProvenanceView(provenance);

  return Object.freeze({
    surfaceName: surface,
    disposition: 'NEW',
    resolved: true,
    resolution: resolutionResult,
    provenanceView,
    resolverContract: 'P12-C7',
  });
}

/**
 * RS-3 — Verify that UI13 and UI14 share the same resolver.
 *
 * @param {Readonly<object>} ui13View
 * @param {Readonly<object>} ui14View
 * @returns {boolean}
 */
export function assertSharedResolver(ui13View, ui14View) {
  if (ui13View.resolverContract !== ui14View.resolverContract) {
    throw new CrossSurfaceViolation(
      ['RS-3', 'U6'],
      'UI13 and UI14 must share the same resolver contract — ' +
      `got '${ui13View.resolverContract}' and '${ui14View.resolverContract}'`
    );
  }
  return true;
}
