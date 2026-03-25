const {
  createUnavailableSecretProvider,
  normalizeSecretProviderStatus,
} = require('./secret-provider');

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeCount(value) {
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}

function createSecretProviderError(action, details = {}, cause = null) {
  return {
    status: 500,
    code: 'secret_provider_error',
    message: `Secret provider failed during ${action}.`,
    details: {
      action,
      ...(details && typeof details === 'object' ? details : {}),
    },
    retryable: false,
    ...(cause ? { cause } : {}),
  };
}

function createEnvironmentSecretPolicyService(options = {}) {
  const secretProvider = options.secretProvider || createUnavailableSecretProvider({
    backendLabel: options.backendLabel,
  });

  async function readSecretProviderStatus() {
    const rawStatus = await secretProvider.status();
    return normalizeSecretProviderStatus(rawStatus);
  }

  function createSecretLocator({ workspaceId, environmentId, variableId }) {
    return {
      workspaceId: normalizeText(workspaceId),
      environmentId: normalizeText(environmentId),
      variableId: normalizeText(variableId),
    };
  }

  function listSecretMutationOperations(input, context = {}) {
    const persistedVariables = Array.isArray(context.persistedVariables) ? context.persistedVariables : [];
    const workspaceId = normalizeText(context.workspaceId);
    const environmentId = normalizeText(context.environmentId);
    const operations = [];

    for (const [index, row] of (Array.isArray(input?.variables) ? input.variables : []).entries()) {
      if (row?.isSecret !== true) {
        continue;
      }

      const replacementValue = typeof row?.replacementValue === 'string' ? row.replacementValue : '';
      const rawValue = typeof row?.value === 'string' ? row.value : '';
      const clearStoredValue = row?.clearStoredValue === true;
      const persistedVariable = persistedVariables[index];
      const variableId = normalizeText(persistedVariable?.id) || normalizeText(row?.id) || `secret-variable-${index}`;
      const key = normalizeText(row?.key) || '(unnamed secret)';
      const locator = createSecretLocator({
        workspaceId,
        environmentId,
        variableId,
      });

      if (replacementValue.length > 0 || rawValue.length > 0) {
        operations.push({
          type: 'store',
          key,
          value: replacementValue.length > 0 ? replacementValue : rawValue,
          locator,
        });
        continue;
      }

      if (clearStoredValue) {
        operations.push({
          type: 'clear',
          key,
          locator,
        });
      }
    }

    return operations;
  }

  function createSecretStorageUnavailableError(secretKeys, providerStatus) {
    const uniqueSecretKeys = [...new Set(secretKeys)];

    return {
      status: 409,
      code: 'secret_storage_unavailable',
      message: `Secret storage is unavailable in this environment. Remove replacement values for ${uniqueSecretKeys.join(', ')} or use plain variables until a secure backend is configured.`,
      details: {
        backend: providerStatus.backendLabel,
        secretKeys: uniqueSecretKeys,
      },
      retryable: false,
    };
  }

  async function applyEnvironmentSecretMutations({
    input,
    workspaceId,
    environmentId,
    persistedVariables,
  }) {
    const operations = listSecretMutationOperations(input, {
      workspaceId,
      environmentId,
      persistedVariables,
    });

    if (operations.length === 0) {
      return null;
    }

    let providerStatus;
    try {
      providerStatus = await readSecretProviderStatus();
    } catch (error) {
      return createSecretProviderError('status', {}, error);
    }

    const storeOperations = operations.filter((operation) => operation.type === 'store');

    if (storeOperations.length > 0 && providerStatus.secureBackendAvailable !== true) {
      return createSecretStorageUnavailableError(
        storeOperations.map((operation) => operation.key),
        providerStatus,
      );
    }

    if (providerStatus.secureBackendAvailable !== true) {
      return null;
    }

    for (const operation of operations) {
      if (operation.type === 'store') {
        try {
          const result = await secretProvider.store({
            locator: operation.locator,
            value: operation.value,
          });

          if (result?.stored !== true) {
            return createSecretProviderError('store', {
              secretKey: operation.key,
            });
          }
        } catch (error) {
          return createSecretProviderError('store', {
            secretKey: operation.key,
          }, error);
        }
        continue;
      }

      if (operation.type === 'clear') {
        try {
          await secretProvider.clear({
            locator: operation.locator,
          });
        } catch (error) {
          return createSecretProviderError('clear', {
            secretKey: operation.key,
          }, error);
        }
      }
    }

    return null;
  }

  async function resolveEnvironmentSecretValues(environmentRecord, context = {}) {
    let providerStatus;
    try {
      providerStatus = await readSecretProviderStatus();
    } catch (error) {
      throw createSecretProviderError('status', {}, error);
    }

    if (providerStatus.secureBackendAvailable !== true) {
      return {
        secretValuesByKey: {},
        providerStatus,
      };
    }

    const workspaceId = normalizeText(context.workspaceId) || normalizeText(environmentRecord?.workspaceId);
    const environmentId = normalizeText(context.environmentId) || normalizeText(environmentRecord?.id);
    const secretValuesByKey = {};

    for (const [index, row] of (Array.isArray(environmentRecord?.variables) ? environmentRecord.variables : []).entries()) {
      if (row?.isSecret !== true || row?.hasStoredValue !== true) {
        continue;
      }

      const key = normalizeText(row?.key);
      if (key.length === 0) {
        continue;
      }

      const variableId = normalizeText(row?.id) || `secret-variable-${index}`;
      const locator = createSecretLocator({ workspaceId, environmentId, variableId });

      try {
        const result = await secretProvider.resolve({ locator });

        if (result?.found !== true) {
          continue;
        }

        if (typeof result?.value !== 'string') {
          throw new Error('Secret provider returned a non-string value for a resolved secret.');
        }

        secretValuesByKey[key.toLowerCase()] = result.value;
      } catch (error) {
        throw createSecretProviderError('resolve', {
          secretKey: key,
        }, error);
      }
    }

    return {
      secretValuesByKey,
      providerStatus,
    };
  }

  async function createSecretStorageStatusSnapshot(diagnostics = {}) {
    const sanitizedLegacyEnvironmentCount = normalizeCount(diagnostics?.sanitizedLegacyEnvironmentCount);
    const sanitizedLegacySecretRowCount = normalizeCount(diagnostics?.sanitizedLegacySecretRowCount);

    let providerStatus;
    try {
      providerStatus = await readSecretProviderStatus();
    } catch {
      providerStatus = {
        secureBackendAvailable: false,
        backendLabel: 'unavailable',
        providerStatus: 'error',
      };
    }

    return {
      secureBackendAvailable: providerStatus.secureBackendAvailable === true,
      backendLabel: providerStatus.backendLabel,
      ...(providerStatus.providerId ? { providerId: providerStatus.providerId } : {}),
      ...(providerStatus.providerVersion ? { providerVersion: providerStatus.providerVersion } : {}),
      ...(providerStatus.providerStatus ? { providerStatus: providerStatus.providerStatus } : {}),
      ...(Array.isArray(providerStatus.capabilities) && providerStatus.capabilities.length > 0
        ? { capabilities: providerStatus.capabilities }
        : {}),
      readModelPolicy: 'Secret rows remain write-only and expose only hasStoredValue in read responses.',
      replacementWritePolicy: providerStatus.secureBackendAvailable === true
        ? 'Secret replacement writes use the configured secure backend.'
        : 'Secret replacement writes fail closed until a secure backend is configured.',
      runtimeResolutionPolicy: providerStatus.secureBackendAvailable === true
        ? 'Secret-backed placeholders resolve through the configured secure backend at run time.'
        : 'Run time continues to resolve plain variables only. Secret-backed placeholders stay unavailable until a secure backend is configured.',
      sanitizedLegacyEnvironmentCount,
      sanitizedLegacySecretRowCount,
      legacySanitizationNote: sanitizedLegacySecretRowCount > 0
        ? `Sanitized ${sanitizedLegacySecretRowCount} legacy secret row(s) across ${sanitizedLegacyEnvironmentCount} environment(s) during this diagnostics pass.`
        : 'No legacy secret rows required sanitization during this diagnostics pass.',
      note: providerStatus.secureBackendAvailable === true
        ? 'A secure backend is configured. Raw secret values remain masked in ordinary environment responses and persisted runtime artifacts.'
        : 'A secure backend is not configured in this runtime. Secret replacement writes remain blocked, while ordinary environment JSON stays free of raw secret values.',
    };
  }

  return {
    createSecretLocator,
    applyEnvironmentSecretMutations,
    resolveEnvironmentSecretValues,
    createSecretStorageStatusSnapshot,
  };
}

module.exports = {
  createEnvironmentSecretPolicyService,
  createSecretProviderError,
};
