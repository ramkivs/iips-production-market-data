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
| `src/providers/dhan/dhan_depth_capture.ts` | **New.** Extractor, environment/path resolution, one-shot latch, arm/disarm marker API, **request-body instrument reader and selector**. | 345 lines |
| `src/providers/dhan/dhan_api_client.ts` | **Modified.** One import block, one call site in `executeJsonPost` (now passing the request body), one private `captureRawDepthIfEnabled`, one body parser. | +75 / −0 |
| `tests/dhan_depth_capture.test.ts` | **New.** 31 tests in 5 suites (CAP-01 … CAP-30, incl. CAP-14a), of which CAP-24 … CAP-30 cover instrument scoping. | 658 lines |
| `windows-setup/07-Prepare-DepthCapture.ps1` | **New.** Operator preparation: build, capture directory outside the checkout, arm/disarm. Starts nothing, requests nothing. | 270 lines |
| `windows-setup/README.md` | **Modified.** File table and an execution-order section for the diagnostic. | +2 rows / +1 section |
| `windows-setup/Make-SetupBundle.ps1` | **Modified.** Adds the new script to the bundle's expected-file list (one line). | +1 line |
| `windows-setup/MANIFEST.txt`, `SHA256SUMS.txt` | **Modified.** Regenerated hashes and the corrected IPD pin. | mechanical |
| `docs/integration/DHAN-W11-IPD-DAEMON-CONFIGURATION-AND-OPERATIONS.md` | **Modified.** §6.4 records the market-data daemon ownership gap. | +9 lines |

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

## 7. Windows activation procedure — via the managed startup mechanism

> **Status: BLOCKED on one ownership prerequisite (§13).** The managed mechanism this procedure
> requires — `03-Start-IipsServers.ps1` owning the market-data daemon and recording its PID in the
> run manifest — does not exist yet. Delivery of that change is blocked in this environment for a
> stated reason, not by preference. Read §13 before using anything below.

### 7.0 What the managed mechanism does, and why it is mandatory

`03-Start-IipsServers.ps1` is start-of-record for this host: it writes one
`<InstallRoot>\logs\iips-pids-<stamp>.json` manifest, and `06-Stop-IipsServers.ps1` terminates only
processes whose PID appears in such a manifest **and** whose command line names an IIPS entrypoint
under the checkout. Anything started outside that mechanism is unmanaged: absent from the manifest,
not matched by the stop script, and reachable only by an operator killing a process by hand.

Given that, the requirement is unambiguous: **the daemon must be a child of the managed launch.**
Launching it from its own window with `npm run start:market-data-daemon` would satisfy the capture
but violate the ownership rule, so this procedure does not do that.

The one hard constraint that shapes everything below: the capture switch is read from
`process.env` in the daemon process, and a Windows process's environment is fixed at creation.
Setting `$env:` in one window and launching from another therefore achieves nothing. The variables
must be set in the **same session** that launches step 3.

### 7.1 Step 1 — code and build (once)

```powershell
cd H:\IIPS\iips-production-market-data
git fetch origin
git checkout arena/b210f700-iips-production-market-data
git pull
```

Build with the setup bundle's own preparation script, which uses the shared toolchain resolver and
verifies the compiled module exists afterwards:

```powershell
cd H:\IIPS-scripts
powershell -ExecutionPolicy Bypass -File .\07-Prepare-DepthCapture.ps1 -Build
```

It prints the capture path, the arm marker, and the exact launch instruction for this host. Confirm
the compiled module directly if you want your own evidence:

```powershell
Test-Path H:\IIPS\iips-production-market-data\dist\src\providers\dhan\dhan_depth_capture.js   # expect True
```

### 7.2 Step 2 — stop the stack through the managed stop script

```powershell
powershell -ExecutionPolicy Bypass -File .\06-Stop-IipsServers.ps1
```

Exit 0 means every IIPS port was released and the named pipe disappeared. Do not continue if it
reports a port still held: that is a real fault, not a warning.

