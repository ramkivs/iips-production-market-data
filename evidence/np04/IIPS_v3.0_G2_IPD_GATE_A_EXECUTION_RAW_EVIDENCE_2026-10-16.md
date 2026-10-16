# IIPS v3.0 — G-2: **GATE A — EXECUTION RAW EVIDENCE** (verbatim, 2026-10-16)

**Act:** `IIPS-V3-G2-IPD-GATE-A-PA-DECISION-2026-10-16-01` — Gate A local provisioning
**Companion record:** `evidence/np04/IIPS_v3.0_G2_IPD_GATE_A_EXECUTION_RECORD_2026-10-16.md`
**Status:** `GATE A — PROVISIONED / VALIDATED` · NON_PRODUCTION · offline, operator-run, one-time

This artifact carries the **verbatim outputs** of the act and its validation. Nothing here is
retyped or paraphrased: each block is the exact stdout of the governed tool, the exact
read-only API output, or the exact git output, captured at the times shown.

---

## 1. ACT RECORD — verbatim JSON (`node dist/src/gate_a/provision.js --execute`)

```json
{
  "actId": "IIPS-V3-G2-IPD-GATE-A-PA-DECISION-2026-10-16-01",
  "mode": "NON_PRODUCTION",
  "tool": "src/gate_a/provision.ts (operator tooling; not wired into any runtime path)",
  "outcome": "GATE A — PROVISIONED (validation pending)",
  "startedAtUtc": "2026-10-16T18:04:30.418Z",
  "executor": {
    "actor": "operator:gate-a-local-provisioning",
    "context": "IIPS-V3-G2-IPD-GATE-A-PA-DECISION-2026-10-16-01",
    "runtime": {
      "node": "v22.22.3",
      "betterSqlite3": "13.0.3",
      "platform": "linux",
      "clockUtcAtStart": "2026-10-16T18:04:30.418Z"
    }
  },
  "basis": {
    "ref": "refs/heads/arena/01a0f308-iips-production-market-data",
    "commit": "6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4",
    "tree": "eb07ea36059c6e2d3f1b6ff9afb8e3fb0c562cc5",
    "note": "Basis identifiers are operator-supplied here and independently verified in the durable execution record."
  },
  "store": {
    "databasePath": "/home/user/gate-a-store/ipd-portfolio.sqlite",
    "journalMode": "DELETE",
    "synchronous": "FULL",
    "foreignKeys": true
  },
  "preRun": {
    "storeExisted": false,
    "note": "No database file existed before this act; Gate A is the act that creates it."
  },
  "migration": {
    "applied": [
      "001",
      "002",
      "003"
    ],
    "schemaVersion": "003",
    "ledger": [
      {
        "id": "001",
        "name": "initial_schema",
        "checksum": "496650b39fde4264733bb1eaf3a0f98e8396efbe8bbac392b55eeee5e05a95a7",
        "appliedAt": "2026-10-16T18:04:30.432Z"
      },
      {
        "id": "002",
        "name": "audit_event_sequence",
        "checksum": "fbfe6affbe4894db4235a011e3f0781f1d057b9fae7e0cd4997b991d351ed6eb",
        "appliedAt": "2026-10-16T18:04:30.436Z"
      },
      {
        "id": "003",
        "name": "local_principal_bindings",
        "checksum": "38ed6e1bb88c386d12e8f47ed8be4c835505dbb59598697f0dc20e5651449aac",
        "appliedAt": "2026-10-16T18:04:30.440Z"
      }
    ]
  },
  "backup": {
    "path": "/home/user/gate-a-store/ipd-portfolio.sqlite.pre-provision-backup-2026-10-16T18-04-30-447Z.sqlite",
    "sha256": "b100eb7a73193a71a33fadff16a93ee2b014ccdf6171b1c6c39c4ac415b95c18",
    "sizeBytes": 143360,
    "createdAtUtc": "2026-10-16T18:04:30.449Z",
    "note": "Restored over the store on any failure; a restored backup leaves no provisioned state."
  },
  "provisioned": {
    "applicationUserId": "4f423263-e85d-4133-9119-31832cb3e49d",
    "applicationUserStatus": "ACTIVE",
    "tenantId": "t-1c568b7e-d883-4d85-a7f6-7433a490165a",
    "membershipState": "ACTIVE",
    "endpointId": "ep-4851658e-149c-4b3c-85e0-ae76e5dceacc",
    "bindingState": "ACTIVE",
    "actTimestampUtc": "2026-10-16T18:04:30.449Z",
    "rule": "tenant = \"t-\" + lowercase(UUIDv4); endpoint = \"ep-\" + lowercase(UUIDv4); generated once, immutable"
  },
  "transaction": {
    "form": "one immediateTransaction (provisioning + audit rows commit or roll back together)",
    "committed": true
  },
  "postRun": {
    "sizeBytes": 143360,
    "sha256": "7794e28144f29cf8235d5537d076408867636e03e77de996c303676823ab99e3",
    "tableCounts": [
      {
        "name": "application_users",
        "count": 1
      },
      {
        "name": "external_identity_mappings",
        "count": 0
      },
      {
        "name": "local_principal_audit_events",
        "count": 2
      },
      {
        "name": "local_principal_bindings",
        "count": 1
      },
      {
        "name": "mapping_audit_events",
        "count": 0
      },
      {
        "name": "portfolio_contributions",
        "count": 0
      },
      {
        "name": "portfolio_events",
        "count": 0
      },
      {
        "name": "portfolio_revision_holdings",
        "count": 0
      },
      {
        "name": "portfolio_revisions",
        "count": 0
      },
      {
        "name": "schema_migrations",
        "count": 3
      },
      {
        "name": "sqlite_sequence",
        "count": 2
      },
      {
        "name": "tenant_memberships",
        "count": 1
      },
      {
        "name": "user_portfolios",
        "count": 0
      }
    ],
    "applicationUsers": [
      {
        "application_user_id": "4f423263-e85d-4133-9119-31832cb3e49d",
        "status": "ACTIVE",
        "created_at": "2026-10-16T18:04:30.449Z",
        "updated_at": "2026-10-16T18:04:30.449Z"
      }
    ],
    "tenantMemberships": [
      {
        "application_user_id": "4f423263-e85d-4133-9119-31832cb3e49d",
        "tenant_id": "t-1c568b7e-d883-4d85-a7f6-7433a490165a",
        "state": "ACTIVE",
        "created_at": "2026-10-16T18:04:30.449Z",
        "updated_at": "2026-10-16T18:04:30.449Z"
      }
    ],
    "localPrincipalBindings": [
      {
        "endpoint_id": "ep-4851658e-149c-4b3c-85e0-ae76e5dceacc",
        "application_user_id": "4f423263-e85d-4133-9119-31832cb3e49d",
        "tenant_id": "t-1c568b7e-d883-4d85-a7f6-7433a490165a",
        "state": "ACTIVE",
        "created_at": "2026-10-16T18:04:30.449Z",
        "updated_at": "2026-10-16T18:04:30.449Z",
        "revoked_at": null
      }
    ],
    "localPrincipalAuditEvents": [
      {
        "seq": 1,
        "audit_id": "19c4ec68-4691-4fe1-84dd-41c1330942b7",
        "subject_type": "MEMBERSHIP",
        "subject_id": "4f423263-e85d-4133-9119-31832cb3e49d:t-1c568b7e-d883-4d85-a7f6-7433a490165a",
        "action": "MEMBERSHIP_CREATED",
        "previous_state": null,
        "new_state": "ACTIVE",
        "actor": "operator:gate-a-local-provisioning",
        "context": "IIPS-V3-G2-IPD-GATE-A-PA-DECISION-2026-10-16-01",
        "occurred_at": "2026-10-16T18:04:30.449Z"
      },
      {
        "seq": 2,
        "audit_id": "6d11ab97-a138-4fe7-b160-d472bc0b5632",
        "subject_type": "BINDING",
        "subject_id": "ep-4851658e-149c-4b3c-85e0-ae76e5dceacc",
        "action": "BINDING_CREATED",
        "previous_state": null,
        "new_state": "ACTIVE",
        "actor": "operator:gate-a-local-provisioning",
        "context": "IIPS-V3-G2-IPD-GATE-A-PA-DECISION-2026-10-16-01",
        "occurred_at": "2026-10-16T18:04:30.449Z"
      }
    ],
    "migrationLedger": [
      {
        "id": "001",
        "name": "initial_schema",
        "checksum": "496650b39fde4264733bb1eaf3a0f98e8396efbe8bbac392b55eeee5e05a95a7",
        "appliedAt": "2026-10-16T18:04:30.432Z"
      },
      {
        "id": "002",
        "name": "audit_event_sequence",
        "checksum": "fbfe6affbe4894db4235a011e3f0781f1d057b9fae7e0cd4997b991d351ed6eb",
        "appliedAt": "2026-10-16T18:04:30.436Z"
      },
      {
        "id": "003",
        "name": "local_principal_bindings",
        "checksum": "38ed6e1bb88c386d12e8f47ed8be4c835505dbb59598697f0dc20e5651449aac",
        "appliedAt": "2026-10-16T18:04:30.440Z"
      }
    ],
    "schemaVersion": "003"
  },
  "finishedAtUtc": "2026-10-16T18:04:30.454Z"
}
```

## 2. READ-ONLY VALIDATION V-A1..V-A7 — verbatim JSON (`validate.js --validate`)

