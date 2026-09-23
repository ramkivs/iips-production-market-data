/**
 * Institutional Investment Platform System (IIPS)
 * Phase-1A Application Shell — Governed Navigation Model Test Suite
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / Phase-1A Authority Decision
 *                 + phase5-offline-full-shell-restoration-2026-09-23-001 (Option A)
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 *
 * Provenance: adapted from the full-IIPS baseline test
 * frontend/src/app/navigation.test.ts (tree 682f4e6029818c839f23211ae5067eed862c5037,
 * ref origin/arena/01a0c440). The historical test is Vitest + jsdom; the BI-authoritative
 * base runs `node --test` with no DOM runner, so the LOGIC assertions are reimplemented
 * here against node:test / node:assert. No DOM rendering is exercised.
 *
 * ══ WHAT THIS SUITE PROTECTS ═════════════════════════════════════════════════════════════
 *  AC-12 — "Research/Intelligence/Admin are not fabricated as implemented surfaces."
 *
 *  The governed honesty contract: a navigation entry existing does NOT mean its module is
 *  implemented. These tests fail if any future surface is silently promoted to
 *  `implemented` without a real implementation landing behind it.
 *
 * ══ PHASE 5 / OPTION A AMENDMENTS (authority-recorded) ════════════════════════════════════
 *  The act phase5-offline-full-shell-restoration-2026-09-23-001 restores the donor
 *  navigation STRUCTURE. Contracts amended BY THAT ACT, honestly and bounded:
 *    · NAV-02/NAV-03: Administration, Collaboration, Reports, Watchlists, Settings move
 *      from `future` to the NEW `unavailable` status = STRUCTURALLY PRESENT, FAIL-CLOSED
 *      (donor route restored; renders an honest offline/authorization-required state;
 *      never `implemented`).
 *    · NAV-05: children are legitimate under implemented/partial/unavailable parents when
 *      every child path resolves to a declared route (no dead links). `future` parents
 *      still may not declare children (non-navigable = dead-link regression).
 *    · NAV-10: a navigation path may be a concrete ROUTES value OR a concrete
 *      instantiation of a `:param` route template (the donor's frozen reference-sector
 *      deep links, e.g. /research/company/Banking).
 *    · NAV-13: the `unavailable` status label exists.
 *    · NAV-14: the production-boundary regex is unchanged; the restored donor
 *      Administration subtree (labels carried verbatim from the donor model) is exempted
 *      from the LABEL check by the act and covered instead by ADMIN-01 structural-only
 *      assertions (fail-closed rendering is enforced in
 *      shell_offline_full_shell_restoration.test.ts).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  NAV,
  NAV_STATUS_LABEL,
  visibleNav,
  type NavItem,
  type NavStatus,
} from '../frontend/src/app/navigation.js';
import { ROUTES } from '../frontend/src/app/routes.js';

const byLabel: Record<string, NavItem> = Object.fromEntries(NAV.map((n) => [n.label, n]));

/** All nav items, flattened (top-level + children). */
function flatten(items: NavItem[]): NavItem[] {
  return items.flatMap((i) => [i, ...(i.children ?? [])]);
}

/** True if path is a concrete ROUTES value or a concrete instantiation of a :param template. */
function resolvesToDeclaredRoute(path: string): boolean {
  const values = Object.values(ROUTES) as readonly string[];
  if (values.includes(path)) return true;
  return values.some(
    (tpl) =>
      tpl.includes(':') &&
      new RegExp('^' + tpl.replace(/:[^/]+/g, '[^/]+') + '$').test(path)
  );
}

