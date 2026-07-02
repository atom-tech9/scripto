import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { LANGUAGES, translate, type TranslationKey } from "@/lib/i18n";
import type { UiLanguage } from "@/types";

interface LanguageContextValue {
  lang: UiLanguage;
  dir: "ltr" | "rtl";
  setLang: (lang: UiLanguage) => void;
  toggle: () => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useLocalStorage<UiLanguage>("scripto:ui-lang", "en");
  const dir = LANGUAGES[lang]?.dir ?? "ltr";

  useEffect(() => {
    const root = document.documentElement;
    root.dir = dir;
    root.lang = lang;
  }, [dir, lang]);

  const toggle = useCallback(
    () => setLang((prev) => (prev === "ar" ? "en" : "ar")),
    [setLang],
  );
  const t = useCallback((key: TranslationKey) => translate(lang, key), [lang]);

  const value = useMemo(
    () => ({ lang, dir, setLang, toggle, t }),
    [lang, dir, setLang, toggle, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx)
    throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
