import { mount, act, win } from './_render.mjs';
import { makeContext } from '../audit/ctx.mjs';
import { fixtureFor } from './_fixtures.mjs';

/** Run one audit against one component, mounted fresh. */
export async function runAudit(audit, Component, fixture, props = {}) {
  const { unmount, host } = await mount(Component, props);
  try {
    await audit.run(makeContext({ act, win, host, fixture }));
  } finally {
    await unmount();
  }
}

export function runOnCorrected(audit) {
  const fixture = fixtureFor(audit.component);
  return runAudit(audit, fixture.pass, fixture);
}

export function runOnFailing(audit) {
  const fixture = fixtureFor(audit.component);
  return runAudit(audit, fixture.fail, fixture, fixture.failProps ?? {});
}
