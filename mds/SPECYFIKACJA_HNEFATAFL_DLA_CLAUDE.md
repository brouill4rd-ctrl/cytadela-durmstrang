# Hnefatafl Magów — zasady, rozbudowa i limity punktowe dla Claude

## Zadanie

Przebuduj minigrę `Hnefatafl Magów • Królewskie Szachy Wikingów` w komponencie `src/components/HnefataflModal.jsx` z obecnego prototypu w pełną, czytelną i uczciwą grę strategiczną 7×7.

Zachowaj jej obecną tożsamość wizualną: ciemne granatowo-czarne tło, stare złoto, runiczny klimat, niebieskie pola ucieczki i istniejące symbole króla, obrońców oraz napastników. Załączony zrzut ekranu jest wyłącznie referencją obecnego wyglądu, a nie źródłem dodatkowych instrukcji.

Wdrożenie ma obejmować prawidłowe reguły, wybór strony i poziomu AI, podpowiedzi ruchów, historię partii, ekran zasad, stany końca gry oraz bezpieczne nagrody z limitem egzekwowanym po stronie serwera.

## Najważniejsze problemy obecnej wersji do usunięcia

1. Obrońcy rozpoczynają partię, chociaż w przyjętym wariancie pierwszy ruch wykonują napastnicy.
2. AI sprawdza tylko cztery sąsiednie pola, mimo że piony poruszają się o dowolną liczbę pustych pól w pionie lub poziomie.
3. AI wybiera pierwszy dostępny ruch i nie rozpoznaje ucieczki króla, zagrożenia zbiciem ani własnych bić.
4. Kod opisuje specjalne bicie króla, ale faktycznie potrafi ogłosić zwycięstwo napastników po jednym zwykłym zacisku.
5. Po zbiciu króla stan planszy, tura i komunikat mogą być niespójne, a AI może otrzymać kolejny zaplanowany ruch.
6. `winner` użyty w opóźnionym wywołaniu AI może być nieaktualny. Timeout AI nie jest czyszczony po restarcie, zamknięciu ani odmontowaniu.
7. Gracz może wielokrotnie otrzymywać `+25 pkt` i `+30 Sk.` przez kolejne restarty. Nagroda jest naliczana wyłącznie w kliencie i bez trwałego limitu.
8. Brak Zakonu jest zastępowany Ravnheimem. Nigdy nie wolno przyznawać punktów fikcyjnemu lub domyślnemu Zakonowi.
9. Tryb lokalny może prowadzić do nagród, mimo że gracz kontroluje obie strony.
10. Nie ma reguł remisu, wykrywania braku legalnego ruchu, podglądu legalnych pól, licznika ruchów ani wyjaśnienia zasad.

## Wybrany wariant gry

Użyj spójnego wariantu **Brandubh 7×7**, dopasowanego do aktualnej planszy. Nie mieszaj zasad z odmianami 9×9, 11×11 ani 13×13.

### Strony i ustawienie początkowe

- **Straż Króla**: 1 król `K` na tronie i 4 obrońców `D` na polach bezpośrednio nad, pod, z lewej i z prawej strony tronu.
- **Cienie Skalda**: 8 napastników `A`; po dwóch na środku każdej krawędzi, zgodnie z obecną tablicą `initialBoard`.
- Tron znajduje się na polu `(3, 3)`.
- Cztery narożniki są Bramami Ucieczki.
- **Napastnicy zawsze wykonują pierwszy ruch.** Nagłówek nie może na stałe nazywać obrońców graczem, bo użytkownik może wybrać dowolną stronę.

## Pełne zasady ruchu

