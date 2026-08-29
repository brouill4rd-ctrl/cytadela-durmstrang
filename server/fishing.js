export const FISHING_DAILY_LIMIT = 3;
export const FISHING_CASTS_PER_SESSION = 4;
export const FISHING_SESSION_TTL_MINUTES = 15;
export const FISHING_MIN_REWARD_DURATION_MS = 20_000;

export const FISHING_BAITS = {
  ice_worm: {
    id: 'ice_worm',
    name: 'Lodowy robak',
    pool: 'fish',
    zoneWidth: 32,
    maxUses: 4
  },
  glow_larva: {
    id: 'glow_larva',
    name: 'Świetlista larwa',
    pool: 'ingredient',
    zoneWidth: 27,
    maxUses: 2
  },
  runic_lure: {
    id: 'runic_lure',
    name: 'Runiczna błystka',
    pool: 'relic',
    zoneWidth: 22,
    maxUses: 1
  }
};

export const FISHING_LOOT = {
  fish: {
    common: {
      id: 'fishing-arctic-herring', name: 'Śledź Arktyczny', icon: '🐟', rarity: 'common',
      category: 'Ryby fiordu', description: 'Srebrzysta ryba z najpłytszych wód zamarzniętego fiordu.'
    },
    uncommon: {
      id: 'fishing-blue-fjord-cod', name: 'Dorsz Błękitnego Fjordu', icon: '🐟', rarity: 'uncommon',
      category: 'Ryby fiordu', description: 'Dorsz o łuskach przybierających barwę polarnego nieba.'
    },
    rare: {
      id: 'fishing-luminous-salmon', name: 'Świetlisty Łosoś Fiordów', icon: '🐠', rarity: 'rare',
      category: 'Ryby fiordu', description: 'Jego łuski jarzą się błękitnym blaskiem nawet po wyjęciu z wody.'
    },
    epic: {
      id: 'fishing-golden-runic-roach', name: 'Złota Płotka Runiczna', icon: '🐠', rarity: 'epic',
      category: 'Ryby fiordu', description: 'Na złotych łuskach nosi naturalny wzór przypominający starszy Futhark.'
    },
    legendary: {
      id: 'fishing-skadi-white-sturgeon', name: 'Biały Jesiotr Skadi', icon: '🐋', rarity: 'legendary',
      category: 'Ryby fiordu', description: 'Legendarny okaz, który według rybaków płynie śladem bogini Skadi.'
    }
  },
  ingredient: {
    common: {
      id: 'fishing-frost-shrimp', name: 'Mroźna Krewetka', icon: '🦐', rarity: 'common',
      category: 'Składniki alchemiczne', description: 'Drobny skorupiak zachowujący lodowy chłód przez wiele godzin.'
    },
    uncommon: {
      id: 'fishing-ice-eel', name: 'Węgorz Lodowy', icon: '〰️', rarity: 'uncommon',
      category: 'Składniki alchemiczne', description: 'Giętki węgorz używany w eliksirach odporności na mróz.'
    },
    rare: {
      id: 'fishing-moon-ice-jelly', name: 'Meduza Księżycowego Lodu', icon: '🪼', rarity: 'rare',
      category: 'Składniki alchemiczne', description: 'Przezroczysta meduza reagująca na światło zorzy polarnej.'
    },
    epic: {
      id: 'fishing-ice-coral-heart', name: 'Serce Lodowego Koralowca', icon: '🪸', rarity: 'epic',
      category: 'Składniki alchemiczne', description: 'Rzadki koral pulsujący bladym światłem pod warstwą lodu.'
    },
    legendary: {
      id: 'fishing-ran-tear', name: 'Łza Rán', icon: '💧', rarity: 'legendary',
      category: 'Składniki alchemiczne', description: 'Kropla morskiej magii przypisywana nordyckiej władczyni głębin.'
    }
  },
  relic: {
    common: {
      id: 'fishing-rusted-drakkar-hook', name: 'Zardzewiały Hak Drakkara', icon: '🪝', rarity: 'common',
      category: 'Relikty Drakkarów', description: 'Stary hak wygięty przez dziesięciolecia spędzone pod lodem.'
    },
    uncommon: {
      id: 'fishing-jarl-coin', name: 'Moneta Zatopionego Jarla', icon: '🪙', rarity: 'uncommon',
      category: 'Relikty Drakkarów', description: 'Srebrna moneta z zatartym profilem dawnego jarla.'
    },
    rare: {
      id: 'fishing-sunken-drakkar-chest', name: 'Skrzynia Zatopionego Drakkara', icon: '📦', rarity: 'rare',
      category: 'Relikty Drakkarów', description: 'Niewielka skrzynia spięta runiczną, pokrytą szronem klamrą.'
    },
    epic: {
      id: 'fishing-viking-ring', name: 'Zgubiony Pierścień Wikinga', icon: '💍', rarity: 'epic',
      category: 'Relikty Drakkarów', description: 'Pierścień wojownika, na którym wciąż widnieje znak jego rodu.'
    },
    legendary: {
      id: 'fishing-young-leviathan-scale', name: 'Łuska Młodego Lewiatana', icon: '🔷', rarity: 'legendary',
      category: 'Relikty Drakkarów', description: 'Niemal niezniszczalna łuska wydobyta z najciemniejszej toni.'
    }
  }
};

