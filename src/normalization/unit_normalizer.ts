/**
 * Institutional Investment Platform System (IIPS)
 * Base-Unit Normalization Engine (P06)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 */

/**
 * Converts integer Paisa to exact INR decimal value without floating-point drift.
 * 1 INR = 100 Paisa.
 */
export function paisaToInr(paisa: number | bigint): number {
  if (typeof paisa === 'bigint') {
    const whole = Number(paisa / 100n);
    const remainder = Number(paisa % 100n);
    return Number(`${whole}.${Math.abs(remainder).toString().padStart(2, '0')}`);
  }
  if (!Number.isFinite(paisa)) {
    throw new Error(`Invalid paisa value: ${paisa}`);
  }
  // Decimal math avoiding floating point 0.1 + 0.2 style anomalies
  return Math.round(paisa) / 100;
}

/**
 * Converts INR to integer Paisa.
 */
export function inrToPaisa(inr: number): number {
  if (!Number.isFinite(inr)) {
    throw new Error(`Invalid INR value: ${inr}`);
  }
  return Math.round(inr * 100);
}

/**
 * Standardizes volume to strictly positive integer shares.
 */
export function normalizeShareQuantity(qty: number): number {
  if (!Number.isFinite(qty) || qty < 0) {
    throw new Error(`Invalid share quantity: ${qty}`);
  }
  return Math.floor(qty);
}

/**
 * Multiplier units for Indian financial disclosures.
 */
export type FinancialUnit = 'BASE_INR' | 'THOUSANDS' | 'LAKHS' | 'CRORES' | 'MILLIONS' | 'BILLIONS';

export function normalizeFinancialAmount(amount: number, unit: FinancialUnit): number {
  if (!Number.isFinite(amount)) {
    throw new Error(`Invalid financial amount: ${amount}`);
  }
  switch (unit) {
    case 'BASE_INR':
      return amount;
    case 'THOUSANDS':
      return Math.round(amount * 1_000 * 100) / 100;
    case 'LAKHS':
      return Math.round(amount * 100_000 * 100) / 100;
    case 'CRORES':
      return Math.round(amount * 10_000_000 * 100) / 100;
    case 'MILLIONS':
      return Math.round(amount * 1_000_000 * 100) / 100;
    case 'BILLIONS':
      return Math.round(amount * 1_000_000_000 * 100) / 100;
    default:
      throw new Error(`Unsupported financial unit: ${unit}`);
  }
}
