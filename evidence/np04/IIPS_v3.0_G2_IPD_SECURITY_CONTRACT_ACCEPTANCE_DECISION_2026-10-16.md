# IIPS v3.0 — G-2 — IPD SECURITY-CONTRACT ACCEPTANCE DECISION RECORD

| Field | Value |
|---|---|
| **Record ID** | `IIPS-V3-G2-IPD-SECURITY-CONTRACT-ACCEPTANCE-DECISION-2026-10-16-01` |
| **Record type** | **IPD-side security-contract decision record** — the durable act §13 of the proposal requires. It accepts the proposed contract **with named changes**, and does so **only** within the acceptance scope stated in §3. It grants **no** provisioning, implementation, qualification, successful-write, route or admission authority (§7). |
| **Decision** | **ACCEPT WITH CHANGES** — the Program Authority accepts the single-user, single-personal-laptop, non-production, IPD-owned same-host IPC security-contract architecture, subject to the five change groups incorporated in §4 |
| **Decision authority** | **Ramki — Program Authority, acting as the IPD security-contract authority for `ramkivs/iips-production-market-data`** |
| **Decision date** | **2026-10-16** (Asia/Calcutta) |
| **Decision channel** | Program Authority decision relayed in the operating session; recorded durably here under the receiving agent's recording function |
| **Repository / ref of record** | `ramkivs/iips-production-market-data` — branch `arena/21c63aef-iips-production-market-data`, **PR #8** (existing workstream; **not merged**) |
| **Subject of the decision (exact)** | `IIPS-V3-G2-IPD-LOCAL-PRINCIPAL-OS-IPC-SECURITY-CONTRACT-PROPOSAL-2026-10-16-01` — **revision 2**, clauses **C1–C12**; file `evidence/np04/IIPS_v3.0_G2_IPD_LOCAL_PRINCIPAL_OS_IPC_SECURITY_CONTRACT_PROPOSAL_2026-10-16.md`; **blob accepted: `cab04b6f94618c9afad1440882ebf63437fdf6f8`** |
| **Baselines verified before this act** | IPD PR #8 head `ccba11e313e84f85c01125ae56ebf7a16eb6952a` (`OPEN`, `MERGEABLE`/`CLEAN`, 11 files, +2886/−62, 0 comments, 0 reviews); branch ref remote == local; worktree clean; the accepted text was retrieved from the remote artifact and confirmed byte-identical to the worktree (`cmp`) |
| **Runtime/deployment scope** | One operator, one personal laptop, one OS account, non-production. Production remains out of scope |

---

## 1. Decision (recorded)

**ACCEPT WITH CHANGES.** The Program Authority accepts the proposed contract `L-IPC-1` (revision 2, clauses C1–C12) for **one user, one personal laptop, non-production**, subject to the changes in §4 being incorporated into this record and into the proposal's applicable dated notes. The decision text as rendered by the authority:

> I, Ramki, as Program Authority and IPD security-contract authority, decide on
> `IIPS-V3-G2-IPD-LOCAL-PRINCIPAL-OS-IPC-SECURITY-CONTRACT-PROPOSAL-2026-10-16-01`
> Revision 2, clauses C1–C12.
>
> I ACCEPT the proposed single-user, single-personal-laptop, non-production, IPD-owned same-host IPC
> security-contract architecture, SUBJECT TO the following changes being incorporated into the durable
> IPD-side decision record and the proposal's applicable dated notes.
>
> **1. Gate V reconciliation.** Record the V-P platform phase as CLOSED under the existing PA decision.
> Preserve all four decisions exactly as recorded: V-1 ACL/SDDL capture — NOT REQUIRED — PA-WAIVED;
> V-4 pipe collision and re-bind testing — NOT REQUIRED — PA-WAIVED; second-account access test —
> NOT REQUIRED — PA-WAIVED; remote-machine access test — NOT REQUIRED — PA-WAIVED. These are waivers,
> not technical proof. The effective ACL/SDDL, cross-account isolation, remote isolation and lifecycle
> fail-closed behaviour remain technically unverified. The future V-E production-endpoint qualification
> requirements remain separate and applicable where relevant.
>
> **2. G24 identity-acquisition clause.** Amend only the G24 identity-acquisition clause for this one
> deployment. The credential position becomes: "Accepted on the IPD-owned, single-principal, same-host
> IPC endpoint." The identity must come from the provisioned endpoint binding, never from a
> caller-supplied wire field. Accept the two narrow additions: A-2 (local principal binding record);
> A-3 (local audit line). The `applicationUserId` model, external-identity mapping, requirement for
> exactly one ACTIVE tenant-membership row, authorization triple, revision checks, canonical-identity
> validation and DP-2 Option 2F remain unchanged.
>
> **3. Required security qualifications.** Record that the application does not enforce the endpoint's
> OS permissions on Windows and that another process running as the operator's own account, including
> malware, is outside the protection boundary. Preserve C5.1/Q9: the endpoint must emit no bytes before
> a valid, authorized request. This remains a mandatory qualification requirement. Do not claim that
> the current disposable probe proves the security of a future production endpoint.
>
> **4. Record coherence.** Reconcile the proposal's §15 U-1 statement with the completed V-P
> disposition. Clarify the scope of §9 failure dispositions so they do not reopen the four PA-waived
> V-P measurements. Keep future V-E requirements distinct from the existing V-P waivers.
>
> **5. Explicit authority limits.** This decision accepts the contract with the changes above. It
> grants NO authority for: provisioning or tenant administration; endpoint implementation; P-6
> implementation authority; P-8 qualification; route admission; durable integration or portfolio
> writes; successful portfolio-save claims; promotion, merge, cherry-pick or re-pinning of the
> off-main G24 lineage; merging PR #8. The existing IRR HTTP 503 `owner-context-unavailable` fence and
> DP-2 Option 2F remain unchanged. The separate IRR DP-1 amendment is still required and must be
> recorded in IRR under its own explicit authority act.
>
> **6. Publication.** Prepare the durable IPD-side decision record naming the exact proposal and
> revision. Reconcile the proposal's dated notes, validate, publish through the existing PR #8
> workstream, and verify the remote artifact. Do not merge PR #8.

