import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useSchool } from '../context/SchoolContext';
import { useWorldState } from '../context/WorldStateContext';

// ─── Lookup tables ────────────────────────────────────────────────────────────
const PL = {
  NIGHT: 'NOC', DAY: 'DZIEŃ', DAWN: 'ŚWIT', DUSK: 'ZMIERZCH',
  POLAR_NIGHT: 'NOC POLARNA', POLAR_DAY: 'DZIEŃ POLARNY',
  SNOWFALL: 'OPAD ŚNIEGU', HEAVY_SNOW: 'ŚNIEŻYCA', BLIZZARD: 'ZAMIEĆ',
  CLEAR: 'BEZCHMURNIE', CLOUDY: 'POCHMURNO', FOG: 'MGŁA',
  FREEZING_RAIN: 'MARZNĄCY DESZCZ', STORM: 'BURZA',
  FULL_MOON: 'PEŁNIA', WAXING_CRESCENT: 'PRZYBYWAJĄCY SIERP',
  NEW_MOON: 'NOWIE', WANING_CRESCENT: 'ZANIKAJĄCY SIERP',
  FIRST_QUARTER: 'PIERWSZA KWADRA', LAST_QUARTER: 'OSTATNIA KWADRA',
  WAXING_GIBBOUS: 'PRZYBYWAJĄCY GARB', WANING_GIBBOUS: 'ZANIKAJĄCY GARB',
  NORMAL: 'SPOKÓJ', VIGILANCE: 'CZUJNOŚĆ', CEREMONY: 'CEREMONIA',
  ALERT: 'ALARM', LOCKDOWN: 'ZAMKNIĘCIE', SIEGE: 'OBLĘŻENIE',
  MOURNING: 'ŻAŁOBA', CELEBRATION: 'ŚWIĘTOWANIE',
};

const WEATHER_ICON = {
  CLEAR: '✦', CLOUDY: '☁', FOG: '≋', SNOWFALL: '❄',
  HEAVY_SNOW: '❆', BLIZZARD: '⚡', FREEZING_RAIN: '☔', STORM: '⛈',
};

const TIME_ICON = {
  DAWN: '◐', DAY: '☀', DUSK: '◑', NIGHT: '☾', POLAR_NIGHT: '✦', POLAR_DAY: '◉',
};

const MOON_ICON = {
  NEW_MOON: '🌑', WAXING_CRESCENT: '🌒', FIRST_QUARTER: '🌓',
  WAXING_GIBBOUS: '🌔', FULL_MOON: '🌕', WANING_GIBBOUS: '🌖',
  LAST_QUARTER: '🌗', WANING_CRESCENT: '🌘',
};

const THREAT_LABEL = {
  I: 'SPOKÓJ', II: 'CZUJNOŚĆ', III: 'NIEPOKÓJ', IV: 'ALARM', V: 'OBLĘŻENIE',
};

const label   = v => PL[v] || String(v || '—').replaceAll('_', ' ');
const wIcon   = v => WEATHER_ICON[v] || '✦';
const mIcon   = v => MOON_ICON[v] || '☽';
const tIcon   = w => {
  const key = w.seasonalCycle !== 'NORMAL' ? w.seasonalCycle : w.timeOfDay;
  return TIME_ICON[key] || '☾';
};

// ─── Wind bar ────────────────────────────────────────────────────────────────
function WindBar({ intensity }) {
  const n = Math.max(0, Math.min(5, Number(intensity) || 0));
  return (
    <span className="astro-wind-bar">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < n ? 'wbar-on' : 'wbar-off'}>▪</span>
      ))}
    </span>
  );
}

