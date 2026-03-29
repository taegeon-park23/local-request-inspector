import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@client/app/providers/useI18n';
import { DialogFooter } from '@client/shared/ui/DialogFooter';
import type {
  WorkspaceCollectionNode,
  WorkspaceRequestGroupNode,
} from '@client/features/workspace/workspace-request-tree.api';

type CreateType = 'collection' | 'request-group' | 'request';

type CreateSheetTarget = WorkspaceCollectionNode | WorkspaceRequestGroupNode | null;

interface ParentOption {
  key: string;
  collectionId: string;
  collectionName: string;
  parentRequestGroupId: string | null;
  parentRequestGroupName: string | null;
  label: string;
}

interface WorkspaceCreateSheetProps {
  isOpen: boolean;
  tree: WorkspaceCollectionNode[];
  defaultType: CreateType;
  defaultTarget: CreateSheetTarget;
  onCancel: () => void;
  onCreateCollection: (name: string) => void | Promise<void>;
  onCreateRequestGroup: (input: {
    name: string;
    collectionId: string;
    parentRequestGroupId: string | null;
  }) => void | Promise<void>;
  onCreateRequest: (input: {
    name: string;
    collectionId?: string;
    collectionName?: string;
    requestGroupId?: string;
    requestGroupName?: string;
  }) => void | Promise<void>;
}

function createCollectionParentKey(collectionId: string) {
  return `collection:${collectionId}`;
}

function createRequestGroupParentKey(requestGroupId: string) {
  return `request-group:${requestGroupId}`;
}

function flattenRequestGroupParentOptions(
  requestGroups: WorkspaceRequestGroupNode[],
  collectionName: string,
  path: string[] = [],
): ParentOption[] {
  return requestGroups.flatMap((requestGroup) => {
    const nextPath = [...path, requestGroup.name];

    return [
      {
        key: createRequestGroupParentKey(requestGroup.requestGroupId),
        collectionId: requestGroup.collectionId,
        collectionName,
        parentRequestGroupId: requestGroup.requestGroupId,
        parentRequestGroupName: requestGroup.name,
        label: `${collectionName} / ${nextPath.join(' / ')}`,
      },
      ...flattenRequestGroupParentOptions(requestGroup.childGroups, collectionName, nextPath),
    ];
  });
}

function buildParentOptions(
  tree: WorkspaceCollectionNode[],
  collectionRootLabel: string,
): ParentOption[] {
  return tree.flatMap((collection) => {
    const collectionRoot = {
      key: createCollectionParentKey(collection.collectionId),
      collectionId: collection.collectionId,
      collectionName: collection.name,
      parentRequestGroupId: null,
      parentRequestGroupName: null,
      label: `${collection.name} / ${collectionRootLabel}`,
    };

    return [
      collectionRoot,
      ...flattenRequestGroupParentOptions(collection.childGroups, collection.name),
    ];
  });
}

function readDefaultParentKey(
  target: CreateSheetTarget,
  parentOptions: ParentOption[],
): string {
  if (target?.kind === 'request-group') {
    const parentKey = createRequestGroupParentKey(target.requestGroupId);

    if (parentOptions.some((option) => option.key === parentKey)) {
      return parentKey;
    }
  }

  if (target?.kind === 'collection') {
    const parentKey = createCollectionParentKey(target.collectionId);

    if (parentOptions.some((option) => option.key === parentKey)) {
      return parentKey;
    }
  }

  return parentOptions[0]?.key ?? '';
}

