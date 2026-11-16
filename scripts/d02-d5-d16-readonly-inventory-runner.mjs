/**
 * Repository-owned D02 D5/D16 Level E Read-Only SQLite Inventory Runner.
 *
 * Governance & safety boundary:
 *   - Must ONLY be executed on the Principal's Windows host via
 *     scripts/Invoke-D02D5D16ReadOnlyInventory.ps1 against an existing SQLite file
 *     (designated default: C:\iips-data\iips\user-portfolio.sqlite).
 *   - Must NOT be executed in a Linux container/sandbox (enforced fail-closed).
 *   - Zero imports from src/ipc or src/persistence: never starts IPC, never calls
 *     openDatabase(), ensureMigrations(), resolveActiveBinding(),
 *     resolveActiveHoldingsBinding(), or Direct P1 provisioning.
 *   - Opens SQLite strictly via node:sqlite DatabaseSync(dbPath, { open: true, readOnly: true }),
 *     immediately enforces PRAGMA query_only = ON and PRAGMA temp_store = MEMORY,
 *     executes ONLY the exact Q01-Q14 catalog from
 *     docs/integration/IPD-D02-D5-D16-READ-ONLY-INVENTORY-AND-BLOCKER-REPORT-2026-11-16.md
 *     inside BEGIN DEFERRED ... ROLLBACK, and verifies exact pre/post SHA-256 equality
 *     and zero -wal/-shm/-journal sidecar creation.
 */

import { createHash, randomBytes } from 'node:crypto';
import {
  closeSync,
  existsSync,
  lstatSync,
  openSync,
  readFileSync,
  readSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, resolve, win32 } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  APPROVED_D02_TARGET,
  AUDIT_GENESIS_CHECKSUM,
  CANDIDATE_D02_TABLES,
  DESIGNATED_IPD_NAMED_PIPE,
  DESIGNATED_WINDOWS_DB_PATH,
  ESTABLISHED_S1_TUPLE,
  OPERATOR_PACKAGE_VERSION,
  PINNED_REPOSITORY_MIGRATIONS,
  Q01_TO_Q14_CATALOG,
  REQUIRED_CORE_SCHEMA_TABLES,
  SOURCE_REPORT_PATH,
  SOURCE_REPORT_SHA256,
} from './d02-d5-d16-query-catalog.mjs';

const EXIT_OK = 0;
const EXIT_PRECONDITION_FAILED = 2;
const EXIT_POSTCONDITION_OR_INTEGRITY_FAILED = 3;

const SQLITE_HEADER_MAGIC = 'SQLite format 3\0';
const MINIMUM_NODE_VERSION = Object.freeze({ major: 22, minor: 13, patch: 0 });

const FORBIDDEN_SQL_VERBS_OUTSIDE_QUOTES =
  /\b(INSERT|UPDATE|DELETE|REPLACE|UPSERT|CREATE|ALTER|DROP|TRUNCATE|VACUUM|REINDEX|ATTACH|DETACH|ANALYZE|SAVEPOINT|RELEASE|COMMIT|BEGIN)\b/i;

function sha256Text(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function sha256Buffer(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function writeJsonUtf8(filePath, payload) {
  writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, { encoding: 'utf8' });
}

function writeTextUtf8(filePath, content) {
  writeFileSync(filePath, content, { encoding: 'utf8' });
}

function parseCliArgs(argv) {
  const parsed = {
    mode: '',
    dbPath: '',
    evidenceDir: '',
    psPreflightFile: '',
  };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith('--mode=')) {
      parsed.mode = token.slice('--mode='.length);
      continue;
    }
    if (token === '--mode' && i + 1 < argv.length) {
      parsed.mode = argv[i + 1];
      i += 1;
      continue;
    }
    if (token.startsWith('--db-path=')) {
      parsed.dbPath = token.slice('--db-path='.length);
      continue;
    }
    if (token === '--db-path' && i + 1 < argv.length) {
      parsed.dbPath = argv[i + 1];
      i += 1;
      continue;
    }
    if (token.startsWith('--evidence-dir=')) {
      parsed.evidenceDir = token.slice('--evidence-dir='.length);
      continue;
    }
    if (token === '--evidence-dir' && i + 1 < argv.length) {
      parsed.evidenceDir = argv[i + 1];
      i += 1;
      continue;
    }
    if (token.startsWith('--ps-preflight-file=')) {
      parsed.psPreflightFile = token.slice('--ps-preflight-file='.length);
      continue;
    }
    if (token === '--ps-preflight-file' && i + 1 < argv.length) {
      parsed.psPreflightFile = argv[i + 1];
      i += 1;
      continue;
    }
    throw new Error(`UNRECOGNIZED_ARGUMENT: ${token}`);
  }
  return parsed;
}

function parseNodeSemver(versionString) {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(versionString);
  if (!match) {
    return null;
  }
  return {
    major: Number.parseInt(match[1], 10),
    minor: Number.parseInt(match[2], 10),
    patch: Number.parseInt(match[3], 10),
  };
}

function isNodeVersionAtLeast(actual, minimum) {
  if (!actual) return false;
  if (actual.major !== minimum.major) return actual.major > minimum.major;
  if (actual.minor !== minimum.minor) return actual.minor > minimum.minor;
  return actual.patch >= minimum.patch;
}

function stripSingleQuotedSqlLiterals(sql) {
  return sql.replace(/'(?:''|[^'])*'/g, "''");
}

function assertApprovedReadOnlySql(entry) {
  if (!entry || typeof entry.sql !== 'string' || entry.sql.trim().length === 0) {
    throw new Error(`CATALOG_SQL_EMPTY: ${entry?.statementId ?? 'UNKNOWN'}`);
  }
  const trimmed = entry.sql.trim();
  const isApprovedSelect = /^SELECT\s+/i.test(trimmed);
  const isApprovedPragma =
    trimmed === 'PRAGMA integrity_check;' ||
    trimmed === 'PRAGMA foreign_key_check;' ||
    trimmed === 'PRAGMA query_only;';
  if (!isApprovedSelect && !isApprovedPragma) {
    throw new Error(`CATALOG_SQL_DISALLOWED_PREFIX: ${entry.statementId}`);
  }
  const unquoted = stripSingleQuotedSqlLiterals(trimmed);
  if (FORBIDDEN_SQL_VERBS_OUTSIDE_QUOTES.test(unquoted)) {
    throw new Error(`CATALOG_SQL_FORBIDDEN_VERB: ${entry.statementId}`);
  }
  const semicolons = [...unquoted].filter((ch) => ch === ';').length;
  if (semicolons !== 1 || !trimmed.endsWith(';')) {
    throw new Error(`CATALOG_SQL_MULTI_STATEMENT_OR_UNTERMINATED: ${entry.statementId}`);
  }
}

function normalizeSqlValue(value) {
  if (typeof value === 'bigint') {
    const asNumber = Number(value);
    return Number.isSafeInteger(asNumber) ? asNumber : value.toString();
  }
  if (value instanceof Uint8Array) {
    return {
      encoding: 'hex_blob',
      byteLength: value.byteLength,
      sha256: sha256Buffer(value),
    };
  }
  return value;
}

function normalizeSqlRow(row) {
  if (!row || typeof row !== 'object') {
    return row;
  }
  const normalized = {};
  for (const key of Object.keys(row)) {
    normalized[key] = normalizeSqlValue(row[key]);
  }
  return normalized;
}

function collectScriptHashes() {
  const runnerPath = fileURLToPath(import.meta.url);
  const catalogPath = resolve(dirname(runnerPath), 'd02-d5-d16-query-catalog.mjs');
  const psScriptPath = resolve(dirname(runnerPath), 'Invoke-D02D5D16ReadOnlyInventory.ps1');
  const runnerSha256 = sha256Buffer(readFileSync(runnerPath));
  const catalogSha256 = sha256Buffer(readFileSync(catalogPath));
  const psScriptSha256 = existsSync(psScriptPath)
    ? sha256Buffer(readFileSync(psScriptPath))
    : null;
  const catalogDigest = sha256Text(
    Q01_TO_Q14_CATALOG.map((q) => `${q.statementId}\u0000${q.sql}`).join('\n---\n'),
  );
  return {
    operatorPackageVersion: OPERATOR_PACKAGE_VERSION,
    sourceReportPath: SOURCE_REPORT_PATH,
    sourceReportPinnedSha256: SOURCE_REPORT_SHA256,
    runnerFile: basename(runnerPath),
    runnerSha256,
    queryCatalogFile: basename(catalogPath),
    queryCatalogSha256: catalogSha256,
    powerShellOperatorFile: basename(psScriptPath),
    powerShellOperatorSha256: psScriptSha256,
    q01ToQ14CombinedSqlSha256: catalogDigest,
    statementCount: Q01_TO_Q14_CATALOG.length,
  };
}

