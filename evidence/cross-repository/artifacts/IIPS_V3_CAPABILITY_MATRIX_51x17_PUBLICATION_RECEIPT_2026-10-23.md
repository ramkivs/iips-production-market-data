# IIPS v3.0 — 51 × 17 Capability Matrix: Publication Receipt

| Field | Value |
|---|---|
| **Record ID** | `IIPS-V3-CAPMATRIX-51X17-PUBLICATION-RECEIPT-2026-10-23-01` |
| **Record type** | Publication receipt. Documentation only; renders no authority, gate, fence, admission, acceptance, qualification or release decision |
| **Date** | `2026-10-23` (UTC) |
| **Repository** | `ramkivs/iips-production-market-data` |
| **Branch** | `arena/da79277e-iips-production-market-data` |
| **Artifact commit (current)** | **`4e47e332e6bb22f1a7a8b28ee44df9c2e9f6d0de`** |
| **First artifact commit (superseded — see §5)** | `f8f5afc982b10b49912920d6299ce7e7aae98d18` |
| **Base commit** | `ddaaef98a4f641628ee0e0c7eb5cff08bac206ba` (`main`, tree `29cdf772527ddd1519e263af79c7babd023c75e3`) |
| **Companion record** | `evidence/cross-repository/IIPS_V3_CAPABILITY_MATRIX_51x17_RECONSTRUCTION_2026-10-23.md` |
| **Self-reference rule** | This receipt is a **separate commit** so the artifacts it hashes are never mutated after hashing. Earlier states remain retrievable from their own commits |

---

## 1. Published artifacts at `4e47e332e6bb22f1a7a8b28ee44df9c2e9f6d0de`

| Artifact | Git blob (SHA-1) | Raw SHA-256 | Bytes |
|---|---|---|---|
| `evidence/cross-repository/IIPS_V3_CAPABILITY_MATRIX_51x17_RECONSTRUCTION_2026-10-23.md` | `90131a0501f2e8502d29c576e595b1eb4f6f3cff` | `b73b4db23a3bd860a14b1d76f18d068926ffcaf2d858f855d80199989a1d2408` | 82,992 |
| `evidence/cross-repository/artifacts/IIPS_V3_CAPABILITY_MATRIX_51x17_2026-10-23.csv` | `b02d5859022a1531a0af38d3154188c4b7f62b6b` | `9ae7138682d59c3e86822070be05123c7536fe72d468f734142cfc5ac4a65b50` | 38,300 |
| `evidence/cross-repository/artifacts/IIPS_V3_CAPABILITY_MATRIX_51x17_2026-10-23.xlsx` | `bd3d3a3df322d4f4896f8b69988bd67dd06741d9` | `b3fa8fcb4e053c4361f6fab015916e87ea8870e73b715fa86a41e9789ce50c50` | 25,566 |

Line endings: `.gitattributes` enforces `text eol=lf` for `*.md` and `*.csv`; the CSV was generated with LF terminators, so committed blob, working tree and SHA-256 are byte-identical. `*.xlsx` is detected as binary and is not transformed.

## 2. What was verified before publication

- **Exactly 51 data rows**, numbered **1–51**, with all capability names **verbatim** from the required inventory (including the Unicode arrows in rows 20, 33 and 40).
- The header row is the **exact 17 required columns in the required order**.
- Every row carries **all 15 assessment dimensions** (18 fields per row) — 51/51 verified programmatically.
- Markdown, CSV and XLSX are generated from **one data source**; MD↔CSV cell mismatches **0**, XLSX↔CSV text-cell mismatches **0** (the `#` column is numeric in XLSX, string in CSV — semantically identical).
- Disposition buckets in report §E sum to **51**, each row counted once.
- No cell grants authority, acceptance, qualification or release. The report states that **no row is release-ready for production**.

## 3. Scope of this publication

Documentation only. It does not modify source, tests, scripts, schemas, routes, fences or dependencies; does not lift or alter any `503` fence (`98147054…`, `51704c12…`, `cb8db45d…`, `e6b57bb8…` re-hashed unchanged); and does not modify the IRR repository. The IRR master tracker §18 remains the program's matrix of record; the corrections implied by report §C (D-01, D-04) are recorded as follow-on actions for an authorized IRR pass. No prior governed record is superseded.

## 4. Post-merge verification

Post-merge remote read-back is reported in the publishing session and, where a durable record is required, in a follow-on receipt rather than by mutating this file.

## 5. Correction record `CR-01` — superseded first publication

**What happened.** The first publication (artifact commit `f8f5afc982b10b49912920d6299ce7e7aae98d18`, merged to `main` as `b8218eea22d73c55de3265e542b4d274f89349ce`) was retrieved independently after merge and its 51 names were compared against the required inventory. **Three names did not match verbatim** because ASCII arrows had been used where the inventory specifies Unicode arrows:

| Row | Published (wrong) | Required |
|---|---|---|
| 20 | ``PIT read seam + `/api/pit/market-data` (IRR <-> IPD, Gate 43)`` | `… (IRR ↔ IPD, Gate 43)` |
| 33 | ``Owner->G24 binding chain `P-2` -> `P-4` -> `P-6` -> `P-8` (IRR + IPD)`` | `Owner→G24 … `P-2` → `P-4` → `P-6` → `P-8` (IRR + IPD)` |
| 40 | `Certified-analytics <-> user-portfolio integration` | `Certified-analytics ↔ user-portfolio integration` |

**Superseded artifact identities (preserved, not deleted).**

| Artifact | Superseded blob | Superseded SHA-256 | Bytes |
|---|---|---|---|
| Report | `6826592dbcd3131a8792dfd7cd35ac6b829bbb08` | `a5205c4a3755370371773168e486ebde9700a9a7945554d73c0e838e4ec6400b` | 82,870 |
| CSV | `7d134c615404a1c25f9756e04ede8601ccbba0d8` | `f6a28a06df903f3f4362edccc7d824de2e4233ca3d83bd41a14c9fe4f307436f` | 38,296 |
| XLSX | `2a3453aabec20c5e3a0baa97bd7bae3ceee863b2` | `4b79465d46fe2e29aad01bd43478926babf375053c3a4954e5fd91bcbc5f8596` | 25,564 |

**What did not change.** No status, disposition, dimension assessment, evidence anchor, count or conclusion changed. The correction is confined to the three name strings and one wording fix in report §F describing the XLSX `#`-column type.

**Lesson recorded.** The completeness check "capability names match the inventory" must be executed **against the published bytes**, character-exact, not against the authoring source — an encoding-level difference survives every structural check that only counts rows and columns.
