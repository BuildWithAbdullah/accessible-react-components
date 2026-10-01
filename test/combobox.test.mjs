import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mount, act, win } from './_render.mjs';
import { makeContext } from '../audit/ctx.mjs';
import { fixtureFor } from './_fixtures.mjs';
import { auditSuite } from './_component.mjs';

auditSuite('combobox');

const fixture = fixtureFor('combobox');

async function combobox() {
  const { host, unmount } = await mount(fixture.pass);
  const ctx = makeContext({ act, win, host, fixture });
  return { ctx, unmount, input: ctx.q(fixture.input) };
}

describe('combobox, beyond the audits', () => {
  it('filters the options as the field is typed into', async () => {
    const { ctx, unmount, input } = await combobox();
    await ctx.type(input, 'la');
    const labels = ctx.qa('[role="option"]').map((option) => option.textContent);
    assert.deepEqual(labels, ['Lahore', 'Islamabad']);
    await unmount();
  });

  it('reports the list as closed before anything is typed', async () => {
    const { ctx, unmount, input } = await combobox();
    assert.equal(input.getAttribute('aria-expanded'), 'false');
    assert.equal(ctx.q('[role="listbox"]').hasAttribute('hidden'), true);
    await unmount();
  });

  it('opens on the first arrow key even with an empty field', async () => {
    const { ctx, unmount, input } = await combobox();
    await ctx.press(input, 'ArrowDown');
    assert.equal(input.getAttribute('aria-expanded'), 'true');
    assert.equal(ctx.target(input, 'aria-activedescendant').textContent, 'Lahore');
    await unmount();
  });

  it('enters the list from the bottom on Up arrow', async () => {
    const { ctx, unmount, input } = await combobox();
    await ctx.press(input, 'ArrowUp');
    assert.equal(ctx.target(input, 'aria-activedescendant').textContent, 'Multan');
    await unmount();
  });

  it('marks exactly one option as selected', async () => {
    const { ctx, unmount, input } = await combobox();
    await ctx.press(input, 'ArrowDown');
    await ctx.press(input, 'ArrowDown');
    const selected = ctx.qa('[role="option"][aria-selected="true"]');
    assert.equal(selected.length, 1);
    assert.equal(selected[0].textContent, 'Karachi');
    await unmount();
  });

  it('commits on a pointer press without letting the field lose focus first', async () => {
    const { ctx, unmount, input } = await combobox();
    await ctx.focus(input);
    await ctx.type(input, 'kar');
    const option = ctx.q('[role="option"]');
    const event = new win.MouseEvent('mousedown', { bubbles: true, cancelable: true, view: win });
    await act(async () => {
      option.dispatchEvent(event);
    });
    assert.equal(event.defaultPrevented, true, 'mousedown was not prevented, so the field blurs');
    assert.equal(ctx.q(fixture.input).value, 'Karachi');
    await unmount();
  });

  it('closes the list on Tab without stealing the key', async () => {
    const { ctx, unmount, input } = await combobox();
    await ctx.press(input, 'ArrowDown');
    const event = await ctx.press(input, 'Tab');
    assert.equal(event.defaultPrevented, false, 'Tab was swallowed');
    assert.equal(ctx.q(fixture.input).getAttribute('aria-expanded'), 'false');
    await unmount();
  });

  it('does not claim Escape when the list is already closed', async () => {
    const { ctx, unmount, input } = await combobox();
    const event = await ctx.press(input, 'Escape');
    assert.equal(event.defaultPrevented, false);
    await unmount();
  });

  it('names the listbox as well as the input', async () => {
    const { ctx, unmount } = await combobox();
    assert.equal(ctx.q('[role="listbox"]').getAttribute('aria-label'), 'City');
    await unmount();
  });
});
