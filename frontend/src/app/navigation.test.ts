/**
 * Program v3.0 — Milestone N (+N+1): navigation honesty model tests.
 * Verifies the presentation-only status classification, child-level reconciliation,
 * and role filtering.
 */
import { describe, it, expect } from 'vitest';
import { NAV, NAV_STATUS_LABEL, visibleNav, type NavItem } from './navigation';
import { ROUTES } from './routes';

const byLabel = Object.fromEntries(NAV.map((n) => [n.label, n]));

function childrenOf(label: string) {
  return byLabel[label]?.children ?? [];
}

describe('navigation model — status classification (top level)', () => {
  it('marks fully implemented top-level surfaces as implemented', () => {
    expect(byLabel['Executive'].status).toBe('implemented');
    expect(byLabel['Portfolio'].status).toBe('implemented');
    expect(byLabel['Administration'].status).toBe('implemented');
  });

  it('marks Research / Intelligence / Evidence as partial (module-level scope future)', () => {
    expect(byLabel['Research'].status).toBe('partial');
    expect(byLabel['Intelligence'].status).toBe('partial');
    expect(byLabel['Evidence'].status).toBe('partial');
  });

  it('provides a human-facing label for every status', () => {
    expect(NAV_STATUS_LABEL.implemented).toBe('Implemented');
    expect(NAV_STATUS_LABEL.partial).toBe('Partial');
    expect(NAV_STATUS_LABEL.future).toBe('Future');
  });
});

describe('navigation model — Milestone N+1 child reconciliation', () => {
  it('Administration children match the 8 governed read-only tabs', () => {
    const labels = childrenOf('Administration').map((c) => c.label);
    expect(labels).toEqual([
      'Overview',
      'Identity & Access',
      'Tenants',
      'Engines & Certification',
      'Platform Operations',
      'Audit',
      'Live Data & Governance',
      'Migration / Workflow / Marketplace',
    ]);
  });

  it('Administration children deep-link to their tab ids under /admin/*', () => {
    const paths = childrenOf('Administration').map((c) => c.path);
    expect(paths).toEqual([
      '/admin/overview',
      '/admin/identity',
      '/admin/tenancy',
      '/admin/engines',
      '/admin/platform',
      '/admin/audit',
      '/admin/data',
      '/admin/operations',
    ]);
  });

  it('removes the dead /evidence/snapshots child', () => {
    const paths = childrenOf('Evidence').map((c) => c.path);
    expect(paths).not.toContain('/evidence/snapshots');
    expect(paths).not.toContain('/evidence/snapshots/');
  });

  it('marks future-only children as future (never implemented)', () => {
    const statusOf = (group: string, label: string) =>
      childrenOf(group).find((c) => c.label === label)?.status;
    expect(statusOf('Intelligence', 'Opportunities')).toBe('future');
    expect(statusOf('Intelligence', 'Risks')).toBe('future');
    expect(statusOf('Intelligence', 'Rankings')).toBe('future');
  });

  it('N+16: removes the dead Portfolio Holdings child (no dedicated surface)', () => {
    expect(childrenOf('Portfolio').map((c) => c.label)).not.toContain('Holdings');
    expect(childrenOf('Portfolio').map((c) => c.path)).not.toContain('/portfolio/:id/holdings');
  });

  it('N+17: removes the dead Evidence Replay child (route-template, no concrete sector)', () => {
    const evidence = childrenOf('Evidence');
    expect(evidence.map((c) => c.label)).not.toContain('Replay');
    expect(evidence.map((c) => c.path)).not.toContain('/evidence/replay/:id');
    expect(evidence.map((c) => c.label)).toEqual(['Decision Evidence']);
    expect(evidence.map((c) => c.path)).toEqual(['/evidence']);
  });

  it('N+17: no navigable (implemented/partial) entry exposes a route template (:id)', () => {
    const walk = (items: NavItem[], acc: NavItem[] = []): NavItem[] => {
      for (const item of items) {
        acc.push(item);
        if (item.children) walk(item.children, acc);
      }
      return acc;
    };
    const navigable = walk(NAV).filter((n) => n.status !== 'future');
    expect(navigable.length).toBeGreaterThan(0);
    for (const n of navigable) {
      expect(n.path).not.toContain(':id');
    }
  });

  it('N+18: the route map no longer documents non-existent Portfolio surfaces', () => {
    // N+16 declared Holdings to have no dedicated surface; PortfolioWorkspace has no
    // per-holding detail route (it renders the same workspace for any /portfolio/* path).
    expect(ROUTES).not.toHaveProperty('portfolioDetail');
    expect(ROUTES).not.toHaveProperty('portfolioHoldings');
    // The implemented architecture keeps the generic portfolio workspace entry only.
    expect(ROUTES.portfolio).toBe('/portfolio');
  });

  it('marks implemented children as implemented', () => {
    const statusOf = (group: string, label: string) =>
      childrenOf(group).find((c) => c.label === label)?.status;
    expect(statusOf('Portfolio', 'Overview')).toBe('implemented');
    expect(statusOf('Research', 'Company')).toBe('implemented');
    expect(statusOf('Research', 'Sector')).toBe('implemented');
    expect(statusOf('Research', 'Events')).toBe('implemented');
    expect(statusOf('Research', 'Cross-Sector')).toBe('implemented');
    expect(statusOf('Research', 'Macro')).toBe('implemented');
    expect(statusOf('Intelligence', 'Decision Matrix')).toBe('implemented');
    expect(statusOf('Evidence', 'Decision Evidence')).toBe('implemented');
  });

  it('P-5: exposes the read-only Screener as an implemented child under Research', () => {
    const screener = childrenOf('Research').find((c) => c.label === 'Screener');
    expect(screener?.status).toBe('implemented');
    expect(screener?.path).toBe('/screener');
    expect(screener?.minRole).toBe('viewer');
  });

  it('N+7: the Company entry resolves to a concrete route, not the literal :id template', () => {
    const company = childrenOf('Research').find((c) => c.label === 'Company');
    expect(company?.path).toBe('/research/company/Banking');
    expect(company?.path).not.toContain(':id');
    // The route declaration itself remains a valid sector-template for concrete values.
    expect(ROUTES.researchCompany).toBe('/research/company/:id');
  });

  it('P-4: the Sector entry resolves to a concrete route, not the literal :id template', () => {
    const sector = childrenOf('Research').find((c) => c.label === 'Sector');
    expect(sector?.path).toBe('/research/sector/Banking');
    expect(sector?.path).not.toContain(':id');
    // The route declaration itself remains a valid sector-template for concrete values.
    expect(ROUTES.researchSector).toBe('/research/sector/:id');
  });

  it('P-4 Research Events: exposes Events as an implemented child under Research with a concrete route', () => {
    const events = childrenOf('Research').find((c) => c.label === 'Events');
    expect(events?.status).toBe('implemented');
    expect(events?.minRole).toBe('viewer');
    expect(events?.path).toBe('/research/events/Banking');
    expect(events?.path).not.toContain(':id');
    // The route declaration itself remains a valid sector-template for concrete values.
    expect(ROUTES.researchEvents).toBe('/research/events/:id');
  });

  it('WP-MACRO-03: exposes Macro as an implemented child under Research with the concrete route', () => {
    const macro = childrenOf('Research').find((c) => c.label === 'Macro');
    expect(macro?.status).toBe('implemented');
    expect(macro?.minRole).toBe('viewer');
    expect(macro?.path).toBe('/research/macro');
    expect(macro?.path).not.toContain(':id');
    expect(ROUTES.researchMacro).toBe('/research/macro');
  });

  it('marks all Administration children as implemented', () => {
    for (const c of childrenOf('Administration')) {
      expect(c.status).toBe('implemented');
    }
  });
});

