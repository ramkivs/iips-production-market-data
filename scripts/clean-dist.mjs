#!/usr/bin/env node
/**
 * Deterministic pre-build cleaner for TypeScript and package emit directories.
 *
 * Why this exists:
 *   Plain `tsc` overwrites files corresponding to current `.ts` sources, but never deletes
 *   previously emitted `.js` / `.d.ts` / `.map` artifacts whose `.ts` sources were removed or
 *   differ across branches. That allowed stale compiled Dhan modules (for example an older
 *   `dist/src/providers/dhan/dhan_credential_store_cli.js`) to remain on disk alongside a newly
 *   compiled `dist/src/security/secret_ref.js`, passing `tsc` while failing at Node ESM link time.
 *
 * Modes:
 *   - `full` (default): removes `dist` and `dist-frontend` completely (`npm run build`).
 *   - `tsc-only` (`--tsc-only`): removes `dist/src`, `dist/tests`, `dist/frontend`, and any
 *     `.tsbuildinfo` files under `dist`, while preserving `dist/package` (`npm run build:tsc`).
 *   - `package-only` (`--package-only`): removes `dist/package` before subpackage builds.
 */
import { existsSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_REPO_ROOT = resolve(dirname(SCRIPT_PATH), '..');

/**
 * @param {{ rootDir?: string, mode?: 'full' | 'tsc-only' | 'package-only' }} [options]
 */
export function cleanDistOutput(options = {}) {
  const rootDir = resolve(options.rootDir ?? DEFAULT_REPO_ROOT);
  const mode = options.mode ?? 'full';
  const distDir = join(rootDir, 'dist');
  const removed = [];

  const removeTarget = (targetPath) => {
    if (existsSync(targetPath)) {
      rmSync(targetPath, { recursive: true, force: true });
      removed.push(targetPath);
    }
  };

  if (mode === 'full') {
    removeTarget(distDir);
    removeTarget(join(rootDir, 'dist-frontend'));
    return { rootDir, mode, removed };
  }

  if (mode === 'package-only') {
    removeTarget(join(distDir, 'package'));
    return { rootDir, mode, removed };
  }

  if (mode === 'tsc-only') {
    for (const sub of ['src', 'tests', 'frontend']) {
      removeTarget(join(distDir, sub));
    }
    if (existsSync(distDir)) {
      for (const entry of readdirSync(distDir)) {
        if (entry.endsWith('.tsbuildinfo')) {
          removeTarget(join(distDir, entry));
        }
      }
    }
    return { rootDir, mode, removed };
  }

  throw new Error(`Unsupported clean-dist mode: ${String(mode)}`);
}

function parseCliArgs(argv) {
  let mode = 'full';
  let rootDir = DEFAULT_REPO_ROOT;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--tsc-only') {
      mode = 'tsc-only';
    } else if (arg === '--package-only') {
      mode = 'package-only';
    } else if (arg === '--root') {
      const next = argv[i + 1];
      if (!next) {
        throw new Error('--root requires a directory argument');
      }
      rootDir = resolve(next);
      i += 1;
    } else {
      throw new Error(`Unknown clean-dist flag: ${arg}`);
    }
  }

  return { rootDir, mode };
}

if (process.argv[1] && resolve(process.argv[1]) === SCRIPT_PATH) {
  const parsed = parseCliArgs(process.argv.slice(2));
  cleanDistOutput(parsed);
}
