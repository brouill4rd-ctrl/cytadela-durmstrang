import React from 'react';
import { X, Printer, Shield, Award, Sparkles, CheckCircle2, Bookmark } from 'lucide-react';

export const CertificateModal = ({ certificate, onClose }) => {
  if (!certificate) return null;

  const handlePrint = () => {
    window.print();
  };

  const houseSealColors = {
    reinhall: { border: '#c59f4e', bg: 'rgba(122, 24, 24, 0.25)', seal: '#991b1b', text: '#fde047', rune: 'ᚦ', label: 'Pieczęć Jelenia Północy (Blóðhorn)' },
    bjornhall: { border: '#5b8aaf', bg: 'rgba(32, 37, 48, 0.35)', seal: '#1e293b', text: '#f87171', rune: 'ᛉ', label: 'Pieczęć Czarnego Żelaza (Járnskjöldr)' },
    ravnheim: { border: '#7a6ea0', bg: 'rgba(28, 19, 46, 0.35)', seal: '#581c87', text: '#c084fc', rune: 'ᚱ', label: 'Pieczęć Kruka Nocy (Himinúrfang)' },
    otergard: { border: '#3aaa9f', bg: 'rgba(13, 45, 51, 0.35)', seal: '#0f766e', text: '#5eead4', rune: 'ᛞ', label: 'Pieczęć Lodowcowej Wydry (Gullauga)' }
  };

  const houseStyle = houseSealColors[certificate.house?.toLowerCase()] || houseSealColors.ravnheim;

  return (
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
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '850px',
          maxHeight: '94vh',
          overflowY: 'auto',
          background: 'linear-gradient(145deg, #13100c 0%, #0d0c0a 100%)',
          border: '2px solid #c59f4e',
          borderRadius: '8px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 40px rgba(197, 159, 78, 0.25)',
          padding: '2.5rem',
          position: 'relative',
          color: '#e2d7be'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close & Print Buttons */}
        <div style={{ position: 'absolute', top: '1.2rem', right: '1.2rem', display: 'flex', gap: '0.6rem' }}>
          <button
            onClick={handlePrint}
            style={{
              background: 'rgba(197, 159, 78, 0.15)',
              border: '1px solid #c59f4e',
              color: '#c59f4e',
              padding: '0.45rem 0.85rem',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.8rem',
              fontWeight: 700
            }}
          >
            <Printer size={14} /> Drukuj / PDF
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              padding: '0.45rem 0.6rem',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Certificate Decorative Border */}
        <div
          style={{
            border: '1px solid rgba(197, 159, 78, 0.4)',
            padding: '2rem',
            position: 'relative',
            background: 'radial-gradient(ellipse at center, rgba(197, 159, 78, 0.04) 0%, transparent 80%)'
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '1.8rem' }}>
            <div style={{ fontSize: '0.75rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold-ancient)', fontFamily: 'var(--font-heading)' }}>
              TWIERDZA MAGII DURMSTRANG • KANCELARIA DYREKCJI
            </div>
            <h1
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '2.3rem',
                letterSpacing: '0.08em',
                margin: '0.4rem 0 0.2rem',
                color: '#ffffff',
                textShadow: '0 2px 10px rgba(197, 159, 78, 0.3)'
              }}
            >
              ŚWIADECTWO UKOŃCZENIA
            </h1>
            <div style={{ fontSize: '0.85rem', color: '#a39b89', fontStyle: 'italic' }}>
              Wpisano do Wiecznej Księgi Paktu • Nr {certificate.documentNumber || 'TMD/SW/XVII/001'}
            </div>
          </div>

          {/* Recipient & House Info */}
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(197, 159, 78, 0.2)',
              borderRadius: '6px',
              padding: '1.2rem 1.6rem',
              marginBottom: '1.8rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              alignItems: 'center'
            }}
          >
            <div>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af' }}>Adept / Absolwent:</span>
              <div style={{ fontSize: '1.4rem', fontFamily: 'var(--font-heading)', fontWeight: 800, color: '#ffffff' }}>
                {certificate.studentName}
              </div>
              <div style={{ fontSize: '0.85rem', color: houseStyle.text, fontWeight: 600 }}>
                Zakon {certificate.house?.toUpperCase()} • {certificate.classYear}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af' }}>Rok Szkolny & Ocena:</span>
              <div style={{ fontSize: '1.05rem', color: '#ffffff', fontWeight: 700 }}>
                {certificate.yearName || 'XVII Rok Szkolny'}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--gold-ancient)', fontWeight: 700 }}>
                Ocena Końcowa: {certificate.finalEvaluation || 'Wybitny'} (Średnia: {certificate.averageScore || '5.0'})
              </div>
            </div>
          </div>

          {/* Subjects and Grades Table */}
          <div style={{ marginBottom: '1.8rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontFamily: 'var(--font-heading)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold-ancient)', marginBottom: '0.7rem' }}>
              Wykaz Ocen i Egzaminów Magicznych
            </h3>

            <div style={{ border: '1px solid rgba(197, 159, 78, 0.2)', borderRadius: '4px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(197, 159, 78, 0.12)', color: '#ffffff', borderBottom: '1px solid rgba(197, 159, 78, 0.25)' }}>
                    <th style={{ padding: '0.65rem 1rem' }}>Katedra / Przedmiot</th>
                    <th style={{ padding: '0.65rem 1rem' }}>Ocena</th>
                    <th style={{ padding: '0.65rem 1rem' }}>Nota Słowna</th>
                    <th style={{ padding: '0.65rem 1rem', textAlign: 'right' }}>Wynik Egzaminu</th>
                  </tr>
                </thead>
                <tbody>
                  {(certificate.subjectsGrades || []).length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ padding: '1rem', textAlign: 'center', color: '#9ca3af' }}>
                        Wzorowy komplet ocen cząstkowych i egzaminacyjnych z przedmiotów głównych.
                      </td>
                    </tr>
                  ) : (
                    certificate.subjectsGrades.map((sub, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', background: idx % 2 === 0 ? 'rgba(0,0,0,0.2)' : 'transparent' }}>
                        <td style={{ padding: '0.65rem 1rem', fontWeight: 600, color: '#ffffff' }}>{sub.subject}</td>
                        <td style={{ padding: '0.65rem 1rem', color: 'var(--gold-ancient)', fontWeight: 800 }}>{sub.grade}</td>
                        <td style={{ padding: '0.65rem 1rem', color: '#d1d5db' }}>{sub.gradeLabel}</td>
                        <td style={{ padding: '0.65rem 1rem', textAlign: 'right', color: '#10b981', fontWeight: 700 }}>{sub.examScore || 'Zaliczony'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Exam Protocol Highlights */}
          {(certificate.examResults || []).length > 0 && (
            <div style={{ marginBottom: '1.8rem', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '6px', padding: '0.8rem 1.2rem' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#10b981', fontWeight: 700, marginBottom: '0.3rem' }}>
                Protokoły Egzaminów Końcowych:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                {certificate.examResults.map((ex, i) => (
                  <div key={i} style={{ fontSize: '0.82rem', color: '#e2e8f0' }}>
                    • <strong>{ex.examName}</strong>: {ex.score}% ({ex.grade})
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer: Wax Seal & Signatures */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
            {/* Seal */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${houseStyle.seal} 40%, #000000 100%)`,
                  border: `2px solid ${houseStyle.border}`,
                  boxShadow: `0 0 15px ${houseStyle.border}44`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.8rem',
                  color: '#ffffff'
                }}
              >
                {houseStyle.rune}
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: houseStyle.text, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {houseStyle.label}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                  Wydano: {certificate.issueDate || '31.10.2026'}
                </div>
              </div>
            </div>

            {/* Signature */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'Brush Script MT, cursive, serif', fontSize: '1.6rem', color: 'var(--gold-ancient)', transform: 'rotate(-2deg)' }}>
                {certificate.authorityName || 'Arcymistrz Valdemar Krag-Hansen'}
              </div>
              <div style={{ borderTop: '1px solid rgba(197, 159, 78, 0.4)', paddingTop: '0.3rem', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9ca3af' }}>
                {certificate.authorityTitle || 'Dyrektor Cytadeli Durmstrang'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
