import { useEffect, useMemo, type ReactNode } from 'react';
import monaco from 'monaco-editor';

interface MonacoReactMockProps {
  value?: string;
  height?: string;
  onChange?: (value: string) => void;
  onMount?: (editor: {
    getModel: () => {
      uri: { toString: () => string };
      getWordUntilPosition: (position: { lineNumber: number; column: number }) => { startColumn: number; endColumn: number };
    };
    getValue: () => string;
    onDidBlurEditorText: (callback: () => void) => { dispose: () => void };
  }, monacoApi: typeof monaco) => void;
  beforeMount?: (monacoApi: typeof monaco) => void;
  options?: {
    readOnly?: boolean;
    ariaLabel?: string;
  };
  path?: string;
  loading?: ReactNode;
}

export default function MonacoEditorMock({
  value = '',
  height,
  onChange,
  onMount,
  beforeMount,
  options,
  path,
}: MonacoReactMockProps) {
  const model = useMemo(() => ({
    uri: {
      toString: () => path ?? 'inmemory://script-editor/mock.js',
    },
    getWordUntilPosition: (position: { lineNumber: number; column: number }) => ({
      startColumn: position.column,
      endColumn: position.column,
    }),
  }), [path]);

  const editor = useMemo(() => ({
    getModel: () => model,
    getValue: () => value,
    onDidBlurEditorText: () => ({
      dispose: () => undefined,
    }),
  }), [model, value]);

  useEffect(() => {
    beforeMount?.(monaco);
    onMount?.(editor, monaco);
  }, [beforeMount, editor, onMount]);

  return (
    <textarea
      aria-label={options?.ariaLabel}
      data-editor-height={height}
      value={value}
      readOnly={Boolean(options?.readOnly)}
      onChange={(event) => onChange?.(event.currentTarget.value)}
    />
  );
}
