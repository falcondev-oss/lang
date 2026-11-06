/** Syntax highlighting and a small animated code editor for the landing page. */

export const LANGS = ['en', 'de', 'es', 'ja', 'pl'] as const
export const OTHER = ['de', 'es', 'ja', 'pl'] as const
export type Language = (typeof LANGS)[number]

export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
export const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
export const esc = (s: unknown) =>
  String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] ?? c)
/** Shows any value as text: strings as they are, everything else as JSON. */
export const show = (v: unknown) => (typeof v === 'string' ? v : JSON.stringify(v))
export const isIdent = (k: string) => /^[A-Za-z_$][\w$]*$/.test(k)

// ---------- highlighter ----------
type Token = { s: number; e: number; c: string }
const RULES: [string, RegExp][] = [
  ['com', /\/\/.*/y],
  ['str', /'(?:[^'\\\n]|\\.)*'?|"[^"\n]*"?/y],
  ['tpl', /`[^`]*`?/y],
  ['tag', /<\/?[A-Za-z][\w-]*|\/?>/y],
  ['pun', /\{\{|\}\}/y],
  ['kw', /\b(?:import|from|export|const|function|return|type)\b(?![:])/y],
  ['lng', /\b(?:de|es|ja|pl|en)(?=:)/y],
  ['type', /\b(?:string|number|bigint|boolean|Date)\b/y],
  ['fn', /[A-Za-z_$][\w$]*(?=\()/y],
  ['num', /\b\d+(?:\.\d+)?\b/y],
  ['id', /[A-Za-z_$][\w$]*/y],
  ['ws', /\s+/y],
  ['pun', /[^\sA-Za-z_$]/y],
]

export function tokenize(text: string): Token[] {
  const lang = /^\s*(de|es|ja|pl)\s*:/.exec(text)?.[1]
  const attr = /^\s*<script/.test(text)
  const out: Token[] = []
  let i = 0
  while (i < text.length) {
    let hit = false
    for (const [cls, re] of RULES) {
      re.lastIndex = i
      const m = re.exec(text)
      if (!m || !m[0].length) continue
      let c = cls
      if (cls === 'str') c = lang ? `str ${lang}` : attr ? 'str attr' : 'str'
      else if (cls === 'lng') c = `lng ${m[0]}`
      if (cls === 'tpl') {
        const stringClass = lang ? `str ${lang}` : 'str'
        let o = i
        for (const part of m[0].split(/(\$\{[^}]*\}?)/)) {
          if (!part) continue
          if (part.startsWith('${')) {
            out.push({ s: o, e: o + 2, c: 'interp' })
            for (const t of tokenize(part.slice(2).replace(/\}$/, '')))
              out.push({ s: o + 2 + t.s, e: o + 2 + t.e, c: t.c })
            if (part.endsWith('}'))
              out.push({ s: o + part.length - 1, e: o + part.length, c: 'interp' })
          } else out.push({ s: o, e: o + part.length, c: stringClass })
          o += part.length
        }
      } else out.push({ s: i, e: i + m[0].length, c })
      i += m[0].length
      hit = true
      break
    }
    if (!hit) {
      out.push({ s: i, e: i + 1, c: 'pun' })
      i++
    }
  }
  return out
}

/** One line as highlighted HTML, with an optional caret and an error range. */
export function paint(text: string, caret = -1, sq: [number, number] | null = null) {
  let html = ''
  for (const t of tokenize(text)) {
    const cuts = [t.s, t.e]
    if (caret > t.s && caret < t.e) cuts.push(caret)
    if (sq) for (const b of sq) if (b > t.s && b < t.e) cuts.push(b)
    cuts.sort((a, b) => a - b)
    for (let k = 0; k < cuts.length - 1; k++) {
      const a = cuts[k]!
      const b = cuts[k + 1]!
      if (a === b) continue
      if (a === caret) html += '<i class="caret"></i>'
      const cls = (
        (t.c === 'ws' ? '' : `t-${t.c}`) + (sq && a >= sq[0] && b <= sq[1] ? ' sq' : '')
      ).trim()
      html += cls ? `<span class="${cls}">${esc(text.slice(a, b))}</span>` : esc(text.slice(a, b))
    }
  }
  if (caret === text.length) html += '<i class="caret"></i>'
  // an error at the very end of a line still gets a visible mark
  if (sq && sq[0] >= text.length) html += '<span class="sq">  </span>'
  return html || ' '
}

/**
 * Aligns two versions of a file. Unchanged lines keep their identity; changed lines pair with
 * their most similar counterpart so they animate as edits. Returns, per new line, the old index or -1.
 */
export function align(oldT: string[], newT: string[]) {
  const n = oldT.length
  const m = newT.length
  const dp = Array.from({ length: n + 1 }, () => Array.from({ length: m + 1 }, () => 0))
  const at = (i: number, j: number) => dp[i]?.[j] ?? 0
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i]![j] = oldT[i] === newT[j] ? at(i + 1, j + 1) + 1 : Math.max(at(i + 1, j), at(i, j + 1))
  const anchors: [number, number][] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (oldT[i] === newT[j]) anchors.push([i++, j++])
    else if (at(i + 1, j) >= at(i, j + 1)) i++
    else j++
  }
  const result = Array.from({ length: m }, () => -1)
  const similarity = (a: string, b: string) => {
    let p = 0
    while (p < a.length && p < b.length && a[p] === b[p]) p++
    let s = 0
    while (s < a.length - p && s < b.length - p && a[a.length - 1 - s] === b[b.length - 1 - s]) s++
    return p + s
  }
  let pi = 0
  let pj = 0
  for (const [ai, aj] of [...anchors, [n, m] as [number, number]]) {
    let from = pj
    for (let x = pi; x < ai; x++) {
      let best = -1
      let score = 3
      for (let y = from; y < aj; y++) {
        const sc = similarity(oldT[x]!, newT[y]!)
        if (sc > score) {
          score = sc
          best = y
        }
      }
      if (best >= 0) {
        result[best] = x
        from = best + 1
      }
    }
    if (ai < n) result[aj] = ai
    pi = ai + 1
    pj = aj + 1
  }
  return result
}

export const ICON = {
  file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z"/><path d="M14 3v6h6"/></svg>',
  alert:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>',
  check:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/></svg>',
  trash:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>',
  inbox:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6Z"/></svg>',
  wifi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 2l20 20M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5.2-2.8M19 13a10 10 0 0 0-2.2-1.6M12 20h.01"/></svg>',
}

// ---------- editor ----------
export type Line = { id: string; text: string }
export type Mark = { line?: number | undefined; range?: [number, number] | undefined; msg: string }
type Rec = {
  id: string
  text: string
  el: HTMLDivElement
  inner: HTMLDivElement
  sq: [number, number] | null
}
type Mode = 'type' | 'instant'

let uid = 0

export class Editor {
  readonly el: HTMLElement
  readonly body: HTMLDivElement
  readonly tipEl: HTMLDivElement
  readonly statusEl: HTMLDivElement | null
  ta: HTMLTextAreaElement | null = null
  recs: Rec[] = []
  caret: number | null = null
  onKey: ((e: KeyboardEvent) => boolean) | null = null
  private gen = 0

  constructor(el: HTMLElement, file = '', fw = '', { status = false } = {}) {
    this.el = el
    el.classList.add('ed')
    el.innerHTML = `<div class="ed-bar">${ICON.file}<span class="file"></span><span class="fw"></span></div><div class="ed-body"></div>${status ? '<div class="ed-status"></div>' : ''}<div class="tip"></div>`
    this.body = el.querySelector('.ed-body')!
    this.tipEl = el.querySelector('.tip')!
    this.statusEl = el.querySelector('.ed-status')
    this.title(file, fw)
  }

  title(file: string, fw = '') {
    this.el.querySelector('.file')!.textContent = file
    this.el.querySelector('.fw')!.textContent = fw
  }

  code() {
    return this.recs.map((r) => r.text).join('\n')
  }

  find(id: string) {
    return this.recs.find((r) => r.id === id)
  }

  draw(r: Rec, caret = -1) {
    r.inner.innerHTML = paint(r.text, caret, r.sq)
  }

  /** Sets a whole file; line identity comes from a diff against what is shown now. */
  setCode(code: string, mode: Mode = 'instant', speed = 16) {
    const texts = code.split('\n')
    const map = align(
      this.recs.map((r) => r.text),
      texts,
    )
    return this.set(
      texts.map((text, j) => {
        const old = map[j] ?? -1
        return { id: old >= 0 ? this.recs[old]!.id : `n${++uid}`, text }
      }),
      mode,
      speed,
    )
  }

  async set(next: Line[], mode: Mode = 'type', speed = 16) {
    const gen = ++this.gen
    if (reducedMotion) mode = 'instant'
    const ids = new Set(next.map((l) => l.id))
    const leaving = this.recs.filter((r) => !ids.has(r.id))
    if (leaving.length) {
      for (const r of leaving) r.el.classList.add('out')
      if (mode !== 'instant') await sleep(320)
      for (const r of leaving) r.el.remove()
      if (gen !== this.gen) return
    }
    const recs: Rec[] = []
    const work: { r: Rec; to: string; fresh?: boolean }[] = []
    for (const l of next) {
      let r = this.find(l.id)
      if (!r) {
        const el = document.createElement('div')
        el.className = `ln${mode === 'instant' ? '' : ' out'}`
        el.innerHTML = '<div></div>'
        r = {
          id: l.id,
          text: mode === 'instant' ? l.text : '',
          el,
          inner: el.firstChild as HTMLDivElement,
          sq: null,
        }
        work.push({ r, to: l.text, fresh: true })
      } else if (r.text !== l.text) work.push({ r, to: l.text })
      r.sq = null
      recs.push(r)
    }
    for (const r of recs) this.body.appendChild(r.el)
    this.recs = recs
    if (mode === 'instant') {
      for (const w of work) w.r.text = w.to
      for (const r of recs) this.draw(r)
      return
    }
    requestAnimationFrame(() => {
      for (const w of work) if (w.fresh) w.r.el.classList.remove('out')
    })
    for (const w of work) {
      if (gen !== this.gen) return
      await this.edit(w.r, w.to, speed, gen)
    }
    if (gen === this.gen) for (const r of this.recs) this.draw(r)
  }

  /** Types the difference between a line's text and `to`. */
  private async edit(r: Rec, to: string, speed: number, gen: number) {
    const from = r.text
    let p = 0
    while (p < from.length && p < to.length && from[p] === to[p]) p++
    let s = 0
    while (
      s < from.length - p &&
      s < to.length - p &&
      from[from.length - 1 - s] === to[to.length - 1 - s]
    )
      s++
    const oldMid = from.slice(p, from.length - s)
    const newMid = to.slice(p, to.length - s)
    const ops: { at: number; ins?: string; del?: number }[] = []
    const idx = oldMid ? newMid.indexOf(oldMid) : -1
    if (oldMid && idx >= 0) {
      ops.push(
        { at: p, ins: newMid.slice(0, idx) },
        { at: p + idx + oldMid.length, ins: newMid.slice(idx + oldMid.length) },
      )
    } else {
      if (oldMid) ops.push({ at: p, del: oldMid.length })
      ops.push({ at: p, ins: newMid })
    }
    for (const op of ops) {
      if (op.del)
        for (let k = 0; k < op.del; k += 2) {
          if (gen !== this.gen) return
          r.text = r.text.slice(0, op.at) + r.text.slice(op.at + Math.min(2, op.del - k))
          this.draw(r, op.at)
          await sleep(speed * 0.45)
        }
      if (op.ins) {
        let at = op.at
        for (const ch of op.ins) {
          if (gen !== this.gen) return
          r.text = r.text.slice(0, at) + ch + r.text.slice(at)
          at += ch.length
          this.draw(r, at)
          await sleep(ch === ' ' ? speed * 0.5 : speed)
        }
      }
    }
    r.text = to
    this.draw(r)
  }

  /** Puts a transparent textarea over the code so it can be edited in place. */
  editable(onInput: () => void) {
    this.el.classList.add('edit')
    const ta = document.createElement('textarea')
    ta.className = 'ed-ta'
    ta.spellcheck = false
    ta.setAttribute('autocapitalize', 'off')
    ta.setAttribute('autocomplete', 'off')
    ta.setAttribute('aria-label', `Edit ${this.el.querySelector('.file')?.textContent ?? 'code'}`)
    this.body.appendChild(ta)
    this.ta = ta
    ta.addEventListener('input', () => {
      void this.setCode(ta.value, 'instant')
      this.redrawCaret()
      onInput()
    })
    ta.addEventListener('keydown', (e) => {
      if (this.onKey?.(e)) return
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault()
        ta.setRangeText('  ', ta.selectionStart, ta.selectionEnd, 'end')
        ta.dispatchEvent(new Event('input'))
      } else if (e.key === 'Enter') {
        const before = ta.value.slice(0, ta.selectionStart)
        const indent = /^[ \t]*/.exec(before.slice(before.lastIndexOf('\n') + 1))?.[0] ?? ''
        e.preventDefault()
        ta.setRangeText(`\n${indent}`, ta.selectionStart, ta.selectionEnd, 'end')
        ta.dispatchEvent(new Event('input'))
      }
    })
  }

  sync() {
    if (this.ta) this.ta.value = this.code()
  }

  /** A drawn caret for scripted typing (the textarea is not focused then). */
  showCaret(pos: number | null) {
    this.caret = pos
    this.redrawCaret()
  }

  redrawCaret() {
    let at = this.caret
    for (const r of this.recs) {
      if (at !== null && at >= 0 && at <= r.text.length) {
        this.draw(r, at)
        at = -1e9
      } else {
        this.draw(r)
        if (at !== null) at -= r.text.length + 1
      }
    }
  }

  marks(errors: Mark[], okText = 'No problems', good = false) {
    this.recs.forEach((r, i) => {
      r.sq = errors.find((x) => x.line === i && x.range)?.range ?? null
    })
    this.redrawCaret()
    if (!this.statusEl) return
    const e = errors[0]
    this.statusEl.className = `ed-status${e ? ' bad' : good ? ' good' : ''}`
    this.statusEl.innerHTML = e
      ? `${ICON.x}<span>${esc((e.line !== undefined ? `${e.line + 1}: ` : '') + e.msg)}${errors.length > 1 ? `  (+${errors.length - 1} more)` : ''}</span>`
      : `${ICON.check}<span>${esc(okText)}</span>`
  }

  squiggle(id: string, word: string) {
    const r = this.find(id)
    if (!r) return
    const a = r.text.indexOf(word)
    r.sq = a >= 0 ? [a, a + word.length] : null
    this.draw(r)
  }

  clearSquiggles() {
    for (const r of this.recs)
      if (r.sq) {
        r.sq = null
        this.draw(r)
      }
  }

  tip(id: string | null, html = '') {
    const r = id ? this.find(id) : undefined
    if (!r) {
      this.tipEl.classList.remove('show')
      return
    }
    this.tipEl.innerHTML = html
    this.tipEl.style.top = `${r.el.offsetTop + r.el.offsetHeight + 4}px`
    this.tipEl.classList.add('show')
  }

  flash(id: string) {
    const r = this.find(id)
    if (!r) return
    r.el.classList.remove('flash')
    void r.el.offsetWidth
    r.el.classList.add('flash')
  }
}
