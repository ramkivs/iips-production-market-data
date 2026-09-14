/**
 * Program v3.0 — Phase 12.1: Administration UI tests (mocked transport).
 * Verifies read-only governed surfaces render; no fabrication; unavailable states.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { Administration } from './Administration';
import type { AdminOverview, AdminIdentity, AdminEngines, AdminAudit } from '../../api/admin';

const OVERVIEW: AdminOverview = {
  platform: { state: 'OPERATIONAL', nodesHealthy: 1, nodesTotal: 2, enginesRegistered: 10, enginesCertified: 10, liveDataQuality: 'good', recentAuditCount: 3 },
  provenance: { dataSource: 'governed', freshness: 'SNAPSHOT', authority: 'PLATFORM', transportSemantics: 'read-only' },
};
const IDENTITY: AdminIdentity = {
  principal: { userId: 'admin-a', tenantId: 'tenant-A', roles: ['admin'] },
  roles: [{ role: 'admin', permissions: [{ action: '*', resource: '*' }] }, { role: 'viewer', permissions: [{ action: 'read', resource: '*' }] }],
  identityAuthority: 'Keycloak (OIDC)', authzAuthority: 'EnterpriseRuntime / ApiSecurity',
  provenance: { dataSource: 'governed', freshness: 'SNAPSHOT', authority: 'PLATFORM', transportSemantics: 'reference' },
};
const ENGINES: AdminEngines = {
  engines: [{ engineId: 'sector.banking', sectorFamily: 'Banking', engineVersion: '1.0.0', secVersion: '1.0', semcVersion: '1.0', capabilities: ['metrics'] }],
  provenance: { dataSource: 'governed', freshness: 'SNAPSHOT', authority: 'PLATFORM', transportSemantics: 'read-only' },
};
const AUDIT: AdminAudit = {
  records: [{ auditId: 'a1', tenantId: 'tenant-A', userId: 'admin-a', action: 'admin', resource: 'admin.engines', allowed: true, at: '2026-08-11T00:00:00.000Z' }],
  scope: 'in-memory governed auditLog', provenance: { dataSource: 'governed', freshness: 'LIVE', authority: 'PLATFORM', transportSemantics: 'read-only' },
};

const API = {
  '/api/admin/overview': OVERVIEW,
  '/api/admin/identity': IDENTITY,
  '/api/admin/tenants': { principal: { userId: 'admin-a', tenantId: 'tenant-A', roles: ['admin'] }, tenantIsolation: [{ principalTenant: 'tenant-A', resourceTenant: 'tenant-A', allowed: true }, { principalTenant: 'tenant-A', resourceTenant: 'tenant-B', allowed: false }], tenantAuthority: 'platform-validated', provenance: OVERVIEW.provenance },
  '/api/admin/engines': ENGINES,
  '/api/admin/certification': { records: [{ pluginId: 'sector.banking', trustState: 'certified', certified: true, blacklisted: false, determinismVerified: true, manifestHash: 'X', signer: 's' }], provenance: OVERVIEW.provenance },
  '/api/admin/platform': { nodes: [{ nodeId: 'node-a', health: 'healthy' }], ha: { coordinator: 'node-a', nodeCount: 1 }, dr: [], telemetry: [], performance: null, provenance: OVERVIEW.provenance },
  '/api/admin/audit': AUDIT,
  '/api/admin/live-data': { sources: [{ provider: 'p', dataVersion: 'v1', asOf: '2026-08-11T00:00:00Z', quality: 'good', completenessPct: 100, snapshotId: 's' }], note: 'test', provenance: OVERVIEW.provenance },
  '/api/admin/data-governance': { data: [{ dataId: 'd', tenantId: 'tenant-A', classification: 'confidential', region: 'ap-south', retentionDays: 90, immutable: false }], provenance: OVERVIEW.provenance },
  '/api/admin/migration': { migrations: [], provenance: OVERVIEW.provenance },
  '/api/admin/workflow': { workflows: [], provenance: OVERVIEW.provenance },
  '/api/admin/marketplace': { modules: [{ pluginId: 'sector.banking', trustState: 'certified', certified: true, blacklisted: false, determinismVerified: true }], provenance: OVERVIEW.provenance },
} as Record<string, unknown>;

beforeEach(() => {
  globalThis.fetch = vi.fn((input: unknown) => {
    const url = String(input);
    const body = API[url];
    if (body === undefined) return Promise.resolve({ ok: false, status: 404, json: async () => ({}) }) as never;
    return Promise.resolve({ ok: true, status: 200, json: async () => body }) as never;
  }) as never;
});

describe('Administration (read-only governed surfaces)', () => {
  it('renders the Admin overview with platform state, no fabricated admin score', async () => {
    render(<MemoryRouter><Administration /></MemoryRouter>);
    expect(await screen.findByText('Platform Overview')).toBeInTheDocument();
    expect(screen.getByText('OPERATIONAL')).toBeInTheDocument();
    expect(screen.queryByTestId('admin-score')).not.toBeInTheDocument();
  });

  it('renders Identity & Access with governed roles reference and authorities', async () => {
    render(<MemoryRouter><Administration /></MemoryRouter>);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('tab', { name: 'Identity & Access' }));
    expect(await screen.findByText('Keycloak (OIDC)')).toBeInTheDocument();
    expect(screen.getByText('EnterpriseRuntime / ApiSecurity')).toBeInTheDocument();
    expect(screen.getByText('admin-a')).toBeInTheDocument();
  });

  it('renders Engines registry and certification status', async () => {
    render(<MemoryRouter><Administration /></MemoryRouter>);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('tab', { name: 'Engines & Certification' }));
    expect((await screen.findAllByText('sector.banking')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('CERTIFIED').length).toBeGreaterThan(0);
  });

  it('renders Audit viewer with a governed audit record', async () => {
    render(<MemoryRouter><Administration /></MemoryRouter>);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('tab', { name: 'Audit' }));
    expect(await screen.findByText('a1')).toBeInTheDocument();
    expect(screen.getByText('ALLOW')).toBeInTheDocument();
  });

  it('shows unavailable performance rather than fabricating', async () => {
    render(<MemoryRouter><Administration /></MemoryRouter>);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('tab', { name: 'Platform Operations' }));
    expect(await screen.findByText(/Performance measurement unavailable/i)).toBeInTheDocument();
  });

  it('exposes only the governed classification vocabulary in the classify control (no invented vocabulary)', async () => {
    render(<MemoryRouter><Administration /></MemoryRouter>);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('tab', { name: 'Live Data & Governance' }));
    const reclassify = (await screen.findAllByRole('button', { name: 'Reclassify' }))[0];
    await user.click(reclassify);
    const select = await screen.findByLabelText(/New classification/i);
    const options = Array.from(select.querySelectorAll('option')).map((o) => o.value).filter(Boolean);
    expect(options).toEqual(['public', 'internal', 'confidential', 'restricted']);
    expect(options).not.toContain('Approved');
    expect(options).not.toContain('Sensitive');
  });

  it('runs the classification confirmation flow and reports success', async () => {
    const fetchMock = vi.fn((input: unknown) => {
      const url = String(input);
      if (url.includes('/data-governance/classify')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({
          data: { dataId: 'd', tenantId: 'tenant-A', classification: 'restricted', region: 'ap-south', retentionDays: 90, immutable: false },
          auditId: 'audit-9', provenance: OVERVIEW.provenance,
        }) }) as never;
      }
      const body = API[url];
      if (body === undefined) return Promise.resolve({ ok: false, status: 404, json: async () => ({}) }) as never;
      return Promise.resolve({ ok: true, status: 200, json: async () => body }) as never;
    });
    globalThis.fetch = fetchMock as never;

    render(<MemoryRouter><Administration /></MemoryRouter>);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('tab', { name: 'Live Data & Governance' }));
    const reclassify = (await screen.findAllByRole('button', { name: 'Reclassify' }))[0];
    await user.click(reclassify);
    const select = await screen.findByLabelText(/New classification/i);
    await user.selectOptions(select, 'restricted');
    await user.click(screen.getByRole('button', { name: 'Review & Confirm' }));
    expect(screen.getByTestId('classify-confirm')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Confirm Classification Change/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Confirm Classification Change/i }));
    expect(await screen.findByTestId('classify-success')).toHaveTextContent('Classification updated');
    const classifyCall = (fetchMock.mock.calls as Array<[unknown, { body?: string }?]>).find((c) => String(c[0]).includes('/data-governance/classify'));
    expect(JSON.parse(classifyCall?.[1]?.body ?? '{}')).toEqual({ dataId: 'd', classification: 'restricted' });
  });
});

describe('Administration — Phase 13-Hardening (A1/A3)', () => {
  it('A1: active admin tab uses the now-defined --color-accent token', async () => {
    render(<MemoryRouter><Administration /></MemoryRouter>);
    await screen.findByText('Platform Overview');
    expect(screen.getByRole('tab', { name: 'Overview' }).style.background).toBe('var(--color-accent)');
  });

  it('A3: ArrowRight moves to the next admin tab with a correct tab/tabpanel relationship', async () => {
    render(<MemoryRouter><Administration /></MemoryRouter>);
    await screen.findByText('Platform Overview');
    const overview = screen.getByRole('tab', { name: 'Overview' });
    overview.focus();
    fireEvent.keyDown(overview, { key: 'ArrowRight' });
    const identity = screen.getByRole('tab', { name: 'Identity & Access' });
    expect(identity.getAttribute('aria-selected')).toBe('true');
    const panel = screen.getByRole('tabpanel');
    expect(panel.id).toBe(identity.getAttribute('aria-controls'));
    expect(panel.getAttribute('aria-labelledby')).toBe(identity.id);
    await screen.findByText('Keycloak (OIDC)');
  });

  it('A3: roving tabindex — only the active admin tab is tabbable', async () => {
    render(<MemoryRouter><Administration /></MemoryRouter>);
    await screen.findByText('Platform Overview');
    expect(screen.getByRole('tab', { name: 'Overview' }).tabIndex).toBe(0);
    expect(screen.getByRole('tab', { name: 'Audit' }).tabIndex).toBe(-1);
  });

  it('Phase 14: workflow administration surface renders through its tab', async () => {
    render(<MemoryRouter><Administration /></MemoryRouter>);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('tab', { name: 'Migration / Workflow / Marketplace' }));
    expect(await screen.findByRole('heading', { name: 'Workflow definitions (read-only)' })).toBeInTheDocument();
    // Fixture serves an empty workflow list -> governed empty state, never fabricated.
    expect(screen.getByText('No workflow definitions available')).toBeInTheDocument();
  });
});

describe('Administration — Milestone N+1 deep-linking', () => {
  it('opens the Engines tab from the /admin/engines route param', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/engines']}>
        <Routes>
          <Route path="/admin/*" element={<Administration />} />
        </Routes>
      </MemoryRouter>,
    );
    // Engines tab renders both the registry and certification tables (multiple occurrences).
    expect((await screen.findAllByText('sector.banking')).length).toBeGreaterThan(0);
  });

  it('falls back to the Overview tab for an unknown admin segment', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/unknown-segment']}>
        <Routes>
          <Route path="/admin/*" element={<Administration />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByText('Platform Overview')).toBeInTheDocument();
  });
});
