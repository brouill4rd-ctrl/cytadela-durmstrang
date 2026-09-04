# Runiczna Strzelnica — zasady i limity implementacji dla Claude

## Zadanie

Dopracuj minigrę `Runiczna Strzelnica • Dziedziniec Szermierki Różdżkowej` w komponencie `src/components/TargetPracticeModal.jsx` tak, aby była płynna, czytelna, uczciwa i odporna na wielokrotne naliczanie nagród.

Zachowaj istniejący klimat widoczny w obecnym modalu: ciemne granatowo-czarne tło, stare złoto, runiczna typografia, dyskretna siatka i układ z trzema statystykami u góry. Nie zmieniaj ogólnej tożsamości wizualnej portalu.

## Najważniejsze problemy obecnej wersji do usunięcia

1. `finishGame()` może korzystać z nieaktualnej wartości `score` przechwyconej przez timer. Wynik pokazany graczowi i wynik użyty do nagrody muszą być identyczne.
2. Zakończenie rundy może zostać wywołane tylko raz. React Strict Mode, szybkie zamknięcie modala lub kilka callbacków nie mogą przyznać nagrody ponownie.
3. Cele nie mają prawdziwego czasu życia; nie mogą zalegać na planszy aż do usunięcia przez limit tablicy.
4. Obecne `prev.slice(-6)` pozwala faktycznie wyświetlić 7 celów. Obowiązuje jawny limit aktywnych celów.
5. Nie przyznawaj punktów domyślnie Ravnheimowi. Brak zalogowanego użytkownika lub brak Zakonu oznacza brak punktów Zakonu.
6. Zamknięcie gry w trakcie rundy, odświeżenie strony albo ponowne kliknięcie celu nie może dawać nagrody.

## Przebieg rundy

Gra ma cztery jednoznaczne stany:

1. `intro` — instrukcja i przycisk rozpoczęcia.
2. `countdown` — odliczanie 3, 2, 1; bez celów i bez ubytku czasu rundy.
3. `playing` — dokładnie 25 sekund aktywnej gry.
4. `result` — wynik, statystyki, informacja o nagrodzie i możliwość ponownej gry.

Zamknięcie modala podczas `playing` anuluje próbę bez wyniku i bez nagrody. Po ponownym otwarciu modal zaczyna od `intro` z wyzerowanym stanem.

Timer ma działać na podstawie znacznika końca (`deadline`), a nie wyłącznie przez odejmowanie 1 co sekundę. Ukrycie karty nie może wydłużyć rundy. Po powrocie do karty czas ma zostać poprawnie przeliczony, a zakończona runda domknięta.

## Cele i balans

Użyj jednej stałej konfiguracji zamiast porozrzucanych liczb magicznych.

| Cel | Szansa pojawienia | Punkty bazowe | Czas życia | Rozmiar |
|---|---:|---:|---:|---:|
| Lodowa tarcza | 48% | +10 | 1500 ms | 48 px |
| Widmowy kruk | 25% | +25 | 1150 ms | 46 px |
| Złota runa | 10% | +50 | 900 ms | 44 px |
| Czaszka-pułapka | 17% | -30 | 1350 ms | 48 px |

Zasady pojawiania:

- Losowy odstęp między pojawieniami: 650–950 ms.
- Maksymalnie 4 aktywne cele jednocześnie.
- Cel musi w całości mieścić się w polu gry z marginesem co najmniej 12 px.
- Nowy cel nie może nachodzić na inny; minimalna odległość między środkami to 70 px. Wykonaj maksymalnie 10 prób znalezienia pozycji. Jeśli brak miejsca, pomiń dane pojawienie zamiast wciskać cel na siłę.
- Każdy cel ma stabilny unikalny identyfikator i może zostać rozliczony tylko raz.
- Po upływie czasu życia cel znika krótką animacją. Wszystkie timery celów muszą zostać wyczyszczone po końcu rundy i odmontowaniu komponentu.

## Punktacja, combo i statystyki

