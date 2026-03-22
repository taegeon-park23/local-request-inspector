const PLACEHOLDER_PATTERN = /\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g;

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

function resolveStringWithEnvironment(value, lookup, unresolved, fieldPath) {
  if (typeof value !== 'string' || value.length === 0) {
    return typeof value === 'string' ? value : '';
  }

  return value.replace(PLACEHOLDER_PATTERN, (match, placeholderName) => {
    const normalizedName = normalizeLookupKey(placeholderName);

    if (normalizedName.length === 0 || !lookup.has(normalizedName)) {
      pushUnresolvedPlaceholder(
        unresolved,
        fieldPath,
        typeof placeholderName === 'string' ? placeholderName.trim() : '',
      );
      return match;
    }

    return lookup.get(normalizedName);
  });
}

function resolveRows(rows, lookup, unresolved, fieldPrefix) {
  return cloneRequestRows(rows).map((row, index) => {
    if (row.enabled === false) {
      return row;
    }

    return {
      ...row,
      key: resolveStringWithEnvironment(row.key, lookup, unresolved, `${fieldPrefix}[${index}].key`),
      value: resolveStringWithEnvironment(row.value, lookup, unresolved, `${fieldPrefix}[${index}].value`),
    };
  });
}

function resolveAuth(auth, lookup, unresolved) {
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
    );
    return nextAuth;
  }

  if (nextAuth.type === 'basic') {
    nextAuth.basicUsername = resolveStringWithEnvironment(
      nextAuth.basicUsername,
      lookup,
      unresolved,
      'auth.basicUsername',
    );
    nextAuth.basicPassword = resolveStringWithEnvironment(
      nextAuth.basicPassword,
      lookup,
      unresolved,
      'auth.basicPassword',
    );
    return nextAuth;
  }

  if (nextAuth.type === 'api-key') {
    nextAuth.apiKeyName = resolveStringWithEnvironment(
      nextAuth.apiKeyName,
      lookup,
      unresolved,
      'auth.apiKeyName',
    );
    nextAuth.apiKeyValue = resolveStringWithEnvironment(
      nextAuth.apiKeyValue,
      lookup,
      unresolved,
      'auth.apiKeyValue',
    );
    return nextAuth;
  }

  return nextAuth;
}

function shouldResolveBody(request) {
  return request?.method !== 'GET' && request?.method !== 'DELETE' && request?.bodyMode !== 'none';
}

function resolveExecutionRequestWithEnvironment(request, environmentRecord) {
  const lookup = buildEnvironmentValueLookup(environmentRecord);
  const unresolved = [];
  const resolvedRequest = {
    ...request,
    url: resolveStringWithEnvironment(request?.url || '', lookup, unresolved, 'url'),
    params: resolveRows(request?.params, lookup, unresolved, 'params'),
    headers: resolveRows(request?.headers, lookup, unresolved, 'headers'),
    formBody: resolveRows(request?.formBody, lookup, unresolved, 'formBody'),
    multipartBody: resolveRows(request?.multipartBody, lookup, unresolved, 'multipartBody'),
    auth: resolveAuth(request?.auth, lookup, unresolved),
    selectedEnvironmentId: typeof request?.selectedEnvironmentId === 'string' ? request.selectedEnvironmentId : null,
  };

  if (shouldResolveBody(request)) {
    resolvedRequest.bodyText = resolveStringWithEnvironment(
      request?.bodyText || '',
      lookup,
      unresolved,
      'bodyText',
    );
  } else {
    resolvedRequest.bodyText = typeof request?.bodyText === 'string' ? request.bodyText : '';
  }

  return {
    request: resolvedRequest,
    unresolved,
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
  PLACEHOLDER_PATTERN,
  buildEnvironmentValueLookup,
  resolveExecutionRequestWithEnvironment,
  summarizeUnresolvedEnvironmentPlaceholders,
};
