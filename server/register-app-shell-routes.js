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
          <li>When the dev client is reachable, HTML requests to <code>${status.appRoute}</code> are redirected there automatically.</li>
        </ul>
      </div>
    </main>
  </body>
</html>`;
}

function createDefaultDevClientProbe() {
  return async function probeDevClientAvailability(devClientUrl, timeoutMs) {
    if (typeof fetch !== 'function') {
      return false;
    }

    const controller = typeof AbortController === 'function'
      ? new AbortController()
      : null;
    const timeoutHandle = controller
      ? setTimeout(() => controller.abort(), Math.max(100, Number(timeoutMs) || 700))
      : null;

    try {
      const response = await fetch(devClientUrl, {
        method: 'GET',
        signal: controller ? controller.signal : undefined,
        headers: {
          accept: 'text/html',
        },
      });
      return response.status >= 200 && response.status < 500;
    } catch (error) {
      return false;
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }
  };
}

function buildDevClientRedirectUrl(req, status) {
  const sourceUrl = new URL(req.originalUrl || req.url || status.appRoute, 'http://127.0.0.1');
  const appRouteBase = String(status.appRoute || '/app').replace(/\/+$/u, '') || '/app';
  let mappedPathname = sourceUrl.pathname;

  if (mappedPathname === appRouteBase) {
    mappedPathname = '/';
  } else if (mappedPathname.startsWith(appRouteBase + '/')) {
    mappedPathname = mappedPathname.slice(appRouteBase.length);
  }

  if (!mappedPathname.startsWith('/')) {
    mappedPathname = '/' + mappedPathname;
  }

  const redirectUrl = new URL(status.devClientUrl);
  redirectUrl.pathname = mappedPathname;
  redirectUrl.search = sourceUrl.search;
  return redirectUrl.toString();
}

function registerAppShellRoutes(app, dependencies) {
  const {
    express,
    fs,
    rootDir,
    devClientUrl = 'http://localhost:6173/',
    devFallbackEnabled = true,
    devProbeTimeoutMs = 700,
    devProbeCacheMs = 2_000,
    probeDevClientAvailability = createDefaultDevClientProbe(),
  } = dependencies;
  const clientDistPath = path.join(rootDir, 'client', 'dist');
  const clientIndexPath = path.join(clientDistPath, 'index.html');
  const appShellStatic = express.static(clientDistPath);
  const devClientProbeCache = {
    checkedAt: 0,
    available: false,
  };

  function getClientShellStatus() {
    const builtClientAvailable = fs.existsSync(clientIndexPath);
    const fallbackMode = builtClientAvailable
      ? 'built-shell'
      : devFallbackEnabled
        ? 'dev-client-redirect-when-reachable'
        : 'unavailable-page';

    return {
      builtClientAvailable,
      clientDistPath,
      clientIndexPath,
      legacyRoute: '/',
      appRoute: '/app',
      fallbackMode,
      devFallbackEnabled,
      devClientUrl,
      buildCommand: 'npm run build:client',
      serveCommand: 'npm run serve:app',
      devCommand: 'npm run dev:app',
      devProbeTimeoutMs,
      devProbeCacheMs,
      note: builtClientAvailable
        ? 'Built React app shell is available from the server-backed /app route.'
        : devFallbackEnabled
          ? 'Built React app shell is not available yet. If the Vite dev client is reachable, HTML requests to /app are redirected there; otherwise /app returns the unavailable fallback response.'
          : 'Built React app shell is not available yet. Build the client shell or use the Vite dev server for authoring.',
    };
  }

  async function isDevClientAvailable(status) {
    if (!status.devFallbackEnabled) {
      return false;
    }

    const now = Date.now();
    const cacheWindowMs = Math.max(0, Number(status.devProbeCacheMs) || 0);
    if (cacheWindowMs > 0 && now - devClientProbeCache.checkedAt < cacheWindowMs) {
      return devClientProbeCache.available;
    }

    const available = await probeDevClientAvailability(status.devClientUrl, status.devProbeTimeoutMs);
    devClientProbeCache.checkedAt = now;
    devClientProbeCache.available = available;
    return available;
  }

  async function sendAppShellUnavailable(req, res) {
    const status = getClientShellStatus();
    const expectsHtml = req.method === 'GET' && req.accepts('html');

    if (expectsHtml && status.devFallbackEnabled) {
      const devClientAvailable = await isDevClientAvailable(status);

      if (devClientAvailable) {
        return res.redirect(307, buildDevClientRedirectUrl(req, status));
      }
    }

    if (expectsHtml) {
      return res.status(503).send(renderAppShellUnavailablePage(status));
    }

    return res.status(503).type('text/plain').send(
      `${status.note} Run "${status.buildCommand}" to enable ${status.appRoute} or run "${status.devCommand}" for dev fallback at ${status.devClientUrl}.`,
    );
  }

  app.use(express.static(path.join(rootDir, 'public')));

  app.use('/app', async (req, res, next) => {
    if (!getClientShellStatus().builtClientAvailable) {
      return await sendAppShellUnavailable(req, res);
    }

    return appShellStatic(req, res, next);
  });

  app.get(/^\/app(?:\/.*)?$/, async (req, res) => {
    const status = getClientShellStatus();

    if (!status.builtClientAvailable) {
      return await sendAppShellUnavailable(req, res);
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
