import type { RuntimeStatusResponse } from '@client/features/settings/settings.types';

export const defaultRuntimeStatusFixture: RuntimeStatusResponse = {
  appShell: {
    builtClientAvailable: false,
    clientDistPath: 'C:/dev/local-request-inspector/client/dist',
    clientIndexPath: 'C:/dev/local-request-inspector/client/dist/index.html',
    legacyRoute: '/',
    appRoute: '/app',
    devClientUrl: 'http://localhost:6173/',
    buildCommand: 'npm run build:client',
    serveCommand: 'npm run serve:app',
    devCommand: 'npm run dev:app',
    note: 'Built React app shell is not available yet. Build the client shell or use the Vite dev server for authoring.',
  },
  storage: {
    ready: true,
    rootDir: 'C:/dev/local-request-inspector/data',
    versionManifestPath: 'C:/dev/local-request-inspector/data/metadata/version-manifest.json',
    resourceManifestPath: 'C:/dev/local-request-inspector/data/metadata/resource-manifest.json',
    runtimeDbPath: 'C:/dev/local-request-inspector/data/runtime/runtime.sqlite',
    versionManifestAvailable: true,
    resourceManifestAvailable: true,
    runtimeDbAvailable: true,
  },
  secretStorage: {
    secureBackendAvailable: false,
    backendLabel: 'unavailable',
    readModelPolicy: 'Secret rows remain write-only and expose only hasStoredValue in read responses.',
    replacementWritePolicy: 'Secret replacement writes fail closed until a secure backend is configured.',
    runtimeResolutionPolicy: 'Run time continues to resolve plain variables only. Secret-backed placeholders stay unavailable until a secure backend is configured.',
    sanitizedLegacyEnvironmentCount: 1,
    sanitizedLegacySecretRowCount: 2,
    legacySanitizationNote: 'Sanitized 2 legacy secret row(s) across 1 environment(s) during this diagnostics pass.',
    note: 'A secure backend is not configured in this runtime. Secret replacement writes remain blocked, while ordinary environment JSON stays free of raw secret values.',
  },
  routes: [
    {
      label: 'Legacy prototype',
      path: '/',
      note: 'Legacy route remains available for compatibility.',
    },
    {
      label: 'Built app shell',
      path: '/app',
      note: 'Server-backed React shell when the client build is available.',
    },
    {
      label: 'Dev client',
      path: 'http://localhost:6173/',
      note: 'Vite dev server route for iterative authoring.',
    },
  ],
  commands: [
    {
      label: 'Start full app',
      command: 'npm run dev:app',
      purpose: 'Run the server lane and the Vite client lane together.',
    },
    {
      label: 'Build client shell',
      command: 'npm run build:client',
      purpose: 'Build the React shell served from /app.',
    },
    {
      label: 'Serve built shell',
      command: 'npm run serve:app',
      purpose: 'Run the legacy route plus the built app shell.',
    },
    {
      label: 'Bootstrap storage',
      command: 'npm run bootstrap:storage',
      purpose: 'Create manifests and the runtime database if they are missing.',
    },
    {
      label: 'Full verification',
      command: 'npm run check',
      purpose: 'Run lint, typecheck, node seam tests, and app-shell verification.',
    },
  ],
};
