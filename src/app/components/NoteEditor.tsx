"use client";

import React, { useState, useEffect } from "react";
import {
  FiSave,
  FiTrash2,
  FiDownload,
  FiLoader,
  FiChevronRight,
  FiX,
} from "react-icons/fi";
import type { TransformResult } from "../api/transform/route";
import { highlightKeyTerms } from "../../lib/highlight";

const NoteEditor = () => {
  // State for notes, save status, and character count
  const [notes, setNotes] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Transform options state
  const [transformOptions, setTransformOptions] = useState({
    autoFormat: false,
    highlightKeyTerms: false,
    comments: false,
  });
  const [isTransforming, setIsTransforming] = useState(false);
  const [transformResult, setTransformResult] =
    useState<TransformResult | null>(null);
  const [transformError, setTransformError] = useState<string | null>(null);

  // Term definition hashmap: term → definition
  const [termDefinitions, setTermDefinitions] = useState<
    Record<string, string>
  >({});

  // Term definition popup state
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [isLoadingDefinitions, setIsLoadingDefinitions] = useState(false);

  // Load notes from localStorage on mount
  useEffect(() => {
    const savedNotes = localStorage.getItem("studentNotes");
    if (savedNotes) {
      setNotes(savedNotes);
      setCharacterCount(savedNotes.length);
      setIsSaved(true);
    }
  }, []);

  // Update character count and mark as unsaved
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setNotes(content);
    setCharacterCount(content.length);
    setIsSaved(false);
  };

  // Save notes to localStorage
  const handleSave = () => {
    localStorage.setItem("studentNotes", notes);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // Clear all notes
  const handleClear = () => {
    if (
      typeof window !== "undefined" &&
      window.confirm(
        "Are you sure you want to clear all notes? This cannot be undone."
      )
    ) {
      setNotes("");
      setCharacterCount(0);
      localStorage.removeItem("studentNotes");
      setIsSaved(false);
    }
  };

  // Download notes as text file
  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([notes], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `notes-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Handle transform options checkbox change
  const handleOptionChange = (option: keyof typeof transformOptions) => {
    setTransformOptions((prev) => ({
      ...prev,
      [option]: !prev[option],
    }));
  };

  // Handle opening sidebar (without transform)
  const handleOpenTransformPanel = () => {
    setSidebarOpen(true);
    setTransformError(null); // Clear previous errors when opening panel
  };

  // Handle actual transformation (called from confirm button in sidebar)
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
          notes,
          options: transformOptions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to transform notes");
      }

      const result: TransformResult = await response.json();
      setTransformResult(result);

      // Load all term definitions if highlights exist
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

  // Load all term definitions in parallel
  const loadTermDefinitions = async (terms: string[]) => {
    setIsLoadingDefinitions(true);

    try {
      // Fetch all definitions in parallel
      const definitionPromises = terms.map((term) =>
        fetch("/api/term-definition", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            term,
            context: notes, // Pass the notes as context for better definitions
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

      // Create hashmap: term → definition
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

  // Handle term click - just show definition from hashmap
  const handleTermClick = (term: string) => {
    setSelectedTerm(term);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex">
      {/* Left Sidebar - Navigation */}
      <aside className="w-64 bg-white border-r border-slate-200 shadow-sm flex flex-col max-lg:hidden">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-2xl font-bold text-black mb-1">📝 NoteGlow</h1>
          <p className="text-xs text-slate-500">Your notes, organized</p>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2">
          <button className="w-full text-left px-4 py-3 rounded-lg bg-emerald-50 text-emerald-700 font-medium text-sm hover:bg-emerald-100 transition-colors">
            📄 Current Note
          </button>

          <div className="pt-4 pb-2">
            <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Your Notes
            </p>
          </div>

          <button className="w-full text-left px-4 py-2 rounded-lg text-slate-700 text-sm hover:bg-slate-50 transition-colors">
            Biology Notes
          </button>
          <button className="w-full text-left px-4 py-2 rounded-lg text-slate-700 text-sm hover:bg-slate-50 transition-colors">
            History Review
          </button>
          <button className="w-full text-left px-4 py-2 rounded-lg text-slate-700 text-sm hover:bg-slate-50 transition-colors">
            Math Formulas
          </button>

          <div className="pt-4 pb-2">
            <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Folders
            </p>
          </div>

          <button className="w-full text-left px-4 py-2 rounded-lg text-slate-700 text-sm hover:bg-slate-50 transition-colors">
            📁 Study Materials
          </button>
          <button className="w-full text-left px-4 py-2 rounded-lg text-slate-700 text-sm hover:bg-slate-50 transition-colors">
            📁 Exams
          </button>
          <button className="w-full text-left px-4 py-2 rounded-lg text-slate-700 text-sm hover:bg-slate-50 transition-colors">
            📁 Research
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200">
          <button className="w-full px-4 py-2 text-sm font-medium text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors">
            + New Note
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 shadow-sm">
          <div className="px-8 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Your Notes</h2>
              <p className="text-sm text-slate-500 mt-1">
                Write freely, organize with AI
              </p>
            </div>
            {/* Sidebar toggle button */}
            {transformResult && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden lg:flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors duration-200"
              >
                <span>Results</span>
                <FiChevronRight
                  size={18}
                  className={`transition-transform ${
                    sidebarOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-8 py-6 relative">
          {/* Notes Editor */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full border border-slate-200">
            <div className="flex-1 flex flex-col relative">
              <textarea
                value={notes}
                onChange={handleNotesChange}
                placeholder="Start typing your notes here... Include concepts, definitions, examples, anything you're learning!"
                className="flex-1 w-full px-8 py-6 resize-none focus:outline-none text-slate-700 text-base leading-relaxed font-sans"
              />

              {/* Stats Bar - Minimal */}
              <div className="bg-slate-50 border-t border-slate-200 px-8 py-3 flex gap-6 text-xs text-slate-500">
                <p>
                  <span className="font-semibold text-slate-700">
                    {characterCount}
                  </span>{" "}
                  characters
                </p>
                <p>
                  <span className="font-semibold text-slate-700">
                    {notes.split(/\s+/).filter((w) => w.length > 0).length}
                  </span>{" "}
                  words
                </p>
              </div>

              {/* Save Indicator */}
              {isSaved && (
                <div className="bg-black border-t border-emerald-200 text-emerald-700 px-8 py-2 text-xs animate-pulse">
                  ✓ Saved
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="bg-white border-t border-slate-200 px-8 py-4 flex gap-3 justify-start flex-wrap">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors duration-200"
              >
                <FiSave size={16} />
                Save
              </button>

              <button
                onClick={handleDownload}
                disabled={notes.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiDownload size={16} />
                Download
              </button>

              <button
                onClick={handleClear}
                disabled={notes.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiTrash2 size={16} />
                Clear
              </button>
            </div>

            {/* Fixed Transform Button */}
            <button
              onClick={handleOpenTransformPanel}
              disabled={notes.length === 0}
              className="absolute bottom-9 right-6 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-full font-semibold shadow-lg transition-all duration-200 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
            >
              <span>Transform</span>
            </button>
          </div>
        </main>
      </div>

      {/* Right Sidebar - Transform Options & Results */}
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col overflow-hidden border-l border-slate-200 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-6 py-5 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Transform Results</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Error Message */}
          {transformError && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 m-4">
              <p className="font-semibold text-sm">Error</p>
              <p className="text-xs mt-1">{transformError}</p>
            </div>
          )}

          {/* Transform Options Section */}
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

            {/* Confirm Transform Button */}
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
                <>
                  <span>Apply Transformation</span>
                </>
              )}
            </button>
          </div>

          {/* Transform Results Section */}
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

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Term Definition Minimal Popup */}
      {selectedTerm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          onClick={() => setSelectedTerm(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in duration-200 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Term Title */}
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

            {/* Definition */}
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
