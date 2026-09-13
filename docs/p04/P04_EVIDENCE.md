# P04 — EVIDENCE

**Baseline HEAD:** `9a26ac70058a4410ed99905f0aa3d3a18e87ba17`
**Branch:** `arena/01a0814b-iips-production-market-data`
**Nature:** **WORK-PACKAGE PREPARATION EVIDENCE.**

> ⚠ **This is NOT certification evidence, NOT gate-acceptance evidence, and NOT activation
> evidence.** It records that a specification package was prepared — nothing more.

---

## 1. What this package is, and is not

| Dimension | State |
|---|---|
| **Work-package preparation** | ✅ **PERFORMED** — 12 artifacts |
| Specification | ✅ Complete for the authorized P04 scope |
| **Implementation** | ❌ **NOT PERFORMED** — no code, schema, DDL, migration or configuration |
| **Executable validation** | ❌ **NOT PERFORMED** — DO-P04-1…5 **DEFERRED — NOT PASSED** |
| **Gate acceptance** | ❌ **NOT PERFORMED** — P04 **NOT ACCEPTED**; **4 of 18** unchanged |
| **Certification** | ❌ **`NONE_GRANTED`** — no C1–C12; **no certification evidence created or implied** |
| **Production activation** | ❌ **`NOT_AUTHORIZED`** |
| **Existing-IIPS** | ✅ **UNTOUCHED** |

⚠ **Preparation ≠ implementation ≠ validation ≠ acceptance ≠ certification ≠ activation.**
Each is a distinct act; only the first has occurred.

---

## 2. Artifact inventory and checksums

**Method:** `md5sum` over the exact committed bytes, working tree clean at the recorded HEAD.
Reproduce with:

```
cd docs/p04 && md5sum P04_*.md | sort -k2
```

| # | Artifact | Lines | MD5 |
|---|---|---|---|
| 1 | `P04_ACCEPTANCE_CRITERIA.md` | 176 | `6fc7068c63280248bf470eecbf832cda` |
| 2 | `P04_CANONICAL_SECURITY_MODEL.md` | 183 | `32e6b208a7838a9523c7dddbc105d94d` |
| 3 | `P04_CSIP_NON_REGRESSION.md` | 113 | `fb50371bd13493eed32a0e5ce88e7009` |
| 4 | `P04_DEPENDENCY_REGISTER.md` | 93 | `e9f95f41ebca188b3b161c4583477bb4` |
| 5 | `P04_EXCHANGE_VENUE_REFERENCE.md` | 82 | `5bcc2121c3c02f31f8cd1c9632cc4e8c` |
| 6 | `P04_IDENTITY_ADAPTER_CONTRACT.md` | 124 | `6a2330b01f0eee53fd9801f64f17154f` |
| 7 | `P04_LIFECYCLE_AND_EFFECTIVE_DATING.md` | 95 | `6338354719e70c5033414d8fd8bf7e63` |
| 8 | `P04_LINEAGE_AND_VERSION_IMPACT.md` | 94 | `81decfb19176339ec51444c7846cf133` |
| 9 | `P04_OPEN_ITEMS.md` | 120 | `0296379a9530d923c320664fc3de2c3f` |
| 10 | `P04_SCOPE_AND_BOUNDARY.md` | 148 | `16e2a0f85665ecd3d0d4dc5fa281cbc6` |
| 11 | `P04_VALIDATION_RULES.md` | 154 | `15c447680ec3825cf5507016c3b9d4e8` |

**11 substantive artifacts · 1,382 lines.** This evidence artifact is the 12th — see §2.1.

### 2.1 ⚠ Non-circular self-integrity

A file cannot contain its own checksum: writing the digest changes the bytes it digests. The
manifest above therefore covers the **11 substantive artifacts only**, and this file's own
integrity is established by two **external, non-circular** methods:

| Method | How to verify |
|---|---|
| **M-A — Git object identity** | The blob hash of this file is recorded by Git itself: `git rev-parse HEAD:docs/p04/P04_EVIDENCE.md`. Git computes it over the committed bytes; **the file never contains it** |
| **M-B — Commit-tree binding** | `git cat-file -p HEAD:docs/p04` lists all 12 blobs; the tree hash covers this file. Any edit changes the tree, hence the commit — detectable by `git status --porcelain` returning non-empty |

⚠ **No self-hash is embedded**, because embedding an unknowable value would be a fabrication.
This mirrors the discipline recorded in `docs/INCIDENT-01_HISTORY_LOSS.md` §6 R-7.

