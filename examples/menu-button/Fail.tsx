/**
 * Menu button, the version that ships.
 *
 *  - no aria-haspopup and no aria-expanded on the button
 *  - the popup is a div of links, so no menu or menuitem roles
 *  - opening the menu leaves focus on the button and the arrow keys scroll the
 *    page instead of moving between items
 *  - Escape does not close it, so a keyboard user has to tab out through every
 *    item to get past it
 */
import { useState } from 'react';

export default function Example() {
  const [open, setOpen] = useState(false);

  return (
    <div className="dropdown">
      <button type="button" className="dropdown-toggle" onClick={() => setOpen((v) => !v)}>
        Actions
      </button>
      {open ? (
        <div className="dropdown-panel">
          <a href="/duplicate">Duplicate</a>
          <a href="/export">Export</a>
          <a href="/archive">Archive</a>
        </div>
      ) : null}
    </div>
  );
}
