# Institutional Investment Platform System (IIPS)
# GATE-PHASE-2-EVIDENCE-PAYLOAD-FORENSIC — Read-Only Forensic Determination

**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01
**Gate ID:** `GATE-PHASE-2-EVIDENCE-PAYLOAD-FORENSIC`
**Authority Holder:** RAMKI — designated surface **EVIDENCE**, path **L (LOCAL / OFFLINE)**
**Gate Type:** READ-ONLY FORENSIC PRE-FLIGHT (non-implementation)
**Implementation Authority:** **NOT GRANTED**
**Executed At (local, Asia/Calcutta):** 2026-09-22
**Baseline HEAD:** `1026a76aaf2c7043a7130a3006a46eb9a0413312`

---

## FINAL CLASSIFICATION

> # **B. NO GOVERNED OFFLINE EVIDENCE PAYLOAD SOURCE FOUND — FAIL CLOSED**

The repository contains genuine, cryptographically real governance provenance. It does **not**
contain **per-company product provenance**, which is what `ui11_provenance_auditor` requires.
The two are different artifacts serving different purposes, and no governed join between them
exists.

---

## 0. REPOSITORY INTEGRITY (read-only proof)

| Check | Pre-work | Post-work |
| --- | --- | --- |
| HEAD | `1026a76a…3312` | `1026a76a…3312` |
| Root tree | `8e81cac27ea273fec5fefe6a241a57ca7343664d` | `8e81cac27ea273fec5fefe6a241a57ca7343664d` **IDENTICAL** |
| Worktree | CLEAN | CLEAN |
| `src/identity` | `9080e997` | `9080e997` |
| `src/d114` | `0062ad52` | `0062ad52` |
| `frontend/src/features/portfolio` | `8491efdc` | `8491efdc` |
| `src/ui` | `1597ed06` | `1597ed06` |
| Intelligence surface / nav | PRESENT / `partial` | PRESENT / `partial` |
| Evidence nav | `future` | `future` (unchanged) |
| Regression | 413/413, 65 suites | 413/413, 65 suites, 0 failures |

Root tree hash identical pre/post ⇒ **zero file modifications**. No synthetic data created.

---

## 1. EXACT `ui11_provenance_auditor` INPUT CONTRACT (Q1)

```ts
UI11ProvenanceAuditorBuilder.build(params: {
  provenance:     ExecutiveProvenance;   // REQUIRED
  companyId:      string;                // REQUIRED
  companyName:    string;                // REQUIRED
  vendorTier?:    string;                // optional → defaults 'OFFLINE_BOOTSTRAP' (NFR-06 masked)
  versionVector?: Record<string,string>; // optional → defaults engine/schema/securityMaster versions
  tenantId?:      string;                // optional → falls back to provenance.tenantId
  correlationId?: string;                // optional → falls back to provenance.correlationId
  viewportWidth?: number;                // optional → 1280
}): UI11ProvenanceAuditorViewModel
```

**Three required inputs.** Notably narrower than Executive (3 DTO aggregates) and Intelligence
(1 DTO aggregate): UI11 consumes **provenance itself**, with **no DTO aggregate at all**.

Output derives `asOf`/`evaluatedAt` from `provenance.evaluatedAt`, `lineageHash` from
`provenance.lineageDigest`, `sourceClassification` from provenance, and the quality indicator
from `provenance.quality`. **Every substantive output field traces to the provenance input** —
so the provenance object *is* the payload.

---

## 2. `ExecutiveProvenance` CONTRACT (Q2)

| Field | Required | Type / constraint |
| --- | --- | --- |
| `sourceClassification` | **YES** | `'CANONICAL_MARKET_DATA' \| 'REAL' \| 'DERIVED' \| 'CERTIFIED_ENGINE'` |
| `asOf` | **YES** | ISO-8601 UTC |
| `evaluatedAt` | **YES** | ISO-8601 UTC |
| `dataVersion` | **YES** | governed version string |
| `lineageDigest` | **YES** | **Cryptographic SHA-256** |
| `quality` | **YES** | `'GOOD' \| 'STALE' \| 'PARTIAL' \| 'UNAVAILABLE'` |
| `replayConstraintApplied` | **YES** | boolean (AD-17) |
| `replayConstraintText` | no | AD-17 text when applicable |
| `correlationId`, `tenantId` | no | — |

**Seven required fields.**

---

## 3. IDENTITY REQUIREMENTS (Q3, Q7) — **SATISFIABLE**

This is the one axis where Evidence is materially better positioned than Intelligence was.

