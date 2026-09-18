/**
 * Program v3.0 — Phase 13-Hardening (A3): accessible tab-list keyboard behaviour.
 *
 * Roving tabindex + arrow/Home/End navigation with automatic activation, per the
 * WAI-ARIA Authoring Practices "Tabs" pattern. Selection follows focus so the
 * existing click-to-select UX is preserved for keyboard users.
 *
 * The caller wires the tabpanel relationship (aria-controls on tabs, and
 * role="tabpanel" / aria-labelledby / tabindex on the panel) via idFor/panelIdFor.
 */
import { useId, type KeyboardEvent } from 'react';

export interface TabProps {
  id: string;
  role: 'tab';
  'aria-selected': boolean;
  tabIndex: number;
  onClick: () => void;
}

export function useTabList(tabs: readonly string[], active: string, onChange: (tab: string) => void) {
  const baseId = useId();
  const activeIndex = tabs.indexOf(active);

  const idFor = (index: number): string => `${baseId}-tab-${index}`;
  const panelIdFor = (index: number): string => `${baseId}-tab-${index}-panel`;

  function onKeyDown(event: KeyboardEvent<HTMLElement>): void {
    if (tabs.length === 0) return;
    let nextIndex = -1;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = (activeIndex + 1) % tabs.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = (activeIndex - 1 + tabs.length) % tabs.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = tabs.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    onChange(tabs[nextIndex]);
    document.getElementById(idFor(nextIndex))?.focus();
  }

  function tabProps(tab: string, index: number): TabProps {
    return {
      id: idFor(index),
      role: 'tab',
      'aria-selected': tab === active,
      tabIndex: tab === active ? 0 : -1,
      onClick: () => onChange(tab),
    };
  }

  return { tabProps, onKeyDown, idFor, panelIdFor };
}
