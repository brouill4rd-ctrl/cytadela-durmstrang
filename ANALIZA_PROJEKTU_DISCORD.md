INSTRUKCJA: Każdy blok pomiędzy separatorami to osobna wiadomość na Discordzie. Usuń linię separatora przed wklejeniem, jeśli chcesz.

===== WIADOMOŚĆ 1/22 =====
**Cytadela Durmstrang — pełna analiza projektu i kierunki dalszego rozwoju**

> Audyt koncepcyjny stanu projektu na 24 sierpnia 2026 r. Dokument powstał na podstawie rzeczywistej struktury i kodu aplikacji. Nie opisuje zmian wykonanych w projekcie — jest wyłącznie mapą pomysłów.

**1. Wniosek główny**

Cytadela Durmstrang nie jest już prostą stroną szkoły. To duży portal RPG-lite z nauką, ekonomią, społecznością, eksploracją, minigrami, gazetą, integracją Discorda i rozbudowaną administracją. Projekt ma już wiele efektownych pojedynczych atrakcji. Największy skok jakościowy nie powstanie przez dodanie kolejnych niezależnych okien, lecz przez połączenie obecnych modułów w jeden świat, który:

- ma własny rytm dnia, pogody i roku szkolnego;
- pamięta działania gracza;
- reaguje na wydarzenia w innych częściach portalu;
- daje wyborom fabularne konsekwencje;
- pozwala społeczności wspólnie zmieniać Cytadelę;
- opowiada historie przez przedmioty, miejsca, listy, lekcje i plotki.

Najmocniejszym kierunkiem jest więc **„żywa Cytadela”**: jedna warstwa świata ponad wszystkimi istniejącymi funkcjami.

**2. Zakres audytu**

Przejrzano strukturę obejmującą:

- 25 widoków React;
- 50 komponentów interfejsu i minigier;
- 21 modułów danych startowych;
- 21 grup tras serwerowych;
- około 58 tys. linii części klienckiej i 12 tys. linii serwera;
- bazę SQLite, system uprawnień, warstwę dźwiękową i integrację Discorda;
- istniejące dokumenty koncepcyjne projektu.

Analiza rozróżnia pomysły obecne już w kodzie od nowych propozycji, aby nie zalecać ponownie funkcji, które Cytadela już posiada.

━━━━━━━━━━━━━━━━━━━━

**3. Fundament portalu i globalna atmosfera**

**Co już istnieje**

===== WIADOMOŚĆ 2/22 =====
Główna rama aplikacji składa się z monumentalnego hero, nawigacji, dwóch paneli bocznych, centralnego widoku, paska edyktów i stopki. Działa śnieg, zorza, pochodnia pod kursorem, iskry kliknięć, efekty dźwiękowe, globalny Magiczny Kompas oraz system komunikatów. Użytkownik może wyłączyć część efektów.

To bardzo mocny fundament wizualny. Problemem rozwojowym nie jest brak ozdób, lecz możliwość przesytu oraz fakt, że efekty są głównie dekoracją, a nie językiem świata.

**Co warto dodać**

**Silnik „Żywa Północ”**

Jeden globalny stan świata: pora dnia, faza księżyca, pogoda, temperatura, aktywne święto i poziom zagrożenia. Powinien wpływać na każdy moduł, przykładowo:

- zamieć opóźnia kruki i zmienia dostępne wyprawy;
- pełnia wzmacnia określone formuły runiczne;
- noc polarna odsłania sekretne lokacje;
- odwilż zmienia mapę fiordu i ceny składników;
- alarm w Cytadeli zmienia ticker, ambient, dostęp do korytarzy i treść gazetki.

**„Stan Cytadeli” zamiast zwykłego banera**

Mały, stale widoczny medalion/astrolabium pokazujący aktualny stan świata. Po otwarciu prezentowałby krótki raport narracyjny: „Noc polarna, wiatr północno-wschodni, runa dnia Isa, podwyższone zagrożenie w Zakazanym Borze”.

**Tryb ciszy i tryb ceremonialny**

- Tryb ciszy ogranicza śnieg, poświaty, ruch i audio, zachowując klimat oraz czytelność.
- Tryb ceremonialny włącza się tylko przy ważnych wydarzeniach: przydziale, finale turnieju, publikacji wyników lub wielkim edykcie.

**Pamięć wizualna**

Tło i elementy ramy mogłyby nosić ślady trwających zdarzeń: pęknięta runa po ataku, czarne chorągwie po fabularnej tragedii, złote proporce zwycięskiego Zakonu. Portal nie tylko informowałby o wydarzeniu — wyglądałby tak, jakby ono naprawdę nastąpiło.

**Priorytet**

===== WIADOMOŚĆ 3/22 =====
**Bardzo wysoki.** To warstwa, która może połączyć cały istniejący projekt.

━━━━━━━━━━━━━━━━━━━━

**4. Wejście, rejestracja i tożsamość postaci**

**Co już istnieje**

Rejestracja jest rozbudowana: dane postaci, pochodzenie, wygląd, zainteresowania, pupil, różdżka z szerokim wyborem drewna i rdzenia, portret oraz historia. Jest logowanie, odzyskiwanie hasła, akceptacja kont i role: adept, profesor, dyrekcja.

**Co warto dodać**

**List przyjęcia jako prolog**

Po zatwierdzeniu konta gracz otrzymuje zapieczętowany list, który otwiera fizycznym gestem. List zawiera spersonalizowane szczegóły z rejestracji, listę wymaganych zakupów i pierwszą wskazówkę prowadzącą przez portal.

**Podróż do Cytadeli**

Krótki, jednorazowy prolog w 3–5 scenach: port, statek przez fiord, kontrola paszportu, wejście przez bramę, pierwsze spojrzenie na Wielką Salę. Wybory w prologu mogą nadać drobny znacznik charakteru, kontakt z NPC lub przedmiot pamiątkowy, ale nie blokować treści.

**Sekretne pochodzenie**

