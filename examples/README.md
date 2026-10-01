# The failing and corrected pairs

Every pattern in this repository comes as two components: `Fail.tsx`, the
version that gets shipped, and `Pass.tsx`, the same requirement met properly.

They are not here as illustrations. The test suite mounts both and runs the
same behavioural audits over each one, and it requires that every audit passes
on the corrected version and fails on the failing one. A check that has never
been seen to catch anything is a check nobody should trust, so that second half
is enforced rather than assumed: see `test/pairs.test.mjs`.

The failing versions are written the way the defect actually arrives. None of
them is lazy, none of them is obviously broken, and every one of them would
pass a visual review and most of them would pass a code review:

| Pair | The defect that gets shipped |
|---|---|
| `dialog/` | A styled overlay with no `role`, focus left on the trigger, Tab walking out into the page, Escape doing nothing, and a `div` for the close control. |
| `disclosure/` | A `div` with a click handler and a rotating chevron, and a region collapsed to a height of zero, so the link inside it is invisible and still in the tab order. |
| `tabs/` | Three `div` elements with click handlers, each with `tabIndex` zero, so a three tab strip is three tab stops and a twelve tab strip is twelve. |
| `combobox/` | A text field with a filtered `ul` under it. No combobox role, no `aria-expanded`, and selection by mouse only. |
| `menu-button/` | A button that reveals a `div` of links. No `aria-haspopup`, no focus moved into the menu, and no Escape. |
| `toast/` | A `role="alert"` element created in the same commit as its message, so there was no region for the browser to observe a change to. It also takes focus, auto dismisses, and the close control is an unlabelled glyph. |

The toast pair is the one worth reading first. It passes every static check,
because the element it renders does carry a live region role. The defect is
when the element appeared, which a scanner cannot see and a code reviewer
reading the diff will not notice.

## Why the audits do not use the corrected selectors

The failing version has no roles, so the audits cannot find anything by role
without only ever being able to describe the good version. Each pair declares
in `test/_fixtures.mjs` the selectors that reach the same parts in both halves,
and the audits are written against those.
