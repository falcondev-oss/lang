---
title: Reading texts
description: 'createUseLang binds a translation tree to a language. Pick a subtree with a scope function; results are cached, frozen and keep their identity.'
---

## `createUseLang(language, translations)`

Binds a translation tree to one language and returns `useLang`:

```ts
const useLang = createUseLang('de', translations)
useLang() // the whole tree in German
useLang((all) => all.login) // only the `login` subtree
```

- `language` must be one of `languages` (a type error, and a runtime error for unknown values).
- The scope function must return a subtree (an object), not a single text. Read single texts from the result: `useLang((all) => all.login).title`.
- Results are cached per subtree and language and frozen. Calling `useLang` again returns the same object, so it is cheap to call often and safe as a React dependency.

`createUseLang` has a fixed language. To switch languages at runtime, call it again with the new language, or use an adapter:

- [Vue](/frameworks/vue): `useLang()` returns a `ComputedRef` that follows a ref or getter.
- [React](/frameworks/react): `useLang()` reads the language from `LangProvider`.
