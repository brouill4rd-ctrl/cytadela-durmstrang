# KOMPLEKSOWY AUDYT TECHNICZNY — TWIERDZA MAGII DURMSTRANG

**Data audytu:** 29 sierpnia 2026 r. (Europe/Warsaw)  
**Repozytorium:** `C:\Users\msici\Documents\durmstrang`  
**Punkt odniesienia:** commit `b7e9d0bf0b00975630f3a8dd15a0138039b5ab4c` (`3.8`, 2026-08-29 13:29:56 +0200) oraz bieżąca, niezacommitowana zmiana `server/discordBot.js` obecna o 13:41.  
**Zakres:** pełny kod frontendowy i backendowy, konfiguracja, skrypty uruchomieniowe, baza SQLite, testy, statyczne zasoby oraz dokumentacja techniczna.  
**Zasada audytu:** kod projektu nie został zmieniony. Testy mogące zapisywać bazę uruchomiono na odizolowanej kopii. Jedynym utworzonym plikiem projektu jest niniejszy raport.

---

## 1. Werdykt wykonawczy

### Werdykt: **NIE WDRAŻAĆ NA PRODUKCJĘ**

Projekt jest rozbudowanym i wizualnie spójnym prototypem/projektem wewnętrznym z kilkoma dobrze zaprojektowanymi, nowymi mechanikami serwerowymi. Nie jest jednak gotowy do publicznego wdrożenia. Główna przyczyna nie leży w jakości grafiki ani liczbie funkcji, lecz w granicach zaufania: kilka starszych endpointów przyjmuje od klienta wynik, nagrodę, użytkownika albo źródło operacji jako prawdę. Zalogowany użytkownik może samodzielnie tworzyć walutę i punkty, a część integracji Discord jest dostępna bez uwierzytelnienia. W repozytorium znajduje się ponadto śledzona baza z aktywną konfiguracją Discord oraz danymi użytkowników.

Minimalna liczba ustaleń o istotnym wpływie:

| Poziom | Liczba | Znaczenie |
|---|---:|---|
| **CRITICAL** | **11** | blokują każde publiczne wdrożenie |
| **HIGH** | **22** | wymagają zamknięcia przed testem z realnymi użytkownikami |
| **MEDIUM** | **17** | istotne dla stabilności, utrzymania i skalowania |
| **LOW** | **9** | dług techniczny i porządkowy |

### Ocena gotowości

| Obszar | Ocena / 10 | Komentarz |
|---|---:|---|
| Backend i API | 3.0 | szeroki zakres funkcji, lecz nierówne RBAC i walidacja domenowa |
| Frontend i UX | 4.0 | bogaty interfejs i deep-linki, ale krytyczne błędy hooków, wielki bundle i monolityczny stan |
| Bezpieczeństwo | 1.0 | znane sekrety/fallback JWT, niezabezpieczone mutacje i możliwość fałszowania nagród |
| Baza i integralność danych | 3.5 | aktualna baza przechodzi kontrolę integralności, lecz migracje i backup są ryzykowne |
| Testy i niezawodność | 4.0 | 117 testów przechodzi, ale pokrywają głównie nowe gry/usługi, nie granice HTTP/RBAC |
| Wydajność | 3.0 | działający build, lecz 2,59 MB JS, 345 KB CSS, duże obrazy i agresywny polling |
| Utrzymywalność | 2.5 | pliki po kilka tysięcy linii, 134 tabele i brak wersjonowanych migracji |
| Operacyjność | 2.0 | brak health/telemetrii klasy produkcyjnej, lockfile, konteneryzacji i procedury bezpiecznego restore |
| **Łącznie** | **2.7 / 10** | **zaawansowany prototyp, nie system produkcyjny** |

### Najmocniejsze strony

- Nowe mechaniki: Bestiariusz, Ucieczka z Lochu, Runiczne Pojedynki, Szermierka Różdżką, Połów i Ekspedycje stosują serwerowy stan, idempotencję, limity dobowe i/lub replay akcji.
- Centralne usługi punktów i Skirnirów używają transakcji SQLite oraz kluczy idempotencji.
- Hasła w aktualnej bazie są zapisane jako hashe bcrypt (9/9 kont), a middleware po weryfikacji tokenu ponownie pobiera użytkownika i rolę z bazy.
- `PRAGMA foreign_keys=1`, `integrity_check=ok`, `quick_check=ok`, brak naruszeń kluczy obcych w aktualnym pliku bazy.
- Zapytania SQL są zwykle parametryzowane. Dynamiczne nazwy tabel/kolumn w eksploratorze administratora są sprawdzane względem schematu; nie potwierdzono tam SQL injection.
- Frontend ma obsługę hash-routing, odświeżania, back/forward i bezpośrednich odnośników do wielu widoków.
- Pełny build produkcyjny działa, kontrola składni 74 plików serwerowych przechodzi, a pełny zestaw 117 testów przechodzi na izolowanej kopii.

---

## 2. Metodyka i wiarygodność

Wykonano:

1. Inwentaryzację wszystkich plików, zależności, skryptów, tras i dużych modułów.
2. Statyczny przegląd całego backendu, wszystkich 41 modułów tras i 383 deklaracji endpointów.
3. Przegląd warstw auth, RBAC, punktów, waluty, Discord, uploadów, egzaminów, prac domowych, nieobecności, gazetki, świata i mechanik gry.
4. Przegląd frontendu: `App`, konteksty, klient API, widoki, modale, renderowanie HTML, nawigacja, polling i zasoby.
5. Odczyt bazy SQLite w trybie read-only: 134 tabele, 24 jawne indeksy, role/statusy, integralność, hashe i obecność konfiguracji Discord.
6. `node --check` dla 74 plików `.js` backendu — bez błędów składni.
7. Pełny `node --test server/*.test.js` na kopii projektu/bazy — **117 passed, 0 failed**.
8. Produkcyjny build Vite w katalogu tymczasowym — zakończony powodzeniem.
9. `npm audit --omit=dev` — **0 znanych podatności** w chwili audytu (321 zależności rozwiązanego drzewa; brak lockfile oznacza, że wynik nie jest w pełni odtwarzalny).
10. Przegląd śledzonych sekretów i artefaktów operacyjnych. Nie wykonano pełnego skanowania całej historii Git narzędziem typu TruffleHog/Gitleaks ani testu penetracyjnego działającej instancji.

Klasy wiarygodności:

- **POTWIERDZONE** — wynika bezpośrednio z kodu, schematu, bazy lub uruchomionego testu/builda.
- **PRAWDOPODOBNE** — silny wniosek ze ścieżki wykonania, ale bez aktywnego ataku na działającą instancję.
- **DO WERYFIKACJI** — zależy od hostingu, reverse proxy, danych historycznych lub zachowania środowiska zewnętrznego.

---

## 3. Mapa architektury

```text
Przeglądarka (React 19, Vite, SPA z hash-routingiem)
  ├─ App.jsx — ręczny przełącznik widoków, wszystkie widoki importowane eager
  ├─ SchoolContext.jsx — użytkownicy, auth, większość domen, cache localStorage, polling
  ├─ WorldStateContext / BeltContext / SoundContext
  ├─ api.js — jeden klient fetch, Bearer JWT z localStorage
  └─ 120 komponentów/widoków JSX + 8 plików CSS
          │
          │ /api/*, /uploads/*
          ▼
Express 5 (`server/index.js`)
  ├─ 41 routerów / 383 deklaracje tras
  ├─ middleware JWT + role
  ├─ Discord bot / standalone bot / SMTP
  ├─ domenowe usługi: points, Skirnir, bestiary, dungeon, runic duel, orders
  └─ better-sqlite3
          │
          ▼
`server/durmstrang.db`
  ├─ 134 tabele
  ├─ schemat, seedy i migracje wykonywane przy imporcie/startupie
  ├─ denormalizowane JSON-y oraz salda/cache obok ledgerów
  └─ konfiguracja Discord i dane użytkowników w śledzonym pliku Git
```

### Rzeczywisty podział odpowiedzialności

- **Frontend:** jeden duży provider `SchoolContext` jest jednocześnie klientem danych, cache'em offline, magazynem domenowym, warstwą auth i systemem nawigacji. 85 plików konsumuje `useSchool`.
- **Backend:** `server/index.js` montuje routery, lecz `server/db.js` łączy definicję schematu, migracje, seedy, serializery i część logiki domenowej.
- **Dane:** nowa księga punktów i księga Skirnirów są źródłem prawdy, ale `users.points`, `users.currency` i `bank_accounts.balance` są równoległymi cache'ami przeliczanymi przy starcie.
- **Integracje:** bot Discord działa w tym samym procesie co API lub osobno przez `bot_standalone.js`. Konfiguracja pochodzi częściowo z env, częściowo z DB.

### Główne zależności architektoniczne

| Źródło | Zależni konsumenci | Ryzyko |
|---|---|---|
| `SchoolContext.jsx` | 85 komponentów/widoków | szerokie rerendery, trudne testowanie, efekt domina |
| `server/db.js` | niemal wszystkie routery i usługi | import może migrować/seedować realną bazę |
| `users.points/currency` | UI, rankingi, bank, rynek | rozjazd z ledgerem przy częściowym błędzie |
| JWT w `localStorage` | cały klient API | każde XSS przejmuje sesję |
| publiczne `/uploads` | Discord i prace domowe | wspólna domena z aplikacją zwiększa wpływ złośliwego pliku |

