# D05 Wave-3 — Acquisition tooling (corrected 2026-11-07)

Corrected counterpart of the `D05_Source_Acquisition_Tools.zip` shipped inside
`evidence/D05-Wave3/D05_Wave3_EQ_Source_and_Evidence_Bundle_2026-11-07.zip`. The bundle's
original bytes are retained unmodified in the bundle for provenance; the corrections below
align the tool with the merged acquisition contract (PR #138 / execution record Amendment A-2).

## What was wrong in the bundled tool
1. Asked for an **NSE Indices classification PDF** as a taxonomy input. No tool consumes a PDF
   (spec EA in `src/audit/source_readiness.ts`); the taxonomy input is a CSV.
2. Asked for a **separate per-ISIN industry-mapping CSV**. The single taxonomy CSV
   (`industry` + `sector` keyed by `isin`, or by `cin` bridged through MCA) **is** that mapping.
   There is no second mapping stage anywhere in the architecture.
3. Never asked for the actual required taxonomy CSV spec; the mapping prompt would have
   registered an artifact the readiness run cannot use for `industry`/`sector`.
4. The MCA prompt predated the current-as-of-act-date licensing rule; updated.

## Corrected flow (unchanged semantics)
1. `Acquire-D05-Sources.ps1` — downloads the NSE CM equity master (EQ is the Tier-2 filter
   applied downstream; SME remains opt-in), downloads the NSE tick-policy circular strictly as
   **policy evidence** (never a tick-rule file), then registers operator-selected files:
   BSE Equity/Active CSV, current licensed MCA company-master CSV, the single taxonomy CSV,
   optional dated per-ISIN tick-rules CSV (leave blank to use an act-bound uniform tickSize).
2. `Verify-D05-SourceDrop.ps1` — recomputes SHA-256 against the manifest; unchanged logic.

## Caveats (unchanged)
- SHA-256 establishes post-acquisition integrity, not publisher authenticity. The effective/as-of
  dates, exact URLs and licensing basis are recorded separately by the operator.
- Neither script validates schemas, produces `DEPOSITION_READY`, modifies IPD or authorizes
  deposition. Run the merged source-readiness tool only after reviewing formats, provenance,
  effective dates and licensing.
- Do not modify files inside the evidence bundle; copy and correct, never byte-edit.
