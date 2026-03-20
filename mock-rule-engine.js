const { randomUUID } = require('node:crypto');

const DEFAULT_WORKSPACE_ID = 'local-workspace';
const MAX_MOCK_DELAY_MS = 2000;
const RESPONSE_PREVIEW_LIMIT = 400;

const ALLOWED_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
const ALLOWED_METHOD_MODES = new Set(['any', 'exact']);
const ALLOWED_PATH_MODES = new Set(['exact', 'prefix']);
const ALLOWED_FIELD_OPERATORS = new Set(['exists', 'equals', 'contains']);
const ALLOWED_BODY_MATCH_MODES = new Set(['none', 'exact', 'contains']);

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function clampDelay(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return 0;
  }

  return Math.min(Math.round(numericValue), MAX_MOCK_DELAY_MS);
}

function createRowId(prefix, id) {
  return typeof id === 'string' && id.length > 0 ? id : `${prefix}-${randomUUID()}`;
}

function cloneMatcherRows(rows, prefix) {
  return Array.isArray(rows)
    ? rows.map((row, index) => ({
      id: createRowId(`${prefix}-${index}`, row?.id),
      key: normalizeText(row?.key),
      operator: ALLOWED_FIELD_OPERATORS.has(row?.operator) ? row.operator : 'equals',
      value: typeof row?.value === 'string' ? row.value : '',
      enabled: row?.enabled !== false,
    }))
    : [];
}

function cloneResponseHeaders(rows) {
  return Array.isArray(rows)
    ? rows.map((row, index) => ({
      id: createRowId(`response-header-${index}`, row?.id),
      key: normalizeText(row?.key),
      value: typeof row?.value === 'string' ? row.value : '',
      enabled: row?.enabled !== false,
    }))
    : [];
}

function enabledRows(rows) {
  return rows.filter((row) => row.enabled !== false && row.key.length > 0);
}

function createMethodSummary(rule) {
  return rule.methodMode === 'any' ? 'Method: any' : `Method exact: ${rule.method}`;
}

function createPathSummary(rule) {
  return rule.pathMode === 'prefix'
    ? `Path prefix: ${rule.pathValue}`
    : `Path exact: ${rule.pathValue}`;
}

function createFieldRowsSummary(rows, emptyLabel) {
  const rowsToDescribe = enabledRows(rows);

  if (rowsToDescribe.length === 0) {
    return emptyLabel;
  }

  return rowsToDescribe
    .map((row) => {
      if (row.operator === 'exists') {
        return `${row.key} exists`;
      }

      if (row.operator === 'contains') {
        return `${row.key} contains ${row.value}`;
      }

      return `${row.key} equals ${row.value}`;
    })
    .join(' · ');
}

function createBodySummary(rule) {
  if (rule.bodyMatcherMode === 'none') {
    return 'No body matcher';
  }

  return rule.bodyMatcherMode === 'contains'
    ? `Body contains: ${rule.bodyMatcherValue}`
    : `Body exact: ${rule.bodyMatcherValue}`;
}

function createResponseStatusSummary(statusCode) {
  const statusLabel = {
    200: 'OK',
    201: 'Created',
    202: 'Accepted',
    403: 'Forbidden',
    404: 'Not Found',
    500: 'Internal Server Error',
    503: 'Service Unavailable',
  }[statusCode];

  return statusLabel ? `${statusCode} ${statusLabel}` : `${statusCode}`;
}

function createResponseHeadersSummary(rule) {
  const rows = enabledRows(rule.responseHeaders);
  return rows.length === 0 ? 'No static response headers' : `${rows.length} static response header${rows.length === 1 ? '' : 's'}`;
}

function createResponseBodyPreview(body) {
  return body.length > RESPONSE_PREVIEW_LIMIT ? `${body.slice(0, RESPONSE_PREVIEW_LIMIT)}…` : body;
}

function createFixedDelayLabel(fixedDelayMs) {
  return fixedDelayMs > 0 ? `Fixed delay: ${fixedDelayMs} ms` : 'No fixed delay';
}

