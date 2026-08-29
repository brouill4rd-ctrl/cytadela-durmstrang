import { randomUUID } from 'crypto';
import { awardPoints } from './pointsService.js';
import { credit as creditSkirnir } from './skirnirService.js';

let _db;

// ===================== STAŁE =====================

export const DAILY_LIMIT = 2;
const MAX_DURATION_MS = 8 * 60 * 1000;
export const MAX_HP = 3;
export const MAX_HINTS = 2;
const HINT_PENALTY_MS = 45 * 1000;
const MASTER_TIME_MS = 4 * 60 * 1000;

export const GOLDEN_KEY_ITEM = {
  id: 'labirynt-zloty-klucz-pradawnych',
  name: 'Złoty Klucz Pradawnych',
  icon: '🗝️',
  rarity: 'legendary',
  category: 'artifact',
  price: 0,
  desc: 'Zdobyty przez pierwszego odkrywcę, który przeszedł przez wszystkie zagadki Labiryntu Tajemnic.'
};

// ===================== DANE ZAGADEK (nigdy nie trafiają do klienta) =====================

const RUNE_SYMBOLS = ['ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᛉ', 'ᛞ'];

export const RUNE_LEXICON = {
  'ᚦ': 'cierń · próg · niszczycielska siła · ochronny atak',
  'ᚨ': 'dech bogów · słowo · mądrość · boska inspiracja',
  'ᚱ': 'podróż · koło · ruch · zmiana losu',
  'ᚲ': 'ogień · żagiew · objawienie · przezwyciężenie ciemności',
  'ᛉ': 'tarcza · ochrona · strażnik · sięganie ku górze',
  'ᛞ': 'świt · przełom · granica dnia i nocy · wypełnienie'
};

const STAGE1_VARIANTS = [
  {
    solution: [0, 4, 5],
    inscription: 'Cierń i jego siła wywalczyły pierwszy próg. Ku górze sięgający strażnik strzeże serca zamknięcia. Przełom między nocą a dniem przypieczętuje kres.',
    hint: 'Pierwsze słowo kluczowe inskrypcji dotyczy przekraczania progu z niszczącą siłą. Środkowe — wzniesionej ochrony i strażnika. Ostatnie — granicy między dniem a nocą.'
  },
  {
    solution: [1, 3, 2],
    inscription: 'Boskie słowo i oddech bogów otwierają pierwsze wrota. Żagiew rozświetla środkowy mrok, objawiając ukryte. Koło i ruch obracają ostatni rygiel ku wyjściu.',
    hint: 'Trzy działania: mądrość i boski oddech na początku, ogień i przezwyciężenie ciemności w środku, podróż i ruch na końcu.'
  },
  {
    solution: [4, 0, 3],
    inscription: 'Ochronny strażnik sięgający ku górze zamykał pierwszy próg. Cierń i destrukcja były warunkiem serca labiryntu. Płomień objawia ostatnią pieczęć ciemności.',
    hint: 'W inskrypcji trzy figury: strażnik i tarcza są pierwsi, niszczycielska siła w środku, ogień i objawienie na końcu.'
  },
  {
    solution: [1, 2, 5],
    inscription: 'Mądrość bogów i boskie słowo prowadzą do pierwszych drzwi. Podróż i zmiana losu obracają środkowe zamknięcie. Świt i przełom domykają kres na wyjście.',
    hint: 'Trzy elementy: wiedza bóstw na początku, zmiana i ruch w środku, koniec nocy i nastanie dnia na końcu.'
  }
];

export const CONSTELLATIONS = [
  { id: 'polaris',    name: 'Gwiazda Nieporuszalna',        icon: '⭐' },
  { id: 'kruk',       name: 'Gwiazdozbiór Czarnego Posłańca', icon: '🦅' },
  { id: 'wilk',       name: 'Gwiazdozbiór Nocnej Bestii',   icon: '🐺' },
  { id: 'tarcza',     name: 'Gwiazdozbiór Wojownika',       icon: '🛡️' },
  { id: 'smok',       name: 'Gwiazdozbiór Ognistego Gada',  icon: '🐉' },
  { id: 'niedzwiedz', name: 'Gwiazdozbiór Wielkiego Łowcy', icon: '🐻' }
];

