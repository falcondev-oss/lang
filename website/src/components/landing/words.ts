/**
 * Everyday UI texts in the free space left and right of the content. Each one decodes in, then
 * switches through a few languages with the same decode, and fades out to make room for the next.
 * Only shown where the margins are wide enough not to touch the content.
 */
import { LANGS, reducedMotion, sleep } from './code'
import { decode } from './decode'

const SLOTS = [0.08, 0.2, 0.33, 0.46, 0.59, 0.72, 0.85, 0.95].flatMap((y, i) => [
  { side: 'l', y: y + (i % 2) * 0.04 },
  { side: 'r', y: y + ((i + 1) % 2) * 0.04 },
])
/** The spinner of a thinking CLI. */
const SPIN = ['·', '✢', '✳', '✶', '✻', '✽', '✻', '✶', '✳', '✢']
const CONTENT = 76 * 16 // max width of .landing

export function initWords(layer: HTMLElement, words: string[][]) {
  const used = new Set<number>()
  const gutter = () => (innerWidth - CONTENT) / 2
  const fits = () => gutter() >= 170
  const sync = () => layer.classList.toggle('on', fits())
  sync()
  addEventListener('resize', sync)

  // one clock for every spinner
  if (!reducedMotion) {
    let frame = 0
    setInterval(() => {
      if (document.hidden || !fits()) return
      frame++
      layer.querySelectorAll('b').forEach((b, i) => {
        b.textContent = SPIN[(frame + i * 3) % SPIN.length] ?? '✻'
      })
    }, 130)
  }

  SLOTS.forEach((slot, n) => {
    const el = document.createElement('span')
    el.className = `w ${slot.side}`
    el.innerHTML = '<b></b><span></span><i></i>'
    const tag = el.querySelector('i')!
    const txt = el.querySelector('span')!
    layer.appendChild(el)
    const place = () => {
      el.style.top = `${Math.min(0.93, slot.y + (Math.random() - 0.5) * 0.06) * 100}%`
      el.style.setProperty(
        '--x',
        `${Math.round(24 + Math.random() * Math.max(0, gutter() - 190))}px`,
      )
    }
    const show = (word: number, lang: number) => {
      tag.textContent = LANGS[lang] ?? 'en'
      tag.className = LANGS[lang] ?? 'en'
      txt.textContent = words[word]?.[lang] ?? ''
      txt.lang = LANGS[lang] ?? 'en'
      decode(txt, { spread: 420, dur: 340 })
    }

    if (reducedMotion) {
      const word = n % words.length
      place()
      const lang = n % LANGS.length
      tag.textContent = LANGS[lang] ?? 'en'
      tag.className = LANGS[lang] ?? 'en'
      txt.textContent = words[word]?.[lang] ?? ''
      el.classList.add('in')
      return
    }

    void (async () => {
      await sleep(800 + n * 900)
      for (;;) {
        if (!fits() || document.hidden) {
          await sleep(1000)
          continue
        }
        let word = Math.floor(Math.random() * words.length)
        while (used.has(word)) word = (word + 1) % words.length
        used.add(word)
        place()
        let lang = Math.floor(Math.random() * LANGS.length)
        show(word, lang)
        el.classList.add('in')
        // three or four languages, then make room
        const steps = 2 + Math.floor(Math.random() * 2)
        for (let i = 0; i < steps; i++) {
          await sleep(2600 + Math.random() * 1600)
          lang = (lang + 1 + Math.floor(Math.random() * (LANGS.length - 1))) % LANGS.length
          show(word, lang)
        }
        await sleep(2800)
        el.classList.remove('in')
        await sleep(1400 + Math.random() * 2500)
        used.delete(word)
      }
    })()
  })
}
