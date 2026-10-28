# CAP-03 S2 — 47 manifest-listed Windows evidence files: independent hash verification (`2026-10-28`)

**Record:** `IIPS-V3-CAP03-S2-47FILE-INDEPENDENT-HASH-VERIFICATION-IPD-RECORD-2026-10-28-01`
(census before this record: `0` occurrences in this repository).

This bundle records an **independent hash verification** of the 47 manifest-listed Windows evidence
files associated with the **CAP-03 S2 package-consumer evidence requirement**. It is a verification
record only. It renders no decision, re-pins nothing, moves no gate, grants no authority and accepts
nothing. No S2 step, test run, build, manifest generation or manifest regeneration was performed.

> **Naming discipline.** This record concerns the **CAP-03 S2 package-consumer evidence
> requirement**. It does **not** concern, and makes no statement about, the **Gate 4 Limb A
> native-Windows `npm test` requirement**, which is a separate requirement with a separate status
> and a separate acceptance path. Neither is referred to as merely "S2" anywhere in this record.

## 1. Headline result

The original evidence bytes **are** reachable through an authoritative repository record. They were
transferred to `ramkivs/iips-review-recovered` and **deposited to IRR `main` through PR #310**
(`54d5a56f…` → merge `47133fe4…`, `2026-10-26T16:33:33Z`) with green exact-head CI and green CI on
the merge commit. All 57 blobs were retrieved read-only over the GitHub REST API
(`15,400,304` bytes) and hashed **as committed, unaltered**.

| Measure (47 Windows-evidence entries) | Count |
|---|---:|
| `MATCH` — committed bytes hash to the recorded digest | **1** |
| `MISMATCH` — committed bytes do **not** hash to the recorded digest | **46** |
| of the 46: differ by line termination only (CRLF-restored form matches) | **43** |
| of the 46: not reproduced by any tested transformation | **3** |
| `MISSING` | **0** |
| `INACCESSIBLE` | **0** |
| `NOT_VERIFIED` | **0** |

**Every one of the 47 entries was verified.** No entry is unverified, missing or inaccessible. The
verification is complete; its outcome is largely negative on byte identity.

## 2. Why 46 of 47 are `MISMATCH` — and what that does and does not mean

The committed copies are **LF-normalised**. The digests in the manifest of record are of the
**Windows host's CRLF bytes**. Hashing the committed bytes unaltered therefore cannot reproduce
those digests, and per the verification rules applied here no entry is marked `MATCH` on the
strength of a transformation.

For **43** entries the CRLF-restored form of the committed bytes reproduces the recorded digest
exactly. That establishes **content equality modulo line termination**. It does **not** establish
byte identity with the originals on `desktop-no0nhtp`, and this record does not assert that it does.
Line-termination restoration was computed **only as a diagnostic to classify the reason for the
mismatch**; the authoritative per-entry state is the as-committed result.

For **3** entries no tested transformation reproduces the recorded digest:

| File | Bytes | Expected digest | As-committed digest |
|---|---:|---|---|
| `00-preflight-results-provided-in-chat.txt` | 1,363 | `BEE567CB…` | `CD828D2C…` |
| `s2-checkout-verification.txt` | 1,427 | `3FD31FE6…` | `0DF30BC6…` |
| `s2-ipd-pr-body-20261026T100850Z.md` | 1,050 | `DC54484A…` | `E05FB70D…` |

The single `MATCH` is `s2-tracker-reconciliation-20261026T100434Z.txt`, which was already LF on the
host, so its committed bytes are its original bytes.

## 3. All nine required S2 filenames — verified, all `MISMATCH` as committed

All nine required filenames are present and were hashed. All nine are `MISMATCH` as committed and
all nine fall in the line-termination-only class:

`s2-01-npm-ci.txt` · `s2-02-tsc-noemit.txt` · `s2-03-build.txt` · `s2-03-dist-count.txt` ·
`s2-03-dist-sha256-before.txt` · `s2-04-guarded-npm-test.txt` · `s2-05-package-consumer.txt` ·
`s2-post-run-pin.txt` · `s2-dist-sha256-after.txt`

The two previously recorded Windows validation digests behave identically:

