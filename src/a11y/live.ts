/**
 * Live region politeness, and the one timing rule that is not a matter of
 * taste.
 */

export type Urgency = 'status' | 'alert';

export interface LiveRegionProps {
  role: 'status' | 'alert';
  'aria-live': 'polite' | 'assertive';
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
    ? { role: 'alert', 'aria-live': 'assertive', 'aria-atomic': 'true' }
    : { role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' };
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
