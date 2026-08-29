# Połów w Zamarzniętym Fjordzie — kompletna specyfikacja gry dla Claude

## Zadanie

Rozbuduj minigrę `Połów w Zamarzniętym Fjordzie • Przystań Drakkarów` znajdującą się obecnie w `src/components/IceFishingModal.jsx`.

Nie wykonuj wyłącznie kosmetycznego liftingu. Obecny mechanizm „zarzuć — poczekaj — kliknij — zawsze odbierz losową nagrodę” ma zostać zastąpiony pełną, uczciwą minigrą zręcznościową składającą się z czterech rzutów. Gra ma mieć wybór przynęty, moment zacięcia, etap holowania, wynik wyprawy, dzienny limit nagród, tryb treningowy, zapis trwającej wyprawy oraz bezpieczne naliczanie ekonomii po stronie serwera.

Zachowaj klimat widoczny w obecnym modalu: noc polarna, ciemny granat i czerń, lodowy błękit, przerębel jako centralny motyw, delikatne światło spod lodu i stylistyka Durmstrangu. Nie zmieniaj ogólnej tożsamości wizualnej portalu.

## Problemy obecnej wersji, które trzeba usunąć

1. Każde poprawne kliknięcie zawsze kończy się zdobyciem przedmiotu, punktów Zakonu i Skirnirów. Nie istnieje porażka ani rzeczywisty test umiejętności.
2. Gracz może odbierać nagrody bez ograniczeń.
3. Losowanie zdobyczy, jej wartości i nagrody odbywa się po stronie klienta, więc klient jest źródłem prawdy dla ekonomii.
4. Punkty są domyślnie przypisywane Ravnheimowi, nawet jeśli użytkownik nie należy do żadnego Zakonu.
5. Timeout oczekiwania na branie nie jest czyszczony. Po zamknięciu modala stary callback może nadal zmienić stan gry.
6. Stan `hooking` nie ma terminu ważności. Gracz może nacisnąć „Zatnij” po dowolnie długim czasie i nadal wygrać.
7. Nie ma pełnego zakończenia wyprawy, podsumowania, statystyk, trybu treningowego ani możliwości bezpiecznego wznowienia.
8. Szybkie wielokrotne kliknięcia, ponowne wywołanie callbacku albo React Strict Mode mogą doprowadzić do wielokrotnego rozliczenia.
9. Każdy połów dodaje osobny obiekt do ekwipunku, co przy dłuższej grze zaśmieca profil.
10. Odświeżenie strony i `localStorage` nie mogą być sposobem egzekwowania limitu ekonomii.

## Podstawowa pętla rozgrywki

Jedna **wyprawa** składa się z dokładnie **4 rzutów**. Typowa wyprawa powinna trwać około 45–75 sekund.

Gra ma używać jednoznacznych stanów:

1. `intro` — zasady, pozostały limit nagród, rekord gracza i wybór rozpoczęcia.
2. `countdown` — odliczanie 3, 2, 1 przed pierwszym rzutem.
3. `bait_select` — wybór przynęty dla bieżącego rzutu.
4. `casting` — krótka, nieinteraktywna animacja zarzucenia.
5. `waiting` — oczekiwanie na branie.
6. `bite` — ograniczone czasowo okno na zacięcie.
7. `reeling` — trzy próby utrzymania naprężenia żyłki.
8. `cast_result` — wynik pojedynczego rzutu: zdobycz albo ucieczka ryby.
9. `expedition_result` — wynik całej czterorundowej wyprawy i rezultat rozliczenia serwerowego.
10. `error` — spokojny komunikat oraz bezpieczna możliwość ponowienia odczytu statusu; nigdy automatycznego ponowienia wypłaty.

Nie przeskakuj bezpośrednio z brania do losowej nagrody. Każdy udany połów musi przejść przez zacięcie oraz holowanie.

## Przebieg jednego rzutu

### 1. Wybór przynęty

Przed każdym rzutem gracz wybiera jedną z trzech przynęt. Przynęta zmienia szerokość bezpiecznego pola podczas holowania oraz typ możliwej zdobyczy.

