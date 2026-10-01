/**
 * The audit catalogue.
 *
 * An audit is a behavioural check against a mounted example: it mounts, it
 * presses keys, and it either returns or throws an AuditFailure saying what it
 * found. Every audit states what it proves and what it does not, because
 * several of them are the closest a headless DOM can get to the real thing,
 * and a check whose limits are not written down gets read as a guarantee.
 */
import dialog from './dialog.mjs';
import disclosure from './disclosure.mjs';
import tabs from './tabs.mjs';
import combobox from './combobox.mjs';
import menuButton from './menu-button.mjs';
import toast from './toast.mjs';

export const AUDITS = [...dialog, ...disclosure, ...tabs, ...combobox, ...menuButton, ...toast];

export const COMPONENTS = ['dialog', 'disclosure', 'tabs', 'combobox', 'menu-button', 'toast'];

export function auditsFor(component) {
  return AUDITS.filter((audit) => audit.component === component);
}

export function auditById(id) {
  const found = AUDITS.find((audit) => audit.id === id);
  if (!found) throw new Error(`no audit with id ${id}`);
  return found;
}
