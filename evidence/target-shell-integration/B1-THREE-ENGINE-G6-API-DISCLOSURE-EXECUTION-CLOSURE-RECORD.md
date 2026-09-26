# B1 Three-Engine G6 — API Disclosure Transition: Execution & Closure Record

| Field | Value |
|---|---|
| Record type | **EVIDENCE — execution / closure record.** This is **not** an authority act and creates no new authority, decision or certification. |
| Gate | G6 — API Disclosure Transition (per-engine) |
| Decision ID (as supplied by RAMKI in the G6 operation instructions) | `b1-three-engine-certification-g6-api-disclosure-2026-09-26-001` |
| Parent G5 certification issuance | `5170585b46bb1384ee5cfd6e75f9896df5e170d0` (`B1-THREE-ENGINE-G5-CERTIFICATION-ISSUANCE-ACT.md`) |
| Certificate disclosed | `B1-CERT-IES016-IES017-IES020-2026-09-25-001` |
| Scope | IES-016 / IES-017 / IES-020 only |
| Executed by | Arena (repository-local test-harness repair and qualification); Windows production artifacts produced by the operator |
| Date | 2026-09-26 |

## A. Authority basis (stated, not inferred)

- G1 (`85b674d`, §G) assigns G6 to "Arena under separate authority" as a bounded registry, adapter and test change, per-engine only in the `/api/engines` payload for IES-016/017/020.
- G5 (`5170585`) records "G6 = SEPARATE / NOT EXECUTED" and requires a separate G6 authorization.
- **The execution authority for G6 is the G6 authorization supplied by RAMKI in the operation instructions for this work (2026-09-26), under the decision ID above.** No separate in-repository G6 authority act exists; this record does not create one and does not substitute for one.

## B. Commit chain

| Step | Commit | Content |
|---|---|---|
| G5 issuance | `5170585b46bb1384ee5cfd6e75f9896df5e170d0` | Certification issued. Served API still `NONE CLAIMED` / pending lineage text |
| Windows artifact deposit (operator) | `09fc4ecb57e277951515290d00ff21807212cd28` | `G6-WINDOWS-ARTIFACT-DROP-20260926/` (two source files + `SHA256-MANIFEST.txt`) |
| G6 implementation + test repair | `4d029a055af2bff7496e5ecb84d0b6f29315c61a` | Production files installed byte-exact from the drop, plus the repaired `tests/engine_registry_wiring.test.ts` (3 files, +144 / −22) |
| Evidence correction + this record | the commit containing this file | Manifest hash correction (§C) and this record. No production or test change |

## C. Artifact verification and manifest correction

Both files were verified with full 64-character SHA-256 equality and exact byte counts. Prefix matching was **not** accepted as verification.

| File | Bytes | SHA-256 |
|---|---|---|
| `EngineApiAdapter.ts` | 16412 | `655DF2188AE67CC60E14D4B285FBFF418CA7963BD9457F50CCCC33DE14ACC102` |
| `EngineRegistry.ts` | 15220 | `5A54BDBDCFD1D22E5425FED735ECF3BD49A515C242F23D6F5403C0B0AB82642A` |

- **Manifest correction:** as deposited in `09fc4ec`, `SHA256-MANIFEST.txt` listed a 63-character value for `EngineRegistry.ts`, the full hash without its final `A`. The value restated in the correction instruction was also 63 characters. The manifest row now holds the 64-character value **recomputed from the deposited file**. After the correction, every manifest row was re-verified by full equality. The rest of the manifest is byte-unchanged, including its UTF-8 BOM and LF line endings.
- **Production equals the drop:** at `4d029a0`, `iips-platform/src/integration/EngineApiAdapter.ts` and `EngineRegistry.ts` are byte-identical (`cmp`) to the deposited drop files. Their git blobs are `c7e9428519cf9a4c3c1f7f63ce992a89d6385fdf` and `a96be332bb4a89fa68fdd5349ff94c21984b2743`.

## D. Implemented G6 change (the Windows implementation, preserved exactly)

- **`EngineRegistry.ts`:** adds `B1_CERTIFIED_ENGINES` (the three engine IDs), `B1_CERTIFICATION_ID`, `B1_CERTIFICATION_DISCLOSURE` and `getCertificationDisclosure(engineId)`. The function returns `{ status: 'CERTIFIED', certificateId, disclosure }` for the three engines and `undefined` for every other ID. Nothing else changes.
- **`EngineApiAdapter.ts`:**
  - The per-engine `certification` field is populated from `getCertificationDisclosure`.
  - The provenance source text becomes `Gate B — IES-016/017/020 historical A1 lineage; B1 certification disclosed per-engine`.
  - `b1Certification: 'NONE CLAIMED'` is unchanged.
