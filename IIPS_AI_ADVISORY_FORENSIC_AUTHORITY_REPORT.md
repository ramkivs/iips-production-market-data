# IIPS — AI Advisory: Forensic / Authority-Determination Gate

**Status:** COMPLETE — forensic and authority determination delivered. **NOTHING IMPLEMENTED.**
**Gate class:** FORENSIC / AUTHORITY-DETERMINATION. `main` remains `4d3e1cd`. D115 implementation
authority NOT granted. Production authorization NOT granted. Provider activation NOT granted. Windows
artifacts untouched.
**Source modification:** **NONE.** `git status --porcelain` was empty at the start and at the end of
this gate. Two throwaway forensic probes were written, executed and **deleted**; no source file,
test, route, surface, navigation entry or configuration was created, modified or removed.
**Test state:** unchanged and re-verified — `node --test dist/tests/*.test.js` → **649 tests / 106
suites / 649 pass / 0 fail**; `npm run build:tsc` → exit 0. No test expectation was altered.

---

## Status-label legend

Every substantive statement in this report carries exactly one of the six authorised labels.

| Label | Meaning in this report |
| --- | --- |
| **FORENSICALLY CONFIRMED** | Established inside this gate by reading the exact artifact bytes and/or by direct measurement. |
| **SAFE FOR NEXT GATE** | Evidence shows the dependency is already present, deterministic, provider-free and browser-safe; an implementation gate may rely on it without new risk. |
| **AUTHORITY-DEPENDENT** | Technically available, but the decision to proceed is an authority decision that this gate may not make on its own. |
| **EXTERNALLY BLOCKED** | Requires an external resource that is unavailable here (IdP, runtime, absent record). Not a capability verdict. |
| **UNVERIFIED** | Asserted somewhere but not provable from accessible evidence; recorded as a limitation. |
| **EXCLUDED** | Outside the authorised boundary of this gate or of the next gate. |

---

## 1. Exact starting HEAD

| Item | Value |
| --- | --- |
| Local HEAD at gate start | `da4305149bd5495789f893f530edb2526d08bb5b` (sandbox re-provisioned) |
| Remote tip at gate start | `e9db5d7635e493f8a61fc3427642d1c304bb9cca` |
| Action taken | `git fetch --depth=1 origin refs/heads/arena/01a0d1d3-…:refs/remotes/tmp/base` + `git reset --hard refs/remotes/tmp/base` |
| **Verified working HEAD** | **`e9db5d7635e493f8a61fc3427642d1c304bb9cca`** |
| Local ↔ remote relationship | identical (the remote tip had not advanced) |
| `main` / `origin/main` | `4d3e1cdcaa33da0ec3be8b336b17128108a502c` — unchanged |
| Prompt-2C implementation commit | `e02bf0600a3d865a27556c8ffe355a225470c1fa` |
| Prompt-2C report-only commits | `6b2f66d0a92…` → `253ef9e64ad9…` → `c95fe2dbb468…` → `e9db5d7635e4…` |

**Baseline durability: CONFIRMED (FORENSICALLY CONFIRMED).** The local checkout did not match the
remote at start, so the remote tip was fetched and the workspace reset to it before any evidence was
taken. The tree at `e9db5d7` is the tree all findings below were measured against.

## 2. Exact remote HEAD

```
$ git ls-remote origin refs/heads/arena/01a0d1d3-iips-production-market-data
e9db5d7635e493f8a61fc3427642d1c304bb9cca        refs/heads/arena/01a0d1d3-iips-production-market-data
```

**FORENSICALLY CONFIRMED** — unchanged from the Prompt-2C durability checkpoint; read again after the
evidence phase and again before this report was committed.

## 3. LOCAL == REMOTE

**TRUE — FORENSICALLY CONFIRMED.** `git rev-parse HEAD` and `git ls-remote origin
refs/heads/arena/01a0d1d3-iips-production-market-data` both returned
`e9db5d7635e493f8a61fc3427642d1c304bb9cca`. This gate performed **no** history operation: no commit
of source, no amend, no rebase, no merge, no force-push. The only commit this gate creates is the
report-only commit containing this file (§ Durability).

## 4. Workspace state

| Check | Result |
| --- | --- |
| `git status --porcelain` before evidence | empty (0 entries) |
| `git status --porcelain` after evidence and probe deletion | **empty (0 entries)** |
| Modified tracked source files | **none** |
| Untracked scratch files remaining | **none** (`probe_ai_advisory.mjs`, `probe_ai_closure.mjs`, `.probe_closure_edges.txt`, `.probe_ci_banking.png`, `.probe_si_banking.png` all deleted) |
| Generated output (`dist/`, `dist-frontend/`, `node_modules/`) | gitignored, not committed |
| Credentials / Git TLS configuration | not read, not written, not changed |

**FORENSICALLY CONFIRMED.** This gate is evidence-only; no implementation boundary was crossed.

---

## 5. Historical AI Advisory lineage

### 5.1 The certified commit

| Item | Value |
| --- | --- |
| **Certified lineage commit** | `f63a9b493118643725568a95b86405a5835a30a0` |
| Subject | `test(ai-advisory): close G-DISPATCH-COVERAGE with real-socket dispatch coverage` |
| Committed | `2026-08-27T19:39:56Z` |
| Parent | `e5d59981c10578db0bf7a5b656acccb9450f45e0` — `feat(ai-advisory): embedded non-authoritative AI explanation on canoni…` |
| Fetchable directly | **yes** (`git fetch --depth=1 origin f63a9b49…` succeeded; `git cat-file -t` → `commit`) |

### 5.2 Reachability — a decisive structural finding

| Comparison | Result |
| --- | --- |
| `f63a9b49` vs `main` (`4d3e1cd`) | **404 — "No common ancestor"** |
| `f63a9b49` vs Prompt-2C donor tip `42f91fad` | **404 — "No common ancestor"** |
| `f63a9b49` vs `p14-implementation-recovered`, tags `p14-r7-65b78f7`, `portfolio-option-a-cb969b6`, `post-cleanup-baseline-b46b4f4`, `temporary-cleanup-caf73ba`, `d114-legacy-windows-evidence` | **404 — no common ancestor in each case** |
| `f63a9b49` vs `m1-ad4-repair` | `status: behind`, **`ahead=0`, `behind=32`** |
| Local proof of ancestry | `git fetch --depth=60 origin refs/heads/m1-ad4-repair:refs/remotes/tmp/m1` then `git merge-base --is-ancestor f63a9b49 refs/remotes/tmp/m1` → **exit 0 (CONFIRMED)** |
| Remote branch containing it | `refs/heads/m1-ad4-repair` — tip `ad41b4d48299b7a58d3f2f44ae8ef8e11462f294`, `P15 Closure Report (E-12): Consolidate on accepted implementation branch` |
| Pull requests containing it | none (`commits/f63a9b49/pulls` → empty) |