| Przynęta | Charakter | Szerokość pola holowania | Limit w wyprawie | Pula zdobyczy |
|---|---|---:|---:|---|
| Lodowy robak | najłatwiejsza i bezpieczna | 32% belki | bez limitu | ryby fiordu |
| Świetlista larwa | średnia trudność | 27% belki | maks. 2 razy | składniki alchemiczne |
| Runiczna błystka | trudna, skarby z głębin | 22% belki | maks. 1 raz | relikty Drakkarów |

Nie wymagaj posiadania przynęt w ekwipunku i nie pobieraj za nie Skirnirów. To wybór taktyczny wewnątrz wyprawy, nie osobny mikrosystem zakupów.

Przycisk rzutu jest nieaktywny, dopóki gracz nie wybierze dostępnej przynęty.

### 2. Zarzucenie i oczekiwanie

- Animacja zarzucenia trwa około 650 ms.
- Branie następuje losowo po 2000–5000 ms.
- Nie pokazuj dokładnego odliczania do brania.
- W stanie `waiting` wcześniejsze naciskanie klawisza lub przycisku nie daje przewagi i jest ignorowane.
- Dla każdego rzutu zapisz `biteDeadline`; nie opieraj mechaniki wyłącznie na odejmowaniu czasu przez `setInterval`.

### 3. Zacięcie

Od pojawienia się brania gracz ma **1300 ms** na naciśnięcie przycisku `ZATNIJ` albo klawisza Spacja/Enter.

| Czas reakcji | Ocena | Punkty |
|---:|---|---:|
| 0–299 ms | perfekcyjne zacięcie | 40 |
| 300–699 ms | dobre zacięcie | 30 |
| 700–1299 ms | późne zacięcie | 20 |
| 1300 ms i więcej | ryba uciekła | 0 |

Brak reakcji kończy rzut wynikiem `escape`. Nie przechodź wtedy do holowania.

Każdy rzut może zostać zacięty tylko raz. Pierwsze prawidłowe zdarzenie blokuje następne kliknięcia i naciśnięcia klawiszy.

### 4. Holowanie

Po udanym zacięciu rozpoczynają się trzy osobne przejścia wskaźnika po poziomej belce naprężenia.

- Jedno przejście trwa 1600 ms.
- Pomiędzy przejściami jest 250 ms czytelnej przerwy.
- Kierunek zmienia się naprzemiennie: lewo → prawo, prawo → lewo, lewo → prawo.
- Położenie bezpiecznej strefy jest losowane osobno dla każdego przejścia, ale cała strefa musi mieścić się w belce.
- W każdym przejściu można nacisnąć tylko raz.
- Spacja, Enter, kliknięcie przycisku i dotyk mają uruchamiać tę samą funkcję oceny.
- Wskaźnik animuj na podstawie czasu (`requestAnimationFrame` + znacznik początku), a nie liczby wyrenderowanych klatek.

Ocena pojedynczego przejścia:

| Trafienie | Warunek | Punkty |
|---|---|---:|
| Perfekcyjne | wskaźnik znajduje się w środkowych 35% bezpiecznej strefy | 30 |
| Dobre | wskaźnik znajduje się w dowolnym pozostałym miejscu bezpiecznej strefy | 20 |
| Pudło | wskaźnik jest poza strefą albo minął czas | 0 |

Ryba zostaje wyłowiona wyłącznie wtedy, gdy gracz zaliczy co najmniej **2 z 3** przejść holowania. Przy 0 lub 1 trafieniu ryba zrywa żyłkę. Pudło nie odejmuje już zdobytych punktów.

Po każdym przejściu pokaż krótki komunikat: `PERFEKCYJNIE +30`, `DOBRZE +20` albo `ŻYŁKA TRZESZCZY`.

## Wynik rzutu i jakość zdobyczy

Wynik jednego rzutu jest sumą:

- punktów za zacięcie,
- punktów za trzy przejścia holowania,
- premii `+40` za skuteczne wyłowienie.

Maksymalny wynik rzutu wynosi **170**, a maksymalny wynik wyprawy **680**. Wynik nigdy nie spada poniżej 0.

Jeżeli ryba została wyłowiona, jakość zdobyczy wynika wyłącznie z wyniku tego rzutu:

| Wynik rzutu | Rzadkość zdobyczy |
|---:|---|
| 100–119 | pospolita |
| 120–139 | niepospolita |
| 140–154 | rzadka |
| 155–164 | epicka |
| 165–170 | legendarna |

Nie obniżaj rzadkości dodatkowym losowaniem. Umiejętność gracza ma być ważniejsza od szczęścia. Wybrana przynęta określa konkretny rodzaj przedmiotu dla uzyskanej rzadkości.

| Rzadkość | Lodowy robak — ryby | Świetlista larwa — składniki | Runiczna błystka — relikty |
|---|---|---|---|
| Pospolita | Śledź Arktyczny | Mroźna Krewetka | Zardzewiały Hak Drakkara |
| Niepospolita | Dorsz Błękitnego Fjordu | Węgorz Lodowy | Moneta Zatopionego Jarla |
| Rzadka | Świetlisty Łosoś Fiordów | Meduza Księżycowego Lodu | Skrzynia Zatopionego Drakkara |
| Epicka | Złota Płotka Runiczna | Serce Lodowego Koralowca | Zgubiony Pierścień Wikinga |
| Legendarna | Biały Jesiotr Skadi | Łza Rán | Łuska Młodego Lewiatana |

Każda pozycja ma mieć stabilne `lootId`, kategorię, polską nazwę, opis lore, ikonę z istniejącego zestawu lub prosty symbol oraz rzadkość. Nie używaj ceny przedmiotu jako bezpośredniej wypłaty ekonomicznej.

## Wynik wyprawy

Po czterech rzutach pokaż:

- łączny wynik na 680,
- liczbę wyłowionych zdobyczy,
- liczbę ucieczek,
- liczbę perfekcyjnych zacięć,
- liczbę perfekcyjnych przejść holowania,
- najlepszą zdobycz wyprawy,
- wykorzystane przynęty,
- nowy rekord, jeżeli został pobity,
- otrzymane punkty Zakonu, Skirniry i przedmiot albo jasny powód braku nagrody.

Ekran wyniku ma również zawierać rozpisane cztery rzuty. Gracz powinien rozumieć, skąd pochodzi jego wynik.

## Nagrody i twarde limity ekonomii

Gracz może ukończyć dowolną liczbę wypraw treningowych, ale może rozpocząć maksymalnie **3 wyprawy nagradzane dziennie** według strefy `Europe/Warsaw`.

| Wynik wyprawy | Punkty Zakonu | Skirniry |
|---:|---:|---:|
| 0–199 | 0 | 0 |
| 200–319 | 2 | 2 |
| 320–439 | 4 | 4 |
| 440–559 | 6 | 6 |
| 560–680 | 8 | 8 |

Maksimum dzienne wynosi zatem **24 punkty Zakonu, 24 Skirniry i 3 przedmioty**.

Zasady przedmiotów:

- Po ukończeniu wyprawy nagradzanej gracz otrzymuje najwyżej jeden przedmiot: najlepszą zdobycz o rzadkości `rzadka` lub wyższej.
- Jeżeli kilka zdobyczy ma tę samą najwyższą rzadkość, zachowaj tę z rzutu o wyższym wyniku, a przy remisie wcześniejszą.
- Zdobycze pospolite i niepospolite są wpisane do dziennika połowu, ale nie zaśmiecają trwałego ekwipunku.
- Identyczne nagrody w ekwipunku są stackowane przez stabilne `lootId` i pole `quantity`; nie twórz wielu niemal identycznych obiektów.
- Interfejs ekwipunku ma pokazywać `×N`, gdy `quantity > 1`.
- W trybie treningowym żadna zdobycz nie trafia do trwałego ekwipunku.

Twarde reguły limitu:

