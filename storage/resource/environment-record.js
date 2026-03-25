const { randomUUID } = require('node:crypto');
const {
  ENVIRONMENT_RESOURCE_SCHEMA_VERSION,
  RESOURCE_RECORD_KINDS,
} = require('../shared/constants');

const DEFAULT_WORKSPACE_ID = 'local-workspace';
const ALLOWED_ENVIRONMENT_VALUE_TYPES = new Set(['plain', 'number', 'boolean', 'json']);

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeDescription(value) {
  return typeof value === 'string' ? value : '';
}

function normalizeValue(value) {
  return typeof value === 'string' ? value : '';
}

function countLegacySecretRows(rows) {
  return Array.isArray(rows)
    ? rows.filter((row) => row?.isSecret === true && normalizeValue(row?.value).length > 0).length
    : 0;
}

function readLegacySecretRowCount(record) {
  if (Number.isFinite(record?.legacySecretRowCount)) {
    return Math.max(0, Math.trunc(record.legacySecretRowCount));
  }

  return countLegacySecretRows(record?.variables);
}

function createVariableId(index, id) {
  return typeof id === 'string' && id.length > 0 ? id : `environment-variable-${index}-${randomUUID()}`;
}

function createResolutionSummary(variableCount, secretVariableCount) {
  return variableCount === 0
    ? 'No variables are stored yet. Saved requests can select this environment at run time.'
    : `${variableCount} variable${variableCount === 1 ? '' : 's'} are managed here, including ${secretVariableCount} secret-backed entr${secretVariableCount === 1 ? 'y' : 'ies'}. Plain placeholders resolve at run time, while secret rows stay write-only until a secure backend is available.`;
}

function cloneVariablesForPersistence(rows, existingRecord) {
  const now = new Date().toISOString();
  const existingVariablesById = new Map(
    Array.isArray(existingRecord?.variables)
      ? existingRecord.variables
        .filter((row) => row && typeof row === 'object' && typeof row.id === 'string')
        .map((row) => [row.id, row])
      : [],
  );

  return Array.isArray(rows)
    ? rows.map((row, index) => {
      const existingVariable = typeof row?.id === 'string' ? existingVariablesById.get(row.id) : null;
      const isSecret = row?.isSecret === true;
      const replacementValue = normalizeValue(row?.replacementValue);
      const clearStoredValue = row?.clearStoredValue === true;
      const existingHasStoredValue = existingVariable?.isSecret === true
        ? existingVariable.hasStoredValue === true || normalizeValue(existingVariable.value).length > 0
        : false;

      let storedValue = '';
      let hasStoredValue = false;
      if (isSecret) {
        storedValue = '';
        hasStoredValue = clearStoredValue
          ? false
          : replacementValue.length > 0 || existingHasStoredValue;
      } else if (typeof row?.value === 'string') {
        storedValue = row.value;
      } else if (existingVariable && existingVariable.isSecret !== true) {
        storedValue = normalizeValue(existingVariable.value);
      }

      return {
        id: createVariableId(index, row?.id),
        key: normalizeText(row?.key),
        description: normalizeDescription(row?.description),
        isEnabled: row?.isEnabled !== false,
        isSecret,
        valueType: ALLOWED_ENVIRONMENT_VALUE_TYPES.has(row?.valueType) ? row.valueType : 'plain',
        value: storedValue,
        hasStoredValue,
        createdAt: existingVariable?.createdAt || now,
        updatedAt: now,
      };
    })
    : [];
}

function summarizeEnvironmentRecord(record) {
  const variables = Array.isArray(record.variables) ? record.variables : [];
  const variableCount = variables.length;
  const enabledVariableCount = variables.filter((row) => row.isEnabled !== false).length;
  const secretVariableCount = variables.filter((row) => row.isSecret === true).length;

  return {
    variableCount,
    enabledVariableCount,
    secretVariableCount,
    resolutionSummary: createResolutionSummary(variableCount, secretVariableCount),
  };
}