---

## 4. Ustalenia CRITICAL — blokery wdrożenia

### C-01 — Stały, publicznie znany fallback JWT

**Status: POTWIERDZONE**  
**Pliki:** `server/middleware/auth.js:4`, `server/routes/auth.js:12`, `server/routes/gazette.js:128`

Gdy `JWT_SECRET` nie jest ustawiony, aplikacja używa stałego ciągu `durmstrang-cytadela-tajny-klucz-1294`. `.env.example` nie dokumentuje `JWT_SECRET`. Atakujący znający kod może wygenerować ważny token dla dowolnego `id`; middleware wprawdzie odczytuje realną rolę z DB, ale wystarczy znać/odgadnąć ID administratora, aby podpisać token tej osoby.

**Skutek:** pełne przejęcie konta i panelu administratora.  
**Naprawa:** usunąć fallback, wymusić minimum 256-bit sekret przy starcie, obrócić sekret, unieważnić stare tokeny, dodać `iss`, `aud`, `jti`, krótszy TTL i mechanizm sesji/rotacji.

### C-02 — Baza z sekretami i danymi użytkowników jest śledzona w Git

**Status: POTWIERDZONE**  
**Pliki:** `server/durmstrang.db`, `.gitignore`

Plik DB jest śledzony i występuje w historii wielu commitów. Zawiera 9 kont, hashe haseł, e-maile/profile oraz niepuste pola `discord_bot_config.bot_token` i `webhook_url`. Wartości nie są przytaczane w raporcie. `.gitignore` ignoruje WAL/SHM, ale nie samą bazę.

**Skutek:** kompromitacja bota/webhooka, danych osobowych i hashy; samo usunięcie z HEAD nie usuwa danych z historii.  
**Naprawa natychmiast:** unieważnić token bota i webhook, wygenerować nowe; usunąć DB z repo i historii (`git filter-repo`/BFG), dodać wzorzec DB do `.gitignore`, powiadomić współpracowników o konieczności świeżego clone, rozważyć reset haseł.

### C-03 — Niezalogowany użytkownik może mutować lekcje Discord i uploadować dowolne pliki

**Status: POTWIERDZONE**  
**Plik:** `server/routes/discord.js:130,227,313,345,644`

`/start-lesson`, `/post-message`, `/upload-attachment`, `/end-lesson` i ręczne `/verification/verify-manual` nie mają `requireAuth`. Upload Multer ma limit 25 MB, lecz brak `fileFilter`; zachowuje rozszerzenie, a `/uploads` jest serwowane statycznie z tej samej domeny. Plik `.html` może zostać otwarty jako aktywny dokument tej samej origin. Zakończenie lekcji pozwala pominąć `professorId`, obchodząc porównanie właściciela.

**Skutek:** fałszywe lekcje/transkrypcje, storage DoS, przejęcie kodu w origin aplikacji, kradzież JWT, przejęcie krótkiego kodu Discord.  
**Naprawa:** osobny HMAC/service token dla webhooków bota, auth+role dla symulatora, ścisła lista MIME i magic bytes, losowe nazwy bez rozszerzenia wykonywalnego, osobna domena/bucket z `Content-Disposition: attachment`, CSP i limity/rate limit.

### C-04 — Dowolny zalogowany użytkownik może sam wyemitować Skirniry

**Status: POTWIERDZONE**  
**Plik:** `server/routes/bank.js:324`

`POST /api/bank/deposit` pozwala właścicielowi konta podać dowolną dodatnią kwotę i kredytuje centralny ledger. Kontrola „self lub admin” nie rozwiązuje problemu, bo zwykły użytkownik nie powinien być emitentem własnej waluty.

**Skutek:** nieograniczony pieniądz, zakupy i zaburzenie gospodarki.  
**Naprawa:** endpoint wyłącznie admin/system; kwota i powód z serwerowego katalogu zdarzeń; stabilny klucz idempotencji; osobny endpoint dla operacji użytkownika typu transfer.

### C-05 — Dowolny zalogowany użytkownik może sam przyznawać punkty

**Status: POTWIERDZONE**  
**Plik:** `server/routes/lessons.js:489`

`POST /api/lessons/points/award` przyjmuje `points` 1–100 oraz opcjonalny klucz idempotencji od klienta. Klucz można pominąć lub zmieniać, więc żądanie można powtarzać bez limitu.

**Skutek:** pełna utrata wiarygodności rankingu Zakonów.  
**Naprawa:** usunąć publiczny „uniwersalny” award; każda gra ma rozliczać się przez własny serwerowy stan/replay, a operacje ręczne tylko przez audytowany endpoint administratora.

### C-06 — Warsztat ufa nagrodom przesłanym przez klienta

**Status: POTWIERDZONE**  
**Plik:** `server/routes/workshop.js:45–121`

`rewardPoints` i `rewardCurrency` są pobierane z body, nie mają górnego limitu, a klucz idempotencji zawiera `Date.now()`. `formulaId`, nazwa i runy nie są rozliczane na podstawie serwerowego katalogu.

**Skutek:** nieograniczone punkty i Skirniry jednym żądaniem.  
**Naprawa:** przyjmować wyłącznie ID receptury i akcje; wzór, koszt, wynik i nagrodę odczytywać/wyliczać na serwerze; unique `(user_id, formula_id, cycle)`.

### C-07 — Sekrety pozwalają tworzyć dowolne źródła nagród

**Status: POTWIERDZONE**  
**Plik:** `server/routes/secrets.js:27–79`

Endpoint przyjmuje dowolny `secretId` oraz klientowskie `points` i `currency`. Sprawdza tylko, czy ten sam użytkownik odkrył już ten sam identyfikator. Losowo/seryjnie tworzone ID umożliwiają nieskończone powtórzenia. Publiczny GET może zwrócić wszystkie odkrycia, jeśli nie podano użytkownika.

**Skutek:** emisja nagród i wyciek postępu.  
**Naprawa:** serwerowy katalog sekretów, podpisane jednorazowe wyzwanie albo walidacja stanu świata; nagrody tylko z katalogu; unique `(user_id, secret_id)`.

### C-08 — Legacy quests przyjmuje nagrodę i przedmiot od klienta

**Status: POTWIERDZONE**  
**Plik:** `server/routes/quests.js:212–344`

`rewardPoints`, `rewardXp`, `rewardGalleons` i `rewardItem` pochodzą z body. Duplikat jest blokowany tylko dla `(user, questId)` w kodzie aplikacji; dowolne nowe `questId` omija blokadę. Nowszy moduł ekspedycji w tym samym pliku jest znacznie bezpieczniejszy i powinien być wzorcem.

**Skutek:** punkty, XP, poziomy, waluta i dowolny ekwipunek.  
**Naprawa:** wycofać trasę legacy lub przełączyć ją na serwerowy katalog i zapisane próby; unique w DB; walidacja wszystkich zmian w jednej transakcji.

### C-09 — Zwykły uczeń może pobrać klucz odpowiedzi egzaminu

**Status: POTWIERDZONE**  
**Pliki:** `server/routes/exams.js:276–309`, `server/db.js:5611+`

`GET /api/exams/exams/:id` wymaga tylko zalogowania i serializuje pytania przez `dbQuestionToFrontend`, w tym `correctShortAnswers`, `fillGapsAnswers`, `explanation` oraz `options[].isCorrect`. Nie sprawdza statusu egzaminu, klasy, okna dostępu ani roli.

**Skutek:** pełne ujawnienie odpowiedzi przed egzaminem.  
**Naprawa:** dwa osobne endpointy/DTO: autorski z answer key tylko dla admina/właściciela przedmiotu oraz studencki przez `dbQuestionForStudentFrontend`, wyłącznie dla aktywnego podejścia należącego do użytkownika.

### C-10 — Stored XSS w czytniku gazetki

**Status: POTWIERDZONE**  
**Plik:** `src/views/GazetteFlipbook.jsx:260–276`

Treść akapitów jest przekształcana regexami i wkładana przez `dangerouslySetInnerHTML` bez escapowania i bez DOMPurify. Komentarz twierdzi, że nie ma „dangerous HTML”, lecz wejście nie jest oczyszczane. Ponieważ JWT jest w `localStorage`, XSS może przejąć sesję.

**Skutek:** wykonanie skryptu w przeglądarce czytelnika, kradzież tokenu i operacje jako ofiara.  
**Naprawa:** jeden centralny renderer oparty o DOMPurify z restrykcyjną listą tagów/atrybutów; najlepiej AST zamiast regex+HTML; CSP bez `unsafe-inline`; testy z payloadami XSS.

### C-11 — Import backupu może skasować dane i mimo błędów zatwierdzić częściowy restore

**Status: POTWIERDZONE**  
**Plik:** `server/routes/admin.js:214–295`

`restoreTable` wykonuje `DELETE FROM`, a następnie łapie błędy tabeli i kontynuuje. Wyjątek nie opuszcza transakcji, więc częściowy restore zostaje zatwierdzony i odpowiedź mówi o „100%”. `users` jest usuwane przed tabelami zależnymi przy włączonych FK, co może uruchomić kaskady. Backup obejmuje tylko podzbiór 134 tabel, nie ma wersji schematu, checksumy, dry-run ani walidacji kolumn.

