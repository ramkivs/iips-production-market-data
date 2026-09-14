import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal, Drawer, Tabs, Accordion, Search, Pagination, FilterBar } from './InteractionComponents';

describe('Interaction components', () => {
  it('Modal renders when open and hides when closed', () => {
    const { rerender } = render(<Modal open title="M" onClose={() => {}}>body</Modal>);
    expect(screen.getByTestId('modal')).toHaveTextContent('body');
    rerender(<Modal open={false} title="M" onClose={() => {}}>body</Modal>);
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('Tabs marks the active tab', () => {
    render(<Tabs tabs={['A', 'B']} active="A" onChange={() => {}} />);
    expect(screen.getByRole('tab', { name: 'A' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tab', { name: 'B' }).getAttribute('aria-selected')).toBe('false');
  });

  it('Accordion toggles open', async () => {
    const user = userEvent.setup();
    render(<Accordion title="Details">secret</Accordion>);
    expect(screen.queryByText('secret')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Details/ }));
    expect(screen.getByText('secret')).toBeInTheDocument();
  });

  it('Search fires onSearch', async () => {
    const user = userEvent.setup();
    const fn = vi.fn();
    render(<Search onSearch={fn} />);
    await user.type(screen.getByRole('searchbox'), 'abc');
    expect(fn).toHaveBeenCalledWith('abc');
  });

  it('Pagination disables Prev on first page', () => {
    render(<Pagination page={1} pageCount={3} onPage={() => {}} />);
    expect(screen.getByRole('button', { name: /Prev/ })).toBeDisabled();
  });

  it('FilterBar reflects selected filter', () => {
    render(<FilterBar options={[{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]} selected="a" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'A' }).getAttribute('aria-pressed')).toBe('true');
  });
});

// --- Phase 13-Hardening (A2/A3) regression tests ---

function ModalHarness() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>Open modal</button>
      <Modal open={open} onClose={() => setOpen(false)} title="M">
        <button type="button">inside one</button>
        <button type="button">inside two</button>
      </Modal>
    </div>
  );
}

function TabsHarness() {
  const [active, setActive] = useState('A');
  return <Tabs tabs={['A', 'B', 'C']} active={active} onChange={setActive} />;
}

describe('Phase 13-Hardening — dialogs & tabs', () => {
  it('A2: Modal moves focus into the dialog when opened', async () => {
    const user = userEvent.setup();
    render(<ModalHarness />);
    await user.click(screen.getByRole('button', { name: 'Open modal' }));
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close' }));
  });

  it('A2: Modal traps Tab (wraps from last focusable to first)', async () => {
    const user = userEvent.setup();
    render(<ModalHarness />);
    await user.click(screen.getByRole('button', { name: 'Open modal' }));
    screen.getByRole('button', { name: 'inside two' }).focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close' }));
  });

  it('A2: Modal traps Shift+Tab (wraps from first focusable to last)', async () => {
    const user = userEvent.setup();
    render(<ModalHarness />);
    await user.click(screen.getByRole('button', { name: 'Open modal' }));
    screen.getByRole('button', { name: 'Close' }).focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'inside two' }));
  });

  it('A2: Modal closes on Escape and restores focus to the invoking control', async () => {
    const user = userEvent.setup();
    render(<ModalHarness />);
    const trigger = screen.getByRole('button', { name: 'Open modal' });
    await user.click(trigger);
    await user.keyboard('{Escape}');
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });

  it('A2: Drawer closes on Escape', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [open, setOpen] = useState(true);
      return (
        <div>
          <button type="button" onClick={() => setOpen(false)}>close-drawer</button>
          <Drawer open={open} onClose={() => setOpen(false)} title="D"><p>drawer body</p></Drawer>
        </div>
      );
    }
    render(<Harness />);
    expect(screen.getByTestId('drawer')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByTestId('drawer')).not.toBeInTheDocument();
  });

  it('A3: Tabs use roving tabindex (active=0, others=-1)', () => {
    render(<Tabs tabs={['A', 'B', 'C']} active="A" onChange={() => {}} />);
    expect(screen.getByRole('tab', { name: 'A' }).tabIndex).toBe(0);
    expect(screen.getByRole('tab', { name: 'B' }).tabIndex).toBe(-1);
    expect(screen.getByRole('tab', { name: 'C' }).tabIndex).toBe(-1);
  });

  it('A3: Tabs ArrowRight moves selection and focus (automatic activation)', () => {
    render(<TabsHarness />);
    const tabA = screen.getByRole('tab', { name: 'A' });
    tabA.focus();
    fireEvent.keyDown(tabA, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'B' }).getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'B' }));
  });

  it('A3: Tabs Home and End jump to first and last tab', () => {
    const onChange = vi.fn();
    render(<Tabs tabs={['A', 'B', 'C']} active="A" onChange={onChange} />);
    const tabA = screen.getByRole('tab', { name: 'A' });
    fireEvent.keyDown(tabA, { key: 'End' });
    expect(onChange).toHaveBeenLastCalledWith('C');
    fireEvent.keyDown(tabA, { key: 'Home' });
    expect(onChange).toHaveBeenLastCalledWith('A');
  });
});
