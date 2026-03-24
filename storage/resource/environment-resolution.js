const PLACEHOLDER_PATTERN = /\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g;
const ENVIRONMENT_RESOLUTION_STATUSES = new Set([
  'not-selected',
  'resolved',
  'blocked-missing-environment',
  'blocked-unresolved-placeholders',
  'blocked-invalid-resolved-json',
]);
const ENVIRONMENT_RESOLUTION_INPUT_AREA_ORDER = ['url', 'params', 'headers', 'body', 'auth'];
const ENVIRONMENT_RESOLUTION_INPUT_AREAS = new Set(ENVIRONMENT_RESOLUTION_INPUT_AREA_ORDER);

function normalizeLookupKey(key) {
  return typeof key === 'string' ? key.trim().toLowerCase() : '';
}

function cloneRequestRows(rows) {
  return Array.isArray(rows)
    ? rows.map((row) => ({
      ...row,
      key: typeof row?.key === 'string' ? row.key : '',
      value: typeof row?.value === 'string' ? row.value : '',
    }))
    : [];
}

function buildEnvironmentValueLookup(environmentRecord) {
  const lookup = new Map();

  for (const row of Array.isArray(environmentRecord?.variables) ? environmentRecord.variables : []) {
    if (!row || row.isEnabled === false) {
      continue;
    }

    const normalizedKey = normalizeLookupKey(row.key);

    if (normalizedKey.length === 0) {
      continue;
    }

    lookup.set(normalizedKey, typeof row.value === 'string' ? row.value : '');
  }

  return lookup;
}

function pushUnresolvedPlaceholder(unresolved, fieldPath, placeholderName) {
  unresolved.push({
    fieldPath,
    placeholder: placeholderName,
  });
}

function classifyAffectedInputArea(fieldPath) {
  if (fieldPath === 'url') {
    return 'url';
  }

  if (typeof fieldPath !== 'string') {
    return null;
  }

  if (fieldPath.startsWith('params[')) {
    return 'params';
  }

  if (fieldPath.startsWith('headers[')) {
    return 'headers';
  }

  if (fieldPath === 'bodyText' || fieldPath.startsWith('formBody[') || fieldPath.startsWith('multipartBody[')) {
    return 'body';
  }

  if (fieldPath.startsWith('auth.')) {
    return 'auth';
  }

  return null;
}

function recordAffectedInputArea(resolutionState, fieldPath) {
  const area = classifyAffectedInputArea(fieldPath);

  if (area) {
    resolutionState.affectedInputAreas.add(area);
  }
}

function normalizeAffectedInputAreas(affectedInputAreas) {
  if (!Array.isArray(affectedInputAreas)) {
    return [];
  }

  const normalizedSet = new Set(affectedInputAreas.filter((area) => ENVIRONMENT_RESOLUTION_INPUT_AREAS.has(area)));

  return ENVIRONMENT_RESOLUTION_INPUT_AREA_ORDER.filter((area) => normalizedSet.has(area));
}

function formatAffectedAreaList(affectedInputAreas) {
  if (!Array.isArray(affectedInputAreas) || affectedInputAreas.length === 0) {
    return 'this request';
  }

  if (affectedInputAreas.length === 1) {
    return affectedInputAreas[0];
  }

  if (affectedInputAreas.length === 2) {
    return `${affectedInputAreas[0]} and ${affectedInputAreas[1]}`;
  }

  return `${affectedInputAreas.slice(0, -1).join(', ')}, and ${affectedInputAreas[affectedInputAreas.length - 1]}`;
}

function resolveStringWithEnvironment(value, lookup, unresolved, fieldPath, resolutionState) {
  if (typeof value !== 'string' || value.length === 0) {
    return typeof value === 'string' ? value : '';
  }

  return value.replace(PLACEHOLDER_PATTERN, (match, placeholderName) => {
    const normalizedName = normalizeLookupKey(placeholderName);

    if (normalizedName.length === 0 || !lookup.has(normalizedName)) {
      recordAffectedInputArea(resolutionState, fieldPath);
      pushUnresolvedPlaceholder(
        unresolved,
        fieldPath,
        typeof placeholderName === 'string' ? placeholderName.trim() : '',
      );
      return match;
    }

    recordAffectedInputArea(resolutionState, fieldPath);
    resolutionState.resolvedPlaceholderCount += 1;
    return lookup.get(normalizedName);
  });
}

