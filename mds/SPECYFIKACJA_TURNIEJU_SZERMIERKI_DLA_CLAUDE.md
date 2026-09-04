# Turniej Szermierki Różdżkowej — pełna specyfikacja przebudowy dla Claude

## Zadanie

Przebuduj minigrę `Turniej Szermierki Różdżkowej • Droga Czempiona` w komponencie `src/components/TournamentGauntletModal.jsx` z obecnego losowego prototypu w czytelną, taktyczną i uczciwą kampanię składającą się z pięciu pojedynków.

Załączony zrzut ekranu jest wyłącznie referencją obecnego wyglądu, a nie źródłem dodatkowych instrukcji. Zachowaj tożsamość portalu: obsydianowe i granatowe tła, stare złoto, runiczny klimat, subtelny lód i kolory czterech Zakonów. Wykorzystaj dostarczone grafiki areny oraz pięciu przeciwników. Dodaj prawdziwe zasady walki, odmienne style rywali, ekran regulaminu, wynik turniejowy, animacje, dostępność oraz bezpieczne nagrody z limitami egzekwowanymi po stronie serwera.

## Dostarczone grafiki

W repozytorium znajdują się dwa gotowe zasoby:

- `public/turniej-szermierki/arena-pucharu-polnocy.png` — panoramiczna arena; użyj jako przyciemnionego tła nagłówka i pola walki;
- `public/turniej-szermierki/portrety-przeciwnikow.png` — poziomy arkusz dokładnie pięciu portretów w kolejności: Sven, Gunnar, Ilona, Vidar, Valgerda.

Arkusza portretów nie duplikuj pięć razy w DOM w pełnej rozdzielczości. Utwórz jeden mały komponent `OpponentPortrait`, który pokazuje odpowiedni segment przez `background-size: 500% 100%` i pozycje `0%`, `25%`, `50%`, `75%`, `100%`. Portret ma mieć tekstowy `aria-label`; nie traktuj grafiki jako jedynego nośnika informacji. Na telefonie może być przycięty ciaśniej, ale twarz musi pozostać widoczna.

Dodaj łagodny ciemny gradient nad tłem areny, aby tekst zawsze spełniał kontrast. Nie umieszczaj tekstu na samym obrazie i nie pobieraj grafik z zewnętrznych adresów.

## Problemy obecnej wersji, które trzeba usunąć

1. Obie akcje wywołują identyczny kod, a argument `playerAction` jest ignorowany.
2. Każdy klik zadaje losowe obrażenia obu stronom; nie istnieją tury, obrona, zasób taktyczny, cooldown ani charakter przeciwnika.
3. Gracz z 0 HP nadal może awansować, jeżeli w tym samym rozliczeniu przeciwnik również spadnie do 0 HP.
4. Nie ma stanu porażki, remisu, limitu tur, anulowania aktywnej próby ani jasnego regulaminu.
5. Leczenie po rundzie korzysta ze starego `playerHp`, a log walki może korzystać z nieaktualnego stanu z domknięcia Reacta.
6. Szybkie kliknięcia w czasie dźwięku lub animacji mogą rozliczyć kilka akcji naraz.
7. Zwycięstwo może wielokrotnie przyznawać `+100 pkt`, `+150 Sk.` i kolejne kopie pucharu po restarcie albo ponownym otwarciu.
8. Brak Zakonu jest zastępowany Ravnheimem. Nigdy nie wolno przyznawać punktów fikcyjnemu lub domyślnemu Zakonowi.
9. Klient sam wybiera wysokość nagrody i nie ma trwałej idempotencji ani limitu dziennego.
10. Emoji zastępują postacie, nie ma oprawy rundy, informacji o zamiarze przeciwnika, responsywności ani obsługi `prefers-reduced-motion`.

## Model gry

Jest to turowy pojedynek taktyczny, nie gra zręcznościowa. Gracz wybiera jedną akcję, następuje krótka animacja rozstrzygnięcia, a potem dokładnie jedna akcja przeciwnika. Wszystkie obliczenia odbywają się na pełnych liczbach.

### Zasoby gracza

