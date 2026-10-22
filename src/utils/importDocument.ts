import DOMPurify from 'dompurify';
import { marked } from 'marked';

const supportedFormats = 'PDF, DOCX, TXT, Markdown, HTML, RTF, CSV, JSON, XML, and LOG';

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] ?? character);
}

function plainTextToHtml(text: string): string {
  return text.split(/\r?\n/).map((line) => `<p>${escapeHtml(line) || '<br>'}</p>`).join('');
}

function parseCsv(text: string): string {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"' && quoted && text[index + 1] === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === ',' && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      row.push(cell);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += character;
    }
  }
  row.push(cell);
  if (row.some((value) => value.length > 0)) rows.push(row);

  if (!rows.length) return '';
  const [header, ...body] = rows;
  return `<table><thead><tr>${header.map((value) => `<th>${escapeHtml(value)}</th>`).join('')}</tr></thead><tbody>${body.map((values) => `<tr>${header.map((_, index) => `<td>${escapeHtml(values[index] ?? '')}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

function rtfToText(rtf: string): string {
  let output = '';
  let depth = 0;
  let skipGroupAtDepth: number | null = null;
  let groupStart = true;

  for (let index = 0; index < rtf.length; index += 1) {
    const character = rtf[index];
    if (character === '{') {
      depth += 1;
      groupStart = true;
      continue;
    }
    if (character === '}') {
      if (skipGroupAtDepth === depth) skipGroupAtDepth = null;
      depth -= 1;
      groupStart = false;
      continue;
    }
    if (character !== '\\') {
      if (skipGroupAtDepth !== null) continue;
      if (!/\r|\n/.test(character)) output += character;
      groupStart = false;
      continue;
    }

    const next = rtf[index + 1];
    if (next === "'" && /^[\da-f]{2}$/i.test(rtf.slice(index + 2, index + 4))) {
      if (skipGroupAtDepth === null) output += String.fromCharCode(Number.parseInt(rtf.slice(index + 2, index + 4), 16));
      index += 3;
      groupStart = false;
      continue;
    }
    if (next === '\\' || next === '{' || next === '}') {
      if (skipGroupAtDepth === null) output += next;
      index += 1;
      groupStart = false;
      continue;
    }
    if (next === '*') {
      if (groupStart) skipGroupAtDepth = depth;
      index += 1;
      groupStart = false;
      continue;
    }

    const control = rtf.slice(index + 1).match(/^([a-z]+)(-?\d+)? ?/i);
    if (!control) {
      index += 1;
      groupStart = false;
      continue;
    }
    index += control[0].length;
    const word = control[1].toLowerCase();
    if (groupStart && [
      'colortbl',
      'datastore',
      'fonttbl',
      'generator',
      'info',
      'listoverridetable',
      'listtable',
      'object',
      'pict',
      'stylesheet',
      'xmlnstbl',
    ].includes(word)) {
      skipGroupAtDepth = depth;
      continue;
    }
    if (skipGroupAtDepth !== null) continue;
    if (word === 'par' || word === 'line') output += '\n';
    else if (word === 'tab') output += '\t';
    else if (word === 'u') {
      const code = Number(control[2]);
      output += String.fromCharCode(code < 0 ? code + 65536 : code);
      if (rtf[index] === '?') index += 1;
    }
    groupStart = false;
  }
  return output;
}

async function pdfToHtml(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const document = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items
      .filter((item): item is typeof item & { str: string } => 'str' in item)
      .map((item) => item.str)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (text) pages.push(`<p>${escapeHtml(text)}</p>`);
  }

  if (!pages.length) {
    throw new Error('No selectable text was found in this PDF. Scanned PDFs need OCR, which is not available yet.');
  }
  return pages.join('<hr>');
}

export async function importDocumentFile(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  let html: string;

  if (extension === 'pdf' || file.type === 'application/pdf') {
    html = await pdfToHtml(file);
  } else if (extension === 'md' || extension === 'markdown') {
    html = await marked.parse(await file.text());
  } else if (extension === 'html' || extension === 'htm' || file.type === 'text/html') {
    html = await file.text();
  } else if (extension === 'rtf') {
    html = plainTextToHtml(rtfToText(await file.text()));
  } else if (extension === 'csv') {
    html = parseCsv(await file.text());
  } else if (['txt', 'log', 'xml', 'json'].includes(extension) || file.type.startsWith('text/')) {
    const text = await file.text();
    if (extension === 'json') {
      try {
        html = `<pre>${escapeHtml(JSON.stringify(JSON.parse(text), null, 2))}</pre>`;
      } catch {
        throw new Error('This JSON file is not valid JSON.');
      }
    } else {
      html = plainTextToHtml(text);
    }
  } else {
    throw new Error(`Unsupported file type. Supported formats: ${supportedFormats}.`);
  }

  const sanitized = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['style'],
    FORBID_ATTR: ['contenteditable'],
  });
  if (!sanitized.trim()) throw new Error('No document content could be read from this file.');
  return sanitized;
}
