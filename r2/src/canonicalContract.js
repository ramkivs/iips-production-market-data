/**
 * R-2 — CANONICAL EQUITY MARKET-DATA CONTRACT (schema `r2.equity.daily@1.0.0`)
 *
 * ── Authority ────────────────────────────────────────────────────────────────────────────────
 *   R-2 §H fixes the minimum field set. This module realises it **inside** the accepted P01
 *   contract rather than beside it:
 *     · `docs/p01/P01_DATA_CONTRACT.md`:84 — `snapshotId` format
 *       **`data-${provider}-${dataVersion}-${asOf}`** is FROZEN (AD-6) and authoritative for the
 *       market-data input layer. It is **reused verbatim**; no component is added.
 *     · `:85-89` — `provider`, `dataVersion`, `asOf` are REQUIRED lineage (INV-5 / AD-3).
 *     · INV-2 (`:52`) — snapshots are immutable and versioned; a correction yields a new
 *       `dataVersion`, never a mutation. `freezeRecord` enforces immutability.
 *     · DV-1/DV-2/DV-3 (`:222-224`) — `dataVersion` is source-content vintage, **not** schema
 *       version. Schema version is `schemaVersion`. Both are carried separately here.
 *     · INV-10 / NFR-06 (`:60`) — **no provider leakage to product DTOs**. This module is the
 *       canonical layer; the UI-facing projection lives in `uiDataContract.js` and deliberately
 *       carries no NSE/file-specific field.
 *
 * ── §H.20 — provider-neutralism ──────────────────────────────────────────────────────────────
 *   R-2 §B and §P.82 require that no engine or UI component depend on NSE endpoint/file
 *   structures. Accordingly the canonical names below are **program-internal**; the CM-UDiFF
 *   ISO tags (`TradDt`, `TckrSymb`, …) appear only in `cmudiffParser.js`, which is the single
 *   translation point. `PROVIDER_NATIVE_FIELDS` is exported so a test can assert leakage.
 */

export const SCHEMA_ID = 'r2.equity.daily';
export const SCHEMA_VERSION = '1.0.0';

/** Currency of all monetary/price fields. NSE CM reports in INR. */
export const PRICE_CURRENCY = 'INR';

/**
 * The canonical field dictionary.
 *
 * `required: true`  — a record lacking it is REJECTED (never silently defaulted).
 * `required: false` — absence is represented as `null`, never as `0`/`''`. This mirrors
 *                     P01 `NL-7` ("No coercion: absence never becomes 0, "" or false").
 */
