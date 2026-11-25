# IPD D-18 — temporary raw Dhan depth capture: build record and Windows activation procedure

- **Date:** 2026-11-20
- **Branch:** `arena/b210f700-iips-production-market-data`, based on `cbb116d2a221b82a704b4b96cf17efe0560e2498` (`main` after PR #186)
- **Scope:** one temporary, opt-in, one-shot diagnostic. No change to normalisation, D-5 validation, DTOs, or provider semantics.
- **Live request performed:** **yes — since 2026-11-23, by operator execution.** See §0 below. The statement originally published here ("**no** … has never run against the vendor, in this session or any other") was accurate when written on 2026-11-20 and is **superseded**. It is preserved verbatim in §0.1 as historical context rather than deleted.
- **Status:** implementation complete, unit-tested, one-shot verified offline on 2026-11-20. **Operator execution has since occurred**: one post-regular-session-close capture on 2026-11-23, provenance recorded in [`DHAN-D18-RELIANCE-DEPTH-CAPTURE-PROVENANCE-2026-11-25.md`](DHAN-D18-RELIANCE-DEPTH-CAPTURE-PROVENANCE-2026-11-25.md). The D-18 finding itself remains **OPEN** — see §0.4.

---

## 0. Operator execution — recorded 2026-11-25

This section was added on 2026-11-25. It records what has since happened. It does **not** revise the build record, the activation procedure, or the test evidence below, all of which remain as written on 2026-11-20.

### 0.1 The superseded statement, preserved verbatim

> - **Live request performed:** **no.** Nothing in this record was obtained from a Dhan or vendor response. The capture has never run against the vendor, in this session or any other.
> - **Status:** implementation complete, unit-tested, one-shot verified offline. Awaiting operator execution on the Windows host, which requires the restart described in §6.

Both lines were true on 2026-11-20. They are no longer true. They are retained so the record's own history is not rewritten.

### 0.2 Operator-confirmed facts (testimony)

- The capture file `reliance-depth.json` was **personally executed by the operator** on **23 November 2026**.
- Execution occurred at **approximately 15:31 IST**, described by the operator as **one minute after regular NSE equity trading closed at 15:30 IST**.
- The captured response contained **five buy and five sell levels**, with **price, quantity and orders explicitly present and all values zero**.
- The capture label reads *"one market-closed quote"*.
- A separate **25 November** capture is a **different, market-hours** capture and **must not be conflated** with the 23 November evidence.

### 0.3 Independently verified from the retained files

- `capturedAtUtc` = `2026-11-23T10:01:24.819Z` = **15:31:24 IST**, consistent with the operator's stated time to within 24 seconds. Consistency, **not** independent proof of authorship.
- `captureSchemaVersion: 2`, `httpStatus: 200`, `responseStatus: "success"`.
- `requestedSecurityIds: ["2885"]`, `instrumentsInResponse: 1`, segment `NSE_EQ`, `securityId: "2885"`.
- `depthState: "object"`; `buy.state: "array"`, `count: 5`; `sell.state: "array"`, `count: 5`.
- All 30 level fields (5 levels × 2 sides × price/quantity/orders) have `state: "present"`; all 30 values are `0`.
- Both files are LF-only and byte-identical to what the operator supplied; SHA-256 digests are pinned in `evidence/dhan-d18/manifest.json`.

### 0.4 The two captures, and the classification

| | 23 November 2026 | 25 November 2026 |
|---|---|---|
| Retained as | `evidence/dhan-d18/reliance-depth-20261123.json` | `evidence/dhan-d18/reliance-depth-20261125.json` |
| Local time (IST) | **15:31:24** | **13:45:15** |
| Depth values | all ten levels `0 / 0 / 0` | populated, 1368.90–1369.50 |
| Classification | **`POST_REGULAR_SESSION_CLOSE`** | `DURING_REGULAR_SESSION` |
| Answers D-18? | Partly — see below | **No** |

**Classification of the 23 November capture is `POST_REGULAR_SESSION_CLOSE`, and no stronger.** It is 1 minute 24 seconds after the 15:30 IST regular close, and therefore **inside the 15:30–15:35 closing-auction (CAS) window**. This record does **not** claim the entire NSE closing process had finished. No capture taken after the 15:50 IST post-close boundary, or on a non-trading day, exists.

**What this settles.** D-18's market-closed *shape* question: when not in continuous trading, the vendor sent a **populated object** with **five levels per side**, every price/quantity/orders field **present and `0`**. It is *not* `null`, *not* an empty array, and the `depth` key is *not* omitted — i.e. the `0` row of §5.2, not the `missing` or `array: []` rows.

**What it does not settle.** Side labelling (an all-zero book carries no information about which array is bid and which is ask, so D-3, DQ-8 and OR-10 are untouched); book ordering and level-count validation (DQ-7); or the schema as a whole (Q-03, which also covers volume, `last_trade_time` and `net_change`). **D-18 remains OPEN**, and no work-item status is changed by this section.

### 0.5 Note on this record's own §5.1 annotation

§5.1 below annotates `requestedSecurityIds` as *"reserved; not populated by this call site"*. That annotation is **inaccurate**: `dhan_depth_capture.ts:219` does populate it, and the retained capture carries `["2885"]`. The annotation is left in place here as part of the original record; the corrected statement is recorded in the provenance document.

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
| `src/providers/dhan/dhan_depth_capture.ts` | **New.** Extractor, env/path resolution, one-shot latch, arm/disarm marker API, request-body instrument reader and selector. | 345 lines |
| `src/providers/dhan/dhan_api_client.ts` | **Modified.** Import block, one call site in `executeJsonPost` (passing the request body), one private `captureRawDepthIfEnabled`, one body parser. | +75 / −0 |
| `tests/dhan_depth_capture.test.ts` | **New.** 31 tests / 5 suites (CAP-01 … CAP-30 incl. CAP-14a); CAP-24 … CAP-30 cover instrument scoping. | 658 lines |
| `windows-setup/03-Start-IipsServers.ps1` | **Modified.** `-MarketDataPort`, `-StartMarketDataDaemon`, port guard, `03b-market-data` step, ownership assertion, manifest field, rollback coverage. | 477 → 576 lines |
| `windows-setup/06-Stop-IipsServers.ps1` | **Modified.** `8791` in `-Ports`; `dhan_local_daemon.js` in `$entrypoints`. | 2 lines |
| `windows-setup/07-Prepare-DepthCapture.ps1` | **New.** Build, capture directory, `-Verify` ownership chain, arm/disarm. Starts nothing, requests nothing. | 352 lines |
| `windows-setup/README.md`, `Make-SetupBundle.ps1` | **Modified.** New script documented and registered as a bundle input. | +22 / +1 lines |
| `docs/integration/DHAN-W11-IPD-DAEMON-CONFIGURATION-AND-OPERATIONS.md` | **Modified.** §6.4 records the ownership gap and its resolution. | +9 lines |

`windows-setup/MANIFEST.txt` and `SHA256SUMS.txt` are **not** edited: they are generated outputs of
`Make-SetupBundle.ps1`, regenerated on the Windows host (§12.3, §12.5).

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

### 5.4 The one-shot guarantee — four independent layers

1. **Arm gate.** `isDepthCaptureArmed` checks the `.arm` marker first. No marker, no capture.
2. **Instrument gate.** The request must be exactly one instrument, `NSE_EQ`, Dhan ID `2885` (see §5.5). A request for anything else returns *before* the slot is claimed and *before* the marker is touched, so it can neither spend the one-shot nor block the intended capture.
3. **Slot claim.** `claimDepthCaptureSlot` adds the path to an in-process `Set` **before** the write, so two concurrent quote responses cannot both capture (CAP-22).
4. **Disarm.** After a successful write, `disarmDepthCapture` deletes the marker and clears the latch.

Consequence: the captured evidence is immutable for the lifetime of the daemon process. A quote arriving a minute — or an hour — later cannot overwrite it, even though the environment variable is still set. A further capture requires an explicit new arm file.

The latch is in-process only: no file, no registry, no external sink. It therefore clears on restart by construction, and nothing about the diagnostic survives a clean shutdown except the captured JSON itself.

### 5.5 Instrument scoping — why the filter is the request, not the endpoint

The first version of this diagnostic gated on the **endpoint** (`/marketfeed/quote`). That was not
good enough: any other instrument's quote arriving while the marker existed would have captured its
own response and consumed the one-shot, leaving evidence for the wrong instrument. The operator
would have discovered this only *after* the firing.

The gate now reads the **outbound request body** — the same body `buildQuoteRequestBody` produced —
and captures only when the request is:

| Condition | Required value |
| :--- | :--- |
| instruments in the request | exactly **one** |
| exchange segment | `NSE_EQ` |
| Dhan security ID | **`2885`** (Reliance, NSE) |

`DHAN_DEPTH_CAPTURE_SECURITY_ID` is the single constant that defines the selection. The request
body is parsed from the same string that was sent to the vendor, so the match is on what was
actually requested rather than on anything reconstructed later.

Three deliberate choices:

- **Segment is required as well as ID.** A same-numbered security on `BSE_EQ` cannot be mistaken for
  Reliance. (The BSE Reliance row is `500325`, but the segment check does not depend on knowing that.)
- **A multi-instrument batch is refused.** If Reliance travelled inside a batch, the evidence could
  not be attributed to one deliberate request, so the slot is preserved instead.
- **An unreadable body is a non-match.** `readQuoteRequestInstruments` returns an empty list for
  anything that is not `{segment: [id, ...]}`, which can never equal the target. The failure
  direction is safe: the slot survives.

Verified by CAP-24 … CAP-30, including the specific regression that motivated the change — a
non-Reliance quote followed by the intended one (CAP-28), where the earlier endpoint-level gate
would have captured the wrong instrument.

## 6. Deployment and restart requirement — the precise answer

### 6.1 Enabling the environment variables **does** require a restart

**Correction to an earlier statement made during this work.** It was previously suggested that no restart would be needed because the capture reads `process.env` per request. That is wrong for the daemon, and the reasoning matters:

- `dhan_local_daemon.ts:349-350` resolves `const env: DhanEnvSource = options.env ?? process.env` **once at startup** and uses that snapshot for preflight and for `resolveDhanProviderConfig(env, now())` at line 450.
- More fundamentally, on Windows a process's environment block is fixed when the process is created. **Setting `$env:IIPS_DHAN_DEPTH_CAPTURE_PATH` in a separate PowerShell window changes only that PowerShell process's environment. The already-running `node.exe` never sees it.** There is no propagation, no notification, and no reload path. The capture code reading `process.env` at request time reads the *launch-time copy* — it would see the new value only if the value had been in the parent environment at launch.

So: `$env:` in a second window is inert for this purpose. The variable must be present in the environment of the shell that launches the daemon.

### 6.2 The exact restart requirement — once, and it is now a managed restart

| Change | Restart needed? |
| :--- | :--- |
| Deploying the new code (rebuilt `dist/`) | **Yes — once**, and now through `06-Stop` then `03 -StartMarketDataDaemon`, which stops and restarts the daemon as a managed child. |
| Setting / changing / clearing `IIPS_DHAN_DEPTH_CAPTURE_PATH` or `…_LABEL` | **Yes.** Launch-time environment, inherited at process creation. |
| Arming (`07 -Arm`) or re-arming | **No.** Read from the filesystem per request. |
| Capturing, or a quote after a capture | **No.** The one-shot is enforced in-process and by the marker. |

Get the environment right before the launch, because fixing it later costs another stop/start cycle.
Note what the earlier version of this document got wrong: `06` → `03 -StartIpdIpc` does **not**
restart this daemon, because `-StartIpdIpc` starts the portfolio IPC provider and `06` did not
recognise the daemon at all. That is corrected in §12.

### 6.3 Build requirement (the daemon runs `dist/`, not `src/`)

`npm run start:market-data-daemon` executes `node dist/src/providers/dhan/dhan_local_daemon.js`. The new `.ts` files have **zero** effect until they are compiled on the Windows host. Confirm the compiled artifact exists before launching:

```powershell
Test-Path .\dist\src\providers\dhan\dhan_depth_capture.js   # must be True
```

Note that `prebuild:tsc` purges old output before emitting, so a stale or orphaned `dist/` cannot silently serve this module.

## 7. The Windows procedure

One procedure. Every step is through the managed scripts; nothing is launched by hand.

Preconditions, all verified by the scripts rather than assumed: `H:\IIPS` holds both checkouts;
`IIPS_MARKET_DATA_TRANSPORT_TOKEN` is set in the operator's session; the IPD checkout is on the branch
carrying this diagnostic.

### Step 1 — build and deploy the daemon code

```powershell
cd H:\IIPS-scripts

# Stop first. 06 now recognises dhan_local_daemon.js and checks port 8791, so this really does
# stop the daemon - the thing the earlier sequence could not do.
powershell -ExecutionPolicy Bypass -File .\06-Stop-IipsServers.ps1

# Build the daemon's compiled output and prepare the capture directory. -Build runs
# `npm run build:tsc` through the shared toolchain resolver and refuses to continue if the
# compiled module is absent. Without this the daemon would run a stale dist\.
powershell -ExecutionPolicy Bypass -File .\07-Prepare-DepthCapture.ps1 -Build
```

Expected: `06` exits 0 with every port released; `07` reports the diagnostic source, the compiled
module, the capture directory, and the launch instruction. It arms nothing yet.

### Step 2 — set the capture environment in the launching session

**This must be the window that launches step 3.** A Windows process cannot be given a new environment
after creation, so a variable set anywhere else is invisible to the daemon.

```powershell
# Same PowerShell window used for step 3. Do not open a second window and do not re-enter the token
# from memory - use the value this session already holds.
$env:IIPS_DHAN_DEPTH_CAPTURE_PATH  = 'H:\IIPS\runtime\dhan-d18-depth-capture\reliance-depth.json'
$env:IIPS_DHAN_DEPTH_CAPTURE_LABEL = 'D-18 Reliance NSE_EQ 2885, one market-closed quote'

$env:IIPS_DHAN_DEPTH_CAPTURE_PATH                       # echo back: must print the path
[System.IO.Path]::IsPathRooted($env:IIPS_DHAN_DEPTH_CAPTURE_PATH)   # must print True
[bool]$env:IIPS_MARKET_DATA_TRANSPORT_TOKEN            # must print True
```

The capture path is outside the repository; `07` later refuses a path inside the git tree.

### Step 3 — start the daemon as a managed child of the run

```powershell
powershell -ExecutionPolicy Bypass -File .\03-Start-IipsServers.ps1 -StartIpdIpc -StartMarketDataDaemon
```

`-StartMarketDataDaemon` is the new switch, and it is the only supported way to start this daemon.
`03` then:

1. refuses if port `8791` is already held (it never kills a process it did not start);
2. refuses if the compiled daemon entrypoint is missing, rather than running a stale module;
3. refuses if `IIPS_MARKET_DATA_TRANSPORT_TOKEN` is empty in this session;
4. starts the daemon via `Start-IipsService` with **only** the token and listener variables injected;
   the `IIPS_DHAN_DEPTH_CAPTURE_*` variables are inherited from this window;
5. waits for the daemon's own sanitised stderr bind line;
6. requires an authenticated `200` from `/v1/health` using the same token;
7. asserts that the PID owning port `8791` **is** the PID it started;
8. adds `ipd-market-data-daemon` to `$script:Started` and `marketDataPort` to the manifest.

If any of those fail, the run rolls back, verifies every port including `8791` is released, and exits
non-zero. A failed launch leaves no half-started stack.

### Step 4 — verify ownership before arming

```powershell
powershell -ExecutionPolicy Bypass -File .\07-Prepare-DepthCapture.ps1 -Verify
```

This reads `<InstallRoot>\logs\iips-pids-<stamp>.json` — the newest manifest, the file `03` just
wrote — and proves the whole chain:

| Check | Failure message if it does not hold |
| :--- | :--- |
| a manifest exists under the log root | `no PID manifest found under …` |
| it has an `ipd-market-data-daemon` row | `the daemon was NOT started by 03 … so it is unmanaged` |
| that PID is alive | `records PID … but that process is no longer running` |
| that PID owns port `8791` | `port 8791 is owned by PID … but the manifest records PID …` |
| the capture variables are not on the command line | `environment variables must never travel on a command line` |

**If this step fails, stop. Do not arm.** A capture taken through an unmanaged process is a different
piece of evidence, and not the one this diagnostic is supposed to produce.

It also prints this warning, which is honest rather than reassuring:

```
WARN the daemon environment cannot be read back from outside the process.
WARN If the capture variables were not set in the session that launched 03, the capture will
WARN silently produce no file. ...
```

There is no route that echoes the daemon's environment, and the diagnostic is silent on success. The
only positive evidence that the environment arrived is the capture file appearing after step 6; its
absence proves nothing (see §8.3).

### Step 5 — arm exactly one capture

```powershell
powershell -ExecutionPolicy Bypass -File .\07-Prepare-DepthCapture.ps1 -Arm
```

Clears any previous capture, writes
`H:\IIPS\runtime\dhan-d18-depth-capture\reliance-depth.json.arm`, and prints the state. Arming is a
filesystem action: no restart, no environment change.

### Step 6 — issue exactly one quote request

```powershell
curl.exe -sS -X POST http://127.0.0.1:8791/v1/quotes `
  -H "Authorization: Bearer $env:IIPS_MARKET_DATA_TRANSPORT_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"companyId":"EQ_RELIANCE_IN","securityId":"ISIN:INE002A01018:EQ","exchangeSegment":"NSE_EQ"}'
```

One request. The capture is scoped to exactly this instrument (§5.5), so no other quote can consume
the one-shot or overwrite it.

### Step 7 — verify the capture

```powershell
$Out = 'H:\IIPS\runtime\dhan-d18-depth-capture\reliance-depth.json'
Test-Path $Out            # expect True
Test-Path "$Out.arm"      # expect False - the one-shot was consumed

$doc = Get-Content $Out -Raw | ConvertFrom-Json
$doc.captureSchemaVersion     # expect 2
$doc.requestedSecurityIds     # expect 2885
$doc.quotes | Select-Object segment, securityId, depthState
$doc.quotes[0] | ConvertTo-Json -Depth 8
```

### Step 8 — stop, still through the managed script

```powershell
powershell -ExecutionPolicy Bypass -File .\06-Stop-IipsServers.ps1
```

The capture file survives; it is a file, not process state. Clear it only deliberately:

```powershell
powershell -ExecutionPolicy Bypass -File .\07-Prepare-DepthCapture.ps1 -Disarm -ClearCapture
```

### Re-arming for a second capture

No rebuild, no restart, no environment change: `07 -Arm`, then one request. The manifest and the
daemon PID are untouched.

## 8. Limitations and failure modes — read before interpreting "no file"

### 8.1 The filter matches the request, not the response

The gate reads the outbound request body (§5.5), so only an `NSE_EQ` / `2885` request can capture. Two consequences worth stating plainly:

- A document records **every** instrument present in the response (`quotes[]`, `instrumentsInResponse`). With a single-instrument request that is exactly one entry; if the vendor ever returned extra instruments unprompted, they would appear here too. The requested identity is recorded separately in `requestedSecurityIds`.
- **The filter reads success, not failure.** If the selected request is rejected (non-2xx), the hook is never reached (§8.3) and the marker survives — so a retry after fixing the cause still captures. That is the intended behaviour, but it also means an armed marker can persist indefinitely if the request keeps failing.

Mitigation for the ordinary case: restart empties the quote cache (§8.2), so a freshly started daemon issuing one Reliance quote has no competing traffic unless something else is polling it. Verify `requestedSecurityIds` after capture.

### 8.2 A cache hit produces no capture

The service returns `SKIPPED_FRESH` when a `CURRENT` D01 quote is already cached (freshness window 15 minutes), and **never calls the provider** — so the capture hook never runs and the marker stays armed. On a freshly restarted daemon the cache is empty, which is why Step 3 restarts and Step 5 requests immediately. If a capture does not appear, check `GET /v1/freshness` for the instrument before concluding the configuration failed.

### 8.3 Only a successfully parsed 2xx response is captured

`executeJsonPost` maps a non-2xx status to a failure **before** parsing (§ `mapHttpStatus`, `dhan_api_client.ts:473-481`), so the capture hook is never reached. A vendor 400/401/429 writes no file.

> **Therefore: "no capture file" does not mean "depth was absent".** It may mean the request was rejected, the quote came from cache, the marker was not present, the environment variable was missing, or the write failed. Only a file that exists is evidence; its absence is not.

### 8.4 A failed write arms nothing but also does not retry

The slot is claimed before the write (deliberate: a broken diagnostic must not retry on every later quote). If the write fails, the marker is left in place and the slot stays consumed for that process. Recovery is a restart — after which the latch clears and the still-present marker captures the next quote.

### 8.5 What the capture cannot tell you

It records the received structure only. It does not establish why the vendor sent what it sent, does not interpret `depth` semantics, and is not evidence about any response other than the one captured. It is one observation, stamped with its own timestamp — not a general statement about Dhan behaviour.

### 8.6 An empty `quotes[]` is a real, recorded outcome — not a successful capture

The extractor iterates `data[segment][securityId]`. If the vendor answered 2xx with a body whose
`data` block is empty, or whose per-instrument block is absent, the document is still written — with
`instrumentsInResponse: 0` and `quotes: []` — and the one-shot is consumed. This is the
**fidelity-preserving** choice (the received structure is recorded rather than refused), but it means:

> A capture file containing `quotes: []` is **not** evidence that depth was absent. It is evidence
> that this response carried no instrument block in the shape the extractor reads. Treat it as a
> malformed or unexpected response and re-arm deliberately rather than reading depth semantics into it.

The same applies to `depthState: "not_object"` on an otherwise populated response: it is recorded
verbatim, and it is not equivalent to `"missing"`.

## 9. Test evidence

### 9.1 Focused suite — 24/24

`node --test dist/tests/dhan_depth_capture.test.js` → **31 tests, 5 suites, 31 pass, 0 fail**.

| Suite | Tests |
| :--- | :--- |
| Fidelity — preserves received values exactly | CAP-01 closed-market zeros; CAP-02 independent sides; CAP-03 empty arrays / missing sides / missing depth; CAP-04 missing field vs present value; CAP-05 non-numeric and negative verbatim; CAP-06 raw depth retained; CAP-07 non-object depth, non-array side; CAP-08 never synthesised from `last_price`; CAP-09 no credential recorded; CAP-10 multiple instruments |
| Enablement | CAP-11 unset / empty / whitespace is off; CAP-12 path trimmed |
| Client integration and non-interference | CAP-13 captures one request; CAP-14 disabled writes nothing; CAP-14a enabled-but-unarmed writes nothing; CAP-15 result identical with and without capture (DTO deep equality); CAP-16 write failure never fails the quote; CAP-17 captures a market-closed shape that would fail normalisation; CAP-18 non-quote endpoints not captured |
| One-shot | CAP-19 first captures, second cannot overwrite; CAP-20 marker removed after capture; CAP-21 no capture until re-armed; CAP-22 concurrent quotes capture exactly once; CAP-23 arming an uncreatable path fails safe |
| **Instrument scoping** | CAP-24 the selected `NSE_EQ`/`2885` request captures and consumes the one-shot; CAP-25 another company's quote neither captures nor consumes the slot; CAP-26 `2885` on `BSE_EQ` is not mistaken for Reliance; CAP-27 a multi-instrument batch is refused; CAP-28 a non-Reliance quote does not block a later Reliance capture (the regression that motivated the change); CAP-29 after capture, further selected quotes cannot overwrite; CAP-30 request-body reader and matcher are strict about shape |

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

Two pre-existing tests were corrected because they were passing for the wrong reason, not to raise
a count:

- **CAP-16** claimed to exercise a capture write failure but never produced one — it armed a valid
  path, so the write succeeded. It now targets a path that *is* a directory, so `writeDepthCapture`
  genuinely throws after the slot is claimed (confirmed directly: the writer returns `undefined`).
  This is why the fail-safe path is now actually covered.
- **CAP-18** was vacuous: it asserted "non-quote endpoints are not captured" without arming, so the
  arm gate alone explained the result. It now arms first, which makes the endpoint filter the only
  possible reason for the pass.

Mutation check on the new gate: with `isSelectedDepthCaptureRequest` forced to `true` in the compiled
output, the suite drops from 31/31 to **27 pass / 4 fail**, and the four failures are exactly the
scoping cases. The tests therefore detect removal of the behaviour they describe.

### 9.3 Full suite — 2119 executed / 2115 passed / 0 failed / 4 skipped

`npm test` (guard OK). The four skips are pre-existing. The count is 13 higher than the pre-one-shot
baseline (2106): six one-shot tests plus seven instrument-scoping tests. The PowerShell structural
validator passes for both `windows-setup` and `windows-acceptance` (**342 pass / 0 fail**), which the
W-02 suite asserts as part of this run.

**Scope of this evidence:** executed on the Linux sandbox with Node 22.22.3 against `dist/` compiled by `npm run build:tsc`. It is **not** a Windows-host run, and no claim is made that the Windows daemon was started or exercised. The Windows procedure in §7 is derived from the code (`dhan_local_daemon.ts:349-350, 450`, `package.json` scripts) and has not itself been executed.

### 9.4 One-shot proof, end-to-end against compiled `dist/`

A throwaway harness (`/tmp/oneshot_proof.mjs`, not committed — `/tmp` does not persist) drove the compiled client through four scenarios:

| Scenario | Result |
| :--- | :--- |
| Unarmed, path configured | `captured: false` — nothing written |
| Armed, first quote | captured; `file exists: true`, `marker now: false` |
| Second quote, no re-arm | `evidence unchanged: true` — first capture intact |
| Re-armed, third quote | `overwritten: true`, `marker: false` |

`schemaVersion: 2` in the written document. This is the offline demonstration that one-shot holds, that disarming happens automatically, and that
re-arming works without a restart. It was run against the pre-scoping build; the instrument gate is
covered by CAP-24 … CAP-30 against the current build.

## 10. Summary of the answers requested

| Question | Answer |
| :--- | :--- |
| **Is there an earlier managed helper with `-RestartMarketDataDaemon`?** | **No.** Only one version of `03` has ever existed (blob `eda43b53…`, SHA-256 `e55515cf…`, 25,590 bytes), added in PR #181 and unchanged since; it has never accepted that switch. The string appears in no branch of this repository, not in `iips-review-recovered`, and PID 13768 is recorded nowhere except option-chain rows in a scrip-master CSV. The authenticated run W-06 records was performed with a manual `Start-Process` + `Stop-Process` — unmanaged. |
| **Is the capture Reliance-specific?** | **Yes.** Only exactly one instrument, `NSE_EQ`, Dhan `2885`. Other requests return before the slot is claimed and before the marker is touched. CAP-24 … CAP-30, mutation-checked. |
| **Does `06` → `03 -StartIpdIpc` restart the daemon?** | **No** — that was wrong. `-StartIpdIpc` is the portfolio IPC provider, and `06` neither matched `dhan_local_daemon.js` nor checked port `8791`. Both are now fixed, and the daemon is started by `-StartMarketDataDaemon`. |
| **Supported stop/start with ownership preserved** | `06-Stop-IipsServers.ps1` (now matches the daemon and port 8791) then `03-Start-IipsServers.ps1 -StartIpdIpc -StartMarketDataDaemon`, which starts it via `Start-IipsService`, records its PID in the run manifest, and asserts the listening PID equals the started PID. |
| **Manifest location** | `<InstallRoot>\logs\iips-pids-<timestamp>.json` — i.e. `H:\IIPS\logs\…` with the default `-InstallRoot H:\IIPS` and `-LogRoot` unset, which is also how `07 -Verify` derives it. Portable: pass `-LogRoot` if the host differs. |
| **Live request performed?** | **No.** No Dhan request, no service start/stop/restart, no host change. |

## 11. Removal

When D-18 is resolved: delete `src/providers/dhan/dhan_depth_capture.ts` and `tests/dhan_depth_capture.test.ts`, remove the import block, the single call in `executeJsonPost`, and the private `captureRawDepthIfEnabled` method from `dhan_api_client.ts`, then delete the runtime directory. Nothing else depends on the feature and no behaviour changes when it is absent — the diagnostic is inert without `IIPS_DHAN_DEPTH_CAPTURE_PATH`, so the code can also simply be left unset if removal is deferred.

## 12. Daemon ownership — resolved

### 12.1 Premise check: there is no `-RestartMarketDataDaemon` helper

Before building on the earlier blocker, the premise was checked against every reachable source.

| Question | Verified answer |
| :--- | :--- |
| Does `03-Start-IipsServers.ps1` accept `-RestartMarketDataDaemon`? | **No.** Its parameter list is `InstallRoot, RuntimeRoot, LogRoot, NodeExecutable, TransportPort, FrontendPort, IpdShellPort, BindAddress, PipeName, DatabasePath, ReadyTimeoutSeconds, CleanupTimeoutSeconds, StartIpdIpc, StartIpdShell, NoPause`. |
| Does the string `RestartMarketDataDaemon` appear anywhere in this repository or its history? | **No.** `git log --all -S` over the full history (640 commits, 181 branches, unshallowed) returns nothing; GitHub code search returns 0. |
| Does it appear in `iips-review-recovered`? | **No.** Code search returns 0, and no `*daemon*`, `*market*`, `*iips-servers*` or `*common*` PowerShell file exists there. |
| How many distinct versions of `03` has this repository ever contained? | **One.** A single blob, `eda43b538724c3bb1bc06555e4084a813f1b4eca`, first added in PR #181 and unchanged since. |
| What is the recorded evidence of a daemon that answered HTTP 200? | `DHAN-W06-LOCAL-TRANSPORT-RECOVERY-EVIDENCE-2026-11-12.md` — and its method is `Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','start:market-data-daemon'` in the foreground, after a manual `Stop-Process` matching `*dhan_local_daemon.js*`. **Manual, unmanaged, and recorded in no manifest.** |
| Is PID 13768 recorded anywhere? | **No.** No document, commit or script in this repository contains it. The only `13768` occurrences are option-chain rows in `evidence/dhan-p7/source/api-scrip-master*.csv`. |

So the two scripts the question asks me to compare **cannot both exist**: there is only one
`03-Start-IipsServers.ps1` in existence, and it has never had a daemon-restart capability. There is no
"earlier managed helper" to diff against. The earlier successful authenticated run was performed the
manual way W-06 §4.2 documents — which is exactly the unmanaged launch the requirement excludes.

Recorded hashes for the file I inspected, for the avoidance of doubt:

| Field | Value |
| :--- | :--- |
| Path | `H:\IIPS\iips-production-market-data\windows-setup\03-Start-IipsServers.ps1` (in this workspace: `/home/user/iips-production-market-data/windows-setup/03-Start-IipsServers.ps1`) |
| Branch | `arena/b210f700-iips-production-market-data`, based on `cbb116d` (`main`) |
| State inspected | unmodified from `HEAD` (`git status` clean for this file) |
| git blob | `eda43b538724c3bb1bc06555e4084a813f1b4eca` |
| SHA-256 | `e55515cfbda94ba3619bc83df235d975ca535192b432c20b7b12c66860448d0c` |
| Size | 25,590 bytes / 477 lines (as inspected) |

After the ownership change in §12.4 the same file is:

| Field | Value |
| :--- | :--- |
| git blob | `2cd6d9b74ca0628fbc496823bc11f8174ef7d8f5` |
| SHA-256 | `fd9124ec0db89ddaff86c07a7c352407eede80867514b38fe61551443ddc9c4a` |
| Size | 32,109 bytes / 576 lines |

### 12.2 The sequence in the previous version of this document was wrong

`06-Stop-IipsServers.ps1` then `03-Start-IipsServers.ps1 -StartIpdIpc` does **not** stop and restart
the market-data daemon, for two independent reasons:

- **`-StartIpdIpc` is not a daemon start.** It starts the Gate-3 *portfolio IPC provider* on a named
  pipe. It has nothing to do with the market-data daemon on `127.0.0.1:8791`.
- **`06` could not stop the daemon even if it were running.** Its `$entrypoints` list held
  `executive-transport.ts`, `dist\src\ipc\entrypoint.js` and `vite` — no `dhan_local_daemon.js` —
  and its `-Ports` default was `8787, 5176, 5174`, which does not include `8791`.

So the earlier sequence would have left the old daemon process running with the old `dist/` and the
old environment, then reported success. That is the precise failure mode that would have produced a
capture file that never appeared, with no indication why.

### 12.3 Correction: the blocker I reported was overstated

The previous version of this document claimed the ownership change could not be delivered because
`MANIFEST.txt` and `SHA256SUMS.txt` are checksum-pinned and `Make-SetupBundle.ps1` needs a PowerShell
host. Re-reading the generator shows that reasoning was wrong:

- `$script:ExpectedFiles` is the bundle's **input** list; `MANIFEST.txt` and `SHA256SUMS.txt` are
  **outputs** it writes into `-OutputDirectory`, alongside the zip and tar. They are not members.
- `Get-FileHash` is run over the source files **on the host, at generation time**. Nothing declares
  their digests in the repository, so no repository-side hash can go stale when a script changes.
- The bundle's real integrity property is `05-verify`: it reopens the archive and compares every
  entry against the source **byte for byte**. That check is unaffected by a source edit.

The correct conclusion — now applied below — is that the scripts are edited in the repository and the
bundle is regenerated on the Windows host. Hand-editing the two generated files in the repository is
unnecessary and was removed; they are restored to their published state.

### 12.3a Manifest and log location — checked, not assumed

`03-Start-IipsServers.ps1` resolves its paths at startup:

```powershell
if ([string]::IsNullOrWhiteSpace($LogRoot))    { $LogRoot    = Join-Path $InstallRoot 'logs' }
if ([string]::IsNullOrWhiteSpace($RuntimeRoot)) { $RuntimeRoot = Join-Path $InstallRoot 'runtime' }
$script:ServiceLogDir = Join-Path $LogRoot "services-$($script:RunStamp)"
$pidFile = Join-Path $LogRoot "iips-pids-$($script:RunStamp).json"
```

With the documented defaults (`-InstallRoot 'H:\IIPS'`, `-LogRoot` unset) that is
`H:\IIPS\logs\iips-pids-<yyyyMMdd-HHmmss>.json`, with per-service logs under
`H:\IIPS\logs\services-<stamp>\`.

Host evidence in this repository corroborates that root: `DHAN-W02-WINDOWS-ACCEPTANCE-EVIDENCE`
writes to `H:\IIPS\logs\w02-dpapi-acceptance\…`, and
`docs/investigations/2026-11-11-live-class-p-retrieval-feasibility.md` §6 reports reading
`H:\IIPS\logs\services-20261111-162751\{ipd-ipc.err.log, ipd-ipc.out.log, irr-transport.err.log}`.
Those directories contain exactly the `ipd-ipc` and `irr-transport` logs `03` produces, which is
consistent with `H:\IIPS\logs` being the real log root.

**However**, no `iips-pids-*.json` manifest is recorded anywhere in the repository's evidence. That is
expected rather than alarming: no `03` run has ever started the market-data daemon, so no prior
manifest can contain it. It also means the path above is derived from source plus adjacent host
evidence, **not** observed on the host in a manifest file. `07 -Verify` fails closed if the manifest is
absent, so a wrong path produces a clear refusal rather than a silent proceed. Pass `-LogRoot`
explicitly if the host deviates from the default.

### 12.4 What was delivered

| File | Change |
| :--- | :--- |
| `windows-setup/03-Start-IipsServers.ps1` | `-MarketDataPort` (default `8791`) and `-StartMarketDataDaemon`; port guard; a `03b-market-data` step that starts the daemon through `Start-IipsService` and adds it to `$script:Started`; readiness from the daemon's own stderr bind line; authenticated `/v1/health`; **listener-ownership assertion** (`Get-IipsPortOwner` PID must equal the PID this run started); `marketDataPort` recorded in the manifest; rollback verifies `8791`. |
| `windows-setup/06-Stop-IipsServers.ps1` | `8791` added to the `-Ports` default; `dhan_local_daemon.js` added to `$entrypoints`, so the stop half can actually match the start half. |
| `windows-setup/07-Prepare-DepthCapture.ps1` | `-Verify` and `-MarketDataPort`/`-LogRoot`; an `04b-verify` step that proves the ownership chain **manifest row → live PID → bound listener**, and refuses to arm if any link is broken. |

Design points that matter:

- **The daemon is started by the same script, in the same process tree, and recorded by the same
  loop.** It is not a second launch mechanism; the existing `$script:Started` mechanism and the
  existing `Start-IipsService` helper are reused unchanged.
- **The capture variables are deliberately not injected** by `03`. They are inherited from the
  launching session. Copying them into the environment hashtable would silently mask a missing
  operator variable; inheriting means the operator's window is the single source of truth.
- **Ownership is asserted, not assumed.** A daemon that is alive but does not own `8791`, or a
  listener owned by a different PID, is a hard failure rather than a manifest entry that merely looks
  plausible.
- **`03` still refuses to kill a process it did not start.** If `8791` is already held, it stops with
  an actionable message pointing at `06`, which is the component that owns termination.

### 12.5 What remains host-side

`MANIFEST.txt` and `SHA256SUMS.txt` in this repository still describe the previous bundle contents
(13 files, pin `fe66bead`). They are regenerated by `Make-SetupBundle.ps1` on the Windows host, which
is the only place the generator can run. Until then the checked-in copies are stale by design — they
are outputs, and treating them as authoritative inputs is the mistake this section corrects. Verify
with `00-Validate-PowerShell-Syntax.ps1` and the bundle build on the host.