async function runNodeSqliteCapabilityProbe(evidenceDir) {
  const startedAtUtc = new Date().toISOString();
  const parsedNodeVersion = parseNodeSemver(process.versions.node);
  const probeReport = {
    probeVersion: OPERATOR_PACKAGE_VERSION,
    startedAtUtc,
    completedAtUtc: null,
    passed: false,
    failureCode: null,
    failureDetail: null,
    runtime: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.versions.node,
      minimumRequiredNodeVersion: `${MINIMUM_NODE_VERSION.major}.${MINIMUM_NODE_VERSION.minor}.${MINIMUM_NODE_VERSION.patch}`,
      execPath: process.execPath,
      pid: process.pid,
      sqliteVersion: null,
    },
    checks: {
      isWindowsHost: process.platform === 'win32',
      nodeVersionSupported: isNodeVersionAtLeast(parsedNodeVersion, MINIMUM_NODE_VERSION),
      nodeSqliteImportSucceeded: false,
      databaseSyncExportAvailable: false,
      memoryQueryOnlyPragmaReturnsOne: false,
      memoryQueryOnlyBlocksDdlWrite: false,
      readOnlyOpenMissingFileThrowsWithoutCreatingFile: false,
      readOnlyOpenMissingFileCreatedZeroSidecars: false,
    },
  };

  if (!probeReport.checks.isWindowsHost) {
    probeReport.failureCode = 'HOST_PLATFORM_UNSUPPORTED';
    probeReport.failureDetail =
      `D02 D5/D16 live inventory runner requires Windows (win32); observed platform='${process.platform}'.`;
    probeReport.completedAtUtc = new Date().toISOString();
    return { probeReport, DatabaseSync: null };
  }

  if (!probeReport.checks.nodeVersionSupported) {
    probeReport.failureCode = 'NODE_VERSION_UNSUPPORTED';
    probeReport.failureDetail =
      `Node.js >= 22.13.0 is required for verified node:sqlite readOnly support; observed '${process.versions.node}'.`;
    probeReport.completedAtUtc = new Date().toISOString();
    return { probeReport, DatabaseSync: null };
  }

  let sqliteModule = null;
  try {
    sqliteModule = await import('node:sqlite');
    probeReport.checks.nodeSqliteImportSucceeded = true;
  } catch (err) {
    probeReport.failureCode = 'NODE_SQLITE_IMPORT_FAILED';
    probeReport.failureDetail = err instanceof Error ? err.message : String(err);
    probeReport.completedAtUtc = new Date().toISOString();
    return { probeReport, DatabaseSync: null };
  }

  const DatabaseSync = sqliteModule?.DatabaseSync;
  if (typeof DatabaseSync !== 'function') {
    probeReport.failureCode = 'DATABASE_SYNC_UNAVAILABLE';
    probeReport.failureDetail = 'node:sqlite did not export a DatabaseSync constructor.';
    probeReport.completedAtUtc = new Date().toISOString();
    return { probeReport, DatabaseSync: null };
  }
  probeReport.checks.databaseSyncExportAvailable = true;

  let memDb = null;
  try {
    memDb = new DatabaseSync(':memory:');
    const verRow = memDb.prepare('SELECT sqlite_version() AS sqlite_version;').get();
    probeReport.runtime.sqliteVersion = verRow?.sqlite_version ?? null;
    memDb.exec('PRAGMA query_only = ON;');
    memDb.exec('PRAGMA temp_store = MEMORY;');
    const qoRow = memDb.prepare('PRAGMA query_only;').get();
    probeReport.checks.memoryQueryOnlyPragmaReturnsOne = Number(qoRow?.query_only) === 1;

    let writeBlocked = false;
    try {
      memDb.exec('CREATE TABLE _d02_ro_probe (id INTEGER PRIMARY KEY);');
    } catch {
      writeBlocked = true;
    }
    probeReport.checks.memoryQueryOnlyBlocksDdlWrite = writeBlocked;
  } catch (err) {
    probeReport.failureCode = 'MEMORY_SQLITE_PROBE_FAILED';
    probeReport.failureDetail = err instanceof Error ? err.message : String(err);
    probeReport.completedAtUtc = new Date().toISOString();
    return { probeReport, DatabaseSync: null };
  } finally {
    if (memDb) {
      try {
        memDb.close();
      } catch {
        // Ignore close error on in-memory probe connection.
      }
    }
  }

  if (
    !probeReport.checks.memoryQueryOnlyPragmaReturnsOne ||
    !probeReport.checks.memoryQueryOnlyBlocksDdlWrite
  ) {
    probeReport.failureCode = 'QUERY_ONLY_ENFORCEMENT_FAILED';
    probeReport.failureDetail =
      'PRAGMA query_only = ON did not report 1 or failed to block DDL mutation on :memory: probe.';
    probeReport.completedAtUtc = new Date().toISOString();
    return { probeReport, DatabaseSync: null };
  }

  const probeFileName = `_nonexistent_ro_api_probe_${randomBytes(8).toString('hex')}.sqlite`;
  const probeFilePath = resolve(evidenceDir, probeFileName);
  let missingFileThrew = false;
  let unexpectedDb = null;
  try {
    unexpectedDb = new DatabaseSync(probeFilePath, { open: true, readOnly: true });
  } catch {
    missingFileThrew = true;
  } finally {
    if (unexpectedDb) {
      try {
        unexpectedDb.close();
      } catch {
        // Ignore close error if constructor unexpectedly returned.
      }
    }
  }

  const fileCreated = existsSync(probeFilePath);
  const sidecarsCreated =
    existsSync(`${probeFilePath}-wal`) ||
    existsSync(`${probeFilePath}-shm`) ||
    existsSync(`${probeFilePath}-journal`);

  probeReport.checks.readOnlyOpenMissingFileThrowsWithoutCreatingFile =
    missingFileThrew && !fileCreated;
  probeReport.checks.readOnlyOpenMissingFileCreatedZeroSidecars = !sidecarsCreated;

  if (
    !probeReport.checks.readOnlyOpenMissingFileThrowsWithoutCreatingFile ||
    !probeReport.checks.readOnlyOpenMissingFileCreatedZeroSidecars
  ) {
    probeReport.failureCode = 'READONLY_OPEN_API_CONTRACT_FAILED';
    probeReport.failureDetail =
      'DatabaseSync(missingPath, { open: true, readOnly: true }) did not enforce SQLITE_OPEN_READONLY without file creation.';
    probeReport.completedAtUtc = new Date().toISOString();
    return { probeReport, DatabaseSync: null };
  }

  probeReport.passed = true;
  probeReport.completedAtUtc = new Date().toISOString();
  return { probeReport, DatabaseSync };
}

function inspectDisallowedSidecars(dbPath) {
  const parentDir = dirname(dbPath);
  const dbBaseName = basename(dbPath);
  const explicitCandidates = [
    { suffix: '-wal', path: `${dbPath}-wal` },
    { suffix: '-shm', path: `${dbPath}-shm` },
    { suffix: '-journal', path: `${dbPath}-journal` },
  ];
  const detected = [];
  for (const candidate of explicitCandidates) {
    if (existsSync(candidate.path)) {
      let sizeBytes = null;
      try {
        sizeBytes = lstatSync(candidate.path).size;
      } catch {
        sizeBytes = null;
      }
      detected.push({
        kind: candidate.suffix,
        name: basename(candidate.path),
        sizeBytes,
      });
    }
  }
  if (existsSync(parentDir)) {
    const entries = readdirSync(parentDir);
    const lowerBase = dbBaseName.toLowerCase();
    for (const entryName of entries) {
      const lowerEntry = entryName.toLowerCase();
      const isAuxiliarySidecar =
        lowerEntry === `${lowerBase}-wal` ||
        lowerEntry === `${lowerBase}-shm` ||
        lowerEntry === `${lowerBase}-journal` ||
        lowerEntry.startsWith(`${lowerBase}-mj`);
      if (isAuxiliarySidecar && !detected.some((d) => d.name.toLowerCase() === lowerEntry)) {
        let sizeBytes = null;
        try {
          sizeBytes = lstatSync(resolve(parentDir, entryName)).size;
        } catch {
          sizeBytes = null;
        }
        detected.push({
          kind: 'directory_scan_sidecar',
          name: entryName,
          sizeBytes,
        });
      }
    }
  }
  return {
    checkedAtUtc: new Date().toISOString(),
    anySidecarPresent: detected.length > 0,
    detectedSidecars: detected,
  };
}

function inspectDatabaseFileReadOnly(dbPath, parseHeader) {
  const lstat = lstatSync(dbPath);
  if (!lstat.isFile() || lstat.isSymbolicLink()) {
    throw new Error('TARGET_DB_NOT_REGULAR_FILE_OR_SYMLINK');
  }
  const fd = openSync(dbPath, 'r');
  try {
    const hash = createHash('sha256');
    const headerBuffer = Buffer.alloc(100);
    let headerBytesRead = 0;
    const chunkBuffer = Buffer.allocUnsafe(1024 * 1024);
    let totalBytesRead = 0;

    while (true) {
      const bytesRead = readSync(fd, chunkBuffer, 0, chunkBuffer.length, null);
      if (bytesRead <= 0) {
        break;
      }
      if (headerBytesRead < 100) {
        const copyLen = Math.min(100 - headerBytesRead, bytesRead);
        chunkBuffer.copy(headerBuffer, headerBytesRead, 0, copyLen);
        headerBytesRead += copyLen;
      }
      hash.update(chunkBuffer.subarray(0, bytesRead));
      totalBytesRead += bytesRead;
    }

    let headerInfo = null;
    if (parseHeader) {
      if (headerBytesRead < 100) {
        throw new Error(`INVALID_SQLITE_HEADER_TOO_SHORT: ${headerBytesRead} bytes`);
      }
      const magic = headerBuffer.subarray(0, 16).toString('latin1');
      const rawPageSize = headerBuffer.readUInt16BE(16);
      const pageSize = rawPageSize === 1 ? 65536 : rawPageSize;
      const writeVersion = headerBuffer.readUInt8(18);
      const readVersion = headerBuffer.readUInt8(19);
      const reservedBytesPerPage = headerBuffer.readUInt8(20);
      const fileChangeCounter = headerBuffer.readUInt32BE(24);
      const databaseSizeInPages = headerBuffer.readUInt32BE(28);
      const schemaCookie = headerBuffer.readUInt32BE(40);
      const schemaFormatNumber = headerBuffer.readUInt32BE(44);
      const userVersion = headerBuffer.readUInt32BE(60);
      const applicationId = headerBuffer.readUInt32BE(68);
      const sqliteVersionNumber = headerBuffer.readUInt32BE(96);

      const isPowerOfTwo = (pageSize & (pageSize - 1)) === 0;
      const validPageSize = pageSize >= 512 && pageSize <= 65536 && isPowerOfTwo;
      headerInfo = {
        magicValid: magic === SQLITE_HEADER_MAGIC,
        pageSizeBytes: pageSize,
        validPageSize,
        fileFormatWriteVersion: writeVersion,
        fileFormatReadVersion: readVersion,
        isLegacyRollbackFormat: writeVersion === 1 && readVersion === 1,
        isWalFormatFlaggedInHeader: writeVersion === 2 || readVersion === 2,
        reservedBytesPerPage,
        fileChangeCounter,
        databaseSizeInPages,
        schemaCookie,
        schemaFormatNumber,
        userVersion,
        applicationId,
        sqliteVersionNumber,
      };
    }

    return {
      inspectedAtUtc: new Date().toISOString(),
      sizeBytes: lstat.size,
      streamedBytes: totalBytesRead,
      sha256: hash.digest('hex'),
      mtimeMs: lstat.mtimeMs,
      mtimeUtc: lstat.mtime.toISOString(),
      birthtimeUtc: lstat.birthtime.toISOString(),
      header: headerInfo,
    };
  } finally {
    closeSync(fd);
  }
}

function validateWindowsTargetDbPathSyntax(dbPath, evidenceDir) {
  if (!dbPath || typeof dbPath !== 'string') {
    return { ok: false, code: 'DB_PATH_EMPTY', detail: 'Database path is empty.' };
  }
  if (/[\x00-\x1f]/.test(dbPath)) {
    return {
      ok: false,
      code: 'DB_PATH_CONTROL_CHARS',
      detail: 'Database path contains NUL or control characters.',
    };
  }
  if (!/^[A-Za-z]:\\/.test(dbPath)) {
    return {
      ok: false,
      code: 'DB_PATH_NOT_DRIVE_QUALIFIED',
      detail: 'Database path must be a Windows drive-letter absolute path (e.g. C:\\iips-data\\iips\\user-portfolio.sqlite).',
    };
  }
  const segments = dbPath.split(/[\\/]+/);
  if (segments.includes('..')) {
    return {
      ok: false,
      code: 'DB_PATH_TRAVERSAL_DISALLOWED',
      detail: 'Database path must not contain parent-directory (..) traversal segments.',
    };
  }
  const normalizedDbDir = win32.normalize(win32.dirname(dbPath)).toLowerCase();
  const normalizedEvidenceDir = win32.normalize(evidenceDir).toLowerCase();
  if (
    normalizedEvidenceDir === normalizedDbDir ||
    normalizedEvidenceDir.startsWith(`${normalizedDbDir}\\`) ||
    normalizedDbDir.startsWith(`${normalizedEvidenceDir}\\`)
  ) {
    return {
      ok: false,
      code: 'EVIDENCE_DIR_OVERLAPS_DB_DIRECTORY',
      detail: 'Evidence directory must not equal or overlap the live SQLite parent directory.',
    };
  }
  return { ok: true, code: 'OK', detail: null };
}

function verifyAuditEventsChainInMemory(rows) {
  let expectedPrev = AUDIT_GENESIS_CHECKSUM;
  let expectedSequenceId = 1;
  let firstFailure = null;

  for (let idx = 0; idx < rows.length; idx += 1) {
    const row = rows[idx];
    const rowId = Number(row.id);
    if (rowId !== expectedSequenceId) {
      firstFailure = {
        rowIndex: idx,
        rowId: row.id ?? null,
        reason: 'NON_CONTIGUOUS_AUDIT_SEQUENCE_ID',
        expectedId: expectedSequenceId,
        actualId: row.id ?? null,
      };
      break;
    }
    if (row.prev_checksum !== expectedPrev) {
      firstFailure = {
        rowIndex: idx,
        rowId,
        reason: 'PREV_CHECKSUM_MISMATCH',
        expectedPrevChecksum: expectedPrev,
        actualPrevChecksum: row.prev_checksum ?? null,
      };
      break;
    }
    let parsedDetail;
    try {
      parsedDetail = JSON.parse(String(row.detail_json));
    } catch {
      firstFailure = {
        rowIndex: idx,
        rowId,
        reason: 'INVALID_DETAIL_JSON',
      };
      break;
    }
    const recomputedChecksum = sha256Text(
      [
        expectedPrev,
        String(row.event_type),
        String(row.subject_type),
        String(row.subject_id),
        JSON.stringify(parsedDetail),
        String(row.created_at),
      ].join('\u0000'),
    );
    if (row.entry_checksum !== recomputedChecksum) {
      firstFailure = {
        rowIndex: idx,
        rowId,
        reason: 'ENTRY_CHECKSUM_MISMATCH',
        expectedEntryChecksum: recomputedChecksum,
        actualEntryChecksum: row.entry_checksum ?? null,
      };
      break;
    }
    expectedPrev = row.entry_checksum;
    expectedSequenceId += 1;
  }

  return {
    verifiedInMemory: firstFailure === null,
    genesisChecksum: AUDIT_GENESIS_CHECKSUM,
    totalRowsVerified: firstFailure ? firstFailure.rowIndex : rows.length,
    totalRowsRead: rows.length,
    terminalChecksum: rows.length > 0 ? String(rows[rows.length - 1].entry_checksum) : AUDIT_GENESIS_CHECKSUM,
    firstFailure,
  };
}

