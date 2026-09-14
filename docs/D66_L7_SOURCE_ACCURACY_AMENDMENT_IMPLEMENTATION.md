# D66 — L-7 BROADER SOURCE-ACCURACY AMENDMENT: IMPLEMENTATION

**Act ID:** `D66-L7-BROADER-SOURCE-ACCURACY-AMENDMENT-IMPLEMENTATION-01`
**Authority:** **D64 Part A (L-7: A)** — bounded six-site source-accuracy amendment, with
rendered text explicitly permitted to change.
**Durability:** **D65** merged D10 and established the branch as remotely durable
(local == remote at `6304e61f…` before this act).
**Base:** `6304e61f498f38bdd215fdbf160ec8f221f12b82`, branch
`arena/01a0814b-iips-production-market-data`, tree clean.
**Type:** IMPLEMENTATION of an accuracy correction. Not acceptance, not certification,
not production activation, **not replay remediation**.

---

## 1. THE CORRECTED DISTINCTION

Every amended site now states the same three-part fact, established by D62:

1. **`ReplayService` COMPUTES** `reproduced`/`byteIdentical` — `ReplayService.ts`:140, under
   its "M-2 REPAIR (D41 Workstream C)" header. It does **not** return literals.
2. **`executive-transport.ts` `computeCertifiedReplay()` HARDCODES** the UI-facing values
   (`reproduced: true`, `byteIdentical: true` at L425-426 and L487-488) and **never invokes**
   the `ReplayService` instance it holds at L204 — **0 call sites**.
3. **Runtime replay verification is NOT ESTABLISHED** for the values the UI receives.

The stale wording asserted (1) falsely and thereby misidentified the actual integrity defect.
**The defect is transport-side hardcoding, not platform-side literal return.**

---

## 2. SITES CORRECTED — ALL SIX

| # | Site | Kind | User-visible | Result |
|---|---|---|---|---|
| 1 | `Ad17Disclosure.tsx`:26 → :33 `m2Defect` const | **executable, rendered** | **YES** | **CORRECTED** |
| 2 | `Ad17Disclosure.tsx` `Ad17Note` prose | **rendered JSX** | **YES** | **CORRECTED** |
| 3 | `Ad17Disclosure.tsx`:8-9 header comment | comment | no | **CORRECTED** |
| 4 | `frontend/server/p12-transport.ts`:433 | comment | no | **CORRECTED** |
| 5 | `EvidenceExplorerComponents.tsx`:69 | comment | no | **CORRECTED** |
| 6 | `ReplayExplorer.tsx`:20 | comment | no | **CORRECTED** |

### Rendered-text treatment (sites 1–2)

**Before** — `data-testid="ad17-disclosure"`:
> AD-17 / M-2 — UNRESOLVED. **ReplayService returns reproduced/byteIdentical as literals.**
> These values are **reported by the platform as literals** and have not been verified by a
> reproduction procedure. …

**After:**
> AD-17 / M-2 — UNRESOLVED. **The platform replay service computes these values, but the
> UI-facing reproduced/byteIdentical values are hardcoded by executive-transport, not produced
> by a runtime verification.** They have **not** been verified by a reproduction procedure **at
> runtime**. They must not be read as evidence of verified replay or verified byte identity.
> Resolution gate: P15 (E2E Certification) — external Existing-IIPS authority.

**AD-17 safety semantics are unchanged and no weaker:** the disclosure still declares AD-17/M-2
UNRESOLVED, still denies verification, still forbids reading the values as verified replay or
byte identity, and still names the P15 resolution gate. `assertNoVerifiedReplayClaim`,
`ReplayLiteralDisplay`, the `NOT VERIFIED` heading, all `data-testid` hooks and the absence of
pass/fail colouring are **untouched**.

---

## 3. TEST CHANGES

**One assertion in one file** changed: `Ad17Disclosure.test.tsx`, test
*"always carries the AD-17 UNRESOLVED disclosure"*.

`expect(note).toHaveTextContent('literals')` **required the stale characterisation** and failed
once the rendered text became accurate. It was **replaced by five stronger assertions**:

