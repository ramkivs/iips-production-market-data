# Institutional Investment Platform System (IIPS)
# B1 Three-Engine A1 Adoption — Ramki Authority Act

**Decision ID:** `b1-three-engine-a1-adoption-2026-09-25-001`
**Governing Authority:** RAMKI (Designating Authority)
**Recording Agent:** Arena (recording only — no implementation)
**Act Type:** BOUNDED AUTHORITY ACT — opens a gated sequence (A → B → C); is itself neither implementation nor certification
**Recorded At (local, Asia/Calcutta):** 2026-09-25
**Baseline SHA (B1):** `d2710f3164eab7437b7c0455431210553c2d7a03`
**Antecedents:** Phase 1 Transfer-Eligibility / Identity Reconciliation (read-only) — disposition
`TRANSFER-ELIGIBLE-BUT-AUTHORITY-MISSING`; Phase 2 Authority Act + Adoption Gate Definition (read-only) —
disposition `AUTHORITY-DRAFT-READY`, accepted by RAMKI.

---

## 1. Anchors

| Anchor | Value |
|---|---|
| B1 governing product line | `d2710f3164eab7437b7c0455431210553c2d7a03` (`arena/01a0d33d-iips-production-market-data`) |
| D7 implementation line (irr `phase13-next`) | `1a602d849cc47331d4f61cc366ed0a343f80e287` |
| A1-certified implementation snapshot | `c2dda91de8bd362d4766ed19d777a80e6976c9b5` (ancestor of `phase13-next`) |
| Governance (irr `arena/01a03e3b-iips-review-recovered`) | `524739093adb927e6be40eb316367f745c5d4a3f` |
| Historical A1 certificates (governance only) | `IES-016-A1-2026-09-05` · `IES-017-A1-2026-09-05` · `IES-020-A1-2026-09-05` — Gate-1 `b711e4c`, Gate-2 `e41b69c` (IVM product commit `d1f8bf0`), composite closure `73fb918`, parity evidence record `22f3e91` |
| Superseded-in-part instrument | `group2-d42-canonical-id-2026-09-25-001` (`GROUP2-D42-CANONICAL-ID-AUTHORITY-RECORD.md`) |

## 2. Scope

Exactly three engines, and no others:

| IES | Engine ID (B1 canonical) | B1 implementation tree = irr `c2dda91` tree | Certified frozen pack (irr `c2dda91`) |
|---|---|---|---|
| IES-016 Telecommunications | `sector.telecommunications` | `iips-platform/src/sector-engines/telecommunications/` `ff92542423f5751c992dc31961aedc9810651291` | `ies-016-telecommunications/` tree `33e4f3ac97428da6d257b7a308c9c56256350997` (34 files) |
| IES-017 Automobile | `sector.automobile` | `iips-platform/src/sector-engines/automobile/` `dbdaa90e224b9297a330856f46abb6787790bdf7` | `ies-017-automobile/` tree `a2de07ffeb9ddfd2eac84221f0a1a6fef42a88d9` (34 files) |
| IES-020 Materials & Metals | `sector.materials-metals` | `iips-platform/src/sector-engines/materials-metals/` `e3e13d5fc55e12947b27a2a50fe6f5baab994537` | `ies-020-materials-metals/` tree `2b66ff12d81288d5ba0d25b2a4bcd166a178b58d` (34 files) |

Identity is established by content (tree/blob/SHA-256 equality), not by shared history; B1 and
`c2dda91` share no merge base.

The four layers remain distinct and are not conflated by this act:
**A.** implementation identity (established) · **B.** historical A1 certification (irr governance,
anchored to `phase13-next`) · **C.** B1 registration (absent until Gate B) · **D.** B1
certification (absent until a Gate C determination).

## 3. RAMKI Decisions

1. **Pack location.** Recovered packs are placed at the canonical repository-root paths
   `ies-016-telecommunications/`, `ies-017-automobile/`, `ies-020-materials-metals/`, matching the
   certified lineage's `freezeManifest` convention (`ies-0xx-*/IES-0xx_FREEZE_MANIFEST.json`).
