import type { AiTask } from '../types';

interface ToolbarProps {
  onCommand: (command: string, value?: string) => void;
  onFormatBlock: (tag: string) => void;
  onInsert: (kind: 'checklist' | 'link' | 'image' | 'table' | 'page-break') => void;
  onAi: (task: AiTask, tone?: string) => void;
  aiOpen: boolean;
  onToggleAi: () => void;
  onCustomAi: () => void;
}

const iconButton = (icon: string, title: string, command: string, onCommand: ToolbarProps['onCommand']) => (
  <button className="tool-button" title={title} aria-label={title} onClick={() => onCommand(command)}>
    <i className={`fa-solid ${icon}`} />
  </button>
);

export default function Toolbar({
  onCommand,
  onFormatBlock,
  onInsert,
  onAi,
  aiOpen,
  onToggleAi,
  onCustomAi,
}: ToolbarProps) {
  return (
    <section className="ribbon no-print" aria-label="Formatting toolbar">
      <div className="toolbar-row">
        <select aria-label="Font family" onChange={(event) => onCommand('fontName', event.target.value)} defaultValue="Inter">
          <option value="Inter">Inter (Sans-Serif)</option><option value="Georgia">Georgia (Serif)</option>
          <option value="Arial">Arial</option><option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New (Mono)</option>
        </select>
        <select aria-label="Font size" onChange={(event) => onCommand('fontSize', event.target.value)} defaultValue="3">
          <option value="1">10 pt</option><option value="2">12 pt</option><option value="3">14 pt (Normal)</option>
          <option value="4">18 pt (Subheading)</option><option value="5">24 pt (Heading)</option><option value="6">32 pt (Title)</option>
        </select>
        <span className="tool-divider" />
        {iconButton('fa-bold', 'Bold (Ctrl+B)', 'bold', onCommand)}
        {iconButton('fa-italic', 'Italic (Ctrl+I)', 'italic', onCommand)}
        {iconButton('fa-underline', 'Underline (Ctrl+U)', 'underline', onCommand)}
        {iconButton('fa-strikethrough', 'Strikethrough', 'strikeThrough', onCommand)}
        <span className="tool-divider" />
        <label className="color-control" title="Text color"><i className="fa-solid fa-font" /><input type="color" defaultValue="#0f172a" onChange={(event) => onCommand('foreColor', event.target.value)} /></label>
        <label className="color-control" title="Highlight color"><i className="fa-solid fa-highlighter" /><input type="color" defaultValue="#fef08a" onChange={(event) => onCommand('hiliteColor', event.target.value)} /></label>
        <span className="tool-divider" />
        {iconButton('fa-superscript', 'Superscript', 'superscript', onCommand)}
        {iconButton('fa-subscript', 'Subscript', 'subscript', onCommand)}
        <button className="tool-button clear-format" title="Clear formatting" aria-label="Clear formatting" onClick={() => onCommand('removeFormat')}><i className="fa-solid fa-remove-format" /></button>
      </div>
      <div className="toolbar-row second-row">
        <select aria-label="Paragraph style" defaultValue="p" onChange={(event) => onFormatBlock(event.target.value)}>
          <option value="p">Paragraph</option><option value="h1">Heading 1</option><option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option><option value="blockquote">Quote Block</option>
        </select>
        <span className="tool-divider" />
        {iconButton('fa-align-left', 'Align left', 'justifyLeft', onCommand)}
        {iconButton('fa-align-center', 'Align center', 'justifyCenter', onCommand)}
        {iconButton('fa-align-right', 'Align right', 'justifyRight', onCommand)}
        {iconButton('fa-align-justify', 'Justify', 'justifyFull', onCommand)}
        <span className="tool-divider" />
        {iconButton('fa-list-ul', 'Bullet list', 'insertUnorderedList', onCommand)}
        {iconButton('fa-list-ol', 'Numbered list', 'insertOrderedList', onCommand)}
        <button className="tool-button" title="Checklist" onClick={() => onInsert('checklist')}><i className="fa-regular fa-square-check" /></button>
        {iconButton('fa-indent', 'Increase indent', 'indent', onCommand)}
        {iconButton('fa-outdent', 'Decrease indent', 'outdent', onCommand)}
        <span className="tool-divider" />
        <button className="tool-button" title="Insert link" onClick={() => onInsert('link')}><i className="fa-solid fa-link" /></button>
        <button className="tool-button" title="Insert image" onClick={() => onInsert('image')}><i className="fa-regular fa-image" /></button>
        <button className="tool-button" title="Insert table" onClick={() => onInsert('table')}><i className="fa-solid fa-table" /></button>
        {iconButton('fa-minus', 'Insert horizontal rule', 'insertHorizontalRule', onCommand)}
        <button className="tool-button" title="Insert page break" onClick={() => onInsert('page-break')}><i className="fa-regular fa-file" /></button>
        <span className="tool-divider" />
        <div className="ai-menu-wrap">
          <button className={`ai-button ${aiOpen ? 'active' : ''}`} onClick={onToggleAi}><i className="fa-solid fa-wand-magic-sparkles" /> AI Assistant <i className="fa-solid fa-chevron-down tiny-icon" /></button>
          {aiOpen && (
            <div className="ai-menu">
              <div className="menu-label">Writing assistance</div>
              <button onClick={() => onAi('rewrite')}><i className="fa-solid fa-pen-to-square" /> Rewrite selection</button>
              <button onClick={() => onAi('summarize')}><i className="fa-solid fa-compress" /> Summarize key points</button>
              <button onClick={() => onAi('grammar')}><i className="fa-solid fa-spell-check" /> Fix grammar & spelling</button>
              <div className="menu-label menu-label-bordered">Change tone</div>
              <button onClick={() => onAi('tone', 'formal')}><i className="fa-solid fa-user-tie" /> Formal professional</button>
              <button onClick={() => onAi('tone', 'casual')}><i className="fa-solid fa-comments" /> Casual friendly</button>
              <button onClick={() => onAi('tone', 'concise')}><i className="fa-solid fa-bolt" /> Direct & concise</button>
              <div className="menu-label menu-label-bordered"><button className="custom-ai-link" onClick={onCustomAi}><i className="fa-solid fa-comment-dots" /> Custom AI instruction...</button></div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
