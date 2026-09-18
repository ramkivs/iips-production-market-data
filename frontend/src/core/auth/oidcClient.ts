/**
 * Program v3.0 — Browser Authentication Integration: minimal OIDC client.
 *
 * Implements the approved Keycloak authorization-code + PKCE flow for the browser.
 * Responsibilities (and ONLY these):
 *   - authorization URL construction
 *   - PKCE verifier/challenge (S256)
 *   - state / nonce generation + validation
 *   - authorization-callback handling (code → token exchange)
 *   - IN-MEMORY token storage (access / id / refresh) — never persisted
 *   - access-token retrieval with expiry + refresh
 *   - Keycloak end-session logout
 *
 * SECURITY AUTHORITY BOUNDARY:
 *   - Keycloak is the AUTHENTICATION authority. This client only acquires tokens.
 *   - NO authorization policy lives here (no role gating, no tenant gating).
 *   - The SERVER (SecuredExecutor) verifies tokens against the real JWKS and derives
 *     the governed Principal/tenant/roles. The browser never makes authorization
 *     decisions and never sends tenant/role as authoritative parameters.
 *   - Bearer tokens are held in module memory ONLY. They are never written to
 *     localStorage, sessionStorage, IndexedDB, or cookies. The only thing persisted
 *     across the Keycloak redirect is the transient PKCE state/verifier/nonce (a
 *     one-time nonce bundle — NOT a bearer token) in sessionStorage, removed
 *     immediately after the callback.
 */
export interface OidcConfig {
  readonly issuer: string;
  readonly clientId: string;
  readonly redirectUri: string;
  readonly scope: string;
}

export interface OidcEndpoints {
  readonly authorizationEndpoint: string;
  readonly tokenEndpoint: string;
  readonly endSessionEndpoint: string;
}

export interface TokenSet {
  readonly accessToken: string;
  readonly idToken: string | null;
  readonly refreshToken: string | null;
  readonly expiresAt: number; // epoch seconds
}

interface DiscoveryDocument {
  readonly authorization_endpoint: string;
  readonly token_endpoint: string;
  readonly end_session_endpoint?: string;
}

interface TokenResponse {
  readonly access_token: string;
  readonly id_token?: string;
  readonly refresh_token?: string;
  readonly expires_in?: number;
}

interface TransientState {
  readonly verifier: string;
  readonly state: string;
  readonly nonce: string;
  /** Same-origin application path to return to after login (path only — never a token/credential). */
  readonly returnTo?: string | null;
}

const DEFAULT_ISSUER = 'http://localhost:8080/realms/iips';
const DEFAULT_CLIENT_ID = 'iips-spa';
const DEFAULT_SCOPE = 'openid profile';
const TRANSIENT_KEY = 'iips.oidc.transient';
const EXPIRY_SKEW_SECONDS = 30;

// --- In-memory token state (never persisted) ---
let accessToken: string | null = null;
let idToken: string | null = null;
let refreshToken: string | null = null;
let expiresAt = 0;

// --- In-memory post-login destination (a path, never a token) ---
let pendingReturnTo: string | null = null;

let endpointsCache: OidcEndpoints | null = null;
let completeInFlight: Promise<TokenSet> | null = null;

let config: OidcConfig = {
  issuer: DEFAULT_ISSUER,
  clientId: DEFAULT_CLIENT_ID,
  redirectUri: `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'}/callback`,
  scope: DEFAULT_SCOPE,
};

export function configure(overrides: Partial<OidcConfig>): OidcConfig {
  config = { ...config, ...overrides };
  endpointsCache = null;
  return config;
}

export function getConfig(): OidcConfig {
  return config;
}

function base64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function randomString(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  globalThis.crypto.getRandomValues(bytes);
  return base64Url(bytes);
}

/** PKCE code verifier (43 chars, high entropy). */
export function generateVerifier(): string {
  return randomString(32);
}

/** PKCE S256 challenge derived from the verifier. */
export async function generateChallenge(verifier: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64Url(new Uint8Array(digest));
}

/** Opaque anti-CSRF state for the redirect round-trip. */
export function generateState(): string {
  return randomString(24);
}

/** OIDC nonce, bound into the id_token to prevent replay. */
export function generateNonce(): string {
  return randomString(24);
}

