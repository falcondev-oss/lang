import type { Lang, TranslationTree, UseLang } from '@falcondev-oss/lang-core'
import type { ReactNode } from 'react'
import { createContext, createElement, useContext } from 'react'

export type LangProviderProps<L extends string> = {
  /** The current language. Change it to re-render every `useLang()` consumer. */
  lang: L
  children?: ReactNode
}

/**
 * Binds a translation tree to a React context. Works in React DOM and React Native.
 *
 * @param lang - The instance returned by `createLang()` from `@falcondev-oss/lang-core`.
 * @param translations - The translation tree.
 * @returns `LangProvider`, which sets the current language, and the `useLang()` hook.
 *
 * @example
 * export const { LangProvider, useLang } = createLangContext(lang, translations)
 *
 * <LangProvider lang={locale}><App /></LangProvider>
 *
 * // in a component
 * const text = useLang((all) => all.common)
 * text.Save
 */
export function createLangContext<L extends string, const T extends TranslationTree>(
  lang: Lang<L>,
  translations: T,
) {
  const LangContext = createContext<L | undefined>(undefined)

  function LangProvider({ lang: current, children }: LangProviderProps<L>) {
    return createElement(LangContext.Provider, { value: current }, children)
  }

  const useLang = ((scope?: (translations: T) => TranslationTree) => {
    const current = useContext(LangContext)
    if (current === undefined) throw new Error('useLang() must be used inside <LangProvider>')

    const useLangFor = lang.createUseLang(current, translations)
    return scope ? useLangFor(scope) : useLangFor()
  }) as UseLang<T, L>

  return { LangProvider, useLang }
}