const STAGE2_VARIANTS = [
  {
    sequence: ['polaris', 'kruk', 'wilk', 'tarcza'],
    saga: 'Najpierw Gwiazda Nieporuszalna wskazała drogę wędrowcowi przez pustkowia nocy.\nPotem Czarny Posłaniec obwieścił zmianę losu na rozdrożu.\nW trzeciej strofie Nocna Bestia zawarczyła ostrzeżenie na mroźnym wrzosowisku.\nNa końcu Wojownik wzniósł tarczę, by osłonić wszystkich słabych.',
    hint: 'Saga: przewodnik nocy, posłaniec zmiany, nocne ostrzeżenie, obrońca słabych. Szukaj tych ról wśród gwiazdozbiorów.'
  },
  {
    sequence: ['smok', 'polaris', 'niedzwiedz', 'kruk'],
    saga: 'Najpierw Ognisty Gad nieba zatoczył krąg, zapowiadając wielką burzę.\nPotem Gwiazda Nieporuszalna wskazała północny azymut wędrowcom.\nW środku sagi Wielki Łowca wstał na tylne łapy, rządząc puszczą.\nCzarny Posłaniec zamknął pieśń, wyśpiewując koniec.',
    hint: 'Saga: ognisty zwiastun, gwiazdowy nawigator, leśny władca, czarny finał. Odczytaj role i dopasuj do gwiazdozbiorów.'
  },
  {
    sequence: ['tarcza', 'wilk', 'polaris', 'smok'],
    saga: 'Droga wyruszyła spod znaku Wojownika niosącego tarczę.\nPotem Nocna Bestia prowadziła przez mroczne ostępy puszczy.\nDalej Gwiazda Nieporuszalna dała im orientację i nadzieję.\nOgnisty Gad zatoczył ostatni krąg, domykając niebieski pierścień.',
    hint: 'Saga: obrońca na początku, nocny przewodnik, gwiezdny punkt odniesienia, ognisty zamknięcie. Kolejność wynika z opowieści.'
  },
  {
    sequence: ['niedzwiedz', 'kruk', 'tarcza', 'smok'],
    saga: 'Najpierw Wielki Łowca ruszył szlakiem wśród nocy polarnej.\nPotem Czarny Posłaniec przeleciał ponad szczytami ze wieścią.\nW trzeciej strofie Wojownik z tarczą osadził granicę między światami.\nOgnisty Gad domknął pierścień władców nieba ostatnim kręgiem.',
    hint: 'Saga: polujący leśny gigant, latający posłaniec, wojownik granicy, ognisty domknięcie. Chronologia zdarzeń z sagi.'
  }
];

const STAGE3_REAGENTS_DATA = {
  smocza_krew:    { name: 'Smocza Krew',             icon: '🩸', desc: 'Tłustawa, karmazynowa ciecz o intensywnym odorze siarki. Znana z właściwości korozyjnych wobec zakletych metali i stopów nordyckich.' },
  beryl_proszek:  { name: 'Sproszkowany Beryl',       icon: '💎', desc: 'Drobnoziarnisty proszek o błękitnym połysku. Minerał koncentrujący energię magiczną i wzmacniający reakcje runiczne.' },
  zwykla_woda:    { name: 'Zwykła Woda Źródlana',     icon: '💧', desc: 'Przezroczysta woda ze źródła górskiego. Czysta, bez właściwości alchemicznych ani korozyjnych.' },
  wilgotny_mech:  { name: 'Wilgotny Mech Borealny',   icon: '🌿', desc: 'Miękki mech z lasów borealnych. Stosowany w miksturach łagodzących, pozbawiony zdolności rozpuszczania metali.' },
  kwas_smoczy:    { name: 'Kwas Smoczy',               icon: '🧪', desc: 'Żółtozielony, dymiący płyn wydzielany przez smoki krystaliczne. Silnie reaguje ze stopami mroźnego żelaza, rozpuszczając je.' },
  rubin_proszek:  { name: 'Sproszkowany Rubin',        icon: '🔴', desc: 'Intensywnie czerwony proszek mineralny. Soczewkuje energię cieplną i magiczną, działając jako katalizator reakcji alchemicznych.' },
  popiól_runiczny: { name: 'Popiół Runiczny',          icon: '⚫', desc: 'Szary popiół z ognisk runicznych. Neutralizuje małe zaklęcia, ale nie rozpuszcza metali pradawnych.' },
  krew_feniksa:   { name: 'Krew Feniksa',              icon: '🔥', desc: 'Złoto-pomarańczowa ciecz o intensywnym blasku. Znana z topienia zakletych, pradawnych stopów i właściwości regeneracyjnych.' },
  szafir_proszek: { name: 'Sproszkowany Szafir',       icon: '🔷', desc: 'Niebieski proszek krystaliczny. Katalizator magiczny kondensujący energię żywiołów naturalnych.' },
  oliwa_zimna:    { name: 'Zimna Oliwa Górska',        icon: '🫙', desc: 'Bezwonna, przezroczysta oliwa z górskich ziół. Stosowana do smarowania i konserwacji, bez działania na metale.' },
  szlam_bagenny:  { name: 'Szlam Bagienny',            icon: '🟫', desc: 'Gęsty, ciemny szlam z bagien. Zbyt słaby na stopy mroźnego żelaza.' },
  runiczna_sol:   { name: 'Runiczna Sól',              icon: '🧂', desc: 'Kryształy soli nasyconej energią run. Stosowana jako konserwant magiczny, nie jako rozpuszczalnik metali.' }
};

