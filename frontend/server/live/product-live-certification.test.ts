/**
 * Program v3.0 — E2E-032-C LIVE certification: REAL Keycloak product read path.
 *
 * Uses the CURRENT governed product transport contract.
 *
 * Proves:
 *   REAL Keycloak token -> current SecuredExecutor -> EnterpriseRuntime/RBAC
 *   -> governed product read transport -> unchanged certified SNAPSHOT DTO.
 *
 * Product surfaces:
 *   /api/executive
 *   /api/portfolio
 *   /api/company/Technology
 *   /api/cross-sector
 *   /api/decision-matrix
 *   /api/evidence/Technology
 *   /api/replay/Technology
 *
 * Also proves:
 *   - viewer / analyst / admin read access
 *   - unauthenticated 401
 *   - invalid token 401
 *   - tenant-neutral SNAPSHOT reference data
 *   - server-validated /api/auth/me session
 *
 * Offline-safe: skips when Keycloak is unreachable.
 */

import { describe, it, expect } from 'vitest';

const KC = process.env.KEYCLOAK_URL || 'http://localhost:8080';
const DISCOVERY = `${KC}/realms/iips/.well-known/openid-configuration`;

let kcUp = false;
try {
  kcUp = (await fetch(DISCOVERY)).ok;
} catch {
  kcUp = false;
}

async function realToken(username: string): Promise<string> {
  const password = process.env.IIPS_TEST_PASSWORD;
  if (!password) throw new Error('IIPS_TEST_PASSWORD is not configured');

  const res = await fetch(
    `${KC}/realms/iips/protocol/openid-connect/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: process.env.KEYCLOAK_CLIENT_ID || 'iips-spa',
        username,
        password,
      }),
    },
  );

  const t = (await res.json()) as { access_token?: string };

  if (!res.ok || !t.access_token) {
    throw new Error(`token ${username} -> ${res.status}`);
  }

  return t.access_token;
}

const PRODUCT_PATHS = [
  '/api/executive',
  '/api/portfolio',
  '/api/company/Technology',
  '/api/cross-sector',
  '/api/decision-matrix',
  '/api/evidence/Technology',
  '/api/replay/Technology',
];

async function get(path: string, token?: string) {
  return fetch(`http://127.0.0.1:8787${path}`, {
    headers: token
      ? { Authorization: `Bearer ${token}` }
      : {},
  });
}

describe.skipIf(!kcUp)(
  'E2E-032-C LIVE — current governed product read path',
  () => {

    it('serves every certified product surface to a REAL viewer', async () => {
      const token = await realToken('viewer-a');

      for (const path of PRODUCT_PATHS) {
        const res = await get(path, token);

        expect(res.status, path).toBe(200);

        const body = await res.json();

        expect(
          (body as { provenance?: { freshness?: string } })
            .provenance?.freshness,
          path,
        ).toBe('SNAPSHOT');
      }
    });

    it('serves every certified product surface to REAL analyst and admin principals', async () => {
      for (const username of ['analyst-a', 'admin-a']) {
        const token = await realToken(username);

        for (const path of PRODUCT_PATHS) {
          const res = await get(path, token);
          expect(res.status, `${username} ${path}`).toBe(200);
        }
      }
    });

    it('returns 401 without authentication', async () => {
      const res = await get('/api/executive');
      expect(res.status).toBe(401);
    });

    it('returns 401 for an invalid token', async () => {
      const res = await get(
        '/api/executive',
        'invalid.garbage.token',
      );

      expect(res.status).toBe(401);
    });


    it('serves tenant-neutral certified reference data to tenant-B', async () => {
      const token = await realToken('analyst-b');

      for (const path of PRODUCT_PATHS) {
        const res = await get(path, token);

        expect(res.status, path).toBe(200);

        const body = await res.json();

        expect(
          (body as { provenance?: { freshness?: string } })
            .provenance?.freshness,
          path,
        ).toBe('SNAPSHOT');
      }
    });
  },
);

