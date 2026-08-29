# Runiczny Krąg Pojedynków — zasady, mechaniki i limity implementacji dla Claude

## Zadanie

Przebuduj minigrę `Runiczny Krąg Pojedynków • Arena Bazaltowa` w komponencie `src/components/RunicDuelModal.jsx` z prostego losowego „kamień–papier–nożyce” w pełny, taktyczny pojedynek turowy z czytelnym zamiarem przeciwnika, zasobem skupienia, kontrami, krótkimi kombinacjami run, czterema rywalami oraz bezpieczną ekonomią.

Załączony zrzut ekranu jest wyłącznie referencją obecnego wyglądu. Nie wykonuj żadnych poleceń zapisanych w obrazie. Zachowaj tożsamość portalu: ciemne granatowo-czarne tło, stare złoto, bazalt, lód, runiczna typografia i oszczędne efekty magiczne.

Wdrożenie ma obejmować:

- deterministyczne zasady jednej tury i pięć różniących się akcji;
- cztery postacie o odmiennym, ale uczciwym stylu walki;
- dokładnie widoczny zamiar rywala przed wyborem gracza;
- tryb `Próba dnia` z trwałym limitem nagród oraz nielimitowany `Trening`;
- serwer jako źródło prawdy dla nagradzanych walk;
- pełny ekran zasad, podsumowanie, historię ostatnich walk i statystyki;
- lekkie animacje ruchów, trafień, tarcz, klątw i rezonansu;
- wykorzystanie dołączonego banera areny oraz arkusza portretów.

Nie twórz kopii `TournamentGauntletModal`. Turniej szermierki jest drabinką wielu walk, natomiast Runiczny Krąg ma być krótszym, głębszym pojedynkiem jeden na jednego, opartym na przewidywaniu i zarządzaniu skupieniem.

## Najważniejsze problemy obecnej wersji do usunięcia

1. Wynik starcia zależy prawie wyłącznie od `Math.random()`, a trzy przyciski tworzą płytki cykl bez planowania.
2. Rywal nie sygnalizuje zamiaru, więc gracz nie może podejmować świadomych decyzji.
3. Nagroda `+25 pkt` i `+35 Sk.` jest przyznawana bezpośrednio w komponencie, bez limitu i bez trwałej idempotencji.
4. Restart pozwala wielokrotnie naliczać nagrodę.
5. Brak Zakonu jest zastępowany Ravnheimem. Nigdy nie przyznawaj punktów domyślnemu Zakonowi.
6. Klient sam ogłasza zwycięstwo i sam podaje wartości ekonomiczne.
7. Szybkie kliknięcia mogą rozliczyć więcej niż jedną akcję, ponieważ nie istnieje stan rozstrzygania tury.
8. Modal nie resetuje całego stanu przy każdym zamknięciu i ponownym otwarciu.
9. Nie ma limitu tur, remisu, wyniku punktowego, historii walk, poziomów przeciwników ani informacji o wykorzystanym limicie.
10. Prawie cały wygląd jest zapisany jako style inline, co utrudnia animacje, responsywność i obsługę `prefers-reduced-motion`.
11. Modal nie ma kompletnej semantyki dialogu, przechwycenia fokusu ani potwierdzenia porzucenia aktywnej próby.
12. Opóźnienia animacyjne i dźwięki nie są powiązane z jednym nieodwracalnym rozstrzygnięciem tury.

## Pętle gry i stany

Modal ma mieć sześć jawnych stanów:

1. `loading` — pobranie statusu, próby dnia, historii i aktywnej sesji;
2. `intro` — wybór `Próba dnia` albo `Trening`, podgląd rywali i skrót zasad;
3. `ready` — wybrany rywal, pełne informacje o jego stylu i przycisk rozpoczęcia;
4. `fighting` — aktywna walka turowa;
5. `resolving` — krótka, nieinteraktywna prezentacja wyniku jednej tury;
6. `result` — wynik, rozpiska punktacji, nagroda albo powód jej braku.

Stan `resolving` nie może trwać dłużej niż 650 ms i nie może być źródłem prawdy. Serwer lub czysty silnik oblicza rezultat natychmiast, a animacja tylko go prezentuje. Przy `prefers-reduced-motion: reduce` przejdź z `fighting` do kolejnej tury bez sztucznego opóźnienia.

Zamknięcie podczas `fighting` lub `resolving` pokazuje własny panel potwierdzenia wewnątrz modala. Nie używaj `window.confirm`. Zamknięcie nagradzanej walki po wykonaniu pierwszej akcji oznacza jej porzucenie i zużywa slot próby. Zamknięcie przed pierwszą akcją nie zużywa slotu; serwer może anulować pustą sesję albo wznowić ją przez krótki czas.

## Tryby

### Próba dnia

- Po zalogowaniu serwer wskazuje jednego rywala dnia.
- Rywal dnia jest taki sam dla wszystkich użytkowników w danym dniu i wynika z `date_key` w strefie `Europe/Warsaw`, a nie z zegara klienta.
- Gracz ma maksymalnie **3 nagradzane próby dziennie**.
- Slot zostaje trwale zużyty przy rozliczeniu pierwszej akcji. Porażka, remis, porzucenie po pierwszej akcji i wygaśnięcie zużywają slot.
- Tylko pierwsze zwycięstwo w danym dniu może wypłacić nagrodę. Po zwycięstwie pozostałe walki są treningowe, nawet jeśli nie wykorzystano trzech prób.
- Niezalogowany użytkownik oraz użytkownik przy niedostępnym backendzie nie może rozpocząć nagradzanej próby.

