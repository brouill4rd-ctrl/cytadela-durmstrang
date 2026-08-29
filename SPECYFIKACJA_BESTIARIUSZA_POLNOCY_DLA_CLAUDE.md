# Bestiariusz Północy — zasady, mechaniki i limity implementacji dla Claude

## Zadanie

Rozbuduj istniejący komponent `src/components/BestiaryModal.jsx` z prostego, statycznego katalogu czterech stworzeń w pełny moduł **„Bestiariusz Północy • Ekspedycja Badawcza”**.

Moduł ma łączyć dwie funkcje:

1. **Archiwum Bestii** — spokojne przeglądanie istniejących kart stworzeń, ich siedlisk, klas zagrożenia, słabości i kronik.
2. **Ekspedycja Badawcza** — krótka gra wiedzy i szybkiego podejmowania decyzji, w której gracz rozpoznaje stworzenia po śladach, a następnie wybiera prawidłową reakcję obronną.

Nie wykonuj wyłącznie kosmetycznego liftingu. Dodaj rzeczywistą pętlę rozgrywki, wynik badawczy, trwały postęp odkryć, bezpieczne limity ekonomii i walidację po stronie serwera.

Zachowaj obecną tożsamość wizualną: ciemny granat i czerń, stare złoto, czerwone akcenty zagrożenia, runiczna typografia, układ listy bestii po lewej i szczegółowej karty po prawej. Nie przebudowuj przy okazji wyglądu całego portalu.

## Obecny stan i problemy do rozwiązania

Obecnie `BestiaryModal.jsx`:

- zawiera cztery bestie zapisane bezpośrednio w komponencie,
- pozwala tylko przełączać statyczne karty,
- nie ma rozgrywki, punktacji, odkryć ani historii prób,
- nie ma API ani trwałego zapisu,
- używa emoji jako głównych ikon bestii,
- odtwarza ten sam zastępczy zestaw dźwięków dla każdego „odgłosu bestii”,
- po zamknięciu zachowuje `selectedBeast`, zamiast zawsze otwierać się w jednoznacznym stanie,
- nie ma pełnej obsługi klawiatury, zarządzania fokusem i responsywnego układu dla telefonu.

Nie usuwaj obecnych czterech stworzeń ani ich lore. Traktuj je jako kanoniczną zawartość startową:

1. Smok Lodowych Fiordów (Dreki),
2. Widmowy Wilk Północy (Ulfr),
3. Lodowy Jotun (Jötunn),
4. Głębinowy Kraken ze Skandów.

## Dwa tryby modułu

### 1. Archiwum Bestii

Archiwum jest dostępne bez rozpoczynania gry. Zachowaj obecną listę kart i szczegóły stworzenia, ale uporządkuj dane poza komponentem oraz dodaj:

- licznik poznanych bestii, np. `2/4 pieczęcie badacza`,
- osobną sekcję `Notatka terenowa`,
- stan odkrycia dla każdej bestii,
- przycisk `Rozpocznij ekspedycję`,
- zakładki lub przełącznik `Archiwum` / `Ekspedycja`,
- czytelny stan ładowania i błąd pobierania postępu.

Nie odbieraj graczowi informacji, które są już widoczne w obecnym Bestiariuszu. Nazwa, klasa zagrożenia, siedlisko, opis, słabość i fragment kroniki pozostają publiczne. Elementem kolekcjonerskim jest nowa `Notatka terenowa` oraz `Pieczęć badacza`.

Pieczęć dla bestii zostaje odblokowana po pierwszym bezbłędnym spotkaniu z nią, czyli po poprawnym rozpoznaniu i poprawnej reakcji obronnej w ramach jednego spotkania. Odblokowanie jest trwałe, jednorazowe i nie daje osobnej nagrody ekonomicznej.

### 2. Ekspedycja Badawcza

Jedna ekspedycja składa się z dokładnie **4 spotkań**. Każda z czterech kanonicznych bestii występuje dokładnie raz, a kolejność jest losowana po stronie serwera.

