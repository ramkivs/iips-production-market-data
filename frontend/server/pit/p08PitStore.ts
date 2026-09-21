/**
 * D-PIT-WIRE-01 — the SINGLE typed runtime import point for the frozen P08 PIT store.
 *
 * `p08/src/pitStorageModel.js` is plain ESM JavaScript (F-6/D22: no types were added to the
 * frozen P08 tree, and this act adds none). This shim exists ONLY so the transport can import
 * its runtime exports through one line carrying a targeted suppression; the type surface is
 * declared locally in `./pitStorageModel.d.ts` and consumed everywhere via `import type`.
 * NO semantic change to p08 is possible through this module — it re-exports frozen bindings.
 */

// @ts-expect-error — the frozen P08 module is intentionally untyped JavaScript; its type
// surface is declared in ./pitStorageModel.d.ts (see header comment).
export { createPitStore, PIT_CAPABILITY } from '../../../p08/src/pitStorageModel.js';
