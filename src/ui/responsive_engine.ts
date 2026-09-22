/**
 * Institutional Investment Platform System (IIPS)
 * ResponsiveEngine: Four-Tier Layout Resolver & Viewport Adaptation (P14 / AD-18)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W4-AUTH-2026-01
 */

import { ResponsiveTier, BreakpointConfig, RESPONSIVE_BREAKPOINTS } from './types.js';

export interface FormattedCellOptions {
  isPinned?: boolean;
  truncateLineageHash?: boolean; // If true, short hash displayed with full title/aria-label tooltip
}

export class ResponsiveEngine {
  /**
   * Resolves responsive tier configuration based on viewport width in pixels
   */
  public static resolveTier(viewportWidthPx: number): BreakpointConfig {
    if (viewportWidthPx < 768) {
      return RESPONSIVE_BREAKPOINTS.MOBILE;
    }
    if (viewportWidthPx < 1024) {
      return RESPONSIVE_BREAKPOINTS.TABLET;
    }
    if (viewportWidthPx < 1440) {
      return RESPONSIVE_BREAKPOINTS.DESKTOP;
    }
    return RESPONSIVE_BREAKPOINTS.WIDE;
  }

  /**
   * Generates CSS layout container classes based on responsive tier
   */
  public static getContainerClass(tier: ResponsiveTier): string {
    switch (tier) {
      case 'MOBILE':
        return 'iips-layout-mobile iips-grid-1-col iips-dense-stack';
      case 'TABLET':
        return 'iips-layout-tablet iips-grid-2-col iips-adaptive-split';
      case 'DESKTOP':
        return 'iips-layout-desktop iips-grid-3-col iips-institutional-standard';
      case 'WIDE':
      default:
        return 'iips-layout-wide iips-grid-4-col iips-dense-multi-panel';
    }
  }

  /**
   * Format numbers with institutional precision, currency unit, and zero silent clipping
   */
  public static formatCurrency(value: number | null | undefined, currency: string = 'INR'): string {
    if (value === null || value === undefined) return 'N/A';
    return `${currency} ${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  /**
   * Format percentage with institutional precision (+/- sign)
   */
  public static formatPercent(value: number | null | undefined): string {
    if (value === null || value === undefined) return 'N/A';
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  }

  /**
   * Formats lineage hashes without silent truncation: produces copyable/inspectable cell
   */
  public static formatLineageHash(hash: string, tier: ResponsiveTier): { display: string; full: string; html: string } {
    if (!hash || hash.length !== 64) {
      return { display: hash || 'UNKNOWN', full: hash || 'UNKNOWN', html: `<span>${hash || 'UNKNOWN'}</span>` };
    }

    if (tier === 'MOBILE') {
      const short = `${hash.substring(0, 8)}...${hash.substring(56)}`;
      return {
        display: short,
        full: hash,
        html: `<span class="iips-hash-badge" title="${hash}" aria-label="Lineage Hash: ${hash}" data-full-hash="${hash}">${short}</span>`,
      };
    }

    return {
      display: hash,
      full: hash,
      html: `<code class="iips-hash-full" aria-label="Lineage Hash: ${hash}">${hash}</code>`,
    };
  }

  /**
   * Renders dense mobile-safe responsive table with pinned primary identifier column
   */
  public static renderResponsiveTable(params: {
    tier: ResponsiveTier;
    caption: string;
    primaryColumnHeader: string;
    otherHeaders: string[];
    rows: Array<{ primaryId: string; primaryLabel: string; values: string[] }>;
  }): string {
    const isMobile = params.tier === 'MOBILE';
    const containerClass = isMobile
      ? 'iips-table-responsive-container iips-scroll-x iips-has-pinned-col'
      : 'iips-table-responsive-container';

    const pinnedThClass = isMobile ? 'iips-th-pinned' : '';
    const pinnedTdClass = isMobile ? 'iips-td-pinned' : '';

    const headerCells =
      `<th scope="col" class="${pinnedThClass}">${params.primaryColumnHeader}</th>` +
      params.otherHeaders.map((h) => `<th scope="col">${h}</th>`).join('');

    const bodyRows = params.rows
      .map((r) => {
        const primaryCell = `<th scope="row" class="${pinnedTdClass}">${r.primaryLabel}</th>`;
        const otherCells = r.values.map((v) => `<td>${v}</td>`).join('');
        return `<tr>${primaryCell}${otherCells}</tr>`;
      })
      .join('');

    return (
      `<div class="${containerClass}">` +
      `<table class="iips-dense-table" aria-label="${params.caption}">` +
      `<caption>${params.caption}</caption>` +
      `<thead><tr>${headerCells}</tr></thead>` +
      `<tbody>${bodyRows}</tbody>` +
      `</table>` +
      `</div>`
    );
  }
}
