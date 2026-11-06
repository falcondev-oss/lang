/** The nine cases of the playground. Code is shown and edited exactly as written here. */
const L = (...lines: string[]) => lines.join('\n')
const SETUP = "import { group, t } from './setup'"

const vue = (group: string, ...template: string[]) =>
  L(
    '<script setup lang="ts">',
    "import { useLang } from './lang'",
    '',
    `const text = useLang((all) => all.${group})`,
    '</' + 'script>',
    '',
    '<template>',
    ...template,
    '</template>',
  )
const react = (name: string, group: string, ...jsx: string[]) =>
  L(
    "import { useLang } from './lang'",
    '',
    `export function ${name}() {`,
    `  const text = useLang((all) => all.${group})`,
    ...(jsx.length > 1
      ? ['  return (', '    <>', ...jsx.map((x) => `      ${x}`), '    </>', '  )']
      : [`  return ${jsx[0]}`]),
    '}',
  )

type Files = { trans?: string; vue?: string; react?: string }
export type Item = {
  id:
    | 'migrate'
    | 'groups'
    | 'complete'
    | 'customKey'
    | 'params'
    | 'plurals'
    | 'zod'
    | 'outside'
    | 'exercise'
  title: string
  sub: string
  files: [string] | [string, string]
  fw?: string
  tag?: 'tryIt' | 'fixIt'
  script?: 'migrate' | 'complete'
  exercise?: boolean
  start?: Files
  trans: string
  vue?: string
  react?: string
  use?: string
}

