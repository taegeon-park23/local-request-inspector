import type { RequestScriptStageId } from '@client/features/request-builder/request-draft.types';

export const FORBIDDEN_SCRIPT_TOKEN_PATTERN = /\b(?:process|require|module|exports|__dirname|__filename|globalThis|global|fs|path|child_process)\b/g;

export interface ScriptCompletionItem {
  label: string;
  insertText: string;
  detail: string;
  documentation: string;
}

export interface ScriptStageCapabilityProfile {
  stageId: RequestScriptStageId;
  globalDeclarationSource: string;
  completionItems: ScriptCompletionItem[];
  forbiddenTokenPattern: RegExp;
}

const COMMON_DECLARATIONS = `
declare const console: {
  log(...values: unknown[]): void;
  warn(...values: unknown[]): void;
  error(...values: unknown[]): void;
};

declare const summary: {
  set(message: string): void;
  clear(): void;
};

interface ScriptReadonlyHeaders {
  get(name: string): string | undefined;
  entries(): Array<[string, string]>;
}

interface ScriptReadonlyRequest {
  method: string;
  url: string;
  headers: ScriptReadonlyHeaders;
  params: Array<{ key: string; value: string }>;
  bodyMode: string;
  bodyText: string;
  authSummary: string;
}

interface ScriptReadonlyResponse {
  status: number;
  ok: boolean;
  headers: ScriptReadonlyHeaders;
  body: {
    text: string;
    preview: string;
    json(): unknown;
  };
}
`;

const PRE_REQUEST_DECLARATIONS = `
${COMMON_DECLARATIONS}
interface ScriptMutableCollection {
  get(name: string): string | undefined;
  set(name: string, value: string): void;
  delete(name: string): void;
  entries(): Array<[string, string]>;
}

declare const request: {
  method: string;
  url: string;
  headers: ScriptMutableCollection;
  params: ScriptMutableCollection;
  body: {
    mode: string;
    text: string;
    setText(nextBodyText: string): void;
    clear(): void;
  };
  auth: {
    type: string;
    setBearerToken(token: string): void;
    clear(): void;
    setBasic(): never;
    setApiKey(): never;
  };
};
`;

const POST_RESPONSE_DECLARATIONS = `
${COMMON_DECLARATIONS}
declare const request: ScriptReadonlyRequest;
declare const response: ScriptReadonlyResponse;
`;

const TESTS_DECLARATIONS = `
${POST_RESPONSE_DECLARATIONS}
declare function assert(condition: unknown, message?: string): boolean;
declare function test(name: string, callback: () => void): void;
`;

const PRE_REQUEST_COMPLETIONS: ScriptCompletionItem[] = [
  {
    label: 'request',
    insertText: 'request',
    detail: 'Mutable request context',
    documentation: 'Bounded mutable request context available before transport.',
  },
  {
    label: 'request.headers.set',
    insertText: "request.headers.set('${1:header-name}', '${2:value}');",
    detail: 'Set request header',
    documentation: 'Adds or updates a request header before send.',
  },
  {
    label: 'request.params.set',
    insertText: "request.params.set('${1:param}', '${2:value}');",
    detail: 'Set request query param',
    documentation: 'Adds or updates a query parameter before send.',
  },
  {
    label: 'request.body.setText',
    insertText: "request.body.setText('${1:body}');",
    detail: 'Set request body text',
    documentation: 'Updates request body text for none/text/json modes.',
  },
  {
    label: 'request.auth.setBearerToken',
    insertText: "request.auth.setBearerToken('${1:token}');",
    detail: 'Set bearer token',
    documentation: 'Sets bearer-token auth on the bounded request context.',
  },
  {
    label: 'console.log',
    insertText: "console.log('${1:message}');",
    detail: 'Console log',
    documentation: 'Writes a bounded console log line for this stage.',
  },
  {
    label: 'summary.set',
    insertText: "summary.set('${1:summary message}');",
    detail: 'Stage summary',
    documentation: 'Sets a bounded summary line for this stage.',
  },
];

const POST_RESPONSE_COMPLETIONS: ScriptCompletionItem[] = [
  {
    label: 'request',
    insertText: 'request',
    detail: 'Readonly request context',
    documentation: 'Readonly request snapshot for post-response and tests stages.',
  },
  {
    label: 'response',
    insertText: 'response',
    detail: 'Readonly response context',
    documentation: 'Readonly response context with headers and parsed body helpers.',
  },
  {
    label: 'response.status',
    insertText: 'response.status',
    detail: 'Response status',
    documentation: 'Numeric response status code.',
  },
  {
    label: 'response.body.json',
    insertText: 'response.body.json()',
    detail: 'Parse JSON response body',
    documentation: 'Parses response body as JSON with bounded redaction semantics.',
  },
  {
    label: 'console.warn',
    insertText: "console.warn('${1:warning}');",
    detail: 'Console warning',
    documentation: 'Writes a bounded warning line for this stage.',
  },
  {
    label: 'summary.set',
    insertText: "summary.set('${1:summary message}');",
    detail: 'Stage summary',
    documentation: 'Sets a bounded summary line for this stage.',
  },
];

const TESTS_COMPLETIONS: ScriptCompletionItem[] = [
  ...POST_RESPONSE_COMPLETIONS,
  {
    label: 'assert',
    insertText: "assert(${1:condition}, '${2:assertion message}');",
    detail: 'Assertion helper',
    documentation: 'Registers pass/fail assertions in the tests stage.',
  },
  {
    label: 'test',
    insertText: "test('${1:test name}', () => {\n  ${2:assert(response.status === 200, 'status is 200');}\n});",
    detail: 'Named test block',
    documentation: 'Groups assertions under a named bounded test block.',
  },
];

const STAGE_CAPABILITY_PROFILES: Record<RequestScriptStageId, ScriptStageCapabilityProfile> = {
  'pre-request': {
    stageId: 'pre-request',
    globalDeclarationSource: PRE_REQUEST_DECLARATIONS,
    completionItems: PRE_REQUEST_COMPLETIONS,
    forbiddenTokenPattern: FORBIDDEN_SCRIPT_TOKEN_PATTERN,
  },
  'post-response': {
    stageId: 'post-response',
    globalDeclarationSource: POST_RESPONSE_DECLARATIONS,
    completionItems: POST_RESPONSE_COMPLETIONS,
    forbiddenTokenPattern: FORBIDDEN_SCRIPT_TOKEN_PATTERN,
  },
  tests: {
    stageId: 'tests',
    globalDeclarationSource: TESTS_DECLARATIONS,
    completionItems: TESTS_COMPLETIONS,
    forbiddenTokenPattern: FORBIDDEN_SCRIPT_TOKEN_PATTERN,
  },
};

export function getScriptStageCapabilityProfile(stageId: RequestScriptStageId): ScriptStageCapabilityProfile {
  return STAGE_CAPABILITY_PROFILES[stageId];
}

