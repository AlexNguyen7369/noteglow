"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FiTrash2,
  FiDownload,
  FiLoader,
  FiChevronRight,
  FiX,
} from "react-icons/fi";
import type { TransformResult } from "../api/transform/route";
import { highlightKeyTerms } from "../../lib/highlight";
import { Sidebar } from "./Sidebar";
import type { Folder, Note } from "@/lib/db";
import {
  loadAll,
  createFolder,
  createNote,
  updateNoteContent,
  renameFolder,
  renameNote,
  deleteFolder,
  deleteNote,
  toggleFolderOpen,
  getNoteById,
} from "@/lib/notesStore";

const NoteEditor = () => {
  // Folders & Notes state
  const [folders, setFolders] = useState<Folder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteID, setSelectedNoteID] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Editor state
  const [editorContent, setEditorContent] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const [editorTitle, setEditorTitle] = useState("Untitled");
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Transform state
  const [transformSidebarOpen, setTransformSidebarOpen] = useState(false);
  const [transformOptions, setTransformOptions] = useState({
    autoFormat: false,
    highlightKeyTerms: false,
    comments: false,
  });
  const [isTransforming, setIsTransforming] = useState(false);
  const [transformResult, setTransformResult] =
    useState<TransformResult | null>(null);
  const [transformError, setTransformError] = useState<string | null>(null);

  // Term definitions
  const [termDefinitions, setTermDefinitions] = useState<
    Record<string, string>
  >({});
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [isLoadingDefinitions, setIsLoadingDefinitions] = useState(false);

  // Load all data from IndexedDB on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        const { folders: loadedFolders, notes: loadedNotes } = await loadAll();
        setFolders(loadedFolders);
        setNotes(loadedNotes);

        // If there's a default folder, select the first note in it
        if (loadedFolders.length > 0 && loadedNotes.length > 0) {
          setSelectedNoteID(loadedNotes[0].id);
          setEditorContent(loadedNotes[0].content);
          setEditorTitle(loadedNotes[0].title);
          setCharacterCount(loadedNotes[0].content.length);
        }
      } catch (error) {
        console.error("Error initializing data:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    initializeData();
  }, []);

  // Load note when selected
  useEffect(() => {
    const loadNote = async () => {
      if (!selectedNoteID) {
        setEditorContent("");
        setEditorTitle("Untitled");
        setCharacterCount(0);
        return;
      }

      const note = await getNoteById(selectedNoteID);
      if (note) {
        setEditorContent(note.content);
        setEditorTitle(note.title);
        setCharacterCount(note.content.length);
        setIsSaved(true);
        setTransformResult(null);
      }
    };

    loadNote();
  }, [selectedNoteID]);

  // Auto-save on content change (debounced)
  useEffect(() => {
    if (!selectedNoteID || !editorContent) return;

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        await updateNoteContent(selectedNoteID, editorTitle, editorContent);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
      } catch (error) {
        console.error("Error auto-saving note:", error);
      }
    }, 500); // 500ms debounce

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [editorContent, editorTitle, selectedNoteID]);

  // Handle content change
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setEditorContent(content);
    setCharacterCount(content.length);
  };

  // Handle title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditorTitle(e.target.value);
  };

  // Download note
  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([editorContent], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${editorTitle}-${
      new Date().toISOString().split("T")[0]
    }.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Clear current note
  const handleClear = () => {
    if (
      typeof window !== "undefined" &&
      window.confirm("Are you sure you want to clear this note?")
    ) {
      setEditorContent("");
      setCharacterCount(0);
    }
  };

  // Sidebar operations
  const handleCreateFolder = async (name: string) => {
    const newFolder = await createFolder(name);
    setFolders((prev) => [...prev, newFolder]);
  };

  const handleCreateNote = async (folderID: string) => {
    const newNote = await createNote(folderID);
    setNotes((prev) => [...prev, newNote]);
    setSelectedNoteID(newNote.id);
  };

  const handleRenameFolder = async (folderID: string, newName: string) => {
    await renameFolder(folderID, newName);
    setFolders((prev) =>
      prev.map((f) => (f.id === folderID ? { ...f, name: newName } : f))
    );
  };

  const handleRenameNote = async (noteID: string, newTitle: string) => {
    await renameNote(noteID, newTitle);
    setNotes((prev) =>
      prev.map((n) => (n.id === noteID ? { ...n, title: newTitle } : n))
    );
    if (selectedNoteID === noteID) {
      setEditorTitle(newTitle);
    }
  };

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

  const handleDeleteNote = async (noteID: string) => {
    await deleteNote(noteID);
    setNotes((prev) => prev.filter((n) => n.id !== noteID));

    if (selectedNoteID === noteID) {
      setSelectedNoteID(null);
    }
  };

  const handleToggleFolderOpen = async (folderID: string) => {
    await toggleFolderOpen(folderID);
    setFolders((prev) =>
      prev.map((f) => (f.id === folderID ? { ...f, isOpen: !f.isOpen } : f))
    );
  };

  // Transform operations
  const handleOpenTransformPanel = () => {
    setTransformSidebarOpen(true);
    setTransformError(null);
  };

  const handleOptionChange = (option: keyof typeof transformOptions) => {
    setTransformOptions((prev) => ({
      ...prev,
      [option]: !prev[option],
    }));
  };

  const handleConfirmTransform = async () => {
    setIsTransforming(true);
    setTransformError(null);
    setTransformResult(null);

    try {
      const response = await fetch("/api/transform", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notes: editorContent,
          options: transformOptions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to transform notes");
      }

      const result: TransformResult = await response.json();
      setTransformResult(result);

      if (transformOptions.highlightKeyTerms && result.highlights.length > 0) {
        await loadTermDefinitions(result.highlights);
      }
    } catch (error) {
      setTransformError(
        error instanceof Error
          ? error.message
          : "An error occurred during transformation"
      );
    } finally {
      setIsTransforming(false);
    }
  };

  const loadTermDefinitions = async (terms: string[]) => {
    setIsLoadingDefinitions(true);

    try {
      const definitionPromises = terms.map((term) =>
        fetch("/api/term-definition", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            term,
            context: editorContent,
          }),
        })
          .then((res) => res.json())
          .then((data) => ({
            term,
            definition: data.definition || "No definition available",
          }))
          .catch(() => ({
            term,
            definition: "Failed to load definition",
          }))
      );

      const definitions = await Promise.all(definitionPromises);
      const definitionsMap: Record<string, string> = {};
      definitions.forEach(({ term, definition }) => {
        definitionsMap[term] = definition;
      });

      setTermDefinitions(definitionsMap);
    } catch (error) {
      console.error("Error loading definitions:", error);
    } finally {
      setIsLoadingDefinitions(false);
    }
  };

  const handleTermClick = (term: string) => {
    setSelectedTerm(term);
  };

  if (isLoadingData) {
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

  const selectedNote = notes.find((n) => n.id === selectedNoteID);
  const selectedFolder = selectedNote
    ? folders.find((f) => f.id === selectedNote.folderID)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex">
      {/* Left Sidebar - File Navigation */}
      <Sidebar
        folders={folders}
        notes={notes}
        selectedNoteID={selectedNoteID}
        onSelectNote={setSelectedNoteID}
        onCreateFolder={handleCreateFolder}
        onCreateNote={handleCreateNote}
        onRenameFolder={handleRenameFolder}
        onRenameNote={handleRenameNote}
        onDeleteFolder={handleDeleteFolder}
        onDeleteNote={handleDeleteNote}
        onToggleFolderOpen={handleToggleFolderOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 shadow-sm">
          <div className="px-8 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {selectedFolder ? `${selectedFolder.name} / ` : ""}
                {editorTitle}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {selectedNote ? "Editing note" : "Select or create a note"}
              </p>
            </div>

            {transformResult && (
              <button
                onClick={() => setTransformSidebarOpen(!transformSidebarOpen)}
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
          {selectedNoteID ? (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full border border-slate-200">
              {/* Title Input */}
              <div className="px-8 py-4 border-b border-slate-200 bg-slate-50">
                <input
                  type="text"
                  value={editorTitle}
                  onChange={handleTitleChange}
                  placeholder="Note title..."
                  className="w-full text-lg font-semibold text-slate-900 bg-transparent border-none focus:outline-none placeholder-slate-400"
                />
              </div>

              <div className="flex-1 flex flex-col relative">
                {/* Content Editor */}
                <textarea
                  value={editorContent}
                  onChange={handleContentChange}
                  placeholder="Start typing... Include concepts, definitions, examples, anything you're learning!"
                  className="flex-1 w-full px-8 py-6 resize-none focus:outline-none text-slate-700 text-base leading-relaxed font-sans"
                />

                {/* Stats Bar */}
                <div className="bg-slate-50 border-t border-slate-200 px-8 py-3 flex gap-6 text-xs text-slate-500">
                  <p>
                    <span className="font-semibold text-slate-700">
                      {characterCount}
                    </span>{" "}
                    characters
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">
                      {
                        editorContent.split(/\s+/).filter((w) => w.length > 0)
                          .length
                      }
                    </span>{" "}
                    words
                  </p>
                </div>

                {/* Save Indicator */}
                {isSaved && (
                  <div className="bg-emerald-50 border-t border-emerald-200 text-emerald-700 px-8 py-2 text-xs animate-pulse">
                    ✓ Auto-saved
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="bg-white border-t border-slate-200 px-8 py-4 flex gap-3 justify-start flex-wrap">
                <button
                  onClick={handleDownload}
                  disabled={editorContent.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiDownload size={16} />
                  Download
                </button>

                <button
                  onClick={handleClear}
                  disabled={editorContent.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiTrash2 size={16} />
                  Clear
                </button>
              </div>

              {/* Transform Button */}
              <button
                onClick={handleOpenTransformPanel}
                disabled={editorContent.length === 0}
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

      {/* Right Sidebar - Transform Results */}
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col overflow-hidden border-l border-slate-200 ${
          transformSidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-6 py-5 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Transform Results</h2>
          <button
            onClick={() => setTransformSidebarOpen(false)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {transformError && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 m-4">
              <p className="font-semibold text-sm">Error</p>
              <p className="text-xs mt-1">{transformError}</p>
            </div>
          )}

          {/* Options Section */}
          <div className="px-6 py-6 space-y-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-4 text-sm">
              Transform Options
            </h3>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="autoFormat"
                checked={transformOptions.autoFormat}
                onChange={() => handleOptionChange("autoFormat")}
                className="w-4 h-4 text-teal-600 rounded cursor-pointer mt-1"
              />
              <label htmlFor="autoFormat" className="flex-1 cursor-pointer">
                <p className="font-semibold text-slate-800 text-sm">
                  Auto-Format
                </p>
                <p className="text-xs text-slate-600">
                  Organize with headers, bullets, and structure
                </p>
              </label>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="highlightKeyTerms"
                checked={transformOptions.highlightKeyTerms}
                onChange={() => handleOptionChange("highlightKeyTerms")}
                className="w-4 h-4 text-teal-600 rounded cursor-pointer mt-1"
              />
              <label
                htmlFor="highlightKeyTerms"
                className="flex-1 cursor-pointer"
              >
                <p className="font-semibold text-slate-800 text-sm">
                  Highlight Key Terms
                </p>
                <p className="text-xs text-slate-600">
                  Extract important concepts and vocabulary
                </p>
              </label>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="comments"
                checked={transformOptions.comments}
                onChange={() => handleOptionChange("comments")}
                className="w-4 h-4 text-teal-600 rounded cursor-pointer mt-1"
              />
              <label htmlFor="comments" className="flex-1 cursor-pointer">
                <p className="font-semibold text-slate-800 text-sm">
                  Comments/Insight
                </p>
                <p className="text-xs text-slate-600">
                  Get AI-generated explanations and learning tips
                </p>
              </label>
            </div>

            <button
              onClick={handleConfirmTransform}
              disabled={isTransforming}
              className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg text-sm"
            >
              {isTransforming ? (
                <>
                  <FiLoader size={16} className="animate-spin" />
                  <span>Transforming...</span>
                </>
              ) : (
                <span>Apply Transformation</span>
              )}
            </button>
          </div>

          {/* Results Section */}
          {transformResult && (
            <div className="px-6 py-6 space-y-6">
              <h3 className="font-semibold text-slate-800 text-sm">Results</h3>

              {transformResult.formattedNotes && (
                <div>
                  <h4 className="font-semibold mb-3 text-xs uppercase tracking-wide text-slate-600">
                    Formatted Notes
                  </h4>
                  <div className="bg-slate-50 p-4 rounded-lg text-xs text-slate-700 whitespace-pre-wrap max-h-96 overflow-y-auto border border-slate-200">
                    {transformOptions.highlightKeyTerms &&
                    transformResult.highlights.length > 0 ? (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: highlightKeyTerms(
                            transformResult.formattedNotes,
                            transformResult.highlights
                          ),
                        }}
                      />
                    ) : (
                      transformResult.formattedNotes
                    )}
                  </div>
                  <style>{`
                    mark {
                      background-color: #dcfce7;
                      color: #166534;
                      padding: 2px 4px;
                      border-radius: 2px;
                      font-weight: 500;
                    }
                  `}</style>
                </div>
              )}

              {transformResult.highlights.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 text-xs uppercase tracking-wide text-slate-600">
                    Key Terms
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {transformResult.highlights.map((term, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleTermClick(term)}
                        className="bg-teal-50 text-teal-700 px-3 py-1 rounded-md text-xs font-medium hover:bg-teal-100 cursor-pointer transition-colors duration-200 border border-teal-200"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {transformResult.comments.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 text-xs uppercase tracking-wide text-slate-600">
                    Insights & Tips
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-700">
                    {transformResult.comments.map((comment, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="text-teal-600 font-bold flex-shrink-0">
                          ✓
                        </span>
                        <span>{comment}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Transform Sidebar Overlay */}
      {transformSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setTransformSidebarOpen(false)}
        />
      )}

      {/* Term Definition Popup */}
      {selectedTerm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          onClick={() => setSelectedTerm(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start gap-3 mb-4">
              <h4 className="text-xl font-bold text-slate-900 break-words flex-1">
                {selectedTerm}
              </h4>
              <button
                onClick={() => setSelectedTerm(null)}
                className="text-slate-400 hover:text-slate-600 flex-shrink-0 p-1 hover:bg-slate-100 rounded transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>

            <p className="text-slate-700 text-sm leading-relaxed">
              {isLoadingDefinitions ? (
                <span className="text-slate-500">Loading...</span>
              ) : termDefinitions[selectedTerm] ? (
                termDefinitions[selectedTerm]
              ) : (
                <span className="text-slate-500">No definition available</span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoteEditor;
