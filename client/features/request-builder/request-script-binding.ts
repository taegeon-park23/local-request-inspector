import type {
  RequestDraftScriptsSeed,
  RequestDraftScriptsState,
  RequestInlineScriptBinding,
  RequestLinkedScriptBinding,
  RequestScriptStageBinding,
  RequestScriptStageId,
  RequestScriptStageSeed,
} from '@client/features/request-builder/request-draft.types';

export const REQUEST_SCRIPT_STAGE_IDS: RequestScriptStageId[] = ['pre-request', 'post-response', 'tests'];

export const requestScriptStageFieldMap: Record<
  RequestScriptStageId,
  keyof Omit<RequestDraftScriptsState, 'activeStage'>
> = {
  'pre-request': 'preRequest',
  'post-response': 'postResponse',
  tests: 'tests',
};

export function createInlineRequestScriptBinding(sourceCode = ''): RequestInlineScriptBinding {
  return {
    mode: 'inline',
    sourceCode,
  };
}

export function createLinkedRequestScriptBinding(input: {
  savedScriptId: string;
  savedScriptNameSnapshot: string;
  linkedAt?: string | undefined;
}): RequestLinkedScriptBinding {
  return {
    mode: 'linked',
    savedScriptId: input.savedScriptId,
    savedScriptNameSnapshot: input.savedScriptNameSnapshot,
    linkedAt: input.linkedAt ?? new Date().toISOString(),
  };
}

export function isLinkedRequestScriptBinding(
  binding: RequestScriptStageBinding,
): binding is RequestLinkedScriptBinding {
  return binding.mode === 'linked';
}

export function normalizeRequestScriptStageBinding(
  input: RequestScriptStageSeed | null | undefined,
): RequestScriptStageBinding {
  if (typeof input === 'string') {
    return createInlineRequestScriptBinding(input);
  }

  if (!input || typeof input !== 'object') {
    return createInlineRequestScriptBinding('');
  }

  if (input.mode === 'linked') {
    return createLinkedRequestScriptBinding({
      savedScriptId: typeof input.savedScriptId === 'string' ? input.savedScriptId : '',
      savedScriptNameSnapshot: typeof input.savedScriptNameSnapshot === 'string' ? input.savedScriptNameSnapshot : '',
      linkedAt: typeof input.linkedAt === 'string' ? input.linkedAt : undefined,
    });
  }

  return createInlineRequestScriptBinding(typeof input.sourceCode === 'string' ? input.sourceCode : '');
}

export function normalizeRequestScriptsState(
  seed?: RequestDraftScriptsSeed | RequestDraftScriptsState | null,
): RequestDraftScriptsState {
  return {
    activeStage: REQUEST_SCRIPT_STAGE_IDS.includes(seed?.activeStage ?? 'pre-request')
      ? (seed?.activeStage ?? 'pre-request')
      : 'pre-request',
    preRequest: normalizeRequestScriptStageBinding(seed?.preRequest),
    postResponse: normalizeRequestScriptStageBinding(seed?.postResponse),
    tests: normalizeRequestScriptStageBinding(seed?.tests),
  };
}

export function getRequestScriptStageBinding(
  scripts: RequestDraftScriptsState,
  stage: RequestScriptStageId,
): RequestScriptStageBinding {
  return scripts[requestScriptStageFieldMap[stage]];
}

export function setRequestScriptStageBinding(
  scripts: RequestDraftScriptsState,
  stage: RequestScriptStageId,
  binding: RequestScriptStageSeed,
): RequestDraftScriptsState {
  return {
    ...scripts,
    [requestScriptStageFieldMap[stage]]: normalizeRequestScriptStageBinding(binding),
  };
}

export function getInlineRequestScriptStageSourceCode(
  scripts: RequestDraftScriptsState,
  stage: RequestScriptStageId,
): string {
  const binding = getRequestScriptStageBinding(scripts, stage);
  return binding.mode === 'inline' ? binding.sourceCode : '';
}

export function hasLinkedRequestScriptBindings(scripts: RequestDraftScriptsState): boolean {
  return REQUEST_SCRIPT_STAGE_IDS.some((stage) => isLinkedRequestScriptBinding(getRequestScriptStageBinding(scripts, stage)));
}

