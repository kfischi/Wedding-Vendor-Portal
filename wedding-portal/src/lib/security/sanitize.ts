/**
 * Security helpers — HTML sanitisation & escaping.
 *
 * NEVER insert raw user input into HTML strings.
 * Always pass strings through `escapeHtml` first.
 */

const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "`": "&#x60;",
};

/**
 * Escapes a plain-text string for safe inclusion inside HTML.
 * Converts &, <, >, ", ', ` to their HTML entity equivalents.
 */
export function escapeHtml(str: string): string {
  return str.replace(/[&<>"'`]/g, (ch) => HTML_ENTITIES[ch] ?? ch);
}

/**
 * Escapes a string and converts newlines to <br> tags.
 * Use this for multi-line user content inside HTML emails or templates.
 */
export function escapeHtmlMultiline(str: string): string {
  return escapeHtml(str).replace(/\n/g, "<br>");
}

/**
 * Strips all HTML tags from a string (for plain-text contexts).
 */
export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "");
}
