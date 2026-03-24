const { SCRIPT_TYPES } = require('./script-record');

const REQUEST_SCRIPT_STAGE_IDS = Object.freeze(['pre-request', 'post-response', 'tests']);
const REQUEST_SCRIPT_STAGE_FIELD_MAP = Object.freeze({
  'pre-request': 'preRequest',
  'post-response': 'postResponse',
  tests: 'tests',
});

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function createRequestScriptBindingError(code, message, details = {}) {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  return error;
}

function createInlineRequestScriptBinding(sourceCode = '') {
  return {
    mode: 'inline',
    sourceCode: typeof sourceCode === 'string' ? sourceCode : '',
  };
}

function createLinkedRequestScriptBinding(input = {}, linkedAtFallback = new Date().toISOString()) {
  return {
    mode: 'linked',
    savedScriptId: normalizeText(input.savedScriptId),
    savedScriptNameSnapshot: normalizeText(input.savedScriptNameSnapshot),
    linkedAt: normalizeText(input.linkedAt) || linkedAtFallback,
  };
}

function normalizeRequestScriptStageBinding(input, options = {}) {
  if (typeof input === 'string') {
    return createInlineRequestScriptBinding(input);
  }

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return createInlineRequestScriptBinding('');
  }

  if (input.mode === 'linked') {
    return createLinkedRequestScriptBinding(input, options.linkedAtFallback);
  }

  return createInlineRequestScriptBinding(typeof input.sourceCode === 'string' ? input.sourceCode : '');
}

function normalizeRequestScriptsState(scripts = {}, options = {}) {
  const linkedAtFallback = normalizeText(options.linkedAtFallback) || new Date().toISOString();

  return {
    activeStage: REQUEST_SCRIPT_STAGE_IDS.includes(scripts.activeStage) ? scripts.activeStage : 'pre-request',
    preRequest: normalizeRequestScriptStageBinding(scripts.preRequest, { linkedAtFallback }),
    postResponse: normalizeRequestScriptStageBinding(scripts.postResponse, { linkedAtFallback }),
    tests: normalizeRequestScriptStageBinding(scripts.tests, { linkedAtFallback }),
  };
}

function getRequestScriptStageBinding(scripts, stageId) {
  return normalizeRequestScriptsState(scripts)[REQUEST_SCRIPT_STAGE_FIELD_MAP[stageId]];
}

function isLinkedRequestScriptBinding(binding) {
  return binding?.mode === 'linked';
}

function listLinkedRequestScriptStages(scripts) {
  const normalizedScripts = normalizeRequestScriptsState(scripts);

  return REQUEST_SCRIPT_STAGE_IDS
    .map((stageId) => {
      const binding = normalizedScripts[REQUEST_SCRIPT_STAGE_FIELD_MAP[stageId]];

      if (!isLinkedRequestScriptBinding(binding)) {
        return null;
      }

      return {
        stageId,
        savedScriptId: binding.savedScriptId,
        savedScriptNameSnapshot: binding.savedScriptNameSnapshot,
        linkedAt: binding.linkedAt,
      };
    })
    .filter(Boolean);
}

function hasLinkedRequestScriptBindings(scripts) {
  return listLinkedRequestScriptStages(scripts).length > 0;
}

function serializeRequestScriptsForBundle(scripts) {
  const normalizedScripts = normalizeRequestScriptsState(scripts);

  if (hasLinkedRequestScriptBindings(normalizedScripts)) {
    throw createRequestScriptBindingError(
      'request_linked_script_export_blocked',
      'Linked saved scripts must be detached to inline copies before authored-resource export.',
      {
        linkedStages: listLinkedRequestScriptStages(normalizedScripts),
      },
    );
  }

  return {
    activeStage: normalizedScripts.activeStage,
    preRequest: normalizedScripts.preRequest.sourceCode,
    postResponse: normalizedScripts.postResponse.sourceCode,
    tests: normalizedScripts.tests.sourceCode,
  };
}

function createMissingLinkedRequestScriptError(stageId, binding) {
  return createRequestScriptBindingError(
    'request_linked_script_missing',
    `Linked saved script for the ${stageId} stage was not found.`,
    {
      stageId,
      savedScriptId: binding.savedScriptId,
      savedScriptNameSnapshot: binding.savedScriptNameSnapshot,
    },
  );
}

function createMismatchedLinkedRequestScriptError(stageId, binding, savedScript) {
  return createRequestScriptBindingError(
    'request_linked_script_stage_mismatch',
    `Linked saved script for the ${stageId} stage no longer matches the required script type.`,
    {
      stageId,
      savedScriptId: binding.savedScriptId,
      savedScriptNameSnapshot: binding.savedScriptNameSnapshot,
      actualScriptType: savedScript.scriptType,
      expectedScriptType: stageId,
    },
  );
}

function resolveRequestScriptsForExecution(scripts, readSavedScriptById) {
  const normalizedScripts = normalizeRequestScriptsState(scripts);
  const resolvedScripts = {
    activeStage: normalizedScripts.activeStage,
    preRequest: '',
    postResponse: '',
    tests: '',
  };

  for (const stageId of REQUEST_SCRIPT_STAGE_IDS) {
    const field = REQUEST_SCRIPT_STAGE_FIELD_MAP[stageId];
    const binding = normalizedScripts[field];

    if (!isLinkedRequestScriptBinding(binding)) {
      resolvedScripts[field] = binding.sourceCode;
      continue;
    }

    const savedScript = readSavedScriptById(binding.savedScriptId);

    if (!savedScript) {
      throw createMissingLinkedRequestScriptError(stageId, binding);
    }

    if (!SCRIPT_TYPES.includes(savedScript.scriptType) || savedScript.scriptType !== stageId) {
      throw createMismatchedLinkedRequestScriptError(stageId, binding, savedScript);
    }

    resolvedScripts[field] = typeof savedScript.sourceCode === 'string' ? savedScript.sourceCode : '';
  }

  return {
    bindings: normalizedScripts,
    resolvedScripts,
  };
}

module.exports = {
  REQUEST_SCRIPT_STAGE_IDS,
  REQUEST_SCRIPT_STAGE_FIELD_MAP,
  createInlineRequestScriptBinding,
  createLinkedRequestScriptBinding,
  normalizeRequestScriptStageBinding,
  normalizeRequestScriptsState,
  getRequestScriptStageBinding,
  isLinkedRequestScriptBinding,
  listLinkedRequestScriptStages,
  hasLinkedRequestScriptBindings,
  serializeRequestScriptsForBundle,
  resolveRequestScriptsForExecution,
};
