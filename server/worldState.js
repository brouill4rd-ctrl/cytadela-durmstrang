import db from './db.js';

export const ENUMS = {
  timeOfDay: ['DAWN', 'DAY', 'DUSK', 'NIGHT'],
  seasonalCycle: ['NORMAL', 'POLAR_DAY', 'POLAR_NIGHT'],
  weather: ['CLEAR', 'CLOUDY', 'FOG', 'SNOWFALL', 'HEAVY_SNOW', 'BLIZZARD', 'FREEZING_RAIN', 'STORM'],
  moonPhase: ['NEW_MOON', 'WAXING_CRESCENT', 'FIRST_QUARTER', 'WAXING_GIBBOUS', 'FULL_MOON', 'WANING_GIBBOUS', 'LAST_QUARTER', 'WANING_CRESCENT'],
  citadelState: ['NORMAL', 'VIGILANCE', 'CEREMONY', 'CELEBRATION', 'MOURNING', 'ALERT', 'LOCKDOWN', 'SIEGE'],
  threatLevel: ['I', 'II', 'III', 'IV', 'V'],
  presentationMode: ['FULL', 'BALANCED', 'QUIET']
};

const DEFAULTS = {
  weather: 'SNOWFALL', temperature: -11, windDirection: 'NE', windIntensity: 2,
  citadelState: 'NORMAL', threatLevel: 'I', skyState: 'AURORA', seaState: 'CALM',
  narrativeReport: 'Nad murami Cytadeli trwa spokojna, śnieżna warta.', ceremonialMode: false
};

db.exec(`
  CREATE TABLE IF NOT EXISTS world_state (
    id TEXT PRIMARY KEY CHECK (id = 'current'), weather TEXT NOT NULL, temperature REAL NOT NULL,
    wind_direction TEXT NOT NULL, wind_intensity INTEGER NOT NULL, citadel_state TEXT NOT NULL,
    threat_level TEXT NOT NULL, sky_state TEXT NOT NULL, sea_state TEXT NOT NULL,
    narrative_report TEXT NOT NULL, ceremonial_mode INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS world_overrides (
    id TEXT PRIMARY KEY, field TEXT NOT NULL, value_json TEXT NOT NULL, starts_at TEXT NOT NULL,
    ends_at TEXT, priority INTEGER NOT NULL DEFAULT 100, reason TEXT, created_by TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS world_schedules (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, changes_json TEXT NOT NULL, starts_at TEXT NOT NULL,
    ends_at TEXT, priority INTEGER NOT NULL DEFAULT 50, created_by TEXT NOT NULL, created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS world_effects (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL, config_json TEXT NOT NULL DEFAULT '{}',
    conditions_json TEXT NOT NULL DEFAULT '[]', starts_at TEXT, ends_at TEXT, enabled INTEGER NOT NULL DEFAULT 1,
    source_event_id TEXT, created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS world_scars (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL, type TEXT NOT NULL,
    location TEXT, visual_variant TEXT, source_event_id TEXT, visible_from TEXT NOT NULL,
    visible_until TEXT, visibility TEXT NOT NULL DEFAULT 'PUBLIC', archive_reference TEXT, created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS world_state_history (
    id TEXT PRIMARY KEY, timestamp TEXT NOT NULL, actor_id TEXT, actor_name TEXT NOT NULL,
    field TEXT NOT NULL, previous_json TEXT, next_json TEXT NOT NULL, reason TEXT, source TEXT NOT NULL
  );
`);

const nowIso = () => new Date().toISOString();
db.prepare(`INSERT OR IGNORE INTO world_state VALUES ('current',?,?,?,?,?,?,?,?,?,?,?)`).run(
  DEFAULTS.weather, DEFAULTS.temperature, DEFAULTS.windDirection, DEFAULTS.windIntensity,
  DEFAULTS.citadelState, DEFAULTS.threatLevel, DEFAULTS.skyState, DEFAULTS.seaState,
  DEFAULTS.narrativeReport, 0, nowIso()
);

