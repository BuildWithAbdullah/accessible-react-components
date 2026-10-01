/**
 * Tabs.
 *
 * ARIA Authoring Practices pattern: Tabs, with automatic activation.
 *
 * Automatic activation means an arrow key both moves focus and selects, so
 * the arrow keys show panels as the user walks the list. The Practices allow
 * either model and recommend this one when the panels are cheap to render.
 * Manual activation, where arrows move focus and Enter or Space selects, is
 * the right model when showing a panel costs a network request. This is a
 * design decision, not a correctness one, and docs/02-patterns.md says which
 * patterns in this repository have no single correct keyboard model.
 *
 * What the pattern requires:
 *  - role="tablist", role="tab", role="tabpanel"
 *  - aria-selected on exactly one tab
 *  - a roving tabindex, so the whole tab list is one tab stop
 *  - Left and Right arrows, Home and End
 *  - every panel named by its tab with aria-labelledby, and every tab pointing
 *    at its panel with aria-controls
 */
import { useId, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { nextIndex, tabIndexFor } from '../a11y/roving.js';

export interface TabDefinition {
  id: string;
  label: string;
  content: ReactNode;
}

export interface TabsProps {
  tabs: readonly TabDefinition[];
  /** Accessible name for the tab list itself. */
  label: string;
  defaultIndex?: number;
}

export function Tabs({ tabs, label, defaultIndex = 0 }: TabsProps) {
  const base = useId();
  const [selected, setSelected] = useState(defaultIndex);
  const listRef = useRef<HTMLDivElement | null>(null);

  const tabId = (index: number) => `${base}-tab-${index}`;
  const panelId = (index: number) => `${base}-panel-${index}`;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const next = nextIndex(tabs.length, selected, event.key, {
      orientation: 'horizontal',
      wrap: true,
    });

    // nextIndex returns null for every key this widget has no business
    // claiming, which is what keeps preventDefault off the page's own
    // shortcuts.
    if (next === null) return;

    event.preventDefault();
    setSelected(next);

    const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    buttons?.[next]?.focus();
  };

  const active = tabs[selected] ?? tabs[0];

  return (
    <div className="arc-tabs">
      <div role="tablist" aria-label={label} ref={listRef} onKeyDown={onKeyDown}>
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={tabId(index)}
            aria-selected={index === selected}
            aria-controls={panelId(index)}
            tabIndex={tabIndexFor(index, selected)}
            onClick={() => setSelected(index)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/*
        One panel is rendered at a time and it is focusable, because the
        Practices ask for the panel to be in the tab order when it holds no
        focusable content of its own. Making it always focusable is the
        simpler rule and costs one extra tab stop.
      */}
      <div
        role="tabpanel"
        id={panelId(selected)}
        aria-labelledby={tabId(selected)}
        tabIndex={0}
      >
        {active?.content}
      </div>
    </div>
  );
}