### 7.3 Step 3 — launch the managed stack WITH the capture variables, in one session

```powershell
# Same PowerShell window as the 03 launch below. Not a second window.
$env:IIPS_DHAN_DEPTH_CAPTURE_PATH  = 'H:\IIPS\runtime\dhan-d18-depth-capture\reliance-depth.json'
$env:IIPS_DHAN_DEPTH_CAPTURE_LABEL = 'D-18 Reliance NSE_EQ 2885, one market-closed quote'
$env:IIPS_MARKET_DATA_TRANSPORT_TOKEN = '<the token this daemon already uses>'

$env:IIPS_DHAN_DEPTH_CAPTURE_PATH      # echo back: must show the path

powershell -ExecutionPolicy Bypass -File .\03-Start-IipsServers.ps1 -StartIpdIpc
```

Everything the daemon needs is inherited from this window, and every process in the stack — including
the market-data daemon, once §13 is delivered — is recorded in that run's PID manifest.

### 7.4 Step 4 — prove the daemon is owned before arming

This is the check that distinguishes a managed launch from the unmanaged one this procedure forbids.

```powershell
$pids = 'H:\IIPS\logs\iips-pids-' + (Get-ChildItem H:\IIPS\logs -Filter 'iips-pids-*.json' |
        Sort-Object LastWriteTime -Descending | Select-Object -First 1).Name.Substring(10)
$manifest = Get-Content $pids -Raw | ConvertFrom-Json
$manifest.processes | Format-Table label, pid, errLog -AutoSize
$manifest.processes | Where-Object { $_.label -eq 'ipd-market-data-daemon' }   # must not be empty
```

If that last line prints nothing, the daemon is not under management: **stop and report**, do not
proceed to arm. A capture obtained that way would be evidence produced by an unmanaged process.

Confirm the listener is the managed one and is loopback-only:

```powershell
Get-NetTCPConnection -LocalPort 8791 -ErrorAction SilentlyContinue |
  Select-Object LocalAddress, LocalPort, OwningProcess, State
```

`LocalAddress` must be `127.0.0.1`. Cross-check the owning PID against the manifest row.

### 7.5 Step 5 — arm exactly one capture

```powershell
cd H:\IIPS-scripts
powershell -ExecutionPolicy Bypass -File .\07-Prepare-DepthCapture.ps1 -Arm
```

That clears any previous capture, removes a stale marker, and creates
`H:\IIPS\runtime\dhan-d18-depth-capture\reliance-depth.json.arm`. Arming is a filesystem action,
so it needs no restart and no environment change.

### 7.6 Step 6 — issue exactly one Reliance quote

```powershell
curl.exe -sS -X POST http://127.0.0.1:8791/v1/quotes `
  -H "Authorization: Bearer $env:IIPS_MARKET_DATA_TRANSPORT_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"companyId":"EQ_RELIANCE_IN","securityId":"ISIN:INE002A01018:EQ","exchangeSegment":"NSE_EQ"}'
```

### 7.7 Step 7 — verify the capture

```powershell
$Out = 'H:\IIPS\runtime\dhan-d18-depth-capture\reliance-depth.json'
Test-Path $Out            # expect True
Test-Path "$Out.arm"      # expect False — the capture consumed the one-shot

