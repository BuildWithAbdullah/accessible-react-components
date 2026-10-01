/**
 * Menu button.
 *
 * ARIA Authoring Practices pattern: Menu Button, with an actions menu.
 *
 * This pattern and the combobox look alike and behave in opposite ways, which
 * is why they sit next to each other here. A combobox keeps DOM focus on the
 * input and points at the active option with aria-activedescendant. A menu
 * moves real DOM focus onto the menu item. Mixing the two models up produces a
 * widget that announces one thing and behaves as another.
 *
 * What the pattern requires:
 *  - aria-haspopup="menu" and aria-expanded on the button
 *  - role="menu" with role="menuitem" children
 *  - Down arrow opens the menu and focuses the first item, Up arrow the last
 *  - arrows move focus between items, Home and End jump, letters jump by label
 *  - Escape closes the menu and returns focus to the button
 *  - Tab closes the menu rather than tabbing through it
 */
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { nextIndex, tabIndexFor, typeaheadIndex } from '../a11y/roving.js';

export interface MenuItemDefinition {
  label: string;
  onSelect?: () => void;
  disabled?: boolean;
}

export interface MenuButtonProps {
  label: string;
  items: readonly MenuItemDefinition[];
}

export function MenuButton({ label, items }: MenuButtonProps) {
  const base = useId();
  const menuId = `${base}-menu`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLUListElement | null>(null);

  const labels = items.map((item) => item.label);

  const focusItem = useCallback((index: number) => {
    const nodes = menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]');
    nodes?.[index]?.focus();
  }, []);

  // Focus follows the active index once the menu has rendered. Doing it in an
  // effect rather than inside the key handler means the item exists by the
  // time focus is asked for, on the first open as well as later moves.
  useEffect(() => {
    if (open && active >= 0) focusItem(active);
  }, [open, active, focusItem]);

  const close = (returnFocus: boolean) => {
    setOpen(false);
    setActive(-1);
    if (returnFocus) buttonRef.current?.focus();
  };

  const onButtonKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActive(0);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      setActive(items.length - 1);
    }
  };

  const onMenuKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close(true);
      return;
    }

    if (event.key === 'Tab') {
      // Tab leaves the menu. Letting it walk the items would mean the menu is
      // both a menu and a list of tab stops, which no pattern asks for.
      close(false);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const item = items[active];
      if (item && !item.disabled) item.onSelect?.();
      close(true);
      return;
    }

    const moved = nextIndex(items.length, active, event.key, {
      orientation: 'vertical',
      wrap: true,
    });
    if (moved !== null) {
      event.preventDefault();
      setActive(moved);
      return;
    }

    if (event.key.length === 1) {
      const jump = typeaheadIndex(labels, active, event.key);
      if (jump !== null) {
        event.preventDefault();
        setActive(jump);
      }
    }
  };

  return (
    <div className="arc-menu-button">
      <button
        type="button"
        ref={buttonRef}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => (open ? close(false) : (setOpen(true), setActive(0)))}
        onKeyDown={onButtonKeyDown}
      >
        {label}
      </button>
      <ul
        id={menuId}
        role="menu"
        aria-label={label}
        ref={menuRef}
        hidden={!open}
        onKeyDown={onMenuKeyDown}
      >
        {items.map((item, index) => (
          <li key={item.label} role="none">
            <button
              type="button"
              role="menuitem"
              tabIndex={tabIndexFor(index, active)}
              aria-disabled={item.disabled ? true : undefined}
              onClick={() => {
                if (item.disabled) return;
                item.onSelect?.();
                close(true);
              }}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
