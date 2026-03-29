import { describe, expect, it } from 'vitest';
import { getScriptStageCapabilityProfile } from '@client/shared/code-editor/script-stage-capability';

describe('script stage capability profile', () => {
  it('does not expose response completion in pre-request stage', () => {
    const preRequestProfile = getScriptStageCapabilityProfile('pre-request');
    expect(preRequestProfile.completionItems.some((item) => item.label === 'response')).toBe(false);
  });

  it('exposes assert/test helpers in tests stage', () => {
    const testsProfile = getScriptStageCapabilityProfile('tests');
    expect(testsProfile.completionItems.some((item) => item.label === 'assert')).toBe(true);
    expect(testsProfile.completionItems.some((item) => item.label === 'test')).toBe(true);
  });
});