1. Slot dzienny jest rezerwowany w chwili rozpoczęcia pierwszego rzutu wyprawy nagradzanej, a nie dopiero po poznaniu wyniku. Zapobiega to porzucaniu słabych początków i nieskończonemu ponawianiu.
2. Jednocześnie użytkownik może mieć najwyżej jedną aktywną wyprawę nagradzaną.
3. Aktywną wyprawę można wznowić po ponownym otwarciu modala. Rozpoczęty i niedokończony rzut zostaje wtedy rozliczony jako ucieczka, a gra przechodzi do kolejnego rzutu.
4. Aktywna wyprawa wygasa po 15 minutach bezczynności. Wygasła wyprawa ma status `abandoned`, zużywa zarezerwowany slot i nie daje nagrody.
5. Po wykorzystaniu trzech slotów przycisk ma uruchamiać wyłącznie `Tryb treningowy`, z komunikatem: `Dzisiejszy limit nagród został wykorzystany — wynik zapisze się jako trening.`
6. Niezalogowany użytkownik może grać wyłącznie treningowo.
7. Skirniry i przedmiot mogą dostać tylko prawidłowo uwierzytelnieni użytkownicy. Punkty Zakonu przyznaj tylko uczniowi, który ma prawidłowy Zakon istniejący w bazie.
8. Brak Zakonu nigdy nie oznacza domyślnego Ravnheimu. Brak Zakonu nie blokuje należnych Skirnirów i przedmiotu.
9. Nie przyznawaj nagrody za wyprawę anulowaną, wygasłą, zawierającą mniej niż cztery rozliczone rzuty albo trwającą nienaturalnie krótko.
10. Jeśli backend jest niedostępny, pozwól grać treningowo, ale wyłącz wypłaty. Pokaż to przed startem. Nie udawaj bezpiecznego limitu przez `localStorage`.

## Trwałość, idempotencja i serwer jako źródło prawdy

Dodaj dedykowaną obsługę po stronie serwera. Nie rozliczaj tej gry przez trzy niezależne wywołania `awardHousePoints`, `addCurrency` i `addInventoryItem` z komponentu.

Minimalny model danych:

### `fishing_sessions`

- `id` — `runId` generowany przed startem, klucz główny,
- `user_id`,
- `date_key` w strefie `Europe/Warsaw`,
- `mode`: `reward` albo `training`,
- `status`: `in_progress`, `completed`, `abandoned`,
- `score`,
- `casts_completed`,
- `catches_count`,
- `reward_points`,
- `reward_skirnirs`,
- `reward_loot_id`,
- `started_at`, `last_active_at`, `completed_at`.

### `fishing_casts`

- `id` — stabilny `castId`, klucz główny,
- `session_id`,
- `cast_index` od 0 do 3, z unikalnością `(session_id, cast_index)`,
- `bait_id`,
- `status`: `started`, `caught`, `escaped`,
- `hook_grade`, `hook_points`,
- trzy wyniki holowania,
- `cast_score`,
- `loot_id`,
- `started_at`, `completed_at`.

Wymagane operacje API:

1. `GET /api/fishing/status` — limit na dziś, aktywna wyprawa, rekord, podstawowe statystyki i ostatnie wyniki.
2. `POST /api/fishing/sessions` — idempotentne utworzenie albo zwrócenie wyprawy dla przesłanego `runId`; tryb nagradzany wymaga logowania i wolnego slotu.
3. `POST /api/fishing/sessions/:sessionId/casts` — rozpoczęcie rzutu z `castId`, indeksem i przynętą; serwer sprawdza kolejność oraz limity przynęt.
4. `POST /api/fishing/sessions/:sessionId/casts/:castId/complete` — zapis ocen zacięcia i holowania; serwer waliduje dozwolone wartości, sam oblicza wynik oraz wybiera zdobycz z tabeli. Powtórzenie tego samego żądania zwraca zapisany rezultat i niczego nie dopisuje.
5. `POST /api/fishing/sessions/:sessionId/complete` — atomowe zakończenie wyprawy i wypłata. Serwer sumuje zapisane rzuty i sam wylicza próg nagrody.
6. Opcjonalnie `POST /api/fishing/sessions/:sessionId/abandon` — jawne przerwanie. Musi być idempotentne.

Klient nie może przesyłać końcowej liczby punktów Zakonu, liczby Skirnirów, identyfikatora nagrody ani końcowego wyniku jako wartości wiążących. Serwer oblicza je z czterech zapisanych rzutów.

Waliduj przynajmniej:

- sesja należy do `req.user.id`, nie do dowolnego `userId` z body,
- indeksy rzutów są dokładnie 0, 1, 2, 3 i nie mogą się powtarzać,
- wartości ocen należą do zamkniętego zbioru `perfect | good | late | miss`,
- wynik rzutu nie przekracza 170, a wyprawy 680,
- `runId` i `castId` nie mogą spowodować ponownej wypłaty,
- wyprawa nie została zakończona, porzucona ani przedawniona,
- dzienny limit jest sprawdzany w transakcji, również przy dwóch równoczesnych żądaniach,
- trzecie użycie świetlistej larwy oraz drugie użycie runicznej błystki jest odrzucane,
- klient nie może ukończyć wyprawy bez czterech rozliczonych rzutów.

Rozliczenie końcowe wykonaj w jednej transakcji bazy danych:

- zmiana statusu sesji,
- zapis nagrody w sesji,
- transakcja punktów Zakonu z kluczem idempotencji `fishing:{sessionId}:points`,
- transakcja bankowa z kluczem idempotencji `fishing:{sessionId}:currency`,
- dodanie albo zwiększenie `quantity` przedmiotu,
- aktualizacja użytkownika i rankingów.

Jeżeli dowolna część się nie powiedzie, całość ma zostać wycofana. Ponowne wywołanie `complete` dla zakończonej sesji zwraca dokładnie poprzedni rezultat bez ponownego naliczenia.

Losowy czas brania i animacja mogą być klientowe, ale nie wolno na ich podstawie bezpośrednio wypłacać waluty. Nie przedstawiaj tej walidacji jako pełnego systemu anty-cheat — jej celem jest przede wszystkim idempotencja, limit i ochrona ekonomii przed prostym manipulowaniem wartościami.

## Wznawianie, zamykanie i czas

- Każdy timeout, `requestAnimationFrame`, listener klawiatury i listener widoczności karty musi być czyszczony przy zmianie fazy, końcu rzutu, zamknięciu oraz odmontowaniu.
- Zamknięcie podczas aktywnej wyprawy pokazuje wewnątrz modala potwierdzenie: `Przerwać teraz? Bieżący rzut zostanie uznany za nieudany, ale wyprawę możesz wznowić.`
- Nie używaj natywnego `window.confirm`.
- Po ponownym otwarciu najpierw pobierz status z serwera. Jeśli istnieje aktywna wyprawa, pokaż przycisk `Wznów wyprawę` i liczbę pozostałych rzutów.
- Odświeżenie strony nie może tworzyć nowego slotu ani nowej wyprawy, jeśli stara nadal jest aktywna.
- Ukrycie karty nie zatrzymuje terminów. Po powrocie przelicz fazę z deadline’u; przeterminowane branie albo przejście holowania jest pudłem.
- Po północy w Warszawie nowy limit dotyczy nowych sesji. Aktywna sesja zachowuje `date_key` z chwili rozpoczęcia.

## Dziennik połowów i rekordy

Na ekranie `intro` oraz wyniku pokaż mały, nieprzytłaczający panel statystyk:

- rekord wyprawy,
- liczba wszystkich udanych połowów,
- najlepsza zdobycz,
- wykorzystane wyprawy nagradzane dzisiaj: `X/3`,
- ostatnie 5 ukończonych wypraw z datą, wynikiem i trybem.

Rekord i historia po zalogowaniu pochodzą z serwera. Dla anonimowego treningu rekord może być przechowywany lokalnie, ale nigdy nie wpływa na nagrody ani limity.

Nie dodawaj w tej iteracji globalnego rankingu ani nagród sezonowych. Przygotuj dane tak, aby można je było dodać później, ale nie rozszerzaj zakresu na cały portal.

## Interfejs i oprawa

