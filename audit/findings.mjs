/**
 * The finding catalogue.
 *
 * An audit is a check. A finding is a reason. The two are not the same thing,
 * and the difference is the whole point of this file.
 *
 * `dialog-role-and-name` is one audit. It can fail because the overlay has no
 * role at all, because it has the role but not aria-modal, or because it has
 * both and no accessible name. Those are three different defects with three
 * different next actions, and a reader who is told only that the audit failed
 * has to go and read the audit to find out which one they have. So every
 * failure in this repository names a finding, and this file is the list of
 * them: one entry per reason, never one per check.
 *
 * The practical consequence, and the reason the catalogue is worth the work:
 * the six example pairs reach fewer than half of these. Every finding the
 * pairs do not reach is a branch that nothing has ever run, and
 * test/findings.test.mjs builds a fixture for each one. See
 * docs/03-findings.md for which findings the pairs reach and which only a
 * fixture does.
 *
 * `severity` is about what it costs the person using the component, not about
 * how hard it is to fix:
 *
 *   critical  the pattern is unusable by the route it is meant to be used by
 *   serious   usable, but the user is told the wrong thing or loses their place
 *   moderate  usable and correctly announced, with a requirement unmet
 */

/** Findings that belong to no single pattern, because the reason is the same wherever it occurs. */
const SHARED = [
  {
    id: 'STRUCT-PART-MISSING',
    component: 'any',
    severity: 'critical',
    reason:
      'The audit looked for a part of the widget the page does not render at all, so there is nothing to judge.',
    nextAction:
      'Render the part, or correct the selector the pair declares for it in test/_fixtures.mjs.',
  },
  {
    id: 'REF-ABSENT',
    component: 'any',
    severity: 'serious',
    reason:
      'An attribute whose value has to be the id of another element is not set, so the relationship the pattern depends on is not expressed.',
    nextAction: 'Set the attribute to the id of the element it is meant to name.',
  },
  {
    id: 'REF-DANGLING',
    component: 'any',
    severity: 'serious',
    reason:
      'An attribute names an id that is not in the document, so the relationship resolves to nothing. This is what a copied id or a renamed element leaves behind, and it reads as correct in the markup.',
    nextAction:
      'Point the attribute at an element that exists, and generate the id rather than writing it twice.',
  },
  {
    id: 'NAME-ABSENT',
    component: 'any',
    severity: 'serious',
    reason:
      'An element the pattern requires to be named computes to no accessible name, so it is announced by its role alone: "button", "dialog", "edit text".',
    nextAction:
      'Give it a name from its own content, from aria-labelledby pointing at visible text, or from aria-label where there is no visible text to point at.',
  },
];

