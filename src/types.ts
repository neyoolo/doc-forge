export type ToastKind = 'info' | 'success' | 'error';
export type ImportTab = 'upload' | 'url' | 'templates';
export type AiTask = 'rewrite' | 'summarize' | 'grammar' | 'tone' | 'custom';

export interface ToastMessage {
  id: number;
  message: string;
  kind: ToastKind;
}

export interface EditorStats {
  words: number;
  characters: number;
  readingMinutes: number;
}
