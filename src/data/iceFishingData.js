export const ICE_FISHING_CASTS = 4;

export const ICE_FISHING_BAITS = [
  {
    id: 'ice_worm',
    name: 'Lodowy robak',
    short: 'Bezpieczny połów ryb',
    icon: '🪱',
    pool: 'fish',
    zoneWidth: 32,
    maxUses: 4,
    accent: '#38bdf8'
  },
  {
    id: 'glow_larva',
    name: 'Świetlista larwa',
    short: 'Składniki alchemiczne',
    icon: '✨',
    pool: 'ingredient',
    zoneWidth: 27,
    maxUses: 2,
    accent: '#a78bfa'
  },
  {
    id: 'runic_lure',
    name: 'Runiczna błystka',
    short: 'Relikty Drakkarów',
    icon: 'ᚱ',
    pool: 'relic',
    zoneWidth: 22,
    maxUses: 1,
    accent: '#fbbf24'
  }
];

export const ICE_FISHING_LOOT = {
  fish: {
    common: { id: 'fishing-arctic-herring', name: 'Śledź Arktyczny', icon: '🐟', rarity: 'common' },
    uncommon: { id: 'fishing-blue-fjord-cod', name: 'Dorsz Błękitnego Fjordu', icon: '🐟', rarity: 'uncommon' },
    rare: { id: 'fishing-luminous-salmon', name: 'Świetlisty Łosoś Fiordów', icon: '🐠', rarity: 'rare' },
    epic: { id: 'fishing-golden-runic-roach', name: 'Złota Płotka Runiczna', icon: '🐠', rarity: 'epic' },
    legendary: { id: 'fishing-skadi-white-sturgeon', name: 'Biały Jesiotr Skadi', icon: '🐋', rarity: 'legendary' }
  },
  ingredient: {
    common: { id: 'fishing-frost-shrimp', name: 'Mroźna Krewetka', icon: '🦐', rarity: 'common' },
    uncommon: { id: 'fishing-ice-eel', name: 'Węgorz Lodowy', icon: '〰️', rarity: 'uncommon' },
    rare: { id: 'fishing-moon-ice-jelly', name: 'Meduza Księżycowego Lodu', icon: '🪼', rarity: 'rare' },
    epic: { id: 'fishing-ice-coral-heart', name: 'Serce Lodowego Koralowca', icon: '🪸', rarity: 'epic' },
    legendary: { id: 'fishing-ran-tear', name: 'Łza Rán', icon: '💧', rarity: 'legendary' }
  },
  relic: {
    common: { id: 'fishing-rusted-drakkar-hook', name: 'Zardzewiały Hak Drakkara', icon: '🪝', rarity: 'common' },
    uncommon: { id: 'fishing-jarl-coin', name: 'Moneta Zatopionego Jarla', icon: '🪙', rarity: 'uncommon' },
    rare: { id: 'fishing-sunken-drakkar-chest', name: 'Skrzynia Zatopionego Drakkara', icon: '📦', rarity: 'rare' },
    epic: { id: 'fishing-viking-ring', name: 'Zgubiony Pierścień Wikinga', icon: '💍', rarity: 'epic' },
    legendary: { id: 'fishing-young-leviathan-scale', name: 'Łuska Młodego Lewiatana', icon: '🔷', rarity: 'legendary' }
  }
};

export const ICE_FISHING_RARITY_LABELS = {
  common: 'Pospolita',
  uncommon: 'Niepospolita',
  rare: 'Rzadka',
  epic: 'Epicka',
  legendary: 'Legendarna'
};

export const ICE_FISHING_RARITY_COLORS = {
  common: '#cbd5e1',
  uncommon: '#4ade80',
  rare: '#38bdf8',
  epic: '#c084fc',
  legendary: '#fbbf24'
};

export function iceFishingHookGrade(reactionMs) {
  if (!Number.isFinite(reactionMs) || reactionMs < 0 || reactionMs >= 1300) return { grade: 'miss', points: 0 };
  if (reactionMs < 300) return { grade: 'perfect', points: 40 };
  if (reactionMs < 700) return { grade: 'good', points: 30 };
  return { grade: 'late', points: 20 };
}

export function iceFishingRarity(score) {
  if (score >= 165) return 'legendary';
  if (score >= 155) return 'epic';
  if (score >= 140) return 'rare';
  if (score >= 120) return 'uncommon';
  if (score >= 100) return 'common';
  return null;
}

export function evaluateLocalFishingCast({ reactionMs, reelGrades, baitId }) {
  const bait = ICE_FISHING_BAITS.find((entry) => entry.id === baitId) || ICE_FISHING_BAITS[0];
  const hook = iceFishingHookGrade(reactionMs);
  const normalized = hook.grade === 'miss' ? ['miss', 'miss', 'miss'] : reelGrades;
  const reelPoints = normalized.reduce((sum, grade) => sum + (grade === 'perfect' ? 30 : grade === 'good' ? 20 : 0), 0);
  const hits = normalized.filter((grade) => grade === 'perfect' || grade === 'good').length;
  const caught = hook.grade !== 'miss' && hits >= 2;
  const castScore = Math.min(170, hook.points + reelPoints + (caught ? 40 : 0));
  const rarity = caught ? iceFishingRarity(castScore) : null;
  return {
    id: `local-cast-${Date.now()}`,
    baitId,
    status: caught ? 'caught' : 'escaped',
    hookGrade: hook.grade,
    hookPoints: hook.points,
    reelGrades: normalized,
    reelPoints,
    castScore,
    caught,
    rarity,
    loot: rarity ? ICE_FISHING_LOOT[bait.pool][rarity] : null
  };
}
