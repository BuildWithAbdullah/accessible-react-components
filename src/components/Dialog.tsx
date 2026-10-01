/**
 * Modal dialog.
 *
 * ARIA Authoring Practices pattern: Dialog (Modal).
 *
 * What the pattern requires, and what this file is therefore on the hook for:
 *  - role="dialog" with aria-modal="true"
 *  - an accessible name, here from the heading the dialog renders
 *  - focus moved into the dialog when it opens
 *  - Tab and Shift+Tab kept inside the dialog while it is open
 *  - Escape closes it
 *  - focus returned to the element that opened it
 *
 * Read docs/01-limits.md before reaching for this instead of the native
 * `dialog` element, which gets focus containment and inertness from the
 * browser rather than from a keydown handler.
 */
import { useCallback, useEffect, useId, useRef } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { nextFocusTarget, tabbables } from '../a11y/focusable.js';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  /** Rendered as the dialog heading and used as its accessible name. */
  title: string;
  children?: ReactNode;
}

export function Dialog({ open, onClose, title, children }: DialogProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const returnTo = useRef<HTMLElement | null>(null);

  // Remember the opener before the first render that shows the dialog, and
  // put focus back there when it closes. Storing it in a ref rather than in
  // state keeps the restore out of the render path, which matters because the
  // element may well have unmounted by then.
  useEffect(() => {
    if (!open) return undefined;

    const doc = dialogRef.current?.ownerDocument;
    const previous = doc?.activeElement;
    if (previous instanceof (doc?.defaultView?.HTMLElement ?? Object)) {
      returnTo.current = previous as HTMLElement;
    }

    const panel = dialogRef.current;
    if (panel) {
      const first = tabbables(panel)[0];
      (first ?? panel).focus();
    }

    return () => {
      const target = returnTo.current;
      returnTo.current = null;
      if (target && target.isConnected) target.focus();
    };
  }, [open]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const panel = dialogRef.current;
      if (!panel) return;

      const target = nextFocusTarget(
        panel,
        panel.ownerDocument.activeElement,
        event.shiftKey,
      );

      // With nothing tabbable inside, leaving Tab alone would hand focus to
      // the page behind the dialog. Hold it on the panel instead.
      event.preventDefault();
      (target ?? panel).focus();
    },
    [onClose],
  );

  if (!open) return null;

  return (
    <div className="arc-dialog-backdrop" data-arc-dialog-backdrop="">
      <div
        className="arc-dialog"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
      >
        <h2 id={titleId}>{title}</h2>
        {children}
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
