import { useCallback, useEffect, useId, useMemo, useRef, type MutableRefObject } from 'react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import type { RequestScriptStageId } from '@client/features/request-builder/request-draft.types';
import { createForbiddenTokenDiagnostics } from '@client/shared/code-editor/script-editor-diagnostics';
import { getScriptStageCapabilityProfile } from '@client/shared/code-editor/script-stage-capability';
import { configureScriptMonaco } from '@client/shared/code-editor/script-monaco-setup';

export interface ScriptCodeEditorProps {
  value: string;
  onChange: (nextValue: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  readOnly?: boolean;
  ariaLabel: string;
  placeholder?: string;
  stageId: RequestScriptStageId;
  diagnostics?: boolean;
}

interface MonacoEditorLike {
  getModel?: () => MonacoModelLike | null;
  getValue?: () => string;
  onDidBlurEditorText?: (listener: () => void) => { dispose: () => void };
  onDidFocusEditorText?: (listener: () => void) => { dispose: () => void };
}

interface MonacoModelLike {
  uri?: {
    toString: () => string;
  };
  getWordUntilPosition?: (position: { lineNumber: number; column: number }) => { startColumn: number; endColumn: number };
}

interface MonacoLanguageLike {
  typescript?: {
    javascriptDefaults?: {
      addExtraLib?: (source: string, filePath?: string) => { dispose: () => void };
    };
  };
  CompletionItemKind?: {
    Function?: number;
    Variable?: number;
    Method?: number;
  };
  CompletionItemInsertTextRule?: {
    InsertAsSnippet?: number;
  };
  registerCompletionItemProvider?: (
    language: string,
    provider: {
      provideCompletionItems: (model: MonacoModelLike, position: { lineNumber: number; column: number }) => {
        suggestions: Array<Record<string, unknown>>;
      };
    },
  ) => { dispose: () => void };
}

interface MonacoEditorApiLike {
  setModelMarkers?: (
    model: MonacoModelLike,
    owner: string,
    markers: Array<Record<string, unknown>>,
  ) => void;
}

interface MonacoLike {
  languages?: MonacoLanguageLike;
  editor?: MonacoEditorApiLike;
  MarkerSeverity?: {
    Warning?: number;
  };
}

function dispose(ref: MutableRefObject<{ dispose: () => void } | null>) {
  if (!ref.current) {
    return;
  }

  ref.current.dispose();
  ref.current = null;
}

export function ScriptCodeEditor({
  value,
  onChange,
  onBlur,
  onFocus,
  readOnly = false,
  ariaLabel,
  placeholder = '',
  stageId,
  diagnostics = true,
}: ScriptCodeEditorProps) {
  const editorHeight = readOnly ? '11rem' : '19rem';
  const editorRef = useRef<MonacoEditorLike | null>(null);
  const modelRef = useRef<MonacoModelLike | null>(null);
  const completionProviderRef = useRef<{ dispose: () => void } | null>(null);
  const extraLibRef = useRef<{ dispose: () => void } | null>(null);
  const blurSubscriptionRef = useRef<{ dispose: () => void } | null>(null);
  const focusSubscriptionRef = useRef<{ dispose: () => void } | null>(null);
  const profile = useMemo(() => getScriptStageCapabilityProfile(stageId), [stageId]);
  const id = useId().replace(/:/g, '-');
  const modelRootPath = useMemo(() => `inmemory://request-script-editor/${id}`, [id]);
  const modelPath = `${modelRootPath}/${stageId}.js`;
  const monacoApi = monaco as unknown as MonacoLike;

  const applyForbiddenTokenMarkers = useCallback((nextValue: string) => {
    if (!diagnostics || !modelRef.current || !monacoApi.editor?.setModelMarkers) {
      return;
    }

    const markers = createForbiddenTokenDiagnostics(nextValue, profile.forbiddenTokenPattern).map((marker) => ({
      ...marker,
      severity: monacoApi.MarkerSeverity?.Warning ?? 4,
    }));

    monacoApi.editor.setModelMarkers(
      modelRef.current,
      'script-forbidden-token',
      markers,
    );
  }, [diagnostics, monacoApi, profile.forbiddenTokenPattern]);

  const attachStageProviders = useCallback((editor: MonacoEditorLike, monacoInstance: MonacoLike) => {
    dispose(extraLibRef);
    dispose(completionProviderRef);
    const model = editor.getModel?.();
    modelRef.current = model ?? null;

    const javascriptDefaults = monacoInstance.languages?.typescript?.javascriptDefaults;
    extraLibRef.current = javascriptDefaults?.addExtraLib?.(
      profile.globalDeclarationSource,
      `ts:request-script-editor/${id}/${stageId}.d.ts`,
    ) ?? null;

    completionProviderRef.current = monacoInstance.languages?.registerCompletionItemProvider?.('javascript', {
      provideCompletionItems: (providerModel, position) => {
        const providerModelUri = providerModel.uri?.toString();
        const mountedModelUri = modelRef.current?.uri?.toString();

        if (providerModelUri && mountedModelUri && providerModelUri !== mountedModelUri) {
          return { suggestions: [] };
        }

        const wordUntilPosition = providerModel.getWordUntilPosition?.(position) ?? {
          startColumn: position.column,
          endColumn: position.column,
        };

        const range = {
          startLineNumber: position.lineNumber,
          startColumn: wordUntilPosition.startColumn,
          endLineNumber: position.lineNumber,
          endColumn: wordUntilPosition.endColumn,
        };

        return {
          suggestions: profile.completionItems.map((item) => {
            const completionKind = item.label.includes('.') ? monacoInstance.languages?.CompletionItemKind?.Method : monacoInstance.languages?.CompletionItemKind?.Variable;

            return {
              label: item.label,
              detail: item.detail,
              documentation: {
                value: item.documentation,
              },
              insertText: item.insertText,
              insertTextRules: monacoInstance.languages?.CompletionItemInsertTextRule?.InsertAsSnippet ?? 4,
              kind: completionKind ?? monacoInstance.languages?.CompletionItemKind?.Function ?? 1,
              range,
            };
          }),
        };
      },
    }) ?? null;
  }, [id, profile, stageId]);

  const handleBeforeMount = useCallback((monacoInstance: MonacoLike) => {
    configureScriptMonaco(monacoInstance);
  }, []);

  const handleMount = useCallback((editor: MonacoEditorLike, monacoInstance: MonacoLike) => {
    editorRef.current = editor;
    attachStageProviders(editor, monacoInstance);
    applyForbiddenTokenMarkers(editor.getValue?.() ?? '');
    dispose(blurSubscriptionRef);
    blurSubscriptionRef.current = editor.onDidBlurEditorText?.(() => {
      onBlur?.();
    }) ?? null;
    dispose(focusSubscriptionRef);
    focusSubscriptionRef.current = editor.onDidFocusEditorText?.(() => {
      onFocus?.();
    }) ?? null;
  }, [applyForbiddenTokenMarkers, attachStageProviders, onBlur, onFocus]);

  const handleChange = useCallback((nextValue: string | undefined) => {
    const resolvedValue = nextValue ?? '';
    onChange(resolvedValue);
    applyForbiddenTokenMarkers(resolvedValue);
  }, [applyForbiddenTokenMarkers, onChange]);

  useEffect(() => {
    applyForbiddenTokenMarkers(value);
  }, [applyForbiddenTokenMarkers, value]);

  useEffect(() => () => {
    dispose(extraLibRef);
    dispose(completionProviderRef);
    dispose(blurSubscriptionRef);
    dispose(focusSubscriptionRef);
  }, []);

  return (
    <div className={readOnly ? 'script-code-editor script-code-editor--readonly' : 'script-code-editor'}>
      <Editor
        key={`${stageId}-${readOnly ? 'readonly' : 'editable'}`}
        height={editorHeight}
        path={modelPath}
        language="javascript"
        value={value}
        onChange={handleChange}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        options={{
          minimap: { enabled: false },
          readOnly,
          ariaLabel,
          automaticLayout: true,
          wordWrap: 'on',
          lineNumbersMinChars: 3,
          scrollBeyondLastLine: false,
          fontSize: 13,
          tabSize: 2,
          padding: {
            top: 12,
            bottom: 12,
          },
          renderValidationDecorations: diagnostics ? 'on' : 'off',
        }}
        loading={(
          <textarea
            aria-label={ariaLabel}
            className="script-code-editor__fallback"
            placeholder={placeholder}
            value={value}
            onChange={(event) => onChange(event.currentTarget.value)}
            onBlur={onBlur}
            onFocus={onFocus}
            readOnly={readOnly}
            rows={14}
          />
        )}
      />
    </div>
  );
}
