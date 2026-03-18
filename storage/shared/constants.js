const RESOURCE_ENTITY_TYPES = Object.freeze([
  'workspace',
  'collection',
  'folder',
  'request',
  'environment',
  'script',
  'mock-rule',
]);

const RUNTIME_TABLES = Object.freeze([
  'captured_requests',
  'execution_histories',
  'execution_results',
  'test_results',
]);

const STORAGE_SCHEMA_VERSION = 1;

module.exports = {
  RESOURCE_ENTITY_TYPES,
  RUNTIME_TABLES,
  STORAGE_SCHEMA_VERSION,
};
