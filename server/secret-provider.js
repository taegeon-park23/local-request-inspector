const SUPPORTED_SECRET_PROVIDER_CAPABILITIES = ['store', 'resolve', 'clear'];

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeCapabilities(input) {
  if (!Array.isArray(input)) {
    return [];
  }

  const normalized = [];
  const seen = new Set();

  for (const value of input) {
    const capability = normalizeText(value).toLowerCase();
    if (!SUPPORTED_SECRET_PROVIDER_CAPABILITIES.includes(capability) || seen.has(capability)) {
      continue;
    }
    seen.add(capability);
    normalized.push(capability);
  }

  return normalized;
}

function createUnavailableSecretProvider(options = {}) {
  const backendLabel = normalizeText(options.backendLabel) || 'unavailable';
  const providerId = normalizeText(options.providerId);
  const providerVersion = normalizeText(options.providerVersion);

  const statusSnapshot = {
    secureBackendAvailable: false,
    backendLabel,
    providerStatus: 'unavailable',
    ...(providerId ? { providerId } : {}),
    ...(providerVersion ? { providerVersion } : {}),
    capabilities: [],
  };

  return {
    async status() {
      return statusSnapshot;
    },
    async store() {
      return { stored: false };
    },
    async resolve() {
      return { found: false, value: null };
    },
    async clear() {
      return { cleared: false };
    },
  };
}

function normalizeSecretProviderStatus(status) {
  const secureBackendAvailable = status?.secureBackendAvailable === true;
  const backendLabel = normalizeText(status?.backendLabel) || 'unavailable';
  const providerId = normalizeText(status?.providerId);
  const providerVersion = normalizeText(status?.providerVersion);
  const providerStatus = normalizeText(status?.providerStatus);
  const capabilities = normalizeCapabilities(status?.capabilities);

  return {
    secureBackendAvailable,
    backendLabel,
    ...(providerId ? { providerId } : {}),
    ...(providerVersion ? { providerVersion } : {}),
    ...(providerStatus ? { providerStatus } : {}),
    ...(capabilities.length > 0 ? { capabilities } : {}),
  };
}

module.exports = {
  SUPPORTED_SECRET_PROVIDER_CAPABILITIES,
  createUnavailableSecretProvider,
  normalizeSecretProviderStatus,
};