Typowa ekspedycja powinna trwać około 45–75 sekund. Gracz nie może otworzyć kart Archiwum podczas aktywnej ekspedycji; przed startem może jednak dowolnie studiować Bestiariusz.

Gra ma używać jednoznacznych stanów:

1. `archive` — przeglądanie kart.
2. `briefing` — zasady, dzisiejszy limit, rekord i przycisk startu.
3. `countdown` — odliczanie 3, 2, 1.
4. `observe` — stopniowe ujawnianie śladów i wybór bestii.
5. `countermeasure` — wybór kontrzaklęcia lub procedury obronnej.
6. `encounter_result` — poprawne odpowiedzi, zdobyte punkty i utracone pieczęcie.
7. `expedition_result` — wynik końcowy, odkrycia i rozliczenie nagrody.
8. `resume_prompt` — informacja o aktywnej ekspedycji możliwej do wznowienia.

Nie opieraj logiki na wielu luźnych flagach boolean. Użyj jednego jawnego stanu fazy i kontrolowanych przejść.

## Mechanika spotkania

### Pieczęcie ochronne

- Gracz rozpoczyna ekspedycję z **4 pieczęciami ochronnymi**.
- Błędne rozpoznanie albo brak odpowiedzi w terminie odbiera 1 pieczęć.
- Błędna reakcja obronna albo brak odpowiedzi w terminie odbiera 1 pieczęć.
- Wynik punktowy nigdy nie spada poniżej 0.
- Gdy liczba pieczęci spadnie do 0, serwer kończy ekspedycję statusem `failed`.
- Nie można zdobyć nagrody ekonomicznej za ekspedycję zakończoną statusem `failed`, niezależnie od wcześniejszego wyniku.
- Niezerowy wynik z nieudanej ekspedycji można pokazać jako wynik treningowy, ale nie może on zostać uznany za rekord ukończonej ekspedycji.

### Etap A — obserwacja i rozpoznanie

Każde spotkanie ma trzy wskazówki dotyczące jednej bestii. Wskazówki są ujawniane według czasu serwera:

| Moment od rozpoczęcia etapu | Stan |
|---:|---|
| 0 ms | widoczna wskazówka 1 |
| 2500 ms | widoczna wskazówka 2 |
| 5000 ms | widoczna wskazówka 3 |
| 9000 ms | koniec czasu na odpowiedź |

Pod trzema wskazówkami pokaż cztery odpowiedzi — nazwy czterech bestii — w kolejności losowanej przez serwer.

Punkty za poprawne rozpoznanie zależą od liczby ujawnionych wskazówek w chwili przyjęcia odpowiedzi przez serwer:

| Poprawna odpowiedź | Punkty |
|---|---:|
| po 1. wskazówce | 100 |
| po 2. wskazówce | 75 |
| po 3. wskazówce | 50 |
| odpowiedź błędna albo brak odpowiedzi | 0 |

Kliknięcie odpowiedzi natychmiast ją blokuje. Szybkie wielokrotne kliknięcie, podwójne żądanie albo powrót odpowiedzi po czasie nie może rozliczyć etapu więcej niż raz.

### Etap B — reakcja obronna

Po rozliczeniu identyfikacji rozpoczyna się osobny etap trwający **8 sekund**. Pokaż cztery możliwe reakcje. Dokładnie jedna jest prawidłowa dla danego stworzenia.

| Rezultat | Punkty | Skutek |
|---|---:|---|
| poprawna reakcja | +50 | bez utraty pieczęci |
| błędna reakcja | 0 | utrata 1 pieczęci |
| brak odpowiedzi | 0 | utrata 1 pieczęci |

Kanoniczne poprawne reakcje:

| Bestia | Poprawna reakcja |
|---|---|
| Smok Lodowych Fiordów | Płomień Berserka (`Ignis Furor`) |
| Widmowy Wilk Północy | Lumos Borealis — Rozproszenie Cienia |
| Lodowy Jotun | Runa Przełamania (`Thurisaz`) |
| Głębinowy Kraken ze Skandów | Runiczny Piorun (`Tiwaz`) |

Pozostałe trzy reakcje są wiarygodnymi, lecz błędnymi dystraktorami. Nie używaj absurdalnych odpowiedzi, które zdradzają rozwiązanie bez znajomości Bestiariusza.

