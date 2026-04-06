/**
 * Neobrutalism catalog id s20 (Star 20) — ten-point star (20 path vertices).
 * SVG path is original; upstream registry payload was empty.
 */
export default function Star20({
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
        d="M100 8 L112.98 60.06 L154.08 25.57 L133.98 75.31 L187.5 71.57 L142 100 L187.5 128.43 L133.98 124.69 L154.08 174.43 L112.98 139.94 L100 192 L87.02 139.94 L45.92 174.43 L66.02 124.69 L12.5 128.43 L58 100 L12.5 71.57 L66.02 75.31 L45.92 25.57 L87.02 60.06 Z"
      />
    </svg>
  );
}
