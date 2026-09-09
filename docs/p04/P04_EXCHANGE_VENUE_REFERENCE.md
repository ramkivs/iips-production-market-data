# P04 — EXCHANGE / VENUE REFERENCE (D10)

**SPECIFICATION ONLY.** Domain **D10 — Exchange / reference metadata**, phases **"P04–P05"**
(`docs/d4/D4_02_DATA_DOMAINS.md` §D.11, TRACKER *Data Domains*!D10).

---

## 1. Role

Per `D4_02` §D.11, carried forward:

| Aspect | Content |
|---|---|
| Role | *"Supplies listing/venue identity to D05 and staleness baselines to D01/D07"* |
| Consumers | *"Security master (D05), data quality (P07)"* |
| Dependency | *"**D05** (bidirectional: D10 supplies venue identity; D05 owns instrument↔listing)"* |
| Operating mode | Current + historical |
| Requirement | Required |

⚠ **P04 scope split.** P04 establishes **venue identity and reference attributes** as required by
the security master. **Staleness baselines for D01/D07 are P07 work**; market-session and
calendar *consumption* belongs to P05–P07. P04 defines the reference, not its runtime use.

---

## 2. Venue identity — MIC-based

| # | Rule |
|---|---|
| **VN-1** | **Venue identity is MIC-based** (ISO market identifier code), per `P01_IDENTITY_AND_LINEAGE` §1.2: *"D10 venue — Venue identity (MIC-based) — Reference data, not an instrument"* |
| **VN-2** | ⚠ **A venue is reference data, NOT an instrument.** It never carries a canonical security ID, never a FIGI as its own identity, and never enters the issuer↔instrument relationship |
| **VN-3** | MIC distinguishes **operating MIC** from **segment MIC**; each venue record states which it is. The two are **never** treated as interchangeable |
| **VN-4** | Venue identity is **program-internal-stable and effective-dated** — MICs are reassigned and retired over time, so venue attributes are time-bounded (ED-1) |
| **VN-5** | A provider's venue/exchange code is **never** venue identity. It may be recorded as a **non-authoritative alias** with provenance — consistent with **PN-2** |

---

## 3. Required attributes

| Attribute | Requirement |
|---|---|
| MIC | Required — authoritative venue identifier |
| MIC kind | Required — operating \| segment (VN-3) |
| Venue name | Required |
| Country / jurisdiction | Required |
| Operating status | Required — active \| suspended \| retired |
| Effective dates | Required — `validFrom` / `validTo` |
| Trading currency(ies) | Required where applicable |
| Calendar / session reference | Required where applicable — ⚠ **reference only**; session semantics are consumed by P05–P07 |
| Provenance | Required — asserting source |

---

## 4. Bidirectional relationships

```
issuer ──1:N──► instrument ──1:N──► listing ──N:1──► venue (MIC)
   ▲               ▲                   │                │
   └───────────────┴───────────────────┴────────────────┘
        all relationships effective-dated and navigable in both directions
```

| # | Rule |
|---|---|
| **BD-1** | **D05 owns instrument↔listing; D10 supplies venue identity** (`D4_02` §D.11) — ownership is **not** shared, and neither side redefines the other |
| **BD-2** | **listing → venue** resolves the MIC; **venue → listings** resolves the set of listings on that venue in an effective-date window |
| **BD-3** | **instrument → listings** is **1:N** (LS-1); **listing → instrument** is **N:1** |
| **BD-4** | **issuer → instruments** is **1:N** (**CD-1**, OI-08); **instrument → issuer** is **N:1** within an effective-date window (U-9) |
| **BD-5** | All traversals are **as-of** resolutions (ED-4); a relationship is never resolved "latest" when an as-of date is supplied |
| **BD-6** | ⚠ Venue-level **FIGIs attach to listings**, composite/share-class FIGIs to instruments (**XI-8**). Traversal must not move a FIGI across levels |
| **BD-7** | A dangling reference in any direction — listing to a nonexistent venue, instrument to a nonexistent issuer — is a **hard error**, resolved **fail-closed** (FC-1), never by creating a placeholder |

---

## 5. Exclusions

| # | Exclusion | Owner |
|---|---|---|
| VX-1 | Session/calendar runtime evaluation; trading-hours computation | P05–P07 |
| VX-2 | Staleness thresholds and freshness classification | **P07** |
| VX-3 | Venue connectivity, market-data feeds, provider endpoints | **P05** |
| VX-4 | Any venue-reference data acquisition | **P05** |
