import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import { SecretRune } from '../components/SecretRune';
import {
  Scroll,
  BookOpen,
  Shield,
  Key,
  Flame,
  Feather,
  Sparkles,
  Eye,
  Lock,
  Unlock
} from 'lucide-react';

export const LoreArchiveView = () => {
  const { lore, discoveredSecrets, houses } = useSchool();
  const { playWandSwoosh } = useSound();

  const [activeTab, setActiveTab] = useState('history'); // 'history' | 'founders' | 'bestiary' | 'central-secret'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ color: 'var(--gold-ancient)', fontSize: '0.85rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
            Wielkie Archiwum Skandzy
          </span>
          <h1 style={{ fontSize: '2.4rem', color: '#ffffff', marginTop: '0.3rem', marginBottom: '0.5rem' }}>
            Kroniki & Lore Twierdzy Magii (TMD)
          </h1>
          <p style={{ color: '#9ca3af', maxWidth: '700px', fontSize: '0.98rem' }}>
            Ponad siedemset lat historii, zakazanych traktatów, legend o założycielach oraz tajemnic spoczywających pod wieczną zmarzliną.
          </p>
        </div>

        {/* Hidden Rune in Lore */}
        <SecretRune secretId="rune-ansuz-lore" />
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.8rem', borderBottom: '1px solid rgba(197, 159, 78, 0.25)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => {
            playWandSwoosh();
            setActiveTab('history');
          }}
          style={{
            padding: '0.65rem 1.2rem',
            background: activeTab === 'history' ? 'rgba(197, 159, 78, 0.15)' : 'transparent',
            border: activeTab === 'history' ? '1px solid var(--gold-ancient)' : '1px solid transparent',
            borderRadius: '4px',
            color: activeTab === 'history' ? '#ffffff' : '#9ca3af',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <Scroll size={16} /> Kroniki Historyczne
        </button>

        <button
          onClick={() => {
            playWandSwoosh();
            setActiveTab('founders');
          }}
          style={{
            padding: '0.65rem 1.2rem',
            background: activeTab === 'founders' ? 'rgba(197, 159, 78, 0.15)' : 'transparent',
            border: activeTab === 'founders' ? '1px solid var(--gold-ancient)' : '1px solid transparent',
            borderRadius: '4px',
            color: activeTab === 'founders' ? '#ffffff' : '#9ca3af',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <Shield size={16} /> Czterej Założyciele
        </button>

        <button
          onClick={() => {
            playWandSwoosh();
            setActiveTab('bestiary');
          }}
          style={{
            padding: '0.65rem 1.2rem',
            background: activeTab === 'bestiary' ? 'rgba(197, 159, 78, 0.15)' : 'transparent',
            border: activeTab === 'bestiary' ? '1px solid var(--gold-ancient)' : '1px solid transparent',
            borderRadius: '4px',
            color: activeTab === 'bestiary' ? '#ffffff' : '#9ca3af',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <Flame size={16} /> Bestiariusz Północy
        </button>

        <button
          onClick={() => {
            playWandSwoosh();
            setActiveTab('central-secret');
          }}
          style={{
            padding: '0.65rem 1.2rem',
            background: activeTab === 'central-secret' ? 'rgba(155, 114, 207, 0.25)' : 'transparent',
            border: activeTab === 'central-secret' ? '1px solid #9b72cf' : '1px solid transparent',
            borderRadius: '4px',
            color: activeTab === 'central-secret' ? '#d8c2ff' : '#9ca3af',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <Key size={16} color="#d8c2ff" /> Centralna Tajemnica Twierdzy (TMD)
        </button>
      </div>

      {/* 1. HISTORY CHRONICLES */}
      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {lore.history.map(entry => (
            <div
              key={entry.id}
              className="gothic-card runic-corners"
              style={{
                padding: '2.2rem',
                background: 'rgba(14, 18, 26, 0.85)',
                border: '1px solid rgba(197, 159, 78, 0.3)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.8rem' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {entry.category} • {entry.author}
                  </span>
                  <h3 style={{ fontSize: '1.4rem', color: '#ffffff', marginTop: '0.2rem' }}>
                    {entry.title}
                  </h3>
                </div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--gold-glow)' }}>
                  {entry.date}
                </div>
              </div>

              <p style={{ color: '#cfd7e4', fontSize: '1rem', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                {entry.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* 2. FOUNDERS DEEP LORE */}
      {activeTab === 'founders' && (
        <div className="grid-2">
          {lore.founders.map(founder => {
            const h = houses[founder.house];

            return (
              <div
                key={founder.id}
                className="gothic-card runic-corners"
                style={{
                  padding: '2rem',
                  background: `radial-gradient(circle at 90% 10%, ${h ? h.colors.bgDark : 'rgba(25, 32, 45, 0.9)'} 0%, rgba(10, 13, 18, 0.98) 70%)`,
                  border: h ? `1px solid ${h.colors.border}` : '1px solid var(--gold-ancient)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.2rem' }}>
                  <div
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.05)',
                      border: `1.5px solid ${h ? h.colors.secondary : 'var(--gold-ancient)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem'
                    }}
                  >
                    {founder.avatar}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', color: h ? h.colors.secondary : 'var(--gold-ancient)', letterSpacing: '0.1em' }}>
                      {h ? h.name : 'Założyciel'}
                    </div>
                    <h3 style={{ fontSize: '1.35rem', color: '#ffffff' }}>{founder.name}</h3>
                    <div style={{ fontSize: '0.85rem', color: '#a0aec0', fontStyle: 'italic' }}>{founder.title}</div>
                  </div>
                </div>

                <p style={{ color: '#cfd7e4', fontSize: '0.95rem', lineHeight: 1.7 }}>
                  {founder.lore}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. ARCTIC BESTIARY */}
      {activeTab === 'bestiary' && (
        <div className="grid-3">
          {lore.bestiary.map((beast, idx) => (
            <div
              key={idx}
              className="gothic-card"
              style={{
                padding: '1.8rem',
                background: 'rgba(14, 18, 26, 0.9)',
                border: '1px solid rgba(197, 159, 78, 0.25)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                <h3 style={{ fontSize: '1.15rem', color: '#ffffff' }}>{beast.name}</h3>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem', fontSize: '0.75rem' }}>
                <span style={{ background: 'rgba(192, 43, 43, 0.2)', border: '1px solid #c02b2b', color: '#ff9e9e', padding: '0.15rem 0.5rem', borderRadius: '3px' }}>
                  {beast.dangerLevel}
                </span>
                <span style={{ background: 'rgba(255,255,255,0.05)', color: '#9ca3af', padding: '0.15rem 0.5rem', borderRadius: '3px' }}>
                  Siedlisko: {beast.habitat}
                </span>
              </div>
              <p style={{ color: '#b5bdcb', fontSize: '0.9rem', lineHeight: 1.6 }}>
                {beast.description}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* 4. CENTRAL SECRET TRACKER */}
      {activeTab === 'central-secret' && (
        <div
          className="gothic-card runic-corners"
          style={{
            padding: '2.5rem',
            background: 'radial-gradient(circle at 50% 20%, rgba(35, 22, 56, 0.9) 0%, rgba(9, 11, 16, 0.98) 80%)',
            border: '2px solid #9b72cf',
            boxShadow: '0 20px 50px rgba(0,0,0,0.95), 0 0 30px rgba(155, 114, 207, 0.3)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem', color: '#d8c2ff' }}>
            <Key size={24} />
            <h2 style={{ fontSize: '1.8rem', color: '#ffffff' }}>
              {lore.centralSecret.title}
            </h2>
          </div>

          <div style={{ padding: '0.5rem 1rem', background: 'rgba(155, 114, 207, 0.15)', border: '1px solid #9b72cf', borderRadius: '4px', color: '#d8c2ff', fontSize: '0.85rem', display: 'inline-block', marginBottom: '1.5rem' }}>
            Status: {lore.centralSecret.status} (Odkryto {discoveredSecrets.length} / 4 wskazówek)
          </div>

          <p style={{ color: '#cfd7e4', fontSize: '1.02rem', lineHeight: 1.8, marginBottom: '2rem' }}>
            {lore.centralSecret.description}
          </p>

          <h3 style={{ fontSize: '1.15rem', color: '#ffffff', marginBottom: '1rem' }}>
            Cztery Fragmenty Pieczęci w Twierdzy Magii:
          </h3>

          <div className="grid-2">
            {lore.centralSecret.clues.map((clue, i) => {
              const isFound = discoveredSecrets.length > i;

              return (
                <div
                  key={clue.id}
                  style={{
                    padding: '1.25rem',
                    background: isFound ? 'rgba(34, 22, 56, 0.6)' : 'rgba(0, 0, 0, 0.4)',
                    border: isFound ? '1px solid #9b72cf' : '1px dashed rgba(255, 255, 255, 0.15)',
                    borderRadius: '4px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <h4 style={{ fontSize: '0.95rem', color: isFound ? '#ffffff' : '#6b7280', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {isFound ? <Unlock size={15} color="#d8c2ff" /> : <Lock size={15} color="#4b5563" />}
                      {clue.name}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{clue.foundIn}</span>
                  </div>

                  {isFound ? (
                    <p style={{ color: '#d8c2ff', fontStyle: 'italic', fontSize: '0.88rem', lineHeight: 1.5 }}>
                      „{clue.text}”
                    </p>
                  ) : (
                    <p style={{ color: '#4b5563', fontSize: '0.82rem', fontStyle: 'italic' }}>
                      [Pieczęć nieodkryta — zbadaj wskazówki na mapie i w zakątkach twierdzy]
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
