/**
 * Local personal-use mapper — manual portfolio entries.
 *
 * This module maps wire holdings (broker-observed core fields: symbol,
 * quantity, averageBuyPrice, currentPrice and the optional active flag) onto
 * the store's full HoldingInput. The IPD provider derives every identity,
 * arithmetic and digest value itself; the caller can never assert them (the
 * wire refuses the identity keys anyway).
 *
 * Manual entries are NOT broker observations and NOT master-resolved rows:
 * companyId is a stable self-referential sentinel (`MANUAL:<SYMBOL>`),
 * `identityStatus` is UNRESOLVED and `resolutionDisposition` is
 * MANUAL_PERSONAL_ENTRY, so a later audit can never confuse a manual entry
 * with a canonical mapping. The arithmetic (marketValue, weightPercentage) and
 * both digests (provenanceDigest, per-holding lineageDigest) are computed
 * server-side; nothing caller-supplied is trusted.
 *
 * `isin`/`exchange` are deliberately NOT admitted: the durable schema has no
 * such columns and silently discarding them would be a lie. A manual entry is
 * tracked by its symbol alone.
 */
import { createHash } from 'node:crypto';
import {
  InvalidPortfolioRequestError,
  type HoldingInput,
  type PortfolioSaveRequest,
} from './portfolio_store.js';

const SYMBOL_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._&-]{0,39}$/;
const MAX_HOLDINGS = 200;
const MAX_QUANTITY = 1e9;
const MAX_PRICE = 1e12;

const round2 = (value: number): number => Math.round(value * 100) / 100;
const round4 = (value: number): number => Math.round(value * 10000) / 10000;

function asRecord(entry: unknown, index: number): Record<string, unknown> {
  if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
    throw new InvalidPortfolioRequestError(`holdings[${index}] must be an object`);
  }
  return entry as Record<string, unknown>;
}

function requiredFiniteNumber(value: unknown, field: string, index: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new InvalidPortfolioRequestError(`holdings[${index}].${field} must be a finite number`);
  }
  return value;
}

const digest = (value: unknown): string =>
  createHash('sha256').update(JSON.stringify(value), 'utf8').digest('hex');

/** Maps a wire holding onto a full HoldingInput. */
export function mapManualHolding(entry: unknown, index: number): HoldingInput {
  const record = asRecord(entry, index);
  const rawSymbol = record.symbol;
  if (typeof rawSymbol !== 'string') {
    throw new InvalidPortfolioRequestError(`holdings[${index}].symbol must be a string`);
  }
  const symbol = rawSymbol.trim().toUpperCase();
  if (symbol.length === 0 || !SYMBOL_PATTERN.test(symbol)) {
    throw new InvalidPortfolioRequestError(`holdings[${index}].symbol is not an admissible symbol`);
  }

  const quantity = requiredFiniteNumber(record.quantity, 'quantity', index);
  if (quantity <= 0 || quantity > MAX_QUANTITY) {
    throw new InvalidPortfolioRequestError(`holdings[${index}].quantity must be within (0, ${MAX_QUANTITY}]`);
  }
  const averageBuyPrice = requiredFiniteNumber(record.averageBuyPrice, 'averageBuyPrice', index);
  const currentPrice = requiredFiniteNumber(record.currentPrice, 'currentPrice', index);
  if (averageBuyPrice < 0 || averageBuyPrice > MAX_PRICE) {
    throw new InvalidPortfolioRequestError(`holdings[${index}].averageBuyPrice is out of range`);
  }
  if (currentPrice < 0 || currentPrice > MAX_PRICE) {
    throw new InvalidPortfolioRequestError(`holdings[${index}].currentPrice is out of range`);
  }
  const active = record.active === undefined
    ? true
    : typeof record.active === 'boolean'
      ? record.active
      : (() => { throw new InvalidPortfolioRequestError(`holdings[${index}].active must be a boolean`); })();

  const marketValue = round2(quantity * currentPrice);
  const lineageDigest = digest({
    symbol,
    quantity: round4(quantity),
    averageBuyPrice: round2(averageBuyPrice),
    currentPrice: round2(currentPrice),
  });
  return {
    symbol,
    companyId: `MANUAL:${symbol}`,
    quantity: round4(quantity),
    averageBuyPrice: round2(averageBuyPrice),
    currentPrice: round2(currentPrice),
    marketValue,
    // Set by mapManualRequest once the batch total value is known.
    weightPercentage: 0,
    active,
    sourceBroker: 'manual-personal',
    lineageDigest,
    identityStatus: 'UNRESOLVED',
    resolutionDisposition: 'MANUAL_PERSONAL_ENTRY',
  };
}

/**
 * Parses and maps a wire holdings array into a complete PortfolioSaveRequest,
 * computing total market value, weights and the provenance digest server-side.
 * Duplicate symbols are refused; values outside range are refused; nothing is
 * defaulted silently.
 */
export function mapManualRequest(
  holdingsInput: unknown,
  operation: 'MERGE' | 'REPLACE' = 'MERGE',
): PortfolioSaveRequest {
  if (!Array.isArray(holdingsInput)) {
    throw new InvalidPortfolioRequestError('holdings must be an array');
  }
  if (holdingsInput.length === 0) {
    throw new InvalidPortfolioRequestError('at least one holding is required');
  }
  if (holdingsInput.length > MAX_HOLDINGS) {
    throw new InvalidPortfolioRequestError(`at most ${MAX_HOLDINGS} holdings are admitted`);
  }
  const mapped = holdingsInput.map((entry, index) => mapManualHolding(entry, index));
  const symbols = new Set(mapped.map((h) => h.symbol));
  if (symbols.size !== mapped.length) {
    throw new InvalidPortfolioRequestError('duplicate holding symbols in the request');
  }
  const totalValue = mapped.reduce((sum, h) => sum + h.marketValue, 0);
  const withWeights = mapped.map((holding) => ({
    ...holding,
    weightPercentage: totalValue > 0 ? round2((holding.marketValue / totalValue) * 100) : 0,
  }));
  const weightSum = withWeights.reduce((sum, h) => sum + h.weightPercentage, 0);
  if (totalValue > 0 && weightSum !== 100) {
    // Rounding each weight to 2dp can drift the total off exactly 100; the
    // residue is assigned back onto the largest holding so the invariant holds.
    const largest = withWeights.reduce((a, b) => (b.marketValue >= a.marketValue ? b : a));
    largest.weightPercentage = round2(largest.weightPercentage + (100 - weightSum));
  }
  const provenanceDigest = digest({ source: 'manual-personal', holdings: withWeights });
  return { holdings: withWeights, provenanceDigest, operation };
}

/** Reads the integer guard from a wire expectedRevision field. */
export function requireExpectedRevision(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new InvalidPortfolioRequestError('expectedRevision must be a non-negative integer');
  }
  return value;
}
