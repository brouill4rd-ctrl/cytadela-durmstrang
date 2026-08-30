// Definicje questów silnika questów — pilot: łańcuch Jötunskógu
// Format: tablica obiektów zgodna ze schematem quest_definitions

export const QUEST_DEFINITIONS = [

  // ═══════════════════════════════════════════════════════════════
  //  ŁAŃCUCH JÖTUNSKÓGU — jot-main
  // ═══════════════════════════════════════════════════════════════

  {
    id: 'jot-q1-skraj',
    version: 1,
    title: 'Na Skraju Jötunskógu',
    description: 'Strażnik Björnar donosi o zaginionych studentach. Świeże ślady prowadzą w głąb Czarnego Lasu.',
    category: 'Eksploracja',
    difficulty: 'Łatwy',
    location_id: 'wl-jot-skraj',
    chain_id: 'jot-main',
    order_index: 1,
    requirements: {},
    stages: [
      {
        index: 0,
        type: 'dialogue',
        title: 'Strażnik Björnar',
        narrative: 'Leśny Strażnik Björnar stoi przy tablicy z ponurą miną. Wskazuje na świeże ślady butów prowadzące między sosny.\n\n*„Trzecia para zaginiona w tym miesiącu. Żadna nie wróciła sama. Śnieg przyjął ich ślady — możecie je odczytać, jeśli wiecie jak."*',
        objective: 'Wysłuchaj Björnara',
        actions: [
          { id: 'wysluchaj', label: 'Wysłuchaj uważnie' },
          { id: 'pytaj', label: 'Zapytaj o ostatnie zaginięcie' },
          { id: 'do_lasu', label: 'Wejdź w las bez czekania' }
        ]
      },
      {
        index: 1,
        type: 'choice',
        title: 'Tropienie śladów',
        narrative: 'Ślady są wyraźne w świeżym śniegu. Las milczy. Björnar czeka na twój ruch.',
        objective: 'Wybierz metodę tropienia',
        actions: [
          { id: 'vestigia', label: 'Rzuć Vestigia — odczytaj magiczne ślady', score: 3 },
          { id: 'obserwacja', label: 'Podążaj wzrokiem, nie depcząc po śladach', score: 2 },
          { id: 'biegiem', label: 'Wejdź szybko i patrz gdzie prowadzą', score: 1 }
        ]
      }
    ],
    rewards: { points: 15, xp: 40, skirniry: 8 }
  },

  {
    id: 'jot-q2-slady',
    version: 1,
    title: 'Ślady Prowadzą Głębiej',
    description: 'Tropy zaprowadziły do porzuconego plecaka przy Rozdroźu Wisielców. Ktoś wskazuje na Chatkę Zielarki.',
    category: 'Eksploracja',
    difficulty: 'Łatwy',
    location_id: 'wl-jot-skraj',
    chain_id: 'jot-main',
    order_index: 2,
    requirements: { type: 'quest_completed', id: 'jot-q1-skraj' },
    stages: [
      {
        index: 0,
        type: 'dialogue',
        title: 'Porzucony plecak',
        narrative: 'Przy Rozdroźu Wisielców — stary pień z dwoma powieszonymi szmaciami — leży rozdarty plecak. W środku: notatnik z Durmstrangu, kompas (zatrzymany) i mapa lasu z zaznaczonym „X" przy miejscu, które nie ma nazwy.\n\n*Zielarka. Jedyna, która zna las od środka.*',
        objective: 'Zbadaj porzucony plecak',
        actions: [
          { id: 'notatnik', label: 'Przejrzyj notatnik' },
          { id: 'kompas', label: 'Sprawdź dlaczego kompas stoi' },
          { id: 'mapa', label: 'Przestudiuj mapę z zaznaczonym X' }
        ]
      },
      {
        index: 1,
        type: 'visit_location',
        title: 'Idź do Chatki Zielarki',
        narrative: 'Mapa wskazuje kierunek. Zielarka Skadi — jedyna osoba, która wie co się dzieje w lesie. Chatka leży dalej na zachód.',
        objective: 'Dotrzyj do Chatki Zielarki',
        location_id: 'wl-jot-chatka'
      }
    ],
    rewards: { points: 12, xp: 35, skirniry: 6 }
  },

  {
    id: 'jot-q3-zielarka',
    version: 1,
    title: 'Zadanie Zielarki Skadi',
    description: 'Skadi wie o Kręgu. Prosi o trzy składniki — ale podaje tylko połowę wskazówek.',
    category: 'NPC & Zlecenia',
    difficulty: 'Łatwy',
    location_id: 'wl-jot-chatka',
    chain_id: 'jot-main',
    order_index: 3,
    requirements: { type: 'quest_completed', id: 'jot-q2-slady' },
    stages: [
      {
        index: 0,
        type: 'dialogue',
        title: 'Skadi zna odpowiedź',
        narrative: 'Stara kobieta miesza coś w garnku. Nie podnosi głowy.\n\n*„Kamienny Krąg. Ktoś aktywował go tej nocy. Czuję to w ziołach — smakują inaczej, gdy krąg jest aktywny."*\n\n*„Zanim tam pójdziesz, przynieś mi trzy rzeczy. Mech z kamiennych bloków. Pióro białego ptaka. I coś, czego nie ma w lesie w dzień."*',
        objective: 'Przyjmij zlecenie Skadi',
        actions: [
          { id: 'przyjmij', label: 'Przyjmij zlecenie' },
          { id: 'negocjuj', label: 'Zapytaj po co jej te składniki' },
          { id: 'pytaj_krag', label: 'Zapytaj najpierw o Kamienny Krąg' }
        ]
      },
      {
        index: 1,
        type: 'choice',
        title: 'Zbieranie składników — mech i pióro',
        narrative: 'W lesie znajdziesz dwa pierwsze składniki. Mech powinien być przy starych głazach. Biały ptak — jeśli jest — gniazduje przy strumieniu.\n\nGdzieś tam jest też coś, czego nie ma w lesie w dzień.',
        objective: 'Zbierz mech i białe pióro',
        actions: [
          { id: 'mech_pioro', label: 'Zbierz mech z głazów, potem szukaj gniazda', score: 3 },
          { id: 'tylko_mech', label: 'Zbierz mech, zapomnij o piórze', score: 1 },
          { id: 'tylko_pioro', label: 'Szukaj białego ptaka, wrócisz po mech', score: 1 }
        ]
      },
      {
        index: 2,
        type: 'choice',
        title: 'Trzeci składnik — nocna wyprawa',
        narrative: '„Coś, czego nie ma w lesie w dzień" — Skadi dała tylko tę podpowiedź. Las w nocy jest innym miejscem niż w dzień.',
        objective: 'Zdobądź trzeci składnik',
        actions: [
          { id: 'noc_powrot', label: 'Wróć do lasu nocą i czekaj', score: 3 },
          { id: 'pytaj_skadi', label: 'Zapytaj Skadi o dokładniejszą wskazówkę', score: 2 },
          { id: 'zgaduj', label: 'Zgadnij i przynieś cokolwiek', score: 0 }
        ]
      },
      {
        index: 3,
        type: 'dialogue',
        title: 'Oddanie składników',
        narrative: 'Skadi bierze składniki jeden po jednym. Wącha. Kiwa głową.\n\n*„Dobrze. Rzadko ktoś wraca z całą listą."*\n\nMiesza coś przez chwilę. Podaje ci butelkę z zielonym płynem.\n\n*„Krąg. Idź tam. Ale jeśli coś wychodzi z ziemi — stój nieruchomo. Ono szuka tych, którzy uciekają."*',
        objective: 'Oddaj składniki Skadi',
        actions: [
          { id: 'oddaj', label: 'Oddaj wszystkie składniki' },
          { id: 'pytaj_ostatnio', label: 'Najpierw zapytaj co grozi w Kręgu' }
        ]
      }
    ],
    rewards: { points: 20, xp: 60, skirniry: 15, item: 'Mikstura Spokoju Lasu' }
  },

  {
    id: 'jot-q3b-runa',
    version: 1,
    title: 'Interpretacja Runy',
    description: 'Skadi prosi o coś więcej niż składniki — chce wiedzieć co widzisz w losowanej runie. Twoja interpretacja zdecyduje czy zaufać ci przy Kręgu.',
    category: 'Narracja & RP',
    difficulty: 'Średni',
    location_id: 'wl-jot-chatka',
    chain_id: 'jot-main',
    order_index: 35,
    requirements: { type: 'quest_completed', id: 'jot-q3-zielarka' },
    stages: [
      {
        index: 0,
        type: 'dialogue',
        title: 'Skadi żąda próby',
        narrative: 'Zanim oddasz składniki, Skadi zatrzymuje cię gestem.\n\n*„Jeszcze jedno. Wyciągnij runę."*\n\nWskazuje na wachlarz kamieni na stole — każdy wyryty innym znakiem. Zamykasz oczy i bierzesz jeden na ślepo.',
        objective: 'Wysłuchaj Skadi',
        actions: [
          { id: 'los', label: 'Wyciągnij runę na ślepo' }
        ]
      },
      {
        index: 1,
        type: 'narrative',
        title: 'Interpretacja wylosowanej runy',
        narrative: '*Trzymasz kamień. Obrócisz go niczym kartkę w książce.*\n\nSkadi obserwuje cię w milczeniu. To nie jest test wiedzy — to próba intuicji i wrażliwości magicznej.\n\n> *„Powiedz mi co widzisz. Nie co POWINIENEŚ widzieć — co WIDZISZ."*',
        prompt: 'Opisz co twoja postać czuje, widzi lub interpretuje w wylosowanej runie. Minimum 3 zdania. Pisz w klimacie TMD — pierwszoosobowo lub jako narracja postaci.',
        objective: 'Zinterpretuj runę — napisz swoją odpowiedź na Discordzie',
        actions: [
          { id: 'odpowiedz', label: 'Napisz interpretację na Discordzie' }
        ]
      }
    ],
    rewards: { points: 25, xp: 70, skirniry: 20 }
  },

  {
    id: 'jot-q4-krag',
    version: 1,
    title: 'To, co obudzono',
    description: 'Finał łańcucha. Kamienny Krąg jest aktywny. Strażnik Kręgu budzi się z uśpienia — ktoś naruszył równowagę. Musisz wybrać jak stanąć twarzą do czegoś, co istnieje od tysiąca lat.',
    category: 'Quest Chain — Jötunskóg',
    difficulty: 'Średni',
    location_id: 'wl-jot-krag',
    chain_id: 'jot-main',
    order_index: 4,
    requirements: { type: 'quest_completed', id: 'jot-q3-zielarka' },
    stages: [
      {
        index: 0,
        type: 'dialogue',
        title: 'Kamienny Krąg',
        narrative: 'Siedem kamieni w idealnym okręgu. Runy świecą. Powietrze drży — nie od wiatru, ale od czegoś pod ziemią.\n\nJeden kamień jest pęknięty w połowie. Nowe pęknięcie — świeże.\n\n*Ktoś tu był i coś zrobił.*',
        objective: 'Zbadaj Kamienny Krąg',
        actions: [
          { id: 'obserwuj', label: 'Obserwuj w milczeniu' },
          { id: 'dotknij', label: 'Dotknij pękniętego kamienia' },
          { id: 'odczytaj', label: 'Odczytaj runy' }
        ]
      },
      {
        index: 1,
        type: 'choice',
        title: 'Strażnik Kręgu',
        narrative: 'Coś wynurza się z ziemi między kamieniami. Nie jest złe — jest stare. Patrzy na ciebie.\n\n*„Kto cię tu wysłał?"*\n\nSkadi dała ci miksturę. Björnar przestrzegał. Ty tu stoisz.',
        objective: 'Stań twarzą do Strażnika Kręgu',
        actions: [
          { id: 'formula', label: 'Recytuj Formułę Uśpienia z notatnika', score: 3 },
          { id: 'kontakt', label: 'Spróbuj nawiązać spokojny kontakt', score: 2 },
          { id: 'konfrontacja', label: 'Stań do konfrontacji', score: 1 }
        ]
      }
    ],
    rewards: { points: 50, xp: 150, skirniry: 40, item: 'Fragment Inskrypcji Leśnej' },
    on_complete_unlock: [
      {
        type: 'location',
        id: 'wl-hidden-ogrod',
        action: 'reveal'
      }
    ]
  }

];
