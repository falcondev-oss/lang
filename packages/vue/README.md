# @falcondev-oss/lang-vue

Vue adapter for [`@falcondev-oss/lang-core`](https://github.com/falcondev-oss/lang/tree/main/packages/core):
type-safe i18n where the source text is the key. `useLang()` returns a `ComputedRef` that updates
when the language changes.

Read the core README first (`node_modules/@falcondev-oss/lang-core/README.md`). It explains
`t()`, `group()` and the types. This page only covers the Vue part.

## Installation

```bash
npm add @falcondev-oss/lang-core @falcondev-oss/lang-vue
```

## Usage

```ts
// lang/index.ts
import { createLang } from '@falcondev-oss/lang-core'
import { createUseLang } from '@falcondev-oss/lang-vue'
import { ref } from 'vue'

export const lang = createLang({ base: 'en', languages: ['en', 'de'] })
export const { t, group } = lang
export type Language = (typeof lang.languages)[number]

export const translations = {
  common: group(t('Save', { de: 'Speichern' })),
}

export const locale = ref<Language>('en')
export const useLang = createUseLang(lang, locale, translations)
```

```vue
<script setup lang="ts">
import { locale, useLang } from '~/lang'

const text = useLang((all) => all.common)

function toggleLanguage() {
  locale.value = locale.value === 'en' ? 'de' : 'en'
}
</script>

<template>
  <button>{{ text.Save }}</button>
  <button @click="toggleLanguage">Switch language</button>
</template>
```

## API

### `createUseLang(lang, currentLang, translations)`

- `lang`: the result of `createLang()`.
- `currentLang`: a ref or getter (`MaybeRefOrGetter`) with the current language. Must be typed as
  one of the configured languages. Use any source: a `ref`, a Pinia store getter, `useStorage`, ...
- `translations`: the translation tree.

Returns `useLang`:

```ts
useLang() // ComputedRef of the whole tree
useLang((all) => all.common) // ComputedRef of one subtree
```

The scope function runs inside the computed, so it may depend on reactive state. The computed
recalculates only when `currentLang` (or state read in the scope) changes, and the picked objects are
cached per language.

`useLang` does not need a component instance. You can call it in stores and plain modules.

### Server-side rendering

A module-level `ref` is shared between all requests on the server. In SSR apps keep the language
in per-request state and pass that ref or a getter for it as `currentLang`.
