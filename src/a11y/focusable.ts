/**
 * Which elements inside a container are in the tab order, and what the next
 * one is in either direction.
 *
 * This is the engine behind focus containment in the modal dialog. It is kept
 * separate from the component for two reasons: it is the part with edge cases
 * worth testing one by one, and a focus trap that is wrong is worse than no
 * dialog at all, because the keyboard user cannot leave.
 */

/**
 * Elements that are in the tab order by default, plus anything that has opted
 * in with a tabindex. Negative tabindex values are filtered out below rather
 * than here, because `[tabindex]` has to match them first in order to reject
 * them.
 */
export const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button',
  'input',
  'select',
  'textarea',
  'summary',
  'iframe',
  'object',
  'embed',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]',
  '[tabindex]',
].join(',');

function attr(el: Element, name: string): string | null {
  return el.getAttribute(name);
}

function hiddenByStyle(el: Element): boolean {
  const view = el.ownerDocument?.defaultView;
  if (!view || typeof view.getComputedStyle !== 'function') return false;
  const style = view.getComputedStyle(el);
  return style.display === 'none' || style.visibility === 'hidden';
}

/**
 * True when the element or one of its ancestors takes it out of the tab order.
 *
 * `inert` is included because it is the correct way to neutralise the page
 * behind a dialog, but note that it is checked as an attribute here. A
 * container that sets `inert` gets no special treatment from this module
 * beyond that: the browser enforces inert, this code only agrees with it.
 */
export function isTabbable(el: Element): boolean {
  if (!(el instanceof (el.ownerDocument?.defaultView?.HTMLElement ?? Object))) {
    // Non HTML elements (SVG and friends) are out of scope for this module.
    return false;
  }
  const html = el as HTMLElement;

  if (html.hasAttribute('disabled')) return false;
  if (html.hasAttribute('hidden')) return false;
  if (attr(html, 'aria-hidden') === 'true') return false;
  if (html.tagName === 'INPUT' && attr(html, 'type') === 'hidden') return false;

  const tabindex = attr(html, 'tabindex');
  if (tabindex !== null) {
    const parsed = Number.parseInt(tabindex, 10);
    if (Number.isNaN(parsed) || parsed < 0) return false;
  }

  if (attr(html, 'contenteditable') === 'false') return false;

  for (let node: Element | null = html; node; node = node.parentElement) {
    if (node.hasAttribute('hidden')) return false;
    if (node.hasAttribute('inert')) return false;
    if (attr(node, 'aria-hidden') === 'true') return false;
    if (hiddenByStyle(node)) return false;
  }

  return true;
}

/** Tabbable descendants of a container, in document order. */
export function tabbables(container: Element): HTMLElement[] {
  const candidates = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));
  return candidates.filter(isTabbable) as HTMLElement[];
}

/**
 * The element that should receive focus when Tab or Shift+Tab is pressed
 * inside a contained region, or null when the region has nothing to focus.
 *
 * Returning the element rather than moving focus keeps this testable without
 * a real browser, since jsdom does not move focus on Tab by itself.
 */
export function nextFocusTarget(
  container: Element,
  active: Element | null,
  backwards: boolean,
): HTMLElement | null {
  const list = tabbables(container);
  if (list.length === 0) return null;

  const first = list[0] as HTMLElement;
  const last = list[list.length - 1] as HTMLElement;
  const index = active ? list.indexOf(active as HTMLElement) : -1;

  if (index === -1) return backwards ? last : first;
  if (backwards) return index === 0 ? last : (list[index - 1] as HTMLElement);
  return index === list.length - 1 ? first : (list[index + 1] as HTMLElement);
}
