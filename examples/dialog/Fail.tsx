/**
 * Dialog, the version that ships.
 *
 * Nothing here is lazy. It is styled, it closes when you click the backdrop,
 * and the close control has a visible label. It is also unusable with a
 * keyboard, and every one of these defects is invisible in a screenshot:
 *
 *  - no role, so it is announced as a group of text in the middle of the page
 *  - focus is left on the trigger behind the dialog
 *  - Tab walks straight out into the page underneath
 *  - Escape does nothing
 *  - the close control is a div, so it is neither tabbable nor activatable
 */
import { useState } from 'react';

export default function Example() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button type="button" data-arc-trigger="open" onClick={() => setOpen(true)}>
        Edit profile
      </button>
      {open ? (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <h2>Edit profile</h2>
            <label htmlFor="fail-name">Name</label>
            <input id="fail-name" type="text" />
            <div className="modal-close" onClick={() => setOpen(false)}>
              Close
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
