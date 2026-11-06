---
title: Zod and texts outside components
description: 'text() turns a translation into a function that reads the current language when called: a valid Zod error message, typed against the issue, usable in any module.'
---

## `text(translation)`

`text()` turns one text into a function that returns it in the current language. The language is read from `current` **when the function is called**, not when it is created. So you can define it once at module level, for example in a Zod schema shared by app and backend.

`text()` needs `current` in `createLang()`:

```ts title="lang/setup.ts"
export const { t, group, text, createUseLang } = createLang({
  base: 'en',
  languages: ['en', 'de'],
  current: () => getLocale(), // your store: a variable, Zustand, a Vue ref, ...
})
```

In the app, `current` should read the same state you pass to the adapter (`LangProvider lang`, or the Vue ref), kept outside of React so code outside of components can read it.

## Zod error messages

A text function is already a valid Zod error message. Zod calls it with the values of the check (`maximum`, `minimum`, `input`, ...). The parameter type is checked against the Zod issue, so a wrong name is a type error in the schema.

```ts title="lang/validation.ts"
export const validation = {
  tooLong: t((p: { maximum: number | bigint }) => `At most ${p.maximum} characters`, {
    de: (p) => `Höchstens ${p.maximum} Zeichen`,
  }),
  invalidEmail: t('Invalid email address', { de: 'Ungültige E-Mail-Adresse' }),
}
```

```ts title="schemas.ts"
export const signupSchema = z.object({
  name: z.string().max(50, { error: text(validation.tooLong) }), // 'Höchstens 50 Zeichen'
  email: z.email({ error: text(validation.invalidEmail) }),
})
```

- Zod types `maximum` and `minimum` as `number | bigint`, so declare the parameter that way.
- Texts without parameters become `() => string`. Zod accepts them too.
- The message is created in the language that is current at parse time. A shown error does not switch language until the field is validated again.
- Zod's own default messages ("Expected string") are translated by Zod: `z.config(z.locales.de())`.

## Outside of Zod

Call the function yourself, for example in a toast from an event handler:

```ts
text(validation.invalidEmail)()
text(validation.tooLong)({ maximum: 5 })
```
