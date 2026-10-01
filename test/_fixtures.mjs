/**
 * What an audit needs to know about an example in order to run against both
 * halves of a pair.
 *
 * The failing example cannot be found by the same selectors as the corrected
 * one, because the whole point of it is that it has no roles. So each pair
 * declares the selectors that reach the same parts in both, and the audits are
 * written against those rather than against the corrected markup. Without this
 * the audits would only ever be able to describe the good version.
 */
import DialogFail from '../build/examples/dialog/Fail.js';
import DialogPass from '../build/examples/dialog/Pass.js';
import DisclosureFail from '../build/examples/disclosure/Fail.js';
import DisclosurePass from '../build/examples/disclosure/Pass.js';
import TabsFail from '../build/examples/tabs/Fail.js';
import TabsPass from '../build/examples/tabs/Pass.js';
import ComboboxFail from '../build/examples/combobox/Fail.js';
import ComboboxPass from '../build/examples/combobox/Pass.js';
import MenuFail from '../build/examples/menu-button/Fail.js';
import MenuPass from '../build/examples/menu-button/Pass.js';
import ToastFail from '../build/examples/toast/Fail.js';
import ToastPass from '../build/examples/toast/Pass.js';

export const FIXTURES = {
  dialog: {
    pass: DialogPass,
    fail: DialogFail,
    trigger: '[data-arc-trigger]',
    panel: '[role="dialog"], .modal',
    close: '[role="dialog"] button, .modal-close',
  },
  disclosure: {
    pass: DisclosurePass,
    fail: DisclosureFail,
    trigger: '.arc-disclosure button, .accordion-trigger',
    region: '.arc-disclosure-region, .accordion-region',
  },
  tabs: {
    pass: TabsPass,
    fail: TabsFail,
    items: '[role="tab"], .tab',
    list: '[role="tablist"], .tabstrip',
  },
  combobox: {
    pass: ComboboxPass,
    fail: ComboboxFail,
    input: 'input[type="text"]',
  },
  'menu-button': {
    pass: MenuPass,
    fail: MenuFail,
    trigger: '.arc-menu-button > button, .dropdown-toggle',
    items: '[role="menuitem"]',
    typeahead: 'e',
  },
  toast: {
    pass: ToastPass,
    fail: ToastFail,
    trigger: '[data-arc-trigger]',
    message: 'Profile saved',
    dismiss: '[role="status"] button, [role="alert"] button, .toast-close',
    timerWindowMs: 120,
    // The shipped failing example removes its message after two seconds. The
    // pair test passes a much shorter delay so the suite does not sit waiting
    // for a defect it already knows the shape of.
    failProps: { autoDismissMs: 25 },
  },
};

export function fixtureFor(component) {
  const fixture = FIXTURES[component];
  if (!fixture) throw new Error(`no fixture declared for ${component}`);
  return fixture;
}