const DIALOG = [
  {
    id: 'DLG-NO-DIALOG-ROLE',
    severity: 'critical',
    reason:
      'Opening the widget produced no element with role="dialog", so nothing tells assistive technology that a dialog opened. The overlay is a styled div.',
    nextAction: 'Put role="dialog" on the panel element.',
  },
  {
    id: 'DLG-NOT-MODAL',
    severity: 'serious',
    reason:
      'The dialog does not carry aria-modal="true", so a screen reader is not told that the rest of the page is out of scope while it is open.',
    nextAction:
      'Add aria-modal="true", and read LIMIT-MODAL-IS-NOT-INERT before believing it does anything on its own.',
  },
  {
    id: 'DLG-FOCUS-NOT-MOVED-IN',
    severity: 'critical',
    reason:
      'Opening left focus outside the panel, usually on the trigger behind the overlay, so a keyboard user is parked behind something they cannot see past.',
    nextAction:
      'On open, move focus to the panel, its first control, or its primary action.',
  },
  {
    id: 'DLG-NOTHING-TABBABLE',
    severity: 'critical',
    reason:
      'There is nothing tabbable inside the panel, so there is nowhere for focus to be contained and no way to reach the close control.',
    nextAction:
      'Give the dialog at least one focusable control, which in practice means the close control.',
  },
  {
    id: 'DLG-TAB-NOT-CLAIMED-FORWARD',
    severity: 'serious',
    reason:
      'Tab on the last control in the dialog was not handled, so the browser moves focus to whatever follows the dialog in the document and the user is reading the page behind the overlay.',
    nextAction: 'Handle Tab on the last tabbable element and send focus to the first.',
  },
  {
    id: 'DLG-TAB-ESCAPES-FORWARD',
    severity: 'serious',
    reason:
      'Tab was handled, so somebody wrote a trap, but focus ended up outside the panel anyway. A half correct trap is harder to spot than none, because the key is visibly doing something.',
    nextAction:
      'Correct the element the forward wrap targets. It has to be inside the panel and tabbable at the time.',
  },
  {
    id: 'DLG-TAB-NOT-CLAIMED-BACKWARD',
    severity: 'serious',
    reason:
      'Shift+Tab on the first control was not handled. This is the commonest half of a half written trap, because forward containment is the one that gets tested by hand.',
    nextAction: 'Handle Tab with shiftKey on the first tabbable element and send focus to the last.',
  },
  {
    id: 'DLG-TAB-ESCAPES-BACKWARD',
    severity: 'serious',
    reason:
      'Shift+Tab was handled and focus still ended up outside the panel.',
    nextAction: 'Correct the element the backward wrap targets.',
  },
  {
    id: 'DLG-ESCAPE-DEAD',
    severity: 'serious',
    reason:
      'Escape did not close the dialog, so the only way out is to find the close control, which is the one thing a contained focus ring makes harder.',
    nextAction: 'Close on Escape from anywhere inside the dialog.',
  },
  {
    id: 'DLG-FOCUS-NOT-RESTORED',
    severity: 'serious',
    reason:
      'Closing the dialog did not put focus back on the control that opened it, so the user resumes at the top of the document rather than where they were.',
    nextAction:
      'Record the active element on open and focus it again on close, with a named fallback for when it is gone.',
  },
  {
    id: 'DLG-CLOSE-NOT-A-BUTTON',
    severity: 'critical',
    reason:
      'The close control is not a button element, so it is not in the tab order and the browser does not give it Enter and Space. Inside a focus trap that leaves no way out at all.',
    nextAction: 'Make the close control a button element.',
  },
];

const DISCLOSURE = [
  {
    id: 'DSC-TRIGGER-NOT-A-BUTTON',
    severity: 'critical',
    reason:
      'The trigger is neither a button nor a complete stand in for one, so it is not reachable by keyboard and is not announced as something that can be pressed.',
    nextAction:
      'Use a button element. If it has to stay a div, role="button", tabindex="0" and handlers for Enter and Space are all three required.',
  },
  {
    id: 'DSC-COLLAPSED-STATE-NOT-EXPOSED',
    severity: 'serious',
    reason:
      'While collapsed the trigger does not report aria-expanded="false", so there is nothing to say the content is hidden rather than absent.',
    nextAction: 'Render aria-expanded on the trigger from the open state, starting at false.',
  },
  {
    id: 'DSC-EXPANDED-STATE-NOT-UPDATED',
    severity: 'serious',
    reason:
      'The attribute is there when collapsed and does not become true when expanded, so the state is announced once and then lies. This is the version that passes a quick inspection of the closed markup.',
    nextAction: 'Derive the attribute from state on every render rather than setting it once.',
  },
  {
    id: 'DSC-COLLAPSED-REGION-TABBABLE',
    severity: 'serious',
    reason:
      'While collapsed, controls inside the region are still in the tab order, so a keyboard user tabs into content that is not on screen. Every height or opacity animation introduces this and no visual review catches it.',
    nextAction:
      'Use the hidden attribute, or display none, rather than a zero height or a clip rectangle.',
  },
];

