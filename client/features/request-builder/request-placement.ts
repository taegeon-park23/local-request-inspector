export interface RequestPlacementValue {
  collectionId?: string;
  collectionName?: string;
  requestGroupId?: string;
  requestGroupName?: string;
  folderName?: string;
}

export interface RequestPlacementGroupOption {
  requestGroupId?: string;
  requestGroupName: string;
}

export interface RequestPlacementCollectionOption {
  collectionId?: string;
  collectionName: string;
  requestGroups: RequestPlacementGroupOption[];
}

export const DEFAULT_REQUEST_GROUP_NAME = 'General';

export function readRequestGroupName(
  placement: Pick<RequestPlacementValue, 'requestGroupName' | 'folderName'> | null | undefined,
) {
  return placement?.requestGroupName ?? placement?.folderName;
}

export function createRequestPlacementFields(placement: RequestPlacementValue): RequestPlacementValue {
  const nextPlacement: RequestPlacementValue = {};
  const requestGroupName = readRequestGroupName(placement);

  if (placement.collectionId) {
    nextPlacement.collectionId = placement.collectionId;
  }

  if (placement.collectionName) {
    nextPlacement.collectionName = placement.collectionName;
  }

  if (placement.requestGroupId) {
    nextPlacement.requestGroupId = placement.requestGroupId;
  }

  if (requestGroupName) {
    nextPlacement.requestGroupName = requestGroupName;
    nextPlacement.folderName = requestGroupName;
  }

  return nextPlacement;
}

export function resolveRequestPlacement(
  primary: RequestPlacementValue | null | undefined,
  fallback: RequestPlacementValue | null | undefined,
): RequestPlacementValue {
  const nextPlacement: RequestPlacementValue = {};
  const collectionId = primary?.collectionId ?? fallback?.collectionId;
  const collectionName = primary?.collectionName ?? fallback?.collectionName;
  const requestGroupId = primary?.requestGroupId ?? fallback?.requestGroupId;
  const requestGroupName = readRequestGroupName(primary) ?? readRequestGroupName(fallback);

  if (collectionId) {
    nextPlacement.collectionId = collectionId;
  }

  if (collectionName) {
    nextPlacement.collectionName = collectionName;
  }

  if (requestGroupId) {
    nextPlacement.requestGroupId = requestGroupId;
  }

  if (requestGroupName) {
    nextPlacement.requestGroupName = requestGroupName;
  }

  return createRequestPlacementFields(nextPlacement);
}

export function replaceRequestPlacement<T extends RequestPlacementValue>(
  target: T,
  placement: RequestPlacementValue,
) {
  const nextTarget = { ...target } as T & RequestPlacementValue;

  delete nextTarget.collectionId;
  delete nextTarget.collectionName;
  delete nextTarget.requestGroupId;
  delete nextTarget.requestGroupName;
  delete nextTarget.folderName;

  return Object.assign(nextTarget, createRequestPlacementFields(placement));
}

export function formatRequestPlacementPath(
  placement: Pick<RequestPlacementValue, 'collectionName' | 'requestGroupName' | 'folderName'> | null | undefined,
) {
  if (!placement?.collectionName) {
    return null;
  }

  const requestGroupName = readRequestGroupName(placement);
  return requestGroupName ? `${placement.collectionName} / ${requestGroupName}` : placement.collectionName;
}

export function findSelectedPlacementCollection(
  placementOptions: RequestPlacementCollectionOption[],
  placement: RequestPlacementValue,
) {
  return placementOptions.find((collection) => (
    (placement.collectionId && collection.collectionId === placement.collectionId)
    || (!placement.collectionId && collection.collectionName === placement.collectionName)
  )) ?? placementOptions[0] ?? null;
}

export function findSelectedPlacementGroup(
  collection: RequestPlacementCollectionOption | null,
  placement: RequestPlacementValue,
) {
  if (!collection) {
    return null;
  }

  const requestGroupName = readRequestGroupName(placement);

  return collection.requestGroups.find((requestGroup) => (
    (placement.requestGroupId && requestGroup.requestGroupId === placement.requestGroupId)
    || requestGroup.requestGroupName === requestGroupName
  )) ?? collection.requestGroups[0] ?? null;
}

export function getCollectionPlacementValue(collection: RequestPlacementCollectionOption) {
  return collection.collectionId ?? collection.collectionName;
}

export function getRequestGroupPlacementValue(requestGroup: RequestPlacementGroupOption) {
  return requestGroup.requestGroupId ?? requestGroup.requestGroupName;
}

export function createRequestPlacementFromSelection(
  collection: Pick<RequestPlacementCollectionOption, 'collectionId' | 'collectionName'>,
  requestGroup: Pick<RequestPlacementGroupOption, 'requestGroupId' | 'requestGroupName'> | null | undefined,
): RequestPlacementValue {
  const nextPlacement: RequestPlacementValue = {
    collectionName: collection.collectionName,
    requestGroupName: requestGroup?.requestGroupName ?? DEFAULT_REQUEST_GROUP_NAME,
  };

  if (collection.collectionId) {
    nextPlacement.collectionId = collection.collectionId;
  }

  if (requestGroup?.requestGroupId) {
    nextPlacement.requestGroupId = requestGroup.requestGroupId;
  }

  return createRequestPlacementFields(nextPlacement);
}