| File | Recorded digest | As committed | CRLF-restored |
|---|---|---|---|
| `s2-npm-launch-fix-suite-20261026T095613Z.txt` | `C5DDFFA2…` | `5B9FA852…` **MISMATCH** | `C5DDFFA2…` matches |
| `s2-npm-launch-fix-consumer-20261026T095613Z.txt` | `9F7C6407…` | `E4B48EF0…` **MISMATCH** | `9F7C6407…` matches |

These two digests have until now been carried in this repository only as reported values. They are
now reproducible from repository content **modulo line termination** — a genuine strengthening, but
not byte-level read-back of the host originals.

## 4. Manifest of record

| Field | Value |
|---|---|
| Path | `evidence/integration/cap03-s2-evidence-manifest-verification-2026-10-26/SHA256SUMS.txt` (IRR) |
| Git blob | `b4ea1b779d…` |
| Bytes / entries | `5,312` / **53** (`47` Windows-evidence + `6` IRR-authored) |
| SHA-256 of the manifest file | `E2118778D7B5D08CD6C346ADB038D54AFA5AA9756E20C243ADEB4DCCA4D9DF22` |
| Listed but absent | `0` |
| Present but unlisted | `4` — `NON_AUTHORITATIVE_TRANSFER.md`, `SHA256SUMS.txt`, `s2-04-sha256-manifest-generation.txt`, `s2-evidence-manifest-verification.txt` |
| `windows-session-transcript.txt` | absent from the tree, consistent with the reported locked-file exclusion |

## 5. Method and tooling

Read-only throughout. `gh api` against `repos/ramkivs/iips-review-recovered/git/trees/…?recursive=1`
to enumerate blobs, then `git/blobs/<sha>` per file, base64-decoded to disk. SHA-256 computed with
Python `hashlib` over the decoded bytes **exactly as committed** — no normalisation, no line-ending
change, no reserialisation, no re-encoding. Each digest compared with the manifest entry. The
companion `verify_47file_record.py` re-derives every result from the remote bytes and exits non-zero
on any divergence; it was run and returned exit `0`
(`53` entries re-hashed; `1` `MATCH` / `46` `MISMATCH`; `43` + `3` breakdown).

## 6. Limitations — stated plainly

- **Byte identity with the Windows host originals is NOT established** for any of the 46
  `MISMATCH` entries. The originals exist only on `desktop-no0nhtp`; the repository holds
  LF-normalised copies.
- **This verification is not the CAP-03 S2 package-consumer evidence acceptance.** It is an
  integrity check of transferred bytes. Acceptance is a separate act and is **not rendered here**.
- **No statement is made about Gate 4 Limb A.** The native-Windows `npm test` requirement is
  separate and its status is unchanged by this record.
- The 47-entry manifest-verification `PASS` remains **user-reported**: the only preserved
  verification artifact records `Manifest entries: 1148` / `Result: FAIL`, a tooling
  mis-invocation that consumed the post-run distribution inventory, and
  `s2-04-sha256-manifest-generation.txt` records `Files included: 48` against the manifest's `47`.
  Neither artifact corroborates the reported `PASS`, and the `48`-versus-`47` difference is
  recorded here, not resolved.
- No S2 execution provenance was observed. This record did not access `desktop-no0nhtp`.

## 7. Required operator inputs

1. The **original host bytes** (CRLF form) of the 47 files, or at minimum of the 3 files that do not
   reproduce, through the same governed channel — so that byte identity, not content equality
   modulo line termination, can be established.
2. The **47-entry manifest-verification output** that produced the reported `PASS`.
3. A ruling on the **`48` versus `47`** entry-count difference.

## 8. Files in this bundle

| File | Content |
|---|---|
| `00-baseline.json` | Verified baseline refs, PR #103 state, evidence source commit/tree, deposit PR #310, CI results, blob-identity check, manifest identity |
| `01-per-file-results.json` | All 53 entries: expected digest, independently calculated as-committed digest, CRLF-restored digest, state, byte count, git blob, and the reason for the state |
| `02-source-search.json` | Every source searched, with its classification |
| `verify_47file_record.py` | Reproducible read-only re-derivation of every result from the remote bytes |
| `SHA256SUMS.txt` | SHA-256 of each file in this bundle |

No file on `desktop-no0nhtp` was accessed. Zero IRR writes. No runtime, test, script, package
configuration, evidence manifest, designated blob, compiled basis, execution pin or execution
receipt was modified.
