/**
 * What counts as tabbable, and where Tab goes next inside a contained region.
 *
 * A focus trap that is wrong is worse than having no dialog at all, because
 * the keyboard user cannot leave the page region. So the cases are enumerated
 * here rather than exercised through a component.
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { doc } from './_render.mjs';
import { isTabbable, tabbables, nextFocusTarget } from '../build/src/a11y/focusable.js';

let box;

beforeEach(() => {
  doc.body.innerHTML = '';
  box = doc.createElement('div');
  doc.body.appendChild(box);
});

function html(markup) {
  box.innerHTML = markup;
  return box;
}

describe('isTabbable', () => {
  it('accepts the controls that are tabbable by default', () => {
    html(`
      <a href="/a">link</a>
      <button>button</button>
      <input type="text">
      <select><option>one</option></select>
      <textarea></textarea>
    `);
    const found = tabbables(box).map((el) => el.tagName);
    assert.deepEqual(found, ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']);
  });

  it('rejects a link with no href, which looks like a link and is not one', () => {
    html('<a>not a link</a>');
    assert.equal(tabbables(box).length, 0);
  });

  it('rejects disabled controls', () => {
    html('<button disabled>no</button><input type="text" disabled>');
    assert.equal(tabbables(box).length, 0);
  });

  it('rejects a negative tabindex but accepts an explicit zero', () => {
    html('<div tabindex="-1">no</div><div tabindex="0">yes</div>');
    assert.equal(tabbables(box).length, 1);
    assert.equal(tabbables(box)[0].getAttribute('tabindex'), '0');
  });

  it('accepts a positive tabindex, while noting it is a bad idea', () => {
    // A positive tabindex is in the tab order, so this module has to report
    // it. It also reorders the whole document, which is why WCAG technique
    // F44 exists. Reporting it is not endorsing it.
    html('<div tabindex="3">yes</div>');
    assert.equal(tabbables(box).length, 1);
  });

  it('rejects a hidden input, which matches the input selector and is not focusable', () => {
    html('<input type="hidden">');
    assert.equal(tabbables(box).length, 0);
  });

  it('rejects anything under a hidden ancestor', () => {
    html('<div hidden><button>no</button></div>');
    assert.equal(tabbables(box).length, 0);
  });

  it('rejects anything under aria-hidden, including itself', () => {
    html('<div aria-hidden="true"><button>no</button></div><button aria-hidden="true">no</button>');
    assert.equal(tabbables(box).length, 0);
  });

  it('rejects anything under inert', () => {
    html('<div inert><button>no</button></div>');
    assert.equal(tabbables(box).length, 0);
  });

  it('rejects display none and visibility hidden', () => {
    html(
      '<div style="display:none"><button>no</button></div>' +
        '<div style="visibility:hidden"><button>no</button></div>',
    );
    assert.equal(tabbables(box).length, 0);
  });

  it('accepts content collapsed with height zero, because the browser does', () => {
    // This is the disclosure defect in one assertion. A zero height container
    // with overflow hidden is invisible and fully tabbable, and no visual
    // review will ever catch it.
    html('<div style="height:0;overflow:hidden"><a href="/x">still tabbable</a></div>');
    assert.equal(tabbables(box).length, 1);
  });

  it('accepts contenteditable unless it is switched off', () => {
    html('<div contenteditable="true">yes</div><div contenteditable="false">no</div>');
    assert.equal(tabbables(box).length, 1);
  });

  it('reports a single element directly', () => {
    html('<button id="b">yes</button>');
    const button = doc.getElementById('b');
    assert.equal(isTabbable(button), true);
    button.setAttribute('disabled', '');
    assert.equal(isTabbable(button), false);
  });
});

describe('nextFocusTarget', () => {
  beforeEach(() => {
    html('<button id="one">one</button><input id="two"><a id="three" href="/x">three</a>');
  });

  it('cycles forward and wraps at the end', () => {
    assert.equal(nextFocusTarget(box, doc.getElementById('one'), false).id, 'two');
    assert.equal(nextFocusTarget(box, doc.getElementById('two'), false).id, 'three');
    assert.equal(nextFocusTarget(box, doc.getElementById('three'), false).id, 'one');
  });

  it('cycles backward and wraps at the start', () => {
    assert.equal(nextFocusTarget(box, doc.getElementById('three'), true).id, 'two');
    assert.equal(nextFocusTarget(box, doc.getElementById('two'), true).id, 'one');
    assert.equal(nextFocusTarget(box, doc.getElementById('one'), true).id, 'three');
  });

  it('enters from the near end when the active element is outside the region', () => {
    const outside = doc.createElement('button');
    doc.body.appendChild(outside);
    assert.equal(nextFocusTarget(box, outside, false).id, 'one');
    assert.equal(nextFocusTarget(box, outside, true).id, 'three');
    assert.equal(nextFocusTarget(box, null, false).id, 'one');
  });

  it('skips over a control that has become untabbable', () => {
    doc.getElementById('two').setAttribute('disabled', '');
    assert.equal(nextFocusTarget(box, doc.getElementById('one'), false).id, 'three');
  });

  it('returns null when the region holds nothing to focus', () => {
    html('<p>just text</p>');
    assert.equal(nextFocusTarget(box, null, false), null);
  });

  it('returns the only control when the region holds exactly one', () => {
    html('<button id="only">only</button>');
    assert.equal(nextFocusTarget(box, doc.getElementById('only'), false).id, 'only');
    assert.equal(nextFocusTarget(box, doc.getElementById('only'), true).id, 'only');
  });
});
