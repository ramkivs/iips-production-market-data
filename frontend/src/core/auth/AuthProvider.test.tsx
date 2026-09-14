/**
 * Program v3.0 — Browser Authentication Integration: AuthProvider tests.
 *
 * Deterministic: mocks the oidcClient module (real deriveSession is exercised against
 * crafted token claims). Covers session derivation (with ACCESS-token role precedence),
 * role mapping, authenticated / unauthenticated states, sign-in invocation, and 401
 * re-authentication transition.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import * as oidc from './oidcClient';
import { AuthProvider, deriveSession } from './AuthProvider';
import { useSession } from '../session/SessionContext';
import type { TokenSet } from './oidcClient';

vi.mock('./oidcClient', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./oidcClient')>();
  return {
    ...actual,
    isCallbackUrl: vi.fn(() => false),
    hasSession: vi.fn(() => false),
    getTokens: vi.fn(() => null),
    beginLogin: vi.fn(async () => {}),
    completeLogin: vi.fn(async () => ({ accessToken: 'at', idToken: null, refreshToken: null, expiresAt: 0 })),
    takeReturnTo: vi.fn(() => null),
    logout: vi.fn(async () => {}),
    getAccessToken: vi.fn(async () => null),
  };
});

function b64url(obj: unknown): string {
  return btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function makeJwt(payload: Record<string, unknown>): string {
  return `${b64url({ alg: 'RS256', typ: 'JWT' })}.${b64url(payload)}.sig`;
}

/**
 * Build a TokenSet whose ACCESS token carries the given claims (matching real Keycloak,
 * where realm_access.roles is an access-token claim). An optional id_token payload can be
 * supplied; by default there is no id_token (as in the authorization-code response where
 * the ID token is optional/omitted).
 */
function tokenWith(accessPayload: Record<string, unknown>, idPayload?: Record<string, unknown>): TokenSet {
  return {
    accessToken: makeJwt(accessPayload),
    idToken: idPayload ? makeJwt(idPayload) : null,
    refreshToken: 'rt',
    expiresAt: Math.floor(Date.now() / 1000) + 300,
  };
}

function SessionProbe() {
  const { session } = useSession();
  return <span data-testid="probe">{`${session.userId}:${session.role}:${session.tenantId}`}</span>;
}

/** Reveals the router's current pathname so we can assert post-login navigation. */
function LocationProbe() {
  const location = useLocation();
  return <span data-testid="loc">{location.pathname}</span>;
}

const mocks = vi.mocked(oidc, true);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isCallbackUrl.mockReturnValue(false);
  mocks.hasSession.mockReturnValue(false);
  mocks.getTokens.mockReturnValue(null);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('deriveSession — role mapping (access-token precedence)', () => {
  it('access token with iips-admin → role: admin', () => {
    const s = deriveSession(tokenWith({ realm_access: { roles: ['iips-admin'] } }));
    expect(s.role).toBe('admin');
    expect(s.roles).toEqual(['admin']);
  });

  it('access token with iips-analyst → role: analyst', () => {
    expect(deriveSession(tokenWith({ realm_access: { roles: ['iips-analyst'] } })).role).toBe('analyst');
  });

  it('access token with iips-viewer → role: viewer', () => {
    expect(deriveSession(tokenWith({ realm_access: { roles: ['iips-viewer'] } })).role).toBe('viewer');
  });

  it('ID token without realm_access, but access token with iips-admin → role: admin', () => {
    const s = deriveSession(
      tokenWith(
        { preferred_username: 'admin-a', tenant: 'tenant-A', realm_access: { roles: ['iips-admin'] } },
        { preferred_username: 'admin-a', tenant: 'tenant-A' }, // id_token carries NO realm_access
      ),
    );
    expect(s.role).toBe('admin');
    expect(s.userId).toBe('admin-a');
    expect(s.tenantId).toBe('tenant-A');
  });

  it('no recognized role → existing safe viewer fallback', () => {
    const s = deriveSession(tokenWith({ sub: 'u1' }));
    expect(s.role).toBe('viewer');
    expect(s.roles).toEqual(['viewer']);
  });

  it('derives identity + tenant alongside the role', () => {
    const s = deriveSession(
      tokenWith({ preferred_username: 'admin-a', sub: 'u1', tenant: 'tenant-A', realm_access: { roles: ['iips-admin'] } }),
    );
    expect(s.userId).toBe('admin-a');
    expect(s.tenantId).toBe('tenant-A');
    expect(s.authenticated).toBe(true);
  });

  it('returns the anonymous session for null tokens', () => {
    const s = deriveSession(null);
    expect(s.authenticated).toBe(false);
    expect(s.role).toBe('viewer');
  });
});

