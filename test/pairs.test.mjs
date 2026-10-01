/**
 * The cross-check over the whole catalogue.
 *
 * Three rules, and the second is the one that makes the repository worth
 * reading:
 *
 *  1. every audit passes against the corrected example
 *  2. every audit fails against the failing example, so no check in here is a
 *     claim that has never been seen to break. When a new audit does not fit
 *     the existing failing example, the answer is a second failing example,
 *     not an exemption
 *  3. every audit fails against an empty page, so nothing passes by looking
 *     for something and finding nothing
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AUDITS, COMPONENTS, auditsFor } from '../audit/index.mjs';
import { createElement } from './_render.mjs';
import { runAudit, runOnCorrected, runOnFailing } from './_audit-runner.mjs';
import { fixtureFor } from './_fixtures.mjs';

function Empty() {
  return createElement('div', null);
}

describe('the catalogue', () => {
  it('covers every component with at least three audits', () => {
    for (const component of COMPONENTS) {
      assert.ok(
        auditsFor(component).length >= 3,
        `${component} has only ${auditsFor(component).length} audit(s)`,
      );
    }
  });

  it('gives every audit a unique id', () => {
    const ids = AUDITS.map((audit) => audit.id);
    assert.equal(new Set(ids).size, ids.length, 'duplicate audit ids');
  });

  it('gives every audit a pattern, a requirement, and its limits', () => {
    for (const audit of AUDITS) {
      assert.ok(
        typeof audit.pattern === 'string' && audit.pattern.trim().length > 3,
        `${audit.id} names no ARIA pattern`,
      );
      for (const field of ['requirement', 'proves', 'doesNotProve']) {
        assert.ok(
          typeof audit[field] === 'string' && audit[field].trim().length > 30,
          `${audit.id} has no useful ${field}`,
        );
      }
    }
  });
});

describe('every audit passes on the corrected example', () => {
  for (const audit of AUDITS) {
    it(audit.id, async () => {
      await runOnCorrected(audit);
    });
  }
});

describe('every audit fails on the failing example', () => {
  for (const audit of AUDITS) {
    it(audit.id, async () => {
      await assert.rejects(
        () => runOnFailing(audit),
        (error) => {
          // The failure has to come from the audit, not from the harness. An
          // earlier version of this file accepted any thrown error, and a
          // stack overflow in the test DOM setup made this whole suite green
          // while every corrected example was failing.
          assert.equal(
            error.name,
            'AuditFailure',
            `${audit.id} threw ${error.name}: ${error.message}`,
          );
          assert.ok(error.message.length > 0, `${audit.id} failed without saying why`);
          return true;
        },
        `${audit.id} passed against the failing example, so it has never been seen to catch anything`,
      );
    });
  }
});

describe('no audit passes against an empty page', () => {
  for (const audit of AUDITS) {
    it(audit.id, async () => {
      await assert.rejects(
        () => runAudit(audit, Empty, fixtureFor(audit.component), {}),
        (error) => {
          assert.equal(
            error.name,
            'AuditFailure',
            `${audit.id} threw ${error.name} rather than reporting a missing part: ${error.message}`,
          );
          return true;
        },
        `${audit.id} passed against a page with nothing on it`,
      );
    });
  }
});