- Wynik rundy nigdy nie spada poniżej 0.
- Combo zaczyna się od `x1`.
- Trafienie poprawnego celu nalicza `punkty bazowe × aktualne combo`, a dopiero potem podnosi combo o 1.
- Maksymalne combo to `x5`.
- Kliknięcie czaszki odejmuje 30 punktów bez mnożnika i resetuje combo do `x1`.
- Wygaśnięcie poprawnego celu liczy się jako pudło i obniża combo o 1, ale nigdy poniżej `x1`.
- Wygaśnięcie czaszki nie daje kary.
- Kliknięcie pustego pola nie daje kary i nie wpływa na combo.
- Szybkie wielokrotne kliknięcie tego samego celu nie może naliczyć punktów więcej niż raz.

Na ekranie wyniku pokaż:

- końcowy wynik,
- liczbę poprawnych trafień,
- liczbę pudeł,
- liczbę trafionych pułapek,
- celność: `trafienia / (trafienia + pudła + trafione pułapki)`, zaokrągloną do pełnego procentu,
- najwyższe osiągnięte combo.

Przy mianowniku równym 0 pokaż celność 0%.

## Nagrody i limity ekonomii

Wynik treningowy i nagroda ekonomiczna to dwie osobne rzeczy. Gracz może ćwiczyć bez ograniczeń, ale nagrodę może otrzymać maksymalnie za 3 ukończone rundy na dzień według strefy `Europe/Warsaw`.

| Wynik | Punkty Zakonu | Skirniry |
|---:|---:|---:|
| 0–399 | 0 | 0 |
| 400–799 | 2 | 2 |
| 800–1199 | 4 | 3 |
| 1200–1599 | 6 | 5 |
| 1600+ | 8 | 7 |

Twarde reguły:

- Jedna runda może utworzyć najwyżej jedną nagrodę.
- Maksimum dzienne wynosi zatem 24 punkty Zakonu i 21 Skirnirów.
- Czwarta i każda kolejna runda danego dnia nadal działa i zapisuje wynik na ekranie, lecz pokazuje komunikat: `Limit nagród na dziś wykorzystany — ta runda była treningowa.`
- Nie przyznawaj gwarantowanej nagrody minimalnej. Wynik poniżej 400 daje 0/0.
- Nie przyznawaj nagrody za rundę anulowaną, krótszą niż 23 sekundy, niezalogowanemu użytkownikowi ani użytkownikowi bez prawidłowego identyfikatora.
- Punkty Zakonu przyznawaj tylko wtedy, gdy użytkownik rzeczywiście należy do Zakonu. Brak Zakonu nie blokuje należnych Skirnirów.
- Identyfikator rundy (`runId`) musi zapewnić idempotencję: ponowne wysłanie zakończenia tej samej rundy zwraca poprzedni rezultat, ale niczego nie dopisuje.
- Limit nagród i `runId` powinny być sprawdzane po stronie serwera i utrwalone w bazie. `localStorage`, stan Reacta ani wyłączony przycisk nie są zabezpieczeniem ekonomii. Jeśli w tej iteracji nie wdrażasz części serwerowej, pozostaw nagrody treningowe wyłączone zamiast udawać bezpieczny limit po stronie klienta.
- Serwer zawsze sam wylicza nagrodę z progów i nakłada maksymalny limit. Nie przyjmuje liczby punktów Zakonu ani Skirnirów podanej przez klienta.

## Zachowanie i oprawa

- Przed startem pokaż krótką legendę czterech celów wraz z punktami. Gracz ma zrozumieć zasady bez osobnego regulaminu.
- Cel po pojawieniu powinien mieć krótką animację wejścia 120–180 ms, ale nie może przez animację być nieklikalny.
- Po trafieniu pokaż przy celu krótki napis, np. `+100`, `COMBO x4` albo `-30 • COMBO UTRACONE`.
- Dopuszczalny jest subtelny błysk, maksymalnie kilkanaście lekkich cząstek i delikatny czerwony impuls przy czaszce. Bez mocnego trzęsienia całym ekranem.
- Ostatnie 5 sekund wyróżnij czerwonym kolorem i dyskretnym pulsem czasu.
- Dźwięki uruchamiaj wyłącznie przez istniejący `SoundContext` i respektuj ustawienie wyciszenia. Nie dodawaj plików audio ani autoplay.
- Preferuj spójne ikony `lucide-react` i znak runiczny zamiast zestawu przypadkowych emoji. Nie dodawaj zewnętrznych obrazów.
- Dla `prefers-reduced-motion: reduce` wyłącz pulsowanie, cząstki i przesunięcia; funkcjonalność gry ma pozostać pełna.

