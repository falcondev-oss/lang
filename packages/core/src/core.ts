import type { Exact, IsUnion, Simplify, SingleKeyObject } from 'type-fest'

// Symbol.for so translations stay recognized if the package is loaded twice (ESM + CJS)
const tSymbol = Symbol.for('@falcondev-oss/lang/translation')

/** A text with parameters, e.g. `(p: { max: number }) => \`Max ${p.max}\``. */
// oxlint-disable-next-line typescript/no-explicit-any -- any parameter type is allowed
export type TextFn<Params = any> = (params: Params) => string

/** One text in one language: a string, or a function for texts with parameters. */
export type Text = string | TextFn

/** Any (nested) object of translations, as built with `t()`, `group()` and plain object literals. */
export type TranslationTree = Record<string, object>

/**
 * Result type of `useLang()`: every translation becomes a string, or a function for texts with parameters.
 *
 * The string type lists all languages (`"[en]: Save" | "[de]: Speichern"`) so you can read the
 * translations when hovering in your editor. At runtime it is just the text of the current language.
 */
export type Translated<T, L extends string> =
  T extends Record<L, string>
    ? { [Lang in L]: `[${Lang}]: ${T[Lang]}` }[L]
    : T extends Record<L, TextFn<infer Params>>
      ? (params: Params) => string
      : T extends TranslationTree
        ? { readonly [K in keyof T]: Translated<T[K], L> }
        : never

export interface UseLang<T extends TranslationTree, L extends string> {
  /** All translations in the current language. */
  (): Translated<T, L>
  /** The subtree returned by `scope`, in the current language. */
  <Scoped extends TranslationTree>(scope: (translations: T) => Scoped): Translated<Scoped, L>
}

/** The part of a `createLang()` instance that framework adapters need. */
export type Lang<L extends string> = {
  readonly languages: readonly L[]
  createUseLang: <T extends TranslationTree>(currentLang: L, translations: T) => UseLang<T, L>
}

/** The base text of a `t()` call: the text itself, or the value of a `{ key: text }` object. */
type BaseText<Base> = Base extends Text ? Base : Base[keyof Base]

/** What the other languages must provide: a string, or a function with the same parameters. */
type OtherText<Base> = Base extends TextFn<infer Params> ? TextFn<Params> : string

type ItemKey<Item, L extends string, B extends L> = Item extends { _key: infer Key extends string }
  ? Key
  : Item extends Record<L, Text>
    ? Item[B] extends infer Key extends string
      ? Key
      : never
    : keyof Item & string

type DuplicateKeys<
  Items extends readonly unknown[],
  L extends string,
  B extends L,
  Seen = never,
> = Items extends readonly [infer Head, ...infer Rest]
  ? (ItemKey<Head, L, B> & Seen) | DuplicateKeys<Rest, L, B, Seen | ItemKey<Head, L, B>>
  : never

// Maps each `group()` argument to an error string if it is invalid. Intersected with the arguments,
// so the error shows up at the offending argument.
export type GroupCheck<Items extends readonly unknown[], L extends string, B extends L> = {
  [I in keyof Items]: [ItemKey<Items[I], L, B>] extends [never]
    ? Items[I] extends Record<L, Text>
      ? 'Texts with parameters need a key in group(): t({ key: (p) => ... }, ...)'
      : 'Nested object in group() must have exactly one key'
    : IsUnion<ItemKey<Items[I], L, B>> extends true
      ? 'Nested object in group() must have exactly one key'
      : ItemKey<Items[I], L, B> extends DuplicateKeys<Items, L, B>
        ? `Duplicate key in group(): ${ItemKey<Items[I], L, B>}`
        : unknown
}

export type GroupType<Items extends readonly object[], L extends string, B extends L> = Simplify<{
  [Item in Items[number] as ItemKey<Item, L, B>]: Item extends Record<L, Text>
    ? Item
    : Item[keyof Item]
}>

// Picked subtrees are cached per tree object and language, so repeated `useLang()` calls are cheap
// and return the same (frozen) object. That keeps references stable for React and Vue.
const pickCache = new WeakMap<object, Map<string, object>>()

function pickLang(tree: object, lang: string): object {
  let byLang = pickCache.get(tree)
  if (!byLang) pickCache.set(tree, (byLang = new Map()))

  const cached = byLang.get(lang)
  if (cached) return cached

  const picked = Object.freeze(
    Object.fromEntries(
      Object.entries(tree).map(([key, value]: [string, unknown]) => {
        if (typeof value !== 'object' || value === null)
          throw new Error(`Invalid translation object at key '${key}'`)

        if (tSymbol in value) {
          if (!(lang in value))
            throw new Error(`Missing translation for lang '${lang}' at '${key}'`)
          return [key, (value as Record<string, Text>)[lang]]
        }
        return [key, pickLang(value, lang)]
      }),
    ),
  )
  byLang.set(lang, picked)
  return picked
}

/**
 * Creates the translation helpers for a fixed set of languages.
 *
 * @param options.base - The language the source texts are written in.
 * @param options.languages - All supported languages.
 * @param options.current - Returns the current language. Only needed for `text()`.
 *
 * @example
 * export const { t, group, text, createUseLang } = createLang({
 *   base: 'en',
 *   languages: ['en', 'de'],
 *   current: () => getLocale(),
 * })
 */