Administrator mógłby przypisać postaci ukryty „wątek rodowy”. Gracz odkrywałby go powoli przez sny, listy, lekcje i archiwum. Dzięki temu profil przestaje być formularzem, a staje się początkiem osobistej sagi.

**Relacja z różdżką**

Różdżka powinna mieć rezonans rozwijany przez działania. Częste używanie run, alchemii lub pojedynków zmienia jej charakterystykę, opis i subtelny efekt wizualny. Nie chodzi o przewagę liczbową, lecz o personalizację opowieści.

**Priorytet**

**Wysoki.** Pierwsze 15 minut decyduje, czy użytkownik poczuje, że wszedł do świata, czy tylko założył konto.

━━━━━━━━━━━━━━━━━━━━

**5. Strona główna, aktualności i edykty**

**Co już istnieje**

===== WIADOMOŚĆ 4/22 =====
Home obsługuje aktualności, kategorie, filtrowanie, wyróżnienia i szczegółowy podgląd. Są edytory newsów, pieczęcie uznania, grafiki kategorii, wydarzenia, rankingi oraz elementy społecznościowe w panelach bocznych.

**Co warto dodać**

**Strona główna zależna od roli i sytuacji**

Ten sam portal powinien inaczej witać adepta, profesora i dyrekcję. Adept widzi najbliższą lekcję, niedokończoną misję i list. Profesor — zajęcia i prace do oceny. Dyrekcja — sytuacje wymagające decyzji. Elementy nadal pozostają klimatyczne, ale strona staje się użyteczna.

**Kronika dnia**

Automatycznie składany, krótki zapis najważniejszych zdarzeń: zdobyte punkty, ukończone wyprawy, nowe odkrycie, opublikowana lekcja, zwycięzca gry. Powinien brzmieć jak zapis kronikarza, nie jak log systemowy.

**Plotka kontra fakt**

Obok oficjalnych edyktów może funkcjonować „Ściana Szeptów”. Część wpisów byłaby prawdziwą wskazówką, część dezinformacją, część zapowiedzią wydarzenia. Moderator zatwierdza treści, a użytkownicy próbują ocenić ich wiarygodność.

**Aktualność, która rozpoczyna historię**

News może zawierać nie tylko tekst, lecz akcję: „zbadaj miejsce”, „odpowiedz krukiem”, „przynieś przedmiot”, „rozwiąż szyfr”. To naturalny most między CMS-em a grą.

**Priorytet**

**Wysoki.** Strona główna powinna być centrum bieżącego życia, nie tylko tablicą treści.

━━━━━━━━━━━━━━━━━━━━

**6. Nawigacja, panele boczne i Magiczny Kompas**

**Co już istnieje**

Nawigacja obejmuje praktycznie cały portal, a Magiczny Kompas pozwala szybko wyszukiwać miejsca, katedry i akcje. Panele boczne prezentują skróty, rankingi, konta, wydarzenia, efekty oraz dostęp do licznych modalnych atrakcji.

**Co warto dodać**

**Kompas kontekstowy**

===== WIADOMOŚĆ 5/22 =====
Poza wyszukiwaniem miejsc Kompas mógłby rozumieć zamiary: „co mam dziś zrobić?”, „gdzie oddać pracę?”, „kto uczy run?”, „jak zarobić 20 skillingów?”. Wynik prowadzi do właściwego modułu i podświetla odpowiednią akcję.

**Ślad okruszków jako droga przez Cytadelę**

Zamiast technicznych breadcrumbs: „Brama Główna → Skrzydło Akademickie → Katedra Run → Archiwum ocen”. Pomaga w orientacji i wzmacnia poczucie przestrzeni.

**„Przypnij do pasa”**

Użytkownik wybiera 3–5 najważniejszych skrótów: plan, pocztę, bank, katedrę, misję. Skróty wyglądają jak talizmany zawieszone przy pasie lub znaki na runicznym kole.

**Jedno centrum powiadomień**

Listy, oceny, transakcje, wydarzenia i decyzje administracyjne powinny trafiać do wspólnej kroniki powiadomień z możliwością przejścia do źródła. Obecne komunikaty chwilowe mogą pozostać, ale ważne rzeczy nie powinny znikać bez śladu.

**Priorytet**

**Średnio-wysoki.** Projekt jest już na tyle duży, że odnajdywanie funkcji staje się częścią doświadczenia.

━━━━━━━━━━━━━━━━━━━━

**7. Zakony, ceremonia i pokoje wspólne**

**Co już istnieje**

Cztery Zakony mają herby, własną symbolikę, ranking w wielu zakresach czasu, quiz przydziału, pokoje wspólne, wiadomości wspólnoty i kontrolę dostępu. Są też żywe klepsydry punktowe.

**Co warto dodać**

**Tożsamość Zakonu przez mechanikę, nie tylko kolor**

Każdy Zakon powinien mieć inny rodzaj aktywności:

- Reinhall — ekspedycje, tropienie i wytrwałość;
- Björnhall — obrona, rzemiosło i pojedynki;
- Ravnheim — zagadki, wiedza i odkrywanie sekretów;
- Otergard — alchemia, handel, dyplomacja i skradanie.

Każdy może uczestniczyć we wszystkim, lecz Zakon daje własne narracyjne spojrzenie i opcjonalne rozwiązania.

**Projekty wspólnotowe**

===== WIADOMOŚĆ 6/22 =====
Zakony zbierają zasoby na trwałe ulepszenia swojego pokoju: odbudowę biblioteki, paleniska, obserwatorium lub podwodnej galerii. Rezultat jest widoczny dla wszystkich członków i zapisany w kronice.

**Rada Zakonu**

Wybierane role uczniowskie: Kronikarz, Strażnik Skarbca, Posłaniec, Mistrz Gry. Role dają obowiązki społeczne, narzędzia organizacyjne i prestiż, a nie bezpośrednią przewagę.

**Doroczna Saga Zakonu**

