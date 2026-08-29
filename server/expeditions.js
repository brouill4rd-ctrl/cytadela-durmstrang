export const EXPEDITION_DAILY_LIMIT = 3;

export const EXPEDITIONS = {
  drakkar_graveyard: {
    id: 'drakkar_graveyard',
    name: 'Cmentarzysko Drakkarów we Fjordzie',
    successThreshold: 3,
    choices: [
      { stage: 0, id: 'borealis', score: 2 },
      { stage: 0, id: 'drakkar_leap', score: 3 },
      { stage: 0, id: 'ice_probe', score: 1 },
      { stage: 1, id: 'norse_greeting', score: 3 },
      { stage: 1, id: 'protego', score: 2 },
      { stage: 1, id: 'break_chains', score: 1 }
    ],
    tiers: {
      3: { coins: 15, points: 10 },
      4: { coins: 15, points: 10 },
      5: { coins: 20, points: 12 },
      6: { coins: 25, points: 15, item: 'Srebrny Naszyjnik Jarlów Fiordu' }
    }
  },
  shadow_forest: {
    id: 'shadow_forest',
    name: 'Przeklęta Puszcza Cieni (Myrkviðr)',
    successThreshold: 4,
    choices: [
      { stage: 0, id: 'ignis', score: 2 },
      { stage: 0, id: 'invisibility', score: 3 },
      { stage: 0, id: 'tree_route', score: 1 },
      { stage: 1, id: 'clean_runes', score: 3 },
      { stage: 1, id: 'collect_moss', score: 2 },
      { stage: 1, id: 'take_offering', score: 1 }
    ],
    tiers: {
      4: { coins: 35, points: 18 },
      5: { coins: 42, points: 22 },
      6: { coins: 50, points: 25, item: 'Amulet z Kła Wilka Cienia' }
    }
  },
  jotun_caves: {
    id: 'jotun_caves',
    name: 'Jaskinie Lodowych Olbrzymów (Jotunheimen)',
    successThreshold: 5,
    choices: [
      { stage: 0, id: 'thurisaz', score: 2 },
      { stage: 0, id: 'weak_point', score: 3 },
      { stage: 0, id: 'ice_charge', score: 1 },
      { stage: 1, id: 'order_seal', score: 3 },
      { stage: 1, id: 'isolate_crystal', score: 2 },
      { stage: 1, id: 'touch_crystal', score: 1 }
    ],
    tiers: {
      5: { coins: 75, points: 32 },
      6: { coins: 100, points: 40, item: 'Kryształ Wiecznego Lodu Jotunów' }
    }
  }
};

export function warsawDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Warsaw',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function evaluateExpedition(destinationId, choiceIds) {
  const expedition = EXPEDITIONS[destinationId];
  if (!expedition) throw new Error('Nieznany cel ekspedycji.');
  if (!Array.isArray(choiceIds) || choiceIds.length !== 2) {
    throw new Error('Ekspedycja wymaga podjęcia dokładnie dwóch decyzji.');
  }

  const selected = choiceIds.map((choiceId) => expedition.choices.find((choice) => choice.id === choiceId));
  if (selected.some((choice) => !choice) || selected[0].stage !== 0 || selected[1].stage !== 1) {
    throw new Error('Przebieg ekspedycji zawiera nieprawidłowe decyzje.');
  }

  const score = selected.reduce((sum, choice) => sum + choice.score, 0);
  const success = score >= expedition.successThreshold;
  const tier = success ? expedition.tiers[score] : null;

  if (success && !tier) throw new Error('Nie udało się ustalić progu nagrody.');
  return {
    score,
    maxScore: 6,
    success,
    coins: tier?.coins || 0,
    points: tier?.points || 0,
    item: tier?.item || null
  };
}

