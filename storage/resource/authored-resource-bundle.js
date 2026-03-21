const {
  AUTHORED_RESOURCE_BUNDLE_KIND,
  AUTHORED_RESOURCE_BUNDLE_SCHEMA_VERSION,
  MOCK_RULE_RESOURCE_SCHEMA_VERSION,
  REQUEST_RESOURCE_SCHEMA_VERSION,
  RESOURCE_RECORD_KINDS,
} = require('../shared/constants');

function createBundleError(code, message, details = {}) {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  return error;
}

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function validateBundledResourceRecord(record, options) {
  const {
    arrayName,
    expectedKind,
    supportedSchemaVersion,
  } = options;

  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    throw createBundleError(
      'resource_bundle_invalid_resource',
      `Import file contains a malformed ${arrayName} entry.`,
      { arrayName },
    );
  }

  if (typeof record.resourceKind === 'string' && record.resourceKind !== expectedKind) {
    throw createBundleError(
      'resource_bundle_unsupported_resource_kind',
      `Import file contains a ${arrayName} entry with unsupported resource kind "${record.resourceKind}".`,
      {
        arrayName,
        resourceKind: record.resourceKind,
        expectedResourceKind: expectedKind,
      },
    );
  }

  if (record.resourceSchemaVersion != null && record.resourceSchemaVersion !== supportedSchemaVersion) {
    throw createBundleError(
      'resource_bundle_unsupported_resource_schema',
      `Import file contains a ${arrayName} entry with unsupported resource schema version ${record.resourceSchemaVersion}.`,
      {
        arrayName,
        resourceSchemaVersion: record.resourceSchemaVersion,
        supportedSchemaVersion,
      },
    );
  }
}

function validateBundledResourceArray(records, options) {
  for (const record of records) {
    validateBundledResourceRecord(record, options);
  }
}

function buildAuthoredResourceBundle({ workspaceId, requests, mockRules, exportedAt = new Date().toISOString() }) {
  return {
    schemaVersion: AUTHORED_RESOURCE_BUNDLE_SCHEMA_VERSION,
    resourceKind: AUTHORED_RESOURCE_BUNDLE_KIND,
    exportedAt,
    workspaceId,
    requests: cloneValue(Array.isArray(requests) ? requests : []),
    mockRules: cloneValue(Array.isArray(mockRules) ? mockRules : []),
  };
}

function validateAuthoredResourceBundlePayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw createBundleError('resource_bundle_invalid_shape', 'Import file must contain a JSON object bundle.');
  }

  if (payload.resourceKind !== AUTHORED_RESOURCE_BUNDLE_KIND) {
    throw createBundleError(
      'resource_bundle_unsupported_kind',
      'Import file is not an authored resource bundle exported by this app.',
      { resourceKind: payload.resourceKind },
    );
  }

  if (payload.schemaVersion !== AUTHORED_RESOURCE_BUNDLE_SCHEMA_VERSION) {
    throw createBundleError(
      'resource_bundle_unsupported_schema',
      `Schema version ${payload.schemaVersion} is not supported for import.`,
      { schemaVersion: payload.schemaVersion },
    );
  }

  if (typeof payload.exportedAt !== 'string' || payload.exportedAt.trim().length === 0) {
    throw createBundleError(
      'resource_bundle_invalid_exported_at',
      'Import file must include an exportedAt timestamp.',
    );
  }

  if (typeof payload.workspaceId !== 'string' || payload.workspaceId.trim().length === 0) {
    throw createBundleError(
      'resource_bundle_invalid_workspace',
      'Import file must include a workspaceId hint.',
    );
  }

  if (!Array.isArray(payload.requests)) {
    throw createBundleError('resource_bundle_invalid_requests', 'Import file must include a requests array.');
  }

  if (!Array.isArray(payload.mockRules)) {
    throw createBundleError('resource_bundle_invalid_mock_rules', 'Import file must include a mockRules array.');
  }

  validateBundledResourceArray(payload.requests, {
    arrayName: 'request',
    expectedKind: RESOURCE_RECORD_KINDS.REQUEST,
    supportedSchemaVersion: REQUEST_RESOURCE_SCHEMA_VERSION,
  });
  validateBundledResourceArray(payload.mockRules, {
    arrayName: 'mock-rule',
    expectedKind: RESOURCE_RECORD_KINDS.MOCK_RULE,
    supportedSchemaVersion: MOCK_RULE_RESOURCE_SCHEMA_VERSION,
  });

  return payload;
}

function parseAuthoredResourceBundleText(bundleText) {
  if (typeof bundleText !== 'string' || bundleText.trim().length === 0) {
    throw createBundleError('resource_bundle_invalid_json', 'Import file must contain JSON text.');
  }

  let payload;
  try {
    payload = JSON.parse(bundleText);
  } catch {
    throw createBundleError('resource_bundle_invalid_json', 'Import file is not valid JSON.');
  }

  return validateAuthoredResourceBundlePayload(payload);
}

function createImportedResourceName(name, usedNames) {
  const baseName = typeof name === 'string' && name.trim().length > 0 ? name.trim() : 'Imported resource';
  const normalizedNames = usedNames || new Set();
  const normalizedBaseName = baseName.toLowerCase();

  if (!normalizedNames.has(normalizedBaseName)) {
    normalizedNames.add(normalizedBaseName);
    return baseName;
  }

  let suffixIndex = 1;
  while (true) {
    const nextName = suffixIndex === 1 ? `${baseName} (Imported)` : `${baseName} (Imported ${suffixIndex})`;
    const normalizedNextName = nextName.toLowerCase();

    if (!normalizedNames.has(normalizedNextName)) {
      normalizedNames.add(normalizedNextName);
      return nextName;
    }

    suffixIndex += 1;
  }
}

module.exports = {
  AUTHORED_RESOURCE_BUNDLE_KIND,
  AUTHORED_RESOURCE_BUNDLE_SCHEMA_VERSION,
  buildAuthoredResourceBundle,
  validateAuthoredResourceBundlePayload,
  parseAuthoredResourceBundleText,
  createImportedResourceName,
  validateBundledResourceRecord,
};
