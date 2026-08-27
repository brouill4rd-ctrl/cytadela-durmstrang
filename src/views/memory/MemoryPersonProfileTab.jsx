import React, { useState, useEffect } from 'react';
import {
  User,
  GraduationCap,
  FileText,
  Award,
  Shield,
  Calendar,
  Sparkles,
  Eye,
  CheckCircle2,
  ChevronLeft,
  Bookmark,
  Star
} from 'lucide-react';
import { api } from '../../api';

export const MemoryPersonProfileTab = ({
  personIdentifier,
  onBack,
  onInspectCertificate,
  onInspectDiploma
}) => {
  const [loading, setLoading] = useState(true);
  const [dossier, setDossier] = useState(null);

  useEffect(() => {
    const loadDossier = async () => {
      setLoading(true);
      const res = await api.getMemoryPerson(personIdentifier);
      if (res.ok && res.data) {
        setDossier(res.data);
      }
      setLoading(false);
    };
    if (personIdentifier) {
      loadDossier();
    }
  }, [personIdentifier]);

  const houseIcons = {
    reinhall: { icon: '🦌', name: 'Reinhall', color: '#fde047', border: '#c59f4e', bg: 'rgba(122, 38, 50, 0.25)' },
    bjornhall: { icon: '🐻', name: 'Björnhall', color: '#f87171', border: '#5b8aaf', bg: 'rgba(53, 83, 111, 0.35)' },
    ravnheim: { icon: '🐦', name: 'Ravnheim', color: '#c084fc', border: '#7a6ea0', bg: 'rgba(66, 56, 95, 0.35)' },
    otergard: { icon: '🦦', name: 'Otergard', color: '#5eead4', border: '#3aaa9f', bg: 'rgba(13, 45, 51, 0.35)' }
  };

  if (loading) {
    return (
      <div className="gothic-card" style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
        Odczytywanie ksiąg archiwalnych dla wybranej postaci...
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className="gothic-card" style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
        <p>Nie odnaleziono wpisów w Izbie Pamięci dla tej postaci.</p>
        <button onClick={onBack} className="btn-durmstrang" style={{ marginTop: '1rem' }}>
          Powrót do Kroniki Ludzi
        </button>
      </div>
    );
  }

  const houseStyle = houseIcons[dossier.house?.toLowerCase()] || houseIcons.ravnheim;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Back Button */}
      <div>
        <button
          onClick={onBack}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--gold-ancient)',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <ChevronLeft size={16} /> Powrót do Kroniki Ludzi
        </button>
      </div>

      {/* Profile Header Banner */}
      <div
        className="gothic-card"
        style={{
          padding: '2.5rem',
          border: `2px solid ${houseStyle.border}`,
          background: `radial-gradient(ellipse at top right, ${houseStyle.bg} 0%, rgba(10, 13, 18, 0.98) 75%)`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '2rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <img
            src={dossier.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
            alt={dossier.name}
            style={{
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: `3px solid ${houseStyle.border}`,
              boxShadow: `0 0 25px ${houseStyle.border}44`
            }}
          />
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--gold-ancient)', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
              DOSSIER POSTACI W IZBIE PAMIĘCI
            </div>
            <h1 style={{ fontSize: '2.4rem', fontFamily: 'var(--font-heading)', color: '#ffffff', margin: '0.2rem 0' }}>
              {dossier.name}
            </h1>
            <div style={{ fontSize: '1rem', color: houseStyle.color, fontWeight: 700 }}>
              {houseStyle.icon} Zakon {houseStyle.name} {dossier.summary?.isGraduate ? '• 🎓 Absolwent II Kręgu' : ''}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '0.8rem 1.2rem', borderRadius: '6px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '1.4rem', fontFamily: 'var(--font-heading)', color: 'var(--gold-ancient)', fontWeight: 800 }}>
              {dossier.summary?.totalCertificates || 0}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase' }}>Świadectwa</div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '0.8rem 1.2rem', borderRadius: '6px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '1.4rem', fontFamily: 'var(--font-heading)', color: '#fde047', fontWeight: 800 }}>
              {dossier.summary?.totalDiplomas || 0}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase' }}>Dyplomy</div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '0.8rem 1.2rem', borderRadius: '6px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '1.4rem', fontFamily: 'var(--font-heading)', color: '#c084fc', fontWeight: 800 }}>
              {dossier.summary?.totalAwards || 0}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase' }}>Wyróżnienia</div>
          </div>
        </div>
      </div>

      {/* 1. HISTORIA W TWIERDZY — KOLEJNE LATA SZKOLNE */}
      <div>
        <h2 style={{ fontSize: '1.4rem', color: '#ffffff', fontFamily: 'var(--font-heading)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={20} color="var(--gold-ancient)" /> Historia Edukacji w Twierdzy
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {(dossier.snapshots || []).map((snap, idx) => (
            <div
              key={idx}
              className="gothic-card"
              style={{
                padding: '1.5rem',
                border: '1px solid rgba(197, 159, 78, 0.3)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold-ancient)', fontWeight: 800 }}>
                  {snap.yearName}
                </span>
                <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)', color: '#ffffff', margin: '0.2rem 0' }}>
                  {snap.classYear} ({snap.house?.toUpperCase()})
                </h3>
                <div style={{ fontSize: '0.84rem', color: '#cbd5e1' }}>
                  Lokata w rankingu: <strong style={{ color: '#fde047' }}>#{snap.rankingPosition}</strong> ({snap.points} pkt) • Ocena: <strong style={{ color: 'var(--gold-ancient)' }}>{snap.finalGrade || 'Powyżej Oczekiwań'}</strong>
                </div>
                {snap.notes && (
                  <p style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.3rem', lineHeight: 1.4 }}>
                    {snap.notes}
                  </p>
                )}
              </div>

              {snap.titles && snap.titles.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {snap.titles.map((t, i) => (
                    <span key={i} style={{ background: 'rgba(197, 159, 78, 0.15)', border: '1px solid rgba(197, 159, 78, 0.3)', color: '#fde047', fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 2. DOKUMENTY TEJ POSTACI (ŚWIADECTWA & DYPLOMY) */}
      {dossier.certificates && dossier.certificates.length > 0 && (
        <div>
          <h2 style={{ fontSize: '1.4rem', color: '#ffffff', fontFamily: 'var(--font-heading)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} color="#3aaa9f" /> Świadectwa Szkolne
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.2rem' }}>
            {dossier.certificates.map((cert) => (
              <div
                key={cert.id}
                className="gothic-card"
                style={{
                  padding: '1.5rem',
                  border: '1px solid rgba(46, 196, 182, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem'
                }}
              >
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#3aaa9f', fontFamily: 'var(--font-heading)' }}>
                    {cert.documentNumber} ({cert.yearName})
                  </span>
                  <h4 style={{ fontSize: '1.2rem', color: '#ffffff', margin: '0.3rem 0', fontFamily: 'var(--font-heading)' }}>
                    {cert.finalEvaluation}
                  </h4>
                  <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                    Średnia ocen: <strong style={{ color: 'var(--gold-ancient)' }}>{cert.averageScore}</strong>
                  </div>
                </div>

                <button
                  onClick={() => onInspectCertificate(cert)}
                  className="btn-durmstrang"
                  style={{ padding: '0.5rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                >
                  <Eye size={13} /> Zobacz Świadectwo
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. DYPLOMY POSTACI */}
      {dossier.diplomas && dossier.diplomas.length > 0 && (
        <div>
          <h2 style={{ fontSize: '1.4rem', color: '#ffffff', fontFamily: 'var(--font-heading)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={20} color="#fde047" /> Zdobyte Dyplomy & Wyróżnienia
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.2rem' }}>
            {dossier.diplomas.map((dipl) => (
              <div
                key={dipl.id}
                className="gothic-card"
                style={{
                  padding: '1.5rem',
                  border: '1px solid rgba(234, 179, 8, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem'
                }}
              >
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#fde047', fontWeight: 800, textTransform: 'uppercase' }}>
                    {dipl.place} • {dipl.category?.toUpperCase()}
                  </span>
                  <h4 style={{ fontSize: '1.15rem', color: '#ffffff', margin: '0.3rem 0', fontFamily: 'var(--font-heading)' }}>
                    {dipl.title}
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: '#9ca3af', lineHeight: 1.4, margin: 0 }}>
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
