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
          1. CENTERED MAJESTIC HEADER WITH WALLET & QUICK ACTIONS
          ========================================================================= */}
      <div
        className="gothic-card runic-corners"
        style={{
          padding: '2.5rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative',
          background: 'radial-gradient(ellipse at 50% 30%, rgba(26, 32, 44, 0.95) 0%, rgba(10, 13, 19, 0.98) 100%)',
          border: '1px solid var(--gold-ancient)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.8), inset 0 0 35px rgba(197, 159, 78, 0.12)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
          <span style={{ color: 'var(--gold-ancient)', fontSize: '0.82rem', letterSpacing: '0.22em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
            ᚲ • TARGOWISKO FIORDÓW & SKŁADY RUNICZNE • ᛟ
          </span>
        </div>

        <h1
          style={{
            fontSize: '2.8rem',
            color: '#ffffff',
            marginTop: '0.2rem',
            marginBottom: '0.6rem',
            fontFamily: 'var(--font-heading)',
            textShadow: '0 4px 20px rgba(0,0,0,0.9), 0 0 15px rgba(197, 159, 78, 0.35)'
          }}
        >
          Rynek Magiczny (Kaupangr)
        </h1>

        <p
          style={{
            color: '#cbd5e1',
            maxWidth: '740px',
            fontSize: '1rem',
            lineHeight: 1.6,
            marginBottom: '1.6rem',
            marginInline: 'auto'
          }}
        >
          Odwiedzaj mistrzowskie kramy rzemieślników Północy. Zaopatruj się w autentyczne różdżki, grimuary i opończe, kompletuj oficjalne wyprawki szkolne oraz bierz udział w Loterii Odyna.
        </p>

        {/* Centered Student Wallet Display & Quick Bank Buttons */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
          <div
            style={{
              padding: '0.75rem 1.6rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.9rem',
              borderRadius: '8px',
              border: '1px solid var(--gold-ancient)',
              background: 'linear-gradient(135deg, rgba(30, 38, 52, 0.95) 0%, rgba(14, 18, 26, 0.98) 100%)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.6)'
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'rgba(197, 159, 78, 0.2)',
                border: '1px solid var(--gold-ancient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Coins size={18} color="var(--gold-ancient)" />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>
                Twoja Sakiewka
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 800, color: '#f7dca0', lineHeight: 1.1 }}>
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
            style={{ padding: '0.85rem 1.5rem', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Building size={16} /> Skarbiec Banku Skirnirów →
          </button>

          {(currentUser?.role === 'admin' || currentUser?.role === 'headmaster') && (
            <button
              onClick={() => {
                playWandSwoosh();
                setActiveView('admin');
              }}
              style={{
                padding: '0.85rem 1.3rem',
                borderRadius: '6px',
                background: 'rgba(234, 179, 8, 0.15)',
                border: '1px solid rgba(234, 179, 8, 0.4)',
                color: '#fde047',
                fontSize: '0.85rem',
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s ease'
              }}
            >
              <Store size={15} /> Zarządzaj w CMS
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          2. CENTERED TOP VIEW SWITCHER TABS (CATALOG / SHOPPING LISTS / LOTTERY)
          ========================================================================= */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0.8rem',
          borderBottom: '1px solid rgba(197, 159, 78, 0.2)',
          paddingBottom: '0.8rem',
          flexWrap: 'wrap'
        }}
      >
        <button
          onClick={() => setActiveTab('catalog')}
          style={{
            padding: '0.75rem 1.6rem',
            borderRadius: '6px',
            border: activeTab === 'catalog' ? '1px solid var(--gold-ancient)' : '1px solid rgba(255,255,255,0.08)',
            background: activeTab === 'catalog' ? 'rgba(197, 159, 78, 0.25)' : 'rgba(14, 18, 26, 0.6)',
            color: activeTab === 'catalog' ? '#ffffff' : '#94a3b8',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.92rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'catalog' ? '0 0 15px rgba(197, 159, 78, 0.2)' : 'none'
          }}
        >
          <ShoppingBag size={17} color="var(--gold-ancient)" /> Wszystkie Kramy & Artefakty ({storeItems.length})
        </button>

        <button
          onClick={() => setActiveTab('shopping-lists')}
          style={{
            padding: '0.75rem 1.6rem',
            borderRadius: '6px',
            border: activeTab === 'shopping-lists' ? '1px solid var(--gold-ancient)' : '1px solid rgba(255,255,255,0.08)',
            background: activeTab === 'shopping-lists' ? 'rgba(197, 159, 78, 0.25)' : 'rgba(14, 18, 26, 0.6)',
            color: activeTab === 'shopping-lists' ? '#ffffff' : '#94a3b8',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.92rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'shopping-lists' ? '0 0 15px rgba(197, 159, 78, 0.2)' : 'none'
          }}
        >
          <Award size={17} color="var(--gold-glow)" /> Listy Zakupów & Wyprawki
        </button>

        <button
          onClick={() => setActiveTab('lottery')}
          style={{
            padding: '0.75rem 1.6rem',
            borderRadius: '6px',
            border: activeTab === 'lottery' ? '1px solid #d8b4fe' : '1px solid rgba(168, 85, 247, 0.3)',
            background: activeTab === 'lottery' ? 'rgba(168, 85, 247, 0.25)' : 'rgba(14, 18, 26, 0.6)',
            color: '#d8b4fe',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.92rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'lottery' ? '0 0 15px rgba(168, 85, 247, 0.25)' : 'none'
          }}
        >
          <Dice5 size={17} color="#d8b4fe" /> ᛈ Skandynawska Loteria Odyna
        </button>
      </div>

      {/* =========================================================================
          3. TAB CONTENT: 1. CATALOG / 2. SHOPPING LISTS / 3. LOTTERY
          ========================================================================= */}

      {/* TAB 1: FULL STORE CATALOG */}
      {activeTab === 'catalog' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Centered Shop Selector Pills */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
            {(shops || []).map(shop => (
              <button
                key={shop.id}
                onClick={() => setSelectedShop(shop.id)}
                style={{
                  padding: '0.55rem 1.1rem',
                  borderRadius: '6px',
                  border: selectedShop === shop.id ? '1px solid var(--gold-ancient)' : '1px solid rgba(255,255,255,0.08)',
                  background: selectedShop === shop.id ? 'rgba(197, 159, 78, 0.22)' : 'rgba(14, 18, 26, 0.7)',
                  color: selectedShop === shop.id ? '#ffe8aa' : '#cbd5e1',
                  fontSize: '0.84rem',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  transition: 'all 0.2s ease',
                  boxShadow: selectedShop === shop.id ? '0 2px 10px rgba(197, 159, 78, 0.15)' : 'none'
                }}
              >
                <span>{shop.icon}</span>
                <span>{shop.name}</span>
              </button>
            ))}
          </div>

          {/* Centered Filter, Rarity and Search Toolbar */}
          <div
            className="gothic-card"
            style={{
              padding: '1.2rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              background: 'rgba(12, 15, 22, 0.85)',
              border: '1px solid rgba(197, 159, 78, 0.25)',
              alignItems: 'center'
            }}
          >
            {/* Categories Centered */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    padding: '0.4rem 0.9rem',
                    borderRadius: '4px',
                    border: selectedCategory === cat.id ? '1px solid var(--gold-ancient)' : '1px solid rgba(255,255,255,0.06)',
                    background: selectedCategory === cat.id ? 'rgba(197, 159, 78, 0.2)' : 'rgba(255,255,255,0.03)',
                    color: selectedCategory === cat.id ? '#ffe8aa' : '#94a3b8',
                    fontSize: '0.8rem',
                    fontWeight: selectedCategory === cat.id ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Rarity & Search Centered Bar */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem', width: '100%', maxWidth: '620px' }}>
              <select
                value={selectedRarity}
                onChange={(e) => setSelectedRarity(e.target.value)}
                className="gothic-input"
                style={{ padding: '0.5rem 1rem', fontSize: '0.84rem', flex: '1', minWidth: '180px' }}
              >
                <option value="all">Wszystkie Rzadkości</option>
                <option value="Niezbędny">Niezbędny</option>
                <option value="Zwykły">Zwykły</option>
                <option value="Rzadki">Rzadki</option>
                <option value="Epicki">Epicki</option>
                <option value="Legendarne">Legendarne</option>
              </select>

              <div style={{ position: 'relative', flex: '2', minWidth: '240px' }}>
                <Search size={15} color="var(--gold-ancient)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Szukaj artefaktu, księgi lub kramu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="gothic-input"
                  style={{ width: '100%', paddingLeft: '2.4rem', fontSize: '0.84rem' }}
                />
              </div>
            </div>
          </div>

          <SecretRune secretId="rune-algiz-store" />

          {/* Store Catalog Grid with Visual Placeholders */}
          {filteredItems.length === 0 ? (
            <div
              className="gothic-card"
              style={{
                padding: '3.5rem 2rem',
                textAlign: 'center',
                background: 'rgba(10, 13, 20, 0.7)',
                border: '1px dashed rgba(197, 159, 78, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem'
              }}
            >
              <div style={{ fontSize: '2.5rem' }}>🧙‍♂️</div>
              <h3 style={{ fontSize: '1.25rem', color: '#ffffff', fontFamily: 'var(--font-heading)' }}>
                Brak artefaktów spełniających podane kryteria
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.88rem', maxWidth: '450px' }}>
                Spróbuj zmienić wybrany kram, kategorię, rzadkość lub wyczyść frazę w wyszukiwarce.
              </p>
              <button
                onClick={() => {
                  setSelectedShop('all');
                  setSelectedCategory('all');
                  setSelectedRarity('all');
                  setSearchQuery('');
                }}
                className="btn-durmstrang"
                style={{ padding: '0.5rem 1.2rem', fontSize: '0.82rem', marginTop: '0.5rem' }}
              >
                Wyczyść Wszystkie Filtry
              </button>
            </div>
          ) : (
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
          )}
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
