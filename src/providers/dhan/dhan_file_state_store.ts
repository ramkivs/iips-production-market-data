/**
 * Institutional Investment Platform System (IIPS)
 * File-backed Dhan state store (W-23)
 *
 * Governed under: AD-17 (zero plaintext) / W-23
 *
 * A local, single-user JSON file under the existing data directory. Uses `node:fs` only —
 * deliberately NOT `src/persistence/**`, because the roadmap's W-23 exit criterion is a grep
 * assertion that `src/providers/dhan/**` imports nothing from `src/persistence/**` or
 * `src/ipc/**`. See `dhan_state_store.ts` for the port this implements.
 *
 * Two properties matter more than speed here:
 *
 *  1. **Atomic write.** The store is written to `<path>.<pid>.tmp` and renamed onto the
 *     target. A crash mid-write therefore leaves the previous store intact instead of a
 *     truncated file, which is what keeps the corrupt-store path exceptional rather than
 *     routine. `rename` within one directory is atomic on both NTFS and POSIX.
 *  2. **No throw escapes.** Every filesystem error is converted to a declared outcome, so a
 *     read-only directory or a full disk cannot stop the daemon booting.
 *
 * The store holds quote payloads and provider state — never credential material. The daemon
 * supplies the path; this module never invents one.
 */
import { existsSync, mkdirSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  DHAN_PERSISTED_STATE_MAX_BYTES,
  parseDhanPersistedState,
  type DhanPersistedState,
  type DhanStateLoadOutcome,
  type DhanStateSaveOutcome,
  type DhanStateStorePort,
} from './dhan_state_store.js';

export interface DhanFileStateStoreOptions {
  /** Absolute path of the JSON store. The caller owns path selection, not this module. */
  readonly path: string;
  /** Makes the store behave as absent and save as DISABLED. */
  readonly disabled?: boolean;
}

export class DhanFileStateStore implements DhanStateStorePort {
  private readonly path: string;
  private readonly disabled: boolean;

  constructor(options: DhanFileStateStoreOptions) {
    this.path = options.path;
    this.disabled = options.disabled === true;
  }

  public load(): DhanStateLoadOutcome {
    if (this.disabled) return { status: 'ABSENT' };
    try {
      if (!existsSync(this.path)) return { status: 'ABSENT' };
      // Size is checked before reading: a substituted multi-gigabyte file must not become an
      // unbounded read at start-up.
      const size = statSync(this.path).size;
      if (size > DHAN_PERSISTED_STATE_MAX_BYTES) return { status: 'CORRUPT', reason: 'TOO_LARGE' };
      const text = readFileSync(this.path, 'utf8');
      if (text.length > DHAN_PERSISTED_STATE_MAX_BYTES) return { status: 'CORRUPT', reason: 'TOO_LARGE' };

      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        return { status: 'CORRUPT', reason: 'INVALID_JSON' };
      }
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        const version = (parsed as Record<string, unknown>).schemaVersion;
        if (version !== undefined && version !== 1) return { status: 'CORRUPT', reason: 'SCHEMA_MISMATCH' };
      }
      const state = parseDhanPersistedState(parsed);
      if (!state) return { status: 'CORRUPT', reason: 'INVALID_SHAPE' };
      return { status: 'LOADED', state };
    } catch {
      // Deliberately no message: an error string can carry the path, and the path is not
      // something a diagnostics surface should echo.
      return { status: 'CORRUPT', reason: 'READ_ERROR' };
    }
  }

  public save(state: DhanPersistedState): DhanStateSaveOutcome {
    if (this.disabled) return { status: 'SKIPPED', reason: 'DISABLED' };
    let tempPath: string | null = null;
    try {
      const serialized = JSON.stringify(state);
      if (serialized.length > DHAN_PERSISTED_STATE_MAX_BYTES) return { status: 'SKIPPED', reason: 'TOO_LARGE' };
      mkdirSync(dirname(this.path), { recursive: true });
      tempPath = `${this.path}.${process.pid}.tmp`;
      writeFileSync(tempPath, serialized, { encoding: 'utf8', mode: 0o600 });
      renameSync(tempPath, this.path);
      tempPath = null;
      return { status: 'SAVED', bytes: serialized.length };
    } catch {
      // Best effort: never leave a partial temp file behind, never throw out of shutdown.
      if (tempPath !== null) {
        try {
          unlinkSync(tempPath);
        } catch {
          // The temp file is already gone or unreachable; nothing further to do.
        }
      }
      return { status: 'FAILED', reason: 'WRITE_ERROR' };
    }
  }
}
