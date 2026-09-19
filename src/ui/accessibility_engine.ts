/**
 * Institutional Investment Platform System (IIPS)
 * AccessibilityEngine: WCAG 2.1 AA Compliance & Keyboard/Screen-Reader Support (P14 / AD-18)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W4-AUTH-2026-01
 */

import { QualityState } from '../contracts/types.js';
import { UIQualityIndicator } from './types.js';

export interface ContrastResult {
  contrastRatio: number;
  passesNormalText: boolean; // >= 4.5:1
  passesLargeText: boolean;  // >= 3.0:1
  passesGraphical: boolean;  // >= 3.0:1
}

export class AccessibilityEngine {
  /**
   * Generates dual-coded UIQualityIndicator enforcing non-color-only indication (WCAG 2.1 AA SC 1.4.1)
   */
  public static getQualityIndicator(state: QualityState): UIQualityIndicator {
    switch (state) {
      case 'GOOD':
        return {
          state: 'GOOD',
          label: 'Good Quality',
          icon: '✓',
          colorHex: '#0f766e', // High-contrast teal (>= 4.5:1 against #ffffff)
          ariaText: 'Data Quality Status: Good - All validations passed',
          isDegraded: false,
        };
      case 'STALE':
        return {
          state: 'STALE',
          label: 'Stale Data',
          icon: '⏳',
          colorHex: '#b45309', // High-contrast amber (>= 4.5:1 against #ffffff)
          ariaText: 'Data Quality Status: Stale - Timestamp exceeds freshness SLA',
          isDegraded: true,
        };
      case 'PARTIAL':
        return {
          state: 'PARTIAL',
          label: 'Partial Data',
          icon: '⚠',
          colorHex: '#c2410c', // High-contrast orange/rust (>= 4.5:1 against #ffffff)
          ariaText: 'Data Quality Status: Partial - Fallback defaults or missing fields present',
          isDegraded: true,
        };
      case 'UNAVAILABLE':
      default:
        return {
          state: 'UNAVAILABLE',
          label: 'Unavailable',
          icon: '✕',
          colorHex: '#b91c1c', // High-contrast red (>= 4.5:1 against #ffffff)
          ariaText: 'Data Quality Status: Unavailable - Data quarantined or missing',
          isDegraded: true,
        };
    }
  }

  /**
   * Calculates relative luminance of an sRGB color (WCAG 2.1 definition)
   */
  public static getRelativeLuminance(hex: string): number {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

    const transform = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

    const R = transform(r);
    const G = transform(g);
    const B = transform(b);

    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  }

  /**
   * Calculates WCAG 2.1 contrast ratio between two hex colors
   */
  public static checkContrast(foregroundHex: string, backgroundHex: string = '#FFFFFF'): ContrastResult {
    const l1 = AccessibilityEngine.getRelativeLuminance(foregroundHex);
    const l2 = AccessibilityEngine.getRelativeLuminance(backgroundHex);

    const brighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    const ratio = (brighter + 0.05) / (darker + 0.05);
    const roundedRatio = Math.round(ratio * 100) / 100;

    return {
      contrastRatio: roundedRatio,
      passesNormalText: roundedRatio >= 4.5,
      passesLargeText: roundedRatio >= 3.0,
      passesGraphical: roundedRatio >= 3.0,
    };
  }

  /**
   * Creates a simulated focus trap for modal dialogs (UI08, UI14)
   */
  public static createFocusTrap(focusableElementIds: string[]) {
    let currentFocusIndex = 0;
    return {
      getFocusedId: () => focusableElementIds[currentFocusIndex],
      onTab: (shiftKey: boolean = false) => {
        if (focusableElementIds.length === 0) return;
        if (shiftKey) {
          currentFocusIndex = (currentFocusIndex - 1 + focusableElementIds.length) % focusableElementIds.length;
        } else {
          currentFocusIndex = (currentFocusIndex + 1) % focusableElementIds.length;
        }
      },
      reset: () => { currentFocusIndex = 0; },
    };
  }

  /**
   * Implements roving tabindex controller for dense data tables and tab lists
   */
  public static createRovingTabIndex(itemCount: number) {
    let activeIndex = 0;
    return {
      getActiveIndex: () => activeIndex,
      getTabIndexFor: (index: number) => (index === activeIndex ? 0 : -1),
      navigate: (key: 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown' | 'Home' | 'End') => {
        switch (key) {
          case 'ArrowRight':
          case 'ArrowDown':
            activeIndex = (activeIndex + 1) % itemCount;
            break;
          case 'ArrowLeft':
          case 'ArrowUp':
            activeIndex = (activeIndex - 1 + itemCount) % itemCount;
            break;
          case 'Home':
            activeIndex = 0;
            break;
          case 'End':
            activeIndex = itemCount - 1;
            break;
        }
        return activeIndex;
      },
    };
  }

  /**
   * Generates accessible semantic HTML table with caption and scoped headers
   */
  public static renderSemanticTable(params: {
    caption: string;
    headers: string[];
    rows: Array<{ id: string; rowHeader: string; cells: string[] }>;
  }): string {
    const headerHtml = params.headers.map((h) => `<th scope="col" class="iips-table-th">${h}</th>`).join('');
    const rowsHtml = params.rows
      .map(
        (r) =>
          `<tr id="${r.id}" class="iips-table-row">` +
          `<th scope="row" class="iips-table-rh">${r.rowHeader}</th>` +
          r.cells.map((c) => `<td class="iips-table-td">${c}</td>`).join('') +
          `</tr>`
      )
      .join('');

    return (
      `<table class="iips-data-table" aria-label="${params.caption}">` +
      `<caption>${params.caption}</caption>` +
      `<thead><tr>${headerHtml}</tr></thead>` +
      `<tbody>${rowsHtml}</tbody>` +
      `</table>`
    );
  }

  /**
   * Generates live-region payload for screen readers
   */
  public static createLiveRegionMessage(message: string, priority: 'polite' | 'assertive' = 'polite'): string {
    return `<div role="status" aria-live="${priority}" class="sr-only">${message}</div>`;
  }
}