function createMatcherSummary(rule) {
  return [
    createMethodSummary(rule),
    createPathSummary(rule),
    createFieldRowsSummary(rule.queryMatchers, 'No query matcher'),
    createFieldRowsSummary(rule.headerMatchers, 'No header matcher'),
    createBodySummary(rule),
  ].join(' with ');
}

function createResponseSummary(rule) {
  return `Static ${createResponseStatusSummary(rule.responseStatusCode)} response${rule.fixedDelayMs > 0 ? ` with ${rule.fixedDelayMs} ms fixed delay` : ''}.`;
}

function createSpecificityScore(rule) {
  return (rule.methodMode === 'exact' ? 1 : 0)
    + (rule.pathValue.length > 0 ? 1 : 0)
    + enabledRows(rule.queryMatchers).length
    + enabledRows(rule.headerMatchers).length
    + (rule.bodyMatcherMode === 'none' ? 0 : 1);
}

function createDeferredSummary() {
  return 'Script-assisted matcher/response authoring, scenario state, and advanced diagnostics remain deferred.';
}

function createDiagnosticsSummary() {
  return 'Rules are evaluated by enabled state, then priority, then matcher specificity before a stable created-at tie-breaker.';
}

function createMockRuleRecord(input, existingRecord, workspaceId = DEFAULT_WORKSPACE_ID) {
  const now = new Date().toISOString();
  const methodMode = ALLOWED_METHOD_MODES.has(input.methodMode) ? input.methodMode : 'any';
  const method = ALLOWED_METHODS.has(String(input.method).toUpperCase())
    ? String(input.method).toUpperCase()
    : 'GET';
  const pathMode = ALLOWED_PATH_MODES.has(input.pathMode) ? input.pathMode : 'exact';
  const pathValue = normalizeText(input.pathValue);
  const queryMatchers = cloneMatcherRows(input.queryMatchers, 'query-matcher');
  const headerMatchers = cloneMatcherRows(input.headerMatchers, 'header-matcher');
  const bodyMatcherMode = ALLOWED_BODY_MATCH_MODES.has(input.bodyMatcherMode)
    ? input.bodyMatcherMode
    : 'none';
  const bodyMatcherValue = typeof input.bodyMatcherValue === 'string' ? input.bodyMatcherValue : '';
  const responseHeaders = cloneResponseHeaders(input.responseHeaders);
  const responseBody = typeof input.responseBody === 'string' ? input.responseBody : '';
  const responseStatusCode = Number.isFinite(Number(input.responseStatusCode))
    ? Math.max(100, Math.min(599, Math.round(Number(input.responseStatusCode))))
    : 200;
  const fixedDelayMs = clampDelay(input.fixedDelayMs);
  const enabled = input.enabled === true;

  const baseRecord = {
    id: existingRecord?.id || randomUUID(),
    workspaceId: workspaceId || existingRecord?.workspaceId || DEFAULT_WORKSPACE_ID,
    name: normalizeText(input.name),
    enabled,
    priority: Number.isFinite(Number(input.priority)) ? Math.round(Number(input.priority)) : 100,
    methodMode,
    method,
    pathMode,
    pathValue,
    queryMatchers,
    headerMatchers,
    bodyMatcherMode,
    bodyMatcherValue,
    responseStatusCode,
    responseHeaders,
    responseBody,
    fixedDelayMs,
    createdAt: existingRecord?.createdAt || now,
    updatedAt: now,
  };

  return {
    ...baseRecord,
    ruleState: enabled ? 'Enabled' : 'Disabled',
    matcherSummary: createMatcherSummary(baseRecord),
    responseSummary: createResponseSummary(baseRecord),
    methodSummary: createMethodSummary(baseRecord),
    pathSummary: createPathSummary(baseRecord),
    querySummary: createFieldRowsSummary(baseRecord.queryMatchers, 'No query matcher'),
    headerSummary: createFieldRowsSummary(baseRecord.headerMatchers, 'No header matcher'),
    bodySummary: createBodySummary(baseRecord),
    responseStatusSummary: createResponseStatusSummary(baseRecord.responseStatusCode),
    responseHeadersSummary: createResponseHeadersSummary(baseRecord),
    responseBodyPreview: createResponseBodyPreview(baseRecord.responseBody),
    fixedDelayLabel: createFixedDelayLabel(baseRecord.fixedDelayMs),
    diagnosticsSummary: createDiagnosticsSummary(),
    deferredSummary: createDeferredSummary(),
    sourceLabel: 'Persisted workspace rule',
  };
}

