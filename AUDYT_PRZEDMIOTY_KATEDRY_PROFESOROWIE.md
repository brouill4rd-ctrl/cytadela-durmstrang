# AUDYT SYSTEMU PRZEDMIOTÓW, KATEDR I PROFESORÓW
## Twierdza Magii Durmstrang — Raport z 2026-08-26

---

## 1. PODSUMOWANIE WYKONAWCZE

System przedmiotów, katedr i profesorów jest **niespójny i zduplikowany** na wielu poziomach.
Istnieją **trzy równoległe, rozłączne mechanizmy** przypisywania profesorów do przedmiotów,
które mogą się wzajemnie wykluczać. Dane są denormalizowane — nazwy przedmiotów i profesorów
zapisane jako plain-text strings w ~8 tabelach. Rejestracja profesora omija system enrollments.
Hardcodowane listy w frontend zawierają błędne ID i nazwy.

**Wniosek**: Wymagana pełna przebudowa z jednym źródłem prawdy (tabela `teacher_subject_assignments`)
i eliminacją wszystkich hardcodowanych list.

---

## 2. STAN OBECNY — TRZY RÓWNOLEGŁE SYSTEMY PRZYPISAŃ

### System A: `subjects.professor_id` + `subjects.professor_name`
- **Lokalizacja**: `server/db.js` tabela `subjects` (linia 363)
- **Relacja**: 1:1 (jeden profesor na przedmiot)
- **Problem**: Nie obsługuje M:N. `professor_name` to plain string — rozjeżdża się z `users.full_name`

### System B: `users.taught_subject_ids` (JSON array)
- **Lokalizacja**: `server/db.js` tabela `users` (linia 24), kolumna `taught_subject_ids TEXT DEFAULT '[]'`
- **Relacja**: 1:N (jeden user → wiele subject IDs w JSON)
- **Problem**: JSON w SQLite — brak FK, brak integralności, brak historii

### System C: `professor_subject_applications` (tabela)
- **Lokalizacja**: `server/db.js` migracja (linia 1557)
- **Relacja**: M:N z workflow (pending/approved/rejected)
- **Problem**: Jedyny poprawny model, ale **całkowicie odłączony od rejestracji**

### Middleware sprawdza OBA systemy:
```
// server/middleware/auth.js — requireSubjectOwnerOrAdmin
if (req.user.taughtSubjectIds.includes(subjectId)) return next();  // System B
const subject = db.prepare('SELECT professor_id FROM subjects WHERE id = ?').get(subjectId);
if (subject && subject.professor_id === req.user.id) return next();  // System A
```

**RYZYKO**: Profesor może mieć uprawnienia w Systemie B ale nie w A, lub odwrotnie.

---

## 3. KRYTYCZNE NIESPÓJNOŚCI DANYCH

### 3.1 Błędne ID przedmiotów

| Lokalizacja | Błędne ID | Prawidłowe ID |
|---|---|---|
| `ExamCreatorView.jsx`, `ExamBankView.jsx` | `obrona-przed-czarna-magia` | `obrona-przed-ciemnymi-mocami` |
| `DiscordLessonSimulatorModal.jsx` | `eliksiry-i-destylacja` | `eliksiry` |
| Seed disabled (users) | `astronomia-i-zorze` | `astronomia` |
| Seed disabled (users) | `zielarstwo-i-toksyny` | `zielarstwo` |
| Seed disabled (users) | `eliksiry-i-destylacja` | `eliksiry` |

### 3.2 Błędne nazwy przedmiotów

| Lokalizacja | Błędna nazwa | Prawidłowa nazwa |
|---|---|---|
| `ProfessorJournalEditor.jsx` | Eliksiry i Destylacja Soli | Eliksiry i Toksyny |
| `server/routes/lessons.js` | Eliksiry i Destylacja Soli | Eliksiry i Toksyny |
| `RavenPostView.jsx` | Prof. Klaus Lindqvist (Eliksiry) | Prof. Astrid Vinter |