**FORENSICALLY CONFIRMED.** AI Advisory belongs to a **separate, older lineage** ("Phase 14" /
v3.0, 2026-08-17 → 2026-08-27) that shares **no history** with the current certified lineage. It is
not reachable from `main`, from the Prompt-2C donor tip, or from the Arena branch by ancestry — only
through the `m1-ad4-repair` branch. Any recovery is therefore a **cross-lineage port**, never a merge
or cherry-pick, and `git diff` across the two trees is meaningless.

### 5.3 Ancestor chain (40 commits walked; 2026-08-17 → 2026-08-27)

Selected entries, newest first — the chain shows the surrounding authority program:

| Commit | Subject |
| --- | --- |
| `f63a9b49` | test(ai-advisory): close G-DISPATCH-COVERAGE with real-socket dispatch coverage |
| `e5d59981` | feat(ai-advisory): embedded non-authoritative AI explanation on canonical… |
| `85bbd49c` | feat: add P-2 notes surface |
| `50cfd4fb` / `024ae9b4` / `0cc00f2e` | macro research surface / certified macro transport / MoSPI source adapter |
| `468bb064` | feat: add P-4 sector information |
| `63559491` | feat: add IES-020 Materials & Metals sector engine |
| `6ea7ba1a` | feat: add governed Company sector reachability (N+12) |
| `2532afc6` | docs: certify N+3 governed read authorization |
| `87f8b59d` | feat: enforce governed read authorization |
| `7f6b27d5` | feat: integrate browser authentication with Keycloak |

**FORENSICALLY CONFIRMED.** The AI Advisory feature sits inside a program that also introduced
Keycloak browser authentication and "governed read authorization" — which is exactly why its
transport is `guardRead`-coupled (§8).

### 5.4 Certification record

| Item | Value |
| --- | --- |
| Certification level | **A2 — partial evidence** (per `governance/iips/DEC-D5-EVIDENCE-MATURITY.md`) |
| Scope certified | "embedded in Company Intelligence, Sector Intelligence and Decision Matrix; no standalone route or navigation entry" |
| Not an engine | no `ENGINE_FACTORY` registration, no `sector.*` engine ID; "certified scope is exactly the previously certified 13-path implementation delta — no wider" |
| Criteria **H / I / J** (authenticated live HTTP 200 / real Keycloak authentication / live browser rendering) | **NOT PERFORMED** — "recorded as a limitation, not a failure, and not recorded as PASS… the limitation is **not self-clearing**" |
| Recorded reason | "no container runtime, no Keycloak IdP and no browser were available; the advisory dispatch returns `401 authentication unavailable (no IdP configured)` without an executor, so an authenticated live 200 is **unreachable by construction**" |
| H/I/J current status | **dormant** per `DEC-D13-HIJ-EXECUTION-AUTHORITY` |
| Governance records cited | `governance/iips/DEC-G-AI-IMPL-CERTIFICATION.md` §5; `governance/iips/DEC-G-AI-IMPL-CERT-CRITERIA.md` (Option D) |
| **Presence of those records in the repository** | **ABSENT** — 0 files match `DEC-G-AI-IMPL` in every ref examined (`f63a9b49`, `42f91fad`, `m1` tip, `7964fcce`, current HEAD); GitHub code search returns `total_count: 0` |

**FORENSICALLY CONFIRMED** (level, criteria, reason, dormancy) and **EXTERNALLY BLOCKED** (the
governance record bodies themselves cannot be read here — only their citations in
`docs/v3.0/INTEGRATION_VERIFICATION_MATRIX.md` §3.2 and `docs/v3.0/E2E-017_ENGINE_MASTER_MATRIX.md`
row A1).

---

## 6. Donor files and exact classifications

### 6.1 The five artifacts, measured three ways

Present at both `f63a9b49` and the `m1-ad4-repair` tip; three of them also at the Prompt-2C donor tip
`42f91fad`.

| File | Lines | `f63a9b49` vs `m1` tip | vs `42f91fad` (2C donor) | vs `7964fcce` (capture) | vs current lineage |
| --- | --- | --- | --- | --- | --- |
| `frontend/src/components/ai/AiExplanation.tsx` | 104 | IDENTICAL | IDENTICAL | IDENTICAL | absent (not recovered) |
| `frontend/src/api/aiAdvisory.ts` | 75 | IDENTICAL | IDENTICAL | IDENTICAL | absent |
| `frontend/server/ai-advisory-transport.ts` | 218 | IDENTICAL | IDENTICAL | IDENTICAL | absent |
| `frontend/server/ai-advisory-transport.test.ts` | 576 | IDENTICAL | not present at `42f91fad` | not present at `7964fcce` | absent |
| `iips-platform/src/distributed/AiAssistedRuntime.ts` | 103 | IDENTICAL | IDENTICAL | **IDENTICAL** | **PRESENT · byte-identical** |

Additional files present only from the accepted tip onwards:
`frontend/server/live/ai-advisory-live-certification.test.ts` (158 lines) and
`frontend/server/live/ai-advisory-live-e2e014.test.ts` (113 lines).

**FORENSICALLY CONFIRMED.** The certified artifact bytes are stable across four independent lineages;
the historical implementation is a fixed, inspectable corpus, not a moving target.

### 6.2 Exact classifications

