import { cn } from "@/lib/utils";
import Star8 from "@/components/stars/s8";

const STAR_STROKE = "var(--border)";

/** Repeats of word + star per half-strip (width for smooth scroll). */
const SINGLE_WORD_REPEATS = 24;

/** Repeats for logo strips (fewer needed since logos are wider). */
const LOGO_REPEATS = 4;

/**
 * Single scrolling row using `animate-marquee2` + duplicated strip for a seamless loop.
 *
 * @param {object} props
 * @param {string[]} [props.items] Legacy demo: plain text segments (no stars).
 * @param {string[]} [props.words] One word → repeated "WORD ★ WORD ★ …". Several words → each word then ★.
 * @param {Array<{src: string, alt: string, height?: number}>} [props.logos] Logo images shown between stars.
 * @param {import("react").ComponentType<{ size?: number; stroke?: string; strokeWidth?: number; className?: string }>} [props.starComponent] Neobrutalism star (e.g. s7, s20, s28, s32).
 * @param {string} [props.className]
 * @param {string} [props.trackClassName]
 * @param {"default" | "compact"} [props.density]
 */
function Marquee({
  items,
  words,
  logos,
  starComponent: StarSlot = Star8,
  className,
  trackClassName,
  density = "default",
}) {
  const py = density === "compact" ? "py-4" : "py-8 sm:py-10";
  const minH = density === "compact" ? "min-h-[70px]" : "min-h-[120px] sm:min-h-[140px]";
  const textSize = density === "compact" ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl";
  const starSize = density === "compact" ? 38 : 48;

  const renderWordStrip = (keyPrefix) => {
    if (!words?.length) return null;

    const singleWord = words.length === 1 ? words[0] : null;
    const segments = singleWord
      ? Array.from({ length: SINGLE_WORD_REPEATS }, () => singleWord)
      : words;

    return segments.flatMap((w, i) => [
      <span
        key={`${keyPrefix}-w-${i}-${w}`}
        className={cn(
          "mx-3 inline-flex items-center font-black tracking-tight text-foreground",
          textSize
        )}
      >
        {w}
      </span>,
      <StarSlot
        key={`${keyPrefix}-s-${i}`}
        size={starSize}
        stroke={STAR_STROKE}
        strokeWidth={2}
        className="inline-block shrink-0 text-main"
        aria-hidden
      />,
    ]);
  };

  const renderLogoStrip = (keyPrefix) => {
    if (!logos?.length) return null;

    const repeated = Array.from({ length: LOGO_REPEATS }, () => logos).flat();

    return repeated.map((logo, i) => (
      <img
        key={`${keyPrefix}-logo-${i}`}
        src={logo.src}
        alt={keyPrefix === "a" ? logo.alt : ""}
        style={{ height: logo.height || 32 }}
        className="mx-6 sm:mx-10 inline-block shrink-0 object-contain"
        draggable={false}
      />
    ));
  };

  const renderLegacyItems = (keyPrefix) => {
    if (!items?.length) return null;
    return items.map((item, i) => (
      <span key={`${keyPrefix}-${i}-${item}`} className="mx-4 text-4xl">
        {item}
      </span>
    ));
  };

  const renderStrip = (keyPrefix) => {
    if (logos?.length) return renderLogoStrip(keyPrefix);
    if (words?.length) return renderWordStrip(keyPrefix);
    return renderLegacyItems(keyPrefix);
  };

  const stripA = (
    <span className="inline-flex items-center">
      {renderStrip("a")}
    </span>
  );
  const stripB = (
    <span className="inline-flex items-center" aria-hidden="true">
      {renderStrip("b")}
    </span>
  );

  return (
    <div
      className={cn(
        "relative flex w-full overflow-x-hidden border-b-2 border-t-2 border-border bg-secondary-background font-base text-foreground",
        minH,
        className
      )}
      dir="ltr"
    >
      <div
        className={cn(
          "absolute top-0 left-0 flex w-max shrink-0 flex-nowrap whitespace-nowrap animate-marquee2",
          py,
          trackClassName
        )}
      >
        {stripA}
        {stripB}
      </div>
    </div>
  );
}

export { Marquee as default };
