/**
 * A DOM for the behavioural tests.
 *
 * jsdom is a real dependency and the other repositories on this profile avoid
 * one deliberately. docs/01-limits.md says why this one takes it on: React
 * components cannot be exercised by reading their source, and a keyboard
 * contract that is described rather than run is not a contract.
 */
import { JSDOM } from 'jsdom';

const COPIED = [
  'window', 'document', 'navigator', 'location',
  'HTMLElement', 'HTMLInputElement', 'HTMLButtonElement', 'Element', 'Node',
  'Event', 'CustomEvent', 'KeyboardEvent', 'MouseEvent', 'InputEvent',
  'DocumentFragment', 'MutationObserver', 'NodeFilter',
];
// Bound rather than copied, because these are methods on the window object.
// queueMicrotask is deliberately not in this list: jsdom's implementation
// delegates to the global of the same name, so copying it onto globalThis
// makes it call itself, and the stack overflow surfaces inside React's
// scheduler where it looks like a React problem.
const BOUND = ['getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame'];

export function installDom() {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    pretendToBeVisual: true,
    url: 'https://example.test/',
  });

  for (const key of COPIED) {
    const value = dom.window[key];
    if (value === undefined) continue;
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  }
  for (const key of BOUND) {
    const value = dom.window[key];
    if (typeof value !== 'function') continue;
    Object.defineProperty(globalThis, key, {
      value: value.bind(dom.window),
      configurable: true,
      writable: true,
    });
  }

  // React refuses to run act() without this, and rightly so: act outside a
  // test environment hides real scheduling behaviour.
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  return dom;
}
