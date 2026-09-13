# D8 — AUTHORITY RECONCILIATION

**Run type:** read-only reconciliation + authorization-state update. **No implementation performed.**

---

## 0. Authoritative decision of record

The user's explicit statement immediately preceding this task:

> *"consider this as decision approved by Sai/Ramki to move forward"*

is treated as **Sai/Ramki approval to proceed** with the pending authority decisions and the
execution sequence. This is the **sole new authority evidence** since D7; it supersedes the
D6/D7 finding of "no authority change".

**Scope of what this approval does and does not carry** — stated precisely, because the rest of
this document depends on it:

| The approval **does** | The approval **does not** |
|---|---|
| Clear the ADR-01 and ADR-02 authority holds | Supply content decisions the ADRs left open (e.g. the exact token string) |
| Establish program-authority clearance for A1–A4 | Name individual persons to A3/A4 |
| Authorize the program to move forward on the approved sequence | Grant certification, accept a gate, or authorize production activation |
| Apply to items placed before Sai/Ramki in D5/D7 | Reach AD-17 (never placed before them; explicitly firewalled) or M-1 (existing-IIPS) |

---

## A. Authority state — before / after matrix

| Item | D7 status | Newly authorized status | Evidence basis | Remaining caveat |
|---|---|---|---|---|
| **ADR-01** (overall) | PENDING RAMKI/SAI — NOT APPROVED | **APPROVED** | Sai/Ramki approval of record | Implementation still gated on P00→P02 sequence; certification separate |
| **ADR-01-A1** namespace token | RECOMMENDED — NOT APPROVED | **APPROVED-BUT-REQUIRES-EXACT-TOKEN RECORDING** | Approval clears the hold; source artifacts do **not** establish a final token | See §B. `MD:<domain>.<field>` **not** auto-adopted |
| **ADR-01-A2** collision guard | PENDING | **APPROVED — fail-closed** | Sai/Ramki approval | Rules C1–C6 as written in ADR-01; no variation authorized |
| **ADR-02** replay identity extension | PENDING — NOT APPROVED | **APPROVED (additive)** | Sai/Ramki approval | Dual-layer identity preserved; **AD-17 not resolved** |
| **OI-10** namespace token decision | PENDING | **AUTHORITY CLEARED — exact token still to be recorded** | Carried by ADR-01-A1 | Same caveat as A-1 |
| **A1** Security/Identity authority | UNKNOWN | **PROGRAM-AUTHORITY CLEARANCE ESTABLISHED** | Sai/Ramki approval | Clearance ≠ the substantive decisions. **OI-08 and OI-09 remain open content decisions** (§D) |
| **A2** Implementation/certification authority | UNKNOWN | **PROGRAM-AUTHORITY CLEARANCE ESTABLISHED (implementation)** | Sai/Ramki approval | **No certification granted.** Certification of C1–C12 remains a future act, not conferred here |
| **A3** Phase-gate acceptance authority | UNKNOWN (0 of 18) | **PROGRAM-AUTHORITY CLEARANCE ESTABLISHED** | Sai/Ramki approval | **No individual named.** No gate is accepted by this document; gates must still be accepted explicitly, one at a time |
| **A4** Production activation authority | UNKNOWN | **PROGRAM-AUTHORITY CLEARANCE ESTABLISHED** | Sai/Ramki approval | **No production activation performed or authorized.** P16 remains downstream of P15 |
| **AD-17 / M-2** | UNRESOLVED | **UNRESOLVED — unchanged** | No independent authority evidence exists | Existing-IIPS issue; **not** resolved by ADR-02 approval |
| **M-1 / AD-4** | OPEN — revalidation required | **OPEN — revalidation required, unchanged** | No revalidation evidence | **Not fixed, not certified, not revoked.** E2E-030 not revoked, not renewed |
| **M-5** | OPEN | **OPEN — unchanged** | — | Existing-IIPS |
| **M-6** | OPEN | **OPEN — unchanged** | — | Existing-IIPS |
| **OI-08** cardinality 1→N | UNRESOLVED (owner A1 unknown) | **OWNER NOW CLEARED — decision still OPEN** | A1 clearance | Content decision not made by "move forward" |
| **OI-09** identifier standard | UNRESOLVED (owner A1 unknown) | **OWNER NOW CLEARED — decision still OPEN** | A1 clearance | Content decision not made by "move forward" |
| **Implementation authorization** | `NOT_AUTHORIZED` (AUTHORITY_REVIEW_HOLD) | **`AUTHORIZED_TO_PROCEED`** | Sai/Ramki approval clears the program-level hold | Subject to the dependency sequence and remaining technical prerequisites. Execution begins at P00 |
| **Certification status** | `NONE_GRANTED` | **`NONE_GRANTED` — unchanged** | No certification evidence exists | Approval to proceed is **not** certification. C1–C12 remain future acts requiring their own evidence |
| **Formal gate status** | `NONE_ACCEPTED` (0 of 18) | **`NONE_ACCEPTED` — unchanged** | No gate-acceptance act has occurred | A3 clearance makes acceptance *possible*; each gate still requires an explicit acceptance act with evidence |

