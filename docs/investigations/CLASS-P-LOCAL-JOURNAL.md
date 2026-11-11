# Prospective local Class P refusal journal

## Scope and activation

This is a local diagnostic implementation, not a finding about the original incident.
Normal `startIpcServer` startup now constructs a mandatory journal before composition/listen.
Every dispatch Class P refusal records the existing bounded in-memory diagnostic first,
then synchronously attempts the redacted durable write, then destroys the connection.
No diagnostic is sent over IPC. Class A responses, operation vocabulary, binding/owner
checks, C7 authority scanning, authorization and database/import behavior are unchanged.
The in-memory `record`, `peek` and `drain` APIs remain; journal outcomes are additional
metadata on dispatch entries. Draining memory does not drain files.

Deploy/rebuild these sources and restart the IPC process **only through separately
authorized normal desktop/service activation**. No live Windows process was accessed,
restarted, synchronized or activated during implementation. Already-running processes
continue using their old loaded code. The new command is an offline file reader, not a
new IPC operation, inspector, signal handler, database reader or telemetry service.
Direct low-level test embeddings of `createConnectionHandler` may omit the journal;
normal application startup does not. New production embeddings must supply one.

## Location and read-only inspection

Default: `ipc-diagnostics` beside the configured `IIPS_G3_DATABASE_PATH` database file.
Override: `IIPS_G3_DIAGNOSTIC_DIR`, an **absolute local directory**. Do not configure
network/cloud-synchronized storage, logs shared with other users, a checkout, or a
broker import/input folder. The default directory name is Git-ignored. An override
outside that name must likewise stay outside version control. This adds no remote
infrastructure or dependency.

After building, inspect with an explicit path (no database/endpoint settings needed):

```powershell
node dist/src/ipc/inspectClassPDiagnostics.js --directory 'H:\private-local-state\ipc-diagnostics'
```

```sh
node dist/src/ipc/inspectClassPDiagnostics.js --directory /absolute/private-local-state/ipc-diagnostics
```

The command writes JSON `{records, issues}` to stdout. It does not create directories,
write, drain, repair, prune, contact the running process, or import the server entrypoint.
Exit 0 means the inspected records validated; 1 indicates unavailable/unsafe evidence or
per-record issues; 2 means invalid command syntax. Empty records means no committed
records in this bounded directory, **not** proof that no refusal occurred. Corrupt,
unsafe, invalid-shape or concurrently removed files are reported without dumping their
contents. Inspection can race rotation; `ROTATED_DURING_READ` is explicit. Inspection
is bounded to the newest 256 matching segments and refuses directories over 4096 entries.
It does not change contents/mtime; ordinary OS read-atime behavior is not suppressed.

## Format and data minimization

Each committed segment is one UTF-8 JSON object plus newline, schema `formatVersion: 1`,
filename `<13-digit-epoch-ms>-<random-uuid>.json`. Lexical order is the bounded retention
order, not a globally serialized event order. Fields:

- `id`, UTC `at`; process PID, random process/module instance ID, initialization UTC,
  Node version and platform. These distinguish PID reuse; initialization is not a
  historical Windows process-start attestation.
- `build`: SHA-256 hashes of adjacent compiled `entrypoint.js`, `dispatch.js`,
  `protocol.js`, `classPJournal.js` available at initialization. Provenance is explicitly
  `initialization-file-hashes-not-proof-of-loaded-bytes`; missing files are omitted.
  No trusted Git SHA is inferred from an environment variable or a current checkout.
- `reason`: existing Class P vocabulary; `detail`: fixed redacted summaries, with
  allowlisted literal binding-state messages and specific framing/timeout/transport
  categories. Unexpected binding lookup failures remain distinguishable from an actual
  absent binding. Arbitrary exception messages, dynamic refused key paths and payload
  values are not serialized. This is intentionally not a lossless exception transcript.
- `protocolVersion`: a parsed unsigned 32-bit integer when available, otherwise null;
  `operation`: only known protocol operation names, otherwise null.
- `requestIdSha256`: SHA-256 of a parsed string request ID; raw ID is never stored.
  `requestIdType` distinguishes missing/invalid types. To correlate, hash the exact UTF-8
  request ID independently. This is pseudonymous, **not encryption**: guessable IDs can
  be guessed. IDs are not used as filenames. No automatic replay is provided.
- `connection`: fresh server-generated UUID, connected/refused UTC, settlement policy.
  No peer addresses, principal labels, paths, tenant/company/portfolio IDs are retained.
- `frame`: received/declared byte counts, first/last byte and end timestamps when seen,
  transport-error flag where observed. No raw frame/header JSON, holdings, filenames,
  credentials, tokens, broker payloads or user filesystem paths.
- `durableWrite: published-after-file-fsync`: a readable committed record means the file
  write and file fsync completed before publication. Later retention/directory-sync
  errors are not rewritten into that immutable record; see outcome channels below.

Malformed JSON, oversize, truncated, trailing-frame and other early faults may lack
request/version/operation metadata. Do not parse rejected payloads merely to recover IDs.
Socket metadata is an observation at refusal, not a packet capture or exhaustive history.
Endpoint capacity drops before the handler and termination without a dispatch refusal
are not covered by this journal. Transport errors observed by the handler are recorded
as sanitized malformed-frame transport events; this does not establish a broker fault.

## Durability, concurrency, bounds and failures

