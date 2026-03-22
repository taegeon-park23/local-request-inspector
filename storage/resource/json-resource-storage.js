const fs = require('fs');
const path = require('path');
const {
  classifyExactValueCompatibility,
  classifySchemaVersion,
  createCompatibilityError,
  createCompatibilityIssue,
  createCompatibilityReport,
} = require('../shared/compatibility');
const {
  AUTHORED_RESOURCE_BUNDLE_SCHEMA_VERSION,
  MOCK_RULE_RESOURCE_SCHEMA_VERSION,
  REQUEST_RESOURCE_SCHEMA_VERSION,
  RESOURCE_ENTITY_TYPES,
  RESOURCE_MANIFEST_SCHEMA_VERSION,
  RESOURCE_STORAGE_KIND,
  STORAGE_COMPATIBILITY_STATES,
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

function readJsonFileState(filePath) {
  if (!fs.existsSync(filePath)) {
    return {
      status: 'missing',
      value: null,
    };
  }

  try {
    return {
      status: 'ok',
      value: JSON.parse(fs.readFileSync(filePath, 'utf8')),
    };
  } catch (error) {
    return {
      status: 'invalid-json',
      value: null,
      error,
    };
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
      compatibilityState: STORAGE_COMPATIBILITY_STATES.MALFORMED_DATA,
      entityType,
      filePath,
    };
    throw wrappedError;
  }
}

function inspectResourceManifestCompatibility(manifestState) {
  if (!manifestState || manifestState.status === 'missing') {
    return createCompatibilityReport([
      createCompatibilityIssue({
        state: STORAGE_COMPATIBILITY_STATES.BOOTSTRAP_RECOVERABLE,
        code: 'resource_manifest_missing',
        message: 'Resource manifest is missing and can be bootstrapped safely.',
      }),
    ]);
  }

  if (manifestState.status === 'invalid-json') {
    return createCompatibilityReport([
      createCompatibilityIssue({
        state: STORAGE_COMPATIBILITY_STATES.BOOTSTRAP_RECOVERABLE,
        code: 'resource_manifest_malformed',
        message: 'Resource manifest is malformed and can be regenerated safely.',
      }),
    ]);
  }

  if (!manifestState.value || typeof manifestState.value !== 'object' || Array.isArray(manifestState.value)) {
    return createCompatibilityReport([
      createCompatibilityIssue({
        state: STORAGE_COMPATIBILITY_STATES.BOOTSTRAP_RECOVERABLE,
        code: 'resource_manifest_invalid_shape',
        message: 'Resource manifest shape is invalid and can be regenerated safely.',
      }),
    ]);
  }

  const manifest = manifestState.value;
  const issues = [
    classifySchemaVersion({
      subject: 'Resource manifest schemaVersion',
      currentVersion: manifest.schemaVersion,
      supportedVersion: RESOURCE_MANIFEST_SCHEMA_VERSION,
      missingCode: 'resource_manifest_schema_missing',
      malformedCode: 'resource_manifest_schema_malformed',
      migrationNeededCode: 'resource_manifest_migration_needed',
      unsupportedCode: 'resource_manifest_unsupported_version',
    }),
    classifyExactValueCompatibility({
      subject: 'Resource manifest storageKind',
      currentValue: manifest.storageKind,
      expectedValue: RESOURCE_STORAGE_KIND,
      missingCode: 'resource_manifest_storage_kind_missing',
      incompatibleCode: 'resource_manifest_storage_kind_incompatible',
    }),
  ];

  if (!manifest.recordSchemaVersions || typeof manifest.recordSchemaVersions !== 'object' || Array.isArray(manifest.recordSchemaVersions)) {
    issues.push(createCompatibilityIssue({
      state: STORAGE_COMPATIBILITY_STATES.BOOTSTRAP_RECOVERABLE,
      code: 'resource_manifest_record_versions_missing',
      message: 'Resource manifest recordSchemaVersions is missing and can be regenerated safely.',
    }));
  }

  if (manifest.bundleSchemaVersion == null) {
    issues.push(createCompatibilityIssue({
      state: STORAGE_COMPATIBILITY_STATES.BOOTSTRAP_RECOVERABLE,
      code: 'resource_manifest_bundle_schema_missing',
      message: 'Resource manifest bundleSchemaVersion is missing and can be regenerated safely.',
    }));
  }

  return createCompatibilityReport(issues);
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

    const manifestCompatibility = inspectResourceManifestCompatibility(
      readJsonFileState(this.layout.resourceManifestPath),
    );

    if (manifestCompatibility.state === STORAGE_COMPATIBILITY_STATES.BOOTSTRAP_RECOVERABLE) {
      fs.writeFileSync(
        this.layout.resourceManifestPath,
        serializeJsonDeterministically(buildResourceManifestPayload()),
      );
      return;
    }

    if (manifestCompatibility.state !== STORAGE_COMPATIBILITY_STATES.READ_COMPATIBLE) {
      throw createCompatibilityError(manifestCompatibility, {
        manifestPath: this.layout.resourceManifestPath,
      });
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
  readJsonFileState,
  inspectResourceManifestCompatibility,
};