Każdy Zakon otrzymuje w roku szkolnym dłuższy wątek z trzema etapami. Finały czterech sag łączą się w jedno ogólnoszkolne wydarzenie.

**Priorytet**

**Bardzo wysoki.** To najlepsza przestrzeń do budowania więzi i powracalności użytkowników.

━━━━━━━━━━━━━━━━━━━━

**8. Akademia, katedry i przedmioty**

**Co już istnieje**

System obejmuje katalog wielu przedmiotów i katedr, wyszukiwanie, profile profesorów, sylabusy, regulaminy, materiały, oceny, kategorie ocen, prace domowe, oddawanie tekstu, komentarze profesorskie oraz kontrolę właściciela przedmiotu. Dane mają część serwerową i tryb awaryjny w pamięci przeglądarki.

**Co warto dodać**

**Ścieżki specjalizacji**

Po pierwszym etapie nauki gracz wybiera specjalizację złożoną z przedmiotów, np. Runomanta Polowy, Alchemik Toksykolog, Badacz Istot Nocy. Specjalizacja odblokowuje osobne studium przypadku, tytuł i finałowy egzamin praktyczny.

**Wiedza użyteczna poza lekcją**

Ocena lub zaliczony temat powinny otwierać nowe możliwości w innych modułach. Przykład: wiedza o Isa daje dodatkową odpowiedź w lochu, zielarstwo rozpoznaje fałszywy składnik na rynku, astronomia ujawnia moment otwarcia przejścia na mapie.

**Gabinety profesorów**

Każdy profesor otrzymuje małą stronę-gabinet: dyżury, notatka dnia, półka polecanych materiałów, skrzynka pytań i osobisty klimat katedry. To humanizuje kadrę i odciąża komunikację.

===== WIADOMOŚĆ 7/22 =====
**Księga postępu rocznika**

Widok zbiorowy pokazujący, które rozdziały roku szkolnego ukończono, co właśnie trwa i jakie wydarzenie akademickie nadchodzi. Zamiast procentowego paska — zapełniający się iluminowany manuskrypt.

**Egzaminy jako wydarzenia**

Egzamin może łączyć quiz, krótkie zadanie praktyczne, decyzję fabularną i element z innego modułu. Przykład: odczyt runy, zakup właściwego składnika, odnalezienie sali i przesłanie odpowiedzi.

**Priorytet**

**Bardzo wysoki.** Nauka jest rdzeniem tożsamości projektu i powinna zasilać całą resztę świata.

━━━━━━━━━━━━━━━━━━━━

**9. Plan zajęć, lekcje, dzienniki i prace domowe**

**Co już istnieje**

Plan zajęć jest jednym z największych modułów: statystyki, filtry, szczegóły, zastępstwa, odwołania i przywracanie zajęć. Dzienniki posiadają publikację, zapis przebiegu lekcji, transkrypcje Discorda, obecność, punkty, audyt, rankingi oraz korekty. Profesor ma osobny edytor. Działa składanie i ocenianie prac.

**Co warto dodać**

**Dzwon Cytadeli**

Globalne, dyskretne odliczanie do zajęć. Na kilka minut przed lekcją dzwon zmienia stan portalu, a drzwi właściwej sali rozświetlają się na mapie. Użytkownik może jednym ruchem wejść do lekcji lub Discorda.

**Frekwencja jako ślad obecności**

Zamiast suchego „obecny/nieobecny”: wpis w księdze wejść, pieczęć Zakonu lub magiczny podpis. Profesor nadal ma prostą kontrolę, lecz uczniowie widzą bardziej fabularną formę.

**Marginalia wspólnej księgi**

Po publikacji lekcji uczniowie mogą dodawać krótkie pytania lub notatki na marginesie, a profesor oznacza odpowiedzi jako wyjaśnione. Powstaje żywy podręcznik kolejnych roczników.

**Łańcuchy prac domowych**

===== WIADOMOŚĆ 8/22 =====
Niektóre prace tworzą serię: rezultat pierwszej wpływa na temat drugiej. Na końcu powstaje osobisty artefakt, zielnik, mapa gwiazd lub traktat, który trafia do profilu.

**Roczne archiwum pamięci**

Po zakończeniu roku system składa kronikę: najważniejsze lekcje, osiągnięcia, fotografie wydarzeń, cytaty i zwycięzców. Można ją czytać jak dawny tom w bibliotece.

**Priorytet**

**Wysoki.** Obecna infrastruktura jest już na tyle dojrzała, że warto nadać jej bardziej ceremonialną formę.

━━━━━━━━━━━━━━━━━━━━

**10. Warsztat runiczny i alchemia**

**Co już istnieje**

Galdrastofa zawiera formuły, łączenie run i katalizatorów, wytwarzanie, księgę run, kocioł alchemiczny oraz bardzo rozbudowaną kaligrafię z rozpoznawaniem rysunku. Ten obszar nie potrzebuje kolejnej prostej minigry.

**Co warto dodać**

**Pracownia trwałych artefaktów**

Wytworzona formuła mogłaby zostać osadzona w konkretnym przedmiocie z ekwipunku. Artefakt otrzymuje nazwę, datę, podpis twórcy, historię użycia i ograniczoną liczbę aktywacji.

**Odkrycia receptur przez eksperyment**

Zamiast wszystkich przepisów widocznych od razu, część kombinacji pozostaje nieznana. Gracze dzielą się odkryciami w zakonnych księgach lub zachowują je jako sekret. Nieudana próba daje wskazówkę, nie tylko karę.

**Zmienność składników**

Składniki mają pochodzenie, jakość i datę pozyskania. Mech zebrany podczas pełni różni się od kupionego na rynku. To łączy mapę, pogodę, ekonomię i alchemię.

**Zamówienia katedralne**

Profesor lub administracja zleca społeczności wykonanie określonej liczby antidotów, pieczęci czy amuletów przed wydarzeniem. Wspólny sukces zmienia przebieg historii.