| # | Candidate | Classification | Basis |
| --- | --- | --- | --- |
| 1 | `components/ai/AiExplanation.tsx` | **ADAPTER** | Presentation-only; derives nothing. Needs only the `.js`/current specifier convention plus any project path adaptations. Imports `LoadingState`/`ErrorState`/`UnavailableState` (present) and `AiBadge`/`FreshnessBadge`/`StatusBadge` (present, byte-identical). |
| 2 | `api/aiAdvisory.ts` | **ADAPTER** | `authFetch` (present) + `encodeURIComponent`; no `node:`, no PIT, no `asOf`, no provider. DTO is 12 fields, unchanged. |
| 3 | `server/ai-advisory-transport.ts` — deterministic core (`ADVISORY_TEXT`, `ADVISORY_LABEL`, `ADVISORY_FRESHNESS`, `ADVISORY_UNAVAILABLE`, `ADVISOR_MODEL`, `ADVISOR_MODEL_VERSION`, `createDeterministicAdvisor`, `guardAdvisorCompletion`, `buildAiAdvisoryDto`) | **SAFE FOR NEXT GATE** | Pure, deterministic, provider-free, network-free, auth-free. Reproduces the full DTO for all 13 governed sectors on the current lineage (§7). |
| 4 | `server/ai-advisory-transport.ts` — `handleAiAdvisoryRequest` | **EXCLUDED** | Depends on `guardRead` (auth tier), on `./admin-transport` (734 lines, absent) and on `ResolvedSectorEngine` resolution supplied by the donor dispatch. |
| 5 | `iips-platform/src/distributed/AiAssistedRuntime.ts` | **REUSE** | **Already present and byte-identical** on the current lineage. A same-content duplicate is prohibited. |
| 6 | `components/ui/Badges.tsx` (`AiBadge` → `badge-ai`, `StatusBadge status="positive"` → `status-positive`) | **REUSE** | Present and byte-identical across capture, certified and current lineages. Two of the eight advisory keys need **no new code at all**. |
| 7 | `components/state/StateComponents.tsx` | **REUSE** | Present. Note: the current version is the **AD-17-amended** one (`ReplayState` deleted — §9), which is the correct current-lineage state. |
| 8 | Donor `server/executive-transport.ts` host + `ENGINE_FACTORY` + `BASELINE` + `resolveSectorEngine` (897 lines) | **EXCLUDED** | The dispatch module this program has twice refused to adopt; its resolver role is replaceable by a current-lineage mapper over the frozen baseline (§13). |
| 9 | `server/live/ai-advisory-live-{certification,e2e014}.test.ts` | **EXCLUDED** | vitest; require a live Keycloak realm, `IIPS_TEST_PASSWORD`, JWKS RS256. |
| 10 | `server/ai-advisory-transport.test.ts`, `components/ai/AiExplanation.test.tsx` | **EXCLUDED** as tests / **evidence of record** as fixtures | vitest. `AiExplanation.test.tsx` is nevertheless used here as corroborating evidence (§7.4). |
| 11 | Auth tier: `admin-transport`, `secured-executor`, `core/auth/keycloakAdapter`, `core/auth/authContract`, `live/real-oidc-verifier`, `secrets/secret-authority`, `directory/{idp-sync,directory-wiring,roster-directory}`, `notifications/notification-service`, `notes/notes-service`, `persistence/persistence-service` | **EXCLUDED** | 12 files absent from the current lineage (§8); Keycloak/OIDC recovery is prohibited by this gate. |
| 12 | PIT / D114 / D115 / provider / production configuration | **EXCLUDED** | Standing exclusions; AI Advisory does not reference them (its DTO explicitly lists `provider` among the fields it does **not** provide). |

---

## 7. Payload / provenance analysis

### 7.1 Exact schema (12 fields, no additions permitted)

| Field | Origin | Value semantics |
| --- | --- | --- |
| `adviceId` | canonical platform helper `adviceId()` — FNV-1a, no randomness | `adviceId("ai-advisory\|" + (engineResultRef ?? engineResultId))` |
| `engineResultId` | transport | the resolved **sector key** (e.g. `Banking`) |
| `kind` | advisor | `'explanation'` |
| `text` | **fixed by authority** (DEC-G-AI-IMPL-S2) | `"This is a supplementary advisory explanation. It is not a certified engine result and does not alter the certified result."` — no interpolation, no result-dependent slots |
| `grounded` | advisor, computed | `typeof evidence.composite === 'number' && typeof evidence.verdict === 'string'` |
| `nonAuthoritative` | advisor | literal `true` |
| `model` / `modelVersion` | advisor identity (S1) | `'iips-deterministic-advisor'` / `'1.0.0'` — truthful: no external model is implied |
| `engineResultRef` | **genuine** `engineResult.snapshotRef` (SR-1) | present only when the runtime produced one; never synthesized |
| `label` | transport (D7) | `'AI EXPLANATION ≠ CERTIFIED RESULT'` |
| `freshness` | transport (SR-2) | `'SNAPSHOT'` |
| `unavailable` | transport | `['timestamp','tenant','provider','confidence','citations','decision']` — fields the contract does **not** provide; listed, never fabricated |

### 7.2 Provenance verdict

| Question | Verdict |
| --- | --- |
| Deterministic frozen snapshot? | **FORENSICALLY CONFIRMED** — fixed clock (`createClock('fixed')`), deterministic id provider, frozen v1.1 baseline inputs, fixed text, pure FNV-1a ids. |
| Fixture? | **NO** — unlike `computeCertifiedReplay()`/`computeCertifiedEvidence()`, the advisory is *computed*: `grounded` is a real type check and `engineResultRef` is the runtime's own snapshot id. |
| Runtime computation? | **FORENSICALLY CONFIRMED** — `AiAssistedRuntime.executeWithAi` really executes the certified engine (`RuntimeCoordinator.execute` → `SnapshotService` → `snapshotRef = idProvider.generate('SNAP', engineId + '|' + clock.now())`). |
| Provider-backed? | **NO — FORENSICALLY CONFIRMED.** The advisor source states it plainly: *"Deterministic; no external AI, provider or network; no additional reads."* No HTTP client, no API key, no model endpoint exists in the closure (§8.1: external packages = **none**). |
| Auth-bound? | **YES — the certified transport is auth-bound** (§8). The advisory *content* is not. |
| Honest about its own gaps? | **YES** — `unavailable` enumerates the six unprovided fields; the rendered panel states "AI is never a decision authority". |

### 7.3 Reproducibility on the current lineage (measured)

A throwaway probe (deleted after use) ran the **current lineage's** `AiAssistedRuntime` with the
donor's transcribed deterministic advisor over the frozen baseline, using the donor's request id
`ai-advisory-${engineId}`:

| Sector | state | `composite` | `grounded` | `engineResultRef` | `adviceId` |
| --- | --- | --- | --- | --- | --- |
| Banking | COMPLETED | 47.1 | true | `SNAP_F3F53B67` | `FE556BE4` |
| Insurance | COMPLETED | 72.3 | true | `SNAP_A627BF65` | `5597BB65` |
| Capital Markets | COMPLETED | 84.6 | true | `SNAP_01A326A0` | `BFCF0602` |
| Healthcare | COMPLETED | 75.5 | true | `SNAP_7CDC309A` | `D8F2E7FE` |
| Hospitality | COMPLETED | 79 | true | `SNAP_40C10D37` | `147580EA` |
| Energy | COMPLETED | 66.9 | true | `SNAP_CE85794F` | `0C7308A5` |
| Utilities | COMPLETED | 74.1 | true | `SNAP_F01C177D` | `BB135C59` |
| Consumer | COMPLETED | 79.5 | true | `SNAP_A40C95AB` | `6CAFB5E5` |
| Industrials | COMPLETED | 77.2 | true | `SNAP_34BB2EAD` | `2750E4BB` |
| Technology | COMPLETED | 76.3 | true | `SNAP_4EAEB989` | `341F9E63` |
| Telecommunications | COMPLETED | 77.8 | true | `SNAP_8D7F7950` | `35BFDF50` |
| Automobile | COMPLETED | 71.3 | true | `SNAP_2B4D4C60` | `A21F78C7` |
| Materials & Metals | COMPLETED | 82.5 | true | `SNAP_16B3373F` | `081E67C3` |