2. **Pack readiness certificates.** The readiness-certificate documents inside the historical frozen
   packs (`IES-0xx_IMPLEMENTATION_READINESS_CERTIFICATE.md` and
   `docs/IES-0xx_16_IMPLEMENTATION_READINESS_CERTIFICATE.md`) may be recovered byte-exactly as pack
   members. They MUST NOT be represented as B1 certification. They MUST be labelled
   **historical / source-lineage evidence**. Because Gate A requires byte-exact recovery with no
   correction, this label is carried by the Gate A provenance record (and any B1 surface that
   references these files), never by editing the recovered files.
3. **Group-1 donor-verbatim pins.** The donor-verbatim/blob pins on
   `iips-platform/src/integration/EngineRegistry.ts` and
   `iips-platform/src/integration/EngineApiAdapter.ts` (in `tests/engine_registry_wiring.test.ts`)
   are retired **only** for the bounded three-engine adoption change and MUST be replaced by
   B1-specific integrity/provenance assertions. No unrelated donor pin may be weakened.
4. **10-engine comments.** Gate B may update the four stale "10-engine" comments so documentation
   reflects the resulting 13-engine registry, exactly:
   - `frontend/server/research-sector-transport.ts` (line 74 block)
   - `frontend/src/app/App.tsx` (line 130 block)
   - `frontend/src/app/navigation.ts` (line 132 block)
   - `frontend/src/app/routes.ts` (line 45 — the Group 1 Engine Registry comment only; the separate
     UI06/A4 `routes.ts` comment remains untouched)

   These four blocks are reproduced verbatim in `tests/engine_registry_gate2_baseline.ts`
   (`GATE2_ADDITIONS`); their update therefore requires the corresponding bounded re-pin of that
   baseline under Gate B. The registry's own header comments (`EngineRegistry.ts` lines 4 and 44)
   and the adapter provenance string are part of the registry/provenance change, not of these four.
5. **API semantics.** `provenance.certifiedCount` is retained for compatibility. Gate B MUST add an
   explicit lineage distinction so the API cannot imply that all 13 engines share one certification
   lineage. The three adopted engines MUST remain explicitly distinguishable as:
   - IES-016 = historical A1 lineage / B1 adoption pending certification
   - IES-017 = historical A1 lineage / B1 adoption pending certification
   - IES-020 = historical A1 lineage / B1 adoption pending certification

   They MUST NOT be claimed as B1-certified. `/api/engines` continues to carry
   `X-IIPS-Certification: NONE CLAIMED` unless and until a Gate C determination states otherwise.

## 4. Gate Sequence — NO AUTOMATIC PROGRESSION

Only the following gates are authorized, strictly in sequence. Gate A must be separately completed
and durable (commit, push, LOCAL == REMOTE, clean worktree) before Gate B is opened. Gate B must be
separately completed and durable before Gate C is opened. Each gate must be explicitly opened; this
act does not itself open or execute any gate's mutation.

### GATE A — Certified Asset-Pack Recovery & Provenance

Authorizes recovery into B1 of the 90 missing certified-pack objects (30 × IES-016, 30 × IES-017,
30 × IES-020) from the authoritative irr certified lineage at `c2dda91`, at the Decision 1 paths.

Requirements:
- byte-exact recovery (git blob identity preserved);
- preserve all source contents; no normalization; no correction; no deletion;
- preserve the IES-017 stale-pack values exactly (`AUTOMOBILE_DISCOVERY_PACK.md` §7: AB-002 `74.9`,
  AB-009 `71.9` vs frozen `74.8` / `71.8`) — discrepancy remains registered OPEN;
- verify all 36/36 freeze-manifest `documentHashes` pins (12 per engine) under the manifests' own
  stated `hashNormalization` convention;
- record source repository / commit / tree / blob provenance for every recovered object;
- label the pack readiness certificates per Decision 2.

The 4 pack objects per engine already present in B1 (calibration, expected outputs, golden
reference, validation fixtures) are byte-identical to the pack copies; the existing B1 copies under
`iips-platform/src/sector-engines/` are not modified, moved, or deleted.

### GATE B — B1 Three-Engine Implementation / Registry Adoption

Only after Gate A is durably complete, authorizes the bounded 10→13 `EngineRegistry` adoption for
exactly `sector.telecommunications`, `sector.automobile`, `sector.materials-metals`.

