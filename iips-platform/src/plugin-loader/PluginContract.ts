/** Plugin contract (SEC) — reimplemented from IES-005.1 sec.ts (frozen). */
import type { Container } from '../di/Container';

export type PluginLifecyclePhase =
  | 'Discovered'
  | 'Registration'
  | 'Initialization'
  | 'Execution'
  | 'Completion';

export interface PluginIdentity {
  readonly engineId: string;
  readonly sectorFamily: string;
  readonly engineVersion: string;
  readonly secVersion: string;
  readonly semcVersion: string;
}

export interface PluginManifest {
  readonly engineId: string;
  readonly sectorFamily: string;
  readonly engineVersion: string;
  readonly capabilities: readonly string[];
  readonly compatibility: Readonly<Record<string, string>>;
}

export interface ExecutionRequest {
  readonly requestId: string;
  readonly inputs: Readonly<Record<string, unknown>>;
}

export interface ExecutionResult {
  readonly state: 'COMPLETED' | 'FAILED' | 'CANCELLED';
  readonly snapshotRef?: string;
  readonly evidenceRef?: string;
  readonly metadata: Readonly<Record<string, unknown>>;
}

/** The plugin interface a sector engine implements to be hosted. */
export interface SectorPlugin {
  readonly identity: PluginIdentity;
  readonly manifest: PluginManifest;
  onDiscover(): void;
  onRegister(ctx: Container): boolean;
  onInitialize(ctx: Container): void;
  execute(ctx: Container, request: ExecutionRequest): ExecutionResult;
  onComplete(ctx: Container, result: ExecutionResult): void;
}
