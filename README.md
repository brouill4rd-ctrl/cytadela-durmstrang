# Twierdza Magii Durmstrang

Portal szkoły fabularnej z panelem ucznia i profesora, dziennikami, zadaniami,
egzaminami, pocztą, CMS-em oraz integracją z Discordem. Frontend działa w React,
API w Express, a dane są przechowywane lokalnie w SQLite.

## Uruchomienie lokalne

Wymagany jest Node.js 22 lub nowszy.

1. Zainstaluj zależności: `npm ci`.
2. Skopiuj `.env.example` do `.env` i uzupełnij co najmniej `JWT_SECRET`.
3. Uruchom frontend i API poleceniem `npm run dev:full`.
4. Otwórz `http://localhost:5173`.

Pierwsze konto administratora można utworzyć przez zmienne
`BOOTSTRAP_ADMIN_*`. Hasło musi mieć co najmniej 12 znaków i spełniać politykę
opisaną przez komunikat startowy. Po udanym uruchomieniu usuń
`BOOTSTRAP_ADMIN_PASSWORD` ze środowiska.

Dane demonstracyjne są domyślnie wyłączone. Lokalnie można ustawić
`SEED_DEMO_USERS=true` oraz bezpieczne `DEV_SEED_PASSWORD`. Nie wolno tego robić
w środowisku produkcyjnym.

Jeżeli start wykryje historyczne hasła demonstracyjne, ustaw jednorazowo
`ROTATE_WEAK_PASSWORDS=true`. Każde takie hasło zostanie zastąpione innym,
losowym sekretem, aktywne sesje wygasną, a użytkownicy będą musieli odzyskać
hasło lub otrzymać nowe od administratora. Po operacji ponownie ustaw `false`.

## Najważniejsze polecenia

- `npm run dev:full` — frontend i API w trybie deweloperskim,
- `npm test` — komplet testów serwera,
- `npm run build` — build produkcyjny,
- `npm start` — uruchomienie API i zbudowanego frontendu,
- `npm run discord:sync` — synchronizacja komend Discord.

Przed wdrożeniem uruchom `npm test`, `npm run build` i
`npm audit --omit=dev`. Te same kontrole wykonują się automatycznie w GitHub
Actions.

## Wdrożenie

W produkcji ustaw co najmniej:

- `NODE_ENV=production`,
- silny, unikalny `JWT_SECRET`,
- dokładne domeny w `CORS_ORIGIN`,
- `APP_URL` i `FRONTEND_URL`,
- ustawienia SMTP,
- `EMAIL_OUTBOX_ENABLED=true`, jeżeli aplikacja ma automatycznie ponawiać
  oczekujące i nieudane wiadomości,
- tokeny Discord tylko wtedy, gdy bot ma działać.

Endpoint `GET /api/health` sprawdza zarówno proces aplikacji, jak i połączenie z
bazą. Kod HTTP 200 oznacza gotowość, a 503 problem z bazą.

## Dane i kopie zapasowe

Baza `server/durmstrang.db`, jej pliki WAL/SHM, katalog uploadów oraz `.env` nie
mogą trafiać do repozytorium. Zawierają dane użytkowników i sekrety.

Przed kopią bazy zatrzymaj aplikację albo użyj bezpiecznego mechanizmu backupu
SQLite. Kopiuj razem:

- `server/durmstrang.db`,
- `server/uploads/`,
- bezpiecznie przechowywaną konfigurację środowiska.

Regularnie sprawdzaj odtworzenie kopii w oddzielnym środowisku. Samo istnienie
pliku backupu nie gwarantuje, że jest użyteczny.

## Bezpieczeństwo

Nie dodawaj sekretów do kodu ani historii Git. Po podejrzeniu wycieku natychmiast
unieważnij tokeny Discord/SMTP, zmień `JWT_SECRET` i hasła. Szczegóły znajdują się
w [SECURITY.md](SECURITY.md).