**Katalog błędów alchemicznych**

===== WIADOMOŚĆ 9/22 =====
Najciekawsze porażki trafiają do humorystyczno-naukowej księgi: kolor dymu, objawy, przyczyna, nazwisko odkrywcy. Porażka staje się treścią, a nie zmarnowanym kliknięciem.

**Priorytet**

**Wysoki.** Największa wartość powstanie przez nadanie obecnemu craftingowi znaczenia w innych modułach.

━━━━━━━━━━━━━━━━━━━━

**11. Mapa, lokacje, sekrety i eksploracja**

**Co już istnieje**

Mapa ma własne lokacje, płótno w stylistyce magicznej mapy, zadania eksploracyjne, loch, łowienie pod lodem i sekrety. Misje mogą przyznawać nagrody, przedmioty oraz punkty.

**Co warto dodać**

**Mapa warstwowa**

Ta sama przestrzeń w kilku warstwach: dzienna, nocna, historyczna i „echo magiczne”. Warstwa historyczna pokazuje dawny układ Cytadeli, a echo magiczne ślady ostatnich zdarzeń.

**Lokacje pamiętające decyzje**

Jeżeli społeczność naprawi most, oczyści kryptę lub obudzi strażnika, opis, ilustracja i dostępne akcje miejsca zmieniają się na stałe lub do końca sezonu.

**NPC z harmonogramem**

Kilka kluczowych postaci przemieszcza się między lokacjami zależnie od dnia i godziny. Aby porozmawiać z kartografem, trzeba znaleźć go w archiwum, porcie albo karczmie.

**Wyprawy śledcze**

Zamiast pojedynczej zagadki: tablica dowodów łącząca fragment lekcji, przedmiot, list, artykuł i lokację. Gracz sam wskazuje rozwiązanie, a błędna teoria może uruchomić alternatywny trop.

**Legendy tworzone przez graczy**

Po ważnej wyprawie drużyna wybiera nazwę wydarzenia i krótką inskrypcję. Po zatwierdzeniu wpis pojawia się w danej lokacji oraz kronice świata.

**Priorytet**

**Bardzo wysoki.** Mapa jest naturalnym ekranem spinającym wszystkie historie.

━━━━━━━━━━━━━━━━━━━━

**12. Rynek Kaupangr, czarny rynek i listy zakupowe**

**Co już istnieje**

===== WIADOMOŚĆ 10/22 =====
Rynek obsługuje sklepy, kategorie, rzadkości, zakupy, ekwipunek, listy wyprawek, administrację przedmiotami i osobny czarny rynek. Przedmioty mają opis, lore, cenę, ikonę lub grafikę oraz ograniczenia zakonne.

**Co warto dodać**

**Targ zależny od świata**

Ceny i dostępność wynikają z pogody, wydarzeń i działań społeczności. Po wyprawie wraca dostawa smoczych łusek; po zamieci brakuje ziół; święto obniża cenę szat ceremonialnych.

**Rzemieślnicy z reputacją**

Sklepy powinny mieć właścicieli, osobowość, krótkie dialogi i poziom zaufania. Stały klient poznaje plotkę, otrzymuje zamówienie specjalne lub dostęp do przedmiotu z historią.

**Przedmioty „jednego egzemplarza”**

Wybrane artefakty istnieją tylko raz. Mogą być sprzedane, podarowane, utracone albo wystawione w gablocie Zakonu. System zapisuje łańcuch właścicieli.

**Handel między graczami z bezpiecznym depozytem**

Transakcja trafia na stół kupiecki, obie strony zatwierdzają przedmiot i monety, a system dopiero wtedy dokonuje wymiany. Aukcje ze świecą pasują jako wydarzenie okresowe, nie stały ekran.

**Kontrabanda z konsekwencją**

Czarny rynek powinien oferować pokusę, nie tylko droższy sklep. Zakup może zostawić „ślad podejrzenia”, stworzyć dług u handlarza albo otworzyć zadanie. Zawsze powinna istnieć uczciwa alternatywa.

**Priorytet**

**Średnio-wysoki.** Ekonomia zyska sens, gdy przedmioty będą miały historię i zastosowanie.

━━━━━━━━━━━━━━━━━━━━

**13. Bank Skirnirów i waluta**

**Co już istnieje**

Bank obsługuje konta graczy i skarbce, trzy waluty, przelewy z listem, filtrowaną księgę transakcji, stypendia, pensje profesorskie, wypłaty za lekcje i administracyjny nadzór finansów.

**Co warto dodać**

**Cele oszczędnościowe jako szkatuły**

===== WIADOMOŚĆ 11/22 =====
Gracz zakłada szkatułę na konkretny cel: różdżkę, wyprawę, dar dla Zakonu. Postęp jest wizualizowany fizycznym zapełnianiem skarbca.

**Fundusze społecznościowe**

Zakony i grupy mogą zbierać środki na wydarzenia, nagrody turniejowe lub ulepszenia pokoju. Każda wpłata pozostawia jawny zapis w księdze dobroczyńców.

**Kontrakty i nagrody**

Profesor lub administrator wystawia kontrakt: zadanie, termin i kwota są zamrażane w depozycie. Wykonanie automatycznie uruchamia wypłatę i wpis do reputacji.

**Monety jako obiekty lore**

Rzadkie serie monet mogą przedstawiać dawnych rektorów, bitwy i stworzenia. Użytkownik zbiera numizmatyczny katalog niezależny od salda.

**Priorytet**

**Średni.** Moduł jest funkcjonalnie mocny; potrzebuje przede wszystkim powiązań z celami i historiami.

━━━━━━━━━━━━━━━━━━━━

**14. Profil, paszport, ekwipunek i osiągnięcia**

**Co już istnieje**

Profil prezentuje tożsamość postaci, Zakon, statystyki, różdżkę, osiągnięcia, ekwipunek i drzewko umiejętności. Jest edytor oraz wielostronicowy paszport ucznia.

**Co warto dodać**