const STAGE3_VARIANTS = [
  {
    solvent: 'smocza_krew', catalyst: 'beryl_proszek',
    inscription: 'Rygiel jest ze stopionego mroźnego żelaza, utwardzonego pradawnymi runami. Wymaga substancji zdolnej go rozpuścić — korozyjnej cieczy o intensywnym odorze zniszczenia. Następnie konieczny katalizator koncentrujący energię magiczną, wzmacniający reakcję runicznych wiązań.',
    reagentIds: ['smocza_krew', 'beryl_proszek', 'zwykla_woda', 'wilgotny_mech', 'popiól_runiczny', 'oliwa_zimna'],
    hint: 'Szukaj substancji o korozyjnym zapachu zdolnej topić zaklete metale, oraz minerału skupiającego magię jako katalizatora.'
  },
  {
    solvent: 'kwas_smoczy', catalyst: 'rubin_proszek',
    inscription: 'Pradawny stop nordyckiego żelaza mroźnego reaguje wyłącznie na środki kwasowe wywodzące się z istot smoczych — tylko takie mają siłę rozkładu. Następnie wymagany minerał soczewkujący energię, skupiający moc i utrwalający rozkład.',
    reagentIds: ['kwas_smoczy', 'rubin_proszek', 'zwykla_woda', 'szlam_bagenny', 'popiól_runiczny', 'oliwa_zimna'],
    hint: 'Szukaj dymiącego płynu smoczego jako rozpuszczalnika i czerwonego minerału skupiającego ciepło jako katalizatora.'
  },
  {
    solvent: 'krew_feniksa', catalyst: 'szafir_proszek',
    inscription: 'Zamek wymaga substancji o właściwościach transformacji i topnienia — takiej, która znana jest z regeneracyjnej mocy zdolnej przekształcać materie pradawne. Kataliza wymaga minerału kondensującego energię żywiołów.',
    reagentIds: ['krew_feniksa', 'szafir_proszek', 'wilgotny_mech', 'szlam_bagenny', 'runiczna_sol', 'oliwa_zimna'],
    hint: 'Szukaj cieczy o blasku i mocy transformacji jako rozpuszczalnika. Niebieski proszek żywiołów jako katalizator.'
  },
  {
    solvent: 'smocza_krew', catalyst: 'szafir_proszek',
    inscription: 'Rygiel ze stopu mroźnego żelaza wymaga dwuetapowego procesu. Najpierw: substancja o intensywnym siarczanym zapachu i właściwościach korozyjnych wobec zakletych metali. Następnie: niebieski proszek kondensujący energię żywiołów naturalnych.',
    reagentIds: ['smocza_krew', 'szafir_proszek', 'runiczna_sol', 'wilgotny_mech', 'popiól_runiczny', 'kwas_smoczy'],
    hint: 'Pierwiastek siarki wskazuje na korozyjny rozpuszczalnik. Błękitny kryształ żywiołów to katalizator.'
  }
];

// ===================== STREFA CZASOWA =====================

export function warsawDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Warsaw',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(date);
  const get = (t) => parts.find((p) => p.type === t)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function warsawWeekKey(date = new Date()) {
  // Pobierz datę w strefie Warsaw
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Warsaw',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(date);
  const y = parseInt(parts.find((p) => p.type === 'year').value, 10);
  const m = parseInt(parts.find((p) => p.type === 'month').value, 10) - 1;
  const d = parseInt(parts.find((p) => p.type === 'day').value, 10);

  // Zbuduj UTC-noon dla tej daty (bezpieczne wobec DST)
  const noon = Date.UTC(y, m, d, 12, 0, 0);
  const dayOfWeek = new Date(noon).getUTCDay(); // 0=Nd, 1=Pn, ..., 6=Sob
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const mondayNoon = noon - daysToMonday * 86400000;
  const monday = new Date(mondayNoon);
  return `${monday.getUTCFullYear()}-${String(monday.getUTCMonth() + 1).padStart(2, '0')}-${String(monday.getUTCDate()).padStart(2, '0')}`;
}

