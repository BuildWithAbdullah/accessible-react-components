/**
 * A test reporter that reports one thing: how many tests ran.
 *
 * This exists because every other way of getting that number is version
 * dependent, and each trap only shows up on a Node line nobody happened to
 * try:
 *
 *  - Node's own reporter text moved. The same suite printed `# tests 345` on
 *    Node 20 and 22 and `info tests 345`, with an information glyph instead
 *    of a hash, on Node 24. A verifier that greps for one of those is correct
 *    on the version it was written against and wrong on the others.
 *  - node:test's run() looked like the fix, because a structured event stream
 *    cannot change format. Its *contents* can. On 20.0.0, 22.0.0 and 22.12.0
 *    run() forwards a single test:pass for each whole file, so a per test
 *    count comes out as one per file, and the files are run in child
 *    processes.
 *  - inside a reporter the per test events are all present on every version,
 *    but `details.type` is not: it is 'suite' or undefined before some 22.x
 *    release and 'suite' or 'test' after. Selecting `type === 'test'` counts
 *    zero on the older ones.
 *
 * So: a reporter, because that is where the events are, and
 * `type !== 'suite'`, because the absence of the field has to mean test
 * rather than nothing. The output format is this repository's own, one line
 * that tools/count-tests.mjs reads, which is the one format that cannot move
 * underneath it.
 */
export const MARKER = 'arc-test-count';

export default async function* countReporter(source) {
  let tests = 0;
  let failed = 0;
  for await (const event of source) {
    if (event.type !== 'test:pass' && event.type !== 'test:fail') continue;
    // A suite is not a test. Anything that is not explicitly a suite is,
    // including the events on versions that do not set the field at all.
    if (event.data.details?.type === 'suite') continue;
    tests += 1;
    if (event.type === 'test:fail') failed += 1;
  }
  yield `${MARKER} ${tests} ${failed}\n`;
}