- Zachowaj nagłówek `Połów w Zamarzniętym Fjordzie • Przystań Drakkarów` oraz podtytuł o arktycznym połowie składników i skarbów.
- W `intro` pokaż zasady w maksymalnie 5 krótkich punktach. Pełna mechanika ma być zrozumiała bez zewnętrznego regulaminu.
- Główny licznik pokazuje `Rzut 1/4`, wynik i liczbę zdobyczy.
- Przerębel może pozostać centralnym polem wizualnym. Podczas brania woda i obręcz lodu pulsują bursztynowo, podczas zerwania żyłki krótko czerwono, a przy zdobyczy kolorem rzadkości.
- Belka holowania ma być duża i czytelna, nie może polegać tylko na kolorze. Bezpieczna strefa otrzymuje także wzór lub obrys.
- Ostatnie 300 ms zacięcia sygnalizuj czerwonym kolorem i subtelnym pulsem.
- Po złowieniu pokaż kartę zdobyczy z rzadkością, opisem lore, wynikiem rzutu i informacją, czy może trafić do ekwipunku.
- Nie pokazuj kilku globalnych powiadomień dla jednego połowu. Jedna wyprawa kończy się jednym zbiorczym powiadomieniem.
- Dźwięki uruchamiaj wyłącznie przez istniejący `SoundContext` i respektuj wyciszenie. Nie dodawaj plików audio ani autoplay.
- Nie dodawaj zewnętrznych bibliotek, obrazów ani fontów.
- Animacje mają być lekkie. Bez agresywnego trzęsienia całego ekranu, ciężkich filtrów i setek cząstek.
- Przy `prefers-reduced-motion: reduce` wyłącz pulsowanie i płynne przesunięcia. W holowaniu zastąp ruch trzema czytelnymi, czasowymi próbami wyboru strefy, zachowując te same zasady punktowe.

## Responsywność i dostępność

- Modal musi być w pełni grywalny od szerokości 360 px do desktopu.
- Na telefonie zawartość może się przewijać pionowo, ale przyciski aktywnej fazy powinny pozostać łatwo dostępne.
- Wszystkie aktywne kontrolki mają mieć co najmniej 44 × 44 px.
- Przycisk zamknięcia, wybór przynęty, zacięcie i holowanie muszą mieć `aria-label`, widoczny fokus i obsługę Enter/Spacja.
- Zmiany `BIERZE`, ocena próby i wynik rzutu ogłaszaj przez rozsądnie użyte `aria-live`; nie ogłaszaj każdej klatki animacji.
- Nie polegaj wyłącznie na kolorze rzadkości i wyniku. Zawsze pokazuj tekst oraz ikonę lub wzór.
- Po zmianie fazy przenieś fokus na właściwą kontrolkę, ale nie kradnij go po zamknięciu modala. Po zamknięciu zwróć fokus do elementu, który otworzył grę, jeśli obecna architektura na to pozwala.
- Klawisze gry obsługuj tylko przy otwartym modalu i aktywnej fazie. Nie blokuj skrótów strony po zamknięciu.
- Teksty mają być po polsku, poprawne językowo i spójne. Nazwa waluty: `Skirniry`.

## Organizacja kodu i granice zmian

- Główny komponent pozostaje w `src/components/IceFishingModal.jsx` i nadal przyjmuje `{ isOpen, onClose }`.
- Przenieś stałe mechaniki, przynęty, katalog zdobyczy i czyste funkcje punktacji do osobnego modułu, np. `src/data/iceFishingData.js` albo `src/utils/iceFishing.js`.
- Możesz utworzyć dedykowany arkusz `IceFishingModal.css`. Wszystkie klasy prefiksuj, np. `ice-fishing__`, aby nie wpływać na inne widoki.
- Dodaj małą, dedykowaną trasę serwera, np. `server/routes/fishing.js`, potrzebne tabele/migracje w istniejącym systemie bazy oraz metody w `src/api.js`.
- Jeśli współdzielona funkcja ekwipunku nie obsługuje `quantity`, dodaj minimalne wsparcie wyłącznie w miejscach koniecznych do poprawnego wyświetlenia nagrody z połowu. Nie refaktoryzuj całego rynku.
- Nie refaktoryzuj przy okazji `SchoolContext`, innych minigier, routingu, ekspedycji ani wyglądu całego portalu.
- Nie instaluj nowych bibliotek.
- Nie zostawiaj pustych `catch`, niezabezpieczonych Promise ani nieczyszczonych timerów.
- Nie przyznawaj optymistycznie nagrody przed potwierdzeniem transakcji serwera. Możesz optymistycznie animować wynik rzutu, ale ekran nagrody musi czekać na odpowiedź `complete`.

## Testy wymagane przed zakończeniem

Dodaj testy czystej logiki i tras serwera w stylu istniejących testów projektu.

