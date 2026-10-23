# IIPS v3.0 — 51 × 17 Capability Matrix: Publication Receipt

| Field | Value |
|---|---|
| **Record ID** | `IIPS-V3-CAPMATRIX-51X17-PUBLICATION-RECEIPT-2026-10-23-01` |
| **Record type** | Publication receipt. Documentation only; renders no authority, gate, fence, admission, acceptance, qualification or release decision |
| **Date** | `2026-10-23` (UTC) |
| **Repository** | `ramkivs/iips-production-market-data` |
| **Branch** | `arena/da79277e-iips-production-market-data` |
| **Artifact commit** | **`f8f5afc982b10b49912920d6299ce7e7aae98d18`** (root tree `9e7b441595bf35fc5e087daf919d744e4dd15531`) |
| **Base commit** | `ddaaef98a4f641628ee0e0c7eb5cff08bac206ba` (`main`, tree `29cdf772527ddd1519e263af79c7babd023c75e3`) |
| **Companion record** | `evidence/cross-repository/IIPS_V3_CAPABILITY_MATRIX_51x17_RECONSTRUCTION_2026-10-23.md` |
| **Self-reference rule** | This receipt is a **separate commit** so the artifacts it hashes are never mutated after hashing. The values below identify the artifact state at `f8f5afc9…`, which remains retrievable from that commit regardless of later history |

---

## 1. Published artifacts at `f8f5afc982b10b49912920d6299ce7e7aae98d18`

| Artifact | Git blob (SHA-1) | Raw SHA-256 | Bytes |
|---|---|---|---|
| `evidence/cross-repository/IIPS_V3_CAPABILITY_MATRIX_51x17_RECONSTRUCTION_2026-10-23.md` | `6826592dbcd3131a8792dfd7cd35ac6b829bbb08` | `a5205c4a3755370371773168e486ebde9700a9a7945554d73c0e838e4ec6400b` | 82,870 |
| `evidence/cross-repository/artifacts/IIPS_V3_CAPABILITY_MATRIX_51x17_2026-10-23.csv` | `7d134c615404a1c25f9756e04ede8601ccbba0d8` | `f6a28a06df903f3f4362edccc7d824de2e4233ca3d83bd41a14c9fe4f307436f` | 38,296 |
| `evidence/cross-repository/artifacts/IIPS_V3_CAPABILITY_MATRIX_51x17_2026-10-23.xlsx` | `2a3453aabec20c5e3a0baa97bd7bae3ceee863b2` | `4b79465d46fe2e29aad01bd43478926babf375053c3a4954e5fd91bcbc5f8596` | 25,564 |

Line endings: `.gitattributes` enforces `text eol=lf` for `*.md` and `*.csv`; the CSV was generated with LF terminators so the committed blob, the working tree and the SHA-256 above are byte-identical. `*.xlsx` is detected as binary and is not transformed.

## 2. What was verified before publication

- The matrix contains **exactly 51 data rows**, numbered **1–51**, with the capability names preserved verbatim from the required inventory.
- The header row is the **exact 17 required columns in the required order**.
- Every row carries **all 15 assessment dimensions** (18 fields per row: number, name, 15 dimensions, anchor) — verified programmatically, 51/51.
- The Markdown table, the CSV and the XLSX "51x17 Matrix" sheet are generated from **one data source**, so they cannot disagree; the CSV was diffed row-by-row against the Markdown table and the XLSX cell-by-cell against the CSV.
- The disposition buckets in the report §E sum to **51**, with each row counted exactly once.
- No cell grants authority, acceptance, qualification or release. The report states explicitly that **no row is release-ready for production**.

## 3. Scope of this publication

This receipt records a **documentation** publication only. It:
- does not modify source, tests, scripts, schemas, routes, fences or dependencies;
- does not lift or alter any `503` fence (`98147054…`, `51704c12…`, `cb8db45d…`, `e6b57bb8…` re-hashed unchanged);
- does not modify the IRR repository. The IRR master tracker §18 remains the program's matrix of record; the corrections implied by report §C (D-01, D-04) are recorded as follow-on actions for an authorized IRR pass;
- does not re-render or supersede any prior governed record. Prior dated values remain true as of their dates.

## 4. Post-merge verification

Post-merge remote read-back of these artifacts at the merge commit is reported in the session that performed the publication and, where a durable record is required, in a follow-on receipt rather than by mutating this file.
