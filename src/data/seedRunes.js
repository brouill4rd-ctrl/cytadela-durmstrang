export const RUNES_CATALOG = [
  {
    id: 'rune-fehu',
    symbol: 'ᚠ',
    name: 'Fehu',
    meaning: 'Bogactwo & Pierwotna Energia',
    element: 'Złoto / Ogień',
    description: 'Runa obfitości i przepływu energii. Otwiera kanały materialne i przyciąga pomyślność w transakcjach na Rynku.',
    count: 3
  },
  {
    id: 'rune-ansuz',
    symbol: 'ᚨ',
    name: 'Ansuz',
    meaning: 'Mądrość & Głos Przodków',
    element: 'Wiatr / Myśl',
    description: 'Święty znak Odyna i wieszczek północy. Odsłania ukryte znaczenia w zakazanych grimuarach i wzmacnia inkantacje.',
    count: 2
  },
  {
    id: 'rune-tiwaz',
    symbol: 'ᛏ',
    name: 'Tiwaz',
    meaning: 'Sprawiedliwość & Wola Wojownika',
    element: 'Żelazo / Gwiazda Polarna',
    description: 'Runa przewodnia pojedynków Hólmganga. Zapewnia nieugięty hart ducha i precyzję w rzucaniu tarcz bojowych.',
    count: 2
  },
  {
    id: 'rune-algiz',
    symbol: 'ᛉ',
    name: 'Algiz',
    meaning: 'Tarcza & Święta Ochrona',
    element: 'Poroże / Aura',
    description: 'Potężny znak ochronny Zakonu Renifera. Odbija uroki manipulacji umysłem i chroni przed klątwami niszczącymi.',
    count: 3
  },
  {
    id: 'rune-kaunan',
    symbol: 'ᚲ',
    name: 'Kaunan (Kenaz)',
    meaning: 'Płomień Wiedzy & Prześwietlenie',
    element: 'Płomień / Cień',
    description: 'Runa wewnętrznego ognia i transformacji. Rozprasza ciemność i pozwala widzieć to, co zostało ukryte pod lodem.',
    count: 2
  },
  {
    id: 'rune-isa',
    symbol: 'ᛁ',
    name: 'Isa',
    meaning: 'Wieczny Lód & Zatrzymanie Czasu',
    element: 'Lód / Zmarzlina',
    description: 'Runa bezruchu i skupienia. Zatrzymuje rozprzestrzenianie się toksyn w ciele i zamraża wrogie zaklęcia.',
    count: 2
  },
  {
    id: 'rune-raidho',
    symbol: 'ᚱ',
    name: 'Raidho',
    meaning: 'Wędrówka & Droga Przeznaczenia',
    element: 'Ścieżka / Rytm',
    description: 'Wytycza bezpieczny szlak przez najgorszą arktyczną zamieć i przyspiesza transgresję magiczną.',
    count: 2
  },
  {
    id: 'rune-dagaz',
    symbol: 'ᛞ',
    name: 'Dagaz',
    meaning: 'Świt Północy & Przebudzenie Cytadeli',
    element: 'Zorza Polarna / Światło',
    description: 'Najpotężniejszy znak Cytadeli Durmstrang. Symbolizuje równowagę pomiędzy mrokiem a światłem oraz narodziny nowej potęgi.',
    count: 1
  }
];

export const RUNE_FORMULAS = [
  {
    id: 'formula-blood-shield',
    name: 'Pieczęć Krwawego Przymierza (Blóð-Skjöldr)',
    runes: ['rune-algiz', 'rune-tiwaz'],
    catalyst: 'Krew Renifera',
    houseBonus: 'renifer',
    rewardXp: 180,
    rewardPoints: 45,
    rewardCurrency: 60,
    loreReward: 'Odkryto zapiskę Eirika Krwawego Rogu o nienaruszalnej tarczy rodowej.',
    description: 'Łączy niezłomną wolę Tiwaz ze świętą ochroną Algiz, tworząc barierę pochłaniającą klątwy uderzeniowe.'
  },
  {
    id: 'formula-shadow-whisper',
    name: 'Wiązanie Cienistego Szeptu (Skugga-Galdr)',
    runes: ['rune-ansuz', 'rune-kaunan'],
    catalyst: 'Cień Kruka',
    houseBonus: 'kruk',
    rewardXp: 200,
    rewardPoints: 50,
    rewardCurrency: 70,
    loreReward: 'Odblokowano dostęp do Pierwszej Kroniki Wieży Nocnych Szeptów.',
    description: 'Przekształca wiedzę Ansuz i płomień Kaunan w astralny wzrok zdolny odczytywać zatarte inskrypcje w katakumbach.'
  },
  {
    id: 'formula-glacial-transmute',
    name: 'Alembik Wiecznej Zmarzliny (Jökul-Galdr)',
    runes: ['rune-isa', 'rune-fehu'],
    catalyst: 'Woda Lodowcowa',
    houseBonus: 'wydra',
    rewardXp: 190,
    rewardPoints: 40,
    rewardCurrency: 80,
    loreReward: 'Odblokowano recepturę na Esencję Płynnego Cienia.',
    description: 'Związanie lodu Isa z obfitością Fehu pozwala na krystalizację rzadkich minerałów alchemicznych z fiordu.'
  },
  {
    id: 'formula-iron-fury',
    name: 'Znak Pękniętego Żelaza (Járn-Brot)',
    runes: ['rune-tiwaz', 'rune-kaunan'],
    catalyst: 'Pył Meteorytowy',
    houseBonus: 'niedzwiedz',
    rewardXp: 220,
    rewardPoints: 55,
    rewardCurrency: 65,
    loreReward: 'Odkryto sekret kowalski Torvalda Żelaznorękiego.',
    description: 'Wojenny splot rozpalający broń i różdżki adepta bojowym płomieniem kruszącym granitowe mury.'
  },
  {
    id: 'formula-aurora-awakening',
    name: 'Święta Fuzja Świtów (Dagaz-Galdr)',
    runes: ['rune-dagaz', 'rune-ansuz', 'rune-fehu'],
    catalyst: 'Pył Zorzy Polarnej',
    houseBonus: null,
    rewardXp: 350,
    rewardPoints: 100,
    rewardCurrency: 150,
    loreReward: 'ODKRYTO FRAGMENT SERCA POD WIECZNĄ ZMARZLINĄ!',
    description: 'Mistyczna triada przebudzenia Cytadeli. Manifestuje czyste światło zorzy polarnej, zdejmując pradawne pieczęcie.'
  }
];