**Skutek:** nieodwracalna, cicha utrata lub hybrydyzacja danych.  
**Naprawa:** natychmiast wyłączyć import w produkcji; backup na poziomie pliku SQLite/VACUUM INTO; restore offline do nowego pliku, integralność i migracja, potem atomowy swap; każdy błąd ma przerwać operację.

---

## 5. Ustalenia HIGH

| ID | Status | Ustalenie | Dowód / wpływ | Zalecenie |
|---|---|---|---|---|
| H-01 | POTWIERDZONE | Brak rate limitu logowania, rejestracji, podań, uploadów i publicznej analityki | brak middleware; możliwy brute force i DoS | globalny limiter + limity per konto/IP/trasa, kolejki dla ciężkich operacji |
| H-02 | POTWIERDZONE | Rejestracja i konta administracyjne dopuszczają domyślne hasło `123` | `auth.js:82`, `admin.js:42`; brak polityki siły | min. 12 znaków, zablokować znane hasła, wymusić zmianę hasła, bez defaultu |
| H-03 | POTWIERDZONE | JWT ważny 7 dni, bez revocation/refresh/rotacji, w `localStorage` | XSS przejmuje sesję na tydzień | sesja w `HttpOnly Secure SameSite` cookie lub krótki access token + rotowany refresh |
| H-04 | POTWIERDZONE | „Odzyskiwanie hasła” identyfikuje po loginie, nie czeka na API i pokazuje sukces po błędzie | backend wymaga admina; frontend od razu przechodzi do sukcesu | prawdziwy token e-mail, jednorazowy hash, TTL, neutralna odpowiedź anty-enumeracyjna |
| H-05 | POTWIERDZONE | Po udanym resecie frontend zapisuje nowe hasło plaintext w stanie użytkownika i localStorage | `SchoolContext.jsx:2953`, synchronizacja `durmstrang_users_db` | nigdy nie dodawać pola password do obiektu UI; wyczyścić istniejący cache |
| H-06 | POTWIERDZONE | Każdy zalogowany pobiera pełny katalog użytkowników | e-mail, backstory, wygląd, Discord ID/role, oceny/inventory trafiają też do localStorage | endpoint katalogowy z minimalnym DTO; profil prywatny self/admin; paginacja |
| H-07 | POTWIERDZONE | IDOR banku | każdy auth czyta/tworzy `/account/:userId`; `/transactions` bez userId zwraca globalne 100 | self/admin; nigdy nie twórz konta w GET; scope z `req.user.id` |
| H-08 | POTWIERDZONE | Loteria pozwala kupić los za cudze środki | `buy-ticket` nie porównuje body `userId` z `req.user.id`; publiczny GET ujawnia losy | ignorować body userId; admin osobną trasą; prywatne losy |
| H-09 | POTWIERDZONE | Losowanie można ponowić dla zakończonej rundy | brak twardej kontroli statusu/singleton active | transakcja `UPDATE ... WHERE status='active'`, unique częściowy/sentinel, lock |
| H-10 | POTWIERDZONE | Profesor może edytować/publikować/zamykać i oceniać cudzy egzamin | create ma ownership, większość późniejszych tras tylko role | wspólny middleware `requireExamOwnerOrAdmin` na wszystkich mutacjach i monitoringu |
| H-11 | POTWIERDZONE | Profesor może edytować/oceniać/zwracać cudzą pracę domową | delete sprawdza ownera, PUT/grade/return/exceptions/templates niekonsekwentnie | `requireHomeworkOwnerOrAdmin` i `requireSubmissionSubjectOwnerOrAdmin` |
| H-12 | POTWIERDZONE | Profesor może edytować i publikować cudzy dziennik | PUT/publish tylko rola; body może zmienić professorId i uczestników | właściciel z DB, pola profesora z `req.user`, blokada po publikacji |
| H-13 | POTWIERDZONE | Oceny przedmiotu są publiczne | `GET /api/subjects/:id/grades` bez auth zwraca studentów i komentarze | student: własne; profesor: własny przedmiot; admin: wszystkie; agregaty publiczne |
| H-14 | POTWIERDZONE | Wnioski o nieobecność ufają klientowskiemu `participantId` i linkom | student może oznaczyć cudzy rekord jako pending; profesor czyta dowolny wniosek po ID | wyprowadzać uczestnika z requester+lesson; transakcyjne ownership wszystkich linków |
| H-15 | POTWIERDZONE | Publiczny wykaz ukończonych questów/sekretów może zwrócić wszystkie rekordy | GET-y bez auth i bez filtra zwracają całość | auth+self, publicznie tylko anonimowe agregaty |
| H-16 | POTWIERDZONE | Drafty gazetki można listować publicznie przez `?status=draft` | `/gazette/issues` ufa filtrowi status bez auth | publiczny endpoint zawsze `published`; osobny staff endpoint |
| H-17 | POTWIERDZONE | Autorstwo i workflow gazetki są klientowskie | create przyjmuje `authorId/name`; staff może zmieniać status cudzych artykułów | autor z tokenu, ownership, jawna macierz przejść statusów |
| H-18 | POTWIERDZONE | Hnefatafl waliduje legalność ruchów, ale klient steruje obiema stronami | `aiSeed` zapisany przy starcie nie jest używany w replay; moveLog zawiera wszystkie ruchy | serwer generuje i weryfikuje ruchy AI z seedem lub prowadzi turę po turze |
| H-19 | POTWIERDZONE | Projekty Zakonów ufają ilości i źródłu wkładu | członek wysyła arbitralne `amount/sourceRef`; nic nie jest zużywane/weryfikowane | wkład tylko z serwerowego zdarzenia/ekwipunku; source wydany atomowo |
| H-20 | POTWIERDZONE | Cztery stale zamontowane modale łamią Rules of Hooks | `AuthModal`, `PasswordRecoveryModal`, `EmailInboxModal`, `NewsEditorModal` robią early return przed hookami | wszystkie hooki przed warunkowym return albo warunkowe montowanie w rodzicu; test UI |
| H-21 | POTWIERDZONE | Upload prac domowych opiera się na rozszerzeniu i base64 | brak magic bytes/AV/quota; 25 MB JSON może odrzucić base64 wcześniej; pliki w origin | multipart, MIME sniffing, AV, osobny bucket/origin, quota i retencja |
| H-22 | POTWIERDZONE | Eksplorator DB pozwala adminowi ominąć wszystkie reguły domenowe | CRUD dowolnej tabeli, w tym users, tokeny i ledgery | tylko read-only diagnostyka; mutacje przez domenowe komendy; step-up auth i pełny audit |

Dodatkowo: `PATCH /api/emails/:id/read` nie sprawdza odbiorcy; dowolny zalogowany może oznaczyć cudzy e-mail jako przeczytany. `raven` lepiej sprawdza ownership, ale zwykły użytkownik może wskazać odbiorcę „Wszyscy Kadeci”, co wymaga ograniczenia i antyspamu.

---

## 6. Ustalenia MEDIUM i LOW

### MEDIUM

| ID | Status | Ustalenie | Konsekwencja / naprawa |
|---|---|---|---|
| M-01 | POTWIERDZONE | CORS zezwala na każdy origin; w produkcji warunek sam akceptuje wszystko, a gałąź „odrzucona” też wywołuje `callback(null,true)` | allowlista, brak wildcard z credentials, testy preflight |
| M-02 | POTWIERDZONE | Brak Helmet/CSP/HSTS/referrer policy/permissions policy | dodać nagłówki; CSP jest szczególnie ważne przy localStorage JWT i HTML content |
| M-03 | POTWIERDZONE | Brak centralnego 404/error middleware i spójnego formatu błędów | trudna obserwowalność, część odpowiedzi dokleja `err.message` |
| M-04 | POTWIERDZONE | `.env.example` używa `PORT`, serwer czyta `SERVER_PORT`; nie dokumentuje JWT/CORS/NODE_ENV | spójny schemat env walidowany przy starcie |
| M-05 | POTWIERDZONE | Brak `package-lock.json` | build i audit nie są odtwarzalne; commit lockfile, `npm ci` |
| M-06 | POTWIERDZONE | Schemat/migracje/seedy wykonują się przy imporcie `db.js` | oddzielne wersjonowane migracje i komenda seed |
| M-07 | POTWIERDZONE | Implicit migration może wykonać `DROP TABLE homework_submissions` dla starszego schematu | zakaz destrukcyjnych migracji startupowych; kopia i migracja forward-only |
| M-08 | POTWIERDZONE | Brakuje unikalności m.in. `(user_id,secret_id)`, `(user_id,quest_id)`, `(user_id,list_id)`, numeru podejścia egzaminu | race condition mimo check-before-insert; dodać constraints |
| M-09 | POTWIERDZONE | 134 tabele, tylko 24 jawne indeksy; liczne zapytania po user/status/date/FK | analiza `EXPLAIN QUERY PLAN`, indeksy kompozytowe na rzeczywistych hot paths |
| M-10 | POTWIERDZONE | Ledgery i cache sald są przeliczane synchronicznie przy każdym starcie | dłuższy start i ukrywanie niespójności; ledger jako source of truth, kontrola offline |
| M-11 | POTWIERDZONE | Wiele N+1 w egzaminach, homework, absences, enrollments i serializers | batched JOIN/IN, agregaty SQL, paginacja |
| M-12 | POTWIERDZONE | `SchoolContext` ładuje wiele domen sekwencyjnie i polluje co 30 s | request storm, nakładające się żądania; query cache, invalidacja zdarzeniowa/SSE |
| M-13 | POTWIERDZONE | `apiFetch` nie ma timeoutu, cancellation, retry policy, dedupe ani globalnej obsługi 401 | AbortController, jawne klasy błędów, logout po 401, telemetry |
| M-14 | POTWIERDZONE | Gdy API zwraca pustą tablicę, część loaderów zachowuje stare dane localStorage | pusta odpowiedź musi nadpisywać cache; wersjonowanie/TTL cache |
| M-15 | POTWIERDZONE | Publiczne endpointy analityki/world/health mogą być spamowane lub ujawniają środowisko/stan | ograniczyć payload/akcje, rate limit, minimalny health |
| M-16 | POTWIERDZONE | Statystyki zapisów liczą `status='active'`, podczas gdy konta są `approved` | aktualna baza ma 9 approved i 0 active; wynik zapisów jest błędny |
| M-17 | POTWIERDZONE | Nieużywany `renderMarkdownLite` w `SubjectDetailView` ma XSS | obecnie brak wywołań; usunąć albo naprawić przed ponownym użyciem |

