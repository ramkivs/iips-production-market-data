/**
 * R-3 (D74) — SAVED-SCREEN DURABLE STORE (application/transport layer).
 *
 * Authority: D74 Program Authority implementation authorization, R-3 only.
 *
 * PURPOSE
 *   Give saved screen definitions durability across requests and process restarts by
 *   adapting the EXISTING governed `PersistenceService` (PF-1a → Class C filesystem
 *   journal → TD-2/TD-3/TD-7a). This module adds NO new persistence technology and NO
 *   vendor dependency.
 *
 * HARD BOUNDARIES (D74)
 *   ⚠ `p12/src/screenerContract.js` is NOT modified. The certified C6 contract still
 *     performs ALL definition validation and still produces the definition object. This
 *     module only stores what the contract already returned, AFTER validation.
 *   ⚠ Persistence lives in the transport/application layer, never in the accepted P12
 *     contract. C6/C7 certification scope is untouched.
 *   ⚠ `PersistenceService` itself is used UNCHANGED — this is a thin adapter over its
 *     published TD-2 primitives (`append` / `readById` / `listOrdered` / `exists`).
 *
 * SECURITY (TD-2 §5)
 *   `PersistenceService` is a library authority, NOT an HTTP/RBAC boundary. The CALLER
 *   must supply a server-resolved tenant and owner. This module therefore accepts
 *   `tenantId`/`ownerUserId` as already-authenticated values and never reads them from a
 *   request body or query string. Every read is tenant+owner scoped by the service, so a
 *   cross-tenant or cross-owner read returns nothing rather than another tenant's record.
 *
 * IDENTITY / DEDUP
 *   `dedupKey` is the caller's `screenId`. Re-saving the same `screenId` for the same
 *   tenant+owner is an idempotent no-op that returns the EXISTING record — matching the
 *   append-only journal model. Screen definitions are immutable once saved; this module
 *   exposes no update path.
 */
import { PersistenceService, resolveDataDir } from './persistence-service';

/** Namespace prefix so saved screens never collide with another consumer's dedup keys. */
const DEDUP_NAMESPACE = 'saved-screen';

export interface SavedScreenRecordView {
  readonly recordId: string;
  readonly screenId: string;
  readonly definition: unknown;
  readonly createdAt: string;
  readonly seq: number;
}

/** Process-wide singleton so every request shares one journal-backed instance. */
let singleton: PersistenceService | null = null;

/**
 * The shared saved-screen persistence instance.
 *
 * A fresh instance reconstructs its full state from the journal on construction, so a
 * server restart recovers previously saved definitions without any extra work here.
 */
export function savedScreensService(): PersistenceService {
  if (singleton === null) {
    singleton = new PersistenceService({ dataDir: resolveDataDir() });
  }
  return singleton;
}

/** Test/process-boundary seam: drop the cached instance so the next call re-reads the journal. */
export function resetSavedScreensService(): void {
  singleton = null;
}

function dedupKeyFor(screenId: string): string {
  return `${DEDUP_NAMESPACE}\u0000${screenId}`;
}

function toView(r: {
  recordId: string; dedupKey: string; payload: unknown; createdAt: string; seq: number;
}): SavedScreenRecordView {
  return Object.freeze({
    recordId: r.recordId,
    screenId: r.dedupKey.slice(DEDUP_NAMESPACE.length + 1),
    definition: r.payload,
    createdAt: r.createdAt,
    seq: r.seq,
  });
}

/**
 * Persist a definition that the certified C6 contract has ALREADY validated and built.
 *
 * @param tenantId    server-resolved tenant (never client-supplied)
 * @param ownerUserId server-resolved owner (never client-supplied)
 * @param screenId    the definition's screen identity (dedup identity)
 * @param definition  the frozen object returned by the certified contract, stored verbatim
 */
export function saveScreen(
  service: PersistenceService,
  tenantId: string,
  ownerUserId: string,
  screenId: string,
  definition: unknown,
): SavedScreenRecordView {
  const record = service.append({
    tenantId,
    ownerUserId,
    dedupKey: dedupKeyFor(screenId),
    payload: definition,
  });
  return toView(record);
}

/** All saved screens for this tenant+owner, in the service's governed deterministic order. */
export function listScreens(
  service: PersistenceService,
  tenantId: string,
  ownerUserId: string,
): readonly SavedScreenRecordView[] {
  return Object.freeze(service.listOrdered(tenantId, ownerUserId)
    .filter((r) => typeof r.dedupKey === 'string' && r.dedupKey.startsWith(`${DEDUP_NAMESPACE}\u0000`))
    .map(toView));
}

/**
 * One saved screen by record id, tenant+owner scoped.
 * Returns `undefined` for unknown records AND for records owned by another tenant/owner —
 * the caller maps that to 404, disclosing nothing about another tenant's data.
 */
export function readScreen(
  service: PersistenceService,
  tenantId: string,
  ownerUserId: string,
  recordId: string,
): SavedScreenRecordView | undefined {
  const r = service.readById(tenantId, ownerUserId, recordId);
  if (!r || typeof r.dedupKey !== 'string' || !r.dedupKey.startsWith(`${DEDUP_NAMESPACE}\u0000`)) return undefined;
  return toView(r);
}
