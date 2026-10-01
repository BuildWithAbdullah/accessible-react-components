const PATTERN = 'Combobox with list autocomplete, manual selection';

export default [
  {
    id: 'combobox-roles',
    component: 'combobox',
    pattern: PATTERN,
    requirement:
      'role="combobox" on the input, a listbox it controls, and option roles on the rows.',
    proves: 'The widget is announced as a combobox with a certain number of options.',
    doesNotProve: 'That the options are in a useful order, or that filtering is any good.',
    async run(ctx) {
      const input = ctx.q(ctx.fixture.input, 'the combobox input');
      if (input.getAttribute('role') !== 'combobox') {
        ctx.fail(`the input carries role=${input.getAttribute('role') ?? 'nothing'}`);
      }
      if (!ctx.name(input)) ctx.fail('the combobox input has no accessible name');
      await ctx.type(input, 'a');
      const list = ctx.maybe('[role="listbox"]');
      if (!list) ctx.fail('typing produced no element with role="listbox"');
      const options = ctx.qa('[role="option"]');
      if (options.length === 0) ctx.fail('the listbox contains no element with role="option"');
    },
  },
  {
    id: 'combobox-expanded-state-is-exposed',
    component: 'combobox',
    pattern: PATTERN,
    requirement: 'aria-expanded on the input tracks whether the list is showing.',
    proves: 'A user is told a list of suggestions appeared, and told when it went away.',
    doesNotProve: 'That the list is positioned anywhere sensible on screen.',
    async run(ctx) {
      const input = ctx.q(ctx.fixture.input, 'the combobox input');
      if (input.getAttribute('aria-expanded') !== 'false') {
        ctx.fail(
          `before typing, the input reports aria-expanded=${input.getAttribute('aria-expanded') ?? 'nothing at all'}`,
        );
      }
      await ctx.type(input, 'a');
      if (input.getAttribute('aria-expanded') !== 'true') {
        ctx.fail(
          `with the list showing, the input reports aria-expanded=${input.getAttribute('aria-expanded') ?? 'nothing at all'}`,
        );
      }
    },
  },
  {
    id: 'combobox-arrow-keys-move-the-active-option',
    component: 'combobox',
    pattern: PATTERN,
    requirement:
      'Down and Up move aria-activedescendant between options, and it names a real option.',
    proves:
      'The list is operable from the keyboard and the highlighted row is exposed, rather than being a background colour.',
    doesNotProve:
      'That the highlight is visible. aria-activedescendant moves the virtual cursor and paints nothing.',
    async run(ctx) {
      const input = ctx.q(ctx.fixture.input, 'the combobox input');
      await ctx.type(input, 'a');
      await ctx.press(input, 'ArrowDown');
      const first = input.getAttribute('aria-activedescendant');
      if (!first) ctx.fail('ArrowDown set no aria-activedescendant on the input');
      const firstOption = ctx.target(input, 'aria-activedescendant');
      if (firstOption.getAttribute('role') !== 'option') {
        ctx.fail(`aria-activedescendant names ${ctx.describe(firstOption)}, which is not an option`);
      }
      if (firstOption.getAttribute('aria-selected') !== 'true') {
        ctx.fail('the active option does not carry aria-selected="true"');
      }
      await ctx.press(input, 'ArrowDown');
      const second = input.getAttribute('aria-activedescendant');
      if (second === first) ctx.fail('a second ArrowDown did not move the active option');
    },
  },
  {
    id: 'combobox-focus-stays-in-the-input',
    component: 'combobox',
    pattern: PATTERN,
    requirement: 'Walking the list leaves DOM focus on the text field.',
    proves:
      'Typing keeps working while the list is open, which is the whole reason the pattern uses aria-activedescendant instead of moving focus.',
    doesNotProve: 'Anything about the other combobox models, where focus does move into the list.',
    async run(ctx) {
      const input = ctx.q(ctx.fixture.input, 'the combobox input');
      await ctx.focus(input);
      await ctx.type(input, 'a');
      await ctx.press(input, 'ArrowDown');
      if (!input.getAttribute('aria-activedescendant')) {
        ctx.fail('ArrowDown did not open and walk the list, so there is nothing to conclude about focus');
      }
      await ctx.press(input, 'ArrowDown');
      if (ctx.active() !== input) {
        ctx.fail(`walking the list moved focus to ${ctx.describe(ctx.active())}`);
      }
    },
  },
  {
    id: 'combobox-enter-commits-the-active-option',
    component: 'combobox',
    pattern: PATTERN,
    requirement: 'Enter puts the active option into the field and closes the list.',
    proves: 'There is a keyboard route to selection, not just a click target.',
    doesNotProve: 'That the committed value is submitted anywhere.',
    async run(ctx) {
      const input = ctx.q(ctx.fixture.input, 'the combobox input');
      await ctx.type(input, 'a');
      await ctx.press(input, 'ArrowDown');
      const active = ctx.maybe('[role="option"][aria-selected="true"]');
      if (!active) ctx.fail('ArrowDown highlighted no option, so Enter has nothing to commit');
      const expected = active.textContent.trim();
      await ctx.press(input, 'Enter');
      if (input.value !== expected) {
        ctx.fail(`Enter left the field as "${input.value}" when the active option was "${expected}"`);
      }
      if (input.getAttribute('aria-expanded') === 'true') {
        ctx.fail('the list is still reported as open after committing');
      }
    },
  },
  {
    id: 'combobox-escape-closes-and-keeps-what-was-typed',
    component: 'combobox',
    pattern: PATTERN,
    requirement: 'Escape closes the list and leaves the typed text alone.',
    proves:
      'A user can dismiss the suggestions without losing their input, which the pattern asks for and which clearing the field quietly breaks.',
    doesNotProve: 'That a second Escape does anything sensible, which is form specific.',
    async run(ctx) {
      const input = ctx.q(ctx.fixture.input, 'the combobox input');
      await ctx.type(input, 'a');
      await ctx.press(input, 'ArrowDown');
      await ctx.press(input, 'Escape');
      if (input.value !== 'a') ctx.fail(`Escape changed the field to "${input.value}"`);
      if (input.getAttribute('aria-expanded') !== 'false') {
        ctx.fail('Escape did not close the list');
      }
      if (ctx.qa('[role="option"]').some((option) => isRendered(ctx, option))) {
        ctx.fail('the options are still present and exposed after Escape');
      }
    },
  },
];

function isRendered(ctx, el) {
  for (let node = el; node; node = node.parentElement) {
    if (node.hasAttribute('hidden')) return false;
    if (node.getAttribute('aria-hidden') === 'true') return false;
  }
  return true;
}
