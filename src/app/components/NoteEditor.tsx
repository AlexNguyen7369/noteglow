"use client";

import React, { useState, useEffect } from "react";
import { FiSave, FiTrash2, FiDownload, FiLoader } from "react-icons/fi";
import type { TransformResult } from "../api/transform/route";

const NoteEditor = () => {
  // State for notes, save status, and character count
  const [notes, setNotes] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);

  // Transform options state
  const [transformOptions, setTransformOptions] = useState({
    autoFormat: false,
    highlightKeyTerms: false,
    comments: false,
    studyGuidePdf: false,
  });
  const [isTransforming, setIsTransforming] = useState(false);
  const [transformResult, setTransformResult] = useState<TransformResult | null>(null);
  const [transformError, setTransformError] = useState<string | null>(null);

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
  const handleOptionChange = (
    option: keyof typeof transformOptions
  ) => {
    setTransformOptions((prev) => ({
      ...prev,
      [option]: !prev[option],
    }));
  };

  // Handle transform action
  const handleTransform = async () => {
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
        throw new Error(
          errorData.error || "Failed to transform notes"
        );
      }

      const result: TransformResult = await response.json();
      setTransformResult(result);
    } catch (error) {
      setTransformError(
        error instanceof Error ? error.message : "An error occurred during transformation"
      );
    } finally {
      setIsTransforming(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">📝 NoteGlow</h1>
          <p className="text-gray-600">
            Write your notes freely. We'll organize them for you.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Pane - Editor */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
            <div className="bg-blue-600 text-white px-6 py-4">
              <h2 className="text-xl font-semibold">Your Notes</h2>
            </div>

            <div className="flex-1 flex flex-col">
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

            {/* Save Indicator */}
            {isSaved && (
              <div className="bg-green-100 border-l-4 border-green-500 text-green-700 px-6 py-3 text-sm animate-pulse">
                ✓ Notes saved to your browser
              </div>
            )}
          </div>

          {/* Right Pane - Transform Options */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
            <div className="bg-purple-600 text-white px-6 py-4">
              <h2 className="text-xl font-semibold">🚀 Transform Options</h2>
              <p className="text-purple-100 text-sm mt-1">
                Select what you'd like us to do with your notes
              </p>
            </div>

            {/* Error Message */}
            {transformError && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 m-4">
                <p className="font-semibold">Transformation Error</p>
                <p className="text-sm mt-1">{transformError}</p>
              </div>
            )}

            {/* Transform Options */}
            <div className="flex-1 px-6 py-6 space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="autoFormat"
                  checked={transformOptions.autoFormat}
                  onChange={() => handleOptionChange("autoFormat")}
                  className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                />
                <label
                  htmlFor="autoFormat"
                  className="flex-1 cursor-pointer"
                >
                  <p className="font-semibold text-gray-800">
                    Auto-Format
                  </p>
                  <p className="text-sm text-gray-600">
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
                  <p className="font-semibold text-gray-800">
                    Highlight Key Terms
                  </p>
                  <p className="text-sm text-gray-600">
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
                <label
                  htmlFor="comments"
                  className="flex-1 cursor-pointer"
                >
                  <p className="font-semibold text-gray-800">
                    Comments/Insight
                  </p>
                  <p className="text-sm text-gray-600">
                    Get AI-generated explanations and learning tips
                  </p>
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="studyGuidePdf"
                  checked={transformOptions.studyGuidePdf}
                  onChange={() => handleOptionChange("studyGuidePdf")}
                  className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                />
                <label
                  htmlFor="studyGuidePdf"
                  className="flex-1 cursor-pointer"
                >
                  <p className="font-semibold text-gray-800">
                    StudyGuide PDF Creation
                  </p>
                  <p className="text-sm text-gray-600">
                    Generate a structured study guide from your notes
                  </p>
                </label>
              </div>
            </div>

            {/* Transform Result Display */}
            {transformResult && (
              <div className="border-t px-6 py-4 space-y-4 max-h-96 overflow-y-auto">
                {transformResult.formattedNotes && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">
                      Formatted Notes
                    </h4>
                    <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {transformResult.formattedNotes}
                    </div>
                  </div>
                )}

                {transformResult.highlights.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">
                      Key Terms
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {transformResult.highlights.map((term, idx) => (
                        <span
                          key={idx}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                        >
                          {term}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {transformResult.comments.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">
                      Insights & Tips
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      {transformResult.comments.map((comment, idx) => (
                        <li
                          key={idx}
                          className="flex gap-2"
                        >
                          <span className="text-blue-500 font-bold">•</span>
                          <span>{comment}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {transformResult.pdfContent && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">
                      Study Guide Preview
                    </h4>
                    <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {transformResult.pdfContent}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Button */}
            <div className="bg-gray-100 border-t px-6 py-4">
              <button
                onClick={handleTransform}
                disabled={notes.length === 0 || isTransforming}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTransforming ? (
                  <>
                    <FiLoader size={18} className="animate-spin" />
                    Transforming...
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    Transform My Notes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NoteEditor;