**Oś sagi postaci**

Automatyczna, elegancka chronologia: przybycie, przydział, pierwsza lekcja, ważne oceny, odkrycia, zwycięstwa, otrzymane przedmioty. Użytkownik może oznaczyć kilka wpisów jako najważniejsze.

**Gablota i strój postaci**

Nie pełny kreator 3D, lecz kompozycja 2D z wybranym portretem, szatą, przypiętymi insygniami, różdżką i trzema eksponowanymi artefaktami.

**Reputacje zamiast jednego poziomu**

Osobna reputacja wśród Zakonu, kadry, kupców, archiwistów i postaci półświatka. Działania otwierają różne dialogi i możliwości, bez moralnego paska „dobry/zły”.

**Blizny i znamiona fabularne**

===== WIADOMOŚĆ 12/22 =====
Ważne wydarzenie może pozostawić opisową cechę: „znamię lodowego ognia”, „dług wobec Skirnirów”, „szept Krypty”. Widoczne za zgodą użytkownika i używane jako zaczepki w przyszłych historiach.

**Eksport karty pamiątkowej**

Generowana grafika postaci na koniec roku szkolnego: portret, Zakon, tytuły, najważniejszy artefakt i motto. To również naturalny materiał do udostępniania społeczności.

**Priorytet**

**Wysoki.** Profil powinien być kroniką tego, co użytkownik przeżył w całym portalu.

━━━━━━━━━━━━━━━━━━━━

**15. Poczta Kruków, skrzynka i Discord**

**Co już istnieje**

Projekt ma pocztę wewnętrzną, czytanie, oznaczanie, usuwanie i tworzenie wiadomości, osobną skrzynkę e-mailową, weryfikację kont Discord, mapowania ról, synchronizację oraz rozbudowane prowadzenie i archiwizowanie lekcji przez Discorda.

**Co warto dodać**

**Kruki o charakterach**

Użytkownik wybiera własnego kruka-posłańca: imię, wygląd i temperament. Ptak może wracać przemoczony, zniecierpliwiony albo z drobnym znalezionym przedmiotem. Jest to kosmetyczne, ale zapamiętywalne.

**Listy uruchamiające sceny**

Wiadomość od NPC może zawierać pieczęć, przedmiot, termin lub zaszyfrowaną wskazówkę. Otwarcie listu aktualizuje mapę albo misję. Odpowiedź wybierana lub pisana przez gracza wpływa na dalszy ciąg.

**Archiwum korespondencji fabularnej**

Ważne listy można przenieść do osobistej skórzanej teczki, opisać i zachować w osi sagi. Zwykłe komunikaty pozostają w skrzynce.

**Most portal–Discord**

Poza synchronizacją ról warto publikować do portalu wybrane, moderowane „echa” społeczności: cytat lekcji, wynik wydarzenia, zapowiedź profesora. Z kolei portal może generować na Discordzie karty rozpoczynające misje grupowe.

**Cisza nocna**

===== WIADOMOŚĆ 13/22 =====
Użytkownik ustawia godziny, w których zwykłe powiadomienia są zbierane w poranny zwój. Pilne edykty zachowują osobny priorytet.

**Priorytet**

**Wysoki.** Komunikacja jest krwiobiegiem społeczności i świetnym nośnikiem fabuły.

━━━━━━━━━━━━━━━━━━━━

**16. Lore, dokumenty, regulaminy i bestiariusz**

**Co już istnieje**

Archiwum lore, Kodeks Dokumentów i przewodnik zasad mają wyszukiwanie, kategorie, rozbudowane treści i własne widoki. Działa bestiariusz, Wyrocznia, własne strony CMS oraz edycja dokumentów.

**Co warto dodać**

**Wiedza o niepewnej wiarygodności**

Nie każda księga powinna mówić prawdę. Dokument może mieć autora, epokę, cenzurę i sprzeczności z innym źródłem. Gracz porównuje relacje i sam buduje teorię.

**Margines bibliotekarza**

Wybrane teksty zawierają dopiski dawnych czytelników. Niektóre są żartem, inne szyfrem, inne tropem do lokacji. Adnotacje odblokowują się po spełnieniu warunku.

**System cytowania świata**

Lekcje, artykuły gazetki i listy mogą odsyłać bezpośrednio do konkretnego fragmentu dokumentu. Dzięki temu archiwum staje się realnym źródłem wiedzy, nie osobną encyklopedią.

**Bestiariusz obserwacyjny**

Podstawowy opis bestii jest publiczny, lecz zachowania, słabości i ślady uzupełnia się przez wyprawy, lekcje i spotkania. Społeczność wspólnie „dopisuje” wiedzę zatwierdzaną przez kadrę.

**Sala dokumentów zapieczętowanych**

Materiały z poziomami dostępu: ogólne, zakonne, profesorskie, dyrektorskie oraz czasowo odtajniane. Sam fakt istnienia zamkniętego tomu buduje tajemnicę.

**Priorytet**

**Średnio-wysoki.** Treści już istnieją; warto zrobić z nich narzędzia odkrywania świata.

━━━━━━━━━━━━━━━━━━━━

**17. Gazetka „Żelazne Pióro”**

**Co już istnieje**

===== WIADOMOŚĆ 14/22 =====
Gazetka ma stronę główną, archiwum, wyszukiwanie, czytnik flipbook, wydania, strony, artykuły, statusy redakcyjne, komentarze, redakcję, działy, zgłoszenia uczniowskie, quizy, krzyżówki, sekrety oraz analitykę. To jeden z najbardziej kompletnych modułów.

**Co warto dodać**

**Gazeta reagująca na świat**

Redakcja może osadzać automatyczne bloki: aktualny wynik Zakonów, pogodę, kurs towarów, ostatnie odkrycia i terminarz. W chwili publikacji dane zostają utrwalone, tworząc historyczną migawkę.

**Wydania nadzwyczajne**

