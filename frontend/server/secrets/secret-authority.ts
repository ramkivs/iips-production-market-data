/**
 * Program v3.0 — Secret-Management Authority (local-dev realization — SM1–SM10).
 *
 * Binding: TD-5b2 = TD-5b2a (governed service-account credential) · SM1–SM10 ACCEPTED ·
 * local-dev realization APPROVED via the TD-7a pattern (env-var-configured, gitignored,
 * server-owned, OS-permission-scoped / 0600-style, no vendor/dependency, injectable tests).
 *
 * This is an AUTHORITY MODULE ONLY. It is NOT consumed by the Keycloak sync path yet
 * (TD-5c + the actual Keycloak integration remain PENDING). No production secret topology,
 * external secret manager, or vendor is introduced.
 *
 * Contract conformance:
 *   SM1 storage       — two server-side stores: env-var (read-only) and a gitignored
 *                       0600 JSON file under the TD-7a data directory.
 *   SM2 server-only   — this module lives under frontend/server/ (never imported by the
 *                       browser); no read path exposes the secret VALUE.
 *   SM3 least-priv    — a `scope` string is recorded per secret; the value is only handed
 *                       to a server-side callback via useSecret() (never retained by callers).
 *   SM4 rotation      — rotate() stamps `rotatedAt` from the clock and invalidates the old value.
 *   SM5 expiry        — `notAfter` (ISO-8601 UTC) checked against the clock; expired → fail closed.
 *   SM6 fail-closed   — missing/expired/empty value ⇒ SecretAuthorityError; NEVER a default or
 *                       dev-credential fallback.
 *   SM7 audit         — optional audit callback; events carry name/scope/at but NEVER the value.
 *   SM8 local-dev     — env-var + 0600 file under the data dir (`.iips-data/` is already gitignored).
 *   SM9 offline tests — injectable store + clock; no network.
 *   SM10 no leakage   — the value never appears in errors, logs, audit events, or the file handle.
 */
import path from 'node:path';

export type SecretStatus = 'valid' | 'expired' | 'missing';

export type SecretAuthorityErrorCode =
  | 'SECRET_MISSING'
  | 'SECRET_EXPIRED'
  | 'SECRET_INVALID'
  | 'SECRET_STORE_FAILURE';

export class SecretAuthorityError extends Error {
  constructor(readonly code: SecretAuthorityErrorCode, message: string) {
    super(message);
    this.name = 'SecretAuthorityError';
  }
}

/** A stored secret (server-side only). `value` is intentionally NOT part of any handle. */
export interface SecretRecord {
  readonly value: string;
  readonly scope: string;
  readonly rotatedAt: string | null;
  readonly notAfter: string | null;
}

/** Storage seam. Implementations MUST NOT log the value. */
export interface SecretStore {
  read(name: string): SecretRecord | null;
  write(name: string, record: SecretRecord): void;
}

/** Audit event — deliberately excludes the secret value. */
export interface SecretAuditEvent {
  readonly event: 'provision' | 'rotate' | 'use';
  readonly name: string;
  readonly scope: string;
  readonly outcome: 'granted' | 'missing' | 'expired' | 'invalid';
  readonly at: string;
}

/** Secret metadata handle — never contains the value. */
export interface SecretHandle {
  readonly name: string;
  readonly scope: string;
  readonly status: SecretStatus;
  readonly rotatedAt: string | null;
  readonly notAfter: string | null;
}

export interface SecretAuthorityOptions {
  readonly store: SecretStore;
  /** Default scope recorded for secrets rotated without an explicit scope. */
  readonly scope?: string;
  /** Clock returning ISO-8601 UTC (default: system wall clock). */
  readonly clock?: () => string;
  readonly audit?: (event: SecretAuditEvent) => void;
}

export class SecretAuthority {
  private readonly store: SecretStore;
  private readonly defaultScope: string;
  private readonly clock: () => string;
  private readonly audit: (event: SecretAuditEvent) => void;

  constructor(opts: SecretAuthorityOptions) {
    this.store = opts.store;
    this.defaultScope = opts.scope ?? 'unscoped';
    this.clock = opts.clock ?? (() => new Date().toISOString());
    this.audit = opts.audit ?? (() => {});
  }

  /** Metadata only — never the value. */
  handle(name: string): SecretHandle {
    const record = this.store.read(name);
    if (!record) return { name, scope: this.defaultScope, status: 'missing', rotatedAt: null, notAfter: null };
    const status = this.statusOf(record);
    return { name, scope: record.scope, status, rotatedAt: record.rotatedAt, notAfter: record.notAfter };
  }

