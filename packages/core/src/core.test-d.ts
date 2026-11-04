import type { Lang, UseLang } from './core'
import { describe, expectTypeOf, test } from 'vitest'

import { createLang } from './core'

const lang = createLang({ base: 'en', languages: ['en', 'de', 'fr'] })
const { t, group, createUseLang } = lang

describe('t()', () => {
  test('requires every non-base language', () => {
    t('Save', { de: 'Speichern', fr: 'Enregistrer' })
    // @ts-expect-error fr missing
    t('Save', { de: 'Speichern' })
    // @ts-expect-error base language must not be repeated
    t('Save', { en: 'Save', de: 'Speichern', fr: 'Enregistrer' })
    // @ts-expect-error unknown language
    t('Save', { de: 'Speichern', fr: 'Enregistrer', es: 'Guardar' })
  })

  test('custom key needs exactly one key', () => {
    t({ save: 'Save' }, { de: 'Speichern', fr: 'Enregistrer' })
    // @ts-expect-error two keys
    t({ save: 'Save', other: 'Other' }, { de: 'Speichern', fr: 'Enregistrer' })
  })

  test('keeps literal texts', () => {
    expectTypeOf(t('Save', { de: 'Speichern', fr: 'Enregistrer' })).toEqualTypeOf<{
      readonly en: 'Save'
      readonly de: 'Speichern'
      readonly fr: 'Enregistrer'
    }>()
    expectTypeOf(t({ save: 'Save' }, { de: 'Speichern', fr: 'Enregistrer' })).toEqualTypeOf<{
      readonly en: 'Save'
      readonly de: 'Speichern'
      readonly fr: 'Enregistrer'
      readonly _key: 'save'
    }>()
  })
})

describe('group()', () => {
  test('keys by base text, custom key or nested key', () => {
    const g = group(
      t('Save', { de: 'Speichern', fr: 'Enregistrer' }),
      t({ cancel: 'Cancel' }, { de: 'Abbrechen', fr: 'Annuler' }),
      { nested: group(t('Delete', { de: 'Löschen', fr: 'Supprimer' })) },
    )
    expectTypeOf<keyof typeof g>().toEqualTypeOf<'Save' | 'cancel' | 'nested'>()
    expectTypeOf<keyof typeof g.nested>().toEqualTypeOf<'Delete'>()
  })

  test('reports invalid arguments', () => {
    const save = t('Save', { de: 'Speichern', fr: 'Enregistrer' })
    const max = t((p: { max: number }) => `Max ${p.max}`, {
      de: (p) => `${p.max}`,
      fr: (p) => `${p.max}`,
    })
    group(
      save,
      { nested: {} },
      t(
        { max: (p: { max: number }) => `Max ${p.max}` },
        { de: (p) => `${p.max}`, fr: (p) => `${p.max}` },
      ),
    )

    // @ts-expect-error nested object with two keys
    group(save, { a: {}, b: {} })
    // @ts-expect-error empty nested object
    group(save, {})
    // @ts-expect-error duplicate text
    group(save, save)
    // @ts-expect-error nested key collides with text
    group(save, { Save: {} })
    // @ts-expect-error text with parameters needs a key
    group(save, max)
  })

  test('rejects strings', () => {
    // @ts-expect-error raw strings are not translations
    group('Save')
  })
})

describe('texts with parameters', () => {
  test('other languages get the same parameter type', () => {
    t((p: { max: number }) => `Max ${p.max}`, {
      de: (p) => {
        expectTypeOf(p).toEqualTypeOf<{ max: number }>()
        return `Max ${p.max}`
      },
      fr: (p) => `Max ${p.max}`,
    })
    // @ts-expect-error unknown parameter
    t((p: { max: number }) => `Max ${p.max}`, { de: (p) => `Max ${p.maxi}`, fr: (p) => `${p.max}` })
    // @ts-expect-error string where a function is required
    t((p: { max: number }) => `Max ${p.max}`, { de: 'Max', fr: (p) => `${p.max}` })
    // @ts-expect-error function where a string is required
    t('Max', { de: (p: { max: number }) => `Max ${p.max}`, fr: 'Max' })
  })

  test('useLang returns a typed function', () => {
    const useLang = createUseLang('de', {
      form: {
        tooLarge: t((p: { max: number }) => `Max ${p.max}`, {
          de: (p) => `Max ${p.max}`,
          fr: (p) => `Max ${p.max}`,
        }),
      },
    })
    expectTypeOf(useLang().form.tooLarge).toEqualTypeOf<(params: { max: number }) => string>()
    // @ts-expect-error missing parameter
    useLang().form.tooLarge({})
  })
})

describe('createUseLang()', () => {
  const translations = {
    common: group(t('Save', { de: 'Speichern', fr: 'Enregistrer' })),
    page: { title: t('Welcome', { de: 'Willkommen', fr: 'Bienvenue' }) },
  }
  const useLang = createUseLang('de', translations)

  test('only accepts configured languages', () => {
    // @ts-expect-error es not configured
    createUseLang('es', translations)
  })

  test('strings show all languages', () => {
    expectTypeOf(useLang().common.Save).toEqualTypeOf<
      '[en]: Save' | '[de]: Speichern' | '[fr]: Enregistrer'
    >()
    expectTypeOf(useLang().common.Save).toExtend<string>()
  })

  test('scope narrows the result', () => {
    expectTypeOf(useLang((all) => all.page)).toEqualTypeOf<{
      readonly title: '[en]: Welcome' | '[de]: Willkommen' | '[fr]: Bienvenue'
    }>()
  })

  test('scope must return a subtree, not a single text', () => {
    // @ts-expect-error a single translation is not a tree
    useLang((all) => all.page.title)
  })

  test('instance is assignable to Lang', () => {
    expectTypeOf(lang).toExtend<Lang<'en' | 'de' | 'fr'>>()
    expectTypeOf(useLang).toEqualTypeOf<UseLang<typeof translations, 'en' | 'de' | 'fr'>>()
  })
})

test('plain objects mix with groups (layout used in PR #262)', () => {
  const errors = group(
    t('Permission missing', { de: 'Fehlende Berechtigung', fr: 'Permission manquante' }),
    {
      toasts: {
        unexpected_error: {
          title: t('An unexpected error has occurred', {
            de: 'Ein unerwarteter Fehler ist aufgetreten',
            fr: 'Une erreur inattendue est survenue',
          }),
        },
      },
    },
  )
  const useLang = createUseLang('de', { common: { errors } })

  expectTypeOf(useLang((all) => all.common.errors.toasts.unexpected_error).title).toEqualTypeOf<
    | '[en]: An unexpected error has occurred'
    | '[de]: Ein unerwarteter Fehler ist aufgetreten'
    | '[fr]: Une erreur inattendue est survenue'
  >()
  expectTypeOf(useLang().common.errors['Permission missing']).toExtend<string>()
})
