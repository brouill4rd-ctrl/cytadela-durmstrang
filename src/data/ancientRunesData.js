// Ancient Runes & Magical Alphabets Data for Durmstrang Institute (TMD)

export const RUNIC_ALPHABETS = [
  {
    id: 'elder-futhark',
    name: 'Starszy Futhark (Nordycki)',
    shortName: 'Futhark (24)',
    origin: 'Skandynawia & Północne Plemiona',
    icon: 'ᚠ',
    color: '#f59e0b',
    border: 'rgba(245, 158, 11, 0.4)',
    bg: 'rgba(245, 158, 11, 0.12)',
    desc: 'Najstarsza i najpotężniejsza forma pisma runicznego Północy. Składa się z 24 run podzielonych na 3 ósemki (Aetty Freyja, Heimdalla i Tyra).'
  },
  {
    id: 'glagolitic',
    name: 'Głagolica & Runy Słowiańskie',
    shortName: 'Głagolica (19)',
    origin: 'Góry Świętokrzyskie, Ruś & Puszcze Polskie',
    icon: 'Ⰳ',
    color: '#38bdf8',
    border: 'rgba(56, 189, 248, 0.4)',
    bg: 'rgba(56, 189, 248, 0.12)',
    desc: 'Mistyczne pismo stworzone do wiązania zaklęć w słowie mówionym i rytuałach prastarych bóstw słowiańskich.'
  },
  {
    id: 'ogham',
    name: 'Pismo Drzew Ogham (Celtyckie)',
    shortName: 'Ogham (20)',
    origin: 'Wyspy Brytyjskie & Północne Celtyckie Gaje',
    icon: '᚛',
    color: '#22c55e',
    border: 'rgba(34, 197, 94, 0.4)',
    bg: 'rgba(34, 197, 94, 0.12)',
    desc: 'Alfabet druidów z 20 literami podzielonymi na 4 Aicme, gdzie każdy znak odpowiada uświęconemu drzewu i żywiołowi lasu.'
  },
  {
    id: 'alchemy',
    name: 'Symbole Alchemiczne & Metale',
    shortName: 'Alchemia (10)',
    origin: 'Hermetyczne Laboratoria & Cytadela Durmstrang',
    icon: '🜂',
    color: '#e879f9',
    border: 'rgba(232, 121, 249, 0.4)',
    bg: 'rgba(232, 121, 249, 0.12)',
    desc: 'Święte symbole transmutacji metali, żywiołów pierwotnych oraz tajemnic Kamienia Filozoficznego.'
  },
  {
    id: 'galdrastafir',
    name: 'Galdrastafir (Pieczęcie Islandzkie)',
    shortName: 'Galdrastafir (6)',
    origin: 'Islandzkie Grimuary & Czarownicy Północy',
    icon: 'ᚙ',
    color: '#fb7185',
    border: 'rgba(251, 113, 133, 0.4)',
    bg: 'rgba(251, 113, 133, 0.12)',
    desc: 'Złożone pieczęcie wiązane chroniące przed burzami, wrogami i widmami w zamieciach fiordów.'
  }
];

