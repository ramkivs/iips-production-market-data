// W04 E4 follow-up. Sandbox reproduction with SYNTHETIC input only.
// Runs unmodified IRR code (handler, carrier materialiser, preview, submission freezer).
// It answers one question: with the environment the Windows launcher gives the transport,
// does an evidence submission write a journal? It reads no host data and no real holdings.
//
// Run:  cd <IRR>/frontend && IRR_ROOT=<IRR> ./node_modules/.bin/tsx <this file>
// Every file it creates is under a new temporary directory, removed at the end.
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

async function main(): Promise<void> {
  const irr = process.env.IRR_ROOT;
  if (!irr) throw new Error('IRR_ROOT is required');
  const fe = path.join(irr, 'frontend');
  const { handleEvidenceSubmission } = await import(path.join(fe, 'server/broker-import/brokerImportEvidenceSubmission.ts'));
  const { materialiseBrokerEvidenceOwnerCarrier } = await import(path.join(fe, 'server/broker-import/brokerImportEvidenceOwnerCarrier.ts'));
  const { previewBrokerHoldings } = await import(path.join(fe, 'src/api/brokerHoldingsPreview.ts'));
  const { freezeEvidenceSubmission } = await import(path.join(fe, 'src/api/brokerEvidenceSubmission.ts'));

  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'e4-repro-'));
  const mk = (n: string): string => { const d = path.join(base, n); fs.mkdirSync(d, { recursive: true }); return d; };

  const run = async (label: string, env: NodeJS.ProcessEnv, payload: unknown): Promise<void> => {
    const server = http.createServer((req, res) => { void handleEvidenceSubmission(req, res, 'DEFAULT_PORTFOLIO', { env }); });
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    const origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
    const res = await fetch(`${origin}/api/broker-import/DEFAULT_PORTFOLIO/evidence`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin, 'sec-fetch-site': 'same-origin' },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    server.close();
    let shown = text;
    try { const j = JSON.parse(text); shown = JSON.stringify({ error: j.error, outcome: j.outcome, duplicate: j.duplicate }); } catch { /* keep text */ }
    console.log(`${label}: HTTP ${res.status} ${shown} | data directory entries: ${JSON.stringify(fs.readdirSync(env.IIPS_DATA_DIR as string))}`);
  };

  // Synthetic statement. Symbols and ISINs are invented and belong to no security.
  const CSV = [
    'Trading Symbol,ISIN,Exchange,Total Qty,DP Qty,Available Qty,Average Buy Price,Last Traded Price,Current Value,Profit / Loss,P&L %',
    'QZSYMA,INE000SYNT00,NSE,10,10,10,100.5,110.25,1102.5,97.5,9.7',
    'QZSYMD,,NSE,12,12,12,10.1,12.3,147.6,26.4,21.7',
  ].join('\n') + '\n';
  const payload = freezeEvidenceSubmission('synthetic-statement.csv', previewBrokerHoldings(CSV, 'synthetic-statement.csv', '2026-11-14T01:02:03.004Z'));

  // The variables 03-Start-IipsServers.ps1 gives the transport that this handler reads,
  // plus the binding precondition. No IIPS_BROKER_EVIDENCE_OWNER_PATH: the launcher never sets it.
  const launcherEnv = (name: string): NodeJS.ProcessEnv => ({
    IIPS_DATA_DIR: mk(`${name}/iips-data`),
    IIPS_OWNER_CONTEXT_PATH: path.join(base, name, 'owner-context', 'owner-context.json'),
    IIPS_G3_IPC_BINDING_PROVISIONED: 'true',
    NODE_ENV: 'development',
  });
  await run('CASE 1 launcher environment, no evidence-owner carrier variable', launcherEnv('case1'), payload);

  // Control: the same environment plus the carrier written by IRR's own materialiser.
  const carrierDir = mk('carrier');
  materialiseBrokerEvidenceOwnerCarrier(carrierDir);
  await run('CASE 2 control, same environment plus the evidence-owner carrier', {
    ...launcherEnv('case2'),
    IIPS_BROKER_EVIDENCE_OWNER_PATH: path.join(carrierDir, 'broker-evidence-owner-context.json'),
  }, payload);

  fs.rmSync(base, { recursive: true, force: true });
}
main().catch((e) => { console.error('REPRO_FAILED', e instanceof Error ? e.message : String(e)); process.exit(1); });
