import React, { useState, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import { CEREMONY_QUESTIONS } from '../data/seedCeremonyQuestions';
import { HOUSES } from '../data/seedHouses';
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
  ArrowRight,
  Compass,
  Heart,
  Image as ImageIcon,
  Flame,
  RefreshCw,
  Award
} from 'lucide-react';

const DEPARTMENTS_LIST = [
  { id: 'czarna-magia', name: 'Katedra Czarnej Magii & Nekromancji', banner: 'czarna-magia' },
  { id: 'eliksiry', name: 'Katedra Eliksirów & Toksykologii', banner: 'eliksiry' },
  { id: 'liga-bojowa', name: 'Katedra Szermierki Runicznej & Magii Bojowej', banner: 'liga-bojowa' },
  { id: 'starozytne-runy', name: 'Katedra Starożytnych Run & Pieczęci', banner: 'starozytne-runy' },
  { id: 'astronomia', name: 'Katedra Astromagii & Zórz Polarnych', banner: 'astronomia' },
  { id: 'zielarstwo', name: 'Katedra Arktycznego Zielarstwa', banner: 'zielarstwo' }
];

const ORIGINS_LIST = [
  '🇳🇴 Skandynawia — Północne Fiordy i Lodowce (Norwegia)',
  '🇸🇪 Skandynawia — Góry Skandynawskie & Doliny (Szwecja)',
  '🇩🇰 Skandynawia — Wybrzeże Cieśnin Bałtyckich (Dania)',
  '🇮🇸 Islandia — Kraina Gejzerów, Lodu i Wulkanów',
  '🇫🇮 Finlandia — Puszcze Krainy Tysiąca Jezior',
  '🇬🇱 Grenlandia — Pustkowia Wiecznej Zmarzliny',
  '🇫🇴 Wyspy Owcze — Wietrzne Klify Atlantyku',
  '🌌 Laponia — Bezkresna Tundra pod Zorzami Polarnymi',
  '🇧🇬 Półwysep Bałkański — Pasmo Rodopów i Traków (Bułgaria)',
  '🇷🇴 Karpaty Północne — Zamczyska Siedmiogrodu (Rumunia)',
  '🇵🇱 Polska — Starożytna Puszcza Białowieska & Tatry',
  '🇩🇪 Schwarzwald — Północny Czarny Las (Niemcy)',
  '🌐 Inna Kraina Magicznego Świata (Własna)'
];

const WAND_WOODS_LIST = [
  { name: 'Cis Arktyczny', desc: 'Sprzyja magii cienia, długowieczności i twardym pojedynkom' },
  { name: 'Czarny Heban', desc: 'Idealny do czarnej magii bojowej, transmutacji i potężnych klątw' },
  { name: 'Sosna Tundrowa', desc: 'Odporna na arktyczne mrozy, wzmacnia czary obronne i tarcze' },
  { name: 'Czarny Dąb', desc: 'Pradawne drzewo runiczne, niewzruszone i lojalne wobec odważnych' },
  { name: 'Jarzębina Mrozu', desc: 'Niezrównana ochrona przed anomaliami i klątwami uroków' },
  { name: 'Jesion Skandynawski', desc: 'Drzewo Yggdrasil, doskonałe do zaklęć żywiołów i zórz' },
  { name: 'Brzoza Polarna', desc: 'Lekka, niezwykle czuła na subtelne prądy eteryczne i runy' },
  { name: 'Modrzew Syberyjski', desc: 'Elastyczny lecz trwały, daje stabilność i wielką odwagę' },
  { name: 'Wiąz Północny', desc: 'Tradycyjny wybór dawnych mistrzów run z Uppsale i Trondheim' },
  { name: 'Głóg Cierniowy', desc: 'Niebezpieczny w rękach zdeterminowanych, mistrz ciętych uroków' },
  { name: 'Olcha Lodowcowa', desc: 'Silnie rezonuje z magią wód, lodu i zjawisk atmosferycznych' },
  { name: 'Klon Północny', desc: 'Sprzyja magii podróży, wielkim ambicjom i dyscyplinie' }
];

const WAND_CORES_LIST = [
  { name: 'Włókno Serca Smoka Lodowego (Skadi)', desc: 'Potężna, natychmiastowa emanacja magii zórz i zimna' },
  { name: 'Włos z Grzywy Wilka Lodowcowego (Fenrir)', desc: 'Niezrównany instynkt bojowy, lojalność i twardość' },
  { name: 'Włos z Ogona Kelpie', desc: 'Nieokiełznana potęga morskich odmętów i fiordów' },
  { name: 'Pióro Kruka Cienia (Hugin & Munin)', desc: 'Wybitna wrażliwość na nekromancję i odczyt run' },
  { name: 'Włos Niedźwiedzia Mrozu (Jotunheim)', desc: 'Potężna siła fizyczna i tarcze nie do przebicia' },
  { name: 'Kieł Żmii Lodowcowej (Jörmungandr)', desc: 'Przenikliwość i błyskawiczne, jadowite zaklęcia' },
  { name: 'Włókno Rogu Białego Jelenia (Eikthyrnir)', desc: 'Szlachetność, ochrona, uzdrawianie i czyste intencje' },
  { name: 'Łza Feniksa Polarnego', desc: 'Cudowna regeneracja i płomień w mroźnych zawiejach' },
  { name: 'Ścięgno Morskiego Krakena', desc: 'Niewiarygodny nacisk i moc zaklęć wiążących' },
  { name: 'Łuska Wiwerny Północnej', desc: 'Wyjątkowa stabilność rzucania zaklęć w każdych warunkach' },
  { name: 'Pył z Meteorytu Runicznego', desc: 'Tajemnicza siła pradawnych gwiezdnych pieczęci' }
];

