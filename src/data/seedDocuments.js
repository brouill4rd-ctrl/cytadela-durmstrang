/**
 * seedDocuments.js
 * Oficjalna Księga Dokumentów, Dekretów, Kodeksów i Zabaw Twierdzy Magii Durmstrang (TMD)
 */

export const INITIAL_DOCUMENTS = [
  // =========================================================================
  // 1. DEKRETY DYREKCJI (EDYKTY I ZARZĄDZENIA)
  // =========================================================================
  {
    id: 'decree-1',
    slug: 'dekret-zakaz-magii-cienia-dormitoria',
    category: 'dekrety',
    categoryLabel: 'Dekret Dyrekcji',
    number: 'I/XIX',
    title: 'Dekret nr I/XIX: O Bezwzględnym Zakazie Rzucania Klątw Cienia w Dormitoriach',
    subtitle: 'Rozporządzenie w sprawie bezpieczeństwa strefy mieszkalnej adeptów',
    author: 'Najwyższa Rada Mistrzów & Dyrekcja TMD',
    authorRole: 'Arcymistrz Dyrekcji',
    date: '1 września XIX Roku Szkolnego',
    sealType: 'gold',
    iconName: 'ShieldAlert',
    severity: 'wysoki',
    summary: 'Zakaz praktykowania niewerbalnych uroków niszczących oraz ewokacji cieni poza zabezpieczonymi salami ćwiczebnymi i Poligonem Runicznym.',
    content: [
      {
        type: 'callout',
        variant: 'danger',
        title: 'MOC PRAWNA I WYMOGI BEZPIECZEŃSTWA',
        text: 'Na mocy decyzji Arcymistrza Dyrekcji z dniem 1 września XIX Roku Szkolnego wprowadza się bezwzględny rygor ochronny w skrzydłach mieszkalnych wszystkich czterech Zakonów.'
      },
      {
        type: 'heading',
        text: '§ 1. Zakres Obostrzenia'
      },
      {
        type: 'paragraph',
        text: '1. Zabrania się wszelkich prób rzucania uroków z zakresu Magii Cienia, Klątw Tkankowych, Nekromancji Użytkowej oraz manipulacji temperaturą poniżej -30°C w obrębie Komnat Wspólnych oraz sypialni Zakonów Reinhall, Björnhall, Ravnheim oraz Otergard.'
      },
      {
        type: 'paragraph',
        text: '2. Wszelkie eksperymenty runiczne i transmutacje żywiołów wolno przeprowadzać wyłącznie w Warsztacie Runicznym (Galdrastofa), Laboratoriach Katedry Alchemii lub w obecności uprawnionego Profesora.'
      },
      {
        type: 'heading',
        text: '§ 2. Sankcje Dyscyplinarne'
      },
      {
        type: 'list',
        items: [
          'Pierwsze naruszenie: Utrata 50 punktów dla macierzystego Zakonu oraz tydzień aresztu w Skalnym Bastionie.',
          'Drugie naruszenie: Konfiskata różdżki i artefaktów na okres 14 dni oraz chłosta runiczna pod okiem Prefekta.',
          'Trzecie naruszenie: Natychmiastowe postawienie przed Trybunałem Krwi i wydalenie z Cytadeli.'
        ]
      },
      {
        type: 'quote',
        text: '„Dyscyplina jest tarczą, która chroni adepta przed własną potęgą.” — Kancelaria Dyrekcji TMD'
      }
    ],
    tags: ['dekrety', 'bezpieczeństwo', 'zakazy', 'dormitoria', 'kary']
  },
  {
    id: 'decree-2',
    slug: 'dekret-godzina-policyjna-zamiec',
    category: 'dekrety',
    categoryLabel: 'Dekret Dyrekcji',
    number: 'II/XIX',
    title: 'Dekret nr II/XIX: O Procedurach Alarmowych w Czasie Polarnej Zamieci Runicznej',
    subtitle: 'Wytyczne postępowania w czasie aktywności zórz arktycznych i zjawisk anomalnych',
    author: 'Katedra Astromancji & Dyrekcja TMD',
    authorRole: 'Mistrz Straży Cytadeli',
    date: '15 września XIX Roku Szkolnego',
    sealType: 'ruby',
    iconName: 'CloudSnow',
    severity: 'średni',
    summary: 'Zasady opuszczania murów twierdzy, rygor godziny policyjnej po uderzeniu dzwonu o północy oraz używanie run ochronnych.',
    content: [
      {
        type: 'callout',
        variant: 'warning',
        title: 'ALARM ARKTYCZNY STOPNIA III',
        text: 'W przypadku rozbłysku karmazynowej zorzy polarnej i uderzenia Wichru Cieni, brama główna Kaupangr zostaje opuszczona, a most zwodzony zablokowany pieczęcią Tiwaz.'
      },
      {
        type: 'heading',
        text: '§ 1. Godzina Policyjna i Przepustki'
      },
      {
        type: 'paragraph',
        text: 'Od godziny 22:00 do 06:00 rano przebywanie na dziedzińcach zewnętrznych, w Przystani Drakkarów oraz w okolicach Lasu Szepczących Sosen wymaga pisemnej przepustki wystawionej przez Opiekuna Zakonu lub Arcymistrza.'
      },
      {
        type: 'list',
        items: [
          'Uczniowie Klasy I mają bezwzględny zakaz opuszczania wież po zmroku.',
          'Patrole Prefektów posiadają uprawnienie do używania zaklęć obezwładniających wobec każdego nieoznakowanego adepta.',
          'Wszelkie runy grzewcze w korytarzach muszą być zasilane wyłącznie esencją zatwierdzoną przez Katedrę Żywiołów.'
        ]
      }
    ],
    tags: ['dekrety', 'zamieć', 'godzina-policyjna', 'bezpieczeństwo']
  },
  {
    id: 'decree-3',
    slug: 'dekret-dzienniki-i-pergaminy-discord',
    category: 'dekrety',
    categoryLabel: 'Dekret Dyrekcji',
    number: 'III/XIX',
    title: 'Dekret nr III/XIX: O Ewidencji Zajęć, Dziennikach i Transkrypcjach z Discorda',
    subtitle: 'Jednolity standard dokumentacji procesu dydaktycznego i rozliczania punktów',
    author: 'Rada Katedr Magicznych TMD',
    authorRole: 'Sekretarz Generalny Cytadeli',
    date: '20 września XIX Roku Szkolnego',
    sealType: 'gold',
    iconName: 'BookOpen',
    severity: 'standard',
    summary: 'Obowiązek wprowadzania transkrypcji lekcyjnych do Dziennika w ciągu 48 godzin od zakończenia zajęć na serwerze Discord.',
    content: [
      {
        type: 'paragraph',
        text: 'W celu zapewnienia pełnej transparentności zmagań o Puchar Północy, każdy Profesor zobowiązany jest do publikacji wpisu w Dzienniku Lekcyjnym portalu www natychmiast po przeprowadzeniu wykładu na serwerze Discord.'
      },
      {
        type: 'list',
        items: [
          'Wpis musi zawierać: temat, datę, frekwencję, taryfikator przyznanych punktów oraz transkrypcję najistotniejszych zaklęć.',
          'Uczniowie mają prawo do złożenia odwołania od oceny w terminie 3 dni roboczych za pośrednictwem Poczty Kruków do Dziekana Katedry.',
          'Zadania domowe oddawane po wyznaczonym terminie podlegają automatycznej redukcji oceny o jeden stopień.'
        ]
      }
    ],
    tags: ['dekrety', 'dzienniki', 'discord', 'edukacja', 'oceny']
  },

  // =========================================================================
  // 2. REGULAMIN SERWERA DISCORD (DC)
  // =========================================================================
  {
    id: 'rules-dc',
    slug: 'regulamin-serwera-discord',
    category: 'regulamin-dc',
    categoryLabel: 'Regulamin Serwera Discord',
    number: 'REG-DC/XIX',
    title: 'Oficjalny Regulamin Społeczności i Serwera Discord (DC)',
    subtitle: 'Nienaruszalne zasady komunikacji, etykiety i ról na oficjalnym serwerze Cytadeli',
    author: 'Administracja & Moderatorzy Serwera Discord TMD',
    authorRole: 'Naczelny Strażnik Sieci Runicznej',
    date: 'Aktualizacja: XIX Rok Szkolny',
    sealType: 'blue',
    iconName: 'MessageSquare',
    severity: 'wysoki',
    summary: 'Kompleksowy regulamin kanałów tekstowych, głosowych, sesji fabularnych RP, kultury wypowiedzi oraz taryfikator ostrzeżeń na Discordzie.',
    content: [
      {
        type: 'callout',
        variant: 'info',
        title: 'SYNCHRONIZACJA Z PORTALEM WWW',
        text: 'Twój profil i ranga na serwerze Discord odpowiadają Twojej przynależności do Zakonu oraz funkcji w Twierdzy Magii Durmstrang (TMD). Zachowaj godność adepta Północy na każdym kanale.'
      },
      {
        type: 'heading',
        text: 'Rozdział I. Postanowienia Ogólne i Kultura Słowa'
      },
      {
        type: 'list',
        items: [
          '1. Szacunek i kultura: Bezwzględny zakaz mowy nienawiści, nękania, wulgaryzmów o charakterze obraźliwym oraz prowokowania toksycznych sporów poza wyznaczonymi kanałami fabularnymi RP.',
          '2. Tożsamość i Nick: Na serwerze należy ustawić pseudonim zgodny z Imieniem i Nazwiskiem Twojej postaci ze strony WWW (np. „Magnus Blom [Reinhall]”).',
          '3. Zakaz Spamu i Floodu: Zabrania się nadmiernego oznaczania (@everyone, @here, administracji bez wyraźnej potrzeby), wysyłania łańcuszków oraz reklamowania obcych serwerów bez zgody Dyrekcji.',
          '4. Treści Niedozwolone: Bezwzględny zakaz publikowania materiałów NSFW, treści drastycznych lub niezgodnych z prawem.'
        ]
      },
      {
        type: 'heading',
        text: 'Rozdział II. Kanały Lekcyjne i Komnaty Wykładowe'
      },
      {
        type: 'list',
        items: [
          '1. Cisza podczas wykładu: Na kanałach lekcyjnych prawo głosu posiada Profesor prowadzący. Adept zabiera głos po uprzednim zgłoszeniu się odpowiednią komendą lub reakcją.',
          '2. Format wypowiedzi RP: Wypowiedzi fabularne różdżkowe należy formatować w sposób czytelny (np. kursywa dla narracji, gwiazdki dla gestów, proste pismo dla dialogu).',
          '3. Zakłócanie lekcji: Każde celowe przeszkadzanie w zajęciach skutkuje natychmiastowym wyciszeniem (Mute), utratą punktów dla Zakonu oraz notą w Dzienniku.'
        ]
      },
      {
        type: 'heading',
        text: 'Rozdział III. Kanały Głosowe (Wielkie Sale & Wieże)'
      },
      {
        type: 'list',
        items: [
          '1. Jakość dźwięku: Wymagane jest używanie funkcji Push-to-Talk lub właściwie skonfigurowanej bramki szumów.',
          '2. Zakaz soundboardów: Używanie modulatorów głosu, przesterów oraz puszczanie muzyki poza botem radiowym na wyznaczonych kanałach jest zabronione.',
          '3. Nagrywanie rozmów: Nagrywanie innych użytkowników bez ich wiedzy i zgody skutkuje natychmiastowym banem.'
        ]
      },
      {
        type: 'heading',
        text: 'Rozdział IV. Taryfikator Kar i Procedury Odwoławcze'
      },
      {
        type: 'list',
        items: [
          'Upomnienie słowne (Warn I) — ostrzeżenie od Moderatora / Prefekta.',
          'Czasowe wyciszenie (Mute 1h - 24h) — za spam, wulgaryzmy lub utrudnianie lekcji.',
          'Tymczasowe zawieszenie (Temp-Ban 7 dni) — powtarzające się łamanie regulaminu.',
          'Permanentne wykluczenie (Perm-Ban) — zdrada tajemnic Cytadeli, rażący brak szacunku, toksyczność.'
        ]
      }
    ],
    tags: ['regulamin', 'discord', 'dc', 'społeczność', 'zasady', 'moderacja']
  },

  // =========================================================================
  // 3. STATUT TWIERDZY DURMSTRANG (KODEKS PRAW SZKOŁY)
  // =========================================================================
  {
    id: 'statute-main',
    slug: 'statut-twierdzy-magii-durmstrang',
    category: 'statut',
    categoryLabel: 'Statut Instytutu',
    number: 'STATUT/1294-XIX',
    title: 'Statut Instytutu Twierdzy Magii Durmstrang (TMD)',
    subtitle: 'Naczelny akt ustrojowy określający misję, prawa, obowiązki i strukturę Katedr Północy',
    author: 'Zgromadzenie Założycieli & Arcymistrz Dyrekcji',
    authorRole: 'Najwyższa Rada Powiernicza',
    date: 'Uchwalony w Roku Pańskim 1294 • Zrewidowany na XIX Rok Szkolny',
    sealType: 'gold',
    iconName: 'Scale',
    severity: 'najwyższy',
    summary: 'Konstytucja i fundament prawny Twierdzy Magii: ustrój szkoły, autonomia Czterech Zakonów, prawa adeptów, status Czarnej Magii oraz Trybunał Honorowy.',
    content: [
      {
        type: 'callout',
        variant: 'gold',
        title: 'PREAMBUŁA STATUTOWA',
        text: 'My, Mistrzowie Prastarej Północy, złączeni Paktem Krwi pod mroźnym niebem Skandynawii, ustanawiamy niniejszy Statut, by strzegł wolności dociekań magicznych, czystości wiedzy przedwczesnej oraz braterstwa Czterech Zakonów po wieczne czasy.'
      },
      {
        type: 'heading',
        text: 'Dział I. Charakter i Misja Instytutu'
      },
      {
        type: 'paragraph',
        text: '1. Twierdza Magii Durmstrang (TMD) jest elitarną, niezależną instytucją szkolnictwa wyższego i średniego w dziedzinie sztuk magicznych, tradycji runicznej, alchemii arktycznej oraz sztuk wojennych i obronnych.'
      },
      {
        type: 'paragraph',
        text: '2. W odróżnieniu od akademii południowych, Instytut nie cenzuruje prastarych dziedzin wiedzy, w tym Ciemnych Mocy, Magii Krwi i Rytuałów Cienia, wychodząc z założenia, że jedynie pełne zrozumienie natury sił pierwotnych gwarantuje mistrzostwo i odporność na zepsucie.'
      },
      {
        type: 'heading',
        text: 'Dział II. Prawa i Przywileje Adepta'
      },
      {
        type: 'list',
        items: [
          'Prawo do swobodnego zgłębiania 21 Katedr Naukowych zgodnie z poziomem zaawansowania.',
          'Prawo do godnego traktowania przez kadrę pedagogiczną oraz równego dostępu do zasobów Biblioteki i Warsztatu Runicznego.',
          'Prawo do posiadania konta w Banku Skirnirów oraz handlu na Rynku Kaupangr.',
          'Prawo do odwołania się od decyzji dyscyplinarnej do Wielkiego Trybunału Honorowego.'
        ]
      },
      {
        type: 'heading',
        text: 'Dział III. Obowiązki i Wymogi Dyscypliny'
      },
      {
        type: 'list',
        items: [
          'Bezwzględna ochrona tajemnicy położenia Cytadeli przed światem zewnętrznym.',
          'Aktywny udział w zajęciach, turniejach i zmaganiach o Puchar Północy.',
          'Lojalność wobec własnego Zakonu i braci zakonnych.',
          'Noszenie oficjalnych szat i barw zakonnych podczas ceremonii i wykładów.'
        ]
      },
      {
        type: 'heading',
        text: 'Dział IV. Wielki Trybunał Honorowy'
      },
      {
        type: 'paragraph',
        text: 'Spory o najwyższym ciężarze gatunkowym, oskarżenia o zdradę stanu lub kradzież relikwii zakonnych rozpatruje Wielki Trybunał złożony z Arcymistrza, czterech Opiekunów Zakonów oraz Naczelnego Sędziego Hólmgangi. Wyroki Trybunału są ostateczne i nie podlegają kasacji.'
      }
    ],
    tags: ['statut', 'prawo', 'konstytucja', 'prawa-ucznia', 'ustrój']
  },

  // =========================================================================
  // 1b. WIZYTACJE NAUCZYCIELI (HOSPITACJE, PROTOKOŁY I OCENA KATEDR)
  // =========================================================================
  {
    id: 'inspection-1',
    slug: 'wizytacja-katedra-czarnej-magii-vane',
    category: 'wizytacje',
    categoryLabel: 'Wizytacja Nauczycielska',
    number: 'WIZ-01/XIX',
    title: 'Protokół Wizytacji: Katedra Czarnej Magii i Nekromancji',
    subtitle: 'Ocena merytoryczna i bezpieczeństwa zajęć prof. Morany Vane',
    author: 'Komisja Nadzoru Pedagogicznego TMD',
    authorRole: 'Wizytator Dyrekcji ds. Katedr Mrocznych',
    date: '28 września XIX Roku Szkolnego',
    sealType: 'gold',
    iconName: 'ClipboardCheck',
    severity: 'standard',
    summary: 'Oficjalny protokół powizytacyjny zajęć z Wiązania Cieni i Kontroli Ektoplazmy. Ocena ogólna: Wzorowa.',
    content: [
      {
        type: 'callout',
        variant: 'info',
        title: 'CEL HOSPITACJI DYDAKTYCZNEJ',
        text: 'Weryfikacja przestrzegania procedur bezpieczeństwa podczas rzucania zaklęć klasy IV oraz ocena zaangażowania adeptów Zakonu Ravnheim i Björnhall.'
      },
      {
        type: 'heading',
        text: '§ 1. Przebieg i Obserwacja Zajęć'
      },
      {
        type: 'paragraph',
        text: '1. Prowadząca prof. Morana Vane rozpoczęła zajęcia od sprawdzenia barier antymagicznych w Sali Cienia IV. Wszyscy uczniowie posiadali wymagane rękawice z runami ochronnymi Algiz.'
      },
      {
        type: 'paragraph',
        text: '2. Część teoretyczna dotycząca rozszczepiania widm astralnych została przedstawiona w sposób przejrzysty, z odwołaniem do traktatu Mistrza Ignatiusa z 1412 roku.'
      },
      {
        type: 'heading',
        text: '§ 2. Wnioski i Zalecenia Pokontrolne'
      },
      {
        type: 'list',
        items: [
          'Ocena metodyczna: Wybitna (W). Uczniowie wykazali 94% skuteczności w opanowaniu stabilizacji cieni.',
          'Zalecenie: Zwiększyć zapas soli aragońskiej przy wejściu do sali na wypadek nagłego przerwania kręgu.',
          'Wyróżnienie: Wzorowy porządek w Dzienniku Lekcyjnym i terminowe wystawianie ocen HP.'
        ]
      },
      {
        type: 'quote',
        text: '„Lekcja prowadzona z żelazną dyscypliną i najwyższym kunsztem magicznym Północy.” — Wizytator Generalny'
      }
    ],
    tags: ['wizytacje', 'nauczyciele', 'czarna-magia', 'hospitacja', 'protokół']
  },
  {
    id: 'inspection-2',
    slug: 'wizytacja-magia-bojowa-vargson',
    category: 'wizytacje',
    categoryLabel: 'Wizytacja Nauczycielska',
    number: 'WIZ-02/XIX',
    title: 'Raport z Hospitacji: Klątwy Bojowe i Pojedynki Runiczne',
    subtitle: 'Nadzór nad Poligonem Żelaza pod okiem prof. Gunnara Vargsona',
    author: 'Inspektorat Magii Bojowej i Dyscypliny',
    authorRole: 'Przewodniczący Rady Wizytatorów',
    date: '5 października XIX Roku Szkolnego',
    sealType: 'ruby',
    iconName: 'ClipboardCheck',
    severity: 'wysoki',
    summary: 'Kontrola sprawności bojowej adeptów rocznika V i VI. Sprawdzenie odporności pancerzy runicznych i refleksu różdżkowego.',
    content: [
      {
        type: 'callout',
        variant: 'success',
        title: 'STAN POLIGONU BOJOWEGO',
        text: 'Wszystkie pylony ochronne i runy absorbujące uderzenia zadziałały bez zakłóceń podczas symulacji starcia grupowego.'
      },
      {
        type: 'heading',
        text: '§ 1. Obserwacja Ćwiczeń Bojowych'
      },
      {
        type: 'paragraph',
        text: 'Adepti demonstrowali techniki przełamywania tarcz Żelaznego Niedźwiedzia. Profesor Vargson osobiście korygował kąt nachylenia różdżki i tempo inkantacji bojowych.'
      },
      {
        type: 'list',
        items: [
          'Brak urazów wymagających interwencji Skrzydła Szpitalnego — 100% bezpieczeństwa procedur.',
          'Wysoka dyscyplina taktyczna obu Zakonów biorących udział w sparringu.',
          'Zatwierdzenie nowego konspektu zajęć na semestr zimowy.'
        ]
      }
    ],
    tags: ['wizytacje', 'magia-bojowa', 'poligon', 'vargson']
  },
  {
    id: 'inspection-3',
    slug: 'standardy-prowadzenia-hospitacji-tmd',
    category: 'wizytacje',
    categoryLabel: 'Wizytacja Nauczycielska',
    number: 'REG-WIZ/01',
    title: 'Standardy Prowadzenia Wizytacji i Hospitacji Katedr TMD',
    subtitle: 'Kodeks oceny pracy kadry profesorskiej i asystentów Twierdzy',
    author: 'Rada Arcymistrzów Durmstrangu',
    authorRole: 'Dyrekcja ds. Naukowych',
    date: '1 września XIX Roku Szkolnego',
    sealType: 'gold',
    iconName: 'Award',
    severity: 'standard',
    summary: 'Oficjalny regulamin przeprowadzania okresowych wizytacji lekcji, kryteria punktacji pracy profesora i procedury odwoławcze.',
    content: [
      {
        type: 'heading',
        text: '1. Częstotliwość i Tryb Wizytacji'
      },
      {
        type: 'paragraph',
        text: 'Każdy profesor Katedry TMD podlega co najmniej dwóm wizytacjom w ciągu semestru: jednej zapowiedzianej oraz jednej niezapowiedzianej.'
      },
      {
        type: 'heading',
        text: '2. Kryteria Oceny Hospitacyjnej'
      },
      {
        type: 'list',
        items: [
          'Zgodność z zatwierdzonym Programem Nauczania TMD i Paktem 1294.',
          'Zapewnienie 100% barier antymagicznych w pracowniach laboratoryjnych.',
          'Prawidłowe i terminowe wpisywanie obecności oraz punktów do Dziennika Discorda.',
          'Kultura słowa i autorytet wykładowcy na sali.'
        ]
      }
    ],
    tags: ['wizytacje', 'standardy', 'kodeks', 'kadra']
  },
  {
    id: 'games-guide',
    slug: 'opis-zabaw-gier-turniejow',
    category: 'zabawy',
    categoryLabel: 'Opis Zabaw & Gier RPG',
    number: 'ZAB-01/TMD',
    title: 'Wielka Księga Zabaw, Turniejów & Aktywności Twierdzy',
    subtitle: 'Przewodnik po tradycyjnych grach, pojedynkach, wyprawach i wyzwaniach towarzyskich',
    author: 'Kolegium Prefektów & Mistrz Gier Północy',
    authorRole: 'Naczelny Arbiter Igrzysk',
    date: 'XIX Rok Szkolny',
    sealType: 'emerald',
    iconName: 'Gamepad2',
    severity: 'standard',
    summary: 'Kompleksowy opis wszystkich gier i mechanik: Szachy Wikingów Hnefatafl, Pojedynki Runiczne, Połów Podlodowy, Kocioł Alchemii, Wyprawy Polarne i Wieczornice.',
    content: [
      {
        type: 'callout',
        variant: 'success',
        title: 'DUCH RYWALIZACJI PÓŁNOCY',
        text: 'W murach Durmstrangu czas wolny adeptów wypełniają szlachetne gry umysłowe, zręcznościowe oraz wyprawy hartujące ciało i duszę. Każda aktywność nagradzana jest punktami, szylingami lub unikalnymi składnikami!'
      },
      {
        type: 'heading',
        text: '1. Hnefatafl — Królewskie Szachy Wikingów'
      },
      {
        type: 'paragraph',
        text: 'Tradycyjna asymetryczna gra planszowa Północy. Jeden gracz dowodzi Królem i jego przyboczną gwardią, usiłując doprowadzić władcę do jednego z czterech narożników planszy. Drugi gracz dowodzi przeważającymi siłami najeźdźców, dążąc do pojmania Króla. Zwycięstwo w partii przynosi punkty rankingowe oraz szylingi w Banku.'
      },
      {
        type: 'heading',
        text: '2. Hólmganga — Pojedynki Runiczne na Arenie'
      },
      {
        type: 'paragraph',
        text: 'Oficjalne starcia pojedynkowe jeden na jednego na arenie pokrytej tarczą antymagiczną. Gracze wybierają formuły runiczne (np. Ogień Kaunan, Lód Isa, Tarcza Algiz, Błyskawica Sowilo). System rozstrzyga przewagę żywiołów, refleks oraz taktykę rzucania uroków.'
      },
      {
        type: 'heading',
        text: '3. Kocioł Alchemiczny i Warzenie Eliksirów'
      },
      {
        type: 'paragraph',
        text: 'W Warsztacie Runicznym (Galdrastofa) każdy adept może wrzucać do kotła zebrane esencje (Smoczą Krew, Arktyczny Mech, Zmrożony Cień, Pył Meteorytowy), by uwarzyć potężne eliksiry zwiększające odporność, odnawiające energię lub dające unikalne odznaki.'
      },
      {
        type: 'heading',
        text: '4. Połów Podlodowy we Fiordzie Skirnir'
      },
      {
        type: 'paragraph',
        text: 'Wyprawa na zamarznięte wody fiordu. Poprzez wycięcie przerębla runą Kenaz i zarzucenie zaklętej wędki można wyłowić rzadkie świecące ryby arktyczne, skrzynie z dawnymi monetami lub zatopione zwoje z zapomnianymi formułami.'
      },
      {
        type: 'heading',
        text: '5. Wyprawy Polarne i Ekspedycje w Tundrę'
      },
      {
        type: 'paragraph',
        text: 'Grupowe misje fabularne organizowane przez Prefektów. Wyprawy badają jaskinie lodowe, kurhany dawnych jarlów oraz tropią rzadkie bestie Północy (np. Fenrira Śnieżnego, Lodowego Jättena). Wymagają przygotowania ciepłego ekwipunku z Rynku Kaupangr.'
      },
      {
        type: 'heading',
        text: '6. Gry Towarzyskie i Wieczornice w Komnatach Wspólnych'
      },
      {
        type: 'paragraph',
        text: 'Wieczorne spotkania przy palenisku: konkursy recytacji sag runicznych, zagadki karłów Skirnirów, rzucanie kośćmi runicznymi oraz wspólne przygotowania do egzaminów rocznych.'
      }
    ],
    tags: ['zabawy', 'gry', 'hnefatafl', 'pojedynki', 'alchemia', 'wyprawy', 'turnieje']
  }
];

export const DOCUMENT_CATEGORIES = [
  { id: 'all', label: 'Wszystkie Dokumenty', icon: 'FileText' },
  { id: 'dekrety', label: 'Dekrety Władz', icon: 'ShieldAlert' },
  { id: 'wizytacje', label: 'Wizytacje Nauczycieli', icon: 'ClipboardCheck' },
  { id: 'statut', label: 'Statut Szkoły', icon: 'Scale' },
  { id: 'regulamin-dc', label: 'Regulamin Serwera Discord', icon: 'MessageSquare' },
  { id: 'zabawy', label: 'Opis Zabaw & Gier RPG', icon: 'Gamepad2' },
  { id: 'custom', label: 'Własne Podstrony Adeptów', icon: 'Sparkles' }
];