### Premia za bezbłędne spotkanie

Jeśli gracz poprawnie rozpozna bestię i wybierze poprawną reakcję w tym samym spotkaniu, otrzymuje dodatkowo **+25 punktów** i odblokowuje Pieczęć badacza tej bestii, jeżeli jeszcze jej nie posiada.

Nie stosuj mnożników combo. Wynik ma być łatwy do sprawdzenia i identyczny po stronie klienta oraz serwera.

### Matematyka wyniku

Maksimum jednego spotkania:

- 100 punktów za rozpoznanie po pierwszej wskazówce,
- 50 punktów za reakcję,
- 25 punktów premii za bezbłędne spotkanie,
- razem **175 punktów**.

Maksimum ekspedycji: **4 × 175 = 700 punktów**.

Serwer ma zapisywać osobno wynik każdego etapu i sam wyliczać sumę. Klient nigdy nie wysyła wiążącego wyniku końcowego.

## Bank wskazówek i uczciwe losowanie

Dla każdej bestii przygotuj co najmniej **3 warianty zestawu wskazówek**. Jeden zestaw zawiera:

1. ślad fizyczny,
2. oznakę magiczną albo dźwięk,
3. zachowanie lub pozostałość środowiskową.

Łącznie bank startowy ma więc zawierać minimum 12 zestawów. Teksty muszą być zgodne z istniejącym opisem i lore. Nie kopiuj całego opisu bestii jako wskazówki i nie używaj jej nazwy, przydomka ani oczywistego fragmentu nazwy w treści wskazówki.

Serwer dla każdej ekspedycji:

- losuje kolejność czterech bestii bez powtórzeń,
- losuje jeden wariant wskazówek dla każdej bestii,
- losuje kolejność czterech nazw w identyfikacji,
- losuje kolejność czterech reakcji obronnych,
- zapisuje wybrany wariant i kolejność opcji w sesji, aby odświeżenie strony nie zmieniało pytań,
- nie wysyła klientowi pola typu `correct: true`, identyfikatora poprawnej odpowiedzi ani pełnego banku odpowiedzi.

Wskazówki nie mogą się zmieniać po wznowieniu sesji. Użyj wersjonowania banku pytań, np. `challenge_version`, aby późniejsza edycja treści nie zmieniła trwającej lub historycznej ekspedycji.

## Wynik końcowy i statystyki

Na ekranie `expedition_result` pokaż:

- wynik na 700,
- status `completed` albo `failed`,
- poprawne rozpoznania na 4,
- poprawne reakcje na 4,
- liczbę bezbłędnych spotkań,
- liczbę pozostałych pieczęci ochronnych,
- średnią liczbę wskazówek potrzebnych do poprawnego rozpoznania; jeśli nie było poprawnych rozpoznań, pokaż `—`,
- czas całej ekspedycji liczony przez serwer,
- nowo odblokowane Pieczęcie badacza,
- otrzymane punkty Zakonu i Skirniry albo jednoznaczny powód braku nagrody,
- rozpisane cztery spotkania: bestia, wynik identyfikacji, wynik reakcji i premia.

Nie mieszaj pojęć. Punkty `0–700` nazywaj **wynikiem badawczym**, a nagrodę dla rankingu szkoły **punktami Zakonu**.

## Nagrody i limity ekonomii

Gracz może grać treningowo bez ograniczeń, ale ma maksymalnie **3 próby premiowane dziennie** według strefy `Europe/Warsaw`.

Slot próby premiowanej jest rezerwowany przy utworzeniu sesji nagradzanej, przed pokazaniem pierwszego zestawu wskazówek. Nie rezerwuj go dopiero po poznaniu wyniku. Przerwanie, wygaśnięcie lub porażka zużywa rozpoczęty slot i nie daje nagrody.

| Wynik ukończonej ekspedycji | Punkty Zakonu | Skirniry |
|---:|---:|---:|
| 0–249 | 0 | 0 |
| 250–399 | 2 | 2 |
| 400–524 | 4 | 3 |
| 525–624 | 6 | 5 |
| 625–700 | 8 | 7 |

