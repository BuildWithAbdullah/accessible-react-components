# The finding catalogue

An audit is a check. A finding is a reason. `dialog-role-and-name` is one
audit and it can fail for three different reasons with three different next
actions, so every failure in this repository names the reason and not just the
check. The catalogue itself is `audit/findings.mjs`. This is the same list in
reading order, with where each entry is driven from.

**Reached by** says which of the two routes exercises a finding.

- **pair** means one of the six example pairs reaches it. A pair is a whole
  plausible component, so it reaches whichever reason its own defect happens to
  be and nothing else in the same audit.
- **case** means it is reached only by a constructed case in `test/_cases.mjs`,
  listed in `test/_case-table.mjs`, and the audit named in brackets is the one
  that reports it.

27 of the 70 findings are reached by a pair. The rest were branches
nothing had ever run, and the defects in docs/04-defects.md came out of writing
the cases that reach them.

`tools/verify.mjs` asserts the correspondence in both directions: nothing is
catalogued that neither route drives, and nothing is driven that is not
catalogued.

## Any pattern

| Finding | Severity | Reached by | Next action |
|---|---|---|---|
| `STRUCT-PART-MISSING` | critical | pair | Render the part, or correct the selector the pair declares for it in test/_fixtures.mjs. |
| `REF-ABSENT` | serious | pair | Set the attribute to the id of the element it is meant to name. |
| `REF-DANGLING` | serious | case (disclosure-trigger-controls-the-region) | Point the attribute at an element that exists, and generate the id rather than writing it twice. |
| `NAME-ABSENT` | serious | pair | Give it a name from its own content, from aria-labelledby pointing at visible text, or from aria-label where there is no visible text to point at. |

## Dialog

| Finding | Severity | Reached by | Next action |
|---|---|---|---|
| `DLG-NO-DIALOG-ROLE` | critical | pair | Put role="dialog" on the panel element. |
| `DLG-NOT-MODAL` | serious | case (dialog-role-and-name) | Add aria-modal="true", and read LIMIT-MODAL-IS-NOT-INERT before believing it does anything on its own. |
| `DLG-FOCUS-NOT-MOVED-IN` | critical | pair | On open, move focus to the panel, its first control, or its primary action. |
| `DLG-NOTHING-TABBABLE` | critical | case (dialog-tab-is-contained) | Give the dialog at least one focusable control, which in practice means the close control. |
| `DLG-TAB-NOT-CLAIMED-FORWARD` | serious | pair | Handle Tab on the last tabbable element and send focus to the first. |
| `DLG-TAB-ESCAPES-FORWARD` | serious | case (dialog-tab-is-contained) | Correct the element the forward wrap targets. It has to be inside the panel and tabbable at the time. |
| `DLG-TAB-NOT-CLAIMED-BACKWARD` | serious | case (dialog-tab-is-contained) | Handle Tab with shiftKey on the first tabbable element and send focus to the last. |
| `DLG-TAB-ESCAPES-BACKWARD` | serious | case (dialog-tab-is-contained) | Correct the element the backward wrap targets. |
| `DLG-ESCAPE-DEAD` | serious | pair | Close on Escape from anywhere inside the dialog. |
| `DLG-FOCUS-NOT-RESTORED` | serious | pair | Record the active element on open and focus it again on close, with a named fallback for when it is gone. |
| `DLG-CLOSE-NOT-A-BUTTON` | critical | pair | Make the close control a button element. |

## Disclosure

| Finding | Severity | Reached by | Next action |
|---|---|---|---|
| `DSC-TRIGGER-NOT-A-BUTTON` | critical | pair | Use a button element. If it has to stay a div, role="button", tabindex="0" and handlers for Enter and Space are all three required. |
| `DSC-COLLAPSED-STATE-NOT-EXPOSED` | serious | pair | Render aria-expanded on the trigger from the open state, starting at false. |
| `DSC-EXPANDED-STATE-NOT-UPDATED` | serious | case (disclosure-expanded-state-is-exposed) | Derive the attribute from state on every render rather than setting it once. |
| `DSC-COLLAPSED-REGION-TABBABLE` | serious | pair | Use the hidden attribute, or display none, rather than a zero height or a clip rectangle. |

## Tabs

