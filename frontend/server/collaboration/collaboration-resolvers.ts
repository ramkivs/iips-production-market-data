/**
 * UI10 — server-side governed-object and roster resolvers.
 *
 * Authority: D83 (UI10 Collaboration recovery).
 *
 * INT-013 requires collaboration to reference **governed IIPS objects, never raw provider
 * records**, with validation = *object/reference integrity*. These resolvers are the enforcement
 * point: they answer "does this governed object exist for THIS principal in THIS tenant?" and
 * "is this user a member of THIS tenant?" using the platform's own authorities.
 *
 * ⚠ Both answers are computed SERVER-SIDE from the authenticated principal. Nothing here trusts
 *   a client-supplied identity, and a failed resolution makes the caller fail closed (404)
 *   rather than store a free-text reference.
 *
 * ⚠ No raw provider surface is reachable: the governed object kinds are a CLOSED set and each is
 *   resolved against a governed source — the certified universe, or an owner-scoped journal.
 *
 * ⚠ M-5/G3 boundary: membership is read from the EXISTING `RosterDirectory` journal that the IdP
 *   sync already populates. No identity/session semantics are introduced, and
 *   `roster-directory.ts` is NOT modified.
 */
import {
  DIRECTORY_OWNER,
  DIRECTORY_TENANT,
  type DirectorySnapshot,
} from '../directory/roster-directory';
import { PersistenceService, resolveDataDir } from '../persistence/persistence-service';
import type { CollaborationResolvers, GovernedRef } from './collaboration-service';

/** A governed security/company identity provider — supplied so tests need no CSIP run. */
export type GovernedIdProvider = () => readonly string[];

/**
 * Enabled members of exactly one tenant, read from the authoritative directory snapshot.
 *
 * `RosterDirectory` exposes only `adminsOf()`, which is too narrow for mentions (analysts and
 * viewers must be mentionable). Rather than modify that accepted module, the snapshot it already
 * persists is read READ-ONLY here through its exported constants.
 *
 * FAIL-CLOSED: no sync → no members → every mention and assignment is rejected.
 */
export function tenantMembersFrom(store: PersistenceService, tenantId: string): readonly string[] {
  const records = store.listOrdered(DIRECTORY_TENANT, DIRECTORY_OWNER);
  if (records.length === 0) return Object.freeze([]);
  const snapshot = records[0].payload as DirectorySnapshot;
  const users = snapshot.tenants?.[tenantId] ?? [];
  return Object.freeze(users.filter((u) => u.enabled).map((u) => u.userId).sort());
}

/**
 * Build resolvers for one authenticated principal.
 *
 * `ownerUserId` is the SERVER-RESOLVED principal: `watchlist` and `report` references therefore
 * resolve only against that principal's own owner-scoped journals, so a user can never cite
 * another user's — or another tenant's — artefacts.
 *
 * `governedIds` supplies the certified governed company/evidence identities.
 */
export function buildCollaborationResolversFor(
  ownerUserId: string,
  governedIds: GovernedIdProvider,
  deps: {
    readonly directoryStore?: PersistenceService;
    readonly watchlistsStore?: PersistenceService;
    readonly reportsStore?: PersistenceService;
  } = {},
): CollaborationResolvers {
  const directoryStore = deps.directoryStore ?? new PersistenceService({ dataDir: resolveDataDir() });

  return {
    tenantMembers(tenantId: string): readonly string[] {
      return tenantMembersFrom(directoryStore, tenantId);
    },

    async resolveObject(tenantId: string, ref: GovernedRef): Promise<boolean> {
      if (ref.kind === 'evidence' || ref.kind === 'company') {
        // Governed sector identities from the certified universe — never a provider record.
        return governedIds().includes(ref.id);
      }
      if (ref.kind === 'watchlist') {
        const wl = await import('../watchlists/watchlists-service');
        const store = deps.watchlistsStore ?? wl.getWatchlistsPersistence();
        return wl.readWatchlist(tenantId, ownerUserId, ref.id, store) !== undefined;
      }
      if (ref.kind === 'report') {
        const rp = await import('../reports/reports-service');
        const store = deps.reportsStore ?? rp.getReportsPersistence();
        return rp.readReport(tenantId, ownerUserId, ref.id, store) !== undefined;
      }
      return false;
    },
  };
}
