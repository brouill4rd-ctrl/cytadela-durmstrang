# ❄️ CYTADELA DURMSTRANG — WIELKI PRZEWODNIK KLIMATYCZNY I PLAN ROZWOJU IMERSJI
## Analiza moduł po module: Atmosfera, Imersja, Mroczno-Nordycki Design i Unikalne Mechaniki RPG

> *"Nie każda magia powinna zostać poznana. Za murami Cytadeli wiedza ma swoją wagę, a potęga swoją cenę."*

---

## 🧭 SPIS TREŚCI

1. [Wizja Artystyczna & Tożsamość Durmstrangu](#1-wizja-artystyczna--tożsamość-durmstrangu)
2. [Moduł 01: Globalna Atmosfera, Warstwa Dźwiękowa i Sensoryczna (Core FX)](#2-moduł-01-globalna-atmosfera-warstwa-dźwiękowa-i-sensoryczna-core-fx)
3. [Moduł 02: Sala Główna, Tablica Ogłoszeń i Komunikaty Dyrekcji (HomeView)](#3-moduł-02-sala-główna-tablica-ogłoszeń-i-komunikaty-dyrekcji-homeview)
4. [Moduł 03: Cztery Zakony, Pokoje Wspólne i Ceremonia Przydziału](#4-moduł-03-cztery-zakony-pokoje-wspólne-i-ceremonia-przydziału)
5. [Moduł 04: Katedry Akademickie, Dzienniki Lekcyjne i Plan Zajęć](#5-moduł-04-katedry-akademickie-dzienniki-lekcyjne-i-plan-zajęć)
6. [Moduł 05: Gazetka Szkolna „Głos Północy” (Flipbook 3D & Redakcja)](#6-moduł-05-gazetka-szkolna-głos-północy-flipbook-3d--redakcja)
7. [Moduł 06: Galdrastofa — Warsztat Runiczny i Kocioł Alchemiczny](#7-moduł-06-galdrastofa--warsztat-runiczny-i-kocioł-alchemiczny)
8. [Moduł 07: Karta Cytadeli — Interaktywna Mapa i Eksploracja Twierdzy](#8-moduł-07-karta-cytadeli--interaktywna-mapa-i-eksploracja-twierdzy)
9. [Moduł 08: Gospodarka Północy — Rynek Kaupangr i Bank Skirnirów](#9-moduł-08-gospodarka-północy--rynek-kaupangr-i-bank-skirnirów)
10. [Moduł 09: Tożsamość Maga — Karta Postaci, Ekwipunek i Paszport](#10-moduł-09-tożsamość-maga--karta-postaci-ekwipunek-i-paszport)
11. [Moduł 10: Krucze Gniazdo — Poczta Kruków i Komunikacja Społeczności](#11-moduł-10-krucze-gniazdo--poczta-kruków-i-komunikacja-społeczności)
12. [Moduł 11: Archiwum Cieni — Biblioteka, Bestiariusz i Kodeks Zasad](#12-moduł-11-archiwum-cieni--biblioteka-bestiariusz-i-kodeks-zasad)
13. [Moduł 12: Sala Wojenna & Turnieje — Gry Towarzyskie i Rywalizacja](#13-moduł-12-sala-wojenna--turnieje--gry-towarzyskie-i-rywalizacja)
14. [Moduł 13: Rada Arcymistrzów — Panel CMS i Tajemnice Administracji](#14-moduł-13-rada-arcymistrzów--panel-cms-i-tajemnice-administracji)
15. [Matryca Priorytetów Wdrożeniowych (Roadmapa WOW)](#15-matryca-priorytetów-wdrożeniowych-roadmapa-wow)

---

## 1. WIZJA ARTYSTYCZNA & TOŻSAMOŚĆ DURMSTRANGU

Cytadela Durmstrang to nie ciepły, bezpieczny zamek w stylu szkockiego zamczyska. To **surowa, granitowo-lodowa twierdza ukryta w bezkresie Skandynawii**, otoczona zamarzniętym fiordem, tundrą i mrokiem nocy polarnej. 

### Filary Estetyczne:
* **Dark Academia & Nordic Gothic:** Surowe drewno dębowe, czarny żelazny kuty metal, chropowaty łupek, spękany lód, runiczne inskrypcje świecące fosforyzującym błękitem i złotem.
* **Tajemnica i Ciężar Magii:** Magia nie jest tu beztroską sztuczką – to starożytna dyscyplina, krew, wola i znajomość zakazanych sztuk.
* **Autentyzm Przedmiotowy:** Każdy element interfejsu powinien wyglądać jak fizyczny artefakt: ciężki pergamin, woskowa pieczęć, skórzana oprawa księgi, mosiężny kompas czy wykute w kości renifera kości do gry.

---

## 2. MODUŁ 01: GLOBALNA ATMOSFERA, WARSTWA DŹWIĘKOWA I SENSORYCZNA (CORE FX)

Obecny stan: `SnowCanvas`, `AuroraCanvas`, `TorchCursor`, `WandSparks`, syntezator Web Audio (`SoundContext`).

### 🌌 Co klimatycznego warto dodać:

1. **Zmienne Cykle Czasowo-Atmosferyczne (Dynamic Weather & Time Engine):**
   * **Noc Polarna (Polar Night):** Automatyczny tryb wieczorny/nocny – intensywniejsza zorza polarna, delikatnie unoszący się lodowy pył, światło pochodni staje się cieplejsze i rzuca dłuższe, miękkie cienie.
   * **Zawieja Śnieżna (Blizzard Surge):** Przy spadku temperatury w symulatorze lub losowym evencie wiatr przyspiesza, a po bokach ekranu pojawia się efekt oszronienia szkła (`frost vignette` w CSS/Canvas).
   * **Fazy Księżyca Północy:** Mini-wskaźnik w rogu ekranu (Nów, Pełnia, Zaćmienie Krwawego Księżyca), który wpływa na kolor poświaty run na całej stronie.

2. **Warstwa Audio „Żywa Twierdza” (Modular Soundscape 2.0):**
   * **Dźwięki otoczenia per widok:**
     * *Sala Główna:* Cichy trzask wielkich ognisk, echo kroków na kamiennej posadzce, okazjonalny stłumiony ryk wiatru w kominie.
     * *Biblioteka/Archiwum:* Szelest przewracanych grubych pergaminów, skrzypienie starych regałów, cichy szept w pradawnym języku w tle.
     * *Lochy i Skarbiec:* Kapanie wody ze stalaktytów, metaliczny pogłos krat i łańcuchów.
   * **Dźwięki Interakcji (ASMR UI):**
     * Kliknięcie w przycisk: odgłos uderzenia pieczęci woskiem, przesunięcia kamiennego żetonu lub kliknięcia żelaznej zasuwy.
     * Hover nad menu: cichutki rezonans kryształu lub świst mroźnego powietrza.

3. **Interaktywne Ściany i Pochodnie (Interactive Environment Elements):**
   * Możliwość kliknięcia w ścienne kinkiety z pochodniami w bocznych paskach portalu, aby je zapalać/gasić (zmieniając jasność i oświetlenie strony).
   * „Zdmuchnięcie świecy” po wylogowaniu.

---

## 3. MODUŁ 02: SALA GŁÓWNA, TABLICA OGŁOSZEŃ I KOMUNIKATY DYREKCJI (HOMEVIEW)

Obecny stan: Newsy z kategoriami, filtrowanie, pieczęcie uznania, modal podglądu, banery zakonne.

### 📜 Co klimatycznego warto dodać:

1. **Afisze i Zwoje w Stylu Dawnych Edyktów Dyrekcji:**
   * Wyróżnione ogłoszenia Dyrekcji stylizowane na **królewskie dekrety z wypalonymi brzegami**, przypięte do drewnianej tablicy żelaznymi ćwiekami.
   * Efekt „stemplowania” pieczęci przy lajkowaniu / składaniu uznania (animacja uderzenia pieczęci lakowej z dymkiem wosku).

2. **Klepsydry Punktacji Zakonów na Żywo (Living House Hourglasses):**
   * Trójwymiarowy, interaktywny widget wielkich klepsydr z pływającymi rubinami, szafirami, szmaragdami i obsydianem, reagujący na ruch kursora (fizyka cząsteczek w szkle).
   * Gdy dany Zakon zdobywa punkty, z góry sypią się świecące kryształy z runicznym rozbłyskiem.

3. **Tablica Pogłosek i Anonimowych Grypsów (The Whispering Wall / Ściana Cieni):**
   * Sekcja, w której uczniowie mogą zostawiać krótkie, klimatyczne notatki (np. *„Wczoraj o północy widziałem światło w opuszczonej baszcie...”*).
   * Notatki wyglądają jak skrawki pergaminu przypięte szpilkami, które blakną po 24 godzinach.

4. **Kruczy Posłaniec Dnia (Daily Omen / Przepowiednia Dnia):**
   * Codzienny jednolinijkowy aforyzm lub wróżba nordycka losowana dla gracza po wejściu na stronę, dająca drobny bonus (np. *„Dziś runa Fehu sprzyja transakcjom w Banku Skirnirów”*).

---

## 4. MODUŁ 03: CZTERY ZAKONY, POKOJE WSPÓLNE I CEREMONIA PRZYDZIAŁU

Obecny stan: Zakony (Renifer, Niedźwiedź, Kruk, Wydra), quiz przydziału, modal pokoju wspólnego.

### 🛡️ Co klimatycznego warto dodać:

1. **Rytuał Krwi i Mrozu (The Immersive Sorting Ceremony):**
   * Przekształcenie quizu w mistyczny seans:
     * Ekran przyciemnia się do głębokiego granatu, a przed graczem pojawia się **Runiczny Krąg Przeznaczenia** oraz **Kocioł z Płynnym Srebrem**.
     * Pytania nie są zwykłym testem jednokrotnego wyboru, lecz dylematami moralno-strategicznymi przedstawionymi jako wizje w dymie kotła.
     * Na koniec rozlega się niski ryk totemu (niedźwiedź, kruk, renifer, wydra), a na ekranie wypala się świetlisty herb Zakonu z dźwiękiem pękającego lodu.

2. **Dedykowane Pokoje Wspólne (Unique Common Room Sanctuaries):**
   * Każdy pokój wspólny z unikalnym klimatem:
     * **Sanktuarium Renifera (Hjortr):** Wysokie sklepienia z poroży, płonący monumentalny kominek, widok na zorzę polarną przez zamarznięte witraże.
     * **Bastion Niedźwiedzia (Bjorn):** Sala z ciężkich ciosanych bali i kamienia, trofea bestii, zbrojownia, dźwięk kucia żelaza.
     * **Wieża Kruka (Hrafn):** Gotyckie obserwatorium astronomiczne, mapy gwiazd, krążące w cieniu kruki, półki sięgające chmur.
     * **Przystań Wydry (Otr):** Podwodna sala ze szklanym sufitem ukazującym dno zamarzniętego fiordu i przepływające pod lodem tajemnicze cienie.
   * Ekskluzywny czat zakonny stylizowany na rozmowy przy kominku z awatarami w barwach domu.

3. **Drzewo Lojalności i Rangi Wewnątrz Zakonu:**
   * Pozycje takie jak: *Nowicjusz, Strażnik Płomienia, Skald Domu, Prymus, Starszy Zakonu*, odblokowywane za aktywność na lekcjach i w życiu szkoły.

---

## 5. MODUŁ 04: KATEDRY AKADEMICKIE, DZIENNIKI LEKCYJNE I PLAN ZAJĘĆ

Obecny stan: `AcademicView`, `SubjectDetailView`, `TimetableView`, `JournalsListView`, `LessonDetailView`, `ProfessorJournalEditor`.

### 📚 Co klimatycznego warto dodać:

1. **Księgi Programowe z Efektem Otwierania Starodruku:**
   * Wejście w dany przedmiot (np. *Czarna Magia, Runiczne Wiązania, Astronomia Północy*) otwiera animowaną, oprawną w skórę księgę z pieczęcią profesora prowadzącego.
   * Cytat wstępny, motto katedry oraz rycina w stylu XVII-wiecznego drzeworytu.

2. **Dziennik Lekcyjny jako Oficjalny Pergamin Archiwalny:**
   * Zapiski z lekcji formatowane jak autentyczny protokół z odręcznym podpisem profesora, adnotacjami na marginesach i pieczęcią lakową potwierdzającą ważność wpisu.
   * Oceny i punkty wpisywane w stylizowane runiczne rubryki (np. *W = Wybitny [Fehu], P = Powyżej Oczekiwań [Uruz]*).

3. **Magiczny Zegar Lekcyjny (Nordic Astrolabium / Rozkład Zajęć):**
   * Na widoku planu lekcji: mechaniczne astrolabium wskazujące aktualną godzinę magiczną Cytadeli oraz odliczanie do najbliższych zajęć na Discordzie.
   * Wskaźnik „Trwa Lekcja” z pulsującą runą i bezpośrednim przyciskiem „Przenieś się do Sali Wykładowej” (przekierowanie na kanał głosowy/tekstowy Discord).

4. **Karty Zadań Domowych i Składanie Prac (Homework Parchment Submissions):**
   * Uczeń składa zadanie domowe poprzez wirtualne zwinięcie pergaminu i opatrzenie go własną pieczęcią woskową.
   * Profesor może zostawiać „czerwone uwagi atramentem” bezpośrednio na pracy ucznia.

---

## 6. MODUŁ 05: GAZETKA SZKOLNA „GŁOS PÓŁNOCY” (FLIPBOOK 3D & REDAKCJA)

Obecny stan: `GazetteView`, `GazetteFlipbook`, `GazettePanelView`, `GazetteArchiveView`, system artykułów, wywiadów i ogłoszeń.

### 📰 Co klimatycznego warto dodać:

1. **Magiczne „Ruchome Fotografie” (Cinematic Moving Engravings):**
   * Zamiast statycznych zdjęć – subtelnie animowane ilustracje w stylu *Daily Prophet / Nordycki Drzeworyt* (delikatnie unoszący się dym z fajki, mrugające postacie, powiewające szaty na wietrze, sypiący się śnieg w kadrze).

2. **Ukryte Wiadomości Atramentem Sympatycznym (Invisible Ink Secrets):**
   * Niektóre artykuły posiadają ukryte dopiski lub satyryczne komentarze buntowników Durmstrangu, które stają się widoczne dopiero po najechaniu kursorem pochodni (`TorchCursor`) lub przytrzymaniu lupy detektywistycznej.

3. **Kącik Łamigłówek i Runiczne Krzyżówki (Nordic Crosswords & Riddles):**
   * Grywalna strona w gazetce: mini-szyfr runiczny, którego rozwiązanie daje czytelnikowi unikalny kod na monety w Banku Skirnirów.

4. **Dźwięk Przewracania Sztywnego Papieru Prasowego:**
   * Bogate efekty dźwiękowe przy chwytaniu i zaginaniu narożnika strony w czytniku 3D Flipbook.

---

## 7. MODUŁ 06: GALDRASTOFA — WARSZTAT RUNICZNY I KOCIOŁ ALCHEMICZNY

Obecny stan: `RuneWorkshopView`, `AlchemicalCauldron`, `GrimoireBook`, `RuneCalligraphyModal`, kucie formuł, dobór katalizatorów.

### ⚡ Co klimatycznego warto dodać:

1. **Kaligrafia Runiczna w Czasie Rzeczywistym (Gesture Rune Carving):**
   * Gracz za pomocą kursora-różdżki kreśli linie starożytnej runy (np. Algiz, Thurisaz) na wirtualnej kamiennej tabliczce.
   * Efekt sypiących się iskier, pękania kamienia i ocena dokładności pociągnięcia (wpływająca na moc wykutej runy).

2. **Kocioł Alchemiczny z Reakcją na Fazę Księżyca i Temperaturę:**
   * Dynamiczny kocioł z bulgoczącym płynem, gdzie zmiana temperatury płomienia (za pomocą miecha) zmienia kolor wywaru i wydobywające się opary.
   * Ryzyko wybuchu eliksiru i okopcenia ekranu gracza przy złej kolejności składników.

3. **Zielnik Północy (Grimoire of Arctic Herbs & Minerals):**
   * Interaktywny atlas rzadkich składników (np. *Mech Lodowcowy, Korzeń Krwawnika Tundrowego, Łza Białego Wilka*) z rycinami anatomicznymi i opisami ich właściwości toksycznych oraz leczniczych.

---

## 8. MODUŁ 07: KARTA CYTADELI — INTERAKTYWNA MAPA I EKSPLORACJA TWIERDZY

Obecny stan: `MapView`, `MaraudersMapCanvas`, `DungeonEscapeModal`, `IceFishingModal`, `MarauderQuestModal`.

### 🗺️ Co klimatycznego warto dodać:

1. **Stylistyka Starożytnej Żeglarskiej Mapy Pergaminowej (Cartography of the North):**
   * Wygląd mapy stylizowany na autentyczną mapę wikińsko-renesansową z potworami morskimi w fiordzie, różą wiatrów z runami i zarysami gór skandynawskich.
   * Efekt „odkrywania mgły wojny” (Fog of War) – uczeń odkrywa kolejne zakątki zamku w miarę zdobywania poziomów i zaliczania zadań.

2. **Ślady Kroków Nocnych Marków (Live Footsteps of Citadel Inhabitants):**
   * Widoczne na mapie ciche, przemieszczające się ślady stóp innych zalogowanych uczniów lub patrolujących korytarze profesorów i widm Cytadeli.

3. **Sekretne Przejścia i Komnaty Zależne od Pory Dnia:**
   * Wejście do *Zatopionej Krypty* dostępne tylko podczas odpływu fiordu lub po odnalezieniu runicznego klucza w bibliotece.
   * Mini-wydarzenia na mapie (np. *„Duch Harfanga Muntera nawiedził Wieżę Północną”*).

---

## 9. MODUŁ 08: GOSPODARKA PÓŁNOCY — RYNEK KAUPANGR I BANK SKIRNIRÓW

Obecny stan: `BankView`, `MarkethallView`, `BlackMarketModal`, `ShoppingListsSection`, `ScandinavianLotteryModal`, monety: Thaler, Skilling, Krone.

### 💰 Co klimatycznego warto dodać:

1. **Fizyczny Skarbiec Bankowy z Mechanizmem Zegarowym:**
   * Wejście do Banku Skirnirów wita gracza widokiem potężnych, mosiężno-żelaznych wrót skarbca z obracającymi się kołami zębatymi i runicznym zamkiem szyfrowym.
   * Dźwięk brzęczących ciężkich monet przy każdej wpłacie/wypłacie.

2. **Czarne Targowisko pod Lodem (The Black Market of Kaupangr):**
   * Dostępne tylko po zdobyciu *Przepustki Przemytnika* lub wypowiedzeniu hasła strażnikowi w dokach.
   * Asortyment: zakazane księgi, nielegalne składniki mrocznych rytuałów, artefakty z czarnego dębu o potężnych właściwościach.

3. **Aukcje Osobliwości (Live Candle Auctions):**
   * System licytacji rzadkich przedmiotów, gdzie czas licytacji odmierza kapiąca świeca woskowa.

---

## 10. MODUŁ 09: TOŻSAMOŚĆ MAGA — KARTA POSTACI, EKWIPUNEK I PASZPORT

Obecny stan: `ProfileView`, `StudentPassportModal`, `ProfileEditorModal`, insygnia, statystyki, drzewko umiejętności.

### 🪪 Co klimatycznego warto dodać:

1. **Paszport Obywatela Cytadeli (Durmstrang Travel Ledger & Passport):**
   * Wielostronicowy, tłoczony w skórze dokument ze stemplami granicznymi, oficjalnymi wizami ministerstw magii krajów nordyckich i germańskich, pieczęciami Zakonu i podpisem Rektora.
   * Możliwość eksportu paszportu jako pięknej grafiki pamiątkowej.

2. **Karta Różdżki i Więź z Rdzeniem (Wand Lore & Resonance):**
   * Szczegółowy opis rdzenia (np. *Włókno z Serca Smoka Północnego, Sierść Fenrira, Pióro Kruka Cienia*) i drewna (Cis, Czarny Bez, Arktyczna Brzoza), z wizualizacją aury i rezonansem magicznym.

3. **Stela Osiągnięć i Runiczne Blizny (Saga of Feats):**
   * Zamiast generycznych odznak – **Runy Chwały** wyryte na wirtualnym obelisku postaci (np. *„Ten, który przetrwał noc w Zakazanym Borze”, „Pogromca Turnieju Hnefatafl”*).

---

## 11. MODUŁ 10: KRUCZE GNIAZDO — POCZTA KRUKÓW I KOMUNIKACJA SPOŁECZNOŚCI

Obecny stan: `RavenPostView`, `EmailInboxModal`, `DiscordVerificationModal`, integracja bota Discord.

### 🦅 Co klimatycznego warto dodać:

1. **Animacja Przylotu Kruka z Listem:**
   * Po odebraniu nowej wiadomości w rogu ekranu pojawia się sylwetka czarnego kruka lądującego na parapecie z listem w dziobie i cichym krakaniem.
   * Gracz „odrywa” woskową pieczęć kliknięciem, rozwijając pergamin.

2. **Wybór Szlachetnego Papieru i Pieczęci Lakowej:**
   * Przy pisaniu listu uczeń może wybrać kolor laku (krwista czerwień, głęboka czerń, szmaragd, złoto) oraz znak pieczęci (herb Zakonu, osobisty monogram).

3. **Status Kruka Posłańca w Locie:**
   * Realistyczny czas dostarczenia listu między użytkownikami (np. kruk leci 2 minuty przez zamieć śnieżną z animacją na pasku bocznym).

---

## 12. MODUŁ 11: ARCHIWUM CIENI — BIBLIOTEKA, BESTIARIUSZ I KODEKS ZASAD

Obecny stan: `LoreArchiveView`, `RulesGuideView`, `DocumentsCodexView`, `BestiaryModal`, `OracleModal`.

### 📖 Co klimatycznego warto dodać:

1. **Bestiariusz Skandynawski z Rycinami (Nordic Myth & Magic Bestiary):**
   * Ilustrowany kodeks stworzeń północy: *Lindworm, Draugr, Huldra, Północny Smok Lodowy, Kraken z Fiordu*.
   * Przy każdej bestii: poziom zagrożenia, słabości runiczne, pozyskiwane składniki alchemiczne.

2. **Krypta Założycieli i Ożywające Portrety (Living Hall of Founders):**
   * Galeria założycieli (Nerida Vulchanova, Harfang Munter i kolejni wielcy Rektorzy) w formie animowanych obrazów olejnych, których oczy śledzą kursor, a po kliknięciu wygłaszają mroczne sentencje filozoficzne.

3. **Wyrocznia Runiczna (The Norns' Well / Studnia Urd):**
   * Gracz rzuca trzema kośćmi runicznymi na skórę niedźwiedzia, otrzymując wróżbę na temat przeszłości, teraźniejszości i przyszłości swojej postaci.

---

## 13. MODUŁ 12: SALA WOJENNA & TURNIEJE — GRY TOWARZYSKIE I RYWALIZACJA

Obecny stan: `HnefataflModal`, `RunicDuelModal`, `TargetPracticeModal`, `TournamentGauntletModal`, `ExpeditionsModal`.

### ⚔️ Co klimatycznego warto dodać:

1. **Pojedynki Runiczne z Postawami Bojowymi (Nordic Spell Duels):**
   * System pojedynków oparty na żywiołach Północy: *Mróz, Cień, Krew, Grom*.
   * Wybór postawy bojowej (*Postawa Wilka – agresja, Postawa Niedźwiedzia – obrona, Postawa Kruka – podstęp*).

2. **Królewska Gra Wikingów (Hnefatafl) z Drewnianą Planszą:**
   * Wizualne dopracowanie planszy: rzeźbione w kości morsa piony, dźwięk uderzenia drewna o drewno, ranking najlepszych taktyków Cytadeli.

3. **Ekspedycje w Bezdroża Północy (The Frozen Expeditions):**
   * Tekstowo-graficzne wyprawy drużynowe do Zakazanego Fiordu czy Gór Skandynawskich z losowymi wydarzeniami, testami umiejętności i unikalnymi łupami.

---

## 14. MODUŁ 13: RADA ARCYMISTRZÓW — PANEL CMS I TAJEMNICE ADMINISTRACJI

Obecny stan: `AdminCMSView`, `DatabaseExplorerPanel`, zarządzanie domami, punktami, użytkownikami, gazetką.

### 👑 Co klimatycznego warto dodać:

1. **Klimatyczna Szata Gabinetu Rektorskiego:**
   * Panel administracyjny stylizowany na **Wielkie Biurko z Czarnego Dębu** z rozłożonymi mapami, księgami rachunkowymi i kryształową kulą do podglądu aktywności uczniów.

2. **Dziennik Zdarzeń Magicznych (The Archival Log of Fate):**
   * Logi systemowe i zmiany w bazie danych opisywane językiem fabularnym (np. *„Arcymistrz [Nazwa] wlał 50 uncji płynnego rubinu do klepsydry Domu Kruka”*).

3. **Edykt Generalny (Server-wide Decree Notification):**
   * Narzędzie dla dyrekcji do wysyłania ogólnoszkolnego komunikatu pojawiającego się na ekranach wszystkich uczniów w formie rozwijanego pergaminu z dźwiękiem rogu bojowego.

---

## 15. MATRYCA PRIORYTETÓW WDROŻENIOWYCH (ROADMAPA WOW)

Poniższa tabela przedstawia rekomendowane etapy wprowadzania powyższych ulepszeń pod kątem maksymalnego efektu imersji przy optymalnym nakładzie pracy:

| Faza | Moduł / Element | Efekt Klimatyczny (WOW Factor) | Złożoność |
| :--- | :--- | :--- | :--- |
| **Faza I: Sensoryka & Dźwięk** | Dynamiczny ambient audio per widok, uderzenie pieczęci woskiem, szelest stron gazetki | 🌟🌟🌟🌟🌟 (Natychmiastowe poczucie głębi) | Średnia |
| **Faza I: Wizualia** | Mroźne winiety, fazy księżyca, ożywione portrety w stylu drzeworytów | 🌟🌟🌟🌟🌟 (Luksusowy Dark Academia UI) | Średnia |
| **Faza II: Interakcja** | Kaligrafia runiczna różdżką, animowany kruk pocztowy, paszport pamiątkowy | 🌟🌟🌟🌟🌟 (Unikalność na skalę światową) | Średnia / Duża |
| **Faza II: Społeczność** | Ściana Szeptów, Klepsydry fizyczne 3D, Dzienniki jako autentyczne pergaminy | 🌟🌟🌟🌟 (Wzrost zaangażowania graczy) | Średnia |
| **Faza III: RPG & Gry** | Rozszerzenie Hnefatafl, Pojedynki Runiczne z postawami, Czarne Targowisko | 🌟🌟🌟🌟🌟 (Grywalność na setki godzin) | Duża |

---

> 📌 *Dokument stanowi oficjalny blueprint klimatyczny i bazę koncepcyjną dla przyszłego rozwoju Cytadeli Durmstrang.*
