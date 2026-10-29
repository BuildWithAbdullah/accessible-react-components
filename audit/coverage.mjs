/**
 * Which findings the six example pairs reach, declared rather than computed.
 *
 * This is the residual set idea from the other pattern libraries on this
 * profile, turned around. There it records what a repair layer cannot fix.
 * Here it records what the pairs cannot reach: the pairs are whole plausible
 * components, so each one reaches whichever reason its own defect happens to
 * be, and the rest of the reasons in the same audit are never run.
 *
 * It is written down here so that test/findings.test.mjs can assert it as an
 * exact set in both directions: every id in this list is reached by a pair,
 * and every finding not in this list is not. Inclusion would be worth
 * nothing. If a pair is edited so that it reaches one more reason, or one
 * fewer, this list has to move, and the suite says so.
 */
export const REACHED_BY_PAIRS = [
  'STRUCT-PART-MISSING',
  'REF-ABSENT',
  'NAME-ABSENT',
  'DLG-NO-DIALOG-ROLE',
  'DLG-FOCUS-NOT-MOVED-IN',
  'DLG-TAB-NOT-CLAIMED-FORWARD',
  'DLG-ESCAPE-DEAD',
  'DLG-FOCUS-NOT-RESTORED',
  'DLG-CLOSE-NOT-A-BUTTON',
  'DSC-TRIGGER-NOT-A-BUTTON',
  'DSC-COLLAPSED-STATE-NOT-EXPOSED',
  'DSC-COLLAPSED-REGION-TABBABLE',
  'TAB-NO-TABLIST',
  'TAB-MULTIPLE-TAB-STOPS',
  'TAB-SELECTION-NOT-EXPOSED',
  'CMB-INPUT-NOT-COMBOBOX',
  'CMB-CLOSED-STATE-NOT-EXPOSED',
  'CMB-NO-ACTIVEDESCENDANT',
  'CMB-ACTIVE-OPTION-NOT-SELECTED',
  'CMB-ESCAPE-DOES-NOT-CLOSE',
  'MNU-NO-HASPOPUP',
  'MNU-ARROWDOWN-DOES-NOT-OPEN',
  'TST-NO-REGION-BEFORE-MESSAGE',
  'TST-STEALS-FOCUS',
  'TST-CONFIRMATION-IS-ASSERTIVE',
  'TST-ATOMIC-ON-AN-ACCUMULATING-REGION',
  'TST-REMOVED-ON-A-TIMER',
];
