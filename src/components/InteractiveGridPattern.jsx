import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * @typedef {"viewport" | "section"} InteractiveGridLayout
 */

/**
 * @param {object} props
 * @param {string} [props.className]
 * @param {import("react").ReactNode} [props.children]
 * @param {number} [props.cellSize]
 * @param {string} [props.glowColor]
 * @param {string} [props.borderColor]
 * @param {number} [props.proximity]
 * @param {InteractiveGridLayout} [props.layout]
 * @param {boolean} [props.showVignette]
 * @param {boolean} [props.showAmbientGlow]
 */
export function InteractiveGridPattern({
  className,
  children,
  cellSize = 38,
  glowColor = "rgba(34, 211, 238, 0.35)",
  borderColor = "rgba(0, 0, 0, 0.06)",
  proximity = 100,
  layout = "viewport",
  showVignette,
  showAmbientGlow,
}) {
  const containerRef = useRef(null);
  const [grid, setGrid] = useState({ rows: 0, cols: 0, scale: 1 });
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });

  const isSection = layout === "section";
  const vignetteOn = showVignette ?? !isSection;
  const ambientOn = showAmbientGlow ?? !isSection;

  const updateGrid = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const { width, height } = container.getBoundingClientRect();
    const scale = Math.max(1, Math.min(width, height) / 800);
    const cols = Math.ceil(width / (cellSize * scale)) + 1;
    const rows = Math.ceil(height / (cellSize * scale)) + 1;

    setGrid({ rows, cols, scale });
  }, [cellSize]);

  useEffect(() => {
    updateGrid();
    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(updateGrid);
    ro.observe(container);
    return () => ro.disconnect();
  }, [updateGrid]);

  const handleMouseMove = useCallback((e) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMousePos({ x: -1000, y: -1000 });
  }, []);

  const scaledCellSize = cellSize * grid.scale;
  const scaledProximity = proximity * grid.scale;

  let hoveredCell = null;
  if (mousePos.x >= 0 && mousePos.y >= 0 && grid.cols > 0 && scaledCellSize > 0) {
    const col = Math.floor(mousePos.x / scaledCellSize);
    const row = Math.floor(mousePos.y / scaledCellSize);
    if (col >= 0 && col < grid.cols && row >= 0 && row < grid.rows) {
      hoveredCell = row * grid.cols + col;
    }
  }

  const rootLayoutClass =
    layout === "viewport"
      ? "fixed inset-0 overflow-hidden bg-neutral-950"
      : "pointer-events-none absolute inset-0 min-h-full overflow-hidden bg-transparent";

  return (
    <div
      ref={containerRef}
      className={cn(rootLayoutClass, className)}
      onMouseMove={layout === "viewport" ? handleMouseMove : undefined}
      onMouseLeave={layout === "viewport" ? handleMouseLeave : undefined}
      aria-hidden
    >
      {/* LTR: mouse X must match column index (RTL document mirrors flex rows otherwise) */}
      <div className="absolute inset-0" dir="ltr">
        {Array.from({ length: grid.rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex">
            {Array.from({ length: grid.cols }).map((_, colIndex) => {
              const index = rowIndex * grid.cols + colIndex;
              const cellX = colIndex * scaledCellSize + scaledCellSize / 2;
              const cellY = rowIndex * scaledCellSize + scaledCellSize / 2;
              const dx = mousePos.x - cellX;
              const dy = mousePos.y - cellY;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const proximityFactor = Math.max(0, 1 - distance / scaledProximity);
              const isHovered = hoveredCell === index;

              return (
                <div
                  key={index}
                  className="shrink-0 border transition-all duration-1000 ease-out"
                  style={{
                    width: scaledCellSize,
                    height: scaledCellSize,
                    borderColor,
                    backgroundColor: isHovered
                      ? glowColor
                      : proximityFactor > 0
                        ? glowColor.replace(/[\d.]+\)$/, `${proximityFactor * 0.12})`)
                        : "transparent",
                    boxShadow: isHovered
                      ? `0 0 ${20 * grid.scale}px ${glowColor}, inset 0 0 ${10 * grid.scale}px ${glowColor.replace(/[\d.]+\)$/, "0.2)")}`
                      : "none",
                    transitionDuration: isHovered ? "0ms" : "1000ms",
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>

      {ambientOn ? (
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20"
          style={{
            width: "60vmin",
            height: "60vmin",
            background: `radial-gradient(circle, ${glowColor.replace(/[\d.]+\)$/, "0.25)")} 0%, transparent 70%)`,
          }}
        />
      ) : null}

      {vignetteOn ? (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 0%, transparent 30%, rgba(10,10,10,0.8) 100%)",
          }}
        />
      ) : null}

      {children ? <div className="relative z-10 h-full w-full">{children}</div> : null}
    </div>
  );
}

/**
 * Full-width shell: grid behind + interactive mouse tracking; content sits above (z-10).
 * @param {object} props
 * @param {import("react").ReactNode} props.children
 * @param {string} [props.className]
 * @param {string} [props.gridClassName]
 * @param {string} [props.glowColor] Cell hover / proximity tint (default teal for emerald theme).
 * @param {string} [props.borderColor] Grid line color.
 */
export function InteractiveGridShell({
  children,
  className,
  gridClassName,
  glowColor: glowColorProp,
  borderColor: borderColorProp,
}) {
  const shellRef = useRef(null);
  const [grid, setGrid] = useState({ rows: 0, cols: 0, scale: 1 });
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });

  const cellSize = 38;
  const glowColor = glowColorProp ?? "rgba(20, 184, 166, 0.32)";
  const borderColor = borderColorProp ?? "rgba(0, 0, 0, 0.055)";
  const proximity = 100;

  const updateGrid = useCallback(() => {
    const el = shellRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const scale = Math.max(1, Math.min(width, height) / 800);
    const cols = Math.ceil(width / (cellSize * scale)) + 1;
    const rows = Math.ceil(height / (cellSize * scale)) + 1;
    setGrid({ rows, cols, scale });
  }, []);

  useEffect(() => {
    updateGrid();
    const el = shellRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateGrid);
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateGrid]);

  const handleMouseMove = useCallback((e) => {
    const el = shellRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMousePos({ x: -1000, y: -1000 });
  }, []);

  const scaledCellSize = cellSize * grid.scale;
  const scaledProximity = proximity * grid.scale;

  let hoveredCell = null;
  if (mousePos.x >= 0 && mousePos.y >= 0 && grid.cols > 0 && scaledCellSize > 0) {
    const col = Math.floor(mousePos.x / scaledCellSize);
    const row = Math.floor(mousePos.y / scaledCellSize);
    if (col >= 0 && col < grid.cols && row >= 0 && row < grid.rows) {
      hoveredCell = row * grid.cols + col;
    }
  }

  return (
    <div
      ref={shellRef}
      className={cn("relative", className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Clip grid only — `overflow-hidden` on the shell root breaks `position:sticky` for the header */}
      <div
        className={cn("pointer-events-none absolute inset-0 z-0 min-h-full overflow-hidden", gridClassName)}
        aria-hidden
        dir="ltr"
      >
        <div className="absolute inset-0">
          {Array.from({ length: grid.rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex">
              {Array.from({ length: grid.cols }).map((_, colIndex) => {
                const index = rowIndex * grid.cols + colIndex;
                const cellX = colIndex * scaledCellSize + scaledCellSize / 2;
                const cellY = rowIndex * scaledCellSize + scaledCellSize / 2;
                const dx = mousePos.x - cellX;
                const dy = mousePos.y - cellY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const proximityFactor = Math.max(0, 1 - distance / scaledProximity);
                const isHovered = hoveredCell === index;

                return (
                  <div
                    key={index}
                    className="shrink-0 border transition-all duration-1000 ease-out"
                    style={{
                      width: scaledCellSize,
                      height: scaledCellSize,
                      borderColor,
                      backgroundColor: isHovered
                        ? glowColor
                        : proximityFactor > 0
                          ? glowColor.replace(/[\d.]+\)$/, `${proximityFactor * 0.1})`)
                          : "transparent",
                      boxShadow: isHovered
                        ? `0 0 ${18 * grid.scale}px ${glowColor}, inset 0 0 ${8 * grid.scale}px ${glowColor.replace(/[\d.]+\)$/, "0.18)")}`
                        : "none",
                      transitionDuration: isHovered ? "0ms" : "1000ms",
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
