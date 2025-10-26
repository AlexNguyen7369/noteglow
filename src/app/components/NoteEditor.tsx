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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              📝 NoteGlow
            </h1>
            <p className="text-gray-600">
              Write your notes freely. We'll organize them for you.
            </p>
          </div>
          {/* Sidebar toggle button */}
          {transformResult && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors duration-200"
            >
              <span>Transform Results</span>
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
      <main className="max-w-7xl mx-auto px-6 py-8 relative">
        {/* Notes Editor - Full Width */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-[calc(100vh-250px)] relative">
          <div className="bg-blue-600 text-white px-6 py-4">
            <h2 className="text-xl font-semibold">Your Raw Notes</h2>
            <p className="text-blue-100 text-sm mt-1">
              Write freely, no formatting needed
            </p>
          </div>

          <div className="flex-1 flex flex-col relative">
            <textarea
              value={notes}
              onChange={handleNotesChange}
              placeholder="Start typing your notes here... Include concepts, definitions, examples, anything you're learning!"
              className="flex-1 w-full p-6 resize-none focus:outline-none text-gray-700 text-base leading-relaxed"
            />

            {/* Stats Bar */}
            <div className="bg-gray-50 border-t px-6 py-3 text-sm text-gray-600">
              <p>
                Characters:{" "}
                <span className="font-semibold text-gray-800">
                  {characterCount}
                </span>
              </p>
              <p className="mt-1">
                Words:{" "}
                <span className="font-semibold text-gray-800">
                  {notes.split(/\s+/).filter((w) => w.length > 0).length}
                </span>
              </p>
            </div>

            {/* Save Indicator */}
            {isSaved && (
              <div className="bg-green-100 border-l-4 border-green-500 text-green-700 px-6 py-3 text-sm animate-pulse">
                ✓ Notes saved to your browser
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="bg-gray-100 border-t px-6 py-4 flex gap-3 justify-between flex-wrap">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors duration-200"
            >
              <FiSave size={18} />
              Save
            </button>

            <button
              onClick={handleDownload}
              disabled={notes.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiDownload size={18} />
              Download
            </button>

            <button
              onClick={handleClear}
              disabled={notes.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiTrash2 size={18} />
              Clear
            </button>
          </div>

          {/* Fixed Transform Button */}
          <button
            onClick={handleOpenTransformPanel}
            disabled={notes.length === 0}
            className="absolute top-6 right-6 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-full font-semibold shadow-lg transition-all duration-200 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
          >
            <span>Transform</span>
          </button>
        </div>
      </main>

      {/* Right Sidebar - Transform Options & Results */}
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col overflow-hidden ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="bg-purple-600 text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">🚀 Transform Panel</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 hover:bg-purple-700 rounded transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Error Message */}
          {transformError && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 m-4">
              <p className="font-semibold">Transformation Error</p>
              <p className="text-sm mt-1">{transformError}</p>
            </div>
          )}

          {/* Transform Options Section */}
          <div className="px-6 py-6 space-y-4 border-b">
            <h3 className="font-semibold text-gray-800 mb-4">
              Transform Options
            </h3>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="autoFormat"
                checked={transformOptions.autoFormat}
                onChange={() => handleOptionChange("autoFormat")}
                className="w-5 h-5 text-blue-600 rounded cursor-pointer"
              />
              <label htmlFor="autoFormat" className="flex-1 cursor-pointer">
                <p className="font-semibold text-gray-800 text-sm">
                  Auto-Format
                </p>
                <p className="text-xs text-gray-600">
                  Organize with headers, bullets, and structure
                </p>
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="highlightKeyTerms"
                checked={transformOptions.highlightKeyTerms}
                onChange={() => handleOptionChange("highlightKeyTerms")}
                className="w-5 h-5 text-blue-600 rounded cursor-pointer"
              />
              <label
                htmlFor="highlightKeyTerms"
                className="flex-1 cursor-pointer"
              >
                <p className="font-semibold text-gray-800 text-sm">
                  Highlight Key Terms
                </p>
                <p className="text-xs text-gray-600">
                  Extract important concepts and vocabulary
                </p>
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="comments"
                checked={transformOptions.comments}
                onChange={() => handleOptionChange("comments")}
                className="w-5 h-5 text-blue-600 rounded cursor-pointer"
              />
              <label htmlFor="comments" className="flex-1 cursor-pointer">
                <p className="font-semibold text-gray-800 text-sm">
                  Comments/Insight
                </p>
                <p className="text-xs text-gray-600">
                  Get AI-generated explanations and learning tips
                </p>
              </label>
            </div>

            {/* Confirm Transform Button */}
            <button
              onClick={handleConfirmTransform}
              disabled={isTransforming}
              className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
            >
              {isTransforming ? (
                <>
                  <FiLoader size={18} className="animate-spin" />
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
              <h3 className="font-semibold text-gray-800">
                Transformation Results
              </h3>

              {transformResult.formattedNotes && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm">
                    Formatted Notes
                  </h4>
                  <div className="bg-gray-50 p-3 rounded text-xs text-gray-700 whitespace-pre-wrap max-h-96 overflow-y-auto">
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
                      background-color: #fef3c7;
                      color: #b45309;
                      padding: 2px 4px;
                      border-radius: 2px;
                      font-weight: 500;
                    }
                  `}</style>
                </div>
              )}

              {transformResult.highlights.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm">
                    Key Terms{" "}
                    <span className="text-gray-500 font-normal text-xs">
                      (Click to see definition)
                    </span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {transformResult.highlights.map((term, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleTermClick(term)}
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium hover:bg-blue-200 cursor-pointer transition-colors duration-200"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {transformResult.comments.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm">
                    Insights & Tips
                  </h4>
                  <ul className="space-y-2 text-xs text-gray-700">
                    {transformResult.comments.map((comment, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="text-blue-500 font-bold flex-shrink-0">
                          •
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedTerm(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-sm w-full p-4 animate-in fade-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Term Title */}
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-lg font-bold text-gray-800 break-words flex-1">
                {selectedTerm}
              </h4>
              <button
                onClick={() => setSelectedTerm(null)}
                className="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Definition */}
            <p className="text-gray-700 text-sm leading-relaxed">
              {isLoadingDefinitions ? (
                <span className="text-gray-500">Loading...</span>
              ) : termDefinitions[selectedTerm] ? (
                termDefinitions[selectedTerm]
              ) : (
                <span className="text-gray-500">No definition available</span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoteEditor;