### LOW / porządkowe

- `scratch_check_thread.js` jest śledzonym skryptem diagnostycznym z konkretnym ID wątku i wypisuje rekordy lekcji/wiadomości.
- `server_out.txt` i `server_runtime_out.txt` są śledzonymi logami uruchomieniowymi (ok. 2 KB i 51 KB). Logi nie powinny trafiać do Git.
- Brak `README` produkcyjnego, instrukcji backup/restore, threat modelu, polityki retencji i runbooka incydentów.
- `concurrently` znajduje się w dependencies zamiast devDependencies.
- W API pozostała nieużywana metoda `checkShoppingLists`, dla której backend nie ma trasy.
- Wiele identyfikatorów powstaje z `Date.now()+Math.random`; preferowany `crypto.randomUUID()` i constraints.
- Duplikacja botów (`discordBot.js` i `bot_standalone.js`) zwiększa ryzyko rozjazdu zachowania.
- Nazwy/statusy domenowe są niespójne (`approved`/`active`, `teacher`/`professor`, `Skirniry`/literówki `skirnis`).
- Znaczna część stylowania inline utrudnia tematowanie, dostępność i testy wizualne.

---

## 7. Auth, role i granice uprawnień

### Co działa dobrze

- `requireAuth` wymaga Bearer tokenu, weryfikuje podpis, następnie pobiera użytkownika z DB i odrzuca niezatwierdzone konto.
- Rola z tokenu nie jest bezkrytycznie używana; aktualna rola pochodzi z DB.
- `requireSelfOrRole` i `requireSubjectOwnerOrAdmin` są dobrymi, reużywalnymi wzorcami.
- Hasła są hashowane bcrypt, a serializer użytkownika nie zwraca hasha.

### Co wymaga przebudowy

| Granica | Stan |
|---|---|
| Gość → użytkownik | brak rate limitu; słabe/defaultowe hasło; publiczne mutacje Discord |
| Użytkownik → inny użytkownik | users, bank, lottery, email-read, absences i część publicznych postępów mają IDOR/przeciek |
| Student → system nagród | bank, points, workshop, secrets i quests ufają klientowi |
| Profesor → inny profesor | exams, lessons, homework nie egzekwują konsekwentnie ownership przedmiotu/zasobu |
| Redaktor → inny redaktor | klientowskie autorstwo i zbyt szerokie przejścia statusu |
| Administrator → dane | panel ma pełny dostęp, ale backup i DB explorer omijają invariants i nie mają step-up auth |
| Integracja Discord → API | brak kryptograficznej tożsamości integracji |

### Zalecana macierz

- **Public:** tylko publikowane treści, katalogi, minimalny health, konfiguracja zapisów bez danych osób.
- **Student:** własny profil prywatny, własny bank/transakcje, własne podejścia, prace, poczta i nieobecności.
- **Profesor:** zasoby przypisanych przedmiotów; brak dostępu do domen innych profesorów poza jawnie współdzielonymi.
- **Redakcja:** własne artykuły; korekta/review przez przypisaną rolę; publikacja tylko redaktor naczelny/admin.
- **Admin:** operacje domenowe i raporty; backup/restore jako oddzielna, silniej chroniona operacja infrastrukturalna.
- **Service/Discord:** osobna tożsamość maszynowa, podpis żądania, timestamp, nonce i replay protection.

---

## 8. Baza danych i integralność

### Stan aktualnego pliku

| Kontrola | Wynik |
|---|---|
| Tabele użytkownika | 134 |
| Jawne indeksy z własnym SQL | 24 |
| `PRAGMA foreign_keys` | 1 |
| `integrity_check` / `quick_check` | `ok` / `ok` |
| `foreign_key_check` | 0 naruszeń |
| Konta | 1 admin, 3 profesorów, 5 studentów; wszystkie `approved` |
| Hashe bcrypt-like | 9/9 |
| Ujemne bieżące `users.points`, `users.currency`, `bank_accounts.balance` | 0 |
| Konfiguracja token/webhook Discord | niepusta — krytyczny sekret w repo |

### Grupy tabel

- **Tożsamość i komunikacja:** `users`, `pending_applications`, `emails`, `raven_messages`, `transactional_email_deliveries`, `discord_*`, `audit_logs`.
- **Nauka:** `subjects`, `teacher_subject_assignments`, `lessons`, `lesson_messages`, `lesson_participants`, `grades`, `grade_categories`, `timetable_entries`.
- **Homework/absences:** `homework_*`, `absence_*`.
- **Egzaminy:** `exam_*`, `questions`, `question_options`, `question_bank_categories`, `attempt_*`.
- **Ekonomia:** `point_transactions`, `point_audit_logs`, `bank_accounts`, `bank_transactions`, `teacher_salaries`, `store_items`, `shopping_lists`, `lottery_*`.
- **Treść:** `news`, `documents`, `cms_*`, `gazette_*`, `memory_*`, `events`.
- **Świat i postać:** `world_*`, `character_*`, `prologue_choices`, `secret_lineages`, `wand_resonance_events`, `order_*`.
- **Gry:** `bestiary_*`, `dungeon_escape_*`, `runic_duel_*`, `fishing_*`, `hnefatafl_runs`, `wand_fencing_runs`, `shooting_range_runs`, `oracle_rituals`, `expedition_attempts`, `completed_quests`, `discovered_secrets`, `crafted_formulas`.

### Najważniejsze problemy modelu

1. **Brak wersjonowanych migracji.** Schemat, `ALTER TABLE`, seedy i naprawy danych są wykonywane podczas importu modułu.
2. **Dwa źródła prawdy.** Ledger i cache w `users`/`bank_accounts` mogą się rozjechać. Recalculation przy starcie leczy objaw, nie przyczynę.
3. **JSON zamiast relacji.** `inventory`, legacy `grades`, runy, role Discord, opcje i inne tablice są w tekstowym JSON; trudniej walidować i indeksować.
4. **Niewystarczające constraints.** W wielu miejscach check-before-insert zastępuje unique constraint, co nie jest bezpieczne współbieżnie.
5. **Brak paginacji/retencji.** Audyty, wiadomości, analityka i historia gier będą rosnąć bez planu.
6. **Sekrety w DB.** Token Discord i webhook są plaintext; kopia admina eksportuje je wraz z hashami i PII.
7. **Testy importujące realną DB.** `belt.test.js` i `worldState.test.js` korzystają z `server/db.js`; zwykłe `npm test` może modyfikować bazę projektu. Audyt uruchomił je wyłącznie na kopii.

### Docelowa strategia

- `migrations/NNNN_name.sql` + tabela `schema_migrations`; jedna transakcja na migrację, backup przed destrukcyjną zmianą.
- `DATABASE_PATH` obowiązkowe per środowisko; testy dostają `:memory:` lub unikalny plik temp.
- Ledgery jako canonical source; cache salda aktualizowany w tej samej transakcji i okresowo porównywany przez job audytowy.
- Constraints i indeksy dla wszystkich kluczy domenowych; `CHECK` dla statusów, kwot i zakresów.
- Backup szyfrowany, poza repo, testowany automatycznym restore do nowego pliku.

---

## 9. API — audyt moduł po module

