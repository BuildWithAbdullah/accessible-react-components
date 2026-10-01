# accessible-react-components

Six React and TypeScript components built to the ARIA Authoring Practices, with
the keyboard behaviour each pattern requires tested rather than described.

Every pattern ships twice: once as it usually arrives in a pull request, and
once corrected. The test suite mounts both and runs the same 33 behavioural
audits over each, and it requires that every audit passes on the corrected
version and **fails on the failing one**. A check that has never been seen to
catch anything is a check nobody should trust.

```
npm install
npm test          # type check, then 33 audits over 12 examples plus the unit suites
npm run verify    # the repository's own consistency checks
```

## What is here

| | |
|---|---|
| Components | 6, each naming the ARIA pattern it implements in its own header |
| Behavioural audits | 33, each stating what it proves and what it does not |
| Example pairs | 6 failing and 6 corrected, mounted and exercised by the audits |
| Pure modules | 3, with no React and no DOM, unit tested on their own |
| CI | Node 18, 20 and 22 |

The audits are not static checks. They mount the component, press keys, and
read what happened: where focus went, whether a key was claimed, whether a
state attribute moved, whether a message landed inside a region that already
existed.

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
alike and they behave in opposite ways: a combobox keeps DOM focus in the text
field and points at the active option with `aria-activedescendant`, while a menu
moves real focus onto the item. Mixing the two models up produces a widget that
announces one thing and behaves as another, and it is the single most common
defect in a hand rolled dropdown.

Three pieces of logic are pulled out of the components into modules with no
React and no DOM in them, because they are the parts with edge cases worth
enumerating:

- `src/a11y/roving.ts`, the roving tabindex arithmetic. Tested over every
  combination of set size, current position, key, orientation and wrap setting
  up to eight items, with the invariant that the result is either null or
  inside the set. The null return is the point: a composite widget that treats
  every keydown as its own is how a page loses its browser shortcuts.
- `src/a11y/focusable.ts`, what is in the tab order and where Tab goes next
  inside a contained region. A focus trap that is wrong is worse than no dialog
  at all, so the cases are enumerated rather than clicked through.
- `src/a11y/live.ts`, live region politeness.

## Examples

Each directory holds `Fail.tsx` and `Pass.tsx`. The failing versions are
written the way the defect actually arrives: styled, plausible, and passing a
visual review.

- `examples/dialog/` overlay with no role, focus never moved in, Tab walking out, Escape dead, a `div` for the close control
- `examples/disclosure/` a `div` with a click handler, and a region collapsed to zero height so the link inside is invisible and still tabbable
- `examples/tabs/` three `div` elements, each its own tab stop, arrows doing nothing, selection carried by a class name
- `examples/combobox/` a text field and a `ul`, no roles, no `aria-expanded`, mouse only selection
- `examples/menu-button/` a button revealing a `div` of links, focus never entering, Escape dead
- `examples/toast/` a `role="alert"` created in the same commit as its message, which takes focus and removes itself on a timer

`examples/README.md` says what each pair is for and why the audits do not use
the corrected markup's own selectors.

The toast pair is the one to read first. It passes every static check, because
the element it renders does carry a live region role. The defect is *when* the
element appeared: a region created and populated in the same commit is, to
several screen reader and browser pairings, a new element that happens to have
`role="status"`, and it goes unannounced.

## Verifying

```
npm install
npm test
npm run verify
```

`npm test` type checks the whole repository with `tsc`, then runs the suites in
`test/`. There are four kinds:

1. Unit suites over the pure modules (`test/roving.test.mjs`,
   `test/focusable.test.mjs`, `test/live.test.mjs`, `test/name.test.mjs`).
2. A suite per component, which runs that component's audits against both
   halves of its pair and then asserts the things the audits do not cover.
3. `test/pairs.test.mjs`, the cross-check over the whole catalogue: every audit
   passes on the corrected example, every audit fails on the failing one, and
   every audit fails against an empty page, so nothing passes by looking for
   something and finding nothing.
4. `tools/verify.mjs`, run by `npm run verify`, which checks the repository
   holds together: every component names its pattern, every component uses the
   pure module its logic belongs in, every audit states its limits, every
   example comes as a pair, every test file is named in the test script, and
   the numbers quoted in this README are the numbers the code produces.

That last one is there because `node --test` did not accept glob patterns
before Node 21, so the test script has to name its files, which means a new
test file can be added and silently never run.

CI runs all of it on Node 18, 20 and 22.

## What this does not prove

`docs/01-limits.md` is the honest version and is worth more than the test count
above. The short form:

- **A component cannot be accessible on its own.** Contrast, visible focus,
  target size, reflow at 320 pixels and at 400 percent zoom, reduced motion,
  and whether the label text means anything are all decided after the component
  leaves here.
- **The dialog contains Tab and does not make the rest of the page inert.**
  `aria-modal` is a promise, not an enforcement, and it does nothing about a
  screen reader virtual cursor, which does not use Tab. If you can use the
  native `dialog` element, use it.
- **jsdom is not a browser.** Tab does not move focus in it, a key press on a
  button does not produce a click, `inert` is not implemented, and whether a
  live region is announced cannot be read out of the DOM at all. Each audit
  that is affected says so in its own `doesNotProve` field, and
  `docs/01-limits.md` lists what a real browser run and a screen reader pass
  would add.
- **Some of this is a choice, not a requirement.** Automatic against manual tab
  activation, which combobox model, whether a disabled menu item is skipped,
  and what an auto dismissing toast owes the reader. `docs/02-patterns.md` sets
  out each one and says which way this repository went and why.

## Licence

MIT. No attribution required.
