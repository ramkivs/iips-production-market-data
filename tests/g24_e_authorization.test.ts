/**
 * Institutional Investment Platform System (IIPS)
 * G24 — Phase I Authorization Tests (NP04-G24 / §17)
 *
 * Covers: authenticated owner access, wrong owner, wrong tenant, deleted
 * portfolio, unauthorized resource non-disclosure.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { DurablePortfolioStore } from '../src/portfolio/durable-store.js';
import { IdentityService } from '../src/app_identity/service.js';
import { PortfolioAuthorizer } from '../src/server/authorization.js';
import {
  IdentityNotMappedError,
  TenantMembershipMissingError,
  TenantMembershipRevokedError,
} from '../src/app_identity/errors.js';
import { ResourceNotFoundError } from '../src/persistence/errors.js';
import { closeTestPersistence, dhanBatch, openTestPersistence } from './g24_test_support.js';
import type { VerifiedOidcCredential } from '../src/auth/oidc-verifier.js';

const ACTOR = { actor: 'g24-authorization-test' };
const ISSUER = 'https://keycloak.test/realms/ipd';

interface AuthorizationFixture {
  authorizer: PortfolioAuthorizer;
  store: DurablePortfolioStore;
  identity: IdentityService;
  close: () => void;
}

function fixture(): AuthorizationFixture {
  const handle = openTestPersistence('e');
  const identity = new IdentityService(handle.connection);
  const store = new DurablePortfolioStore(handle.connection);
  return {
    authorizer: new PortfolioAuthorizer(identity, store),
    store,
    identity,
    close: () => closeTestPersistence(handle),
  };
}

function credential(subject: string): VerifiedOidcCredential {
  return {
    issuer: ISSUER,
    subject,
    audience: 'ipd-user-portfolio-api',
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
    issuedAt: Math.floor(Date.now() / 1000),
    claims: { sub: subject, iss: ISSUER },
  };
}

/** Provisions a fully active identity with a tenant membership. */
function provisionUser(
  identity: IdentityService,
  subject: string,
  tenantId: string
): string {
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
}

test('G24-E1: the authenticated owner is authorized to read their portfolio', () => {
  const f = fixture();
  try {
    const ownerId = provisionUser(f.identity, 'owner-e1', 'TENANT-E');
    f.store.createPortfolio({
      applicationUserId: ownerId,
      tenantId: 'TENANT-E',
      portfolioId: 'P-E1',
    });

    const context = f.authorizer.authorize(credential('owner-e1'), 'P-E1');
    assert.equal(context.applicationUserId, ownerId);
    assert.equal(context.tenantId, 'TENANT-E');
    assert.equal(context.portfolioId, 'P-E1');
  } finally {
    f.close();
  }
});

test('G24-E2: a different application user is not authorized (wrong owner)', () => {
  const f = fixture();
  try {
    const ownerId = provisionUser(f.identity, 'owner-e2', 'TENANT-E');
    provisionUser(f.identity, 'intruder-e2', 'TENANT-E');

    f.store.createPortfolio({
      applicationUserId: ownerId,
      tenantId: 'TENANT-E',
      portfolioId: 'P-E2',
    });

    assert.throws(
      () => f.authorizer.authorize(credential('intruder-e2'), 'P-E2'),
      ResourceNotFoundError
    );
  } finally {
    f.close();
  }
});

test('G24-E3: the same user in a different tenant is not authorized (tenant isolation)', () => {
  const f = fixture();
  try {
    const ownerId = provisionUser(f.identity, 'owner-e3', 'TENANT-A');
    f.store.createPortfolio({
      applicationUserId: ownerId,
      tenantId: 'TENANT-A',
      portfolioId: 'P-E3',
    });

    assert.throws(
      () => f.authorizer.authorize(credential('owner-e3'), 'P-E3', 'TENANT-B'),
      (error: unknown) =>
        error instanceof TenantMembershipMissingError ||
        error instanceof ResourceNotFoundError
    );
  } finally {
    f.close();
  }
});