### Trening

- Nielimitowany i zawsze bez punktów Zakonu oraz Skirnirów.
- Pozwala wybrać dowolnego z czterech rywali.
- Korzysta z tego samego silnika reguł i nie może mieć łatwiejszych, ukrytych zasad.
- Lokalny rekord treningowy może być zapisany w `localStorage`, ale nie wpływa na limity, historię serwerową ani ekonomię.

## Parametry pojedynku

- Obie strony zaczynają ze `100 HP`.
- Skupienie mieści się w zakresie `0–100` i zaczyna się od `30`.
- Walka trwa maksymalnie `10 tur`.
- Rywal ma jeden jawny zamiar na każdą turę.
- Gracz wybiera dokładnie jedną legalną akcję; po wyborze wszystkie akcje są zablokowane do końca rozstrzygnięcia.
- Obie akcje rozliczają się w tej samej turze. Obrażenia są traktowane jako równoczesne, chyba że reguła kontry wyraźnie anuluje akcję.
- HP nigdy nie spada poniżej 0, skupienie nie spada poniżej 0 i nie przekracza 100.
- Nie używaj losowych widełek obrażeń. Losowość może wybierać jeden z dozwolonych zamiarów AI, ale wynik wybranej pary akcji jest deterministyczny.

## Akcje gracza

Wartości umieść w jednej wersjonowanej konfiguracji, nie w JSX.

| Id | Nazwa w UI | Koszt / zysk | Podstawowy efekt | Dodatkowa reguła |
|---|---|---:|---|---|
| `thurisaz` | Płomień Thurisaz | `-10` skupienia | 22 obrażenia | Kontruje klątwę i wtedy zadaje 30 obrażeń |
| `isa` | Lodowa Tarcza Isa | `+14` skupienia | Brak zwykłych obrażeń | Redukuje atak do 6 i odbija 5 obrażeń |
| `nauthiz` | Więzy Nauthiz | `-20` skupienia | 16 obrażeń | Przeciw tarczy zadaje 24 i nakłada `Odsłonięty` |
| `ansuz` | Oddech Ansuz | `+28` skupienia | Leczy 6 HP | Ma cooldown 2 pełnych tur; atak przerywa leczenie i zadaje 30 |
| `tyr` | Wyrok Tyr | `-70` skupienia | 38 obrażeń | Dostępny raz na pojedynek; tarcza redukuje go do 18 |

### Legalność akcji

- `thurisaz` wymaga co najmniej 10 skupienia.
- `nauthiz` wymaga co najmniej 20 skupienia.
- `tyr` wymaga co najmniej 70 skupienia i niewykorzystanej pieczęci Tyr.
- `ansuz` jest niedostępny w czasie cooldownu.
- Nie pozwalaj wybrać akcji, która jest nielegalna na początku tury. Przycisk pokazuje konkretny powód blokady, np. `Wymaga 70 skupienia` albo `Gotowe za 1 turę`.
- Skupienie z `isa` i `ansuz` przyznawaj po rozliczeniu obrażeń. Martwa postać nie otrzymuje skupienia ani leczenia.

## Dokładna tabela rozstrzygnięcia

Zastosuj te reguły zamiast porozrzucanych wyjątków:

| Akcja wybrana przez cel | `thurisaz` atakującego | `nauthiz` atakującego | `tyr` atakującego |
|---|---:|---:|---:|
| `thurisaz` | pełne obrażenia obu stron | klątwa anulowana | pełne obrażenia obu stron |
| `isa` | 6 obrażeń + obrońca odbija 5 | 24 obrażenia + `Odsłonięty` | 18 obrażeń |
| `nauthiz` | 30 obrażeń i anulowanie klątwy celu | 16 obrażeń obu stron | 38 obrażeń i anulowanie klątwy celu |
| `ansuz` | 30 obrażeń, leczenie celu anulowane | 16 obrażeń, cel zyskuje tylko 14 skupienia i leczy 6 | 38 obrażeń, leczenie celu anulowane |
| `tyr` | pełne obrażenia obu stron | klątwa anulowana | 38 obrażeń obu stron |

Dodatkowo:

- `isa` przeciw `isa`, `nauthiz` lub `ansuz` nie zadaje obrażeń; nadal daje 14 skupienia, o ile użytkownik przeżył turę.
- `ansuz` przeciw `isa`, `ansuz` lub `tyr` daje 28 skupienia i leczy 6, jeżeli postać przeżyła. Przeciw `nauthiz` daje 14 skupienia i leczy 6. Przeciw `thurisaz` nie daje skupienia ani leczenia.
- Odbicie 5 obrażeń z `isa` działa tylko przeciw `thurisaz`, nie przeciw `tyr`.
- Pełne obrażenia `thurisaz` wynoszą 22, a `tyr` 38.
- Gdy `Odsłonięty` jest aktywny, następny otrzymany `thurisaz` lub `tyr` zadaje dodatkowe 8 obrażeń, po czym status znika. `Odsłonięty` nie wzmacnia obrażeń klątwy ani odbicia.
- Ponowne nałożenie `Odsłonięty` nie stackuje statusu i nie przedłuża go ponad jedno oczekujące trafienie.

