# @falcondev-oss/lang

<a href="https://npmjs.org/package/@falcondev-oss/lang-core" title="View this project on NPM"><img src="https://img.shields.io/npm/v/@falcondev-oss/lang-core.svg?label=lang-core" alt="NPM version" /></a>
<a href="https://npmjs.org/package/@falcondev-oss/lang-vue" title="View this project on NPM"><img src="https://img.shields.io/npm/v/@falcondev-oss/lang-vue.svg?label=lang-vue" alt="NPM version" /></a>
<a href="https://npmjs.org/package/@falcondev-oss/lang-react" title="View this project on NPM"><img src="https://img.shields.io/npm/v/@falcondev-oss/lang-react.svg?label=lang-react" alt="NPM version" /></a>

Type-safe i18n where the source text is the key. Every text is written once, next to its
translations, and read back fully typed. No codegen, no JSON files, no string paths.

```ts
import { createLang } from '@falcondev-oss/lang-core'

const { t, group, createUseLang } = createLang({ base: 'en', languages: ['en', 'de'] })

const translations = {
  common: group(t('Save', { de: 'Speichern' }), t('Invalid date', { de: 'Ungültiges Datum' })),
}

const useLang = createUseLang('de', translations)
useLang((all) => all.common)['Invalid date'] // 'Ungültiges Datum'
```

A missing translation is a type error, and hovering a text shows all its translations.

## Packages

| Package                                       | For                                       |
| --------------------------------------------- | ----------------------------------------- |
| [`@falcondev-oss/lang-core`](packages/core)   | Defining texts; framework-agnostic usage  |
| [`@falcondev-oss/lang-vue`](packages/vue)     | Vue: `useLang()` returns a `ComputedRef`  |
| [`@falcondev-oss/lang-react`](packages/react) | React and React Native: provider and hook |

Start with the [core README](packages/core/README.md). It is the full guide.

## Development

```bash
pnpm install
pnpm test        # Vitest, including type tests (*.test-d.ts)
pnpm type-check  # tsc --build over all packages and tests
pnpm lint
pnpm build
```

## Credits

The API is based on the design by [Julian Meinking (DrJume)](https://github.com/DrJume).
