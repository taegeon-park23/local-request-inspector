function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
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

  return {
    secureBackendAvailable,
    backendLabel,
    validateEnvironmentSecretMutation,
  };
}

module.exports = {
  createEnvironmentSecretPolicyService,
};