- `evidence/operator_drop/d05_security_master_broad_universe.json` — **2,250 governed records**,
  each carrying **both** `companyId` (governed form `EQ_RELIANCE_IN`, `EQ_INFY_IN`) **and**
  `companyName` ("Reliance Industries Limited").
- Authorizing act present and explicit:
  `authorizationRef = AUTH-D05-BROAD-UNIVERSE-MASTER-EXPANSION-ACT-2026-09-22-001`,
  `batchId = BATCH-D05-TIER2-BROAD-UNIVERSE-2026-09-22-001`,
  `fileChecksumSha256 = 7f53540b6532e7718e3a03a729766c12c73cc2549e450e3c2f356aa64a2b74b5`,
  `operatingMode = OFFLINE_BOOTSTRAP`, `recordCount = 2250`.

**Finding:** UI11's `companyId` + `companyName` inputs **can be satisfied from governed D05
data under an existing authorizing act**. Unlike Phase 1C — where the fixture identity `INFY`
was a bare exchange symbol — the governed D05 identity is available in canonical form.

**This is 2 of 3 required inputs. The third is where the gate fails.**

---

## 4. GOVERNED ARTIFACTS UNDER `evidence/` (Q4, Q5)

Inventory: **13 subsystem directories, 67 files, 34 JSON artifacts.**

Systematic scan for `ExecutiveProvenance`-shaped fields across all evidence JSON:

| Artifact | Provenance-shaped fields present |
| --- | --- |
| `evidence/p17/p17-certification-report.json` | `lineageDigest` |
| `evidence/d114/historical-acquisition-manifest.json` | `evaluatedAt` |
| `evidence/d114/historical-reconciliation-report.json` | `evaluatedAt` |
| `evidence/d114/historical-reconciliation-report-dual-era.json` | `evaluatedAt` |
| `evidence/d114/stage5-ui-read-only-qualification-report.json` | `evaluatedAt` |
| `evidence/d114-legacy/historical-acquisition-manifest.json` | `evaluatedAt` |
| `evidence/d114-legacy/historical-reconciliation-report.json` | `evaluatedAt` |
| *(all other 27 JSON artifacts)* | none |

### Strongest candidate adjudicated: `evidence/p17/p17-certification-report.json`

Carries **four real SHA-256 `lineageDigest` values** plus a `finalReleaseIntegrityDigest`.
Inspection of what those digests are **over**:

```
certifiedBaselinesReconciliation[0] → P13 (Product UI Data Integration),   commit 94ad0e3
certifiedBaselinesReconciliation[1] → P14 (UI/UX Accessibility & Layouts), commit e6ec2ca
certifiedBaselinesReconciliation[2] → P15 (E2E Lineage & Degradation),     commit 854aa08
certifiedBaselinesReconciliation[3] → P16 (Operational Qualification),     commit 96814fd
```

**These are digests over PROGRAM CERTIFICATION PACKAGES — software delivery milestones — not
over any company's market data.** `certificationId = P17-CERT-2026-09-21-001`;
`packageId = WS-G / Package P17 — Final Program Release Manifest Compilation`.

---

## 5. GOVERNANCE RECORD vs PRODUCT DATA (Q6) — **THE DECISIVE FINDING**

`UI11` renders provenance **for a company**: `tableCaption` is
*"Cryptographic Lineage & Governance Provenance Audit for {companyName}"*. The
`lineageDigest` it displays must be the digest **of that company's data lineage**.

Machine-verified join test across **every** evidence JSON artifact:

| Artifact | `lineageDigest` | `companyId` | **BOTH** |
| --- | --- | --- | --- |
| `p17/p17-certification-report.json` | **YES** | no | **NO** |
| `operator_drop/d05_security_master_broad_universe.json` | no | **YES** | **NO** |
| `bi04/governed-multi-broker-atomic-merge-charter.json` | no | **YES** | **NO** |
| `operator_drop/windows_bi08_visual_acceptance_manifest.json` | no | **YES** | **NO** |
| `operator_drop/windows_visual_acceptance_manifest.json` | no | **YES** | **NO** |
| `release-v1.0.0-rc1/release-signoff-and-archival-manifest.json` | no | **YES** | **NO** |

> **ZERO artifacts carry both a lineage digest and a company identity.**

The provenance that exists describes **the program** (were P13–P16 certified? is the archive
intact?). The provenance UI11 needs describes **a company's data** (what is the lineage of
Reliance's evaluated market data, as of when, at what quality?). Joining a program
certification digest to a company identifier would **assert a lineage relationship that does
not exist** — fabrication by composition, prohibited by this gate.