test('G24-E4: a deleted (tombstoned) portfolio is not authorized and not disclosed', () => {
  const f = fixture();
  try {
    const ownerId = provisionUser(f.identity, 'owner-e4', 'TENANT-E');
    f.store.createPortfolio({
      applicationUserId: ownerId,
      tenantId: 'TENANT-E',
      portfolioId: 'P-E4',
    });
    f.store.deletePortfolio({
      applicationUserId: ownerId,
      tenantId: 'TENANT-E',
      portfolioId: 'P-E4',
    });

    assert.throws(
      () => f.authorizer.authorize(credential('owner-e4'), 'P-E4'),
      ResourceNotFoundError
    );
  } finally {
    f.close();
  }
});

test('G24-E5: unauthorized access is indistinguishable from a missing resource', () => {
  const f = fixture();
  try {
    const ownerId = provisionUser(f.identity, 'owner-e5', 'TENANT-E');
    provisionUser(f.identity, 'intruder-e5', 'TENANT-E');
    f.store.createPortfolio({
      applicationUserId: ownerId,
      tenantId: 'TENANT-E',
      portfolioId: 'P-E5',
    });

    const outcomes: string[] = [];
    for (const scenario of [
      { subject: 'intruder-e5', portfolioId: 'P-E5' },
      { subject: 'owner-e5', portfolioId: 'P-DOES-NOT-EXIST' },
    ]) {
      try {
        f.authorizer.authorize(credential(scenario.subject), scenario.portfolioId);
        outcomes.push('authorized');
      } catch (error) {
        outcomes.push(
          error instanceof ResourceNotFoundError ? error.code : `other:${String(error)}`
        );
      }
    }

    assert.deepEqual(
      outcomes,
      ['RESOURCE_NOT_FOUND', 'RESOURCE_NOT_FOUND'],
      'both scenarios must produce the identical failure so existence is never disclosed'
    );
  } finally {
    f.close();
  }
});

test('G24-E6: an unmapped identity is refused (no implicit application user)', () => {
  const f = fixture();
  try {
    const ownerId = provisionUser(f.identity, 'owner-e6', 'TENANT-E');
    f.store.createPortfolio({
      applicationUserId: ownerId,
      tenantId: 'TENANT-E',
      portfolioId: 'P-E6',
    });

    assert.throws(
      () => f.authorizer.authorize(credential('unmapped-e6'), 'P-E6'),
      IdentityNotMappedError
    );
  } finally {
    f.close();
  }
});

test('G24-E7: an identity without tenant membership is refused', () => {
  const f = fixture();
  try {
    const { mapping } = f.identity.provisionExternalIdentityMapping({
      issuer: ISSUER,
      subject: 'no-tenant-e7',
      actor: ACTOR.actor,
    });
    f.identity.approveMapping(mapping.mappingId, ACTOR);
    f.identity.activateMapping(mapping.mappingId, ACTOR);
    // No membership provisioned.

    assert.throws(
      () => f.authorizer.authorize(credential('no-tenant-e7'), 'P-E7'),
      TenantMembershipMissingError
    );
  } finally {
    f.close();
  }
});

test('G24-E8: a revoked tenant membership is refused', () => {
  const f = fixture();
  try {
    const ownerId = provisionUser(f.identity, 'owner-e8', 'TENANT-E');
    f.store.createPortfolio({
      applicationUserId: ownerId,
      tenantId: 'TENANT-E',
      portfolioId: 'P-E8',
    });
    f.identity.revokeTenantMembership({
      applicationUserId: ownerId,
      tenantId: 'TENANT-E',
      actor: ACTOR.actor,
    });

    assert.throws(
      () => f.authorizer.authorize(credential('owner-e8'), 'P-E8'),
      TenantMembershipRevokedError
    );
  } finally {
    f.close();
  }
});

test('G24-E9: authorized writes succeed and produce durable revisions', () => {
  const f = fixture();
  try {
    const ownerId = provisionUser(f.identity, 'owner-e9', 'TENANT-E');
    f.store.createPortfolio({
      applicationUserId: ownerId,
      tenantId: 'TENANT-E',
      portfolioId: 'P-E9',
    });

    const context = f.authorizer.authorize(credential('owner-e9'), 'P-E9');
    const saved = f.store.saveHoldings({
      applicationUserId: context.applicationUserId,
      tenantId: context.tenantId,
      portfolioId: context.portfolioId,
      holdings: dhanBatch(),
      options: { mode: 'MERGE', contentDigest: 'd-e9' },
    });

    assert.equal(saved.success, true);
    assert.equal(saved.revision, 1);
  } finally {
    f.close();
  }
});
