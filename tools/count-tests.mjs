/**
 * How many tests this repository has.
 *
 * The number goes in the README, so it has to come from the test runner
 * rather than from a count of `it(` in the source, which misses every test
 * generated in a loop, and this repository generates most of them that way:
 * one per audit, one per finding, one per constructed case.
 *
 * tools/test-count-reporter.mjs explains why the count is collected by a
 * reporter, and what goes wrong on each Node line if it is collected any of
 * the other obvious ways.
 *
 * Two things about how it runs that are not style choices.
 *
 * It is spawnSync rather than spawn. An asynchronous spawn of `node --test`
 * with a piped stdout did not terminate here: the run never reached its
 * close event and the process sat burning system time, while the same
 * argument list under spawnSync finished in twelve seconds. Nothing is gained
 * by doing this concurrently, so it does not.
 *
 * And the marker string below is written out again rather than imported from
 * the reporter, which is not the obvious way round. Importing the reporter
 * module into this process made the spawned run stop finishing: the same
 * thirteen files took twelve seconds with no import and had not finished
 * after a hundred, with no output at all. Cause not established, and worth
 * knowing rather than worth fighting. The duplication is kept honest by
 * tools/verify.mjs, which asserts the two spellings agree.
 *
 * The file list comes out of the test script in package.json, not off the
 * disk, so this counts exactly what `npm test` runs. A test file that exists
 * and is never run is the defect tools/verify.mjs exists to catch, and this
 * must not paper over it by finding the file anyway.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = new URL('..', import.meta.url);

/** Must equal MARKER in tools/test-count-reporter.mjs; the verifier checks it. */
const MARKER = 'arc-test-count';

export function testFilesFromPackageJson(root = ROOT) {
  const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));
  const named = pkg.scripts.test.match(/test\/[\w.-]+\.test\.mjs/g) ?? [];
  if (named.length === 0) {
    throw new Error('the test script in package.json names no test files');
  }
  return [...new Set(named)];
}

export function countTests(root = ROOT) {
  const files = testFilesFromPackageJson(root);
  const reporter = fileURLToPath(new URL('tools/test-count-reporter.mjs', root));
  const result = spawnSync(
    process.execPath,
    ['--test', `--test-reporter=${reporter}`, ...files],
    {
      cwd: fileURLToPath(root),
      encoding: 'utf8',
      timeout: 600000,
      maxBuffer: 16 * 1024 * 1024,
    },
  );
  if (result.error) throw result.error;
  if (result.signal) throw new Error(`the test run was killed by ${result.signal}`);

  const line = (result.stdout ?? '')
    .split('\n')
    .map((text) => text.trim())
    .find((text) => text.startsWith(`${MARKER} `));
  if (!line) {
    throw new Error(
      `the counting reporter produced no count. stderr: ${(result.stderr ?? '').slice(0, 400)}`,
    );
  }

  const [, tests, failed] = line.split(/\s+/);
  const count = Number(tests);
  // Zero is the answer every one of the broken approaches gave, and it is the
  // number that would otherwise have gone quietly into the README.
  if (!Number.isInteger(count) || count === 0) {
    throw new Error(`the counting reporter reported ${tests} tests, which cannot be right`);
  }
  return { tests: count, failed: Number(failed), files: files.length };
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  const { tests, failed, files } = countTests();
  if (failed > 0) {
    console.error(`${failed} of ${tests} tests failed`);
    process.exit(1);
  }
  console.log(String(tests));
  if (process.argv.includes('--verbose')) console.error(`${tests} tests across ${files} files`);
}
