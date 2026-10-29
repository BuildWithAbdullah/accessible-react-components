/**
 * Repository verifier.
 *
 * The test suite proves the components behave. This proves the repository
 * holds together: that every component names the pattern it implements, that
 * every reason a check can fail for is catalogued, that every catalogued
 * reason is actually driven by something, that every declared limit has a
 * test on both sides, and that the numbers quoted in the README are the
 * numbers the code produces.
 *
 * It runs in CI alongside the tests, because a claim in a README that nothing
 * checks is a claim that goes stale on the first commit after it was written.
 *
 * Two rules about the assertion total it prints, both learned the hard way on
 * other repositories in this family:
 *
 *  - the total has to include the assertion that compares it against the
 *    README, or the README states a number one short of the truth
 *  - the total must not move when something it is not about changes. An
 *    earlier verifier of this shape made one assertion per line of a file it
 *    was scanning, so its total was partly a measure of how long that file
 *    was, and editing the file moved the README by 48. Every rule here that
 *    applies to a whole set of files is therefore one assertion over the set,
 *    reporting every offending location, rather than one assertion each.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AUDITS, COMPONENTS, auditsFor } from '../audit/index.mjs';
import { FINDINGS, SEVERITIES } from '../audit/findings.mjs';
import { REACHED_BY_PAIRS } from '../audit/coverage.mjs';
import { LIMITS } from '../audit/limits.mjs';
import { CASES } from '../test/_case-table.mjs';
import { trackedTextFiles } from './tracked.mjs';
import { countTests } from './count-tests.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

let checks = 0;
const problems = [];

function assert(condition, message) {
  checks += 1;
  if (!condition) problems.push(message);
}

const read = (path) => readFileSync(join(ROOT, path), 'utf8');

function exists(path) {
  try {
    statSync(join(ROOT, path));
    return true;
  } catch {
    return false;
  }
}

// The file list comes from tools/tracked.mjs, which reads .gitignore, so this
// is the set of files git would carry and not whatever happens to be on disk.
// CI compares that list against `git ls-files`, because the only authority on
// what git tracks is git.
const files = trackedTextFiles(ROOT);
assert(files.length > 20, `only ${files.length} tracked text files were found`);

// ---------------------------------------------------------------------------
// 1. Content rules that apply to every file, one assertion each over the
//    whole set.
//
//    The forbidden characters are assembled from their code points rather
//    than written out. An earlier verifier in this family failed on its own
//    source, because the characters it was looking for were in it.
// ---------------------------------------------------------------------------
const FORBIDDEN = [
  { needle: String.fromCharCode(8212), name: 'an em dash' },
  { needle: String.fromCharCode(8211), name: 'an en dash' },
  { needle: String.fromCharCode(8213), name: 'a horizontal bar' },
  { needle: ['F', 'A', 'S', 'T'].join('') + '-' + ['N', 'U', 'C', 'E', 'S'].join(''), name: 'the university' },
  { needle: ['N', 'U', 'C', 'E', 'S'].join(''), name: 'the university' },
  { needle: ['T', 'O', 'D', 'O'].join(''), name: 'an unfinished marker' },
  { needle: ['F', 'I', 'X', 'M', 'E'].join(''), name: 'an unfinished marker' },
];

const contents = new Map(files.map((path) => [path, read(path)]));

for (const { needle, name } of FORBIDDEN) {
  const found = [];
  for (const [path, text] of contents) {
    text.split('\n').forEach((line, index) => {
      if (line.includes(needle)) found.push(`${path}:${index + 1}`);
    });
  }
  assert(found.length === 0, `${name} appears at ${found.join(', ')}`);
}

// ---------------------------------------------------------------------------
// 2. Every component names the ARIA pattern it implements, and has audits.
// ---------------------------------------------------------------------------
const COMPONENT_FILES = {
  dialog: 'src/components/Dialog.tsx',
  disclosure: 'src/components/Disclosure.tsx',
  tabs: 'src/components/Tabs.tsx',
  combobox: 'src/components/Combobox.tsx',
  'menu-button': 'src/components/MenuButton.tsx',
  toast: 'src/components/ToastRegion.tsx',
};

for (const [component, path] of Object.entries(COMPONENT_FILES)) {
  assert(exists(path), `${path} is missing`);
  if (!exists(path)) continue;
  const source = read(path);
  assert(
    source.includes('ARIA Authoring Practices pattern:'),
    `${path} does not name the ARIA Authoring Practices pattern it implements`,
  );
  assert(
    /What the pattern requires|docs\/02-patterns\.md/.test(source),
    `${path} does not say what the pattern requires of it`,
  );
  assert(
    auditsFor(component).length >= 3,
    `${component} has only ${auditsFor(component).length} audit(s) and needs at least three`,
  );
}

assert(
  Object.keys(COMPONENT_FILES).length === COMPONENTS.length,
  'the component list in audit/index.mjs and the component list here disagree',
);

const MUST_IMPORT = [
  ['src/components/Dialog.tsx', '../a11y/focusable.js'],
  ['src/components/Tabs.tsx', '../a11y/roving.js'],
  ['src/components/Combobox.tsx', '../a11y/roving.js'],
  ['src/components/MenuButton.tsx', '../a11y/roving.js'],
  ['src/components/ToastRegion.tsx', '../a11y/live.js'],
];
for (const [path, dependency] of MUST_IMPORT) {
  assert(
    exists(path) && read(path).includes(dependency),
    `${path} does not use ${dependency}, so the logic is not where the unit tests are`,
  );
}

// ---------------------------------------------------------------------------
// 3. Every audit states what it proves and what it does not.
// ---------------------------------------------------------------------------
for (const audit of AUDITS) {
  assert(typeof audit.id === 'string' && audit.id.length > 0, 'an audit has no id');
  assert(
    typeof audit.pattern === 'string' && audit.pattern.length > 3,
    `${audit.id} names no ARIA pattern`,
  );
  for (const field of ['requirement', 'proves', 'doesNotProve']) {
    assert(
      typeof audit[field] === 'string' && audit[field].trim().length > 30,
      `${audit.id} has no useful ${field}`,
    );
  }
  assert(
    COMPONENTS.includes(audit.component),
    `${audit.id} belongs to ${audit.component}, which is not a component here`,
  );
}
assert(new Set(AUDITS.map((a) => a.id)).size === AUDITS.length, 'two audits share an id');

// ---------------------------------------------------------------------------
// 4. The finding catalogue, and the two directions that matter.
//
//    Every id an audit can report is catalogued, and every catalogued id is
//    reported by something. Either direction on its own is worthless: the
//    first lets the catalogue fill up with reasons nothing produces, and the
//    second lets an audit invent a reason the catalogue cannot explain.
// ---------------------------------------------------------------------------
const auditSources = readdirSync(join(ROOT, 'audit'))
  .filter((name) => name.endsWith('.mjs'))
  .map((name) => read(`audit/${name}`))
  .join('\n');

const catalogued = new Set(FINDINGS.map((finding) => finding.id));

for (const finding of FINDINGS) {
  assert(
    SEVERITIES.includes(finding.severity),
    `${finding.id} has severity ${finding.severity}`,
  );
  assert(
    finding.reason.trim().length > 60 && finding.nextAction.trim().length > 30,
    `${finding.id} does not both say why it matters and what to do about it`,
  );
  assert(
    finding.component === 'any' || COMPONENTS.includes(finding.component),
    `${finding.id} is filed under ${finding.component}`,
  );
}
assert(catalogued.size === FINDINGS.length, 'two findings share an id');

// Ids written out in an audit module and never catalogued.
const quoted = new Set(
  [...auditSources.matchAll(/'([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+)'/g)].map((match) => match[1]),
);
const uncatalogued = [...quoted].filter((id) => !catalogued.has(id) && !id.startsWith('LIMIT-'));
assert(
  uncatalogued.length === 0,
  `the audits report ${uncatalogued.join(', ')}, which the catalogue does not hold`,
);

// Catalogued and driven by nothing.
const driven = new Set([...REACHED_BY_PAIRS, ...CASES.map(([finding]) => finding)]);
const undriven = [...catalogued].filter((id) => !driven.has(id));
assert(
  undriven.length === 0,
  `${undriven.join(', ')} is catalogued and reached by neither a pair nor a case`,
);

const uncataloguedDriven = [...driven].filter((id) => !catalogued.has(id));
assert(
  uncataloguedDriven.length === 0,
  `${uncataloguedDriven.join(', ')} is driven and not catalogued`,
);

const overlap = CASES.map(([finding]) => finding).filter((id) => REACHED_BY_PAIRS.includes(id));
assert(
  overlap.length === 0,
  `${overlap.join(', ')} is reached by a pair and also has a constructed case`,
);

// ---------------------------------------------------------------------------
// 5. Every declared limit is asserted in both directions, and documented.
// ---------------------------------------------------------------------------
const limitsTest = exists('test/limits.test.mjs') ? read('test/limits.test.mjs') : '';
const limitsDoc = exists('docs/01-limits.md') ? read('docs/01-limits.md') : '';
for (const limit of LIMITS) {
  assert(
    AUDITS.some((audit) => audit.id === limit.audit),
    `${limit.id} names ${limit.audit}, which is not an audit`,
  );
  assert(
    limitsTest.includes(limit.id),
    `${limit.id} has no test in test/limits.test.mjs, so it is a caveat rather than a fact`,
  );
  assert(limitsDoc.includes(limit.id), `${limit.id} is not written up in docs/01-limits.md`);
  assert(
    limit.combinations === 2 || limit.combinations === 4,
    `${limit.id} declares ${limit.combinations} combinations`,
  );
}
assert(new Set(LIMITS.map((l) => l.id)).size === LIMITS.length, 'two limits share an id');

// ---------------------------------------------------------------------------
// 6. Every example comes as a pair, and every failing example says what is
//    wrong with it in its own header.
// ---------------------------------------------------------------------------
for (const component of COMPONENTS) {
  for (const half of ['Fail', 'Pass']) {
    assert(
      exists(`examples/${component}/${half}.tsx`),
      `examples/${component}/${half}.tsx is missing, so this pattern has no pair`,
    );
  }
  const failPath = `examples/${component}/Fail.tsx`;
  if (!exists(failPath)) continue;
  const bullets = read(failPath)
    .split('\n')
    .filter((line) => /^\s\*\s{2}-\s/.test(line)).length;
  assert(
    bullets >= 3,
    `${failPath} lists ${bullets} defect(s) in its header and should list at least three`,
  );
}

// ---------------------------------------------------------------------------
// 7. Every test file is actually run.
//
//    node --test did not accept glob patterns before Node 21, so the test
//    script names its files, which means a new test file can be added and
//    silently never run.
// ---------------------------------------------------------------------------
const pkg = JSON.parse(read('package.json'));
const testScript = pkg.scripts.test;
assert(!testScript.includes('*'), 'the test script uses a glob, which fails on Node 20');

const testFiles = readdirSync(join(ROOT, 'test')).filter((name) => name.endsWith('.test.mjs'));
assert(testFiles.length > 0, 'there are no test files');
for (const name of testFiles) {
  assert(testScript.includes(`test/${name}`), `test/${name} is never run by npm test`);
}
for (const named of testScript.match(/test\/[\w.-]+\.test\.mjs/g) ?? []) {
  assert(exists(named), `the test script names ${named}, which does not exist`);
}

assert(pkg.license === 'MIT', 'package.json does not declare the MIT licence');
assert(read('LICENSE').includes('MIT License'), 'LICENSE is not the MIT licence');

// The marker string is written out in two files because importing either of
// them into a process that then spawns the test run stopped that run from
// finishing. tools/count-tests.mjs records what was observed. Both spellings
// are therefore read here as text rather than imported, which is also the
// stricter check: it compares the source and not a value that could be
// computed.
const reporterMarker = read('tools/test-count-reporter.mjs').match(
  /export const MARKER = '([^']+)'/,
);
const counterMarker = read('tools/count-tests.mjs').match(/const MARKER = '([^']+)'/);
assert(reporterMarker !== null, 'tools/test-count-reporter.mjs declares no MARKER');
assert(counterMarker !== null, 'tools/count-tests.mjs declares no MARKER');
assert(
  reporterMarker?.[1] === counterMarker?.[1],
  `the count marker is '${reporterMarker?.[1]}' in the reporter and '${counterMarker?.[1]}' in the counter`,
);

// ---------------------------------------------------------------------------
// 8. An engines floor is a promise, so it has to name an exact version and CI
//    has to run that exact version.
//
//    `>=20` with a job named '20' is not a tested promise, because
//    actions/setup-node resolves a bare major to the newest release of that
//    line, and the floor is never the thing that runs.
// ---------------------------------------------------------------------------
const FLOOR = '20.0.0';
assert(
  pkg.engines?.node === `>=${FLOOR}`,
  `package.json declares engines.node ${pkg.engines?.node} and the tested floor is ${FLOOR}`,
);

const ci = exists('.github/workflows/ci.yml') ? read('.github/workflows/ci.yml') : '';
assert(ci.includes('npm test'), 'the CI workflow does not run the tests');
assert(ci.includes('npm run verify'), 'the CI workflow does not run this verifier');
assert(
  new RegExp(`['"]${FLOOR.replace(/\./g, '\\.')}['"]`).test(ci),
  `the CI workflow does not run Node ${FLOOR} exactly, so the floor is untested`,
);
assert(
  !/node:\s*\[\s*'\d+'/.test(ci) && !/node-version:\s*'\d+'\s*$/m.test(ci),
  'the CI workflow names a bare major version, which resolves to the newest release of that line',
);
assert(
  ci.includes('git ls-files'),
  'the CI workflow does not check tools/tracked.mjs against git',
);
assert(
  ci.includes('tools/audit-verdicts.mjs'),
  'the CI workflow does not run the out of process verdict check',
);

const srcOffenders = [];
for (const path of files.filter((p) => p.startsWith('src/'))) {
  const text = contents.get(path) ?? '';
  text.split('\n').forEach((line, index) => {
    if (/:\s*any\b/.test(line)) srcOffenders.push(`${path}:${index + 1} uses the any type`);
    if (/console\.(log|warn|error)/.test(line)) {
      srcOffenders.push(`${path}:${index + 1} leaves a console call in shipped code`);
    }
  });
}
assert(srcOffenders.length === 0, srcOffenders.join('; '));

// ---------------------------------------------------------------------------
// 9. The README says what is here, and the numbers in it are the real ones.
// ---------------------------------------------------------------------------
const readme = read('README.md');
for (const heading of [
  '## What is here',
  '## Components',
  '## Examples',
  '## Findings',
  '## Verifying',
  '## What this does not prove',
  '## Licence',
]) {
  assert(readme.includes(heading), `README.md has no ${heading} section`);
}

for (const component of COMPONENTS) {
  assert(
    readme.includes(`examples/${component}/`),
    `README.md does not point at examples/${component}/`,
  );
}
for (const path of Object.values(COMPONENT_FILES)) {
  assert(readme.includes(path), `README.md does not mention ${path}`);
}
for (const doc of ['docs/01-limits.md', 'docs/02-patterns.md', 'docs/03-findings.md', 'docs/04-defects.md', 'examples/README.md']) {
  assert(exists(doc), `${doc} is missing`);
  assert(readme.includes(doc), `README.md does not link ${doc}`);
}

/**
 * A stated number has to appear on exactly one line.
 *
 * Matching it with a pattern that can span lines lets a wrapped number pass
 * while reading as something else, and matching the first occurrence lets a
 * second, stale copy sit further down the file. So: split into lines, count
 * the lines that match, and require exactly one. This caught a real wrapped
 * number in this README, where "the same 33 behavioural" ended a line and
 * "audits over each" began the next.
 *
 * It makes both of its assertions unconditionally, and that is the part
 * worth reading. An earlier version returned early when the line count was
 * wrong, so it made one assertion in that case and two otherwise, which
 * meant **the assertion total depended on whether the assertions passed.**
 * Correcting one number in the README moved the total by three and therefore
 * invalidated the total, which is the same number being corrected. A
 * self-referential count cannot be allowed to move for a reason it is not
 * about, and whether the file is currently right is such a reason.
 */
