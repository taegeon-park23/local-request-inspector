export type ScriptType = 'pre-request' | 'post-response' | 'tests';

export interface SavedScriptInput {
  id?: string;
  name: string;
  description: string;
  scriptType: ScriptType;
  sourceCode: string;
  templateId?: string;
}

export interface SavedScriptRecord extends SavedScriptInput {
  id: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  sourcePreview: string;
  capabilitySummary: string;
  deferredSummary: string;
  templateSummary: string;
  sourceLabel: string;
}

export interface ScriptTemplateRecord {
  id: string;
  name: string;
  description: string;
  templateType: ScriptType;
  sourceCode: string;
  sourcePreview: string;
  capabilitySummary: string;
  templateSummary: string;
  tags: string[];
  isSystemTemplate: boolean;
  createdAt: string;
  updatedAt: string;
}
