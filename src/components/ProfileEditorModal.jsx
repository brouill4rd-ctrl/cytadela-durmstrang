import React, { useState, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import {
  X,
  User,
  Shield,
  Sparkles,
  Wand2,
  Image as ImageIcon,
  Check,
  RotateCcw,
  Save,
  Feather,
  Heart,
  Compass,
  FileText,
  Eye
} from 'lucide-react';

const AVATAR_PRESETS = [
  // Męskie / Wizards
  {
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    label: 'Młody Mag Północy',
    gender: 'czarodziej'
  },
  {
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    label: 'Adept Szkoły Pojedynków',
    gender: 'czarodziej'
  },
  {
    url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80',
    label: 'Zwiadowca Fjordów',
    gender: 'czarodziej'
  },
  {
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80',
    label: 'Mistrz Run & Zaklęć',
    gender: 'czarodziej'
  },
  {
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80',
    label: 'Strażnik Cytadeli',
    gender: 'czarodziej'
  },
  // Żeńskie / Witches
  {
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    label: 'Czarownica Mroźnych Wichrów',
    gender: 'czarownica'
  },
  {
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
    label: 'Mistrzyni Alchemii',
    gender: 'czarownica'
  },
  {
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
    label: 'Adeptka Astromagii',
    gender: 'czarownica'
  },
  {
    url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80',
    label: 'Wieszczka Kruczego Zakonu',
    gender: 'czarownica'
  },
  {
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
    label: 'Arcymistrzyni Rady',
    gender: 'czarownica'
  },
  // Mistyczne / Mroczne / Runiczne
  {
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
    label: 'Runiczny Wędrowiec',
    gender: 'mistyk'
  },
  {
    url: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=300&auto=format&fit=crop&q=80',
    label: 'Kapłanka Starych Bogów',
    gender: 'mistyk'
  }
];

export const ProfileEditorModal = ({ isOpen, onClose }) => {
  const { currentUser, studentProfile, updateCurrentUser, showNotification } = useSchool();
  const { playWandSwoosh, playWaxCrack, playRuneChime } = useSound();

  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    fullName: '',
    gender: 'czarodziej',
    title: '',
    origin: '',
    avatar: '',
    wand: '',
    patronus: '',
    companion: '',
    appearance: '',
    backstory: '',
    office: '',
    classYear: ''
  });

  const [saving, setSaving] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('identity'); // 'identity' | 'avatar' | 'magic' | 'lore'

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Populate form on open
  useEffect(() => {
    if (isOpen) {
      const activeData = currentUser || studentProfile || {};
      const nameParts = (activeData.fullName || '').split(' ');
      setFormData({
        name: activeData.name || nameParts[0] || 'Valdemar',
        surname: activeData.surname || nameParts.slice(1).join(' ') || 'Krag-Hansen',
        fullName: activeData.fullName || 'Valdemar Krag-Hansen',
        gender: activeData.gender || 'czarodziej',
        title: activeData.title || '',
        origin: activeData.origin || 'Skandynawia (Norwegia)',
        avatar: activeData.avatar || AVATAR_PRESETS[0].url,
        wand: activeData.wand || '12½ cala, Czarny Dąb, Włókno ze Skrzydła Smoka',
        patronus: activeData.patronus || 'Biały Wilk Północny',
        companion: activeData.companion || activeData.pet || 'Puchacz Śnieżny',
        appearance: activeData.appearance || 'Wysoki adept w szacie podbitej wilczym futrem ze srebrną klamrą.',
        backstory: activeData.backstory || 'Pochodzi z prastarego rodu z północy, wezwany przez prastare runy do bram Durmstrangu.',
        office: activeData.office || '',
        classYear: activeData.classYear || 'Klasa I'
      });
    }
  }, [currentUser, studentProfile, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'name' || name === 'surname') {
        const n = name === 'name' ? value : prev.name;
        const s = name === 'surname' ? value : prev.surname;
        updated.fullName = `${n.trim()} ${s.trim()}`.trim();
      }
      return updated;
    });
  };

  const handleSelectPresetAvatar = (url, gender) => {
    playRuneChime();
    setFormData(prev => ({
      ...prev,
      avatar: url,
      gender: gender ? gender : prev.gender
    }));
  };

  const handleRandomizeAvatar = () => {
    playWandSwoosh();
    const matching = AVATAR_PRESETS.filter(p => formData.gender === 'all' || p.gender === formData.gender);
    const pool = matching.length > 0 ? matching : AVATAR_PRESETS;
    const randomItem = pool[Math.floor(Math.random() * pool.length)];
    setFormData(prev => ({ ...prev, avatar: randomItem.url }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.surname.trim()) {
      showNotification('Niekompletne Dane', 'Podaj imię oraz nazwisko postaci.', 'warning');
      return;
    }

    setSaving(true);
    playWaxCrack();

    const computedFullName = `${formData.name.trim()} ${formData.surname.trim()}`.trim();

    const payload = {
      name: formData.name.trim(),
      surname: formData.surname.trim(),
      fullName: computedFullName,
      full_name: computedFullName,
      gender: formData.gender,
      title: formData.title.trim(),
      origin: formData.origin.trim(),
      avatar: formData.avatar.trim(),
      wand: formData.wand.trim(),
      patronus: formData.patronus.trim(),
      companion: formData.companion.trim(),
      appearance: formData.appearance.trim(),
      backstory: formData.backstory.trim(),
      office: formData.office.trim(),
      classYear: formData.classYear
    };

    await updateCurrentUser(payload);

    setSaving(false);
    showNotification('Metryka Zaktualizowana', `Zapisano zmiany w Kronikach Paktu dla: ${computedFullName}.`, 'success');
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(2, 4, 8, 0.92)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        userSelect: 'text'
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
          background: 'linear-gradient(180deg, #101624 0%, #080c13 100%)',
          border: '1px solid var(--gold-ancient)',
          borderRadius: '10px',
          boxShadow: '0 30px 90px rgba(0, 0, 0, 0.98), 0 0 45px rgba(197, 159, 78, 0.25)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Gold Accent Line */}
        <div style={{ height: '3px', background: 'linear-gradient(90deg, transparent, var(--gold-ancient), var(--ice-frost), transparent)' }} />

        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid rgba(197, 159, 78, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(10, 14, 22, 0.7)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(197, 159, 78, 0.15)',
                border: '1px solid var(--gold-ancient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--gold-glow)'
              }}
            >
              <User size={18} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.35rem', color: '#ffffff', fontFamily: 'var(--font-heading)' }}>
                Edycja Profilu & Tożsamości Adepta
              </h2>
              <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>
                Dostosuj portret, płeć, godność, różdżkę oraz kronikę postaci w murach Durmstrangu
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '0.3rem',
              borderRadius: '4px',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
          >
            <X size={22} />
          </button>
        </div>

        {/* Sub-Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            padding: '0.8rem 1.75rem 0',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(5, 8, 14, 0.5)',
            flexWrap: 'wrap'
          }}
        >
          <button
            onClick={() => { playWandSwoosh(); setActiveSubTab('identity'); }}
            style={{
              padding: '0.55rem 1.1rem',
              background: activeSubTab === 'identity' ? 'rgba(197, 159, 78, 0.15)' : 'transparent',
              border: 'none',
              borderBottom: activeSubTab === 'identity' ? '2px solid var(--gold-ancient)' : '2px solid transparent',
              color: activeSubTab === 'identity' ? 'var(--gold-glow)' : '#9ca3af',
              fontFamily: 'var(--font-heading)',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <User size={14} /> Dane & Płeć
          </button>

          <button
            onClick={() => { playWandSwoosh(); setActiveSubTab('avatar'); }}
            style={{
              padding: '0.55rem 1.1rem',
              background: activeSubTab === 'avatar' ? 'rgba(197, 159, 78, 0.15)' : 'transparent',
              border: 'none',
              borderBottom: activeSubTab === 'avatar' ? '2px solid var(--gold-ancient)' : '2px solid transparent',
              color: activeSubTab === 'avatar' ? 'var(--gold-glow)' : '#9ca3af',
              fontFamily: 'var(--font-heading)',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <ImageIcon size={14} /> Portret & Awatar
          </button>

          <button
            onClick={() => { playWandSwoosh(); setActiveSubTab('magic'); }}
            style={{
              padding: '0.55rem 1.1rem',
              background: activeSubTab === 'magic' ? 'rgba(197, 159, 78, 0.15)' : 'transparent',
              border: 'none',
              borderBottom: activeSubTab === 'magic' ? '2px solid var(--gold-ancient)' : '2px solid transparent',
              color: activeSubTab === 'magic' ? 'var(--gold-glow)' : '#9ca3af',
              fontFamily: 'var(--font-heading)',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Wand2 size={14} /> Różdżka & Totemy
          </button>

          <button
            onClick={() => { playWandSwoosh(); setActiveSubTab('lore'); }}
            style={{
              padding: '0.55rem 1.1rem',
              background: activeSubTab === 'lore' ? 'rgba(197, 159, 78, 0.15)' : 'transparent',
              border: 'none',
              borderBottom: activeSubTab === 'lore' ? '2px solid var(--gold-ancient)' : '2px solid transparent',
              color: activeSubTab === 'lore' ? 'var(--gold-glow)' : '#9ca3af',
              fontFamily: 'var(--font-heading)',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <FileText size={14} /> Opis Postaci (RPG)
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ padding: '1.75rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* =========================================================================
                TAB 1: DANE OSOBOWE & PŁEĆ
                ========================================================================= */}
            {activeSubTab === 'identity' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.3rem' }}>
                {/* Name & Surname */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 600 }}>
                      Imię Postaci <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="np. Valdemar, Astrid, Ezra..."
                      className="gothic-input"
                      style={{ width: '100%', padding: '0.75rem 1rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 600 }}>
                      Nazwisko / Przydomek Rodowy <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      name="surname"
                      required
                      value={formData.surname}
                      onChange={handleChange}
                      placeholder="np. Krag-Hansen, Vargadottir, Camhi..."
                      className="gothic-input"
                      style={{ width: '100%', padding: '0.75rem 1rem' }}
                    />
                  </div>
                </div>

                {/* GENDER SELECTOR */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--gold-ancient)', marginBottom: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Płeć & Tożsamość Magiczna
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.8rem' }}>
                    <button
                      type="button"
                      onClick={() => { playRuneChime(); setFormData(prev => ({ ...prev, gender: 'czarodziej' })); }}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: '6px',
                        background: formData.gender === 'czarodziej' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        border: formData.gender === 'czarodziej' ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                        color: formData.gender === 'czarodziej' ? '#38bdf8' : '#cbd5e1',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        transition: 'all 0.2s'
                      }}
                    >
                      <span style={{ fontSize: '1.4rem' }}>🧙‍♂️</span>
                      <div style={{ textAlign: 'left' }}>
                        <div>Czarodziej</div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Mężczyzna</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => { playRuneChime(); setFormData(prev => ({ ...prev, gender: 'czarownica' })); }}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: '6px',
                        background: formData.gender === 'czarownica' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        border: formData.gender === 'czarownica' ? '2px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.1)',
                        color: formData.gender === 'czarownica' ? '#c084fc' : '#cbd5e1',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        transition: 'all 0.2s'
                      }}
                    >
                      <span style={{ fontSize: '1.4rem' }}>🧙‍♀️</span>
                      <div style={{ textAlign: 'left' }}>
                        <div>Czarownica</div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Kobieta</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => { playRuneChime(); setFormData(prev => ({ ...prev, gender: 'mistyk' })); }}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: '6px',
                        background: formData.gender === 'mistyk' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        border: formData.gender === 'mistyk' ? '2px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.1)',
                        color: formData.gender === 'mistyk' ? '#fbbf24' : '#cbd5e1',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        transition: 'all 0.2s'
                      }}
                    >
                      <span style={{ fontSize: '1.4rem' }}>🔮</span>
                      <div style={{ textAlign: 'left' }}>
                        <div>Mistyk Północy</div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Niezdefiniowana / Inna</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Title & Origin */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 600 }}>
                      Tytuł Honorowy / Przydomek
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="np. Mistrz Zimowego Szronu, Adept I Kręgu..."
                      className="gothic-input"
                      style={{ width: '100%', padding: '0.75rem 1rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 600 }}>
                      Pochodzenie Geograficzne / Region
                    </label>
                    <input
                      type="text"
                      name="origin"
                      value={formData.origin}
                      onChange={handleChange}
                      placeholder="np. Norwegia (Bergen), Islandia, Finlandia..."
                      className="gothic-input"
                      style={{ width: '100%', padding: '0.75rem 1rem' }}
                    />
                  </div>
                </div>

                {/* Office or Year */}
                {currentUser?.role === 'admin' || currentUser?.role === 'professor' ? (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 600 }}>
                      Siedziba / Komnaty Urzędowe
                    </label>
                    <input
                      type="text"
                      name="office"
                      value={formData.office}
                      onChange={handleChange}
                      placeholder="np. Komnaty Najwyższej Wieży Durmstrang..."
                      className="gothic-input"
                      style={{ width: '100%', padding: '0.75rem 1rem' }}
                    />
                  </div>
                ) : (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 600 }}>
                      Rok Nauki / Klasa
                    </label>
                    <select
                      name="classYear"
                      value={formData.classYear}
                      onChange={handleChange}
                      className="gothic-input"
                      style={{ width: '100%', padding: '0.75rem 1rem' }}
                    >
                      <option value="Klasa I">Klasa I (Nowicjat)</option>
                      <option value="Klasa II">Klasa II (Adept Północy)</option>
                      <option value="Klasa III">Klasa III (Starszy Adept)</option>
                      <option value="Klasa IV">Klasa IV (Mistrz Przysięgi)</option>
                      <option value="Klasa V">Klasa V (Arcyadept)</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* =========================================================================
                TAB 2: AWATAR & PORTRET
                ========================================================================= */}
            {activeSubTab === 'avatar' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Current Avatar Preview & Custom URL */}
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', background: 'rgba(0,0,0,0.4)', padding: '1.2rem', borderRadius: '8px', border: '1px solid rgba(197, 159, 78, 0.2)' }}>
                  <img
                    src={formData.avatar || AVATAR_PRESETS[0].url}
                    alt="Podgląd Awatara"
                    style={{
                      width: '90px',
                      height: '90px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid var(--gold-ancient)',
                      boxShadow: '0 0 20px rgba(197, 159, 78, 0.35)',
                      flexShrink: 0
                    }}
                    onError={(e) => {
                      e.target.src = AVATAR_PRESETS[0].url;
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <label style={{ fontSize: '0.8rem', color: 'var(--gold-ancient)', fontWeight: 700, textTransform: 'uppercase' }}>
                        Własny Adres URL Portretu
                      </label>
                      <button
                        type="button"
                        onClick={handleRandomizeAvatar}
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          color: '#e2e8f0',
                          borderRadius: '4px',
                          padding: '0.25rem 0.6rem',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        <RotateCcw size={12} /> Losuj
                      </button>
                    </div>
                    <input
                      type="url"
                      name="avatar"
                      value={formData.avatar}
                      onChange={handleChange}
                      placeholder="https://images.unsplash.com/... lub bezpośredni link PNG/JPG"
                      className="gothic-input"
                      style={{ width: '100%', padding: '0.65rem 0.9rem', fontSize: '0.85rem' }}
                    />
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.3rem' }}>
                      Możesz wkleić dowolny link do grafiki lub wybrać jeden z poniższych portretów Cytadeli.
                    </div>
                  </div>
                </div>

                {/* Preset Avatar Grid */}
                <div>
                  <div style={{ fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 700, marginBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Galeria Portretów Cytadeli Durmstrang
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.8rem' }}>
                    {AVATAR_PRESETS.map((preset, idx) => {
                      const isSelected = formData.avatar === preset.url;
                      return (
                        <div
                          key={idx}
                          onClick={() => handleSelectPresetAvatar(preset.url, preset.gender)}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.6rem',
                            borderRadius: '8px',
                            background: isSelected ? 'rgba(197, 159, 78, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                            border: isSelected ? '2px solid var(--gold-ancient)' : '1px solid rgba(255, 255, 255, 0.08)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: isSelected ? '0 0 15px rgba(197, 159, 78, 0.3)' : 'none'
                          }}
                        >
                          <img
                            src={preset.url}
                            alt={preset.label}
                            style={{
                              width: '64px',
                              height: '64px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: isSelected ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.2)'
                            }}
                          />
                          <span style={{ fontSize: '0.68rem', color: isSelected ? '#ffffff' : '#94a3b8', textAlign: 'center', fontWeight: isSelected ? 700 : 500, lineHeight: 1.2 }}>
                            {preset.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================================
                TAB 3: RÓŻDŻKA, PATRONUS & CHOWANIEC
                ========================================================================= */}
            {activeSubTab === 'magic' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.3rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 600 }}>
                    Różdżka (Długość, Drewno, Rdzeń, Giętkość)
                  </label>
                  <input
                    type="text"
                    name="wand"
                    value={formData.wand}
                    onChange={handleChange}
                    placeholder="np. 12½ cala, Czarny Dąb ze Skandów, Włókno ze Skrzydła Smoka Lodowego..."
                    className="gothic-input"
                    style={{ width: '100%', padding: '0.75rem 1rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 600 }}>
                      Patronus / Totem Astralny
                    </label>
                    <input
                      type="text"
                      name="patronus"
                      value={formData.patronus}
                      onChange={handleChange}
                      placeholder="np. Niedźwiedź Polarny, Ryś, Morski Smok..."
                      className="gothic-input"
                      style={{ width: '100%', padding: '0.75rem 1rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 600 }}>
                      Chowaniec / Zwierzęcy Towarzysz
                    </label>
                    <input
                      type="text"
                      name="companion"
                      value={formData.companion}
                      onChange={handleChange}
                      placeholder="np. Puchacz Śnieżny (Hedvig), Lis Arktyczny..."
                      className="gothic-input"
                      style={{ width: '100%', padding: '0.75rem 1rem' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================================
                TAB 4: OPIS POSTACI (RPG)
                ========================================================================= */}
            {activeSubTab === 'lore' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.3rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 600 }}>
                    Wygląd Zewnętrzny & Cechy Szczególne
                  </label>
                  <textarea
                    name="appearance"
                    rows={3}
                    value={formData.appearance}
                    onChange={handleChange}
                    placeholder="Opisz posturę, kolor oczu, runiczne blizny, szaty, klamry lub maski..."
                    className="gothic-input"
                    style={{ width: '100%', padding: '0.75rem 1rem', resize: 'vertical' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 600 }}>
                    Kronika Żywota & Biografia (Backstory)
                  </label>
                  <textarea
                    name="backstory"
                    rows={5}
                    value={formData.backstory}
                    onChange={handleChange}
                    placeholder="Historia przybycia do Cytadeli Durmstrang, tajemnice rodu, ambicje i dawne pakty..."
                    className="gothic-input"
                    style={{ width: '100%', padding: '0.75rem 1rem', resize: 'vertical' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div
            style={{
              padding: '1.25rem 1.75rem',
              borderTop: '1px solid rgba(197, 159, 78, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(10, 14, 22, 0.9)'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#cbd5e1',
                padding: '0.65rem 1.2rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Anuluj
            </button>

            <button
              type="submit"
              disabled={saving}
              className="btn-durmstrang"
              style={{
                padding: '0.65rem 1.6rem',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 700
              }}
            >
              <Save size={16} />
              {saving ? 'Zapisywanie w Księdze...' : 'Przypieczętuj Zmiany Profilu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
