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
 * P14-R7: INT-017 target visual convergence (dedicated SVG route icons, active item
 * solid accent treatment, structured nested tree hierarchy, and collapse footer affordance).
 * P14-R7 Responsive Remediation: reflows from permanent desktop 240px canvas to responsive horizontal
 * navigation at tablet and mobile viewports with content-driven compact mobile height.
 */
import { NavLink } from 'react-router-dom';
import { visibleNav, NAV_STATUS_LABEL, type NavItem, type NavStatus } from './navigation';
import { useSession } from '../core/session/SessionContext';

function NavIcon({ label, active = false }: { label: string; active?: boolean }) {
  const color = active ? '#FFFFFF' : 'currentColor';
  switch (label) {
    case 'Executive':
    case 'Dashboard':
      return (
        <svg className="sidebar-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      );
    case 'Company':
    case 'Company Workspace':
      return (
        <svg className="sidebar-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 21h18M3 7v14M21 7v14M7 21V3h10v18M10 7h4M10 11h4M10 15h4" />
        </svg>
      );
    case 'Portfolio':
      return (
        <svg className="sidebar-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
          <path d="M22 12A10 10 0 0 0 12 2v10z" />
        </svg>
      );
    case 'Research':
      return (
        <svg className="sidebar-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      );
    case 'Decision Center':
    case 'Intelligence':
      return (
        <svg className="sidebar-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
    case 'Screener':
      return (
        <svg className="sidebar-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
      );
    case 'Watchlists':
      return (
        <svg className="sidebar-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      );
    case 'Reports':
      return (
        <svg className="sidebar-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      );
    case 'Alerts':
      return (
        <svg className="sidebar-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      );
    case 'Collaboration':
      return (
        <svg className="sidebar-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case 'Administration':
      return (
        <svg className="sidebar-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    case 'Settings':
      return (
        <svg className="sidebar-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="4" y1="21" x2="4" y2="14" />
          <line x1="4" y1="10" x2="4" y2="3" />
          <line x1="12" y1="21" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12" y2="3" />
          <line x1="20" y1="21" x2="20" y2="16" />
          <line x1="20" y1="12" x2="20" y2="3" />
          <line x1="1" y1="14" x2="7" y2="14" />
          <line x1="9" y1="8" x2="15" y2="8" />
          <line x1="17" y1="16" x2="23" y2="16" />
        </svg>
      );
    default:
      return null;
  }
}

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
  const isFuture = item.status === 'future';
  const padding = child ? '5px 12px' : '8px 12px';
  const fontSize = child ? 13 : 14;

  return (
    <div className="sidebar-nav-row" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {isFuture ? (
        <span
          data-testid={`nav-future-${item.label}`}
          className="sidebar-future-label"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flex: 1,
            padding,
            fontSize,
            borderRadius: 6,
            color: 'var(--color-ink-muted)',
          }}
        >
          <NavIcon label={item.label} />
          <span>{item.label}</span>
        </span>
      ) : (
        <NavLink
          to={item.path}
          className="sidebar-nav-link"
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flex: 1,
            padding,
            fontSize,
            borderRadius: 6,
            textDecoration: 'none',
            color: isActive ? '#FFFFFF' : 'var(--color-ink-secondary)',
            background: isActive ? 'var(--color-accent)' : 'transparent',
            fontWeight: isActive ? 600 : 400,
            transition: 'background 0.12s ease, color 0.12s ease',
          })}
        >
          {({ isActive }) => (
            <>
              <NavIcon label={item.label} active={isActive} />
              <span>{item.label}</span>
            </>
          )}
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
    <nav aria-label="Main Navigation" className="app-sidebar-nav">
      <ul className="app-nav">
        {items.map((item) => (
          <li key={item.path} className="sidebar-nav-item">
            <NavRow item={item} />
            {item.children && item.children.length > 0 && (
              <ul className="sidebar-child-list">
                {item.children.map((child) => (
                  <li key={child.path} className="sidebar-child-item">
                    <NavRow item={child} child />
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>

      {/* Target collapse visual affordance */}
      <div className="sidebar-collapse-affordance" aria-hidden="true">
        <span>⟨</span>
        <span>Collapse</span>
      </div>
    </nav>
  );
}
