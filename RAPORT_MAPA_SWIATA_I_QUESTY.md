# Raport: mapa świata i system questów Durmstrangu

Data przeglądu: 30 sierpnia 2026

## 1. Wniosek w skrócie

Mapa jest bardzo mocna wizualnie i ma solidny fundament techniczny: dwie warstwy, płynne przesuwanie i przybliżanie, filtry, piętra Twierdzy, znaczniki, odkrycia, śledzenie lokacji oraz podpinane minigry. Zawartość fabularna także jest obszerna i spójna klimatycznie.

Największy problem nie leży w ilości treści, tylko w domknięciu pętli rozgrywki. W bazie znajduje się 64 rozpisanych questów, ale obecny widok mapy pokazuje je wyłącznie jako karty informacyjne. Nie da się ich uruchomić ani ukończyć z mapy. Starszy mechanizm wykonywania questów został wyłączony jednocześnie po stronie klienta i serwera, a nowy, bezpieczny system Ekspedycji działa osobno i nie jest podpięty do żadnego znacznika mapy.

Ocena obecnego stanu:

- oprawa i klimat mapy: **9/10**,
- jakość oraz ilość treści fabularnej: **8/10**,
- nawigacja i fundament interfejsu: **7/10**,
- działająca pętla questowa: **3/10**,
- spójność reguł, progresji i nagród: **4/10**,
- gotowość całości do użycia jako pełny system RPG: **5/10**.

## 2. Co obecnie znajduje się w projekcie

Rzeczywisty stan bazy:

| Element | Stan |
|---|---:|
| Warstwy mapy | 2 |
| Lokacje łącznie | 54 |
| Lokacje na mapie świata | 38 |
| Lokacje w Twierdzy | 16 |
| Questy zapisane przy lokacjach | 64 |
| Questy świata | 48 |
| Questy Twierdzy | 16 |
| Widoczne znaczniki | 48 |
| Ukryte znaczniki | 6 |
| Lokacje oznaczone w danych jako zablokowane | 10 |
| Aktywności faktycznie podpięte do mapy | 2, obie to połów |
| Ukończone starsze questy w bazie | 0 |
| Zapisane próby nowych Ekspedycji | 6 |

Warstwy:

1. **Mapa Północy** — obraz `public/world_map.webp`, 38 znaczników.
2. **Twierdza Durmstrang** — obraz `public/durmstrang_fortress_map.webp`, 16 znaczników rozdzielanych na cztery poziomy: 2, 1, 0 i -1.

Rozkład 48 questów świata według trudności:

- 20 łatwych,
- 11 średnich,
- 10 trudnych,
- 7 legendarnych.

Mapa świata zawiera kilka wyraźnych linii fabularnych: Jötunskóg, Havnhold, Runehaven, Skallgard, Fjord, Frostfang, Fjormhard, dwanaście kamieni runicznych i finałowy Trzynasty Kamień. To dobra podstawa pod dłuższą kampanię eksploracyjną.

## 3. Jak system jest zbudowany

### Frontend mapy

Główny widok znajduje się w `src/views/MapView.jsx`. Składa się z osobnych komponentów:

- `MapViewport` — przesuwanie, przybliżanie, obsługa myszy i dotyku,
- `MapMarker` — wygląd i zachowanie znaczników,
- `MapInfoPanel` — opis lokacji, lore, NPC, nagrody i lista questów,
- `MapFilters` — filtrowanie typów znaczników,
- `MapLayerSelector` — przełączanie mapy świata i Twierdzy,
- `MapControls` — zoom, reset oraz piętra,
- `MapQuestTracker` — śledzenie wybranej lokacji.

Podział jest czytelny i umożliwia dalszą rozbudowę bez przepisywania całego widoku.

### Backend mapy

`server/routes/map.js` udostępnia:

- listę warstw,
- stan mapy dopasowany do zalogowanego użytkownika,
- odkrywanie lokacji,
- śledzenie lokacji,
- administracyjne operacje na warstwach i znacznikach.

Postęp odkryć i śledzenie są trzymane w osobnych tabelach użytkownika, więc nie są tylko stanem lokalnym przeglądarki.

### Dwa systemy questowe

W projekcie istnieją dwa różne mechanizmy:

