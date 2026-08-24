import React, { useState, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import {
  Scroll,
  Shield,
  Award,
  BookOpen,
  Scale,
  Coins,
  Flame,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  Search,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Zap,
  Users,
  Compass,
  Lock
} from 'lucide-react';

export const RulesGuideView = () => {
  const { setActiveView, showNotification, currentUser, setAuthModalOpen } = useSchool();
  const { playWandSwoosh, playRuneChime } = useSound();

  const [activeTab, setActiveTab] = useState('pact'); // 'pact' | 'points' | 'grading' | 'economy' | 'runes' | 'hierarchy' | 'faq'
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState({});

  // Sync sub-hash if present e.g. #/zasady/punktacja
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('/zasady/') || hash.includes('/regulamin/') || hash.includes('/kodeks/')) {
      const sub = hash.split('/')[2];
      if (['pact', 'points', 'grading', 'economy', 'runes', 'hierarchy', 'faq'].includes(sub)) {
        setActiveTab(sub);
      }
    }
  }, []);

  const handleTabChange = (tabId) => {
    playWandSwoosh();
    setActiveTab(tabId);
    window.location.hash = `#/zasady/${tabId}`;
  };

  const copySectionLink = (tabId) => {
    playRuneChime();
    const url = `${window.location.origin}${window.location.pathname}#/zasady/${tabId}`;
    navigator.clipboard.writeText(url);
    showNotification('Skopiowano Odnośnik', 'Bezpośredni link do tej sekcji kodeksu został skopiowany do schowka.', 'info');
  };

  const toggleFaq = (idx) => {
    playWandSwoosh();
    setExpandedFaq(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const FAQ_ITEMS = [
    {
      q: 'Jak dołączyć do lekcji na żywo w Cytadeli?',
      a: 'Lekcje odbywają się na oficjalnym serwerze Discord Cytadeli w wyznaczonych komnatach wykładowych zgodnie z Planem Lekcji. Po zakończeniu zajęć profesor wprowadza oficjalny wpis do Dziennika na portalu WWW, gdzie adept otrzymuje punkty, XP oraz ocenę.',
      category: 'lekcje'
    },
    {
      q: 'Jak zdobyć przydział do jednego z Czterech Zakonów?',
      a: 'Po stworzeniu karty postaci i jej zatwierdzeniu przez Dyrekcję, przejdź do zakładki "Ceremonia Przydziału". Odpowiedzi na pytania przed Kamieniem Przysięgi zbadają Twoją naturę i przypiszą Cię do Zakonu Renifera, Niedźwiedzia, Kruka lub Wydry.',
      category: 'zakony'
    },
    {
      q: 'Co oznaczają oceny w Dzienniku (Troll, Zadowalający, Wybitny)?',
      a: 'Stosujemy tradycyjną 5-stopniową skalę: Wybitny (W), Powyżej Oczekiwań (P), Zadowalający (Z), Nędzny (N), Okropny (O), Troll (T). Oceny wpływają na Twoją średnią roczną, nagrody stypendialne w Banku Skirnirów oraz awans do Klasy II.',
      category: 'oceny'
    },
    {
      q: 'Jak działa waluta (Szylingi i Korony) i jak je zarobić?',
      a: 'Szylingi i Korony to waluta Północy. Zdobywasz je za aktywność na lekcjach, rozwiązywanie zadań w dzienniku, udział w wydarzeniach, wyprawach i turniejach Hnefatafl. Możesz nimi płacić na Rynku Kaupangr lub inwestować na lokacie w Banku Skirnirów.',
      category: 'ekonomia'
    },
    {
      q: 'Czym jest Warsztat Runiczny (Galdrastofa)?',
      a: 'To laboratorium prastarej magii Północy, w którym łączysz runy Starszego Futharku (np. Fehu, Uruz, Ansuz, Tiwaz) w potężne formuły runiczne oraz warzysz eliksiry w Kotle Alchemii. Udane formuły nagradzane są punktami i unikalnymi esencjami.',
      category: 'runy'
    },
    {
      q: 'Czy wolno używać Czarnej Magii i Zakazanych Klątw?',
      a: 'W Cytadeli Durmstrang nauka Czarnej Magii oraz Obrony przed Ciemnymi Mocami jest elementem oficjalnego programu nauczania. Zakazane jest jednak bezprawne atakowanie innych adeptów poza Salą Pojedynków oraz łamanie Paktu z 1294 roku.',
      category: 'kodeks'
    },
    {
      q: 'Jakie aliasy i bezpośrednie linki działają na stronie?',
      a: 'Możesz przejść bezpośrednio do dowolnej podstrony używając pasków adresu URL: #/zasady, #/plan, #/dzienniki, #/domy, #/przedmioty, #/bank, #/rynek, #/mapa, #/warsztat, #/lore, #/profil i wielu innych.',
      category: 'portal'
    }
  ];

  const filteredFaq = FAQ_ITEMS.filter(item =>
    !searchQuery ||
    item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.a.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* =========================================================================
          HEADER SECTION WITH NORTHERN SEAL
          ========================================================================= */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(14, 18, 26, 0.95), rgba(8, 10, 15, 0.98))',
          border: '1px solid rgba(197, 159, 78, 0.3)',
          borderRadius: '12px',
          padding: '2.2rem 2.5rem',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 15px 35px rgba(0, 0, 0, 0.6), inset 0 0 30px rgba(197, 159, 78, 0.05)'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            fontSize: '12rem',
            color: 'rgba(197, 159, 78, 0.04)',
            fontFamily: 'var(--font-nordic)',
            userSelect: 'none',
            pointerEvents: 'none'
          }}
        >
          ᛞ
        </div>

        <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
              <span style={{ color: 'var(--gold-ancient)', fontSize: '1.4rem' }}>ᛞ</span>
              <span style={{ color: 'var(--gold-ancient)', fontSize: '0.85rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
                Najwyższa Rada Mistrzów Twierdzy Magii Durmstrang (TMD)
              </span>
            </div>
            <h1 style={{ fontSize: '2.4rem', color: '#ffffff', fontFamily: 'var(--font-heading)', margin: '0 0 0.8rem 0' }}>
              Kodeks, Zasady & Przewodnik Adepta
            </h1>
            <p style={{ color: '#9ca3af', maxWidth: '780px', fontSize: '1rem', lineHeight: 1.6, margin: 0 }}>
              Zbiór nienaruszalnych praw Paktu z 1294 roku, taryfikator punktów Pucharu Północy, zasady oceniania w Dzienniku Lekcyjnym oraz oficjalny przewodnik po życiu w murach Twierdzy Magii.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
            <button
              onClick={() => copySectionLink(activeTab)}
              style={{
                padding: '0.6rem 1.1rem',
                background: 'rgba(197, 159, 78, 0.12)',
                border: '1px solid var(--gold-ancient)',
                borderRadius: '6px',
                color: 'var(--gold-ancient)',
                fontSize: '0.82rem',
                fontFamily: 'var(--font-heading)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s'
              }}
            >
              <Copy size={15} /> Kopiuj Link do Sekcji
            </button>
          </div>
        </div>

        {/* Global Live Search Bar for Rules */}
        <div style={{ marginTop: '1.8rem', position: 'relative' }}>
          <Search size={18} color="var(--gold-ancient)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Szukaj w kodeksie, taryfikatorze, zasadach oceniania, eliksirach lub FAQ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.85rem 1rem 0.85rem 2.8rem',
              background: 'rgba(5, 7, 10, 0.8)',
              border: '1px solid rgba(197, 159, 78, 0.3)',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '0.92rem',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
          />
        </div>
      </div>

      {/* =========================================================================
          NAVIGATION TABS
          ========================================================================= */}
      <div
        style={{
          display: 'flex',
          gap: '0.6rem',
          borderBottom: '1px solid rgba(197, 159, 78, 0.2)',
          paddingBottom: '0.6rem',
          flexWrap: 'wrap'
        }}
      >
        {[
          { id: 'pact', label: 'Pakt z 1294 & Kodeks', icon: Scroll },
          { id: 'points', label: 'Puchar Północy & Taryfikator', icon: Award },
          { id: 'grading', label: 'Lekcje & Ocenianie', icon: BookOpen },
          { id: 'economy', label: 'Ekonomia & Bank Skirnirów', icon: Coins },
          { id: 'runes', label: 'Magia Runiczna & Galdrastofa', icon: Flame },
          { id: 'hierarchy', label: 'Hierarchia & Stopnie', icon: Shield },
          { id: 'faq', label: 'FAQ / Pytania i Odpowiedzi', icon: HelpCircle }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              style={{
                padding: '0.7rem 1.2rem',
                background: isActive ? 'rgba(197, 159, 78, 0.18)' : 'rgba(12, 16, 24, 0.6)',
                border: isActive ? '1px solid var(--gold-ancient)' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '6px',
                color: isActive ? '#ffffff' : '#9ca3af',
                fontFamily: 'var(--font-heading)',
                fontSize: '0.88rem',
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? '0 0 15px rgba(197, 159, 78, 0.15)' : 'none'
              }}
            >
              <Icon size={16} color={isActive ? 'var(--gold-ancient)' : '#9ca3af'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          TAB 1: PAKT Z 1294 & KODEKS HONOROWY
          ========================================================================= */}
      {activeTab === 'pact' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div
            style={{
              background: 'rgba(14, 18, 26, 0.75)',
              border: '1px solid rgba(197, 159, 78, 0.25)',
              borderRadius: '10px',
              padding: '2.5rem',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.2rem' }}>
              <Scale size={24} color="var(--gold-ancient)" />
              <h2 style={{ color: '#ffffff', fontFamily: 'var(--font-heading)', fontSize: '1.6rem', margin: 0 }}>
                Pakt z 1294 roku — Fundament Prawa Twierdzy Magii
              </h2>
            </div>
            <p style={{ color: '#d1d5db', fontSize: '0.98rem', lineHeight: 1.8, marginBottom: '1.8rem' }}>
              Wstępując w progi Twierdzy Magii Durmstrang (TMD), każdy adept, mistrz i profesor składa nienaruszalną przysięgę krwi przed Kamieniem Przysięgi.
              Poniższe artykuły stanowią niezmienne prawo Północy, którego złamanie skutkuje natychmiastowym procesem przed Radą Mistrzów.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.2rem' }}>
              {[
                {
                  nr: 'Art. I',
                  title: 'Tajemnica Położenia Twierdzy',
                  text: 'Twierdza Magii Durmstrang (TMD) pozostaje niewidoczna dla oczu świata zewnętrznego. Zdradzenie jej dokładnych koordynatów, użycie magii lokalizacyjnej poza murami lub wprowadzenie osób nieuprawnionych stanowi zdradę stanu.'
                },
                {
                  nr: 'Art. II',
                  title: 'Dyscyplina i Szacunek dla Wiedzy',
                  text: 'Wiedza jest najpotężniejszą bronią Północy. Żadna dziedzina magii – w tym Czarna Magia, Nekromancja czy Starożytne Runy – nie jest zakazana do zgłębiania, lecz jej użycie podlega absolutnej dyscyplinie i kontroli mistrzów.'
                },
                {
                  nr: 'Art. III',
                  title: 'Świętość Pojedynku Honorowego',
                  text: 'Spory między adeptami mogą być rozstrzygane wyłącznie w Sali Pojedynków (Hólmganga) w obecności sędziego lub profesora. Rzucanie uroków w korytarzach, komnatach wspólnych i refektarzu grozi degradacją punktową.'
                },
                {
                  nr: 'Art. IV',
                  title: 'Wierność Swojemu Zakonowi',
                  text: 'Każdy uczeń przynależy do jednego z Czterech Zakonów (Renifer, Niedźwiedź, Kruk, Wydra). Działanie na szkodę własnego Zakonu lub kradzież relikwii z Komnaty Wspólnej innego Zakonu wiąże się z karą chłosty runicznej.'
                },
                {
                  nr: 'Art. V',
                  title: 'Obowiązek Akademicki i Obecności',
                  text: 'Adept ma obowiązek regularnego uczestnictwa w zajęciach, składania prac domowych w Dzienniku oraz godnego reprezentowania Twierdzy Magii w zmaganiach Pucharu Północy.'
                }
              ].map((art, i) => (
                <div
                  key={i}
                  style={{
                    background: 'rgba(8, 11, 16, 0.7)',
                    border: '1px solid rgba(197, 159, 78, 0.15)',
                    borderRadius: '8px',
                    padding: '1.4rem',
                    display: 'flex',
                    gap: '1.2rem'
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-heading)',
                      color: 'var(--gold-ancient)',
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {art.nr}
                  </div>
                  <div>
                    <h4 style={{ color: '#ffffff', margin: '0 0 0.4rem 0', fontSize: '1.05rem' }}>{art.title}</h4>
                    <p style={{ color: '#9ca3af', margin: 0, fontSize: '0.92rem', lineHeight: 1.6 }}>{art.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: PUCHAR PÓŁNOCY & TARYFIKATOR PUNKTÓW
          ========================================================================= */}
      {activeTab === 'points' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div
            style={{
              background: 'rgba(14, 18, 26, 0.75)',
              border: '1px solid rgba(197, 159, 78, 0.25)',
              borderRadius: '10px',
              padding: '2.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.2rem' }}>
              <Award size={24} color="var(--gold-ancient)" />
              <h2 style={{ color: '#ffffff', fontFamily: 'var(--font-heading)', fontSize: '1.6rem', margin: 0 }}>
                Puchar Północy — Oficjalny Taryfikator Punktowy
              </h2>
            </div>
            <p style={{ color: '#d1d5db', fontSize: '0.98rem', lineHeight: 1.8, marginBottom: '2rem' }}>
              Puchar Północy to odwieczna rywalizacja Czterech Zakonów. Punkty przyznawane są przez Profesorów i Dyrekcję za wybitne osiągnięcia naukowe, aktywność na lekcjach oraz turnieje.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {/* Rewards Table */}
              <div
                style={{
                  background: 'rgba(8, 11, 16, 0.8)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '8px',
                  padding: '1.5rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#10b981' }}>
                  <CheckCircle size={18} />
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontFamily: 'var(--font-heading)' }}>Nagrody Punktowe (+)</h3>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {[
                    { action: 'Obecność i aktywność na lekcji Discord', pts: '+5 do +15 pkt' },
                    { action: 'Wybitna odpowiedź / rzucenie zaklęcia', pts: '+10 do +25 pkt' },
                    { action: 'Wzorowe zadanie domowe w Dzienniku', pts: '+20 do +40 pkt' },
                    { action: 'Zwycięstwo w oficjalnym pojedynku', pts: '+30 pkt' },
                    { action: 'Odkrycie prastarej runy lub sekretu', pts: '+15 do +50 pkt' },
                    { action: 'Zwycięstwo w Turnieju Północy', pts: '+100 pkt' }
                  ].map((item, idx) => (
                    <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                      <span style={{ color: '#d1d5db', fontSize: '0.9rem' }}>{item.action}</span>
                      <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'var(--font-heading)' }}>{item.pts}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Penalties Table */}
              <div
                style={{
                  background: 'rgba(8, 11, 16, 0.8)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '1.5rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#ef4444' }}>
                  <AlertTriangle size={18} />
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontFamily: 'var(--font-heading)' }}>Kary Punktowe (-)</h3>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {[
                    { action: 'Nieusprawiedliwione spóźnienie na lekcję', pts: '-5 pkt' },
                    { action: 'Przeszkadzanie w trakcie wykładu', pts: '-10 pkt' },
                    { action: 'Brak zadania domowego w terminie', pts: '-15 pkt' },
                    { action: 'Nielegalny pojedynek poza salą ćwiczeń', pts: '-25 pkt' },
                    { action: 'Przebywanie w Zakazanej Sekcji nocą', pts: '-40 pkt' },
                    { action: 'Złamanie Paktu z 1294 roku', pts: '-100 pkt + Sąd' }
                  ].map((item, idx) => (
                    <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                      <span style={{ color: '#d1d5db', fontSize: '0.9rem' }}>{item.action}</span>
                      <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'var(--font-heading)' }}>{item.pts}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: ZASADY LEKCJI, DZIENNIKÓW & OCENIANIA
          ========================================================================= */}
      {activeTab === 'grading' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div
            style={{
              background: 'rgba(14, 18, 26, 0.75)',
              border: '1px solid rgba(197, 159, 78, 0.25)',
              borderRadius: '10px',
              padding: '2.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.2rem' }}>
              <BookOpen size={24} color="var(--gold-ancient)" />
              <h2 style={{ color: '#ffffff', fontFamily: 'var(--font-heading)', fontSize: '1.6rem', margin: 0 }}>
                Skala Ocen & Zasady Dziennika Lekcyjnego
              </h2>
            </div>
            <p style={{ color: '#d1d5db', fontSize: '0.98rem', lineHeight: 1.8, marginBottom: '2rem' }}>
              Dziennik Lekcyjny Cytadeli rejestruje każdy wykład przeprowadzony na Discordzie lub w komnacie portalu. Oceny wystawiane są na koniec zajęć i zapisywane w Wiecznej Księdze Ucznia.
            </p>

            {/* Grading Scale Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {[
                { grade: 'Wybitny (W)', desc: 'Perfekcyjne opanowanie zaklęcia, bezbłędny pergamin, innowacyjne podejście do magii.', color: '#10b981', symbol: 'ᚠ' },
                { grade: 'Powyżej Oczekiwań (P)', desc: 'Bardzo dobra technika, wysoka aktywność, drobne niedociągnięcia w teorii.', color: '#3b82f6', symbol: 'ᚢ' },
                { grade: 'Zadowalający (Z)', desc: 'Poprawne wykonanie podstawowych formuł, zaliczone zadanie w normie.', color: '#f59e0b', symbol: 'ᚦ' },
                { grade: 'Nędzny (N)', desc: 'Braki w wiedzy teoretycznej, niestabilne rzucenie run, konieczność poprawki.', color: '#f97316', symbol: 'ᚱ' },
                { grade: 'Troll (T)', desc: 'Całkowity brak przygotowania, zagrożenie dla bezpieczeństwa sali lekcyjnej.', color: '#ef4444', symbol: 'ᚲ' }
              ].map((g, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(8, 11, 16, 0.85)',
                    border: `1px solid ${g.color}`,
                    borderRadius: '8px',
                    padding: '1.2rem',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h4 style={{ color: g.color, margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1rem' }}>{g.grade}</h4>
                    <span style={{ fontSize: '1.2rem', color: g.color }}>{g.symbol}</span>
                  </div>
                  <p style={{ color: '#9ca3af', margin: 0, fontSize: '0.84rem', lineHeight: 1.5 }}>{g.desc}</p>
                </div>
              ))}
            </div>

            <div style={{ background: 'rgba(8, 11, 16, 0.6)', border: '1px solid rgba(197, 159, 78, 0.2)', borderRadius: '8px', padding: '1.5rem' }}>
              <h3 style={{ color: 'var(--gold-ancient)', margin: '0 0 0.8rem 0', fontSize: '1.15rem' }}>Jak czytać zapisy z lekcji i transkrypcje Discorda?</h3>
              <p style={{ color: '#d1d5db', fontSize: '0.92rem', lineHeight: 1.6, margin: 0 }}>
                W zakładce <strong style={{ color: '#ffffff' }}>Dzienniki Lekcyjne</strong> znajdziesz listę wszystkich lekcji. Kliknięcie w daną lekcję pozwala przejść do pełnego zapisu: tematu, podsumowania profesora, przyznanych punktów oraz symulatora/transkrypcji wypowiedzi z Discorda.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: SYSTEM EKONOMICZNY & BANK SKIRNIRÓW
          ========================================================================= */}
      {activeTab === 'economy' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div
            style={{
              background: 'rgba(14, 18, 26, 0.75)',
              border: '1px solid rgba(197, 159, 78, 0.25)',
              borderRadius: '10px',
              padding: '2.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.2rem' }}>
              <Coins size={24} color="var(--gold-ancient)" />
              <h2 style={{ color: '#ffffff', fontFamily: 'var(--font-heading)', fontSize: '1.6rem', margin: 0 }}>
                System Finansowy: Bank Skirnirów & Rynek Kaupangr
              </h2>
            </div>
            <p style={{ color: '#d1d5db', fontSize: '0.98rem', lineHeight: 1.8, marginBottom: '2rem' }}>
              Gospodarka Cytadeli opiera się na srebrnych Szylingach oraz złotych Koronach Skandzy. Nad bezpieczeństwem depozytów czuwają Skirnirowie — prastare karły bankierskie.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              <div style={{ background: 'rgba(8, 11, 16, 0.8)', border: '1px solid rgba(197, 159, 78, 0.2)', borderRadius: '8px', padding: '1.5rem' }}>
                <h3 style={{ color: 'var(--gold-ancient)', margin: '0 0 0.8rem 0' }}>🪙 Waluty i Przelicznik</h3>
                <p style={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  • <strong style={{ color: '#ffffff' }}>1 Korona Złota = 100 Szylingów Srebra</strong><br />
                  • Szylingi służą do codziennych zakupów pergaminów, składników w Kaupangr i biletów na pocztę.<br />
                  • Korony Złote są nagrodą za wybitne osiągnięcia i służą do nabywania rzadkich artefaktów.
                </p>
              </div>

              <div style={{ background: 'rgba(8, 11, 16, 0.8)', border: '1px solid rgba(197, 159, 78, 0.2)', borderRadius: '8px', padding: '1.5rem' }}>
                <h3 style={{ color: 'var(--gold-ancient)', margin: '0 0 0.8rem 0' }}>🏦 Usługi Bankowe</h3>
                <p style={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  • Każdy adept otrzymuje indywidualne konto bankowe po rejestracji.<br />
                  • Możliwość przelewów międzyuczniowskich oraz stypendiów od Zakonów.<br />
                  • Skarbiec Skirnirów oferuje bezpieczne depozyty i opcjonalne lokaty runiczne.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: MAGIA RUNICZNA & GALDRASTOFA
          ========================================================================= */}
      {activeTab === 'runes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div
            style={{
              background: 'rgba(14, 18, 26, 0.75)',
              border: '1px solid rgba(197, 159, 78, 0.25)',
              borderRadius: '10px',
              padding: '2.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.2rem' }}>
              <Flame size={24} color="var(--gold-ancient)" />
              <h2 style={{ color: '#ffffff', fontFamily: 'var(--font-heading)', fontSize: '1.6rem', margin: 0 }}>
                Zasady Warsztatu Runicznego (Galdrastofa)
              </h2>
            </div>
            <p style={{ color: '#d1d5db', fontSize: '0.98rem', lineHeight: 1.8, marginBottom: '2rem' }}>
              Magia Runiczna wymaga precyzji i skupienia. Łączenie znaków Starszego Futharku tworzy potężne inkantacje ochronne, bitewne oraz alchemiczne.
            </p>

            <div style={{ background: 'rgba(8, 11, 16, 0.8)', border: '1px solid rgba(197, 159, 78, 0.2)', borderRadius: '8px', padding: '1.5rem' }}>
              <h3 style={{ color: 'var(--gold-ancient)', margin: '0 0 0.8rem 0' }}>Kluczowe Reguły Pracy z Runami:</h3>
              <ul style={{ color: '#d1d5db', fontSize: '0.92rem', lineHeight: 1.8, paddingLeft: '1.2rem' }}>
                <li>Nie łącz przeciwstawnych żywiołów (np. Ognia Kaunan z Lodem Isa) bez stabilizatora runy Algiz.</li>
                <li>Każda udana formuła zapisywana jest w Twoim Osobistym Grimuarze i zwiększa poziom mistrzostwa runicznego.</li>
                <li>Kocioł Alchemii w Galdrastofie wymaga posiadania odpowiednich składników z Rynku Kaupangr.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: HIERARCHIA & STOPNIE
          ========================================================================= */}
      {activeTab === 'hierarchy' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div
            style={{
              background: 'rgba(14, 18, 26, 0.75)',
              border: '1px solid rgba(197, 159, 78, 0.25)',
              borderRadius: '10px',
              padding: '2.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.2rem' }}>
              <Shield size={24} color="var(--gold-ancient)" />
              <h2 style={{ color: '#ffffff', fontFamily: 'var(--font-heading)', fontSize: '1.6rem', margin: 0 }}>
                Hierarchia i Stopnie w Twierdzy Magii Durmstrang (TMD)
              </h2>
            </div>
            <p style={{ color: '#d1d5db', fontSize: '0.98rem', lineHeight: 1.8, marginBottom: '2rem' }}>
              Struktura szkoły jest ściśle zhierarchizowana, kładąc nacisk na zasługi, wyniki w nauce i dyscyplinę.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { title: 'Adept Klasy I', desc: 'Nowo przyjęty uczeń, który przeszedł Ceremonię Przydziału. Poznaje podstawy magii Północy.' },
                { title: 'Adept Klasy II', desc: 'Uczeń po zdaniu egzaminów rocznych. Uzyskuje dostęp do zaawansowanych traktatów i pojedynków.' },
                { title: 'Prefekt Zakonu', desc: 'Wybitny adept reprezentujący swój Zakon, odpowiedzialny za dyscyplinę młodszych roczników.' },
                { title: 'Profesor Katedry', desc: 'Mistrz danej dziedziny magii prowadzący wykłady, oceniający prace i zarządzający dziennikiem.' },
                { title: 'Arcymistrz Dyrekcji', desc: 'Najwyższa władza Twierdzy sprawująca pieczę nad Paktem z 1294 roku oraz Radą Mistrzów.' }
              ].map((role, i) => (
                <div
                  key={i}
                  style={{
                    background: 'rgba(8, 11, 16, 0.7)',
                    border: '1px solid rgba(197, 159, 78, 0.15)',
                    borderRadius: '8px',
                    padding: '1.2rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.2rem'
                  }}
                >
                  <span style={{ fontSize: '1.4rem', color: 'var(--gold-ancient)' }}>ᛉ</span>
                  <div>
                    <h4 style={{ color: '#ffffff', margin: '0 0 0.3rem 0', fontSize: '1.05rem' }}>{role.title}</h4>
                    <p style={{ color: '#9ca3af', margin: 0, fontSize: '0.9rem' }}>{role.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: '2rem',
                padding: '1.5rem',
                background: 'linear-gradient(135deg, rgba(197, 159, 78, 0.15) 0%, rgba(14, 18, 26, 0.8) 100%)',
                border: '1px solid var(--gold-ancient)',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
              }}
            >
              <div>
                <h4 style={{ margin: '0 0 0.3rem 0', color: '#ffffff', fontSize: '1.1rem', fontFamily: 'var(--font-heading)' }}>
                  Szczegółowy Podział Obowiązków & Rejestr Kompetencji
                </h4>
                <p style={{ margin: 0, color: '#d1d5db', fontSize: '0.9rem' }}>
                  Sprawdź pełny kodeks odpowiedzialności: za co odpowiada Arcymistrz, Mistrz Straży, Dziekanat, Opiekunowie Zakonów oraz Skarbnik.
                </p>
              </div>

              <button
                onClick={() => {
                  playWandSwoosh();
                  setActiveView('documents');
                  window.location.hash = '#/wladze';
                }}
                style={{
                  padding: '0.7rem 1.4rem',
                  background: 'var(--gold-ancient)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#000000',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  fontFamily: 'var(--font-heading)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 15px rgba(197, 159, 78, 0.35)'
                }}
              >
                <span>Otwórz Obowiązki Władz</span>
                <ExternalLink size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 7: FAQ / NAJCZĘŚCIEJ ZADAWANE PYTANIA
          ========================================================================= */}
      {activeTab === 'faq' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div
            style={{
              background: 'rgba(14, 18, 26, 0.75)',
              border: '1px solid rgba(197, 159, 78, 0.25)',
              borderRadius: '10px',
              padding: '2.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.2rem' }}>
              <HelpCircle size={24} color="var(--gold-ancient)" />
              <h2 style={{ color: '#ffffff', fontFamily: 'var(--font-heading)', fontSize: '1.6rem', margin: 0 }}>
                Często Zadawane Pytania (FAQ)
              </h2>
            </div>
            <p style={{ color: '#d1d5db', fontSize: '0.98rem', lineHeight: 1.8, marginBottom: '2rem' }}>
              Odpowiedzi na najważniejsze pytania dotyczące funkcjonowania portalu, Dziennika Lekcyjnego, linków bezpośrednich oraz życia w Cytadeli.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {filteredFaq.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
                  Nie znaleziono pytań pasujących do wpisanej frazy: "{searchQuery}".
                </div>
              ) : (
                filteredFaq.map((item, idx) => {
                  const isExpanded = expandedFaq[idx] || (searchQuery.length > 0);
                  return (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(8, 11, 16, 0.85)',
                        border: isExpanded ? '1px solid var(--gold-ancient)' : '1px solid rgba(197, 159, 78, 0.15)',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        transition: 'all 0.2s'
                      }}
                    >
                      <button
                        onClick={() => toggleFaq(idx)}
                        style={{
                          width: '100%',
                          padding: '1.2rem 1.5rem',
                          background: 'transparent',
                          border: 'none',
                          color: '#ffffff',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontFamily: 'var(--font-heading)',
                          fontSize: '1rem',
                          fontWeight: 600
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ color: 'var(--gold-ancient)' }}>•</span>
                          {item.q}
                        </span>
                        {isExpanded ? <ChevronUp size={18} color="var(--gold-ancient)" /> : <ChevronDown size={18} color="#9ca3af" />}
                      </button>
                      {isExpanded && (
                        <div
                          style={{
                            padding: '0 1.5rem 1.4rem 1.5rem',
                            color: '#9ca3af',
                            fontSize: '0.94rem',
                            lineHeight: 1.7,
                            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                            paddingTop: '1rem'
                          }}
                        >
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
