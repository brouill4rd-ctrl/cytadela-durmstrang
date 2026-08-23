import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import { SecretRune } from '../components/SecretRune';
import { ItemPlaceholder } from '../components/ItemPlaceholder';
import { ItemInspectorModal } from '../components/ItemInspectorModal';
import { ShoppingListsSection } from '../components/ShoppingListsSection';
import { ScandinavianLotteryModal } from '../components/ScandinavianLotteryModal';
import {
  ShoppingBag,
  Coins,
  Shield,
  Sparkles,
  Search,
  Filter,
  Check,
  Package,
  Wand2,
  Bookmark,
  Award,
  Store,
  Eye,
  Dice5,
  Building
} from 'lucide-react';

export const MarkethallView = () => {
  const {
    storeItems,
    shops,
    currentUser,
    buyStoreItem,
    houses,
    setActiveView
  } = useSchool();

  const { playCoinSound, playWandSwoosh } = useSound();

  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'shopping-lists' | 'lottery'
  const [selectedShop, setSelectedShop] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRarity, setSelectedRarity] = useState('all');
  const [inspectingItem, setInspectingItem] = useState(null);

  const categories = [
    { id: 'all', label: 'Wszystkie Kategorie' },
    { id: 'wands', label: 'Różdżki' },
    { id: 'robes', label: 'Szaty & Opończe' },
    { id: 'books', label: 'Grimuary & Księgi' },
    { id: 'potions', label: 'Eliksiry & Toksyny' },
    { id: 'equipment', label: 'Wyposażenie Bojowe' },
    { id: 'companions', label: 'Magiczni Towarzysze' },
    { id: 'artifacts', label: 'Artefakty & Talizmany' }
  ];

  const filteredItems = (storeItems || []).filter(item => {
    const matchesShop = selectedShop === 'all' || item.shopId === selectedShop;
    const matchesCat = selectedCategory === 'all' || item.categorySlug === selectedCategory;
    const matchesRarity = selectedRarity === 'all' || item.rarity === selectedRarity;
    const matchesSearch = (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.shopName || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesShop && matchesCat && matchesRarity && matchesSearch;
  });

  const handleBuy = (item) => {
    playCoinSound();
    buyStoreItem(item);
  };

  const isItemOwned = (itemId) => {
    return (currentUser?.inventory || []).some(i => i.id === itemId);
  };

  const currentBalance = currentUser?.currency || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* =========================================================================
          1. HEADER WITH WALLET & BANK LINK
          ========================================================================= */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <span style={{ color: 'var(--gold-ancient)', fontSize: '0.85rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
            Targowisko Fiordów & Składy Runiczne
          </span>
          <h1 style={{ fontSize: '2.4rem', color: '#ffffff', marginTop: '0.3rem', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>
            Rynek Magiczny (Kaupangr)
          </h1>
          <p style={{ color: '#9ca3af', maxWidth: '650px', fontSize: '0.98rem' }}>
            Odwiedzaj mistrzowskie kramy rzemieślników Północy. Kompletuj oficjalne wyprawki szkolne, bierz udział w Loterii Odyna i zarządzaj skrytką bankową w Banku Skirnirów.
          </p>
        </div>

        {/* Student Wallet Display & Quick Bank Button */}
        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div
            className="gothic-card"
            style={{
              padding: '1rem 1.6rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              border: '1px solid var(--gold-ancient)',
              background: 'linear-gradient(135deg, rgba(25, 32, 45, 0.95) 0%, rgba(12, 15, 22, 0.98) 100%)'
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'rgba(197, 159, 78, 0.15)',
                border: '1px solid var(--gold-ancient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Coins size={20} color="var(--gold-ancient)" />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Twoja Sakiewka
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: '#f7dca0', lineHeight: 1.1 }}>
                {currentBalance} ᛋ
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              playWandSwoosh();
              setActiveView('bank');
            }}
            className="btn-durmstrang"
            style={{ padding: '0.9rem 1.4rem', fontSize: '0.85rem' }}
          >
            <Building size={16} /> Bank Skirnirów →
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. TOP VIEW SWITCHER TABS (CATALOG / SHOPPING LISTS / LOTTERY)
          ========================================================================= */}
      <div style={{ display: 'flex', gap: '0.6rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.6rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('catalog')}
          style={{
            padding: '0.65rem 1.4rem',
            borderRadius: '6px',
            border: activeTab === 'catalog' ? '1px solid var(--gold-ancient)' : '1px solid transparent',
            background: activeTab === 'catalog' ? 'rgba(197, 159, 78, 0.2)' : 'transparent',
            color: activeTab === 'catalog' ? '#ffffff' : '#94a3b8',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem'
          }}
        >
          <ShoppingBag size={16} /> Wszystkie Kramy & Artefakty ({storeItems.length})
        </button>

        <button
          onClick={() => setActiveTab('shopping-lists')}
          style={{
            padding: '0.65rem 1.4rem',
            borderRadius: '6px',
            border: activeTab === 'shopping-lists' ? '1px solid var(--gold-ancient)' : '1px solid transparent',
            background: activeTab === 'shopping-lists' ? 'rgba(197, 159, 78, 0.2)' : 'transparent',
            color: activeTab === 'shopping-lists' ? '#ffffff' : '#94a3b8',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem'
          }}
        >
          <Award size={16} color="var(--gold-glow)" /> Listy Zakupów & Wyprawki (Punkty z automatu)
        </button>

        <button
          onClick={() => setActiveTab('lottery')}
          style={{
            padding: '0.65rem 1.4rem',
            borderRadius: '6px',
            border: activeTab === 'lottery' ? '1px solid #d8b4fe' : '1px solid rgba(168, 85, 247, 0.3)',
            background: activeTab === 'lottery' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
            color: '#d8b4fe',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            marginLeft: 'auto'
          }}
        >
          <Dice5 size={16} /> ᛈ Skandynawska Loteria Odyna
        </button>
      </div>

      {/* =========================================================================
          3. TAB CONTENT: 1. CATALOG / 2. SHOPPING LISTS / 3. LOTTERY
          ========================================================================= */}

      {/* TAB 1: FULL STORE CATALOG */}
      {activeTab === 'catalog' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
          {/* Shop Selector Pills */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {(shops || []).map(shop => (
              <button
                key={shop.id}
                onClick={() => setSelectedShop(shop.id)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: selectedShop === shop.id ? '1px solid var(--gold-ancient)' : '1px solid rgba(255,255,255,0.08)',
                  background: selectedShop === shop.id ? 'rgba(197, 159, 78, 0.2)' : 'rgba(14, 18, 26, 0.7)',
                  color: selectedShop === shop.id ? '#ffe8aa' : '#cbd5e1',
                  fontSize: '0.82rem',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>{shop.icon}</span>
                <span>{shop.name}</span>
              </button>
            ))}
          </div>

          {/* Filter, Rarity and Search Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    padding: '0.35rem 0.8rem',
                    borderRadius: '4px',
                    border: selectedCategory === cat.id ? '1px solid var(--gold-ancient)' : '1px solid rgba(255,255,255,0.06)',
                    background: selectedCategory === cat.id ? 'rgba(197, 159, 78, 0.15)' : 'transparent',
                    color: selectedCategory === cat.id ? '#ffe8aa' : '#94a3b8',
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              <select
                value={selectedRarity}
                onChange={(e) => setSelectedRarity(e.target.value)}
                className="gothic-input"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
              >
                <option value="all">Wszystkie Rzadkości</option>
                <option value="Niezbędny">Niezbędny</option>
                <option value="Zwykły">Zwykły</option>
                <option value="Rzadki">Rzadki</option>
                <option value="Epicki">Epicki</option>
                <option value="Legendarne">Legendarne</option>
              </select>

              <div style={{ position: 'relative', width: '240px' }}>
                <Search size={14} color="var(--gold-ancient)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Szukaj artefaktu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="gothic-input"
                  style={{ width: '100%', paddingLeft: '2rem', fontSize: '0.82rem' }}
                />
              </div>
            </div>
          </div>

          {/* Hidden Store Secret Rune */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <SecretRune secretId="rune-algiz-store" />
          </div>

          {/* Store Catalog Grid with Visual Placeholders */}
          <div className="grid-3">
            {filteredItems.map(item => {
              const owned = isItemOwned(item.id);
              const house = item.houseExclusive ? houses[item.houseExclusive] : null;
              const canAfford = currentBalance >= item.price;

              return (
                <div
                  key={item.id}
                  className="gothic-card runic-corners"
                  style={{
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    background: 'rgba(13, 16, 23, 0.92)',
                    border: house ? `1px solid ${house.colors.border}` : '1px solid rgba(197, 159, 78, 0.3)',
                    gap: '1.2rem',
                    transition: 'all 0.25s ease'
                  }}
                >
                  <div>
                    {/* Item Art Placeholder Box */}
                    <div
                      style={{ cursor: 'pointer', marginBottom: '1rem' }}
                      onClick={() => setInspectingItem(item)}
                      title="Kliknij, aby otworzyć szczegółowy podgląd i ryciny"
                    >
                      <ItemPlaceholder item={item} size="normal" />
                    </div>

                    {/* Shop and Exclusive tags */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Store size={11} color="var(--gold-ancient)" /> {item.shopName}
                      </span>
                      {house && (
                        <span style={{ fontSize: '0.68rem', color: house.colors.secondary, fontWeight: 600 }}>
                          Tylko: {house.name}
                        </span>
                      )}
                    </div>

                    <h3
                      onClick={() => setInspectingItem(item)}
                      style={{ fontSize: '1.15rem', color: '#ffffff', marginBottom: '0.4rem', lineHeight: 1.3, cursor: 'pointer' }}
                    >
                      {item.name}
                    </h3>

                    <p style={{ color: '#b0b7c3', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '0.8rem' }}>
                      {item.description}
                    </p>

                    {item.lore && (
                      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.65rem 0.8rem', borderRadius: '4px', borderLeft: '2px solid var(--gold-ancient)', fontSize: '0.78rem', color: '#cbd5e1', fontStyle: 'italic', marginBottom: '0.8rem' }}>
                        „{item.lore}”
                      </div>
                    )}
                  </div>

                  {/* Purchase & Inspect Footer */}
                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#8c95a6', textTransform: 'uppercase' }}>Cena:</div>
                      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--gold-glow)' }}>
                        {item.price} ᛋ
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        onClick={() => setInspectingItem(item)}
                        style={{
                          padding: '0.5rem 0.7rem',
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: '4px',
                          color: '#cbd5e1',
                          cursor: 'pointer'
                        }}
                        title="Otwórz ryciny i szczegóły"
                      >
                        <Eye size={14} />
                      </button>

                      {owned ? (
                        <button
                          disabled
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.5rem 1rem',
                            background: 'rgba(46, 196, 182, 0.15)',
                            border: '1px solid #2ec4b6',
                            borderRadius: '4px',
                            color: '#8cefe6',
                            fontSize: '0.82rem',
                            fontFamily: 'var(--font-heading)',
                            fontWeight: 600
                          }}
                        >
                          <Check size={14} /> Posiadasz
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBuy(item)}
                          disabled={!canAfford}
                          className="btn-durmstrang"
                          style={{
                            padding: '0.5rem 1rem',
                            fontSize: '0.82rem',
                            opacity: canAfford ? 1 : 0.5,
                            cursor: canAfford ? 'pointer' : 'not-allowed'
                          }}
                        >
                          <Coins size={13} /> Kup
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: SHOPPING LISTS & SCHOOL SUPPLY CHECKLIST */}
      {activeTab === 'shopping-lists' && (
        <ShoppingListsSection onInspectItem={(item) => setInspectingItem(item)} />
      )}

      {/* TAB 3: SCANDINAVIAN LOTTERY */}
      {activeTab === 'lottery' && (
        <ScandinavianLotteryModal />
      )}

      {/* Item Inspector Modal */}
      {inspectingItem && (
        <ItemInspectorModal
          item={inspectingItem}
          isOpen={!!inspectingItem}
          onClose={() => setInspectingItem(null)}
        />
      )}
    </div>
  );
};
