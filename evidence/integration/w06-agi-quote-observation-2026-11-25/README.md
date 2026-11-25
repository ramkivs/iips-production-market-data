# W06 — AGI quote observation: evidence (2026-11-25)

Record: [`docs/integration/IIPS-W06-AGI-QUOTE-OBSERVATION-EVIDENCE-2026-11-25.md`](../../../docs/integration/IIPS-W06-AGI-QUOTE-OBSERVATION-EVIDENCE-2026-11-25.md).

This directory holds **operator-supplied live evidence** for W06, not a re-execution. IPD did not send
the request, did not read a credential, did not run on the Windows host and did not observe the
daemon. The operator ran it; the terminal output below is transcribed byte-for-byte and then checked
offline against this repository's own code.

| File | What it is | SHA-256 | Bytes |
|---|---|---|---|
| `operator-terminal-output.txt` | The complete original terminal output, exactly as supplied — prompt line, HTTP status and response line, no reformatting and no added fields. | `e11287abe464653a444ae9045be9e0fa51915dc4b9f0d2e014060704e46dc371` | 897 |
| `agi-quote-envelope.json` | The same response line as a standalone JSON document, for machine reading. Byte-identical to line 3 of the transcript. | `7658684fe71be35d49077685d44078411fa0a0aad16053dfb28774c37666c98b` | 839 |
| `verify-w06-agi-evidence.mjs` | Offline verifier: re-derives every mechanically checkable property from the recorded bytes and the compiled functions of this checkout. | — | — |
| `verification-output.txt` | Its output at commit `836dbcf3b17280d5a684288e0f78f06c99a5af71`: **24/24 PASS**. | — | — |

## What the evidence establishes, and what it does not

**Establishes:** exactly one quote request was issued for `EQ_AGI_IN` and it succeeded (HTTP 200); the
response is a canonical `D01_QUOTES` envelope with `mode: SNAPSHOT`, `schemaVersion: 2.0.0`,
`qualityState: GOOD` and `freshness: CURRENT`; bid/ask are **supplied and positive** (`639.55` /
`640`), not `0` and not `null`; provenance carries `asOf`, `receivedAt`, `evaluatedAt`, `dataVersion`
and a lineage hash that recomputes exactly; the envelope ID is derived from that hash.

**Does not establish:** the separate freshness observation. The response contains **no**
`cacheState`, `verdict`, `timestamps`, `timestampStates` or `lastRefresh` — those exist only on
`GET /v1/freshness`. Its own `freshness: CURRENT` field is a property of this envelope, not a
freshness-status read. See the record, §5.

**Does not establish either:** the provenance of the request path. The transcript does not record the
route, the client, the daemon instance, the bearer credential's validity window or a vendor-side
number. Those are operator-side facts this repository cannot verify, and nothing here invents them.

## Verify

```sh
npm ci && npm run build:tsc
node evidence/integration/w06-agi-quote-observation-2026-11-25/verify-w06-agi-evidence.mjs
```

Exit code 0 means all 24 checks passed. A failure means the record has drifted from the bytes it was
written against, and it must not be relied on until reconciled.

The verifier reads tracked files only. It opens no socket, reads no credential, touches no database
and writes nothing. **It is not the observation and it replaces no operator step** — in particular it
does not, and must not, be used as a reason to repeat the quote request.