for (const [column, definition] of [
  ['starts_at', "TEXT"], ['ends_at', 'TEXT'], ['world_changes', "TEXT DEFAULT '{}'"], ['is_world_event', 'INTEGER DEFAULT 0']
]) {
  const cols = db.pragma('table_info(events)');
  if (!cols.some(c => c.name === column)) db.exec(`ALTER TABLE events ADD COLUMN ${column} ${definition}`);
}

export function deriveTime(date = new Date()) {
  const h = date.getHours();
  return h < 6 ? 'NIGHT' : h < 9 ? 'DAWN' : h < 18 ? 'DAY' : h < 21 ? 'DUSK' : 'NIGHT';
}

export function deriveMoonPhase(date = new Date()) {
  const cycle = 29.53058867;
  const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14);
  const age = ((date.getTime() - knownNewMoon) / 86400000 % cycle + cycle) % cycle;
  return ENUMS.moonPhase[Math.floor((age + cycle / 16) / (cycle / 8)) % 8];
}

const RUNES = [
  ['FEHU','ᚠ','Runa początku, zasobu i odpowiedzialności.'], ['URUZ','ᚢ','Runa siły, wytrwałości i przemiany.'],
  ['THURISAZ','ᚦ','Runa progu, ochrony i ostrożności.'], ['ANSUZ','ᚨ','Runa głosu, wiedzy i objawienia.'],
  ['RAIDO','ᚱ','Runa drogi, rytmu i właściwego kierunku.'], ['KENAZ','ᚲ','Runa światła, rzemiosła i poznania.'],
  ['GEBO','ᚷ','Runa daru, więzi i równowagi.'], ['WUNJO','ᚹ','Runa wspólnoty, harmonii i spełnienia.'],
  ['HAGALAZ','ᚺ','Runa nagłej zmiany i sił natury.'], ['NAUTHIZ','ᚾ','Runa potrzeby, dyscypliny i cierpliwości.'],
  ['ISA','ᛁ','Runa lodu, zatrzymania i zachowania.'], ['JERA','ᛃ','Runa cyklu, plonu i konsekwencji.']
];

export function runeForDate(date = new Date()) {
  const key = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86400000;
  const [name, symbol, description] = RUNES[Math.abs(Math.floor(key)) % RUNES.length];
  return { name, symbol, description, interpretation: description, date: date.toISOString().slice(0, 10), source: 'AUTO' };
}

const parse = (value, fallback) => { try { return JSON.parse(value); } catch { return fallback; } };
const compare = (actual, operator, expected) => {
  if (operator === 'EQ') return actual === expected;
  if (operator === 'NEQ') return actual !== expected;
  if (operator === 'IN') return Array.isArray(expected) && expected.includes(actual);
  const a = typeof actual === 'string' && ENUMS.threatLevel.includes(actual) ? ENUMS.threatLevel.indexOf(actual) + 1 : Number(actual);
  const b = typeof expected === 'string' && ENUMS.threatLevel.includes(expected) ? ENUMS.threatLevel.indexOf(expected) + 1 : Number(expected);
  return operator === 'GTE' ? a >= b : operator === 'LTE' ? a <= b : operator === 'GT' ? a > b : operator === 'LT' ? a < b : false;
};

export function conditionsMatch(conditions = [], state = {}) {
  return conditions.every(c => Object.hasOwn(state, c.field) && compare(state[c.field], c.operator || 'EQ', c.value));
}

