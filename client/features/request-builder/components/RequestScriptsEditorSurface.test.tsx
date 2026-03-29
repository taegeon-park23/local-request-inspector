import { useState } from 'react';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RequestScriptsEditorSurface from '@client/features/request-builder/components/RequestScriptsEditorSurface';
import type { RequestDraftState, RequestScriptStageId } from '@client/features/request-builder/request-draft.types';
import { renderApp } from '@client/shared/test/render-app';

function createApiResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify({ data }), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function getUrl(input: RequestInfo | URL) {
  if (typeof input === 'string') {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}

function createDraft(overrides?: Partial<RequestDraftState>): RequestDraftState {
  return {
    tabId: 'tab-script-focus',
    name: 'Script focus draft',
    method: 'GET',
    url: 'https://api.example.com/focus',
    selectedEnvironmentId: null,
    params: [],
    headers: [],
    bodyMode: 'none',
    bodyText: '',
    formBody: [],
    multipartBody: [],
    auth: {
      type: 'none',
      bearerToken: '',
      basicUsername: '',
      basicPassword: '',
      apiKeyName: '',
      apiKeyValue: '',
      apiKeyPlacement: 'header',
    },
    scripts: {
      activeStage: 'pre-request',
      preRequest: {
        mode: 'inline',
        sourceCode: '',
      },
      postResponse: {
        mode: 'inline',
        sourceCode: '',
      },
      tests: {
        mode: 'inline',
        sourceCode: '',
      },
    },
    activeEditorTab: 'scripts',
    dirty: false,
    ...overrides,
  };
}

function ScriptSurfaceHarness() {
  const [draft, setDraft] = useState<RequestDraftState>(() => createDraft());

  const updateStageSource = (stage: RequestScriptStageId, content: string) => {
    setDraft((current) => ({
      ...current,
      scripts: {
        ...current.scripts,
        [stage]: {
          mode: 'inline',
          sourceCode: content,
        },
      },
    }));
  };

  return (
    <RequestScriptsEditorSurface
      draft={draft}
      onStageChange={(stage) => {
        setDraft((current) => ({
          ...current,
          scripts: {
            ...current.scripts,
            activeStage: stage,
          },
        }));
      }}
      onContentChange={updateStageSource}
      copiedFromScriptNames={{}}
      onAttachSavedScript={(stage, _name, content) => updateStageSource(stage, content)}
      onLinkSavedScript={() => undefined}
      onDetachSavedScript={(stage, _name, content) => updateStageSource(stage, content)}
    />
  );
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('RequestScriptsEditorSurface', () => {
  it('keeps the inline script editor focused after debounced draft sync flushes', async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      if (getUrl(input) === '/api/workspaces/local-workspace/scripts') {
        return createApiResponse({ items: [] });
      }

      throw new Error(`Unexpected fetch call: ${getUrl(input)}`);
    }));

    renderApp(<ScriptSurfaceHarness />);

    const editor = screen.getByLabelText('Pre-request script');
    await user.click(editor);
    await user.type(editor, 'const traceSeed = true;');

    act(() => {
      vi.advanceTimersByTime(220);
    });

    const updatedEditor = screen.getByLabelText('Pre-request script');
    expect(updatedEditor).toBe(editor);
    expect(updatedEditor).toHaveFocus();
    expect(updatedEditor).toHaveValue('const traceSeed = true;');
  });
});

