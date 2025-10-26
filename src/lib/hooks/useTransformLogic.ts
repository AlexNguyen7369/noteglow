import { useState } from "react";
import type { TransformResult } from "@/app/api/transform/route";

export const useTransformLogic = () => {
  // Transform options state
  const [transformOptions, setTransformOptions] = useState({
    autoFormat: false,
    highlightKeyTerms: false,
    comments: false,
  });

  // Transform result states
  const [isTransforming, setIsTransforming] = useState(false);
  const [transformResult, setTransformResult] =
    useState<TransformResult | null>(null);
  const [transformError, setTransformError] = useState<string | null>(null);

  // Handle transform option toggle (checkbox)
  const handleOptionChange = (option: keyof typeof transformOptions) => {
    setTransformOptions((prev) => ({
      ...prev,
      [option]: !prev[option],
    }));
  };

  // Execute transformation API call
  const handleConfirmTransform = async (
    editorContent: string,
    onDefinitionsLoad?: (terms: string[]) => Promise<void>
  ) => {
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

      // Load term definitions if highlights exist and callback provided
      if (
        transformOptions.highlightKeyTerms &&
        result.highlights.length > 0 &&
        onDefinitionsLoad
      ) {
        await onDefinitionsLoad(result.highlights);
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

  return {
    transformOptions,
    setTransformOptions,
    isTransforming,
    transformResult,
    setTransformResult,
    transformError,
    setTransformError,
    handleOptionChange,
    handleConfirmTransform,
  };
};