function validateMockRuleInput(input) {
  if (!input || typeof input !== 'object') {
    return 'Mock rule payload is required.';
  }

  if (normalizeText(input.name).length === 0) {
    return 'Mock rule name is required.';
  }

  if (!ALLOWED_METHOD_MODES.has(input.methodMode)) {
    return 'Method mode must be any or exact.';
  }

  if (input.methodMode === 'exact' && !ALLOWED_METHODS.has(String(input.method).toUpperCase())) {
    return 'Method must be a supported HTTP method when method mode is exact.';
  }

  if (!ALLOWED_PATH_MODES.has(input.pathMode)) {
    return 'Path mode must be exact or prefix.';
  }

  if (normalizeText(input.pathValue).length === 0) {
    return 'Path value is required.';
  }

  if (!ALLOWED_BODY_MATCH_MODES.has(input.bodyMatcherMode)) {
    return 'Body matcher mode is invalid.';
  }

  if (input.bodyMatcherMode !== 'none' && normalizeText(input.bodyMatcherValue).length === 0) {
    return 'Body matcher value is required when a body matcher is enabled.';
  }

  const responseStatusCode = Number(input.responseStatusCode);
  if (!Number.isInteger(responseStatusCode) || responseStatusCode < 100 || responseStatusCode > 599) {
    return 'Response status code must be an integer between 100 and 599.';
  }

  const fixedDelayMs = Number(input.fixedDelayMs);
  if (!Number.isFinite(fixedDelayMs) || fixedDelayMs < 0 || fixedDelayMs > MAX_MOCK_DELAY_MS) {
    return `Fixed delay must be between 0 and ${MAX_MOCK_DELAY_MS} ms.`;
  }

  return null;
}

function sortMockRulesForEvaluation(rules) {
  return [...rules].sort((left, right) => {
    if (right.priority !== left.priority) {
      return right.priority - left.priority;
    }

    const specificityDifference = createSpecificityScore(right) - createSpecificityScore(left);
    if (specificityDifference !== 0) {
      return specificityDifference;
    }

    const createdAtDifference = String(left.createdAt || '').localeCompare(String(right.createdAt || ''));
    if (createdAtDifference !== 0) {
      return createdAtDifference;
    }

    return String(left.id).localeCompare(String(right.id));
  });
}

function getHeaderValues(headers, key) {
  const lowerKey = String(key).toLowerCase();
  const directValue = headers[lowerKey] ?? headers[key];

  if (Array.isArray(directValue)) {
    return directValue.map((value) => String(value));
  }

  return directValue == null ? [] : [String(directValue)];
}

function rowMatchesValue(row, values) {
  if (row.operator === 'exists') {
    return values.length > 0;
  }

  if (values.length === 0) {
    return false;
  }

  if (row.operator === 'contains') {
    return values.some((value) => value.includes(row.value));
  }

  return values.some((value) => value === row.value);
}

function matchesQueryRows(rule, searchParams) {
  return enabledRows(rule.queryMatchers).every((row) => rowMatchesValue(row, searchParams.getAll(row.key)));
}

function matchesHeaderRows(rule, headers) {
  return enabledRows(rule.headerMatchers).every((row) => rowMatchesValue(row, getHeaderValues(headers, row.key)));
}

function matchesBody(rule, rawBody) {
  if (rule.bodyMatcherMode === 'none') {
    return true;
  }

  const normalizedBody = typeof rawBody === 'string' ? rawBody : '';

  if (rule.bodyMatcherMode === 'contains') {
    return normalizedBody.includes(rule.bodyMatcherValue);
  }

  return normalizedBody.trim() === rule.bodyMatcherValue.trim();
}

