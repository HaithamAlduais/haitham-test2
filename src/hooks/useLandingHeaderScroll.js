import { useEffect, useState } from "react";

/** Section `id`s matching `landingLocale` nav `href`s (no `#`). */
export const LANDING_NAV_SECTION_IDS = Object.freeze([
  "intro",
  "participant-features",
  "organizer-features",
  "faq",
  "contact",
]);

/**
 * @param {number} threshold  Pixels scrolled before header docks full-width (flush top).
 */
export function useLandingHeaderDocked(threshold = 36) {
  const [docked, setDocked] = useState(false);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      setDocked((prev) => {
        const next = window.scrollY >= threshold;
        return prev === next ? prev : next;
      });
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return docked;
}

/**
 * Which section id is considered "active" for nav highlighting.
 * @param {readonly string[]} sectionIds  DOM ids without # (e.g. intro, faq).
 * @param {number} offsetPx  Viewport offset from top (below header) for the scan line.
 */
export function useLandingActiveSection(sectionIds, offsetPx = 96) {
  const [activeId, setActiveId] = useState(sectionIds[0] ?? "intro");

  useEffect(() => {
    let ticking = false;
    const compute = () => {
      const scrollY = window.scrollY;
      const probe = scrollY + offsetPx;
      let current = sectionIds[0] ?? "intro";
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top + scrollY;
        if (top <= probe) current = id;
      }
      setActiveId((prev) => (prev === current ? prev : current));
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(compute);
      }
    };
    const onHash = () => {
      const h = window.location.hash.replace(/^#/, "");
      if (h && sectionIds.includes(h)) setActiveId(h);
    };
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    window.addEventListener("hashchange", onHash);
    onHash();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("hashchange", onHash);
    };
  }, [sectionIds, offsetPx]);

  return activeId;
}
