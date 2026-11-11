import { randomUUID } from 'node:crypto';
import { ClassPJournal, type ClassPContext } from './classPJournal.js';
/**
 * Gate 3 — closed operation dispatch (act §4.2 item 13; contract v1 §5/§6; C6/C7).
 *
 * Per connection: read exactly one frame, enforce C7 caller-authority refusal at
 * any depth, resolve the owner binding afresh from the database, then route the
 * closed read/write set. Every pre-authorization failure is Class P: zero bytes
 * and connection close, with the reason confined to the bounded local diagnostic
 * sink. Post-authorization failures are Class A typed, non-disclosing envelopes.
 *
 * The v1 write operations historically returned WRITE_NOT_AUTHORIZED before any
 * store mutation while the W-1 conjunction was unmet. Under the explicitly
 * authorized local single-user personal path (IIPS_LOCAL_PERSONAL_USE=1 — see
 * ./localPersonalUse.ts) the same four operations are READ-PATH-PRESERVING and
 * fully execute: validation, binding resolution, transaction atomicity and
 * duplicate protection all remain authoritative. With the setting absent, the
 * historical refusal is byte-for-byte unchanged.
 *
 * This module deliberately has no import edge to persistence/provisioning.ts:
 * Gate A′ provisioning is unreachable from every IPC operation (static regression).
 */
import type { DatabaseSync } from 'node:sqlite';
import type { Socket } from 'node:net';
import type { BrokerImportConsumer } from './brokerImportConsumer.js';
import type { BrokerImportRequest } from '../contracts/broker_import_ipc.js';
import {
  ClassPError,
  classAFrame,
  diagnosticSink,
  findRefusedWireKeys,
  IPC_V2_WRITE_OPERATIONS,
  IPC_WRITE_OPERATIONS,
  readSingleFrame,
  successFrame,
  type AnyRequestEnvelope,
  type ClassAOutcome,
  type ClassPReason,
  type FrameReader,
  type FrameSettlementPolicy,
} from './protocol.js';
import {
  BindingAbsentError,
  BindingInvalidError,
  resolveActiveBinding,
  resolveActiveHoldingsBinding,
} from '../persistence/binding.js';
import {
  DurablePortfolioStore,
  evaluatePortSaveGuard,
  InvalidPortfolioRequestError,
  ResourceUnavailableError,
  RevisionConflictError,
  type LocalPortfolioDetail,
  type OwnerRef,
} from '../persistence/portfolio_store.js';
import {
  isLocalPersonalUseEnabled,
  revisionCapFor,
} from './localPersonalUse.js';
import {
  mapManualRequest,
  requireExpectedRevision,
} from '../persistence/manualPersonalPortfolio.js';

const RESOURCE_UNAVAILABLE_DETAIL = 'the requested resource is not available';
const PERSONAL_PORTFOLIO_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const DEFAULT_PORTFOLIO_ID = 'DEFAULT_PORTFOLIO';

export interface ConnectionHandlerOptions {
  /**
   * Transport settlement policy. AF_UNIX uses the airtight half-close gate;
   * Windows named pipes use the flush guard because a pipe half-close EOF is
   * only delivered when libuv force-breaks the pipe 50 ms after shutdown.
   */
  readonly settlement?: FrameSettlementPolicy;
  readonly idleTimeoutMs?: number;
  /**
   * Server-owned environment. The local personal-use switch is read from here
   * (never from the request); defaults to the process environment.
   */
  readonly env?: NodeJS.ProcessEnv;
  /** The single consumer composed by the entrypoint, never constructed here. */
  readonly brokerImportConsumer?: BrokerImportConsumer;
  /** Constructed by normal startup; test harnesses may use an isolated journal. */
  readonly diagnosticJournal?: ClassPJournal;
}

function refuseClassP(socket: Socket, reason: ClassPReason, detail: string, context: ClassPContext, journal?: ClassPJournal): void {
  const entry = diagnosticSink.record(reason, detail);
  if (journal) entry.journalOutcome = journal.append(reason, detail, context);
  // Class P is zero bytes: destroy without writing anything. Destroy also
  // cancels any pending write, so a response queued before the guard tripped
  // never reaches a pipelining peer.
  socket.destroy();
}