export function warsawNextMidnight(date = new Date()) {
  // Zwraca timestamp UTC kolejnej północy w Warsaw
  const dateKey = warsawDateKey(date);
  const [y, m, d] = dateKey.split('-').map(Number);
  // Następny dzień o 00:00 Warsaw — szukamy UTC tego momentu
  // Tworzymy datę jako "następny dzień o 00:00 UTC", potem korygujemy offset
  const tomorrow = new Date(Date.UTC(y, m - 1, d + 1, 0, 0, 0));
  // Poprawka: użyj Intl do znalezienia offsetu Warsaw dla następnego dnia
  const tomorrowStr = `${y}-${String(m).padStart(2, '0')}-${String(d + 1).padStart(2, '0')}T00:00:00`;
  // Szybkie przybliżenie: Europa/Warszawa to UTC+1 lub UTC+2
  // Użyjemy pętli binarnej by znaleźć dokładny timestamp
  const ref = new Date(`${tomorrowStr}+01:00`); // pesymistyczny offset
  for (let offset = 0; offset <= 2; offset++) {
    const candidate = new Date(ref.getTime() - offset * 3600000);
    if (warsawDateKey(candidate) === `${y}-${String(m).padStart(2, '0')}-${String(d + 1).padStart(2, '0')}`) {
      return candidate;
    }
  }
  return tomorrow;
}

export function warsawNextMonday(date = new Date()) {
  // Następny poniedziałek o 00:00 Warsaw
  const currentWeekKey = warsawWeekKey(date);
  const [y, m, d] = currentWeekKey.split('-').map(Number);
  // Tydzień zaczyna się w poniedziałek currentWeekKey — następny to +7 dni
  const nextMondayNoon = Date.UTC(y, m - 1, d + 7, 12, 0, 0);
  const nextMonday = new Date(nextMondayNoon);
  const nextMondayStr = `${nextMonday.getUTCFullYear()}-${String(nextMonday.getUTCMonth() + 1).padStart(2, '0')}-${String(nextMonday.getUTCDate()).padStart(2, '0')}`;
  const ref = new Date(`${nextMondayStr}T00:00:00+01:00`);
  for (let offset = 0; offset <= 2; offset++) {
    const candidate = new Date(ref.getTime() - offset * 3600000);
    if (warsawDateKey(candidate) === nextMondayStr) return candidate;
  }
  return new Date(nextMondayNoon);
}

// ===================== MIGRACJA BAZY DANYCH =====================

