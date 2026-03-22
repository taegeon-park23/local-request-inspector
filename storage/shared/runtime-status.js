const fs = require('fs');

function createRuntimeStatusSnapshot({ appShell, layout }) {
  const versionManifestAvailable = fs.existsSync(layout.versionManifestPath);
  const resourceManifestAvailable = fs.existsSync(layout.resourceManifestPath);
  const runtimeDbAvailable = fs.existsSync(layout.runtimeDbPath);

  return {
    appShell,
    storage: {
      ready: versionManifestAvailable && resourceManifestAvailable && runtimeDbAvailable,
      rootDir: layout.rootDir,
      versionManifestPath: layout.versionManifestPath,
      resourceManifestPath: layout.resourceManifestPath,
      runtimeDbPath: layout.runtimeDbPath,
      versionManifestAvailable,
      resourceManifestAvailable,
      runtimeDbAvailable,
    },
    routes: [
      { label: 'Legacy prototype', path: appShell.legacyRoute, note: 'Legacy route remains available for compatibility.' },
      { label: 'Built app shell', path: appShell.appRoute, note: 'Server-backed React shell when the client build is available.' },
      { label: 'Dev client', path: appShell.devClientUrl, note: 'Vite dev server route for iterative authoring.' },
    ],
    commands: [
      { label: 'Start full app', command: appShell.devCommand, purpose: 'Run the server lane and the Vite client lane together.' },
      { label: 'Build client shell', command: appShell.buildCommand, purpose: 'Build the React shell served from /app.' },
      { label: 'Serve built shell', command: appShell.serveCommand, purpose: 'Run the legacy route plus the built app shell.' },
      { label: 'Bootstrap storage', command: 'npm run bootstrap:storage', purpose: 'Create manifests and the runtime database if they are missing.' },
      { label: 'Full verification', command: 'npm run check', purpose: 'Run lint, typecheck, node seam tests, and app-shell verification.' },
    ],
  };
}

module.exports = {
  createRuntimeStatusSnapshot,
};
