/**
 * The roving tabindex arithmetic, tested exhaustively rather than by example.
 *
 * This module has no DOM and no React in it, which is the reason it exists:
 * the off by one at the ends of a list is the defect that survives manual
 * testing, because nobody arrows all the way to the end of a nine item strip.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { nextIndex, tabIndexFor, typeaheadIndex } from '../build/src/a11y/roving.js';

describe('nextIndex, horizontal', () => {
  it('moves right and wraps at the end', () => {
    assert.equal(nextIndex(3, 0, 'ArrowRight'), 1);
    assert.equal(nextIndex(3, 1, 'ArrowRight'), 2);
    assert.equal(nextIndex(3, 2, 'ArrowRight'), 0);
  });

  it('moves left and wraps at the start', () => {
    assert.equal(nextIndex(3, 2, 'ArrowLeft'), 1);
    assert.equal(nextIndex(3, 1, 'ArrowLeft'), 0);
    assert.equal(nextIndex(3, 0, 'ArrowLeft'), 2);
  });

  it('clamps instead of wrapping when asked to', () => {
    assert.equal(nextIndex(3, 2, 'ArrowRight', { wrap: false }), 2);
    assert.equal(nextIndex(3, 0, 'ArrowLeft', { wrap: false }), 0);
  });

  it('ignores the vertical arrows', () => {
    assert.equal(nextIndex(3, 0, 'ArrowDown'), null);
    assert.equal(nextIndex(3, 0, 'ArrowUp'), null);
  });
});

describe('nextIndex, vertical', () => {
  it('moves down and up', () => {
    assert.equal(nextIndex(4, 0, 'ArrowDown', { orientation: 'vertical' }), 1);
    assert.equal(nextIndex(4, 3, 'ArrowDown', { orientation: 'vertical' }), 0);
    assert.equal(nextIndex(4, 0, 'ArrowUp', { orientation: 'vertical' }), 3);
  });

  it('ignores the horizontal arrows', () => {
    assert.equal(nextIndex(4, 0, 'ArrowRight', { orientation: 'vertical' }), null);
    assert.equal(nextIndex(4, 0, 'ArrowLeft', { orientation: 'vertical' }), null);
  });
});

describe('nextIndex, Home and End', () => {
  it('jumps to the ends in either orientation', () => {
    assert.equal(nextIndex(5, 3, 'Home'), 0);
    assert.equal(nextIndex(5, 3, 'End'), 4);
    assert.equal(nextIndex(5, 3, 'Home', { orientation: 'vertical' }), 0);
    assert.equal(nextIndex(5, 3, 'End', { orientation: 'vertical' }), 4);
  });

  it('jumps to the ends even when nothing is active yet', () => {
    assert.equal(nextIndex(5, -1, 'Home'), 0);
    assert.equal(nextIndex(5, -1, 'End'), 4);
  });
});

describe('nextIndex, nothing active yet', () => {
  it('enters the set from the near end, which is how a menu opens', () => {
    assert.equal(nextIndex(3, -1, 'ArrowDown', { orientation: 'vertical' }), 0);
    assert.equal(nextIndex(3, -1, 'ArrowUp', { orientation: 'vertical' }), 2);
  });

  it('treats an index outside the set as nothing active', () => {
    assert.equal(nextIndex(3, 99, 'ArrowRight'), 0);
    assert.equal(nextIndex(3, -7, 'ArrowRight'), 0);
  });
});

describe('nextIndex, keys this widget has no business claiming', () => {
  // The null return is the whole point. A composite widget that treats every
  // keydown as its own is how a page loses its browser shortcuts and how a
  // form stops submitting on Enter.
  for (const key of ['Tab', 'Enter', ' ', 'Escape', 'a', 'PageDown', 'F6', 'ArrowDown']) {
    it(`returns null for ${JSON.stringify(key)}`, () => {
      assert.equal(nextIndex(3, 0, key), null);
    });
  }

  it('returns null for an empty or impossible set', () => {
    assert.equal(nextIndex(0, 0, 'ArrowRight'), null);
    assert.equal(nextIndex(-1, 0, 'ArrowRight'), null);
    assert.equal(nextIndex(2.5, 0, 'ArrowRight'), null);
  });
});

describe('nextIndex, every position in a set of one', () => {
  it('stays put whatever is pressed', () => {
    assert.equal(nextIndex(1, 0, 'ArrowRight'), 0);
    assert.equal(nextIndex(1, 0, 'ArrowLeft'), 0);
    assert.equal(nextIndex(1, 0, 'Home'), 0);
    assert.equal(nextIndex(1, 0, 'End'), 0);
  });
});

describe('nextIndex never leaves the set', () => {
  it('holds for every size, position and key combination up to eight items', () => {
    const keys = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'];
    for (let count = 1; count <= 8; count += 1) {
      for (let current = -2; current <= count + 1; current += 1) {
        for (const key of keys) {
          for (const orientation of ['horizontal', 'vertical']) {
            for (const wrap of [true, false]) {
              const result = nextIndex(count, current, key, { orientation, wrap });
              if (result === null) continue;
              assert.ok(
                Number.isInteger(result) && result >= 0 && result < count,
                `count=${count} current=${current} key=${key} gave ${result}`,
              );
            }
          }
        }
      }
    }
  });
});

describe('tabIndexFor', () => {
  it('puts exactly one child in the tab order', () => {
    const tabIndexes = [0, 1, 2, 3].map((index) => tabIndexFor(index, 2));
    assert.deepEqual(tabIndexes, [-1, -1, 0, -1]);
    assert.equal(tabIndexes.filter((value) => value === 0).length, 1);
  });

  it('puts nothing in the tab order when nothing is active', () => {
    assert.deepEqual([0, 1, 2].map((index) => tabIndexFor(index, -1)), [-1, -1, -1]);
  });
});

describe('typeaheadIndex', () => {
  const labels = ['Duplicate', 'Export', 'Export as PDF', 'Archive'];

  it('finds the next match after the active item', () => {
    assert.equal(typeaheadIndex(labels, 0, 'e'), 1);
    assert.equal(typeaheadIndex(labels, 1, 'e'), 2);
  });

  it('wraps, so pressing the same letter cycles', () => {
    assert.equal(typeaheadIndex(labels, 2, 'e'), 1);
  });

  it('is case insensitive and ignores leading whitespace in a label', () => {
    assert.equal(typeaheadIndex(['  apple', 'Banana'], 1, 'A'), 0);
  });

  it('returns null when nothing matches, and for keys that are not letters', () => {
    assert.equal(typeaheadIndex(labels, 0, 'z'), null);
    assert.equal(typeaheadIndex(labels, 0, ' '), null);
    assert.equal(typeaheadIndex(labels, 0, 'ArrowDown'), null);
  });

  it('can match the active item itself after a full cycle', () => {
    assert.equal(typeaheadIndex(['Archive'], 0, 'a'), 0);
  });
});
