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
  allowRowValueTypeSelection?: boolean;
  selectedFilesByRowId?: Record<string, File[]>;
  fileSelectionEnabled?: boolean;
  fileSelectionDisabledReason?: string | null;
  onAddRow: () => void;
  onRemoveRow: (rowId: string) => void;
  onUpdateRow: (rowId: string, field: 'key' | 'value' | 'enabled' | 'valueType', value: string | boolean) => void;
  onSelectFiles?: (rowId: string, files: File[]) => void;
  onClearFiles?: (rowId: string) => void;
}

function normalizeRowValueType(row: RequestKeyValueRow) {
  return row.valueType === 'file' ? 'file' : 'text';
}

function summarizeSelectedFiles(selectedFiles: File[]) {
  return selectedFiles.map((file) => file.name).filter((name) => name.trim().length > 0).join(', ');
}

export function RequestKeyValueEditor({
  addButtonLabel,
  description,
  emptyCopy,
  rows,
  rowLabel,
  title,
  ariaRowLabel,
  allowRowValueTypeSelection = false,
  selectedFilesByRowId,
  fileSelectionEnabled = true,
  fileSelectionDisabledReason = null,
  onAddRow,
  onRemoveRow,
  onUpdateRow,
  onSelectFiles,
  onClearFiles,
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
        {rows.map((row, index) => {
          const rowValueType = normalizeRowValueType(row);
          const selectedFiles = selectedFilesByRowId?.[row.id] ?? [];

          return (
            <div
              key={row.id}
              className={allowRowValueTypeSelection ? 'request-row-editor request-row-editor--multipart' : 'request-row-editor'}
            >
              <label className="request-field request-field--toggle">
                <span>{t('workspaceRoute.keyValueEditor.labels.enabled', { rowLabel, index: index + 1 })}</span>
                <input
                  aria-label={t('workspaceRoute.keyValueEditor.labels.enabled', { rowLabel: accessibleRowLabel, index: index + 1 })}
                  checked={row.enabled}
                  type="checkbox"
                  onChange={(event) => onUpdateRow(row.id, 'enabled', event.currentTarget.checked)}
                />
              </label>
              <label className="request-field">
                <span>{t('workspaceRoute.keyValueEditor.labels.key', { rowLabel, index: index + 1 })}</span>
                <input
                  aria-label={t('workspaceRoute.keyValueEditor.labels.key', { rowLabel: accessibleRowLabel, index: index + 1 })}
                  type="text"
                  value={row.key}
                  onChange={(event) => onUpdateRow(row.id, 'key', event.currentTarget.value)}
                />
              </label>

              {allowRowValueTypeSelection ? (
                <label className="request-field request-field--compact">
                  <span>{t('workspaceRoute.keyValueEditor.labels.valueType', { rowLabel, index: index + 1 })}</span>
                  <select
                    aria-label={t('workspaceRoute.keyValueEditor.labels.valueType', { rowLabel: accessibleRowLabel, index: index + 1 })}
                    value={rowValueType}
                    onChange={(event) => onUpdateRow(row.id, 'valueType', event.currentTarget.value)}
                  >
                    <option value="text">{t('workspaceRoute.keyValueEditor.valueTypes.text')}</option>
                    <option value="file">{t('workspaceRoute.keyValueEditor.valueTypes.file')}</option>
                  </select>
                </label>
              ) : null}

              {rowValueType === 'file' && allowRowValueTypeSelection ? (
                <div className="request-field request-field--file-picker">
                  <span>{t('workspaceRoute.keyValueEditor.labels.files', { rowLabel, index: index + 1 })}</span>
                  <input
                    aria-label={t('workspaceRoute.keyValueEditor.labels.files', { rowLabel: accessibleRowLabel, index: index + 1 })}
                    type="file"
                    multiple
                    disabled={!fileSelectionEnabled}
                    onChange={(event) => {
                      const files = event.currentTarget.files ? Array.from(event.currentTarget.files) : [];
                      onSelectFiles?.(row.id, files);
                    }}
                  />
                  <p className="request-row-editor__file-summary">
                    {selectedFiles.length === 0
                      ? t('workspaceRoute.keyValueEditor.file.noneSelected')
                      : t('workspaceRoute.keyValueEditor.file.selected', {
                        count: selectedFiles.length,
                        names: summarizeSelectedFiles(selectedFiles),
                      })}
                  </p>
                  {fileSelectionDisabledReason ? (
                    <p className="request-row-editor__file-summary">{fileSelectionDisabledReason}</p>
                  ) : null}
                  {selectedFiles.length > 0 ? (
                    <button
                      type="button"
                      className="workspace-button workspace-button--ghost"
                      onClick={() => onClearFiles?.(row.id)}
                    >
                      {t('workspaceRoute.keyValueEditor.file.clearAction')}
                    </button>
                  ) : null}
                </div>
              ) : (
                <label className="request-field">
                  <span>{t('workspaceRoute.keyValueEditor.labels.value', { rowLabel, index: index + 1 })}</span>
                  <input
                    aria-label={t('workspaceRoute.keyValueEditor.labels.value', { rowLabel: accessibleRowLabel, index: index + 1 })}
                    type="text"
                    value={row.value}
                    onChange={(event) => onUpdateRow(row.id, 'value', event.currentTarget.value)}
                  />
                </label>
              )}
              <button
                type="button"
                className="workspace-button workspace-button--ghost"
                aria-label={t('workspaceRoute.keyValueEditor.removeAriaLabel', { rowLabel: accessibleRowLabel, index: index + 1 })}
                onClick={() => onRemoveRow(row.id)}
              >
                <IconLabel icon="delete">{t('workspaceRoute.keyValueEditor.removeAction')}</IconLabel>
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
