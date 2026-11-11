# Broker Import Stage 4: unframed IPC incident investigation

## Disposition

**OPEN — exact incident root cause and first failing condition NOT YET PROVEN.**
Both existing import IDs remain quarantined. This report authorizes no dispatch,
retry, replay, replacement import, binding change, or database operation.
No runtime correction is justified by the available incident evidence.

## Scope and evidence provenance

- Repository: `ramkivs/iips-production-market-data` only.
- Source reviewed: authoritative `origin/main` and local HEAD both
  `29a789a07132c03ebb43bdfa862d113b04f4d924`, fetched during this investigation.
- Working branch: `arena/ad96257c-iips-production-market-data`.
- User-provided incident log:
  `[broker-import] owner-context-unavailable stage=commit cause=ipc-class-p-refusal`.
  This is treated as the observed transport failure, NOT as evidence of a missing
  IRR owner-context precondition or a missing IPD owner binding.
- User-provided Windows startup evidence (2026-11-11 16:27:51): provider PID 14484,
  executable script `H:\IIPS\iips-production-market-data\dist\src\ipc\entrypoint.js`,
  listening on `\\.\pipe\iips-user-portfolio-v1`. Other services passed health checks.
  These observations establish startup/availability, not successful request dispatch.
- The original Windows log files, incident wire bytes, process-local refusal
  diagnostics, and the running Windows artifact files are not available in this
  workspace. No claim is made to have inspected them directly.
- `dist` is untracked/ignored; no local compiled runtime is present. Source HEAD,
  pathname, startup success, and an earlier stale-build finding cannot certify
  the artifacts loaded by PID 14484 at the incident time. No build was performed.

## Accepted source route

References below are to the source commit above, not the later report commit.

1. `src/contracts/broker_import_ipc.ts:86-98`: broker import is a **v1** operation.
   A success envelope acknowledges dispatch; `result.ok` carries commit/refusal/
   unknown outcome. Class A refusal envelopes use `ok:false` and `outcome`.
2. `src/ipc/protocol.ts:44-69`: `portfolio.importBroker` is in the closed v1
   operation and write-operation sets. It is NOT a v2 operation.
3. `src/ipc/entrypoint.ts:177-180`: `startIpcServer` constructs the Stage 4 consumer
   with governed identity dependencies plus server-owned authorization options.
   Lines 193-203 select endpoint settlement policy and inject that consumer into
   `createConnectionHandler`. Composition failure refuses startup before binding.
4. `src/ipc/dispatch.ts:498-503`: after framing, authority scan, binding resolution,
   and write guard, validate with `brokerImportRequest` (lines 289-308), call the
   injected consumer, and frame its outcome with `successFrame`/`writeGuarded`.
5. `src/ipc/brokerImportConsumer.ts:65-92`: factory -> durable port ->
   `submitBrokerImport` -> `persistBrokerImport`.
6. `src/persistence/brokerImportPersistence.ts:230-327`: validate, resolve/map
   observations, compute provenance, run protected transaction. Transaction
   failures become typed outcome objects, including OUTCOME_UNKNOWN for uncertain
   commit acknowledgement. Early validation/mapping exceptions that propagate
   reach the dispatch catch, after the response writer has been installed.

Stage 4 exists and is reachable in authoritative source. Actual Windows compiled
registration/injection remains unverified. Prior resolution of all 64 rows is
accepted; no row-resolution work was repeated. Resolution does not establish the
wire frame size/version, allowed-key shape, binding state, or flush success.

## Source paths yielding no usable response frame

The supplied transport classification cannot distinguish these branches.

