/**
 * Disclosure.
 *
 * ARIA Authoring Practices pattern: Disclosure.
 *
 * The smallest pattern in this repository and the one most often got wrong,
 * because a div with an onClick handler and a rotating chevron looks finished.
 *
 * What the pattern requires:
 *  - the trigger is a button, so that Enter and Space activate it and it is in
 *    the tab order without anyone having to remember tabindex
 *  - aria-expanded on the trigger, reflecting state
 *  - aria-controls pointing at the region the trigger governs
 *  - the collapsed region out of the tab order, not merely invisible
 */
import { useId, useState } from 'react';
import type { ReactNode } from 'react';

export interface DisclosureProps {
  label: string;
  children?: ReactNode;
  defaultOpen?: boolean;
}

export function Disclosure({ label, children, defaultOpen = false }: DisclosureProps) {
  const regionId = useId();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="arc-disclosure">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={regionId}
        onClick={() => setOpen((value) => !value)}
      >
        {label}
      </button>
      {/*
        The region stays mounted and is hidden with the hidden attribute. Two
        reasons. aria-controls has to point at an element that exists, and the
        hidden attribute takes the content out of the tab order, which
        visibility and height animations do not. A collapsed panel whose links
        are still tabbable is a keyboard user tabbing into nothing visible.
      */}
      <div id={regionId} hidden={!open} className="arc-disclosure-region">
        {children}
      </div>
    </div>
  );
}
