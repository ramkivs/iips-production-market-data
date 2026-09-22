/**
 * Institutional Investment Platform System (IIPS)
 * Currency Normalization Engine (P06 / P01-03)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 */

import { CurrencyCode } from '../contracts/types.js';

export const BASE_CURRENCY: CurrencyCode = 'INR';

export interface CurrencyConversionRate {
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  rate: number;
  asOf: string;
}

export class CurrencyNormalizer {
  private rates: Map<string, number> = new Map();

  constructor() {
    // Default 1:1 for INR to INR
    this.rates.set('INR:INR', 1.0);
    // Baseline fixture rate for USD to INR (e.g. 83.50)
    this.rates.set('USD:INR', 83.50);
    this.rates.set('INR:USD', 1 / 83.50);
  }

  public setRate(from: CurrencyCode, to: CurrencyCode, rate: number): void {
    if (rate <= 0) {
      throw new Error(`Exchange rate must be positive: ${rate}`);
    }
    this.rates.set(`${from}:${to}`, rate);
  }

  public convertToBaseCurrency(amount: number, fromCurrency: CurrencyCode): number {
    if (fromCurrency === BASE_CURRENCY) return amount;
    const key = `${fromCurrency}:${BASE_CURRENCY}`;
    const rate = this.rates.get(key);
    if (!rate) {
      throw new Error(`No conversion rate found for ${key}`);
    }
    return Math.round(amount * rate * 100) / 100;
  }
}
