import process from 'node:process';
import { spawn } from 'node:child_process';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const children = [];
let shuttingDown = false;

function stopChildren(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGINT');
    }
  }

  setTimeout(() => {
    process.exit(exitCode);
  }, 150);
}

function startLane(name, scriptName) {
  const child = spawn(npmCommand, ['run', scriptName], {
    stdio: 'inherit',
    shell: false,
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