**Net:** 8 authority holds cleared · **program-level implementation state moves from
`NOT_AUTHORIZED` to `AUTHORIZED_TO_PROCEED`** · 4 existing-IIPS items unchanged · 2 content
decisions (OI-08, OI-09) now have a cleared owner but remain undecided · certification and
formal gate status **unchanged**.

### Three states that must not be conflated

| State | Value after D8 | Meaning |
|---|---|---|
| **AUTHORITY TO PROCEED** | **GRANTED** | The program may execute work in dependency order |
| **FORMAL GATE ACCEPTANCE** | **NONE ACCEPTED (0 of 18)** | Each gate still needs an explicit acceptance act with evidence |
| **CERTIFICATION** | **NONE GRANTED** | C1–C12 remain future certification acts |

---

## B. ADR-01 reconciliation

**Authority hold: CLEARED.** ADR-01 is approved by Sai/Ramki.

### B.1 Namespace token — the exact string is NOT established

Direct check of the source artifacts:

| Artifact | What it says |
|---|---|
| `docs/d5/ADR-01_NAMESPACE_COLLISION_GUARD.md:89` | "### C.1 Namespace token — **RECOMMENDED — NOT APPROVED**" |
| same, line 98 | "This token is **RECOMMENDED ONLY. It is NOT approved.**" |
| same, line 99 | "An alternative token that satisfies the same disjointness property is equally acceptable to the D4 design; only the *partition property* is load-bearing." |
| same, line 203 | "Namespace token `MD:<domain>.<field>` **NOT approved** (OI-10 remains open)." |
| `docs/d4/D4_07_FIELD_NAMESPACE.md` I.3 | "The final token requires sign-off with the ADR. **Not assumed approved.**" |

**No artifact establishes `MD:<domain>.<field>` as the final token.** The approval of record
authorizes the *decision*; it does not itself state a token string.

> ### **ADR-01-A1 STATUS: APPROVED-BUT-REQUIRES-EXACT-TOKEN RECORDING**

Per instruction 7 ("do not invent … namespace tokens") and instruction B, the token is **not**
substituted. `MD:<domain>.<field>` remains the standing recommendation and is the expected
value to be recorded, but recording it is a one-line factual act that must be performed
against the approval, not inferred by this run.

**Consequence:** P05 Acquisition and P06 Normalization cannot begin *field-key work* until the
exact token string is recorded. This does **not** block P00–P02, which is why the first work
package (§F, separate deliverable) sits upstream of it.

### B.2 Collision guard — approved as specified

**Fail-closed**, per ADR-01 §C.2, unchanged:

| Rule | Requirement |
|---|---|
| **C1** Namespace partition | Every key in `data.fields` MUST carry the namespace; non-namespaced key = hard error |
| **C2** Reverse partition | No key in `companyInputs` may carry the namespace; violation = hard error |
| **C3** Intersection test | `keys(data.fields) ∩ keys(companyInputs)` MUST be empty |
| **C4** Cross-snapshot test | Pairwise snapshot key intersections MUST be empty |
| **C5** Fail-closed abort | Any C1–C4 violation **aborts the execution** — no partial merge, no precedence, no coercion |
| **C6** Deterministic merge order | Canonical and specified |

Sole certified component affected: **`DataBoundExecutor`**. No engine, methodology, scoring,
calibration or taxonomy change. Error semantics (ADR-01 §C.3) unchanged.

---

## C. ADR-02 reconciliation

**APPROVED — additive replay-identity extension.**

### C.1 Dual-layer identity preserved (AD-6)