export const ANCIENT_RUNES = [
  // =========================================================================
  // 1. STARSZY FUTHARK (KOMPLETNE 24 RUNY - 3 AETTY)
  // =========================================================================

  // --- I AETT: FREYA (1-8) ---
  {
    id: 'futhark-fehu',
    alphabetId: 'elder-futhark',
    symbol: 'ᚠ',
    name: 'Fehu',
    sound: 'F',
    meaning: 'Bydło, Pomyślność, Złoto & Pierwotny Ogień',
    element: 'Ogień & Ziemia',
    difficulty: 'Łatwa',
    desc: 'Runa początku i dostatku. Reprezentuje życiową energię płynącą w żyłach czarodzieja.',
    guideHint: 'Pionowa linia w dół oraz dwie skośne gałęzie wznoszące się w prawo.',
    strokes: [
      [{ x: 0.35, y: 0.15 }, { x: 0.35, y: 0.85 }],
      [{ x: 0.35, y: 0.25 }, { x: 0.72, y: 0.15 }],
      [{ x: 0.35, y: 0.50 }, { x: 0.68, y: 0.38 }]
    ]
  },
  {
    id: 'futhark-uruz',
    alphabetId: 'elder-futhark',
    symbol: 'ᚢ',
    name: 'Uruz',
    sound: 'U',
    meaning: 'Tur, Dzika Siła, Witalność & Zdrowie',
    element: 'Ziemia Północy',
    difficulty: 'Średnia',
    desc: 'Pradawna siła wymarłego tura. Wzmocnienie ciała fizycznego i odporności na chłód.',
    guideHint: 'Wysoki lewy słupek, skos w dół w prawo i krótszy prawy słupek.',
    strokes: [
      [{ x: 0.28, y: 0.85 }, { x: 0.28, y: 0.15 }],
      [{ x: 0.28, y: 0.15 }, { x: 0.72, y: 0.40 }],
      [{ x: 0.72, y: 0.40 }, { x: 0.72, y: 0.85 }]
    ]
  },
  {
    id: 'futhark-thurisaz',
    alphabetId: 'elder-futhark',
    symbol: 'ᚦ',
    name: 'Thurisaz',
    sound: 'TH',
    meaning: 'Olbrzym, Cierń, Młot Thora Mjölnir',
    element: 'Piorun & Stal',
    difficulty: 'Średnia',
    desc: 'Runa niszczycielskiego uderzenia burzy. Rozbija magiczne tarcze wrogich czarowników.',
    guideHint: 'Pionowy słupek z trójkątnym kolcem skierowanym w prawo w centrum.',
    strokes: [
      [{ x: 0.35, y: 0.15 }, { x: 0.35, y: 0.85 }],
      [{ x: 0.35, y: 0.30 }, { x: 0.72, y: 0.50 }],
      [{ x: 0.72, y: 0.50 }, { x: 0.35, y: 0.70 }]
    ]
  },
  {
    id: 'futhark-ansuz',
    alphabetId: 'elder-futhark',
    symbol: 'ᚨ',
    name: 'Ansuz',
    sound: 'A',
    meaning: 'Głos Odyna, Mądrość Bogów & Słowo',
    element: 'Powietrze & Eter',
    difficulty: 'Średnia',
    desc: 'Pieczęć boskiego natchnienia i wiedzy. Ułatwia rzucanie inkantacji i formuł głosem.',
    guideHint: 'Pionowa linia oraz dwie ukośne gałęzie opadające w prawo w dół.',
    strokes: [
      [{ x: 0.35, y: 0.15 }, { x: 0.35, y: 0.85 }],
      [{ x: 0.35, y: 0.20 }, { x: 0.72, y: 0.38 }],
      [{ x: 0.35, y: 0.45 }, { x: 0.70, y: 0.62 }]
    ]
  },
  {
    id: 'futhark-raidho',
    alphabetId: 'elder-futhark',
    symbol: 'ᚱ',
    name: 'Raidho',
    sound: 'R',
    meaning: 'Rydwan Słońca, Podróż & Prawa Kosmosu',
    element: 'Ogień Ruchu',
    difficulty: 'Średnia',
    desc: 'Runa bezpiecznych wędrówek przez zamiecie i lochy. Chroni maga na dalekich szlakach.',
    guideHint: 'Pionowy słupek z trójkątną pętlą u góry i nogą opadającą w prawo.',
    strokes: [
      [{ x: 0.32, y: 0.15 }, { x: 0.32, y: 0.85 }],
      [{ x: 0.32, y: 0.18 }, { x: 0.68, y: 0.35 }],
      [{ x: 0.68, y: 0.35 }, { x: 0.32, y: 0.52 }],
      [{ x: 0.32, y: 0.52 }, { x: 0.72, y: 0.85 }]
    ]
  },
  {
    id: 'futhark-kenaz',
    alphabetId: 'elder-futhark',
    symbol: 'ᚲ',
    name: 'Kenaz',
    sound: 'K / C',
    meaning: 'Pochodnia, Ogień Wiedzy & Rzemiosło',
    element: 'Płomień Kuźni',
    difficulty: 'Łatwa',
    desc: 'Ogień rozpraszający mrok niewiedzy. Pomaga w odkrywaniu sekretnych receptur.',
    guideHint: 'Kąt ostry otwarty w prawo (znak mniejszości <).',
    strokes: [
      [{ x: 0.68, y: 0.22 }, { x: 0.32, y: 0.50 }],
      [{ x: 0.32, y: 0.50 }, { x: 0.68, y: 0.78 }]
    ]
  },
  {
    id: 'futhark-gebo',
    alphabetId: 'elder-futhark',
    symbol: 'ᚷ',
    name: 'Gebo',
    sound: 'G',
    meaning: 'Święty Dar, Przymierze & Braterstwo',
    element: 'Powietrze Wiążące',
    difficulty: 'Łatwa',
    desc: 'Runa więzi i lojalności. Pieczętuje sojusze między czarodziejami i przysięgi zakonne.',
    guideHint: 'Dwie przecinające się ukośne linie w kształcie litery X.',
    strokes: [
      [{ x: 0.25, y: 0.20 }, { x: 0.75, y: 0.80 }],
      [{ x: 0.75, y: 0.20 }, { x: 0.25, y: 0.80 }]
    ]
  },
  {
    id: 'futhark-wunjo',
    alphabetId: 'elder-futhark',
    symbol: 'ᚹ',
    name: 'Wunjo',
    sound: 'W / V',
    meaning: 'Radość, Triumf, Spełnienie & Harmonia',
    element: 'Światłość Zwycięstwa',
    difficulty: 'Średnia',
    desc: 'Flaga zwycięstwa i radości. Nagradza wytrwałość adepta w nauce magii.',
    guideHint: 'Pionowy słupek ze szpiczastym trójkątem skierowanym w prawo u góry.',
    strokes: [
      [{ x: 0.35, y: 0.15 }, { x: 0.35, y: 0.85 }],
      [{ x: 0.35, y: 0.18 }, { x: 0.70, y: 0.35 }],
      [{ x: 0.70, y: 0.35 }, { x: 0.35, y: 0.52 }]
    ]
  },

  // --- II AETT: HEIMDALL / HAGAL (9-16) ---
  {
    id: 'futhark-hagalaz',
    alphabetId: 'elder-futhark',
    symbol: 'ᚺ',
    name: 'Hagalaz',
    sound: 'H',
    meaning: 'Grad, Kataklizm & Przełomowa Odnowa',
    element: 'Lodowy Grad',
    difficulty: 'Średnia',
    desc: 'Niszczący grad zimy. Zrywa iluzje i przygotowuje grunt pod odrodzenie.',
    guideHint: 'Dwa pionowe słupki połączone ukośną poprzeczką.',
    strokes: [
      [{ x: 0.30, y: 0.15 }, { x: 0.30, y: 0.85 }],
      [{ x: 0.70, y: 0.15 }, { x: 0.70, y: 0.85 }],
      [{ x: 0.30, y: 0.60 }, { x: 0.70, y: 0.40 }]
    ]
  },
  {
    id: 'futhark-nauthiz',
    alphabetId: 'elder-futhark',
    symbol: 'ᚾ',
    name: 'Nauthiz',
    sound: 'N',
    meaning: 'Przymus Losu, Ogień z Tarcia & Hart Ducha',
    element: 'Ogień Przetrwania',
    difficulty: 'Łatwa',
    desc: 'Ogień rozpalany w potrzebie. Daje siłę przetrwania w najgłębszych lochach.',
    guideHint: 'Pionowy słupek przekreślony ukośną belką.',
    strokes: [
      [{ x: 0.50, y: 0.15 }, { x: 0.50, y: 0.85 }],
      [{ x: 0.25, y: 0.38 }, { x: 0.75, y: 0.62 }]
    ]
  },
  {
    id: 'futhark-isa',
    alphabetId: 'elder-futhark',
    symbol: 'ᛁ',
    name: 'Isa',
    sound: 'I',
    meaning: 'Wieczny Lód, Skupienie, Spokój & Bariera',
    element: 'Wieczna Zmarzlina',
    difficulty: 'Łatwa',
    desc: 'Czysty lód fiordu. Zatrzymuje czas, zamraża zaklęcia i stabilizuje umysł.',
    guideHint: 'Pojedyncza prosta pionowa kreska z góry na dół.',
    strokes: [
      [{ x: 0.50, y: 0.15 }, { x: 0.50, y: 0.85 }]
    ]
  },
  {
    id: 'futhark-jera',
    alphabetId: 'elder-futhark',
    symbol: 'ᛃ',
    name: 'Jera',
    sound: 'J / Y',
    meaning: 'Żniwa, Cykl Pór Roku & Obfitość',
    element: 'Ziemia & Czas',
    difficulty: 'Średnia',
    desc: 'Obrót koła roku. Plon zbierany po miesiącach rzetelnej pracy naukowej.',
    guideHint: 'Dwa zwrócone ku sobie kąty ostre u góry i u dołu.',
    strokes: [
      [{ x: 0.35, y: 0.20 }, { x: 0.65, y: 0.35 }],
      [{ x: 0.65, y: 0.35 }, { x: 0.35, y: 0.50 }],
      [{ x: 0.65, y: 0.50 }, { x: 0.35, y: 0.65 }],
      [{ x: 0.35, y: 0.65 }, { x: 0.65, y: 0.80 }]
    ]
  },
  {
    id: 'futhark-eihwaz',
    alphabetId: 'elder-futhark',
    symbol: 'ᛇ',
    name: 'Eihwaz',
    sound: 'EI',
    meaning: 'Cis, Drzewo Świata Yggdrasil & Oś Magii',
    element: 'Drewno Cisu & Eter',
    difficulty: 'Średnia',
    desc: 'Święty cis łączący dziewięć światów. Runa nieśmiertelności i ochrony.',
    guideHint: 'Pionowy słupek z daszkiem w dół u góry i daszkiem w górę u dołu.',
    strokes: [
      [{ x: 0.50, y: 0.15 }, { x: 0.50, y: 0.85 }],
      [{ x: 0.28, y: 0.25 }, { x: 0.50, y: 0.15 }],
      [{ x: 0.50, y: 0.85 }, { x: 0.72, y: 0.75 }]
    ]
  },
  {
    id: 'futhark-perthro',
    alphabetId: 'elder-futhark',
    symbol: 'ᛈ',
    name: 'Perthro',
    sound: 'P',
    meaning: 'Kubek Losu, Tajemnica & Rzut Kośćmi',
    element: 'Niewidzialny Los',
    difficulty: 'Średnia',
    desc: 'Runa niepoznanego. Skrywa sekrety przyszłości i chroni przed wykryciem.',
    guideHint: 'Pionowy słupek po lewej z dwoma kątami otwierającymi się w lewo.',
    strokes: [
      [{ x: 0.32, y: 0.15 }, { x: 0.32, y: 0.85 }],
      [{ x: 0.32, y: 0.18 }, { x: 0.68, y: 0.35 }],
      [{ x: 0.68, y: 0.35 }, { x: 0.48, y: 0.50 }],
      [{ x: 0.32, y: 0.82 }, { x: 0.68, y: 0.65 }],
      [{ x: 0.68, y: 0.65 }, { x: 0.48, y: 0.50 }]
    ]
  },
  {
    id: 'futhark-algiz',
    alphabetId: 'elder-futhark',
    symbol: 'ᛉ',
    name: 'Algiz',
    sound: 'Z / R',
    meaning: 'Łoś Północy, Święta Tarcza & Obrona',
    element: 'Światłość & Ochrona',
    difficulty: 'Łatwa',
    desc: 'Najsilniejszy znak ochronny Futharku. Rogi łosia chronią duszę przed klątwami.',
    guideHint: 'Pionowa linia w środku z dwoma ramionami wznoszącymi się w lewo i w prawo (trójząb).',
    strokes: [
      [{ x: 0.50, y: 0.15 }, { x: 0.50, y: 0.85 }],
      [{ x: 0.22, y: 0.22 }, { x: 0.50, y: 0.48 }],
      [{ x: 0.78, y: 0.22 }, { x: 0.50, y: 0.48 }]
    ]
  },
  {
    id: 'futhark-sowilo',
    alphabetId: 'elder-futhark',
    symbol: 'ᛊ',
    name: 'Sowilo',
    sound: 'S',
    meaning: 'Słońce, Błyskawica, Zwycięstwo & Sukces',
    element: 'Światłość Słońca',
    difficulty: 'Łatwa',
    desc: 'Promień słońca rozświetlający polarne noce. Symbol triumfu prawdy i czystej energii.',
    guideHint: 'Zygzakowata błyskawica (litera Z/S ze skośnymi liniami).',
    strokes: [
      [{ x: 0.35, y: 0.18 }, { x: 0.65, y: 0.38 }],
      [{ x: 0.65, y: 0.38 }, { x: 0.35, y: 0.62 }],
      [{ x: 0.35, y: 0.62 }, { x: 0.65, y: 0.82 }]
    ]
  },

  // --- III AETT: TYR / TIWAZ (17-24) ---
  {
    id: 'futhark-tiwaz',
    alphabetId: 'elder-futhark',
    symbol: 'ᛏ',
    name: 'Tiwaz',
    sound: 'T',
    meaning: 'Bóg Tyr, Sprawiedliwość, Honor & Włócznia',
    element: 'Honor & Stal',
    difficulty: 'Łatwa',
    desc: 'Włócznia sprawiedliwości Tyra. Symbol niezłomnego męstwa i przysięgi wierności.',
    guideHint: 'Pionowy słupek ze strzałkowym grotem u góry (daszek w lewo i prawo).',
    strokes: [
      [{ x: 0.50, y: 0.15 }, { x: 0.50, y: 0.85 }],
      [{ x: 0.25, y: 0.38 }, { x: 0.50, y: 0.15 }],
      [{ x: 0.75, y: 0.38 }, { x: 0.50, y: 0.15 }]
    ]
  },
  {
    id: 'futhark-berkano',
    alphabetId: 'elder-futhark',
    symbol: 'ᛒ',
    name: 'Berkano',
    sound: 'B',
    meaning: 'Brzoza, Narodziny, Płodność & Regeneracja',
    element: 'Gaj Brzóz',
    difficulty: 'Średnia',
    desc: 'Runa odrodzenia. Drewno brzozy leczy rany i osłania przed mrocznymi urokami.',
    guideHint: 'Pionowy słupek z dwoma trójkątnymi wybrzuszeniami w prawo (litera B).',
    strokes: [
      [{ x: 0.35, y: 0.15 }, { x: 0.35, y: 0.85 }],
      [{ x: 0.35, y: 0.18 }, { x: 0.68, y: 0.35 }],
      [{ x: 0.68, y: 0.35 }, { x: 0.35, y: 0.50 }],
      [{ x: 0.35, y: 0.50 }, { x: 0.68, y: 0.68 }],
      [{ x: 0.68, y: 0.68 }, { x: 0.35, y: 0.82 }]
    ]
  },
  {
    id: 'futhark-ehwaz',
    alphabetId: 'elder-futhark',
    symbol: 'ᛖ',
    name: 'Ehwaz',
    sound: 'E',
    meaning: 'Święty Koń Sleipnir, Współpraca & Zaufanie',
    element: 'Pęd Wichru',
    difficulty: 'Średnia',
    desc: 'Rumak Odyna. Runa zaufania i harmonijnej współpracy między czarodziejami.',
    guideHint: 'Litera M z dwiema pionowymi osiami i opadającym środkowym szpicem.',
    strokes: [
      [{ x: 0.30, y: 0.15 }, { x: 0.30, y: 0.85 }],
      [{ x: 0.70, y: 0.15 }, { x: 0.70, y: 0.85 }],
      [{ x: 0.30, y: 0.18 }, { x: 0.50, y: 0.45 }],
      [{ x: 0.70, y: 0.18 }, { x: 0.50, y: 0.45 }]
    ]
  },
  {
    id: 'futhark-mannaz',
    alphabetId: 'elder-futhark',
    symbol: 'ᛗ',
    name: 'Mannaz',
    sound: 'M',
    meaning: 'Człowiek, Jaźń, Umysł & Wspólnota Durmstrang',
    element: 'Świadomość',
    difficulty: 'Średnia',
    desc: 'Istota ludzkiej świadomości. Łączy wiedzę przodków z potęgą wolnej woli.',
    guideHint: 'Dwa pionowe słupki ze skrzyżowanymi ramionami u góry (krzyż w litera M).',
    strokes: [
      [{ x: 0.30, y: 0.15 }, { x: 0.30, y: 0.85 }],
      [{ x: 0.70, y: 0.15 }, { x: 0.70, y: 0.85 }],
      [{ x: 0.30, y: 0.18 }, { x: 0.70, y: 0.55 }],
      [{ x: 0.70, y: 0.18 }, { x: 0.30, y: 0.55 }]
    ]
  },
  {
    id: 'futhark-laguz',
    alphabetId: 'elder-futhark',
    symbol: 'ᛚ',
    name: 'Laguz',
    sound: 'L',
    meaning: 'Woda, Intuicja, Nurt Rzeki & Fale Morza',
    element: 'Głębia Oceanu',
    difficulty: 'Łatwa',
    desc: 'Woda płynąca nieubłaganie do morza. Wzmacnia intuicję i czary żywiołu wody.',
    guideHint: 'Pionowy słupek z pojedynczym hakiem opadającym w prawo u góry.',
    strokes: [
      [{ x: 0.38, y: 0.15 }, { x: 0.38, y: 0.85 }],
      [{ x: 0.38, y: 0.18 }, { x: 0.72, y: 0.42 }]
    ]
  },
  {
    id: 'futhark-ingwaz',
    alphabetId: 'elder-futhark',
    symbol: 'ᛜ',
    name: 'Ingwaz',
    sound: 'NG',
    meaning: 'Bóg Ing, Ziarno Mocy, Płodność & Potencjał',
    element: 'Ziemia Uśpiona',
    difficulty: 'Średnia',
    desc: 'Ziarno ukryte w ziemi czekające na wiosnę. Skumulowana moc gotowa do uwolnienia.',
    guideHint: 'Romb lub dwa połączone krzyżyki.',
    strokes: [
      [{ x: 0.50, y: 0.20 }, { x: 0.75, y: 0.50 }],
      [{ x: 0.75, y: 0.50 }, { x: 0.50, y: 0.80 }],
      [{ x: 0.50, y: 0.80 }, { x: 0.25, y: 0.50 }],
      [{ x: 0.25, y: 0.50 }, { x: 0.50, y: 0.20 }]
    ]
  },
  {
    id: 'futhark-dagaz',
    alphabetId: 'elder-futhark',
    symbol: 'ᛞ',
    name: 'Dagaz',
    sound: 'D',
    meaning: 'Świt, Przemiana Dnia & Oświecenie',
    element: 'Światło Poranka',
    difficulty: 'Średnia',
    desc: 'Kres długiej nocy i nadejście jutrzenki. Runa pełnej metamorfozy i uwolnienia.',
    guideHint: 'Klepsydra złożona z dwóch połączonych trójkątów.',
    strokes: [
      [{ x: 0.30, y: 0.18 }, { x: 0.30, y: 0.82 }],
      [{ x: 0.70, y: 0.18 }, { x: 0.70, y: 0.82 }],
      [{ x: 0.30, y: 0.18 }, { x: 0.70, y: 0.82 }],
      [{ x: 0.70, y: 0.18 }, { x: 0.30, y: 0.82 }]
    ]
  },
  {
    id: 'futhark-othala',
    alphabetId: 'elder-futhark',
    symbol: 'ᛟ',
    name: 'Othala',
    sound: 'O',
    meaning: 'Dziedzictwo Przodków, Ziemia Ojców & Ród',
    element: 'Kamień Graniczny',
    difficulty: 'Średnia',
    desc: 'Święta ziemia przodków. Wiąże siłę rodów i rodowe artefakty czarodziejów.',
    guideHint: 'Romb u góry ze skrzyżowanymi odnóżami u dołu.',
    strokes: [
      [{ x: 0.50, y: 0.18 }, { x: 0.72, y: 0.45 }],
      [{ x: 0.72, y: 0.45 }, { x: 0.28, y: 0.82 }],
      [{ x: 0.50, y: 0.18 }, { x: 0.28, y: 0.45 }],
      [{ x: 0.28, y: 0.45 }, { x: 0.72, y: 0.82 }]
    ]
  },

  // =========================================================================
  // 2. GŁAGOLICA & RUNY SŁOWIAŃSKIE (19 NAJWAŻNIEJSZYCH ZNAKÓW)
  // =========================================================================
  {
    id: 'glagolitic-az',
    alphabetId: 'glagolitic',
    symbol: 'Ⰰ',
    name: 'Azъ',
    sound: 'A',
    meaning: 'Jestem, Początek Świata, Iskra Boska',
    element: 'Iskra Boskości',
    difficulty: 'Średnia',
    desc: 'Pierwszy znak głagolicy. Manifestuje świadomość i wolę maga w materialnym świecie.',
    guideHint: 'Krzyż o czterech równych ramionach.',
    strokes: [
      [{ x: 0.50, y: 0.15 }, { x: 0.50, y: 0.85 }],
      [{ x: 0.20, y: 0.45 }, { x: 0.80, y: 0.45 }]
    ]
  },
  {
    id: 'glagolitic-buky',
    alphabetId: 'glagolitic',
    symbol: 'Ⰱ',
    name: 'Buky',
    sound: 'B',
    meaning: 'Święta Litera, Bogowie & Pradawne Księgi',
    element: 'Mądrość Puszczy',
    difficulty: 'Średnia',
    desc: 'Znak zapisu wiedzy. Otwiera dostęp do starosłowiańskich zwojów i kronik.',
    guideHint: 'Pionowy słupek ze zwieńczeniem u góry i pętlą z prawej u dołu.',
    strokes: [
      [{ x: 0.35, y: 0.15 }, { x: 0.35, y: 0.85 }],
      [{ x: 0.22, y: 0.18 }, { x: 0.70, y: 0.18 }],
      [{ x: 0.35, y: 0.50 }, { x: 0.70, y: 0.50 }],
      [{ x: 0.70, y: 0.50 }, { x: 0.70, y: 0.85 }],
      [{ x: 0.35, y: 0.85 }, { x: 0.70, y: 0.85 }]
    ]
  },
  {
    id: 'glagolitic-vede',
    alphabetId: 'glagolitic',
    symbol: 'Ⰲ',
    name: 'Vědě',
    sound: 'V / W',
    meaning: 'Wiedza, Wieszczenie & Oczy Widzące Mrok',
    element: 'Głębia Umysłu',
    difficulty: 'Mistrzowska',
    desc: 'Wiedza wiedźm i wołchwów. Umożliwia wejrzenie w zasłonę nocy i odczytanie intencji.',
    guideHint: 'Dwa połączone okręgi / pętle (ósemka) na wspólnej podstawie.',
    strokes: [
      [{ x: 0.30, y: 0.25 }, { x: 0.70, y: 0.25 }],
      [{ x: 0.70, y: 0.25 }, { x: 0.70, y: 0.50 }],
      [{ x: 0.70, y: 0.50 }, { x: 0.30, y: 0.50 }],
      [{ x: 0.30, y: 0.50 }, { x: 0.30, y: 0.25 }],
      [{ x: 0.30, y: 0.50 }, { x: 0.70, y: 0.85 }],
      [{ x: 0.70, y: 0.85 }, { x: 0.30, y: 0.85 }]
    ]
  },
  {
    id: 'glagolitic-glagoli',
    alphabetId: 'glagolitic',
    symbol: 'Ⰳ',
    name: 'Glagoli',
    sound: 'G',
    meaning: 'Mów, Pieśń Wieszczów & Rozkaz Żywiołom',
    element: 'Głos & Powietrze',
    difficulty: 'Średnia',
    desc: 'Moc słowa mówionego. Służy do zaklęć rozkazujących żywiołom.',
    guideHint: 'Hak w kształcie litery gamma z pętlą u góry po lewej.',
    strokes: [
      [{ x: 0.30, y: 0.25 }, { x: 0.70, y: 0.25 }],
      [{ x: 0.70, y: 0.25 }, { x: 0.70, y: 0.85 }],
      [{ x: 0.30, y: 0.25 }, { x: 0.30, y: 0.48 }],
      [{ x: 0.30, y: 0.48 }, { x: 0.50, y: 0.48 }]
    ]
  },
  {
    id: 'glagolitic-dobro',
    alphabetId: 'glagolitic',
    symbol: 'Ⰴ',
    name: 'Dobro',
    sound: 'D',
    meaning: 'Ład, Harmonia, Obfitość Ziemi',
    element: 'Ziemia & Drzewa',
    difficulty: 'Średnia',
    desc: 'Symbol harmonii w naturze i czystości intencji rzucającego zaklęcie.',
    guideHint: 'Kopuła / łuk z poprzeczną belką u dołu.',
    strokes: [
      [{ x: 0.35, y: 0.20 }, { x: 0.65, y: 0.20 }],
      [{ x: 0.35, y: 0.20 }, { x: 0.35, y: 0.75 }],
      [{ x: 0.65, y: 0.20 }, { x: 0.65, y: 0.75 }],
      [{ x: 0.25, y: 0.75 }, { x: 0.75, y: 0.75 }]
    ]
  },
  {
    id: 'glagolitic-est',
    alphabetId: 'glagolitic',
    symbol: 'Ⰵ',
    name: 'Estъ',
    sound: 'E',
    meaning: 'Istnienie, Żywy Byt, Czas Teraźniejszy',
    element: 'Czysta Materia',
    difficulty: 'Średnia',
    desc: 'Runa obecności tu i teraz. Utrwala zaklęcia w materii fizycznej.',
    guideHint: 'Półkole po lewej z poprzeczną osią w centrum.',
    strokes: [
      [{ x: 0.65, y: 0.20 }, { x: 0.35, y: 0.50 }],
      [{ x: 0.35, y: 0.50 }, { x: 0.65, y: 0.80 }],
      [{ x: 0.35, y: 0.50 }, { x: 0.75, y: 0.50 }]
    ]
  },
  {
    id: 'glagolitic-zivete',
    alphabetId: 'glagolitic',
    symbol: 'Ⰶ',
    name: 'Živěte',
    sound: 'Ż',
    meaning: 'Żywot, Drzewo Świata & Mokosz',
    element: 'Puszcza & Krew',
    difficulty: 'Mistrzowska',
    desc: 'Święty znak życia bogini Żywii. Odnawia siły i rozprasza trucizny.',
    guideHint: 'Sześcioramienna gwiazda ze skośnymi ramionami.',
    strokes: [
      [{ x: 0.50, y: 0.15 }, { x: 0.50, y: 0.85 }],
      [{ x: 0.20, y: 0.30 }, { x: 0.80, y: 0.70 }],
      [{ x: 0.20, y: 0.70 }, { x: 0.80, y: 0.30 }]
    ]
  },
  {
    id: 'glagolitic-dzelo',
    alphabetId: 'glagolitic',
    symbol: 'Ⰷ',
    name: 'Dzelo',
    sound: 'DZ',
    meaning: 'Niezmierzona Siła, Żar & Determinacja',
    element: 'Żar Podziemny',
    difficulty: 'Średnia',
    desc: 'Niepowstrzymana energia woli. Zwiększa penetrację zaklęć ofensywnych.',
    guideHint: 'Zygzak z pętlą u dołu po lewej.',
    strokes: [
      [{ x: 0.30, y: 0.20 }, { x: 0.70, y: 0.20 }],
      [{ x: 0.70, y: 0.20 }, { x: 0.35, y: 0.60 }],
      [{ x: 0.35, y: 0.60 }, { x: 0.65, y: 0.85 }]
    ]
  },
  {
    id: 'glagolitic-zemlja',
    alphabetId: 'glagolitic',
    symbol: 'Ⰸ',
    name: 'Zemlja',
    sound: 'Z',
    meaning: 'Matka Ziemia, Podziemia & Korzenie',
    element: 'Gleba Puszczy',
    difficulty: 'Mistrzowska',
    desc: 'Głębokie korzenie ziemi. Wiąże wrogów z podłożem i chroni przed sejsmiką.',
    guideHint: 'Górna pętla połączona z dolnym ramieniem w kształcie litery Z.',
    strokes: [
      [{ x: 0.35, y: 0.25 }, { x: 0.65, y: 0.25 }],
      [{ x: 0.65, y: 0.25 }, { x: 0.35, y: 0.55 }],
      [{ x: 0.35, y: 0.55 }, { x: 0.65, y: 0.85 }],
      [{ x: 0.35, y: 0.85 }, { x: 0.65, y: 0.85 }]
    ]
  },
  {
    id: 'glagolitic-ize',
    alphabetId: 'glagolitic',
    symbol: 'Ⰺ',
    name: 'Iže',
    sound: 'I',
    meaning: 'Jedność, Połączenie & Równowaga',
    element: 'Spokojna Woda',
    difficulty: 'Średnia',
    desc: 'Znak zjednoczenia myśli i ciała w transie medytacyjnym.',
    guideHint: 'Dwa pionowe słupki połączone poziomą poprzeczką u góry.',
    strokes: [
      [{ x: 0.30, y: 0.20 }, { x: 0.30, y: 0.80 }],
      [{ x: 0.70, y: 0.20 }, { x: 0.70, y: 0.80 }],
      [{ x: 0.30, y: 0.20 }, { x: 0.70, y: 0.20 }]
    ]
  },
  {
    id: 'glagolitic-kako',
    alphabetId: 'glagolitic',
    symbol: 'Ⰽ',
    name: 'Kako',
    sound: 'K',
    meaning: 'Jak, Wspólnota Rodowa & Podobieństwo',
    element: 'Ogień Ogniska',
    difficulty: 'Średnia',
    desc: 'Więź plemienna. Wzmacnia czary rzucane w kręgu rytualnym.',
    guideHint: 'Pionowy słupek z dwoma skośnymi ramionami po prawej.',
    strokes: [
      [{ x: 0.35, y: 0.15 }, { x: 0.35, y: 0.85 }],
      [{ x: 0.68, y: 0.25 }, { x: 0.35, y: 0.50 }],
      [{ x: 0.35, y: 0.50 }, { x: 0.68, y: 0.75 }]
    ]
  },
  {
    id: 'glagolitic-ljudije',
    alphabetId: 'glagolitic',
    symbol: 'Ⰾ',
    name: 'Ljudije',
    sound: 'L',
    meaning: 'Ludzie, Plemiona & Braterstwo Krwi',
    element: 'Płomień Życia',
    difficulty: 'Średnia',
    desc: 'Siła tkwiąca w jedności rodu. Zapewnia ochronę przed samotnością i klątwami rozłąki.',
    guideHint: 'Łuk wznoszący się z lewej ku prawej stronie.',
    strokes: [
      [{ x: 0.30, y: 0.80 }, { x: 0.50, y: 0.20 }],
      [{ x: 0.50, y: 0.20 }, { x: 0.70, y: 0.80 }]
    ]
  },
  {
    id: 'glagolitic-myslite',
    alphabetId: 'glagolitic',
    symbol: 'Ⰿ',
    name: 'Myslite',
    sound: 'M',
    meaning: 'Myśl, Zrozumienie, Intuicja & Rozsądek',
    element: 'Czysty Rozum',
    difficulty: 'Mistrzowska',
    desc: 'Głęboka kontemplacja. Rozjaśnia skomplikowane łamigłówki runiczne.',
    guideHint: 'Dwa łuki połączone w centrum w kształcie litery M.',
    strokes: [
      [{ x: 0.25, y: 0.80 }, { x: 0.25, y: 0.25 }],
      [{ x: 0.25, y: 0.25 }, { x: 0.50, y: 0.55 }],
      [{ x: 0.50, y: 0.55 }, { x: 0.75, y: 0.25 }],
      [{ x: 0.75, y: 0.25 }, { x: 0.75, y: 0.80 }]
    ]
  },
  {
    id: 'glagolitic-nas',
    alphabetId: 'glagolitic',
    symbol: 'Ⱀ',
    name: 'Našь',
    sound: 'N',
    meaning: 'Nasz, Rodzina, Dziedzictwo & Krew',
    element: 'Więź Krwi',
    difficulty: 'Średnia',
    desc: 'Znak przynależności do Cytadeli Durmstrang i jej wielowiekowych tradycji.',
    guideHint: 'Dwa pionowe słupki połączone poziomą osią w środku.',
    strokes: [
      [{ x: 0.32, y: 0.15 }, { x: 0.32, y: 0.85 }],
      [{ x: 0.68, y: 0.15 }, { x: 0.68, y: 0.85 }],
      [{ x: 0.32, y: 0.50 }, { x: 0.68, y: 0.50 }]
    ]
  },
  {
    id: 'glagolitic-on',
    alphabetId: 'glagolitic',
    symbol: 'Ⱁ',
    name: 'Onъ',
    sound: 'O',
    meaning: 'On, Kosmos, Światłość & Nieskończoność',
    element: 'Słońce Swaroga',
    difficulty: 'Łatwa',
    desc: 'Okrąg doskonałości. Reprezentuje boga słońca Swaroga rozświetlającego puszczę.',
    guideHint: 'Pełny zamknięty okrąg w centrum tablicy.',
    strokes: [
      [{ x: 0.50, y: 0.18 }, { x: 0.75, y: 0.50 }],
      [{ x: 0.75, y: 0.50 }, { x: 0.50, y: 0.82 }],
      [{ x: 0.50, y: 0.82 }, { x: 0.25, y: 0.50 }],
      [{ x: 0.25, y: 0.50 }, { x: 0.50, y: 0.18 }]
    ]
  },
  {
    id: 'glagolitic-pokoj',
    alphabetId: 'glagolitic',
    symbol: 'Ⱂ',
    name: 'Pokoj',
    sound: 'P',
    meaning: 'Pokój, Wyciszenie, Równowaga Ducha',
    element: 'Spokój Nocy',
    difficulty: 'Średnia',
    desc: 'Wyciszenie burzy emocji. Ułatwia regenerację many podczas odpoczynku.',
    guideHint: 'Bramka o dwóch słupkach z poziomym nadprożem (litera Pi).',
    strokes: [
      [{ x: 0.25, y: 0.20 }, { x: 0.75, y: 0.20 }],
      [{ x: 0.35, y: 0.20 }, { x: 0.35, y: 0.80 }],
      [{ x: 0.65, y: 0.20 }, { x: 0.65, y: 0.80 }]
    ]
  },
  {
    id: 'glagolitic-rci',
    alphabetId: 'glagolitic',
    symbol: 'Ⱃ',
    name: 'Rьci',
    sound: 'R',
    meaning: 'Rzeknij, Prawdomówność & Moc Przysięgi',
    element: 'Płomień Prawdy',
    difficulty: 'Średnia',
    desc: 'Pieczęć przysięgi. Kłamstwo w obecności tego znaku sprowadza natychmiastową reakcję magiczną.',
    guideHint: 'Pionowy słupek z pętlą u góry po prawej (litera R).',
    strokes: [
      [{ x: 0.35, y: 0.15 }, { x: 0.35, y: 0.85 }],
      [{ x: 0.35, y: 0.18 }, { x: 0.70, y: 0.35 }],
      [{ x: 0.70, y: 0.35 }, { x: 0.35, y: 0.52 }]
    ]
  },
  {
    id: 'glagolitic-slovo',
    alphabetId: 'glagolitic',
    symbol: 'Ⱄ',
    name: 'Slovo',
    sound: 'S',
    meaning: 'Święte Słowo, Prawda & Inwokacja',
    element: 'Głos & Wiatr',
    difficulty: 'Średnia',
    desc: 'Magiczne słowo stwórcze. Podstawa słowiańskich zaklęć ochronnych.',
    guideHint: 'Półkole otwierające się w prawo (litera C).',
    strokes: [
      [{ x: 0.70, y: 0.20 }, { x: 0.35, y: 0.50 }],
      [{ x: 0.35, y: 0.50 }, { x: 0.70, y: 0.80 }]
    ]
  },
  {
    id: 'glagolitic-tvrdo',
    alphabetId: 'glagolitic',
    symbol: 'Ⱅ',
    name: 'Tvrьdo',
    sound: 'T',
    meaning: 'Twardość, Bazalt, Niezłomna Twierdza',
    element: 'Kamień Granitowy',
    difficulty: 'Łatwa',
    desc: 'Symbol twardości granitu. Wzmacnia fundamenty baszt i tarcze kamienne.',
    guideHint: 'Pozioma belka u góry z pionowym słupkiem opadającym w dół ze środka (litera T).',
    strokes: [
      [{ x: 0.22, y: 0.20 }, { x: 0.78, y: 0.20 }],
      [{ x: 0.50, y: 0.20 }, { x: 0.50, y: 0.85 }]
    ]
  },

  // =========================================================================
  // 3. CELTYCKIE PISMO DRZEW OGHAM (KOMPLETNE 20 ZNAKÓW - 4 AICME)
  // =========================================================================

  // --- AICME BEITHE (B, L, F, S, N) - Prawa strona pnia ---
  {
    id: 'ogham-beith',
    alphabetId: 'ogham',
    symbol: 'ᚁ',
    name: 'Beith (Brzoza)',
    sound: 'B',
    meaning: 'Biała Brzoza, Oczyszczenie, Nowy Początek',
    element: 'Las Brzóz',
    difficulty: 'Łatwa',
    desc: 'Ogham brzozy. Drewno na pierwsze różdżki adeptów i odpędzanie złych duchów.',
    guideHint: 'Pionowy pień z 1 poziomym nacięciem w prawo.',
    strokes: [
      [{ x: 0.40, y: 0.10 }, { x: 0.40, y: 0.90 }],
      [{ x: 0.40, y: 0.50 }, { x: 0.75, y: 0.50 }]
    ]
  },
  {
    id: 'ogham-luis',
    alphabetId: 'ogham',
    symbol: 'ᚂ',
    name: 'Luis (Jarzębina)',
    sound: 'L',
    meaning: 'Święta Jarzębina, Ochrona przed Urokami',
    element: 'Płomień Ochronny',
    difficulty: 'Łatwa',
    desc: 'Czerwone jagody jarzębiny chronią przed klątwami i czarną magią.',
    guideHint: 'Pionowy pień z 2 poziomymi nacięciami w prawo.',
    strokes: [
      [{ x: 0.40, y: 0.10 }, { x: 0.40, y: 0.90 }],
      [{ x: 0.40, y: 0.38 }, { x: 0.75, y: 0.38 }],
      [{ x: 0.40, y: 0.62 }, { x: 0.75, y: 0.62 }]
    ]
  },
  {
    id: 'ogham-fern',
    alphabetId: 'ogham',
    symbol: 'ᚃ',
    name: 'Fern (Olcha)',
    sound: 'F',
    meaning: 'Czarna Olcha, Tarcza Wojownika & Wytrwałość',
    element: 'Woda & Bagna',
    difficulty: 'Średnia',
    desc: 'Drewno olchy nie gnuśnieje w wodzie. Idealne na rękojeści różdżek i tarcze.',
    guideHint: 'Pionowy pień z 3 poziomymi nacięciami w prawo.',
    strokes: [
      [{ x: 0.40, y: 0.10 }, { x: 0.40, y: 0.90 }],
      [{ x: 0.40, y: 0.30 }, { x: 0.75, y: 0.30 }],
      [{ x: 0.40, y: 0.50 }, { x: 0.75, y: 0.50 }],
      [{ x: 0.40, y: 0.70 }, { x: 0.75, y: 0.70 }]
    ]
  },
  {
    id: 'ogham-sail',
    alphabetId: 'ogham',
    symbol: 'ᚄ',
    name: 'Sail (Wierzba)',
    sound: 'S',
    meaning: 'Wierzba Płacząca, Księżyc & Intuicja',
    element: 'Księżycowa Woda',
    difficulty: 'Średnia',
    desc: 'Drzewo snów i wieszczenia. Wzmacnia magię iluzji i eliksiry usypiające.',
    guideHint: 'Pionowy pień z 4 poziomymi nacięciami w prawo.',
    strokes: [
      [{ x: 0.40, y: 0.10 }, { x: 0.40, y: 0.90 }],
      [{ x: 0.40, y: 0.25 }, { x: 0.75, y: 0.25 }],
      [{ x: 0.40, y: 0.42 }, { x: 0.75, y: 0.42 }],
      [{ x: 0.40, y: 0.58 }, { x: 0.75, y: 0.58 }],
      [{ x: 0.40, y: 0.75 }, { x: 0.75, y: 0.75 }]
    ]
  },
  {
    id: 'ogham-nion',
    alphabetId: 'ogham',
    symbol: 'ᚅ',
    name: 'Nion (Jesion)',
    sound: 'N',
    meaning: 'Jesion Północy, Łącznik Światów & Kosmos',
    element: 'Wiatr & Korona Lasu',
    difficulty: 'Średnia',
    desc: 'Drewno jesionowe łączy niebiosa z ziemią. Zapewnia harmonię w rzucaniu czarów.',
    guideHint: 'Pionowy pień z 5 poziomymi nacięciami w prawo.',
    strokes: [
      [{ x: 0.40, y: 0.10 }, { x: 0.40, y: 0.90 }],
      [{ x: 0.40, y: 0.22 }, { x: 0.75, y: 0.22 }],
      [{ x: 0.40, y: 0.36 }, { x: 0.75, y: 0.36 }],
      [{ x: 0.40, y: 0.50 }, { x: 0.75, y: 0.50 }],
      [{ x: 0.40, y: 0.64 }, { x: 0.75, y: 0.64 }],
      [{ x: 0.40, y: 0.78 }, { x: 0.75, y: 0.78 }]
    ]
  },

  // --- AICME H-ÚATHA (H, D, T, C, Q) - Lewa strona pnia ---
  {
    id: 'ogham-huath',
    alphabetId: 'ogham',
    symbol: 'ᚆ',
    name: 'hUath (Głóg)',
    sound: 'H',
    meaning: 'Biały Głóg, Próba Czystości & Granica Magii',
    element: 'Cierń Lasu',
    difficulty: 'Łatwa',
    desc: 'Drzewo wróżek i strażnik granic. Kto przekroczy głogowy żywopłot, staje przed próbą serca.',
    guideHint: 'Pionowy pień z 1 poziomym nacięciem w lewo.',
    strokes: [
      [{ x: 0.60, y: 0.10 }, { x: 0.60, y: 0.90 }],
      [{ x: 0.60, y: 0.50 }, { x: 0.25, y: 0.50 }]
    ]
  },
  {
    id: 'ogham-dair',
    alphabetId: 'ogham',
    symbol: 'ᚇ',
    name: 'Dair (Dąb)',
    sound: 'D',
    meaning: 'Święty Dąb, Niezłomność, Król Lasu',
    element: 'Prastary Dąb',
    difficulty: 'Średnia',
    desc: 'Dąb tysiącletni. Runa siły królów i druidów, niewzruszona wobec nawałnic.',
    guideHint: 'Pionowy pień z 2 poziomymi nacięciami w lewo.',
    strokes: [
      [{ x: 0.60, y: 0.10 }, { x: 0.60, y: 0.90 }],
      [{ x: 0.60, y: 0.38 }, { x: 0.25, y: 0.38 }],
      [{ x: 0.60, y: 0.62 }, { x: 0.25, y: 0.62 }]
    ]
  },
  {
    id: 'ogham-tinne',
    alphabetId: 'ogham',
    symbol: 'ᚈ',
    name: 'Tinne (Ostrokrzew)',
    sound: 'T',
    meaning: 'Ostrokrzew, Ogień Kowalski, Męstwo',
    element: 'Płomień Kowala',
    difficulty: 'Średnia',
    desc: 'Drewno wojowników. Zapewnia ochronę w pojedynkach i hartuje różdżkę.',
    guideHint: 'Pionowy pień z 3 poziomymi nacięciami w lewo.',
    strokes: [
      [{ x: 0.60, y: 0.10 }, { x: 0.60, y: 0.90 }],
      [{ x: 0.60, y: 0.30 }, { x: 0.25, y: 0.30 }],
      [{ x: 0.60, y: 0.50 }, { x: 0.25, y: 0.50 }],
      [{ x: 0.60, y: 0.70 }, { x: 0.25, y: 0.70 }]
    ]
  },
  {
    id: 'ogham-coll',
    alphabetId: 'ogham',
    symbol: 'ᚉ',
    name: 'Coll (Leszczyna)',
    sound: 'C',
    meaning: 'Leszczyna, Źródło Mądrości, Różdżkarstwo',
    element: 'Wiedza Wodna',
    difficulty: 'Średnia',
    desc: 'Gałązki leszczyny wyczuwają żyły wodne i ukryte złoża kruszców pod Cytadelą.',
    guideHint: 'Pionowy pień z 4 poziomymi nacięciami w lewo.',
    strokes: [
      [{ x: 0.60, y: 0.10 }, { x: 0.60, y: 0.90 }],
      [{ x: 0.60, y: 0.25 }, { x: 0.25, y: 0.25 }],
      [{ x: 0.60, y: 0.42 }, { x: 0.25, y: 0.42 }],
      [{ x: 0.60, y: 0.58 }, { x: 0.25, y: 0.58 }],
      [{ x: 0.60, y: 0.75 }, { x: 0.25, y: 0.75 }]
    ]
  },
  {
    id: 'ogham-ceirt',
    alphabetId: 'ogham',
    symbol: 'ᚊ',
    name: 'Ceirt (Jabłoń)',
    sound: 'Q',
    meaning: 'Dzika Jabłoń Avalon, Nieśmiertelność & Uzdrowienie',
    element: 'Słodki Sad',
    difficulty: 'Średnia',
    desc: 'Jabłka Avalonu. Przywraca witalność i wspomaga regenerację sił witalnych.',
    guideHint: 'Pionowy pień z 5 poziomymi nacięciami w lewo.',
    strokes: [
      [{ x: 0.60, y: 0.10 }, { x: 0.60, y: 0.90 }],
      [{ x: 0.60, y: 0.22 }, { x: 0.25, y: 0.22 }],
      [{ x: 0.60, y: 0.36 }, { x: 0.25, y: 0.36 }],
      [{ x: 0.60, y: 0.50 }, { x: 0.25, y: 0.50 }],
      [{ x: 0.60, y: 0.64 }, { x: 0.25, y: 0.64 }],
      [{ x: 0.60, y: 0.78 }, { x: 0.25, y: 0.78 }]
    ]
  },

  // --- AICME MUINE (M, G, NG, ST, R) - Skośne nacięcia przez pień ---
  {
    id: 'ogham-muin',
    alphabetId: 'ogham',
    symbol: 'ᚋ',
    name: 'Muin (Winorośl)',
    sound: 'M',
    meaning: 'Winorośl, Trans Proroczy & Radość',
    element: 'Sok Życia',
    difficulty: 'Średnia',
    desc: 'Runa wieszczenia w ekstazie. Otwiera trzecie oko maga na wizje przyszłości.',
    guideHint: 'Pionowy pień z 1 ukośnym nacięciem przecinającym oś.',
    strokes: [
      [{ x: 0.50, y: 0.10 }, { x: 0.50, y: 0.90 }],
      [{ x: 0.25, y: 0.60 }, { x: 0.75, y: 0.40 }]
    ]
  },
  {
    id: 'ogham-gort',
    alphabetId: 'ogham',
    symbol: 'ᚌ',
    name: 'Gort (Bluszcz)',
    sound: 'G',
    meaning: 'Wiecznie Zielony Bluszcz, Wytrwałość & Oplot',
    element: 'Leśny Oplot',
    difficulty: 'Średnia',
    desc: 'Bluszcz pnący się po granitowych murach. Wiąże wrogów potężnymi więzami natury.',
    guideHint: 'Pionowy pień z 2 ukośnymi nacięciami przecinającymi oś.',
    strokes: [
      [{ x: 0.50, y: 0.10 }, { x: 0.50, y: 0.90 }],
      [{ x: 0.25, y: 0.48 }, { x: 0.75, y: 0.28 }],
      [{ x: 0.25, y: 0.72 }, { x: 0.75, y: 0.52 }]
    ]
  },
  {
    id: 'ogham-ngeadal',
    alphabetId: 'ogham',
    symbol: 'ᚍ',
    name: 'nGéadal (Trzcina)',
    sound: 'NG',
    meaning: 'Trzcina Rzeczna, Elastyczność & Uzdrawianie',
    element: 'Brzeg Jeziora',
    difficulty: 'Średnia',
    desc: 'Trzcina uginająca się przed wichrem, lecz nigdy nie pękająca. Runa giętkości umysłu.',
    guideHint: 'Pionowy pień z 3 ukośnymi nacięciami przecinającymi oś.',
    strokes: [
      [{ x: 0.50, y: 0.10 }, { x: 0.50, y: 0.90 }],
      [{ x: 0.25, y: 0.38 }, { x: 0.75, y: 0.22 }],
      [{ x: 0.25, y: 0.58 }, { x: 0.75, y: 0.42 }],
      [{ x: 0.25, y: 0.78 }, { x: 0.75, y: 0.62 }]
    ]
  },
  {
    id: 'ogham-straif',
    alphabetId: 'ogham',
    symbol: 'ᚎ',
    name: 'Straif (Tarnina)',
    sound: 'ST / Z',
    meaning: 'Tarnina, Mroczna Ochrona & Pancerz Cierni',
    element: 'Mrok & Cierń',
    difficulty: 'Średnia',
    desc: 'Ciernie tarniny nieprzepuszczające demonów ani klątw. Tarcza ostateczna.',
    guideHint: 'Pionowy pień z 4 ukośnymi nacięciami przecinającymi oś.',
    strokes: [
      [{ x: 0.50, y: 0.10 }, { x: 0.50, y: 0.90 }],
      [{ x: 0.25, y: 0.32 }, { x: 0.75, y: 0.18 }],
      [{ x: 0.25, y: 0.48 }, { x: 0.75, y: 0.34 }],
      [{ x: 0.25, y: 0.64 }, { x: 0.75, y: 0.50 }],
      [{ x: 0.25, y: 0.80 }, { x: 0.75, y: 0.66 }]
    ]
  },
  {
    id: 'ogham-ruis',
    alphabetId: 'ogham',
    symbol: 'ᚏ',
    name: 'Ruis (Czarny Bez)',
    sound: 'R',
    meaning: 'Czarny Bez, Kres Cyklu & Odrodzenie z Popiołów',
    element: 'Zmierzch & Zmiana',
    difficulty: 'Średnia',
    desc: 'Koniec i nowy początek. Runa do zamykania starych rytuałów i pieczętowania grobowców.',
    guideHint: 'Pionowy pień z 5 ukośnymi nacięciami przecinającymi oś.',
    strokes: [
      [{ x: 0.50, y: 0.10 }, { x: 0.50, y: 0.90 }],
      [{ x: 0.25, y: 0.28 }, { x: 0.75, y: 0.16 }],
      [{ x: 0.25, y: 0.42 }, { x: 0.75, y: 0.30 }],
      [{ x: 0.25, y: 0.56 }, { x: 0.75, y: 0.44 }],
      [{ x: 0.25, y: 0.70 }, { x: 0.75, y: 0.58 }],
      [{ x: 0.25, y: 0.84 }, { x: 0.75, y: 0.72 }]
    ]
  },

  // --- AICME AILME (A, O, U, E, I) - Prostopadłe nacięcia przez pień ---
  {
    id: 'ogham-ailm',
    alphabetId: 'ogham',
    symbol: 'ᚐ',
    name: 'Ailm (Sosna / Jodła)',
    sound: 'A',
    meaning: 'Biała Jodła, Wyniosłość, Perspektywa z Wieży',
    element: 'Wysokie Szczyty',
    difficulty: 'Łatwa',
    desc: 'Najwyższe drzewo widzące za horyzont. Zapewnia jasność wizji z Najwyższej Wieży.',
    guideHint: 'Pionowy pień z 1 poziomą poprzeczką w centrum.',
    strokes: [
      [{ x: 0.50, y: 0.10 }, { x: 0.50, y: 0.90 }],
      [{ x: 0.20, y: 0.50 }, { x: 0.80, y: 0.50 }]
    ]
  },
  {
    id: 'ogham-onn',
    alphabetId: 'ogham',
    symbol: 'ᚑ',
    name: 'Onn (Janowiec)',
    sound: 'O',
    meaning: 'Żółty Janowiec, Złoty Pył & Droga Naprzód',
    element: 'Złote Światło',
    difficulty: 'Łatwa',
    desc: 'Krzew złotych kwiatów. Prowadzi poszukiwaczy do ukrytych komnat Cytadeli.',
    guideHint: 'Pionowy pień z 2 poziomymi poprzeczkami.',
    strokes: [
      [{ x: 0.50, y: 0.10 }, { x: 0.50, y: 0.90 }],
      [{ x: 0.20, y: 0.38 }, { x: 0.80, y: 0.38 }],
      [{ x: 0.20, y: 0.62 }, { x: 0.80, y: 0.62 }]
    ]
  },
  {
    id: 'ogham-ur',
    alphabetId: 'ogham',
    symbol: 'ᚒ',
    name: 'Úr (Wrzos)',
    sound: 'U',
    meaning: 'Wrzosowiska Północy, Namiętność & Uzdrowienie Ziemi',
    element: 'Wrzosowe Pola',
    difficulty: 'Średnia',
    desc: 'Wrzosy kwitnące na zmarzlinie. Symbol życia odradzającego się w surowym klimacie.',
    guideHint: 'Pionowy pień z 3 poziomymi poprzeczkami.',
    strokes: [
      [{ x: 0.50, y: 0.10 }, { x: 0.50, y: 0.90 }],
      [{ x: 0.20, y: 0.30 }, { x: 0.80, y: 0.30 }],
      [{ x: 0.20, y: 0.50 }, { x: 0.80, y: 0.50 }],
      [{ x: 0.20, y: 0.70 }, { x: 0.80, y: 0.70 }]
    ]
  },
  {
    id: 'ogham-eadhadh',
    alphabetId: 'ogham',
    symbol: 'ᚓ',
    name: 'Eadhadh (Topola)',
    sound: 'E',
    meaning: 'Osika / Topola, Tarcza przed Lękiem',
    element: 'Szelest Liści',
    difficulty: 'Średnia',
    desc: 'Drżące liście osiki wyłapują najlżejsze wahania magii. Ostrzega przed podstępem.',
    guideHint: 'Pionowy pień z 4 poziomymi poprzeczkami.',
    strokes: [
      [{ x: 0.50, y: 0.10 }, { x: 0.50, y: 0.90 }],
      [{ x: 0.20, y: 0.25 }, { x: 0.80, y: 0.25 }],
      [{ x: 0.20, y: 0.42 }, { x: 0.80, y: 0.42 }],
      [{ x: 0.20, y: 0.58 }, { x: 0.80, y: 0.58 }],
      [{ x: 0.20, y: 0.75 }, { x: 0.80, y: 0.75 }]
    ]
  },
  {
    id: 'ogham-iodhadh',
    alphabetId: 'ogham',
    symbol: 'ᚔ',
    name: 'Iodhadh (Cis Druidzki)',
    sound: 'I',
    meaning: 'Święty Cis, Wieczność, Pamięć Wieków',
    element: 'Pamięć Czasu',
    difficulty: 'Średnia',
    desc: 'Najstarsze drzewo w tradycji celtyckiej. Przechowuje całą pamięć starożytnych druidów.',
    guideHint: 'Pionowy pień z 5 poziomymi poprzeczkami.',
    strokes: [
      [{ x: 0.50, y: 0.10 }, { x: 0.50, y: 0.90 }],
      [{ x: 0.20, y: 0.22 }, { x: 0.80, y: 0.22 }],
      [{ x: 0.20, y: 0.36 }, { x: 0.80, y: 0.36 }],
      [{ x: 0.20, y: 0.50 }, { x: 0.80, y: 0.50 }],
      [{ x: 0.20, y: 0.64 }, { x: 0.80, y: 0.64 }],
      [{ x: 0.20, y: 0.78 }, { x: 0.80, y: 0.78 }]
    ]
  },

  // =========================================================================
  // 4. SYMBOLE ALCHEMICZNE & METALE (10 PIERWOTNYCH ZNAKÓW)
  // =========================================================================
  {
    id: 'alchemy-ignis',
    alphabetId: 'alchemy',
    symbol: '🜂',
    name: 'Ignis (Ogień)',
    sound: 'IGNIS',
    meaning: 'Pierwotny Ogień, Transmutacja, Pasja & Ciepło',
    element: 'Czysty Ogień',
    difficulty: 'Łatwa',
    desc: 'Najbardziej żarliwy symbol alchemii. Trójkąt skierowany w niebiosa.',
    guideHint: 'Trójkąt równoboczny z wierzchołkiem ku górze.',
    strokes: [
      [{ x: 0.50, y: 0.18 }, { x: 0.20, y: 0.80 }],
      [{ x: 0.20, y: 0.80 }, { x: 0.80, y: 0.80 }],
      [{ x: 0.80, y: 0.80 }, { x: 0.50, y: 0.18 }]
    ]
  },
  {
    id: 'alchemy-aqua',
    alphabetId: 'alchemy',
    symbol: '🜄',
    name: 'Aqua (Woda)',
    sound: 'AQUA',
    meaning: 'Woda Żywa, Płynność, Uczucia & Zmiana',
    element: 'Płynna Woda',
    difficulty: 'Łatwa',
    desc: 'Kielich przyjmujący deszcz i lód. Podstawa wszelkich wywarów i eliksirów.',
    guideHint: 'Odwrócony trójkąt z wierzchołkiem skierowanym w dół.',
    strokes: [
      [{ x: 0.20, y: 0.20 }, { x: 0.80, y: 0.20 }],
      [{ x: 0.80, y: 0.20 }, { x: 0.50, y: 0.82 }],
      [{ x: 0.50, y: 0.82 }, { x: 0.20, y: 0.20 }]
    ]
  },
  {
    id: 'alchemy-aer',
    alphabetId: 'alchemy',
    symbol: '🜁',
    name: 'Aer (Powietrze)',
    sound: 'AER',
    meaning: 'Wichura, Eter, Myśl & Zmienność',
    element: 'Północny Wiatr',
    difficulty: 'Średnia',
    desc: 'Żywioł wichury niosący śnieżną zamieć na fiordy. Trójkąt w górę z poziomą poprzeczką.',
    guideHint: 'Trójkąt w górę przecięty poziomą kreską w górnej części.',
    strokes: [
      [{ x: 0.50, y: 0.18 }, { x: 0.20, y: 0.80 }],
      [{ x: 0.20, y: 0.80 }, { x: 0.80, y: 0.80 }],
      [{ x: 0.80, y: 0.80 }, { x: 0.50, y: 0.18 }],
      [{ x: 0.28, y: 0.45 }, { x: 0.72, y: 0.45 }]
    ]
  },
  {
    id: 'alchemy-terra',
    alphabetId: 'alchemy',
    symbol: '🜃',
    name: 'Terra (Ziemia)',
    sound: 'TERRA',
    meaning: 'Bazalt, Minerały, Stabilność & Ciężar',
    element: 'Skała & Bazalt',
    difficulty: 'Średnia',
    desc: 'Ziemia ociężała i trwała. Odwrócony trójkąt z poprzeczną linią materii stałej.',
    guideHint: 'Trójkąt w dół przecięty poziomą kreską w dolnej części.',
    strokes: [
      [{ x: 0.20, y: 0.20 }, { x: 0.80, y: 0.20 }],
      [{ x: 0.80, y: 0.20 }, { x: 0.50, y: 0.82 }],
      [{ x: 0.50, y: 0.82 }, { x: 0.20, y: 0.20 }],
      [{ x: 0.28, y: 0.55 }, { x: 0.72, y: 0.55 }]
    ]
  },
  {
    id: 'alchemy-sol',
    alphabetId: 'alchemy',
    symbol: '☉',
    name: 'Sol (Złoto / Słońce)',
    sound: 'SOL',
    meaning: 'Złoto Alchemiczne, Doskonałość & Blask',
    element: 'Czyste Złoto',
    difficulty: 'Średnia',
    desc: 'Zwieńczenie Wielkiego Dzieła. Czyste złoto symbolizujące oświeconą duszę maga.',
    guideHint: 'Okrąg z wyraźną kropką w samym środku.',
    strokes: [
      [{ x: 0.50, y: 0.18 }, { x: 0.78, y: 0.50 }],
      [{ x: 0.78, y: 0.50 }, { x: 0.50, y: 0.82 }],
      [{ x: 0.50, y: 0.82 }, { x: 0.22, y: 0.50 }],
      [{ x: 0.22, y: 0.50 }, { x: 0.50, y: 0.18 }],
      [{ x: 0.48, y: 0.50 }, { x: 0.52, y: 0.50 }]
    ]
  },
  {
    id: 'alchemy-luna',
    alphabetId: 'alchemy',
    symbol: '☽',
    name: 'Luna (Srebro / Księżyc)',
    sound: 'LUNA',
    meaning: 'Żywe Srebro, Odzwierciedlenie & Tajemnica',
    element: 'Białe Srebro',
    difficulty: 'Łatwa',
    desc: 'Srebro odbijające promienie gwiazd. Podstawa do wyrobu luster prawdy i sztyletów.',
    guideHint: 'Księżyc w nowiu / półksiężyc zwrócony w lewo.',
    strokes: [
      [{ x: 0.60, y: 0.18 }, { x: 0.30, y: 0.50 }],
      [{ x: 0.30, y: 0.50 }, { x: 0.60, y: 0.82 }],
      [{ x: 0.60, y: 0.82 }, { x: 0.45, y: 0.50 }],
      [{ x: 0.45, y: 0.50 }, { x: 0.60, y: 0.18 }]
    ]
  },
  {
    id: 'alchemy-sal',
    alphabetId: 'alchemy',
    symbol: '🜔',
    name: 'Sal (Sól Ziemi)',
    sound: 'SAL',
    meaning: 'Sól Filozoficzna, Ciało Fizyczne & Trwałość',
    element: 'Sól Krystaliczna',
    difficulty: 'Średnia',
    desc: 'Zasada utrwalenia materii. Spaja duszę (Sulfur) z duchem (Mercurius).',
    guideHint: 'Koło przecięte poziomą linią przez środek.',
    strokes: [
      [{ x: 0.50, y: 0.18 }, { x: 0.78, y: 0.50 }],
      [{ x: 0.78, y: 0.50 }, { x: 0.50, y: 0.82 }],
      [{ x: 0.50, y: 0.82 }, { x: 0.22, y: 0.50 }],
      [{ x: 0.22, y: 0.50 }, { x: 0.50, y: 0.18 }],
      [{ x: 0.22, y: 0.50 }, { x: 0.78, y: 0.50 }]
    ]
  },
  {
    id: 'alchemy-sulfur',
    alphabetId: 'alchemy',
    symbol: '🜍',
    name: 'Sulfur (Siarka)',
    sound: 'SULFUR',
    meaning: 'Siarka Filozoficzna, Dusza, Żar & Pasja',
    element: 'Duchowy Ogień',
    difficulty: 'Średnia',
    desc: 'Ognista zasada alchemii. Nadaje eliksirom aktywność i zdolność do transformacji.',
    guideHint: 'Trójkąt u góry nad krzyżem równoramiennym u dołu.',
    strokes: [
      [{ x: 0.50, y: 0.15 }, { x: 0.25, y: 0.50 }],
      [{ x: 0.25, y: 0.50 }, { x: 0.75, y: 0.50 }],
      [{ x: 0.75, y: 0.50 }, { x: 0.50, y: 0.15 }],
      [{ x: 0.50, y: 0.50 }, { x: 0.50, y: 0.85 }],
      [{ x: 0.30, y: 0.70 }, { x: 0.70, y: 0.70 }]
    ]
  },
  {
    id: 'alchemy-mercurius',
    alphabetId: 'alchemy',
    symbol: '☿',
    name: 'Mercurius (Rtęć)',
    sound: 'MERCURIUS',
    meaning: 'Żywe Srebro, Umysł, Przepływ & Eter',
    element: 'Płynny Metal',
    difficulty: 'Mistrzowska',
    desc: 'Duchowa esencja łącząca przeciwieństwa. Pozwala metalom przyjmować nowe formy.',
    guideHint: 'Półksiężyc u góry, koło w środku i krzyż u dołu.',
    strokes: [
      [{ x: 0.35, y: 0.15 }, { x: 0.65, y: 0.15 }],
      [{ x: 0.50, y: 0.25 }, { x: 0.70, y: 0.45 }],
      [{ x: 0.70, y: 0.45 }, { x: 0.50, y: 0.65 }],
      [{ x: 0.50, y: 0.65 }, { x: 0.30, y: 0.45 }],
      [{ x: 0.30, y: 0.45 }, { x: 0.50, y: 0.25 }],
      [{ x: 0.50, y: 0.65 }, { x: 0.50, y: 0.88 }],
      [{ x: 0.35, y: 0.78 }, { x: 0.65, y: 0.78 }]
    ]
  },
  {
    id: 'alchemy-athanor',
    alphabetId: 'alchemy',
    symbol: '🜂',
    name: 'Athanor (Kocioł Życia)',
    sound: 'ATHANOR',
    meaning: 'Piec Alchemiczny, Niegasnący Płomień',
    element: 'Żar Alchemiczny',
    difficulty: 'Średnia',
    desc: 'Piec utrzymujący stałą temperaturę przez 40 dni. Kolebka Kamienia Filozoficznego.',
    guideHint: 'Kwadratowa podstawa pieca z trójkątnym płomieniem wznoszącym się w górę.',
    strokes: [
      [{ x: 0.25, y: 0.50 }, { x: 0.75, y: 0.50 }],
      [{ x: 0.25, y: 0.50 }, { x: 0.25, y: 0.85 }],
      [{ x: 0.75, y: 0.50 }, { x: 0.75, y: 0.85 }],
      [{ x: 0.25, y: 0.85 }, { x: 0.75, y: 0.85 }],
      [{ x: 0.50, y: 0.15 }, { x: 0.25, y: 0.50 }],
      [{ x: 0.50, y: 0.15 }, { x: 0.75, y: 0.50 }]
    ]
  },

  // =========================================================================
  // 5. GALDRASTAFIR (PIECZĘCIE ISLANDZKIE - 6 ZNAKÓW)
  // =========================================================================
  {
    id: 'galdr-vegvisir',
    alphabetId: 'galdrastafir',
    symbol: 'ᚙ',
    name: 'Vegvísir (Kompas Drogi)',
    sound: 'VEGVISIR',
    meaning: 'Przewodnik we Mgle, Ochrona w Zamieci',
    element: 'Mroźny Wiatr',
    difficulty: 'Mistrzowska',
    desc: 'Kto nosi ten znak, nigdy nie zgubi drogi w sztormach i śnieżycach fiordów.',
    guideHint: 'Ośmioramienny kompas z poprzecznymi zębami na końcach.',
    strokes: [
      [{ x: 0.50, y: 0.15 }, { x: 0.50, y: 0.85 }],
      [{ x: 0.15, y: 0.50 }, { x: 0.85, y: 0.50 }],
      [{ x: 0.25, y: 0.25 }, { x: 0.75, y: 0.75 }],
      [{ x: 0.25, y: 0.75 }, { x: 0.75, y: 0.25 }],
      [{ x: 0.42, y: 0.15 }, { x: 0.58, y: 0.15 }],
      [{ x: 0.42, y: 0.85 }, { x: 0.58, y: 0.85 }]
    ]
  },
  {
    id: 'galdr-aegishjalmur',
    alphabetId: 'galdrastafir',
    symbol: 'ᛟ',
    name: 'Ægishjálmur (Hełm Grozy)',
    sound: 'AEGISHJALMUR',
    meaning: 'Porażenie Wrogów, Tarcza Niewidzialności',
    element: 'Mroźna Furia',
    difficulty: 'Mistrzowska',
    desc: 'Hełm grozy noszony między brwiami. Paraliżuje wzrok wrogów i odbija czarnoksięskie klątwy.',
    guideHint: 'Ośmioramienny krzyż z potrójnymi rozgałęzieniami (trójzębami) na końcach.',
    strokes: [
      [{ x: 0.50, y: 0.15 }, { x: 0.50, y: 0.85 }],
      [{ x: 0.15, y: 0.50 }, { x: 0.85, y: 0.50 }],
      [{ x: 0.25, y: 0.25 }, { x: 0.75, y: 0.75 }],
      [{ x: 0.25, y: 0.75 }, { x: 0.75, y: 0.25 }],
      [{ x: 0.35, y: 0.25 }, { x: 0.35, y: 0.35 }],
      [{ x: 0.65, y: 0.25 }, { x: 0.65, y: 0.35 }]
    ]
  },
  {
    id: 'galdr-ginfaxi',
    alphabetId: 'galdrastafir',
    symbol: 'ᚷ',
    name: 'Ginfaxi (Ostrze Odwagi)',
    sound: 'GINFAXI',
    meaning: 'Niezłomność w Pojedynku, Męstwo',
    element: 'Żelazny Ostrze',
    difficulty: 'Średnia',
    desc: 'Pieczęć odwagi wkładana pod but przed wejściem do kręgu pojedynkowego Hólmganga.',
    guideHint: 'Pionowy miecz z trzema poziomymi poprzeczkami zębatymi.',
    strokes: [
      [{ x: 0.50, y: 0.15 }, { x: 0.50, y: 0.85 }],
      [{ x: 0.30, y: 0.30 }, { x: 0.70, y: 0.30 }],
      [{ x: 0.30, y: 0.50 }, { x: 0.70, y: 0.50 }],
      [{ x: 0.30, y: 0.70 }, { x: 0.70, y: 0.70 }]
    ]
  },
  {
    id: 'galdr-kaupaloki',
    alphabetId: 'galdrastafir',
    symbol: 'ᚦ',
    name: 'Kaupaloki (Złoty Targ)',
    sound: 'KAUPALOKI',
    meaning: 'Pomyślność Handlowa & Uczciwy Zysk',
    element: 'Złote Skirniry',
    difficulty: 'Średnia',
    desc: 'Pieczęć kupiecka Kaupangru. Zapewnia pomyślne transakcje i zniżki na kramach.',
    guideHint: 'Krzyż o ramionach zakończonych pętlami.',
    strokes: [
      [{ x: 0.50, y: 0.20 }, { x: 0.50, y: 0.80 }],
      [{ x: 0.20, y: 0.50 }, { x: 0.80, y: 0.50 }],
      [{ x: 0.20, y: 0.35 }, { x: 0.35, y: 0.50 }],
      [{ x: 0.80, y: 0.35 }, { x: 0.65, y: 0.50 }]
    ]
  },
  {
    id: 'galdr-angurgapi',
    alphabetId: 'galdrastafir',
    symbol: 'ᛉ',
    name: 'Angurgapi (Uciszenie Burzy)',
    sound: 'ANGURGAPI',
    meaning: 'Uciszenie Nawałnicy, Spokój Morza',
    element: 'Cichy Wiatr',
    difficulty: 'Mistrzowska',
    desc: 'Galdr ryty na dnie beczek i okrętów. Ucisza wściekłe sztormy na Morzu Północnym.',
    guideHint: 'Pionowy słupek z dwiema krzyżującymi się falami.',
    strokes: [
      [{ x: 0.50, y: 0.15 }, { x: 0.50, y: 0.85 }],
      [{ x: 0.25, y: 0.30 }, { x: 0.75, y: 0.30 }],
      [{ x: 0.25, y: 0.60 }, { x: 0.75, y: 0.60 }],
      [{ x: 0.35, y: 0.45 }, { x: 0.65, y: 0.45 }]
    ]
  },
  {
    id: 'galdr-ottastafur',
    alphabetId: 'galdrastafir',
    symbol: 'ᛊ',
    name: 'Ottastafur (Trwoga Wroga)',
    sound: 'OTTASTAFUR',
    meaning: 'Postrach Ciemności, Tarcza przed Bestiami',
    element: 'Płomień Zastraszający',
    difficulty: 'Mistrzowska',
    desc: 'Galdr wycinany na ołowianych tabliczkach. Wzbudza lęk w sercach dzikich bestii i wrogów.',
    guideHint: 'Podwójny krzyż ze szponami na końcach.',
    strokes: [
      [{ x: 0.35, y: 0.20 }, { x: 0.35, y: 0.80 }],
      [{ x: 0.65, y: 0.20 }, { x: 0.65, y: 0.80 }],
      [{ x: 0.20, y: 0.50 }, { x: 0.80, y: 0.50 }]
    ]
  }
];

