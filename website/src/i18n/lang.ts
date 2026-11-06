/** The site translates itself with lang. */
import { createLang } from '@falcondev-oss/lang-core'

export const lang = createLang({ base: 'en', languages: ['en', 'de', 'es', 'ja', 'pl'] })
export const { t, group, createUseLang } = lang
export type Language = (typeof lang.languages)[number]

export const LABELS: Record<Language, string> = {
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  ja: '日本語',
  pl: 'Polski',
}

/** Path prefix of a language: English lives at the root. */
export const prefix = (l: Language) => (l === 'en' ? '' : `/${l}`)
