const fs = require('fs');
const path = require('path');
const {
  AUTHORED_RESOURCE_BUNDLE_SCHEMA_VERSION,
  MOCK_RULE_RESOURCE_SCHEMA_VERSION,
  REQUEST_RESOURCE_SCHEMA_VERSION,
  RESOURCE_ENTITY_TYPES,
  RESOURCE_MANIFEST_SCHEMA_VERSION,
  RESOURCE_STORAGE_KIND,
} = require('../shared/constants');

function sortJsonValue(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => sortJsonValue(entry));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.keys(value)
    .sort((left, right) => left.localeCompare(right))
    .reduce((accumulator, key) => {
      accumulator[key] = sortJsonValue(value[key]);
      return accumulator;
    }, {});
}

function serializeJsonDeterministically(value) {
  return JSON.stringify(sortJsonValue(value), null, 2);
}

function buildResourceManifestPayload() {
  return {
    schemaVersion: RESOURCE_MANIFEST_SCHEMA_VERSION,
    storageKind: RESOURCE_STORAGE_KIND,
    entityTypes: RESOURCE_ENTITY_TYPES,
    recordSchemaVersions: {
      request: REQUEST_RESOURCE_SCHEMA_VERSION,
      'mock-rule': MOCK_RULE_RESOURCE_SCHEMA_VERSION,
    },
    bundleSchemaVersion: AUTHORED_RESOURCE_BUNDLE_SCHEMA_VERSION,
    note: 'Bootstrap manifest for JSON resource storage. Authored resource files are canonical here. Runtime observation artifacts belong in the SQLite runtime lane.',
    updatedAt: new Date().toISOString(),
  };
}

function readJsonFileSafely(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function parseResourceRecordFile(entityType, filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    const wrappedError = new Error(
      `Resource record ${path.basename(filePath)} in ${entityType} storage is not valid JSON.`,
    );
    wrappedError.code = 'resource_record_invalid_json';
    wrappedError.cause = error;
    wrappedError.details = {
      entityType,
      filePath,
    };
    throw wrappedError;
  }
}

class JsonResourceStorage {
  constructor(options) {
    this.layout = options.layout;
  }

  ensureStructure() {
    fs.mkdirSync(this.layout.metadataDir, { recursive: true });
    fs.mkdirSync(this.layout.resourcesDir, { recursive: true });

    for (const entityType of RESOURCE_ENTITY_TYPES) {
      fs.mkdirSync(path.join(this.layout.resourcesDir, entityType), {
        recursive: true,
      });
    }

    const existingManifest = readJsonFileSafely(this.layout.resourceManifestPath);
    const hasCompatibleManifest = Boolean(
      existingManifest
      && existingManifest.schemaVersion === RESOURCE_MANIFEST_SCHEMA_VERSION
      && existingManifest.storageKind === RESOURCE_STORAGE_KIND,
    );

    if (!hasCompatibleManifest) {
      fs.writeFileSync(
        this.layout.resourceManifestPath,
        serializeJsonDeterministically(buildResourceManifestPayload()),
      );
    }
  }

  getEntityPath(entityType, entityId) {
    if (!RESOURCE_ENTITY_TYPES.includes(entityType)) {
      throw new Error(`Unsupported resource entity type: ${entityType}`);
    }

    return path.join(this.layout.resourcesDir, entityType, `${entityId}.json`);
  }

  save(entityType, entity) {
    if (!entity || !entity.id) {
      throw new Error('Resource entity must include an id field.');
    }

    const entityPath = this.getEntityPath(entityType, entity.id);
    fs.writeFileSync(entityPath, serializeJsonDeterministically(entity));
    return entityPath;
  }

  read(entityType, entityId) {
    const entityPath = this.getEntityPath(entityType, entityId);
    if (!fs.existsSync(entityPath)) {
      return null;
    }

    return parseResourceRecordFile(entityType, entityPath);
  }

  delete(entityType, entityId) {
    const entityPath = this.getEntityPath(entityType, entityId);

    if (!fs.existsSync(entityPath)) {
      return false;
    }

    fs.unlinkSync(entityPath);
    return true;
  }

  list(entityType) {
    if (!RESOURCE_ENTITY_TYPES.includes(entityType)) {
      throw new Error(`Unsupported resource entity type: ${entityType}`);
    }

    const entityDir = path.join(this.layout.resourcesDir, entityType);

    if (!fs.existsSync(entityDir)) {
      return [];
    }

    return fs
      .readdirSync(entityDir)
      .filter((fileName) => fileName.endsWith('.json'))
      .sort((left, right) => left.localeCompare(right))
      .map((fileName) => parseResourceRecordFile(entityType, path.join(entityDir, fileName)));
  }
}

module.exports = {
  JsonResourceStorage,
  buildResourceManifestPayload,
  serializeJsonDeterministically,
};