Krótka, jednostronicowa gazeta uruchamiana przy dużym wydarzeniu. Przylatuje jako zwinięty arkusz i po przeczytaniu trafia do archiwum.

**Śledztwa dziennikarskie**

Redaktor otrzymuje możliwość zbierania źródeł, proszenia użytkowników o wypowiedź i publikowania osi dowodów. Bohaterowie artykułu mogą przesłać sprostowanie do kolejnego numeru.

**Kolekcja wydań**

Profil pokazuje, które numery gracz przeczytał i jakie zagadki rozwiązał. Komplet rocznika daje kosmetyczny ekslibris lub tytuł „Czytelnik Archiwum”.

**Ruchome ryciny bardzo oszczędnie**

Jedna delikatnie animowana rycina na okładkę lub artykuł przewodni wystarczy. Zbyt wiele ruchu zniszczy wrażenie luksusowego druku.

**Priorytet**

**Średni.** Moduł jest bogaty; powinien przede wszystkim dokumentować i komentować wydarzenia z reszty portalu.

━━━━━━━━━━━━━━━━━━━━

**18. Minigry, turnieje i wyprawy**

**Co już istnieje**

Projekt zawiera Hnefatafl, pojedynek runiczny, strzelnicę, wieloetapowy turniej, ekspedycje, ucieczkę z lochu, łowienie pod lodem i zadania mapowe. Są nagrody, punkty i przedmioty.

**Co warto dodać**

**Sezony i liga Cytadeli**

===== WIADOMOŚĆ 15/22 =====
Wyniki gier trafiają do sezonowej ligi indywidualnej i zakonnej. Co ważne, każda aktywność powinna mieć osobną kategorię, by nie premiować wyłącznie jednej minigry.

**Wyzwania asynchroniczne**

Gracz zostawia wynik lub układ startowy, a druga osoba odpowiada w dogodnym czasie. Sprawdza się to lepiej w szkolnej społeczności niż wymaganie jednoczesnej obecności.

**Drużynowe role w ekspedycji**

Kartograf, alchemik, obrońca i kronikarz otrzymują odmienne decyzje. Wyprawa wymaga współpracy, a nie czterech identycznych kliknięć.

**Modyfikatory świata**

Zamieć, pełnia, święto Zakonu czy kryzys fabularny zmieniają zasady istniejących gier na kilka dni. Ta sama zawartość zyskuje świeżość bez budowania nowej gry.

**Trofea z konkretną historią**

Nagroda zapisuje nazwę turnieju, datę, wynik i pokonanego przeciwnika. Eksponowana w profilu ma większą wartość niż anonimowa ikona.

**Tryb treningowy bez nagród**

Pozwala poznać zasady bez ryzyka i bez nabijania ekonomii. Rankingowe próby są limitowane lub odbywają się w wyznaczonych oknach sezonu.

**Priorytet**

**Średnio-wysoki.** Warto pogłębić i połączyć istniejące gry zamiast mnożyć kolejne.

━━━━━━━━━━━━━━━━━━━━

**19. Sekrety, wyrocznia i warstwa tajemnicy**

**Co już istnieje**

Są sekretne runy, system odkryć, Wyrocznia, czarny rynek, ukryte zadania i ograniczony dostęp do części widoków.

**Co warto dodać**

**Jeden wielki sekret roku**

Wskazówki rozproszone po newsach, mapie, lekcjach, listach, przedmiotach i gazetce. Żaden pojedynczy gracz nie musi znaleźć wszystkiego — społeczność składa rozwiązanie razem.

**Język symboli konsekwentny w całym portalu**

===== WIADOMOŚĆ 16/22 =====
Określone runy zawsze znaczą to samo. Gracz uczy się ich na zajęciach, a później rozpoznaje na drzwiach, pieczęci listu lub monecie. To daje satysfakcję z prawdziwego rozumienia świata.

**Sny i omen**

Rzadkie, krótkie sceny po wejściu do portalu, zależne od działań postaci. Nie mówią wprost, co zrobić, lecz zapowiadają miejsce lub zagrożenie. Można je zapisać w prywatnym dzienniku snów.

**Sekrety bez nagrody materialnej**

Nie każde odkrycie powinno dawać walutę. Czasem nagrodą jest scena, fragment muzyki, nowe zdanie portretu, zmieniony opis lokacji lub prawda o postaci.

**Priorytet**

**Bardzo wysoki.** Tajemnica jest główną obietnicą marki: „Nie każda magia powinna zostać poznana”.

━━━━━━━━━━━━━━━━━━━━

**20. Panel administracyjny i zarządzanie światem**

**Co już istnieje**

Panel dyrekcji jest ogromny: konta, akceptacje, role, domy, punkty, katedry, przedmioty, plan, treści, wydarzenia, newsy, banery, bloki, sklep, baza danych, Discord, logi, gazetka i inne funkcje. Jest eksplorator bazy i audyt operacji.

**Co warto dodać**

**Reżyser wydarzeń**

Najważniejsze nowe narzędzie administracyjne. Jeden ekran pozwala ustawić:

- nazwę i czas wydarzenia;
- pogodę oraz wygląd portalu;
- aktywne lokacje i NPC;
- dostępne misje i przedmioty;
- wiadomość startową oraz finałową;
- modyfikatory punktów, rynku i gier;
- automatyczny wpis do kroniki po zakończeniu.

**Podgląd portalu jako konkretna rola**

Administrator wybiera „zobacz jak adept Ravnheim / profesor / gość” bez zmiany konta. Pozwala sprawdzić dostęp i narrację przed publikacją.

**Kalendarz publikacji**

Wspólna oś czasu dla newsów, wydarzeń, gazety, lekcji, zadań i edyktów. Zapobiega sytuacji, w której kilka ważnych treści konkuruje w tym samym dniu.

**Bezpieczne wersje robocze i podgląd zmian**

===== WIADOMOŚĆ 17/22 =====
Treść przed publikacją powinna mieć wersję roboczą, podgląd, historię wersji i możliwość przywrócenia. W dużym świecie CMS jest narzędziem narracyjnym, więc spójność ma ogromne znaczenie.

