import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useWorldState } from '../context/WorldStateContext';

const WEATHER = ['CLEAR','CLOUDY','FOG','SNOWFALL','HEAVY_SNOW','BLIZZARD','FREEZING_RAIN','STORM'];
const CITADEL = ['NORMAL','VIGILANCE','CEREMONY','CELEBRATION','MOURNING','ALERT','LOCKDOWN','SIEGE'];

export function AdminWorldDirector() {
  const { refresh } = useWorldState();
  const [director, setDirector] = useState(null);
  const [mode, setMode] = useState('base');
  const [status, setStatus] = useState('');
  const [publishToDiscord, setPublishToDiscord] = useState(false);
  const [discordChannelId, setDiscordChannelId] = useState('');
  const [form, setForm] = useState({ weather:'SNOWFALL', temperature:-11, windDirection:'NE', windIntensity:2, citadelState:'NORMAL', threatLevel:'I', narrativeReport:'' });
  const load = async () => { const r = await api.getWorldDirector(); if (r.ok) { setDirector(r.data); setForm(f => ({...f,...r.data.state})); } else setStatus(r.error); };
  useEffect(() => { load(); }, []);
  const submit = async () => {
    setStatus('Zapisywanie…');
    const payload = { weather:form.weather, temperature:Number(form.temperature), windDirection:form.windDirection, windIntensity:Number(form.windIntensity), citadelState:form.citadelState, threatLevel:form.threatLevel, narrativeReport:form.narrativeReport };
    let r;
    if (mode === 'preview') r = await api.previewWorldState({changes:payload});
    else if (mode === 'schedule') r = await api.createWorldSchedule({name:'Zmiana Reżysera Świata',changes:payload,startsAt:new Date().toISOString(),endsAt:new Date(Date.now()+86400000).toISOString(),priority:80});
    else r = await api.updateWorldBase({changes:payload,reason:'Zmiana w panelu Magicznej Północy',publishToDiscord,discordChannelId:discordChannelId.trim()||undefined});
    const discordResult = r.ok ? r.data?.discord : null;
    setStatus(r.ok ? (mode==='preview'?'Podgląd przygotowany bez publikacji.':discordResult?.ok?`Stan opublikowany także na Discordzie (#${discordResult.channelName || discordResult.channelId}).`:discordResult?.error?`Stan portalu zapisany. Discord: ${discordResult.error}`:'Stan świata został opublikowany.') : r.error);
    if (r.ok && mode !== 'preview') { await refresh(); await load(); }
  };
  return <section className="admin-world-panel animate-fade-in">
    <header><div><p>REŻYSER ŚWIATA</p><h2>Magiczna Północ</h2></div><span className="admin-world-seal">☾</span></header>
    {director && <div className="director-stats"><span>Pogoda<b>{director.state.weather}</b></span><span>Runa<b>{director.state.runeOfTheDay?.name}</b></span><span>Efekty<b>{director.state.activeEffects.length}</b></span><span>Ślady<b>{director.state.worldScars.length}</b></span></div>}
    <div className="director-mode"><button className={mode==='base'?'active':''} onClick={()=>setMode('base')}>PUBLIKUJ</button><button className={mode==='schedule'?'active':''} onClick={()=>setMode('schedule')}>ZAPLANUJ NA 24H</button><button className={mode==='preview'?'active':''} onClick={()=>setMode('preview')}>TYLKO PODGLĄD</button></div>
    <div className="director-form"><label>Pogoda<select value={form.weather} onChange={e=>setForm({...form,weather:e.target.value})}>{WEATHER.map(x=><option key={x}>{x}</option>)}</select></label><label>Temperatura °C<input type="number" value={form.temperature} onChange={e=>setForm({...form,temperature:e.target.value})}/></label><label>Kierunek wiatru<input value={form.windDirection} onChange={e=>setForm({...form,windDirection:e.target.value})}/></label><label>Siła wiatru 0–5<input type="number" min="0" max="5" value={form.windIntensity} onChange={e=>setForm({...form,windIntensity:e.target.value})}/></label><label>Stan Cytadeli<select value={form.citadelState} onChange={e=>setForm({...form,citadelState:e.target.value})}>{CITADEL.map(x=><option key={x}>{x}</option>)}</select></label><label>Zagrożenie<select value={form.threatLevel} onChange={e=>setForm({...form,threatLevel:e.target.value})}>{['I','II','III','IV','V'].map(x=><option key={x}>{x}</option>)}</select></label><label className="wide">Raport narracyjny<textarea value={form.narrativeReport} onChange={e=>setForm({...form,narrativeReport:e.target.value})}/></label></div>
    {mode==='base'&&<div className="director-discord"><label><input type="checkbox" checked={publishToDiscord} onChange={e=>setPublishToDiscord(e.target.checked)}/> Opublikuj również na Discordzie</label>{publishToDiscord&&<input value={discordChannelId} onChange={e=>setDiscordChannelId(e.target.value)} placeholder="ID kanału (opcjonalne — domyślnie ogłoszenia)"/>}</div>}
    <button className="director-publish" onClick={submit}>{mode==='preview'?'POKAŻ PODGLĄD':mode==='schedule'?'DODAJ DO HARMONOGRAMU':'OPUBLIKUJ STAN'}</button>{status&&<p className="director-message">{status}</p>}
    {director?.history?.length>0&&<details><summary>Historia i audyt ({director.history.length})</summary><div className="director-history">{director.history.slice(0,20).map(h=><p key={h.id}><time>{new Date(h.timestamp).toLocaleString('pl-PL')}</time> <b>{h.field}</b> · {h.actor_name}</p>)}</div></details>}
  </section>;
}
