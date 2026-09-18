/**
 * Program v3.0 — PF-2 IdP seed/sync (TD-8a) — Keycloak Admin REST read-only transport +
 * whole-snapshot sync operation.
 *
 * Binding decisions implemented:
 *   TD-8a  authoritative IdP seed/sync (one-way: IdP → platform directory; IdP-wins)
 *   TD-5b1 Keycloak Admin REST / admin-cli read-only transport class
 *   TD-5b2 governed service-account credential — consumed via the injected `getSecret`
 *          seam (wire it to the promoted SecretAuthority.useSecret; this module never
 *          creates credentials, never stores the secret, never logs it)
 *   TD-5b3 injectable mock IdP snapshot for offline tests (IdpReader interface)
 *   TD-5a  startup seed + operator-triggered manual sync — BOTH are the same whole-snapshot
 *          `syncDirectory` operation; the trigger WIRING (startup hook / admin endpoint) is a
 *          separate transport-integration step, NOT performed here (no scheduler/background
 *          worker, no HTTP surface)
 *   TD-5c  whole-snapshot replacement (no delta/change-tracking)
 *
 * Fail-closed: a failed read (token/users/roles/credential) propagates BEFORE applySnapshot,
 * so the directory's last successful snapshot remains authoritative (no half-state). Sync
 * lifecycle is audited via the injected `audit` callback (name/counts/outcome only — never
 * credentials or user data beyond counts).
 */
import { GOVERNED_ROLES, RosterDirectory } from './roster-directory';

export interface IdpUser {
  readonly userId: string;
  readonly tenantId: string;
  readonly roles: readonly string[];
  readonly enabled: boolean;
}

export interface IdpSnapshot {
  readonly realm: string;
  readonly users: readonly IdpUser[];
}

export interface IdpReader {
  readSnapshot(): Promise<IdpSnapshot>;
}

// --- Keycloak Admin REST (read-only) -------------------------------------------

export type SyncErrorCode = 'TOKEN_FAILED' | 'USERS_FAILED' | 'ROLES_FAILED' | 'SYNC_FAILED';

export class SyncError extends Error {
  constructor(readonly code: SyncErrorCode, message: string) {
    super(message);
    this.name = 'SyncError';
  }
}

interface KeycloakAdminUser {
  readonly id: string;
  readonly username?: string;
  readonly enabled?: boolean;
  readonly attributes?: { readonly tenant?: string | readonly string[] };
}

export interface KeycloakAdminReaderOptions {
  /** Keycloak origin, e.g. `http://localhost:8080` (no trailing slash). */
  readonly baseUrl: string;
  readonly realm: string;
  /** Service-account client id (client-credentials grant). */
  readonly clientId: string;
  /** Resolves the service-account secret (wire to SecretAuthority.useSecret). */
  readonly getSecret: () => Promise<string>;
  readonly fetchImpl?: typeof fetch;
}

