// Deterministyczne definicje wszystkich działań opisowych mapy.

import { MAP_CONTENT_LOCATIONS } from './mapContentLocations.js';

function parseActions(location) {
  if (Array.isArray(location.actions)) return location.actions;
  try {
    const parsed = JSON.parse(location.actions || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function classifyAction(label) {
  if (/^kup(?:\s|$)/i.test(label)) return 'trade';
  if (/^wymień(?:\s|$)/i.test(label)) return 'exchange';
  if (/^wypożycz(?:\s|$)/i.test(label)) return 'service';
  if (/zbierz|zbieraj|zjedz|wydobądź|wykop/i.test(label)) return 'gather';
  if (/zapytaj|porozmawiaj|poproś|dowiedz|posłuchaj|wysłuchaj|spróbuj porozmawiać/i.test(label)) return 'social';
  if (/odczytaj|przestudiuj|przepisuj|przepisz|zrób kopię|obejrzyj map|obejrzyj tablic|sprawdź rozkład|kronik|znajdź archiwum|zapisz inskrypcje/i.test(label)) return 'research';
  if (/aktywuj|dotknij|zanurzenie|zaklę|przejdź bramę|połóż .*ołtarzu/i.test(label)) return 'ritual';
  if (/idź na połów|wyprawa|zdaj próbę/i.test(label)) return 'activity';
  if (/wejdź|odwiedź|wspinaj|zostań na noc|zejdź|podróż|idź do|poczekaj/i.test(label)) return 'travel';
  if (/zbadaj|eksploruj|szukaj|poszukaj|sprawdź|zajrzyj|nasłuchuj|zmierz|obserwuj/i.test(label)) return 'exploration';
  return 'roleplay';
}

function stripActionVerb(label) {
  return label
    .replace(/\([^)]*\)/g, '')
    .replace(/^(kup|wymień|wypożycz|zbierz|zbieraj|zjedz|wydobądź|wykop)\s+/i, '')
    .trim();
}

const KIND_CONFIG = {
  trade: {
    xp: 0,
    cost: 5,
    prompt: 'Potwierdź transakcję przyciskiem. Koszt zostanie pobrany tylko raz.',
  },
  service: {
    xp: 0,
    cost: 3,
    prompt: 'Usługa zostanie opłacona i zapisana jako dostępna dla tej wyprawy.',
  },
  exchange: {
    xp: 1,
    cost: 0,
    prompt: 'Wymiana zostanie zapisana, a otrzymany zestaw trafi do ekwipunku.',
  },
  gather: {
    xp: 1,
    cost: 0,
    prompt: 'Zebrany przedmiot trafi do twojego ekwipunku.',
  },
  social: {
    xp: 1,
    cost: 0,
    prompt: 'Napisz po wykonaniu akcji, o co pytasz lub co mówisz postaci.',
  },
  research: {
    xp: 2,
    cost: 0,
    prompt: 'Wynik badania zostanie zapisany w kronice lokacji.',
  },
  ritual: {
    xp: 3,
    cost: 0,
    prompt: 'Rytuał zostanie przeprowadzony i zapisany w kronice lokacji.',
  },
  activity: {
    xp: 2,
    cost: 0,
    prompt: 'Akcja rozpoczyna fabularne przygotowanie do aktywności.',
  },
  travel: {
    xp: 1,
    cost: 0,
    prompt: 'Przejście zostanie zapisane jako ukończone w tej lokacji.',
  },
  exploration: {
    xp: 2,
    cost: 0,
    prompt: 'Rezultat eksploracji zostanie zapisany w kronice lokacji.',
  },
  roleplay: {
    xp: 1,
    cost: 0,
    prompt: 'Rozwiń tę deklarację własną wiadomością w wątku.',
  },
};

function resultFor(kind, label, locationName) {
  const target = stripActionVerb(label);
  switch (kind) {
    case 'trade': return `Transakcja „${label}” w lokacji ${locationName} została zawarta. Otrzymujesz: ${target}.`;
    case 'service': return `Usługa „${label}” została opłacona i pozostaje do twojej dyspozycji podczas tej wyprawy.`;
    case 'exchange': return `Wymiana „${label}” została zakończona. Otrzymany zestaw trafia do twojego ekwipunku.`;
    case 'gather': return `Działanie „${label}” zakończone. Zdobycz trafia do twojego ekwipunku.`;
    case 'social': return `Rozpoczynasz rozmowę: „${label}”. Wątek jest gotowy na dalszą scenę fabularną.`;
    case 'research': return `Kończysz analizę „${label}”. Ustalenia zapisano w kronice lokacji ${locationName}.`;
    case 'ritual': return `Działanie magiczne „${label}” zostało przeprowadzone bezpiecznie i odnotowane.`;
    case 'activity': return `Przygotowanie „${label}” zakończone. Możesz kontynuować właściwą aktywność z poziomu portalu.`;
    case 'travel': return `Trasa „${label}” została pokonana i zapisana w kronice wyprawy.`;
    case 'exploration': return `Eksploracja „${label}” przynosi nowe informacje o lokacji ${locationName}.`;
    default: return `Działanie „${label}” zostało wykonane i zapisane w kronice lokacji ${locationName}.`;
  }
}

export function buildLocationActionDefinition(location, actionLabel, actionIndex) {
  const label = String(actionLabel || '').trim();
  const kind = classifyAction(label);
  const config = KIND_CONFIG[kind];
  const grantsItem = kind === 'trade' || kind === 'exchange' || kind === 'gather';

  return {
    id: `${location.id}:action:${actionIndex}`,
    locationId: location.id,
    actionIndex,
    label,
    kind,
    prompt: config.prompt,
    result: resultFor(kind, label, location.name),
    effects: {
      xp: config.xp,
      skirnirCost: config.cost,
      item: grantsItem ? stripActionVerb(label) : null,
    },
    oncePerUser: true,
  };
}

export function buildAllLocationActionDefinitions(locations = MAP_CONTENT_LOCATIONS) {
  return locations.flatMap(location =>
    parseActions(location).map((action, index) => buildLocationActionDefinition(location, action, index))
  );
}

export const LOCATION_ACTION_DEFINITIONS = buildAllLocationActionDefinitions();

export function auditLocationActionDefinitions(locations = MAP_CONTENT_LOCATIONS, definitions = LOCATION_ACTION_DEFINITIONS) {
  const expected = locations.reduce((total, location) => total + parseActions(location).length, 0);
  const ids = new Set();
  const invalid = [];
  for (const definition of definitions) {
    if (ids.has(definition.id)) invalid.push(`${definition.id}: duplikat`);
    ids.add(definition.id);
    if (!definition.label || !definition.result || !definition.prompt) invalid.push(`${definition.id}: brak treści`);
    if (!definition.effects || definition.effects.xp < 0 || definition.effects.skirnirCost < 0) invalid.push(`${definition.id}: błędne efekty`);
  }
  return {
    expected,
    generated: definitions.length,
    invalid,
    complete: expected === definitions.length && invalid.length === 0,
  };
}
