import { useState, useEffect } from "react";
import en from "../locales/en.json";
import th from "../locales/th.json";

const MESSAGES = { en, th };

function resolve(key, msgs) {
  if (!key) return "";
  const parts = key.split(".");
  let cur = msgs;
  for (const p of parts) {
    if (!cur) return undefined;
    cur = cur[p];
  }
  return cur;
}

export function useI18n() {
  const [locale, setLocaleState] = useState(() => {
    const saved = typeof window !== "undefined" && localStorage.getItem("pm_locale");
    if (saved && MESSAGES[saved]) return saved;
    const nav = typeof navigator !== "undefined" ? navigator.language || navigator.userLanguage : "en";
    return nav && nav.startsWith("th") ? "th" : "en";
  });

  useEffect(() => {
    try {
      localStorage.setItem("pm_locale", locale);
    } catch {}
  }, [locale]);

  const t = (key, fallback) => {
    const msgs = MESSAGES[locale] || {};
    const val = resolve(key, msgs);
    if (val === undefined) return fallback ?? key;
    return val;
  };

  const setLocale = (l) => {
    if (!MESSAGES[l]) return;
    setLocaleState(l);
  };

  return { t, locale, setLocale };
}

export default useI18n;
