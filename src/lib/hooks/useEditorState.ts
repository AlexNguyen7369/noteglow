import { useState, useEffect, useRef } from "react";
import { getNoteById, updateNoteContent } from "@/lib/notesStore";

export const useEditorState = (selectedNoteID: string | null) => {
  // Editor content state
  const [editorContent, setEditorContent] = useState("");
  const [editorTitle, setEditorTitle] = useState("Untitled");
  const [characterCount, setCharacterCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);

  // Auto-save timeout reference for cleanup
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load note when selected note changes
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
      }
    };

    loadNote();
  }, [selectedNoteID]);

  // Auto-save on content change (debounced 500ms)
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
        setTimeout(() => setIsSaved(false), 2000); // Show indicator for 2 seconds
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
  const handleContentChange = (content: string) => {
    setEditorContent(content);
    setCharacterCount(content.length);
  };

  // Handle title change
  const handleTitleChange = (title: string) => {
    setEditorTitle(title);
  };

  // Download note as text file
  const handleDownload = (title: string, content: string) => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${title}-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Clear editor content
  const handleClear = () => {
    if (
      typeof window !== "undefined" &&
      window.confirm("Are you sure you want to clear this note?")
    ) {
      setEditorContent("");
      setCharacterCount(0);
    }
  };

  // Calculate word count
  const wordCount = editorContent
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  return {
    editorContent,
    setEditorContent,
    editorTitle,
    setEditorTitle,
    characterCount,
    isSaved,
    setIsSaved,
    wordCount,
    handleContentChange,
    handleTitleChange,
    handleDownload,
    handleClear,
  };
};
