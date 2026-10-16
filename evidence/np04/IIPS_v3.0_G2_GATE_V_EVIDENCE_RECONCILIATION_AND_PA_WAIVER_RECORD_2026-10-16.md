# IIPS v3.0 — G-2 — GATE V EVIDENCE RECONCILIATION AND PROGRAM-AUTHORITY WAIVER RECORD

| Field | Value |
|---|---|
| **Record ID** | `IIPS-V3-G2-GATE-V-EVIDENCE-RECONCILIATION-AND-PA-WAIVER-2026-10-16-01` |
| **Record type** | **Decision + evidence reconciliation record.** It records a Program Authority decision and reconciles captured laptop evidence against Gate V. It renders no authority of its own, accepts no security contract, authorizes no implementation, provisioning, write, route or admission, and **does not close Gate V**. |
| **Repository / ref** | `ramkivs/iips-production-market-data` — branch `arena/21c63aef-iips-production-market-data`, **PR #8** (existing authorized workstream; no competing PR) |
| **Verified live state at this record** | PR #8 `OPEN`, head `c51f5000666775fa87477c971501392b4e494d52` (local == remote), base `main@70b24f0`, 10 files, +2645/−62, `MERGEABLE`/`CLEAN`, 0 comments, 0 reviews — prior commit re-verified before this record was written |
| **Evidence provenance** | The laptop evidence in §3 is **Program-Authority-supplied and transcribed** (package `G2-GateV-20261016-191957.zip`); the recording agent has **no access to the laptop's local files** and independently measured none of it. §4's runtime check was performed by the recording agent against the pinned upstream sources and is marked as such. |
| **Status** | **PA WAIVERS RECORDED. GATE V REASSESSED — REMAINS OPEN (V-P partially satisfied). NO CONTRACT ACCEPTANCE. NO IMPLEMENTATION AUTHORITY.** *(As first published. **Superseded in part by §9 — final four-waiver addendum: V-P disposition is now CLOSED; Gate V's V-E phase remains outstanding.**)* |

---

## 1. Verified live state (STEP 1)

| # | Item | Verified value |
|---|---|---|
| 1.1 | IPD PR #8 | `OPEN`; head **`c51f5000`**; base `main@70b24f0`; **10 files, +2645/−62**; `MERGEABLE`/`CLEAN`; **0 comments, 0 reviews**; no status checks (docs + frontend-only branch, no hosted CI gate for IPD documents) |
| 1.2 | Branch ref | `refs/heads/arena/21c63aef-iips-production-market-data` = `c51f5000666775fa87477c971501392b4e494d52` (remote == local; the local clone was re-provisioned mid-session and was restored to this verified head before this record was written) |
| 1.3 | Contract artifact | `evidence/np04/IIPS_v3.0_G2_IPD_LOCAL_PRINCIPAL_OS_IPC_SECURITY_CONTRACT_PROPOSAL_2026-10-16.md` — rev 2, **PROPOSAL ONLY**, decision text in §13, gates in §14, Gate V table + V-P/V-E sequencing in §9 |
| 1.4 | Gate V procedure artifact | `evidence/np04/IIPS_v3.0_G2_GATE_V_WINDOWS_TEST_PROCEDURE_AND_SEQUENCING_2026-10-16.md` — **preparation only, nothing executed, no results** |
| 1.5 | Trust-boundary assessment | `evidence/np04/IIPS_v3.0_G2_LOCAL_IPC_TRUST_BOUNDARY_VERIFICATION_AND_RECOMMENDATION_2026-10-16.md` — Recommendation A; V-1…V-6 defined |
| 1.6 | UI-store-port act + implementation | `np04-g2-portfolio-ui-store-port-2026-10-16-001` (APPROVED as written) and `8c9ef08` — session-only, non-durable; **excludes IPC, provisioning, writes** |
| 1.7 | IRR DP-1 | `docs/integration/IIPS_v3.0_GATE_C_S5A_DP1_OPTION_1A_PRIME_BINDING_CONTRACT_AND_PREREQUISITE_SPECIFICATION_2026-10-13.md` present on IRR `main` (blob `c3a5596a…`, 68,126 bytes): Option 1A′ selected, P-2/P-3 specified-not-stood-up, **P-6 NOT GRANTED**, P-8 plan fixed |
| 1.8 | IRR fail-closed fence | `frontend/server/user-portfolio-transport.ts` → `respondOwnerContextUnavailable` on all six `/api/user-portfolios*` routes; **HTTP 503 `owner-context-unavailable` intact** |
| 1.9 | Provisioning boundary (off-main evidence, not admitted) | `evidence/np04/NP04-GOVERNANCE-AUTHORITY-RECORD.md` @ `6828155e` §5: *"Tenant administration = **NOT AUTHORIZED** … Tenant source of truth = D115-deferred"* — unchanged |
| 1.10 | No endpoint exists | Still true: no IPC server/transport anywhere in `frontend/src` or `src` |

## 2. Program Authority decision recorded (STEP 2)

**Decided:** 2026-10-16 (Asia/Calcutta), by **Ramki / Program Authority**, relayed in the operating session.

| # | Decision | Disposition to record |
|---|---|---|
| **PA-1** | A second-Windows-account access test is **not required** | **Second-account access test: NOT REQUIRED — PA-WAIVED.** |
| **PA-2** | A remote-machine access test is **not required** | **Remote-machine access test: NOT REQUIRED — PA-WAIVED.** |

**Facts the waivers rest on (recorded exactly):** there is **only one Windows user account** available on the laptop; **no second Windows account exists** for these tests; **no separate remote machine** is available. These are **deliberate PA waivers, not failed tests.**

**What the waivers are and are not (recorded to prevent misreading):**

1. They waive the **requirement to perform** those two tests. They do **not** establish that cross-account isolation, remote isolation, or read-only-connection behaviour has been **technically demonstrated**. None of those is demonstrated by any evidence in this record.
2. Neither waived test may be recorded as **PASS, FAIL, or BLOCKED**. They are recorded **only** as `NOT REQUIRED — PA-WAIVED`.
3. No additional authority flows from the waivers (§8).
4. **Supersession, recorded not rewritten:** the package's `gate-v-disposition.txt` states *"Second non-admin account available: y"*. That value was entered **before** the PA's clarification and is **SUPERSEDED** by PA-1's corrected fact (**no second account exists**). The stale value is preserved here as history and must not be propagated into any future record.

## 3. Captured laptop evidence — transcribed (PA-supplied)

**Provenance:** supplied by the Program Authority in `G2-GateV-20261016-191957.zip`; evidence directory on the laptop `C:\Users\USER\G2-GateV-20261016-191957`. The recording agent did not access the laptop and did not verify these files locally; they are recorded as reported.

### 3.1 Package contents
`gate-v-disposition.txt`, `gate-v-pipe-client.js`, `gate-v-pipe-probe.js`, `gate-v-transcript.txt`, `probe-ready.txt`, `probe-server-output.txt`, `probe-stderr.txt`, `probe-stdout.txt`, `same-account-client-test.txt`, `SHA256SUMS.txt`.

### 3.2 Operating environment (as recorded)
| Item | Value |
|---|---|
| OS | Windows 11 **Home Single Language**, build **26200**, 64-bit |
| Account | `desktop-no0nhtp\user`, SID `S-1-5-21-1872737340-673410177-2240931581-1001` |
| Administrators membership | **"Group used for deny only"**; session **not elevated** |
| Node | `C:\Program Files\nodejs\node.exe`, **v24.14.0** |
| AccessChk | **NOT FOUND**; no download or installation attempted |

### 3.3 Disposable probe (non-production)
| Item | Value |
|---|---|
| Pipe path | `\\.\pipe\iips-g2-gatev-f83f1aca7dbd453d94884abfb0840294` |
| Server PID | 19716 |
| Startup metadata | `{"pipePath":"\\\\.\\pipe\\iips-g2-gatev-f83f1aca7dbd453d94884abfb0840294","pid":19716,"node":"v24.14.0","startedUtc":"2026-10-16T13:51:53.087Z"}` |
| Server output | `13:51:53.080Z LISTENING=\\.\pipe\iips-g2-gatev-f83f1aca7dbd453d94884abfb0840294` · `13:52:17.819Z CLIENT_CONNECTED; no application data will be sent` · `13:52:17.832Z CLIENT_CLOSED` |
| Same-account client | `CONNECT_SUCCEEDED` · `{"utc":"2026-10-16T13:52:17.818Z","result":"CONNECTED_NO_DATA_SENT"}` |

### 3.4 Recorded imperfections (preserved; not rewritten)
1. The initial transcript contains **PowerShell parsing errors** from earlier script fragments (an `else` construct). Those failed checks are **not** results; the later repaired commands detected Node and executed the probe.
2. A **packaging failure** occurred because the transcript file remained open during an earlier hash/ZIP attempt; the uploaded ZIP was subsequently inspectable and contains the listed files. The original packaging procedure was **not** error-free.
3. `SHA256SUMS.txt` provides **file-integrity information only**; it is not evidence that any unperformed test passed.
4. The recorded server line shows connection and closure only; it records **no peer-identity field**, so it neither confirms nor contradicts F-9.

### 3.5 What this evidence establishes — and does not
**Establishes (V-P, probe scope only):** a Node named-pipe server was created by this account on this host and started successfully; a client in the **same Windows account** connected successfully; the client sent **no application data**; the server observed the connection and its closure.

**Does not establish** (as recorded in the source package and confirmed against the artifact): the pipe's **effective security descriptor or ACL**; successful ACL inspection (no AccessChk); **read-only connection behaviour**; **cross-account isolation**; **remote-client isolation**; the security behaviour of a **production application endpoint**; **application authorization** behaviour; **durable portfolio-write** behaviour. **The disposable probe is not the production application endpoint.**

## 4. Runtime-deviation reconciliation (V-5 trigger) — recording-agent verification

§9/V-5 states that any deviation from the F-1…F-9 assumptions triggers a re-read of the design. The probe ran on **Node v24.14.0**, whereas the platform facts were verified against **Node v22.22.3**. Re-read performed this pass against pinned upstream sources:

| Check | Result |
|---|---|
| libuv bundled by **Node v24.14.0** (`deps/uv/include/uv/version.h` @ tag `v24.14.0`) | **1.51.0** — **identical** to Node v22.22.3's bundled libuv |
| `CreateNamedPipeW` call sites in Node v24.14.0's vendored `deps/uv/src/win/pipe.c` @ `v24.14.0` | **exactly 1** (line 546), with `PIPE_ACCESS_DUPLEX \| FILE_FLAG_OVERLAPPED \| WRITE_DAC \| (firstInstance ? FILE_FLAG_FIRST_PIPE_INSTANCE : 0)`, `PIPE_TYPE_BYTE \| PIPE_READMODE_BYTE \| PIPE_WAIT`, `PIPE_UNLIMITED_INSTANCES`, and **`lpSecurityAttributes = NULL`** |
| `PIPE_REJECT_REMOTE_CLIENTS` present in that source? | **No** (absent) |
| Consequence | **F-2 and F-4 hold for the probe's actual runtime**, and the reproduction argument stands: the probe's pipe was created by the identical OS call, with the identical flags, from the identical libuv version — the OS-applied DACL and pipe mode are the same by construction. **No substantive re-read of the design is triggered by the version deviation.** Windows build 26200 (Windows 11, 25H2-generation) is recorded under V-5 and introduced no F-contradiction in the captured evidence |

*Method note:* these checks were made by the recording agent via the GitHub contents API against the pinned tags; they are source-level facts, not laptop measurements.

## 5. Gate V — per-requirement reconciliation (STEP 3)

| Req. | Criterion (source) | Disposition | Evidence / reason |
|---|---|---|---|
| **V-1** | Endpoint effective permissions: write only for the operator, Administrators, SYSTEM, CREATOR OWNER; Everyone/anonymous read-only recorded | **NOT TESTED** | The package contains **no ACL/SDDL capture** (§3.5); AccessChk absent and no download attempted. This criterion is **local, single-account and network-free** — it never required a second account, a remote machine, or the production endpoint |
| **V-2** | Remote enumeration/connect + host SMB posture | **NOT REQUIRED — PA-WAIVED** | PA-2 (§2). **Not** PASS, **not** FAIL, **not** BLOCKED. Remote isolation is **not demonstrated** |
| **V-3** | Second, non-administrative local user connect/send | **NOT REQUIRED — PA-WAIVED** | PA-1 (§2). **Not** PASS, **not** FAIL, **not** BLOCKED. Cross-account isolation is **not demonstrated** |
| **V-4** | Collision ⇒ failed start (no fallback); endpoint disappears on shutdown/abrupt termination | **NOT TESTED** | No collision or re-bind attempt appears in the captured evidence (§3.3 shows start → connect → close only). Local, single-account, network-free |
| **V-5** | Version inventory recorded (OS build, Node, libuv, endpoint name format) | **SATISFIED — V-P phase** | §3.2/§3.3 record OS/build/arch/account/SID/elevation, Node path + version, probe pipe-name format. libuv not printed by the probe, but **resolved by pinned upstream verification** (§4): libuv 1.51.0. V-5's trigger was honoured: the deviation was re-read and produced **no** design change |
| **V-6** | Same-account residual: connect **and send** demonstrable | **PARTIAL — connect demonstrated; send NOT TESTED** | §3.3 demonstrates the same-account **connect**. Same-account **send/write** is source-evidenced only (F-3: CREATOR OWNER full control) and was not measured. Corroborative for the §7.1 residual of the assessment; not a blocking criterion |
| **C5.1** | No byte emitted before a valid, authorized request | **NOT TESTED — not probe-provable** | The probe has no request protocol. It demonstrates the platform **condition** that makes C5.1 necessary, never the application **control**. Required at **V-E / gate C (Q9)** |
| **C5.3 / C6** | Fail-closed startup, no fallback, no owner disclosure | **NOT TESTED — not probe-provable** | Application behaviour; required at **V-E / gate C (Q2, Q4)** |

**Observation recorded (from the environment evidence, not an inference about the ACL).** The session was **unelevated** and the account's Administrators membership is **deny-only**; on Windows such a token does not obtain access through the Administrators ACE, so this account's access would rest on the **CREATOR OWNER** ACE (F-3). How the ACEs are actually laid out on the pipe is precisely what **V-1** must record, and is currently unmeasured.

## 6. Reassessment — does Gate V close?

**Gate V is NOT closed, and it is not kept open because of the waived tests.**

- **Not** open for V-2/V-3: both are **NOT REQUIRED — PA-WAIVED** and must not be described as pending or failed.
- **Open for V-1 and V-4**, which are ordinary **local** measurements, need neither waived resource, and were simply not captured:
  - V-1 is the design's **central stated claim**. §9 says the endpoint's permissions "must be measured, not assumed", and §9's failure disposition turns on this measurement: if any identity beyond the operator/Administrators/SYSTEM/CREATOR OWNER holds write access, *"this design does not satisfy L-IPC-1 on Windows as written"*. V-1 is also the criterion that would show whether a **read-only-capable** principal exists at all — the condition that makes C5.1 load-bearing (F-5).
  - V-4 is the **fail-closed behaviour** claim (F-7/F-8) that distinguishes this design from a fallback-prone one; it is likewise local and network-free.
- **Additionally outstanding by design (not a defect):** V-1/V-3/V-4 must be **re-run against the production endpoint** in the V-E phase after gate B, and C5.1/C5.3/C6 are gate-C items. A probe result could never close those.

**Why V-1/V-4 are genuinely necessary to Gate V (and proportionate):** each is one short command-set in the operator's own account, requires **no** second account, **no** remote machine, **no** network exposure, **no** elevation, **no** new authority, and **no** application change — the same class of measurement as the probe already executed. If the Program Authority instead intends to waive V-1 and/or V-4, that is a **separate explicit waiver**; it is **not inferred here**, and this record does not treat a missing measurement as a satisfied criterion.

**Gate V final disposition for this pass: `PARTIALLY SATISFIED (V-P) — REMAINS OPEN`.** Satisfied: V-5 (with the runtime deviation reconciled and no design change triggered); partial: V-6 (connect only). Open: V-1, V-4 (local), and the whole V-E phase. Waived: V-2, V-3.

## 7. Authorization boundaries preserved (STEP 4)

The PA waivers, and this record, do **not**: accept the proposed IPC security contract; amend IRR DP-1; authorize endpoint implementation; authorize provisioning; grant P-6 implementation authority; qualify P-8; authorize route admission; or authorize durable integration or portfolio writes. Specifically:

1. The security contract remains **PROPOSAL ONLY** until the IPD security-contract authority accepts §13. No acceptance is recorded here.
2. **The production application endpoint has not been tested** by the disposable probe, and no such claim is made.
3. Gate sequence unchanged: **V** (V-1/V-4 remaining + V-E) → contract acceptance → **A** provisioning (**still NOT AUTHORIZED**, §1.9) → **B** implementation authority (IPD-`main` durable basis does not exist; **G24 must not be promoted**) → **C** qualification (Q1–Q11, incl. C5.1/C5.3/C6) → **D** route admission → **E** write policy. IRR: DP-1 amendment (separate act) → P-6 → P-8.
4. IRR's HTTP **503 `owner-context-unavailable`** fence stays in force; **DP-2 Option 2F** stays unrelaxed; **PR #8 is not merged**.

## 8. Next genuinely required action

**Run the two remaining local measurements** (Block A/A′ of the Gate V procedure, unchanged in nature): start the disposable probe, capture the pipe's **SDDL/ACL** (`GetSecurityInfo` → SDDL, the documented built-in method already in the procedure; AccessChk optional and not installed), and perform the **collision + abrupt-termination/re-bind** checks. One short PowerShell session in the operator's own account; no second account, no remote machine, no production endpoint, no new authority.

**Authority/dependency:** none beyond the measurement itself; it is the same class of act as the probe already performed. Its result closes V-1/V-4 for the **V-P** phase. If either measurement contradicts F-3/F-7/F-8, §9's failure disposition applies (host-configuration mitigation that can be evidenced, or rejection of the Windows-Node variant) — not an implementation-time workaround.

---

*Recording agent: Arena — reconciliation and recording only; the laptop evidence is Program-Authority-supplied transcription, and §4 is the only measurement performed by the agent (source-level, upstream-pinned). Program Authority: Ramki. ## 9. ADDENDUM (2026-10-16, later the same day) — FINAL FOUR-WAIVER RECONCILIATION AND V-P DISPOSITION

**Provenance.** The Program Authority decision and the additional V-P attempt evidence below are **PA-supplied and transcribed** into this record. The recording agent has **no access to the laptop's local files** and measured none of the laptop output; §9.2's error-code meanings and the F-5 corroboration are source-level checks by the agent (cited), not measurements.

### 9.1 The four waivers (recorded exactly)

| # | Measurement | Disposition |
|---|---|---|
| 1 | **V-1 — ACL/SDDL capture** | **NOT REQUIRED — PA-WAIVED.** |
| 2 | **V-4 — pipe collision and re-bind testing** | **NOT REQUIRED — PA-WAIVED.** |
| 3 | Second-account access test | **NOT REQUIRED — PA-WAIVED.** |
| 4 | Remote-machine access test | **NOT REQUIRED — PA-WAIVED.** |

All four are **deliberate Program Authority waivers**. None may be recorded as **PASS, FAIL, or BLOCKED**; none is pending work; none may be re-run; none may be described as technical proof that the underlying property has been demonstrated.

### 9.2 Additional V-P attempt evidence (PA-supplied, transcribed)

**A fresh disposable probe started successfully:** pipe `\.\pipe\iips-g2-gatev-a5026495eab64286bcec87ac63b31c39`, **PID 468**, **Node v24.14.0**, start **2026-10-16T16:23:36.836Z**; the pipe **appeared in the local named-pipe inventory**. (Measured: the endpoint existed on this host and was locally enumerable.)

**V-1 attempts — no permissions were changed by either attempt:**
1. `GetNamedSecurityInfo` returned **error 87, ERROR_INVALID_PARAMETER**; **no descriptor was retrieved**.
2. PowerShell `Get-Acl` returned **"Method failed with unexpected error code 231."** Error 231 is documented as **ERROR_PIPE_BUSY — "All pipe instances are busy"**: Microsoft, *Named Pipe Client* — *"If the pipe exists but all of its instances are busy, CreateFile returns INVALID_HANDLE_VALUE and GetLastError returns ERROR_PIPE_BUSY."* The failure therefore occurred at the **open** step; it is **not** a judgement about the ACL's contents.
3. The precise cause of either error was **not diagnosed**, and with the waiver **no further attempt is required or made**.
4. **Consequence: the effective ACL/SDDL was NOT captured.**

**V-4:** collision and abrupt-termination/re-bind behaviour was **not tested**.

**Second-account / remote:** not performed — only one Windows account exists on the laptop and no separate remote machine is available.

**Never tested, at any point:** a production application endpoint.

*Source-level corroboration recorded with this pass (not a measurement): the same Microsoft page states that **"For a duplex pipe, the client can specify read, write, or read/write access"**, independently corroborating **F-5**.*

### 9.3 Measured results vs unverified properties (kept strictly separate)

| Property | Status | Basis |
|---|---|---|
| Same-account connectivity to a **disposable probe** | **MEASURED — succeeded** | Initial test: `CONNECT_SUCCEEDED`; server `CLIENT_CONNECTED` / `CLIENT_CLOSED`; client sent **no application data** |
| Probe exists / is locally enumerable on this host | **MEASURED — succeeded** | §9.2 second attempt |
| **Effective pipe ACL/SDDL** | **NOT CAPTURED** (attempts failed: 87, 231) — now **PA-WAIVED** | §9.2 |
| **Cross-account isolation** | **NOT DEMONSTRATED** — **PA-WAIVED** | PA-1; no second account exists |
| **Remote isolation** | **NOT DEMONSTRATED** — **PA-WAIVED** | PA-2; no remote machine exists |
| **Lifecycle fail-closed** (collision; abrupt termination/re-bind) | **NOT TESTED** — now **PA-WAIVED** | §9.2 |
| Production endpoint security, authorization, durable write | **NOT TESTED** | Endpoint does not exist and is not authorized |
| Application controls **C5.1 / C5.3 / C6** | **NOT TESTED** — not probe-measurable | Gate C items |

### 9.4 Gate V reassessment with all four waivers in force

**Not kept open because of the waived measurements:** V-1, V-2, V-3 and V-4 are explicitly **NOT REQUIRED — PA-WAIVED** and are removed from the open set.
**Not declared satisfied by waiver alone:** closure by waiver is *not* technical proof; §9.3 remains the authoritative statement of what is unverified.

| V-P criterion | Disposition |
|---|---|
| **V-5** version inventory (OS/build/arch/account/elevation, Node path + version, endpoint-name format; runtime deviation reconciled) | **SATISFIED — evidence** (§3.2/§3.3, §4) |
| **V-6** same-account residual | **PARTIAL** — connect demonstrated; the *send* half was not measured. V-6 is an item introduced by the trust-boundary assessment §8 for documenting the accepted residual; it is **corroborative, not a §9 criterion**, and is not a blocker |
| **V-1, V-2, V-3, V-4** | **NOT REQUIRED — PA-WAIVED** |

**V-P DISPOSITION: CLOSED — closed by waiver where unmeasured, satisfied by evidence where measurable.** Rationale: every V-P criterion is now either **evidence-backed** (V-5) or **explicitly waived by the Program Authority** (V-1–V-4); no criterion remains genuinely open, and no new test or gate is invented to prolong the phase.

**Qualifier that must travel with this disposition (do not drop it).** The waived properties — effective ACL, cross-account isolation, remote isolation, and lifecycle fail-closed behaviour — remain **technically unverified**. F-2/F-3/F-4/F-5 remain **source-verified platform facts**, not host measurements. The contract's §4.3/§9 statements must continue to be read as **unmeasured expectations**, and the contract remains **PROPOSAL ONLY**.

### 9.5 Future V-E (production-endpoint) requirements — separate from current V-P work

These were **never among the four waived measurements** and cannot be probe-measured; they require the real endpoint and separate authority:

1. **C5.1** — no byte emitted before a valid, authorized request (gate C, Q9).
2. **C5.3 / C6** — fail-closed startup with no fallback, shutdown behaviour, and no owner disclosure (gate C, Q2/Q4).
3. **Q1–Q11** qualification items that depend on the realized endpoint (claim-refusal matrix, isolation behaviour, revision/lifecycle, durability, no parallel store, drift check).
4. Where a V-E item would have repeated one of the four waived measurements, **the waiver governs** — nothing here reopens a waived measurement. If the Program Authority later intends the waivers to be narrower for the production endpoint, that scoping is theirs to record.

### 9.6 Authority boundaries — unchanged by these waivers

The waivers do **not**: accept the IPC security contract; authorize implementation of an endpoint; authorize provisioning (tenant administration remains **NOT AUTHORIZED**); amend IRR DP-1; grant **P-6**; qualify **P-8**; authorize route admission; authorize durable integration or portfolio writes; or admit/promote the off-main G24 lineage. **IRR's HTTP `503 owner-context-unavailable` fence and DP-2 Option 2F remain in force**, and **PR #8 is not merged**.

### 9.7 Next genuinely required action

**None in the V-P phase, and none requiring laptop work.** The next action is a **decision**, not a measurement: the IPD security-contract authority's disposition of the rev-2 §13 decision request (§13 requires gate V; the V-P portion is now dispositioned as above, and the V-E items are named in §9.5), followed — only if accepted — by gate A provisioning → gate B implementation authority → gate C qualification (incl. §9.5) → gate D admission → gate E write policy. On the IRR side, the **DP-1 amendment** remains a separate act.

---

**Gate V was not closed by this record as first published** — see §9 below for the final disposition after the four PA waivers. The contract is not accepted, and no implementation, provisioning, write, route or admission authority is created.*