### 2.2 Manifest verification procedure

1. `git status --porcelain` ⇒ empty (tree matches the commit).
2. `cd docs/p04 && md5sum P04_*.md | sort -k2`.
3. Compare rows 1–11 against §2 — all must match.
4. `P04_EVIDENCE.md` appears in step 2's output; verify it via **M-A**, not against §2.

---

## 3. Baseline and provenance

| Field | Value |
|---|---|
| Baseline HEAD (package prepared against) | **`9a26ac70058a4410ed99905f0aa3d3a18e87ba17`** |
| Nature of baseline | **Restoration / provenance commit** — ⚠ **NOT** the original CHECKPOINT-02 |
| Original CHECKPOINT-02 | `0a7bb929df5f87fffc2deb15401cc2b3fa3085d9` — **permanently unavailable** |
| Restoration commit parent | `eae2ff6937b257883433348560ae92f5485629e5` |
| Provenance qualification | `docs/INCIDENT-01_HISTORY_LOSS.md` |
| P04 commit | Recorded in the execution report; resolvable via `git log --diff-filter=A -- docs/p04/P04_EVIDENCE.md` |

⚠ **O-4 discipline:** no commit hash is invented. Pins inside accepted P00–P03 artifacts that
reference the eight lost commits **do not resolve**; per INCIDENT-01 §5 they are historically
accurate, presently unresolvable, and **deliberately not edited**.

---

## 4. OI-08 incorporation — evidence

**Decision:** 1:N identity cardinality.

| Element of the decision | Where specified | ID |
|---|---|---|
| One entity → **multiple** securities/instruments/listings | `P04_CANONICAL_SECURITY_MODEL.md` §3.2 | **CD-1** |
| Each security/instrument has **its own immutable canonical security ID** | ibid. | **CD-2**, CS-1, CS-5 |
| `companyId` remains the CSIP join key at the existing boundary | ibid.; `P04_CSIP_NON_REGRESSION.md` §4 | **CD-3**, **NR-1** |
| ⚠ Not redefined, removed or retyped | `P04_CSIP_NON_REGRESSION.md` §2/§3 | CG-1, CG-2, CP-1 |
| ⚠ `${sector}-H1` **not forced** into the master | `P04_CANONICAL_SECURITY_MODEL.md` §3.2; `P04_CSIP_NON_REGRESSION.md` §4 | **CD-4**, **NR-5**, MC-6 |
| Adapter cardinality rule stated as 1:N | `P04_IDENTITY_ADAPTER_CONTRACT.md` §4 | **MC-1**, ADP-8 |
| N:1 projection onto `companyId`; set-valued reverse | ibid. | MC-2, MC-3 |
| ⚠ Projection never merges/collapses canonical identities | ibid. | MC-4 |
| Effective-dated cardinality | §4; `P04_LIFECYCLE_AND_EFFECTIVE_DATING.md` §3 | MC-5, CD-5, ED-6 |
| Uniqueness not weakened by 1:N | `P04_CANONICAL_SECURITY_MODEL.md` §6 | **U-9**, V-U8 |
| Listing-level 1:N | §4 | LS-1, BD-3 |
| Validation coverage | `P04_VALIDATION_RULES.md` §2, §6 | V-U8, V-C4, V-C7 |
| Acceptance criteria | `P04_ACCEPTANCE_CRITERIA.md` §C | C-1…C-7 |
| ⚠ Downstream consequences recorded, **not** absorbed | `P04_OPEN_ITEMS.md` OI-P04-02; `P04_CSIP_NON_REGRESSION.md` §4.1 | NR-8…NR-10 |

**Represented as a blocker anywhere?** ❌ **NO** — `P04_OPEN_ITEMS.md` §1 records it **RESOLVED**.

---

## 5. OI-09 incorporation — evidence

**Decision:** FIGI / OpenFIGI is the authoritative external security identifier standard.

