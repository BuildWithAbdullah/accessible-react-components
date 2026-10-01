import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { auditsFor } from '../audit/index.mjs';
import { runOnCorrected, runOnFailing } from './_audit-runner.mjs';

/**
 * The audit block every component test file opens with: each audit named once
 * against the corrected example and once against the failing one, so the test
 * output reads as a list of what the pattern requires and what the failing
 * version does about it.
 */
export function auditSuite(component) {
  describe(`${component}: the corrected example satisfies every audit`, () => {
    for (const audit of auditsFor(component)) {
      it(audit.requirement, async () => {
        await runOnCorrected(audit);
      });
    }
  });

  describe(`${component}: the failing example violates every audit`, () => {
    for (const audit of auditsFor(component)) {
      it(audit.requirement, async () => {
        await assert.rejects(
          () => runOnFailing(audit),
          (error) => error.name === 'AuditFailure',
          `${audit.id} did not report a failure`,
        );
      });
    }
  });
}
