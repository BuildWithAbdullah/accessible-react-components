/**
 * Repository verifier.
 *
 * The test suite proves the components behave. This proves the repository
 * holds together: that every component names the pattern it implements, that
 * every audit states its limits, that every example comes in a pair, that
 * every test file is actually run, and that the numbers quoted in the README
 * are the numbers the code produces.
 *
 * It runs in CI alongside the tests. A claim in a README that nothing checks
 * is a claim that goes stale on the first commit after it was written.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AUDITS, COMPONENTS, auditsFor } from '../audit/index.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

let checks = 0;
const problems = [];

function assert(condition, message) {
  checks += 1;
  if (!condition) problems.push(message);
}

function read(path) {
  return readFileSync(join(ROOT, path), 'utf8');
}

function exists(path) {
  try {
    statSync(join(ROOT, path));
    return true;
  } catch {
    return false;
  }
}

const SKIP_DIRS = new Set(['node_modules', '.git', 'build']);

function walk(dir, out = []) {
  for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.github') continue;
    if (SKIP_DIRS.has(entry.name)) continue;
    const next = dir === '.' ? entry.name : `${dir}/${entry.name}`;
    if (entry.isDirectory()) walk(next, out);
    else out.push(next);
  }
  return out;
}

const TEXT = /\.(mjs|js|jsx|ts|tsx|json|md|yml|yaml|css|html)$/;
const files = walk('.').filter((path) => TEXT.test(path) || path === 'LICENSE');

// ---------------------------------------------------------------------------
// 1. Typography and content rules that apply to every file.
//
// The forbidden characters are assembled from their code points rather than
// written out. An earlier verifier in this family of repositories failed on
// its own source, because the characters it was looking for were in it.
// ---------------------------------------------------------------------------
const FORBIDDEN_CHARS = [
  { char: String.fromCharCode(8212), name: 'em dash' },
  { char: String.fromCharCode(8211), name: 'en dash' },
  { char: String.fromCharCode(8213), name: 'horizontal bar' },
];
const FORBIDDEN_WORDS = [
  ['F', 'A', 'S', 'T'].join('') + '-' + ['N', 'U', 'C', 'E', 'S'].join(''),
  ['N', 'U', 'C', 'E', 'S'].join(''),
];

for (const path of files) {
  const text = readFileSync(join(ROOT, path), 'utf8');
  for (const { char, name } of FORBIDDEN_CHARS) {
    assert(!text.includes(char), `${path} contains a ${name}`);
  }
  for (const word of FORBIDDEN_WORDS) {
    assert(!text.includes(word), `${path} mentions ${word}`);
  }
  // Assembled the same way as the characters above, so this file does not
  // trip its own rule.
  const markers = [['T', 'O', 'D', 'O'].join(''), ['F', 'I', 'X', 'M', 'E'].join('')];
  for (const marker of markers) {
    assert(
      !new RegExp(`\\b${marker}\\b`).test(text),
      `${path} still has a ${marker} marker in it`,
    );
  }
}

// ---------------------------------------------------------------------------
// 2. Every component names the ARIA pattern it implements, and every pattern
//    it names appears in the audit catalogue under that component.
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

// ---------------------------------------------------------------------------
// 3. The behaviour that is worth testing on its own lives in a pure module,
//    and the components use it rather than reimplementing it.
// ---------------------------------------------------------------------------
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
// 4. Every audit states what it proves and what it does not.
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
    `${audit.id} belongs to ${audit.component}, which is not a component in this repository`,
  );
}
assert(new Set(AUDITS.map((a) => a.id)).size === AUDITS.length, 'two audits share an id');

// ---------------------------------------------------------------------------
// 5. Every example comes as a pair, and every failing example says what is
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
    `${failPath} lists ${bullets} defect(s) in its header comment and should list at least three`,
  );
}

// ---------------------------------------------------------------------------
// 6. Every test file is actually run.
//
//    node --test did not accept glob patterns before Node 21, so the test
//    script names its files. Which means a new test file can be added and
//    silently never run. This is the check that stops that.
// ---------------------------------------------------------------------------
const pkg = JSON.parse(read('package.json'));
const testScript = pkg.scripts.test;
assert(!testScript.includes('*'), 'the test script uses a glob, which fails on Node 18 and 20');

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

// ---------------------------------------------------------------------------
// 7. The README says what is here, and the numbers in it are the real ones.
// ---------------------------------------------------------------------------
const readme = read('README.md');
for (const heading of [
  '## What is here',
  '## Components',
  '## Examples',
  '## Verifying',
  '## What this does not prove',
  '## Licence',
]) {
  assert(readme.includes(heading), `README.md has no ${heading} section`);
}

for (const component of COMPONENTS) {
  assert(readme.includes(`examples/${component}/`), `README.md does not point at examples/${component}/`);
}
for (const path of Object.values(COMPONENT_FILES)) {
  assert(readme.includes(path), `README.md does not mention ${path}`);
}

const quotedAudits = readme.match(/(\d+)\s+behavioural\s+audits/);
assert(quotedAudits !== null, 'README.md does not state how many behavioural audits there are');
if (quotedAudits) {
  assert(
    Number(quotedAudits[1]) === AUDITS.length,
    `README.md says ${quotedAudits[1]} behavioural audits and the catalogue holds ${AUDITS.length}`,
  );
}

for (const doc of ['docs/01-limits.md', 'docs/02-patterns.md', 'examples/README.md']) {
  assert(exists(doc), `${doc} is missing`);
  assert(readme.includes(doc.replace('examples/', 'examples/')), `README.md does not link ${doc}`);
}

// ---------------------------------------------------------------------------
// 8. Source hygiene.
// ---------------------------------------------------------------------------
for (const path of files.filter((p) => p.startsWith('src/'))) {
  const text = read(path);
  assert(!/:\s*any\b/.test(text), `${path} uses the any type`);
  assert(!/console\.(log|warn|error)/.test(text), `${path} leaves a console call in shipped code`);
}

const ci = exists('.github/workflows/ci.yml') ? read('.github/workflows/ci.yml') : '';
assert(ci.includes('npm test'), 'the CI workflow does not run the tests');
assert(ci.includes('npm run verify'), 'the CI workflow does not run this verifier');
for (const version of ['18', '20', '22']) {
  assert(ci.includes(`'${version}'`), `the CI workflow does not cover Node ${version}`);
}

// ---------------------------------------------------------------------------
if (problems.length > 0) {
  console.error(`${problems.length} of ${checks} assertions failed:\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}
console.log(`${checks} assertions passed across ${files.length} files and ${AUDITS.length} audits.`);