export class KeycloakAdminReader implements IdpReader {
  private readonly baseUrl: string;
  private readonly realm: string;
  private readonly clientId: string;
  private readonly getSecret: () => Promise<string>;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: KeycloakAdminReaderOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/+$/, '');
    this.realm = opts.realm;
    this.clientId = opts.clientId;
    this.getSecret = opts.getSecret;
    this.fetchImpl = opts.fetchImpl ?? globalThis.fetch;
  }

  async readSnapshot(): Promise<IdpSnapshot> {
    const secret = await this.getSecret(); // missing/expired secret fails closed (caller authority)
    const token = await this.fetchAccessToken(secret);
    const users = await this.fetchUsers(token);
    const result: IdpUser[] = [];
    for (const u of users) {
      const tenantId = this.tenantOf(u);
      if (!tenantId) continue; // no tenant attribute → not rosterable
      const roles = await this.fetchRealmRoles(token, u.id);
      result.push({
        userId: typeof u.username === 'string' && u.username !== '' ? u.username : u.id,
        tenantId,
        roles: roles.filter((r) => (GOVERNED_ROLES as readonly string[]).includes(r)),
        enabled: u.enabled !== false,
      });
    }
    return { realm: this.realm, users: result };
  }

  private tenantOf(u: KeycloakAdminUser): string {
    const t = u.attributes?.tenant;
    if (typeof t === 'string') return t;
    if (Array.isArray(t) && t.length > 0) return t[0];
    return '';
  }

  private async fetchAccessToken(secret: string): Promise<string> {
    const url = `${this.baseUrl}/realms/${this.realm}/protocol/openid-connect/token`;
    const res = await this.fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'client_credentials', client_id: this.clientId, client_secret: secret }),
    });
    if (!res.ok) throw new SyncError('TOKEN_FAILED', `IdP token request returned ${res.status}`);
    const body = (await res.json()) as { access_token?: string };
    if (typeof body.access_token !== 'string' || body.access_token === '') {
      throw new SyncError('TOKEN_FAILED', 'IdP token response missing access_token');
    }
    return body.access_token;
  }

  private async fetchUsers(token: string): Promise<KeycloakAdminUser[]> {
    // briefRepresentation=false so each user carries its attributes (tenant).
    // v1 uses the IdP default page size; pagination beyond that is deferred.
    const url = `${this.baseUrl}/admin/realms/${this.realm}/users?briefRepresentation=false`;
    const res = await this.fetchImpl(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new SyncError('USERS_FAILED', `IdP users request returned ${res.status}`);
    return (await res.json()) as KeycloakAdminUser[];
  }

  private async fetchRealmRoles(token: string, userId: string): Promise<string[]> {
    const url = `${this.baseUrl}/admin/realms/${this.realm}/users/${encodeURIComponent(userId)}/role-mappings/realm`;
    const res = await this.fetchImpl(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new SyncError('ROLES_FAILED', `IdP role-mappings request returned ${res.status}`);
    const roles = (await res.json()) as Array<{ name?: string }>;
    return roles.map((r) => r.name ?? '').filter((n) => n !== '');
  }
}

// --- Sync operation (seed + manual share this) ----------------------------------

export interface SyncAuditEvent {
  readonly event: 'sync';
  readonly outcome: 'success' | 'failed';
  readonly syncId?: string;
  readonly realm?: string;
  readonly tenantCount?: number;
  readonly userCount?: number;
  readonly at: string;
}

export interface SyncResult {
  readonly syncId: string;
  readonly syncedAt: string;
  readonly realm: string;
  readonly tenantCount: number;
  readonly userCount: number;
}

/**
 * Whole-snapshot sync (TD-5c): read the authoritative IdP snapshot and replace the directory
 * state with it. This is the shared operation for BOTH authorized trigger contexts
 * (TD-5a startup seed and operator-triggered manual sync); the trigger wiring is a separate
 * transport-integration step. On any read failure the directory is left unchanged
 * (fail-closed / no half-authoritative state) and the failure is audited.
 */
export async function syncDirectory(opts: {
  readonly directory: RosterDirectory;
  readonly idp: IdpReader;
  readonly clock?: () => string;
  readonly audit?: (event: SyncAuditEvent) => void;
}): Promise<SyncResult> {
  const clock = opts.clock ?? (() => new Date().toISOString());
  try {
    const snap = await opts.idp.readSnapshot();
    const applied = opts.directory.applySnapshot({
      realm: snap.realm,
      users: snap.users,
    });
    const result: SyncResult = {
      syncId: applied.syncId,
      syncedAt: applied.syncedAt,
      realm: applied.realm,
      tenantCount: Object.keys(applied.tenants).length,
      userCount: snap.users.length,
    };
    opts.audit?.({
      event: 'sync',
      outcome: 'success',
      syncId: applied.syncId,
      realm: applied.realm,
      tenantCount: result.tenantCount,
      userCount: result.userCount,
      at: clock(),
    });
    return result;
  } catch (e) {
    opts.audit?.({ event: 'sync', outcome: 'failed', at: clock() });
    throw e instanceof SyncError ? e : new SyncError('SYNC_FAILED', `directory sync failed: ${String(e)}`);
  }
}
