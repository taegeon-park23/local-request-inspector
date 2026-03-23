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

function createStableRequestGroupId(workspaceId, collectionId, groupName) {
  return `request-group-${createSlug(workspaceId || DEFAULT_WORKSPACE_ID, 'workspace')}-${createSlug(collectionId, 'collection')}-${createSlug(groupName, 'general')}`;
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
  };
}

function createRequestGroupRecord(input, existingRecord, workspaceId = DEFAULT_WORKSPACE_ID) {
  const now = new Date().toISOString();
  const name = normalizeText(input?.name) || DEFAULT_REQUEST_GROUP_NAME;
  const collectionId = normalizeText(input?.collectionId ?? existingRecord?.collectionId);

  return {
    resourceKind: RESOURCE_RECORD_KINDS.REQUEST_GROUP,
    resourceSchemaVersion: REQUEST_GROUP_RESOURCE_SCHEMA_VERSION,
    id: existingRecord?.id || normalizeText(input?.id) || randomUUID(),
    workspaceId: workspaceId || existingRecord?.workspaceId || DEFAULT_WORKSPACE_ID,
    collectionId,
    name,
    description: normalizeDescription(input?.description ?? existingRecord?.description),
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
    name: normalizeText(record.name) || DEFAULT_REQUEST_GROUP_NAME,
    description: normalizeDescription(record.description),
  };
}

function compareRequestPlacementRecords(left, right) {
  const nameDiff = String(left?.name || '').localeCompare(String(right?.name || ''));
  if (nameDiff !== 0) {
    return nameDiff;
  }

  return String(left?.id || '').localeCompare(String(right?.id || ''));
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

  return null;
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

  return null;
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
};
