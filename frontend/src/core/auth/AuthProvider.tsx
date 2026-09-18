/**
 * Program v3.0 — Browser Authentication Integration: AuthProvider.
 *
 * Replaces the hardcoded demo session with the governed Keycloak session:
 *   loading → authenticated(session) | unauthenticated | error
 *
 * Responsibilities:
 *   - handle the OIDC callback (code → token exchange) on mount
 *   - derive a DISPLAY session from the verified-token claims (userId, tenant, role)
 *   - expose login() / logout() / getAccessToken()
 *   - react to 401 (→ re-authentication) via the iips:auth:unauthorized event
 *   - render the existing SessionProvider so every useSession() consumer keeps working
 *
 * AUTHORITY BOUNDARY: this provider derives a PRESENTATION session from token claims
 * for navigation/display only. It is NOT an authorization authority — the server
 * (SecuredExecutor → EnterpriseRuntime) remains authoritative for tenant and RBAC.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { SessionProvider } from '../session/SessionContext';
import { ANONYMOUS_SESSION, type Role, type Session } from '../session/session';
import { mapKeycloakRoles } from './keycloakAdapter';
import {
  beginLogin,
  completeLogin,
  decodeJwtPayload,
  getAccessToken as getToken,
  getTokens,
  hasSession,
  isCallbackUrl,
  logout as oidcLogout,
  takeReturnTo,
  type TokenSet,
} from './oidcClient';
import { LoadingState, ErrorState } from '../../components/state/StateComponents';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error';

export interface AuthContextValue {
  readonly status: AuthStatus;
  readonly session: Session;
  readonly login: () => Promise<void>;
  readonly logout: () => Promise<void>;
  readonly getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue>({
  status: 'unauthenticated',
  session: ANONYMOUS_SESSION,
  login: async () => {},
  logout: async () => {},
  getAccessToken: async () => null,
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

interface IdClaims {
  readonly preferred_username?: string;
  readonly sub?: string;
  readonly tenant?: string;
  readonly [key: string]: unknown;
}

const ROLE_PRIORITY: readonly Role[] = ['admin', 'analyst', 'viewer'];

function primaryRole(roles: Role[]): Role {
  return ROLE_PRIORITY.find((r) => roles.includes(r)) ?? 'viewer';
}

/** Derive a DISPLAY session from in-memory token claims (never authoritative). */
export function deriveSession(tokens: TokenSet | null): Session {
  if (!tokens) return ANONYMOUS_SESSION;
  // Keycloak places realm_access.roles in the ACCESS token (the id_token does not
  // carry it by default), so claims are read from the access token first.
  const source = tokens.accessToken ?? tokens.idToken;
  let claims: IdClaims = {};
  if (source) {
    try {
      claims = decodeJwtPayload<IdClaims>(source);
    } catch {
      /* undecodable claims → anonymous defaults */
    }
  }
  const roles = mapKeycloakRoles(claims);
  return {
    userId: claims.preferred_username ?? claims.sub ?? 'unknown',
    tenantId: typeof claims.tenant === 'string' ? claims.tenant : 'unassigned',
    role: primaryRole(roles),
    roles,
    authenticated: true,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [session, setSession] = useState<Session>(ANONYMOUS_SESSION);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (isCallbackUrl(window.location)) {
          if (!hasSession()) {
            await completeLogin(window.location.href);
          }
          if (cancelled) return;
          setSession(deriveSession(getTokens()));
          setStatus('authenticated');
          // Restore the sanitized same-origin destination; /executive is the safe fallback.
          const returnTo = takeReturnTo();
          navigate(returnTo ?? '/executive', { replace: true });
        } else if (hasSession()) {
          if (cancelled) return;
          setSession(deriveSession(getTokens()));
          setStatus('authenticated');
        } else {
          if (cancelled) return;
          setStatus('unauthenticated');
        }
      } catch (e) {
        if (!cancelled) {
          setError(String(e));
          setStatus('error');
        }
      }
    })();

    function onUnauthorized(): void {
      setSession(ANONYMOUS_SESSION);
      setStatus('unauthenticated');
    }
    window.addEventListener('iips:auth:unauthorized', onUnauthorized);
    return () => {
      cancelled = true;
      window.removeEventListener('iips:auth:unauthorized', onUnauthorized);
    };
  }, [navigate]);

  const login = async (): Promise<void> => {
    setStatus('loading');
    try {
      await beginLogin();
    } catch (e) {
      setError(String(e));
      setStatus('error');
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await oidcLogout();
    } finally {
      setSession(ANONYMOUS_SESSION);
      setStatus('unauthenticated');
    }
  };

  if (status === 'loading') return <LoadingState />;

  if (status === 'error') {
    return (
      <section aria-label="Sign-in error" style={{ padding: 48, maxWidth: 560, margin: '0 auto' }}>
        <h1>Sign-in error</h1>
        <ErrorState message={error ?? 'Authentication failed'} />
        <button type="button" onClick={() => { setError(null); setStatus('unauthenticated'); }}>
          Return to sign in
        </button>
      </section>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <section aria-label="Sign in" style={{ padding: 48, maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
        <h1>IIPS — Enterprise Investment Intelligence</h1>
        <p style={{ color: 'var(--color-ink-secondary)' }}>
          Sign in to access the governed investment intelligence surface.
        </p>
        <button type="button" onClick={() => { void login(); }}>
          Sign in with Keycloak
        </button>
      </section>
    );
  }

  return (
    <AuthContext.Provider value={{ status, session, login, logout, getAccessToken: getToken }}>
      <SessionProvider session={session}>{children}</SessionProvider>
    </AuthContext.Provider>
  );
}