| Finding | Severity | Reached by | Next action |
|---|---|---|---|
| `TAB-NO-TABLIST` | serious | pair | Put role="tablist" on the container. |
| `TAB-ITEMS-NOT-TABS` | critical | case (tabs-roles) | Put role="tab" on every item in the strip, and nothing else inside the tablist. |
| `TAB-NO-TABPANEL` | serious | case (tabs-roles) | Put role="tabpanel" on the content container. |
| `TAB-MULTIPLE-TAB-STOPS` | moderate | pair | Use a roving tabindex: tabindex="0" on the selected tab and tabindex="-1" on the rest. |
| `TAB-NO-TAB-STOP` | critical | case (tabs-are-one-tab-stop) | Keep exactly one tab stop, on the selected tab. |
| `TAB-SELECTION-NOT-EXPOSED` | critical | pair | Render aria-selected on every tab from the selected index. |
| `TAB-ARROW-DOES-NOT-MOVE-SELECTION` | critical | case (tabs-arrow-keys-move-selection) | Handle ArrowRight and ArrowLeft on the tablist. |
| `TAB-FOCUS-DOES-NOT-FOLLOW-SELECTION` | serious | case (tabs-arrow-keys-move-selection) | Move focus with the selection, or switch to manual activation and select on Enter. |
| `TAB-ARROW-DOES-NOT-RETURN` | serious | case (tabs-arrow-keys-move-selection) | Handle both directions in the same key handler rather than in two. |
| `TAB-END-DOES-NOT-SELECT-LAST` | moderate | case (tabs-home-and-end) | Handle End on the tablist in the same handler as the arrows, so the two cannot drift apart. |
| `TAB-HOME-DOES-NOT-SELECT-FIRST` | moderate | case (tabs-home-and-end) | Handle Home on the tablist alongside End, and test both rather than assuming the pair was written together. |
| `TAB-PANEL-LABELLED-BY-NON-TAB` | moderate | case (tabs-panel-is-named-by-its-tab) | Point the panel at the id of its tab. |
| `TAB-PANEL-LABELLED-BY-WRONG-TAB` | serious | case (tabs-panel-is-named-by-its-tab) | Derive the labelled by id from the selected index. |
| `TAB-TAB-CONTROLS-WRONG-PANEL` | serious | case (tabs-panel-is-named-by-its-tab) | Derive both ids from the same index. |

## Combobox

| Finding | Severity | Reached by | Next action |
|---|---|---|---|
| `CMB-INPUT-NOT-COMBOBOX` | critical | pair | Put role="combobox" on the input. |
| `CMB-NO-LISTBOX` | critical | case (combobox-roles) | Put role="listbox" on the popup container. |
| `CMB-NO-OPTIONS` | critical | case (combobox-roles) | Put role="option" on every row. |
| `CMB-CLOSED-STATE-NOT-EXPOSED` | serious | pair | Render aria-expanded on the input from the open state, starting at false. |
| `CMB-OPEN-STATE-NOT-EXPOSED` | serious | case (combobox-expanded-state-is-exposed) | Derive aria-expanded from state on every render. |
| `CMB-NO-ACTIVEDESCENDANT` | critical | pair | Set aria-activedescendant on the input to the id of the active option. |
| `CMB-ACTIVEDESCENDANT-NOT-AN-OPTION` | serious | case (combobox-arrow-keys-move-the-active-option) | Point it at the option element, not at a wrapper or a row div. |
| `CMB-ACTIVE-OPTION-NOT-SELECTED` | moderate | pair | Set aria-selected on the active option and clear it on the others. |
| `CMB-ACTIVEDESCENDANT-DOES-NOT-ADVANCE` | critical | case (combobox-arrow-keys-move-the-active-option) | Advance the active index on each key press and clamp or wrap at the end. |
| `CMB-FOCUS-LEAVES-THE-INPUT` | critical | case (combobox-focus-stays-in-the-input) | Keep focus in the input and move aria-activedescendant, or commit to the focus model and stop calling it a combobox. |
| `CMB-ENTER-DOES-NOT-COMMIT` | critical | case (combobox-enter-commits-the-active-option) | Commit the active option on Enter. |
| `CMB-LIST-STAYS-OPEN-AFTER-COMMIT` | moderate | case (combobox-enter-commits-the-active-option) | Close the list as part of committing. |
| `CMB-ESCAPE-CLEARS-THE-FIELD` | serious | case (combobox-escape-closes-and-keeps-what-was-typed) | On Escape, close the list and leave the value alone. |
| `CMB-ESCAPE-DOES-NOT-CLOSE` | serious | pair | Close on Escape, and call preventDefault only when the list was open, so a closed combobox inside a dialog does not swallow the key the dialog needs. |
| `CMB-OPTIONS-STILL-EXPOSED-AFTER-ESCAPE` | serious | case (combobox-escape-closes-and-keeps-what-was-typed) | Remove the options, or use the hidden attribute, rather than making them invisible. |

