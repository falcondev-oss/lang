import { createLang } from '@falcondev-oss/lang-core'
import { expect, expectTypeOf, test } from 'vitest'
import { ref } from 'vue'

import { createUseLang } from './index'

const lang = createLang({ base: 'en', languages: ['en', 'de'] })
const { t, group } = lang

const translations = {
  common: group(t('Save', { de: 'Speichern' })),
}

test('follows the current language', () => {
  const locale = ref<'en' | 'de'>('en')
  const useLang = createUseLang(lang, locale, translations)

  const all = useLang()
  const common = useLang((tree) => tree.common)
  expect(all.value.common.Save).toBe('Save')
  expect(common.value.Save).toBe('Save')

  locale.value = 'de'
  expect(all.value.common.Save).toBe('Speichern')
  expect(common.value.Save).toBe('Speichern')
})

test('accepts a getter', () => {
  const locale = ref<'en' | 'de'>('de')
  const useLang = createUseLang(lang, () => locale.value, translations)
  expect(useLang().value.common.Save).toBe('Speichern')
})

test('types', () => {
  const useLang = createUseLang(lang, ref<'en' | 'de'>('en'), translations)
  expectTypeOf(useLang((tree) => tree.common).value.Save).toEqualTypeOf<
    '[en]: Save' | '[de]: Speichern'
  >()

  // @ts-expect-error fr is not a configured language
  createUseLang(lang, ref<'en' | 'fr'>('fr'), translations)
})