const WAND_LENGTHS = [
  '9 i 1/2 cala', '10 cali', '10 i 3/4 cala', '11 i 1/2 cala',
  '12 cali', '12 i 3/4 cala', '13 i 1/2 cala', '14 cali', '14 i 1/2 cala', '15 cali'
];

const WAND_FLEXIBILITIES = [
  'Sztywna i Nieugięta',
  'Solidna i Zrównoważona',
  'Sprężysta i Dynamiczna',
  'Giętka i Podatna',
  'Twarda jak Zmarzlina',
  'Elegancko Elastyczna',
  'Błyskawicznie Śmigła'
];

const MAGIC_TALENTS_LIST = [
  'Nekromancja & Wiązanie Cieni',
  'Runiczna Magia Bojowa (Galdr)',
  'Magia Lodu, Mrozu & Zórz Polarnych',
  'Arktyczne Eliksiry & Toksykologia',
  'Astromagia & Nawigacja Gwiezdna',
  'Oklumencja & Mentalne Bariery Run',
  'Starożytne Pieczęcie & Runiczne Rytuały',
  'Szermierka Runiczna (Hólmganga)',
  'Transmutacja Północna & Kształtowanie Lodu'
];

const CLASS_YEAR_OPTIONS = [
  { age: '11', classYear: 'Klasa I • Fundamenty Magii (Nowicjusz)' },
  { age: '12', classYear: 'Klasa I • Fundamenty Magii (Nowicjusz)' },
  { age: '13', classYear: 'Klasa II • Zaawansowana Magia (Adept)' },
  { age: '14', classYear: 'Klasa II • Zaawansowana Magia (Adept)' },
  { age: '15', classYear: 'Klasa III • Specjalizacje Runiczne (Starszy Adept)' },
  { age: '16', classYear: 'Klasa III • Specjalizacje Runiczne (Starszy Adept)' },
  { age: '17', classYear: 'Klasa IV • Krąg Mistrzowski (Pretendent)' },
  { age: '18', classYear: 'Klasa IV • Krąg Mistrzowski (Pretendent)' },
  { age: '19', classYear: 'Studia Podyplomowe Katedr Magii' }
];

