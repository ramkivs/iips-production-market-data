/**
 * Institutional Investment Platform System (IIPS)
 * C1-C6 Namespace Collision Protection Guard (P11-02 / AD-12)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W3-AUTH-2026-01
 */

import { NamespaceViolationError } from './types.js';

export class NamespaceGuard {
  private static readonly NAMESPACE_REGEX = /^MD:(D0[1-9]_[A-Z_]+)\.([a-zA-Z0-9_]+)$/;

  /**
   * Enforces C1-C6 namespace requirements on market data inputs.
   * Fails closed if any key does not start with MD:<domain>.<field>.
   */
  public static validateAndSanitizeInputs(
    rawInputs: Record<string, unknown>
  ): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(rawInputs)) {
      const match = key.match(this.NAMESPACE_REGEX);
      if (!match) {
        throw new NamespaceViolationError(key, 'MD:<domain>.<field>');
      }

      const domain = match[1];
      const fieldName = match[2];

      // Store under namespaced canonical key
      sanitized[`${domain}.${fieldName}`] = value;
    }

    return sanitized;
  }

  /**
   * Helper to format a plain field into a compliant C1-C6 namespaced key.
   */
  public static formatKey(domain: string, fieldName: string): string {
    return `MD:${domain}.${fieldName}`;
  }
}
