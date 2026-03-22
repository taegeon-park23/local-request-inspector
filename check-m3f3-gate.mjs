import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';
import { setTimeout as clearableTimeout, clearTimeout } from 'node:timers';
import { fileURLToPath } from 'node:url';
import {
  inspectEsbuildTransformSupport,
  patchWindowsNetUseExec,
} from './scripts/esbuild-sandbox-compat.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = __dirname;
const devHost = '127.0.0.1';
const devPort = 5173;
const devBaseUrl = `http://${devHost}:${devPort}`;
const fetchTimeoutMs = 5_000;

const transformTargets = [
  {
    label: 'Root HTML',
    path: '/',
    expectedKind: 'html',
  },
  {
    label: 'App bootstrap entry',
    path: '/app/bootstrap/main.tsx',
    expectedKind: 'module',
  },
  {
    label: 'RequestWorkSurfacePlaceholder.tsx',
    path: '/features/request-builder/components/RequestWorkSurfacePlaceholder.tsx',
    expectedKind: 'module',
  },
  {
    label: 'RequestResultPanelPlaceholder.tsx',
    path: '/features/request-builder/components/RequestResultPanelPlaceholder.tsx',
    expectedKind: 'module',
  },
];

function createNpmRunSpec(scriptName) {
  if (process.platform === 'win32') {
    return {
      command: process.env.ComSpec || 'cmd.exe',
      args: ['/d', '/s', '/c', `npm.cmd run ${scriptName}`],
    };
  }

  return {
    command: 'npm',
    args: ['run', scriptName],
  };
}

async function runNpmScript(scriptName) {
  const spawnSpec = createNpmRunSpec(scriptName);

  return await new Promise((resolve) => {
    const child = spawn(spawnSpec.command, spawnSpec.args, {
      cwd: repoRoot,
      stdio: 'inherit',
      shell: false,
      windowsHide: false,
    });

    child.on('error', (error) => {
      resolve({
        ok: false,
        code: null,
        signal: null,
        error: error?.message || String(error),
      });
    });

    child.on('exit', (code, signal) => {
      resolve({
        ok: code === 0,
        code,
        signal,
        error: null,
      });
    });
  });
}

async function fetchText(url) {
  const controller = new globalThis.AbortController();
  const timeoutHandle = clearableTimeout(() => controller.abort(), fetchTimeoutMs);

  try {
    const response = await globalThis.fetch(url, {
      signal: controller.signal,
      headers: {
        accept: '*/*',
      },
    });
    const content = await response.text();

    return {
      ok: response.ok,
      status: response.status,
      content,
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      content: '',
      error: error?.message || String(error),
    };
  } finally {
    clearTimeout(timeoutHandle);
  }
}

function normalizeFirstLine(content) {
  return content
    .trimStart()
    .split(/\r?\n/u)[0]
    ?.slice(0, 160) ?? '';
}

function classifyProbe(target, result) {
  const firstLine = normalizeFirstLine(result.content);
  const servedHtml = firstLine.toLowerCase().startsWith('<!doctype html');

  if (result.error) {
    return {
      target,
      ok: false,
      status: result.status ?? 'error',
      summary: result.error,
      firstLine,
    };
  }

  if (target.expectedKind === 'html') {
    const ok = result.status === 200 && servedHtml;

    return {
      target,
      ok,
      status: String(result.status ?? 'unknown'),
      summary: ok ? 'served expected HTML shell' : 'did not serve expected HTML shell',
      firstLine,
    };
  }

  if (result.status !== 200) {
    return {
      target,
      ok: false,
      status: String(result.status ?? 'unknown'),
      summary: 'module request failed before transform completed',
      firstLine,
    };
  }

  if (servedHtml) {
    return {
      target,
      ok: false,
      status: String(result.status),
      summary: 'module request fell back to HTML instead of transformed source',
      firstLine,
    };
  }

  return {
    target,
    ok: true,
    status: String(result.status),
    summary: 'served transformed module source',
    firstLine,
  };
}

function formatProbe(probe) {
  const lines = [
    `- ${probe.target.label}: ${probe.ok ? 'ok' : 'failed'} (${probe.status})`,
    `  ${probe.summary}`,
  ];

  if (probe.firstLine) {
    lines.push(`  first line: ${probe.firstLine}`);
  }

  return lines.join('\n');
}

function describePreflight(result) {
  if (result.supported) {
    return 'ready';
  }

  return `${result.status} (${result.code}${result.originalCode ? ` / ${result.originalCode}` : ''})`;
}

function collectRecentLogs(logLines, limit = 16) {
  return logLines.slice(-limit);
}

function detectEnvBlocked(logLines, buildPreflight, testUiPreflight) {
  if (buildPreflight.status === 'sandbox-blocked' || testUiPreflight.status === 'sandbox-blocked') {
    return true;
  }

  return logLines.some((line) => line.includes('vite:esbuild') || line.includes('spawn EPERM'));
}

