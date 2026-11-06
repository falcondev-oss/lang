/**
 * A quiet background: a few soft blobs drift across the page and are drawn as an ordered (Bayer)
 * dither, one canvas pixel per 4 CSS pixels. Strongest at the sides, light in the middle where the
 * content is. Scrolling shifts it a little. Static with reduced motion.
 */
const CELL = 4
const BAYER = [
  0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28,
  52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7,
  39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21,
].map((v) => (v + 0.5) / 64)

const BLOBS = [
  { x: 0.06, y: 0.2, r: 0.17, sx: 0.05, sy: 0.12, px: 23, py: 31 },
  { x: 0.95, y: 0.35, r: 0.2, sx: 0.04, sy: 0.15, px: 37, py: 27 },
  { x: 0.88, y: 0.92, r: 0.15, sx: 0.07, sy: 0.08, px: 29, py: 41 },
  { x: 0.18, y: 0.85, r: 0.13, sx: 0.06, sy: 0.1, px: 43, py: 19 },
]

export function initDither(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches
  let w = 0
  let h = 0
  let img: ImageData
  let rgb = [160, 120, 255]

  function readColor() {
    ctx!.fillStyle = getComputedStyle(canvas).color
    ctx!.fillRect(0, 0, 1, 1)
    const d = ctx!.getImageData(0, 0, 1, 1).data
    rgb = [d[0] ?? 0, d[1] ?? 0, d[2] ?? 0]
  }
  function resize() {
    w = Math.ceil(innerWidth / CELL)
    h = Math.ceil(innerHeight / CELL)
    canvas.width = w
    canvas.height = h
    img = ctx!.createImageData(w, h)
    readColor()
  }

  function draw(t: number) {
    const data = img.data
    const shift = (scrollY * 0.06) / CELL
    const blobs = BLOBS.map((b) => ({
      x: (b.x + Math.sin(t / b.px) * b.sx) * w,
      y: (b.y + Math.cos(t / b.py) * b.sy) * h - shift,
      r2: (b.r * Math.max(w, h)) ** 2,
    }))
    const [r, g, bl] = rgb
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let v = 0
        for (const b of blobs) {
          const dx = x - b.x
          const dy = y - b.y
          v += Math.exp(-(dx * dx + dy * dy) / b.r2)
        }
        // keep the middle quiet, where text and code are
        const side = Math.abs(x / w - 0.5) * 2
        v *= side * side
        const i = (y * w + x) * 4
        const on = Math.min(0.35, v * 0.5) > (BAYER[(y & 7) * 8 + (x & 7)] ?? 1)
        data[i] = r ?? 0
        data[i + 1] = g ?? 0
        data[i + 2] = bl ?? 0
        data[i + 3] = on ? 255 : 0
      }
    }
    ctx!.putImageData(img, 0, 0)
  }

  resize()
  addEventListener('resize', resize)
  new MutationObserver(readColor).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  })
  if (still) {
    draw(0)
    addEventListener('resize', () => draw(0))
    return
  }
  let last = 0
  const loop = (now: number) => {
    requestAnimationFrame(loop)
    if (document.hidden || now - last < 50) return
    last = now
    draw(now / 1000)
  }
  requestAnimationFrame(loop)
}
