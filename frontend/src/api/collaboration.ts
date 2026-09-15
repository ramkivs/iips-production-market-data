/**
 * UI10 — typed API client for the governed Collaboration surface.
 *
 * Authority: D83 (UI10 Collaboration recovery). Requirement: INT-013 / D4_01 / D4_03.
 *
 * Mirrors the server contract 1:1 — no derivation, no transformation, no client-side authority.
 *
 * Recorded constraints reflected here:
 *   - Tenant and author are SERVER-DERIVED. The client never supplies identity.
 *   - References name a governed object KIND + ID only; the server resolves existence and
 *     ownership. An unresolved reference is rejected (404), never stored.
 *   - Mentions are resolved against the tenant roster server-side.
 *   - NS-5: the pinned vintage is assigned by the server at authoring time; the client cannot
 *     choose a vintage and cannot author against a historical one.
 */
import { authFetch } from './authFetch';

export type ObjectKind = 'evidence' | 'company' | 'watchlist' | 'report';

export interface GovernedRef {
  readonly kind: ObjectKind;
  readonly id: string;
}

export interface PinnedVintage {
  readonly dataVersion: string;
  readonly asOf: string;
  readonly mode: string;
}

export interface CommentView {
  readonly commentId: string;
  readonly text: string;
  readonly authorUserId: string;
  readonly createdAt: string;
  readonly mentions: readonly string[];
  readonly references: readonly GovernedRef[];
  readonly pinnedVintage: PinnedVintage;
  /** Stamped by the accepted P13 `buildCollaborationView` (NS-5). */
  readonly _pinnedVintage: PinnedVintage;
}

export interface Assignment {
  readonly assigneeUserId: string;
  readonly assignedBy: string;
  readonly assignedAt: string;
}

export interface ActivityEntry {
  readonly kind: string;
  readonly actorUserId: string;
  readonly at: string;
  readonly detail: string;
}

export interface VintageStatus {
  readonly matchesCurrent: boolean;
  readonly pinned: PinnedVintage;
  readonly current: PinnedVintage;
  readonly disclosure: string;
}

export interface CollaborationScope {
  readonly ns5: string;
  readonly vintageAvailability: string;
  readonly referenceIntegrity: string;
  readonly sharing: string;
}

export interface ThreadView {
  readonly surfaceName: string;
  readonly disposition: string;
  readonly threadId: string;
  readonly subject: GovernedRef;
  readonly createdBy: string;
  readonly createdAt: string;
  readonly pinnedVintage: PinnedVintage;
  readonly comments: readonly CommentView[];
  readonly totalComments: number;
  readonly assignment: Assignment | null;
  readonly activity: readonly ActivityEntry[];
  readonly vintageStatus: VintageStatus;
  readonly scope: CollaborationScope;
}

export interface CollaborationProvenance {
  readonly dataSource: string;
  readonly asOf: string;
  readonly dataVersion: string;
  readonly mode: string;
  readonly freshness: string;
  readonly authority: string;
  readonly transportSemantics: string;
}

export interface CollaborationEnvelope {
  readonly data: readonly ThreadView[];
  readonly objectKinds: readonly ObjectKind[];
  readonly scope: CollaborationScope;
  readonly provenance: CollaborationProvenance;
}

export async function fetchThreads(): Promise<CollaborationEnvelope> {
  const res = await authFetch('/api/collaboration');
  if (!res.ok) throw new Error(`collaboration request failed: ${res.status}`);
  return (await res.json()) as CollaborationEnvelope;
}

export async function createThread(threadId: string, subject: GovernedRef): Promise<void> {
  const res = await authFetch('/api/collaboration', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ threadId, subject }),
  });
  if (!res.ok) throw new Error(`create thread failed: ${res.status}`);
}

export async function deleteThread(threadId: string): Promise<void> {
  const res = await authFetch(`/api/collaboration/${encodeURIComponent(threadId)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`delete thread failed: ${res.status}`);
}

export async function addComment(
  threadId: string,
  text: string,
  mentions: readonly string[] = [],
  references: readonly GovernedRef[] = [],
): Promise<void> {
  const res = await authFetch(`/api/collaboration/${encodeURIComponent(threadId)}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, mentions, references }),
  });
  if (!res.ok) throw new Error(`add comment failed: ${res.status}`);
}

export async function assignThread(threadId: string, assigneeUserId: string): Promise<void> {
  const res = await authFetch(`/api/collaboration/${encodeURIComponent(threadId)}/assignment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assigneeUserId }),
  });
  if (!res.ok) throw new Error(`assign failed: ${res.status}`);
}