export function initDungeonEscapeService(db) {
  _db = db;

  db.exec(`
    CREATE TABLE IF NOT EXISTS dungeon_escape_attempts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      stage INTEGER NOT NULL DEFAULT 1,
      variant_stage1 INTEGER NOT NULL DEFAULT 0,
      variant_stage2 INTEGER NOT NULL DEFAULT 0,
      variant_stage3 INTEGER NOT NULL DEFAULT 0,
      hints_used INTEGER NOT NULL DEFAULT 0,
      errors INTEGER NOT NULL DEFAULT 0,
      stage2_sequence TEXT NOT NULL DEFAULT '[]',
      started_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      completed_at TEXT,
      failure_reason TEXT,
      daily_key TEXT NOT NULL,
      week_key TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_de_user_status ON dungeon_escape_attempts(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_de_daily ON dungeon_escape_attempts(user_id, daily_key);

    CREATE TABLE IF NOT EXISTS dungeon_escape_weekly_rewards (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      week_key TEXT NOT NULL,
      attempt_id TEXT NOT NULL,
      points_awarded INTEGER NOT NULL DEFAULT 0,
      skirnirs_awarded INTEGER NOT NULL DEFAULT 0,
      artifact_awarded INTEGER NOT NULL DEFAULT 0,
      reward_tier TEXT NOT NULL DEFAULT '',
      awarded_at TEXT NOT NULL,
      UNIQUE(user_id, week_key),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
}

// ===================== POMOCNICZE =====================

function getActiveAttempt(userId) {
  return _db.prepare(
    "SELECT * FROM dungeon_escape_attempts WHERE user_id = ? AND status = 'active' LIMIT 1"
  ).get(userId);
}

function checkExpiry(attempt, now = new Date()) {
  const expiresAt = new Date(attempt.expires_at);
  return now >= expiresAt;
}

function failAttempt(attemptId, reason) {
  _db.prepare(
    "UPDATE dungeon_escape_attempts SET status = 'failed', failure_reason = ?, completed_at = ? WHERE id = ?"
  ).run(reason, new Date().toISOString(), attemptId);
}

function getPublicStageData(stage, variantIndex) {
  if (stage === 1) {
    const v = STAGE1_VARIANTS[variantIndex];
    return {
      stage: 1,
      inscription: v.inscription,
      runeSymbols: RUNE_SYMBOLS,
      runeLexicon: RUNE_LEXICON
    };
  }
  if (stage === 2) {
    const v = STAGE2_VARIANTS[variantIndex];
    return {
      stage: 2,
      saga: v.saga,
      constellations: CONSTELLATIONS
    };
  }
  if (stage === 3) {
    const v = STAGE3_VARIANTS[variantIndex];
    return {
      stage: 3,
      inscription: v.inscription,
      reagents: v.reagentIds.map((id) => ({ id, ...STAGE3_REAGENTS_DATA[id] }))
    };
  }
  return null;
}

function computeRewardTier(attempt, completedAtMs) {
  const durationMs = completedAtMs - new Date(attempt.started_at).getTime();
  const h = attempt.hints_used;
  const e = attempt.errors;

  if (h === 0 && e === 0 && durationMs <= MASTER_TIME_MS) return 'master';
  if (h === 0) return 'standard';
  if (h === 1) return 'hint1';
  return 'hint2';
}

const REWARD_TABLE = {
  master:   { points: 45, skirnirs: 50 },
  standard: { points: 35, skirnirs: 40 },
  hint1:    { points: 25, skirnirs: 30 },
  hint2:    { points: 15, skirnirs: 20 }
};

function buildPublicAttempt(attempt) {
  if (!attempt) return null;
  const stage2Seq = JSON.parse(attempt.stage2_sequence || '[]');
  const now = new Date();
  const expired = checkExpiry(attempt, now);
  const remainingMs = Math.max(0, new Date(attempt.expires_at).getTime() - now.getTime());

  let stageData = getPublicStageData(
    attempt.stage,
    attempt.stage === 1 ? attempt.variant_stage1 :
    attempt.stage === 2 ? attempt.variant_stage2 : attempt.variant_stage3
  );

  if (attempt.stage === 2) {
    stageData = { ...stageData, stage2SequenceSoFar: stage2Seq };
  }

  return {
    id: attempt.id,
    status: attempt.status,
    stage: attempt.stage,
    hp: MAX_HP - attempt.errors,
    hintsUsed: attempt.hints_used,
    errors: attempt.errors,
    expiresAt: attempt.expires_at,
    startedAt: attempt.started_at,
    remainingMs,
    expired,
    stageData
  };
}

// ===================== PUBLICZNE API SERWISU =====================

export function getDungeonStatus(userId) {
  const now = new Date();
  const dailyKey = warsawDateKey(now);
  const weekKey = warsawWeekKey(now);

  // Wyczyść wygasłe aktywne podejścia
  const active = getActiveAttempt(userId);
  if (active && checkExpiry(active, now)) {
    failAttempt(active.id, 'timeout');
  }

  const freshActive = getActiveAttempt(userId);

  const dailyAttempts = _db.prepare(
    "SELECT COUNT(*) as cnt FROM dungeon_escape_attempts WHERE user_id = ? AND daily_key = ?"
  ).get(userId, dailyKey)?.cnt || 0;

  const weeklyReward = _db.prepare(
    "SELECT * FROM dungeon_escape_weekly_rewards WHERE user_id = ? AND week_key = ?"
  ).get(userId, weekKey);

  const hasEverCompleted = _db.prepare(
    "SELECT id FROM dungeon_escape_attempts WHERE user_id = ? AND status = 'completed' LIMIT 1"
  ).get(userId);

  return {
    dailyKey,
    weekKey,
    dailyLimit: DAILY_LIMIT,
    dailyAttemptsUsed: dailyAttempts,
    dailyAttemptsRemaining: Math.max(0, DAILY_LIMIT - (freshActive ? dailyAttempts : dailyAttempts)),
    dailyResetAt: warsawNextMidnight(now).toISOString(),
    weeklyRewardAvailable: !weeklyReward,
    weeklyResetAt: warsawNextMonday(now).toISOString(),
    hasEverCompleted: Boolean(hasEverCompleted),
    activeAttempt: buildPublicAttempt(freshActive)
  };
}

export function startOrResumeAttempt(userId, userName, house) {
  const now = new Date();
  const dailyKey = warsawDateKey(now);
  const weekKey = warsawWeekKey(now);

  return _db.transaction(() => {
    // Wyczyść wygasłe aktywne
    const maybeActive = getActiveAttempt(userId);
    if (maybeActive && checkExpiry(maybeActive, now)) {
      failAttempt(maybeActive.id, 'timeout');
    }

    // Spróbuj wznowić
    const stillActive = getActiveAttempt(userId);
    if (stillActive) {
      return { resumed: true, attempt: buildPublicAttempt(stillActive) };
    }

    // Sprawdź dzienny limit
    const dailyCount = _db.prepare(
      "SELECT COUNT(*) as cnt FROM dungeon_escape_attempts WHERE user_id = ? AND daily_key = ?"
    ).get(userId, dailyKey)?.cnt || 0;

    if (dailyCount >= DAILY_LIMIT) {
      return { error: `Dzisiejszy limit ${DAILY_LIMIT} podejść został wyczerpany. Wróć jutro.`, code: 429 };
    }

    // Losuj warianty deterministycznie (ale wystarczająco różnie)
    const seed = (parseInt(userId.slice(-4), 16) || 0);
    const v1 = (seed + dailyCount) % STAGE1_VARIANTS.length;
    const v2 = (seed + dailyCount + 1) % STAGE2_VARIANTS.length;
    const v3 = (seed + dailyCount + 2) % STAGE3_VARIANTS.length;

    const attemptId = `de-${dailyKey}-${userId.slice(0, 8)}-${randomUUID().slice(0, 8)}`;
    const startedAt = now.toISOString();
    const expiresAt = new Date(now.getTime() + MAX_DURATION_MS).toISOString();

    _db.prepare(`
      INSERT INTO dungeon_escape_attempts
        (id, user_id, status, stage, variant_stage1, variant_stage2, variant_stage3,
         hints_used, errors, stage2_sequence, started_at, expires_at, daily_key, week_key)
      VALUES (?, ?, 'active', 1, ?, ?, ?, 0, 0, '[]', ?, ?, ?, ?)
    `).run(attemptId, userId, v1, v2, v3, startedAt, expiresAt, dailyKey, weekKey);

    const newAttempt = _db.prepare('SELECT * FROM dungeon_escape_attempts WHERE id = ?').get(attemptId);
    return { resumed: false, attempt: buildPublicAttempt(newAttempt) };
  })();
}

export function submitStageAnswer(userId, attemptId, answer) {
  const now = new Date();

  // Sprawdzenie wygaśnięcia POZA transakcją — gwarantuje świeży odczyt expires_at
  // (SQLite in-memory nie obsługuje WAL, przez co snapshot wewnątrz transakcji
  // może nie widzieć aktualizacji expires_at wykonanych tuż przed wywołaniem)
  {
    const pre = _db.prepare(
      "SELECT id, status, expires_at FROM dungeon_escape_attempts WHERE id = ? AND user_id = ?"
    ).get(attemptId, userId);
    if (!pre) return { error: 'Podejście nie istnieje lub nie należy do Ciebie.', code: 403 };
    if (pre.status !== 'active') return { error: 'To podejście jest już zakończone.', code: 409 };
    if (checkExpiry(pre, now)) {
      failAttempt(attemptId, 'timeout');
      return { error: 'Czas minął. Podejście zakończone porażką.', code: 410, outcome: 'timeout' };
    }
  }

  return _db.transaction(() => {
    const attempt = _db.prepare(
      "SELECT * FROM dungeon_escape_attempts WHERE id = ? AND user_id = ?"
    ).get(attemptId, userId);

    if (!attempt) return { error: 'Podejście nie istnieje lub nie należy do Ciebie.', code: 403 };
    if (attempt.status !== 'active') return { error: 'To podejście jest już zakończone.', code: 409 };

    const stage = attempt.stage;

    // ---- ETAP 1: Runiczne Pierścienie ----
    if (stage === 1) {
      const { r1, r2, r3 } = answer;
      if ([r1, r2, r3].some((v) => typeof v !== 'number' || v < 0 || v > 5)) {
        return { error: 'Nieprawidłowe wartości pierścieni.', code: 400 };
      }
      const v = STAGE1_VARIANTS[attempt.variant_stage1];
      const correct = v.solution[0] === r1 && v.solution[1] === r2 && v.solution[2] === r3;

      if (correct) {
        _db.prepare("UPDATE dungeon_escape_attempts SET stage = 2 WHERE id = ?").run(attemptId);
        const updated = _db.prepare('SELECT * FROM dungeon_escape_attempts WHERE id = ?').get(attemptId);
        return { correct: true, advanced: true, attempt: buildPublicAttempt(updated) };
      } else {
        const newErrors = attempt.errors + 1;
        if (newErrors >= MAX_HP) {
          failAttempt(attemptId, 'hp_depleted');
          return { correct: false, outcome: 'failed', reason: 'hp_depleted', hp: 0 };
        }
        _db.prepare("UPDATE dungeon_escape_attempts SET errors = ? WHERE id = ?").run(newErrors, attemptId);
        return { correct: false, hp: MAX_HP - newErrors, message: 'Błędna kombinacja run. Pierścienie się nie wpasowały.' };
      }
    }

    // ---- ETAP 2: Astrarium — kliknięcie konstelacji ----
    if (stage === 2) {
      const v = STAGE2_VARIANTS[attempt.variant_stage2];
      const seq = JSON.parse(attempt.stage2_sequence || '[]');

      // Cofnięcie ostatniego poprawnego kroku (bez kary)
      if (answer.undo) {
        if (seq.length === 0) return { undone: false };
        const newSeq = seq.slice(0, -1);
        _db.prepare("UPDATE dungeon_escape_attempts SET stage2_sequence = ? WHERE id = ?").run(JSON.stringify(newSeq), attemptId);
        const updated = _db.prepare('SELECT * FROM dungeon_escape_attempts WHERE id = ?').get(attemptId);
        return { undone: true, attempt: buildPublicAttempt(updated) };
      }

      const { constellationId } = answer;
      if (!CONSTELLATIONS.find((c) => c.id === constellationId)) {
        return { error: 'Nieznany gwiazdozbiór.', code: 400 };
      }

      const expectedIndex = seq.length;
      const expectedId = v.sequence[expectedIndex];

      if (constellationId === expectedId) {
        const newSeq = [...seq, constellationId];
        if (newSeq.length === v.sequence.length) {
          // Etap ukończony — przejdź do 3
          _db.prepare("UPDATE dungeon_escape_attempts SET stage = 3, stage2_sequence = '[]' WHERE id = ?").run(attemptId);
          const updated = _db.prepare('SELECT * FROM dungeon_escape_attempts WHERE id = ?').get(attemptId);
          return { correct: true, advanced: true, attempt: buildPublicAttempt(updated) };
        }
        _db.prepare("UPDATE dungeon_escape_attempts SET stage2_sequence = ? WHERE id = ?").run(JSON.stringify(newSeq), attemptId);
        const updated = _db.prepare('SELECT * FROM dungeon_escape_attempts WHERE id = ?').get(attemptId);
        return { correct: true, advanced: false, sequenceSoFar: newSeq, attempt: buildPublicAttempt(updated) };
      } else {
        const newErrors = attempt.errors + 1;
        if (newErrors >= MAX_HP) {
          failAttempt(attemptId, 'hp_depleted');
          return { correct: false, outcome: 'failed', reason: 'hp_depleted', hp: 0 };
        }
        _db.prepare(
          "UPDATE dungeon_escape_attempts SET errors = ?, stage2_sequence = '[]' WHERE id = ?"
        ).run(newErrors, attemptId);
        return {
          correct: false,
          hp: MAX_HP - newErrors,
          message: 'Błędny gwiazdozbiór. Sekwencja zresetowana.',
          sequenceReset: true
        };
      }
    }

    // ---- ETAP 3: Alchemiczny Rygiel ----
    if (stage === 3) {
      const { solvent, catalyst } = answer;
      if (!solvent || !catalyst) return { error: 'Wymagane oba składniki.', code: 400 };
      const v = STAGE3_VARIANTS[attempt.variant_stage3];
      const correct = solvent === v.solvent && catalyst === v.catalyst;

      if (correct) {
        const completedAt = now.toISOString();
        _db.prepare(
          "UPDATE dungeon_escape_attempts SET status = 'completed', completed_at = ? WHERE id = ?"
        ).run(completedAt, attemptId);

        // Sprawdź tygodniową nagrodę
        const weekKey = attempt.week_key;
        const existingWeeklyReward = _db.prepare(
          "SELECT id FROM dungeon_escape_weekly_rewards WHERE user_id = ? AND week_key = ?"
        ).get(userId, weekKey);

        let rewardResult = null;
        if (!existingWeeklyReward) {
          const tier = computeRewardTier(attempt, now.getTime());
          const rewards = REWARD_TABLE[tier];
          const idKey = `de-${userId}-${weekKey}`;

          // Sprawdź czy kiedykolwiek ukończył (dla artefaktu)
          const prevCompleted = _db.prepare(
            "SELECT id FROM dungeon_escape_attempts WHERE user_id = ? AND status = 'completed' AND id != ? LIMIT 1"
          ).get(userId, attemptId);
          const grantArtifact = !prevCompleted;

          const rewardId = `dewr-${userId.slice(0, 8)}-${weekKey}`;
          _db.prepare(`
            INSERT OR IGNORE INTO dungeon_escape_weekly_rewards
              (id, user_id, week_key, attempt_id, points_awarded, skirnirs_awarded, artifact_awarded, reward_tier, awarded_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(rewardId, userId, weekKey, attemptId, rewards.points, rewards.skirnirs, grantArtifact ? 1 : 0, tier, completedAt);

          // Sprawdź czy INSERT się udał (ochrona przed wyścigiem)
          const inserted = _db.prepare("SELECT id FROM dungeon_escape_weekly_rewards WHERE id = ?").get(rewardId);
          if (inserted) {
            const userRow = _db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
            const studentName = userRow?.full_name || userName || 'Adept';
            const houseId = userRow?.house;

            if (rewards.points > 0) {
              awardPoints({
                studentId: userId, studentName, house: houseId || null,
                points: rewards.points,
                source: 'Labirynt Tajemnic — ukończenie',
                sourceType: 'DUNGEON_ESCAPE',
                sourceId: attemptId,
                actorId: 'system', actorName: 'System Labiryntu',
                idempotencyKey: `pt-de-${idKey}`
              });
            }

            if (rewards.skirnirs > 0) {
              creditSkirnir({
                userId, userName: studentName, amount: rewards.skirnirs,
                category: 'labirynt', title: 'Nagroda za Labirynt Tajemnic',
                note: `Poziom: ${tier}`,
                sourceType: 'DUNGEON_ESCAPE', sourceId: attemptId,
                actorId: 'system', actorName: 'System Labiryntu',
                idempotencyKey: `skr-de-${idKey}`
              });
            }

            if (grantArtifact) {
              const inv = JSON.parse(userRow?.inventory || '[]');
              if (!inv.some((i) => i.id === GOLDEN_KEY_ITEM.id)) {
                inv.unshift({ ...GOLDEN_KEY_ITEM, acquiredAt: completedAt });
                _db.prepare('UPDATE users SET inventory = ? WHERE id = ?').run(JSON.stringify(inv), userId);
              }
            }

            rewardResult = { tier, points: rewards.points, skirnirs: rewards.skirnirs, artifactGranted: grantArtifact };
          }
        }

        const updatedAttempt = _db.prepare('SELECT * FROM dungeon_escape_attempts WHERE id = ?').get(attemptId);
        const updatedUser = _db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

        return {
          correct: true,
          outcome: 'completed',
          reward: rewardResult,
          trainingMode: !rewardResult && Boolean(existingWeeklyReward),
          attempt: buildPublicAttempt(updatedAttempt),
          user: updatedUser
        };
      } else {
        const newErrors = attempt.errors + 1;
        if (newErrors >= MAX_HP) {
          failAttempt(attemptId, 'hp_depleted');
          return { correct: false, outcome: 'failed', reason: 'hp_depleted', hp: 0 };
        }
        _db.prepare("UPDATE dungeon_escape_attempts SET errors = ? WHERE id = ?").run(newErrors, attemptId);
        return { correct: false, hp: MAX_HP - newErrors, message: 'Błędna kombinacja odczynników. Zamek się nie otworzył.' };
      }
    }

    return { error: 'Nieznany etap.', code: 400 };
  })();
}

