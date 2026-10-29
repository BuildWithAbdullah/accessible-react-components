/**
 * Every declared limit, asserted in both directions.
 *
 * A limit written as a sentence is a caveat a reader can skip. A limit
 * written as an assertion over constructed inputs is a fact about the suite.
 * For each entry in audit/limits.mjs this file builds inputs covering the
 * combinations of the audit's verdict against the thing the limit says the
 * verdict is not about, and requires that each of them exists.
 *
 * Where the table says four combinations, the verdict carries no information
 * in either direction. Where it says two, the implication really does run one
 * way and the limit says which way, and the two combinations are the ones
 * that show the other way does not hold.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { LIMITS, limitById } from '../audit/limits.mjs';
import { auditById } from '../audit/index.mjs';
import { runAudit } from './_audit-runner.mjs';
import { createElement as h } from './_render.mjs';
import { accessibleName } from '../audit/name.mjs';

const { useEffect, useRef, useState } = await import('react');

const DIALOG = { trigger: '[data-arc-trigger]', panel: '.lx-panel', close: '.lx-close' };
const TOAST = {
  trigger: '[data-arc-trigger]',
  message: 'Profile saved',
  dismiss: '.lx-dismiss',
  timerWindowMs: 40,
};

/** Did the audit report a finding, and which one. */
async function verdict(auditId, Component, fixture, props = {}) {
  try {
    await runAudit(auditById(auditId), Component, fixture, props);
    return { passed: true, finding: null };
  } catch (error) {
    if (error.name !== 'AuditFailure') {
      assert.fail(`${auditId} threw ${error.name}: ${error.message}`);
    }
    return { passed: false, finding: error.finding };
  }
}

/**
 * Assert that every combination of the audit's verdict against some other
 * property is reachable, so the verdict is not evidence about that property.
 */