### 3.3 Hardcodowana lista katedr w rejestracji (AuthModal.jsx)

`DEPARTMENTS_LIST` zawiera tylko **6 z 21 przedmiotów**:
- `czarna-magia`, `eliksiry`, `liga-bojowa`, `starozytne-runy`, `astronomia`, `zielarstwo`

**PROBLEM**: `liga-bojowa` nie istnieje jako subject ID w bazie danych.
Profesor rejestrujący się na 15 z 21 przedmiotów nie ma takiej opcji.

### 3.4 Hardcodowane listy w ExamCreator/ExamBank

Tylko 5 przedmiotów w dropdownie:
- czarna-magia, eliksiry, starozytne-runy, zaklecia, obrona-przed-czarna-magia (BŁĘDNE ID!)

---

## 4. DENORMALIZACJA — NAZWY JAKO STRINGI

Następujące tabele przechowują `professor_name` i/lub `subject_name` jako plain text:

| Tabela | Kolumny zduplikowane |
|---|---|
| `lessons` | `subject_id`, `subject_name`, `professor_id`, `professor_name`, `professor_avatar` |
| `timetable_entries` | `subject_id`, `subject_name`, `subject_code`, `subject_icon`, `subject_category`, `professor_id`, `professor_name`, `professor_avatar` |
| `homework_assignments` | `subject_id`, `subject_name`, `professor_id`, `professor_name`, `professor_avatar` |
| `homework_submissions` | `subject_id`, `subject_name` |
| `exams` | `subject_id`, `subject_name`, `professor_id`, `professor_name` |
| `grades` | `subject_name` (brak!), `professor_id`, `professor_name`, `student_name` |
| `point_transactions` | `professor_id`, `professor_name`, `student_name` |
| `professor_subject_applications` | `professor_name`, `professor_avatar`, `subject_name` |
| `teacher_salaries` | `professor_name` |
| `news` | brak `subject_id` w ogóle |

**UWAGA**: Nie usuwamy tych kolumn — są potrzebne jako snapshot historyczny.
Ale INSERT/UPDATE musi pobierać dane z tabel źródłowych, nie z formularzy.

---

## 5. REJESTRACJA → ZATWIERDZANIE — PRZERWANY PIPELINE

### Obecny flow:
```
1. Profesor rejestruje się (AuthModal.jsx)
   → Wybiera z DEPARTMENTS_LIST (6 opcji, 1 błędna)
   → Frontend wysyła: taughtSubjectIds: [regDepartment]

2. Backend (auth.js linia 116):
   → taught_subject_ids = JSON.stringify(data.taughtSubjectIds || [data.department || 'czarna-magia'])
   → ZAPISUJE BEZPOŚREDNIO do users.taught_subject_ids
   → NIE tworzy professor_subject_applications

3. Admin zatwierdza (users.js linia 140-165):
   → UPDATE users SET status = 'approved', title = ?
   → NIE aktualizuje subjects.professor_id
   → NIE tworzy teacher_subject_assignment
   → NIE dotyka professor_subject_applications
```

### Wymagany flow:
```
1. Rejestracja → tworzy professor_subject_applications (status: pending)
   → NIE zapisuje taught_subject_ids
2. Admin zatwierdza usera → status = 'approved'
3. Admin zatwierdza application → teacher_subject_assignments (M:N join table)
   → Automatyczne wyprowadzenie taught_subject_ids z join table
   → Automatyczne ustawienie subjects.professor_id (jeśli jedyny profesor)
```

---

## 6. BRAKUJĄCE KONTROLE DOSTĘPU

| Endpoint | Problem |
|---|---|
| `POST /api/lessons` | Każdy profesor może tworzyć lekcje dla DOWOLNEGO przedmiotu |
| `PUT /api/lessons/:id` | Brak sprawdzenia ownership |
| `POST /api/homework` | Każdy profesor może tworzyć prace domowe dla dowolnego przedmiotu |
| `POST /api/exams` | Każdy profesor może tworzyć egzaminy dla dowolnego przedmiotu |
| `DELETE /api/subjects/:id` | Hard delete — brak ochrony przed osieroconymi ocenami/lekcjami |

