/**
 * Institutional Investment Platform System (IIPS)
 * IPD HTTP Boundary Configuration (NP04-G24 / §15)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Execution Mode: NON_PRODUCTION
 *
 * This boundary is ADDITIVE. It does not replace the existing frontend
 * development/runtime model and does not touch the certified IRR HTTP server.
 */

import { OidcConfigurationError } from '../auth/errors.js';

export const IPD_HTTP_PORT_ENV = 'IPD_HTTP_PORT';
export const IPD_HTTP_HOST_ENV = 'IPD_HTTP_HOST';

export const DEFAULT_HTTP_PORT = 8099;
export const DEFAULT_HTTP_HOST = '127.0.0.1';

/** Maximum accepted request body size (8 MiB). */
export const MAX_BODY_BYTES = 8 * 1024 * 1024;

export interface IpdHttpConfig {
  readonly port: number;
  readonly host: string;
}

export function loadIpdHttpConfig(env: NodeJS.ProcessEnv = process.env): IpdHttpConfig {
  const rawPort = env[IPD_HTTP_PORT_ENV];
  let port = DEFAULT_HTTP_PORT;

  if (rawPort !== undefined && String(rawPort).trim() !== '') {
    const parsed = Number(rawPort);
    if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
      throw new OidcConfigurationError(
        `Invalid ${IPD_HTTP_PORT_ENV}: must be an integer in (0, 65535].`
      );
    }
    port = parsed;
  }

  const host = (env[IPD_HTTP_HOST_ENV] ?? DEFAULT_HTTP_HOST).trim();

  return { port, host };
}
