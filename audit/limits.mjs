/**
 * What the audits in this repository cannot tell you, held as data.
 *
 * Every audit already carries a `doesNotProve` field, and that is prose. This
 * file is the subset of those limits that can be turned into an assertion,
 * and test/limits.test.mjs asserts every one of them in both directions.
 *
 * The shape of the assertion matters more than the wording. For each limit
 * the suite constructs inputs covering every combination of the audit's
 * verdict against the thing the limit says the verdict is not about, and
 * requires that every combination exists. When it does, the verdict is not
 * even weak evidence about that thing, in either direction, and the limit is
 * a fact rather than a caveat. A limit that only showed "pass does not imply
 * correct" would leave open that "fail implies incorrect", which is the half
 * a reader quietly assumes.
 *
 * `independent` is the claim the verdict carries no information about.
 * `combinations` is how many of the four the suite has to construct: four
 * where the limit runs both ways, and two where the implication is genuinely
 * one way and the limit says which.
 */
export const LIMITS = [
  {
    id: 'LIMIT-MODAL-IS-NOT-INERT',
    audit: 'dialog-role-and-name',
    claim:
      'aria-modal="true" is a promise the author makes to assistive technology. It does not make the rest of the page inert, and nothing in this repository checks that anything does.',
    independent: 'whether the content behind the dialog is actually inert',
    combinations: 4,
    why:
      'This is the claim a reader most wants to make from a green dialog suite, and it is the one that does not follow. The quiet case is the dangerous one: a dialog that carries aria-modal and leaves the whole page behind it reachable by a virtual cursor is reported correct here, and that is the commonest modal defect in the wild. Use the native dialog element if you can, because the browser enforces what this attribute only declares.',
  },
  {
    id: 'LIMIT-CONTAINMENT-IS-NOT-EXPOSURE',
    audit: 'dialog-tab-is-contained',
    claim:
      'Containing Tab constrains one way of moving through a page. A screen reader virtual cursor does not use Tab and is not constrained by anything this audit sees.',
    independent: 'whether the content behind the dialog is hidden from the reading cursor',
    combinations: 4,
    why:
      'A focus trap is the thing people build and test, and it is not the thing a screen reader user is affected by. Both halves of the verdict occur with the background exposed and with it hidden, so the containment result says nothing either way.',
  },
  {
    id: 'LIMIT-TIMER-WINDOW',
    audit: 'toast-does-not-remove-itself-on-a-timer',
    claim:
      'The audit waits for the window the pair declares and no longer, so it sees a timer only if the timer is shorter than that window. A test suite cannot sit for four seconds per example.',
    independent: 'whether the message is on a timer at all',
    combinations: 2,
    why:
      'A failure here is real: something removed the message with no user action. A pass is worth nothing, because a toast with a four second timer and a toast with no timer are both passes. This is why the shipped failing example takes its dismissal delay as a prop and the pair sets it short: the audit is run against a component configured so that the defect falls inside the window, and that is a property of the harness rather than of the component.',
  },
  {
    id: 'LIMIT-NAME-IS-A-SUBSET',
    audit: 'toast-dismiss-control-has-an-accessible-name',
    claim:
      'audit/name.mjs implements part of the accessible name computation, not all of it. A name it reports is a name. A name it does not report is not proof there is none.',
    independent: 'whether the control actually has an accessible name',
    combinations: 2,
    why:
      'It is deliberately asymmetric and the asymmetry is the useful part. The case it is reliable for is an icon control whose only content is hidden from assistive technology, which computes to nothing. A control named by a wrapping label element, which a browser resolves and this does not, is reported as unnamed, so NAME-ABSENT can be reported against a control that is in fact named.',
  },
  {
    id: 'LIMIT-KEYPRESS-IS-NOT-ACTIVATION',
    audit: 'dialog-close-control-is-a-button',
    claim:
      'jsdom does not synthesise the click a browser generates from Enter or Space on a button, so this finding is decided by element type and not by trying the keys.',
    independent: 'whether the control can actually be operated from the keyboard',
    combinations: 2,
    why:
      'A div with role="button", tabindex="0" and handlers for both keys is operable and is still reported. The finding is the right default anyway, because a button is one thing to get right and the substitute is three, but it is a finding about markup and should not be read as a finding about behaviour.',
  },
];

const BY_ID = new Map(LIMITS.map((limit) => [limit.id, limit]));

export function limitById(id) {
  const found = BY_ID.get(id);
  if (!found) throw new Error(`no limit with id ${id}`);
  return found;
}
