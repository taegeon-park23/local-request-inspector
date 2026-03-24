import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');

function collectSeamTestFiles(directoryPath) {
  const entries = readdirSync(directoryPath, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const fullPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      return collectSeamTestFiles(fullPath);
    }

    if (entry.isFile() && (entry.name.endsWith('.test.js') || entry.name.endsWith('.test.mjs'))) {
      return [fullPath];
    }

    return [];
  });
}

const seamTestRoots = [
  path.join(projectRoot, 'storage'),
  path.join(projectRoot, 'server'),
  path.join(projectRoot, 'scripts'),
];

const seamTestFiles = seamTestRoots
  .flatMap((rootPath) => collectSeamTestFiles(rootPath))
  .sort((left, right) => left.localeCompare(right));

if (seamTestFiles.length === 0) {
  console.log('No low-level seam tests were found under storage/, server/, or scripts/.');
  process.exit(0);
}

for (const seamTestFile of seamTestFiles) {
  const relativePath = path.relative(projectRoot, seamTestFile);
  console.log(`[test:node] ${relativePath}`);

  const result = spawnSync(process.execPath, [seamTestFile], {
    cwd: projectRoot,
    stdio: 'inherit',
  });

  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }
}

