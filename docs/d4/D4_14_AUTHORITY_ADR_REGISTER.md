# D4 Part P — Open Authority / ADR Register

**SPECIFICATION ONLY. NO AUTHORITY IS INVENTED IN THIS DOCUMENT.**
Where an owner is unknown, it is recorded as **UNKNOWN**, not guessed (user constraint:
UNKNOWN is preferable to guessing).

---

## P.1 Resolved decisions carried in from G-A (14 — all ANSWERED)

| AD | Decision |
|---|---|
| AD-15 | **ACCEPT** — this repository is authoritative over D2's reconstructions |
| AD-4 | **REQUIRE REVALIDATION** of E2E-030 (not revocation) |
| AD-10 | **EXISTING-IIPS PROGRAM** owns M-1 |
| AD-1 | **ADAPTER MODEL** for identity / `companyId` |
| AD-3 | **INCLUDE** `dataVersion` + `asOf` + provider in replay lineage — *requires Ramki/Sai ADR* |
| AD-6 | **EXPLICIT DUAL-LAYER MAPPING** (input snapshot vs result snapshot) |
| AD-2 | **AUTHORIZE** `DataSnapshot`/`MarketDataSource` as sole ingress |
| AD-16 | **AUTHORIZE** namespace + fail-closed collision detection |
| AD-12 | **RETIRE G2** |
| AD-9 | **GOVERNED SCREENER CONTRACT BEFORE UI** |
| AD-8 | **IES-016 / IES-017 / IES-020 ARE CERTIFIED** |
| AD-11 | **AUTHORIZE** `DataGovernanceRuntime.classify()` |
| AD-13 | **UI15–UI19 IN SCOPE** |
| AD-14 | **AUTHORIZE tracker corrections at D4** (specification form) |

**Two of these carry a residual ADR obligation:** AD-3 and AD-16 are *decisions of direction*
that still need a written ADR signed by Ramki/Sai before implementation.

---

## P.2 UNKNOWN authority roles (4) — must not be invented

| # | Role | Consequence |
|---|---|---|
| A1 | **Security / identity authority** | **P03 blocked** → P04, P05, P06, P07 transitively blocked. Highest-leverage blocker (Part 12 N.3) |
| A2 | **New-program certification authority** | C1–C9, C11 (Part 11) cannot be assigned an owner; P17 blocked |
| A3 | **P00–P17 gate acceptors** | **No phase gate can be formally accepted** |
| A4 | **P16 activation authority** | Production activation blocked |

---

## P.3 Open ADRs requiring Ramki/Sai sign-off

| ADR | Subject | Recommendation in this package | Status |
|---|---|---|---|
| **ADR-AD3** | Replay identity extension: include `dataVersion` + `asOf` + provider | Part 7 — extended replay identity, backward-compat inert for SNAPSHOT-only executions | **PENDING** |
| **ADR-AD16 / OI-10** | Market-data field namespace token | Part 5 — **`MD:<domain>.<field>`** (no existing key contains `:`); collision rules C1–C6 fail-closed | **PENDING — token NOT approved**; `md.*` remains illustrative only |
| **ADR-OI08** | Identity cardinality 1→N (one holding per sector → many securities) | Part 6/Part 8 — flagged as a product-behaviour change; **no resolution proposed** | **PENDING** |
| **ADR-OI09** | External identifier standard (ISIN / CUSIP / SEDOL / FIGI / other) | Part 6 — **no standard selected**; requires security/identity authority (A1) | **PENDING** |

---

## P.4 Deferred / UNKNOWN items (13) — full register

| # | Item | Owner | Status |
|---|---|---|---|
| 1 | Security / identity authority | **UNKNOWN** | OPEN — blocks P03 |
| 2 | New-program certification authority | **UNKNOWN** | OPEN |
| 3 | P00–P17 gate acceptors | **UNKNOWN** | OPEN — no gate acceptable |
| 4 | P16 activation authority | **UNKNOWN** | OPEN |
| 5 | ADR-AD3 (replay lineage) | Ramki / Sai | PENDING |
| 6 | ADR-AD16 namespace | Ramki / Sai | PENDING |
| 7 | **OI-10** namespace token approval | Ramki / Sai | **PENDING — `MD:` recommended, not approved** |
| 8 | **M-1** evidence chain + AD-4 revalidation | Existing-IIPS program (AD-10) | OPEN — **not repaired here** |
| 9 | Missing IES-016/017/020 certification **files** | Existing-IIPS program | OPEN — artifacts not locatable |
| 10 | `G:\IIPS\BACKUPS` inaccessible | Existing-IIPS program | OPEN |
| 11 | **AD-17 / M-2** — `ReplayService` literal `reproduced: true` / `byteIdentical: true` | Existing-IIPS program | **UNRESOLVED — not repaired** |
| 12 | **M-6** retention stub (`isWithinRetention`, `DataGovernanceRuntime.ts:53`) | Existing-IIPS program | OPEN — **not repaired** |
| 13 | **OI-08** cardinality / **OI-09** identifier standard | Security-identity authority (A1) | OPEN |

*(Additionally noted but out of this program's remit: **M-5** authentication/session not wired.)*

---

## P.5 Escalation order (by leverage)

| Rank | Item | Unblocks |
|---|---|---|
| 1 | **A1 — security/identity authority** | P03 → P04 → P05 → P06 → P07 and all downstream; also OI-08, OI-09 |
| 2 | **OI-10 — namespace token** | P05 and ingress certification (Part 11 S2) |
| 3 | **A3 — gate acceptors** | Any formal phase acceptance at all |
| 4 | **M-1 / AD-4** | Any claim about the certified 13-engine baseline |
| 5 | **ADR-AD3** | P06 → P07 replay identity |
| 6 | **A2 — certification authority** | C1–C11, P17 |
| 7 | **A4 — activation authority** | P16 |
| 8 | **AD-17 / M-2** | Truthful replay reporting in UI17 |

---

## P.6 Explicit non-inventions

This document does **not** name, assume, delegate or imply: a security/identity authority; a
new-program certification authority; any P00–P17 gate acceptor; a P16 activation authority; an
AD-17 resolution; an external identifier standard; a cardinality resolution; or an approved
namespace token.
