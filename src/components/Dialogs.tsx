import { useState, type ChangeEvent } from 'react';
import type { ImportTab } from '../types';

interface DialogsProps {
  openImport: boolean;
  onCloseImport: () => void;
  onImportText: (text: string, name: string) => void;
  onImportError: (message: string) => void;
  onLoadTemplate: (template: 'resume' | 'meeting' | 'blank') => void;
  openFind: boolean;
  onCloseFind: () => void;
  find: string;
  replace: string;
  onFindChange: (value: string) => void;
  onReplaceChange: (value: string) => void;
  findCount: number;
  onReplaceCurrent: () => void;
  onReplaceAll: () => void;
  onNavigateFind: (direction: number) => void;
  openSettings: boolean;
  onCloseSettings: () => void;
  onSaveSettings: () => void;
  customPromptOpen: boolean;
  onCloseCustomPrompt: () => void;
  onSubmitCustomPrompt: (prompt: string) => void;
  aiSuggestion: string;
  aiLoading: boolean;
  onAcceptAi: () => void;
  onRejectAi: () => void;
  onRegenerateAi: () => void;
  aiDrawerOpen: boolean;
  onCloseAiDrawer: () => void;
  onAcceptAllAi: () => void;
  onRejectAllAi: () => void;
}

export default function Dialogs(props: DialogsProps) {
  const [tab, setTab] = useState<ImportTab>('upload');
  const [url, setUrl] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [importing, setImporting] = useState(false);
  const handleImport = async (file?: File) => {
    if (!file) return;
    setImporting(true);
    try {
      const { importDocumentFile } = await import('../utils/importDocument');
      const html = await importDocumentFile(file);
      props.onImportText(html, file.name);
    } catch (error) {
      props.onImportError(error instanceof Error ? error.message : 'The selected file could not be imported.');
    } finally {
      setImporting(false);
    }
  };
  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.currentTarget.value = '';
    void handleImport(file);
  };

  return (
    <>
      {props.openFind && <div className="find-panel no-print">
        <div className="dialog-title"><strong><i className="fa-solid fa-magnifying-glass" /> Find and Replace</strong><button className="icon-button" onClick={props.onCloseFind} aria-label="Close find and replace"><i className="fa-solid fa-xmark" /></button></div>
        <label className="field-label">Find<input autoFocus value={props.find} onChange={(event) => props.onFindChange(event.target.value)} placeholder="Search text..." /></label>
        <label className="field-label">Replace with<input value={props.replace} onChange={(event) => props.onReplaceChange(event.target.value)} placeholder="Replacement text..." /></label>
        <div className="find-actions"><div><button className="subtle-button" onClick={() => props.onNavigateFind(-1)} title="Previous match"><i className="fa-solid fa-chevron-up" /></button><button className="subtle-button" onClick={() => props.onNavigateFind(1)} title="Next match"><i className="fa-solid fa-chevron-down" /></button><span className="match-count">{props.find ? `${props.findCount} match${props.findCount === 1 ? '' : 'es'}` : '0 matches'}</span></div><div><button className="subtle-button" onClick={props.onReplaceCurrent}>Replace</button><button className="primary-small" onClick={props.onReplaceAll}>Replace all</button></div></div>
      </div>}

      {props.openImport && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) props.onCloseImport(); }}>
        <section className="modal-card">
          <div className="modal-header"><h2><i className="fa-solid fa-folder-open" /> Open document / Import</h2><button className="icon-button light" onClick={props.onCloseImport} aria-label="Close import"><i className="fa-solid fa-xmark" /></button></div>
          <div className="tab-strip">{(['upload', 'url', 'templates'] as const).map((item) => <button className={tab === item ? 'selected' : ''} key={item} onClick={() => setTab(item)}>{item === 'upload' ? 'Upload file' : item === 'url' ? 'Google Doc / Web' : 'Templates'}</button>)}</div>
          <div className="modal-body">
            {tab === 'upload' && <label
              className={`upload-drop ${importing ? 'is-importing' : ''}`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                void handleImport(event.dataTransfer.files[0]);
              }}
            >
              <i className={`fa-solid ${importing ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-up'}`} />
              <strong>{importing ? 'Importing document...' : 'Choose a document or drag it here'}</strong>
              <span>PDF, DOCX, TXT, Markdown, HTML, RTF, CSV, JSON, XML, and LOG</span>
              <input type="file" accept=".pdf,.docx,.txt,.md,.markdown,.html,.htm,.rtf,.csv,.json,.xml,.log" disabled={importing} onChange={handleFileSelect} />
            </label>}
            {tab === 'url' && <div className="url-import"><p>Paste a public webpage or Google Docs URL.</p><input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://" /><button className="primary-small" onClick={() => { if (url.trim()) { window.alert('URL import is not connected yet.'); } }}>Import URL</button><small>External URL importing requires a connected service.</small></div>}
            {tab === 'templates' && <div className="template-grid"><button onClick={() => props.onLoadTemplate('resume')}><i className="fa-regular fa-file-lines" /><strong>Resume</strong><span>Professional experience layout</span></button><button onClick={() => props.onLoadTemplate('meeting')}><i className="fa-regular fa-calendar" /><strong>Meeting notes</strong><span>Agenda and attendees layout</span></button><button onClick={() => props.onLoadTemplate('blank')}><i className="fa-regular fa-file" /><strong>Blank document</strong><span>Start with a clean page</span></button></div>}
          </div>
        </section>
      </div>}

      {props.openSettings && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) props.onCloseSettings(); }}><section className="modal-card compact-modal"><div className="modal-header"><h2><i className="fa-solid fa-gear" /> AI preferences</h2><button className="icon-button light" onClick={props.onCloseSettings} aria-label="Close settings"><i className="fa-solid fa-xmark" /></button></div><div className="modal-body settings-body"><p>Configure writing suggestions for this document.</p><label className="field-label">Default writing tone<select defaultValue="professional"><option value="professional">Professional</option><option value="friendly">Friendly</option><option value="concise">Concise</option></select></label><label className="checkbox-label"><input type="checkbox" defaultChecked /> Preserve original meaning in suggestions</label><button className="primary-small" onClick={props.onSaveSettings}>Save preferences</button></div></section></div>}

      {props.customPromptOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) props.onCloseCustomPrompt(); }}><section className="modal-card compact-modal"><div className="modal-header"><h2><i className="fa-solid fa-wand-magic-sparkles" /> Custom AI instruction</h2><button className="icon-button light" onClick={props.onCloseCustomPrompt} aria-label="Close prompt"><i className="fa-solid fa-xmark" /></button></div><div className="modal-body settings-body"><label className="field-label">What should the assistant do?<textarea rows={4} value={customPrompt} onChange={(event) => setCustomPrompt(event.target.value)} placeholder="e.g. Make this paragraph easier to understand" /></label><button className="primary-small" onClick={() => { if (customPrompt.trim()) { props.onSubmitCustomPrompt(customPrompt.trim()); setCustomPrompt(''); } }}>Generate suggestion</button></div></section></div>}

      {props.aiSuggestion !== '' || props.aiLoading ? <div className="ai-suggestion-card no-print"><div className="dialog-title"><strong><i className="fa-solid fa-wand-magic-sparkles" /> AI suggestion</strong><button className="icon-button" onClick={props.onRejectAi} aria-label="Dismiss suggestion"><i className="fa-solid fa-xmark" /></button></div>{props.aiLoading ? <div className="ai-loading"><span className="spinner" />Generating suggestion...</div> : <><div className="suggestion-text">{props.aiSuggestion}</div><div className="suggestion-actions"><button className="subtle-button" onClick={props.onRejectAi}>Reject</button><div><button className="subtle-button" onClick={props.onRegenerateAi} title="Regenerate"><i className="fa-solid fa-arrows-rotate" /></button><button className="primary-small" onClick={props.onAcceptAi}>Accept</button></div></div></>}</div> : null}

      {props.aiDrawerOpen && <aside className="ai-drawer no-print"><div className="modal-header"><h2><i className="fa-solid fa-wand-magic-sparkles" /> Full document AI review</h2><button className="icon-button light" onClick={props.onCloseAiDrawer} aria-label="Close review"><i className="fa-solid fa-xmark" /></button></div><div className="drawer-content"><div className="info-card"><strong>Proposed changes for the document</strong><span>Review changes section by section, or accept all suggestions at once.</span></div><article className="diff-card"><strong>Heading polish</strong><del>Project Proposal: AI-Powered Document Workflow</del><ins>Strategic Proposal: Intelligent Document Workflow Systems</ins></article><article className="diff-card"><strong>Section clarity</strong><del>Welcome to Ayoola Doc Forge, a next-generation browser document editor...</del><ins>Ayoola Doc Forge delivers an enterprise-grade document editing environment directly inside the browser...</ins></article></div><div className="drawer-actions"><button className="subtle-button" onClick={props.onRejectAllAi}>Reject all</button><button className="primary-small" onClick={props.onAcceptAllAi}>Accept all changes</button></div></aside>}
    </>
  );
}
