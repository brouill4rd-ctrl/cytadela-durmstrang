import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import { api } from '../api';
import {
  Eye, X, Sparkles, Clock, ChevronDown, ChevronUp, Info, Star, AlertTriangle, Shield
} from 'lucide-react';

const ORIENTATION_STYLE = {
  reversed: { borderColor: '#7f1d1d', glowColor: 'rgba(220, 38, 38, 0.35)', labelColor: '#f87171', rotate: '180deg', badge: '↓ Odwrócona' },
  neutral:  { borderColor: '#374151', glowColor: 'rgba(107, 114, 128, 0.2)', labelColor: '#9ca3af', rotate: '0deg', badge: '— Neutralna' },
  straight: { borderColor: 'var(--gold-ancient)', glowColor: 'rgba(197, 159, 78, 0.35)', labelColor: 'var(--gold-ancient)', rotate: '0deg', badge: '↑ Prosta' },
  golden:   { borderColor: '#fbbf24', glowColor: 'rgba(251, 191, 36, 0.55)', labelColor: '#fbbf24', rotate: '0deg', badge: '✦ Złota' }
};

const SPECIAL_LAYOUT_INFO = {
  triple_reversed: { label: 'Próba Przeznaczenia', icon: '🌑', color: '#7f1d1d', textColor: '#f87171' },
  triple_golden:   { label: 'Trzy Złote Runy', icon: '✦✦✦', color: '#78350f', textColor: '#fbbf24' },
  same_symbol:     { label: 'Trzy Jednakowe Symbole', icon: '⚡', color: '#1e3a5f', textColor: '#93c5fd' },
  three_straight:  { label: 'Trzy Runy Proste', icon: '↑↑↑', color: '#14532d', textColor: '#86efac' },
  skuld_golden:    { label: 'Złota Runa Skuld', icon: '✦', color: '#78350f', textColor: '#fbbf24' }
};

