/**
 * Institutional Investment Platform System (IIPS)
 * D05 Wave-3 Universe Expansion Gate (P04) — validation only; this module deposits NOTHING.
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 * Design: evidence/cross-repository/IIPS_V3_D05_WAVE3_UNIVERSE_EXPANSION_RECEIPT_2026-11-06.md
 *
 * This module is the deterministic, dependency-free conformance gate that a governed
 * Wave-3 expansion deposit MUST pass before any record is merged into the D05 corpus.
 * It closes exactly the failure class observed in B-04/B-05 (no authoritative symbol or
 * full-record fields) by refusing to incorporate any candidate whose evidence is absent —
 * never by inventing attributes. It has no I/O, no clock, no randomness: identical inputs
 * always produce a byte-identical report (verified by tests).
 *
 * Rules are the EXISTING rules, applied, not weakened:
 *  - contract validation via validateInstrumentMaster (d05_security_master contract);
 *  - ISO 6166 ISIN shape + Luhn check digit;
 *  - identifier uniqueness against the prior corpus and within the deposit
 *    (companyId, ISIN, listing symbols per exchange, BSE scrip codes);
 *  - Tier-2 CM eligibility: ACTIVE listingStatus + at least one ACTIVE NSE listing;
 *  - effective window sanity;
 *  - disposition vocabulary identical to the B-04/B-05 handoff:
 *    ADDED / ALREADY_PRESENT / INELIGIBLE / UNRESOLVED.
 *
 * UNRESOLVED is returned whenever authoritative evidence is MISSING (a record that
 * cannot be validated for lack of evidence is not an INELIGIBLE security).
 */

import { SecurityMasterEntity, ExchangeListing } from './security_master.js';
import {
  validateInstrumentMaster,
  InstrumentMasterPayload,
} from '../contracts/d05_security_master.js';

export const D05_WAVE3_GATE_NAME = 'd05-wave3-universe-expansion-gate' as const;
export const D05_WAVE3_GATE_VERSION = 1 as const;

export type Wave3Disposition = 'ADDED' | 'ALREADY_PRESENT' | 'INELIGIBLE' | 'UNRESOLVED';

export type Wave3Verdict =
  | 'ELIGIBLE_NEW'
  | 'ALREADY_IN_CORPUS'
  | 'IDENTITY_CONFLICT'
  | 'DUPLICATE_IN_DEPOSIT'
  | 'CONTRACT_INVALID'
  | 'NOT_ACTIVE_TIER2_CM'
  | 'EFFECTIVE_WINDOW_INVALID'
  | 'MISSING_AUTHORITATIVE_EVIDENCE'
  | 'COMPANY_ID_CONVENTION';

export interface Wave3DispositionRow {
  companyId: string;
  isin: string;
  verdict: Wave3Verdict;
  disposition: Wave3Disposition;
  reasons: string[];
}

export interface Wave3ScopeRow {
  isin: string;
  status: 'PRESENT' | 'ABSENT';
  companyId: string | null;
}

export interface Wave3GateReport {
  gate: { name: typeof D05_WAVE3_GATE_NAME; version: typeof D05_WAVE3_GATE_VERSION };
  priorCount: number;
  candidateCount: number;
  counts: Record<Wave3Disposition, number>;
  dispositions: Wave3DispositionRow[];
  newCompanyIds: string[];
  mergedRecordCount: number;
  scopeCoverage?: { evaluated: number; present: number; absent: number; rows: Wave3ScopeRow[] };
}

export interface Wave3EvaluationOptions {
  /** Optional ISINs to report coverage for (e.g. the 67 B-04 ISINs). Coverage is evidence, not admission. */
  scopeIsins?: readonly string[];
}

/* ── helpers ─────────────────────────────────────────────────────────────── */

const ISIN_REGEX = /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/;
const COMPANY_ID_REGEX = /^EQ_[A-Z0-9_]+_IN$/;

export function isIsinCheckDigitValid(isin: string): boolean {
  if (!ISIN_REGEX.test(isin)) return false;
  const digits = isin.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let total = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = digits.charCodeAt(digits.length - 1 - i) - 48;
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    total += d;
  }
  return total % 10 === 0;
}

