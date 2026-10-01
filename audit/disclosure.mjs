import { tabbables } from '../build/src/a11y/focusable.js';

const PATTERN = 'Disclosure';

export default [
  {
    id: 'disclosure-trigger-is-a-button',
    component: 'disclosure',
    pattern: PATTERN,
    requirement: 'The trigger is a button element.',
    proves:
      'It is in the tab order, it is announced as a button, and the browser gives it Enter and Space for free.',
    doesNotProve:
      'That a div with role="button", tabindex="0" and key handlers would fail a user. It would not, if all three are present and correct. It is three things to keep right instead of none.',
    async run(ctx) {
      const trigger = ctx.q(ctx.fixture.trigger, 'the disclosure trigger');
      if (trigger.tagName === 'BUTTON') return;
      const role = trigger.getAttribute('role');
      const tabindex = trigger.getAttribute('tabindex');
      ctx.fail(
        `the trigger is ${ctx.describe(trigger)} with role=${role ?? 'none'} and tabindex=${tabindex ?? 'none'}, so it is not a button and does not stand in for one`,
      );
    },
  },
  {
    id: 'disclosure-expanded-state-is-exposed',
    component: 'disclosure',
    pattern: PATTERN,
    requirement: 'aria-expanded on the trigger is false when collapsed and true when expanded.',
    proves: 'The open or closed state is available to anyone not looking at the chevron.',
    doesNotProve: 'That the visible state matches. A chevron pointing the wrong way is still wrong.',
    async run(ctx) {
      const trigger = ctx.q(ctx.fixture.trigger, 'the disclosure trigger');
      const before = trigger.getAttribute('aria-expanded');
      if (before !== 'false') {
        ctx.fail(`collapsed, the trigger reports aria-expanded=${before ?? 'nothing at all'}`);
      }
      await ctx.click(trigger);
      const after = ctx
        .q(ctx.fixture.trigger, 'the disclosure trigger')
        .getAttribute('aria-expanded');
      if (after !== 'true') {
        ctx.fail(`expanded, the trigger reports aria-expanded=${after ?? 'nothing at all'}`);
      }
    },
  },
  {
    id: 'disclosure-trigger-controls-the-region',
    component: 'disclosure',
    pattern: PATTERN,
    requirement: 'aria-controls on the trigger names the region it governs, and that region exists.',
    proves: 'The relationship is navigable, in the assistive technology that supports it.',
    doesNotProve:
      'That it helps. Support for aria-controls is patchy, and the attribute is close to a no-op in several screen readers. The reason to set it is that it costs nothing and it documents intent.',
    async run(ctx) {
      const trigger = ctx.q(ctx.fixture.trigger, 'the disclosure trigger');
      ctx.target(trigger, 'aria-controls');
    },
  },
  {
    id: 'disclosure-collapsed-region-is-not-tabbable',
    component: 'disclosure',
    pattern: PATTERN,
    requirement: 'While collapsed, nothing inside the region is in the tab order.',
    proves:
      'A keyboard user does not tab into content they cannot see, which is the defect every height animation introduces and no visual review catches.',
    doesNotProve:
      'That the content is hidden from a screen reader. The hidden attribute does both; a clip rectangle or a zero height does neither reliably.',
    async run(ctx) {
      const region = ctx.q(ctx.fixture.region, 'the disclosure region');
      const reachable = tabbables(region);
      if (reachable.length > 0) {
        ctx.fail(
          `while collapsed, ${reachable.length} control(s) inside the region are still tabbable, starting with ${ctx.describe(reachable[0])}`,
        );
      }
    },
  },
];