$doc = Get-Content $Out -Raw | ConvertFrom-Json
$doc.captureSchemaVersion       # expect 2
$doc.requestedSecurityIds       # expect 2885
$doc.quotes | Select-Object segment, securityId, depthState
$doc.quotes[0] | ConvertTo-Json -Depth 8
```

`requestedSecurityIds` and `quotes[].securityId` are both `2885`, so the evidence identifies its own
instrument — no inference from file names. Because the capture is now scoped to that request
(§5.5), a file can only exist if the selected request produced it.

### 7.8 Step 8 — teardown, still through the managed scripts

```powershell
powershell -ExecutionPolicy Bypass -File .\06-Stop-IipsServers.ps1
```

The capture file survives shutdown — it is a file, not process state. Clear it only deliberately:

```powershell
powershell -ExecutionPolicy Bypass -File .\07-Prepare-DepthCapture.ps1 -Disarm -ClearCapture
```

### 7.9 If a second capture is ever needed

No restart, no environment change: re-arm and repeat step 6.

```powershell
powershell -ExecutionPolicy Bypass -File .\07-Prepare-DepthCapture.ps1 -Arm
```

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
| **Is the capture Reliance-specific?** | **Yes.** The gate reads the outbound request body and captures only an `NSE_EQ` / Dhan `2885` request — exactly one instrument. Any other quote returns before the slot is claimed and before the marker is touched, so it can neither spend the one-shot nor block the intended capture. Verified by CAP-24 … CAP-30, including the non-Reliance-then-Reliance regression (CAP-28). |
| **How does the daemon receive `IIPS_DHAN_DEPTH_CAPTURE_PATH`?** | At **process launch**, from the environment of the launching shell, inherited through the managed `03-Start-IipsServers.ps1` launch. `$env:` set in a separate window affects only that window and does nothing to an already-running `node.exe` — a hard constraint, not an assumption. |
| **One-shot guarantee** | Four layers: instrument gate (consumes nothing unless the request is the selected one), arm-marker gate, slot claimed before write (concurrency-safe), marker deleted after a successful write. Evidence cannot be overwritten for the process lifetime; a further capture needs an explicit re-arm, which needs no restart. |
| **Deployment / activation mechanism** | `07-Prepare-DepthCapture.ps1 -Build`, then `06-Stop-IipsServers.ps1`, then `03-Start-IipsServers.ps1 -StartIpdIpc` launched from the window that holds the variables. One restart, to load the code and the environment; arming and re-arming thereafter need none. |
| **Exact Windows output path** | `H:\IIPS\runtime\dhan-d18-depth-capture\reliance-depth.json` (marker `…\reliance-depth.json.arm`), outside the git working tree. |
| **Is daemon ownership preserved?** | **Not yet — blocked (§12).** `03` does not start the market-data daemon today, so its PID is absent from the manifest and `06` cannot stop it. The required change is specified exactly; delivering it here would have shipped a checksum-pinned bundle whose hashes cannot be regenerated without a PowerShell host. The procedure must not be operated until this is decided. |
| **Live request performed?** | **No.** No Dhan or vendor request was made, and no service was started, stopped or restarted. |
## 11. Removal

When D-18 is resolved: delete `src/providers/dhan/dhan_depth_capture.ts` and `tests/dhan_depth_capture.test.ts`, remove the import block, the single call in `executeJsonPost`, and the private `captureRawDepthIfEnabled` method from `dhan_api_client.ts`, then delete the runtime directory. Nothing else depends on the feature and no behaviour changes when it is absent — the diagnostic is inert without `IIPS_DHAN_DEPTH_CAPTURE_PATH`, so the code can also simply be left unset if removal is deferred.

## 12. The ownership prerequisite — blocker

### 13.1 What was asked

The activation procedure must use the existing `03-Start-IipsServers.ps1` startup mechanism, preserve
its PID manifest, and give daemon ownership to that mechanism rather than introducing a separate
unmanaged daemon launch.

### 13.2 What is true today (verified in this checkout)

`03-Start-IipsServers.ps1` starts four things: the IPD IPC provider (when `-StartIpdIpc`), the IRR
executive transport, the IRR Vite dev server, and the IPD shell (when `-StartIpdShell`). It
**never** starts the IPD market-data daemon on `127.0.0.1:8791`. The consequences compound:

| Surface | Current behaviour for the market-data daemon |
| :--- | :--- |
| `03` PID manifest (`iips-pids-<stamp>.json`) | the daemon's PID is absent |
| `06-Stop-IipsServers.ps1` termination | will not match it — `$entrypoints` is exactly `executive-transport.ts`, `dist\src\ipc\entrypoint.js`, `vite` |
| `06` port verification | `-Ports` defaults to `8787, 5176, 5174` — `8791` is never checked |
| Any managed launch path | none exists |

So on this host the daemon is started some other way — an outcome that is neither recorded in the
manifest nor verifiable by the stop script. That is precisely the unmanaged launch the requirement
forbids, and it predates this diagnostic.

### 13.3 Why this change was not delivered here

The change itself is small and specified in §13.4, but it could not be shipped in this environment
without leaving the setup bundle in a broken state, for a reason that is mechanical rather than
judgemental:

1. `windows-setup/SHA256SUMS.txt` and `MANIFEST.txt` pin the SHA-256 of every bundle member, and
   `03-Start-IipsServers.ps1` documents itself as checksum-pinned.
2. Those hashes are regenerated by `Make-SetupBundle.ps1`, which **requires a PowerShell runtime** —
   none exists in this sandbox (`pwsh` is unavailable), and the structural validator exists precisely
   because no real PowerShell parse is possible here.
3. Therefore the modified `03` would ship with checksums that no longer match its own contents, or
   with hand-computed ones asserted as if the generator had produced them.

Editing the runtime startup path of a live Windows host in a bundle whose integrity manifest can
only be validated on that host was judged a worse risk than delivering the prerequisite openly and
leaving it for a host-verified change. This is a stated blocker, not a completed item.

### 13.4 The exact change required

In `windows-setup/03-Start-IipsServers.ps1`:

1. Add `[int] $MarketDataPort = 8791` (matching `DEFAULT_MARKET_DATA_DAEMON_PORT`), and guard it with
   `Assert-IipsPortFree` alongside `8787`/`5176`/`5174`.
2. Start the daemon **after** the IPC provider and **before** the IRR transport, so the consumer
   never addresses a listener that is not yet up:

   ```powershell
   $marketDataEnv = @{ 'IIPS_MARKET_DATA_TRANSPORT_TOKEN' = $transportToken }
   # capture variables are inherited from the launching window; nothing is set here
   $marketData = Start-IipsService -Label 'ipd-market-data-daemon' -Executable $toolchain.NodeExe `
       -Arguments @((Join-Path $ipdRoot 'dist\src\providers\dhan\dhan_local_daemon.js')) `
       -WorkingDirectory $ipdRoot -LogDirectory $script:ServiceLogDir -Environment $marketDataEnv
   $script:Started.Add($marketData)
   ```

   Note that `Start-IipsService` already supports this: it takes `-Label`, `-Executable`,
   `-Arguments`, `-WorkingDirectory`, `-LogDirectory` and `-Environment`, and returns
   `Label/Pid/OutLog/ErrLog`, which is exactly the manifest row shape. No helper change is needed.
3. Readiness: poll `http://127.0.0.1:8791/v1/health` until it answers, then verify the bound address
   through `Wait-IipsPortListening -ExpectedAddress $BindAddress`. The daemon writes one sanitised
   line to **stderr** on bind, so the existing log file is the second source of evidence.
4. Manifest: add `marketDataPort = $MarketDataPort` to the manifest object and let the existing
   `$script:Started` loop record the PID. The operator check in §7.4 then becomes meaningful.
5. `windows-setup/06-Stop-IipsServers.ps1`: add `dhan_local_daemon.js` to `$entrypoints` and `8791`
   to the `-Ports` default, so the stop side actually matches what the start side created.
6. Add `07-Prepare-DepthCapture.ps1`'s outputs to the validation checklist, then regenerate
   `MANIFEST.txt`/`SHA256SUMS.txt` with `Make-SetupBundle.ps1` **on Windows** and re-run
   `00-Validate-PowerShell-Syntax.ps1` and `.validate-scripts.py`.

### 13.5 What is needed to close it

Either authorize the change above to be delivered alongside a note that the bundle checksums are
regenerated on the Windows host before use, or confirm that the daemon should stay outside step 3 and
that `06-Stop` should be extended to recover it by port. Until one of those is decided,
**§7 step 3 cannot claim daemon ownership**, and the capture should not be operated.

