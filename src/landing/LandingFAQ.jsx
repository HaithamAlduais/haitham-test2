import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { getLandingCopy } from "./landingLocale";

export function LandingFAQ() {
  const { lang } = useLanguage();
  const L = getLandingCopy(lang);

  return (
    <section id="faq" className="scroll-mt-28 bg-transparent py-16 sm:py-24">
      <div className="container mx-auto max-w-3xl px-4">
        {/* Section header — centered */}
        <div className="mb-10 text-center sm:mb-14">
          <p className="mb-3 text-xs font-bold uppercase tracking-[3px] text-main">
            {L.faqTitle}
          </p>
          <p className="mx-auto max-w-md text-base text-muted-foreground">{L.faqSubtitle}</p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-3">
          {L.faqItems.map((item, i) => (
            <AccordionItem
              key={item.q}
              value={`item-${i}`}
              className="overflow-hidden rounded-xl border border-border bg-card/30 backdrop-blur-lg"
            >
              <AccordionTrigger
                className={cn(
                  "rounded-none border-0 bg-transparent px-5 py-4 text-start text-sm font-bold text-foreground shadow-none transition-colors duration-200",
                  "hover:bg-main/10 hover:text-foreground",
                  "data-[state=open]:bg-main/10 data-[state=open]:text-foreground"
                )}
              >
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
