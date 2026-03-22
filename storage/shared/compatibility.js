const { STORAGE_COMPATIBILITY_STATES } = require('./constants');

const COMPATIBILITY_STATE_RANK = {
  [STORAGE_COMPATIBILITY_STATES.READ_COMPATIBLE]: 0,
  [STORAGE_COMPATIBILITY_STATES.BOOTSTRAP_RECOVERABLE]: 1,
  [STORAGE_COMPATIBILITY_STATES.MIGRATION_NEEDED]: 2,
  [STORAGE_COMPATIBILITY_STATES.UNSUPPORTED_VERSION]: 3,
  [STORAGE_COMPATIBILITY_STATES.MALFORMED_DATA]: 4,
};

function createCompatibilityIssue({ state, code, message, details = {} }) {
  return {
    state,
    code,
    message,
    details,
  };
}

function normalizeSchemaVersion(value) {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0 && /^\d+$/.test(value.trim())) {
    return Number(value.trim());
  }

  return null;
}

function classifySchemaVersion(options) {
  const {
    subject,
    currentVersion,
    supportedVersion,
    missingCode,
    malformedCode,
    migrationNeededCode,
    unsupportedCode,
    details = {},
  } = options;

  if (currentVersion == null || currentVersion === '') {
    return createCompatibilityIssue({
      state: STORAGE_COMPATIBILITY_STATES.BOOTSTRAP_RECOVERABLE,
      code: missingCode,
      message: `${subject} is missing and can be bootstrapped safely.`,
      details,
    });
  }

  const normalizedCurrentVersion = normalizeSchemaVersion(currentVersion);
  const normalizedSupportedVersion = normalizeSchemaVersion(supportedVersion);

  if (normalizedCurrentVersion == null || normalizedSupportedVersion == null) {
    return createCompatibilityIssue({
      state: STORAGE_COMPATIBILITY_STATES.MALFORMED_DATA,
      code: malformedCode,
      message: `${subject} is malformed and cannot be classified safely.`,
      details: {
        ...details,
        currentVersion,
        supportedVersion,
      },
    });
  }

  if (normalizedCurrentVersion === normalizedSupportedVersion) {
    return createCompatibilityIssue({
      state: STORAGE_COMPATIBILITY_STATES.READ_COMPATIBLE,
      code: null,
      message: `${subject} is read-compatible.`,
      details: {
        ...details,
        currentVersion: normalizedCurrentVersion,
        supportedVersion: normalizedSupportedVersion,
      },
    });
  }

  if (normalizedCurrentVersion < normalizedSupportedVersion) {
    return createCompatibilityIssue({
      state: STORAGE_COMPATIBILITY_STATES.MIGRATION_NEEDED,
      code: migrationNeededCode,
      message: `${subject} is older than this build supports for direct writes and needs a future migration path.`,
      details: {
        ...details,
        currentVersion: normalizedCurrentVersion,
        supportedVersion: normalizedSupportedVersion,
      },
    });
  }

  return createCompatibilityIssue({
    state: STORAGE_COMPATIBILITY_STATES.UNSUPPORTED_VERSION,
    code: unsupportedCode,
    message: `${subject} is newer than this build supports.`,
    details: {
      ...details,
      currentVersion: normalizedCurrentVersion,
      supportedVersion: normalizedSupportedVersion,
    },
  });
}

function classifyExactValueCompatibility(options) {
  const {
    subject,
    currentValue,
    expectedValue,
    missingCode,
    incompatibleCode,
    details = {},
    incompatibleState = STORAGE_COMPATIBILITY_STATES.UNSUPPORTED_VERSION,
  } = options;

  if (currentValue == null || currentValue === '') {
    return createCompatibilityIssue({
      state: STORAGE_COMPATIBILITY_STATES.BOOTSTRAP_RECOVERABLE,
      code: missingCode,
      message: `${subject} is missing and can be bootstrapped safely.`,
      details,
    });
  }

  if (String(currentValue) === String(expectedValue)) {
    return createCompatibilityIssue({
      state: STORAGE_COMPATIBILITY_STATES.READ_COMPATIBLE,
      code: null,
      message: `${subject} is read-compatible.`,
      details: {
        ...details,
        currentValue,
        expectedValue,
      },
    });
  }

  return createCompatibilityIssue({
    state: incompatibleState,
    code: incompatibleCode,
    message: `${subject} is incompatible with this build.`,
    details: {
      ...details,
      currentValue,
      expectedValue,
    },
  });
}

function createCompatibilityReport(issues, okMessage = 'Compatibility is read-compatible.') {
  const normalizedIssues = (issues || []).filter(Boolean);

  if (normalizedIssues.length === 0) {
    return {
      state: STORAGE_COMPATIBILITY_STATES.READ_COMPATIBLE,
      code: null,
      message: okMessage,
      issues: [],
    };
  }

  const dominantIssue = [...normalizedIssues].sort((left, right) => {
    const rankDiff = (COMPATIBILITY_STATE_RANK[right.state] || 0) - (COMPATIBILITY_STATE_RANK[left.state] || 0);

    if (rankDiff !== 0) {
      return rankDiff;
    }

    return String(left.code || '').localeCompare(String(right.code || ''));
  })[0];

  return {
    state: dominantIssue.state,
    code: dominantIssue.code,
    message: dominantIssue.message,
    issues: normalizedIssues,
  };
}

function createCompatibilityError(report, details = {}) {
  const error = new Error(report.message);
  error.code = report.code || 'compatibility_error';
  error.details = {
    compatibilityState: report.state,
    issues: report.issues,
    ...details,
  };
  return error;
}

module.exports = {
  createCompatibilityIssue,
  normalizeSchemaVersion,
  classifySchemaVersion,
  classifyExactValueCompatibility,
  createCompatibilityReport,
  createCompatibilityError,
};
