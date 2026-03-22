import type { RequestKeyValueRow } from '@client/features/request-builder/request-draft.types';
import { IconLabel } from '@client/shared/ui/IconLabel';

interface RequestKeyValueEditorProps {
  addButtonLabel: string;
  description: string;
  emptyCopy: string;
  rows: RequestKeyValueRow[];
  rowLabel: string;
  title: string;
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
  onAddRow,
  onRemoveRow,
  onUpdateRow,
}: RequestKeyValueEditorProps) {
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
              <span>{rowLabel} row {index + 1} enabled</span>
              <input
                checked={row.enabled}
                type="checkbox"
                onChange={(event) => onUpdateRow(row.id, 'enabled', event.currentTarget.checked)}
              />
            </label>
            <label className="request-field">
              <span>{rowLabel} row {index + 1} key</span>
              <input
                type="text"
                value={row.key}
                onChange={(event) => onUpdateRow(row.id, 'key', event.currentTarget.value)}
              />
            </label>
            <label className="request-field">
              <span>{rowLabel} row {index + 1} value</span>
              <input
                type="text"
                value={row.value}
                onChange={(event) => onUpdateRow(row.id, 'value', event.currentTarget.value)}
              />
            </label>
            <button
              type="button"
              className="workspace-button workspace-button--ghost"
              aria-label={`Remove ${rowLabel.toLowerCase()} row ${index + 1}`}
              onClick={() => onRemoveRow(row.id)}
            >
              <IconLabel icon="delete">Remove</IconLabel>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
