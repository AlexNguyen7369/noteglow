import { useState, useEffect } from "react";
import type { Folder, Note } from "@/lib/db";
import {
  loadAll,
  createFolder,
  createNote,
  renameFolder,
  renameNote,
  deleteFolder,
  deleteNote,
  toggleFolderOpen,
  getNoteById,
} from "@/lib/notesStore";

export const useFolderNoteOperations = () => {
  // Folders and notes state
  const [folders, setFolders] = useState<Folder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteID, setSelectedNoteID] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Load all data from IndexedDB on component mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        const { folders: loadedFolders, notes: loadedNotes } = await loadAll();
        setFolders(loadedFolders);
        setNotes(loadedNotes);

        // If there's data, select the first note
        if (loadedFolders.length > 0 && loadedNotes.length > 0) {
          setSelectedNoteID(loadedNotes[0].id);
        }
      } catch (error) {
        console.error("Error initializing data:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    initializeData();
  }, []);

  // CRUD: Create folder
  const handleCreateFolder = async (name: string) => {
    const newFolder = await createFolder(name);
    setFolders((prev) => [...prev, newFolder]);
  };

  // CRUD: Create note
  const handleCreateNote = async (folderID: string) => {
    const newNote = await createNote(folderID);
    setNotes((prev) => [...prev, newNote]);
    setSelectedNoteID(newNote.id);
  };

  // CRUD: Rename folder
  const handleRenameFolder = async (folderID: string, newName: string) => {
    await renameFolder(folderID, newName);
    setFolders((prev) =>
      prev.map((f) => (f.id === folderID ? { ...f, name: newName } : f))
    );
  };

  // CRUD: Rename note
  const handleRenameNote = async (noteID: string, newTitle: string) => {
    await renameNote(noteID, newTitle);
    setNotes((prev) =>
      prev.map((n) => (n.id === noteID ? { ...n, title: newTitle } : n))
    );
  };

  // CRUD: Delete folder (atomic - deletes folder and all contained notes)
  const handleDeleteFolder = async (folderID: string) => {
    await deleteFolder(folderID);
    setFolders((prev) => prev.filter((f) => f.id !== folderID));
    setNotes((prev) => prev.filter((n) => n.folderID !== folderID));

    // Clear selection if deleted folder contained selected note
    if (
      selectedNoteID &&
      notes.find((n) => n.id === selectedNoteID)?.folderID === folderID
    ) {
      setSelectedNoteID(null);
    }
  };

  // CRUD: Delete note
  const handleDeleteNote = async (noteID: string) => {
    await deleteNote(noteID);
    setNotes((prev) => prev.filter((n) => n.id !== noteID));

    if (selectedNoteID === noteID) {
      setSelectedNoteID(null);
    }
  };

  // CRUD: Toggle folder open/closed state
  const handleToggleFolderOpen = async (folderID: string) => {
    await toggleFolderOpen(folderID);
    setFolders((prev) =>
      prev.map((f) =>
        f.id === folderID ? { ...f, isOpen: !f.isOpen } : f
      )
    );
  };

  // Utility: Get selected note data
  const getSelectedNote = async (noteID: string): Promise<Note | undefined> => {
    return getNoteById(noteID);
  };

  return {
    folders,
    setFolders,
    notes,
    setNotes,
    selectedNoteID,
    setSelectedNoteID,
    isLoadingData,
    setIsLoadingData,
    handleCreateFolder,
    handleCreateNote,
    handleRenameFolder,
    handleRenameNote,
    handleDeleteFolder,
    handleDeleteNote,
    handleToggleFolderOpen,
    getSelectedNote,
  };
};
