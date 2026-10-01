/**
 * Combobox.
 *
 * ARIA Authoring Practices pattern: Combobox with list autocomplete and
 * manual selection. The input filters the list, the arrow keys walk it, and
 * nothing is committed until Enter.
 *
 * What the pattern requires:
 *  - role="combobox" on the text input, with aria-expanded reflecting whether
 *    the list is showing
 *  - aria-controls on the input pointing at the listbox
 *  - role="listbox" with role="option" children and aria-selected
 *  - DOM focus staying on the input at all times, with the visual highlight
 *    carried by aria-activedescendant
 *  - Enter to commit, Escape to close without committing
 *
 * The focus rule is the one that gets dropped. Moving DOM focus into the
 * option list breaks typing, because the keystrokes stop reaching the input.
 */
import { useId, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { nextIndex } from '../a11y/roving.js';

export interface ComboboxProps {
  label: string;
  options: readonly string[];
  /** Called when a value is committed with Enter or a click. */
  onCommit?: (value: string) => void;
}

export function Combobox({ label, options, onCommit }: ComboboxProps) {
  const base = useId();
  const inputId = `${base}-input`;
  const listId = `${base}-list`;
  const optionId = (index: number) => `${base}-option-${index}`;

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const matches = options.filter((option) =>
    option.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const commit = (index: number) => {
    const value = matches[index];
    if (value === undefined) return;
    setQuery(value);
    setOpen(false);
    setActive(-1);
    onCommit?.(value);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      // Escape closes the list and leaves what the user typed alone. Clearing
      // the field here is a common and infuriating extra.
      if (open) {
        event.preventDefault();
        setOpen(false);
        setActive(-1);
      }
      return;
    }

    if (event.key === 'Enter') {
      if (open && active >= 0) {
        event.preventDefault();
        commit(active);
      }
      return;
    }

    if (event.key === 'Tab') {
      setOpen(false);
      setActive(-1);
      return;
    }

    const moved = nextIndex(matches.length, active, event.key, {
      orientation: 'vertical',
      wrap: true,
    });
    if (moved === null) return;

    event.preventDefault();
    setOpen(true);
    setActive(moved);
  };

  return (
    <div className="arc-combobox">
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onKeyDown={onKeyDown}
      />
      {/*
        The listbox is rendered whether or not it is open, so that
        aria-controls always resolves, and hidden with the hidden attribute
        when closed so its options are not announced or reachable.
      */}
      <ul id={listId} role="listbox" aria-label={label} hidden={!open}>
        {matches.map((option, index) => (
          <li
            key={option}
            id={optionId(index)}
            role="option"
            aria-selected={index === active}
            onMouseDown={(event) => {
              // Stop the input losing focus before the selection lands.
              event.preventDefault();
              commit(index);
            }}
          >
            {option}
          </li>
        ))}
      </ul>
    </div>
  );
}