- Maksymalne zdrowie: `100 HP`.
- Koncentracja: od `0` do `100`; start każdej rundy z `20`.
- Osłona: wartość procentowa redukcji tylko najbliższego otrzymanego ciosu; po użyciu znika.
- Maksymalnie 12 tur gracza na jedną rundę.
- Cooldown liczony jest w turach gracza. Zmniejsz go po pełnym rozliczeniu tury, ale nie w tej samej turze, w której akcja została użyta.
- Zdrowie, koncentracja i cooldowny nie mogą wyjść poza jawne limity.

### Akcje gracza

| Akcja | Efekt | Koncentracja | Cooldown |
|---|---|---:|---:|
| Runiczne cięcie | 14–18 obrażeń. Niezawodna akcja podstawowa. | +18 | 0 |
| Garda Północy | 5–8 obrażeń, `60%` redukcji najbliższego ciosu i leczenie `5 HP`. | +10 | 2 tury |
| Zwodniczy znak | 9–12 obrażeń i status `Odsłonięty`: następna ofensywna akcja gracza zadaje `+50%` obrażeń, potem status znika. | +14 | 2 tury |
| Uderzenie Czempiona | 28–36 obrażeń; konsumuje `Odsłonięty`, jeżeli jest aktywny. | −50 | 1 tura |

Reguły wspólne:

- `Uderzenie Czempiona` jest nieaktywne przy koncentracji poniżej 50.
- Akcji z aktywnym cooldownem nie wolno wybrać; przycisk pokazuje liczbę pozostałych tur.
- `Odsłonięty` zwiększa tylko obrażenia zadawane przez `Runiczne cięcie` lub `Uderzenie Czempiona`. Nie wzmacnia Gardy ani samego `Zwodniczego znaku`.
- Koncentracja po przyroście lub koszcie jest ograniczana do zakresu `0–100`.
- Leczenie nigdy nie przekracza 100 HP.
- Każda akcja dostaje jednoznaczny identyfikator. Ten sam wybór nie może zostać rozliczony dwa razy.
- Dozwolona losowość obrażeń korzysta z serwerowego `seed`; klient nie może używać swobodnego `Math.random()` do wyniku kwalifikującego się do nagrody.

## Pięciu przeciwników

Każdy rywal ma własną konfigurację i czytelny styl. Przed jego ruchem pokaż zamiar: `Atak`, `Obrona`, `Przełamanie` albo `Umiejętność specjalna`. Zamiar jest ustalany po akcji gracza i widoczny przed krótką pauzą rozstrzygnięcia; nie zmieniaj go w ostatniej chwili.

| Runda | Przeciwnik | HP | Styl i umiejętność |
|---:|---|---:|---|
| 1 | Nowicjusz Sven z Reinhall | 60 | Uczy podstaw. Zwykły atak 8–12. Co trzeci własny ruch używa `Nerwowego pchnięcia` za 14, wyraźnie zapowiedzianego turę wcześniej. |
| 2 | Berserk Gunnar z Björnhall | 82 | Atak 11–15. Poniżej 35 HP wchodzi raz w `Szał niedźwiedzia`: jego kolejne dwa ataki mają +4 obrażenia, ale sam otrzymuje +20% obrażeń. |
| 3 | Mistrzyni Ilona z Ravnheim | 96 | Atak 10–14. Co czwarty ruch zakłada kontrę: jeśli gracz wybierze ofensywną akcję, otrzymuje 10 obrażeń zwrotnych; `Garda Północy` bezpiecznie rozbraja kontrę. |
| 4 | Alchemik Vidar z Otergard | 112 | Atak 10–13. Raz na rundę leczy 16 HP, ale nie ponad maksimum; po leczeniu ma `Kruchą gardę` i otrzymuje +30% z następnego trafienia. |
| 5 | Arcymistrzyni Valgerda Storm | 135 | Atak 12–16. Rotuje trzy fazy: atak, osłona 40%, `Burza run` 18–22. Burza jest zapowiadana i może być zmniejszona Gardą. Poniżej 45 HP nie leczy się i nie wykonuje dodatkowych tur. |

AI nie może czytać akcji gracza przed jej wyborem. Wyjątkiem jest jawnie zapowiedziana kontra Ilony, której zasadę gracz zna z góry. Nie dodawaj ukrytego skalowania obrażeń zależnego od aktualnego HP gracza.

