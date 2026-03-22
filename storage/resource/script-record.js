const { randomUUID } = require('node:crypto');
const {
  RESOURCE_RECORD_KINDS,
  SCRIPT_RESOURCE_SCHEMA_VERSION,
} = require('../shared/constants');

const DEFAULT_WORKSPACE_ID = 'local-workspace';
const SCRIPT_TYPES = Object.freeze(['pre-request', 'post-response', 'tests']);
const SOURCE_PREVIEW_LIMIT = 140;
const SYSTEM_SCRIPT_TEMPLATES = Object.freeze([
  {
    id: 'template-pre-request-trace-id',
    name: 'Trace ID starter',
    description: 'Adds a deterministic trace header during the pre-request stage.',
    templateType: 'pre-request',
    sourceCode: "// add a trace header\nrequest.headers.set('x-trace-id', 'local-dev-trace');",
    tags: ['starter', 'headers'],
    isSystemTemplate: true,
    createdAt: '2026-03-22T00:00:00.000Z',
    updatedAt: '2026-03-22T00:00:00.000Z',
  },
  {
    id: 'template-post-response-warning',
    name: 'Warn on non-2xx',
    description: 'Emits a warning when the transport response falls outside the success range.',
    templateType: 'post-response',
    sourceCode: "// inspect response after transport\nif (response.status >= 400) {\n  console.warn('review response status');\n}",
    tags: ['starter', 'response'],
    isSystemTemplate: true,
    createdAt: '2026-03-22T00:00:00.000Z',
    updatedAt: '2026-03-22T00:00:00.000Z',
  },
  {
    id: 'template-tests-status',
    name: 'Response status assertion',
    description: 'Asserts the expected response status in the tests stage.',
    templateType: 'tests',
    sourceCode: "// assert expected status\nassert(response.status === 200);",
    tags: ['starter', 'assertion'],
    isSystemTemplate: true,
    createdAt: '2026-03-22T00:00:00.000Z',
    updatedAt: '2026-03-22T00:00:00.000Z',
  },
]);

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeMultilineText(value) {
  return typeof value === 'string' ? value : '';
}

function normalizeScriptType(value) {
  return SCRIPT_TYPES.includes(value) ? value : 'pre-request';
}

function createSourcePreview(sourceCode) {
  const compactSource = normalizeMultilineText(sourceCode).replace(/\s+/g, ' ').trim();
  if (compactSource.length <= SOURCE_PREVIEW_LIMIT) {
    return compactSource;
  }

  return `${compactSource.slice(0, SOURCE_PREVIEW_LIMIT)}…`;
}

function getCapabilitySummary(scriptType) {
  switch (scriptType) {
    case 'post-response':
      return 'Post-response scripts stay read-focused and emit bounded console summaries after transport completes.';
    case 'tests':
      return 'Tests scripts focus on pass/fail assertions and bounded summaries rather than transport mutation.';
    case 'pre-request':
    default:
      return 'Pre-request scripts can use bounded request mutation helpers before transport is sent.';
  }
}

function getDeferredSummary() {
  return 'Request-stage attachment, live shared references, and Monaco-class editor expansion remain deferred.';
}

function summarizeTemplateOrigin(templateId) {
  const template = SYSTEM_SCRIPT_TEMPLATES.find((item) => item.id === templateId);
  return template ? `Created from template: ${template.name}.` : 'Created directly in the scripts library.';
}

function createSavedScriptRecord(input, existingRecord, workspaceId = DEFAULT_WORKSPACE_ID) {
  const now = new Date().toISOString();
  const scriptType = normalizeScriptType(input?.scriptType);
  const templateId = typeof input?.templateId === 'string' && input.templateId.length > 0 ? input.templateId : undefined;
  const baseRecord = {
    id: existingRecord?.id || randomUUID(),
    workspaceId: workspaceId || existingRecord?.workspaceId || DEFAULT_WORKSPACE_ID,
    name: normalizeText(input?.name),
    description: typeof input?.description === 'string' ? input.description : '',
    scriptType,
    sourceCode: normalizeMultilineText(input?.sourceCode),
    ...(templateId ? { templateId } : {}),
    createdAt: existingRecord?.createdAt || now,
    updatedAt: now,
  };

  return {
    ...baseRecord,
    resourceKind: RESOURCE_RECORD_KINDS.SCRIPT,
    resourceSchemaVersion: SCRIPT_RESOURCE_SCHEMA_VERSION,
    sourcePreview: createSourcePreview(baseRecord.sourceCode),
    capabilitySummary: getCapabilitySummary(baseRecord.scriptType),
    deferredSummary: getDeferredSummary(),
    templateSummary: summarizeTemplateOrigin(templateId),
    sourceLabel: 'Persisted workspace script',
  };
}

function normalizePersistedSavedScriptRecord(record) {
  if (!record || typeof record !== 'object') {
    return record;
  }

  const normalizedRecord = {
    ...record,
    resourceKind: RESOURCE_RECORD_KINDS.SCRIPT,
    resourceSchemaVersion: SCRIPT_RESOURCE_SCHEMA_VERSION,
    name: normalizeText(record.name),
    description: typeof record.description === 'string' ? record.description : '',
    scriptType: normalizeScriptType(record.scriptType),
    sourceCode: normalizeMultilineText(record.sourceCode),
  };

  return {
    ...normalizedRecord,
    sourcePreview: createSourcePreview(normalizedRecord.sourceCode),
    capabilitySummary: getCapabilitySummary(normalizedRecord.scriptType),
    deferredSummary: getDeferredSummary(),
    templateSummary: summarizeTemplateOrigin(
      typeof normalizedRecord.templateId === 'string' ? normalizedRecord.templateId : undefined,
    ),
    sourceLabel: 'Persisted workspace script',
  };
}

function compareIsoDescending(left, right) {
  return String(right || '').localeCompare(String(left || ''));
}

function compareSavedScriptRecords(left, right) {
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

function validateSavedScriptInput(input) {
  if (!input || typeof input !== 'object') {
    return 'Saved script payload is required.';
  }

  if (normalizeText(input.name).length === 0) {
    return 'Script name is required.';
  }

  if (!SCRIPT_TYPES.includes(input.scriptType)) {
    return 'Script type must be pre-request, post-response, or tests.';
  }

  if (typeof input.sourceCode !== 'string') {
    return 'Script source code must be a string.';
  }

  if (input.description != null && typeof input.description !== 'string') {
    return 'Script description must be a string when provided.';
  }

  if (input.templateId != null) {
    if (typeof input.templateId !== 'string' || input.templateId.length === 0) {
      return 'Template id must be a non-empty string when provided.';
    }

    if (!SYSTEM_SCRIPT_TEMPLATES.some((item) => item.id === input.templateId)) {
      return `Script template ${input.templateId} was not found.`;
    }
  }

  return null;
}

function listSystemScriptTemplates() {
  return SYSTEM_SCRIPT_TEMPLATES.map((template) => ({
    ...template,
    sourcePreview: createSourcePreview(template.sourceCode),
    capabilitySummary: getCapabilitySummary(template.templateType),
    templateSummary: template.description,
  }));
}

function readSystemScriptTemplate(templateId) {
  return listSystemScriptTemplates().find((template) => template.id === templateId) ?? null;
}

module.exports = {
  DEFAULT_WORKSPACE_ID,
  SCRIPT_TYPES,
  SYSTEM_SCRIPT_TEMPLATES,
  createSavedScriptRecord,
  normalizePersistedSavedScriptRecord,
  compareSavedScriptRecords,
  validateSavedScriptInput,
  listSystemScriptTemplates,
  readSystemScriptTemplate,
};
