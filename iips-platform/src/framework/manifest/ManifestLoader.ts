/** Manifest Loader — load + validate engine manifests (generic, IES-006.2A WP-2). */
import type { PluginManifest } from '../../plugin-loader/PluginContract';

export class ManifestLoader {
  /** Validate a manifest is well-formed. */
  validate(manifest: PluginManifest): boolean {
    return (
      !!manifest.engineId &&
      !!manifest.sectorFamily &&
      !!manifest.engineVersion &&
      Array.isArray(manifest.capabilities) &&
      manifest.compatibility !== undefined
    );
  }

  /** Normalize a manifest into a frozen canonical form. */
  load(manifest: PluginManifest): Readonly<PluginManifest> {
    if (!this.validate(manifest)) throw new Error(`Invalid manifest for engine: ${manifest?.engineId}`);
    return Object.freeze({
      engineId: manifest.engineId,
      sectorFamily: manifest.sectorFamily,
      engineVersion: manifest.engineVersion,
      capabilities: Object.freeze([...manifest.capabilities]),
      compatibility: Object.freeze({ ...manifest.compatibility }),
    });
  }
}