1. Król, obrońcy i napastnicy poruszają się jak wieża szachowa: o dowolną liczbę pustych pól wyłącznie w pionie albo poziomie.
2. Nie wolno poruszać się po skosie, przeskakiwać pionów ani zakończyć ruchu na zajętym polu.
3. Tylko król może wejść na Tron i Bramy Ucieczki oraz przechodzić przez pusty Tron.
4. Pozostałe piony nie mogą wejść na Tron lub Bramę Ucieczki ani przejść przez te pola.
5. Kliknięcie własnego pionka zaznacza go. Kliknięcie innego własnego pionka zmienia wybór. Kliknięcie legalnego pola wykonuje ruch. Kliknięcie nielegalnego pola nie wykonuje ruchu i nie zmienia tury.
6. Po zaznaczeniu pokaż wszystkie legalne pola dyskretnymi znacznikami. Pole dające natychmiastową ucieczkę króla może otrzymać złoto-niebieskie wyróżnienie.
7. Pion może bezpiecznie wejść pomiędzy dwa piony przeciwnika. Nie jest automatycznie zbijany przez własny ruch; bicie następuje tylko wskutek ruchu strony przeciwnej.

## Bicie zwykłych pionów

1. Pion zostaje zbity, gdy po ruchu przeciwnika znajdzie się bezpośrednio pomiędzy dwoma wrogimi pionami w jednej linii poziomej albo pionowej.
2. Pusty Tron i Bramy Ucieczki są polami wrogimi i mogą zastąpić drugi pion zaciskający zwykłego obrońcę lub napastnika.
3. Zajęty Tron działa zgodnie z figurą, która na nim stoi, a nie podwójnie jako figura i pole wrogie.
4. Krawędź planszy nie jest polem wrogim i sama nie umożliwia bicia.
5. Jeden ruch może zbić kilka pionów w różnych kierunkach. Najpierw wykonaj ruch, potem sprawdź wszystkie cztery kierunki na tej samej, zaktualizowanej planszy.
6. Król jest „uzbrojony”: może uczestniczyć w zacisku i pomagać w biciu napastników.
7. Nie wdrażaj w tej wersji bicia tarczowego `shield wall`, ruchu berserk ani łańcuchowego wykonywania kilku ruchów.

## Pojmanie króla

Król nie zawsze jest bity jak zwykły pion. Zastosuj dokładnie te trzy przypadki:

1. **Król na Tronie** — napastnicy muszą zajmować wszystkie cztery sąsiednie pola.
2. **Król bezpośrednio obok Tronu** — napastnicy muszą zajmować pozostałe trzy sąsiednie pola; pusty Tron stanowi czwartą stronę okrążenia.
3. **Król na każdym innym polu** — zostaje pojmany przez zwykły zacisk dwóch napastników stojących po jego przeciwnych stronach w pionie albo poziomie.

Nie uznawaj narożników za pomoc w pojmaniu króla. Najpierw rozstrzygnij ucieczkę króla, następnie bicia i pojmanie, a na końcu zmianę tury.

## Warunki zakończenia partii

### Zwycięstwo Straży Króla

- Król kończy ruch na dowolnej Bramie Ucieczki.
- Strona napastników nie ma żadnego legalnego ruchu w swojej turze.

### Zwycięstwo Cieni Skalda

- Król zostaje prawidłowo pojmany według zasad powyżej.
- Strona króla nie ma żadnego legalnego ruchu w swojej turze.

### Remis

Partia kończy się remisem bez nagrody, jeżeli wystąpi pierwszy z warunków:

- ta sama pozycja planszy wraz ze stroną na ruchu pojawi się po raz trzeci;
- przez 30 kolejnych półruchów, czyli ruchów pojedynczego gracza, nie nastąpi bicie;
- wykonano łącznie 100 półruchów i nikt nie wygrał.

Licznik bez bicia zeruje się po zbiciu co najmniej jednego pionka. Wynik sprawdzaj po każdym pełnym rozliczeniu ruchu. Stan końcowy jest nieodwracalny i może zostać ustawiony tylko raz.

## Tryby gry

### 1. Próba Skalda — gra przeciw AI

- Użytkownik wybiera stronę: `Straż Króla` albo `Cienie Skalda`.
- Użytkownik wybiera poziom trudności przed rozpoczęciem.
- Po rozpoczęciu ustawień nie można zmienić bez rozpoczęcia nowej partii.
- Jeżeli AI kontroluje napastników, wykonuje pierwszy ruch po krótkiej pauzie.
- Tylko ten tryb może kwalifikować się do nagrody.

### 2. Pojedynek przy jednym stole — 2 graczy lokalnie

