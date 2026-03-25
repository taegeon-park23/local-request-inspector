import type { RequestTabRecord } from '@client/features/request-builder/request-tab.types';

export function isDetachedRequestTab(
  tab: Pick<RequestTabRecord, 'source' | 'sourceKey'> | null | undefined,
) {
  return Boolean(tab && (tab.source === 'detached' || tab.sourceKey.startsWith('detached-')));
}

export function isPreviewRequestTab(
  tab: Pick<RequestTabRecord, 'tabMode'> | null | undefined,
) {
  return Boolean(tab && tab.tabMode === 'preview');
}
