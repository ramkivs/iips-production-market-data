/**
 * Program v3.0 — Phase 14: AdminOperations surface tests (deterministic, no network).
 *
 * Covers the governed loading / error / empty / display states at the
 * Migration / Workflow / Marketplace administration surface.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdminOperations } from './AdminOperations';
import type { AdminMigration, AdminWorkflow, AdminMarketplace } from '../../api/admin';

const PROVENANCE = {
  dataSource: 'governed DeterministicWorkflow definitions',
  freshness: 'SNAPSHOT',
  authority: 'PLATFORM',
  transportSemantics: 'read-only definitions; no edit/approval',
} as const;

const MIGRATION: AdminMigration = { migrations: [], provenance: PROVENANCE };
const MARKETPLACE: AdminMarketplace = { modules: [], provenance: PROVENANCE };
const WORKFLOW: AdminWorkflow = {
  workflows: [
    {
      workflowId: 'portfolio-review',
      version: '1.2',
      nodes: [{ id: 'validate', type: 'validator', capability: 'validation' }],
      order: ['validate'],
    },
  ],
  provenance: PROVENANCE,
};

function routeMock(routes: Record<string, unknown>): ReturnType<typeof vi.fn> {
  return vi.fn((input: unknown) => {
    const url = String(input);
    const key = Object.keys(routes).find((k) => url.endsWith(k));
    const body = key ? routes[key] : undefined;
    if (body === undefined) return Promise.reject(new Error(`unmocked ${url}`)) as never;
    return Promise.resolve({ ok: true, json: async () => body }) as never;
  });
}

describe('AdminOperations — states', () => {
  it('renders the governed loading state while requests are pending', () => {
    globalThis.fetch = vi.fn(() => new Promise(() => {})) as never;
    render(<AdminOperations />);
    expect(screen.getByTestId('state-loading')).toBeInTheDocument();
  });

  it('renders the governed error state on API failure (no raw exception leak)', async () => {
    globalThis.fetch = vi.fn(() => Promise.reject(new Error('workflow transport failed'))) as never;
    render(<AdminOperations />);
    const error = await screen.findByTestId('state-error');
    expect(error).toHaveTextContent('workflow transport failed');
    // The error state never exposes stack traces or URLs.
    expect(error).not.toHaveTextContent('at ');
    expect(error).not.toHaveTextContent('http');
  });

  it('renders governed empty states for empty migration/workflow/marketplace', async () => {
    globalThis.fetch = routeMock({ '/migration': MIGRATION, '/workflow': { workflows: [], provenance: PROVENANCE }, '/marketplace': MARKETPLACE }) as never;
    render(<AdminOperations />);
    expect(await screen.findByText('No workflow definitions available')).toBeInTheDocument();
    expect(screen.getByText('No migration history available')).toBeInTheDocument();
    expect(screen.getByText('No modules registered')).toBeInTheDocument();
  });

  it('renders the workflow display when definitions exist', async () => {
    globalThis.fetch = routeMock({ '/migration': MIGRATION, '/workflow': WORKFLOW, '/marketplace': MARKETPLACE }) as never;
    render(<AdminOperations />);
    expect(await screen.findByText('portfolio-review')).toBeInTheDocument();
  });
});