describe('Phase-1A shell navigation model — honesty contract (AC-12)', () => {
  it('NAV-01: only Portfolio and Security Master are declared implemented', () => {
    // F-3 amendment (authority act f3-ui08-security-master-functional-2026-09-23-001):
    // Security Master graduated from `future` to `implemented` — it is the only surface
    // besides Portfolio backed by a genuinely functional local data source (the governed
    // D05 broad master + UI08 builder + in-process resolver). Nothing else may claim it.
    const implemented = NAV.filter((n) => n.status === 'implemented').map((n) => n.label);
    assert.deepStrictEqual(
      implemented,
      ['Portfolio', 'Security Master'],
      'Only Portfolio (BI-07/BI-08) and Security Master (UI08/governed D05, F-3) are implemented'
    );
  });

  it('NAV-02: Research and Administration are NOT fabricated as implemented', () => {
    // Phase-4 (Path L): Research graduated to a real presentation-only surface ('partial').
    // Phase 5 / Option A: Administration is STRUCTURALLY RESTORED ('unavailable' — donor
    // 8-tab structure, fail-closed rendering, D115 DEFERRED) but must never claim
    // 'implemented'.
    for (const label of ['Research', 'Administration']) {
      assert.ok(byLabel[label], `${label} must exist in the navigation model`);
      assert.notStrictEqual(
        byLabel[label].status,
        'implemented',
        `${label} must NOT be 'implemented' — no full implementation on the BI-authoritative base`
      );
    }
    assert.strictEqual(
      byLabel['Administration']?.status,
      'unavailable',
      "Administration must be 'unavailable' (structurally restored, fail-closed, D115 deferred)"
    );
  });

  it('NAV-03: declared-but-unimplemented surfaces are honestly future or unavailable', () => {
    // Phase 5 / Option A: the donor server-coupled surfaces are structurally restored and
    // therefore `unavailable` (fail-closed), NOT `future`. F-3 graduated Security Master
    // to `implemented` (governed D05 functional surface), leaving Replay Studio as the
    // only current-base future surface.
    const mustBeFuture = ['Replay Studio'];
    for (const label of mustBeFuture) {
      assert.strictEqual(byLabel[label]?.status, 'future', `${label} must be 'future'`);
    }
    assert.strictEqual(
      byLabel['Security Master']?.status,
      'implemented',
      "Security Master must be 'implemented' (F-3: governed D05 + UI08 builder)"
    );
    const mustBeUnavailable = [
      'Administration',
      'Collaboration',
      'Reports',
      'Watchlists',
      'Settings',
    ];
    for (const label of mustBeUnavailable) {
      assert.strictEqual(
        byLabel[label]?.status,
        'unavailable',
        `${label} must be 'unavailable' — donor structure restored, fail-closed offline`
      );
    }
    assert.strictEqual(mustBeFuture.length, 1, 'Exactly 1 future top-level surface');
    assert.strictEqual(
      mustBeUnavailable.length,
      5,
      'Exactly 5 structurally-restored unavailable top-level surfaces'
    );
    // The four partial presentation-only surfaces are preserved exactly (never demoted).
    for (const label of ['Executive', 'Research', 'Intelligence', 'Evidence']) {
      assert.strictEqual(byLabel[label]?.status, 'partial', `${label} must remain 'partial'`);
    }
  });

  it('NAV-02b: Intelligence is PARTIAL — implemented component, no governed offline payload', () => {
    // Phase-1C (Path L): the surface is real and bound to the local UI04 view-model, but the
    // route currently has no governed IntelligenceDTO wired, so it renders its empty state.
    // 'partial' is navigable AND honest; 'implemented' would overstate delivered capability.
    assert.strictEqual(
      byLabel['Intelligence']?.status,
      'partial',
      "Intelligence must be 'partial' until a governed offline payload source is authorized"
    );
    assert.notStrictEqual(
      byLabel['Intelligence']?.status,
      'implemented',
      'Intelligence must NOT claim full implementation without a governed payload'
    );
  });

  it('NAV-02c: Evidence is PARTIAL — implemented component, no governed provenance payload', () => {
    // Phase-2 (Path L): bound to the local UI11 view-model, but GATE-PHASE-2-EVIDENCE-
    // PAYLOAD-FORENSIC (8dfd8ec) found no governed per-company provenance, so the route
    // renders its explicit unavailable state. 'partial' is navigable AND honest.
    assert.strictEqual(
      byLabel['Evidence']?.status,
      'partial',
      "Evidence must be 'partial' until a governed provenance source is authorized"
    );
    assert.notStrictEqual(
      byLabel['Evidence']?.status,
      'implemented',
      'Evidence must NOT claim full implementation without a governed provenance'
    );
  });

  it('NAV-02d: Executive is PARTIAL — implemented component, all three governed payloads absent', () => {
    // Phase-3 (Path L): bound to the local UI02 view-model, but GATE-PHASE-3-EXECUTIVE-
    // PAYLOAD-FORENSIC (checkpoint 5ef8960) returned classification B across ALL THREE
    // mandatory payload domains (MarketDataDTO, EngineScoreOutput, IntelligenceDTO), and the
    // builder has no partial-render path, so the route renders its explicit unavailable
    // state UNCONDITIONALLY. 'partial' is navigable AND honest. The donor portfolio-level
    // ExecutiveDashboard is NOT mounted (granularity conflict unresolved by Option A).
    assert.strictEqual(
      byLabel['Executive']?.status,
      'partial',
      "Executive must be 'partial' until all three governed payload sources are authorized"
    );
    assert.notStrictEqual(
      byLabel['Executive']?.status,
      'implemented',
      'Executive must NOT claim full implementation without all three governed payloads'
    );
    assert.notStrictEqual(
      byLabel['Executive']?.status,
      'future',
      'Executive is a real Phase-3 presentation surface — demotion to future would be false'
    );
  });

  it('NAV-02e: Research is PARTIAL — implemented UI03 component, no governed fundamentals payload', () => {
    // Phase-4 (Path L): /research = UI03_FUNDAMENTAL_ANALYSIS (identity designated by
    // phase4-research-identity-designation-2026-09-23-001), bound to the local UI03
    // view-model. GATE-PHASE-4-RESEARCH-SURFACE-FORENSIC (bc6d8ae) gap R-1: zero governed
    // FundamentalsDTO payloads exist, and the builder has no partial-render path, so the
    // route renders its explicit unavailable state UNCONDITIONALLY. 'partial' is navigable
    // AND honest. Option A restores the donor research CHILDREN as structural
    // (unavailable) routes WITHOUT UISurfaceIds — UI05/UI06/UI12/UI13 are not designated.
    assert.strictEqual(
      byLabel['Research']?.status,
      'partial',
      "Research must be 'partial' until a governed FundamentalsDTO source is authorized (R-1/R-5/R-6)"
    );
    assert.notStrictEqual(
      byLabel['Research']?.status,
      'implemented',
      'Research must NOT claim full implementation without a governed fundamentals payload'
    );
    assert.notStrictEqual(
      byLabel['Research']?.status,
      'future',
      'Research is a real Phase-4 presentation surface — demotion to future would be false'
    );
  });

  it('NAV-04: no navigation entry carries an undefined status (honesty marker mandatory)', () => {
    const walk = (items: NavItem[]): void => {
      for (const item of items) {
        assert.ok(
          item.status !== undefined,
          `Navigation entry '${item.label}' must declare an explicit status`
        );
        if (item.children) walk(item.children);
      }
    };
    walk(NAV);
  });

  it('NAV-05: no dead child links — children only under navigable parents, every child resolves', () => {
    // Phase 5 / Option A amendment: restored donor children are legitimate under
    // implemented / partial / unavailable parents (all navigable statuses — each renders a
    // real route). A `future` parent is NON-NAVIGABLE text, so children under it would be
    // dead links (N+17 contract preserved). Every child path must resolve to a declared
    // route (concrete value or :param instantiation).
    for (const item of NAV) {
      if (item.children && item.children.length > 0) {
        assert.notStrictEqual(
          item.status,
          'future',
          `'${item.label}' declares children but is future — dead-link regression`
        );
        for (const child of item.children) {
          assert.ok(
            resolvesToDeclaredRoute(child.path),
            `Child '${child.label}' (${child.path}) does not resolve to a declared route — dead link`
          );
        }
      }
    }
  });

  it('ADMIN-01: the restored Administration subtree is donor structure, fail-closed, admin-only', () => {
    // Phase 5 / Option A: the 8 donor tabs are restored verbatim (labels + paths) as
    // STRUCTURE ONLY. D115 remains DEFERRED — no tab may claim implementation, and the
    // subtree stays admin-only. Fail-closed RENDERING is enforced in
    // shell_offline_full_shell_restoration.test.ts (OPTA-04).
    const admin = byLabel['Administration'];
    assert.ok(admin, 'Administration must exist');
    assert.strictEqual(admin.minRole, 'admin', 'Administration stays admin-only');
    const expected = [
      ['Overview', '/admin/overview'],
      ['Identity & Access', '/admin/identity'],
      ['Tenants', '/admin/tenancy'],
      ['Engines & Certification', '/admin/engines'],
      ['Platform Operations', '/admin/platform'],
      ['Audit', '/admin/audit'],
      ['Live Data & Governance', '/admin/data'],
      ['Migration / Workflow / Marketplace', '/admin/operations'],
    ] as const;
    assert.strictEqual(admin.children?.length, 8, 'Exactly the 8 donor tabs');
    admin.children?.forEach((c, i) => {
      assert.strictEqual(c.label, expected[i][0], `Admin tab ${i} label must match the donor model`);
      assert.strictEqual(c.path, expected[i][1], `Admin tab ${i} path must match the donor model`);
      assert.strictEqual(c.minRole, 'admin', `Admin tab '${c.label}' must be admin-only`);
      assert.strictEqual(c.status, 'unavailable', `Admin tab '${c.label}' must be fail-closed`);
    });
  });
});

