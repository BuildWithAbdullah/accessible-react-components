# Defects found in this repository

Every one of these shipped. Each was reproduced by a test before it was
fixed, and each of those tests is still in the suite, so the entry can be
checked rather than taken on trust.

They are here because a pattern library whose defect history is invisible
asks to be trusted, and one that prints the history asks to be read. The
second is the better offer.

## The structural change that found them

Splitting the catalogue by reason rather than by check. There were 33
behavioural audits; the reasons they can fail for number 70, and the six
example pairs reached only 27 of those. The other 43 were branches nothing
had ever run. Writing a constructed case for each of them, in
`test/_cases.mjs`, is what produced this list, and **four of the five were in
code the corrected examples run**, which is the worst place for a defect in a
repository whose corrected examples are the thing being offered.

## 1. The roving arithmetic handed Home and End to every caller

`src/a11y/roving.ts`, used by `src/components/Combobox.tsx`.

`nextIndex` returned `0` for Home and `count - 1` for End unconditionally.
The combobox routes every key it does not handle itself through that
function and calls `preventDefault` whenever the result is not null, so Home
and End were swallowed: the caret did not move, the list opened, and the
first or last option became active.

A combobox keeps DOM focus in the text field, and that is the entire reason
the pattern exists. In a text field Home and End are editing keys. So the
defect took two keys off the user in the one pattern whose point is that
typing keeps working, and it did so through the module whose own
documentation is about not claiming keys the page needed. That module returns
null correctly for the cross axis arrows and did not for Home and End.

Fixed by making them opt in, with `homeAndEnd` defaulting to true because it
is right for tabs, menus, radio groups and listboxes, and the combobox
passing false. The exhaustive unit test over set size, position, key,
orientation and wrap now also asserts that turning the option off changes
nothing else, and `test/combobox.test.mjs` asserts that both keys reach the
field.

## 2. aria-atomic sat on the region that collects the messages

`src/a11y/live.ts` and `src/components/ToastRegion.tsx`.

`liveRegionProps` returned `aria-atomic="true"` as part of the region props,
and the component put it on the container that holds the list of messages.

`aria-atomic="true"` means: when anything inside this element changes,
present all of it. On one message that is what you want, so the message is
read as a unit instead of word by word as it streams in. On a container that
keeps several, it means the second notification re-reads the first and the
third re-reads both. It is the commonest reason a toast stack becomes
unbearable after the second message, and it gets copied in from snippets that
only ever showed one.

Fixed by splitting the two: `liveRegionProps` for the region,
`liveMessageProps` for a message. There is a new finding,
`TST-ATOMIC-ON-AN-ACCUMULATING-REGION`, a new audit that reports it, and the
shipped failing example now carries the defect so the audit is driven by a
pair rather than only by a case.

## 3. The accessible name was computed from a hidden image

`audit/name.mjs`.

The computation filters `aria-hidden` and `hidden` subtrees out of the text
content, and then fell through to `querySelector('img[alt]')`, which applies
no filtering at all. So a button whose only content was
`<img alt="Close" aria-hidden="true">` was reported as named "Close", where a
screen reader reports no name at all.

The module's own documentation says the case it is reliable for is an icon
button whose glyph is hidden from assistive technology. It was reliable for
that case when the glyph was a `span`, because `visibleText` filters those,
and wrong when the glyph was an `img`, which is at least as common. The
direction is the bad one: a name reported where there is none is a false
negative on `NAME-ABSENT`, and a false negative is the kind of defect that
makes a suite worth less than no suite.

Fixed by checking every ancestor up to the element being named before letting
an image contribute. `test/limits.test.mjs` asserts both glyph shapes compute
to nothing.

## 4. The timer audit passed the example it was written for

`audit/toast.mjs`, `toast-does-not-remove-itself-on-a-timer`.

The audit produces a message, waits for the window the pair declares, and
reports a finding if the message has gone. The window defaults to 120
milliseconds. The shipped failing example removes its message after 2000.

So against that component as it actually ships, the audit written to catch a
timed removal reported nothing. The suite was green only because the pair
passes `autoDismissMs: 25` as a prop, which is shorter than the window: the
audit was being run against a component configured so that the defect fell
inside what the audit can see, and nothing said so.

A suite cannot sit for four seconds per example, so this is not fixable by
waiting longer. It is fixed by being stated and then asserted.
`LIMIT-TIMER-WINDOW` now records that a failure here is real and a pass is
worth nothing, and `test/limits.test.mjs` constructs a toast with a two
second timer and one with no timer at all and asserts that **both pass**, so
the verdict is shown not to distinguish them.

## 5. The headline pair did not demonstrate what the README said it did

`examples/toast/`, and the paragraph about it in the README.

The README called the toast pair the one to read first, because the defect is
not the roles but *when* the element appeared: a region created in the same
commit as its message is, to several screen reader and browser pairings, a
new element that happens to have `role="status"`.

Two audits exist for that distinction. `toast-region-exists-before-the-message`
checks there was a region beforehand, and
`toast-message-lands-in-the-existing-region` checks the message arrived as a
change to it. Against the failing example there is no region at all before the
click, so **both audits report the same finding**, and the second one was a
duplicate of the first on the only input it ever ran against. The more
interesting half, a region that is mounted and empty with the message
delivered into a fresh one beside it, had never been exercised: that is
`TST-MESSAGE-IN-A-NEW-REGION`, and it was one of the 43 unreached findings.

Fixed by constructing that case, and by correcting the README to say which
half the pair reaches and which half the case does.

## Before this list existed

The repository was filled on its own before the finding catalogue was added,
and no defect log was kept for that work, so this list starts where the
catalogue does rather than claiming to be complete from the beginning.

The one observation worth carrying forward from then: the toast pair passes
every static check, because the element it renders does carry a live region
role. That is why this repository mounts components and presses keys rather
than reading their source, and it is the reason the audits exist in the shape
they do.