## 2. What this act amends (and what it does not)

**Amended — exactly one clause, for exactly one deployment.** The G24 **identity-acquisition** clause, whose credential position becomes:

> **"Accepted on the IPD-owned, single-principal, same-host IPC endpoint."**

with identity taken **from the provisioned endpoint binding, never from a caller-supplied wire field**. The pre-amendment and post-amendment positions, verbatim from §2.4 of the accepted text:

```text
CURRENT (G24):
  Credential position = a caller-presented, IPD-verified OIDC bearer at the TCP HTTP boundary.
  Identity  = issuer+subject → applicationUserId.   Tenant = ACTIVE membership required.

ACCEPTED (L-IPC-1, ONE deployment, ONE principal):
  Credential position = "Accepted on the IPD-owned, single-principal, same-host IPC endpoint."
  Identity  = the endpoint's provisioned binding; never a wire field.
  Tenant    = ACTIVE membership required — UNCHANGED, exactly one row.
```

**Two narrow additions accepted (A-1 amendment, A-2 and A-3 additions — the amendment scope is exactly these three):**

| Ref | Content | Status |
|---|---|---|
| **A-1** | The single clause above (§2.4) | **ACCEPTED** — one clause, one deployment |
| **A-2** | Additive `local_principal_bindings` record + migration: `(endpoint_id, application_user_id → application_users, tenant_id, state ∈ {ACTIVE, REVOKED}, created_at, updated_at, revoked_at)` | **ACCEPTED** (resolves prior item U-6) |
| **A-3** | Local audit line on binding and membership lifecycle mutations — local only; no cross-system audit destination created or implied | **ACCEPTED** |

**Unchanged and expressly preserved** (per the accepted text §2.4/§6.3): the `applicationUserId` model; the external-identity mapping table and lifecycle; `resolveTenant` and the requirement for **exactly one `ACTIVE` tenant-membership row**; the `(applicationUserId, tenantId, portfolioId)` authorization triple; "unauthorized ≡ missing"; revision/optimistic-concurrency checks; tombstone behaviour; consolidation guards; canonical-identity validation; and **DP-2 Option 2F** (unresolved or ambiguous holdings may be previewed and explained and **must be refused** for persistence — no bypass). Clauses C1–C12 otherwise stand as accepted.

## 3. Acceptance scope

Accepted for **one user, one personal laptop, one OS account, non-production**, as the single-principal same-host IPC contract for the IPD portfolio domain. Acceptance is **not** a statement that the boundary has been demonstrated on the deployment host (§5), **not** an operability claim, and **not** a qualification.

## 4. The five required changes, as incorporated

### 4.1 Change 1 — Gate V reconciliation (V-P closed; four waivers preserved verbatim)

**The V-P platform phase is CLOSED** under the existing Program Authority decision — closed by waiver where unmeasured and satisfied by evidence where measurable (**V-5** version inventory). The four decisions are preserved exactly, as recorded in `IIPS-V3-G2-GATE-V-EVIDENCE-RECONCILIATION-AND-PA-WAIVER-2026-10-16-01` §9:

| # | Measurement | Disposition (exact) |
|---|---|---|
| 1 | **V-1 ACL/SDDL capture** | **NOT REQUIRED — PA-WAIVED.** |
| 2 | **V-4 pipe collision and re-bind testing** | **NOT REQUIRED — PA-WAIVED.** |
| 3 | **Second-account access test** | **NOT REQUIRED — PA-WAIVED.** |
| 4 | **Remote-machine access test** | **NOT REQUIRED — PA-WAIVED.** |

**These are waivers, not technical proof.** The following remain **technically unverified**: the effective ACL/SDDL of any endpoint; cross-account isolation; remote isolation; lifecycle fail-closed behaviour (collision and abrupt-termination/re-bind). F-1…F-9 remain **source-verified platform facts**, not host measurements. The four waived measurements are **not pending**, must not be recorded PASS/FAIL/BLOCKED, and must not be reopened (see §4.4).

**Future V-E production-endpoint qualification requirements remain separate and applicable where relevant** — they were never among the four waived measurements and are listed in §6.

### 4.2 Change 2 — G24 identity-acquisition clause amended (one clause, one deployment)

Amended as recorded verbatim in §2. Identity derives from the provisioned endpoint binding only; **no caller-supplied principal, owner, tenant, or portfolio-scope value may establish identity**. Caller-supplied authority is **refused, not ignored** (C7). A-2 and A-3 accepted as specified.

### 4.3 Change 3 — Required security qualifications (recorded; binding on implementation and qualification)

1. **The application does not enforce the endpoint's OS permissions on Windows.** The endpoint's effective access control is the Windows default named-pipe DACL for a pipe created by the operator's account, plus host configuration. The application cannot narrow it from supported Node/libuv APIs and its only permission knob widens access.
2. **A process running as the operator's own account — including malware — is outside the protection boundary.** So are Administrators and LocalSystem (which can read the store file directly regardless), and any remote party able to authenticate as the operator's account.
3. **C5.1 / Q9 is preserved as a MANDATORY qualification requirement:** the endpoint must emit **no bytes before a valid, authorized request** — no greeting, banner, version, or data. This is load-bearing because a read-only client open is legal on a duplex pipe (F-5) and read-only reachability is now **unmeasured** rather than measured-and-qualified.
4. **No claim is made that the disposable probe proves the security of a future production endpoint.** The probe demonstrated that a disposable node endpoint can start on the host and that a same-account client can connect and send nothing; it did not capture any ACL, did not test isolation, and is not the production endpoint.

### 4.4 Change 4 — Record coherence (reconciled in the proposal's dated notes)

| Item | Reconciliation applied |
|---|---|
| **§15 U-1** | Superseded by a dated note: the V-P portion is dispositioned (V-5 satisfied; V-1–V-4 **NOT REQUIRED — PA-WAIVED**), so U-1 no longer reads as a blanket open item. The **V-E** items it partly described remain open as future-phase requirements and are re-pointed to §6 of this record. |
| **§9 failure disposition** | Scope clarified by a dated note: it may fire **only** on **V-E** (production-endpoint) evidence. Because V-1/V-2 are PA-waived, the disposition **cannot** be used to reopen the four waived V-P measurements; where a V-E item would repeat a waived measurement, the waiver governs unless the Program Authority records narrower scoping for the production endpoint. |
| **V-P vs V-E separation** | Stated in both the proposal note and §6 here: V-P = host/platform phase (closed); V-E = realization-phase requirements (open, future). Neither substitutes for the other; a V-P result closes nothing about the production endpoint. |

### 4.5 Change 5 — Explicit authority limits

Recorded in §7. **No authority is granted by this acceptance act beyond accepting the contract with the changes above.**

## 5. Resulting contract status

| Field | Value (as of this record) |
|---|---|
| Proposed contract `L-IPC-1`, revision 2 (C1–C12) | **ACCEPTED WITH CHANGES — for one user, one personal laptop, non-production** |
| G24 identity-acquisition clause | **AMENDED** for this one deployment (credential position = accepted on the IPD-owned, single-principal, same-host IPC endpoint; identity from the provisioned binding) |
| A-2 binding record / A-3 local audit line | **ACCEPTED** (additions; not yet implemented) |
| DP-2 Option 2F | **UNCHANGED — in force** |
| IRR HTTP `503 owner-context-unavailable` fence | **UNCHANGED — in force** |
| Effective ACL / cross-account isolation / remote isolation / lifecycle fail-closed | **NOT DEMONSTRATED** (waived at V-P; applicable at V-E) |
| Implementation / provisioning / qualification / admission / writes | **NOT AUTHORIZED — NOT EXISTING**; the endpoint has **not** been implemented, provisioned, qualified or admitted |
| Off-main G24 lineage (`6828155e`) | **NOT ADMITTED — not promoted, merged, cherry-picked or re-pinned** |
| PR #8 | **NOT MERGED** |

