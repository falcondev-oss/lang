// Compiled with declaration emit by `tsc --build`: exporting the helpers must work (TS5088 regression).
import { createLang } from '../index'

export const lang = createLang({ base: 'en', languages: ['en', 'de'], current: () => 'en' })
export const { t, group, text, createUseLang } = lang
export const common = group(t('Save', { de: 'Speichern' }))
