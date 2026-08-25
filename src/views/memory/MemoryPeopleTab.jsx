import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Eye, GraduationCap, Shield, ChevronRight } from 'lucide-react';
import { api } from '../../api';

export const MemoryPeopleTab = ({ onSelectPerson }) => {
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'graduate' | 'student' | 'professor' | 'intern' | 'admin'
  const [houseFilter, setHouseFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [people, setPeople] = useState([]);

  const loadPeople = async () => {
    setLoading(true);
    const res = await api.getMemoryPeople({
      role: roleFilter,
      house: houseFilter,
      search: searchQuery
    });
    if (res.ok && res.data) {
      setPeople(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPeople();
  }, [roleFilter, houseFilter, searchQuery]);

  const houseIcons = {
    reinhall: { icon: '🦌', name: 'Reinhall', color: '#fde047', border: '#c59f4e', bg: 'rgba(122, 24, 24, 0.25)' },
    bjornhall: { icon: '🐻', name: 'Björnhall', color: '#f87171', border: '#c02b2b', bg: 'rgba(32, 37, 48, 0.35)' },
    ravnheim: { icon: '🐦', name: 'Ravnheim', color: '#c084fc', border: '#a77de0', bg: 'rgba(28, 19, 46, 0.35)' },
    otergard: { icon: '🦦', name: 'Otergard', color: '#5eead4', border: '#2ec4b6', bg: 'rgba(13, 45, 51, 0.35)' }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div
        className="gothic-card"
        style={{
          padding: '2.5rem',
          textAlign: 'center',
          background: 'radial-gradient(circle at center, rgba(168, 85, 247, 0.12) 0%, rgba(10, 13, 18, 0.98) 75%)',
          border: '2px solid rgba(168, 85, 247, 0.35)'
        }}
      >
        <div style={{ fontSize: '0.8rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#c084fc', fontFamily: 'var(--font-heading)' }}>
          ROCZNIKI POKOLEŃ TWIERDZY
        </div>
        <h1 style={{ fontSize: '2.6rem', fontFamily: 'var(--font-heading)', color: '#ffffff', margin: '0.4rem 0 0.5rem' }}>
          KRONIKA LUDZI
        </h1>
        <p style={{ color: '#cbd5e1', maxWidth: '650px', margin: '0 auto', fontSize: '0.92rem', lineHeight: 1.6 }}>
          Oficjalny rejestr absolwentów, adeptów, profesorów, stażystów i władz Cytadeli. Wyszukaj dowolną postać, aby odkryć jej pełne wieloletnie dossier w archiwach.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
        {/* Search */}
        <div style={{ position: 'relative', minWidth: '240px' }}>
          <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Szukaj postaci, przedmiotu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="gothic-input"
            style={{ paddingLeft: '2.4rem', width: '100%', fontSize: '0.85rem' }}
          />
        </div>

        {/* Roles Filter */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'Wszyscy' },
            { id: 'graduate', label: '🎓 Absolwenci' },
            { id: 'student', label: '📜 Adepci' },
            { id: 'admin', label: '👑 Władze' }
          ].map((r) => {
            const isActive = roleFilter === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setRoleFilter(r.id)}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '4px',
                  background: isActive ? 'var(--gold-ancient)' : 'rgba(255,255,255,0.05)',
                  color: isActive ? '#090d14' : '#cbd5e1',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  border: 'none'
                }}
              >
                {r.label}
              </button>
            );
          })}
        </div>

        {/* House Filter */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {['all', 'reinhall', 'bjornhall', 'ravnheim', 'otergard'].map((h) => {
            const isActive = houseFilter === h;
            const hInfo = houseIcons[h];
            return (
              <button
                key={h}
                onClick={() => setHouseFilter(h)}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '4px',
                  background: isActive ? 'rgba(197, 159, 78, 0.2)' : 'transparent',
                  border: isActive ? '1px solid #c59f4e' : '1px solid rgba(255,255,255,0.1)',
                  color: isActive ? '#fde047' : '#9ca3af',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                {hInfo?.icon} {h === 'all' ? 'Wszystkie Zakony' : hInfo?.name}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="gothic-card" style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
          Przeszukiwanie kronik adeptów...
        </div>
      ) : people.length === 0 ? (
        <div className="gothic-card" style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
          Nie odnaleziono wpisów spełniających podane kryteria.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.2rem' }}>
          {people.map((person) => {
            const hStyle = houseIcons[person.house?.toLowerCase()] || houseIcons.ravnheim;
            return (
              <div
                key={person.id}
                className="gothic-card"
                style={{
                  padding: '1.5rem',
                  border: `1px solid ${hStyle.border}66`,
                  background: 'linear-gradient(145deg, rgba(15, 20, 28, 0.95) 0%, rgba(8, 11, 16, 0.98) 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  transition: 'all 0.25s ease'
                }}
              >
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <img
                    src={person.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt={person.characterName}
                    style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${hStyle.border}` }}
                  />
                  <div>
                    <div style={{ fontSize: '1.15rem', fontFamily: 'var(--font-heading)', fontWeight: 800, color: '#ffffff' }}>
                      {person.characterName}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: hStyle.color, fontWeight: 700 }}>
                      {hStyle.icon} Zakon {hStyle.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                      {person.yearName} ({person.classYear})
                    </div>
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.8rem', borderRadius: '4px', fontSize: '0.8rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <div>Status: <strong style={{ color: person.isGraduate ? '#10b981' : '#ffffff' }}>{person.isGraduate ? '🎓 Absolwent' : 'Adept'}</strong></div>
                  <div>Ocena: <strong style={{ color: 'var(--gold-ancient)' }}>{person.finalGrade || 'Powyżej Oczekiwań'}</strong></div>
                  <div>Punkty w roczniku: <strong style={{ color: '#fde047' }}>#{person.rankingPosition} ({person.points} pkt)</strong></div>
                </div>

                <button
                  onClick={() => onSelectPerson(person.userId || person.characterName)}
                  className="btn-durmstrang"
                  style={{
                    padding: '0.55rem',
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Eye size={13} /> Zobacz Pełne Dossier
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
