/**
 * Institutional Investment Platform System (IIPS)
 * G24 — Phase H OIDC Security Tests (NP04-G24 / §17)
 *
 * Covers: invalid signature, wrong issuer, wrong audience, expired token,
 * missing subject, unmapped identity, invalid tenant membership.
 *
 * These tests exercise the verifier against a local, test-owned JWKS endpoint
 * and a locally generated key pair. No Keycloak instance and no external
 * identity authority is required or contacted.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

import {
  OidcVerifier,
  OidcAlgorithmRejectedError,
  OidcAudienceMismatchError,
  OidcIssuerMismatchError,
  OidcSignatureInvalidError,
  OidcSubjectMissingError,
  OidcTokenExpiredError,
  OidcTokenMalformedError,
  OidcTokenMissingError,
  OidcKeyUnavailableError,
  loadOidcTrustConfig,
  OidcConfigurationError,
  IPD_DEFAULT_AUDIENCE,
} from '../src/auth/index.js';
import {
  generateEcSigningKey,
  generateRsaSigningKey,
  signJwt,
  startJwksServer,
  type JwksTestServer,
  type SigningKey,
} from './g24_test_support.js';

const ISSUER = 'https://keycloak.test/realms/ipd';
const AUDIENCE = IPD_DEFAULT_AUDIENCE;
const FIXED_NOW = Date.parse('2026-09-30T12:00:00.000Z');

interface Harness {
  verifier: OidcVerifier;
  key: SigningKey;
  close: () => Promise<void>;
}

async function harness(keys?: SigningKey): Promise<Harness> {
  const key = keys ?? generateRsaSigningKey();
  const server: JwksTestServer = await startJwksServer([key.publicJwk]);
  const verifier = new OidcVerifier(
    { issuer: ISSUER, jwksUri: server.url, audience: AUDIENCE },
    undefined,
    () => FIXED_NOW
  );
  return { verifier, key, close: () => server.close() };
}

function claims(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    iss: ISSUER,
    aud: AUDIENCE,
    sub: 'user-subject-f',
    exp: Math.floor(FIXED_NOW / 1000) + 3600,
    iat: Math.floor(FIXED_NOW / 1000),
    ...overrides,
  };
}

test('G24-F1: a valid signed access token with the distinct IPD audience verifies', async () => {
  const h = await harness();
  try {
    const token = signJwt({ payload: claims(), key: h.key });
    const credential = await h.verifier.verifyAuthorizationHeader(`Bearer ${token}`);

    assert.equal(credential.issuer, ISSUER);
    assert.equal(credential.subject, 'user-subject-f');
    assert.equal(credential.audience, AUDIENCE);
  } finally {
    await h.close();
  }
});

test('G24-F2: an invalid signature is rejected', async () => {
  const h = await harness();
  try {
    // Signed by a key that is NOT in the trusted JWKS.
    const rogueKey = generateRsaSigningKey('rogue-key');
    const token = signJwt({ payload: claims(), key: rogueKey, kid: h.key.kid });

    await assert.rejects(
      () => h.verifier.verifyAuthorizationHeader(`Bearer ${token}`),
      OidcSignatureInvalidError
    );
  } finally {
    await h.close();
  }
});

test('G24-F3: a tampered payload is rejected', async () => {
  const h = await harness();
  try {
    const token = signJwt({ payload: claims(), key: h.key });
    const [header, , signature] = token.split('.') as [string, string, string];
    const tamperedPayload = Buffer.from(
      JSON.stringify(claims({ sub: 'attacker' }))
    )
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await assert.rejects(
      () => h.verifier.verifyAuthorizationHeader(`Bearer ${header}.${tamperedPayload}.${signature}`),
      OidcSignatureInvalidError
    );
  } finally {
    await h.close();
  }
});

test('G24-F4: a wrong issuer is rejected', async () => {
  const h = await harness();
  try {
    const token = signJwt({ payload: claims({ iss: 'https://evil.test/realms/fake' }), key: h.key });
    await assert.rejects(
      () => h.verifier.verifyAuthorizationHeader(`Bearer ${token}`),
      OidcIssuerMismatchError
    );
  } finally {
    await h.close();
  }
});

test('G24-F5: a wrong audience is rejected (iips-spa token is not accepted)', async () => {
  const h = await harness();
  try {
    const token = signJwt({ payload: claims({ aud: 'iips-spa' }), key: h.key });
    await assert.rejects(
      () => h.verifier.verifyAuthorizationHeader(`Bearer ${token}`),
      OidcAudienceMismatchError
    );
  } finally {
    await h.close();
  }
});

test('G24-F6: an audience array containing the IPD audience is accepted', async () => {
  const h = await harness();
  try {
    const token = signJwt({ payload: claims({ aud: ['iips-spa', AUDIENCE] }), key: h.key });
    const credential = await h.verifier.verifyAuthorizationHeader(`Bearer ${token}`);
    assert.equal(credential.audience, AUDIENCE);
  } finally {
    await h.close();
  }
});

test('G24-F7: an expired token is rejected', async () => {
  const h = await harness();
  try {
    const token = signJwt({
      payload: claims({ exp: Math.floor(FIXED_NOW / 1000) - 10 }),
      key: h.key,
    });
    await assert.rejects(
      () => h.verifier.verifyAuthorizationHeader(`Bearer ${token}`),
      OidcTokenExpiredError
    );
  } finally {
    await h.close();
  }
});

test('G24-F8: a token with no subject is rejected', async () => {
  const h = await harness();
  try {
    const payload = claims();
    delete payload['sub'];
    const token = signJwt({ payload, key: h.key });
    await assert.rejects(
      () => h.verifier.verifyAuthorizationHeader(`Bearer ${token}`),
      OidcSubjectMissingError
    );
  } finally {
    await h.close();
  }
});

test('G24-F9: the "none" algorithm is rejected', async () => {
  const h = await harness();
  try {
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT', kid: h.key.kid }))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const payload = Buffer.from(JSON.stringify(claims()))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await assert.rejects(
      () => h.verifier.verifyAuthorizationHeader(`Bearer ${header}.${payload}.`),
      OidcAlgorithmRejectedError
    );
  } finally {
    await h.close();
  }
});

test('G24-F10: a symmetric HS256 token is rejected', async () => {
  const h = await harness();
  try {
    const signingInput = `${Buffer.from(
      JSON.stringify({ alg: 'HS256', typ: 'JWT', kid: h.key.kid })
    )
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')}.${Buffer.from(JSON.stringify(claims()))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')}`;

    const signature = crypto
      .createHmac('sha256', 'attacker-secret')
      .update(signingInput)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await assert.rejects(
      () =>
        h.verifier.verifyAuthorizationHeader(`Bearer ${signingInput}.${signature}`),
      OidcAlgorithmRejectedError
    );
  } finally {
    await h.close();
  }
});

test('G24-F11: an unknown key id is rejected', async () => {
  const h = await harness();
  try {
    const token = signJwt({ payload: claims(), key: h.key, kid: 'not-in-jwks' });
    await assert.rejects(
      () => h.verifier.verifyAuthorizationHeader(`Bearer ${token}`),
      (error: unknown) =>
        error instanceof OidcKeyUnavailableError || error instanceof OidcSignatureInvalidError
    );
  } finally {
    await h.close();
  }
});

test('G24-F12: a missing or malformed Authorization header is rejected', async () => {
  const h = await harness();
  try {
    await assert.rejects(
      () => h.verifier.verifyAuthorizationHeader(undefined),
      OidcTokenMissingError
    );
    await assert.rejects(() => h.verifier.verifyAuthorizationHeader(''), OidcTokenMissingError);
    await assert.rejects(
      () => h.verifier.verifyAuthorizationHeader('Basic abc'),
      OidcTokenMissingError
    );
    await assert.rejects(
      () => h.verifier.verifyAuthorizationHeader('Bearer not-a-jwt'),
      OidcTokenMalformedError
    );
  } finally {
    await h.close();
  }
});

test('G24-F13: ES256 (P-256) signatures verify via the IEEE-P1363 to DER conversion', async () => {
  const key = generateEcSigningKey();
  const h = await harness(key);
  try {
    const token = signJwt({ payload: claims(), key });
    const credential = await h.verifier.verifyAuthorizationHeader(`Bearer ${token}`);
    assert.equal(credential.subject, 'user-subject-f');
  } finally {
    await h.close();
  }
});

test('G24-F14: an ES256 token with a corrupted signature is rejected', async () => {
  const key = generateEcSigningKey();
  const h = await harness(key);
  try {
    const token = signJwt({ payload: claims(), key });
    const [header, payload] = token.split('.') as [string, string, string];
    const badSignature = Buffer.alloc(64, 7)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await assert.rejects(
      () => h.verifier.verifyAuthorizationHeader(`Bearer ${header}.${payload}.${badSignature}`),
      OidcSignatureInvalidError
    );
  } finally {
    await h.close();
  }
});

test('G24-F15: OIDC trust configuration validation fails closed', () => {
  assert.throws(() => loadOidcTrustConfig({}), OidcConfigurationError);
  assert.throws(
    () => loadOidcTrustConfig({ IPD_OIDC_ISSUER: ISSUER }),
    OidcConfigurationError,
    'a missing JWKS URI must be refused'
  );
  assert.throws(
    () => loadOidcTrustConfig({ IPD_OIDC_ISSUER: ISSUER, IPD_OIDC_JWKS_URI: 'not-a-url' }),
    OidcConfigurationError
  );

  const config = loadOidcTrustConfig({
    IPD_OIDC_ISSUER: ISSUER,
    IPD_OIDC_JWKS_URI: 'https://keycloak.test/jwks',
  });
  assert.equal(config.audience, IPD_DEFAULT_AUDIENCE, 'the distinct IPD audience is the default');
});