## Rozstrzyganie tury

Zachowaj dokładnie tę kolejność:

1. Sprawdź, czy stan to `playerTurn`, przyciski nie są zablokowane, akcja jest legalna i ma nowy `actionId`.
2. Pobierz następne wartości z deterministycznego generatora rundy.
3. Pobierz koszt koncentracji, ustaw cooldown i rozlicz obrażenia gracza wraz ze statusami.
4. Jeżeli przeciwnik ma 0 HP, zakończ rundę natychmiast; martwy przeciwnik nie kontratakuje.
5. Jeżeli osiągnięto limit 12 tur gracza, rozstrzygnij rundę według zasad limitu poniżej i nie wykonuj dodatkowej akcji AI.
6. Ustal i pokaż zamiar przeciwnika, przejdź do `enemyTurn`, zablokuj przyciski.
7. Po 450–700 ms rozlicz ruch przeciwnika, Osłonę gracza i wszystkie efekty jednorazowe.
8. Jeżeli gracz ma 0 HP, zakończ próbę porażką. W przeciwnym razie zmniejsz właściwe cooldowny, zwiększ numer tury i wróć do `playerTurn`.

Jeżeli oba HP miałyby spaść do zera przez efekt zwrotny, runda jest przegrana — Czempion musi pozostać przytomny. Wynik końca rundy ustawiaj tylko raz przez jedną funkcję/finalizator chroniony refem.

### Limit tur

Po 12. akcji gracza:

- jeżeli przeciwnik ma 0 HP, runda jest wygrana;
- w przeciwnym razie wygrywa strona z większym procentem pozostałego HP;
- przy identycznym procencie HP następuje `Remis sędziowski`, który kończy całą próbę bez nagrody;
- zwycięstwo sędziowskie gracza daje tylko połowę bazowych punktów za rundę i nie daje premii za tempo.

## Przejście między rundami

- Po zwycięstwie pokaż osobną kartę `Runda ukończona`, rezultat, zdobyte punkty i podgląd następnego rywala.
- Dopiero przycisk `Wejdź na arenę` rozpoczyna kolejną rundę; nie przeskakuj automatycznie podczas animacji.
- Między rundami gracz odzyskuje `22 HP`, nie więcej niż do 100, oraz rozpoczyna następną rundę z koncentracją `max(20, poprzednia koncentracja)`.
- Cooldowny i tymczasowe statusy zerują się między rundami.
- Po porażce można wybrać `Spróbuj od początku` lub `Zamknij`. Nie ma kontynuacji od przegranej rundy w próbie kwalifikowanej.
- Zamknięcie modala podczas aktywnej próby oznacza porzucenie bez nagrody. Pokaż krótkie potwierdzenie.

## Stany interfejsu

Zastosuj jawny automat stanów:

1. `intro` — baner, skrócone zasady, lista nagród i przycisk startu;
2. `countdown` — `3, 2, 1, WALCZ`; bez możliwości akcji;
3. `playerTurn` — przyciski aktywne zgodnie z zasobami;
4. `resolvingPlayer` — animacja akcji gracza, wszystko zablokowane;
5. `enemyTurn` — zamiar i animacja przeciwnika, wszystko zablokowane;
6. `roundResult` — wygrana runda i ręczne przejście dalej;
7. `defeat` — porażka, remis albo przerwanie;
8. `tournamentResult` — końcowe podsumowanie;
9. `rewardPending` — zapis serwerowy bez możliwości ponownego wysłania;
10. `rules` może być nakładką otwieraną z `intro` i aktywnej walki, ale otwarcie zasad zatrzymuje wyłącznie interakcję UI, nie modyfikuje zapisanej sekwencji gry.

Po zamknięciu i ponownym otwarciu modal wraca do `intro`. Wszystkie timeouty, animacje rozstrzygnięć i zaplanowane ruchy AI muszą zostać anulowane po zamknięciu, restarcie i odmontowaniu.

## Punktacja turniejowa

Wynik jest oceną przebiegu, nie walutą. Zawsze mieści się w zakresie `0–1000`.