### Field-level completeness against the required contract

Best governed candidates measured against all 7 required `ExecutiveProvenance` fields:

| Required field | `p17-certification-report` | `d05_security_master_manifest` |
| --- | --- | --- |
| `sourceClassification` | no | no |
| `asOf` | no | no |
| `evaluatedAt` | no | no |
| `dataVersion` | no | no |
| `lineageDigest` | **YES** | no |
| `quality` | no | no |
| `replayConstraintApplied` | no | no |
| **Coverage** | **1 / 7** | **0 / 7** |

The strongest governed artifact in the repository supplies **one of seven** required fields
and **zero** company identity. Six fields would have to be invented.

---

## 6. `computeLineageHash` — DERIVED, NOT AUTHORITATIVE (Q8)

`src/contracts/provenance.ts:117`:

```ts
export function computeLineageHash(
  payload: unknown,
  metadata: { sourceClassification: string; asOf: string; dataVersion: string; parentHash?: string }
): string {
  const parts = [JSON.stringify(payload), metadata.sourceClassification,
                 metadata.asOf, metadata.dataVersion];
  if (metadata.parentHash) parts.push(metadata.parentHash);
  return computeSha256(parts.join(''));
}
```

**Determination: DERIVED presentation provenance — NOT an authoritative source lineage.**

- It is a **pure function of its inputs**. It computes a digest **over a payload you already
  have**; it does not retrieve, attest, or originate data.
- `computeSha256` is a genuine NIST FIPS 180-4 implementation (isomorphic, zero-dependency,
  browser-safe) — the **cryptography is real**, but real cryptography over invented input
  yields a **real hash of a fiction**.
- Its callers (`d114/*`, `e2e/e2e_evidence_manifest.ts`) invoke it **downstream of governed
  inputs**. It is the *sealing* step of a lineage, never the *source* of one.
- Consequently `computeLineageHash` **cannot manufacture** the missing payload. Feeding it
  fabricated provenance would produce a digest indistinguishable from a governed one — the
  precise forgery risk identified in the Phase-1C determination.

---

## 7. PATH-L BOUNDARY ANALYSIS (Q10)

Had a governed payload existed, consumption could have remained inside Path L. Constraints
identified for any future authorized implementation:

| Constraint | Status |
| --- | --- |
| no API / authFetch / OIDC / Keycloak / `frontend/server` / network / credentials | **Satisfiable** — `evidence/**` and D05 data are static, on-disk |
| Browser safety | **`resolveJsonModule` is NOT enabled** (`tsconfig.json`, `module: NodeNext`) ⇒ evidence JSON is **not** directly importable today |
| Required pattern | **Build-time TypeScript module import**, per the D05 precedent (`governed_fixture_master.ts` imports `d05_broad_universe_data.js`, *"zero dynamic Node fs/path dependencies"*). Runtime `fs.readFileSync` is **not browser-safe**. |
| Current coupling | The frontend has **zero** data imports from `evidence/` — it has never been a product data source (the three matches in `frontend/src/components/evidence/` are **comments**, not imports) |

**Presentation readiness (favourable, and unaffected by this determination):** Phase 1A
already recovered dedicated Evidence components — `EvidenceTimeline`, `EvidenceRecordCard`,
`ProvenanceChain`, `SnapshotMetadataPanel`, `ReplaySummary`, `Ad17Disclosure`. **No new
presentation construction would be required.** The gap is exclusively data/authority.

---

## 8. EXISTING AUTHORITY (Q5) — WHAT IS MISSING

Repo-wide search for authorizing acts (`AUTH-*-ACT-*`) across `src/`, `docs/`, `evidence/`
returns **exactly ONE distinct act**:

```
AUTH-D05-BROAD-UNIVERSE-MASTER-EXPANSION-ACT-2026-09-22-001
```

