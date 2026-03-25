const { randomUUID } = require('node:crypto');
const {
  COLLECTION_RESOURCE_SCHEMA_VERSION,
  REQUEST_GROUP_RESOURCE_SCHEMA_VERSION,
  RESOURCE_RECORD_KINDS,
} = require('../shared/constants');

const DEFAULT_WORKSPACE_ID = 'local-workspace';
const DEFAULT_REQUEST_COLLECTION_NAME = 'Saved Requests';
const DEFAULT_REQUEST_GROUP_NAME = 'General';

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeDescription(value) {
  return typeof value === 'string' ? value : '';
}

function createSlug(value, fallback) {
  const normalized = normalizeText(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return normalized || fallback;
}

function createStableCollectionId(workspaceId, collectionName) {
  return `collection-${createSlug(workspaceId || DEFAULT_WORKSPACE_ID, 'workspace')}-${createSlug(collectionName, 'saved-requests')}`;
}

function createStableRequestGroupId(workspaceId, collectionId, groupName, parentRequestGroupId = null) {
  const parentScope = normalizeText(parentRequestGroupId) || 'root';

  return `request-group-${createSlug(workspaceId || DEFAULT_WORKSPACE_ID, 'workspace')}-${createSlug(collectionId, 'collection')}-${createSlug(parentScope, 'root')}-${createSlug(groupName, 'general')}`;
}

function normalizeScopeVariables(rows) {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows
    .map((row) => {
      if (!row || typeof row !== 'object') {
        return null;
      }

      const key = normalizeText(row.key);

      if (!key) {
        return null;
      }

      return {
        id: typeof row.id === 'string' && row.id.trim().length > 0 ? row.id.trim() : randomUUID(),
        key,
        value: typeof row.value === 'string' ? row.value : '',
        isEnabled: row.isEnabled !== false,
      };
    })
    .filter(Boolean);
}

function normalizeAuthDefaults(auth) {
  if (!auth || typeof auth !== 'object' || Array.isArray(auth)) {
    return {
      type: 'none',
      bearerToken: '',
      basicUsername: '',
      basicPassword: '',
      apiKeyName: '',
      apiKeyValue: '',
      apiKeyPlacement: 'header',
    };
  }

  const type = ['none', 'bearer', 'basic', 'api-key'].includes(auth.type) ? auth.type : 'none';

  return {
    type,
    bearerToken: typeof auth.bearerToken === 'string' ? auth.bearerToken : '',
    basicUsername: typeof auth.basicUsername === 'string' ? auth.basicUsername : '',
    basicPassword: typeof auth.basicPassword === 'string' ? auth.basicPassword : '',
    apiKeyName: typeof auth.apiKeyName === 'string' ? auth.apiKeyName : '',
    apiKeyValue: typeof auth.apiKeyValue === 'string' ? auth.apiKeyValue : '',
    apiKeyPlacement: auth.apiKeyPlacement === 'query' ? 'query' : 'header',
  };
}

function normalizeScriptDefaults(scripts) {
  if (!scripts || typeof scripts !== 'object' || Array.isArray(scripts)) {
    return {
      preRequest: '',
      postResponse: '',
      tests: '',
    };
  }

  return {
    preRequest: typeof scripts.preRequest === 'string' ? scripts.preRequest : '',
    postResponse: typeof scripts.postResponse === 'string' ? scripts.postResponse : '',
    tests: typeof scripts.tests === 'string' ? scripts.tests : '',
  };
}

function normalizeRunConfig(runConfig) {
  if (!runConfig || typeof runConfig !== 'object' || Array.isArray(runConfig)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(runConfig)
      .filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value))
      .map(([key, value]) => {
        if (typeof value === 'number') {
          return [key, Number.isFinite(value) ? value : 0];
        }

        return [key, value];
      }),
  );
}

