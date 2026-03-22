import type { HttpMethodLabel } from '@client/features/request-builder/request-tab.types';

export type RequestEditorTabId = 'params' | 'headers' | 'body' | 'auth' | 'scripts';
export type RequestScriptStageId = 'pre-request' | 'post-response' | 'tests';

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

export interface RequestDraftScriptsState {
  activeStage: RequestScriptStageId;
  preRequest: string;
  postResponse: string;
  tests: string;
}

export interface RequestDraftScriptsSeed {
  activeStage?: RequestScriptStageId;
  preRequest?: string;
  postResponse?: string;
  tests?: string;
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
  collectionName?: string;
  folderName?: string;
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
  collectionName?: string;
  folderName?: string;
}
