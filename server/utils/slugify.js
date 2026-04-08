/**
 * Generate a URL-safe slug from a title string.
 * Transliterates Arabic to Latin, then creates a clean slug.
 * Appends a short random suffix to ensure uniqueness.
 */

// Simple Arabic to Latin transliteration map
const AR_MAP = {
  'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'a', 'ب': 'b', 'ت': 't', 'ث': 'th',
  'ج': 'j', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z',
  'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a',
  'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
  'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a', 'ة': 'h', 'ء': '', 'ئ': 'y',
  'ؤ': 'w', 'لا': 'la', 'ّ': '', 'َ': '', 'ُ': '', 'ِ': '', 'ً': '', 'ٌ': '', 'ٍ': '',
};

function transliterate(text) {
  let result = '';
  for (const char of text) {
    result += AR_MAP[char] !== undefined ? AR_MAP[char] : char;
  }
  return result;
}

function slugify(text) {
  const transliterated = transliterate(text.toString());
  const base = transliterated
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]+/g, "") // only keep latin, numbers, hyphens
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");

  const suffix = Math.random().toString(36).substring(2, 7);
  return base ? `${base}-${suffix}` : suffix;
}

module.exports = { slugify };
