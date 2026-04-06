import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Fan-style card stack with buttery-smooth scroll-driven animation.
 *
 * Key design: accepts a **fractional** `progress` value (0 to items.length-1)
 * so card positions interpolate continuously with scroll -- no snapping.
 *
 * Also supports discrete `activeIndex` (integer) and uncontrolled click/drag.
 */
export function CardStack({
  items,
  initialIndex = 0,

  /** Continuous float 0..len-1 for scroll-driven mode (smoothest). */
  progress,
  /** Discrete integer for controlled mode (snaps). */
  activeIndex: controlledIndex,

  maxVisible = 7,

  cardWidth = 480,
  cardHeight = 300,

  overlap = 0.48,
  spreadDeg = 40,

  /** 3D fan (prompt-style) */
  perspectivePx = 1100,
  depthPx = 120,
  tiltXDeg = 10,

  activeLiftPx = 18,
  activeScale = 1.04,
  inactiveScale = 0.92,

  /**
   * When `progress` is spring-smoothed upstream, keep this low so the stack
   * tracks without extra lag. Slightly >0 avoids rare sub-pixel shimmer.
   */
  progressTweenDuration = 0.06,

  loop = false,
  autoAdvance = false,
  intervalMs = 2800,
  pauseOnHover = true,

  showDots = true,
  className,

  onChangeIndex,
  renderCard,
}) {
  const reduceMotion = useReducedMotion();
  const len = items.length;
  const clamp = (n) => Math.max(0, Math.min(len - 1, n));

  const [internal, setInternal] = React.useState(() => clamp(initialIndex));
  const [hovering, setHovering] = React.useState(false);

  // Determine the "active" float from the three possible sources
  const hasProgress = typeof progress === "number";
  const hasControlled = typeof controlledIndex === "number";
  const controlled = hasProgress || hasControlled;

  // `cursor` is the continuous position in the card array (can be fractional)
  const cursor = hasProgress
    ? Math.max(0, Math.min(len - 1, progress))
    : hasControlled
      ? clamp(controlledIndex)
      : internal;

  // Nearest integer for "which card is active" (for dots, renderCard active flag)
  const activeInt = Math.round(cursor);

  React.useEffect(() => {
    setInternal((a) => clamp(a));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [len]);

  React.useEffect(() => {
    if (!len) return;
    onChangeIndex?.(activeInt, items[activeInt]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeInt]);

  const stageRef = React.useRef(null);
  const [containerWidth, setContainerWidth] = React.useState(0);

  React.useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setContainerWidth(el.clientWidth));
    ro.observe(el);
    setContainerWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const maxOffset = Math.max(1, Math.floor(maxVisible / 2));
  const cw = containerWidth;
  /** Card width in px; cap by stage so the fan can stay inside the container. */
  const effW =
    cw > 0
      ? Math.min(cardWidth, Math.max(220, Math.round(cw * 0.88)))
      : Math.min(cardWidth, 420);
  const cardSpacing = Math.max(8, Math.round(effW * (1 - overlap)));
  const stepDeg = maxOffset > 0 ? spreadDeg / maxOffset : 0;
  const maxScale = Math.max(activeScale, inactiveScale);
  /** Half-width the fan needs at full spread (translation + scaled card half + rotation slop). */
  const halfFanExtent =
    maxOffset * cardSpacing + (effW / 2) * maxScale * 1.15 + 8;
  const availHalf = cw > 0 ? Math.max(40, cw / 2 - 16) : halfFanExtent;
  const spreadFactor =
    halfFanExtent > 0 && halfFanExtent > availHalf ? availHalf / halfFanExtent : 1;

  const go = React.useCallback(
    (dir) => {
      if (controlled) return;
      setInternal((a) => {
        const next = a + dir;
        if (loop) return ((next % len) + len) % len;
        return clamp(next);
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [controlled, len, loop]
  );

  const onKeyDown = (e) => {
    if (e.key === "ArrowLeft") go(-1);
    if (e.key === "ArrowRight") go(1);
  };

  // auto-advance (uncontrolled only)
  React.useEffect(() => {
    if (controlled || !autoAdvance || reduceMotion || !len) return;
    if (pauseOnHover && hovering) return;
    const id = setInterval(() => go(1), Math.max(700, intervalMs));
    return () => clearInterval(id);
  }, [controlled, autoAdvance, intervalMs, hovering, pauseOnHover, reduceMotion, len, go]);

  if (!len) return null;

  const stageHeight = Math.max(340, cardHeight + 60);

  return (
    <div
      className={cn("w-full overflow-x-clip", className)}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div
        ref={stageRef}
        className="relative mx-auto w-full max-w-full"
        style={{ height: stageHeight }}
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        {/* Soft ambient glow */}
        <div
          className="pointer-events-none absolute inset-x-0 top-6 mx-auto h-48 w-[70%] rounded-full bg-black/5 blur-3xl dark:bg-white/5"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto h-40 w-[76%] rounded-full bg-black/10 blur-3xl dark:bg-black/25"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto h-32 w-[70%] rounded-full bg-main/8 blur-3xl"
          aria-hidden
        />

        <div
          className="absolute inset-0 flex items-end justify-center"
          style={{
            perspective: `${perspectivePx}px`,
            perspectiveOrigin: "50% 100%",
          }}
        >
          {items.map((item, i) => {
            // Fractional offset from the continuous cursor position
            const off = i - cursor;
            const abs = Math.abs(off);
            const visible = abs <= maxOffset + 0.5;

            // Continuous interpolation: everything is a smooth function of `off`
            const rotateZ = off * stepDeg * spreadFactor;
            const x = off * cardSpacing * spreadFactor;
            const y = abs * 6;

            // Scale: smoothly interpolate between active and inactive
            const t = Math.max(0, Math.min(1, abs)); // 0 = active, 1 = fully inactive
            const scale = activeScale + (inactiveScale - activeScale) * t;

            // Lift: active card lifts up, smoothly drops off
            const lift = -activeLiftPx * Math.max(0, 1 - t);

            const rotateX = tiltXDeg * Math.max(0, Math.min(1, t));

            // z-index: active on top, falls off with distance
            const zIndex = 100 - Math.round(abs);

            // Opacity: fade out at edges
            const opacity = visible ? Math.max(0, 1 - Math.max(0, abs - maxOffset) * 2) : 0;

            const translateZ = -abs * depthPx;

            const isActive = activeInt === i;

            const dragProps =
              isActive && !controlled
                ? {
                    drag: "x",
                    dragConstraints: { left: 0, right: 0 },
                    dragElastic: 0.15,
                    onDragEnd: (_e, info) => {
                      if (reduceMotion) return;
                      const threshold = Math.min(120, effW * 0.2);
                      if (info.offset.x > threshold || info.velocity.x > 500) go(-1);
                      else if (info.offset.x < -threshold || info.velocity.x < -500) go(1);
                    },
                  }
                : {};

            return (
              <motion.div
                key={item.id}
                className={cn(
                  "absolute bottom-0 select-none overflow-hidden rounded-2xl",
                  "border-2 border-border shadow-shadow",
                  "will-change-transform",
                  isActive
                    ? "cursor-grab active:cursor-grabbing"
                    : "cursor-pointer"
                )}
                style={{
                  left: "50%",
                  marginLeft: -Math.round(effW / 2),
                  width: Math.round(effW),
                  height: cardHeight,
                  transformOrigin: "50% 100%",
                  transformStyle: "preserve-3d",
                  zIndex,
                }}
                animate={{
                  opacity,
                  x,
                  y: y + lift,
                  rotateZ,
                  rotateX,
                  scale,
                }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : hasProgress
                      ? {
                          type: "tween",
                          duration: reduceMotion ? 0 : progressTweenDuration,
                          ease: [0.25, 0.1, 0.25, 1],
                        }
                      : { type: "spring", stiffness: 240, damping: 30, mass: 0.42 }
                }
                onClick={() => !controlled && setInternal(i)}
                {...dragProps}
              >
                <div
                  className="h-full w-full"
                  style={{
                    transform: `translateZ(${translateZ}px)`,
                    transformStyle: "preserve-3d",
                  }}
                >
                  {renderCard
                    ? renderCard(item, { active: isActive })
                    : <DefaultFanCard item={item} active={isActive} />}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Dots */}
      {showDots && (
        <div className="mt-5 flex items-center justify-center gap-2">
          {items.map((it, idx) => {
            const on = idx === activeInt;
            return (
              <button
                key={it.id}
                onClick={() => !controlled && setInternal(idx)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  on
                    ? "w-6 bg-main"
                    : "w-2 bg-foreground/20 hover:bg-foreground/40"
                )}
                aria-label={`Go to ${it.title}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function DefaultFanCard({ item }) {
  return (
    <div className="relative h-full w-full bg-secondary">
      <div className="absolute inset-0">
        {item.imageSrc ? (
          <img
            src={item.imageSrc}
            alt={item.title}
            className="h-full w-full object-cover"
            draggable={false}
            loading="eager"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            No image
          </div>
        )}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <div className="relative z-10 flex h-full flex-col justify-end p-5">
        <div className="truncate text-lg font-semibold text-white">
          {item.title}
        </div>
        {item.description && (
          <div className="mt-1 line-clamp-2 text-sm text-white/80">
            {item.description}
          </div>
        )}
      </div>
    </div>
  );
}
