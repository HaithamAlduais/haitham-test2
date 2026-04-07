/**
 * Generate a URL-safe slug from a title string.
 * Appends a short random suffix to ensure uniqueness.
 */
function slugify(text) {
  const base = text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]+/g, "") // keep Arabic characters
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");

  const suffix = Math.random().toString(36).substring(2, 7);
  return `${base}-${suffix}`;
}

module.exports = { slugify };