Aggregate: **13/13 reproduced · 13/13 COMPLETED · 13/13 `engineResultRef` DEFINED · 13/13
`grounded=true` · 13 distinct refs · 13 distinct advice ids.** Banking's composite `47.1` matches the
independent Prompt-2C authority measurement exactly.

### 7.4 Independent corroboration of the derived values

The donor's own component test fixture (`AiExplanation.test.tsx`, capture lineage) contains

```
adviceId: 'A1B2C3D4',          ← a self-evidently arbitrary placeholder
engineResultRef: 'SNAP_F3F53B67'  ← the real Banking value
```

and asserts `ai-explanation-ref` renders `SNAP_F3F53B67`. The transport test independently asserts
the canonical form `^SNAP_[0-9A-F]{8}$` and that the ref is *not* a synthetic `snap_Banking`.

**FORENSICALLY CONFIRMED:** the derived Banking `engineResultRef` matches a value written down
independently by the original authors (a 32-bit hex coincidence is not a plausible explanation).
**UNVERIFIED:** the fixture's `adviceId` is a placeholder, so it corroborates nothing, and the
E2E-018 capture recorded **no field values at all** (§10) — the captured field *values* therefore
remain derived-and-corroborated rather than recorded.

### 7.5 Code-identity pinning of the capture's inputs

| Artifact | capture `7964fcce` | certified `f63a9b49` | current `e9db5d7` |
| --- | --- | --- | --- |
| `iips-platform/src/distributed/AiAssistedRuntime.ts` | `24770dca…` | `24770dca…` | **`24770dca…`** |
| `frontend/src/components/ui/Badges.tsx` | `190a27fd…` | `190a27fd…` | **`190a27fd…`** |
| `program-v1.1-certification/PROGRAM_v1.1_REPLAY_BASELINE.json` | blob `63bcd350f2cda2b0337097c25236fd8dbe82d87b` | same blob | **same blob** |
| `frontend/src/components/state/StateComponents.tsx` | `3ae94ca0…` | — | `41a0cb7a…` (AD-17 amendment, §9) |

**FORENSICALLY CONFIRMED.** The capture lineage and the current lineage share the **identical**
advisor runtime and the **identical** frozen baseline blob, so every deterministic field value in
§7.3 is pinned by code identity, not by resemblance.

---

## 8. Authentication / authorization dependency

### 8.1 Exact dependency closure

A throwaway probe (deleted after use) walked the static **and dynamic** import closure of
`frontend/server/ai-advisory-transport.ts` at `f63a9b49`.

| Metric | Value |
| --- | --- |
| Files in the closure | **128** |
| `node:` builtins reached | `node:crypto`, `node:fs`, `node:http`, `node:path`, `node:perf_hooks` |
| External npm packages | **none** |
| **Files ABSENT from the current lineage** | **12** |

The 12 absent files — the entire authorization/peripheral tier, and nothing else:

```
frontend/src/core/auth/authContract.ts          frontend/server/admin-transport.ts
frontend/src/core/auth/keycloakAdapter.ts       frontend/server/secured-executor.ts
frontend/server/directory/directory-wiring.ts   frontend/server/live/real-oidc-verifier.ts
frontend/server/directory/idp-sync.ts           frontend/server/notes/notes-service.ts
frontend/server/directory/roster-directory.ts   frontend/server/notifications/notification-service.ts
frontend/server/persistence/persistence-service.ts   frontend/server/secrets/secret-authority.ts
```

Everything else — 116 files — is **already present**, including the whole
`iips-platform` execution stack (`AiAssistedRuntime`, `PluginLoader`, `SnapshotService`,
`SnapshotStore`, `ReplayService`, `RuntimeCoordinator`, `EvidencePipeline`, `Clock`, `IdProvider`)
and all 13 sector engines with their calibration JSON.

> Note on counts: the Prompt-1 manifest recorded **16** absent files for the auth chain; this gate
> measures **12** inside the transport's own closure. The difference is accounted for by files that
> the manifest counted from the *production live wiring* (e.g. `live/keycloak-provision.mjs`, live
> test files, and further `directory/*` members) rather than from the transport's import closure.
> Both counts agree on the substance: the authorization tier is absent in full.

### 8.2 What the historical transport actually enforces

```
await (await import('./admin-transport')).guardRead(executor, token, 'ai-advisory')
   → SecuredExecutor.authenticate(token)                        → 401
   → SecuredExecutor.authorize(p, 'read', 'read.ai-advisory')   → 403
```

* `guardRead` is **reused as-is** — "NO second RBAC or read-authorization model is introduced".
* `KeycloakSessionValidator` verifies the token through an injectable `OidcVerifier` (in production
  the real JWKS RS256 verifier) and then validates issuer + audience/client + expiry.
* `mapKeycloakRoles` maps `iips-admin` / `iips-analyst` / `iips-viewer`; viewers and analysts may
  read (`admin-checks` → `read.ai-advisory`).
* Without an executor the dispatch returns **401 `authentication unavailable (no IdP configured)`**.

**FORENSICALLY CONFIRMED.** The advisory read is a **governed read** in the historical design; its
401/403 semantics are part of the shipped contract, not an incidental wrapper.

### 8.3 The live certification path

`live/ai-advisory-live-certification.test.ts` and `live/ai-advisory-live-e2e014.test.ts` construct the
real executor (`createLiveReadExecutor()` → OIDC discovery against `KEYCLOAK_URL`, realm `iips`,
client `iips-spa`, `IIPS_TEST_PASSWORD`), self-host the dispatch on an ephemeral socket, and assert:
real viewer/analyst token → **200**; no token → **401**; invalid token → **401**; unknown sector →
**404**; and `engineResultId === 'Banking'`, `text`/`label`/`freshness` exactly as in §7.1.

`ai-advisory-live-e2e014.test.ts` records that its own browser leg is withheld:
> *"J (live browser rendering) is deliberately ABSENT: D4=C withholds browser/UI execution pending a
> separate authority decision."*

**EXTERNALLY BLOCKED** (running this path here: no Keycloak IdP, no credentials, no container
runtime) and **AUTHORITY-DEPENDENT** (the browser leg was withheld by an explicit authority
decision — `DEC-E2E-014-AC-E14-7-EVIDENCE-DEFINITION-AUTHORITY-2026-09-06`).

---

## 9. AD-17 / M-2 relationship

### 9.1 What AD-17 / M-2 are

