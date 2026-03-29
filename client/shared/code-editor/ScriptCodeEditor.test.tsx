import { render, screen } from '@testing-library/react';
import { ScriptCodeEditor } from '@client/shared/code-editor/ScriptCodeEditor';

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
});
