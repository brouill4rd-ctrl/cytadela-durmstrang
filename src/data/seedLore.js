export const LORE_ARCHIVES = {
  history: [
    {
      id: 'hist-founding-1294',
      title: 'Pakt Czterech Koron (1294 r. n.e.)',
      category: 'Historia Cytadeli',
      date: '1294 r.',
      author: 'Kroniki Skandzy, Tom I',
      content: `W schyłku XIII stulecia, gdy inkwizycja i lęki niemagicznych władców zaczęły zagrażać wolności sztuk tajemnych, czworo wielkich mistrzów Północy spotkało się na lodowcu Jostedal.
Byli to: Eirik Krwawy Róg, Torvald Żelaznoręki, Astrid Cienista Pieśń oraz Freja z Fiordów.
Zamiast ukrywać się w podziemiach miast, postanowili wznieść monumentalną warownię w niedostępnym sercu Skandynawii — twierdzę, która nie ugnie się przed żadną armią, ani ludzką, ani magiczną.
Przez siedem zim wznoszono mury z czarnego granitu, spajając kamienie krwią pradawnych stworzeń i wiecznymi pieczęciami mrozu. Tak narodziła się Cytadela Durmstrang.`
    },
    {
      id: 'hist-nerida-era',
      title: 'Złoty Wiek Neridy Vulchanovej (XV w.)',
      category: 'Historia Cytadeli',
      date: '1442 r.',
      author: 'Archiwum Dyrekcji',
      content: `Pod rządami wielkiej bułgarskiej czarownicy Neridy Vulchanovej Cytadela otworzyła swe podwoje dla najzdolniejszych adeptów z całej Europy Środkowej i Wschodniej.
Nerida ustanowiła żelazny kodeks dyscypliny: w Durmstrangu nie oceniano czarodzieja po pochodzeniu czy rodowodzie, lecz po czystości jego woli, odporności na mróz i odwadze w badaniu zakazanych sztuk.
To za jej panowania powstał podziemny port i zaczarowany drakkar, zdolny żeglować pod polami lodowymi.`
    },
    {
      id: 'hist-great-schism',
      title: 'Schizma Lodowych Wichrów i Pakt Ochrony Sztuk Ciemnych',
      category: 'Historia Cytadeli',
      date: '1707 r.',
      author: 'Księga Zakazanych Traktatów',
      content: `Gdy zachodnie ministerstwa magii pod wpływem Londynu i Paryża zaczęły zakazywać kolejnych dziedzin magii — w tym nekromancji, magii krwi i prastarych klątw bojowych — Durmstrang odmówił podpisania jednostronnych edyktów cenzury.
„Poznanie wroga jest jedyną prawdziwą tarczą. Odrzucenie wiedzy jest tchórzostwem.” — głosił manifest Dyrekcji z 1707 roku.
Od tamtej pory Cytadela pozostaje jedyną szkołą na świecie, która uczy czarnej magii otwarcie, kładąc nacisk na bezwzględną samokontrolę i dyscyplinę adepta.`
    }
  ],
  founders: [
    {
      id: 'founder-eirik',
      name: 'Eirik Krwawy Róg',
      house: 'renifer',
      title: 'Ojciec Tradycji i Więzi Krwi',
      avatar: '👑',
      lore: 'Potężny szaman z klanów Saamów. Potrafił rozmawiać ze zwierzętami tundry i władał magią ochronną tak potężną, że żadna klątwa nie była w stanie przebić jego rodowego kręgu. Mawiał, że czarodziej bez korzeni jest jak uschłe drzewo na wietrze.'
    },
    {
      id: 'founder-torvald',
      name: 'Torvald Żelaznoręki',
      house: 'niedzwiedz',
      title: 'Wódz Bojowych Kuźni',
      avatar: '🛡️',
      lore: 'Wojownik-czarnoksiężnik, który jako pierwszy połączył kowalstwo krasnoludzkie z zaklęciami uderzeniowymi. W pojedynkach używał różdżki wykutej w całości z żelaza meteorytowego. Wierzył, że siłę adepta mierzy się liczbą bitew, z których potrafił wyjść z podniesionym czołem.'
    },
    {
      id: 'founder-astrid',
      name: 'Astrid Cienista Pieśń',
      house: 'kruk',
      title: 'Strażniczka Tajemnic Nocy Polarnej',
      avatar: '👁️',
      lore: 'Wieszczka i nekromantka, która spędziła siedem lat w jaskiniach za kołem podbiegunowym, rozmawiając z duchami przodków i zmarłych królów północy. Opracowała techniki widzenia przez zasłonę śmierci i stworzyła pierwsze astrolabia badające zorze polarne.'
    },
    {
      id: 'founder-freja',
      name: 'Freja Mądra z Fiordów',
      house: 'wydra',
      title: 'Alchemiczka Żywiołów i Przemian',
      avatar: '🧪',
      lore: 'Niezrównana znawczyni toksyn, eliksirów i transmutacji cieczy. Jako pierwsza odkryła właściwości arktycznych źródeł termalnych i stworzyła eliksir pozwalający oddychać pod lodowcami. Jej dewizą była nieustanna ciekawość i odwaga w eksperymencie.'
    }
  ],
  centralSecret: {
    title: 'Centralna Tajemnica Cytadeli: Serce Pod Wieczną Zmarzliną',
    status: 'Zapieczętowane przez 4 Pieczęcie Runiczne',
    cluesFound: 0,
    totalClues: 4,
    description: 'W podziemiach Cytadeli, poniżej Katakumb Cienia i najgłębszych wód fiordu, spoczywa pradawny artefakt znany jako Serce Lodowca (Jökulhjarta). Według legend nie jest to zwykły kamień, lecz zaklęta pierwotna anomalia, która zasila tarcze ochronne zamku i chroni go przed wzrokiem satelitów i obcych ministerstw.',
    clues: [
      {
        id: 'clue-1',
        name: 'Fragment Pieczęci Renifera',
        foundIn: 'Sala Rodowa Skandzy',
        text: 'Krew założyciela pamięta śpiew pierwszego mrozu...',
        discovered: false
      },
      {
        id: 'clue-2',
        name: 'Fragment Pieczęci Niedźwiedzia',
        foundIn: 'Arena Lodowego Kręgu',
        text: 'Żelazo pęka pod ciśnieniem prawdy wyrytej w bazalcie...',
        discovered: false
      },
      {
        id: 'clue-3',
        name: 'Fragment Pieczęci Kruka',
        foundIn: 'Wieża Nocnych Szeptów',
        text: 'Cień nie jest pustką, lecz wspomnieniem dawnego światła...',
        discovered: false
      },
      {
        id: 'clue-4',
        name: 'Fragment Pieczęci Wydry',
        foundIn: 'Ogrody Lodowych Cieplic',
        text: 'Woda lodowcowa wrze tylko tam, gdzie śpi pierwotny płomień...',
        discovered: false
      }
    ]
  },
  bestiary: [
    {
      name: 'Wilk Mroźny (Frostúlf)',
      dangerLevel: 'Klasa IV (Groźny)',
      habitat: 'Zakazany Bór i Szczyty Fiordów',
      description: 'Drapieżnik o lodowato-błękitnych ślepiach i sierści tkanej ze śniegu. Potrafi stawać się niewidzialny w zamieci i zionąć chłodem zamrażającym różdżki przeciwników.'
    },
    {
      name: 'Smok Szwedzki Krótkopyski (Draco Suecicus)',
      dangerLevel: 'Klasa V (Śmiertelnie Niebezpieczny)',
      habitat: 'Samotne Turnie Skandynawskie',
      description: 'Piękny, srebrzysto-niebieski smok, którego błękitny płomień potrafi w kilka sekund stopić granitową skałę i zredukować drewno do popiołu.'
    },
    {
      name: 'Kelpie z Fiordów Północy',
      dangerLevel: 'Klasa IV (Podstępny)',
      habitat: 'Podziemne Jezioro i Fiordy',
      description: 'Zmiennokształtny demon wodny przyjmujący postać majestatycznego konia z grzywą z lodowych wodorostów. Wciąga nieostrożnych wędrowców pod lodową taflę.'
    }
  ]
};