- Obie strony są sterowane na tym samym urządzeniu.
- Pokaż ekran przekazania tury albo co najmniej wyraźną zmianę koloru i nazwy strony.
- Tryb jest zawsze treningowy: bez punktów Zakonu i bez Skirnirów.
- W trybie lokalnym można udostępnić `Cofnij ruch`; cofnięcie przywraca planszę, turę, zbite piony oraz liczniki remisu. W grze z AI cofanie jest wyłączone.

## Poziomy trudności AI

| Poziom | Zachowanie | Budżet decyzji | Nagroda za zwycięstwo |
|---|---|---:|---:|
| Uczeń Skalda | Preferuje bicie i blokowanie najbliższej drogi króla, poza tym wybiera ważony ruch losowy. Nie może wykonywać ruchów nielegalnych. | do 120 ms | 2 pkt Zakonu + 2 Skirniry |
| Skald Einar | Analizuje co najmniej 2 półruchy naprzód, rozpoznaje natychmiastową wygraną/przegraną i ocenia materiał, mobilność oraz drogę króla do narożnika. | do 300 ms | 5 pkt Zakonu + 4 Skirniry |
| Jarl Widmowej Tarczy | Analizuje co najmniej 3 półruchy naprzód z odcinaniem alfa-beta; najpierw sprawdza ruchy wygrywające, bicia i obronę przed wygraną przeciwnika. | do 600 ms | 8 pkt Zakonu + 6 Skirnirów |

AI ma korzystać z tego samego generatora legalnych ruchów i tej samej funkcji rozliczającej ruch co człowiek. Nie utrzymuj osobnej, uproszczonej wersji reguł dla AI.

Wymagania wspólne:

- AI nigdy nie może przegapić własnego natychmiastowego zwycięstwa, jeśli taki ruch istnieje.
- Na poziomie średnim i trudnym AI nie może świadomie pozostawić przeciwnikowi natychmiastowego zwycięstwa, jeżeli istnieje legalny ruch obronny.
- Przy równych ocenach wolno losować między najlepszymi ruchami, aby partie nie były identyczne.
- Obliczenia muszą mieć twardy limit czasu i nie mogą blokować interfejsu na zauważalnie dłużej niż podany budżet.
- Podczas namysłu zablokuj ruch gracza i pokaż `Duch Skalda rozważa ruch…`.
- Każde opóźnienie lub zadanie AI musi zostać anulowane po zamknięciu, restarcie, zmianie trybu i odmontowaniu komponentu.

## Ocena pozycji AI

Nie opieraj AI tylko na liczbie pionów. Funkcja oceny powinna uwzględniać co najmniej:

- natychmiastową wygraną lub porażkę jako wartość dominującą;
- liczbę zbitych pionów obu stron;
- liczbę legalnych ruchów króla;
- liczbę otwartych linii prowadzących króla do Bramy Ucieczki;
- odległość króla od najbliższej Bramy Ucieczki;
- kontrolę czterech pól sąsiadujących z królem;
- mobilność całej strony;
- zagrożenie zbiciem pionka w następnym ruchu.

Wartości muszą zmieniać znak zależnie od strony kontrolowanej przez AI. Nie wpisuj na stałe założenia, że AI zawsze gra napastnikami.

## Stany interfejsu

Gra ma jednoznaczne stany:

1. `setup` — wybór trybu, strony i trudności oraz skrócone zasady;
2. `playing` — aktywna tura człowieka;
3. `aiThinking` — zablokowana plansza podczas decyzji AI;
4. `result` — zwycięstwo, porażka albo remis wraz z podsumowaniem;
5. opcjonalnie `rewardPending` jako krótki podstan zapisu wyniku, bez możliwości ponownego wysłania.

Po zamknięciu i ponownym otwarciu modal ma wrócić do `setup`. Przycisk `Nowa partia` podczas aktywnej gry powinien najpierw pokazać niewielkie potwierdzenie, ponieważ porzuca próbę bez nagrody.

## Informacje widoczne podczas partii

Pokaż bez przeładowania ekranu:

