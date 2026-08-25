import React, { useState } from 'react';
import {
  GraduationCap,
  FileText,
  Award,
  Trophy,
  Users,
  Shield,
  BookOpen,
  Calendar,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Eye,
  Crown,
  Newspaper,
  Swords,
  Star,
  CheckCircle2,
  Bookmark
} from 'lucide-react';

export const MemoryYearViewTab = ({
  yearData,
  onSelectPerson,
  onInspectCertificate,
  onInspectDiploma
}) => {
  const [activeSection, setActiveSection] = useState('graduates');
  const [rankingTab, setRankingTab] = useState('students');

  if (!yearData || !yearData.year) {
    return (
      <div className="gothic-card" style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
        <p>Wczytywanie archiwum roku szkolnego...</p>
      </div>
    );
  }

  const {
    year,
    people = [],
    graduates = [],
    students = [],
    staff = [],
    professors = [],
    interns = [],
    leadership = [],
    houseHeads = [],
    trophies = [],
    certificates = [],
    diplomas = [],
    awards = [],
    rankings = [],
    plebiscites = [],
    chronicleEvents = [],
    gazette = null,
    achievements = []
  } = yearData;

  const houseColors = {
    reinhall: { text: '#fde047', border: '#c59f4e', bg: 'rgba(122, 24, 24, 0.25)', icon: '🦌', name: 'Reinhall' },
    bjornhall: { text: '#f87171', border: '#c02b2b', bg: 'rgba(32, 37, 48, 0.35)', icon: '🐻', name: 'Björnhall' },
    ravnheim: { text: '#c084fc', border: '#a77de0', bg: 'rgba(28, 19, 46, 0.35)', icon: '🐦', name: 'Ravnheim' },
    otergard: { text: '#5eead4', border: '#2ec4b6', bg: 'rgba(13, 45, 51, 0.35)', icon: '🦦', name: 'Otergard' }
  };

  const sections = [
    { id: 'graduates', label: 'Absolwenci', icon: '🎓', count: graduates.length },
    { id: 'certificates', label: 'Świadectwa', icon: '📜', count: certificates.length },
    { id: 'diplomas', label: 'Dyplomy', icon: '🎖️', count: diplomas.length },
    { id: 'awards', label: 'Wyróżnienia', icon: '⭐', count: awards.length },
    { id: 'trophies', label: 'Puchary', icon: '🏆', count: trophies.length },
    { id: 'rankings', label: 'Rankingi', icon: '📊', count: rankings.length },
    { id: 'professors', label: 'Kadra', icon: '🧙‍♂️', count: professors.length },
    { id: 'interns', label: 'Stażyści', icon: '📖', count: interns.length },
    { id: 'leadership', label: 'Władze & Samorząd', icon: '👑', count: leadership.length },
    { id: 'gazette', label: 'Żelazne Pióro', icon: '📰', count: gazette?.issuesCount || (gazette ? 1 : 0) },
    { id: 'events', label: 'Wydarzenia & Konkursy', icon: '⚔️', count: chronicleEvents.length },
    { id: 'plebiscites', label: 'Plebiscyty', icon: '❄️', count: plebiscites.length },
    { id: 'achievements', label: 'Osiągnięcia', icon: '🗝️', count: achievements.length }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* =========================================================================
          1. YEAR HEADER / METRIC BANNER
          ========================================================================= */}
      <div
        className="gothic-card"
        style={{
          padding: '2.5rem',
          background: 'linear-gradient(135deg, rgba(20, 25, 35, 0.95) 0%, rgba(8, 11, 16, 0.98) 100%)',
          border: '1px solid rgba(197, 159, 78, 0.4)',
          boxShadow: '0 15px 40px rgba(0, 0, 0, 0.75)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <span style={{ color: 'var(--gold-ancient)', fontSize: '0.85rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
              {year.term || 'Semestr Północy'} • {year.dateRange || 'Roczniki Cytadeli'}
            </span>
            <h1 style={{ fontSize: '2.6rem', color: '#ffffff', fontFamily: 'var(--font-heading)', margin: '0.3rem 0 0.5rem' }}>
              {year.name}
            </h1>
            <p style={{ color: '#cbd5e1', fontSize: '0.95rem', maxWidth: '750px', lineHeight: 1.6, margin: 0 }}>
              {year.summary || 'Oficjalne archiwum roku szkolnego w Twierdzy Magii Durmstrang.'}
            </p>
          </div>

          <div
            style={{
              background: houseColors[year.winningHouse?.toLowerCase()]?.bg || 'rgba(197, 159, 78, 0.15)',
              border: `1px solid ${houseColors[year.winningHouse?.toLowerCase()]?.border || 'var(--gold-ancient)'}`,
              borderRadius: '8px',
              padding: '1.2rem 1.6rem',
              textAlign: 'center',
              minWidth: '220px'
            }}
          >
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9ca3af' }}>
              Zwycięski Zakon
            </div>
            <div style={{ fontSize: '1.4rem', fontFamily: 'var(--font-heading)', fontWeight: 800, color: houseColors[year.winningHouse?.toLowerCase()]?.text || '#ffffff', marginTop: '0.2rem' }}>
              {houseColors[year.winningHouse?.toLowerCase()]?.icon} {houseColors[year.winningHouse?.toLowerCase()]?.name || year.winningHouse}
            </div>
            <div style={{ fontSize: '1.1rem', color: '#ffffff', fontWeight: 800, marginTop: '0.2rem' }}>
              {year.winningPoints} pkt
            </div>
          </div>
        </div>

        {/* 6 Core Metrics Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '1rem',
            marginTop: '2rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '1.5rem'
          }}
        >
          <div>
            <span style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Dyrekcja:</span>
            <div style={{ fontSize: '0.92rem', color: '#ffffff', fontWeight: 700, marginTop: '2px' }}>{year.headmaster || 'Rada Arcymistrzów'}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Zastępca:</span>
            <div style={{ fontSize: '0.92rem', color: '#ffffff', fontWeight: 700, marginTop: '2px' }}>{year.deputy || 'Prof. Morana Vane'}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Prymus Roku:</span>
            <div style={{ fontSize: '0.92rem', color: 'var(--gold-ancient)', fontWeight: 700, marginTop: '2px' }}>{year.bestStudent || 'Brak'}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Profesor Roku:</span>
            <div style={{ fontSize: '0.92rem', color: '#fde047', fontWeight: 700, marginTop: '2px' }}>{year.bestProfessor || 'Brak'}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Liczba Uczniów:</span>
            <div style={{ fontSize: '0.92rem', color: '#ffffff', fontWeight: 700, marginTop: '2px' }}>{year.studentCount || people.length} Adeptów</div>
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Wydarzenie Roku:</span>
            <div style={{ fontSize: '0.86rem', color: '#cbd5e1', fontWeight: 600, marginTop: '2px' }}>{year.highlightEvent || 'Ceremonia Paktu'}</div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. SECTION SELECTOR TABS
          ========================================================================= */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderBottom: '1px solid rgba(197, 159, 78, 0.25)', paddingBottom: '0.5rem' }}>
        {sections.map((sec) => {
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              style={{
                padding: '0.6rem 1.1rem',
                background: isActive ? 'linear-gradient(135deg, rgba(197, 159, 78, 0.2) 0%, rgba(197, 159, 78, 0.08) 100%)' : 'rgba(255, 255, 255, 0.03)',
                border: isActive ? '1px solid #c59f4e' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                color: isActive ? 'var(--gold-ancient)' : '#cbd5e1',
                fontSize: '0.85rem',
                fontFamily: 'var(--font-heading)',
                fontWeight: isActive ? 800 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                transition: 'all 0.2s ease'
              }}
            >
              <span>{sec.icon}</span>
              <span>{sec.label}</span>
              {sec.count > 0 && (
                <span
                  style={{
                    background: isActive ? 'var(--gold-ancient)' : 'rgba(255, 255, 255, 0.1)',
                    color: isActive ? '#090d14' : '#9ca3af',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '0.1rem 0.4rem',
                    borderRadius: '10px'
                  }}
                >
                  {sec.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          3. SECTION CONTENT SWITCHER
          ========================================================================= */}

      {/* 3.1 ABSOLWENCI */}
      {activeSection === 'graduates' && (
        <div>
          <h3 style={{ fontSize: '1.3rem', color: '#ffffff', fontFamily: 'var(--font-heading)', marginBottom: '1rem' }}>
            🎓 Absolwenci — {year.name}
          </h3>
          {graduates.length === 0 ? (
            <div className="gothic-card" style={{ padding: '2.5rem', textAlign: 'center', color: '#9ca3af' }}>
              W tym roku szkolnym nie odnotowano jeszcze absolwentów kończących II Krąg.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.2rem' }}>
              {graduates.map((grad) => {
                const hStyle = houseColors[grad.house?.toLowerCase()] || houseColors.ravnheim;
                return (
                  <div
                    key={grad.id}
                    className="gothic-card"
                    style={{
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      border: `1px solid ${hStyle.border}66`,
                      background: 'linear-gradient(145deg, rgba(15, 20, 30, 0.95) 0%, rgba(8, 11, 16, 0.98) 100%)'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <img
                        src={grad.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                        alt={grad.characterName}
                        style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${hStyle.border}` }}
                      />
                      <div>
                        <div style={{ fontSize: '1.15rem', fontFamily: 'var(--font-heading)', fontWeight: 800, color: '#ffffff' }}>
                          {grad.characterName}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: hStyle.text, fontWeight: 700 }}>
                          {hStyle.icon} Zakon {hStyle.name}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.82rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.35rem', background: 'rgba(0,0,0,0.3)', padding: '0.8rem', borderRadius: '4px' }}>
                      <div>Ocena końcowa: <strong style={{ color: 'var(--gold-ancient)' }}>{grad.finalGrade || 'Wybitny'}</strong></div>
                      <div>Najlepszy przedmiot: <strong style={{ color: '#ffffff' }}>{grad.bestSubject || 'Starożytne Runy'}</strong></div>
                      <div>Wyróżnienia: <strong style={{ color: '#fde047' }}>{grad.honorsCount || 1}</strong></div>
                    </div>

                    <button
                      onClick={() => onSelectPerson(grad.userId || grad.characterName)}
                      className="btn-durmstrang"
                      style={{
                        padding: '0.55rem',
                        width: '100%',
                        fontSize: '0.78rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <Eye size={13} /> Zobacz Profil Historyczny
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3.2 ŚWIADECTWA */}
      {activeSection === 'certificates' && (
        <div>
          <h3 style={{ fontSize: '1.3rem', color: '#ffffff', fontFamily: 'var(--font-heading)', marginBottom: '1rem' }}>
            📜 Cyfrowe Świadectwa Szkolne — {year.name}
          </h3>
          {certificates.length === 0 ? (
            <div className="gothic-card" style={{ padding: '2.5rem', textAlign: 'center', color: '#9ca3af' }}>
              Brak zarchiwizowanych świadectw dla tego roku.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.2rem' }}>
              {certificates.map((cert) => {
                const hStyle = houseColors[cert.house?.toLowerCase()] || houseColors.ravnheim;
                return (
                  <div
                    key={cert.id}
                    className="gothic-card"
                    style={{
                      padding: '1.5rem',
                      border: '1px solid rgba(197, 159, 78, 0.3)',
                      background: 'radial-gradient(ellipse at top, rgba(197, 159, 78, 0.06) 0%, rgba(10, 13, 18, 0.95) 80%)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '1rem'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontFamily: 'var(--font-heading)' }}>
                          {cert.documentNumber}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: hStyle.text, fontWeight: 700 }}>
                          {hStyle.icon} {hStyle.name}
                        </span>
                      </div>
                      <h4 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)', color: '#ffffff', margin: '0.4rem 0 0.2rem' }}>
                        {cert.studentName}
                      </h4>
                      <div style={{ fontSize: '0.82rem', color: 'var(--gold-ancient)', fontWeight: 700 }}>
                        Ocena: {cert.finalEvaluation} • Średnia: {cert.averageScore}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      <button
                        onClick={() => onInspectCertificate(cert)}
                        className="btn-durmstrang"
                        style={{ flex: 1, padding: '0.5rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                      >
                        <Eye size={13} /> Zobacz Świadectwo
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3.3 DYPLOMY */}
      {activeSection === 'diplomas' && (
        <div>
          <h3 style={{ fontSize: '1.3rem', color: '#ffffff', fontFamily: 'var(--font-heading)', marginBottom: '1rem' }}>
            🎖️ Galeria Dyplomów & Osiągnięć — {year.name}
          </h3>
          {diplomas.length === 0 ? (
            <div className="gothic-card" style={{ padding: '2.5rem', textAlign: 'center', color: '#9ca3af' }}>
              Brak zarchiwizowanych dyplomów dla tego roku.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.2rem' }}>
              {diplomas.map((dipl) => {
                const hStyle = houseColors[dipl.house?.toLowerCase()] || houseColors.ravnheim;
                return (
                  <div
                    key={dipl.id}
                    className="gothic-card"
                    style={{
                      padding: '1.5rem',
                      border: '1px solid rgba(197, 159, 78, 0.3)',
                      background: 'radial-gradient(circle at top right, rgba(234, 179, 8, 0.08) 0%, rgba(10, 13, 18, 0.95) 80%)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '1rem'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold-ancient)', fontWeight: 800 }}>
                          {dipl.place} • {dipl.category?.toUpperCase()}
                        </span>
                        <span style={{ fontSize: '0.8rem' }}>{dipl.badgeIcon || '📜'}</span>
                      </div>
                      <h4 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', color: '#ffffff', margin: '0.2rem 0' }}>
                        {dipl.title}
                      </h4>
                      <div style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>
                        Nagrodzony: <strong>{dipl.recipientName}</strong> ({hStyle.name})
                      </div>
                      <p style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.4rem', lineHeight: 1.4 }}>
                        {dipl.description}
                      </p>
                    </div>

                    <button
                      onClick={() => onInspectDiploma(dipl)}
                      className="btn-durmstrang"
                      style={{ padding: '0.5rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                    >
                      <Eye size={13} /> Otwórz Dyplom
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3.4 WYRÓŻNIENIA */}
      {activeSection === 'awards' && (
        <div>
          <h3 style={{ fontSize: '1.3rem', color: '#ffffff', fontFamily: 'var(--font-heading)', marginBottom: '1rem' }}>
            ⭐ Galeria Wyróżnień Specjalnych — {year.name}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.2rem' }}>
            {awards.map((aw) => (
              <div
                key={aw.id}
                className="gothic-card"
                style={{
                  padding: '1.5rem',
                  border: '1px solid rgba(197, 159, 78, 0.4)',
                  background: 'linear-gradient(135deg, rgba(197, 159, 78, 0.08) 0%, rgba(10, 13, 18, 0.95) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}
              >
                <div style={{ fontSize: '2.4rem' }}>{aw.icon || '⭐'}</div>
                <div>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold-ancient)', fontWeight: 800 }}>
                    {aw.awardType?.replace('_', ' ').toUpperCase()}
                  </div>
                  <h4 style={{ fontSize: '1.15rem', color: '#ffffff', margin: '0.2rem 0', fontFamily: 'var(--font-heading)' }}>
                    {aw.title}
                  </h4>
                  <div style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 700 }}>
                    {aw.recipientName} {aw.house ? `(${aw.house.toUpperCase()})` : ''}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.3rem 0 0', lineHeight: 1.4 }}>
                    {aw.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3.5 PUCHARY */}
      {activeSection === 'trophies' && (
        <div>
          <h3 style={{ fontSize: '1.3rem', color: '#ffffff', fontFamily: 'var(--font-heading)', marginBottom: '1rem' }}>
            🏆 Zdobyte Puchary & Trofea — {year.name}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.4rem' }}>
            {trophies.map((tr) => {
              const hStyle = houseColors[tr.house?.toLowerCase()] || houseColors.ravnheim;
              return (
                <div
                  key={tr.id}
                  className="gothic-card"
                  style={{
                    padding: '1.8rem',
                    border: `1px solid ${hStyle.border}`,
                    background: `radial-gradient(circle at top right, ${hStyle.bg} 0%, rgba(10, 13, 18, 0.95) 80%)`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{tr.icon || '🏆'}</div>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: hStyle.text, fontWeight: 800 }}>
                      Zakon {hStyle.name} • {tr.points} pkt
                    </div>
                    <h4 style={{ fontSize: '1.35rem', fontFamily: 'var(--font-heading)', color: '#ffffff', margin: '0.3rem 0' }}>
                      {tr.title}
                    </h4>
                    <p style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>
                      {tr.description}
                    </p>
                  </div>

                  {tr.topScorers && tr.topScorers.length > 0 && (
                    <div style={{ background: 'rgba(0, 0, 0, 0.4)', borderRadius: '4px', padding: '0.8rem', fontSize: '0.78rem' }}>
                      <div style={{ color: '#9ca3af', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>
                        Kluczowi Zdobywcy Punktów:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', color: '#ffffff' }}>
                        {tr.topScorers.map((sc, i) => (
                          <div key={i}>• {sc.name}: <strong>{sc.points} pkt</strong></div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3.6 RANKINGI HISTORYCZNE */}
      {activeSection === 'rankings' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.3rem', color: '#ffffff', fontFamily: 'var(--font-heading)', margin: 0 }}>
              📊 Zamrożone Rankingi Końcowe — {year.name}
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setRankingTab('students')}
                style={{
                  padding: '0.4rem 0.9rem',
                  borderRadius: '4px',
                  background: rankingTab === 'students' ? 'var(--gold-ancient)' : 'rgba(255,255,255,0.06)',
                  color: rankingTab === 'students' ? '#090d14' : '#cbd5e1',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  border: 'none'
                }}
              >
                Ranking Adeptów
              </button>
              <button
                onClick={() => setRankingTab('houses')}
                style={{
                  padding: '0.4rem 0.9rem',
                  borderRadius: '4px',
                  background: rankingTab === 'houses' ? 'var(--gold-ancient)' : 'rgba(255,255,255,0.06)',
                  color: rankingTab === 'houses' ? '#090d14' : '#cbd5e1',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  border: 'none'
                }}
              >
                Ranking Zakonów
              </button>
            </div>
          </div>

          {/* Student Ranking Table */}
          {rankingTab === 'students' && (
            <div style={{ border: '1px solid rgba(197, 159, 78, 0.25)', borderRadius: '6px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(197, 159, 78, 0.12)', color: '#ffffff', borderBottom: '1px solid rgba(197, 159, 78, 0.25)' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>#</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Adept</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Zakon</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Klasa</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Punkty Końcowe</th>
                  </tr>
                </thead>
                <tbody>
                  {(rankings.find(r => r.rankingType === 'students')?.standings || []).map((st, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', background: idx % 2 === 0 ? 'rgba(0,0,0,0.2)' : 'transparent' }}>
                      <td style={{ padding: '0.75rem 1rem', color: idx === 0 ? '#fde047' : '#9ca3af', fontWeight: 800 }}>{st.rank || idx + 1}.</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#ffffff' }}>{st.name}</td>
                      <td style={{ padding: '0.75rem 1rem', color: houseColors[st.house?.toLowerCase()]?.text || '#cbd5e1' }}>
                        {houseColors[st.house?.toLowerCase()]?.icon} {houseColors[st.house?.toLowerCase()]?.name || st.house}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#9ca3af' }}>{st.classYear}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 800, color: 'var(--gold-ancient)' }}>{st.points} pkt</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* House Ranking Standings */}
          {rankingTab === 'houses' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              {(rankings.find(r => r.rankingType === 'houses')?.standings || []).map((h, idx) => {
                const hStyle = houseColors[h.house?.toLowerCase()] || houseColors.ravnheim;
                return (
                  <div
                    key={idx}
                    className="gothic-card"
                    style={{
                      padding: '1.5rem',
                      border: `1px solid ${hStyle.border}`,
                      background: hStyle.bg,
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '2rem' }}>{hStyle.icon}</div>
                    <div style={{ fontSize: '1.4rem', fontFamily: 'var(--font-heading)', color: '#ffffff', fontWeight: 800, margin: '0.3rem 0' }}>
                      {hStyle.name}
                    </div>
                    <div style={{ fontSize: '1.8rem', fontFamily: 'var(--font-heading)', color: hStyle.text, fontWeight: 800 }}>
                      {h.points} pkt
                    </div>
                    {idx === 0 && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', fontWeight: 800, color: '#fde047', textTransform: 'uppercase' }}>
                        🏆 Puchar XVII Roku
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3.7 KADRA */}
      {activeSection === 'professors' && (
        <div>
          <h3 style={{ fontSize: '1.3rem', color: '#ffffff', fontFamily: 'var(--font-heading)', marginBottom: '1rem' }}>
            🧙‍♂️ Skład Kadry Pedagogicznej — {year.name}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.2rem' }}>
            {professors.map((prof) => (
              <div
                key={prof.id}
                className="gothic-card"
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'center',
                  border: '1px solid rgba(197, 159, 78, 0.3)'
                }}
              >
                <img
                  src={prof.avatar || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100'}
                  alt={prof.name}
                  style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gold-ancient)' }}
                />
                <div>
                  <div style={{ fontSize: '1.1rem', fontFamily: 'var(--font-heading)', fontWeight: 800, color: '#ffffff' }}>
                    {prof.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gold-ancient)', fontWeight: 600 }}>
                    {prof.subjectName}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '2px' }}>
                    {prof.title}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3.8 STAŻYŚCI */}
      {activeSection === 'interns' && (
        <div>
          <h3 style={{ fontSize: '1.3rem', color: '#ffffff', fontFamily: 'var(--font-heading)', marginBottom: '1rem' }}>
            📖 Staż Nauczycielski — {year.name}
          </h3>
          {interns.length === 0 ? (
            <div className="gothic-card" style={{ padding: '2.5rem', textAlign: 'center', color: '#9ca3af' }}>
              W tym roku nie prowadzono staży nauczycielskich.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.2rem' }}>
              {interns.map((intern) => (
                <div
                  key={intern.id}
                  className="gothic-card"
                  style={{
                    padding: '1.5rem',
                    border: '1px solid rgba(46, 196, 182, 0.3)',
                    background: 'linear-gradient(145deg, rgba(13, 45, 51, 0.25) 0%, rgba(10, 13, 18, 0.95) 100%)'
                  }}
                >
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.8rem' }}>
                    <img
                      src={intern.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100'}
                      alt={intern.name}
                      style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #2ec4b6' }}
                    />
                    <div>
                      <div style={{ fontSize: '1.1rem', fontFamily: 'var(--font-heading)', fontWeight: 800, color: '#ffffff' }}>
                        {intern.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#2ec4b6', fontWeight: 600 }}>
                        Staż: {intern.subjectName}
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                    <div>Mentor: <strong>{intern.mentorName || 'Prof. Ezra Camhi'}</strong></div>
                    <div>Status: <strong style={{ color: '#10b981' }}>{intern.internStatus?.toUpperCase() || 'UKOŃCZONY'}</strong></div>
                    <p style={{ marginTop: '0.4rem', color: '#9ca3af', fontSize: '0.76rem' }}>
                      {intern.dutiesSummary}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3.9 WŁADZE */}
      {activeSection === 'leadership' && (
        <div>
          <h3 style={{ fontSize: '1.3rem', color: '#ffffff', fontFamily: 'var(--font-heading)', marginBottom: '1rem' }}>
            👑 Władze Twierdzy, Opiekunowie & Samorząd — {year.name}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.2rem' }}>
            {staff.filter(s => ['headmaster', 'deputy', 'house_head', 'herald', 'warden', 'admin'].includes(s.role)).map((ldr) => (
              <div
                key={ldr.id}
                className="gothic-card"
                style={{
                  padding: '1.4rem',
                  border: '1px solid rgba(197, 159, 78, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}
              >
                <div style={{ fontSize: '2rem' }}>{ldr.role === 'headmaster' ? '👑' : ldr.role === 'house_head' ? '🛡️' : '📯'}</div>
                <div>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold-ancient)', fontWeight: 800 }}>
                    {ldr.title}
                  </div>
                  <div style={{ fontSize: '1.1rem', fontFamily: 'var(--font-heading)', color: '#ffffff', fontWeight: 800 }}>
                    {ldr.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>
                    {ldr.dutiesSummary || 'Nadzór nad dyscypliną i ceremoniami Twierdzy.'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3.10 ŻELAZNE PIÓRO */}
      {activeSection === 'gazette' && (
        <div>
          <h3 style={{ fontSize: '1.3rem', color: '#ffffff', fontFamily: 'var(--font-heading)', marginBottom: '1rem' }}>
            📰 Żelazne Pióro — Kronika Redakcji {year.name}
          </h3>
          {gazette ? (
            <div className="gothic-card" style={{ padding: '2rem', border: '1px solid rgba(197, 159, 78, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--gold-ancient)', letterSpacing: '0.12em' }}>Redaktor Naczelny</span>
                  <div style={{ fontSize: '1.4rem', fontFamily: 'var(--font-heading)', color: '#ffffff', fontWeight: 800 }}>
                    {gazette.editorInChief}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#9ca3af' }}>Wydane Numery</span>
                  <div style={{ fontSize: '1.4rem', fontFamily: 'var(--font-heading)', color: 'var(--gold-ancient)', fontWeight: 800 }}>
                    {gazette.issuesCount} Wydań
                  </div>
                </div>
              </div>

              {/* Editorial Staff */}
              <h4 style={{ fontSize: '1rem', color: '#ffffff', fontFamily: 'var(--font-heading)', marginBottom: '0.8rem' }}>
                Zespół Redakcyjny:
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.8rem', marginBottom: '1.5rem' }}>
                {(gazette.editorialStaff || []).map((st, i) => (
                  <div key={i} style={{ background: 'rgba(0,0,0,0.3)', padding: '0.6rem 0.8rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff' }}>{st.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{st.role}</div>
                  </div>
                ))}
              </div>

              {/* Published issues links */}
              <h4 style={{ fontSize: '1rem', color: '#ffffff', fontFamily: 'var(--font-heading)', marginBottom: '0.8rem' }}>
                Wydania Gazetki w tym roku:
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.8rem' }}>
                {(gazette.issuesLinks || []).map((iss, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'rgba(197, 159, 78, 0.06)',
                      border: '1px solid rgba(197, 159, 78, 0.2)',
                      borderRadius: '4px',
                      padding: '0.8rem 1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>Nr {iss.issueNumber}: {iss.title}</div>
                      <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{iss.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="gothic-card" style={{ padding: '2.5rem', textAlign: 'center', color: '#9ca3af' }}>
              Brak zarchiwizowanych danych redakcji gazetki.
            </div>
          )}
        </div>
      )}

      {/* 3.11 WYDARZENIA & KONKURSY */}
      {activeSection === 'events' && (
        <div>
          <h3 style={{ fontSize: '1.3rem', color: '#ffffff', fontFamily: 'var(--font-heading)', marginBottom: '1rem' }}>
            ⚔️ Kronika Turniejów, Wypraw & Konkursów — {year.name}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {chronicleEvents.map((ev) => (
              <div
                key={ev.id}
                className="gothic-card"
                style={{
                  padding: '1.5rem',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gold-ancient)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {ev.date} • {ev.category?.toUpperCase()}
                  </div>
                  <h4 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)', color: '#ffffff', margin: '0.3rem 0' }}>
                    {ev.title}
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5, margin: 0, maxWidth: '750px' }}>
                    {ev.description}
                  </p>
                  {ev.results && ev.results.length > 0 && (
                    <div style={{ marginTop: '0.8rem', display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                      {ev.results.map((res, i) => (
                        <span key={i} style={{ background: 'rgba(197, 159, 78, 0.15)', border: '1px solid rgba(197, 159, 78, 0.3)', color: '#fde047', fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                          {res}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3.12 PLEBISCYTY */}
      {activeSection === 'plebiscites' && (
        <div>
          <h3 style={{ fontSize: '1.3rem', color: '#ffffff', fontFamily: 'var(--font-heading)', marginBottom: '1rem' }}>
            ❄️ Plebiscyty Społeczności (np. Lodowe Sople) — {year.name}
          </h3>
          {plebiscites.map((pl) => (
            <div key={pl.id} className="gothic-card" style={{ padding: '2rem', border: '1px solid rgba(168, 85, 247, 0.3)', marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-heading)', color: '#ffffff', margin: '0 0 0.4rem' }}>
                {pl.title}
              </h4>
              <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '1.5rem' }}>{pl.description}</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                {(pl.categories || []).map((cat, i) => (
                  <div key={i} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(168, 85, 247, 0.2)', borderRadius: '6px', padding: '1rem' }}>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#c084fc', letterSpacing: '0.08em', fontWeight: 800 }}>
                      {cat.icon || '❄️'} {cat.categoryName}
                    </div>
                    <div style={{ fontSize: '1.1rem', fontFamily: 'var(--font-heading)', color: '#ffffff', fontWeight: 800, margin: '0.4rem 0 0.2rem' }}>
                      Zwycięzca: {cat.winner}
                    </div>
                    {cat.nominees && (
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                        Nominowani: {cat.nominees.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3.13 OSIĄGNIĘCIA */}
      {activeSection === 'achievements' && (
        <div>
          <h3 style={{ fontSize: '1.3rem', color: '#ffffff', fontFamily: 'var(--font-heading)', marginBottom: '1rem' }}>
            🗝️ Dodatkowe Osiągnięcia & Odkrycia — {year.name}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.2rem' }}>
            {achievements.map((ach) => (
              <div
                key={ach.id}
                className="gothic-card"
                style={{
                  padding: '1.5rem',
                  border: '1px solid rgba(197, 159, 78, 0.3)',
                  background: 'linear-gradient(145deg, rgba(197, 159, 78, 0.05) 0%, rgba(10, 13, 18, 0.95) 100%)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.8rem' }}>{ach.icon || '🛡️'}</span>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800 }}>
                      {ach.category} • {ach.date}
                    </div>
                    <h4 style={{ fontSize: '1.1rem', color: '#ffffff', margin: 0, fontFamily: 'var(--font-heading)' }}>
                      {ach.title}
                    </h4>
                  </div>
                </div>
                <div style={{ fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 700, margin: '0.3rem 0' }}>
                  Dokonali: {ach.recipientName}
                </div>
                <p style={{ fontSize: '0.78rem', color: '#9ca3af', lineHeight: 1.4, margin: 0 }}>
                  {ach.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
