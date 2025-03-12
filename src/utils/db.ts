import { openDB } from "idb";

const DB_NAME = "editorDB";
const DB_VERSION = 1;
const STORE_NAME = "documents";

const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
};

export const saveTextToDB = async (text: string) => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  await store.put(text, "text");
  await tx.done;
};

export const loadTextFromDB = async (): Promise<string> => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  return (await store.get("text")) || "";
};

export const saveUnsyncedChanges = async (text: string) => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  await store.put(text, "unsynced");
  await tx.done;
};

export const getUnsyncedChanges = async (): Promise<string> => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  return (await store.get("unsynced")) || "";
};

export const clearUnsyncedChanges = async () => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  await store.delete("unsynced");
  await tx.done;
};
