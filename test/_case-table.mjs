/**
 * The table of constructed cases: one row per finding the six example pairs
 * never reach, naming the finding, the audit that reports it, the markup that
 * gets it there, and the selectors that markup declares.
 *
 * It lives in its own module with no test runner import, because
 * tools/audit-verdicts.mjs reads it too. Importing a file that calls describe
 * and it from a command line tool would run the suite as a side effect and
 * write TAP into the tool's own output.
 */
import * as cases from './_cases.mjs';

const DIALOG = { trigger: '[data-arc-trigger]', panel: '.fx-panel', close: '.fx-close' };
const DISCLOSURE = { trigger: '.fx-trigger', region: '.fx-region' };
const TABS = { items: '[role="tab"], .tab', list: '.fx-tablist' };
const COMBOBOX = { input: 'input[type="text"]' };
const MENU = { trigger: '.fx-menu-button', items: '[role="menuitem"]', typeahead: 'e' };
const TOAST = {
  trigger: '[data-arc-trigger]',
  message: cases.MESSAGE,
  dismiss: '.fx-dismiss',
  timerWindowMs: 40,
};

/** finding, the audit that reports it, the markup that gets it there. */
export const CASES = [
  ['REF-DANGLING', 'disclosure-trigger-controls-the-region', cases.DanglingControls, DISCLOSURE],

  ['DLG-NOT-MODAL', 'dialog-role-and-name', cases.DialogNotModal, DIALOG],
  ['DLG-NOTHING-TABBABLE', 'dialog-tab-is-contained', cases.DialogNothingTabbable, DIALOG],
  ['DLG-TAB-ESCAPES-FORWARD', 'dialog-tab-is-contained', cases.DialogTabEscapesForward, DIALOG],
  [
    'DLG-TAB-NOT-CLAIMED-BACKWARD',
    'dialog-tab-is-contained',
    cases.DialogTabNotClaimedBackward,
    DIALOG,
  ],
  ['DLG-TAB-ESCAPES-BACKWARD', 'dialog-tab-is-contained', cases.DialogTabEscapesBackward, DIALOG],

  [
    'DSC-EXPANDED-STATE-NOT-UPDATED',
    'disclosure-expanded-state-is-exposed',
    cases.DisclosureStateNotUpdated,
    DISCLOSURE,
  ],

  ['TAB-ITEMS-NOT-TABS', 'tabs-roles', cases.TabsItemsNotTabs, TABS],
  ['TAB-NO-TABPANEL', 'tabs-roles', cases.TabsNoPanel, TABS],
  ['TAB-NO-TAB-STOP', 'tabs-are-one-tab-stop', cases.TabsNoTabStop, TABS],
  [
    'TAB-ARROW-DOES-NOT-MOVE-SELECTION',
    'tabs-arrow-keys-move-selection',
    cases.TabsArrowsDead,
    TABS,
  ],
  [
    'TAB-FOCUS-DOES-NOT-FOLLOW-SELECTION',
    'tabs-arrow-keys-move-selection',
    cases.makeTabs({ handled: ['ArrowRight', 'ArrowLeft'], moveFocus: false }),
    TABS,
  ],
  [
    'TAB-ARROW-DOES-NOT-RETURN',
    'tabs-arrow-keys-move-selection',
    cases.makeTabs({ handled: ['ArrowRight'], moveFocus: true }),
    TABS,
  ],
  [
    'TAB-END-DOES-NOT-SELECT-LAST',
    'tabs-home-and-end',
    cases.makeTabs({ handled: ['ArrowRight', 'ArrowLeft'], moveFocus: true }),
    TABS,
  ],
  [
    'TAB-HOME-DOES-NOT-SELECT-FIRST',
    'tabs-home-and-end',
    cases.makeTabs({ handled: ['End'], moveFocus: true }),
    TABS,
  ],
  [
    'TAB-PANEL-LABELLED-BY-NON-TAB',
    'tabs-panel-is-named-by-its-tab',
    cases.TabsPanelLabelledByNonTab,
    TABS,
  ],
  [
    'TAB-PANEL-LABELLED-BY-WRONG-TAB',
    'tabs-panel-is-named-by-its-tab',
    cases.TabsPanelLabelledByWrongTab,
    TABS,
  ],
  [
    'TAB-TAB-CONTROLS-WRONG-PANEL',
    'tabs-panel-is-named-by-its-tab',
    cases.TabsControlsWrongPanel,
    TABS,
  ],

  ['CMB-NO-LISTBOX', 'combobox-roles', cases.ComboNoListbox, COMBOBOX],
  ['CMB-NO-OPTIONS', 'combobox-roles', cases.ComboNoOptions, COMBOBOX],
  [
    'CMB-OPEN-STATE-NOT-EXPOSED',
    'combobox-expanded-state-is-exposed',
    cases.ComboOpenStateNotExposed,
    COMBOBOX,
  ],
  [
    'CMB-ACTIVEDESCENDANT-NOT-AN-OPTION',
    'combobox-arrow-keys-move-the-active-option',
    cases.ComboActiveDescendantNotAnOption,
    COMBOBOX,
  ],
  [
    'CMB-ACTIVEDESCENDANT-DOES-NOT-ADVANCE',
    'combobox-arrow-keys-move-the-active-option',
    cases.ComboActiveDescendantDoesNotAdvance,
    COMBOBOX,
  ],
  [
    'CMB-FOCUS-LEAVES-THE-INPUT',
    'combobox-focus-stays-in-the-input',
    cases.ComboFocusLeavesTheInput,
    COMBOBOX,
  ],
  [
    'CMB-ENTER-DOES-NOT-COMMIT',
    'combobox-enter-commits-the-active-option',
    cases.makeCombo({ onEnter: 'nothing', onEscape: 'close' }),
    COMBOBOX,
  ],
  [
    'CMB-LIST-STAYS-OPEN-AFTER-COMMIT',
    'combobox-enter-commits-the-active-option',
    cases.makeCombo({ onEnter: 'commit-only', onEscape: 'close' }),
    COMBOBOX,
  ],
  [
    'CMB-ESCAPE-CLEARS-THE-FIELD',
    'combobox-escape-closes-and-keeps-what-was-typed',
    cases.makeCombo({ onEnter: 'commit-and-close', onEscape: 'clear' }),
    COMBOBOX,
  ],
  [
    'CMB-OPTIONS-STILL-EXPOSED-AFTER-ESCAPE',
    'combobox-escape-closes-and-keeps-what-was-typed',
    cases.makeCombo({ onEnter: 'commit-and-close', onEscape: 'close-but-leave-options' }),
    COMBOBOX,
  ],

  ['MNU-NO-EXPANDED', 'menu-button-roles', cases.makeMenu({ expanded: null }), MENU],
  ['MNU-NO-MENU-ROLE', 'menu-button-roles', cases.makeMenu({ menuRole: null }), MENU],
  ['MNU-NO-MENUITEMS', 'menu-button-roles', cases.makeMenu({ itemRole: null }), MENU],
  [
    'MNU-ARROWDOWN-DOES-NOT-FOCUS-FIRST',
    'menu-button-down-arrow-opens-and-focuses-the-first-item',
    cases.makeMenu({ focusFirstOnArrowDown: false }),
    MENU,
  ],
  [
    'MNU-ARROW-DOES-NOT-MOVE-FOCUS',
    'menu-arrow-keys-move-focus-between-items',
    cases.makeMenu({ focusFirstOnArrowDown: true, handled: [] }),
    MENU,
  ],
  [
    'MNU-END-DOES-NOT-REACH-LAST',
    'menu-arrow-keys-move-focus-between-items',
    cases.makeMenu({ focusFirstOnArrowDown: true, handled: ['ArrowDown', 'ArrowUp'] }),
    MENU,
  ],
  [
    'MNU-HOME-DOES-NOT-REACH-FIRST',
    'menu-arrow-keys-move-focus-between-items',
    cases.makeMenu({ focusFirstOnArrowDown: true, handled: ['ArrowDown', 'ArrowUp', 'End'] }),
    MENU,
  ],
  [
    'MNU-ESCAPE-DOES-NOT-CLOSE',
    'menu-escape-closes-and-returns-focus',
    cases.makeMenu({ focusFirstOnArrowDown: true, onEscape: 'nothing' }),
    MENU,
  ],
  [
    'MNU-ESCAPE-DOES-NOT-RETURN-FOCUS',
    'menu-escape-closes-and-returns-focus',
    cases.makeMenu({ focusFirstOnArrowDown: true, onEscape: 'close' }),
    MENU,
  ],
  [
    'MNU-TAB-LEAVES-MENU-OPEN',
    'menu-tab-closes-the-menu',
    cases.makeMenu({ focusFirstOnArrowDown: true }),
    MENU,
  ],
  [
    'MNU-TYPEAHEAD-DOES-NOT-JUMP',
    'menu-typeahead-jumps-by-first-letter',
    cases.makeMenu({ focusFirstOnArrowDown: true }),
    MENU,
  ],

  [
    'TST-MESSAGE-IN-A-NEW-REGION',
    'toast-message-lands-in-the-existing-region',
    cases.ToastMessageInANewRegion,
    TOAST,
  ],
  [
    'TST-MESSAGE-NEVER-APPEARED',
    'toast-message-lands-in-the-existing-region',
    cases.ToastMessageNeverAppears,
    TOAST,
  ],
  [
    'TST-MESSAGE-NOT-IN-A-LIVE-REGION',
    'toast-is-polite-unless-it-is-urgent',
    cases.ToastMessageOutsideTheRegion,
    TOAST,
  ],
  [
    'TST-DISMISS-NOT-A-BUTTON',
    'toast-dismiss-control-has-an-accessible-name',
    cases.ToastDismissNotAButton,
    TOAST,
  ],
];

