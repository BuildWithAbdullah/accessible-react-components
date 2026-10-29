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

## The limits that are asserted rather than described

Everything above is prose, and prose is a caveat a reader can skip. The
entries below are held as data in `audit/limits.mjs`, and
`test/limits.test.mjs` asserts each one by constructing inputs that cover
the combinations of the audit's verdict against the thing the limit says the
verdict is not about.

Where a limit covers four combinations, the verdict carries no information in
either direction: both a pass and a failure occur with the other property
true and with it false. Where it covers two, the implication genuinely runs
one way, and the two cases are the ones that show the other way does not
hold. `tools/verify.mjs` requires every entry here to have a test and a
write-up, so a limit cannot be declared and left unproven.

### `LIMIT-MODAL-IS-NOT-INERT`

**Audit:** `dialog-role-and-name`. **Independent of:** whether the content behind the dialog is actually inert.
**Combinations asserted:** 4.

aria-modal="true" is a promise the author makes to assistive technology. It
does not make the rest of the page inert, and nothing in this repository
checks that anything does.

This is the claim a reader most wants to make from a green dialog suite, and
it is the one that does not follow. The quiet case is the dangerous one: a
dialog that carries aria-modal and leaves the whole page behind it reachable
by a virtual cursor is reported correct here, and that is the commonest
modal defect in the wild. Use the native dialog element if you can, because
the browser enforces what this attribute only declares.

### `LIMIT-CONTAINMENT-IS-NOT-EXPOSURE`

**Audit:** `dialog-tab-is-contained`. **Independent of:** whether the content behind the dialog is hidden from the reading cursor.
**Combinations asserted:** 4.

Containing Tab constrains one way of moving through a page. A screen reader
virtual cursor does not use Tab and is not constrained by anything this
audit sees.

A focus trap is the thing people build and test, and it is not the thing a
screen reader user is affected by. Both halves of the verdict occur with the
background exposed and with it hidden, so the containment result says
nothing either way.

### `LIMIT-TIMER-WINDOW`

**Audit:** `toast-does-not-remove-itself-on-a-timer`. **Independent of:** whether the message is on a timer at all.
**Combinations asserted:** 2.

The audit waits for the window the pair declares and no longer, so it sees a
timer only if the timer is shorter than that window. A test suite cannot sit
for four seconds per example.

A failure here is real: something removed the message with no user action. A
pass is worth nothing, because a toast with a four second timer and a toast
with no timer are both passes. This is why the shipped failing example takes
its dismissal delay as a prop and the pair sets it short: the audit is run
against a component configured so that the defect falls inside the window,
and that is a property of the harness rather than of the component.

### `LIMIT-NAME-IS-A-SUBSET`

**Audit:** `toast-dismiss-control-has-an-accessible-name`. **Independent of:** whether the control actually has an accessible name.
**Combinations asserted:** 2.

audit/name.mjs implements part of the accessible name computation, not all
of it. A name it reports is a name. A name it does not report is not proof
there is none.

It is deliberately asymmetric and the asymmetry is the useful part. The case
it is reliable for is an icon control whose only content is hidden from
assistive technology, which computes to nothing. A control named by a
wrapping label element, which a browser resolves and this does not, is
reported as unnamed, so NAME-ABSENT can be reported against a control that
is in fact named.

### `LIMIT-KEYPRESS-IS-NOT-ACTIVATION`

**Audit:** `dialog-close-control-is-a-button`. **Independent of:** whether the control can actually be operated from the keyboard.
**Combinations asserted:** 2.

jsdom does not synthesise the click a browser generates from Enter or Space
on a button, so this finding is decided by element type and not by trying
the keys.

A div with role="button", tabindex="0" and handlers for both keys is
operable and is still reported. The finding is the right default anyway,
because a button is one thing to get right and the substitute is three, but
it is a finding about markup and should not be read as a finding about
behaviour.
