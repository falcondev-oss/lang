---
title: Organizing translations
description: 'A folder layout for lang that scales: one setup file, translations grouped by feature, shared texts in common groups.'
---

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

- Import `t` and `group` from your `setup.ts`. Never call `createLang` twice.
- Put texts used in many places (`Save`, `Cancel`) in shared groups like `common.actions`.
- Group texts by screen or feature. A component reads its scope: `useLang((all) => all.pages.login)`.
- If two texts in one group have the same base text, `group()` reports a duplicate key. Give one a custom key.
