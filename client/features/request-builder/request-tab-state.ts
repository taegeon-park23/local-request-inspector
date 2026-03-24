import type { RequestTabRecord } from '@client/features/request-builder/request-tab.types';

export function isDetachedRequestTab(
  tab: Pick<RequestTabRecord, 'source' | 'sourceKey'> | null | undefined,
) {
  return Boolean(tab && tab.source === 'draft' && tab.sourceKey.startsWith('detached-'));
}
