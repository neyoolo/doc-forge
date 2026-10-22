interface AppHeaderProps {
  title: string;
  onTitleChange: (title: string) => void;
  exportOpen: boolean;
  onToggleExport: () => void;
  onOpenImport: () => void;
  onOpenFind: () => void;
  onOpenSettings: () => void;
  onExport: (format: 'docx' | 'pdf' | 'html' | 'markdown') => void;
}

export default function AppHeader({
  title,
  onTitleChange,
  exportOpen,
  onToggleExport,
  onOpenImport,
  onOpenFind,
  onOpenSettings,
  onExport,
}: AppHeaderProps) {
  const exports = [
    ['docx', 'Word Document (.docx)', 'fa-file-word'],
    ['pdf', 'PDF Document (.pdf)', 'fa-file-pdf'],
    ['html', 'Web Page (.html)', 'fa-code'],
    ['markdown', 'Markdown (.md)', 'fa-file-lines'],
  ] as const;

  return (
    <header className="app-header no-print">
      <div className="brand-area">
        <div className="brand-mark"><i className="fa-solid fa-file-word" /></div>
        <div className="brand-name">Ayoola <span>Doc Forge</span></div>
        <span className="edition-badge">PRO EDITION</span>
        <span className="header-divider" />
        <input
          className="document-title"
          aria-label="Document title"
          title="Click to rename document"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
        />
      </div>
      <nav className="header-actions" aria-label="Document actions">
        <button className="header-button" onClick={onOpenImport}><i className="fa-solid fa-folder-open" /> Open / Import</button>
        <button className="header-button" onClick={onOpenFind}><i className="fa-solid fa-magnifying-glass" /> Find & Replace <span className="shortcut-hint">Ctrl+F</span></button>
        <button className="header-icon-button" onClick={onOpenSettings} title="AI Settings" aria-label="AI Settings"><i className="fa-solid fa-gear" /></button>
        <span className="header-divider" />
        <div className="export-wrap">
          <button className="export-button" onClick={onToggleExport}><i className="fa-solid fa-file-export" /> Export <i className="fa-solid fa-chevron-down tiny-icon" /></button>
          {exportOpen && (
            <div className="export-menu">
              {exports.map(([format, label, icon]) => (
                <button key={format} onClick={() => onExport(format)}>
                  <i className={`fa-solid ${icon}`} />{label}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
