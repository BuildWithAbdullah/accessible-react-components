/**
 * Which files in this working tree git would actually track.
 *
 * The verifier states how many files it checked, and that number has to mean
 * something. A walk that skips a hardcoded list of directories is wrong in
 * both directions: it counts files git ignores, and it misses the day
 * somebody adds a directory to .gitignore and not to the list.
 *
 * So this reads .gitignore and applies it. The rules that matter and that a
 * naive matcher gets wrong:
 *
 *  - a pattern with no slash matches at any depth, and one with a slash in
 *    the middle is anchored to the repository root
 *  - a trailing slash matches directories only
 *  - a leading ! negates, and **the last matching rule wins**, not the first.
 *    Order is the whole semantics: `*.log` then `!examples/debug.log` keeps
 *    that one file, and the same two lines the other way round do not
 *  - a file inside an ignored directory is ignored however specific a later
 *    rule is, which is why directory matches are checked on the way down
 *
 * CI does not take this on trust. There is a job that compares the result
 * against `git ls-files`, because the only authority on what git tracks is
 * git, and a matcher that agrees with itself proves nothing.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** Turn one .gitignore line into a matcher, or null if it is not a rule. */
function compile(line) {
  const trimmed = line.replace(/\s+$/, '');
  if (trimmed === '' || trimmed.startsWith('#')) return null;

  let body = trimmed;
  const negated = body.startsWith('!');
  if (negated) body = body.slice(1);

  const directoryOnly = body.endsWith('/');
  if (directoryOnly) body = body.slice(0, -1);

  const anchored = body.startsWith('/') || body.slice(0, -1).includes('/');
  if (body.startsWith('/')) body = body.slice(1);

  // Build a regular expression over the path, segment by segment, so that a
  // single star stops at a slash and a double star does not.
  let source = '';
  for (let i = 0; i < body.length; i += 1) {
    const char = body[i];
    if (char === '*') {
      if (body[i + 1] === '*') {
        source += '.*';
        i += 1;
        if (body[i + 1] === '/') i += 1;
        continue;
      }
      source += '[^/]*';
      continue;
    }
    if (char === '?') {
      source += '[^/]';
      continue;
    }
    source += char.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }

  const pattern = anchored
    ? new RegExp(`^${source}(/.*)?$`)
    : new RegExp(`(^|/)${source}(/.*)?$`);

  return { negated, directoryOnly, pattern, line: trimmed };
}

export function parseGitignore(text) {
  return text.split('\n').map(compile).filter(Boolean);
}

/**
 * Whether a path is ignored. `rules` is in file order and the last match
 * decides, so this walks the whole list rather than returning early.
 */
export function isIgnored(rules, path, isDirectory) {
  let ignored = false;
  for (const rule of rules) {
    if (rule.directoryOnly && !isDirectory) continue;
    if (!rule.pattern.test(path)) continue;
    ignored = !rule.negated;
  }
  return ignored;
}

/**
 * Every tracked file under `root`, as repository relative paths in sorted
 * order. `.git` is skipped unconditionally: it is not in .gitignore because
 * git does not need telling.
 */
export function trackedFiles(root) {
  let rules = [];
  try {
    rules = parseGitignore(readFileSync(join(root, '.gitignore'), 'utf8'));
  } catch {
    rules = [];
  }

  const out = [];
  const walk = (relative) => {
    const absolute = relative === '' ? root : join(root, relative);
    for (const entry of readdirSync(absolute, { withFileTypes: true })) {
      if (entry.name === '.git') continue;
      const path = relative === '' ? entry.name : `${relative}/${entry.name}`;
      const isDirectory = entry.isDirectory();
      if (isIgnored(rules, path, isDirectory)) continue;
      if (isDirectory) walk(path);
      else out.push(path);
    }
  };
  walk('');
  return out.sort();
}

export const TEXT_FILE = /\.(mjs|js|jsx|ts|tsx|json|md|yml|yaml|css|html)$/;

/** Tracked files this repository's text rules apply to. */
export function trackedTextFiles(root) {
  return trackedFiles(root).filter((path) => TEXT_FILE.test(path) || path === 'LICENSE');
}

// The guard needs process.argv[1] in front of it: when this module is
// imported by `node --input-type=module -e`, argv[1] is undefined and
// realpathSync throws ENOENT on it.
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  const root = new URL('..', import.meta.url).pathname;
  for (const path of trackedFiles(root)) console.log(path);
}
