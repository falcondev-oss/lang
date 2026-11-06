---
title: Texts
description: 'Write a text with t(): the English source text, every other language, custom keys for long texts, and the types that show all translations on hover.'
---

## `t(baseText, otherLanguages)`

```ts
t('Save', { de: 'Speichern' })
```

- The first argument is the text in the base language.
- The second argument must contain **every other language, and nothing else**. A missing or unknown language is a type error. With a single language, pass `{}`.
- Texts keep their literal types, so the editor shows every translation on hover.

## Custom keys

To use a key that differs from the base text, pass an object with one key:

```ts
t({ cancel: 'Cancel' }, { de: 'Abbrechen' }) // key `cancel`, text 'Cancel' / 'Abbrechen'
```

Use a custom key for long texts, or when the key must stay stable while the English text changes:

```ts
t(
  { confirmDelete: 'Do you really want to delete this entry?' },
  { de: 'Möchten Sie diesen Eintrag wirklich löschen?' },
)
```

## Types

The string type of a text lists all languages:

```ts
const text = useLang().common.Save
//    ^? '[en]: Save' | '[de]: Speichern'
```

This is a display aid. At runtime the value is the plain text of the current language, and it is assignable to `string`. Texts with [parameters](/guide/parameters) have the type `(params: P) => string`.

To type a value as "some text of this app", use `string`.
