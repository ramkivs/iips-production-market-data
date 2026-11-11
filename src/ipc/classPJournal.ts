/** Local-only Class P evidence. No database, product request, or IPC client dependency. */
import { randomUUID, createHash } from 'node:crypto';
import { closeSync, constants, existsSync, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync, readdirSync, renameSync, statSync, unlinkSync, writeSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ClassPReason } from './protocol.js';

export const CLASS_P_DIRECTORY_SETTING = 'IIPS_G3_DIAGNOSTIC_DIR';
const RECORD_NAME = /^\d{13}-[0-9a-f-]{36}\.json$/;
const MAX_RECORD_BYTES = 8192;
const REASONS: readonly string[] = ['MALFORMED_FRAME','OVERSIZE_FRAME','PROTOCOL_VERSION_UNSUPPORTED','UNKNOWN_OPERATION','CALLER_SUPPLIED_AUTHORITY','BINDING_ABSENT','BINDING_INVALID','CAPACITY_EXCEEDED','IDLE_TIMEOUT'];
const OP = /^portfolio\.(list|get|revisions|create|save|reset|delete|restore|importBroker)$/;
const sha = (text: string | Buffer): string => createHash('sha256').update(text).digest('hex');
const instanceId = randomUUID();
const initializedAt = new Date().toISOString();

export interface FrameEvidence {
  receivedBytes?: number;
  declaredBodyBytes?: number;
  firstByteAt?: string;
  lastByteAt?: string;
  endedAt?: string;
  transportError?: boolean;
}
export interface EnvelopeEvidence { v?: unknown; op?: unknown; requestId?: unknown; requestIdType?: string }
export interface ClassPContext {
  connectionId: string;
  connectedAt: string;
  settlement: string;
  frame: FrameEvidence;
  envelope?: EnvelopeEvidence;
}
export interface JournalOutcome {
  status: 'persisted' | 'failed' | 'persisted_with_failure';
  recordId?: string;
  code?: string;
}
export interface ClassPRecord {
  formatVersion: 1;
  id: string;
  at: string;
  process: { pid: number; instanceId: string; initializedAt: string; nodeVersion: string; platform: string };
  build: { provenance: string; files: Record<string, string> };
  reason: string;
  detail: string;
  protocolVersion: number | null;
  operation: string | null;
  requestIdSha256: string | null;
  requestIdType: string;
  connection: { id: string; connectedAt: string; refusedAt: string; settlement: string };
  frame: FrameEvidence;
  durableWrite: 'published-after-file-fsync';
}

/** Never emit arbitrary parser, caller, filesystem or binding error text. */
function safeDetail(reason: ClassPReason, detail: string): string {
  const fixedBindingDetails = [
    'no ACTIVE local principal binding is registered', 'the ACTIVE binding has no ACTIVE membership',
    'more than one ACTIVE local principal binding exists', 'more than one ACTIVE membership exists',
    'the ACTIVE membership is not attached to the ACTIVE binding',
    'the ACTIVE binding is not the authorized holdings owner binding',
  ];
  if ((reason === 'BINDING_ABSENT' || reason === 'BINDING_INVALID') && fixedBindingDetails.includes(detail)) return detail;
  if (detail === 'Additional bytes after the single permitted frame' || /trailing|second frame|pipelined/.test(detail)) return 'Additional bytes after the single permitted frame';
  if (detail === 'Connection ended before a complete frame' || /connection ended before/.test(detail)) return 'Connection ended before a complete frame';
  if (detail === 'Complete-frame deadline exceeded' || /no complete frame/.test(detail)) return 'Complete-frame deadline exceeded';
  if (detail === 'Single-frame settlement deadline exceeded' || /half-close/.test(detail)) return 'Single-frame settlement deadline exceeded';
  if (detail === 'IPC transport error' || /transport error/.test(detail)) return 'IPC transport error';
  if (detail === 'Binding lookup failed (not proof of absent binding)' || detail === 'binding resolution failed') return 'Binding lookup failed (not proof of absent binding)';
  const summaries: Record<ClassPReason, string> = {
    MALFORMED_FRAME: 'Malformed IPC framing or envelope', OVERSIZE_FRAME: 'IPC request byte cap exceeded',
    PROTOCOL_VERSION_UNSUPPORTED: 'Unsupported IPC protocol version', UNKNOWN_OPERATION: 'Operation outside the closed protocol vocabulary',
    CALLER_SUPPLIED_AUTHORITY: 'Caller authority/identity key or depth violation', BINDING_ABSENT: 'No active binding or membership resolved',
    BINDING_INVALID: 'Binding or membership resolution refused', CAPACITY_EXCEEDED: 'IPC connection capacity exceeded', IDLE_TIMEOUT: 'IPC reader deadline exceeded',
  };
  return summaries[reason];
}
function errorCode(error: unknown): string {
  const code = (error as { code?: string })?.code;
  return ['EACCES','EPERM','ENOSPC','EROFS','EIO','ENOENT','EEXIST','EMFILE','ENFILE','EBUSY'].includes(code ?? '') ? code! : 'JOURNAL_IO_FAILURE';
}

