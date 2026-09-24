/** Diagnostics — observational only, never influences behaviour (generic, IES-006.2A WP-2). */
export interface DiagnosticsSnapshot {
  readonly engineId: string;
  readonly executionDurationMs: number;
  readonly registryVersions: Readonly<Record<string, string>>;
  readonly replayStatus: string;
  readonly transportStatus: string;
  readonly pluginPhase: string;
}

export class DiagnosticsService {
  private readonly records: DiagnosticsSnapshot[] = [];

  capture(input: Omit<DiagnosticsSnapshot, 'pluginPhase'> & { pluginPhase?: string }): DiagnosticsSnapshot {
    const snap: DiagnosticsSnapshot = {
      engineId: input.engineId,
      executionDurationMs: input.executionDurationMs,
      registryVersions: Object.freeze({ ...input.registryVersions }),
      replayStatus: input.replayStatus,
      transportStatus: input.transportStatus,
      pluginPhase: input.pluginPhase ?? 'unknown',
    };
    this.records.push(Object.freeze(snap));
    return snap;
  }

  list(): DiagnosticsSnapshot[] {
    return [...this.records];
  }

  clear(): void {
    this.records.length = 0;
  }
}