```json
{
  "mode": "validate",
  "actId": "IIPS-V3-G2-IPD-GATE-A-PA-DECISION-2026-10-16-01",
  "databasePath": "/home/user/gate-a-store/ipd-portfolio.sqlite",
  "startedAtUtc": "2026-10-16T18:04:36.485Z",
  "readOnly": "only SELECT/PRAGMA reads are performed; the store file sha256 is asserted unchanged",
  "V-A1": {
    "passed": true,
    "schemaVersion": "003",
    "expectedSchemaVersion": "003",
    "ledgerRows": [
      {
        "id": "001",
        "name": "initial_schema",
        "checksum": "496650b39fde4264733bb1eaf3a0f98e8396efbe8bbac392b55eeee5e05a95a7",
        "appliedAt": "2026-10-16T18:04:30.432Z"
      },
      {
        "id": "002",
        "name": "audit_event_sequence",
        "checksum": "fbfe6affbe4894db4235a011e3f0781f1d057b9fae7e0cd4997b991d351ed6eb",
        "appliedAt": "2026-10-16T18:04:30.436Z"
      },
      {
        "id": "003",
        "name": "local_principal_bindings",
        "checksum": "38ed6e1bb88c386d12e8f47ed8be4c835505dbb59598697f0dc20e5651449aac",
        "appliedAt": "2026-10-16T18:04:30.440Z"
      }
    ],
    "checksumComparison": [
      {
        "id": "001",
        "name": "initial_schema",
        "ledgerChecksum": "496650b39fde4264733bb1eaf3a0f98e8396efbe8bbac392b55eeee5e05a95a7",
        "computedChecksum": "496650b39fde4264733bb1eaf3a0f98e8396efbe8bbac392b55eeee5e05a95a7",
        "match": true
      },
      {
        "id": "002",
        "name": "audit_event_sequence",
        "ledgerChecksum": "fbfe6affbe4894db4235a011e3f0781f1d057b9fae7e0cd4997b991d351ed6eb",
        "computedChecksum": "fbfe6affbe4894db4235a011e3f0781f1d057b9fae7e0cd4997b991d351ed6eb",
        "match": true
      },
      {
        "id": "003",
        "name": "local_principal_bindings",
        "ledgerChecksum": "38ed6e1bb88c386d12e8f47ed8be4c835505dbb59598697f0dc20e5651449aac",
        "computedChecksum": "38ed6e1bb88c386d12e8f47ed8be4c835505dbb59598697f0dc20e5651449aac",
        "match": true
      }
    ],
    "migrationStateValidated": true,
    "migrationStateError": null,
    "appliedAtNote": "ledger applied_at values are written by the migration runner at application time (environment clock, verified against the authoritative API clock in the durable record)"
  },
  "V-A2": {
    "passed": true,
    "count": 1,
    "rows": [
      {
        "application_user_id": "4f423263-e85d-4133-9119-31832cb3e49d",
        "status": "ACTIVE",
        "created_at": "2026-10-16T18:04:30.449Z",
        "updated_at": "2026-10-16T18:04:30.449Z"
      }
    ],
    "opaqueUuidV4": true,
    "statusActive": true
  },
  "V-A3": {
    "passed": true,
    "count": 1,
    "rows": [
      {
        "application_user_id": "4f423263-e85d-4133-9119-31832cb3e49d",
        "tenant_id": "t-1c568b7e-d883-4d85-a7f6-7433a490165a",
        "state": "ACTIVE",
        "created_at": "2026-10-16T18:04:30.449Z",
        "updated_at": "2026-10-16T18:04:30.449Z"
      }
    ],
    "tenantRuleT1r": true
  },
  "V-A4": {
    "passed": true,
    "count": 1,
    "rows": [
      {
        "endpoint_id": "ep-4851658e-149c-4b3c-85e0-ae76e5dceacc",
        "application_user_id": "4f423263-e85d-4133-9119-31832cb3e49d",
        "tenant_id": "t-1c568b7e-d883-4d85-a7f6-7433a490165a",
        "state": "ACTIVE",
        "created_at": "2026-10-16T18:04:30.449Z",
        "updated_at": "2026-10-16T18:04:30.449Z",
        "revoked_at": null
      }
    ],
    "endpointRuleEpUuid": true,
    "fkToProvisionedUser": true,
    "tenantMatchesMembership": true
  },
  "V-A5": {
    "passed": true,
    "count": 2,
    "rows": [
      {
        "seq": 1,
        "audit_id": "19c4ec68-4691-4fe1-84dd-41c1330942b7",
        "subject_type": "MEMBERSHIP",
        "subject_id": "4f423263-e85d-4133-9119-31832cb3e49d:t-1c568b7e-d883-4d85-a7f6-7433a490165a",
        "action": "MEMBERSHIP_CREATED",
        "previous_state": null,
        "new_state": "ACTIVE",
        "actor": "operator:gate-a-local-provisioning",
        "context": "IIPS-V3-G2-IPD-GATE-A-PA-DECISION-2026-10-16-01",
        "occurred_at": "2026-10-16T18:04:30.449Z"
      },
      {
        "seq": 2,
        "audit_id": "6d11ab97-a138-4fe7-b160-d472bc0b5632",
        "subject_type": "BINDING",
        "subject_id": "ep-4851658e-149c-4b3c-85e0-ae76e5dceacc",
        "action": "BINDING_CREATED",
        "previous_state": null,
        "new_state": "ACTIVE",
        "actor": "operator:gate-a-local-provisioning",
        "context": "IIPS-V3-G2-IPD-GATE-A-PA-DECISION-2026-10-16-01",
        "occurred_at": "2026-10-16T18:04:30.449Z"
      }
    ],
    "requiredActionsPresent": true,
    "seqStrictlyIncreasing": true,
    "actorAndOccurredAtPresent": true,
    "sameTransaction": "written inside the act’s single immediateTransaction; independent atomicity evidence in the rehearsal"
  },
  "V-A6": {
    "passed": true,
    "tableInventory": [
      {
        "name": "application_users",
        "count": 1
      },
      {
        "name": "external_identity_mappings",
        "count": 0
      },
      {
        "name": "local_principal_audit_events",
        "count": 2
      },
      {
        "name": "local_principal_bindings",
        "count": 1
      },
      {
        "name": "mapping_audit_events",
        "count": 0
      },
      {
        "name": "portfolio_contributions",
        "count": 0
      },
      {
        "name": "portfolio_events",
        "count": 0
      },
      {
        "name": "portfolio_revision_holdings",
        "count": 0
      },
      {
        "name": "portfolio_revisions",
        "count": 0
      },
      {
        "name": "schema_migrations",
        "count": 3
      },
      {
        "name": "sqlite_sequence",
        "count": 2
      },
      {
        "name": "tenant_memberships",
        "count": 1
      },
      {
        "name": "user_portfolios",
        "count": 0
      }
    ],
    "externalIdentityMappings": 0,
    "userPortfolios": 0,
    "portfolioRevisions": 0
  },
  "V-A7": {
    "passed": true,
    "resolveTenantReturnsProvisionedTenant": true,
    "resolvedTenant": "t-1c568b7e-d883-4d85-a7f6-7433a490165a",
    "absentMembershipProbe": {
      "name": "TenantMembershipMissingError",
      "code": "TENANT_MEMBERSHIP_MISSING",
      "message": "No tenant membership is provisioned for application user \"4501971c-d1f5-49e3-b97f-a29c5346976a\". Tenant identity is not derived from any request-supplied field."
    },
    "wrongTenantProbe": {
      "name": "TenantMembershipMissingError",
      "code": "TENANT_MEMBERSHIP_MISSING",
      "message": "No tenant membership is provisioned for application user \"4f423263-e85d-4133-9119-31832cb3e49d\". Tenant identity is not derived from any request-supplied field."
    },
    "probesIndistinguishable": true,
    "activeBindingCount": 1,
    "refusalPathsNote": "zero/multiple ACTIVE bindings and revoked states refuse identically; demonstrated on disposable copies in --rehearsal"
  },
  "V-A8": {
    "evaluatedHere": false,
    "note": "External invariants (IRR 503 fence blobs, IPD main, PR #8/#118 states, no promotion) are captured by the operator/recorder and recorded in the durable execution record; this tool runs offline."
  },
  "storageFile": {
    "sha256Before": "7794e28144f29cf8235d5537d076408867636e03e77de996c303676823ab99e3",
    "sha256After": "7794e28144f29cf8235d5537d076408867636e03e77de996c303676823ab99e3",
    "unchangedByValidation": true,
    "sizeBytes": 143360
  },
  "againstActRecord": {
    "actRecordPath": "/home/user/gate-a-store/evidence/act-record.json",
    "applicationUserIdMatches": true,
    "tenantIdMatches": true,
    "endpointIdMatches": true
  },
  "failures": [],
  "outcome": "V-A1..V-A7 STORE-SIDE CHECKS PASSED (V-A8 externalized; no write by validation tooling)",
  "finishedAtUtc": "2026-10-16T18:04:36.505Z"
}
```

## 3. DISPOSABLE-COPY REHEARSALS — verbatim JSON (`validate.js --rehearsal`)

```json
{
  "mode": "rehearsal",
  "actId": "IIPS-V3-G2-IPD-GATE-A-PA-DECISION-2026-10-16-01",
  "databasePath": "/home/user/gate-a-store/ipd-portfolio.sqlite",
  "startedAtUtc": "2026-10-16T18:04:36.579Z",
  "scope": "DISPOSABLE COPIES ONLY — the live store is never written; copies are discarded",
  "revocationRehearsal": {
    "copy": "/home/user/gate-a-store/ipd-portfolio.sqlite.rehearsal-revocation-2026-10-16T18-04-36-580Z.sqlite",
    "bindingRevocation": {
      "state": "REVOKED",
      "revokedAt": "2026-10-16T18:04:36.587Z"
    },
    "resolveActiveBindingAfterRevocation": {
      "name": "LocalPrincipalBindingUnresolvedError",
      "code": "LOCAL_PRINCIPAL_BINDING_UNRESOLVED",
      "message": "No single active local principal binding is resolvable; resolution refuses and discloses no owner."
    },
    "repeatRevocationRefused": {
      "name": "LocalPrincipalRevocationInvalidError",
      "code": "LOCAL_PRINCIPAL_REVOCATION_INVALID",
      "message": "Subject \"ep-4851658e-149c-4b3c-85e0-ae76e5dceacc\" is already REVOKED; revocation is one-way and restoration is not authorized."
    },
    "rebindByReuseRefused": {
      "name": "LocalPrincipalBindingConflictError",
      "code": "LOCAL_PRINCIPAL_BINDING_CONFLICT",
      "message": "A local principal binding already exists for application user \"4f423263-e85d-4133-9119-31832cb3e49d\"; re-binding by reuse is not authorized."
    },
    "tenantResolvesWhileMembershipActive": "t-1c568b7e-d883-4d85-a7f6-7433a490165a",
    "membershipRevocation": {
      "state": "REVOKED"
    },
    "resolveTenantAfterMembershipRevocation": {
      "name": "TenantMembershipRevokedError",
      "code": "TENANT_MEMBERSHIP_REVOKED",
      "message": "Tenant membership for application user \"4f423263-e85d-4133-9119-31832cb3e49d\" in tenant \"t-1c568b7e-d883-4d85-a7f6-7433a490165a\" is REVOKED."
    },
    "reprovisionAfterRevocationRefused": {
      "name": "LocalPrincipalMembershipConflictError",
      "code": "LOCAL_PRINCIPAL_MEMBERSHIP_CONFLICT",
      "message": "A tenant membership already exists for application user \"4f423263-e85d-4133-9119-31832cb3e49d\"; re-provisioning requires a new explicit act."
    },
    "auditTrailAfterRehearsal": [
      {
        "seq": 1,
        "action": "MEMBERSHIP_CREATED",
        "subjectType": "MEMBERSHIP",
        "subjectId": "4f423263-e85d-4133-9119-31832cb3e49d:t-1c568b7e-d883-4d85-a7f6-7433a490165a",
        "previousState": null,
        "newState": "ACTIVE",
        "actor": "operator:gate-a-local-provisioning"
      },
      {
        "seq": 2,
        "action": "BINDING_CREATED",
        "subjectType": "BINDING",
        "subjectId": "ep-4851658e-149c-4b3c-85e0-ae76e5dceacc",
        "previousState": null,
        "newState": "ACTIVE",
        "actor": "operator:gate-a-local-provisioning"
      },
      {
        "seq": 3,
        "action": "BINDING_REVOKED",
        "subjectType": "BINDING",
        "subjectId": "ep-4851658e-149c-4b3c-85e0-ae76e5dceacc",
        "previousState": "ACTIVE",
        "newState": "REVOKED",
        "actor": "operator:gate-a-rehearsal"
      },
      {
        "seq": 4,
        "action": "MEMBERSHIP_REVOKED",
        "subjectType": "MEMBERSHIP",
        "subjectId": "4f423263-e85d-4133-9119-31832cb3e49d:t-1c568b7e-d883-4d85-a7f6-7433a490165a",
        "previousState": "ACTIVE",
        "newState": "REVOKED",
        "actor": "operator:gate-a-rehearsal"
      }
    ],
    "copySha256AfterRehearsal": "654c6557351a218566153e8edf413f07bfdb21cc04e08e467d08f84e1da90e3f"
  },
  "revocationRehearsalDiscarded": true,
  "atomicityRehearsal": {
    "copy": "/home/user/gate-a-store/ipd-portfolio.sqlite.rehearsal-atomicity-2026-10-16T18-04-36-594Z.sqlite",
    "inducedFailure": {
      "name": "Error",
      "code": null,
      "message": "rehearsal-induced failure: no partial state may survive"
    },
    "tableCountsBefore": [
      {
        "name": "application_users",
        "count": 1
      },
      {
        "name": "external_identity_mappings",
        "count": 0
      },
      {
        "name": "local_principal_audit_events",
        "count": 2
      },
      {
        "name": "local_principal_bindings",
        "count": 1
      },
      {
        "name": "mapping_audit_events",
        "count": 0
      },
      {
        "name": "portfolio_contributions",
        "count": 0
      },
      {
        "name": "portfolio_events",
        "count": 0
      },
      {
        "name": "portfolio_revision_holdings",
        "count": 0
      },
      {
        "name": "portfolio_revisions",
        "count": 0
      },
      {
        "name": "schema_migrations",
        "count": 3
      },
      {
        "name": "sqlite_sequence",
        "count": 2
      },
      {
        "name": "tenant_memberships",
        "count": 1
      },
      {
        "name": "user_portfolios",
        "count": 0
      }
    ],
    "tableCountsAfter": [
      {
        "name": "application_users",
        "count": 1
      },
      {
        "name": "external_identity_mappings",
        "count": 0
      },
      {
        "name": "local_principal_audit_events",
        "count": 2
      },
      {
        "name": "local_principal_bindings",
        "count": 1
      },
      {
        "name": "mapping_audit_events",
        "count": 0
      },
      {
        "name": "portfolio_contributions",
        "count": 0
      },
      {
        "name": "portfolio_events",
        "count": 0
      },
      {
        "name": "portfolio_revision_holdings",
        "count": 0
      },
      {
        "name": "portfolio_revisions",
        "count": 0
      },
      {
        "name": "schema_migrations",
        "count": 3
      },
      {
        "name": "sqlite_sequence",
        "count": 2
      },
      {
        "name": "tenant_memberships",
        "count": 1
      },
      {
        "name": "user_portfolios",
        "count": 0
      }
    ],
    "noPartialState": true,
    "foreignKeyEnforcement": {
      "name": "SqliteError",
      "code": "SQLITE_CONSTRAINT_FOREIGNKEY",
      "message": "FOREIGN KEY constraint failed"
    },
    "copySha256AfterRehearsal": "7794e28144f29cf8235d5537d076408867636e03e77de996c303676823ab99e3"
  },
  "atomicityRehearsalDiscarded": true,
  "backupRestoreCheck": {
    "backupPath": "/home/user/gate-a-store/ipd-portfolio.sqlite.pre-provision-backup-2026-10-16T18-04-30-447Z.sqlite",
    "sha256": "b100eb7a73193a71a33fadff16a93ee2b014ccdf6171b1c6c39c4ac415b95c18",
    "matchesActRecord": true,
    "schemaVersion": "003",
    "tableCounts": [
      {
        "name": "application_users",
        "count": 0
      },
      {
        "name": "external_identity_mappings",
        "count": 0
      },
      {
        "name": "local_principal_audit_events",
        "count": 0
      },
      {
        "name": "local_principal_bindings",
        "count": 0
      },
      {
        "name": "mapping_audit_events",
        "count": 0
      },
      {
        "name": "portfolio_contributions",
        "count": 0
      },
      {
        "name": "portfolio_events",
        "count": 0
      },
      {
        "name": "portfolio_revision_holdings",
        "count": 0
      },
      {
        "name": "portfolio_revisions",
        "count": 0
      },
      {
        "name": "schema_migrations",
        "count": 3
      },
      {
        "name": "sqlite_sequence",
        "count": 1
      },
      {
        "name": "tenant_memberships",
        "count": 0
      },
      {
        "name": "user_portfolios",
        "count": 0
      }
    ],
    "provisionedRowsPresent": false,
    "note": "A restore of this backup would leave NO provisioned state (schema only)."
  },
  "liveStore": {
    "sha256Before": "7794e28144f29cf8235d5537d076408867636e03e77de996c303676823ab99e3",
    "sha256After": "7794e28144f29cf8235d5537d076408867636e03e77de996c303676823ab99e3",
    "unchangedByRehearsal": true
  },
  "finishedAtUtc": "2026-10-16T18:04:36.601Z"
}
```