describe('Phase-1A shell navigation model — role filtering', () => {
  it('NAV-06: viewer does not see admin-only surfaces', () => {
    const labels = visibleNav('viewer').map((n) => n.label);
    assert.ok(!labels.includes('Administration'), 'Administration is admin-only');
    assert.ok(labels.includes('Portfolio'), 'Portfolio is viewer-visible');
  });

  it('NAV-07: analyst does not see admin-only surfaces', () => {
    const labels = visibleNav('analyst').map((n) => n.label);
    assert.ok(!labels.includes('Administration'), 'Administration is admin-only');
  });

  it('NAV-08: admin sees every surface including admin-only', () => {
    const labels = visibleNav('admin').map((n) => n.label);
    assert.ok(labels.includes('Administration'), 'admin sees Administration');
    assert.strictEqual(labels.length, NAV.length, 'admin sees the full navigation model');
  });

  it('NAV-09: role filtering is monotonic (viewer ⊆ analyst ⊆ admin)', () => {
    const v = visibleNav('viewer').map((n) => n.label);
    const a = visibleNav('analyst').map((n) => n.label);
    const d = visibleNav('admin').map((n) => n.label);
    assert.ok(v.every((l) => a.includes(l)), 'viewer ⊆ analyst');
    assert.ok(a.every((l) => d.includes(l)), 'analyst ⊆ admin');
  });
});

