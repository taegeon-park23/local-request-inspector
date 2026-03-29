import { describe, expect, it } from 'vitest';
import { createForbiddenTokenDiagnostics } from '@client/shared/code-editor/script-editor-diagnostics';
import { FORBIDDEN_SCRIPT_TOKEN_PATTERN } from '@client/shared/code-editor/script-stage-capability';

describe('script editor diagnostics', () => {
  it('creates warning markers for forbidden runtime tokens', () => {
    const markers = createForbiddenTokenDiagnostics(
      "console.log('test');\nconst value = process.env.API_KEY;\nconst file = require('fs');",
      FORBIDDEN_SCRIPT_TOKEN_PATTERN,
    );

    expect(markers).toHaveLength(2);
    expect(markers[0]?.message).toContain('process');
    expect(markers[1]?.message).toContain('require');
    expect(markers[0]?.startLineNumber).toBe(2);
    expect(markers[1]?.startLineNumber).toBe(3);
  });
});

