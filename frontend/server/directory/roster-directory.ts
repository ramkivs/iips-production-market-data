/**
 * Program v3.0 — PF-2 Governed Platform Directory (tenant-admin roster) — Option A (TD-4).
 *
 * AUTHORITY MODULE ONLY — server-side; NO HTTP endpoint, NO admin UI, NO client API (TD-6).
 *
 * Binding decisions implemented:
 *   TD-4  Option A governed platform directory
 *   TD-8  TD-8a authoritative IdP seed/sync (the CALLER's sync populates this directory)
 *   TD-5c whole-snapshot replacement (each sync = one new authoritative snapshot record)
 *   TD-6  server-internal-only roster-query authorization (tenant-scoped, fail-closed)
 *
 * Semantics:
 *  - Persistence: the promoted PF-1 `PersistenceService` is the ONLY persistence authority.
 *    Each snapshot is appended as ONE PF-1 record (tenantId = DIRECTORY_TENANT, owner =
 *    DIRECTORY_OWNER, dedupKey = snapshot.syncId). The CURRENT snapshot is the newest record;
 *    the index is rebuilt from the journal on restart.
 *  - Whole-snapshot replacement: `applySnapshot()` writes a fresh authoritative snapshot; the
 *    previous one is superseded (IdP-wins — the snapshot IS the IdP state). A failed sync
 *    never calls applySnapshot, so the last successful snapshot remains authoritative
 *    (no half-authoritative state).
 *  - Identity: server-derived only. userId/tenantId come from the authoritative snapshot;
 *    records/timestamps/sequence are PF-1 server-stamped. Never client-supplied, never
 *    observed-login-derived.
 *  - Roles: governed vocabulary only (GOVERNED_ROLES). "Admins of tenant X" =
 *    enabled users whose roles include ADMIN_ROLE ('iips-admin').
 *  - Disabled users are excluded from enumeration.
 *  - Fail-closed: `adminsOf()` throws RosterError('NO_SYNC') when no successful snapshot
 *    exists (never returns "no admins" for a directory that was never synced).
 *  - Tenant isolation: `adminsOf(tenantId)` returns ONLY that tenant's users; there is no
 *    cross-tenant enumeration path in the API.
 */
import { randomUUID } from 'node:crypto';
import { PersistenceService } from '../persistence/persistence-service';

/** Directory-internal PF-1 scope keys (the directory owns these; no other consumer uses them). */
export const DIRECTORY_TENANT = '__system__';
export const DIRECTORY_OWNER = '__directory__';

/** Governed role vocabulary (mirrors the Keycloak realm roles of the provisioning contract). */
export const ADMIN_ROLE = 'iips-admin';
export const GOVERNED_ROLES = ['iips-admin', 'iips-analyst', 'iips-viewer'] as const;

export interface DirectoryUser {
  readonly userId: string;
  readonly roles: readonly string[];
  readonly enabled: boolean;
}

/** The authoritative persisted snapshot shape. */
export interface DirectorySnapshot {
  readonly syncId: string;
  readonly syncedAt: string;
  readonly realm: string;
  readonly tenants: Readonly<Record<string, readonly DirectoryUser[]>>;
}

/** Minimal shape the caller supplies per user (IdP-reader output). */
export interface DirectoryUserInput {
  readonly userId: string;
  readonly tenantId: string;
  readonly roles: readonly string[];
  readonly enabled: boolean;
}

export type RosterErrorCode = 'NO_SYNC';

export class RosterError extends Error {
  constructor(readonly code: RosterErrorCode, message: string) {
    super(message);
    this.name = 'RosterError';
  }
}

export interface RosterDirectoryOptions {
  readonly persistence: PersistenceService;
  readonly clock?: () => string;
}

export class RosterDirectory {
  private readonly persistence: PersistenceService;
  private readonly clock: () => string;
  private latest: DirectorySnapshot | null = null;

  constructor(opts: RosterDirectoryOptions) {
    this.persistence = opts.persistence;
    this.clock = opts.clock ?? (() => new Date().toISOString());
    this.load();
  }

  /**
   * Whole-snapshot replacement (TD-5c): build the tenant-partitioned snapshot from the
   * authoritative IdP user list and append it as the new authority. IdP-wins: any previous
   * state is superseded. Idempotent for the same syncId (PF-1 dedup → single record).
   */
  applySnapshot(input: {
    readonly syncId?: string;
    readonly syncedAt?: string;
    readonly realm: string;
    readonly users: readonly DirectoryUserInput[];
  }): DirectorySnapshot {
    const tenants: Record<string, DirectoryUser[]> = {};
    for (const u of input.users) {
      if (!u.tenantId) continue; // a user with no tenant attribute is not rosterable
      const roles = u.roles.filter((r) => (GOVERNED_ROLES as readonly string[]).includes(r));
      (tenants[u.tenantId] ??= []).push({ userId: u.userId, roles, enabled: u.enabled });
    }
    const snapshot: DirectorySnapshot = {
      syncId: input.syncId ?? randomUUID(),
      syncedAt: input.syncedAt ?? this.clock(),
      realm: input.realm,
      tenants,
    };
    this.persistence.append({
      tenantId: DIRECTORY_TENANT,
      ownerUserId: DIRECTORY_OWNER,
      dedupKey: snapshot.syncId,
      payload: snapshot,
    });
    this.latest = snapshot;
    return snapshot;
  }

  /**
   * Server-internal roster query (TD-6): enabled admins of exactly ONE tenant.
   * Fail-closed when no successful sync exists. Never crosses tenants; recipients are
   * derived from the authoritative snapshot (never client-selected).
   */
  adminsOf(tenantId: string): string[] {
    if (!this.latest) {
      throw new RosterError('NO_SYNC', 'no successful directory sync exists — roster unavailable');
    }
    const users = this.latest.tenants[tenantId] ?? [];
    return users
      .filter((u) => u.enabled && u.roles.includes(ADMIN_ROLE))
      .map((u) => u.userId)
      .sort();
  }

  /** Freshness marker (TD-5 S13): the last successful sync's syncedAt, or null if never synced. */
  syncedAt(): string | null {
    return this.latest?.syncedAt ?? null;
  }

  hasSynced(): boolean {
    return this.latest !== null;
  }

  /** Rebuild the current snapshot from the journal (journal is the authority). */
  private load(): void {
    const records = this.persistence.listOrdered(DIRECTORY_TENANT, DIRECTORY_OWNER);
    if (records.length > 0) {
      this.latest = records[0].payload as DirectorySnapshot;
    }
  }
}
