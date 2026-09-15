# P00 — OPEN ITEMS REGISTER

> **Recording an item does not resolve it.** Every item below remains open.

**None of these items blocks P00.**

---

## OI-08 — Identity cardinality 1 → N

| Field | Content |
|---|---|
| **Description** | `companyId` is currently a sector label (`${sector}-H1}`); `/api/company/:id` is keyed by sector; CSIP receives one holding per sector and existing tests assert `holdings 10` / `holdings 13`. Real market data implies many securities per sector — a **product-behaviour change**, not a technical detail |
| **Current status** | **OPEN** — owner cleared, decision not made |
| **Authority / owner category** | **A1 Security/Identity — program-authority clearance established; no decision taken** |
| **Blocking phase(s)** | **P04** Security Master (directly) · P11 Engine Integration (CSIP holdings assertions) · P13 (UI02, UI15) |
| **Blocks P00?** | **NO** |
| **Required future resolution** | Explicit decision on cardinality and its effect on CSIP holdings-count assertions, before P04 completes |
| **Responsibility** | **NEW PROGRAM** |

---

## OI-09 — External identifier standard

| Field | Content |
|---|---|
| **Description** | No external identifier standard has been selected (ISIN / CUSIP / SEDOL / FIGI / other). The canonical security master cannot be defined without one |
| **Current status** | **OPEN** — owner cleared, decision not made |
| **Authority / owner category** | **A1 Security/Identity — clearance established; no decision taken** |
| **Blocking phase(s)** | **P04** Security Master · P05 Acquisition · D05 security-master domain · P13 (UI13/UI14 resolution) |
| **Blocks P00?** | **NO** |
| **Required future resolution** | Selection and recording of the identifier standard before P04 completes |
| **Responsibility** | **NEW PROGRAM** |

---

## OI-10 — Exact namespace token recording

| Field | Content |
|---|---|
| **Description** | ADR-01-A1 authority hold is cleared, but the source artifacts do not establish a final token string. `MD:<domain>.<field>` remains an **illustrative recommendation only** (`docs/d5/ADR-01_…md` lines 89, 98, 99, 203) |
| **Current status** | **APPROVED-BUT-REQUIRES-EXACT-TOKEN-RECORDING** |
| **Authority / owner category** | **Ramki / Sai** — this is a **documentation/recording action, NOT permission to invent a token** |
| **Blocking phase(s)** | **P05** Acquisition · **P06** Normalization · **P11** Engine Integration (field-key work) |
| **Blocks P00?** | **NO** |
| **Required future resolution** | Record the exact approved token against the Sai/Ramki approval; must satisfy the disjointness/partition property that makes rules C1–C6 enforceable |
| **Responsibility** | **NEW PROGRAM** (recording) under **Ramki/Sai** authority |

---

## AD-17 / M-2 — ReplayService literal-return semantics

| Field | Content |
|---|---|
| **Description** | `ReplayService` returns `reproduced: true` and `byteIdentical: true` as **literals** rather than verified results (`iips-review-recovered/iips-platform/src/replay/ReplayService.ts:21 @ 5decdca`), with a test asserting the literal |
| **Current status** | **UNRESOLVED** — explicitly **not** resolved by ADR-02 approval |
| **Authority / owner category** | **EXISTING-IIPS authority** |
| **Blocking phase(s)** | Not a phase blocker. Constrains truthful replay reporting in **UI17 ReplayExplorer** (P13) |
| **Blocks P00?** | **NO** |
| **Required future resolution** | Existing-IIPS decision on the literal-return semantics. Until then UI17 must not present these values as verified reproduction |
| **Responsibility** | **EXISTING-IIPS** — this program must not implement or alter it |

---

## M-1 — E2E-030 revalidation requirement

| Field | Content |
|---|---|
| **Description** | At the certified delta HEAD, `PROGRAM_v1.1_REPLAY_BASELINE.json` declares 13 sectors while the engine factory and `track3-replay-certification.test.ts` enumerate 10 — certification was issued against a tree where the relevant cases could not execute |
| **Current status** | **OPEN_REVALIDATION_REQUIRED.** **NOT fixed · NOT certified · NOT revoked.** **E2E-030 is NOT revoked and NOT renewed.** AD-4 = **REQUIRE REVALIDATION, NOT REVOCATION** |
| **Authority / owner category** | **EXISTING-IIPS program (AD-10)** |
| **Blocking phase(s)** | **P15** E2E Certification (directly) · **P16** · **P17** |
| **Blocks P00?** | **NO** |
| **Required future resolution** | M-1 repair **and** revalidation by the existing-IIPS program |
| **Responsibility** | **EXISTING-IIPS** — repair/revalidation must not be implemented by this program |

