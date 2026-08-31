import React, { useState, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import { api } from '../api';
import {
  Shield,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Unlink,
  ExternalLink,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Clock,
  UserCheck,
  Zap,
  Flame,
  Award,
  Crown
} from 'lucide-react';

export const DiscordVerificationModal = ({ isOpen, onClose }) => {
  const { currentUser, houses, updateCurrentUser, showNotification } = useSchool();
  const { playWandSwoosh, playRuneChime } = useSound();

  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [verificationData, setVerificationData] = useState(null);
  const [activeCode, setActiveCode] = useState('');
  const [codeExpiresAt, setCodeExpiresAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState(false);

  // Simulator state for testing
  const [simDiscordTag, setSimDiscordTag] = useState('');
  const [simulating, setSimulating] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);

  const house = currentUser?.house ? houses[currentUser.house] : null;

  // Load verification status on open
  const fetchStatus = async () => {
    if (!currentUser || currentUser.id === 'guest') return;
    setStatusLoading(true);
    try {
      const res = await api.getDiscordVerificationStatus();
      if (res.ok && res.data) {
        setVerificationData(res.data);
        if (res.data.activeCode) {
          setActiveCode(res.data.activeCode);
          setCodeExpiresAt(res.data.activeCodeExpiresAt);
        }
      }
    } catch (e) {
      console.warn('Status fetch error:', e);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  // Timer countdown
  useEffect(() => {
    if (!codeExpiresAt) {
      setTimeLeft('');
      return;
    }

    const interval = setInterval(() => {
      const diff = new Date(codeExpiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Wygasł');
        clearInterval(interval);
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [codeExpiresAt]);

  if (!isOpen) return null;

  // Generate new code
  const handleGenerateCode = async (force = false) => {
    playWandSwoosh();
    setLoading(true);
    try {
      const res = await api.generateDiscordVerificationCode(force);
      if (res.ok && res.data) {
        setActiveCode(res.data.code);
        setCodeExpiresAt(res.data.expiresAt);
        showNotification?.('Wygenerowano nowy runiczny kod weryfikacyjny.', 'success');
        playRuneChime();
        fetchStatus();
      } else {
        showNotification?.(res.error || 'Nie udało się wygenerować kodu.', 'error');
      }
    } catch (err) {
      showNotification?.('Błąd połączenia z serwerem.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Copy code
  const handleCopyCode = () => {
    if (!activeCode) return;
    navigator.clipboard.writeText(activeCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
    showNotification?.('Skopiowano kod do schowka!', 'info');
  };

  // Copy command
  const handleCopyCommand = () => {
    if (!activeCode) return;
    const cmd = `/weryfikuj kod: ${activeCode}`;
    navigator.clipboard.writeText(cmd);
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2500);
    showNotification?.('Skopiowano komendę slash do schowka!', 'success');
  };

  // Unlink account
  const handleUnlink = async () => {
    if (!window.confirm('Czy na pewno chcesz odłączyć swoje konto Discord od profilu w Cytadeli?')) return;
    playWandSwoosh();
    setLoading(true);
    try {
      const res = await api.unlinkDiscordAccount();
      if (res.ok) {
        showNotification?.('Konto Discord zostało pomyślnie odłączone.', 'info');
        setActiveCode('');
        setCodeExpiresAt(null);
        if (res.data?.user && updateCurrentUser) {
          updateCurrentUser(res.data.user);
        }
        fetchStatus();
      } else {
        showNotification?.(res.error || 'Błąd podczas odłączania konta.', 'error');
      }
    } catch (e) {
      showNotification?.('Błąd serwera.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Resync roles
  const handleResync = async () => {
    playWandSwoosh();
    setLoading(true);
    try {
      const res = await api.resyncDiscordRoles();
      if (res.ok) {
        showNotification?.('Role i uprawnienia Discord zostały zsynchronizowane!', 'success');
        playRuneChime();
        if (res.data?.user && updateCurrentUser) {
          updateCurrentUser(res.data.user);
        }
        fetchStatus();
      } else {
        showNotification?.(res.error || 'Błąd synchronizacji.', 'error');
      }
    } catch (e) {
      showNotification?.('Błąd serwera.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Test Simulator
  const handleTestVerify = async () => {
    if (!activeCode) {
      showNotification?.('Wygeneruj najpierw kod weryfikacyjny.', 'warning');
      return;
    }
    setSimulating(true);
    try {
      const res = await api.verifyDiscordManual({
        code: activeCode,
        discordUserId: `dc-${Date.now()}`,
        discordUsername: simDiscordTag || `${currentUser.username || 'Adept'}#1294`,
        discordAvatar: currentUser.avatar || ''
      });

      if (res.ok) {
        showNotification?.('Weryfikacja symulacyjna powiodła się! Role zostały przypisane.', 'success');
        playRuneChime();
        if (res.data?.user && updateCurrentUser) {
          updateCurrentUser(res.data.user);
        }
        fetchStatus();
      } else {
        showNotification?.(res.error || 'Symulacja nie powiodła się.', 'error');
      }
    } catch (e) {
      showNotification?.('Błąd połączenia.', 'error');
    } finally {
      setSimulating(false);
    }
  };

  const isConnected = Boolean(verificationData?.isConnected || currentUser?.discordId);
  const assignedRoles = verificationData?.assignedRoles || currentUser?.discordRoles || [];
  const expectedRoles = verificationData?.expectedRoles || [];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(5, 7, 10, 0.85)',
        backdropFilter: 'blur(10px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        animation: 'fadeIn 0.25s ease'
      }}
      onClick={onClose}
    >
      <div
        className="gothic-card runic-corners"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'linear-gradient(180deg, #10151f 0%, #090c12 100%)',
          border: '2px solid var(--gold-ancient)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 35px rgba(88, 101, 242, 0.25)',
          padding: '2.2rem',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.2rem',
            right: '1.2rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#94a3b8',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.1rem'
          }}
        >
          ✕
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '1.8rem', borderBottom: '1px solid rgba(197, 159, 78, 0.25)', paddingBottom: '1.2rem' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #5865F2 0%, #3b47c4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 25px rgba(88, 101, 242, 0.45)',
              color: '#ffffff',
              flexShrink: 0
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700 }}>
                Twierdza Magii Durmstrang
              </span>
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '0.15rem 0.6rem',
                  borderRadius: '12px',
                  background: isConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: isConnected ? '#10b981' : '#f87171',
                  border: `1px solid ${isConnected ? '#10b981' : '#f87171'}`,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                {isConnected ? <Check size={12} /> : <AlertCircle size={12} />}
                {isConnected ? 'Konto Połączone' : 'Niepołączony'}
              </span>
            </div>

            <h2 style={{ fontSize: '1.5rem', color: '#ffffff', fontFamily: 'var(--font-heading)', margin: '0.2rem 0 0 0' }}>
              Weryfikacja Konta Discord & Przydział Ról
            </h2>
          </div>
        </div>

        {/* Content Body */}
        {isConnected ? (
          /* ================= ALREADY CONNECTED VIEW ================= */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
            <div
              style={{
                padding: '1.5rem',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                <div style={{ position: 'relative' }}>
                  <img
                    src={verificationData?.discordAvatar || currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt="Discord Avatar"
                    style={{ width: '60px', height: '60px', borderRadius: '50%', border: '2px solid #10b981', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '0',
                      right: '0',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: '#10b981',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Check size={13} strokeWidth={3} />
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '1.15rem', color: '#ffffff', fontWeight: 800 }}>
                    {verificationData?.discordUsername || currentUser?.discordUsername || 'Zweryfikowany Adept'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    Discord ID: <code style={{ color: '#e2e8f0' }}>{verificationData?.discordId || currentUser?.discordId}</code>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.2rem' }}>
                    ✨ Tożsamość potwierdzona w Wiecznej Księdze Paktu
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button
                  onClick={handleResync}
                  disabled={loading}
                  className="btn-durmstrang"
                  style={{ padding: '0.55rem 1rem', fontSize: '0.82rem', background: 'rgba(88, 101, 242, 0.25)', border: '1px solid #5865F2', color: '#c7d2fe' }}
                  title="Odśwież przypisane role na Discordzie"
                >
                  <RefreshCw size={14} className={loading ? 'spin-slow' : ''} /> Synchronizuj role
                </button>

                <button
                  onClick={handleUnlink}
                  disabled={loading}
                  style={{
                    padding: '0.55rem 0.9rem',
                    fontSize: '0.82rem',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid #ef4444',
                    color: '#fca5a5',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                  title="Odłącz powiązanie z kontem Discord"
                >
                  <Unlink size={14} /> Odłącz
                </button>
              </div>
            </div>

            {/* Assigned Discord Roles */}
            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '1.2rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--gold-ancient)', fontWeight: 700, marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Award size={16} /> Przypisane & Zsynchronizowane Role Discord:
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                {assignedRoles.length > 0 ? (
                  assignedRoles.map((roleName, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '0.35rem 0.8rem',
                        background: 'rgba(197, 159, 78, 0.15)',
                        border: '1px solid rgba(197, 159, 78, 0.4)',
                        color: '#fef08a',
                        borderRadius: '16px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <Sparkles size={12} color="var(--gold-ancient)" /> {roleName}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    Role zostały przypisane domyślnie. Użyj przycisku „Synchronizuj role”, aby odświeżyć listę.
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ================= NOT CONNECTED VIEW ================= */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Steps Guide */}
            <div
              style={{
                background: 'rgba(88, 101, 242, 0.08)',
                border: '1px solid rgba(88, 101, 242, 0.25)',
                borderRadius: '8px',
                padding: '1.2rem'
              }}
            >
              <div style={{ fontSize: '0.85rem', color: '#c7d2fe', fontWeight: 700, marginBottom: '0.6rem' }}>
                📜 Instrukcja weryfikacji tożsamości na Discordzie:
              </div>
              <ol style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.6 }}>
                <li>Kliknij przycisk poniżej, aby wygenerować unikalny, 20-minutowy <strong>Kod Runiczny</strong>.</li>
                <li>Przejdź na nasz oficjalny serwer Discord Cytadeli Durmstrang.</li>
                <li>Wpisz komendę slash: <code style={{ background: 'rgba(0,0,0,0.5)', padding: '0.1rem 0.4rem', color: '#fde047', borderRadius: '4px' }}>/weryfikuj kod: [TWÓJ_KOD]</code> na dowolnym kanale lub w wątku weryfikacji.</li>
                <li>Bot natychmiast zweryfikuje Twoją tożsamość, przypisze profil i nada Ci <strong>role Zakonu ({house?.name || 'Zakon'}), Rangi oraz Klasy</strong>!</li>
              </ol>
            </div>

            {/* Generated Code Area */}
            {activeCode ? (
              <div
                style={{
                  background: 'radial-gradient(circle at 50% 50%, rgba(197, 159, 78, 0.15) 0%, rgba(15, 23, 42, 0.8) 100%)',
                  border: '2px solid var(--gold-ancient)',
                  borderRadius: '10px',
                  padding: '1.8rem',
                  textAlign: 'center',
                  boxShadow: '0 0 25px rgba(197, 159, 78, 0.2)',
                  position: 'relative'
                }}
              >
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.5rem' }}>
                  Twój Runiczny Kod Weryfikacyjny
                </div>

                <div
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '2.4rem',
                    fontWeight: 900,
                    letterSpacing: '0.25em',
                    color: 'var(--gold-glow)',
                    textShadow: '0 0 15px rgba(197, 159, 78, 0.8)',
                    margin: '0.5rem 0'
                  }}
                >
                  {activeCode}
                </div>

                {timeLeft && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', fontSize: '0.8rem', color: timeLeft === 'Wygasł' ? '#ef4444' : '#38bdf8', marginBottom: '1.2rem' }}>
                    <Clock size={14} /> Czas ważności kodu: <strong>{timeLeft}</strong>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleCopyCommand}
                    className="btn-durmstrang"
                    style={{
                      padding: '0.65rem 1.3rem',
                      fontSize: '0.88rem',
                      background: 'linear-gradient(135deg, #5865F2 0%, #3b47c4 100%)',
                      border: 'none',
                      color: '#ffffff',
                      boxShadow: '0 4px 15px rgba(88, 101, 242, 0.4)'
                    }}
                  >
                    {copiedCommand ? <Check size={16} /> : <Copy size={16} />}
                    {copiedCommand ? 'Skopiowano komendę!' : `Kopiuj: /weryfikuj kod: ${activeCode}`}
                  </button>

                  <button
                    onClick={handleCopyCode}
                    style={{
                      padding: '0.65rem 1rem',
                      fontSize: '0.85rem',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#e2e8f0',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                    {copiedCode ? 'Skopiowano kod' : 'Tylko kod'}
                  </button>

                  <button
                    onClick={() => handleGenerateCode(true)}
                    disabled={loading}
                    style={{
                      padding: '0.65rem 1rem',
                      fontSize: '0.85rem',
                      background: 'transparent',
                      border: '1px solid var(--gold-ancient)',
                      color: 'var(--gold-ancient)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <RefreshCw size={14} className={loading ? 'spin-slow' : ''} /> Nowy kod
                  </button>
                </div>
              </div>
            ) : (
              /* Generate Code Button */
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <button
                  onClick={() => handleGenerateCode(false)}
                  disabled={loading}
                  className="btn-durmstrang"
                  style={{
                    padding: '0.9rem 2.2rem',
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #c59f4e 0%, #8b6b23 100%)',
                    color: '#06090e',
                    boxShadow: '0 8px 30px rgba(197, 159, 78, 0.45)'
                  }}
                >
                  <Sparkles size={18} /> Wygeneruj Runiczny Kod Weryfikacyjny
                </button>
              </div>
            )}

            {/* Expected Roles Preview */}
            <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '1.2rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.6rem' }}>
                🛡️ Role, które zostaną Ci automatycznie nadane po wpisaniu komendy na Discordzie:
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ padding: '0.3rem 0.7rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#6ee7b7', borderRadius: '12px', fontSize: '0.78rem' }}>
                  ✨ Zweryfikowany Adept
                </span>
                {currentUser?.house && (
                  <span style={{ padding: '0.3rem 0.7rem', background: 'rgba(197, 159, 78, 0.2)', border: '1px solid var(--gold-ancient)', color: '#fef08a', borderRadius: '12px', fontSize: '0.78rem' }}>
                    {house ? `${house.crestIcon} ${house.name}` : `Zakon: ${currentUser.house}`}
                  </span>
                )}
                <span style={{ padding: '0.3rem 0.7rem', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid #38bdf8', color: '#7dd3fc', borderRadius: '12px', fontSize: '0.78rem' }}>
                  {currentUser?.role === 'admin' ? '⚡ Rada Arcymistrzów' : currentUser?.role === 'professor' ? '🧙‍♂️ Profesor' : '📜 Adept Cytadeli'}
                </span>
                {currentUser?.classYear && (
                  <span style={{ padding: '0.3rem 0.7rem', background: 'rgba(168, 85, 247, 0.15)', border: '1px solid #a855f7', color: '#d8b4fe', borderRadius: '12px', fontSize: '0.78rem' }}>
                    {currentUser.classYear}
                  </span>
                )}
              </div>
            </div>

            {/* Test Simulator Collapsible (Ideal for testing locally) */}
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1rem' }}>
              <button
                onClick={() => setShowSimulator(!showSimulator)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: 0
                }}
              >
                <Zap size={14} color="#f59e0b" /> {showSimulator ? 'Ukryj symulator testowy' : 'Rozwiń symulator weryfikacji (Test lokalny / bez bota)'}
              </button>

              {showSimulator && (
                <div
                  style={{
                    marginTop: '0.8rem',
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px dashed rgba(245, 158, 11, 0.3)',
                    borderRadius: '6px',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.8rem'
                  }}
                >
                  <div style={{ fontSize: '0.78rem', color: '#fbbf24' }}>
                    💡 <strong>Symulator deweloperski</strong>: Pozwala natychmiast przetestować weryfikację i przypisanie ról w bazie danych bez konieczności wpisywania komendy na zewnętrznym Discordzie.
                  </div>

                  <div style={{ display: 'flex', gap: '0.6rem' }}>
                    <input
                      type="text"
                      placeholder="Twój tag Discord (np. Valdemar#1294)"
                      value={simDiscordTag}
                      onChange={(e) => setSimDiscordTag(e.target.value)}
                      style={{
                        flex: 1,
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#ffffff',
                        padding: '0.5rem 0.8rem',
                        borderRadius: '4px',
                        fontSize: '0.82rem'
                      }}
                    />
                    <button
                      onClick={handleTestVerify}
                      disabled={simulating || !activeCode}
                      className="btn-durmstrang"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', background: '#f59e0b', color: '#000', fontWeight: 700 }}
                    >
                      {simulating ? 'Weryfikuję...' : 'Wykonaj test weryfikacji'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div style={{ marginTop: '1.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.2rem', fontSize: '0.78rem', color: '#64748b' }}>
          <span>TWIERDZA MAGII DURMSTRANG • Discord Integration Engine</span>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#94a3b8',
              padding: '0.4rem 0.9rem',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
};
