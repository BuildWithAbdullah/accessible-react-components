/**
 * Toast, the version that ships.
 *
 * This is the defect that survives review, because it passes every static
 * check: the element has role="alert", so a scanner and a code reviewer both
 * see a live region.
 *
 *  - the region is created in the same commit as its message, so there was no
 *    live region in the accessibility tree to observe a change to, and several
 *    screen reader and browser pairings announce nothing at all
 *  - role="alert" is assertive, which interrupts the current utterance to
 *    deliver a save confirmation
 *  - focus is moved to the toast, throwing away the user's place on the page
 *  - the dismiss control is a glyph with no accessible name
 *  - the message removes itself on a timer, so anyone reading at their own
 *    pace loses it
 */
import { useEffect, useRef, useState } from 'react';

export interface FailProps {
  /** Exposed so the pair test does not have to wait two seconds. */
  autoDismissMs?: number;
}

export default function Example({ autoDismissMs = 2000 }: FailProps) {
  const [message, setMessage] = useState<string | null>(null);
  const toastRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (message === null) return undefined;
    toastRef.current?.focus();
    const timer = setTimeout(() => setMessage(null), autoDismissMs);
    return () => clearTimeout(timer);
  }, [message, autoDismissMs]);

  return (
    <div>
      <button type="button" data-arc-trigger="notify" onClick={() => setMessage('Profile saved')}>
        Save
      </button>
      {message !== null ? (
        <div className="toast" role="alert" ref={toastRef} tabIndex={-1}>
          {message}
          <button type="button" className="toast-close" onClick={() => setMessage(null)}>
            <span aria-hidden="true">x</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
