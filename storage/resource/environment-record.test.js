const assert = require('node:assert/strict');
const {
  countLegacySecretRows,
  createEnvironmentRecord,
  enforceEnvironmentDefaults,
  presentEnvironmentRecord,
  compareEnvironmentRecords,
  validateEnvironmentInput,
} = require('./environment-record');

(function run() {
  assert.equal(validateEnvironmentInput(null), 'Environment payload is required.');
  assert.equal(
    validateEnvironmentInput({
      name: 'Local',
      description: '',
      variables: [
        {
          key: ' API_BASE ',
          description: '',
          isEnabled: true,
          isSecret: false,
          valueType: 'plain',
          value: 'http://localhost:5671',
        },
        {
          key: 'api_base',
          description: '',
          isEnabled: true,
          isSecret: false,
          valueType: 'plain',
          value: 'http://localhost:9999',
        },
      ],
    }),
    'Environment variable key "api_base" is duplicated.',
  );

  const created = createEnvironmentRecord({
    name: 'Local API',
    description: 'Primary local defaults',
    isDefault: true,
    variables: [
      {
        key: 'API_BASE',
        description: 'Base URL',
        isEnabled: true,
        isSecret: false,
        valueType: 'plain',
        value: 'http://localhost:5671',
      },
      {
        key: 'API_TOKEN',
        description: 'Masked token',
        isEnabled: true,
        isSecret: true,
        valueType: 'plain',
        replacementValue: 'secret-token',
      },
    ],
  });

  assert.equal(created.isDefault, true);
  assert.equal(created.variableCount, 2);
  assert.equal(created.secretVariableCount, 1);
  assert.equal(created.variables[1].value, '');
  assert.equal(created.variables[1].hasStoredValue, true);
  assert.equal(
    created.resolutionSummary,
    '2 variables are managed here, including 1 secret-backed entry. Plain placeholders resolve at run time, while secret rows stay write-only until a secure backend is available.',
  );

  const presented = presentEnvironmentRecord(created);
  assert.equal(presented.variables[0].value, 'http://localhost:5671');
  assert.equal(presented.variables[1].value, '');
  assert.equal(presented.variables[1].hasStoredValue, true);
  assert.equal(presented.legacySecretRowCount, 0);

  const legacyPresented = presentEnvironmentRecord({
    ...created,
    variables: [
      created.variables[0],
      {
        ...created.variables[1],
        value: 'legacy-secret',
        hasStoredValue: false,
      },
    ],
  });
  assert.equal(countLegacySecretRows(legacyPresented.variables), 0);
  assert.equal(legacyPresented.legacySecretRowCount, 1);
  assert.equal(legacyPresented.variables[1].value, '');
  assert.equal(legacyPresented.variables[1].hasStoredValue, true);

  const updated = createEnvironmentRecord({
    name: 'Local API',
    description: 'Updated defaults',
    isDefault: false,
    variables: [
      {
        id: created.variables[0].id,
        key: 'API_BASE',
        description: 'Updated base URL',
        isEnabled: true,
        isSecret: false,
        valueType: 'plain',
        value: 'http://localhost:7777',
      },
      {
        id: created.variables[1].id,
        key: 'API_TOKEN',
        description: 'Cleared token',
        isEnabled: true,
        isSecret: true,
        valueType: 'plain',
        clearStoredValue: true,
      },
    ],
  }, created);

  assert.equal(updated.variables[0].value, 'http://localhost:7777');
  assert.equal(updated.variables[1].value, '');
  assert.equal(presentEnvironmentRecord(updated).variables[1].hasStoredValue, false);

  const sortRecords = [
    createEnvironmentRecord({ name: 'Secondary', description: '', isDefault: false, variables: [] }),
    createEnvironmentRecord({ name: 'Primary', description: '', isDefault: true, variables: [] }),
  ].sort(compareEnvironmentRecords);
  assert.equal(sortRecords[0].name, 'Primary');

  const localRecord = createEnvironmentRecord({ name: 'Local', description: '', isDefault: false, variables: [] });
  const stageRecord = createEnvironmentRecord({ name: 'Stage', description: '', isDefault: false, variables: [] });
  const fallbackDefaultRecords = enforceEnvironmentDefaults([localRecord, stageRecord]);
  assert.equal(fallbackDefaultRecords.filter((record) => record.isDefault === true).length, 1);

  const promotedDefaultRecords = enforceEnvironmentDefaults(
    [
      { ...localRecord, isDefault: true },
      { ...stageRecord, isDefault: false },
    ],
    stageRecord.id,
  );
  assert.equal(promotedDefaultRecords.filter((record) => record.isDefault === true).length, 1);
  assert.equal(promotedDefaultRecords.find((record) => record.id === stageRecord.id)?.isDefault, true);
})();