| Moduł | Ochrona / jakość | Najważniejsze ustalenie |
|---|---|---|
| `routes/absences.js` | mieszana | H-14: klientowski participant/link; professor IDOR; N+1 |
| `routes/admin.js` | cały router admin | C-11 backup; H-22 DB explorer; eksport zawiera sekrety/PII |
| `routes/auth.js` | login/register public | C-01, H-01/H-02; brak polityki haseł i ochrony brute force |
| `routes/bank.js` | mieszana auth/admin | C-04 i H-07; transfer lepszy, ale idempotencja z `Date.now()` |
| `routes/belt.js` | auth+self | sensowny model slotów; testy przechodzą |
| `routes/bestiary.js` | auth+self | bardzo dobry wzorzec: serwerowy stan, ownership, idempotencja |
| `routes/ceremony.js` | public read | mały, bez mutacji; akceptowalne po limitach/cache |
| `routes/cms.js` | public read/admin write | poprawne role; walidować URL/rozmiary tekstu |
| `routes/discord.js` | krytycznie mieszana | C-03; config chroniony, lecz lekcje/upload/manual verify nie |
| `routes/documents.js` | public read/admin write | sensowny podział; treść musi korzystać z jednego sanitizera |
| `routes/dungeonEscape.js` | auth+self | dobry serwerowy model, limity i idempotencja |
| `routes/emailPreview.js` | wyłączony w production | dobre fail-closed dla produkcji; upewnić się, że NODE_ENV jest walidowane |
| `routes/emails.js` | auth | read ograniczony przez zapytanie, ale mark-read bez ownership |
| `routes/enrollments.js` | public/auth/admin | M-16 statusy; aplikacje/assignment zasadniczo poprawne |
| `routes/events.js` | public read/admin write | poprawny kierunek; walidacja i paginacja do wzmocnienia |
| `routes/exams.js` | bardzo szeroki | C-09 i H-10; student attempts mają lepsze ownership niż authoring |
| `routes/fishing.js` | auth+self | serwer zapisuje sesje i limity; dobre testy reguł/granic |
| `routes/gazette.js` | public/staff | C-10 po stronie renderera, H-16/H-17; analytics public i bez limitu |
| `routes/hnefatafl.js` | auth+self | legalny replay, ale H-18: klient kontroluje ruchy AI |
| `routes/homework.js` | auth/role | H-11/H-21; rozbudowane audyty/wersje są plusem |
| `routes/houses.js` | public read/admin write | prosta, właściwa granica |
| `routes/lessons.js` | public/auth/role | C-05 i H-12; tworzenie ma ownership, edit/publish nie |
| `routes/locations.js` | public read/admin write | dane katalogowe; bez krytycznych ustaleń |
| `routes/lottery.js` | public/auth/admin | H-08/H-09; logika wypłat używa ledgera, lecz tożsamość/runda słabe |
| `routes/market.js` | public/auth/admin | zakup sprawdza self i saldo; potrzebna stabilna idempotencja i lepsze constraints |
| `routes/memory.js` | public/admin | duży moduł; ograniczyć payloady, dodać paginację i spójne uprawnienia draftów |
| `routes/news.js` | public read/role write | kierunek dobry; HTML tylko przez centralny sanitizer |
| `routes/oracle.js` | auth+self | nagroda losowana na serwerze, limit dzienny/tygodniowy; dodać unique w DB |
| `routes/orders.js` | auth/admin | H-19; council/visibility dobrze sprawdzają Zakon |
| `routes/prologue.js` | auth/self/admin | kolejność etapów i grant idempotentny; ogólnie solidny |
| `routes/quests.js` | mieszana | ekspedycje dobre, legacy C-08, publiczny completed leak |
| `routes/raven.js` | auth+self | ownership read/star/delete; zwykły użytkownik może broadcastować wszystkim |
| `routes/runicDuels.js` | auth+self | silny replay/akcje/idempotencja; testy przechodzą |
| `routes/secrets.js` | public/auth | C-07 i wyciek globalnego postępu |
| `routes/shootingRange.js` | auth+self | klient przesyła score/duration; serwer nie odtwarza gry, więc wynik fałszowalny |
| `routes/subjects.js` | public/owner/admin | H-13; write ownership jest dobry, ale dane autora/studenta częściowo z body |
| `routes/timetable.js` | public/auth/owner/admin | relatywnie spójne ownership cancel/restore; duży moduł i walidacja dat do testów |
| `routes/users.js` | auth/self/admin/public app | H-04–H-06; serializer bez hasha, lecz DTO jest zbyt szerokie |
| `routes/wandFencing.js` | auth+self | server replay i progi; dobry wzorzec |
| `routes/workshop.js` | public/auth | C-06 |
| `routes/world.js` | public read/admin write | whitelist pól i historia są dobrym wzorcem; walidować rozmiary tekstu/dat |

### Ryzyko SQL injection

**Nie potwierdzono klasycznego SQL injection** w przejrzanych ścieżkach. Większość wartości jest bindowana. Dynamiczne identyfikatory w DB explorerze są pobierane ze schematu i cytowane. Nie oznacza to braku potrzeby testów automatycznych; priorytetem są obecnie błędy autoryzacji i logiki biznesowej, które dają znacznie łatwiejsze przejęcie danych.

---

## 10. Frontend, stan, routing i UX

### Routing

`SchoolContext` implementuje parser hashy, inicjalizację widoku z URL, listener `hashchange` oraz synchronizację aktywnego widoku z `window.location.hash`. Działają ścieżki do dokumentów, katedr, lekcji, domów, zasad, gazetki, egzaminów, homework i Izby Pamięci. Stwierdzenie „brak deep-linków” byłoby nieprawidłowe.

Ryzyko polega na czym innym: routing jest ręczny i rozproszony między `SchoolContext`, `DocumentsCodexView`, `RulesGuideView`, `Footer`, `Navbar` i palette. Każdy nowy widok wymaga zmian w kilku switchach/mapach, brak automatycznej ochrony tras i not-found. Zalecany React Router lub mały, scentralizowany registry tras z guardami.

### Stan i synchronizacja

- `SchoolContext.jsx` ma ok. 3,8 tys. niepustych linii i odpowiada niemal za wszystko.
- Dane są jednocześnie w React state, localStorage i backendzie. „Fallback offline” często ukrywa błąd backendu i przedstawia stare dane jak aktualne.
- Katalog użytkowników, lekcje, ledger i inne wrażliwe dane są kopiowane do localStorage.
- Polling co 30 s pobiera wiele domen. Jeśli żądania trwają dłużej, interwały mogą się nakładać.
- Brak cache key/version/TTL, optimistic concurrency i globalnej invalidacji po mutacji.
- `switchUser` zmienia ID interfejsu bez wymiany tokenu, tworząc możliwość rozjazdu „kogo pokazuje UI” vs „kim jest API”. Backend zwykle ratuje tożsamość, ale UI może wprowadzać użytkownika/admina w błąd.

### Błędy React

`AuthModal`, `PasswordRecoveryModal`, `EmailInboxModal` i `NewsEditorModal` robią `if (!isOpen) return null` przed hookami, a rodzice renderują je stale z przełączanym `isOpen`. Przy przejściu zamknięty → otwarty liczba hooków zmienia się, co narusza Rules of Hooks i może wywołać „Rendered more hooks than during the previous render”. To powinien wykrywać ESLint `react-hooks/rules-of-hooks`, którego projekt nie ma.

### HTML/XSS

- `RichTextRenderer.jsx` używa DOMPurify — to właściwy kierunek.
- Opis katedry ma własny sanitizer DOMParser z allowlistą.
- `GazetteFlipbook.jsx` omija oba zabezpieczenia — aktywne C-10.
- `renderMarkdownLite` w `SubjectDetailView` jest obecnie nieużywany, ale niebezpieczny i może zostać przypadkowo przywrócony.
- Wiele źródeł URL obrazów/avatarów pochodzi od użytkownika. Należy ograniczyć protokoły/hosty, rozmiar i użyć proxy obrazów, jeśli prywatność ma znaczenie.

### Dostępność

Pozytywnie: istnieje kilka reguł `prefers-reduced-motion`, focus styles i atrybutów `aria-hidden`. Negatywnie:

- nie wszystkie animacje/canvas są objęte jednym ustawieniem reduced-motion;
- ikony i klikalne kontenery mają nierówną semantykę/etykiety;
- modale nie mają jednolitego focus trap, przywrócenia focusu i blokady scrolla;
- duża liczba efektów (śnieg, zorza, iskry, kursor, astrolabium) zwiększa koszt baterii/GPU;
- brak automatycznych testów axe/keyboard/contrast.

### Ocena UX stanów

| Stan | Ocena | Problem |
|---|---|---|
| Loading | nierówny | globalny start wykonuje dużo sekwencyjnych wywołań; część widoków nie ma skeletonu |
| Empty | ryzykowny | pusta odpowiedź bywa ignorowana na rzecz starego localStorage |
| Error | słaby | `apiFetch` zwraca wspólny fallback „backend unavailable”; brak kodów i retry UX |
| Offline | pozorny | cache istnieje, ale mutacje i autoryzacja nie mają prawdziwego modelu offline |
| Unauthorized | niespójny | guardy UI i backend nie są opisane jedną macierzą |
| Destructive admin | częściowy | część akcji ma `window.confirm`, ale backup restore nadal jest konstrukcyjnie niebezpieczny |

---

## 11. Wydajność i skalowalność

### Wynik builda

Build produkcyjny przeszedł. Główne artefakty:

| Artefakt | Rozmiar | Gzip |
|---|---:|---:|
| główny JS | 2 589,35 KB | 654,60 KB |
| CSS | 345,41 KB | 64,92 KB |
| vendor icons | 81,31 KB | — |
| vendor React | 3,90 KB | — |

