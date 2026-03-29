import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import monaco from 'monaco-editor';

export const loader = {
  config: () => undefined,
};

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
    onDidFocusEditorText: (callback: () => void) => { dispose: () => void };
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
  const valueRef = useRef(value);
  const blurListenersRef = useRef(new Set<() => void>());
  const focusListenersRef = useRef(new Set<() => void>());

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

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
    getValue: () => valueRef.current,
    onDidBlurEditorText: (callback: () => void) => {
      blurListenersRef.current.add(callback);
      return {
        dispose: () => {
          blurListenersRef.current.delete(callback);
        },
      };
    },
    onDidFocusEditorText: (callback: () => void) => {
      focusListenersRef.current.add(callback);
      return {
        dispose: () => {
          focusListenersRef.current.delete(callback);
        },
      };
    },
  }), [model]);

  useEffect(() => {
    beforeMount?.(monaco);
    onMount?.(editor, monaco);
  }, [beforeMount, editor, onMount]);

  return (
    <textarea
      aria-label={options?.ariaLabel}
      data-editor-height={height}
      data-editor-path={path}
      value={value}
      readOnly={Boolean(options?.readOnly)}
      onChange={(event) => onChange?.(event.currentTarget.value)}
      onFocus={() => {
        focusListenersRef.current.forEach((listener) => listener());
      }}
      onBlur={() => {
        blurListenersRef.current.forEach((listener) => listener());
      }}
    />
  );
}