| Order / location | Condition | Behavior / diagnostic |
| --- | --- | --- |
| Endpoint admission, `src/ipc/endpoint.ts:246-274` (`listenIpc`) | Default `server.maxConnections=1` is already consumed | Node can drop excess connections before the dispatch callback; no application response or per-request sink record is guaranteed. No concurrent-connection evidence is supplied. |
| `src/ipc/dispatch.ts:320-323` | Socket transport error | Destroy socket without a response. |
| `src/ipc/protocol.ts:210-263`, `parseSingleFrame` | Oversize declaration (>65,536 body bytes); extra/trailing bytes; invalid JSON/object/envelope/payload/requestId; unsupported version; operation outside closed set | Class P; dispatch read catch calls `refuseClassP`. `v:2` + `portfolio.importBroker` specifically fails `validateV2Envelope` at lines 356-359 with UNKNOWN_OPERATION. |
| `src/ipc/protocol.ts:487-645`, `readSingleFrame` | Incomplete-frame idle deadline (default 5 seconds), aggregate oversize, EOF before complete frame, transport error, or any additional data after parsed frame | Reader rejection or guard trip; Class P/no complete response. A valid first frame does not excuse subsequent trailing bytes. |
| `src/ipc/dispatch.ts:353-358`, `findRefusedWireKeys` | Any forbidden identity/authority key at any depth, or recursion depth exceeds 12 | CALLER_SUPPLIED_AUTHORITY, before binding and before consumer. Forbidden keys include owner/tenant claims, companyId, runtimeCompanyId, identityStatus, resolutionDisposition, identity, and tenantHint (`protocol.ts:99-122`). No supplied request proves any was present. |
| `src/ipc/dispatch.ts:363-377`, binding resolution | Absent/invalid binding, invalid membership, or ANY other exception from resolver | BINDING_ABSENT or BINDING_INVALID; the broad catch also maps unrelated resolution errors (e.g. SQLite BEGIN/read errors) to BINDING_INVALID. This diagnostic alone would not prove missing binding. |
| `src/ipc/dispatch.ts:399-411` | Half-close settlement rejection | Class P. Authoritative Windows startup instead selects flush-guard through `endpoint.ts:142-144`; an outdated/custom dispatcher could differ. |
| `src/ipc/dispatch.ts:417-460`, `writeGuarded` | Guard already broken; guard trips before response flush; socket write fails | `refuseClassP` destroys/cancels writing. Transport faults after partial delivery can yield a truncated frame rather than literally zero delivered bytes. |
| `src/ipc/dispatch.ts:349,535-565` | Unexpected exception before writer assignment | Catch invokes initial no-op writer; Windows finally destroys socket. This is a source-level fallback, not an established incident trigger. |

`refuseClassP` (`dispatch.ts:85-91`) deliberately records a reason/detail in
`diagnosticSink` then destroys the socket without writing an envelope.
`protocol.ts:125-154` stores only the latest 256 entries in process memory.
It does not persist them or write them to stderr. A new Node process importing
`diagnosticSink` gets a different sink and cannot retrieve PID 14484's evidence.
The source provides no remote diagnostic operation to retrieve that live sink.

### Exceptions and response writer

The ordinary consumer call is inside the dispatch try/catch and occurs AFTER
`writeGuarded` assignment. A thrown consumer error maps to framed UNAVAILABLE;
typed store errors map to framed RESOURCE_UNAVAILABLE, INVALID_REQUEST, or
REVISION_CONFLICT (`dispatch.ts:535-553`). Consumer failures are not generally
silently swallowed as zero-byte responses.

The asynchronous handler is launched using `void (async () => { ... })()` without
an outer terminal catch (`dispatch.ts:325-567`). Exceptional failures escaping
catch/finally (for example a secondary failure while constructing an error
response) can become unhandled rejections. There is no incident evidence of such
an exception or process exit; this is not selected as root cause or patched.

## Refusals that should remain framed