Vite zgłasza chunk większy niż ustawiony próg 1 500 KB. `App.jsx` importuje wszystkie widoki i komponenty eager; manualChunks wydziela tylko React i ikony.

### Największe pliki kodu (niepuste linie)

| Plik | Linie |
|---|---:|
| `src/index.css` | 10 558 |
| `server/db.js` | 6 100 |
| `src/context/SchoolContext.jsx` | 3 766 |
| `src/views/AdminCMSView.jsx` | 3 316 |
| `src/views/TimetableView.jsx` | 2 276 |
| `src/views/AcademicView.jsx` | 2 060 |
| `server/discordBot.js` | ok. 1 650 plus bieżąca zmiana |
| `server/routes/homework.js` | 1 382 |
| `src/views/BankView.jsx` | 1 338 |
| `server/routes/memory.js` | 1 316 |
| `src/components/Navbar.jsx` | 1 306 |

### Zasoby

Największy obraz ma 4,66 MiB (`public/bloki/blok-kroniki_bestariusz.png`). Co najmniej 20 obrazów ma 2,2–3,23 MiB. Brak pipeline'u responsywnych wariantów WebP/AVIF, wymiarów docelowych i budżetu zasobów. `index.html` pobiera wiele rodzin/wag Google Fonts.

### Zalecenia wydajnościowe

1. `React.lazy`/dynamic import per główny widok i ciężki modal; osobne chunky gier, admina, pamięci i egzaminów.
2. Rozdzielić `SchoolContext` na auth/session, catalog, academics, economy, communications; użyć query cache.
3. Zastąpić polling invalidacją po mutacji, `visibilitychange`, backoff oraz SSE/WebSocket dla świata/Discord.
4. Dodać paginację/kursory do users, transactions, messages, audit, analytics i memory.
5. Optymalizować obrazy przy buildzie/uploadzie; `srcset`, width/height, lazy below fold, preload tylko LCP.
6. Self-host/subset fontów i ograniczenie wag.
7. Profilować SQLite przez `EXPLAIN QUERY PLAN`; dodać indeksy kompozytowe zamiast indeksowania „na ślepo”.
8. Budżety CI: np. initial JS gzip < 250 KB, initial CSS gzip < 50 KB, LCP asset < 300 KB.

---

## 12. Testy i jakość

### Wyniki

- **117/117 testów przeszło**, 0 failed/skipped/todo, pełny zestaw 13 plików.
- Testy uruchomiono na kopii `server`, `src` i DB w katalogu tymczasowym, ponieważ dwa testy importują realne `server/db.js`.
- **74/74 plików JS backendu** przeszło `node --check`.
- Build Vite: **success**.
- `npm audit --omit=dev`: **0 podatności** w rozwiązywanym drzewie na dzień audytu.

### Dobre pokrycie

- Bestiariusz: scoring, timeout, ownership, idempotencja, limity, wycieki odpowiedzi.
- Dungeon Escape: próby, limit, czas, ownership i nagrody.
- Runic Duel/Wand Fencing: replay, cooldowny, legalność, nagrody, idempotencja.
- Fishing: granice czasowe, loot, limity przynęt, Warsaw date.
- Ekspedycje, gender/gramatyka, ledger punktów i transakcyjne e-maile.

### Krytyczne luki testowe

Brakuje:

- testów HTTP/integracyjnych dla każdej trasy i roli;
- testów negatywnych IDOR/RBAC (student A → student B, professor A → subject B);
- testów auth brute force, token expiry/revocation i sekretu wymaganego przy starcie;
- testów XSS/sanitizacji i uploadów;
- testów bank/lottery/workshop/secrets/legacy quests pod kątem manipulacji klienta;
- testów backup/restore na pełnych 134 tabelach;
- testów frontendowych komponentów, Rules of Hooks, nawigacji i accessibility;
- E2E krytycznych ścieżek: register→approve→login, lesson→publish→points, exam, homework, bank, Discord;
- coverage threshold, lint, formatter i typecheck.

### Minimalna bramka CI

1. `npm ci` z lockfile.
2. ESLint + `react-hooks` + `no-danger`/wyjątki kontrolowane.
3. TypeScript albo co najmniej JSDoc + `tsc --checkJs` dla API/services.
4. Unit + integration HTTP na świeżej tymczasowej DB.
5. Frontend component tests + Playwright E2E + axe.
6. Gitleaks/TruffleHog, dependency audit i SAST.
7. Build + budżet bundle/assets.
8. Automatyczny backup i restore smoke test.

---

## 13. Obserwowalność i operacje

Aktualnie dominują `console.log/error`, bez request ID, użytkownika/roli, statusu, czasu trwania i ustrukturyzowanego formatu. Brakuje metryk, tracingu, alertów i rozdzielenia logów aplikacji od logów audytowych.

Minimum produkcyjne:

- logger JSON z redakcją tokenów, haseł, e-maili i payloadów;
- request/correlation ID zwracany klientowi;
- metryki: latency/error per route, DB busy/size, event loop, kolejki mail/Discord, liczba failed ledger operations;
- alerty: auth spikes, reward anomalies, duplicate idempotency, backup failure, Discord disconnect;
- `/health/live` bez danych środowiska i `/health/ready` sprawdzający DB/migracje;
- graceful shutdown z zatrzymaniem nowych żądań, dokończeniem transakcji i zamknięciem bota;
- retencja/audyt: osobne, append-only logi bezpieczeństwa poza edytowalnym DB explorerem.

---

## 14. Plan naprawczy

### Faza 0 — natychmiast, przed dalszym udostępnianiem (0–24 h)

1. Wyłączyć publiczny dostęp do instancji lub ograniczyć VPN/allowlistą.
2. Obrócić token Discord, webhook, JWT secret i wszystkie inne sekrety, które mogły znaleźć się w DB/logach/historii.
3. Usunąć `server/durmstrang.db` i logi z Git oraz przepisać historię; poinformować wszystkich posiadaczy clone.
4. Zablokować trasy C-03–C-08 i C-09 do czasu naprawy.
5. Wyłączyć backup import i mutacyjny DB explorer.
6. Wymusić start fail-closed bez `JWT_SECRET`, z poprawnym `NODE_ENV` i `SERVER_PORT`.

### Faza 1 — granice bezpieczeństwa (1–5 dni)

1. Jedna macierz RBAC/ownership i middleware per domena.
2. Naprawić exam DTO, bank/lottery/users/absences/email IDOR.
3. Service auth dla Discord, bezpieczny upload na osobnej origin.
4. Centralny sanitizer i CSP; usunąć wszystkie niesanitowane renderery.
5. Rate limiting, polityka haseł i prawdziwy reset przez e-mail.
6. Naprawić cztery modale Rules of Hooks.
7. Usunąć dane domenowe i hasło z localStorage; dodać poprawną obsługę 401.

### Faza 2 — integralność i testy (1–2 tygodnie)

1. Versioned migrations i `DATABASE_PATH` per środowisko.
2. Unique/check/FK/index constraints dla kluczy biznesowych.
3. Wycofać uniwersalne endpointy nagród; server-authoritative state we wszystkich grach.
4. Integration tests dla 383 tras z macierzą public/student/professor/admin/service.
5. Lockfile, `npm ci`, lint, typecheck, E2E, secret scan.
6. Bezpieczny backup/restore do nowej DB z kontrolą integralności.

### Faza 3 — frontend i wydajność (2–4 tygodnie)

1. Lazy routes/chunks, podział `SchoolContext`, query cache i anulowanie fetchy.
2. Paginacja i eliminacja N+1.
3. Pipeline WebP/AVIF, font subset i budżety CI.
4. Ujednolicone loading/empty/error/offline oraz focus/accessibility.

### Faza 4 — operacyjność (4–8 tygodni)

1. Staging z anonimowymi danymi, migration rehearsal i load test.
2. Monitoring, alerty, logi strukturalne, backupy szyfrowane i okresowe restore drills.
3. Threat model, runbook incydentu, polityka retencji/RODO i procedura rotacji sekretów.
4. Canary/blue-green deploy i rollback sprawdzony w praktyce.

---

## 15. Pierwsze 10 zmian, które powinien zrobić lead developer

1. **Sekrety i historia:** obrócić Discord/JWT/webhook, usunąć DB z historii i wymusić env fail-closed.
2. **Discord API:** zabezpieczyć wszystkie mutacje i upload service-tokenem/HMAC; przenieść pliki poza origin.
3. **Zamknąć emisję nagród:** wyłączyć `bank/deposit`, `lessons/points/award`, legacy quests, workshop i secrets dla zwykłych użytkowników.
4. **Egzaminy:** rozdzielić DTO autora/studenta i dodać `requireExamOwnerOrAdmin` do wszystkich tras.
5. **Ownership:** wspólne middleware dla homework, lessons, bank, absences, email i lottery.
6. **Backup:** wyłączyć obecny restore; wdrożyć restore do nowego pliku z integrity check i atomowym swapem.
7. **XSS/sesja:** centralny sanitizer + CSP; usunąć JWT i dane użytkowników z localStorage.
8. **Auth:** rate limit, silne hasła, brak `123`, reset e-mail z jednorazowym tokenem i TTL.
9. **Test harness:** tymczasowa DB, testy HTTP/RBAC dla krytycznych tras, ESLint hooks i Playwright.
10. **Dopiero potem architektura/perf:** podział context/db.js, migracje, lazy loading, obrazy, polling i N+1.

