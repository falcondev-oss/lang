/** The editable playground: ten cases, live compile, rendering in four languages, autocomplete. */
import { esc, Editor, isIdent, LANGS, show, sleep, type Language } from './code'
import {
  compileTrans,
  compileUse,
  isGroup,
  isRec,
  renderEl,
  typeName,
  type Ctx,
  type El,
  type Tree,
} from './compile'
import { decode } from './decode'
import { ITEMS, type Item } from './items'

type State = { tree: Tree; scope: Tree | null; els: El[] }

class Complete {
  private readonly box = document.createElement('div')
  private items: string[] = []
  private i = 0
  private ctx: { base: Tree; partial: string; mode: 'dot' | 'br'; pos: number } | null = null
  private charWidth = 0
  open = false

  constructor(
    private readonly ed: Editor,
    private readonly ta: HTMLTextAreaElement,
    private readonly get: () => State,
  ) {
    this.box.className = 'ac'
    this.box.dataset['lenisPrevent'] = ''
    ed.el.appendChild(this.box)
    this.box.addEventListener('mousedown', (e) => {
      const item = (e.target as Element).closest<HTMLElement>('.ac-i')
      if (!item) return
      e.preventDefault()
      this.i = Number(item.dataset['i'])
      this.accept()
    })
    ed.onKey = (e) => {
      if (e.key === ' ' && e.ctrlKey) {
        e.preventDefault()
        this.update()
        return true
      }
      if (!this.open) return false
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        this.move(e.key === 'ArrowDown' ? 1 : -1)
        return true
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        this.accept()
        return true
      }
      if (e.key === 'Escape') {
        this.close()
        return true
      }
      return false
    }
    ta.addEventListener('click', () => this.update())
    ta.addEventListener('blur', () => setTimeout(() => this.close(), 120))
  }

  private path(node: Tree | Tree[string] | null | undefined, s: string) {
    for (const m of s.matchAll(/\.(\w+)|\['([^']*)'\]/g)) {
      const key = m[1] ?? m[2] ?? ''
      if (!isGroup(node) || !(key in node)) return null
      node = node[key]
    }
    return node
  }

  update() {
    const ta = this.ta
    const pos = ta.selectionStart
    if (pos !== ta.selectionEnd) return this.close()
    const before = ta.value.slice(0, pos)
    const line = before.slice(before.lastIndexOf('\n') + 1)
    const { tree, scope } = this.get()
    let base: unknown = null
    let partial = ''
    let mode: 'dot' | 'br' = 'dot'
    let m: RegExpExecArray | null
    if ((m = /all((?:\.\w+)*)\.(\w*)$/.exec(line))) {
      base = this.path(tree, m[1] ?? '')
      partial = m[2] ?? ''
    } else if ((m = /\btext((?:\.\w+|\['[^']*'\])*)(\.|\[')([^'.[\]]*)$/.exec(line)) && scope) {
      base = this.path(scope, m[1] ?? '')
      partial = m[3] ?? ''
      mode = m[2] === '.' ? 'dot' : 'br'
    } else if ((m = /\b(\w+)((?:\.\w+)*)\.(\w*)$/.exec(line)) && m[1] && m[1] in tree) {
      base = this.path(tree[m[1]], m[2] ?? '')
      partial = m[3] ?? ''
    }
    if (!isGroup(base)) return this.close()
    const keys = Object.keys(base).filter((k) => k.toLowerCase().startsWith(partial.toLowerCase()))
    if (!keys.length || (keys.length === 1 && keys[0] === partial)) return this.close()
    this.ctx = { base, partial, mode, pos }
    this.items = keys
    this.i = this.open ? Math.min(this.i, keys.length - 1) : 0
    this.render()
    // under the caret
    const rec = this.ed.recs[before.split('\n').length - 1]
    if (!rec) return this.close()
    if (!this.charWidth) {
      const style = getComputedStyle(this.ed.body)
      const canvas = document.createElement('canvas').getContext('2d')!
      canvas.font = `${style.fontSize} ${style.fontFamily}`
      this.charWidth = canvas.measureText('0').width
    }
    const left = Math.min(
      44 + (line.length - partial.length) * this.charWidth,
      this.ed.el.clientWidth - this.box.offsetWidth - 8,
    )
    this.box.style.left = `${Math.max(8, left)}px`
    this.box.style.top = `${this.ed.body.offsetTop + rec.el.offsetTop + rec.el.offsetHeight + 2}px`
    this.box.classList.add('show')
    this.open = true
  }

  private render() {
    if (!this.ctx) return
    const { base } = this.ctx
    const label = (k: string) => (isIdent(k) ? k : `'${k}'`)
    const detail = (k: string) => {
      const n = base[k]
      if (!isRec(n)) return typeName(n)
      return n.isFn ? `(p: { ${n.sig?.body ?? ''} }) => string` : `'${show(n.others['de'] ?? '')}'`
    }
    const doc = (k: string) => {
      const n = base[k]
      if (!isRec(n)) return `<b>${esc(label(k))}</b>: ${esc(typeName(n))}`
      if (n.isFn) return `<b>${esc(k)}</b>: (p: { ${esc(n.sig?.body ?? '')} }) => string`
      return `<b>${esc(label(k))}</b>:\n${LANGS.map((l) => `  | '[${l}]: ${esc(l === 'en' ? n.en : (n.others[l] ?? '—'))}'`).join('\n')}`
    }
    const list = this.items
      .map(
        (k, i) =>
          `<div class="ac-i${i === this.i ? ' on' : ''}" data-i="${i}"><i>${isRec(base[k]) ? 'abc' : '{}'}</i><span>${esc(k)}</span><small>${esc(detail(k))}</small></div>`,
      )
      .join('')
    this.box.innerHTML = `<div class="ac-list">${list}</div><div class="ac-doc">${doc(this.items[this.i] ?? '')}</div>`
  }

  move(d: number) {
    this.i = (this.i + d + this.items.length) % this.items.length
    this.render()
  }

  accept() {
    if (!this.ctx) return
    const ta = this.ta
    const { partial, mode, pos } = this.ctx
    const key = this.items[this.i] ?? ''
    if (mode === 'dot' && isIdent(key)) ta.setRangeText(key, pos - partial.length, pos, 'end')
    else if (mode === 'dot') ta.setRangeText(`['${key}']`, pos - partial.length - 1, pos, 'end')
    else {
      const closed = ta.value.slice(pos, pos + 2) === "']"
      ta.setRangeText(key + (closed ? '' : "']"), pos - partial.length, pos, 'end')
      if (closed) ta.selectionStart = ta.selectionEnd = ta.selectionStart + 2
    }
    this.close()
    ta.dispatchEvent(new Event('input'))
  }

  close() {
    this.box.classList.remove('show')
    this.open = false
  }
}

/** Texts of the playground in the page's language, read with lang on the server. */
export type PlaygroundStrings = {
  titles: Record<Item['id'], string>
  subs: Partial<Record<Item['id'], string>>
  tags: Record<NonNullable<Item['tag']>, string>
  steps: string[]
  scrollHint: string
  renders: string
  live: string
  noProblems: string
  solved: string
  nothing: string
}

export type Scroller = {
  scrollTo: (y: number, done: () => void) => void
  onScroll: (fn: () => void) => void
}

export function initPlayground(wrap: HTMLElement, s: PlaygroundStrings, scroller: Scroller) {
  const root = wrap.querySelector<HTMLElement>('[data-playground]')!
  const list = root.querySelector<HTMLOListElement>('[data-list]')!
  const stepEl = root.querySelector<HTMLElement>('[data-step]')!
  const tr = new Editor(root.querySelector('[data-trans]')!, 'lang/translations.ts', 'shared', {
    status: true,
  })
  const use = new Editor(root.querySelector('[data-use]')!, '', '', { status: true })
  const quad = root.querySelector<HTMLElement>('[data-render]')!
  quad.innerHTML =
    `<div class="quad-bar"><span>${esc(s.renders)}</span><span>${esc(s.live)}</span></div>` +
    LANGS.map(
      (l) =>
        `<div class="quad-row"><span class="${l}">${l}</span><div class="q" lang="${l}"></div></div>`,
    ).join('')
  const cells = [...quad.querySelectorAll<HTMLElement>('.q')]
  list.innerHTML = ITEMS.map(
    (it, i) =>
      `<li><button type="button" data-i="${i}" aria-current="false"><b>${esc(s.titles[it.id])}</b><small>${esc(s.subs[it.id] ?? it.sub)}</small>${it.tag ? `<span class="tag">${esc(s.tags[it.tag])}</span>` : ''}</button></li>`,
  ).join('')
  const buttons = [...list.querySelectorAll<HTMLElement>('button')]

  const ctx: Ctx = { user: { name: 'Mia' }, inbox: { length: 3 } }
  let fw: 'vue' | 'react' = 'vue'
  let idx = 0
  let run = 0
  let state: State = { tree: {}, scope: null, els: [] }
  const usageOf = (it: Item, files: { vue?: string; react?: string } = it) =>
    it.use ?? files[fw] ?? ''

  function renderQuad(broken: boolean) {
    cells.forEach((cell, j) => {
      const l = LANGS[j] as Language
      const html = state.els.length
        ? state.els.map((el) => renderEl(el, l, ctx, broken)).join('')
        : `<span class="ui-none">${esc(s.nothing)}</span>`
      if (cell.innerHTML !== html) cell.innerHTML = html
    })
  }
  function compile() {
    const T = compileTrans(tr.code())
    const U = compileUse(use.code(), T.tree, ctx)
    state = { tree: T.tree, scope: U.scope, els: U.els }
    const solved = !!ITEMS[idx]?.exercise && !T.errors.length
    tr.marks(T.errors, solved ? s.solved : s.noProblems, solved)
    use.marks(U.errors, s.noProblems)
    renderQuad(T.errors.some((e) => e.line === undefined))
  }

  tr.editable(compile)
  use.editable(() => {
    compile()
    complete.update()
  })
  const complete = new Complete(use, use.ta!, () => state)

  const titles = (it: Item) =>
    use.title(
      it.use !== undefined ? it.files[0] : (it.files[fw === 'vue' ? 0 : 1] ?? it.files[0]),
      it.fw ?? (fw === 'vue' ? 'Vue' : 'React'),
    )

  const scripts = {
    async migrate(it: Item, my: number) {
      await sleep(700)
      if (my !== run) return
      await use.setCode(usageOf(it), 'type', 18)
      if (my !== run) return
      await tr.setCode(it.trans, 'type', 14)
      if (my !== run) return
      tr.sync()
      use.sync()
      compile()
    },
    async complete(_it: Item, my: number) {
      const ta = use.ta!
      let pos = fw === 'vue' ? ta.value.indexOf('{{  }}') + 3 : ta.value.indexOf('{}') + 1
      use.showCaret(pos)
      await sleep(700)
      for (const ch of 'text.') {
        if (my !== run) return
        ta.value = ta.value.slice(0, pos) + ch + ta.value.slice(pos)
        pos++
        ta.selectionStart = ta.selectionEnd = pos
        await use.setCode(ta.value, 'instant')
        use.showCaret(pos)
        await sleep(90)
      }
      compile()
      use.showCaret(pos)
      complete.update()
      for (const d of [1, 1, -1, -1]) {
        await sleep(750)
        if (my !== run) return complete.close()
        complete.move(d)
      }
      await sleep(800)
      if (my !== run) return complete.close()
      complete.accept()
      use.caret = null
      compile()
    },
  }

  async function show(i: number, { script = true } = {}) {
    idx = i
    const my = ++run
    const it = ITEMS[i]!
    use.caret = null
    complete.close()
    buttons.forEach((b, j) => b.setAttribute('aria-current', String(j === i)))
    stepEl.textContent = s.steps[i] ?? ''
    titles(it)
    const start = script && it.script ? it.start : undefined
    await tr.setCode(start?.trans ?? it.trans, 'instant')
    await use.setCode(start ? usageOf(it, start) : usageOf(it), 'instant')
    tr.sync()
    use.sync()
    compile()
    if (start && it.script) await scripts[it.script](it, my)
  }

  /*
   * Scroll mode: the playground sticks under the header and every step of scrolling shows the
   * next case, from migrating existing code to the exercise. Without room for it (small screens,
   * short windows) the list is a plain set of tabs.
   */
  const wide = matchMedia('(min-width: 72rem)')
  let scrollMode = false
  let top = 80
  // while a click scrolls to its case, the cases passed on the way are not shown
  let target: number | null = null
  const header = () => document.querySelector('header')?.offsetHeight ?? 64
  const stepHeight = () => Math.max(320, innerHeight * 0.55)
  function layout() {
    // measure with the fixed editor heights of scroll mode, then decide whether it fits
    wrap.classList.add('scroll')
    const room = innerHeight - header()
    const h = root.offsetHeight
    scrollMode = wide.matches && h <= room - 48
    // centered in the space under the header, so tall windows are not empty below it
    top = Math.round(header() + Math.max(16, (room - h) / 2))
    wrap.classList.toggle('scroll', scrollMode)
    wrap.style.setProperty('--steps-h', `${(ITEMS.length - 1) * stepHeight()}px`)
    wrap.style.setProperty('--top', `${top}px`)
    onScroll()
  }
  const progress = () => (top - wrap.getBoundingClientRect().top) / stepHeight()
  function onScroll() {
    if (!scrollMode) return
    const p = progress()
    const last = ITEMS.length - 1
    const i = Math.min(last, Math.max(0, Math.floor(p)))
    wrap.style.setProperty('--progress', String(Math.min(1, Math.max(0, p / last))))
    if (target !== null) return
    buttons.forEach((b, j) => {
      b.classList.toggle('done', j < i)
      b.style.setProperty('--p', j === i ? String(Math.min(1, Math.max(0, p - i))) : '0')
    })
    wrap.classList.toggle('at-end', i === last)
    if (i !== idx && ready) void show(i)
  }
  let ready = false
  scroller.onScroll(onScroll)
  addEventListener('resize', layout)
  wide.addEventListener('change', layout)

  list.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('button')
    if (!b) return
    const i = Number(b.dataset['i'])
    void show(i)
    if (!scrollMode) return
    target = i
    buttons.forEach((x, j) => {
      x.classList.toggle('done', j < i)
      x.style.setProperty('--p', '0')
    })
    const y = scrollY + wrap.getBoundingClientRect().top - top + i * stepHeight() + 2
    let released = false
    const release = () => {
      if (released) return
      released = true
      target = null
      onScroll()
    }
    scroller.scrollTo(y, release)
    setTimeout(release, 1800)
  })
  root.querySelector('[data-fw]')!.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('button')
    if (!b) return
    fw = b.dataset['fw'] === 'react' ? 'react' : 'vue'
    for (const x of root.querySelectorAll('[data-fw] button'))
      x.setAttribute('aria-pressed', String(x === b))
    void show(idx, { script: false })
  })

  // ticking values: the parameters change, every language follows
  let tick = 0
  setInterval(() => {
    tick++
    ctx['inbox'] = { length: (tick % 5) + 1 }
    ctx['user'] = { name: ['Mia', 'Kenji', 'Lucía', 'Jonas', 'Zofia'][tick % 5] }
    renderQuad(false)
  }, 1600)

  // first paint: the playground decodes in once, then the first case plays
  void (async () => {
    const first = ITEMS[0]!
    titles(first)
    stepEl.textContent = s.steps[0] ?? ''
    buttons[0]?.setAttribute('aria-current', 'true')
    await tr.setCode(first.start?.trans ?? first.trans, 'instant')
    await use.setCode(usageOf(first, first.start), 'instant')
    tr.sync()
    use.sync()
    compile()
    layout()
    const targets = [
      ...cells.map((c) => c.querySelector('.tx')),
      ...tr.recs.map((r) => r.inner),
      ...use.recs.map((r) => r.inner),
    ]
    const plays = targets.map((el, i) =>
      decode(el, { wait: true, delay: i * 18, spread: 220, dur: 320 }),
    )
    await sleep(350)
    for (const play of plays) play()
    await sleep(1300)
    ready = true
    const p = scrollMode ? progress() : 0
    void show(Math.min(ITEMS.length - 1, Math.max(0, Math.floor(p))))
  })()
}
