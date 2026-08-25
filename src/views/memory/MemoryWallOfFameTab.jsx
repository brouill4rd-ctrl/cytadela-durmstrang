import React from 'react';
import { Shield, Trophy, Award, Crown, Sparkles, Star, Flame, ChevronRight } from 'lucide-react';

export const MemoryWallOfFameTab = ({ wallData, onSelectYear, onSelectPerson }) => {
  const houseCups = wallData?.houseCups || [];
  const topAwards = wallData?.topAwards || [];
  const allTimeTopStudents = wallData?.allTimeTopStudents || [];
  const specialAchievements = wallData?.specialAchievements || [];

  const houseIcons = {
    reinhall: { icon: '🦌', name: 'Reinhall', color: '#fde047', border: '#c59f4e', bg: 'rgba(122, 24, 24, 0.25)' },
    bjornhall: { icon: '🐻', name: 'Björnhall', color: '#f87171', border: '#c02b2b', bg: 'rgba(32, 37, 48, 0.35)' },
    ravnheim: { icon: '🐦', name: 'Ravnheim', color: '#c084fc', border: '#a77de0', bg: 'rgba(28, 19, 46, 0.35)' },
    otergard: { icon: '🦦', name: 'Otergard', color: '#5eead4', border: '#2ec4b6', bg: 'rgba(13, 45, 51, 0.35)' }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Wall Header */}
      <div
        className="gothic-card"
        style={{
          padding: '2.5rem',
          textAlign: 'center',
          background: 'radial-gradient(ellipse at center, rgba(197, 159, 78, 0.12) 0%, rgba(10, 13, 18, 0.98) 75%)',
          border: '2px solid #c59f4e',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(197, 159, 78, 0.2)'
        }}
      >
        <div style={{ fontSize: '0.8rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold-ancient)', fontFamily: 'var(--font-heading)' }}>
          MONUMENTALNA GALERIA CHWAŁY
        </div>
        <h1 style={{ fontSize: '2.8rem', fontFamily: 'var(--font-heading)', color: '#ffffff', margin: '0.4rem 0 0.6rem' }}>
          ŚCIANA CHWAŁY CYTADELI
        </h1>
        <p style={{ color: '#a39b89', maxWidth: '650px', margin: '0 auto', fontSize: '0.92rem', lineHeight: 1.6 }}>
          Wykute w skale tablice z mosiądzu i żelaza upamiętniające najwyższe triumfy Zakonów, Uczniów Roku i legendarne rekordy Twierdzy Magii Durmstrang.
        </p>
      </div>

      {/* 1. HOUSE CUP WINNERS (MISTRZOWIE ZAKONÓW) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.2rem' }}>
          <Trophy size={24} color="#fde047" />
          <h2 style={{ fontSize: '1.6rem', color: '#ffffff', fontFamily: 'var(--font-heading)', margin: 0 }}>
            Zdobywcy Pucharu Twierdzy Magii (Wszystkie Lata)
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.4rem' }}>
          {houseCups.map((cup) => {
            const h = houseIcons[cup.house?.toLowerCase()] || houseIcons.ravnheim;
            return (
              <div
                key={cup.id}
                onClick={() => onSelectYear(cup.schoolYearId)}
                className="gothic-card"
                style={{
                  padding: '1.8rem',
                  cursor: 'pointer',
                  border: `2px solid ${h.border}`,
                  background: `linear-gradient(145deg, ${h.bg} 0%, rgba(8, 11, 16, 0.98) 100%)`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  transition: 'all 0.25s ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold-ancient)', fontWeight: 800 }}>
                      {cup.yearName}
                    </span>
                    <span style={{ fontSize: '1.5rem' }}>{h.icon}</span>
                  </div>

                  <h3 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)', color: '#ffffff', margin: '0.2rem 0' }}>
                    Zakon {h.name}
                  </h3>
                  <div style={{ fontSize: '1.4rem', fontFamily: 'var(--font-heading)', color: h.color, fontWeight: 800 }}>
                    {cup.points} pkt
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.4, margin: '0.4rem 0 0' }}>
                    {cup.description}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.6rem', fontSize: '0.75rem', color: 'var(--gold-ancient)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Opiekun: {cup.houseHead}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 700 }}>Otwórz Rocznik <ChevronRight size={13} /></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. STUDENTS & PROFESSORS OF THE YEAR */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.2rem' }}>
          <Crown size={24} color="var(--gold-ancient)" />
          <h2 style={{ fontSize: '1.6rem', color: '#ffffff', fontFamily: 'var(--font-heading)', margin: 0 }}>
            Uczniowie & Profesorowie Roku
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.2rem' }}>
          {topAwards.map((aw) => (
            <div
              key={aw.id}
              className="gothic-card"
              style={{
                padding: '1.5rem',
                border: '1px solid rgba(197, 159, 78, 0.35)',
                background: 'linear-gradient(135deg, rgba(197, 159, 78, 0.08) 0%, rgba(10, 13, 18, 0.95) 100%)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}
            >
              <div style={{ fontSize: '2.5rem' }}>{aw.icon || '👑'}</div>
              <div>
                <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold-ancient)', fontWeight: 800 }}>
                  {aw.yearName}
                </span>
                <h3 style={{ fontSize: '1.15rem', color: '#ffffff', fontFamily: 'var(--font-heading)', margin: '0.1rem 0 0.2rem' }}>
                  {aw.recipientName}
                </h3>
                <div style={{ fontSize: '0.78rem', color: '#fde047', fontWeight: 700 }}>
                  {aw.title}
                </div>
                <p style={{ fontSize: '0.72rem', color: '#9ca3af', margin: '0.2rem 0 0', lineHeight: 1.3 }}>
                  {aw.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. ALL-TIME TOP INDIVIDUAL SCORES */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.2rem' }}>
          <Star size={24} color="#fde047" />
          <h2 style={{ fontSize: '1.6rem', color: '#ffffff', fontFamily: 'var(--font-heading)', margin: 0 }}>
            Wszechczasowe Rekordy Punktowe Adeptów
          </h2>
        </div>

        <div style={{ border: '1px solid rgba(197, 159, 78, 0.25)', borderRadius: '6px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(197, 159, 78, 0.12)', color: '#ffffff', borderBottom: '1px solid rgba(197, 159, 78, 0.25)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>#</th>
                <th style={{ padding: '0.75rem 1rem' }}>Adept</th>
                <th style={{ padding: '0.75rem 1rem' }}>Zakon</th>
                <th style={{ padding: '0.75rem 1rem' }}>Rok Szkolny</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Punkty</th>
              </tr>
            </thead>
            <tbody>
              {allTimeTopStudents.map((st, idx) => (
                <tr
                  key={idx}
                  onClick={() => onSelectPerson(st.userId || st.characterName)}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    background: idx === 0 ? 'rgba(197, 159, 78, 0.1)' : idx % 2 === 0 ? 'rgba(0,0,0,0.2)' : 'transparent',
                    cursor: 'pointer'
                  }}
                >
                  <td style={{ padding: '0.75rem 1rem', color: idx === 0 ? '#fde047' : '#9ca3af', fontWeight: 800 }}>
                    {idx === 0 ? '🥇 1.' : idx === 1 ? '🥈 2.' : idx === 2 ? '🥉 3.' : `${idx + 1}.`}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#ffffff' }}>
                    {st.characterName}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: houseIcons[st.house?.toLowerCase()]?.color || '#cbd5e1' }}>
                    {houseIcons[st.house?.toLowerCase()]?.icon} {houseIcons[st.house?.toLowerCase()]?.name || st.house}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#9ca3af' }}>{st.yearName}</td>
                  <td style={{ padding: '0.75rem 1rem', color: st.isGraduate ? '#10b981' : '#cbd5e1' }}>
                    {st.isGraduate ? '🎓 Absolwent' : st.classYear}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 800, color: 'var(--gold-ancient)' }}>
                    {st.points} pkt
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
