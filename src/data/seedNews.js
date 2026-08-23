export const NEWS_ITEMS = [
  {
    id: 'news-1',
    title: 'Podsumowanie Tygodnia #8 & Wyniki Rywalizacji o Puchar Północy',
    category: 'Edykty Dyrekcji',
    categoryKey: 'edykty',
    bannerCustomText: 'edykty dyrekcji',
    house: null, // neutral / whole school
    date: '2026-08-22',
    author: 'Arcymistrzyni Valgerda Storm',
    authorRole: 'Dyrektor Cytadeli Durmstrang',
    readTime: '3 min',
    image: 'news-edict',
    highlight: true,
    pinned: true,
    waxSeal: 'gold', // 'gold' | 'crimson' | 'shadow' | 'frost'
    tags: ['Puchar Północy', 'Edykt Dyrekcji', 'Klasyfikacja'],
    summary: 'Oficjalne podsumowanie ósmego tygodnia zmagań w XIX Roku Szkolnym. Różnice punktowe między Zakonami są minimalne, a rywalizacja na lodowych pylonach wkracza w decydującą fazę.',
    content: `Szanowna Społeczności Cytadeli Durmstrang!

Dobiegł końca ósmy tydzień wytężonej nauki i magicznych zmagań w murach naszej akademii. Poniżej publikujemy oficjalne zestawienie punktów zdobytych przez poszczególne Zakony w rywalizacji o Puchar Północy:

---
### 🏆 Klasyfikacja Generalna Pucharu Północy:
* 🐻 **Zakon Niedźwiedzia (Björnhall):** 520 pkt (+45 pkt za turniej Hólmganga)
* 🐦 **Zakon Kruka (Ravnheim):** 510 pkt (+60 pkt za traktaty o barierach cienia)
* 🦦 **Zakon Wydry (Otergard):** 495 pkt (+30 pkt za hydrokinetyczne eliksiry)
* 🦌 **Zakon Renifera (Reinhall):** 480 pkt (+25 pkt za ceremonie pieczęci krwi)
---

Wszystkim adeptom dziękujemy za hart ducha i nieugiętą wolę. Przypominamy, że ewentualne wnioski o korekty punktowe można składać u właściwych Opiekunów Zakonów do niedzieli o północy.

Niech mróz nie studzi Waszego zapału, a ogień w Wielkim Palenisku przypomina o chwale naszych przodków.`,
    reactions: {
      admiration: 42,
      dread: 5,
      honor: 38,
      flame: 29
    },
    comments: [
      {
        id: 'c-1',
        authorName: 'Magnus Lindqvist',
        house: 'niedzwiedz',
        role: 'student',
        date: '2026-08-22 10:15',
        text: 'Niedźwiedzie utrzymają prowadzenie do samego przesilenia zimowego! Puchar zostanie w Żelaznej Wieży.'
      },
      {
        id: 'c-2',
        authorName: 'Valdemar Krag-Hansen',
        house: 'kruk',
        role: 'student',
        date: '2026-08-22 10:48',
        text: 'Kruki jeszcze nie odsłoniły wszystkich formuł runicznych. Przed nami nocny rytuał w Obserwatorium.'
      }
    ]
  },
  {
    id: 'news-5',
    title: 'Destylacja Eliksiru Lodowego Ognia w Podziemnych Laboratoriach',
    category: 'Eliksiry & Alchemia',
    categoryKey: 'eliksiry',
    bannerCustomText: 'eliksiry',
    house: 'otter',
    date: '2026-08-22',
    author: 'Prof. Morana Vane',
    authorRole: 'Katedra Eliksirów & Toksykologii',
    readTime: '3 min',
    image: 'news-potions',
    highlight: false,
    pinned: false,
    waxSeal: 'frost',
    tags: ['Eliksiry', 'Alchemia', 'Otergard'],
    summary: 'Rozpoczęto warzenie rzadkiego ekstraktu z mchu lodowcowego oraz sproszkowanego kła wilka północy. Wymagane użycie kociołków ze srebra jeziornego.',
    content: `Katedra Eliksirów i Toksykologii ogłasza otwarcie pracowni destylacyjnych dla adeptów drugiego kręgu wtajemniczenia.

Głównym zadaniem najbliższego tygodnia będzie stabilizacja **Eliksiru Lodowego Ognia** — mikstury pozwalającej na krótkotrwałe operowanie płomieniem o ujemnej temperaturze bez ryzyka odmrożenia tkanek.

Wymagania BHP w laboratoriach podziemnych:
1. Bezwzględny nakaz stosowania rękawic ze skóry morskiego potwora.
2. Temperatura w retorcie nie może przekroczyć punktu wrzenia rtęci księżycowej.
3. Gotowe fiolki należy zabezpieczyć pieczęcią woskową i złożyć w komorze chłodniczej do piątku.`,
    reactions: {
      admiration: 48,
      dread: 3,
      honor: 27,
      flame: 36
    },
    comments: [
      {
        id: 'c-4',
        authorName: 'Sigrun Lindqvist',
        house: 'otter',
        role: 'student',
        date: '2026-08-22 11:20',
        text: 'Kociołki Zakonu Wydry są już napełnione esencją jeziorną. Wyniki destylacji zapowiadają się wybitnie.'
      }
    ]
  },
  {
    id: 'news-2',
    title: 'Oceny Końcowe z Przedmiotu Czarna Magia & Nekromancja',
    category: 'Wyniki Ocen',
    categoryKey: 'oceny',
    bannerCustomText: 'oceny',
    house: 'kruk',
    date: '2026-08-21',
    author: 'Prof. Morana Vane',
    authorRole: 'Kierownik Katedry Czarnej Magii',
    readTime: '2 min',
    image: 'news-aurora',
    highlight: false,
    pinned: false,
    waxSeal: 'shadow',
    tags: ['Czarna Magia', 'Katedry', 'Egzaminy'],
    summary: 'Weryfikacja traktatów dotyczących Pieczęci Wstrzymującej oraz Wiązania Cieni Północy. Wyniki oficjalne i terminy odbioru szpil runicznych.',
    content: `Adepci Sztuk Cienia!

Sprawdziłam wszystkie przesłane traktaty dotyczące *Pieczęci Wstrzymującej* oraz *Wiązania Cieni Północy*. Wasza dyscyplina umysłu w obliczu pradawnych sił zasługuje na najwyższe uznanie. Poniżej przedstawiam oficjalne oceny końcowe semestru:

* **Valdemar Krag-Hansen (Ravnheim):** Wybitny (W) — śr. 6.00
* **Astrid Vargadottir (Björnhall):** Wybitny (W) — śr. 5.92
* **Sigrun Lindqvist (Otergard):** Wybitny (W) — śr. 5.85
* **Ragnar Blom (Reinhall):** Powyżej Oczekiwań (P) — śr. 5.15

Certyfikaty biegłości w pętaniu cieni zostaną uroczyście przekazane wraz z pamiątkowymi szpilami runicznymi w Wieży Nocnych Szeptów w najbliższy wtorek po gaszeniu zniczy.`,
    reactions: {
      admiration: 31,
      dread: 14,
      honor: 22,
      flame: 17
    },
    comments: [
      {
        id: 'c-3',
        authorName: 'Astrid Vargadottir',
        house: 'niedzwiedz',
        role: 'student',
        date: '2026-08-21 16:30',
        text: 'Dziękuję Pani Profesor za uwagi do inkantacji cienia. Poprawię rezonans nadgarstka.'
      }
    ]
  },
  {
    id: 'news-3',
    title: 'Eliminacje Turnieju Pojedynków Hólmganga — Wyniki Areny Żelaznego Kręgu',
    category: 'Liga Bojowa',
    categoryKey: 'liga-bojowa',
    bannerCustomText: 'liga bojowa',
    house: 'niedzwiedz',
    date: '2026-08-19',
    author: 'Prof. Gunnar Vargson',
    authorRole: 'Mistrz Szermierki Runicznej & Opiekun Björnhall',
    readTime: '4 min',
    image: 'news-duel',
    highlight: false,
    pinned: false,
    waxSeal: 'crimson',
    tags: ['Hólmganga', 'Pojedynki', 'Arena'],
    summary: 'Rozegrano 12 pojedynków eliminacyjnych na lodowych pylonach. Wyróżnienie dla kadeta Magnusa Lindqvista za bezbłędne zastosowanie Tarczy Pękniętego Żelaza.',
    content: `W ubiegłą sobotę na Arenie Żelaznego Kręgu odbyły się pojedynki eliminacyjne Turnieju Hólmganga. 

Warunki były surowe — temperatura spadła do -18°C, a wiatr eteryczny osiągał prędkość 60 węzłów. 

Szczególne wyróżnienie otrzymuje kadet **Magnus Lindqvist** za perfekcyjne sparowanie potrójnego uroku lodowego przy użyciu *Tarczy Pękniętego Żelaza* oraz natychmiastowe przejście do kontrataku runą *Thurisaz*.

Finały odbędą się podczas Nocy Zimowego Przesilenia. Wszyscy pretendenci proszeni są o naostrzenie sztyletów i odnowienie pieczęci ochronnych na rękawicach.`,
    reactions: {
      admiration: 55,
      dread: 8,
      honor: 49,
      flame: 44
    },
    comments: []
  },
  {
    id: 'news-4',
    title: 'Ostrzeżenie Katedry Astronomii: Noc Karmazynowej Zorzy nad Skandami',
    category: 'Zjawiska Astronomiczne',
    categoryKey: 'astronomia',
    bannerCustomText: 'astronomia',
    house: 'renifer',
    date: '2026-08-15',
    author: 'Prof. Sigrid Hällström',
    authorRole: 'Katedra Starożytnych Run i Astromagii',
    readTime: '3 min',
    image: 'news-aurora',
    highlight: false,
    pinned: false,
    waxSeal: 'frost',
    tags: ['Zorza Polarna', 'Astromagia', 'Anomalia'],
    summary: 'W nocy z 18 na 19 sierpnia spodziewana jest rzadka anomalia magnetyczno-eteryczna. Lekcje Starożytnych Run zyskają potrójny rezonans energetyczny.',
    content: `Obserwatorium Północne zarejestrowało gwałtowne zmiany w strumieniach wiatru solarnego. 

W nocy z 18 na 19 sierpnia nad Cytadelą rozbłyśnie rzadka **Karmazynowa Zorza Polarna**.

Zalecenia Katedry:
1. Wszystkie kociołki alchemiczne z wywarami krwawnika i jemioły powinny zostać nakryte wiekami z dębu cmentarnego.
2. Formuły wykuwane w Warsztacie Runicznym (*Galdrastofa*) zyskają +50% do stabilności wiązania.
3. Obserwacje dla adeptów Zakonu Renifera i Zakonu Kruka rozpoczną się o godzinie 23:00 na najwyższym tarasie Wieży Nocnych Szeptów.`,
    reactions: {
      admiration: 38,
      dread: 12,
      honor: 19,
      flame: 25
    },
    comments: []
  }
];