**Jednoznaczna odpowiedź:** jeśli można wykonać tylko kilka zmian, pierwsze trzy muszą zatrzymać wyciek sekretów, niezabezpieczony Discord i fałszowanie ekonomii. Optymalizacja bundle'a przed tymi poprawkami nie zwiększa realnej gotowości produkcyjnej.

---

## 16. Indeks plik po pliku

Poniższy indeks obejmuje każdy istotny plik wykonywalny/konfiguracyjny. Pliki graficzne są ocenione grupami, ponieważ ich ryzyko jest wspólne (rozmiar/licencje/pipeline), a nie zależne od kodu.

### Root i konfiguracja

| Plik | Rola | Ocena / ustalenie |
|---|---|---|
| `package.json` | zależności/skrypty | brak lockfile, lint/typecheck/E2E/coverage; test domyślnie może dotknąć DB |
| `vite.config.js` | dev proxy/build | działa; manual chunks zbyt skromne, próg 1,5 MB maskuje bardzo duży main chunk |
| `index.html` | shell SPA/fonty | duży zestaw Google Fonts; brak CSP/meta security |
| `public/manifest.json` | PWA metadata | podstawowy manifest, brak service workera/cache strategy |
| `.env.example` | kontrakt konfiguracji | `PORT` vs `SERVER_PORT`; brak JWT_SECRET/CORS_ORIGIN/NODE_ENV |
| `start_all.bat` | dev start | prosty wrapper, brak walidacji env |
| `start_bot.bat` | bot start | uruchamia duplikowany standalone bot |
| `start_production.bat` | build/start | ustawia NODE_ENV dopiero po buildzie; brak migration/health/rollback |
| `scratch_check_thread.js` | debug DB | śledzony artefakt, konkretne ID, wypisuje treści z DB |
| `server_out.txt`, `server_runtime_out.txt` | logi | śledzone artefakty operacyjne; usunąć z Git |
| `server_err.txt`, `server_runtime_err.txt` | logi błędów | obecnie puste, nadal powinny być ignorowane |
| dokumenty `*.md` w root | specyfikacje/audyty/lore | wartościowe źródło produktu, ale nie zastępuje README/runbooka/migracji |

### Backend core, usługi i integracje

| Plik | Rola | Ocena / ustalenie |
|---|---|---|
| `server/index.js` | composition root | CORS all, 25 MB body, same-origin uploads, startup recalculation, brak Helmet/error middleware |
| `server/db.js` | schemat+migracje+seedy+serializery | monolit 6,1k niepustych linii; import ma skutki uboczne; destrukcyjne legacy migration |
| `server/middleware/auth.js` | JWT/RBAC | reread roli z DB dobry; krytyczny fallback JWT |
| `server/utils.js` | helpery | mały; preferować UUID i scentralizowane walidatory |
| `server/discordBot.js` | integracja Discord | duży, stan in-memory, mutuje lessons; w czasie audytu miał niezacommitowaną zmianę |
| `server/bot_standalone.js` | osobny bot | duplikacja komend/logiki i ryzyko rozjazdu z klasą główną |
| `server/worldState.js` | agregacja świata | whitelist/validation dobre; import DB i tabele utrudniają izolację testów |
| `server/expeditions.js` | reguły wypraw | serwerowo oceniane decyzje; dobry wzorzec dla legacy quests |
| `server/fishing.js` | reguły połowu | deterministyczne granice i nagrody; testy dobre |
| `server/orderService.js` | Zakony | visibility/council dobre; wkład nie dowodzi/nie zużywa źródła |
| `server/services/pointsService.js` | ledger punktów | transakcje/idempotencja/correction dobre; call sites obchodzą model |
| `server/services/skirnirService.js` | ledger waluty | dobre centralne credit/debit; bank/workshop/quests źle autoryzują emitenta |
| `server/services/bestiaryService.js` | Bestiariusz | jeden z najlepiej zaprojektowanych modułów; server state, ownership, concurrency tests |
| `server/services/dungeonEscapeService.js` | Loch | solidny state machine i rozliczenie |
| `server/services/runicDuelService.js` | Pojedynki | solidny replay/idempotencja/limits |
| `server/email/mailTransport.js` | transport SMTP/JSON | użyteczny tryb testowy; walidować production transport i timeouty |
| `server/email/emailTemplates.js` | szablony maili | centralizacja dobra; testować escaping danych użytkownika |
| `server/email/transactionalEmailService.js` | outbox/delivery | zapisuje diagnostykę i nie wycofuje konta po błędzie; dobry kierunek, brak workera/retry policy |
| `server/seed/locationsData.js` | seed lokalizacji | duży statyczny katalog; przenieść do jawnej komendy seed/versioned data |
| `server/utils/polishGender.js` | odmiana tekstu | mały, czysty i testowany |

### Testy backendu

| Pliki | Ocena |
|---|---|
| `bestiaryService.test.js`, `dungeonEscape.test.js` | bardzo dobre negatywne przypadki, ownership, limity, idempotencja |
| `runicDuelRules.test.js`, `runicDuelService.test.js`, `wandFencingRules.test.js` | szerokie reguły/replay/granice |
| `fishing.test.js`, `expeditions.test.js` | solidne granice i Warsaw date |
| `pointsService.test.js` | sprawdza staff/student i migrację ledgeru |
| `orders.test.js` | sprawdza duplicate source, ale używa zaufanego service call; nie wykrywa braku dowodu źródła na HTTP |
| `transactionalEmail.test.js`, `polishGender.test.js` | wartościowe testy jednostkowe |
| `belt.test.js`, `worldState.test.js` | przechodzą, ale importują produkcyjny `db.js`; muszą dostać temp DB |

### Frontend core i konteksty

| Plik | Rola | Ocena / ustalenie |
|---|---|---|
| `src/main.jsx` | bootstrap | standardowy React root/error boundary; mały |
| `src/App.jsx` | shell i view switch | wszystkie widoki eager; ręczny switch, stale montowane problematyczne modale |
| `src/api.js` | klient HTTP | jeden punkt integracji dobry; brak timeout/cancel/retry/401, JWT z localStorage |
| `src/index.css` | globalny design | 10,5k niepustych linii; spójny klimat, wysoki koszt i ryzyko kolizji |
| `src/context/SchoolContext.jsx` | globalny stan/API/routing/cache | największy hotspot frontendowy; localStorage PII, polling, szerokie rerendery |
| `src/context/WorldStateContext.jsx` | stan świata | reduced-motion i polling; skoordynować z query cache/visibility |
| `src/context/BeltContext.jsx` | skróty pasa | wydzielony kontekst jest dobrym kierunkiem |
| `src/context/SoundContext.jsx` | audio | wydzielony; upewnić się o user gesture, mute persistence i accessibility |
| `src/utils/legacyMarkdownToHtml.js` | migracja treści | musi być traktowany jako parser niezaufanego inputu i zawsze kończyć w sanitizerze |
| `src/utils/orderContext.js` | helper Zakonu | niewielki, domenowy helper; dobry kierunek |
| `src/utils/runeRecognition.js` | rozpoznawanie run | logika klientowska nadaje się do UX, nie do rozliczania nagrody |
| `src/game/hnefataflRules.js` | reguły wspólne | legalność dobra; serwer musi kontrolować AI, nie tylko replay obu stron |
| `src/game/runicDuelRules.js`, `wandFencingRules.js` | deterministyczne reguły | dobre współdzielenie/replay, testowane |

### Komponenty bezpieczeństwa i infrastruktury UI

| Plik | Ocena / ustalenie |
|---|---|
| `AuthModal.jsx` | H-20 hook order; duży formularz; brak silnej polityki hasła |
| `PasswordRecoveryModal.jsx` | H-04/H-05/H-20; obecny flow nie jest odzyskiwaniem tożsamości |
| `EmailInboxModal.jsx` | H-20; backend mark-read wymaga ownership |
| `NewsEditorModal.jsx` | H-20; bogaty edytor, dane muszą przejść sanitizer |
| `RichTextEditor.jsx`, `RichTextEditor.css` | Tiptap dobry kierunek; walidować linki/media i limity |
| `RichTextRenderer.jsx` | DOMPurify — dobry centralny wzorzec; zawęzić allowlistę/style/URI |
| `ErrorBoundary.jsx` | podstawowa ochrona; obecnie tylko reload/home, brak telemetry/correlation ID |
| `DatabaseExplorerPanel.jsx` | H-22; potężna, niebezpieczna operacyjnie konsola |
| `DiscordLessonSimulatorModal.jsx` | jawnie wykonuje realne mutacje; tylko admin/dev i zabezpieczony service API |
| `DiscordVerificationModal.jsx` | manual simulator rozszerza attack surface; ukrycie w UI nie jest ochroną |
| `CommandPaletteModal.jsx` | hooki przed return (poprawny wzorzec), lecz duplikowane mapowanie tras |
| `CustomPageEditorModal.jsx`, `NewsDetailModal.jsx`, `ProfileEditorModal.jsx` | walidacja długości/URL/HTML i jednolity modal a11y |

