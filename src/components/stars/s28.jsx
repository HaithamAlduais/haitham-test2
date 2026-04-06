/**
 * Neobrutalism catalog id s28 (Star 28) — fourteen-point star (28 path vertices).
 * SVG path is original; upstream registry payload was empty.
 */
export default function Star28({
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
        d="M100 8 L110.68 53.2 L139.92 17.11 L129.93 62.47 L171.93 42.64 L143.25 79.17 L189.69 79.53 L148 100 L189.69 120.47 L143.25 120.83 L171.93 157.36 L129.93 137.53 L139.92 182.89 L110.68 146.8 L100 192 L89.32 146.8 L60.08 182.89 L70.07 137.53 L28.07 157.36 L56.75 120.83 L10.31 120.47 L52 100 L10.31 79.53 L56.75 79.17 L28.07 42.64 L70.07 62.47 L60.08 17.11 L89.32 53.2 Z"
      />
    </svg>
  );
}
