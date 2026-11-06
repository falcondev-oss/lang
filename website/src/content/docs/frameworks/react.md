---
title: React and React Native
description: 'The React adapter for lang: createLangContext returns a LangProvider and a useLang hook. Works the same in React DOM and React Native.'
---

```sh
npm add @falcondev-oss/lang-core @falcondev-oss/lang-react
```

Works the same in React DOM and React Native. The adapter only imports `react`.

## Usage

```ts title="lang/index.ts"
import { createLang } from '@falcondev-oss/lang-core'
import { createLangContext } from '@falcondev-oss/lang-react'

export const lang = createLang({ base: 'en', languages: ['en', 'de'] })
export const { t, group } = lang
export type Language = (typeof lang.languages)[number]

export const translations = {
  common: group(t('Save', { de: 'Speichern' })),
}

export const { LangProvider, useLang } = createLangContext(lang, translations)
```

```tsx title="App.tsx"
import { useState } from 'react'
import type { Language } from './lang'
import { LangProvider, useLang } from './lang'

export function App() {
  const [locale, setLocale] = useState<Language>('en')
  return (
    <LangProvider lang={locale}>
      <SaveButton />
      <button onClick={() => setLocale(locale === 'en' ? 'de' : 'en')}>Switch language</button>
    </LangProvider>
  )
}

function SaveButton() {
  const text = useLang((all) => all.common)
  return <button>{text.Save}</button>
}
```

In React Native, render `<Text>{text.Save}</Text>` the same way.

## `createLangContext(lang, translations)`

- `lang`: the result of `createLang()`.
- `translations`: the translation tree.

Returns:

- `LangProvider`: a component with the props `lang` (one of the configured languages) and `children`. Every `useLang()` below it re-renders when `lang` changes.
- `useLang`: the hook.

```ts
useLang() // whole tree in the current language
useLang((all) => all.common) // one subtree
```

`useLang()` throws `useLang() must be used inside <LangProvider>` outside of a provider. The returned object is cached per subtree and language, so it keeps its identity between renders and is safe in dependency arrays.

Where the language comes from (device locale, user setting, storage) is up to you. Pass the value to `LangProvider`.
