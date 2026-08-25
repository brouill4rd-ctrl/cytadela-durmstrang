import { normalizeHouseKey } from '../components/HeraldicEmblems';

export const ORDER_IDENTITIES = Object.freeze({
  reinhall: { lens: 'stare szlaki', approach: 'Odnajdź dawną drogę i ślady pamięci rodowej.', themes: ['ekspedycja', 'tropienie', 'tradycja'] },
  bjornhall: { lens: 'obrona', approach: 'Zabezpiecz miejsce, wzmocnij mechanizm albo podejmij próbę siły.', themes: ['obrona', 'rzemiosło', 'pojedynek'] },
  ravnheim: { lens: 'ukryte znaki', approach: 'Odczytaj inskrypcję, zbadaj sekret i poszukaj znaczenia.', themes: ['wiedza', 'sekrety', 'przepowiednia'] },
  otergard: { lens: 'adaptacja', approach: 'Wykorzystaj alchemię, transmutację lub sprytny układ.', themes: ['alchemia', 'handel', 'dyplomacja'] }
});

export function resolveOrderContext(user, scenario = {}) {
  const orderId = normalizeHouseKey(user?.house || user?.house_id || user?.houseId || '');
  const identity = ORDER_IDENTITIES[orderId] || null;
  const variant = identity && scenario.orderVariants?.[orderId];
  return {
    orderId: identity ? orderId : null,
    identity,
    narrative: variant?.narrative || scenario.defaultNarrative || '',
    optionalSolution: variant?.solution || identity?.approach || null,
    canUseOptionalSolution: Boolean(identity),
    required: false
  };
}