| Layer | Identifier | Status |
|---|---|---|
| Market-data input | `` data-${provider}-${dataVersion}-${asOf} `` | **PRESERVED — format and semantics unchanged** |
| Engine execution/result | `SNAP_*` | **PRESERVED — format, generation and semantics unchanged** |

Neither identifier is replaced, merged, renamed or migrated. The approved change is the
**explicit linkage**, not a re-identification.

### C.2 Contributing-data linkage preserved

`contributingData[]` on the engine snapshot/evidence record, carrying per contributing
snapshot: `dataSnapshotId`, `provider`, `dataVersion`, `asOf`, `receivedAt`, `mode`, `quality`,
`completenessPct`, `lineage` — plus `identityMappingVersion` and `namespaceVersion`.
Effective replay identity extended **for market-data executions only**.

**Backward compatibility (unchanged conditions of approval):** empty `contributingData` ⇒
identity reduces exactly to today's four-element identity; existing golden executions must
remain **byte-identical**.

### C.3 AD-17 firewall — held

> **ADR-02 approval does NOT resolve AD-17.**

AD-17 / M-2 concerns the pre-existing `ReplayService` literal `reproduced: true` /
`byteIdentical: true` returns. It was never placed before Sai/Ramki in D5 or D7 — D5 §F and D7
explicitly separated it. No independent authority evidence exists.

**AD-17 = UNRESOLVED.** UI17 ReplayExplorer must still not present those literals as verified
reproduction.

---

## D. Authority roles — extent of the update

Updated **only to the extent the explicit approval authorizes**. No individual names are
fabricated.

| Role | New state | What this means | What it does **not** mean |
|---|---|---|---|
| **A1** Security / Identity | **PROGRAM-AUTHORITY CLEARANCE ESTABLISHED** | The program may proceed on security/identity work under Sai/Ramki clearance; P03 is no longer blocked on *"there is no one to ask"* | **OI-08** (cardinality 1→N) and **OI-09** (identifier standard) are **substantive content decisions and remain OPEN.** Clearing the owner does not answer the questions |
| **A2** Implementation / certification | **PROGRAM-AUTHORITY CLEARANCE ESTABLISHED (implementation)** | Implementation may be authorized under the approved sequence | **NO CERTIFICATION IS GRANTED.** C1–C12 remain future certification acts requiring their own evidence |
| **A3** Phase-gate acceptance | **PROGRAM-AUTHORITY CLEARANCE ESTABLISHED** | Gate acceptance is now *possible*; the "0 of 18, nobody can accept anything" deadlock is cleared | **No gate is accepted by this document.** Each gate still requires an explicit acceptance act with its evidence. No person-specific assignment is recorded |
| **A4** Production activation | **PROGRAM-AUTHORITY CLEARANCE ESTABLISHED** | Activation authority exists in principle | **No production activation is performed or authorized.** P16 remains downstream of P15, which remains blocked by M-1/AD-4 |

---

## E. Dependency resolution — P00–P17 recalculated

Using the D4-B corrected sequence in `docs/d4/D4_12_PHASE_SEQUENCE.md`. **No reordering.**

