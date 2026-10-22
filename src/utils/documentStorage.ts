export interface SavedDocument {
  title: string;
  html: string;
  docxStyles: string;
  isDocx: boolean;
}

const DATABASE_NAME = 'ayoola-doc-forge';
const STORE_NAME = 'documents';
const DOCUMENT_KEY = 'current-document';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open local document storage.'));
  });
}

export async function loadSavedDocument(): Promise<SavedDocument | undefined> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const request = transaction.objectStore(STORE_NAME).get(DOCUMENT_KEY) as IDBRequest<SavedDocument | undefined>;
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not load the saved document.'));
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => database.close();
  });
}

export async function saveDocument(document: SavedDocument): Promise<void> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(document, DOCUMENT_KEY);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      const error = transaction.error ?? new Error('Could not save the document locally.');
      database.close();
      reject(error);
    };
    transaction.onabort = () => {
      const error = transaction.error ?? new Error('Document save was interrupted.');
      database.close();
      reject(error);
    };
  });
}