---

## M-5 — Authentication / session wiring

| Field | Content |
|---|---|
| **Description** | Authentication/session enforcement is not wired in the existing platform |
| **Current status** | **OPEN — not repaired** |
| **Authority / owner category** | **EXISTING-IIPS** |
| **Blocking phase(s)** | Limitation on **P03** Secrets/Security · P12 tenant boundary · P13 (UI12 Settings) |
| **Blocks P00?** | **NO** |
| **Required future resolution** | Existing-IIPS repair; this program records the limitation and designs around it |
| **Responsibility** | **EXISTING-IIPS** |

---

## M-6 — Retention enforcement

| Field | Content |
|---|---|
| **Description** | `isWithinRetention` is a stub in `DataGovernanceRuntime`; retention is not enforced. AD-11 authorizes `classify()` but the retention limitation remains |
| **Current status** | **OPEN — not repaired** |
| **Authority / owner category** | **EXISTING-IIPS** |
| **Blocking phase(s)** | Certification **C10** (retention enforcement) · **P17** Operations · P13 (UI11 Administration) |
| **Blocks P00?** | **NO** |
| **Required future resolution** | Existing-IIPS repair |
| **Responsibility** | **EXISTING-IIPS** |

---

## Additional recorded items (not required, recorded for completeness)

| Item | Status | Owner | Blocks P00? |
|---|---|---|---|
| **AD-9** screener contract must be certified before UI05 | Sequencing constraint, active | New program (A2 cleared) | **NO** |
| **P10 coverage** — Alternative/Event Intelligence thinly specified in D4 | Specification gap | New program | **NO** |
| **CD-01** citation drift (`:76` vs `:78`) | Documentation-only | New program | **NO** |
| **IES-016/017/020 readiness certificate files** not locatable | Documentation gap — **AD-8 stands: certified** | Existing-IIPS | **NO** |
| **`G:\IIPS\BACKUPS`** inaccessible | Historical evidence gap | Existing-IIPS | **NO** |
| **AD-14 tracker corrections** specified, not applied | Awaiting separate authorization | New program | **NO** |

---

## Summary

| Category | Items |
|---|---|
| **New-program responsibility** | OI-08, OI-09, OI-10, AD-9, P10 coverage, CD-01, AD-14 application |
| **Existing-IIPS responsibility** | AD-17/M-2, M-1, M-5, M-6, missing certificate files, `G:\IIPS\BACKUPS` |
| **Blocking P00** | **NONE** |
| **Blocking P04** | OI-08, OI-09 |
| **Blocking P05 / P06 / P11** | OI-10 |
| **Blocking P15 / P16 / P17** | M-1 |
| **Resolved by this register** | **NONE — recording is not resolution** |


---

## Post-Reconciliation Addendum (D98 — 2026-09-15)

### Authority & Provider Economics Open Items

| Item | Status | Owner | Description / Governing Rule |
|---|---|---|---|
| **OI-P16-01** | **OPEN — COMMERCIAL/LEGAL** | Program Authority / Commercial | Commercial Licensing & Redistribution Agreement with NSE Data & Analytics Limited for Cash Market EOD & Historical data. |
| **OI-P16-02** | **OPEN — COMMERCIAL/LEGAL** | Program Authority / Commercial | Evaluation of Clause 3 & 8 Non-Commercial / Academic / Research fee waiver applicability with NSE Data & Analytics. |
| **OI-P16-03** | **OPEN — GOVERNANCE** | Program Authority | Legal & policy determination regarding whether controlled, rate-limited public archive acquisition is permissible for offline research bootstrap, or whether formal SFTP archive entitlement is required. (Engineering status: `NOT DETERMINED BY ENGINEERING`). |
| **OI-P16-04** | **OPEN — OPERATIONAL/TECH** | Technical Operations | Static public IP registration and OpenSSH public key exchange with NSE SFTP operations (`eodsftp1.nseindia.com` / `eodsftp2.nseindia.com:7010`) upon contract execution. |
| **OI-P16-05** | **OPEN — TECHNICAL/LEGAL** | Technical / Governance | Verification of applicable usage terms, rate boundaries, and single-user private research constraints for initial low-cost 15-minute runtime candidate (`yfinance`). |
| **OI-P16-06** | **OPEN — COMMERCIAL/TECH** | Technical / Governance | Assessment of Dhan Data API account tier, data rights, and availability as an alternative low-cost runtime provider. |
