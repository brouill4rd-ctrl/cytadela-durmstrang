// ============================================================
// OFERTA EDUKACYJNA CYTADELI DURMSTRANG
// Klasa I  — Fundamenty Magii (14 przedmiotów)
// Klasa II — Magia Zaawansowana (9 przedmiotów, 2 wspólne z I kl.)
// ============================================================

export const SUBJECTS = [

  // ==================== KLASA I — FUNDAMENTY MAGII ====================

  {
    id: 'czarna-magia',
    name: 'Czarna Magia',
    code: 'DARK-101',
    professor: 'Prof. Morana Vane',
    professorName: 'Prof. Morana Vane',
    house: 'kruk',
    icon: '💀',
    category: 'Sztuki Zakazane',
    classYear: [1, 2],
    yearLabel: 'Klasa I & II',
    description: 'Zaawansowane studium pradawnych energii mroku, pętania cieni, klątw rodowych oraz kontrolowanego użycia sił pierwotnych.',
    classroom: 'Krypta Szeptów (Poziom -3)',
    syllabus: 'Rozpoznawanie aury mrocznych zaklęć, struktura rytuałów nekromantycznych, etyka i granice przekraczania zasłony.',
    lessons: [
      {
        id: 'cm-1',
        title: 'Lekcja I: Anatomia Cienia i Bariery Krwi',
        duration: '45 min',
        difficulty: 'Średnia',
        content: `Czarna Magia w Cytadeli Durmstrang nie jest bezmyślnym niszczeniem, lecz najsurowszą dyscypliną umysłu. W przeciwieństwie do czarodziejów z południa, którzy boją się samego cienia, my badamy jego geometrię.

Pierwszym krokiem jest zrozumienie Prawa Eirika: „Każde mroczne zaklęcie pobiera opłatę z woli rzucającego. Jeśli twoja wola zachwieje się choćby na ułamek sekundy, zaklęcie pożre ciebie zamiast twojego celu."

Podczas tej lekcji zgłębiamy nakładanie Pieczęci Wstrzymującej (Sigillum Tenebris) przy użyciu sproszkowanego obsydianu i kropli własnej krwi.`,
        materials: ['Księga Cieni Eirika (rozdz. 3)', 'Obsydianowy sztylet rytualny', 'Kropla atramentu cmentarnego'],
        assignment: {
          id: 'task-cm-1',
          title: 'Esej: Granica pomiędzy ochroną a skażeniem woli przy Pieczęci Wstrzymującej',
          description: 'Wyjaśnij, w jaki sposób adept Durmstrangu utrzymuje kontrolę nad echem cienia, nie pozwalając, by wpłynęło ono na jego rdzeń magiczny.',
          maxPoints: 50,
          rewardCurrency: 35,
          rewardXp: 120
        }
      },
      {
        id: 'cm-2',
        title: 'Lekcja II: Wiązanie Cieni Północy (Skugga-Galdr)',
        duration: '60 min',
        difficulty: 'Trudna',
        content: `Cienie w okolicach koła podbiegunowego posiadają własną pamięć mrozu. Skugga-Galdr pozwala na tkanie cienia w materialne więzy zdolne unieruchomić magiczne bestie oraz wrogich czarnoksiężników.

Kluczem do powodzenia jest fonetyka staronordycka i zachowanie idealnego bezruchu oddechowego w trakcie intonacji runy ᚲ (Kaunan).`,
        materials: ['Runiczny pergamin ze skóry renifera', 'Zimna rtęć', 'Dym z szałwii arktycznej'],
        assignment: {
          id: 'task-cm-2',
          title: 'Raport z symulacji pętania cienia',
          description: 'Opisz procedurę bezpiecznego zerwania więzów cienia bez wywołania fali zwrotnej (backlashu).',
          maxPoints: 60,
          rewardCurrency: 45,
          rewardXp: 150
        }
      }
    ]
  },
  {
    id: 'biala-magia',
    name: 'Biała Magia i Rytuały Przenikania',
    code: 'WHITE-102',
    professor: 'Prof. Helga Lind',
    professorName: 'Prof. Helga Lind',
    house: 'renifer',
    icon: '🕊️',
    category: 'Magia Pierwotna',
    classYear: [1, 2],
    yearLabel: 'Klasa I & II',
    description: 'Sztuka leczenia ran magicznych, pieczętowania pęknięć aury, oczyszczania skażonych miejsc i manipulacji światłem zorzy.',
    classroom: 'Świątynia Słonecznego Kręgu',
    syllabus: 'Regeneracja tkanek po klątwach, pieczęcie uświęcenia, leczenie zatruć eliksirami bojowymi.',
    lessons: [
      {
        id: 'bm-1',
        title: 'Lekcja I: Odnawianie Przerwanych Pasemek Aury (Lækna-Galdr)',
        duration: '45 min',
        difficulty: 'Średnia',
        content: `Gdy czarodziej padnie ofiarą klątwy szarpiącej, jego aura ulega poszarpaniu. Lækna-Galdr splata przerwane pasma przy pomocy nici ze srebrnego jedwabiu tkanych przez pająki polarne.`,
        materials: ['Srebrne nici lecznicze', 'Woda źródlana z serca lodowca', 'Różdżka z drzewa jarzębiny'],
        assignment: {
          id: 'task-bm-1',
          title: 'Procedura zasklepiania rany po klątwie tnącej',
          description: 'Opisz krok po kroku nałożenie okładu leczniczego z mchu i zaklęcia scalającego tkankę eteryczną.',
          maxPoints: 50,
          rewardCurrency: 35,
          rewardXp: 115
        }
      }
    ]
  },
  {
    id: 'zaklecia',
    name: 'Zaklęcia Użytkowe i Transgresja',
    code: 'SPELL-103',
    professor: 'Prof. Olaf Sörensen',
    professorName: 'Prof. Olaf Sörensen',
    house: 'niedzwiedz',
    icon: '✨',
    category: 'Magia Praktyczna',
    classYear: [1],
    yearLabel: 'Klasa I',
    description: 'Inkantacje manipulacji grawitacją, tworzenie ścieżek świetlnych, manipulacja żywiołem lodu oraz bezpieczna transgresja w zamieci.',
    classroom: 'Korytarz Wichrów',
    syllabus: 'Zaklęcia bezsłowne, manipulacja temperaturą otoczenia, teleportacja przez szczeliny lodowe.',
    lessons: [
      {
        id: 'zk-1',
        title: 'Lekcja I: Inkantacja Wiecznego Znicza (Frost-Ljós)',
        duration: '35 min',
        difficulty: 'Podstawowa',
        content: `Frost-Ljós wytwarza błękitny, bezdymny płomień, który nie pali drewna ani skóry, lecz daje jasne światło przebijające najgęstszą arktyczną mgłę i odstraszające upiory mrozu.`,
        materials: ['Różdżka', 'Kryształ górski'],
        assignment: {
          id: 'task-zk-1',
          title: 'Praktyczny opis opanowania Frost-Ljós',
          description: 'Opisz prawidłowy ruch nadgarstka i intonację głosu przy rzucaniu Frost-Ljós w trakcie biegu.',
          maxPoints: 40,
          rewardCurrency: 25,
          rewardXp: 95
        }
      }
    ]
  },
  {
    id: 'transmutacja',
    name: 'Transmutacja i Przemiana Materii',
    code: 'TRANS-104',
    professor: 'Prof. Freja Lindqvist',
    professorName: 'Prof. Freja Lindqvist',
    house: 'wydra',
    icon: '🔮',
    category: 'Modyfikacja Materii',
    classYear: [1],
    yearLabel: 'Klasa I',
    description: 'Przekształcanie substancji nieorganicznych w broń, krystalizacja cieczy, animacja kamiennych obelisków i transmutacja organiczna.',
    classroom: 'Wieża Krystalizacji',
    syllabus: 'Zmiany stanów skupienia pod wpływem woli, kowalska transmutacja metali, animowanie golemów śnieżnych.',
    lessons: [
      {
        id: 'tr-1',
        title: 'Lekcja I: Krystalizacja Płynnego Ołowiu w Runiczne Ostrza',
        duration: '50 min',
        difficulty: 'Średnia',
        content: `Nauka natychmiastowego przekształcenia strumienia stopionego ołowiu w utwardzone ostrza rzutowe nasycone zaklęciem paraliżującym.`,
        materials: ['Sztaba czystego ołowiu', 'Rękawice z łuski bazyliszka', 'Różdżka o twardej giętkości'],
        assignment: {
          id: 'task-tr-1',
          title: 'Diagram wektorowy przemiany molekularnej',
          description: 'Przedstaw schemat dyspersji energii termicznej podczas procesu natychmiastowej krystalizacji.',
          maxPoints: 50,
          rewardCurrency: 35,
          rewardXp: 115
        }
      }
    ]
  },
  {
    id: 'eliksiry',
    name: 'Eliksiry i Toksyny',
    code: 'POT-105',
    professor: 'Prof. Astrid Vinter',
    professorName: 'Prof. Astrid Vinter',
    house: 'wydra',
    icon: '🧪',
    category: 'Alchemia & Warzenie',
    classYear: [1],
    yearLabel: 'Klasa I',
    description: 'Sztuka destylacji rzadkich esencji arktycznych, syntezy jadów lodowcowych, eliksirów transmutacyjnych i uniwersalnych odtrutek.',
    classroom: 'Laboratorium Lodowych Cieplic',
    syllabus: 'Właściwości cieczy nieliniowych, reakcje endotermiczne w kociołkach ze srebra i żelaza, warzenie Wyciągu z Zimowej Tojeści.',
    lessons: [
      {
        id: 'el-1',
        title: 'Lekcja I: Destylacja Jadu Żmii Lodowej i Ekstraktu Tojeści',
        duration: '50 min',
        difficulty: 'Średnia',
        content: `Warzenie eliksirów na dalekiej północy różni się diametralnie od tradycji śródziemnomorskiej. Woda lodowcowa z fiordów zachowuje pamięć termiczną, co wymaga podgrzewania kociołka wyłącznie płomieniem z suszonego mchu torfowego.`,
        materials: ['Kociołek ze stopu srebra i meteorytu', 'Krystaliczny jad żmii lodowej', 'Ekstrakt z arktycznej tojeści'],
        assignment: {
          id: 'task-el-1',
          title: 'Karta technologiczna: Eliksir Północnego Widzenia',
          description: 'Przedstaw dokładny ciąg technologiczny sporządzenia mikstury dającej zdolność widzenia w arktycznej zawiei śnieżnej przez 3 godziny.',
          maxPoints: 50,
          rewardCurrency: 30,
          rewardXp: 110
        }
      }
    ]
  },
  {
    id: 'zielarstwo',
    name: 'Zielarstwo Mrozoodporne',
    code: 'HERB-106',
    professor: 'Prof. Birgit Thorsen',
    professorName: 'Prof. Birgit Thorsen',
    house: 'wydra',
    icon: '🌿',
    category: 'Przyroda Magiczna',
    classYear: [1],
    yearLabel: 'Klasa I',
    description: 'Hodowla i zbieranie mchu świetlistego, lodowej mandragory, korzeni yggdrasila karłowatego i grzybów podziemnych cieplic.',
    classroom: 'Szklarnie Wiecznej Zmarzliny',
    syllabus: 'Ochrona przed zarodnikami halucynogennymi, zbiory pod pokrywą śnieżną, destylacja soków roślinnych.',
    lessons: [
      {
        id: 'zh-1',
        title: 'Lekcja I: Zbiór Płaczącego Porostu Tundrowego',
        duration: '40 min',
        difficulty: 'Podstawowa',
        content: `Porost tundrowy wytwarza krople nektaru o silnych właściwościach regenerujących tkanki po odmrożeniach magicznych. Zbiór musi odbywać się przy świetle księżyca w nowiu.`,
        materials: ['Srebrny sierp ogrodniczy', 'Buteleczki ze szkła kobaltowego', 'Futra ochronne'],
        assignment: {
          id: 'task-zh-1',
          title: 'Instrukcja zabezpieczenia zarodników porostu',
          description: 'Opisz metodę przechowywania świeżo ściętego porostu w temperaturze poniżej -15 stopni bez utraty witalności.',
          maxPoints: 40,
          rewardCurrency: 25,
          rewardXp: 90
        }
      }
    ]
  },
  {
    id: 'magizoologia',
    name: 'Magizoologia Północy',
    code: 'BEAST-107',
    professor: 'Prof. Astrid Helle',
    professorName: 'Prof. Astrid Helle',
    house: 'renifer',
    icon: '🐺',
    category: 'Przyroda Magiczna',
    classYear: [1],
    yearLabel: 'Klasa I',
    description: 'Badanie i oswajanie stworzeń arktycznych: smoków szwedzkich krótkopysych, wilków mroźnych, kelpie z fiordów i trolli górskich.',
    classroom: 'Wybiegi Skandynawskie i Zakazany Bór',
    syllabus: 'Behawiorystyka drapieżników polarnych, zbieranie rzadkich składników, anatomia smoków zimnolubnych.',
    lessons: [
      {
        id: 'mz-1',
        title: 'Lekcja I: Wilki Mroźne (Frostúlf) — Pakt Śniegu',
        duration: '45 min',
        difficulty: 'Średnia',
        content: `Wilki mroźne zamieszkujące lasy wokół Cytadeli potrafią podróżować wewnątrz kłębów śnieżnej zamieci. Jedyną drogą jest nawiązanie telepatycznego paktu szacunku.`,
        materials: ['Amulet z kła wilka polarnego', 'Surowe mięso renifera', 'Ziele spokoju'],
        assignment: {
          id: 'task-mz-1',
          title: 'Dziennik obserwacji: Ślady stada Frostúlfów',
          description: 'Zidentyfikuj na podstawie wzorów śnieżnych kierunek migracji stada i zaproponuj bezpieczny protokół zbliżenia.',
          maxPoints: 45,
          rewardCurrency: 30,
          rewardXp: 100
        }
      }
    ]
  },
  {
    id: 'obrona-przed-ciemnymi-mocami',
    name: 'Obrona Przed Ciemnymi Mocami',
    code: 'DEF-108',
    professor: 'Prof. Viktor Storm',
    professorName: 'Prof. Viktor Storm',
    house: 'niedzwiedz',
    icon: '🛡️',
    category: 'Obrona & Przetrwanie',
    classYear: [1],
    yearLabel: 'Klasa I',
    description: 'Poznawanie wroga od podszewki — neutralizacja klątw krążących we krwi, obrona przed istotami cmentarnymi i demonami mrozu.',
    classroom: 'Sala Skalistych Bastionów',
    syllabus: 'Aby pokonać mrok, musisz go rozumieć. Identyfikacja klątw, pieczęcie antymagiczne, walka z upiorami nocy polarnej.',
    lessons: [
      {
        id: 'ob-1',
        title: 'Lekcja I: Pętanie Drekavaca i Upiorów Lodowych',
        duration: '50 min',
        difficulty: 'Średnia',
        content: `Upiory lodowe rodzą się z dusz tych, którzy zamarzli w trakcie magicznych sztormów. Nie działa na nie zwykły ogień Incendio — wymagają płomienia nasyconego solą i sproszkowaną kością dębu.`,
        materials: ['Sól z Morza Barentsa', 'Drewno dębowe', 'Różdżka ze sztywnym rdzeniem'],
        assignment: {
          id: 'task-ob-1',
          title: 'Raport: Analiza słabych punktów manifestacji upiora mrozu',
          description: 'Wskaż 3 kluczowe węzły eteryczne, w które należy uderzyć zaklęciem odpychającym, aby rozproszyć formę upiora.',
          maxPoints: 50,
          rewardCurrency: 35,
          rewardXp: 120
        }
      }
    ]
  },
  {
    id: 'historia-magii',
    name: 'Historia Magii i Wojen Północy',
    code: 'HIST-109',
    professor: 'Prof. Torben Ebbesen',
    professorName: 'Prof. Torben Ebbesen',
    house: 'renifer',
    icon: '📜',
    category: 'Historia & Kroniki',
    classYear: [1],
    yearLabel: 'Klasa I',
    description: 'Wielka schizma czarodziejów z 1294 roku, powstanie Cytadeli, sojusze z klanami olbrzymów i historia czterech założycieli.',
    classroom: 'Wielkie Archiwum Skandzy',
    syllabus: 'Początki Durmstrangu, rządy Neridy Vulchanovej i Harfanga Muntera, traktaty z czarodziejami carskimi.',
    lessons: [
      {
        id: 'hm-1',
        title: 'Lekcja I: Założenie Cytadeli w Przełęczy Lodowych Wichrów',
        duration: '50 min',
        difficulty: 'Średnia',
        content: `W roku 1294 czworo mistrzów magii zebrało się w niedostępnych górach Skandynawii, by stworzyć twierdzę wolną od kompromisów i zakłamania. Odrzucili powierzchowną moralność, stawiając na dyscyplinę, honor i nieograniczone poszukiwanie prawdy.`,
        materials: ['Kronika Czerwonego Pergaminu', 'Mapa Północy z XIV wieku'],
        assignment: {
          id: 'task-hm-1',
          title: 'Esej: Dlaczego wybrano surowy klimat Skandynawii na siedzibę szkoły?',
          description: 'Przeanalizuj czynniki obronne, geomantyczne i surowcowe, które zadecydowały o lokalizacji Cytadeli.',
          maxPoints: 45,
          rewardCurrency: 30,
          rewardXp: 105
        }
      }
    ]
  },
  {
    id: 'astronomia',
    name: 'Astronomia i Zorze Polarne',
    code: 'ASTRO-110',
    professor: 'Prof. Stellan Nyström',
    professorName: 'Prof. Stellan Nyström',
    house: 'kruk',
    icon: '🌌',
    category: 'Kosmologia',
    classYear: [1],
    yearLabel: 'Klasa I',
    description: 'Obserwacja koniunkcji ciał niebieskich, pływy zórz polarnych jako nośnika energii rytualnej, badanie komet i kalendarzy solarnych.',
    classroom: 'Obserwatorium Północnej Iglicy',
    syllabus: 'Fluktuacje zórz polarnych, przewidywanie zaćmień księżycowych, rytuały przesilenia zimowego (Yule).',
    lessons: [
      {
        id: 'as-1',
        title: 'Lekcja I: Spektrum Zorzy Polarnej jako Katalizator Rytuałów',
        duration: '55 min',
        difficulty: 'Zaawansowana',
        content: `Zielona zorza wzmacnia transmutację, natomiast rzadka zorza karmazynowa potęguje zaklęcia krwi i klątwy trzykrotnie.`,
        materials: ['Mosiężne astrolabium nordyckie', 'Soczewki ze szlifowanego kwarcu dymnego', 'Gwiezdny atlas runiczny'],
        assignment: {
          id: 'task-as-1',
          title: 'Obliczenia efemeryd dla nocy przesilenia Yule',
          description: 'Oblicz optymalne okno czasowe (z dokładnością do 5 minut) dla przeprowadzenia Rytuału Nowego Ognia.',
          maxPoints: 50,
          rewardCurrency: 35,
          rewardXp: 125
        }
      }
    ]
  },
  {
    id: 'wrozbiarstwo',
    name: 'Wróżbiarstwo z Kości i Dymu',
    code: 'DIV-111',
    professor: 'Prof. Dagmar Vane',
    professorName: 'Prof. Dagmar Vane',
    house: 'kruk',
    icon: '🦴',
    category: 'Sztuki Tajemne',
    classYear: [1],
    yearLabel: 'Klasa I',
    description: 'Odczytywanie znaków z rzutów kośćmi völvy, interpretacja dymu palonych ziół arktycznych, sny prorocze i lustra lodowe.',
    classroom: 'Komnata Trzech Norn',
    syllabus: 'Rzuty kośćmi runicznymi, trance seithr, odczytywanie trajektorii kruków, interpretacja cieni.',
    lessons: [
      {
        id: 'wr-1',
        title: 'Lekcja I: Rzut Dziewięciu Kości Przeznaczenia (Völva-Kast)',
        duration: '45 min',
        difficulty: 'Średnia',
        content: `Dziewięć kości symbolizuje dziewięć światów drzewa Yggdrasil. Układ, w jakim spadną na skórę białego niedźwiedzia, zdradza nie tylko przyszłość, lecz także intencje tych, którzy knują przeciw Cytadeli.`,
        materials: ['Zestaw kości runicznych z renifera', 'Skóra niedźwiedzia polarnego', 'Kadzidło z czarnego jałowca'],
        assignment: {
          id: 'task-wr-1',
          title: 'Interpretacja układu: Trzy Kości Przesilenia',
          description: 'Zinterpretuj rzut, w którym kość Cienia leży w opozycji do kości Krwi na krawędzi kręgu.',
          maxPoints: 50,
          rewardCurrency: 35,
          rewardXp: 120
        }
      }
    ]
  },
  {
    id: 'numerologia',
    name: 'Numerologia Runiczna i Arithmancja',
    code: 'NUM-112',
    professor: 'Prof. Henrik Lind',
    professorName: 'Prof. Henrik Lind',
    house: 'kruk',
    icon: '📐',
    category: 'Nauki Ścisłe Magii',
    classYear: [1],
    yearLabel: 'Klasa I',
    description: 'Matematyczne podstawy struktury zaklęć, wagi liczb 3, 9 i 24 w mitologii nordyckiej, kalkulacja rezonansu magicznego.',
    classroom: 'Kancelaria Obliczeń Runicznych',
    syllabus: 'Harmonia dziewiątek, matryce geometryczne zaklęć obszarowych, wyliczanie przeciążeń rdzenia różdżki.',
    lessons: [
      {
        id: 'num-1',
        title: 'Lekcja I: Święta Dziewiątka i Rezonans Rytualny',
        duration: '45 min',
        difficulty: 'Zaawansowana',
        content: `Liczba 9 w Cytadeli jest fundamentem każdego wielkiego dzieła. Badamy dziś równanie rozpadu energii zaklęcia w funkcji odległości od źródła.`,
        materials: ['Liczydło mosiężne', 'Tabela logarytmów magicznych', 'Czysty pergamin'],
        assignment: {
          id: 'task-num-1',
          title: 'Kalkulacja równania rezonansu dla bariery 9-punktowej',
          description: 'Oblicz współczynnik tłumienia uderzenia dla bariery opartej na 9 monolitach granitowych.',
          maxPoints: 50,
          rewardCurrency: 35,
          rewardXp: 110
        }
      }
    ]
  },
  {
    id: 'starozytne-runy',
    name: 'Starożytne Runy Północy',
    code: 'RUNE-113',
    professor: 'Prof. Sigrid Hällström',
    professorName: 'Prof. Sigrid Hällström',
    house: 'renifer',
    icon: 'ᚱ',
    category: 'Języki i Inskrypcje',
    classYear: [1, 2],
    yearLabel: 'Klasa I & II',
    description: 'Wykrawanie, aktywacja i łączenie prastarych run Futharku Starszego. Wiązanie magii w kamieniu, kości i stali.',
    classroom: 'Komnata Wyrytych Monolitów',
    syllabus: 'Fonetyka runiczna, grawerunek krwi, sekwencje ochronne twierdz, runy zakazane.',
    lessons: [
      {
        id: 'rn-1',
        title: 'Lekcja I: Trzy Runy Pierwotne — Tiwaz, Kaunan i Raidho',
        duration: '40 min',
        difficulty: 'Podstawowa',
        content: `Runy nie są literami — są kluczami do sił natury. Runa ᛏ (Tiwaz) ogniskuje niezłomną sprawiedliwość i hart stali. Runa ᚲ (Kaunan) roznieca wewnętrzny ogień wiedzy. Runa ᚱ (Raidho) wytycza ścieżkę przez śnieżycę.`,
        materials: ['Rylec runiczny ze stali hartowanej krwią', 'Kościana płytka tundrowa', 'Olej z morsów arktycznych'],
        assignment: {
          id: 'task-rn-1',
          title: 'Transkrypcja i aktywacja: Inskrypcja Ochrony Bramy',
          description: 'Zaprojektuj triadę runiczną zabezpieczającą drzwi dormitorium przed włamaniem za pomocą zaklęć manipulacji umysłem.',
          maxPoints: 55,
          rewardCurrency: 40,
          rewardXp: 130
        }
      }
    ]
  },
  {
    id: 'latanie',
    name: 'Latanie Bojowe i Nawigacja Powietrzna',
    code: 'FLY-114',
    professor: 'Prof. Janusz Karkov',
    professorName: 'Prof. Janusz Karkov',
    house: 'niedzwiedz',
    icon: '🧹',
    category: 'Sztuka Bojowa',
    classYear: [1],
    yearLabel: 'Klasa I',
    description: 'Manewry w huraganowym wietrze, loty formacyjne, uniki przed pociskami magicznymi i nawigacja wśród szczytów fiordów.',
    classroom: 'Urwisko Jaskółek i Płyta Wiatru',
    syllabus: 'Aerodynamika mioteł wzmacnianych runami, stabilizacja przy oblodzeniu gałązek, akrobacje bojowe.',
    lessons: [
      {
        id: 'lt-1',
        title: 'Lekcja I: Nurkowanie w Szczelinę Lodowca przy Prędkości Bojowej',
        duration: '45 min',
        difficulty: 'Trudna',
        content: `Kontrola miotły w wąskim wąwozie skalnym przy wietrze dochodzącym do 120 km/h wymaga natychmiastowego wyczucia prądów termicznych i użycia zaklęcia przyczepności (Adhaesio).`,
        materials: ['Miotła Północny Grom Mk. IV', 'Gogle ze szkieł polaryzacyjnych', 'Kurtka ze skóry foki'],
        assignment: {
          id: 'task-lt-1',
          title: 'Procedura lądowania awaryjnego na lodowej półce skalnej',
          description: 'Opisz sekwencję hamowania aerodynamicznego z wykorzystaniem przeciwzaklęcia naporowego.',
          maxPoints: 45,
          rewardCurrency: 30,
          rewardXp: 100
        }
      }
    ]
  },

  // ==================== KLASA II — MAGIA ZAAWANSOWANA ====================

  {
    id: 'klatwy-i-uroki',
    name: 'Klątwy i Uroki',
    code: 'DUEL-201',
    professor: 'Prof. Gunnar Vargson',
    professorName: 'Prof. Gunnar Vargson',
    house: 'niedzwiedz',
    icon: '⚔️',
    category: 'Sztuka Bojowa',
    classYear: [2],
    yearLabel: 'Klasa II',
    description: 'Zaawansowane techniki klątw ciśnieniowych, przełamywania tarcz wroga i walki taktycznej w ekstremalnych warunkach arktycznych.',
    classroom: 'Arena Żelaznego Kręgu',
    syllabus: 'Postawy pojedynkowe Durmstrangu, zaklęcia uderzeniowe klasy wyższej, neutralizacja klątw obezwładniających, walka na lodzie i w zamieci.',
    lessons: [
      {
        id: 'ku-1',
        title: 'Lekcja I: Tarcza Pękniętego Żelaza (Skjöld-Brot)',
        duration: '60 min',
        difficulty: 'Trudna',
        content: `Klasyczne tarcze Protego czarodziejów z Londynu rozpadają się w pył pod naporem arktycznego gradu. W Durmstrangu stosujemy Skjöld-Brot — tarczę uformowaną z zagęszczonego ciśnienia powietrza nasyconego cząstkami żelaza.`,
        materials: ['Różdżka z rdzeniem z włókna serca smoka', 'Rękawica pojedynkowa z foczej skóry', 'Manekin treningowy z żelazobetonu'],
        assignment: {
          id: 'task-ku-1',
          title: 'Analiza taktyczna: Odparcie ataku wielokierunkowego',
          description: 'Opracuj schemat 3-fazowej kontrofensywy przeciwko dwóm napastnikom używającym zaklęć spowalniających.',
          maxPoints: 60,
          rewardCurrency: 50,
          rewardXp: 160
        }
      }
    ]
  },
  {
    id: 'smokologia',
    name: 'Smokologia i Drakologia Północna',
    code: 'DRAG-202',
    professor: 'Prof. Astrid Helle',
    professorName: 'Prof. Astrid Helle',
    house: 'renifer',
    icon: '🐉',
    category: 'Przyroda Magiczna',
    classYear: [2],
    yearLabel: 'Klasa II',
    description: 'Zaawansowane studium gatunków smoków zamieszkujących Skandynawię i Rosję Polarną. Tresura, komunikacja i pozyskiwanie surowców smokowych.',
    classroom: 'Smocze Urwisko Północy (Lot. 3 km od Cytadeli)',
    syllabus: 'Anatomia smoków zimnolubnych, komunikacja bezwerbalna, pozyskiwanie łusek i krwi, neutralizacja oddechu mrozu.',
    lessons: [
      {
        id: 'smok-1',
        title: 'Lekcja I: Szwedzki Krótkopyski — Anatomia Ognistego Mrozu',
        duration: '60 min',
        difficulty: 'Bardzo Trudna',
        content: `Szwedzki Krótkopyski to najgroźniejszy smok Europy Północnej. Jego tchnienie zawiera mieszaninę plazmy i kryształów lodu, które penetrują każdą tarczę magiczną skonstruowaną przed rokiem 1800.

Podczas tej lekcji badamy budowę płaszcza łuski i punkt Sigurda — jedyne miejsce, gdzie skóra smoka ma grubość poniżej 3 centymetrów.`,
        materials: ['Zestaw narzędzi smokolegów', 'Lustro z adamantu (odbijające promieniowanie termiczne)', 'Antidotum na jad polarny'],
        assignment: {
          id: 'task-smok-1',
          title: 'Mapa anatomiczna: Słabe punkty Krótkopyskiego',
          description: 'Narysuj i opisz schemat anatomiczny szwedzkiego krótkopyskiego z zaznaczeniem punktu Sigurda i węzłów eterycznych odpowiedzialnych za wytwarzanie oddechu.',
          maxPoints: 70,
          rewardCurrency: 55,
          rewardXp: 180
        }
      },
      {
        id: 'smok-2',
        title: 'Lekcja II: Nawiązanie Kontaktu — Rytuał Żelaza i Krwi',
        duration: '75 min',
        difficulty: 'Ekstremalna',
        content: `Żaden smok nie podda się zaklęciom Imperius — ma to głębsze korzenie w biologii magicznej niż w kwestii woli. Jedyną metodą uznawaną przez Cytadelę jest rytuał dobrowolnego kontaktu oparty na zasadzie wzajemności.

Adept musi ofiarować kroplę własnej krwi na specjalnym kamieniu runopodobnym. Smok, jeśli zaakceptuje przymierze, wypali na kamieniu własny znak.`,
        materials: ['Runiczny kamień ofiarny z bazaltu', 'Własna krew (5 ml)', 'Pergamin z formułą kontaktu'],
        assignment: {
          id: 'task-smok-2',
          title: 'Raport z obserwacji zachowania smoka podczas rytuału',
          description: 'Opisz fazy rytuału kontaktu, wskaż sygnały akceptacji i odrzucenia oraz procedurę bezpiecznego wycofania się w przypadku odrzucenia.',
          maxPoints: 80,
          rewardCurrency: 65,
          rewardXp: 200
        }
      }
    ]
  },
  {
    id: 'rytualistyka',
    name: 'Rytualistyka Północna',
    code: 'RITU-203',
    professor: 'Prof. Dagmar Vane',
    professorName: 'Prof. Dagmar Vane',
    house: 'kruk',
    icon: '🕯️',
    category: 'Sztuki Tajemne',
    classYear: [2],
    yearLabel: 'Klasa II',
    description: 'Konstruowanie i prowadzenie wieloosobowych rytuałów magicznych opartych na tradycji nordyckiej: blóty, seiðr i galdr w warunkach ekstremalnych.',
    classroom: 'Krąg Kamiennych Gigantów (Zewnętrzny Dziedziniec)',
    syllabus: 'Geometria kręgów rytualnych, synchronizacja woli grupy, rytuały sezonowe, przepływ mocy przez linie ley.',
    lessons: [
      {
        id: 'ritu-1',
        title: 'Lekcja I: Blót — Rytuał Przesilenia Zimowego',
        duration: '90 min',
        difficulty: 'Zaawansowana',
        content: `Blót to dawna nordycka ofiara ku czci sił przyrody i bogów. W wersji magicznej Cytadeli nie przelewamy krwi, lecz przekazujemy własną energię magiczną do kamiennych monolitów Kręgu.

Kluczem jest zsynchronizowanie oddechu wszystkich uczestników do rytmu uderzeń rytualnego bębna ze skóry niedźwiedzia polarnego.`,
        materials: ['Bęben rytualny (ze skóry niedźwiedzia)', 'Flakon z własną krwią lub potem', 'Biały płaszcz ceremonialny'],
        assignment: {
          id: 'task-ritu-1',
          title: 'Projekt kręgu rytualnego na noc Yule',
          description: 'Zaprojektuj geometrię kręgu rytualnego dla 9 uczestników podczas przesilenia zimowego. Uwzględnij pozycje run, kierunki świętych stron świata i algorytm przekazywania energii.',
          maxPoints: 75,
          rewardCurrency: 60,
          rewardXp: 190
        }
      }
    ]
  },
  {
    id: 'psychologia-magiczna',
    name: 'Psychologia Magiczna',
    code: 'PSY-204',
    professor: 'Prof. Morana Vane',
    professorName: 'Prof. Morana Vane',
    house: 'ravnheim',
    icon: '🧠',
    category: 'Nauki Ścisłe Magii',
    classYear: [2],
    yearLabel: 'Klasa II',
    description: 'Mechanizmy wpływu zaklęć na psychikę — obrona przed Legillimensją, kontrola własnego umysłu, rozpoznawanie manipulacji i budowanie mentalnych fortec.',
    classroom: 'Sala Luster Poznania (Wieża Wschodnia, poziom 5)',
    syllabus: 'Legilimencja i Oklumencja, psychologia oporu wobec klątw mentalnych, techniki medytacyjne Durmstrangu, mentalny monitoring aury.',
    lessons: [
      {
        id: 'psy-1',
        title: 'Lekcja I: Forteca Umysłu — Podstawy Oklumencji',
        duration: '55 min',
        difficulty: 'Trudna',
        content: `Oklumencja to sztuka uszczelniania umysłu przed zewnętrzną penetracją magiczną. W Cytadeli stosujemy metodę Lodowej Twierdzy — wizualizację umysłu jako skalistej cytadeli pośrodku arktycznej tundry.

Każda myśl chroniona ma być zamknięta w osobnej komorze z runami blokującymi. Dostęp do komory otwiera wyłącznie odpowiedni runiczna sekwencja myślowa.`,
        materials: ['Lustro refleksyjne (do obserwacji własnej aury)', 'Kryształ kwarcowy (jako kotwica skupienia)', 'Dziennik medytacyjny'],
        assignment: {
          id: 'task-psy-1',
          title: 'Projekt architektury mentalnej: Moja Forteca',
          description: 'Opisz szczegółowo strukturę swojej osobistej oklumentalnej Fortecy Umysłu: bramę wejściową, komnaty chronione, systemy alarmowe i pułapki dla intruzów.',
          maxPoints: 65,
          rewardCurrency: 50,
          rewardXp: 170
        }
      }
    ]
  },
  {
    id: 'trucizny',
    name: 'Trucizny i Kontrtoksyny',
    code: 'TOX-205',
    professor: 'Prof. Astrid Vinter',
    professorName: 'Prof. Astrid Vinter',
    house: 'wydra',
    icon: '☠️',
    category: 'Alchemia & Warzenie',
    classYear: [2],
    yearLabel: 'Klasa II',
    description: 'Zaawansowana synteza jadów magicznych, trucizn kontaktowych i lotnych, a także opracowywanie odtrutek i neutralizatorów toksyn.',
    classroom: 'Laboratorium Czerwonego Dymu (Skrzydło Zachodnie, izolowane)',
    syllabus: 'Klasyfikacja jadów i toksyn magicznych, mechanizmy działania na magiczną i niemagiczną tkankę, synteza antidotów, prawo Cytadeli o stosowaniu trucizn.',
    lessons: [
      {
        id: 'tox-1',
        title: 'Lekcja I: Jad Północnego Bazyliszka — Właściwości i Kontrola',
        duration: '65 min',
        difficulty: 'Bardzo Trudna',
        content: `Jad bazyliszka polarnego różni się od swojego europejskiego odpowiednika: zamiast kamienić, powoduje stopniowe zamrażanie od wewnątrz, zaczynając od rdzenia magicznego.

Produkt końcowy — Lód Duszy — jest jednym z najcenniejszych i najniebezpieczniejszych składników znanych alchemii Północy.`,
        materials: ['Kombinezon ochronny klasy Gamma', 'Specjalne pojemniki kriogeniczne', 'Flakon z antidotum gorącego słońca'],
        assignment: {
          id: 'task-tox-1',
          title: 'Protokół syntezy odtrutki na jad bazyliszka',
          description: 'Opracuj pełną procedurę tworzenia antidotum na jad bazyliszka polarnego, uwzględniając wszystkie kroki i środki ostrożności dla osoby zatruwającej się.',
          maxPoints: 80,
          rewardCurrency: 65,
          rewardXp: 195
        }
      }
    ]
  },
  {
    id: 'mity-polnocy',
    name: 'Mity i Legendy Północy',
    code: 'MYTH-206',
    professor: 'Prof. Torben Ebbesen',
    professorName: 'Prof. Torben Ebbesen',
    house: 'renifer',
    icon: '📖',
    category: 'Historia & Kroniki',
    classYear: [2],
    yearLabel: 'Klasa II',
    description: 'Analiza nordyckiej mitologii jako realnego zapisu historii magicznej — od wojen Asów z Wanami po Ragnarök i proroctwa Völvy.',
    classroom: 'Wielkie Archiwum Skandzy — Sala Sag',
    syllabus: 'Eddypoezja jako źródło historyczne, rzeczywiste istoty za mitycznymi nazwami, mapa magicznego świata Yggdrasilu, proroctwa i ich interpretacja.',
    lessons: [
      {
        id: 'myth-1',
        title: 'Lekcja I: Yggdrasil — Kosmologiczna Mapa Magicznych Wymiarów',
        duration: '50 min',
        difficulty: 'Średnia',
        content: `Yggdrasil nie jest drzewem w dosłownym sensie — jest modelem topologicznym dziewięciu wymiarów dostępnych dla magii nordyckiej. Midgard to świat materialny, Asgard — sfera najwyższej magii, Niflheim — kraina martwego eteru.

Każda gałąź Yggdrasilu odpowiada kanałowi energetycznemu, przez który przepływa mana rytualna podczas wielkich zaklęć.`,
        materials: ['Atlas Dziewięciu Światów (wyd. Cytadeli 1987)', 'Szkice geometryczne struktury Yggdrasilu', 'Kryształ eteryczny'],
        assignment: {
          id: 'task-myth-1',
          title: 'Esej: Które stworzenia z nordyckiej mitologii są realnie udokumentowane przez Cytadelę?',
          description: 'Przeanalizuj archiwalne zapisy Cytadeli i wskaż minimum 5 istot mitycznych, które zostały potwierdzone jako realne byty magiczne, wraz z dowodem i lokalizacją.',
          maxPoints: 55,
          rewardCurrency: 40,
          rewardXp: 140
        }
      }
    ]
  },
  {
    id: 'stworzenia-nocy',
    name: 'Stworzenia Nocy',
    code: 'NIGHT-207',
    professor: 'Prof. Viktor Storm',
    professorName: 'Prof. Viktor Storm',
    house: 'niedzwiedz',
    icon: '🦇',
    category: 'Przyroda Magiczna',
    classYear: [2],
    yearLabel: 'Klasa II',
    description: 'Istoty manifestujące się wyłącznie nocą lub podczas nocy polarnej: wampiry lodowe, upiory cieni, Draugr i demony arktycznej ciemności.',
    classroom: 'Podziemna Sala Cienia (Poziom -2, dostępna tylko po zmroku)',
    syllabus: 'Klasyfikacja nocnych bytów magicznych, metody detekcji, identyfikacja śladów, protokoły obrony i neutralizacji.',
    lessons: [
      {
        id: 'night-1',
        title: 'Lekcja I: Draugr — Powracający Umarli Północy',
        duration: '55 min',
        difficulty: 'Trudna',
        content: `Draugr to nie jest zwykły upiór — to magicznie ożywiona powłoka dawnego wojownika, zachowująca część wspomnień i cały gniew pierwotnego właściciela. Zamieszkują stare kurhany i opuszczone forty.

Kluczowa różnica między Draugr a zwykłym upiorem: Draugr ma fizyczną masę i może zadawać ciosy fizyczne, nie tylko eteryczne. Tradycyjny ogień go nie niszczy — potrzeba runicznych klamer i soli morskiej.`,
        materials: ['Latarnia z solnym płomieniem', 'Runiczna klamra wiązania', 'Przyrząd do mierzenia eterycznej gęstości'],
        assignment: {
          id: 'task-night-1',
          title: 'Protokół identyfikacji i neutralizacji Draugr',
          description: 'Opisz pełną procedurę: identyfikację śladu Draugr, przygotowanie terenu walki, wykonanie rytuału wiązania oraz bezpieczne zapieczętowanie kurhanu po neutralizacji.',
          maxPoints: 70,
          rewardCurrency: 55,
          rewardXp: 180
        }
      }
    ]
  }
];

// Pomocnicze filtry do użycia w komponentach

// Pomocnicze filtry do uzycia w komponentach
export const YEAR_1_SUBJECTS = SUBJECTS.filter(s => Array.isArray(s.classYear) ? s.classYear.includes(1) : s.classYear === 1);
export const YEAR_2_SUBJECTS = SUBJECTS.filter(s => Array.isArray(s.classYear) ? s.classYear.includes(2) : s.classYear === 2);