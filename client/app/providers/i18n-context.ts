import { createContext } from 'react';
import type { LocaleCode, MessageKey, MessageValues } from '@client/shared/i18n/messages';

export interface I18nContextValue {
  locale: LocaleCode;
  locales: readonly LocaleCode[];
  setLocale: (locale: LocaleCode) => void;
  t: (key: MessageKey, values?: MessageValues) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatDateTime: (value: Date | number | string, options?: Intl.DateTimeFormatOptions) => string;
  formatList: (values: string[], options?: Intl.ListFormatOptions) => string;
}

export const I18nContext = createContext<I18nContextValue | null>(null);
