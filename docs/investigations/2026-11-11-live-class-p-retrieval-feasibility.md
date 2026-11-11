# Stage 4 Class P: live diagnostic retrieval feasibility

## 1. Disposition: RETRIEVAL NOT AVAILABLE

No already-supported, non-invasive application interface in authoritative IPD
exposes the process-local Class P sink of PID 14484. No eligible retrieval
invocation can be supplied. This does NOT establish that the entry is physically
absent from memory, and does NOT establish the original refusal cause.
The incident remains OPEN; both existing import IDs remain quarantined.

This is a documentation-only assessment, not authorization for new diagnostics,
attachment, instrumentation, restart, reproduction, or import recovery.

## 2. Repository authority and inspection boundary

- Repository: `ramkivs/iips-production-market-data` only.
- Fetched authoritative `origin/main`: `29a789a07132c03ebb43bdfa862d113b04f4d924`.
- Assessment branch: `arena/ad96257c-iips-production-market-data`, existing PR #153.
- Branch HEAD before this report: `248234bfd5a79464f4188cd8a42f58b12927d4eb`.
- Source references below are to authoritative main at the SHA above. Branch
  production `src/` is identical to main; the collector/report additions are
  not assumed to be merged or synchronized with the Windows checkout.
- Source searches covered all `src`, `tests`, `scripts`, package exports/scripts,
  IPC dispatch/operation lists, protocol imports/re-exports, sink identifiers,
  process handlers and inspector/diagnostic integration identifiers.
- Windows facts below are supplied collector observations, not direct access by
  this assessment. No Windows command or collector rerun was performed.

## 3. Diagnostic sink ownership, lifecycle and all existing readers

| Authoritative reference | Finding |
| --- | --- |
| `src/ipc/protocol.ts:19` | `DIAGNOSTIC_SINK_LIMIT = 256`. |
| `src/ipc/protocol.ts:127-131` | Entry contains only `at` (record-time ISO timestamp), `reason` and `detail`. No built-in PID, request ID, operation, wire lengths, request payload, or connection correlation field. Detail is a reason-specific message, not a complete wire transcript. |
| `src/ipc/protocol.ts:133-154` | Module creates/exports one `new DiagnosticSink()` for that loaded module instance. Initial entries array is empty. No persistence, timer/TTL, stdout/stderr sink, database writer or cross-process store. |
| `src/ipc/protocol.ts:136-140` | `record()` appends; after capacity is exceeded, replaces the array with its latest 256 entries. The 256th subsequent record would evict an incident entry, absent another clear. Age alone does not evict it. |
| `src/ipc/protocol.ts:143-147` | `drain()` returns a shallow copy then empties the sink. This is state-changing, not a read-only retrieval primitive. |
| `src/ipc/protocol.ts:149-151` | `peek()` returns the existing array with a TypeScript readonly type. It does not clear it, but is an in-process JavaScript method, not an externally addressable endpoint or an immutable snapshot. |
| `src/ipc/dispatch.ts:85-91` | Only production caller of the sink: `refuseClassP()` records reason/detail then destroys the socket without writing an envelope. |
| `tests/g3_caller_authority.test.ts:103,110,122,134` | Test-local `drain()` cleanup and `peek()` assertions, running in the test's own process/module context. |
| `tests/g3_ipc_framing.test.ts` | Test-local recording at 214, cleanup at 229/325/534 and `peek()` assertions throughout (257-303,345,592,606,659,746). Not a live-process operator interface. |
| `tests/g3_no_network_listener.test.ts:86` | Test harness records local protocol errors; no exported live retrieval facility. |

Repository-wide sink references identify no production `peek()` or `drain()`
consumer. No application reader, status handler, health route, telemetry adapter,
CLI, package export wrapper, subscription, or supported signal callback reads
this sink. `src/ipc/endpoint.ts` imports the settlement type from protocol only.
Other operations/telemetry modules do not import or expose the sink.

A different Node process importing this module initializes its own instance. It
cannot select PID 14484 or reach the original module cache. Restarting the provider
would likewise discard its old in-memory instance and is specifically prohibited.

## 4. Retrieval mechanisms by eligibility category

1. **Existing supported external read-only interface:** none found for this sink.
   `protocol.ts:21-69` closes the v1/v2 operation vocabularies; neither has a
   diagnostic operation. `dispatch.ts:311-567` has no sink-read dispatch branch.
   `entrypoint.ts:193-233` binds the dispatcher and prints startup outcomes only;
   no local console evaluator or observability interface is registered.
2. **Tests only:** `peek()` and `drain()` calls above. Test execution cannot address
   another process; drain is additionally destructive to its local sink.
3. **New code:** a new endpoint, sink exporter, log subscriber or operator command
   would require implementation and separate authority. None is added here.
4. **Attachment/instrumentation/injection/target-process evaluation:** debugger,
   inspector evaluation, memory/heap inspection, or injected in-process calls are
   outside eligibility. Even if an inspector had independently been enabled by
   launch flags, that would not convert it into the supported application-level
   diagnostic interface required here. Redacted flags do not establish its state.
   No attachment/probe instructions or invocation are provided.

This conclusion applies to supported authoritative IPD behavior, not every
technically conceivable way to inspect Node memory. The running compiled bytes
are not independently certified by current-file hashes. That provenance gap does
not demonstrate an additional supported interface or justify probing for one.

## 5. PID 14484 and retention assessment

Supplied report collected at `2026-11-11T12:50:51.4956769Z`:

- **CONFIRMED (supplied current observation):** PID 14484 passed entrypoint-path,
  executable, and repeated PID/start-time/command-line checks. Executable is
  `C:\Node22\node-v22.16.0-win-x64\node.exe`; entrypoint is
  `H:\IIPS\iips-production-market-data\dist\src\ipc\entrypoint.js`.