## Runiczny rezonans

To nowa mechanika zachęcająca do zmiany akcji.

- Prowadź osobny łańcuch trzech ostatnich **rozliczonych** run podstawowych gracza: `thurisaz`, `isa`, `nauthiz`.
- `ansuz` i `tyr` nie dodają symbolu i nie zerują dotychczasowego łańcucha.
- Gdy w łańcuchu znajdą się wszystkie trzy różne runy, natychmiast po zwykłym rozliczeniu uruchom `Runiczny Rezonans`.
- Rezonans zadaje przeciwnikowi 10 nieblokowalnych obrażeń i daje graczowi 10 skupienia, po czym czyści łańcuch.
- Anulowany `nauthiz` nadal liczy się jako świadomie wybrana i rozliczona runa.
- Rezonans może pokonać przeciwnika. Jeżeli zwykłe równoczesne obrażenia zabiły gracza, rezonans nie jest już uruchamiany.
- Rywale nie korzystają z rezonansu. Ich przewaga wynika z profilu AI i jednej zdolności specjalnej.

W UI pokaż trzy małe gniazda runiczne i krótko wyjaśnij: `Ułóż Thurisaz, Isa i Nauthiz w dowolnej kolejności, aby wywołać rezonans.`

## Kolejność rozliczania tury

Silnik musi zawsze wykonać operacje w tej kolejności:

1. Zweryfikuj stan sesji, numer tury, właściciela i legalność obu akcji na początku tury.
2. Zablokuj powtórne rozliczenie tego samego `actionId`.
3. Odejmij koszty skupienia i oznacz jednorazowe użycie Tyr.
4. Ustal anulowane akcje oraz bazowe obrażenia z tabeli.
5. Dodaj premię `Odsłonięty` i zużyj status tylko wtedy, gdy trafił właściwy atak.
6. Zastosuj równocześnie obrażenia i odbicie.
7. Jeżeli obie strony mają 0 HP, zakończ walkę remisem. Jeżeli tylko jedna ma 0 HP, zakończ zwycięstwem drugiej.
8. Jeżeli gracz żyje, rozlicz leczenie, zysk skupienia i rezonans. Jeżeli rezonans pokona rywala, zakończ zwycięstwem gracza.
9. Nałóż nowe statusy, które nie zostały natychmiast zużyte.
10. Zmniejsz cooldowny istniejące przed turą. Cooldown Ansuz ustawiony w tej turze nie może od razu spaść.
11. Jeżeli nikt nie wygrał, zwiększ numer tury i wygeneruj kolejny zamiar.
12. Po turze 10 rozstrzygnij limit tur.

Przy limicie tur:

- wygrywa strona z wyższym procentem pozostałego HP;
- przy równym procencie wygrywa strona z wyższym skupieniem;
- jeżeli również skupienie jest równe, wynik to remis;
- zwycięstwo przez werdykt sędziowski kwalifikuje się do nagrody, ale otrzymuje niższy wynik ze względu na brak premii za szybkość.

## Rywale

Każdy przeciwnik używa tych samych legalnych akcji i nie może czytać aktualnego wyboru gracza. Serwer ustala jego zamiar przed otrzymaniem akcji gracza. Zamiar jest pokazywany dokładnie, nie jako zwodnicza wskazówka.

| Id | Imię i tytuł | Styl | Zdolność specjalna |
|---|---|---|---|
| `yrsa` | Yrsa Lodowa Strażniczka | Defensywna; częściej używa Isa po silnym trafieniu, ładuje skupienie i karze powtarzany atak | Pierwszy Thurisaz otrzymany w walce zadaje jej o 6 mniej obrażeń |
| `hakon` | Hakon Żarząca Pięść | Agresywny; często atakuje, używa Ansuz tylko przy niskim skupieniu i dąży do Tyr | Jego pierwszy udany Thurisaz zadaje dodatkowe 5 obrażeń |
| `vala` | Vala Kruczego Cienia | Kontrolna; buduje sekwencję Ansuz → Nauthiz i poluje na Isa | Pierwszy skuteczny Nauthiz nakłada `Odsłonięty` oraz odbiera 8 skupienia |
| `eirik` | Eirik Czarnoruny, Mistrz Kręgu | Adaptacyjny; ocenia dwie ostatnie akcje gracza i wybiera ważoną kontrę, ale decyzję podejmuje przed ruchem gracza | Raz przy HP ≤ 35 otrzymuje 12 skupienia; nie leczy się automatycznie |

Wymagania AI:

- Dla każdej postaci zdefiniuj jawne wagi bazowe, progi oraz priorytety w danych, nie w JSX.
- AI najpierw wybiera akcję wygrywającą natychmiast, potem unika akcji prowadzącej do natychmiastowej porażki, następnie stosuje profil postaci.
- AI nigdy nie wybiera akcji bez wymaganego skupienia, na cooldownie albo zużytego Tyr.
- Przy kilku równoważnych akcjach korzysta z seeded RNG zapisanej sesji.
- Eirik może reagować na historię wcześniejszych akcji, ale nie może znać akcji wybranej przez gracza w bieżącej turze.
- Zapisuj `aiDecisionReason` do dziennika technicznego sesji, ale nie pokazuj go jako surowych danych użytkownikowi.

