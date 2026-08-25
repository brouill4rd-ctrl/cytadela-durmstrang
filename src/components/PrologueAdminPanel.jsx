import React, { useEffect, useState } from 'react';
import { api } from '../api';

const stages = ['LETTER_PENDING','LETTER_OPENED','PREPARATION','PORT','SHIP','FJORD','BORDER_CONTROL','GREAT_HALL','ARRIVED','COMPLETED'];

export const PrologueAdminPanel = () => {
  const [rows,setRows] = useState([]); const [error,setError] = useState('');
  const load = () => api.getPrologueAdmin().then(r => r.ok ? setRows(r.data) : setError(r.error));
  useEffect(load,[]);
  const change = async (userId,stage) => { const r=await api.setPrologueStage(userId,stage); if(r.ok) load(); else setError(r.error); };
  return <section className="gothic-card" style={{padding:'1.4rem',overflowX:'auto'}}>
    <h2 style={{marginTop:0}}>Prolog postaci</h2><p style={{color:'#9ca3af'}}>Kontrola podróży nowych adeptów. Każda zmiana pozostawia wpis w audycie.</p>
    {error && <p role="alert" style={{color:'#fca5a5'}}>{error}</p>}
    <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th style={{textAlign:'left',padding:10}}>Postać</th><th>Status</th><th>Przybycie</th><th>Akcja administracyjna</th></tr></thead>
      <tbody>{rows.map(row=><tr key={row.user_id} style={{borderTop:'1px solid rgba(255,255,255,.08)'}}><td style={{padding:10}}>{row.full_name}</td><td style={{textAlign:'center'}}>{row.stage}</td><td style={{textAlign:'center'}}>{row.arrived_at || '—'}</td><td style={{textAlign:'right'}}><select aria-label={`Etap prologu ${row.full_name}`} value={row.stage} onChange={e=>change(row.user_id,e.target.value)} className="gothic-select" style={{padding:8}}>{stages.map(s=><option key={s}>{s}</option>)}</select></td></tr>)}</tbody>
    </table>
  </section>;
};
