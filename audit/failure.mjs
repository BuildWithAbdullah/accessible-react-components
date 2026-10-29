/**
 * Thrown by an audit when the thing it checks is not true of the page.
 *
 * Every failure names a finding from audit/findings.mjs. The id is the part a
 * reader acts on: it says which of the reasons this audit can fail for is the
 * one they have, and the catalogue says what to do about it. A message on its
 * own would leave them to work that out by reading the audit.
 */
import { hasFinding } from './findings.mjs';

export class AuditFailure extends Error {
  constructor(finding, message) {
    super(`${finding}: ${message}`);
    this.name = 'AuditFailure';
    this.finding = finding;
    this.detail = message;
  }
}

export function fail(finding, message) {
  // A typo in a finding id would otherwise produce a failure that reports a
  // reason nothing in the catalogue explains, and the pairs suite would be
  // perfectly happy with it.
  if (!hasFinding(finding)) {
    throw new Error(`an audit reported ${finding}, which is not in the finding catalogue`);
  }
  throw new AuditFailure(finding, message);
}