Twarde limity:

- jedna ekspedycja może utworzyć najwyżej jedną nagrodę,
- maksymalna nagroda jednej ekspedycji to 8 punktów Zakonu i 7 Skirnirów,
- maksimum dzienne wynosi 24 punkty Zakonu i 21 Skirnirów,
- czwarta i każda następna ekspedycja danego dnia działa wyłącznie jako trening,
- wynik `failed`, `abandoned` albo `expired` zawsze daje 0/0,
- wynik poniżej 250 nie dostaje gwarantowanej nagrody minimalnej,
- tryb treningowy nie daje punktów Zakonu ani Skirnirów, nawet przy wyniku 700,
- Pieczęcie badacza i notatki terenowe nie są walutą i nie można ich wymieniać ani zdobywać ponownie,
- niezalogowany użytkownik może korzystać z Archiwum i lokalnego treningu, lecz nie ma trwałego zapisu ani wypłat,
- jeśli backend jest niedostępny, pozwól tylko na jasno oznaczony trening bez nagród i bez trwałych odkryć.

Na ekranie briefingu pokaż `Próby premiowane: X/3`. Po wykorzystaniu limitu przycisk ma mieć tekst `Rozpocznij trening`, a obok komunikat: `Dzisiejszy limit nagród został wykorzystany — wynik tej ekspedycji będzie treningowy.`

Punkty Zakonu przyznawaj tylko wtedy, gdy zalogowany użytkownik ma prawidłowy identyfikator Zakonu istniejący w bazie (`reinhall`, `bjornhall`, `ravnheim` albo `otergard`). Brak Zakonu nie może oznaczać domyślnego Ravnheimu i nie blokuje należnych Skirnirów.

## Serwer jako źródło prawdy

Nie rozliczaj ekspedycji przez bezpośrednie wywołania `awardHousePoints`, `addCurrency` ani przez wartości podane przez komponent. Dodaj dedykowaną trasę i serwis Bestiariusza.

Serwer jest źródłem prawdy dla:

- trybu sesji `rewarded` / `training`,
- dziennego limitu i rezerwacji slotu,
- kolejności bestii i opcji,
- czasu rozpoczęcia oraz deadline każdego etapu,
- liczby ujawnionych wskazówek w momencie odpowiedzi,
- poprawności odpowiedzi,
- utraty pieczęci,
- punktów etapów i sumy,
- statusu ekspedycji,
- odblokowanych Pieczęci badacza,
- progów i wypłaty nagród.

Klient może wysyłać wyłącznie identyfikatory akcji i wybranych opcji. Nie może wysyłać jako wiążących: `score`, `isCorrect`, `cluesSeen`, `remainingWards`, `durationMs`, liczby punktów Zakonu, liczby Skirnirów ani identyfikatora Zakonu.

Nie opisuj rozwiązania jako pełnego systemu anty-cheat. Celem jest serwerowe rozliczanie, idempotencja, poprawna kolejność, ochrona limitu i odporność na proste manipulowanie żądaniami.

## Minimalny model danych

Dodaj migracje w stylu już używanym przez `server/db.js`.

### `bestiary_sessions`

- `id` — `runId`, klucz główny,
- `user_id`,
- `mode` — `rewarded | training`,
- `status` — `active | completed | failed | abandoned | expired`,
- `date_warsaw`,
- `challenge_version`,
- `current_encounter` — 0–3,
- `current_phase` — `countdown | observe | countermeasure | encounter_result | finished`,
- `wards_remaining` — 0–4,
- `score` — 0–700,
- `reward_slot_reserved` — 0/1,
- `reward_house_points`,
- `reward_skirnirs`,
- `rewarded` — 0/1,
- `started_at`, `last_active_at`, `completed_at`.

### `bestiary_encounters`

