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

export function getAppointmentClause(gender) {
  const g = resolvePolishGender(gender);
  if (g === 'feminine') return 'została mianowana';
  if (g === 'neutral') return 'zostało mianowane';
  return 'został mianowany';
}

export function getTeacherSalutation(gender, surname = '') {
  const g = resolvePolishGender(gender);
  const suffix = String(surname || '').trim() ? ` ${String(surname).trim()}` : '';
  if (g === 'feminine') return `Szanowna Profesor${suffix}`;
  if (g === 'neutral') return `Szanowna Osobo${suffix}`;
  return `Szanowny Profesorze${suffix}`;
}

export function getPanDative(gender) {
  const g = resolvePolishGender(gender);
  if (g === 'feminine') return 'Pani';
  if (g === 'neutral') return 'Osobie';
  return 'Panu';
}

const DEPARTMENT_GENITIVE_MAP = {
  'Czarna Magia': 'Czarnej Magii',
  'Czarna Magia & Klątwy': 'Czarnej Magii i Klątw',
  'Czarna Magia Północna': 'Czarnej Magii Północnej',
  'Eliksiry': 'Eliksirów',
  'Zaklęcia': 'Zaklęć',
  'Transmutacja': 'Transmutacji',
  'Historia Magii': 'Historii Magii',
  'Wróżbiarstwo': 'Wróżbiarstwa',
  'Astronomia': 'Astronomii',
  'Nekromancja': 'Nekromancji',
  'Runy': 'Run',
  'Studia Runiczne': 'Studiów Runicznych',
  'Obrona przed Czarną Magią': 'Obrony przed Czarną Magią',
  'Katedra Magii': 'Katedry Magii',
};

export function toDepartmentGenitive(name) {
  return DEPARTMENT_GENITIVE_MAP[name] || name;
}
