/**
 * Program v3.0 — Phase 14: Governed Workflow Definition Inspection (read-only).
 *
 * Production-grade, read-only inspection of the governed workflow definitions exposed by
 * GET /api/admin/workflow. Presents: workflow identity, version, node count, the declared
 * execution order, expandable node metadata, and provenance.
 *
 * Presentation-only: React renders the governed DTO 1:1. It does NOT infer node
 * relationships (no dependency/feed/requires semantics), does not validate workflow
 * meaning, and exposes no mutation, execution, approval, or configuration.
 */
import { useState } from 'react';
import { DataTable, type Column } from '../../components/data/DataComponents';
import { ProvenanceChain } from '../../components/evidence/EvidenceExplorerComponents';
import type { AdminWorkflow, WorkflowRef } from '../../api/admin';

const subHeading = {
  fontSize: 13,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: 'var(--color-ink-secondary)',
} as const;

export function WorkflowDefinitionPanel({ workflow }: { workflow: AdminWorkflow }) {
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());

  function toggle(workflowId: string): void {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(workflowId)) next.delete(workflowId);
      else next.add(workflowId);
      return next;
    });
  }

  const columns: readonly Column<WorkflowRef>[] = [
    { key: 'id', header: 'Workflow ID', render: (r) => <code>{r.workflowId}</code> },
    { key: 'version', header: 'Version', render: (r) => r.version },
    { key: 'nodes', header: 'Nodes', render: (r) => r.nodes.length },
    { key: 'order', header: 'Order', render: (r) => (r.order.length > 0 ? r.order.join(' → ') : 'not declared') },
    {
      key: 'details',
      header: 'Details',
      render: (r) => {
        const isOpen = expanded.has(r.workflowId);
        return (
          <button
            type="button"
            aria-expanded={isOpen}
            aria-controls={`${r.workflowId}-details`}
            onClick={() => toggle(r.workflowId)}
          >
            {isOpen ? `Collapse workflow ${r.workflowId}` : `Expand workflow ${r.workflowId}`}
          </button>
        );
      },
    },
  ];

  const expandedWorkflows = workflow.workflows.filter((w) => expanded.has(w.workflowId));

  return (
    <section aria-label="Workflow definitions">
      <h4 style={{ marginTop: 24, ...subHeading }}>Workflow definitions (read-only)</h4>

      <DataTable columns={columns} rows={workflow.workflows} emptyLabel="No workflow definitions available" />

      {expandedWorkflows.map((w) => (
        <div
          key={w.workflowId}
          id={`${w.workflowId}-details`}
          data-testid={`workflow-detail-${w.workflowId}`}
          role="region"
          aria-label={`Workflow ${w.workflowId} details`}
          style={{ marginTop: 12, border: '1px solid var(--color-border)', borderRadius: 6, padding: 12, background: 'var(--color-surface-1)' }}
        >
          <h5 style={{ margin: '0 0 8px', fontSize: 14 }}>
            Workflow: <code>{w.workflowId}</code> · Version: {w.version}
          </h5>

          <h5 style={{ margin: '12px 0 4px', ...subHeading }}>Execution Order</h5>
          {w.order.length > 0 ? (
            <ol data-testid={`workflow-order-${w.workflowId}`} style={{ margin: '0 0 12px', paddingLeft: 20, fontSize: 13 }}>
              {w.order.map((nodeId, i) => <li key={i}><code>{nodeId}</code></li>)}
            </ol>
          ) : (
            <p style={{ fontSize: 13 }}>No execution order declared</p>
          )}

          <h5 style={{ margin: '12px 0 4px', ...subHeading }}>Nodes</h5>
          <DataTable
            columns={[
              { key: 'id', header: 'ID', render: (n) => <code>{n.id}</code> },
              { key: 'type', header: 'Type', render: (n) => n.type },
              { key: 'capability', header: 'Capability', render: (n) => n.capability },
            ]}
            rows={w.nodes}
            emptyLabel="No nodes declared"
          />
        </div>
      ))}

      <div data-testid="workflow-provenance" style={{ marginTop: 12, fontSize: 12, color: 'var(--color-ink-secondary)' }}>
        <ProvenanceChain
          items={[
            { key: 'source', value: workflow.provenance.dataSource },
            { key: 'freshness', value: workflow.provenance.freshness },
            { key: 'authority', value: workflow.provenance.authority },
            { key: 'semantics', value: workflow.provenance.transportSemantics },
          ]}
        />
      </div>
    </section>
  );
}
