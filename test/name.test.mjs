/**
 * The subset of the accessible name computation these audits rely on.
 *
 * The case that matters is the last one: an icon button whose glyph is marked
 * decorative and whose button carries no label computes to no name, and is
 * announced as "button".
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { doc } from './_render.mjs';
import { accessibleName } from '../audit/name.mjs';

let box;

beforeEach(() => {
  doc.body.innerHTML = '';
  box = doc.createElement('div');
  doc.body.appendChild(box);
});

function only(markup) {
  box.innerHTML = markup;
  return box.firstElementChild;
}

describe('accessibleName', () => {
  it('prefers aria-label', () => {
    assert.equal(accessibleName(only('<button aria-label="Close dialog">x</button>')), 'Close dialog');
  });

  it('follows aria-labelledby, including more than one id', () => {
    box.innerHTML =
      '<span id="a">Delete</span><span id="b">invoice</span><button aria-labelledby="a b"></button>';
    assert.equal(accessibleName(box.querySelector('button')), 'Delete invoice');
  });

  it('falls back to text content', () => {
    assert.equal(accessibleName(only('<button>Save changes</button>')), 'Save changes');
  });

  it('uses a label element for a form control', () => {
    box.innerHTML = '<label for="c">City</label><input id="c" type="text">';
    assert.equal(accessibleName(box.querySelector('input')), 'City');
  });

  it('ignores an aria-hidden subtree when reading text content', () => {
    assert.equal(accessibleName(only('<button><span aria-hidden="true">x</span></button>')), '');
  });

  it('ignores a hidden subtree when reading text content', () => {
    assert.equal(accessibleName(only('<button><span hidden>Close</span></button>')), '');
  });

  it('falls back to the title attribute, which is a last resort and not a good one', () => {
    assert.equal(accessibleName(only('<button title="Close"></button>')), 'Close');
  });

  it('uses alt text on an image inside the control', () => {
    assert.equal(accessibleName(only('<button><img alt="Close" src="x.png"></button>')), 'Close');
  });

  it('reports nothing for an unlabelled icon button, which is the point', () => {
    assert.equal(accessibleName(only('<button><svg aria-hidden="true"></svg></button>')), '');
  });

  it('treats whitespace only as no name at all', () => {
    assert.equal(accessibleName(only('<button aria-label="   ">   </button>')), '');
  });

  it('collapses runs of whitespace', () => {
    assert.equal(accessibleName(only('<button>  Save   changes \n </button>')), 'Save changes');
  });
});