/**
 * Writes exactly one frame WITHOUT half-closing the writable side.
 *
 * Used on the flush-guard (Windows named-pipe) path only. A libuv pipe has no
 * half-close primitive: `end()` there is a FlushFileBuffers that neither signals
 * EOF to the peer nor closes the handle. Writing and then closing the handle
 * explicitly states what actually happens on that transport.
 */
function writeFrame(socket: Socket, frame: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.write(frame, (error?: Error | null) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

/**
 * Writes exactly one frame and half-closes the writable side, surfacing write
 * failures instead of swallowing them. The frame reader's flush guard is raced
 * against this write so trailing data arriving before the flush still produces
 * a zero-byte Class P refusal.
 */
function endFrame(socket: Socket, frame: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.end(frame, (error?: Error | null) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

/** Reads a trimmed portfolio identifier from a wire payload, with the local default. */
function personalPortfolioId(payload: Record<string, unknown>): string {
  const raw = payload.portfolioId;
  if (raw === undefined || raw === null) return DEFAULT_PORTFOLIO_ID;
  if (typeof raw !== 'string' || !PERSONAL_PORTFOLIO_ID_PATTERN.test(raw.trim())) {
    throw new InvalidPortfolioRequestError('portfolioId is not admissible');
  }
  return raw.trim();
}

/** Reads an optional portfolio name (100-char bound) from a wire payload. */
function personalPortfolioName(payload: Record<string, unknown>): string | undefined {
  const raw = payload.portfolioName ?? payload.name;
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw !== 'string') {
    throw new InvalidPortfolioRequestError('portfolioName must be a string');
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > 100) {
    throw new InvalidPortfolioRequestError('portfolioName must be 1–100 characters');
  }
  return trimmed;
}

/**
 * v1 view projection under the local personal-use mode.
 *
 * The frozen G2 consumer contract has no honest mapping for raw contribution
 * rows (it requires a per-batch `holdingsCount` the v1 rows do not carry, and
 * the broker-import `content_digest` never equals the revision digest), so the
 * governed row shape is NOT placed on the wire: a non-empty governed-shaped
 * list would be refused upstream instead of passed through.
 *
 * What IS on the wire, since the 2026-11-09 authorization extended the local
 * path to broker-observed holdings, is the import evidence the operator needs
 * to confirm what was imported: one entry per committed import carrying the
 * file name, source broker, import instant, content digest, lineage digest and
 * contribution semantics. These are the same durable ledger values, projected
 * into the honest per-import shape — nothing is synthesized, and an import with
 * no recorded provenance keeps `null` rather than being defaulted.
 *
 * The ledger itself is written exactly as before; `portfolio.revisions`
 * continues to expose the revision ledger.
 */
function personalGet(
  store: DurablePortfolioStore,
  owner: OwnerRef,
  portfolioId: string,
): LocalPortfolioDetail {
  const detail = store.get(owner, portfolioId);
  const importEvidence: LocalPortfolioDetail['importEvidence'] = store
    .contributions(owner, portfolioId)
    .map((row) => ({
      contentDigest: row.contentDigest,
      lineageDigest: row.lineageDigest,
      fileName: row.fileName,
      sourceBroker: row.sourceBroker,
      importedAt: row.importedAt,
      contributedAt: row.contributedAt,
      semantics: row.semantics,
    }));
  return { ...detail, contributions: [], importEvidence };
}

interface PersonalWriteReceipt {
  readonly disposition: 'SAVED_NEW_BATCH' | 'MERGED_INTO_EXISTING' | 'ALREADY_IMPORTED_NO_OP';
  readonly revision: number;
  readonly isDuplicate: boolean;
  readonly holdingsSavedCount: number;
  readonly totalMarketValue: number;
  readonly weightSumPercentage: number;
  readonly savedAt: string;
  readonly provenanceDigest: string;
  readonly portfolio: ReturnType<DurablePortfolioStore['get']>;
}

function personalReceipt(
  store: DurablePortfolioStore,
  owner: OwnerRef,
  portfolioId: string,
  revision: number,
  heldCount: number,
  isDuplicate: boolean,
  disposition: PersonalWriteReceipt['disposition'],
): PersonalWriteReceipt {
  const detail = personalGet(store, owner, portfolioId);
  return {
    disposition,
    revision,
    isDuplicate,
    holdingsSavedCount: isDuplicate ? 0 : heldCount,
    totalMarketValue: detail.totalMarketValue,
    weightSumPercentage: detail.weightSumPercentage,
    savedAt: detail.lastUpdated,
    provenanceDigest: detail.provenanceDigest,
    portfolio: detail,
  };
}

/**
 * Executes one v1 write op under the local single-user personal path. Callers
 * must have checked `isLocalPersonalUseEnabled` and resolved the binding. All
 * validation stays authoritative; errors are typed InvalidPortfolioRequestError
 * (400 INVALID_REQUEST) or RevisionConflictError (409), mapped by the caller's
 * typed catch block. Nothing is defaulted silently; no partial state survives a
 * failure (every op runs in one IMMEDIATE transaction inside the store).
 */
function executeLocalPersonalWrite(
  store: DurablePortfolioStore,
  owner: OwnerRef,
  envelope: AnyRequestEnvelope,
): PersonalWriteReceipt | ReturnType<DurablePortfolioStore['restore']> | { readonly portfolioId: string; readonly deletedAt: string } {
  const requestId = envelope.requestId;
  void requestId;
  const payload = (envelope.payload ?? {}) as Record<string, unknown>;
  const options =
    payload.options !== null && typeof payload.options === 'object' && !Array.isArray(payload.options)
      ? (payload.options as Record<string, unknown>)
      : {};
  const mode = options.mode === 'REPLACE' || payload.operation === 'REPLACE' ? 'REPLACE' : 'MERGE';
  const op = envelope.op;

  switch (op) {
    case 'portfolio.create': {
      const portfolioId = personalPortfolioId(payload);
      const portfolioName = personalPortfolioName(payload);
      const request = mapManualRequest(payload.holdings, 'MERGE');
      const revision = store.create(owner, portfolioId, {
        ...request,
        ...(portfolioName !== undefined ? { name: portfolioName } : {}),
      });
      return personalReceipt(store, owner, portfolioId, revision, request.holdings.length, false, 'SAVED_NEW_BATCH');
    }
    case 'portfolio.save':
    case 'portfolio.reset': {
      const portfolioId = personalPortfolioId(payload);
      const expectedRevision = requireExpectedRevision(payload.expectedRevision);
      const request = mapManualRequest(payload.holdings, mode);
      const next = op === 'portfolio.reset'
        ? store.reset(owner, portfolioId, request, expectedRevision)
        : store.save(owner, portfolioId, request, expectedRevision);
      const isDuplicate = next === expectedRevision;
      const disposition = isDuplicate ? 'ALREADY_IMPORTED_NO_OP' : 'MERGED_INTO_EXISTING';
      return personalReceipt(store, owner, portfolioId, next, request.holdings.length, isDuplicate, disposition);
    }
    case 'portfolio.restore': {
      if (Object.keys(payload).some(k => !['portfolioId', 'expectedRevision', 'idempotencyKey'].includes(k))) throw new InvalidPortfolioRequestError('unknown restore payload field');
      return store.restore(owner, personalPortfolioId(payload), requireExpectedRevision(payload.expectedRevision), payload.idempotencyKey as string);
    }
    case 'portfolio.delete': {
      const portfolioId = personalPortfolioId(payload);
      const expectedRevision = requireExpectedRevision(payload.expectedRevision);
      store.delete(owner, portfolioId, expectedRevision);
      // The store tombstoned the row inside the same transaction; report the
      // delete timestamp it recorded (never a local guess).
      const deletedAt = store.deletedAtOf(owner, portfolioId);
      return { portfolioId, deletedAt };
    }
    default:
      throw new InvalidPortfolioRequestError(`op ${String(op)} is not a local personal write`);
  }
}

/** Validate untrusted wire structure before passing it to the existing consumer. */
function brokerImportRequest(value: Record<string, unknown>): BrokerImportRequest {
  const allowed = ['portfolioId', 'expectedRevision', 'holdings', 'contentDigest', 'fileName', 'sourceBroker', 'importedAt', 'mode'];
  const holdingKeys = ['symbol', 'isin', 'exchange', 'series', 'quantity', 'averageBuyPrice', 'currentPrice', 'marketValue', 'weightPercentage', 'active', 'sourceBroker', 'lineageDigest'];
  const invalid = () => { throw new InvalidPortfolioRequestError('invalid broker import payload'); };
  if (Object.keys(value).some(k => !allowed.includes(k)) || typeof value.portfolioId !== 'string' || !PERSONAL_PORTFOLIO_ID_PATTERN.test(value.portfolioId) ||
      !Number.isSafeInteger(value.expectedRevision) || (value.expectedRevision as number) < 0 ||
      !Array.isArray(value.holdings) || value.holdings.length === 0 ||
      !['contentDigest', 'fileName', 'sourceBroker', 'importedAt'].every(k => typeof value[k] === 'string' && (value[k] as string).trim().length > 0) ||
      (value.mode !== undefined && value.mode !== 'MERGE' && value.mode !== 'REPLACE')) invalid();
  for (const raw of value.holdings as unknown[]) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) invalid();
    const h = raw as Record<string, unknown>;
    if (Object.keys(h).some(k => !holdingKeys.includes(k)) ||
        !['symbol', 'sourceBroker', 'lineageDigest'].every(k => typeof h[k] === 'string' && (h[k] as string).trim().length > 0) ||
        !['quantity', 'averageBuyPrice', 'currentPrice', 'marketValue', 'weightPercentage'].every(k => typeof h[k] === 'number' && Number.isFinite(h[k])) ||
        typeof h.active !== 'boolean' ||
        (h.isin !== undefined && typeof h.isin !== 'string') || (h.series !== undefined && typeof h.series !== 'string') ||
        (h.exchange !== undefined && h.exchange !== 'NSE' && h.exchange !== 'BSE')) invalid();
  }
  return value as unknown as BrokerImportRequest;
}

export function createConnectionHandler(
  db: DatabaseSync,
  options: ConnectionHandlerOptions = {},
): (socket: Socket) => void {
  const personalUse = isLocalPersonalUseEnabled(options.env ?? process.env);
  const store = new DurablePortfolioStore(db, undefined, { revisionCap: revisionCapFor(options.env ?? process.env) });
  const settlement: FrameSettlementPolicy = options.settlement ?? 'half-close-required';

  return (socket: Socket): void => {
    const context: ClassPContext = { connectionId: randomUUID(), connectedAt: new Date().toISOString(), settlement, frame: {} };
    let refused = false;
    const refuse = (reason: ClassPReason, detail: string): void => {
      if (refused) return;
      refused = true;
      refuseClassP(socket, reason, detail, context, options.diagnosticJournal);
    };
    socket.on('error', () => {
      context.frame.transportError = true;
      refuse('MALFORMED_FRAME', 'transport error');
      // A peer reset is a transport event; nothing may be written after it.
      socket.destroy();
    });

    void (async () => {
      let reader: FrameReader;
      let envelope: AnyRequestEnvelope;
      try {
        reader = await readSingleFrame(socket, {
          settlement,
          onEnvelope: value => { context.envelope = value; },
          onFrameMetadata: value => { context.frame = value; },
          ...(options.idleTimeoutMs ? { idleTimeoutMs: options.idleTimeoutMs } : {}),
        });
        envelope = reader.envelope;
      } catch (error) {
        if (error instanceof ClassPError) {
          refuse(error.reason, error.message);
          return;
        }
        refuse('MALFORMED_FRAME', error instanceof Error ? error.message : String(error));
        return;
      }

      // Single Class A response version: v2 frames refuse/answer with v=2.
      const responseVersion: 1 | 2 = envelope.v === 2 ? 2 : 1;

      // Declared outside the try so Class A error frames in the catch block
      // use the same guarded single-response write path. Before assignment
      // (a fault during the pre-write validation) it stays a zero-byte no-op.
      let writeGuarded: (frame: Buffer) => Promise<boolean> = () => Promise.resolve(false);
      try {
        // C7: caller-supplied authority/identity at any depth is refused before any
        // store access, at top level and inside payload/options alike.
        const refusedKeys = findRefusedWireKeys(envelope);
        if (refusedKeys.length > 0) {
          refuse('CALLER_SUPPLIED_AUTHORITY', `refused keys: ${refusedKeys.join(', ')}`);
          return;
        }

        // Per-request binding resolution; no cache, no process-global owner.
        // v2 holdings traffic additionally requires the prospectively
        // extended D02 canonical owner on the retained technical tenant; v1
        // keeps the existing generic resolution unchanged.
        let owner;
        try {
          owner = responseVersion === 2 ? resolveActiveHoldingsBinding(db) : resolveActiveBinding(db);
        } catch (error) {
          if (error instanceof BindingAbsentError) {
            refuse('BINDING_ABSENT', error.message);
            return;
          }
          if (error instanceof BindingInvalidError) {
            refuse('BINDING_INVALID', error.message);
            return;
          }
          refuse('BINDING_INVALID', 'binding resolution failed');
          return;
        }

        // Write authorization: W-1 default deny; the explicitly authorized
        // personal-local principal is recognized via env switch + binding.
        const writeGuard = evaluatePortSaveGuard({
          env: options.env ?? process.env,
          canonicalOwnerId: owner.canonicalOwnerId,
          tenantId: owner.tenantId,
        });

        // One-request-per-connection gate (T-2).
        //
        // AF_UNIX ('half-close-required'): withhold the response until the clean
        // half-close proves no second frame follows; a later data/error event
        // rejects whenSettled and the connection ends as a zero-byte refusal.
        //
        // Windows named pipe ('flush-guard'): a usable half-close EOF does not
        // exist (libuv delivers EOF only by force-breaking the pipe 50 ms after
        // client shutdown, when writes can no longer succeed), so the response
        // is written immediately while the guard stays attached; the write is
        // raced against whenGuardTripped below. A reference client cannot emit
        // bytes after its own half-close, so only a pipelining peer can trip it.
        if (reader.settlement === 'half-close-required') {
          try {
            await reader.whenSettled;
          } catch (error) {
            if (error instanceof ClassPError) {
              refuse(error.reason, error.message);
              return;
            }
            refuse('MALFORMED_FRAME', error instanceof Error ? error.message : String(error));
            return;
          }
        }

        // Single response-writing path for both policies. Under flush-guard the
        // write races the guard: any trailing byte or transport fault before the
        // flush completes turns into a zero-byte Class P refusal. Under
        // half-close-required, settlement was awaited above and this is a plain
        // write whose transport errors are still refused with zero bytes.
        writeGuarded = async (frame: Buffer): Promise<boolean> => {
          if (!reader.isGuardIntact()) {
            const fault = await reader.whenGuardTripped;
            refuse(fault.reason, fault.message);
            return false;
          }
          try {
            if (reader.settlement === 'flush-guard') {
              await Promise.race([
                writeFrame(socket, frame),
                reader.whenGuardTripped.then((fault) => {
                  throw fault;
                }),
              ]);
              // The single response has flushed. Close the server handle now:
              // `listenIpc` sets maxConnections = 1 (C5.4) and Node decrements
              // `server._connections` only in Socket._destroy, so an open handle
              // would consume the one capacity slot for the server's lifetime and
              // every later connection would be dropped before 'connection'.
              // Closing also delivers the peer's EOF: on a libuv pipe `end()` is
              // a FlushFileBuffers with no half-close, so the peer observes
              // ERROR_BROKEN_PIPE only on handle close. The frame is already
              // flushed, so the peer drains it first.
              //
              // Consequence (contract position, act §4.2 item 11 / §4.3 T-A):
              // a frame delivered after this point cannot reach a closed handle,
              // so the one-request/at-most-one-response invariant is enforced
              // structurally. The pipelined-frame refusal — the case T-A governs
              // ("zero bytes; connection closed (Class P)") — still happens before
              // the flush and is unchanged below.
              socket.destroy();
              return true;
            }
            await endFrame(socket, frame);
            return true;
          } catch (error) {
            if (error instanceof ClassPError) {
              refuse(error.reason, error.message);
              return false;
            }
            refuse('MALFORMED_FRAME', error instanceof Error ? error.message : String(error));
            return false;
          }
        };

        const requestId = envelope.requestId;
        const payload = envelope.payload ?? {};

        if (envelope.v === 2) {
          // D03 v2 surface: reads and refusals only. v2 writes (create/save)
          // refuse with WRITE_NOT_AUTHORIZED before any store mutation — the
          // W-1 hard-false conjunction covers v2 exactly as v1; the v2
          // mutation primitives are exercised only by isolated synthetic
          // fixtures, never through this dispatcher.
          const op = envelope.op;
          if ((IPC_V2_WRITE_OPERATIONS as readonly string[]).includes(op)) {
            await writeGuarded(classAFrame(op, 'WRITE_NOT_AUTHORIZED', requestId, undefined, 2));
            return;
          }
          let v2Result: unknown;
          switch (op) {
            case 'portfolio.list':
              v2Result = store.list(owner);
              break;
            case 'portfolio.get':
              // The v2 read projection is the validated nullable contribution
              // projection; durability fields remain absent (DR-3).
              v2Result = store.getV2(owner, String(payload.portfolioId));
              break;
            case 'portfolio.revisions':
              v2Result = store.revisions(owner, String(payload.portfolioId));
              break;
            default:
              refuse('UNKNOWN_OPERATION', `not dispatched: ${String(op)}`);
              return;
          }
          await writeGuarded(successFrame(op, v2Result, requestId, 2));
          return;
        }

        let result: unknown;
        if ((IPC_WRITE_OPERATIONS as readonly string[]).includes(envelope.op)) {
          if (!writeGuard.authorized) { await writeGuarded(classAFrame(envelope.op, 'WRITE_NOT_AUTHORIZED', requestId)); return; }
          if (envelope.op === 'portfolio.importBroker') {
            if (!options.brokerImportConsumer) { await writeGuarded(classAFrame(envelope.op, 'UNAVAILABLE', requestId, 'broker import is unavailable')); return; }
            const outcome = options.brokerImportConsumer(owner, brokerImportRequest(payload));
            await writeGuarded(successFrame(envelope.op, outcome, requestId)); return;
          }
          const receipt = executeLocalPersonalWrite(store, owner, envelope);
          await writeGuarded(successFrame(envelope.op, receipt, requestId)); return;
        }

        switch (envelope.op) {
          case 'portfolio.list':
            // Contract v1 §6: the `portfolio.list` result IS `PortfolioSummary[]`.
            // The result is the array itself, not an envelope wrapped around it.
            // The effective Gate 3 act fixes the wire property names by reference
            // to contract v1 and requires them to be implemented exactly.
            result = store.list(owner);
            break;
          case 'portfolio.get': {
            const portfolioId = personalUse ? personalPortfolioId(payload) : String(payload.portfolioId ?? 'DEFAULT_PORTFOLIO');
            // Contract v1 §6: the `portfolio.get` result IS `PortfolioDetail`.
            result = personalUse ? personalGet(store, owner, portfolioId) : store.get(owner, portfolioId);
            break;
          }
          case 'portfolio.revisions': {
            const portfolioId = String(payload.portfolioId ?? 'DEFAULT_PORTFOLIO');
            // Contract v1 §6: the `portfolio.revisions` result IS `RevisionEntry[]`.
            result = store.revisions(owner, portfolioId);
            break;
          }
          default:
            // The parser already closes the operation set; stay fail-closed.
            refuse('UNKNOWN_OPERATION', `not dispatched: ${envelope.op}`);
            return;
        }
        await writeGuarded(successFrame(envelope.op, result, requestId));
      } catch (error) {
        // A throw before the writer is assigned (e.g. the C7 scan itself)
        // cannot produce a frame; the no-op writer keeps the path zero-byte.
        const write = writeGuarded;
        if (error instanceof ResourceUnavailableError) {
          // Missing, foreign and tombstoned portfolios share one byte-stable outcome.
          await write(classAFrame(envelope.op, 'RESOURCE_UNAVAILABLE', envelope.requestId, RESOURCE_UNAVAILABLE_DETAIL, responseVersion));
          return;
        }
        if (error instanceof InvalidPortfolioRequestError) {
          await write(classAFrame(envelope.op, 'INVALID_REQUEST', envelope.requestId, 'the request is not admissible', responseVersion));
          return;
        }
        if (error instanceof RevisionConflictError) {
          await write(classAFrame(envelope.op, 'REVISION_CONFLICT', envelope.requestId, 'the revision guard does not match the current revision', responseVersion));
          return;
        }
        const outcome: ClassAOutcome = 'UNAVAILABLE';
        await write(classAFrame(envelope.op, outcome, envelope.requestId, 'the request could not be completed', responseVersion));
      } finally {
        // Detach exactly the reader-owned listeners; the caller's socket error
        // handler registered above remains available for transmission faults.
        reader.release();
        // Flush-guard transports (Windows named pipes): every path must leave
        // the capacity slot free. A successful response closes the handle in
        // writeGuarded; a Class P refusal or transport fault closes it in
        // refuseClassP. This guard covers any remaining flush-guard exit so no
        // path can hold the single connection slot open.
        if (reader.settlement === 'flush-guard' && !socket.destroyed) {
          socket.destroy();
        }
      }
    })();
  };
}
