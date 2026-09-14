/**
 * Program v3.0 — G-AI-IMPL: embedded AI Explanation component tests.
 *
 * Covers T3 (advisory-only presentation), T4 (loading / error / unavailable states) and
 * T8 (no forbidden computation or persistence).
 *
 * The component is presentation-only: it derives nothing, computes nothing and fabricates nothing.
 * No sector selector, no route and no navigation entry exist (D2/D3/D4).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AiExplanation } from './AiExplanation';
import type { AiAdvisoryDto } from '../../api/aiAdvisory';

const DTO: AiAdvisoryDto = {
  adviceId: 'A1B2C3D4',
  engineResultId: 'Banking',
  kind: 'explanation',
  text: 'This is a supplementary advisory explanation. It is not a certified engine result and does not alter the certified result.',
  grounded: true,
  nonAuthoritative: true,
  model: 'iips-deterministic-advisor',
  modelVersion: '1.0.0',
  engineResultRef: 'SNAP_F3F53B67',
  label: 'AI EXPLANATION ≠ CERTIFIED RESULT',
  freshness: 'SNAPSHOT',
  unavailable: ['timestamp', 'tenant', 'provider', 'confidence', 'citations', 'decision'],
};

function mockFetchOnce(body: unknown, status = 200) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as never;
}

beforeEach(() => {
  mockFetchOnce(DTO);
});

describe('T3 — advisory-only, non-authoritative presentation', () => {
  it('renders the canonical AI EXPLANATION badge and the adjacent ≠ CERTIFIED RESULT label (D7)', async () => {
    render(<AiExplanation sectorKey="Banking" />);
    expect(await screen.findByText('AI EXPLANATION ≠ CERTIFIED RESULT')).toBeInTheDocument();
    // The canonical AiBadge renders its own "AI EXPLANATION" label.
    expect(screen.getByTestId('badge-ai')).toBeInTheDocument();
    expect(screen.getByTestId('ai-explanation-label')).toHaveTextContent('AI EXPLANATION ≠ CERTIFIED RESULT');
  });

  it('renders the exact authorized advisory sentence verbatim (S2)', async () => {
    render(<AiExplanation sectorKey="Banking" />);
    expect(await screen.findByTestId('ai-explanation-text')).toHaveTextContent(
      'This is a supplementary advisory explanation. It is not a certified engine result and does not alter the certified result.',
    );
  });

  it('renders the governed fields and the canonical snapshot reference (SR-1)', async () => {
    render(<AiExplanation sectorKey="Banking" />);
    expect(await screen.findByTestId('ai-explanation-ref')).toHaveTextContent('SNAP_F3F53B67');
    expect(screen.getByText('explanation')).toBeInTheDocument();
    expect(screen.getByText('GROUNDED')).toBeInTheDocument();
    expect(screen.getByText(/iips-deterministic-advisor · 1\.0\.0/)).toBeInTheDocument();
  });

  it('lists the unavailable governed fields and never fabricates confidence or a decision', async () => {
    render(<AiExplanation sectorKey="Banking" />);
    expect(await screen.findByTestId('ai-explanation-unavailable')).toBeInTheDocument();
    expect(screen.getByText(/timestamp, tenant, provider, confidence, citations, decision/)).toBeInTheDocument();
    expect(screen.queryByText('Confidence')).not.toBeInTheDocument();
    expect(screen.queryByText(/BUY|SELL|HOLD/)).not.toBeInTheDocument();
  });

  it('states that AI is never a decision authority', async () => {
    render(<AiExplanation sectorKey="Banking" />);
    expect(await screen.findByText(/AI is never a decision authority/)).toBeInTheDocument();
  });

  it('contains NO sector selector — the host supplies the sector key (D2/D6)', async () => {
    const { container } = render(<AiExplanation sectorKey="Banking" />);
    await screen.findByTestId('ai-explanation');
    expect(container.querySelector('select')).toBeNull();
    expect(screen.queryByLabelText('Engine result')).not.toBeInTheDocument();
  });
});

describe('T4 — loading / error / unavailable states', () => {
  it('renders the canonical LoadingState while the advisory is in flight', () => {
    globalThis.fetch = vi.fn().mockReturnValue(new Promise(() => {})) as never;
    const { container } = render(<AiExplanation sectorKey="Banking" />);
    expect(container.querySelector('[data-testid="state-loading"], [data-testid="loading"]')).not.toBeNull();
    expect(screen.queryByTestId('ai-explanation')).toBeNull();
  });

  it('renders the canonical ErrorState on an advisory failure (S4)', async () => {
    mockFetchOnce({ error: 'advisory unavailable', code: 'advisory-unavailable' }, 503);
    render(<AiExplanation sectorKey="Banking" />);
    expect(await screen.findByTestId('state-error')).toBeInTheDocument();
    expect(screen.queryByTestId('ai-explanation')).toBeNull();
    // No fallback or fabricated advisory text is rendered.
    expect(screen.queryByText(/supplementary advisory explanation/)).not.toBeInTheDocument();
  });

  it('renders the canonical ErrorState for engine-result-not-completed (S4)', async () => {
    mockFetchOnce({ error: 'engine result not completed (FAILED)', code: 'engine-result-not-completed' }, 503);
    render(<AiExplanation sectorKey="Banking" />);
    expect(await screen.findByTestId('state-error')).toBeInTheDocument();
  });

  it('renders the canonical ErrorState for an unknown sector (pre-existing 404)', async () => {
    mockFetchOnce({ error: 'engine result not found: NotASector' }, 404);
    render(<AiExplanation sectorKey="NotASector" />);
    expect(await screen.findByTestId('state-error')).toBeInTheDocument();
  });

  it('keeps the governed-field UnavailableState distinct from advisory failure', async () => {
    render(<AiExplanation sectorKey="Banking" />);
    // Advisory succeeded, so the component renders AND still expresses the governed-field absence.
    expect(await screen.findByTestId('ai-explanation')).toBeInTheDocument();
    expect(screen.getByTestId('ai-explanation-unavailable')).toBeInTheDocument();
    expect(screen.queryByTestId('state-error')).toBeNull();
  });

  it('re-fetches when the host sector key changes', async () => {
    const { rerender } = render(<AiExplanation sectorKey="Banking" />);
    await screen.findByTestId('ai-explanation');
    rerender(<AiExplanation sectorKey="Technology" />);
    await waitFor(() => {
      const calls = (globalThis.fetch as unknown as { mock: { calls: unknown[][] } }).mock.calls;
      expect(calls.length).toBeGreaterThanOrEqual(2);
      expect(String(calls[calls.length - 1][0])).toContain('/api/ai-advisory/Technology');
    });
  });
});

describe('T8 — no forbidden computation or persistence', () => {
  it('requests the governed endpoint for the host sector key and nothing else', async () => {
    render(<AiExplanation sectorKey="Banking" />);
    await screen.findByTestId('ai-explanation');
    const calls = (globalThis.fetch as unknown as { mock: { calls: unknown[][] } }).mock.calls;
    expect(calls).toHaveLength(1);
    expect(String(calls[0][0])).toBe('/api/ai-advisory/Banking');
  });

  it('performs no storage, subscription, scheduling or event publication', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
    const addEventListener = vi.spyOn(window, 'addEventListener');
    render(<AiExplanation sectorKey="Banking" />);
    await screen.findByTestId('ai-explanation');
    expect(setItem).not.toHaveBeenCalled();
    const subscribed = addEventListener.mock.calls.map((c) => String(c[0]));
    expect(subscribed.filter((e) => /ai|advisor/i.test(e))).toEqual([]);
    setItem.mockRestore();
    addEventListener.mockRestore();
  });

  it('derives no score, ranking, threshold or recommendation of its own', async () => {
    render(<AiExplanation sectorKey="Banking" />);
    const text = await screen.findByTestId('ai-explanation-text');
    // The advisory sentence carries no recommendation, score, ranking or threshold.
    expect(text.textContent).not.toMatch(/BUY|SELL|HOLD/i);
    expect(text.textContent).not.toMatch(/\d+(\.\d+)?%?/);
    // "Confidence" is never rendered as a presented field or label — it appears only inside the
    // list of governed fields the contract does not provide.
    expect(screen.queryByText('Confidence')).not.toBeInTheDocument();
    const fields = screen.getByTestId('ai-explanation-fields');
    expect(fields.textContent).not.toMatch(/confidence|recommendation|score|ranking/i);
  });
});
