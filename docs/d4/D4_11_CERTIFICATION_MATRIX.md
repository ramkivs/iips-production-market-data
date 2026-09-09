# D4 Part M — Certification / Validation Impact Matrix

**SPECIFICATION ONLY. NO CERTIFICATION DECISION IS MADE OR IMPLIED IN THIS DOCUMENT.**
This matrix states *what would need certifying* and *by whom*, never *that anything is certified*.

---

## M.1 Impact classes

| Class | Meaning |
|---|---|
| **UNAFFECTED** | Existing certification stands; no new evidence needed |
| **REVALIDATION** | Same artifact must be re-run/re-evidenced unchanged |
| **NEW CERTIFICATION** | New artifact requiring its own certification |
| **AUTHORITY REQUIRED** | Cannot be classified until an open authority question is answered |

---

## M.2 Existing certification artifacts and impact

| Artifact | Location | Impact | Rationale |
|---|---|---|---|
| E2E-030 v3.0 (13-engine delta) | `docs/integration/IIPS_v3.0_E2E-030_CERTIFICATION.md` | **REVALIDATION** (AD-4) | M-1 evidence-chain defect at `67e89aa`; **not revoked** — revalidation required. Owner: existing-IIPS program (AD-10) |
| `PROGRAM_v1.1_REPLAY_BASELINE.json` | `program-v1.1-certification/` | **REVALIDATION** | 13 sectors declared; must re-baseline post-M-1 repair |
| IES-006…IES-020 engine certifications (13) | per-engine | **UNAFFECTED in principle · REVALIDATION inherited** | No methodology change (Part 8); but they sit under the E2E-030 chain |
| IES-005.1 `PluginContract` freeze | `src/plugin-loader/PluginContract.ts` | **UNAFFECTED** | Contract not modified |
| CSIP contracts (`NormalizedHolding`, `PortfolioReport`, OntologyMapper, RankingEngine, OpportunityEngine) | `src/sector-engines/cross-sector/` | **UNAFFECTED** | Not modified (Part 6). ⚠ cardinality **OI-08** could change this — **AUTHORITY REQUIRED** |
| Frozen methodologies D16/D17/D20 (+ triples `44ba/ea22/c8ed`, `5813…`, `3cfb/92be`) | methodology docs | **UNAFFECTED** | Preserved verbatim |
| `EngineRegistry.assertNotTaxonomyResolved` (lines 42–49) | `src/registry/` | **UNAFFECTED** | Guard preserved |
| `EngineApiAdapter` `apiVersion '1.0'` | `src/integration/` | **REVALIDATION** | Additive DTO fields (Part 9) must be shown non-breaking |
| Missing IES-016/017/020 certification **files** | not found in tree | **AUTHORITY REQUIRED** | AD-8 states they ARE certified; artifacts not locatable in repo |

---

## M.3 New certification requirements introduced by this program

| # | Item | Type | Why | Proposed owner |
|---|---|---|---|---|
| C1 | Market-data ingress path (`MarketDataSource` → `DataSnapshot` → `DataBoundRequest` → `DataBoundExecutor`) | **NEW** | Sole ingress (AD-2); becomes an input path to certified engines | New-program certification authority — **UNKNOWN** |
| C2 | Namespace + collision guard (`MD:<domain>.<field>`, rules C1–C6) | **NEW** | Fail-closed guard protects engine input integrity (AD-16) | Ramki/Sai ADR (**OI-10**) + certification authority |
| C3 | Snapshot immutability + `contributingData` lineage | **NEW** | AD-3/AD-6 replay identity extension | Certification authority — **UNKNOWN** |
| C4 | Extended replay identity (data vintage) | **NEW** | AD-3 | Ramki/Sai ADR + certification |
| C5 | Security master + P04 identity adapter | **NEW** | AD-1 adapter model | **Security/identity authority — UNKNOWN → P03 blocked** |
| C6 | Screener contract | **NEW** | AD-9: certify contract **before** UI05 | Certification authority — **UNKNOWN** |
| C7 | Object-resolution / search contract | **NEW** | UI13/UI14 | Certification authority — **UNKNOWN** |
| C8 | Provenance/quality/freshness derivation | **NEW** | Replaces literals; NFR-03/04/09 | Certification authority — **UNKNOWN** |
| C9 | `DataGovernanceRuntime.classify()` | **NEW** | AD-11 | Certification authority — **UNKNOWN** |
| C10 | Retention enforcement | **BLOCKED** | M-6 stub (`isWithinRetention`, `DataGovernanceRuntime.ts:53`) — **not repaired here** | Existing-IIPS program |
| C11 | PIT reproducibility (reports, saved screens) | **NEW** | UI08/UI05 | Certification authority — **UNKNOWN** |
| C12 | Data-plane security/tenant enforcement | **BLOCKED** | M-5 auth not wired; authority UNKNOWN | Security authority — **UNKNOWN** |

---

## M.4 Regression / non-regression test impact

| Suite | Location | Impact |
|---|---|---|
| Platform suite (454/506 passing at baseline) | `iips-platform` | **REVALIDATION** — must remain at or above baseline |
| Frontend suite (149 pass / 12 fail / 25 skip) | `frontend` | **REVALIDATION** — pre-existing failures are existing-IIPS scope, **not repaired here** |
| `track3-replay-certification.test.ts` | platform | **REVALIDATION** — enumerates 10 sectors vs 13 in baseline (**M-1**) |
| Golden/oracle engine tests | per engine | **NON-REGRESSION GATE** — frozen inputs must yield byte-identical outputs after ingress changes |
| CSIP holdings-count assertions (10 / 13) | cross-sector tests | **AUTHORITY REQUIRED** — OI-08 |
| Determinism tests | platform | **NEW cases** — same snapshot ⇒ same result; collision ⇒ fail-closed abort |

---

## M.5 Sequencing constraints on certification

| # | Constraint |
|---|---|
| S1 | **M-1 repair and AD-4 revalidation precede** any claim about the certified 13-engine baseline. |
| S2 | **C2 (namespace) precedes C1 (ingress) acceptance** — the ingress cannot be certified with an unguarded merge (`LiveDataRuntime.ts:76`). |
| S3 | **C6 (screener contract) precedes UI05** (AD-9). |
| S4 | **C5 precedes P04/P05** and is itself blocked by unknown security/identity authority. |
| S5 | **C12 precedes any production data exposure**; blocked by M-5 + unknown authority. |
| S6 | **No gate can be formally accepted** while P00–P17 gate acceptors are UNKNOWN. |

---

## M.6 Statements this document does NOT make

- Does **not** state that E2E-030 is revoked.
- Does **not** accept, grant, or deny any certification.
- Does **not** claim any phase gate is accepted.
- Does **not** assert AD-4 revalidation will pass.
- Does **not** resolve AD-17/M-2, M-1, M-5, M-6.
