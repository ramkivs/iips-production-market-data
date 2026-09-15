/**
 * UI08 REPORTS — HTTP transport.
 *
 * Authority: D82-R1 decision A. Requirement: INT-012 / D4_01 / D4_03.
 *
 * Mirrors the promoted notes / UI12 settings / UI07 watchlists dispatch pattern: reached from a
 * path-prefix branch in `executive-transport` with the EXISTING READ executor. No new RBAC
 * model, no new executor, `readSurfaceFor` is NOT extended.
 *
 * Routes (owner-scoped, server-derived identity):
 *   GET    /api/reports           — stored reports (+ integrity check and PIT limitation)
 *   GET    /api/reports/:id       — one stored report, byte-identical to what was generated
 *   POST   /api/reports           — generate + store from a template (reportType + portfolioId)
 *   DELETE /api/reports/:id       — delete a stored report
 *
 * ⚠ Report CONTENT is produced by the existing platform `ReportingEngine.build()` over the
 *   certified CSIP pipeline output. No figure is invented here, and the client cannot supply
 *   report content — only a template selection.
 *
 * ⚠ The accepted P13 `buildReportView` is consumed UNMODIFIED to pin dataVersion/asOf/mode and
 *   attach the provenance view. Its `pitReproducible: true` is passed through as-is and is NOT
 *   amplified: the response also carries `PIT_LIMITATION`, stating plainly that arbitrary
 *   historical as-of regeneration is UNAVAILABLE.
 *
 * ⚠ AD-17/M-2, ReplayService and the replay hardcodes are untouched. `buildReportView` itself
 *   sets `replayReproducibilityClaimed: false`; nothing here claims replay.
 */
import type http from 'node:http';
import { AuthError } from '../../src/core/auth/keycloakAdapter';
import type { SecuredExecutor } from '../secured-executor';
import { guardRead, guardExecute, TransportError } from '../admin-transport';
import type { GovernedUniverseProvider } from '../p12-request-handler';
import {
  PIT_LIMITATION,
  REPORT_TYPES,
  ReportValidationError,
  compareRegeneration,
  deleteReport,
  getReportsPersistence,
  isReportType,
  listReports,
  readReport,
  storeReport,
  verifyStoredIntegrity,
  type PitPinning,
  type StoredReport,
} from './reports-service';
// The ACCEPTED P13 UI08 contract — consumed unmodified (D82 §8). Same `@ts-expect-error`
// convention already used for the certified P12/P13 JS modules.
// @ts-expect-error — accepted P13 JavaScript module; imported without modification.
import * as extendSurfaces from '../../../p13/src/extendSurfaces.js';

/** Supplies the certified CSIP pipeline output that `ReportingEngine.build()` consumes. */
export interface ReportSourceProvider {
  csip(): {
    intelligence: unknown;
    ranking: unknown;
    allocation: unknown;
    diversification: unknown;
    opportunity: unknown;
    correlation: unknown;
  };
}

function readBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => {
      chunks.push(c);
      if (chunks.reduce((n, b) => n + b.length, 0) > 1_000_000) reject(new TransportError(400, 'request-body-too-large'));
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (raw.trim() === '') { resolve({}); return; }
      try { resolve(JSON.parse(raw) as Record<string, unknown>); } catch { reject(new TransportError(400, 'invalid-json')); }
    });
    req.on('error', reject);
  });
}

export function isReportsPath(url: string | undefined): boolean {
  return (url ?? '').split('?')[0].startsWith('/api/reports');
}

/** Build the P13 view for a stored report, plus integrity and same-vintage regeneration facts. */
function decorate(
  report: StoredReport,
  tenantId: string,
  regeneration: ReturnType<typeof compareRegeneration> | null,
): Record<string, unknown> {
  const provenance = {
    dataSource: report.lineage.dataSource,
    classification: report.lineage.classification,
    asOf: report.pitPinning.asOf,
    dataVersion: report.pitPinning.dataVersion,
    mode: report.pitPinning.mode,
    quality: 'good',
    receivedAt: report.pitPinning.asOf,
    completenessPct: 100,
  };
  // Accepted P13 contract, unmodified: pins dataVersion/asOf/mode and builds the provenance view.
  const view = extendSurfaces.buildReportView({
    reportId: report.reportId,
    reportBody: report.payload,
    provenance,
    tenantId,
  }) as Record<string, unknown>;

  return {
    ...view,
    reportType: report.reportType,
    portfolioId: report.portfolioId,
    lineage: report.lineage,
    payloadHash: report.payloadHash,
    // Byte-identity of the STORED content, re-verified on every read.
    storedIntegrityVerified: verifyStoredIntegrity(report),
    regeneration,
    // ⚠ Scope of `pitReproducible` above — stated, never amplified.
    pitLimitation: PIT_LIMITATION,
  };
}

