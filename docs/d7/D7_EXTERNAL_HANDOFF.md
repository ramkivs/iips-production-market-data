# D7 — EXTERNAL HANDOFF

# ⚠ PREPARED — NOT TRANSMITTED

This document is a workspace artifact. **Nothing has been sent, communicated or transmitted
externally.** No approval, assignment, certification, gate acceptance or implementation
authorization is claimed by it.

---

## 1. Executive status

The programme is on **AUTHORITY-REVIEW HOLD**.

Specification work is complete and internally consistent: D4 (18 outputs, A–R) is the
corrected baseline after D4-B; D5 prepared two ADR packages and two authority escalations; D6
performed a read-only reconciliation and found **no authority change whatsoever** — no new
commits, no PRs, no issues, no decision records in the SPEC or tracker, and the existing-IIPS
repository unchanged at `5decdca`.

The programme is therefore **not blocked on analysis. It is blocked on decisions and on
unnamed roles.**

| | Count |
|---|---|
| Decisions actionable by a **known** authority today | **2** (ADR-01, ADR-02) |
| Authority **roles unnamed** | **4** (A1, A2, A3, A4) |
| Issues owned by **existing-IIPS** | **4** (AD-17/M-2, M-1/AD-4, M-5, M-6) |
| Phases with a **named gate acceptor** | **0 of 18** |
| Phases currently **authorized to start** | **0** |

---

## 2. Decisions required from Ramki / Sai

Detail: `docs/d5/ADR-01_…`, `docs/d5/ADR-02_…`, `docs/d7/D7_AUTHORITY_DECISION_SHEET.md`.

| ID | Question | Status | Decision |
|---|---|---|---|
| **ADR-01-A1** | What exact namespace token is approved for market-data fields? (`MD:<domain>.<field>` recommended) | **RECOMMENDED — NOT APPROVED** | APPROVE / REJECT / MODIFY / DEFER |
| **ADR-01-A2** | Is fail-closed pre-merge collision detection in `DataBoundExecutor` approved? | **PENDING** | APPROVE / REJECT / MODIFY / DEFER |
| **ADR-02** | May `dataVersion` + `asOf` + provider participate in effective replay identity, with explicit `data-*` ↔ `SNAP_*` linkage? | **PENDING** | APPROVE / REJECT / MODIFY / DEFER |

Substance in one line each:
- **ADR-01** — `DataBoundExecutor` merges `{...data.fields, ...companyInputs}` unguarded; 54
  free-form camelCase keys across 6 engines include price-derived `peRatio`, `evEbitda`,
  `evRevenue`, `fcfYield`, which market data supplies and `companyInputs` silently overwrites.
  A live NFR-04 violation. Exactly one certified component changes. No engine, methodology,
  scoring, calibration or taxonomy change.
- **ADR-02** — Additive `contributingData[]` linkage; both identifiers preserved; inert when
  no market-data snapshot contributes; existing golden executions must remain byte-identical.

> **ADR approval ≠ certification. ADR approval ≠ gate acceptance. ADR approval ≠ permission to
> implement.**

---

## 3. Security / identity authority assignment required (A1)

**Current assignment: UNKNOWN.** No name is proposed.

Required scope: secrets handling · service/tenant identity · tenancy enforcement · canonical
security identity · provider entitlement boundary.

Once named, A1 must decide:
1. The P03 security model.
2. **OI-08** — identity cardinality 1 → N (today `companyId` is a sector label; CSIP receives
   one holding per sector; real data implies many securities per sector). A product-behaviour
   change.
3. **OI-09** — the external identifier standard (ISIN / CUSIP / SEDOL / FIGI / other).
4. The tenancy / security boundary.

**A1 is the single highest-leverage blocker: it gates P03 → P04 → P05 and, transitively, all
15 downstream phases.**

---

## 4. Certification authority assignment required (A2)

**Current assignment: UNKNOWN.**

Required scope: ownership of certification requirements **C1–C12** (D4 Part M) — ingress path,
namespace/collision guard, snapshot lineage, replay identity extension, security master,
screener contract, object-resolution contract, provenance derivation, governance
classification, PIT reproducibility, data-plane security enforcement.