## Menu button

| Finding | Severity | Reached by | Next action |
|---|---|---|---|
| `MNU-NO-HASPOPUP` | serious | pair | Add aria-haspopup="menu" to the button. |
| `MNU-NO-EXPANDED` | serious | case (menu-button-roles) | Render aria-expanded on the button from the open state. |
| `MNU-NO-MENU-ROLE` | critical | case (menu-button-roles) | Put role="menu" on the popup, or stop calling it a menu and use a navigation list. |
| `MNU-NO-MENUITEMS` | critical | case (menu-button-roles) | Put role="menuitem" on each entry. |
| `MNU-ARROWDOWN-DOES-NOT-OPEN` | critical | pair | Open on ArrowDown as well as on click and on Enter. |
| `MNU-ARROWDOWN-DOES-NOT-FOCUS-FIRST` | critical | case (menu-button-down-arrow-opens-and-focuses-the-first-item) | Focus the first item as part of opening. |
| `MNU-ARROW-DOES-NOT-MOVE-FOCUS` | critical | case (menu-arrow-keys-move-focus-between-items) | Move focus to the next item on ArrowDown and the previous on ArrowUp. |
| `MNU-END-DOES-NOT-REACH-LAST` | moderate | case (menu-arrow-keys-move-focus-between-items) | Handle End in the item key handler alongside the arrows, so the two cannot drift apart. |
| `MNU-HOME-DOES-NOT-REACH-FIRST` | moderate | case (menu-arrow-keys-move-focus-between-items) | Handle Home in the item key handler alongside End, and test both rather than assuming the pair was written together. |
| `MNU-ESCAPE-DOES-NOT-CLOSE` | serious | case (menu-escape-closes-and-returns-focus) | Close on Escape, handled on the items rather than on the button, because that is where focus is while the menu is open. |
| `MNU-ESCAPE-DOES-NOT-RETURN-FOCUS` | serious | case (menu-escape-closes-and-returns-focus) | Focus the button again as part of closing. |
| `MNU-TAB-LEAVES-MENU-OPEN` | moderate | case (menu-tab-closes-the-menu) | Close the menu on Tab and let the browser move on. |
| `MNU-TYPEAHEAD-DOES-NOT-JUMP` | moderate | case (menu-typeahead-jumps-by-first-letter) | Handle a single printable character and search forward from the current item. |

## Toast region

| Finding | Severity | Reached by | Next action |
|---|---|---|---|
| `TST-NO-REGION-BEFORE-MESSAGE` | critical | pair | Render an empty region with its live attributes on mount and put messages into it. |
| `TST-MESSAGE-IN-A-NEW-REGION` | critical | case (toast-message-lands-in-the-existing-region) | Keep the region mounted and change its contents. |
| `TST-MESSAGE-NEVER-APPEARED` | critical | case (toast-message-lands-in-the-existing-region) | Check that the action is wired to the state the message renders from, before looking at anything to do with regions or roles. |
| `TST-MESSAGE-NOT-IN-A-LIVE-REGION` | critical | case (toast-is-polite-unless-it-is-urgent) | Put the message inside the region rather than beside it. |
| `TST-STEALS-FOCUS` | serious | pair | Announce through the live region and leave focus alone. Move focus only for an error that blocks what the user was doing, and then onto the field. |
| `TST-CONFIRMATION-IS-ASSERTIVE` | moderate | pair | Use role="status" or aria-live="polite" for anything that is not urgent. |
| `TST-ATOMIC-ON-AN-ACCUMULATING-REGION` | serious | pair | Put aria-atomic="true" on each message and leave it off the region. See src/a11y/live.ts, which separates the two. |
| `TST-DISMISS-NOT-A-BUTTON` | serious | case (toast-dismiss-control-has-an-accessible-name) | Make it a button element with a name. |
| `TST-REMOVED-ON-A-TIMER` | serious | pair | Leave it until it is dismissed, or keep the same information somewhere that persists. |
