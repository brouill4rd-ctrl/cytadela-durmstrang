import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import { Mail, Send, Inbox, Feather, Sparkles, User, CheckCircle } from 'lucide-react';

export const RavenPostView = () => {
  const { ravenMessages, sendRavenMessage, currentUser, students, subjects } = useSchool();
  const { playWandSwoosh } = useSound();

  const [activeTab, setActiveTab] = useState('inbox'); // 'inbox' | 'compose'
  const [selectedMessage, setSelectedMessage] = useState(ravenMessages[0] || null);

  const [toRecipient, setToRecipient] = useState('Prof. Morana Vane');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;

    playWandSwoosh();
    sendRavenMessage(toRecipient, subject, body);

    setSubject('');
    setBody('');
    setActiveTab('inbox');
  };

  const professorRecipients = (subjects || [])
    .filter(s => s.professorName || (s.professors && s.professors.length > 0))
    .reduce((acc, s) => {
      const profs = (s.professors && s.professors.length > 0)
        ? s.professors.map(p => `${p.fullName} (${s.name})`)
        : [s.professorName ? `${s.professorName} (${s.name})` : null].filter(Boolean);
      for (const p of profs) {
        if (!acc.includes(p)) acc.push(p);
      }
      return acc;
    }, []);

  const recipients = [
    'Arcymistrzyni Valgerda Storm',
    ...professorRecipients,
    ...students.map(s => `${s.name} (${s.house})`)
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Header */}
      <div>
        <span style={{ color: 'var(--gold-ancient)', fontSize: '0.85rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
          Korespondencja Północy
        </span>
        <h1 style={{ fontSize: '2.4rem', color: '#ffffff', marginTop: '0.3rem', marginBottom: '0.5rem' }}>
          Krucza Poczta (Hrafnapóstur)
        </h1>
        <p style={{ color: '#9ca3af', maxWidth: '650px', fontSize: '0.98rem' }}>
          Oficjalny system wiadomości pomiędzy kadetami, profesorami Katedr a Radą Dyrekcji Twierdzy Magii (TMD).
        </p>
      </div>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', gap: '0.8rem', borderBottom: '1px solid rgba(197, 159, 78, 0.25)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => {
            playWandSwoosh();
            setActiveTab('inbox');
          }}
          style={{
            padding: '0.65rem 1.4rem',
            background: activeTab === 'inbox' ? 'rgba(197, 159, 78, 0.15)' : 'transparent',
            border: activeTab === 'inbox' ? '1px solid var(--gold-ancient)' : '1px solid transparent',
            borderRadius: '4px',
            color: activeTab === 'inbox' ? '#ffffff' : '#9ca3af',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <Inbox size={16} /> Skrzynka Listów ({ravenMessages.length})
        </button>

        <button
          onClick={() => {
            playWandSwoosh();
            setActiveTab('compose');
          }}
          style={{
            padding: '0.65rem 1.4rem',
            background: activeTab === 'compose' ? 'rgba(197, 159, 78, 0.15)' : 'transparent',
            border: activeTab === 'compose' ? '1px solid var(--gold-ancient)' : '1px solid transparent',
            borderRadius: '4px',
            color: activeTab === 'compose' ? '#ffffff' : '#9ca3af',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <Feather size={16} /> Napisz Nowy List
        </button>
      </div>

      {/* 1. INBOX SPLIT VIEW */}
      {activeTab === 'inbox' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 360px) 1fr', gap: '2rem' }}>
          {/* Message List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {ravenMessages.map(msg => {
              const isSelected = selectedMessage?.id === msg.id;

              return (
                <div
                  key={msg.id}
                  onClick={() => setSelectedMessage(msg)}
                  style={{
                    padding: '1.2rem',
                    background: isSelected ? 'rgba(25, 32, 45, 0.95)' : 'rgba(12, 15, 21, 0.75)',
                    border: isSelected ? '1px solid var(--gold-ancient)' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--gold-ancient)', fontWeight: 600 }}>{msg.from}</span>
                    <span>{msg.date}</span>
                  </div>
                  <h4 style={{ fontSize: '0.98rem', color: '#ffffff', marginBottom: '0.3rem' }}>
                    {msg.subject}
                  </h4>
                  <p style={{ color: '#8c95a6', fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {msg.body}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Letter Reading Pane */}
          {selectedMessage ? (
            <div
              className="gothic-card runic-corners"
              style={{
                padding: '2.5rem',
                background: 'linear-gradient(135deg, rgba(20, 18, 16, 0.95) 0%, rgba(10, 12, 16, 0.98) 100%)',
                border: '1px solid var(--gold-ancient)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.9)'
              }}
            >
              <div style={{ borderBottom: '1px solid rgba(197, 159, 78, 0.25)', paddingBottom: '1.2rem', marginBottom: '1.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
                  <div>Nadawca: <strong style={{ color: 'var(--gold-glow)' }}>{selectedMessage.from}</strong></div>
                  <div>Data nadejścia: <strong>{selectedMessage.date}</strong></div>
                </div>
                <h2 style={{ fontSize: '1.6rem', color: '#ffffff', lineHeight: 1.2 }}>
                  {selectedMessage.subject}
                </h2>
                <div style={{ fontSize: '0.8rem', color: '#8c95a6', marginTop: '0.3rem' }}>
                  Adresat: {selectedMessage.to}
                </div>
              </div>

              {/* Parchment Body */}
              <div
                style={{
                  fontFamily: 'var(--font-lore)',
                  fontSize: '1.15rem',
                  lineHeight: 1.8,
                  color: '#e2e5ec',
                  whiteSpace: 'pre-line',
                  marginBottom: '2.5rem'
                }}
              >
                {selectedMessage.body}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.2rem' }}>
                <button
                  onClick={() => {
                    setToRecipient(selectedMessage.from);
                    setSubject(`Re: ${selectedMessage.subject}`);
                    setActiveTab('compose');
                  }}
                  className="btn-durmstrang"
                >
                  <Send size={15} /> Odpowiedz na List
                </button>
              </div>
            </div>
          ) : (
            <div className="gothic-card" style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
              Wybierz list ze skrzynki, aby go odczytać.
            </div>
          )}
        </div>
      )}

      {/* 2. COMPOSE LETTER */}
      {activeTab === 'compose' && (
        <div
          className="gothic-card runic-corners"
          style={{
            padding: '2.5rem',
            maxWidth: '750px',
            margin: '0 auto',
            width: '100%',
            background: 'rgba(14, 18, 26, 0.95)',
            border: '1px solid var(--gold-ancient)'
          }}
        >
          <h2 style={{ fontSize: '1.6rem', color: '#ffffff', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Feather size={20} color="var(--gold-ancient)" /> Przygotuj List dla Kruka Posłańczego
          </h2>

          <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--gold-ancient)', marginBottom: '0.35rem', fontFamily: 'var(--font-heading)' }}>
                Adresat
              </label>
              <select
                value={toRecipient}
                onChange={(e) => setToRecipient(e.target.value)}
                className="gothic-select"
              >
                {recipients.map((r, i) => (
                  <option key={i} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--gold-ancient)', marginBottom: '0.35rem', fontFamily: 'var(--font-heading)' }}>
                Tytuł Listu
              </label>
              <input
                type="text"
                required
                placeholder="np. Pytanie dotyczące formuły Lækna-Galdr..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="gothic-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--gold-ancient)', marginBottom: '0.35rem', fontFamily: 'var(--font-heading)' }}>
                Treść Wiadomości (Pismo Runiczne)
              </label>
              <textarea
                rows={6}
                required
                placeholder="Napisz swój list do profesora lub innego adepta..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="gothic-textarea"
                style={{ fontFamily: 'var(--font-lore)', fontSize: '1.05rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => setActiveTab('inbox')} className="btn-durmstrang-secondary">
                Anuluj
              </button>
              <button type="submit" className="btn-durmstrang">
                <Send size={16} /> Wypuść Kruka z Listem
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
