import React from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import { ItemPlaceholder } from './ItemPlaceholder';
import { X, Coins, Check, Sparkles, Shield, Bookmark, Store } from 'lucide-react';

export const ItemInspectorModal = ({ item, isOpen, onClose }) => {
  const { currentUser, buyStoreItem, houses, shoppingLists } = useSchool();
  const { playCoinSound, playWandSwoosh } = useSound();

  if (!isOpen || !item) return null;

  const isOwned = (currentUser?.inventory || []).some(i => i.id === item.id);
  const canAfford = (currentUser?.currency || 0) >= item.price;
  const house = item.houseExclusive ? houses[item.houseExclusive] : null;

  // Check which shopping lists require this item
  const relatedLists = (shoppingLists || []).filter(list =>
    (list.requiredItemIds || []).includes(item.id)
  );

  const handleBuy = async () => {
    playCoinSound();
    const success = await buyStoreItem(item);
    if (success) {
      // Keep modal open or close
    }
  };

  // Handle ESC key
  React.useEffect(() => {
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
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        background: 'rgba(4, 7, 12, 0.88)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        animation: 'fadeIn 0.25s ease'
      }}
    >
      <div
        className="gothic-card runic-corners"
        style={{
          width: '100%',
          maxWidth: '680px',
          background: 'linear-gradient(135deg, rgba(14, 18, 27, 0.98) 0%, rgba(8, 11, 17, 0.99) 100%)',
          border: '1px solid var(--gold-ancient)',
          borderRadius: '12px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 30px rgba(197, 159, 78, 0.25)',
          padding: '2rem',
          position: 'relative',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '0.15rem 0.6rem',
                  borderRadius: '4px',
                  background: item.rarity === 'Legendarne' ? 'rgba(197, 159, 78, 0.25)' : item.rarity === 'Epicki' ? 'rgba(155, 114, 207, 0.25)' : 'rgba(255,255,255,0.08)',
                  border: item.rarity === 'Legendarne' ? '1px solid var(--gold-ancient)' : item.rarity === 'Epicki' ? '1px solid #9b72cf' : '1px solid rgba(255,255,255,0.15)',
                  color: item.rarity === 'Legendarne' ? '#ffe8aa' : item.rarity === 'Epicki' ? '#d8c2ff' : '#cbd5e1',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700
                }}
              >
                {item.rarity}
              </span>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Store size={12} color="var(--gold-ancient)" /> {item.shopName}
              </span>
            </div>
            <h2 style={{ fontSize: '1.5rem', color: '#ffffff', fontFamily: 'var(--font-heading)', lineHeight: 1.2 }}>
              {item.name}
            </h2>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#cbd5e1',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Grid: Artwork Left, Details Right */}
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1.8rem', marginBottom: '1.8rem' }}>
          <div>
            <ItemPlaceholder item={item} size="large" />
            <div style={{ textAlign: 'center', marginTop: '0.6rem', fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
              Rycina mistrzowska z archiwum Kaupangr
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <h4 style={{ fontSize: '0.82rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>
                Opis i Właściwości
              </h4>
              <p style={{ color: '#e2e8f0', fontSize: '0.92rem', lineHeight: 1.55, marginBottom: '1rem' }}>
                {item.description}
              </p>

              {item.lore && (
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    padding: '0.8rem 1rem',
                    borderRadius: '6px',
                    borderLeft: '3px solid var(--gold-ancient)',
                    fontSize: '0.84rem',
                    color: '#d1d5db',
                    fontStyle: 'italic',
                    marginBottom: '1rem'
                  }}
                >
                  „{item.lore}”
                </div>
              )}

              {/* Exclusive House constraint */}
              {house && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(197, 159, 78, 0.1)', padding: '0.5rem 0.8rem', borderRadius: '4px', border: `1px solid ${house.colors.border}`, marginBottom: '0.8rem' }}>
                  <Shield size={14} color={house.colors.secondary} />
                  <span style={{ fontSize: '0.8rem', color: house.colors.secondary, fontWeight: 600 }}>
                    Artefakt dedykowany dla Zakonu {house.name}
                  </span>
                </div>
              )}

              {/* Related Shopping Lists */}
              {relatedLists.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ice-crystal)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.3rem' }}>
                    <Bookmark size={12} color="var(--ice-crystal)" /> Część oficjalnych wyprawek:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {relatedLists.map(rl => (
                      <span key={rl.id} style={{ fontSize: '0.75rem', color: '#cbd5e1', background: 'rgba(164, 200, 225, 0.08)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(164, 200, 225, 0.2)' }}>
                        • {rl.title} (+{rl.rewardPoints} pkt)
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer with Price and Buy Button */}
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cena na Rynku:</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--gold-glow)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Coins size={20} color="var(--gold-ancient)" />
              {item.price} Skirnirów
            </div>
          </div>

          {isOwned ? (
            <button
              disabled
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.4rem',
                background: 'rgba(46, 196, 182, 0.15)',
                border: '1px solid #2ec4b6',
                borderRadius: '6px',
                color: '#8cefe6',
                fontSize: '0.9rem',
                fontFamily: 'var(--font-heading)',
                fontWeight: 700
              }}
            >
              <Check size={16} /> Posiadasz w Ekwipunku
            </button>
          ) : (
            <button
              onClick={handleBuy}
              disabled={!canAfford}
              className="btn-durmstrang"
              style={{
                padding: '0.65rem 1.4rem',
                fontSize: '0.9rem',
                opacity: canAfford ? 1 : 0.5,
                cursor: canAfford ? 'pointer' : 'not-allowed'
              }}
            >
              <Coins size={16} /> Kup Przedmiot ({item.price} ᛋ)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
