const assert = require('node:assert/strict');
const express = require('express');
const { registerAppShellRoutes } = require('./register-app-shell-routes');
const { withServer } = require('./test-support');

function registerAppShellForTest(app, overrides = {}) {
  const dependencies = {
    express,
    fs: {
      existsSync: () => false,
    },
    rootDir: process.cwd(),
    devClientUrl: 'http://127.0.0.1:6173/',
    devFallbackEnabled: true,
    devProbeCacheMs: 0,
    probeDevClientAvailability: async () => false,
    ...overrides,
  };

  return registerAppShellRoutes(app, dependencies);
}

function testClientShellStatusReportsDevFallbackMode() {
  const app = express();
  const { getClientShellStatus } = registerAppShellForTest(app);
  const status = getClientShellStatus();

  assert.equal(status.builtClientAvailable, false);
  assert.equal(status.fallbackMode, 'dev-client-redirect-when-reachable');
  assert.equal(status.devFallbackEnabled, true);
}

async function testMissingBuiltShellReturnsUnavailableHtmlWhenDevClientUnavailable() {
  await withServer(
    (app) => {
      registerAppShellForTest(app, {
        probeDevClientAvailability: async () => false,
      });
    },
    async ({ baseUrl }) => {
      const response = await fetch(`${baseUrl}/app`, {
        headers: {
          accept: 'text/html',
        },
      });
      const body = await response.text();

      assert.equal(response.status, 503);
      assert.match(body, /Built app shell is not available yet/i);
    },
  );
}

async function testMissingBuiltShellRedirectsHtmlRequestsWhenDevClientIsReachable() {
  await withServer(
    (app) => {
      registerAppShellForTest(app, {
        probeDevClientAvailability: async () => true,
      });
    },
    async ({ baseUrl }) => {
      const response = await fetch(`${baseUrl}/app/workspace?tab=results`, {
        headers: {
          accept: 'text/html',
        },
        redirect: 'manual',
      });

      assert.equal(response.status, 307);
      assert.equal(response.headers.get('location'), 'http://127.0.0.1:6173/workspace?tab=results');
    },
  );
}

async function testMissingBuiltShellKeepsNonHtmlRequestsFailClosed() {
  await withServer(
    (app) => {
      registerAppShellForTest(app, {
        probeDevClientAvailability: async () => true,
      });
    },
    async ({ baseUrl }) => {
      const response = await fetch(`${baseUrl}/app`, {
        headers: {
          accept: 'application/json',
        },
      });
      const body = await response.text();

      assert.equal(response.status, 503);
      assert.match(body, /Run "npm run build:client"/i);
      assert.match(body, /run "npm run dev:app"/i);
    },
  );
}

(async function run() {
  testClientShellStatusReportsDevFallbackMode();
  await testMissingBuiltShellReturnsUnavailableHtmlWhenDevClientUnavailable();
  await testMissingBuiltShellRedirectsHtmlRequestsWhenDevClientIsReachable();
  await testMissingBuiltShellKeepsNonHtmlRequestsFailClosed();
})();
