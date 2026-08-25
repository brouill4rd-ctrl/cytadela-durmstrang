import React, { useState } from 'react';
import { Trophy, Shield, Award, Sparkles, Filter, ChevronRight, Eye } from 'lucide-react';

export const MemoryTrophiesTab = ({ trophies, onSelectYear }) => {
  const [selectedHouse, setSelectedHouse] = useState('all');
  const [selectedTrophyType, setSelectedTrophyType] = useState('all');
  const [selectedTrophyModal, setSelectedTrophyModal] = useState(null);

  const houseIcons = {
    reinhall: { icon: '🦌', name: 'Reinhall', color: '#fde047', border: '#c59f4e', bg: 'rgba(122, 24, 24, 0.25)' },
    bjornhall: { icon: '🐻', name: 'Björnhall', color: '#f87171', border: '#c02b2b', bg: 'rgba(32, 37, 48, 0.35)' },
    ravnheim: { icon: '🐦', name: 'Ravnheim', color: '#c084fc', border: '#a77de0', bg: 'rgba(28, 19, 46, 0.35)' },
    otergard: { icon: '🦦', name: 'Otergard', color: '#5eead4', border: '#2ec4b6', bg: 'rgba(13, 45, 51, 0.35)' }
  };

  const filteredTrophies = (trophies || []).filter(t => {
    if (selectedHouse !== 'all' && t.house?.toLowerCase() !== selectedHouse) return false;
    if (selectedTrophyType !== 'all' && t.trophyType !== selectedTrophyType) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div
        className="gothic-card"
        style={{
          padding: '2.5rem',
          textAlign: 'center',
          background: 'radial-gradient(circle at center, rgba(234, 179, 8, 0.12) 0%, rgba(10, 13, 18, 0.98) 75%)',
          border: '2px solid rgba(234, 179, 8, 0.4)'
        }}
      >
        <div style={{ fontSize: '0.8rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#fde047', fontFamily: 'var(--font-heading)' }}>
          OFICJALNE ARCHIWUM TROFEÓW
        </div>
        <h1 style={{ fontSize: '2.6rem', fontFamily: 'var(--font-heading)', color: '#ffffff', margin: '0.4rem 0 0.5rem' }}>
          SALA PUCHARÓW CYTADELI
        </h1>
        <p style={{ color: '#cbd5e1', maxWidth: '650px', margin: '0 auto', fontSize: '0.92rem', lineHeight: 1.6 }}>
          Wielkie gabloty ze złoconymi i kutymi trofeami kolejnych lat. Kliknij puchar, aby zobaczyć szczegóły triumfu, skład Zakonu i najważniejszych zdobywców punktów.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['all', 'reinhall', 'bjornhall', 'ravnheim', 'otergard'].map((h) => {
            const isActive = selectedHouse === h;
            const hInfo = houseIcons[h];
            return (
              <button
                key={h}
                onClick={() => setSelectedHouse(h)}
                style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: '4px',
                  background: isActive ? 'var(--gold-ancient)' : 'rgba(255, 255, 255, 0.05)',
                  color: isActive ? '#090d14' : '#cbd5e1',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                {hInfo?.icon} {h === 'all' ? 'Wszystkie Zakony' : hInfo?.name}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['all', 'house_cup', 'dueling_cup'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedTrophyType(type)}
              style={{
                padding: '0.45rem 0.8rem',
                borderRadius: '4px',
                background: selectedTrophyType === type ? 'rgba(197, 159, 78, 0.2)' : 'transparent',
                border: selectedTrophyType === type ? '1px solid #c59f4e' : '1px solid rgba(255,255,255,0.1)',
                color: selectedTrophyType === type ? '#fde047' : '#9ca3af',
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              {type === 'all' ? 'Wszystkie Trofea' : type === 'house_cup' ? 'Puchary Twierdzy' : 'Puchary Bojowe'}
            </button>
          ))}
        </div>
      </div>

      {/* Trophies Grid (3D Gabloty) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {filteredTrophies.map((tr) => {
          const hStyle = houseIcons[tr.house?.toLowerCase()] || houseIcons.ravnheim;
          return (
            <div
              key={tr.id}
              onClick={() => setSelectedTrophyModal(tr)}
              className="gothic-card"
              style={{
                padding: '2rem',
                cursor: 'pointer',
                border: `2px solid ${hStyle.border}`,
                background: `radial-gradient(circle at top, ${hStyle.bg} 0%, rgba(10, 13, 18, 0.98) 75%)`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1.2rem',
                boxShadow: `0 15px 35px rgba(0, 0, 0, 0.7), 0 0 25px ${hStyle.border}33`,
                transition: 'all 0.25s ease',
                position: 'relative'
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: '4.5rem',
                    lineHeight: 1,
                    margin: '0.5rem 0 1rem',
                    filter: 'drop-shadow(0 0 18px rgba(197, 159, 78, 0.4))'
                  }}
                >
                  {tr.icon || '🏆'}
                </div>

                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--gold-ancient)', fontWeight: 800 }}>
                  {tr.yearName || 'Roczniki Cytadeli'}
                </div>

                <h3 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-heading)', color: '#ffffff', margin: '0.3rem 0' }}>
                  {tr.title}
                </h3>

                <div style={{ fontSize: '1.1rem', color: hStyle.color, fontWeight: 800 }}>
                  {hStyle.icon} Zakon {hStyle.name} • {tr.points} pkt
                </div>

                <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.4, margin: '0.6rem 0 0' }}>
                  {tr.description}
                </p>
              </div>

              <div
                style={{
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingTop: '0.8rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.78rem'
                }}
              >
                <span style={{ color: '#9ca3af' }}>Opiekun: <strong style={{ color: '#ffffff' }}>{tr.houseHead}</strong></span>
                <span style={{ color: 'var(--gold-ancient)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  Szczegóły <Eye size={13} />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trophy Inspector Modal */}
      {selectedTrophyModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(4, 7, 12, 0.88)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setSelectedTrophyModal(null)}
        >
          <div
            className="gothic-card"
            style={{
              width: '100%',
              maxWidth: '560px',
              padding: '2.5rem',
              border: '2px solid var(--gold-ancient)',
              background: 'linear-gradient(145deg, #161a24 0%, #0c0f16 100%)',
              color: '#ffffff',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 35px rgba(197, 159, 78, 0.3)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '4.5rem', filter: 'drop-shadow(0 0 20px rgba(197, 159, 78, 0.4))' }}>
                {selectedTrophyModal.icon || '🏆'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--gold-ancient)', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '0.5rem' }}>
                {selectedTrophyModal.yearName}
              </div>
              <h2 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-heading)', margin: '0.2rem 0' }}>
                {selectedTrophyModal.title}
              </h2>
              <div style={{ fontSize: '1.1rem', color: '#fde047', fontWeight: 800 }}>
                Zwycięzca: Zakon {selectedTrophyModal.house?.toUpperCase()} ({selectedTrophyModal.points} pkt)
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.35)', padding: '1.2rem', borderRadius: '6px', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '0.82rem', color: '#9ca3af', marginBottom: '0.3rem' }}>Opis Triumfu:</div>
              <div style={{ fontSize: '0.9rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                {selectedTrophyModal.description}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--gold-ancient)', marginTop: '0.8rem' }}>
                Opiekun Zakonu: <strong>{selectedTrophyModal.houseHead}</strong>
              </div>
            </div>

            {selectedTrophyModal.topScorers && selectedTrophyModal.topScorers.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.82rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                  Kluczowi Zdobywcy Punktów:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {selectedTrophyModal.topScorers.map((sc, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.04)', padding: '0.6rem 0.8rem', borderRadius: '4px' }}>
                      <span style={{ fontWeight: 700 }}>{sc.name}</span>
                      <span style={{ color: 'var(--gold-ancient)', fontWeight: 800 }}>{sc.points} pkt</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <button
                onClick={() => {
                  const yId = selectedTrophyModal.schoolYearId;
                  setSelectedTrophyModal(null);
                  if (onSelectYear && yId) onSelectYear(yId);
                }}
                className="btn-durmstrang"
                style={{ flex: 1, padding: '0.7rem' }}
              >
                Przejdź do Archiwum Roku
              </button>
              <button
                onClick={() => setSelectedTrophyModal(null)}
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', padding: '0.7rem 1.2rem', borderRadius: '4px', cursor: 'pointer' }}
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
