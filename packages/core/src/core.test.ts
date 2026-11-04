import { describe, expect, test } from 'vitest'

import { createLang } from './core'

const { t, group, createUseLang } = createLang({ base: 'en', languages: ['en', 'de'] })

const translations = {
  common: group(t('Save', { de: 'Speichern' }), t({ cancel: 'Cancel' }, { de: 'Abbrechen' }), {
    confirm: group(t('Delete', { de: 'Löschen' })),
  }),
  page: {
    title: t('Welcome', { de: 'Willkommen' }),
  },
}

test('selects nested translations with or without a scope', () => {
  const useLang = createUseLang('de', translations)
  const common = {
    Save: 'Speichern',
    cancel: 'Abbrechen',
    confirm: { Delete: 'Löschen' },
  }

  expect(useLang()).toEqual({ common, page: { title: 'Willkommen' } })
  expect(useLang((all) => all.common)).toEqual(common)
})

test('base language returns the source text', () => {
  const useLang = createUseLang('en', translations)

  expect(useLang((all) => all.common)).toEqual({
    Save: 'Save',
    cancel: 'Cancel',
    confirm: { Delete: 'Delete' },
  })
})

test('returns the same frozen object for repeated calls', () => {
  const useLang = createUseLang('de', translations)
  const common = useLang((all) => all.common)

  expect(useLang((all) => all.common)).toBe(common)
  expect(useLang().common).toBe(common)
  expect(Object.isFrozen(common)).toBe(true)
  expect(createUseLang('en', translations)((all) => all.common)).not.toBe(common)
})

describe('errors', () => {
  test('unsupported language', () => {
    // @ts-expect-error not a configured language
    expect(() => createUseLang('fr', translations)).toThrow("Unsupported language: 'fr'")
  })

  test('nested group object with more than one key', () => {
    // @ts-expect-error also a type error
    expect(() => group({ a: {}, b: {} })).toThrow(
      'Nested object in group() must have exactly one key',
    )
  })

  test('duplicate key in group', () => {
    const save = t('Save', { de: 'Speichern' })
    // @ts-expect-error also a type error
    expect(() => group(save, save)).toThrow('Duplicate key in group(): Save')
  })

  test('text with parameters without key in group', () => {
    const max = t((p: { max: number }) => `Max ${p.max}`, { de: (p) => `Max ${p.max}` })
    // @ts-expect-error also a type error
    expect(() => group(max)).toThrow('Texts with parameters need a key in group()')
  })

  test('missing translation at runtime', () => {
    const broken = { x: t('Hi', {} as { de: string }) }
    expect(() => createUseLang('de', broken)()).toThrow("Missing translation for lang 'de'")
  })

  test('non-object leaf', () => {
    const broken = { x: 'plain string' } as unknown as Record<string, object>
    expect(() => createUseLang('de', broken)()).toThrow("Invalid translation object at key 'x'")
  })
})

test('texts with parameters', () => {
  const form = {
    tooLarge: t((p: { max: number }) => `Value must not be greater than ${p.max}`, {
      de: (p) => `Wert darf nicht größer als ${p.max} sein`,
    }),
    rules: group(
      t(
        { between: (p: { min: number; max: number }) => `Between ${p.min} and ${p.max}` },
        {
          de: (p) => `Zwischen ${p.min} und ${p.max}`,
        },
      ),
    ),
  }
  const de = createUseLang('de', form)()
  const en = createUseLang('en', form)()

  expect(de.tooLarge({ max: 5 })).toBe('Wert darf nicht größer als 5 sein')
  expect(en.tooLarge({ max: 5 })).toBe('Value must not be greater than 5')
  expect(de.rules.between({ min: 1, max: 10 })).toBe('Zwischen 1 und 10')
})

test('a single language needs no second argument entries', () => {
  const single = createLang({ base: 'en', languages: ['en'] })
  const useLang = single.createUseLang('en', single.group(single.t('Hello', {})))
  expect(useLang()).toEqual({ Hello: 'Hello' })
})