- `id` — stabilny identyfikator spotkania,
- `session_id`,
- `encounter_index` — 0–3,
- `beast_id`,
- `clue_set_id`,
- `identify_options_json`,
- `counter_options_json`,
- `observe_started_at`, `observe_deadline_at`,
- `identify_action_id`, `identify_choice_id`, `identify_answered_at`,
- `clues_seen`, `identify_correct`, `identify_points`,
- `counter_started_at`, `counter_deadline_at`,
- `counter_action_id`, `counter_choice_id`, `counter_answered_at`,
- `counter_correct`, `counter_points`,
- `flawless_bonus`, `ward_loss`,
- unikalność `(session_id, encounter_index)`.

### `bestiary_discoveries`

- `user_id`,
- `beast_id`,
- `field_note_unlocked` — 0/1,
- `unlocked_at`,
- `source_session_id`,
- klucz główny `(user_id, beast_id)`.

Dodaj indeks dla `(user_id, date_warsaw, reward_slot_reserved)` oraz mechanizm uniemożliwiający więcej niż jedną aktywną sesję użytkownika. Jeśli używasz indeksu częściowego SQLite, uwzględnij zgodność z istniejącą bazą i testami.

## Kontrakt API

Dodaj metody do `src/api.js` i trasę, np. `server/routes/bestiary.js`, zamontowaną pod `/api/bestiary`.

Minimalne endpointy:

1. `GET /api/bestiary/catalog` — publiczne dane kart bez sekretów walidacyjnych.
2. `GET /api/bestiary/status` — dla zalogowanego użytkownika: odkrycia, rekord, statystyki, liczba użytych prób premiowanych i aktywna sesja.
3. `POST /api/bestiary/sessions` — utworzenie sesji z `runId` i żądanym trybem; serwer może wymusić trening po wykorzystaniu limitu.
4. `GET /api/bestiary/sessions/:sessionId` — bezpieczne wznowienie i aktualny, przefiltrowany stan spotkania.
5. `POST /api/bestiary/sessions/:sessionId/identify` — body: `actionId`, `choiceId`.
6. `POST /api/bestiary/sessions/:sessionId/countermeasure` — body: `actionId`, `choiceId`.
7. `POST /api/bestiary/sessions/:sessionId/advance` — przejście po planszy wyniku do następnego spotkania; ma być idempotentne.
8. `POST /api/bestiary/sessions/:sessionId/complete` — atomowe domknięcie i ewentualna wypłata; ponowne wywołanie zwraca poprzedni rezultat.
9. `POST /api/bestiary/sessions/:sessionId/abandon` — jawne przerwanie po potwierdzeniu; idempotentne i bez nagrody.

Każda trasa sesyjna sprawdza właściciela przez `req.user.id`. Nigdy nie przyjmuj dowolnego `userId` z body.

Endpoint zwracający aktywną fazę może zwracać tylko wskazówki, których czas ujawnienia już nastąpił. Alternatywnie może zwrócić wskazówki z ich czasami ujawnienia, ale nigdy nie może zwracać poprawnych odpowiedzi. Po upływie deadline serwer przy najbliższym odczycie lub zapisie ma sam rozliczyć timeout; brak callbacku klienta nie może zatrzymać sesji w nieskończoność.

## Walidacje i idempotencja

Waliduj co najmniej:

- `runId`, `sessionId`, `actionId` i `choiceId` są niepustymi identyfikatorami o ograniczonej długości, np. maks. 100 znaków,
- sesja należy do uwierzytelnionego użytkownika,
- sesja ma właściwy status i fazę,
- indeks spotkania jest w zakresie 0–3,
- każda z czterech bestii występuje dokładnie raz,
- wybrana opcja należy do zapisanej listy opcji dla bieżącego etapu,
- odpowiedź nie może dotyczyć przyszłego lub zakończonego spotkania,
- `actionId` oraz unikalność etapu uniemożliwiają podwójne rozliczenie,
- po deadline odpowiedź jest traktowana jak timeout; nie ufaj czasowi z urządzenia gracza,
- dopuszczalna tolerancja transportowa może wynosić maksymalnie 750 ms i musi być stałą serwera, nie wartością z klienta,
- `wards_remaining` zawsze pozostaje w zakresie 0–4,
- `identify_points` należy do zbioru `0 | 50 | 75 | 100`,
- `counter_points` należy do zbioru `0 | 50`,
- `flawless_bonus` należy do zbioru `0 | 25`,
- końcowy wynik jest liczbą całkowitą 0–700 i wynika wyłącznie z zapisanych etapów,
- ukończenie wymaga czterech rozliczonych spotkań, chyba że pieczęcie spadły do 0 i sesja otrzymała status `failed`,
- sesja `failed`, `abandoned`, `expired` albo `training` nie może otrzymać wypłaty,
- próba premiowana jest rezerwowana w transakcji, również przy dwóch równoczesnych żądaniach,
- istnieje najwyżej jedna aktywna sesja użytkownika; ponowny start ma zwrócić sesję do wznowienia zamiast tworzyć drugą,
- `runId` istniejący dla innego użytkownika daje konflikt i nie ujawnia danych cudzej sesji,
- powtórzenie identycznego żądania zwraca zapisany rezultat bez zmiany wyniku, pieczęci, odkryć i ekonomii.

