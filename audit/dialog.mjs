import { tabbables } from '../build/src/a11y/focusable.js';

const PATTERN = 'Dialog (Modal)';

/**
 * Behavioural audits for the modal dialog pattern.
 *
 * Each one carries what it proves and what it does not, because several of
 * these checks are the closest a headless DOM can get to the real thing
 * rather than the real thing itself.
 */
export default [
  {
    id: 'dialog-role-and-name',
    component: 'dialog',
    pattern: PATTERN,
    requirement:
      'The dialog has role="dialog" and aria-modal="true", and takes its accessible name from a heading it renders.',
    proves: 'Assistive technology is told a dialog opened, and told what it is for.',
    doesNotProve:
      'That aria-modal is honoured. It is a promise the author makes, and a browser that does not support it will still let a virtual cursor read the page behind.',
    async run(ctx) {
      await ctx.click(ctx.trigger());
      const dialog = ctx.maybe('[role="dialog"]');
      if (!dialog) ctx.fail('opening the widget produced no element with role="dialog"');
      if (dialog.getAttribute('aria-modal') !== 'true') {
        ctx.fail('the dialog does not carry aria-modal="true"');
      }
      const label = ctx.name(dialog);
      if (!label) ctx.fail('the dialog has no accessible name');
    },
  },
  {
    id: 'dialog-initial-focus',
    component: 'dialog',
    pattern: PATTERN,
    requirement:
      'Opening the dialog moves focus inside it, rather than leaving it on the trigger behind the overlay.',
    proves:
      'A keyboard user is put where the new content is, instead of being left behind an overlay they cannot see past.',
    doesNotProve:
      'That the chosen element is the best one. The Practices allow the dialog itself, the first control, or the primary action, and this checks only that focus landed inside.',
    async run(ctx) {
      const trigger = ctx.trigger();
      await ctx.click(trigger);
      const panel = ctx.q(ctx.fixture.panel, 'the dialog panel');
      if (!ctx.contains(panel, ctx.active())) {
        ctx.fail(
          `after opening, focus is on ${ctx.describe(ctx.active())}, which is outside the dialog panel`,
        );
      }
    },
  },
  {
    id: 'dialog-tab-is-contained',
    component: 'dialog',
    pattern: PATTERN,
    requirement:
      'Tab from the last control in the dialog, and Shift+Tab from the first, stay inside the dialog.',
    proves:
      'The dialog claims the Tab key and names a target inside itself in both directions, which is the mechanism a focus trap is made of.',
    doesNotProve:
      'That a real browser ends up on that element. jsdom does not move focus on Tab, so this checks the handler, not the browser. It also says nothing about the screen reader virtual cursor, which Tab containment does not constrain at all.',
    async run(ctx) {
      await ctx.click(ctx.trigger());
      const panel = ctx.q(ctx.fixture.panel, 'the dialog panel');
      const inside = tabbables(panel);
      if (inside.length === 0) ctx.fail('the dialog has nothing tabbable inside it');

      const last = inside[inside.length - 1];
      await ctx.focus(last);
      const forward = await ctx.press(last, 'Tab');
      if (!forward.defaultPrevented) {
        ctx.fail('Tab on the last control in the dialog was not handled, so focus leaves the dialog');
      }
      if (!ctx.contains(panel, ctx.active())) {
        ctx.fail(`Tab moved focus to ${ctx.describe(ctx.active())}, outside the dialog`);
      }

      const first = inside[0];
      await ctx.focus(first);
      const back = await ctx.press(first, 'Tab', { shift: true });
      if (!back.defaultPrevented) {
        ctx.fail('Shift+Tab on the first control in the dialog was not handled');
      }
      if (!ctx.contains(panel, ctx.active())) {
        ctx.fail(`Shift+Tab moved focus to ${ctx.describe(ctx.active())}, outside the dialog`);
      }
    },
  },
  {
    id: 'dialog-escape-closes',
    component: 'dialog',
    pattern: PATTERN,
    requirement:
      'Escape closes the dialog, from anywhere inside it, without having to find the close control.',
    proves: 'There is a way out that does not require finding the close control.',
    doesNotProve:
      'That closing is safe. A dialog holding unsaved input should confirm, and this audit would be satisfied by one that silently discards the work.',
    async run(ctx) {
      await ctx.click(ctx.trigger());
      const panel = ctx.q(ctx.fixture.panel, 'the dialog panel');
      await ctx.press(ctx.active() ?? panel, 'Escape');
      if (ctx.maybe(ctx.fixture.panel)) ctx.fail('Escape did not close the dialog');
    },
  },
  {
    id: 'dialog-returns-focus-to-the-opener',
    component: 'dialog',
    pattern: PATTERN,
    requirement: 'Closing the dialog puts focus back on the control that opened it.',
    proves: 'The user resumes where they were rather than at the top of the document.',
    doesNotProve:
      'That the opener still exists. A dialog that deletes the row it was opened from has nowhere to return to, and needs a named fallback. The probe also places focus inside the panel itself before closing, because jsdom does not blur the active element when a click lands on something unfocusable, so without that step a dialog that never moved focus in would look as though it had restored it.',
    async run(ctx) {
      const trigger = ctx.trigger();
      await ctx.click(trigger);
      const panel = ctx.q(ctx.fixture.panel, 'the dialog panel');
      const inside = tabbables(panel);
      if (inside.length === 0) ctx.fail('the dialog has nothing tabbable inside it');
      await ctx.focus(inside[0]);
      const close = ctx.q(ctx.fixture.close, 'the close control');
      await ctx.click(close);
      if (ctx.active() !== trigger) {
        ctx.fail(
          `after closing, focus is on ${ctx.describe(ctx.active())} rather than on the control that opened the dialog`,
        );
      }
    },
  },
  {
    id: 'dialog-close-control-is-a-button',
    component: 'dialog',
    pattern: PATTERN,
    requirement: 'The close control is a real button, so it is tabbable and takes Enter and Space.',
    proves:
      'The control is in the tab order and gets keyboard activation from the browser rather than from a handler somebody has to remember to write.',
    doesNotProve:
      'That Enter and Space actually fire here. jsdom does not synthesise the click a browser generates from a key press on a button, so this is checked by element type.',
    async run(ctx) {
      await ctx.click(ctx.trigger());
      const close = ctx.q(ctx.fixture.close, 'the close control');
      if (close.tagName !== 'BUTTON') {
        ctx.fail(
          `the close control is ${ctx.describe(close)}, not a button, so it is neither tabbable nor keyboard activatable`,
        );
      }
      if (!ctx.name(close)) ctx.fail('the close control has no accessible name');
    },
  },
];
