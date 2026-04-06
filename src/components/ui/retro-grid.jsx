import { cn } from "@/lib/utils";

export function RetroGrid({
  className,
  children,
  angle = 65,
  cellSize = 60,
  opacity = 0.5,
  lineColor = "#4b5563",
}) {
  return (
    <div className={cn("fixed inset-0 overflow-hidden", className)}>
      <style>{`
        @keyframes retro-grid-scroll {
          0% { transform: translateY(-50%); }
          100% { transform: translateY(0); }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 [perspective:200px]" style={{ opacity }}>
        <div className="absolute inset-0" style={{ transform: `rotateX(${angle}deg)` }}>
          <div
            style={{
              backgroundImage: `linear-gradient(to right, ${lineColor} 1px, transparent 0), linear-gradient(to bottom, ${lineColor} 1px, transparent 0)`,
              backgroundSize: `${cellSize}px ${cellSize}px`,
              backgroundRepeat: "repeat",
              height: "300vh",
              width: "600vw",
              marginLeft: "-200%",
              transformOrigin: "100% 0 0",
              animation: "retro-grid-scroll 15s linear infinite",
            }}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-inherit to-transparent to-90%" />
      </div>

      {children && <div className="relative z-10 h-full w-full">{children}</div>}
    </div>
  );
}