export function requestHint(userId, attemptId) {
  const now = new Date();

  return _db.transaction(() => {
    const attempt = _db.prepare(
      "SELECT * FROM dungeon_escape_attempts WHERE id = ? AND user_id = ?"
    ).get(attemptId, userId);

    if (!attempt) return { error: 'Podejście nie istnieje.', code: 403 };
    if (attempt.status !== 'active') return { error: 'Podejście jest już zakończone.', code: 409 };
    if (checkExpiry(attempt, now)) {
      failAttempt(attemptId, 'timeout');
      return { error: 'Czas minął.', code: 410, outcome: 'timeout' };
    }
    if (attempt.hints_used >= MAX_HINTS) {
      return { error: `Wykorzystano już ${MAX_HINTS} podpowiedzi — limit wyczerpany.`, code: 400 };
    }

    const newExpiresAt = new Date(new Date(attempt.expires_at).getTime() - HINT_PENALTY_MS);
    if (newExpiresAt <= now) {
      failAttempt(attemptId, 'timeout');
      return { error: 'Kara za podpowiedź wyczerpała Twój czas. Porażka.', code: 410, outcome: 'timeout' };
    }

    const newHints = attempt.hints_used + 1;
    _db.prepare(
      "UPDATE dungeon_escape_attempts SET hints_used = ?, expires_at = ? WHERE id = ?"
    ).run(newHints, newExpiresAt.toISOString(), attemptId);

    const stage = attempt.stage;
    const variantIndex = stage === 1 ? attempt.variant_stage1 : stage === 2 ? attempt.variant_stage2 : attempt.variant_stage3;
    const variants = stage === 1 ? STAGE1_VARIANTS : stage === 2 ? STAGE2_VARIANTS : STAGE3_VARIANTS;
    const hint = variants[variantIndex].hint;

    const updated = _db.prepare('SELECT * FROM dungeon_escape_attempts WHERE id = ?').get(attemptId);
    return {
      hint,
      hintsUsed: newHints,
      hintsRemaining: MAX_HINTS - newHints,
      newExpiresAt: newExpiresAt.toISOString(),
      attempt: buildPublicAttempt(updated)
    };
  })();
}

export function abandonAttempt(userId, attemptId) {
  return _db.transaction(() => {
    const attempt = _db.prepare(
      "SELECT * FROM dungeon_escape_attempts WHERE id = ? AND user_id = ?"
    ).get(attemptId, userId);

    if (!attempt) return { error: 'Podejście nie istnieje.', code: 403 };
    if (attempt.status !== 'active') return { error: 'Podejście jest już zakończone.', code: 409 };

    _db.prepare(
      "UPDATE dungeon_escape_attempts SET status = 'abandoned', completed_at = ? WHERE id = ?"
    ).run(new Date().toISOString(), attemptId);

    return { abandoned: true };
  })();
}
