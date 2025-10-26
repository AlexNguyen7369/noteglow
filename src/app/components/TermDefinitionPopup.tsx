"use client";

import React from "react";
import { FiX } from "react-icons/fi";

interface TermDefinitionPopupProps {
  selectedTerm: string | null;
  setSelectedTerm: (term: string | null) => void;
  termDefinitions: Record<string, string>;
  isLoadingDefinitions: boolean;
}

export const TermDefinitionPopup: React.FC<TermDefinitionPopupProps> = ({
  selectedTerm,
  setSelectedTerm,
  termDefinitions,
  isLoadingDefinitions,
}) => {
  if (!selectedTerm) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      onClick={() => setSelectedTerm(null)}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
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

        {/* Definition Content */}
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
  );
};
