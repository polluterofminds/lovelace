export type Message = {
  role: string;
  content: string;
}

// IndexedDB utility for chat storage
export const openChatDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('lovelace-chat', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('chats')) {
        db.createObjectStore('chats', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('chatIds')) {
        db.createObjectStore('chatIds', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getChatMessages = async (chatId: string): Promise<Message[]> => {
  const db = await openChatDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('chats', 'readonly');
    const store = tx.objectStore('chats');
    const req = store.get(chatId);
    req.onsuccess = () => {
      resolve(req.result?.messages || []);
    };
    req.onerror = () => reject(req.error);
  });
};

export const setChatMessages = async (chatId: string, messages: Message[]): Promise<void> => {
  const db = await openChatDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('chats', 'readwrite');
    const store = tx.objectStore('chats');
    store.put({ id: chatId, messages });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getAllChatIds = async (): Promise<string[]> => {
  const db = await openChatDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('chatIds', 'readonly');
    const store = tx.objectStore('chatIds');
    const req = store.get('ids');
    req.onsuccess = () => {
      resolve(req.result?.ids || []);
    };
    req.onerror = () => reject(req.error);
  });
};

export const addChatId = async (chatId: string): Promise<void> => {
  const db = await openChatDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('chatIds', 'readwrite');
    const store = tx.objectStore('chatIds');
    const req = store.get('ids');
    req.onsuccess = () => {
      const ids = req.result?.ids || [];
      if (!ids.includes(chatId)) {
        ids.push(chatId);
        store.put({ id: 'ids', ids });
      }
      tx.oncomplete = () => resolve();
    };
    req.onerror = () => reject(req.error);
  });
};

export const removeChatId = async (chatId: string): Promise<void> => {
  const db = await openChatDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('chatIds', 'readwrite');
    const store = tx.objectStore('chatIds');
    const req = store.get('ids');
    req.onsuccess = () => {
      let ids = req.result?.ids || [];
      ids = ids.filter((id: string) => id !== chatId);
      store.put({ id: 'ids', ids });
      tx.oncomplete = () => resolve();
    };
    req.onerror = () => reject(req.error);
  });
};

export const deleteChat = async (chatId: string): Promise<void> => {
  const db = await openChatDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('chats', 'readwrite');
    const store = tx.objectStore('chats');
    store.delete(chatId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};