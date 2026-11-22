# IPD D-18 — temporary raw Dhan depth capture: build record and Windows activation procedure

- **Date:** 2026-11-20
- **Branch:** `arena/b210f700-iips-production-market-data`, based on `cbb116d2a221b82a704b4b96cf17efe0560e2498` (`main` after PR #186)
- **Scope:** one temporary, opt-in, one-shot diagnostic. No change to normalisation, D-5 validation, DTOs, or provider semantics.
- **Live request performed:** **no.** Nothing in this record was obtained from a Dhan or vendor response. The capture has never run against the vendor, in this session or any other.
- **Status:** implementation complete, unit-tested, one-shot verified offline. Awaiting operator execution on the Windows host, which requires the restart described in §6.

---

## 1. Why this exists

D-18 records that the Dhan REST Full Quote `depth` structure is "documented nowhere" in the IPD evidence set, and that it is not resolvable from existing evidence. The concrete open question is what a **successfully parsed** quote response actually contains in `depth` when the market is closed — specifically whether the vendor sends `0`, `null`, an empty array, or omits the key entirely. Existing documents record the *normalised* outcome, not the received bytes, and no captured market-closed payload exists anywhere in the repository.

This diagnostic captures the received `depth` block verbatim for **one** quote response so that question is answered from evidence instead of inference. It is intended for removal once D-18 is resolved.

## 2. Where the original body is received

| Stage | Location | What it holds |
| :--- | :--- | :--- |
| Raw HTTP text | `src/providers/dhan/dhan_server_egress.ts:114` — `await response.text()` | The vendor's exact bytes as a string |
| Parsed JSON | `src/providers/dhan/dhan_api_client.ts` — `executeJsonPost`, `parsedJson = JSON.parse(response.bodyText)` | The identical structure, parsed |
| **Capture hook** | `dhan_api_client.ts` — immediately after `JSON.parse`, before `dhanOk(...)` and **before** any normalisation | The value handed to the extractor (by reference, never mutated) |
| Normalisation | `dhan_normalizer.ts` | Downstream, untouched |

The hook sits before `dhan_normalizer.ts` in the call order, so what is recorded is the vendor's structure, not a derived one.

## 3. Files changed

| File | Change | Size |
| :--- | :--- | :--- |
| `src/providers/dhan/dhan_depth_capture.ts` | **New.** Extractor, environment/path resolution, one-shot latch, arm/disarm marker API. | 291 lines |
| `src/providers/dhan/dhan_api_client.ts` | **Modified.** One import block, one call site in `executeJsonPost`, one private `captureRawDepthIfEnabled`. | +52 / −0 |
| `tests/dhan_depth_capture.test.ts` | **New.** 24 tests in 4 suites (CAP-01 … CAP-23, incl. CAP-14a). | 480 lines |

**Verified unchanged** (blob hashes identical to `HEAD`):

| File | Blob |
| :--- | :--- |
| `src/contracts/d01_quotes.ts` (D-5) | `42e6f15edf34fe847f2b6d551bc003bd7893e457` |
| `src/providers/dhan/dhan_normalizer.ts` | `de38fc6c6aae7266a63aa6af35c6c72d3bc04c24` |
| `src/providers/dhan/dhan_dto.ts` | `48f95ccb24583c2adacd16acf147fea4435cba9f` |

`git diff --stat` reports exactly one modified file (`dhan_api_client.ts`, 52 insertions) plus the two new untracked files. No other file in the repository is touched.

## 4. Enablement — two independent controls

### 4.1 `IIPS_DHAN_DEPTH_CAPTURE_PATH` — the *destination* (required, read at request time)

The absolute path of the capture file. Unset, empty or whitespace-only means the diagnostic is off and `captureRawDepthIfEnabled` returns on its second line. This is read from `process.env` **per request**, but see §6: for a running daemon that value is whatever was present when the process was launched.

### 4.2 `IIPS_DHAN_DEPTH_CAPTURE_LABEL` — optional provenance stamp

Free text written into the document as `label`, so a later reader knows which request produced the file. Purely descriptive; never used for gating.

### 4.3 `<path>.arm` — the *arming* marker (this is what makes it one-shot)

A zero-byte sibling file. Nothing is written into it; **its mere existence means "armed"**.

- Created by the operator (`New-Item`) or by `armDepthCapture(path)` from code.
- Deleted automatically by the capture after a successful write.
- After deletion, the next quote needs an explicit new arm file to capture.

This exists precisely because a running daemon cannot observe a later environment change (§6): arming has to be a filesystem action, not an environment action.

**Capture occurs only when all four hold:** the outbound path is `/marketfeed/quote`; `IIPS_DHAN_DEPTH_CAPTURE_PATH` is non-blank; the `.arm` marker exists; the in-process slot for that path has not already been consumed.

## 5. What is written, and what is guaranteed about the values

### 5.1 The capture document (schema v2)

```jsonc
{
  "captureSchemaVersion": 2,
  "capturedAtUtc": "…",
  "label": "…",                    // IIPS_DHAN_DEPTH_CAPTURE_LABEL, or null
  "httpStatus": 200,
  "responseStatus": "success",     // vendor `status` as received, or null
  "requestedSecurityIds": [],      // reserved; not populated by this call site
  "instrumentsInResponse": 1,
  "quotes": [
    {
      "segment": "NSE_EQ",
      "securityId": "2885",
      "depthState": "object",      // "object" | "missing" | "not_object"
      "buy":  { "state": "array", "count": 5, "levels": [
                 { "price":    { "state": "present", "value": 0 },
                   "quantity": { "state": "present", "value": 0 },
                   "orders":   { "state": "present", "value": 0 } } ] },
      "sell": { "state": "missing" },
      "rawDepth": { }              // the complete original depth value
    }
  ]
}
```

### 5.2 Fidelity guarantees

| Received | Recorded as | Never |
| :--- | :--- | :--- |
| `0` | `{"state":"present","value":0}` | converted to `null`, or to "absent" |
| `"-1"` (string) | `{"state":"present","value":"-1"}` | coerced to a number |
| `-5` | `{"state":"present","value":-5}` | clamped or dropped |
| key absent / `null` | `{"state":"missing"}` | defaulted to `0` |
| `buy: []` | `{"state":"array","count":0,"levels":[]}` | treated as missing |
| `depth` absent | `depthState: "missing"` | synthesised from `last_price` |
| `depth` not an object | `depthState: "not_object"` | shaped into an object |

`last_price` is never read by the capture path. No credential material is recorded — only depth price/quantity/orders, segment/security id, and a count of instruments in the response.

### 5.3 Non-interference guarantees

- The diagnostic is called **after** parsing and **before** `dhanOk(...)`; its return value is discarded.
- The parsed object is passed by reference and never mutated; the DTO returned to callers is byte-identical with the capture on or off (asserted by deep equality in CAP-15).
- Every failure inside the diagnostic — bad path, unwritable directory, a throwing extractor — is swallowed. A broken diagnostic cannot fail a quote request or surface as a vendor failure (CAP-16).
- Normalisation and D-5 validation are not on this code path at all and are unchanged.

### 5.4 The one-shot guarantee — three independent layers

1. **Arm gate.** `isDepthCaptureArmed` checks the `.arm` marker before anything else. No marker, no capture.
2. **Slot claim.** `claimDepthCaptureSlot` adds the path to an in-process `Set` **before** the write, so two concurrent quote responses cannot both capture (CAP-22).
3. **Disarm.** After a successful write, `disarmDepthCapture` deletes the marker and clears the latch.

Consequence: the captured evidence is immutable for the lifetime of the daemon process. A quote arriving a minute — or an hour — later cannot overwrite it, even though the environment variable is still set. A further capture requires an explicit new arm file.

The latch is in-process only: no file, no registry, no external sink. It therefore clears on restart by construction, and nothing about the diagnostic survives a clean shutdown except the captured JSON itself.

## 6. Deployment and restart requirement — the precise answer

### 6.1 Enabling the environment variables **does** require a restart

**Correction to an earlier statement made during this work.** It was previously suggested that no restart would be needed because the capture reads `process.env` per request. That is wrong for the daemon, and the reasoning matters:

- `dhan_local_daemon.ts:349-350` resolves `const env: DhanEnvSource = options.env ?? process.env` **once at startup** and uses that snapshot for preflight and for `resolveDhanProviderConfig(env, now())` at line 450.
- More fundamentally, on Windows a process's environment block is fixed when the process is created. **Setting `$env:IIPS_DHAN_DEPTH_CAPTURE_PATH` in a separate PowerShell window changes only that PowerShell process's environment. The already-running `node.exe` never sees it.** There is no propagation, no notification, and no reload path. The capture code reading `process.env` at request time reads the *launch-time copy* — it would see the new value only if the value had been in the parent environment at launch.

So: `$env:` in a second window is inert for this purpose. The variable must be present in the environment of the shell that launches the daemon.

### 6.2 The exact restart requirement — once, for code; then never for arming

| Change | Restart needed? |
| :--- | :--- |
| Deploying the new code (compiled `dist/`) | **Yes — once.** The running process holds the old module graph in memory. |
| Setting / changing / clearing `IIPS_DHAN_DEPTH_CAPTURE_PATH` or `…_LABEL` | **Yes.** Launch-time environment (§6.1). |
| Arming (`New-Item … .arm`) or re-arming | **No.** Read from the filesystem per request. |
| Capturing, or a second quote after a capture | **No.** The one-shot is enforced in-process and by the marker. |

Practical consequence: get the environment right **before** the launch, because fixing it later costs another restart. The recommended sequence is therefore one build, one launch with the variables already set, then arm/request/verify as many times as needed with no further restarts.

### 6.3 Build requirement (the daemon runs `dist/`, not `src/`)

`npm run start:market-data-daemon` executes `node dist/src/providers/dhan/dhan_local_daemon.js`. The new `.ts` files have **zero** effect until they are compiled on the Windows host. Confirm the compiled artifact exists before launching:

```powershell
Test-Path .\dist\src\providers\dhan\dhan_depth_capture.js   # must be True
```

Note that `prebuild:tsc` purges old output before emitting, so a stale or orphaned `dist/` cannot silently serve this module.

## 7. Windows activation procedure

### Step 1 — host, code, build (once)

```powershell
cd H:\IIPS\iips-production-market-data
git fetch origin
git checkout arena/b210f700-iips-production-market-data
npm ci                       # skip only if node_modules is already current for this branch
npm run build:tsc
Test-Path .\dist\src\providers\dhan\dhan_depth_capture.js    # expect True
```

### Step 2 — stop the existing daemon

Stop the currently running `node dist/src/providers/dhan/dhan_local_daemon.js` process (Ctrl-C in its console, or close that console). The environment change in Step 3 cannot reach a process that is already running.

### Step 3 — launch **from the window that holds the variables**

Everything below must happen **in the same PowerShell session**. Do not set these in one window and launch from another.

```powershell
# The destination — absolute, and OUTSIDE the git working tree.
$env:IIPS_DHAN_DEPTH_CAPTURE_PATH  = 'H:\IIPS\runtime\dhan-d18-depth-capture\reliance-depth.json'
$env:IIPS_DHAN_DEPTH_CAPTURE_LABEL = 'D-18 Reliance NSE_EQ 2885, one market-closed quote'

# The pre-existing requirements, if this window does not already carry them:
$env:IIPS_MARKET_DATA_TRANSPORT_TOKEN = '<the token this daemon already uses>'

$env:IIPS_DHAN_DEPTH_CAPTURE_PATH                       # echo back: must show the path
Test-Path $env:IIPS_DHAN_DEPTH_CAPTURE_PATH             # expect False — nothing captured yet

npm run start:market-data-daemon
```

The daemon inherits this window's environment block. It prints the usual sanitised
`[ipd-market-data-daemon] listening on http://127.0.0.1:8791 (...)` line on `stderr`.
Leave this console running.

**There is no way to read the variable back out of the running daemon** — no route echoes its environment, and the diagnostic is deliberately silent on success. The only available confirmation is behavioural (§7.5). Until a capture appears, "the daemon actually received the path" is an assumption, not evidence. This is a real, stated gap rather than a hidden one.

### Step 4 — arm exactly one capture (second window is fine)

```powershell
$Out = 'H:\IIPS\runtime\dhan-d18-depth-capture\reliance-depth.json'
New-Item -ItemType Directory -Force -Path (Split-Path $Out) | Out-Null
New-Item -ItemType File -Force -Path "$Out.arm" | Out-Null

Test-Path $Out          # expect False (or delete a previous capture deliberately)
Test-Path "$Out.arm"    # expect True  — armed
```

Arming is a filesystem action, so it does not need the daemon's environment and needs no restart.

### Step 5 — issue exactly one Reliance quote

```powershell
curl.exe -sS -X POST http://127.0.0.1:8791/v1/quotes `
  -H "Authorization: Bearer $env:IIPS_MARKET_DATA_TRANSPORT_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"companyId":"EQ_RELIANCE_IN","securityId":"ISIN:INE002A01018:EQ","exchangeSegment":"NSE_EQ"}'
```

### Step 6 — verify the capture

```powershell
$Out = 'H:\IIPS\runtime\dhan-d18-depth-capture\reliance-depth.json'
Test-Path $Out                # expect True
Test-Path "$Out.arm"          # expect False — disarmed by the capture

$doc = Get-Content $Out -Raw | ConvertFrom-Json
$doc.captureSchemaVersion     # expect 2
$doc.capturedAtUtc
$doc.quotes | Select-Object segment, securityId, depthState
$doc.quotes[0].buy, $doc.quotes[0].sell
$doc.quotes[0] | ConvertTo-Json -Depth 8
```

**Confirm it is the Reliance response** by `securityId` — Reliance on `NSE_EQ` is Dhan id **`2885`**, on `BSE_EQ` `500325`. If `securityId` is something else, a different instrument consumed the one-shot: delete the file, re-arm, and repeat Step 5. (See the endpoint-level filter limitation in §8.1.)

### Step 7 — re-arm if a further capture is genuinely needed

No restart, no environment change:

```powershell
Remove-Item $Out -ErrorAction SilentlyContinue      # discard the old capture first, deliberately
New-Item -ItemType File -Force -Path "$Out.arm" | Out-Null
```

Repeat Step 5. Verified offline as working (`/tmp/oneshot_proof.mjs`, §9.4).

## 8. Limitations and failure modes — read before interpreting "no file"

### 8.1 The filter is endpoint-level, not per-security

The gate is "outbound path is `/marketfeed/quote`", not "the request was for Reliance". A capture document records **every** instrument present in the response (`quotes[]`, `instrumentsInResponse`), so identity is always recoverable after the fact — but if some other quote request reaches Dhan after you arm and before your Reliance request, *that* response will be captured, because it is the first matching one. The one-shot is honest about ordering; it cannot know your intent.

Mitigation: restart empties the quote cache (§8.2), so a freshly restarted daemon issuing one Reliance quote has no competing traffic unless something else is polling it. Arm immediately before the request and verify `securityId` afterwards; discard and retry otherwise.

### 8.2 A cache hit produces no capture

The service returns `SKIPPED_FRESH` when a `CURRENT` D01 quote is already cached (freshness window 15 minutes), and **never calls the provider** — so the capture hook never runs and the marker stays armed. On a freshly restarted daemon the cache is empty, which is why Step 3 restarts and Step 5 requests immediately. If a capture does not appear, check `GET /v1/freshness` for the instrument before concluding the configuration failed.

### 8.3 Only a successfully parsed 2xx response is captured

`executeJsonPost` maps a non-2xx status to a failure **before** parsing (§ `mapHttpStatus`, `dhan_api_client.ts:473-481`), so the capture hook is never reached. A vendor 400/401/429 writes no file.

> **Therefore: "no capture file" does not mean "depth was absent".** It may mean the request was rejected, the quote came from cache, the marker was not present, the environment variable was missing, or the write failed. Only a file that exists is evidence; its absence is not.

### 8.4 A failed write arms nothing but also does not retry

The slot is claimed before the write (deliberate: a broken diagnostic must not retry on every later quote). If the write fails, the marker is left in place and the slot stays consumed for that process. Recovery is a restart — after which the latch clears and the still-present marker captures the next quote.

### 8.5 What the capture cannot tell you

It records the received structure only. It does not establish why the vendor sent what it sent, does not interpret `depth` semantics, and is not evidence about any response other than the one captured. It is one observation, stamped with its own timestamp — not a general statement about Dhan behaviour.

## 9. Test evidence

### 9.1 Focused suite — 24/24

`node --test dist/tests/dhan_depth_capture.test.js` → **24 tests, 4 suites, 24 pass, 0 fail**.

| Suite | Tests |
| :--- | :--- |
| Fidelity — preserves received values exactly | CAP-01 closed-market zeros; CAP-02 independent sides; CAP-03 empty arrays / missing sides / missing depth; CAP-04 missing field vs present value; CAP-05 non-numeric and negative verbatim; CAP-06 raw depth retained; CAP-07 non-object depth, non-array side; CAP-08 never synthesised from `last_price`; CAP-09 no credential recorded; CAP-10 multiple instruments |
| Enablement | CAP-11 unset / empty / whitespace is off; CAP-12 path trimmed |
| Client integration and non-interference | CAP-13 captures one request; CAP-14 disabled writes nothing; CAP-14a enabled-but-unarmed writes nothing; CAP-15 result identical with and without capture (DTO deep equality); CAP-16 write failure never fails the quote; CAP-17 captures a market-closed shape that would fail normalisation; CAP-18 non-quote endpoints not captured |
| One-shot | CAP-19 first captures, second cannot overwrite; CAP-20 marker removed after capture; CAP-21 no capture until re-armed; CAP-22 concurrent quotes capture exactly once; CAP-23 arming an uncreatable path fails safe |

### 9.2 Regression — D-5 and adjacent suites, 0 failures

| Suite | Tests |
| :--- | :--- |
| `d5_bid_ask_representation` (D-5, incl. the three `price: 0` fixtures) | 50 / 50 |
| `dhan_d1_provider_foundation` | 21 |
| `dhan_d2_integration_qualification` | 23 |
| `dhan_d3c_historical` | 11 |
| `dhan_p5_service_transport` | 7 |
| `dhan_p6_exact_identity` | 8 |

No test was weakened, skipped or modified to reach these numbers, and D-5 is unmodified at blob `42e6f15e…`.

### 9.3 Full suite — 2112 executed / 2108 passed / 0 failed / 4 skipped

`npm test` (guard OK). The four skips are pre-existing. The count is 6 higher than the pre-one-shot baseline (2106), which is exactly the six one-shot tests added.

**Scope of this evidence:** executed on the Linux sandbox with Node 22.22.3 against `dist/` compiled by `npm run build:tsc`. It is **not** a Windows-host run, and no claim is made that the Windows daemon was started or exercised. The Windows procedure in §7 is derived from the code (`dhan_local_daemon.ts:349-350, 450`, `package.json` scripts) and has not itself been executed.

### 9.4 One-shot proof, end-to-end against compiled `dist/`

A throwaway harness (`/tmp/oneshot_proof.mjs`, not committed — `/tmp` does not persist) drove the compiled client through four scenarios:

| Scenario | Result |
| :--- | :--- |
| Unarmed, path configured | `captured: false` — nothing written |
| Armed, first quote | captured; `file exists: true`, `marker now: false` |
| Second quote, no re-arm | `evidence unchanged: true` — first capture intact |
| Re-armed, third quote | `overwritten: true`, `marker: false` |

`schemaVersion: 2` in the written document. This is the offline demonstration that one-shot holds, that disarming happens automatically, and that re-arming works without a restart.

## 10. Summary of the answers requested

| Question | Answer |
| :--- | :--- |
| **How does the running daemon actually receive `IIPS_DHAN_DEPTH_CAPTURE_PATH`?** | At **process launch**, from the environment of the launching shell. It is never received afterwards. `$env:` set in a separate PowerShell window modifies only that window and does nothing to an already-running `node.exe` — this is stated as a hard constraint, not an assumption. |
| **One-shot guarantee** | Yes — three layers: arm-marker gate, slot claimed before write (concurrency-safe), marker deleted after a successful write. Captured evidence cannot be overwritten for the process lifetime; a further capture requires an explicit re-arm. |
| **Exact Windows output path** | `H:\IIPS\runtime\dhan-d18-depth-capture\reliance-depth.json` (marker: `…\reliance-depth.json.arm`). Outside the git working tree by design, under the existing `H:\IIPS\runtime\` convention. |
| **Deployment / restart requirement** | **One restart**, to load the compiled code *and* to pick up the environment. Rebuild `dist/` first (`npm run build:tsc`) and confirm `dist\src\providers\dhan\dhan_depth_capture.js` exists. After that, arming, capturing and re-arming need **no** restart. Changing the environment afterwards costs another restart. |
| **Live request performed?** | **No.** No Dhan or vendor request was made. The vendor's depth structure is still unknown; that is precisely what the operator step is for. |

## 11. Removal

When D-18 is resolved: delete `src/providers/dhan/dhan_depth_capture.ts` and `tests/dhan_depth_capture.test.ts`, remove the import block, the single call in `executeJsonPost`, and the private `captureRawDepthIfEnabled` method from `dhan_api_client.ts`, then delete the runtime directory. Nothing else depends on the feature and no behaviour changes when it is absent — the diagnostic is inert without `IIPS_DHAN_DEPTH_CAPTURE_PATH`, so the code can also simply be left unset if removal is deferred.
