import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import { X, Sparkles, Wand2, Shield, Feather, User, Compass, Heart, Scroll } from 'lucide-react';

export const CharacterCreationModal = ({ isOpen, onClose }) => {
  const { submitApplication } = useSchool();
  const { playWandSwoosh, playRuneChime } = useSound();

  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    age: '14',
    gender: 'Kobieta',
    origin: 'Skandynawia (Norwegia)',
    wandWood: 'Cis Arktyczny',
    wandCore: 'Włókno Serca Smoka',
    wandLength: '12 cali',
    wandFlex: 'Sztywna',
    patronus: 'Wilk Polarny',
    companion: 'Puchacz Śnieżny',
    appearance: '',
    backstory: '',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
  });

  // Handle Escape key
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.surname.trim()) return;

    playWandSwoosh();

    const fullWand = `${formData.wandWood} z rdzeniem z: ${formData.wandCore}, ${formData.wandLength}, ${formData.wandFlex}`;

    const appData = {
      name: formData.name.trim(),
      surname: formData.surname.trim(),
      age: parseInt(formData.age) || 14,
      gender: formData.gender,
      origin: formData.origin,
      wand: fullWand,
      patronus: formData.patronus,
      companion: formData.companion,
      appearance: formData.appearance || 'Tajemniczy adept Północy w opończy z wilczego futra.',
      backstory: formData.backstory || 'Młody adept, który poczuł zew północnej magii i przekroczył wrota Cytadeli.',
      avatar: formData.avatar
    };

    submitApplication(appData);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(2, 4, 7, 0.9)',
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
          maxWidth: '780px',
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

        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid rgba(197, 159, 78, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(10, 14, 22, 0.8)'
          }}
        >
          <div>
            <span style={{ color: 'var(--gold-ancient)', fontSize: '0.78rem', letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
              ᛞ Kancelaria Rekrutacji Twierdzy Magii (TMD) ᛞ
            </span>
            <h2 style={{ fontSize: '1.5rem', color: '#ffffff', marginTop: '0.15rem' }}>
              Stwórz Własną Postać Adepta
            </h2>
          </div>

          <button
            onClick={() => {
              playWandSwoosh();
              onClose();
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '4px',
              width: '32px',
              height: '32px',
              color: '#9ca3af',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '1.75rem 2rem', overflowY: 'auto', flex: 1 }}>
          <form id="character-creation-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* 1. Tożsamość i Dane Osobowe */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gold-ancient)', marginBottom: '0.35rem', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Imię Postaci *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="np. Einar, Freja, Astrid"
                  value={formData.name}
                  onChange={handleChange}
                  className="gothic-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gold-ancient)', marginBottom: '0.35rem', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Nazwisko / Przydomek *
                </label>
                <input
                  type="text"
                  name="surname"
                  required
                  placeholder="np. Hällström, Krag, Vane"
                  value={formData.surname}
                  onChange={handleChange}
                  className="gothic-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gold-ancient)', marginBottom: '0.35rem', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Wiek (lat)
                </label>
                <input
                  type="number"
                  name="age"
                  min="11"
                  max="20"
                  value={formData.age}
                  onChange={handleChange}
                  className="gothic-input"
                />
              </div>
            </div>

            {/* 2. Płeć, Kraina, Avatar */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1.5fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gold-ancient)', marginBottom: '0.35rem', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Płeć
                </label>
                <select name="gender" value={formData.gender} onChange={handleChange} className="gothic-select">
                  <option value="Kobieta">Kobieta</option>
                  <option value="Mężczyzna">Mężczyzna</option>
                  <option value="Inna">Inna / Tajemnicza</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gold-ancient)', marginBottom: '0.35rem', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Kraina Pochodzenia
                </label>
                <input
                  type="text"
                  name="origin"
                  placeholder="np. Skandynawia, Bałkany, Europa"
                  value={formData.origin}
                  onChange={handleChange}
                  className="gothic-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gold-ancient)', marginBottom: '0.35rem', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Link do Awatara (URL)
                </label>
                <input
                  type="url"
                  name="avatar"
                  placeholder="https://..."
                  value={formData.avatar}
                  onChange={handleChange}
                  className="gothic-input"
                />
              </div>
            </div>

            {/* 3. Wyróżniona Sekcja: Różdżka Adepta */}
            <div
              style={{
                padding: '1.1rem 1.3rem',
                background: 'rgba(8, 11, 16, 0.75)',
                border: '1px solid rgba(197, 159, 78, 0.25)',
                borderRadius: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.8rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--gold-glow)', fontFamily: 'var(--font-heading)', fontSize: '0.95rem', letterSpacing: '0.06em' }}>
                <Wand2 size={16} /> RÓŻDŻKA ADEPTA (PARAMETRY MAGICZNE)
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.8rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#9ca3af', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Drewno</label>
                  <select name="wandWood" value={formData.wandWood} onChange={handleChange} className="gothic-select">
                    <option value="Cis Arktyczny">Cis Arktyczny</option>
                    <option value="Czarny Heban">Czarny Heban</option>
                    <option value="Sosna Tundrowa">Sosna Tundrowa</option>
                    <option value="Czarny Dąb">Czarny Dąb</option>
                    <option value="Jarzębina Mrozu">Jarzębina Mrozu</option>
                    <option value="Jesion Skandynawski">Jesion Skandynawski</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#9ca3af', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Rdzeń Magiczny</label>
                  <select name="wandCore" value={formData.wandCore} onChange={handleChange} className="gothic-select">
                    <option value="Włókno Serca Smoka">Włókno Serca Smoka</option>
                    <option value="Włos z Ogona Kelpie">Włos z Ogona Kelpie</option>
                    <option value="Pióro Kruka Cienia">Pióro Kruka Cienia</option>
                    <option value="Włos Niedźwiedzia Mrozu">Włos Niedźwiedzia Mrozu</option>
                    <option value="Kieł Żmii Lodowcowej">Kieł Żmii Lodowcowej</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#9ca3af', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Długość</label>
                  <select name="wandLength" value={formData.wandLength} onChange={handleChange} className="gothic-select">
                    <option value="10 i 1/2 cala">10 i 1/2 cala</option>
                    <option value="11 i 3/4 cala">11 i 3/4 cala</option>
                    <option value="12 cali">12 cali</option>
                    <option value="13 cali">13 cali</option>
                    <option value="14 cali">14 cali</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#9ca3af', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Giętkość</label>
                  <select name="wandFlex" value={formData.wandFlex} onChange={handleChange} className="gothic-select">
                    <option value="Sztywna">Sztywna</option>
                    <option value="Sprężysta">Sprężysta</option>
                    <option value="Nieustępliwa">Nieustępliwa</option>
                    <option value="Twarda">Twarda</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 4. Patronus & Towarzysz */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gold-ancient)', marginBottom: '0.35rem', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Patronus / Duch Opiekuńczy
                </label>
                <input
                  type="text"
                  name="patronus"
                  placeholder="np. Wilk Polarny, Kruk, Ryś, Niedźwiedź"
                  value={formData.patronus}
                  onChange={handleChange}
                  className="gothic-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gold-ancient)', marginBottom: '0.35rem', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Magiczny Towarzysz (Zwierzę)
                </label>
                <input
                  type="text"
                  name="companion"
                  placeholder="np. Puchacz Śnieżny, Lis Polarny, Kruk"
                  value={formData.companion}
                  onChange={handleChange}
                  className="gothic-input"
                />
              </div>
            </div>

            {/* 5. Wygląd i Historia */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gold-ancient)', marginBottom: '0.35rem', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Wygląd i Osobliwości Fizyczne
              </label>
              <textarea
                name="appearance"
                rows={2}
                placeholder="Opisz rysy twarzy, szatę, blizny runiczne, spojrzenie..."
                value={formData.appearance}
                onChange={handleChange}
                className="gothic-textarea"
                style={{ minHeight: '60px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gold-ancient)', marginBottom: '0.35rem', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Historia Postaci (Lore & Motywacja Przybycia do Twierdzy Magii)
              </label>
              <textarea
                name="backstory"
                rows={3}
                placeholder="Jak odkryłeś swoje magiczne dziedzictwo? Dlaczego przybywasz do Twierdzy Magii Durmstrang (TMD)?"
                value={formData.backstory}
                onChange={handleChange}
                className="gothic-textarea"
                style={{ minHeight: '75px' }}
              />
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderTop: '1px solid rgba(197, 159, 78, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(10, 14, 22, 0.8)'
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#8c95a6' }}>
            * Podanie trafi do weryfikacji przez Radę Mistrzów Twierdzy Magii (TMD)
          </div>

          <div style={{ display: 'flex', gap: '0.8rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-durmstrang-secondary"
              style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}
            >
              Anuluj
            </button>
            <button
              type="submit"
              form="character-creation-form"
              className="btn-durmstrang"
              style={{ padding: '0.6rem 1.5rem', fontSize: '0.88rem' }}
            >
              <Sparkles size={15} /> Złóż Podanie do Dyrekcji
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