/** Reject links/junctions; only the final directory needs owner-private POSIX mode. */
function checkPath(directory: string): void {
  if (!isAbsolute(directory)) throw new Error('diagnostic directory must be absolute');
  let current = resolve(directory);
  for (;;) {
    if (existsSync(current) && lstatSync(current).isSymbolicLink()) throw new Error('diagnostic path links are refused');
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
}
function checkDirectory(directory: string): void {
  checkPath(directory);
  const info = lstatSync(directory);
  if (!info.isDirectory()) throw new Error('diagnostic directory is not a directory');
  if (process.platform !== 'win32' && ((info.mode & 0o077) !== 0 || (typeof process.getuid === 'function' && info.uid !== process.getuid()))) {
    throw new Error('diagnostic directory must be owner-owned and private');
  }
}
function recordFiles(directory: string): string[] {
  // Bound scanning even if unrelated files have been placed in the directory.
  const names = readdirSync(directory);
  if (names.length > 4096) throw new Error('diagnostic directory entry cap exceeded');
  return names.filter(name => RECORD_NAME.test(name)).sort();
}
function noLinkFile(path: string): void {
  const info = lstatSync(path);
  if (!info.isFile() || info.isSymbolicLink() || info.nlink !== 1 || info.size > MAX_RECORD_BYTES) throw new Error('unsafe diagnostic record');
}
function syncDirectory(directory: string): void {
  // Windows does not expose directory fsync through node:fs. File fsync is still required.
  if (process.platform === 'win32') return;
  const fd = openSync(directory, constants.O_RDONLY);
  try { fsyncSync(fd); } finally { closeSync(fd); }
}
function buildEvidence(): ClassPRecord['build'] {
  const files: Record<string, string> = {};
  const directory = dirname(fileURLToPath(import.meta.url));
  for (const name of ['classPJournal.js','entrypoint.js','dispatch.js','protocol.js']) {
    const path = join(directory, name);
    if (existsSync(path) && statSync(path).size < 2 * 1024 * 1024) files[name] = sha(readFileSync(path));
  }
  return { provenance: 'initialization-file-hashes-not-proof-of-loaded-bytes', files };
}

export class ClassPJournal {
  private readonly maxRecords: number;
  private readonly maxBytes: number;
  private readonly build = buildEvidence();
  readonly directory: string;
  failures = 0;
  constructor(directory: string, private readonly options: {
    maxRecords?: number; maxBytes?: number;
    onFailure?: (notice: { event: string; pid: number; code: string; status: string }) => void;
    testBeforeSync?: () => void;
  } = {}) {
    this.directory = resolve(directory);
    this.maxRecords = options.maxRecords ?? 256;
    this.maxBytes = options.maxBytes ?? 1024 * 1024;
    if (!isAbsolute(directory) || !Number.isInteger(this.maxRecords) || this.maxRecords < 1 || this.maxRecords > 256 || !Number.isInteger(this.maxBytes) || this.maxBytes < MAX_RECORD_BYTES || this.maxBytes > 4 * 1024 * 1024) {
      throw new Error('invalid diagnostic retention configuration');
    }
    checkPath(this.directory);
    mkdirSync(this.directory, { recursive: true, mode: 0o700 });
    checkDirectory(this.directory);
    const probe = join(this.directory, `${Date.now()}-${randomUUID()}.pending`);
    const fd = openSync(probe, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL, 0o600);
    try { fsyncSync(fd); } finally { closeSync(fd); unlinkSync(probe); }
    this.prune();
  }
  private prune(): void {
    const records = recordFiles(this.directory).map(name => {
      const path = join(this.directory, name);
      try { noLinkFile(path); return { path, bytes: statSync(path).size }; }
      catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined; throw error; }
    }).filter((item): item is {path: string; bytes: number} => item !== undefined);
    let bytes = records.reduce((sum, item) => sum + item.bytes, 0);
    let count = records.length;
    for (const item of records) {
      if (count <= this.maxRecords && bytes <= this.maxBytes) break;
      try { unlinkSync(item.path); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
      bytes -= item.bytes; count--;
    }
    // A crash can leave an unpublished temporary segment. Remove only old segments;
    // active concurrent writers are not touched. A pending segment is never inspected as committed.
    for (const name of readdirSync(this.directory).filter(name => /^\d{13}-[0-9a-f-]{36}\.pending$/.test(name))) {
      const path = join(this.directory, name);
      try {
        noLinkFile(path);
        if (Date.now() - statSync(path).mtimeMs > 60 * 60 * 1000) unlinkSync(path);
      } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
    }
    syncDirectory(this.directory);
  }
  append(reason: ClassPReason, detail: string, context: ClassPContext): JournalOutcome {
    let pending: string | undefined;
    let published = false;
    const id = `${Date.now()}-${randomUUID()}`;
    try {
      checkDirectory(this.directory);
      const envelope = context.envelope;
      const at = new Date().toISOString();
      const record: ClassPRecord = {
        formatVersion: 1, id, at,
        process: { pid: process.pid, instanceId, initializedAt, nodeVersion: process.version, platform: process.platform },
        build: this.build, reason, detail: safeDetail(reason, detail),
        protocolVersion: typeof envelope?.v === 'number' && Number.isSafeInteger(envelope.v) && envelope.v >= 0 && envelope.v <= 0xffffffff ? envelope.v : null,
        operation: typeof envelope?.op === 'string' && OP.test(envelope.op) ? envelope.op : null,
        requestIdSha256: typeof envelope?.requestId === 'string' ? sha(envelope.requestId) : null,
        requestIdType: envelope?.requestIdType ?? 'unavailable',
        connection: { id: context.connectionId, connectedAt: context.connectedAt, refusedAt: at, settlement: context.settlement },
        frame: context.frame, durableWrite: 'published-after-file-fsync',
      };
      const data = Buffer.from(JSON.stringify(record) + '\n');
      if (data.length > MAX_RECORD_BYTES) throw new Error('diagnostic record cap exceeded');
      pending = join(this.directory, id + '.pending');
      const fd = openSync(pending, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL, 0o600);
      try {
        let offset = 0;
        while (offset < data.length) offset += writeSync(fd, data, offset, data.length - offset);
        this.options.testBeforeSync?.();
        fsyncSync(fd);
      } finally { closeSync(fd); }
      renameSync(pending, join(this.directory, id + '.json'));
      pending = undefined; published = true;
      this.prune();
      return { status: 'persisted', recordId: id };
    } catch (error) {
      if (pending) { try { unlinkSync(pending); } catch { /* Only this writer's own temporary segment. */ } }
      this.failures++;
      const outcome: JournalOutcome = { status: published ? 'persisted_with_failure' : 'failed', code: errorCode(error), ...(published ? { recordId: id } : {}) };
      const notice = { event: 'IPD_CLASS_P_JOURNAL_FAILURE', pid: process.pid, code: outcome.code!, status: outcome.status };
      try {
        if (this.options.onFailure) this.options.onFailure(notice);
        else process.stderr.write(JSON.stringify(notice) + '\n');
      } catch { /* Counter and caller's in-memory outcome remain available even if stderr is broken. */ }
      return outcome;
    }
  }
}

/** Treat even owner-local journal files as untrusted input in the viewer. */
function validateRecord(value: ClassPRecord): void {
  const shape = (object: unknown, keys: string[]): void => {
    if (!object || typeof object !== 'object' || Array.isArray(object) || Object.keys(object).some(key => !keys.includes(key))) throw new Error('invalid object');
  };
  const text = (value: unknown, pattern: RegExp): void => { if (typeof value !== 'string' || !pattern.test(value)) throw new Error('invalid field'); };
  const time = (value: unknown): void => text(value, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/);
  const uuid = /^[a-f0-9-]{36}$/;
  const integer = (value: unknown): void => { if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw new Error('invalid number'); };
  shape(value, ['formatVersion','id','at','process','build','reason','detail','protocolVersion','operation','requestIdSha256','requestIdType','connection','frame','durableWrite']);
  time(value.at);
  shape(value.process, ['pid','instanceId','initializedAt','nodeVersion','platform']);
  integer(value.process.pid); text(value.process.instanceId,uuid); time(value.process.initializedAt);
  text(value.process.nodeVersion,/^v[0-9]+\.[0-9]+\.[0-9]+(?:[-.][a-zA-Z0-9.]+)?$/);
  if (!['aix','darwin','freebsd','linux','openbsd','sunos','win32','android','netbsd','haiku','cygwin'].includes(value.process.platform)) throw new Error('invalid platform');
  shape(value.build, ['provenance','files']);
  if (value.build.provenance !== 'initialization-file-hashes-not-proof-of-loaded-bytes') throw new Error('invalid build provenance');
  shape(value.build.files,['classPJournal.js','entrypoint.js','dispatch.js','protocol.js']);
  for (const hash of Object.values(value.build.files)) text(hash,/^[a-f0-9]{64}$/);
  if (value.protocolVersion !== null) { integer(value.protocolVersion); if (value.protocolVersion > 0xffffffff) throw new Error('invalid version'); }
  if (value.operation !== null) text(value.operation,OP);
  if (!['unavailable','undefined','string','number','boolean','object','array','null'].includes(value.requestIdType)) throw new Error('invalid request type');
  shape(value.connection,['id','connectedAt','refusedAt','settlement']);
  text(value.connection.id,uuid); time(value.connection.connectedAt); time(value.connection.refusedAt);
  if (!['half-close-required','flush-guard'].includes(value.connection.settlement)) throw new Error('invalid settlement');
  shape(value.frame,['receivedBytes','declaredBodyBytes','firstByteAt','lastByteAt','endedAt','transportError']);
  if (value.frame.receivedBytes !== undefined) integer(value.frame.receivedBytes);
  if (value.frame.declaredBodyBytes !== undefined) integer(value.frame.declaredBodyBytes);
  for (const at of [value.frame.firstByteAt,value.frame.lastByteAt,value.frame.endedAt]) if (at !== undefined) time(at);
  if (value.frame.transportError !== undefined && typeof value.frame.transportError !== 'boolean') throw new Error('invalid transport flag');
  if (value.durableWrite !== 'published-after-file-fsync') throw new Error('invalid outcome');
}

/** Read-only, bounded inspection. Never creates a directory, prunes, drains, or imports the server. */
export function inspectClassPJournal(directory: string): { records: ClassPRecord[]; issues: string[] } {
  checkDirectory(directory);
  const records: ClassPRecord[] = [];
  const issues: string[] = [];
  for (const name of recordFiles(directory).slice(-256)) {
    const path = join(directory, name);
    try {
      noLinkFile(path);
      const record = JSON.parse(readFileSync(path, 'utf8')) as ClassPRecord;
      // Validate against an allowlisted shape before emitting untrusted disk contents.
      if (record.formatVersion !== 1 || record.id !== name.slice(0,-5) || !REASONS.includes(record.reason) || record.detail !== safeDetail(record.reason as ClassPReason, record.detail)) throw new Error('invalid record');
      validateRecord(record);
      if (record.requestIdSha256 !== null && !/^[a-f0-9]{64}$/.test(record.requestIdSha256)) throw new Error('invalid correlation hash');
      records.push(record);
    } catch (error) { issues.push(`${name}:${(error as NodeJS.ErrnoException).code === 'ENOENT' ? 'ROTATED_DURING_READ' : 'UNREADABLE_OR_INVALID_RECORD'}`); }
  }
  return { records, issues };
}