function formatCountdown(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const OracleModal = ({ isOpen, onClose }) => {
  const { currentUser, addNotification } = useSchool();
  const { playSortingFanfare, playWandSwoosh } = useSound();

  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCasting, setIsCasting] = useState(false);
  const [result, setResult] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [error, setError] = useState(null);
  const countdownRef = useRef(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await api.getOracleStatus();
    if (res.ok) {
      setStatus(res.data);
      setCountdown(res.data.secondsToMidnight);
      if (res.data.alreadyCastToday && res.data.todayRitual) {
        setResult(res.data.todayRitual.runesData);
      }
    } else {
      setError('Nie udało się pobrać statusu wyroczni.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadStatus();
    } else {
      setResult(null);
      setStatus(null);
      setLoading(true);
    }
  }, [isOpen, loadStatus]);

  useEffect(() => {
    if (!isOpen) return;
    countdownRef.current = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(countdownRef.current);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCast = async () => {
    if (isCasting || status?.alreadyCastToday) return;
    playWandSwoosh();
    setIsCasting(true);
    setError(null);

    await new Promise(r => setTimeout(r, 1400));

    const res = await api.castOracleRitual();
    if (res.ok) {
      setResult(res.data);
      setStatus(prev => ({
        ...prev,
        alreadyCastToday: true,
        weeklyPoints: res.data.weeklyPoints
      }));
      playSortingFanfare();
      const pts = res.data.totalAwarded;
      addNotification(pts > 0
        ? `🔮 Wyrocznia przemówiła! Zdobyto ${pts} punkt${pts === 1 ? '' : pts <= 4 ? 'y' : 'ów'} dla Zakonu.`
        : '🔮 Wyrocznia przemówiła. Tygodniowy limit punktów osiągnięty — przepowiednia przyjęta.'
      );
    } else {
      if (res.status === 409) {
        setError('Norny przemówiły już dzisiaj. Nici przeznaczenia splotą się ponownie o północy.');
        await loadStatus();
      } else {
        setError(res.error || 'Rytuał nie mógł zostać odprawiony.');
      }
    }
    setIsCasting(false);
  };

  const weeklyPoints = result?.weeklyPoints ?? status?.weeklyPoints ?? 0;
  const weeklyPct = Math.min(100, Math.round((weeklyPoints / 20) * 100));

  const runeCardStyle = (orientation) => {
    const s = ORIENTATION_STYLE[orientation] || ORIENTATION_STYLE.neutral;
    return {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      background: 'rgba(10, 14, 22, 0.95)',
      border: `1.5px solid ${s.borderColor}`,
      borderRadius: '10px',
      padding: '1rem 0.9rem',
      width: '175px',
      textAlign: 'center',
      boxShadow: `0 0 18px ${s.glowColor}`,
      animation: 'fadeIn 0.5s ease-out',
      gap: '0.3rem'
    };
  };

  const alreadyCast = status?.alreadyCastToday || false;

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(3, 5, 8, 0.92)',
      backdropFilter: 'blur(12px)', zIndex: 10000, display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div style={{
        background: 'linear-gradient(180deg, #181d29 0%, #0a0d14 100%)',
        border: '2px solid var(--gold-ancient)',
        boxShadow: '0 12px 60px rgba(0,0,0,0.95), 0 0 30px rgba(197,159,78,0.3)',
        borderRadius: '12px', width: '100%', maxWidth: '780px',
        maxHeight: '92vh', overflowY: 'auto', animation: 'fadeIn 0.3s ease-out'
      }}>

        {/* Header */}
        <div style={{
          padding: '1.1rem 1.5rem', borderBottom: '1px solid rgba(197,159,78,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(0,0,0,0.5)', position: 'sticky', top: 0, zIndex: 2
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Eye size={22} style={{ color: 'var(--gold-ancient)' }} />
            <div>
              <h3 style={{ margin: 0, color: '#fff', fontFamily: 'var(--font-heading)', fontSize: '1.15rem' }}>
                Wyrocznia Przeznaczenia • Rytuał Trzech Norren (Seidr)
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--gold-ancient)', letterSpacing: '0.05em' }}>
                CODZIENNE WRÓŻBY & MITYCZNE BŁOGOSŁAWIEŃSTWA
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '1.6rem', display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>

          {/* Description */}
          {!result && (
            <p style={{ margin: 0, textAlign: 'center', color: '#d1d5db', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: '580px', alignSelf: 'center' }}>
              Trzy Norny — <em>Urd</em>, <em>Verdandi</em> i <em>Skuld</em> — tkają nici przeznaczenia pod korzeniami Drzewa Świata. Rzuć bazaltowymi kamieniami w dym paleniska, by poznać swój dzisiejszy los.
            </p>
          )}

          {/* Weekly progress bar */}
          {!loading && (
            <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(197,159,78,0.2)', borderRadius: '8px', padding: '0.9rem 1.1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Tygodniowy limit punktów
                </span>
                <span style={{ fontSize: '0.82rem', color: weeklyPoints >= 20 ? '#f87171' : 'var(--gold-ancient)', fontWeight: 700 }}>
                  {weeklyPoints} / 20 punktów
                </span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: '3px', transition: 'width 0.6s ease',
                  width: `${weeklyPct}%`,
                  background: weeklyPoints >= 20
                    ? 'linear-gradient(90deg, #dc2626, #991b1b)'
                    : 'linear-gradient(90deg, var(--gold-ancient), #ffe599)'
                }} />
              </div>
              {weeklyPoints >= 20 && (
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.78rem', color: '#f87171' }}>
                  Tygodniowy limit osiągnięty. Przepowiednia jest dostępna, lecz punkty nie zostaną przyznane.
                </p>
              )}
            </div>
          )}

          {/* Already cast today — show countdown */}
          {!loading && alreadyCast && !result && (
            <div style={{
              background: 'rgba(30,58,138,0.15)', border: '1px solid rgba(96,165,250,0.3)',
              borderRadius: '8px', padding: '1rem 1.2rem', textAlign: 'center'
            }}>
              <Clock size={20} style={{ color: '#60a5fa', marginBottom: '0.4rem' }} />
              <p style={{ margin: 0, color: '#93c5fd', fontSize: '0.9rem' }}>Norny przemówiły już dzisiaj. Ładowanie ostatniej przepowiedni...</p>
            </div>
          )}

          {/* Rune Display */}
          <div style={{
            width: '100%', background: 'radial-gradient(circle, rgba(28,38,54,0.8) 0%, rgba(10,14,22,0.95) 100%)',
            border: '1px solid rgba(197,159,78,0.35)', borderRadius: '10px', padding: '1.6rem 1rem',
            display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
            gap: '1rem', minHeight: '200px', flexWrap: 'wrap',
            boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8)'
          }}>
            {loading ? (
              <div style={{ alignSelf: 'center', textAlign: 'center', color: '#9ca3af' }}>
                <span style={{ fontSize: '2.5rem', opacity: 0.3, display: 'block' }}>ᛟ</span>
                <span style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>Ładowanie…</span>
              </div>
            ) : isCasting ? (
              <div style={{ alignSelf: 'center', textAlign: 'center', color: '#9ca3af' }}>
                <span style={{ fontSize: '2.5rem', display: 'block', animation: 'pulse 1s infinite' }}>ᛟ</span>
                <span style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--gold-ancient)' }}>✨ Norny odsłaniają nici losu…</span>
              </div>
            ) : result ? (
              result.runes.map((r, idx) => {
                const s = ORIENTATION_STYLE[r.orientation] || ORIENTATION_STYLE.neutral;
                return (
                  <div key={idx} style={runeCardStyle(r.orientation)}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                      {r.role}
                    </span>
                    <span style={{
                      fontSize: '2.8rem', color: r.orientation === 'golden' ? '#fbbf24' : '#ffe599',
                      display: 'block', margin: '0.2rem 0',
                      transform: `rotate(${s.rotate})`,
                      textShadow: `0 0 15px ${s.glowColor}`
                    }}>
                      {r.symbol}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600, fontFamily: 'var(--font-heading)' }}>
                      {r.name}
                    </span>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 700, color: s.labelColor,
                      padding: '0.15rem 0.5rem', borderRadius: '999px',
                      background: 'rgba(0,0,0,0.4)', marginTop: '0.15rem'
                    }}>
                      {s.badge}
                    </span>
                    <p style={{ fontSize: '0.73rem', color: '#9ca3af', margin: '0.3rem 0 0', lineHeight: 1.4, fontStyle: 'italic' }}>
                      {r.interpretation}
                    </p>
                    <span style={{ fontSize: '0.68rem', color: r.value > 0 ? '#86efac' : r.value < 0 ? '#f87171' : '#9ca3af', fontWeight: 700 }}>
                      {r.value > 0 ? `+${r.value}` : r.value}
                    </span>
                  </div>
                );
              })
            ) : (
              <div style={{ alignSelf: 'center', textAlign: 'center', color: '#9ca3af' }}>
                <span style={{ fontSize: '3rem', opacity: 0.3, display: 'block' }}>ᛟ</span>
                <span style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>Kamienie spoczywają w aksamitnym woreczku. Kliknij poniżej, by rzucić runy.</span>
              </div>
            )}
          </div>

          {/* Result summary */}
          {result && (
            <>
              {/* Special layout badge */}
              {result.specialLayout && SPECIAL_LAYOUT_INFO[result.specialLayout] && (
                <div style={{
                  background: `${SPECIAL_LAYOUT_INFO[result.specialLayout].color}33`,
                  border: `1.5px solid ${SPECIAL_LAYOUT_INFO[result.specialLayout].color}`,
                  borderRadius: '8px', padding: '0.7rem 1rem',
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  animation: 'fadeIn 0.4s ease-out'
                }}>
                  <span style={{ fontSize: '1.3rem' }}>{SPECIAL_LAYOUT_INFO[result.specialLayout].icon}</span>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: SPECIAL_LAYOUT_INFO[result.specialLayout].textColor, textTransform: 'uppercase', fontWeight: 700 }}>
                      Układ Specjalny
                    </span>
                    <p style={{ margin: 0, color: '#fff', fontSize: '0.88rem', fontWeight: 600 }}>
                      {SPECIAL_LAYOUT_INFO[result.specialLayout].label}
                    </p>
                  </div>
                </div>
              )}

              {/* Prophecy */}
              <div style={{
                background: 'rgba(197,159,78,0.08)', border: '1px solid rgba(197,159,78,0.3)',
                borderRadius: '8px', padding: '1.1rem 1.3rem', textAlign: 'center',
                animation: 'fadeIn 0.5s ease-out'
              }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', display: 'block', marginBottom: '0.5rem' }}>
                  ᛟ Przepowiednia Norren ᛟ
                </span>
                <p style={{ margin: 0, color: '#e5e7eb', fontSize: '0.92rem', lineHeight: 1.65, fontStyle: 'italic' }}>
                  "{result.prophecy}"
                </p>
              </div>

              {/* Points breakdown */}
              <div style={{
                background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(197,159,78,0.2)',
                borderRadius: '8px', padding: '1rem 1.2rem', animation: 'slideUp 0.4s ease-out'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
                  <span style={{ fontSize: '0.78rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>Wynik rytuału</span>
                  <span style={{ fontSize: '0.88rem', color: '#e5e7eb' }}>
                    Suma wartości run: <strong style={{ color: result.sumValue > 0 ? '#86efac' : result.sumValue < 0 ? '#f87171' : '#9ca3af' }}>
                      {result.sumValue > 0 ? `+${result.sumValue}` : result.sumValue}
                    </strong>
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '0.7rem' }}>
                  <Chip label="Podstawa" value={`${result.basePoints} pkt`} color={result.basePoints > 0 ? '#86efac' : '#9ca3af'} />
                  {result.bonusPoints > 0 && <Chip label="Bonus układu" value={`+${result.bonusPoints} pkt`} color="#fbbf24" />}
                  {result.badLuckActive && <Chip label="Ochrona przed pechem" value="aktywna" color="#93c5fd" icon={<Shield size={11} />} />}
                  {result.weeklyCapReached && <Chip label="Limit tygodniowy" value="osiągnięty" color="#f87171" icon={<AlertTriangle size={11} />} />}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '0.7rem' }}>
                  <span style={{ fontSize: '0.9rem', color: '#9ca3af', fontWeight: 600 }}>Przyznano punktów:</span>
                  <span style={{ fontSize: '1.3rem', fontWeight: 800, color: result.totalAwarded > 0 ? 'var(--gold-ancient)' : '#6b7280', fontFamily: 'var(--font-heading)' }}>
                    {result.totalAwarded > 0 ? `+${result.totalAwarded}` : '0'} pkt
                  </span>
                </div>
              </div>

              {/* Already cast notice */}
              <AlreadyCastNotice countdown={countdown} />
            </>
          )}

          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(127,29,29,0.2)', border: '1px solid rgba(220,38,38,0.4)',
              borderRadius: '8px', padding: '0.9rem 1.1rem', color: '#f87171', fontSize: '0.88rem'
            }}>
              {error}
              {!result && <CountdownLine countdown={countdown} />}
            </div>
          )}

          {/* Cast button */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {!loading && alreadyCast ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center',
                  background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(197,159,78,0.2)',
                  borderRadius: '8px', padding: '0.7rem 1.5rem', color: '#6b7280', fontSize: '0.88rem'
                }}>
                  <Clock size={15} />
                  <span>Następny rytuał za: <strong style={{ color: 'var(--gold-ancient)' }}>{formatCountdown(countdown)}</strong></span>
                </div>
              </div>
            ) : (
              <button
                onClick={handleCast}
                disabled={isCasting || loading}
                style={{
                  background: isCasting || loading
                    ? 'rgba(197,159,78,0.3)'
                    : 'linear-gradient(135deg, var(--gold-ancient) 0%, #9a7629 100%)',
                  color: isCasting || loading ? '#6b7280' : '#000',
                  border: 'none', borderRadius: '6px', padding: '0.85rem 2.2rem',
                  fontWeight: 800, fontSize: '0.95rem', fontFamily: 'var(--font-heading)',
                  cursor: isCasting || loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  boxShadow: isCasting || loading ? 'none' : '0 4px 20px rgba(197,159,78,0.4)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Sparkles size={16} />
                {isCasting ? 'Norny odczytują nici…' : 'Rzuć Trzy Runy Norren'}
              </button>
            )}
          </div>

          {/* Info section */}
          <div style={{ borderTop: '1px solid rgba(197,159,78,0.15)', paddingTop: '0.8rem' }}>
            <button
              onClick={() => setShowInfo(v => !v)}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: '#6b7280', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem',
                fontFamily: 'inherit', padding: '0'
              }}
            >
              <Info size={14} />
              Zasady i limity Wyroczni
              {showInfo ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            {showInfo && <InfoSection />}
          </div>

        </div>
      </div>
    </div>
  );
};