Wszystkie czasy zapisuj jako pełne znaczniki UTC. Klucz dnia do limitu wyznaczaj wyłącznie na serwerze w strefie `Europe/Warsaw`.

## Atomowa wypłata

Końcowe rozliczenie wykonaj w jednej transakcji `better-sqlite3`:

1. ponownie odczytaj i zablokuj logicznie bieżący stan sesji,
2. sprawdź, czy sesja nie była już zakończona,
3. zsumuj zapisane etapy,
4. wylicz próg nagrody,
5. zapisz status i nagrodę w sesji,
6. dodaj nowe odkrycia przez `INSERT ... ON CONFLICT DO NOTHING`,
7. przyznaj punkty przez istniejący `pointsService` z kluczem `bestiary:{sessionId}:points`, jeśli użytkownik ma prawidłowy Zakon,
8. przyznaj Skirniry przez istniejący `skirnirService` z kluczem `bestiary:{sessionId}:skirniry`,
9. zatwierdź całość.

Jeśli dowolny element transakcji się nie powiedzie, nie pozostawiaj sesji oznaczonej jako wypłacona częściowo. Nie maskuj błędów pustymi `catch` ani samym `console.error`. Klient ma dostać spokojny komunikat i możliwość ponowienia tego samego idempotentnego `complete`.

## Wznawianie, zamykanie i czas

- Zamknięcie modala nie anuluje automatycznie aktywnej ekspedycji.
- Po ponownym otwarciu pokaż `resume_prompt` i przycisk `Wznów ekspedycję`.
- Drugi przycisk `Przerwij ekspedycję` wymaga potwierdzenia i ustawia `abandoned`.
- Aktywna sesja wygasa po **15 minutach** od ostatniej prawidłowej aktywności.
- Wygasła próba premiowana zużywa zarezerwowany slot i nie daje nagrody.
- Odświeżenie strony nie może zmienić bestii, wskazówek, kolejności odpowiedzi ani wyzerować limitu.
- Deadline etapu jest znacznikiem serwerowym. Timer w React służy tylko do prezentacji.
- Po powrocie z ukrytej karty odśwież stan z serwera i przelicz pozostały czas; ukrycie karty nie może zatrzymać rozgrywki.
- Wszystkie lokalne timeouty, animacje, obserwatory i listenery muszą zostać wyczyszczone po zmianie fazy, zamknięciu i odmontowaniu.
- React Strict Mode nie może utworzyć dwóch sesji ani podwójnie wysłać odpowiedzi lub wypłaty.

## Interfejs i oprawa

Zachowaj układ oraz klimat widoczny w obecnym modalu, ale usuń tekst sugerujący „3D Beast Showcase”, jeśli nie ma rzeczywistego modelu 3D.

### Archiwum