export async function handleReportsRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  executor: SecuredExecutor,
  universe: GovernedUniverseProvider,
  source: ReportSourceProvider,
  buildReport: (args: { reportType: string; portfolioId: string; csip: ReturnType<ReportSourceProvider['csip']> }) => {
    reportId: string; reportType: string; portfolioId: string; payload: Readonly<Record<string, unknown>>;
  },
  opts: { readonly store?: import('../persistence/persistence-service').PersistenceService } = {},
): Promise<void> {
  const url = (req.url ?? '').split('?')[0];
  const token = (req.headers.authorization ?? '').replace(/^Bearer /, '').trim();
  const method = req.method ?? 'GET';
  res.setHeader('Content-Type', 'application/json');

  try {
    const store = opts.store ?? getReportsPersistence();
    const segments = url.split('/').filter(Boolean); // api, reports, [id]

    // ---- GET /api/reports ---------------------------------------------------------------
    if (url === '/api/reports' && method === 'GET') {
      const p = await guardRead(executor, token, 'reports');
      const vintage = await universe.vintage(p.tenantId);
      const current: PitPinning = { dataVersion: vintage.dataVersion, asOf: vintage.asOf, mode: vintage.mode };

      const data = listReports(p.tenantId, p.userId, store).map((r) => {
        // Regenerate ONLY to compare — never to replace stored content.
        let regeneration: ReturnType<typeof compareRegeneration> | null = null;
        try {
          const fresh = buildReport({ reportType: r.reportType, portfolioId: r.portfolioId, csip: source.csip() });
          regeneration = compareRegeneration(r, fresh.payload, current);
        } catch {
          regeneration = null; // regeneration unavailable — the stored report is unaffected
        }
        return decorate(r, p.tenantId, regeneration);
      });

      res.writeHead(200);
      res.end(JSON.stringify({
        data,
        templates: REPORT_TYPES,
        provenance: {
          dataSource: vintage.dataSource,
          asOf: vintage.asOf,
          dataVersion: vintage.dataVersion,
          mode: vintage.mode,
          freshness: 'SNAPSHOT',
          authority: 'PLATFORM',
          transportSemantics:
            'owner-scoped reports (append-only journal). Each report PINS its dataVersion/asOf/mode and stores its complete payload; re-opening is byte-identical (hash-verified). Regeneration is byte-identical ONLY against the same pinned vintage. Arbitrary historical as-of regeneration is UNAVAILABLE — no historical vintage is fabricated.',
        },
      }));
      return;
    }

    // ---- POST /api/reports --------------------------------------------------------------
    if (url === '/api/reports' && method === 'POST') {
      const p = await guardExecute(executor, token, 'reports');
      const body = await readBody(req);
      const reportType = body.reportType;
      if (!isReportType(reportType)) throw new TransportError(400, 'invalid-reportType');
      const portfolioId = typeof body.portfolioId === 'string' && body.portfolioId.trim() !== ''
        ? body.portfolioId
        : 'PF-REAL';

      const vintage = await universe.vintage(p.tenantId);
      // Content comes from the platform engine over certified CSIP output — never from the client.
      const generated = buildReport({ reportType, portfolioId, csip: source.csip() });
      const stored = storeReport(
        p.tenantId,
        p.userId,
        generated,
        { dataVersion: vintage.dataVersion, asOf: vintage.asOf, mode: vintage.mode },
        {
          dataSource: vintage.dataSource,
          classification: vintage.classification,
          contributingSnapshotIds: vintage.contributingSnapshotIds,
          generatedAt: new Date().toISOString(),
        },
        store,
      );
      res.writeHead(201);
      res.end(JSON.stringify({ data: decorate(stored, p.tenantId, null) }));
      return;
    }

    // ---- GET /api/reports/:id -------------------------------------------------------------
    if (segments.length === 3 && method === 'GET') {
      const p = await guardRead(executor, token, 'reports');
      const report = readReport(p.tenantId, p.userId, decodeURIComponent(segments[2]), store);
      if (!report) throw new TransportError(404, 'report-not-found');
      res.writeHead(200);
      res.end(JSON.stringify({ data: decorate(report, p.tenantId, null) }));
      return;
    }

    // ---- DELETE /api/reports/:id ----------------------------------------------------------
    if (segments.length === 3 && method === 'DELETE') {
      const p = await guardExecute(executor, token, 'reports');
      if (!deleteReport(p.tenantId, p.userId, decodeURIComponent(segments[2]), store)) {
        throw new TransportError(404, 'report-not-found');
      }
      res.writeHead(200);
      res.end(JSON.stringify({ data: { deleted: true } }));
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: 'report-not-found' }));
  } catch (e) {
    if (e instanceof AuthError) { res.writeHead(e.status); res.end(JSON.stringify({ error: e.message })); return; }
    if (e instanceof TransportError) { res.writeHead(e.status); res.end(JSON.stringify({ error: e.message })); return; }
    if (e instanceof ReportValidationError) { res.writeHead(400); res.end(JSON.stringify({ error: e.message })); return; }
    res.writeHead(500); res.end(JSON.stringify({ error: 'reports transport error', detail: String(e) }));
  }
}