## 4. V-A8 EXTERNAL INVARIANTS — verbatim captured output

```text
=== V-A8 EXTERNAL INVARIANTS (captured 2026-10-16T18:04:50Z, read-only GitHub API / git ls-remote) ===

--- IRR repository: ramkivs/iips-review-recovered ---
IRR main                : 10584439f33dfa9192955c3f74879f20ccaf111e
IRR PR #118             : state=MERGED mergedAt=2026-10-16T17:52:23Z mergeCommit=10584439f33dfa9192955c3f74879f20ccaf111e head=7a07dc37490cfde8c250efedd09a26f28d91e726
DP-1 amendment on main  : c71661a1ee445b2348cedfedae4aef6449029ebb size=17128
503 fence owner-context-unavailable.ts : cb8db45d668d28cee7e0a52721001d579a872733  [expected cb8db45d668d28cee7e0a52721001d579a872733]
503 fence user-portfolio-transport.ts  : 51704c12a467cd2f718a030b5036bc55c9afa73f  [expected 51704c12a467cd2f718a030b5036bc55c9afa73f]

--- IPD repository: ramkivs/iips-production-market-data ---
IPD main                : 70b24f029842a7e9b7f615e4d9df7376fd4ff817  [expected 70b24f029842a7e9b7f615e4d9df7376fd4ff817]
IPD PR #8               : state=OPEN merged=null head=f3ca83881fcdf67520433a0d6b3bbd216d76aa2e files=15
basis carrier ref       : refs/heads/arena/01a0f308-iips-production-market-data = 6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4  [expected 6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4]
target ref (unchanged)  : refs/heads/arena/01a0e6d9-iips-production-market-data = c1b955b427486dbce6d6a159a448065b9db45dc9  [expected c1b955b427486dbce6d6a159a448065b9db45dc9]
governance branch       : refs/heads/arena/01a0f839-iips-production-market-data = 12c480b5bf5cfbe0f296fcd12c9189328b915417  [expected 12c480b5bf5cfbe0f296fcd12c9189328b915417]
NP-04 pin               : refs/heads/np04-governed-persistence-windows = 2e11fa3b689d1a3674a5e4ba1f1de9a559e20494  [expected 2e11fa3b689d1a3674a5e4ba1f1de9a559e20494]
ref inventory           : heads=34 tags=4 pull-refs=9 (ls-remote all refs incl. HEAD=48)  [unchanged vs pre-act inventory]
no derivative ref pushed: 0 (must be 0 — the derivative branch is local-only by this act)
```

## 5. ENABLEMENT CHANGE IDENTITY (A-2/A-3 additions on the designated basis)

```text
derivative branch       : gate-a/local-principal-enablement-2026-10-16 (LOCAL ONLY; not pushed)
derivative commit       : 2ded0e981407b38c73bdea164153f53856aa7217
parent (designated basis): 6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4
tree                    : 9069045d3daf22156020188696fc2f9c2f32bf27
bundle                  : /home/user/gate-a-store/gate-a-derivative-2ded0e9.bundle sha256=eeb7355358907fb28fa6789fc4a7b13ea8f9ea8ed5c07ef21bfc71b8a62be201

--- per-file blob SHA + sha256 ---
src/persistence/migrations/003_local_principal_bindings.ts blob=9ba884acc3c554c839a32ca41d0d16bda7e64690 sha256=2ccdab47cbb4f377e97e918e3d76b959675153c103f279770304d62d8ea117b5
src/app_identity/local_principal.ts                        blob=710a47e22e5afc99c1744e11926719fc8356f20a sha256=e4646bd05df7394d66bfa8ba19773572fe0b920cd066db6263fd8043e9e3f0ac
src/gate_a/provision.ts                                    blob=b6f780f63278d333fd38c66e1abd2f3b64dcc2ea sha256=e7bfb06af006993c54a5268ccd545272daeefba0f9c48dff8d570087df922150
src/gate_a/validate.ts                                     blob=550b9f4b83983d5d57aa29f565f371e5bcbed430 sha256=2b8291185fa1ab4f3a1913c966172f21e2ae7a2f1605a27a656bfc283b79ff58
src/persistence/migrations/registry.ts                     blob=5d3ab64ae97ab5b6621d01775d4c69d4c0d3301e sha256=05a56558d9bc2dcbe64830c386fce138fef148618d4a3447aa2e8e86dab9381e
src/persistence/migrations/index.ts                        blob=92a7b613eda6c8f900b295b23245dd710f199d10 sha256=bbd6f701f3191122ae268588b3820f60ca44eeeb52f7a18624734d7e40b48b46
src/app_identity/index.ts                                  blob=0fcc7aa156fb17165bbc649d4fe181a3e00f2f06 sha256=105e5e668ba9ce038f04b78d53c5bce503c816314f45b02f348be93da92064a8
tests/g24_a_persistence_foundation.test.ts                 blob=68a2928832099d63960487e4905528fdfc0e5623 sha256=491e42aa69815641a627dd712b8cf9a74018c9cf0b87f38e2d192db84df131ac
tests/g24_b_migrations.test.ts                             blob=8395fcc9559677e5ae2990347f7d9d01e3131204 sha256=59cc406a9dcf5d66fb0287d3468a67e8d5d9a5ec3ef0a02b23ecaca82b4d6136
tests/g24_g_recovery.test.ts                               blob=86928951b83f9b6ffb37e182813a6055a2c24a96 sha256=268966f63cc2ea72996fd1bd3a44ffc855dc61b0e72ce605162c702c81a63b07

--- 001/002 unchanged vs designated object ---
src/persistence/migrations/001_initial_schema.ts           blob=48fcf4d9ef802c2d7e83a6a9411b275221bf6ca6
src/persistence/migrations/002_audit_event_sequence.ts     blob=dfe9f027ebeb9a35d47c47d63634a2aec7261944

--- diffstat vs designated object ---
 src/app_identity/index.ts                          |   1 +
 src/app_identity/local_principal.ts                | 530 +++++++++++++++++++
 src/gate_a/provision.ts                            | 355 +++++++++++++
 src/gate_a/validate.ts                             | 587 +++++++++++++++++++++
 .../migrations/003_local_principal_bindings.ts     |  75 +++
 src/persistence/migrations/index.ts                |   1 +
 src/persistence/migrations/registry.ts             |   2 +
 tests/g24_a_persistence_foundation.test.ts         |   6 +-
 tests/g24_b_migrations.test.ts                     |  26 +-
 tests/g24_g_recovery.test.ts                       |   8 +-
 10 files changed, 1572 insertions(+), 19 deletions(-)
```

### 5.1 Exact unified diff of the enablement change (basis `6828155…` → derivative `2ded0e9…`)

Diff file sha256: `0f4f323a8b3237df7b3a0850c6095465aff3e95fd434a7fcc1eb5d9756869c1a`