## Wynik pojedynku

Wynik jest liczony tylko dla zwycięstwa i mieści się w zakresie `0–1000`:

```text
wynik = 500
      + (pozostałe HP gracza × 3)
      + (maks. 0, 10 - liczba rozegranych tur) × 20
      + premia 20 za co najmniej jeden Runiczny Rezonans
```

- Wynik końcowy ogranicz do 1000.
- Porażka i remis mają wynik 0 na potrzeby nagrody.
- Liczba rozegranych tur to numer ostatniej w pełni rozliczonej tury.
- Bonus rezonansu jest stały i nalicza się najwyżej raz, nawet jeśli gracz uruchomił rezonans kilka razy.
- W UI pokaż rozpisane składniki wyniku, nie tylko jedną liczbę.

## Nagrody i limity punktowe

| Wynik zwycięstwa | Ranga | Punkty Zakonu | Skirniry |
|---:|---|---:|---:|
| 500–649 | Ocalały Kręgu | 4 | 3 |
| 650–799 | Runiczny Szermierz | 7 | 5 |
| 800–899 | Strażnik Bazaltu | 10 | 8 |
| 900–1000 | Mistrz Kręgu | 12 | 10 |

Twarde reguły:

1. Maksymalnie 3 nagradzane próby dziennie i najwyżej 1 wypłata za zwycięstwo dziennie.
2. Maksimum dzienne wynosi więc **12 punktów Zakonu i 10 Skirnirów**.
3. Porażka, remis, wygaśnięcie i porzucenie nie dają nagrody, ale po pierwszej akcji zużywają próbę.
4. Po wykorzystaniu trzech prób lub po odebraniu zwycięskiej nagrody wszystkie kolejne walki działają jako trening.
5. Nie przyznawaj nagrody minimalnej za sam udział.
6. Skirniry może dostać wyłącznie zalogowany użytkownik o prawidłowym identyfikatorze.
7. Punkty Zakonu przyznawaj wyłącznie wtedy, gdy Zakon użytkownika istnieje w bazie. Brak Zakonu nie blokuje należnych Skirnirów.
8. Nigdy nie podstawiaj Ravnheimu ani innego Zakonu jako fallbacku.
9. Klient nie wysyła wiążącego wyniku, HP, zwycięzcy, wartości nagrody ani Zakonu.
10. Przy niedostępnym serwerze walka może działać jako trening, ale wypłaty są wyłączone i użytkownik widzi to przed startem.

Przykładowe komunikaty:

- `Zwycięstwo: Strażnik Bazaltu — +10 pkt Zakonu i +8 Skirnirów.`
- `Nie należysz jeszcze do Zakonu: otrzymujesz +8 Skirnirów bez punktów Zakonu.`
- `Nagroda dnia została już zdobyta — ten pojedynek był treningowy.`
- `Wykorzystano 3/3 prób dnia. Nadal możesz walczyć treningowo.`
- `Próba została porzucona po rozpoczęciu i zużyła dzienny slot.`
- `Nie udało się potwierdzić tury. Stan walki został odświeżony z serwera.`

## Serwer jako źródło prawdy

Nagradzanej walki nie rozliczaj przez wywołania `awardHousePoints()` i `addCurrency()` z komponentu. Dodaj małą, dedykowaną trasę, np. `server/routes/runicDuels.js`, i metody w `src/api.js`.

### Operacje API

1. `GET /api/runic-duels/status`
   - zwraca `dateKey`, rywala dnia, `attemptsUsed`, `attemptsLimit`, `rewardClaimed`, aktywną pustą sesję, rekord oraz 5 ostatnich ukończonych walk;
   - wymaga sesji dla danych prywatnych, ale może zwrócić publiczną konfigurację rywala dnia anonimowemu użytkownikowi.
2. `POST /api/runic-duels/start`
   - przyjmuje `clientRunId`, `mode` i opcjonalny `opponentId` wyłącznie dla treningu;
   - serwer pobiera użytkownika z `req.user`, wybiera rywala dnia, zapisuje seed i `rulesVersion`;
   - nie zużywa slotu przed pierwszą akcją;
   - powtórzenie z tym samym `clientRunId` zwraca tę samą sesję.
3. `POST /api/runic-duels/:runId/actions`
   - przyjmuje tylko `actionId`, `turnNumber` i `playerAction`;
   - w transakcji ustala wcześniej przygotowany zamiar AI, waliduje ruch, rozlicza turę, zapisuje jej stan i przygotowuje następny zamiar;
   - pierwsza poprawna akcja nagradzanej sesji rezerwuje dzienny slot;
   - zwraca autorytatywny stan po turze, wynik zdarzeń do animacji, następny zamiar i ewentualne zakończenie;
   - powtórzenie tego samego `actionId` zwraca poprzednio zapisany rezultat bez ponownego wykonania tury.
4. `POST /api/runic-duels/:runId/abandon`
   - idempotentnie oznacza aktywną walkę jako `abandoned`;
   - pusta walka nie zużywa slotu; walka po pierwszej akcji zachowuje zużyty slot.