function saveTransient(transient: TransientState): void {
  sessionStorage.setItem(TRANSIENT_KEY, JSON.stringify(transient));
}

function takeTransient(): TransientState | null {
  const raw = sessionStorage.getItem(TRANSIENT_KEY);
  sessionStorage.removeItem(TRANSIENT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TransientState;
  } catch {
    return null;
  }
}

/** Fetch + cache the realm's OIDC discovery document. */
export async function discover(): Promise<OidcEndpoints> {
  if (endpointsCache) return endpointsCache;
  const res = await fetch(`${config.issuer}/.well-known/openid-configuration`);
  if (!res.ok) throw new Error(`OIDC discovery failed (${res.status})`);
  const doc = (await res.json()) as DiscoveryDocument;
  endpointsCache = {
    authorizationEndpoint: doc.authorization_endpoint,
    tokenEndpoint: doc.token_endpoint,
    endSessionEndpoint: doc.end_session_endpoint ?? doc.authorization_endpoint,
  };
  return endpointsCache;
}

/** Build the Keycloak authorization URL (authorization-code + PKCE). */
export function buildAuthorizeUrl(
  authorizationEndpoint: string,
  params: { challenge: string; state: string; nonce: string; prompt?: string },
): string {
  const query = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scope,
    code_challenge: params.challenge,
    code_challenge_method: 'S256',
    state: params.state,
    nonce: params.nonce,
  });
  if (params.prompt) query.set('prompt', params.prompt);
  return `${authorizationEndpoint}?${query.toString()}`;
}

/** Begin the login flow: stash PKCE/state/nonce + the same-origin returnTo path, then redirect. */
export async function beginLogin(): Promise<void> {
  const endpoints = await discover();
  const verifier = generateVerifier();
  const challenge = await generateChallenge(verifier);
  const state = generateState();
  const nonce = generateNonce();
  const returnTo = buildReturnTo(window.location.pathname, window.location.search);
  saveTransient({ verifier, state, nonce, returnTo });
  window.location.assign(buildAuthorizeUrl(endpoints.authorizationEndpoint, { challenge, state, nonce }));
}

/**
 * Capture the pre-login destination as a same-origin path (+search). `/callback` is never a
 * meaningful return target, so it yields null (→ default). Returns a PATH only — never a token.
 */
export function buildReturnTo(pathname: string, search: string): string | null {
  if (!pathname || pathname === '/callback') return null;
  return `${pathname}${search ?? ''}`;
}

/**
 * Strict same-origin/path guard for a saved return destination. Rejects external URLs,
 * protocol-relative (network-path) values, backslash-normalization tricks, and control
 * characters — so a malicious/foreign saved value can never become an open redirect.
 * Returns the safe path, or null (caller falls back to /executive).
 */
export function sanitizeReturnTo(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw.length === 0) return null;
  if (!raw.startsWith('/')) return null; // must be an app-internal path
  if (raw.startsWith('//')) return null; // protocol-relative URL → reject
  if (raw.startsWith('/\\')) return null; // backslash-normalization trick → reject
  if (/[\u0000-\u001F]/.test(raw)) return null; // control characters → reject
  return raw;
}

/** Read + clear the sanitized post-login destination (set during the callback exchange). */
export function takeReturnTo(): string | null {
  const value = pendingReturnTo;
  pendingReturnTo = null;
  return value;
}

/** True when the current URL is the OIDC callback carrying an authorization code. */
export function isCallbackUrl(location: { pathname: string; search: string }): boolean {
  return location.pathname === '/callback' && location.search.includes('code=');
}

/** Decode a JWT payload for DISPLAY ONLY (base64url decode; no signature verification —
 *  verification is performed exclusively by the server-side SecuredExecutor). */
export function decodeJwtPayload<T = Record<string, unknown>>(token: string): T {
  const parts = token.split('.');
  if (parts.length < 2) throw new Error('malformed-jwt');
  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const json = decodeURIComponent(
    atob(padded)
      .split('')
      .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
      .join(''),
  );
  return JSON.parse(json) as T;
}

function storeTokens(set: TokenSet): void {
  accessToken = set.accessToken;
  idToken = set.idToken;
  refreshToken = set.refreshToken;
  expiresAt = set.expiresAt;
}

