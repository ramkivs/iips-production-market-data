import { describe, it, expect } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EvidenceReference, SnapshotMetadata, ProvenancePanel, EvidenceDrawer, EvidenceCard } from './EvidenceComponents';

describe('Evidence components', () => {
  const ref = { evidenceId: 'ev_1', engineId: 'sector.technology', recommendation: 'Buy', compositeScore: 76.3, calibrationVersion: '1.0.0' };

  it('EvidenceReference shows evidence + engine identity', () => {
    render(<EvidenceReference reference={ref} />);
    expect(screen.getByTestId('evidence-reference')).toHaveTextContent('ev_1');
    expect(screen.getByTestId('evidence-reference')).toHaveTextContent('sector.technology');
  });

  it('SnapshotMetadata shows snapshot id', () => {
    render(<SnapshotMetadata snapshotId="SNAP_ABC" version="1.0" />);
    expect(screen.getByTestId('snapshot-metadata')).toHaveTextContent('SNAP_ABC');
  });

  it('ProvenancePanel renders key/value provenance', () => {
    render(<ProvenancePanel items={[{ key: 'calibration', value: '1.0.0' }, { key: 'engine', value: 'sector.tech' }]} />);
    expect(screen.getByTestId('provenance-panel')).toHaveTextContent('calibration');
    expect(screen.getByTestId('provenance-panel')).toHaveTextContent('1.0.0');
  });

  it('EvidenceDrawer renders when open and is dismissible', () => {
    const { rerender } = render(<EvidenceDrawer open onClose={() => {}}><p>evidence body</p></EvidenceDrawer>);
    expect(screen.getByTestId('evidence-drawer')).toHaveTextContent('evidence body');
    rerender(<EvidenceDrawer open={false} onClose={() => {}}><p>evidence body</p></EvidenceDrawer>);
    expect(screen.queryByTestId('evidence-drawer')).not.toBeInTheDocument();
  });

  it('EvidenceCard renders a reference', () => {
    render(<EvidenceCard reference={ref} />);
    expect(screen.getByTestId('evidence-card')).toHaveTextContent('ev_1');
  });

  it('A2: EvidenceDrawer closes on Escape', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [open, setOpen] = useState(true);
      return (
        <div>
          <EvidenceDrawer open={open} onClose={() => setOpen(false)}><p>evidence body</p></EvidenceDrawer>
        </div>
      );
    }
    render(<Harness />);
    expect(screen.getByTestId('evidence-drawer')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByTestId('evidence-drawer')).not.toBeInTheDocument();
  });
});
