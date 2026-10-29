# accessible-react-components

Six React and TypeScript components built to the ARIA Authoring Practices,
with the keyboard behaviour each pattern requires tested rather than
described.

Every pattern ships twice: once as it usually arrives in a pull request, and
once corrected. The suite mounts both and runs the same 34 behavioural audits
over each, and it requires that every audit passes on the corrected version
and **fails on the failing one**. A check that has never been seen to catch
anything is a check nobody should trust.

```
npm install
npm test          # type check, then the audits over 12 examples and 43 cases
npm run verify    # the repository's own consistency checks
```

## What is here

| | |
|---|---|
| Components | 6, each naming the ARIA pattern it implements in its own header |
| Behavioural audits | 34, each stating what it proves and what it does not |
| Findings | 70 catalogued findings, one per reason a check can fail rather than one per check |
| Reached by a pair | 27 of them are reached by a pair; the other 43 need a case |
| Constructed cases | 43, one for each finding the pairs cannot reach |
| Limits | 5 declared limits, every one asserted in both directions |
| Tests | 345 tests, counted by the test runner rather than by grepping the source |
| Assertions | 582 repository assertions, checked by `npm run verify` |
| Pure modules | 3, with no React and no DOM, unit tested on their own |
| CI | Node 20.0.0 exactly, 22 and 24, plus five jobs that are not the tests |

The audits are not static checks. They mount the component, press keys, and
read what happened: where focus went, whether a key was claimed, whether a
state attribute moved, whether a message landed inside a region that already
existed.

## Findings

An audit is a check. A finding is a reason, and they are not the same thing.

`dialog-role-and-name` is one audit. It can fail because the overlay has no
role at all, because it has the role and not `aria-modal`, or because it has
both and no accessible name. Three defects, three different next actions, and
a reader told only that the audit failed has to go and read the audit to find
out which one they have. So every failure here names a finding from
`audit/findings.mjs`, and the finding says what it costs the user and what to
do about it.

Splitting the catalogue that way is also how the defects in
`docs/04-defects.md` were found. The six pairs are whole plausible
components, so each one reaches whichever reason its own defect happens to be
and nothing else in the same audit: **27 of the 70 findings, with 43 left as
branches nothing had ever run.** Writing a constructed case for each of those
43 produced five real defects, four of them in code the corrected examples
run.

`docs/03-findings.md` is the whole catalogue with the route that drives each
entry. `tools/verify.mjs` asserts the correspondence in both directions:
nothing catalogued that neither route drives, and nothing driven that is not
catalogued.

## Components

| Component | Pattern | Source |
|---|---|---|
| Dialog | Dialog (Modal) | `src/components/Dialog.tsx` |
| Disclosure | Disclosure | `src/components/Disclosure.tsx` |
| Tabs | Tabs, automatic activation | `src/components/Tabs.tsx` |
| Combobox | Combobox with list autocomplete, manual selection | `src/components/Combobox.tsx` |
| Menu button | Menu Button | `src/components/MenuButton.tsx` |
| Toast region | Alert, with WCAG 4.1.3 Status Messages | `src/components/ToastRegion.tsx` |

The combobox and the menu button sit next to each other on purpose. They look
alike and they behave in opposite ways: a combobox keeps DOM focus in the
text field and points at the active option with `aria-activedescendant`,
while a menu moves real focus onto the item. Mixing the two models up
produces a widget that announces one thing and behaves as another, and it is
the single most common defect in a hand rolled dropdown.

It is also where the worst defect in `docs/04-defects.md` lived. Because
focus stays in the text field, Home and End are caret keys there, and the
combobox was routing them through the roving tabindex arithmetic and
swallowing both.

Three pieces of logic are pulled out of the components into modules with no
React and no DOM in them, because they are the parts with edge cases worth
enumerating:

- `src/a11y/roving.ts`, the roving tabindex arithmetic. Tested over every
  combination of set size, current position, key, orientation and wrap
  setting up to eight items, with the invariant that the result is either
  null or inside the set. The null return is the point: a composite widget
  that treats every keydown as its own is how a page loses its browser
  shortcuts.
- `src/a11y/focusable.ts`, what is in the tab order and where Tab goes next
  inside a contained region. A focus trap that is wrong is worse than no
  dialog at all, so the cases are enumerated rather than clicked through.
- `src/a11y/live.ts`, live region politeness, and which element the atomic
  flag belongs on.

## Examples

Each directory holds `Fail.tsx` and `Pass.tsx`. The failing versions are
written the way the defect actually arrives: styled, plausible, and passing a
visual review.

- `examples/dialog/` overlay with no role, focus never moved in, Tab walking out, Escape dead, a `div` for the close control
- `examples/disclosure/` a `div` with a click handler, and a region collapsed to zero height so the link inside is invisible and still tabbable
- `examples/tabs/` three `div` elements, each its own tab stop, arrows doing nothing, selection carried by a class name
- `examples/combobox/` a text field and a `ul`, no roles, no `aria-expanded`, mouse only selection
- `examples/menu-button/` a button revealing a `div` of links, focus never entering, Escape dead
- `examples/toast/` a `role="alert"` created in the same commit as its message, which takes focus, carries the atomic flag on the region, and removes itself on a timer

