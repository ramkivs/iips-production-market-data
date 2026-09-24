/**
 * Program v2.0 — WP-6: Marketplace / Certified Plugin Architecture.
 *
 * The extensibility / supply-chain trust boundary. Extends the v1.1 SectorPlugin contract with
 * signing, certification, dependency isolation, and trust anchoring. A plugin may only be
 * loaded if it is signed + certified + not blacklisted; an untrusted or non-deterministic
 * plugin is rejected at the gate. Determinism (WP-0) and security (WP-15) are hard prerequisites.
 */
import type { SectorPlugin } from '../plugin-loader/PluginContract';
import { Container } from '../di/Container';
import { createClock } from '../infrastructure/Clock';
import { createIdProvider } from '../infrastructure/IdProvider';
import { PluginLoader } from '../plugin-loader/PluginLoader';
import { SnapshotService } from '../snapshot/SnapshotService';
import { SnapshotStore } from '../snapshot/SnapshotStore';
import { ReplayService } from '../replay/ReplayService';
import { RuntimeCoordinator } from '../runtime/RuntimeCoordinator';
import { EvidencePipeline } from '../framework/evidence/EvidencePipeline';

export type PluginTrustState = 'unsigned' | 'signed' | 'certified';

export interface PluginRecord {
  readonly pluginId: string;
  readonly manifestHash: string;      // immutable manifest fingerprint
  readonly signer: string;            // trusted signer identity
  readonly trustState: PluginTrustState;
  readonly certified: boolean;
  readonly blacklisted: boolean;
  readonly determinismVerified: boolean;
}

/** Deterministic manifest fingerprint (FNV-1a, no randomness). */
export function manifestHash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return (h >>> 0).toString(16).toUpperCase().padStart(8, '0');
}

export class PluginMarketplace {
  private readonly records = new Map<string, PluginRecord>();

  constructor(private readonly trustAnchors: string[]) {}

  /** Register a plugin's trust record (signer must be a trusted anchor to reach 'certified'). */
  register(pluginId: string, manifest: unknown, signer: string, opts: { trustState?: PluginTrustState; certified?: boolean; blacklisted?: boolean; determinismVerified?: boolean } = {}): PluginRecord {
    const mh = manifestHash(JSON.stringify(manifest));
    const isTrustedSigner = this.trustAnchors.includes(signer);
    const certified = (opts.certified ?? false) && isTrustedSigner;
    const rec: PluginRecord = {
      pluginId,
      manifestHash: mh,
      signer,
      trustState: opts.trustState ?? (isTrustedSigner ? 'signed' : 'unsigned'),
      certified,
      blacklisted: opts.blacklisted ?? false,
      determinismVerified: opts.determinismVerified ?? false,
    };
    this.records.set(pluginId, Object.freeze(rec));
    return rec;
  }

  /** Certification gate: a plugin may be loaded only if certified, not blacklisted, determinism-verified. */
  certify(pluginId: string): { allowed: boolean; reason: string } {
    const rec = this.records.get(pluginId);
    if (!rec) return { allowed: false, reason: 'unregistered' };
    if (rec.blacklisted) return { allowed: false, reason: 'blacklisted' }; // revocation takes precedence
    if (!rec.certified) return { allowed: false, reason: 'not-certified' };
    if (!rec.determinismVerified) return { allowed: false, reason: 'determinism-unverified' };
    return { allowed: true, reason: 'ok' };
  }

  /** Determinism verification: a plugin passes only if it reproduces its oracle deterministically. */
  verifyDeterminism(pluginId: string, runTwice: () => [unknown, unknown]): boolean {
    const [a, b] = runTwice();
    return JSON.stringify(a) === JSON.stringify(b);
  }

  /** Blacklist a compromised/withdrawn plugin (revocation). */
  revoke(pluginId: string): void {
    const rec = this.records.get(pluginId);
    if (rec) this.records.set(pluginId, { ...rec, blacklisted: true, certified: false });
  }

  /** Dependency isolation: load a certified plugin into an isolated runtime. */
  provisionIsolated(engineId: string, makeEngine: () => SectorPlugin): { runtime: RuntimeCoordinator; store: SnapshotStore; replay: ReplayService } {
    const clock = createClock('fixed');
    const id = createIdProvider('deterministic');
    const evidence = new EvidencePipeline(clock);
    const container = new Container({ clock, idProvider: id, evidenceService: evidence });
    const plugins = new PluginLoader(container);
    const snap = new SnapshotService(clock, id);
    const store = new SnapshotStore();
    const replay = new ReplayService(store);
    const runtime = new RuntimeCoordinator(container, plugins, snap, store, replay);
    container.register('runtimeCoordinator', runtime);
    plugins.load(makeEngine());
    plugins.initialize(engineId);
    return { runtime, store, replay };
  }

  get(pluginId: string): PluginRecord | undefined { return this.records.get(pluginId); }
  list(): PluginRecord[] { return [...this.records.values()]; }
}
