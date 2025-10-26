/**
 * Highlights key terms in HTML content by wrapping them in <mark> tags
 * @param htmlContent - The HTML string containing the notes
 * @param keyTerms - Array of key terms to highlight
 * @returns HTML string with key terms wrapped in <mark> tags
 */
export function highlightKeyTerms(
  htmlContent: string,
  keyTerms: string[]
): string {
  if (!keyTerms || keyTerms.length === 0) {
    return htmlContent;
  }

  let result = htmlContent;

  // Sort terms by length (longest first) to avoid partial matches
  // e.g., "photosynthesis" should be highlighted before "synthesis"
  const sortedTerms = [...keyTerms].sort((a, b) => b.length - a.length);

  for (const term of sortedTerms) {
    if (!term || term.trim().length === 0) {
      continue;
    }

    // Create a case-insensitive regex that matches whole words
    // Use word boundaries to avoid partial word matches
    const regex = new RegExp(
      `\\b${escapeRegex(term)}\\b`,
      'gi'
    );

    // Replace all occurrences with <mark> tags
    // Avoid replacing terms already inside HTML tags
    result = result.replace(regex, (match) => {
      // Check if match is inside an HTML tag
      const beforeMatch = result.substring(0, result.indexOf(match));
      const lastOpenBracket = beforeMatch.lastIndexOf('<');
      const lastCloseBracket = beforeMatch.lastIndexOf('>');

      // If there's an open bracket after the last close bracket, we're inside a tag
      if (lastOpenBracket > lastCloseBracket) {
        return match;
      }

      return `<mark>${match}</mark>`;
    });
  }

  return result;
}

/**
 * Escapes special regex characters in a string
 * @param str - String to escape
 * @returns Escaped string safe for regex
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Removes all <mark> tags from HTML content
 * Useful for clearing previous highlights
 * @param htmlContent - The HTML string with <mark> tags
 * @returns HTML string with <mark> tags removed
 */
export function removeHighlights(htmlContent: string): string {
  return htmlContent.replace(/<mark>([^<]*)<\/mark>/g, '$1');
}