function createCollectionRecord(input, existingRecord, workspaceId = DEFAULT_WORKSPACE_ID) {
  const now = new Date().toISOString();
  const name = normalizeText(input?.name) || DEFAULT_REQUEST_COLLECTION_NAME;

  return {
    resourceKind: RESOURCE_RECORD_KINDS.COLLECTION,
    resourceSchemaVersion: COLLECTION_RESOURCE_SCHEMA_VERSION,
    id: existingRecord?.id || normalizeText(input?.id) || randomUUID(),
    workspaceId: workspaceId || existingRecord?.workspaceId || DEFAULT_WORKSPACE_ID,
    name,
    description: normalizeDescription(input?.description ?? existingRecord?.description),
    variables: normalizeScopeVariables(input?.variables ?? existingRecord?.variables),
    authDefaults: normalizeAuthDefaults(input?.authDefaults ?? existingRecord?.authDefaults),
    scriptDefaults: normalizeScriptDefaults(input?.scriptDefaults ?? existingRecord?.scriptDefaults),
    runConfig: normalizeRunConfig(input?.runConfig ?? existingRecord?.runConfig),
    createdAt: existingRecord?.createdAt || now,
    updatedAt: now,
  };
}

function normalizePersistedCollectionRecord(record) {
  if (!record || typeof record !== 'object') {
    return record;
  }

  return {
    ...record,
    resourceKind: RESOURCE_RECORD_KINDS.COLLECTION,
    resourceSchemaVersion: COLLECTION_RESOURCE_SCHEMA_VERSION,
    workspaceId: normalizeText(record.workspaceId) || DEFAULT_WORKSPACE_ID,
    name: normalizeText(record.name) || DEFAULT_REQUEST_COLLECTION_NAME,
    description: normalizeDescription(record.description),
    variables: normalizeScopeVariables(record.variables),
    authDefaults: normalizeAuthDefaults(record.authDefaults),
    scriptDefaults: normalizeScriptDefaults(record.scriptDefaults),
    runConfig: normalizeRunConfig(record.runConfig),
  };
}

function createRequestGroupRecord(input, existingRecord, workspaceId = DEFAULT_WORKSPACE_ID) {
  const now = new Date().toISOString();
  const name = normalizeText(input?.name) || DEFAULT_REQUEST_GROUP_NAME;
  const collectionId = normalizeText(input?.collectionId ?? existingRecord?.collectionId);
  const parentRequestGroupId = normalizeText(input?.parentRequestGroupId ?? existingRecord?.parentRequestGroupId);

  return {
    resourceKind: RESOURCE_RECORD_KINDS.REQUEST_GROUP,
    resourceSchemaVersion: REQUEST_GROUP_RESOURCE_SCHEMA_VERSION,
    id: existingRecord?.id || normalizeText(input?.id) || randomUUID(),
    workspaceId: workspaceId || existingRecord?.workspaceId || DEFAULT_WORKSPACE_ID,
    collectionId,
    parentRequestGroupId: parentRequestGroupId || null,
    name,
    description: normalizeDescription(input?.description ?? existingRecord?.description),
    variables: normalizeScopeVariables(input?.variables ?? existingRecord?.variables),
    authDefaults: normalizeAuthDefaults(input?.authDefaults ?? existingRecord?.authDefaults),
    scriptDefaults: normalizeScriptDefaults(input?.scriptDefaults ?? existingRecord?.scriptDefaults),
    runConfig: normalizeRunConfig(input?.runConfig ?? existingRecord?.runConfig),
    createdAt: existingRecord?.createdAt || now,
    updatedAt: now,
  };
}

function normalizePersistedRequestGroupRecord(record) {
  if (!record || typeof record !== 'object') {
    return record;
  }

  return {
    ...record,
    resourceKind: RESOURCE_RECORD_KINDS.REQUEST_GROUP,
    resourceSchemaVersion: REQUEST_GROUP_RESOURCE_SCHEMA_VERSION,
    workspaceId: normalizeText(record.workspaceId) || DEFAULT_WORKSPACE_ID,
    collectionId: normalizeText(record.collectionId),
    parentRequestGroupId: normalizeText(record.parentRequestGroupId) || null,
    name: normalizeText(record.name) || DEFAULT_REQUEST_GROUP_NAME,
    description: normalizeDescription(record.description),
    variables: normalizeScopeVariables(record.variables),
    authDefaults: normalizeAuthDefaults(record.authDefaults),
    scriptDefaults: normalizeScriptDefaults(record.scriptDefaults),
    runConfig: normalizeRunConfig(record.runConfig),
  };
}