| Phase | D7 state | D8 state | Impl. permitted? | Cert. before progression? | Depends on | Remaining blockers |
|---|---|---|---|---|---|---|
| **P00** Governance | Blocked (user hold + A3 unknown) | **UNBLOCKED — EXECUTABLE** | **YES** | No | — | None |
| **P01** Data Contract | Impl. prohibited | **UNBLOCKED** | Not yet — awaits P00 | No | P00 | P00 deliverables + gate |
| **P02** Provider Abstraction | Blocked | **UNBLOCKED** | Not yet — awaits P01 | No | P01 | P01 |
| **P03** Secrets/Security | Blocked — A1 UNKNOWN | **UNBLOCKED (authority)** | Not yet — awaits P01 | No | P01 | ⚠ M-5 existing-IIPS limitation |
| **P04** Security Master | Blocked — P03, OI-08, OI-09 | **PARTIALLY UNBLOCKED** | Not yet | No | P02, P03 | **OI-08, OI-09 undecided** |
| **P05** Acquisition | Blocked — OI-10, P04 | **PARTIALLY UNBLOCKED** | Not yet | No | P02, P04 | **Exact token not recorded** |
| **P06** Normalization | Blocked — OI-10 | **PARTIALLY UNBLOCKED** | Not yet | No | P05 | **Exact token not recorded** |
| **P07** Data Quality | Blocked — P05/P06, A2 | **UNBLOCKED (authority)** | Not yet | **YES** (C7/C8) | P05, P06 | Upstream |
| **P08** Historical/PIT | Blocked — ADR-AD3, AD-17 | **UNBLOCKED (authority)** | Not yet | **YES** (C3, C4, C11) | P06, P07 | ⚠ AD-17 affects replay *reporting* |
| **P09** Intelligence | Blocked | **UNBLOCKED (authority)** | Not yet | **YES** | P07, P08 | Upstream |
| **P10** Alt/Event Intelligence | Blocked | **UNBLOCKED (authority)** | Not yet | **YES** | P09 | ⚠ thin D4 coverage — needs spec depth |
| **P11** Engine Integration | Blocked — OI-10, AD-4 | **PARTIALLY UNBLOCKED** | Not yet | **YES** (C1, C2) | P05, P06, P09 | **Token**; AD-4 inherited; ⚠ OI-08 |
| **P12** Certified APIs | Blocked — P11, AD-9, A1/A2 | **UNBLOCKED (authority)** | Not yet | **YES** (C6, C7) | P11 | AD-9 screener contract before UI05 |
| **P13** UI Integration | Blocked — P12, AD-9 | **UNBLOCKED (authority)** | Not yet | No (consumes certified contracts) | P12 | UI05 gated by AD-9 |
| **P14** UX/Parity | Blocked — P13 | **UNBLOCKED (authority)** | Not yet | No | P13 | Upstream |
| **P15** E2E Certification | Blocked — AD-4/M-1, A2 | **STILL BLOCKED** | **NO** | **YES — is the certification** | P11, P13, P14 | **M-1 unrepaired; no revalidation** |
| **P16** Production Activation | Blocked — P15, A4 | **STILL BLOCKED** | **NO** | **YES** | P15 | P15 blocked |
| **P17** Operations | Blocked — P16, A4 | **STILL BLOCKED** | **NO** | **YES** | P16 | P16 blocked; M-6 open |

### E.1 Classification

| Category | Phases |
|---|---|
| **Newly unblocked and executable now** | **P00** (only — everything else has an unmet upstream deliverable) |
| **Authority-unblocked, awaiting upstream implementation** | P01, P02, P03, P07, P08, P09, P10, P12, P13, P14 |
| **Partially unblocked — content decision outstanding** | P04 (OI-08, OI-09) · P05, P06, P11 (exact token) |
| **Still blocked — external** | **P15, P16, P17** (M-1 / AD-4 revalidation, existing-IIPS) |
| **Require implementation before downstream work** | P00 → P01 → P02 → P03 → P04 → P05 → P06 → P07 → P08 → P09/P10 → P11 → P12 → P13 → P14 |
| **Require certification before promotion** | P07, P09, P10, P12, P15 (C1–C12 owners now cleared; **no certification granted**) |

---

## F. First executable work package

**Selected: P00 — Governance.** Full specification in `docs/d8/D8_FIRST_WORK_PACKAGE.md`.

**Dependency rationale (not convenience):** P00 is the root of the D4 sequence with **no
upstream dependency** (`Depends on: —`). Every other phase has an unmet upstream deliverable:
P01 depends on P00; P02 on P01; P03 on P01; P04 on P02/P03; P05 on P02/P04 *and* the exact
token; P11 on P05/P06/P09. Selecting anything else would silently reorder the agreed sequence,
which instruction 10 forbids. P00's two D7 blockers — the user's "do not scaffold P00 yet" hold
and A3 UNKNOWN — are exactly the two the approval clears.

---

## G. Integrity

| Check | Result |
|---|---|
| Existing-IIPS source changes | **NONE** — not touched in D8 |
| Existing methodology changes | **NONE** |
| Certification falsely granted | **NONE** — `certification_status: NONE_GRANTED` |
| Tracker / SPEC changes | **NONE** — both byte-unchanged |
| Production activation | **NONE** |
| Market-data implementation during D8 | **NONE** |
| D4 / D5 / D7 artifacts modified | **NONE** — D8 writes only `docs/d8/` |
| Namespace token invented | **NO** — recorded as requiring exact-token recording |
| Individual names fabricated for A3/A4 | **NO** |
| AD-17 resolved | **NO** |
| M-1 marked fixed/certified/revoked | **NO** |
| Roadmap altered or dependencies reordered | **NO** |
