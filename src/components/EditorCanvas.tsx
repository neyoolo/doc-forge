import { forwardRef, type ForwardedRef } from 'react';

interface EditorCanvasProps {
  zoom: number;
  onInput: () => void;
  onImageSelect: (file: File) => void;
}

const initialDocument = `<h1>Welcome to Ayoola Doc Forge</h1>
<p>Select any text above and click <strong>AI Assistant</strong> in the toolbar to see instant inline smart suggestions!</p>`;

function EditorCanvas({ zoom, onInput, onImageSelect }: EditorCanvasProps, ref: ForwardedRef<HTMLDivElement>) {
  return (
    <main className="editor-viewport" id="main-viewport">
      <div className="paper-scale" style={{ transform: `scale(${zoom / 100})` }}>
        <div className="paper" id="editor-wrapper">
          <div
            ref={ref}
            id="editor-content"
            className="editor-content"
            contentEditable
            suppressContentEditableWarning
            spellCheck
            role="textbox"
            aria-label="Document content"
            aria-multiline="true"
            onInput={onInput}
            dangerouslySetInnerHTML={{ __html: initialDocument }}
          />
        </div>
      </div>
      <input className="visually-hidden" type="file" accept="image/*" id="image-upload-input" onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) onImageSelect(file);
        event.currentTarget.value = '';
      }} />
    </main>
  );
}

export default forwardRef<HTMLDivElement, EditorCanvasProps>(EditorCanvas);
