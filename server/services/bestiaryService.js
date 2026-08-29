import { randomUUID } from 'crypto';
import { awardPoints } from './pointsService.js';
import { credit as creditSkirnir } from './skirnirService.js';

// ── Constants ────────────────────────────────────────────────────────────────

export const CHALLENGE_VERSION = 1;
export const MAX_ENCOUNTERS = 4;
export const MAX_WARDS = 4;
export const TRANSPORT_TOLERANCE_MS = 750;
export const SESSION_EXPIRY_MS = 15 * 60 * 1000;
export const DAILY_REWARD_LIMIT = 3;
export const OBSERVE_DEADLINE_MS = 9000;
export const COUNTER_DEADLINE_MS = 8000;

const VALID_HOUSES = ['reinhall', 'bjornhall', 'ravnheim', 'otergard'];

// ── Public Catalog ───────────────────────────────────────────────────────────

export const BEAST_CATALOG = [
  {
    id: 'frost_drake',
    name: 'Smok Lodowych Fiordów (Dreki)',
    danger: 'Klasa Zagrożenia: XXXXX (Śmiertelny)',
    dangerLevel: 5,
    dangerColor: '#ef4444',
    habitat: 'Szczyty Gór Skandynawskich i Lodowce',
    weakness: 'Płomień Berserka (Ignis Furor)',
    desc: 'Skrzydlaty gad o łuskach twardszych niż diament. Jego lodowy oddech zamraża w kamień całe drakkary w ułamku sekundy.',
    lore: 'Pradawne sagi mówią, że założyciele Durmstrangu zawarli pakt z pierwszym Dreki, oddając mu pieczę nad podziemiami.'
  },
  {
    id: 'shadow_wolf',
    name: 'Widmowy Wilk Północy (Ulfr)',
    danger: 'Klasa Zagrożenia: XXXX (Niebezpieczny)',
    dangerLevel: 4,
    dangerColor: '#f97316',
    habitat: 'Przeklęta Puszcza Cieni (Myrkviðr)',
    weakness: 'Lumos Borealis (Rozproszenie Cienia)',
    desc: 'Drapieżnik zdolny do stapiania się z mrokiem. Jego wycie wywołuje paraliżujący strach w sercach adeptów.',
    lore: 'Zakonnicy z Reinhall i Björnhall często obłaskawiają młode wilki Ulfr na lojalnych chowańców.'
  },
  {
    id: 'ice_jotun',
    name: 'Lodowy Jotun (Jötunn)',
    danger: 'Klasa Zagrożenia: XXXXX (Monumentalny)',
    dangerLevel: 5,
    dangerColor: '#ef4444',
    habitat: 'Jaskinie Jotunheimen',
    weakness: 'Runa Przełamania (Thurisaz)',
    desc: 'Pradawny kolos wykuty z lodowca i bazaltu. Porusza się powoli, lecz jego uderzenie kruszy mury zamkowe.',
    lore: 'Śpią przez stulecia w głębi tundry. Budzą się wyłącznie podczas największych anomalii magicznych Północy.'
  },
  {
    id: 'kraken',
    name: 'Głębinowy Kraken ze Skandów',
    danger: 'Klasa Zagrożenia: XXXXX (Legendarny)',
    dangerLevel: 5,
    dangerColor: '#a855f7',
    habitat: 'Bezkresne Głębiny Zamarzniętego Fiordu',
    weakness: 'Runiczny Piorun (Tiwaz)',
    desc: 'Wieloramienny potwór morski strzegący dna fiordu przed intruzami z zewnątrz.',
    lore: 'Członkowie Zakonu Otergard czerpią ze śluzu Krakena najsilniejsze odczynniki paraliżujące do alchemii.'
  }
];

// ── Server-only: Clue Bank ────────────────────────────────────────────────────

