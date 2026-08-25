import React from 'react';
import {
  Landmark,
  Award,
  Trophy,
  FileText,
  Users,
  Clock,
  Shield,
  Sparkles,
  ChevronRight,
  ArrowRight,
  BookOpen,
  Calendar,
  Flame,
  Star
} from 'lucide-react';

export const MemoryOverviewTab = ({
  overviewData,
  onSelectYear,
  onSelectTab,
  onSelectHouse,
  onInspectCertificate,
  onInspectDiploma
}) => {
  const years = overviewData?.years || [];
  const trophies = overviewData?.trophies || [];
  const stats = overviewData?.stats || { totalYears: 3, totalGraduates: 8, totalCertificates: 12, totalDiplomas: 20, totalTrophies: 6 };

  const houseIcons = {
    reinhall: { icon: '🦌', name: 'Reinhall', color: '#c59f4e', bg: 'rgba(122, 24, 24, 0.2)' },
    bjornhall: { icon: '🐻', name: 'Björnhall', color: '#f87171', bg: 'rgba(32, 37, 48, 0.3)' },
    ravnheim: { icon: '🐦', name: 'Ravnheim', color: '#c084fc', bg: 'rgba(28, 19, 46, 0.3)' },
    otergard: { icon: '🦦', name: 'Otergard', color: '#5eead4', bg: 'rgba(13, 45, 51, 0.3)' }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* =========================================================================
          1. STATS BANNER / ARCHIVE COUNTERS
          ========================================================================= */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem'
        }}
      >
        <div
          className="gothic-card"
          style={{
            padding: '1.2rem',
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(197, 159, 78, 0.08) 0%, rgba(10, 13, 18, 0.9) 100%)',
            border: '1px solid rgba(197, 159, 78, 0.3)'
          }}
        >
          <Calendar size={22} color="var(--gold-ancient)" style={{ margin: '0 auto 0.4rem' }} />
          <div style={{ fontSize: '1.8rem', fontFamily: 'var(--font-heading)', color: '#ffffff', fontWeight: 800 }}>
            {stats.totalYears}
          </div>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9ca3af' }}>
            Zarchiwizowane Roczniki
          </div>
        </div>

        <div
          className="gothic-card"
          style={{
            padding: '1.2rem',
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(10, 13, 18, 0.9) 100%)',
            border: '1px solid rgba(168, 85, 247, 0.3)'
          }}
        >
          <Users size={22} color="#c084fc" style={{ margin: '0 auto 0.4rem' }} />
          <div style={{ fontSize: '1.8rem', fontFamily: 'var(--font-heading)', color: '#ffffff', fontWeight: 800 }}>
            {stats.totalGraduates}
          </div>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9ca3af' }}>
            Dostojni Absolwenci
          </div>
        </div>

        <div
          className="gothic-card"
          style={{
            padding: '1.2rem',
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(46, 196, 182, 0.08) 0%, rgba(10, 13, 18, 0.9) 100%)',
            border: '1px solid rgba(46, 196, 182, 0.3)'
          }}
        >
          <FileText size={22} color="#2ec4b6" style={{ margin: '0 auto 0.4rem' }} />
          <div style={{ fontSize: '1.8rem', fontFamily: 'var(--font-heading)', color: '#ffffff', fontWeight: 800 }}>
            {stats.totalCertificates}
          </div>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9ca3af' }}>
            Wydane Świadectwa
          </div>
        </div>

        <div
          className="gothic-card"
          style={{
            padding: '1.2rem',
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.08) 0%, rgba(10, 13, 18, 0.9) 100%)',
            border: '1px solid rgba(234, 179, 8, 0.3)'
          }}
        >
          <Trophy size={22} color="#fde047" style={{ margin: '0 auto 0.4rem' }} />
          <div style={{ fontSize: '1.8rem', fontFamily: 'var(--font-heading)', color: '#ffffff', fontWeight: 800 }}>
            {stats.totalTrophies}
          </div>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9ca3af' }}>
            Puchary w Gablotach
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. THEMATIC HALLS PORTALS (SZYBKIE SKRÓTY DO KOMNAT)
          ========================================================================= */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold-ancient)', fontFamily: 'var(--font-heading)' }}>
              Skrzydła i Sale Archiwum
            </span>
            <h2 style={{ fontSize: '1.6rem', color: '#ffffff', margin: '0.1rem 0 0' }}>
              Komnaty Izby Pamięci
            </h2>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.2rem' }}>
          {/* Ściana Chwały */}
          <div
            onClick={() => onSelectTab('wall-of-fame')}
            className="gothic-card"
            style={{
              padding: '1.5rem',
              cursor: 'pointer',
              background: 'radial-gradient(circle at top left, rgba(197, 159, 78, 0.15) 0%, rgba(15, 20, 28, 0.95) 75%)',
              border: '1px solid rgba(197, 159, 78, 0.35)',
              transition: 'all 0.25s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'rgba(197, 159, 78, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-ancient)' }}>
                <Shield size={22} />
              </div>
              <ChevronRight size={18} color="var(--gold-ancient)" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', color: '#ffffff', margin: '0 0 0.3rem' }}>
              Ściana Chwały
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#9ca3af', lineHeight: 1.5, margin: 0 }}>
              Monumentalna kamienna ściana z mosiężnymi tablicami mistrzów, Uczniów Roku i rekordów Cytadeli.
            </p>
          </div>

          {/* Sala Pucharów */}
          <div
            onClick={() => onSelectTab('trophies')}
            className="gothic-card"
            style={{
              padding: '1.5rem',
              cursor: 'pointer',
              background: 'radial-gradient(circle at top left, rgba(234, 179, 8, 0.15) 0%, rgba(15, 20, 28, 0.95) 75%)',
              border: '1px solid rgba(234, 179, 8, 0.35)',
              transition: 'all 0.25s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'rgba(234, 179, 8, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fde047' }}>
                <Trophy size={22} />
              </div>
              <ChevronRight size={18} color="#fde047" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', color: '#ffffff', margin: '0 0 0.3rem' }}>
              Sala Pucharów
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#9ca3af', lineHeight: 1.5, margin: 0 }}>
              Gabloty z trofeami kolejnych lat. Poznaj zwycięskie Zakony, składy i kluczowych zdobywców punktów.
            </p>
          </div>

          {/* Sala Dokumentów */}
          <div
            onClick={() => onSelectTab('documents')}
            className="gothic-card"
            style={{
              padding: '1.5rem',
              cursor: 'pointer',
              background: 'radial-gradient(circle at top left, rgba(46, 196, 182, 0.15) 0%, rgba(15, 20, 28, 0.95) 75%)',
              border: '1px solid rgba(46, 196, 182, 0.35)',
              transition: 'all 0.25s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'rgba(46, 196, 182, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2ec4b6' }}>
                <FileText size={22} />
              </div>
              <ChevronRight size={18} color="#2ec4b6" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', color: '#ffffff', margin: '0 0 0.3rem' }}>
              Sala Dokumentów
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#9ca3af', lineHeight: 1.5, margin: 0 }}>
              Archiwalne teki ze świadectwami, dyplomami turniejowymi, certyfikatami i pieczęciami Zakonów.
            </p>
          </div>

          {/* Kronika Ludzi */}
          <div
            onClick={() => onSelectTab('people')}
            className="gothic-card"
            style={{
              padding: '1.5rem',
              cursor: 'pointer',
              background: 'radial-gradient(circle at top left, rgba(168, 85, 247, 0.15) 0%, rgba(15, 20, 28, 0.95) 75%)',
              border: '1px solid rgba(168, 85, 247, 0.35)',
              transition: 'all 0.25s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc' }}>
                <Users size={22} />
              </div>
              <ChevronRight size={18} color="#c084fc" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', color: '#ffffff', margin: '0 0 0.3rem' }}>
              Kronika Ludzi
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#9ca3af', lineHeight: 1.5, margin: 0 }}>
              Katalog absolwentów, profesorów, stażystów, władz, redaktorów i heroldów we wszystkich latach.
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. ARCHIWUM LAT SZKOLNYCH (KARTY ROCZNIKÓW)
          ========================================================================= */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold-ancient)', fontFamily: 'var(--font-heading)' }}>
              Kroniki Czasu Północy
            </span>
            <h2 style={{ fontSize: '1.6rem', color: '#ffffff', margin: '0.1rem 0 0' }}>
              Archiwum Lat Szkolnych
            </h2>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.4rem' }}>
          {years.map((year) => {
            const hInfo = houseIcons[year.winningHouse?.toLowerCase()] || houseIcons.ravnheim;
            return (
              <div
                key={year.id}
                onClick={() => onSelectYear(year.id)}
                className="gothic-card"
                style={{
                  padding: '1.8rem',
                  cursor: 'pointer',
                  border: year.isFeatured ? '1px solid #c59f4e' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'linear-gradient(145deg, rgba(15, 20, 30, 0.95) 0%, rgba(8, 11, 16, 0.98) 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1.2rem',
                  transition: 'all 0.25s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {year.isFeatured && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '0.8rem',
                      right: '0.8rem',
                      background: 'rgba(197, 159, 78, 0.2)',
                      border: '1px solid #c59f4e',
                      color: '#fde047',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '0.2rem 0.5rem',
                      borderRadius: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em'
                    }}
                  >
                    ⭐ Ostatnio Archiwizowany
                  </div>
                )}

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gold-ancient)', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
                    {year.term || year.dateRange}
                  </div>
                  <h3 style={{ fontSize: '1.6rem', color: '#ffffff', fontFamily: 'var(--font-heading)', margin: '0.2rem 0 0.5rem' }}>
                    {year.name}
                  </h3>
                  <p style={{ fontSize: '0.84rem', color: '#9ca3af', lineHeight: 1.5, margin: 0 }}>
                    {year.summary || 'Oficjalny semestr w murach Twierdzy Magii Durmstrang.'}
                  </p>
                </div>

                <div
                  style={{
                    background: hInfo.bg,
                    border: `1px solid ${hInfo.color}44`,
                    borderRadius: '6px',
                    padding: '0.8rem 1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af' }}>
                      Zdobywca Pucharu:
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: hInfo.color }}>
                      {hInfo.icon} Zakon {hInfo.name}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1rem', fontFamily: 'var(--font-heading)', color: '#ffffff', fontWeight: 800 }}>
                      {year.winningPoints} pkt
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.8rem' }}>
                  <span style={{ color: '#9ca3af' }}>Prymus: <strong style={{ color: '#ffffff' }}>{year.bestStudent || 'Brak'}</strong></span>
                  <span style={{ color: 'var(--gold-ancient)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    Otwórz Rocznik <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          4. GABLOTY CZTERECH ZAKONÓW
          ========================================================================= */}
      <div>
        <div style={{ marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold-ancient)', fontFamily: 'var(--font-heading)' }}>
            Duma i Tradycja
          </span>
          <h2 style={{ fontSize: '1.6rem', color: '#ffffff', margin: '0.1rem 0 0' }}>
            Historyczne Gabloty Zakonów
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {['reinhall', 'bjornhall', 'ravnheim', 'otergard'].map((hKey) => {
            const h = houseIcons[hKey];
            return (
              <div
                key={hKey}
                onClick={() => onSelectHouse(hKey)}
                className="gothic-card"
                style={{
                  padding: '1.4rem',
                  cursor: 'pointer',
                  border: `1px solid ${h.color}55`,
                  background: `radial-gradient(circle at top right, ${h.bg} 0%, rgba(10, 13, 18, 0.95) 80%)`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  transition: 'all 0.25s ease'
                }}
              >
                <div style={{ fontSize: '2.2rem' }}>{h.icon}</div>
                <div>
                  <div style={{ fontSize: '1.1rem', fontFamily: 'var(--font-heading)', color: '#ffffff', fontWeight: 800 }}>
                    Zakon {h.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: h.color, display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                    Zobacz gablotę <ChevronRight size={13} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