5. Opcjonalnie `GET /api/runic-duels/:runId`
   - pozwala odzyskać autorytatywny stan po zerwanym połączeniu lub odświeżeniu.

### Model danych

Tabela `runic_duel_runs` powinna zawierać co najmniej:

- `run_id` jako klucz główny;
- `client_run_id` z unikalnością w obrębie użytkownika;
- `user_id`, `date_key`, `mode`, `status`, `rules_version`, `seed`;
- `opponent_id`, `attempt_reserved`, `turn_number`;
- aktualne HP, skupienie, cooldowny, statusy, użycie Tyr i łańcuch rezonansu obu stron;
- `current_enemy_intent` ustalony przed ruchem gracza;
- `result`: `player_win`, `enemy_win`, `draw`, `abandoned`, `invalid`;
- `win_reason`, `score`, `rank`;
- `reward_eligible`, `reward_reason`, `reward_points`, `reward_skirnirs`;
- `started_at`, `first_action_at`, `last_action_at`, `completed_at`.

Tabela `runic_duel_turns` powinna zawierać co najmniej:

- `id` jako stabilny identyfikator zapisu;
- `run_id`, `turn_number`, `action_id`;
- `player_action`, `enemy_action`, `ai_decision_reason`;
- stan przed i po turze albo wystarczający dziennik zdarzeń do audytu;
- `created_at`;
- unikalność `(run_id, turn_number)` oraz `(run_id, action_id)`.

Dodaj indeks po `user_id + date_key` i zabezpiecz limit w transakcji, również dla dwóch równoczesnych żądań. `date_key` licz na serwerze w `Europe/Warsaw`, z uwzględnieniem zmiany czasu letniego i zimowego.

### Atomowa wypłata i idempotencja

Końcowe rozliczenie nagradzanej walki wykonaj w jednej transakcji:

- zapisz nieodwracalny stan końcowy i wynik;
- wylicz nagrodę wyłącznie na serwerze;
- sprawdź, czy nagroda dnia nie została już odebrana;
- użyj istniejącego centralnego serwisu punktów z kluczem `runic-duel:${runId}:points`;
- użyj istniejącego serwisu Skirnirów z kluczem `runic-duel:${runId}:currency`;
- zapisz wypłacone wartości w rekordzie sesji.

Jeżeli dowolna część operacji się nie powiedzie, całość ma zostać wycofana. Ponowne żądanie dla zakończonej sesji zwraca dokładnie poprzedni rezultat i nie tworzy kolejnej transakcji.

Nie ufaj `userId`, `house`, `score`, `reward`, HP, skupieniu, intencji AI, numerowi próby, czasowi urządzenia ani zwycięzcy przesłanemu przez klienta.

## Utrata połączenia, czas i wznowienie

- Po kliknięciu akcji pokaż stan oczekiwania, ale nie zmieniaj wiążącego HP przed odpowiedzią serwera w Próbie dnia.
- Jeżeli żądanie nie ma odpowiedzi, pozwól użyć `Ponów sprawdzenie`, wysyłając ten sam `actionId`.
- Nie twórz nowego `actionId` dla ponowienia tej samej decyzji.
- Po odpowiedzi 409 lub konflikcie stanu pobierz aktualną sesję i zsynchronizuj UI.
- Pusta sesja może być wznowiona przez 5 minut. Sesja bez aktywności przez 15 minut po pierwszej akcji otrzymuje status `abandoned` i zachowuje zużyty slot.
- Po odświeżeniu aktywna, niewygasła walka może zostać wznowiona dokładnie od stanu serwera.
- Po północy nowy limit dotyczy nowych sesji; rozpoczęta wcześniej walka zachowuje swój `date_key`.
- Każdy timeout animacji musi zostać wyczyszczony po zamknięciu, restarcie i odmontowaniu.

## Interfejs i użycie grafik

W projekcie znajdują się dwa gotowe assety:

- `/runiczny-krag-pojedynkow/arena-bazaltowa.png` — szeroki baner i tło pola walki;
- `/runiczny-krag-pojedynkow/portrety-rywali.png` — arkusz 2×2: Yrsa, Hakon, Vala, Eirik, czytani od lewej do prawej i od góry do dołu.

Nie dodawaj tekstu do bitmap. Wszystkie nazwy, statusy, punkty i banery tekstowe mają pozostać HTML-em.

Arkusz portretów wykorzystaj przez cztery klasy z `background-size: 200% 200%` i pozycjami:

- Yrsa: `0% 0%`;
- Hakon: `100% 0%`;
- Vala: `0% 100%`;
- Eirik: `100% 100%`.

Jeśli przy tych pozycjach twarze są zbyt ciasno kadrowane w konkretnym komponencie, dopracuj `background-position` o kilka procent, ale nie twórz nowych kopii pliku.

### Układ

