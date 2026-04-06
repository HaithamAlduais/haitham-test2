import Marquee from "@/components/ui/marquee";
import Star28 from "@/components/stars/s28";

const LOGOS = [
  { src: "/logos/شعار تمكين - SVG.png", alt: "Tamkeen", height: 38 },
  { src: "/logos/شعار اس تي سي stc logo بدقة عالية svg - png.png", alt: "STC", height: 38 },
  { src: "/logos/شعار الهيئة السعودية للبيانات والذكاء الاصطناعي سدايا - SVG.png", alt: "SDAIA", height: 38 },
  { src: "/logos/شعار علم الجديد بدقة عالي PNG - SVG Elm Logo.png", alt: "Elm", height: 38 },
  { src: "/logos/شعار موسم الرياض - بدقة عالية svg - png.png", alt: "Riyadh Season", height: 38 },
];

/**
 * Logo marquee with a heading above it.
 * Uses the theme Marquee component with real brand logos in their original colors.
 */
function LogoMarquee({ heading, className }) {
  return (
    <div className={className}>
      {heading && (
        <p className="py-4 text-center text-sm font-medium tracking-wide text-muted-foreground/70 uppercase">
          {heading}
        </p>
      )}
      <Marquee logos={LOGOS} starComponent={Star28} density="compact" />
    </div>
  );
}

export default LogoMarquee;
