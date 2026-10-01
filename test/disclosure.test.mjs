import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mount, act, win } from './_render.mjs';
import { makeContext } from '../audit/ctx.mjs';
import { fixtureFor } from './_fixtures.mjs';
import { auditSuite } from './_component.mjs';
import { tabbables } from '../build/src/a11y/focusable.js';

auditSuite('disclosure');

const fixture = fixtureFor('disclosure');

describe('disclosure, beyond the audits', () => {
  it('keeps the region mounted while collapsed, so aria-controls resolves', async () => {
    const { host, unmount } = await mount(fixture.pass);
    const ctx = makeContext({ act, win, host, fixture });
    const trigger = ctx.q(fixture.trigger);
    const region = ctx.target(trigger, 'aria-controls');
    assert.ok(region.hasAttribute('hidden'));
    await unmount();
  });

  it('toggles the hidden attribute rather than unmounting', async () => {
    const { host, unmount } = await mount(fixture.pass);
    const ctx = makeContext({ act, win, host, fixture });
    const trigger = ctx.q(fixture.trigger);
    await ctx.click(trigger);
    assert.equal(ctx.q(fixture.region).hasAttribute('hidden'), false);
    await ctx.click(ctx.q(fixture.trigger));
    assert.equal(ctx.q(fixture.region).hasAttribute('hidden'), true);
    await unmount();
  });

  it('puts the content back in the tab order when it opens', async () => {
    const { host, unmount } = await mount(fixture.pass);
    const ctx = makeContext({ act, win, host, fixture });
    assert.equal(tabbables(ctx.q(fixture.region)).length, 0);
    await ctx.click(ctx.q(fixture.trigger));
    assert.equal(tabbables(ctx.q(fixture.region)).length, 1);
    await unmount();
  });

  it('starts collapsed by default', async () => {
    const { host, unmount } = await mount(fixture.pass);
    const ctx = makeContext({ act, win, host, fixture });
    assert.equal(ctx.q(fixture.trigger).getAttribute('aria-expanded'), 'false');
    await unmount();
  });

  it('is announced as a button, because it is one', async () => {
    const { host, unmount } = await mount(fixture.pass);
    const ctx = makeContext({ act, win, host, fixture });
    const trigger = ctx.q(fixture.trigger);
    assert.equal(trigger.tagName, 'BUTTON');
    assert.equal(trigger.getAttribute('type'), 'button');
    assert.equal(ctx.name(trigger), 'Delivery options');
    await unmount();
  });
});