Each writer exclusively creates its own 0600 UUID `.pending` segment, writes the bounded
record (at most 8192 bytes), fsyncs/closes it, then atomically renames it to `.json`.
No shared append offset, truncation or mutable current-log file exists. Independent
process writers cannot overwrite each other's records. The handler waits synchronously
for the attempt before destroying the refused connection. This introduces local disk
latency; it is intentionally not an async queue that could lose events on shutdown.
There are no persistent writer handles or shutdown flush queue.

After each publication and initialization, prune oldest matching committed records to
**256 records and 1 MiB combined**, whichever binds first. Tests may lower these limits;
there is no unbounded-retention runtime override. Rotation safely tolerates another
writer deleting an already-selected old segment. Concurrent writers can temporarily
exceed the steady-state cap by their in-flight records; normal completed pruning
converges to the cap. Unrelated files are never deleted. Unpublished `.pending` records
older than one hour are cleaned at initialization/pruning; current writers' segments
are not touched. Frequent crashes, unrelated/corrupt files, and failed deletions can
prevent retention enforcement: this is a visible failure, not a promise of an absolute
disk quota under filesystem failure or hostile directory modification. The entry cap
fails closed; no recursive scan is performed.

POSIX directory metadata is fsynced after pruning/publication. Windows Node does not
expose directory fsync; file fsync + same-directory rename is used. Filesystem/device
power-loss guarantees still depend on the OS and local filesystem. Abrupt death before
publication can leave a pending segment; it is not represented as a durable event by
the viewer. No implementation can persist through an unwritable disk or recover an
event before its journal write.

Startup checks path safety/ownership, creates a directory if absent, probes exclusive
creation/fsync/removal, and applies retention. Failure returns startup phase
`diagnostics` with a sanitized configuration error, before listening (existing startup
migration/audit verification still precedes this step). At runtime failure:

1. The in-memory entry remains, with `journalOutcome` = `failed`, `persisted`, or
   `persisted_with_failure`, optional record ID and allowlisted OS error code.
2. `ClassPJournal.failures` increments and stderr receives a sanitized
   `IPD_CLASS_P_JOURNAL_FAILURE` notice with PID, status and code only. No paths or raw
   exception text. A post-publication pruning/fsync failure is explicitly distinct.
3. The socket is still destroyed with zero diagnostic bytes; no retry, import, binding
   adjustment, bypass, or fallback broker operation occurs.

If stderr itself is broken, the in-memory outcome/counter still exist. They are not an
external inspection API and disappear on restart; retain service stderr using the
normal local launcher if durable write-failure evidence is required. A failed write
cannot store its own failure reliably on that same failed disk. Inspect journal and
launcher stderr together; absence of a journal event is inconclusive.

## Filesystem security

Paths containing existing symlinks/junctions are refused. POSIX final directories must
be owned by the current UID and have no group/other permissions; new directories are
0700 and files 0600. Existing unsafe directories are rejected, not chmod-ed. Matching
segments must be bounded regular single-link files, not symlinks. The viewer validates
an allowlisted field shape before emitting any disk record.

On Windows, as with the existing desktop endpoint/state architecture, Node uses the
current user's inherited/default DACL; this code does **not** provision or attest ACLs.
Before activation choose a local user-private state directory and verify its ACL permits
only the intended user and required administrators/system accounts. Do not infer ACL
privacy from POSIX mode arguments. This journal is neither encrypted nor tamper-evident,
and cannot protect against another process with the same user privileges, an
administrator, path replacement races by such an actor, or compromised storage. Do not
share journal/stdout dumps publicly merely because payloads were removed.

## Validation and historical limits

`tests/class_p_journal.test.ts` uses only synthetic IDs, temp directories and isolated
SQLite fixtures. It covers persistence before socket destruction; sink APIs and failure
outcomes; parsed correlation and frame metadata; fresh-process/reinitialized reading;
startup activation and restart retention; detail/redaction; record/byte rotation;
independent concurrent process writers; injected pre-fsync and post-publication failure;
missing paths; unsafe modes/configuration; corrupt/untrusted records; nonmutating viewer;
and Class P zero-wire-byte behavior. Adjacent existing framing (including emulated
Windows flush guards), startup, C7, write-gate Class A, and Stage 4 IPC tests are targeted.
The Stage 4 test harness closes its startup-owned SQLite handle before cleanup and
uses endpoint-selected settlement for manually constructed handlers, matching normal
startup on native Windows. The dedicated workflow runs these targets on Ubuntu and native Windows; local Linux
results must not be described as native Windows evidence.

Local checks: `npm run build:tsc`; the six targeted compiled test files (176 tests,
all passed); `npm run build` (TypeScript, Vite and three package builds passed; Vite
reports the existing large-chunk warning). No unrelated full suite was manually run.
`npm ci --ignore-scripts` reported 3 dependency audit vulnerabilities (2 moderate,
1 high); no unrelated dependency changes were made.

The prior collector, original investigation and
[read-only retrieval feasibility report](2026-11-11-live-class-p-retrieval-feasibility.md)
remain historical evidence. This prospective journal cannot retrieve an old in-memory
sink or prove why PID 14484 refused either quarantined import. No live process access,
incident reproduction, replay, database/portfolio/binding edit, restore, or re-import of
the already resolved 64 rows occurred. Original precise cause remains **unproven**.