const TABS = [
  {
    id: 'TAB-NO-TABLIST',
    severity: 'serious',
    reason:
      'There is no element with role="tablist", so the strip is announced as whatever its items happen to be rather than as a set of tabs.',
    nextAction: 'Put role="tablist" on the container.',
  },
  {
    id: 'TAB-ITEMS-NOT-TABS',
    severity: 'critical',
    reason:
      'Items are rendered in the strip but not all of them carry role="tab", so the count a screen reader announces does not match what is on screen.',
    nextAction: 'Put role="tab" on every item in the strip, and nothing else inside the tablist.',
  },
  {
    id: 'TAB-NO-TABPANEL',
    severity: 'serious',
    reason:
      'There is no element with role="tabpanel", so the content the selected tab controls is not identified as belonging to it.',
    nextAction: 'Put role="tabpanel" on the content container.',
  },
  {
    id: 'TAB-MULTIPLE-TAB-STOPS',
    severity: 'moderate',
    reason:
      'Every tab is its own tab stop, so tabbing past the component costs one key press per tab. On a nine item strip that is the difference between a component and a detour.',
    nextAction:
      'Use a roving tabindex: tabindex="0" on the selected tab and tabindex="-1" on the rest.',
  },
  {
    id: 'TAB-NO-TAB-STOP',
    severity: 'critical',
    reason:
      'The strip holds no tab stop at all, so the component cannot be reached from the keyboard. This is what a roving tabindex set to -1 everywhere produces, and it looks more correct than the many stop version.',
    nextAction: 'Keep exactly one tab stop, on the selected tab.',
  },
  {
    id: 'TAB-SELECTION-NOT-EXPOSED',
    severity: 'critical',
    reason:
      'No item carries aria-selected="true", so which tab is current is carried by a class name and a colour only.',
    nextAction: 'Render aria-selected on every tab from the selected index.',
  },
  {
    id: 'TAB-ARROW-DOES-NOT-MOVE-SELECTION',
    severity: 'critical',
    reason:
      'The right arrow did not move the selected tab, so the keys the pattern tells users to reach for do nothing.',
    nextAction: 'Handle ArrowRight and ArrowLeft on the tablist.',
  },
  {
    id: 'TAB-FOCUS-DOES-NOT-FOLLOW-SELECTION',
    severity: 'serious',
    reason:
      'Under automatic activation the arrow moved the selection and left focus behind, so the next arrow press operates on a tab the user is no longer on.',
    nextAction:
      'Move focus with the selection, or switch to manual activation and select on Enter.',
  },
  {
    id: 'TAB-ARROW-DOES-NOT-RETURN',
    severity: 'serious',
    reason:
      'The left arrow did not undo what the right arrow did, so the strip can be walked in one direction only.',
    nextAction: 'Handle both directions in the same key handler rather than in two.',
  },
  {
    id: 'TAB-END-DOES-NOT-SELECT-LAST',
    severity: 'moderate',
    reason:
      'End did not select the last tab. On a strip of three this is a shrug; on a strip of twelve it is eleven key presses to reach the end, with the arrow keys the only route left.',
    nextAction:
      'Handle End on the tablist in the same handler as the arrows, so the two cannot drift apart.',
  },
  {
    id: 'TAB-HOME-DOES-NOT-SELECT-FIRST',
    severity: 'moderate',
    reason:
      'Home did not select the first tab. This is the half that gets missed, because End is the one people try when testing by hand and Home looks like its mirror image.',
    nextAction:
      'Handle Home on the tablist alongside End, and test both rather than assuming the pair was written together.',
  },
  {
    id: 'TAB-PANEL-LABELLED-BY-NON-TAB',
    severity: 'moderate',
    reason:
      'The panel aria-labelledby names an element that is not a tab, so a user who moves into the panel is told the wrong thing about where they are.',
    nextAction: 'Point the panel at the id of its tab.',
  },
  {
    id: 'TAB-PANEL-LABELLED-BY-WRONG-TAB',
    severity: 'serious',
    reason:
      'The panel is labelled by a tab that is not the selected one, so the visible content and the announced heading disagree. This is what rendering one panel while labelling it from a fixed id produces.',
    nextAction: 'Derive the labelled by id from the selected index.',
  },
  {
    id: 'TAB-TAB-CONTROLS-WRONG-PANEL',
    severity: 'serious',
    reason:
      'The selected tab aria-controls something other than the panel on screen, so the pair of attributes points in a circle that does not close.',
    nextAction: 'Derive both ids from the same index.',
  },
];

