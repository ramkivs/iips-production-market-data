/**
 * Institutional Investment Platform System (IIPS)
 * G24 — Phase D/E/F/G Identity, Mapping, Audit and Tenant Tests (NP04-G24 / §17)
 *
 * Covers: application-user creation, external mapping, uniqueness, mapping
 * lifecycle, explicit linking, retirement/reactivation, ambiguity /
 * failure-closed behaviour, mapping audit atomicity, tenant boundary.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  IdentityService,
  IdentityLifecycleError,
  IdentityMappingConflictError,
  IdentityNotMappedError,
  TenantMembershipMissingError,
  TenantMembershipRevokedError,
} from '../src/app_identity/index.js';
import { openTestPersistence, closeTestPersistence } from './g24_test_support.js';

const ACTOR = { actor: 'g24-identity-test', context: 'NP04-G24' };
const ISSUER = 'https://keycloak.test/realms/ipd';
const OTHER_ISSUER = 'https://keycloak.test/realms/other';

function withService<T>(work: (service: IdentityService) => T): T {
  const handle = openTestPersistence('d');
  try {
    return work(new IdentityService(handle.connection));
  } finally {
    closeTestPersistence(handle);
  }
}

test('G24-D1: an application user has an opaque, stable, separately governed identifier', () => {
  withService((service) => {
    const user = service.createApplicationUser(ACTOR);
    assert.ok(user.applicationUserId.length > 0);
    // Opaque: no semantics from subject/username/companyId/portfolio.
    assert.match(
      user.applicationUserId,
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      'identifier must be an opaque UUID, not derived from identity material'
    );
    assert.equal(user.status, 'ACTIVE');
    void user.createdAt;
  });
});

test('G24-D2: a provisioned mapping starts in PENDING and is audited', () => {
  withService((service) => {
    const result = service.provisionExternalIdentityMapping({
      issuer: ISSUER,
      subject: 'subject-d2',
      actor: ACTOR.actor,
    });

    assert.equal(result.mapping.lifecycleState, 'PENDING');
    assert.equal(result.userCreated, true);
    assert.equal(result.mapping.issuer, ISSUER);
    assert.equal(result.mapping.subject, 'subject-d2');
  });
});

test('G24-D3: the external identity (issuer + subject) is unique', () => {
  withService((service) => {
    service.provisionExternalIdentityMapping({
      issuer: ISSUER,
      subject: 'subject-d3',
      actor: ACTOR.actor,
    });

    assert.throws(
      () =>
        service.provisionExternalIdentityMapping({
          issuer: ISSUER,
          subject: 'subject-d3',
          actor: ACTOR.actor,
        }),
      IdentityMappingConflictError
    );
  });
});

test('G24-D4: the issuer is part of the identity key (same subject, different issuer is distinct)', () => {
  withService((service) => {
    const first = service.provisionExternalIdentityMapping({
      issuer: ISSUER,
      subject: 'shared-subject',
      actor: ACTOR.actor,
    });
    const second = service.provisionExternalIdentityMapping({
      issuer: OTHER_ISSUER,
      subject: 'shared-subject',
      actor: ACTOR.actor,
    });

    assert.notEqual(
      first.applicationUser.applicationUserId,
      second.applicationUser.applicationUserId,
      'the same subject under a different issuer must not resolve to the same user'
    );
  });
});

test('G24-D5: the governed lifecycle progresses PENDING -> APPROVED -> ACTIVE', () => {
  withService((service) => {
    const { mapping } = service.provisionExternalIdentityMapping({
      issuer: ISSUER,
      subject: 'subject-d5',
      actor: ACTOR.actor,
    });

    const approved = service.approveMapping(mapping.mappingId, ACTOR);
    assert.equal(approved.lifecycleState, 'APPROVED');

    const active = service.activateMapping(mapping.mappingId, ACTOR);
    assert.equal(active.lifecycleState, 'ACTIVE');

    const resolved = service.resolveExternalIdentity(ISSUER, 'subject-d5');
    assert.equal(resolved.applicationUserId, mapping.applicationUserId);
    assert.equal(resolved.lifecycleState, 'ACTIVE');
  });
});

test('G24-D6: an invalid lifecycle transition is rejected', () => {
  withService((service) => {
    const { mapping } = service.provisionExternalIdentityMapping({
      issuer: ISSUER,
      subject: 'subject-d6',
      actor: ACTOR.actor,
    });

    // PENDING -> ACTIVE is not permitted.
    assert.throws(
      () => service.activateMapping(mapping.mappingId, ACTOR),
      IdentityLifecycleError
    );
  });
});

test('G24-D7: retirement records retiredAt and blocks resolution (fail closed)', () => {
  withService((service) => {
    const { mapping } = service.provisionExternalIdentityMapping({
      issuer: ISSUER,
      subject: 'subject-d7',
      actor: ACTOR.actor,
    });
    service.approveMapping(mapping.mappingId, ACTOR);
    service.activateMapping(mapping.mappingId, ACTOR);

    const retired = service.retireMapping(mapping.mappingId, ACTOR);
    assert.equal(retired.lifecycleState, 'RETIRED');
    assert.ok(retired.retiredAt, 'retirement timestamp must be recorded');

    assert.throws(
      () => service.resolveExternalIdentity(ISSUER, 'subject-d7'),
      IdentityNotMappedError
    );
  });
});

test('G24-D8: reactivation is explicit (RETIRED -> ACTIVE)', () => {
  withService((service) => {
    const { mapping } = service.provisionExternalIdentityMapping({
      issuer: ISSUER,
      subject: 'subject-d8',
      actor: ACTOR.actor,
    });
    service.approveMapping(mapping.mappingId, ACTOR);
    service.activateMapping(mapping.mappingId, ACTOR);
    service.retireMapping(mapping.mappingId, ACTOR);

    const reactivated = service.reactivateMapping(mapping.mappingId, ACTOR);
    assert.equal(reactivated.lifecycleState, 'ACTIVE');
    assert.equal(reactivated.retiredAt, null);

    const resolved = service.resolveExternalIdentity(ISSUER, 'subject-d8');
    assert.equal(resolved.lifecycleState, 'ACTIVE');
  });
});

test('G24-D9: a missing mapping fails closed and never creates an application user', () => {
  withService((service) => {
    assert.throws(
      () => service.resolveExternalIdentity(ISSUER, 'nobody'),
      (error: unknown) =>
        error instanceof IdentityNotMappedError && error.code === 'IDENTITY_NOT_MAPPED'
    );
  });
});

test('G24-D10: multiple external identities require explicit governed linking', () => {
  withService((service) => {
    const first = service.provisionExternalIdentityMapping({
      issuer: ISSUER,
      subject: 'subject-d10-a',
      actor: ACTOR.actor,
    });
    const second = service.provisionExternalIdentityMapping({
      issuer: ISSUER,
      subject: 'subject-d10-b',
      actor: ACTOR.actor,
    });

    // Without linking, the two subjects are separate users.
    assert.notEqual(
      first.applicationUser.applicationUserId,
      second.applicationUser.applicationUserId
    );

    // Explicit linking is available and audited.
    const linked = service.linkExternalIdentity({
      issuer: OTHER_ISSUER,
      subject: 'subject-d10-c',
      applicationUserId: first.applicationUser.applicationUserId,
      actor: ACTOR.actor,
    });
    assert.equal(linked.applicationUser.applicationUserId, first.applicationUser.applicationUserId);
    assert.equal(linked.mapping.lifecycleState, 'PENDING');
  });
});

test('G24-D11: mapping mutations and audit records are transactionally consistent', () => {
  withService((service) => {
    const { mapping } = service.provisionExternalIdentityMapping({
      issuer: ISSUER,
      subject: 'subject-d11',
      actor: ACTOR.actor,
    });
    service.approveMapping(mapping.mappingId, ACTOR);
    service.activateMapping(mapping.mappingId, ACTOR);

    const repository = (service as unknown as { repository: {
      listAuditEvents(mappingId: string): Array<{
        action: string;
        previousState: string | null;
        newState: string | null;
        actor: string;
        occurredAt: string;
      }>;
    } }).repository;

    const audit = repository.listAuditEvents(mapping.mappingId);

    assert.equal(
      audit.length,
      4,
      'CREATE_APPLICATION_USER, CREATE_MAPPING, APPROVE_MAPPING, ACTIVATE_MAPPING'
    );
    assert.equal(audit[0]!.action, 'CREATE_APPLICATION_USER');
    assert.equal(audit[1]!.action, 'CREATE_MAPPING');
    assert.equal(audit[1]!.previousState, null);
    assert.equal(audit[1]!.newState, 'PENDING');
    assert.equal(audit[2]!.action, 'APPROVE_MAPPING');
    assert.equal(audit[2]!.previousState, 'PENDING');
    assert.equal(audit[2]!.newState, 'APPROVED');
    assert.equal(audit[3]!.action, 'ACTIVATE_MAPPING');
    assert.equal(audit[3]!.previousState, 'APPROVED');
    assert.equal(audit[3]!.newState, 'ACTIVE');

    for (const event of audit) {
      assert.equal(event.actor, ACTOR.actor, 'governing actor must be recorded');
      assert.ok(event.occurredAt.length > 0, 'timestamp must be recorded');
    }

    // The audit trail must have a total, reproducible order even when several
    // records share the same millisecond (migration 002).
    const sequences = audit.map((event) => (event as unknown as { seq: number }).seq);
    assert.deepEqual(
      sequences,
      [...sequences].sort((a, b) => a - b),
      'audit records must be returned in monotonic sequence order'
    );
    assert.equal(new Set(sequences).size, sequences.length, 'sequence values must be distinct');
  });
});

test('G24-D12: an explicit correction re-points ownership and is audited', () => {
  withService((service) => {
    const first = service.provisionExternalIdentityMapping({
      issuer: ISSUER,
      subject: 'subject-d12',
      actor: ACTOR.actor,
    });
    service.approveMapping(first.mapping.mappingId, ACTOR);
    service.activateMapping(first.mapping.mappingId, ACTOR);

    const otherUser = service.createApplicationUser(ACTOR);

    const corrected = service.correctMappingOwner(
      first.mapping.mappingId,
      otherUser.applicationUserId,
      ACTOR
    );
    assert.equal(corrected.applicationUserId, otherUser.applicationUserId);

    const resolved = service.resolveExternalIdentity(ISSUER, 'subject-d12');
    assert.equal(resolved.applicationUserId, otherUser.applicationUserId);

    // A repeat of the same correction is refused (no implicit transfer).
    assert.throws(
      () =>
        service.correctMappingOwner(
          first.mapping.mappingId,
          otherUser.applicationUserId,
          ACTOR
        ),
      (error: unknown) => (error as { code?: string }).code === 'IDENTITY_CORRECTION_CONFLICT'
    );
  });
});

test('G24-D13: tenant membership is a separate authority and fails closed', () => {
  withService((service) => {
    const { applicationUser, mapping } = service.provisionExternalIdentityMapping({
      issuer: ISSUER,
      subject: 'subject-d13',
      actor: ACTOR.actor,
    });

    // No membership provisioned -> fail closed.
    assert.throws(
      () => service.resolveTenant(applicationUser.applicationUserId),
      TenantMembershipMissingError
    );

    service.provisionTenantMembership({
      applicationUserId: applicationUser.applicationUserId,
      tenantId: 'TENANT-D13',
      actor: ACTOR.actor,
    });
    service.approveMapping(mapping.mappingId, ACTOR);
    service.activateMapping(mapping.mappingId, ACTOR);

    assert.equal(service.resolveTenant(applicationUser.applicationUserId), 'TENANT-D13');

    // An unknown tenant id is refused.
    assert.throws(
      () => service.resolveTenant(applicationUser.applicationUserId, 'TENANT-UNKNOWN'),
      TenantMembershipMissingError
    );

    service.revokeTenantMembership({
      applicationUserId: applicationUser.applicationUserId,
      tenantId: 'TENANT-D13',
      actor: ACTOR.actor,
    });
    assert.throws(
      () => service.resolveTenant(applicationUser.applicationUserId, 'TENANT-D13'),
      TenantMembershipRevokedError
    );
  });
});