function statedOnOneLine(label, pattern, expected) {
  const matches = readme.split('\n').filter((line) => pattern.test(line));
  assert(
    matches.length === 1,
    `README.md states the ${label} on ${matches.length} lines and it has to be exactly one`,
  );
  const found = matches.length === 1 ? Number(matches[0].match(pattern)[1]) : null;
  assert(
    found === expected,
    found === null
      ? `README.md does not state the ${label} on a single line, so its value cannot be checked`
      : `README.md says ${found} ${label} and the real number is ${expected}`,
  );
}

statedOnOneLine('behavioural audits', /(\d+)\s+behavioural\s+audits/, AUDITS.length);
statedOnOneLine('catalogued findings', /(\d+)\s+catalogued\s+findings/, FINDINGS.length);
statedOnOneLine('findings reached by a pair', /(\d+)\s+of\s+them\s+are\s+reached\s+by\s+a\s+pair/, REACHED_BY_PAIRS.length);
statedOnOneLine('constructed cases', /(\d+)\s+constructed\s+cases/, CASES.length);
statedOnOneLine('declared limits', /(\d+)\s+declared\s+limits/, LIMITS.length);

const { tests } = countTests();
statedOnOneLine('tests', /(\d+)\s+tests/, tests);

// ---------------------------------------------------------------------------
// The assertion total, last, and including its own comparison.
// ---------------------------------------------------------------------------
// Two assertions, always, for the same reason as statedOnOneLine above: the
// total has to be the same number whether or not the README currently says
// it. The total counts both of them, because a total that excludes its own
// comparison leaves the README one short of the truth.
const assertionLines = readme
  .split('\n')
  .filter((line) => /(\d+)\s+repository\s+assertions/.test(line));
const total = checks + 2;
checks = total;
if (assertionLines.length !== 1) {
  problems.push(
    `README.md states the repository assertion total on ${assertionLines.length} lines and it has to be exactly one`,
  );
  problems.push('and so the total it states cannot be checked');
} else {
  const stated = Number(assertionLines[0].match(/(\d+)\s+repository\s+assertions/)[1]);
  if (stated !== total) {
    problems.push(`README.md says ${stated} repository assertions and this run made ${total}`);
  }
}

if (problems.length > 0) {
  console.error(`${problems.length} of ${checks} assertions failed:\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}
console.log(
  `${checks} assertions passed across ${files.length} tracked files, ${AUDITS.length} audits, ${FINDINGS.length} findings and ${LIMITS.length} limits.`,
);