AD-17/M-2 is the open defect in which `computeCertifiedReplay()` hardcodes `reproduced: true` and
`byteIdentical: true` and never invokes the `ReplayService` it holds, so UI-facing "verified
replay / byte-identical" claims are **not** produced by any verification. The current lineage carries
the D79 correction (attribution strings naming the values as transport fixture constants) and the
`Ad17Disclosure` guard, and it **deleted** the dormant `ReplayState` component
(`StateComponents.tsx`: 38 changed lines; `state-replay*` keys no longer exist).

### 9.2 Dependency analysis

| Question | Verdict |
| --- | --- |
| Does AD-17/M-2 gate AI Advisory? | **NO.** The advisory does not consume the replay or evidence DTOs; it executes the certified engine itself and reads `snapshotRef` + `metadata.composite/verdict`. |
| Does AI Advisory depend on AD-17/M-2 resolution? | **NO.** It makes no replay/byte-identity claim anywhere in its DTO or its UI. |
| Does AI Advisory assert a verified reproduction? | **NO.** `freshness: 'SNAPSHOT'` is a data-mode label, not a verification claim; `unavailable` explicitly lists `decision`; the panel renders "AI is never a decision authority". |
| Does AI Advisory contain its own instance of the same *defect shape*? | **YES — FORENSICALLY CONFIRMED.** `AiAssistedRuntime.executeWithAi` returns `engineResultUnchanged: true` as a **hardcoded literal** (`return { result: engineResult, advice, engineResultUnchanged: true }`), and the transport's `if (!engineResultUnchanged) → 500 'engine result integrity check failed'` branch can therefore **never fire**. The real comparator, `isEngineResultEquivalent()`, is called only by tests. |
| Is that pattern UI-facing? | **NO.** No observable key renders `engineResultUnchanged`; it is an internal guard only. It must nonetheless be **disclosed and not described as runtime verification**. |

**FORENSICALLY CONFIRMED:** the AI Advisory recovery neither helps nor harms AD-17/M-2, and the next
gate must not claim that the advisory path "verifies" anything about engine-result identity.

---

## 10. Capture / parity evidence

### 10.1 Availability — the Prompt-2C blocker is resolved

The Prompt-2C report recorded the E2E-018 capture deposit (`2f1049d0db348733f4d4f15fb4dcc57d4f2742fa`)
as **not re-fetchable** ("not our ref"). This gate found the **same capture artifacts in-tree** at the
`m1-ad4-repair` tip:

```
docs/v3.0/E2E-018_SCREENSHOT_CERTIFIED_PRODUCT_PARITY_MATRIX.md
docs/v3.0/e2e-018-screenshots/CAPTURE_MANIFEST.json      (135,789 bytes; 19 captures)
docs/v3.0/e2e-018-screenshots/*.png                      (19 images, 1440×942)
```

**FORENSICALLY CONFIRMED.** The capture evidence is accessible after all — not as a commit that can
be fetched by its own sha, but as tracked content of a reachable branch.

### 10.2 Capture conditions (from the manifest)

| Item | Value |
| --- | --- |
| Product commit / branch | `7964fccefbf95341699bf56b5833b2432981767d` / `phase13-next` |
| Governance commit | `e75858d247170cd16698456570e562d6dc31df6f` |
| Transport under capture | `frontend/server/executive-transport.ts` @ `7964fcce`, port **8787** |
| Frontend | port 5173, `/api → localhost:8787` |
| Baseline | `PROGRAM_v1.1_REPLAY_BASELINE.json` blob `63bcd350…` (§7.5) |
| **Authentication** | **real Keycloak 19.0.3**, realm `iips`, client `iips-spa`, user **`admin-a`**, role `iips-admin`, tenant `tenant-A`, **authorization-code + PKCE (S256) via the SPA Sign-in button** |
| Environment | Windows 11, Microsoft Edge 151 | 
| H / I / J | `NOT PERFORMED` (this was a Stage-A capture gate) |
| Method | DevTools `Page.captureScreenshot`, viewport 1440×900, `captureBeyondViewport` |

**FORENSICALLY CONFIRMED:** the observable state this gate is asked to recover —
`advisoryState: rendered` — was produced **through a real OIDC login against the guardRead-protected
dispatch**. It is not evidence of an unauthenticated path.

### 10.3 The measured observables

| Surface | Captures | Distinct `testId` keys | Elements | `advisoryState` |
| --- | --- | --- | --- | --- |
| Company Intelligence | 13 (one per governed sector) | **43 in every one** | 64–72 | `rendered` in all 13 |
| Sector Intelligence | 1 (Banking) | **40** | 60 | `rendered` |
| admin-engines, executive, cross-sector, decision-matrix, screener | 5 | — | — | `absent` |

Advisory contribution, measured: **exactly 8 keys per surface** —
`ai-explanation`, `ai-explanation-label`, `ai-explanation-text`, `ai-explanation-fields`,
`ai-explanation-ref`, `ai-explanation-unavailable`, `badge-ai`, `status-positive`.

Company composition: 43 = **15 route-invariant shell** + **8 shared surface keys**
(`badge-certified`, `data-table`, `freshness-snapshot`×2, `metric-card`, `metric-group`,
`metric-value`, `sector-select`, `state-unavailable`) + **8 advisory** + **12 company-only**
(`company-composite`, `company-header`, `company-provenance`, `company-replay-equivalence`,
`company-replay-original`, `company-replay-refs`, `company-sector-selector`, `decision-badge-<verdict>`,
`evidence-record-card`, `provenance-chain`, `replay-summary`, `snapshot-metadata-panel`).

Sector composition: 40 = 15 shell + 8 shared + 8 advisory + 9 sector-only
(`sector-company-link`, `sector-composite`, `sector-confidence`, `sector-provenance`,
`sector-recommendation`, `sector-replay-summary`, `sector-sector-selector`, `sector-supporting-scores`,
`decision-badge-<verdict>`).

The **15-key route-invariant shell**, measured as the intersection over **all 19** captures:

```
palette-trigger  notification-trigger  notes-trigger  sign-out  topbar-role  topbar-tenant
nav-status-{Research, Intelligence, Evidence, Opportunities, Rankings, Risks}
nav-future-{Opportunities, Rankings, Risks}
```

### 10.4 Reconciliation with Prompt 2C — set-level, exact

Prompt 2C could not read the manifest's key **names** (it recorded only the scalars) because the
capture commit was unfetchable. With the manifest now readable, the comparison is exact and is made
at **key-set level**, not merely by counting.

