/**
 * UI10 (D83) — Collaboration surface component tests.
 *
 * Verifies thread/comment rendering, mentions, references, assignment, activity, NS-5 pinning
 * display, vintage-mismatch disclosure, the no-ACL scope statement, and that the client sends
 * only governed kind+id — never identity or a chosen vintage.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Collaboration } from './Collaboration';

const V1 = { dataVersion: 'v1.1-replay-baseline', asOf: '2026-08-09T00:00:00.000Z', mode: 'SNAPSHOT' };
const V2 = { dataVersion: 'v1.2', asOf: '2026-12-01T00:00:00.000Z', mode: 'SNAPSHOT' };

const SCOPE = {
  ns5: 'Every thread and comment pins the governed vintage in force when it was authored.',
  vintageAvailability: 'Authoring against an arbitrary historical vintage is NOT available. No historical vintage is fabricated.',
  referenceIntegrity: 'Threads reference ONLY governed IIPS objects resolved server-side.',
  sharing: 'Sharing is BY REFERENCE inside a thread. There is no object-level ACL.',
};

const PROVENANCE = {
  dataSource: 'governed:certified-v2.0-reference-universe',
  asOf: V1.asOf, dataVersion: V1.dataVersion, mode: 'SNAPSHOT',
  freshness: 'SNAPSHOT', authority: 'PLATFORM',
  transportSemantics: 'owner-scoped collaboration threads … NS-5 …',
};

function thread(overrides: Record<string, unknown> = {}) {
  return {
    surfaceName: 'UI10',
    disposition: 'NEW',
    threadId: 'T-1',
    subject: { kind: 'company', id: 'Banking' },
    createdBy: 'analyst-a',
    createdAt: '2026-09-15T00:00:00.000Z',
    pinnedVintage: V1,
    totalComments: 1,
    comments: [{
      commentId: 'c-1',
      text: 'Reviewed the trust chain',
      authorUserId: 'analyst-a',
      createdAt: '2026-09-15T00:00:00.000Z',
      mentions: ['viewer-a'],
      references: [{ kind: 'evidence', id: 'ev_Banking' }],
      pinnedVintage: V1,
      _pinnedVintage: V1,
    }],
    assignment: null,
    activity: [{ kind: 'thread-created', actorUserId: 'analyst-a', at: '2026-09-15T00:00:00.000Z', detail: 'thread opened' }],
    vintageStatus: { matchesCurrent: true, pinned: V1, current: V1, disclosure: 'pinned vintage matches the current governed vintage' },
    scope: SCOPE,
    ...overrides,
  };
}

function envelope(data: Record<string, unknown>[] = [thread()]) {
  return { data, objectKinds: ['evidence', 'company', 'watchlist', 'report'], scope: SCOPE, provenance: PROVENANCE };
}

function mockFetch(body: unknown) {
  return vi.fn((_url: string, _init?: { method?: string; body?: string }) =>
    Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) } as Response));
}

afterEach(() => { vi.restoreAllMocks(); });

describe('UI10 — Collaboration surface', () => {
  it('renders a thread attached to a governed object', async () => {
    vi.stubGlobal('fetch', mockFetch(envelope()));
    render(<Collaboration />);
    await waitFor(() => expect(screen.getByTestId('collaboration-surface')).toBeInTheDocument());
    expect(screen.getByTestId('thread-T-1')).toHaveTextContent('company: Banking');
  });

  it('offers only governed object kinds — no provider kind', async () => {
    vi.stubGlobal('fetch', mockFetch(envelope([])));
    render(<Collaboration />);
    await waitFor(() => expect(screen.getByTestId('thread-new-kind')).toBeInTheDocument());
    const opts = Array.from(screen.getByTestId('thread-new-kind').querySelectorAll('option')).map((o) => o.textContent);
    expect(opts).toEqual(['evidence', 'company', 'watchlist', 'report']);
  });

  it('renders a comment with its author, mentions and governed references', async () => {
    vi.stubGlobal('fetch', mockFetch(envelope()));
    render(<Collaboration />);
    await waitFor(() => expect(screen.getByTestId('comment-c-1')).toBeInTheDocument());
    const c = screen.getByTestId('comment-c-1');
    expect(c).toHaveTextContent('analyst-a');
    expect(c).toHaveTextContent('mentions viewer-a');
    expect(c).toHaveTextContent('refs evidence:ev_Banking');
  });

  it('shows the NS-5 pinned vintage on the thread and each comment', async () => {
    vi.stubGlobal('fetch', mockFetch(envelope()));
    render(<Collaboration />);
    await waitFor(() => expect(screen.getByTestId('vintage-T-1')).toBeInTheDocument());
    expect(screen.getByTestId('vintage-T-1')).toHaveTextContent(V1.asOf);
    expect(screen.getByTestId('comment-c-1')).toHaveTextContent(`pinned ${V1.asOf}`);
  });

  it('DISCLOSES a vintage mismatch instead of re-pinning', async () => {
    vi.stubGlobal('fetch', mockFetch(envelope([thread({
      vintageStatus: {
        matchesCurrent: false, pinned: V1, current: V2,
        disclosure: 'pinned vintage DIFFERS from the current governed vintage — the pinned vintage is recorded but is NOT retrievable, and the thread is not re-pinned',
      },
    })])));
    render(<Collaboration />);
    await waitFor(() => expect(screen.getByTestId('vintage-mismatch-T-1')).toBeInTheDocument());
    const text = screen.getByTestId('vintage-mismatch-T-1').textContent ?? '';
    expect(text).toMatch(/NOT retrievable/);
    expect(text).toMatch(/not re-pinned/);
    expect(screen.getByTestId('vintage-T-1')).toHaveTextContent('DIFFERS from current');
  });

  it('shows assignment state and the activity log', async () => {
    vi.stubGlobal('fetch', mockFetch(envelope([thread({
      assignment: { assigneeUserId: 'analyst-b', assignedBy: 'analyst-a', assignedAt: '2026-09-15T00:00:00.000Z' },
    })])));
    render(<Collaboration />);
    await waitFor(() => expect(screen.getByTestId('assignment-T-1')).toHaveTextContent('assigned to analyst-b'));
    expect(screen.getByTestId('activity-T-1')).toHaveTextContent('thread opened');
  });

  it('states the no-ACL and no-fabrication scope', async () => {
    vi.stubGlobal('fetch', mockFetch(envelope()));
    render(<Collaboration />);
    await waitFor(() => expect(screen.getByTestId('collaboration-scope')).toBeInTheDocument());
    const text = screen.getByTestId('collaboration-scope').textContent ?? '';
    expect(text).toMatch(/no object-level ACL/);
    expect(text).toMatch(/No historical vintage is fabricated/);
  });

  it('sends only governed kind+id when opening a thread — no identity, no vintage', async () => {
    const f = mockFetch(envelope([]));
    vi.stubGlobal('fetch', f);
    render(<Collaboration />);
    await waitFor(() => expect(screen.getByTestId('thread-create')).toBeInTheDocument());

    fireEvent.change(screen.getByTestId('thread-new-id'), { target: { value: 'T-9' } });
    fireEvent.change(screen.getByTestId('thread-new-subject'), { target: { value: 'Banking' } });
    fireEvent.click(screen.getByTestId('thread-create'));

    await waitFor(() => {
      const post = f.mock.calls.find((c) => c[1]?.method === 'POST');
      expect(post).toBeDefined();
      const sent = JSON.parse(post![1]!.body!) as Record<string, unknown>;
      expect(Object.keys(sent).sort()).toEqual(['subject', 'threadId']);
      expect(sent.subject).toEqual({ kind: 'company', id: 'Banking' });
      expect(JSON.stringify(sent)).not.toMatch(/tenant|owner|author|asOf|dataVersion/i);
    });
  });

  it('shows an empty state when no threads exist', async () => {
    vi.stubGlobal('fetch', mockFetch(envelope([])));
    render(<Collaboration />);
    await waitFor(() => expect(screen.getByText(/No collaboration threads yet/)).toBeInTheDocument());
  });

  it('surfaces a load failure rather than inventing threads', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({}) } as Response)));
    render(<Collaboration />);
    await waitFor(() => expect(screen.getByText(/collaboration request failed: 401/)).toBeInTheDocument());
    expect(screen.queryByTestId('collaboration-surface')).not.toBeInTheDocument();
  });
});
