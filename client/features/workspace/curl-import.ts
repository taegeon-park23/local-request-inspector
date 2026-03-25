import type { HttpMethodLabel } from '@client/features/request-builder/request-tab.types';
import type { RequestDraftSeed, RequestKeyValueRow } from '@client/features/request-builder/request-draft.types';

const SUPPORTED_METHODS: ReadonlySet<HttpMethodLabel> = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

interface ParsedHeader {
  key: string;
  value: string;
}

export class CurlImportParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CurlImportParseError';
  }
}

function tokenizeShellCommand(command: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let quote: '"' | '\'' | null = null;
  let escaped = false;

  for (const character of command.trim()) {
    if (escaped) {
      current += character;
      escaped = false;
      continue;
    }

    if (quote === '\'') {
      if (character === '\'') {
        quote = null;
      } else {
        current += character;
      }
      continue;
    }

    if (quote === '"') {
      if (character === '"') {
        quote = null;
      } else if (character === '\\') {
        escaped = true;
      } else {
        current += character;
      }
      continue;
    }

    if (character === '\\') {
      escaped = true;
      continue;
    }

    if (character === '\'' || character === '"') {
      quote = character;
      continue;
    }

    if (/\s/.test(character)) {
      if (current.length > 0) {
        tokens.push(current);
        current = '';
      }
      continue;
    }

    current += character;
  }

  if (quote !== null) {
    throw new CurlImportParseError('cURL command contains an unmatched quote.');
  }

  if (escaped) {
    current += '\\';
  }

  if (current.length > 0) {
    tokens.push(current);
  }

  return tokens;
}

function readHeader(rawHeader: string): ParsedHeader | null {
  const separatorIndex = rawHeader.indexOf(':');
  if (separatorIndex <= 0) {
    return null;
  }

  const key = rawHeader.slice(0, separatorIndex).trim();
  const value = rawHeader.slice(separatorIndex + 1).trim();
  if (key.length === 0) {
    return null;
  }

  return {
    key,
    value,
  };
}

function toDraftHeaderRows(headers: ParsedHeader[]): RequestKeyValueRow[] {
  return headers.map((header, index) => ({
    id: `curl-header-${index + 1}`,
    key: header.key,
    value: header.value,
    enabled: true,
  }));
}

function normalizeMethod(rawMethod: string | null, hasData: boolean): HttpMethodLabel {
  if (!rawMethod || rawMethod.trim().length === 0) {
    return hasData ? 'POST' : 'GET';
  }

  const normalizedMethod = rawMethod.trim().toUpperCase();
  if (SUPPORTED_METHODS.has(normalizedMethod as HttpMethodLabel)) {
    return normalizedMethod as HttpMethodLabel;
  }

  return hasData ? 'POST' : 'GET';
}

function buildDraftNameFromUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    const pathSegment = parsedUrl.pathname.split('/').filter((segment) => segment.length > 0).at(-1);
    if (pathSegment && pathSegment.trim().length > 0) {
      return decodeURIComponent(pathSegment);
    }

    if (parsedUrl.hostname.length > 0) {
      return parsedUrl.hostname;
    }
  } catch {
    // no-op: invalid URL fallback handled below
  }

  return 'Imported cURL Request';
}

function readBodyMode(contentTypeHeader: string | null): 'json' | 'text' {
  if (!contentTypeHeader) {
    return 'text';
  }

  const normalizedContentType = contentTypeHeader.toLowerCase();
  if (normalizedContentType.includes('application/json')) {
    return 'json';
  }

  return 'text';
}

function readOptionValue(tokens: string[], index: number, flagName: string): { value: string; nextIndex: number } {
  const value = tokens[index + 1];
  if (!value) {
    throw new CurlImportParseError(`cURL option ${flagName} requires a value.`);
  }

  return {
    value,
    nextIndex: index + 1,
  };
}

export function parseCurlCommandToDraftSeed(command: string): RequestDraftSeed {
  const tokens = tokenizeShellCommand(command);
  if (tokens.length === 0) {
    throw new CurlImportParseError('cURL command is empty.');
  }

  let cursor = 0;
  if (tokens[0]?.toLowerCase() === 'curl') {
    cursor = 1;
  }

  let methodToken: string | null = null;
  let urlToken: string | null = null;
  const headers: ParsedHeader[] = [];
  const bodySegments: string[] = [];

  for (let index = cursor; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token) {
      continue;
    }

    if (token === '-X' || token === '--request') {
      const option = readOptionValue(tokens, index, token);
      methodToken = option.value;
      index = option.nextIndex;
      continue;
    }

    if (token.startsWith('-X') && token.length > 2) {
      methodToken = token.slice(2);
      continue;
    }

    if (token.startsWith('--request=') && token.length > '--request='.length) {
      methodToken = token.slice('--request='.length);
      continue;
    }

    if (token === '-H' || token === '--header') {
      const option = readOptionValue(tokens, index, token);
      const parsedHeader = readHeader(option.value);
      if (parsedHeader) {
        headers.push(parsedHeader);
      }
      index = option.nextIndex;
      continue;
    }

    if (token.startsWith('--header=') && token.length > '--header='.length) {
      const parsedHeader = readHeader(token.slice('--header='.length));
      if (parsedHeader) {
        headers.push(parsedHeader);
      }
      continue;
    }

    if (
      token === '-d'
      || token === '--data'
      || token === '--data-raw'
      || token === '--data-binary'
      || token === '--data-urlencode'
    ) {
      const option = readOptionValue(tokens, index, token);
      bodySegments.push(option.value);
      index = option.nextIndex;
      continue;
    }

    if (
      token.startsWith('--data=')
      || token.startsWith('--data-raw=')
      || token.startsWith('--data-binary=')
      || token.startsWith('--data-urlencode=')
    ) {
      const separatorIndex = token.indexOf('=');
      bodySegments.push(token.slice(separatorIndex + 1));
      continue;
    }

    if (token === '--url') {
      const option = readOptionValue(tokens, index, token);
      urlToken = option.value;
      index = option.nextIndex;
      continue;
    }

    if (token.startsWith('--url=') && token.length > '--url='.length) {
      urlToken = token.slice('--url='.length);
      continue;
    }

    if (token.startsWith('-')) {
      continue;
    }

    if (!urlToken) {
      urlToken = token;
    }
  }

  if (!urlToken || urlToken.trim().length === 0) {
    throw new CurlImportParseError('Unable to find request URL in cURL command.');
  }

  const bodyText = bodySegments.join('&');
  const hasBody = bodyText.trim().length > 0;
  const contentTypeHeader = headers.find((header) => header.key.toLowerCase() === 'content-type')?.value ?? null;
  const method = normalizeMethod(methodToken, hasBody);

  const draftSeed: RequestDraftSeed = {
    name: buildDraftNameFromUrl(urlToken),
    method,
    url: urlToken,
    headers: toDraftHeaderRows(headers),
  };

  if (hasBody) {
    draftSeed.bodyMode = readBodyMode(contentTypeHeader);
    draftSeed.bodyText = bodyText;
  }

  return draftSeed;
}