const COMBOBOX = [
  {
    id: 'CMB-INPUT-NOT-COMBOBOX',
    severity: 'critical',
    reason:
      'The text field does not carry role="combobox", so it is announced as a plain edit field and nothing says suggestions are coming.',
    nextAction: 'Put role="combobox" on the input.',
  },
  {
    id: 'CMB-NO-LISTBOX',
    severity: 'critical',
    reason:
      'Typing produced no element with role="listbox", so the suggestions are a styled list that assistive technology has no reason to describe.',
    nextAction: 'Put role="listbox" on the popup container.',
  },
  {
    id: 'CMB-NO-OPTIONS',
    severity: 'critical',
    reason:
      'The listbox contains no element with role="option", so it is announced as an empty list however many rows are visible.',
    nextAction: 'Put role="option" on every row.',
  },
  {
    id: 'CMB-CLOSED-STATE-NOT-EXPOSED',
    severity: 'serious',
    reason:
      'Before typing, the input does not report aria-expanded="false", so there is no baseline for the state to change from.',
    nextAction: 'Render aria-expanded on the input from the open state, starting at false.',
  },
  {
    id: 'CMB-OPEN-STATE-NOT-EXPOSED',
    severity: 'serious',
    reason:
      'With the list showing, the input does not report aria-expanded="true", so a user is never told the suggestions arrived.',
    nextAction: 'Derive aria-expanded from state on every render.',
  },
  {
    id: 'CMB-NO-ACTIVEDESCENDANT',
    severity: 'critical',
    reason:
      'The down arrow set no aria-activedescendant, so the highlighted row is a background colour and nothing else.',
    nextAction:
      'Set aria-activedescendant on the input to the id of the active option.',
  },
  {
    id: 'CMB-ACTIVEDESCENDANT-NOT-AN-OPTION',
    severity: 'serious',
    reason:
      'aria-activedescendant names an element that is not an option, so the virtual cursor is pointed at something with no role to announce.',
    nextAction: 'Point it at the option element, not at a wrapper or a row div.',
  },
  {
    id: 'CMB-ACTIVE-OPTION-NOT-SELECTED',
    severity: 'moderate',
    reason:
      'The active option does not carry aria-selected="true", so in this model nothing marks it as the one Enter will take.',
    nextAction: 'Set aria-selected on the active option and clear it on the others.',
  },
  {
    id: 'CMB-ACTIVEDESCENDANT-DOES-NOT-ADVANCE',
    severity: 'critical',
    reason:
      'A second down arrow did not move the active option, so the list can be entered and not walked. This is what an index that is set rather than incremented produces.',
    nextAction: 'Advance the active index on each key press and clamp or wrap at the end.',
  },
  {
    id: 'CMB-FOCUS-LEAVES-THE-INPUT',
    severity: 'critical',
    reason:
      'Walking the list moved DOM focus out of the text field, which breaks typing and mixes the combobox model up with the menu model. A widget that announces one and behaves as the other is the commonest defect in a hand rolled dropdown.',
    nextAction:
      'Keep focus in the input and move aria-activedescendant, or commit to the focus model and stop calling it a combobox.',
  },
  {
    id: 'CMB-ENTER-DOES-NOT-COMMIT',
    severity: 'critical',
    reason:
      'Enter did not put the active option into the field, so there is a keyboard route into the list and none out of it.',
    nextAction: 'Commit the active option on Enter.',
  },
  {
    id: 'CMB-LIST-STAYS-OPEN-AFTER-COMMIT',
    severity: 'moderate',
    reason:
      'After committing, the input still reports the list as open, so the state and the screen disagree from then on.',
    nextAction: 'Close the list as part of committing.',
  },
  {
    id: 'CMB-ESCAPE-CLEARS-THE-FIELD',
    severity: 'serious',
    reason:
      'Escape threw away what the user typed. Dismissing the suggestions and discarding the input are different things, and the pattern asks for the first.',
    nextAction: 'On Escape, close the list and leave the value alone.',
  },
  {
    id: 'CMB-ESCAPE-DOES-NOT-CLOSE',
    severity: 'serious',
    reason:
      'Escape did not close the list, so there is no way to dismiss the suggestions and see the rest of the form again.',
    nextAction:
      'Close on Escape, and call preventDefault only when the list was open, so a closed combobox inside a dialog does not swallow the key the dialog needs.',
  },
  {
    id: 'CMB-OPTIONS-STILL-EXPOSED-AFTER-ESCAPE',
    severity: 'serious',
    reason:
      'The list reports itself closed and its options are still exposed in the accessibility tree, so a virtual cursor still finds them. This is what hiding a popup with opacity or height produces.',
    nextAction:
      'Remove the options, or use the hidden attribute, rather than making them invisible.',
  },
];