- Lista bestii po lewej, karta po prawej na desktopie.
- Na telefonie lista staje się poziomym, przewijanym selektorem albo rozwijaną listą nad kartą.
- Zastąp przypadkowe emoji spójnymi ikonami `lucide-react`, runami lub lekkimi sylwetkami CSS. Nie dodawaj zewnętrznych bibliotek ani zewnętrznych obrazów.
- `Odgłos Bestii` może używać wyłącznie istniejącego `SoundContext` i musi respektować wyciszenie. Jeśli nie istnieją unikalne nagrania, nazwij funkcję uczciwie `Echo bestii` i użyj subtelnego istniejącego efektu; nie sugeruj realistycznego nagrania.
- Pokaż Pieczęć badacza jako wyraźny, lecz nienachalny znak kolekcjonerski.

### Ekspedycja

- U góry pokaż: spotkanie `N/4`, wynik badawczy i pieczęcie `4/4`.
- W fazie obserwacji wskazówki wyglądają jak kolejne wpisy na pergaminie lub runiczne odciski.
- Nowa wskazówka może pojawić się animacją 120–180 ms, ale od początku nie blokuj klikalności istniejących odpowiedzi.
- Ostatnie 3 sekundy etapu wyróżnij czerwonym kolorem i lekkim pulsem.
- Po odpowiedzi pokaż krótki rezultat, np. `+75 • Rozpoznano po 2 śladach`, `Pieczęć naruszona` albo `+25 • Bezbłędna obserwacja`.
- Nie stosuj mocnego trzęsienia całego ekranu, intensywnych błysków ani dziesiątek cząstek.
- Dla `prefers-reduced-motion: reduce` wyłącz pulsowanie i przesunięcia, zachowując pełną funkcjonalność.

## Responsywność i dostępność

- Modal musi być czytelny od 360 px do dużego desktopu.
- Nie ustawiaj stałej szerokości powodującej poziomy scroll całej strony.
- Modal może mieć wewnętrzne przewijanie, ale nagłówek i najważniejsze statystyki nie mogą znikać bez kontroli.
- Wszystkie przyciski odpowiedzi mają minimum 44 × 44 px.
- Przycisk zamknięcia ma `aria-label="Zamknij Bestiariusz"`.
- Modal ma `role="dialog"`, `aria-modal="true"`, czytelny tytuł przez `aria-labelledby` i opis przez `aria-describedby`.
- Po otwarciu ustaw focus w modalu; Tab i Shift+Tab nie mogą uciekać pod overlay. Po zamknięciu zwróć focus do elementu, który otworzył modal.
- Escape podczas Archiwum zamyka modal. Escape podczas aktywnej ekspedycji pokazuje potwierdzenie wyjścia, ale nie porzuca sesji automatycznie.
- Odpowiedzi muszą działać myszą, dotykiem oraz klawiaturą. Klawisze `1–4` mogą wybierać opcje, lecz skrót ma działać tylko w aktywnej fazie i nie może pozostać po zamknięciu.
- Nie polegaj wyłącznie na kolorze. Poprawną, błędną i wybraną odpowiedź oznacz również ikoną oraz tekstem.
- Aktualizacje wyniku i czasu nie powinny zasypywać czytnika ekranu. Komunikat o rozliczeniu etapu może używać kontrolowanego `aria-live="polite"`.
- Teksty interfejsu mają być po polsku, z poprawnymi znakami. Waluta nazywa się `Skirniry`.

## Granice zmian

Główny zakres:

- `src/components/BestiaryModal.jsx`,
- opcjonalny, prefiksowany arkusz `src/components/BestiaryModal.css`,
- dane publiczne Bestiariusza w dedykowanym module,
- `src/api.js`,
- nowa trasa i ewentualny serwis Bestiariusza po stronie serwera,
- migracje w `server/db.js`,
- montaż trasy w `server/index.js`,
- dedykowane testy serwera.

Nie zmieniaj publicznego kontraktu komponentu: nadal przyjmuje `{ isOpen, onClose }`.

Nie refaktoryzuj przy okazji `SchoolContext`, pozostałych minigier, routingu, banku, systemu punktów ani całej stylistyki portalu. Nie instaluj nowych bibliotek. Użyj istniejącego Reacta, CSS, `lucide-react`, `better-sqlite3`, `pointsService`, `skirnirService` i mechanizmu autoryzacji.

Nie współdziel z frontendem modułu zawierającego poprawne odpowiedzi. Publiczny katalog może być dostępny w przeglądarce, ale serwerowy bank spotkań i logika punktacji pozostają po stronie serwera.

