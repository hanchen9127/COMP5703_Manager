// Contrast scan used for finding D1 of ../frontend-design-review.md.
// Paste into the browser console on any hej-web page (light or dark), or eval it in a same-origin iframe.
// It scans the open dialog if there is one, otherwise the whole page, and returns JSON:
//   under3     - text elements whose contrast with their composited background is below 3:1
//                (below the WCAG AA minimum even for large text; normal text needs 4.5:1)
//   badButtons - how many of those sit inside an enabled button, link-button or tab
//   blending   - filled buttons whose fill and border both differ from the surface by less than 1.6:1
// Backgrounds are composited up the ancestor chain; gradients are averaged; images are ignored.
// Disabled controls are skipped. The "blending" figure also flags outline buttons with subtle
// borders, so read it only for filled buttons.
(() => {
  const toRgb = (s) => {
    const m = s.match(/^rgba?\(([^)]+)\)/)
    if (m) {
      const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number)
      return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]
    }
    const c = document.createElement("canvas").getContext("2d", { willReadFrequently: true })
    c.fillStyle = s
    c.fillRect(0, 0, 1, 1)
    const d = c.getImageData(0, 0, 1, 1).data
    return [d[0], d[1], d[2], d[3] / 255]
  }
  const over = (t, b) => [0, 1, 2].map((i) => t[i] * t[3] + b[i] * (1 - t[3])).concat(1)
  const lum = (c) => {
    const f = (v) => {
      v /= 255
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    }
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2])
  }
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
    return (x + 0.05) / (y + 0.05)
  }
  const layers = (n) => {
    const st = getComputedStyle(n)
    const out = []
    if (st.backgroundImage.includes("gradient")) {
      const cs = (st.backgroundImage.match(/(rgba?|oklch|oklab|lab)\([^)]*\)/g) || []).map(toRgb)
      if (cs.length) {
        out.push(
          [0, 1, 2]
            .map((i) => cs.reduce((s, c) => s + c[i], 0) / cs.length)
            .concat(cs.reduce((s, c) => s + c[3], 0) / cs.length)
        )
      }
    }
    const c = toRgb(st.backgroundColor)
    if (c[3] > 0) out.push(c)
    return out
  }
  const bgOf = (el) => {
    const chain = []
    for (let n = el; n; n = n.parentElement) {
      const ls = layers(n)
      chain.push(...ls)
      if (ls.some((c) => c[3] >= 0.98)) break
    }
    let base = toRgb(getComputedStyle(document.body).backgroundColor)
    if (base[3] < 1) base = [255, 255, 255, 1]
    for (let i = chain.length - 1; i >= 0; i--) base = over(chain[i], base)
    return base
  }
  const scope =
    [...document.querySelectorAll('[role="dialog"]')].find(
      (d) =>
        d.getClientRects().length &&
        d.getBoundingClientRect().width > 300 &&
        getComputedStyle(d).visibility !== "hidden"
    ) || document.body

  const els = [...scope.querySelectorAll("*")].filter((el) => {
    if (!el.getClientRects().length) return false
    const st = getComputedStyle(el)
    if (st.visibility === "hidden" || +st.opacity === 0) return false
    return [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1)
  })
  const bad = []
  let buttons = 0
  let badButtons = 0
  for (const el of els) {
    const bg = bgOf(el)
    const r = ratio(over(toRgb(getComputedStyle(el).color), bg), bg)
    const isBtn = !!el.closest("button,a[data-slot=button],[role=tab]")
    const disabled = !!el.closest("button:disabled,[aria-disabled=true]")
    if (isBtn && !disabled) buttons++
    if (r < 3 && !disabled) {
      if (isBtn) badButtons++
      bad.push({ r: +r.toFixed(2), btn: isBtn, t: el.textContent.trim().replace(/\s+/g, " ").slice(0, 45) })
    }
  }
  bad.sort((a, b) => a.r - b.r)

  const blending = []
  for (const b of scope.querySelectorAll("button[data-slot=button],a[data-slot=button]")) {
    if (!b.getClientRects().length || b.disabled) continue
    const st = getComputedStyle(b)
    const own = toRgb(st.backgroundColor)
    if (own[3] < 0.5) continue
    const surf = bgOf(b.parentElement)
    const fill = ratio(over(own, surf), surf)
    const border = parseFloat(st.borderTopWidth) > 0 ? ratio(over(toRgb(st.borderTopColor), surf), surf) : 1
    if (Math.max(fill, border) < 1.6) blending.push({ t: b.textContent.trim().slice(0, 30), fill: +fill.toFixed(2) })
  }

  return JSON.stringify({
    url: location.pathname,
    dialog: scope !== document.body,
    dark: document.documentElement.classList.contains("dark"),
    textEls: els.length,
    under3: bad.length,
    buttons,
    badButtons,
    blending,
    worst: bad.slice(0, 15),
  })
})()
