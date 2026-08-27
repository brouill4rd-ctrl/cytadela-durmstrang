import React, { useRef, useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import { WaxSeal } from './WaxSeal';
import {
  X,
  Download,
  Shield,
  Award,
  Sparkles,
  CheckCircle,
  Calendar,
  User,
  Star,
  Camera,
  Image,
  RefreshCw,
  Upload
} from 'lucide-react';

const AVATAR_PRESETS = [
  { id: 'pres-1', label: 'Adept Północy', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80' },
  { id: 'pres-2', label: 'Adeptka Ciemnych Sztuk', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80' },
  { id: 'pres-3', label: 'Mistrzyni Zakonu', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80' },
  { id: 'pres-4', label: 'Wojownik Björnhall', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80' },
  { id: 'pres-5', label: 'Strażnik Cytadeli', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80' },
  { id: 'pres-6', label: 'Alchemiczka Fiordów', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80' }
];

export const StudentPassportModal = ({ isOpen, onClose }) => {
  const { currentUser, houses, updateStudentProfile, showNotification, setActiveView } = useSchool();
  const { playCoinSound, playRuneChime, playWandSwoosh } = useSound();
  const passportCardRef = useRef(null);
  const fileInputRef = useRef(null);

  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Handle ESC key
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const houseKey = (currentUser?.house || currentUser?.house_id || '').toLowerCase().trim();
  const hasAssignedHouse = Boolean(
    houseKey && (
      (houses && houses[houseKey]) ||
      (Array.isArray(houses) && houses.some(h => h.id === houseKey)) ||
      (houses && typeof houses === 'object' && Object.values(houses).some(h => h.id === houseKey))
    )
  );
  const currentHouse = hasAssignedHouse
    ? ((houses && houses[houseKey]) || (Array.isArray(houses) ? houses.find(h => h.id === houseKey) : Object.values(houses).find(h => h.id === houseKey)))
    : null;

  const studentName = currentUser
    ? (currentUser.fullName || `${currentUser.name || ''} ${currentUser.surname || ''}`.trim() || currentUser.username || 'Nowicjusz Północy')
    : 'Nowicjusz Północy';

  const roleMap = {
    admin: 'Arcymistrz Cytadeli',
    professor: 'Profesor Katedry',
    teacher: 'Mistrz Wykładowca',
    student: 'Adept Północy (Uczeń)',
    headmaster: 'Dyrektor Cytadeli'
  };
  const roleName = roleMap[currentUser?.role] || currentUser?.role || 'Adept I Roku';
  const isStaff = ['admin', 'professor', 'teacher', 'headmaster'].includes(currentUser?.role);

  const userAvatar = currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80';

  const calcIdHash = (id) => {
    if (typeof id === 'number' && !isNaN(id)) return Math.abs(id * 7393);
    const str = String(id || 'DURM108');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) || 7393;
  };
  const runicId = `DURM-${calcIdHash(currentUser?.id).toString(16).toUpperCase()}-NOR`;

  const handleSelectAvatar = (url) => {
    playWandSwoosh();
    if (updateStudentProfile) {
      updateStudentProfile({ avatar: url });
    }
    if (currentUser) {
      currentUser.avatar = url;
      try {
        const savedUsers = localStorage.getItem('durmstrang_users_db');
        if (savedUsers) {
          const parsed = JSON.parse(savedUsers);
          const updated = parsed.map(u => u.id === currentUser.id ? { ...u, avatar: url } : u);
          localStorage.setItem('durmstrang_users_db', JSON.stringify(updated));
        }
      } catch (e) {
        // ignore
      }
    }
    showNotification('Zaktualizowano Portret', 'Zdjęcie tożsamości w paszporcie zostało pomyślnie zmienione.', 'success');
    setAvatarPickerOpen(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (dataUrl) {
        handleSelectAvatar(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const downloadPassportPng = () => {
    playRuneChime();
    setIsGenerating(true);

    const canvas = document.createElement('canvas');
    canvas.width = 860;
    canvas.height = 540;
    const ctx = canvas.getContext('2d');

    // Background Dark Leather Texture
    const bgGrad = ctx.createLinearGradient(0, 0, 860, 540);
    bgGrad.addColorStop(0, '#121620');
    bgGrad.addColorStop(1, '#06080c');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 860, 540);

    // Border Gold Frame
    ctx.strokeStyle = '#c59f4e';
    ctx.lineWidth = 4;
    ctx.strokeRect(18, 18, 824, 504);

    ctx.strokeStyle = 'rgba(197, 159, 78, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(26, 26, 808, 488);

    // Title Header
    ctx.fillStyle = '#c59f4e';
    ctx.font = 'bold 22px Cinzel, Georgia, serif';
    ctx.fillText('TWIERDZA MAGII DURMSTRANG (TMD)', 45, 68);

    ctx.font = 'italic 13px Georgia, serif';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText('Oficjalny Paszport & Dokument Tożsamości Magicznej Północy', 45, 90);

    // Runic Watermark on Right
    ctx.fillStyle = 'rgba(197, 159, 78, 0.05)';
    ctx.font = 'bold 130px serif';
    ctx.fillText('ᛞ', 680, 240);

    // Load and render user avatar onto canvas
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Draw Avatar Photo Frame
      const photoX = 45;
      const photoY = 125;
      const photoW = 160;
      const photoH = 200;

      // Photo backdrop
      ctx.fillStyle = '#0a0d13';
      ctx.fillRect(photoX, photoY, photoW, photoH);

      // Save for clipping
      ctx.save();
      ctx.beginPath();
      ctx.rect(photoX, photoY, photoW, photoH);
      ctx.clip();
      ctx.drawImage(img, photoX, photoY, photoW, photoH);
      ctx.restore();

      // Photo Gold Frame & Corner Rivets
      ctx.strokeStyle = '#c59f4e';
      ctx.lineWidth = 3;
      ctx.strokeRect(photoX, photoY, photoW, photoH);

      ctx.fillStyle = '#c59f4e';
      ctx.font = 'bold 10px Cinzel, sans-serif';
      ctx.fillText('FOTOGRAFIA CYTADELI', photoX + 18, photoY + photoH + 20);

      // Student Details on Right
      const textX = 240;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Cinzel, Georgia, serif';
      ctx.fillText(studentName, textX, 160);

      ctx.font = '15px Georgia, serif';
      ctx.fillStyle = '#d1d5db';
      ctx.fillText(`Status / Rola: ${roleName}`, textX, 205);
      if (isStaff) {
        ctx.fillText(`Katedra: ${currentUser?.departmentName || (currentUser?.role === 'admin' || currentUser?.role === 'headmaster' ? 'Rada Najwyższa' : 'Katedra Magii')}`, textX, 245);
      } else {
        ctx.fillText(`Zakon: ${currentHouse ? currentHouse.name : 'Nieprzydzielony (Oczekuje na Ceremonię)'}`, textX, 245);
      }
      ctx.fillText(`Identyfikator: ${runicId}`, textX, 285);
      ctx.fillText(`Data Rejestracji: XIX Rok Szkolny`, textX, 325);
      ctx.fillText(`Kancelaria: Najwyższa Rada Mistrzów TMD`, textX, 365);

      // Bottom Bar with Security Guilloche line
      ctx.strokeStyle = 'rgba(197, 159, 78, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(45, 450);
      ctx.lineTo(815, 450);
      ctx.stroke();

      ctx.font = '11px monospace';
      ctx.fillStyle = '#9ca3af';
      ctx.fillText(`P<DURM<<${studentName.toUpperCase().replace(/\s+/g, '<')}<<<<<<<<<<<<<<<<<<`, 45, 475);
      ctx.fillText(`ID${runicId.replace(/[^A-Z0-9]/g, '')}7393NOR<<<<<<<<<<<<<<<XIX01`, 45, 495);

      // Official Wax Seal
      ctx.fillStyle = '#7a1818';
      ctx.beginPath();
      ctx.arc(730, 340, 50, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c59f4e';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#fce7b2';
      ctx.font = 'bold 12px Cinzel, Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('PIECZĘĆ', 730, 335);
      ctx.fillText('DURMSTRANG', 730, 355);

      // Download trigger
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Dowod_Tozsamosci_Durmstrang_${studentName.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
      setIsGenerating(false);
      playCoinSound();
    };

    img.onerror = () => {
      // Fallback if image fails crossOrigin: generate without photo
      const textX = 60;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Cinzel, Georgia, serif';
      ctx.fillText(studentName, textX, 160);

      ctx.font = '15px Georgia, serif';
      ctx.fillStyle = '#d1d5db';
      ctx.fillText(`Status / Rola: ${roleName}`, textX, 205);
      if (isStaff) {
        ctx.fillText(`Katedra: ${currentUser?.departmentName || (currentUser?.role === 'admin' || currentUser?.role === 'headmaster' ? 'Rada Najwyższa' : 'Katedra Magii')}`, textX, 245);
      } else {
        ctx.fillText(`Zakon: ${currentHouse ? currentHouse.name : 'Nieprzydzielony (Oczekuje na Ceremonię)'}`, textX, 245);
      }
      ctx.fillText(`Identyfikator: ${runicId}`, textX, 285);
      ctx.fillText(`Data Rejestracji: XIX Rok Szkolny`, textX, 325);

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Paszport_Durmstrang_${studentName.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
      setIsGenerating(false);
      playCoinSound();
    };

    img.src = userAvatar;
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 5, 8, 0.9)',
        backdropFilter: 'blur(12px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        style={{
          background: 'linear-gradient(180deg, #131822 0%, #0c0f16 100%)',
          border: '2px solid var(--gold-ancient)',
          boxShadow: '0 15px 50px rgba(0, 0, 0, 0.95), 0 0 35px rgba(197, 159, 78, 0.3)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '740px',
          overflow: 'hidden',
          animation: 'fadeIn 0.3s ease-out'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.2rem 1.6rem',
            borderBottom: '1px solid rgba(197, 159, 78, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.45)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <Award size={22} style={{ color: 'var(--gold-ancient)' }} />
            <div>
              <h3 style={{ margin: 0, color: '#ffffff', fontFamily: 'var(--font-heading)', fontSize: '1.2rem' }}>
                Paszport & Dowód Tożsamości Czarodzieja
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                Oficjalna Karta Identyfikacyjna Adepta Twierdzy Magii Durmstrang (TMD)
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              display: 'flex',
              padding: '0.3rem'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Passport Parchment Body */}
        <div style={{ padding: '1.6rem', display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
          <div
            ref={passportCardRef}
            style={{
              background: 'radial-gradient(circle at 50% 30%, #1e2533 0%, #0d111a 100%)',
              border: '2px solid var(--gold-ancient)',
              borderRadius: '10px',
              padding: '1.8rem',
              position: 'relative',
              boxShadow: 'inset 0 0 30px rgba(0,0,0,0.85), 0 6px 20px rgba(0,0,0,0.6)'
            }}
          >
            {/* Herb Watermark */}
            <div
              style={{
                position: 'absolute',
                right: '25px',
                top: '50%',
                transform: 'translateY(-50%)',
                opacity: 0.06,
                pointerEvents: 'none',
                userSelect: 'none'
              }}
            >
              <img src="/tmd_herb.png" alt="Herb Watermark" style={{ width: '220px', height: '220px', objectFit: 'contain' }} />
            </div>

            {/* Passport Header Bar */}
            <div style={{ borderBottom: '1px solid rgba(197, 159, 78, 0.3)', paddingBottom: '0.9rem', marginBottom: '1.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.7rem', letterSpacing: '0.25em', color: 'var(--gold-ancient)', textTransform: 'uppercase', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
                  Akademia Magii Północy • Skandynawia
                </span>
                <h2 style={{ margin: '0.2rem 0 0 0', fontSize: '1.45rem', color: '#ffffff', fontFamily: 'var(--font-heading)', letterSpacing: '0.04em' }}>
                  DURMSTRANG • PASSPORT & ID DOSSIER
                </h2>
              </div>
              <img src="/tmd_herb.png" alt="Logo" style={{ width: '38px', height: '38px', objectFit: 'contain', filter: 'drop-shadow(0 0 8px rgba(197, 159, 78, 0.5))' }} />
            </div>

            {/* Main ID Layout: Left Avatar Photo Frame, Right Details, Far-Right Seal */}
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '1.6rem', alignItems: 'center' }}>
              {/* 1. Official ID Avatar Portrait Frame */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: '120px',
                    height: '150px',
                    borderRadius: '6px',
                    border: '2px solid var(--gold-ancient)',
                    background: '#0a0d14',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.8), inset 0 0 15px rgba(0,0,0,0.7)',
                    cursor: 'pointer'
                  }}
                  onClick={() => setAvatarPickerOpen(prev => !prev)}
                  title="Kliknij, aby zmienić zdjęcie w dowodzie"
                >
                  <img
                    src={userAvatar}
                    alt={studentName}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      filter: 'contrast(1.05) brightness(0.95)'
                    }}
                  />
                  {/* Photo Corner Metal Clasps */}
                  <div style={{ position: 'absolute', top: 2, left: 2, width: 8, height: 8, borderTop: '2px solid var(--gold-ancient)', borderLeft: '2px solid var(--gold-ancient)' }} />
                  <div style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderTop: '2px solid var(--gold-ancient)', borderRight: '2px solid var(--gold-ancient)' }} />
                  <div style={{ position: 'absolute', bottom: 2, left: 2, width: 8, height: 8, borderBottom: '2px solid var(--gold-ancient)', borderLeft: '2px solid var(--gold-ancient)' }} />
                  <div style={{ position: 'absolute', bottom: 2, right: 2, width: 8, height: 8, borderBottom: '2px solid var(--gold-ancient)', borderRight: '2px solid var(--gold-ancient)' }} />

                  {/* Camera overlay icon */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '4px',
                      right: '4px',
                      background: 'rgba(0, 0, 0, 0.75)',
                      padding: '3px',
                      borderRadius: '4px',
                      border: '1px solid var(--gold-ancient)',
                      color: 'var(--gold-ancient)',
                      display: 'flex'
                    }}
                  >
                    <Camera size={12} />
                  </div>
                </div>

                <button
                  onClick={() => setAvatarPickerOpen(prev => !prev)}
                  style={{
                    background: 'transparent',
                    border: '1px dashed rgba(197, 159, 78, 0.4)',
                    borderRadius: '4px',
                    color: 'var(--gold-ancient)',
                    fontSize: '0.72rem',
                    padding: '0.2rem 0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <RefreshCw size={11} /> Zmień portret
                </button>
              </div>

              {/* 2. Official Student Data Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Imię i Nazwisko / Tożsamość</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f3f4f6', fontFamily: 'var(--font-heading)' }}>
                    {studentName}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                  {isStaff ? (
                    <div>
                      <span style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Katedra / Wydział</span>
                      <div style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--gold-ancient)', fontFamily: 'var(--font-heading)' }}>
                        {currentUser?.departmentName || (currentUser?.role === 'admin' || currentUser?.role === 'headmaster' ? 'Rada Najwyższa' : 'Katedra Magii')}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <span style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Zakon</span>
                      {currentHouse ? (
                        <div style={{ fontSize: '0.98rem', fontWeight: 700, color: currentHouse.colors?.secondary || 'var(--gold-ancient)', fontFamily: 'var(--font-heading)' }}>
                          {currentHouse.name}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                          <span style={{ fontSize: '0.82rem', color: '#fbbf24', fontStyle: 'italic', fontWeight: 600 }}>
                            Oczekuje na Rytuał
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              if (setActiveView) setActiveView('ceremony');
                            }}
                            style={{
                              background: 'rgba(197, 159, 78, 0.2)',
                              border: '1px solid var(--gold-ancient)',
                              borderRadius: '3px',
                              color: 'var(--gold-ancient)',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.45rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            title="Przejdź do Ceremonii Przydziału przed Kamień Przysięgi"
                          >
                            ᛞ Rytuał →
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Rola / Stopień</span>
                    <div style={{ fontSize: '0.92rem', color: '#d1d5db', fontWeight: 600 }}>
                      {roleName}
                    </div>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Identyfikator Runiczny Paktu</span>
                  <div style={{ fontSize: '0.86rem', fontFamily: 'monospace', color: '#93c5fd', fontWeight: 700 }}>
                    {runicId}
                  </div>
                </div>
              </div>

              {/* 3. Official Embossed Wax Seal */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                <WaxSeal label="DURMSTRANG" color="#7a1818" />
              </div>
            </div>

            {/* Bottom Guilloche Line */}
            <div style={{ marginTop: '1.2rem', paddingTop: '0.8rem', borderTop: '1px dashed rgba(197, 159, 78, 0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: '#8c95a6' }}>
              <span>Podpis Magiczny: ᛞ <strong style={{ color: 'var(--gold-ancient)' }}>{studentName}</strong> ᛞ</span>
              <span style={{ fontFamily: 'monospace' }}>ROK-XIX • KATEDRA PÓŁNOCY</span>
            </div>
          </div>

          {/* Quick Avatar Portrait Selector Popover / Drawer */}
          {avatarPickerOpen && (
            <div
              style={{
                background: 'rgba(8, 11, 16, 0.95)',
                border: '1px solid var(--gold-ancient)',
                borderRadius: '8px',
                padding: '1rem',
                animation: 'fadeIn 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                <span style={{ fontSize: '0.84rem', color: 'var(--gold-ancient)', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
                  Wybierz Oficjalny Portret Magiczny do Dowodu:
                </span>
                <button
                  onClick={() => setAvatarPickerOpen(false)}
                  style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.6rem', marginBottom: '1rem' }}>
                {AVATAR_PRESETS.map(preset => (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectAvatar(preset.url)}
                    style={{
                      border: userAvatar === preset.url ? '2px solid var(--gold-ancient)' : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      background: '#0d111a',
                      textAlign: 'center',
                      padding: '4px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <img src={preset.url} alt={preset.label} style={{ width: '100%', height: '75px', objectFit: 'cover', borderRadius: '4px' }} />
                    <span style={{ fontSize: '0.68rem', color: '#d1d5db', display: 'block', marginTop: '3px' }}>
                      {preset.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Custom URL or Upload Option */}
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.8rem' }}>
                <input
                  type="text"
                  placeholder="Wklej własny adres URL zdjęcia..."
                  value={customAvatarUrl}
                  onChange={(e) => setCustomAvatarUrl(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.75rem',
                    background: 'rgba(0,0,0,0.6)',
                    border: '1px solid rgba(197, 159, 78, 0.3)',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '0.82rem'
                  }}
                />
                <button
                  onClick={() => {
                    if (customAvatarUrl.trim()) handleSelectAvatar(customAvatarUrl.trim());
                  }}
                  style={{
                    padding: '0.5rem 0.8rem',
                    background: 'rgba(197, 159, 78, 0.2)',
                    border: '1px solid var(--gold-ancient)',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  Zastosuj URL
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: '0.5rem 0.8rem',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <Upload size={14} /> Wgraj plik
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
              * Oficjalny dokument graficzny z Twoją fotografią, gotowy do pobrania
            </span>

            <button
              onClick={downloadPassportPng}
              disabled={isGenerating}
              style={{
                background: 'linear-gradient(135deg, var(--gold-ancient) 0%, #9a7628 100%)',
                color: '#000000',
                border: 'none',
                borderRadius: '6px',
                padding: '0.75rem 1.4rem',
                fontWeight: 700,
                fontSize: '0.92rem',
                fontFamily: 'var(--font-heading)',
                cursor: isGenerating ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 15px rgba(197, 159, 78, 0.4)',
                opacity: isGenerating ? 0.7 : 1
              }}
            >
              <Download size={16} /> {isGenerating ? 'Pieczętowanie...' : 'Pobierz Dowód Tożsamości (PNG)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