describe('Phase-1A shell navigation model — route integrity', () => {
  it('NAV-10: every navigation path resolves to the route map (value or :param instantiation)', () => {
    // Phase 5 / Option A amendment: restored donor deep links are CONCRETE instantiations
    // of `:param` route templates (the donor N+7/P-4 contract — e.g. /research/company/:id
    // instantiated as the frozen reference sector /research/company/Banking).
    for (const item of flatten(NAV)) {
      assert.ok(
        resolvesToDeclaredRoute(item.path),
        `Navigation path '${item.path}' (${item.label}) does not resolve to a declared route`
      );
    }
  });

  it('NAV-11: all navigation paths are concrete (no unresolved :param templates)', () => {
    const walk = (items: NavItem[]): void => {
      for (const item of items) {
        assert.ok(
          !item.path.includes(':'),
          `Navigation path '${item.path}' is a route template, not a concrete link`
        );
        if (item.children) walk(item.children);
      }
    };
    walk(NAV);
  });

  it('NAV-12: navigation paths are unique at top level', () => {
    const paths = NAV.map((n) => n.path);
    assert.strictEqual(new Set(paths).size, paths.length, 'duplicate top-level nav path');
  });

  it('NAV-13: status labels are defined for every status value', () => {
    // Phase 5 / Option A: the new `unavailable` status (structurally present, fail-closed).
    const statuses: NavStatus[] = ['implemented', 'partial', 'unavailable', 'future'];
    for (const s of statuses) {
      assert.ok(NAV_STATUS_LABEL[s], `status label missing for '${s}'`);
    }
    assert.strictEqual(NAV_STATUS_LABEL.unavailable, 'Unavailable');
  });
});

describe('Phase-1A shell navigation model — production boundary', () => {
  it('NAV-14: no navigation entry references a live, provider, or auth surface', () => {
    // Phase 5 / Option A amendment: the forbidden-pattern guard is UNCHANGED and applies to
    // every entry OUTSIDE the restored donor Administration subtree. The Administration
    // labels are donor model structure carried verbatim (e.g. the 'Live Data & Governance'
    // admin tab, which GOVERNS live data rather than activating it) and are covered by
    // ADMIN-01 + the fail-closed rendering suite instead.
    const forbidden = /live|provider|oidc|keycloak|auth|signin|sign-in|credential/i;
    const walk = (items: NavItem[]): void => {
      for (const item of items) {
        if (item.label === 'Administration') continue; // donor subtree — ADMIN-01 + OPTA-04
        assert.ok(
          !forbidden.test(item.path) && !forbidden.test(item.label),
          `Navigation entry '${item.label}' (${item.path}) references a gated surface`
        );
        if (item.children) walk(item.children);
      }
    };
    walk(NAV);
    // No future/unavailable/structural entry anywhere may claim a provider or auth runtime.
    for (const item of flatten(NAV)) {
      assert.ok(
        !/keycloak|oidc/i.test(item.label),
        `Navigation label '${item.label}' references the excluded identity tier`
      );
    }
  });
});
