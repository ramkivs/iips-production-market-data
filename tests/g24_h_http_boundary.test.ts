/**
 * Institutional Investment Platform System (IIPS)
 * G24 — Additive IPD HTTP Boundary Tests (NP04-G24 / §15, §17)
 *
 * End-to-end coverage of the additive IPD-owned Node HTTP boundary:
 * configuration, authentication, authorization, request validation, portfolio
 * read/write boundary, error mapping, startup and shutdown.
 *
 * The trusted issuer is represented by a local, test-owned JWKS endpoint using
 * a locally generated key pair. No external identity provider is contacted and
 * no IRR surface is involved.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { initializePersistenceWithConfig } from '../src/persistence/bootstrap.js';
import { temporaryPersistenceConfig } from '../src/persistence/config.js';
import { IdentityService } from '../src/app_identity/service.js';
import { OidcVerifier } from '../src/auth/oidc-verifier.js';
import { IpdHttpServer, startIpdServer } from '../src/server/http-server.js';
import {
  dhanBatch,
  generateRsaSigningKey,
  signJwt,
  startJwksServer,
  tempDatabasePath,
  zerodhaBatch,
  type JwksTestServer,
  type SigningKey,
} from './g24_test_support.js';

const ISSUER = 'https://keycloak.test/realms/ipd';
const AUDIENCE = 'ipd-user-portfolio-api';
const TENANT = 'TENANT-H';
const ACTOR = { actor: 'g24-http-test' };

interface BoundaryHarness {
  baseUrl: string;
  server: IpdHttpServer;
  token: string;
  otherToken: string;
  close: () => Promise<void>;
}

async function startBoundar(): Promise<BoundaryHarness> {
  const key: SigningKey = generateRsaSigningKey();
  const jwks: JwksTestServer = await startJwksServer([key.publicJwk]);
  const handle = initializePersistenceWithConfig(temporaryPersistenceConfig(tempDatabasePath('h')));

  const identity = new IdentityService(handle.connection);
  const provision = (subject: string, tenantId: string): string => {
    const { mapping, applicationUser } = identity.provisionExternalIdentityMapping({
      issuer: ISSUER,
      subject,
      actor: ACTOR.actor,
    });
    identity.approveMapping(mapping.mappingId, ACTOR);
    identity.activateMapping(mapping.mappingId, ACTOR);
    identity.provisionTenantMembership({
      applicationUserId: applicationUser.applicationUserId,
      tenantId,
      actor: ACTOR.actor,
    });
    return applicationUser.applicationUserId;
  };

  provision('user-h', TENANT);
  provision('other-h', 'TENANT-OTHER');

  const server = new IpdHttpServer({
    persistence: handle,
    verifier: new OidcVerifier({ issuer: ISSUER, jwksUri: jwks.url, audience: AUDIENCE }),
  });

  const port = await server.listen({ port: 0, host: '127.0.0.1' });
  const baseUrl = `http://127.0.0.1:${port}`;

  const mintToken = (subject: string): string =>
    signJwt({
      payload: {
        iss: ISSUER,
        aud: AUDIENCE,
        sub: subject,
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      },
      key,
    });

  return {
    baseUrl,
    server,
    token: mintToken('user-h'),
    otherToken: mintToken('other-h'),
    close: async () => {
      await server.close();
      await jwks.close();
    },
  };
}

function auth(token: string): Record<string, string> {
  return { authorization: `Bearer ${token}` };
}

test('G24-H1: the boundary reports health and refuses unauthenticated portfolio access', async () => {
  const h = await startBoundar();
  try {
    const health = await fetch(`${h.baseUrl}/api/ipd/health`);
    assert.equal(health.status, 200);
    const healthBody = (await health.json()) as { status: string };
    assert.equal(healthBody.status, 'UP');

    const unauthenticated = await fetch(`${h.baseUrl}/api/ipd/portfolios`);
    assert.equal(unauthenticated.status, 401);

    const badToken = await fetch(`${h.baseUrl}/api/ipd/portfolios`, {
      headers: auth('not-a-token'),
    });
    assert.equal(badToken.status, 401);
  } finally {
    await h.close();
  }
});

test('G24-H2: an authenticated owner can create, read and list portfolios', async () => {
  const h = await startBoundar();
  try {
    const created = await fetch(`${h.baseUrl}/api/ipd/portfolios`, {
      method: 'POST',
      headers: { ...auth(h.token), 'content-type': 'application/json' },
      body: JSON.stringify({ portfolioName: 'G24 HTTP Portfolio' }),
    });
    assert.equal(created.status, 201);
    const createdBody = (await created.json()) as {
      portfolio: { portfolioId: string; portfolioName: string; revision: number };
    };
    const portfolioId = createdBody.portfolio.portfolioId;
    assert.equal(createdBody.portfolio.revision, 0);
    assert.equal(createdBody.portfolio.portfolioName, 'G24 HTTP Portfolio');

    const list = await fetch(`${h.baseUrl}/api/ipd/portfolios`, { headers: auth(h.token) });
    assert.equal(list.status, 200);
    const listBody = (await list.json()) as { portfolios: Array<{ portfolioId: string }> };
    assert.equal(listBody.portfolios.length, 1);

    const read = await fetch(`${h.baseUrl}/api/ipd/portfolios/${portfolioId}`, {
      headers: auth(h.token),
    });
    assert.equal(read.status, 200);
  } finally {
    await h.close();
  }
});

test('G24-H3: the write boundary saves holdings and returns a durable revision', async () => {
  const h = await startBoundar();
  try {
    const created = await fetch(`${h.baseUrl}/api/ipd/portfolios`, {
      method: 'POST',
      headers: { ...auth(h.token), 'content-type': 'application/json' },
      body: JSON.stringify({ portfolioName: 'Write Portfolio' }),
    });
    const { portfolio } = (await created.json()) as { portfolio: { portfolioId: string } };

    const saved = await fetch(`${h.baseUrl}/api/ipd/portfolios/${portfolio.portfolioId}/holdings`, {
      method: 'PUT',
      headers: { ...auth(h.token), 'content-type': 'application/json' },
      body: JSON.stringify({
        mode: 'MERGE',
        sourceBroker: 'DHAN',
        fileName: 'dhan.csv',
        contentDigest: 'digest-h3',
        holdings: dhanBatch(),
        expectedRevision: 0,
      }),
    });

    assert.equal(saved.status, 201);
    const body = (await saved.json()) as {
      revision: number;
      holdingsSavedCount: number;
      disposition: string;
      provenanceDigest: string;
    };
    assert.equal(body.revision, 1);
    assert.equal(body.holdingsSavedCount, 2);
    assert.equal(body.disposition, 'SAVED_NEW_BATCH');
    assert.match(body.provenanceDigest, /^[0-9a-f]{64}$/);

    const merged = await fetch(`${h.baseUrl}/api/ipd/portfolios/${portfolio.portfolioId}/holdings`, {
      method: 'PUT',
      headers: { ...auth(h.token), 'content-type': 'application/json' },
      body: JSON.stringify({
        mode: 'MERGE',
        sourceBroker: 'ZERODHA',
        contentDigest: 'digest-h3-b',
        holdings: zerodhaBatch(),
        expectedRevision: 1,
      }),
    });
    assert.equal(merged.status, 201);
    const mergedBody = (await merged.json()) as { revision: number; holdingsSavedCount: number };
    assert.equal(mergedBody.revision, 2);
    assert.equal(mergedBody.holdingsSavedCount, 3);
  } finally {
    await h.close();
  }
});

test('G24-H4: a stale expected revision is rejected with 409', async () => {
  const h = await startBoundar();
  try {
    const created = await fetch(`${h.baseUrl}/api/ipd/portfolios`, {
      method: 'POST',
      headers: { ...auth(h.token), 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    const { portfolio } = (await created.json()) as { portfolio: { portfolioId: string } };

    const conflict = await fetch(
      `${h.baseUrl}/api/ipd/portfolios/${portfolio.portfolioId}/holdings`,
      {
        method: 'PUT',
        headers: { ...auth(h.token), 'content-type': 'application/json' },
        body: JSON.stringify({ holdings: dhanBatch(), expectedRevision: 42 }),
      }
    );
    assert.equal(conflict.status, 409);
    const body = (await conflict.json()) as { error: string };
    assert.equal(body.error, 'REVISION_CONFLICT');
  } finally {
    await h.close();
  }
});

test('G24-H5: request validation rejects an empty holdings vector with 400', async () => {
  const h = await startBoundar();
  try {
    const created = await fetch(`${h.baseUrl}/api/ipd/portfolios`, {
      method: 'POST',
      headers: { ...auth(h.token), 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    const { portfolio } = (await created.json()) as { portfolio: { portfolioId: string } };

    const rejected = await fetch(
      `${h.baseUrl}/api/ipd/portfolios/${portfolio.portfolioId}/holdings`,
      {
        method: 'PUT',
        headers: { ...auth(h.token), 'content-type': 'application/json' },
        body: JSON.stringify({ holdings: [] }),
      }
    );
    assert.equal(rejected.status, 400);
    const body = (await rejected.json()) as { error: string };
    assert.equal(body.error, 'SAVE_GUARD_VIOLATION');
  } finally {
    await h.close();
  }
});

test('G24-H6: reset and delete are exposed and tombstoned portfolios are not disclosed', async () => {
  const h = await startBoundar();
  try {
    const created = await fetch(`${h.baseUrl}/api/ipd/portfolios`, {
      method: 'POST',
      headers: { ...auth(h.token), 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    const { portfolio } = (await created.json()) as { portfolio: { portfolioId: string } };
    const id = portfolio.portfolioId;

    await fetch(`${h.baseUrl}/api/ipd/portfolios/${id}/holdings`, {
      method: 'PUT',
      headers: { ...auth(h.token), 'content-type': 'application/json' },
      body: JSON.stringify({ holdings: dhanBatch(), contentDigest: 'digest-h6' }),
    });

    const revisions = await fetch(`${h.baseUrl}/api/ipd/portfolios/${id}/revisions`, {
      headers: auth(h.token),
    });
    assert.equal(revisions.status, 200);
    const revisionsBody = (await revisions.json()) as { revisions: unknown[] };
    assert.equal(revisionsBody.revisions.length, 2);

    const reset = await fetch(`${h.baseUrl}/api/ipd/portfolios/${id}/reset`, {
      method: 'POST',
      headers: { ...auth(h.token), 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(reset.status, 200);

    const deleted = await fetch(`${h.baseUrl}/api/ipd/portfolios/${id}`, {
      method: 'DELETE',
      headers: auth(h.token),
    });
    assert.equal(deleted.status, 200);

    const afterDelete = await fetch(`${h.baseUrl}/api/ipd/portfolios/${id}`, {
      headers: auth(h.token),
    });
    assert.equal(afterDelete.status, 404, 'a tombstoned portfolio must not be disclosed');
  } finally {
    await h.close();
  }
});

test('G24-H7: another application user cannot reach the portfolio (owner isolation + non-disclosure)', async () => {
  const h = await startBoundar();
  try {
    const created = await fetch(`${h.baseUrl}/api/ipd/portfolios`, {
      method: 'POST',
      headers: { ...auth(h.token), 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    const { portfolio } = (await created.json()) as { portfolio: { portfolioId: string } };
    const id = portfolio.portfolioId;

    const intruderRead = await fetch(`${h.baseUrl}/api/ipd/portfolios/${id}`, {
      headers: auth(h.otherToken),
    });
    assert.equal(
      intruderRead.status,
      404,
      'unauthorized access must be indistinguishable from a missing resource'
    );

    const missingRead = await fetch(`${h.baseUrl}/api/ipd/portfolios/P-NOT-REAL`, {
      headers: auth(h.token),
    });
    assert.equal(missingRead.status, 404);
    assert.deepEqual(await intruderRead.json(), await missingRead.json());
  } finally {
    await h.close();
  }
});

test('G24-H8: a caller-supplied tenant that is not provisioned is refused', async () => {
  const h = await startBoundar();
  try {
    const response = await fetch(`${h.baseUrl}/api/ipd/portfolios`, {
      headers: { ...auth(h.token), 'x-ipd-tenant-id': 'TENANT-NOT-PROVISIONED' },
    });
    assert.equal(response.status, 403);
    const body = (await response.json()) as { error: string };
    assert.equal(body.error, 'TENANT_MEMBERSHIP_MISSING');
  } finally {
    await h.close();
  }
});

test('G24-H9: grace shutdown closes the HTTP listener and persistence', async () => {
  const h = await startBoundar();
  assert.equal(h.server.isListening, true);
  await h.close();
  assert.equal(h.server.isListening, false);
});

test('G24-H10: startup fails closed before HTTP listening when configuration is invalid', async () => {
  // Persistence configuration is absent: the boundary must never start listening.
  await assert.rejects(
    () =>
      startIpdServer({
        IPD_OIDC_ISSUER: ISSUER,
        IPD_OIDC_JWKS_URI: 'https://keycloak.test/jwks',
      }),
    (error: unknown) => (error as { code?: string }).code === 'PERSISTENCE_CONFIGURATION_INVALID'
  );

  // Persistence is configured but the OIDC trust inputs are absent: also fail closed.
  await assert.rejects(
    () => startIpdServer({ IPD_PORTFOLIO_DB_PATH: tempDatabasePath('h10') }),
    (error: unknown) => (error as { code?: string }).code === 'OIDC_CONFIGURATION_INVALID'
  );

  // A non-absolute database path is refused before any connection is attempted.
  await assert.rejects(
    () =>
      startIpdServer({
        IPD_PORTFOLIO_DB_PATH: 'relative/path.sqlite',
        IPD_OIDC_ISSUER: ISSUER,
        IPD_OIDC_JWKS_URI: 'https://keycloak.test/jwks',
      }),
    (error: unknown) => (error as { code?: string }).code === 'PERSISTENCE_CONFIGURATION_INVALID'
  );
});
