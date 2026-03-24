import type { HttpMethodLabel } from '@client/features/request-builder/request-tab.types';

export type RequestEditorTabId = 'params' | 'headers' | 'body' | 'auth' | 'scripts';
export type RequestScriptStageId = 'pre-request' | 'post-response' | 'tests';
export type RequestScriptBindingMode = 'inline' | 'linked';

export type RequestBodyMode =
  | 'none'
  | 'json'
  | 'text'
  | 'form-urlencoded'
  | 'multipart-form-data';

export type RequestAuthType = 'none' | 'bearer' | 'basic' | 'api-key';

export type ApiKeyPlacement = 'header' | 'query';

export interface RequestKeyValueRow {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface RequestDraftAuthState {
  type: RequestAuthType;
  bearerToken: string;
  basicUsername: string;
  basicPassword: string;
  apiKeyName: string;
  apiKeyValue: string;
  apiKeyPlacement: ApiKeyPlacement;
}

export interface RequestInlineScriptBinding {
  mode: 'inline';
  sourceCode: string;
}

export interface RequestLinkedScriptBinding {
  mode: 'linked';
  savedScriptId: string;
  savedScriptNameSnapshot: string;
  linkedAt: string;
}

export type RequestScriptStageBinding = RequestInlineScriptBinding | RequestLinkedScriptBinding;
export type RequestScriptStageSeed = RequestScriptStageBinding | string;

export interface RequestDraftScriptsState {
  activeStage: RequestScriptStageId;
  preRequest: RequestScriptStageBinding;
  postResponse: RequestScriptStageBinding;
  tests: RequestScriptStageBinding;
}

export interface RequestDraftScriptsSeed {
  activeStage?: RequestScriptStageId;
  preRequest?: RequestScriptStageSeed;
  postResponse?: RequestScriptStageSeed;
  tests?: RequestScriptStageSeed;
}

export interface RequestDraftState {
  tabId: string;
  name: string;
  method: HttpMethodLabel;
  url: string;
  selectedEnvironmentId?: string | null;
  params: RequestKeyValueRow[];
  headers: RequestKeyValueRow[];
  bodyMode: RequestBodyMode;
  bodyText: string;
  formBody: RequestKeyValueRow[];
  multipartBody: RequestKeyValueRow[];
  auth: RequestDraftAuthState;
  scripts: RequestDraftScriptsState;
  activeEditorTab: RequestEditorTabId;
  dirty: boolean;
  collectionId?: string;
  collectionName?: string;
  requestGroupId?: string;
  requestGroupName?: string;
}

export interface RequestDraftSeed {
  name?: string;
  method?: HttpMethodLabel;
  url?: string;
  selectedEnvironmentId?: string | null;
  params?: RequestKeyValueRow[];
  headers?: RequestKeyValueRow[];
  bodyMode?: RequestBodyMode;
  bodyText?: string;
  formBody?: RequestKeyValueRow[];
  multipartBody?: RequestKeyValueRow[];
  auth?: Partial<RequestDraftAuthState>;
  scripts?: RequestDraftScriptsSeed;
  collectionId?: string;
  collectionName?: string;
  requestGroupId?: string;
  requestGroupName?: string;
}
