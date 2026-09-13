# External Remediation Handoff — Repository Owner Instructions

## Context

The IIPS Production Market Data Program authorized external remediation (D44) in the
Existing-IIPS repository (`ramkivs/iips-review-recovered`). The remediation was executed
successfully, producing two commits on branch `m1-ad4-repair`:

1. **M-1 REPAIR** (commit `2b4e2bd`): NamespaceCollisionGuard (ADR-01 C1-C6) + guarded merge
2. **M-2 REPAIR** (commit `83c098b`): ReplayService actual recomputation (AD-17/M-2)

However, the remediation environment (arena sandbox) cannot push these commits to the
remote repository due to HTTP 403 (no write access for `arena-ai-coding-agent[bot]`).

## Current State

- **Local branch**: `m1-ad4-repair` (exists in sandbox, will be lost when sandbox destroyed)
- **Remote branch**: Does not exist (push blocked by HTTP 403)
- **Commits**: `2b4e2bd` (M-1), `83c098b` (M-2)
- **Base**: `phase13-next` branch at commit `1a602d8`

## Required Action

The repository owner must make these commits durable on the remote repository.

### Option 1: Grant Write Access (Preferred)

1. Grant write access to `arena-ai-coding-agent[bot]` for `ramkivs/iips-review-recovered`
2. Notify the IIPS Production Market Data Program
3. The program will push the branch automatically

### Option 2: Manual Push by Owner

If write access cannot be granted, the owner must manually apply the commits.

#### Method A: Git Bundle (Recommended)

A git bundle file is provided: `external-remediation-m1-ad4-repair.bundle`

```bash
# Clone the repository
git clone https://github.com/ramkivs/iips-review-recovered.git
cd iips-review-recovered

# Fetch from bundle
git bundle verify external-remediation-m1-ad4-repair.bundle
git fetch external-remediation-m1-ad4-repair.bundle m1-ad4-repair:m1-ad4-repair

# Verify commits
git log --oneline m1-ad4-repair | head -5
# Expected:
# 83c098b M-2 REPAIR: ReplayService actual recomputation (AD-17/M-2)
# 2b4e2bd M-1 REPAIR: NamespaceCollisionGuard (ADR-01 C1-C6) + guarded merge at LiveDataRuntime
# 1a602d8 docs: record recovered P06 acceptance durability reconciliation
# ...

# Push to remote
git push origin m1-ad4-repair

# Verify remote
git ls-remote origin | grep m1-ad4-repair
```

#### Method B: Patch File

A patch file is provided: `external-remediation-m1-ad4-repair.patch`

```bash
# Clone the repository
git clone https://github.com/ramkivs/iips-review-recovered.git
cd iips-review-recovered

# Checkout base branch
git checkout phase13-next

# Create new branch
git checkout -b m1-ad4-repair

# Apply patch
git am external-remediation-m1-ad4-repair.patch

# Verify commits
git log --oneline | head -5
# Expected: same as Method A

# Push to remote
git push origin m1-ad4-repair

# Verify remote
git ls-remote origin | grep m1-ad4-repair
```

## Verification

After pushing, verify:

1. **Branch exists on remote**:
   ```bash
   git ls-remote origin | grep m1-ad4-repair
   ```

2. **Commits are reachable**:
   ```bash
   git log --oneline origin/m1-ad4-repair | grep -E "(2b4e2bd|83c098b)"
   ```

3. **Source tree contains repairs**:
   ```bash
   git show origin/m1-ad4-repair:iips-platform/src/governance/NamespaceCollisionGuard.ts | head -20
   git show origin/m1-ad4-repair:iips-platform/src/replay/ReplayService.ts | grep -A5 "this.executor"
   ```

4. **Tests pass**:
   ```bash
   git checkout m1-ad4-repair
   cd iips-platform
   npm install
   npm test
   # Expected: 653/653 PASS (M-1 validation)
   ```

## Next Steps After Durability

Once the commits are durable on the remote:

1. **Existing-IIPS Program Authority** must review and accept M-1:
   - Review NamespaceCollisionGuard implementation
   - Review 653/653 validation results
   - Issue explicit M-1 acceptance record

2. **Existing-IIPS Program Authority** must review and accept M-2:
   - Review ReplayService recomputation implementation
   - Review 8/8 tests + 3 mutation proofs
   - Review 44 regression failures (distinguish proof-of-repair from regressions)
   - Issue explicit M-2 acceptance record

3. **After M-1 acceptance**: Execute AD-4 revalidation

4. **After M-1 acceptance**: Execute E2E-030 revalidation

5. **Return updated evidence** to IIPS Production Market Data Program for re-adjudication

## Authority Boundary

- D40 remains binding (P15 ENTRY-BLOCKED)
- No certification granted by this handoff
- No P15 authorization
- No production authorization
- Existing-IIPS Program Authority acceptance required for closure

## Contact

For questions or assistance, contact the IIPS Production Market Data Program Authority.

---

**Document created**: 2026-09-13  
**Bundle SHA256**: 01d29fd7a45eda5c0d4988fc9f57e98ddfde7d831f337f4efe77674afdfaaf66  
**Patch SHA256**: c0655fd5d5796cb2cf9b681adadf025b46388255c249262c380713f3de556543