1. **Starsze questy lokacyjne** — 64 rozbudowane wpisy JSON przy lokacjach. Zawierają tytuły, opisy, trudność, kanał Discord, sugerowane akcje, słowa rozwiązania, komunikaty sukcesu/porażki i nagrody.
2. **Nowe Ekspedycje** — trzy krótkie, dwuetapowe wyprawy oceniane na serwerze, z dziennym limitem, idempotentnymi nagrodami i testami automatycznymi.

Nowe Ekspedycje są bezpieczniejsze i rzeczywiście działają. Starsze questy są obecnie treścią prezentacyjną, nie aktywną mechaniką.

## 4. Najmocniejsze strony

### Bardzo dobra oprawa

Obie mapy są wysokiej jakości, spójne tonalnie i czytelne jako tło pod interaktywne znaczniki. Mapa świata ma logiczny rozkład: las na zachodzie, góry na północy, Twierdzę w centrum i fiord oraz osady na południowym wschodzie. Współrzędne znaczników w większości odpowiadają geografii ilustracji.

### Dobra obsługa urządzeń

Mapa obsługuje:

- mysz i przeciąganie,
- kółko myszy,
- gest szczypania na ekranach dotykowych,
- mobilny panel lokacji,
- sterowanie klawiaturą dla aktywnych znaczników,
- ograniczanie przesunięcia do granic obrazu.

### Mocny klimat questów

Treści mają własne nazewnictwo, nordycki ton, rozpoznawalne regiony, powracające tajemnice oraz kilka wieloetapowych osi fabularnych. Dwanaście kamieni i Trzynasty Kamień są szczególnie dobrym szkieletem kampanii typu „zbieraj wskazówki i odkrywaj prawdę o świecie”.

### Bezpieczny kierunek nowych Ekspedycji

Nowy system nie ufa nagrodom przesyłanym przez przeglądarkę. Serwer zna dozwolone wybory, liczy wynik, zapisuje próbę i atomowo przyznaje punkty, Skirniry oraz przedmiot. Ma dzienny limit i ochronę przed ponownym rozliczeniem tej samej próby. Cztery testy logiki Ekspedycji przechodzą poprawnie.

### Rozsądna architektura danych mapy

Osobne tabele warstw, odkryć i śledzenia są dobrym fundamentem. Ukryte lokacje są redagowane w odpowiedzi mapy, dzięki czemu klient nie dostaje ich nazw i lore przed odkryciem.

## 5. Problemy krytyczne

### P0. Questy z mapy nie są grywalne

Panel lokacji wyświetla questy, ale nie ma przy nich przycisku rozpoczęcia, wyborów ani wywołania API. `MarauderQuestModal.jsx`, który zawiera dawną symulację wykonywania questów, nie jest importowany ani używany przez aktualny widok mapy.

Dodatkowo:

- `completeMapQuest` w `SchoolContext.jsx` natychmiast zwraca `false` i pokazuje informację, że mechanizm jest w przebudowie,
- `POST /api/quests/complete` natychmiast zwraca kod 410,
- tabela ukończonych starszych questów w obecnej bazie ma 0 rekordów.

Skutek: użytkownik widzi 64 obietnice zadań, lecz żadnego z nich nie może faktycznie rozegrać i zapisać.

### P0. Reguły odblokowania nie istnieją w danych

Dziesięć lokacji ma `state = locked`, ale każda ma pusty `unlock_condition`.

Kod serwera traktuje pusty warunek jako spełniony. Powoduje to dwa różne błędy:

- pięć widocznych „zablokowanych” lokacji staje się w praktyce od razu dostępnych,
- pięć ukrytych lokacji pozostaje niewidocznych i interfejs nie ma żadnej ścieżki, żeby je legalnie odsłonić.

Dotyczy to między innymi Frostfang, Grobowca Runmistrza, Archiwum Skallgard, Fjormhardu, Morza Krakena, Trzynastego Kamienia i Jaskini Białego Smoka.

Pola `min_level`, `required_order` i `quest_chain_id` istnieją w schemacie, ale nie są zasilone przez seed świata ani użyte do rzeczywistego budowania progresji.

### P0. Brak prawdziwych łańcuchów questów