const CLUE_BANK = {
  frost_drake: [
    {
      setId: 'frost_drake_A',
      clues: [
        'Wielkie ślady łap odciśnięte w lodzie — każdy większy niż drzwi wejściowe do zamku.',
        'Powietrze przesycone jest mrozem głębszym niż naturalny — twoje tchnienie skrapla się w kilka metrów od źródła.',
        'Szczątki drakkaru pokryte grubą warstwą błękitnego lodu, jakby zamarzł od wewnątrz.'
      ]
    },
    {
      setId: 'frost_drake_B',
      clues: [
        'Wzdłuż klifu biegną głębokie rysy w skale, szerokie na szerokość dłoni — odciski pazurów.',
        'Powietrze wibruje niskim, rezonującym buczeniem, które mroźny wiatr przenosi z gór.',
        'Stado owiec zniknęło bez śladu — pozostały jedynie kopyta odciśnięte w zamarzniętej ziemi.'
      ]
    },
    {
      setId: 'frost_drake_C',
      clues: [
        'Łuski wielkości tarczy wikinga leżą rozsiane po płaskim, wyługowanym skałami pasie terenu.',
        'Temperatura spada gwałtownie — woda do zaklęć zamarza w butelce, gdy się zbliżasz.',
        'W promieniu stu łokci drzewa są powalone — każde pokryte cieniutką, błyszczącą warstwą lodu.'
      ]
    }
  ],
  shadow_wolf: [
    {
      setId: 'shadow_wolf_A',
      clues: [
        'Na mchu odciśnięte ślady wielkiego drapieżnika — lecz ich krawędzie są rozmyte, jakby zwierzę wsunęło się z cienia.',
        'Latarnie w pobliżu wioski gasną jedna po drugiej, choć wiatr nie wieje — mrok pochłania ich blask.',
        'Mieszkańcy donoszą o paraliżującym uczuciu grozy, które ogarnęło ich bez powodu w bezwietrzną noc.'
      ]
    },
    {
      setId: 'shadow_wolf_B',
      clues: [
        'Ziemia pod drzewami jest wzruszona — coś dużego leżało tam i wylegiwało się, nie zostawiając wyraźnych zarysów sylwetki.',
        'Mgła gęstnieje wyraźnie wokół jednego miejsca, mimo że reszta lasu jest czysta.',
        'Zwierzęta leśne uciekły — cisza bez żadnego śpiewu ptaka wypełnia las w środku dnia.'
      ]
    },
    {
      setId: 'shadow_wolf_C',
      clues: [
        'Na pniu starego dębu widać długie, równoległe rysy blisko ziemi — jak ślad toczenia się wielkiego ciała.',
        'Twój zapalony wanderas gaśnie, gdy zbliżasz się do środka lasu, mimo że kryształ magiczny jest naładowany.',
        'Kilka klaczy zaginęło, a zagrodę znaleziono otwartą — zamek zerwany od środka, brak śladów walki.'
      ]
    }
  ],
  ice_jotun: [
    {
      setId: 'ice_jotun_A',
      clues: [
        'Ślady ogromnych kroków w śniegu — każdy głęboki na łokieć, odstępy między nimi szersze niż dwie długości człowieka.',
        'Ziemia drży pod stopami rytmicznie, choć żadnego trzęsienia ziemi nie odnotowano — jakby coś olbrzymiego poruszało się pod spodem.',
        'Kamienny mur wewnątrz jaskini rozpadł się na kawałki — gruzy rozsypane jak piasek, bez śladu wybuchu ani zaklęcia.'
      ]
    },
    {
      setId: 'ice_jotun_B',
      clues: [
        'Ogromny odcisk dłoni w granitowym zboczu góry — palce wciśnięte na kilka cali w litą skałę.',
        'Zaklęcia transmutacji w pobliżu nie działają — jakby magia była blokowana przez niepojętą masę.',
        'Lodowiec przesunął się o kilkanaście kroków w ciągu jednej nocy — niewyjaśniona siła pchnęła go z miejsca.'
      ]
    },
    {
      setId: 'ice_jotun_C',
      clues: [
        'Głazy wielkości domów leżą w dolinie — żaden z nich nie pochodzi z otaczającego rejonu.',
        'Runiczne kamienie ostrzegawcze w obszarze aktywowały się nagle w środku nocy, lecz sonda zaklęcia nie wychwyciła żadnej żywej istoty.',
        'Jaskinia była zamknięta od środka — wejście zablokowane blokiem lodu uformowanym od wewnątrz.'
      ]
    }
  ],
  kraken: [
    {
      setId: 'kraken_A',
      clues: [
        'Na dnie łodzi znaleziono odciski przyssawek — każda wielkości płyty kamiennej, zaciśnięte z siłą rozsadzającą deski.',
        'Woda fiordu jarzy się bladoniebieskim światłem w ciemnościach — magiczne wydzieliny gromadzą się pod powierzchnią.',
        'Drakkary omijają tę część fiordu — żaden kapitan nie ryzykuje przepłynięcia przez strefę, gdzie inne statki znikają bez śladu.'
      ]
    },
    {
      setId: 'kraken_B',
      clues: [
        'Na nadbrzeżnych skałach leżą resztki sieci rybackich — postrzępione równomiernie, jakby coś grubego i liskawego przez nie przeciągnęło.',
        'Fale roją się wokół jednego miejsca fiordu mimo spokojnej pogody — a powietrze nad wodą jest dziwnie chłodne.',
        'Ławice ryb nagle znikają z fiordu — lokalni rybacy mówią, że woda ponownie \'śpi\'.'
      ]
    },
    {
      setId: 'kraken_C',
      clues: [
        'Na plażę wyrzuciło fragment starego masztu — owiązanego gęstą, ciemną materią podobną do atramentu.',
        'Detektory magii morskiej wskazują potężne skupisko siły w jednym miejscu fiordu — lecz nie reaguje jak żadna znana runa.',
        'Rybak, który przeżył, opisuje ciemność wynurzającą się spod wody i macki silniejsze od żelaznych łańcuchów.'
      ]
    }
  ]
};

const CORRECT_COUNTERMEASURE = {
  frost_drake: 'ignis_furor',
  shadow_wolf: 'lumos_borealis',
  ice_jotun: 'thurisaz',
  kraken: 'tiwaz'
};

const ALL_COUNTERMEASURE_LABELS = {
  ignis_furor: 'Płomień Berserka (Ignis Furor)',
  lumos_borealis: 'Lumos Borealis — Rozproszenie Cienia',
  thurisaz: 'Runa Przełamania (Thurisaz)',
  tiwaz: 'Runiczny Piorun (Tiwaz)',
  aqua_velox: 'Aqua Velox — Zaklęcie Błyskawicznego Ruchu',
  ferrum_mentis: 'Ferrum Mentis — Pancerz Mentalny',
  glacius_tempus: 'Glacius Tempus — Spowalniacz Magiczny',
  sonus_magnus: 'Sonus Magnus — Fala Dźwiękowa Dezorientująca',
  runica_ward: 'Runica Ward — Tarcza Runicznych Znaków'
};

const COUNTERMEASURE_OPTION_POOLS = {
  frost_drake: ['ignis_furor', 'aqua_velox', 'ferrum_mentis', 'glacius_tempus'],
  shadow_wolf: ['lumos_borealis', 'ignis_furor', 'runica_ward', 'sonus_magnus'],
  ice_jotun: ['thurisaz', 'tiwaz', 'lumos_borealis', 'ignis_furor'],
  kraken: ['tiwaz', 'ignis_furor', 'thurisaz', 'ferrum_mentis']
};

// ── DB init ──────────────────────────────────────────────────────────────────

let _db = null;
let _nowFn = () => new Date();