```diff
diff --git a/src/app_identity/index.ts b/src/app_identity/index.ts
index 6b98f48..0fcc7aa 100644
--- a/src/app_identity/index.ts
+++ b/src/app_identity/index.ts
@@ -7,3 +7,4 @@ export * from './types.js';
 export * from './errors.js';
 export * from './repository.js';
 export * from './service.js';
+export * from './local_principal.js';
diff --git a/src/app_identity/local_principal.ts b/src/app_identity/local_principal.ts
new file mode 100644
index 0000000..710a47e
--- /dev/null
+++ b/src/app_identity/local_principal.ts
@@ -0,0 +1,530 @@
+/**
+ * Institutional Investment Platform System (IIPS)
+ * Local Principal Boundary — Binding Record (A-2) & Local Audit Line (A-3)
+ * G-2 / Gate A — NP04-G24 identity-boundary extension
+ *
+ * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
+ * Execution Mode: NON_PRODUCTION
+ *
+ * Authority: the A-2/A-3 additions were accepted under the L-IPC-1 rev 2 contract and
+ * authorized — exactly and only as the A-2/A-3 enablement — by the rendered Gate A
+ * decision `IIPS-V3-G2-IPD-GATE-A-PA-DECISION-2026-10-16-01`.
+ *
+ * Invariants enforced here:
+ *  - the binding record is local and act-provisioned; it is deliberately NOT
+ *    `external_identity_mappings` (a transport fact must never be conflated with an
+ *    external-identity claim: no issuer/subject, no mapping lifecycle reuse);
+ *  - exactly ONE ACTIVE binding is resolvable; zero or more than one REFUSES and
+ *    discloses no owner (fail-closed, never guessed);
+ *  - revocation is ONE-WAY: `ACTIVE -> REVOKED`. There is no restore/re-bind path in
+ *    this boundary, a second revocation on a REVOKED row is refused, and a binding
+ *    that has been revoked is never revived by reuse;
+ *  - re-provisioning after revocation requires a NEW explicit act: provisioning
+ *    refuses when a membership or binding already exists for the application user;
+ *  - every audit row is written in the SAME transaction as the mutation it audits;
+ *    the audit line is LOCAL ONLY — no cross-system destination exists or is implied.
+ */
+
+import { randomUUID } from 'node:crypto';
+import type { PersistenceConnection } from '../persistence/connection.js';
+import { IdentityRepository } from './repository.js';
+import { IdentityService } from './service.js';
+import type { GovernanceActorContext, TenantMembership } from './types.js';
+
+/** Governed binding lifecycle. One-way: ACTIVE -> REVOKED. */
+export type LocalPrincipalBindingState = 'ACTIVE' | 'REVOKED';
+
+/** Audit subjects: the binding record and the tenant membership. */
+export type LocalPrincipalAuditSubjectType = 'BINDING' | 'MEMBERSHIP';
+
+/** The four lifecycle events written by the A-3 audit line. */
+export type LocalPrincipalAuditAction =
+  | 'BINDING_CREATED'
+  | 'BINDING_REVOKED'
+  | 'MEMBERSHIP_CREATED'
+  | 'MEMBERSHIP_REVOKED';
+
+export interface LocalPrincipalBinding {
+  readonly endpointId: string;
+  readonly applicationUserId: string;
+  readonly tenantId: string;
+  readonly state: LocalPrincipalBindingState;
+  readonly createdAt: string;
+  readonly updatedAt: string;
+  readonly revokedAt: string | null;
+}
+
+export interface LocalPrincipalAuditEvent {
+  /** Monotonic sequence: the total, reproducible ordering authority of the audit line. */
+  readonly seq: number;
+  readonly auditId: string;
+  readonly subjectType: LocalPrincipalAuditSubjectType;
+  readonly subjectId: string;
+  readonly action: LocalPrincipalAuditAction;
+  readonly previousState: string | null;
+  readonly newState: string | null;
+  readonly actor: string;
+  readonly context: string | null;
+  readonly occurredAt: string;
+}
+
+export type LocalPrincipalErrorCode =
+  | 'LOCAL_PRINCIPAL_SUBJECT_UNKNOWN'
+  | 'LOCAL_PRINCIPAL_BINDING_CONFLICT'
+  | 'LOCAL_PRINCIPAL_BINDING_UNRESOLVED'
+  | 'LOCAL_PRINCIPAL_REVOCATION_INVALID'
+  | 'LOCAL_PRINCIPAL_MEMBERSHIP_CONFLICT';
+
+/** Every one of these is a FAIL-CLOSED outcome. None is a licence to create, guess,
+ *  re-bind, or restore anything. */
+export class LocalPrincipalError extends Error {
+  public readonly code: LocalPrincipalErrorCode;
+
+  constructor(code: LocalPrincipalErrorCode, message: string) {
+    super(message);
+    this.name = 'LocalPrincipalError';
+    this.code = code;
+  }
+}
+
+/** The referenced application user (or binding endpoint) does not exist. */
+export class LocalPrincipalSubjectUnknownError extends LocalPrincipalError {
+  constructor(subject: string) {
+    super('LOCAL_PRINCIPAL_SUBJECT_UNKNOWN', `No local principal subject exists for "${subject}".`);
+    this.name = 'LocalPrincipalSubjectUnknownError';
+  }
+}
+
+/** A binding already exists for this application user; one deployment, one principal.
+ *  Re-binding by reuse is not authorized (a new act would be required). */
+export class LocalPrincipalBindingConflictError extends LocalPrincipalError {
+  constructor(applicationUserId: string) {
+    super(
+      'LOCAL_PRINCIPAL_BINDING_CONFLICT',
+      `A local principal binding already exists for application user "${applicationUserId}"; ` +
+        `re-binding by reuse is not authorized.`
+    );
+    this.name = 'LocalPrincipalBindingConflictError';
+  }
+}
+
+/** Zero or more than one ACTIVE binding: refuse. No owner is disclosed. */
+export class LocalPrincipalBindingUnresolvedError extends LocalPrincipalError {
+  constructor() {
+    super(
+      'LOCAL_PRINCIPAL_BINDING_UNRESOLVED',
+      'No single active local principal binding is resolvable; resolution refuses and discloses no owner.'
+    );
+    this.name = 'LocalPrincipalBindingUnresolvedError';
+  }
+}
+
+/** The binding/membership is already REVOKED: revocation is one-way, and neither a
+ *  repeat revocation nor a restoration is authorized. */
+export class LocalPrincipalRevocationInvalidError extends LocalPrincipalError {
+  constructor(subject: string) {
+    super(
+      'LOCAL_PRINCIPAL_REVOCATION_INVALID',
+      `Subject "${subject}" is already REVOKED; revocation is one-way and restoration is not authorized.`
+    );
+    this.name = 'LocalPrincipalRevocationInvalidError';
+  }
+}
+
+/** A membership already exists for this application user; re-provisioning (and the
+ *  implicit restoration behaviour of the upsert) is never exercised from this boundary. */
+export class LocalPrincipalMembershipConflictError extends LocalPrincipalError {
+  constructor(applicationUserId: string) {
+    super(
+      'LOCAL_PRINCIPAL_MEMBERSHIP_CONFLICT',
+      `A tenant membership already exists for application user "${applicationUserId}"; ` +
+        `re-provisioning requires a new explicit act.`
+    );
+    this.name = 'LocalPrincipalMembershipConflictError';
+  }
+}
+
+/**
+ * The membership audit subject key: the membership primary key
+ * `(application_user_id, tenant_id)` joined by `:`. Both parts are opaque provisioned
+ * values; nothing is derived from any external identifier.
+ */
+export function membershipSubjectId(applicationUserId: string, tenantId: string): string {
+  return `${applicationUserId}:${tenantId}`;
+}
+
+interface BindingRow {
+  endpoint_id: string;
+  application_user_id: string;
+  tenant_id: string;
+  state: LocalPrincipalBindingState;
+  created_at: string;
+  updated_at: string;
+  revoked_at: string | null;
+}
+
+interface AuditRow {
+  seq: number;
+  audit_id: string;
+  subject_type: LocalPrincipalAuditSubjectType;
+  subject_id: string;
+  action: LocalPrincipalAuditAction;
+  previous_state: string | null;
+  new_state: string | null;
+  actor: string;
+  context: string | null;
+  occurred_at: string;
+}
+
+function toBinding(row: BindingRow): LocalPrincipalBinding {
+  return {
+    endpointId: row.endpoint_id,
+    applicationUserId: row.application_user_id,
+    tenantId: row.tenant_id,
+    state: row.state,
+    createdAt: row.created_at,
+    updatedAt: row.updated_at,
+    revokedAt: row.revoked_at,
+  };
+}
+
+function toAuditEvent(row: AuditRow): LocalPrincipalAuditEvent {
+  return {
+    seq: row.seq,
+    auditId: row.audit_id,
+    subjectType: row.subject_type,
+    subjectId: row.subject_id,
+    action: row.action,
+    previousState: row.previous_state,
+    newState: row.new_state,
+    actor: row.actor,
+    context: row.context,
+    occurredAt: row.occurred_at,
+  };
+}
+
+/** SQL-only statement boundary for the A-2/A-3 records. No decision logic here. */
+export class LocalPrincipalRepository {
+  constructor(private readonly connection: PersistenceConnection) {}
+
+  public insertBinding(binding: LocalPrincipalBinding): void {
+    this.connection
+      .prepare(
+        `INSERT INTO local_principal_bindings
+           (endpoint_id, application_user_id, tenant_id, state, created_at, updated_at, revoked_at)
+         VALUES (?, ?, ?, ?, ?, ?, ?)`
+      )
+      .run(
+        binding.endpointId,
+        binding.applicationUserId,
+        binding.tenantId,
+        binding.state,
+        binding.createdAt,
+        binding.updatedAt,
+        binding.revokedAt
+      );
+  }
+
+  public findBindingByEndpointId(endpointId: string): LocalPrincipalBinding | null {
+    const row = this.connection
+      .prepare(`SELECT * FROM local_principal_bindings WHERE endpoint_id = ?`)
+      .get(endpointId) as BindingRow | undefined;
+    return row ? toBinding(row) : null;
+  }
+
+  public listBindingsForUser(applicationUserId: string): LocalPrincipalBinding[] {
+    const rows = this.connection
+      .prepare(
+        `SELECT * FROM local_principal_bindings
+          WHERE application_user_id = ?
+          ORDER BY created_at ASC, endpoint_id ASC`
+      )
+      .all(applicationUserId) as BindingRow[];
+    return rows.map(toBinding);
+  }
+
+  public listActiveBindings(): LocalPrincipalBinding[] {
+    const rows = this.connection
+      .prepare(`SELECT * FROM local_principal_bindings WHERE state = 'ACTIVE' ORDER BY endpoint_id ASC`)
+      .all() as BindingRow[];
+    return rows.map(toBinding);
+  }
+
+  /** One-way transition. Refuses implicitly (no row) when the row is not ACTIVE. */
+  public revokeBinding(endpointId: string, revokedAt: string): void {
+    this.connection
+      .prepare(
+        `UPDATE local_principal_bindings
+            SET state = 'REVOKED', updated_at = ?, revoked_at = ?
+          WHERE endpoint_id = ? AND state = 'ACTIVE'`
+      )
+      .run(revokedAt, revokedAt, endpointId);
+  }
+
+  public insertAuditEvent(event: Omit<LocalPrincipalAuditEvent, 'seq'>): void {
+    this.connection
+      .prepare(
+        `INSERT INTO local_principal_audit_events
+           (audit_id, subject_type, subject_id, action, previous_state, new_state, actor, context, occurred_at)
+         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
+      )
+      .run(
+        event.auditId,
+        event.subjectType,
+        event.subjectId,
+        event.action,
+        event.previousState,
+        event.newState,
+        event.actor,
+        event.context,
+        event.occurredAt
+      );
+  }
+
+  public listAuditEvents(): LocalPrincipalAuditEvent[] {
+    const rows = this.connection
+      .prepare(`SELECT * FROM local_principal_audit_events ORDER BY seq ASC`)
+      .all() as AuditRow[];
+    return rows.map(toAuditEvent);
+  }
+}
+
+export interface CreateBindingInput extends GovernanceActorContext {
+  readonly applicationUserId: string;
+  readonly tenantId: string;
+}
+
+export interface MembershipMutationInput extends GovernanceActorContext {
+  readonly applicationUserId: string;
+  readonly tenantId: string;
+}
+
+/**
+ * The A-2/A-3 lifecycle boundary. Every mutation is transactional on its own and
+ * composes (as a savepoint) inside an enclosing `immediateTransaction`, so an outer
+ * act can make the whole provisioning ONE transaction.
+ */
+export class LocalPrincipalService {
+  private readonly repository: LocalPrincipalRepository;
+  private readonly identity: IdentityService;
+  private readonly identityRepository: IdentityRepository;
+
+  constructor(private readonly connection: PersistenceConnection) {
+    this.repository = new LocalPrincipalRepository(connection);
+    this.identity = new IdentityService(connection);
+    this.identityRepository = new IdentityRepository(connection);
+  }
+
+  private now(): string {
+    return new Date().toISOString();
+  }
+
+  /** `ep-` + lowercase UUIDv4 — generated ONCE, opaque, never a wire field. */
+  private newEndpointId(): string {
+    return `ep-${randomUUID().toLowerCase()}`;
+  }
+
+  private recordAudit(input: {
+    subjectType: LocalPrincipalAuditSubjectType;
+    subjectId: string;
+    action: LocalPrincipalAuditAction;
+    previousState: string | null;
+    newState: string | null;
+    actor: string;
+    context?: string;
+    occurredAt: string;
+  }): void {
+    this.repository.insertAuditEvent({
+      auditId: randomUUID(),
+      subjectType: input.subjectType,
+      subjectId: input.subjectId,
+      action: input.action,
+      previousState: input.previousState,
+      newState: input.newState,
+      actor: input.actor,
+      context: input.context ?? null,
+      occurredAt: input.occurredAt,
+    });
+  }
+
+  /**
+   * Creates the ONE local principal binding (ACTIVE) and writes its A-3 audit row in
+   * the same transaction. Refuses when a binding already exists for the user.
+   */
+  public createBinding(input: CreateBindingInput, now: string = this.now()): LocalPrincipalBinding {
+    return this.connection.immediateTransaction(() => {
+      const user = this.identityRepository.findApplicationUser(input.applicationUserId);
+      if (!user) {
+        throw new LocalPrincipalSubjectUnknownError(input.applicationUserId);
+      }
+      if (this.repository.listBindingsForUser(input.applicationUserId).length > 0) {
+        throw new LocalPrincipalBindingConflictError(input.applicationUserId);
+      }
+
+      const binding: LocalPrincipalBinding = {
+        endpointId: this.newEndpointId(),
+        applicationUserId: input.applicationUserId,
+        tenantId: input.tenantId,
+        state: 'ACTIVE',
+        createdAt: now,
+        updatedAt: now,
+        revokedAt: null,
+      };
+      this.repository.insertBinding(binding);
+      this.recordAudit({
+        subjectType: 'BINDING',
+        subjectId: binding.endpointId,
+        action: 'BINDING_CREATED',
+        previousState: null,
+        newState: 'ACTIVE',
+        actor: input.actor,
+        context: input.context,
+        occurredAt: now,
+      });
+      return binding;
+    });
+  }
+
+  /** Exactly one ACTIVE binding or refuse — no owner is ever disclosed. */
+  public resolveActiveBinding(): LocalPrincipalBinding {
+    const active = this.repository.listActiveBindings();
+    if (active.length !== 1) {
+      throw new LocalPrincipalBindingUnresolvedError();
+    }
+    return active[0]!;
+  }
+
+  /**
+   * One-way revocation of the binding and its A-3 audit row, in one transaction.
+   * Refuses when the binding is missing or already REVOKED. There is no restore path.
+   */
+  public revokeBinding(
+    endpointId: string,
+    actorContext: GovernanceActorContext,
+    now: string = this.now()
+  ): LocalPrincipalBinding {
+    return this.connection.immediateTransaction(() => {
+      const binding = this.repository.findBindingByEndpointId(endpointId);
+      if (!binding) {
+        throw new LocalPrincipalSubjectUnknownError(endpointId);
+      }
+      if (binding.state !== 'ACTIVE') {
+        throw new LocalPrincipalRevocationInvalidError(endpointId);
+      }
+
+      this.repository.revokeBinding(endpointId, now);
+      this.recordAudit({
+        subjectType: 'BINDING',
+        subjectId: endpointId,
+        action: 'BINDING_REVOKED',
+        previousState: 'ACTIVE',
+        newState: 'REVOKED',
+        actor: actorContext.actor,
+        context: actorContext.context,
+        occurredAt: now,
+      });
+      return { ...binding, state: 'REVOKED', updatedAt: now, revokedAt: now };
+    });
+  }
+
+  /**
+   * Explicit membership provisioning (the ONLY membership creation path) with its A-3
+   * audit row in the same transaction. Refuses when any membership already exists for
+   * the user — the implicit `REVOKED -> ACTIVE` upsert restoration is never exercised
+   * from this boundary.
+   */
+  public provisionMembershipWithAudit(
+    input: MembershipMutationInput,
+    now: string = this.now()
+  ): TenantMembership {
+    return this.connection.immediateTransaction(() => {
+      const user = this.identityRepository.findApplicationUser(input.applicationUserId);
+      if (!user) {
+        throw new LocalPrincipalSubjectUnknownError(input.applicationUserId);
+      }
+      if (this.identityRepository.listMemberships(input.applicationUserId).length > 0) {
+        throw new LocalPrincipalMembershipConflictError(input.applicationUserId);
+      }
+
+      const membership = this.identity.provisionTenantMembership(
+        {
+          applicationUserId: input.applicationUserId,
+          tenantId: input.tenantId,
+          actor: input.actor,
+          context: input.context,
+        },
+        now
+      );
+
+      this.recordAudit({
+        subjectType: 'MEMBERSHIP',
+        subjectId: membershipSubjectId(membership.applicationUserId, membership.tenantId),
+        action: 'MEMBERSHIP_CREATED',
+        previousState: null,
+        newState: 'ACTIVE',
+        actor: input.actor,
+        context: input.context,
+        occurredAt: now,
+      });
+      return membership;
+    });
+  }
+
+  /**
+   * One-way membership revocation with its A-3 audit row, in one transaction.
+   * Refuses when the membership is missing or already REVOKED.
+   */
+  public revokeMembershipWithAudit(
+    input: MembershipMutationInput,
+    now: string = this.now()
+  ): TenantMembership {
+    return this.connection.immediateTransaction(() => {
+      const existing = this.identityRepository.findMembership(
+        input.applicationUserId,
+        input.tenantId
+      );
+      if (!existing) {
+        throw new LocalPrincipalSubjectUnknownError(
+          membershipSubjectId(input.applicationUserId, input.tenantId)
+        );
+      }
+      if (existing.state !== 'ACTIVE') {
+        throw new LocalPrincipalRevocationInvalidError(
+          membershipSubjectId(input.applicationUserId, input.tenantId)
+        );
+      }
+
+      const membership = this.identity.revokeTenantMembership(
+        {
+          applicationUserId: input.applicationUserId,
+          tenantId: input.tenantId,
+          actor: input.actor,
+          context: input.context,
+        },
+        now
+      );
+
+      this.recordAudit({
+        subjectType: 'MEMBERSHIP',
+        subjectId: membershipSubjectId(membership.applicationUserId, membership.tenantId),
+        action: 'MEMBERSHIP_REVOKED',
+        previousState: 'ACTIVE',
+        newState: 'REVOKED',
+        actor: input.actor,
+        context: input.context,
+        occurredAt: now,
+      });
+      return membership;
+    });
+  }
+
+  /** The local audit line, ordered by its monotonic sequence. */
+  public readAuditTrail(): LocalPrincipalAuditEvent[] {
+    return this.repository.listAuditEvents();
+  }
+
+  /** Reads (never guesses) the bindings of an application user. */
+  public readBindingsForUser(applicationUserId: string): LocalPrincipalBinding[] {
+    return this.repository.listBindingsForUser(applicationUserId);
+  }
+}
diff --git a/src/gate_a/provision.ts b/src/gate_a/provision.ts
new file mode 100644
index 0000000..b6f780f
--- /dev/null
+++ b/src/gate_a/provision.ts
@@ -0,0 +1,355 @@
+#!/usr/bin/env node
+/**
+ * Institutional Investment Platform System (IIPS)
+ * G-2 Gate A — ONE-TIME LOCAL PRINCIPAL PROVISIONING (OPERATOR TOOL)
+ *
+ * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
+ * Execution Mode: NON_PRODUCTION
+ *
+ * Authority: the single bounded act authorized by the rendered decision
+ * `IIPS-V3-G2-IPD-GATE-A-PA-DECISION-2026-10-16-01` (request
+ * `IIPS-V3-G2-GATE-A-LOCAL-PROVISIONING-AUTHORITY-REQUEST-2026-10-16-01`).
+ *
+ * This is OPERATOR TOOLING for that one act. It is not imported by, and is not
+ * wired into, any runtime path. It provisions exactly: one `application_users`
+ * row, one `tenant_memberships` row (`t-<lowercase UUIDv4>`), one
+ * `local_principal_bindings` row (`ep-<lowercase UUIDv4>`), and their A-3 audit
+ * rows — inside ONE `immediateTransaction`, after a same-directory pre-run backup.
+ *
+ * Usage (operator, offline):
+ *   IPD_PORTFOLIO_DB_PATH=/abs/store/ipd-portfolio.sqlite \
+ *   node dist/src/gate_a/provision.js --execute \
+ *     [--actor=<actor>] [--context=<provisioning reference>] \
+ *     [--basis-ref=<ref>] [--basis-commit=<sha>] [--basis-tree=<sha>]
+ *
+ * Prints ONE JSON act record to stdout. Exit 0 only when the act's single
+ * transaction committed and the post-state was read back; on any failure the
+ * pre-run backup (when created) is restored over the store, the failure is
+ * reported, and no manual repair is attempted.
+ */
+
+import fs from 'node:fs';
+import path from 'node:path';
+import { createHash, randomUUID } from 'node:crypto';
+import { createRequire } from 'node:module';
+
+import { loadPersistenceConfig, type PersistenceConfig } from '../persistence/config.js';
+import { PersistenceConnection } from '../persistence/connection.js';
+import {
+  readAppliedMigrations,
+  readSchemaVersion,
+  runMigrations,
+} from '../persistence/migrations/index.js';
+import { IdentityService } from '../app_identity/service.js';
+import { LocalPrincipalService } from '../app_identity/local_principal.js';
+
+const require = createRequire(import.meta.url);
+const betterSqlite3Package = require('better-sqlite3/package.json') as { version: string };
+const Database = require('better-sqlite3') as typeof import('better-sqlite3');
+
+const DEFAULT_ACTOR = 'operator:gate-a-local-provisioning';
+const DEFAULT_CONTEXT = 'IIPS-V3-G2-IPD-GATE-A-PA-DECISION-2026-10-16-01';
+
+interface CliArgs {
+  readonly execute: boolean;
+  readonly actor: string;
+  readonly context: string;
+  readonly basisRef?: string;
+  readonly basisCommit?: string;
+  readonly basisTree?: string;
+}
+
+function parseArgs(argv: readonly string[]): CliArgs {
+  let execute = false;
+  let actor = process.env.IPD_GATE_A_ACTOR ?? DEFAULT_ACTOR;
+  let context = process.env.IPD_GATE_A_CONTEXT ?? DEFAULT_CONTEXT;
+  let basisRef: string | undefined;
+  let basisCommit: string | undefined;
+  let basisTree: string | undefined;
+
+  for (const arg of argv) {
+    if (arg === '--execute') execute = true;
+    else if (arg.startsWith('--actor=')) actor = arg.slice('--actor='.length);
+    else if (arg.startsWith('--context=')) context = arg.slice('--context='.length);
+    else if (arg.startsWith('--basis-ref=')) basisRef = arg.slice('--basis-ref='.length);
+    else if (arg.startsWith('--basis-commit=')) basisCommit = arg.slice('--basis-commit='.length);
+    else if (arg.startsWith('--basis-tree=')) basisTree = arg.slice('--basis-tree='.length);
+  }
+  return { execute, actor, context, basisRef, basisCommit, basisTree };
+}
+
+function sha256File(file: string): string {
+  return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
+}
+
+function utcStamp(): string {
+  return new Date().toISOString().replace(/[:.]/g, '-');
+}
+
+interface TableCount {
+  readonly name: string;
+  readonly count: number;
+}
+
+function tableCountsOn(handle: import('better-sqlite3').Database): TableCount[] {
+  const tables = handle
+    .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name ASC`)
+    .all() as Array<{ name: string }>;
+  return tables.map((table) => ({
+    name: table.name,
+    count: (
+      handle.prepare(`SELECT COUNT(*) AS c FROM "${table.name}"`).get() as { c: number }
+    ).c,
+  }));
+}
+
+/** Read-only pre-run inspection (no connection is opened for writing). */
+function preRunState(databasePath: string): Record<string, unknown> {
+  if (!fs.existsSync(databasePath)) {
+    return {
+      storeExisted: false,
+      note: 'No database file existed before this act; Gate A is the act that creates it.',
+    };
+  }
+  const handle = new Database(databasePath, { readonly: true, fileMustExist: true });
+  try {
+    let ledger: unknown = null;
+    try {
+      ledger = handle
+        .prepare(`SELECT id, name, checksum, applied_at FROM schema_migrations ORDER BY id ASC`)
+        .all();
+    } catch {
+      ledger = null;
+    }
+    return {
+      storeExisted: true,
+      sizeBytes: fs.statSync(databasePath).size,
+      sha256: sha256File(databasePath),
+      tableCounts: tableCountsOn(handle),
+      migrationLedger: ledger,
+    };
+  } finally {
+    handle.close();
+  }
+}
+
+function allRows(
+  connection: PersistenceConnection,
+  sql: string
+): Array<Record<string, unknown>> {
+  return connection.prepare(sql).all() as Array<Record<string, unknown>>;
+}
+
+function tableCounts(connection: PersistenceConnection): TableCount[] {
+  const tables = allRows(
+    connection,
+    `SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name ASC`
+  ) as Array<{ name: string }>;
+  return tables.map((table) => ({
+    name: table.name,
+    count: (
+      connection.prepare(`SELECT COUNT(*) AS c FROM "${table.name}"`).get() as { c: number }
+    ).c,
+  }));
+}
+
+function postRunState(
+  connection: PersistenceConnection,
+  databasePath: string
+): Record<string, unknown> {
+  return {
+    sizeBytes: fs.statSync(databasePath).size,
+    sha256: sha256File(databasePath),
+    tableCounts: tableCounts(connection),
+    applicationUsers: allRows(connection, `SELECT * FROM application_users ORDER BY application_user_id ASC`),
+    tenantMemberships: allRows(
+      connection,
+      `SELECT * FROM tenant_memberships ORDER BY application_user_id ASC, tenant_id ASC`
+    ),
+    localPrincipalBindings: allRows(
+      connection,
+      `SELECT * FROM local_principal_bindings ORDER BY endpoint_id ASC`
+    ),
+    localPrincipalAuditEvents: allRows(
+      connection,
+      `SELECT seq, audit_id, subject_type, subject_id, action, previous_state, new_state, actor, context, occurred_at
+         FROM local_principal_audit_events ORDER BY seq ASC`
+    ),
+    migrationLedger: readAppliedMigrations(connection),
+    schemaVersion: readSchemaVersion(connection),
+  };
+}
+
+function main(): void {
+  const args = parseArgs(process.argv.slice(2));
+  if (!args.execute) {
+    process.stderr.write(
+      'Gate A provisioning requires the explicit --execute flag. Nothing was performed.\n'
+    );
+    process.exitCode = 2;
+    return;
+  }
+
+  const startedAtUtc = new Date().toISOString();
+  const record: Record<string, unknown> = {
+    actId: args.context,
+    mode: 'NON_PRODUCTION',
+    tool: 'src/gate_a/provision.ts (operator tooling; not wired into any runtime path)',
+    outcome: 'GATE A — NOT EXECUTED (no successful commit)',
+    startedAtUtc,
+    executor: {
+      actor: args.actor,
+      context: args.context,
+      runtime: {
+        node: process.version,
+        betterSqlite3: betterSqlite3Package.version,
+        platform: process.platform,
+        clockUtcAtStart: new Date().toISOString(),
+      },
+    },
+    basis: {
+      ref: args.basisRef ?? null,
+      commit: args.basisCommit ?? null,
+      tree: args.basisTree ?? null,
+      note: 'Basis identifiers are operator-supplied here and independently verified in the durable execution record.',
+    },
+  };
+
+  let config: PersistenceConfig;
+  try {
+    config = loadPersistenceConfig(process.env);
+  } catch (error) {
+    record.outcome = 'GATE A — FAILED (configuration)';
+    record.error = { name: (error as Error).name, message: (error as Error).message };
+    process.stdout.write(`${JSON.stringify(record, null, 2)}\n`);
+    process.exitCode = 1;
+    return;
+  }
+
+  const databasePath = config.databasePath;
+  record.store = { databasePath, journalMode: config.journalMode, synchronous: config.synchronous, foreignKeys: config.foreignKeysEnabled };
+
+  const pre = preRunState(databasePath);
+  record.preRun = pre;
+
+  let connection: PersistenceConnection | null = null;
+  let backupPath: string | null = null;
+
+  try {
+    connection = PersistenceConnection.open(config);
+
+    const migrationOutcome = runMigrations(connection);
+    const schemaVersion = readSchemaVersion(connection);
+    record.migration = {
+      applied: migrationOutcome.applied,
+      schemaVersion,
+      ledger: readAppliedMigrations(connection),
+    };
+
+    // Pre-run backup (same directory, plain file copy; journalMode DELETE => no WAL side-files).
+    backupPath = path.join(
+      path.dirname(databasePath),
+      `${path.basename(databasePath)}.pre-provision-backup-${utcStamp()}.sqlite`
+    );
+    fs.copyFileSync(databasePath, backupPath);
+    record.backup = {
+      path: backupPath,
+      sha256: sha256File(backupPath),
+      sizeBytes: fs.statSync(backupPath).size,
+      createdAtUtc: new Date().toISOString(),
+      note: 'Restored over the store on any failure; a restored backup leaves no provisioned state.',
+    };
+
+    const identity = new IdentityService(connection);
+    const localPrincipal = new LocalPrincipalService(connection);
+    const now = new Date().toISOString();
+
+    // Rule T1-r: "t-" + lowercase(UUIDv4) — generated once, opaque, never derived.
+    const tenantId = `t-${randomUUID().toLowerCase()}`;
+
+    // ONE immediateTransaction for every Gate A write (each service call nests as a
+    // savepoint, so the provisioning and its audit rows commit or roll back together).
+    const provisioned = connection.immediateTransaction(() => {
+      const user = identity.createApplicationUser({ actor: args.actor, context: args.context }, now);
+      const membership = localPrincipal.provisionMembershipWithAudit(
+        {
+          applicationUserId: user.applicationUserId,
+          tenantId,
+          actor: args.actor,
+          context: args.context,
+        },
+        now
+      );
+      const binding = localPrincipal.createBinding(
+        {
+          applicationUserId: user.applicationUserId,
+          tenantId,
+          actor: args.actor,
+          context: args.context,
+        },
+        now
+      );
+      return { user, membership, binding };
+    });
+
+    const post = postRunState(connection, databasePath);
+    record.provisioned = {
+      applicationUserId: provisioned.user.applicationUserId,
+      applicationUserStatus: provisioned.user.status,
+      tenantId: provisioned.membership.tenantId,
+      membershipState: provisioned.membership.state,
+      endpointId: provisioned.binding.endpointId,
+      bindingState: provisioned.binding.state,
+      actTimestampUtc: now,
+      rule: 'tenant = "t-" + lowercase(UUIDv4); endpoint = "ep-" + lowercase(UUIDv4); generated once, immutable',
+    };
+    record.transaction = {
+      form: 'one immediateTransaction (provisioning + audit rows commit or roll back together)',
+      committed: true,
+    };
+    record.postRun = post;
+    record.outcome = 'GATE A — PROVISIONED (validation pending)';
+    record.finishedAtUtc = new Date().toISOString();
+    process.stdout.write(`${JSON.stringify(record, null, 2)}\n`);
+  } catch (error) {
+    const failure = error as Error & { code?: string };
+    record.outcome = 'GATE A — FAILED / ROLLED BACK';
+    record.error = { name: failure.name, message: failure.message, code: failure.code ?? null };
+    record.finishedAtUtc = new Date().toISOString();
+
+    if (backupPath && fs.existsSync(backupPath)) {
+      try {
+        fs.copyFileSync(backupPath, databasePath);
+        record.rollback = {
+          restored: true,
+          from: backupPath,
+          sha256AfterRestore: sha256File(databasePath),
+          postRestoreCounts: preRunState(databasePath),
+        };
+      } catch (restoreError) {
+        record.rollback = {
+          restored: false,
+          error: (restoreError as Error).message,
+          note: 'Manual repair is NOT performed by this tool; the failure stands and must be reported.',
+        };
+      }
+    } else {
+      record.rollback = {
+        restored: false,
+        note: 'No pre-run backup existed (failure occurred before backup creation); no provisioning writes had been attempted.',
+      };
+    }
+    process.stdout.write(`${JSON.stringify(record, null, 2)}\n`);
+    process.exitCode = 1;
+  } finally {
+    if (connection) {
+      try {
+        connection.close();
+      } catch {
+        /* shutdown errors do not mask the act outcome */
+      }
+    }
+  }
+}
+
+main();
diff --git a/src/gate_a/validate.ts b/src/gate_a/validate.ts
new file mode 100644
index 0000000..550b9f4
--- /dev/null
+++ b/src/gate_a/validate.ts
@@ -0,0 +1,587 @@
+#!/usr/bin/env node
+/**
+ * Institutional Investment Platform System (IIPS)
+ * G-2 Gate A — READ-ONLY VALIDATION (V-A1..V-A8) & DISPOSABLE-COPY REHEARSALS
+ *
+ * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
+ * Execution Mode: NON_PRODUCTION
+ *
+ * Authority: the single bounded act authorized by the rendered decision
+ * `IIPS-V3-G2-IPD-GATE-A-PA-DECISION-2026-10-16-01`.
+ *
+ * Usage (operator, offline):
+ *   IPD_PORTFOLIO_DB_PATH=/abs/store/ipd-portfolio.sqlite \
+ *   node dist/src/gate_a/validate.js --validate  [--act-record=<path>]
+ *   node dist/src/gate_a/validate.js --rehearsal [--act-record=<path>] [--backup=<path>]
+ *
+ * `--validate` performs ONLY reads against the live store and asserts the store file
+ * is byte-unchanged across the validation run. `--rehearsal` operates ONLY on
+ * disposable file copies (revocation behaviour; transactional atomicity; FK
+ * enforcement) and discards them; the live store is never written.
+ *
+ * V-A8 external invariants (IRR fence blobs, IPD `main`, PR states) are NOT network
+ * calls: they are captured separately and recorded in the durable execution record.
+ */
+
+import fs from 'node:fs';
+import path from 'node:path';
+import { createHash, randomUUID } from 'node:crypto';
+
+import { loadPersistenceConfig, type PersistenceConfig } from '../persistence/config.js';
+import { PersistenceConnection } from '../persistence/connection.js';
+import {
+  computeMigrationChecksum,
+  MIGRATIONS,
+  readAppliedMigrations,
+  readSchemaVersion,
+  SCHEMA_VERSION_TARGET,
+  validateMigrationState,
+} from '../persistence/migrations/index.js';
+import { IdentityService } from '../app_identity/service.js';
+import { LocalPrincipalService } from '../app_identity/local_principal.js';
+
+const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
+const TENANT_ID = /^t-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
+const ENDPOINT_ID = /^ep-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
+
+function sha256File(file: string): string {
+  return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
+}
+
+function utcStamp(): string {
+  return new Date().toISOString().replace(/[:.]/g, '-');
+}
+
+function parseArgs(argv: readonly string[]): Record<string, string | boolean> {
+  const args: Record<string, string | boolean> = {};
+  for (const arg of argv) {
+    if (arg.startsWith('--')) {
+      const eq = arg.indexOf('=');
+      if (eq === -1) args[arg.slice(2)] = true;
+      else args[arg.slice(2, eq)] = arg.slice(eq + 1);
+    }
+  }
+  return args;
+}
+
+type Probe = { readonly ok: boolean; readonly value?: unknown; readonly error?: unknown };
+
+function probe(work: () => unknown): Probe {
+  try {
+    return { ok: true, value: work() };
+  } catch (error) {
+    const e = error as Error & { code?: string };
+    return { ok: false, error: { name: e.name, code: e.code ?? null, message: e.message } };
+  }
+}
+
+function rows(
+  connection: PersistenceConnection,
+  sql: string,
+  ...params: unknown[]
+): Array<Record<string, unknown>> {
+  return connection.prepare(sql).all(...(params as never[])) as Array<Record<string, unknown>>;
+}
+
+function tableCounts(connection: PersistenceConnection): Array<{ name: string; count: number }> {
+  const tables = rows(
+    connection,
+    `SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name ASC`
+  ) as Array<{ name: string }>;
+  return tables.map((table) => ({
+    name: table.name,
+    count: (connection.prepare(`SELECT COUNT(*) AS c FROM "${table.name}"`).get() as { c: number })
+      .c,
+  }));
+}
+
+function readActRecord(recordPath: unknown): Record<string, unknown> | null {
+  if (typeof recordPath !== 'string' || !fs.existsSync(recordPath)) return null;
+  return JSON.parse(fs.readFileSync(recordPath, 'utf8')) as Record<string, unknown>;
+}
+
+function configFor(config: PersistenceConfig, databasePath: string): PersistenceConfig {
+  return { ...config, databasePath: path.normalize(databasePath) };
+}
+
+// ---------------------------------------------------------------------------
+// --validate (read-only on the live store)
+// ---------------------------------------------------------------------------
+
+function runValidation(config: PersistenceConfig, args: Record<string, string | boolean>): void {
+  const databasePath = config.databasePath;
+  const report: Record<string, unknown> = {
+    mode: 'validate',
+    actId: 'IIPS-V3-G2-IPD-GATE-A-PA-DECISION-2026-10-16-01',
+    databasePath,
+    startedAtUtc: new Date().toISOString(),
+    readOnly: 'only SELECT/PRAGMA reads are performed; the store file sha256 is asserted unchanged',
+  };
+  const failures: string[] = [];
+  const sha256Before = sha256File(databasePath);
+
+  const connection = PersistenceConnection.open(config);
+  try {
+    const identity = new IdentityService(connection);
+    const localPrincipal = new LocalPrincipalService(connection);
+
+    // V-A1 — schema and migration ledger
+    const ledger = readAppliedMigrations(connection);
+    const schemaVersion = readSchemaVersion(connection);
+    const stateProbe = probe(() => validateMigrationState(ledger));
+    const checksumComparison = MIGRATIONS.map((migration) => {
+      const row = ledger.find((r) => r.id === migration.id);
+      const computed = computeMigrationChecksum(migration.sql);
+      return {
+        id: migration.id,
+        name: migration.name,
+        ledgerChecksum: row?.checksum ?? null,
+        computedChecksum: computed,
+        match: row?.checksum === computed,
+      };
+    });
+    const vA1Pass =
+      schemaVersion === SCHEMA_VERSION_TARGET &&
+      ledger.length === MIGRATIONS.length &&
+      checksumComparison.every((c) => c.match) &&
+      stateProbe.ok;
+    if (!vA1Pass) failures.push('V-A1');
+    report['V-A1'] = {
+      passed: vA1Pass,
+      schemaVersion,
+      expectedSchemaVersion: SCHEMA_VERSION_TARGET,
+      ledgerRows: ledger,
+      checksumComparison,
+      migrationStateValidated: stateProbe.ok,
+      migrationStateError: stateProbe.error ?? null,
+      appliedAtNote:
+        'ledger applied_at values are written by the migration runner at application time (environment clock, verified against the authoritative API clock in the durable record)',
+    };
+
+    // V-A2 — exactly one application user
+    const users = rows(connection, `SELECT * FROM application_users ORDER BY application_user_id ASC`);
+    const firstUser = users[0] as { application_user_id?: string; status?: string } | undefined;
+    const vA2Pass =
+      users.length === 1 &&
+      firstUser?.status === 'ACTIVE' &&
+      typeof firstUser?.application_user_id === 'string' &&
+      UUID_V4.test(firstUser.application_user_id);
+    if (!vA2Pass) failures.push('V-A2');
+    report['V-A2'] = {
+      passed: vA2Pass,
+      count: users.length,
+      rows: users,
+      opaqueUuidV4: typeof firstUser?.application_user_id === 'string' && UUID_V4.test(firstUser.application_user_id),
+      statusActive: firstUser?.status === 'ACTIVE',
+    };
+
+    // V-A3 — exactly one ACTIVE membership
+    const memberships = rows(
+      connection,
+      `SELECT * FROM tenant_memberships ORDER BY application_user_id ASC, tenant_id ASC`
+    );
+    const firstMembership = memberships[0] as
+      | { application_user_id?: string; tenant_id?: string; state?: string }
+      | undefined;
+    const vA3Pass =
+      memberships.length === 1 &&
+      firstMembership?.state === 'ACTIVE' &&
+      firstMembership?.application_user_id === firstUser?.application_user_id &&
+      typeof firstMembership?.tenant_id === 'string' &&
+      TENANT_ID.test(firstMembership.tenant_id);
+    if (!vA3Pass) failures.push('V-A3');
+    report['V-A3'] = {
+      passed: vA3Pass,
+      count: memberships.length,
+      rows: memberships,
+      tenantRuleT1r: typeof firstMembership?.tenant_id === 'string' && TENANT_ID.test(firstMembership.tenant_id),
+    };
+
+    // V-A4 — exactly one ACTIVE binding, FK to the provisioned user, tenant matches
+    const bindings = rows(connection, `SELECT * FROM local_principal_bindings ORDER BY endpoint_id ASC`);
+    const firstBinding = bindings[0] as
+      | {
+          endpoint_id?: string;
+          application_user_id?: string;
+          tenant_id?: string;
+          state?: string;
+          revoked_at?: string | null;
+        }
+      | undefined;
+    const vA4Pass =
+      bindings.length === 1 &&
+      firstBinding?.state === 'ACTIVE' &&
+      firstBinding?.application_user_id === firstUser?.application_user_id &&
+      firstBinding?.tenant_id === firstMembership?.tenant_id &&
+      typeof firstBinding?.endpoint_id === 'string' &&
+      ENDPOINT_ID.test(firstBinding.endpoint_id) &&
+      firstBinding?.revoked_at === null;
+    if (!vA4Pass) failures.push('V-A4');
+    report['V-A4'] = {
+      passed: vA4Pass,
+      count: bindings.length,
+      rows: bindings,
+      endpointRuleEpUuid: typeof firstBinding?.endpoint_id === 'string' && ENDPOINT_ID.test(firstBinding.endpoint_id),
+      fkToProvisionedUser: firstBinding?.application_user_id === firstUser?.application_user_id,
+      tenantMatchesMembership: firstBinding?.tenant_id === firstMembership?.tenant_id,
+    };
+
+    // V-A5 — the A-3 audit line
+    const audit = rows(
+      connection,
+      `SELECT seq, audit_id, subject_type, subject_id, action, previous_state, new_state, actor, context, occurred_at
+         FROM local_principal_audit_events ORDER BY seq ASC`
+    );
+    const actions = audit.map((a) => String((a as { action?: string }).action));
+    const seqs = audit.map((a) => Number((a as { seq?: number }).seq));
+    const seqMonotonic = seqs.every((s, i) => i === 0 || s > seqs[i - 1]!);
+    const hasRequired = actions.includes('BINDING_CREATED') && actions.includes('MEMBERSHIP_CREATED');
+    const auditFieldsPresent = audit.every(
+      (a) =>
+        typeof (a as { actor?: unknown }).actor === 'string' &&
+        String((a as { actor?: string }).actor).length > 0 &&
+        typeof (a as { occurred_at?: unknown }).occurred_at === 'string' &&
+        typeof (a as { audit_id?: unknown }).audit_id === 'string'
+    );
+    const vA5Pass = hasRequired && seqMonotonic && auditFieldsPresent && audit.length >= 2;
+    if (!vA5Pass) failures.push('V-A5');
+    report['V-A5'] = {
+      passed: vA5Pass,
+      count: audit.length,
+      rows: audit,
+      requiredActionsPresent: hasRequired,
+      seqStrictlyIncreasing: seqMonotonic,
+      actorAndOccurredAtPresent: auditFieldsPresent,
+      sameTransaction: 'written inside the act’s single immediateTransaction; independent atomicity evidence in the rehearsal',
+    };
+
+    // V-A6 — absences and inventory
+    const inventory = tableCounts(connection);
+    const countOf = (name: string) => inventory.find((t) => t.name === name)?.count ?? 0;
+    const vA6Pass =
+      countOf('external_identity_mappings') === 0 &&
+      countOf('user_portfolios') === 0 &&
+      countOf('portfolio_revisions') === 0 &&
+      countOf('application_users') === 1 &&
+      countOf('tenant_memberships') === 1 &&
+      countOf('local_principal_bindings') === 1;
+    if (!vA6Pass) failures.push('V-A6');
+    report['V-A6'] = {
+      passed: vA6Pass,
+      tableInventory: inventory,
+      externalIdentityMappings: countOf('external_identity_mappings'),
+      userPortfolios: countOf('user_portfolios'),
+      portfolioRevisions: countOf('portfolio_revisions'),
+    };
+
+    // V-A7 — fail-closed resolution
+    const knownUser = firstUser?.application_user_id as string;
+    const knownTenant = firstMembership?.tenant_id as string;
+    const resolved = probe(() => identity.resolveTenant(knownUser));
+    const absentProbe = probe(() => identity.resolveTenant(randomUUID()));
+    const wrongTenantProbe = probe(() => identity.resolveTenant(knownUser, `t-${randomUUID()}`));
+    const absentError = absentProbe.error as { name?: string; code?: string } | undefined;
+    const wrongError = wrongTenantProbe.error as { name?: string; code?: string } | undefined;
+    const indistinguishable =
+      absentError?.name === wrongError?.name && absentError?.code === wrongError?.code;
+    const activeBindingCount = bindings.filter((b) => (b as { state?: string }).state === 'ACTIVE').length;
+    const vA7Pass =
+      resolved.ok && resolved.value === knownTenant && indistinguishable && activeBindingCount === 1;
+    if (!vA7Pass) failures.push('V-A7');
+    report['V-A7'] = {
+      passed: vA7Pass,
+      resolveTenantReturnsProvisionedTenant: resolved.ok && resolved.value === knownTenant,
+      resolvedTenant: resolved.value ?? null,
+      absentMembershipProbe: absentProbe.error ?? { ok: true, value: absentProbe.value },
+      wrongTenantProbe: wrongTenantProbe.error ?? { ok: true, value: wrongTenantProbe.value },
+      probesIndistinguishable: indistinguishable,
+      activeBindingCount,
+      refusalPathsNote: 'zero/multiple ACTIVE bindings and revoked states refuse identically; demonstrated on disposable copies in --rehearsal',
+    };
+
+    // V-A8 — externalized (recorded in the durable execution record, not by this tool)
+    report['V-A8'] = {
+      evaluatedHere: false,
+      note: 'External invariants (IRR 503 fence blobs, IPD main, PR #8/#118 states, no promotion) are captured by the operator/recorder and recorded in the durable execution record; this tool runs offline.',
+    };
+
+    const sha256After = sha256File(databasePath);
+    report.storageFile = {
+      sha256Before,
+      sha256After,
+      unchangedByValidation: sha256Before === sha256After,
+      sizeBytes: fs.statSync(databasePath).size,
+    };
+
+    const actRecord = readActRecord(args['act-record']);
+    report.againstActRecord = actRecord
+      ? {
+          actRecordPath: args['act-record'],
+          applicationUserIdMatches:
+            (actRecord.provisioned as { applicationUserId?: string } | undefined)?.applicationUserId ===
+            firstUser?.application_user_id,
+          tenantIdMatches:
+            (actRecord.provisioned as { tenantId?: string } | undefined)?.tenantId ===
+            firstMembership?.tenant_id,
+          endpointIdMatches:
+            (actRecord.provisioned as { endpointId?: string } | undefined)?.endpointId ===
+            firstBinding?.endpoint_id,
+        }
+      : { provided: false };
+
+    if (!report.storageFile || (report.storageFile as { unchangedByValidation: boolean }).unchangedByValidation === false) {
+      failures.push('storage-file-modified-by-validation');
+    }
+
+    report.failures = failures;
+    report.outcome =
+      failures.length === 0
+        ? 'V-A1..V-A7 STORE-SIDE CHECKS PASSED (V-A8 externalized; no write by validation tooling)'
+        : `VALIDATION FAILED: ${failures.join(', ')}`;
+    report.finishedAtUtc = new Date().toISOString();
+    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
+    process.exitCode = failures.length === 0 ? 0 : 1;
+  } finally {
+    connection.close();
+  }
+}
+
+// ---------------------------------------------------------------------------
+// --rehearsal (disposable copies only)
+// ---------------------------------------------------------------------------
+
+function runRehearsal(config: PersistenceConfig, args: Record<string, string | boolean>): void {
+  const databasePath = config.databasePath;
+  const report: Record<string, unknown> = {
+    mode: 'rehearsal',
+    actId: 'IIPS-V3-G2-IPD-GATE-A-PA-DECISION-2026-10-16-01',
+    databasePath,
+    startedAtUtc: new Date().toISOString(),
+    scope: 'DISPOSABLE COPIES ONLY — the live store is never written; copies are discarded',
+  };
+  const actorContext = {
+    actor: 'operator:gate-a-rehearsal',
+    context: 'G-2 Gate A disposable-copy rehearsal (no live effect)',
+  };
+  const liveSha256Before = sha256File(databasePath);
+
+  // --- 1. revocation behaviour -------------------------------------------------
+  const revocationCopy = `${databasePath}.rehearsal-revocation-${utcStamp()}.sqlite`;
+  fs.copyFileSync(databasePath, revocationCopy);
+  {
+    const connection = PersistenceConnection.open(configFor(config, revocationCopy));
+    try {
+      const identity = new IdentityService(connection);
+      const localPrincipal = new LocalPrincipalService(connection);
+      const binding = localPrincipal.resolveActiveBinding();
+      const user = rows(connection, `SELECT * FROM application_users`)[0] as {
+        application_user_id: string;
+      };
+      const membership = rows(connection, `SELECT * FROM tenant_memberships`)[0] as {
+        tenant_id: string;
+      };
+      const now = new Date().toISOString();
+
+      const bindingRevocation = probe(() =>
+        localPrincipal.revokeBinding(binding.endpointId, actorContext, now)
+      );
+      const resolveAfterBindingRevocation = probe(() => localPrincipal.resolveActiveBinding());
+      const repeatRevocation = probe(() =>
+        localPrincipal.revokeBinding(binding.endpointId, actorContext, now)
+      );
+      const rebindByReuse = probe(() =>
+        localPrincipal.createBinding(
+          {
+            applicationUserId: user.application_user_id,
+            tenantId: membership.tenant_id,
+            ...actorContext,
+          },
+          now
+        )
+      );
+      const tenantBeforeMembershipRevocation = probe(() =>
+        identity.resolveTenant(user.application_user_id)
+      );
+      const membershipRevocation = probe(() =>
+        localPrincipal.revokeMembershipWithAudit(
+          {
+            applicationUserId: user.application_user_id,
+            tenantId: membership.tenant_id,
+            ...actorContext,
+          },
+          now
+        )
+      );
+      const resolveAfterMembershipRevocation = probe(() =>
+        identity.resolveTenant(user.application_user_id)
+      );
+      const reprovisionAfterRevocation = probe(() =>
+        localPrincipal.provisionMembershipWithAudit(
+          {
+            applicationUserId: user.application_user_id,
+            tenantId: membership.tenant_id,
+            ...actorContext,
+          },
+          now
+        )
+      );
+      const auditTrail = localPrincipal.readAuditTrail();
+
+      report.revocationRehearsal = {
+        copy: revocationCopy,
+        bindingRevocation: bindingRevocation.ok
+          ? {
+              state: (bindingRevocation.value as { state: string }).state,
+              revokedAt: (bindingRevocation.value as { revokedAt: string }).revokedAt,
+            }
+          : bindingRevocation.error,
+        resolveActiveBindingAfterRevocation: resolveAfterBindingRevocation.error,
+        repeatRevocationRefused: repeatRevocation.error,
+        rebindByReuseRefused: rebindByReuse.error,
+        tenantResolvesWhileMembershipActive: tenantBeforeMembershipRevocation.ok
+          ? tenantBeforeMembershipRevocation.value
+          : tenantBeforeMembershipRevocation.error,
+        membershipRevocation: membershipRevocation.ok
+          ? { state: (membershipRevocation.value as { state: string }).state }
+          : membershipRevocation.error,
+        resolveTenantAfterMembershipRevocation: resolveAfterMembershipRevocation.error,
+        reprovisionAfterRevocationRefused: reprovisionAfterRevocation.error,
+        auditTrailAfterRehearsal: auditTrail.map((e) => ({
+          seq: e.seq,
+          action: e.action,
+          subjectType: e.subjectType,
+          subjectId: e.subjectId,
+          previousState: e.previousState,
+          newState: e.newState,
+          actor: e.actor,
+        })),
+        copySha256AfterRehearsal: sha256File(revocationCopy),
+      };
+    } finally {
+      connection.close();
+      fs.unlinkSync(revocationCopy);
+      report.revocationRehearsalDiscarded = !fs.existsSync(revocationCopy);
+    }
+  }
+
+  // --- 2. transactional atomicity + FK enforcement ----------------------------
+  const atomicityCopy = `${databasePath}.rehearsal-atomicity-${utcStamp()}.sqlite`;
+  fs.copyFileSync(databasePath, atomicityCopy);
+  {
+    const connection = PersistenceConnection.open(configFor(config, atomicityCopy));
+    try {
+      const identity = new IdentityService(connection);
+      const localPrincipal = new LocalPrincipalService(connection);
+      const before = tableCounts(connection);
+
+      const induced = probe(() =>
+        connection.immediateTransaction(() => {
+          const user = identity.createApplicationUser(actorContext, new Date().toISOString());
+          localPrincipal.provisionMembershipWithAudit(
+            {
+              applicationUserId: user.applicationUserId,
+              tenantId: `t-${randomUUID().toLowerCase()}`,
+              ...actorContext,
+            },
+            new Date().toISOString()
+          );
+          localPrincipal.createBinding(
+            {
+              applicationUserId: user.applicationUserId,
+              tenantId: `t-${randomUUID().toLowerCase()}`,
+              ...actorContext,
+            },
+            new Date().toISOString()
+          );
+          throw new Error('rehearsal-induced failure: no partial state may survive');
+        })
+      );
+      const after = tableCounts(connection);
+
+      const fkProbe = probe(() =>
+        connection
+          .prepare(
+            `INSERT INTO local_principal_bindings
+               (endpoint_id, application_user_id, tenant_id, state, created_at, updated_at, revoked_at)
+             VALUES (?, ?, ?, 'ACTIVE', ?, ?, NULL)`
+          )
+          .run(
+            `ep-${randomUUID().toLowerCase()}`,
+            randomUUID(),
+            `t-${randomUUID().toLowerCase()}`,
+            new Date().toISOString(),
+            new Date().toISOString()
+          )
+      );
+
+      report.atomicityRehearsal = {
+        copy: atomicityCopy,
+        inducedFailure: induced.error,
+        tableCountsBefore: before,
+        tableCountsAfter: after,
+        noPartialState: JSON.stringify(before) === JSON.stringify(after),
+        foreignKeyEnforcement: fkProbe.error,
+        copySha256AfterRehearsal: sha256File(atomicityCopy),
+      };
+    } finally {
+      connection.close();
+      fs.unlinkSync(atomicityCopy);
+      report.atomicityRehearsalDiscarded = !fs.existsSync(atomicityCopy);
+    }
+  }
+
+  // --- 3. backup-restore check (read-only on the backup file) ------------------
+  const actRecord = readActRecord(args['act-record']);
+  const backupPath =
+    (typeof args.backup === 'string' ? args.backup : undefined) ??
+    ((actRecord?.backup as { path?: string } | undefined)?.path as string | undefined);
+  if (backupPath && fs.existsSync(backupPath)) {
+    const connection = PersistenceConnection.open(configFor(config, backupPath));
+    try {
+      const ledger = readAppliedMigrations(connection);
+      report.backupRestoreCheck = {
+        backupPath,
+        sha256: sha256File(backupPath),
+        matchesActRecord:
+          (actRecord?.backup as { sha256?: string } | undefined)?.sha256 === sha256File(backupPath),
+        schemaVersion: readSchemaVersion(connection),
+        tableCounts: tableCounts(connection),
+        provisionedRowsPresent:
+          (tableCounts(connection).find((t) => t.name === 'application_users')?.count ?? -1) > 0,
+        note: 'A restore of this backup would leave NO provisioned state (schema only).',
+      };
+    } finally {
+      connection.close();
+    }
+  } else {
+    report.backupRestoreCheck = { performed: false, reason: 'no backup path supplied or found' };
+  }
+
+  report.liveStore = {
+    sha256Before: liveSha256Before,
+    sha256After: sha256File(databasePath),
+    unchangedByRehearsal: liveSha256Before === sha256File(databasePath),
+  };
+  report.finishedAtUtc = new Date().toISOString();
+  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
+  process.exitCode = (report.liveStore as { unchangedByRehearsal: boolean }).unchangedByRehearsal
+    ? 0
+    : 1;
+}
+
+function main(): void {
+  const args = parseArgs(process.argv.slice(2));
+  const config = loadPersistenceConfig(process.env);
+  if (args.validate) {
+    runValidation(config, args);
+    return;
+  }
+  if (args.rehearsal) {
+    runRehearsal(config, args);
+    return;
+  }
+  process.stderr.write('Specify --validate or --rehearsal. Nothing was performed.\n');
+  process.exitCode = 2;
+}
+
+main();
diff --git a/src/persistence/migrations/003_local_principal_bindings.ts b/src/persistence/migrations/003_local_principal_bindings.ts
new file mode 100644
index 0000000..9ba884a
--- /dev/null
+++ b/src/persistence/migrations/003_local_principal_bindings.ts
@@ -0,0 +1,75 @@
+/**
+ * Institutional Investment Platform System (IIPS)
+ * Migration 003 — Local Principal Bindings (A-2) & Local Principal Audit (A-3)
+ * G-2 / Gate A — NP04-G24 durable-persistence extension
+ *
+ * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
+ * Execution Mode: NON_PRODUCTION
+ *
+ * IMMUTABLE: this SQL text is checksummed into the migration ledger.
+ * Never edit an applied migration. Append a new migration instead.
+ *
+ * Authority: the A-2/A-3 additions were accepted under the L-IPC-1 rev 2 contract
+ * (clauses C1..C12; open items U-4/U-6) and authorized for realization — exactly and
+ * only as the A-2/A-3 enablement — by the rendered Gate A decision
+ * `IIPS-V3-G2-IPD-GATE-A-PA-DECISION-2026-10-16-01`.
+ *
+ * Exhaustive schema scope of this migration:
+ *   A-2 — ONE table `local_principal_bindings` + ONE index (the local principal
+ *         binding record; deliberately NOT a reuse of `external_identity_mappings`);
+ *   A-3 — ONE table `local_principal_audit_events` (local-only audit line mirroring
+ *         the `mapping_audit_events` shape, ordered by a monotonic `seq`).
+ *
+ * Nothing else is added, altered, or dropped. Migrations 001 and 002 are untouched.
+ */
+
+import type { MigrationDefinition } from './types.js';
+
+export const migration003LocalPrincipalBindings: MigrationDefinition = {
+  id: '003',
+  name: 'local_principal_bindings',
+  sql: `
+-- ---------------------------------------------------------------------------
+-- A-2: local principal binding record.
+-- One deployment, one principal. The binding is the local, act-provisioned
+-- record that a single-principal same-host IPC endpoint resolves against.
+-- It is deliberately NOT external_identity_mappings: a transport fact must
+-- never be conflated with an external-identity claim. No issuer/subject
+-- columns, no mapping lifecycle reuse, no cascade delete.
+-- State is one-way: ACTIVE -> REVOKED. No restoration semantics exist here.
+-- ---------------------------------------------------------------------------
+CREATE TABLE local_principal_bindings (
+    endpoint_id         TEXT PRIMARY KEY,
+    application_user_id TEXT NOT NULL REFERENCES application_users(application_user_id),
+    tenant_id           TEXT NOT NULL,
+    state               TEXT NOT NULL CHECK (state IN ('ACTIVE','REVOKED')),
+    created_at          TEXT NOT NULL,
+    updated_at          TEXT NOT NULL,
+    revoked_at          TEXT
+);
+
+CREATE INDEX idx_local_principal_bindings_user
+    ON local_principal_bindings (application_user_id, state);
+
+-- ---------------------------------------------------------------------------
+-- A-3: local principal audit line.
+-- Audits binding and membership lifecycle mutations, written in the SAME
+-- transaction as the mutation they audit. LOCAL ONLY: no cross-system audit
+-- destination is created, configured, or implied by this table.
+-- A monotonic sequence is the total ordering authority (timestamps alone are
+-- insufficient — the same millisecond has no defined order).
+-- ---------------------------------------------------------------------------
+CREATE TABLE local_principal_audit_events (
+    seq            INTEGER PRIMARY KEY AUTOINCREMENT,
+    audit_id       TEXT NOT NULL UNIQUE,
+    subject_type   TEXT NOT NULL,
+    subject_id     TEXT NOT NULL,
+    action         TEXT NOT NULL,
+    previous_state TEXT,
+    new_state      TEXT,
+    actor          TEXT NOT NULL,
+    context        TEXT,
+    occurred_at    TEXT NOT NULL
+);
+`,
+};
diff --git a/src/persistence/migrations/index.ts b/src/persistence/migrations/index.ts
index a8acbed..92a7b61 100644
--- a/src/persistence/migrations/index.ts
+++ b/src/persistence/migrations/index.ts
@@ -8,3 +8,4 @@ export * from './registry.js';
 export * from './runner.js';
 export { migration001InitialSchema } from './001_initial_schema.js';
 export { migration002AuditEventSequence } from './002_audit_event_sequence.js';
+export { migration003LocalPrincipalBindings } from './003_local_principal_bindings.js';
diff --git a/src/persistence/migrations/registry.ts b/src/persistence/migrations/registry.ts
index e4f7d64..5d3ab64 100644
--- a/src/persistence/migrations/registry.ts
+++ b/src/persistence/migrations/registry.ts
@@ -10,11 +10,13 @@
 
 import { migration001InitialSchema } from './001_initial_schema.js';
 import { migration002AuditEventSequence } from './002_audit_event_sequence.js';
+import { migration003LocalPrincipalBindings } from './003_local_principal_bindings.js';
 import type { MigrationDefinition } from './types.js';
 
 export const MIGRATIONS: readonly MigrationDefinition[] = [
   migration001InitialSchema,
   migration002AuditEventSequence,
+  migration003LocalPrincipalBindings,
 ];
 
 /** Human-readable schema identity for diagnostics. */
diff --git a/tests/g24_a_persistence_foundation.test.ts b/tests/g24_a_persistence_foundation.test.ts
index eac9d9c..68a2928 100644
--- a/tests/g24_a_persistence_foundation.test.ts
+++ b/tests/g24_a_persistence_foundation.test.ts
@@ -34,11 +34,11 @@ test('G24-A1: initialization creates the database file and applies the accepted
   try {
     assert.equal(handle.startup.databasePath, handle.config.databasePath);
     assert.ok(fs.existsSync(handle.config.databasePath), 'database file must exist');
-    assert.equal(handle.startup.schemaVersion, '002');
+    assert.equal(handle.startup.schemaVersion, '003');
     assert.deepEqual(
       handle.startup.migrationsApplied,
-      ['001', '002'],
-      'first boot applies migrations 001 and 002'
+      ['001', '002', '003'],
+      'first boot applies migrations 001, 002 and 003'
     );
     assert.ok(handle.isOpen);
   } finally {
diff --git a/tests/g24_b_migrations.test.ts b/tests/g24_b_migrations.test.ts
index e5fc2d0..8395fcc 100644
--- a/tests/g24_b_migrations.test.ts
+++ b/tests/g24_b_migrations.test.ts
@@ -38,17 +38,19 @@ test('G24-B1: migration 001 is recorded in the ledger with its checksum', () =>
   const handle = openTestPersistence('b1');
   try {
     const applied = readAppliedMigrations(handle.connection);
-    assert.equal(applied.length, 2);
+    assert.equal(applied.length, 3);
     assert.equal(applied[0]!.id, '001');
     assert.equal(applied[0]!.name, 'initial_schema');
     assert.equal(applied[1]!.id, '002');
     assert.equal(applied[1]!.name, 'audit_event_sequence');
+    assert.equal(applied[2]!.id, '003');
+    assert.equal(applied[2]!.name, 'local_principal_bindings');
     assert.equal(
       applied[0]!.checksum,
       computeMigrationChecksum(MIGRATIONS[0]!.sql),
       'recorded checksum must equal the checksum of the immutable SQL'
     );
-    assert.equal(readSchemaVersion(handle.connection), '002');
+    assert.equal(readSchemaVersion(handle.connection), '003');
   } finally {
     closeTestPersistence(handle);
   }
@@ -59,7 +61,7 @@ test('G24-B2: re-running migrations on an already-migrated database applies noth
   try {
     const result = runMigrations(handle.connection);
     assert.deepEqual(result.applied, [], 'no migration may be re-applied');
-    assert.equal(result.currentVersion, '002');
+    assert.equal(result.currentVersion, '003');
   } finally {
     closeTestPersistence(handle);
   }
@@ -122,7 +124,7 @@ test('G24-B6: a failing migration fails startup and records nothing (transaction
   const handle = openTestPersistence('b6');
   try {
     const brokenMigration: MigrationDefinition = {
-      id: '003',
+      id: '004',
       name: 'broken_migration',
       sql: `CREATE TABLE should_not_exist_b6 (id TEXT PRIMARY KEY);
             THIS IS NOT VALID SQL;`,
@@ -131,7 +133,7 @@ test('G24-B6: a failing migration fails startup and records nothing (transaction
     assert.throws(
       () => runMigrations(handle.connection, [...MIGRATIONS, brokenMigration]),
       (error: unknown) =>
-        error instanceof MigrationApplicationError && error.migrationId === '003'
+        error instanceof MigrationApplicationError && error.migrationId === '004'
     );
 
     // Neither the DDL nor the ledger row may survive: application is transactional.
@@ -141,7 +143,7 @@ test('G24-B6: a failing migration fails startup and records nothing (transaction
     assert.equal(table, undefined, 'failed DDL must be rolled back');
 
     const applied = readAppliedMigrations(handle.connection);
-    assert.equal(applied.length, 2, 'failed migration must not be recorded in the ledger');
+    assert.equal(applied.length, 3, 'failed migration must not be recorded in the ledger');
     assert.equal(applied[0]!.id, '001');
   } finally {
     closeTestPersistence(handle);
@@ -152,19 +154,19 @@ test('G24-B7: migration DDL and ledger insert are atomic within one transaction'
   const handle = openTestPersistence('b7');
   try {
     const goodMigration: MigrationDefinition = {
-      id: '003',
+      id: '004',
       name: 'atomic_probe',
       sql: `CREATE TABLE atomic_probe_b7 (id TEXT PRIMARY KEY);`,
     };
 
     const applied = applyPendingMigrations(handle.connection, [...MIGRATIONS, goodMigration]);
-    assert.deepEqual(applied, ['003']);
+    assert.deepEqual(applied, ['004']);
 
     const table = handle.connection
       .prepare(`SELECT name FROM sqlite_master WHERE name = 'atomic_probe_b7'`)
       .get();
     assert.ok(table, 'DDL from the applied migration must be present');
-    assert.equal(readSchemaVersion(handle.connection), '003');
+    assert.equal(readSchemaVersion(handle.connection), '004');
   } finally {
     closeTestPersistence(handle);
   }
@@ -174,7 +176,7 @@ test('G24-B8: migration state survives a process restart and is not re-applied',
   const databasePath = tempDatabasePath('b8');
 
   const first = initializePersistenceWithConfig(temporaryPersistenceConfig(databasePath));
-  assert.deepEqual(first.startup.migrationsApplied, ['001', '002']);
+  assert.deepEqual(first.startup.migrationsApplied, ['001', '002', '003']);
   closeTestPersistence(first);
 
   // "Restart": a brand new connection against the same durable file.
@@ -185,10 +187,10 @@ test('G24-B8: migration state survives a process restart and is not re-applied',
       [],
       'migrations must not be re-applied on restart'
     );
-    assert.equal(second.startup.schemaVersion, '002');
+    assert.equal(second.startup.schemaVersion, '003');
 
     const applied = readAppliedMigrations(second.connection);
-    assert.equal(applied.length, 2);
+    assert.equal(applied.length, 3);
     assert.equal(applied[0]!.id, '001');
   } finally {
     closeTestPersistence(second);
diff --git a/tests/g24_g_recovery.test.ts b/tests/g24_g_recovery.test.ts
index f70684c..8692895 100644
--- a/tests/g24_g_recovery.test.ts
+++ b/tests/g24_g_recovery.test.ts
@@ -100,8 +100,8 @@ test('G24-G2: migration state survives restart and is never re-applied', () => {
 
   const first = initializePersistenceWithConfig(temporaryPersistenceConfig(databasePath));
   try {
-    assert.deepEqual(first.startup.migrationsApplied, ['001', '002']);
-    assert.equal(readSchemaVersion(first.connection), '002');
+    assert.deepEqual(first.startup.migrationsApplied, ['001', '002', '003']);
+    assert.equal(readSchemaVersion(first.connection), '003');
   } finally {
     closeTestPersistence(first);
   }
@@ -109,9 +109,9 @@ test('G24-G2: migration state survives restart and is never re-applied', () => {
   const second = initializePersistenceWithConfig(temporaryPersistenceConfig(databasePath));
   try {
     assert.deepEqual(second.startup.migrationsApplied, []);
-    assert.equal(second.startup.schemaVersion, '002');
+    assert.equal(second.startup.schemaVersion, '003');
     const applied = readAppliedMigrations(second.connection);
-    assert.equal(applied.length, 2);
+    assert.equal(applied.length, 3);
   } finally {
     closeTestPersistence(second);
   }
```

---

*End of raw evidence for `IIPS-V3-G2-IPD-GATE-A-PA-DECISION-2026-10-16-01` — GATE A —
PROVISIONED / VALIDATED. The live store, its pre-run backup and the derivative git bundle remain
local operator artifacts (paths and hashes recorded above); nothing was provisioned anywhere but
the local store named in the act record.*