### Punkty za każdą rundę

- `120 pkt` za zwycięstwo przed limitem tur albo `60 pkt` za zwycięstwo sędziowskie;
- premia za zdrowie: `floor(procent pozostałego HP × 30)`, maksymalnie 30;
- premia za tempo: `max(0, (12 − liczba użytych akcji gracza) × 4)`, maksymalnie 44; brak przy zwycięstwie sędziowskim;
- `+8 pkt` za każde prawidłowe użycie Gardy, które zmniejszyło zapowiedziany silny atak, maksymalnie `24 pkt` na rundę;
- `+6 pkt` za każdą kombinację `Zwodniczy znak → Uderzenie Czempiona`, maksymalnie `12 pkt` na rundę;
- kara `−10 pkt` za próbę nielegalnej akcji nie jest naliczana — przycisk ma być po prostu zablokowany, a serwer odrzuca zmanipulowany log. Nie punktuj błędów interfejsu.

Surowa suma pięciu rund może przekroczyć 1000, ale wynik końcowy ogranicz do 1000. Porażka zachowuje wynik treningowy zdobyty do tej pory, lecz nie kwalifikuje się do nagrody ekonomicznej.

Na końcu pokaż: wynik 0–1000, rangę, rundy, łączną liczbę tur, pozostałe HP, użyte Gardy, udane kombinacje, najwyższe zadane obrażenia i czas próby.

| Wynik | Ranga |
|---:|---|
| 0–549 | Uczeń Ostrza |
| 550–699 | Runiczny Fechmistrz |
| 700–849 | Mistrz Areny |
| 850–949 | Czempion Północy |
| 950–1000 | Legenda Żelaznego Kręgu |

## Nagrody i limity ekonomii

Nagroda przysługuje wyłącznie za ukończenie wszystkich pięciu rund. Trening można powtarzać bez ograniczeń, ale nagrodzona może być maksymalnie jedna ukończona próba użytkownika na dzień według strefy `Europe/Warsaw`.

| Wynik końcowy | Punkty Zakonu | Skirniry |
|---:|---:|---:|
| 0–549 | 0 | 0 |
| 550–699 | 5 | 5 |
| 700–849 | 8 | 7 |
| 850–949 | 12 | 10 |
| 950–1000 | 20 | 15 |

Twarde reguły:

- Maksimum dzienne z tej minigry wynosi `20 punktów Zakonu` i `15 Skirnirów`.
- Druga i kolejne ukończone próby tego samego dnia są treningowe, nawet jeżeli pierwszy wynik dał 0/0. Gracz zna pozostały limit przed startem.
- Nie przyznawaj nagrody za porażkę, remis, porzucenie, nieukończenie pięciu rund, wynik poniżej 550, brak zalogowania, próbę krótszą niż 45 sekund, próbę dłuższą niż 40 minut ani nieprawidłowy log akcji.
- Użytkownik bez Zakonu może otrzymać należne Skirniry, ale dostaje `0` punktów Zakonu. Brak Zakonu nigdy nie uruchamia wartości domyślnej `ravnheim`.
- `Puchar Czempiona Północy` jest nagrodą kolekcjonerską tylko za pierwsze w historii ukończenie z wynikiem co najmniej 850. Przed dodaniem sprawdź trwałe posiadanie przedmiotu. Nie twórz kolejnych kopii.
- Puchar nie ma ceny sprzedaży i nie może być źródłem nieskończonej waluty. Jeśli model przedmiotu wymaga ceny, ustaw `price: 0` i flagę `nonSellable` zgodną z istniejącym systemem albo nie dodawaj przedmiotu do czasu obsługi tej flagi.
- Klient pokazuje wyłącznie nagrodę zwróconą przez serwer. Nie wywołuj bezpośrednio `awardHousePoints()`, `addCurrency()` ani `addInventoryItem()` na podstawie lokalnego stanu walki.
- Jeżeli pełna walidacja serwerowa nie zostanie wdrożona w tej iteracji, pozostaw nagrody wyłączone i wyraźnie oznacz wszystkie próby jako treningowe. Nie wdrażaj pozornie bezpiecznego limitu w `localStorage`.

