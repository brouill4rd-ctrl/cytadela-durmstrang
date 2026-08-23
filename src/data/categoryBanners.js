export const CATEGORY_BANNERS = [
  {
    id: 'eliksiry',
    categoryName: 'Eliksiry & Alchemia',
    defaultScript: 'eliksiry',
    themeColor: '#4cc9f0',
    description: 'Katedra Eliksirów, destylacja wywarów i alchemia mroźna',
    bgGradient: 'radial-gradient(circle at 50% 60%, rgba(14, 28, 48, 0.95) 0%, rgba(4, 8, 14, 0.98) 100%)',
    bgType: 'potions'
  },
  {
    id: 'edykty',
    categoryName: 'Edykty Dyrekcji',
    defaultScript: 'edykty dyrekcji',
    themeColor: 'var(--gold-ancient)',
    description: 'Oficjalne dekrety, inauguracje i zarządzenia Rady Mistrzów',
    bgGradient: 'radial-gradient(circle at 50% 60%, rgba(38, 28, 12, 0.95) 0%, rgba(6, 6, 8, 0.98) 100%)',
    bgType: 'citadel'
  },
  {
    id: 'czarna-magia',
    categoryName: 'Czarna Magia & Klątwy',
    defaultScript: 'czarna magia',
    themeColor: '#b18cfe',
    description: 'Klątwy, pętanie cieni, nekromancja i rytuały północy',
    bgGradient: 'radial-gradient(circle at 50% 60%, rgba(28, 14, 46, 0.95) 0%, rgba(4, 3, 8, 0.98) 100%)',
    bgType: 'shadow'
  },
  {
    id: 'liga-bojowa',
    categoryName: 'Liga Bojowa & Hólmganga',
    defaultScript: 'liga bojowa',
    themeColor: '#ff5c5c',
    description: 'Pojedynki na lodzie, turnieje szermierki i magia defensywna',
    bgGradient: 'radial-gradient(circle at 50% 60%, rgba(44, 14, 14, 0.95) 0%, rgba(8, 3, 3, 0.98) 100%)',
    bgType: 'duel'
  },
  {
    id: 'starozytne-runy',
    categoryName: 'Starożytne Runy',
    defaultScript: 'starozytne runy',
    themeColor: '#2ec4b6',
    description: 'Wykucie formuł runicznych (Galdr), inskrypcje i monolity',
    bgGradient: 'radial-gradient(circle at 50% 60%, rgba(10, 36, 34, 0.95) 0%, rgba(3, 8, 8, 0.98) 100%)',
    bgType: 'runes'
  },
  {
    id: 'astronomia',
    categoryName: 'Astronomia & Astromagia',
    defaultScript: 'astronomia',
    themeColor: '#a4c8e1',
    description: 'Pomiary zorzy polarnej, pływy eteryczne i przesilenia',
    bgGradient: 'radial-gradient(circle at 50% 60%, rgba(16, 26, 44, 0.95) 0%, rgba(4, 6, 12, 0.98) 100%)',
    bgType: 'aurora'
  },
  {
    id: 'oceny',
    categoryName: 'Wyniki Ocen & Egzaminy',
    defaultScript: 'oceny',
    themeColor: '#eecf82',
    description: 'Wykazy semestralne, certyfikaty biegłości i traktaty',
    bgGradient: 'radial-gradient(circle at 50% 60%, rgba(32, 26, 16, 0.95) 0%, rgba(6, 6, 6, 0.98) 100%)',
    bgType: 'scrolls'
  },
  {
    id: 'wieści-zakonne',
    categoryName: 'Wieści Zakonne',
    defaultScript: 'wiesci zakonne',
    themeColor: '#c59f4e',
    description: 'Komunikaty Zakonów: Reinhall, Björnhall, Ravnheim, Otergard',
    bgGradient: 'radial-gradient(circle at 50% 60%, rgba(24, 20, 28, 0.95) 0%, rgba(5, 5, 8, 0.98) 100%)',
    bgType: 'houses'
  },
  {
    id: 'zielarstwo',
    categoryName: 'Zielarstwo & Flora Mroźna',
    defaultScript: 'zielarstwo',
    themeColor: '#52b788',
    description: 'Krioflora, korzenie mandragory polarnej i szklarnie',
    bgGradient: 'radial-gradient(circle at 50% 60%, rgba(14, 34, 22, 0.95) 0%, rgba(3, 8, 5, 0.98) 100%)',
    bgType: 'herbs'
  }
];

// Helper to find banner by category name or id
export const getCategoryBanner = (categoryOrId) => {
  if (!categoryOrId) return CATEGORY_BANNERS[0];
  const query = categoryOrId.toLowerCase().trim();
  return (
    CATEGORY_BANNERS.find(b => b.id === query || b.categoryName.toLowerCase() === query || b.defaultScript.toLowerCase() === query) ||
    CATEGORY_BANNERS.find(b => query.includes(b.id) || b.categoryName.toLowerCase().includes(query) || query.includes(b.defaultScript.toLowerCase())) ||
    CATEGORY_BANNERS[0]
  );
};
