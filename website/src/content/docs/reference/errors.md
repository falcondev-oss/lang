---
title: Errors
description: 'Every runtime error lang throws, what causes it and how to fix it.'
---

Most mistakes are type errors first. These are the messages you see at runtime when types were bypassed or a value comes from outside.

| Message                                              | Cause                                                                |
| ---------------------------------------------------- | -------------------------------------------------------------------- |
| `Unsupported language: 'fr'`                         | `createUseLang` or `current` returned a language not in `languages`. |
| ``text() needs `current` in createLang()``           | `text()` was called but `createLang()` has no `current`.             |
| `text() expects a text created with t()`             | `text()` got a group or object instead of one text.                  |
| `Nested object in group() must have exactly one key` | An object passed to `group()` has zero or several keys.              |
| `Duplicate key in group(): Save`                     | Two items in one `group()` have the same key.                        |
| `Texts with parameters need a key in group()`        | A function text in `group()` has no custom key.                      |
| `Missing translation for lang 'de' at 'key'`         | A `t()` lacks a language (only possible by bypassing types).         |
| `Invalid translation object at key 'x'`              | A leaf in the tree is not a `t()` result.                            |
| `useLang() must be used inside <LangProvider>`       | React: `useLang()` was called outside of a provider.                 |
