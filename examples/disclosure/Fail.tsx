/**
 * Disclosure, the version that ships.
 *
 *  - the trigger is a div, so it is not in the tab order and Enter and Space
 *    do nothing
 *  - no aria-expanded, so nothing announces whether the section is open
 *  - the collapsed region is collapsed with a height of zero and overflow
 *    hidden, the usual way to get an animation, which hides it from view and
 *    leaves the link inside it in the tab order
 */
import { useState } from 'react';

export default function Example() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div className="accordion-trigger" onClick={() => setOpen((value) => !value)}>
        Delivery options
        <span className={open ? 'chevron chevron-open' : 'chevron'} aria-hidden="true">
          v
        </span>
      </div>
      <div className="accordion-region" style={{ height: open ? 'auto' : 0, overflow: 'hidden' }}>
        <p>Standard delivery takes three working days.</p>
        <a href="/delivery">Read the delivery policy</a>
      </div>
    </div>
  );
}