function classifyGate(typecheckResult, probes, logLines, buildPreflight, testUiPreflight) {
  if (!typecheckResult.ok) {
    return 'unknown_failure';
  }

  const moduleProbes = probes.filter((probe) => probe.target.expectedKind === 'module');
  const moduleTransformsHealthy = moduleProbes.length > 0 && moduleProbes.every((probe) => probe.ok);

  if (moduleTransformsHealthy) {
    return 'gate_clear';
  }

  if (detectEnvBlocked(logLines, buildPreflight, testUiPreflight)) {
    return 'env_blocked_transform';
  }

  const rootProbe = probes.find((probe) => probe.target.expectedKind === 'html');
  if (rootProbe?.ok) {
    return 'dev_start_only_not_sufficient';
  }

  return 'unknown_failure';
}

async function runDevTransformProbe() {
  patchWindowsNetUseExec();

  const logs = [];
  const viteModule = await import('vite');
  const viteConfigModule = await import('./vite.config.mjs');
  const baseLogger = viteModule.createLogger();
  const customLogger = {
    ...baseLogger,
    info(message, options) {
      logs.push(`[vite][info] ${message}`);
      return baseLogger.info(message, options);
    },
    warn(message, options) {
      logs.push(`[vite][warn] ${message}`);
      return baseLogger.warn(message, options);
    },
    error(message, options) {
      logs.push(`[vite][error] ${message}`);
      return baseLogger.error(message, options);
    },
  };

  const configExport = viteConfigModule.default;
  const baseConfig = typeof configExport === 'function'
    ? await configExport({
      command: 'serve',
      mode: 'development',
      isPreview: false,
      isSsrBuild: false,
    })
    : configExport;

  const server = await viteModule.createServer({
    ...baseConfig,
    clearScreen: false,
    logLevel: 'silent',
    customLogger,
    server: {
      ...baseConfig.server,
      host: devHost,
      port: devPort,
      strictPort: true,
    },
  });

  try {
    await server.listen();

    const probes = [];

    for (const target of transformTargets) {
      const result = await fetchText(devBaseUrl + target.path);
      probes.push(classifyProbe(target, result));
    }

    return {
      probes,
      logs,
      probeError: null,
    };
  } catch (error) {
    return {
      probes: [],
      logs,
      probeError: error?.message || String(error),
    };
  } finally {
    await server.close();
  }
}

const typecheckResult = await runNpmScript('typecheck');
const buildPreflight = await inspectEsbuildTransformSupport('build:client');
const testUiPreflight = await inspectEsbuildTransformSupport('test:ui');

let probeResult = {
  probes: [],
  logs: [],
  probeError: null,
};

if (typecheckResult.ok) {
  probeResult = await runDevTransformProbe();
}

const gateStatus = classifyGate(
  typecheckResult,
  probeResult.probes,
  probeResult.logs,
  buildPreflight,
  testUiPreflight,
);

const output = [
  '[check:m3f3-gate] M3-F3 gate check',
  `Gate status: ${gateStatus}`,
  '',
  `Typecheck: ${typecheckResult.ok ? 'passed' : 'failed'}`,
  `Build preflight: ${describePreflight(buildPreflight)}`,
  `UI test preflight: ${describePreflight(testUiPreflight)}`,
];

if (!typecheckResult.ok) {
  output.push('');
  output.push(`Typecheck failure detail: ${typecheckResult.error ?? `exit code ${typecheckResult.code ?? 'unknown'}`}`);
} else if (probeResult.probes.length === 0) {
  output.push('');
  output.push(`Dev probe: ${probeResult.probeError ?? 'failed before the root HTML shell became available.'}`);
} else {
  output.push('');
  output.push('Dev transform probes:');
  output.push(...probeResult.probes.map(formatProbe));
}

output.push('');

if (gateStatus === 'gate_clear') {
  output.push('Decision: M3-F3 can be revisited in this environment. Dev startup alone was not used as the success signal; real module transforms passed.');
} else if (gateStatus === 'env_blocked_transform') {
  output.push('Decision: M3-F3 stays gated. Dev server startup and root HTML are informational only; real TSX transforms are still blocked by esbuild worker startup in this environment.');
} else if (gateStatus === 'dev_start_only_not_sufficient') {
  output.push('Decision: M3-F3 stays gated. Vite started, but module-transform evidence is still not strong enough to clear the gate.');
} else {
  output.push('Decision: M3-F3 stays gated until the failure mode is better understood.');
}

const recentLogs = collectRecentLogs(probeResult.logs);
if (recentLogs.length > 0) {
  output.push('');
  output.push('Recent Vite output:');
  output.push(...recentLogs);
}

globalThis.console.log(output.join('\n'));

process.exit(gateStatus === 'gate_clear' ? 0 : 1);