  /**
   * Resolve the secret value ONLY inside the server-side callback `fn`. Fail-closed:
   * missing/expired/empty value throws; nothing is returned or retained beyond `fn`.
   */
  async useSecret<T>(name: string, fn: (value: string) => T | Promise<T>): Promise<T> {
    const record = this.store.read(name);
    if (!record || record.value === '') {
      this.audit({ event: 'use', name, scope: record?.scope ?? this.defaultScope, outcome: 'missing', at: this.clock() });
      throw new SecretAuthorityError('SECRET_MISSING', `secret '${name}' is not available`);
    }
    const status = this.statusOf(record);
    if (status === 'expired') {
      this.audit({ event: 'use', name, scope: record.scope, outcome: 'expired', at: this.clock() });
      throw new SecretAuthorityError('SECRET_EXPIRED', `secret '${name}' is expired`);
    }
    this.audit({ event: 'use', name, scope: record.scope, outcome: 'granted', at: this.clock() });
    return fn(record.value);
  }

  /** Rotate (or first-provision) a secret; stamps rotatedAt; old value is invalidated. */
  rotate(name: string, value: string, opts: { readonly notAfter?: string | null; readonly scope?: string } = {}): SecretHandle {
    if (typeof value !== 'string' || value === '') {
      throw new SecretAuthorityError('SECRET_INVALID', `secret '${name}' requires a non-empty value`);
    }
    const existing = this.store.read(name);
    const scope = opts.scope ?? existing?.scope ?? this.defaultScope;
    const record: SecretRecord = {
      value,
      scope,
      rotatedAt: this.clock(),
      notAfter: opts.notAfter ?? null,
    };
    this.store.write(name, record);
    this.audit({ event: existing ? 'rotate' : 'provision', name, scope, outcome: 'granted', at: this.clock() });
    return this.handle(name);
  }

  private statusOf(record: SecretRecord): SecretStatus {
    if (record.value === '') return 'missing';
    if (record.notAfter && this.clock() >= record.notAfter) return 'expired';
    return 'valid';
  }
}

// --- Built-in local-dev stores (TD-7a pattern) ---------------------------------

export interface EnvSecretSpec {
  readonly valueVar: string;
  readonly scope: string;
  readonly rotatedAtVar?: string;
  readonly notAfterVar?: string;
}

/**
 * Read-only env-var store. No default/fallback value is EVER used (SM6/SM10).
 */
export class EnvSecretStore implements SecretStore {
  constructor(private readonly env: NodeJS.ProcessEnv, private readonly specs: Readonly<Record<string, EnvSecretSpec>>) {}

  read(name: string): SecretRecord | null {
    const spec = this.specs[name];
    if (!spec) return null;
    const value = this.env[spec.valueVar];
    if (value === undefined || value === '') return null;
    return {
      value,
      scope: spec.scope,
      rotatedAt: this.env[spec.rotatedAtVar ?? ''] ?? null,
      notAfter: this.env[spec.notAfterVar ?? ''] ?? null,
    };
  }

  write(): void {
    throw new SecretAuthorityError('SECRET_STORE_FAILURE', 'env store is read-only; use the file store to rotate');
  }
}

export interface SecretFs {
  existsSync(p: string): boolean;
  mkdirSync(p: string, opts: { recursive: boolean; mode?: number }): void;
  readFileSync(p: string, encoding: 'utf8'): string;
  writeFileSync(p: string, data: string, opts?: { mode?: number }): void;
}

import * as nodeFs from 'node:fs';

/**
 * Gitignored 0600 JSON file store under <dataDir>/secrets/ (inside the already-gitignored
 * TD-7a data directory). Server-owned; OS-permission-scoped.
 */
export class FileSecretStore implements SecretStore {
  constructor(private readonly dataDir: string, private readonly fs: SecretFs = nodeFs as unknown as SecretFs) {}

  private pathFor(name: string): string {
    return path.join(this.dataDir, 'secrets', `${name}.json`);
  }

  read(name: string): SecretRecord | null {
    const p = this.pathFor(name);
    if (!this.fs.existsSync(p)) return null;
    try {
      const parsed = JSON.parse(this.fs.readFileSync(p, 'utf8')) as Partial<SecretRecord>;
      if (typeof parsed?.value !== 'string' || typeof parsed?.scope !== 'string') {
        throw new SecretAuthorityError('SECRET_INVALID', `secret '${name}' file is malformed`);
      }
      return {
        value: parsed.value,
        scope: parsed.scope,
        rotatedAt: parsed.rotatedAt ?? null,
        notAfter: parsed.notAfter ?? null,
      };
    } catch (e) {
      if (e instanceof SecretAuthorityError) throw e;
      throw new SecretAuthorityError('SECRET_INVALID', `secret '${name}' file is unreadable/malformed`);
    }
  }

  write(name: string, record: SecretRecord): void {
    try {
      const dir = path.join(this.dataDir, 'secrets');
      this.fs.mkdirSync(dir, { recursive: true });
      this.fs.writeFileSync(this.pathFor(name), JSON.stringify(record), { mode: 0o600 });
    } catch (e) {
      throw new SecretAuthorityError('SECRET_STORE_FAILURE', `secret '${name}' write failed: ${String(e)}`);
    }
  }
}
