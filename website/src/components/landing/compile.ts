/**
 * A stand-in for lang's t() and group() that runs the code typed into the playground, plus the
 * checks TypeScript would make on it. Not the real compiler: it covers the cases the playground shows.
 */
import { esc, ICON, isIdent, show, OTHER, type Language, type Mark } from './code'

type Fn = (p: Record<string, unknown>) => string
export type Rec = {
  __t: true
  key: string | null
  en: unknown
  others: Record<string, unknown>
  isFn: boolean
  sig: { name: string; body: string; props: string[] } | undefined
  custom: boolean
  line: number
}
export type Tree = { [key: string]: Tree | Rec }
type Node = Tree | Rec | null | undefined

const LOCALES: Record<string, string> = {
  en: 'en-US',
  de: 'de-DE',
  es: 'es-ES',
  ja: 'ja-JP',
  pl: 'pl-PL',
}
const money = (n: number, l: string) =>
  new Intl.NumberFormat(LOCALES[l] ?? l, { style: 'currency', currency: 'EUR' }).format(n)

export const isRec = (n: unknown): n is Rec => typeof n === 'object' && n !== null && '__t' in n
export const isGroup = (n: unknown): n is Tree =>
  typeof n === 'object' && n !== null && !('__t' in n)

export const typeName = (node: Node) => {
  if (!isGroup(node)) return 'never'
  const keys = Object.keys(node)
  return `{ ${keys
    .slice(0, 3)
    .map((k) => (isIdent(k) ? k : `'${k}'`))
    .join('; ')}${keys.length > 3 ? '; …' : ''} }`
}

