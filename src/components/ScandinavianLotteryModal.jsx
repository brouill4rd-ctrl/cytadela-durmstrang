import React, { useState, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import {
  Sparkles,
  Coins,
  Award,
  Dice5,
  History,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Trophy,
  Flame,
  Clock,
  Shield,
  Zap,
  Play
} from 'lucide-react';

export const ScandinavianLotteryModal = ({ isOpen, onClose }) => {
  const {
    currentLottery,
    userLotteryTickets,
    lotteryHistory,
    buyLotteryTicket,
    drawLottery,
    elderFutharkRunes,
    currentUser,
    currentRole
  } = useSchool();

  const { playCoinSound, playRuneChime, playWandSwoosh } = useSound();

  const [selectedRunes, setSelectedRunes] = useState([]);
  const [activeTab, setActiveTab] = useState('buy'); // 'buy' | 'tickets' | 'history' | 'draw'
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawResult, setDrawResult] = useState(null);
  const [countdown, setCountdown] = useState('');

  // Live countdown calculation
  useEffect(() => {
    if (!currentLottery?.endDate) return;

    const interval = setInterval(() => {
      const target = new Date(currentLottery.endDate).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setCountdown('Czas na losowanie!');
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentLottery]);

  const toggleRuneSelection = (runeId) => {
    playRuneChime();
    if (selectedRunes.includes(runeId)) {
      setSelectedRunes(selectedRunes.filter(r => r !== runeId));
    } else {
      if (selectedRunes.length < 6) {
        setSelectedRunes([...selectedRunes, runeId]);
      }
    }
  };

  const handleQuickPick = () => {
    playWandSwoosh();
    const shuffled = [...(elderFutharkRunes || [])].sort(() => 0.5 - Math.random());
    setSelectedRunes(shuffled.slice(0, 6).map(r => r.id));
  };

  const handleBuyTicket = async () => {
    if (selectedRunes.length !== 6) return;
    playCoinSound();
    const success = await buyLotteryTicket(selectedRunes);
    if (success) {
      setSelectedRunes([]);
    }
  };

  const handleRunBotDraw = async () => {
    playRuneChime();
    setIsDrawing(true);
    setDrawResult(null);

    setTimeout(async () => {
      const res = await drawLottery();
      setIsDrawing(false);
      if (res) {
        setDrawResult(res);
      }
    }, 1800);
  };

  const ticketPrice = currentLottery?.ticketPrice || 20;
  const canAfford = (currentUser?.currency || 0) >= ticketPrice;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Monumental Jackpot Card */}
      <div
        className="gothic-card runic-corners"
        style={{
          padding: '2.5rem',
          background: 'linear-gradient(135deg, rgba(25, 20, 35, 0.96) 0%, rgba(10, 12, 20, 0.98) 100%)',
          border: '1px solid var(--gold-ancient)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 15px 40px rgba(0, 0, 0, 0.8), 0 0 35px rgba(197, 159, 78, 0.2)'
        }}
      >
        <div style={{ position: 'absolute', right: '3%', top: '50%', transform: 'translateY(-50%)', fontSize: '10rem', opacity: 0.05, fontFamily: 'serif', pointerEvents: 'none', color: 'var(--gold-ancient)' }}>
          ᛈ
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem', position: 'relative', zIndex: 2 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--gold-ancient)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.2em', fontFamily: 'var(--font-heading)' }}>
              <span>ᛟ</span> SKANDYNAWSKA LOTERIA ODYNA <span>ᛟ</span>
            </div>
            <h1 style={{ fontSize: '2.4rem', color: '#ffffff', marginTop: '0.4rem', marginBottom: '0.6rem', fontFamily: 'var(--font-heading)' }}>
              {currentLottery?.title || 'Wielkie Losowanie Przesilenia'}
            </h1>
            <p style={{ color: '#cbd5e1', maxWidth: '650px', fontSize: '0.96rem', lineHeight: 1.6 }}>
              Wybierz 6 unikalnych run ze Starszego Futharku. Bot Cytadeli przeprowadza oficjalne losowanie z nadejściem wyznaczonego terminu. Trafienie wszystkich 6 run rozbija Główny Skarbiec Odyna!
            </p>
          </div>

          {/* Jackpot & Timer Box */}
          <div
            style={{
              background: 'rgba(10, 14, 22, 0.85)',
              border: '1px solid var(--gold-ancient)',
              borderRadius: '10px',
              padding: '1.2rem 1.8rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minWidth: '240px',
              boxShadow: '0 0 25px rgba(197, 159, 78, 0.25)'
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700 }}>
              Główny Skarbiec (Jackpot)
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.4rem', fontWeight: 800, color: 'var(--gold-glow)', lineHeight: 1.1, margin: '0.3rem 0' }}>
              {currentLottery?.jackpot || 2500} ᛋ
            </div>
            <div style={{ fontSize: '0.78rem', color: '#8cefe6', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Award size={13} /> +{currentLottery?.bonusHousePoints || 100} pkt dla Zakonu
            </div>

            <div style={{ marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.1)', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
              <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Clock size={12} color="var(--gold-ancient)" /> Losowanie za:
              </span>
              <span style={{ color: '#ffe8aa', fontWeight: 700, fontFamily: 'monospace' }}>
                {countdown || 'Odliczanie...'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('buy')}
          style={{
            padding: '0.6rem 1.2rem',
            borderRadius: '6px',
            border: activeTab === 'buy' ? '1px solid var(--gold-ancient)' : '1px solid transparent',
            background: activeTab === 'buy' ? 'rgba(197, 159, 78, 0.2)' : 'transparent',
            color: activeTab === 'buy' ? '#ffffff' : '#94a3b8',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          ᛈ Skreśl Los ({ticketPrice} ᛋ)
        </button>

        <button
          onClick={() => setActiveTab('tickets')}
          style={{
            padding: '0.6rem 1.2rem',
            borderRadius: '6px',
            border: activeTab === 'tickets' ? '1px solid var(--gold-ancient)' : '1px solid transparent',
            background: activeTab === 'tickets' ? 'rgba(197, 159, 78, 0.2)' : 'transparent',
            color: activeTab === 'tickets' ? '#ffffff' : '#94a3b8',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          🎟️ Twoje Losy ({userLotteryTickets.length})
        </button>

        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: '0.6rem 1.2rem',
            borderRadius: '6px',
            border: activeTab === 'history' ? '1px solid var(--gold-ancient)' : '1px solid transparent',
            background: activeTab === 'history' ? 'rgba(197, 159, 78, 0.2)' : 'transparent',
            color: activeTab === 'history' ? '#ffffff' : '#94a3b8',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          📜 Kronika Zwycięzców
        </button>

        {(currentRole === 'admin' || currentRole === 'professor') && (
          <button
            onClick={() => setActiveTab('draw')}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '6px',
              border: activeTab === 'draw' ? '1px solid #a855f7' : '1px solid rgba(168, 85, 247, 0.3)',
              background: activeTab === 'draw' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
              color: '#d8b4fe',
              fontFamily: 'var(--font-heading)',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              marginLeft: 'auto'
            }}
          >
            ⚡ Panel Losowania Bota
          </button>
        )}
      </div>

      {/* Tab 1: Rune Picker / Buy Ticket */}
      {activeTab === 'buy' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
          {/* Selected Runes Live Tray */}
          <div
            className="gothic-card"
            style={{
              padding: '1.4rem 2rem',
              background: 'rgba(14, 18, 27, 0.95)',
              border: '1px solid rgba(197, 159, 78, 0.4)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1.2rem'
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Twój Wybór na Losie (Wybierz 6 Run):
              </div>
              <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
                {[0, 1, 2, 3, 4, 5].map(index => {
                  const runeId = selectedRunes[index];
                  const runeObj = runeId ? (elderFutharkRunes || []).find(r => r.id === runeId) : null;

                  return (
                    <div
                      key={index}
                      style={{
                        width: '50px',
                        height: '58px',
                        borderRadius: '8px',
                        background: runeObj ? 'linear-gradient(135deg, rgba(197, 159, 78, 0.25) 0%, rgba(10, 14, 20, 0.95) 100%)' : 'rgba(255,255,255,0.04)',
                        border: runeObj ? '2px solid var(--gold-ancient)' : '2px dashed rgba(255,255,255,0.15)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: runeObj ? '0 0 15px rgba(197, 159, 78, 0.3)' : 'none'
                      }}
                    >
                      {runeObj ? (
                        <>
                          <span style={{ fontSize: '1.6rem', color: '#ffe8aa', fontFamily: 'serif', lineHeight: 1 }}>{runeObj.rune}</span>
                          <span style={{ fontSize: '0.6rem', color: '#cbd5e1', marginTop: '2px', fontWeight: 600 }}>{runeObj.name}</span>
                        </>
                      ) : (
                        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '1.2rem' }}>?</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <button
                onClick={handleQuickPick}
                className="btn-durmstrang-secondary"
                style={{ padding: '0.65rem 1.1rem', fontSize: '0.85rem' }}
              >
                <Dice5 size={16} /> Rzut Kośćmi Odyna (Losuj)
              </button>

              <button
                onClick={handleBuyTicket}
                disabled={selectedRunes.length !== 6 || !canAfford}
                className="btn-durmstrang"
                style={{
                  padding: '0.65rem 1.6rem',
                  fontSize: '0.9rem',
                  opacity: selectedRunes.length === 6 && canAfford ? 1 : 0.5,
                  cursor: selectedRunes.length === 6 && canAfford ? 'pointer' : 'not-allowed'
                }}
              >
                <Coins size={16} /> Kup Los za {ticketPrice} Skirnirów
              </button>
            </div>
          </div>

          {/* 24 Runes Selection Grid */}
          <div>
            <h3 style={{ fontSize: '1.1rem', color: '#ffffff', marginBottom: '0.8rem', fontFamily: 'var(--font-heading)' }}>
              Wybierz 6 unikalnych run z prastarego Futharku Starszego ({selectedRunes.length}/6):
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: '0.75rem' }}>
              {(elderFutharkRunes || []).map(r => {
                const isSelected = selectedRunes.includes(r.id);

                return (
                  <div
                    key={r.id}
                    onClick={() => toggleRuneSelection(r.id)}
                    style={{
                      background: isSelected ? 'rgba(197, 159, 78, 0.25)' : 'rgba(12, 16, 24, 0.85)',
                      border: isSelected ? '2px solid var(--gold-ancient)' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '0.8rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? '0 0 15px rgba(197, 159, 78, 0.3)' : 'none',
                      transform: isSelected ? 'scale(1.03)' : 'none'
                    }}
                  >
                    <span style={{ fontSize: '2.2rem', color: isSelected ? 'var(--gold-glow)' : r.color || '#e2e8f0', fontFamily: 'serif', lineHeight: 1.1 }}>
                      {r.rune}
                    </span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff', marginTop: '0.3rem' }}>
                      {r.name}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: '#94a3b8', textAlign: 'center', marginTop: '0.2rem', lineHeight: 1.2 }}>
                      {r.meaning}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: User's Purchased Tickets */}
      {activeTab === 'tickets' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {userLotteryTickets.length === 0 ? (
            <div className="gothic-card" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎟️</div>
              <h3 style={{ color: '#ffffff', marginBottom: '0.4rem' }}>Brak wykupionych losów</h3>
              <p style={{ fontSize: '0.9rem', maxWidth: '450px', margin: '0 auto' }}>
                Nie posiadasz jeszcze losów na bieżące losowanie. Przejdź do zakładki "Skreśl Los" i wybierz 6 run!
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {userLotteryTickets.map((t, idx) => {
                const runesObjs = (t.chosenRunes || []).map(rid => (elderFutharkRunes || []).find(r => r.id === rid) || { rune: 'ᛈ', name: rid });

                return (
                  <div
                    key={t.id || idx}
                    className="gothic-card runic-corners"
                    style={{
                      padding: '1.4rem',
                      background: 'rgba(14, 18, 27, 0.95)',
                      border: '1px solid rgba(197, 159, 78, 0.35)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '1rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--gold-ancient)', fontWeight: 700, textTransform: 'uppercase' }}>
                        Los #{idx + 1}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                        {t.purchasedAt}
                      </span>
                    </div>

                    {/* Runes Display */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '0.8rem 0', flexWrap: 'wrap' }}>
                      {runesObjs.map((r, i) => (
                        <div
                          key={i}
                          style={{
                            width: '44px',
                            height: '52px',
                            borderRadius: '8px',
                            background: 'rgba(197, 159, 78, 0.15)',
                            border: '1px solid var(--gold-ancient)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <span style={{ fontSize: '1.5rem', color: 'var(--gold-glow)', fontFamily: 'serif' }}>{r.rune}</span>
                          <span style={{ fontSize: '0.58rem', color: '#cbd5e1' }}>{r.name}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.6rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                      <span style={{ color: '#94a3b8' }}>Właściciel: <strong style={{ color: '#ffffff' }}>{t.userName}</strong></span>
                      <span style={{ color: '#8cefe6', fontWeight: 600 }}>Aktywny w rundzie #{currentLottery?.roundNumber}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Past History & Winners */}
      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {(lotteryHistory || []).map((round, idx) => (
            <div
              key={round.id || idx}
              className="gothic-card"
              style={{
                padding: '1.5rem 2rem',
                background: 'rgba(12, 16, 24, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h4 style={{ fontSize: '1.15rem', color: '#ffffff', fontFamily: 'var(--font-heading)' }}>
                    Runda #{round.roundNumber}: {round.title}
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Data zakończenia: {round.endDate}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Wylosowane Runy:</span>
                  {(round.winningRunes || []).map((rId, i) => {
                    const rObj = (elderFutharkRunes || []).find(r => r.id === rId) || { rune: rId, name: rId };
                    return (
                      <span
                        key={i}
                        style={{
                          background: 'rgba(197, 159, 78, 0.2)',
                          border: '1px solid var(--gold-ancient)',
                          color: '#ffe8aa',
                          fontFamily: 'serif',
                          fontSize: '1.2rem',
                          padding: '0.1rem 0.6rem',
                          borderRadius: '4px'
                        }}
                      >
                        {rObj.rune}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Winners Table */}
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '6px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--gold-ancient)', textAlign: 'left' }}>
                      <th style={{ padding: '0.6rem 1rem' }}>Miejsce</th>
                      <th style={{ padding: '0.6rem 1rem' }}>Zwycięzca</th>
                      <th style={{ padding: '0.6rem 1rem' }}>Zakon</th>
                      <th style={{ padding: '0.6rem 1rem' }}>Nagroda</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(round.winnersSummary || []).map((w, wIdx) => (
                      <tr key={wIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#cbd5e1' }}>
                        <td style={{ padding: '0.6rem 1rem', color: 'var(--gold-glow)', fontWeight: 700 }}>{w.tier}</td>
                        <td style={{ padding: '0.6rem 1rem', color: '#ffffff' }}>{w.winnerName}</td>
                        <td style={{ padding: '0.6rem 1rem', textTransform: 'capitalize' }}>{w.house}</td>
                        <td style={{ padding: '0.6rem 1rem', color: '#8cefe6', fontWeight: 700 }}>
                          +{w.prizeSkirnirs} ᛋ | +{w.prizePoints} pkt
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Bot Draw Simulator (Admin/Prof) */}
      {activeTab === 'draw' && (
        <div
          className="gothic-card runic-corners"
          style={{
            padding: '2.5rem',
            background: 'linear-gradient(135deg, rgba(20, 15, 30, 0.95) 0%, rgba(10, 12, 20, 0.98) 100%)',
            border: '1px solid #a855f7',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '0.6rem' }}>⚡</div>
          <h2 style={{ fontSize: '1.8rem', color: '#ffffff', fontFamily: 'var(--font-heading)', marginBottom: '0.5rem' }}>
            Ceremonia Runicznego Losowania Bota
          </h2>
          <p style={{ color: '#d8b4fe', maxWidth: '600px', margin: '0 auto 1.8rem', fontSize: '0.92rem' }}>
            Uruchom algorytm losujący 6 run Futharku dla bieżącej rundy (#{currentLottery?.roundNumber}). Bot automatycznie zweryfikuje wszystkie bilety adeptów, zasili ich konta bankowe wygranymi i przyzna punkty dla domów.
          </p>

          <button
            onClick={handleRunBotDraw}
            disabled={isDrawing}
            className="btn-durmstrang"
            style={{
              padding: '0.8rem 2.2rem',
              fontSize: '1rem',
              background: 'linear-gradient(135deg, #a855f7 0%, #6b21a8 100%)',
              border: '1px solid #c084fc',
              color: '#ffffff'
            }}
          >
            {isDrawing ? <Clock className="spin" size={18} /> : <Play size={18} />}
            <span>{isDrawing ? 'Obracanie Kołem Odyna...' : 'Wylosuj Zwycięskie Runy Teraz'}</span>
          </button>

          {drawResult && (
            <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(168, 85, 247, 0.15)', border: '1px solid #a855f7', borderRadius: '8px', animation: 'fadeIn 0.3s ease' }}>
              <h3 style={{ color: '#ffffff', marginBottom: '0.8rem' }}>Wynik Losowania:</h3>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.2rem', marginBottom: '1rem' }}>
                {(drawResult.drawnRunes || []).map((rId, i) => {
                  const rObj = (elderFutharkRunes || []).find(r => r.id === rId) || { rune: rId, name: rId };
                  return (
                    <div key={i} style={{ width: '64px', height: '74px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.25)', border: '2px solid #c084fc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '2.4rem', color: '#f3e8ff', fontFamily: 'serif' }}>{rObj.rune}</span>
                      <span style={{ fontSize: '0.7rem', color: '#d8b4fe', fontWeight: 700 }}>{rObj.name}</span>
                    </div>
                  );
                })}
              </div>
              <p style={{ color: '#8cefe6', fontSize: '0.9rem', fontWeight: 600 }}>
                {drawResult.message}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
