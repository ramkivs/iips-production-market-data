/**
 * Institutional Investment Platform System (IIPS)
 * G-2 / Gate B — IPC Module Barrel
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Execution Mode: NON_PRODUCTION
 *
 * Authority: `IIPS-V3-G2-IPD-GATE-B-IMPLEMENTATION-AUTHORITY-2026-10-17-01`.
 *
 * NOTE: `src/index.ts` (the root barrel) is deliberately NOT modified — no root re-export —
 * so the existing module surface is byte-unchanged. Consumers import by path.
 */

export * from './errors.js';
export * from './framing.js';
export * from './endpoint.js';
export * from './server.js';
export * from './entrypoint.js';
