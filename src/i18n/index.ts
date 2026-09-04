import { createI18n } from 'vue-i18n';
import en from './locales/en';
import th from './locales/th';

const savedLocale = localStorage.getItem('draga_locale') || 'th';

export const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'en',
  messages: {
    en,
    th
  }
});

export function setLocale(newLocale: 'th' | 'en') {
  i18n.global.locale.value = newLocale;
  localStorage.setItem('draga_locale', newLocale);
}

export function toggleLanguage() {
  const current = i18n.global.locale.value;
  const next = current === 'th' ? 'en' : 'th';
  setLocale(next);
  return next;
}
