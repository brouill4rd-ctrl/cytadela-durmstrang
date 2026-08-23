import React, { useState, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import {
  X,
  User,
  Lock,
  Sparkles,
  GraduationCap,
  BookOpen,
  Shield,
  Key,
  LogIn,
  UserPlus,
  Wand2,
  CheckCircle,
  Building,
  Scroll,
  HelpCircle,
  ArrowRight
} from 'lucide-react';

const DEPARTMENTS_LIST = [
  { id: 'czarna-magia', name: 'Katedra Czarnej Magii & Nekromancji', banner: 'czarna-magia' },
  { id: 'eliksiry', name: 'Katedra Eliksirów & Toksykologii', banner: 'eliksiry' },
  { id: 'liga-bojowa', name: 'Katedra Szermierki Runicznej & Magii Bojowej', banner: 'liga-bojowa' },
  { id: 'starozytne-runy', name: 'Katedra Starożytnych Run & Pieczęci', banner: 'starozytne-runy' },
  { id: 'astronomia', name: 'Katedra Astromagii & Zórz Polarnych', banner: 'astronomia' },
  { id: 'zielarstwo', name: 'Katedra Arktycznego Zielarstwa', banner: 'zielarstwo' }
];

export const AuthModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const {
    users,
    currentUser,
    loginUser,
    registerUser,
    switchUser,
    setPasswordRecoveryModalOpen
  } = useSchool();

  const { playWandSwoosh, playRuneChime } = useSound();

  const [tab, setTab] = useState('login'); // 'login' | 'register'

  // Login Form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form state (Only student & professor publicly)
  const [regRole, setRegRole] = useState('student'); // 'student' | 'professor'
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regSurname, setRegSurname] = useState('');
  const [regAvatar, setRegAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80');

  // Student specific
  const [regOrigin, setRegOrigin] = useState('Skandynawia (Norwegia)');
  const [regWandWood, setRegWandWood] = useState('Cis Arktyczny');
  const [regWandCore, setRegWandCore] = useState('Włókno Serca Smoka');
  const [regPatronus, setRegPatronus] = useState('Wilk Polarny');
  const [regCompanion, setRegCompanion] = useState('Puchacz Śnieżny');
  const [regBackstory, setRegBackstory] = useState('');

  // Professor specific
  const [regDepartment, setRegDepartment] = useState('eliksiry');
  const [regOffice, setRegOffice] = useState('Wieża Nocnych Szeptów, Sala IV');
  const [regSpecialization, setRegSpecialization] = useState('Destylacja Północna i Toksykologia Arktyczna');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    playWandSwoosh();
    const success = await loginUser(loginUsername, loginPassword);
    if (success) {
      onClose();
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    playWandSwoosh();

    const selectedDeptObj = DEPARTMENTS_LIST.find(d => d.id === regDepartment);

    const userData = {
      username: regUsername.trim(),
      email: regEmail.trim() || `${regUsername.trim()}@durmstrang.edu`,
      password: regPassword.trim() || '123',
      name: regName.trim(),
      surname: regSurname.trim(),
      role: regRole,
      avatar: regAvatar.trim(),
      // Student
      origin: regOrigin,
      wand: `${regWandWood}, ${regWandCore}, 12 cali, Sztywna`,
      patronus: regPatronus,
      companion: regCompanion,
      backstory: regBackstory,
      // Professor
      department: regDepartment,
      departmentName: selectedDeptObj ? selectedDeptObj.name : 'Katedra Magii',
      office: regOffice,
      specialization: regSpecialization,
      taughtSubjectIds: [regDepartment]
    };

    const success = await registerUser(userData);
    if (success) {
      onClose();
    }
  };

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
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
          maxWidth: '740px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(180deg, #101622 0%, #080c13 100%)',
          border: '1px solid var(--gold-ancient)',
          borderRadius: '8px',
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.98), 0 0 40px rgba(197, 159, 78, 0.25)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Gold Border Accent */}
        <div style={{ height: '3px', background: 'linear-gradient(90deg, transparent, var(--gold-ancient), var(--ice-frost), transparent)' }} />

        {/* Header with Tabs */}
        <div
          style={{
            padding: '1.2rem 1.75rem',
            borderBottom: '1px solid rgba(197, 159, 78, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(10, 14, 22, 0.85)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <Shield size={20} color="var(--gold-glow)" />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gold-ancient)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Archiwum Tożsamości Cytadeli
              </div>
              <h2 style={{ fontSize: '1.35rem', color: '#ffffff', fontFamily: 'var(--font-heading)' }}>
                {tab === 'login' ? 'Logowanie do Księgi Cytadeli' : 'Złóż Podanie / Nominację Profesorską'}
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {/* Tab switch pills */}
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.5)', padding: '0.2rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <button
                type="button"
                onClick={() => setTab('login')}
                style={{
                  padding: '0.35rem 0.8rem',
                  border: 'none',
                  borderRadius: '3px',
                  background: tab === 'login' ? 'rgba(197, 159, 78, 0.25)' : 'transparent',
                  color: tab === 'login' ? '#ffffff' : '#9ca3af',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                <LogIn size={13} /> Zaloguj
              </button>
              <button
                type="button"
                onClick={() => setTab('register')}
                style={{
                  padding: '0.35rem 0.8rem',
                  border: 'none',
                  borderRadius: '3px',
                  background: tab === 'register' ? 'rgba(164, 200, 225, 0.25)' : 'transparent',
                  color: tab === 'register' ? '#ffffff' : '#9ca3af',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                <UserPlus size={13} /> Utwórz Konto
              </button>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '4px',
                color: '#9ca3af',
                cursor: 'pointer',
                padding: '0.35rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div style={{ padding: '1.75rem 2rem', overflowY: 'auto', flex: 1 }}>
          {tab === 'login' ? (
            /* =========================================================================
               TAB: LOGOWANIE
               ========================================================================= */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Classic Login Form */}
              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gold-ancient)', marginBottom: '0.35rem' }}>
                    Nazwa Adepta / Login (np. <code>valdemar</code>, <code>morana</code>, <code>valgerda</code>)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Wpisz swój login..."
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className="gothic-input"
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label style={{ fontSize: '0.78rem', color: 'var(--gold-ancient)' }}>
                      Hasło (Domyślne: <code>123</code>)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        setPasswordRecoveryModalOpen(true);
                      }}
                      style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '0.74rem', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Zapomniałeś hasła?
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="Wpisz hasło..."
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="gothic-input"
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn-durmstrang" style={{ padding: '0.6rem 1.6rem', fontSize: '0.9rem' }}>
                    <LogIn size={15} /> Otwórz Wrota Cytadeli
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* =========================================================================
               TAB: TWORZENIE KONTA (REJESTRACJA UCZEŃ / PROFESOR)
               ========================================================================= */
            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Role Picker (Student / Professor Only) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gold-ancient)', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Wybierz Typ Podania (Zatwierdzane przez Dyrekcję):
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                  {/* Student */}
                  <button
                    type="button"
                    onClick={() => {
                      playRuneChime();
                      setRegRole('student');
                    }}
                    style={{
                      padding: '0.85rem',
                      borderRadius: '4px',
                      border: regRole === 'student' ? '1px solid var(--gold-glow)' : '1px solid rgba(255,255,255,0.08)',
                      background: regRole === 'student' ? 'rgba(197, 159, 78, 0.2)' : 'rgba(8, 12, 18, 0.7)',
                      color: regRole === 'student' ? '#ffffff' : '#9ca3af',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s ease',
                      boxShadow: regRole === 'student' ? '0 0 12px rgba(197, 159, 78, 0.3)' : 'none'
                    }}
                  >
                    <GraduationCap size={22} color={regRole === 'student' ? 'var(--gold-glow)' : '#9ca3af'} style={{ margin: '0 auto 0.3rem' }} />
                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Podanie o Przyjęcie Adepta (Uczeń)</div>
                    <div style={{ fontSize: '0.72rem', color: '#8c95a6' }}>Dostęp do lekcji, run i ceremonii</div>
                  </button>

                  {/* Professor */}
                  <button
                    type="button"
                    onClick={() => {
                      playRuneChime();
                      setRegRole('professor');
                    }}
                    style={{
                      padding: '0.85rem',
                      borderRadius: '4px',
                      border: regRole === 'professor' ? '1px solid #9b72cf' : '1px solid rgba(255,255,255,0.08)',
                      background: regRole === 'professor' ? 'rgba(155, 114, 207, 0.25)' : 'rgba(8, 12, 18, 0.7)',
                      color: regRole === 'professor' ? '#ffffff' : '#9ca3af',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s ease',
                      boxShadow: regRole === 'professor' ? '0 0 12px rgba(155, 114, 207, 0.35)' : 'none'
                    }}
                  >
                    <BookOpen size={22} color={regRole === 'professor' ? '#d8c2ff' : '#9ca3af'} style={{ margin: '0 auto 0.3rem' }} />
                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Aplikacja na Katedrę (Profesor)</div>
                    <div style={{ fontSize: '0.72rem', color: '#8c95a6' }}>Prowadzenie przedmiotu i ocenianie</div>
                  </button>
                </div>

                <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: '0.4rem', fontStyle: 'italic' }}>
                  * Uwaga: Mianowanie nowych członków Władz Cytadeli (Arcymistrzów) odbywa się wyłącznie wewnętrznie w Panelu Dyrekcji.
                </div>
              </div>

              {/* Core Credentials & Email */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gold-ancient)', marginBottom: '0.35rem' }}>
                    Login / Nazwa Użytkownika *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="np. einar_nord, astrid, prof_alchemia"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    className="gothic-input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gold-ancient)', marginBottom: '0.35rem' }}>
                    Hasło *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Wpisz hasło..."
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="gothic-input"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gold-ancient)', marginBottom: '0.35rem' }}>
                  Adres E-mail / Sowa Kontaktowa (tutaj otrzymasz list potwierdzający i decyzję Dyrekcji) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="np. adept@poczta.pl, valdemar@nordic.no"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="gothic-input"
                />
              </div>

              {/* Name & Surname */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gold-ancient)', marginBottom: '0.35rem' }}>
                    Imię *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="np. Einar, Freja, Morana"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="gothic-input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gold-ancient)', marginBottom: '0.35rem' }}>
                    Nazwisko / Przydomek *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="np. Lindqvist, Krag, Vane"
                    value={regSurname}
                    onChange={(e) => setRegSurname(e.target.value)}
                    className="gothic-input"
                  />
                </div>
              </div>

              {/* Role Specific Fields */}
              {regRole === 'student' && (
                /* STUDENT FORM */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(8, 12, 18, 0.6)', padding: '1.1rem', borderRadius: '6px', border: '1px solid rgba(197, 159, 78, 0.2)' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--gold-glow)', fontFamily: 'var(--font-heading)' }}>
                    🎓 Parametry Adepta & Różdżka:
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Drewno Różdżki</label>
                      <select value={regWandWood} onChange={(e) => setRegWandWood(e.target.value)} className="gothic-select">
                        <option value="Cis Arktyczny">Cis Arktyczny</option>
                        <option value="Czarny Heban">Czarny Heban</option>
                        <option value="Sosna Tundrowa">Sosna Tundrowa</option>
                        <option value="Czarny Dąb">Czarny Dąb</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Rdzeń Magiczny</label>
                      <select value={regWandCore} onChange={(e) => setRegWandCore(e.target.value)} className="gothic-select">
                        <option value="Włókno Serca Smoka">Włókno Serca Smoka</option>
                        <option value="Włos Kelpie">Włos Kelpie</option>
                        <option value="Pióro Kruka Cienia">Pióro Kruka Cienia</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Duch Opiekuńczy (Patronus)</label>
                      <input
                        type="text"
                        value={regPatronus}
                        onChange={(e) => setRegPatronus(e.target.value)}
                        className="gothic-input"
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Magiczny Towarzysz</label>
                      <input
                        type="text"
                        value={regCompanion}
                        onChange={(e) => setRegCompanion(e.target.value)}
                        className="gothic-input"
                      />
                    </div>
                  </div>
                </div>
              )}

              {regRole === 'professor' && (
                /* PROFESSOR FORM WITH SPECIFIC DEPARTMENT SELECTION */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(8, 12, 18, 0.6)', padding: '1.1rem', borderRadius: '6px', border: '1px solid rgba(155, 114, 207, 0.3)' }}>
                  <div style={{ fontSize: '0.85rem', color: '#d8c2ff', fontFamily: 'var(--font-heading)' }}>
                    📖 Wybór Katedry Magicznej (Prowadzony Przedmiot):
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#d8c2ff', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                      Katedra Magiczna do zatwierdzenia przez Dyrekcję *
                    </label>
                    <select
                      value={regDepartment}
                      onChange={(e) => setRegDepartment(e.target.value)}
                      className="gothic-select"
                      style={{ fontSize: '0.9rem', padding: '0.7rem 1rem' }}
                    >
                      {DEPARTMENTS_LIST.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Gabinet w Cytadeli</label>
                      <input
                        type="text"
                        value={regOffice}
                        onChange={(e) => setRegOffice(e.target.value)}
                        className="gothic-input"
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Specjalizacja Naukowa</label>
                      <input
                        type="text"
                        value={regSpecialization}
                        onChange={(e) => setRegSpecialization(e.target.value)}
                        className="gothic-input"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Informative notice */}
              <div style={{ background: 'rgba(197, 159, 78, 0.08)', borderLeft: '3px solid var(--gold-ancient)', padding: '0.65rem 0.9rem', fontSize: '0.75rem', color: '#cfd7e4', lineHeight: 1.4 }}>
                Po złożeniu formularza Twoje podanie trafi do <strong>Kancelarii Dyrekcji</strong>. Zalogowanie będzie możliwe po przypieczętowaniu zgłoszenia przez Arcymistrza.
              </div>

              {/* Submit */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '0.4rem' }}>
                <button type="button" onClick={onClose} className="btn-durmstrang-secondary">
                  Anuluj
                </button>
                <button type="submit" className="btn-durmstrang">
                  <UserPlus size={15} /> Złóż Podanie do Dyrekcji
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