Nazwy kategorii sugerują ciągi Jötunskóg, Havnhold, Runehaven i Skallgard, lecz zależności istnieją tylko w tekście. System nie wymusza kolejności, nie sprawdza poprzednich zadań, nie odblokowuje następnych etapów i nie zapisuje wyborów fabularnych.

Trzynasty Kamień nie sprawdza zebrania dwunastu wcześniejszych kamieni. Endgame nie sprawdza poziomu postaci. Moralne rozgałęzienia opisują konsekwencje, których obecny model danych nie zapisuje.

### P0. Nowe Ekspedycje nie są spięte z mapą

`MapView` potrafi otworzyć `ExpeditionsModal`, a panel zna typ aktywności `expedition`, ale żaden znacznik nie ma `linked_activity_type = expedition`. Jedynymi aktywnościami przypiętymi do mapy są dwa wejścia do połowu w Zamarzniętym Fiordzie.

Skutek: bezpieczny system questowy działa z profilu i lewego panelu, ale nie z miejsc, które powinny go naturalnie uruchamiać na mapie.

## 6. Problemy wysokiego priorytetu

### P1. Nagroda za odkrycie jest opisana jako XP, ale daje punkty Zakonu

Endpoint odkrycia zwraca `rewards.xp` i interfejs pokazuje komunikat „+X XP”. Serwer nie zwiększa jednak doświadczenia postaci. Zamiast tego przelicza wartość przez `ceil(XP / 10)` i przyznaje punkty Zakonu.

To błąd znaczeniowy i balansowy: gracz otrzymuje inną nagrodę niż zapowiada interfejs.

### P1. Niespójny format waluty i nagród questów

Questy Twierdzy używają `reward.galleons`, a questy świata przeważnie `reward.skirniry`. Obecny panel mapy czyta wyłącznie `galleons`, dlatego przy questach świata waluta nie jest pokazywana.

Stary modal również oczekuje `galleons`, a dla braku wartości sam podstawia 15. W wielu questach nie ma `reward.item`, mimo że modal próbuje go wyświetlić. W efekcie dawna prezentacja potrafiłaby pokazać `undefined` albo przyznać inną wartość niż zapisana w treści.

### P1. „Śledzenie questa” śledzi tylko lokację

W bazie zapisywane jest wyłącznie `location_id`. Użytkownik nie wybiera konkretnego questa, nie widzi celu, etapu ani postępu. Nazwa komponentu `MapQuestTracker` i dawny komentarz „Śledzony quest” są mylące — to zakładka do lokacji.

### P1. Hidden locations można obejść przez bezpośrednie API

Endpoint odkrycia zna tylko `locationId`, warunek i czas. Nie zabrania odkrycia ukrytej lokacji, która nie ma poprawnego warunku. Jeżeli ktoś zna identyfikator i wyśle żądanie ręcznie, może odkryć oraz odebrać nagrodę za ukryty punkt.

Podobnie endpoint śledzenia pozwala zapisać dowolną istniejącą lokację bez sprawdzenia jej dostępności dla użytkownika.

### P1. Licznik odkryć może przekroczyć 100%

`discoveredCount` liczy wszystkie odkryte znaczniki, natomiast `totalDiscoverable` wyklucza ukryte. Po poprawnym uruchomieniu sekretów licznik może więc stać się większy od mianownika.

### P1. Stan świata nie wpływa na mapę i questy

Projekt ma rozbudowany stan świata: pogodę, porę, temperaturę, księżyc, wydarzenia, efekty i poziom zagrożenia. Mapa go nie konsumuje. Zamieć nie zamyka szlaków, pełnia nie odkrywa sekretów, wydarzenia nie tworzą markerów, a pora dnia nie zmienia dostępności zadań.

To niewykorzystany system, który mógłby nadać mapie poczucie żywego świata.

## 7. Problemy średniego priorytetu

### P2. Filtr „Questy” filtruje znaczniki, nie lokacje z questami

Tylko trzy znaczniki świata mają `marker_type = quest`, mimo że questy znajdują się przy wielu innych lokacjach. Po wybraniu filtra „Questy” użytkownik nie zobaczy większości miejsc zawierających zadania.

### P2. Informacje administracyjne są niepełne

Backend i klient API posiadają operacje tworzenia i edycji warstw oraz znaczników, ale nie ma znalezionego panelu, który z nich korzysta. Endpoint tworzenia znacznika zapisuje questy jako pustą tablicę, a aktualizacja nie pozwala zmieniać `quests`, `npcs` ani `actions`.

