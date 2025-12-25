/**
 * File utility functions for macOS Finder-like behavior
 */

/**
 * Truncate filename in the middle like macOS Finder does.
 * Preserves the beginning and extension/end of the filename.
 *
 * Examples:
 * - "Screen Recording 2025-01-15 at 3.26.12 PM.mov" → "Screen Recording...3.26.12 PM.mov"
 * - "dbeaver-ce-25.3.1-macos-aarch64.dmg" → "dbeaver-ce-25.3...aarch64.dmg"
 * - "1Password Emergency Kit.pdf" → "1Password Emergency Kit.pdf" (no truncation if fits)
 *
 * @param filename - The full filename to truncate
 * @param maxLength - Maximum total characters (default: 25 for grid view)
 * @returns Truncated filename with middle ellipsis
 */
export function truncateMiddle(filename: string, maxLength = 25): string {
  if (filename.length <= maxLength) {
    return filename;
  }

  // Find the extension (last dot followed by alphanumeric chars)
  const lastDotIndex = filename.lastIndexOf('.');
  const hasExtension = lastDotIndex > 0 && lastDotIndex < filename.length - 1;

  let name: string;
  let extension: string;

  if (hasExtension) {
    name = filename.substring(0, lastDotIndex);
    extension = filename.substring(lastDotIndex); // includes the dot
  } else {
    name = filename;
    extension = '';
  }

  // Reserve space for extension and ellipsis
  const ellipsis = '...';
  const reserveForEnd = Math.min(
    extension.length + 6,
    Math.floor(maxLength * 0.4),
  );
  const reserveForStart = maxLength - reserveForEnd - ellipsis.length;

  if (reserveForStart < 4) {
    // Filename too short for meaningful middle truncation
    return filename.substring(0, maxLength - 3) + ellipsis;
  }

  // Get start and end portions
  const start = name.substring(0, reserveForStart);

  // For the end, include some of the name before extension
  const endNamePortion = Math.max(0, reserveForEnd - extension.length);
  const endOfName =
    endNamePortion > 0 ? name.substring(name.length - endNamePortion) : '';

  return `${start.trimEnd()}${ellipsis}${endOfName}${extension}`;
}

/**
 * Format filename for display in grid view (2 lines max)
 * Uses middle truncation for long names
 *
 * @param filename - The full filename
 * @param charsPerLine - Approximate characters per line (default: 14)
 * @returns Formatted filename for 2-line display
 */
export function formatFilenameForGrid(
  filename: string,
  charsPerLine = 14,
): string {
  const maxChars = charsPerLine * 2; // 2 lines
  return truncateMiddle(filename, maxChars);
}

/**
 * Check if a filename needs truncation for grid view
 */
export function needsTruncation(filename: string, maxLength = 25): boolean {
  return filename.length > maxLength;
}
