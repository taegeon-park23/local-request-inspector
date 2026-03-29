import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

interface MonacoLike {
  languages?: {
    typescript?: {
      javascriptDefaults?: {
        addExtraLib?: (source: string, filePath?: string) => { dispose: () => void };
        setCompilerOptions?: (options: Record<string, unknown>) => void;
        setDiagnosticsOptions?: (options: Record<string, unknown>) => void;
      };
      ScriptTarget?: {
        ES2022?: number;
      };
    };
  };
}

let configured = false;

export function configureScriptMonaco(monaco: MonacoLike) {
  if (configured) {
    return;
  }

  configured = true;

  if (typeof window !== 'undefined') {
    const windowWithMonacoEnvironment = window as typeof window & {
      MonacoEnvironment?: {
        getWorker?: (moduleId: string, label: string) => Worker;
      };
    };

    windowWithMonacoEnvironment.MonacoEnvironment = {
      getWorker(_moduleId: string, label: string) {
        if (label === 'typescript' || label === 'javascript') {
          return new tsWorker();
        }

        return new editorWorker();
      },
    };
  }

  const javascriptDefaults = monaco.languages?.typescript?.javascriptDefaults;
  const scriptTargetEs2022 = monaco.languages?.typescript?.ScriptTarget?.ES2022;

  javascriptDefaults?.setCompilerOptions?.({
    allowNonTsExtensions: true,
    allowJs: true,
    checkJs: true,
    target: scriptTargetEs2022,
  });
  javascriptDefaults?.setDiagnosticsOptions?.({
    noSemanticValidation: false,
    noSyntaxValidation: false,
  });
}
