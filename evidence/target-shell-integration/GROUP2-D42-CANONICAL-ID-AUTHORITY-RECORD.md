# Institutional Investment Platform System (IIPS)
# Group 2 — D42 Engine-ID Canonicalization: Authority Decision Record

**Decision ID:** `group2-d42-canonical-id-2026-09-25-001`
**Governing Authority:** RAMKI (Designating Authority)
**Recording Agent:** Arena (recording only — no implementation)
**Act Type:** AUTHORITY DECISION RECORD (non-executable; canonicality for the B1 product line)
**Recorded At (local, Asia/Calcutta):** 2026-09-25
**Baseline SHA:** `f1d04105259a7abac6bb2b87952a1fbfc758a2df` (Group 1 Engine Registry — CLOSED / ACCEPTED / DURABLE)
**Antecedent:** `GROUP-2 D42 ENGINE-ID CANONICALIZATION FORENSIC GATE` (read-only) — disposition `REQUIRES CANONICAL-ID AUTHORITY`

---

## 1. B1 Canonical Implementation Lineage

| Item | Value |
| --- | --- |
| Engines | IES-016 `sector.telecommunications` · IES-017 `sector.automobile` · IES-020 `sector.materials-metals` |
| Location | `iips-platform/src/sector-engines/{telecommunications,automobile,materials-metals}/` (33 files) |
| Entered B1 | `ea70a8c` (Stage 4 Executive and foundational transport controlled recovery) |
| Origin | byte-identical to `ramkivs/iips-review-recovered` 08-20 commits `9bf91d1` / `d51b120` / `6355949` (`gai-impl-canonical`, `phase13-next`) |
| B1 consumers | `src/transports/executive_transport.ts` via `PROGRAM_v1.1_REPLAY_BASELINE.json` blob `63bcd350` (13 sectors) → Executive, Decision Matrix, Cross-Sector, Evidence |
| Evidence in B1 | `iips-platform/IES0{16,17,20}_FINAL_READINESS_CERTIFICATE.md` — "role-separated … NOT AN A1 PROMOTION"; no freeze manifests present in B1 |
| External-lineage A1 records | `b711e4c` (`arena/01a03e3b`), `d1f8bf0` (`phase13-next`) — recorded, not transferred |

## 2. D42 Historical Lineage (`ramkivs/iips-review-recovered`, `main` / tag `program-v1.2.0`)

D36 historical-source acceptance → D38 `3165065` freeze (baseline v1.1.0 `83faf4f4`) →
D42 decision `6d4dbc1` → D42 implementation `6a5d7cc` (`sector.telecom` / `sector.auto` /
`sector.materials`, registry 10→13) → `eee39d3` Track 8 → `e156cf6` E2E-025→029 →
`67e89aa` E2E-030 13-engine delta → `5decdca` `program-v1.2.0` release.
Root-disjoint from the B1 lineage; zero shared blobs across the 33 + 33 engine files.

## 3. Collision Dimensions

| Dimension | Collides |
| --- | --- |
| Engine ID strings (`sector.telecom` vs `sector.telecommunications`, etc.) | No |
| IES identifiers 016 / 017 / 020 | **Yes** |
| Sector-family names (Executive keys by sector name) | **Yes** |
| Calibration profile names (same names, different content) | **Yes** |
| `program-v1.1-certification/PROGRAM_v1.1_REPLAY_BASELINE.json` (`63bcd350` vs `83faf4f4`) | **Yes** |
| `iips-platform/src/integration/EngineRegistry.ts` (`23f3622f` vs `786f08ae`) | **Yes** |
| `iips-platform/src/integration/EngineApiAdapter.ts` (`16cf2aeb` vs `99ccf7f2`) | **Yes** |
| Engine directories (`telecom/` vs `telecommunications/`, etc.) | No |

## 4. Decision

1. B1's existing IES-016/017/020 implementations remain **CANONICAL FOR B1**.
2. B1 engine IDs remain `sector.telecommunications`, `sector.automobile`, `sector.materials-metals`.
3. D42 implementations remain **HISTORICAL CAPABILITY — NOT B1 CONNECTED**.
4. D42 IDs `sector.telecom`, `sector.auto`, `sector.materials` remain unexposed.
5. B1 engine implementations are not replaced.
6. The frozen 10-engine registry is not modified.
7. The registry is not expanded from 10 to 13.
8. Executive, Decision Matrix, Cross-Sector, Evidence, the replay baseline, and existing Group 1 tests are not altered.
9. D42 certification is **not** transferred into B1.
10. Any future 13-engine expansion requires a separate implementation + certification gate.

## 5. Scope

Canonicality of IES-016/017/020 engine identity for the B1 product line only.
Record-only; this file is the sole change in its commit.

## 6. Explicit Non-Effects

- NOT a judgment that D42 is invalid; its certification remains valid within its own lineage.
- NOT production authorization; NOT provider activation.
- NOT D115, Dhan, or NSE authorization.
- NOT a certification claim for B1 (`/api/engines` remains `X-IIPS-Certification: NONE CLAIMED`).
- NO product code, test, route, navigation, registry, baseline, or ID change; no compatibility aliases.
- EXECUTION CODE PRESENT IN RECOVERED DONOR — NOT EXPOSED / NOT ROUTED / NOT CALLED / NOT AUTHORIZED.

## 7. Future Re-opening Condition

Re-opening requires a new explicit RAMKI authority act that (a) names the canonical
implementation and IDs for any engine beyond the frozen 10, (b) authorizes a separate
implementation gate for registry expansion, and (c) authorizes a separate certification gate
for that expansion. Absent such an act, this decision stands.
