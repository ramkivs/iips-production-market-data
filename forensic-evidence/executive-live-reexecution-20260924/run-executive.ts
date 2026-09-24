/**
 * IIPS Executive live re-execution harness — FORENSIC, READ-ONLY.
 *
 * - Lives OUTSIDE both historical worktrees; imports the HISTORICAL transport module
 *   unmodified at its exact checkpoint. No historical source file is created, edited,
 *   or deleted by this harness.
 * - NODE_ENV is fixed to 'test' BEFORE the import so the transport's own guard
 *   (`if (process.env.NODE_ENV !== 'test') void start()`) suppresses the HTTP server.
 *   This is the module's OWN declared library mode — the same mode under which the
 *   historical vitest suite exercised this transport. No source patch is applied.
 * - Calls the transport's own exported entry point computeCertifiedExecutive()
 *   (plus computeCertifiedPlatform() for engine-level provenance) and prints the
 *   raw JSON to stdout without alteration.
 */
process.env.NODE_ENV = 'test';

const transportPath = process.argv[2];
if (!transportPath) {
  console.error('usage: run-executive.ts <absolute path to frontend/server/executive-transport.ts>');
  process.exit(2);
}

const mod = (await import(transportPath)) as {
  computeCertifiedExecutive: () => unknown;
};

const executive = mod.computeCertifiedExecutive();

// Raw, unaltered serialization of the Executive observable payload.
process.stdout.write(JSON.stringify(executive, null, 2) + '\n');
