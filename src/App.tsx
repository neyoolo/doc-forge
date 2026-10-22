import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AppHeader from './components/AppHeader';
import Dialogs from './components/Dialogs';
import EditorCanvas from './components/EditorCanvas';
import StatusBar from './components/StatusBar';
import Toolbar from './components/Toolbar';
import type { AiTask, EditorStats, ToastMessage, ToastKind } from './types';
import { loadSavedDocument, saveDocument } from './utils/documentStorage';

const resumeTemplate = `<h1>Jane Doe</h1><p><strong>Email:</strong> jane.doe@example.com | <strong>Phone:</strong> (555) 019-2831</p><h2>Professional Experience</h2><h3>Senior Software Engineer — TechCorp</h3><p><em>2021 – Present</em></p><ul><li>Led a team of 6 engineers building web productivity applications.</li><li>Optimized browser performance reducing load time by 40%.</li></ul>`;
const meetingTemplate = `<h1>Weekly Engineering Sync</h1><p><strong>Date:</strong> October 24, 2026</p><h2>Attendees</h2><p>Jane, Alex, Rahul, Sarah</p><h2>Agenda Items</h2><ol><li>Sprint review and release readiness</li><li>Cloud storage R2 integration pipeline</li></ol>`;

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function makeStats(text: string): EditorStats {
  const words = countWords(text);
  return { words, characters: text.length, readingMinutes: Math.max(1, Math.ceil(words / 200)) };
}

function replaceTextNodes(root: HTMLElement, search: string, replacement: string, all: boolean) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  let replaced = 0;
  for (const node of nodes) {
    const source = node.data;
    const index = source.toLocaleLowerCase().indexOf(search.toLocaleLowerCase());
    if (index < 0) continue;
    const next = all
      ? source.replace(new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), replacement)
      : `${source.slice(0, index)}${replacement}${source.slice(index + search.length)}`;
    replaced += all
      ? (source.match(new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) ?? []).length
      : 1;
    node.data = next;
    if (!all) break;
  }
  return replaced;
}

