/** Thrown by an audit when the thing it checks is not true of the page. */
export class AuditFailure extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuditFailure';
  }
}

export function fail(message) {
  throw new AuditFailure(message);
}
