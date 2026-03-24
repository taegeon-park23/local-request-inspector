const { executeScriptStageInProcess } = require('./execution-script-runtime');

let inputText = '';

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  inputText += chunk;
});

process.stdin.on('end', async () => {
  try {
    const payload = inputText.trim().length > 0 ? JSON.parse(inputText) : {};
    const result = await executeScriptStageInProcess(payload);
    process.stdout.write(JSON.stringify(result));
  } catch (error) {
    process.stdout.write(JSON.stringify({
      outcome: 'failed',
      errorCode: error?.code || 'script_stage_failed',
      errorSummary: error?.message || 'Script stage execution failed before a result could be returned.',
    }));
    process.exitCode = 1;
  }
});