function matchesRule(rule, requestInput) {
  if (rule.methodMode === 'exact' && requestInput.method !== rule.method) {
    return false;
  }

  if (rule.pathMode === 'prefix') {
    if (!requestInput.pathname.startsWith(rule.pathValue)) {
      return false;
    }
  } else if (requestInput.pathname !== rule.pathValue) {
    return false;
  }

  return matchesQueryRows(rule, requestInput.searchParams)
    && matchesHeaderRows(rule, requestInput.headers)
    && matchesBody(rule, requestInput.rawBody);
}

function createFallbackResponse(config) {
  return {
    statusCode: Number(config?.statusCode) || 200,
    headers: {
      'Content-Type': config?.contentType || 'application/json',
    },
    body: typeof config?.body === 'string'
      ? config.body
      : '{\n  "message": "Request captured by Local Request Inspector"\n}',
  };
}

function createMockedEvaluation(rule) {
  return {
    outcome: 'Mocked',
    matchedRuleId: rule.id,
    matchedRuleName: rule.name,
    appliedDelayMs: rule.fixedDelayMs,
    mockEvaluationSummary: `Matched rule "${rule.name}" at priority ${rule.priority} and returned ${createResponseStatusSummary(rule.responseStatusCode)}.${rule.fixedDelayMs > 0 ? ` Applied ${rule.fixedDelayMs} ms delay.` : ''}`,
    response: {
      statusCode: rule.responseStatusCode,
      headers: Object.fromEntries(
        enabledRows(rule.responseHeaders).map((row) => [row.key, row.value]),
      ),
      body: rule.responseBody,
    },
  };
}

function createBypassedEvaluation(fallbackResponse) {
  return {
    outcome: 'Bypassed',
    matchedRuleId: null,
    matchedRuleName: null,
    appliedDelayMs: null,
    mockEvaluationSummary: 'No enabled rules were available, so the request followed the fallback response path.',
    response: fallbackResponse,
  };
}

function createNoMatchEvaluation(enabledRuleCount, fallbackResponse) {
  return {
    outcome: 'No rule matched',
    matchedRuleId: null,
    matchedRuleName: null,
    appliedDelayMs: null,
    mockEvaluationSummary: `Checked ${enabledRuleCount} enabled rule${enabledRuleCount === 1 ? '' : 's'} and no rule matched this request.`,
    response: fallbackResponse,
  };
}

function createBlockedEvaluation(summary) {
  return {
    outcome: 'Blocked',
    matchedRuleId: null,
    matchedRuleName: null,
    appliedDelayMs: null,
    mockEvaluationSummary: summary,
    response: {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ blocked: true, reason: summary }, null, 2),
    },
  };
}

function evaluateMockRules(rules, requestInput, fallbackConfig) {
  const fallbackResponse = createFallbackResponse(fallbackConfig);
  const enabledRules = sortMockRulesForEvaluation(rules.filter((rule) => rule.enabled));

  if (enabledRules.length === 0) {
    return createBypassedEvaluation(fallbackResponse);
  }

  for (const rule of enabledRules) {
    if (normalizeText(rule.pathValue).length === 0) {
      return createBlockedEvaluation(`Rule "${rule.name}" is missing a path matcher and could not be evaluated safely.`);
    }

    if (rule.responseStatusCode < 100 || rule.responseStatusCode > 599) {
      return createBlockedEvaluation(`Rule "${rule.name}" has an invalid response status and was blocked before response generation.`);
    }

    if (matchesRule(rule, requestInput)) {
      return createMockedEvaluation(rule);
    }
  }

  return createNoMatchEvaluation(enabledRules.length, fallbackResponse);
}

module.exports = {
  DEFAULT_WORKSPACE_ID,
  createMockRuleRecord,
  evaluateMockRules,
  validateMockRuleInput,
};