function Chip({ label, value, color, icon }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.3rem',
      background: 'rgba(0,0,0,0.4)', border: `1px solid ${color}44`,
      borderRadius: '999px', padding: '0.2rem 0.65rem', fontSize: '0.75rem'
    }}>
      {icon}
      <span style={{ color: '#9ca3af' }}>{label}:</span>
      <span style={{ color, fontWeight: 700 }}>{value}</span>
    </div>
  );
}

function AlreadyCastNotice({ countdown }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.6rem',
      background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(197,159,78,0.15)',
      borderRadius: '8px', padding: '0.7rem 1rem', fontSize: '0.82rem', color: '#6b7280'
    }}>
      <Clock size={14} style={{ color: 'var(--gold-ancient)', flexShrink: 0 }} />
      <span>Dzisiejszy rytuał odprawiony. Norny przemówiły już dzisiaj.</span>
      <span style={{ marginLeft: 'auto', color: 'var(--gold-ancient)', fontWeight: 700, fontFamily: 'var(--font-heading)', whiteSpace: 'nowrap' }}>
        {formatCountdown(countdown)}
      </span>
    </div>
  );
}

function CountdownLine({ countdown }) {
  return (
    <span style={{ display: 'block', marginTop: '0.3rem', color: 'var(--gold-ancient)' }}>
      Następny rytuał za: {formatCountdown(countdown)}
    </span>
  );
}

