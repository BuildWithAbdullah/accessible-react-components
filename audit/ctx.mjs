/**
 * The handle an audit is given over a mounted example.
 *
 * Every helper that looks something up throws rather than returning null, so
 * an audit run against a page that does not have the parts it needs fails
 * instead of passing by default. test/pairs.test.mjs leans on that: it runs
 * every audit against an empty page and requires all of them to fail.
 */
import { AuditFailure, fail } from './failure.mjs';
import { accessibleName } from './name.mjs';

export function makeContext({ act, win, host, fixture }) {
  const doc = win.document;

  const q = (selector, what = selector) => {
    const el = host.querySelector(selector);
    if (!el) fail(`expected to find ${what} matching ${selector}, found nothing`);
    return el;
  };

  const maybe = (selector) => host.querySelector(selector);
  const qa = (selector) => Array.from(host.querySelectorAll(selector));

  const dispatch = async (el, event) => {
    await act(async () => {
      el.dispatchEvent(event);
    });
    return event;
  };

  return {
    win,
    doc,
    host,
    fixture,
    fail,
    AuditFailure,
    name: accessibleName,
    q,
    maybe,
    qa,

    trigger() {
      return q(fixture.trigger, 'the control that opens the widget');
    },

    active() {
      return doc.activeElement;
    },

    contains(container, el) {
      return Boolean(container && el && container.contains(el));
    },

    async focus(el) {
      await act(async () => {
        el.focus();
      });
      return el;
    },

    /** A click, preceded by the focus a real pointer press would have moved. */
    async click(el) {
      await act(async () => {
        if (typeof el.focus === 'function') el.focus();
      });
      return dispatch(
        el,
        new win.MouseEvent('click', { bubbles: true, cancelable: true, view: win }),
      );
    },

    /** A keydown, returned so the audit can ask whether anything claimed it. */
    async press(el, key, options = {}) {
      return dispatch(
        el,
        new win.KeyboardEvent('keydown', {
          key,
          bubbles: true,
          cancelable: true,
          shiftKey: Boolean(options.shift),
          ctrlKey: Boolean(options.ctrl),
        }),
      );
    },

    /** Type into a React controlled input the way the browser would. */
    async type(input, value) {
      const setter = Object.getOwnPropertyDescriptor(
        win.HTMLInputElement.prototype,
        'value',
      )?.set;
      if (!setter) fail('this DOM has no value setter on HTMLInputElement');
      await act(async () => {
        setter.call(input, value);
        input.dispatchEvent(new win.Event('input', { bubbles: true }));
      });
      return input;
    },

    async wait(ms) {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, ms));
      });
    },

    /** Resolve an IDREF attribute to the element it names. */
    target(el, attribute) {
      const id = el.getAttribute(attribute);
      if (!id) fail(`${describe(el)} has no ${attribute}`);
      const found = doc.getElementById(id.split(/\s+/)[0]);
      if (!found) fail(`${attribute} on ${describe(el)} names ${id}, which is not in the document`);
      return found;
    },

    describe,
  };
}

export function describe(el) {
  if (!el) return 'nothing';
  if (el.nodeType !== 1) return String(el.nodeName);
  const role = el.getAttribute('role');
  const cls = el.getAttribute('class');
  return [
    el.tagName.toLowerCase(),
    role ? `[role=${role}]` : '',
    cls ? `.${cls.split(/\s+/)[0]}` : '',
  ].join('');
}
