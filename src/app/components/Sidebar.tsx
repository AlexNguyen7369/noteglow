"use client";

import React, { useState, useMemo } from "react";
import {
  FiChevronDown,
  FiChevronRight,
  FiFolder,
  FiFile,
  FiMoreVertical,
  FiPlus,
} from "react-icons/fi";
import { Folder, Note } from "@/lib/db";
import { sortNotes } from "@/lib/notesStore";
import { CreateFolderModal } from "./CreateFolderModal";
import { RenameModal } from "./RenameModal";
import { DeleteConfirmModal } from "./DeleteConfirmModal";

interface SidebarProps {
  folders: Folder[];
  notes: Note[];
  selectedNoteID: string | null;
  onSelectNote: (noteID: string) => void;
  onCreateFolder: (name: string) => Promise<void>;
  onCreateNote: (folderID: string) => Promise<void>;
  onRenameFolder: (folderID: string, newName: string) => Promise<void>;
  onRenameNote: (noteID: string, newTitle: string) => Promise<void>;
  onDeleteFolder: (folderID: string) => Promise<void>;
  onDeleteNote: (noteID: string) => Promise<void>;
  onToggleFolderOpen: (folderID: string) => Promise<void>;
}

interface ContextMenu {
  type: "folder" | "note";
  id: string;
  x: number;
  y: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  folders,
  notes,
  selectedNoteID,
  onSelectNote,
  onCreateFolder,
  onCreateNote,
  onRenameFolder,
  onRenameNote,
  onDeleteFolder,
  onDeleteNote,
  onToggleFolderOpen,
}) => {
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{
    type: "folder" | "note";
    id: string;
    name: string;
  } | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "folder" | "note";
    id: string;
    name: string;
  } | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);

  // Memoized: Group notes by folder
  const notesByFolder = useMemo(() => {
    const grouped: Record<string, Note[]> = {};
    folders.forEach((folder) => {
      grouped[folder.id] = sortNotes(
        notes.filter((note) => note.folderID === folder.id)
      );
    });
    return grouped;
  }, [folders, notes]);

  const handleContextMenu = (
    e: React.MouseEvent,
    type: "folder" | "note",
    id: string
  ) => {
    e.preventDefault();
    setContextMenu({ type, id, x: e.clientX, y: e.clientY });
  };

  const handleRenameClick = (
    type: "folder" | "note",
    id: string,
    name: string
  ) => {
    setRenameTarget({ type, id, name });
    setRenameModalOpen(true);
    setContextMenu(null);
  };

  const handleDeleteClick = (
    type: "folder" | "note",
    id: string,
    name: string
  ) => {
    setDeleteTarget({ type, id, name });
    setDeleteModalOpen(true);
    setContextMenu(null);
  };

  const handleCreateNoteClick = async (folderID: string) => {
    await onCreateNote(folderID);
    setContextMenu(null);
  };

  const handleRenameConfirm = async (newName: string) => {
    if (!renameTarget) return;

    if (renameTarget.type === "folder") {
      await onRenameFolder(renameTarget.id, newName);
    } else {
      await onRenameNote(renameTarget.id, newName);
    }
    setRenameModalOpen(false);
    setRenameTarget(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === "folder") {
      await onDeleteFolder(deleteTarget.id);
    } else {
      await onDeleteNote(deleteTarget.id);
    }
    setDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  return (
    <>
      <aside className="w-64 bg-white border-r border-slate-200 shadow-sm flex flex-col overflow-hidden">
        {/* Brand Title */}
        <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-teal-50 to-emerald-50">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
            📝 NoteGlow
          </h1>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Your Notes, but Better
          </p>
        </div>

        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Folders</h2>
              <p className="text-xs text-slate-500 mt-1">
                {folders.length} {folders.length === 1 ? "folder" : "folders"}
              </p>
            </div>
            <button
              onClick={() => setCreateFolderModalOpen(true)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-slate-900"
              title="Create new folder"
            >
              <FiPlus size={18} />
            </button>
          </div>
        </div>

        {/* Folders & Notes */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {folders.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">
              No folders yet
            </p>
          ) : (
            folders.map((folder) => {
              const folderNotes = notesByFolder[folder.id] || [];
              const isOpen = folder.isOpen;

              return (
                <div key={folder.id}>
                  {/* Folder Item */}
                  <div
                    className="group relative"
                    onContextMenu={(e) =>
                      handleContextMenu(e, "folder", folder.id)
                    }
                  >
                    <div className="flex items-center gap-0">
                      {/* Toggle & Folder Icon */}
                      <button
                        onClick={() => onToggleFolderOpen(folder.id)}
                        className="flex-shrink-0 p-2 hover:bg-slate-50 rounded-lg transition-colors"
                        title={isOpen ? "Collapse folder" : "Expand folder"}
                      >
                        {isOpen ? (
                          <FiChevronDown size={16} className="text-slate-600" />
                        ) : (
                          <FiChevronRight
                            size={16}
                            className="text-slate-600"
                          />
                        )}
                      </button>

                      {/* Folder Name */}
                      <div className="flex-1 px-2 py-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <FiFolder
                            size={16}
                            className="text-amber-500 flex-shrink-0"
                          />
                          <span className="flex-1 text-sm font-medium text-slate-900 truncate">
                            {folder.name}
                          </span>
                        </div>
                      </div>

                      {/* Menu Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleContextMenu(e, "folder", folder.id);
                        }}
                        onContextMenu={(e) => e.preventDefault()}
                        className="flex-shrink-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-200 rounded"
                        title="Folder options"
                      >
                        <FiMoreVertical size={14} className="text-slate-600" />
                      </button>
                    </div>

                    {/* Context Menu */}
                    {contextMenu?.type === "folder" &&
                      contextMenu?.id === folder.id && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-40 w-48">
                          <button
                            onClick={() =>
                              handleRenameClick(
                                "folder",
                                folder.id,
                                folder.name
                              )
                            }
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 border-b border-slate-100"
                          >
                            Rename
                          </button>
                          <button
                            onClick={() => handleCreateNoteClick(folder.id)}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 border-b border-slate-100"
                          >
                            New Note
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteClick(
                                "folder",
                                folder.id,
                                folder.name
                              )
                            }
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                  </div>

                  {/* Notes in Folder */}
                  {isOpen && (
                    <div className="ml-4 space-y-1">
                      {folderNotes.length === 0 ? (
                        <p className="text-xs text-slate-400 px-3 py-2 italic">
                          No notes
                        </p>
                      ) : (
                        folderNotes.map((note) => (
                          <div
                            key={note.id}
                            className="group/note relative"
                            onContextMenu={(e) =>
                              handleContextMenu(e, "note", note.id)
                            }
                          >
                            <div className="flex items-center gap-0">
                              {/* Note Item */}
                              <button
                                onClick={() => onSelectNote(note.id)}
                                className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-left min-w-0 ${
                                  selectedNoteID === note.id
                                    ? "bg-teal-50 text-teal-700"
                                    : "hover:bg-slate-50 text-slate-700"
                                }`}
                              >
                                <FiFile size={14} className="flex-shrink-0" />
                                <span className="flex-1 text-sm truncate">
                                  {note.title}
                                </span>
                              </button>

                              {/* Note Menu Button */}
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleContextMenu(e, "note", note.id);
                                }}
                                onContextMenu={(e) => e.preventDefault()}
                                className="flex-shrink-0 p-1 opacity-0 group-hover/note:opacity-100 transition-opacity hover:bg-slate-200 rounded"
                                title="Note options"
                              >
                                <FiMoreVertical size={14} />
                              </button>
                            </div>

                            {/* Note Context Menu */}
                            {contextMenu?.type === "note" &&
                              contextMenu?.id === note.id && (
                                <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-40 w-48">
                                  <button
                                    onClick={() =>
                                      handleRenameClick(
                                        "note",
                                        note.id,
                                        note.title
                                      )
                                    }
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 border-b border-slate-100"
                                  >
                                    Rename
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteClick(
                                        "note",
                                        note.id,
                                        note.title
                                      )
                                    }
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </nav>

        {/* Footer - Create Folder Button */}
        <div className="border-t border-slate-200 p-4">
          <button
            onClick={() => setCreateFolderModalOpen(true)}
            className="w-full px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            + New Folder
          </button>
        </div>
      </aside>

      {/* Modals */}
      <CreateFolderModal
        isOpen={createFolderModalOpen}
        onClose={() => setCreateFolderModalOpen(false)}
        onConfirm={onCreateFolder}
      />

      {renameTarget && (
        <RenameModal
          isOpen={renameModalOpen}
          currentName={renameTarget.name}
          itemType={renameTarget.type}
          onClose={() => setRenameModalOpen(false)}
          onConfirm={handleRenameConfirm}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          isOpen={deleteModalOpen}
          itemType={deleteTarget.type}
          itemName={deleteTarget.name}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleDeleteConfirm}
        />
      )}

      {/* Close context menu on click outside */}
      {contextMenu && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setContextMenu(null)}
        />
      )}
    </>
  );
};
