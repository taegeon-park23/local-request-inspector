const FORBIDDEN_TOKEN_OWNER = 'script-forbidden-token';

export interface ScriptDiagnosticMarker {
  owner: string;
  message: string;
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

function getLineStartOffsets(sourceCode: string) {
  const offsets = [0];

  for (let index = 0; index < sourceCode.length; index += 1) {
    if (sourceCode[index] === '\n') {
      offsets.push(index + 1);
    }
  }

  return offsets;
}

function resolveLineColumn(offsets: number[], absoluteIndex: number) {
  let lineIndex = 0;

  for (let index = 0; index < offsets.length; index += 1) {
    const offset = offsets[index] ?? Number.POSITIVE_INFINITY;

    if (offset > absoluteIndex) {
      break;
    }
    lineIndex = index;
  }

  const lineStart = offsets[lineIndex] ?? 0;
  return {
    lineNumber: lineIndex + 1,
    columnNumber: absoluteIndex - lineStart + 1,
  };
}

export function createForbiddenTokenDiagnostics(
  sourceCode: string,
  forbiddenTokenPattern: RegExp,
): ScriptDiagnosticMarker[] {
  const markers: ScriptDiagnosticMarker[] = [];
  const patternWithGlobalFlag = forbiddenTokenPattern.global
    ? forbiddenTokenPattern
    : new RegExp(forbiddenTokenPattern.source, `${forbiddenTokenPattern.flags}g`);
  patternWithGlobalFlag.lastIndex = 0;
  const lineOffsets = getLineStartOffsets(sourceCode);

  let match = patternWithGlobalFlag.exec(sourceCode);

  while (match) {
    const token = match[0] ?? '';
    const startIndex = match.index;
    const endIndex = startIndex + token.length;
    const start = resolveLineColumn(lineOffsets, startIndex);
    const end = resolveLineColumn(lineOffsets, Math.max(startIndex, endIndex - 1));

    markers.push({
      owner: FORBIDDEN_TOKEN_OWNER,
      message: `Blocked token "${token}" is unavailable in the bounded script runtime.`,
      startLineNumber: start.lineNumber,
      startColumn: start.columnNumber,
      endLineNumber: end.lineNumber,
      endColumn: end.columnNumber + 1,
    });

    match = patternWithGlobalFlag.exec(sourceCode);
  }

  return markers;
}