## Testy obowiązkowe

Dodaj testy co najmniej dla następujących przypadków:

1. Maksymalny poprawny wynik czterech spotkań wynosi dokładnie 700.
2. Punktacja identyfikacji wynosi wyłącznie 100, 75, 50 albo 0 zależnie od czasu serwera i poprawności.
3. Błędna odpowiedź i timeout odbierają dokładnie jedną pieczęć.
4. Wynik i pieczęcie nie mogą zejść poza dozwolony zakres.
5. Ta sama akcja `identify` lub `countermeasure` wysłana dwa razy rozlicza się tylko raz.
6. Nie można wysłać odpowiedzi dla niewłaściwej fazy, cudzej sesji ani opcji spoza zapisanej listy.
7. Cztery spotkania zawierają cztery różne kanoniczne bestie.
8. Odświeżenie i wznowienie zwraca te same warianty wskazówek oraz kolejność opcji.
9. Czwarta próba w dniu `Europe/Warsaw` jest treningowa, również po restarcie klienta.
10. Dwa równoczesne starty przy ostatnim wolnym slocie nie tworzą dwóch prób premiowanych.
11. `failed`, `abandoned`, `expired` i `training` dają 0/0.
12. Powtórne `complete` zwraca identyczny rezultat bez drugiej wypłaty i drugiego odkrycia.
13. Użytkownik bez Zakonu otrzymuje należne Skirniry, lecz 0 punktów Zakonu.
14. Brak Zakonu nigdy nie przypisuje punktów Ravnheimowi.
15. Awaria w trakcie transakcji nie pozostawia częściowej nagrody.
16. Pieczęć badacza odblokowuje się tylko raz i tylko po bezbłędnym spotkaniu.
17. Sesja wygasa po 15 minutach i nie daje nagrody.
18. Bank odpowiedzi i odpowiedzi API nie ujawniają flag poprawności przed rozliczeniem.

Na końcu uruchom:

- `npm test`,
- `npm run build`.

Jeżeli testy wymagają kontrolowanego czasu, wstrzyknij funkcję zegara do serwisu zamiast używać prawdziwego oczekiwania w testach.

## Kryteria odbioru

Implementacja jest gotowa dopiero, gdy:

1. Obecne cztery karty Bestiariusza nadal są dostępne i zachowują swój kanoniczny opis.
2. Pełna ekspedycja zawiera cztery różne spotkania i ma maksymalny wynik 700.
3. Gracz rozumie punktację i utratę pieczęci bez czytania osobnego regulaminu.
4. Serwer, a nie klient, rozstrzyga czas, poprawność, wynik, limit i nagrody.
5. Wielokrotne kliknięcia, ponowione żądania, React Strict Mode i odświeżenie nie naliczają niczego podwójnie.
6. Trzy rozpoczęte próby premiowane wyczerpują dzienny limit; porzucanie słabych prób nie pozwala go obejść.
7. Maksymalna dzienna wypłata wynosi 24 punkty Zakonu i 21 Skirnirów.
8. Brak Zakonu nie powoduje przyznania punktów fikcyjnemu Zakonowi.
9. Zamkniętą sesję można bezpiecznie wznowić, a wygasłą lub przerwaną poprawnie rozliczyć bez nagrody.
10. Pieczęcie badacza są trwałe, jednorazowe i niezależne od ekonomii.
11. Modal działa przy 360 px, na desktopie, klawiaturą i z ograniczeniem animacji.
12. `npm test` i `npm run build` kończą się bez błędów.

Na końcu pracy podaj krótko:

- zmienione pliki,
- pełną matematykę wyniku,
- sposób rezerwowania dziennego limitu,
- sposób zapewnienia idempotencji i atomowej wypłaty,
- zachowanie przy zamknięciu, odświeżeniu i awarii backendu,
- wykonane testy i ich wyniki.

Nie ogłaszaj sukcesu, jeśli limit, wynik lub nagrody nadal są kontrolowane wyłącznie przez stan Reacta albo `localStorage`.
