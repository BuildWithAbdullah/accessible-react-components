/**
 * Roving tabindex arithmetic, as a pure function.
 *
 * The ARIA Authoring Practices composite widget patterns (tabs, menu, listbox,
 * radio group) all move a single tab stop between a set of children. The
 * arithmetic is the same every time, and it is the part that is easy to get
 * wrong: off by one at the ends, wrapping when the pattern says clamp, or
 * swallowing a key the page should have handled.
 *
 * Keeping it here, with no React and no DOM in sight, means the arithmetic can
 * be tested exhaustively rather than clicked through.
 */

export type Orientation = 'horizontal' | 'vertical';

export interface RovingOptions {
  /** Which arrow keys move the tab stop. Defaults to 'horizontal'. */
  orientation?: Orientation;
  /** Whether moving past the last item returns to the first. Defaults to true. */
  wrap?: boolean;
}

/**
 * The next index for a roving tabindex, or null when this widget should not
 * handle the key at all.
 *
 * null is the important return value. A composite widget that treats every
 * keydown as its own will call preventDefault on keys the page needed, and
 * that is how a widget ends up blocking browser shortcuts or stopping a form
 * from submitting. Callers are expected to only preventDefault when the result
 * is a number.
 */
export function nextIndex(
  count: number,
  current: number,
  key: string,
  options: RovingOptions = {},
): number | null {
  if (!Number.isInteger(count) || count <= 0) return null;

  const orientation: Orientation = options.orientation ?? 'horizontal';
  const wrap = options.wrap ?? true;
  const forward = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';
  const backward = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';

  // A current index outside the set is treated as "nothing is active yet",
  // which is the state a menu is in before it opens.
  const from = current >= 0 && current < count ? current : -1;

  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;

  if (key === forward) {
    if (from === -1) return 0;
    if (from === count - 1) return wrap ? 0 : count - 1;
    return from + 1;
  }

  if (key === backward) {
    if (from === -1) return count - 1;
    if (from === 0) return wrap ? count - 1 : 0;
    return from - 1;
  }

  return null;
}

/**
 * The tabindex a child in a roving set should carry.
 *
 * Exactly one child holds 0 and the rest hold -1, so that the whole widget is
 * one tab stop. Giving every child 0 is the single most common way a tab list
 * turns into a twelve stop detour, and it looks correct in a screenshot.
 */
export function tabIndexFor(index: number, activeIndex: number): 0 | -1 {
  return index === activeIndex ? 0 : -1;
}

/**
 * Index of the first item whose label starts with the typed character, used by
 * the menu and listbox typeahead. Search starts after the active item and
 * wraps, so repeated presses of the same letter cycle through matches.
 */
export function typeaheadIndex(labels: readonly string[], activeIndex: number, char: string): number | null {
  const needle = char.toLowerCase();
  if (needle.length !== 1 || needle === ' ') return null;
  for (let step = 1; step <= labels.length; step += 1) {
    const i = (activeIndex + step + labels.length) % labels.length;
    const label = labels[i];
    if (label !== undefined && label.trim().toLowerCase().startsWith(needle)) return i;
  }
  return null;
}