- Nagłówek: nazwa aktywności, tryb, licznik prób `X/3`, przycisk `Zasady` i zamknięcie.
- Intro: szeroki, przyciemniony baner areny, karta Próby dnia, cztery mniejsze karty rywali treningowych i ostatnie wyniki.
- Pole walki: portret gracza jako kodowa runiczna sylwetka lub herb Zakonu po lewej, portret rywala po prawej, arena w tle.
- Przy każdej stronie pokaż HP, skupienie, aktywne statusy i pieczęć Tyr.
- Zamiar rywala pokaż nad akcjami: nazwa, ikona, dokładny efekt oraz krótka podpowiedź kontry. Nie polegaj wyłącznie na kolorze.
- Pięć akcji ma być kartami z kosztem, efektem, cooldownem i wyraźnym stanem blokady.
- Łańcuch rezonansu pokaż jako trzy gniazda pod kartami akcji.
- Kronika starcia pokazuje ostatnie 6 zdarzeń, najnowsze na górze.
- Wynik pokazuje powód zakończenia, rozpisane punkty, rangę, nagrodę, pozostałe próby oraz przyciski `Walcz treningowo` i `Wróć do Kręgu`.

### Banery kodowe

Na tle grafiki areny dodaj lekkie banery HTML/CSS:

- `Próba dnia • [imię rywala]` przy rozpoczęciu;
- `Runiczny Rezonans` po uruchomieniu kombinacji;
- `Zwycięstwo w Kręgu`, `Werdykt Sędziowski`, `Remis Run` albo `Krąg Pokonany` na końcu.

Baner może używać gradientu, cienkiej złotej ramki i ornamentu z ikon `lucide-react`. Tekst nie może być częścią obrazka.

## Animacje ruchów

- Otwarcie modala: opacity i skala `0.985 → 1` przez 200–240 ms.
- Wejście banera: łagodne przesunięcie maksymalnie 12 px przez 260–320 ms.
- Thurisaz: portret wykonującego przesuwa się do środka maksymalnie o 8 px, a przez arenę przechodzi jeden czerwono-złoty łuk.
- Isa: wokół portretu pojawia się lodowy pierścień przez maksymalnie 360 ms.
- Nauthiz: krótka fioletowa smuga i znak więzów na celu; bez migotania całego ekranu.
- Ansuz: spokojny niebiesko-złoty oddech światła i unoszące się `+6 HP` lub `+28 skupienia`.
- Tyr: pojedyncze złote cięcie i mocniejszy, ale krótki błysk; bez potrząsania całym modalem.
- Trafienie: unosząca się liczba obrażeń i jeden błysk 140–180 ms.
- Rezonans: trzy runy łączą się cienką linią, maksymalnie 18 lekkich cząstek, całość do 600 ms.
- Zmiany pasków: płynne przejście szerokości 220–280 ms.
- Postacie nie muszą mieć klatkowej animacji. Ruch portretu, CSS-owy łuk, pierścień i liczby obrażeń wystarczą.
- Cząstki mają stabilne klucze i są usuwane po zakończeniu.
- Logika nie czeka na `animationend`; timeout prezentacji nie może ponownie rozliczać tury.

Dla `prefers-reduced-motion: reduce` wyłącz przesunięcia portretów, cząstki, pulsowanie i ekranowe błyski. Zostaw natychmiastową zmianę ikon, tekstów, HP i wyniku. Tryb ograniczonego ruchu nie może zmieniać czasu ani zasad.

Dźwięki uruchamiaj wyłącznie przez istniejący `SoundContext`, respektując wyciszenie. Jedna tura może odtworzyć najwyżej jeden dźwięk akcji i jeden dźwięk rezultatu. Nie dodawaj nowych plików audio ani autoplay.

## Responsywność i dostępność

- Modal ma działać od 360 px do desktopu i nie przekraczać `94dvh`.
- Na telefonie pole walki układa portrety obok siebie w zwartej sekcji, a karty akcji przechodzą do jednej kolumny lub czytelnej siatki 2×2 z Tyr na całą szerokość.
- Tło areny nie może wypierać treści; przy małej szerokości użyj ciemniejszego gradientu i bezpiecznego kadrowania.
- Każda kontrolka ma obszar co najmniej 44×44 px, widoczny focus i tekstowy opis stanu.
- Modal ma `role="dialog"`, `aria-modal="true"`, nazwę przez `aria-labelledby`, przechwycenie fokusu, obsługę `Escape` i zwrot fokusu do elementu otwierającego.
- Obszar walki ma `aria-busy="true"` podczas zapisu i rozstrzygania.
- HP i skupienie używają `role="progressbar"`, `aria-valuemin`, `aria-valuemax` i `aria-valuenow`, a wartości są też zapisane tekstem.
- Nowy zamiar rywala i końcowy wynik ogłaszaj przez `aria-live="polite"`. Nie odczytuj całej kroniki po każdej turze.
- Kolor nie jest jedynym komunikatem. Status ma ikonę, nazwę i krótki opis.
- Zablokowany przycisk akcji ma `disabled` oraz widoczny powód; sama niższa opacity nie wystarcza.
- Podczas animacji żaden przycisk walki nie może przyjmować kolejnego kliknięcia, Enter ani Spacji.
- Teksty mają być po polsku, bez literówek. Używaj nazwy `Skirniry` oraz poprawnej odmiany liczebników.

## Organizacja kodu i granice zmian