// ─── CitadelAstrolabe (floating button + report) ──────────────────────────────
export function CitadelAstrolabe({ hidden = false }) {
  const { worldState: w, presentationMode, setPresentationMode, refresh } = useWorldState();
  const { currentUser } = useSchool();
  const [open, setOpen]       = useState(false);
  const [director, setDirector] = useState(false);
  if (hidden) return null;

  const timeDisplay = w.seasonalCycle !== 'NORMAL' ? w.seasonalCycle : w.timeOfDay;
  const threatHigh  = w.threatLevel === 'IV' || w.threatLevel === 'V';

  return (
    <>
      {/* ── Floating instrument button ── */}
      <button
        className={`world-astrolabe threat-${w.threatLevel}`}
        onClick={() => setOpen(true)}
        aria-label="Otwórz raport Stanu Cytadeli"
      >
        <span className="astro-cell astro-cell--time">
          <span className="astro-icon">{tIcon(w)}</span>
          <span className="astro-icon astro-icon--weather">{wIcon(w.weather)}</span>
        </span>
        <span className="astro-divider" />
        <span className="astro-cell">
          <span className="astro-temp">{Math.round(w.temperature)}°</span>
        </span>
        <span className="astro-divider" />
        <span className="astro-cell astro-cell--rune">
          <span className="astro-rune-sym">{w.runeOfTheDay?.symbol || 'ᛁ'}</span>
          <strong className="astro-rune-name">{w.runeOfTheDay?.name || '—'}</strong>
        </span>
        <span className="astro-divider" />
        <b className={`astro-threat ${threatHigh ? 'astro-threat--high' : ''}`}>{w.threatLevel}</b>
      </button>

      {/* ── Report modal ── */}
      {open && (
        <div className="world-modal-backdrop" onClick={() => setOpen(false)}>
          <section
            className={`world-report world-report--${(w.citadelState || 'normal').toLowerCase()}`}
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button className="world-close" onClick={() => setOpen(false)} aria-label="Zamknij">×</button>

            {/* Header */}
            <div className="world-report-head">
              <p className="world-kicker">MAGICZNA PÓŁNOC</p>
              <h2 className="world-title">STAN CYTADELI</h2>
              <span className={`world-citadel-pill world-citadel-pill--${(w.citadelState || 'normal').toLowerCase()}`}>
                {label(w.citadelState)}
              </span>
            </div>

            {/* Atmosphere — 3 columns */}
            <div className="world-atmosphere">
              <div className="world-atmo-block">
                <span className="world-atmo-icon">{tIcon(w)}</span>
                <span className="world-atmo-label">{label(timeDisplay)}</span>
              </div>
              <div className="world-atmo-center">
                <span className="world-atmo-temp">{Math.round(w.temperature)}°C</span>
                <em className="world-atmo-weather">{wIcon(w.weather)} {label(w.weather)}</em>
              </div>
              <div className="world-atmo-block">
                <span className="world-atmo-icon">{mIcon(w.moonPhase)}</span>
                <span className="world-atmo-label">{label(w.moonPhase)}</span>
              </div>
            </div>

            {/* State grid */}
            <dl className="world-grid">
              <div>
                <dt>Wiatr</dt>
                <dd>{w.windDirection} <WindBar intensity={w.windIntensity} /></dd>
              </div>
              <div>
                <dt>Niebo</dt>
                <dd>{label(w.skyState || w.weather)}</dd>
              </div>
              <div>
                <dt>Runa dnia</dt>
                <dd className="world-grid-rune">{w.runeOfTheDay?.symbol} {w.runeOfTheDay?.name}</dd>
              </div>
              <div>
                <dt>Stan Twierdzy</dt>
                <dd>{label(w.citadelState)}</dd>
              </div>
              <div>
                <dt>Zagrożenie</dt>
                <dd className={`threat-dd threat-dd--${w.threatLevel}`}>
                  {w.threatLevel} — {THREAT_LABEL[w.threatLevel] || '—'}
                </dd>
              </div>
              <div>
                <dt>Wydarzenia</dt>
                <dd>{w.activeEvents?.length > 0 ? `${w.activeEvents.length} aktywne` : 'Brak'}</dd>
              </div>
            </dl>

            {/* Active events */}
            {w.activeEvents?.length > 0 && (
              <div className="world-events">
                <h3 className="world-section-title">Aktywne wydarzenia</h3>
                {w.activeEvents.map((ev, i) => (
                  <div key={ev.id || i} className="world-event-item">
                    <span className="world-event-dot" />
                    <span>{ev.name}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Narrative report */}
            {w.narrativeReport && (
              <blockquote className="world-narrative">{w.narrativeReport}</blockquote>
            )}

            {/* Rune interpretation */}
            {w.runeOfTheDay?.interpretation && (
              <div className="world-rune-detail">
                <span className="world-rune-glyph">{w.runeOfTheDay.symbol}</span>
                <div>
                  <strong>{w.runeOfTheDay.name}</strong>
                  <p>{w.runeOfTheDay.interpretation}</p>
                </div>
              </div>
            )}

            {/* World scars */}
            {w.worldScars?.length > 0 && (
              <div className="world-scars">
                <h3 className="world-section-title">⚔ Ślady świata</h3>
                {w.worldScars.map(s => (
                  <div key={s.id} className="world-scar-item">
                    <strong>{s.name}</strong>
                    <p>{s.description}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Presentation mode */}
            <div className="world-modes">
              {[['FULL', '◉ PEŁNY'], ['BALANCED', '◎ ZBALANSOWANY'], ['QUIET', '○ SPOKOJNY']].map(([m, t]) => (
                <button
                  key={m}
                  className={presentationMode === m ? 'active' : ''}
                  onClick={() => setPresentationMode(m)}
                  title={m === 'FULL' ? 'Pełna atmosfera' : m === 'BALANCED' ? 'Zbalansowane' : 'Minimum animacji'}
                >
                  {t}
                </button>
              ))}
            </div>

            {currentUser?.role === 'admin' && (
              <button className="director-open" onClick={() => setDirector(true)}>
                ✦ REŻYSER MAGICZNEJ PÓŁNOCY
              </button>
            )}
          </section>
        </div>
      )}

      {/* ── Inline director (admin only) ── */}
      {director && (
        <QuickDirector onClose={() => setDirector(false)} onPublished={refresh} />
      )}
    </>
  );
}

// ─── QuickDirector (admin quick access from the report) ──────────────────────
const WEATHER_OPTS  = ['CLEAR','CLOUDY','FOG','SNOWFALL','HEAVY_SNOW','BLIZZARD','FREEZING_RAIN','STORM'];
const CITADEL_OPTS  = ['NORMAL','VIGILANCE','CEREMONY','CELEBRATION','MOURNING','ALERT','LOCKDOWN','SIEGE'];
const MOON_OPTS     = ['NEW_MOON','WAXING_CRESCENT','FIRST_QUARTER','WAXING_GIBBOUS','FULL_MOON','WANING_GIBBOUS','LAST_QUARTER','WANING_CRESCENT'];
const THREAT_OPTS   = [['I','SPOKÓJ'],['II','CZUJNOŚĆ'],['III','NIEPOKÓJ'],['IV','ALARM'],['V','OBLĘŻENIE']];
const WIND_DIRS     = ['N','NE','E','SE','S','SW','W','NW'];

function QuickDirector({ onClose, onPublished }) {
  const [data, setData]       = useState(null);
  const [mode, setMode]       = useState('base');
  const [message, setMessage] = useState('');
  const [busy, setBusy]       = useState(false);
  const [tab, setTab]         = useState('env');

  const [form, setForm] = useState({
    weather: 'SNOWFALL', temperature: -11, windDirection: 'NE', windIntensity: 2,
    moonPhase: 'WAXING_GIBBOUS', citadelState: 'NORMAL', threatLevel: 'I',
    narrativeReport: '',
    runeOfTheDay: {
      name: 'ISA', symbol: 'ᛁ',
      description: 'Runa lodu, zatrzymania i zachowania.',
      interpretation: 'Czas zatrzymania i zachowania.',
      date: new Date().toISOString().slice(0, 10),
      source: 'MANUAL',
    },
  });

  const [schedName, setSchedName] = useState('');
  const [schedStart, setSchedStart] = useState('');
  const [schedEnd, setSchedEnd]   = useState('');

  const load = async () => {
    const r = await api.getWorldDirector();
    if (!r.ok) return;
    setData(r.data);
    const s = r.data.state;
    setForm(f => ({
      ...f,
      weather:        s.weather        ?? f.weather,
      temperature:    s.temperature    ?? f.temperature,
      windDirection:  s.windDirection  ?? f.windDirection,
      windIntensity:  s.windIntensity  ?? f.windIntensity,
      moonPhase:      s.moonPhase      ?? f.moonPhase,
      citadelState:   s.citadelState   ?? f.citadelState,
      threatLevel:    s.threatLevel    ?? f.threatLevel,
      narrativeReport: s.narrativeReport ?? f.narrativeReport,
      runeOfTheDay:   s.runeOfTheDay   ?? f.runeOfTheDay,
    }));
  };

  useEffect(() => { load(); }, []);

  const setRune = (field, val) =>
    setForm(f => ({ ...f, runeOfTheDay: { ...f.runeOfTheDay, [field]: val } }));

  const publish = async () => {
    setBusy(true);
    setMessage('');
    let r;
    if (mode === 'preview') {
      r = await api.previewWorldState({ changes: form });
    } else if (mode === 'override') {
      r = await api.createWorldOverride({
        name: schedName || 'Override Reżysera',
        changes: form,
        startsAt: schedStart || new Date().toISOString(),
        endsAt:   schedEnd   || new Date(Date.now() + 86400000).toISOString(),
        priority: 80,
      });
    } else if (mode === 'schedule') {
      r = await api.createWorldSchedule({
        name: schedName || 'Zaplanowana zmiana',
        changes: form,
        startsAt: schedStart || new Date().toISOString(),
        endsAt:   schedEnd   || new Date(Date.now() + 86400000).toISOString(),
        priority: 80,
      });
    } else {
      r = await api.updateWorldBase({ changes: form, reason: 'Publikacja przez Reżysera Świata' });
    }
    setBusy(false);
    if (r.ok) {
      setMessage(mode === 'preview' ? 'Podgląd gotowy — stan publiczny nie zmieniony.' : 'Stan opublikowany.');
      if (mode !== 'preview') { await onPublished(); await load(); }
    } else {
      setMessage(r.error || 'Błąd operacji.');
    }
  };

  return (
    <div className="world-modal-backdrop top" onClick={onClose}>
      <section className="world-director" onClick={e => e.stopPropagation()}>
        <button className="world-close" onClick={onClose}>×</button>
        <p className="world-kicker">KOMNATA DYREKCJI</p>
        <h2>REŻYSER MAGICZNEJ PÓŁNOCY</h2>

        {/* Live stats */}
        {data && (
          <div className="director-stats director-stats--6">
            <span>Pogoda<b>{label(data.state.weather)}</b></span>
            <span>Runa<b>{data.state.runeOfTheDay?.name || '—'}</b></span>
            <span>Efekty<b>{data.state.activeEffects?.length || 0}</b></span>
            <span>Ślady<b>{data.state.worldScars?.length || 0}</b></span>
            <span>Override<b>{data.overrides?.length || 0}</b></span>
            <span>Historia<b>{data.history?.length || 0}</b></span>
          </div>
        )}

        {/* Mode selector */}
        <div className="director-mode">
          {[['base','BAZA'],['override','OVERRIDE'],['schedule','HARMONOGRAM'],['preview','PODGLĄD']].map(([v,t]) => (
            <button key={v} className={mode === v ? 'active' : ''} onClick={() => setMode(v)}>{t}</button>
          ))}
        </div>

        {/* Schedule/override name + times */}
        {(mode === 'override' || mode === 'schedule') && (
          <div className="director-schedule-row">
            <label>Nazwa
              <input value={schedName} onChange={e => setSchedName(e.target.value)} placeholder="np. Pęknięcie pod Czarnym Fiordem" />
            </label>
            <label>Start
              <input type="datetime-local" value={schedStart} onChange={e => setSchedStart(e.target.value)} />
            </label>
            <label>Koniec
              <input type="datetime-local" value={schedEnd} onChange={e => setSchedEnd(e.target.value)} />
            </label>
          </div>
        )}

        {/* Form tab nav */}
        <div className="director-form-tabs">
          {[['env','⛰ Środowisko'],['rune','ᛁ Runa'],['narr','📜 Raport']].map(([t,l]) => (
            <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{l}</button>
          ))}
        </div>

        <div className="director-form">
          {tab === 'env' && (<>
            <label>Pogoda
              <select value={form.weather} onChange={e => setForm({ ...form, weather: e.target.value })}>
                {WEATHER_OPTS.map(x => <option key={x} value={x}>{wIcon(x)} {label(x)}</option>)}
              </select>
            </label>
            <label>Temperatura °C
              <input type="number" value={form.temperature} onChange={e => setForm({ ...form, temperature: Number(e.target.value) })} />
            </label>
            <label>Kierunek wiatru
              <select value={form.windDirection} onChange={e => setForm({ ...form, windDirection: e.target.value })}>
                {WIND_DIRS.map(x => <option key={x}>{x}</option>)}
              </select>
            </label>
            <label>Siła wiatru
              <input type="range" min="0" max="5" value={form.windIntensity} onChange={e => setForm({ ...form, windIntensity: Number(e.target.value) })} />
              <span className="director-range-label">{form.windIntensity}/5</span>
            </label>
            <label>Faza księżyca
              <select value={form.moonPhase} onChange={e => setForm({ ...form, moonPhase: e.target.value })}>
                {MOON_OPTS.map(x => <option key={x} value={x}>{mIcon(x)} {label(x)}</option>)}
              </select>
            </label>
            <label>Stan Cytadeli
              <select value={form.citadelState} onChange={e => setForm({ ...form, citadelState: e.target.value })}>
                {CITADEL_OPTS.map(x => <option key={x} value={x}>{label(x)}</option>)}
              </select>
            </label>
            <label className="wide">Poziom zagrożenia
              <select value={form.threatLevel} onChange={e => setForm({ ...form, threatLevel: e.target.value })}>
                {THREAT_OPTS.map(([v,t]) => <option key={v} value={v}>{v} — {t}</option>)}
              </select>
            </label>
          </>)}

          {tab === 'rune' && (<>
            <label>Nazwa runy
              <input value={form.runeOfTheDay.name} onChange={e => setRune('name', e.target.value)} placeholder="ISA" />
            </label>
            <label>Symbol
              <input value={form.runeOfTheDay.symbol} onChange={e => setRune('symbol', e.target.value)} className="director-rune-input" />
            </label>
            <label className="wide">Opis
              <input value={form.runeOfTheDay.description} onChange={e => setRune('description', e.target.value)} />
            </label>
            <label className="wide">Interpretacja
              <input value={form.runeOfTheDay.interpretation} onChange={e => setRune('interpretation', e.target.value)} />
            </label>
            <label>Źródło
              <select value={form.runeOfTheDay.source} onChange={e => setRune('source', e.target.value)}>
                <option value="AUTO">AUTO</option>
                <option value="MANUAL">RĘCZNIE</option>
              </select>
            </label>
          </>)}

          {tab === 'narr' && (
            <label className="wide">Raport narracyjny
              <textarea
                value={form.narrativeReport}
                onChange={e => setForm({ ...form, narrativeReport: e.target.value })}
                placeholder="Komunikat dla użytkowników…"
                style={{ minHeight: 120 }}
              />
            </label>
          )}
        </div>

        <button className="director-publish" onClick={publish} disabled={busy}>
          {busy ? 'Przetwarzanie…'
            : mode === 'preview'   ? 'POKAŻ PODGLĄD'
            : mode === 'schedule'  ? 'DODAJ DO HARMONOGRAMU'
            : mode === 'override'  ? 'AKTYWUJ OVERRIDE'
            : 'OPUBLIKUJ STAN'}
        </button>

        {message && <p className="director-message">{message}</p>}

        {/* Active overrides */}
        {data?.overrides?.length > 0 && (
          <details className="director-details">
            <summary>Aktywne override ({data.overrides.length})</summary>
            <div className="director-override-list">
              {data.overrides.map(o => (
                <div key={o.id} className="director-override-item">
                  <div>
                    <strong>{o.name}</strong>
                    <span>
                      {new Date(o.starts_at).toLocaleString('pl-PL')} → {new Date(o.ends_at).toLocaleString('pl-PL')}
                    </span>
                  </div>
                  <button onClick={async () => { await api.deleteWorldOverride(o.id); await load(); }} aria-label="Usuń">✕</button>
                </div>
              ))}
            </div>
          </details>
        )}

        {/* History */}
        {data?.history?.length > 0 && (
          <details className="director-details">
            <summary>Historia i audyt ({data.history.length})</summary>
            <div className="director-history">
              {data.history.slice(0, 20).map(h => (
                <div key={h.id} className="director-history-item">
                  <time>{new Date(h.timestamp).toLocaleString('pl-PL')}</time>
                  <b>{h.field}</b>
                  {h.previous_value != null && (
                    <span className="history-arrow">{String(h.previous_value)} → {String(h.new_value ?? '—')}</span>
                  )}
                  <em>{h.actor_name}</em>
                </div>
              ))}
            </div>
          </details>
        )}
      </section>
    </div>
  );
}
