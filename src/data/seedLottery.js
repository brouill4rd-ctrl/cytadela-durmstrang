// Seed data for Scandinavian Lottery (Skandynawska Loteria Odyna / Skírnir Lotto)

export const ELDER_FUTHARK_RUNES = [
  { id: 'fehu', rune: 'ᚠ', name: 'Fehu', meaning: 'Bogactwo, złoto i bydło', color: '#c59f4e' },
  { id: 'uruz', rune: 'ᚢ', name: 'Uruz', meaning: 'Siła pierwotna, żubr lodowy', color: '#e58f65' },
  { id: 'thurisaz', rune: 'ᚦ', name: 'Thurisaz', meaning: 'Cierń olbrzyma, burza', color: '#c02b2b' },
  { id: 'ansuz', rune: 'ᚨ', name: 'Ansuz', meaning: 'Głos Odyna, mądrość bogów', color: '#a77de0' },
  { id: 'raidho', rune: 'ᚱ', name: 'Raidho', meaning: 'Wyprawa drakkarem, podróż', color: '#2ec4b6' },
  { id: 'kenaz', rune: 'ᚲ', name: 'Kenaz', meaning: 'Pochodnia, ogień kuźni', color: '#eab308' },
  { id: 'gebo', rune: 'ᚷ', name: 'Gebo', meaning: 'Dar, więź braterstwa', color: '#60a5fa' },
  { id: 'wunjo', rune: 'ᚹ', name: 'Wunjo', meaning: 'Radość i triumf klanu', color: '#34d399' },
  { id: 'hagalaz', rune: 'ᚺ', name: 'Hagalaz', meaning: 'Arktyczny grad, przełamanie', color: '#93c5fd' },
  { id: 'nauthiz', rune: 'ᚾ', name: 'Nauthiz', meaning: 'Przetrwanie w mrozie, wola', color: '#f87171' },
  { id: 'isa', rune: 'ᛁ', name: 'Isa', meaning: 'Wieczny lód, skupienie', color: '#38bdf8' },
  { id: 'jera', rune: 'ᛃ', name: 'Jera', meaning: 'Pomyślny cykl, zbiory', color: '#4ade80' },
  { id: 'eihwaz', rune: 'ᛇ', name: 'Eihwaz', meaning: 'Święty cis, przejście dusz', color: '#818cf8' },
  { id: 'perthro', rune: 'ᛈ', name: 'Perthro', meaning: 'Kości losu, tajemnica Wyrd', color: '#c084fc' },
  { id: 'algiz', rune: 'ᛉ', name: 'Algiz', meaning: 'Rogi renifera, tarcza ochronna', color: '#facc15' },
  { id: 'sowilo', rune: 'ᛊ', name: 'Sowilo', meaning: 'Słoneczne światło zórz', color: '#fb923c' },
  { id: 'tiwaz', rune: 'ᛏ', name: 'Tiwaz', meaning: 'Sprawiedliwość Tyra, honor', color: '#ef4444' },
  { id: 'berkano', rune: 'ᛒ', name: 'Berkano', meaning: 'Pąki brzozy, nowe życie', color: '#a3e635' },
  { id: 'ehwaz', rune: 'ᛖ', name: 'Ehwaz', meaning: 'Wierny wierzchowiec, lojalność', color: '#38bdf8' },
  { id: 'mannaz', rune: 'ᛗ', name: 'Mannaz', meaning: 'Społeczność czarodziejów', color: '#fbbf24' },
  { id: 'laguz', rune: 'ᛚ', name: 'Laguz', meaning: 'Głębiny fiordu, intuicja', color: '#06b6d4' },
  { id: 'ingwaz', rune: 'ᛜ', name: 'Ingwaz', meaning: 'Ziarno mocy, płodność ziemi', color: '#86efac' },
  { id: 'dagaz', rune: 'ᛞ', name: 'Dagaz', meaning: 'Świt polarny, transformacja', color: '#fef08a' },
  { id: 'othala', rune: 'ᛟ', name: 'Othala', meaning: 'Dziedzictwo krwi, Cytadela', color: '#d97706' }
];

export const SEED_LOTTERY_ROUNDS = [
  {
    id: 'round-current',
    roundNumber: 42,
    title: 'Wielkie Losowanie Zorzy Północnej (Nocne Przesilenie)',
    description: 'Wybierz 3 runy z prastarego Futharku Starszego. Traf wszystkie 3, aby zdobyć Główny Skarbiec Odyna!',
    ticketPrice: 20, // 20 Skirnirów za los
    jackpot: 2850, // Pula Skirnirów
    bonusHousePoints: 100, // Punkty dla domu za trafienie 3 run
    status: 'active', // 'active' | 'drawing' | 'completed'
    endDate: '2026-08-30T21:00:00.000Z',
    winningRunes: [], // Empty until drawn
    totalTicketsSold: 85,
    participantsCount: 28
  },
  {
    id: 'round-41',
    roundNumber: 41,
    title: 'Święto Ognia Kuźni Brokkura',
    description: 'Losowanie na otwarcie jarmarku jesiennego.',
    ticketPrice: 20,
    jackpot: 2400,
    bonusHousePoints: 100,
    status: 'completed',
    endDate: '2026-08-15T20:00:00.000Z',
    winningRunes: ['thurisaz', 'algiz', 'fehu'],
    totalTicketsSold: 72,
    participantsCount: 24,
    winnersSummary: [
      {
        tier: 'I Miejsce (3 Runy)',
        winnerName: 'Einar Lodowy Cień',
        house: 'ravnheim',
        prizeSkirnirs: 1440,
        prizePoints: 100,
        runes: ['thurisaz', 'algiz', 'fehu']
      },
      {
        tier: 'II Miejsce (2 Runy)',
        winnerName: 'Valdemar Krag-Hansen',
        house: 'ravnheim',
        prizeSkirnirs: 120,
        prizePoints: 40,
        runes: ['thurisaz', 'algiz', 'kenaz']
      },
      {
        tier: 'II Miejsce (2 Runy)',
        winnerName: 'Astrid Reinhall',
        house: 'reinhall',
        prizeSkirnirs: 120,
        prizePoints: 40,
        runes: ['algiz', 'fehu', 'ansuz']
      }
    ]
  }
];

export const SEED_LOTTERY_USER_TICKETS = [
  {
    id: 'ticket-valdemar-1',
    roundId: 'round-current',
    userId: 'usr-valdemar',
    userName: 'Valdemar Krag-Hansen',
    house: 'ravnheim',
    chosenRunes: ['ansuz', 'perthro', 'algiz'],
    purchasedAt: '2026-08-21 16:30'
  },
  {
    id: 'ticket-valdemar-2',
    roundId: 'round-current',
    userId: 'usr-valdemar',
    userName: 'Valdemar Krag-Hansen',
    house: 'ravnheim',
    chosenRunes: ['fehu', 'sowilo', 'dagaz'],
    purchasedAt: '2026-08-22 10:15'
  }
];
