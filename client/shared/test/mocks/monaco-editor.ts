const completionKinds = {
  Function: 1,
  Variable: 5,
  Method: 2,
};

const insertTextRule = {
  InsertAsSnippet: 4,
};

const monacoMock = {
  languages: {
    typescript: {
      javascriptDefaults: {
        setCompilerOptions: () => undefined,
        setDiagnosticsOptions: () => undefined,
        addExtraLib: () => ({
          dispose: () => undefined,
        }),
      },
      ScriptTarget: {
        ES2022: 99,
      },
    },
    CompletionItemKind: completionKinds,
    CompletionItemInsertTextRule: insertTextRule,
    registerCompletionItemProvider: () => ({
      dispose: () => undefined,
    }),
  },
  MarkerSeverity: {
    Warning: 4,
  },
  editor: {
    setModelMarkers: () => undefined,
  },
};

export default monacoMock;
