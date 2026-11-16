# IPD operating model — personal local use

**Status: authoritative current governance for routine IPD work.** This document
sets the operating model for the IPD application and its repository. It does not
rewrite historical records or completed decisions. Where older preparation
plans, gate notes, or evidence records describe approvals as prerequisites for
routine local work, this model supersedes that implication; the original record
remains intact as history. Specific technical contracts and genuine external
permissions remain applicable.

## Operating context and authority

IPD is for **personal use · a single user · local Windows · non-production ·
owner-directed execution**. The application owner is the sole operational
authority for routine activities in this environment, including implementation,
configuration, testing, local data operations, verification, recovery, and
publication of in-scope IPD work. Routine actions proceed on the owner's
direction without a repeated approval request for each change, command, test,
data operation, or verification step.

There is no required committee, second approver, ceremonial sign-off,
change-control board, repeated authority gate, or production-style release
ceremony for routine work. Record material decisions and results proportionately
when useful for traceability; a record is not an approval workflow.

This authority is bounded by the stated personal, local, non-production scope.
It does not grant access to another person's system, override an actual
third-party source licence or legal restriction, authorize actions in another
repository, or expand a deliberately protected technical boundary. Where a real
external permission is required, identify that exact dependency; do not invent
an internal approval chain as a substitute.

## Proportionate safeguards

Owner direction removes redundant governance gates, not technical care. Apply
safeguards appropriate to the operation:

- Preserve existing portfolio data, identity/ownership bindings, audit history,
  provenance, revisions, schemas, and repository evidence. Never silently
  overwrite, fabricate, infer, or discard them.
- Before a destructive, migration, replacement, or otherwise difficult-to-reverse
  data operation, make a verified recoverable backup or equivalent preservation
  copy. Confirm its integrity and that the restore path is usable before relying
  on it. Prefer reversible, additive changes where practical.
- Use integrity checks and targeted tests proportionate to the affected
  contract. Perform post-change verification of relevant behavior; for
  persistence work, include durable readback/reopen checks where applicable.
- Keep rollback/recovery practical. If verification fails, stop further
  mutation, preserve evidence, and recover or correct before claiming success.
- Preserve IPD repository ownership, architecture and API contracts, local
  identity and owner isolation, security boundaries, least privilege, and
  portfolio-data integrity. Do not bypass a guard to make a workflow pass.
- State what was and was not tested. No success, coverage, authority, source
  entitlement, or deployment claim may be inferred from an unrun check.

These are engineering practices, not approval gates. The owner may direct and
perform the work in one pass, with automated or independent technical checks
where useful; independent human approval is not a routine prerequisite.

## Scope exclusions

Production deployment or activation, SaaS/hosted service, multi-user or
institutional operation, commercial distribution, and production credentials or
entitlements are outside this operating model. Nothing here changes a production
fail-closed control or implies production readiness. A future scope change would
require a new explicit direction and the technical, legal, and security work
appropriate to that different deployment; it is not part of routine personal
operation.

## Applying this model to repository documents

- `docs/integration/IIPS-CURRENT-PORTFOLIO-EXECUTION-ROADMAP.md` is the current
  roadmap and must be read with this operating model: technical evidence and
  external dependencies may block a capability, but ordinary owner-directed
  implementation and verification are not approval blockers.
- `docs/LOCAL-PERSONAL-USE-PERSISTENCE.md` and
  `docs/DIRECT_P1_PROVISIONING.md` describe the personal local data path and
  provisioning safeguards; their technical guards remain in force.
- `docs/PHASE1_AUTHORIZATION_PREPARATION.md` and dated integration/gate records
  are historical evidence. Their earlier conditional approval outcomes and
  session-specific restrictions are not standing requirements for present-day
  routine work. Their factual history is retained.

When a real technical, security, data-preservation, or external-rights blocker
arises, document the specific evidence and resolve that blocker directly. Do not
reintroduce enterprise-style process by default.