| Surface | Captured total | Captured shell | Captured surface keys | 2C surface keys | Intersection | Captured surface keys **missing** from 2C | 2C keys **not** in the capture |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Company | **43** | 15 | **28** (20 + 8 advisory) | 26 | **20** | **the 8 advisory keys — and nothing else** | 6 (`advisory-deferred`, `advisory-deferred-unavailable`, `ad17-disclosure`, `ad17-replay-literals`, `replay-literal-reproduced`, `replay-literal-byteIdentical`) |
| Sector | **40** | 15 | **25** (17 + 8 advisory) | 23 | **17** | **the 8 advisory keys — and nothing else** | the same 6 |

**FORENSICALLY CONFIRMED.** Three consequences, all now provable:

1. **AI Advisory is the *only* remaining surface-level parity gap.** Every captured surface key other
   than the 8 advisory keys is already present on both recovered surfaces. Nothing else is missing.
2. **Recovering the advisory closes surface-key parity outright**, on both surfaces: 26 − 2 + 8 = **32**
   Company keys and 23 − 2 + 8 = **29** Sector keys, covering **all** 28 / 25 captured surface keys —
   provided the two placeholder keys are retired in the same change.
3. The recovered surfaces also carry **4 keys the capture never contained**
   (`ad17-disclosure`, `ad17-replay-literals`, `replay-literal-reproduced`,
   `replay-literal-byteIdentical`) — an intentional, disclosed superset introduced by the AD-17/replay
   display, not a parity defect.

**On the whole-page scalar (43 / 40), stated precisely.** 2C advertised **37 / 34**; that figure was
*derived*, not measured — 2C computed it as its surface set (26) plus a *derived* 11-key shell. The
capture's own route-invariant shell, measured over all 19 captures, is **15** (§10.3). Whether the
delivered whole page renders 43/40 therefore depends on the current application's shell rendering
exactly the capture lineage's 15 chrome keys — a cross-lineage shell question this gate did **not**
measure, and did not need to: the parity obligation at issue is the surface key set, and that is
closed by the advisory recovery alone.

**UNVERIFIED / not recorded:** the capture stored key **presence** and `advisoryState`, never field
**values** (§7.4). The Prompt-1 manifest note that "5 of the 43/40 captured keys are
`ai-explanation*`" is superseded by the measured 8 (6 `ai-explanation*` keys + 2 shared badge keys).

**Correction carried forward (recorded, not silently fixed):** the Prompt-2C report §14 both derives
a shell constant of **11** (`43 − 32 = 11`, `40 − 29 = 11`) and labels it "17-byte" in its own table —
an internal inconsistency. Both are superseded by direct measurement (**15**). No Prompt-2C conclusion
depends on the constant, and no source file is changed by this observation.

**Observation, recorded not resolved:** the IVM states the advisory is embedded in the Decision
Matrix as well, yet `decision-matrix.png` reports `advisoryState: absent`. Decision Matrix is outside
this gate's scope; the discrepancy is recorded for whoever gates that surface.

---

## 11. Browser-boundary analysis

| Requirement | Finding | Label |
| --- | --- | --- |
| Browser code may not import `node:*`, `src/transports/**`, `iips-platform/**` | The three browser-side donor artifacts import **only** React, `./authFetch`, `../state/StateComponents`, `../ui/Badges` — all present, all browser-safe | **SAFE FOR NEXT GATE** |
| No direct `fetch` / XHR / WebSocket / EventSource in arbitrary donor code | `api/aiAdvisory.ts` uses the canonical `authFetch` seam exclusively | **SAFE FOR NEXT GATE** |
| No provider/network endpoint | Closure contains **zero external packages** and no provider client; the advisor is in-process | **SAFE FOR NEXT GATE** |
| No PIT / `asOf` | Absent from the DTO, the client and the transport | **EXCLUDED** (unchanged) |
| Server authority stays out of the Vite graph | `ai-advisory-transport.ts` is `node:http`-hosted server code, exactly like the Prompt-2B authority module (which the bundle check proved absent from the browser bundle) | **SAFE FOR NEXT GATE** |
| Browser-side dependencies already present | `authFetch`, `Badges` (`badge-ai`/`status-positive`), `StateComponents`, and the 2C `AdvisoryDeferred` mount points | **FORENSICALLY CONFIRMED** |

**Unchanged, pre-existing condition (recorded, not caused by this unit):** the browser entry graph
still reaches `node:*` transitively through the pre-existing `src/transports/executive_transport.ts`
via the seven baseline Path-L importers. Prompt 2C pinned that exact baseline in PU-14; this gate adds
nothing to it and claims no node-free browser graph.

---

## 12. Production / provider implications

| Statement | Verdict |
| --- | --- |
| AI Advisory requires a production provider, model endpoint or API key | **NO — FORENSICALLY CONFIRMED.** Zero external packages in the closure; zero network calls; model identity is `iips-deterministic-advisor` and is truthful about being deterministic. |
| AI Advisory requires production configuration | **NO** for the payload. The *historical endpoint* additionally required a Keycloak realm + OIDC metadata + a real verifier (§8). |
| Recovering the unauthenticated variant would move the program toward production | **NO** — it is explicitly non-production; it would require the `X-IIPS-Authentication: NONE (non-production, unauthenticated development transport)` / `X-IIPS-Certification: NONE CLAIMED` disclosure pattern already established by Prompt 2B. |
| New data exposure relative to what is already served unauthenticated | **MINIMAL AND ENUMERABLE.** The advisory DTO exposes fixed constants, `grounded` (derived from values the 2B company authority already serves) and the deterministic `SNAP_<8 hex>` snapshot reference + its FNV-1a advice id. It exposes **no** provider, tenant, confidence, citation, timestamp or decision field — the DTO names those as unavailable. |
| Provider activation | **NOT GRANTED** — and not needed. |
| Windows artifacts | **untouched.** The capture's Windows/Edge provenance is evidence, not a deliverable. |

---

## 13. Minimum implementation dependency set

If and only if the authority grants a next gate, the **minimum** set is:

| # | Item | Origin | Class |
| --- | --- | --- | --- |
| 1 | `iips-platform/src/distributed/AiAssistedRuntime.ts` | **already in baseline, byte-identical** | REUSE |
| 2 | `program-v1.1-certification/PROGRAM_v1.1_REPLAY_BASELINE.json` (blob `63bcd350…`) | already in baseline | REUSE |
| 3 | `frontend/src/components/ui/Badges.tsx` (`badge-ai`, `status-positive`) | already in baseline, byte-identical | REUSE |
| 4 | `frontend/src/components/state/StateComponents.tsx` | already in baseline (AD-17-amended version) | REUSE |
| 5 | `frontend/src/api/authFetch.ts` | already in baseline | REUSE |
| 6 | NEW current-lineage server module: deterministic DTO builder (constants + advisor + guard + `buildAiAdvisoryDto`) + a 2B-pattern `node:http` route, reusing `AiAssistedRuntime` | donor core + 2B precedent | **NEW (bounded)** |
| 7 | `frontend/src/api/aiAdvisory.ts` | donor, verbatim body | ADAPTER |
| 8 | `frontend/src/components/ai/AiExplanation.tsx` | donor, verbatim body | ADAPTER |
| 9 | Mount swap in `CompanyIntelligence.tsx` / `SectorIntelligence.tsx` (replace the deferred placeholder) | current lineage | NEW (2 lines each) |
| 10 | Governed test amendments: PA-11, PA-12, PA-13/14, PA-15, PA-21 + the advisory key-set constants; retire the two placeholder keys | current lineage | NEW |
| 11 | New `node:test` guards: no `guardRead`/auth-tier import, disclosure headers present, DTO equals the §7.3 frozen values, no provider/network primitive, no replay/AD-17 claim, `engineResultUnchanged` not asserted as verification, fail-closed states | current lineage | NEW |

