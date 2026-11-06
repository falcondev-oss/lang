---
title: How it works
description: 'Why lang uses the English source text as the key, how the types carry every translation, and what happens at runtime when you read a text.'
---

Most i18n libraries split a text in three: a key in the code, the English text in one JSON file, the translations in others. lang keeps them together.

## The source text is the key

```ts
t('Save', { de: 'Speichern' })
```

`Save` is both the English text and the key you read it by: `text.Save`. You never invent a key like `common.actions.save`, and the code reads like the UI it renders. When a text is long or its wording changes often, give it a [custom key](/guide/texts#custom-keys).

## Translations are checked by the compiler

The second argument of `t()` is typed as a record of every other configured language. A missing language, an unknown one or a string where a function is expected are type errors at the line that has the problem. There is no extraction step and no "missing key" warning at runtime, because a missing translation never compiles.

## The type is the translation table

A text's type is a union of all its translations:

```ts
const save = useLang().common.Save
//    ^? '[en]: Save' | '[de]: Speichern'
```

Hovering any text in the editor shows every language. At runtime the value is the plain text of the current language (`'Speichern'`), and it is assignable to `string`.

## Reading is cheap

`useLang()` resolves a subtree for one language and caches it per subtree and language. The result is frozen and keeps its identity, so calling `useLang` in every component is fine, and React can use the result as a dependency.

## No codegen, no JSON

Translations are TypeScript. They are bundled like any other module, tree-shaken like any other module, and refactored with the editor's rename. Splitting them into files is up to you, see [Organizing translations](/guide/organizing).
