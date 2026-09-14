/**
 * Program v3.0 — E2E-032-C LIVE certification: REAL Keycloak AI advisory path.
 *
 * Uses the CURRENT AI transport contract:
 *   existing shared READ executor
 *   -> handleAiAdvisoryRequest(req,res,executor,resolveSectorEngine)
 *
 * Proves real Keycloak authentication and the governed non-authoritative
 * AI advisory read surface.
 */

import { describe, it, expect } from 'vitest';
import { createLiveReadExecutor } from '../admin-transport';
import {
  handleAiAdvisoryRequest,
  ADVISORY_LABEL,
} from '../ai-advisory-transport';
import { resolveSectorEngine } from '../executive-transport';

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

async function call(path: string, token?: string) {
  const executor = await createLiveReadExecutor();

  if (!executor) {
    throw new Error('live read executor unavailable');
  }

  const server = await import('node:http');

  const httpServer = server.createServer((req, res) => {
    void handleAiAdvisoryRequest(
      req,
      res,
      executor,
      resolveSectorEngine,
    );
  });

  await new Promise<void>((resolve) =>
    httpServer.listen(0, resolve),
  );

  const address = httpServer.address();

  if (!address || typeof address === 'string') {
    httpServer.close();
    throw new Error('unable to determine ephemeral AI port');
  }

  try {
    return await fetch(
      `http://127.0.0.1:${address.port}${path}`,
      {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : {},
      },
    );
  } finally {
    await new Promise<void>((resolve) =>
      httpServer.close(() => resolve()),
    );
  }
}

describe.skipIf(!kcUp)(
  'E2E-032-C LIVE — current governed AI advisory path',
  () => {

    it('authorizes a REAL viewer token and returns governed non-authoritative advisory', async () => {
      const token = await realToken('viewer-a');

      const res = await call(
        '/api/ai-advisory/Technology',
        token,
      );

      expect(res.status).toBe(200);

      const body = await res.json();

      expect(body.label).toBe(ADVISORY_LABEL);
      expect(body.nonAuthoritative).toBe(true);

      expect(body).not.toHaveProperty('timestamp');
      expect(body).not.toHaveProperty('tenant');
      expect(body).not.toHaveProperty('provider');
      expect(body).not.toHaveProperty('confidence');
      expect(body).not.toHaveProperty('decision');
    });

    it('authorizes a REAL analyst token', async () => {
      const token = await realToken('analyst-a');

      const res = await call(
        '/api/ai-advisory/Technology',
        token,
      );

      expect(res.status).toBe(200);
    });

    it('returns 401 without authentication', async () => {
      const res = await call(
        '/api/ai-advisory/Technology',
      );

      expect(res.status).toBe(401);
    });

    it('returns 404 for an unknown engine result', async () => {
      const token = await realToken('viewer-a');

      const res = await call(
        '/api/ai-advisory/NotReal',
        token,
      );

      expect(res.status).toBe(404);
    });
  },
);
