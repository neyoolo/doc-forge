import { forwardRef, type ForwardedRef, type RefObject } from 'react';

interface EditorCanvasProps {
  zoom: number;
  onInput: () => void;
  onImageSelect: (file: File) => void;
  docxStylesRef: RefObject<HTMLDivElement>;
  isDocx: boolean;
  isReady: boolean;
}

const initialDocument = '<p><br></p>';

function EditorCanvas({ zoom, onInput, onImageSelect, docxStylesRef, isDocx, isReady }: EditorCanvasProps, ref: ForwardedRef<HTMLDivElement>) {
  return (
    <main className="editor-viewport" id="main-viewport">
      <div className="paper-scale" style={{ transform: `scale(${zoom / 100})` }}>
        <div className={`paper ${isDocx ? 'docx-paper' : ''}`} id="editor-wrapper">
          <div className="docx-style-host" ref={docxStylesRef} aria-hidden="true" />
          <div
            ref={ref}
            id="editor-content"
            className={`editor-content ${isDocx ? 'docx-content' : ''}`}
            contentEditable={isReady}
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
