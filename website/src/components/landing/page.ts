/** Hero headline, headings that decode in, the Zod form and the type-safety demo. */
import { Editor, ICON, esc, LANGS, sleep, type Language } from './code'
import { decode } from './decode'

/** The headline arrives through three other languages and lands in the page's language. */
export async function initHeadline(
  h1: HTMLElement,
  titles: Record<Language, string>,
  lang: Language,
) {
  const order = (['ja', 'es', 'pl', 'de', 'en'] as const).filter((l) => l !== lang).slice(0, 3)
  for (const l of [...order, lang]) {
    h1.textContent = titles[l]
    h1.lang = l
    decode(h1, { spread: 160, dur: 180 })
    if (l !== lang) await sleep(1300)
  }
}

/** Headings below the fold wait as blocks and decode once when they scroll in. */
export function initDecodeOnScroll(els: Iterable<HTMLElement>) {
  for (const el of els) {
    if (el.getBoundingClientRect().top < innerHeight) continue
    const play = decode(el, {
      wait: true,
      spread: Math.min(700, 120 + (el.textContent?.length ?? 0) * 4),
      dur: 380,
    })
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        play()
        io.disconnect()
      },
      { threshold: 0.6 },
    )
    io.observe(el)
  }
}

/** The form's messages in every language, read with lang on the server. */
export type ZodMessages = Record<
  Language,
  { required: string; invalidEmail: string; tooLong: string; tooShort: string }
>

export function initZodForm(
  form: HTMLFormElement,
  tabs: HTMLElement,
  schemaEl: HTMLElement,
  messages: ZodMessages,
  pageLang: Language,
) {
  // start in a language other than English, so the translation is visible
  let lang: Language = pageLang === 'en' ? 'de' : pageLang
  tabs.innerHTML = LANGS.map(
    (l) =>
      `<button type="button" aria-pressed="${l === lang}" data-l="${l}">${l.toUpperCase()}</button>`,
  ).join('')
  tabs.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('button')
    if (!b) return
    lang = (b.dataset['l'] ?? 'en') as Language
    for (const x of tabs.querySelectorAll('button')) x.setAttribute('aria-pressed', String(x === b))
    validate()
  })
  const schema = new Editor(schemaEl, 'schemas.ts', 'app + backend')
  const ids = ['a', 'b', 'c', 'd', 'name', 'n1', 'n2', 'email', 'password', 'e']
  void schema.set(
    [
      "import { z } from 'zod'",
      "import { text, validation } from './lang'",
      '',
      'export const signup = z.object({',
      '  name: z.string()',
      '    .min(1, { error: text(validation.required) })',
      '    .max(50, { error: text(validation.tooLong) }),',
      '  email: z.email({ error: text(validation.invalidEmail) }),',
      '  password: z.string().min(8, { error: text(validation.tooShort) }),',
      '})',
    ].map((text, i) => ({ id: ids[i] ?? String(i), text })),
    'instant',
  )
  function validate() {
    const v = Object.fromEntries(new FormData(form)) as Record<string, string>
    const name = v['name'] ?? ''
    const errs: Record<string, [keyof ZodMessages[Language], string] | null> = {
      name: !name.trim() ? ['required', 'n1'] : name.length > 50 ? ['tooLong', 'n2'] : null,
      email: !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(v['email'] ?? '')
        ? ['invalidEmail', 'email']
        : null,
      password: (v['password'] ?? '').length < 8 ? ['tooShort', 'password'] : null,
    }
    for (const r of schema.recs) r.el.classList.remove('hl')
    for (const [field, e] of Object.entries(errs)) {
      const input = form.elements.namedItem(field) as HTMLInputElement
      const msg = input.nextElementSibling as HTMLElement
      input.setAttribute('aria-invalid', String(!!e))
      msg.innerHTML = e ? `${ICON.alert}<span>${esc(messages[lang][e[0]])}</span>` : ''
      msg.lang = lang
      if (e) schema.find(e[1])?.el.classList.add('hl')
    }
  }
  form.addEventListener('input', validate)
  validate()
}

export function initSafety(el: HTMLElement) {
  const ed = new Editor(el, 'lang/translations.ts', 'tsc')
  const full = [
    { id: 'o', text: 'export const app = group(' },
    { id: 'f', text: "  t('Add to cart', {" },
    { id: 'de', text: "    de: 'In den Warenkorb'," },
    { id: 'es', text: "    es: 'Añadir al carrito'," },
    { id: 'ja', text: "    ja: 'カートに追加'," },
    { id: 'pl', text: "    pl: 'Dodaj do koszyka'," },
    { id: 'c', text: '  }),' },
    { id: 'oc', text: ')' },
  ]
  void ed.set(full, 'instant')
  const io = new IntersectionObserver(
    async ([entry]) => {
      if (!entry?.isIntersecting) return
      io.disconnect()
      for (;;) {
        await sleep(900)
        await ed.set(
          full.filter((l) => l.id !== 'es'),
          'type',
        )
        ed.squiggle('f', "t('Add to cart', {")
        ed.tip(
          'f',
          `<span class="e">Property 'es' is missing</span> in type '{ de: string; ja: string; pl: string }'\nbut required in type 'Record<"de" | "es" | "ja" | "pl", string>'. ts(2741)`,
        )
        await sleep(3200)
        ed.tip(null)
        await ed.set(full, 'type', 34)
        ed.clearSquiggles()
        ed.flash('es')
        await sleep(3600)
      }
    },
    { threshold: 0.5 },
  )
  io.observe(el)
}

export function initCopy(buttons: Iterable<HTMLButtonElement>) {
  for (const b of buttons)
    b.addEventListener('click', () => {
      void navigator.clipboard?.writeText(b.dataset['copy'] ?? '')
    })
}
