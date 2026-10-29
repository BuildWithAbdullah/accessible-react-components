/**
 * Live region politeness, and the one timing rule that is not a matter of
 * taste.
 */

export type Urgency = 'status' | 'alert';

export interface LiveRegionProps {
  role: 'status' | 'alert';
  'aria-live': 'polite' | 'assertive';
}

export interface LiveMessageProps {
  'aria-atomic': 'true';
}

/**
 * The role and politeness pair for a message container.
 *
 * role="status" and aria-live="polite" are stated together on purpose. The
 * roles carry an implicit politeness, but some assistive technology and
 * browser combinations have historically honoured one and not the other, and
 * stating both costs nothing.
 */
export function liveRegionProps(urgency: Urgency): LiveRegionProps {
  return urgency === 'alert'
    ? { role: 'alert', 'aria-live': 'assertive' }
    : { role: 'status', 'aria-live': 'polite' };
}

/**
 * The atomic flag, which belongs on one message and not on the region that
 * accumulates them.
 *
 * aria-atomic="true" means "when anything in here changes, present all of
 * it". On a single message that is what you want: the message is read as a
 * unit rather than word by word as it streams in. On a container that keeps
 * several messages, it means adding the second one re-reads the first, and
 * adding the third re-reads both. An earlier version of this module put it on
 * the region, which is the commonest way a toast stack becomes unbearable
 * after the second notification. See docs/04-defects.md.
 */
export function liveMessageProps(): LiveMessageProps {
  return { 'aria-atomic': 'true' };
}

/**
 * Whether an urgency value justifies interrupting whatever the screen reader
 * is currently saying.
 *
 * assertive stops the current utterance. Using it for a saved confirmation is
 * the audio equivalent of a modal dialog for a toast, and it is the reason
 * "everything is assertive" is worse than "everything is polite".
 */
export function interrupts(urgency: Urgency): boolean {
  return urgency === 'alert';
}