export const ITEMS: Item[] = [
  {
    id: 'migrate',
    title: 'Migrate existing code',
    sub: "'I need help'",
    files: ['Support.vue', 'Support.tsx'],
    script: 'migrate',
    start: {
      trans: L(SETUP, '', 'export const support = group(', ')'),
      vue: L('<template>', '  <button>I need help</button>', '</template>'),
      react: L('export function Support() {', '  return <button>I need help</button>', '}'),
    },
    trans: L(
      SETUP,
      '',
      'export const support = group(',
      "  t('I need help', {",
      "    de: 'Ich brauche Hilfe',",
      "    es: 'Necesito ayuda',",
      "    ja: '助けが必要です',",
      "    pl: 'Potrzebuję pomocy',",
      '  }),',
      ')',
    ),
    vue: vue('support', "  <button>{{ text['I need help'] }}</button>"),
    react: react('Support', 'support', "<button>{text['I need help']}</button>"),
  },
  {
    id: 'groups',
    title: 'Groups and nesting',
    sub: 'useLang((all) => all.checkout)',
    files: ['Checkout.vue', 'Checkout.tsx'],
    trans: L(
      SETUP,
      '',
      'export const checkout = {',
      "  title: t('Checkout', { de: 'Kasse', es: 'Pagar', ja: 'お会計', pl: 'Kasa' }),",
      '  actions: group(',
      "    t('Pay now', { de: 'Jetzt bezahlen', es: 'Pagar ahora', ja: '今すぐ支払う', pl: 'Zapłać teraz' }),",
      "    t('Back', { de: 'Zurück', es: 'Volver', ja: '戻る', pl: 'Wstecz' }),",
      '  ),',
      '}',
    ),
    vue: vue(
      'checkout',
      '  <h2>{{ text.title }}</h2>',
      "  <button>{{ text.actions['Pay now'] }}</button>",
      '  <button class="ghost">{{ text.actions.Back }}</button>',
    ),
    react: react(
      'Checkout',
      'checkout',
      '<h2>{text.title}</h2>',
      "<button>{text.actions['Pay now']}</button>",
      '<button className="ghost">{text.actions.Back}</button>',
    ),
  },
  {
    id: 'complete',
    title: 'Autocomplete',
    sub: 'text. lists every text, typed',
    files: ['Editor.vue', 'Editor.tsx'],
    script: 'complete',
    tag: 'tryIt',
    start: {
      vue: vue('editor', '  <button>{{  }}</button>'),
      react: react('Editor', 'editor', '<button>{}</button>'),
    },
    trans: L(
      SETUP,
      '',
      'export const editor = group(',
      "  t('Save changes', { de: 'Änderungen speichern', es: 'Guardar cambios', ja: '変更を保存', pl: 'Zapisz zmiany' }),",
      "  t('Discard', { de: 'Verwerfen', es: 'Descartar', ja: '破棄', pl: 'Odrzuć' }),",
      "  t('Preview', { de: 'Vorschau', es: 'Vista previa', ja: 'プレビュー', pl: 'Podgląd' }),",
      ')',
    ),
    vue: vue('editor', "  <button>{{ text['Save changes'] }}</button>"),
    react: react('Editor', 'editor', "<button>{text['Save changes']}</button>"),
  },
  {
    id: 'customKey',
    title: 'Custom key for long texts',
    sub: 'text.confirmDelete',
    files: ['Entries.vue', 'Entries.tsx'],
    trans: L(
      SETUP,
      '',
      'export const entries = group(',
      "  t({ confirmDelete: 'Do you really want to delete this entry?' }, {",
      "    de: 'Möchtest du diesen Eintrag wirklich löschen?',",
      "    es: '¿Seguro que quieres eliminar esta entrada?',",
      "    ja: 'この項目を本当に削除しますか？',",
      "    pl: 'Czy na pewno chcesz usunąć ten wpis?',",
      '  }),',
      ')',
    ),
    vue: vue('entries', '  <Dialog>{{ text.confirmDelete }}</Dialog>'),
    react: react('Entries', 'entries', '<Dialog>{text.confirmDelete}</Dialog>'),
  },
  {
    id: 'params',
    title: 'Parameters',
    sub: 'text.greeting({ name })',
    files: ['Account.vue', 'Account.tsx'],
    trans: L(
      SETUP,
      '',
      'export const account = group(',
      '  t({ greeting: (p: { name: string }) => `Hello, ${p.name}` }, {',
      '    de: (p) => `Hallo, ${p.name}`,',
      '    es: (p) => `Hola, ${p.name}`,',
      '    ja: (p) => `こんにちは、${p.name}さん`,',
      '    pl: (p) => `Cześć, ${p.name}`,',
      '  }),',
      ')',
    ),
    vue: vue('account', '  <h1>{{ text.greeting({ name: user.name }) }}</h1>'),
    react: react('Account', 'account', '<h1>{text.greeting({ name: user.name })}</h1>'),
  },
  {
    id: 'plurals',
    title: 'Plurals',
    sub: 'plain code, no ICU',
    files: ['Inbox.vue', 'Inbox.tsx'],
    trans: L(
      SETUP,
      '',
      'export const inbox = group(',
      "  t({ unread: (p: { count: number }) => (p.count === 1 ? '1 new message' : `${p.count} new messages`) }, {",
      "    de: (p) => (p.count === 1 ? '1 neue Nachricht' : `${p.count} neue Nachrichten`),",
      "    es: (p) => (p.count === 1 ? '1 mensaje nuevo' : `${p.count} mensajes nuevos`),",
      '    ja: (p) => `新着メッセージ ${p.count} 件`,',
      "    pl: (p) => (p.count === 1 ? '1 nowa wiadomość' : p.count < 5 ? `${p.count} nowe wiadomości` : `${p.count} nowych wiadomości`),",
      '  }),',
      ')',
    ),
    vue: vue('inbox', '  <Badge>{{ text.unread({ count: inbox.length }) }}</Badge>'),
    react: react('Inbox', 'inbox', '<Badge>{text.unread({ count: inbox.length })}</Badge>'),
  },
  {
    id: 'zod',
    title: 'Zod error messages',
    sub: 'text(validation.tooLong)',
    files: ['schemas.ts'],
    fw: 'Vue + React',
    trans: L(
      SETUP,
      '',
      'export const validation = {',
      '  tooLong: t((p: { maximum: number | bigint }) => `At most ${p.maximum} characters`, {',
      '    de: (p) => `Höchstens ${p.maximum} Zeichen`,',
      '    es: (p) => `Como máximo ${p.maximum} caracteres`,',
      '    ja: (p) => `${p.maximum}文字以内で入力してください`,',
      '    pl: (p) => `Maksymalnie ${p.maximum} znaków`,',
      '  }),',
      '}',
    ),
    use: L(
      "import { text, validation } from './lang'",
      '',
      'export const signup = z.object({',
      '  name: z.string().max(50, { error: text(validation.tooLong) }),',
      '})',
    ),
  },
  {
    id: 'outside',
    title: 'Outside of components',
    sub: 'text(errors.offline)()',
    files: ['network.ts'],
    fw: 'any module',
    trans: L(
      SETUP,
      '',
      'export const errors = {',
      "  offline: t('You are offline', {",
      "    de: 'Du bist offline',",
      "    es: 'Estás sin conexión',",
      "    ja: 'オフラインです',",
      "    pl: 'Jesteś offline',",
      '  }),',
      '}',
    ),
    use: L(
      "import { errors, text } from './lang'",
      '',
      '// no component, no hook: the language is read at call time',
      "addEventListener('offline', () => {",
      '  toast(text(errors.offline)())',
      '})',
    ),
  },
  {
    id: 'exercise',
    title: 'Your turn',
    sub: 'the ja translation is missing',
    files: ['Feedback.vue', 'Feedback.tsx'],
    tag: 'fixIt',
    exercise: true,
    trans: L(
      SETUP,
      '',
      'export const feedback = group(',
      "  t('Something went wrong', {",
      "    de: 'Etwas ist schiefgelaufen',",
      "    es: 'Algo salió mal',",
      '    ',
      "    pl: 'Coś poszło nie tak',",
      '  }),',
      ')',
    ),
    vue: vue('feedback', "  <Toast>{{ text['Something went wrong'] }}</Toast>"),
    react: react('Feedback', 'feedback', "<Toast>{text['Something went wrong']}</Toast>"),
  },
]