## Responsywność i dostępność

- Modal musi działać od szerokości 360 px do desktopu.
- Na wąskim ekranie trzy statystyki nadal muszą być czytelne; mogą mieć mniejszy tekst, ale nie mogą wyjść poza modal.
- Pole gry powinno mieć wysokość około 380 px na desktopie i minimum 320 px na telefonie.
- Klikalny obszar celu na urządzeniu dotykowym nie może być mniejszy niż 44 × 44 px.
- Przycisk zamknięcia i przyciski akcji muszą mieć `aria-label`, widoczny stan focus i działać klawiszem Enter/Spacja.
- Nie blokuj przewijania ani skrótów klawiaturowych po zamknięciu modala.
- Teksty mają być po polsku i bez literówek. Używaj nazwy waluty `Skirniry`.

## Granice zmian

- Główny zakres: `src/components/TargetPracticeModal.jsx`.
- Możesz utworzyć dedykowany arkusz stylów dla komponentu i zaimportować go, jeśli poprawi to czytelność. Nazwy klas muszą być prefiksowane, aby nie wpływały na inne widoki.
- Część trwałego limitu nagród może wymagać małej trasy API, tabeli w istniejącej bazie i metody w `src/api.js`. Ogranicz te zmiany wyłącznie do Runicznej Strzelnicy.
- Nie refaktoryzuj `SchoolContext`, pozostałych minigier, routingu ani wyglądu całego portalu przy okazji.
- Nie zmieniaj publicznego kontraktu komponentu: nadal przyjmuje `{ isOpen, onClose }`.
- Nie instaluj nowych bibliotek. Użyj Reacta, CSS, `lucide-react` i istniejących kontekstów.
- Nie używaj `setInterval` jako jedynego źródła prawdy o czasie. Nie zostawiaj nieczyszczonych timeoutów ani listenerów.
- Nie maskuj błędów pustymi `catch`. Błąd zapisu nagrody pokaż jako spokojny komunikat, bez ponownego automatycznego naliczania.

## Kryteria odbioru

Implementacja jest gotowa dopiero, gdy spełnia wszystkie punkty:

1. Runda trwa realnie 25 sekund również po przełączeniu karty.
2. Końcowy wynik jest dokładnie tym wynikiem, z którego wyliczono nagrodę.
3. Koniec rundy i szybkie wielokrotne kliknięcia nie naliczają niczego podwójnie.
4. Na planszy nie ma więcej niż 4 cele; cele nie są ucięte ani na siebie nałożone.
5. Po końcu, anulowaniu i odmontowaniu nie pracują timery ani spawnery.
6. Trzy pierwsze kwalifikujące się rundy mogą dać nagrodę, kolejne są wyłącznie treningowe; odświeżenie strony nie zeruje limitu.
7. Użytkownik bez Zakonu nie dostaje punktów fikcyjnego Zakonu.
8. Modal jest grywalny i czytelny przy 360 px, na desktopie oraz przy włączonym ograniczeniu animacji.
9. Zamknięcie i ponowne otwarcie daje czysty stan `intro`.
10. `npm run build` kończy się bez błędów, a zmiany nie psują innych minigier.

Na końcu pracy podaj krótko: zmienione pliki, sposób naliczania nagród, sposób egzekwowania limitu dziennego oraz wykonane testy. Nie ogłaszaj sukcesu, jeśli limit istnieje tylko w pamięci przeglądarki.
