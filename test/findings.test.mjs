/**
 * The finding catalogue, driven.
 *
 * Three things are asserted here, and the third is the one worth reading.
 *
 *  1. Every constructed case in test/_cases.mjs reaches exactly the finding it
 *     was written for. Not a finding: that one. A case that reaches a
 *     different reason is testing something other than what it claims, and
 *     the shape of this suite is what caught several of the defects in
 *     docs/04-defects.md.
 *  2. The pairs reach exactly the set declared in audit/coverage.mjs, in both
 *     directions.
 *  3. The pairs and the cases together reach every finding in the catalogue,
 *     and nothing outside it. So no reason in this repository is a branch that
 *     has never been run, and no case drives a reason that is not catalogued.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { FINDINGS, SEVERITIES, findingById } from '../audit/findings.mjs';
import { REACHED_BY_PAIRS } from '../audit/coverage.mjs';
import { AUDITS, auditById } from '../audit/index.mjs';
import { runAudit, runOnCorrected, runOnFailing } from './_audit-runner.mjs';
import { CASES } from './_case-table.mjs';

async function findingReportedBy(audit, Component, fixture) {
  try {
    await runAudit(audit, Component, fixture);
  } catch (error) {
    if (error.name !== 'AuditFailure') {
      assert.fail(`${audit.id} threw ${error.name} rather than reporting a finding: ${error.message}`);
    }
    return error.finding;
  }
  return null;
}

describe('the finding catalogue is well formed', () => {
  it('gives every finding a unique id', () => {
    const ids = FINDINGS.map((finding) => finding.id);
    assert.equal(new Set(ids).size, ids.length, 'duplicate finding ids');
  });

  it('gives every finding a reason, a next action and a severity', () => {
    for (const finding of FINDINGS) {
      assert.ok(
        finding.reason.trim().length > 40,
        `${finding.id} does not say why it matters`,
      );
      assert.ok(
        finding.nextAction.trim().length > 20,
        `${finding.id} does not say what to do about it`,
      );
      assert.ok(
        SEVERITIES.includes(finding.severity),
        `${finding.id} has severity ${finding.severity}`,
      );
    }
  });
});

describe('each constructed case reaches exactly the finding it was written for', () => {
  for (const [finding, auditId, Component, fixture] of CASES) {
    it(`${finding} via ${auditId}`, async () => {
      const reported = await findingReportedBy(auditById(auditId), Component, fixture);
      assert.equal(
        reported,
        finding,
        reported === null
          ? `${auditId} passed, so this case reaches no finding at all`
          : `this case reaches ${reported}, not ${finding}`,
      );
      // The catalogue entry has to exist and belong to the component whose
      // audit reported it, or to no component in particular.
      const entry = findingById(finding);
      assert.ok(
        entry.component === 'any' || entry.component === auditById(auditId).component,
        `${finding} is filed under ${entry.component} and was reported by a ${auditById(auditId).component} audit`,
      );
    });
  }
});

describe('the pairs reach exactly the declared set', () => {
  it('and the declared set holds only real finding ids', () => {
    for (const id of REACHED_BY_PAIRS) findingById(id);
    assert.equal(
      new Set(REACHED_BY_PAIRS).size,
      REACHED_BY_PAIRS.length,
      'audit/coverage.mjs lists an id twice',
    );
  });

  it('with no finding reached by a pair missing from it, and none in it unreached', async () => {
    const reached = new Set();
    for (const audit of AUDITS) {
      for (const run of [runOnCorrected, runOnFailing]) {
        try {
          await run(audit);
        } catch (error) {
          if (error.name !== 'AuditFailure') {
            assert.fail(`${audit.id} threw ${error.name}: ${error.message}`);
          }
          reached.add(error.finding);
        }
      }
    }
    assert.deepEqual(
      [...reached].sort(),
      [...REACHED_BY_PAIRS].sort(),
      'the pairs no longer reach exactly the set declared in audit/coverage.mjs',
    );
  });
});

describe('the pairs and the cases together reach the whole catalogue', () => {
  it('with nothing left unreached and nothing reached that is not catalogued', () => {
    const byCases = CASES.map(([finding]) => finding);
    assert.equal(new Set(byCases).size, byCases.length, 'two cases claim the same finding');

    const all = FINDINGS.map((finding) => finding.id);
    const covered = [...new Set([...REACHED_BY_PAIRS, ...byCases])];
    assert.deepEqual(
      covered.sort(),
      [...all].sort(),
      'the catalogue and what is actually driven have come apart',
    );

    // The two routes must not overlap: a finding a pair already reaches does
    // not need a constructed case, and one that needs a case is by definition
    // out of the pairs' reach.
    const overlap = byCases.filter((finding) => REACHED_BY_PAIRS.includes(finding));
    assert.deepEqual(overlap, [], `${overlap.join(', ')} is reached by a pair and by a case`);
  });
});
