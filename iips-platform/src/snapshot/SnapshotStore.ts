/** In-memory snapshot store (append-only, replay support). IES-006.2A. */
import type { Snapshot } from './SnapshotService';

export class SnapshotStore {
  private readonly snapshots: Snapshot[] = [];

  append(snapshot: Snapshot): void {
    if (this.snapshots.some((s) => s.snapshotId === snapshot.snapshotId)) {
      throw new Error(`Snapshot already exists: ${snapshot.snapshotId}`);
    }
    this.snapshots.push(snapshot);
  }

  get(snapshotId: string): Snapshot | undefined {
    return this.snapshots.find((s) => s.snapshotId === snapshotId);
  }

  list(): Snapshot[] {
    return [...this.snapshots];
  }

  get size(): number {
    return this.snapshots.length;
  }
}
