declare module '@monaco-editor/react' {
  import type { ComponentType } from 'react';

  export const loader: {
    config: (config: { monaco: unknown }) => void;
  };

  const Editor: ComponentType<Record<string, unknown>>;
  export default Editor;
}

declare module 'monaco-editor' {
  const monaco: Record<string, unknown>;
  export = monaco;
}

declare module 'monaco-editor/esm/vs/editor/editor.worker?worker' {
  const EditorWorkerFactory: {
    new (): Worker;
  };
  export default EditorWorkerFactory;
}

declare module 'monaco-editor/esm/vs/language/typescript/ts.worker?worker' {
  const TypeScriptWorkerFactory: {
    new (): Worker;
  };
  export default TypeScriptWorkerFactory;
}