function buildDerivedAnalyses(queryMap, auditVerification) {
  const rowsOf = (id) => (Array.isArray(queryMap[id]?.rows) ? queryMap[id].rows : []);

  const q01Rows = rowsOf('Q01');
  const q02Rows = rowsOf('Q02');
  const q03aRows = rowsOf('Q03a');
  const q03bRows = rowsOf('Q03b');
  const q04aRows = rowsOf('Q04a');
  const q04bRows = rowsOf('Q04b');
  const q05aRows = rowsOf('Q05a');
  const q05bRows = rowsOf('Q05b');
  const q06Rows = rowsOf('Q06');
  const q07Rows = rowsOf('Q07');
  const q08Rows = rowsOf('Q08');
  const q09Rows = rowsOf('Q09');
  const q10Rows = rowsOf('Q10');
  const q11aRows = rowsOf('Q11a');
  const q11bRows = rowsOf('Q11b');
  const q11cRows = rowsOf('Q11c');
  const q12aRows = rowsOf('Q12a');
  const q12bRows = rowsOf('Q12b');
  const q12cRows = rowsOf('Q12c');
  const q14Rows = rowsOf('Q14');

  // 1. Migration ledger & schema analysis
  const pinnedMap = new Map(
    PINNED_REPOSITORY_MIGRATIONS.map((m) => [m.migrationId, m.expectedChecksum]),
  );
  const ledgerComparison = q01Rows.map((row) => {
    const expectedChecksum = pinnedMap.get(String(row.migration_id)) ?? null;
    let status = 'UNKNOWN_MIGRATION_ID';
    if (expectedChecksum !== null) {
      status = row.checksum === expectedChecksum ? 'EXACT_MATCH' : 'CHECKSUM_DRIFT';
    }
    return {
      migrationId: row.migration_id,
      observedChecksum: row.checksum,
      expectedRepositoryChecksum: expectedChecksum,
      appliedAt: row.applied_at,
      comparisonStatus: status,
    };
  });

  const observedMigrationIds = new Set(q01Rows.map((r) => String(r.migration_id)));
  const missingRepositoryMigrations = PINNED_REPOSITORY_MIGRATIONS.filter(
    (m) => !observedMigrationIds.has(m.migrationId),
  ).map((m) => m.migrationId);

  const presentTables = q02Rows
    .filter((r) => r.type === 'table')
    .map((r) => String(r.name));
  const presentTableSet = new Set(presentTables);
  const missingRequiredCoreTables = REQUIRED_CORE_SCHEMA_TABLES.filter(
    (name) => !presentTableSet.has(name),
  );
  const detectedCandidateD02Tables = CANDIDATE_D02_TABLES.filter((name) =>
    presentTableSet.has(name),
  );

  const integrityCheckValues = q03aRows.map((r) => Object.values(r)[0]);
  const integrityCheckPassed =
    integrityCheckValues.length === 1 &&
    String(integrityCheckValues[0]).toLowerCase() === 'ok';
  const foreignKeyCheckPassed = q03bRows.length === 0;
  const queryOnlySnapshotVerified =
    q14Rows.length === 1 && Number(Object.values(q14Rows[0])[0]) === 1;

  const migrationAndSchemaEvidence = {
    appliedMigrationCount: q01Rows.length,
    ledgerComparison,
    allAppliedChecksumsMatchRepository: ledgerComparison.every(
      (entry) => entry.comparisonStatus === 'EXACT_MATCH',
    ),
    missingRepositoryMigrations,
    migration006PortfolioRestoreApplied: observedMigrationIds.has('006_portfolio_restore'),
    portfolioRestoreReceiptsTablePresent: presentTableSet.has('portfolio_restore_receipts'),
    schemaObjectsByType: q02Rows.reduce((acc, row) => {
      const k = String(row.type);
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {}),
    presentTables,
    missingRequiredCoreTables,
    candidateD02TablesChecked: CANDIDATE_D02_TABLES,
    detectedCandidateD02Tables,
    d02LedgerSchemaState:
      detectedCandidateD02Tables.length === 0
        ? 'NO_D02_LEDGER_TABLES_PRESENT'
        : 'UNEXPECTED_CANDIDATE_D02_TABLES_PRESENT',
    integrityCheck: {
      passed: integrityCheckPassed,
      rows: q03aRows,
    },
    foreignKeyCheck: {
      passed: foreignKeyCheckPassed,
      violationCount: q03bRows.length,
      violations: q03bRows,
    },
    queryOnlyPragmaInsideSnapshot: {
      verified: queryOnlySnapshotVerified,
      rows: q14Rows,
    },
  };

  // 2. Principal bindings, memberships, portfolios, revisions, holdings, contributions, relationships
  const activeBindings = q04aRows.filter((b) => b.status === 'ACTIVE');
  const activeMemberships = q04bRows.filter((m) => m.status === 'ACTIVE');

  let activeIdentityState = 'MULTIPLE_OR_INCONSISTENT_ACTIVE_ROWS';
  if (activeBindings.length === 0 && activeMemberships.length === 0) {
    activeIdentityState = 'UNPROVISIONED_ZERO_ACTIVE_ROWS';
  } else if (activeBindings.length === 1 && activeMemberships.length === 1) {
    const ab = activeBindings[0];
    const am = activeMemberships[0];
    const matchesS1 =
      ab.binding_id === ESTABLISHED_S1_TUPLE.bindingId &&
      ab.principal_label === ESTABLISHED_S1_TUPLE.principalLabel &&
      am.membership_id === ESTABLISHED_S1_TUPLE.membershipId &&
      am.binding_id === ESTABLISHED_S1_TUPLE.bindingId &&
      am.tenant_id === ESTABLISHED_S1_TUPLE.tenantId &&
      am.canonical_owner_id === ESTABLISHED_S1_TUPLE.canonicalOwnerId;
    const matchesD02Target =
      am.binding_id === ab.binding_id &&
      am.tenant_id === APPROVED_D02_TARGET.tenantId &&
      am.canonical_owner_id === APPROVED_D02_TARGET.canonicalOwnerId;
    if (matchesS1) {
      activeIdentityState = 'ACTIVE_ESTABLISHED_S1_TUPLE';
    } else if (matchesD02Target) {
      activeIdentityState = 'ACTIVE_APPROVED_D02_TARGET_OWNER';
    } else {
      activeIdentityState = 'ACTIVE_OTHER_OR_CUSTOM_TUPLE';
    }
  }

  const sanitizedBindings = q04aRows.map((b) => ({
    bindingId: b.binding_id,
    matchesEstablishedS1BindingId: b.binding_id === ESTABLISHED_S1_TUPLE.bindingId,
    matchesEstablishedS1PrincipalLabel:
      b.principal_label === ESTABLISHED_S1_TUPLE.principalLabel,
    status: b.status,
    createdAt: b.created_at,
    updatedAt: b.updated_at,
    revokedAt: b.revoked_at,
  }));

  const sanitizedMemberships = q04bRows.map((m) => ({
    membershipId: m.membership_id,
    bindingId: m.binding_id,
    tenantId: m.tenant_id,
    canonicalOwnerId: m.canonical_owner_id,
    status: m.status,
    parentBindingStatus: m.parent_binding_status,
    matchesEstablishedS1Tuple:
      m.membership_id === ESTABLISHED_S1_TUPLE.membershipId &&
      m.binding_id === ESTABLISHED_S1_TUPLE.bindingId &&
      m.tenant_id === ESTABLISHED_S1_TUPLE.tenantId &&
      m.canonical_owner_id === ESTABLISHED_S1_TUPLE.canonicalOwnerId,
    matchesApprovedD02TargetOwnerAndTenant:
      m.canonical_owner_id === APPROVED_D02_TARGET.canonicalOwnerId &&
      m.tenant_id === APPROVED_D02_TARGET.tenantId,
    createdAt: m.created_at,
    updatedAt: m.updated_at,
    revokedAt: m.revoked_at,
  }));

  const portfolioClassificationCounts = {
    CANDIDATE_S1_HISTORICAL_PORTFOLIO: 0,
    EXISTING_D02_OWNER_PORTFOLIO: 0,
    UNRESOLVED_OTHER_OWNER_OR_TENANT: 0,
  };
  const portfolioByOwnerTenantStatus = new Map();
  const distinctPortfolioOwners = new Set();
  const distinctPortfolioTenants = new Set();

  for (const p of q06Rows) {
    const cls = String(p.d16_classification);
    portfolioClassificationCounts[cls] = (portfolioClassificationCounts[cls] ?? 0) + 1;
    distinctPortfolioOwners.add(String(p.canonical_owner_id));
    distinctPortfolioTenants.add(String(p.tenant_id));
    const key = `${p.canonical_owner_id}\u0000${p.tenant_id}\u0000${p.status}\u0000${cls}`;
    const prev = portfolioByOwnerTenantStatus.get(key) ?? {
      canonicalOwnerId: p.canonical_owner_id,
      tenantId: p.tenant_id,
      status: p.status,
      d16Classification: cls,
      portfolioCount: 0,
    };
    prev.portfolioCount += 1;
    portfolioByOwnerTenantStatus.set(key, prev);
  }

  // Index revisions, holdings, contributions, and restore receipts by (canonical_owner_id, portfolio_id)
  const revisionsByPortfolioKey = new Map();
  for (const r of q07Rows) {
    const k = `${r.canonical_owner_id}\u0000${r.portfolio_id}`;
    const arr = revisionsByPortfolioKey.get(k) ?? [];
    arr.push(r);
    revisionsByPortfolioKey.set(k, arr);
  }

  const holdingsGroupsByPortfolioKey = new Map();
  let totalHoldingRowsAcrossAllRevisions = 0;
  let totalActiveHoldingRowsAcrossAllRevisions = 0;
  let totalNullSecurityIdentityHoldingRows = 0;
  let totalPopulatedSecurityIdentityHoldingRows = 0;

  for (const h of q08Rows) {
    const k = `${h.canonical_owner_id}\u0000${h.portfolio_id}`;
    const arr = holdingsGroupsByPortfolioKey.get(k) ?? [];
    arr.push(h);
    holdingsGroupsByPortfolioKey.set(k, arr);
    const count = Number(h.holding_rows ?? 0);
    totalHoldingRowsAcrossAllRevisions += count;
    if (Number(h.active) === 1) {
      totalActiveHoldingRowsAcrossAllRevisions += count;
    }
    if (h.security_identity_state === 'NULL') {
      totalNullSecurityIdentityHoldingRows += count;
    } else {
      totalPopulatedSecurityIdentityHoldingRows += count;
    }
  }

  const contributionsByPortfolioKey = new Map();
  const contributionNullCounts = {
    totalContributions: q09Rows.length,
    fileNameIsNullCount: 0,
    sourceBrokerIsNullCount: 0,
    contentDigestIsNullCount: 0,
    lineageDigestIsNullCount: 0,
    importedAtIsNullCount: 0,
    semanticsIsNullCount: 0,
    rowsWithAnyNull004ProvenanceField: 0,
    rowsWithAll004ProvenanceFieldsPopulated: 0,
  };

  for (const c of q09Rows) {
    const k = `${c.canonical_owner_id}\u0000${c.portfolio_id}`;
    const arr = contributionsByPortfolioKey.get(k) ?? [];
    arr.push(c);
    contributionsByPortfolioKey.set(k, arr);

    const fnNull = Number(c.file_name_is_null) === 1;
    const sbNull = Number(c.source_broker_is_null) === 1;
    const cdNull = Number(c.content_digest_is_null) === 1;
    const ldNull = Number(c.lineage_digest_is_null) === 1;
    const iaNull = Number(c.imported_at_is_null) === 1;
    const semNull = Number(c.semantics_is_null) === 1;
    if (fnNull) contributionNullCounts.fileNameIsNullCount += 1;
    if (sbNull) contributionNullCounts.sourceBrokerIsNullCount += 1;
    if (cdNull) contributionNullCounts.contentDigestIsNullCount += 1;
    if (ldNull) contributionNullCounts.lineageDigestIsNullCount += 1;
    if (iaNull) contributionNullCounts.importedAtIsNullCount += 1;
    if (semNull) contributionNullCounts.semanticsIsNullCount += 1;

    const any004Null = cdNull || ldNull || iaNull || semNull;
    if (any004Null) {
      contributionNullCounts.rowsWithAnyNull004ProvenanceField += 1;
    } else {
      contributionNullCounts.rowsWithAll004ProvenanceFieldsPopulated += 1;
    }
  }

  // Distinct owner/tenant relationship matrix across all tables
  const allOwnerIds = new Set([
    ...q04bRows.map((r) => String(r.canonical_owner_id)),
    ...q06Rows.map((r) => String(r.canonical_owner_id)),
    ...q07Rows.map((r) => String(r.canonical_owner_id)),
    ...q08Rows.map((r) => String(r.canonical_owner_id)),
    ...q09Rows.map((r) => String(r.canonical_owner_id)),
    ...q10Rows.map((r) => String(r.canonical_owner_id)),
  ]);

  const ownerRelationshipSummary = [...allOwnerIds].sort().map((ownerId) => {
    const membershipsForOwner = q04bRows.filter((r) => String(r.canonical_owner_id) === ownerId);
    const portfoliosForOwner = q06Rows.filter((r) => String(r.canonical_owner_id) === ownerId);
    const revisionsForOwner = q07Rows.filter((r) => String(r.canonical_owner_id) === ownerId);
    const holdingRowsForOwner = q08Rows
      .filter((r) => String(r.canonical_owner_id) === ownerId)
      .reduce((sum, r) => sum + Number(r.holding_rows ?? 0), 0);
    const contributionsForOwner = q09Rows.filter((r) => String(r.canonical_owner_id) === ownerId);
    const restoreReceiptsForOwner = q10Rows.filter((r) => String(r.canonical_owner_id) === ownerId);

    let ownerRoleClassification = 'UNRESOLVED_OTHER_OWNER';
    if (ownerId === ESTABLISHED_S1_TUPLE.canonicalOwnerId) {
      ownerRoleClassification = 'ESTABLISHED_S1_OWNER';
    } else if (ownerId === APPROVED_D02_TARGET.canonicalOwnerId) {
      ownerRoleClassification = 'APPROVED_D02_TARGET_OWNER';
    }

    return {
      canonicalOwnerId: ownerId,
      ownerRoleClassification,
      distinctTenantsInMemberships: [...new Set(membershipsForOwner.map((m) => String(m.tenant_id)))].sort(),
      distinctTenantsInPortfolios: [...new Set(portfoliosForOwner.map((p) => String(p.tenant_id)))].sort(),
      membershipCount: membershipsForOwner.length,
      activeMembershipCount: membershipsForOwner.filter((m) => m.status === 'ACTIVE').length,
      portfolioCount: portfoliosForOwner.length,
      activePortfolioCount: portfoliosForOwner.filter((p) => p.status === 'ACTIVE').length,
      tombstonedPortfolioCount: portfoliosForOwner.filter((p) => p.status === 'TOMBSTONED').length,
      revisionCount: revisionsForOwner.length,
      holdingRowCountAcrossRevisions: holdingRowsForOwner,
      contributionCount: contributionsForOwner.length,
      restoreReceiptCount: restoreReceiptsForOwner.length,
    };
  });

  const countsAndRelationships = {
    bindings: {
      totalCount: q04aRows.length,
      activeCount: activeBindings.length,
      revokedCount: q04aRows.filter((b) => b.status === 'REVOKED').length,
      rows: sanitizedBindings,
    },
    memberships: {
      totalCount: q04bRows.length,
      activeCount: activeMemberships.length,
      revokedCount: q04bRows.filter((m) => m.status === 'REVOKED').length,
      rows: sanitizedMemberships,
    },
    activeIdentityState,
    portfolios: {
      totalCount: q06Rows.length,
      activeCount: q06Rows.filter((p) => p.status === 'ACTIVE').length,
      tombstonedCount: q06Rows.filter((p) => p.status === 'TOMBSTONED').length,
      distinctCanonicalOwnerCount: distinctPortfolioOwners.size,
      distinctTenantCount: distinctPortfolioTenants.size,
      byClassification: portfolioClassificationCounts,
      byOwnerTenantStatus: [...portfolioByOwnerTenantStatus.values()],
    },
    revisions: {
      totalCount: q07Rows.length,
      byOperation: q07Rows.reduce((acc, r) => {
        const op = String(r.operation);
        acc[op] = (acc[op] ?? 0) + 1;
        return acc;
      }, {}),
    },
    holdings: {
      groupedSummaryRowCount: q08Rows.length,
      totalHoldingRowsAcrossAllRevisions,
      totalActiveHoldingRowsAcrossAllRevisions,
      totalNullSecurityIdentityHoldingRows,
      totalPopulatedSecurityIdentityHoldingRows,
      groupedRows: q08Rows,
    },
    contributions: {
      ...contributionNullCounts,
    },
    restoreReceipts: {
      queryStatus: queryMap.Q10?.status ?? 'NOT_EXECUTED',
      totalCount: q10Rows.length,
    },
    auditEvents: {
      bounds: q05aRows[0] ?? null,
      byEventAndSubjectType: q05bRows,
      hashChainVerification: auditVerification,
    },
    ownerRelationshipSummary,
  };

  // 3. Collision, duplicate, orphan, and NULL findings
  const revisionNullDigestRows = q07Rows
    .filter(
      (r) =>
        r.provenance_digest === null ||
        String(r.provenance_digest).trim() === '' ||
        r.content_digest === null ||
        String(r.content_digest).trim() === '',
    )
    .map((r) => ({
      canonicalOwnerId: r.canonical_owner_id,
      portfolioId: r.portfolio_id,
      revision: r.revision,
      operation: r.operation,
      provenanceDigestIsNullOrEmpty:
        r.provenance_digest === null || String(r.provenance_digest).trim() === '',
      contentDigestIsNullOrEmpty:
        r.content_digest === null || String(r.content_digest).trim() === '',
    }));

  const activeCountMap = Object.fromEntries(
    q11cRows.map((r) => [String(r.check_name), Number(r.active_count)]),
  );
  const partialUniqueInvariantViolated =
    (activeCountMap.ACTIVE_BINDINGS ?? 0) > 1 ||
    (activeCountMap.ACTIVE_MEMBERSHIPS ?? 0) > 1;

  const collisionDuplicateOrphanNullFindings = {
    q11aPortfolioIdCollisionsBetweenS1AndD02: {
      collisionCount: q11aRows.length,
      rows: q11aRows,
    },
    q11bDuplicateNormalizedSymbolsPerRevision: {
      duplicateGroupCount: q11bRows.length,
      rows: q11bRows,
    },
    q11cActiveBindingAndMembershipCounts: {
      activeBindingsCount: activeCountMap.ACTIVE_BINDINGS ?? null,
      activeMembershipsCount: activeCountMap.ACTIVE_MEMBERSHIPS ?? null,
      partialUniqueInvariantViolated,
      rows: q11cRows,
    },
    q12aOrphanOrInactiveParentMemberships: {
      anomalyCount: q12aRows.length,
      rows: q12aRows,
    },
    q12bCurrentRevisionPointerOrTombstoneMismatches: {
      anomalyCount: q12bRows.length,
      rows: q12bRows,
    },
    q12cDeclaredVsActualHoldingsCountMismatches: {
      anomalyCount: q12cRows.length,
      rows: q12cRows,
    },
    q03IntegrityAndForeignKeyFindings: {
      integrityCheckPassed,
      integrityCheckRows: q03aRows,
      foreignKeyViolationCount: q03bRows.length,
      foreignKeyViolations: q03bRows,
    },
    q07RevisionDigestNullOrEmptyFindings: {
      anomalyCount: revisionNullDigestRows.length,
      rows: revisionNullDigestRows,
    },
    q08HoldingSecurityIdentityObservations: {
      nullSecurityIdentityRowCount: totalNullSecurityIdentityHoldingRows,
      populatedSecurityIdentityRowCount: totalPopulatedSecurityIdentityHoldingRows,
      nonCanonicalGroups: q08Rows.filter(
        (h) => h.security_identity_state === 'NULL' || h.identity_status !== 'CANONICAL',
      ),
    },
    q09NullableContributionProvenanceFindings: contributionNullCounts,
    q13AuditChainVerification: auditVerification,
  };

  // 4. Strictly non-inferential provenance & historical-origin classifications + unresolved records
  const collisionPortfolioIdSet = new Set(q11aRows.map((r) => String(r.portfolio_id)));

  const portfolioProvenanceClassifications = q06Rows.map((p) => {
    const key = `${p.canonical_owner_id}\u0000${p.portfolio_id}`;
    const pRevs = revisionsByPortfolioKey.get(key) ?? [];
    const pHoldGroups = holdingsGroupsByPortfolioKey.get(key) ?? [];
    const pContribs = contributionsByPortfolioKey.get(key) ?? [];

    const hasS1D02PortfolioIdCollision = collisionPortfolioIdSet.has(String(p.portfolio_id));
    const contribNull004Count = pContribs.filter(
      (c) =>
        Number(c.content_digest_is_null) === 1 ||
        Number(c.lineage_digest_is_null) === 1 ||
        Number(c.imported_at_is_null) === 1 ||
        Number(c.semantics_is_null) === 1,
    ).length;
    const holdingNull005Rows = pHoldGroups
      .filter((h) => h.security_identity_state === 'NULL')
      .reduce((sum, h) => sum + Number(h.holding_rows ?? 0), 0);
    const holdingPopulated005Rows = pHoldGroups
      .filter((h) => h.security_identity_state === 'POPULATED')
      .reduce((sum, h) => sum + Number(h.holding_rows ?? 0), 0);

    let provenanceCompletenessClass = 'NO_CONTRIBUTIONS_RECORDED';
    if (pContribs.length > 0 && contribNull004Count === 0) {
      provenanceCompletenessClass = 'POST_004_PROVENANCE_POPULATED';
    } else if (pContribs.length > 0 && contribNull004Count === pContribs.length) {
      provenanceCompletenessClass = 'PRE_004_OR_UNPOPULATED_PROVENANCE_COLUMNS_NULL';
    } else if (pContribs.length > 0) {
      provenanceCompletenessClass = 'MIXED_PRE_AND_POST_004_PROVENANCE_ROWS';
    }

    let d16ActionabilityReadiness = 'REQUIRES_EXPLICIT_PRINCIPAL_AND_PA_DISPOSITION';
    if (
      p.d16_classification === 'CANDIDATE_S1_HISTORICAL_PORTFOLIO' &&
      !hasS1D02PortfolioIdCollision
    ) {
      d16ActionabilityReadiness =
        'ELIGIBLE_CANDIDATE_FOR_FUTURE_D16_DESIGN_SUBJECT_TO_PRINCIPAL_CONFIRMATION';
    } else if (
      p.d16_classification === 'EXISTING_D02_OWNER_PORTFOLIO' &&
      !hasS1D02PortfolioIdCollision
    ) {
      d16ActionabilityReadiness = 'ALREADY_UNDER_APPROVED_D02_TARGET_OWNER_NO_REKEY';
    }

    return {
      portfolioId: p.portfolio_id,
      canonicalOwnerId: p.canonical_owner_id,
      tenantId: p.tenant_id,
      status: p.status,
      currentRevision: p.current_revision,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      deletedAt: p.deleted_at,
      d16Classification: p.d16_classification,
      hasS1D02PortfolioIdCollision,
      revisionCount: pRevs.length,
      contributionCount: pContribs.length,
      contributionsWithNull004ProvenanceCount: contribNull004Count,
      provenanceCompletenessClass,
      holdingRowsWithPopulated005SecurityIdentity: holdingPopulated005Rows,
      holdingRowsWithNull005SecurityIdentity: holdingNull005Rows,
      d16ActionabilityReadiness,
      classificationBasis:
        'EXPLICIT_SQL_COLUMN_EQUALITY_ONLY (canonical_owner_id, tenant_id, status, nullable column flags); ZERO_INFERENCE_FROM_NAMES_BROKERS_FILES_OR_SYMBOLS',
    };
  });

  const unresolvedRecords = [];

  for (const p of q06Rows) {
    if (p.d16_classification === 'UNRESOLVED_OTHER_OWNER_OR_TENANT') {
      unresolvedRecords.push({
        category: 'UNRESOLVED_PORTFOLIO_OWNER_OR_TENANT',
        severity: 'BLOCKER',
        recordKey: {
          canonicalOwnerId: p.canonical_owner_id,
          tenantId: p.tenant_id,
          portfolioId: p.portfolio_id,
          status: p.status,
        },
        reason:
          'Portfolio row belongs neither to established S1 tuple (ipd-owner-ramki-personal / ipd-personal-local) nor to approved D02 target tuple (owner-4dc756b3 / ipd-personal-local). Ownership is never inferred.',
      });
    }
  }

  for (const col of q11aRows) {
    unresolvedRecords.push({
      category: 'S1_VS_D02_PORTFOLIO_ID_COLLISION',
      severity: 'BLOCKER',
      recordKey: {
        portfolioId: col.portfolio_id,
        s1Status: col.s1_status,
        s1Revision: col.s1_revision,
        d02Status: col.d02_status,
        d02Revision: col.d02_revision,
      },
      reason:
        'Identical portfolio_id exists under both ipd-owner-ramki-personal and owner-4dc756b3; silent merge or overwrite is prohibited.',
    });
  }

  for (const m of q04bRows) {
    const isKnownS1 =
      m.canonical_owner_id === ESTABLISHED_S1_TUPLE.canonicalOwnerId &&
      m.tenant_id === ESTABLISHED_S1_TUPLE.tenantId;
    const isKnownD02 =
      m.canonical_owner_id === APPROVED_D02_TARGET.canonicalOwnerId &&
      m.tenant_id === APPROVED_D02_TARGET.tenantId;
    if (!isKnownS1 && !isKnownD02) {
      unresolvedRecords.push({
        category: 'UNRESOLVED_MEMBERSHIP_OWNER_OR_TENANT',
        severity: 'BLOCKER',
        recordKey: {
          membershipId: m.membership_id,
          bindingId: m.binding_id,
          canonicalOwnerId: m.canonical_owner_id,
          tenantId: m.tenant_id,
          status: m.status,
        },
        reason:
          'Membership row references an owner/tenant outside established S1 and approved D02 target tuples.',
      });
    }
  }

  if (partialUniqueInvariantViolated) {
    unresolvedRecords.push({
      category: 'MULTIPLE_ACTIVE_BINDINGS_OR_MEMBERSHIPS',
      severity: 'BLOCKER',
      recordKey: activeCountMap,
      reason: 'More than one ACTIVE binding or ACTIVE membership row exists in SQLite.',
    });
  }

  for (const orphan of q12aRows) {
    unresolvedRecords.push({
      category: 'ORPHAN_OR_INACTIVE_PARENT_MEMBERSHIP',
      severity: 'BLOCKER',
      recordKey: orphan,
      reason: 'Membership references missing binding or is ACTIVE under a non-ACTIVE binding.',
    });
  }

  for (const ptr of q12bRows) {
    unresolvedRecords.push({
      category: 'PORTFOLIO_CURRENT_REVISION_OR_TOMBSTONE_ANOMALY',
      severity: 'BLOCKER',
      recordKey: ptr,
      reason: 'Portfolio current_revision pointer or TOMBSTONED/ACTIVE state disagrees with portfolio_revisions.',
    });
  }

  for (const hc of q12cRows) {
    unresolvedRecords.push({
      category: 'REVISION_DECLARED_VS_ACTUAL_HOLDINGS_MISMATCH',
      severity: 'BLOCKER',
      recordKey: hc,
      reason: 'portfolio_revisions.holdings_count disagrees with actual portfolio_holdings row count.',
    });
  }

  for (const dup of q11bRows) {
    unresolvedRecords.push({
      category: 'DUPLICATE_NORMALIZED_HOLDING_SYMBOL_IN_REVISION',
      severity: 'BLOCKER',
      recordKey: dup,
      reason: 'Multiple holding rows share upper(trim(symbol)) within the same (canonical_owner_id, portfolio_id, revision).',
    });
  }

  for (const mig of ledgerComparison) {
    if (mig.comparisonStatus !== 'EXACT_MATCH') {
      unresolvedRecords.push({
        category: 'MIGRATION_LEDGER_DRIFT_OR_UNKNOWN_ID',
        severity: 'BLOCKER',
        recordKey: mig,
        reason: '_migration_ledger row does not match pinned repository migration catalog (001-006).',
      });
    }
  }

  if (detectedCandidateD02Tables.length > 0) {
    unresolvedRecords.push({
      category: 'UNEXPECTED_CANDIDATE_D02_SCHEMA_OBJECT_PRESENT',
      severity: 'BLOCKER',
      recordKey: { detectedCandidateD02Tables },
      reason: 'A candidate D02 migration/ledger table already exists prior to D16 schema approval.',
    });
  }

  if (!integrityCheckPassed || !foreignKeyCheckPassed || !auditVerification.verifiedInMemory) {
    unresolvedRecords.push({
      category: 'DATABASE_STRUCTURAL_OR_AUDIT_CHAIN_INTEGRITY_FAILURE',
      severity: 'BLOCKER',
      recordKey: {
        integrityCheckPassed,
        foreignKeyViolationCount: q03bRows.length,
        auditChainVerifiedInMemory: auditVerification.verifiedInMemory,
        auditFirstFailure: auditVerification.firstFailure,
      },
      reason: 'SQLite integrity_check, foreign_key_check, or audit_events SHA-256 chain failed.',
    });
  }

  for (const c of q09Rows) {
    const anyNull =
      Number(c.file_name_is_null) === 1 ||
      Number(c.source_broker_is_null) === 1 ||
      Number(c.content_digest_is_null) === 1 ||
      Number(c.lineage_digest_is_null) === 1 ||
      Number(c.imported_at_is_null) === 1 ||
      Number(c.semantics_is_null) === 1;
    if (anyNull) {
      unresolvedRecords.push({
        category: 'OBSERVATION_CONTRIBUTION_WITH_NULLABLE_PROVENANCE_FIELDS',
        severity: 'OBSERVATION_NON_INFERENTIAL',
        recordKey: {
          canonicalOwnerId: c.canonical_owner_id,
          portfolioId: c.portfolio_id,
          contributionId: c.contribution_id,
          fileNameIsNull: c.file_name_is_null,
          sourceBrokerIsNull: c.source_broker_is_null,
          contentDigestIsNull: c.content_digest_is_null,
          lineageDigestIsNull: c.lineage_digest_is_null,
          importedAtIsNull: c.imported_at_is_null,
          semanticsIsNull: c.semantics_is_null,
        },
        reason:
          'Contribution row contains one or more NULL provenance columns (expected for pre-004 rows); recorded factually without backfilling or inferring missing provenance.',
      });
    }
  }

  for (const h of q08Rows) {
    if (h.security_identity_state === 'NULL' || h.identity_status !== 'CANONICAL') {
      unresolvedRecords.push({
        category: 'OBSERVATION_HOLDING_GROUP_NON_CANONICAL_OR_NULL_SECURITY_IDENTITY',
        severity: 'OBSERVATION_NON_INFERENTIAL',
        recordKey: h,
        reason:
          'Holding summary group has NULL security_identity or non-CANONICAL identity_status; recorded factually without inferring ownership or security resolution.',
      });
    }
  }

  const blockerUnresolvedCount = unresolvedRecords.filter((r) => r.severity === 'BLOCKER').length;
  const observationRecordCount = unresolvedRecords.filter(
    (r) => r.severity === 'OBSERVATION_NON_INFERENTIAL',
  ).length;

  const provenanceAndUnresolved = {
    nonInferenceAttestation: {
      ownershipInferredFromPrincipalLabels: false,
      ownershipInferredFromBrokerNames: false,
      ownershipInferredFromFileNames: false,
      ownershipInferredFromSymbolsOrCompanyIds: false,
      ownershipInferredFromPortfolioNames: false,
      rawFileNamesProjectedInQ09: false,
    },
    establishedS1Reference: ESTABLISHED_S1_TUPLE,
    approvedD02TargetReference: APPROVED_D02_TARGET,
    portfolioProvenanceClassifications,
    unresolvedSummary: {
      totalFlaggedItems: unresolvedRecords.length,
      blockerUnresolvedCount,
      nonInferentialObservationCount: observationRecordCount,
    },
    unresolvedRecords,
  };

  return {
    migrationAndSchemaEvidence,
    countsAndRelationships,
    collisionDuplicateOrphanNullFindings,
    provenanceAndUnresolved,
  };
}

function renderMarkdownReport({
  disposition,
  exitCode,
  dbPath,
  evidenceDir,
  scriptMetadata,
  capabilityProbe,
  psPreflight,
  preFileInfo,
  postFileInfo,
  preSidecars,
  postSidecars,
  queryExecutionOrder,
  derived,
  failureRecords,
}) {
  const lines = [];
  lines.push('# IPD D02 — Level E Read-Only D5 / D16 Live Inventory Evidence Report');
  lines.push('');
  lines.push(`- **Generated (UTC):** \`${new Date().toISOString()}\``);
  lines.push(`- **Disposition:** \`${disposition}\` (exit code \`${exitCode}\`)`);
  lines.push(`- **Target SQLite Path:** \`${dbPath}\``);
  lines.push(`- **Evidence Directory:** \`${evidenceDir}\``);
  lines.push(`- **Operator Package Version:** \`${scriptMetadata.operatorPackageVersion}\``);
  lines.push(`- **Query Catalog Source:** \`${scriptMetadata.sourceReportPath}\` (\`${scriptMetadata.sourceReportPinnedSha256}\`)`);
  lines.push('');
  lines.push('## 1. Governance & Gate Separation Notice');
  lines.push('');
  lines.push('- This artifact records **Level E strictly read-only D5 / D16 SQLite inspection evidence only** under the narrow 2026-11-16 Program Authority approval.');
  lines.push('- **Zero mutations executed:** no application startup, no `openDatabase()`, no `ensureMigrations()`, no binding resolvers, no Direct P1 provisioning, no `npm`/`npx` installs, and no DDL/DML writes.');
  lines.push('- **Separate gates remain closed until explicitly approved:**');
  lines.push('  - **D5 (`D5-T1`–`D5-T5`) acceptance:** separate gate');
  lines.push('  - **D16 detailed schema & idempotency specification approval:** separate gate');
  lines.push('  - **Implementation authority:** separate gate');
  lines.push('  - **Live provisioning / owner reassignment / migration execution:** separate gate');
  lines.push('  - **D6 (`IRR` integration):** `NOT STARTED`');
  lines.push('');
  lines.push('## 2. Read-Only Safety, Runtime & Hash Integrity Proof');
  lines.push('');
  lines.push('| Check | Value / Result |');
  lines.push('|---|---|');
  lines.push(`| Host platform / arch | \`${capabilityProbe?.runtime?.platform ?? process.platform}\` / \`${capabilityProbe?.runtime?.arch ?? process.arch}\` |`);
  lines.push(`| Node.js runtime | \`${capabilityProbe?.runtime?.nodeVersion ?? process.versions.node}\` (\`${capabilityProbe?.runtime?.execPath ?? process.execPath}\`) |`);
  lines.push(`| Bundled SQLite version | \`${capabilityProbe?.runtime?.sqliteVersion ?? 'N/A'}\` |`);
  lines.push(`| \`node:sqlite\` read-only API probe | \`${capabilityProbe?.passed === true ? 'PASS' : 'FAIL'}\` |`);
  lines.push(`| PowerShell host preflight | \`${psPreflight?.passed === true ? 'PASS' : (psPreflight ? 'FAIL' : 'NOT_PROVIDED')}\` |`);
  lines.push(`| Runner SHA-256 (\`${scriptMetadata.runnerFile}\`) | \`${scriptMetadata.runnerSha256}\` |`);
  lines.push(`| Catalog SHA-256 (\`${scriptMetadata.queryCatalogFile}\`) | \`${scriptMetadata.queryCatalogSha256}\` |`);
  lines.push(`| Combined \`Q01\`–\`Q14\` SQL SHA-256 | \`${scriptMetadata.q01ToQ14CombinedSqlSha256}\` |`);
  lines.push(`| Pre-inspection DB size (bytes) | \`${preFileInfo?.sizeBytes ?? 'N/A'}\` |`);
  lines.push(`| Post-inspection DB size (bytes) | \`${postFileInfo?.sizeBytes ?? 'N/A'}\` |`);
  lines.push(`| Pre-inspection DB SHA-256 | \`${preFileInfo?.sha256 ?? 'N/A'}\` |`);
  lines.push(`| Post-inspection DB SHA-256 | \`${postFileInfo?.sha256 ?? 'N/A'}\` |`);
  lines.push(`| Exact pre/post SHA-256 equality | \`${Boolean(preFileInfo && postFileInfo && preFileInfo.sha256 === postFileInfo.sha256)}\` |`);
  lines.push(`| Pre-inspection sidecars (\`-wal\`/\`-shm\`/\`-journal\`) | \`${preSidecars?.anySidecarPresent === false ? 'NONE (PASS)' : 'DETECTED_OR_NOT_RUN'}\` |`);
  lines.push(`| Post-inspection sidecars (\`-wal\`/\`-shm\`/\`-journal\`) | \`${postSidecars?.anySidecarPresent === false ? 'NONE (PASS)' : 'DETECTED_OR_NOT_RUN'}\` |`);
  lines.push('');

  if (failureRecords.length > 0) {
    lines.push('## 3. Recorded Stop / Failure Conditions');
    lines.push('');
    for (const f of failureRecords) {
      lines.push(`- **\`${f.code}\`**: ${f.detail}`);
    }
    lines.push('');
  }

  lines.push('## 3. Query Execution Summary (`Q01`–`Q14`)');
  lines.push('');
  lines.push('| Statement | Group | Status | Rows | SQL SHA-256 |');
  lines.push('|---|---|---|---:|---|');
  for (const q of queryExecutionOrder) {
    lines.push(`| \`${q.statementId}\` | \`${q.queryGroup}\` | \`${q.status}\` | ${q.rowCount ?? 0} | \`${q.sqlSha256}\` |`);
  }
  lines.push('');

  if (derived) {
    const mig = derived.migrationAndSchemaEvidence;
    const cnt = derived.countsAndRelationships;
    const fnd = derived.collisionDuplicateOrphanNullFindings;
    const prv = derived.provenanceAndUnresolved;

    lines.push('## 4. Schema, Migration Ledger & Structural Integrity');
    lines.push('');
    lines.push(`- **Applied migrations in \`_migration_ledger\`:** \`${mig.appliedMigrationCount}\` (all match repository checksums: \`${mig.allAppliedChecksumsMatchRepository}\`)`);
    lines.push(`- **Missing repository migrations (\`001\`–\`006\`):** \`${mig.missingRepositoryMigrations.length === 0 ? 'NONE' : mig.missingRepositoryMigrations.join(', ')}\``);
    lines.push(`- **\`006_portfolio_restore\` applied / \`portfolio_restore_receipts\` present:** \`${mig.migration006PortfolioRestoreApplied}\` / \`${mig.portfolioRestoreReceiptsTablePresent}\``);
    lines.push(`- **Candidate D02 tables state:** \`${mig.d02LedgerSchemaState}\``);
    lines.push(`- **\`PRAGMA integrity_check\` / \`PRAGMA foreign_key_check\`:** \`${mig.integrityCheck.passed ? 'ok' : 'FAILED'}\` / \`${mig.foreignKeyCheck.passed ? '0 violations' : `${mig.foreignKeyCheck.violationCount} violations`}\``);
    lines.push(`- **\`Q14\` (\`PRAGMA query_only\` inside snapshot):** \`${mig.queryOnlyPragmaInsideSnapshot.verified ? '1 (VERIFIED)' : 'FAILED'}\``);
    lines.push('');
    lines.push('## 5. Principal, Portfolio, Holding, Contribution & Audit Counts');
    lines.push('');
    lines.push(`- **Active identity state:** \`${cnt.activeIdentityState}\``);
    lines.push(`- **\`local_principal_bindings\`:** total \`${cnt.bindings.totalCount}\` (\`ACTIVE\`: \`${cnt.bindings.activeCount}\`, \`REVOKED\`: \`${cnt.bindings.revokedCount}\`)`);
    lines.push(`- **\`local_principal_memberships\`:** total \`${cnt.memberships.totalCount}\` (\`ACTIVE\`: \`${cnt.memberships.activeCount}\`, \`REVOKED\`: \`${cnt.memberships.revokedCount}\`)`);
    lines.push(`- **\`portfolios\`:** total \`${cnt.portfolios.totalCount}\` (\`ACTIVE\`: \`${cnt.portfolios.activeCount}\`, \`TOMBSTONED\`: \`${cnt.portfolios.tombstonedCount}\`; distinct owners: \`${cnt.portfolios.distinctCanonicalOwnerCount}\`; distinct tenants: \`${cnt.portfolios.distinctTenantCount}\`)`);
    lines.push(`  - \`CANDIDATE_S1_HISTORICAL_PORTFOLIO\` (\`ipd-owner-ramki-personal\` / \`ipd-personal-local\`): \`${cnt.portfolios.byClassification.CANDIDATE_S1_HISTORICAL_PORTFOLIO ?? 0}\``);
    lines.push(`  - \`EXISTING_D02_OWNER_PORTFOLIO\` (\`owner-4dc756b3\` / \`ipd-personal-local\`): \`${cnt.portfolios.byClassification.EXISTING_D02_OWNER_PORTFOLIO ?? 0}\``);
    lines.push(`  - \`UNRESOLVED_OTHER_OWNER_OR_TENANT\`: \`${cnt.portfolios.byClassification.UNRESOLVED_OTHER_OWNER_OR_TENANT ?? 0}\``);
    lines.push(`- **\`portfolio_revisions\`:** total \`${cnt.revisions.totalCount}\``);
    lines.push(`- **\`portfolio_holdings\`:** total rows across revisions \`${cnt.holdings.totalHoldingRowsAcrossAllRevisions}\` (active rows: \`${cnt.holdings.totalActiveHoldingRowsAcrossAllRevisions}\`; \`security_identity\` populated: \`${cnt.holdings.totalPopulatedSecurityIdentityHoldingRows}\`; \`security_identity\` NULL: \`${cnt.holdings.totalNullSecurityIdentityHoldingRows}\`)`);
    lines.push(`- **\`portfolio_contributions\`:** total \`${cnt.contributions.totalContributions}\` (all \`004\` provenance fields populated: \`${cnt.contributions.rowsWithAll004ProvenanceFieldsPopulated}\`; any \`004\` field NULL: \`${cnt.contributions.rowsWithAnyNull004ProvenanceField}\`)`);
    lines.push(`- **\`portfolio_restore_receipts\`:** total \`${cnt.restoreReceipts.totalCount}\` (status: \`${cnt.restoreReceipts.queryStatus}\`)`);
    lines.push(`- **\`audit_events\`:** total \`${cnt.auditEvents.hashChainVerification.totalRowsRead}\`, in-memory SHA-256 chain verified: \`${cnt.auditEvents.hashChainVerification.verifiedInMemory}\``);
    lines.push('');
    lines.push('## 6. Collisions, Duplicates, Orphans, NULLs & Unresolved Records');
    lines.push('');
    lines.push(`- **\`Q11a\` S1-vs-D02 \`portfolio_id\` collisions:** \`${fnd.q11aPortfolioIdCollisionsBetweenS1AndD02.collisionCount}\``);
    lines.push(`- **\`Q11b\` duplicate normalized symbols per revision:** \`${fnd.q11bDuplicateNormalizedSymbolsPerRevision.duplicateGroupCount}\``);
    lines.push(`- **\`Q11c\` partial-unique active binding/membership violation:** \`${fnd.q11cActiveBindingAndMembershipCounts.partialUniqueInvariantViolated}\``);
    lines.push(`- **\`Q12a\` orphan / inactive-parent memberships:** \`${fnd.q12aOrphanOrInactiveParentMemberships.anomalyCount}\``);
    lines.push(`- **\`Q12b\` \`current_revision\` / tombstone mismatches:** \`${fnd.q12bCurrentRevisionPointerOrTombstoneMismatches.anomalyCount}\``);
    lines.push(`- **\`Q12c\` declared vs actual \`holdings_count\` mismatches:** \`${fnd.q12cDeclaredVsActualHoldingsCountMismatches.anomalyCount}\``);
    lines.push(`- **\`Q07\` NULL/empty revision digests:** \`${fnd.q07RevisionDigestNullOrEmptyFindings.anomalyCount}\``);
    lines.push(`- **Explicitly flagged blocker unresolved records:** \`${prv.unresolvedSummary.blockerUnresolvedCount}\``);
    lines.push(`- **Non-inferential schema/provenance observations:** \`${prv.unresolvedSummary.nonInferentialObservationCount}\``);
    lines.push('');
    lines.push('## 7. Local Sensitivity & Sharing Note');
    lines.push('');
    lines.push('- `02-q01-q14-query-results.json` stores exact local `Q01`–`Q14` SQL rows (including `portfolios.portfolio_name`, `local_principal_bindings.principal_label`, and `audit_events.detail_json`, while `Q09` never projects raw `file_name`). Inspect `02-q01-q14-query-results.json` locally before sharing externally; `d5-d16-inventory-summary.json` and `03`–`06` JSON artifacts contain sanitized counts, structural keys, and non-inferential classifications.');
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

async function main() {
  const startedAtUtc = new Date().toISOString();
  let args;
  try {
    args = parseCliArgs(process.argv.slice(2));
  } catch (err) {
    process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
    process.exitCode = EXIT_PRECONDITION_FAILED;
    return;
  }

  if (!args.evidenceDir || !existsSync(args.evidenceDir) || !lstatSync(args.evidenceDir).isDirectory()) {
    process.stderr.write('EVIDENCE_DIR_MISSING_OR_INVALID: --evidence-dir must point to an existing directory.\n');
    process.exitCode = EXIT_PRECONDITION_FAILED;
    return;
  }

  const evidenceDir = resolve(args.evidenceDir);
  const scriptMetadata = collectScriptHashes();

  for (const entry of Q01_TO_Q14_CATALOG) {
    assertApprovedReadOnlySql(entry);
  }

  if (args.mode === 'capability-probe') {
    const { probeReport } = await runNodeSqliteCapabilityProbe(evidenceDir);
    writeJsonUtf8(resolve(evidenceDir, '00-node-sqlite-capability-probe.json'), probeReport);
    if (!probeReport.passed) {
      process.stderr.write(`${probeReport.failureCode}: ${probeReport.failureDetail}\n`);
      process.exitCode = EXIT_PRECONDITION_FAILED;
      return;
    }
    process.stdout.write(
      `CAPABILITY_PROBE_OK node=${probeReport.runtime.nodeVersion} sqlite=${probeReport.runtime.sqliteVersion}\n`,
    );
    process.exitCode = EXIT_OK;
    return;
  }

  if (args.mode !== 'inventory') {
    process.stderr.write(`INVALID_MODE: expected 'capability-probe' or 'inventory', got '${args.mode}'.\n`);
    process.exitCode = EXIT_PRECONDITION_FAILED;
    return;
  }

  let psPreflight = null;
  if (args.psPreflightFile && existsSync(args.psPreflightFile)) {
    try {
      const rawPs = readFileSync(args.psPreflightFile, 'utf8').replace(/^\uFEFF/, '');
      psPreflight = JSON.parse(rawPs);
    } catch (err) {
      psPreflight = {
        passed: false,
        parseError: err instanceof Error ? err.message : String(err),
      };
    }
  }

  const failureRecords = [];
  const { probeReport, DatabaseSync } = await runNodeSqliteCapabilityProbe(evidenceDir);
  writeJsonUtf8(resolve(evidenceDir, '00-node-sqlite-capability-probe.json'), probeReport);

  const dbPath = args.dbPath;
  let preSidecars = null;
  let postSidecars = null;
  let preFileInfo = null;
  let postFileInfo = null;
  const queryMap = {};
  const queryExecutionOrder = [];
  let derived = null;
  let auditVerification = null;

  if (!probeReport.passed || !DatabaseSync) {
    failureRecords.push({
      phase: 'CAPABILITY_PROBE',
      code: probeReport.failureCode ?? 'CAPABILITY_PROBE_FAILED',
      detail: probeReport.failureDetail ?? 'Node/SQLite read-only capability probe failed.',
    });
  }

  if (failureRecords.length === 0) {
    const syntaxCheck = validateWindowsTargetDbPathSyntax(dbPath, evidenceDir);
    if (!syntaxCheck.ok) {
      failureRecords.push({
        phase: 'PREFLIGHT_PATH_VALIDATION',
        code: syntaxCheck.code,
        detail: syntaxCheck.detail,
      });
    }
  }

  if (failureRecords.length === 0) {
    const parentDir = dirname(dbPath);
    if (!existsSync(parentDir)) {
      failureRecords.push({
        phase: 'PREFLIGHT_PARENT_DIR',
        code: 'PARENT_DIRECTORY_MISSING',
        detail: `Parent directory does not exist (creation prohibited): ${parentDir}`,
      });
    } else {
      const parentStat = lstatSync(parentDir);
      if (!parentStat.isDirectory() || parentStat.isSymbolicLink()) {
        failureRecords.push({
          phase: 'PREFLIGHT_PARENT_DIR',
          code: 'PARENT_DIRECTORY_NOT_REGULAR_DIR_OR_SYMLINK',
          detail: `Parent directory is not a regular non-reparse directory: ${parentDir}`,
        });
      }
    }
  }

  if (failureRecords.length === 0) {
    if (!existsSync(dbPath)) {
      failureRecords.push({
        phase: 'PREFLIGHT_DB_FILE',
        code: 'DATABASE_FILE_MISSING',
        detail: `Target SQLite file does not exist (creation prohibited): ${dbPath}`,
      });
    } else {
      const dbStat = lstatSync(dbPath);
      if (!dbStat.isFile() || dbStat.isSymbolicLink()) {
        failureRecords.push({
          phase: 'PREFLIGHT_DB_FILE',
          code: 'DATABASE_FILE_NOT_REGULAR_OR_SYMLINK',
          detail: `Target SQLite path is not a regular non-symlink file: ${dbPath}`,
        });
      } else if (dbStat.size < 100) {
        failureRecords.push({
          phase: 'PREFLIGHT_DB_FILE',
          code: 'DATABASE_FILE_TOO_SMALL_FOR_SQLITE_HEADER',
          detail: `Target SQLite file is ${dbStat.size} bytes (< 100-byte SQLite header).`,
        });
      }
    }
  }

  if (failureRecords.length === 0) {
    preSidecars = inspectDisallowedSidecars(dbPath);
    if (preSidecars.anySidecarPresent) {
      failureRecords.push({
        phase: 'PREFLIGHT_SIDECARS',
        code: 'DISALLOWED_SIDECAR_PRESENT_PREFLIGHT',
        detail: `Refusing to open SQLite file because -wal/-shm/-journal sidecar(s) exist: ${preSidecars.detectedSidecars.map((s) => s.name).join(', ')}`,
      });
    }
  }

  if (failureRecords.length === 0) {
    try {
      preFileInfo = inspectDatabaseFileReadOnly(dbPath, true);
      if (!preFileInfo.header?.magicValid || !preFileInfo.header?.validPageSize) {
        failureRecords.push({
          phase: 'PREFLIGHT_SQLITE_HEADER',
          code: 'INVALID_SQLITE_HEADER',
          detail: 'Target file does not carry a valid SQLite format 3 header or valid page size.',
        });
      } else if (preFileInfo.header.isWalFormatFlaggedInHeader || !preFileInfo.header.isLegacyRollbackFormat) {
        failureRecords.push({
          phase: 'PREFLIGHT_SQLITE_HEADER',
          code: 'NON_ROLLBACK_OR_WAL_HEADER_VERSION_REFUSED',
          detail: `SQLite header file format versions (write=${preFileInfo.header.fileFormatWriteVersion}, read=${preFileInfo.header.fileFormatReadVersion}) are not legacy rollback (1,1); refusing open so SQLite cannot touch -shm/-wal.`,
        });
      }
    } catch (err) {
      failureRecords.push({
        phase: 'PREFLIGHT_HASH_AND_HEADER',
        code: 'PREFLIGHT_READ_FAILED',
        detail: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Execute Q01-Q14 strictly inside a read-only DatabaseSync connection + BEGIN DEFERRED ... ROLLBACK
  if (failureRecords.length === 0 && DatabaseSync) {
    let db = null;
    try {
      db = new DatabaseSync(dbPath, { open: true, readOnly: true });
      db.exec('PRAGMA query_only = ON;');
      db.exec('PRAGMA temp_store = MEMORY;');

      const initialQo = db.prepare('PRAGMA query_only;').get();
      if (Number(initialQo?.query_only) !== 1) {
        throw new Error('PRAGMA_QUERY_ONLY_NOT_ONE_BEFORE_SNAPSHOT');
      }

      db.exec('BEGIN DEFERRED;');

      let observedQ02Tables = new Set();

      for (const entry of Q01_TO_Q14_CATALOG) {
        const sqlSha256 = sha256Text(entry.sql);

        if (entry.conditionalOnTableInQ02 && !observedQ02Tables.has(entry.conditionalOnTableInQ02)) {
          const skippedRecord = {
            statementId: entry.statementId,
            queryGroup: entry.queryGroup,
            title: entry.title,
            sql: entry.sql,
            sqlSha256,
            status: 'SKIPPED_TABLE_ABSENT_IN_Q02',
            rowCount: 0,
            rows: [],
            error: null,
          };
          queryMap[entry.statementId] = skippedRecord;
          queryExecutionOrder.push(skippedRecord);
          continue;
        }

        try {
          const stmt = db.prepare(entry.sql);
          const rawRows = stmt.all();
          const normalizedRows = rawRows.map((r) => normalizeSqlRow(r));
          const executedRecord = {
            statementId: entry.statementId,
            queryGroup: entry.queryGroup,
            title: entry.title,
            sql: entry.sql,
            sqlSha256,
            status: 'EXECUTED_OK',
            rowCount: normalizedRows.length,
            rows: normalizedRows,
            error: null,
          };
          queryMap[entry.statementId] = executedRecord;
          queryExecutionOrder.push(executedRecord);

          if (entry.statementId === 'Q02') {
            observedQ02Tables = new Set(
              normalizedRows
                .filter((r) => r.type === 'table')
                .map((r) => String(r.name)),
            );
          }
        } catch (queryErr) {
          const errMsg = queryErr instanceof Error ? queryErr.message : String(queryErr);
          const failedRecord = {
            statementId: entry.statementId,
            queryGroup: entry.queryGroup,
            title: entry.title,
            sql: entry.sql,
            sqlSha256,
            status: 'FAILED_QUERY_ERROR',
            rowCount: 0,
            rows: [],
            error: errMsg,
          };
          queryMap[entry.statementId] = failedRecord;
          queryExecutionOrder.push(failedRecord);
          failureRecords.push({
            phase: `QUERY_${entry.statementId}`,
            code: `QUERY_EXECUTION_FAILED_${entry.statementId}`,
            detail: errMsg,
          });
          // If Q01 failed (e.g. _migration_ledger missing), still run Q02 to capture sqlite_master before stopping.
          if (entry.statementId === 'Q01') {
            const q02Entry = Q01_TO_Q14_CATALOG.find((q) => q.statementId === 'Q02');
            if (q02Entry) {
              try {
                const q02Rows = db.prepare(q02Entry.sql).all().map((r) => normalizeSqlRow(r));
                const q02Record = {
                  statementId: q02Entry.statementId,
                  queryGroup: q02Entry.queryGroup,
                  title: q02Entry.title,
                  sql: q02Entry.sql,
                  sqlSha256: sha256Text(q02Entry.sql),
                  status: 'EXECUTED_OK',
                  rowCount: q02Rows.length,
                  rows: q02Rows,
                  error: null,
                };
                queryMap.Q02 = q02Record;
                queryExecutionOrder.push(q02Record);
              } catch {
                // Ignore secondary Q02 error while already failing closed.
              }
            }
          }
          break;
        }
      }
    } catch (openOrTxErr) {
      failureRecords.push({
        phase: 'SQLITE_READONLY_SESSION',
        code: 'SQLITE_READONLY_SESSION_FAILED',
        detail: openOrTxErr instanceof Error ? openOrTxErr.message : String(openOrTxErr),
      });
    } finally {
      if (db) {
        try {
          if (db.isTransaction) {
            db.exec('ROLLBACK;');
          }
        } catch (rollbackErr) {
          failureRecords.push({
            phase: 'SQLITE_ROLLBACK',
            code: 'SQLITE_ROLLBACK_FAILED',
            detail: rollbackErr instanceof Error ? rollbackErr.message : String(rollbackErr),
          });
        }
        try {
          db.close();
        } catch (closeErr) {
          failureRecords.push({
            phase: 'SQLITE_CLOSE',
            code: 'SQLITE_CLOSE_FAILED',
            detail: closeErr instanceof Error ? closeErr.message : String(closeErr),
          });
        }
      }
    }
  }

  // Postflight verification: run whenever preFileInfo was captured so pre/post invariants are proven
  let postconditionFailed = false;
  if (preFileInfo) {
    postSidecars = inspectDisallowedSidecars(dbPath);
    if (postSidecars.anySidecarPresent) {
      postconditionFailed = true;
      failureRecords.push({
        phase: 'POSTFLIGHT_SIDECARS',
        code: 'POSTCONDITION_SIDECAR_DETECTED',
        detail: `Disallowed sidecar(s) detected after read-only session: ${postSidecars.detectedSidecars.map((s) => s.name).join(', ')}`,
      });
    }
    try {
      postFileInfo = inspectDatabaseFileReadOnly(dbPath, false);
      if (postFileInfo.sha256 !== preFileInfo.sha256) {
        postconditionFailed = true;
        failureRecords.push({
          phase: 'POSTFLIGHT_SHA256',
          code: 'POSTCONDITION_DB_SHA256_MISMATCH',
          detail: `Pre-SHA256 (${preFileInfo.sha256}) != Post-SHA256 (${postFileInfo.sha256}).`,
        });
      }
      if (postFileInfo.sizeBytes !== preFileInfo.sizeBytes) {
        postconditionFailed = true;
        failureRecords.push({
          phase: 'POSTFLIGHT_SIZE',
          code: 'POSTCONDITION_DB_SIZE_CHANGED',
          detail: `Pre-size (${preFileInfo.sizeBytes}) != Post-size (${postFileInfo.sizeBytes}).`,
        });
      }
      if (postFileInfo.mtimeMs !== preFileInfo.mtimeMs) {
        postconditionFailed = true;
        failureRecords.push({
          phase: 'POSTFLIGHT_MTIME',
          code: 'POSTCONDITION_DB_MTIME_CHANGED',
          detail: `Pre-mtime (${preFileInfo.mtimeUtc}) != Post-mtime (${postFileInfo.mtimeUtc}).`,
        });
      }
    } catch (err) {
      postconditionFailed = true;
      failureRecords.push({
        phase: 'POSTFLIGHT_READ',
        code: 'POSTCONDITION_HASH_READ_FAILED',
        detail: err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (queryMap.Q13?.status === 'EXECUTED_OK') {
    auditVerification = verifyAuditEventsChainInMemory(queryMap.Q13.rows);
    if (!auditVerification.verifiedInMemory) {
      postconditionFailed = true;
      failureRecords.push({
        phase: 'AUDIT_HASH_CHAIN_VERIFICATION',
        code: 'AUDIT_HASH_CHAIN_VERIFICATION_FAILED',
        detail: `audit_events in-memory SHA-256 chain failed at rowIndex=${auditVerification.firstFailure?.rowIndex}: ${auditVerification.firstFailure?.reason}`,
      });
    }
  } else {
    auditVerification = {
      verifiedInMemory: false,
      genesisChecksum: AUDIT_GENESIS_CHECKSUM,
      totalRowsVerified: 0,
      totalRowsRead: 0,
      terminalChecksum: null,
      firstFailure: { reason: 'Q13_NOT_EXECUTED' },
    };
  }

  if (queryExecutionOrder.length > 0) {
    derived = buildDerivedAnalyses(queryMap, auditVerification);
    if (!derived.migrationAndSchemaEvidence.queryOnlyPragmaInsideSnapshot.verified && queryMap.Q14) {
      postconditionFailed = true;
      failureRecords.push({
        phase: 'SNAPSHOT_QUERY_ONLY_ASSERTION',
        code: 'Q14_QUERY_ONLY_NOT_ONE',
        detail: 'Q14 (PRAGMA query_only;) inside snapshot did not return 1.',
      });
    }
    if (
      !derived.migrationAndSchemaEvidence.integrityCheck.passed ||
      !derived.migrationAndSchemaEvidence.foreignKeyCheck.passed
    ) {
      postconditionFailed = true;
      failureRecords.push({
        phase: 'SQLITE_STRUCTURAL_INTEGRITY',
        code: 'Q03_INTEGRITY_OR_FOREIGN_KEY_CHECK_FAILED',
        detail: 'PRAGMA integrity_check or PRAGMA foreign_key_check reported structural issues.',
      });
    }
  }

  let exitCode = EXIT_OK;
  let disposition = 'INVENTORY_COMPLETE_READ_ONLY_VERIFIED';
  if (postconditionFailed) {
    exitCode = EXIT_POSTCONDITION_OR_INTEGRITY_FAILED;
    disposition = 'STOPPED_POSTCONDITION_OR_INTEGRITY_FAILED';
  } else if (failureRecords.length > 0) {
    exitCode = EXIT_PRECONDITION_FAILED;
    disposition = 'STOPPED_PRECONDITION_FAILED';
  }

  const completedAtUtc = new Date().toISOString();

  const preflightAndMetadataPayload = {
    operatorPackageVersion: OPERATOR_PACKAGE_VERSION,
    startedAtUtc,
    completedAtUtc,
    disposition,
    exitCode,
    designatedDefaultWindowsDbPath: DESIGNATED_WINDOWS_DB_PATH,
    designatedIpdNamedPipe: DESIGNATED_IPD_NAMED_PIPE,
    inspectedDatabasePath: dbPath,
    evidenceDirectory: evidenceDir,
    scriptMetadata,
    runtimeCapabilityProbe: probeReport,
    powerShellHostPreflight: psPreflight,
    nodePreflightSidecars: preSidecars,
    nodePostflightSidecars: postSidecars,
    preInspectionDatabaseFile: preFileInfo,
    postInspectionDatabaseFile: postFileInfo,
    invariantsVerified: {
      readOnlyDatabaseSyncFlagUsed: true,
      pragmaQueryOnlyOnEnforced: true,
      pragmaTempStoreMemoryEnforced: true,
      explicitDeferredReadTransactionRolledBack: true,
      exactPrePostSha256Equal:
        Boolean(preFileInfo && postFileInfo && preFileInfo.sha256 === postFileInfo.sha256),
      exactPrePostSizeEqual:
        Boolean(preFileInfo && postFileInfo && preFileInfo.sizeBytes === postFileInfo.sizeBytes),
      exactPrePostMtimeEqual:
        Boolean(preFileInfo && postFileInfo && preFileInfo.mtimeMs === postFileInfo.mtimeMs),
      zeroPreSidecars: preSidecars ? !preSidecars.anySidecarPresent : false,
      zeroPostSidecars: postSidecars ? !postSidecars.anySidecarPresent : false,
    },
    failureRecords,
  };

  writeJsonUtf8(
    resolve(evidenceDir, '01-preflight-and-database-metadata.json'),
    preflightAndMetadataPayload,
  );

  writeJsonUtf8(resolve(evidenceDir, '02-q01-q14-query-results.json'), {
    operatorPackageVersion: OPERATOR_PACKAGE_VERSION,
    localSensitivityNotice:
      'LOCAL_PRINCIPAL_REVIEW_REQUIRED_BEFORE_EXTERNAL_SHARING: contains raw Q01-Q14 result rows (including portfolios.portfolio_name, local_principal_bindings.principal_label, and audit_events.detail_json; Q09 omits raw file_name by design).',
    sourceReportPath: SOURCE_REPORT_PATH,
    sourceReportPinnedSha256: SOURCE_REPORT_SHA256,
    q01ToQ14CombinedSqlSha256: scriptMetadata.q01ToQ14CombinedSqlSha256,
    statementCountCatalog: Q01_TO_Q14_CATALOG.length,
    statementCountProcessed: queryExecutionOrder.length,
    statements: queryExecutionOrder,
  });

  if (derived) {
    writeJsonUtf8(
      resolve(evidenceDir, '03-migration-ledger-and-schema-evidence.json'),
      derived.migrationAndSchemaEvidence,
    );
    writeJsonUtf8(
      resolve(evidenceDir, '04-counts-and-relationship-summary.json'),
      derived.countsAndRelationships,
    );
    writeJsonUtf8(
      resolve(evidenceDir, '05-collision-duplicate-orphan-null-findings.json'),
      derived.collisionDuplicateOrphanNullFindings,
    );
    writeJsonUtf8(
      resolve(evidenceDir, '06-provenance-and-unresolved-records.json'),
      derived.provenanceAndUnresolved,
    );
  }

  const summaryPayload = {
    schemaVersion: 'ipd.d02.d5_d16.readonly_inventory_summary.v1',
    operatorPackageVersion: OPERATOR_PACKAGE_VERSION,
    startedAtUtc,
    completedAtUtc,
    disposition,
    exitCode,
    inspectedDatabasePath: dbPath,
    databasePreSha256: preFileInfo?.sha256 ?? null,
    databasePostSha256: postFileInfo?.sha256 ?? null,
    databasePrePostSha256Identical:
      Boolean(preFileInfo && postFileInfo && preFileInfo.sha256 === postFileInfo.sha256),
    databaseSizeBytes: preFileInfo?.sizeBytes ?? null,
    sidecarsAbsentPreAndPost:
      Boolean(preSidecars && postSidecars && !preSidecars.anySidecarPresent && !postSidecars.anySidecarPresent),
    scriptMetadata,
    runtime: probeReport.runtime,
    gateSeparationStatus: {
      narrowReadOnlyInventoryApprovalDate: '2026-11-16',
      d5Accepted: false,
      d16DetailedSchemaApproved: false,
      implementationAuthorized: false,
      provisioningOrOwnerReassignmentExecuted: false,
      d6IrrIntegrationStarted: false,
    },
    highLevelCounts: derived
      ? {
          appliedMigrations: derived.migrationAndSchemaEvidence.appliedMigrationCount,
          migration006Applied: derived.migrationAndSchemaEvidence.migration006PortfolioRestoreApplied,
          d02LedgerSchemaState: derived.migrationAndSchemaEvidence.d02LedgerSchemaState,
          activeIdentityState: derived.countsAndRelationships.activeIdentityState,
          bindingsTotal: derived.countsAndRelationships.bindings.totalCount,
          bindingsActive: derived.countsAndRelationships.bindings.activeCount,
          membershipsTotal: derived.countsAndRelationships.memberships.totalCount,
          membershipsActive: derived.countsAndRelationships.memberships.activeCount,
          portfoliosTotal: derived.countsAndRelationships.portfolios.totalCount,
          portfoliosActive: derived.countsAndRelationships.portfolios.activeCount,
          portfoliosTombstoned: derived.countsAndRelationships.portfolios.tombstonedCount,
          candidateS1HistoricalPortfolios:
            derived.countsAndRelationships.portfolios.byClassification
              .CANDIDATE_S1_HISTORICAL_PORTFOLIO ?? 0,
          existingD02OwnerPortfolios:
            derived.countsAndRelationships.portfolios.byClassification
              .EXISTING_D02_OWNER_PORTFOLIO ?? 0,
          unresolvedOtherOwnerOrTenantPortfolios:
            derived.countsAndRelationships.portfolios.byClassification
              .UNRESOLVED_OTHER_OWNER_OR_TENANT ?? 0,
          revisionsTotal: derived.countsAndRelationships.revisions.totalCount,
          holdingRowsAcrossRevisionsTotal:
            derived.countsAndRelationships.holdings.totalHoldingRowsAcrossAllRevisions,
          contributionsTotal: derived.countsAndRelationships.contributions.totalContributions,
          restoreReceiptsTotal: derived.countsAndRelationships.restoreReceipts.totalCount,
          auditEventsTotal:
            derived.countsAndRelationships.auditEvents.hashChainVerification.totalRowsRead,
          auditChainVerifiedInMemory:
            derived.countsAndRelationships.auditEvents.hashChainVerification.verifiedInMemory,
          s1VsD02PortfolioIdCollisions:
            derived.collisionDuplicateOrphanNullFindings
              .q11aPortfolioIdCollisionsBetweenS1AndD02.collisionCount,
          blockerUnresolvedRecords:
            derived.provenanceAndUnresolved.unresolvedSummary.blockerUnresolvedCount,
          nonInferentialObservations:
            derived.provenanceAndUnresolved.unresolvedSummary.nonInferentialObservationCount,
        }
      : null,
    failureRecords,
  };

  writeJsonUtf8(resolve(evidenceDir, 'd5-d16-inventory-summary.json'), summaryPayload);

  const markdownReport = renderMarkdownReport({
    disposition,
    exitCode,
    dbPath,
    evidenceDir,
    scriptMetadata,
    capabilityProbe: probeReport,
    psPreflight,
    preFileInfo,
    postFileInfo,
    preSidecars,
    postSidecars,
    queryExecutionOrder,
    derived,
    failureRecords,
  });

  writeTextUtf8(resolve(evidenceDir, 'd5-d16-inventory-report.md'), markdownReport);

  process.stdout.write(
    `RUNNER_RESULT disposition=${disposition} exitCode=${exitCode} preSha256=${preFileInfo?.sha256 ?? 'NONE'} postSha256=${postFileInfo?.sha256 ?? 'NONE'}\n`,
  );
  process.exitCode = exitCode;
}

await main();
