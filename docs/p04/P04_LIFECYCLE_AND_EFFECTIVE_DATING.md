# P04 — LIFECYCLE AND EFFECTIVE DATING

**SPECIFICATION ONLY.** Tracker deliverable **`P04-03`** — *"Lifecycle/reference metadata:
handle listings, delistings, exchange metadata and instrument state"*, exit criterion
*"Historical lifecycle reproducible"*.

⚠ **P08 boundary.** `P08-02` (corporate-action ingestion) depends on **`P04-03`** with entry
criterion *"Instrument lifecycle stable"*. P04 specifies **lifecycle state and effective
dating**; **P08 owns corporate-action ingestion, adjustment logic and PIT storage.** P04
specifies enough for P08 to consume, and no more.

---

## 1. Principle

> **Every attribute is time-bounded** (`docs/d4/D4_05_SECURITY_MASTER_ADAPTER.md` §G.2).

Identity is not a static fact. The master records **what was true, as of when** — which is what
makes PIT identity resolution (ADP-7) and lifecycle reproducibility possible.

---

## 2. Lifecycle states

The enumeration is fixed by `D4_05` §G.2 and `P01_FIELD_DICTIONARY.md` §7 (`lifecycleStatus`) —
**five values, unchanged, none added**:

| State | Meaning |
|---|---|
| `active` | Trading/valid in the normal course |
| `suspended` | Temporarily halted; identity intact |
| `delisted` | No longer listed on a venue; identity **retained**, not deleted |
| `merged` | Absorbed into another entity/instrument through a corporate event |
| `superseded` | Replaced by a successor identity |

| # | Rule |
|---|---|
| **LC-1** | Lifecycle state is **effective-dated**; the state is always *as of* a date |
| **LC-2** | ⚠ **A lifecycle transition NEVER mutates the canonical security ID** (CS-5). Delisting, merger or supersession changes **state and relationships**, never the immutable anchor |
| **LC-3** | Identity records are **never deleted**. A retired identity remains resolvable for historical/PIT queries |
| **LC-4** | `merged` and `superseded` **require a successor reference**; the predecessor→successor link is itself effective-dated |
| **LC-5** | Transitions are **audit-logged** (ADP-3) |
| **LC-6** | A state is **never inferred from absence of data.** Missing provider data is not a delisting — that conflation would be a silent identity change |

---

## 3. Effective dating

| # | Rule |
|---|---|
| **ED-1** | Every identity, listing, mapping and identifier record carries `validFrom` / `validTo` |
| **ED-2** | Windows for the same (entity, attribute) are **non-overlapping**; overlap is a hard error (`P04_VALIDATION_RULES.md` §4) |
| **ED-3** | An open-ended `validTo` denotes *currently valid* and must be represented **explicitly**, never as a missing field — consistent with P01 null semantics, where absence is asserted rather than implied |
| **ED-4** | **A PIT query resolves identity as of its as-of boundary** (ADP-7) — using the window containing the as-of instant, never the latest window |
| **ED-5** | ⚠ **Corrections are additive.** A wrong record is closed and a new one opened; history is never rewritten (MP-3) |
| **ED-6** | Effective dating applies to the **1:N** issuer↔instrument relationship (CD-5), so issuer attribution is resolved as-of |
| **ED-7** | Timestamp representation follows **P01 timestamp/timezone rules** (`P01_TIMESTAMP_CURRENCY_UNIT_RULES.md`). P04 introduces **no new timestamp semantics** and does **not** add a sixth timestamp (INV-5) |

---

## 4. Lifecycle events — required handling

| Event | Requirement |
|---|---|
| **Delisting** | Listing closed with `validTo`; instrument state → `delisted`; identity retained (LC-3); prior listing remains PIT-resolvable |
| **Symbol change** | Prior symbol closed and recorded as an **alias with effective dates**; ⚠ symbol change is **never** an identity change (LS-2, CS-5) |
| **Merger** | State → `merged`; successor reference required (LC-4); issuer relationship re-dated (CD-5) |
| **Supersession** | State → `superseded` with successor reference |
| **New listing of an existing instrument** | New listing record; instrument unchanged; **1:N** (LS-1) |
| **Re-listing after delisting** | New listing window; **canonical security ID unchanged** |
| **Symbol reuse by a different instrument** | ⚠ **Must not collide** (**U-4**). Time-bounded uniqueness (U-3) permits the reuse; **silent reassignment is a hard error** |
| **Identifier reissue** | New identifier window; **(type, value) uniqueness is time-bounded** (U-2, U-7) |

---

## 5. Reproducibility

| # | Rule |
|---|---|
| **RP-1** | Tracker exit criterion **"Historical lifecycle reproducible"**: given an as-of instant, identity resolution is **deterministic and repeatable** |
| **RP-2** | Reproducibility requires the **mapping version** used, which is why `identityMappingVersion` participates in lineage (ADP-5, `P04_LINEAGE_AND_VERSION_IMPACT.md`) |
| **RP-3** | ⚠ **This is identity reproducibility only.** It is **not** replay verification and **not** PIT storage. **AD-17 remains UNRESOLVED** (existing-IIPS) and P04 **must not** present identity reproducibility as verified replay — see `P04_LINEAGE_AND_VERSION_IMPACT.md` §5 |
| **RP-4** | Corporate-action-adjusted series are **P08**, not P04 (X-6) |

---

## 6. Exclusions

| # | Exclusion | Owner |
|---|---|---|
| LX-1 | Corporate-action ingestion (dividends, splits, bonuses) | **P08** (`P08-02`) |
| LX-2 | Price/series adjustment logic | **P08** |
| LX-3 | PIT storage/retrieval implementation | **P08** |
| LX-4 | Historical market data acquisition | **P05** |
| LX-5 | Retention enforcement | **M-6 — OPEN, existing-IIPS** |