- stronę na ruchu i informację, kto nią steruje;
- wybraną stronę gracza i poziom AI;
- licznik półruchów;
- liczbę zbitych obrońców i napastników;
- licznik ruchów bez bicia, szczególnie od wartości 24;
- małą legendę: król ma uciec do narożnika, napastnicy mają go pojmać;
- przycisk `Zasady` otwierający czytelną sekcję pomocy;
- listę ostatnich 6 ruchów w prostym zapisie, np. `A: D1→D3 ×1`.

Nie pokazuj współrzędnych jako jedynej informacji. Dodaj oznaczenia `A–G` i `1–7` przy krawędzi planszy, ale nadal pokazuj wizualnie pola docelowe.

## Ekran zasad dla gracza

Tekst pomocy ma być krótki i zrozumiały bez znajomości historycznego Hnefatafl:

> Napastnicy ruszają pierwsi. Wszystkie piony przesuwają się o dowolną liczbę pustych pól w pionie lub poziomie. Zwykły pion zostaje zbity przez zaciśnięcie go pomiędzy dwoma wrogimi pionami. Straż wygrywa, gdy król dotrze do niebieskiego narożnika. Cienie wygrywają, gdy pojmą króla. Tylko król może wejść na Tron i Bramy Ucieczki.

Pod spodem dodaj rozwijane `Jak pojmać króla?` z trzema przypadkami opisanymi w pełnych zasadach. Nie próbuj tłumaczyć specjalnego bicia wyłącznie kolorem.

## Wynik i podsumowanie partii

Po zakończeniu pokaż:

- rezultat: `Zwycięstwo`, `Porażka` albo `Remis`;
- zwycięską stronę i powód, np. `Król dotarł do Bramy Ucieczki`, `Król został otoczony`, `Trzykrotne powtórzenie pozycji`;
- stronę gracza oraz poziom trudności;
- liczbę półruchów i czas partii;
- piony zbite przez każdą stronę;
- przyznaną nagrodę albo jednoznaczny powód jej braku;
- przyciski `Rewanż tymi samymi ustawieniami` i `Zmień ustawienia`.

Nie obiecuj `+25 pkt` w stałym nagłówku wyniku. Komunikat ma używać wartości zwróconych przez serwer.

## Nagrody i twarde limity ekonomii

Nagroda zależy wyłącznie od wybranego poziomu trudności i jest przyznawana tylko po zwycięstwie człowieka nad AI.

| Rezultat | Uczeń Skalda | Skald Einar | Jarl Widmowej Tarczy |
|---|---:|---:|---:|
| Zwycięstwo człowieka | 2 pkt + 2 Sk. | 5 pkt + 4 Sk. | 8 pkt + 6 Sk. |
| Porażka | 0 pkt + 0 Sk. | 0 pkt + 0 Sk. | 0 pkt + 0 Sk. |
| Remis | 0 pkt + 0 Sk. | 0 pkt + 0 Sk. | 0 pkt + 0 Sk. |

Obowiązują jednocześnie wszystkie limity:

- maksymalnie **3 nagrodzone zwycięstwa na dzień** według strefy `Europe/Warsaw`;
- maksymalnie **24 punkty Zakonu i 18 Skirnirów dziennie** z Hnefatafl;
- kolejne partie można rozgrywać bez ograniczeń, lecz są treningowe;
- tryb 2 graczy, porażka, remis, partia porzucona, cofnięta albo rozegrana bez zalogowania zawsze daje 0/0;
- użytkownik bez Zakonu może dostać należne Skirniry, ale nie dostaje punktów żadnego Zakonu;
- brak Zakonu nigdy nie może uruchamiać wartości domyślnej `ravnheim`;
- nagroda nie może zostać naliczona drugi raz po restarcie, ponownym otwarciu modala, odświeżeniu strony ani ponownym wysłaniu żądania;
- nie przyznawaj nagrody za partię ukończoną szybciej niż 8 sekund lub później niż 45 minut od utworzenia próby; pokaż wtedy, że była to partia treningowa;
- jeśli pozostały limit dzienny jest mniejszy od nagrody danego poziomu, serwer może przyznać tylko pozostałą część do limitu i musi zwrócić faktycznie przyznane wartości.

Przykładowe komunikaty:

- `Zwycięstwo nad Skaldem Einarem: +5 pkt Zakonu i +4 Skirniry.`
- `Limit nagród na dziś wykorzystany — partia została zapisana jako treningowa.`
- `Zwycięstwo zapisane. Nie należysz jeszcze do Zakonu, dlatego otrzymujesz +4 Skirniry bez punktów Zakonu.`
- `Nie udało się potwierdzić wyniku na serwerze. Nagroda nie została naliczona.`

## Bezpieczeństwo i zapis po stronie serwera

Nie wywołuj bezpośrednio z komponentu obecnych `awardHousePoints()` i `addCurrency()` dla wyniku Hnefatafl. Klient nie jest źródłem prawdy o zwycięstwie ani wysokości nagrody.

### Wymagany przepływ

1. `POST /api/minigames/hnefatafl/start`
   - wymaga zalogowanego użytkownika;
   - przyjmuje `difficulty` i `playerSide`;
   - serwer generuje unikalny `runId`, zapisuje czas startu, ustawienia i losowy `seed` dla AI;
   - zwraca `runId`, `seed`, ustawienia oraz aktualny stan dziennego limitu.
2. Klient zapisuje pełną listę ruchów partii. Każdy wpis zawiera stronę, pole początkowe, pole końcowe i numer półruchu.
3. `POST /api/minigames/hnefatafl/complete`
   - przyjmuje wyłącznie `runId` i pełny dziennik ruchów;
   - serwer pobiera użytkownika z sesji, a nie z danych klienta;
   - serwer odtwarza partię od znanej pozycji początkowej przy użyciu tych samych czystych reguł, sprawdza kolejność, legalność wszystkich ruchów, bicia, remis i zwycięzcę;
   - ruchy AI muszą być zgodne z poziomem i seedem zapisanym przy starcie; klient nie może podmienić ruchów AI na wygodniejsze;
   - serwer sam wylicza nagrodę z zapisanej trudności i nakłada limity;
   - zakończenie, zapis próby oraz obie transakcje ekonomiczne wykonuje atomowo.
4. Ponowne wysłanie tego samego `runId` zwraca identyczny zapisany rezultat, ale niczego ponownie nie nalicza.

Jeśli wspólne współdzielenie kodu reguł między frontendem i backendem jest niewygodne, utwórz mały moduł bez zależności od Reacta, np. `src/game/hnefataflRules.js`, i jego serwerowy odpowiednik/testowany moduł współdzielony w miejscu zgodnym z obecną konfiguracją projektu. Nie kopiuj dwóch rozbieżnych zestawów zasad.

### Trwały zapis

Dodaj tabelę prób o funkcji odpowiadającej poniższym polom; nazwy mogą być dopasowane do konwencji bazy:

- `id` / `run_id` — klucz główny;
- `user_id`;
- `mode`, `difficulty`, `player_side`, `ai_seed`;
- `status`: `started`, `completed`, `abandoned`, `invalid`;
- `winner`, `end_reason`, `move_count`, `move_log`;
- `reward_points`, `reward_skirnirs` — wartości faktycznie przyznane;
- `reward_eligible` i `reward_reason`;
- `started_at`, `completed_at`, `reward_day`.

Wymagane są indeksy po `user_id + reward_day` oraz unikalność `run_id`. Dla transakcji punktów i Skirnirów użyj stabilnych kluczy idempotencji, np. `hnefatafl-points-${runId}` i `hnefatafl-skirnirs-${runId}` oraz istniejących centralnych serwisów punktów i waluty.

Granice dnia wyliczaj na serwerze dla `Europe/Warsaw`, uwzględniając zmianę czasu letniego. Nie polegaj na dacie urządzenia użytkownika, `localStorage` ani stanie Reacta.

Jeżeli w tej iteracji nie powstanie pełna walidacja i trwały limit serwerowy, pozostaw grę w trybie treningowym z nagrodami 0/0. Nie implementuj pozornie bezpiecznych nagród tylko w przeglądarce.

## Architektura logiki gry

Oddziel reguły od interfejsu. Czysta warstwa gry powinna udostępniać odpowiedniki:

- `createInitialState()`;
- `getLegalMoves(state, from)` i `getAllLegalMoves(state, side)`;
- `applyMove(state, move)` zwracające nowy stan, zbicia i powód końca;
- `resolveCaptures(board, move)`;
- `getGameResult(state)`;
- `serializePosition(state)` uwzględniające stronę na ruchu;
- `chooseAiMove(state, difficulty, seed, timeBudget)`.

Nie mutuj istniejącej planszy. Jeden ruch musi być jedną atomową zmianą stanu. Nie wywołuj `setState` z wnętrza pętli sprawdzającej bicia. Losowość AI ma być deterministyczna dla otrzymanego `seed`, aby serwer mógł odtworzyć partię.

## Zachowanie i oprawa

- Zachowaj planszę 7×7 i charakter widoczny na zrzucie, ale powiększ pola na desktopie do około 50–56 px, jeśli mieści się to w modalu.
- Zastąp przypadkowy zestaw emoji spójnymi ikonami lub stylizowanymi żetonami CSS/lucide. Jeżeli pozostają emoji, zapewnij tekstowe `aria-label` i nie polegaj na ich wyglądzie systemowym jako jedynym rozróżnieniu.
- Zbicie może mieć krótką animację zanikania 160–240 ms, ale stan logiczny ma być rozliczony od razu.
- Ostatni ruch wyróżnij delikatnym obramowaniem pola początkowego i docelowego.
- Zagrożony król może otrzymać subtelny czerwony blask. Nie ujawniaj pełnej analizy AI.
- Ucieczkę króla zakończ złoto-niebieskim rozbłyskiem; pojmanie — krótkim wygaszeniem run. Bez silnego trzęsienia ekranu.
- Dźwięki uruchamiaj tylko przez istniejący `SoundContext` i respektuj wyciszenie. Nie dodawaj nowych plików audio ani autoplay.
- Dla `prefers-reduced-motion: reduce` wyłącz przesunięcia, pulsowanie i efekty cząsteczkowe; logika i czytelność muszą pozostać pełne.

## Responsywność i dostępność

- Modal ma działać od szerokości 360 px do desktopu bez poziomego przewijania.
- Plansza ma być kwadratowa i skalować się przez CSS, np. `min(78vw, 390px)`, zamiast polegać wyłącznie na stałych `44px`.
- Każde pole ma być prawdziwym przyciskiem albo mieć poprawną semantykę `role="gridcell"`, obsługę klawiatury i widoczny focus.
- Minimalny obszar kliknięcia na telefonie: 44×44 px; jeżeli fizyczne pole jest mniejsze, cały jego obszar nadal musi reagować.
- Umożliwiaj poruszanie fokusem po planszy strzałkami, wybór Enterem/Spacją i anulowanie zaznaczenia klawiszem Escape.
- Przycisk zamknięcia ma `aria-label="Zamknij Hnefatafl"`.
- Stan tury, zbicie i koniec gry ogłaszaj przez spokojny region `aria-live`, bez odczytywania całej planszy po każdym ruchu.
- Nie blokuj przewijania ani skrótów po zamknięciu. Focus po zamknięciu powinien wrócić do elementu, który otworzył modal, o ile obecna infrastruktura modali to obsługuje.
- Wszystkie teksty mają być po polsku. Używaj konsekwentnie nazw `Zakon`, `punkty Zakonu` i `Skirniry`.

## Granice zmian

- Główny zakres: `src/components/HnefataflModal.jsx`.
- Dozwolone: dedykowany prefiksowany arkusz CSS, czysty moduł reguł, mała trasa API Hnefatafl, tabela prób, metody w `src/api.js` i testy.
- Nie zmieniaj publicznego kontraktu komponentu: nadal przyjmuje `{ isOpen, onClose }`.
- Nie refaktoryzuj przy okazji `SchoolContext`, innych minigier, całego systemu punktów, banku, routingu ani wyglądu portalu.
- Nie instaluj nowych bibliotek. Użyj istniejącego Reacta, CSS, `lucide-react`, bazy oraz centralnych serwisów punktów i Skirnirów.
- Nie zapisuj limitu ekonomii w `localStorage`.
- Nie pozostawiaj pustych `catch`, niezatrzymanych timeoutów, aktualizacji stanu po odmontowaniu ani możliwości kliknięcia podczas tury AI.
- Nie modyfikuj ani nie usuwaj niezwiązanych zmian obecnych w katalogu roboczym.

