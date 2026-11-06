---
title: Groups and nesting
description: 'Build the translation tree with group() and plain objects: texts keyed by their English text, nested subtrees, and the errors group() reports.'
---

## `group(...items)`

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

## Plain objects

Outside of `group()` any plain object structures texts. Mix freely:

```ts
export const translations = {
  common: { actions, errors }, // plain object
  modules: {
    Base: { name: t('Base', { de: 'Basis' }) },
  } satisfies Record<ModuleSlug, { name: object }>, // e.g. force a key per enum value
}
```

Every leaf must be a `t()` result. A plain string as a leaf throws when it is read, and its type becomes `never` (a string directly in the top-level object is a type error).

## Reading a group

`useLang()` takes a scope function and returns that subtree, typed down to every text:

```ts
const text = useLang((all) => all.checkout)
text.title
text.actions['Pay now']
```

Autocomplete lists the keys of each level, and hovering a key shows its translations.
