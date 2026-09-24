/**
 * Program v3.0 — Browser Authentication Integration: authenticated fetch helper.
 *
 * Attaches `Authorization: Bearer <access-token>` when an access token is available.
 * Dispatches 401/403 events if configured.
 * Presentation-only: never makes authorization decisions — server is the authority.
 */

export class ApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (typeof window !== 'undefined' && (window as any).__IIPS_ACCESS_TOKEN__) {
    headers.set('Authorization', `Bearer ${(window as any).__IIPS_ACCESS_TOKEN__}`);
  }

  return fetch(input, { ...init, headers });
}
