import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import {
  X,
  Mail,
  CheckCircle,
  Clock,
  Shield,
  Award,
  Sparkles,
  Send,
  Trash2,
  Inbox,
  User,
  Scroll,
  Feather
} from 'lucide-react';

export const EmailInboxModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const { emails, setEmails, currentUser } = useSchool();
  const { playWandSwoosh, playRuneChime } = useSound();

  const [selectedEmailId, setSelectedEmailId] = useState(() => {
    return emails.length > 0 ? emails[0].id : null;
  });

  const selectedEmail = emails.find(e => e.id === selectedEmailId) || emails[0];

  const handleSelectEmail = (email) => {
    playWandSwoosh();
    setSelectedEmailId(email.id);
    if (!email.read) {
      setEmails(prev => prev.map(m => m.id === email.id ? { ...m, read: true } : m));
    }
  };

  const handleMarkAllRead = () => {
    playRuneChime();
    setEmails(prev => prev.map(m => ({ ...m, read: true })));
  };

  const unreadCount = emails.filter(e => !e.read).length;

  // Handle ESC key
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10002,
        background: 'rgba(2, 4, 7, 0.92)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem'
      }}
    >
      <div
        className="gothic-parchment-modal runic-corners"
        style={{
          width: '100%',
          maxWidth: '920px',
          height: '80vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(180deg, #101622 0%, #080c13 100%)',
          border: '1px solid var(--gold-ancient)',
          borderRadius: '8px',
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.98), 0 0 40px rgba(197, 159, 78, 0.25)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent */}
        <div style={{ height: '3px', background: 'linear-gradient(90deg, transparent, var(--gold-ancient), var(--ice-frost), transparent)' }} />

        {/* Header */}
        <div
          style={{
            padding: '1.2rem 1.75rem',
            borderBottom: '1px solid rgba(197, 159, 78, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(10, 14, 22, 0.85)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{ position: 'relative' }}>
              <Mail size={22} color="var(--gold-glow)" />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    background: 'var(--ruby-blood)',
                    color: '#ffffff',
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gold-ancient)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Kancelaria & Krucza Poczta Elektroniczna
              </div>
              <h2 style={{ fontSize: '1.35rem', color: '#ffffff', fontFamily: 'var(--font-heading)' }}>
                Skrzynka Poczty Adepta & Listów Rekrutacyjnych
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="btn-durmstrang-secondary"
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.8rem' }}
              >
                <CheckCircle size={12} /> Oznacz wszystkie jako przeczytane
              </button>
            )}

            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '4px',
                color: '#9ca3af',
                cursor: 'pointer',
                padding: '0.35rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* 2-Column Email Interface */}
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', flex: 1, minHeight: 0 }}>
          {/* Left Column: Email List */}
          <div
            style={{
              borderRight: '1px solid rgba(197, 159, 78, 0.2)',
              overflowY: 'auto',
              background: 'rgba(6, 9, 14, 0.7)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ padding: '0.8rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '0.75rem', color: '#9ca3af', display: 'flex', justifyContent: 'space-between' }}>
              <span>Otrzymane Zwoje ({emails.length})</span>
              <span>{unreadCount} nowych</span>
            </div>

            {emails.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#8c95a6', fontSize: '0.85rem' }}>
                Skrzynka jest pusta.
              </div>
            ) : (
              emails.map(email => {
                const isSelected = selectedEmail?.id === email.id;
                const isAcceptance = email.type === 'acceptance';
                return (
                  <button
                    key={email.id}
                    onClick={() => handleSelectEmail(email)}
                    style={{
                      padding: '1rem',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                      background: isSelected
                        ? 'rgba(197, 159, 78, 0.15)'
                        : !email.read
                        ? 'rgba(164, 200, 225, 0.08)'
                        : 'transparent',
                      borderLeft: isSelected
                        ? '3px solid var(--gold-glow)'
                        : !email.read
                        ? '3px solid var(--ice-crystal)'
                        : '3px solid transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem' }}>
                      <span style={{ fontWeight: 700, color: isAcceptance ? 'var(--gold-glow)' : '#cfd7e4' }}>
                        {email.fromName || email.from}
                      </span>
                      <span style={{ color: '#8c95a6' }}>{email.date?.split(' ')[0]}</span>
                    </div>

                    <div style={{ fontSize: '0.85rem', fontWeight: email.read ? 500 : 700, color: email.read ? '#ffffff' : 'var(--gold-glow)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {email.subject}
                    </div>

                    <div style={{ fontSize: '0.74rem', color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Do: {email.toName} ({email.toEmail})
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Right Column: Email Viewer */}
          <div style={{ padding: '2rem', overflowY: 'auto', background: 'rgba(10, 14, 22, 0.95)', display: 'flex', flexDirection: 'column' }}>
            {selectedEmail ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Email Header */}
                <div style={{ borderBottom: '1px solid rgba(197, 159, 78, 0.25)', paddingBottom: '1.2rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    {selectedEmail.type === 'acceptance' ? (
                      <span style={{ fontSize: '0.72rem', background: 'rgba(197, 159, 78, 0.2)', border: '1px solid var(--gold-ancient)', color: 'var(--gold-glow)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                        🏆 OFICJALNY LIST PRZYJĘCIA
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.72rem', background: 'rgba(164, 200, 225, 0.2)', border: '1px solid rgba(164, 200, 225, 0.4)', color: '#ffffff', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                        📜 POTWIERDZENIE REJESTRACJI
                      </span>
                    )}
                    <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{selectedEmail.date}</span>
                  </div>

                  <h3 style={{ fontSize: '1.35rem', color: '#ffffff', fontFamily: 'var(--font-heading)', marginBottom: '0.8rem' }}>
                    {selectedEmail.subject}
                  </h3>

                  <div style={{ fontSize: '0.82rem', color: '#cfd7e4', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <div>
                      <strong style={{ color: 'var(--gold-ancient)' }}>Nadawca:</strong> {selectedEmail.fromName} &lt;{selectedEmail.from}&gt;
                    </div>
                    <div>
                      <strong style={{ color: 'var(--gold-ancient)' }}>Adresat:</strong> {selectedEmail.toName} &lt;{selectedEmail.toEmail}&gt;
                    </div>
                  </div>
                </div>

                {/* Email Body Parchment */}
                <div
                  style={{
                    flex: 1,
                    background: 'radial-gradient(circle at 50% 50%, rgba(20, 26, 38, 0.9) 0%, rgba(10, 14, 22, 0.95) 100%)',
                    border: '1px solid rgba(197, 159, 78, 0.2)',
                    borderRadius: '6px',
                    padding: '2rem',
                    color: '#cfd7e4',
                    fontSize: '0.95rem',
                    lineHeight: 1.8,
                    whiteSpace: 'pre-line',
                    boxShadow: 'inset 0 0 30px rgba(0,0,0,0.6)'
                  }}
                >
                  {selectedEmail.body}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8c95a6' }}>
                Wybierz wiadomość z listy po lewej stronie.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
