import { Link, useLocation, useNavigate } from "react-router-dom";
import { Globe, Menu, UserRound, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { getLandingCopy } from "./landingLocale";
import {
  LANDING_NAV_SECTION_IDS,
  useLandingActiveSection,
  useLandingHeaderDocked,
} from "../hooks/useLandingHeaderScroll";

function NavLink({ href, label, active }) {
  return (
    <a
      href={href}
      aria-current={active ? "location" : undefined}
      className={cn(
        "px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200",
        active
          ? "bg-main/15 text-main dark:bg-main/20 dark:text-main"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
    </a>
  );
}

export function LandingHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { lang, setLang, t, dir } = useLanguage();
  const { setMode, setTheme } = useTheme();
  const L = getLandingCopy(lang);
  const sheetSide = dir === "rtl" ? "left" : "right";
  const isOrganizerPage = location.pathname === "/organizer";

  const navItems = L.navItems.filter((item) => {
    if (item.href === "#participant-features") return !isOrganizerPage;
    if (item.href === "#organizer-features") return isOrganizerPage;
    return true;
  });

  const onAudienceSwitch = (toOrganizer) => {
    // Force theme change FIRST, then navigate
    if (toOrganizer) {
      setTheme("dark");
      setMode("organizer");
      navigate("/organizer");
    } else {
      setTheme("light");
      setMode("participant");
      navigate("/");
    }
  };

  const docked = useLandingHeaderDocked(32);
  const sectionProbeOffset = docked ? 88 : 104;
  const activeSection = useLandingActiveSection(LANDING_NAV_SECTION_IDS, sectionProbeOffset);

  const isActiveHref = (href) => href.startsWith("#") && href.slice(1) === activeSection;

  return (
    <header
      className={cn(
        "sticky z-50 w-full transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        docked ? "top-0" : "top-4"
      )}
    >
      <div
        className={cn(
          "mx-auto flex h-16 max-w-5xl items-center justify-between rounded-2xl px-4 transition-all duration-500 sm:px-6",
          docked
            ? "max-w-full rounded-none border-b border-border bg-background/80 backdrop-blur-xl"
            : "mx-4 border border-border bg-background/60 backdrop-blur-xl backdrop-saturate-150 shadow-sm sm:mx-auto"
        )}
      >
        {/* Logo */}
        <Link to={isOrganizerPage ? "/organizer" : "/"} className="flex shrink-0 items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-main">
            <Zap className="h-4 w-4 text-main-foreground" strokeWidth={3} />
          </div>
          <span className="font-heading text-lg font-black tracking-tight text-foreground">
            Ramsha
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {navItems.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} active={isActiveHref(item.href)} />
          ))}
        </nav>

        {/* Right side actions */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Audience switch */}
          <div
            dir="ltr"
            className="hidden items-center gap-2 rounded-full border border-border px-3 py-1.5 md:flex"
          >
            <span className="text-xs font-semibold text-muted-foreground">
              {t("nav.participant")}
            </span>
            <Switch
              aria-label={t("nav.audienceSwitch")}
              checked={isOrganizerPage}
              onCheckedChange={(checked) => onAudienceSwitch(checked)}
            />
            <span className="text-xs font-semibold text-muted-foreground">
              {t("nav.organizer")}
            </span>
          </div>

          <Button
            type="button"
            variant="neutral"
            size="icon"
            className="size-9 shrink-0 rounded-full"
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            aria-label={t("nav.language")}
          >
            <Globe className="h-4 w-4" strokeWidth={2.5} />
          </Button>

          <Button
            type="button"
            variant="neutral"
            size="icon"
            className="size-9 shrink-0 rounded-full"
            aria-label={`${t("auth.login")} · ${t("auth.signup")}`}
            onClick={() => navigate("/login")}
          >
            <UserRound className="h-4 w-4" strokeWidth={2.5} />
          </Button>

          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button type="button" variant="neutral" size="icon" className="shrink-0 rounded-full md:hidden" aria-label="Menu">
                <Menu className="h-4 w-4" strokeWidth={2.5} />
              </Button>
            </SheetTrigger>
            <SheetContent side={sheetSide} className="w-[min(100%,320px)]">
              <SheetHeader>
                <SheetTitle className="text-start font-black uppercase">Menu</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1" aria-label="Mobile primary">
                {navItems.map((item) => {
                  const active = isActiveHref(item.href);
                  return (
                    <SheetClose key={item.href} asChild>
                      <a
                        href={item.href}
                        aria-current={active ? "location" : undefined}
                        className={cn(
                          "rounded-xl px-4 py-3 text-sm font-bold transition-colors duration-200",
                          active
                            ? "bg-main/15 text-main"
                            : "text-foreground hover:bg-muted"
                        )}
                      >
                        {item.label}
                      </a>
                    </SheetClose>
                  );
                })}
                <div className="mt-4 rounded-xl border border-border p-3">
                  <div className="mb-2 text-[10px] font-black uppercase tracking-wide text-muted-foreground">
                    {t("nav.audience")}
                  </div>
                  <div className="flex items-center justify-between gap-2" dir="ltr">
                    <span className="text-xs font-bold text-foreground">{t("nav.participant")}</span>
                    <Switch
                      aria-label={t("nav.audienceSwitch")}
                      checked={isOrganizerPage}
                      onCheckedChange={(checked) => {
                        if (checked !== isOrganizerPage) onAudienceSwitch(checked);
                      }}
                    />
                    <span className="text-xs font-bold text-foreground">{t("nav.organizer")}</span>
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  <SheetClose asChild>
                    <Button
                      type="button"
                      variant="neutral"
                      className="w-full"
                      onClick={() => navigate("/login")}
                    >
                      {t("auth.login")}
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button type="button" className="w-full" onClick={() => navigate("/signup")}>
                      {t("auth.signup")}
                    </Button>
                  </SheetClose>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