- Dispatcher write guard false -> Class A WRITE_NOT_AUTHORIZED (`dispatch.ts:499`).
- Injected consumer absent -> Class A UNAVAILABLE (`dispatch.ts:501`).
- Invalid broker-specific payload -> Class A INVALID_REQUEST after writer setup.
- Persistence authorization mismatch -> consumer refusal outcome, framed in result.
  Durable port `assertWritable` / `withBrokerImportTransaction` are at
  `src/persistence/durablePortfolioStorePort.ts:96-113,129-131`.
- Stale revision, missing/foreign/tombstoned resource, and store validation failures
  do not ordinarily explain an unframed response with an intact transport.
- Normal consumer exception -> Class A UNAVAILABLE.
- Oversize success/refusal result: `successFrame` can throw while encoding; the
  dispatch catch normally sends small framed UNAVAILABLE, not a zero-byte refusal.

For v1, dispatch resolves `resolveActiveBinding`, not the v2-only pinned holdings
owner resolver. `src/persistence/binding.ts:85-139` requires one ACTIVE binding and
one ACTIVE membership attached to it and returns the stored canonical owner/tenant.
No evidence establishes that this condition failed during the incident.

The missing `.env.local` notices in the supplied IRR log do not establish the IPD
write guard state. The IPD executable source explicitly sets the personal-use
switch in its startup environment (`entrypoint.ts:221-222`). No environment change
was attempted or recommended as a fix.

## Contract assessment

The source handler and browser-safe broker-import contract agree on the operation,
v1 envelope, request fields, and framed application outcomes. The outer success
flag does not promise commit success. Global framing/security Class P rules are
in `protocol.ts` and are not represented as JSON alternatives in the response type.
No concrete contract/implementation mismatch is demonstrated by this log alone.
Do not convert mandated Class P security refusals to framed success/refusals merely
to remove the opaque 503; that would alter accepted architecture without evidence.

Existing targeted test source `tests/stage4_broker_import_ipc.test.ts` covers caller
owner spoof -> zero bytes, absent binding -> zero bytes, write-disabled -> framed
WRITE_NOT_AUTHORIZED, absent consumer -> framed UNAVAILABLE, and consumer throw ->
framed UNAVAILABLE. Its commit-path test performs synthetic import dispatches.
These tests were inspected, NOT executed in this investigation: no import dispatch,
replay, build, database access, or row-resolution test was needed or authorized for
an evidence-only finding. This report does not claim a new passing test result or
Windows named-pipe reproduction.

## Missing evidence and precise next step

Collect EXISTING incident-time evidence without sending any IPC request:

1. Exact Windows artifact content/hashes and provenance for entrypoint.js,
   dispatch.js, protocol.js, endpoint.js, brokerImportConsumer.js,
   brokerImportComposition.js, and persistence/brokerImportPersistence.js.
   Current artifacts alone do not prove what an already-running process loaded;
   correlate with retained build/start records and any later file changes.
2. Retained original request metadata: v/op, envelope and nested key names,
   requestId type, declared and actual UTF-8 frame byte lengths, trailing data,
   and connection/write/close timing. Inspect retained evidence only; do not
   resend either quarantined import. Do not collect credentials in this report.
3. Any already captured PID 14484 Class P reason/detail or Node stderr, transport
   error/drop evidence, and overlapping-connection timing. If the process-local
   sink was never captured and the process exited, that evidence may be lost.
4. If existing evidence specifically implicates binding, separately authorized
   read-only incident-time binding/SQLite evidence is needed; current binding
   rows cannot retroactively prove the failing condition.

If no retained evidence discriminates the branches, keep root cause unresolved.
A separately authorized diagnostics-only plan would then be needed before any
future controlled reproduction. This report neither implements that plan nor
permits import retry. Health checks or a new process's empty sink are not substitutes.

## Change and safety record

Documentation only. No production code, authorization, identity, persistence,
protocol, environment, or eligibility changes. No IRR access or cross-repository
writes. No service start, import dispatch, retry/replay, SQLite handle, actual
portfolio access, migration, or RESTORE. Both existing import IDs remain quarantined.