export const RUNIC_ACHIEVEMENTS = [
  {
    id: 'ach-first-rune',
    title: 'Pierwszy Ryt w Skale',
    category: 'Kaligrafia Run',
    icon: '✨',
    desc: 'Wyryj poprawnie swoją pierwszą runę na Kamiennej Tablicy.',
    rewardPoints: 15,
    rewardCurrency: 25,
    rewardTitle: 'Adept Rysika Run',
    rewardXp: 40,
    checkUnlocked: (stats) => stats.totalRunesDrawn >= 1
  },
  {
    id: 'ach-futhark-initiate',
    title: 'Zew Północnego Futharku',
    category: 'Futhark Starszy',
    icon: 'ᚠ',
    desc: 'Opanuj kaligrafię przynajmniej 6 run ze Starszego Futharku.',
    rewardPoints: 35,
    rewardCurrency: 50,
    rewardTitle: 'Skryba Starszego Futharku',
    rewardXp: 80,
    checkUnlocked: (stats) => (stats.drawnByAlphabet['elder-futhark'] || 0) >= 6
  },
  {
    id: 'ach-futhark-full-master',
    title: 'Arcymistrz 24 Run Futharku',
    category: 'Futhark Starszy',
    icon: 'ᛟ',
    desc: 'Wyryj bezbłędnie wszystkie 24 runy Starszego Futharku (kompletne 3 Aetty)!',
    rewardPoints: 100,
    rewardCurrency: 150,
    rewardTitle: 'Arcymistrz Trzech Aettów Północy',
    rewardItem: 'Kryształowy Kałamarz Odyna',
    rewardXp: 300,
    checkUnlocked: (stats) => (stats.drawnByAlphabet['elder-futhark'] || 0) >= 24
  },
  {
    id: 'ach-glagolitic-seer',
    title: 'Słowiański Wieszcz Głagolicy',
    category: 'Głagolica',
    icon: 'Ⰳ',
    desc: 'Odtwórz bezbłędnie 5 znaków ze słowiańskiego alfabetu głagolicy.',
    rewardPoints: 40,
    rewardCurrency: 60,
    rewardTitle: 'Mistyk Słowiańskich Puszcz',
    rewardXp: 100,
    checkUnlocked: (stats) => (stats.drawnByAlphabet['glagolitic'] || 0) >= 5
  },
  {
    id: 'ach-glagolitic-master',
    title: 'Książę Słowiańskich Wolchwów',
    category: 'Głagolica',
    icon: 'Ⰰ',
    desc: 'Wyryj 12 znaków ze świętego alfabetu głagolicy.',
    rewardPoints: 80,
    rewardCurrency: 120,
    rewardTitle: 'Wieszcz Świętokrzyskiej Głagolicy',
    rewardXp: 250,
    checkUnlocked: (stats) => (stats.drawnByAlphabet['glagolitic'] || 0) >= 12
  },
  {
    id: 'ach-ogham-druid',
    title: 'Celtycki Strażnik Ogham',
    category: 'Ogham',
    icon: '᚛',
    desc: 'Wyryj na tablicy 6 inskrypcji celtyckiego Pisma Drzew.',
    rewardPoints: 40,
    rewardCurrency: 60,
    rewardTitle: 'Druidzki Kronikarz Ogham',
    rewardXp: 100,
    checkUnlocked: (stats) => (stats.drawnByAlphabet['ogham'] || 0) >= 6
  },
  {
    id: 'ach-ogham-twenty-trees',
    title: 'Władca Świętego Gaju 20 Drzew',
    category: 'Ogham',
    icon: 'ᚇ',
    desc: 'Opanuj wszystkie 20 liter Ogham (kompletne 4 Aicme Pisma Drzew)!',
    rewardPoints: 90,
    rewardCurrency: 140,
    rewardTitle: 'Arcydruid Pamięci Ogham',
    rewardItem: 'Różdżka z Tysiącletniego Cisu Ogham',
    rewardXp: 280,
    checkUnlocked: (stats) => (stats.drawnByAlphabet['ogham'] || 0) >= 20
  },
  {
    id: 'ach-alchemy-elements',
    title: 'Pieczęć Czterech Żywiołów',
    category: 'Alchemia',
    icon: '🜂',
    desc: 'Narysuj co najmniej 4 symbole żywiołów (Ogień, Woda, Ziemia, Powietrze).',
    rewardPoints: 45,
    rewardCurrency: 65,
    rewardTitle: 'Hermetyczny Adept Transmutacji',
    rewardXp: 110,
    checkUnlocked: (stats) => (stats.drawnByAlphabet['alchemy'] || 0) >= 4
  },
  {
    id: 'ach-alchemy-magnum-opus',
    title: 'Twórca Kamienia Filozoficznego',
    category: 'Alchemia',
    icon: '☉',
    desc: 'Wyryj 8 symboli alchemicznych, w tym Sol, Luna, Sal i Sulfur.',
    rewardPoints: 85,
    rewardCurrency: 130,
    rewardTitle: 'Mistrz Wielkiego Dzieła Alchemii',
    rewardXp: 260,
    checkUnlocked: (stats) => (stats.drawnByAlphabet['alchemy'] || 0) >= 8
  },
  {
    id: 'ach-galdrastafir-ward',
    title: 'Strażnik Islandzkich Pieczęci',
    category: 'Galdrastafir',
    icon: 'ᚙ',
    desc: 'Wyryj 4 potężne pieczęcie Galdrastafir, w tym Vegvísir i Ægishjálmur.',
    rewardPoints: 60,
    rewardCurrency: 90,
    rewardTitle: 'Mistrz Galdrów Fiordów',
    rewardXp: 180,
    checkUnlocked: (stats) => (stats.drawnByAlphabet['galdrastafir'] || 0) >= 4
  },
  {
    id: 'ach-polyglot-five',
    title: 'Mistrz Pięciu Pradawnych Alfabetów',
    category: 'Arcymistrz',
    icon: '👑',
    desc: 'Narysuj co najmniej po 3 runy z każdego z 5 pradawnych alfabetów!',
    rewardPoints: 120,
    rewardCurrency: 200,
    rewardTitle: 'Arcymistrz Pradawnych Inskrypcji',
    rewardItem: 'Złoty Rysik Mistrza Kaligrafii Run',
    rewardXp: 400,
    checkUnlocked: (stats) => {
      const alphabets = ['elder-futhark', 'glagolitic', 'ogham', 'alchemy', 'galdrastafir'];
      return alphabets.every(a => (stats.drawnByAlphabet[a] || 0) >= 3);
    }
  },
  {
    id: 'ach-master-accuracy',
    title: 'Ręka Runicznego Mistrza (90%+ Zgodności)',
    category: 'Precyzja',
    icon: '🎯',
    desc: 'Osiągnij ponad 90% precyzji w dopasowaniu linii przy rysowaniu dowolnej runy.',
    rewardPoints: 40,
    rewardCurrency: 60,
    rewardTitle: 'Oko Sokoła i Złoty Rysik',
    rewardXp: 120,
    checkUnlocked: (stats) => stats.maxAccuracy >= 90
  },
  {
    id: 'ach-speed-trial',
    title: 'Błyskawiczny Rytuał Runiczny',
    category: 'Próba Czasu',
    icon: '⚡',
    desc: 'Ukończ Wyzwanie Czasowe (Runic Gauntlet) z wynikiem co najmniej 5 run w limicie czasu!',
    rewardPoints: 60,
    rewardCurrency: 90,
    rewardTitle: 'Szybkopis Północy',
    rewardXp: 180,
    checkUnlocked: (stats) => stats.speedTrialBestScore >= 5
  }
];
