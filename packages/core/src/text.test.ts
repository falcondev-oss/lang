import { describe, expect, expectTypeOf, test } from 'vitest'
import { z } from 'zod'

import { createLang } from './core'

let locale: 'en' | 'de' = 'en'
const { t, text } = createLang({ base: 'en', languages: ['en', 'de'], current: () => locale })

const validation = {
  tooLong: t((p: { maximum: number | bigint }) => `At most ${p.maximum} characters`, {
    de: (p) => `Höchstens ${p.maximum} Zeichen`,
  }),
  tooSmall: t((p: { minimum: number | bigint }) => `Must be at least ${p.minimum}`, {
    de: (p) => `Muss mindestens ${p.minimum} sein`,
  }),
  invalidEmail: t('Invalid email address', { de: 'Ungültige E-Mail-Adresse' }),
}

const schema = z.object({
  name: z.string().max(3, { error: text(validation.tooLong) }),
  age: z.number().min(18, { error: text(validation.tooSmall) }),
  email: z.email({ error: text(validation.invalidEmail) }),
})
const invalid = { name: 'Johnny', age: 3, email: 'nope' }
const messages = () => schema.safeParse(invalid).error?.issues.map((issue) => issue.message)

describe('text()', () => {
  test('Zod messages get the check values and the current language at parse time', () => {
    locale = 'en'
    expect(messages()).toEqual([
      'At most 3 characters',
      'Must be at least 18',
      'Invalid email address',
    ])

    locale = 'de'
    expect(messages()).toEqual([
      'Höchstens 3 Zeichen',
      'Muss mindestens 18 sein',
      'Ungültige E-Mail-Adresse',
    ])
  })

  test('works outside of Zod', () => {
    locale = 'de'
    expect(text(validation.invalidEmail)()).toBe('Ungültige E-Mail-Adresse')
    expect(text(validation.tooLong)({ maximum: 5 })).toBe('Höchstens 5 Zeichen')
  })

  test('types', () => {
    expectTypeOf(text(validation.tooLong)).toEqualTypeOf<
      (params: { maximum: number | bigint }) => string
    >()
    expectTypeOf(text(validation.invalidEmail)).toEqualTypeOf<
      () => '[en]: Invalid email address' | '[de]: Ungültige E-Mail-Adresse'
    >()

    // @ts-expect-error parameter names must match the Zod issue
    z.string().max(3, { error: text(validation.tooSmall) })
    // @ts-expect-error only single texts, not trees
    expect(() => text(validation)).toThrow('text() expects a text created with t()')
  })

  test('errors', () => {
    const noCurrent = createLang({ base: 'en', languages: ['en', 'de'] })
    const hi = noCurrent.t('Hi', { de: 'Hallo' })
    expect(() => noCurrent.text(hi)()).toThrow('text() needs `current` in createLang()')

    const wrong = createLang({ base: 'en', languages: ['en', 'de'], current: () => 'fr' as 'de' })
    expect(() => wrong.text(wrong.t('Hi', { de: 'Hallo' }))()).toThrow("Unsupported language: 'fr'")
  })
})
