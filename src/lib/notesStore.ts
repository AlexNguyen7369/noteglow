import { db, Folder, Note, initializeDatabase } from "./db";

// Utility: Generate UUID v4
export const generateId = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// CRUD: Create folder
export const createFolder = async (name: string): Promise<Folder> => {
  const folder: Folder = {
    id: generateId(),
    name: name.trim(),
    isOpen: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await db.folders.add(folder);
  return folder;
};

// CRUD: Create note
export const createNote = async (folderID: string): Promise<Note> => {
  const note: Note = {
    id: generateId(),
    folderID,
    title: "Untitled",
    content: "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await db.notes.add(note);
  return note;
};

// CRUD: Update note content (title and/or content)
export const updateNoteContent = async (
  noteID: string,
  title?: string,
  content?: string
): Promise<void> => {
  const updates: Partial<Note> = {
    updatedAt: Date.now(),
  };

  if (title !== undefined) {
    updates.title = title;
  }

  if (content !== undefined) {
    updates.content = content;
  }

  await db.notes.update(noteID, updates);
};

// CRUD: Rename folder
export const renameFolder = async (
  folderID: string,
  newName: string
): Promise<void> => {
  await db.folders.update(folderID, {
    name: newName.trim(),
    updatedAt: Date.now(),
  });
};

// CRUD: Rename note
export const renameNote = async (
  noteID: string,
  newTitle: string
): Promise<void> => {
  await db.notes.update(noteID, {
    title: newTitle.trim(),
    updatedAt: Date.now(),
  });
};

// CRUD: Delete folder (atomic - deletes folder and all its notes)
export const deleteFolder = async (folderID: string): Promise<void> => {
  await db.transaction("rw", db.folders, db.notes, async () => {
    // Delete all notes in this folder
    await db.notes.where("folderID").equals(folderID).delete();

    // Delete the folder
    await db.folders.delete(folderID);
  });
};

// CRUD: Delete note
export const deleteNote = async (noteID: string): Promise<void> => {
  await db.notes.delete(noteID);
};

// CRUD: Toggle folder open/closed state
export const toggleFolderOpen = async (folderID: string): Promise<void> => {
  const folder = await db.folders.get(folderID);
  if (folder) {
    await db.folders.update(folderID, {
      isOpen: !folder.isOpen,
      updatedAt: Date.now(),
    });
  }
};

// CRUD: Load all folders and notes
export const loadAll = async (): Promise<{
  folders: Folder[];
  notes: Note[];
}> => {
  await initializeDatabase();

  const folders = await db.folders.toArray();
  const notes = await db.notes.toArray();

  return { folders, notes };
};

// Query: Get notes by folder ID
export const getNotesByFolder = async (folderID: string): Promise<Note[]> => {
  return db.notes.where("folderID").equals(folderID).toArray();
};

// Query: Get single note by ID
export const getNoteById = async (noteID: string): Promise<Note | undefined> => {
  return db.notes.get(noteID);
};

// Query: Get single folder by ID
export const getFolderById = async (folderID: string): Promise<Folder | undefined> => {
  return db.folders.get(folderID);
};

// Utility: Sort folders by creation date
export const sortFolders = (folders: Folder[]): Folder[] => {
  return [...folders].sort((a, b) => a.createdAt - b.createdAt);
};

// Utility: Sort notes by creation date
export const sortNotes = (notes: Note[]): Note[] => {
  return [...notes].sort((a, b) => a.createdAt - b.createdAt);
};