export function getWorldState(at = new Date()) {
  const now = at.toISOString();
  const base = db.prepare("SELECT * FROM world_state WHERE id='current'").get();
  const state = {
    timeOfDay: deriveTime(at), seasonalCycle: 'NORMAL', weather: base.weather,
    temperature: base.temperature, windDirection: base.wind_direction, windIntensity: base.wind_intensity,
    moonPhase: deriveMoonPhase(at), skyState: base.sky_state, seaState: base.sea_state,
    runeOfTheDay: runeForDate(at), citadelState: base.citadel_state, threatLevel: base.threat_level,
    narrativeReport: base.narrative_report, ceremonialMode: !!base.ceremonial_mode, updatedAt: base.updated_at
  };
  const applied = [];
  const schedules = db.prepare("SELECT * FROM world_schedules WHERE starts_at <= ? AND (ends_at IS NULL OR ends_at > ?) ORDER BY priority ASC, starts_at ASC").all(now, now);
  for (const row of schedules) { Object.assign(state, parse(row.changes_json, {})); applied.push({ id: row.id, source: 'SCHEDULE', name: row.name }); }
  const overrides = db.prepare("SELECT * FROM world_overrides WHERE starts_at <= ? AND (ends_at IS NULL OR ends_at > ?) ORDER BY priority ASC, starts_at ASC").all(now, now);
  for (const row of overrides) { state[row.field] = parse(row.value_json, null); applied.push({ id: row.id, source: 'MANUAL', field: row.field }); }
  const events = db.prepare("SELECT * FROM events WHERE is_world_event=1 AND starts_at <= ? AND (ends_at IS NULL OR ends_at > ?)").all(now, now);
  for (const event of events) Object.assign(state, parse(event.world_changes, {}));
  state.activeEvents = events.map(e => ({ id: e.id, title: e.title, description: e.description, startsAt: e.starts_at, endsAt: e.ends_at }));
  state.activeHoliday = events.find(e => e.type?.toLowerCase().includes('świę')) || null;
  state.appliedSources = applied;
  const effectRows = db.prepare("SELECT * FROM world_effects WHERE enabled=1 AND (starts_at IS NULL OR starts_at <= ?) AND (ends_at IS NULL OR ends_at > ?)").all(now, now);
  state.activeEffects = effectRows.filter(e => conditionsMatch(parse(e.conditions_json, []), state)).map(e => ({ id:e.id, name:e.name, type:e.type, config:parse(e.config_json,{}) }));
  state.worldScars = db.prepare("SELECT * FROM world_scars WHERE visible_from <= ? AND (visible_until IS NULL OR visible_until > ?) AND visibility='PUBLIC'").all(now, now).map(s => ({ id:s.id,name:s.name,description:s.description,type:s.type,location:s.location,visualVariant:s.visual_variant,sourceEventId:s.source_event_id,visibleFrom:s.visible_from,visibleUntil:s.visible_until,archiveReference:s.archive_reference }));
  return state;
}

export function validateChanges(changes) {
  const allowed = new Set(['timeOfDay','seasonalCycle','weather','temperature','windDirection','windIntensity','moonPhase','runeOfTheDay','skyState','seaState','citadelState','threatLevel','narrativeReport','ceremonialMode']);
  for (const [field, value] of Object.entries(changes || {})) {
    if (!allowed.has(field)) throw new Error(`Niedozwolone pole: ${field}`);
    if (ENUMS[field] && !ENUMS[field].includes(value)) throw new Error(`Nieprawidłowa wartość ${field}: ${value}`);
    if (field === 'temperature' && (!Number.isFinite(Number(value)) || Number(value) < -80 || Number(value) > 50)) throw new Error('Temperatura poza zakresem.');
    if (field === 'windIntensity' && (!Number.isInteger(Number(value)) || value < 0 || value > 5)) throw new Error('Intensywność wiatru musi wynosić 0–5.');
  }
  return changes;
}

export function addHistory({ actor, field, previous, next, reason, source='MANUAL' }) {
  db.prepare('INSERT INTO world_state_history VALUES (?,?,?,?,?,?,?,?,?)').run(`wh-${Date.now()}-${Math.random()}`, nowIso(), actor?.id || null, actor?.fullName || actor?.username || 'System', field, JSON.stringify(previous), JSON.stringify(next), reason || null, source);
}
