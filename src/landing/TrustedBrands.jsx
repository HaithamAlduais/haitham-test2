import { useLanguage } from "@/context/LanguageContext";
import { getLandingCopy } from "./landingLocale";

const LOGOS = [
  { src: "/logos/tamkeen.svg", alt: "Tamkeen Technologies" },
  { src: "/logos/stc.svg", alt: "STC" },
  { src: "/logos/sdaia.svg", alt: "SDAIA" },
  { src: "/logos/elm.svg", alt: "Elm" },
  { src: "/logos/riyadh-season.svg", alt: "Riyadh Season" },
];

export function TrustedBrands() {
  const { lang } = useLanguage();
  const L = getLandingCopy(lang);

  return (
    <section className="flex flex-col items-center justify-center px-4 py-16 sm:py-24">
      <h3 className="text-center text-lg font-medium text-muted-foreground">
        {L.logoMarqueeHeading}
      </h3>
      <div className="mt-14 grid w-full max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        {LOGOS.map((logo) => (
          <div
            key={logo.alt}
            className="grid h-16 place-content-center rounded-xl border border-border bg-background/60 p-4 backdrop-blur-xl backdrop-saturate-150 transition duration-200 hover:-translate-y-0.5"
          >
            <img
              src={logo.src}
              alt={logo.alt}
              className="h-8 w-auto object-contain"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
