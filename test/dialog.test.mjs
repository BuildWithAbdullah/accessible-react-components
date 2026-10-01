import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mount } from './_render.mjs';
import { makeContext } from '../audit/ctx.mjs';
import { act, win } from './_render.mjs';
import { fixtureFor } from './_fixtures.mjs';
import { auditSuite } from './_component.mjs';

auditSuite('dialog');

const fixture = fixtureFor('dialog');

async function open() {
  const { host, unmount } = await mount(fixture.pass);
  const ctx = makeContext({ act, win, host, fixture });
  await ctx.click(ctx.trigger());
  return { ctx, unmount };
}

describe('dialog, beyond the audits', () => {
  it('renders nothing at all while closed', async () => {
    const { host, unmount } = await mount(fixture.pass);
    assert.equal(host.querySelector('[role="dialog"]'), null);
    await unmount();
  });

  it('takes its accessible name from the heading it renders, not from a hard coded label', async () => {
    const { ctx, unmount } = await open();
    const dialog = ctx.q('[role="dialog"]');
    const heading = ctx.target(dialog, 'aria-labelledby');
    assert.equal(heading.tagName, 'H2');
    assert.equal(heading.textContent, 'Edit profile');
    assert.equal(ctx.name(dialog), 'Edit profile');
    await unmount();
  });

  it('puts focus on the first control inside, not on the panel, when there is one', async () => {
    const { ctx, unmount } = await open();
    assert.equal(ctx.active().tagName, 'INPUT');
    await unmount();
  });

  it('is itself focusable, so a dialog with nothing inside still has somewhere to put focus', async () => {
    const { ctx, unmount } = await open();
    assert.equal(ctx.q('[role="dialog"]').getAttribute('tabindex'), '-1');
    await unmount();
  });

  it('survives being opened and closed twice, returning focus each time', async () => {
    const { host, unmount } = await mount(fixture.pass);
    const ctx = makeContext({ act, win, host, fixture });
    for (let round = 0; round < 2; round += 1) {
      const trigger = ctx.trigger();
      await ctx.click(trigger);
      await ctx.focus(ctx.q('[role="dialog"] input'));
      await ctx.press(ctx.active(), 'Escape');
      assert.equal(ctx.maybe('[role="dialog"]'), null, `round ${round}: the dialog stayed open`);
      assert.equal(ctx.active(), trigger, `round ${round}: focus was not returned`);
    }
    await unmount();
  });

  it('does not swallow keys it has no business claiming', async () => {
    const { ctx, unmount } = await open();
    const event = await ctx.press(ctx.active(), 'a');
    assert.equal(event.defaultPrevented, false);
    await unmount();
  });
});