export const FIELDS = Object.freeze({
  // ── identity & lineage (P01 §3) ──────────────────────────────────────────────────────────
  tradeDate: Object.freeze({ required: true, type: 'date', note: '§H trade_date. Session date, YYYY-MM-DD.' }),
  exchange: Object.freeze({ required: true, type: 'enum', values: ['NSE'], note: '§H exchange. R-2 §A.1 NSE Capital Market only.' }),
  isin: Object.freeze({ required: true, type: 'isin', note: '§H ISIN. 12-char, IN-prefixed for NSE.' }),
  symbol: Object.freeze({ required: true, type: 'string', note: '§H NSE symbol (source TckrSymb).' }),
  securityName: Object.freeze({ required: false, type: 'string', note: '§H security name.' }),
  series: Object.freeze({ required: true, type: 'string', note: '§H security series (source SctySrs). Eligibility input.' }),

  // ── prices (INR) ─────────────────────────────────────────────────────────────────────────
  open: Object.freeze({ required: false, type: 'decimal', note: '§H open (OpnPric).' }),
  high: Object.freeze({ required: false, type: 'decimal', note: '§H high (HighPric).' }),
  low: Object.freeze({ required: false, type: 'decimal', note: '§H low (LowPric).' }),
  close: Object.freeze({ required: true, type: 'decimal', note: '§H close (ClsPric) — official close, the authoritative daily price.' }),
  priceCurrency: Object.freeze({ required: true, type: 'enum', values: [PRICE_CURRENCY], note: 'Explicit currency for all price/value fields. NSE CM reports in INR.' }),
  lastPrice: Object.freeze({ required: false, type: 'decimal', note: '§H last price (LastPric). May legitimately differ from close.' }),
  previousClose: Object.freeze({ required: false, type: 'decimal', note: '§H previous close (PrvsClsgPric).' }),

  // ── activity ─────────────────────────────────────────────────────────────────────────────
  volume: Object.freeze({ required: false, type: 'integer', note: '§H volume (TtlTradgQty), in shares/units.' }),
  tradedValue: Object.freeze({ required: false, type: 'decimal', note: '§H traded value (TtlTradgVal), INR.' }),
  transactionCount: Object.freeze({ required: false, type: 'integer', note: '§H transaction count where available (TtlNbOfTxsExctd).' }),

  // ── source provenance (§H, §F.40) ────────────────────────────────────────────────────────
  sourceId: Object.freeze({ required: true, type: 'string', note: '§H source identifier — stable id of the acquisition mechanism.' }),
  sourceRef: Object.freeze({ required: true, type: 'string', note: '§H source file/reference, e.g. the UDiFF filename. Audit/reconciliation anchor.' }),
  sourceTimestamp: Object.freeze({ required: true, type: 'datetime', note: '§H source timestamp/date — when the source published the content.' }),
  ingestionTimestamp: Object.freeze({ required: true, type: 'datetime', note: '§H ingestion timestamp — when IIPS ingested it.' }),

  // ── P01 lineage (mandatory, INV-5 / AD-3) ────────────────────────────────────────────────
  provider: Object.freeze({ required: true, type: 'string', note: 'P01 §3 row 2. Program-internal identity, stable across adapter swaps.' }),
  dataVersion: Object.freeze({ required: true, type: 'string', note: 'P01 §3 row 3 + DV-1/2/3. Source-content vintage.' }),
  asOf: Object.freeze({ required: true, type: 'datetime', note: 'P01 §3 row 6. ISO-8601 UTC snapshot point.' }),
  snapshotId: Object.freeze({ required: true, type: 'string', note: 'P01 §3 row 1 (AD-6). Derived, never supplied by a provider.' }),

  // ── freshness (§H "freshness/status metadata") ───────────────────────────────────────────
  freshness: Object.freeze({ required: false, type: 'object', note: '§H/§Q. Populated on the CURRENT-STATE view only. An EOD bar is immutable history (INV-2), so freshness is a property of the view, not of the stored bar; uiDataContract.js attaches it at projection time.' }),
});

export const FIELD_NAMES = Object.freeze(Object.keys(FIELDS));

/**
 * The CM-UDiFF ISO tags. Exported **only** so that a test can assert none of them leak into a
 * canonical record or a UI DTO. No canonical or UI code may reference these names.
 */
export const PROVIDER_NATIVE_FIELDS = Object.freeze([
  'TradDt', 'BizDt', 'Sgmt', 'Src', 'FinInstrmTp', 'FinInstrmId', 'ISIN', 'TckrSymb', 'SctySrs',
  'XpryDt', 'FininstrmActlXpryDt', 'TtlNbOfTxsExctd', 'PrvsClsgPric', 'OpnPric', 'HighPric',
  'LowPric', 'LastPric', 'ClsPric', 'TtlTradgQty', 'TtlTradgVal', 'RltdRptdTxId', 'RptdTxSts',
  'NewBrdLotQty', 'FaceVal', 'RltdSgmt', 'RltdSrc', 'RltdFinInstrmId', 'RltdISIN',
  'Rsvd01', 'Rsvd02', 'Rsvd03', 'Rsvd04',
]);

/** ISO-8601 date, calendar day. */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
/** ISO-8601 UTC instant. */
const DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
/** ISIN: 2 letters + 9 alnum + 1 check digit. */
const ISIN_RE = /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/;

