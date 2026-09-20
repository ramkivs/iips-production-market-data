/**
 * Program v3.0 — Sidebar (global navigation).
 * Role-aware; reflects platform RBAC (admin-only surfaces hidden for lower roles).
 *
 * Milestone N: renders a small presentation-only status label for surfaces that are not
 * fully implemented, so a route's presence is not mistaken for a complete module.
 *
 * Milestone N+1: renders child entries (deep-linkable) with their own honest status
 * labels. All labels sit OUTSIDE the link (never inside its accessible name) and are
 * display-only — not a permission or authorization signal.
 *
 * Milestone N+17: future-only children render as non-navigable text with a Future badge —
 * never links to placeholder surfaces. Implemented and partial surfaces remain links.
 *
 * P14-R7: structured visual navigation hierarchy and semantic status badge presentation.
 */
import { NavLink } from 'react-router-dom';
import { visibleNav, NAV_STATUS_LABEL, type NavItem, type NavStatus } from './navigation';
import { useSession } from '../core/session/SessionContext';

const topLinkStyle = {
  display: 'block',
  flex: 1,
  padding: '8px 12px',
  textDecoration: 'none',
  borderRadius: '4px',
  fontSize: 14,
  transition: 'background 0.12s ease, color 0.12s ease',
} as const;

const childLinkStyle = {
  display: 'block',
  flex: 1,
  padding: '5px 12px',
  fontSize: 13,
  textDecoration: 'none',
  borderRadius: '4px',
  transition: 'background 0.12s ease, color 0.12s ease',
} as const;

function StatusBadge({ label, status }: { label: string; status: NavStatus }) {
  if (status === 'implemented') return null;
  const isPartial = status === 'partial';
  return (
    <span
      data-testid={`nav-status-${label}`}
      className={`nav-status-badge ${isPartial ? 'nav-status-partial' : 'nav-status-future'}`}
      style={{
        fontSize: 10,
        fontWeight: 600,
        padding: '1px 6px',
        border: `1px solid ${isPartial ? 'var(--color-status-warning)' : 'var(--color-border)'}`,
        borderRadius: 4,
        color: isPartial ? 'var(--color-status-warning)' : 'var(--color-ink-muted)',
        background: 'var(--color-surface-0)',
        whiteSpace: 'nowrap',
        letterSpacing: '0.03em',
        lineHeight: 1.4,
      }}
    >
      {NAV_STATUS_LABEL[status]}
    </span>
  );
}

function NavRow({ item, child = false }: { item: NavItem; child?: boolean }) {
  const base = child ? childLinkStyle : topLinkStyle;
  // N+17: future-only surfaces are honest markers — non-navigable text, never a link.
  const isFuture = item.status === 'future';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {isFuture ? (
        <span
          data-testid={`nav-future-${item.label}`}
          style={{
            ...base,
            color: 'var(--color-ink-muted)',
            borderLeft: '3px solid transparent',
          }}
        >
          {item.label}
        </span>
      ) : (
        <NavLink
          to={item.path}
          style={({ isActive }) => ({
            ...base,
            color: isActive ? 'var(--color-ink)' : 'var(--color-ink-secondary)',
            background: isActive ? 'var(--color-surface-2)' : 'transparent',
            fontWeight: isActive ? 600 : 400,
            borderLeft: isActive ? '3px solid var(--color-accent)' : '3px solid transparent',
          })}
        >
          {item.label}
        </NavLink>
      )}
      {item.status && <StatusBadge label={item.label} status={item.status} />}
    </div>
  );
}

export function Sidebar() {
  const { session } = useSession();
  const items = visibleNav(session.role);

  return (
    <nav aria-label="Main Navigation">
      <ul className="app-nav">
        {items.map((item) => (
          <li key={item.path} style={{ marginBottom: 2 }}>
            <NavRow item={item} />
            {item.children && item.children.length > 0 && (
              <ul
                style={{
                  listStyle: 'none',
                  margin: '3px 0 6px 14px',
                  paddingLeft: 10,
                  borderLeft: '1px solid var(--color-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                {item.children.map((child) => (
                  <li key={child.path}>
                    <NavRow item={child} child />
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