function enforceEnvironmentDefaults(records, preferredEnvironmentId) {
  const normalizedRecords = Array.isArray(records)
    ? records.map((record) => normalizePersistedEnvironmentRecord(record))
    : [];

  if (normalizedRecords.length === 0) {
    return [];
  }

  const fallbackDefaultId = [...normalizedRecords]
    .sort(compareEnvironmentRecords)[0]?.id;
  const existingDefaultId = normalizedRecords.find((record) => record.isDefault === true)?.id;
  const defaultEnvironmentId = (
    typeof preferredEnvironmentId === 'string'
    && normalizedRecords.some((record) => record.id === preferredEnvironmentId)
      ? preferredEnvironmentId
      : existingDefaultId || fallbackDefaultId
  );

  return normalizedRecords.map((record) => normalizePersistedEnvironmentRecord({
    ...record,
    isDefault: record.id === defaultEnvironmentId,
  }));
}

function summarizePresentedEnvironmentRecord(record) {
  const presentedRecord = presentEnvironmentRecord(record);

  if (!presentedRecord || typeof presentedRecord !== 'object') {
    return presentedRecord;
  }

  const summaryRecord = { ...presentedRecord };
  delete summaryRecord.variables;
  return summaryRecord;
}

function createEnvironmentRecord(input, existingRecord, workspaceId = DEFAULT_WORKSPACE_ID) {
  const now = new Date().toISOString();
  const variables = cloneVariablesForPersistence(input?.variables, existingRecord);
  const baseRecord = {
    id: existingRecord?.id || randomUUID(),
    workspaceId: workspaceId || existingRecord?.workspaceId || DEFAULT_WORKSPACE_ID,
    name: normalizeText(input?.name),
    description: normalizeDescription(input?.description),
    isDefault: input?.isDefault === true,
    variables,
    createdAt: existingRecord?.createdAt || now,
    updatedAt: now,
  };

  return {
    ...baseRecord,
    resourceKind: RESOURCE_RECORD_KINDS.ENVIRONMENT,
    resourceSchemaVersion: ENVIRONMENT_RESOURCE_SCHEMA_VERSION,
    ...summarizeEnvironmentRecord(baseRecord),
  };
}

function normalizePersistedEnvironmentRecord(record) {
  if (!record || typeof record !== 'object') {
    return record;
  }

  const normalizedVariables = Array.isArray(record.variables)
    ? record.variables.map((row, index) => ({
      id: createVariableId(index, row?.id),
      key: normalizeText(row?.key),
      description: normalizeDescription(row?.description),
      isEnabled: row?.isEnabled !== false,
      isSecret: row?.isSecret === true,
      valueType: ALLOWED_ENVIRONMENT_VALUE_TYPES.has(row?.valueType) ? row.valueType : 'plain',
      value: row?.isSecret === true ? '' : normalizeValue(row?.value),
      hasStoredValue: row?.isSecret === true
        ? row?.hasStoredValue === true || normalizeValue(row?.value).length > 0
        : false,
      createdAt: typeof row?.createdAt === 'string' ? row.createdAt : record.createdAt,
      updatedAt: typeof row?.updatedAt === 'string' ? row.updatedAt : record.updatedAt,
    }))
    : [];

  const normalizedRecord = {
    id: typeof record.id === 'string' ? record.id : randomUUID(),
    workspaceId: typeof record.workspaceId === 'string' && record.workspaceId.length > 0
      ? record.workspaceId
      : DEFAULT_WORKSPACE_ID,
    createdAt: typeof record.createdAt === 'string' ? record.createdAt : new Date().toISOString(),
    updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : new Date().toISOString(),
    resourceKind: RESOURCE_RECORD_KINDS.ENVIRONMENT,
    resourceSchemaVersion: ENVIRONMENT_RESOURCE_SCHEMA_VERSION,
    name: normalizeText(record.name),
    description: normalizeDescription(record.description),
    isDefault: record.isDefault === true,
    variables: normalizedVariables,
  };

  return {
    ...normalizedRecord,
    ...summarizeEnvironmentRecord(normalizedRecord),
  };
}

