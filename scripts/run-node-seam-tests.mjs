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

    if (entry.isFile() && entry.name.endsWith('.test.js')) {
      return [fullPath];
    }

    return [];
  });
}

const seamTestFiles = collectSeamTestFiles(path.join(projectRoot, 'storage'))
  .sort((left, right) => left.localeCompare(right));

if (seamTestFiles.length === 0) {
  console.log('No low-level seam tests were found under storage/.');
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
