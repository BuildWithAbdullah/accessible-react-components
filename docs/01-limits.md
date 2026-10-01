# What this repository does not prove

Read this before using anything here, and read it before believing the test
count on the front page. Thirty three behavioural audits over six patterns is a
real amount of checking and it is nowhere near a claim of accessibility.

## A component cannot be accessible on its own

Every one of these components is a fragment that ends up inside somebody
else's page, and most of the ways it can fail are decided after it leaves
here.

- **Contrast and visible focus.** These components ship almost no CSS. Whether
  the focus ring is visible against your background, whether the disabled menu
  item meets 4.5 to 1, and whether the toast is readable at all are decisions
  made in your stylesheet. WCAG 1.4.3, 1.4.11 and 2.4.7 are not addressed here
  in any way.
- **Target size.** Nothing here sets a minimum hit area. WCAG 2.5.8 is yours.
- **Reflow and zoom.** A tab strip that works at 1440 pixels and becomes a
  horizontal scroller at 320, or at 400 percent zoom, fails 1.4.10, and the
  component cannot tell.
- **Reduced motion.** There is no animation here, which is the easy way to
  comply. The moment a consumer adds one, 2.3.3 becomes theirs.
- **Reading and focus order in the page.** A roving tabindex makes a tab list
  one stop. Where that stop sits relative to the rest of the page is a DOM
  order question, and a positive tabindex anywhere else on the page can
  reorder the whole document around it.
- **Names that mean something.** The audits check that a control has an
  accessible name. Whether "Actions" tells a user what the menu does is a copy
  decision, and an audit cannot have an opinion about it.

## The page behind the modal

The dialog here contains Tab and it does not make the rest of the page inert.
It sets `aria-modal="true"`, which is a promise rather than an enforcement: a
browser or screen reader that does not honour it will let a virtual cursor read
straight through to the content behind the overlay, and Tab containment does
nothing about that, because the virtual cursor does not use Tab.

If you can use the native `dialog` element, use it. The browser gives you focus
containment, inertness of the rest of the page, the top layer, and Escape, none
of which you then have to keep correct yourself. The component in this
repository exists for the cases where you cannot: a design system that needs
the open state in React state and the markup under its own control, or a
support target where `showModal` and `inert` are not both available. That is a
narrower reason than most design systems give themselves.

## What a headless DOM cannot see

The tests run in jsdom, and jsdom is not a browser. Four things follow, and
each audit that is affected says so in its own `doesNotProve` field.

- **Tab does not move focus in jsdom.** So the containment audit checks that
  the dialog claims the Tab key and names a target inside itself, which is the
  mechanism, not the outcome. In a real browser the outcome also depends on the
  layout order and on anything else listening for the key.
- **A key press on a button does not produce a click in jsdom.** Browsers
  synthesise one. So where a pattern relies on native button activation, the
  audit checks the element type and says that is what it checked.
- **`inert` is not implemented.** The focusable module agrees with the
  attribute, which is not the same as the attribute working.
- **Announcement is not observable at all.** Whether a given screen reader and
  browser pair speaks a text change in a live region cannot be read out of the
  DOM. The toast audits check the conditions that make announcement possible,
  which is the part that is in the author's hands. The only way to know whether
  it is announced is to listen to it, in each pairing you support.

## Why this repository has a dependency and the others do not

The other pattern repositories on this profile deliberately have no
dependencies: they check static artefacts, and a static checker that needs a
browser engine has been overbuilt. This one takes on jsdom and React, because a
React component cannot be exercised by reading its source, and a keyboard
contract that is described rather than run is not a contract. The decision is
that the dependency buys a real test of behaviour, and that the alternative was
a repository full of claims.

The arithmetic that can be pulled out of the DOM has been pulled out of the
DOM anyway: `src/a11y/roving.ts`, `src/a11y/focusable.ts` and
`src/a11y/live.ts` have no React in them and are tested on their own, including
exhaustively over every size, position and key combination for the roving
tabindex.

## What would make this stronger

Named honestly, because the gap matters more than the list of what is here.

- A real browser run, under Playwright, for the things jsdom cannot see: Tab
  actually moving, focus visibility, native activation.
- An axe-core pass over each rendered example, which would cover the static
  side the sibling repositories cover and this one does not.
- A screen reader pass, written up per pairing, which no amount of automation
  replaces.
