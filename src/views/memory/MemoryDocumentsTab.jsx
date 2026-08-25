import React, { useState, useEffect } from 'react';
import { FileText, Award, Search, Filter, Eye, Shield, Bookmark, CheckCircle2 } from 'lucide-react';
import { api } from '../../api';

export const MemoryDocumentsTab = ({ onInspectCertificate, onInspectDiploma }) => {
  const [docType, setDocType] = useState('all'); // 'all' | 'certificates' | 'diplomas'
  const [selectedHouse, setSelectedHouse] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [documentsData, setDocumentsData] = useState({ certificates: [], diplomas: [] });

  const loadDocuments = async () => {
    setLoading(true);
    const res = await api.getMemoryDocuments({
      type: docType,
      house: selectedHouse,
      search: searchQuery
    });
    if (res.ok && res.data) {
      setDocumentsData(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDocuments();
  }, [docType, selectedHouse, searchQuery]);

  const houseIcons = {
    reinhall: { icon: '🦌', name: 'Reinhall', color: '#fde047', border: '#c59f4e', bg: 'rgba(122, 24, 24, 0.25)' },
    bjornhall: { icon: '🐻', name: 'Björnhall', color: '#f87171', border: '#c02b2b', bg: 'rgba(32, 37, 48, 0.35)' },
    ravnheim: { icon: '🐦', name: 'Ravnheim', color: '#c084fc', border: '#a77de0', bg: 'rgba(28, 19, 46, 0.35)' },
    otergard: { icon: '🦦', name: 'Otergard', color: '#5eead4', border: '#2ec4b6', bg: 'rgba(13, 45, 51, 0.35)' }
  };

  const certificates = documentsData.certificates || [];
  const diplomas = documentsData.diplomas || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div
        className="gothic-card"
        style={{
          padding: '2.5rem',
          textAlign: 'center',
          background: 'radial-gradient(circle at center, rgba(46, 196, 182, 0.12) 0%, rgba(10, 13, 18, 0.98) 75%)',
          border: '2px solid rgba(46, 196, 182, 0.35)'
        }}
      >
        <div style={{ fontSize: '0.8rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#2ec4b6', fontFamily: 'var(--font-heading)' }}>
          OFICJALNE ARCHIWUM DOKUMENTÓW & PIECZĘCI
        </div>
        <h1 style={{ fontSize: '2.6rem', fontFamily: 'var(--font-heading)', color: '#ffffff', margin: '0.4rem 0 0.5rem' }}>
          SALA DOKUMENTÓW CYTADELI
        </h1>
        <p style={{ color: '#cbd5e1', maxWidth: '650px', margin: '0 auto', fontSize: '0.92rem', lineHeight: 1.6 }}>
          Archiwalne szuflady ze świadectwami ukończenia nauki, dyplomami turniejowymi i oficjalnymi paktami szkolnymi. Otwórz dokument, aby zweryfikować pieczęć i podpisy władz.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
        {/* Search */}
        <div style={{ position: 'relative', minWidth: '240px' }}>
          <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Szukaj adepta, numeru dokumentu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="gothic-input"
            style={{ paddingLeft: '2.4rem', width: '100%', fontSize: '0.85rem' }}
          />
        </div>

        {/* Type Filter */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setDocType('all')}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '4px',
              background: docType === 'all' ? 'var(--gold-ancient)' : 'rgba(255,255,255,0.05)',
              color: docType === 'all' ? '#090d14' : '#cbd5e1',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              border: 'none'
            }}
          >
            Wszystkie
          </button>
          <button
            onClick={() => setDocType('certificates')}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '4px',
              background: docType === 'certificates' ? '#2ec4b6' : 'rgba(255,255,255,0.05)',
              color: docType === 'certificates' ? '#090d14' : '#cbd5e1',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              border: 'none'
            }}
          >
            Świadectwa
          </button>
          <button
            onClick={() => setDocType('diplomas')}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '4px',
              background: docType === 'diplomas' ? '#fde047' : 'rgba(255,255,255,0.05)',
              color: docType === 'diplomas' ? '#090d14' : '#cbd5e1',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              border: 'none'
            }}
          >
            Dyplomy
          </button>
        </div>

        {/* House Filter */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {['all', 'reinhall', 'bjornhall', 'ravnheim', 'otergard'].map((h) => {
            const isActive = selectedHouse === h;
            const hInfo = houseIcons[h];
            return (
              <button
                key={h}
                onClick={() => setSelectedHouse(h)}
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
          Otwieranie szuflad archiwalnych...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Certificates Section */}
          {(docType === 'all' || docType === 'certificates') && (
            <div>
              <h3 style={{ fontSize: '1.3rem', color: '#ffffff', fontFamily: 'var(--font-heading)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={20} color="#2ec4b6" /> Świadectwa Szkolne ({certificates.length})
              </h3>
              {certificates.length === 0 ? (
                <div className="gothic-card" style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
                  Brak świadectw spełniających kryteria.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.2rem' }}>
                  {certificates.map((cert) => {
                    const hStyle = houseIcons[cert.house?.toLowerCase()] || houseIcons.ravnheim;
                    return (
                      <div
                        key={cert.id}
                        className="gothic-card"
                        style={{
                          padding: '1.6rem',
                          border: '1px solid rgba(197, 159, 78, 0.3)',
                          background: 'linear-gradient(145deg, rgba(15, 20, 28, 0.95) 0%, rgba(8, 11, 16, 0.98) 100%)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '1rem'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--gold-ancient)', fontFamily: 'var(--font-heading)' }}>
                              {cert.documentNumber}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: hStyle.color, fontWeight: 700 }}>
                              {hStyle.icon} {hStyle.name}
                            </span>
                          </div>
                          <h4 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-heading)', color: '#ffffff', margin: '0.4rem 0 0.2rem' }}>
                            {cert.studentName}
                          </h4>
                          <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                            {cert.yearName} • {cert.classYear}
                          </div>
                          <div style={{ fontSize: '0.84rem', color: '#10b981', fontWeight: 700, marginTop: '0.3rem' }}>
                            Ocena: {cert.finalEvaluation} (Śr: {cert.averageScore})
                          </div>
                        </div>

                        <button
                          onClick={() => onInspectCertificate(cert)}
                          className="btn-durmstrang"
                          style={{ padding: '0.55rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                        >
                          <Eye size={13} /> Otwórz Świadectwo
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Diplomas Section */}
          {(docType === 'all' || docType === 'diplomas') && (
            <div>
              <h3 style={{ fontSize: '1.3rem', color: '#ffffff', fontFamily: 'var(--font-heading)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={20} color="#fde047" /> Dyplomy Turniejowe & Wyróżnienia ({diplomas.length})
              </h3>
              {diplomas.length === 0 ? (
                <div className="gothic-card" style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
                  Brak dyplomów spełniających kryteria.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.2rem' }}>
                  {diplomas.map((dipl) => {
                    const hStyle = houseIcons[dipl.house?.toLowerCase()] || houseIcons.ravnheim;
                    return (
                      <div
                        key={dipl.id}
                        className="gothic-card"
                        style={{
                          padding: '1.6rem',
                          border: '1px solid rgba(234, 179, 8, 0.3)',
                          background: 'linear-gradient(145deg, rgba(20, 22, 18, 0.95) 0%, rgba(8, 11, 16, 0.98) 100%)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '1rem'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--gold-ancient)', fontWeight: 800, textTransform: 'uppercase' }}>
                              {dipl.place} • {dipl.category?.toUpperCase()}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: hStyle.color, fontWeight: 700 }}>
                              {hStyle.icon} {hStyle.name}
                            </span>
                          </div>
                          <h4 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)', color: '#ffffff', margin: '0.4rem 0 0.2rem' }}>
                            {dipl.title}
                          </h4>
                          <div style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>
                            Przyznano: <strong>{dipl.recipientName}</strong>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.2rem' }}>
                            {dipl.yearName} ({dipl.date})
                          </div>
                        </div>

                        <button
                          onClick={() => onInspectDiploma(dipl)}
                          className="btn-durmstrang"
                          style={{ padding: '0.55rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
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
        </div>
      )}
    </div>
  );
};
