const PAGE_CLASS = 'document-page';

function createPage(): HTMLDivElement {
  const page = document.createElement('div');
  page.className = PAGE_CLASS;
  return page;
}

function samePageGroups(currentPages: HTMLElement[], groups: Node[][]): boolean {
  return currentPages.length === groups.length && currentPages.every((page, pageIndex) => (
    page.childNodes.length === groups[pageIndex].length
    && groups[pageIndex].every((node, nodeIndex) => page.childNodes[nodeIndex] === node)
  ));
}

export function paginateDocument(editor: HTMLElement): number {
  if (editor.classList.contains('docx-content')) return editor.querySelectorAll(`:scope > .${PAGE_CLASS}`).length;

  const selection = window.getSelection();
  const savedRange = selection?.rangeCount ? selection.getRangeAt(0).cloneRange() : null;
  const editorHadFocus = document.activeElement === editor;
  const sourceNodes: Node[] = [];
  for (const child of Array.from(editor.childNodes)) {
    if (child instanceof HTMLElement && child.classList.contains(PAGE_CLASS)) {
      sourceNodes.push(...Array.from(child.childNodes));
    } else if (child.nodeType === Node.TEXT_NODE) {
      if (child.textContent?.trim()) {
        const paragraph = document.createElement('p');
        paragraph.textContent = child.textContent;
        sourceNodes.push(paragraph);
      }
    } else if (child.nodeType !== Node.COMMENT_NODE) {
      sourceNodes.push(child);
    }
  }

  if (!sourceNodes.length) {
    const existingPage = editor.querySelector(`:scope > .${PAGE_CLASS}`);
    if (!existingPage) {
      const blankPage = createPage();
      const paragraph = document.createElement('p');
      paragraph.innerHTML = '<br>';
      blankPage.append(paragraph);
      editor.replaceChildren(blankPage);
    }
    return 1;
  }

  const measurementPage = createPage();
  measurementPage.classList.add('page-measurement');
  measurementPage.style.position = 'fixed';
  measurementPage.style.left = '-10000px';
  measurementPage.style.top = '0';
  measurementPage.style.visibility = 'hidden';
  measurementPage.style.pointerEvents = 'none';
  editor.append(measurementPage);

  const groups: Node[][] = [];
  let currentGroup: Node[] = [];

  for (const node of sourceNodes) {
    if (node instanceof HTMLElement && node.classList.contains('page-break')) {
      if (currentGroup.length) groups.push(currentGroup);
      currentGroup = [];
      continue;
    }

    measurementPage.append(node.cloneNode(true));
    const overflows = measurementPage.scrollHeight > 1032;
    if (overflows && currentGroup.length) {
      measurementPage.lastElementChild?.remove();
      groups.push(currentGroup);
      currentGroup = [];
      measurementPage.replaceChildren(node.cloneNode(true));
    }
    currentGroup.push(node);
  }
  if (currentGroup.length) groups.push(currentGroup);
  measurementPage.remove();

  const existingPages = Array.from(editor.children).filter((child): child is HTMLElement => (
    child instanceof HTMLElement && child.classList.contains(PAGE_CLASS)
  ));
  if (!samePageGroups(existingPages, groups)) {
    const pages = groups.map((nodes) => {
      const page = createPage();
      page.append(...nodes);
      return page;
    });
    editor.replaceChildren(...pages);
    if (savedRange && editor.contains(savedRange.startContainer) && editor.contains(savedRange.endContainer)) {
      selection?.removeAllRanges();
      selection?.addRange(savedRange);
      if (editorHadFocus) editor.focus({ preventScroll: true });
    }
  }
  return groups.length;
}