Minimalne przypadki:

1. Każda kombinacja oceny zacięcia i trzech prób holowania daje prawidłowy wynik 0–170.
2. Ryba nie zostaje złowiona przy mniej niż dwóch udanych próbach holowania.
3. Granice rzadkości: 119/120, 139/140, 154/155 i 164/165.
4. Granice nagród: 199/200, 319/320, 439/440 i 559/560.
5. Trzecia wyprawa nagradzana w Warszawie jest dozwolona, czwarta odrzucona albo wymuszona jako trening.
6. Dwa równoczesne żądania rozpoczęcia nie rezerwują czwartego slotu.
7. Podwójne zakończenie tego samego `runId` daje jedną wypłatę, jedną transakcję punktową, jedną bankową i najwyżej jeden przedmiot.
8. Podwójne zakończenie tego samego `castId` nie zwiększa wyniku ani liczby rzutów.
9. Serwer odrzuca rzut nr 4 przed rzutem nr 2, niedozwoloną przynętę i przekroczenie limitu przynęty.
10. Użytkownik bez Zakonu nie dostaje punktów fikcyjnego Zakonu, ale zachowuje należne Skirniry i przedmiot.
11. Niezalogowany użytkownik nie może uruchomić wyprawy nagradzanej.
12. Wygasła oraz porzucona wyprawa nie daje nagrody i nadal zużywa slot.
13. Błąd w dowolnej części wypłaty wycofuje całą transakcję.
14. Strefa `Europe/Warsaw` działa poprawnie również przy zmianie czasu letniego i zimowego.
15. Zamknięcie, ponowne otwarcie i odmontowanie komponentu nie pozostawia timeoutów ani aktywnych animacji.
16. `npm run build` kończy się bez błędów, a testy istniejących ekspedycji i ekonomii nadal przechodzą.

## Kryteria odbioru

Implementacja jest gotowa dopiero, gdy wszystkie poniższe warunki są spełnione:

1. Jedna wyprawa zawsze zawiera cztery rozliczone rzuty i ma pełny ekran podsumowania.
2. Zacięcie ma rzeczywiste okno 1300 ms, a holowanie składa się z trzech ocenianych prób.
3. Wynik rzutu i wyprawy jest deterministycznie wyliczany z ocen, bez ukrytych mnożników.
4. Jakość zdobyczy wynika z umiejętności i wybranej przynęty, nie z czysto losowej nagrody.
5. Nie da się rozliczyć dwa razy rzutu, sesji, waluty, punktów ani przedmiotu.
6. Limit trzech wypraw nagradzanych jest trwały, serwerowy i odporny na odświeżenie oraz równoczesne żądania.
7. Porzucanie słabego początku nie pozwala odzyskać zużytego slotu.
8. Przy niedostępnym serwerze działa wyłącznie trening, bez pozorowanej wypłaty.
9. Brak Zakonu nie powoduje naliczenia punktów Ravnheimowi.
10. Ekwipunek otrzymuje najwyżej jeden wartościowy przedmiot na wyprawę i poprawnie stackuje duplikaty.
11. Modal można zamknąć, wznowić i ponownie otworzyć bez starego stanu oraz pracujących timerów.
12. Gra jest czytelna i obsługiwalna klawiaturą, dotykiem i myszą przy 360 px oraz na desktopie.
13. Przy ograniczonych animacjach mechanika pozostaje w pełni grywalna.
14. Build i wymagane testy przechodzą.

## Oczekiwany raport Claude po wdrożeniu

Na końcu pracy Claude ma podać krótko i konkretnie:

- zmienione i dodane pliki,
- przebieg jednej wyprawy,
- sposób obliczania wyniku, rzadkości i nagrody,
- sposób rezerwacji limitu dziennego,
- sposób zapewnienia idempotencji i atomowej wypłaty,
- zachowanie po zamknięciu, odświeżeniu i utracie połączenia,
- wykonane testy wraz z ich wynikiem.

Nie ogłaszaj ukończenia, jeśli nagrody nadal są przyznawane z poziomu komponentu, limit istnieje tylko w stanie Reacta albo `localStorage`, a ponowne wywołanie zakończenia może dopisać nagrodę drugi raz.
