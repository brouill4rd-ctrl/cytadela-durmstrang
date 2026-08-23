import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import {
  CheckCircle2,
  Circle,
  Coins,
  Award,
  Sparkles,
  ChevronRight,
  Package,
  ShoppingBag,
  ExternalLink,
  Shield,
  Clock
} from 'lucide-react';

export const ShoppingListsSection = ({ onInspectItem }) => {
  const {
    shoppingLists,
    storeItems,
    currentUser,
    buyStoreItem,
    houses
  } = useSchool();

  const { playCoinSound, playRuneChime } = useSound();
  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'completed'

  const userInventory = currentUser?.inventory || [];
  const ownedItemIds = new Set(userInventory.map(i => i.id));
  const userHouse = currentUser?.house ? houses[currentUser.house] : null;

  // Map store items by ID for quick lookup
  const itemsMap = new Map((storeItems || []).map(i => [i.id, i]));

  const enrichedLists = (shoppingLists || []).map(list => {
    const requiredItems = (list.requiredItemIds || []).map(id => itemsMap.get(id) || { id, name: id, price: 100, icon: '📦', rarity: 'Zwykły' });
    const ownedCount = (list.requiredItemIds || []).filter(id => ownedItemIds.has(id)).length;
    const totalCount = (list.requiredItemIds || []).length;
    const isCompleted = list.isCompleted || (totalCount > 0 && ownedCount === totalCount);
    const progressPercent = totalCount > 0 ? Math.round((ownedCount / totalCount) * 100) : 0;

    return {
      ...list,
      requiredItems,
      ownedCount,
      totalCount,
      isCompleted,
      progressPercent
    };
  });

  const filteredLists = enrichedLists.filter(list => {
    if (filter === 'completed') return list.isCompleted;
    if (filter === 'pending') return !list.isCompleted;
    return true;
  });

  const handleQuickBuy = async (item) => {
    playCoinSound();
    await buyStoreItem(item);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Banner / Explainer */}
      <div
        className="gothic-card runic-corners"
        style={{
          padding: '1.8rem 2.2rem',
          background: 'linear-gradient(135deg, rgba(20, 26, 38, 0.95) 0%, rgba(10, 14, 22, 0.98) 100%)',
          border: '1px solid var(--gold-ancient)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}
      >
        <div style={{ maxWidth: '650px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--gold-ancient)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'var(--font-heading)' }}>
            <Award size={16} /> Oficjalny Program Przygotowania Adeptów
          </div>
          <h2 style={{ fontSize: '1.8rem', color: '#ffffff', marginTop: '0.3rem', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>
            Listy Zakupów & Wyprawki Szkolne
          </h2>
          <p style={{ color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.55 }}>
            Skompletuj wymagany rynsztunek na rynku Kaupangr. Gdy zakupisz wszystkie przedmioty z danej listy, zostanie ona <strong style={{ color: 'var(--gold-glow)' }}>automatycznie oznaczona jako wykonana</strong>, a Ty otrzymasz <strong style={{ color: '#8cefe6' }}>punkty dla swojego Zakonu</strong> oraz nagrodę w Skirnirach prosto do skrytki bankowej!
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '0.4rem', background: 'rgba(0,0,0,0.4)', padding: '0.35rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={() => setFilter('all')}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '4px',
              border: filter === 'all' ? '1px solid var(--gold-ancient)' : 'none',
              background: filter === 'all' ? 'rgba(197, 159, 78, 0.2)' : 'transparent',
              color: filter === 'all' ? '#ffe8aa' : '#94a3b8',
              fontSize: '0.8rem',
              fontFamily: 'var(--font-heading)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Wszystkie ({enrichedLists.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '4px',
              border: filter === 'pending' ? '1px solid #38bdf8' : 'none',
              background: filter === 'pending' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
              color: filter === 'pending' ? '#bae6fd' : '#94a3b8',
              fontSize: '0.8rem',
              fontFamily: 'var(--font-heading)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            W toku ({enrichedLists.filter(l => !l.isCompleted).length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '4px',
              border: filter === 'completed' ? '1px solid #2ec4b6' : 'none',
              background: filter === 'completed' ? 'rgba(46, 196, 182, 0.2)' : 'transparent',
              color: filter === 'completed' ? '#8cefe6' : '#94a3b8',
              fontSize: '0.8rem',
              fontFamily: 'var(--font-heading)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Ukończone ({enrichedLists.filter(l => l.isCompleted).length})
          </button>
        </div>
      </div>

      {/* Shopping Lists Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {filteredLists.map(list => {
          return (
            <div
              key={list.id}
              className="gothic-card runic-corners"
              style={{
                padding: '1.8rem',
                background: list.isCompleted
                  ? 'linear-gradient(135deg, rgba(13, 30, 26, 0.9) 0%, rgba(8, 18, 16, 0.95) 100%)'
                  : 'linear-gradient(135deg, rgba(14, 18, 26, 0.88) 0%, rgba(9, 12, 18, 0.95) 100%)',
                border: list.isCompleted ? '1px solid #2ec4b6' : '1px solid rgba(197, 159, 78, 0.3)',
                boxShadow: list.isCompleted ? '0 0 25px rgba(46, 196, 182, 0.15)' : 'none',
                transition: 'all 0.25s ease'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '10px',
                      background: list.isCompleted ? 'rgba(46, 196, 182, 0.2)' : 'rgba(197, 159, 78, 0.15)',
                      border: list.isCompleted ? '1px solid #2ec4b6' : '1px solid var(--gold-ancient)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.8rem'
                    }}
                  >
                    {list.icon}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-heading)' }}>
                        {list.category}
                      </span>
                      {list.isCompleted && (
                        <span style={{ background: '#2ec4b6', color: '#090d14', fontSize: '0.65rem', fontWeight: 800, padding: '0.1rem 0.5rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <CheckCircle2 size={12} /> ZREALIZOWANA
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: '1.35rem', color: '#ffffff', fontFamily: 'var(--font-heading)', marginTop: '0.15rem' }}>
                      {list.title}
                    </h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                      {list.subtitle}
                    </p>
                  </div>
                </div>

                {/* Rewards Cluster */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <div style={{ textAlign: 'right', background: 'rgba(0,0,0,0.35)', padding: '0.6rem 0.9rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase' }}>Nagroda za komplet:</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.15rem' }}>
                      <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--gold-glow)', fontFamily: 'var(--font-heading)' }}>
                        +{list.rewardPoints} pkt
                      </span>
                      <span style={{ color: '#64748b' }}>•</span>
                      <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#f7dca0', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Coins size={13} color="var(--gold-ancient)" /> +{list.rewardSkirnirs} ᛋ
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ marginBottom: '1.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.4rem' }}>
                  <span style={{ color: '#cbd5e1' }}>
                    Postęp skompletowania: <strong style={{ color: list.isCompleted ? '#8cefe6' : '#ffe8aa' }}>{list.ownedCount} / {list.totalCount} przedmiotów</strong>
                  </span>
                  <span style={{ fontWeight: 700, color: list.isCompleted ? '#8cefe6' : 'var(--gold-glow)' }}>
                    {list.progressPercent}%
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div
                    style={{
                      width: `${list.progressPercent}%`,
                      height: '100%',
                      background: list.isCompleted
                        ? 'linear-gradient(90deg, #2ec4b6 0%, #8cefe6 100%)'
                        : 'linear-gradient(90deg, #c59f4e 0%, #f7dca0 100%)',
                      borderRadius: '4px',
                      transition: 'width 0.4s ease'
                    }}
                  />
                </div>
              </div>

              {/* Items Checklist Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.8rem' }}>
                {list.requiredItems.map(item => {
                  const isOwned = ownedItemIds.has(item.id);
                  const canAfford = (currentUser?.currency || 0) >= item.price;

                  return (
                    <div
                      key={item.id}
                      style={{
                        background: isOwned ? 'rgba(46, 196, 182, 0.08)' : 'rgba(10, 14, 20, 0.7)',
                        border: isOwned ? '1px solid rgba(46, 196, 182, 0.35)' : '1px solid rgba(255, 255, 255, 0.07)',
                        borderRadius: '6px',
                        padding: '0.75rem 0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.6rem'
                      }}
                    >
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, cursor: 'pointer' }}
                        onClick={() => onInspectItem && onInspectItem(item)}
                        title="Kliknij, aby obejrzeć szczegóły"
                      >
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '6px',
                            background: isOwned ? 'rgba(46, 196, 182, 0.15)' : 'rgba(255,255,255,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.2rem',
                            flexShrink: 0
                          }}
                        >
                          {item.icon || '📦'}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: isOwned ? '#ffffff' : '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                            {item.price} Skirnirów
                          </div>
                        </div>
                      </div>

                      {/* Status / Quick Buy Action */}
                      <div style={{ flexShrink: 0 }}>
                        {isOwned ? (
                          <span style={{ fontSize: '0.72rem', color: '#8cefe6', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <CheckCircle2 size={14} /> Posiadasz
                          </span>
                        ) : (
                          <button
                            onClick={() => handleQuickBuy(item)}
                            disabled={!canAfford}
                            style={{
                              padding: '0.35rem 0.75rem',
                              borderRadius: '4px',
                              background: canAfford ? 'linear-gradient(135deg, #c59f4e 0%, #8a6c2f 100%)' : 'rgba(255,255,255,0.05)',
                              border: canAfford ? '1px solid var(--gold-ancient)' : '1px solid rgba(255,255,255,0.1)',
                              color: canAfford ? '#05070a' : '#64748b',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              cursor: canAfford ? 'pointer' : 'not-allowed',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            <Coins size={11} /> Kup ({item.price} ᛋ)
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Lore footer */}
              {list.lore && (
                <div style={{ marginTop: '1.2rem', paddingTop: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>
                  {list.lore}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
