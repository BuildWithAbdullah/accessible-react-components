/**
 * Dialog, corrected.
 *
 * The same markup requirements met by the Dialog component: role and
 * aria-modal, a name from the heading, focus moved in on open and returned to
 * the trigger on close, Tab held inside, Escape closing.
 */
import { useState } from 'react';
import { Dialog } from '../../src/components/Dialog.js';

export default function Example() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button type="button" data-arc-trigger="open" onClick={() => setOpen(true)}>
        Edit profile
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Edit profile">
        <label htmlFor="pass-name">Name</label>
        <input id="pass-name" type="text" />
      </Dialog>
    </div>
  );
}