W praktyce rozbudowa fabuły nadal wymaga ręcznej edycji kodu lub bazy.

### P2. Seed nie synchronizuje normalnie zmian treści

Po pierwszym zapisie lokacji późniejsze uruchomienia aktualizują dane świata tylko wtedy, gdy pole `quests` jest puste. Zmiana opisu, współrzędnych, typu, blokady lub już istniejącego questa w pliku seed nie musi trafić do działającej bazy.

To zwiększa ryzyko rozjazdu między repozytorium a środowiskiem produkcyjnym.

### P2. Dwie waluty terminologiczne

Stare wpisy i część interfejsu mówią o Galleonach, a nowszy system o Skirnirach. Dla jednego świata warto przyjąć jedną nazwę oraz jeden klucz danych, najlepiej `skirnirs` lub `skirniry`, i wykonać migrację.

### P2. Dostępność klawiatury jest częściowa

Znaczniki obsługują Enter, ale nie Space. Brakuje też wygodnej listy lokacji jako alternatywy dla precyzyjnego klikania w mapę. Ukryte i zablokowane znaczniki mogą mieć niepełne etykiety dostępności, bo dane są redagowane.

### P2. Mapa Twierdzy używa jednego obrazu dla czterech pięter

Filtr piętra zmienia tylko zestaw markerów. Sam plan pozostaje ten sam, więc użytkownik może odczytać znacznik lochów na rzucie, który wizualnie przedstawia również parter i skrzydła naziemne. Działa funkcjonalnie, ale nie buduje mocnego poczucia pionowej struktury Twierdzy.

## 8. Ocena treści questów

### Co jest dobre

- Każdy quest ma identyfikator, tytuł, trudność, kategorię, opis, sugerowane działania, słowa rozwiązania oraz komunikaty sukcesu i porażki.
- Nie znaleziono zduplikowanych identyfikatorów.
- Linie fabularne są dobrze nazwane i mają regionalną tożsamość.
- Questy wykorzystują NPC, artefakty, runy, geografię i historię szkoły.
- Rozkład trudności pozwala zbudować progresję od tutorialu do endgame.

### Co wymaga projektu systemowego

- cele i stan etapów,
- warunki rozpoczęcia,
- zależności między questami,
- wybory i trwałe konsekwencje,
- reguły sukcesu oceniane na serwerze,
- nagrody wyliczane ze źródła zaufanego,
- statusy: niedostępny, dostępny, aktywny, ukończony, nieudany,
- możliwość wznowienia przerwanego zadania,
- dziennik questów niezależny od mapy,
- wersjonowanie questów przy zmianie sezonu.

Same `solutionKeywords` nie są wystarczającą regułą gry. W starym modalu gracz mógł wpisać słowo kluczowe albo wykonać losowy rzut po stronie przeglądarki. Wynik nie był autorytatywnie sprawdzany przez serwer.

## 9. Rekomendowana architektura docelowa

Najlepiej nie przywracać starego `completeQuest` w obecnej formie. Warto rozszerzyć bezpieczny wzorzec użyty w Ekspedycjach.

Minimalny model:

### `quest_definitions`

- `id`, `version`, `title`, `description`, `category`, `difficulty`,
- `location_id`, `chain_id`, `order_index`,
- `requirements_json`, `stages_json`, `rewards_json`,
- `is_active`, `available_from`, `available_until`.

### `user_quest_progress`

- `user_id`, `quest_id`, `quest_version`,
- `status`, `current_stage`, `state_json`,
- `started_at`, `updated_at`, `completed_at`,
- unikalność dla użytkownika, questa i wersji/sezonu.

### Endpointy

- `GET /api/quests/available?locationId=...`,
- `POST /api/quests/:id/start`,
- `POST /api/quests/:id/action`,
- `POST /api/quests/:id/complete` wyłącznie po serwerowej walidacji,
- `GET /api/quests/journal`,
- `POST /api/quests/:id/track`.

Serwer powinien sam pobierać definicję nagród. Klient powinien przesyłać wyłącznie identyfikator akcji lub odpowiedź gracza, nigdy liczbę punktów, XP, waluty ani przedmiot do przyznania.

