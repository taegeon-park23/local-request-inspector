const { createWorkspaceScopedResourceRepository } = require('./resource-repositories');
const { createRuntimeQueryRepository } = require('./runtime-query-repository');

function createRepositoryRegistry({
  resourceStorage,
  runtimeStorage,
  resourceDefinitions = {},
}) {
  return {
    resources: {
      storage: resourceStorage,
      collections: createWorkspaceScopedResourceRepository({
        entityType: 'collection',
        resourceStorage,
        ...resourceDefinitions.collections,
      }),
      requestGroups: createWorkspaceScopedResourceRepository({
        entityType: 'request-group',
        resourceStorage,
        ...resourceDefinitions.requestGroups,
      }),
      requests: createWorkspaceScopedResourceRepository({
        entityType: 'request',
        resourceStorage,
        ...resourceDefinitions.requests,
      }),
      environments: createWorkspaceScopedResourceRepository({
        entityType: 'environment',
        resourceStorage,
        ...resourceDefinitions.environments,
      }),
      scripts: createWorkspaceScopedResourceRepository({
        entityType: 'script',
        resourceStorage,
        ...resourceDefinitions.scripts,
      }),
      mockRules: createWorkspaceScopedResourceRepository({
        entityType: 'mock-rule',
        resourceStorage,
        ...resourceDefinitions.mockRules,
      }),
    },
    runtime: {
      storage: runtimeStorage,
      queries: createRuntimeQueryRepository({ runtimeStorage }),
    },
  };
}

module.exports = {
  createRepositoryRegistry,
};