- **CONFIRMED (supplied):** process start is `2026-11-11T10:58:06.3750340Z`.
  IPC stderr creation is `10:58:06.3725649Z`, and its last write is
  `10:58:06.7622215Z`; reported matching line 3 is the listening message. These
  observations corroborate association with that service launch. The report is
  a snapshot, not a guarantee of process state after its collection time.
- **INCONCLUSIVE:** continuity from the original incident. Matching PID/path and
  coherent launch timestamps support the reported identity, but no independent
  original process CreationDate/loaded-module record or precisely timestamped
  failing request is supplied. PID equality alone cannot exclude historical reuse.
  The service-directory timestamp label is not a precise request timestamp.
- **UNAVAILABLE:** parent (exited or PID reused) and process working directory.
- **INCONCLUSIVE:** loaded artifact identity. All eleven reported file write times
  (approximately 10:29:44-45Z) precede process start, which is consistent with a
  pre-start build. Current hashes/timestamps do not certify the exact bytes loaded
  then or exclude later replacement with preserved timestamps. No rebuild is needed
  or authorized to answer sink-interface feasibility.
- **INCONCLUSIVE:** whether the incident produced an entry in this sink. An actual
  `refuseClassP()` call would record it, but the generic upstream classification
  also cannot distinguish a pre-dispatch capacity drop or a transport failure.
- **INCONCLUSIVE:** current retention. No record count, later-refusal history,
  sink snapshot or original timestamp exists in supplied evidence. The incident
  entry could remain if recorded and not cleared/evicted; actual retention cannot
  be established. No production clear/replacement hook exists in reviewed source.
  `record()` can replace the bounded array; test-only `drain()` can clear it. No
  evidence shows tests, alternate code, or either clear mechanism ran inside this
  live provider. Do not assert a clear or eviction occurred.
- **CONFIRMED (source boundary):** even an intact retained entry is inaccessible
  through supported external application interfaces. Do not disturb this process
  to try to make it accessible.

## 6. Alternative retained evidence

The supplied report searched explicitly selected, bounded evidence. It reports
three files in `H:\IIPS\logs\services-20261111-162751`:

- `ipd-ipc.err.log`, 238 bytes: one matching listening record, no retained JSON.
- `ipd-ipc.out.log`, zero bytes: no matching records, no retained JSON.
- `irr-transport.err.log`, 515 bytes: one matching record projected as
  `UNAVAILABLE | ipc-class-p-refusal`, no retained JSON. The `UNAVAILABLE` substring
  is not proof of a received IPD Class A outcome; the original supplied line is
  the opaque upstream transport diagnosis.

Its sole reported issue is `NO_RETAINED_ORIGINAL_IPC_METADATA_FOUND`; no original
metadata files are listed. No capacity/size/access truncation issue was reported
for this collection. This does not establish an exhaustive search of all host
storage, unselected directories, or diagnostic text outside the collector's
allowlist/redacted projection. Do not expand the search or rerun the collector
without an identified retained artifact and appropriate authority.

| Required incident evidence | Current assessment / recoverability |
| --- | --- |
| Original wire `v` and `op` | UNAVAILABLE in supplied retained evidence. Source supports v1 importBroker, but that is not proof of the actual request's version/operation. A Broker Import log label is not a captured envelope. |
| Request ID type | UNAVAILABLE. Sink has no dedicated request-ID field; source validation requirements are not observed wire evidence. |
| Declared and actual UTF-8 frame lengths | UNAVAILABLE. Not recorded by the supplied artifacts; a reason-specific detail might include a declared-size diagnostic but cannot establish both lengths generally. |
| Trailing/additional bytes | UNAVAILABLE. Only a reason/detail or retained transport record could establish the original condition; neither is supplied. |
| Connection/write/response-close timing | UNAVAILABLE. Process/file timestamps establish file/process observations, not per-connection event times. IRR log last-write time `12:18:53.8741971Z` is not a timestamp of the exact request or failure. |
| Precise Class P reason and associated detail | UNAVAILABLE through current supported interfaces. Physical existence in the sink is INCONCLUSIVE. No copied sink entry or direct reason appears in supplied logs. |

If an original diagnostic was retained only in that module's memory, its content
cannot be recovered under the allowed supported-interface boundary. This is not a
claim that it has been erased. Any independently retained original evidence could
still change the incident assessment, but no such artifact has been identified.
Neither current source, current artifact hashes nor synthetic requests can fill
these historical gaps.

## 7. Safety, validation and remaining governance decision

Assessment actions: fetched/read IPD Git source, traced all sink references and
supported operation/observability paths, reviewed supplied JSON, and wrote this
report. Documentation-only diff checked for whitespace errors. No test execution
or build was needed: tests were read, not run. Existing PR CI can run as its normal
gate; it is not a probe of the Windows provider.

No live process access, attachment, termination, signal, injection, inspector
probe, IPC request, service action, network request to a product service, SQLite
handle, database/portfolio/binding/carrier/environment change, import/retry/replay,
or RESTORE occurred. No IRR or IPO Screening Engine access/change. No collector,
production mechanism, or runtime modification was added. PID 14484 is left alone.

Necessary next step is a **governance decision**, not another live command:
retain the supplied evidence and acknowledge retrospective cause as unproven;
keep both IDs quarantined. If historical cause must be established and no separate
retained evidence can be identified, explicitly decide whether a future,
separately scoped diagnostic/reproduction proposal may be evaluated. This report
does not propose an implementation, authorize a mechanism, or permit reproduction
or replay. Supported retrieval is unavailable; the incident is not resolved.