function downloadFile(filename: string, content: BlobPart, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const editorRef = useRef<HTMLDivElement>(null);
  const docxStylesRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const saveTimerRef = useRef<number | undefined>(undefined);
  const isDocxRef = useRef(false);
  const [title, setTitle] = useState('Untitled Document.docx');
  const [isDocx, setIsDocx] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'loading' | 'saving' | 'saved' | 'error'>('loading');
  const [stats, setStats] = useState<EditorStats>({ words: 0, characters: 0, readingMinutes: 1 });
  const [zoom, setZoom] = useState(100);
  const [exportOpen, setExportOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [openImport, setOpenImport] = useState(false);
  const [openFind, setOpenFind] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [customPromptOpen, setCustomPromptOpen] = useState(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [find, setFind] = useState('');
  const [replace, setReplace] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiQuota, setAiQuota] = useState(8);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toastId = useRef(0);
  const aiTimerRef = useRef<number | undefined>(undefined);

  const notify = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = ++toastId.current;
    setToasts((current) => [...current, { id, message, kind }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 3200);
  }, []);

  const scheduleSave = useCallback(() => {
    const editor = editorRef.current;
    if (!storageReady || !editor) return;
    window.clearTimeout(saveTimerRef.current);
    setSaveStatus('saving');
    saveTimerRef.current = window.setTimeout(() => {
      void saveDocument({
        title,
        html: editor.innerHTML,
        docxStyles: docxStylesRef.current?.innerHTML ?? '',
        isDocx: isDocxRef.current,
      }).then(() => {
        setSaveStatus('saved');
      }).catch((error: unknown) => {
        setSaveStatus('error');
        notify(error instanceof Error ? `Could not save locally: ${error.message}` : 'Could not save the document locally.', 'error');
      });
    }, 500);
  }, [notify, storageReady, title]);

  const refreshStats = useCallback(() => {
    setStats(makeStats(editorRef.current?.innerText ?? ''));
    scheduleSave();
  }, [scheduleSave]);

  useEffect(() => {
    let cancelled = false;
    void loadSavedDocument().then((saved) => {
      if (cancelled) return;
      if (saved && editorRef.current) {
        editorRef.current.innerHTML = saved.html;
        if (docxStylesRef.current) docxStylesRef.current.innerHTML = saved.docxStyles;
        setTitle(saved.title);
        isDocxRef.current = saved.isDocx;
        setIsDocx(saved.isDocx);
      }
      setStats(makeStats(editorRef.current?.innerText ?? ''));
      setStorageReady(true);
      setSaveStatus('saved');
    }).catch((error: unknown) => {
      if (cancelled) return;
      setStorageReady(true);
      setSaveStatus('error');
      notify(error instanceof Error ? `Local document storage is unavailable: ${error.message}` : 'Local document storage is unavailable.', 'error');
    });
    return () => { cancelled = true; };
  }, [notify]);

  useEffect(() => () => window.clearTimeout(saveTimerRef.current), []);

  useEffect(() => {
    const saveOnPageHide = () => {
      const editor = editorRef.current;
      if (!storageReady || !editor) return;
      window.clearTimeout(saveTimerRef.current);
      void saveDocument({
        title,
        html: editor.innerHTML,
        docxStyles: docxStylesRef.current?.innerHTML ?? '',
        isDocx: isDocxRef.current,
      }).catch((error: unknown) => {
        console.error('Could not save the document before leaving the page.', error);
      });
    };
    window.addEventListener('pagehide', saveOnPageHide);
    return () => window.removeEventListener('pagehide', saveOnPageHide);
  }, [storageReady, title]);

  useEffect(() => {
    if (storageReady) scheduleSave();
  }, [title, storageReady, scheduleSave]);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        setOpenFind((current) => !current);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => () => window.clearTimeout(aiTimerRef.current), []);

  const findCount = useMemo(() => {
    const text = editorRef.current?.innerText ?? '';
    if (!find) return 0;
    return text.match(new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'))?.length ?? 0;
  }, [find, stats]);

  const applyCommand = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    refreshStats();
  };

  const applyFormatBlock = (tag: string) => {
    editorRef.current?.focus();
    document.execCommand('formatBlock', false, `<${tag}>`);
    refreshStats();
  };

  const insertContent = (kind: 'checklist' | 'link' | 'image' | 'table' | 'page-break') => {
    const editor = editorRef.current;
    editor?.focus();
    if (kind === 'link') {
      const url = window.prompt('Enter link URL:', 'https://');
      if (url) applyCommand('createLink', url);
      return;
    }
    if (kind === 'image') {
      document.getElementById('image-upload-input')?.click();
      return;
    }
    const markup = {
      checklist: '<p><label><input type="checkbox"> New task item</label></p>',
      table: '<table><thead><tr><th>Header 1</th><th>Header 2</th><th>Header 3</th></tr></thead><tbody><tr><td>Cell 1</td><td>Cell 2</td><td>Cell 3</td></tr><tr><td>Cell 4</td><td>Cell 5</td><td>Cell 6</td></tr></tbody></table><p><br></p>',
      'page-break': '<div class="page-break" contenteditable="false"></div><p><br></p>',
    }[kind];
    document.execCommand('insertHTML', false, markup);
    refreshStats();
  };

  const onImageSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      document.execCommand('insertHTML', false, `<img src="${String(reader.result)}" alt="Uploaded image">`);
      refreshStats();
      notify('Image inserted successfully', 'success');
    };
    reader.onerror = () => notify('Could not read the selected image.', 'error');
    reader.readAsDataURL(file);
  };

  const runAi = (task: AiTask, tone = '', customText = '') => {
    setAiOpen(false);
    if (aiQuota <= 0) {
      notify('Daily AI quota limit reached. Come back tomorrow.', 'error');
      return;
    }
    setAiQuota((quota) => quota - 1);
    const selection = window.getSelection();
    const selectedText = customText || selection?.toString().trim() || '';
    if (!selectedText) {
      setAiDrawerOpen(true);
      return;
    }
    if (selection?.rangeCount) savedRangeRef.current = selection.getRangeAt(0).cloneRange();
    setAiSuggestion('');
    setAiLoading(true);
    aiTimerRef.current = window.setTimeout(() => {
      let result = selectedText;
      if (task === 'rewrite') result = `Enhanced phrasing: ${selectedText.charAt(0).toUpperCase()}${selectedText.slice(1)} (Optimized for clarity and professional structure).`;
      else if (task === 'summarize') result = `Key summary: ${selectedText.slice(0, 100)}${selectedText.length > 100 ? '…' : ''}`;
      else if (task === 'grammar') result = `Grammar-corrected: ${selectedText.replace(/\bteh\b/gi, 'the').replace(/\bi\b/g, 'I')}`;
      else if (task === 'tone') result = `[${tone.toUpperCase()} TONE]: ${selectedText}`;
      else if (task === 'custom') result = `Suggestion for “${selectedText}”: ${selectedText}`;
      setAiSuggestion(result);
      setAiLoading(false);
    }, 850);
  };

  const acceptAi = () => {
    const editor = editorRef.current;
    const range = savedRangeRef.current;
    if (editor && range && aiSuggestion) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      document.execCommand('insertText', false, aiSuggestion);
      refreshStats();
      notify('AI suggestion applied', 'success');
    }
    setAiSuggestion('');
    savedRangeRef.current = null;
  };

  const replaceMatches = (all: boolean) => {
    if (!find || !editorRef.current) return;
    const count = replaceTextNodes(editorRef.current, find, replace, all);
    refreshStats();
    setFind('');
    notify(count ? `${all ? 'Replaced all' : 'Replaced'} ${count === 1 ? 'match' : `${count} matches`}` : 'No matching text found', count ? 'success' : 'info');
  };

  const importFile = async (file: File) => {
    const isWordDocument = file.name.toLowerCase().endsWith('.docx')
      || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    if (isWordDocument) {
      if (!editorRef.current || !docxStylesRef.current) throw new Error('The document editor is not ready.');
      const { renderDocxFile } = await import('./utils/renderDocx');
      await renderDocxFile(file, editorRef.current, docxStylesRef.current);
      isDocxRef.current = true;
      setIsDocx(true);
    } else {
      const { importDocumentFile } = await import('./utils/importDocument');
      const html = await importDocumentFile(file);
      if (editorRef.current) editorRef.current.innerHTML = html;
      docxStylesRef.current?.replaceChildren();
      isDocxRef.current = false;
      setIsDocx(false);
    }
    setTitle(file.name);
    setOpenImport(false);
    refreshStats();
    notify(`Imported ${file.name}`, 'success');
  };

  const loadTemplate = (template: 'resume' | 'meeting' | 'blank') => {
    if (editorRef.current) editorRef.current.innerHTML = template === 'resume' ? resumeTemplate : template === 'meeting' ? meetingTemplate : '<p><br></p>';
    docxStylesRef.current?.replaceChildren();
    isDocxRef.current = false;
    setIsDocx(false);
    setOpenImport(false);
    refreshStats();
    notify('Template loaded', 'success');
  };

  const clearCanvas = () => {
    if (!window.confirm('Clear the current document? Its contents will be replaced with a blank canvas.')) return;
    window.clearTimeout(saveTimerRef.current);
    if (editorRef.current) editorRef.current.innerHTML = '<p><br></p>';
    docxStylesRef.current?.replaceChildren();
    isDocxRef.current = false;
    setIsDocx(false);
    setTitle('Untitled Document.docx');
    refreshStats();
    notify('Canvas cleared. The blank document will be saved locally.', 'success');
  };

  const exportDocument = (format: 'docx' | 'pdf' | 'html' | 'markdown') => {
    setExportOpen(false);
    const editor = editorRef.current;
    if (!editor) return;
    const filename = title.replace(/\.[^.]+$/, '') || 'document';
    if (format === 'pdf') {
      notify('Use the browser print dialog to save as PDF.', 'info');
      window.print();
    } else if (format === 'docx') {
      const documentHtml = `<html><body>${editor.innerHTML}</body></html>`;
      downloadFile(`${filename}.doc`, documentHtml, 'application/msword');
    } else if (format === 'html') {
      downloadFile(`${filename}.html`, `<html><body>${editor.innerHTML}</body></html>`, 'text/html');
    } else {
      downloadFile(`${filename}.md`, editor.innerText, 'text/markdown');
    }
    notify(`Exported as ${format.toUpperCase()}`, 'success');
  };

  return (
    <div className="app-shell">
      <AppHeader
        title={title}
        onTitleChange={setTitle}
        exportOpen={exportOpen}
        onToggleExport={() => setExportOpen((open) => !open)}
        onOpenImport={() => setOpenImport(true)}
        onOpenFind={() => setOpenFind((open) => !open)}
        onOpenSettings={() => setOpenSettings(true)}
        onClearCanvas={clearCanvas}
        onExport={exportDocument}
      />
      <Toolbar
        onCommand={applyCommand}
        onFormatBlock={applyFormatBlock}
        onInsert={insertContent}
        onAi={runAi}
        aiOpen={aiOpen}
        onToggleAi={() => setAiOpen((open) => !open)}
        onCustomAi={() => { setAiOpen(false); setCustomPromptOpen(true); }}
      />
      <EditorCanvas ref={editorRef} docxStylesRef={docxStylesRef} isDocx={isDocx} isReady={storageReady} zoom={zoom} onInput={refreshStats} onImageSelect={onImageSelect} />
      <StatusBar stats={stats} zoom={zoom} aiQuota={aiQuota} saveStatus={saveStatus} onZoomChange={setZoom} />
      <Dialogs
        openImport={openImport}
        onCloseImport={() => setOpenImport(false)}
        onImportFile={importFile}
        onImportError={(message) => notify(message, 'error')}
        onLoadTemplate={loadTemplate}
        openFind={openFind}
        onCloseFind={() => setOpenFind(false)}
        find={find}
        replace={replace}
        onFindChange={setFind}
        onReplaceChange={setReplace}
        findCount={findCount}
        onReplaceCurrent={() => replaceMatches(false)}
        onReplaceAll={() => replaceMatches(true)}
        onNavigateFind={() => notify('Use Replace or Replace all to update matching text.', 'info')}
        openSettings={openSettings}
        onCloseSettings={() => setOpenSettings(false)}
        onSaveSettings={() => { setOpenSettings(false); notify('AI preferences saved', 'success'); }}
        customPromptOpen={customPromptOpen}
        onCloseCustomPrompt={() => setCustomPromptOpen(false)}
        onSubmitCustomPrompt={(prompt) => { setCustomPromptOpen(false); runAi('custom', '', prompt); }}
        aiSuggestion={aiSuggestion}
        aiLoading={aiLoading}
        onAcceptAi={acceptAi}
        onRejectAi={() => { setAiSuggestion(''); setAiLoading(false); savedRangeRef.current = null; notify('AI suggestion rejected', 'info'); }}
        onRegenerateAi={() => {
          const previous = aiSuggestion;
          setAiLoading(true);
          setAiSuggestion('');
          aiTimerRef.current = window.setTimeout(() => { setAiSuggestion(`${previous} [Regenerated variation]`); setAiLoading(false); }, 700);
        }}
        aiDrawerOpen={aiDrawerOpen}
        onCloseAiDrawer={() => setAiDrawerOpen(false)}
        onAcceptAllAi={() => { setAiDrawerOpen(false); notify('All document revisions applied', 'success'); }}
        onRejectAllAi={() => { setAiDrawerOpen(false); notify('Revisions discarded', 'info'); }}
      />
      <div className="toast-container no-print" aria-live="polite">
        {toasts.map((toast) => <div className={`toast toast-${toast.kind}`} key={toast.id}><i className={`fa-solid ${toast.kind === 'success' ? 'fa-circle-check' : toast.kind === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info'}`} />{toast.message}</div>)}
      </div>
      <span className="visually-hidden" aria-live="polite">{aiQuota}/10 AI actions remaining</span>
    </div>
  );
}
