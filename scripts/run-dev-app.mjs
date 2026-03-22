import process from 'node:process';
import { spawn } from 'node:child_process';

const children = [];
let shuttingDown = false;

function createLaneSpawnSpec(scriptName) {
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

function stopChildren(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill(process.platform === 'win32' ? undefined : 'SIGINT');
    }
  }

  setTimeout(() => {
    process.exit(exitCode);
  }, 150);
}

function startLane(name, scriptName) {
  const spawnSpec = createLaneSpawnSpec(scriptName);
  const child = spawn(spawnSpec.command, spawnSpec.args, {
    stdio: 'inherit',
    shell: false,
    windowsHide: false,
  });

  child.on('exit', (code, signal) => {
    if (shuttingDown) {
      return;
    }

    if (signal) {
      console.error(`[dev:app] ${name} stopped by signal ${signal}.`);
      stopChildren(1);
      return;
    }

    if ((code || 0) !== 0) {
      console.error(`[dev:app] ${name} exited with code ${code}.`);
      stopChildren(code || 1);
      return;
    }

    console.log(`[dev:app] ${name} completed.`);
    stopChildren(0);
  });

  child.on('error', (error) => {
    console.error(`[dev:app] Failed to start ${name}: ${error.message}`);
    stopChildren(1);
  });

  children.push(child);
}

process.on('SIGINT', () => stopChildren(0));
process.on('SIGTERM', () => stopChildren(0));

console.log('[dev:app] Starting server and Vite client lanes...');
startLane('server lane', 'dev:server');
startLane('client lane', 'dev:client');