/**
 * Validate a candidate canonical record against the dictionary.
 *
 * Pure and total: never throws, always returns a verdict, so it can be used inside a pipeline
 * that must quarantine rather than crash.
 *
 * @param {Record<string, unknown>} candidate
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateRecord(candidate) {
  const errors = [];
  if (candidate === null || typeof candidate !== 'object') {
    return { valid: false, errors: ['record is not an object'] };
  }
  for (const [name, spec] of Object.entries(FIELDS)) {
    const value = candidate[name];
    const absent = value === undefined || value === null || value === '';
    if (absent) {
      if (spec.required) errors.push(`${name}: REQUIRED and absent`);
      continue;
    }
    switch (spec.type) {
      case 'date':
        if (typeof value !== 'string' || !DATE_RE.test(value)) errors.push(`${name}: not YYYY-MM-DD (${String(value)})`);
        break;
      case 'datetime':
        if (typeof value !== 'string' || !DATETIME_RE.test(value)) errors.push(`${name}: not ISO-8601 UTC (${String(value)})`);
        break;
      case 'isin':
        if (typeof value !== 'string' || !ISIN_RE.test(value)) errors.push(`${name}: not a well-formed ISIN (${String(value)})`);
        break;
      case 'enum':
        if (!spec.values.includes(value)) errors.push(`${name}: '${String(value)}' not in [${spec.values.join(', ')}]`);
        break;
      case 'integer':
        if (typeof value !== 'number' || !Number.isInteger(value)) errors.push(`${name}: not an integer (${String(value)})`);
        break;
      case 'decimal':
        if (typeof value !== 'number' || !Number.isFinite(value)) errors.push(`${name}: not a finite number (${String(value)})`);
        break;
      case 'object':
        if (typeof value !== 'object' || Array.isArray(value)) errors.push(`${name}: not an object`);
        break;
      case 'string':
        if (typeof value !== 'string') errors.push(`${name}: not a string`);
        break;
      default:
        errors.push(`${name}: unknown type '${spec.type}' in FIELDS`);
    }
  }
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
}

/**
 * Derive `snapshotId` using the FROZEN AD-6 format. Deliberately the only place the format
 * string exists, so it cannot be forked.
 *
 * @param {{provider:string, dataVersion:string, asOf:string}} lineage
 * @returns {string}
 */
export function buildSnapshotId({ provider, dataVersion, asOf }) {
  if (!provider || !dataVersion || !asOf) {
    throw new Error('R-2/AD-6: snapshotId requires provider, dataVersion and asOf (P01 §3, INV-5)');
  }
  return `data-${provider}-${dataVersion}-${asOf}`;
}

/**
 * Freeze a canonical record (INV-2 immutability). Also guards against a caller having smuggled
 * in a provider-native field name, which would breach INV-10 / NFR-06.
 *
 * @param {Record<string, unknown>} record
 * @returns {Readonly<Record<string, unknown>>}
 * @throws {Error} on a provider-native field name, or on an unknown field
 */
export function freezeRecord(record) {
  for (const key of Object.keys(record)) {
    if (PROVIDER_NATIVE_FIELDS.includes(key)) {
      throw new Error(`R-2/INV-10 violation: provider-native field '${key}' reached the canonical contract`);
    }
    if (!FIELD_NAMES.includes(key)) {
      throw new Error(`R-2: '${key}' is not a member of ${SCHEMA_ID}@${SCHEMA_VERSION}`);
    }
  }
  return Object.freeze({ ...record, schemaId: SCHEMA_ID, schemaVersion: SCHEMA_VERSION });
}

/**
 * Machine-readable schema descriptor. R-2 §H requires the contract be "documented and
 * versionable" — this is the artefact a consumer validates against, and it is stable enough to
 * be emitted into evidence.
 */
export const SCHEMA_DESCRIPTOR = Object.freeze({
  schemaId: SCHEMA_ID,
  schemaVersion: SCHEMA_VERSION,
  priceCurrency: PRICE_CURRENCY,
  requiredFields: Object.freeze(
    Object.entries(FIELDS).filter(([, s]) => s.required).map(([n]) => n),
  ),
  optionalFields: Object.freeze(
    Object.entries(FIELDS).filter(([, s]) => !s.required).map(([n]) => n),
  ),
  fieldCount: FIELD_NAMES.length,
  lineageFormat: 'data-${provider}-${dataVersion}-${asOf}',
  lineageAuthority: 'P01_DATA_CONTRACT.md §3.1 row 1 (AD-6) — FROZEN',
});
