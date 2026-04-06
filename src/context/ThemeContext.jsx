import { createContext, useContext, useEffect, useState, useCallback } from "react";

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

const LANDING_AUDIENCE_KEY = "ramsha-landing-audience";

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("ramsha-theme") || "light";
    } catch {
      return "light";
    }
  });

  /** "participant" | "organizer" — used by landing pages + header switch */
  const [landingAudience, setLandingAudience] = useState(() => {
    try {
      const v = localStorage.getItem(LANDING_AUDIENCE_KEY);
      if (v === "organizer" || v === "participant") return v;
      return "participant";
    } catch {
      return "participant";
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem("ramsha-theme", theme);
    } catch {
      // localStorage unavailable — ignore
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(LANDING_AUDIENCE_KEY, landingAudience);
    } catch {
      /* ignore */
    }
  }, [landingAudience]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  const isDark = theme === "dark";

  const setMode = useCallback((mode) => {
    setLandingAudience(mode === "organizer" ? "organizer" : "participant");
  }, []);

  const isOrganizer = landingAudience === "organizer";

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        isDark,
        setMode,
        isOrganizer,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
