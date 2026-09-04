# Bezpieczeństwo projektu

## Zgłaszanie problemów

Nie publikuj podatności ani danych użytkowników w publicznym zgłoszeniu. Przekaż
je prywatnie administratorowi wdrożenia, podając miejsce problemu, możliwy wpływ
i bezpieczny sposób odtworzenia.

## Reakcja na wyciek

Jeżeli baza, `.env`, log albo inny plik z sekretami znalazł się w repozytorium:

1. Natychmiast unieważnij i wygeneruj ponownie tokeny Discord, dane SMTP oraz
   wszystkie inne ujawnione klucze.
2. Zmień `JWT_SECRET`; spowoduje to wylogowanie aktywnych sesji.
3. Wymuś zmianę haseł kont, których skróty lub dane mogły wyciec.
4. Usuń plik z bieżącej wersji repozytorium.
5. Oczyszczenie całej historii wykonuj dopiero po utworzeniu kopii i uzgodnieniu
   tego z zespołem — operacja zmienia historię i wymaga ponownego sklonowania
   repozytorium przez wszystkich współpracowników.

Samo dodanie pliku do `.gitignore` nie usuwa go z wcześniejszych commitów i nie
unieważnia wykradzionych sekretów.

## Zasady wdrożenia

- Używaj HTTPS i ustaw `NODE_ENV=production`.
- Nadaj procesowi wyłącznie prawa potrzebne do bazy i katalogu uploadów.
- Przechowuj sekrety w menedżerze sekretów platformy, nie w repozytorium.
- Aktualizuj zależności po przejściu testów i audytu bezpieczeństwa.
- Monitoruj `/api/health`, błędy logowania, limity zapytań i nieudane wysyłki
  wiadomości.
- Wykonuj zaszyfrowane kopie zapasowe oraz regularne próby ich odtworzenia.
