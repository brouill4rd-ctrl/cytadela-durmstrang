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

export function cleanPersonName(name) {
  if (!name || typeof name !== 'string') return '';
  let cleaned = name.trim();

  // If contains a bullet separator e.g. "Profesor • Transmutacja Minerwa McGonagall"
  if (cleaned.includes('•')) {
    const parts = cleaned.split('•');
    const afterBullet = parts.slice(1).join('•').trim();
    // Strip common department names if followed by a person's name
    const strippedDept = afterBullet.replace(/^(Transmutacja|Czarna Magia|Eliksiry|Starożytne Runy|Zielarstwo|Astromagia|Historia Magii|Zaklęcia|Wróżbiarstwo|Obrona przed Czarną Magią|Latanie|Runy|Alchemia|Klątwy|Szermierka Runiczna|Katedra [^\s]+)\s+/i, '');
    cleaned = strippedDept || afterBullet;
  }

  // Remove common administrative or academic prefixes
  cleaned = cleaned
    .replace(/^Arcymistrz\s+Cytadeli\s+/i, '')
    .replace(/^Dyrektor\s+(Cytadeli|Szkoły)\s+/i, '')
    .replace(/^Rada\s+Arcymistrzów\s+/i, '')
    .replace(/^Profesor\s+/i, '')
    .replace(/^Prof\.\s+/i, '')
    .trim();

  return cleaned;
}