export function compileTrans(src: string) {
  const lines = src.split('\n')
  const errors: Mark[] = []
  const err = (line: number, word: string | null, msg: string) => {
    const text = lines[line] ?? ''
    let a = word ? text.indexOf(word) : -1
    const b = a >= 0 && word ? a + word.length : text.length
    if (a < 0) a = Math.max(0, text.search(/\S/))
    errors.push({ line, range: [a, Math.max(b, a + 1)], msg })
  }
  const tLines: number[] = []
  lines.forEach((l, i) => {
    if (/(^|[^\w.])t\(/.test(l) && !/^\s*\/\//.test(l)) tLines.push(i)
  })
  const sigs = [...src.matchAll(/\((\w+)\s*:\s*\{([^}]*)\}\)\s*=>/g)].map((m) => ({
    name: m[1] ?? 'p',
    body: (m[2] ?? '').trim(),
    props: (m[2] ?? '')
      .split(/[;,]/)
      .map((s) => s.split(':')[0]?.trim() ?? '')
      .filter(Boolean),
  }))
  const js = src
    .replace(/^\s*import\b.*$/gm, '')
    .replace(/\bexport\s+/g, '')
    .replace(/\((\w+)\s*:\s*\{[^}]*\}\)\s*=>/g, '($1) =>')
  const names = [...js.matchAll(/\b(?:const|let)\s+(\w+)/g)].map((m) => m[1])
  const langLine = (from: number, l: string) => {
    if (new RegExp(`\\b${l}\\s*:`).test(lines[from] ?? '')) return from
    for (let i = from + 1; i < lines.length; i++) {
      if (new RegExp(`^\\s*${l}\\s*:`).test(lines[i] ?? '')) return i
      if (tLines.includes(i)) break
    }
    return from
  }

  let call = 0
  let fnCall = 0
  function t(base: unknown, othersArg: unknown): Rec {
    const line = tLines[call++] ?? 0
    let key: string | null = null
    let en = base
    let custom = false
    if (base && typeof base === 'object') {
      key = Object.keys(base)[0] ?? null
      en = key ? (base as Record<string, unknown>)[key] : undefined
      custom = true
    } else if (typeof base === 'string') key = base
    const isFn = typeof en === 'function'
    const sig = isFn ? sigs[fnCall++] : undefined
    const others =
      othersArg && typeof othersArg === 'object' ? (othersArg as Record<string, unknown>) : {}
    const kind = isFn ? `(p: { ${sig?.body ?? ''} }) => string` : 'string'
    const present = Object.keys(others).filter((k) => (OTHER as readonly string[]).includes(k))
    const missing = OTHER.filter((l) => !(l in others))
    if (missing.length)
      err(
        line,
        't(',
        `Property '${missing[0]}' is missing in type '{ ${present.map((k) => `${k}: ${isFn ? '(p) => string' : 'string'}`).join('; ')} }' but required in type 'Record<"de" | "es" | "ja", ${kind}>'.`,
      )
    for (const k of Object.keys(others))
      if (!(OTHER as readonly string[]).includes(k))
        err(
          langLine(line, k),
          k,
          `Object literal may only specify known properties, and '${k}' does not exist in type 'Record<"de" | "es" | "ja", ${kind}>'.`,
        )
    for (const l of present) {
      const v = others[l]
      if (isFn && typeof v !== 'function')
        err(langLine(line, l), l, `Type 'string' is not assignable to type '${kind}'.`)
      if (!isFn && typeof v === 'function')
        err(langLine(line, l), l, `Type '(p) => string' is not assignable to type 'string'.`)
    }
    if (isFn && sig)
      for (const [l, f] of [['en', en] as const, ...present.map((l) => [l, others[l]] as const)]) {
        if (typeof f !== 'function') continue
        for (const m of String(f).matchAll(/\bp\.(\w+)/g))
          if (m[1] && !sig.props.includes(m[1]))
            err(
              l === 'en' ? line : langLine(line, l),
              `.${m[1]}`,
              `Property '${m[1]}' does not exist on type '{ ${sig.body} }'.`,
            )
      }
    return { __t: true, key, en, others, isFn, sig, custom, line }
  }
  function group(...items: unknown[]) {
    const out: Tree = {}
    for (const it of items) {
      if (isRec(it)) {
        if (it.isFn && !it.custom) {
          err(it.line, 't(', 'Texts with parameters need a key in group().')
          continue
        }
        if (it.key === null) continue
        if (it.key in out) err(it.line, 't(', `Duplicate key in group(): ${it.key}`)
        out[it.key] = it
      } else if (isGroup(it)) {
        const keys = Object.keys(it)
        const only = keys[0]
        if (keys.length !== 1 || !only)
          errors.push({ msg: 'Nested object in group() must have exactly one key.' })
        else out[only] = it[only]!
      }
    }
    return out
  }

  let tree: Tree = {}
  try {
    // the playground runs the code the visitor typed, in their own browser
    // oxlint-disable-next-line typescript/no-implied-eval
    const run = new Function('t', 'group', 'money', `${js}\n;return {${names.join(',')}}`) as (
      ...a: unknown[]
    ) => Tree
    tree = run(t, group, money)
  } catch (e) {
    const error = e as Error
    errors.push({ msg: `${error.name}: ${error.message}` })
  }
  return { tree, errors }
}

export type Ctx = Record<string, Record<string, unknown>>
export const evalArgs = (src: string, ctx: Ctx) =>
  // oxlint-disable-next-line typescript/no-implied-eval
  (new Function(...Object.keys(ctx), `return (${src})`) as (...a: unknown[]) => unknown)(
    ...Object.values(ctx),
  )

export type El = {
  tag?: string
  attrs?: string
  kind?: 'field' | 'toast'
  rec?: Rec
  args?: Record<string, unknown>
  argsSrc?: string | undefined
  plain?: string
  empty?: boolean
  error?: boolean
}