- **Unchanged:**
  - `ENGINE_FACTORY`, `execute()`, the 13 registry entries and the certification lineage function (this is proven by the reversal in ER-08).
  - The transport and the global `X-IIPS-Certification: NONE CLAIMED` header (`frontend/server/research-sector-transport.ts`).

**Served result:** IES-016, IES-017 and IES-020 each carry

- `status`: `CERTIFIED`
- `certificateId`: `B1-CERT-IES016-IES017-IES020-2026-09-25-001`
- `disclosure`: `CERTIFIED — WITH RECORDED PERMANENT QUALIFICATIONS`

IES-006 through IES-015 carry no certification object.

## E. Test repair (`tests/engine_registry_wiring.test.ts`, repaired from the committed G5 version)

- **ER-01 / ER-02 / ER-03:**
  - The exact certification object is served on IES-016/017/020 only; it is absent on IES-006…015 and on unknown or D42 IDs.
  - The certificate ID is served exactly 3 times.
  - `provenance.b1Certification` stays `NONE CLAIMED`, and over real HTTP the global header stays `NONE CLAIMED`.
- **ER-04:**
  - Repository paths are compared with `/` separators on every OS, and the test asserts the serving transport is located exactly once.
  - The legitimate `/api/engines` transport is no longer misclassified on Windows.
  - All no-execute assertions are retained.
- **ER-06:** only the served G6 provenance disclosure text expectation was changed.
- **ER-08:**
  - `GATEB_SOURCE_HUNKS` is byte-identical to G5 (Gate-B-only).
  - The Gate B reversal reads `git show 5170585…:<path>`.
  - A separate `G6_SOURCE_HUNKS` list reverses the working tree to the G5 blobs.
  - This makes the test depend on git and on the G5 commit object; a shallow clone without that object fails closed.

## F. Arena qualification results (Linux sandbox, commit `4d029a0` content)

| Check | Result |
|---|---|
| Unmodified G5 test against G6 source (baseline) | tests 12, pass 8, fail 4 (ER-01, ER-02, ER-06, ER-08) |
| Repaired focused suite `tests/engine_registry_wiring.test.ts` | **tests 12, pass 12, fail 0, cancelled 0, skipped 0, todo 0, exit 0** |
| `tsc --noEmit` at the repository root | exit 0 |
| `tsc --noEmit` in `iips-platform` | exit 0 |
| `git diff --check` | clean |
| ER-04 mutation probe (a temporary `executeEngine` caller, then removed) | ER-04 failed as required (pass 11, fail 1) |
| Windows path logic checked with Node `path.win32` rules | the old check misclassifies the transport; the new `repoRel` resolves it correctly |
| Other tests referencing the old wording or the G5 blobs | none |

- **Environment:** node v22.22.3, tsx v4.23.9, TypeScript 5.9.3.
- **Test runner:** `npx --no-install tsx` cannot resolve at the repository root, because `tsx` is not a root dependency. The suite was run from the root with `iips-platform/node_modules/.bin/tsx --test tests/engine_registry_wiring.test.ts`. No dependency was added.
- **Not run in G6:** the full root suite and the whole `iips-platform` tree. They are not claimed.

## G. Invariants preserved

- The global `X-IIPS-Certification` header is `NONE CLAIMED`, unchanged.
- The shared `provenance.b1Certification` field is `NONE CLAIMED`, unchanged.
- IES-006…015 semantics are unchanged; D42 IDs remain unexposed.
- No execute capability, factory, route, transport or caller was added; `executeEngine` stays PRESENT / NOT EXPOSED / NOT ROUTED / NOT CALLED / NOT AUTHORIZED.
- No D115, Dhan, NSE or provider change; no D7 change; no change to A1, Gate A/B/C, G1–G5 or historical records.
- No production activation, release, promotion or tagging.
- G5 is unaltered. Its permanent qualifications (G1 §F), including **ROLE-SEPARATED, NOT ORGANIZATIONALLY INDEPENDENT**, carry forward unchanged.

## H. Disclosures

- **Local ref re-points:** in the Arena sandbox the local branch ref was repeatedly restored to the stale `da43051`. Each time, the worktree was first proven byte-identical to a known commit, then the **local** ref was re-pointed and fast-forwarded (to `85b674d` → `09fc4ec`, and later to `4d029a0`). The remote was never rewritten or force-pushed.
- **Separation of environments:** Arena cannot observe the Windows environment. No Windows result is reported here.

## I. Status

| Item | Status |
|---|---|
| G6 repository implementation and test repair | **CLOSED**: durable at `4d029a0`, pushed, LOCAL == REMOTE verified |
| G6 Arena (Linux) qualification | **PASSED** as recorded in §F |
| Artifact manifest | **CORRECTED** (§C) |
| **G6 Windows qualification** | **PENDING: separate verification item, NOT PERFORMED, NOT CLAIMED.** Linux results do not substitute for Windows evidence. This covers the focused suite, TSC and the served `/api/engines` response on the Windows checkout at or after `4d029a0`. |
