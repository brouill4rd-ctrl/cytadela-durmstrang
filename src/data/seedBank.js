// Seed data for Bank of Durmstrang (Kaupangr Skírnisbanki / Skarbiec Północy)

export const SEED_BANK_ACCOUNTS = [
  {
    id: 'vault-valdemar',
    userId: 'usr-valdemar',
    userName: 'Valdemar Krag-Hansen',
    vaultNumber: 'SKR-782-RAVN',
    vaultTier: 'Skrytka Adepta Kręgu IV',
    balance: 340,
    securityLevel: 'Maksymalny',
    runeSeal: 'Pieczęć Algiz & Kenaz',
    guardian: 'Górski Troll Granitowy (Brokk)',
    interestRate: '2.5% rocznie',
    openedAt: '2026-08-01'
  },
  {
    id: 'vault-morana',
    userId: 'usr-morana',
    userName: 'Prof. Morana Vane',
    vaultNumber: 'SKR-204-PROF',
    vaultTier: 'Krypta Profesorska Katedry Czarnej Magii',
    balance: 1450,
    securityLevel: 'Rada Mistrzów',
    runeSeal: 'Pieczęć Thurisaz & Eihwaz',
    guardian: 'Zjawa Lodowcowa Strażnika Cieni',
    interestRate: '4.0% rocznie',
    openedAt: '2026-07-15'
  },
  {
    id: 'vault-gunnar',
    userId: 'usr-gunnar',
    userName: 'Prof. Gunnar Vargson',
    vaultNumber: 'SKR-205-PROF',
    vaultTier: 'Zbrojownia Bankowa Ligi Bojowej',
    balance: 1200,
    securityLevel: 'Rada Mistrzów',
    runeSeal: 'Pieczęć Tiwaz & Sowilo',
    guardian: 'Żelazny Golem Północy',
    interestRate: '4.0% rocznie',
    openedAt: '2026-07-20'
  },
  {
    id: 'vault-valgerda',
    userId: 'usr-valgerda',
    userName: 'Arcymistrzyni Valgerda Storm',
    vaultNumber: 'SKR-001-DIR',
    vaultTier: 'Najwyższy Skarbiec Dyrekcji Durmstrang',
    balance: 15400,
    securityLevel: 'Pakt 1294 (Nienaruszalny)',
    runeSeal: 'Pierwotna Pieczęć Othala & Dagaz',
    guardian: 'Pradawny Smok Szwedzki Krótkopyski',
    interestRate: '6.0% rocznie',
    openedAt: '2026-06-01'
  }
];

export const SEED_BANK_TRANSACTIONS = [
  {
    id: 'tx-skr-101',
    senderId: 'cytadela-treasury',
    senderName: 'Skarbiec Główny Cytadeli',
    recipientId: 'usr-valdemar',
    recipientName: 'Valdemar Krag-Hansen',
    amount: 150,
    type: 'inflow', // 'inflow' | 'outflow'
    category: 'stypendium', // 'stypendium', 'przelew', 'zakup', 'pensja', 'nagroda_wyprawka', 'loteria'
    title: 'Stypendium Naukowe Katedry Czarnej Magii',
    note: 'Nagroda za wzorowe opanowanie wiązania cieni i aktywność na zajęciach.',
    status: 'completed',
    date: '2026-08-20 14:30',
    referenceCode: 'SKR-TX-84920'
  },
  {
    id: 'tx-skr-102',
    senderId: 'usr-valdemar',
    senderName: 'Valdemar Krag-Hansen',
    recipientId: 'shop-brokkur',
    recipientName: 'Kuźnia Różdżek Brokkura & Oivinda',
    amount: 280,
    type: 'outflow',
    category: 'zakup',
    title: 'Zakup: Różdżka Cisowa (Wilcze Serce)',
    note: 'Płatność bezgotówkowa na rynku Kaupangr.',
    status: 'completed',
    date: '2026-08-19 11:15',
    referenceCode: 'SKR-TX-84711'
  },
  {
    id: 'tx-skr-103',
    senderId: 'cytadela-treasury',
    senderName: 'Skarbiec Główny Cytadeli',
    recipientId: 'usr-morana',
    recipientName: 'Prof. Morana Vane',
    amount: 300,
    type: 'inflow',
    category: 'pensja',
    title: 'Uposażenie Profesorskie — Lekcja: Wiązanie Cieni',
    note: 'Automatyczna wypłata honorarium po publikacji Dziennika Lekcyjnego #DL-001.',
    status: 'completed',
    date: '2026-08-18 16:45',
    referenceCode: 'SKR-TX-84602'
  },
  {
    id: 'tx-skr-104',
    senderId: 'cytadela-treasury',
    senderName: 'Skarbiec Główny Cytadeli',
    recipientId: 'usr-gunnar',
    recipientName: 'Prof. Gunnar Vargson',
    amount: 300,
    type: 'inflow',
    category: 'pensja',
    title: 'Uposażenie Profesorskie — Lekcja: Pojedynki na Lodzie',
    note: 'Automatyczna wypłata honorarium po zatwierdzeniu zajęć bojowych.',
    status: 'completed',
    date: '2026-08-17 17:00',
    referenceCode: 'SKR-TX-84590'
  },
  {
    id: 'tx-skr-105',
    senderId: 'lottery-pool',
    senderName: 'Skandynawska Loteria Odyna',
    recipientId: 'usr-valdemar',
    recipientName: 'Valdemar Krag-Hansen',
    amount: 120,
    type: 'inflow',
    category: 'loteria',
    title: 'Wygrana II Stopnia — Losowanie Letniego Przesilenia',
    note: 'Trafienie 2 run Futharku: Thurisaz i Algiz.',
    status: 'completed',
    date: '2026-08-15 20:00',
    referenceCode: 'SKR-TX-84310'
  },
  {
    id: 'tx-skr-106',
    senderId: 'cytadela-treasury',
    senderName: 'Rada Dyrekcji Cytadeli',
    recipientId: 'usr-valdemar',
    recipientName: 'Valdemar Krag-Hansen',
    amount: 100,
    type: 'inflow',
    category: 'nagroda_wyprawka',
    title: 'Nagroda za skompletowanie: Wyprawka Adepta Roku I',
    note: 'Premia w Skirnirach za pomyślne przygotowanie do roku szkolnego.',
    status: 'completed',
    date: '2026-08-10 12:00',
    referenceCode: 'SKR-TX-84102'
  }
];

export const TEACHER_SALARY_CONFIG = {
  lessonBaseRate: 200, // 200 Skirnirów za poprowadzoną lekcję
  bonusHighParticipation: 50, // bonus za >10 uczestników
  monthlyAllowance: 600, // stałe miesięczne uposażenie z budżetu szkoły
  currencySymbol: 'Skirnirów',
  currencyRune: 'ᛋ'
};
