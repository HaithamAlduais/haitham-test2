/**
 * Neobrutalism catalog id s32 (Star 32) — sixteen-point star (32 path vertices).
 * SVG path is original; upstream registry payload was empty.
 */
export default function Star32({
  color,
  size,
  stroke,
  strokeWidth,
  pathClassName,
  width,
  height,
  className,
  ...props
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 200 200"
      width={size ?? width}
      height={size ?? height}
      className={className}
      {...props}
    >
      <path
        fill={color ?? "currentColor"}
        stroke={stroke}
        strokeWidth={strokeWidth}
        className={pathClassName}
        d="M100 8 L109.75 50.96 L135.21 15 L127.78 58.43 L165.05 34.95 L141.57 72.22 L185 64.79 L149.04 90.25 L192 100 L149.04 109.75 L185 135.21 L141.57 127.78 L165.05 165.05 L127.78 141.57 L135.21 185 L109.75 149.04 L100 192 L90.25 149.04 L64.79 185 L72.22 141.57 L34.95 165.05 L58.43 127.78 L15 135.21 L50.96 109.75 L8 100 L50.96 90.25 L15 64.79 L58.43 72.22 L34.95 34.95 L72.22 58.43 L64.79 15 L90.25 50.96 Z"
      />
    </svg>
  );
}
