import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mount, act, win, createElement } from './_render.mjs';
import { makeContext } from '../audit/ctx.mjs';
import { fixtureFor } from './_fixtures.mjs';
import { auditSuite } from './_component.mjs';
import { ToastRegion } from '../build/src/components/ToastRegion.js';

auditSuite('toast');

const fixture = fixtureFor('toast');

async function regions(messages) {
  function Host() {
    return createElement(ToastRegion, { messages, onDismiss: () => {} });
  }
  const { host, unmount } = await mount(Host);
  const ctx = makeContext({ act, win, host, fixture });
  return { ctx, unmount };
}

describe('toast region, beyond the audits', () => {
  it('renders both regions with no messages at all', async () => {
    const { ctx, unmount } = await regions([]);
    const polite = ctx.q('[data-arc-toast-region="status"]');
    const assertive = ctx.q('[data-arc-toast-region="alert"]');
    assert.equal(polite.getAttribute('role'), 'status');
    assert.equal(polite.getAttribute('aria-live'), 'polite');
    assert.equal(assertive.getAttribute('role'), 'alert');
    assert.equal(assertive.getAttribute('aria-live'), 'assertive');
    assert.equal(polite.textContent, '');
    assert.equal(assertive.textContent, '');
    await unmount();
  });

  it('keeps the same region element across renders, which is what makes the change observable', async () => {
    const { host, unmount } = await mount(fixture.pass);
    const ctx = makeContext({ act, win, host, fixture });
    const before = ctx.q('[data-arc-toast-region="status"]');
    await ctx.click(ctx.trigger());
    const after = ctx.q('[data-arc-toast-region="status"]');
    assert.equal(before, after, 'the live region was replaced rather than updated');
    assert.match(after.textContent, /Profile saved/);
    await unmount();
  });

  it('routes a status message to the polite region and an alert to the assertive one', async () => {
    const { ctx, unmount } = await regions([
      { id: 'a', text: 'Draft saved' },
      { id: 'b', text: 'Payment declined', urgency: 'alert' },
    ]);
    assert.match(ctx.q('[data-arc-toast-region="status"]').textContent, /Draft saved/);
    assert.doesNotMatch(ctx.q('[data-arc-toast-region="status"]').textContent, /Payment declined/);
    assert.match(ctx.q('[data-arc-toast-region="alert"]').textContent, /Payment declined/);
    await unmount();
  });

  it('defaults to polite when no urgency is given', async () => {
    const { ctx, unmount } = await regions([{ id: 'a', text: 'Draft saved' }]);
    assert.equal(ctx.q('[data-arc-toast-region="alert"]').textContent, '');
    await unmount();
  });

  it('names the dismiss control after the message it dismisses', async () => {
    const { ctx, unmount } = await regions([{ id: 'a', text: 'Draft saved' }]);
    const button = ctx.q('[data-arc-toast-region="status"] button');
    assert.equal(ctx.name(button), 'Dismiss notification: Draft saved');
    await unmount();
  });

  it('marks the glyph decorative, so the name comes from the label alone', async () => {
    const { ctx, unmount } = await regions([{ id: 'a', text: 'Draft saved' }]);
    const glyph = ctx.q('[data-arc-toast-region="status"] button span');
    assert.equal(glyph.getAttribute('aria-hidden'), 'true');
    await unmount();
  });

  it('dismisses only the message that was dismissed', async () => {
    const { host, unmount } = await mount(fixture.pass);
    const ctx = makeContext({ act, win, host, fixture });
    await ctx.click(ctx.trigger());
    await ctx.click(ctx.trigger());
    assert.equal(ctx.qa('[data-arc-toast-region="status"] .arc-toast').length, 2);
    await ctx.click(ctx.q('[data-arc-toast-region="status"] button'));
    assert.equal(ctx.qa('[data-arc-toast-region="status"] .arc-toast').length, 1);
    await unmount();
  });

  it('renders no dismiss control when there is no handler for it', async () => {
    function Host() {
      return createElement(ToastRegion, { messages: [{ id: 'a', text: 'Saved' }] });
    }
    const { host, unmount } = await mount(Host);
    assert.equal(host.querySelector('button'), null);
    await unmount();
  });
});
