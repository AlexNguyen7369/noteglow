import { useState } from "react";

export const useTermDefinitions = () => {
  // Term definitions hashmap: term → definition
  const [termDefinitions, setTermDefinitions] = useState<
    Record<string, string>
  >({});

  // Term popup state
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [isLoadingDefinitions, setIsLoadingDefinitions] = useState(false);

  // Handle term click to show definition
  const handleTermClick = (term: string) => {
    setSelectedTerm(term);
  };

  // Load all term definitions in parallel from API
  const loadTermDefinitions = async (
    terms: string[],
    context: string
  ): Promise<void> => {
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
            context, // Pass editor content as context for better definitions
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

      // Create hashmap: term → definition for O(1) lookup on click
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

  return {
    termDefinitions,
    setTermDefinitions,
    selectedTerm,
    setSelectedTerm,
    isLoadingDefinitions,
    setIsLoadingDefinitions,
    handleTermClick,
    loadTermDefinitions,
  };
};
