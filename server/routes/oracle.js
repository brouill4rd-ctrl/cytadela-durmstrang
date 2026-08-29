import { Router } from 'express';
import { randomUUID } from 'crypto';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { awardPoints } from '../services/pointsService.js';

const router = Router();

// Migration
db.exec(`
  CREATE TABLE IF NOT EXISTS oracle_rituals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    cast_at TEXT NOT NULL DEFAULT (datetime('now')),
    date_server TEXT NOT NULL,
    week_key TEXT NOT NULL,
    runes_json TEXT NOT NULL,
    sum_value INTEGER NOT NULL,
    base_points INTEGER NOT NULL,
    bonus_points INTEGER NOT NULL DEFAULT 0,
    total_points_awarded INTEGER NOT NULL,
    bad_luck_active INTEGER NOT NULL DEFAULT 0,
    special_layout TEXT DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);
try {
  db.exec(`CREATE INDEX IF NOT EXISTS idx_oracle_user_date ON oracle_rituals(user_id, date_server)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_oracle_user_week ON oracle_rituals(user_id, week_key)`);
} catch (_) {}

function getServerDate() {
  return new Date().toISOString().slice(0, 10);
}

function getMondayKey(date = new Date()) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

const RUNE_POOL = [
  { symbol: 'ᚢ', name: 'Uruz (Pierwotna Siła)' },
  { symbol: 'ᚦ', name: 'Thurisaz (Płonący Cierń)' },
  { symbol: 'ᛋ', name: 'Sowilo (Słoneczny Triumf)' },
  { symbol: 'ᚨ', name: 'Ansuz (Głos Bogów)' },
  { symbol: 'ᚱ', name: 'Raidho (Wielka Wyprawa)' },
  { symbol: 'ᛏ', name: 'Tiwaz (Sprawiedliwy Miecz)' }
];

const NORN_ROLES = [
  { role: 'Przeszłość (Urd)', key: 'urd' },
  { role: 'Teraźniejszość (Verdandi)', key: 'verdandi' },
  { role: 'Przyszłość (Skuld)', key: 'skuld' }
];

const ORIENTATIONS = [
  { key: 'reversed', label: 'Odwrócona', value: -1, weight: 25 },
  { key: 'neutral', label: 'Neutralna', value: 0, weight: 35 },
  { key: 'straight', label: 'Prosta', value: 1, weight: 35 },
  { key: 'golden', label: 'Złota', value: 2, weight: 5 }
];

function drawOrientation() {
  const r = Math.random() * 100;
  let cumulative = 0;
  for (const o of ORIENTATIONS) {
    cumulative += o.weight;
    if (r < cumulative) return o;
  }
  return ORIENTATIONS[2];
}

const INTERPRETATIONS = {
  urd: {
    reversed: ['Cień przeszłości tłumi Twój płomień.', 'Dawne rany nie zdążyły się zagoić.', 'Błędy z przeszłości wciąż ciążą na Twych krokach.'],
    neutral: ['Przeszłość trwa w ciszy, nie osądza.', 'Dawne dni są zamknięte — ani klatka, ani skrzydło.', 'Wspomnienia śpią spokojnie pod lodem.'],
    straight: ['Dawne próby hartują Twego ducha jak nordycka stal.', 'Przeszłość jest Twą tarczą, nie ciężarem.', 'Korzenie sięgają głęboko — moc pochodzi z dawna.'],
    golden: ['Przeszłość promienieje — jesteś dziedzictwem wielkich czynów.', 'Złote nici Urd splatają Twoją historię ze starożytną mądrością.']
  },
  verdandi: {
    reversed: ['Obecna chwila Cię przytłacza — oddech i krok do tyłu.', 'Teraźniejszość stawia Ci opór — nie walcz z prądem.', 'Splątane nici chwili obecnej.'],
    neutral: ['Chwila jest w równowadze — obserwuj uważnie.', 'Verdandi przędzie w skupieniu, bez pośpiechu.', 'Teraźniejszość jest otwarta — Ty piszesz jej treść.'],
    straight: ['Teraźniejszość należy do Ciebie — działaj odważnie.', 'Verdandi prowadzi Twe ręce ku właściwemu celowi.', 'Bieżąca chwila sprzyja Twym działaniom.'],
    golden: ['Verdandi złoci nici Twego losu — to wyjątkowy czas.', 'Teraźniejszość rozkwita złotym blaskiem — chwytaj ją.']
  },
  skuld: {
    reversed: ['Skuld widzi ciernie na drodze przed Tobą.', 'Przyszłość ostrzega: uważaj na zbyt szybkie decyzje.', 'Mgła zasłania przeznaczenie — bądź cierpliwy.'],
    neutral: ['Przyszłość jest niezapisana — Twoje działania ją kształtują.', 'Skuld milczy — Twój los jest w Twoich rękach.', 'Przeznaczenie czeka, niespieszne jak polarny świt.'],
    straight: ['Skuld przędzie świetlaną nić ku zwycięstwu.', 'Przyszłość zwiastuje chwałę i uznanie wśród mistrzów.', 'Przeznaczenie sprzyja — idź naprzód bez lęku.'],
    golden: ['Skuld złoci Twą przyszłość — wielkość jest Ci przeznaczona.', 'Złota nić przeznaczenia wiedzie ku niezwykłym osiągnięciom.']
  }
};

function getInterpretation(nornKey, orientationKey) {
  const pool = INTERPRETATIONS[nornKey][orientationKey];
  return pool[Math.floor(Math.random() * pool.length)];
}

const PROPHECIES = {
  triple_reversed: [
    'Próba Przeznaczenia nawiedza Cię tej nocy. Trzy odwrócone runy znaczą ścieżkę pokory i wytrwałości. Norny obserwują — powróć silniejszy.',
    'Mroczna przepowiednia trzech Nornen: wszystkie nici odwrócone. To nie klęska, lecz inicjacja. Opór jest częścią przeznaczenia.'
  ],
  triple_golden: [
    'Trzy złote runy — cud Yggdrasilu! Norny śpiewają Twe imię pod korzeniami Drzewa Świata. Los Twój jest wyjątkowy ponad miarę.',
    'Złoty układ trzech Nornen — znak wybrańca. Odyn sam zwraca wzrok ku Twej drodze.'
  ],
  high: [
    'Przeznaczenie uśmiecha się ku Tobie. Droga przed Tobą jaśnieje — uchwyć ten czas i działaj z pełną mocą.',
    'Norny przędą złotą nić dla Ciebie. Nadchodzące dni przyniosą owoce Twych starań.',
    'Wiatr przeznaczenia wieje w Twe żagle. Chwytaj tę chwilę oburącz.'
  ],
  medium: [
    'Los mówi o równowadze — ni triumf, ni klęska. Droga wiedzie przez cień, lecz wychodzi na światło.',
    'Nici przeznaczenia splecione w węzeł neutralny. Twoje działania przesądzą o kierunku.',
    'Norny obserwują w milczeniu. Splot jest otwarty — to Ty nadasz mu kształt.'
  ],
  low: [
    'Przeznaczenie rzuca cień na Twą drogę. Norny ostrzegają: czas na refleksję, nie pochopne działania.',
    'Nici losu są splątane. Cierpliwość i wytrwałość to Twoja broń na nadchodzące dni.',
    'Ciemniejszy splot, lecz nie beznadziejny. Skuld widzi dalej niż Ty — ufaj procesowi.'
  ]
};

function getFinalProphecy(sumValue, specialLayout) {
  if (specialLayout === 'triple_reversed') {
    const pool = PROPHECIES.triple_reversed;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  if (specialLayout === 'triple_golden') {
    const pool = PROPHECIES.triple_golden;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  if (sumValue >= 3) return PROPHECIES.high[Math.floor(Math.random() * PROPHECIES.high.length)];
  if (sumValue >= 0) return PROPHECIES.medium[Math.floor(Math.random() * PROPHECIES.medium.length)];
  return PROPHECIES.low[Math.floor(Math.random() * PROPHECIES.low.length)];
}

function getBasePoints(sumValue) {
  if (sumValue <= -2) return 0;
  if (sumValue === -1) return 1;
  if (sumValue === 0) return 2;
  if (sumValue === 1) return 3;
  if (sumValue === 2) return 4;
  if (sumValue === 3) return 5;
  return 6;
}

function drawRunes(badLuckActive) {
  const draw = () => NORN_ROLES.map((norn) => {
    const runeBase = RUNE_POOL[Math.floor(Math.random() * RUNE_POOL.length)];
    const orientation = drawOrientation();
    return {
      ...runeBase,
      role: norn.role,
      nornKey: norn.key,
      orientation: orientation.key,
      orientationLabel: orientation.label,
      value: orientation.value,
      interpretation: getInterpretation(norn.key, orientation.key)
    };
  });

  if (!badLuckActive) return draw();

  let runes = draw();
  let attempts = 0;
  while (getBasePoints(runes.reduce((s, r) => s + r.value, 0)) < 3 && attempts < 60) {
    runes = draw();
    attempts++;
  }
  return runes;
}

// GET /api/oracle/status
router.get('/status', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const today = getServerDate();
    const weekKey = getMondayKey();

    const todayRitual = db.prepare(
      'SELECT * FROM oracle_rituals WHERE user_id = ? AND date_server = ? ORDER BY cast_at DESC LIMIT 1'
    ).get(userId, today);

    const weeklySum = db.prepare(
      'SELECT COALESCE(SUM(total_points_awarded), 0) as total FROM oracle_rituals WHERE user_id = ? AND week_key = ?'
    ).get(userId, weekKey)?.total || 0;

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    const secondsToMidnight = Math.floor((tomorrow - now) / 1000);

    res.json({
      alreadyCastToday: !!todayRitual,
      todayRitual: todayRitual ? {
        ...todayRitual,
        runesData: JSON.parse(todayRitual.runes_json)
      } : null,
      weeklyPoints: weeklySum,
      weeklyLimit: 20,
      secondsToMidnight
    });
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania statusu wyroczni: ' + err.message });
  }
});

// POST /api/oracle/cast
router.post('/cast', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!userRow) return res.status(404).json({ error: 'Użytkownik nie istnieje.' });

    const today = getServerDate();
    const weekKey = getMondayKey();

    let result;
    result = db.transaction(() => {
      const existing = db.prepare(
        'SELECT id FROM oracle_rituals WHERE user_id = ? AND date_server = ?'
      ).get(userId, today);
      if (existing) throw new Error('ALREADY_CAST');

      const weeklySum = db.prepare(
        'SELECT COALESCE(SUM(total_points_awarded), 0) as total FROM oracle_rituals WHERE user_id = ? AND week_key = ?'
      ).get(userId, weekKey)?.total || 0;
      const weeklyCapReached = weeklySum >= 20;
      const weeklyRemaining = Math.max(0, 20 - weeklySum);

      const lastThree = db.prepare(
        'SELECT total_points_awarded FROM oracle_rituals WHERE user_id = ? ORDER BY cast_at DESC LIMIT 3'
      ).all(userId);
      const badLuckActive = !weeklyCapReached
        && lastThree.length === 3
        && lastThree.every(r => r.total_points_awarded <= 1);

      const runes = drawRunes(badLuckActive);
      const sumValue = runes.reduce((s, r) => s + r.value, 0);
      const basePoints = weeklyCapReached ? 0 : getBasePoints(sumValue);

      // Detect special layout (priority order matters)
      let specialLayout = null;
      if (runes.every(r => r.orientation === 'reversed')) specialLayout = 'triple_reversed';
      else if (runes.every(r => r.orientation === 'golden')) specialLayout = 'triple_golden';
      else if (runes.every(r => r.symbol === runes[0].symbol)) specialLayout = 'same_symbol';
      else if (runes.every(r => r.orientation === 'straight')) specialLayout = 'three_straight';
      else if (runes[2].orientation === 'golden') specialLayout = 'skuld_golden';

      // Bonus (max 1, no bonus on triple_reversed)
      let bonusPoints = 0;
      if (!weeklyCapReached && specialLayout !== 'triple_reversed' && specialLayout !== null) {
        bonusPoints = 1;
      }

      const totalBeforeCap = specialLayout === 'triple_reversed' ? 0 : Math.min(7, basePoints + bonusPoints);
      const totalAwarded = Math.min(totalBeforeCap, weeklyRemaining);

      const prophecy = getFinalProphecy(sumValue, specialLayout);
      const runesData = { runes, prophecy, sumValue, basePoints, bonusPoints, totalAwarded, specialLayout, badLuckActive, weeklyCapReached };

      const ritualId = `oracle-${userId.slice(-6)}-${Date.now()}-${randomUUID().slice(0, 4)}`;

      db.prepare(`
        INSERT INTO oracle_rituals (id, user_id, cast_at, date_server, week_key, runes_json, sum_value, base_points, bonus_points, total_points_awarded, bad_luck_active, special_layout)
        VALUES (?, ?, datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        ritualId, userId, today, weekKey,
        JSON.stringify(runesData),
        sumValue, basePoints, bonusPoints, totalAwarded,
        badLuckActive ? 1 : 0,
        specialLayout || null
      );

      if (totalAwarded > 0) {
        awardPoints({
          studentId: userId,
          studentName: userRow.full_name,
          house: userRow.house || 'ravnheim',
          points: totalAwarded,
          source: 'Wyrocznia Przeznaczenia — Rytuał Trzech Nornen',
          sourceType: 'ORACLE',
          sourceId: ritualId,
          actorId: 'oracle',
          actorName: 'Wyrocznia Przeznaczenia',
          idempotencyKey: `oracle-${ritualId}`
        });
      }

      return { ...runesData, ritualId, weeklyPoints: weeklySum + totalAwarded, weeklyLimit: 20 };
    })();

    res.json({ success: true, ...result });
  } catch (err) {
    if (err.message === 'ALREADY_CAST') {
      return res.status(409).json({ error: 'Norny przemówiły już dzisiaj. Rytuał może być odprawiony tylko raz na dobę.' });
    }
    console.error('[Oracle] cast error:', err);
    res.status(500).json({ error: 'Błąd rytuału: ' + err.message });
  }
});

export default router;