`examples/README.md` says what each pair is for and why the audits do not use
the corrected markup's own selectors.

The toast pair is the one to read first. It passes every static check,
because the element it renders does carry a live region role. What is wrong
is *when* the element appeared: a region created and populated in the same
commit is, to several screen reader and browser pairings, a new element that
happens to have `role="status"`, and it goes unannounced.

That pair reaches the coarser half of the distinction, because there is no
region at all before the click. The subtler half, where a region is mounted
and empty and the message is delivered into a fresh one beside it, is
`TST-MESSAGE-IN-A-NEW-REGION` and is reached by a constructed case. The
README used to claim the pair showed both; `docs/04-defects.md` has the
correction.

## Verifying

```
npm install
npm test                        # type check, then every suite
npm run verify                  # the repository's own consistency checks
npm run verify:verdicts         # the audits again, out of process
```

`npm test` type checks the whole repository with `tsc`, then runs the suites
in `test/`. There are five kinds:

1. Unit suites over the pure modules (`test/roving.test.mjs`,
   `test/focusable.test.mjs`, `test/live.test.mjs`, `test/name.test.mjs`).
2. A suite per component, which runs that component's audits against both
   halves of its pair and then asserts the things the audits do not cover.
3. `test/pairs.test.mjs`, the cross-check over the whole catalogue: every
   audit passes on the corrected example, every audit fails on the failing
   one, and every audit fails against an empty page, so nothing passes by
   looking for something and finding nothing.
4. `test/findings.test.mjs`, which drives the finding catalogue. Each of the
   43 constructed cases has to reach exactly the finding it was written for,
   the pairs have to reach exactly the set declared in `audit/coverage.mjs`,
   and the two routes together have to reach the whole catalogue and nothing
   outside it. All of that is asserted as set equality in both directions,
   because inclusion would be worth nothing.
5. `test/limits.test.mjs`, which asserts every declared limit by constructing
   the combinations of the audit's verdict against the thing the limit says
   the verdict is not about.

Then three tools, all run by CI:

- `tools/verify.mjs` checks the repository holds together: every component
  names its pattern and uses the pure module its logic belongs in, every
  audit states its limits, every finding is catalogued and driven, every
  limit has a test on both sides, every example comes as a pair, every test
  file is named in the test script, the engines floor is an exact version
  that CI actually runs, and the numbers quoted in this README are the
  numbers the code produces. Each of those counts is matched as a whole line
  and has to appear on exactly one, so neither a wrapped number nor a second
  stale copy can pass.
- `tools/tracked.mjs` reads `.gitignore` and reports which files git would
  carry, so the file count above means something. CI compares it against
  `git ls-files`, because the only authority on what git tracks is git.
- `tools/audit-verdicts.mjs` runs every audit over every example and every
  case in a separate process, and checks the result against expectations
  **derived** from `audit/coverage.mjs` and `test/_case-table.mjs` rather
  than from a list kept in the tool. A tool that agrees with its own
  hardcoded table always passes.

The test count comes from a reporter rather than from Node's summary line,
and `tools/test-count-reporter.mjs` explains why: the same suite printed
`# tests 345` on Node 20 and 22 and `info tests 345` on Node 24, the
structured stream from `run()` reports one event per file on three of the
versions here, and `details.type` is absent for tests on the older ones.

CI runs all of it on Node 20.0.0 exactly, 22 and 24. The floor is pinned to
an exact version because `actions/setup-node` resolves a bare major to the
newest release of that line, so `>=20` with a job named `'20'` is not a
tested promise.

## What this does not prove

`docs/01-limits.md` is the honest version and is worth more than any count
above. The five limits at the end of it are held as data and asserted; the
short form of the rest:

- **A component cannot be accessible on its own.** Contrast, visible focus,
  target size, reflow at 320 pixels and at 400 percent zoom, reduced motion,
  and whether the label text means anything are all decided after the
  component leaves here.
- **The dialog contains Tab and does not make the rest of the page inert.**
  `aria-modal` is a promise, not an enforcement, and it does nothing about a
  screen reader virtual cursor, which does not use Tab. Both of those are
  asserted limits: `LIMIT-MODAL-IS-NOT-INERT` and
  `LIMIT-CONTAINMENT-IS-NOT-EXPOSURE`. If you can use the native `dialog`
  element, use it.
- **jsdom is not a browser.** Tab does not move focus in it, a key press on a
  button does not produce a click, `inert` is not implemented, and whether a
  live region is announced cannot be read out of the DOM at all. Each
  affected audit says so in its own `doesNotProve` field.
- **A pass on the timer audit means nothing.** It waits for the window the
  pair declares, so a toast with a four second timer and one with no timer
  are both passes. `LIMIT-TIMER-WINDOW` asserts exactly that.
- **Some of this is a choice, not a requirement.** Automatic against manual
  tab activation, which combobox model, whether a disabled menu item is
  skipped, and what an auto dismissing toast owes the reader.
  `docs/02-patterns.md` sets out each one and says which way this repository
  went and why.

`docs/04-defects.md` lists the defects found in this repository, what each
one cost, and the test that now holds it down.

## Licence

MIT. No attribution required.
