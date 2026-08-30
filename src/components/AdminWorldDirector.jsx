import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useWorldState } from '../context/WorldStateContext';

// ─── Option sets ──────────────────────────────────────────────────────────────
const WEATHER_OPTS  = ['CLEAR','CLOUDY','FOG','SNOWFALL','HEAVY_SNOW','BLIZZARD','FREEZING_RAIN','STORM'];
const CITADEL_OPTS  = ['NORMAL','VIGILANCE','CEREMONY','CELEBRATION','MOURNING','ALERT','LOCKDOWN','SIEGE'];
const MOON_OPTS     = ['NEW_MOON','WAXING_CRESCENT','FIRST_QUARTER','WAXING_GIBBOUS','FULL_MOON','WANING_GIBBOUS','LAST_QUARTER','WANING_CRESCENT'];
const THREAT_OPTS   = [['I','SPOKÓJ'],['II','CZUJNOŚĆ'],['III','NIEPOKÓJ'],['IV','ALARM'],['V','OBLĘŻENIE']];
const WIND_DIRS     = ['N','NE','E','SE','S','SW','W','NW'];

const PL = {
  CLEAR:'Bezchmurnie', CLOUDY:'Pochmurno', FOG:'Mgła', SNOWFALL:'Opad śniegu',
  HEAVY_SNOW:'Śnieżyca', BLIZZARD:'Zamieć', FREEZING_RAIN:'Marznący deszcz', STORM:'Burza',
  NORMAL:'Spokój', VIGILANCE:'Czujność', CEREMONY:'Ceremonia',
  CELEBRATION:'Świętowanie', MOURNING:'Żałoba', ALERT:'Alarm',
  LOCKDOWN:'Zamknięcie', SIEGE:'Oblężenie',
  NEW_MOON:'Nów', WAXING_CRESCENT:'Przybywający sierp', FIRST_QUARTER:'Pierwsza kwadra',
  WAXING_GIBBOUS:'Przybywający garb', FULL_MOON:'Pełnia', WANING_GIBBOUS:'Zanikający garb',
  LAST_QUARTER:'Ostatnia kwadra', WANING_CRESCENT:'Zanikający sierp',
};

const WEATHER_ICON = {
  CLEAR:'✦', CLOUDY:'☁', FOG:'≋', SNOWFALL:'❄',
  HEAVY_SNOW:'❆', BLIZZARD:'⚡', FREEZING_RAIN:'☔', STORM:'⛈',
};
const MOON_ICON = {
  NEW_MOON:'🌑', WAXING_CRESCENT:'🌒', FIRST_QUARTER:'🌓',
  WAXING_GIBBOUS:'🌔', FULL_MOON:'🌕', WANING_GIBBOUS:'🌖',
  LAST_QUARTER:'🌗', WANING_CRESCENT:'🌘',
};

const THREAT_LABEL = { I:'SPOKÓJ', II:'CZUJNOŚĆ', III:'NIEPOKÓJ', IV:'ALARM', V:'OBLĘŻENIE' };

const FIELD_LABELS = {
  weather:'Pogoda', temperature:'Temperatura', windDirection:'Kierunek wiatru',
  windIntensity:'Siła wiatru', moonPhase:'Faza księżyca',
  citadelState:'Stan Cytadeli', threatLevel:'Zagrożenie',
  narrativeReport:'Raport', runeOfTheDay:'Runa dnia',
};

const pl = v => PL[v] || String(v || '').replaceAll('_', ' ');

const DEFAULT_FORM = {
  weather: 'SNOWFALL',
  temperature: -11,
  windDirection: 'NE',
  windIntensity: 2,
  moonPhase: 'WAXING_GIBBOUS',
  citadelState: 'NORMAL',
  threatLevel: 'I',
  narrativeReport: '',
  runeOfTheDay: { name: 'ISA', symbol: 'ᛁ', description: '', interpretation: '', date: '', source: 'AUTO' },
};

