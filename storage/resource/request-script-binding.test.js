const assert = require('node:assert/strict');
const {
  createLinkedRequestScriptBinding,
  hasLinkedRequestScriptBindings,
  normalizeRequestScriptsState,
  remapRequestScriptsForImport,
  resolveRequestScriptsForExecution,
  serializeRequestScriptsForBundle,
} = require('./request-script-binding');

(function testNormalizesLegacyStringScriptsToInlineBindings() {
  const normalizedScripts = normalizeRequestScriptsState({
    activeStage: 'tests',
    preRequest: "request.headers.set('x-trace-id', 'legacy');",
    postResponse: '',
    tests: 'assert(response.status === 200);',
  });

  assert.deepEqual(normalizedScripts.preRequest, {
    mode: 'inline',
    sourceCode: "request.headers.set('x-trace-id', 'legacy');",
  });
  assert.deepEqual(normalizedScripts.tests, {
    mode: 'inline',
    sourceCode: 'assert(response.status === 200);',
  });
  assert.equal(normalizedScripts.activeStage, 'tests');
  assert.equal(hasLinkedRequestScriptBindings(normalizedScripts), false);
})();

(function testResolvesLinkedScriptsUsingCurrentSavedSource() {
  const linkedScripts = normalizeRequestScriptsState({
    activeStage: 'pre-request',
    preRequest: createLinkedRequestScriptBinding({
      savedScriptId: 'saved-script-pre-trace',
      savedScriptNameSnapshot: 'Trace seed',
      linkedAt: '2026-03-24T00:00:00.000Z',
    }),
    postResponse: '',
    tests: '',
  });
  const resolution = resolveRequestScriptsForExecution(linkedScripts, (scriptId) => {
    if (scriptId === 'saved-script-pre-trace') {
      return {
        id: scriptId,
        scriptType: 'pre-request',
        sourceCode: "request.headers.set('x-trace-id', 'current-source');",
      };
    }

    return null;
  });

  assert.equal(resolution.resolvedScripts.preRequest, "request.headers.set('x-trace-id', 'current-source');");
  assert.equal(resolution.resolvedScripts.postResponse, '');
})();

(function testRejectsBrokenLinkedScriptDuringExecutionResolution() {
  assert.throws(
    () => resolveRequestScriptsForExecution({
      activeStage: 'tests',
      preRequest: '',
      postResponse: '',
      tests: createLinkedRequestScriptBinding({
        savedScriptId: 'saved-script-tests-health',
        savedScriptNameSnapshot: 'Health assertions',
        linkedAt: '2026-03-24T00:00:00.000Z',
      }),
    }, () => ({
      id: 'saved-script-tests-health',
      scriptType: 'pre-request',
      sourceCode: 'assert(response.status === 200);',
    })),
    (error) => {
      assert.equal(error.code, 'request_linked_script_stage_mismatch');
      assert.equal(error.details.stageId, 'tests');
      assert.equal(error.details.actualScriptType, 'pre-request');
      return true;
    },
  );
})();

(function testSerializesLinkedBindingsForBundleExport() {
  const serializedScripts = serializeRequestScriptsForBundle({
    activeStage: 'pre-request',
    preRequest: createLinkedRequestScriptBinding({
      savedScriptId: 'saved-script-pre-trace',
      savedScriptNameSnapshot: 'Trace seed',
      linkedAt: '2026-03-24T00:00:00.000Z',
    }),
    postResponse: '',
    tests: '',
  });

  assert.deepEqual(serializedScripts, {
    activeStage: 'pre-request',
    preRequest: {
      mode: 'linked',
      savedScriptId: 'saved-script-pre-trace',
      savedScriptNameSnapshot: 'Trace seed',
      linkedAt: '2026-03-24T00:00:00.000Z',
    },
    postResponse: '',
    tests: '',
  });
})();

(function testRemapsLinkedBindingsDuringImport() {
  const remappedScripts = remapRequestScriptsForImport({
    activeStage: 'tests',
    preRequest: '',
    postResponse: '',
    tests: createLinkedRequestScriptBinding({
      savedScriptId: 'saved-script-tests-health',
      savedScriptNameSnapshot: 'Health assertions',
      linkedAt: '2026-03-24T00:00:00.000Z',
    }),
  }, (savedScriptId) => savedScriptId === 'saved-script-tests-health'
    ? {
      id: 'imported-script-tests-health',
      name: 'Health assertions (Imported)',
    }
    : null);

  assert.equal(remappedScripts.unresolvedLinks.length, 0);
  assert.deepEqual(remappedScripts.scripts.tests, {
    mode: 'linked',
    savedScriptId: 'imported-script-tests-health',
    savedScriptNameSnapshot: 'Health assertions (Imported)',
    linkedAt: '2026-03-24T00:00:00.000Z',
  });
})();
