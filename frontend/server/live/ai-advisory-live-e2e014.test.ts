/**
 * Program v3.0 — E2E-014 AC-E14-7 LIVE evidence object (H / I only). NOT E2E-015 evidence.
 *
 * Proves, against a REAL running Keycloak (realm `iips`), the deferred E2E-014 LIVE leg for
 * CAP-2 (G-AI-IMPL AI Advisory) per the recorded evidence definition
 * (DEC-E2E-014-AC-E14-7-EVIDENCE-DEFINITION-AUTHORITY-2026-09-06):
 *
 *   H — authenticated live HTTP 200 advisory request  (GET /api/ai-advisory/:sectorKey)
 *   I — real Keycloak authentication / LIVE authentication evidence semantics:
 *       real OIDC discovery → real token from the realm's token endpoint → real JWKS RS256
 *       signature verification via the existing RealKeycloakVerifier inside the existing
 *       canonical guardRead authorization path.
 *
 * Reuses ONLY existing mechanisms — no new advisory logic, no new authentication mechanism,
 * no new methodology, no new acceptance criteria:
 *   - handleAiAdvisoryRequest — the existing advisory HTTP dispatch (guardRead SR-4 inside);
 *   - resolveSectorEngine — the existing governed ENGINE_FACTORY / v1.1 replay-baseline
 *     resolver (13 governed sectors, case-insensitive; 'Banking' is the demonstrated key);
 *   - createLiveReadExecutor — the existing production LIVE READ executor wiring used by the
 *     /api/ai-advisory dispatch in executive-transport.ts (viewer/analyst/admin may read);
 *   - the established LIVE-suite self-host pattern over an ephemeral local HTTP socket.
 *
 * J (live browser rendering) is deliberately ABSENT: D4=C withholds browser/UI execution
 * pending a separate authority decision.
 *
 * Offline-safe: skips when no Keycloak is reachable, exactly like the existing LIVE suites,
 * so the default regression gate is unaffected. Any authorized LIVE execution of this suite
 * is bound to zero skips (skips are non-passing).
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'node:http';
import { AddressInfo } from 'node:net';
import { createLiveReadExecutor } from '../admin-transport';
import {
  handleAiAdvisoryRequest,
  ADVISORY_TEXT,
  ADVISORY_LABEL,
  ADVISORY_FRESHNESS,
} from '../ai-advisory-transport';
import { resolveSectorEngine } from '../executive-transport';

const KC = process.env.KEYCLOAK_URL || 'http://localhost:8080';
const TEST_PW = process.env.IIPS_TEST_PASSWORD || 'iips-test-pw-2026';
const DISCOVERY = `${KC}/realms/iips/.well-known/openid-configuration`;

let kcUp = false;
try { kcUp = (await fetch(DISCOVERY)).ok; } catch { kcUp = false; }

async function realToken(username: string): Promise<string> {
  const res = await fetch(`${KC}/realms/iips/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'password', client_id: 'iips-spa', username, password: TEST_PW }),
  });
  const t = (await res.json()) as { access_token?: string };
  if (!res.ok || !t.access_token) throw new Error(`token ${username} -> ${res.status}`);
  return t.access_token;
}

type Exec = Awaited<ReturnType<typeof createLiveReadExecutor>>;

describe.skipIf(!kcUp)('E2E-014 AC-E14-7 LIVE — H/I: real Keycloak AI-advisory authenticated read path', () => {
  let executor: Exec;
  let server: http.Server;
  let port: number;

  beforeAll(async () => {
    // I — the existing production LIVE READ executor wiring: real OIDC discovery against the
    // running realm plus a RealKeycloakVerifier (real JWKS RS256), exactly as the
    // /api/ai-advisory dispatch in executive-transport.ts constructs it.
    executor = await createLiveReadExecutor();
    if (!executor) throw new Error('live read executor unavailable (no IdP discovered)');
    // H — self-host the EXISTING advisory HTTP dispatch over a real local socket (established
    // LIVE-suite pattern): requests traverse actual HTTP, not an internal function call.
    server = http.createServer((req, res) => {
      void handleAiAdvisoryRequest(req, res, executor!, resolveSectorEngine);
    });
    await new Promise<void>((r) => server.listen(0, () => r()));
    port = (server.address() as AddressInfo).port;
  });

  afterAll(async () => {
    await new Promise<void>((r) => server?.close(() => r()));
  });

  async function advisoryGet(sectorKey: string, token: string): Promise<{ status: number; body: unknown }> {
    const res = await fetch(`http://127.0.0.1:${port}/api/ai-advisory/${encodeURIComponent(sectorKey)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return { status: res.status, body: await res.json().catch(() => ({})) };
  }

  it('H — authenticated LIVE advisory GET → HTTP 200 with the existing governed advisory body (I: real Keycloak discovery + token + JWKS verification)', async () => {
    // I — a REAL token acquired from the running realm's token endpoint (existing LIVE pattern).
    const token = await realToken('viewer-a'); // viewer is read-capable through the existing read gate
    const { status, body } = await advisoryGet('Banking', token);
    // H success criterion: HTTP 200 on the authenticated live advisory request.
    expect(status).toBe(200);
    // Existing governed advisory DTO semantics (nothing invented): the advisory body was
    // actually returned for the resolved governed sector key.
    const dto = body as Record<string, unknown>;
    expect(dto.engineResultId).toBe('Banking');
    expect(dto.text).toBe(ADVISORY_TEXT);
    expect(dto.label).toBe(ADVISORY_LABEL);
    expect(dto.freshness).toBe(ADVISORY_FRESHNESS);
    expect(dto.nonAuthoritative).toBe(true);
  });

  it('I — the real authentication path gates the dispatch: an invalid token is rejected with 401 (no fake-token bypass of the real verifier)', async () => {
    const { status } = await advisoryGet('Banking', 'invalid.garbage.token');
    expect(status).toBe(401);
  });
});
