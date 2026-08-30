import React, { useState, useEffect, useRef } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import {
  Search,
  Compass,
  BookOpen,
  Shield,
  Coins,
  ShoppingBag,
  Flame,
  Swords,
  Scroll,
  Sparkles,
  MapPin,
  Mail,
  User,
  Settings,
  Calendar,
  Zap,
  Volume2,
  VolumeX,
  Droplets,
  Eye,
  Crown,
  Key,
  X,
  ArrowRight,
  CornerDownLeft,
  Gamepad2,
  Scale,
  MessageSquare,
  Map,
  ShieldAlert,
  ClipboardCheck,
  Newspaper,
  Feather
} from 'lucide-react';

export const CommandPaletteModal = ({ isOpen, onClose }) => {
  const {
    setActiveView,
    setActiveHouseTab,
    setActiveSubjectId,
    setActiveLessonId,
    subjects,
    houses,
    currentUser,
    switchUser,
    users,
    showNotification
  } = useSchool();

  const {
    soundEnabled,
    setSoundEnabled,
    setAmbientTrack,
    playWandSwoosh,
    playRuneChime,
    playSortingFanfare,
    playCoinSound
  } = useSound();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle global shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          playRuneChime();
          // Handled via external state
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, playRuneChime]);

  // Base list of navigable portal items & actions
  const ALL_ITEMS = [
    // 1. Podstawowe Komnaty i Widoki
    { id: 'v-home', type: 'view', view: 'home', title: 'Komnata Główna Twierdzy (Start)', desc: 'Aktualności, dekrety Dyrekcji, turnieje i puchar', icon: Sparkles, color: 'var(--gold-ancient)', category: 'Komnaty' },
    { id: 'v-journals', type: 'view', view: 'journals', title: 'Dzienniki Lekcyjne & Wpisy Discord', desc: 'Archiwum lekcji, punkty, frekwencja i relacje', icon: BookOpen, color: '#38bdf8', category: 'Nauka' },
    { id: 'v-timetable', type: 'view', view: 'timetable', title: 'Plan Lekcji & Harmonogram', desc: 'Siatka zajęć, zastępstwa i sale wykładowe', icon: Calendar, color: '#a855f7', category: 'Nauka' },
    { id: 'v-academic', type: 'view', view: 'academic', title: 'Katedry & Oferta Edukacyjna', desc: 'Lista wszystkich 21 przedmiotów i profesorów', icon: Scroll, color: '#eab308', category: 'Nauka' },
    { id: 'v-houses', type: 'view', view: 'houses', title: 'Cztery Zakony Durmstrangu', desc: 'Reinhall, Björnhall, Ravnheim, Otergard i Klepsydry', icon: Shield, color: '#ef4444', category: 'Zakony' },
    { id: 'v-ceremony', type: 'view', view: 'ceremony', title: 'Ceremonia Przydziału do Zakonu', desc: 'Kamień Przysięgi i 7 prób charakteru', icon: Flame, color: '#f97316', category: 'Zakony' },
    { id: 'v-workshop', type: 'view', view: 'rune-workshop', title: 'Warsztat Runiczny (Galdrastofa)', desc: 'Ołtarz Futharku, kucie formuł i kocioł alchemiczny', icon: Zap, color: '#2dd4bf', category: 'Aktywności RPG' },
    { id: 'v-markethall', type: 'view', view: 'markethall', title: 'Rynek Magiczny Kaupangr', desc: 'Kramy z różdżkami, grimuary, szaty i wyprawki', icon: ShoppingBag, color: '#10b981', category: 'Ekonomia' },
    { id: 'v-bank', type: 'view', view: 'bank', title: 'Bank Skirnirów (Skírnisbanki)', desc: 'Skarbiec, przelewy, historia transakcji i pensje', icon: Coins, color: 'var(--gold-ancient)', category: 'Ekonomia' },
    { id: 'v-map', type: 'view', view: 'map', title: 'Interaktywna Mapa Twierdzy (TMD)', desc: 'Karty lokacji, sekrety i wyprawy', icon: MapPin, color: '#06b6d4', category: 'Eksploracja' },
    { id: 'v-lore', type: 'view', view: 'lore', title: 'Kroniki Północy & Bestiariusz', desc: 'Historia Twierdzy, Pakt 1294 i mityczne istoty', icon: Eye, color: '#c084fc', category: 'Wiedza' },
    { id: 'v-rules', type: 'view', view: 'rules-guide', title: 'Kodeks, Regulamin & Zasady', desc: 'Taryfikator punktów, system oceniania i FAQ', icon: Scroll, color: '#94a3b8', category: 'Wiedza' },
    { id: 'v-documents', type: 'view', view: 'documents', title: 'Księga Dekretów, Wizytacji & Statutu', desc: 'Oficjalne edykty Dyrekcji, regulamin Discorda, statut i opis zabaw', icon: Shield, color: 'var(--gold-ancient)', category: 'Dokumenty' },
    { id: 'v-wladze', type: 'action', action: () => { setActiveView('documents'); window.location.hash = '#/wladze'; }, title: 'Obowiązki Władz Twierdzy (Kto Za Co Odpowiada)', desc: 'Matryca kompetencji, zadania Dyrekcji, Opiekunów Zakonów i Strażników', icon: Crown, color: '#f59e0b', category: 'Dokumenty' },
    { id: 'v-dekrety', type: 'action', action: () => { setActiveView('documents'); window.location.hash = '#/dekrety'; }, title: 'Dekrety Władz & Rozporządzenia', desc: 'Nienaruszalne edykty i obostrzenia prawa szkolnego', icon: ShieldAlert, color: '#ef4444', category: 'Dokumenty' },
    { id: 'v-wizytacje', type: 'action', action: () => { setActiveView('documents'); window.location.hash = '#/wizytacje'; }, title: 'Wizytacje Nauczycieli & Hospitacje', desc: 'Protokoły kontroli zajęć, oceny katedr i standardy wykładowców', icon: ClipboardCheck, color: '#38bdf8', category: 'Dokumenty' },
    { id: 'v-statut', type: 'action', action: () => { setActiveView('documents'); window.location.hash = '#/statut'; }, title: 'Statut Twierdzy Durmstrang', desc: 'Naczelny akt ustrojowy i prawa adeptów', icon: Scale, color: '#eab308', category: 'Dokumenty' },
    { id: 'v-regulamin-dc', type: 'action', action: () => { setActiveView('documents'); window.location.hash = '#/regulamin-dc'; }, title: 'Regulamin Serwera Discord (DC)', desc: 'Zasady komunikacji, ról i kanałów lekcyjnych', icon: MessageSquare, color: '#5865F2', category: 'Dokumenty' },
    { id: 'v-zabawy', type: 'action', action: () => { setActiveView('documents'); window.location.hash = '#/zabawy'; }, title: 'Opis Zabaw, Turniejów & Gier RPG', desc: 'Hnefatafl, Pojedynki, Wyprawy i Alchemia', icon: Gamepad2, color: '#2ec4b6', category: 'Dokumenty' },
    { id: 'v-gazette', type: 'view', view: 'gazette', title: 'Żelazne Pióro (Gazeta Twierdzy TMD)', desc: 'Interaktywny magazyn, wywiady, krzyżówki, quizy i kroniki', icon: Newspaper, color: 'var(--gold-ancient)', category: 'Społeczność' },
    { id: 'v-gazette-archive', type: 'view', view: 'gazette-archive', title: 'Archiwum Wydań Żelaznego Pióra', desc: 'Kolekcja wydań historycznych i wyszukiwarka artykułów', icon: Newspaper, color: '#38bdf8', category: 'Społeczność' },
    { id: 'v-gazette-panel', type: 'view', view: 'gazette-panel', title: 'Panel Redakcji Żelaznego Pióra', desc: 'Skład numerów, recenzje zgłoszeń, zarządzanie autorami', icon: Feather, color: '#f59e0b', category: 'Dyrekcja' },
    { id: 'v-raven', type: 'view', view: 'raven-post', title: 'Krucza Poczta (Hrafnapóstur)', desc: 'Prywatna korespondencja z krukami posłańczymi', icon: Mail, color: '#818cf8', category: 'Społeczność' },
    { id: 'v-profile', type: 'view', view: 'profile', title: 'Karta Postaci & Ekwipunek Adepta', desc: 'Paszport, odznaki, różdżka, aury i artefakty', icon: User, color: 'var(--gold-glow)', category: 'Profil' },
    { id: 'v-admin', type: 'view', view: 'admin', title: 'Rada Dyrekcji (Panel CMS)', desc: 'Zarządzanie punktami, weryfikacja kadetów i system', icon: Crown, color: '#f59e0b', category: 'Dyrekcja' },

    // 2. Cztery Zakony (Bezpośrednie przejścia)
    { id: 'h-reinhall', type: 'house', houseId: 'reinhall', title: 'Zakon Reinhall (Ordo Rangiferi)', desc: 'Renifer Północy • Krew i Wieczna Zmarzlina • Sigrid Hällström', icon: Shield, color: '#8b1e2d', category: 'Zakony' },
    { id: 'h-bjornhall', type: 'house', houseId: 'bjornhall', title: 'Zakon Björnhall (Ordo Ursi)', desc: 'Niedźwiedź Jaskiniowy • Żelazo i Magia Bojowa • Gunnar Vargson', icon: Shield, color: '#991b1b', category: 'Zakony' },
    { id: 'h-ravnheim', type: 'house', houseId: 'ravnheim', title: 'Zakon Ravnheim (Ordo Corvi)', desc: 'Kruk Mądrości • Cień i Nekromancja • Morana Vane', icon: Shield, color: '#581c87', category: 'Zakony' },
    { id: 'h-otergard', type: 'house', houseId: 'otergard', title: 'Zakon Otergard (Ordo Lutrae)', desc: 'Wydra Polarna • Toksyny i Alchemia • Klaus Lindqvist', icon: Shield, color: '#0f766e', category: 'Zakony' },

    // 3. Przedmioty (Katedry)
    ...(subjects || []).map(s => ({
      id: `subj-${s.id}`,
      type: 'subject',
      subjectId: s.id,
      title: `Katedra: ${s.name}`,
      desc: `${s.category || 'Nauka Magii'} • ${s.professorName || s.professor || 'Profesor Katedry'}`,
      icon: BookOpen,
      color: '#c59f4e',
      category: 'Przedmioty'
    })),

    // 4. Szybkie Akcje Magiczne
    {
      id: 'act-sound-wind',
      type: 'action',
      action: () => {
        setSoundEnabled(true);
        setAmbientTrack('wind');
        showNotification('Aura Aktywowana', 'Rozbrzmiewa wycie arktycznego wichru wokół baszt.', 'info');
      },
      title: 'Włącz Pejzaż Dźwiękowy: Lodowy Wicher Północy',
      desc: 'Syntezator Web Audio z generatorami szumu i modulacją',
      icon: Volume2,
      color: '#38bdf8',
      category: 'Atmosfera'
    },
    {
      id: 'act-sound-hearth',
      type: 'action',
      action: () => {
        setSoundEnabled(true);
        setAmbientTrack('hearth');
        showNotification('Aura Aktywowana', 'Rozbrzmiewa trzaskający ogień w palenisku Wielkiej Sali.', 'info');
      },
      title: 'Włącz Pejzaż Dźwiękowy: Płomienie w Sali Narad',
      desc: 'Ciepłe trzaski drewna i niska rezonansowa głębia',
      icon: Flame,
      color: '#f97316',
      category: 'Atmosfera'
    },
    {
      id: 'act-sound-library',
      type: 'action',
      action: () => {
        setSoundEnabled(true);
        setAmbientTrack('library');
        showNotification('Aura Aktywowana', 'Rozbrzmiewa mistyczny rezonans kryształów Biblioteki.', 'info');
      },
      title: 'Włącz Pejzaż Dźwiękowy: Kryształowa Biblioteka',
      desc: 'Astralne tony harmoniczne w częstotliwości 432 Hz',
      icon: Sparkles,
      color: '#c084fc',
      category: 'Atmosfera'
    }
  ];

  // Filter items based on query
  const filteredItems = ALL_ITEMS.filter(item => {
    if (item.view === 'ceremony' && currentUser?.role !== 'student') return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    return (
      item.title.toLowerCase().includes(q) ||
      item.desc.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  }).slice(0, 8); // Max 8 quick items for instant snappiness

  const handleSelect = (item) => {
    playWandSwoosh();
    onClose();

    if (item.type === 'view') {
      if (item.view === 'ceremony' && currentUser?.role !== 'student') {
        showNotification('Rytuał Niedostępny', 'Ceremonia Przydziału jest przeznaczona wyłącznie dla adeptów.', 'warning');
        return;
      }
      setActiveView(item.view);
    } else if (item.type === 'house') {
      setActiveHouseTab(item.houseId);
      setActiveView('houses');
    } else if (item.type === 'subject') {
      setActiveSubjectId(item.subjectId);
      setActiveView('subject-detail');
    } else if (item.type === 'action' && item.action) {
      item.action();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 5, 8, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
        zIndex: 100000,
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '680px',
          background: 'linear-gradient(180deg, rgba(16, 22, 34, 0.98) 0%, rgba(8, 11, 18, 0.99) 100%)',
          border: '1px solid var(--gold-ancient)',
          borderRadius: '12px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 35px rgba(197, 159, 78, 0.35)',
          overflow: 'hidden',
          animation: 'slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header Search Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1.2rem 1.4rem',
            borderBottom: '1px solid rgba(197, 159, 78, 0.25)',
            background: 'rgba(5, 8, 14, 0.6)'
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(197, 159, 78, 0.15)',
              border: '1px solid var(--gold-ancient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--gold-ancient)',
              fontSize: '1.1rem',
              flexShrink: 0
            }}
          >
            ᛞ
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Szukaj komnaty, katedry, zakonu, zaklęcia lub akcji… (np. czarna magia, bank, reinhall)"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              fontSize: '1.05rem',
              fontFamily: 'var(--font-ui)'
            }}
          />

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              padding: '0.35rem 0.5rem',
              color: '#9ca3af',
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem'
            }}
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: '420px', overflowY: 'auto', padding: '0.6rem' }}>
          {filteredItems.length === 0 ? (
            <div style={{ padding: '3rem 2rem', textAlign: 'center', color: '#6b7280' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>ᛗ</div>
              <p>Żadna runa ani komnata nie odpowiada temu zapytaniu.</p>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const IconComponent = item.icon || Sparkles;

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(197, 159, 78, 0.15)' : 'transparent',
                    border: isSelected ? '1px solid var(--gold-ancient)' : '1px solid transparent',
                    transition: 'all 0.15s ease',
                    marginBottom: '0.25rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', minWidth: 0 }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: isSelected ? 'rgba(197, 159, 78, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                        border: `1px solid ${isSelected ? 'var(--gold-ancient)' : 'rgba(255, 255, 255, 0.08)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: item.color || 'var(--gold-ancient)',
                        flexShrink: 0
                      }}
                    >
                      <IconComponent size={18} />
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 600, color: isSelected ? '#ffffff' : '#e5e7eb', fontSize: '0.95rem' }}>
                          {item.title}
                        </span>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '3px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            color: '#9ca3af',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}
                        >
                          {item.category}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: '#9ca3af',
                          marginTop: '0.15rem',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {item.desc}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0, opacity: isSelected ? 1 : 0.4 }}>
                    <span style={{ fontSize: '0.75rem', color: isSelected ? 'var(--gold-ancient)' : '#6b7280' }}>
                      Przejdź
                    </span>
                    <CornerDownLeft size={14} color={isSelected ? 'var(--gold-ancient)' : '#6b7280'} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <div
          style={{
            padding: '0.75rem 1.4rem',
            borderTop: '1px solid rgba(197, 159, 78, 0.15)',
            background: 'rgba(3, 5, 8, 0.8)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.78rem',
            color: '#9ca3af'
          }}
        >
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span><kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '0.15rem 0.35rem', borderRadius: '3px' }}>↑</kbd> <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '0.15rem 0.35rem', borderRadius: '3px' }}>↓</kbd> Nawigacja</span>
            <span><kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '0.15rem 0.35rem', borderRadius: '3px' }}>ENTER</kbd> Wybierz</span>
            <span><kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '0.15rem 0.35rem', borderRadius: '3px' }}>ESC</kbd> Zamknij</span>
          </div>

          <div style={{ color: 'var(--gold-ancient)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span>ᛞ</span> Magiczny Kompas Cytadeli
          </div>
        </div>
      </div>
    </div>
  );
};
