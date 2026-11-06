/**
 * Dither decode, after ascii-reveal's `dither` preset: waiting text holds still as shaded blocks
 * and resolves once, left to right. The real text stays in the DOM the whole time, so layout,
 * selection and search engines see it.
 */
const RAMP = '░▒▓█'
const SCRAMBLE = '░▒▓'
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches

type Cell = { el: HTMLSpanElement; start: number; end: number; last: number; done: boolean }
type Job = { cells: Cell[]; playing: boolean; t0: number; finish: () => void }

const jobs = new Set<Job>()
const owner = new WeakMap<Element, Job>()
let looping = false

const pick = (chars: string) => chars[Math.floor(Math.random() * chars.length)] ?? ''

function frame(now: number) {
  for (const job of jobs) {
    // content was replaced underneath: drop the job
    if (job.cells[0] && !job.cells[0].el.isConnected) {
      jobs.delete(job)
      continue
    }
    if (!job.playing) continue
    const t = now - job.t0
    let left = 0
    for (const c of job.cells) {
      if (c.done) continue
      if (t >= c.end) {
        c.done = true
        c.el.classList.remove('sc')
        continue
      }
      left++
      if (now - c.last < 60 || t < c.start) continue
      c.last = now
      const k = (t - c.start) / (c.end - c.start)
      const glyph =
        k < 0.5
          ? RAMP[Math.min(RAMP.length - 1, Math.floor((k / 0.5) * RAMP.length))]
          : pick(SCRAMBLE)
      c.el.setAttribute('data-g', glyph ?? '')
    }
    if (!left) {
      jobs.delete(job)
      job.finish()
    }
  }
  if (jobs.size) requestAnimationFrame(frame)
  else looping = false
}

export type DecodeOptions = { dur?: number; spread?: number; delay?: number; wait?: boolean }

/** Decodes the text of `el`. With `wait`, the text holds as blocks until the returned function is called. */
export function decode(
  el: Element | null | undefined,
  { dur = 380, spread = 260, delay = 0, wait = false }: DecodeOptions = {},
) {
  if (reducedMotion || !el) return () => {}
  const previous = owner.get(el)
  if (previous) {
    jobs.delete(previous)
    previous.finish()
  }
  const cells: Cell[] = []
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []
  while (walker.nextNode()) nodes.push(walker.currentNode as Text)
  for (const node of nodes) {
    if (!node.data.trim()) continue
    const fragment = document.createDocumentFragment()
    let buffer = ''
    for (const ch of Array.from(node.data)) {
      if (/\s/.test(ch)) {
        buffer += ch
        continue
      }
      if (buffer) fragment.append(buffer)
      buffer = ''
      const span = document.createElement('span')
      span.className = 'sc'
      span.textContent = ch
      span.setAttribute('data-g', pick(SCRAMBLE))
      fragment.append(span)
      cells.push({ el: span, start: 0, end: 0, last: 0, done: false })
    }
    if (buffer) fragment.append(buffer)
    node.replaceWith(fragment)
  }
  const n = cells.length || 1
  cells.forEach((c, i) => {
    c.start = delay + (i / n) * spread
    c.end = c.start + dur * (0.6 + Math.random() * 0.6)
  })
  const job: Job = {
    cells,
    playing: !wait,
    t0: performance.now(),
    finish() {
      for (const c of cells) if (c.el.isConnected) c.el.replaceWith(c.el.textContent ?? '')
      el.normalize()
      if (owner.get(el) === job) owner.delete(el)
    },
  }
  owner.set(el, job)
  jobs.add(job)
  if (!looping) {
    looping = true
    requestAnimationFrame(frame)
  }
  return () => {
    job.t0 = performance.now()
    job.playing = true
  }
}