- Zachowaj publiczny kontrakt `RunicDuelModal({ isOpen, onClose })`.
- Główny komponent pozostaje w `src/components/RunicDuelModal.jsx`.
- Utwórz `src/components/RunicDuelModal.css`; wszystkie klasy prefiksuj `rdm-`.
- Wydziel czyste, wersjonowane reguły i konfigurację rywali do małego modułu współdzielonego przez klienta i serwer, np. `src/game/runicDuelRules.js` albo neutralnego katalogu zgodnego z obecną konfiguracją ESM.
- Dodaj tylko dedykowaną trasę, potrzebne tabele/migracje oraz metody w `src/api.js`.
- Zarejestruj trasę w `server/index.js` w spójny sposób z istniejącymi trasami.
- Skorzystaj z istniejących `pointsService` i `skirnirService`; nie buduj równoległej ekonomii.
- Nie refaktoryzuj `SchoolContext`, innych minigier, sidebara, systemu logowania ani design systemu przy okazji.
- Nie instaluj nowych bibliotek. Użyj Reacta, CSS, `lucide-react`, istniejących kontekstów i SQLite.
- Nie dodawaj zewnętrznych URL-i do obrazów i nie zastępuj dołączonych assetów emoji.
- Nie maskuj błędów pustym `catch`; pokaż spokojny komunikat i zachowaj możliwość bezpiecznego ponowienia.
- Nie usuwaj ani nie nadpisuj cudzych, niezwiązanych zmian w repozytorium.

## Walidacje obowiązkowe

Serwer musi odrzucić albo idempotentnie obsłużyć:

1. akcję użytkownika niezalogowanego w sesji nagradzanej;
2. sesję należącą do innego użytkownika;
3. nieistniejący `runId`, `actionId`, rywal lub identyfikator akcji;
4. numer tury inny niż oczekiwany;
5. drugą akcję dla tej samej tury;
6. powtórzone `actionId` — ma zwrócić zapisany wynik, nie wykonać ruch ponownie;
7. akcję przy niewystarczającym skupieniu;
8. Ansuz na cooldownie albo drugie użycie Tyr;
9. akcję po zakończeniu, porzuceniu lub wygaśnięciu sesji;
10. zmianę rywala w trakcie walki;
11. próbę rozpoczęcia czwartej nagradzanej walki danego dnia;
12. próbę odebrania drugiej nagrody dnia;
13. nieprawidłowy lub nieistniejący Zakon — bez przypisania fallbacku;
14. wynik, HP, skupienie, nagrodę lub zamiar AI przesłany jako wartość wiążąca przez klienta;
15. nienaturalną serię równoczesnych żądań — transakcja i unikalne indeksy muszą zostawić jeden wynik.

Nie opisuj tego jako kompletnego anty-cheatu. Celem jest serwerowa spójność reguł, limitów, kolejności tur i ekonomii oraz odporność na proste manipulowanie klientem.

## Minimalne testy

Dodaj testy czystej logiki i tras serwera w stylu istniejącego `node:test`.

1. Każda para podstawowych akcji daje dokładne obrażenia z tabeli.
2. Thurisaz i Tyr poprawnie anulują Nauthiz w dozwolonych zestawieniach.
3. Isa redukuje Thurisaz do 6 i odbija dokładnie 5, ale nie odbija Tyr.
4. Ansuz przeciw Thurisaz nie leczy i nie daje skupienia; przeciw Nauthiz daje 14 skupienia i leczy 6.
5. Skupienie zawsze pozostaje w zakresie 0–100, a HP w zakresie 0–100.
6. Nie można wybrać akcji bez kosztu, na cooldownie ani użyć Tyr drugi raz.
7. Cooldown Ansuz nie spada w turze użycia i kończy się po dwóch pełnych kolejnych turach.
8. `Odsłonięty` wzmacnia tylko następny Thurisaz albo Tyr, nie stackuje się i znika po użyciu.
9. Każda permutacja trzech różnych run podstawowych uruchamia dokładnie jeden rezonans; duplikat nie uruchamia go.
10. Rezonans nie uruchamia się po śmierci gracza w zwykłym rozliczeniu.
11. Jednoczesne 0 HP kończy się remisem i bez nagrody.
12. Pokonany rywal nie otrzymuje leczenia ani nie generuje kolejnego zamiaru.
13. Limit 10 tur rozstrzyga HP, potem skupienie, a pełny remis pozostaje remisem.
14. Każdy profil AI generuje tylko legalne akcje i nie korzysta z aktualnego wyboru gracza.
15. Ten sam seed, stan i historia dają ten sam zamiar AI.
16. Wynik ma poprawne składniki, nie spada poniżej 0 i nie przekracza 1000.
17. Granice nagród: 649/650, 799/800 i 899/900.
18. Trzecia nagradzana próba w Warszawie jest dozwolona, czwarta nie jest rezerwowana.
19. Dwa równoczesne rozpoczęcia pierwszej akcji nie rezerwują dwóch slotów.
20. Powtórzone `actionId` nie zmienia HP, tury, wyniku ani skupienia.
21. Ponowne wywołanie kończącej akcji daje jedną wypłatę punktową i jedną bankową.
22. Drugie zwycięstwo tego samego dnia jest treningowe i nie wypłaca nagrody.
23. Porażka, remis, wygaśnięcie i porzucenie po pierwszej akcji zużywają próbę bez nagrody.
24. Zamknięcie pustej sesji nie zużywa próby.
25. Użytkownik bez Zakonu nie dostaje punktów fikcyjnego Zakonu, ale zachowuje należne Skirniry.
26. Błąd wypłaty wycofuje stan końcowy i wszystkie zapisy ekonomiczne albo pozostawia jednoznaczny stan możliwy do bezpiecznego ponowienia.
27. `date_key` działa poprawnie przy północy oraz zmianie czasu letniego i zimowego w `Europe/Warsaw`.
28. Zamknięcie, restart i odmontowanie nie pozostawiają timeoutów ani listenerów.
29. `npm test` i `npm run build` kończą się bez błędów.

