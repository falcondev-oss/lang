import type { Lang, Translated, TranslationTree } from '@falcondev-oss/lang-core'
import type { ComputedRef, MaybeRefOrGetter } from 'vue'
import { computed, toValue } from 'vue'

export interface UseLang<T extends TranslationTree, L extends string> {
  /** All translations in the current language. Updates when the language changes. */
  (): ComputedRef<Translated<T, L>>
  /** The subtree returned by `scope`, in the current language. Updates when the language changes. */
  <Scoped extends TranslationTree>(
    scope: (translations: T) => Scoped,
  ): ComputedRef<Translated<Scoped, L>>
}

/**
 * Binds a translation tree to a reactive language. Returns `useLang()`, which gives a `ComputedRef`.
 *
 * @param lang - The instance returned by `createLang()` from `@falcondev-oss/lang-core`.
 * @param currentLang - A ref or getter with the current language.
 * @param translations - The translation tree.
 *
 * @example
 * const locale = ref<'en' | 'de'>('en')
 * export const useLang = createUseLang(lang, locale, translations)
 *
 * // in a component
 * const text = useLang((all) => all.common)
 * text.value.Save
 */
export function createUseLang<L extends string, const T extends TranslationTree>(
  lang: Lang<L>,
  currentLang: MaybeRefOrGetter<NoInfer<L>>,
  translations: T,
): UseLang<T, L> {
  return ((scope?: (translations: T) => TranslationTree) =>
    computed(() => {
      const useLang = lang.createUseLang(toValue(currentLang), translations)
      return scope ? useLang(scope) : useLang()
    })) as UseLang<T, L>
}
