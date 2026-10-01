import { tabbables } from '../build/src/a11y/focusable.js';

const PATTERN = 'Tabs';

function selectedIndex(items) {
  return items.findIndex((item) => item.getAttribute('aria-selected') === 'true');
}

export default [
  {
    id: 'tabs-roles',
    component: 'tabs',
    pattern: PATTERN,
    requirement: 'A tablist containing tabs, and a tabpanel for the selected one.',
    proves: 'The strip is announced as a tab list rather than as a row of links or buttons.',
    doesNotProve: 'That the tabs are in a sensible order, or that the labels mean anything.',
    async run(ctx) {
      const items = ctx.qa(ctx.fixture.items);
      if (items.length === 0) ctx.fail(`no tab strip items match ${ctx.fixture.items}`);
      if (!ctx.maybe('[role="tablist"]')) ctx.fail('there is no element with role="tablist"');
      const tabs = ctx.qa('[role="tab"]');
      if (tabs.length !== items.length) {
        ctx.fail(`${items.length} strip item(s) are rendered but ${tabs.length} carry role="tab"`);
      }
      if (!ctx.maybe('[role="tabpanel"]')) ctx.fail('there is no element with role="tabpanel"');
    },
  },
  {
    id: 'tabs-are-one-tab-stop',
    component: 'tabs',
    pattern: PATTERN,
    requirement: 'The whole tab list is a single tab stop, with a roving tabindex.',
    proves:
      'Tabbing past the component costs one key press rather than one per tab, which is the difference between a nine item strip being usable and being a detour.',
    doesNotProve:
      'That the tab stop is on the right item. It should be the selected one, and this counts stops rather than checking which.',
    async run(ctx) {
      const list = ctx.maybe('[role="tablist"]') ?? ctx.q(ctx.fixture.list, 'the tab strip');
      const stops = tabbables(list);
      if (stops.length !== 1) {
        ctx.fail(`the tab strip holds ${stops.length} tab stops, and the pattern allows exactly one`);
      }
    },
  },
  {
    id: 'tabs-arrow-keys-move-selection',
    component: 'tabs',
    pattern: PATTERN,
    requirement:
      'Right and Left arrows move the selected tab, and move focus with it under automatic activation.',
    proves: 'The strip is operable with the keys the pattern tells users to reach for.',
    doesNotProve:
      'That automatic activation is the right choice here. Manual activation, where arrows move focus and Enter selects, is correct when showing a panel is expensive. See docs/02-patterns.md.',
    async run(ctx) {
      const items = ctx.qa(ctx.fixture.items);
      if (items.length < 2) ctx.fail('a tab strip needs at least two tabs to test the arrow keys');
      const start = selectedIndex(items);
      if (start === -1) {
        ctx.fail('no strip item carries aria-selected="true", so selection is not exposed at all');
      }
      await ctx.focus(items[start]);
      await ctx.press(items[start], 'ArrowRight');

      const after = ctx.qa(ctx.fixture.items);
      const moved = selectedIndex(after);
      if (moved === start) ctx.fail('ArrowRight did not move the selected tab');
      if (ctx.active() !== after[moved]) {
        ctx.fail(
          `ArrowRight selected tab ${moved} but left focus on ${ctx.describe(ctx.active())}`,
        );
      }

      await ctx.press(after[moved], 'ArrowLeft');
      const back = selectedIndex(ctx.qa(ctx.fixture.items));
      if (back !== start) ctx.fail('ArrowLeft did not move the selection back');
    },
  },
  {
    id: 'tabs-home-and-end',
    component: 'tabs',
    pattern: PATTERN,
    requirement: 'Home selects the first tab and End the last.',
    proves: 'The strip is navigable in one key press from either end.',
    doesNotProve: 'Anything about a vertical tab list, where the arrow keys change but Home and End do not.',
    async run(ctx) {
      const items = ctx.qa(ctx.fixture.items);
      if (items.length < 2) ctx.fail('a tab strip needs at least two tabs to test Home and End');
      if (selectedIndex(items) === -1) {
        ctx.fail('no strip item carries aria-selected="true", so selection is not exposed at all');
      }

      await ctx.focus(items[0]);
      await ctx.press(items[0], 'End');
      const atEnd = selectedIndex(ctx.qa(ctx.fixture.items));
      if (atEnd !== items.length - 1) ctx.fail(`End selected tab ${atEnd}, not the last one`);

      const nowSelected = ctx.qa(ctx.fixture.items)[atEnd];
      await ctx.press(nowSelected, 'Home');
      const atStart = selectedIndex(ctx.qa(ctx.fixture.items));
      if (atStart !== 0) ctx.fail(`Home selected tab ${atStart}, not the first one`);
    },
  },
  {
    id: 'tabs-panel-is-named-by-its-tab',
    component: 'tabs',
    pattern: PATTERN,
    requirement:
      'The panel points back at its tab with aria-labelledby, and the tab points at the panel with aria-controls.',
    proves:
      'A user who moves to the panel is told which tab it belongs to, instead of landing in unlabelled content.',
    doesNotProve: 'That the panel is reachable. Whether it needs its own tab stop depends on what is inside it.',
    async run(ctx) {
      const panel = ctx.q('[role="tabpanel"]', 'the tab panel');
      const owner = ctx.target(panel, 'aria-labelledby');
      if (owner.getAttribute('role') !== 'tab') {
        ctx.fail(`the panel is labelled by ${ctx.describe(owner)}, which is not a tab`);
      }
      if (owner.getAttribute('aria-selected') !== 'true') {
        ctx.fail('the panel is labelled by a tab that is not the selected one');
      }
      const controlled = ctx.target(owner, 'aria-controls');
      if (controlled !== panel) {
        ctx.fail('the selected tab aria-controls something other than the visible panel');
      }
    },
  },
];
