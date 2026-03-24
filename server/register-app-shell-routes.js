const path = require('node:path');

function renderAppShellUnavailablePage(status) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>App shell not built</title>
    <style>
      body {
        margin: 0;
        font-family: "Segoe UI", sans-serif;
        background: #0f172a;
        color: #e2e8f0;
      }
      main {
        max-width: 760px;
        margin: 0 auto;
        padding: 48px 24px;
      }
      h1 {
        margin-top: 0;
        font-size: 2rem;
      }
      p,
      li {
        line-height: 1.6;
      }
      code {
        background: rgba(148, 163, 184, 0.18);
        border-radius: 6px;
        padding: 2px 6px;
      }
      .panel {
        margin-top: 24px;
        padding: 20px;
        border-radius: 12px;
        background: rgba(15, 23, 42, 0.72);
        border: 1px solid rgba(148, 163, 184, 0.28);
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Built app shell is not available yet</h1>
      <p>${status.note}</p>
      <div class="panel">
        <p><strong>Server routes</strong></p>
        <ul>
          <li><code>${status.legacyRoute}</code> keeps serving the legacy prototype.</li>
          <li><code>${status.appRoute}</code> serves the built React shell after <code>${status.buildCommand}</code>.</li>
        </ul>
      </div>
      <div class="panel">
        <p><strong>Recommended next steps</strong></p>
        <ul>
          <li>Build the shell: <code>${status.buildCommand}</code></li>
          <li>Serve the built shell: <code>${status.serveCommand}</code></li>
          <li>For iterative authoring, run <code>${status.devCommand}</code> and open <code>${status.devClientUrl}</code></li>
        </ul>
      </div>
    </main>
  </body>
</html>`;
}

function registerAppShellRoutes(app, dependencies) {
  const {
    express,
    fs,
    rootDir,
  } = dependencies;
  const clientDistPath = path.join(rootDir, 'client', 'dist');
  const clientIndexPath = path.join(clientDistPath, 'index.html');
  const appShellStatic = express.static(clientDistPath);

  function getClientShellStatus() {
    const builtClientAvailable = fs.existsSync(clientIndexPath);

    return {
      builtClientAvailable,
      clientDistPath,
      clientIndexPath,
      legacyRoute: '/',
      appRoute: '/app',
      devClientUrl: 'http://localhost:6173/',
      buildCommand: 'npm run build:client',
      serveCommand: 'npm run serve:app',
      devCommand: 'npm run dev:app',
      note: builtClientAvailable
        ? 'Built React app shell is available from the server-backed /app route.'
        : 'Built React app shell is not available yet. Build the client shell or use the Vite dev server for authoring.',
    };
  }

  function sendAppShellUnavailable(req, res) {
    const status = getClientShellStatus();

    if (req.method === 'GET' && req.accepts('html')) {
      return res.status(503).send(renderAppShellUnavailablePage(status));
    }

    return res.status(503).type('text/plain').send(
      `${status.note} Run "${status.buildCommand}" to enable ${status.appRoute} or use ${status.devClientUrl} during development.`,
    );
  }

  app.use(express.static(path.join(rootDir, 'public')));

  app.use('/app', (req, res, next) => {
    if (!getClientShellStatus().builtClientAvailable) {
      return sendAppShellUnavailable(req, res);
    }

    return appShellStatic(req, res, next);
  });

  app.get(/^\/app(?:\/.*)?$/, (req, res) => {
    const status = getClientShellStatus();

    if (!status.builtClientAvailable) {
      return sendAppShellUnavailable(req, res);
    }

    return res.sendFile(status.clientIndexPath);
  });

  return {
    getClientShellStatus,
  };
}

module.exports = {
  registerAppShellRoutes,
};