**Panel kondycji świata**

Nie tylko techniczne statystyki, ale też: ilu graczy ma niedokończony onboarding, które miejsca nie są odwiedzane, gdzie kończą się misje, które przedmioty nie mają zastosowania, jakie moduły są przeładowane.

**Priorytet**

**Bardzo wysoki.** Bez wygodnego reżysera każda przekrojowa historia będzie wymagać ręcznej pracy w wielu miejscach.

━━━━━━━━━━━━━━━━━━━━

**21. Serwer, dane i integracje — perspektywa produktu**

**Co już istnieje**

Express i SQLite obsługują konta, wiadomości, newsy, lekcje, Discord, przedmioty, plan, bank, rynek, loterię, dokumenty, CMS, wydarzenia, zadania, sekrety, warsztat, prace domowe, pocztę i gazetę. Warstwa kliencka ma liczne mechanizmy awaryjne oparte na localStorage.

**Co warto dodać**

**Centralny dziennik zdarzeń świata**

Każda ważna akcja emituje czytelne zdarzenie: `lesson.completed`, `rune.crafted`, `location.discovered`, `house.points.changed`, `gazette.published`. Inne moduły mogą na nie reagować. To techniczny fundament „żywej Cytadeli”.

**Reguły automatyzacji narracji**

Proste zasady typu: „gdy Zakon przekroczy próg punktów, odblokuj proporzec”; „gdy 30 eliksirów zostanie dostarczonych, zakończ kryzys”; „gdy użytkownik zaliczy astronomię, pokaż przejście podczas pełni”.

**Jedno źródło prawdy o postępie**

Postęp, saldo, przedmioty, punkty i odkrycia powinny być rozstrzygane na serwerze, a pamięć przeglądarki pełnić rolę cache lub trybu demonstracyjnego. Dzięki temu wydarzenia przekrojowe będą przewidywalne.

**Rejestr historii przedmiotu i postaci**

===== WIADOMOŚĆ 18/22 =====
Nie tylko bieżący stan, ale kolejne ważne fakty: kto wytworzył artefakt, kto go posiadał, gdzie został użyty, kto przyznał tytuł. To dane, z których można automatycznie budować sagę.

**System flag fabularnych**

Małe znaczniki, np. `heard_crypt_whisper`, `helped_archivist`, `owes_smuggler`, pozwolą pisać rozgałęzione historie bez tworzenia osobnego kodu dla każdej kombinacji.

**Priorytet**

**Krytyczny jako fundament**, choć dla użytkownika początkowo niewidoczny.

━━━━━━━━━━━━━━━━━━━━

**22. Spójność artystyczna i jakość doświadczenia**

**Mocne strony**

- bardzo konsekwentna paleta ciemnego granatu, kamienia i starego złota;
- rozpoznawalne nordyckie nazewnictwo;
- duża ilość własnego lore i mikrotekstów;
- komponenty udające fizyczne artefakty: księgi, pieczęcie, mapy, paszporty;
- wysoka gęstość interakcji i silne pierwsze wrażenie.

**Ryzyka**

- wiele ekranów używa podobnych ciemnych kart, złotych ramek i ikon emoji, przez co wyjątkowe moduły mogą zacząć wyglądać jednakowo;
- nadmiar ruchu, poświat i modalnych atrakcji może osłabić elegancję dark academia;
- część obrazów i portretów pochodzi z ogólnych zewnętrznych zdjęć, które nie zawsze pasują do jednolitego świata;
- ogrom funkcji może przytłoczyć nowego użytkownika;
- pojedyncze moduły są bogate, lecz ich działania nie zawsze mają konsekwencje poza własnym ekranem.

**Zalecany system materiałów**

Zamiast jednej oprawy dla wszystkiego warto przypisać materiały funkcjom:

| Materiał | Zastosowanie |
|---|---|
| Kamień i żelazo | nawigacja, bramy, administracja, dostęp |
| Pergamin i atrament | lekcje, listy, newsy, dokumenty |
| Skóra i mosiądz | profil, paszport, bank, kroniki |
| Lód i szkło | mapa, astronomia, sekrety, magia |
| Drewno i kość | gry, rynek, rzemiosło, Zakony |

===== WIADOMOŚĆ 19/22 =====
Takie rozróżnienie pozwoli rozpoznać typ przestrzeni jeszcze przed przeczytaniem nagłówka.

**Zalecenie dotyczące ikon**

Emoji dobrze działają jako szybkie prototypy i drobne akcenty, ale najważniejsze artefakty, waluty, Zakony, katedry i działania powinny stopniowo otrzymać spójny zestaw monochromatycznych rycin/run. Emoji można zachować w treściach społecznościowych i lżejszych minigrach.

━━━━━━━━━━━━━━━━━━━━

**23. Najlepsze nowe systemy przekrojowe**

Poniższe pomysły dadzą większy efekt niż dziesięć kolejnych niezależnych modalnych atrakcji.

**A. Żywy Rok Szkolny**

Sezon podzielony na rozdziały: przybycie, pierwsze mrozy, noc polarna, przesilenie, odwilż, egzaminy i finał Pucharu Północy. Każdy rozdział zmienia treści, pogodę, rynek, mapę i aktywności.

**B. Wielka Tajemnica Sezonu**

Jedna historia rozłożona między wszystkimi modułami. Wymaga wiedzy z lekcji, eksploracji, korespondencji, alchemii i współpracy Zakonów.

**C. Saga Postaci**

Automatyczna pamięć najważniejszych zdarzeń, relacji, artefaktów i wyborów. Profil staje się osobistą opowieścią.

**D. Reżyser Wydarzeń**

Panel, dzięki któremu administracja składa wydarzenie z istniejących elementów bez ręcznego modyfikowania wielu modułów.

**E. Wiedza jako klucz**