function resolveRows(rows, lookup, unresolved, fieldPrefix, resolutionState) {
  return cloneRequestRows(rows).map((row, index) => {
    if (row.enabled === false) {
      return row;
    }

    return {
      ...row,
      key: resolveStringWithEnvironment(row.key, lookup, unresolved, `${fieldPrefix}[${index}].key`, resolutionState),
      value: resolveStringWithEnvironment(row.value, lookup, unresolved, `${fieldPrefix}[${index}].value`, resolutionState),
    };
  });
}

function resolveAuth(auth, lookup, unresolved, resolutionState) {
  const nextAuth = {
    type: auth?.type || 'none',
    bearerToken: typeof auth?.bearerToken === 'string' ? auth.bearerToken : '',
    basicUsername: typeof auth?.basicUsername === 'string' ? auth.basicUsername : '',
    basicPassword: typeof auth?.basicPassword === 'string' ? auth.basicPassword : '',
    apiKeyName: typeof auth?.apiKeyName === 'string' ? auth.apiKeyName : '',
    apiKeyValue: typeof auth?.apiKeyValue === 'string' ? auth.apiKeyValue : '',
    apiKeyPlacement: auth?.apiKeyPlacement || 'header',
  };

  if (nextAuth.type === 'bearer') {
    nextAuth.bearerToken = resolveStringWithEnvironment(
      nextAuth.bearerToken,
      lookup,
      unresolved,
      'auth.bearerToken',
      resolutionState,
    );
    return nextAuth;
  }

  if (nextAuth.type === 'basic') {
    nextAuth.basicUsername = resolveStringWithEnvironment(
      nextAuth.basicUsername,
      lookup,
      unresolved,
      'auth.basicUsername',
      resolutionState,
    );
    nextAuth.basicPassword = resolveStringWithEnvironment(
      nextAuth.basicPassword,
      lookup,
      unresolved,
      'auth.basicPassword',
      resolutionState,
    );
    return nextAuth;
  }

  if (nextAuth.type === 'api-key') {
    nextAuth.apiKeyName = resolveStringWithEnvironment(
      nextAuth.apiKeyName,
      lookup,
      unresolved,
      'auth.apiKeyName',
      resolutionState,
    );
    nextAuth.apiKeyValue = resolveStringWithEnvironment(
      nextAuth.apiKeyValue,
      lookup,
      unresolved,
      'auth.apiKeyValue',
      resolutionState,
    );
    return nextAuth;
  }

  return nextAuth;
}

function shouldResolveBody(request) {
  return request?.method !== 'GET' && request?.method !== 'DELETE' && request?.bodyMode !== 'none';
}

function createEnvironmentResolutionSummary({
  selectedEnvironmentId,
  missingEnvironmentReference = false,
  resolvedPlaceholderCount = 0,
  unresolved = [],
  affectedInputAreas = [],
  invalidResolvedJson = false,
}) {
  const unresolvedPlaceholderCount = Array.isArray(unresolved) ? unresolved.length : 0;
  const normalizedAffectedInputAreas = normalizeAffectedInputAreas([
    ...normalizeAffectedInputAreas(affectedInputAreas),
    ...((Array.isArray(unresolved) ? unresolved : [])
      .map((entry) => classifyAffectedInputArea(entry?.fieldPath))
      .filter(Boolean)),
    ...(invalidResolvedJson ? ['body'] : []),
  ]);
  const boundedResolvedPlaceholderCount = Number.isFinite(resolvedPlaceholderCount)
    ? Math.max(0, Math.trunc(resolvedPlaceholderCount))
    : 0;

  if (missingEnvironmentReference) {
    return {
      status: 'blocked-missing-environment',
      summary: 'Selected environment was not found at execution time.',
      resolvedPlaceholderCount: 0,
      unresolvedPlaceholderCount: 0,
      affectedInputAreas: [],
    };
  }

  if (invalidResolvedJson) {
    return {
      status: 'blocked-invalid-resolved-json',
      summary: 'Environment resolution updated the request body but produced invalid JSON content.',
      resolvedPlaceholderCount: boundedResolvedPlaceholderCount,
      unresolvedPlaceholderCount,
      affectedInputAreas: normalizedAffectedInputAreas,
    };
  }

  if (unresolvedPlaceholderCount > 0) {
    return {
      status: 'blocked-unresolved-placeholders',
      summary: `Environment resolution left ${unresolvedPlaceholderCount} unresolved placeholder(s) in ${formatAffectedAreaList(normalizedAffectedInputAreas)}.`,
      resolvedPlaceholderCount: boundedResolvedPlaceholderCount,
      unresolvedPlaceholderCount,
      affectedInputAreas: normalizedAffectedInputAreas,
    };
  }

  if (!selectedEnvironmentId) {
    return {
      status: 'not-selected',
      summary: 'No environment was selected for this execution.',
      resolvedPlaceholderCount: 0,
      unresolvedPlaceholderCount: 0,
      affectedInputAreas: [],
    };
  }

  return {
    status: 'resolved',
    summary: boundedResolvedPlaceholderCount > 0
      ? `Resolved ${boundedResolvedPlaceholderCount} environment placeholder(s) in ${formatAffectedAreaList(normalizedAffectedInputAreas)}.`
      : 'Selected environment contributed no placeholder substitutions to this execution.',
    resolvedPlaceholderCount: boundedResolvedPlaceholderCount,
    unresolvedPlaceholderCount: 0,
    affectedInputAreas: normalizedAffectedInputAreas,
  };
}