**Contract acceptance is not implementation authority.** The accepted clauses describe a boundary; they create no runtime, no credential, no endpoint, no store change, no write, and no second store (**C11: the G24 durable store remains the only portfolio store**).

## 6. Future V-E (production-endpoint) requirements — separate from the V-P waivers

Not probe-measurable; they require the realized endpoint and their own authority:

1. **C5.1 / Q9** — probe that a read-only connection receives **zero bytes** (mandatory, §4.3(3)).
2. **C5.3 / C6** — startup fail-closed with no fallback; shutdown behaviour; no owner disclosure (unauthorized ≡ missing).
3. **Q1–Q11 qualification items** that depend on the realized endpoint — claim-refusal matrix, isolation behaviour, revision/lifecycle, durability across restart, exactly one portfolio store, drift check.
4. Where a V-E item would repeat one of the four **PA-waived** measurements, **the waiver governs** unless the Program Authority records narrower scoping for the production endpoint (stated here so it is decided, not assumed).

## 7. Explicit authority limits (as recorded by the authority)

This decision grants **NO** authority for:

- provisioning or tenant administration;
- endpoint implementation;
- **P-6** implementation authority;
- **P-8** qualification;
- route admission;
- durable integration or portfolio writes;
- successful portfolio-save claims;
- promotion, merge, cherry-pick or re-pinning of the off-main G24 lineage;
- merging PR #8.

**The IRR HTTP `503 owner-context-unavailable` fence and DP-2 Option 2F remain unchanged. The separate IRR DP-1 amendment is still required and must be recorded in IRR under its own explicit authority act.**

## 8. Next required authority act and dependency order

| Order | Act | Where | Status |
|---|---|---|---|
| **1 (next)** | **IRR DP-1 amendment act** — amending the DP-1 Option 1A′ identity/credential trust clauses for the durable user-portfolio capability, preserving DP-2 Option 2F, H-18 scope and the 503 fence | IRR `ramkivs/iips-review-recovered`, its own record and ref | **REQUIRED — NOT YET RENDERED.** Not inferred from this IPD act; this IPD record does **not** amend the IRR contract |
| 2 | **Gate A — local provisioning** (one `application_user`, one opaque tenant, exactly one `ACTIVE` membership, the principal binding A-2, revocation, A-3 audit line) | IPD, separate provisioning act | **NOT AUTHORIZED** (tenant administration remains NOT AUTHORIZED) |
| 3 | **Gate B — implementation authority** (exact IPD+IRR files/tests, mechanism, C5 rules, exclusions; IPD-`main` durable basis does not exist and the off-main lineage must not be promoted) | IPD + IRR acts | **NOT GRANTED** |
| 4 | **Gate C — qualification** (§10/Q1–Q11 **including the §6 V-E items**) | Separate qualification authority | **NOT GRANTED** |
| 5 | **Gate D — route/consumer admission** (503 fence stays until then) and **Gate E — write policy / canonical-identity source** | Separate acts | **NOT GRANTED** |

## 9. Publication and verification (this act)

| Item | Value |
|---|---|
| Publication vehicle | IPD **PR #8** (existing workstream; no competing PR, no duplicate proposal) |
| Record file | `evidence/np04/IIPS_v3.0_G2_IPD_SECURITY_CONTRACT_ACCEPTANCE_DECISION_2026-10-16.md` |
| Proposal reconciliation | Dated notes added to the proposal at: header status, **§9** (failure-disposition scope), **§13** (decision rendered), **§14** (no gate opened), **§15** (U-1 superseded). Historical text preserved; nothing rewritten |
| Verification | Branch ref, published blobs and the decision text read back from the remote artifact |
| Merge | **Not performed** — PR #8 remains unmerged |

---

*Recording agent: Arena — recording the Program Authority's decision, incorporating the five required changes, and publishing; no authority is rendered or inferred by the agent. The decision, its date, its channel and its exact wording are as recorded in §1. Contract acceptance is not implementation authority; nothing here provisions, implements, qualifies, admits, writes, or merges anything.*
