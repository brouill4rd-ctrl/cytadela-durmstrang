// Seed data for Shopping Lists (Listy Zakupów / Wyprawki Szkolne)

export const SEED_SHOPPING_LISTS = [
  {
    id: 'list-year1-starter',
    title: 'Oficjalna Wyprawka Adepta Roku I',
    slug: 'year1-starter',
    subtitle: 'Niezbędne wyposażenie każdego nowicjusza przekraczającego wrota Durmstrangu.',
    category: 'Wyprawki Szkolne',
    requiredItemIds: [
      'robe-fur-durmstrang',
      'book-rune-codex',
      'wand-yew-kelpie',
      'item-cauldron-iron',
      'item-phial-crystal'
    ],
    rewardPoints: 60,
    rewardSkirnirs: 100,
    icon: '📜',
    badge: 'Adept Przygotowany',
    lore: '„Żaden adept nie przekroczy progu Wielkiej Sali bez ciepłego wilczego futra, różdżki i świętego kodeksu runów.” — Tradycja Założycielska'
  },
  {
    id: 'list-alchemy-master',
    title: 'Zestaw Młodego Toksykologa i Alchemika',
    slug: 'alchemy-master',
    subtitle: 'Sprzęt laboratoryjny i rzadkie komponenty do warzenia lodowych destylatów.',
    category: 'Specjalizacje Naukowe',
    requiredItemIds: [
      'item-cauldron-iron',
      'item-phial-crystal',
      'potion-frost-sight',
      'book-forbidden-alchemy',
      'robe-otter-aqua'
    ],
    rewardPoints: 85,
    rewardSkirnirs: 140,
    icon: '🧪',
    badge: 'Mistrz Tyglu Północy',
    lore: 'Przeznaczony dla adeptów Katedry Eliksirów i Toksyn oraz Zakonu Otergard.'
  },
  {
    id: 'list-holmgang-warrior',
    title: 'Rynsztunek Bojowy Wojownika Hólmganga',
    slug: 'holmgang-warrior',
    subtitle: 'Komplet ochronny i wzmacniający do starć na lodowej arenie pojedynkowej.',
    category: 'Liga Bojowa',
    requiredItemIds: [
      'wand-ebony-dragon',
      'robe-bear-iron',
      'potion-berserk-blood',
      'artifact-valkyrie-ring',
      'item-duel-gauntlets'
    ],
    rewardPoints: 110,
    rewardSkirnirs: 200,
    icon: '⚔️',
    badge: 'Szermierz Runiczny',
    lore: 'Pieczętowany przez Mistrza Broni Gunnara Vargsona przed turniejem zimowym.'
  },
  {
    id: 'list-shadow-infiltrator',
    title: 'Rytualne Wyposażenie Kręgu Cienia & Nekromancji',
    slug: 'shadow-infiltrator',
    subtitle: 'Narzędzia i grimuary dla adeptów badających mroczne anomalie i wiązanie dusz.',
    category: 'Czarna Magia',
    requiredItemIds: [
      'wand-ash-phoenix',
      'robe-raven-shadow',
      'book-shadow-grimoire',
      'potion-essence-shadow',
      'artifact-blood-pendant'
    ],
    rewardPoints: 120,
    rewardSkirnirs: 220,
    icon: '🔮',
    badge: 'Władca Cieni',
    lore: 'Księgi i szaty przesiąknięte magią nocy polarnej, zatwierdzone przez Katedrę Czarnej Magii.'
  },
  {
    id: 'list-arctic-explorer',
    title: 'Wyprawa na Północne Bezdroża i Fiordy',
    slug: 'arctic-explorer',
    subtitle: 'Zestaw przetrwania w wiecznej zmarzlinie oraz magiczny przewodnik.',
    category: 'Eksploracja',
    requiredItemIds: [
      'robe-fur-durmstrang',
      'potion-frost-sight',
      'artifact-mercury-compass',
      'pet-shadow-raven',
      'item-dragon-boots'
    ],
    rewardPoints: 95,
    rewardSkirnirs: 160,
    icon: '🧭',
    badge: 'Tropiciel Zórz',
    lore: 'Dla śmiałków wyruszających badać lodowce Jostedal i pradawne kurhany wikingów.'
  }
];
