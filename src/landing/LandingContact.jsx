import { Link } from "react-router-dom";
import { Clock, Facebook, Linkedin, Mail, MapPin, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { getLandingCopy } from "./landingLocale";

const iconByKey = {
  email: Mail,
  phone: Phone,
  address: MapPin,
  hours: Clock,
};

export function LandingContact() {
  const { lang, t } = useLanguage();
  const L = getLandingCopy(lang);

  return (
    <footer id="contact" className="scroll-mt-28 bg-transparent">
      {/* CTA section */}
      <div className="relative overflow-hidden py-20 sm:py-28">
        {/* Decorative gradient behind CTA */}
        <div
          className="pointer-events-none absolute inset-0 opacity-10 dark:opacity-15"
          style={{ background: "radial-gradient(ellipse at 50% 50%, var(--main) 0%, transparent 60%)" }}
          aria-hidden
        />
        <div className="relative container mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-black leading-tight tracking-tight text-foreground sm:text-4xl md:text-5xl">
            {L.contact.title}
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
            {L.contact.blurb}
          </p>

          {/* Contact cards */}
          <div className="mx-auto mt-12 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {L.contact.cards.map(({ key, label, value }) => {
              const Icon = iconByKey[key] ?? Mail;
              return (
                <div
                  key={key}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card/30 p-4 text-start backdrop-blur-lg"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-main/15">
                    <Icon className="h-4 w-4 text-main" strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer bar */}
      <div className="border-t border-border">
        <div className="container mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 px-4 py-8 sm:flex-row">
          {/* Logo + copyright */}
          <div className="flex items-center gap-3">
            <span className="font-heading text-lg font-black tracking-tight text-foreground">
              Ramsha
            </span>
            <span className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} All rights reserved.
            </span>
          </div>

          {/* Legal links */}
          <div className="flex items-center gap-5 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground">{L.contact.footerPrivacy}</a>
            <a href="#" className="hover:text-foreground">{L.contact.footerTerms}</a>
            <a href="#" className="hover:text-foreground">{L.contact.footerCookies}</a>
          </div>

          {/* Social + login */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-muted-foreground">{L.contact.followUs}</span>
            <a
              href="#"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground"
              aria-label="Facebook"
            >
              <Facebook className="h-3.5 w-3.5" strokeWidth={2} />
            </a>
            <a
              href="#"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground"
              aria-label="X"
            >
              <span className="text-xs font-black">X</span>
            </a>
            <a
              href="#"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-3.5 w-3.5" strokeWidth={2} />
            </a>
            <span className="mx-1 text-border">|</span>
            <Link to="/login" className="text-xs font-bold text-foreground hover:underline">
              {t("auth.login")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
