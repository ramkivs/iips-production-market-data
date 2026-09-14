# Program v1.1 Replay Baseline — Source Provenance Record

**Authority Decision:** WIN-UI-REPLAY-BASELINE-PROVENANCE-01 (Option A)
**Decision Date:** 2026-09-14
**Authority:** Arena Agent (authorized by Program Authority delegation for verification workspace establishment)

---

## Artifact Identity

| Property | Value |
|----------|-------|
| **Path** | `program-v1.1-certification/PROGRAM_v1.1_REPLAY_BASELINE.json` |
| **Size** | 10,680 bytes (384 lines) |
| **SHA256** | `503bf01e5883a9f9bdb47fc8de756420818659033ac26a73150195907c7b9fbf` |
| **Baseline ID** | `program-v1.1-replay-baseline` |
| **Version** | `1.0.0` |
| **Date** | `2026-08-09` |
| **Standard** | `Program v1.1 Final Certification` |
| **Sector Count** | 13 |

---

## Artifact Scope

The artifact defines the authoritative Program v1.1 replay baseline: 13 sector engines with certified replay identity (same input + contract version + calibration version + runtime configuration → identical output + evidence + metadata + replay).

### Sector Coverage (13/13)

1. Banking (`sector.banking`)
2. Insurance (`sector.insurance`)
3. Capital Markets (`sector.capital-markets`)
4. Healthcare (`sector.healthcare`)
5. Hospitality (`sector.hospitality`)
6. Energy (`sector.energy`)
7. Utilities (`sector.utilities`)
8. Consumer (`sector.consumer`)
9. Industrials (`sector.industrials`)
10. Technology (`sector.technology`)
11. Telecommunications (`sector.telecommunications`)
12. Automobile (`sector.automobile`)
13. Materials & Metals (`sector.materials-metals`)

---

## Authority Basis

### Dependency Requirement

The authoritative frontend baseline (`4b37e5b`, tracked in commit `4c834c9`) includes `frontend/server/executive-transport.ts` which requires this artifact for operation. Without the replay baseline, WIN-UI-VERIFY-01 cannot proceed (server-side verification blocked).

### Precedent

WIN-UI-IIPS-PLATFORM-PROVENANCE-01 established the governance pattern for baselining governed artifacts that exist in the workspace with extensive documentation verification but no historical Git provenance.

### Analogous Classification

This artifact is classified as a **pre-existing governed artifact** — same category as `iips-platform/`:
- Governed content with extensive documentation
- No Git provenance in this repository (never committed to any branch)
- Placed in workspace but never tracked
- Required dependency for verification

---

## Governed Evidence Establishing Identity

The artifact's identity and 13-sector parity are verified by the following governed records:

### Primary Verification

| Document | Verification |
|----------|--------------|
| **D50-R3** (AD-4 Revalidation) | Explicitly verifies all metadata: baseline ID (`program-v1.1-replay-baseline`), version (`1.0.0`), date (`2026-08-09`), standard (`Program v1.1 Final Certification`), sector count (13). States: "Authoritative baseline located and inspected. ✅" |
| **D50-R4** (AD-4 Authority Closure) | Confirms file exists (11K), 13 sectors counted, 13/13 parity with ENGINE_FACTORY. States: "Baseline file: PROGRAM_v1.1_REPLAY_BASELINE.json — File exists (11K) — ✅ CONFIRMED" |
| **Track 3 Replay Certification** | Explicitly establishes this baseline as the authoritative program-level replay baseline for Track 3 certification. States: "Program v1.1 Replay Baseline is established." |
| **E2E-030-AUTH-01** (Closure) | Confirms 13/13 exact parity with this baseline. States: "13/13 exact parity with PROGRAM_v1.1_REPLAY_BASELINE.json" |

### Supporting Verification

| Document | Verification |
|----------|--------------|
| **D25** (ADR-02 §I.1 Scope Adjudication) | Identifies file as certified replay identity for 13-engine corpus |
| **D41** (External Remediation Work Request) | Requires 13-engine parity with this baseline |
| **D45** (External Remediation Closure Evidence) | Confirms 13-engine match |
| **D50-R2** (Existing-IIPS Authority Acceptance) | Requires validation against this baseline |
| **D51** (Updated External Remediation Evidence) | Confirms 13/13 parity |
| **CHECKPOINT-02** | Classifies as "certification artifact" |
| **CHECKPOINT-03** | Classifies as "UNCHANGED" certification artifact |

### Content Verification

