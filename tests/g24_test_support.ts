/**
 * Institutional Investment Platform System (IIPS)
 * G24 Durable Persistence — Shared Test Support (NP04-G24 / §17)
 *
 * Every test uses an isolated temporary SQLite database. The development
 * database is never contacted and never contaminated with test data.
 *
 * This file is NOT a test file (it does not match *.test.ts).
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import type { AddressInfo } from 'node:net';

import { initializePersistenceWithConfig } from '../src/persistence/bootstrap.js';
import { temporaryPersistenceConfig } from '../src/persistence/config.js';
import type { PersistenceHandle } from '../src/persistence/bootstrap.js';
import type { UserHoldingInput } from '../frontend/src/features/portfolio/import/types.js';

/** Creates an isolated temporary database path. */
export function tempDatabasePath(label = 'db'): string {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), `ipd-g24-${label}-`));
  return path.join(directory, 'portfolio.sqlite');
}

/** Opens a fully migrated persistence handle against a temporary database. */
export function openTestPersistence(label = 'db'): PersistenceHandle {
  return initializePersistenceWithConfig(temporaryPersistenceConfig(tempDatabasePath(label)));
}

export function closeTestPersistence(handle: PersistenceHandle): void {
  if (handle.isOpen) {
    handle.close();
  }
}

export interface HoldingSpec {
  symbol: string;
  companyId: string;
  quantity: number;
  averageBuyPrice: number;
  currentPrice: number;
  isin?: string;
  exchange?: 'NSE' | 'BSE';
  sourceBroker?: UserHoldingInput['sourceBroker'];
  identityStatus?: 'RESOLVED' | 'UNRESOLVED';
  resolutionDisposition?: 'CANONICAL_P04' | 'NON_PRODUCTION_OPERATOR_BYPASS';
}

/**
 * Builds a holdings batch whose weights sum to exactly 100.0000%, using the
 * same rounding/residual rule as the governed consolidation.
 */
export function weightedBatch(specs: readonly HoldingSpec[]): UserHoldingInput[] {
  const withValues = specs.map((spec) => ({
    ...spec,
    marketValue: spec.quantity * spec.currentPrice,
  }));

  const total = withValues.reduce((sum, h) => sum + h.marketValue, 0);
  const scale = 10_000;

  const rawWeights = withValues.map((h) =>
    Math.round((total > 0 ? (h.marketValue / total) * 100 : 0) * scale) / scale
  );

  const weightSum = rawWeights.reduce((sum, w) => sum + w, 0);
  let maxIndex = 0;
  let maxValue = -1;
  withValues.forEach((h, i) => {
    if (h.marketValue > maxValue) {
      maxValue = h.marketValue;
      maxIndex = i;
    }
  });

  const residual = Math.round((100.0 - weightSum) * scale) / scale;
  if (residual !== 0 && withValues.length > 0) {
    rawWeights[maxIndex] = Math.round((rawWeights[maxIndex]! + residual) * scale) / scale;
  }

  return withValues.map((h, i) => ({
    symbol: h.symbol,
    companyId: h.companyId,
    isin: h.isin,
    exchange: h.exchange,
    quantity: h.quantity,
    averageBuyPrice: h.averageBuyPrice,
    currentPrice: h.currentPrice,
    marketValue: h.marketValue,
    weightPercentage: rawWeights[i]!,
    active: true,
    sourceBroker: h.sourceBroker ?? 'DHAN',
    lineageDigest: `lineage-${h.companyId}-${h.quantity}`,
    identityStatus: h.identityStatus ?? 'RESOLVED',
    resolutionDisposition: h.resolutionDisposition ?? 'CANONICAL_P04',
  }));
}

/** A stable two-holding DHAN batch that sums to exactly 100.0000%. */
export function dhanBatch(): UserHoldingInput[] {
  return weightedBatch([
    {
      symbol: 'RELIANCE',
      companyId: 'CMP-RELIANCE',
      quantity: 10,
      averageBuyPrice: 2500,
      currentPrice: 2600,
      isin: 'INE002A01018',
      exchange: 'NSE',
    },
    {
      symbol: 'TCS',
      companyId: 'CMP-TCS',
      quantity: 5,
      averageBuyPrice: 3400,
      currentPrice: 3500,
      isin: 'INE467B01029',
      exchange: 'NSE',
    },
  ]);
}

/** A second broker batch (Zerodha) overlapping RELIANCE and adding INFY. */
export function zerodhaBatch(): UserHoldingInput[] {
  return weightedBatch([
    {
      symbol: 'RELIANCE',
      companyId: 'CMP-RELIANCE',
      quantity: 5,
      averageBuyPrice: 2700,
      currentPrice: 2600,
      isin: 'INE002A01018',
      exchange: 'NSE',
      sourceBroker: 'ZERODHA',
    },
    {
      symbol: 'INFY',
      companyId: 'CMP-INFY',
      quantity: 8,
      averageBuyPrice: 1500,
      currentPrice: 1600,
      isin: 'INE009A01021',
      exchange: 'NSE',
      sourceBroker: 'ZERODHA',
    },
  ]);
}

// --------------------------------------------------------------- OIDC support

export interface SigningKey {
  kid: string;
  privateKey: crypto.KeyObject;
  publicJwk: Record<string, unknown>;
  algorithm: 'RS256' | 'ES256';
}

export function generateRsaSigningKey(kid = 'test-rsa-key'): SigningKey {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  const jwk = publicKey.export({ format: 'jwk' }) as Record<string, unknown>;
  return {
    kid,
    privateKey,
    publicJwk: { ...jwk, kid, alg: 'RS256', use: 'sig' },
    algorithm: 'RS256',
  };
}

export function generateEcSigningKey(kid = 'test-ec-key'): SigningKey {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'P-256',
  });
  const jwk = publicKey.export({ format: 'jwk' }) as Record<string, unknown>;
  return {
    kid,
    privateKey,
    publicJwk: { ...jwk, kid, alg: 'ES256', use: 'sig' },
    algorithm: 'ES256',
  };
}

function base64Url(input: Buffer | string): string {
  const buffer = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function signJwt(input: {
  payload: Record<string, unknown>;
  key: SigningKey;
  kid?: string;
  algorithm?: 'RS256' | 'ES256';
}): string {
  const algorithm = input.algorithm ?? input.key.algorithm;
  const header = { alg: algorithm, typ: 'JWT', kid: input.kid ?? input.key.kid };
  const signingInput = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(input.payload))}`;
  const data = Buffer.from(signingInput, 'utf8');

  let signature: Buffer;
  if (algorithm === 'RS256') {
    signature = crypto.sign('RSA-SHA256', data, input.key.privateKey);
  } else {
    signature = crypto.sign('SHA256', data, {
      key: input.key.privateKey,
      dsaEncoding: 'ieee-p1363',
    });
  }

  return `${signingInput}.${base64Url(signature)}`;
}

export interface JwksTestServer {
  url: string;
  close: () => Promise<void>;
}

/** Serves a trusted JWKS document from a local ephemeral HTTP server (tests only). */
export function startJwksServer(keys: readonly Record<string, unknown>[]): Promise<JwksTestServer> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ keys }));
    });
    server.listen(0, '127.0.0.1', () => {
      const port = (server.address() as AddressInfo).port;
      resolve({
        url: `http://127.0.0.1:${port}/jwks`,
        close: () =>
          new Promise<void>((done) => {
            server.close(() => done());
          }),
      });
    });
  });
}
