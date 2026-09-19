/**
 * Institutional Investment Platform System (IIPS)
 * Canonical Market Data Product Transport DTO (P12 / D01 / D02)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W3-AUTH-2026-01
 */

import { ExecutiveProvenance, ProductTransportMode } from './types.js';
import { QualityState } from '../contracts/types.js';

export interface MarketDataDTO {
  companyId: string;
  symbol: string;
  exchange: 'NSE' | 'BSE';
  ltp: number;
  open: number;
  high: number;
  low: number;
  close?: number;
  previousClose: number;
  change: number;
  pctChange: number;
  volume: number;
  vwap?: number;
  turnover?: number;
  tradeCount?: number;
  mode: ProductTransportMode;
  quality: QualityState;
  provenance: ExecutiveProvenance;
}