All internal metadata matches governed documentation exactly:
- Baseline ID: `program-v1.1-replay-baseline` ✅
- Version: `1.0.0` ✅
- Date: `2026-08-09` ✅
- Standard: `Program v1.1 Final Certification` ✅
- Sector count: 13 ✅
- Sector list: Banking, Insurance, Capital Markets, Healthcare, Hospitality, Energy, Utilities, Consumer, Industrials, Technology, Telecommunications, Automobile, Materials & Metals ✅

---

## Absence of Historical Git Provenance

### Git History

| Check | Result |
|-------|--------|
| `git log --all --full-history -- <path>` | ZERO commits |
| `git ls-tree` (all branches) | NOT TRACKED in any ref |
| `git rev-list --all` | ZERO tracked files in `program-v1.1-certification/` |
| Reachable refs (arena branch, main, p14-implementation-recovered, origin/main) | NOT TRACKED |

### Status

**No Git object or commit exists for this artifact in any reachable ref.** The artifact has never been committed to any branch of this repository.

---

## Explicit Risk Acceptance

### Accepted Risk

**Historical Git provenance does not exist.** This baseline commit represents the **first tracked state** of the artifact, not a verified reproduction from authoritative Git history.

### Rationale

1. **No alternative source exists:** No Git history, no separate repository, no other reachable ref contains this artifact. The existing untracked file is the only known copy.

2. **Permanent blocker unacceptable:** Rejecting provenance establishment (Option B) would create a permanent blocker for WIN-UI-VERIFY-01 with no resolution path.

3. **Extensive governed verification:** The artifact's identity is verified by 11+ governed documents with exact metadata match and 13-sector parity confirmation.

4. **Precedent:** WIN-UI-IIPS-PLATFORM-PROVENANCE-01 accepted the same risk for `iips-platform/` (governed artifact with extensive documentation but no Git history).

5. **Corrective authority available:** If defects are later discovered, they will be addressed through separate corrective authority acts (not by rejecting this provenance establishment).

### Explicit Statement

**This commit is the first tracked state of the artifact.** No prior Git history, provenance chain, or clean-clone verification exists. The artifact's authority derives from governed documentation verification, not from Git provenance.

---

## Purpose and Scope Limitations

### Verification-Workspace-Only Purpose

This provenance establishment is **exclusively for Windows verification workspace assembly** (WIN-UI-WORKSPACE-ASSEMBLY-02). The artifact is required by `frontend/server/executive-transport.ts` for server-side verification.

### Prohibitions

❌ **This is NOT frontend source modification.** The artifact is a governed certification baseline, not frontend application code. Establishing its provenance does not modify, alter, or extend the frontend authoritative baseline (`4b37e5b`).

❌ **This is NOT authorization to modify the artifact.** The content is preserved byte-for-byte (SHA256: `503bf01e...`). No repair, regeneration, normalization, or reformatting is authorized.

❌ **This is NOT authorization to resume WIN-UI-VERIFY-01.** Provenance establishment is a prerequisite for workspace assembly. Verification resumption requires separate authorization after workspace assembly is complete.

❌ **This is NOT authorization to modify frontend/ or iips-platform/.** Only the artifact and this provenance record are committed. No other files are staged or modified.

---

## Baseline Commit

| Property | Value |
|----------|-------|
| **Commit SHA** | [TO BE RECORDED AFTER COMMIT] |
| **Commit Message** | `WIN-UI-REPLAY-BASELINE-PROVENANCE-01: Establish provenance for Program v1.1 replay baseline` |
| **Files Committed** | 2 (artifact + provenance record) |
| **Parent Commit** | [TO BE RECORDED] |
| **Branch** | `arena/01a0853d-iips-production-market-data` |

---

## Content Integrity Verification

### Pre-Commit SHA256
`503bf01e5883a9f9bdb47fc8de756420818659033ac26a73150195907c7b9fbf`

### Post-Commit SHA256
[TO BE VERIFIED AFTER COMMIT]

### Content Changed
NO (byte-for-byte preservation required)

---

## Next Steps

After this provenance establishment:

1. **WIN-UI-WORKSPACE-ASSEMBLY-02** may proceed (workspace assembly authorized under Option A)
2. Workspace assembly will materialize:
   - `frontend/` at `4b37e5b`
   - `iips-platform/` at `1dc7c53`
   - `program-v1.1-certification/PROGRAM_v1.1_REPLAY_BASELINE.json` at [THIS COMMIT]
3. **WIN-UI-VERIFY-01** may resume after workspace assembly is complete

---

**Provenance established.** This artifact is now the authoritative Program v1.1 replay baseline for Windows verification workspace assembly.
