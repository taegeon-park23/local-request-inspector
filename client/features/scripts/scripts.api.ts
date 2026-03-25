import { DEFAULT_WORKSPACE_ID, parseApiJsonResponse } from '@client/features/request-builder/request-builder.api';
import type {
  SavedScriptInput,
  SavedScriptRecord,
  ScriptTemplateRecord,
} from '@client/features/scripts/scripts.types';

export const workspaceScriptsQueryKey = ['workspace-scripts', DEFAULT_WORKSPACE_ID] as const;
export const savedScriptDetailQueryKey = (scriptId: string | null) =>
  ['saved-script', scriptId] as const;
export const scriptTemplatesQueryKey = ['script-templates'] as const;
export const scriptTemplateDetailQueryKey = (templateId: string | null) =>
  ['script-template', templateId] as const;

function compareIsoDescending(left: string | undefined, right: string | undefined) {
  return String(right ?? '').localeCompare(String(left ?? ''));
}

export function compareSavedScripts(left: SavedScriptRecord, right: SavedScriptRecord) {
  const updatedAtDiff = compareIsoDescending(left.updatedAt, right.updatedAt);
  if (updatedAtDiff !== 0) {
    return updatedAtDiff;
  }

  const createdAtDiff = compareIsoDescending(left.createdAt, right.createdAt);
  if (createdAtDiff !== 0) {
    return createdAtDiff;
  }

  const nameDiff = left.name.localeCompare(right.name);
  if (nameDiff !== 0) {
    return nameDiff;
  }

  return left.id.localeCompare(right.id);
}

export function sortSavedScripts(records: SavedScriptRecord[]) {
  return [...records].sort(compareSavedScripts);
}

export async function listWorkspaceScripts() {
  const response = await fetch(`/api/workspaces/${DEFAULT_WORKSPACE_ID}/scripts`);
  return parseApiJsonResponse<{ items: SavedScriptRecord[] }>(response)
    .then((payload) => sortSavedScripts(payload.items));
}

export async function readSavedScript(scriptId: string) {
  const response = await fetch(`/api/scripts/${scriptId}`);
  return parseApiJsonResponse<{ script: SavedScriptRecord }>(response).then((payload) => payload.script);
}

export async function createSavedScript(script: SavedScriptInput) {
  const response = await fetch(`/api/workspaces/${DEFAULT_WORKSPACE_ID}/scripts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ script }),
  });

  return parseApiJsonResponse<{ script: SavedScriptRecord }>(response).then((payload) => payload.script);
}

export async function updateSavedScript(scriptId: string, script: SavedScriptInput) {
  const response = await fetch(`/api/scripts/${scriptId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ script }),
  });

  return parseApiJsonResponse<{ script: SavedScriptRecord }>(response).then((payload) => payload.script);
}

export async function deleteSavedScript(scriptId: string) {
  const response = await fetch(`/api/scripts/${scriptId}`, {
    method: 'DELETE',
  });

  return parseApiJsonResponse<{ deletedScriptId: string }>(response).then((payload) => payload.deletedScriptId);
}

export async function listScriptTemplates() {
  const response = await fetch('/api/script-templates');
  return parseApiJsonResponse<{ items: ScriptTemplateRecord[] }>(response).then((payload) => payload.items);
}

export async function readScriptTemplate(templateId: string) {
  const response = await fetch(`/api/script-templates/${templateId}`);
  return parseApiJsonResponse<{ template: ScriptTemplateRecord }>(response).then((payload) => payload.template);
}
