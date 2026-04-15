import { translationsEn } from './en';
import { translationsAr } from './ar';
import { translationsFr } from './fr';
import { translationsEs } from './es';
import { translationsZh } from './zh';
import { translationsJa } from './ja';
import { translationsIt } from './it';
import { translationsDe } from './de';
import { translationsPt } from './pt';
import { translationsTr } from './tr';

export type TranslationKeys = keyof typeof translationsEn;
export type LanguageCode = 'ar' | 'de' | 'en' | 'es' | 'fr' | 'it' | 'ja' | 'pt' | 'tr' | 'zh';

export const translations: Record<LanguageCode, Record<string, string>> = {
  en: translationsEn,
  ar: translationsAr,
  fr: translationsFr,
  es: translationsEs,
  zh: translationsZh,
  ja: translationsJa,
  it: translationsIt,
  de: translationsDe,
  pt: translationsPt,
  tr: translationsTr,
};
