const FEMININE_GENDER_VALUES = ['kobieta', 'czarownica', 'czarodziejka', 'female', 'woman'];
const NEUTRAL_GENDER_VALUES = ['mistyk', 'neutralna', 'neutralny', 'neutralne', 'nonbinary', 'non-binary'];

function normalizeGender(value) {
  return String(value || '')
    .trim()
    .toLocaleLowerCase('pl-PL');
}

export function resolvePolishGender(value) {
  const normalized = normalizeGender(value);

  if (FEMININE_GENDER_VALUES.some(candidate => normalized === candidate || normalized.includes(candidate))) {
    return 'feminine';
  }

  if (NEUTRAL_GENDER_VALUES.some(candidate => normalized === candidate || normalized.includes(candidate))) {
    return 'neutral';
  }

  return 'masculine';
}

export function getAcceptanceClause(gender) {
  const grammaticalGender = resolvePolishGender(gender);

  if (grammaticalGender === 'feminine') return 'zostałaś oficjalnie przyjęta';
  if (grammaticalGender === 'neutral') return 'oficjalnie przyjęto Cię';
  return 'zostałeś oficjalnie przyjęty';
}

export function getLetterSalutation(gender, surname = '') {
  const grammaticalGender = resolvePolishGender(gender);
  const trimmedSurname = String(surname || '').trim();
  const suffix = trimmedSurname ? ` ${trimmedSurname}` : '';

  if (grammaticalGender === 'feminine') return `Szanowna Panno${suffix}`;
  if (grammaticalGender === 'neutral') return `Szanowna Osobo${suffix}`;
  return `Szanowny Panie${suffix}`;
}