Authorizes only:
- three registry imports (the existing `TELECOMMUNICATIONS_ENGINE_ID`, `AUTOMOBILE_ENGINE_ID`,
  `MATERIALS_METALS_ENGINE_ID` constants);
- three registry entries;
- `freezeManifest` references to the Gate A recovered manifests;
- existing A2 `readinessCertificate` references (`iips-platform/IES016_FINAL_READINESS_CERTIFICATE.md`,
  `IES017_…`, `IES020_…`, unmodified);
- bounded provenance/API update, including the Decision 5 lineage distinction;
- bounded test re-pinning (ER-02 10→13 at equal or greater strength; removal of only the three B1
  IDs from `FORBIDDEN_IDS`; D42 IDs `sector.telecom` / `sector.auto` / `sector.materials` and the
  D42 import guard remain forbidden; Decision 3 replacement assertions; Decision 4 baseline re-pin;
  no test weakened or deleted);
- the four stale documentation comments (Decision 4).

Does NOT authorize: engine-code modification; calibration modification; frozen-asset modification;
unrelated registry changes; D42 IDs; any other engine; execute exposure (no
`POST /api/engines/:id/execute`); production; release; promotion; tagging; provider activation;
D115; Dhan; NSE.

### GATE C — B1 Three-Engine Certification

Not executed and not implied by this act. Gate C must later establish B1-native evidence and make a
separate certification determination. Nothing in Gate A or Gate B constitutes B1 certification.

## 5. Historical A1 Certification

Historical A1 certification remains anchored to the `phase13-next` implementation objects and the
irr governance records cited in §1. It is not rewritten, re-dated, re-issued, copied, or
retroactively transferred into B1 by this act or by Gates A/B. No A1 certificate record and no
Integration Verification Matrix file is copied into B1. B1 adoption requires its own
identity/provenance record.

## 6. D7 Qualifications — Carried Forward Unchanged

Adoption does not close, narrow, or omit any D7 qualification. Every Gate A/B/C record must carry:
- D7 independence **OPEN / NEGATIVE**;
- adjudication source artifact (SHA-256 `2296764a…`, 13,755 bytes) **unrecoverable**;
- Q5 — OUTSIDE CERTIFICATION CRITERION;
- DF-1 — NON-BLOCKING (byte identity not claimed);
- 33/33 manifest qualification — NON-BLOCKING;
- IES-020 §28 — Q1/Q2/Q3/Q5 OUTSIDE CERTIFICATION CRITERION, Q4 NON-BLOCKING;
- IES-017 stale-pack — registered OPEN;
- adjudicator non-independence (material limitation).

## 7. D42 — Partial Supersession Only

`group2-d42-canonical-id-2026-09-25-001` §4 items 6 ("The frozen 10-engine registry is not
modified") and 7 ("The registry is not expanded from 10 to 13") are superseded ONLY for the narrowly
bounded IES-016/017/020 10→13 adoption scope of §4 Gate B, and ONLY when Gate B is explicitly
opened. Until then they remain in force without exception. D42 §4 item 10 is satisfied by the
separate Gate B (implementation) and Gate C (certification) of this act.

Everything else in D42 remains binding, including: B1 IES-016/017/020 implementations and IDs remain
canonical for B1; D42 implementations remain HISTORICAL CAPABILITY — NOT B1 CONNECTED; D42 IDs remain
unexposed; B1 engine implementations are not replaced; Executive, Decision Matrix, Cross-Sector,
Evidence, and the replay baseline are not altered; D42 certification is not transferred.

## 8. Explicit Non-Effects

- PRODUCTION / RELEASE / PROMOTION AUTHORITY: **NOT GRANTED**. No tagging.
- NOT provider activation; NOT live data; NOT D115, Dhan, or NSE authorization.
- NOT a B1 certification claim; NOT an A1 transfer.
- NO execute exposure. EXECUTION CODE PRESENT IN RECOVERED DONOR — NOT EXPOSED / NOT ROUTED / NOT
  CALLED / NOT AUTHORIZED.
- NO change to D7 governance, GovTip, or the D7 P1 pathway.
- NO product code, test, API, registry, asset, route, navigation, baseline, or production
  configuration change by this record. This file is the sole change in its commit.

## 9. Re-opening

Any engine, object, or change beyond this bounded scope requires a new explicit RAMKI authority act.
