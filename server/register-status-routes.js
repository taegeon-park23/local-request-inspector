function registerStatusRoutes(app, dependencies) {
  const {
    sendData,
    sendError,
    getClientShellStatus,
    createRuntimeStatusSnapshot,
    layout,
  } = dependencies;

  app.get('/api/app-shell-status', (req, res) => {
    return sendData(res, {
      appShell: getClientShellStatus(),
    });
  });

  app.get('/api/settings/runtime-status', (req, res) => {
    try {
      return sendData(res, {
        status: createRuntimeStatusSnapshot({
          appShell: getClientShellStatus(),
          layout,
        }),
      });
    } catch (error) {
      return sendError(res, 500, 'runtime_status_failed', error.message);
    }
  });
}

module.exports = {
  registerStatusRoutes,
};
