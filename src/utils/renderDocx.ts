import { renderAsync } from 'docx-preview';

export async function renderDocxFile(file: File, contentContainer: HTMLElement, styleContainer: HTMLElement): Promise<void> {
  const renderedContent = document.createElement('div');
  const renderedStyles = document.createElement('div');
  await renderAsync(file, renderedContent, renderedStyles, {
    className: 'docx',
    inWrapper: true,
    breakPages: true,
    ignoreWidth: false,
    ignoreHeight: false,
    ignoreFonts: false,
    ignoreLastRenderedPageBreak: false,
    renderHeaders: true,
    renderFooters: true,
    renderFootnotes: true,
    renderEndnotes: true,
    useBase64URL: true,
  });
  contentContainer.replaceChildren(...renderedContent.childNodes);
  styleContainer.replaceChildren(...renderedStyles.childNodes);
}