## Testy wymagane przed odbiorem

### Testy reguł

1. Każdy typ pionka porusza się o wiele pól w pionie i poziomie, ale nie po skosie i nie przez inne piony.
2. Tylko król może wejść na pola specjalne; zwykły pion nie może także przejść przez pusty Tron.
3. Zwykłe bicie działa pionowo, poziomo, przy pustym Tronie i przy Bramie Ucieczki.
4. Krawędź nie działa jak pion zaciskający.
5. Jeden ruch może zbić dwa, trzy lub cztery piony.
6. Król na Tronie wymaga czterech napastników, obok Tronu trzech, a poza tą strefą dwóch po przeciwnych stronach.
7. Król dochodzący do narożnika natychmiast wygrywa.
8. Poprawnie wykrywane są: brak legalnego ruchu, trzecie powtórzenie pozycji, 30 półruchów bez bicia i limit 100 półruchów.
9. Po zakończeniu żaden kolejny ruch nie zmienia planszy ani rezultatu.

### Testy AI

1. AI wybiera wygrywający ruch, gdy jest dostępny.
2. AI średnie i trudne blokuje natychmiastową ucieczkę lub pojmanie, gdy obrona istnieje.
3. AI nigdy nie zwraca nielegalnego ruchu.
4. Ten sam stan i seed dają deterministyczny wybór potrzebny do walidacji serwerowej.
5. AI respektuje limit czasu i nie wykonuje ruchu po restarcie lub zamknięciu.

### Testy nagród

1. Porażka, remis, tryb lokalny i porzucenie dają 0/0.
2. Każdy poziom trudności daje dokładnie wartość z tabeli po potwierdzonym zwycięstwie.
3. To samo `runId` nie nalicza nagrody dwa razy.
4. Czwarta nagradzana wygrana jednego dnia jest treningowa.
5. Dzienne sumy nie przekraczają 24 punktów Zakonu i 18 Skirnirów, także przy równoległych żądaniach.
6. Użytkownik bez Zakonu nie dostaje punktów Ravnheimu ani innego Zakonu, ale może dostać Skirniry.
7. Sfałszowany, nielegalny lub niezgodny z seedem dziennik ruchów zostaje odrzucony bez nagrody.

## Kryteria odbioru

Implementacja jest gotowa dopiero, gdy:

1. wszystkie zasady ruchu, bicia, pojmania króla, zwycięstwa i remisu są obsługiwane przez jeden spójny silnik;
2. gracz może wybrać stronę, tryb i trzy wyraźnie różniące się poziomy AI;
3. AI używa pełnych ruchów Hnefatafl, rozpoznaje bezpośrednie zagrożenia i nigdy nie rusza po zakończeniu partii;
4. interfejs pokazuje legalne ruchy, turę, zbicia, ostatni ruch, podstawowe zasady i poprawny powód wyniku;
5. rezultat oraz nagroda mogą zostać zapisane tylko raz;
6. serwer odtwarza i zatwierdza partię, sam wylicza nagrodę i atomowo egzekwuje limity dzienne;
7. odświeżenie strony, ponowne wysłanie żądania i dwa równoległe zakończenia nie obchodzą limitów;
8. modal jest czytelny i grywalny przy 360 px, na desktopie, klawiaturą oraz przy ograniczeniu animacji;
9. zamknięcie i ponowne otwarcie daje czysty stan `setup`, a wszystkie zadania AI są anulowane;
10. testy reguł, AI i nagród przechodzą, a `npm run build` kończy się bez błędów.

Na końcu pracy podaj krótko: zmienione pliki, przyjęty sposób bicia króla, działanie trzech poziomów AI, przepływ walidacji serwerowej, sposób naliczania i limitowania nagród oraz wykonane testy. Nie ogłaszaj sukcesu, jeśli nagrody lub limit istnieją wyłącznie po stronie klienta.
