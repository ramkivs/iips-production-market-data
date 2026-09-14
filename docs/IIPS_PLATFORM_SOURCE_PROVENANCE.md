# IIPS Platform Source Provenance

**Authority Act:** WIN-UI-IIPS-PLATFORM-PROVENANCE-01
**Decision:** Option 1 — Establish Provenance from Existing Workspace
**Date:** 2026-09-14
**Program Authority:** Explicit authorization

---

## Designation

The existing untracked `iips-platform/` directory in the Arena workspace is hereby designated as the authoritative platform source for Windows UI verification (WIN-UI-VERIFY-01).

**Package Identity:**
- Name: `@iips/platform`
- Version: `0.1.0`
- Type: TypeScript platform runtime

**Baseline Information:**
- Baseline commit: `1dc7c53db9320fe5221fcafce0c33585bfbb33d4`
- Branch: `arena/01a0853d-iips-production-market-data`
- Repository: `ramkivs/iips-production-market-data`
- Remote: `https://github.com/ramkivs/iips-production-market-data.git`

**File Inventory:**
- Total files: 424
- Source files (src/*.ts): 151
- Test files (*.test.ts): 98
- Content aggregate hash: `826a642ee0908a89c63addbf8caf3068b967d2d8e995eb61d114715621f29b21`

---

## Authority Basis

**Dependency:** The frontend authoritative baseline (4b37e5b3fec81e06464a91ea524808d28c21acdf) contains 7 server files with 75 imports from `iips-platform/src/`:
- `frontend/server/admin-transport.ts` (27 imports)
- `frontend/server/executive-transport.ts` (27 imports)
- `frontend/server/live/live-tenant-engine.test.ts` (13 imports)
- `frontend/server/ai-advisory-transport.test.ts` (4 imports)
- `frontend/server/ai-advisory-transport.ts` (2 imports)
- `frontend/server/secured-executor.ts` (1 import)
- `frontend/server/secured-executor.test.ts` (1 import)

**Blocking Condition:** WIN-UI-VERIFY-01 (Decision B) requires the complete Windows verification workspace (frontend/ + iips-platform/). Without iips-platform provenance, verification cannot proceed.

**Source Uniqueness:** The existing untracked directory is the only known surviving copy of iips-platform source:
- No separate repository exists (`ramkivs/iips-platform` returns "Could not resolve to a Repository")
- No branch of `iips-production-market-data` contains it (0 files on main, p14-implementation-recovered, m1-ad4-repair)
- INCIDENT-03 documented permanent loss of existing-IIPS commits
- P05 boundary evidence explicitly verified "0 matches for iips-platform" in tracked files

---

## Risk Acceptance

**Historical Git Provenance: DOES NOT EXIST**

This provenance establishment explicitly accepts the following risk:

The iips-platform source has no prior git history, no provenance chain, and no clean-clone verification. The internal independent verification report (`iips-platform/reports/INDEPENDENT_VERIFICATION_REPORT.md`) explicitly flagged: "git ls-files returned 0 tracked files — the runtime, framework, banking engine, and tests exist in the working tree but were never committed" and recommended "re-verification from a clean clone."

**Rationale for Acceptance:**
1. No alternative source exists or can be obtained (Option 2 is not actionable)
2. The alternative (permanent blocker) is unacceptable for program progression
3. The baseline will be established with the same rigor as UI-PROVENANCE-01 (immutable commit, provenance record, tracking)
4. This is analogous to the frontend/ provenance establishment, which also baselined previously-untracked workspace content
5. If defects are later discovered in the iips-platform source, they will be addressed through a separate corrective authority act (not by rejecting this provenance establishment)

**Condition:** This provenance record explicitly documents that historical Git provenance does not exist for iips-platform source. The baseline commit represents the first tracked state, not a verified clean-clone reproduction.

---

## Scope

**Authorized:**
- Tracking existing iips-platform/ content in Git
- Creating immutable baseline commit
- Recording provenance metadata
- Preserving all source content byte-for-byte

**Not Authorized:**
- Source modification
- Dependency copying
- Source repair
- Refactoring
- Tests that modify source
- UI verification
- Workspace assembly
- WIN-UI-VERIFY-01 resumption

---

## Verification

**Pre-tracking content hash:** `826a642ee0908a89c63addbf8caf3068b967d2d8e995eb61d114715621f29b21`
**Post-tracking content hash:** `826a642ee0908a89c63addbf8caf3068b967d2d8e995eb61d114715621f29b21`
**Byte-for-byte preservation:** ✅ CONFIRMED (all 424 file hashes identical)

**Durability Verification:**
- Local HEAD: `1dc7c53db9320fe5221fcafce0c33585bfbb33d4`
- Remote HEAD: `1dc7c53db9320fe5221fcafce0c33585bfbb33d4`
- Synchronization: ✅ CONFIRMED
- Baseline reachability: ✅ CONFIRMED (reachable from remote)
- Files tracked: 424 iips-platform/ files + 1 provenance record

---

## Next Steps

After this provenance establishment:
1. A separate authority act may authorize workspace assembly (frontend/ + iips-platform/)
2. After workspace assembly, WIN-UI-VERIFY-01 may resume under its existing authorization
3. Any defects discovered during verification will be addressed through separate corrective authority acts

---

**Status:** PROVENANCE ESTABLISHED ✅
**Baseline SHA:** `1dc7c53db9320fe5221fcafce0c33585bfbb33d4`
**Durability:** ✅ CONFIRMED (local/remote synchronized, baseline reachable)
**Content Preservation:** ✅ CONFIRMED (byte-for-byte, all hashes identical)