function compareRequestPlacementRecords(left, right) {
  const nameDiff = String(left?.name || '').localeCompare(String(right?.name || ''));
  if (nameDiff !== 0) {
    return nameDiff;
  }

  return String(left?.id || '').localeCompare(String(right?.id || ''));
}

function validateScopeVariables(variables, scopeLabel) {
  if (variables == null) {
    return null;
  }

  if (!Array.isArray(variables)) {
    return `${scopeLabel} variables must be an array when provided.`;
  }

  for (const row of variables) {
    if (!row || typeof row !== 'object') {
      return `${scopeLabel} variable rows must be objects.`;
    }

    if (typeof row.key !== 'string' || row.key.trim().length === 0) {
      return `${scopeLabel} variable key is required.`;
    }

    if (row.value != null && typeof row.value !== 'string') {
      return `${scopeLabel} variable value must be a string when provided.`;
    }

    if (row.isEnabled != null && typeof row.isEnabled !== 'boolean') {
      return `${scopeLabel} variable isEnabled must be a boolean when provided.`;
    }
  }

  return null;
}

function validateCollectionInput(input) {
  if (!input || typeof input !== 'object') {
    return 'Collection payload is required.';
  }

  if (normalizeText(input.name).length === 0) {
    return 'Collection name is required.';
  }

  if (input.description != null && typeof input.description !== 'string') {
    return 'Collection description must be a string when provided.';
  }

  if (input.authDefaults != null && (typeof input.authDefaults !== 'object' || Array.isArray(input.authDefaults))) {
    return 'Collection authDefaults must be an object when provided.';
  }

  if (input.scriptDefaults != null && (typeof input.scriptDefaults !== 'object' || Array.isArray(input.scriptDefaults))) {
    return 'Collection scriptDefaults must be an object when provided.';
  }

  if (input.runConfig != null && (typeof input.runConfig !== 'object' || Array.isArray(input.runConfig))) {
    return 'Collection runConfig must be an object when provided.';
  }

  return validateScopeVariables(input.variables, 'Collection');
}

function validateRequestGroupInput(input) {
  if (!input || typeof input !== 'object') {
    return 'Request group payload is required.';
  }

  if (normalizeText(input.collectionId).length === 0) {
    return 'Request group collectionId is required.';
  }

  if (normalizeText(input.name).length === 0) {
    return 'Request group name is required.';
  }

  if (input.description != null && typeof input.description !== 'string') {
    return 'Request group description must be a string when provided.';
  }

  if (input.parentRequestGroupId != null && typeof input.parentRequestGroupId !== 'string') {
    return 'Request group parentRequestGroupId must be a string or null when provided.';
  }

  if (input.authDefaults != null && (typeof input.authDefaults !== 'object' || Array.isArray(input.authDefaults))) {
    return 'Request group authDefaults must be an object when provided.';
  }

  if (input.scriptDefaults != null && (typeof input.scriptDefaults !== 'object' || Array.isArray(input.scriptDefaults))) {
    return 'Request group scriptDefaults must be an object when provided.';
  }

  if (input.runConfig != null && (typeof input.runConfig !== 'object' || Array.isArray(input.runConfig))) {
    return 'Request group runConfig must be an object when provided.';
  }

  return validateScopeVariables(input.variables, 'Request group');
}

module.exports = {
  DEFAULT_WORKSPACE_ID,
  DEFAULT_REQUEST_COLLECTION_NAME,
  DEFAULT_REQUEST_GROUP_NAME,
  createCollectionRecord,
  normalizePersistedCollectionRecord,
  createRequestGroupRecord,
  normalizePersistedRequestGroupRecord,
  compareRequestPlacementRecords,
  validateCollectionInput,
  validateRequestGroupInput,
  createStableCollectionId,
  createStableRequestGroupId,
  normalizeScopeVariables,
  normalizeAuthDefaults,
  normalizeScriptDefaults,
  normalizeRunConfig,
};

