/**
 * P13 — NEW SURFACES (UI07, UI09, UI10)
 *
 * Authority:
 *   D32 P13 Implementation Authorization (commit 2f131d9)
 *   D4_10_P13_UI_DELTA.md L.2
 *
 *   UI07 Watchlists  — NEW: persistence + streaming/quality contract
 *   UI09 Alerts      — NEW: deterministic evaluation; no alerts on unavailable
 *   UI10 Collaboration — NEW: comments pin vintage they reference
 *
 * Boundaries (hard):
 *   ⚠ **NS-1** No fabricated provenance (U1)
 *   ⚠ **NS-2** Degradation visible (U2)
 *   ⚠ **NS-3** Alerts are deterministic — same inputs → same alert state
 *   ⚠ **NS-4** No alerts fired on unavailable data where prohibited
 *   ⚠ **NS-5** Collaboration comments pin vintage (asOf + dataVersion)
 */

import {
  assertNoFabricatedProvenance,
  getDegradationDisplay,
  buildAsOfDisplay,
  CrossSurfaceViolation,
} from './crossSurfaceRules.js';
import { buildProvenanceView } from './provenanceView.js';

export const P13_NS_MODULE = 'P13-NEW-SURFACES';

/**
 * UI07 Watchlists — NEW.
 * Build a watchlist view with quality/streaming contract.
 *
 * @param {object} args
 * @param {string} args.watchlistId
 * @param {object[]} args.items — watchlist items
 * @param {Readonly<object>[]} args.provenances — per-item provenance
 * @param {string} args.tenantId
 * @returns {Readonly<object>}
 */
export function buildWatchlistView(args) {
  const { watchlistId, items, provenances, tenantId } = args;

  if (typeof watchlistId !== 'string' || watchlistId.length === 0) {
    throw new CrossSurfaceViolation(['NS-1'], 'watchlistId must be a non-empty string');
  }

  const itemsWithQuality = items.map((item, i) => {
    const prov = provenances[i];
    assertNoFabricatedProvenance(prov);
    return Object.freeze({
      ...item,
      _quality: prov.quality,
      _degradation: getDegradationDisplay(prov.quality),
      _provenanceView: buildProvenanceView(prov),
    });
  });

  return Object.freeze({
    surfaceName: 'UI07',
    disposition: 'NEW',
    watchlistId,
    tenantId,
    items: Object.freeze(itemsWithQuality),
    totalItems: items.length,
  });
}

/**
 * UI09 Alerts — NEW.
 * Deterministic alert evaluation. No alerts on unavailable data where prohibited.
 *
 * @param {object} args
 * @param {object[]} args.alertRules — alert rule definitions
 * @param {object[]} args.dataPoints — data to evaluate
 * @param {Readonly<object>[]} args.provenances — per-point provenance
 * @param {string} args.tenantId
 * @returns {Readonly<object>}
 */
export function buildAlertsView(args) {
  const { alertRules, dataPoints, provenances, tenantId } = args;

  if (!Array.isArray(alertRules)) {
    throw new CrossSurfaceViolation(['NS-3'], 'alertRules must be an array');
  }

  const evaluatedAlerts = [];

  for (const rule of alertRules) {
    for (let i = 0; i < dataPoints.length; i++) {
      const point = dataPoints[i];
      const prov = provenances[i];

      // NS-4: skip alert evaluation on unavailable data
      if (prov && prov.quality === 'unavailable' && rule.skipOnUnavailable !== false) {
        evaluatedAlerts.push(Object.freeze({
          ruleId: rule.ruleId,
          dataPointId: point.id,
          status: 'skipped',
          reason: 'data unavailable — alert suppressed (NS-4)',
          quality: 'unavailable',
          asOf: prov.asOf,
        }));
        continue;
      }

      // NS-3: deterministic evaluation
      const triggered = rule.evaluate ? rule.evaluate(point) : false;
      evaluatedAlerts.push(Object.freeze({
        ruleId: rule.ruleId,
        dataPointId: point.id,
        status: triggered ? 'triggered' : 'clear',
        quality: prov ? prov.quality : 'unknown',
        asOf: prov ? prov.asOf : null,
      }));
    }
  }

  return Object.freeze({
    surfaceName: 'UI09',
    disposition: 'NEW',
    tenantId,
    alerts: Object.freeze(evaluatedAlerts),
    totalAlerts: evaluatedAlerts.length,
    triggeredCount: evaluatedAlerts.filter((a) => a.status === 'triggered').length,
    skippedCount: evaluatedAlerts.filter((a) => a.status === 'skipped').length,
  });
}

/**
 * UI10 Collaboration — NEW.
 * Comments must pin the vintage they reference (NS-5).
 *
 * @param {object} args
 * @param {string} args.threadId
 * @param {object[]} args.comments
 * @param {Readonly<object>} args.pinnedProvenance — the vintage the thread references
 * @param {string} args.tenantId
 * @returns {Readonly<object>}
 */
export function buildCollaborationView(args) {
  const { threadId, comments, pinnedProvenance, tenantId } = args;

  // NS-5: thread must pin a vintage
  assertNoFabricatedProvenance(pinnedProvenance);

  const pinnedComments = comments.map((comment) =>
    Object.freeze({
      ...comment,
      _pinnedVintage: Object.freeze({
        dataVersion: pinnedProvenance.dataVersion,
        asOf: pinnedProvenance.asOf,
        mode: pinnedProvenance.mode,
      }),
    })
  );

  return Object.freeze({
    surfaceName: 'UI10',
    disposition: 'NEW',
    threadId,
    tenantId,
    pinnedVintage: Object.freeze({
      dataVersion: pinnedProvenance.dataVersion,
      asOf: pinnedProvenance.asOf,
      mode: pinnedProvenance.mode,
    }),
    comments: Object.freeze(pinnedComments),
    totalComments: comments.length,
  });
}
