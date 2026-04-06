import {
  motion,
  useScroll,
  useVelocity,
  useTransform,
  useSpring,
} from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";

const MotionP = motion.p;

const velocitySpring = { mass: 3, stiffness: 400, damping: 50 };

/**
 * Scroll-driven skew + horizontal drift (velocity-reactive skew).
 * Pass `scrollYProgress` from the same `useScroll({ target })` as the parent section
 * so motion stays in sync with sticky feature cards.
 */
export function ScrollLinkedVelocityMarquee({
  scrollYProgress,
  children,
  className,
  dir = "ltr",
  xRange,
}) {
  const scrollVelocity = useVelocity(scrollYProgress);

  const skewXRaw = useTransform(
    scrollVelocity,
    [-0.5, 0.5],
    ["22deg", "-22deg"]
  );
  const skewX = useSpring(skewXRaw, velocitySpring);

  const [xStart, xEnd] =
    xRange ?? (dir === "rtl" ? [0, 2400] : [0, -2400]);

  const xRaw = useTransform(scrollYProgress, [0, 1], [xStart, xEnd]);
  const x = useSpring(xRaw, velocitySpring);

  return (
    <MotionP
      aria-hidden
      style={{ skewX, x }}
      className={cn(
        "pointer-events-none select-none whitespace-nowrap font-black uppercase leading-[0.85] text-foreground/20 dark:text-foreground/15",
        dir === "rtl" ? "origin-bottom-right" : "origin-bottom-left",
        "text-[clamp(1.75rem,5vw,3.75rem)]",
        className
      )}
    >
      {children}
    </MotionP>
  );
}

/**
 * Standalone tall section with sticky viewport — optional full-page strip (demo / marketing).
 * Prefer `ScrollLinkedVelocityMarquee` when you already have a section `useScroll` target.
 */
export function VelocityText({
  children,
  scrollHeightVh = 280,
  className,
  textClassName,
  dir = "ltr",
}) {
  const targetRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"],
  });

  return (
    <section
      ref={targetRef}
      className={cn("relative overflow-x-hidden bg-transparent text-foreground", className)}
      style={{ minHeight: `${scrollHeightVh}vh` }}
    >
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <ScrollLinkedVelocityMarquee
          scrollYProgress={scrollYProgress}
          dir={dir}
          className={cn(
            "text-5xl md:text-7xl md:leading-[0.85]",
            textClassName
          )}
        >
          {children}
        </ScrollLinkedVelocityMarquee>
      </div>
    </section>
  );
}
