/**
 * Program v3.0 — Phase 5: Executive Dashboard transport/adapter.
 *
 * Runs the certified v2.0 platform in-process and exposes the Executive Dashboard's
 * required surface over HTTP / in-process. Every displayed value is genuinely COMPUTED
 * by the certified engines over frozen v1.1 Replay Baseline inputs.
 *
 * Semantically inert (1:1 mapping; transport transformation != decision transformation).
 */
import http from 'node:http';
import { computeCertifiedExecutive, computeCertifiedPlatform } from '../../src/transports/executive_transport.js';

export { computeCertifiedExecutive, computeCertifiedPlatform };

export function createExecutiveServer(port = 8787): http.Server {
  const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.url === '/api/health') {
      res.writeHead(200);
      res.end(JSON.stringify({ status: 'ok', transport: 'program-v3.0 executive' }));
      return;
    }

    if (req.url === '/api/executive') {
      try {
        const payload = computeCertifiedExecutive();
        res.writeHead(200);
        res.end(JSON.stringify(payload));
      } catch (e) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'executive transport error', detail: String(e) }));
      }
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: 'not found' }));
  });

  return server;
}