export function createLang<
  const LanguageList extends readonly [string, ...string[]],
  const BaseLanguage extends LanguageList[number],
>({
  base: baseLanguage,
  languages,
  current,
}: {
  base: BaseLanguage
  languages: LanguageList
  current?: () => NoInfer<LanguageList[number]>
}) {
  type Languages = LanguageList[number]
  type TranslationObject = Record<Languages, Text>

  function assertLanguage(lang: string): asserts lang is Languages {
    if (!languages.includes(lang)) throw new Error(`Unsupported language: '${lang}'`)
  }

  /**
   * Defines one text. The first argument is the base-language text, the second the other languages.
   *
   * - Texts with parameters are arrow functions. The other languages get the same parameter type.
   * - Pass `{ key: text }` as the first argument to give the text a custom key inside `group()`.
   *
   * @example
   * t('Save', { de: 'Speichern' })
   * t({ cancel: 'Cancel' }, { de: 'Abbrechen' }) // key `cancel` instead of `Cancel`
   * t((p: { max: number }) => `At most ${p.max}`, { de: (p) => `Höchstens ${p.max}` })
   */
  function t<
    const Base extends Text | Record<string, Text>,
    const Others extends Exact<
      Record<Exclude<Languages, BaseLanguage>, OtherText<BaseText<Base>>>,
      Others
    >,
  >(base: Base & (Base extends Text ? unknown : SingleKeyObject<Base>), translations: Others) {
    const isKeyed = typeof base === 'object'
    const translation = {
      [baseLanguage]: isKeyed ? Object.values(base)[0] : base,
      ...(translations as object),
      ...(isKeyed && { _key: Object.keys(base)[0] }),
      [tSymbol]: true,
    }
    return translation as unknown as Simplify<
      Readonly<
        Record<BaseLanguage, BaseText<Base>> &
          Others &
          (Base extends Text ? unknown : { _key: keyof Base })
      >
    >
  }

  type GroupItem = TranslationObject | TranslationTree

  /**
   * Collects texts into an object keyed by their base-language text (or custom key).
   * A single-key object nests a subtree under that key. Duplicate keys are a type error.
   *
   * @example
   * group(
   *   t('Save', { de: 'Speichern' }), // key `Save`
   *   t({ cancel: 'Cancel' }, { de: 'Abbrechen' }), // key `cancel`
   *   { confirm: group(t('Delete', { de: 'Löschen' })) }, // key `confirm`
   * )
   */
  function group<const Items extends readonly GroupItem[]>(
    ...items: Items & GroupCheck<Items, Languages, BaseLanguage>
  ) {
    const entries = items.map((item): [string, object] => {
      if (tSymbol in item) {
        const translation = item as TranslationObject & { _key?: string }
        const key = translation._key ?? translation[baseLanguage]
        if (typeof key !== 'string')
          throw new Error(
            'Texts with parameters need a key in group(): t({ key: (p) => ... }, ...)',
          )
        return [key, translation]
      }

      const keys = Object.keys(item)
      if (keys.length !== 1) throw new Error('Nested object in group() must have exactly one key')
      const key = keys[0]!
      return [key, (item as TranslationTree)[key]!]
    })

    const result = Object.fromEntries(entries)
    if (Object.keys(result).length !== entries.length) {
      const duplicate = entries.find(([key], i) => entries.findIndex(([k]) => k === key) !== i)
      throw new Error(`Duplicate key in group(): ${duplicate?.[0]}`)
    }
    return result as GroupType<Items, Languages, BaseLanguage>
  }

  /**
   * Binds a translation tree to a language. Returns `useLang()`, which picks the texts of that language.
   *
   * @example
   * const useLang = createUseLang('de', translations)
   * useLang().common.Save // 'Speichern'
   * useLang((all) => all.common).Save // 'Speichern'
   */
  function createUseLang<const T extends TranslationTree>(
    currentLang: Languages,
    translations: T,
  ): UseLang<T, Languages> {
    assertLanguage(currentLang)

    return ((scope?: (translations: T) => TranslationTree) =>
      pickLang(scope ? scope(translations) : translations, currentLang)) as UseLang<T, Languages>
  }

  /**
   * Turns one text into a function that returns it in the current language (from `current`), read
   * at call time. For code that runs outside of components, e.g. Zod error messages, which pass
   * the check values (`maximum`, `minimum`, ...) as parameters.
   *
   * @example
   * z.string().max(50, { error: text(validation.tooLong) })
   */
  function text<const T extends TranslationObject>(
    translation: T,
  ): T extends Record<Languages, string>
    ? () => Translated<T, Languages>
    : Translated<T, Languages> {
    if (!(tSymbol in translation)) throw new Error('text() expects a text created with t()')

    return ((params: unknown) => {
      if (!current) throw new Error('text() needs `current` in createLang()')
      const lang = current()
      assertLanguage(lang)
      const value = translation[lang]
      return typeof value === 'function' ? value(params) : value
    }) as never
  }

  return { t, group, text, createUseLang, languages, base: baseLanguage }
}
