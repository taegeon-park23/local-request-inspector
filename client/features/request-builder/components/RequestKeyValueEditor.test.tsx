import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RequestKeyValueEditor } from '@client/features/request-builder/components/RequestKeyValueEditor';
import { renderApp } from '@client/shared/test/render-app';

describe('RequestKeyValueEditor', () => {
  it('keeps standard text rows aligned around enabled, key, value, and remove actions', async () => {
    const user = userEvent.setup();
    const onUpdateRow = vi.fn();
    const onRemoveRow = vi.fn();

    renderApp(
      <RequestKeyValueEditor
        addButtonLabel="Add row"
        description="Edit request params."
        emptyCopy="No rows yet."
        rowLabel="Param"
        rows={[
          {
            id: 'row-text',
            enabled: true,
            key: 'page',
            value: '1',
          },
        ]}
        title="Params"
        onAddRow={vi.fn()}
        onRemoveRow={onRemoveRow}
        onUpdateRow={onUpdateRow}
      />,
    );

    expect(screen.getByLabelText('Param row 1 key')).toHaveValue('page');
    expect(screen.getByLabelText('Param row 1 value')).toHaveValue('1');
    expect(screen.queryByTestId('file-summary-row-text')).not.toBeInTheDocument();

    await user.click(screen.getByLabelText('Param row 1 enabled'));
    expect(onUpdateRow).toHaveBeenCalledWith('row-text', 'enabled', false);

    fireEvent.change(screen.getByLabelText('Param row 1 value'), { target: { value: '25' } });
    expect(onUpdateRow).toHaveBeenCalledWith('row-text', 'value', '25');

    await user.click(screen.getByRole('button', { name: 'Remove Param row 1' }));
    expect(onRemoveRow).toHaveBeenCalledWith('row-text');
  });

  it('renders multipart file support rows with summary, upload, and clear actions', async () => {
    const user = userEvent.setup();
    const onSelectFiles = vi.fn();
    const onClearFiles = vi.fn();
    const uploadFile = new File(['{}'], 'payload.json', { type: 'application/json' });

    renderApp(
      <RequestKeyValueEditor
        addButtonLabel="Add body row"
        description="Edit multipart body rows."
        emptyCopy="No body rows yet."
        rowLabel="Body"
        rows={[
          {
            id: 'row-file',
            enabled: true,
            key: 'attachment',
            value: '',
            valueType: 'file',
          },
        ]}
        title="Multipart"
        allowRowValueTypeSelection
        selectedFilesByRowId={{
          'row-file': [new File(['invoice'], 'invoice.pdf', { type: 'application/pdf' })],
        }}
        onAddRow={vi.fn()}
        onRemoveRow={vi.fn()}
        onUpdateRow={vi.fn()}
        onSelectFiles={onSelectFiles}
        onClearFiles={onClearFiles}
      />,
    );

    expect(screen.getByLabelText('Body row 1 field type')).toHaveValue('file');
    expect(screen.getByTestId('file-summary-row-file')).toHaveTextContent('1 file(s): invoice.pdf');

    await user.upload(screen.getByLabelText('Body row 1 files'), uploadFile);
    expect(onSelectFiles).toHaveBeenCalledTimes(1);
    expect(onSelectFiles.mock.calls[0]?.[0]).toBe('row-file');
    expect(onSelectFiles.mock.calls[0]?.[1]?.[0]?.name).toBe('payload.json');

    await user.click(screen.getByRole('button', { name: 'Clear files' }));
    expect(onClearFiles).toHaveBeenCalledWith('row-file');
  });
});
