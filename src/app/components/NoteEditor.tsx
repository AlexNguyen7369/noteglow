"use client";

import React, { useState } from "react";
import { FiTrash2, FiDownload, FiLoader, FiChevronRight } from "react-icons/fi";
import { highlightKeyTerms } from "../../lib/highlight";

// Custom hooks
import { useTransformLogic } from "@/lib/hooks/useTransformLogic";
import { useTermDefinitions } from "@/lib/hooks/useTermDefinitions";
import { useFolderNoteOperations } from "@/lib/hooks/useFolderNoteOperations";
import { useEditorState } from "@/lib/hooks/useEditorState";

// Components
import { Sidebar } from "./Sidebar";
import { TransformSidebar } from "./TransformSidebar";
import { TermDefinitionPopup } from "./TermDefinitionPopup";

const NoteEditor = () => {
  // Initialize custom hooks
  const transform = useTransformLogic();
  const termDef = useTermDefinitions();
  const folderNote = useFolderNoteOperations();
  const editor = useEditorState(folderNote.selectedNoteID);

  // UI state for transform sidebar toggle
  const [transformSidebarOpen, setTransformSidebarOpen] = useState(false);

  // Derived state
  const selectedNote = folderNote.notes.find(
    (n) => n.id === folderNote.selectedNoteID
  );
  const selectedFolder = selectedNote
    ? folderNote.folders.find((f) => f.id === selectedNote.folderID)
    : null;

  // Handle opening transform panel
  const handleOpenTransformPanel = () => {
    setTransformSidebarOpen(true);
  };

  // Load term definitions when transform highlights are available
  const handleLoadTermDefinitions = async (terms: string[]) => {
    await termDef.loadTermDefinitions(terms, editor.editorContent);
  };

  // Wrapper for handleOptionChange to accept any string (for TransformSidebar)
  const handleTransformOptionChange = (option: string) => {
    transform.handleOptionChange(
      option as keyof typeof transform.transformOptions
    );
  };

  if (folderNote.isLoadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <FiLoader
            size={32}
            className="animate-spin text-teal-600 mx-auto mb-2"
          />
          <p className="text-slate-600">Loading your notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex">
      {/* Left Sidebar - File Navigation */}
      <Sidebar
        folders={folderNote.folders}
        notes={folderNote.notes}
        selectedNoteID={folderNote.selectedNoteID}
        onSelectNote={folderNote.setSelectedNoteID}
        onCreateFolder={folderNote.handleCreateFolder}
        onCreateNote={folderNote.handleCreateNote}
        onRenameFolder={folderNote.handleRenameFolder}
        onRenameNote={folderNote.handleRenameNote}
        onDeleteFolder={folderNote.handleDeleteFolder}
        onDeleteNote={folderNote.handleDeleteNote}
        onToggleFolderOpen={folderNote.handleToggleFolderOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 shadow-sm">
          <div className="px-8 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {selectedFolder ? `${selectedFolder.name} / ` : ""}
                {editor.editorTitle}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {selectedNote ? "Editing note" : "Select or create a note"}
              </p>
            </div>

            {transform.transformResult && (
              <button
                onClick={() =>
                  setTransformSidebarOpen(!transformSidebarOpen)
                }
                className="hidden lg:flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors duration-200"
              >
                <span>Results</span>
                <FiChevronRight
                  size={18}
                  className={`transition-transform ${
                    transformSidebarOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-8 py-6 relative">
          {folderNote.selectedNoteID ? (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full border border-slate-200">
              {/* Title Input */}
              <div className="px-8 py-4 border-b border-slate-200 bg-slate-50">
                <input
                  type="text"
                  value={editor.editorTitle}
                  onChange={(e) =>
                    editor.handleTitleChange(e.target.value)
                  }
                  placeholder="Note title..."
                  className="w-full text-lg font-semibold text-slate-900 bg-transparent border-none focus:outline-none placeholder-slate-400"
                />
              </div>

              <div className="flex-1 flex flex-col relative">
                {/* Content Editor */}
                <textarea
                  value={editor.editorContent}
                  onChange={(e) =>
                    editor.handleContentChange(e.target.value)
                  }
                  placeholder="Start typing... Include concepts, definitions, examples, anything you're learning!"
                  className="flex-1 w-full px-8 py-6 resize-none focus:outline-none text-slate-700 text-base leading-relaxed font-sans"
                />

                {/* Stats Bar */}
                <div className="bg-slate-50 border-t border-slate-200 px-8 py-3 flex gap-6 text-xs text-slate-500">
                  <p>
                    <span className="font-semibold text-slate-700">
                      {editor.characterCount}
                    </span>{" "}
                    characters
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">
                      {editor.wordCount}
                    </span>{" "}
                    words
                  </p>
                </div>

                {/* Save Indicator */}
                {editor.isSaved && (
                  <div className="bg-emerald-50 border-t border-emerald-200 text-emerald-700 px-8 py-2 text-xs animate-pulse">
                    ✓ Auto-saved
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="bg-white border-t border-slate-200 px-8 py-4 flex gap-3 justify-start flex-wrap">
                <button
                  onClick={() =>
                    editor.handleDownload(
                      editor.editorTitle,
                      editor.editorContent
                    )
                  }
                  disabled={editor.editorContent.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiDownload size={16} />
                  Download
                </button>

                <button
                  onClick={editor.handleClear}
                  disabled={editor.editorContent.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiTrash2 size={16} />
                  Clear
                </button>
              </div>

              {/* Transform Button */}
              <button
                onClick={handleOpenTransformPanel}
                disabled={editor.editorContent.length === 0}
                className="absolute top-8 right-9 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-full font-semibold shadow-lg transition-all duration-200 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
              >
                <span>Transform</span>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full border border-slate-200 items-center justify-center">
              <p className="text-slate-500">
                Select a note or create a new one to start editing
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Transform Sidebar Component */}
      <TransformSidebar
        isOpen={transformSidebarOpen}
        onClose={() => setTransformSidebarOpen(false)}
        transformOptions={transform.transformOptions}
        handleOptionChange={handleTransformOptionChange}
        handleConfirmTransform={transform.handleConfirmTransform}
        isTransforming={transform.isTransforming}
        transformError={transform.transformError}
        transformResult={transform.transformResult}
        editorContent={editor.editorContent}
        handleTermClick={termDef.handleTermClick}
        loadTermDefinitions={handleLoadTermDefinitions}
      />

      {/* Transform Sidebar Overlay */}
      {transformSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setTransformSidebarOpen(false)}
        />
      )}

      {/* Term Definition Popup Component */}
      <TermDefinitionPopup
        selectedTerm={termDef.selectedTerm}
        setSelectedTerm={termDef.setSelectedTerm}
        termDefinitions={termDef.termDefinitions}
        isLoadingDefinitions={termDef.isLoadingDefinitions}
      />
    </div>
  );
};

export default NoteEditor;
