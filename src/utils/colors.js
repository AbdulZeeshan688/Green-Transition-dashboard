export function getSegmentColor(dH) {
  const clamped = Math.max(-10, Math.min(10, dH))
  const t       = (clamped + 10) / 20
  const hue     = Math.round((1 - t) * 120)
  const lit     = t > 0.5
    ? Math.round(42 + (t - 0.5) * 10)
    : Math.round(48 - (0.5 - t) * 8)
  return `hsl(${hue}, 88%, ${lit}%)`
}