**Explicitly not in the minimum set:** `handleAiAdvisoryRequest`, `admin-transport`,
`secured-executor`, `keycloakAdapter`, `authContract`, `real-oidc-verifier`, `secrets`, `directory`,
`notifications`, `notes`, `persistence`, the donor `executive-transport.ts` dispatch, and every vitest
donor test. **12 files + the dispatch stay out.** No `guardRead` reconstruction, no Keycloak/OIDC
recovery, no PIT/D114/D115, no provider activation.

---

## 14. Whether Option A or Option B is technically supported by the evidence

### Option B — dedicated auth-boundary dependency requiring recovery/availability of the historical auth tier

**EXCLUDED.** It requires the 12 absent files, a `guardRead` implementation (explicitly prohibited:
"do not reconstruct `guardRead`"), Keycloak/OIDC recovery (prohibited), and a live realm
(`EXTERNALLY BLOCKED`: no IdP, no credentials, no container runtime here; criteria H/I/J are
"not self-clearing" and must be withdrawn only by a further governance record). Option B is not
available to any gate under current authority — and, notably, the historical program itself never
closed it live.

### Option A — non-production unauthenticated development transport, disclosed exactly as Prompt 2B does

**Technically supported by the evidence — but AUTHORITY-DEPENDENT, not self-authorising.**

*What the evidence establishes in favour:* the payload is deterministic, provider-free and
byte-identity-pinned (§7.3–7.5); the computation needs **zero new dependencies** (§8.1); the browser
side is pure presentation over existing primitives (§11); the disclosure pattern, the host pattern
and the "NONE CLAIMED" labelling already exist in this very lineage from Prompt 2B; and the new
exposure is a bounded, enumerable set of derived constants and one opaque snapshot reference (§12).

*What the evidence refuses to let anyone pretend:* the historical surface is a **governed read**
(401/403 with `read.ai-advisory` RBAC) and its **designed** unauthorised behaviour is a 401 — the
certification record says an authenticated live 200 is "unreachable by construction" without an
executor. The captured `advisoryState: rendered` was itself produced through a real OIDC login. An
unauthenticated 200 therefore does not *recover* the historical boundary; it **replaces** it. That is
a governance decision about a non-production endpoint, and this gate is forbidden to treat it as a
technical detail: authentication bypass is prohibited, `guardRead` must not be silently removed, no
authenticated state may be fabricated, and no production authorization may be claimed.

**Determination:** the *implementation* boundary is conclusively established (files, dependencies,
payload, parity delta, disclosure). The *authority* boundary is **not** established by evidence alone
and must be granted explicitly. Under the current, unamended authority, neither option may be
implemented; with an explicit grant of Option A, the next gate is fully executable from §13 without
further planning (§16).

---

## 15. Explicit unresolved items

| # | Item | Label |
| --- | --- | --- |
| U-1 | Authority grant for an explicitly-disclosed unauthenticated non-production advisory transport (Option A). | **AUTHORITY-DEPENDENT** |
| U-2 | Authority decision recorded as `D4=C` that withholds live browser/UI execution of the advisory. | **AUTHORITY-DEPENDENT** |
| U-3 | `governance/iips/DEC-G-AI-IMPL-CERTIFICATION.md` and `…-CERT-CRITERIA.md` are cited but absent from every accessible ref (code search `total_count: 0`); their contents cannot be read. | **EXTERNALLY BLOCKED** |
| U-4 | Criteria H / I / J remain **NOT PERFORMED** and are "not self-clearing"; no live IdP or container runtime is available here. | **EXTERNALLY BLOCKED** |
| U-5 | Exact captured advisory field *values* — the capture manifest records key presence and `advisoryState`, never values. The §7.3 values are derived and corroborated (§7.4), not recorded. | **UNVERIFIED** |
| U-6 | The IVM states the advisory is embedded in the Decision Matrix, but `decision-matrix.png` reports `advisoryState: absent`. | **UNVERIFIED** |
| U-7 | The advisory's `engineResultUnchanged` integrity check is a hardcoded literal, so its 500 branch is unreachable; the real comparator is test-only. | **FORENSICALLY CONFIRMED (as a defect disclosure)** |
| U-8 | Prompt 2C's derived shell constant (11) is superseded by the measured 15; no 2C conclusion depends on it. | **FORENSICALLY CONFIRMED (correction)** |
| U-9 | The E2E-018 capture deposit remains unfetchable *by its own commit sha*; its content is nevertheless available in-tree at `m1-ad4-repair`. | **FORENSICALLY CONFIRMED** |
| U-10 | Whether the delivered advisory can be described as "certified": it cannot (A2-partial, H/I/J not performed). Any such claim is barred. | **EXCLUDED** |

---

## 16. Exact recommended next executable gate

**Recommended next gate:** a **bounded AI Advisory Option-A implementation gate**, launched with the
authority affirmation below as its first directive. If that affirmation is withheld or amended, the
correct terminal action is to leave the Prompt-2C deferred state exactly as it stands — the parity
shortfall is then the **8 advisory surface keys per surface** (offset by the 2 disclosed placeholder
keys), which is a disclosed, honest loss.

The prompt below is self-contained and can be launched as-is.

---

