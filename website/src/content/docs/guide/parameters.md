---
title: Parameters
description: 'Texts with numbers, names or dates are typed arrow functions. Plurals and Intl formatting are plain code, and every language gets the same parameter type.'
---

A text that needs values is an arrow function with a typed parameter. The other languages are arrow functions too and get the same parameter type automatically:

```ts
t((p: { max: number }) => `Value must not be greater than ${p.max}`, {
  de: (p) => `Wert darf nicht größer als ${p.max} sein`,
})
```

- `p` in `de` is typed from the base text. A typo like `p.maxi` is a type error.
- If the base text is a function, every language must be a function, and the other way round.
- Inside `group()` a function has no text to use as key, so it needs a custom key: `t({ tooLarge: (p: { max: number }) => ... }, { de: (p) => ... })`. In plain objects the property name is the key anyway.

## Reading

`useLang()` returns these texts as functions:

```ts
const form = useLang((all) => all.form)
form.tooLarge({ max: 5 }) // 'Wert darf nicht größer als 5 sein'
form.tooLarge({}) // type error: max is missing
```

## Plurals

It is plain code, so a ternary does the job, and each language can follow its own rules:

```ts
t((p: { count: number }) => (p.count === 1 ? '1 stone' : `${p.count} stones`), {
  de: (p) => (p.count === 1 ? '1 Stein' : `${p.count} Steine`),
})
```

For languages with more plural forms, use `Intl.PluralRules` inside the function.

## Intl formatting

Numbers, currencies and dates format per language with the built-in `Intl` APIs:

```ts
const money = (sum: number, locale: string) =>
  new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(sum)

t((p: { sum: number }) => `Total: ${money(p.sum, 'en')}`, {
  de: (p) => `Gesamt: ${money(p.sum, 'de')}`, // 'Gesamt: 1.249,50 €'
})
```
