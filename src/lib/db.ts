import Dexie, { Table } from "dexie";

// Type definitions
export interface Folder {
  id: string;
  name: string;
  isOpen: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Note {
  id: string;
  folderID: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

// Database setup
export class NotesDatabase extends Dexie {
  folders!: Table<Folder>;
  notes!: Table<Note>;

  constructor() {
    super("NotesDB");
    this.version(1).stores({
      folders: "id, createdAt",
      notes: "id, folderID, createdAt",
    });
  }
}

// Initialize database
export const db = new NotesDatabase();

// Default folder seed
export const DEFAULT_FOLDER_ID = "default-my-notes";

export const initializeDatabase = async () => {
  try {
    // Check if folders exist
    const folderCount = await db.folders.count();

    // If no folders, create default "My Notes" folder
    if (folderCount === 0) {
      await db.folders.add({
        id: DEFAULT_FOLDER_ID,
        name: "My Notes",
        isOpen: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  } catch (error) {
    console.error("Error initializing database:", error);
  }
};