```
IIPS — AI ADVISORY OPTION-A BOUNDED RECOVERY (AUTHORITY-GOVERNED IMPLEMENTATION GATE)

AUTHORITY AFFIRMATION (required; this prompt is the grant)
- Authority is GRANTED for a NON-PRODUCTION, UNAUTHENTICATED development transport that serves the
  deterministic AI advisory DTO, explicitly and visibly disclosed on every response exactly as the
  Prompt-2B authorities are (X-IIPS-Authentication: NONE (non-production, unauthenticated
  development transport), X-IIPS-Certification: NONE CLAIMED). This is a disclosed non-production
  substitution for the historical guardRead-protected endpoint. It is NOT a certification, NOT a
  production authorization, and NOT a claim that the historical authorization boundary was recovered.
- Recovering guardRead, the Keycloak/OIDC tier, or any of the 12 absent auth files remains FORBIDDEN.
- If this affirmation is not accepted, STOP immediately without modifying anything.

BASELINE (verify before starting)
- git rev-parse HEAD == git ls-remote origin refs/heads/arena/01a0d1d3-iips-production-market-data
- clean workspace; main == 4d3e1cdcaa33da0ec3be8b336b17128108a502c; if not durable STOP.
- Starting point: the forensic report IIPS_AI_ADVISORY_FORENSIC_AUTHORITY_REPORT.md and the
  evidence it records (certified lineage f63a9b493118643725568a95b86405a5835a30a0; branch
  m1-ad4-repair = ad41b4d48299b7a58d3f2f44ae8ef8e11462f294; capture productCommit 7964fcce).

DELIVERABLES (minimum set only)
1. NEW frontend/server/ai-advisory-transport.ts (current lineage): the deterministic DTO core
   transcribed from the certified transport (ADVISORY_TEXT, ADVISORY_LABEL = 'AI EXPLANATION ≠
   CERTIFIED RESULT', ADVISORY_FRESHNESS = 'SNAPSHOT', ADVISORY_UNAVAILABLE = [timestamp, tenant,
   provider, confidence, citations, decision], ADVISOR_MODEL = 'iips-deterministic-advisor',
   ADVISOR_MODEL_VERSION = '1.0.0', createDeterministicAdvisor, guardAdvisorCompletion,
   buildAiAdvisoryDto using the canonical adviceId() from iips-platform
   distributed/AiAssistedRuntime) + a 2B-pattern node:http route GET /api/ai-advisory/:sectorKey.
   NO guardRead. NO auth-tier import. NO donor dispatch. Sector resolution: a current-lineage
   mapper over the frozen baseline (program-v1.1-certification/PROGRAM_v1.1_REPLAY_BASELINE.json,
   blob 63bcd350f2cda2b0337097c25236fd8dbe82d87b) and the 13 engines, in the 2B style. Serve it on
   the existing non-production host if that does not modify or weaken the Prompt-2B authority
   module or any byte-frozen statement; otherwise add a separate host module and disclose.
   Reuse the already-present, byte-identical AiAssistedRuntime — do NOT duplicate it.
2. NEW frontend/src/api/aiAdvisory.ts — donor body verbatim, current .js specifier convention,
   authFetch only, no asOf, no PIT.
3. NEW frontend/src/components/ai/AiExplanation.tsx — donor body verbatim (104 lines), .js
   specifiers, presentation-only, renders the governed DTO 1:1.
4. MODIFY CompanyIntelligence.tsx and SectorIntelligence.tsx: replace the AdvisoryDeferred mount
   with <AiExplanation sectorKey={...}/>; retire the two placeholder keys; do not touch anything
   else in those surfaces.
5. Governed test amendments (each narrowed and justified inline in the commit message): PA-11
   (advisory keys now PRESENT — invert), PA-12 (placeholder ban -> advisory disclosure assertions),
   PA-13/14 (assert SURFACE key-set parity against the capture: Company 32 keys covering all 28
   captured surface keys; Sector 29 covering all 25; report the delivered whole-page scalar honestly
   against the measured 15-key capture shell and do NOT assert 43/40 as a measured figure),
   PA-15 (shortfall now empty), PA-21 (report wording), and the advisory key-set constants. Do not
   weaken any other assertion.
6. NEW node:test guards (no new test framework): the 12-field DTO equals the frozen values in the
   forensic report §7.3 for all 13 sectors (refs SNAP_* and adviceIds); the endpoint's responses
   carry the two disclosure headers; the transport imports no guardRead/admin-transport/keycloak
   module and no node module beyond node:http; the browser files import no node:/src/transports/
   iips-platform; no fetch/XHR/WebSocket/EventSource/provider endpoint in the browser files;
   fail-closed states preserved (404 unknown sector; 503 advisory-unavailable with no advisory
   body; no fabricated fields); the two retired placeholder keys are absent.
7. Report IIPS_AI_ADVISORY_RECOVERY_REPORT.md with: exact starting HEAD, final HEAD, LOCAL ==
   REMOTE, workspace state, files added/changed, the frozen DTO table, disclosure-headers proof,
   browser-boundary proof, bundle size before/after, full regression, and an explicit statement
   that the historical authorization boundary was NOT recovered and that this endpoint is a
   disclosed non-production substitute. Do NOT claim certification, live verification, runtime
   engine-result verification, or production readiness. Cite the A2-partial status and the
   not-self-clearing H/I/J limitation.

EXCLUSIONS (absolute)
- Do NOT implement guardRead, Keycloak/OIDC, or any of the 12 absent auth files.
- Do NOT adopt the donor frontend/server/executive-transport.ts dispatch.
- Do NOT add asOf/PIT, PitVintageProvider, p08PitStore, d114AdmissionBridge, D114/D115 components.
- Do NOT activate providers, access production, or touch Windows artifacts.
- Do NOT add vitest/jsdom/testing-library; do NOT import donor tests.
- Do NOT modify /research (UI03), navigation, or unrelated surfaces; do NOT change main; do NOT
  merge, rebase or force-push.
- Do NOT claim AD-17/M-2 resolution, and do NOT describe engineResultUnchanged as runtime
  verification (it is a hardcoded literal in AiAssistedRuntime; disclose it).

TEST / BUILD / DURABILITY
- npm run build:tsc, npm run build:vite, node --test dist/tests/*.test.js (baseline 649/106/0;
  report the new totals and investigate any unexpected delta), bundle before/after comparison, and
  the authority-symbol grep on the built bundle.
- ONE logical unit: commit -> push -> verify LOCAL == REMOTE -> verify clean workspace. Append-only
  history: never amend or rewrite an already-pushed commit; if commit or push fails, STOP.
- Then STOP. Do not start any further surface, provider, production, Windows or D115 work.
```

---

## Test / build evidence for this gate

| Command | Result |
| --- | --- |
| `npm run build:tsc` | exit 0 |
| `node --test dist/tests/*.test.js` | **649 tests / 106 suites / 649 pass / 0 fail** — identical to the Prompt-2C tip |
| Test expectations changed | **none** |
| New implementation tests added | **none** (this gate added no test; its two probes were throwaway and deleted) |

---

## Durability

One logical unit: evidence → report → commit → push → verify `LOCAL == REMOTE` → verify clean
workspace. **No source file was created, modified or deleted in this gate**, so the only commit is
**report-only**: it adds this file and changes nothing else. `main` remains `4d3e1cd`; no merge, no
rebase, no force-push; the push is a fast-forward. If the commit or push fails, this gate stops
without touching source.
