import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScriptCodeEditor } from '@client/shared/code-editor/ScriptCodeEditor';

function ControlledHarness() {
  const [value, setValue] = useState('');

  return (
    <ScriptCodeEditor
      value={value}
      onChange={setValue}
      ariaLabel="Editable script"
      stageId="pre-request"
    />
  );
}

describe('ScriptCodeEditor', () => {
  it('passes fixed height for editable mode', () => {
    render(
      <ScriptCodeEditor
        value=""
        onChange={() => undefined}
        ariaLabel="Editable script"
        stageId="pre-request"
      />,
    );

    expect(screen.getByLabelText('Editable script')).toHaveAttribute('data-editor-height', '19rem');
  });

  it('passes fixed height for readonly mode', () => {
    render(
      <ScriptCodeEditor
        value=""
        onChange={() => undefined}
        readOnly
        ariaLabel="Readonly script"
        stageId="post-response"
      />,
    );

    expect(screen.getByLabelText('Readonly script')).toHaveAttribute('data-editor-height', '11rem');
  });

  it('preserves focus and editor identity across controlled value updates', async () => {
    const user = userEvent.setup();

    render(<ControlledHarness />);

    const editor = screen.getByLabelText('Editable script');
    await user.click(editor);
    await user.type(editor, 'const ready = true;');

    const updatedEditor = screen.getByLabelText('Editable script');
    expect(updatedEditor).toBe(editor);
    expect(updatedEditor).toHaveFocus();
    expect(updatedEditor).toHaveAttribute('data-editor-path', expect.stringContaining('/pre-request.js'));
  });
});