| Element of the decision | Where specified | ID |
|---|---|---|
| FIGI/OpenFIGI **authoritative** | `P04_CANONICAL_SECURITY_MODEL.md` §5.1 | **XI-1** |
| ⚠ Canonical security ID **remains distinct from FIGI** | §5.1, §2.1 | **XI-2**, **CS-3** |
| ISIN/CUSIP/SEDOL as **additional non-authoritative** identifiers | §5.1 | **XI-3** |
| ⚠ Provider-native IDs/symbols **never** canonical identity | §5.1; `P04_IDENTITY_ADAPTER_CONTRACT.md` §3 | **XI-4**, **PN-2**, LS-2 |
| Mapping **provenance** explicit | `P04_IDENTITY_ADAPTER_CONTRACT.md` §5 | XI-5, MP-1…MP-5 |
| **Uniqueness** explicit | `P04_CANONICAL_SECURITY_MODEL.md` §6 | U-2, **U-7** |
| **Effective dating** explicit | `P04_LIFECYCLE_AND_EFFECTIVE_DATING.md` §3 | ED-1…ED-7 |
| ⚠ **Fail-closed** unresolved mappings explicit | `P04_IDENTITY_ADAPTER_CONTRACT.md` §6 | **FC-1…FC-7** |
| ⚠ Missing FIGI ⇒ unresolved, **never a fallback** | §5.1; `P04_VALIDATION_RULES.md` §3 | **XI-6**, FC-2, V-X5 |
| Identifier record attributes incl. authority flag | `P04_CANONICAL_SECURITY_MODEL.md` §5.2 | V-X6 |
| FIGI granularity discipline | §5.3 | XI-7, XI-8, BD-6 |
| Validation coverage | `P04_VALIDATION_RULES.md` §3 | V-X1…V-X7 |
| Acceptance criteria | `P04_ACCEPTANCE_CRITERIA.md` §D | D-1…D-7 |
| Sourcing/licensing carried separately (**does not reopen OI-09**) | `P04_OPEN_ITEMS.md` OI-P04-04 | DEP-P04-10 |

**Represented as a blocker anywhere?** ❌ **NO** — `P04_OPEN_ITEMS.md` §1 records it **RESOLVED**.

⚠ **Historical-wording reconciliation.** `P01_FIELD_DICTIONARY.md` §7 and `D4_05` §G.2 state
*"no standard is assumed authoritative"*. Those were accurate when written. **They are NOT
edited**; the superseding current state is recorded in `P04_CANONICAL_SECURITY_MODEL.md` §5.2
(note) — correction **by addition and citation**, never by editing accepted records.

---

## 6. Traceability matrix

| P04 requirement | Authoritative source |
|---|---|
| Purpose | SPEC ¶40 · TRACKER *Phase Roadmap*!P04 |
| Gate intent / minimum evidence | TRACKER *Phase Gates*!P04 · `docs/p00/P00_GATE_MODEL.md`:38 |
| Deliverables P04-01/02/03 | TRACKER *Work Tracker*!P04-01…03 |
| AD-1 adapter model | `docs/d4/D4_05_SECURITY_MASTER_ADAPTER.md` §G.3, §G.9 |
| Canonical model | `D4_05` §G.2 |
| CSIP boundary | `D4_05` §G.4 |
| Migration/rollback | `D4_05` §G.5 |
| Taxonomy | `D4_05` §G.6 |
| Cardinality context | `D4_05` §G.7 |
| Validation areas | `D4_05` §G.8 |
| D05 / D10 domains | `docs/d4/D4_02_DATA_DOMAINS.md` §D.6, §D.11 |
| Identity slots | `docs/p01/P01_IDENTITY_AND_LINEAGE.md` §1.1 · `P01_FIELD_DICTIONARY.md` §7 |
| `identityMappingVersion` conditionality | `docs/p01/P01_DATA_CONTRACT.md` field 13 |
| Snapshot identity / dual layer | `P01_IDENTITY_AND_LINEAGE.md` §2 · `D8_STATUS.adr_status.ADR-02` |
| Six version axes | `docs/p02/P02_PROVIDER_IDENTITY_VERSIONING.md` §2.1 |
| Provider identity rules | ibid. §1 |
| Error taxonomy E1–E8 | `docs/p02/P02_ERROR_TAXONOMY.md` |
| Gate chain G1–G7 | `docs/p03/P03_SECURITY_AUTH_CONTRACT.md` |
| Tenant isolation IS-1…IS-4 | `docs/p03/P03_TENANT_ISOLATION.md` |
| P03 lineage impact NONE | `docs/p03/P03_LINEAGE_AND_VERSION_IMPACT.md` |
| Phase dependencies / readiness | `docs/d8/D8_STATUS.json` `phase_readiness.P04` |
| Sequencing | `docs/d8/D8_EXECUTION_AUTHORIZATION.md` §4 |
| INV-1…INV-10 | `docs/CHECKPOINT-02.md` §8 |
| Provenance qualification | `docs/INCIDENT-01_HISTORY_LOSS.md` |
| Evidence conventions | `docs/p00/P00_EVIDENCE_CONVENTIONS.md` |

