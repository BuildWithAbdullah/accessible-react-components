import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { liveRegionProps, liveMessageProps, interrupts } from '../build/src/a11y/live.js';

describe('liveRegionProps', () => {
  it('pairs status with polite', () => {
    assert.deepEqual(liveRegionProps('status'), {
      role: 'status',
      'aria-live': 'polite',
    });
  });

  it('pairs alert with assertive', () => {
    assert.deepEqual(liveRegionProps('alert'), {
      role: 'alert',
      'aria-live': 'assertive',
    });
  });

  it('states the role and the politeness together rather than relying on the implicit value', () => {
    for (const urgency of ['status', 'alert']) {
      const props = liveRegionProps(urgency);
      assert.ok(props.role);
      assert.ok(props['aria-live']);
    }
  });
});

describe('interrupts', () => {
  it('is true only for an alert', () => {
    assert.equal(interrupts('alert'), true);
    assert.equal(interrupts('status'), false);
  });
});

describe('the atomic flag', () => {
  /**
   * An earlier version of this module returned aria-atomic as part of the
   * region props, and ToastRegion put it on the container that collects the
   * messages. Atomic on a container means every change re-presents all of it,
   * so the second notification re-read the first. See docs/04-defects.md.
   */
  it('is not part of the region props, for either urgency', () => {
    for (const urgency of ['status', 'alert']) {
      assert.equal(
        'aria-atomic' in liveRegionProps(urgency),
        false,
        `the ${urgency} region carries the atomic flag, so it re-reads itself`,
      );
    }
  });

  it('belongs to a single message', () => {
    assert.deepEqual(liveMessageProps(), { 'aria-atomic': 'true' });
  });
});