## 10. Proponowana kolejność prac

### Etap 1 — naprawa fundamentu

1. Zdefiniować prawdziwe `unlock_condition` dla wszystkich 10 zablokowanych lokacji.
2. W `computeUserState` traktować `state = locked` bez poprawnego warunku jako rzeczywiście zablokowane, nie jako dostępne.
3. Zabezpieczyć `/discover` i `/track` pełną walidacją stanu użytkownika.
4. Ujednolicić nagrody: XP, punkty Zakonu, Skirniry i przedmioty.
5. Naprawić licznik odkryć.

### Etap 2 — spięcie działającej gry z mapą

1. Dodać trzy markery lub podpięcia `expedition` do logicznych lokacji:
   - Cmentarzysko Drakkarów → Zamarznięty Fiord,
   - Puszcza Cieni → Jötunskóg,
   - Jaskinie Olbrzymów → Frostfang.
2. Pokazywać w panelu lokacji przycisk „Rozpocznij Ekspedycję”.
3. Po zakończeniu odświeżać marker, dziennik i nagrody.

To szybko stworzy działającą pętlę: **wybierz miejsce → wyrusz → podejmij decyzje → odbierz zapisany wynik → wróć na mapę**.

### Etap 3 — migracja pierwszej linii fabularnej

Przenieść jedną krótką kampanię, najlepiej Jötunskóg, do nowego serwerowego modelu questów. Nie migrować od razu wszystkich 64 zadań.

Zakres pilota:

- tutorial przy Bramie,
- „Ślady na śniegu”,
- zadania Zielarki,
- odblokowanie Zamarzniętego Ogrodu,
- jeden finał z trwałą nagrodą.

Po sprawdzeniu modelu przenieść Runehaven i jego cztery fragmenty, następnie Skallgard, Havnhold i meta-zagadkę kamieni.

### Etap 4 — żywy świat

Połączyć `WorldStateContext` z mapą:

- zamieć blokuje górskie trasy,
- pełnia ujawnia wybrane sekrety,
- wydarzenia tworzą czasowe markery,
- poziom zagrożenia zmienia dostępność Ekspedycji,
- pora dnia otwiera nocne questy.

### Etap 5 — narzędzia dla administratora

Dodać wizualny edytor:

- przeciąganie znacznika po mapie,
- edycję lore, NPC, działań i questów,
- budowanie warunków odblokowania bez ręcznego JSON,
- podgląd jako konkretny użytkownik,
- publikację i wersjonowanie sezonu.

## 11. Testy, których obecnie brakuje

Nie znaleziono testów tras mapy ani pełnej pętli questa. Należy dodać co najmniej:

- lokacja locked bez warunku pozostaje locked,
- quest/discovery/level/order poprawnie odblokowują lokację,
- ukrytej lokacji nie można odkryć przez ręczne API przed spełnieniem warunku,
- zablokowanej lokacji nie można śledzić,
- nagroda za odkrycie jest przyznana dokładnie raz,
- licznik odkryć nie przekracza całości,
- quest nie może zostać rozpoczęty poza właściwą lokacją,
- kolejny etap chainu wymaga poprzedniego,
- nagrody są pobierane z serwera, a wartości przesłane przez klienta są ignorowane,
- dwa równoległe żądania ukończenia nie przyznają podwójnej nagrody.

Aktualne testy Ekspedycji sprawdzają ocenę wyborów, odrzucenie złej kolejności etapów i warszawską dobę. Wszystkie 4 przechodzą.

## 12. Ostateczna rekomendacja

Nie trzeba przebudowywać mapy od zera. Warstwa wizualna, komponenty mapy, dane lokacji i nowy mechanizm Ekspedycji są dobrym fundamentem.

Najbardziej opłacalny kierunek to:

1. naprawić blokady i nagrody,
2. podpiąć trzy działające Ekspedycje do znaczników,
3. zbudować jeden serwerowy quest chain jako wzorzec,
4. dopiero potem migrować pozostałe 64 zadania.

Obecnie projekt ma **świetną mapę z dużą ilością fabuły**, ale jeszcze nie ma **jednego spójnego systemu questów**. Po spięciu tych dwóch części może stać się jednym z najmocniejszych modułów całego portalu.