---

## 7. DUAL SOURCE OF TRUTH (seedSubjects.js vs SQLite)

- `src/data/seedSubjects.js` — 21 przedmiotów z pełnymi lekcjami, hardcoded professor names
- `server/db.js` seed (linia 2200) — 21 tych samych przedmiotów w SQLite
- `SchoolContext.jsx` — ładuje static data → nadpisuje API data → fallback do static

**Problem**: Zmiana przedmiotu w bazie NIE zmienia go w seedSubjects.js i odwrotnie.

---

## 8. OFICJALNA LISTA PRZEDMIOTÓW vs STAN BAZY

### 14 oficjalnych przedmiotów (Rok I):
astronomia, biala-magia, czarna-magia, eliksiry, historia-magii, latanie,
magizoologia, numerologia, obrona-przed-ciemnymi-mocami, starozytne-runy,
transmutacja, wrozbiarstwo, zaklecia, zielarstwo

### 7 dodatkowych w bazie (Rok II):
klatwy-i-uroki, smokologia, rytualistyka, psychologia-magiczna,
trucizny, mity-polnocy, stworzenia-nocy

**Status**: 21 przedmiotów w bazie to poprawne zachowanie — 14 Rok I + 7 Rok II.
Wszytskie 21 muszą być dostępne w systemie.

---

## 9. PLAN NAPRAWY — PRIORYTETY

### P0: Integralność danych
- [x] Audyt zakończony
- [ ] Utworzyć tabelę `teacher_subject_assignments` (M:N join table)
- [ ] Migracja istniejących danych z trzech systemów do nowej tabeli
- [ ] Dodać FK i constraints

### P1: Assignments
- [ ] Podłączyć rejestrację do enrollment workflow (professor_subject_applications)
- [ ] Naprawić approve → automatyczne tworzenie assignment
- [ ] Usunąć bezpośredni zapis taught_subject_ids przy rejestracji

### P2: Frontend — hardcoded lists
- [ ] Zastąpić DEPARTMENTS_LIST w AuthModal dynamiczną listą z API
- [ ] Zastąpić hardcoded 5 przedmiotów w ExamCreator/ExamBank
- [ ] Naprawić defaults w ProfessorJournalEditor, DiscordLessonSimulatorModal
- [ ] Naprawić hardcoded professor names w RavenPostView

### P3: ID/nazwy
- [ ] obrona-przed-czarna-magia → obrona-przed-ciemnymi-mocami
- [ ] eliksiry-i-destylacja → eliksiry
- [ ] Eliksiry i Destylacja Soli → Eliksiry i Toksyny

### P4: Access control
- [ ] Dodać requireSubjectOwnerOrAdmin do lessons, homework, exams

### P5: News
- [ ] Dodać subject_id do tabeli news

### P6: Quality gate
- [ ] npm run build
- [ ] npm test
- [ ] Runtime verification

---

## 10. MODEL DOCELOWY

```
subjects (source of truth)
  ├── id, name, code, icon, category, description, classroom
  ├── banner_url, banner_gradient, syllabus, regulations
  ├── class_years, is_active, sort_order
  └── professor_id (convenience — primary professor, derived from assignments)

teacher_subject_assignments (M:N join table — NEW)
  ├── id, professor_id FK→users, subject_id FK→subjects
  ├── role (primary/assistant/substitute)
  ├── school_year, assigned_at, ended_at
  └── status (active/ended/on_leave)

professor_subject_applications (enrollment workflow — EXISTS)
  ├── professor_id, subject_id, status (pending/approved/rejected)
  └── → on approve → creates teacher_subject_assignments row

users.taught_subject_ids → DERIVED (computed from teacher_subject_assignments)
```
