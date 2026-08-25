import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Trophy, Swords, Shield, Sparkles, BookOpen, ChevronRight } from 'lucide-react';
import { api } from '../../api';

export const MemoryTimelineTab = ({ onSelectYear }) => {
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    const loadChronicle = async () => {
      setLoading(true);
      const res = await api.getMemoryChronicle({ category: categoryFilter });
      if (res.ok && res.data) {
        setTimelineEvents(res.data);
      }
      setLoading(false);
    };
    loadChronicle();
  }, [categoryFilter]);

  const categoryIcons = {
    turniej: '⚔️',
    ceremonia: '👑',
    pojedynki: '🛡️',
    wyprawa: '🏔️',
    edykt: '📜',
    zabawa: '🎲',
    odkrycie: '🗝️',
    wydarzenie: '✨'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div
        className="gothic-card"
        style={{
          padding: '2.5rem',
          textAlign: 'center',
          background: 'radial-gradient(circle at center, rgba(197, 159, 78, 0.12) 0%, rgba(10, 13, 18, 0.98) 75%)',
          border: '2px solid rgba(197, 159, 78, 0.35)'
        }}
      >
        <div style={{ fontSize: '0.8rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold-ancient)', fontFamily: 'var(--font-heading)' }}>
          KRONIKA CZASU CYTADELI
        </div>
        <h1 style={{ fontSize: '2.6rem', fontFamily: 'var(--font-heading)', color: '#ffffff', margin: '0.4rem 0 0.5rem' }}>
          OŚ CZASU TWIERDZY MAGII
        </h1>
        <p style={{ color: '#cbd5e1', maxWidth: '650px', margin: '0 auto', fontSize: '0.92rem', lineHeight: 1.6 }}>
          Chronologiczny zapis najważniejszych wydarzeń, ceremonii paktowych, wielkich turniejów i historycznych odkryć na Archipelagu Północy.
        </p>
      </div>

      {/* Categories Filter */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: 'Wszystkie Wydarzenia' },
          { id: 'turniej', label: '⚔️ Turnieje' },
          { id: 'ceremonia', label: '👑 Ceremonie' },
          { id: 'edykt', label: '📜 Edykty' }
        ].map((cat) => {
          const isActive = categoryFilter === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              style={{
                padding: '0.45rem 0.9rem',
                borderRadius: '4px',
                background: isActive ? 'var(--gold-ancient)' : 'rgba(255, 255, 255, 0.05)',
                color: isActive ? '#090d14' : '#cbd5e1',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                border: 'none'
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="gothic-card" style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
          Odczytywanie roczników czasu...
        </div>
      ) : timelineEvents.length === 0 ? (
        <div className="gothic-card" style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
          Brak wydarzeń dla wybranej kategorii.
        </div>
      ) : (
        /* Vertical Timeline Spine */
        <div style={{ position: 'relative', paddingLeft: '2.5rem', borderLeft: '2px solid rgba(197, 159, 78, 0.4)', display: 'flex', flexDirection: 'column', gap: '2rem', margin: '1rem 0' }}>
          {timelineEvents.map((ev, idx) => (
            <div
              key={ev.id || idx}
              className="gothic-card"
              style={{
                padding: '1.6rem',
                border: '1px solid rgba(197, 159, 78, 0.25)',
                background: 'linear-gradient(145deg, rgba(15, 20, 28, 0.95) 0%, rgba(8, 11, 16, 0.98) 100%)',
                position: 'relative'
              }}
            >
              {/* Timeline Node Icon on spine */}
              <div
                style={{
                  position: 'absolute',
                  left: '-3.35rem',
                  top: '1.5rem',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'var(--gold-ancient)',
                  color: '#090d14',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                  boxShadow: '0 0 12px rgba(197, 159, 78, 0.6)'
                }}
              >
                {categoryIcons[ev.category?.toLowerCase()] || '✨'}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--gold-ancient)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {ev.date} • {ev.yearName || 'Roczniki Cytadeli'}
                </span>
                <span style={{ background: 'rgba(255, 255, 255, 0.06)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.68rem', color: '#9ca3af', textTransform: 'uppercase' }}>
                  {ev.category}
                </span>
              </div>

              <h3 style={{ fontSize: '1.35rem', fontFamily: 'var(--font-heading)', color: '#ffffff', margin: '0.2rem 0 0.5rem' }}>
                {ev.title}
              </h3>

              <p style={{ fontSize: '0.86rem', color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>
                {ev.description}
              </p>

              {ev.results && ev.results.length > 0 && (
                <div style={{ marginTop: '0.8rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {ev.results.map((res, i) => (
                    <span key={i} style={{ background: 'rgba(197, 159, 78, 0.15)', border: '1px solid rgba(197, 159, 78, 0.3)', color: '#fde047', fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '4px' }}>
                      {res}
                    </span>
                  ))}
                </div>
              )}

              {ev.schoolYearId && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '0.6rem', textAlign: 'right' }}>
                  <button
                    onClick={() => onSelectYear && onSelectYear(ev.schoolYearId)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--gold-ancient)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    Przejdź do Archiwum Roku <ChevronRight size={13} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
