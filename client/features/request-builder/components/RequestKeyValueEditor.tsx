import { memo, useCallback } from 'react';
import type { ChangeEvent } from 'react';
import { useI18n } from '@client/app/providers/useI18n';
import type { RequestKeyValueRow } from '@client/features/request-builder/request-draft.types';
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

interface RequestKeyValueEditorRowProps {
  row: RequestKeyValueRow;
  index: number;
  rowLabel: string;
  accessibleRowLabel: string;
  allowRowValueTypeSelection: boolean;
  selectedFiles: File[];
  fileSelectionEnabled: boolean;
  fileSelectionDisabledReason: string | null;
  onRemoveRow: (rowId: string) => void;
  onUpdateRow: (rowId: string, field: 'key' | 'value' | 'enabled' | 'valueType', value: string | boolean) => void;
  onSelectFiles: ((rowId: string, files: File[]) => void) | undefined;
  onClearFiles: ((rowId: string) => void) | undefined;
}

const EMPTY_SELECTED_FILES: File[] = [];

function normalizeRowValueType(row: RequestKeyValueRow) {
  return row.valueType === 'file' ? 'file' : 'text';
}

function summarizeSelectedFiles(selectedFiles: File[]) {
  return selectedFiles.map((file) => file.name).filter((name) => name.trim().length > 0).join(', ');
}

const RequestKeyValueEditorRow = memo(function RequestKeyValueEditorRow({
  row,
  index,
  rowLabel,
  accessibleRowLabel,
  allowRowValueTypeSelection,
  selectedFiles,
  fileSelectionEnabled,
  fileSelectionDisabledReason,
  onRemoveRow,
  onUpdateRow,
  onSelectFiles,
  onClearFiles,
}: RequestKeyValueEditorRowProps) {
  const { t } = useI18n();
  const rowValueType = normalizeRowValueType(row);
  const rowIndex = index + 1;
  const enabledLabel = t('workspaceRoute.keyValueEditor.labels.enabled', { rowLabel, index: rowIndex });
  const enabledAriaLabel = t('workspaceRoute.keyValueEditor.labels.enabled', { rowLabel: accessibleRowLabel, index: rowIndex });
  const keyLabel = t('workspaceRoute.keyValueEditor.labels.key', { rowLabel, index: rowIndex });
  const keyAriaLabel = t('workspaceRoute.keyValueEditor.labels.key', { rowLabel: accessibleRowLabel, index: rowIndex });
  const valueTypeLabel = t('workspaceRoute.keyValueEditor.labels.valueType', { rowLabel, index: rowIndex });
  const valueTypeAriaLabel = t('workspaceRoute.keyValueEditor.labels.valueType', { rowLabel: accessibleRowLabel, index: rowIndex });
  const filesLabel = t('workspaceRoute.keyValueEditor.labels.files', { rowLabel, index: rowIndex });
  const filesAriaLabel = t('workspaceRoute.keyValueEditor.labels.files', { rowLabel: accessibleRowLabel, index: rowIndex });
  const valueLabel = t('workspaceRoute.keyValueEditor.labels.value', { rowLabel, index: rowIndex });
  const valueAriaLabel = t('workspaceRoute.keyValueEditor.labels.value', { rowLabel: accessibleRowLabel, index: rowIndex });

  const handleEnabledChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    onUpdateRow(row.id, 'enabled', event.currentTarget.checked);
  }, [onUpdateRow, row.id]);
  const handleKeyChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    onUpdateRow(row.id, 'key', event.currentTarget.value);
  }, [onUpdateRow, row.id]);
  const handleValueTypeChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    onUpdateRow(row.id, 'valueType', event.currentTarget.value);
  }, [onUpdateRow, row.id]);
  const handleValueChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    onUpdateRow(row.id, 'value', event.currentTarget.value);
  }, [onUpdateRow, row.id]);
  const handleFileSelection = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const files = event.currentTarget.files ? Array.from(event.currentTarget.files) : [];
    onSelectFiles?.(row.id, files);
  }, [onSelectFiles, row.id]);
  const handleRemoveRow = useCallback(() => {
    onRemoveRow(row.id);
  }, [onRemoveRow, row.id]);
  const handleClearFiles = useCallback(() => {
    onClearFiles?.(row.id);
  }, [onClearFiles, row.id]);

  return (
    <div
      className={allowRowValueTypeSelection ? 'request-row-editor request-row-editor--multipart' : 'request-row-editor'}
    >
      <label className="request-field request-field--toggle">
        <span>{enabledLabel}</span>
        <input
          aria-label={enabledAriaLabel}
          checked={row.enabled}
          type="checkbox"
          onChange={handleEnabledChange}
        />
      </label>
      <label className="request-field">
        <span>{keyLabel}</span>
        <input
          aria-label={keyAriaLabel}
          type="text"
          value={row.key}
          onChange={handleKeyChange}
        />
      </label>

      {allowRowValueTypeSelection ? (
        <label className="request-field request-field--compact">
          <span>{valueTypeLabel}</span>
          <select
            aria-label={valueTypeAriaLabel}
            value={rowValueType}
            onChange={handleValueTypeChange}
          >
            <option value="text">{t('workspaceRoute.keyValueEditor.valueTypes.text')}</option>
            <option value="file">{t('workspaceRoute.keyValueEditor.valueTypes.file')}</option>
          </select>
        </label>
      ) : null}

      {rowValueType === 'file' && allowRowValueTypeSelection ? (
        <div className="request-field request-field--file-picker">
          <span>{filesLabel}</span>
          <input
            aria-label={filesAriaLabel}
            type="file"
            multiple
            disabled={!fileSelectionEnabled}
            onChange={handleFileSelection}
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
              onClick={handleClearFiles}
            >
              {t('workspaceRoute.keyValueEditor.file.clearAction')}
            </button>
          ) : null}
        </div>
      ) : (
        <label className="request-field">
          <span>{valueLabel}</span>
          <input
            aria-label={valueAriaLabel}
            type="text"
            value={row.value}
            onChange={handleValueChange}
          />
        </label>
      )}
      <button
        type="button"
        className="workspace-button workspace-button--ghost"
        aria-label={t('workspaceRoute.keyValueEditor.removeAriaLabel', { rowLabel: accessibleRowLabel, index: rowIndex })}
        onClick={handleRemoveRow}
      >
        <IconLabel icon="delete">{t('workspaceRoute.keyValueEditor.removeAction')}</IconLabel>
      </button>
    </div>
  );
});

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
          <RequestKeyValueEditorRow
            key={row.id}
            row={row}
            index={index}
            rowLabel={rowLabel}
            accessibleRowLabel={accessibleRowLabel}
            allowRowValueTypeSelection={allowRowValueTypeSelection}
            selectedFiles={selectedFilesByRowId?.[row.id] ?? EMPTY_SELECTED_FILES}
            fileSelectionEnabled={fileSelectionEnabled}
            fileSelectionDisabledReason={fileSelectionDisabledReason}
            onUpdateRow={onUpdateRow}
            onRemoveRow={onRemoveRow}
            onSelectFiles={onSelectFiles}
            onClearFiles={onClearFiles}
          />
        ))}
      </div>
    </section>
  );
}
