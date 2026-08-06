// src/i18n.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

// Languages you support
export const languages = ["en", "th"] as const;
export type Language = (typeof languages)[number];

i18n
  .use(HttpBackend) // load translation files via HTTP
  .use(LanguageDetector) // detect browser language
  .use(initReactI18next) // connect with react
  .init({
    fallbackLng: "en",
    supportedLngs: languages,
    debug: process.env.NODE_ENV === "development",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["cookie", "localStorage", "navigator"],
      caches: ["cookie"],
    },
    backend: {
      loadPath: "/locales/{{lng}}/translation.json",
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
