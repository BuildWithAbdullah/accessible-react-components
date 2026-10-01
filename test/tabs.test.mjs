import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mount, act, win } from './_render.mjs';
import { makeContext } from '../audit/ctx.mjs';
import { fixtureFor } from './_fixtures.mjs';
import { auditSuite } from './_component.mjs';
import { tabbables } from '../build/src/a11y/focusable.js';

auditSuite('tabs');

const fixture = fixtureFor('tabs');

async function tabs() {
  const { host, unmount } = await mount(fixture.pass);
  const ctx = makeContext({ act, win, host, fixture });
  return { ctx, unmount, all: () => ctx.qa('[role="tab"]') };
}

describe('tabs, beyond the audits', () => {
  it('gives exactly one tab a tabindex of zero, and it is the selected one', async () => {
    const { ctx, unmount, all } = await tabs();
    const zeros = all().filter((tab) => tab.getAttribute('tabindex') === '0');
    assert.equal(zeros.length, 1);
    assert.equal(zeros[0].getAttribute('aria-selected'), 'true');
    await unmount();
  });

  it('keeps one tab stop after the selection moves', async () => {
    const { ctx, unmount, all } = await tabs();
    await ctx.focus(all()[0]);
    await ctx.press(all()[0], 'ArrowRight');
    const list = ctx.q('[role="tablist"]');
    assert.equal(tabbables(list).length, 1);
    assert.equal(tabbables(list)[0], all()[1]);
    await unmount();
  });

  it('wraps from the last tab to the first', async () => {
    const { ctx, unmount, all } = await tabs();
    await ctx.focus(all()[0]);
    await ctx.press(all()[0], 'End');
    await ctx.press(ctx.active(), 'ArrowRight');
    assert.equal(all()[0].getAttribute('aria-selected'), 'true');
    await unmount();
  });

  it('shows the panel belonging to the selected tab', async () => {
    const { ctx, unmount, all } = await tabs();
    assert.match(ctx.q('[role="tabpanel"]').textContent, /What the product does/);
    await ctx.click(all()[1]);
    assert.match(ctx.q('[role="tabpanel"]').textContent, /What the product costs/);
    await unmount();
  });

  it('renders one panel at a time, so no hidden panel is left tabbable', async () => {
    const { ctx, unmount } = await tabs();
    assert.equal(ctx.qa('[role="tabpanel"]').length, 1);
    await unmount();
  });

  it('names the tab list, so the strip is not announced as an unlabelled group', async () => {
    const { ctx, unmount } = await tabs();
    assert.equal(ctx.q('[role="tablist"]').getAttribute('aria-label'), 'Product information');
    await unmount();
  });

  it('leaves keys it does not own alone', async () => {
    const { ctx, unmount, all } = await tabs();
    await ctx.focus(all()[0]);
    for (const key of ['Tab', 'Enter', 'ArrowDown', 'b']) {
      const event = await ctx.press(all()[0], key);
      assert.equal(event.defaultPrevented, false, `${key} was swallowed by the tab list`);
    }
    await unmount();
  });
});
