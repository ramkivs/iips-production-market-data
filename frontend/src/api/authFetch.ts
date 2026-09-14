/**
 * Program v3.0 — Browser Authentication Integration: authenticated fetch helper.
 *
 * Attaches `Authorization: Bearer <access-token>` to governed API calls (token held
 * in memory only, never fabricated). Dispatches the governed 401/403 events so the
 * app can transition toward re-authentication (401) or the governed denial UI (403).
 *
 * React/client code remains presentation-only; this helper never makes authorization
 * decisions — the server is the authority.
 */
import { dispatchForbidden, dispatchUnauthorized, getAccessToken } from '../core/auth/oidcClient';

/** A distinguishable HTTP error carrying the frozen 401/403 semantics. */
export class ApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = await getAccessToken();
  const headers = new Headers(init?.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(input, { ...init, headers });

  if (res.status === 401) dispatchUnauthorized();
  if (res.status === 403) dispatchForbidden();
  return res;
}