async function assertCombinations(limitId, cases) {
  const limit = limitById(limitId);
  const seen = new Set();
  for (const { label, run, independent } of cases) {
    const result = await run();
    seen.add(`${result.passed ? 'pass' : 'fail'}/${independent ? 'yes' : 'no'}`);
    assert.ok(typeof label === 'string' && label.length > 0, 'a case has no label');
  }
  assert.equal(
    seen.size,
    limit.combinations,
    `${limitId} declares ${limit.combinations} combinations of the verdict against ${limit.independent} and the cases reach ${seen.size}: ${[...seen].sort().join(' ')}`,
  );
  if (limit.combinations === 4) {
    for (const verdictValue of ['pass', 'fail']) {
      for (const independentValue of ['yes', 'no']) {
        assert.ok(
          seen.has(`${verdictValue}/${independentValue}`),
          `${limitId} never reaches a ${verdictValue} with ${limit.independent} = ${independentValue}, so the verdict does carry information`,
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------
// LIMIT-MODAL-IS-NOT-INERT
//
// A dialog, crossed two ways: whether it carries aria-modal, and whether the
// content behind it is actually taken out of reach.
// ---------------------------------------------------------------------------
function makeDialog({ modal, inertBackground, contained = true, hiddenBackground = false, close = 'button' }) {
  return function Dialog() {
    const first = useRef(null);
    const last = useRef(null);
    const onKeyDown = (event) => {
      if (event.key !== 'Tab') return;
      if (!contained) return;
      event.preventDefault();
      if (event.shiftKey) last.current?.focus();
      else first.current?.focus();
    };
    const panelProps = {
      key: 'p',
      className: 'lx-panel',
      role: 'dialog',
      'aria-labelledby': 'lx-title',
      onKeyDown,
    };
    if (modal) panelProps['aria-modal'] = 'true';
    const backgroundProps = { key: 'bg', className: 'lx-background' };
    if (inertBackground) backgroundProps.inert = '';
    if (hiddenBackground) backgroundProps['aria-hidden'] = 'true';
    const closeProps = { key: 'c', ref: first, className: 'lx-close' };
    if (close === 'div') {
      closeProps.role = 'button';
      closeProps.tabIndex = 0;
      closeProps.onKeyDown = (event) => {
        if (event.key === 'Enter' || event.key === ' ') event.preventDefault();
      };
    }
    return h('div', { className: 'lx' }, [
      h('div', backgroundProps, h('button', { 'data-arc-trigger': true }, 'Open')),
      h('div', panelProps, [
        h('h2', { key: 'h', id: 'lx-title' }, 'Settings'),
        h(close === 'div' ? 'div' : 'button', closeProps, 'Close'),
        h('button', { key: 'l', ref: last }, 'Save'),
      ]),
    ]);
  };
}

// ---------------------------------------------------------------------------
// LIMIT-TIMER-WINDOW
// ---------------------------------------------------------------------------
function makeToast({ autoDismissMs }) {
  return function Toast() {
    const [shown, setShown] = useState(false);
    useEffect(() => {
      if (!shown || autoDismissMs === null) return undefined;
      const timer = setTimeout(() => setShown(false), autoDismissMs);
      return () => clearTimeout(timer);
    }, [shown]);
    return h('div', { className: 'lx' }, [
      h('button', { key: 't', 'data-arc-trigger': true, onClick: () => setShown(true) }, 'Save'),
      h('div', { key: 'r', role: 'status' }, [
        shown ? 'Profile saved' : '',
        shown ? h('button', { key: 'd', className: 'lx-dismiss' }, 'Dismiss') : null,
      ]),
    ]);
  };
}

// ---------------------------------------------------------------------------

describe('the limit table is well formed', () => {
  it('names a real audit and says what the verdict is not about', () => {
    for (const limit of LIMITS) {
      auditById(limit.audit);
      assert.ok(limit.claim.trim().length > 60, `${limit.id} has no useful claim`);
      assert.ok(limit.why.trim().length > 60, `${limit.id} does not say why it matters`);
      assert.ok(
        limit.independent.trim().length > 10,
        `${limit.id} does not say what its verdict is independent of`,
      );
      assert.ok(
        limit.combinations === 2 || limit.combinations === 4,
        `${limit.id} declares ${limit.combinations} combinations`,
      );
    }
  });

  it('gives every limit a unique id', () => {
    const ids = LIMITS.map((limit) => limit.id);
    assert.equal(new Set(ids).size, ids.length, 'duplicate limit ids');
  });
});

describe('LIMIT-MODAL-IS-NOT-INERT', () => {
  it('reaches every combination of the modal verdict against real inertness', async () => {
    await assertCombinations('LIMIT-MODAL-IS-NOT-INERT', [
      {
        label: 'aria-modal, background inert',
        independent: true,
        run: () => verdict('dialog-role-and-name', makeDialog({ modal: true, inertBackground: true }), DIALOG),
      },
      {
        label: 'aria-modal, background reachable',
        independent: false,
        run: () => verdict('dialog-role-and-name', makeDialog({ modal: true, inertBackground: false }), DIALOG),
      },
      {
        label: 'no aria-modal, background inert',
        independent: true,
        run: () => verdict('dialog-role-and-name', makeDialog({ modal: false, inertBackground: true }), DIALOG),
      },
      {
        label: 'no aria-modal, background reachable',
        independent: false,
        run: () => verdict('dialog-role-and-name', makeDialog({ modal: false, inertBackground: false }), DIALOG),
      },
    ]);
  });

  it('and the quiet case is a pass: aria-modal with the whole page still reachable', async () => {
    const result = await verdict(
      'dialog-role-and-name',
      makeDialog({ modal: true, inertBackground: false }),
      DIALOG,
    );
    assert.equal(result.passed, true, 'this is the case the limit exists to warn about');
  });
});

describe('LIMIT-CONTAINMENT-IS-NOT-EXPOSURE', () => {
  it('reaches every combination of the containment verdict against background exposure', async () => {
    const run = (contained, hiddenBackground) => () =>
      verdict(
        'dialog-tab-is-contained',
        makeDialog({ modal: true, inertBackground: false, contained, hiddenBackground }),
        DIALOG,
      );
    await assertCombinations('LIMIT-CONTAINMENT-IS-NOT-EXPOSURE', [
      { label: 'contained, background hidden', independent: true, run: run(true, true) },
      { label: 'contained, background exposed', independent: false, run: run(true, false) },
      { label: 'not contained, background hidden', independent: true, run: run(false, true) },
      { label: 'not contained, background exposed', independent: false, run: run(false, false) },
    ]);
  });
});

describe('LIMIT-TIMER-WINDOW', () => {
  it('passes a toast whose timer is longer than the window, and one with no timer', async () => {
    await assertCombinations('LIMIT-TIMER-WINDOW', [
      {
        label: 'a two second timer, which is what a real toast uses',
        independent: true,
        run: () =>
          verdict('toast-does-not-remove-itself-on-a-timer', makeToast({ autoDismissMs: 2000 }), TOAST),
      },
      {
        label: 'no timer at all',
        independent: false,
        run: () =>
          verdict('toast-does-not-remove-itself-on-a-timer', makeToast({ autoDismissMs: null }), TOAST),
      },
    ]);
  });

  it('so a pass does not distinguish a four second toast from one that stays', async () => {
    const timed = await verdict(
      'toast-does-not-remove-itself-on-a-timer',
      makeToast({ autoDismissMs: 2000 }),
      TOAST,
    );
    const untimed = await verdict(
      'toast-does-not-remove-itself-on-a-timer',
      makeToast({ autoDismissMs: null }),
      TOAST,
    );
    assert.equal(timed.passed, true, 'a two second timer is outside the window and therefore unseen');
    assert.equal(untimed.passed, true);
    assert.equal(timed.passed, untimed.passed, 'the verdict is the same for both, which is the limit');
  });

  it('and a timer inside the window is caught, so a failure here is real', async () => {
    const result = await verdict(
      'toast-does-not-remove-itself-on-a-timer',
      makeToast({ autoDismissMs: 5 }),
      TOAST,
    );
    assert.equal(result.finding, 'TST-REMOVED-ON-A-TIMER');
  });
});

describe('LIMIT-NAME-IS-A-SUBSET', () => {
  it('reports no name for a control a browser would name from a wrapping label', () => {
    const doc = globalThis.document;
    const wrapper = doc.createElement('div');
    wrapper.innerHTML =
      '<label>Quantity<input id="lx-wrapped" type="text"></label>' +
      '<input id="lx-bare" type="text">' +
      '<button id="lx-glyph"><span aria-hidden="true">x</span></button>' +
      '<button id="lx-img"><img alt="Close" aria-hidden="true"></button>';
    doc.body.appendChild(wrapper);
    try {
      const named = doc.getElementById('lx-wrapped');
      const bare = doc.getElementById('lx-bare');
      assert.equal(accessibleName(named), '', 'a wrapping label is outside the implemented subset');
      assert.equal(accessibleName(bare), '');
      // Both values of "actually has a name" produce the same empty result,
      // which is the limit. The direction that does hold is the one the
      // module is for.
      assert.equal(
        accessibleName(doc.getElementById('lx-glyph')),
        '',
        'a glyph marked aria-hidden computes to nothing, which is the case this is reliable for',
      );
      assert.equal(
        accessibleName(doc.getElementById('lx-img')),
        '',
        'and the same is true when the glyph is an image rather than a span',
      );
    } finally {
      wrapper.remove();
    }
  });
});

describe('LIMIT-KEYPRESS-IS-NOT-ACTIVATION', () => {
  it('reports a keyboard operable div, so the finding is about markup and not behaviour', async () => {
    await assertCombinations('LIMIT-KEYPRESS-IS-NOT-ACTIVATION', [
      {
        label: 'a real button, which is operable',
        independent: true,
        run: () =>
          verdict(
            'dialog-close-control-is-a-button',
            makeDialog({ modal: true, inertBackground: false, close: 'button' }),
            DIALOG,
          ),
      },
      {
        label: 'a div with role, tabindex and handlers for both keys, also operable',
        independent: true,
        run: () =>
          verdict(
            'dialog-close-control-is-a-button',
            makeDialog({ modal: true, inertBackground: false, close: 'div' }),
            DIALOG,
          ),
      },
    ]);
  });

  it('and reports the operable div with DLG-CLOSE-NOT-A-BUTTON', async () => {
    const result = await verdict(
      'dialog-close-control-is-a-button',
      makeDialog({ modal: true, inertBackground: false, close: 'div' }),
      DIALOG,
    );
    assert.equal(result.finding, 'DLG-CLOSE-NOT-A-BUTTON');
  });
});