---

## 7. Invariant preservation

| Invariant | Verdict |
|---|---|
| INV-1 sole ingress | ✅ unchanged — no ingress added |
| INV-2 `data-${provider}-${dataVersion}-${asOf}` | ✅ unchanged (SN-1) |
| INV-3 six axes, no seventh | ✅ unchanged (VA-1) |
| INV-4 `adapterVersion` in lineage | ✅ unchanged (SN-2) |
| INV-5 five timestamps / availability enum | ✅ unchanged (ED-7) |
| INV-6 E1–E8, only E1 quality-bearing | ✅ unchanged (FC-6, V-F6) |
| INV-7 AD-1, `companyId` untouched | ✅ preserved (§4, `P04_CSIP_NON_REGRESSION.md`) |
| INV-8 ADR-02 `contributingData` | ✅ unchanged (RL-1) |
| INV-9 D01–D10 · 13 engines · 19 UI | ✅ unchanged |
| INV-10 entitlement matrix EMPTY | ✅ unchanged (OI-P04-04) |
| P03 G1–G7 · AP-1/AP-2 · IS-1…IS-4 | ✅ unchanged (SEC-1…SEC-5) |
| **AD-17 replay firewall** | ✅ **UNRESOLVED, preserved** (AF-1…AF-5) |
| Frozen methodologies | ✅ untouched |

---

## 8. Existing-IIPS boundary verification

| Check | Result |
|---|---|
| `iips-review-recovered` modified | **NO** — not present in this repository; cited as read-only evidence |
| Existing-IIPS source/tests modified | **NO** |
| Any of the 13 engines modified | **NO** |
| Scoring / calibration / taxonomy modified | **NO** |
| `ReplayService` / `DataBoundExecutor` / `LiveDataRuntime.ts` | **NO** |
| E2E-030 · `PROGRAM_v1.1_REPLAY_BASELINE.json` | **NO** — not revoked, not renewed |
| Auto Option-A · Materials G1–G6 · Telecom D16 | **NO** |
| CSIP tests (`holdings 10` / `holdings 13`) | **NO** — impact recorded only (NR-10) |
| TRACKER XLSX / SPEC DOCX modified | **NO** — read-only |
| Accepted P00/P01/P02/P03 artifacts modified | **NO** |
| `CHECKPOINT-02.md` / `PROGRAM_STATE.md` / `INCIDENT-01` modified | **NO** |

---

## 9. Explicit confirmations

| # | Confirmation |
|---|---|
| 1 | **No provider or source implementation occurred.** No provider selected, no credential, no endpoint, no OpenFIGI integration |
| 2 | **No executable code exists** anywhere in this repository — no `.ts`, `.tsx`, `.js`, `.py`, `.yaml` or configuration artifact |
| 3 | **No P02–P08 implementation occurred** |
| 4 | **No PIT storage, no corporate-action work** — P08 untouched |
| 5 | **OI-10 not decided; no namespace token invented or inferred** |
| 6 | **AD-17, M-1, M-5, M-6 preserved unresolved** |
| 7 | **No certification granted, implied, or evidenced** |
| 8 | **No production activation** |
| 9 | **No P04 gate acceptance record created** — `P04_ACCEPTANCE_CRITERIA.md` defines criteria; it does not assess or accept them |
| 10 | **No individual named or inferred** for A1–A4 |
| 11 | **No historical acceptance record edited** to clean up stale wording |
| 12 | **DO-1…DO-5 and DO-P04-1…5 remain DEFERRED — NOT PASSED** |

---

## 10. Program state after this package

| Field | Value |
|---|---|
| `formal_gate_status` | **4 of 18 accepted — P00, P01, P02, P03** · **P04–P17 NOT ACCEPTED** |
| P04 | **WORK PACKAGE PREPARED · NOT ACCEPTED · NOT IMPLEMENTED** |
| `certification_status` | **`NONE_GRANTED`** — C12 BLOCKED on M-5 |
| `production_activation_status` | **`NOT_AUTHORIZED`** |
| `program_status` / `implementation_status` | `AUTHORIZED_TO_PROCEED` |
| Existing-IIPS | **UNCHANGED** |