describe('navigation model — role filtering (unchanged semantics)', () => {
  it('hides Administration for non-admin roles', () => {
    expect(visibleNav('viewer').map((n) => n.label)).not.toContain('Administration');
    expect(visibleNav('analyst').map((n) => n.label)).not.toContain('Administration');
    expect(visibleNav('admin').map((n) => n.label)).toContain('Administration');
  });

  it('keeps viewer surfaces visible to all roles', () => {
    for (const role of ['viewer', 'analyst', 'admin'] as const) {
      const labels = visibleNav(role).map((n) => n.label);
      expect(labels).toContain('Executive');
      expect(labels).toContain('Portfolio');
      expect(labels).toContain('Research');
      expect(labels).toContain('Intelligence');
      expect(labels).toContain('Evidence');
    }
  });
});

describe('G-AI-IMPL T7 — no standalone AI route or navigation entry (D3/D4)', () => {
  const allItems: NavItem[] = NAV.flatMap((n) => [n, ...(n.children ?? [])]);

  it('adds no AI navigation entry at any level, and no Intelligence child', () => {
    for (const item of allItems) {
      expect(item.label).not.toMatch(/AI|advisory|explanation/i);
      expect(item.path).not.toMatch(/ai|advisory|explanation/i);
    }
    const intelligence = NAV.find((n) => n.label === 'Intelligence');
    expect(intelligence).toBeDefined();
    for (const child of intelligence?.children ?? []) {
      expect(child.label).not.toMatch(/AI|advisory|explanation/i);
    }
  });

  it('adds no standalone AI route to the route map', () => {
    for (const [key, path] of Object.entries(ROUTES)) {
      expect(key).not.toMatch(/^ai|advisory/i);
      expect(String(path)).not.toMatch(/ai-advisory|ai-explanation/i);
    }
  });

  it('leaves the navigation inventory unchanged in size and top-level labels', () => {
    expect(NAV.map((n) => n.label)).toEqual([
      'Executive', 'Portfolio', 'Research', 'Intelligence', 'Evidence', 'Administration',
    ]);
  });
});