export function WorkspaceCreateSheet({
  isOpen,
  tree,
  defaultType,
  defaultTarget,
  onCancel,
  onCreateCollection,
  onCreateRequestGroup,
  onCreateRequest,
}: WorkspaceCreateSheetProps) {
  const { t } = useI18n();
  const [createType, setCreateType] = useState<CreateType>(defaultType);
  const [name, setName] = useState('');
  const [parentKey, setParentKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const parentOptions = useMemo(
    () => buildParentOptions(tree, t('workspaceRoute.explorer.createSheet.parentRootLabel')),
    [t, tree],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setCreateType(defaultType);
    setName('');
    setParentKey(readDefaultParentKey(defaultTarget, parentOptions));
    setValidationMessage(null);
    setIsSubmitting(false);
  }, [defaultTarget, defaultType, isOpen, parentOptions]);

  if (!isOpen) {
    return null;
  }

  const submitLabel = isSubmitting
    ? t('workspaceRoute.explorer.createSheet.actions.creating')
    : t('workspaceRoute.explorer.createSheet.actions.create');
  const collectionRootOptionLabel = t('workspaceRoute.explorer.createSheet.parentRootLabel');
  const collectionParentValue = parentOptions.length > 0 ? '__collection-root__' : '';

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    const nextName = name.trim();

    if (nextName.length === 0) {
      setValidationMessage(t('workspaceRoute.explorer.createSheet.validation.nameRequired'));
      return;
    }

    setValidationMessage(null);
    setIsSubmitting(true);
    let succeeded = false;

    try {
      if (createType === 'collection') {
        await onCreateCollection(nextName);
      } else {
        const selectedParent = parentOptions.find((option) => option.key === parentKey) ?? null;

        if (!selectedParent && createType === 'request-group') {
          setValidationMessage(t('workspaceRoute.explorer.createSheet.validation.parentRequired'));
          return;
        }

        if (createType === 'request-group') {
          await onCreateRequestGroup({
            name: nextName,
            collectionId: selectedParent?.collectionId ?? '',
            parentRequestGroupId: selectedParent?.parentRequestGroupId ?? null,
          });
        } else {
          const requestInput: {
            name: string;
            collectionId?: string;
            collectionName?: string;
            requestGroupId?: string;
            requestGroupName?: string;
          } = { name: nextName };

          if (selectedParent) {
            requestInput.collectionId = selectedParent.collectionId;
            requestInput.collectionName = selectedParent.collectionName;
            if (selectedParent.parentRequestGroupId) {
              requestInput.requestGroupId = selectedParent.parentRequestGroupId;
            }
            if (selectedParent.parentRequestGroupName) {
              requestInput.requestGroupName = selectedParent.parentRequestGroupName;
            }
          }

          await onCreateRequest(requestInput);
        }
      }

      succeeded = true;
    } finally {
      setIsSubmitting(false);
    }

    if (succeeded) {
      onCancel();
    }
  };

  return (
    <section className="workspace-surface-card workspace-create-sheet" aria-label={t('workspaceRoute.explorer.createSheet.ariaLabel')}>
      <header className="request-editor-card__header">
        <div>
          <h3>{t('workspaceRoute.explorer.createSheet.title')}</h3>
          <p>{t('workspaceRoute.explorer.createSheet.description')}</p>
        </div>
      </header>

      <div className="request-editor-card__row request-editor-card__row--compact-fluid">
        <label className="request-field request-field--compact">
          <span>{t('workspaceRoute.explorer.createSheet.fields.type')}</span>
          <select
            aria-label={t('workspaceRoute.explorer.createSheet.fields.type')}
            value={createType}
            onChange={(event) => setCreateType(event.currentTarget.value as CreateType)}
            disabled={isSubmitting}
          >
            <option value="collection">{t('workspaceRoute.explorer.createSheet.types.collection')}</option>
            <option value="request-group">{t('workspaceRoute.explorer.createSheet.types.requestGroup')}</option>
            <option value="request">{t('workspaceRoute.explorer.createSheet.types.request')}</option>
          </select>
        </label>

        <label className="request-field request-field--wide">
          <span>{t('workspaceRoute.explorer.createSheet.fields.parent')}</span>
          <select
            aria-label={t('workspaceRoute.explorer.createSheet.fields.parent')}
            value={createType === 'collection' ? collectionParentValue : parentKey}
            onChange={(event) => setParentKey(event.currentTarget.value)}
            disabled={isSubmitting || createType === 'collection' || parentOptions.length === 0}
          >
            {createType === 'collection' ? (
              <option value={collectionParentValue}>{collectionRootOptionLabel}</option>
            ) : parentOptions.map((option) => (
              <option key={option.key} value={option.key}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="request-editor-card__row request-editor-card__row--single">
        <label className="request-field request-field--wide">
          <span>{t('workspaceRoute.explorer.createSheet.fields.name')}</span>
          <input
            aria-label={t('workspaceRoute.explorer.createSheet.fields.name')}
            type="text"
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
            disabled={isSubmitting}
          />
        </label>
      </div>

      {validationMessage ? <p className="workspace-explorer__status workspace-explorer__status--error">{validationMessage}</p> : null}

      <DialogFooter>
        <button type="button" className="workspace-button" onClick={() => { void handleSubmit(); }} disabled={isSubmitting}>
          {submitLabel}
        </button>
        <button type="button" className="workspace-button workspace-button--secondary" onClick={onCancel} disabled={isSubmitting}>
          {t('workspaceRoute.explorer.createSheet.actions.cancel')}
        </button>
      </DialogFooter>
    </section>
  );
}

export type { CreateSheetTarget, CreateType };
