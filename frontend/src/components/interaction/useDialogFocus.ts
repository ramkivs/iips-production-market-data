/**
 * Program v3.0 — Phase 13-Hardening (A2): dialog focus management hook.
 *
 * Production-grade keyboard/focus behaviour for modal/drawer surfaces:
 *   - focus moves into the dialog when it opens (first focusable, else the container)
 *   - focus is trapped while open (Tab / Shift+Tab wrap within the dialog)
 *   - Escape closes (where the component's interaction model provides onClose)
 *   - focus restores to the invoking control when the dialog closes
 *
 * React is presentation-only; this is UX behaviour, not an authorization boundary.
 */
import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export function useDialogFocus<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const containerRef = useRef<T | null>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  // Keep the latest onClose without re-running the focus effect on every render.
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const container = containerRef.current;

    // Remember the invoking control so we can return focus to it on close.
    restoreRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    // Move focus into the dialog.
    const initialTarget = container?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ?? container;
    initialTarget?.focus();

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !container) return;

      const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      restoreRef.current?.focus();
    };
  }, [open]);

  return containerRef;
}
