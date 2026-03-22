const assert = require('node:assert/strict');
const {
  createSavedScriptRecord,
  normalizePersistedSavedScriptRecord,
  compareSavedScriptRecords,
  validateSavedScriptInput,
  listSystemScriptTemplates,
  readSystemScriptTemplate,
} = require('./script-record');

(function run() {
  assert.equal(validateSavedScriptInput(null), 'Saved script payload is required.');
  assert.equal(
    validateSavedScriptInput({
      name: 'Bad',
      description: '',
      scriptType: 'unknown',
      sourceCode: '',
    }),
    'Script type must be pre-request, post-response, or tests.',
  );

  const templates = listSystemScriptTemplates();
  assert.equal(templates.length >= 3, true);
  assert.equal(readSystemScriptTemplate('template-tests-status')?.templateType, 'tests');

  const created = createSavedScriptRecord({
    name: 'Health check assertions',
    description: 'Bounded request library entry',
    scriptType: 'tests',
    sourceCode: 'assert(response.status === 200);',
    templateId: 'template-tests-status',
  });

  assert.equal(created.scriptType, 'tests');
  assert.equal(created.templateSummary, 'Created from template: Response status assertion.');
  assert.equal(created.sourceLabel, 'Persisted workspace script');

  const normalized = normalizePersistedSavedScriptRecord({
    ...created,
    scriptType: 'tests',
  });
  assert.equal(normalized.capabilitySummary.includes('pass/fail assertions'), true);

  const sorted = [
    createSavedScriptRecord({
      name: 'B script',
      description: '',
      scriptType: 'pre-request',
      sourceCode: '',
    }),
    createSavedScriptRecord({
      name: 'A script',
      description: '',
      scriptType: 'pre-request',
      sourceCode: '',
    }),
  ].sort(compareSavedScriptRecords);
  assert.equal(sorted.length, 2);
})();