Nine of the twelve currently have **no owner**. Distinct from Ramki/Sai, who own certified
*existing-IIPS* engine-layer contracts — not this program's new certifications.

---

## 5. Gate-acceptor assignment required (A3)

**Current assignment: UNKNOWN. 0 of 18 phases have a named acceptor.**

The tracker's *Phase Gates* sheet specifies, for every phase, the promotion rule **"Explicit
gate acceptance; no automatic promotion"** — and names no acceptor. The rule requires that
acceptance be explicit; it does not say who gives it.

**Consequence: no P00–P17 phase can be formally accepted, regardless of technical readiness.**

Ramki/Sai ADR approval is **not** a gate acceptance; A1, A2 and A4 are **not** substitutes.

---

## 6. Production-activation authority assignment required (A4)

**Current assignment: UNKNOWN.**

⚠ The entry **"P16 — Production activation authority gate"** in the SPEC and tracker is the
**name of a gate, not an assignment of authority**. No authority may be inferred from it.

Blocks P16 Production Activation and P17 Operations.

---

## 7. Existing-IIPS issues explicitly outside this program

| Item | Status | Note |
|---|---|---|
| **M-1 / AD-4** | **OPEN** | **AD-4 = REQUIRE REVALIDATION, NOT REVOCATION.** E2E-030 is **not revoked** and **not renewed**. No revalidation has been performed or claimed. Owner: existing-IIPS (AD-10). Blocks P15 |
| **AD-17 / M-2** | **UNRESOLVED** | `ReplayService` returns `reproduced` / `byteIdentical` as literals. **Separate from ADR-02 — must not be bundled into one approval** |
| **M-5** | **OPEN** | Authentication / session not wired; compounds the A1 block |
| **M-6** | **OPEN** | Retention stub; blocks certification C10 |
| Missing IES-016/017/020 readiness certificate **files** | **DOCUMENTATION GAP** | **AD-8 stands: these engines ARE certified.** Artifact-location issue only |
| `G:\IIPS\BACKUPS` | **INACCESSIBLE** | Historical evidence completeness |
| Any modification to `iips-review-recovered` | **PROHIBITED** | To this program |

---

## 8. Evidence required after decisions

### If ADR-01 is approved
1. Collision census re-verified at implementation time (52 coded / 54 free-form keys; shared-key table).
2. **13-engine oracle / byte-identity evidence** — including Auto triple `44ba/ea22/c8ed`,
   Materials `5813…`, Telecom `3cfb/92be`.
3. **Fail-closed negative tests** — C1, C2, C3, C4 each abort with the specified error content;
   no partial merge under any violation.
4. Determinism evidence for rule C6.

### If ADR-02 is approved
5. Byte-identical replay of all existing golden executions with `contributingData` empty.
6. Ambiguity detection — executions differing only in `dataVersion` / `asOf` yield distinct
   effective replay identities.
7. Deterministic serialization of the lineage block.
8. `data-*` and `SNAP_*` formats demonstrably unchanged.

### Independently
9. Whatever the A2 certification authority specifies for C1–C12 — **currently unknown, and not
   assumed here.**

---

## 9. Actions prohibited while on hold

1. Implementing ADR-01 or ADR-02.
2. Adopting `MD:<domain>.<field>` or any namespace token as approved.
3. Starting P01 · P02 · P04 · P05 · P11 · P12 · P13 implementation.
4. Starting **P15**.
5. Scaffolding P00.
6. Modifying the tracker XLSX (AD-14 corrections remain specified, **not applied**).
7. Modifying the SPEC DOCX.
8. Modifying `iips-review-recovered`.
9. Repairing M-1, M-2/AD-17, M-5 or M-6.
10. Creating, renewing or claiming any certification.
11. Accepting any phase gate.
12. Naming or inferring A1, A2, A3 or A4 — including from commit messages, repository
    ownership, code authorship or document authorship.
13. Re-scanning unchanged evidence to manufacture progress.

---

## 10. Next programme action

**WAIT FOR ACTUAL AUTHORITY EVIDENCE.**

When explicit Ramki/Sai ADR decisions or A1/A2/A3/A4 assignments appear, run a fresh read-only
authority reconciliation **before** any implementation.
