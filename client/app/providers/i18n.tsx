import { type PropsWithChildren, useEffect, useState } from 'react';
import { I18nContext, type I18nContextValue } from '@client/app/providers/i18n-context';
import {
  fallbackLocale,
  formatMessage,
  isLocaleCode,
  localeStorageKey,
  resolveMessageTemplate,
  supportedLocales,
  type LocaleCode,
} from '@client/shared/i18n/messages';

interface I18nProviderProps extends PropsWithChildren {
  initialLocale?: LocaleCode;
}

function resolveBrowserLocale() {
  if (typeof navigator === 'undefined') {
    return fallbackLocale;
  }

  const candidateLocales = Array.isArray(navigator.languages) && navigator.languages.length > 0
    ? navigator.languages
    : [navigator.language];

  for (const candidate of candidateLocales) {
    const normalizedCandidate = String(candidate ?? '').toLowerCase();
    if (normalizedCandidate.startsWith('ko')) {
      return 'ko' satisfies LocaleCode;
    }
    if (normalizedCandidate.startsWith('en')) {
      return 'en' satisfies LocaleCode;
    }
  }

  return fallbackLocale;
}

function resolveInitialLocale(initialLocale?: LocaleCode) {
  if (initialLocale) {
    return initialLocale;
  }

  if (typeof window !== 'undefined') {
    try {
      const storedLocale = window.localStorage.getItem(localeStorageKey);
      if (storedLocale && isLocaleCode(storedLocale)) {
        return storedLocale;
      }
    } catch {
      // Ignore storage access failures and fall back to browser detection.
    }
  }

  return resolveBrowserLocale();
}

function normalizeDateValue(value: Date | number | string) {
  if (value instanceof Date) {
    return value;
  }

  const candidate = new Date(value);
  return Number.isNaN(candidate.valueOf()) ? null : candidate;
}

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  const [locale, setLocale] = useState<LocaleCode>(() => resolveInitialLocale(initialLocale));

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }

    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(localeStorageKey, locale);
      } catch {
        // Ignore storage write failures.
      }
    }
  }, [locale]);

  const contextValue: I18nContextValue = {
    locale,
    locales: supportedLocales,
    setLocale,
    t: (key, values) => formatMessage(resolveMessageTemplate(locale, key), values),
    formatNumber: (value, options) => new Intl.NumberFormat(locale, options).format(value),
    formatDateTime: (value, options) => {
      const normalizedDate = normalizeDateValue(value);
      return normalizedDate ? new Intl.DateTimeFormat(locale, options).format(normalizedDate) : String(value);
    },
    formatList: (values, options) => new Intl.ListFormat(locale, options).format(values),
  };

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
}
