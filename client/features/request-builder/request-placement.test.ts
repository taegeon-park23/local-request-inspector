import { describe, expect, it } from 'vitest';
import { resolveRequestPlacement } from '@client/features/request-builder/request-placement';

describe('resolveRequestPlacement', () => {
  it('inherits fallback request group when collection context matches', () => {
    const placement = resolveRequestPlacement(
      {
        collectionId: 'collection-saved-requests',
        collectionName: 'Saved Requests',
      },
      {
        collectionId: 'collection-saved-requests',
        collectionName: 'Saved Requests',
        requestGroupId: 'request-group-general',
        requestGroupName: 'General',
      },
    );

    expect(placement).toMatchObject({
      collectionId: 'collection-saved-requests',
      requestGroupId: 'request-group-general',
      requestGroupName: 'General',
    });
  });

  it('does not inherit fallback requestGroupId when primary collection differs', () => {
    const placement = resolveRequestPlacement(
      {
        collectionId: 'collection-temp',
        collectionName: 'Temp Collection',
      },
      {
        collectionId: 'collection-saved-requests',
        collectionName: 'Saved Requests',
        requestGroupId: 'request-group-general',
        requestGroupName: 'General',
      },
    );

    expect(placement).toMatchObject({
      collectionId: 'collection-temp',
      collectionName: 'Temp Collection',
      requestGroupName: 'General',
    });
    expect(placement).not.toHaveProperty('requestGroupId');
  });

  it('keeps explicit primary requestGroupId even when fallback collection differs', () => {
    const placement = resolveRequestPlacement(
      {
        collectionId: 'collection-temp',
        collectionName: 'Temp Collection',
        requestGroupId: 'request-group-temp',
        requestGroupName: 'General',
      },
      {
        collectionId: 'collection-saved-requests',
        collectionName: 'Saved Requests',
        requestGroupId: 'request-group-general',
        requestGroupName: 'General',
      },
    );

    expect(placement).toMatchObject({
      collectionId: 'collection-temp',
      requestGroupId: 'request-group-temp',
      requestGroupName: 'General',
    });
  });
});
