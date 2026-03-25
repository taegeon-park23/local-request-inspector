function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeCount(value) {
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}

function createEnvironmentSecretPolicyService(options = {}) {
  const secureBackendAvailable = options.secureBackendAvailable === true;
  const backendLabel = normalizeText(options.backendLabel) || 'unavailable';

  function listSecretWriteKeys(input) {
    const keys = [];

    for (const row of Array.isArray(input?.variables) ? input.variables : []) {
      if (row?.isSecret !== true) {
        continue;
      }

      const replacementValue = typeof row?.replacementValue === 'string' ? row.replacementValue : '';
      const rawValue = typeof row?.value === 'string' ? row.value : '';
      if (replacementValue.length === 0 && rawValue.length === 0) {
        continue;
      }

      keys.push(normalizeText(row?.key) || '(unnamed secret)');
    }

    return [...new Set(keys)];
  }

  function validateEnvironmentSecretMutation(input) {
    if (secureBackendAvailable) {
      return null;
    }

    const secretKeys = listSecretWriteKeys(input);
    if (secretKeys.length === 0) {
      return null;
    }

    return {
      status: 409,
      code: 'secret_storage_unavailable',
      message: `Secret storage is unavailable in this environment. Remove replacement values for ${secretKeys.join(', ')} or use plain variables until a secure backend is configured.`,
      details: {
        backend: backendLabel,
        secretKeys,
      },
      retryable: false,
    };
  }

  function createSecretStorageStatusSnapshot(diagnostics = {}) {
    const sanitizedLegacyEnvironmentCount = normalizeCount(diagnostics?.sanitizedLegacyEnvironmentCount);
    const sanitizedLegacySecretRowCount = normalizeCount(diagnostics?.sanitizedLegacySecretRowCount);

    return {
      secureBackendAvailable,
      backendLabel,
      readModelPolicy: 'Secret rows remain write-only and expose only hasStoredValue in read responses.',
      replacementWritePolicy: secureBackendAvailable
        ? 'Secret replacement writes use the configured secure backend.'
        : 'Secret replacement writes fail closed until a secure backend is configured.',
      runtimeResolutionPolicy: secureBackendAvailable
        ? 'Secret-backed placeholders resolve through the configured secure backend at run time.'
        : 'Run time continues to resolve plain variables only. Secret-backed placeholders stay unavailable until a secure backend is configured.',
      sanitizedLegacyEnvironmentCount,
      sanitizedLegacySecretRowCount,
      legacySanitizationNote: sanitizedLegacySecretRowCount > 0
        ? `Sanitized ${sanitizedLegacySecretRowCount} legacy secret row(s) across ${sanitizedLegacyEnvironmentCount} environment(s) during this diagnostics pass.`
        : 'No legacy secret rows required sanitization during this diagnostics pass.',
      note: secureBackendAvailable
        ? 'A secure backend is configured. Raw secret values remain masked in ordinary environment responses and persisted runtime artifacts.'
        : 'A secure backend is not configured in this runtime. Secret replacement writes remain blocked, while ordinary environment JSON stays free of raw secret values.',
    };
  }

  return {
    secureBackendAvailable,
    backendLabel,
    validateEnvironmentSecretMutation,
    createSecretStorageStatusSnapshot,
  };
}

module.exports = {
  createEnvironmentSecretPolicyService,
};
