import { describe, expect, it, vi } from 'vitest';

describe('script-monaco-setup', () => {
  it('configures monaco-react loader with the local monaco instance', async () => {
    vi.resetModules();

    const monacoReact = await import('@monaco-editor/react');
    const configSpy = vi.spyOn(monacoReact.loader, 'config');
    const monaco = await import('monaco-editor');

    await import('@client/shared/code-editor/script-monaco-setup');

    expect(configSpy).toHaveBeenCalledWith({ monaco });
  });
});
