import type { RequestKeyValueRow } from '@client/features/request-builder/request-draft.types';
import { useI18n } from '@client/app/providers/useI18n';
import { IconLabel } from '@client/shared/ui/IconLabel';

interface RequestKeyValueEditorProps {
  addButtonLabel: string;
  description: string;
  emptyCopy: string;
  rows: RequestKeyValueRow[];
  rowLabel: string;
  title: string;
  ariaRowLabel?: string;
  onAddRow: () => void;
  onRemoveRow: (rowId: string) => void;
  onUpdateRow: (rowId: string, field: 'key' | 'value' | 'enabled', value: string | boolean) => void;
}

export function RequestKeyValueEditor({
  addButtonLabel,
  description,
  emptyCopy,
  rows,
  rowLabel,
  title,
  ariaRowLabel,
  onAddRow,
  onRemoveRow,
  onUpdateRow,
}: RequestKeyValueEditorProps) {
  const { t } = useI18n();
  const accessibleRowLabel = ariaRowLabel ?? rowLabel;

  return (
    <section className="workspace-surface-card request-editor-card">
      <header className="request-editor-card__header">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <button type="button" className="workspace-button workspace-button--secondary" onClick={onAddRow}>
          <IconLabel icon="add">{addButtonLabel}</IconLabel>
        </button>
      </header>

      {rows.length === 0 ? <p className="request-editor-card__empty">{emptyCopy}</p> : null}

      <div className="request-row-editor-list">
        {rows.map((row, index) => (
          <div key={row.id} className="request-row-editor">
            <label className="request-field request-field--toggle">
              <span>{t('workspaceRoute.keyValueEditor.labels.enabled', { rowLabel, index: index + 1 })}</span>
              <input
                aria-label={`${accessibleRowLabel} row ${index + 1} enabled`}
                checked={row.enabled}
                type="checkbox"
                onChange={(event) => onUpdateRow(row.id, 'enabled', event.currentTarget.checked)}
              />
            </label>
            <label className="request-field">
              <span>{t('workspaceRoute.keyValueEditor.labels.key', { rowLabel, index: index + 1 })}</span>
              <input
                aria-label={`${accessibleRowLabel} row ${index + 1} key`}
                type="text"
                value={row.key}
                onChange={(event) => onUpdateRow(row.id, 'key', event.currentTarget.value)}
              />
            </label>
            <label className="request-field">
              <span>{t('workspaceRoute.keyValueEditor.labels.value', { rowLabel, index: index + 1 })}</span>
              <input
                aria-label={`${accessibleRowLabel} row ${index + 1} value`}
                type="text"
                value={row.value}
                onChange={(event) => onUpdateRow(row.id, 'value', event.currentTarget.value)}
              />
            </label>
            <button
              type="button"
              className="workspace-button workspace-button--ghost"
              aria-label={`Remove ${accessibleRowLabel.toLowerCase()} row ${index + 1}`}
              onClick={() => onRemoveRow(row.id)}
            >
              <IconLabel icon="delete">{t('workspaceRoute.keyValueEditor.removeAction')}</IconLabel>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
