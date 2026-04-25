import DOMPurify from "isomorphic-dompurify";

/**
 * Strip ALL HTML/script tags from user-supplied text before saving or
 * displaying. Use on every free-text input that will be persisted or
 * shown back to other users (titles, descriptions, messages, bios).
 */
export function sanitizeText(input: string): string {
  if (typeof input !== "string") return "";
  // Strip every tag, every attribute. Plain text only.
  const cleaned = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
  return cleaned.trim();
}

/**
 * Sanitize and enforce a max length. Returns trimmed plain text.
 */
export function sanitizeTextMax(input: string, max: number): string {
  return sanitizeText(input).slice(0, max);
}
