# IIPS v3.0 — G-2 — **IPD GATE B IMPLEMENTATION-AUTHORITY ACT — PREPARED FOR DECISION**

> ## STATUS: **PREPARED — NOT AUTHORIZED — NOT GRANTED — NO IMPLEMENTATION PERFORMED**
> This is a **request for one rendered decision**. It grants nothing, opens nothing, changes no
> source, ref, store, or route, and **does not permit Gate B implementation**. Gate B remains
> **NOT GRANTED** until the Program Authority renders it (and the paired IRR act is rendered in
> `ramkivs/iips-review-recovered`).

| Field | Value |
|---|---|
| **Act identifier** | `IIPS-V3-G2-IPD-GATE-B-IMPLEMENTATION-AUTHORITY-2026-10-16-01` |
| **Artifact type** | **Prepared implementation-authority act** (request for decision — not a decision) |
| **Repository / branch (this record)** | `ramkivs/iips-production-market-data` / `arena/21c63aef-iips-production-market-data` (existing **PR #8** workstream; no competing PR) |
| **Authority capacity required to render** | **RAMKI — Program Authority, acting as the IPD security-contract authority** for `ramkivs/iips-production-market-data` |
| **Paired act (required, separately owned)** | `IIPS-V3-G2-IRR-GATE-B-IMPLEMENTATION-AUTHORITY-2026-10-16-01` in `ramkivs/iips-review-recovered` — the same human may act in both capacities; each act states its own capacity and ref |
| **Governing acts** | accepted `L-IPC-1` rev 2, C1–C12 — blob `cab04b6f94618c9afad1440882ebf63437fdf6f8` (path `evidence/np04/IIPS_v3.0_G2_IPD_LOCAL_PRINCIPAL_OS_IPC_SECURITY_CONTRACT_PROPOSAL_2026-10-16.md` @ commit `ccba11e313e84f85c01125ae56ebf7a16eb6952a`); acceptance decision blob `f7086304…`; Gate A rendered decision blob `08df3b9e…`; DG-1 reconciliation blob `b1353d5b…` |
| **Gate A state carried forward** | `GATE A — PROVISIONED / VALIDATED` (local, offline, one-time); reconciliation: **GATE A RECONCILED**, Gate B **READY FOR AUTHORIZATION** |
| **Production status** | NON_PRODUCTION — one user, one personal laptop, H-18 scope |

---

## 1. THE SINGLE DECISION REQUESTED

> **May Gate B implementation begin in IPD, on the basis and within the exact scope recorded below?**

Gate B is the **implementation-authority** gate in the accepted order
(`1 DP-1 amendment → 2 Gate A → 3 Gate B → 4 Gate C → 5 D+E`). The DP-1 amendment is effective on
authoritative IRR `main`; Gate A is executed, validated, reconciled, and its evidence published. The
next act in that order is **this one**. Its content is fixed by the governing records — *"the
endpoint, its resolver wiring, the C5/C7 rules, canonical identity (§7.3), and the exact IPD+IRR
files/tests"*, and it **"must state whether an IPD-`main` implementation basis exists or must be
created"** (request §3.1 Gate B row; proposal §14 row B) — **not invented here**.

**This act authorizes implementation only.** It does not qualify, admit, write, or deploy anything,
and it does not authorize Gate C, D, or E (§10, §11).

---

## 2. VERIFIED BASIS AT PREPARATION (live remote, read-only)

| # | Item | Verified value |
|---|---|---|
| 1 | Accepted contract `L-IPC-1` rev 2 (C1–C12) | blob `cab04b6f94618c9afad1440882ebf63437fdf6f8` at commit `ccba11e313e84f85c01125ae56ebf7a16eb6952a`; current file blob `d4aaf4ca…` carries the dated acceptance notes |
| 2 | Acceptance decision | blob `f7086304…` — `ACCEPT WITH CHANGES`, one user / one laptop / non-production; grants no implementation authority |
| 3 | DP-1 prerequisite | IRR `main` `10584439…`, amendment effective there (`c71661a1…`, "AMENDED FOR ONE DEPLOYMENT — CONTRACT POSITION ONLY") |
| 4 | Gate A | executed on the exact designated object `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4`; derivative `2ded0e981407b38c73bdea164153f53856aa7217` published at `refs/heads/gate-a/local-principal-enablement-2026-10-16` |
| 5 | IPD `main` | `70b24f029842a7e9b7f615e4d9df7376fd4ff817` — **`src/persistence` 0 files · `src/app_identity` 0 files · `src/server` 0 files · `src/auth` 0 files · `src/gate_a` 0 files** |
| 6 | Rendered Gate A decision limits | *"does not … promote, merge, cherry-pick, re-pin, or admit any G24 lineage ref, or move any ref at all"* |
| 7 | Reconciliation | blob `b1353d5b…` @ PR #8 head `5f12e3fd…` — Gate B **READY FOR AUTHORIZATION** |

---

## 3. IMPLEMENTATION BASIS (resolved explicitly — and the separate decision it needs)

**Finding.** The layers Gate B must extend (`src/persistence/**`, `src/app_identity/**`,
`src/server/**`, `src/auth/**`) are **absent from `main`** (§2 item 5) and exist only on the
off-main G24 lineage and on the published Gate A derivative. The off-main lineage **must not be
promoted, merged, cherry-picked, re-pinned, or admitted**, and the derivative ref is a
**publication**, not an implementation basis or an admission.

**Proposed basis (the PA may amend or reject):**

| | Proposal |
|---|---|
| **Basis ref to be created** | `refs/heads/gate-b/local-principal-ipc-implementation` |
| **Starting commit** | **`2ded0e981407b38c73bdea164153f53856aa7217`** — the published derivative commit (accepted basis object + accepted A-2/A-3). Implementation commits descend from it |
| **Effect on existing refs** | **None.** `main`, `arena/01a0f308-…`, `arena/01a0e6d9-…`, `arena/01a0f839-…`, the NP-04 pin, the Gate A derivative ref, and the PR #8 branch are **not moved or modified** |
| **What this is not** | not a promotion, merge, cherry-pick, re-pin, or admission; **not** a substitution for the designated Gate A execution basis `6828155…`; **not** an admission of the G24 lineage; **not** an effective-on-`main` capability |

**The separate authority decision this requires (flagged, not performed):** creating that ref —
i.e. **authorizing a new implementation baseline descended from the unadmitted off-main lineage** —
is a distinct authority act. It may be rendered **either** as an explicit element of this Gate B act
**or** as a separate, prior "Gate B baseline designation" act; the Program Authority chooses. **This
request performs neither.** If the PA declines a new baseline, the alternative is a fresh
implementation basis authored from `main`, which would require **re-authoring the persistence and
identity layers** — an outcome the lineage's own convention (`adopt, do not re-implement`) exists to
prevent — and would need its own explicit act.

**No other IPD basis exists.** The NP-04 pin (`np04-governed-persistence-windows`, 9 `src/persistence`
files, 0 `src/app_identity` files) is materially different code and is **not** equivalent to the
accepted lineage; it is not proposed.

---

## 4. PERMITTED SCOPE — EXACT FILES, MODULES, AND CHANGES (proposed; the PA may narrow)

**May be created (new files only; names are proposals):**

| Path | Purpose |
|---|---|
| `src/ipc/endpoint.ts` | same-host endpoint create/bind/close — Windows named pipe, POSIX UNIX socket; POSIX directory/socket modes set and verified; stale-endpoint cleanup |
| `src/ipc/framing.ts` | strict request/response framing; size cap; explicit protocol version; **no greeting/banner** |
| `src/ipc/server.ts` | connection lifecycle; C5.1 no-bytes-before-a-valid-request; C5.4 caps; C6 fail-closed errors; **C7 refusal enforcement** |
| `src/ipc/entrypoint.ts` | operator-run startup: config validate → store connect → migration verify → **bind** (C2/C5.3); close on shutdown |
| `src/ipc/errors.ts`, `src/ipc/index.ts` | error taxonomy (unauthorized ≡ missing) and barrel |
| `src/user_portfolio/operations.ts` | owner-scoped portfolio **read/analytics** operations over the existing store and authorization triple — resolved **from the binding**, never the payload |
| `src/user_portfolio/canonical_identity.ts` | **C12** resolution/refusal using the existing G24 mapping capability; zero/conflicting ⇒ refuse **before** serialization or persistence |
| `src/user_portfolio/errors.ts`, `src/user_portfolio/index.ts` | refusal vocabulary + barrel |
| `tests/gate_b_ipc_endpoint.test.ts`, `tests/gate_b_ipc_refusals.test.ts`, `tests/gate_b_user_portfolio_operations.test.ts`, `tests/gate_b_canonical_identity.test.ts`, `tests/gate_b_support.ts` | the Gate B test set (§11) |

**Must remain byte-unchanged (read-only reuse):** `src/persistence/**` (including migrations `001`,
`002`, `003` and the registry), `src/app_identity/**` (including `local_principal.ts`), `src/server/**`
(the existing HTTP surface), `src/auth/**`, `src/gate_a/**`, all `tests/g24_*` expectations, and the
three migration blobs `48fcf4d9…` / `dfe9f027…` / `9ba884ac…`.

**Prohibited within Gate B:** any schema or migration change; any change to the Gate A store; any new
runtime dependency or lockfile change; any route, UI, or consumer-admission change; any write-policy
or successful-write implementation; any change to `package.json` scripts used by qualification; any
production deployment artifact.

---

## 5. IPC MECHANISM AND TRUST BOUNDARY (as accepted; not re-opened)

Two ordinary local processes on one laptop — the browser-facing IRR process and the IPD portfolio
process — over a **same-host IPC endpoint** owned by IPD (Windows named pipe on the deployment host;
UNIX domain socket for dev/CI). The browser carries **no** authority and cannot reach the endpoint.
**No peer identity is claimed or available**: the contract's guarantee is limited to *"requests
arriving on this endpoint act as the single provisioned principal"*, plus C5. The same-user exposure
(any process running as the operator, including malware) is **disclosed, not mitigated**, and a
same-account process is **outside** the protection boundary. No TCP port, HTTP route, URL, mTLS,
OIDC issuer, token exchange, forwarded principal, service credential, or browser-supplied identity
is part of this path.

---

## 6. `L-IPC-1` C1–C12 — OBLIGATIONS APPLICABLE TO THIS IMPLEMENTATION

| Clause | What Gate B must implement here |
|---|---|
| **C1** One privileged surface | owner-scoped operations reachable **only** via the new IPC endpoint; no TCP/HTTP/URL surface serves them |
| **C2** Endpoint owned by IPD | endpoint created **only** after config validation, store connection, and migration verification succeed (`validate → connect → migrate → verify → bind`) |
| **C3** One principal, no wire identity | exactly one provisioned binding; identity never taken from the wire |
| **C4** Two ordinary processes, no service, no elevation | no Windows service, no separate privileged account, no admin requirement |
| **C5.1–C5.5** Compensating design rules | (1) **no bytes before a valid, authorized request**; (2) authorize every request from the binding, never the payload; (3) bind once at startup and fail closed if it cannot be bound (including name-already-taken); (4) cap concurrent connections and total request size; (5) close on shutdown and refuse when the binding is absent, malformed, or not `ACTIVE` |
| **C6** Fail closed, uniformly | unauthorized ≡ missing; **no owner disclosure**; no partial effect |
| **C7** Refusal of caller-supplied authority | **IPD re-enforces the same refusals at its own boundary** — principal, user id, subject, credential material, owner claim, tenant/membership claim, caller-selected portfolio scope, and the enumerated identity keys (`companyId`, `runtimeCompanyId`, `identityStatus`, `resolutionDisposition`) |
| **C8** Loopback-only posture | the browser-facing surface stays loopback-only; no wildcard CORS on owner-scoped routes; no LAN/hosted-preview/reverse-proxy/shared-host posture |
| **C9** Cross-site hardening (not authentication) | first-party signal + `Origin`/`Sec-Fetch-Site` consistency for owner-scoped state changes; **never recorded as authentication** |
| **C10** Provisioned, opaque, one-to-one binding | the Gate A binding is consumed **read-only**; no equivalence to any other identity domain is created or implied |
| **C11** No parallel store | the G24 durable store remains the **only** portfolio store; **no second store, cache-of-record, or side file is created** |
| **C12** Canonical identity | see §7 |

---

## 7. C12 — CANONICAL IDENTITY TREATMENT (explicit)

1. **Refuse at the IPC boundary**: any request carrying a caller-supplied `companyId`,
   `runtimeCompanyId`, `identityStatus`, `resolutionDisposition`, symbol/ISIN/exchange-shaped
   identity claim, or any other caller-supplied identity/scope value is **refused, not ignored**.
2. **Resolve or refuse IPD-side, before persistence**: canonical resolution is performed (or
   verified) IPD-side against the authorized provenance; **exactly one** match is admissible; zero
   (`UNMAPPED_IDENTIFIER`) or conflicting (`AMBIGUOUS_COLLISION`) ⇒ **refused before
   serialization, port call, or persistence**, with quarantine evidence.
3. **No bypass**: neither `NON_PRODUCTION_OPERATOR_BYPASS` nor a false canonical-provenance
   declaration may be emitted on this path; the existing non-production single-operator bypass is
   **not** extended, ported, or admitted here.
4. **The verified off-main gap must be closed, not inherited**: `validateHolding()`'s defaults
   (`companyId` `''`, `identityStatus` `'RESOLVED'`, `resolutionDisposition` `'CANONICAL_P04'`) and
   the Save-Guard-2 bypass branch **must not** be reused as-is; **reusing the off-main guard
   unchanged would violate C12**.
5. **No successful write is authorized by this act** — the save path is Gate E's; until then the
   implementation must **refuse** writes with the recorded vocabulary.

---

## 8. REFUSAL, FAIL-CLOSED, AND PROHIBITED BYPASSES

Every refusal is explicit, uniform, and discloses nothing (C6). Required behaviors: no bytes before
a valid authorized request (C5.1); no owner/portfolio existence disclosure; no fallback to TCP or
any network surface; no retry loop after a failed bind; no "first caller wins"; refusal when the
binding is missing, malformed, or not `ACTIVE`; refusal on any caller-supplied authority (C7);
refusal of unresolved/ambiguous canonical identity (C12/DP-2 2F); refusal of any write pending
Gate E. **Prohibited:** operator-bypass branches; identity invention to make an operation succeed;
silent degradation to a less protected transport; any second store.

---

## 9. CONTROLS PRESERVED BY THIS ACT (unchanged, in force)

**DP-2 Option 2F** — unresolved/ambiguous holdings refused for persistence, before serialization,
port call, or persistence; **C11** — single portfolio store; **H-18** — one user, one personal
laptop, non-production, no multi-user/enterprise scope; **the IRR HTTP 503
`owner-context-unavailable` fence remains in force until Gate D** (this act does not touch IRR);
**all four Gate V PA waivers remain accepted and are not reopened** (V-1 ACL/SDDL, V-4 pipe
collision/re-bind, second-account access, remote-machine access — waivers, not technical proof).

---

## 10. EXPLICIT EXCLUSIONS — NOT AUTHORIZED BY THIS ACT

Gate C qualification; Gate D route/consumer admission; Gate E write policy / canonical-identity
*resolution source designation* beyond the C12 refusal contract / successful writes; **P-6** and
**P-8**; any production, certification, deployment, or “ready” claim; removing or relaxing the 503
fence, DP-2 2F, C11, or H-18; promoting, merging, cherry-picking, re-pinning, or admitting the G24
lineage; moving any authoritative ref; modifying the Gate A store; re-running Gate A; **implementing
any route, UI, resolver path, or write path that is admitted to a caller**; server/desktop
installation; second store or second principal; browser- or remote-supplied identity of any kind.

---

## 11. REQUIRED TESTS AND EVIDENCE — GATE B **vs** GATE C (kept strictly separate)

**Gate B (implementation) requires:** the §4 test files passing on the designated implementation
basis, covering — endpoint bind/close and single-bind fail-closed; **no bytes before a valid
request**; per-clause C5 behaviors and caps; C6 indistinguishable refusals; the full C7 refusal
matrix; C12 refusal of caller-supplied identity and of unresolved/ambiguous resolution; DP-2 2F
refusal; refusal of writes pending Gate E; C11 single-store inventory; and a published
implementation diff + commit identities. **Gate B evidence is not qualification evidence.**

**Gate C (qualification) — deferred, and nothing here may claim it:** the §10 / Q1–Q11 items on the
realized endpoint, including the §6 V-E items: **C5.1/Q9 zero-bytes probe (mandatory, and NOT
claimed as passed)**, C5.3/C6 startup fail-closed, refusal matrix on the realized endpoint,
owner/tenant isolation, revision/lifecycle, durability across restart, exactly-one-store, drift
check — plus Gate V on the deployment host (where a V-E item would repeat one of the four waived
measurements, **the waiver governs**).

---

## 12. STOP CONDITIONS, ROLLBACK, AND FAIL-CLOSED EXPECTATIONS

**Stop before any mutation if:** the basis ref exists with a different tip; the starting commit,
path blobs, or the accepted-contract blob differ from §2; the store cannot be opened or migrations
cannot be verified; the paired IRR act is not rendered (the two acts are interdependent);
or any required behavior cannot be implemented within §4 (scope expansion ⇒ stop and report, never
improvise). **Rollback:** revert the implementation commits on the Gate B basis ref; the Gate A
store and all authoritative refs are untouched by design, so no data rollback exists — Gate B writes
no data. **Fail-closed:** an unbound or unhealthy endpoint must refuse service; a validation or
migration failure must prevent the endpoint from being created at all.

---

## 13. WHAT THIS REQUEST DOES NOT DO

It **renders no authority**; performs **no implementation**; creates **no ref, file, or commit in
any source tree**; **moves no authoritative ref**; **does not touch** `main`, the accepted basis, the
designated target, the governance ref, the NP-04 pin, the Gate A derivative ref, or PR #8's
non-documentary content; **does not modify the Gate A store** or repeat provisioning; **does not
modify IRR**; **does not merge** PR #8 or any IRR PR; **does not open a competing PR**; **grants no**
Gate C/D/E, P-6, P-8, route admission, write policy, or production status.

---

## 14. EXACT PROPOSED DECISION TEXT (for the Program Authority to render)

> **IPD Gate B — implementation authority.** On the reconciliation state (`GATE A — PROVISIONED /
> VALIDATED`; DP-1 effective on authoritative IRR `main`), and subject to the paired IRR act
> `IIPS-V3-G2-IRR-GATE-B-IMPLEMENTATION-AUTHORITY-2026-10-16-01` being rendered, I authorize Gate B
> implementation in `ramkivs/iips-production-market-data` **within the exact scope of §4** and under
> the obligations of §5–§9 of this act: the IPC endpoint, its startup/bind discipline, the C5 rules,
> the C7 refusals, the C12 resolution-or-refusal contract, the DP-2 2F / C11 / H-18 preservations,
> and the Gate B test set — on the implementation basis **[the PA designates: either (i)
> `refs/heads/gate-b/local-principal-ipc-implementation` created at
> `2ded0e981407b38c73bdea164153f53856aa7217`, or (ii) another basis the PA names]**; with the
> baseline-creation decision rendered **[as an element of this act | as a separate prior act]**.
> **No** promotion, merge, cherry-pick, re-pin, or admission of the off-main G24 lineage; **no** move
> of `main` or any existing ref; **no** route admission, write policy, successful write, or
> production claim; **no** Gate C/D/E; **no** P-6/P-8; the 503 fence, DP-2 2F, C11, H-18, and all
> four Gate V waivers remain in force and un-reopened. **Disposition:** `APPROVE` / `APPROVE WITH
> CHANGES` / `REJECT` / `DEFER`.

**Required confirmations if not `REJECT`/`DEFER`:** (i) the implementation basis (and who creates the
ref); (ii) the exact permitted file set (§4) and any narrowing; (iii) that Gate C remains separate
and C5.1/Q9 is not claimed; (iv) that the paired IRR act is rendered.

---

## 15. PUBLICATION OF THIS REQUEST

Published additively in the **existing authorized PR #8 workstream** — one added governance
artifact; **no competing PR**, no implementation file, no source change, no schema or database
change, no ref created or moved.

**Paired IRR act — publication constraint (recorded 2026-10-16, factually, at publication time):**
the paired IRR act `IIPS-V3-G2-IRR-GATE-B-IMPLEMENTATION-AUTHORITY-2026-10-16-01` was **prepared**
in full, but its publication in `ramkivs/iips-review-recovered` **could not be performed by the
recording agent**: every write attempt was **rejected by GitHub with HTTP 403** (`Permission to
ramkivs/iips-review-recovered.git denied to ramkivs`) — on the existing **PR #117** branch and on a
brand-new branch name alike, including on a non-mutating dry run. The IRR repository is **public**,
the target branch is **not protected**, and it has **no rulesets**, so this is a **credential-scope
constraint of the recording agent's token — not IRR repository policy, and not an authority
requirement**. **Nothing in IRR was modified** (the rejection precedes any write; IRR `main`,
PR #117 and both fence blobs re-verified unchanged). The IRR draft is held for handoff —
sha256 `42e9af2ec7823a727d5e4aed8f62593e14e2c8ac7a603fa298e1b32001a2721e`, 268 lines, 19,560 B —
with the prepared, unpushed commit `f9a4e0322a4ac9b6b70425d9316f2951e4f8916f` (parent
`322a5095af048f349b7da8466cdf4f28d6ce3440`) preserved in a git bundle; a credential authorized for
`ramkivs/iips-review-recovered` is required to publish it additively to PR #117.
**Gate B must not be rendered until both paired acts are published and available to the Authority.**

*End of prepared act `IIPS-V3-G2-IPD-GATE-B-IMPLEMENTATION-AUTHORITY-2026-10-16-01` —
**PREPARED · NOT AUTHORIZED · GATE B NOT GRANTED · NON_PRODUCTION**.*
