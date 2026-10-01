/**
 * Toast region.
 *
 * ARIA Authoring Practices pattern: Alert, plus WCAG 4.1.3 Status Messages.
 *
 * The rule that decides whether a toast works is not about roles at all. It is
 * that the live region has to be in the accessibility tree before the message
 * is put into it. A container created and populated in the same commit is, to
 * several screen reader and browser pairings, a new element that happens to
 * have role="status", and it goes unannounced. That is why both regions here
 * are rendered unconditionally and sit empty when there is nothing to say.
 *
 * What the pattern requires, and what this file is therefore on the hook for:
 *  - the live region in the document before the message goes into it
 *  - role and aria-live stated together, polite by default
 *  - the message delivered as a text change to that region
 *  - focus left exactly where the user had it
 *  - a dismiss control that is a button and has a name
 *
 * The second rule is that a status message does not take focus. Moving focus
 * to a toast interrupts whatever the user was typing and throws away their
 * place on the page, to deliver news they did not ask for.
 */
import { liveRegionProps } from '../a11y/live.js';
import type { Urgency } from '../a11y/live.js';

export interface ToastMessage {
  id: string;
  text: string;
  /** 'status' is polite and the right default. 'alert' interrupts. */
  urgency?: Urgency;
}

export interface ToastRegionProps {
  messages: readonly ToastMessage[];
  onDismiss?: (id: string) => void;
  /** Accessible name for the polite region. */
  label?: string;
}

export function ToastRegion({ messages, onDismiss, label = 'Notifications' }: ToastRegionProps) {
  const polite = messages.filter((message) => (message.urgency ?? 'status') !== 'alert');
  const assertive = messages.filter((message) => message.urgency === 'alert');

  const render = (list: readonly ToastMessage[], urgency: Urgency) => {
    const props = liveRegionProps(urgency);
    return (
      <div
        className={`arc-toast-region arc-toast-region-${urgency}`}
        role={props.role}
        aria-live={props['aria-live']}
        aria-atomic={props['aria-atomic']}
        aria-label={urgency === 'alert' ? `${label}, urgent` : label}
        data-arc-toast-region={urgency}
      >
        {list.map((message) => (
          <div key={message.id} className="arc-toast">
            <span>{message.text}</span>
            {onDismiss ? (
              <button
                type="button"
                aria-label={`Dismiss notification: ${message.text}`}
                onClick={() => onDismiss(message.id)}
              >
                <span aria-hidden="true">x</span>
              </button>
            ) : null}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      {render(polite, 'status')}
      {render(assertive, 'alert')}
    </>
  );
}