To, czego gracz nauczył się na przedmiotach, daje nowe sposoby rozwiązywania problemów w mapie, rynku, grach i fabule.

**F. Projekty wspólnotowe**

Cała szkoła lub Zakony wspólnie zbierają zasoby, wiedzę albo punkty, aby widocznie zmienić stan świata.

━━━━━━━━━━━━━━━━━━━━

**24. Propozycja „wydarzenia pokazowego”, które wykorzysta prawie cały projekt**

**„Pęknięcie pod Czarnym Fiordem”**

1. Strona główna publikuje edykt o nocnych wstrząsach.
2. Pogoda zmienia się na długą zamieć, a w ramie portalu pojawiają się drobne pęknięcia lodu.

===== WIADOMOŚĆ 20/22 =====
3. Na mapie otwiera się nowa szczelina, lecz wejście wymaga wiedzy z astronomii i run.
4. Profesorowie publikują lekcję specjalną oraz zadanie badawcze.
5. Kruki dostarczają różnym Zakonom odmienne fragmenty ostrzeżenia.
6. Rynek cierpi na braki ziół; alchemicy muszą zebrać i wytworzyć mikstury ochronne.
7. Bank otwiera fundusz ekspedycji, a Zakony finansują wspólną wyprawę.
8. Drużyny eksplorują szczelinę z odmiennymi rolami.
9. W archiwum gracze odkrywają sprzeczne relacje o istocie uwięzionej pod fiordem.
10. Społeczność wybiera: zapieczętować istotę, spróbować nawiązać kontakt albo wykorzystać jej moc.
11. Decyzja zmienia mapę, dostępność składników, jeden opis katedry i wygląd portalu do końca sezonu.
12. „Żelazne Pióro” publikuje wydanie nadzwyczajne, a kronika zapisuje nazwiska uczestników.

To wydarzenie nie wymaga budowy nowego świata od zera. Wykorzystuje istniejące newsy, lekcje, mapę, pocztę, ekonomię, warsztat, dokumenty, gazetkę, profile i panel administracyjny. Pokazuje też docelową przewagę projektu: wszystkie części Cytadeli mówią jednym głosem.

━━━━━━━━━━━━━━━━━━━━

**25. Roadmapa według efektu i kosztu**

**Etap 1 — największy efekt przy małym lub średnim koszcie**

1. Wspólne centrum powiadomień i kronika dnia.
2. Kontekstowe wejścia między modułami: lekcja → mapa → warsztat → profil.
3. Oś sagi postaci oparta na już istniejących danych.
4. Globalny stan pogody, pory dnia i wydarzenia widoczny w portalu.
5. Reakcje treści na istniejące punkty, oceny, przedmioty i odkrycia.
6. Ujednolicenie ikon najważniejszych systemów.

**Etap 2 — pogłębienie społeczności**

1. Projekty Zakonu i fundusze wspólnotowe.
2. Role uczniowskie oraz kroniki Zakonów.
3. Wyprawy asynchroniczne i grupowe.
4. Gabinety profesorów i marginalia lekcji.
5. Listy fabularne uruchamiające misje.

===== WIADOMOŚĆ 21/22 =====
**Etap 3 — żywy świat**

1. Centralny dziennik zdarzeń.
2. Reżyser wydarzeń.
3. Sezonowy kalendarz świata.
4. Dynamiczne lokacje, rynek i NPC.
5. Wielka tajemnica roku szkolnego.

**Etap 4 — prestiż i oprawa premium**

1. Własny zestaw rycin, herbów, ikon przedmiotów i portretów.
2. Delikatne animowane ilustracje kluczowych scen.
3. Eksport paszportu i karty końca roku.
4. Unikalne oprawy materiałowe dla poszczególnych przestrzeni.
5. Pełny pejzaż dźwiękowy zależny od miejsca i stanu świata.

━━━━━━━━━━━━━━━━━━━━

**26. Czego na razie nie dodawać**

- kolejnej samodzielnej minigry bez związku z nauką, ekonomią lub fabułą;
- dużego otwartego czatu, jeśli Discord pozostaje głównym miejscem rozmów;
- ciężkiego świata 3D — obecna estetyka ksiąg, map i artefaktów jest bardziej charakterystyczna;
- rozbudowanej walki czasu rzeczywistego, która zmieni portal w inną kategorię produktu;
- kilkunastu nowych walut lub surowców bez wyraźnego zastosowania;
- losowych efektów tylko dla widowiska;
- automatycznie odtwarzanego, głośnego ambientu;
- kolejnych ekranów administracyjnych bez wspólnego kalendarza i reżysera;
- pełnego rynku spekulacyjnego, który przesłoni społeczny i szkolny charakter projektu;
- mechanik wymagających codziennego logowania pod groźbą utraty postępu.

━━━━━━━━━━━━━━━━━━━━

**27. Ostateczna rekomendacja**

Cytadela ma już szerokość dużego produktu. Teraz potrzebuje przede wszystkim **głębi, pamięci i połączeń**.

Najlepszy następny krok koncepcyjny to nie „jeszcze jedna komnata”, lecz wdrożenie trzech filarów:

1. **Żywy stan świata** — czas, pogoda, wydarzenie i konsekwencje widoczne wszędzie.
2. **Saga postaci i Zakonu** — trwała pamięć tego, co gracze zrobili.

===== WIADOMOŚĆ 22/22 =====
3. **Reżyser wydarzeń** — narzędzie, które pozwoli administracji wykorzystywać wszystkie obecne moduły do opowiadania jednej historii.

Gdy te filary połączą lekcje, mapę, pocztę, rynek, bank, warsztat, gazetę i Discord, strona przestanie sprawiać wrażenie kolekcji bardzo dobrych atrakcji. Zacznie sprawiać wrażenie miejsca, które istnieje również wtedy, gdy użytkownik właśnie na nie nie patrzy.

> **Najmocniejsza wizja Cytadeli:** nie portal z funkcjami, lecz szkoła z pamięcią.

