import React, { useRef } from 'react';
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
  Star
} from 'lucide-react';

export const StudentPassportModal = ({ isOpen, onClose }) => {
  const { currentUser, houses } = useSchool();
  const { playCoinSound, playRuneChime } = useSound();
  const passportCardRef = useRef(null);

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

  const houseKey = currentUser?.house || currentUser?.house_id;
  const currentHouse = (houses && houseKey && houses[houseKey])
    || (Array.isArray(houses) ? houses.find(h => h.id === houseKey) : null)
    || (houses && typeof houses === 'object' ? Object.values(houses)[0] : null)
    || { name: 'Reinhall', crestIcon: '🦌', colors: { primary: '#7a1818', secondary: '#c59f4e' } };

  const studentName = currentUser
    ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || currentUser.name || currentUser.username || 'Nowicjusz Północy'
    : 'Nowicjusz Północy';

  const roleMap = {
    admin: 'Arcymistrz / Prefekt',
    professor: 'Profesor Katedry',
    teacher: 'Mistrz Wykładowca',
    student: 'Adept Północy (Uczeń)',
    headmaster: 'Dyrektor Cytadeli'
  };
  const roleName = roleMap[currentUser?.role] || currentUser?.role || 'Uczeń I Roku';

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

  const downloadPassportPng = () => {
    playRuneChime();
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');

    // Background Dark Leather Texture
    const bgGrad = ctx.createLinearGradient(0, 0, 800, 500);
    bgGrad.addColorStop(0, '#10141d');
    bgGrad.addColorStop(1, '#07090e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 800, 500);

    // Border Gold Frame
    ctx.strokeStyle = '#c59f4e';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, 760, 460);

    ctx.strokeStyle = 'rgba(197, 159, 78, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(28, 28, 744, 444);

    // Title
    ctx.fillStyle = '#c59f4e';
    ctx.font = 'bold 24px Cinzel, Georgia, serif';
    ctx.fillText('CYTADELA DURMSTRANG • PASZPORT CZARODZIEJA', 50, 70);

    ctx.font = 'italic 14px Georgia, serif';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText('Oficjalny Dokument Tożsamości Magicznej Akademii Północy', 50, 95);

    // Student Details
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Cinzel, Georgia, serif';
    ctx.fillText(studentName, 50, 160);

    ctx.font = '16px Georgia, serif';
    ctx.fillStyle = '#d1d5db';
    ctx.fillText(`Status / Rola: ${roleName}`, 50, 200);
    ctx.fillText(`Zakon: ${currentHouse?.name || 'Reinhall'}`, 50, 235);
    ctx.fillText(`Sygnatura Runiczna: ${runicId}`, 50, 270);
    ctx.fillText(`Data Przyjęcia: XIX Rok Szkolny`, 50, 305);

    // House Emblem Symbol
    ctx.fillStyle = '#c59f4e';
    ctx.font = 'bold 70px serif';
    ctx.fillText('ᛞ', 620, 180);

    // Seal
    ctx.fillStyle = '#8b2020';
    ctx.beginPath();
    ctx.arc(650, 360, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#daa520';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#ffe599';
    ctx.font = 'bold 12px Cinzel, Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('PIECZĘĆ', 650, 355);
    ctx.fillText('DURMSTRANG', 650, 375);

    // Trigger Download
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `Paszport_Durmstrang_${studentName.replace(/\s+/g, '_')}.png`;
    link.href = dataUrl;
    link.click();
    playCoinSound();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 5, 8, 0.88)',
        backdropFilter: 'blur(10px)',
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
          boxShadow: '0 12px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(197, 159, 78, 0.25)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '680px',
          overflow: 'hidden',
          animation: 'fadeIn 0.3s ease-out'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.2rem 1.5rem',
            borderBottom: '1px solid rgba(197, 159, 78, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.4)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Award size={20} style={{ color: 'var(--gold-ancient)' }} />
            <h3 style={{ margin: 0, color: '#ffffff', fontFamily: 'var(--font-heading)', fontSize: '1.15rem' }}>
              Paszport Czarodzieja Cytadeli
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              display: 'flex'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Passport Parchment Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div
            ref={passportCardRef}
            style={{
              background: 'radial-gradient(circle at 50% 30%, #1e2533 0%, #0d111a 100%)',
              border: '2px solid var(--gold-ancient)',
              borderRadius: '8px',
              padding: '1.5rem',
              position: 'relative',
              boxShadow: 'inset 0 0 25px rgba(0,0,0,0.8), 0 4px 15px rgba(0,0,0,0.6)'
            }}
          >
            {/* Runic Watermark */}
            <div
              style={{
                position: 'absolute',
                right: '25px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '9rem',
                color: 'rgba(197, 159, 78, 0.05)',
                fontFamily: 'var(--font-heading)',
                pointerEvents: 'none',
                userSelect: 'none'
              }}
            >
              ᛞ
            </div>

            {/* Passport Header */}
            <div style={{ borderBottom: '1px solid rgba(197, 159, 78, 0.3)', paddingBottom: '0.8rem', marginBottom: '1.2rem' }}>
              <span style={{ fontSize: '0.7rem', letterSpacing: '0.25em', color: 'var(--gold-ancient)', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
                Akademia Magii Północy
              </span>
              <h2 style={{ margin: '0.2rem 0 0 0', fontSize: '1.4rem', color: '#ffffff', fontFamily: 'var(--font-heading)' }}>
                DURMSTRANG • PASSPORT & DOSSIER
              </h2>
            </div>

            {/* Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1.5rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#9ca3af', textTransform: 'uppercase' }}>Czarodziej</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f3f4f6', fontFamily: 'var(--font-heading)' }}>
                    {studentName}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#9ca3af', textTransform: 'uppercase' }}>Zakon</span>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--gold-ancient)' }}>
                      {currentHouse?.name || 'Reinhall'}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#9ca3af', textTransform: 'uppercase' }}>Ranga</span>
                    <div style={{ fontSize: '0.95rem', color: '#d1d5db' }}>
                      {roleName}
                    </div>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.72rem', color: '#9ca3af', textTransform: 'uppercase' }}>Identyfikator Runiczny</span>
                  <div style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: '#93c5fd' }}>
                    {runicId}
                  </div>
                </div>
              </div>

              {/* Wax Seal Stamp on Card */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                <WaxSeal label="DURMSTRANG" color="#7a1818" />
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
              * Gotowy dokument graficzny do prezentacji na Discordzie
            </span>

            <button
              onClick={downloadPassportPng}
              style={{
                background: 'linear-gradient(135deg, var(--gold-ancient) 0%, #9a7628 100%)',
                color: '#000000',
                border: 'none',
                borderRadius: '6px',
                padding: '0.7rem 1.2rem',
                fontWeight: 700,
                fontSize: '0.9rem',
                fontFamily: 'var(--font-heading)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 15px rgba(197, 159, 78, 0.4)'
              }}
            >
              <Download size={16} /> Pobierz Paszport (PNG)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
