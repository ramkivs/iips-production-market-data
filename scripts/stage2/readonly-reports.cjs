'use strict';
// NP-04 pinned schema 2e11fa3b; no migrations, no DDL, no owner supplied over wire.
// Errors and file paths never leave this process. A WAL/journal is not read here:
// SQLite read-only WAL access can modify shared-memory sidecars or miss committed data.
const fs = require('node:fs');
const crypto = require('node:crypto');
try {
  const path = process.env.IIPS_COLLECT_REPORT_DB;
  const ownerPath = process.env.IIPS_COLLECT_REPORT_OWNER;
  if (!path || !ownerPath || !fs.statSync(path).isFile() || !fs.statSync(ownerPath).isFile()) throw Error();
  const owner = fs.readFileSync(ownerPath);
  if (owner.length !== 384 || crypto.createHash('sha256').update(owner).digest('hex') !== 'b1b78809d1c8d05800b338f73082b4269e6c9fa65b8f35192f4736d6f1a98640') throw Error();
  if (['-wal', '-shm', '-journal'].some(s => fs.existsSync(path + s))) throw Error();
  // SQLite WAL-mode readers can create or alter -shm even after WAL checkpoint.
  // Do not open a WAL-mode database (the NP-04 default) under this strict policy.
  const fd=fs.openSync(path,'r'); const header=Buffer.alloc(20); try { if(fs.readSync(fd,header,0,20,0)!==20) throw Error(); } finally { fs.closeSync(fd); }
  if(header[18] !== 1 || header[19] !== 1) throw Error();
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync(path, { readOnly: true });
  try {
    db.exec('BEGIN');
    const ledger = db.prepare('SELECT ordinal,name,checksum FROM schema_migrations ORDER BY ordinal').all();
    if (ledger.length !== 1 || ledger[0].ordinal !== 1 || ledger[0].name !== 'governed_persistence_baseline' || ledger[0].checksum !== '8e75ad78537530dd5a1fa9a8edd25a7fde29db528082825b9690417def8d3a7f') throw Error();
    const pair = ['irr-reports-personal', 'owner-irr-reports-personal'];
    const total = db.prepare('SELECT COUNT(*) AS n,COUNT(DISTINCT chain_id) AS chains FROM governed_artifacts WHERE tenant_id=? AND user_id=?').get(...pair);
    const versions = db.prepare('SELECT COUNT(*) AS n FROM (SELECT chain_id, COUNT(*) n, MIN(artifact_version) lo, MAX(artifact_version) hi, COUNT(DISTINCT artifact_version) d FROM governed_artifacts WHERE tenant_id=? AND user_id=? GROUP BY chain_id HAVING lo <> 1 OR hi <> n OR d <> n)').get(...pair);
    const badLinks = db.prepare(`SELECT COUNT(*) AS n FROM governed_artifacts a LEFT JOIN governed_artifacts b ON a.supersedes_report_id=b.report_id WHERE a.tenant_id=? AND a.user_id=? AND ((a.artifact_version=1 AND a.supersedes_report_id IS NOT NULL) OR (a.artifact_version>1 AND (b.report_id IS NULL OR b.tenant_id<>a.tenant_id OR b.user_id<>a.user_id OR b.chain_id<>a.chain_id OR b.artifact_version<>a.artifact_version-1)))`).get(...pair);
    const types = db.prepare('SELECT COUNT(DISTINCT report_type) AS n FROM governed_artifacts WHERE tenant_id=? AND user_id=?').get(...pair);
    const knownTypes = ['investment.company-assessment','investment.holding-disposition','investment.change-report'];
    const groups = db.prepare('SELECT report_type, COUNT(*) AS versions, COUNT(DISTINCT chain_id) AS chains FROM governed_artifacts WHERE tenant_id=? AND user_id=? GROUP BY report_type').all(...pair);
    const typeCounts = {};
    for (const group of groups) { const key=knownTypes.includes(group.report_type) ? group.report_type : 'OTHER'; if (!typeCounts[key]) typeCounts[key]={versions:0,chains:0}; typeCounts[key].versions+=group.versions; typeCounts[key].chains+=group.chains; }
    db.exec('COMMIT');
    console.log(JSON.stringify({status:'AVAILABLE',chains:total.chains,versions:total.n,distinctReportTypes:types.n,reportTypes:typeCounts,invalidVersionSequences:versions.n,invalidLinks:badLinks.n,revisionLinkage:'UNKNOWN',readAt:new Date().toISOString(),schema:'NP04_2e11fa3b_baseline'}));
  } finally { db.close(); }
} catch { console.log(JSON.stringify({status:'UNKNOWN'})); process.exitCode=1; }
