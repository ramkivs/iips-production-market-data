/**
 * Companion harness: dumps the platform-level internals (engineOutputs + CSIP result)
 * that computeCertifiedExecutive maps 1:1. Same forensic constraints as run-executive.ts.
 * The platform function is not exported by the transport, so this harness re-derives the
 * identical inputs by calling the exported Executive entry point AND, separately, the
 * exported cross-sector/decision entry points — no private function is accessed and no
 * source is modified.
 */
process.env.NODE_ENV = 'test';

const transportPath = process.argv[2];
if (!transportPath) {
  console.error('usage: run-platform.ts <absolute path to frontend/server/executive-transport.ts>');
  process.exit(2);
}

const mod = (await import(transportPath)) as Record<string, () => unknown>;

const out: Record<string, unknown> = {
  decisionMatrix: mod.computeCertifiedDecisionMatrix(),
  crossSector: mod.computeCertifiedCrossSector(),
  portfolio: mod.computeCertifiedPortfolio(),
};
process.stdout.write(JSON.stringify(out, null, 2) + '\n');
