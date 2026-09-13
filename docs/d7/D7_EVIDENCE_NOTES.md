# D7 — EVIDENCE NOTES: CITATION-DRIFT RECORD

**Informational only.** No file was corrected in this run. This is a documentation note for a
future evidence-citation cleanup.

---

## CD-01 — `LiveDataRuntime.ts` merge-line citation

| Field | Value |
|---|---|
| **Cited in D4 / D5** | `iips-platform/src/distributed/LiveDataRuntime.ts:**76**` |
| **Observed in current existing-IIPS clone** | `iips-platform/src/distributed/LiveDataRuntime.ts:**78**` |
| **Repository** | **Same** — `iips-review-recovered` |
| **Commit baseline** | **Same** — HEAD `5decdca`, unchanged since D3 |
| **Code at the cited location** | **Same** — `const inputs = { ...bound.data.fields, ...bound.companyInputs };` |
| **Behaviour** | **Same** — unguarded flat merge; `companyInputs` spread last; silent overwrite; no error, no warning, no lineage record |
| **Nature of discrepancy** | **Line-number citation only** |

### Explicit non-impacts

| Dimension | Impact |
|---|---|
| Authority impact | **NONE** — no ADR, decision, status or authority classification changes |
| Methodology impact | **NONE** |
| Contract conclusion changed | **NONE** — the ADR-01 justification (live NFR-04 violation via unguarded merge) is unaffected |
| Disposition changed | **NONE** |
| Evidence validity | **UNAFFECTED** — the finding is confirmed present, at a marginally different line offset |
| Collision census (52 coded / 54 free-form) | **UNAFFECTED** |
| ADR-01 status | **UNCHANGED — PENDING RAMKI/SAI** |

### Origin

The `:76` citation entered the D4 package during the D1/D3 evidence phase and was carried
forward into D5. The current clone reports the same statement at `:78`. Both readings are of
commit `5decdca`; the difference is a citation-capture offset, not a change in the source.

### Disposition

**Deferred to a future evidence-citation cleanup run.** Correcting it now would require
modifying D4 and D5, which this run is prohibited from doing (D7 rule 20 and the D7 scope
limiting writes to `docs/d7/`).

**Recommended future action:** in a dedicated citation-cleanup run, re-verify the line number
against the pinned commit and update the citation in
`docs/d4/D4_07_FIELD_NAMESPACE.md`, `docs/d4/D4_04_INGRESS_CONTRACT_DELTA.md` and
`docs/d5/ADR-01_NAMESPACE_COLLISION_GUARD.md`. Best practice for the corrected citation is to
pin it as `LiveDataRuntime.ts:<line> @ 5decdca` so future drift is self-evident.

**No existing-IIPS file, no D4 file and no D5 file was modified in this run.**
