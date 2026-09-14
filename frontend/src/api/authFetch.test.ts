/**
 * Program v3.0 — Browser Authentication Integration: authFetch tests.
 *
 * Verifies Bearer propagation (only when a real in-memory token exists — never
 * fabricated) and the governed 401/403 event dispatch.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authFetch } from './authFetch';
import { dispatchForbidden, dispatchUnauthorized, getAccessToken } from '../core/auth/oidcClient';

vi.mock('../core/auth/oidcClient', () => ({
  getAccessToken: vi.fn(async () => null),
  dispatchUnauthorized: vi.fn(),
  dispatchForbidden: vi.fn(),
}));

const mocks = vi.mocked({ getAccessToken, dispatchUnauthorized, dispatchForbidden }, true);

beforeEach(() => {
  vi.clearAllMocks();
  globalThis.fetch = vi.fn(async () => new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } })) as never;
});

describe('authFetch', () => {
  it('does not fabricate an Authorization header when no token exists', async () => {
    mocks.getAccessToken.mockResolvedValue(null);
    await authFetch('/api/admin/workflow');
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    const init = fetchMock.mock.calls[0][1] as RequestInit | undefined;
    const headers = new Headers(init?.headers);
    expect(headers.has('Authorization')).toBe(false);
  });

  it('attaches the real in-memory Bearer token when present', async () => {
    mocks.getAccessToken.mockResolvedValue('at-123');
    await authFetch('/api/admin/workflow');
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    const init = fetchMock.mock.calls[0][1] as RequestInit | undefined;
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer at-123');
  });

  it('dispatches the unauthorized event on 401', async () => {
    globalThis.fetch = vi.fn(async () => new Response('{}', { status: 401 })) as never;
    await authFetch('/api/admin/workflow');
    expect(mocks.dispatchUnauthorized).toHaveBeenCalledTimes(1);
    expect(mocks.dispatchForbidden).not.toHaveBeenCalled();
  });

  it('dispatches the forbidden event on 403', async () => {
    globalThis.fetch = vi.fn(async () => new Response('{}', { status: 403 })) as never;
    await authFetch('/api/admin/workflow');
    expect(mocks.dispatchForbidden).toHaveBeenCalledTimes(1);
    expect(mocks.dispatchUnauthorized).not.toHaveBeenCalled();
  });
});
