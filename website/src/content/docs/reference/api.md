---
title: API
description: 'Reference for @falcondev-oss/lang-core: createLang, t, group, text, createUseLang and the exported types.'
---

## `createLang({ base, languages, current? })`

Call it once per app or shared package and export the result.

- `languages`: every supported language code, as a non-empty array literal.
- `base`: the language the source texts are written in (usually `'en'`). Must be in `languages`.
- `current` (optional): a function that returns the current language. Only needed for `text()`.

Returns `{ t, group, text, createUseLang, languages, base }`. Pass the whole object to an adapter.

## `t(baseText, otherLanguages)`

One text. See [Texts](/guide/texts) and [Parameters](/guide/parameters).

| Form                                           | Key           |
| ---------------------------------------------- | ------------- |
| `t('Save', { de: 'Speichern' })`               | `'Save'`      |
| `t({ cancel: 'Cancel' }, { de: 'Abbrechen' })` | `cancel`      |
| `t((p: P) => string, { de: (p) => string })`   | property name |
| `t({ key: (p: P) => string }, { ... })`        | `key`         |

## `group(...items)`

Turns texts into an object keyed by base text or custom key. See [Groups](/guide/groups).

## `text(translation)`

Returns a function that reads the current language when called. See [Zod](/guide/zod).

## `createUseLang(language, translations)`

Binds a tree to one language. See [Reading texts](/guide/reading-texts).

## Types

| Type               | Meaning                                                                            |
| ------------------ | ---------------------------------------------------------------------------------- |
| `TranslationTree`  | Any object of texts, groups and nested objects.                                    |
| `Translated<T, L>` | `T` with every text turned into its string or function type (result of `useLang`). |
| `UseLang<T, L>`    | Type of the function returned by `createUseLang`.                                  |
| `Lang<L>`          | What adapters need from a `createLang()` result.                                   |
| `Text`             | One text in one language: `string` or `TextFn`.                                    |
| `TextFn<P>`        | A text with parameters: `(params: P) => string`.                                   |