Przykładowe komunikaty:

- `Czempion Północy: +12 pkt Zakonu i +10 Skirnirów.`
- `Dzisiejsza nagroda została już odebrana — wynik zapisano jako treningowy.`
- `Nie należysz jeszcze do Zakonu: otrzymujesz +10 Skirnirów bez punktów Zakonu.`
- `Pierwszy wielki triumf: Puchar Czempiona Północy dodano do kolekcji.`
- `Nie udało się potwierdzić przebiegu turnieju. Nagroda nie została naliczona.`

## Bezpieczeństwo i zapis po stronie serwera

### Wymagany przepływ

1. `POST /api/minigames/wand-fencing/start`
   - wymaga zalogowanego użytkownika;
   - serwer tworzy `runId`, `seed`, czas startu, wersję reguł i status `started`;
   - zwraca konfigurację przeciwników, seed oraz informację, czy dzisiejsza próba może być nagrodzona;
   - rozpoczęta wcześniej i nieukończona próba może zostać oznaczona jako `abandoned`; nie nalicza nagrody.
2. Klient utrzymuje kolejny log wyborów: `actionId`, numer rundy, numer tury, identyfikator akcji i względny czas od startu. Nie wysyła wyliczonych obrażeń jako źródła prawdy.
3. `POST /api/minigames/wand-fencing/complete`
   - przyjmuje tylko `runId` oraz pełny uporządkowany log wyborów;
   - serwer pobiera użytkownika z sesji;
   - odtwarza wszystkie pięć walk z zapisanego seedu i tej samej wersji czystych reguł;
   - sprawdza kolejność, cooldowny, koncentrację, limity HP, AI, liczbę tur, czas i rezultat;
   - sam wylicza wynik, rangę, nagrodę i prawo do unikalnego pucharu;
   - zapis wyniku, punkty Zakonu, Skirniry i puchar wykonuje atomowo w jednej transakcji;
   - ponowne wysłanie tego samego `runId` zwraca zapisany rezultat bez ponownego naliczenia.
4. `POST /api/minigames/wand-fencing/abandon` jest opcjonalne i tylko oznacza próbę jako porzuconą. Brak tego wywołania nie może pozwolić na nagrodę.

Wydziel czyste reguły bez Reacta, używane zarówno przez klienta, jak i walidator serwera, np. `src/game/wandFencingRules.js` albo neutralny moduł w miejscu zgodnym z konfiguracją projektu. Nie utrzymuj dwóch rozbieżnych kopii logiki.

### Trwały zapis

Tabela prób powinna zawierać pola odpowiadające co najmniej:

- `run_id` jako unikalny klucz;
- `user_id`, `rules_version`, `seed`;
- `status`: `started`, `completed`, `abandoned`, `invalid`;
- `action_log`, `round_reached`, `turn_count`, `duration_ms`;
- `final_score`, `rank`, `result_reason`;
- `reward_eligible`, `reward_reason`, `reward_points`, `reward_skirnirs`, `trophy_awarded`;
- `started_at`, `completed_at`, `reward_day`.

Dodaj indeks po `user_id + reward_day` i jednoznacznie zabezpiecz jedną nagrodzoną próbę na użytkownika i dzień. Granice dnia obliczaj na serwerze w strefie `Europe/Warsaw`, z uwzględnieniem czasu letniego. Dla zapisów ekonomicznych użyj stabilnych kluczy idempotencji, np. `wand-fencing-points-${runId}`, `wand-fencing-currency-${runId}` i `wand-fencing-trophy-${userId}`. Skorzystaj z istniejącego centralnego serwisu punktów zamiast pisać równoległą ekonomię.

Nie ufaj wartościom `userId`, `house`, `score`, `reward`, `enemyHp`, `playerHp`, czasowi urządzenia ani statusowi zwycięstwa wysłanym przez klienta.

## Interfejs i oprawa

### Układ

