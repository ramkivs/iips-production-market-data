# S1 → D02 personal portfolio read relationship — technical decision proposal

**Status: PROPOSED — PA/PO APPROVAL REQUIRED; NOT IMPLEMENTED.**

The PA/PO is the sole user and decision authority for this personal, single-user, non-production application. Publishing this proposal is not approval, provisioning, operational activation, Stage 5 acceptance or permission to implement D5/D6.

## 1. Decision requested

Approve an explicit, code-governed, **read-only domain relationship** from the exact existing S1 identity below to D02 owner `owner-4dc756b3`, retaining S1 as the historical storage owner. Authorize only a subsequent bounded IPD implementation and its isolated tests, with no database/schema changes, no new identity or ACTIVE membership, no record reassignment, no mutation authority and no new wire fields. Approve the associated authorization-semantics amendment to v2 portfolio reads before implementation; existing no-owner-on-wire restrictions remain in force.

If this authorization interpretation is not acceptable, stop and select another design. Do not silently implement it as a resolver bug fix. Approval of this proposal does not authorize host execution or operational configuration changes.

## 2. Verified baseline and reusable evidence

Authoritative repository: `ramkivs/iips-production-market-data`. Read-only investigation baseline: `main@c7c726bc446a239c3f37c010a1f3b60cfc57b15b`. This proposal is published on the session's designated branch, whose original base is `6b50f0686e033e3d03cb8995d137e862cbf9068c`; the investigation used fetched main, not an assumption that the branch already contained subsequent merges.

Preserve exactly:

| S1 component | Value |
|---|---|
| Principal | `ramki-personal-local` |
| Tenant | `ipd-personal-local` |
| Stored canonical owner | `ipd-owner-ramki-personal` |
| Binding | `c5808abaffd072d6401ce63ad86c6ac0` |
| Membership | `d25dcc5370100b00766efc5166f65cf3` |
| Approved D02 domain owner | `owner-4dc756b3` |

Source facts:

- `src/persistence/binding.ts`: generic resolution requires exactly one ACTIVE binding and one ACTIVE attached membership. Holdings resolution additionally requires the D02 owner/tenant pair; S1 is currently refused. No relationship resolver is implemented.
- `src/persistence/migrations/003_local_principal_bindings.ts`: partial unique indexes permit only one ACTIVE binding and one ACTIVE membership globally. These checksummed historical migrations must not be edited.
- `src/persistence/portfolio_store.ts`: list/detail/history and child reads select stored canonical-owner keys; list/detail also validate tenant through the portfolio. `getV2` changes contribution validation, not ownership. Merely replacing an owner in memory cannot expose S1-keyed records correctly.
- `src/ipc/dispatch.ts`: v1 uses generic binding resolution; v2 uses holdings resolution, then existing list/getV2/revisions. v2 mutations are refused. Binding authority cannot come from request fields.
- Merged PR [#129](https://github.com/ramkivs/iips-production-market-data/pull/129) introduced the D02-scoped resolver and v2 read path; [#130](https://github.com/ramkivs/iips-production-market-data/pull/130) corrected durability behavior. Synthetic implementation evidence is not operational provisioning evidence.
- Published November 16 inventory: `evidence/d02-inventory-2026-11-16/windows-host/d02-d5-d16-inventory-20261116T143819255Z-96672044.zip`, SHA-256 `813183b382a26d0b6affeeaee04d44b0ea0057bea140a83221b460d8720da1b3`. Q04a/Q04b show the exact S1 binding/membership ACTIVE and unrevoked. Q06 shows all portfolio headers owned by S1, including active `DHAN_PORTFOLIO` revision 1. Its 64 persisted holdings are reconciled in `IIPS-W04-EVIDENCE-RECONCILIATION-AND-ACCEPTANCE-ASSESSMENT-2026-11-16.md` §3.3. This is historical evidence, not a current live database observation.
- `IIPS-W11-DEP1-CAPTURE-EVIDENCE-DISPOSITION-2026-11-13.md` records an operator-reported successful v1 list/get/history/get capture of 64 holdings, subject to review. It does not prove a D02 relationship; binding identity is not on the wire, peer authenticity is not attested, and running-build provenance is limited. Reuse that evidence with its labels; do not claim IPC has never succeeded.
- Existing regression `V2-C03` in `tests/durable_holdings_contract_v1.test.ts` intentionally rejects S1 on the current holdings path. Existing generic binding, framing, read-contract conformance, owner-isolation and persistence tests remain reusable baselines.

At investigation time open PRs #171 and #183 did not implement this relationship. Recheck main and PRs before authorized implementation to avoid duplicate work.

## 3. Alternatives

| Approach | Data / S1 preservation | Changes and drawbacks | Disposition |
|---|---|---|---|
| **Explicit read-only relationship in governed server code** | Preserves every S1 identifier, stored owner key, row and audit/history record | New internal read-context resolution and small v2 dispatch integration; authorization semantics need PA/PO approval. Static relationship changes require a reviewed release, not runtime provisioning. | **Recommended for this exact single-user scope. No schema migration needed.** |
| Dedicated domain-relationship table | Can preserve S1 and historical records | New schema/migration, relationship lifecycle, uniqueness, revocation, provisioning and audit rules. Useful for configurable or multiple relationships, neither currently required. | Technically viable, disproportionate now; separate approval if lifecycle requirements demand it. |
| Separate ACTIVE D02 membership | Cannot coexist with preserved ACTIVE S1 under current constraints | Requires changing global single-ACTIVE semantics, resolver and schema invariants; additional membership alone does not expose historical rows. | Reject for this task. |
| Replace S1 owner or rekey/copy portfolio history to D02 | Changes identity or ownership history, or creates duplicate records | Referential/history/digest/reconciliation implications; still needs decisions on all dependent records. | Reject: violates preservation objective. |
| Runtime owner alias, caller owner hint, or fallback after a failed read | Not reliably scoped | Can grant authority from configuration/input or turn an unavailable/foreign read into another owner's read. | Reject: no approved authority and unsafe isolation semantics. |

## 4. Recommended resolution model

Keep **authentication**, **domain authorization**, and **storage selection** distinct. Do not overload `ActiveOwner.canonicalOwnerId` or pass an effective D02 owner into existing S1-keyed store queries.

Introduce an internal-only, read-specific context concept (names illustrative, not an approved API):

- `authenticatedBinding`: the freshly resolved existing S1 binding and membership;
- `effectiveDomainOwner`: D02 `owner-4dc756b3`, tenant `ipd-personal-local`;
- `storageOwner`: S1 `ipd-owner-ramki-personal`, same tenant;
- `relationship`: a fixed, reviewed policy identifier;
- `capability`: only `portfolio.list`, `portfolio.get`, `portfolio.revisions` reads.

For this relationship **all five S1 identity components must match exactly**, and binding and membership must be ACTIVE, attached and unrevoked. Reject inconsistent status/revocation fields rather than treating a stale ACTIVE label as sufficient. No symbol, display name, environment setting, request key or portfolio existence can establish the relationship.

The relationship is compiled policy approved by the sole PA/PO, not a newly provisioned identity. It is usable only while the exact source binding remains valid. There is no default relationship or permissive fallback. Revoking/replacing S1 disables this relationship; changing an identifier requires a separately reviewed policy update. No separate runtime relationship revocation table is proposed: if independent mutable relationship revocation is required, the table alternative must be approved instead.

### Existing holdings access

For an exact S1-bound v2 read, authorize D02 domain access and execute the existing validated store projection with **S1 storage-owner predicates**. Preserve IDs, revisions, stored timestamps, contribution validation, nullable provenance, tombstones, contents and digests. Never rewrite or label persisted ownership as D02 ownership. The truthful claim is: “D02-authorized read of preserved S1-owned portfolio history.”

Keep the native D02-bound path unchanged: a valid existing D02 membership reads D02-keyed records only. Do **not** union S1 and D02 datasets, search one after the other, translate portfolio IDs, or select an owner based on which portfolio exists. Identical portfolio IDs under different stored owners remain isolated by the resolved storage scope. A future combined inventory or newly created D02 dataset is a separate design decision, not part of this proposal.

The chosen storage scope must be pinned for every query in one operation, including children and contributions. Every detail/history read must first apply the owner/tenant-scoped portfolio authorization, not query child rows solely by caller-provided portfolio ID. Reuse coherent read-snapshot machinery. Resolve and validate the relationship within the same database read transaction/snapshot as the protected read, using a caller-held resolver variant if needed; do not nest transactions or retain the existing resolve/read gap for this new authorization path. A revocation committed before the snapshot must win; a coherent in-flight read may finish on its snapshot, and the next request must refuse. Sequential multi-call capture is not atomic: revision changes require recapture.

### Single-ACTIVE compatibility

No second binding or membership is inserted. Existing partial unique indexes, generic resolver cardinality and foreign-key constraints remain intact. The relationship is domain authorization derived from one identity, not a second ACTIVE membership. Generic v1 resolution and reads remain unchanged.

### Mutations remain separate

Do not weaken `resolveActiveHoldingsBinding` or its in-transaction write counterpart to accept S1 for mutations. Use a separate read-specific resolution capability; do not reuse it in snapshot/import/restore/create/save/reset/delete paths. Existing v1 personal-use behavior is unchanged; no new write permission is conferred. v2 mutation dispatch remains refused. The new read context must not structurally masquerade as mutation authority; enforce this separation with types, narrow call sites and negative tests.

## 5. Necessary change classification

| Surface | Required? | Bounded scope |
|---|---|---|
| Identity provisioning / runtime configuration | **No** | Preserve existing identity, environment and deployment. No new activation flag. |
| Schema / migration / data rewrite | **No for the recommendation** | Existing rows and indexes suffice for a fixed relationship. Never edit historical migration checksums. |
| Read resolver | **Yes** | Exact S1 validation, explicit D02 authorization/storage-owner separation, native D02 compatibility and same-snapshot resolution. |
| Store orchestration | **Yes, minimal** | Safely expose/reuse transaction-aware list/detail/history orchestration so authorization and reads share one snapshot. Keep SQL owner predicates and projections; no broad owner-OR queries. |
| IPC dispatch | **Yes** | Only v2 read routing to the new context and scoped storage operations. Transport, framing, operation names and response shapes unchanged. |
| Contract semantics | **Yes, approval required** | The current holdings rule rejects S1; delegated read authorization is a deliberate semantic amendment. Record it in the existing authority/contract documentation under PA/PO approval. Determine its formal version treatment from the governing contract rules before implementation; this proposal does not self-assign a version. |
| Wire schema / new endpoint | **No** | No owner/binding IDs or relationship commitment on wire; no new operation needed for reads. A future attestation feature would be a separately approved contract change. |
| IRR implementation | **Not authorized / not assumed** | Verify the actual consumer protocol/projection expectation through existing evidence or its repository owner. This proposal changes no IRR files and does not presume that an existing v1 consumer automatically issues v2 reads. |

## 6. Fail-closed and isolation requirements

Refuse absent, duplicate, detached, revoked or inconsistent binding/membership; wrong principal, binding ID, membership ID, tenant or stored owner; unknown relationship; unsupported operation; caller-supplied authority; malformed stored projections; foreign/missing/tombstoned portfolio; and transaction/read failure. Preserve established Class P zero-byte binding/security refusals and indistinguishable Class A resource-unavailable outcomes. Do not disclose whether another owner has the same portfolio ID. Do not turn errors or unknown scope into empty-success results.

No global owner cache, implicit mapping, configurable alias, automatic rebinding, data transfer or fallback. No relationship lookup from untrusted request data. No identity/binding disclosure in success or error responses. Existing no-retry and write-safety rules remain intact.

## 7. Exact implementation scope, dependencies and risks

**After approval only, in IPD:** `src/persistence/binding.ts` (or one narrowly scoped adjacent read-policy module); transaction-aware read orchestration in `src/persistence/portfolio_store.ts`; v2 read routing in `src/ipc/dispatch.ts`; focused tests; existing contract/decision evidence, limitation/dependency and roadmap records. Touch protocol code only if a demonstrated existing helper boundary requires it, never to add wire fields. No migrations, database changes, host scripts/configuration, provisioning, new transport, provider integration, IRR changes or D5/D6 implementation.

Dependencies: recorded PA/PO approval and effective authorization amendment; current main review to avoid overlapping work; confirmation of consumer protocol and nullable contribution projection compatibility; existing permitted host/operator access for subsequent read-only evidence. No new platform dependency is proposed.

Risks and controls:

- **Authorization broadening:** exact identity tuple and read-only capability, separate write resolver and negative tests.
- **Effective/storage owner confusion:** distinct internal fields/types; all store queries pinned to one storage scope; no union/fallback.
- **Revocation race:** same-snapshot resolution and reads; barrier-controlled tests; no cross-call atomicity claim.
- **Contract mismatch:** approve semantics and verify consumer expectations before implementation; retain current projection validation without fabricated values.
- **Stale host/build evidence:** label historical evidence as historical; bind subsequent capture to reviewed artifacts using approved operator evidence. Do not infer running build from checkout commit alone.
- **Future configurability:** fixed policy deliberately does not support independent mutable grants. Revisit only if the PA/PO actually requires that capability.

## 8. Targeted tests and evidence — not executed by this proposal

Reuse prior passing baselines. Add only missing tests, and rerun affected suites after code changes:

1. Exact S1 tuple resolves authenticated S1 + effective D02 + S1 storage scope; native D02 path unchanged. One-at-a-time wrong identity fields and every invalid binding state refuse.
2. Disposable persisted S1 portfolio read through the real v2 endpoint: list/get/revisions match stored holdings, provenance, contributions and revisions before and after close/reopen. Whole database/domain-row digests unchanged by reads.
3. Same portfolio ID under S1, native D02 and foreign owner scopes: no union, fallback, child leakage or ambiguity; foreign tenant/tombstone/missing resource remains indistinguishable. S1 request never sees native D02 rows merely because they exist.
4. Relationship revocation/identity change between requests refuses the next request; two-connection barrier test proves revocation-before-snapshot wins and an allowed in-flight read remains coherent. No cache. Revision-change multi-call capture is detected and not relabelled atomic.
5. Caller identity injection, malformed frames and invalid projections preserve refusals. Existing no-owner-on-wire shapes and request/response framing remain unchanged.
6. Mutation isolation: S1 relationship cannot authorize any v2 mutation or direct holdings write primitive; native D02 write checks and current v1 behavior remain unchanged. Existing synthetic test asserting S1 rejection on the **write** path stays valid; new read tests document only the approved exception.
7. Focused binding/read-contract/durable-holdings/isolation suites, typecheck and relevant full IPD suite after implementation; record exact commit, commands and counts. No repeat of historical investigations or tests solely for proposal publication.

**Subsequent operational evidence, separately authorized:** first review existing capture/inventory rather than recapture automatically. To demonstrate the new relationship, the authorized host operator must identify the reviewed running artifacts and same-user IPC peer with approved local evidence, verify the exact S1 source binding read-only, and capture one successful D02-authorized v2 list/get/revisions/get sequence containing real persisted S1-owned holdings. Reconcile portfolio ID, revision, holdings count/content and stored provenance with the read-only source evidence; capture no mutation. Publish only approved sanitized evidence and digests. Named-pipe presence alone is insufficient. No database path or identity authority is sent on wire.

Because existing responses intentionally carry no binding identity, establish the relationship by source-policy verification plus same-host binding/process/build evidence, **not by claiming the response attests to D02**. The sole PA/PO must explicitly accept that evidence model for this personal application, or request a separately designed/approved attestation contract. Operator evidence remains operator evidence, not cryptographic proof.

## 9. Acceptance criteria and approval text

Acceptance requires: exact S1 identity and all existing rows/history preserved; single-ACTIVE constraints unchanged; explicit read-only D02 relationship implemented with same-snapshot validation; no owner leakage or new mutation capability; existing native D02/v1 behavior preserved; all affected tests/typecheck pass; remote implementation commit and files verified; successful real persisted-holdings IPC read evidenced with its limits and reviewed by the PA/PO. Proposal publication alone satisfies none of those implementation/operational criteria.

**Exact decision for the PA/PO:**

> Approve the fixed, exact-S1, read-only D02 authorization relationship described here, retaining S1 storage ownership and all existing identity/history. Approve the semantic amendment permitting these v2 reads without changing wire fields, and authorize the bounded IPD implementation and isolated verification only. Accept source-policy plus operator binding/peer/build evidence, with no wire binding attestation, as the proposed personal-use acceptance evidence model. No schema/data migration, new membership, operational provisioning/configuration, mutation authority, IRR modification or D5/D6 work is authorized. Host evidence execution remains a separate expressly authorized step.

If any clause is not approved, record the requested alternative and stop before implementation. No additional decision-making body or institutional gate is introduced: the sole PA/PO renders the decision.

## 10. Publication verification

Publication is documentation-only on `arena/d1c19f24-iips-production-market-data`. Verify the resulting commit by fetching that exact remote branch and comparing this file's bytes and commit identity; report those identifiers outside this file to avoid a self-referential commit hash. No PR merge is authorized by this task.