/** Reads a component (or module) and finds what it renders. */
export function compileUse(src: string, tree: Tree, ctx: Ctx) {
  const lines = src.split('\n')
  const errors: Mark[] = []
  const els: El[] = []
  const err = (line: number, word: string, msg: string) => {
    const text = lines[line] ?? ''
    let a = word ? text.indexOf(word) : -1
    const b = a >= 0 ? a + word.length : text.length
    if (a < 0) a = Math.max(0, text.search(/\S/))
    errors.push({ line, range: [a, b], msg })
  }
  let scope: Tree | null = null
  lines.forEach((ln, i) => {
    const m = /useLang\(\(\s*(\w+)\s*\)\s*=>\s*(\w+)((?:\.\w*)*)\s*\)/.exec(ln)
    if (!m) return
    let node: Node = tree
    for (const seg of (m[3] ?? '').split('.').slice(1)) {
      if (isGroup(node) && seg in node) node = node[seg]
      else {
        err(
          i,
          seg || '.',
          seg
            ? `Property '${seg}' does not exist on type '${typeName(node)}'.`
            : 'Identifier expected.',
        )
        node = null
        break
      }
    }
    if (node && !isGroup(node)) {
      err(
        i,
        (m[3] ?? '').split('.').pop() ?? '',
        'useLang() picks a group, not a single text. Read the text from the group instead.',
      )
      node = null
    }
    scope = isGroup(node) ? node : null
  })
  const walk = (start: Node, segs: string[], i: number): Node => {
    let node = start
    for (const seg of segs) {
      if (isGroup(node) && seg in node) node = node[seg]
      else {
        err(i, seg, `Property '${seg}' does not exist on type '${typeName(node)}'.`)
        return null
      }
    }
    return node
  }
  const check = (rec: Rec, argsSrc: string | undefined, i: number, word: string) => {
    if (!rec.isFn) {
      if (argsSrc !== undefined)
        err(i, word, `This expression is not callable. Type 'string' has no call signatures.`)
      return
    }
    if (argsSrc === undefined)
      return err(
        i,
        word,
        `Type '(p: { ${rec.sig?.body} }) => string' is not assignable to type 'string'. Call it with its parameters.`,
      )
    let a: unknown
    try {
      a = evalArgs(argsSrc, ctx)
    } catch (e) {
      return err(i, argsSrc.trim() || word, (e as Error).message)
    }
    if (!a || typeof a !== 'object')
      return err(i, word, `Expected 1 argument of type '{ ${rec.sig?.body} }'.`)
    const missing = (rec.sig?.props ?? []).filter((p) => !(p in a))
    if (missing.length)
      err(
        i,
        word,
        `Property '${missing[0]}' is missing in type '{ ${Object.keys(a).join('; ')} }' but required in type '{ ${rec.sig?.body} }'.`,
      )
  }
  lines.forEach((ln, i) => {
    // text(validation.x): a Zod schema or a plain module, read from the root of the tree
    const z = /text\(\s*([\w.]+)\s*\)/.exec(ln)
    if (z?.[1]) {
      const rec = walk(tree, z[1].split('.'), i)
      if (isRec(rec)) {
        const limit = /\.(max|min)\((\d+)/.exec(ln)
        const args = limit ? { [limit[1] === 'max' ? 'maximum' : 'minimum']: Number(limit[2]) } : {}
        if (/\bz\./.test(ln)) els.push({ kind: 'field', rec, args })
        else {
          if (!/text\([^)]*\)\(\)/.test(ln))
            err(i, 'text(', 'text() returns a function. Call it to read the text: text(…)().')
          els.push({ kind: 'toast', rec, args })
        }
      } else if (rec)
        err(
          i,
          z[1].split('.').pop() ?? '',
          `Argument of type '${typeName(rec)}' is not assignable to a text created with t().`,
        )
      return
    }
    const m = /<([A-Za-z][\w-]*)([^>]*)>(.*)<\/\1>/.exec(ln)
    if (!m) return
    const tag = m[1] ?? ''
    const attrs = m[2] ?? ''
    const inner = (m[3] ?? '').trim()
    const mm = /^\{\{(.*)\}\}$/.exec(inner) ?? /^\{(.*)\}$/.exec(inner)
    if (!mm) return void els.push({ tag, attrs, plain: inner })
    const expr = (mm[1] ?? '').trim()
    if (!expr) return void els.push({ tag, attrs, empty: true })
    const em = /^text((?:\s*\.\s*\w+|\s*\[\s*'[^']*'\s*\])*)\s*(?:\(([\s\S]*)\))?$/.exec(expr)
    if (!em) {
      const name = expr.split(/[.[(\s]/)[0] || expr
      err(i, name, `Cannot find name '${name}'.`)
      return void els.push({ tag, attrs, error: true })
    }
    if (!scope) return void els.push({ tag, attrs, error: true })
    const segs = [...(em[1] ?? '').matchAll(/\.\s*(\w+)|\[\s*'([^']*)'\s*\]/g)].map(
      (x) => x[1] ?? x[2] ?? '',
    )
    const last = segs.at(-1) ?? 'text'
    if (!segs.length) {
      err(
        i,
        'text',
        `Type '${typeName(scope)}' is not assignable to type 'string'. Pick a text from the group.`,
      )
      return void els.push({ tag, attrs, error: true })
    }
    const rec = walk(scope, segs, i)
    if (!rec) return void els.push({ tag, attrs, error: true })
    if (!isRec(rec)) {
      err(
        i,
        last,
        `Type '${typeName(rec)}' is not assignable to type 'string'. Pick a text from the group.`,
      )
      return void els.push({ tag, attrs, error: true })
    }
    check(rec, em[2], i, last)
    els.push({ tag, attrs, rec, argsSrc: em[2] })
  })
  return { errors, els, scope: scope as Tree | null }
}

const bad = (label: string) => `<span class="ui-bad">${ICON.x}${esc(label)}</span>`

/** One rendered element in one language. */
export function renderEl(el: El, l: Language, ctx: Ctx, broken: boolean) {
  if (el.empty) return '<span class="ui-none">empty</span>'
  if (el.error || broken) return bad('type error')
  let s: string
  if (el.plain !== undefined) s = el.plain
  else {
    const rec = el.rec!
    const v = l === 'en' ? rec.en : rec.others[l]
    if (v === undefined) return bad(`missing '${l}'`)
    if (typeof v === 'function') {
      try {
        s = String(
          (v as Fn)(
            (el.args ?? (el.argsSrc !== undefined ? evalArgs(el.argsSrc, ctx) : {})) as Record<
              string,
              unknown
            >,
          ),
        )
      } catch {
        return bad('type error')
      }
    } else if (rec.isFn) return bad('type error')
    else s = show(v)
  }
  const text = `<span class="tx">${esc(s)}</span>`
  if (el.kind === 'field')
    return `<span class="ui ui-field"><span class="ui-in">Maria Fernanda Concepción de los Ángeles…</span><span class="ui-msg">${ICON.alert}${text}</span></span>`
  if (el.kind === 'toast') return `<span class="ui ui-toast">${ICON.wifi}${text}</span>`
  switch (el.tag) {
    case 'button':
      return `<span class="ui ui-btn${/ghost/.test(el.attrs ?? '') ? ' ghost' : ''}">${text}</span>`
    case 'h1':
    case 'h2':
    case 'h3':
      return `<span class="ui ui-h">${text}</span>`
    case 'Badge':
      return `<span class="ui ui-badge">${ICON.inbox}${text}</span>`
    case 'Toast':
      return `<span class="ui ui-toast">${ICON.alert}${text}</span>`
    case 'Dialog':
      return `<span class="ui ui-dialog">${ICON.trash}${text}</span>`
    case 'strong':
      return `<span class="ui ui-total">${text}</span>`
    case 'a':
      return `<span class="ui ui-link">${text}</span>`
    default:
      return `<span class="ui ui-meta">${text}</span>`
  }
}
