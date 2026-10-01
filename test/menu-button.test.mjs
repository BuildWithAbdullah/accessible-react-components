import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mount, act, win, createElement } from './_render.mjs';
import { makeContext } from '../audit/ctx.mjs';
import { fixtureFor } from './_fixtures.mjs';
import { auditSuite } from './_component.mjs';
import { MenuButton } from '../build/src/components/MenuButton.js';

auditSuite('menu-button');

const fixture = fixtureFor('menu-button');

async function menu(items) {
  const chosen = [];
  const list = items ?? [
    { label: 'Duplicate', onSelect: () => chosen.push('Duplicate') },
    { label: 'Export', onSelect: () => chosen.push('Export') },
    { label: 'Archive', onSelect: () => chosen.push('Archive'), disabled: true },
  ];
  function Host() {
    return createElement(MenuButton, { label: 'Actions', items: list });
  }
  const { host, unmount } = await mount(Host);
  const ctx = makeContext({ act, win, host, fixture });
  return { ctx, unmount, chosen, button: ctx.q(fixture.trigger) };
}

describe('menu button, beyond the audits', () => {
  it('keeps the menu element mounted while closed, so aria-controls resolves', async () => {
    const { ctx, unmount, button } = await menu();
    const el = ctx.target(button, 'aria-controls');
    assert.equal(el.getAttribute('role'), 'menu');
    assert.equal(el.hasAttribute('hidden'), true);
    await unmount();
  });

  it('opens on Up arrow with the last item focused', async () => {
    const { ctx, unmount, button } = await menu();
    await ctx.focus(button);
    await ctx.press(button, 'ArrowUp');
    const items = ctx.qa('[role="menuitem"]');
    assert.equal(ctx.active(), items[items.length - 1]);
    await unmount();
  });

  it('selects on Enter, closes, and hands focus back', async () => {
    const { ctx, unmount, chosen, button } = await menu();
    await ctx.focus(button);
    await ctx.press(button, 'ArrowDown');
    await ctx.press(ctx.active(), 'ArrowDown');
    await ctx.press(ctx.active(), 'Enter');
    assert.deepEqual(chosen, ['Export']);
    assert.equal(ctx.active(), ctx.q(fixture.trigger));
    assert.equal(ctx.target(ctx.q(fixture.trigger), 'aria-controls').hasAttribute('hidden'), true);
    await unmount();
  });

  it('selects on Space, which a menu item has to handle itself', async () => {
    const { ctx, unmount, chosen, button } = await menu();
    await ctx.focus(button);
    await ctx.press(button, 'ArrowDown');
    await ctx.press(ctx.active(), ' ');
    assert.deepEqual(chosen, ['Duplicate']);
    await unmount();
  });

  it('exposes a disabled item with aria-disabled and does not run it', async () => {
    const { ctx, unmount, chosen, button } = await menu();
    await ctx.focus(button);
    await ctx.press(button, 'ArrowDown');
    await ctx.press(ctx.active(), 'End');
    const last = ctx.active();
    assert.equal(last.getAttribute('aria-disabled'), 'true');
    await ctx.press(last, 'Enter');
    assert.deepEqual(chosen, []);
    await unmount();
  });

  it('keeps a disabled item in the tab order rather than removing it, so it can still be read', async () => {
    // aria-disabled rather than the disabled attribute is deliberate. A
    // disabled attribute takes the item out of the tab order, and an action a
    // user cannot find is harder to explain than one they can read and cannot
    // use.
    const { ctx, unmount, button } = await menu();
    await ctx.focus(button);
    await ctx.press(button, 'ArrowDown');
    const items = ctx.qa('[role="menuitem"]');
    assert.equal(items[2].hasAttribute('disabled'), false);
    await unmount();
  });

  it('gives each item role none on its list item, so the list wrapper is not announced', async () => {
    const { ctx, unmount, button } = await menu();
    await ctx.click(button);
    for (const li of ctx.qa('[role="menu"] > li')) {
      assert.equal(li.getAttribute('role'), 'none');
    }
    await unmount();
  });

  it('closes on a second press of the button without moving focus away', async () => {
    const { ctx, unmount, button } = await menu();
    await ctx.click(button);
    assert.equal(button.getAttribute('aria-expanded'), 'true');
    await ctx.click(ctx.q(fixture.trigger));
    assert.equal(ctx.q(fixture.trigger).getAttribute('aria-expanded'), 'false');
    await unmount();
  });

  it('survives a menu of one item', async () => {
    const { ctx, unmount, button } = await menu([{ label: 'Only' }]);
    await ctx.focus(button);
    await ctx.press(button, 'ArrowDown');
    const items = ctx.qa('[role="menuitem"]');
    assert.equal(items.length, 1);
    assert.equal(ctx.active(), items[0]);
    await ctx.press(items[0], 'ArrowDown');
    assert.equal(ctx.active(), items[0]);
    await unmount();
  });
});
