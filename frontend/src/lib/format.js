// "—" means "no real value yet" — the dashboard never shows a made-up number.
export function fmt(value, digits = 0) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return value.toFixed(digits);
}
