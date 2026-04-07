/**
 * Ramsha Logo Component
 *
 * Renders the Ramsha "ر" calligraphy logo.
 * Supports black (light mode) and white (dark mode) variants.
 *
 * Place your logo files at:
 * - public/ramsha-logo-black.jpg (for light backgrounds)
 * - public/ramsha-logo-white.png (for dark backgrounds)
 */

export default function RamshaLogo({ variant = "auto", size = 32, className = "" }) {
  // Auto-detect: use CSS filter to invert for dark mode
  return (
    <img
      src="/ramsha-logo-black.jpg"
      alt="Ramsha"
      width={size}
      height={size}
      className={`object-contain ${variant === "white" ? "invert" : variant === "auto" ? "dark:invert" : ""} ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
