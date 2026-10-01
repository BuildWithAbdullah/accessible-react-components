import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { liveRegionProps, interrupts } from '../build/src/a11y/live.js';

describe('liveRegionProps', () => {
  it('pairs status with polite', () => {
    assert.deepEqual(liveRegionProps('status'), {
      role: 'status',
      'aria-live': 'polite',
      'aria-atomic': 'true',
    });
  });

  it('pairs alert with assertive', () => {
    assert.deepEqual(liveRegionProps('alert'), {
      role: 'alert',
      'aria-live': 'assertive',
      'aria-atomic': 'true',
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
