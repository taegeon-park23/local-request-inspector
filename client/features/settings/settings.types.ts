export interface RuntimeStatusCommand {
  label: string;
  command: string;
  purpose: string;
}

export interface RuntimeStatusRouteHint {
  label: string;
  path: string;
  note: string;
}

export interface RuntimeStatusResponse {
  appShell: {
    builtClientAvailable: boolean;
    clientDistPath: string;
    clientIndexPath: string;
    legacyRoute: string;
    appRoute: string;
    devClientUrl: string;
    buildCommand: string;
    serveCommand: string;
    devCommand: string;
    note: string;
  };
  storage: {
    ready: boolean;
    rootDir: string;
    versionManifestPath: string;
    resourceManifestPath: string;
    runtimeDbPath: string;
    versionManifestAvailable: boolean;
    resourceManifestAvailable: boolean;
    runtimeDbAvailable: boolean;
  };
  secretStorage: {
    secureBackendAvailable: boolean;
    backendLabel: string;
    providerId?: string;
    providerVersion?: string;
    providerStatus?: string;
    capabilities?: Array<'store' | 'resolve' | 'clear'>;
    readModelPolicy: string;
    replacementWritePolicy: string;
    runtimeResolutionPolicy: string;
    sanitizedLegacyEnvironmentCount: number;
    sanitizedLegacySecretRowCount: number;
    legacySanitizationNote: string;
    note: string;
  } | null;
  routes: RuntimeStatusRouteHint[];
  commands: RuntimeStatusCommand[];
}
