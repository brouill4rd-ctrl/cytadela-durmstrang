import React, { useState, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import { CategoryBanner } from './CategoryBanner';
import { CATEGORY_BANNERS, getCategoryBanner } from '../data/categoryBanners';
import {
  X,
  Scroll,
  Eye,
  Edit3,
  Sparkles,
  Pin,
  Shield,
  Calendar,
  Check,
  Tag,
  Feather,
  Flame,
  Clock,
  HelpCircle,
  Wand2,
  Image as ImageIcon,
  Type
} from 'lucide-react';

const TITLE_TEMPLATES = [
  { label: 'Edykt Dyrekcji', template: 'Edykt Dyrekcji: ' },
  { label: 'Liga Hólmganga', template: 'Wyniki Turnieju Pojedynków Hólmganga — ' },
  { label: 'Oceny Katedry', template: 'Oceny Końcowe || Katedra ' },
  { label: 'Zjawisko Astralne', template: 'Ostrzeżenie Astromagiczne: ' },
  { label: 'Komunikat Zakonny', template: 'Odezwa do Adeptów Zakonu ' }
];

const RUNE_GLYPHS = [
  'ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ',
  'ᛁ', 'ᛃ', 'ᛇ', 'ᛈ', 'ᛉ', 'ᛋ', 'ᛏ', 'ᛒ', 'ᛖ', 'ᛗ',
  'ᛚ', 'ᛜ', 'ᛞ', 'ᛟ'
];

const PRESET_AUTHORS = [
  { name: 'Arcymistrzyni Valgerda Storm', role: 'Dyrektor Cytadeli Durmstrang' },
  { name: 'Prof. Morana Vane', role: 'Kierownik Katedry Czarnej Magii' },
  { name: 'Prof. Gunnar Vargson', role: 'Mistrz Szermierki Runicznej & Opiekun Björnhall' },
  { name: 'Prof. Sigrid Hällström', role: 'Katedra Starożytnych Run i Astromagii' },
  { name: 'Rada Mistrzów Cytadeli', role: 'Kolegium Katedr Magicznych' },
  { name: 'Rada Prefektów Durmstrang', role: 'Przedstawicielstwo Adeptów' }
];

export const NewsEditorModal = ({ isOpen, onClose, articleToEdit = null }) => {
  if (!isOpen) return null;

  const {
    currentRole,
    currentUser,
    houses,
    addNewsArticle,
    updateNewsArticle,
    showNotification
  } = useSchool();

  const { playWandSwoosh, playRuneChime } = useSound();

  const [mode, setMode] = useState('edit'); // 'edit' | 'preview'

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('edykty');
  const [bannerCustomText, setBannerCustomText] = useState('');
  const [house, setHouse] = useState('');
  const [author, setAuthor] = useState('Arcymistrzyni Valgerda Storm');
  const [authorRole, setAuthorRole] = useState('Dyrektor Cytadeli Durmstrang');
  const [waxSeal, setWaxSeal] = useState('gold');
  const [pinned, setPinned] = useState(false);
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(['Edykt']);

  // Populate if editing
  useEffect(() => {
    if (articleToEdit) {
      setTitle(articleToEdit.title || '');
      setCategory(articleToEdit.category || 'edykty');
      setBannerCustomText(articleToEdit.bannerCustomText || '');
      setHouse(articleToEdit.house || '');
      setAuthor(articleToEdit.author || 'Arcymistrzyni Valgerda Storm');
      setAuthorRole(articleToEdit.authorRole || 'Dyrektor Cytadeli Durmstrang');
      setWaxSeal(articleToEdit.waxSeal || 'gold');
      setPinned(Boolean(articleToEdit.pinned));
      setSummary(articleToEdit.summary || '');
      setContent(articleToEdit.content || '');
      setTags(articleToEdit.tags || ['Edykt']);
    } else {
      // Default new
      setTitle('');
      setCategory('edykty');
      setBannerCustomText('');
      setHouse('');
      setAuthor(currentUser?.fullName || 'Arcymistrzyni Valgerda Storm');
      setAuthorRole(currentRole === 'admin' ? 'Arcymistrzyni Cytadeli' : currentRole === 'professor' ? 'Profesor Katedry' : 'Rada Adeptów');
      setWaxSeal('gold');
      setPinned(false);
      setSummary('');
      setContent('');
      setTags(['Edykt']);
    }
  }, [articleToEdit, isOpen, currentUser, currentRole]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Insert text into content
  const insertIntoContent = (snippet) => {
    setContent(prev => prev + snippet);
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      e.preventDefault();
      const trimmed = tagInput.trim();
      if (trimmed && !tags.includes(trimmed)) {
        setTags(prev => [...prev, trimmed]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(prev => prev.filter(t => t !== tagToRemove));
  };

  const handleCategoryChange = (newCatId) => {
    playRuneChime();
    setCategory(newCatId);
  };

  const handleAuthorPresetChange = (authorName) => {
    const matched = PRESET_AUTHORS.find(a => a.name === authorName);
    if (matched) {
      setAuthor(matched.name);
      setAuthorRole(matched.role);
    } else {
      setAuthor(authorName);
    }
  };

  const currentBannerObj = getCategoryBanner(category);
  const selectedHouseObj = house ? houses[house] : null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim()) {
      showNotification('Brak Danych', 'Podaj co najmniej tytuł oraz zwięzłe podsumowanie edyktu.', 'warning');
      return;
    }

    playWandSwoosh();

    const articleData = {
      title: title.trim(),
      category: currentBannerObj.categoryName,
      categoryKey: category,
      bannerCustomText: bannerCustomText.trim(),
      house: house || null,
      author: author.trim(),
      authorRole: authorRole.trim(),
      waxSeal,
      pinned,
      highlight: pinned || category === 'edykty',
      summary: summary.trim(),
      content: (content.trim() || summary.trim()),
      tags: tags.length > 0 ? tags : [currentBannerObj.categoryName]
    };

    if (articleToEdit) {
      updateNewsArticle(articleToEdit.id, articleData);
    } else {
      addNewsArticle(articleData);
    }

    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(3, 5, 8, 0.92)',
        backdropFilter: 'blur(12px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem'
      }}
    >
      <div
        className="gothic-parchment-modal"
        style={{
          background: 'linear-gradient(180deg, #101622 0%, #090c13 100%)',
          border: '1px solid var(--gold-ancient)',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '880px',
          maxHeight: '93vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.95), 0 0 40px rgba(197, 159, 78, 0.2)',
          position: 'relative',
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
            borderBottom: '1px solid rgba(164, 200, 225, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(10, 14, 22, 0.8)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <Scroll size={20} color="var(--gold-glow)" />
            <h2 style={{ fontSize: '1.35rem', color: '#ffffff', fontFamily: 'var(--font-heading)' }}>
              {articleToEdit ? 'Edycja Zwoju Edyktu' : 'Kreator Edyktów & Banerów Kategorii'}
            </h2>
          </div>

          {/* Mode Switcher Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.5)', padding: '0.2rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <button
                type="button"
                onClick={() => setMode('edit')}
                style={{
                  padding: '0.35rem 0.8rem',
                  border: 'none',
                  borderRadius: '3px',
                  background: mode === 'edit' ? 'rgba(197, 159, 78, 0.25)' : 'transparent',
                  color: mode === 'edit' ? '#ffffff' : '#9ca3af',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                <Edit3 size={13} /> Edycja
              </button>
              <button
                type="button"
                onClick={() => {
                  playRuneChime();
                  setMode('preview');
                }}
                style={{
                  padding: '0.35rem 0.8rem',
                  border: 'none',
                  borderRadius: '3px',
                  background: mode === 'preview' ? 'rgba(164, 200, 225, 0.25)' : 'transparent',
                  color: mode === 'preview' ? '#ffffff' : '#9ca3af',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                <Eye size={13} /> Podgląd Pergaminu
              </button>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '4px',
                color: '#9ca3af',
                cursor: 'pointer',
                padding: '0.4rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div style={{ padding: '1.8rem 2.2rem', overflowY: 'auto', flex: 1 }}>
          {mode === 'edit' ? (
            <form id="news-editor-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
              
              {/* =========================================================================
                  1. CATEGORY & BANNER SELECTOR WITH LIVE PREVIEW
                  ========================================================================= */}
              <div
                style={{
                  background: 'rgba(7, 10, 16, 0.75)',
                  border: '1px solid rgba(197, 159, 78, 0.3)',
                  borderRadius: '6px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--gold-glow)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    <ImageIcon size={16} /> Wybór Kategorii & Kaligraficznego Banera
                  </label>
                  <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                    Baner wyświetla się automatycznie nad tytułem edyktu
                  </span>
                </div>

                {/* Live Banner Preview Box */}
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#6b7280', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Podgląd wybranego banera:
                  </div>
                  <CategoryBanner
                    category={category}
                    customText={bannerCustomText}
                    height={80}
                  />
                </div>

                {/* Category Grid Pills */}
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gold-ancient)', marginBottom: '0.4rem' }}>
                    Kliknij, aby wybrać dziedzinę:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.5rem' }}>
                    {CATEGORY_BANNERS.map((b) => {
                      const isSelected = category === b.id;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => handleCategoryChange(b.id)}
                          style={{
                            padding: '0.55rem 0.75rem',
                            borderRadius: '4px',
                            border: isSelected ? '1px solid var(--gold-glow)' : '1px solid rgba(255, 255, 255, 0.08)',
                            background: isSelected ? 'rgba(197, 159, 78, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                            color: isSelected ? '#ffffff' : '#9ca3af',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s ease',
                            boxShadow: isSelected ? '0 0 10px rgba(197, 159, 78, 0.3)' : 'none'
                          }}
                        >
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: isSelected ? 'var(--gold-glow)' : '#cfd7e4' }}>
                            {b.categoryName}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#6b7280', fontStyle: 'italic', fontFamily: 'Caveat, cursive' }}>
                            „{b.defaultScript}”
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Banner Text Input (Editable) */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.8rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--ice-frost)', marginBottom: '0.3rem' }}>
                    <Type size={13} /> Własny napis kaligraficzny na banerze (Opcjonalnie, np. „toksykologia”, „nekromancja”):
                  </label>
                  <input
                    type="text"
                    placeholder={`Domyślnie: „${currentBannerObj.defaultScript}”`}
                    value={bannerCustomText}
                    onChange={(e) => setBannerCustomText(e.target.value)}
                    className="gothic-input"
                    style={{ fontSize: '0.9rem', padding: '0.5rem 0.8rem' }}
                  />
                </div>
              </div>

              {/* Title Generator Quick Buttons */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gold-ancient)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Szybkie Szablony Tytułów (Prefiksy Diegetyczne):
                </label>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {TITLE_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.label}
                      type="button"
                      onClick={() => {
                        playRuneChime();
                        setTitle(tmpl.template);
                      }}
                      style={{
                        padding: '0.3rem 0.65rem',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(197, 159, 78, 0.2)',
                        borderRadius: '4px',
                        color: 'var(--gold-glow)',
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      + {tmpl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#ffffff', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Tytuł Edyktu / Artykułu *
                </label>
                <input
                  type="text"
                  required
                  placeholder="np. Edykt Dyrekcji: Otwarcie Sezonu Pojedynków na Lodzie..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="gothic-input"
                  style={{ fontSize: '1.05rem', padding: '0.75rem 1rem' }}
                />
              </div>

              {/* House & Wax Seal Grid */}
              <div className="grid-2">
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gold-ancient)', marginBottom: '0.35rem' }}>
                    Dedykacja Zakonna (Opcjonalnie)
                  </label>
                  <select
                    value={house}
                    onChange={(e) => setHouse(e.target.value)}
                    className="gothic-select"
                  >
                    <option value="">🏛️ Cała Społeczność Cytadeli</option>
                    {Object.values(houses).map(h => (
                      <option key={h.id} value={h.id}>{h.crestIcon} {h.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gold-ancient)', marginBottom: '0.35rem' }}>
                    Pieczęć Laku (Wax Seal)
                  </label>
                  <select
                    value={waxSeal}
                    onChange={(e) => setWaxSeal(e.target.value)}
                    className="gothic-select"
                  >
                    <option value="gold">🥇 Złota Pieczęć Arcymistrza (ᛟ)</option>
                    <option value="crimson">🩸 Karmazynowy Lak Krwi (ᚦ)</option>
                    <option value="shadow">🌑 Czarny Wosk Cienia (ᛞ)</option>
                    <option value="frost">❄️ Lodowy Błękit Północy (ᛁ)</option>
                  </select>
                </div>
              </div>

              {/* Author Selector */}
              <div className="grid-2">
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gold-ancient)', marginBottom: '0.35rem' }}>
                    Autor / Sygnatura
                  </label>
                  <select
                    value={author}
                    onChange={(e) => handleAuthorPresetChange(e.target.value)}
                    className="gothic-select"
                  >
                    {PRESET_AUTHORS.map(a => (
                      <option key={a.name} value={a.name}>{a.name} ({a.role})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gold-ancient)', marginBottom: '0.35rem' }}>
                    Rola / Tytuł Autora
                  </label>
                  <input
                    type="text"
                    value={authorRole}
                    onChange={(e) => setAuthorRole(e.target.value)}
                    className="gothic-input"
                  />
                </div>
              </div>

              {/* Pin & Highlight Toggles */}
              <div style={{ display: 'flex', gap: '1.5rem', background: 'rgba(0,0,0,0.3)', padding: '0.8rem 1.2rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: '#ffffff' }}>
                  <input
                    type="checkbox"
                    checked={pinned}
                    onChange={(e) => setPinned(e.target.checked)}
                    style={{ accentColor: 'var(--gold-ancient)', width: '16px', height: '16px' }}
                  />
                  <Pin size={15} color="var(--gold-ancient)" />
                  <span>Przypnij na górze tablicy (Wyróżniony Edykt Główny)</span>
                </label>
              </div>

              {/* Summary / Lead Input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#ffffff', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Krótkie Podsumowanie / Abstrakt (Widoczne na karcie) *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Zwięzłe wprowadzenie do pergaminu..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="gothic-textarea"
                />
              </div>

              {/* Full Content with Runic Gliphs & Format Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.8rem', color: '#ffffff', fontWeight: 600 }}>
                    Pełna Treść Pergaminu
                  </label>

                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => insertIntoContent('\n### Nagłówek Sekcji\n')}
                      className="btn-editor-tool"
                    >
                      H3
                    </button>
                    <button
                      type="button"
                      onClick={() => insertIntoContent('**tekst pogrubiony**')}
                      className="btn-editor-tool"
                    >
                      B
                    </button>
                    <button
                      type="button"
                      onClick={() => insertIntoContent('*tekst pochylony*')}
                      className="btn-editor-tool"
                    >
                      I
                    </button>
                    <button
                      type="button"
                      onClick={() => insertIntoContent('\n* Punkt 1\n* Punkt 2\n')}
                      className="btn-editor-tool"
                    >
                      Lista
                    </button>
                    <button
                      type="button"
                      onClick={() => insertIntoContent('\n---\n')}
                      className="btn-editor-tool"
                    >
                      Linia
                    </button>
                  </div>
                </div>

                {/* Nordic Rune Glyph Toolbar */}
                <div style={{ background: 'rgba(10, 14, 22, 0.9)', padding: '0.5rem 0.8rem', border: '1px solid rgba(164, 200, 225, 0.2)', borderBottom: 'none', borderRadius: '4px 4px 0 0', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--gold-ancient)', marginRight: '0.3rem', textTransform: 'uppercase' }}>
                    Glify Runiczne:
                  </span>
                  {RUNE_GLYPHS.map(rune => (
                    <button
                      key={rune}
                      type="button"
                      onClick={() => {
                        playRuneChime();
                        insertIntoContent(rune);
                      }}
                      className="rune-glyph-btn"
                      title={`Wstaw runę ${rune}`}
                    >
                      {rune}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={8}
                  placeholder="Napisz szczegółowy traktat, zarządzenie dyrekcji lub wykaz ocen..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="gothic-textarea"
                  style={{ borderRadius: '0 0 4px 4px' }}
                />
              </div>

              {/* Tags Manager */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gold-ancient)', marginBottom: '0.35rem' }}>
                  Etykiety & Tagi
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Wpisz tag i naciśnij Enter..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    className="gothic-input"
                    style={{ flex: 1, padding: '0.45rem 0.8rem' }}
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="btn-durmstrang-secondary"
                    style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
                  >
                    + Dodaj Tag
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {tags.map(t => (
                    <span
                      key={t}
                      style={{
                        background: 'rgba(164, 200, 225, 0.1)',
                        border: '1px solid rgba(164, 200, 225, 0.25)',
                        color: 'var(--ice-frost)',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      #{t}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: 0 }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </form>
          ) : (
            /* PREVIEW TAB WITH BANNER ABOVE TITLE */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div
                className="contentBlock"
                style={{
                  background: 'rgba(15, 20, 30, 0.95)',
                  border: '1px solid rgba(164, 200, 225, 0.35)',
                  padding: '2rem'
                }}
              >
                {/* 1. Category Banner Displayed Directly Above Title */}
                <div style={{ marginBottom: '1.2rem' }}>
                  <CategoryBanner
                    category={category}
                    customText={bannerCustomText}
                    height={80}
                  />
                </div>

                {/* Centered Badges */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                  {pinned && (
                    <span style={{ fontSize: '0.74rem', background: 'rgba(197, 159, 78, 0.2)', color: 'var(--gold-glow)', padding: '0.2rem 0.65rem', borderRadius: '4px', border: '1px solid var(--gold-ancient)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontFamily: 'var(--font-heading)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      <Pin size={12} color="var(--gold-ancient)" /> Edykt Główny
                    </span>
                  )}
                  <span style={{ fontSize: '0.75rem', background: 'rgba(164, 200, 225, 0.12)', color: 'var(--ice-crystal)', padding: '0.2rem 0.65rem', borderRadius: '4px', border: '1px solid rgba(164, 200, 225, 0.3)', fontFamily: 'var(--font-heading)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {currentBannerObj.categoryName}
                  </span>
                  {selectedHouseObj && (
                    <span style={{ fontSize: '0.75rem', color: selectedHouseObj.colors.secondary, display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'var(--font-heading)' }}>
                      {selectedHouseObj.crestIcon} {selectedHouseObj.name}
                    </span>
                  )}
                </div>

                {/* Centered Title */}
                <div className="contentTitle">
                  <span style={{ textAlign: 'center', width: '100%' }}>{title || 'Tytuł Edyktu'}</span>
                </div>

                {/* Centered Meta */}
                <div className="contentMeta">
                  <span>Wykaligrafowane przez:</span>
                  <span className="author-badge">{author}</span>
                  <span style={{ opacity: 0.5 }}>•</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Calendar size={13} /> {new Date().toLocaleDateString('pl-PL')}
                  </span>
                  <span style={{ opacity: 0.5 }}>•</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={13} /> 3 min czytania
                  </span>
                </div>

                {summary && (
                  <div style={{ background: 'rgba(164, 200, 225, 0.05)', borderLeft: '3px solid var(--gold-ancient)', padding: '0.8rem 1rem', marginBottom: '1.2rem', fontStyle: 'italic', textAlign: 'justify', textJustify: 'inter-word', hyphens: 'auto' }}>
                    {summary}
                  </div>
                )}

                <div className="contentBody" style={{ whiteSpace: 'pre-line', textAlign: 'justify', textJustify: 'inter-word', hyphens: 'auto' }}>
                  {content ? (
                    content.split('\n\n').map((paragraph, index) => {
                      if (paragraph.startsWith('### ')) {
                        return <h3 key={index} style={{ color: 'var(--gold-glow)', margin: '1rem 0 0.5rem', textAlign: 'left' }}>{paragraph.replace('### ', '')}</h3>;
                      }
                      if (paragraph.trim() === '---') {
                        return <hr key={index} style={{ border: 0, height: '1px', background: 'rgba(164, 200, 225, 0.2)', margin: '1.2rem 0' }} />;
                      }
                      return <p key={index} style={{ marginBottom: '1rem', textAlign: 'justify', textJustify: 'inter-word', hyphens: 'auto' }}>{paragraph}</p>;
                    })
                  ) : (
                    <p style={{ textAlign: 'justify', textJustify: 'inter-word', hyphens: 'auto' }}>{summary || 'Treść edyktu pojawi się w tym miejscu.'}</p>
                  )}
                </div>

                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', fontStyle: 'italic', color: 'var(--gold-glow)' }}>
                  <div>
                    {authorRole || 'Rada Dyrekcji Cytadeli'},<br />
                    <strong style={{ color: '#ffffff' }}>{author}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderTop: '1px solid rgba(164, 200, 225, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(10, 14, 22, 0.8)'
          }}
        >
          <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>
            {articleToEdit ? 'Modyfikacja istniejącego zwoju' : 'Nowy edykt zostanie ogłoszony w całej Cytadeli'}
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
              form="news-editor-form"
              onClick={mode === 'preview' ? handleSubmit : undefined}
              className="btn-durmstrang"
              style={{ padding: '0.6rem 1.5rem', fontSize: '0.88rem' }}
            >
              <Scroll size={16} /> {articleToEdit ? 'Zapisz Zmiany' : 'Opublikuj Edykt'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
