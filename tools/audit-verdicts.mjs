/**
 * Run the real audits, in a real child process, over every example and every
 * constructed case, and check the result against what the manifests say it
 * should be.
 *
 * The test suite already does this. The reason to do it again here, from
 * outside, is that the suite and the thing it checks share a process: one
 * jsdom, one React, one module registry, and a `before` hook away from a
 * state that no consumer of this repository will ever have. This spawns a
 * fresh `node`, imports the published modules the way an application would,
 * and reads the verdicts back as JSON.
 *
 * What makes it worth more than a second copy of the suite is where the
 * expectations come from. They are **derived** from audit/coverage.mjs and
 * test/_case-table.mjs, not written down here:
 *
 *  - every audit passes on the corrected half of its pair
 *  - every audit fails on the failing half, with a finding that is in the
 *    declared pair coverage
 *  - the union of findings the failing halves produce equals that declared
 *    coverage exactly, in both directions
 *  - every constructed case produces exactly the finding its row claims
 *
 * A list of expected results kept in this file would go stale the first time
 * a pair was edited, and would go stale silently, because a tool that agrees
 * with its own hardcoded table always passes. Deriving them means editing a
 * pair breaks this until the manifest is corrected, which is the point.
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { REACHED_BY_PAIRS } from '../audit/coverage.mjs';

const ROOT = new URL('..', import.meta.url);
const SELF = fileURLToPath(import.meta.url);

async function emit() {
  const { AUDITS } = await import('../audit/index.mjs');
  const { runAudit, runOnCorrected, runOnFailing } = await import('../test/_audit-runner.mjs');
  const { CASES } = await import('../test/_case-table.mjs');

  const record = async (row, thunk) => {
    try {
      await thunk();
      process.stdout.write(`${JSON.stringify({ ...row, passed: true, finding: null })}\n`);
    } catch (error) {
      process.stdout.write(
        `${JSON.stringify({
          ...row,
          passed: false,
          finding: error.name === 'AuditFailure' ? error.finding : null,
          error: error.name === 'AuditFailure' ? null : `${error.name}: ${error.message}`,
        })}\n`,
      );
    }
  };

  for (const audit of AUDITS) {
    await record({ kind: 'pair', audit: audit.id, half: 'pass' }, () => runOnCorrected(audit));
    await record({ kind: 'pair', audit: audit.id, half: 'fail' }, () => runOnFailing(audit));
  }
  for (const [finding, auditId, Component, fixture] of CASES) {
    const audit = AUDITS.find((entry) => entry.id === auditId);
    await record({ kind: 'case', audit: auditId, claims: finding }, () =>
      runAudit(audit, Component, fixture),
    );
  }
}

function runChild() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [SELF, '--emit'], {
      cwd: fileURLToPath(ROOT),
      stdio: ['ignore', 'pipe', 'inherit'],
    });
    let out = '';
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      out += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`the verdict runner exited ${code}`));
        return;
      }
      resolve(
        out
          .split('\n')
          .filter((line) => line.trim() !== '')
          .map((line) => JSON.parse(line)),
      );
    });
  });
}

async function check() {
  const { CASES } = await import('../test/_case-table.mjs');
  const { AUDITS } = await import('../audit/index.mjs');
  const rows = await runChild();
  const problems = [];
  let checks = 0;
  const expect = (condition, message) => {
    checks += 1;
    if (!condition) problems.push(message);
  };

  const pairs = rows.filter((row) => row.kind === 'pair');
  const cases = rows.filter((row) => row.kind === 'case');

  expect(
    pairs.length === AUDITS.length * 2,
    `the runner produced ${pairs.length} pair verdicts and the catalogue holds ${AUDITS.length} audits`,
  );
  expect(
    cases.length === CASES.length,
    `the runner produced ${cases.length} case verdicts and the table holds ${CASES.length} rows`,
  );

  for (const row of rows) {
    expect(!row.error, `${row.audit} crashed rather than reporting a finding: ${row.error}`);
  }

  for (const row of pairs) {
    if (row.half === 'pass') {
      expect(
        row.passed,
        `${row.audit} failed on the corrected example with ${row.finding}`,
      );
      continue;
    }
    expect(
      !row.passed,
      `${row.audit} passed on the failing example, so it has never been seen to catch anything`,
    );
    if (!row.passed && row.finding) {
      expect(
        REACHED_BY_PAIRS.includes(row.finding),
        `${row.audit} reported ${row.finding} on its failing example, which audit/coverage.mjs does not list as reached by a pair`,
      );
    }
  }

  const reached = [
    ...new Set(pairs.filter((row) => row.half === 'fail' && row.finding).map((row) => row.finding)),
  ].sort();
  const declared = [...REACHED_BY_PAIRS].sort();
  expect(
    reached.join('|') === declared.join('|'),
    `the pairs reach ${reached.length} findings and audit/coverage.mjs declares ${declared.length}: only in the run [${reached.filter((id) => !declared.includes(id)).join(', ')}], only declared [${declared.filter((id) => !reached.includes(id)).join(', ')}]`,
  );

  for (const row of cases) {
    expect(
      row.finding === row.claims,
      row.passed
        ? `the case for ${row.claims} passed ${row.audit}, so it reaches no finding`
        : `the case for ${row.claims} reached ${row.finding} instead`,
    );
  }

  if (problems.length > 0) {
    console.error(`${problems.length} of ${checks} derived expectations failed:\n`);
    for (const problem of problems) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log(
    `${checks} derived expectations held across ${pairs.length} pair verdicts and ${cases.length} case verdicts, in a separate process.`,
  );
}

if (process.argv.includes('--emit')) await emit();
else await check();
