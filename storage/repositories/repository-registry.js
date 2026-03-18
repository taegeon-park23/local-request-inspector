function createRepositoryRegistry({ resourceStorage, runtimeStorage }) {
  return {
    resources: {
      storage: resourceStorage,
      // TODO(T009): Introduce entity-specific repositories once shared schema contracts are lifted into code.
    },
    runtime: {
      storage: runtimeStorage,
      // TODO(T009/T014): Add runtime-query repositories for captures and execution history summaries.
    },
  };
}

module.exports = {
  createRepositoryRegistry,
};
