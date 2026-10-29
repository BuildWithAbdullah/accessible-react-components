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
        ctx.fail(
          'TST-NO-REGION-BEFORE-MESSAGE',
          'there is no live region in the document before any message is produced',
        );
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
      if (before.length === 0) {
        ctx.fail('TST-NO-REGION-BEFORE-MESSAGE', 'there is no live region to put a message into');
      }
      await ctx.click(ctx.trigger());
      const expected = ctx.fixture.message;
      const landed = before.find((region) => region.textContent.includes(expected));
      if (!landed) {
        const anywhere = ctx.host.textContent.includes(expected);
        ctx.fail(
          anywhere ? 'TST-MESSAGE-IN-A-NEW-REGION' : 'TST-MESSAGE-NEVER-APPEARED',
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
        ctx.fail(
          'TST-STEALS-FOCUS',
          `producing a message moved focus to ${ctx.describe(ctx.active())}`,
        );
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
      if (!holder) {
        ctx.fail(
          'TST-MESSAGE-NOT-IN-A-LIVE-REGION',
          `the message "${expected}" is not inside a live region`,
        );
      }
      const live = holder.getAttribute('aria-live');
      const role = holder.getAttribute('role');
      if (live === 'assertive' || role === 'alert') {
        ctx.fail(
          'TST-CONFIRMATION-IS-ASSERTIVE',
          `the confirmation sits in a region with role=${role ?? 'none'} and aria-live=${live ?? 'none'}, which interrupts`,
        );
      }
    },
  },
  {
    id: 'toast-region-does-not-re-read-itself',
    component: 'toast',
    pattern: PATTERN,
    requirement:
      'The region that collects messages does not carry aria-atomic="true". Each message is its own atomic unit.',
    proves:
      'Adding a second message announces the second message, rather than re-reading everything in the region. The region is identified as accumulating by the message sitting inside an element within it rather than being the region\'s own text.',
    doesNotProve:
      'That the announcement is well composed. It also cannot see a region that happens to hold one message today and will hold several tomorrow, because the shape of the DOM is all there is to go on.',
    async run(ctx) {
      await ctx.click(ctx.trigger());
      const expected = ctx.fixture.message;
      const holder = regions(ctx).find((region) => region.textContent.includes(expected));
      if (!holder) {
        ctx.fail(
          'TST-MESSAGE-NOT-IN-A-LIVE-REGION',
          `the message "${expected}" is not inside a live region`,
        );
      }
      if (holder.getAttribute('aria-atomic') !== 'true') return;

      // The region is atomic. That is only correct when the region is the
      // message, so find the innermost element inside it that still holds the
      // text and fail if it is something other than the region itself.
      let innermost = holder;
      for (;;) {
        const next = Array.from(innermost.children).find((child) =>
          child.textContent.includes(expected),
        );
        if (!next) break;
        innermost = next;
      }
      if (innermost !== holder) {
        ctx.fail(
          'TST-ATOMIC-ON-AN-ACCUMULATING-REGION',
          `the region carries aria-atomic="true" and the message sits inside ${ctx.describe(innermost)} within it, so every later message re-reads this one`,
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
        ctx.fail(
          'TST-DISMISS-NOT-A-BUTTON',
          `the dismiss control is ${ctx.describe(control)}, not a button`,
        );
      }
      const name = ctx.name(control);
      if (!name) ctx.fail('NAME-ABSENT', 'the dismiss control has no accessible name');
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
      'That there is no timer. It waits for the window the pair declares in timerWindowMs and no longer, so a toast whose timer is longer than that window passes this audit. A suite cannot sit for four seconds per example, and the pair therefore declares both a short window and a component configured to match it. LIMIT-TIMER-WINDOW states this and test/limits.test.mjs asserts it in both directions. It also does not prove that an auto dismissing toast is always a failure: it is acceptable when the same information stays available elsewhere, which this audit cannot see.',
    async run(ctx) {
      await ctx.click(ctx.trigger());
      const expected = ctx.fixture.message;
      if (!ctx.host.textContent.includes(expected)) {
        ctx.fail('TST-MESSAGE-NEVER-APPEARED', `the message "${expected}" never appeared`);
      }
      await ctx.wait(ctx.fixture.timerWindowMs ?? 120);
      if (!ctx.host.textContent.includes(expected)) {
        ctx.fail(
          'TST-REMOVED-ON-A-TIMER',
          `the message was removed on its own within ${ctx.fixture.timerWindowMs ?? 120}ms, with no user action`,
        );
      }
    },
  },
];