const MENU_BUTTON = [
  {
    id: 'MNU-NO-HASPOPUP',
    severity: 'serious',
    reason:
      'The button does not report aria-haspopup="menu", so nothing says it opens a menu until it has already been pressed.',
    nextAction: 'Add aria-haspopup="menu" to the button.',
  },
  {
    id: 'MNU-NO-EXPANDED',
    severity: 'serious',
    reason:
      'The button has no aria-expanded at all, so the open state is never exposed in either direction.',
    nextAction: 'Render aria-expanded on the button from the open state.',
  },
  {
    id: 'MNU-NO-MENU-ROLE',
    severity: 'critical',
    reason:
      'Opening produced no exposed element with role="menu", so the popup is a div of links.',
    nextAction: 'Put role="menu" on the popup, or stop calling it a menu and use a navigation list.',
  },
  {
    id: 'MNU-NO-MENUITEMS',
    severity: 'critical',
    reason: 'The menu contains no element with role="menuitem", so it is announced as empty.',
    nextAction: 'Put role="menuitem" on each entry.',
  },
  {
    id: 'MNU-ARROWDOWN-DOES-NOT-OPEN',
    severity: 'critical',
    reason:
      'The down arrow on the button did not open the menu, so the pattern cannot be entered by the key that documents it.',
    nextAction: 'Open on ArrowDown as well as on click and on Enter.',
  },
  {
    id: 'MNU-ARROWDOWN-DOES-NOT-FOCUS-FIRST',
    severity: 'critical',
    reason:
      'The menu opened and focus stayed on the button, so a keyboard user is looking at a menu they are not in. This is the menu equivalent of a dialog that never moves focus in.',
    nextAction: 'Focus the first item as part of opening.',
  },
  {
    id: 'MNU-ARROW-DOES-NOT-MOVE-FOCUS',
    severity: 'critical',
    reason:
      'Inside the menu the arrow keys did not move real focus. A menu uses the focus model, not the activedescendant model its neighbour the combobox uses.',
    nextAction: 'Move focus to the next item on ArrowDown and the previous on ArrowUp.',
  },
  {
    id: 'MNU-END-DOES-NOT-REACH-LAST',
    severity: 'moderate',
    reason:
      'End did not move focus to the last item. This costs more in a menu than in a tab strip, because the destructive action is usually the one at the bottom and it is now the furthest away.',
    nextAction:
      'Handle End in the item key handler alongside the arrows, so the two cannot drift apart.',
  },
  {
    id: 'MNU-HOME-DOES-NOT-REACH-FIRST',
    severity: 'moderate',
    reason:
      'Home did not move focus to the first item, so the only way back to the top of a long menu is to hold the up arrow or to close it and open it again.',
    nextAction:
      'Handle Home in the item key handler alongside End, and test both rather than assuming the pair was written together.',
  },
  {
    id: 'MNU-ESCAPE-DOES-NOT-CLOSE',
    severity: 'serious',
    reason:
      'Escape did not close the menu, so the only ways out are to activate something or to tab through every remaining item. Somebody who opened the menu by accident has no way to change their mind.',
    nextAction:
      'Close on Escape, handled on the items rather than on the button, because that is where focus is while the menu is open.',
  },
  {
    id: 'MNU-ESCAPE-DOES-NOT-RETURN-FOCUS',
    severity: 'serious',
    reason:
      'Escape closed the menu and left focus on an item that is no longer there, so focus falls to the body and the user loses their place entirely.',
    nextAction: 'Focus the button again as part of closing.',
  },
  {
    id: 'MNU-TAB-LEAVES-MENU-OPEN',
    severity: 'moderate',
    reason:
      'Tab from inside the menu left it open, so the menu is several tab stops rather than the one its role promises.',
    nextAction: 'Close the menu on Tab and let the browser move on.',
  },
  {
    id: 'MNU-TYPEAHEAD-DOES-NOT-JUMP',
    severity: 'moderate',
    reason:
      'Typing a letter did not move focus to the next item starting with it, so a long menu costs one key press per item.',
    nextAction: 'Handle a single printable character and search forward from the current item.',
  },
];

