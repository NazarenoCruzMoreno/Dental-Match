import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();
const STORAGE_KEY  = "theme";

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => localStorage.getItem(STORAGE_KEY) === "dark");

  // Aplica el atributo y guarda en localStorage
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    localStorage.setItem(STORAGE_KEY, isDark ? "dark" : "light");
  }, [isDark]);

  // ── Sincronización entre pestañas ────────────────────────────────────────
  // Si cambiás el tema en una pestaña, el evento `storage` se dispara en
  // todas las otras pestañas del mismo origen.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setIsDark(e.newValue === "dark");
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggleTheme = () => setIsDark((v) => !v);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