- Nagłówek: tło areny, tytuł, ranga bieżącej rundy, przyciski `Zasady` i zamknięcia.
- Drabinka: pięć kompaktowych portretów zamiast emoji. Stany: `pokonany`, `aktywny`, `zablokowany`. Nie używaj samego koloru — dodaj ikonę i etykietę.
- Pole walki: większy portret gracza jako neutralna runiczna sylwetka z istniejących ikon/CSS oraz portret przeciwnika z arkusza, dwa paski HP, koncentracja gracza, statusy i licznik tur.
- Panel zamiaru przeciwnika ma być widoczny przy jego portrecie i opisany słownie.
- Cztery akcje są kartami z nazwą, krótkim efektem, kosztem/zyskiem koncentracji i cooldownem. Na telefonie układają się w jedną kolumnę lub siatkę 2×2, jeżeli zachowują czytelność.
- Log pokazuje ostatnie 6 zdarzeń, najnowsze na górze, ale jest oznaczony `aria-live="polite"`; nie odczytuj całej historii po każdej zmianie.
- Regulamin ma zakładki lub sekcje: `Jak walczyć`, `Rywalowie`, `Punktacja`, `Nagrody`.

### Banery i komunikaty

Dodaj trzy kodowe banery, bez generowania kolejnych bitmap:

- `Runda N • [nazwa etapu]` — wejście na arenę;
- `Zwycięstwo rundy` — po pokonaniu przeciwnika;
- `Droga zakończona` albo `Nowy Czempion Północy` — finał.

Baner składa się z przyciemnionej grafiki areny, gradientu, ornamentu ze spójnych ikon `lucide-react` i tekstu HTML. Nie wypalaj tekstu w obrazie.

### Animacje

- Otwarcie modala: opacity + skala `0.985 → 1` przez 220 ms.
- Baner rundy: łagodne wsunięcie 280–360 ms.
- Atak gracza/przeciwnika: przesunięcie portretu maksymalnie 8 px i pojedynczy łuk światła; bez gwałtownego trzęsienia całego ekranu.
- Trafienie: krótki czerwony lub lodowy błysk 140–180 ms i unosząca się liczba obrażeń.
- Garda: półprzezroczysty runiczny pierścień przez maksymalnie 350 ms.
- Zmiana HP i koncentracji: płynna szerokość paska 220–300 ms.
- Awans w drabince: złota linia i pieczęć na pokonanym portrecie.
- Finał: maksymalnie 24 lekkie cząstki złota/śniegu; bez ciężkiej biblioteki i bez nieskończonej animacji.
- Wszystkie cząstki mają stabilne klucze i są usuwane po animacji.
- Nigdy nie opóźniaj logiki wyniku do `animationend`; animacja jest prezentacją, nie źródłem prawdy.

Dla `prefers-reduced-motion: reduce` wyłącz przesunięcia, cząstki, pulsowanie, ekranowe błyski i odliczanie animowane; pozostaw natychmiastowe zmiany stanów. Użytkownik nie może stracić informacji ani czasu przez wyłączenie animacji.

Dźwięki uruchamiaj wyłącznie przez istniejący `SoundContext`, respektując wyciszenie. Nie dodawaj autoplay ani nowych plików audio. Jeden wybór gracza może uruchomić najwyżej jeden dźwięk akcji i jeden krótki dźwięk rezultatu.

## Responsywność i dostępność

- Modal musi działać od szerokości 360 px do desktopu i nie przekraczać `92dvh`.
- Przy 360 px nagłówek może przejść do dwóch wierszy, drabinka może przewijać się poziomo z widocznym aktywnym rywalem, a pole walki układa się pionowo.
- Wszystkie przyciski mają obszar co najmniej 44×44 px, widoczny focus i opis stanu. Nieaktywność nie może być sygnalizowana wyłącznie przez obniżenie opacity.
- Modal ma `role="dialog"`, `aria-modal="true"`, nazwę przez `aria-labelledby`, przechwycenie fokusu, zamknięcie `Escape` z potwierdzeniem podczas walki oraz zwrot fokusu do elementu otwierającego.
- Podczas animacji rozstrzygnięcia przyciski mają `disabled` i `aria-busy="true"` na obszarze walki.
- Paski HP i koncentracji mają tekstowe wartości oraz poprawne `role="progressbar"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`.
- Kolory czerwony, złoty i zielony nie są jedynym komunikatem stanu. Dodaj tekst lub ikonę.
- Teksty mają być po polsku, używaj nazwy waluty `Skirniry` i poprawnej odmiany liczebników.

