"use client";

import React from "react";
import { FiLoader, FiX } from "react-icons/fi";
import { highlightKeyTerms } from "@/lib/highlight";
import type { TransformResult } from "../api/transform/route";

interface TransformSidebarProps {
  // Transform logic
  transformOptions: Record<string, boolean>;
  handleOptionChange: (option: string) => void;
  isTransforming: boolean;
  transformResult: TransformResult | null;
  transformError: string | null;
  handleConfirmTransform: (
    editorContent: string,
    onDefinitionsLoad?: (terms: string[]) => Promise<void>
  ) => Promise<void>;

  // Term definitions
  handleTermClick: (term: string) => void;
  loadTermDefinitions: (terms: string[], context: string) => Promise<void>;

  // Editor content
  editorContent: string;

  // UI state
  isOpen: boolean;
  onClose: () => void;
}

export const TransformSidebar: React.FC<TransformSidebarProps> = ({
  transformOptions,
  handleOptionChange,
  isTransforming,
  transformResult,
  transformError,
  handleConfirmTransform,
  handleTermClick,
  loadTermDefinitions,
  editorContent,
  isOpen,
  onClose,
}) => {
  const handleApplyTransform = async () => {
    await handleConfirmTransform(editorContent, loadTermDefinitions);
  };

  return (
    <div
      className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col overflow-hidden border-l border-slate-200 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-6 py-5 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Transform Results</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded transition-colors"
        >
          <FiX size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Error Message */}
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

          {/* Auto-Format Option */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="autoFormat"
              checked={transformOptions.autoFormat || false}
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

          {/* Highlight Key Terms Option */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="highlightKeyTerms"
              checked={transformOptions.highlightKeyTerms || false}
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

          {/* Comments/Insight Option */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="comments"
              checked={transformOptions.comments || false}
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

          {/* Apply Transformation Button */}
          <button
            onClick={handleApplyTransform}
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

        {/* Transform Results Section */}
        {transformResult && (
          <div className="px-6 py-6 space-y-6">
            <h3 className="font-semibold text-slate-800 text-sm">Results</h3>

            {/* Formatted Notes */}
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

            {/* Key Terms */}
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

            {/* Insights & Tips */}
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
  );
};