const TOAST = [
  {
    id: 'TST-NO-REGION-BEFORE-MESSAGE',
    severity: 'critical',
    reason:
      'There is no live region in the document before any message is produced, so there is nothing for the browser to be watching when one arrives.',
    nextAction:
      'Render an empty region with its live attributes on mount and put messages into it.',
  },
  {
    id: 'TST-MESSAGE-IN-A-NEW-REGION',
    severity: 'critical',
    reason:
      'The message is on the page and not inside a region that already existed. This is the defect that passes every static check, because the element that appears does carry a live region role: what is wrong is when it appeared.',
    nextAction: 'Keep the region mounted and change its contents.',
  },
  {
    id: 'TST-MESSAGE-NEVER-APPEARED',
    severity: 'critical',
    reason:
      'The message did not appear anywhere on the page, visually or otherwise. This is reported apart from the region findings because it is not an accessibility defect at all: the feature does not work for anybody, and reading it as a live region problem sends the fix to the wrong place.',
    nextAction:
      'Check that the action is wired to the state the message renders from, before looking at anything to do with regions or roles.',
  },
  {
    id: 'TST-MESSAGE-NOT-IN-A-LIVE-REGION',
    severity: 'critical',
    reason:
      'The message is on the page and not inside any live region, so it is a visual notification only.',
    nextAction: 'Put the message inside the region rather than beside it.',
  },
  {
    id: 'TST-STEALS-FOCUS',
    severity: 'serious',
    reason:
      'Producing the message moved focus, so news the user did not ask for throws away where they were. A keyboard user loses their place in the form they were filling in.',
    nextAction:
      'Announce through the live region and leave focus alone. Move focus only for an error that blocks what the user was doing, and then onto the field.',
  },
  {
    id: 'TST-CONFIRMATION-IS-ASSERTIVE',
    severity: 'moderate',
    reason:
      'An ordinary confirmation sits in an assertive region, so it interrupts whatever the screen reader was in the middle of saying.',
    nextAction: 'Use role="status" or aria-live="polite" for anything that is not urgent.',
  },
  {
    id: 'TST-ATOMIC-ON-AN-ACCUMULATING-REGION',
    severity: 'serious',
    reason:
      'aria-atomic="true" sits on the region that collects the messages rather than on a message. Atomic means "when anything in here changes, present all of it", so the second notification re-reads the first and the third re-reads both. It is the commonest reason a toast stack becomes unbearable after the second message, and it is copied in from snippets that only ever showed one.',
    nextAction:
      'Put aria-atomic="true" on each message and leave it off the region. See src/a11y/live.ts, which separates the two.',
  },
  {
    id: 'TST-DISMISS-NOT-A-BUTTON',
    severity: 'serious',
    reason:
      'The dismiss control is not a button element, so the only way to clear the message is with a pointer.',
    nextAction: 'Make it a button element with a name.',
  },
  {
    id: 'TST-REMOVED-ON-A-TIMER',
    severity: 'serious',
    reason:
      'The message removed itself with no user action, which puts a time limit on reading it. Someone reading at their own pace, or arriving at the region a moment later, finds nothing. WCAG 2.2.1 has no exception that covers a four second toast.',
    nextAction:
      'Leave it until it is dismissed, or keep the same information somewhere that persists.',
  },
];

function withComponent(component, entries) {
  return entries.map((entry) => ({ ...entry, component }));
}

export const FINDINGS = [
  ...SHARED,
  ...withComponent('dialog', DIALOG),
  ...withComponent('disclosure', DISCLOSURE),
  ...withComponent('tabs', TABS),
  ...withComponent('combobox', COMBOBOX),
  ...withComponent('menu-button', MENU_BUTTON),
  ...withComponent('toast', TOAST),
];

export const SEVERITIES = ['critical', 'serious', 'moderate'];

const BY_ID = new Map(FINDINGS.map((finding) => [finding.id, finding]));

export function findingById(id) {
  const found = BY_ID.get(id);
  if (!found) throw new Error(`no finding with id ${id}`);
  return found;
}

export function hasFinding(id) {
  return BY_ID.has(id);
}

export function findingsFor(component) {
  return FINDINGS.filter((finding) => finding.component === component);
}
