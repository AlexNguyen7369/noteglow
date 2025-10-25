'use client';

import React, { useState, useEffect } from 'react';
import { FiSave, FiTrash2, FiDownload } from 'react-icons/fi';

const NoteEditor = () => {
  const [notes, setNotes] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);

  // Load notes from localStorage on mount
  useEffect(() => {
    const savedNotes = localStorage.getItem('studentNotes');
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
    localStorage.setItem('studentNotes', notes);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // Clear all notes
  const handleClear = () => {
    if (typeof window !== 'undefined' && window.confirm('Are you sure you want to clear all notes? This cannot be undone.')) {
      setNotes('');
      setCharacterCount(0);
      localStorage.removeItem('studentNotes');
      setIsSaved(false);
    }
  };

  // Download notes as text file
  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([notes], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `notes-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">📝 NoteGlow</h1>
          <p className="text-gray-600">Write your notes freely. We'll organize them for you.</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Left Pane - Editor */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
            <div className="bg-blue-600 text-white px-6 py-4">
              <h2 className="text-xl font-semibold">Your Raw Notes</h2>
              <p className="text-blue-100 text-sm mt-1">Write freely, no formatting needed</p>
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
                <p>Characters: <span className="font-semibold text-gray-800">{characterCount}</span></p>
                <p className="mt-1">Words: <span className="font-semibold text-gray-800">{notes.split(/\s+/).filter(w => w.length > 0).length}</span></p>
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

          {/* Right Pane - Placeholder */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden flex items-center justify-center min-h-96">
            <div className="text-center px-6">
              <div className="text-6xl mb-4">✨</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Transform Your Notes</h3>
              <p className="text-gray-600 mb-4">
                Once you're ready, click the transform button below to:
              </p>
              <ul className="text-left inline-block text-gray-700 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-green-500 font-bold">✓</span> Auto-format and structure
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500 font-bold">✓</span> Highlight key terms
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500 font-bold">✓</span> Generate AI insights
                </li>
              </ul>
              <button
                disabled={notes.length === 0}
                className="mt-6 px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🚀 Transform My Notes
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NoteEditor;
