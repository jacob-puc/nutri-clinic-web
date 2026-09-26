import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export type Theme = "light" | "dark";
export type ThemePreference = Theme | "system";

const STORAGE_KEY = "nutriclinia-theme";

interface ThemeContextValue {
  theme: Theme;
  preference: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function leerPreferenciaInicial(): ThemePreference {
  if (typeof window === "undefined") return "system";

  const guardado = window.localStorage.getItem(STORAGE_KEY);
  if (guardado === "light" || guardado === "dark" || guardado === "system") {
    return guardado;
  }

  return "system";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>(
    leerPreferenciaInicial,
  );
  const [systemDark, setSystemDark] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
  const theme: Theme =
    preference === "system" ? (systemDark ? "dark" : "light") : preference;

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    if (preference === "system") {
      const actualizarPreferenciaSistema = (evento: MediaQueryListEvent) => {
        setSystemDark(evento.matches);
      };
      media.addEventListener("change", actualizarPreferenciaSistema);
      return () =>
        media.removeEventListener("change", actualizarPreferenciaSistema);
    }
  }, [preference]);

  useEffect(() => {
    const raiz = document.documentElement;
    raiz.classList.toggle("dark", theme === "dark");
    raiz.style.colorScheme = theme;
    window.localStorage.setItem(STORAGE_KEY, preference);
  }, [preference, theme]);

  const setThemePreference = (nuevo: ThemePreference) => setPreference(nuevo);
  const toggleTheme = () => setPreference(theme === "dark" ? "light" : "dark");

  return (
    <ThemeContext.Provider
      value={{ theme, preference, setTheme: setThemePreference, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const contexto = useContext(ThemeContext);
  if (!contexto) {
    throw new Error("useTheme debe usarse dentro de <ThemeProvider>.");
  }
  return contexto;
}
