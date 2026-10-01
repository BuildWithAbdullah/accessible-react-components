const PATTERN = 'Menu Button';

/**
 * A menu whose items are in the DOM but inside a hidden container is closed.
 * This repository keeps the ul mounted so that aria-controls always resolves,
 * so counting elements rather than exposed elements would report every closed
 * menu as open. An earlier version of these audits did exactly that, and
 * reported that Escape had not closed a menu it had closed.
 */
function exposed(el) {
  for (let node = el; node; node = node.parentElement) {
    if (node.hasAttribute('hidden')) return false;
    if (node.getAttribute('aria-hidden') === 'true') return false;
  }
  return true;
}

function items(ctx) {
  return ctx.qa(ctx.fixture.items).filter(exposed);
}

export default [
  {
    id: 'menu-button-roles',
    component: 'menu-button',
    pattern: PATTERN,
    requirement:
      'aria-haspopup="menu" and aria-expanded on the button, role="menu" on the popup, role="menuitem" on each entry.',
    proves: 'The button is announced as something that opens a menu, before it is pressed.',
    doesNotProve:
      'That a menu is the right pattern. A menu of links is usually a navigation list, and marking it up as a menu changes how it is announced for no benefit.',
    async run(ctx) {
      const button = ctx.q(ctx.fixture.trigger, 'the menu button');
      if (button.getAttribute('aria-haspopup') !== 'menu') {
        ctx.fail(
          `the button reports aria-haspopup=${button.getAttribute('aria-haspopup') ?? 'nothing at all'}`,
        );
      }
      if (button.getAttribute('aria-expanded') === null) {
        ctx.fail('the button has no aria-expanded');
      }
      await ctx.click(button);
      const menu = ctx.qa('[role="menu"]').filter(exposed)[0];
      if (!menu) ctx.fail('opening produced no exposed element with role="menu"');
      const entries = items(ctx);
      if (entries.length === 0) ctx.fail('the menu contains no element with role="menuitem"');
    },
  },
  {
    id: 'menu-button-down-arrow-opens-and-focuses-the-first-item',
    component: 'menu-button',
    pattern: PATTERN,
    requirement: 'Down arrow on the button opens the menu and moves focus to the first item.',
    proves: 'The menu can be entered without a mouse, with the key the pattern documents.',
    doesNotProve: 'That Up arrow lands on the last item, which the next audit covers.',
    async run(ctx) {
      const button = ctx.q(ctx.fixture.trigger, 'the menu button');
      await ctx.focus(button);
      await ctx.press(button, 'ArrowDown');
      const entries = items(ctx);
      if (entries.length === 0) ctx.fail('ArrowDown on the button opened no menu items');
      if (ctx.active() !== entries[0]) {
        ctx.fail(`ArrowDown left focus on ${ctx.describe(ctx.active())}, not on the first item`);
      }
    },
  },
  {
    id: 'menu-arrow-keys-move-focus-between-items',
    component: 'menu-button',
    pattern: PATTERN,
    requirement: 'Inside the menu, Down and Up move real focus, and Home and End jump to the ends.',
    proves:
      'The menu uses the focus model its role implies, rather than the activedescendant model a combobox uses.',
    doesNotProve: 'That a disabled item is skipped, which the Practices leave as a choice.',
    async run(ctx) {
      const button = ctx.q(ctx.fixture.trigger, 'the menu button');
      await ctx.focus(button);
      await ctx.press(button, 'ArrowDown');
      let entries = items(ctx);
      if (entries.length < 2) ctx.fail('a menu needs at least two items to test the arrow keys');

      await ctx.press(ctx.active(), 'ArrowDown');
      entries = items(ctx);
      if (ctx.active() !== entries[1]) {
        ctx.fail(`ArrowDown inside the menu left focus on ${ctx.describe(ctx.active())}`);
      }

      await ctx.press(ctx.active(), 'End');
      entries = items(ctx);
      if (ctx.active() !== entries[entries.length - 1]) {
        ctx.fail('End did not move focus to the last item');
      }

      await ctx.press(ctx.active(), 'Home');
      entries = items(ctx);
      if (ctx.active() !== entries[0]) ctx.fail('Home did not move focus to the first item');
    },
  },
  {
    id: 'menu-escape-closes-and-returns-focus',
    component: 'menu-button',
    pattern: PATTERN,
    requirement: 'Escape closes the menu and puts focus back on the button.',
    proves: 'A keyboard user can leave the menu without walking through every item.',
    doesNotProve: 'That a click outside also closes it, which needs a document listener this audit does not exercise.',
    async run(ctx) {
      const button = ctx.q(ctx.fixture.trigger, 'the menu button');
      await ctx.focus(button);
      await ctx.press(button, 'ArrowDown');
      if (items(ctx).length === 0) ctx.fail('ArrowDown on the button opened no menu');
      await ctx.press(ctx.active(), 'Escape');
      if (items(ctx).length > 0) ctx.fail('Escape did not close the menu');
      if (ctx.active() !== button) {
        ctx.fail(`after Escape, focus is on ${ctx.describe(ctx.active())} rather than the button`);
      }
    },
  },
  {
    id: 'menu-tab-closes-the-menu',
    component: 'menu-button',
    pattern: PATTERN,
    requirement: 'Tab from inside the menu closes it rather than walking the items.',
    proves: 'The menu is one stop in the tab order, which is what role="menu" promises.',
    doesNotProve: 'Where focus lands next. jsdom does not move focus on Tab.',
    async run(ctx) {
      const button = ctx.q(ctx.fixture.trigger, 'the menu button');
      await ctx.focus(button);
      await ctx.press(button, 'ArrowDown');
      if (items(ctx).length === 0) ctx.fail('ArrowDown on the button opened no menu');
      await ctx.press(ctx.active(), 'Tab');
      if (items(ctx).length > 0) ctx.fail('Tab left the menu open');
    },
  },
  {
    id: 'menu-typeahead-jumps-by-first-letter',
    component: 'menu-button',
    pattern: PATTERN,
    requirement: 'Typing a letter moves focus to the next item whose label starts with it.',
    proves: 'A long menu is reachable without pressing Down twenty times.',
    doesNotProve:
      'That multi character typeahead works. This repository implements single character only, and says so.',
    async run(ctx) {
      const button = ctx.q(ctx.fixture.trigger, 'the menu button');
      const letter = ctx.fixture.typeahead;
      if (!letter) ctx.fail('this fixture declares no typeahead letter to test');
      await ctx.focus(button);
      await ctx.press(button, 'ArrowDown');
      const entries = items(ctx);
      if (entries.length === 0) ctx.fail('ArrowDown on the button opened no menu');
      const expected = entries.findIndex((item, index) =>
        index > 0 && item.textContent.trim().toLowerCase().startsWith(letter.toLowerCase()),
      );
      if (expected === -1) ctx.fail(`no item after the first starts with "${letter}"`);
      await ctx.press(ctx.active(), letter);
      if (ctx.active() !== items(ctx)[expected]) {
        ctx.fail(
          `typing "${letter}" left focus on ${ctx.describe(ctx.active())} rather than on item ${expected}`,
        );
      }
    },
  },
];
