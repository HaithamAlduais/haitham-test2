import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

/**
 * Feature section — sticky-scroll stacking cards (ui-layouts pattern).
 * Each card is h-screen, sticky top-0, with an opaque background.
 * Lenis smooth scroll (in parent) makes the cards glide over each other.
 */

const ACCENT_COLORS = [
  "var(--main)",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-1))",
];

export function FeatureCarouselSection({ id, title, subtitle, items }) {
  const { dir } = useLanguage();

  const slides = useMemo(() => {
    const list = Array.isArray(items) ? items : [];
    return list.map((item, idx) => ({
      key: `${id}-${idx}`,
      title: item.title,
      description: item.description,
      step: String(idx + 1).padStart(2, "0"),
      color: ACCENT_COLORS[idx % ACCENT_COLORS.length],
    }));
  }, [id, items]);

  if (!slides.length) return null;

  return (
    <section id={id} dir={dir} className="scroll-mt-28">
      {/* wrapper — its total height creates the scroll distance for sticky */}
      <div>
        {/* Intro card — sticky behind everything */}
        <section className="sticky top-0 z-0 grid h-screen w-full place-content-center bg-background">
          <div className="px-8 text-center">
            <p className="mb-4 text-xs font-bold uppercase tracking-[3px] text-main">
              {title}
            </p>
            {subtitle && (
              <p className="mx-auto max-w-lg text-lg text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </section>

        {/* Feature cards — each slides over the previous */}
        {slides.map((slide, idx) => (
          <section
            key={slide.key}
            className="sticky top-0 grid h-screen w-full place-content-center overflow-hidden rounded-t-3xl bg-background"
            style={{ zIndex: idx + 1 }}
          >
            {/* Tinted overlay for color */}
            <div
              className="absolute inset-0"
              style={{
                background: `color-mix(in srgb, ${slide.color} 6%, var(--background))`,
              }}
            />

            <div className={cn(
              "relative z-10 flex max-w-5xl flex-col items-start gap-8 px-8 md:flex-row md:items-center md:gap-16",
              dir === "rtl" ? "text-end" : "text-start"
            )}>
              {/* Content */}
              <div className="flex flex-1 flex-col">
                <span
                  className="mb-6 inline-flex w-fit items-center rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[1px]"
                  style={{
                    border: `1px solid color-mix(in srgb, ${slide.color} 35%, transparent)`,
                    background: `color-mix(in srgb, ${slide.color} 12%, transparent)`,
                    color: slide.color,
                  }}
                >
                  Step {slide.step}
                </span>

                <h3 className="mb-4 text-4xl font-black tracking-tight text-foreground sm:text-5xl">
                  {slide.title}
                </h3>
                <p className="max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
                  {slide.description}
                </p>
              </div>

              {/* Decorative number */}
              <div className="hidden shrink-0 md:block">
                <span
                  className="text-[10rem] font-black leading-none opacity-10"
                  style={{ color: slide.color }}
                >
                  {slide.step}
                </span>
              </div>
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
