/**
 * Institutional Investment Platform System (IIPS)
 * Phase-1A Application Shell — Governed Navigation Model Test Suite
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / Phase-1A Authority Decision
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

describe('Phase-1A shell navigation model — honesty contract (AC-12)', () => {
  it('NAV-01: Portfolio is the ONLY top-level surface declared implemented', () => {
    const implemented = NAV.filter((n) => n.status === 'implemented').map((n) => n.label);
    assert.deepStrictEqual(
      implemented,
      ['Portfolio'],
      'Only Portfolio (BI-07/BI-08 PortfolioWorkspace) has a real implementation in Phase 1A'
    );
  });

  it('NAV-02: Research, Intelligence and Administration are NOT fabricated as implemented', () => {
    for (const label of ['Research', 'Intelligence', 'Administration']) {
      assert.ok(byLabel[label], `${label} must exist in the navigation model`);
      assert.strictEqual(
        byLabel[label].status,
        'future',
        `${label} MUST remain 'future' — it has no implementation on the BI-authoritative base`
      );
    }
  });

  it('NAV-03: every API-coupled historical surface is declared future', () => {
    const mustBeFuture = [
      'Executive',
      'Replay Studio',
      'Security Master',
      'Research',
      'Intelligence',
      'Evidence',
      'Administration',
      'Collaboration',
      'Reports',
      'Watchlists',
      'Settings',
    ];
    for (const label of mustBeFuture) {
      assert.strictEqual(byLabel[label]?.status, 'future', `${label} must be 'future'`);
    }
    assert.strictEqual(mustBeFuture.length, 11, 'Exactly 11 declared-but-unimplemented surfaces');
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

  it('NAV-05: no dead child links — children only under implemented parents', () => {
    for (const item of NAV) {
      if (item.children && item.children.length > 0) {
        assert.strictEqual(
          item.status,
          'implemented',
          `'${item.label}' declares children but is not implemented — dead-link regression`
        );
      }
    }
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
  it('NAV-10: every navigation path is declared in the route map', () => {
    const declared = new Set<string>(Object.values(ROUTES));
    for (const item of NAV) {
      assert.ok(
        declared.has(item.path),
        `Navigation path '${item.path}' (${item.label}) is not declared in ROUTES`
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
    const statuses: NavStatus[] = ['implemented', 'partial', 'future'];
    for (const s of statuses) {
      assert.ok(NAV_STATUS_LABEL[s], `status label missing for '${s}'`);
    }
  });
});

describe('Phase-1A shell navigation model — production boundary', () => {
  it('NAV-14: no navigation entry references a live, provider, or auth surface', () => {
    const forbidden = /live|provider|oidc|keycloak|auth|signin|sign-in|credential/i;
    for (const item of NAV) {
      assert.ok(
        !forbidden.test(item.path) && !forbidden.test(item.label),
        `Navigation entry '${item.label}' (${item.path}) references a gated surface`
      );
    }
  });
});
