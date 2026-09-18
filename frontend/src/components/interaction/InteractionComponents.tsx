/**
 * Program v3.0 — Phase 4: Interaction components (presentation-only).
 *
 * Modal, Drawer, Tabs, Accordion, Search, Pagination, FilterBar. Accessible, token-driven,
 * data-source agnostic. No business logic.
 */
import { useState, type ReactNode } from 'react';
import { useDialogFocus } from './useDialogFocus';
import { useTabList } from './useTabList';

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const containerRef = useDialogFocus<HTMLDivElement>(open, onClose);
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label={title} data-testid="modal" tabIndex={-1} ref={containerRef} style={{ position: 'fixed', inset: 0, background: 'rgba(11,27,43,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ background: 'var(--color-surface-0)', borderRadius: 6, boxShadow: 'var(--elev-3)', padding: 24, width: 480, maxWidth: '90vw' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}><strong>{title}</strong><button type="button" onClick={onClose} aria-label="Close">✕</button></div>
        {children}
      </div>
    </div>
  );
}

export function Drawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const containerRef = useDialogFocus<HTMLDivElement>(open, onClose);
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label={title} data-testid="drawer" tabIndex={-1} ref={containerRef} style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 'min(420px, 100vw)', background: 'var(--color-surface-0)', boxShadow: 'var(--elev-3)', padding: 24, zIndex: 150, overflow: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}><strong>{title}</strong><button type="button" onClick={onClose} aria-label="Close">✕</button></div>
      {children}
    </div>
  );
}

export function Tabs({ tabs, active, onChange }: { tabs: readonly string[]; active: string; onChange: (tab: string) => void }) {
  const { tabProps, onKeyDown } = useTabList(tabs, active, onChange);
  return (
    <div data-testid="tabs" role="tablist" onKeyDown={onKeyDown} style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--color-border)' }}>
      {tabs.map((t, i) => (
        <button key={t} type="button" {...tabProps(t, i)} style={{ padding: '8px 12px', border: 'none', borderBottom: t === active ? '2px solid var(--color-status-informational)' : '2px solid transparent', background: 'transparent', color: t === active ? 'var(--color-ink)' : 'var(--color-ink-secondary)', fontWeight: t === active ? 600 : 400 }}>
          {t}
        </button>
      ))}
    </div>
  );
}

export function Accordion({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div data-testid="accordion" style={{ border: '1px solid var(--color-border)', borderRadius: 6 }}>
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} style={{ width: '100%', textAlign: 'left', padding: '12px', background: 'var(--color-surface-1)', border: 'none', fontWeight: 600 }}>{open ? '▾' : '▸'} {title}</button>
      {open && <div style={{ padding: '12px' }}>{children}</div>}
    </div>
  );
}

export function Search({ label = 'Search', placeholder, onSearch }: { label?: string; placeholder?: string; onSearch?: (q: string) => void }) {
  const [q, setQ] = useState('');
  return (
    <label data-testid="search" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span>{label}</span>
      <input
        type="search"
        value={q}
        placeholder={placeholder}
        onChange={(e) => { setQ(e.target.value); onSearch?.(e.target.value); }}
        style={{ padding: '6px 8px', border: '1px solid var(--color-border)', borderRadius: 4, background: 'var(--color-surface-0)' }}
      />
    </label>
  );
}

export function Pagination({ page, pageCount, onPage }: { page: number; pageCount: number; onPage: (p: number) => void }) {
  return (
    <nav data-testid="pagination" aria-label="Pagination" style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
      <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)}>‹ Prev</button>
      <span>Page {page} of {pageCount}</span>
      <button type="button" disabled={page >= pageCount} onClick={() => onPage(page + 1)}>Next ›</button>
    </nav>
  );
}

export interface FilterOption { readonly value: string; readonly label: string; }

export function FilterBar({ options, selected, onChange }: { options: readonly FilterOption[]; selected: string; onChange: (v: string) => void }) {
  return (
    <div data-testid="filter-bar" role="group" aria-label="Filters" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={selected === o.value} onClick={() => onChange(o.value)} style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid var(--color-border)', background: selected === o.value ? 'var(--color-surface-2)' : 'var(--color-surface-1)' }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