## Kryteria odbioru

Implementacja jest gotowa dopiero, gdy:

1. Gracz zna dokładny zamiar rywala przed wyborem i może świadomie skontrować akcję.
2. Pięć akcji różni się kosztem, zastosowaniem i ryzykiem, a UI jasno pokazuje ich legalność.
3. Rezonans działa według jednej, testowalnej reguły i jest czytelny bez tutoriala wideo.
4. Każdy z czterech rywali ma odmienny profil, własny portret i jedną zdolność specjalną.
5. AI nie czyta bieżącego wyboru gracza i nigdy nie wykonuje nielegalnego ruchu.
6. Szybkie kliknięcia, ponowienie żądania i React Strict Mode nie rozliczają tury ani nagrody drugi raz.
7. Serwer jest źródłem prawdy dla HP, skupienia, intencji, wyniku, limitu i wypłaty Próby dnia.
8. Trzy próby oraz jedna nagroda dziennie są trwałe i odporne na odświeżenie oraz równoczesne żądania.
9. Maksymalna wypłata dzienna to 12 pkt Zakonu i 10 Skirnirów.
10. Brak Zakonu nigdy nie daje punktów Ravnheimowi ani innemu domyślnemu Zakonowi.
11. Porażka, remis, werdykt, porzucenie, wygaśnięcie i utrata połączenia mają jednoznaczne stany.
12. Obie grafiki są użyte zgodnie z przeznaczeniem, bez tekstu wypalonego w bitmapie.
13. Animacje ruchów są lekkie, nie sterują logiką i mają pełny wariant `reduced-motion`.
14. Modal działa przy 360 px, na desktopie, myszą, dotykiem i klawiaturą.
15. Build i wszystkie testy przechodzą, a pozostałe minigry pozostają niezmienione.

## Oczekiwany raport Claude po wdrożeniu

Na końcu pracy podaj krótko i konkretnie:

- listę zmienionych i dodanych plików;
- model jednej tury i kolejność rozliczenia;
- profile czterech przeciwników;
- wzór wyniku oraz progi nagród;
- sposób rezerwacji trzech prób i blokady drugiej wypłaty dnia;
- sposób zapewnienia idempotencji `runId`, `actionId`, punktów i Skirnirów;
- zachowanie po zamknięciu, odświeżeniu i utracie połączenia;
- sposób wykorzystania banera i arkusza portretów;
- wykonane testy wraz z wynikiem.

Nie ogłaszaj ukończenia, jeżeli nagrody nadal są przyznawane z komponentu, limit istnieje tylko w stanie Reacta albo `localStorage`, zamiar AI powstaje dopiero po odczytaniu ruchu gracza lub tę samą turę można rozliczyć więcej niż raz.

## Prompty źródłowe użytych grafik

### Arena Bazaltowa

```text
Use case: stylized-concept
Asset type: wide game modal banner/background for the existing Durmstrang web portal
Primary request: a cinematic basalt runic dueling arena inside a severe northern magical fortress, designed as a wide background behind HTML UI
Scene/backdrop: circular black basalt floor engraved with restrained glowing Elder Futhark-inspired runes, icy stone walls, two opposing archways, thin drifting snow and cold mist, distant iron braziers, subtle magical duel trails crossing at center
Subject: empty arena, no people, with a readable central fighting circle and dark side areas suitable for overlaid portraits and interface text
Style/medium: polished dark-fantasy game environment concept art, grounded painterly realism
Composition/framing: very wide 3:1 banner, symmetrical low eye-level view, central vanishing point, strong negative space, important details kept away from edges for responsive cropping
Lighting/mood: cold blue moonlight plus muted antique-gold rune glow, ominous but elegant
Color palette: charcoal, basalt black, deep navy, glacial blue, restrained old gold
Constraints: no text, no letters, no logos, no watermark, no UI panels, no border, no combatants
```

### Portrety rywali

```text
Use case: stylized-concept
Asset type: 2x2 game character portrait sprite sheet for a dark Nordic magic dueling interface
Primary request: exactly four distinct original opponents for a basalt runic dueling arena, one character per equal square cell
Subjects: frost warder with ice shield; northern flame duelist; spectral raven seer; veteran rune champion in obsidian armor
Style/medium: cohesive polished dark-fantasy game portraits, painterly realism, original character design, consistent camera and rendering
Composition/framing: clean 2x2 grid, four equal square cells, chest-up three-quarter portraits, identical scale and eye line, no overlap
Lighting/mood: cold blue rim light with restrained ice-blue, ember-red, spectral-violet and antique-gold accents
Constraints: no text, no labels, no logos, no watermark, no UI frames, no additional people, no cropped heads, no duplicate faces
```
