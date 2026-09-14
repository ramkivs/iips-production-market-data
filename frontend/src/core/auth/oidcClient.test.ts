/**
 * Program v3.0 — Browser Authentication Integration: oidcClient tests.
 *
 * Deterministic, no network: PKCE generation, state/nonce generation, authorize-URL
 * construction, JWT payload decoding, callback exchange (success/state-mismatch/
 * nonce-mismatch), in-memory storage, expiry/refresh, and logout-URL building.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  buildAuthorizeUrl,
  buildLogoutUrl,
  buildReturnTo,
  clearSession,
  completeLogin,
  configure,
  decodeJwtPayload,
  discover,
  generateChallenge,
  generateNonce,
  generateState,
  generateVerifier,
  getAccessToken,
  getTokens,
  hasSession,
  sanitizeReturnTo,
  takeReturnTo,
} from './oidcClient';

const B64URL = /^[A-Za-z0-9_-]+$/;
const ISSUER = 'https://kc.example.test/realms/iips';
const CLIENT = 'iips-spa';
const REDIRECT = 'http://localhost:5173/callback';

function mockFetch(handler: (url: string, init?: RequestInit) => { ok: boolean; status: number; json: () => Promise<unknown> }) {
  globalThis.fetch = vi.fn((input: unknown, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : String(input);
    return Promise.resolve(handler(url, init));
  }) as never;
}

const DISCOVERY = {
  authorization_endpoint: `${ISSUER}/protocol/openid-connect/auth`,
  token_endpoint: `${ISSUER}/protocol/openid-connect/token`,
  end_session_endpoint: `${ISSUER}/protocol/openid-connect/logout`,
};

function b64url(obj: unknown): string {
  return btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function makeJwt(payload: Record<string, unknown>): string {
  return `${b64url({ alg: 'RS256', typ: 'JWT' })}.${b64url(payload)}.sig`;
}

describe('oidcClient — PKCE / state / nonce', () => {
  it('generateVerifier produces a 43-char base64url string', () => {
    const v = generateVerifier();
    expect(v).toMatch(B64URL);
    expect(v.length).toBe(43);
  });

  it('generateChallenge produces a 43-char S256 base64url challenge different from the verifier', async () => {
    const verifier = generateVerifier();
    const challenge = await generateChallenge(verifier);
    expect(challenge).toMatch(B64URL);
    expect(challenge.length).toBe(43);
    expect(challenge).not.toBe(verifier);
    // deterministic for the same verifier
    expect(await generateChallenge(verifier)).toBe(challenge);
  });

  it('generateState / generateNonce produce 32-char base64url strings', () => {
    expect(generateState()).toMatch(B64URL);
    expect(generateState().length).toBe(32);
    expect(generateNonce()).toMatch(B64URL);
    expect(generateNonce().length).toBe(32);
  });

  it('buildAuthorizeUrl includes authorization-code + PKCE parameters', async () => {
    const verifier = generateVerifier();
    const challenge = await generateChallenge(verifier);
    configure({ clientId: CLIENT, redirectUri: REDIRECT, issuer: ISSUER });
    const url = new URL(buildAuthorizeUrl('https://auth/authorize', { challenge, state: 's', nonce: 'n' }));
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('client_id')).toBe(CLIENT);
    expect(url.searchParams.get('redirect_uri')).toBe(REDIRECT);
    expect(url.searchParams.get('code_challenge')).toBe(challenge);
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('state')).toBe('s');
    expect(url.searchParams.get('nonce')).toBe('n');
  });
});

describe('oidcClient — decodeJwtPayload (display only)', () => {
  it('decodes base64url payload claims without verification', () => {
    const token = makeJwt({ preferred_username: 'admin-a', tenant: 'tenant-A', sub: 'uuid' });
    const claims = decodeJwtPayload<{ preferred_username: string; tenant: string }>(token);
    expect(claims.preferred_username).toBe('admin-a');
    expect(claims.tenant).toBe('tenant-A');
  });
});

describe('oidcClient — callback / storage / expiry', () => {
  beforeEach(() => {
    sessionStorage.clear();
    clearSession();
    configure({ issuer: ISSUER, clientId: CLIENT, redirectUri: REDIRECT });
  });
  afterEach(() => {
    sessionStorage.clear();
    clearSession();
  });

  it('completeLogin exchanges the code and stores in-memory tokens (transient cleared)', async () => {
    const verifier = generateVerifier();
    const state = 'st-123';
    const nonce = 'nc-123';
    sessionStorage.setItem('iips.oidc.transient', JSON.stringify({ verifier, state, nonce }));

    mockFetch((url, init) => {
      if (url.endsWith('/.well-known/openid-configuration')) {
        return { ok: true, status: 200, json: async () => DISCOVERY };
      }
      expect(url).toContain('/token');
      expect(String((init?.body as URLSearchParams).get('code_verifier'))).toBe(verifier);
      expect((init?.body as URLSearchParams).get('grant_type')).toBe('authorization_code');
      return {
        ok: true,
        status: 200,
        json: async () => ({
          access_token: 'at-1',
          id_token: makeJwt({ nonce, sub: 'u1' }),
          refresh_token: 'rt-1',
          expires_in: 300,
        }),
      };
    });

    const set = await completeLogin(`${REDIRECT}?code=abc&state=${state}`);
    expect(set.accessToken).toBe('at-1');
    expect(getTokens()?.accessToken).toBe('at-1');
    expect(sessionStorage.getItem('iips.oidc.transient')).toBeNull();
  });

  it('completeLogin rejects on state mismatch', async () => {
    sessionStorage.setItem('iips.oidc.transient', JSON.stringify({ verifier: 'v', state: 'expected', nonce: 'n' }));
    await expect(completeLogin(`${REDIRECT}?code=abc&state=other`)).rejects.toThrow('state-mismatch');
  });

  it('completeLogin rejects on nonce mismatch', async () => {
    sessionStorage.setItem('iips.oidc.transient', JSON.stringify({ verifier: 'v', state: 'st', nonce: 'expected-nonce' }));
    mockFetch((url) => {
      if (url.endsWith('/.well-known/openid-configuration')) {
        return { ok: true, status: 200, json: async () => DISCOVERY };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ access_token: 'at-1', id_token: makeJwt({ nonce: 'wrong', sub: 'u1' }), expires_in: 300 }),
      };
    });
    await expect(completeLogin(`${REDIRECT}?code=abc&state=st`)).rejects.toThrow('nonce-mismatch');
  });

  it('hasSession / getTokens / clearSession reflect in-memory state', async () => {
    mockFetch((url) => {
      if (url.endsWith('/.well-known/openid-configuration')) {
        return { ok: true, status: 200, json: async () => DISCOVERY };
      }
      return { ok: true, status: 200, json: async () => ({ access_token: 'at-1', expires_in: 300 }) };
    });
    sessionStorage.setItem('iips.oidc.transient', JSON.stringify({ verifier: 'v', state: 'st', nonce: 'n' }));
    await completeLogin(`${REDIRECT}?code=abc&state=st`);
    expect(hasSession()).toBe(true);
    expect(getTokens()?.accessToken).toBe('at-1');
    clearSession();
    expect(hasSession()).toBe(false);
    expect(getTokens()).toBeNull();
  });

  it('getAccessToken returns null when unauthenticated (never fabricated)', async () => {
    clearSession();
    await expect(getAccessToken()).resolves.toBeNull();
  });

  it('getAccessToken refreshes an expired token via the refresh grant', async () => {
    let call = 0;
    mockFetch((url) => {
      if (url.endsWith('/.well-known/openid-configuration')) {
        return { ok: true, status: 200, json: async () => DISCOVERY };
      }
      call += 1;
      if (call === 1) {
        // authorization_code exchange → short-lived access token + refresh token
        return {
          ok: true,
          status: 200,
          json: async () => ({ access_token: 'at-short', refresh_token: 'rt-1', expires_in: 1 }),
        };
      }
      // refresh grant
      return { ok: true, status: 200, json: async () => ({ access_token: 'at-refreshed', expires_in: 300 }) };
    });
    sessionStorage.setItem('iips.oidc.transient', JSON.stringify({ verifier: 'v', state: 'st', nonce: 'n' }));
    await completeLogin(`${REDIRECT}?code=abc&state=st`);
    const token = await getAccessToken(); // expired (expires_in=1) → refresh path
    expect(token).toBe('at-refreshed');
  });

  it('buildLogoutUrl carries the id_token_hint and clearSession empties tokens', async () => {
    mockFetch((url) => {
      if (url.endsWith('/.well-known/openid-configuration')) {
        return { ok: true, status: 200, json: async () => DISCOVERY };
      }
      return { ok: true, status: 200, json: async () => ({ access_token: 'at-1', id_token: makeJwt({ sub: 'u1', nonce: 'n' }), expires_in: 300 }) };
    });
    sessionStorage.setItem('iips.oidc.transient', JSON.stringify({ verifier: 'v', state: 'st', nonce: 'n' }));
    await completeLogin(`${REDIRECT}?code=abc&state=st`);
    const url = buildLogoutUrl();
    expect(url).toContain('id_token_hint=');
    clearSession();
    expect(buildLogoutUrl()).toBeNull(); // no id_token after clear
  });

  it('discover caches the discovery document', async () => {
    mockFetch((url) => {
      expect(url).toContain('/.well-known/openid-configuration');
      return { ok: true, status: 200, json: async () => DISCOVERY };
    });
    const a = await discover();
    const b = await discover();
    expect(a.tokenEndpoint).toBe(DISCOVERY.token_endpoint);
    expect(b).toEqual(a);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });
});

// --- N+1A: post-login destination preservation ---

describe('oidcClient — returnTo capture & sanitization (N+1A)', () => {
  it('buildReturnTo captures a same-origin path + search', () => {
    expect(buildReturnTo('/admin/engines', '')).toBe('/admin/engines');
    expect(buildReturnTo('/admin/engines', '?tab=audit')).toBe('/admin/engines?tab=audit');
  });

  it('buildReturnTo yields null for /callback or an empty path', () => {
    expect(buildReturnTo('/callback', '')).toBeNull();
    expect(buildReturnTo('', '')).toBeNull();
  });

  it('sanitizeReturnTo accepts a plain internal path', () => {
    expect(sanitizeReturnTo('/admin/engines')).toBe('/admin/engines');
    expect(sanitizeReturnTo('/evidence/abc?x=1')).toBe('/evidence/abc?x=1');
  });

  it('sanitizeReturnTo rejects external / protocol-relative / backslash / control / non-path values', () => {
    expect(sanitizeReturnTo('https://evil.example')).toBeNull();
    expect(sanitizeReturnTo('//evil.example/x')).toBeNull();
    expect(sanitizeReturnTo('/\\evil.example')).toBeNull();
    expect(sanitizeReturnTo('/admin/\u0000engines')).toBeNull();
    expect(sanitizeReturnTo('admin/engines')).toBeNull(); // no leading slash
    expect(sanitizeReturnTo(null)).toBeNull();
    expect(sanitizeReturnTo(undefined)).toBeNull();
    expect(sanitizeReturnTo('')).toBeNull();
  });
});

describe('oidcClient — returnTo restoration through the callback (N+1A)', () => {
  beforeEach(() => {
    sessionStorage.clear();
    clearSession();
    configure({ issuer: ISSUER, clientId: CLIENT, redirectUri: REDIRECT });
  });
  afterEach(() => {
    sessionStorage.clear();
    clearSession();
  });

  function mockDiscoveryAndToken(): void {
    mockFetch((url) => {
      if (url.endsWith('/.well-known/openid-configuration')) {
        return { ok: true, status: 200, json: async () => DISCOVERY };
      }
      return { ok: true, status: 200, json: async () => ({ access_token: 'at-1', expires_in: 300 }) };
    });
  }

  it('restores a saved same-origin returnTo after a successful callback', async () => {
    sessionStorage.setItem('iips.oidc.transient', JSON.stringify({ verifier: 'v', state: 'st', nonce: 'n', returnTo: '/admin/engines' }));
    mockDiscoveryAndToken();
    await completeLogin(`${REDIRECT}?code=abc&state=st`);
    expect(takeReturnTo()).toBe('/admin/engines');
  });

  it('sanitizes an external returnTo to null (upstream falls back to /executive)', async () => {
    sessionStorage.setItem('iips.oidc.transient', JSON.stringify({ verifier: 'v', state: 'st', nonce: 'n', returnTo: 'https://evil.example' }));
    mockDiscoveryAndToken();
    await completeLogin(`${REDIRECT}?code=abc&state=st`);
    expect(takeReturnTo()).toBeNull();
  });

  it('yields null returnTo when none was saved', async () => {
    sessionStorage.setItem('iips.oidc.transient', JSON.stringify({ verifier: 'v', state: 'st', nonce: 'n' }));
    mockDiscoveryAndToken();
    await completeLogin(`${REDIRECT}?code=abc&state=st`);
    expect(takeReturnTo()).toBeNull();
  });
});
