import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import {
  X,
  Key,
  Shield,
  Sparkles,
  CheckCircle,
  Lock,
  User,
  ArrowRight
} from 'lucide-react';
import { api } from '../api';

export const PasswordRecoveryModal = ({ isOpen, onClose }) => {
  const { showNotification } = useSchool();
  const { playWandSwoosh, playRuneChime } = useSound();

  const [usernameInput, setUsernameInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1: identify | 2: new password | 3: success
  const [matchedUser, setMatchedUser] = useState(null);
  const [resetToken, setResetToken] = useState('');

  const handleIdentify = async (e) => {
    e.preventDefault();
    const trimmed = usernameInput.trim().toLowerCase();
    if (!trimmed) return;
    await api.requestPasswordRecovery(trimmed);
    playRuneChime();
    setMatchedUser({ username: trimmed });
    setStep(2);
    showNotification('Sprawdź Pocztę', 'Jeśli konto istnieje, wysłaliśmy jednorazowy kod ważny przez 30 minut.', 'info');
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      showNotification('Brak Hasła', 'Podaj nową pieczęć hasła.', 'warning');
      return;
    }

    const result = await api.confirmPasswordRecovery(resetToken.trim(), newPassword.trim());
    if (!result.ok) {
      showNotification('Nie Zmieniono Hasła', result.error, 'warning');
      return;
    }
    playWandSwoosh();
    setStep(3);
  };

  const handleClose = () => {
    setStep(1);
    setUsernameInput('');
    setNewPassword('');
    setMatchedUser(null);
    setResetToken('');
    onClose();
  };

  // Handle ESC key
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10001,
        background: 'rgba(2, 4, 7, 0.92)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem'
      }}
    >
      <div
        className="gothic-parchment-modal runic-corners"
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'linear-gradient(180deg, #101622 0%, #080c13 100%)',
          border: '1px solid var(--gold-ancient)',
          borderRadius: '8px',
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.98), 0 0 40px rgba(197, 159, 78, 0.25)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ height: '3px', background: 'linear-gradient(90deg, transparent, var(--gold-ancient), var(--ice-frost), transparent)' }} />

        {/* Header */}
        <div
          style={{
            padding: '1.2rem 1.5rem',
            borderBottom: '1px solid rgba(197, 159, 78, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(10, 14, 22, 0.85)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Key size={18} color="var(--gold-glow)" />
            <h3 style={{ fontSize: '1.2rem', color: '#ffffff', fontFamily: 'var(--font-heading)' }}>
              Odnowienie Pieczęci Hasła
            </h3>
          </div>

          <button
            onClick={handleClose}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '4px',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '0.35rem'
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem 1.75rem' }}>
          {step === 1 && (
            <form onSubmit={handleIdentify} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <p style={{ fontSize: '0.85rem', color: '#cfd7e4', lineHeight: 1.5 }}>
                Wpisz nazwę użytkownika (login) przypisany do Twojej tożsamości w księdze Cytadeli:
              </p>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gold-ancient)', marginBottom: '0.35rem' }}>
                  Login Adepta / Profesora (np. <code>valdemar</code>, <code>morana</code>)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Wpisz swój login..."
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="gothic-input"
                  style={{ fontSize: '0.95rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
                <button type="button" onClick={handleClose} className="btn-durmstrang-secondary">
                  Anuluj
                </button>
                <button type="submit" className="btn-durmstrang">
                  <ArrowRight size={14} /> Zweryfikuj w Archiwum
                </button>
              </div>
            </form>
          )}

          {step === 2 && matchedUser && (
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <p style={{ fontSize: '0.85rem', color: '#cfd7e4', lineHeight: 1.5 }}>
                Wpisz jednorazowy kod otrzymany pocztą. Kod wygasa po 30 minutach i działa tylko raz.
              </p>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gold-ancient)', marginBottom: '0.35rem' }}>
                  Jednorazowy kod odnowienia *
                </label>
                <input
                  type="text"
                  required
                  autoComplete="one-time-code"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  className="gothic-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gold-ancient)', marginBottom: '0.35rem' }}>
                  Wprowadź Nową Pieczęć Hasła *
                </label>
                <input
                  type="password"
                  required
                  minLength={12}
                  autoComplete="new-password"
                  placeholder="Wpisz nowe hasło..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="gothic-input"
                  style={{ fontSize: '0.95rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
                <button type="button" onClick={() => setStep(1)} className="btn-durmstrang-secondary">
                  Wstecz
                </button>
                <button type="submit" className="btn-durmstrang">
                  <Key size={14} /> Przypieczętuj Nowe Hasło
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <CheckCircle size={44} color="var(--gold-glow)" style={{ margin: '0 auto 0.8rem' }} />
              <h4 style={{ fontSize: '1.25rem', color: '#ffffff', marginBottom: '0.4rem' }}>
                Pieczęć Hasła Odnowiona!
              </h4>
              <p style={{ color: '#9ca3af', fontSize: '0.88rem', marginBottom: '1.4rem' }}>
                Możesz teraz zalogować się do Cytadeli przy użyciu nowego hasła.
              </p>
              <button
                onClick={handleClose}
                className="btn-durmstrang"
                style={{ padding: '0.6rem 1.6rem' }}
              >
                Zamknij i Zaloguj Się
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
