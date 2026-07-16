"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from "react";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  createTranslator,
  readStoredLanguage,
  syncDocumentLanguage,
  writeStoredLanguage,
  type AppLanguage,
  type Translator
} from "@/components/home/i18n";

export type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  toggleLanguage: () => void;
  t: Translator;
};

const CHINESE_LANGUAGE: AppLanguage = "zh-CN";
const ENGLISH_LANGUAGE: AppLanguage = "en-US";
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: PropsWithChildren) {
  const [language, setLanguageState] = useState<AppLanguage>(DEFAULT_LANGUAGE);

  const setLanguage = useCallback((nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage);
    writeStoredLanguage(nextLanguage);
    syncDocumentLanguage(nextLanguage);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === CHINESE_LANGUAGE ? ENGLISH_LANGUAGE : CHINESE_LANGUAGE);
  }, [language, setLanguage]);

  const t = useMemo(() => createTranslator(language), [language]);

  useEffect(() => {
    const storedLanguage = readStoredLanguage();
    setLanguageState(storedLanguage);
    syncDocumentLanguage(storedLanguage);

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== LANGUAGE_STORAGE_KEY) {
        return;
      }

      const nextLanguage = readStoredLanguage();
      setLanguageState(nextLanguage);
      syncDocumentLanguage(nextLanguage);
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({ language, setLanguage, toggleLanguage, t }),
    [language, setLanguage, t, toggleLanguage]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider.");
  }

  return context;
}

export function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div
      aria-label={t("language.switchAria")}
      className="flex shrink-0 items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5"
      role="group"
    >
      <button
        aria-label={t("language.chinese")}
        aria-pressed={language === CHINESE_LANGUAGE}
        className={`min-w-8 rounded-md px-2 py-1.5 text-xs font-medium transition ${
          language === CHINESE_LANGUAGE
            ? "bg-slate-900 text-white shadow-sm"
            : "text-slate-500 hover:bg-white hover:text-slate-900"
        }`}
        lang="zh-CN"
        onClick={() => setLanguage(CHINESE_LANGUAGE)}
        title={t("language.chinese")}
        type="button"
      >
        中
      </button>
      <button
        aria-label={t("language.english")}
        aria-pressed={language === ENGLISH_LANGUAGE}
        className={`min-w-8 rounded-md px-2 py-1.5 text-xs font-medium transition ${
          language === ENGLISH_LANGUAGE
            ? "bg-slate-900 text-white shadow-sm"
            : "text-slate-500 hover:bg-white hover:text-slate-900"
        }`}
        lang="en"
        onClick={() => setLanguage(ENGLISH_LANGUAGE)}
        title={t("language.english")}
        type="button"
      >
        EN
      </button>
    </div>
  );
}
