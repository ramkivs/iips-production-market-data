/**
 * Program v3.0 — Phase 14: WorkflowDefinitionPanel tests (deterministic, no network).
 *
 * Covers rendering, expansion (click + keyboard), independence, states, provenance,
 * accessibility (accessible names, real buttons), and the read-only boundary.
 */
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkflowDefinitionPanel } from './WorkflowDefinitionPanel';
import type { AdminWorkflow } from '../../api/admin';

const PROVENANCE = {
  dataSource: 'governed DeterministicWorkflow definitions',
  freshness: 'SNAPSHOT',
  authority: 'PLATFORM',
  transportSemantics: 'read-only definitions; no edit/approval',
} as const;

const FIXTURE: AdminWorkflow = {
  workflows: [
    {
      workflowId: 'portfolio-review',
      version: '1.2',
      nodes: [
        { id: 'validate', type: 'validator', capability: 'validation' },
        { id: 'enrich', type: 'transformer', capability: 'enrichment' },
        { id: 'score', type: 'engine', capability: 'scoring' },
        { id: 'publish', type: 'publisher', capability: 'publication' },
      ],
      order: ['validate', 'enrich', 'score', 'publish'],
    },
    {
      workflowId: 'risk-review',
      version: '2.0',
      nodes: [
        { id: 'assess', type: 'validator', capability: 'risk-assessment' },
        { id: 'mitigate', type: 'engine', capability: 'mitigation' },
      ],
      order: ['assess', 'mitigate'],
    },
  ],
  provenance: PROVENANCE,
};

const EMPTY: AdminWorkflow = { workflows: [], provenance: PROVENANCE };

describe('WorkflowDefinitionPanel — rendering', () => {
  it('renders workflow IDs, versions, node counts, and declared order', () => {
    render(<WorkflowDefinitionPanel workflow={FIXTURE} />);
    expect(screen.getByRole('heading', { name: 'Workflow definitions (read-only)' })).toBeInTheDocument();

    const summary = screen.getByTestId('data-table');
    expect(within(summary).getByText('portfolio-review')).toBeInTheDocument();
    expect(within(summary).getByText('risk-review')).toBeInTheDocument();
    expect(within(summary).getByText('1.2')).toBeInTheDocument();
    expect(within(summary).getByText('2.0')).toBeInTheDocument();
    expect(within(summary).getByText('4')).toBeInTheDocument(); // portfolio-review node count
    expect(within(summary).getByText('2')).toBeInTheDocument(); // risk-review node count
    expect(within(summary).getByText('validate → enrich → score → publish')).toBeInTheDocument();
    expect(within(summary).getByText('assess → mitigate')).toBeInTheDocument();
  });

  it('exposes expand controls as real buttons with accessible names', () => {
    render(<WorkflowDefinitionPanel workflow={FIXTURE} />);
    const expandA = screen.getByRole('button', { name: 'Expand workflow portfolio-review' });
    const expandB = screen.getByRole('button', { name: 'Expand workflow risk-review' });
    expect(expandA.getAttribute('aria-expanded')).toBe('false');
    expect(expandB.getAttribute('aria-expanded')).toBe('false');
  });
});

describe('WorkflowDefinitionPanel — expansion', () => {
  it('starts collapsed', () => {
    render(<WorkflowDefinitionPanel workflow={FIXTURE} />);
    expect(screen.queryByTestId('workflow-detail-portfolio-review')).not.toBeInTheDocument();
  });

  it('click expands and reveals node metadata + execution order', async () => {
    const user = userEvent.setup();
    render(<WorkflowDefinitionPanel workflow={FIXTURE} />);
    await user.click(screen.getByRole('button', { name: 'Expand workflow portfolio-review' }));

    const detail = screen.getByTestId('workflow-detail-portfolio-review');
    expect(detail).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Collapse workflow portfolio-review' }).getAttribute('aria-expanded')).toBe('true');

    expect(within(detail).getByText('Execution Order')).toBeInTheDocument();
    expect(screen.getByTestId('workflow-order-portfolio-review').querySelectorAll('li')).toHaveLength(4);

    // Node metadata (ID / Type / Capability).
    for (const text of ['validator', 'transformer', 'engine', 'publisher', 'validation', 'enrichment', 'scoring', 'publication']) {
      expect(within(detail).getByText(text)).toBeInTheDocument();
    }
  });

  it('click collapses the workflow again', async () => {
    const user = userEvent.setup();
    render(<WorkflowDefinitionPanel workflow={FIXTURE} />);
    await user.click(screen.getByRole('button', { name: 'Expand workflow portfolio-review' }));
    await user.click(screen.getByRole('button', { name: 'Collapse workflow portfolio-review' }));
    expect(screen.queryByTestId('workflow-detail-portfolio-review')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expand workflow portfolio-review' }).getAttribute('aria-expanded')).toBe('false');
  });

  it('keyboard Enter activates expansion', async () => {
    const user = userEvent.setup();
    render(<WorkflowDefinitionPanel workflow={FIXTURE} />);
    const button = screen.getByRole('button', { name: 'Expand workflow portfolio-review' });
    button.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByTestId('workflow-detail-portfolio-review')).toBeInTheDocument();
  });

  it('multiple workflows expand and collapse independently', async () => {
    const user = userEvent.setup();
    render(<WorkflowDefinitionPanel workflow={FIXTURE} />);
    await user.click(screen.getByRole('button', { name: 'Expand workflow portfolio-review' }));
    await user.click(screen.getByRole('button', { name: 'Expand workflow risk-review' }));
    expect(screen.getByTestId('workflow-detail-portfolio-review')).toBeInTheDocument();
    expect(screen.getByTestId('workflow-detail-risk-review')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Collapse workflow portfolio-review' }));
    expect(screen.queryByTestId('workflow-detail-portfolio-review')).not.toBeInTheDocument();
    expect(screen.getByTestId('workflow-detail-risk-review')).toBeInTheDocument();
  });
});

describe('WorkflowDefinitionPanel — states & provenance', () => {
  it('renders a governed empty state for no workflows (no fabrication)', () => {
    render(<WorkflowDefinitionPanel workflow={EMPTY} />);
    expect(screen.getByTestId('data-table-empty')).toHaveTextContent('No workflow definitions available');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders workflow provenance (source, freshness, authority, semantics)', () => {
    render(<WorkflowDefinitionPanel workflow={FIXTURE} />);
    const provenance = screen.getByTestId('workflow-provenance');
    expect(provenance).toHaveTextContent('governed DeterministicWorkflow definitions');
    expect(provenance).toHaveTextContent('SNAPSHOT');
    expect(provenance).toHaveTextContent('PLATFORM');
    expect(provenance).toHaveTextContent('read-only definitions; no edit/approval');
  });

  it('exposes no mutation/execution controls (read-only boundary)', () => {
    render(<WorkflowDefinitionPanel workflow={FIXTURE} />);
    const forbidden = screen.queryByRole('button', {
      name: /create|edit|delete|enable|disable|execute|approve|publish|clone/i,
    });
    expect(forbidden).not.toBeInTheDocument();
  });
});