### Komponenty domenowe i wizualne

| Pliki | Ocena / ustalenie |
|---|---|
| `BestiaryModal*`, `DungeonEscapeModal`, `RunicDuelModal*`, `IceFishingModal*`, `TournamentGauntletModal*` | bogate UI; nowe backendy są mocne, lecz ciężkie komponenty powinny być lazy |
| `TargetPracticeModal*` | backend ufa score/duration — UI nie może być granicą bezpieczeństwa |
| `HnefataflModal` | klient generuje/odsyła cały move log; naprawić kontrolę AI na serwerze |
| `ExpeditionsModal`, `MarauderQuestModal` | ekspedycje bezpieczniejsze; Marauder legacy nie powinien wysyłać nagród |
| `RuneCalligraphyModal`, `AlchemicalCauldron`, `RuneWorkshopView` | klientowskie rezultaty nie mogą wyznaczać punktów/waluty |
| `ScandinavianLotteryModal`, `BlackMarketModal`, `ShoppingListsSection`, `ItemInspectorModal` | self ID musi pochodzić z tokenu; stabilna idempotencja zakupów/losów |
| `AccountsRosterBlock`, `AccountsRosterModal`, `StudentPassportModal`, `ProfileEditorModal` | ograniczyć publiczne DTO i PII; obraz/avatar przez bezpieczny URL policy |
| `AdeptBelt`, `OrderLifePanel`, `CommonRoomModal` | pas dobrze wydzielony; wkłady Zakonu wymagają serwerowego źródła |
| `Navbar`, `PortalLeftSidebar`, `PortalRightSidebar`, `Footer` | duplikują nawigację; Navbar 1,3k linii; registry tras i guardów |
| `AuroraCanvas`, `SnowCanvas`, `MaraudersMapCanvas`, `CitadelAstrolabe`, `TorchCursor`, `WandSparks`, `LivingHourglasses` | efektowne, ale wymagają centralnego reduced-motion/perf mode i pause offscreen |
| `MonumentalHero`, `CategoryBanner`, `HeraldicEmblems`, `WaxSeal`, `SubjectIcon`, `ItemPlaceholder`, `SecretRune` | prezentacyjne; obrazy i user URL wymagają optymalizacji/allowlisty |
| `GrimoireBook`, `OracleModal`, `PrologueAdminPanel`, `Homework*Modal/Widgets` | funkcjonalne, ale duże i ściśle związane z globalnym contextem |

### Widoki

| Plik/grupa | Ocena / ustalenie |
|---|---|
| `HomeView.jsx` | stale montuje `NewsEditorModal`; H-20; główny LCP zależny od dużych zasobów |
| `AdminCMSView.jsx` | 3,3k linii; backup/DB/world/CMS w jednym widoku; podzielić per domena |
| `AcademicView.jsx`, `SubjectDetailView.jsx` | duże; publiczne grades i dormant unsafe renderer; aktywny opis ma sanitizer |
| `JournalsListView.jsx`, `LessonDetailView.jsx`, `ProfessorJournalEditor.jsx` | editor wymaga serwerowego ownership i blokad stanu |
| `TimetableView.jsx` | 2,3k linii; wyodrębnić kalendarz, formularze i statystyki; testy timezone |
| `BankView.jsx`, `MarkethallView.jsx`, `RuneWorkshopView.jsx` | UI ufa szerokiemu API; ekonomia musi być server-authoritative |
| `ExamCenterView`, `ExamCreatorView`, `ExamTakingView`, `ExamResultView`, `ExamGradingView`, `ExamBankView` | kompletny produktowo zestaw; answer-key leak i ownership blokują użycie |
| `HomeworkCenterView`, `HomeworkDetailView`, `HomeworkCreatorView`, `HomeworkGradingView`, `HomeworkArchiveView`, `HomeworkCalendarView` | bogate workflow/wersje; backend cross-professor i upload wymagają naprawy |
| `GazetteView`, `GazetteArchiveView`, `GazettePanelView`, `GazetteFlipbook` | dobry produktowo workflow; draft leak, client author i stored XSS |
| `AbsenceChamberView`, `EnrollmentChamberView` | sensowne UI; backend participant IDOR i status active/approved |
| `DocumentsCodexView`, `RulesGuideView`, `LoreArchiveView` | hash deep-links działają; scentralizować routing/sanitizację |
| `HousesView`, `MapView`, `CeremonyView` | głównie prezentacja/katalog; duże zasoby i cache |
| `ProfileView`, `CharacterCreationModal`, `PrologueView*`, `TeacherPrologueView` | prologue backend solidny; ograniczyć PII/cache i rozmiary inputu |
| `RavenPostView` | ownership wiadomości lepsze niż e-mail; ograniczyć broadcast/spam |
| `MemoryMainView` + `views/memory/*` | szeroki moduł archiwalny; paginacja, payloady, podział bundle i admin ownership |
| `RestrictedAccessView` | UX guard pomocny, ale nigdy nie zastępuje backend RBAC |

### Dane statyczne frontendu

Pliki `src/data/*.js` (`seedUsers`, `seedStudents`, `seedSubjects`, `seedLessons`, `seedNews`, `seedBank`, `seedStore`, `seedLottery`, `seedSecrets`, `seedShoppingLists`, `seedTimetable`, `seedDocuments`, `seedEvents`, `seedHouses`, `seedLocations`, `seedLore`, `seedRunes`, `seedCeremonyQuestions`, `expeditionsData`, `iceFishingData`, `ancientRunesData`, bannery/grafiki/cele pasa) są użyteczne jako fallback/demo, ale tworzą ryzyko „dwóch rzeczywistości”: seed w JS i seed w SQLite. Dane produkcyjne powinny mieć jeden wersjonowany pipeline. `seedUsers`/`seedStudents` nie powinny zawierać realnych danych lub haseł.

### Zasoby publiczne i serwerowe

- `public/baner_przedmioty_katedry/*`, `banery_zakony/*`, `herby_zakony/*`, `bloki/*`, `edykty/*`, grafiki pojedynków/szermierki i hero: spójne wizualnie, ale wiele plików >2 MiB; potrzebne warianty responsywne i kompresja.
- `server/assets/*` duplikuje część `public`; ustalić właściciela i pipeline.
- Należy zweryfikować licencje/źródła wszystkich grafik, fontów i zewnętrznych URL przed produkcją — **DO WERYFIKACJI**.

---

## 17. Rzeczy do weryfikacji poza kodem

1. Czy reverse proxy wymusza HTTPS, HSTS, limity body, timeouty i rate limit — **DO WERYFIKACJI**.
2. Czy obecny token/webhook z DB są nadal aktywne — należy założyć kompromitację i obrócić bez sprawdzania przez użycie.
3. Czy historia Git była kiedykolwiek publiczna lub sklonowana poza zaufane urządzenia.
4. Czy SMTP/Discord mają minimalne scope i osobne konta produkcyjne.
5. Czy istnieją zewnętrzne backupy, jaka jest ich retencja/szyfrowanie i czy restore był testowany.
6. Rzeczywista liczba użytkowników równoległych, rozmiar DB po roku i wymagane SLA.
7. Podstawa prawna/retencja e-maili, backstory, Discord IDs, ocen i danych rekrutacyjnych.
8. Licencje obrazów, fontów, lore i znaków użytych w projekcie.
9. Zachowanie na Safari/iOS/low-end mobile i zgodność accessibility WCAG 2.2 AA.
10. Pełny secret scan całej historii i obrazów binarnych z Gitleaks/TruffleHog.

---

## 18. Kryteria „gotowe do produkcji”

Projekt można ponownie ocenić jako kandydata do wdrożenia dopiero, gdy:

- wszystkie C-01–C-11 są zamknięte i mają test regresji;
- żadna operacja nagrody nie ufa klientowskiemu score/amount/reward/source;
- macierz RBAC/ownership ma automatyczne testy dla każdej trasy;
- sekrety i DB nie są w Git ani frontendzie, a rotacja została zakończona;
- backup restore przechodzi na świeżej instancji bez utraty żadnej z 134 tabel;
- staging używa osobnej, zanonimizowanej DB i osobnych integracji;
- build jest odtwarzalny przez lockfile i CI;
- istnieją monitoring, alerty, backupy i rollback;
- test E2E krytycznych ścieżek oraz test bezpieczeństwa nie wykazują blockerów;
- wydajność mieści się w ustalonych budżetach i działa na urządzeniu mobilnym klasy średniej.

**Końcowy wniosek:** TMD ma wartościowy rdzeń produktu i kilka naprawdę dobrych, nowoczesnych mechanik domenowych, ale bezpieczeństwo jest nierówne między „nowymi” i „legacy” częściami. Najkrótsza droga do produkcji nie polega na przepisywaniu wszystkiego. Należy ustandaryzować starsze moduły na wzorcach już obecnych w Bestiariuszu, Runicznych Pojedynkach, Lochu, Szermierce i Ekspedycjach: serwerowy stan, ownership z tokenu, deterministyczny replay, limity, constraints i idempotentne rozliczenie w jednej transakcji.