/** Current in-memory token set (null when not authenticated). */
export function getTokens(): TokenSet | null {
  if (!accessToken) return null;
  return { accessToken, idToken, refreshToken, expiresAt };
}

/** True when an unexpired access token exists in memory (reload-safe check). */
export function hasSession(): boolean {
  const now = Math.floor(Date.now() / 1000);
  return accessToken !== null && now < expiresAt - EXPIRY_SKEW_SECONDS;
}

/** Clear all in-memory credentials (and any pending return destination). */
export function clearSession(): void {
  accessToken = null;
  idToken = null;
  refreshToken = null;
  expiresAt = 0;
  pendingReturnTo = null;
}

async function doCompleteLogin(callbackUrl: string): Promise<TokenSet> {
  const url = new URL(callbackUrl, window.location.origin);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code) throw new Error('callback-missing-code');

  const transient = takeTransient();
  if (!transient || state !== transient.state) throw new Error('state-mismatch');

  // Preserve the sanitized same-origin return destination (path only) for AuthProvider.
  pendingReturnTo = sanitizeReturnTo(transient.returnTo);

  const endpoints = await discover();
  const res = await fetch(endpoints.tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.redirectUri,
      client_id: config.clientId,
      code_verifier: transient.verifier,
    }),
  });
  if (!res.ok) throw new Error(`token-exchange-failed (${res.status})`);

  const json = (await res.json()) as TokenResponse;

  // Nonce validation: the id_token must carry the nonce we issued (anti-replay).
  if (json.id_token && transient.nonce) {
    const claims = decodeJwtPayload<{ nonce?: string }>(json.id_token);
    if (claims.nonce !== transient.nonce) throw new Error('nonce-mismatch');
  }

  const now = Math.floor(Date.now() / 1000);
  const set: TokenSet = {
    accessToken: json.access_token,
    idToken: json.id_token ?? null,
    refreshToken: json.refresh_token ?? null,
    expiresAt: now + (json.expires_in ?? 300),
  };
  storeTokens(set);
  return set;
}

/** Handle the authorization callback (deduplicated for StrictMode double-effects). */
export function completeLogin(callbackUrl: string): Promise<TokenSet> {
  if (!completeInFlight) {
    completeInFlight = doCompleteLogin(callbackUrl).finally(() => {
      completeInFlight = null;
    });
  }
  return completeInFlight;
}

async function refreshAccessToken(): Promise<void> {
  if (!refreshToken) throw new Error('no-refresh-token');
  const endpoints = await discover();
  const res = await fetch(endpoints.tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: config.clientId,
    }),
  });
  if (!res.ok) throw new Error(`refresh-failed (${res.status})`);
  const json = (await res.json()) as TokenResponse;
  const now = Math.floor(Date.now() / 1000);
  accessToken = json.access_token;
  if (json.id_token) idToken = json.id_token;
  if (json.refresh_token) refreshToken = json.refresh_token;
  expiresAt = now + (json.expires_in ?? 300);
}

/**
 * Return a valid access token (refreshing if necessary), or null when no
 * authenticated session exists. Never fabricates a token.
 */
export async function getAccessToken(): Promise<string | null> {
  const now = Math.floor(Date.now() / 1000);
  if (accessToken && now < expiresAt - EXPIRY_SKEW_SECONDS) return accessToken;
  if (refreshToken) {
    try {
      await refreshAccessToken();
      return accessToken;
    } catch {
      clearSession();
      return null;
    }
  }
  return null;
}

/** Keycloak end-session URL (id_token_hint based), or null when unavailable. */
export function buildLogoutUrl(): string | null {
  if (!endpointsCache || !idToken) return null;
  const query = new URLSearchParams({ id_token_hint: idToken });
  return `${endpointsCache.endSessionEndpoint}?${query.toString()}`;
}

/** Log out: clear in-memory credentials, then redirect to Keycloak end-session. */
export async function logout(): Promise<void> {
  const url = buildLogoutUrl();
  clearSession();
  if (url) window.location.assign(url);
}

/** Notify the app that a 401 was received (re-authentication required). */
export function dispatchUnauthorized(): void {
  window.dispatchEvent(new CustomEvent('iips:auth:unauthorized'));
}

/** Notify the app that a 403 was received (governed denial). */
export function dispatchForbidden(): void {
  window.dispatchEvent(new CustomEvent('iips:auth:forbidden'));
}