export const FISHING_RARITY_RANK = {
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 4,
  legendary: 5
};

export function getFishingLootById(lootId) {
  for (const pool of Object.values(FISHING_LOOT)) {
    for (const loot of Object.values(pool)) {
      if (loot.id === lootId) return loot;
    }
  }
  return null;
}

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

export function gradeHook(reactionMs) {
  if (!Number.isFinite(reactionMs) || reactionMs < 0 || reactionMs >= 1300) {
    return { grade: 'miss', points: 0 };
  }
  if (reactionMs < 300) return { grade: 'perfect', points: 40 };
  if (reactionMs < 700) return { grade: 'good', points: 30 };
  return { grade: 'late', points: 20 };
}

export function reelGradePoints(grade) {
  if (grade === 'perfect') return 30;
  if (grade === 'good') return 20;
  if (grade === 'miss') return 0;
  throw new Error('Nieprawidłowa ocena holowania.');
}

export function rarityForCastScore(score) {
  if (score >= 165) return 'legendary';
  if (score >= 155) return 'epic';
  if (score >= 140) return 'rare';
  if (score >= 120) return 'uncommon';
  if (score >= 100) return 'common';
  return null;
}

export function rewardForSessionScore(score) {
  const safeScore = Math.max(0, Math.min(680, Math.round(Number(score) || 0)));
  if (safeScore < 200) return { housePoints: 0, skirnirs: 0 };
  if (safeScore < 320) return { housePoints: 2, skirnirs: 2 };
  if (safeScore < 440) return { housePoints: 4, skirnirs: 4 };
  if (safeScore < 560) return { housePoints: 6, skirnirs: 6 };
  return { housePoints: 8, skirnirs: 8 };
}

export function evaluateFishingCast({ reactionMs, reelGrades, baitId }) {
  const bait = FISHING_BAITS[baitId];
  if (!bait) throw new Error('Nieprawidłowa przynęta.');
  if (!Array.isArray(reelGrades) || reelGrades.length !== 3) {
    throw new Error('Holowanie musi zawierać dokładnie trzy próby.');
  }

  const hook = gradeHook(reactionMs);
  const normalizedReels = hook.grade === 'miss' ? ['miss', 'miss', 'miss'] : reelGrades;
  const reelPoints = normalizedReels.reduce((sum, grade) => sum + reelGradePoints(grade), 0);
  const reelHits = normalizedReels.filter((grade) => grade === 'perfect' || grade === 'good').length;
  const caught = hook.grade !== 'miss' && reelHits >= 2;
  const castScore = Math.min(170, hook.points + reelPoints + (caught ? 40 : 0));
  const rarity = caught ? rarityForCastScore(castScore) : null;
  const loot = rarity ? FISHING_LOOT[bait.pool][rarity] : null;

  return {
    baitId,
    hookGrade: hook.grade,
    hookPoints: hook.points,
    reelGrades: normalizedReels,
    reelPoints,
    reelHits,
    caught,
    castScore,
    rarity,
    loot
  };
}

export function selectBestRewardLoot(casts) {
  return (casts || [])
    .filter((cast) => cast.loot && FISHING_RARITY_RANK[cast.loot.rarity] >= FISHING_RARITY_RANK.rare)
    .sort((a, b) => {
      const rarityDiff = FISHING_RARITY_RANK[b.loot.rarity] - FISHING_RARITY_RANK[a.loot.rarity];
      if (rarityDiff !== 0) return rarityDiff;
      const scoreDiff = (b.castScore || 0) - (a.castScore || 0);
      if (scoreDiff !== 0) return scoreDiff;
      return (a.castIndex || 0) - (b.castIndex || 0);
    })[0]?.loot || null;
}

export function validateBaitUsage(casts, baitId) {
  const bait = FISHING_BAITS[baitId];
  if (!bait) throw new Error('Nieprawidłowa przynęta.');
  const uses = (casts || []).filter((cast) => cast.baitId === baitId).length;
  if (uses >= bait.maxUses) {
    throw new Error(`Limit przynęty „${bait.name}” w tej wyprawie został wykorzystany.`);
  }
  return true;
}
