import { forwardRef, type ForwardedRef } from 'react';

interface EditorCanvasProps {
  zoom: number;
  onInput: () => void;
  onImageSelect: (file: File) => void;
}

const initialDocument = `<h1>Project Proposal: AI-Powered Document Workflow</h1>
<p>Welcome to <strong>Ayoola Doc Forge</strong>, a next-generation browser document editor designed for maximum speed, security, and smart writing assistance. Unlike traditional desktop word processors, Ayoola Doc Forge runs entirely in your browser with real-time AI capabilities, offline support, and clean document conversion.</p>
<h2>1. Executive Summary</h2>
<p>Modern teams require lightweight tools that bridge the gap between rich formatting and automated intelligent editing. Ayoola Doc Forge offers seamless DOCX and PDF import/export, fine-grained formatting controls, and a non-destructive AI editing framework.</p>
<blockquote>"Simplicity is about subtracting the obvious and adding the meaningful." — John Maeda</blockquote>
<h2>2. Key Features</h2>
<ul><li><strong>Zero Paywall:</strong> 100% free with fair-use daily AI actions and conversions.</li><li><strong>Word Compatibility:</strong> Full formatting preservation for tables, headings, and images.</li><li><strong>Non-Destructive AI:</strong> Accept or reject suggestions without losing your original phrasing.</li></ul>
<h2>3. Milestone Schedule</h2>
<table><thead><tr><th>Phase</th><th>Deliverable</th><th>Status</th></tr></thead><tbody><tr><td>Phase 1</td><td>Core Canvas & Ribbon Toolbar</td><td><strong>Completed</strong></td></tr><tr><td>Phase 2</td><td>AI Suggestion Engine</td><td><strong>In Progress</strong></td></tr><tr><td>Phase 3</td><td>Cloudflare R2 File Persistence</td><td>Scheduled</td></tr></tbody></table>
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
