export const EXPEDITION_RULES = {
  dailyLimit: 3,
  maxScore: 6,
  resetTime: '00:00 czasu polskiego',
  maxDailyPoints: 80,
  maxDailySkirnirs: 175
};

export const EXPEDITION_DESTINATIONS = [
  {
    id: 'drakkar_graveyard',
    name: 'Cmentarzysko Drakkarów we Fjordzie',
    difficulty: 'Nowicjusz', difficultyLabel: 'Łatwy', dangerColor: '#4ade80', icon: '⛵',
    desc: 'Wrakowisko starożytnych okrętów wojennych wikingów, uwięzionych w wiecznym lodzie fiordu pod murami Cytadeli.',
    successThreshold: 3,
    rewardSummary: '15–25 ᛋ  •  10–15 pkt  •  artefakt za 6/6',
    rewardTiers: [
      { score: '0–2', result: 'Niepowodzenie', coins: 0, points: 0 },
      { score: '3–4', result: 'Powrót', coins: 15, points: 10 },
      { score: '5', result: 'Sukces', coins: 20, points: 12 },
      { score: '6', result: 'Triumf', coins: 25, points: 15, artifact: true }
    ],
    stages: [
      {
        prompt: 'Przedzierasz się przez zasypany śniegiem pomost. Lodowy wiatr gasi latarnię, a lód pod stopami zaczyna pękać!',
        choices: [
          { id: 'borealis', text: 'Rzuć Lumos Borealis i odczytać strukturę lodu', risk: 'Rozważnie', points: 2, successText: 'Światło zorzy ujawnia stabilną kładkę skalną.' },
          { id: 'drakkar_leap', text: 'Wykorzystać maszt jako dźwignię i skoczyć na wrak', risk: 'Brawurowo', points: 3, successText: 'Manewr jest ryzykowny, ale lądujesz na bezpiecznym pokładzie.' },
          { id: 'ice_probe', text: 'Badać lód krok po kroku końcem różdżki', risk: 'Ostrożnie', points: 1, successText: 'Docierasz dalej, choć mróz odbiera Ci siły i cenny czas.' }
        ]
      },
      {
        prompt: 'W ładowni dostrzegasz skrzynię spętaną mroźnym żelazem. Nad nią unosi się widmo sternika.',
        choices: [
          { id: 'norse_greeting', text: 'Złożyć pokłon i wypowiedzieć pozdrowienie staronordyckie', risk: 'Roztropnie', points: 3, successText: 'Widmo uznaje Twój szacunek i wskazuje klucz do skrzyni.' },
          { id: 'protego', text: 'Osłonić się Protego Skalny Bastion i zdjąć łańcuch', risk: 'Stanowczo', points: 2, successText: 'Tarcza odpiera chłód zaświatów, a łańcuch ustępuje.' },
          { id: 'break_chains', text: 'Rozerwać łańcuch surową siłą zaklęcia', risk: 'Lekkomyślnie', points: 1, successText: 'Skrzynia jest wolna, lecz gniew sternika podąża za Tobą do wyjścia.' }
        ]
      }
    ]
  },
  {
    id: 'shadow_forest',
    name: 'Przeklęta Puszcza Cieni (Myrkviðr)',
    difficulty: 'Adept', difficultyLabel: 'Średni', dangerColor: '#facc15', icon: '🌲',
    desc: 'Bezkresny bór czarnych sosen na północ od zamku, gdzie cienie żyją własnym życiem i polują stada Wilków Ulfr.',
    successThreshold: 4,
    rewardSummary: '35–50 ᛋ  •  18–25 pkt  •  artefakt za 6/6',
    rewardTiers: [
      { score: '0–3', result: 'Niepowodzenie', coins: 0, points: 0 },
      { score: '4', result: 'Powrót', coins: 35, points: 18 },
      { score: '5', result: 'Sukces', coins: 42, points: 22 },
      { score: '6', result: 'Triumf', coins: 50, points: 25, artifact: true }
    ],
    stages: [
      {
        prompt: 'Z mgły wyłania się wataha Wilków Cienia o fioletowych ślepiach. Zwierzęta zamykają krąg.',
        choices: [
          { id: 'ignis', text: 'Wyznaczyć bezpieczny krąg kontrolowanym zaklęciem Ignis', risk: 'Stanowczo', points: 2, successText: 'Szkarłatny płomień zatrzymuje watahę bez podpalenia puszczy.' },
          { id: 'invisibility', text: 'Użyć eliksiru niewidzialności i przejść pod wiatr', risk: 'Roztropnie', points: 3, successText: 'Wilki tracą trop, a Ty bezszelestnie opuszczasz ich teren.' },
          { id: 'tree_route', text: 'Wspinać się po koronach czarnych sosen', risk: 'Ryzykownie', points: 1, successText: 'Gałęzie wytrzymują, lecz cienie odbierają Ci część sił.' }
        ]
      },
      {
        prompt: 'Na polanie odnajdujesz pradawny kamień ofiarny porośnięty mchem i runami leczniczymi.',
        choices: [
          { id: 'clean_runes', text: 'Oczyścić inskrypcje zgodnie z porządkiem Starszego Futharku', risk: 'Roztropnie', points: 3, successText: 'Kamień rozbłyska szmaragdowym światłem i uwalnia esencję lasu.' },
          { id: 'collect_moss', text: 'Zebrać próbki mchu bez naruszania kręgu run', risk: 'Rozważnie', points: 2, successText: 'Pakujesz cenny składnik, a pieczęć puszczy pozostaje nienaruszona.' },
          { id: 'take_offering', text: 'Zabrać kryształ leżący pośrodku kamienia', risk: 'Lekkomyślnie', points: 1, successText: 'Zdobywasz kryształ, ale budzisz cienie pilnujące ofiary.' }
        ]
      }
    ]
  },
  {
    id: 'jotun_caves',
    name: 'Jaskinie Lodowych Olbrzymów (Jotunheimen)',
    difficulty: 'Arcymistrz', difficultyLabel: 'Trudny', dangerColor: '#ef4444', icon: '🏔️',
    desc: 'Wysokogórskie szczeliny lodowca, gdzie spoczywają uśpieni strażnicy pradawnej magii mrozu.',
    successThreshold: 5,
    rewardSummary: '75–100 ᛋ  •  32–40 pkt  •  artefakt za 6/6',
    rewardTiers: [
      { score: '0–4', result: 'Niepowodzenie', coins: 0, points: 0 },
      { score: '5', result: 'Sukces', coins: 75, points: 32 },
      { score: '6', result: 'Triumf', coins: 100, points: 40, artifact: true }
    ],
    stages: [
      {
        prompt: 'Wejście do pieczary tarasuje lodowy golem strażniczy. Temperatura spada do −40°C.',
        choices: [
          { id: 'thurisaz', text: 'Skupić ogień w runie Thurisaz i stopić rdzeń golema', risk: 'Potężnie', points: 2, successText: 'Płomień otwiera przejście, ale huk niesie się w głąb lodowca.' },
          { id: 'weak_point', text: 'Odczytać splot zaklęcia i trafić w runiczny słaby punkt', risk: 'Precyzyjnie', points: 3, successText: 'Jedno celne zaklęcie bezgłośnie kruszy strażnika.' },
          { id: 'ice_charge', text: 'Szarżować pod osłoną tarczy lodowej', risk: 'Brawurowo', points: 1, successText: 'Przebijasz się do wejścia, lecz tarcza pęka pod uderzeniem.' }
        ]
      },
      {
        prompt: 'W sercu lodowca pulsuje kryształ wiecznego lodu Jotunów. Każdy fałszywy ruch może obudzić olbrzymów.',
        choices: [
          { id: 'order_seal', text: 'Zabezpieczyć kryształ pełną pieczęcią Zakonu', risk: 'Mistrzowsko', points: 3, successText: 'Pieczęć stabilizuje pradawną energię bez naruszenia snu Jotunów.' },
          { id: 'isolate_crystal', text: 'Odizolować energię kręgiem Algiz i Sowilo', risk: 'Rozważnie', points: 2, successText: 'Krąg wycisza kryształ i pozwala bezpiecznie pobrać jego odłamek.' },
          { id: 'touch_crystal', text: 'Dotknąć kryształu i spróbować narzucić mu swoją wolę', risk: 'Lekkomyślnie', points: 1, successText: 'Opanowujesz energię tylko na chwilę; lodowiec zaczyna drżeć.' }
        ]
      }
    ]
  }
];
