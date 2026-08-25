export const BELT_TARGETS = {
  TIMETABLE: { label: 'Plan zajęć', object: 'Runiczna tabliczka', view: 'timetable', glyph: '▤', kind: 'scroll', description: 'Otwórz plan zajęć Cytadeli.' },
  RAVEN: { label: 'Poczta Kruków', object: 'Czarne pióro', view: 'raven-post', glyph: 'ϟ', kind: 'feather', description: 'Przejdź do swoich kruczych wiadomości.', badge: 'raven' },
  INVENTORY: { label: 'Ekwipunek', object: 'Klucz skarbca', view: 'profile', glyph: '⚿', kind: 'key', description: 'Otwórz kartę postaci i ekwipunek.' },
  BANK: { label: 'Bank Skirnirów', object: 'Stara moneta', view: 'bank', glyph: '◉', kind: 'coin', description: 'Przejdź do swojego skarbca.' },
  MARKET: { label: 'Kaupangr', object: 'Kupiecka pieczęć', view: 'markethall', glyph: '◇', kind: 'seal', description: 'Otwórz magiczny rynek.' },
  MAP: { label: 'Mapa Cytadeli', object: 'Fragment mapy', view: 'map', glyph: '⌁', kind: 'map', description: 'Odsłoń mapę Cytadeli.' },
  HOMEWORK: { label: 'Prace domowe', object: 'Zwój zadania', view: 'homework', glyph: '≋', kind: 'scroll', description: 'Sprawdź prace i terminy.', badge: 'homework' },
  EXAMS: { label: 'Egzaminy', object: 'Medalion próby', view: 'exams', glyph: '✦', kind: 'medallion', description: 'Wejdź do Centrum Egzaminacyjnego.' },
  GAZETTE: { label: 'Żelazne Pióro', object: 'Karta pergaminu', view: 'gazette', glyph: '▱', kind: 'scroll', description: 'Przeczytaj gazetkę Cytadeli.' },
  ACADEMIC: { label: 'Katedry', object: 'Kamień wiedzy', view: 'academic', glyph: 'ᛞ', kind: 'rune', description: 'Przejdź do Katedr Cytadeli.' }
};

const VIEW_TO_TARGET = Object.fromEntries(Object.entries(BELT_TARGETS).map(([key, value]) => [value.view, key]));

export function targetForView(activeView, activeSubjectId, subjects = []) {
  if (activeView === 'subject-detail' && activeSubjectId) return { targetType: 'SUBJECT', targetId: activeSubjectId };
  const targetType = VIEW_TO_TARGET[activeView];
  return targetType ? { targetType, targetId: '' } : null;
}

export function describeTarget(shortcut, subjects = []) {
  if (shortcut.targetType === 'SUBJECT') {
    const subject = subjects.find(x => x.id === shortcut.targetId);
    return subject ? { label: subject.name, object: 'Runiczny kamień', view: 'subject-detail', glyph: subject.icon || 'ᚱ', kind: 'rune', description: `Przejdź do Katedry: ${subject.name}.`, subjectId: subject.id, available: subject.isActive !== false } : { label: 'Zapomniana Katedra', object: 'Wygaszona runa', glyph: '᛫', kind: 'rune', description: 'Ten cel nie istnieje już w rejestrze.', available: false };
  }
  const target = BELT_TARGETS[shortcut.targetType];
  return target ? { ...target, available: true } : { label: 'Nieznany znak', object: 'Wygaszona runa', glyph: '᛫', kind: 'rune', description: 'Ten cel nie jest już obsługiwany.', available: false };
}
