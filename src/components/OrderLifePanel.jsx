import React, { useEffect, useState } from 'react';
import { BookOpen, Hammer, ScrollText, Users } from 'lucide-react';
import { api } from '../api';

export function OrderLifePanel({ orderId, color }) {
  const [room, setRoom] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let alive = true;
    setError('');
    api.getOrderRoom(orderId).then(result => {
      if (!alive) return;
      if (result.ok) setRoom(result.data);
      else setError(result.error || 'Nie udało się odczytać kroniki pokoju.');
    });
    return () => { alive = false; };
  }, [orderId]);
  if (error) return <p role="alert" style={{ color: '#fca5a5' }}>{error}</p>;
  if (!room) return <p aria-live="polite" style={{ color: '#9ca3af' }}>Kroniki budzą się ze snu…</p>;
  const project = room.projects?.find(p => p.status === 'active') || room.projects?.[0];
  const sagaStages = room.saga?.stages || [];
  return (
    <section aria-label="Życie Zakonu" style={{ display: 'grid', gap: '1rem' }}>
      <div style={{ padding: '1rem', border: `1px solid ${color}66`, borderRadius: 8, background: room.roomVariant === 'restored' ? `radial-gradient(circle at top right, ${color}22, rgba(0,0,0,.35))` : 'rgba(0,0,0,.35)' }}>
        <h4 style={{ margin: '0 0 .45rem', color, display: 'flex', gap: 8, alignItems: 'center' }}><Hammer size={17}/> Dzieło wspólnoty</h4>
        {project ? <><strong>{project.title}</strong><p style={{ margin: '.35rem 0', color: '#cbd5e1' }}>{project.description}</p><small style={{ color: '#9ca3af' }}>{project.status === 'completed' ? 'Dzieło ukończone — jego ślad pozostaje w tej sali.' : `Zgromadzono: ${project.progress} jednostek ze źródłami zapisanymi w kronice.`}</small></> : <p style={{ color: '#9ca3af' }}>Przy palenisku nie ogłoszono jeszcze nowego dzieła.</p>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: '1rem' }}>
        <article style={{ padding: '1rem', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, background: 'rgba(0,0,0,.28)' }}>
          <h4 style={{ margin: '0 0 .6rem', color, display: 'flex', gap: 8 }}><Users size={17}/> Rada przy palenisku</h4>
          {room.council?.filter(m => !m.revoked_at).length ? room.council.filter(m => !m.revoked_at).map(m => <div key={m.id} style={{ marginBottom: 6 }}><strong>{m.role_name}</strong><br/><small>{m.user_name}</small></div>) : <small style={{ color: '#9ca3af' }}>Miejsca Rady czekają na powołanie.</small>}
        </article>
        <article style={{ padding: '1rem', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, background: 'rgba(0,0,0,.28)' }}>
          <h4 style={{ margin: '0 0 .6rem', color, display: 'flex', gap: 8 }}><ScrollText size={17}/> Doroczna saga</h4>
          <strong>{room.saga?.title || 'Saga jeszcze nie rozpoczęta'}</strong>
          <ol style={{ paddingLeft: '1.2rem', marginBottom: 0, color: '#cbd5e1' }}>{sagaStages.map(s => <li key={s.id}>{s.title} — {s.status === 'locked' ? 'zapieczętowane' : s.status}</li>)}</ol>
        </article>
      </div>
      {room.history?.length > 0 && <article style={{ padding: '1rem', borderLeft: `3px solid ${color}`, background: 'rgba(0,0,0,.25)' }}><h4 style={{ margin: '0 0 .5rem', color, display: 'flex', gap: 8 }}><BookOpen size={17}/> Ślady w kronice</h4>{room.history.slice(0,3).map(h => <p key={h.id} style={{ margin: '.3rem 0', color: '#d1d5db' }}>{h.description}</p>)}</article>}
    </section>
  );
}