// ─── AdminWorldDirector ───────────────────────────────────────────────────────
export function AdminWorldDirector() {
  const { refresh }              = useWorldState();
  const [director, setDirector]  = useState(null);
  const [mode, setMode]          = useState('base');
  const [tab, setTab]            = useState('env');
  const [status, setStatus]      = useState('');
  const [publishToDiscord, setPublishToDiscord] = useState(false);
  const [discordChannelId, setDiscordChannelId] = useState('');
  const [schedName, setSchedName]   = useState('');
  const [schedStart, setSchedStart] = useState('');
  const [schedEnd, setSchedEnd]     = useState('');
  const [form, setForm]          = useState(DEFAULT_FORM);

  const load = async () => {
    const r = await api.getWorldDirector();
    if (r.ok) {
      setDirector(r.data);
      const s = r.data.state;
      setForm(f => ({
        ...f,
        weather:         s.weather        ?? f.weather,
        temperature:     s.temperature    ?? f.temperature,
        windDirection:   s.windDirection  ?? f.windDirection,
        windIntensity:   s.windIntensity  ?? f.windIntensity,
        moonPhase:       s.moonPhase      ?? f.moonPhase,
        citadelState:    s.citadelState   ?? f.citadelState,
        threatLevel:     s.threatLevel    ?? f.threatLevel,
        narrativeReport: s.narrativeReport ?? f.narrativeReport,
        runeOfTheDay:    s.runeOfTheDay   ?? f.runeOfTheDay,
      }));
    } else {
      setStatus(r.error || 'Błąd ładowania danych.');
    }
  };

  useEffect(() => { load(); }, []);

  const setRune = (field, val) =>
    setForm(f => ({ ...f, runeOfTheDay: { ...f.runeOfTheDay, [field]: val } }));

  const submit = async () => {
    setStatus('Zapisywanie…');
    const payload = {
      weather:         form.weather,
      temperature:     Number(form.temperature),
      windDirection:   form.windDirection,
      windIntensity:   Number(form.windIntensity),
      moonPhase:       form.moonPhase,
      citadelState:    form.citadelState,
      threatLevel:     form.threatLevel,
      narrativeReport: form.narrativeReport,
      runeOfTheDay:    form.runeOfTheDay,
    };

    let r;
    if (mode === 'preview') {
      r = await api.previewWorldState({ changes: payload });
    } else if (mode === 'schedule') {
      r = await api.createWorldSchedule({
        name:     schedName  || 'Zaplanowana zmiana',
        changes:  payload,
        startsAt: schedStart || new Date().toISOString(),
        endsAt:   schedEnd   || new Date(Date.now() + 86400000).toISOString(),
        priority: 80,
      });
    } else if (mode === 'override') {
      r = await api.createWorldOverride({
        name:     schedName  || 'Override',
        changes:  payload,
        startsAt: schedStart || new Date().toISOString(),
        endsAt:   schedEnd   || new Date(Date.now() + 86400000).toISOString(),
        priority: 90,
      });
    } else {
      r = await api.updateWorldBase({
        changes:         payload,
        reason:          'Zmiana w panelu Magicznej Północy',
        publishToDiscord,
        discordChannelId: discordChannelId.trim() || undefined,
      });
    }

    if (r.ok) {
      const d = r.data;
      let msg = 'Stan świata zaktualizowany.';
      if (mode === 'preview')  msg = 'Podgląd przygotowany — stan publiczny nie zmieniony.';
      else if (mode === 'schedule') msg = 'Zmiana zaplanowana.';
      else if (mode === 'override') msg = 'Override aktywowany.';
      else if (d?.discord?.ok)    msg = `Opublikowano. Discord: #${d.discord.channelName || d.discord.channelId}`;
      else if (d?.discord?.error) msg = `Zapisano. Discord: ${d.discord.error}`;
      setStatus(msg);
      if (mode !== 'preview') { await refresh(); await load(); }
    } else {
      setStatus(r.error || 'Błąd operacji.');
    }
  };

  const s = director?.state;

  return (
    <section className="admin-world-panel animate-fade-in">

      {/* ── Header ── */}
      <header className="admin-world-header">
        <div>
          <p className="admin-world-kicker">REŻYSER ŚWIATA</p>
          <h2>Magiczna Północ</h2>
        </div>
        <div className="admin-world-seal-block">
          <span className="admin-world-seal-moon">{MOON_ICON[s?.moonPhase] || '☾'}</span>
          <span className="admin-world-seal-weather">{WEATHER_ICON[s?.weather] || '❄'}</span>
        </div>
      </header>

      {/* ── Live state overview ── */}
      {s && (
        <div className="director-live-state">
          <div className="director-live-main">
            <div className="director-live-temp">{Math.round(s.temperature)}°C</div>
            <div className="director-live-weather">{WEATHER_ICON[s.weather] || '✦'} {pl(s.weather)}</div>
            <div className="director-live-rune">
              <span>{s.runeOfTheDay?.symbol || 'ᛁ'}</span>
              <em>{s.runeOfTheDay?.name || '—'}</em>
            </div>
          </div>
          <div className="director-stats">
            <span>Twierdza<b>{pl(s.citadelState)}</b></span>
            <span>Zagrożenie<b className={`threat-text-${s.threatLevel}`}>{s.threatLevel} — {THREAT_LABEL[s.threatLevel] || '—'}</b></span>
            <span>Efekty<b>{s.activeEffects?.length || 0}</b></span>
            <span>Ślady<b>{s.worldScars?.length || 0}</b></span>
          </div>
        </div>
      )}

      {/* ── Mode selector ── */}
      <div className="director-mode">
        <button className={mode === 'base'     ? 'active' : ''} onClick={() => setMode('base')}>PUBLIKUJ</button>
        <button className={mode === 'override' ? 'active' : ''} onClick={() => setMode('override')}>OVERRIDE</button>
        <button className={mode === 'schedule' ? 'active' : ''} onClick={() => setMode('schedule')}>HARMONOGRAM</button>
        <button className={mode === 'preview'  ? 'active' : ''} onClick={() => setMode('preview')}>PODGLĄD</button>
      </div>

      {/* ── Schedule / override name + times ── */}
      {(mode === 'schedule' || mode === 'override') && (
        <div className="director-schedule-row">
          <label>Nazwa
            <input value={schedName} onChange={e => setSchedName(e.target.value)} placeholder="np. Noc Trzech Rogów" />
          </label>
          <label>Start
            <input type="datetime-local" value={schedStart} onChange={e => setSchedStart(e.target.value)} />
          </label>
          <label>Koniec
            <input type="datetime-local" value={schedEnd} onChange={e => setSchedEnd(e.target.value)} />
          </label>
        </div>
      )}

      {/* ── Form section tabs ── */}
      <div className="director-form-tabs">
        {[['env','⛰ Środowisko'],['rune','ᛁ Runa'],['narr','📜 Raport']].map(([t,l]) => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{l}</button>
        ))}
      </div>

      <div className="director-form">

        {/* ── Environment tab ── */}
        {tab === 'env' && (<>
          <label>Pogoda
            <select value={form.weather} onChange={e => setForm({ ...form, weather: e.target.value })}>
              {WEATHER_OPTS.map(x => <option key={x} value={x}>{WEATHER_ICON[x]} {pl(x)}</option>)}
            </select>
          </label>

          <label>Temperatura °C
            <input type="number" value={form.temperature} onChange={e => setForm({ ...form, temperature: e.target.value })} />
          </label>

          <label>Kierunek wiatru
            <select value={form.windDirection} onChange={e => setForm({ ...form, windDirection: e.target.value })}>
              {WIND_DIRS.map(x => <option key={x}>{x}</option>)}
            </select>
          </label>

          <label>Siła wiatru
            <input
              type="range" min="0" max="5" step="1"
              value={form.windIntensity}
              onChange={e => setForm({ ...form, windIntensity: e.target.value })}
            />
            <span className="director-range-label">{form.windIntensity} / 5</span>
          </label>

          <label>Faza księżyca
            <select value={form.moonPhase} onChange={e => setForm({ ...form, moonPhase: e.target.value })}>
              {MOON_OPTS.map(x => <option key={x} value={x}>{MOON_ICON[x]} {pl(x)}</option>)}
            </select>
          </label>

          <label>Stan Cytadeli
            <select value={form.citadelState} onChange={e => setForm({ ...form, citadelState: e.target.value })}>
              {CITADEL_OPTS.map(x => <option key={x} value={x}>{pl(x)}</option>)}
            </select>
          </label>

          <label className="wide">Poziom zagrożenia
            <select value={form.threatLevel} onChange={e => setForm({ ...form, threatLevel: e.target.value })}>
              {THREAT_OPTS.map(([v,t]) => <option key={v} value={v}>{v} — {t}</option>)}
            </select>
          </label>
        </>)}

        {/* ── Rune tab ── */}
        {tab === 'rune' && (<>
          <label>Nazwa runy
            <input value={form.runeOfTheDay.name} onChange={e => setRune('name', e.target.value)} placeholder="ISA" />
          </label>

          <label>Symbol
            <input value={form.runeOfTheDay.symbol} onChange={e => setRune('symbol', e.target.value)} className="director-rune-input" />
          </label>

          <label className="wide">Opis
            <input value={form.runeOfTheDay.description} onChange={e => setRune('description', e.target.value)} placeholder="Krótki opis runy…" />
          </label>

          <label className="wide">Interpretacja na dziś
            <input value={form.runeOfTheDay.interpretation} onChange={e => setRune('interpretation', e.target.value)} placeholder="Znaczenie na dziś…" />
          </label>

          <label>Źródło
            <select value={form.runeOfTheDay.source} onChange={e => setRune('source', e.target.value)}>
              <option value="AUTO">AUTO</option>
              <option value="MANUAL">RĘCZNIE</option>
            </select>
          </label>
        </>)}

        {/* ── Narrative tab ── */}
        {tab === 'narr' && (
          <label className="wide">Raport narracyjny
            <textarea
              value={form.narrativeReport}
              onChange={e => setForm({ ...form, narrativeReport: e.target.value })}
              placeholder="Komunikat wyświetlany użytkownikom w Stanie Cytadeli…"
              style={{ minHeight: 140 }}
            />
          </label>
        )}
      </div>

      {/* ── Discord option ── */}
      {mode === 'base' && (
        <div className="director-discord">
          <label>
            <input type="checkbox" checked={publishToDiscord} onChange={e => setPublishToDiscord(e.target.checked)} />
            Opublikuj również na Discordzie
          </label>
          {publishToDiscord && (
            <input
              value={discordChannelId}
              onChange={e => setDiscordChannelId(e.target.value)}
              placeholder="ID kanału (opcjonalne — domyślnie ogłoszenia)"
            />
          )}
        </div>
      )}

      <button className="director-publish" onClick={submit}>
        {mode === 'preview'  ? 'POKAŻ PODGLĄD'
        : mode === 'schedule' ? 'DODAJ DO HARMONOGRAMU'
        : mode === 'override' ? 'AKTYWUJ OVERRIDE'
        : 'OPUBLIKUJ STAN ŚWIATA'}
      </button>

      {status && <p className="director-message">{status}</p>}

      {/* ── Active schedules / overrides ── */}
      {director?.schedules?.length > 0 && (
        <details className="director-details">
          <summary>Harmonogram ({director.schedules.length})</summary>
          <div className="director-override-list">
            {director.schedules.map(o => (
              <div key={o.id} className="director-override-item">
                <div>
                  <strong>{o.name}</strong>
                  <span>{new Date(o.starts_at).toLocaleString('pl-PL')} → {new Date(o.ends_at).toLocaleString('pl-PL')}</span>
                </div>
                <button onClick={async () => { await api.deleteWorldSchedule(o.id); await load(); }} aria-label="Usuń">✕</button>
              </div>
            ))}
          </div>
        </details>
      )}

      {director?.overrides?.length > 0 && (
        <details className="director-details">
          <summary>Aktywne override ({director.overrides.length})</summary>
          <div className="director-override-list">
            {director.overrides.map(o => (
              <div key={o.id} className="director-override-item">
                <div>
                  <strong>{o.name}</strong>
                  <span>{new Date(o.starts_at).toLocaleString('pl-PL')} → {new Date(o.ends_at).toLocaleString('pl-PL')}</span>
                </div>
                <button onClick={async () => { await api.deleteWorldOverride(o.id); await load(); }} aria-label="Usuń">✕</button>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* ── History & audit ── */}
      {director?.history?.length > 0 && (
        <details className="director-details">
          <summary>Historia i audyt ({director.history.length})</summary>
          <div className="director-history">
            {director.history.slice(0, 20).map(h => (
              <div key={h.id} className="director-history-item">
                <time>{new Date(h.timestamp).toLocaleString('pl-PL')}</time>
                <b>{FIELD_LABELS[h.field] || h.field}</b>
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
  );
}
