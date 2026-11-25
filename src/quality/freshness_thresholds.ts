/**
 * Institutional Investment Platform System (IIPS)
 * Configurable Freshness Thresholds (W-25)
 *
 * Governed under: AD-12 / D-4.3 / D-3
 *
 * AD-12 owns the BANDS (GOOD ≤ 1×, STALE ≤ 2×, UNAVAILABLE beyond) and
 * `freshness_evaluator.ts` owns the ARITHMETIC that applies them. This module owns
 * only one thing: WHICH threshold each domain is evaluated against.
 *
 * Design rules, fixed by the W-25 contract before implementation:
 *  - `DEFAULT_FRESHNESS_CONFIG` is the source of every default and is never mutated.
 *  - An override that cannot be proven valid is NOT applied. The domain falls back to
 *    its default and the rejection is recorded, so the effective value is never a guess.
 *  - Rejection is per domain and non-fatal: the platform must not fail to start over a
 *    tuning value. This follows the existing `parseTimeout` precedent in `dhan_config.ts`.
 *  - No I/O happens here. The environment map is supplied by the caller, which keeps the
 *    provider's pre-access posture (and this module) free of disk and network access.
 */

import type { DataDomain } from '../contracts/types.js';
import { DEFAULT_FRESHNESS_CONFIG } from './freshness_evaluator.js';

/** Every domain, in stable order. The map built from this is always complete. */
export const FRESHNESS_DOMAINS: readonly DataDomain[] = Object.freeze([
  'D01_QUOTES',
  'D02_OHLCV',
  'D03_FUNDAMENTALS',
  'D04_CORPORATE_ACTIONS',
  'D05_SECURITY_MASTER',
  'D06_NEWS',
  'D07_ESTIMATES',
  'D08_MACRO',
  'D09_ALTDATA',
] as const);

/** Prefix of the per-domain environment key. The full key is the prefix plus the domain. */
export const FRESHNESS_THRESHOLD_ENV_PREFIX = 'IIPS_FRESHNESS_THRESHOLD_SECONDS_';

/** `IIPS_FRESHNESS_THRESHOLD_SECONDS_` + the bare domain tag. Never a lookup table. */
export function freshnessThresholdEnvKey(domain: DataDomain): string {
  return `${FRESHNESS_THRESHOLD_ENV_PREFIX}${domain}`;
}

/**
 * Upper bound on an override, per domain class.
 *
 * Intraday domains are bounded at 7 days: past that a quote or daily close is not a
 * current-market statement at all, so accepting it as "fresh" would defeat AD-12 rather
 * than tune it. Calendar-scaled domains are bounded at 365 days, the largest horizon at
 * which "fresh" still describes a current fact.
 */
const INTRADAY_MAX_SECONDS = 7 * 24 * 60 * 60;
const CALENDAR_MAX_SECONDS = 365 * 24 * 60 * 60;
const MAX_THRESHOLD_SECONDS: Readonly<Record<DataDomain, number>> = Object.freeze({
  D01_QUOTES: INTRADAY_MAX_SECONDS,
  D02_OHLCV: INTRADAY_MAX_SECONDS,
  D03_FUNDAMENTALS: CALENDAR_MAX_SECONDS,
  D04_CORPORATE_ACTIONS: CALENDAR_MAX_SECONDS,
  D05_SECURITY_MASTER: CALENDAR_MAX_SECONDS,
  D06_NEWS: INTRADAY_MAX_SECONDS,
  D07_ESTIMATES: CALENDAR_MAX_SECONDS,
  D08_MACRO: CALENDAR_MAX_SECONDS,
  D09_ALTDATA: CALENDAR_MAX_SECONDS,
});

/** Minimum accepted threshold. `0` would make every observation STALE at best. */
export const MIN_FRESHNESS_THRESHOLD_SECONDS = 1;

/** Upper bound for one domain's override, inclusive. */
export function maxFreshnessThresholdSeconds(domain: DataDomain): number {
  return MAX_THRESHOLD_SECONDS[domain];
}

/** Why a supplied override was not applied. `null` means it was accepted. */
export type FreshnessThresholdIssue = 'INVALID_NUMBER' | 'OUT_OF_RANGE';

export type FreshnessThresholdSource = 'DEFAULT' | 'ENVIRONMENT' | 'OPTION';

