export function tryParse(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) ?? fallback;
  } catch {
    return fallback;
  }
}

export function normalizePointValue(value) {
  const numericValue = Number(value);
  if (Number.isFinite(numericValue)) return Math.max(0, numericValue);

  const recoveredValue = typeof value === 'string' ? Number.parseFloat(value) : 0;
  return Number.isFinite(recoveredValue) ? Math.max(0, recoveredValue) : 0;
}