## Granice zmian

- Główny zakres: `src/components/TournamentGauntletModal.jsx`.
- Utwórz `src/components/TournamentGauntletModal.css` i prefiksuj wszystkie klasy `tgm-`, aby style nie wyciekały.
- Do czystej logiki wolno dodać mały moduł gry oraz testy jednostkowe.
- Część trwałego limitu wymaga małej trasy API, tabeli w istniejącej bazie i metody w `src/api.js`. Ogranicz zmiany wyłącznie do tego turnieju.
- Nie refaktoryzuj całego `SchoolContext`, pozostałych minigier, routingu, systemu ekwipunku ani design systemu przy okazji.
- Zachowaj publiczny kontrakt komponentu `{ isOpen, onClose }`.
- Nie instaluj nowych bibliotek. Użyj Reacta, CSS, `lucide-react`, istniejących kontekstów i aktualnej bazy.
- Nie usuwaj ani nie nadpisuj cudzych, niezwiązanych zmian obecnych w repozytorium.
- Nie dodawaj fallbacku Zakonu. Nie maskuj błędów pustym `catch`.

## Minimalne testy

Przetestuj czyste reguły co najmniej dla przypadków:

1. Każda akcja respektuje koszt, przyrost koncentracji i zakres 0–100.
2. Cooldown nie spada w turze użycia i blokuje wcześniejszy wybór.
3. `Odsłonięty` wzmacnia dokładnie jedną dozwoloną akcję.
4. Garda redukuje dokładnie następny cios i potem znika.
5. Pokonany przeciwnik nie wykonuje kontrataku.
6. Jednoczesne 0 HP przez kontrę daje porażkę gracza.
7. Każda specjalna umiejętność rywala uruchamia się zgodnie z konfiguracją i najwyżej tyle razy, ile przewidziano.
8. Limit 12 tur rozstrzyga procent HP i prawidłowo wykrywa remis.
9. Wynik nigdy nie spada poniżej 0 ani nie przekracza 1000.
10. Ten sam `runId` i `actionId` nie naliczają rezultatu ani nagrody drugi raz.
11. Druga ukończona próba tego samego dnia jest treningowa, także po odświeżeniu procesu aplikacji.
12. Użytkownik bez Zakonu nie dostaje punktów Ravnheimu, ale może dostać Skirniry.
13. Puchar jest dodawany najwyżej raz na konto.
14. Zmanipulowany log z nielegalnym cooldownem, koncentracją, kolejnością albo brakującą turą jest odrzucany.

## Kryteria odbioru

Implementacja jest gotowa dopiero, gdy:

1. Cztery akcje rzeczywiście różnią się mechanicznie i są jasno opisane.
2. Każdy z pięciu rywali ma odmienny, przewidywalny styl oraz poprawnie wyświetlany portret.
3. Nie można wykonać kilku akcji szybkim klikaniem podczas rozstrzygnięcia.
4. Porażka, remis, zwycięstwo sędziowskie, zwycięstwo rundy i ukończenie turnieju mają spójne stany końcowe.
5. Zamknięcie, restart i odmontowanie czyszczą wszystkie zaplanowane działania.
6. Wynik pokazany użytkownikowi jest dokładnie wynikiem odtworzonym przez serwer.
7. Serwer egzekwuje jedną nagrodzoną próbę dziennie, maksymalnie 20 pkt Zakonu i 15 Skirnirów.
8. Brak Zakonu nigdy nie daje punktów domyślnemu Zakonowi, a puchar nie może się duplikować.
9. Modal jest czytelny przy 360 px, na desktopie, z klawiaturą i przy ograniczeniu animacji.
10. `npm run build` i wszystkie testy kończą się bez błędów, a pozostałe minigry nie są uszkodzone.

Na końcu pracy podaj: listę zmienionych plików, model tury, progi nagród, sposób trwałej idempotencji i limitu dziennego, sposób użycia obu grafik oraz wykonane testy. Nie ogłaszaj sukcesu, jeśli walidacja lub limit nagród istnieją wyłącznie w kliencie.