function presentEnvironmentRecord(record) {
  const normalizedRecord = normalizePersistedEnvironmentRecord(record);
  const legacySecretRowCount = readLegacySecretRowCount(record);

  if (!normalizedRecord || typeof normalizedRecord !== 'object') {
    return normalizedRecord;
  }

  return {
    ...normalizedRecord,
    legacySecretRowCount,
    variables: Array.isArray(normalizedRecord.variables)
      ? normalizedRecord.variables.map((row) => ({
        id: row.id,
        key: row.key,
        description: row.description,
        isEnabled: row.isEnabled !== false,
        isSecret: row.isSecret === true,
        valueType: ALLOWED_ENVIRONMENT_VALUE_TYPES.has(row.valueType) ? row.valueType : 'plain',
        value: row.isSecret === true ? '' : normalizeValue(row.value),
        hasStoredValue: row.isSecret === true ? row.hasStoredValue === true : false,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }))
      : [],
  };
}

function compareIsoDescending(left, right) {
  return String(right || '').localeCompare(String(left || ''));
}

function compareEnvironmentRecords(left, right) {
  if (Boolean(left.isDefault) !== Boolean(right.isDefault)) {
    return left.isDefault ? -1 : 1;
  }

  const updatedAtDiff = compareIsoDescending(left.updatedAt, right.updatedAt);
  if (updatedAtDiff !== 0) {
    return updatedAtDiff;
  }

  const createdAtDiff = compareIsoDescending(left.createdAt, right.createdAt);
  if (createdAtDiff !== 0) {
    return createdAtDiff;
  }

  const nameDiff = String(left.name || '').localeCompare(String(right.name || ''));
  if (nameDiff !== 0) {
    return nameDiff;
  }

  return String(left.id || '').localeCompare(String(right.id || ''));
}

function validateEnvironmentInput(input) {
  if (!input || typeof input !== 'object') {
    return 'Environment payload is required.';
  }

  if (normalizeText(input.name).length === 0) {
    return 'Environment name is required.';
  }

  if (input.description != null && typeof input.description !== 'string') {
    return 'Environment description must be a string when provided.';
  }

  if (input.variables != null && !Array.isArray(input.variables)) {
    return 'Environment variables must be an array.';
  }

  const seenKeys = new Set();
  for (const row of Array.isArray(input.variables) ? input.variables : []) {
    const key = normalizeText(row?.key);
    if (key.length === 0) {
      return 'Environment variable key is required.';
    }

    const normalizedKey = key.toLowerCase();
    if (seenKeys.has(normalizedKey)) {
      return `Environment variable key "${key}" is duplicated.`;
    }
    seenKeys.add(normalizedKey);

    if (!ALLOWED_ENVIRONMENT_VALUE_TYPES.has(row?.valueType)) {
      return 'Environment variable value type is invalid.';
    }

    if (row?.description != null && typeof row.description !== 'string') {
      return `Environment variable "${key}" description must be a string.`;
    }

    if (row?.isSecret !== true && row?.value != null && typeof row.value !== 'string') {
      return `Environment variable "${key}" value must be a string.`;
    }

    if (row?.isSecret === true && row?.replacementValue != null && typeof row.replacementValue !== 'string') {
      return `Environment variable "${key}" replacement value must be a string.`;
    }
  }

  return null;
}

module.exports = {
  DEFAULT_WORKSPACE_ID,
  ALLOWED_ENVIRONMENT_VALUE_TYPES,
  countLegacySecretRows,
  createEnvironmentRecord,
  enforceEnvironmentDefaults,
  normalizePersistedEnvironmentRecord,
  presentEnvironmentRecord,
  summarizePresentedEnvironmentRecord,
  compareEnvironmentRecords,
  validateEnvironmentInput,
};
