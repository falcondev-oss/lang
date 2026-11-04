import { createLang } from '@falcondev-oss/lang-core'
import { render, renderHook, screen } from '@testing-library/react'
import { expect, expectTypeOf, test } from 'vitest'

import { createLangContext } from './index'

const lang = createLang({ base: 'en', languages: ['en', 'de'] })
const { t, group } = lang

const translations = {
  common: group(t('Save', { de: 'Speichern' })),
}

const { LangProvider, useLang } = createLangContext(lang, translations)

function SaveButton() {
  const text = useLang((all) => all.common)
  return <button type="button">{text.Save}</button>
}

test('re-renders when the language changes', () => {
  const { rerender } = render(
    <LangProvider lang="en">
      <SaveButton />
    </LangProvider>,
  )
  expect(screen.getByRole('button').textContent).toBe('Save')

  rerender(
    <LangProvider lang="de">
      <SaveButton />
    </LangProvider>,
  )
  expect(screen.getByRole('button').textContent).toBe('Speichern')
})

test('keeps the same object between renders', () => {
  const { result, rerender } = renderHook(() => useLang((all) => all.common), {
    wrapper: ({ children }) => <LangProvider lang="de">{children}</LangProvider>,
  })
  const first = result.current
  rerender()
  expect(result.current).toBe(first)
})

test('throws outside of LangProvider', () => {
  expect(() => renderHook(() => useLang())).toThrow('useLang() must be used inside <LangProvider>')
})

test('types', () => {
  const useAll = () => useLang()
  expectTypeOf(useAll).returns.toEqualTypeOf<{
    readonly common: { readonly Save: '[en]: Save' | '[de]: Speichern' }
  }>()

  // @ts-expect-error fr is not a configured language
  ;<LangProvider lang="fr" />
})