export function initBestiaryService(db, { nowFn } = {}) {
  _db = db;
  if (nowFn) _nowFn = nowFn;

  db.exec(`
    CREATE TABLE IF NOT EXISTS bestiary_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      mode TEXT NOT NULL CHECK (mode IN ('rewarded','training')),
      status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active','completed','failed','abandoned','expired')),
      date_warsaw TEXT NOT NULL,
      challenge_version INTEGER NOT NULL DEFAULT 1,
      current_encounter INTEGER NOT NULL DEFAULT 0,
      current_phase TEXT NOT NULL DEFAULT 'countdown'
        CHECK (current_phase IN ('countdown','observe','countermeasure','encounter_result','finished')),
      wards_remaining INTEGER NOT NULL DEFAULT 4,
      score INTEGER NOT NULL DEFAULT 0,
      reward_slot_reserved INTEGER NOT NULL DEFAULT 0,
      reward_house_points INTEGER NOT NULL DEFAULT 0,
      reward_skirnirs INTEGER NOT NULL DEFAULT 0,
      rewarded INTEGER NOT NULL DEFAULT 0,
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_active_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS bestiary_encounters (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES bestiary_sessions(id),
      encounter_index INTEGER NOT NULL CHECK (encounter_index BETWEEN 0 AND 3),
      beast_id TEXT NOT NULL,
      clue_set_id TEXT NOT NULL,
      identify_options_json TEXT NOT NULL DEFAULT '[]',
      counter_options_json TEXT NOT NULL DEFAULT '[]',
      observe_started_at TEXT,
      observe_deadline_at TEXT,
      identify_action_id TEXT,
      identify_choice_id TEXT,
      identify_answered_at TEXT,
      clues_seen INTEGER,
      identify_correct INTEGER,
      identify_points INTEGER,
      counter_started_at TEXT,
      counter_deadline_at TEXT,
      counter_action_id TEXT,
      counter_choice_id TEXT,
      counter_answered_at TEXT,
      counter_correct INTEGER,
      counter_points INTEGER,
      flawless_bonus INTEGER NOT NULL DEFAULT 0,
      ward_loss INTEGER NOT NULL DEFAULT 0,
      UNIQUE (session_id, encounter_index)
    );

    CREATE TABLE IF NOT EXISTS bestiary_discoveries (
      user_id TEXT NOT NULL,
      beast_id TEXT NOT NULL,
      field_note_unlocked INTEGER NOT NULL DEFAULT 0,
      unlocked_at TEXT,
      source_session_id TEXT,
      PRIMARY KEY (user_id, beast_id)
    );

    CREATE INDEX IF NOT EXISTS idx_bestiary_sessions_date
      ON bestiary_sessions (user_id, date_warsaw, reward_slot_reserved);

    CREATE INDEX IF NOT EXISTS idx_bestiary_sessions_user_status
      ON bestiary_sessions (user_id, status);
  `);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function warsawDateKey(date) {
  const d = date || _nowFn();
  return d.toLocaleDateString('en-CA', { timeZone: 'Europe/Warsaw' });
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function expireActiveSessions(userId) {
  const now = _nowFn();
  const cutoff = new Date(now.getTime() - SESSION_EXPIRY_MS).toISOString();
  _db.prepare(`
    UPDATE bestiary_sessions
    SET status = 'expired', completed_at = datetime('now')
    WHERE user_id = ? AND status = 'active' AND last_active_at < ?
  `).run(userId, cutoff);
}

function touchSession(id) {
  _db.prepare(`UPDATE bestiary_sessions SET last_active_at = ? WHERE id = ?`).run(_nowFn().toISOString(), id);
}

function computeIdentifyPoints(cluesSeen, correct) {
  if (!correct) return 0;
  if (cluesSeen <= 1) return 100;
  if (cluesSeen === 2) return 75;
  return 50;
}

function computeReward(score) {
  if (score < 250) return { housePoints: 0, skirnirs: 0 };
  if (score < 400) return { housePoints: 2, skirnirs: 2 };
  if (score < 525) return { housePoints: 4, skirnirs: 3 };
  if (score < 625) return { housePoints: 6, skirnirs: 5 };
  return { housePoints: 8, skirnirs: 7 };
}

function countCluesSeen(observeStartedAtStr) {
  const elapsed = _nowFn() - new Date(observeStartedAtStr);
  if (elapsed >= 5000) return 3;
  if (elapsed >= 2500) return 2;
  return 1;
}

function findClueSet(beastId, setId) {
  return CLUE_BANK[beastId]?.find(s => s.setId === setId) || null;
}

// ── Sanitizers ────────────────────────────────────────────────────────────────

function sanitizeSession(s) {
  return {
    id: s.id,
    mode: s.mode,
    status: s.status,
    dateWarsaw: s.date_warsaw,
    challengeVersion: s.challenge_version,
    currentEncounter: s.current_encounter,
    currentPhase: s.current_phase,
    wardsRemaining: s.wards_remaining,
    score: s.score,
    rewardSlotReserved: !!s.reward_slot_reserved,
    rewardHousePoints: s.reward_house_points,
    rewardSkirnirs: s.reward_skirnirs,
    rewarded: !!s.rewarded,
    startedAt: s.started_at,
    lastActiveAt: s.last_active_at,
    completedAt: s.completed_at
  };
}

// Never expose correct answers, only reveal clues that are time-appropriate
function sanitizeEncounter(enc, session) {
  const obj = {
    encounterId: enc.id,
    encounterIndex: enc.encounter_index,
    identifyOptions: JSON.parse(enc.identify_options_json || '[]'),
    counterOptions: JSON.parse(enc.counter_options_json || '[]').map(id => ({
      id,
      label: ALL_COUNTERMEASURE_LABELS[id] || id
    })),
    identifyAnswered: !!enc.identify_action_id,
    identifyCorrect: enc.identify_correct === null || enc.identify_correct === undefined
      ? null
      : !!enc.identify_correct,
    identifyPoints: enc.identify_points ?? null,
    counterAnswered: !!enc.counter_action_id,
    counterCorrect: enc.counter_correct === null || enc.counter_correct === undefined
      ? null
      : !!enc.counter_correct,
    counterPoints: enc.counter_points ?? null,
    flawlessBonus: enc.flawless_bonus ?? 0,
    wardLoss: enc.ward_loss ?? 0
  };

  if (enc.observe_started_at) {
    const seen = countCluesSeen(enc.observe_started_at);
    const clueSet = findClueSet(enc.beast_id, enc.clue_set_id);
    obj.clues = clueSet ? clueSet.clues.slice(0, seen) : [];
    obj.observeStartedAt = enc.observe_started_at;
    obj.observeDeadlineAt = enc.observe_deadline_at;
    obj.cluesSeen = seen;
  }

  if (enc.counter_started_at) {
    obj.counterStartedAt = enc.counter_started_at;
    obj.counterDeadlineAt = enc.counter_deadline_at;
  }

  // Reveal beast identity only after identification phase resolves or past encounter
  if (enc.identify_answered_at || session.current_encounter > enc.encounter_index) {
    obj.beastId = enc.beast_id;
    obj.beastName = BEAST_CATALOG.find(b => b.id === enc.beast_id)?.name || enc.beast_id;
  }

  return obj;
}

// ── Public: Catalog ───────────────────────────────────────────────────────────

export function getCatalog() {
  return BEAST_CATALOG;
}

// ── Public: User Status ───────────────────────────────────────────────────────

export function getUserStatus(userId) {
  expireActiveSessions(userId);

  const dateWarsaw = warsawDateKey();
  const usedRewards = _db.prepare(`
    SELECT COUNT(*) AS cnt FROM bestiary_sessions
    WHERE user_id = ? AND date_warsaw = ? AND reward_slot_reserved = 1
  `).get(userId, dateWarsaw)?.cnt || 0;

  const discoveries = _db.prepare(`
    SELECT beast_id, field_note_unlocked, unlocked_at FROM bestiary_discoveries WHERE user_id = ?
  `).all(userId);

  const bestScore = _db.prepare(`
    SELECT MAX(score) AS best FROM bestiary_sessions
    WHERE user_id = ? AND status = 'completed'
  `).get(userId)?.best || 0;

  const totalRuns = _db.prepare(`
    SELECT COUNT(*) AS cnt FROM bestiary_sessions WHERE user_id = ?
  `).get(userId)?.cnt || 0;

  const activeRow = _db.prepare(`
    SELECT id FROM bestiary_sessions WHERE user_id = ? AND status = 'active' LIMIT 1
  `).get(userId);

  return {
    usedRewards,
    remainingRewards: Math.max(0, DAILY_REWARD_LIMIT - usedRewards),
    discoveries,
    bestScore,
    totalRuns,
    activeSessionId: activeRow?.id || null
  };
}

// ── Public: Create Session ────────────────────────────────────────────────────

export function createSession({ userId, runId, requestedMode }) {
  if (!userId || !runId || typeof runId !== 'string' || runId.length > 100) {
    return { error: 'Nieprawidłowe parametry sesji.' };
  }

  expireActiveSessions(userId);

  // Idempotency: same runId from same user = return existing
  const existing = _db.prepare(`SELECT * FROM bestiary_sessions WHERE id = ?`).get(runId);
  if (existing) {
    if (existing.user_id !== userId) return { conflict: true };
    touchSession(runId);
    return { session: sanitizeSession(existing), resumed: true };
  }

  // Check for another active session for this user
  const activeRow = _db.prepare(`
    SELECT id FROM bestiary_sessions WHERE user_id = ? AND status = 'active' LIMIT 1
  `).get(userId);
  if (activeRow) {
    return { needsResume: true, activeSessionId: activeRow.id };
  }

  const dateWarsaw = warsawDateKey();
  const beastOrder = shuffle(BEAST_CATALOG.map(b => b.id));

  const finalMode = _db.transaction(() => {
    const usedRewards = _db.prepare(`
      SELECT COUNT(*) AS cnt FROM bestiary_sessions
      WHERE user_id = ? AND date_warsaw = ? AND reward_slot_reserved = 1
    `).get(userId, dateWarsaw)?.cnt || 0;

    const mode = (requestedMode === 'rewarded' && usedRewards < DAILY_REWARD_LIMIT) ? 'rewarded' : 'training';
    const slotReserved = mode === 'rewarded' ? 1 : 0;

    _db.prepare(`
      INSERT INTO bestiary_sessions
        (id, user_id, mode, status, date_warsaw, challenge_version, reward_slot_reserved, current_phase, wards_remaining, score, started_at, last_active_at)
      VALUES (?, ?, ?, 'active', ?, ?, ?, 'countdown', 4, 0, ?, ?)
    `).run(runId, userId, mode, dateWarsaw, CHALLENGE_VERSION, slotReserved, _nowFn().toISOString(), _nowFn().toISOString());

    for (let i = 0; i < MAX_ENCOUNTERS; i++) {
      const beastId = beastOrder[i];
      const bank = CLUE_BANK[beastId];
      const clueSet = bank[Math.floor(Math.random() * bank.length)];
      const identifyOptions = shuffle(BEAST_CATALOG.map(b => b.id));
      const counterOptions = shuffle(COUNTERMEASURE_OPTION_POOLS[beastId]);

      _db.prepare(`
        INSERT INTO bestiary_encounters
          (id, session_id, encounter_index, beast_id, clue_set_id, identify_options_json, counter_options_json)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        `enc-${runId}-${i}`,
        runId,
        i,
        beastId,
        clueSet.setId,
        JSON.stringify(identifyOptions),
        JSON.stringify(counterOptions)
      );
    }

    return mode;
  })();

  const session = _db.prepare(`SELECT * FROM bestiary_sessions WHERE id = ?`).get(runId);
  return { session: sanitizeSession(session), created: true, mode: finalMode };
}

// ── Public: Get Session State ─────────────────────────────────────────────────

export function getSessionState(sessionId, userId) {
  expireActiveSessions(userId);

  const session = _db.prepare(`SELECT * FROM bestiary_sessions WHERE id = ?`).get(sessionId);
  if (!session) return { notFound: true };
  if (session.user_id !== userId) return { forbidden: true };

  if (session.status !== 'active') {
    const encounters = _db.prepare(`
      SELECT * FROM bestiary_encounters WHERE session_id = ? ORDER BY encounter_index
    `).all(sessionId);
    return {
      session: sanitizeSession(session),
      encounters: encounters.map(e => sanitizeEncounter(e, session))
    };
  }

  touchSession(sessionId);

  const encounters = _db.prepare(`
    SELECT * FROM bestiary_encounters WHERE session_id = ? ORDER BY encounter_index
  `).all(sessionId);

  // Auto-resolve any timed-out encounters
  _resolveTimeouts(session, encounters);

  const freshSession = _db.prepare(`SELECT * FROM bestiary_sessions WHERE id = ?`).get(sessionId);
  const freshEncounters = _db.prepare(`
    SELECT * FROM bestiary_encounters WHERE session_id = ? ORDER BY encounter_index
  `).all(sessionId);

  return {
    session: sanitizeSession(freshSession),
    encounters: freshEncounters.map(e => sanitizeEncounter(e, freshSession))
  };
}

// Auto-resolve timed-out observe or countermeasure phases
function _resolveTimeouts(session, encounters) {
  if (session.status !== 'active') return;
  const now = _nowFn();

  if (session.current_phase === 'observe') {
    const enc = encounters.find(e => e.encounter_index === session.current_encounter);
    if (enc && enc.observe_deadline_at && !enc.identify_action_id) {
      const deadline = new Date(enc.observe_deadline_at);
      if (now > new Date(deadline.getTime() + TRANSPORT_TOLERANCE_MS)) {
        _applyIdentifyTimeout(session, enc);
      }
    }
  } else if (session.current_phase === 'countermeasure') {
    const enc = encounters.find(e => e.encounter_index === session.current_encounter);
    if (enc && enc.counter_deadline_at && !enc.counter_action_id) {
      const deadline = new Date(enc.counter_deadline_at);
      if (now > new Date(deadline.getTime() + TRANSPORT_TOLERANCE_MS)) {
        _applyCountermeasureTimeout(session, enc);
      }
    }
  }
}

function _applyIdentifyTimeout(session, enc) {
  const timeoutActionId = `timeout-identify-${enc.id}`;
  if (enc.identify_action_id) return;

  const wardLoss = 1;
  const newWards = Math.max(0, session.wards_remaining - wardLoss);
  const now = _nowFn();

  _db.prepare(`
    UPDATE bestiary_encounters SET
      identify_action_id = ?,
      identify_choice_id = '__timeout__',
      identify_answered_at = ?,
      clues_seen = 3,
      identify_correct = 0,
      identify_points = 0,
      ward_loss = ward_loss + ?,
      counter_started_at = ?,
      counter_deadline_at = ?
    WHERE id = ?
  `).run(
    timeoutActionId,
    now.toISOString(),
    wardLoss,
    now.toISOString(),
    new Date(now.getTime() + COUNTER_DEADLINE_MS).toISOString(),
    enc.id
  );

  const willFail = newWards <= 0;
  _db.prepare(`
    UPDATE bestiary_sessions SET
      wards_remaining = ?,
      current_phase = ?,
      status = ?,
      last_active_at = ?
    WHERE id = ?
  `).run(newWards, 'countermeasure', willFail ? 'failed' : 'active', now.toISOString(), session.id);
}

function _applyCountermeasureTimeout(session, enc) {
  const timeoutActionId = `timeout-counter-${enc.id}`;
  if (enc.counter_action_id) return;

  const wardLoss = 1;
  const newWards = Math.max(0, session.wards_remaining - wardLoss);
  const now = _nowFn();

  _db.prepare(`
    UPDATE bestiary_encounters SET
      counter_action_id = ?,
      counter_choice_id = '__timeout__',
      counter_answered_at = ?,
      counter_correct = 0,
      counter_points = 0,
      flawless_bonus = 0,
      ward_loss = ward_loss + ?
    WHERE id = ?
  `).run(timeoutActionId, now.toISOString(), wardLoss, enc.id);

  const willFail = newWards <= 0;
  _db.prepare(`
    UPDATE bestiary_sessions SET
      wards_remaining = ?,
      current_phase = 'encounter_result',
      status = ?,
      last_active_at = ?
    WHERE id = ?
  `).run(newWards, willFail ? 'failed' : 'active', now.toISOString(), session.id);
}

// ── Public: Advance (countdown→observe or encounter_result→countdown/finished) ─

export function advanceEncounter(sessionId, userId) {
  expireActiveSessions(userId);

  const session = _db.prepare(`SELECT * FROM bestiary_sessions WHERE id = ?`).get(sessionId);
  if (!session) return { notFound: true };
  if (session.user_id !== userId) return { forbidden: true };
  if (session.status !== 'active') return { error: `Sesja ma status '${session.status}'.` };

  const now = _nowFn();

  if (session.current_phase === 'countdown') {
    // Start observe phase for current encounter
    const enc = _db.prepare(`
      SELECT * FROM bestiary_encounters WHERE session_id = ? AND encounter_index = ?
    `).get(sessionId, session.current_encounter);
    if (!enc) return { error: 'Brak spotkania.' };

    // Idempotent: if already in observe, return current state
    if (enc.observe_started_at) {
      return { ok: true, phase: 'observe', observeStartedAt: enc.observe_started_at, observeDeadlineAt: enc.observe_deadline_at };
    }

    const deadline = new Date(now.getTime() + OBSERVE_DEADLINE_MS);
    _db.prepare(`
      UPDATE bestiary_encounters SET observe_started_at = ?, observe_deadline_at = ? WHERE id = ?
    `).run(now.toISOString(), deadline.toISOString(), enc.id);
    _db.prepare(`
      UPDATE bestiary_sessions SET current_phase = 'observe', last_active_at = ? WHERE id = ?
    `).run(now.toISOString(), sessionId);

    return { ok: true, phase: 'observe', observeStartedAt: now.toISOString(), observeDeadlineAt: deadline.toISOString() };
  }

  if (session.current_phase === 'encounter_result') {
    const nextIndex = session.current_encounter + 1;
    if (nextIndex >= MAX_ENCOUNTERS) {
      _db.prepare(`
        UPDATE bestiary_sessions SET current_phase = 'finished', last_active_at = ? WHERE id = ?
      `).run(now.toISOString(), sessionId);
      return { ok: true, phase: 'finished' };
    }

    _db.prepare(`
      UPDATE bestiary_sessions SET current_encounter = ?, current_phase = 'countdown', last_active_at = ? WHERE id = ?
    `).run(nextIndex, now.toISOString(), sessionId);
    return { ok: true, phase: 'countdown', nextEncounter: nextIndex };
  }

  return { error: `Nieprawidłowa faza: ${session.current_phase}` };
}

// ── Public: Submit Identify ───────────────────────────────────────────────────

export function submitIdentify({ sessionId, userId, actionId, choiceId }) {
  if (!actionId || typeof actionId !== 'string' || actionId.length > 100)
    return { error: 'Nieprawidłowy actionId.' };
  if (!choiceId || typeof choiceId !== 'string' || choiceId.length > 100)
    return { error: 'Nieprawidłowy choiceId.' };

  expireActiveSessions(userId);

  const session = _db.prepare(`SELECT * FROM bestiary_sessions WHERE id = ?`).get(sessionId);
  if (!session) return { notFound: true };
  if (session.user_id !== userId) return { forbidden: true };

  // Check idempotency before phase validation so repeated calls return correct duplicate response
  const encForIdem = _db.prepare(`
    SELECT * FROM bestiary_encounters WHERE session_id = ? AND encounter_index = ?
  `).get(sessionId, session.current_encounter);
  if (encForIdem?.identify_action_id) {
    if (encForIdem.identify_action_id === actionId) {
      return { duplicate: true, encounter: sanitizeEncounter(encForIdem, session) };
    }
    return { error: 'To spotkanie zostało już rozliczone.' };
  }

  if (session.status !== 'active') return { error: 'Sesja nieaktywna.' };
  if (session.current_phase !== 'observe') return { error: 'Błędna faza: oczekiwana faza obserwacji.' };

  const enc = encForIdem;
  if (!enc) return { error: 'Brak spotkania.' };

  const options = JSON.parse(enc.identify_options_json || '[]');
  if (!options.includes(choiceId)) return { error: 'Wybrana opcja nie należy do dostępnych odpowiedzi.' };

  const now = _nowFn();
  const deadline = new Date(enc.observe_deadline_at);
  const isTimeout = now > new Date(deadline.getTime() + TRANSPORT_TOLERANCE_MS);

  const seen = isTimeout ? 3 : countCluesSeen(enc.observe_started_at);
  const correct = !isTimeout && choiceId === enc.beast_id;
  const identifyPoints = computeIdentifyPoints(seen, correct);
  const wardLoss = (!correct || isTimeout) ? 1 : 0;

  const result = _db.transaction(() => {
    const fresh = _db.prepare(`SELECT * FROM bestiary_sessions WHERE id = ?`).get(sessionId);
    if (fresh.current_phase !== 'observe') return { phaseChanged: true };

    const newWards = Math.max(0, fresh.wards_remaining - wardLoss);
    const newScore = fresh.score + identifyPoints;
    const counterDeadline = new Date(now.getTime() + COUNTER_DEADLINE_MS);

    _db.prepare(`
      UPDATE bestiary_encounters SET
        identify_action_id = ?,
        identify_choice_id = ?,
        identify_answered_at = ?,
        clues_seen = ?,
        identify_correct = ?,
        identify_points = ?,
        ward_loss = ward_loss + ?,
        counter_started_at = ?,
        counter_deadline_at = ?
      WHERE id = ?
    `).run(
      actionId, choiceId, now.toISOString(), seen,
      correct ? 1 : 0, identifyPoints, wardLoss,
      now.toISOString(), counterDeadline.toISOString(), enc.id
    );

    const willFail = newWards <= 0;
    _db.prepare(`
      UPDATE bestiary_sessions SET
        wards_remaining = ?,
        score = ?,
        current_phase = 'countermeasure',
        status = ?,
        last_active_at = ?
      WHERE id = ?
    `).run(newWards, newScore, willFail ? 'failed' : 'active', now.toISOString(), sessionId);

    return {
      correct,
      isTimeout,
      identifyPoints,
      wardLoss,
      wardsRemaining: newWards,
      score: newScore,
      counterDeadlineAt: counterDeadline.toISOString(),
      failed: willFail
    };
  })();

  if (result.phaseChanged) return { error: 'Faza zmieniła się podczas przetwarzania.' };
  return { ok: true, ...result };
}

// ── Public: Submit Countermeasure ─────────────────────────────────────────────

export function submitCountermeasure({ sessionId, userId, actionId, choiceId }) {
  if (!actionId || typeof actionId !== 'string' || actionId.length > 100)
    return { error: 'Nieprawidłowy actionId.' };
  if (!choiceId || typeof choiceId !== 'string' || choiceId.length > 100)
    return { error: 'Nieprawidłowy choiceId.' };

  expireActiveSessions(userId);

  const session = _db.prepare(`SELECT * FROM bestiary_sessions WHERE id = ?`).get(sessionId);
  if (!session) return { notFound: true };
  if (session.user_id !== userId) return { forbidden: true };

  // Idempotency before phase check
  const encForIdem = _db.prepare(`
    SELECT * FROM bestiary_encounters WHERE session_id = ? AND encounter_index = ?
  `).get(sessionId, session.current_encounter);
  if (encForIdem?.counter_action_id) {
    if (encForIdem.counter_action_id === actionId) {
      return { duplicate: true, encounter: sanitizeEncounter(encForIdem, session) };
    }
    return { error: 'Reakcja obronna dla tego spotkania została już rozliczona.' };
  }

  if (session.status !== 'active') return { error: 'Sesja nieaktywna.' };
  if (session.current_phase !== 'countermeasure') return { error: 'Błędna faza: oczekiwana faza kontrzaklęcia.' };

  const enc = encForIdem;
  if (!enc) return { error: 'Brak spotkania.' };

  const options = JSON.parse(enc.counter_options_json || '[]');
  if (!options.includes(choiceId)) return { error: 'Wybrana opcja nie należy do dostępnych reakcji.' };

  const now = _nowFn();
  const deadline = new Date(enc.counter_deadline_at);
  const isTimeout = now > new Date(deadline.getTime() + TRANSPORT_TOLERANCE_MS);

  const correct = !isTimeout && choiceId === CORRECT_COUNTERMEASURE[enc.beast_id];
  const counterPoints = correct ? 50 : 0;
  const wardLoss = (!correct || isTimeout) ? 1 : 0;

  const result = _db.transaction(() => {
    const fresh = _db.prepare(`SELECT * FROM bestiary_sessions WHERE id = ?`).get(sessionId);
    if (fresh.current_phase !== 'countermeasure') return { phaseChanged: true };

    const identifyCorrect = !!enc.identify_correct;
    const flawless = identifyCorrect && correct;
    const flawlessBonus = flawless ? 25 : 0;

    const newWards = Math.max(0, fresh.wards_remaining - wardLoss);
    const newScore = fresh.score + counterPoints + flawlessBonus;

    _db.prepare(`
      UPDATE bestiary_encounters SET
        counter_action_id = ?,
        counter_choice_id = ?,
        counter_answered_at = ?,
        counter_correct = ?,
        counter_points = ?,
        flawless_bonus = ?,
        ward_loss = ward_loss + ?
      WHERE id = ?
    `).run(
      actionId, choiceId, now.toISOString(),
      correct ? 1 : 0, counterPoints, flawlessBonus, wardLoss, enc.id
    );

    const willFail = newWards <= 0;
    _db.prepare(`
      UPDATE bestiary_sessions SET
        wards_remaining = ?,
        score = ?,
        current_phase = 'encounter_result',
        status = ?,
        last_active_at = ?
      WHERE id = ?
    `).run(newWards, newScore, willFail ? 'failed' : 'active', now.toISOString(), sessionId);

    return {
      correct,
      isTimeout,
      counterPoints,
      flawlessBonus,
      flawless,
      wardLoss,
      wardsRemaining: newWards,
      score: newScore,
      beastId: enc.beast_id,
      beastName: BEAST_CATALOG.find(b => b.id === enc.beast_id)?.name || enc.beast_id,
      failed: willFail
    };
  })();

  if (result.phaseChanged) return { error: 'Faza zmieniła się podczas przetwarzania.' };
  return { ok: true, ...result };
}

// ── Public: Complete Session ──────────────────────────────────────────────────

export function completeSession(sessionId, userId) {
  expireActiveSessions(userId);

  const session = _db.prepare(`SELECT * FROM bestiary_sessions WHERE id = ?`).get(sessionId);
  if (!session) return { notFound: true };
  if (session.user_id !== userId) return { forbidden: true };

  // Idempotency: already finalized
  if (['completed', 'failed'].includes(session.status)) {
    const encounters = _db.prepare(`
      SELECT * FROM bestiary_encounters WHERE session_id = ? ORDER BY encounter_index
    `).all(sessionId);
    const newDisc = _db.prepare(`
      SELECT beast_id FROM bestiary_discoveries WHERE user_id = ? AND source_session_id = ?
    `).all(userId, sessionId).map(d => d.beast_id);

    return {
      ok: true,
      duplicate: true,
      status: session.status,
      score: session.score,
      rewardHousePoints: session.reward_house_points,
      rewardSkirnirs: session.reward_skirnirs,
      rewarded: !!session.rewarded,
      mode: session.mode,
      wardsRemaining: session.wards_remaining,
      newDiscoveries: newDisc,
      encounters: encounters.map(e => ({
        beastId: e.beast_id,
        beastName: BEAST_CATALOG.find(b => b.id === e.beast_id)?.name || e.beast_id,
        identifyCorrect: !!e.identify_correct,
        identifyPoints: e.identify_points || 0,
        cluesSeen: e.clues_seen,
        counterCorrect: !!e.counter_correct,
        counterPoints: e.counter_points || 0,
        flawlessBonus: e.flawless_bonus || 0,
        wardLoss: e.ward_loss || 0
      }))
    };
  }

  if (!['active'].includes(session.status)) {
    return { error: `Nie można zakończyć sesji o statusie '${session.status}'.` };
  }

  const encounters = _db.prepare(`
    SELECT * FROM bestiary_encounters WHERE session_id = ? ORDER BY encounter_index
  `).all(sessionId);

  const failed = session.wards_remaining <= 0;
  if (!failed) {
    const allDone = encounters.every(e => e.counter_action_id !== null);
    if (!allDone) return { error: 'Ekspedycja nie jest jeszcze ukończona — pozostały nierozliczone spotkania.' };
  }

  const sumScore = encounters.reduce((s, e) =>
    s + (e.identify_points || 0) + (e.counter_points || 0) + (e.flawless_bonus || 0), 0);
  const finalScore = Math.min(700, Math.max(0, sumScore));
  const finalStatus = failed ? 'failed' : 'completed';

  const canReward = !failed && session.mode === 'rewarded';
  const rawReward = canReward ? computeReward(finalScore) : { housePoints: 0, skirnirs: 0 };

  // House points require a valid Zakon — resolve before writing to session
  const userForReward = _db.prepare(`SELECT house FROM users WHERE id = ?`).get(userId);
  const hasValidHouse = userForReward?.house && VALID_HOUSES.includes(userForReward.house);
  const { housePoints, skirnirs } = {
    housePoints: hasValidHouse ? rawReward.housePoints : 0,
    skirnirs: rawReward.skirnirs
  };

  const txResult = _db.transaction(() => {
    const fresh = _db.prepare(`SELECT * FROM bestiary_sessions WHERE id = ?`).get(sessionId);
    if (['completed', 'failed'].includes(fresh.status)) return { duplicate: true };

    _db.prepare(`
      UPDATE bestiary_sessions SET
        status = ?,
        score = ?,
        reward_house_points = ?,
        reward_skirnirs = ?,
        rewarded = ?,
        completed_at = ?,
        last_active_at = ?
      WHERE id = ?
    `).run(
      finalStatus, finalScore, housePoints, skirnirs,
      (housePoints > 0 || skirnirs > 0) ? 1 : 0,
      _nowFn().toISOString(), _nowFn().toISOString(), sessionId
    );

    // Unlock discoveries for flawless encounters
    for (const enc of encounters) {
      if (enc.identify_correct && enc.counter_correct) {
        _db.prepare(`
          INSERT OR IGNORE INTO bestiary_discoveries
            (user_id, beast_id, field_note_unlocked, unlocked_at, source_session_id)
          VALUES (?, ?, 1, ?, ?)
        `).run(userId, enc.beast_id, _nowFn().toISOString(), sessionId);
      }
    }

    return { ok: true };
  })();

  if (txResult.duplicate) {
    return completeSession(sessionId, userId); // recurse once for idempotent result
  }

  // Award points and Skirniry (each service handles its own idempotency)
  const baseKey = `bestiary:${sessionId}`;
  if (canReward && (housePoints > 0 || skirnirs > 0)) {
    const userRow = _db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId);

    if (housePoints > 0 && userRow?.house && VALID_HOUSES.includes(userRow.house)) {
      try {
        awardPoints({
          studentId: userId,
          studentName: userRow.full_name || userRow.username,
          house: userRow.house,
          points: housePoints,
          source: `Bestiariusz Północy — Wynik badawczy: ${finalScore} pkt`,
          sourceType: 'MINIGAME',
          sourceId: sessionId,
          actorId: userId,
          actorName: userRow.full_name || userRow.username,
          idempotencyKey: `${baseKey}:pts`
        });
      } catch (e) {
        console.error('[Bestiary] awardPoints failed:', e.message);
        throw e;
      }
    }

    if (skirnirs > 0) {
      const userRow2 = _db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId);
      try {
        creditSkirnir({
          userId,
          userName: userRow2?.full_name || userRow2?.username || '',
          amount: skirnirs,
          category: 'nagroda',
          title: `Bestiariusz Północy — Wynik badawczy: ${finalScore} pkt`,
          sourceType: 'MINIGAME',
          sourceId: sessionId,
          actorId: userId,
          actorName: userRow2?.full_name || userRow2?.username || '',
          idempotencyKey: `${baseKey}:skr`
        });
      } catch (e) {
        console.error('[Bestiary] creditSkirnir failed:', e.message);
        throw e;
      }
    }
  }

  const newDisc = _db.prepare(`
    SELECT beast_id FROM bestiary_discoveries WHERE user_id = ? AND source_session_id = ?
  `).all(userId, sessionId).map(d => d.beast_id);

  return {
    ok: true,
    status: finalStatus,
    score: finalScore,
    rewardHousePoints: housePoints,
    rewardSkirnirs: skirnirs,
    rewarded: housePoints > 0 || skirnirs > 0,
    mode: session.mode,
    wardsRemaining: session.wards_remaining,
    newDiscoveries: newDisc,
    encounters: encounters.map(e => ({
      beastId: e.beast_id,
      beastName: BEAST_CATALOG.find(b => b.id === e.beast_id)?.name || e.beast_id,
      identifyCorrect: !!e.identify_correct,
      identifyPoints: e.identify_points || 0,
      cluesSeen: e.clues_seen,
      counterCorrect: !!e.counter_correct,
      counterPoints: e.counter_points || 0,
      flawlessBonus: e.flawless_bonus || 0,
      wardLoss: e.ward_loss || 0
    }))
  };
}

// ── Public: Abandon ───────────────────────────────────────────────────────────

export function abandonSession(sessionId, userId) {
  const session = _db.prepare(`SELECT * FROM bestiary_sessions WHERE id = ?`).get(sessionId);
  if (!session) return { notFound: true };
  if (session.user_id !== userId) return { forbidden: true };

  if (session.status !== 'active') {
    return { ok: true, alreadyDone: true, status: session.status };
  }

  _db.prepare(`
    UPDATE bestiary_sessions SET
      status = 'abandoned',
      completed_at = ?,
      last_active_at = ?
    WHERE id = ?
  `).run(_nowFn().toISOString(), _nowFn().toISOString(), sessionId);

  return { ok: true, status: 'abandoned' };
}

// ── Public: Discoveries ───────────────────────────────────────────────────────

export function getDiscoveries(userId) {
  return _db.prepare(`SELECT * FROM bestiary_discoveries WHERE user_id = ?`).all(userId);
}
