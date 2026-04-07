import LogoMarquee from "@/components/ui/logo-marquee";
import { motion } from "framer-motion";
import { ReactLenis } from "lenis/react";
import { useLayoutEffect } from "react";
import { InteractiveGridShell } from "@/components/InteractiveGridPattern";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { LandingHeader } from "./LandingHeader";
import { LandingIntro } from "./LandingIntro";
import { FeatureCarouselSection } from "./FeatureCarouselSection";
import { LandingFAQ } from "./LandingFAQ";
import { LandingContact } from "./LandingContact";
import { getLandingCopy } from "./landingLocale";
import HackathonMarketplace from "@/components/hackathon/HackathonMarketplace";

export default function LandingPage() {
  const { lang } = useLanguage();
  const { setMode, setTheme } = useTheme();
  const L = getLandingCopy(lang);

  useLayoutEffect(() => {
    setMode("participant");
    setTheme("light");
  }, [setMode, setTheme]);

  return (
    <ReactLenis root>
    <motion.div
      className="relative min-h-screen bg-background text-foreground"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <InteractiveGridShell
        className="min-h-screen bg-background"
        glowColor="rgba(79, 70, 229, 0.12)"
        borderColor="rgba(0, 0, 0, 0.03)"
      >
        <LandingHeader />
        <main>
          <LandingIntro />
          <LogoMarquee heading={L.logoMarqueeHeading} className="border-y border-border" />

          {/* Hackathon marketplace — browse public hackathons */}
          <HackathonMarketplace />

          {/* Participant features */}
          <FeatureCarouselSection
            id="participant-features"
            title={L.participantSectionTitle}
            subtitle={L.participantSectionSubtitle}
            items={L.participantFeatures}
          />

          {/* Organizer features */}
          <FeatureCarouselSection
            id="organizer-features"
            title={L.organizerSectionTitle}
            subtitle={L.organizerSectionSubtitle}
            items={L.organizerFeatures}
          />

          <LandingFAQ />
        </main>
        <LandingContact />
      </InteractiveGridShell>
    </motion.div>
    </ReactLenis>
  );
}
