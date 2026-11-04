# @falcondev-oss/lang-core

Type-safe i18n where the source text is the key. You write every text once, next to its
translations, and read it back fully typed. No codegen, no JSON files, no string paths.

```ts
t('Invalid date', { de: 'Ungültiges Datum' })
```

This package is framework-agnostic. For reactive language switching use an adapter:

- Vue: [`@falcondev-oss/lang-vue`](https://github.com/falcondev-oss/lang/tree/main/packages/vue)
- React and React Native:
  [`@falcondev-oss/lang-react`](https://github.com/falcondev-oss/lang/tree/main/packages/react)

## Installation

```bash
npm add @falcondev-oss/lang-core
```

## Quick start

```ts
// lang/setup.ts
import { createLang } from '@falcondev-oss/lang-core'

export const lang = createLang({ base: 'en', languages: ['en', 'de'] })
export const { t, group, createUseLang } = lang
export type Language = (typeof lang.languages)[number] // 'en' | 'de'
```

```ts
// lang/translations.ts
import { group, t } from './setup'

export const translations = {
  common: group(
    t('Save', { de: 'Speichern' }),
    t('Cancel', { de: 'Abbrechen' }),
    t(
      { confirm_delete: 'Do you really want to delete this entry?' },
      {
        de: 'Möchten Sie diesen Eintrag wirklich löschen?',
      },
    ),
  ),
  login: {
    title: t('Sign in', { de: 'Anmelden' }),
    errors: group(t('Invalid email address', { de: 'Ungültige E-Mail-Adresse' })),
  },
}
```

```ts
import { createUseLang } from './setup'
import { translations } from './translations'

const useLang = createUseLang('de', translations)

useLang().common.Save // 'Speichern'
useLang((all) => all.common).confirm_delete // 'Möchten Sie diesen Eintrag wirklich löschen?'
useLang((all) => all.login).errors['Invalid email address'] // 'Ungültige E-Mail-Adresse'
```

## Concepts

### `createLang({ base, languages, current? })`

Call it once per app or shared package and export the result.

- `languages`: every supported language code, as a non-empty array literal.
- `base`: the language the source texts are written in (usually `'en'`). Must be in `languages`.
- `current` (optional): a function that returns the current language. Only needed for `text()`.

Returns `{ t, group, text, createUseLang, languages, base }`. Pass the whole object to an adapter.

### `t(baseText, otherLanguages)`: one text

```ts
t('Save', { de: 'Speichern' })
```

- The first argument is the text in the base language.
- The second argument must contain **every other language, and nothing else**. A missing or
  unknown language is a type error. With a single language, pass `{}`.
- Texts keep their literal types, so the editor shows every translation on hover.

To use a key that differs from the base text, pass a single-key object:

```ts
t({ cancel: 'Cancel' }, { de: 'Abbrechen' }) // key `cancel`, text 'Cancel' / 'Abbrechen'
```

Use a custom key for long texts or when the key must stay stable while the English text changes.

### Texts with parameters

A text that needs values (numbers, names, dates) is an arrow function with a typed parameter. The
other languages are arrow functions too and get the same parameter type automatically:

```ts
t((p: { max: number }) => `Value must not be greater than ${p.max}`, {
  de: (p) => `Wert darf nicht größer als ${p.max} sein`,
})
```

- `p` in `de` is typed from the base text. A typo like `p.maxi` is a type error.
- If the base text is a function, every language must be a function (and vice versa).
- Inside `group()` a function has no text to use as key, so it needs a custom key:
  `t({ tooLarge: (p: { max: number }) => ... }, { de: (p) => ... })`. In plain objects the property
  name is the key anyway.
- Plain code, so anything goes: `Intl.NumberFormat`, plurals with a ternary, etc.

```ts
t((p: { count: number }) => (p.count === 1 ? '1 stone' : `${p.count} stones`), {
  de: (p) => (p.count === 1 ? '1 Stein' : `${p.count} Steine`),
})
```

`useLang()` returns these as functions:

```ts
const form = useLang((all) => all.form)
form.tooLarge({ max: 5 }) // 'Wert darf nicht größer als 5 sein'
form.tooLarge({}) // type error: max is missing
```

### `group(...items)`: many texts under their own keys

`group()` turns a list of texts into an object. Each text's key is its base text, or its custom key.

```ts
const actions = group(
  t('Save', { de: 'Speichern' }), // key 'Save'
  t({ cancel: 'Cancel' }, { de: 'Abbrechen' }), // key 'cancel'
)
// actions.Save, actions.cancel
```

To nest a subtree inside a group, pass an object with **exactly one key**:

```ts
const errors = group(
  t('Permission missing', { de: 'Fehlende Berechtigung' }),
  { simple: group(t('Retry', { de: 'Erneut versuchen' })) }, // key 'simple'
  { toasts: { title: t('An error occurred', { de: 'Ein Fehler ist aufgetreten' }) } }, // key 'toasts'
)
```

Invalid arguments are a type error at the argument, and throw at runtime:

- an object with zero or several keys: `Nested object in group() must have exactly one key`
- two items with the same key: `Duplicate key in group(): Save`
- a text with parameters without custom key: `Texts with parameters need a key in group()`

### Plain objects

Outside of `group()` you can use any plain object to structure texts. Mix freely:

```ts
export const translations = {
  common: { actions, errors }, // plain object
  modules: {
    Base: { name: t('Base', { de: 'Basis' }) },
  } satisfies Record<ModuleSlug, { name: object }>, // e.g. force a key per enum value
}
```

Every leaf must be a `t()` result. A plain string as a leaf throws when it is read, and its type
becomes `never` (a string directly in the top-level object is a type error).

### `createUseLang(language, translations)`

Binds a translation tree to one language and returns `useLang`:

```ts
const useLang = createUseLang('de', translations)
useLang() // the whole tree in German
useLang((all) => all.login) // only the `login` subtree
```

- `language` must be one of `languages` (type error, and a runtime error for unknown values).
- The scope function must return a subtree (an object), not a single text. Read single texts
  from the result: `useLang((all) => all.login).title`.
- Results are cached per subtree and language and frozen. Calling `useLang` again returns the same
  object, so it is cheap to call often and safe as a React dependency.

`createUseLang` has a fixed language. To switch languages at runtime, call it again with the new
language, or use an adapter.

### `text(translation)`: texts outside of components, Zod

`text()` turns one text into a function that returns it in the current language. The language is
read from `current` **when the function is called**, not when it is created. So you can define it
once at module level, for example in a Zod schema that is shared by app and backend.

A text function is already a valid Zod error message: Zod calls it with the values of the check
(`maximum`, `minimum`, `input`, ...). The parameter type is checked against the Zod issue, so a
wrong name is a type error in the schema.

```ts
// lang/setup.ts
export const { t, group, text, createUseLang } = createLang({
  base: 'en',
  languages: ['en', 'de'],
  current: () => getLocale(), // your store: a variable, Zustand, a Vue ref, ...
})

// lang/validation.ts
export const validation = {
  tooLong: t((p: { maximum: number | bigint }) => `At most ${p.maximum} characters`, {
    de: (p) => `Höchstens ${p.maximum} Zeichen`,
  }),
  invalidEmail: t('Invalid email address', { de: 'Ungültige E-Mail-Adresse' }),
}

// schemas.ts
export const signupSchema = z.object({
  name: z.string().max(50, { error: text(validation.tooLong) }), // 'Höchstens 50 Zeichen'
  email: z.email({ error: text(validation.invalidEmail) }),
})
```

- Zod types `maximum` / `minimum` as `number | bigint`, so declare the parameter that way.
- Texts without parameters become `() => string`. Zod accepts them too.
- The message is created in the language that is current at parse time. A shown error does not
  switch language until the field is validated again.
- Zod's own default messages ("Expected string") are translated by Zod: `z.config(z.locales.de())`.
- Outside of Zod: `text(validation.invalidEmail)()` or `text(validation.tooLong)({ maximum: 5 })`,
  e.g. in a toast from an event handler.

In the app, `current` should read the same state you pass to the adapter (`LangProvider lang`, or
the Vue ref), kept outside of React so code outside of components can read it.

## Backend and emails

A server handles many users at once, so there is no global language. Pass the recipient's language
explicitly:

```ts
const mail = createUseLang(user.locale, translations)((all) => all.mails.welcome)
await sendMail({ to: user.email, subject: mail.subject, text: mail.greeting({ name: user.name }) })
```

For translated Zod errors on the server, let `current` read the language of the current request,
for example from `AsyncLocalStorage` set in a tRPC or Hono middleware:

```ts
const requestLocale = new AsyncLocalStorage<'en' | 'de'>()
createLang({ base: 'en', languages: ['en', 'de'], current: () => requestLocale.getStore() ?? 'en' })
```

## Types

The string type of a text lists all languages, so hovering shows every translation:

```ts
const text = useLang().common.Save
//    ^? '[en]: Save' | '[de]: Speichern'
```

This is a display aid. At runtime the value is the plain text of the current language
(`'Speichern'`). It is assignable to `string`. Texts with parameters have the type
`(params: P) => string`.

Exported types:

| Type               | Meaning                                                                            |
| ------------------ | ---------------------------------------------------------------------------------- |
| `TranslationTree`  | Any object of texts, groups and nested objects.                                    |
| `Translated<T, L>` | `T` with every text turned into its string or function type (result of `useLang`). |
| `UseLang<T, L>`    | Type of the function returned by `createUseLang`.                                  |
| `Lang<L>`          | What adapters need from a `createLang()` result.                                   |
| `Text`             | One text in one language: `string` or `TextFn`.                                    |
| `TextFn<P>`        | A text with parameters: `(params: P) => string`.                                   |

To type a value as "some text of this app", use `string`.

## Organizing translations

A layout that scales:

```
lang/
  setup.ts            createLang(), exports t, group, createUseLang, Language
  translations/
    index.ts          export const translations = { common, pages, ... }
    common/
      index.ts        export const common = { actions, errors, ... }
      actions.ts      export const actions = group(t(...), ...)
    pages/
      login.ts
```

- Import `t` and `group` from your `setup.ts`, never call `createLang` twice.
- Put texts used in many places (`Save`, `Cancel`) in shared groups like `common.actions`.
- Group texts by screen or feature. A component reads its scope: `useLang((all) => all.pages.login)`.
- If two texts in one group have the same base text, `group()` reports a duplicate key. Give one a
  custom key.

## Errors

| Message                                              | Cause                                                                |
| ---------------------------------------------------- | -------------------------------------------------------------------- |
| `Unsupported language: 'fr'`                         | `createUseLang` or `current` returned a language not in `languages`. |
| ``text() needs `current` in createLang()``           | `text()` was called but `createLang()` has no `current`.             |
| `text() expects a text created with t()`             | `text()` got a group or object instead of one text.                  |
| `Nested object in group() must have exactly one key` | An object passed to `group()` has zero or several keys.              |
| `Duplicate key in group(): Save`                     | Two items in one `group()` have the same key.                        |
| `Texts with parameters need a key in group()`        | A function text in `group()` has no custom key.                      |
| `Missing translation for lang 'de' at 'key'`         | A `t()` lacks a language (only possible by bypassing types).         |
| `Invalid translation object at key 'x'`              | A leaf in the tree is not a `t()` result.                            |
