# W06 — AGI observations: evidence (2026-11-25)

Record: [`docs/integration/IIPS-W06-AGI-QUOTE-OBSERVATION-EVIDENCE-2026-11-25.md`](../../../docs/integration/IIPS-W06-AGI-QUOTE-OBSERVATION-EVIDENCE-2026-11-25.md).

This directory holds **operator-supplied live evidence** for W06 — two observations of the same
security, from two different surfaces — not a re-execution. IPD did not send either request, did not
read a credential, did not run on the Windows host and did not observe the daemon. The operator ran
both; the terminal outputs are transcribed byte-for-byte and then checked offline against this
repository's own code.

| # | File | What it is | SHA-256 | Bytes |
|---|---|---|---|---|
| 1 | `operator-terminal-output.txt` | **Quote observation.** The complete original terminal output of the single `POST /v1/quotes` request — prompt line, HTTP status and response line, no reformatting and no added fields. | `e11287ab…c371` | 897 |
| 1a | `agi-quote-envelope.json` | The same response line as a standalone JSON document. Byte-identical to line 3 of the transcript. | `7658684f…c98b` | 839 |
| 2 | `freshness-observation-output.txt` | **Freshness observation.** The complete original output of the separate read-only `GET /v1/freshness` request — all 16 fields, exactly as printed. | `d3202701…9c41` | 626 |
| — | `verify-w06-agi-evidence.mjs` | Offline verifier for observation 1. | — | — |
| — | `verification-output.txt` | Its output at `e50a473` + this record: **26/26 PASS**. | — | — |
| — | `verify-w06-agi-freshness.mjs` | Offline verifier for observation 2. | — | — |
| — | `freshness-verification-output.txt` | Its output at the same commit: **27/27 PASS**. | — | — |

Full digests:

```
operator-terminal-output.txt    e11287abe464653a444ae9045be9e0fa51915dc4b9f0d2e014060704e46dc371
agi-quote-envelope.json         7658684fe71be35d49077685d44078411fa0a0aad16053dfb28774c37666c98b
freshness-observation-output.txt d3202701a6142480d87e196e4acfd69b3f64e7647b3fb217f76eaa8615a49c41
```

## The two observations are different documents, and only together do they answer W06

| | Observation 1 — quote | Observation 2 — freshness |
|---|---|---|
| Surface | `POST /v1/quotes` | `GET /v1/freshness` |
| Cost | spent one vendor request | read-only; spent nothing, called no provider |
| Answers | what the price was, with provenance and lineage | whether that price is usable *now*, as a verdict |
| Verdict field | none — an envelope has no `verdict` | **`verdict: UNAVAILABLE`** |
| Per this evidence | HTTP 200, `qualityState: GOOD`, `freshness: CURRENT` | `cacheState: UNAVAILABLE`, `eligibleForUse: False`, `suppressExecution: True` |

**These do not contradict each other.** `GOOD` and `CURRENT` in observation 1 describe the quote at its
own evaluation instant (29.774 s of age). Observation 2 evaluates the *same* retained quote at a later
instant, 2,731.174 s after the vendor's `asOf`, which is beyond twice the 900 s D01 threshold. The
verdict is therefore `UNAVAILABLE`, and that is the evaluator working correctly on an aged observation.

`lastRefresh: @{outcome=SUCCESS; lastFailure=}` records that the quote request which populated the
cache succeeded. It is session history, reported **alongside** the verdict, and it is deliberately not
substituted for it.

## Calendar status — the read is not session-qualified, and the calendar could not have qualified it

| Field | Value | Meaning |
|---|---|---|
| `calendarMode` | `LEGACY_ELAPSED_UNQUALIFIED` | No calendar was configured for the daemon; age is elapsed wall-clock seconds |
| `calendarAssessment` | `NOT_CONFIGURED` | The no-calendar label. It is **not** a coverage finding and it does not mean the day was closed |

Verified in the same evidence: the published calendar `.2` has **no NSE row for 2026-11-25**, so
configuring it as-is would have produced `MISSING_COVERAGE` and no age at all. And a session-qualified
assessment of *this* observation would still read `UNAVAILABLE`, because the session-age computation
includes the open session in progress — see the record, §6.4. `calendarAssessment: NOT_CONFIGURED` is
therefore a label to be corrected by a new observation, not a defect to be repaired by re-reading.

## Verify

```sh
npm ci && npm run build:tsc
node evidence/integration/w06-agi-quote-observation-2026-11-25/verify-w06-agi-evidence.mjs    # 26/26
node evidence/integration/w06-agi-quote-observation-2026-11-25/verify-w06-agi-freshness.mjs   # 27/27
```

Exit code 0 means every check passed. A failure means the record has drifted from the bytes it was
written against, and it must not be relied on until reconciled.

Each verifier asserts the other's subject matter as well as its own: the quote verifier (V25–V26)
requires that the freshness read reports *this* quote's `asOf`/`receivedAt`, and the freshness verifier
(F06, F24–F25) requires that the quote evidence is unchanged and that both describe `EQ_AGI_IN`. The
link between the two observations is therefore asserted, not assumed from a shared directory name.

Both verifiers read tracked files only. They open no socket, read no credential, touch no database and
write nothing. **They are not the observations and they replace no operator step** — in particular they
are not a reason to repeat the quote request, and re-running them is not a substitute for the new
observation described in the record, §7.
