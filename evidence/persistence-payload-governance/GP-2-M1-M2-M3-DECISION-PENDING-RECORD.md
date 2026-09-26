# Institutional Investment Platform System (IIPS)
# GP-2 / M-1 · M-2 · M-3 — Decision-Pending Record (no determination made)

**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01
**Authority Act ID:** `gp-2-m1-m2-m3-decision-pending-2026-09-26-001`
**Governing Authority:** RAMKI (Authorizing Authority)
**Recording Agent:** Arena (recording only — no determination made, no class, scope, or retention chosen)
**Act Type:** DECISION-PENDING RECORD (non-executable; NO DETERMINATION MADE)
**Recorded At (local, Asia/Calcutta):** 2026-09-26
**Antecedent Checkpoint:** `0e06e46a636b16fa44b6ee828308f0784e268b1d`

---

## 1. VERIFIED ANTECEDENT STATE (inspected, not assumed)

| Item | Verified value |
| --- | --- |
| Authoritative remote | `origin` → `https://github.com/ramkivs/iips-production-market-data.git` (sole) |
| Authoritative branch | `refs/heads/main` @ `4d3e1cdca3a33da0ec3be8b336b17128108a502c` (UNCHANGED) |
| Workstream branch | `arena/01a0ddae-iips-production-market-data` |
| HEAD at recording | `0e06e46a636b16fa44b6ee828308f0784e268b1d` (the GP-2 decision record commit) |
| LOCAL == REMOTE before mutation | TRUE — `git ls-remote` and GitHub API agree |
| Worktree | CLEAN (0 entries) |
| Session delta | 6 additive governance records; 0 source/test/config/runtime files |

Structural checks at this checkpoint: storage-target designations = **0**;
`GP-2 = ESTABLISHED` occurrences = **0**; `STORAGE_AUTHORITY` grants = **0**;
resolved `M-1` values = **0**; `productionEligible: true` = **0**;
GATE-Y filenames = **0**; `gate-y-*` act IDs = **0**.

## 2. NO EXISTING DESIGNATION RESOLVES ANY M-ITEM

The repository was re-inspected for an authoritative designation that would resolve M-1, M-2, or
M-3 without a RAMKI decision. **None exists.** No governance act designates a storage target
class, a domain scope for persistence, or durability/retention characteristics. Accordingly
nothing is reported here as repository evidence resolving an M-item, and no determination is
manufactured in place of one.

## 3. THE THREE DECISIONS — ALL UNRESOLVED

```text
M-1 = UNRESOLVED — RAMKI DETERMINATION REQUIRED
M-2 = UNRESOLVED — RAMKI DETERMINATION REQUIRED
M-3 = UNRESOLVED — RAMKI DETERMINATION REQUIRED
```

| Item | Decision required of RAMKI | State |
| --- | --- | --- |
| M-1 | Designate the intended persistence-target **class**, or explicitly defer | **UNRESOLVED** |
| M-2 | Identify which domains are intended to be covered, or explicitly defer | **UNRESOLVED** |
| M-3 | Designate required **durability / retention** characteristics, or explicitly defer | **UNRESOLVED** |

No class was inferred or recommended. No domain was assumed — neither all of them nor any single
one. No retention requirement was inferred from common engineering practice.

## 4. OPEN DISCREPANCY IN THE M-2 DOMAIN LIST — RAMKI CLARIFICATION REQUIRED

The authorization's M-2 enumeration does **not** match the domain set committed for GATE-P. This
is recorded, not resolved.

| Source | Domain set |
| --- | --- |
| A-1 §2 Scope A (committed) | persistence foundation · Watchlists · Reports · Collaboration · Settings · Governed Screener |
| GP-1 §4 (committed) | identical to the above; "No seventh domain is created" |
| GATE-P findings P-A..P-F (committed) | identical to the above |
| M-2 enumeration in the present authorization | Watchlists · Reports · Collaboration · Settings · Governed Screener · **Research / UI03 / related persistence scope** |

Two deltas follow:

| # | Delta | Significance |
| --- | --- | --- |
| D-1 | **`persistence foundation` is absent** from the M-2 enumeration | It is domain P-A of the committed GATE-P scope and the subject of the central GATE-P finding |
| D-2 | **`Research / UI03` is added** to the M-2 enumeration | `Research UI03` is committed under A-1 §2 **Scope B (Payload Governance)** — the scope of **GATE-Y**, which is `NOT SELECTED` and `NOT OPENED`. GP-1 §7 additionally lists "Research/UI03 persistence implementation" among the activities it does **not** authorize |

Selecting option F as written could extend persistence work into GATE-Y scope without GATE-Y
having been selected. Arena does not resolve this, does not choose between the two domain sets,
and does not re-map option F onto any GATE-P domain. **RAMKI clarification is required.**

## 5. DEPENDENCY BOUNDARIES

```text
M-4 = BLOCKED / DEPENDENT ON D115 + runtimeCompanyId
M-5 = GP-5 — NOT AUTHORIZED
M-6 = GP-3 — NOT AUTHORIZED
```

| Item | Boundary |
| --- | --- |
| M-4 | Ownership scoping is blocked: `D115 C/D` is WITHHELD / UNRESOLVED / NOT AUTHORIZED and `runtimeCompanyId` is UNRESOLVED |
| M-5 | Hosting / persistence tier is GP-5 — **NOT AUTHORIZED** |
| M-6 | Relief from `PHASE5` §3 transport exclusions is GP-3 — **NOT AUTHORIZED** |

## 6. M-1 / M-2 / M-3 DO NOT AUTHORIZE

Determining M-1, M-2, or M-3 — now or later — does **NOT** by itself authorize any of:

- implementation
- storage provisioning
- hosting
- deployment
- transport
- credentials
- D115 resolution
- production activation

A designation of intent is not a grant of engineering permission.

## 7. AUTHORITY STATES — PRESERVED, RECORDED SEPARATELY

| Authority / dependency | State |
| --- | --- |
| `GP-1` | **ESTABLISHED** |
| `GP-2` | **NOT ESTABLISHED** |
| `GP-3` | **NOT AUTHORIZED** |
| `GP-4` | **UNRESOLVED** |
| `GP-5` | **NOT AUTHORIZED** |
| `GP-6` | **NOT AUTHORIZED** |
| `IMPLEMENTATION_AUTHORITY` | **NOT GRANTED** |
| `PERSISTENCE_IMPLEMENTATION_AUTHORITY` | **NOT GRANTED** |
| `STORAGE_AUTHORITY` | **NOT GRANTED** |
| `TRANSPORT_AUTHORITY` | **NOT GRANTED** |
| `PAYLOAD_DATA_AUTHORITY` | **NOT GRANTED** |
| `D115_IDENTITY_AUTHORITY` | **UNCHANGED** — WITHHELD / UNRESOLVED / NOT AUTHORIZED |
| `PRODUCTION_AUTHORITY` | **UNCHANGED** — `productionEligible: false` |
| `GATE-Y` | **NOT SELECTED / NOT OPENED** |

## 8. PRESERVATION

No existing record was modified. `A-1`, the GATE-P selection record, the GATE-P findings record,
the post-GATE-P authority packet, `GP-1`, the `GP-2` decision record, the D8 historical position,
and all frozen qualification, certification, and release records remain byte-identical. No
source, test, configuration, deployment, or runtime file was touched. This act is purely additive.

## 9. D8 — PRESERVED / UNCHANGED

```text
D8_REPOSITORY_TOKEN               = NOT FOUND
D8_HISTORICAL_GOVERNANCE_REFERENT = AUTHORITY-ASSERTED / EXTERNAL
D8_TRACEABLE_REPOSITORY_EVIDENCE  = NOT ESTABLISHED
D8_IMPLEMENTATION_AUTHORITY       = NOT ESTABLISHED BY A-1
```

## 10. NEXT AUTHORITY ACTION (not authorized by this act)

An explicit RAMKI determination of M-1, M-2 and M-3 — or an explicit deferral of each — together
with clarification of the §4 domain-list discrepancy. Until that is recorded, GP-2 remains
`NOT ESTABLISHED`. Arena must not choose values, must not resolve §4, and must not treat this
record as a work plan.

---

**End of Decision-Pending Record. No determination made. No implementation authorized, performed, or implied.**
