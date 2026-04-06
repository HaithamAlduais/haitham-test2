import { createContext, useContext, useLayoutEffect, useState } from "react";
import { translations } from "../translations";

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

function syncDocumentLang(lang) {
  if (typeof document === "undefined") return;
  const isAr = lang === "ar";
  const dir = isAr ? "rtl" : "ltr";
  document.documentElement.setAttribute("dir", dir);
  document.documentElement.setAttribute("lang", lang);
  document.documentElement.classList.toggle("lang-ar", isAr);
}

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    let lang = "en";
    try {
      lang = localStorage.getItem("ramsha-lang") || "en";
    } catch {
      lang = "en";
    }
    // Before first paint: Embla and flex RTL rely on native document direction.
    syncDocumentLang(lang);
    return lang;
  });

  const isRTL = language === "ar";

  useLayoutEffect(() => {
    syncDocumentLang(language);
    try {
      localStorage.setItem("ramsha-lang", language);
    } catch {
      // localStorage unavailable — ignore
    }
  }, [language]);

  const toggleLanguage = () =>
    setLanguage((prev) => (prev === "en" ? "ar" : "en"));

  /** Resolve flat keys (e.g. `goHome`) or nested paths (e.g. `nav.participant`, `auth.login`). */
  const t = (key) => {
    const pick = (dict) => {
      if (!dict) return undefined;
      const direct = dict[key];
      if (typeof direct === "string") return direct;
      const parts = key.split(".");
      if (parts.length < 2) {
        const v = dict[key];
        return typeof v === "string" ? v : undefined;
      }
      let cur = dict;
      for (const p of parts) {
        cur = cur?.[p];
        if (cur == null) return undefined;
      }
      return typeof cur === "string" ? cur : undefined;
    };

    const strings = translations[language] || translations.en;
    return pick(strings) ?? pick(translations.en) ?? key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        lang: language,
        setLanguage,
        setLang: setLanguage,
        toggleLanguage,
        isRTL,
        dir: isRTL ? "rtl" : "ltr",
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};