const PRESET_AVATARS = [
  { url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80', label: 'Adeptka Cienia' },
  { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80', label: 'Wojownik Björnhall' },
  { url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80', label: 'Mistrzyni Run' },
  { url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80', label: 'Adept Północy' },
  { url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80', label: 'Alchemiczka Otergard' },
  { url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80', label: 'Strateg Reinhall' }
];

const PATRONUS_PRESETS = [
  'Wilk Polarny', 'Puchacz Śnieżny', 'Niedźwiedź Polarny', 'Kruk Cienia',
  'Ryś Skandynawski', 'Lis Polarny (Pieściec)', 'Gronostaj', 'Rosomak',
  'Orzeł Przedni', 'Biały Jeleń', 'Orka Północna', 'Sokół Norweski'
];

const COMPANION_PRESETS = [
  'Puchacz Śnieżny (Hugin)', 'Czarny Kruk Runiczny', 'Młody Lis Polarny',
  'Sowa Jarzębata', 'Kot Norweski Leśny', 'Zwinna Łasica Śnieżna',
  'Szczur Tunelowy', 'Żmija Mrozowa', 'Rosomak Karłowaty'
];

export const AuthModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const {
    users,
    currentUser,
    loginUser,
    registerUser,
    authModalTab,
    setAuthModalTab,
    setPasswordRecoveryModalOpen,
    studentProfile,
    showNotification
  } = useSchool();

  const { playWandSwoosh, playRuneChime, playSortingFanfare } = useSound();

  const [tab, setTab] = useState(authModalTab || 'login'); // 'login' | 'register'

  useEffect(() => {
    if (authModalTab) {
      setTab(authModalTab);
    }
  }, [authModalTab]);

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

  // Student specific rich details
  const [regAge, setRegAge] = useState('14');
  const [regClassYear, setRegClassYear] = useState('Klasa II • Zaawansowana Magia (Adept)');
  const [regGender, setRegGender] = useState('Kobieta');
  const [regOrigin, setRegOrigin] = useState('🇳🇴 Skandynawia — Północne Fiordy i Lodowce (Norwegia)');
  const [regCustomOrigin, setRegCustomOrigin] = useState('');
  const [regMagicTalent, setRegMagicTalent] = useState('Nekromancja & Wiązanie Cieni');

  // Mandatory Interactive Ceremony in Registration (NO manual selection)
  const hasPriorGuestRitual = Boolean(studentProfile?.house && studentProfile.house !== 'reinhall');
  const [regPreferredHouse, setRegPreferredHouse] = useState(() => hasPriorGuestRitual ? studentProfile.house : null);
  const [ceremonyCompleted, setCeremonyCompleted] = useState(() => hasPriorGuestRitual);
  const [ceremonyStep, setCeremonyStep] = useState(() => hasPriorGuestRitual ? 0 : 1); // 1..4 = active questions, 5 = calculating, 0 = completed decree
  const [ceremonyAnswers, setCeremonyAnswers] = useState([]);

  // Sync if studentProfile had house assigned earlier
  useEffect(() => {
    if (studentProfile?.house && studentProfile.house !== 'reinhall') {
      setRegPreferredHouse(studentProfile.house);
      setCeremonyCompleted(true);
      setCeremonyStep(0);
    }
  }, [studentProfile]);

  // Wand
  const [regWandWood, setRegWandWood] = useState('Cis Arktyczny');
  const [regWandCore, setRegWandCore] = useState('Włókno Serca Smoka Lodowego (Skadi)');
  const [regWandLength, setRegWandLength] = useState('12 cali');
  const [regWandFlex, setRegWandFlex] = useState('Sztywna i Nieugięta');

  // Spirit & Lore
  const [regPatronus, setRegPatronus] = useState('Wilk Polarny');
  const [regCompanion, setRegCompanion] = useState('Puchacz Śnieżny (Hugin)');
  const [regAppearance, setRegAppearance] = useState('');
  const [regBackstory, setRegBackstory] = useState('');

  // Professor specific
  const [regDepartment, setRegDepartment] = useState('czarna-magia');
  const [regOffice, setRegOffice] = useState('Wieża Nocnych Szeptów, Sala Cienia IV');
  const [regSpecialization, setRegSpecialization] = useState('Nekromancja Północna, Wiązanie Cieni i Pieczęcie');

  const handleAgeChange = (e) => {
    const newAge = e.target.value;
    setRegAge(newAge);
    const match = CLASS_YEAR_OPTIONS.find(c => c.age === newAge);
    if (match) {
      setRegClassYear(match.classYear);
    }
  };

  const handleSelectCeremonyAnswer = (houseType) => {
    playRuneChime();
    const nextAnswers = [...ceremonyAnswers, houseType];
    setCeremonyAnswers(nextAnswers);

    if (ceremonyStep < CEREMONY_QUESTIONS.length) {
      setCeremonyStep(ceremonyStep + 1);
    } else {
      // Calculate winning house strictly from choices
      const counts = { reinhall: 0, bjornhall: 0, ravnheim: 0, otergard: 0 };
      nextAnswers.forEach(h => {
        const normalized = h === 'renifer' ? 'reinhall' : h === 'niedzwiedz' ? 'bjornhall' : h === 'kruk' ? 'ravnheim' : h === 'wydra' ? 'otergard' : h;
        if (counts[normalized] !== undefined) counts[normalized]++;
      });

      let winningHouse = 'ravnheim';
      let maxVotes = -1;
      ['ravnheim', 'bjornhall', 'reinhall', 'otergard'].forEach(h => {
        if (counts[h] > maxVotes) {
          maxVotes = counts[h];
          winningHouse = h;
        }
      });

      setCeremonyStep(5);
      setTimeout(() => {
        setRegPreferredHouse(winningHouse);
        setCeremonyCompleted(true);
        setCeremonyStep(0);
        if (playSortingFanfare) playSortingFanfare();
      }, 1300);
    }
  };

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

    if (regRole === 'student' && !ceremonyCompleted) {
      if (showNotification) {
        showNotification('Kamień Przysięgi Czeka! ᛞ', 'Przed złożeniem podania musisz odpowiedzieć na 4 próby Kamienia Przysięgi.', 'warning');
      }
      setCeremonyStep(1);
      return;
    }

    playWandSwoosh();

    const selectedDeptObj = DEPARTMENTS_LIST.find(d => d.id === regDepartment);
    const resolvedOrigin = regOrigin.includes('Własna') && regCustomOrigin.trim() ? regCustomOrigin.trim() : regOrigin;
    const fullWand = `${regWandWood}, rdzeń: ${regWandCore}, ${regWandLength}, ${regWandFlex}`;

    const finalHouse = regRole === 'student' ? (regPreferredHouse || 'ravnheim') : null;

    const userData = {
      username: regUsername.trim(),
      email: regEmail.trim() || `${regUsername.trim()}@durmstrang.edu`,
      password: regPassword.trim() || '123',
      name: regName.trim(),
      surname: regSurname.trim(),
      role: regRole,
      avatar: regAvatar.trim(),
      age: regAge,
      gender: regGender,
      classYear: regClassYear,
      origin: resolvedOrigin,
      house: finalHouse,
      wand: fullWand,
      patronus: regPatronus,
      companion: regCompanion,
      appearance: regAppearance.trim() || (regRole === 'student' ? 'Młody adept w szacie podróżnej z wełnianym kołnierzem.' : 'Wykładowca w szacie katedry.'),
      backstory: regBackstory.trim() || (regRole === 'student' ? `Adept przybywający do Twierdzy Durmstrang. Zdolność wiodąca: ${regMagicTalent}. Zakon: ${finalHouse}.` : `Aplikacja na Katedrę: ${selectedDeptObj?.name || 'Katedra Magii'}.`),
      // Professor specific
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
        padding: '1rem'
      }}
    >
      <div
        className="gothic-parchment-modal runic-corners"
        style={{
          width: '100%',
          maxWidth: '840px',
          maxHeight: '94vh',
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
            padding: '1.1rem 1.6rem',
            borderBottom: '1px solid rgba(197, 159, 78, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(10, 14, 22, 0.9)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <Shield size={22} color="var(--gold-glow)" />
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--gold-ancient)', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
                Kancelaria Rekrutacji & Archiwum Tożsamości TMD
              </div>
              <h2 style={{ fontSize: '1.35rem', color: '#ffffff', margin: 0, fontFamily: 'var(--font-heading)' }}>
                {tab === 'login' ? 'Logowanie do Księgi Cytadeli' : 'Stwórz Postać & Złóż Podanie do Dyrekcji'}
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {/* Tab switch pills */}
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.6)', padding: '0.2rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.12)' }}>
              <button
                type="button"
                onClick={() => { playWandSwoosh(); setTab('login'); if (setAuthModalTab) setAuthModalTab('login'); }}
                style={{
                  padding: '0.4rem 0.85rem',
                  border: 'none',
                  borderRadius: '3px',
                  background: tab === 'login' ? 'rgba(197, 159, 78, 0.25)' : 'transparent',
                  color: tab === 'login' ? '#ffffff' : '#9ca3af',
                  fontSize: '0.8rem',
                  fontWeight: tab === 'login' ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <LogIn size={13} /> Zaloguj
              </button>
              <button
                type="button"
                onClick={() => { playWandSwoosh(); setTab('register'); if (setAuthModalTab) setAuthModalTab('register'); }}
                style={{
                  padding: '0.4rem 0.85rem',
                  border: 'none',
                  borderRadius: '3px',
                  background: tab === 'register' ? 'rgba(197, 159, 78, 0.25)' : 'transparent',
                  color: tab === 'register' ? '#ffffff' : '#9ca3af',
                  fontSize: '0.8rem',
                  fontWeight: tab === 'register' ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <UserPlus size={13} /> Złóż Podanie (Rejestracja)
              </button>
            </div>

            <button
              onClick={() => { playWandSwoosh(); onClose(); }}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '4px',
                color: '#9ca3af',
                cursor: 'pointer',
                padding: '0.4rem',
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
        <div style={{ padding: '1.6rem 2rem', overflowY: 'auto', flex: 1 }}>
          {tab === 'login' ? (
            /* =========================================================================
               TAB: LOGOWANIE
               ========================================================================= */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '520px', margin: '0 auto' }}>
              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gold-ancient)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Nazwa Adepta / Login *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="np. valdemar, morana, valgerda"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className="gothic-input"
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label style={{ fontSize: '0.78rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Hasło do Pieczęci *
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

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.6rem' }}>
                  <button
                    type="button"
                    onClick={() => { playWandSwoosh(); setTab('register'); }}
                    style={{ background: 'none', border: 'none', color: 'var(--gold-glow)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Nie masz jeszcze karty? Złóż podanie adepta →
                  </button>

                  <button type="submit" className="btn-durmstrang" style={{ padding: '0.65rem 1.6rem', fontSize: '0.9rem' }}>
                    <LogIn size={15} /> Otwórz Wrota Cytadeli
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* =========================================================================
               TAB: PEŁNE TWORZENIE POSTACI & REJESTRACJA PODANIA (UCZEŃ / PROFESOR)
               ========================================================================= */
            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.3rem' }}>
              {/* Role Picker (Student / Professor Only) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--gold-ancient)', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-heading)' }}>
                  Typ Podania do Rozpatrzenia przez Radę Dyrekcji:
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
                      padding: '0.9rem',
                      borderRadius: '6px',
                      border: regRole === 'student' ? '1px solid var(--gold-glow)' : '1px solid rgba(255,255,255,0.08)',
                      background: regRole === 'student' ? 'rgba(197, 159, 78, 0.2)' : 'rgba(8, 12, 18, 0.7)',
                      color: regRole === 'student' ? '#ffffff' : '#9ca3af',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s ease',
                      boxShadow: regRole === 'student' ? '0 0 15px rgba(197, 159, 78, 0.3)' : 'none'
                    }}
                  >
                    <GraduationCap size={24} color={regRole === 'student' ? 'var(--gold-glow)' : '#9ca3af'} style={{ margin: '0 auto 0.3rem' }} />
                    <div style={{ fontSize: '0.92rem', fontWeight: 800 }}>Podanie Adepta (Uczeń Cytadeli)</div>
                    <div style={{ fontSize: '0.72rem', color: '#cbd5e1', marginTop: '0.15rem' }}>Ekwipunek, różdżka, chowaniec i ceremonia</div>
                  </button>

                  {/* Professor */}
                  <button
                    type="button"
                    onClick={() => {
                      playRuneChime();
                      setRegRole('professor');
                    }}
                    style={{
                      padding: '0.9rem',
                      borderRadius: '6px',
                      border: regRole === 'professor' ? '1px solid #c084fc' : '1px solid rgba(255,255,255,0.08)',
                      background: regRole === 'professor' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(8, 12, 18, 0.7)',
                      color: regRole === 'professor' ? '#ffffff' : '#9ca3af',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s ease',
                      boxShadow: regRole === 'professor' ? '0 0 15px rgba(168, 85, 247, 0.3)' : 'none'
                    }}
                  >
                    <BookOpen size={24} color={regRole === 'professor' ? '#d8b4fe' : '#9ca3af'} style={{ margin: '0 auto 0.3rem' }} />
                    <div style={{ fontSize: '0.92rem', fontWeight: 800 }}>Aplikacja na Katedrę (Profesor)</div>
                    <div style={{ fontSize: '0.72rem', color: '#cbd5e1', marginTop: '0.15rem' }}>Prowadzenie przedmiotu, gabinet i dzienniki</div>
                  </button>
                </div>
              </div>

              {/* 1. SEKCJA: DANE KONTA & LOGOWANIA */}
              <div style={{ background: 'rgba(8, 12, 18, 0.7)', padding: '1.1rem 1.3rem', borderRadius: '6px', border: '1px solid rgba(197, 159, 78, 0.25)', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--gold-glow)', fontWeight: 800, fontFamily: 'var(--font-heading)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Key size={14} /> 1. Dostęp do Księgi Cytadeli (Dane Logowania)
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '0.9rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Login Adepta *</label>
                    <input
                      type="text"
                      required
                      placeholder="np. einar_frost, freja_vane"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      className="gothic-input"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Hasło do Pieczęci *</label>
                    <input
                      type="password"
                      required
                      placeholder="Wpisz hasło..."
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="gothic-input"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>E-mail / Krucza Poczta *</label>
                    <input
                      type="email"
                      required
                      placeholder="np. adept@nordic.no"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="gothic-input"
                    />
                  </div>
                </div>
              </div>

              {/* 2. SEKCJA: TOŻSAMOŚĆ & POCHODZENIE */}
              <div style={{ background: 'rgba(8, 12, 18, 0.7)', padding: '1.1rem 1.3rem', borderRadius: '6px', border: '1px solid rgba(197, 159, 78, 0.25)', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--gold-glow)', fontWeight: 800, fontFamily: 'var(--font-heading)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <User size={14} /> 2. Tożsamość & Metryka Postaci
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 0.8fr 1fr', gap: '0.8rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Imię *</label>
                    <input
                      type="text"
                      required
                      placeholder="np. Einar, Freja, Astrid"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="gothic-input"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Nazwisko / Ród *</label>
                    <input
                      type="text"
                      required
                      placeholder="np. Hällström, Krag, Vane"
                      value={regSurname}
                      onChange={(e) => setRegSurname(e.target.value)}
                      className="gothic-input"
                    />
                  </div>

                  {regRole === 'student' ? (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Wiek (lat)</label>
                      <select value={regAge} onChange={handleAgeChange} className="gothic-select">
                        {CLASS_YEAR_OPTIONS.map(opt => (
                          <option key={opt.age} value={opt.age}>{opt.age} lat</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Tytuł</label>
                      <input
                        type="text"
                        value="Profesor"
                        disabled
                        className="gothic-input"
                      />
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Płeć</label>
                    <select value={regGender} onChange={(e) => setRegGender(e.target.value)} className="gothic-select">
                      <option value="Kobieta">Kobieta</option>
                      <option value="Mężczyzna">Mężczyzna</option>
                      <option value="Inna">Inna / Tajemnicza</option>
                    </select>
                  </div>
                </div>

                {/* Kraina Pochodzenia */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Kraina Pochodzenia / Ród Północy</label>
                  <select value={regOrigin} onChange={(e) => setRegOrigin(e.target.value)} className="gothic-select">
                    {ORIGINS_LIST.map(orig => (
                      <option key={orig} value={orig}>{orig}</option>
                    ))}
                  </select>
                  {regOrigin.includes('Własna') && (
                    <input
                      type="text"
                      placeholder="Wpisz nazwę swojej krainy..."
                      value={regCustomOrigin}
                      onChange={(e) => setRegCustomOrigin(e.target.value)}
                      className="gothic-input"
                      style={{ marginTop: '0.4rem' }}
                    />
                  )}
                </div>
              </div>

              {/* 3. SEKCJA DLA ADEPTA: RÓŻDŻKA & ZAKON & DAR */}
              {regRole === 'student' && (
                <>
                  {/* Różdżka Adepta (4 parametry) */}
                  <div style={{ background: 'rgba(8, 12, 18, 0.7)', padding: '1.1rem 1.3rem', borderRadius: '6px', border: '1px solid rgba(197, 159, 78, 0.25)', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                    <div style={{ fontSize: '0.82rem', color: 'var(--gold-glow)', fontWeight: 800, fontFamily: 'var(--font-heading)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Wand2 size={14} /> 3. Różdżka Adepta (Parametry Magiczne)
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr', gap: '0.9rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Drewno Różdżki</label>
                        <select value={regWandWood} onChange={(e) => setRegWandWood(e.target.value)} className="gothic-select">
                          {WAND_WOODS_LIST.map(w => (
                            <option key={w.name} value={w.name}>{w.name} — {w.desc}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Rdzeń Magiczny</label>
                        <select value={regWandCore} onChange={(e) => setRegWandCore(e.target.value)} className="gothic-select">
                          {WAND_CORES_LIST.map(c => (
                            <option key={c.name} value={c.name}>{c.name} — {c.desc}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Długość</label>
                        <select value={regWandLength} onChange={(e) => setRegWandLength(e.target.value)} className="gothic-select">
                          {WAND_LENGTHS.map(l => (
                            <option key={l} value={l}>{l}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Giętkość</label>
                        <select value={regWandFlex} onChange={(e) => setRegWandFlex(e.target.value)} className="gothic-select">
                          {WAND_FLEXIBILITIES.map(f => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Predyspozycja & Duchy Opiekuńcze */}
                  <div style={{ background: 'rgba(8, 12, 18, 0.7)', padding: '1.1rem 1.3rem', borderRadius: '6px', border: '1px solid rgba(197, 159, 78, 0.25)', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                    <div style={{ fontSize: '0.82rem', color: 'var(--gold-glow)', fontWeight: 800, fontFamily: 'var(--font-heading)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Compass size={14} /> 4. Predyspozycja & Duchy Opiekuńcze
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Główna Predyspozycja Magiczna (Dar)</label>
                      <select value={regMagicTalent} onChange={(e) => setRegMagicTalent(e.target.value)} className="gothic-select">
                        {MAGIC_TALENTS_LIST.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    {/* Patronus & Chowaniec */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Duch Opiekuńczy (Patronus)</label>
                        <input
                          type="text"
                          value={regPatronus}
                          onChange={(e) => setRegPatronus(e.target.value)}
                          placeholder="np. Wilk Polarny, Ryś..."
                          className="gothic-input"
                        />
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.35rem' }}>
                          {PATRONUS_PRESETS.slice(0, 6).map(p => (
                            <button
                              type="button"
                              key={p}
                              onClick={() => setRegPatronus(p)}
                              style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '3px', padding: '0.15rem 0.4rem', fontSize: '0.68rem', color: '#cbd5e1', cursor: 'pointer' }}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Magiczny Towarzysz (Zwierzę)</label>
                        <input
                          type="text"
                          value={regCompanion}
                          onChange={(e) => setRegCompanion(e.target.value)}
                          placeholder="np. Puchacz Śnieżny..."
                          className="gothic-input"
                        />
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.35rem' }}>
                          {COMPANION_PRESETS.slice(0, 6).map(c => (
                            <button
                              type="button"
                              key={c}
                              onClick={() => setRegCompanion(c)}
                              style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '3px', padding: '0.15rem 0.4rem', fontSize: '0.68rem', color: '#cbd5e1', cursor: 'pointer' }}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* 3. SEKCJA DLA PROFESORA: KATEDRA & GABINET */}
              {regRole === 'professor' && (
                <div style={{ background: 'rgba(8, 12, 18, 0.7)', padding: '1.1rem 1.3rem', borderRadius: '6px', border: '1px solid rgba(168, 85, 247, 0.3)', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  <div style={{ fontSize: '0.82rem', color: '#d8b4fe', fontWeight: 800, fontFamily: 'var(--font-heading)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <BookOpen size={14} /> 3. Wybór Katedry & Gabinetu
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: '#d8b4fe', marginBottom: '0.25rem', fontWeight: 700 }}>
                      Katedra Magiczna do zatwierdzenia przez Dyrekcję *
                    </label>
                    <select
                      value={regDepartment}
                      onChange={(e) => setRegDepartment(e.target.value)}
                      className="gothic-select"
                      style={{ fontSize: '0.9rem', padding: '0.65rem 0.9rem' }}
                    >
                      {DEPARTMENTS_LIST.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Gabinet w Cytadeli</label>
                      <input
                        type="text"
                        value={regOffice}
                        onChange={(e) => setRegOffice(e.target.value)}
                        className="gothic-input"
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Specjalizacja Naukowa</label>
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

              {/* 4. SEKCJA: WIZERUNEK, WYGLĄD & HISTORIA */}
              <div style={{ background: 'rgba(8, 12, 18, 0.7)', padding: '1.1rem 1.3rem', borderRadius: '6px', border: '1px solid rgba(197, 159, 78, 0.25)', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--gold-glow)', fontWeight: 800, fontFamily: 'var(--font-heading)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ImageIcon size={14} /> {regRole === 'student' ? '5.' : '4.'} Wizerunek, Rys Fizyczny & Historia (Lore)
                </div>

                {/* Awatary galeria */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>Wybierz Portret Postaci lub podaj własny URL:</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.6rem', marginBottom: '0.6rem' }}>
                    {PRESET_AVATARS.map((av, idx) => (
                      <div
                        key={idx}
                        onClick={() => { playRuneChime(); setRegAvatar(av.url); }}
                        style={{
                          cursor: 'pointer',
                          borderRadius: '6px',
                          border: regAvatar === av.url ? '2px solid var(--gold-ancient)' : '1px solid rgba(255,255,255,0.1)',
                          padding: '0.2rem',
                          background: 'rgba(0,0,0,0.5)',
                          textAlign: 'center',
                          boxShadow: regAvatar === av.url ? '0 0 10px rgba(197, 159, 78, 0.4)' : 'none'
                        }}
                      >
                        <img src={av.url} alt={av.label} style={{ width: '100%', height: '55px', objectFit: 'cover', borderRadius: '4px' }} />
                        <div style={{ fontSize: '0.62rem', color: '#9ca3af', marginTop: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{av.label}</div>
                      </div>
                    ))}
                  </div>
                  <input
                    type="url"
                    placeholder="Własny link do zdjęcia (URL)..."
                    value={regAvatar}
                    onChange={(e) => setRegAvatar(e.target.value)}
                    className="gothic-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Rys Fizyczny & Znaki Szczególne</label>
                    <textarea
                      rows={2}
                      value={regAppearance}
                      onChange={(e) => setRegAppearance(e.target.value)}
                      placeholder="np. Blizna po zaklęciu mrozu, stalowe spojrzenie..."
                      className="gothic-textarea"
                      style={{ minHeight: '55px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Historia & Motywacja (Lore)</label>
                    <textarea
                      rows={2}
                      value={regBackstory}
                      onChange={(e) => setRegBackstory(e.target.value)}
                      placeholder="np. Pochodzi z pradawnego rodu badaczy run..."
                      className="gothic-textarea"
                      style={{ minHeight: '55px' }}
                    />
                  </div>
                </div>
              </div>

              {/* 6. SEKCJA DLA ADEPTA: RYTUAŁ KAMIENIA PRZYSIĘGI (JEDYNA DROGA PRZYDZIAŁU) */}
              {regRole === 'student' && (() => {
                const currentHouseKey = regPreferredHouse || 'ravnheim';
                const currentHouseObj = (HOUSES && HOUSES[currentHouseKey]) || Object.values(HOUSES)[0];
                const currentQ = ceremonyStep >= 1 && ceremonyStep <= CEREMONY_QUESTIONS.length ? CEREMONY_QUESTIONS[ceremonyStep - 1] : null;

                return (
                  <div
                    style={{
                      background: `radial-gradient(circle at 50% 20%, ${currentHouseObj?.colors?.primary || '#1c132e'}44 0%, rgba(8, 12, 18, 0.95) 100%)`,
                      padding: '1.3rem 1.5rem',
                      borderRadius: '8px',
                      border: `2px solid ${ceremonyCompleted ? (currentHouseObj?.colors?.secondary || 'var(--gold-ancient)') : 'rgba(197, 159, 78, 0.4)'}`,
                      boxShadow: `0 8px 25px rgba(0,0,0,0.8), 0 0 20px ${ceremonyCompleted ? (currentHouseObj?.colors?.glow || 'rgba(197, 159, 78, 0.25)') : 'none'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem'
                    }}
                  >
                    {/* Header */}
                    <div style={{ borderBottom: '1px solid rgba(197, 159, 78, 0.25)', paddingBottom: '0.8rem' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--gold-ancient)', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
                        Finał Tworzenia Postaci • Pradawny Kamień Przysięgi
                      </div>
                      <div style={{ fontSize: '1.08rem', color: '#ffffff', fontWeight: 800, fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
                        <Flame size={18} color="var(--gold-glow)" /> 6. Rytuał Przydziału do Zakonu (Próby Kamienia)
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#9ca3af', fontStyle: 'italic', marginTop: '0.25rem' }}>
                        Adept nie wybiera Zakonu samowolnie. To krew, wola i wybory moralne dokonane w 4 próbach wyznaczają Twój dom w Cytadeli.
                      </div>
                    </div>

                    {/* Step 0 & Completed: Official Decree */}
                    {ceremonyStep === 0 && ceremonyCompleted && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '1.2rem', alignItems: 'center', background: 'rgba(0,0,0,0.55)', padding: '1.1rem 1.3rem', borderRadius: '6px', border: `1px solid ${currentHouseObj?.colors?.secondary || 'var(--gold-ancient)'}66` }}>
                          <div
                            style={{
                              width: '64px',
                              height: '64px',
                              borderRadius: '10px',
                              background: currentHouseObj?.colors?.primary || '#1c132e',
                              border: `2px solid ${currentHouseObj?.colors?.secondary || 'var(--gold-ancient)'}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '2.2rem',
                              boxShadow: `0 0 20px ${currentHouseObj?.colors?.glow || 'rgba(197, 159, 78, 0.35)'}`
                            }}
                          >
                            {currentHouseObj?.crestIcon || 'ᚱ'}
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <CheckCircle size={13} color="#22c55e" />
                              <span style={{ fontSize: '0.72rem', color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800 }}>
                                Wyrok Kamienia Przysięgi Dokonany:
                              </span>
                            </div>
                            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-heading)', marginTop: '0.1rem' }}>
                              {currentHouseObj?.fullName || currentHouseObj?.name}
                            </div>
                            <div style={{ fontSize: '0.82rem', color: '#c5cdd9', marginTop: '0.15rem' }}>
                              Zwierzę Herbowe: <strong style={{ color: currentHouseObj?.colors?.secondary || 'var(--gold-ancient)' }}>{currentHouseObj?.symbolAnimal}</strong> • Żywioł: {currentHouseObj?.element}
                            </div>
                            <div style={{ fontSize: '0.76rem', color: '#9ca3af', fontStyle: 'italic', marginTop: '0.25rem' }}>
                              {currentHouseObj?.motto}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              playWandSwoosh();
                              setCeremonyStep(1);
                              setCeremonyAnswers([]);
                              setCeremonyCompleted(false);
                            }}
                            className="btn-durmstrang-secondary"
                            style={{ padding: '0.6rem 1.1rem', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                            title="Przejdź 4 próby Kamienia ponownie"
                          >
                            <RefreshCw size={13} /> Powtórz Rytuał
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 0 & NOT completed: Start Prompt */}
                    {ceremonyStep === 0 && !ceremonyCompleted && (
                      <div style={{ textAlign: 'center', padding: '1.6rem 1rem', background: 'rgba(0,0,0,0.5)', borderRadius: '6px', border: '1px dashed var(--gold-ancient)' }}>
                        <div style={{ fontSize: '1.8rem', color: 'var(--gold-glow)', marginBottom: '0.4rem' }}>
                          ᛞ
                        </div>
                        <div style={{ fontSize: '1.05rem', color: '#ffffff', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                          Przystąp do 4 Prób Kamienia Przysięgi
                        </div>
                        <p style={{ fontSize: '0.82rem', color: '#9ca3af', maxWidth: '520px', margin: '0.4rem auto 1.2rem auto' }}>
                          Kamień Przysięgi musi zważyć Twoją determinację przed wysłaniem podania do Dyrekcji Cytadeli.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            playRuneChime();
                            setCeremonyStep(1);
                            setCeremonyAnswers([]);
                          }}
                          className="btn-durmstrang"
                          style={{ padding: '0.75rem 1.8rem', fontSize: '0.9rem' }}
                        >
                          <Flame size={16} /> Rozpocznij Rytuał 4 Prób
                        </button>
                      </div>
                    )}

                    {/* Step 1..4: Interactive Question Trial */}
                    {ceremonyStep >= 1 && ceremonyStep <= CEREMONY_QUESTIONS.length && currentQ && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', background: 'rgba(5, 8, 14, 0.95)', padding: '1.2rem', borderRadius: '6px', border: '1px solid rgba(197, 159, 78, 0.35)' }}>
                        {/* Progress Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.78rem', color: 'var(--gold-ancient)', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                            {currentQ.title || `Próba ${ceremonyStep} z ${CEREMONY_QUESTIONS.length}`}
                          </span>
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            {CEREMONY_QUESTIONS.map((_, i) => (
                              <div
                                key={i}
                                style={{
                                  width: '26px',
                                  height: '4px',
                                  borderRadius: '2px',
                                  background: i + 1 <= ceremonyStep ? 'var(--gold-ancient)' : 'rgba(255, 255, 255, 0.1)',
                                  boxShadow: i + 1 === ceremonyStep ? '0 0 6px var(--gold-glow)' : 'none'
                                }}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Scenario */}
                        <div style={{ fontSize: '0.95rem', color: '#ffffff', fontStyle: 'italic', fontFamily: 'var(--font-lore)', lineHeight: 1.5 }}>
                          „{currentQ.scenario}”
                        </div>

                        {/* Options */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem' }}>
                          {currentQ.options.map((opt, oIdx) => (
                            <button
                              key={oIdx}
                              type="button"
                              onClick={() => handleSelectCeremonyAnswer(opt.house)}
                              style={{
                                padding: '0.8rem 0.95rem',
                                background: 'rgba(18, 23, 33, 0.85)',
                                border: '1px solid rgba(197, 159, 78, 0.25)',
                                borderRadius: '5px',
                                color: '#e5e7eb',
                                textAlign: 'left',
                                cursor: 'pointer',
                                fontSize: '0.82rem',
                                lineHeight: 1.4,
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.3rem'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(197, 159, 78, 0.18)';
                                e.currentTarget.style.borderColor = 'var(--gold-glow)';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(18, 23, 33, 0.85)';
                                e.currentTarget.style.borderColor = 'rgba(197, 159, 78, 0.25)';
                                e.currentTarget.style.transform = 'translateY(0)';
                              }}
                            >
                              <div style={{ fontWeight: 600, color: '#f3f4f6' }}>{opt.text}</div>
                              {opt.reason && <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontStyle: 'italic' }}>{opt.reason}</div>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Step 5: Revealing Animation */}
                    {ceremonyStep === 5 && (
                      <div style={{ textAlign: 'center', padding: '2.2rem 1rem', background: 'rgba(0,0,0,0.85)', borderRadius: '6px', border: '1px solid var(--gold-glow)' }}>
                        <div className="animate-pulse-glow" style={{ fontSize: '2.8rem', color: 'var(--gold-glow)', marginBottom: '0.5rem' }}>
                          ᛞ
                        </div>
                        <div style={{ fontSize: '1.15rem', color: '#ffffff', fontFamily: 'var(--font-heading)', letterSpacing: '0.1em' }}>
                          KAMIENIE PRZYSIĘGI PRZEMAWIAJĄ...
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#9ca3af', fontStyle: 'italic', marginTop: '0.35rem' }}>
                          Oddechy przodków ważą Twoje wybory. Cienie układają się w święty znak...
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Informative notice */}
              <div style={{ background: 'rgba(197, 159, 78, 0.08)', borderLeft: '3px solid var(--gold-ancient)', padding: '0.75rem 1rem', fontSize: '0.76rem', color: '#cfd7e4', lineHeight: 1.45, borderRadius: '4px' }}>
                📜 Twoje podanie trafi bezpośrednio do <strong>Kancelarii Dyrekcji Cytadeli</strong> w wieży Hrafnhöll. Po zatwierdzeniu przez Arcymistrza otrzymasz oficjalny dekret, a Twoje konto (@{regUsername || 'login'}) zostanie natychmiast odblokowane.
              </div>

              {/* Submit Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '0.2rem' }}>
                <button type="button" onClick={onClose} className="btn-durmstrang-secondary">
                  Anuluj
                </button>
                <button type="submit" className="btn-durmstrang" style={{ padding: '0.65rem 1.8rem', fontSize: '0.92rem' }}>
                  <Sparkles size={16} /> Złóż Podanie do Dyrekcji
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