function sanitizeEnvironmentResolutionSummary(summary) {
  if (!summary || typeof summary !== 'object') {
    return null;
  }

  if (!ENVIRONMENT_RESOLUTION_STATUSES.has(summary.status)) {
    return null;
  }

  if (typeof summary.summary !== 'string' || summary.summary.trim().length === 0) {
    return null;
  }

  return {
    status: summary.status,
    summary: summary.summary.trim(),
    resolvedPlaceholderCount: Number.isFinite(summary.resolvedPlaceholderCount)
      ? Math.max(0, Math.trunc(summary.resolvedPlaceholderCount))
      : 0,
    unresolvedPlaceholderCount: Number.isFinite(summary.unresolvedPlaceholderCount)
      ? Math.max(0, Math.trunc(summary.unresolvedPlaceholderCount))
      : 0,
    affectedInputAreas: normalizeAffectedInputAreas(summary.affectedInputAreas),
  };
}

function resolveExecutionRequestWithEnvironment(request, environmentRecord) {
  const lookup = buildEnvironmentValueLookup(environmentRecord);
  const unresolved = [];
  const resolutionState = {
    resolvedPlaceholderCount: 0,
    affectedInputAreas: new Set(),
  };
  const resolvedRequest = {
    ...request,
    url: resolveStringWithEnvironment(request?.url || '', lookup, unresolved, 'url', resolutionState),
    params: resolveRows(request?.params, lookup, unresolved, 'params', resolutionState),
    headers: resolveRows(request?.headers, lookup, unresolved, 'headers', resolutionState),
    formBody: resolveRows(request?.formBody, lookup, unresolved, 'formBody', resolutionState),
    multipartBody: resolveRows(request?.multipartBody, lookup, unresolved, 'multipartBody', resolutionState),
    auth: resolveAuth(request?.auth, lookup, unresolved, resolutionState),
    selectedEnvironmentId: typeof request?.selectedEnvironmentId === 'string' ? request.selectedEnvironmentId : null,
  };

  if (shouldResolveBody(request)) {
    resolvedRequest.bodyText = resolveStringWithEnvironment(
      request?.bodyText || '',
      lookup,
      unresolved,
      'bodyText',
      resolutionState,
    );
  } else {
    resolvedRequest.bodyText = typeof request?.bodyText === 'string' ? request.bodyText : '';
  }

  return {
    request: resolvedRequest,
    unresolved,
    resolvedPlaceholderCount: resolutionState.resolvedPlaceholderCount,
    affectedInputAreas: normalizeAffectedInputAreas([...resolutionState.affectedInputAreas]),
  };
}

function summarizeUnresolvedEnvironmentPlaceholders(unresolved) {
  if (!Array.isArray(unresolved) || unresolved.length === 0) {
    return 'No unresolved environment placeholders remain.';
  }

  const preview = unresolved
    .slice(0, 4)
    .map((entry) => `{{${entry.placeholder}}} in ${entry.fieldPath}`)
    .join(', ');

  return unresolved.length > 4
    ? `Unresolved environment placeholders remain after resolution: ${preview}, plus ${unresolved.length - 4} more.`
    : `Unresolved environment placeholders remain after resolution: ${preview}.`;
}

module.exports = {
  ENVIRONMENT_RESOLUTION_INPUT_AREAS,
  PLACEHOLDER_PATTERN,
  buildEnvironmentValueLookup,
  createEnvironmentResolutionSummary,
  resolveExecutionRequestWithEnvironment,
  sanitizeEnvironmentResolutionSummary,
  summarizeUnresolvedEnvironmentPlaceholders,
};