describe('AuthProvider states', () => {
  it('renders the sign-in screen when unauthenticated', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <SessionProbe />
        </AuthProvider>
      </MemoryRouter>,
    );
    expect(await screen.findByText(/Sign in with Keycloak/)).toBeInTheDocument();
  });

  it('invokes login (beginLogin) when sign-in is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AuthProvider>
          <SessionProbe />
        </AuthProvider>
      </MemoryRouter>,
    );
    await user.click(await screen.findByRole('button', { name: /Sign in with Keycloak/ }));
    expect(mocks.beginLogin).toHaveBeenCalledTimes(1);
  });

  it('renders children with a derived session when authenticated', async () => {
    mocks.hasSession.mockReturnValue(true);
    mocks.getTokens.mockReturnValue(
      tokenWith({ preferred_username: 'admin-a', sub: 'u1', tenant: 'tenant-A', realm_access: { roles: ['iips-admin'] } }),
    );
    render(
      <MemoryRouter>
        <AuthProvider>
          <SessionProbe />
        </AuthProvider>
      </MemoryRouter>,
    );
    expect(await screen.findByTestId('probe')).toHaveTextContent('admin-a:admin:tenant-A');
  });

  it('transitions to the sign-in screen on a 401 event', async () => {
    mocks.hasSession.mockReturnValue(true);
    mocks.getTokens.mockReturnValue(
      tokenWith({ preferred_username: 'analyst-a', sub: 'u1', tenant: 'tenant-A', realm_access: { roles: ['iips-analyst'] } }),
    );
    render(
      <MemoryRouter>
        <AuthProvider>
          <SessionProbe />
        </AuthProvider>
      </MemoryRouter>,
    );
    expect(await screen.findByTestId('probe')).toHaveTextContent('analyst-a:analyst');
    fireEvent(window, new CustomEvent('iips:auth:unauthorized'));
    expect(await screen.findByText(/Sign in with Keycloak/)).toBeInTheDocument();
  });
});

describe('AuthProvider — post-login destination restoration (N+1A)', () => {
  beforeEach(() => {
    mocks.isCallbackUrl.mockReturnValue(true);
    mocks.hasSession.mockReturnValue(false);
    mocks.getTokens.mockReturnValue(
      tokenWith({ preferred_username: 'admin-a', sub: 'u1', tenant: 'tenant-A', realm_access: { roles: ['iips-admin'] } }),
    );
  });

  function renderCallback() {
    return render(
      <MemoryRouter initialEntries={['/callback?code=abc&state=s']}>
        <AuthProvider>
          <LocationProbe />
        </AuthProvider>
      </MemoryRouter>,
    );
  }

  it('restores /admin/engines after a successful callback', async () => {
    mocks.takeReturnTo.mockReturnValue('/admin/engines');
    renderCallback();
    expect(await screen.findByTestId('loc')).toHaveTextContent('/admin/engines');
  });

  it('restores /admin/tenants after a successful callback', async () => {
    mocks.takeReturnTo.mockReturnValue('/admin/tenants');
    renderCallback();
    expect(await screen.findByTestId('loc')).toHaveTextContent('/admin/tenants');
  });

  it('restores /admin/audit after a successful callback', async () => {
    mocks.takeReturnTo.mockReturnValue('/admin/audit');
    renderCallback();
    expect(await screen.findByTestId('loc')).toHaveTextContent('/admin/audit');
  });

  it('restores another valid same-origin deep link', async () => {
    mocks.takeReturnTo.mockReturnValue('/evidence/abc');
    renderCallback();
    expect(await screen.findByTestId('loc')).toHaveTextContent('/evidence/abc');
  });

  it('falls back to /executive when no return destination exists', async () => {
    mocks.takeReturnTo.mockReturnValue(null);
    renderCallback();
    expect(await screen.findByTestId('loc')).toHaveTextContent('/executive');
  });
});
