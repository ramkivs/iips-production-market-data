# IIPS v3.0 — G-2: **IPD GATE B IMPLEMENTATION AUTHORITY (D-4) — ACT PREPARED FOR DECISION**

> ## STATUS: **PREPARED — NOT RENDERED — NOT AUTHORIZED — D-4 NOT GRANTED — IMPLEMENTATION STILL BLOCKED**
> This artifact puts **one** matter to the Program Authority: **D-4 — the scoped IPD Gate B
> implementation authority** — now the **only** remaining Gate B authority, D-1/D-2/FORM having been
> rendered and executed. It contains **no rendered approval**, no approver, and no implied consent.
> **No implementation may begin on any disposition of this artifact:** the implementation is
> conditioned on (i) the Authority rendering D-4 below in its own words, **and** (ii) the corresponding
> **IRR D-4 act being separately rendered** (§6) — **neither** is inferred from D-1/D-2, from the ref's
> existence, from publication authority, or from any one-pass execution instruction.

| Field | Value |
|---|---|
| **Act identifier** | `IIPS-V3-G2-IPD-GATE-B-IMPLEMENTATION-AUTHORITY-2026-10-17-01` |
| **Artifact type** | **Prepared implementation-authority act** (request for decision — not a decision; renders nothing) |
| **Repository / branch (this record)** | `ramkivs/iips-production-market-data` / `arena/21c63aef-iips-production-market-data` (existing **PR #8** workstream) |
| **Authority capacity required to render** | **RAMKI — Program Authority**, acting as the **IPD** security-contract/implementation authority for `ramkivs/iips-production-market-data` |
| **Implementation target ref** | `refs/heads/gate-b/local-principal-ipc-implementation` @ `2ded0e981407b38c73bdea164153f53856aa7217` — **exists, verified** (§2) |
| **Paired act required (separately owned)** | `IIPS-V3-G2-IRR-GATE-B-IMPLEMENTATION-AUTHORITY-2026-10-17-01` in `ramkivs/iips-review-recovered` — the same human may act in both capacities; each act states its own capacity and ref. **This IPD act cannot authorize IRR work and does not claim IRR D-4 is granted.** |
| **Precedents consolidated (byte-intact)** | D-1/D-2/FORM rendered act blob `d542ce4dfe372c27214cd9d2c67ec80ca5f693df`; ref-creation record blob `ba32b27113d4cc628910aa45a004026c958448c5`; Gate B request blob `8f29036846590209c79c410c555b259a3f70ed9f`; Gate B decision record blob `e640f61bbf3078c8ec23f21c30308c7bde08a7a9`; baseline-designation clarification blob `320ddf1e977a50e05911549634e403736133b44c`; authority-basis determination blob `604757bc0747c5bd0a3ef3a8b2f18448c0f0674d`; accepted `L-IPC-1` rev 2 blob `cab04b6f94618c9afad1440882ebf63437fdf6f8` |
| **Production status** | NON_PRODUCTION — one user, one personal laptop, H-18 scope |
| **Prepared at (UTC / local)** | `2026-10-16T20:38:25Z` (authoritative GitHub API HTTP `Date`) / 2026-10-17 02:08 IST |

---

## 1. WHAT IS ALREADY RENDERED — AND WHY D-4 IS THE ONLY MATTER LEFT

| Matter | State | Authority of record |
|---|---|---|
| **D-1 — baseline designation** | **RENDERED · EXECUTED** | `…BASELINE-DESIGNATION-AND-REF-CREATION-2026-10-17-01`, `D-1 — ACCEPT`: *"I designate commit 2ded0e98… with parent 6828155e… and tree 9069045d… as the IPD Gate B baseline."* |
| **D-2 — ref creation** | **RENDERED · EXECUTED** | same act, `D-2 — ACCEPT`; ref created by one non-forced push and independently verified (creation record blob `ba32b271…`) |
| **FORM — separate prior act** | **RENDERED** | same act, `FORM — ACCEPT` |
| **D-4 — implementation authority** | **NOT GRANTED — NOT SUPPLIED** | §3 below |

**Consequently** the recorded blockers of the earlier rounds are discharged: the baseline exists as a
designated object and the implementation ref exists at it. What remains is exactly one decision.

---

## 2. VERIFIED STATE AT PREPARATION (live remote, read-only)

| # | Item | Verified value |
|---|---|---|
| 1 | IPD `main` | `70b24f029842a7e9b7f615e4d9df7376fd4ff817` — **unmoved** |
| 2 | PR #8 | **OPEN, unmerged** (`mergedAt` null, `merged: false`), base `main`, head `cdd572b7…`; 27 files, +8,884/−62; 30 commits; 0 comments / 0 reviews; the only open PR |
| 3 | **Implementation ref** | `refs/heads/gate-b/local-principal-ipc-implementation` @ `2ded0e981407b38c73bdea164153f53856aa7217` — present; parent `6828155e…`, tree `9069045d…` |
| 4 | `gate-a/local-principal-enablement-2026-10-16` | `2ded0e98…` — unmoved (the new ref is a second carrier of the same object) |
| 5 | Ref inventory | `36 heads / 4 tags / 9 pull refs` |
| 6 | **Baseline tree (387 files)** | `src/{app_identity,auth,contracts,d114,e2e,engine_adapters,fundamentals,gate_a,identity,index.ts,ingress,intelligence,normalization,operations,operator_drop,oq,persistence,pit,portfolio,quality,security,server,spi,transports,ui}` |
| 7 | **Proposed new paths — absent at baseline** | `src/ipc/**` **absent** · `src/user_portfolio/**` **absent** · `tests/gate_b_*` **absent** |
| 8 | Protected blobs at baseline (§5.3) | `001` `48fcf4d9…` · `002` `dfe9f027…` · `003` `9ba884ac…` · `registry.ts` `5d3ab64a…` · `local_principal.ts` `710a47e2…` · `http-server.ts` `17f9cb8a…` · `consolidation.ts` `e8e09e56…` · `repository.ts` `00d28706…` · `mapping_store.ts` `eec60c09…` · `security_master.ts` `e260fd90…` · `src/index.ts` `dfae3395…` |
| 9 | **C12 gap — located precisely** | `validateHolding()` lives in **`src/server/http-server.ts`** (byte-unchanged, §5.3); the save-guard bypass branch `NON_PRODUCTION_OPERATOR_BYPASS` is in **`src/portfolio/consolidation.ts` L113** and `…/repository.ts` — both proposed byte-unchanged; **the new path must neither call nor emit it** |
| 10 | Workstream nature | PR #8's branch is **documentation-only relative to the baseline** — it is based on `main` and lacks the G24 layers; **implementation belongs on the `gate-b/*` ref**, not on the PR #8 branch (§5.5) |

---

## 3. DETERMINATION — NO EXPLICIT PROGRAM AUTHORITY ACT HAS GRANTED IPD D-4

Searched: the PR #8 branch and **all 29 remote refs**; PR #8 issue comments (**0**), reviews (**0**),
review comments (**0**); repository issues (**0**); comments on PRs #1–#7 (**0**). Every occurrence of
"D-4" in the repository is **prepared, pending, or prohibitory** text — never a grant:

| Text of record | Exact wording relied upon |
|---|---|
| Gate B **decision record** (blob `e640f61b…`) | banner: *"⛔ STATUS: PENDING AUTHORITY REVIEW — NOT APPROVED — NOT A DECISION — **GATE B NOT GRANTED**"*; **D-4** row = `PENDING AUTHORITY REVIEW` |
| Rendered **D-1/D-2 act** (blob `d542ce4d…`) — `LIMITS` | *"This act grants **no** Gate B implementation authority, Gate C qualification, Gate D route admission, Gate E write policy, P-6/P-8, production eligibility, G24 promotion, or PR merge."* |
| **Ref-creation record** (blob `ba32b271…`) §5 | *"**does not** grant, imply, or pre-approve **Gate B implementation (D-4)** — implementation remains **NOT GRANTED** and requires a separate rendered act"* |
| **Gate A** rendered decision (blob `08df3b9e…`) D6/§6 | *"No endpoint/resolver implementation … authorized by this act"*; Gates B/C/D/E each *"remain a separate required act"* |
| Gate A **reconciliation** (blob `b1353d5b…`) §3.6 | *"Until **both** are rendered, **no implementation may begin**"* |

**Therefore: D-4 remains PENDING.** It is **not** inferred from D-1/D-2, from the ref's existence, from
publication authority, from the prior Gate A authorization, or from the instruction to execute this
task in one pass. **No implementation was performed in this task** (§9).

---

## 4. THE SINGLE DECISION REQUESTED

> **May IPD Gate B implementation begin on the designated baseline and within the exact scope of §5,
> conditioned on the paired IRR D-4 act being separately rendered?**

---

## 5. THE NARROWEST SUFFICIENT SCOPE

### 5.1 May be created — **exactly 15 new files** (names are proposals; the Authority may amend or narrow)

| # | Path | Purpose / obligation carried |
|---|---|---|
| 1 | `src/ipc/endpoint.ts` | same-host endpoint create/bind/close — Windows **named pipe** on the deployment host, POSIX **UNIX socket** for dev/CI; POSIX directory/socket modes **set and verified**; stale-endpoint cleanup; **bind once, fail closed** incl. name-already-taken |
| 2 | `src/ipc/framing.ts` | strict request/response framing; **total request size cap**; explicit **protocol version**; **no greeting/banner** |
| 3 | `src/ipc/server.ts` | connection lifecycle; **C5.1 no bytes before a valid, authorized request**; **C5.4 caps**; **C6** uniform fail-closed errors; **C7 refusal enforcement** |
| 4 | `src/ipc/entrypoint.ts` | operator-run startup in the fixed order **`validate → connect → migrate → verify → bind`** (C2/C5.3); close on shutdown; **refuse** when the binding is absent, malformed, or not `ACTIVE` |
| 5 | `src/ipc/errors.ts` | refusal/error taxonomy — **unauthorized ≡ missing** (C6) |
| 6 | `src/ipc/index.ts` | module barrel (imported **by path**; no root-barrel change — §5.3) |
| 7 | `src/user_portfolio/operations.ts` | owner-scoped portfolio **read/analytics** operations over the **existing store** and authorization triple; principal resolved **from the binding, never the payload**; **no successful write** (Gate E) |
| 8 | `src/user_portfolio/canonical_identity.ts` | **C12**: canonical resolution/refusal using the **existing** mapping capability; zero (`UNMAPPED_IDENTIFIER`) or conflicting (`AMBIGUOUS_COLLISION`) ⇒ **refuse before serialization, port call, or persistence**, with quarantine evidence; **no bypass emitted** |
| 9 | `src/user_portfolio/errors.ts` | refusal vocabulary (shared with C6/C7 refusals) |
| 10 | `src/user_portfolio/index.ts` | module barrel (as #6) |
| 11 | `tests/gate_b_ipc_endpoint.test.ts` | bind/close; single-bind fail-closed; name-taken; mode enforcement; stale endpoint |
| 12 | `tests/gate_b_ipc_refusals.test.ts` | **C5.1 no-bytes**; C5 caps; **C6 indistinguishable refusals**; the **full C7 matrix** |
| 13 | `tests/gate_b_user_portfolio_operations.test.ts` | operations resolve **from the binding**; write **refusal** pending Gate E |
| 14 | `tests/gate_b_canonical_identity.test.ts` | C12 accepted/refused paths; **DP-2 Option 2F** refusal; no bypass emitted |
| 15 | `tests/gate_b_support.ts` | shared fixtures/harness |

**Also permitted (implementation commits only):** commits **on the implementation ref**
`refs/heads/gate-b/local-principal-ipc-implementation`, descending from `2ded0e98…`, containing
**only** the files above. **No other commit, path, ref, or PR is authorized.**

### 5.2 IPC responsibilities — `L-IPC-1` C1–C12, as accepted (no clause relaxed)

| Clause | Obligation the implementation must satisfy |
|---|---|
| **C1** | owner-scoped operations reachable **only** via the new endpoint — **no** TCP/HTTP/URL surface serves them |
| **C2** | endpoint created only **after** config validation, store connection, and migration verification succeed |
| **C3** | exactly **one** provisioned binding; identity **never** taken from the wire |
| **C4** | two ordinary processes; **no** service, elevation, or separate privileged account |
| **C5.1–C5.5** | no bytes before a valid authorized request; authorize from the binding; bind once / fail closed; connection + size caps; close on shutdown and refuse when the binding is absent/malformed/not `ACTIVE` |
| **C6** | fail closed **uniformly**; unauthorized ≡ missing; **no owner disclosure**; no partial effect |
| **C7** | **refuse (not ignore)** any caller-supplied principal, user id, subject, credential material, owner claim, tenant/membership claim, caller-selected scope, and the enumerated identity keys (`companyId`, `runtimeCompanyId`, `identityStatus`, `resolutionDisposition`) — **re-enforced IPD-side** |
| **C8** | browser-facing surface stays **loopback-only**; no wildcard CORS on owner-scoped routes; no LAN/preview/reverse-proxy/shared-host posture |
| **C9** | first-party signal + `Origin`/`Sec-Fetch-Site` consistency — **CSRF hardening only, never recorded as authentication** |
| **C10** | the Gate A binding consumed **read-only**; no equivalence to any other identity domain created or implied |
| **C11** | **the existing durable store remains the only portfolio store** — no second store, cache-of-record, or side file |
| **C12** | caller-supplied identity refused at the boundary; **IPD resolves canonically or refuses before persistence**; exactly one match admissible; **no bypass emitted**; and the verified off-main gap (`validateHolding()` defaults + the Save-Guard bypass branch) **must not be reused as-is** |

### 5.3 Must remain **byte-unchanged** (read-only reuse — a verifiable invariant)

**From the existing Gate B request, unchanged:** `src/persistence/**` (incl. migrations `001`
`48fcf4d9…`, `002` `dfe9f027…`, `003` `9ba884ac…`, the registry and `migrations/index.ts`) ·
`src/app_identity/**` (incl. `local_principal.ts` `710a47e2…`) · `src/server/**` (the existing HTTP
surface, incl. `http-server.ts` `17f9cb8a…`, which holds `validateHolding()`) · `src/auth/**` ·
`src/gate_a/**` (operator tooling) · **all `tests/g24_*` expectations** · `package.json` scripts used
by qualification · `tsconfig.json` and the build configuration.

**Proposed tightening — narrowing offered for the Authority's decision** (the Authority may accept it
or relax it by explicit change): also byte-unchanged —
`src/portfolio/**` (`consolidation.ts` `e8e09e56…` — holds the **Save-Guard bypass branch at L113**;
`repository.ts` `00d28706…`) · `src/identity/**` (`mapping_store.ts` `eec60c09…`,
`security_master.ts` `e260fd90…` — the canonical-identity capability, consumed **read-only**) ·
`src/index.ts` (`dfae3395…` — **no root-barrel re-export**; the new modules are imported by path,
following the established precedent in this lineage where the barrel was deliberately left
unmodified).

**Rationale:** C11 and C12 are properties of *not modifying* the existing store and write path, and of
*reusing* the existing mapping capability read-only. Pinning these files makes that invariant
mechanically verifiable at review time rather than merely asserted.

### 5.4 Required tests and evidence — **Gate B evidence, explicitly NOT qualification evidence**

**Gate B deliverable:** the §5.1 test files **passing on the designated baseline** `2ded0e98…`,
covering — endpoint bind/close and single-bind fail-closed; **no bytes before a valid authorized
request**; the C5 behaviors and caps; **C6** indistinguishable refusals; the **full C7** matrix; **C12**
accepted/refused paths; **DP-2 Option 2F** refusal; **write refusal pending Gate E**; **C11**
single-store inventory; plus the **published implementation diff** and **commit identities** on the
implementation ref. A type-check/build result for the changed files is required evidence.

> **The C5.1 behavior is *implemented and tested* in Gate B, but C5.1/Q9 is **qualified** only in Gate
> C.** No Gate B test result may be recorded, cited, or published as the **Q9 zero-bytes
> qualification**, and passing these tests is **not** a qualification finding (§7).

### 5.5 Trust boundary (as accepted; **not re-opened**)

Two ordinary local processes on one laptop — the browser-facing IRR process and the IPD portfolio
process — over a **same-host IPC endpoint owned by IPD**: Windows **named pipe** on the deployment host
(single `CreateNamedPipeW(…, NULL)` call site in libuv 1.51.0; default DACL; **duplex**, so a read-only
client open is legal), POSIX **UNIX socket** for dev/CI where owner-only modes can be enforced. The
browser carries **no** authority and cannot open the endpoint. **No peer process identity is claimed or
available**; the guarantee is limited to *"requests arriving on this endpoint act as the single
provisioned principal"*, plus C5/C6/C7. **The same-account exposure — any process running as the
operator, including malware — is disclosed, not mitigated, and lies outside the protection boundary.**
**No** TCP port, HTTP route, URL, mTLS, OIDC issuer, token exchange, forwarded principal, service
credential, or browser-supplied identity participates. **Effective ACL/SDDL enforcement on Windows is
not demonstrated** — V-1 and V-4 were **PA-waived, not proven** (§6).

### 5.6 Excluded / prohibited within D-4 (absent separate authority)

Implementation **outside** §5.1 · **Gate C** qualification (Q1–Q11, incl. **mandatory C5.1/Q9**) ·
**Gate D** route admission or any change to the IRR **503 `owner-context-unavailable`** fence ·
**Gate E** write policy, any **durable write**, or any successful-save claim · **P-6** · **P-8** ·
any production eligibility, certification, deployment, or "ready" claim · **promotion, merge,
cherry-pick, re-pin, or admission** of the unadmitted G24 lineage or of the derivative/baseline refs ·
moving `main`, the `gate-a/*` ref, the PR #8 branch (beyond additive documentation commits),
`arena/01a0f308-…`, `arena/01a0e6d9-…`, `arena/01a0f839-…`, or the NP-04 pin · **modifying the
baseline commit** `2ded0e98…` · **merging PR #8** or any IRR PR · **opening a PR from the
implementation ref** · any schema or migration change · any **new runtime dependency or lockfile
change** · any route, UI, or consumer-admission change · a second portfolio store · any credential,
issuer, OIDC/Keycloak, RBAC, multi-user or enterprise-tenancy element · a Windows service, elevated
process, or separate service account · **any change to IRR** (including the two fence files) ·
re-running Gate A or modifying the Gate A store.

**Stop conditions (mandatory):** if the implementation ref's tip, the baseline tuple, or any protected
blob differs from §2; if the paired IRR D-4 act is not rendered; if a required behavior cannot be
implemented within §5.1 — **stop before the offending change and report the exact discrepancy; never
substitute, never improvise, never expand scope.**

---

## 6. PRECONDITION — THE PAIRED IRR D-4 ACT, AND THE PRESERVED CONTROLS

**Hard precondition (express):** no implementation commit may be authored until the corresponding
**IRR D-4 act** (`IIPS-V3-G2-IRR-GATE-B-IMPLEMENTATION-AUTHORITY-…` in `ramkivs/iips-review-recovered`)
has been **separately rendered** by the Authority acting in its **IRR** capacity, and the IPD side has
confirmed that rendering. **This IPD act authorizes IPD work only**: it **cannot** authorize IRR work,
and **it does not claim, assert, verify, or imply that IRR D-4 is granted.** As recorded at transfer,
IRR **implementation** authority remains **ungranted**.

Also preserved, un-reopened and un-relaxed: `L-IPC-1` **C1–C12** as accepted (blob `cab04b6f…`) ·
**DP-2 Option 2F** (unresolved/ambiguous holdings refused for persistence before
serialization/port/persistence) · **C11** single store · **H-18** one user / one personal laptop /
non-production · the effective **IRR DP-1 amendment** dependency (IRR `main` `10584439…`) · the IRR
**HTTP 503 fence** · **all four Gate V PA waivers** — V-1 ACL/SDDL capture, V-4 pipe collision/re-bind,
second-account access, remote-machine access — **waivers, not technical proof**.

---

## 7. GATE C AND LATER GATES — DEFERRED, NOT TRANSFERRED

**Gate C (Q1–Q11) remains deferred and unclaimed:** Q1 Gate V on the deployment host; Q2 startup
fail-closed; Q3 claim-refusal matrix; Q4 owner/tenant isolation; Q5 canonical identity incl. quarantine
evidence; Q6 DP-2 2F; Q7 revision/lifecycle; Q8 durability across restart; **Q9 — MANDATORY C5.1/Q9
zero-bytes qualification probe, NOT EXECUTED AND NOT CLAIMED**; Q10 exactly one portfolio store;
Q11 drift check. Any D-4 disposition grants **no** qualification result, and the §5.4 tests are
**implementation evidence only**.

---

## 8. EXACT PROPOSED DECISION TEXT (for the Authority to render — optional)

> **IPD Gate B — implementation authority (D-4).** On the executed D-1/D-2 state — baseline
> `2ded0e981407b38c73bdea164153f53856aa7217` (parent `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4`,
> tree `9069045d3daf22156020188696fc2f9c2f32bf27`) designated, and
> `refs/heads/gate-b/local-principal-ipc-implementation` created at it — I authorize IPD Gate B
> implementation **within the exact scope of §5.1 (15 new files) and no other path**, on that
> baseline ref, under the IPC mechanism and trust boundary of §5.5 and the **C1–C12** obligations of
> §5.2, with the byte-unchanged set of §5.3 (including the proposed tightening) preserved as an
> invariant, and with the Gate B test set of §5.4 as its evidence. **This act is conditional on the
> paired IRR D-4 act being separately rendered**; it authorizes no IRR work and asserts nothing about
> IRR D-4. It grants **no** Gate C qualification (Q1–Q11 incl. the mandatory C5.1/Q9 probe), no Gate D
> route admission or 503-fence change, no Gate E write policy or durable write, no P-6/P-8, no
> production eligibility, and no merge. It does **not** promote, merge, cherry-pick, re-pin, or admit
> any G24 lineage or derivative ref, does **not** move `main` or any other ref, does **not** modify the
> baseline commit, and does **not** open a PR from the implementation ref. DP-2 Option 2F, C11, H-18,
> the DP-1 amendment and **all four Gate V waivers** remain in force and un-reopened.
> **Disposition:** `ACCEPT` / `ACCEPT WITH CHANGES` / `REJECT` / `DEFER`.

**Optional narrowing available to the Authority** (each is a legitimate `ACCEPT WITH CHANGES`):
(a) **defer `src/user_portfolio/operations.ts`** — the endpoint is then refusal-only (C1/C5/C6/C7 still
satisfied; read operations deferred to a later act); (b) **relax the §5.3 tightening** for
`src/portfolio/**`, `src/identity/**`, or `src/index.ts`; (c) **reduce the test set** (§5.4 items are
the minimum for the obligations claimed); or (d) **DEFER D-4 entirely**, leaving the baseline and ref
in place with implementation blocked.

**Required confirmations if the disposition is not `REJECT`/`DEFER`:** (i) the exact file set and any
narrowing; (ii) that the §5.3 invariant (as tightened or relaxed) applies; (iii) that Gate C remains
separate and **C5.1/Q9 is not claimed**; (iv) that the paired IRR D-4 act is required and separate.

**Rendering mechanics:** the decision is rendered by the Program Authority and recorded by the
Recording Agent as a **subsequent additive artifact** in this workstream, stating the Authority's
capacity, the repository/ref, the disposition per item, and the date. **This artifact fabricates no
approver, signature, or approval, and none may be inferred from it.**

---

## 9. WHAT THIS TASK DID **NOT** DO, AND THE ATTESTATION

| Check | Result |
|---|---|
| Authority rendered by this artifact | **NONE** — D-4 remains `PENDING`; no implementation authority is granted or implied |
| D-4 inferred from D-1/D-2, publication authority, or one-pass execution | **NO** |
| Implementation authored, committed, or executed | **NONE** — no `src/**` or `tests/**` file created or changed; nothing built or run |
| Application source or tests modified on any ref | **NO** |
| Refs created, moved, or deleted | **NONE** — implementation ref still `2ded0e98…`; `main`, `gate-a/…`, all other refs unmoved; inventory `36 / 4 / 9` |
| PR opened from the implementation ref | **NO** — the only open PR remains PR #8 |
| PR #8 merged | **NO** — OPEN, unmerged |
| Gate A store / Gate A act | **not accessed, not modified, not re-run** |
| Prior artifacts rewritten | **NO** — every cited artifact referenced by identity and left byte-intact |
| IRR repository | **not accessed, fetched, modified, or published to**; nothing asserted about IRR D-4 |
| Gate C/D/E advanced; P-6/P-8 granted; production claim | **NO** |
| Gate V waivers reopened | **NO** — all four preserved |
| New artifacts | **exactly one** — this prepared act |

*End of prepared act `IIPS-V3-G2-IPD-GATE-B-IMPLEMENTATION-AUTHORITY-2026-10-17-01` —
**PREPARED · D-4 PENDING · IMPLEMENTATION STILL BLOCKED · CONDITIONAL ON THE PAIRED IRR D-4 ACT ·
NON_PRODUCTION**.*