It authorizes the **D05 security master** — identity only. Two files matched a broader
evidence/provenance search; both were verified as **incidental matches** (one is this
engagement's own Phase-1C forensic report). **No act authorizes evidence/provenance artifacts
to be consumed as product data.**

Additionally, `evidence/` artifacts self-classify as governance records:
`p17` declares `productionAuthorization = NOT GRANTED`,
`commercialProviderActivation = PROHIBITED`,
`operatingMode = OFFLINE_BOOTSTRAP / LOCAL_FIXTURE_AND_OFFLINE_DEV`.
Nothing designates them a product data source.

---

## 9. EXACT MISSING ARTIFACT / AUTHORITY

| # | Missing item |
| --- | --- |
| **E-1** | **Per-company governed provenance records.** No artifact binds a lineage digest to a `companyId`. Program-certification provenance ≠ company-data provenance. |
| **E-2** | **An authorizing act** permitting `evidence/**` governance records to be consumed as **product** provenance, or commissioning a new governed provenance dataset. Only the D05 identity act exists. |
| **E-3** | **Six of seven required `ExecutiveProvenance` fields** (`sourceClassification`, `asOf`, `evaluatedAt`, `dataVersion`, `quality`, `replayConstraintApplied`) — underivable from any governed artifact without invention. |
| **E-4** | **A governed source lineage.** `computeLineageHash` can *seal* a lineage but cannot *originate* one; it requires a governed payload that does not exist. |
| **E-5** | **`resolveJsonModule` / build-time data module** — a technical (not authority) prerequisite; evidence JSON is not importable under the current `tsconfig`. |

**Not missing (materially better than Phase 1C):** company identity (**E-0 SATISFIED**) —
2,250 governed D05 records with canonical `companyId` + `companyName` under an existing act;
and Evidence presentation components, already recovered in Phase 1A.

---

## 10. WHY A SYNTHETIC PAYLOAD CANNOT SUBSTITUTE

1. Expressly prohibited by this gate ("Do not create synthetic data").
2. A `lineageDigest` computed by `computeLineageHash` over invented provenance is a
   **cryptographically valid hash of fabricated content** — indistinguishable downstream from
   a governed digest. For a *provenance auditor surface* this is uniquely corrosive: the
   surface exists precisely to let a user verify lineage. A forged digest there does not
   merely mislead, it **defeats the control the surface implements**.
3. `sourceClassification` values (`CANONICAL_MARKET_DATA`, `REAL`, `CERTIFIED_ENGINE`) are
   governed attestations; asserting one over invented data is a false attestation.
4. D115 is WITHHELD — binding a fabricated provenance record to a `companyId` would be a
   backdoor around D115 C/D.

---

## 11. MINIMUM FUTURE DESIGN (recorded only — NOT authorized, NOT an implementation plan)

Should a future authority gate commission a governed Evidence payload, the minimum shape is:

1. An **authorizing act** (E-2), modelled on the D05 act.
2. A **governed per-company provenance dataset** (E-1, E-3) supplying all 7 required fields,
   joined to canonical D05 `companyId`.
3. Delivery as a **build-time TypeScript module** (D05 precedent), not runtime `fs`, or
   `resolveJsonModule` enabled (E-5).
4. Binding `UI11ProvenanceAuditorBuilder` in a presentation-only surface reusing the existing
   Phase-1A Evidence components.
5. `vendorTier` left at the NFR-06 masked default `OFFLINE_BOOTSTRAP` (or `MOCK_FIXTURE`),
   never a commercial tier.

---

## 12. RETAINED GOVERNANCE INVARIANTS

| Invariant | State |
| --- | --- |
| Gate outcome | **B — FAIL CLOSED** |
| Evidence surface | NOT IMPLEMENTED; nav remains `future` (unchanged) |
| Implementation authority | **NOT GRANTED** |
| Intelligence | `PARTIAL / DEFERRED DATA COMPLETION` (frozen, untouched) |
| BI-01..BI-08 | FROZEN / BI-08 AUTHORITATIVE |
| D05/P04 identity | FROZEN (read-only inspection only) |
| PortfolioWorkspace | FROZEN |
| D114 | FROZEN |
| Production fail-closed boundary | FROZEN |
| Overlays / auth seam | DEFERRED |
| D115 C / D | WITHHELD / UNRESOLVED / NOT AUTHORIZED |
| `runtimeCompanyId` | UNRESOLVED |
| `productionEligible` | false |
| External live sockets | 0 |
| Windows visual acceptance | NOT CLAIMED BY ARENA |

---

## 13. NEXT AUTHORITY ACTION REQUIRED

Evidence fails closed on **data authority**, not on presentation capability or identity. RAMKI
may:

- **(i)** Commission a **governed per-company provenance dataset** (E-1..E-4) under a new
  authorizing act — noting that, as with Intelligence, this is fundamentally an **external
  data-supply question**; **or**
- **(ii)** Authorize an **Evidence presentation-only Path-L surface** that renders the honest
  empty state with `partial` navigation status — the Intelligence precedent, delivering
  navigable structure without asserting unbacked provenance; **or**
- **(iii)** Defer Evidence (as Intelligence was deferred) and designate the next surface.

**No implementation may proceed under the current authority.**

---

**End of Forensic Determination. Gate STOPPED. No implementation performed.**