function nonBlank(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function validIso(v: unknown): v is string {
  return typeof v === 'string' && !Number.isNaN(Date.parse(v));
}

function positiveFinite(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v > 0;
}

function positiveInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v > 0;
}

function validListingStatus(v: unknown): v is ExchangeListing['status'] {
  return v === 'ACTIVE' || v === 'SUSPENDED' || v === 'DELISTED';
}

/** Collect (exchange,symbol) and BSE scripCode identifiers from an entity-like record. */
function collectListingKeys(listings: ReadonlyArray<ExchangeListing>): string[] {
  const keys: string[] = [];
  for (const l of listings) {
    if (l?.exchange && l?.symbol) keys.push(`${l.exchange}:${l.symbol.trim().toUpperCase()}`);
    if (l?.exchange === 'BSE' && l?.scripCode) keys.push(`BSE_SCRIP:${String(l.scripCode).trim()}`);
  }
  return keys;
}

/* ── gate ────────────────────────────────────────────────────────────────── */

export function evaluateWave3Expansion(
  priorCorpus: readonly SecurityMasterEntity[],
  candidates: readonly SecurityMasterEntity[],
  options?: Wave3EvaluationOptions,
): Wave3GateReport {
  const priorCount = priorCorpus.length;

  // Index the prior corpus once.
  const priorCompanyIds = new Map<string, SecurityMasterEntity>();
  const priorIsins = new Map<string, SecurityMasterEntity>();
  const priorListingKeys = new Map<string, SecurityMasterEntity>();
  const priorCins = new Map<string, SecurityMasterEntity>();
  for (const e of priorCorpus) {
    priorCompanyIds.set(e.companyId, e);
    if (nonBlank(e.isin)) priorIsins.set(e.isin.toUpperCase(), e);
    if (nonBlank(e.cin)) priorCins.set(e.cin.trim().toUpperCase(), e);
    for (const k of collectListingKeys(Array.isArray(e.listings) ? e.listings : [])) {
      if (!priorListingKeys.has(k)) priorListingKeys.set(k, e);
    }
  }

  const dispositions: Wave3DispositionRow[] = [];
  const accepted: SecurityMasterEntity[] = [];
  const depositCompanyIds = new Set<string>();
  const depositIsins = new Set<string>();
  const depositListingKeys = new Set<string>();
  const depositCins = new Set<string>();

  for (const candidate of candidates) {
    const reasons: string[] = [];
    const isin = nonBlank(candidate?.isin) ? candidate.isin.trim().toUpperCase() : '';
    const companyId = nonBlank(candidate?.companyId) ? candidate.companyId.trim() : '';

    const row = (verdict: Wave3Verdict, disposition: Wave3Disposition, extra: string[] = []): Wave3DispositionRow => ({
      companyId, isin, verdict, disposition, reasons: [...reasons, ...extra],
    });

    /* ── structural identifier checks (INELIGIBLE) ─────────────────────────── */
    if (!ISIN_REGEX.test(isin) || !isIsinCheckDigitValid(isin)) {
      reasons.push('ISIN fails ISO 6166 shape or check digit');
      dispositions.push(row('CONTRACT_INVALID', 'INELIGIBLE'));
      continue;
    }
    if (!COMPANY_ID_REGEX.test(companyId)) {
      reasons.push('companyId does not match the governed EQ_<TOKEN>_IN convention');
      dispositions.push(row('COMPANY_ID_CONVENTION', 'INELIGIBLE'));
      continue;
    }

    /* ── Tier-2 CM eligibility (missing evidence → UNRESOLVED; bad → INELIGIBLE) */
    const listingStatusUnknown = !validListingStatus(candidate.listingStatus);
    const hasActiveNse =
      Array.isArray(candidate.listings) &&
      candidate.listings.some((l) => l?.exchange === 'NSE' && l?.status === 'ACTIVE' && nonBlank(l?.symbol));
    if (listingStatusUnknown) {
      reasons.push('listingStatus absent or unrecognised');
      dispositions.push(row('MISSING_AUTHORITATIVE_EVIDENCE', 'UNRESOLVED'));
      continue;
    }
    if (candidate.listingStatus !== 'ACTIVE') {
      reasons.push(`listingStatus=${candidate.listingStatus} — Tier-2 CM admits ACTIVE listings only`);
      dispositions.push(row('NOT_ACTIVE_TIER2_CM', 'INELIGIBLE'));
      continue;
    }
    if (!hasActiveNse) {
      reasons.push('no ACTIVE NSE listing with a symbol is evidenced');
      dispositions.push(row('MISSING_AUTHORITATIVE_EVIDENCE', 'UNRESOLVED'));
      continue;
    }

    /* ── missing authoritative fields (UNRESOLVED) — never invented ────────── */
    const missing: string[] = [];
    if (!positiveInt(candidate.lotSize)) missing.push('lotSize (positive integer)');
    if (!positiveFinite(candidate.tickSize)) missing.push('tickSize (positive number)');
    if (!positiveFinite(candidate.faceValue)) missing.push('faceValue (positive number)');
    if (!nonBlank(candidate.industry)) missing.push('industry');
    if (!nonBlank(candidate.sector)) missing.push('sector');
    if (!nonBlank(candidate.companyName)) missing.push('companyName');
    if (!nonBlank(candidate.currency)) missing.push('currency');
    if (missing.length > 0) {
      reasons.push(...missing.map((m) => `missing authoritative field: ${m}`));
      dispositions.push(row('MISSING_AUTHORITATIVE_EVIDENCE', 'UNRESOLVED'));
      continue;
    }
    if (candidate.currency !== 'INR' && candidate.currency !== 'USD') {
      reasons.push(`currency=${candidate.currency} — only INR/USD admitted for governed D05 records`);
      dispositions.push(row('CONTRACT_INVALID', 'INELIGIBLE'));
      continue;
    }

    /* ── listing entries themselves must be internally valid + evidenced ───── */
    const listingOverallProblem = (l: ExchangeListing | undefined, i: number): string | null => {
      if (!l) return `listings[${i}] absent`;
      if (l.exchange !== 'NSE' && l.exchange !== 'BSE') return `listings[${i}].exchange=${String(l?.exchange)} — only NSE/BSE admitted`;
      if (!nonBlank(l.symbol)) return `listings[${i}].symbol absent`;
      if (!validListingStatus(l.status)) return `listings[${i}].status absent or unrecognised`;
      if (!positiveInt(l.lotSize)) return `listings[${i}].lotSize (positive integer) missing/invalid`;
      if (!positiveFinite(l.tickSize)) return `listings[${i}].tickSize (positive number) missing/invalid`;
      if (l.exchange === 'BSE' && l.scripCode !== undefined && !nonBlank(String(l.scripCode))) {
        return `listings[${i}].scripCode present but blank`;
      }
      return null;
    };
    const listingProblems = (candidate.listings ?? []).map(listingOverallProblem).filter((p): p is string => p !== null);
    if (!Array.isArray(candidate.listings) || candidate.listings.length === 0) {
      reasons.push('listings absent — no exchange listing evidence at all');
      dispositions.push(row('MISSING_AUTHORITATIVE_EVIDENCE', 'UNRESOLVED'));
      continue;
    }
    if (listingProblems.length > 0) {
      const exchangeProblems = listingProblems.filter((p) => p.includes('exchange='));
      if (exchangeProblems.length === listingProblems.length) {
        reasons.push(...exchangeProblems);
        dispositions.push(row('CONTRACT_INVALID', 'INELIGIBLE'));
      } else {
        reasons.push(...listingProblems.filter((p) => !p.includes('exchange=')));
        dispositions.push(row('MISSING_AUTHORITATIVE_EVIDENCE', 'UNRESOLVED'));
      }
      continue;
    }

    /* ── effective window (INELIGIBLE) ────────────────────────────────────── */
    if (!validIso(candidate.effectiveFrom)) {
      reasons.push('effectiveFrom is absent or not a parseable ISO-8601 instant');
      dispositions.push(row('EFFECTIVE_WINDOW_INVALID', 'INELIGIBLE'));
      continue;
    }
    if (candidate.effectiveTo !== undefined) {
      if (!validIso(candidate.effectiveTo) || Date.parse(candidate.effectiveTo) < Date.parse(candidate.effectiveFrom)) {
        reasons.push('effectiveTo precedes effectiveFrom or is unparsable');
        dispositions.push(row('EFFECTIVE_WINDOW_INVALID', 'INELIGIBLE'));
        continue;
      }
    }

    /* ── listing structural validation vs contract (INELIGIBLE) ───────────── */
    const payload: InstrumentMasterPayload = {
      companyId,
      isin,
      cin: nonBlank(candidate.cin) ? candidate.cin.trim() : undefined,
      nseSymbol: candidate.nseSymbol,
      bseSymbol: candidate.bseSymbol,
      bseScripCode: candidate.bseScripCode,
      companyName: String(candidate.companyName).trim(),
      industry: String(candidate.industry).trim(),
      sector: String(candidate.sector).trim(),
      listingStatus: candidate.listingStatus as InstrumentMasterPayload['listingStatus'],
      lotSize: candidate.lotSize as number,
      tickSize: candidate.tickSize as number,
      faceValue: candidate.faceValue as number,
      currency: candidate.currency as InstrumentMasterPayload['currency'],
      effectiveFrom: new Date(candidate.effectiveFrom).toISOString(),
      effectiveTo: candidate.effectiveTo ? new Date(candidate.effectiveTo).toISOString() : undefined,
      listings: (candidate.listings ?? []).map((l) => ({
        exchange: l.exchange,
        symbol: String(l.symbol ?? '').trim().toUpperCase(),
        scripCode: l.exchange === 'BSE' ? l.scripCode : undefined,
        status: validListingStatus(l.status) ? l.status : 'DELISTED',
        lotSize: l.lotSize,
        tickSize: l.tickSize,
      })),
    };
    const validation = validateInstrumentMaster(payload);
    if (!validation.isValid) {
      for (const e of validation.errors) reasons.push(`contract ${e.field}: ${e.code} — ${e.message}`);
      dispositions.push(row('CONTRACT_INVALID', 'INELIGIBLE'));
      continue;
    }

    /* ── uniqueness / conflict against prior corpus ───────────────────────── */
    if (priorCompanyIds.has(companyId)) {
      if (priorIsins.get(isin)?.companyId === companyId) {
        dispositions.push(row('ALREADY_IN_CORPUS', 'ALREADY_PRESENT', ['identical companyId+ISIN pair already governed']));
        continue;
      }
      reasons.push('companyId already governed by another record');
      dispositions.push(row('IDENTITY_CONFLICT', 'INELIGIBLE'));
      continue;
    }
    const isinMatch = priorIsins.get(isin);
    if (isinMatch) {
      reasons.push(`ISIN governed by ${isinMatch.companyId} — different record`);
      dispositions.push(row('IDENTITY_CONFLICT', 'INELIGIBLE'));
      continue;
    }
    if (nonBlank(candidate.cin)) {
      const cinMatch = priorCins.get(candidate.cin.trim().toUpperCase());
      if (cinMatch && cinMatch.companyId !== companyId) {
        reasons.push(`CIN governed by ${cinMatch.companyId}`);
        dispositions.push(row('IDENTITY_CONFLICT', 'INELIGIBLE'));
        continue;
      }
    }
    for (const k of collectListingKeys(candidate.listings ?? [])) {
      const m = priorListingKeys.get(k);
      if (m) {
        reasons.push(`listing identifier ${k} already governed by ${m.companyId}`);
        dispositions.push(row('IDENTITY_CONFLICT', 'INELIGIBLE'));
        break;
      }
    }
    if (reasons.length > 0) {
      dispositions.push(row('IDENTITY_CONFLICT', 'INELIGIBLE'));
      continue;
    }

    /* ── uniqueness / conflict within the deposit ─────────────────────────── */
    if (depositCompanyIds.has(companyId) || depositIsins.has(isin)) {
      reasons.push('duplicate companyId or ISIN within the deposit');
      dispositions.push(row('DUPLICATE_IN_DEPOSIT', 'INELIGIBLE'));
      continue;
    }
    let depositConflict = false;
    for (const k of collectListingKeys(candidate.listings ?? [])) {
      if (depositListingKeys.has(k)) { depositConflict = true; reasons.push(`listing identifier ${k} duplicated within deposit`); }
    }
    if (nonBlank(candidate.cin)) {
      const cinKey = candidate.cin.trim().toUpperCase();
      if (depositCins.has(cinKey)) { depositConflict = true; reasons.push('CIN duplicated within deposit'); }
    }
    if (depositConflict) {
      dispositions.push(row('DUPLICATE_IN_DEPOSIT', 'INELIGIBLE'));
      continue;
    }

    /* ── eligible ─────────────────────────────────────────────────────────── */
    depositCompanyIds.add(companyId);
    depositIsins.add(isin);
    if (nonBlank(candidate.cin)) depositCins.add(candidate.cin.trim().toUpperCase());
    for (const k of collectListingKeys(candidate.listings ?? [])) depositListingKeys.add(k);
    accepted.push({
      ...candidate,
      companyId,
      isin,
      listings: (candidate.listings ?? []).map((l) => ({
        ...l,
        symbol: String(l.symbol ?? '').trim().toUpperCase(),
      })),
    });
    dispositions.push(row('ELIGIBLE_NEW', 'ADDED'));
  }

  const counts: Record<Wave3Disposition, number> = { ADDED: 0, ALREADY_PRESENT: 0, INELIGIBLE: 0, UNRESOLVED: 0 };
  for (const d of dispositions) counts[d.disposition] += 1;

  const newCompanyIds = [...accepted]
    .map((e) => e.companyId)
    .sort();

  const report: Wave3GateReport = {
    gate: { name: D05_WAVE3_GATE_NAME, version: D05_WAVE3_GATE_VERSION },
    priorCount,
    candidateCount: candidates.length,
    counts,
    dispositions,
    newCompanyIds,
    mergedRecordCount: priorCount + accepted.length,
  };

  const scopeIsins = options?.scopeIsins;
  if (scopeIsins && scopeIsins.length > 0) {
    const seen = new Map<string, string>();
    for (const e of [...priorCorpus, ...accepted]) {
      if (nonBlank(e.isin)) seen.set(e.isin.toUpperCase(), e.companyId);
    }
    const rows = scopeIsins.map((raw) => {
      const key = raw.trim().toUpperCase();
      const hit = seen.get(key);
      return hit ? { isin: key, status: 'PRESENT' as const, companyId: hit } : { isin: key, status: 'ABSENT' as const, companyId: null };
    });
    const present = rows.filter((r) => r.status === 'PRESENT').length;
    report.scopeCoverage = { evaluated: rows.length, present, absent: rows.length - present, rows };
  }

  return report;
}

export interface ProposedMerge {
  entities: SecurityMasterEntity[];
}

/** Deterministically materialise the merged corpus (prior rows first — byte-order preserved; new rows appended by companyId). */
export function materialiseMergedCorpus(
  priorCorpus: readonly SecurityMasterEntity[],
  candidates: readonly SecurityMasterEntity[],
): ProposedMerge {
  const decisions = new Map<string, Wave3Disposition>();
  for (const row of evaluateWave3Expansion(priorCorpus, candidates).dispositions) {
    decisions.set(row.isin, row.disposition);
  }
  const accepted = candidates
    .filter((c) => decisions.get(c.isin.trim().toUpperCase()) === 'ADDED')
    .map((c) => ({
      ...c,
      companyId: c.companyId.trim(),
      isin: c.isin.trim().toUpperCase(),
      listings: (c.listings ?? []).map((l) => ({ ...l, symbol: String(l.symbol ?? '').trim().toUpperCase() })),
    }))
    .sort((a, b) => a.companyId.localeCompare(b.companyId));
  return { entities: [...priorCorpus, ...accepted] };
}
