# IIPS v3.0 — G-2 — **IPD GATE B IMPLEMENTATION-AUTHORITY — DECISION RECORD — PENDING AUTHORITY REVIEW**

> # ⛔ STATUS: **PENDING AUTHORITY REVIEW — NOT APPROVED — NOT A DECISION — GATE B NOT GRANTED**
>
> **This artifact is a decision record presented for the Program Authority's review.** It contains
> **no rendered approval**, no approver name, no signature, and no implied consent. Every disposition
> field below reads **`PENDING AUTHORITY REVIEW`**. **Approval is not inferred** from the existence
> of the Gate B request, from the prior publication authorization, from the instruction to prepare
> this record, or from any other artifact. **No decision exists until the Program Authority renders
> one under its own authority, in its own words, recorded by a subsequent additive artifact.**
>
> **Gate B implementation remains BLOCKED until that act is rendered.** No `gate-b/*` ref exists or
> may be created; no implementation file may be authored, changed, or committed.

| Field | Value |
|---|---|
| **Record identifier** | `IIPS-V3-G2-IPD-GATE-B-IMPLEMENTATION-AUTHORITY-DECISION-RECORD-2026-10-16-01` |
| **Record type** | **Decision record — prepared for review** (recording only; renders nothing) |
| **Repository / branch (this record)** | `ramkivs/iips-production-market-data` / `arena/21c63aef-iips-production-market-data` (existing **PR #8** workstream) |
| **Authority required to render** | **RAMKI — Program Authority**, in the **IPD security-contract authority** capacity |
| **Decision status** | **`PENDING AUTHORITY REVIEW`** |
| **Inputs consolidated (unmodified)** | Gate B request — blob `8f29036846590209c79c410c555b259a3f70ed9f` (commit `16c0e645af68211b2184988ac5b113a7b7a8d89a`); baseline-designation clarification — blob `320ddf1e977a50e05911549634e403736133b44c` (commit `3f9eeac35cedcde989857e01ccefe5579c4c4729`); Gate A reconciliation — blob `b1353d5b…`; accepted `L-IPC-1` rev 2 — blob `cab04b6f94618c9afad1440882ebf63437fdf6f8` |
| **Production status** | NON_PRODUCTION — one user, one personal laptop, H-18 scope |
| **Prepared at (UTC / local)** | 2026-10-16 / 2026-10-16, Asia/Calcutta |

---

## 1. DECISION ARCHITECTURE — FIVE SEPARATE MATTERS, NEVER COLLAPSED

The four blocks below are **constitutionally distinct**. Accepting one does **not** accept another;
this record's purpose is that they can be accepted or rejected **individually**:

| # | Matter | Character | Status today |
|---|---|---|---|
| **A** | **Baseline designation** — which artifact is *designated* as the Gate B implementation baseline (a designation, not a promotion) | **Decision required now** | `PENDING AUTHORITY REVIEW` |
| **B** | **Permission to create the exact Gate B starting ref** — creation of `refs/heads/gate-b/local-principal-ipc-implementation` at the exact commit object (a ref-inventory mutation; requires explicit naming per the clarification's determination) | **Decision required now** | `PENDING AUTHORITY REVIEW` |
| **C** | **Gate B implementation authority** — permission to author/commit the scoped implementation on that basis | **Decision required now** | `PENDING AUTHORITY REVIEW` |
| **D** | **Gate C qualification** — Q1–Q11 on the realized endpoint, incl. the mandatory **C5.1/Q9** zero-bytes probe | **NOT AT ISSUE — separate later act** | NOT GRANTED · **not claimed as passed** |
| **E** | **Route admission (Gate D) and write policy / canonical-identity source (Gate E)** — incl. any change to the IRR 503 fence | **NOT AT ISSUE — separate later acts** | NOT GRANTED · 503 fence in force |

**Interdependency:** the paired IRR act (`IIPS-V3-G2-IRR-GATE-B-IMPLEMENTATION-AUTHORITY-2026-10-16-01`,
prepared; **not yet published** in IRR — its publication awaits a credential authorized for that
repository) must also be rendered. **C is conditional on the paired act being rendered**; A and B
are IPD-local and do not depend on it.

---

## 2. EXACT PROPOSED REPOSITORY / REF / BASIS TUPLE

```
repository        ramkivs/iips-production-market-data
+ref (to create)  refs/heads/gate-b/local-principal-ipc-implementation
-  (must NOT exist)  [verified: gate-b/* refs on the remote = 0]
+starting commit   2ded0e981407b38c73bdea164153f53856aa7217
-  parent          6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4   (the designated, accepted basis object)
-  tree            9069045d3daf22156020188696fc2f9c2f32bf27
-  content         10 files, +1,572 / −19  (accepted A-2/A-3 enablement + mechanical test updates)
+carrier ref       refs/heads/gate-a/local-principal-enablement-2026-10-16  (published; NON_PRODUCTION)
```

| Existing ref | Tip | Effect of A/B/C |
|---|---|---|
| `main` | `70b24f029842a7e9b7f615e4d9df7376fd4ff817` | **untouched** |
| `gate-a/local-principal-enablement-2026-10-16` | `2ded0e981407b38c73bdea164153f53856aa7217` | **untouched** (a new ref is created at the same commit; the existing ref is not moved) |
| `arena/01a0f308-…` (accepted basis carrier) | `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4` | **untouched** |
| `arena/01a0e6d9-…` (designated target) | `c1b955b427486dbce6d6a159a448065b9db45dc9` | **untouched** |
| `arena/01a0f839-…` (governance) | `12c480b5bf5cfbe0f296fcd12c9189328b915417` | **untouched** |
| `np04-governed-persistence-windows` (NP-04 pin) | `2e11fa3b689d1a3674a5e4ba1f1de9a559e20494` | **untouched** |
| `arena/21c63aef-…` (PR #8) | `3f9eeac35cedcde989857e01ccefe5579c4c4729` | advances only by additive documentation commits |

**What the designation is NOT:** not a promotion, merge, cherry-pick, re-pin, or admission of the
off-main G24 lineage; **not** a substitution for the designated Gate A execution basis `6828155…`;
**not** an admission of the derivative ref; **not** an effective-on-`main` capability. Publication
of the derivative ref **is not** and **does not constitute** this designation.

---

## 3. PERMITTED IMPLEMENTATION SCOPE (matter **C**) — FILES, MODULES, TESTS

### 3.1 May be created (new files only; names are proposals open to the Authority's amendment)

| Path | Purpose |
|---|---|
| `src/ipc/endpoint.ts` | same-host endpoint create/bind/close (Windows named pipe; POSIX socket for dev/CI); POSIX dir/socket modes set and verified; stale-endpoint cleanup |
| `src/ipc/framing.ts` | strict request/response framing, size cap, explicit protocol version, **no greeting/banner** |
| `src/ipc/server.ts` | connection lifecycle; **C5.1** no-bytes-before-valid-request; **C5.4** caps; **C6** fail-closed; **C7** refusal enforcement |
| `src/ipc/entrypoint.ts` | operator-run startup: config validate → store connect → migration verify → **bind** (**C2/C5.3**); close on shutdown |
| `src/ipc/errors.ts`, `src/ipc/index.ts` | refusal/error taxonomy (unauthorized ≡ missing) and barrel |
| `src/user_portfolio/operations.ts` | owner-scoped portfolio **read/analytics** operations over the existing store and authorization triple, resolved **from the binding** — never the payload |
| `src/user_portfolio/canonical_identity.ts` | **C12** resolution/refusal via the existing G24 mapping capability; zero/conflicting ⇒ refuse **before** serialization or persistence |
| `src/user_portfolio/errors.ts`, `src/user_portfolio/index.ts` | refusal vocabulary and barrel |
| `tests/gate_b_ipc_endpoint.test.ts` | bind/close, single-bind fail-closed, mode enforcement, stale endpoint |
| `tests/gate_b_ipc_refusals.test.ts` | C5.1 no-bytes, C5 caps, C6 indistinguishable refusals, full C7 matrix |
| `tests/gate_b_user_portfolio_operations.test.ts` | operations resolve from the binding; refusal of writes pending Gate E |
| `tests/gate_b_canonical_identity.test.ts` | C12 accepted/refused paths; DP-2 2F refusal; no bypass emitted |
| `tests/gate_b_support.ts` | shared fixtures/harness |

### 3.2 Must remain **byte-unchanged** (read-only reuse — a verifiable invariant)

`src/persistence/**` (including migrations `001` `48fcf4d9…`, `002` `dfe9f027…`, `003` `9ba884ac…`, and
the registry) · `src/app_identity/**` (including `local_principal.ts` `710a47e2…`) · `src/server/**`
(the existing HTTP surface) · `src/auth/**` · `src/gate_a/**` (operator tooling) · all `tests/g24_*`
expectations · `package.json` scripts used by qualification · `tsconfig`/build configuration.

### 3.3 Excluded / prohibited within matter **C**

Any schema or migration change · any change to the Gate A store · any new runtime dependency or
lockfile change · any route, UI, or consumer-admission change · any write-policy or successful-write
implementation · **any change to IRR** (including the two 503 fence files) · any production or
deployment artifact · a second portfolio store · any credential, issuer, OIDC/Keycloak, RBAC,
multi-user or enterprise-tenancy element · a Windows service or separate service account.

---

## 4. IPC MECHANISM AND TRUST BOUNDARY (as accepted; not re-opened by this record)

Two ordinary local processes on one laptop — the browser-facing IRR process and the IPD portfolio
process — over a **same-host IPC endpoint owned by IPD** (Windows named pipe on the deployment host;
UNIX domain socket for dev/CI). The browser carries **no** authority and cannot open the endpoint.
**No peer process identity is claimed or available**; the guarantee is limited to *"requests arriving
on this endpoint act as the single provisioned principal"*, plus C5. The same-account exposure
(any process running as the operator, **including malware**) is **disclosed, not mitigated** and lies
**outside** the protection boundary. **No** TCP port, HTTP route, URL, mTLS, OIDC issuer, token
exchange, forwarded principal, service credential, or browser-supplied identity participates.

---

## 5. `L-IPC-1` C1–C12 — OBLIGATIONS PRESERVED (matter **C**)

| Clause | Obligation carried into implementation |
|---|---|
| **C1** | owner-scoped operations reachable **only** via the new endpoint; no TCP/HTTP/URL surface |
| **C2** | endpoint created **only** after config validation, store connection, migration verification (`validate → connect → migrate → verify → bind`) |
| **C3** | exactly one provisioned binding; identity **never** from the wire |
| **C4** | ordinary processes; no service, no elevation, no separate account |
| **C5.1–C5.5** | **no bytes before a valid authorized request**; authorize from the binding; bind once, fail closed (incl. name-taken); connection/size caps; close on shutdown, refuse when binding absent/malformed/not `ACTIVE` |
| **C6** | fail closed uniformly; **unauthorized ≡ missing**; no owner disclosure; no partial effect |
| **C7** | refuse (not ignore) any caller-supplied principal, user id, subject, credential material, owner claim, tenant/membership claim, caller-selected scope, and the enumerated identity keys (`companyId`, `runtimeCompanyId`, `identityStatus`, `resolutionDisposition`) — **re-enforced IPD-side** |
| **C8** | loopback-only browser-facing posture; no wildcard CORS on owner-scoped routes; no LAN/preview/reverse-proxy/shared-host posture |
| **C9** | first-party signal + `Origin`/`Sec-Fetch-Site` consistency — **CSRF hardening only, never recorded as authentication** |
| **C10** | the Gate A binding consumed read-only; no equivalence to any other identity domain created or implied |
| **C11** | **the G24 durable store remains the only portfolio store** — no second store, cache-of-record, or side file |
| **C12** | canonical identity: caller-supplied identity refused at the IPC boundary; **IPD performs canonical resolution or refusal before persistence**; exactly one match admissible; zero (`UNMAPPED_IDENTIFIER`) or conflicting (`AMBIGUOUS_COLLISION`) ⇒ refused before serialization/port/persistence with quarantine evidence; **no bypass emitted** |

**Verified gap that must be closed, not inherited:** the off-main write path defaults `companyId` to
`''`, `identityStatus` to `'RESOLVED'`, `resolutionDisposition` to `'CANONICAL_P04'`, and its Save
Guard accepts the `NON_PRODUCTION_OPERATOR_BYPASS` branch — **reusing that guard unchanged would
violate C12**.

---

## 6. REQUIRED TESTS AND EVIDENCE — SEPARATED FROM GATE C

**Gate B (matter C) deliverable:** the §3.1 test files passing on the designated basis, covering
endpoint bind/close and single-bind fail-closed; **no bytes before a valid request**; C5 behaviors
and caps; C6 indistinguishable refusals; the full C7 matrix; C12 refusal paths; DP-2 2F refusal;
write refusal pending Gate E; C11 single-store inventory; plus the published implementation diff and
commit identities. **Gate B evidence is not qualification evidence.**

**Matter D — Gate C — REMAINS DEFERRED AND IS NOT CLAIMED:** Q1–Q11 (**Q1** Gate V on the deployment
host; **Q2** startup fail-closed; **Q3** claim-refusal matrix; **Q4** owner/tenant isolation;
**Q5** canonical identity incl. quarantine evidence; **Q6** DP-2 2F; **Q7** revision/lifecycle;
**Q8** durability across restart; **Q9 — MANDATORY C5.1/Q9 zero-bytes qualification probe, NOT
EXECUTED AND NOT CLAIMED AS PASSED**; **Q10** exactly one portfolio store; **Q11** drift check), all
as V-E items against the realized endpoint.

---

## 7. PRESERVED CONTROLS AND WAIVERS (unchanged by any disposition here)

**DP-2 Option 2F** — unresolved/ambiguous holdings refused for persistence before
serialization/port/persistence; **C11** single store; **H-18** one user / one personal laptop /
non-production; **the IRR HTTP 503 `owner-context-unavailable` fence remains in force until Gate D**
(fence blobs at IRR `main`: `cb8db45d668d28cee7e0a52721001d579a872733`,
`51704c12a467cd2f718a030b5036bc55c9afa73f`); **all four Gate V PA waivers remain accepted and
un-reopened** — V-1 ACL/SDDL capture, V-4 pipe collision/re-bind, second-account access,
remote-machine access (**waivers, not technical proof**); the effective **IRR DP-1 amendment** on IRR
`main` `10584439f33dfa9192955c3f74879f20ccaf111e` (blob `c71661a1…`) remains in force.

---

## 8. PROHIBITIONS — ABSENT SEPARATE AUTHORITY

The following are **prohibited** and are **not** authorized by any disposition of matters A/B/C:

1. endpoint/resolver implementation **outside** the §3.1 scope;
2. **route admission** (Gate D) — incl. any change to the 503 fence;
3. any **production eligibility**, certification, deployment, or "ready" claim;
4. **durable portfolio writes or successful-save claims** (Gate E);
5. **promotion, merge, cherry-pick, re-pin, or integration/admission** of the unadmitted G24 lineage
   or of the derivative ref;
6. **merging PR #8** (or IRR PR #117/#114);
7. **changes to the designated basis commit** `2ded0e98…` (no rewrite, amend, force-push, or
   substitution);
8. **Gate C** execution or any claim arising from it; **P-6**; **P-8**;
9. creating, moving, or deleting **any ref other than** the single ref named in matter **B**;
10. modifying the Gate A store or repeating Gate A provisioning; modifying IRR from IPD.

---

## 9. DECISIONS THE AUTHORITY MUST EXPLICITLY ACCEPT OR REJECT

Each item is to be dispositioned **individually** as `ACCEPT` / `ACCEPT WITH CHANGES` / `REJECT` /
`DEFER`, in the Authority's own words:

| # | Decision | Disposition |
|---|---|---|
| **D-1** | **Baseline designation** — designate the published derivative commit `2ded0e981407b38c73bdea164153f53856aa7217` (parent `6828155…`, tree `9069045d…`) as the Gate B implementation baseline | `PENDING AUTHORITY REVIEW` |
| **D-2** | **Ref creation** — authorize creating **one** new ref `refs/heads/gate-b/local-principal-ipc-implementation` at exactly that commit object, non-forced, with **no other ref** created/moved/deleted and **no PR** opened from it | `PENDING AUTHORITY REVIEW` |
| **D-3** | **Form of D-1/D-2** — render them as **one combined act** containing the clarification's §3 items 1–7, **or** as a **separate prior baseline-designation act** (recommended), **or** as an element of the Gate B act (D-4) | `PENDING AUTHORITY REVIEW` |
| **D-4** | **Gate B implementation authority** — authorize the scoped implementation of §3.1 on that basis, under the §4 mechanism and the §5 C1–C12 obligations, conditional on the paired IRR act being rendered | `PENDING AUTHORITY REVIEW` |
| **D-5** | **Preservations** — confirm DP-2 2F, C11, H-18, the 503 fence, the DP-1 amendment, and all four Gate V waivers remain in force and un-reopened (§7) | `PENDING AUTHORITY REVIEW` |
| **D-6** | **Gate C boundary** — confirm Q1–Q11 (incl. **mandatory C5.1/Q9**) remain deferred and unclaimed, and that matter C's disposition grants no qualification result (§6) | `PENDING AUTHORITY REVIEW` |
| **D-7** | **Prohibitions** — confirm the §8 prohibitions stand, and that Gate D/E, P-6, P-8, and PR #8's merge each require separate acts | `PENDING AUTHORITY REVIEW` |
| **D-8** | **Paired IRR act** — acknowledge that matter C is conditional on rendering the paired IRR act, and state how/when its publication is to be achieved (a credential authorized for `ramkivs/iips-review-recovered` is required) | `PENDING AUTHORITY REVIEW` |

**Optional narrowing available to the Authority:** accept D-1/D-2 (basis only) and **DEFER** D-4 —
implementation then remains blocked while the baseline exists; or reject D-1/D-2 and direct that a
fresh `main`-based basis be authored, which would require **re-authoring the persistence and identity
layers** and would contradict the lineage's own *adopt, do not re-implement* convention.

**Rendering mechanics:** the decision is rendered by the Program Authority and recorded by the
Recording Agent as a **subsequent additive artifact** in this workstream; it must state the
Authority's capacity, the repository/ref, the exact disposition per item, and the date. **This record
fabricates no approver, signature, or approval, and none may be inferred from it.**

---

## 10. EXACT PROPOSED DECISION TEXT (for the Authority's convenience — optional)

> **IPD Gate B — implementation authority (combined form).** I, Ramki, as Program Authority and IPD
> security-contract authority, decide: **(D-1) DESIGNATE** as the Gate B implementation baseline the
> published derivative commit `2ded0e981407b38c73bdea164153f53856aa7217` (parent
> `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4`, tree `9069045d3daf22156020188696fc2f9c2f32bf27`);
> **(D-2) AUTHORIZE** creation of exactly one new ref
> `refs/heads/gate-b/local-principal-ipc-implementation` at that exact commit object, non-forced,
> with no other ref created, moved or deleted, and no pull request opened from it; **(D-4) AUTHORIZE
> Gate B implementation** within the exact permitted scope of the decision record §3.1, on that
> basis, under the IPC mechanism of §4 and the C1–C12 obligations of §5, conditional on the paired
> IRR act `IIPS-V3-G2-IRR-GATE-B-IMPLEMENTATION-AUTHORITY-2026-10-16-01` being rendered;
> **(D-5) CONFIRM** DP-2 Option 2F, C11, H-18, the IRR 503 fence, the DP-1 amendment and all four
> Gate V waivers remain in force and un-reopened; **(D-6) CONFIRM** Gate C (Q1–Q11 including the
> mandatory C5.1/Q9 zero-bytes probe) remains deferred and no qualification result is claimed;
> **(D-7) CONFIRM** the §8 prohibitions stand and that Gates D/E, P-6, P-8 and the merging of PR #8
> each require separate acts; **(D-8) direct** the publication of the paired IRR act. This act does
> **not** promote, merge, cherry-pick, re-pin, or admit the off-main G24 lineage; does **not** move
> any existing ref or `main`; does **not** change the designated basis commit; does **not** authorize
> any production or successful-write claim. **Disposition per item:** `ACCEPT` / `ACCEPT WITH
> CHANGES` / `REJECT` / `DEFER`.

---

## 11. VERIFIED STATE AT PREPARATION (live remote, read-only)

| Item | Verified value |
|---|---|
| IPD `main` | `70b24f029842a7e9b7f615e4d9df7376fd4ff817` |
| PR #8 | **OPEN, unmerged** (`mergedAt` null), base `main`, head `3f9eeac35cedcde989857e01ccefe5579c4c4729`, `MERGEABLE/CLEAN`, 22 files — the only open PR |
| Gate B request / clarification | blobs `8f290368…` (21,782 B) / `320ddf1e…` (10,634 B) at that head |
| Derivative ref | `gate-a/local-principal-enablement-2026-10-16` @ `2ded0e98…` (parent `6828155…`, tree `9069045d…`) |
| `gate-b/*` refs | **0** (none exists) |
| Ref inventory | 35 heads / 4 tags / 9 pull refs |
| IRR `main` / DP-1 amendment | `10584439f33dfa9192955c3f74879f20ccaf111e` / blob `c71661a1ee445b2348cedfedae4aef6449029ebb`, 17,128 B |
| Gate A store | sha256 `7794e28144f29cf8235d5537d076408867636e03e77de996c303676823ab99e3` — **unchanged, not opened** |

---

## 12. ATTESTATION

| Check | Result |
|---|---|
| Authority rendered by this record | **NONE** — `PENDING AUTHORITY REVIEW`; no approver, signature or approval fabricated or inferred |
| Refs created / moved / deleted | **NONE** (`gate-b/*` = 0) |
| Implementation authored or committed | **NONE** |
| Application behavior changed | **NONE** |
| Gate A store modified or reprovisioned | **NO** |
| IRR repository touched | **NO** (this artifact is IPD-side only; `L-IPC-1` C1–C12, the DP-1 amendment and the 503 fence are preserved by reference) |
| PR #8 / IRR PRs merged | **NO** |
| Gates C/D/E advanced; P-6/P-8 granted | **NO** |
| New artifacts | **exactly one** — this decision record |

---

*End of decision record `IIPS-V3-G2-IPD-GATE-B-IMPLEMENTATION-AUTHORITY-DECISION-RECORD-2026-10-16-01`
— **⛔ PENDING AUTHORITY REVIEW · GATE B NOT GRANTED · IMPLEMENTATION BLOCKED · NON_PRODUCTION**.*
