/**
 * Escape special regex characters in user-provided search strings.
 */
export const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