function InfoSection() {
  const rowStyle = { display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.8rem' };
  const labelStyle = { color: '#9ca3af' };
  const valStyle = { color: '#e5e7eb', fontWeight: 600 };

  return (
    <div style={{
      marginTop: '0.9rem', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(197,159,78,0.15)',
      borderRadius: '8px', padding: '1rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '1rem'
    }}>
      <Section title="Orientacje Run">
        {[
          ['Odwrócona', '–1', '#f87171', '25%'],
          ['Neutralna', '0', '#9ca3af', '35%'],
          ['Prosta', '+1', '#86efac', '35%'],
          ['Złota', '+2', '#fbbf24', '5%']
        ].map(([label, val, color, chance]) => (
          <div key={label} style={{ ...rowStyle }}>
            <span style={labelStyle}>{label}</span>
            <span style={{ ...valStyle, color }}>{val} &nbsp;<span style={{ color: '#6b7280', fontWeight: 400 }}>({chance})</span></span>
          </div>
        ))}
      </Section>

      <Section title="Tabela Punktów (suma run)">
        {[
          ['–3 lub –2', '0 pkt'],
          ['–1', '1 pkt'],
          ['0', '2 pkt'],
          ['+1', '3 pkt'],
          ['+2', '4 pkt'],
          ['+3', '5 pkt'],
          ['+4 i więcej', '6 pkt']
        ].map(([sum, pts]) => (
          <div key={sum} style={rowStyle}>
            <span style={labelStyle}>{sum}</span>
            <span style={valStyle}>{pts}</span>
          </div>
        ))}
      </Section>

      <Section title="Układy Specjalne (+1 bonus, nie kumulują się)">
        {[
          ['Trzy runy proste', '+1 pkt'],
          ['Trzy jednakowe symbole', '+1 pkt'],
          ['Złota runa Skuld', '+1 pkt'],
          ['Trzy runy odwrócone', '0 pkt + mroczna przepowiednia'],
          ['Trzy złote runy', 'max 7 pkt + unikalna przepowiednia']
        ].map(([label, val]) => (
          <div key={label} style={rowStyle}>
            <span style={labelStyle}>{label}</span>
            <span style={valStyle}>{val}</span>
          </div>
        ))}
      </Section>

      <Section title="Limity">
        {[
          ['Maks. za rytuał (z bonusem)', '7 pkt'],
          ['Tygodniowy limit z Wyroczni', '20 pkt'],
          ['Limit dziennych prób', '1 / dobę'],
          ['Limit po tygodniowym cap', 'przepowiednia bez punktów'],
          ['Odnowienie próby', 'codziennie o północy (czas serwera)'],
          ['Limit przypisany do', 'konta (nie urządzenia)']
        ].map(([label, val]) => (
          <div key={label} style={rowStyle}>
            <span style={labelStyle}>{label}</span>
            <span style={valStyle}>{val}</span>
          </div>
        ))}
      </Section>

      <Section title="Ochrona przed pechem">
        <p style={{ margin: 0, fontSize: '0.78rem', color: '#9ca3af', lineHeight: 1.5 }}>
          Jeżeli trzy kolejne rytuały zakończyły się wynikiem 0 lub 1 punktu, następny rytuał gwarantuje minimum 3 punkty. Po uruchomieniu ochrony licznik pecha zostaje wyzerowany. Nie daje dodatkowego rzutu i nie pozwala przekroczyć limitów.
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h5 style={{ margin: '0 0 0.5rem', color: 'var(--gold-ancient)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'var(--font-heading)' }}>
        {title}
      </h5>
      {children}
    </div>
  );
}