```
expect(note).toHaveTextContent(/computes/i);
expect(note).toHaveTextContent(/hardcoded by executive-transport/i);
expect(note).toHaveTextContent(/not.+been verified by a reproduction procedure/i);
expect(note.textContent ?? '').not.toMatch(/returns\s+reproduced\/byteIdentical\s+as\s+literals/i);
expect(note).toHaveTextContent(/must not be read as evidence of verified replay/i);
```

**No assertion was weakened or deleted.** Coverage increased from 3 assertions to 7, now
including a **regression guard** preventing reinstatement of the stale claim and an explicit
AD-17 no-verified-replay check. **The other nine feature suites required no change** — none
asserted the disclosure body text; the two that mention "literals" do so in their own comments
(not authorized scope, not rendered).

---

## 4. FLOORS — FRESHLY RUN AND OBSERVED

| Floor | Required | **Observed** |
|---|---|---|
| Frontend vitest | ≥740 pass / 0 fail | **740 passed, 0 failed**, 32 skipped (55 files passed, 5 skipped) |
| P12 `node --test` | 153 / 0 | **153 pass, 0 fail** (41 suites) |
| App `tsc --noEmit` | clean | **clean, exit 0** |
| Server `tsc --noEmit -p tsconfig.server.json` | clean | **clean, exit 0** |
| Targeted AD-17 suites | report | **55/55 passed** across `Ad17Disclosure`, `ReplayExplorer`, `EvidenceExplorer`, `CompanyTrustChain`, `SectorIntelligence` |

`Ad17Disclosure.test.tsx`: **10/10 passed.** No floor regressed.

> `frontend/node_modules` had been destroyed by the sandbox re-clone; `npm ci` was re-run to
> restore it before testing. No dependency or lockfile change.

---

## 5. EXCLUSIONS HONOURED

- `iips-platform/src/replay/ReplayService.ts` — **0 changes**.
- `frontend/server/executive-transport.ts` — **0 changes**.
- **No transport binding to `ReplayService`. No replay remediation. No verification performed
  or claimed.** AD-17 safety semantics unaltered. No accepted gate reopened.
- **Historical records D55–D65 — 0 changes.** No unrelated source or comment modified.

**Files changed (5):** `Ad17Disclosure.tsx` · `Ad17Disclosure.test.tsx` · `p12-transport.ts` ·
`EvidenceExplorerComponents.tsx` · `ReplayExplorer.tsx`.

---

## 6. L-7 CLOSURE STATUS — CLOSED FOR THE AUTHORIZED SIX SITES

**L-7 is CLOSED for all six sites enumerated in D64 Part A**, including both user-visible ones.

### ⚠ L-8 REGISTERED (NEW, OPEN) — four further stale sites, outside authorized scope

A post-amendment sweep found the same stale characterisation at four sites **not** in the D64
Part A scope. They were **left untouched**, per the prohibition on modifying unrelated source:

| Site | Kind | User-visible |
|---|---|---|
| `StateComponents.tsx`:56 | block comment | no |
| `CompanyTrustChain.tsx`:56 | JSX comment | no |
| `ReplayExplorer.tsx`:90 | inline comment | no |
| `SectorIntelligence.tsx`:201 | JSX comment | no |

**All four are comments; none renders to users.** No user-visible inaccuracy remains. L-8 is a
**documentation-accuracy** limitation requiring a separate authority decision — deliberately
**not** absorbed into this act. This mirrors the L-7 lesson: each site was classified by reading
its actual lines and tracing render paths, not by assuming.

---

## 7. STATUS

| Item | Status |
|---|---|
| **L-7** | **CLOSED** for the six authorized sites |
| **L-8** | **NEW, OPEN** — 4 comment-only sites, authority decision required |
| **L-3** | **OPEN** — basis corrected (D62), not closed |
| **AD-17 / M-2** | **UNRESOLVED** |
| L-2, L-4 (R-2…R-7) | **OPEN** |
| L-1 / L-5 / L-6 | CLOSED |
| Replay / transport remediation | **NOT PERFORMED** |
| P13 certification | **NONE** |
| Production authorization | **NOT GRANTED** |
| Next free D-number | **D67** |
