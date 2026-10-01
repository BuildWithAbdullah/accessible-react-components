const PATTERN = 'Alert, and WCAG 4.1.3 Status Messages';

function regions(ctx) {
  return ctx.qa('[aria-live], [role="status"], [role="alert"]');
}

export default [
  {
    id: 'toast-region-exists-before-the-message',
    component: 'toast',
    pattern: PATTERN,
    requirement: 'A live region is already in the document before anything is put into it.',
    proves:
      'There is a region for the browser to watch. This is the defect that passes every static check, because the element that eventually appears does carry a live region role.',
    doesNotProve:
      'That the announcement happens. Whether a given screen reader and browser pair speaks a text change is not observable from the DOM at all, and the only way to know is to listen.',
    async run(ctx) {
      const before = regions(ctx);
      if (before.length === 0) {
        ctx.fail('there is no live region in the document before any message is produced');
      }
    },
  },
  {
    id: 'toast-message-lands-in-the-existing-region',
    component: 'toast',
    pattern: PATTERN,
    requirement:
      'The message appears as a change inside the same region element that was already there.',
    proves:
      'The message is a text change to a watched region rather than a freshly inserted region, which is the distinction the announcement depends on.',
    doesNotProve: 'That the wording of the message is any use.',
    async run(ctx) {
      const before = regions(ctx);
      if (before.length === 0) ctx.fail('there is no live region to put a message into');
      await ctx.click(ctx.trigger());
      const expected = ctx.fixture.message;
      const landed = before.find((region) => region.textContent.includes(expected));
      if (!landed) {
        const anywhere = ctx.host.textContent.includes(expected);
        ctx.fail(
          anywhere
            ? `the message "${expected}" is on the page but not inside a region that already existed`
            : `the message "${expected}" did not appear at all`,
        );
      }
    },
  },
  {
    id: 'toast-does-not-move-focus',
    component: 'toast',
    pattern: PATTERN,
    requirement: 'Producing a message leaves focus where the user had it.',
    proves:
      'The user keeps their place. A status message that grabs focus throws away the position of anyone using a keyboard or a screen reader to deliver news they did not ask for.',
    doesNotProve:
      'That an error that blocks submission should also leave focus alone. It should not: that is a different pattern, and it belongs on the field.',
    async run(ctx) {
      const trigger = ctx.trigger();
      await ctx.focus(trigger);
      await ctx.click(trigger);
      if (ctx.active() !== trigger) {
        ctx.fail(`producing a message moved focus to ${ctx.describe(ctx.active())}`);
      }
    },
  },
  {
    id: 'toast-is-polite-unless-it-is-urgent',
    component: 'toast',
    pattern: PATTERN,
    requirement:
      'An ordinary confirmation sits in a polite region, not an assertive one.',
    proves:
      'A save confirmation does not interrupt whatever the screen reader was in the middle of saying.',
    doesNotProve:
      'That the urgency is classified correctly in general. Which messages deserve to interrupt is a judgement, and only the obvious case is checked here.',
    async run(ctx) {
      await ctx.click(ctx.trigger());
      const expected = ctx.fixture.message;
      const holder = regions(ctx).find((region) => region.textContent.includes(expected));
      if (!holder) ctx.fail(`the message "${expected}" is not inside a live region`);
      const live = holder.getAttribute('aria-live');
      const role = holder.getAttribute('role');
      if (live === 'assertive' || role === 'alert') {
        ctx.fail(
          `the confirmation sits in a region with role=${role ?? 'none'} and aria-live=${live ?? 'none'}, which interrupts`,
        );
      }
    },
  },
  {
    id: 'toast-dismiss-control-has-an-accessible-name',
    component: 'toast',
    pattern: PATTERN,
    requirement: 'The dismiss control is a button with a name.',
    proves:
      'The control can be reached and identified. An icon marked aria-hidden with no label on the button computes to no name at all, and is announced as "button".',
    doesNotProve: 'That the name reads well out of context, which is a copy decision.',
    async run(ctx) {
      await ctx.click(ctx.trigger());
      const control = ctx.q(ctx.fixture.dismiss, 'the dismiss control');
      if (control.tagName !== 'BUTTON') {
        ctx.fail(`the dismiss control is ${ctx.describe(control)}, not a button`);
      }
      const name = ctx.name(control);
      if (!name) ctx.fail('the dismiss control has no accessible name');
    },
  },
  {
    id: 'toast-does-not-remove-itself-on-a-timer',
    component: 'toast',
    pattern: PATTERN,
    requirement: 'The message stays until the user dismisses it.',
    proves:
      'Someone reading at their own pace, or arriving at the region a moment later, still finds the message. A timed removal is a time limit on reading, and WCAG 2.2.1 has no exception that covers a four second toast.',
    doesNotProve:
      'That an auto dismissing toast is always a failure. It is acceptable when the same information remains available elsewhere, which this audit cannot see.',
    async run(ctx) {
      await ctx.click(ctx.trigger());
      const expected = ctx.fixture.message;
      if (!ctx.host.textContent.includes(expected)) {
        ctx.fail(`the message "${expected}" never appeared`);
      }
      await ctx.wait(ctx.fixture.timerWindowMs ?? 120);
      if (!ctx.host.textContent.includes(expected)) {
        ctx.fail(
          `the message was removed on its own within ${ctx.fixture.timerWindowMs ?? 120}ms, with no user action`,
        );
      }
    },
  },
];
