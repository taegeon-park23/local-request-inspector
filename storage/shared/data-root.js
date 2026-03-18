const path = require('path');

function resolveDataRoot(options = {}) {
  const explicitDataRoot = options.explicitDataRoot || process.env.LRI_DATA_DIR;
  if (explicitDataRoot) {
    return path.resolve(explicitDataRoot);
  }

  return path.join(process.cwd(), '.local-request-inspector');
}

function buildStorageLayout(options = {}) {
  const rootDir = resolveDataRoot(options);

  return {
    rootDir,
    resourcesDir: path.join(rootDir, 'resources'),
    runtimeDir: path.join(rootDir, 'runtime'),
    metadataDir: path.join(rootDir, 'metadata'),
    runtimeDbPath: path.join(rootDir, 'runtime', 'runtime.sqlite'),
    resourceManifestPath: path.join(rootDir, 'metadata', 'resource-manifest.json'),
    versionManifestPath: path.join(rootDir, 'metadata', 'storage-version.json'),
  };
}

module.exports = {
  resolveDataRoot,
  buildStorageLayout,
};