/** One domain that was *mentioned* by configuration, accepted or rejected. */
export interface FreshnessThresholdOverrideReport {
  readonly domain: DataDomain;
  /** The effective threshold for this domain after validation. */
  readonly seconds: number;
  readonly source: FreshnessThresholdSource;
  /** The supplied literal, echoed so the operator can see what was ignored. */
  readonly raw: string;
  readonly issue: FreshnessThresholdIssue | null;
}

/** Effective thresholds — complete by construction, so a consumer never merges defaults. */
export type ResolvedFreshnessThresholds = Readonly<Record<DataDomain, number>>;

export interface ResolvedFreshnessThresholdConfig {
  readonly thresholds: ResolvedFreshnessThresholds;
  /** Only domains configuration mentioned. An absent domain is unmentioned, not rejected. */
  readonly overrides: readonly FreshnessThresholdOverrideReport[];
}

export type FreshnessEnvSource = Readonly<Record<string, string | undefined>>;

/** Explicit per-domain values supplied by an embedding caller (not from the environment). */
export type FreshnessThresholdOverrides = Partial<Record<DataDomain, number>>;

/**
 * Parses one supplied literal.
 *
 * Accepts only an optionally-signed run of decimal digits, so `'1e3'` and `' 1.5 '` are
 * rejected rather than silently reinterpreted at a different magnitude. Returns `null`
 * for anything that is not a whole number.
 */
function parseThresholdLiteral(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^[+-]?\d+$/.test(trimmed)) return null;
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isSafeInteger(parsed)) return null;
  return parsed;
}

interface Candidate {
  readonly source: 'ENVIRONMENT' | 'OPTION';
  readonly raw: string;
  readonly value: unknown;
}

/**
 * Validates one candidate and produces its report. A rejected candidate reports the
 * DEFAULT threshold with `source: 'DEFAULT'` and the issue that caused the rejection.
 */
function adjudicate(domain: DataDomain, candidate: Candidate): FreshnessThresholdOverrideReport {
  const fallback = DEFAULT_FRESHNESS_CONFIG[domain];
  const { source, raw, value } = candidate;

  let seconds: number | null = null;
  let issue: FreshnessThresholdIssue | null = null;

  if (source === 'ENVIRONMENT') {
    seconds = parseThresholdLiteral(raw);
    if (seconds === null) issue = 'INVALID_NUMBER';
  } else {
    seconds = typeof value === 'number' && Number.isSafeInteger(value) ? value : null;
    if (seconds === null) issue = 'INVALID_NUMBER';
  }

  if (seconds !== null && (seconds < MIN_FRESHNESS_THRESHOLD_SECONDS || seconds > MAX_THRESHOLD_SECONDS[domain])) {
    issue = 'OUT_OF_RANGE';
  }

  if (issue !== null) {
    return { domain, seconds: fallback, source: 'DEFAULT', raw, issue };
  }
  return { domain, seconds: seconds!, source, raw, issue: null };
}

/**
 * Resolves the effective threshold for every domain.
 *
 * Precedence is explicit option value over environment, and the environment over the
 * compiled default, matching how every other provider dependency is injected. Domains
 * supplied by neither source are reported in `thresholds` only — never in `overrides`.
 */
export function resolveFreshnessThresholds(
  env: FreshnessEnvSource = {},
  overrides: FreshnessThresholdOverrides = {}
): ResolvedFreshnessThresholdConfig {
  const thresholds = {} as Record<DataDomain, number>;
  const reports: FreshnessThresholdOverrideReport[] = [];

  for (const domain of FRESHNESS_DOMAINS) {
    const optionValue = overrides[domain];
    const envKey = freshnessThresholdEnvKey(domain);
    const envRaw = env[envKey];

    if (optionValue !== undefined) {
      const report = adjudicate(domain, { source: 'OPTION', raw: String(optionValue), value: optionValue });
      thresholds[domain] = report.seconds;
      reports.push(report);
      continue;
    }

    if (envRaw !== undefined) {
      const report = adjudicate(domain, { source: 'ENVIRONMENT', raw: envRaw, value: envRaw });
      thresholds[domain] = report.seconds;
      reports.push(report);
      continue;
    }

    thresholds[domain] = DEFAULT_FRESHNESS_CONFIG[domain];
  }

  return Object.freeze({
    thresholds: Object.freeze(thresholds),
    overrides: Object.freeze(reports),
  });
}
