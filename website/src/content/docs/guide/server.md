---
title: Backend and emails
description: 'Use the same translations on the server: pass the recipient language explicitly for emails, and read the request language with AsyncLocalStorage for Zod errors.'
---

A server handles many users at once, so there is no global language. Pass the recipient's language explicitly:

```ts
const mail = createUseLang(user.locale, translations)((all) => all.mails.welcome)

await sendMail({
  to: user.email,
  subject: mail.subject,
  text: mail.greeting({ name: user.name }),
})
```

## Translated Zod errors per request

For translated Zod errors on the server, let `current` read the language of the current request, for example from `AsyncLocalStorage` set in a tRPC or Hono middleware:

```ts
import { AsyncLocalStorage } from 'node:async_hooks'

const requestLocale = new AsyncLocalStorage<'en' | 'de'>()

createLang({
  base: 'en',
  languages: ['en', 'de'],
  current: () => requestLocale.getStore() ?? 'en',
})
```

The schema module stays the same in app and backend, see [Zod](/guide/zod).
