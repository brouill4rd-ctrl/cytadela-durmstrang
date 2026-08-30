import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import { CategoryBanner } from './CategoryBanner';
import { CATEGORY_BANNERS, getCategoryBanner } from '../data/categoryBanners';
import { RichTextEditor } from './RichTextEditor';
import { RichTextRenderer } from './RichTextRenderer';
import api from '../api';
import {
  X, Scroll, Eye, Edit3, Pin, Calendar,
  Clock, Image as ImageIcon, User, ChevronDown, Type
} from 'lucide-react';

const TITLE_TEMPLATES = [
  { label: 'Edykt Dyrekcji', template: 'Edykt Dyrekcji: ' },
  { label: 'Liga Hólmganga', template: 'Wyniki Turnieju Pojedynków Hólmganga — ' },
  { label: 'Oceny Katedry', template: 'Oceny Końcowe || Katedra ' },
  { label: 'Zjawisko Astralne', template: 'Ostrzeżenie Astromagiczne: ' },
  { label: 'Komunikat Zakonny', template: 'Odezwa do Adeptów Zakonu ' },
  { label: 'Podsumowanie Tygodnia', template: 'Podsumowanie Tygodnia #' },
  { label: 'Wyniki Rywalizacji', template: 'Wyniki Rywalizacji o ' }
];

const RUNE_GLYPHS = [
  'ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ',
  'ᛁ', 'ᛃ', 'ᛇ', 'ᛈ', 'ᛉ', 'ᛋ', 'ᛏ', 'ᛒ', 'ᛖ', 'ᛗ',
  'ᛚ', 'ᛜ', 'ᛞ', 'ᛟ'
];

const FALLBACK_AUTHORS = [
  { id: '', fullName: 'Arcymistrzyni Valgerda Storm', departmentName: 'Dyrektor Cytadeli Durmstrang', signaturePng: '', role: 'admin' },
  { id: '', fullName: 'Prof. Morana Vane', departmentName: 'Katedra Czarnej Magii', signaturePng: '', role: 'professor' },
  { id: '', fullName: 'Prof. Gunnar Vargson', departmentName: 'Katedra Szermierki Runicznej', signaturePng: '', role: 'professor' },
  { id: '', fullName: 'Prof. Sigrid Hällström', departmentName: 'Katedra Starożytnych Run i Astromagii', signaturePng: '', role: 'professor' },
  { id: '', fullName: 'Rada Mistrzów Cytadeli', departmentName: 'Kolegium Katedr Magicznych', signaturePng: '', role: 'admin' },
  { id: '', fullName: 'Rada Strażników Durmstrang', departmentName: 'Przedstawicielstwo Adeptów', signaturePng: '', role: 'admin' }
];

function estimateReadTime(htmlOrText) {
  const text = htmlOrText.replace(/<[^>]*>/g, ' ').trim();
  const words = text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min`;
}

export const NewsEditorModal = ({ isOpen, onClose, articleToEdit = null }) => {
  const {
    currentRole,
    currentUser,
    houses,
    news,
    addNewsArticle,
    updateNewsArticle,
    showNotification,
    categoryBanners,
    createCategoryBanner
  } = useSchool();

  const { playWandSwoosh, playRuneChime } = useSound();

  const [mode, setMode] = useState('edit');
  const [authors, setAuthors] = useState(FALLBACK_AUTHORS);
  const [authorsLoading, setAuthorsLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('edykty');
  const [bannerCustomText, setBannerCustomText] = useState('');
  const [house, setHouse] = useState('');
  const [selectedAuthorId, setSelectedAuthorId] = useState('');
  const [author, setAuthor] = useState('');
  const [authorRole, setAuthorRole] = useState('');
  const [authorSignature, setAuthorSignature] = useState('');
  const [waxSeal, setWaxSeal] = useState('gold');
  const [pinned, setPinned] = useState(false);
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(['Edykt']);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const tagInputRef = useRef(null);
  const tagDropdownRef = useRef(null);

  const allExistingTags = useMemo(() => {
    const PRESET_TAGS = [
      'Edykt', 'Ogłoszenie', 'Turniej', 'Hólmgang', 'Oceny', 'Katedra',
      'Egzaminy', 'Astrologia', 'Alchemia', 'Runy', 'Dyrekcja', 'Prefekci',
      'Liga', 'Wyniki', 'Rekrutacja', 'Ceremonia', 'Biblioteka', 'Ważne',
      'Pilne', 'Przypomnienie', 'Regulamin', 'Nagrody', 'Kary', 'Wakacje',
      'Praktyki', 'Pojedynek', 'Rywalizacja', 'Zebranie', 'Kolegium'
    ];
    const fromArticles = (news || []).flatMap(a => a.tags || []);
    return [...new Set([...PRESET_TAGS, ...fromArticles])].sort();
  }, [news]);

  const tagSuggestions = useMemo(() => {
    if (!tagInput.trim()) return allExistingTags.filter(t => !tags.includes(t)).slice(0, 12);
    const q = tagInput.trim().toLowerCase();
    return allExistingTags.filter(t => t.toLowerCase().includes(q) && !tags.includes(t)).slice(0, 10);
  }, [tagInput, allExistingTags, tags]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target) && !tagInputRef.current?.contains(e.target)) {
        setShowTagSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [showCatCreator, setShowCatCreator] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatScript, setNewCatScript] = useState('');
  const [newCatColor, setNewCatColor] = useState('#c59f4e');
  const [newCatImage, setNewCatImage] = useState('');

  // Ładowanie autorów z backendu
  useEffect(() => {
    if (!isOpen) return;
    setAuthorsLoading(true);
    api.getNewsAuthors()
      .then(res => {
        if (res.ok && res.data && res.data.length > 0) {
          setAuthors(res.data);
        }
      })
      .catch(() => {})
      .finally(() => setAuthorsLoading(false));
  }, [isOpen]);

  // Wypełnij formularz przy edycji lub nowym artykule
  useEffect(() => {
    if (!isOpen) return;
    if (articleToEdit) {
      setTitle(articleToEdit.title || '');
      setCategory(articleToEdit.categoryKey || articleToEdit.category || 'edykty');
      setBannerCustomText(articleToEdit.bannerCustomText || '');
      setHouse(articleToEdit.house || '');
      setSelectedAuthorId(articleToEdit.authorId || '');
      setAuthor(articleToEdit.author || '');
      setAuthorRole(articleToEdit.authorRole || '');
      setAuthorSignature(articleToEdit.authorSignature || '');
      setWaxSeal(articleToEdit.waxSeal || 'gold');
      setPinned(Boolean(articleToEdit.pinned));
      setSummary(articleToEdit.summary || '');
      setContent(articleToEdit.content || '');
      setTags(articleToEdit.tags || ['Edykt']);
    } else {
      setTitle('');
      setCategory('edykty');
      setBannerCustomText('');
      setHouse('');
      setWaxSeal('gold');
      setPinned(false);
      setSummary('');
      setContent('');
      setTags(['Edykt']);

      // Auto-fill z zalogowanego użytkownika
      if (currentUser) {
        setSelectedAuthorId(currentUser.id || '');
        setAuthor(currentUser.fullName || '');
        setAuthorSignature(currentUser.signaturePng || '');
        if (currentUser.departmentName) {
          setAuthorRole(currentUser.departmentName);
        } else if (currentUser.title) {
          setAuthorRole(currentUser.title);
        } else if (currentRole === 'admin') {
          setAuthorRole('Dyrekcja Cytadeli');
        } else {
          setAuthorRole('Profesor Katedry');
        }
      } else {
        setSelectedAuthorId('');
        setAuthor('Arcymistrzyni Valgerda Storm');
        setAuthorRole('Dyrektor Cytadeli Durmstrang');
        setAuthorSignature('');
      }
    }
  }, [articleToEdit, isOpen, currentUser, currentRole]);

  // Synchronizuj pola autora gdy zmieni się wybór z listy
  const handleAuthorSelect = (authorId) => {
    setSelectedAuthorId(authorId);
    const found = authors.find(a => a.id === authorId);
    if (found) {
      setAuthor(found.fullName);
      setAuthorRole(found.departmentName || found.title || '');
      setAuthorSignature(found.signaturePng || '');
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);


  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      e.preventDefault();
      const trimmed = tagInput.trim();
      if (trimmed && !tags.includes(trimmed)) {
        setTags(prev => [...prev, trimmed]);
        setTagInput('');
        setShowTagSuggestions(false);
      }
    } else if (e.key === 'Escape') {
      setShowTagSuggestions(false);
    }
  };

  const handlePickSuggestion = (suggestion) => {
    if (!tags.includes(suggestion)) {
      setTags(prev => [...prev, suggestion]);
    }
    setTagInput('');
    setShowTagSuggestions(false);
    tagInputRef.current?.focus();
  };

  const handleRemoveTag = (tagToRemove) => setTags(prev => prev.filter(t => t !== tagToRemove));

  const currentBannerObj = getCategoryBanner(category);
  const selectedHouseObj = house ? houses[house] : null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim()) {
      showNotification('Brak Danych', 'Podaj co najmniej tytuł oraz zwięzłe podsumowanie edyktu.', 'warning');
      return;
    }
    playWandSwoosh();

    const fullContent = content.trim() || summary.trim();
    const articleData = {
      title: title.trim(),
      category: currentBannerObj.categoryName,
      categoryKey: category,
      bannerCustomText: bannerCustomText.trim(),
      house: house || null,
      author: author.trim(),
      authorId: selectedAuthorId || currentUser?.id || '',
      authorRole: authorRole.trim(),
      authorSignature: authorSignature.trim(),
      waxSeal,
      pinned,
      highlight: pinned || category === 'edykty',
      summary: summary.trim(),
      content: fullContent,
      tags: tags.length > 0 ? tags : [currentBannerObj.categoryName],
      readTime: estimateReadTime(fullContent)
    };

    if (articleToEdit) {
      updateNewsArticle(articleToEdit.id, articleData);
    } else {
      addNewsArticle(articleData);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(3,5,8,0.92)', backdropFilter: 'blur(12px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}
    >
      <div
        className="gothic-parchment-modal"
        style={{ background: 'linear-gradient(180deg, #101622 0%, #090c13 100%)', border: '1px solid var(--gold-ancient)', borderRadius: '8px', width: '100%', maxWidth: '900px', maxHeight: '93vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 80px rgba(0,0,0,0.95), 0 0 40px rgba(197,159,78,0.2)', position: 'relative', overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ height: '3px', background: 'linear-gradient(90deg, transparent, var(--gold-ancient), var(--ice-frost), transparent)' }} />

        {/* Header */}
        <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid rgba(164,200,225,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(10,14,22,0.8)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <Scroll size={20} color="var(--gold-glow)" />
            <h2 style={{ fontSize: '1.35rem', color: '#ffffff', fontFamily: 'var(--font-heading)' }}>
              {articleToEdit ? 'Edycja Zwoju Edyktu' : 'Kreator Edyktów & Banerów Kategorii'}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.5)', padding: '0.2rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <button type="button" onClick={() => setMode('edit')} style={{ padding: '0.35rem 0.8rem', border: 'none', borderRadius: '3px', background: mode === 'edit' ? 'rgba(197,159,78,0.25)' : 'transparent', color: mode === 'edit' ? '#fff' : '#9ca3af', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Edit3 size={13} /> Edycja
              </button>
              <button type="button" onClick={() => { playRuneChime(); setMode('preview'); }} style={{ padding: '0.35rem 0.8rem', border: 'none', borderRadius: '3px', background: mode === 'preview' ? 'rgba(164,200,225,0.25)' : 'transparent', color: mode === 'preview' ? '#fff' : '#9ca3af', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Eye size={13} /> Podgląd Pergaminu
              </button>
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', color: '#9ca3af', cursor: 'pointer', padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '1.8rem 2.2rem', overflowY: 'auto', flex: 1 }}>
          {mode === 'edit' ? (
            <form id="news-editor-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>

              {/* 1. Kategoria & Baner */}
              <div style={{ background: 'rgba(7,10,16,0.75)', border: '1px solid rgba(197,159,78,0.3)', borderRadius: '6px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--gold-glow)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    <ImageIcon size={16} /> Kategoria & Baner Kaligraficzny
                  </label>
                  <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Baner wyświetla się automatycznie nad tytułem</span>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#6b7280', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Podgląd wybranego banera:</div>
                  <CategoryBanner category={category} customText={bannerCustomText} height={140} />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gold-ancient)' }}>Wybierz dziedzinę lub stwórz nową:</div>
                    <button type="button" onClick={() => setShowCatCreator(!showCatCreator)} style={{ background: showCatCreator ? 'rgba(236,72,153,0.2)' : 'rgba(197,159,78,0.15)', border: showCatCreator ? '1px solid #ec4899' : '1px solid var(--gold-ancient)', borderRadius: '4px', color: showCatCreator ? '#f472b6' : 'var(--gold-glow)', padding: '0.2rem 0.5rem', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>
                      {showCatCreator ? '✕ Zamknij Kreator' : '+ Stwórz Nową Kategorię'}
                    </button>
                  </div>

                  {showCatCreator && (
                    <div style={{ background: 'rgba(12,16,26,0.95)', border: '1px solid #ec4899', borderRadius: '6px', padding: '0.85rem', marginBottom: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <div style={{ fontSize: '0.78rem', color: '#f472b6', fontWeight: 700 }}>🪄 Nowa Kategoria Edyktu / Baneru:</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                        <div>
                          <label style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>Nazwa Dziedziny:</label>
                          <input type="text" placeholder="np. Alchemia Bojowa" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className="gothic-input" style={{ padding: '0.4rem 0.6rem', fontSize: '0.82rem' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>Napis na Banerze:</label>
                          <input type="text" placeholder="np. alchemia bojowa" value={newCatScript} onChange={(e) => setNewCatScript(e.target.value)} className="gothic-input" style={{ padding: '0.4rem 0.6rem', fontSize: '0.82rem' }} />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.6rem' }}>
                        <div>
                          <label style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>URL Tła (Opcjonalnie):</label>
                          <input type="url" placeholder="https://..." value={newCatImage} onChange={(e) => setNewCatImage(e.target.value)} className="gothic-input" style={{ padding: '0.4rem 0.6rem', fontSize: '0.82rem' }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                          <button type="button" onClick={() => {
                            if (!newCatName.trim()) { showNotification('Błąd', 'Podaj nazwę nowej kategorii.', 'error'); return; }
                            playRuneChime();
                            const created = createCategoryBanner({ categoryName: newCatName.trim(), defaultScript: newCatScript.trim() || newCatName.trim().toLowerCase(), themeColor: newCatColor, bgImage: newCatImage.trim() });
                            setCategory(created.id);
                            setBannerCustomText(created.defaultScript);
                            setNewCatName(''); setNewCatScript(''); setNewCatImage('');
                            setShowCatCreator(false);
                          }} className="btn-durmstrang" style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}>Utwórz i Wybierz</button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                    {(categoryBanners || CATEGORY_BANNERS).map((b) => {
                      const isSelected = category === b.id;
                      return (
                        <button key={b.id} type="button" onClick={() => { playRuneChime(); setCategory(b.id); }} style={{ padding: '0.55rem 0.75rem', borderRadius: '4px', border: isSelected ? '1px solid var(--gold-glow)' : '1px solid rgba(255,255,255,0.08)', background: isSelected ? 'rgba(197,159,78,0.2)' : 'rgba(255,255,255,0.02)', color: isSelected ? '#fff' : '#9ca3af', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease', boxShadow: isSelected ? '0 0 10px rgba(197,159,78,0.3)' : 'none' }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: isSelected ? 'var(--gold-glow)' : '#cfd7e4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span>{b.categoryName}</span>
                            {b.bgImage && <span style={{ fontSize: '0.55rem', background: '#ec4899', color: '#fff', padding: '0.05rem 0.25rem', borderRadius: '3px' }}>IMG</span>}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#6b7280', fontStyle: 'italic', fontFamily: 'Caveat, cursive' }}>„{b.defaultScript}"</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.8rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--ice-frost)', marginBottom: '0.3rem' }}>
                    <Type size={13} /> Własny napis kaligraficzny na banerze (Opcjonalnie):
                  </label>
                  <input type="text" placeholder={`Domyślnie: „${currentBannerObj?.defaultScript || 'edykty'}"`} value={bannerCustomText} onChange={(e) => setBannerCustomText(e.target.value)} className="gothic-input" style={{ fontSize: '0.9rem', padding: '0.5rem 0.8rem' }} />
                </div>
              </div>

              {/* 2. Szybkie Szablony Tytułów */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gold-ancient)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Szybkie Szablony Tytułów:
                </label>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {TITLE_TEMPLATES.map((tmpl) => (
                    <button key={tmpl.label} type="button" onClick={() => { playRuneChime(); setTitle(tmpl.template); }} style={{ padding: '0.3rem 0.65rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(197,159,78,0.2)', borderRadius: '4px', color: 'var(--gold-glow)', fontSize: '0.75rem', cursor: 'pointer' }}>
                      + {tmpl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Tytuł */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#ffffff', marginBottom: '0.35rem', fontWeight: 600 }}>Tytuł Edyktu *</label>
                <input type="text" required placeholder="np. Edykt Dyrekcji: Otwarcie Sezonu Pojedynków na Lodzie..." value={title} onChange={(e) => setTitle(e.target.value)} className="gothic-input" style={{ fontSize: '1.05rem', padding: '0.75rem 1rem' }} />
              </div>

              {/* 4. Dom & Pieczęć */}
              <div className="grid-2">
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gold-ancient)', marginBottom: '0.35rem' }}>Dedykacja Zakonna (Opcjonalnie)</label>
                  <select value={house} onChange={(e) => setHouse(e.target.value)} className="gothic-select">
                    <option value="">🏛️ Cała Społeczność Cytadeli</option>
                    {Object.values(houses).map(h => <option key={h.id} value={h.id}>{h.crestIcon} {h.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gold-ancient)', marginBottom: '0.35rem' }}>Pieczęć Laku (Wax Seal)</label>
                  <select value={waxSeal} onChange={(e) => setWaxSeal(e.target.value)} className="gothic-select">
                    <option value="gold">🥇 Złota Pieczęć Arcymistrza (ᛟ)</option>
                    <option value="crimson">🩸 Karmazynowy Lak Krwi (ᚦ)</option>
                    <option value="shadow">🌑 Czarny Wosk Cienia (ᛞ)</option>
                    <option value="frost">❄️ Lodowy Błękit Północy (ᛁ)</option>
                  </select>
                </div>
              </div>

              {/* 5. Autor — dynamiczny z podpisem graficznym */}
              <div style={{ background: 'rgba(7,10,16,0.75)', border: '1px solid rgba(164,200,225,0.2)', borderRadius: '6px', padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--ice-frost)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  <User size={15} /> Autor & Sygnatura
                </label>

                <div className="grid-2">
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gold-ancient)', marginBottom: '0.35rem' }}>
                      Wybierz Autora {authorsLoading && <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>ładowanie...</span>}
                    </label>
                    <select value={selectedAuthorId} onChange={(e) => handleAuthorSelect(e.target.value)} className="gothic-select">
                      <option value="">— Inna osoba / Wpisz ręcznie —</option>
                      {authors
                        .filter(a => ['admin', 'headmaster'].includes(currentRole) || a.role !== 'admin')
                        .map(a => (
                          <option key={a.id || a.fullName} value={a.id}>
                            {a.fullName}{a.departmentName ? ` (${a.departmentName})` : ''}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gold-ancient)', marginBottom: '0.35rem' }}>Pełne Imię / Sygnatura</label>
                    <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} className="gothic-input" placeholder="np. Arcymistrzyni Valgerda Storm" />
                  </div>
                </div>

                <div className="grid-2">
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gold-ancient)', marginBottom: '0.35rem' }}>Tytuł / Rola Autora</label>
                    <input type="text" value={authorRole} onChange={(e) => setAuthorRole(e.target.value)} className="gothic-input" placeholder="np. Katedra Eliksirów & Toksykologii" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gold-ancient)', marginBottom: '0.35rem' }}>URL Podpisu Graficznego (.png)</label>
                    <input type="text" value={authorSignature} onChange={(e) => setAuthorSignature(e.target.value)} className="gothic-input" placeholder="https://...signature.png lub ścieżka lokalna" />
                  </div>
                </div>

                {authorSignature && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.8rem', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ fontSize: '0.72rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Podgląd podpisu:</span>
                    <img src={authorSignature} alt="Podpis graficzny autora" style={{ maxHeight: '48px', maxWidth: '240px', objectFit: 'contain', filter: 'brightness(1.1)' }} onError={(e) => { e.target.style.display = 'none'; }} />
                  </div>
                )}
              </div>

              {/* 6. Przypnij */}
              <div style={{ display: 'flex', gap: '1.5rem', background: 'rgba(0,0,0,0.3)', padding: '0.8rem 1.2rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: '#ffffff' }}>
                  <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} style={{ accentColor: 'var(--gold-ancient)', width: '16px', height: '16px' }} />
                  <Pin size={15} color="var(--gold-ancient)" />
                  <span>Przypnij na górze tablicy (Wyróżniony Edykt Główny)</span>
                </label>
              </div>

              {/* 7. Streszczenie */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#ffffff', marginBottom: '0.35rem', fontWeight: 600 }}>Krótkie Podsumowanie (widoczne na karcie) *</label>
                <textarea rows={2} required placeholder="Zwięzłe wprowadzenie do pergaminu..." value={summary} onChange={(e) => setSummary(e.target.value)} className="gothic-textarea" />
              </div>

              {/* 8. Treść */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.8rem', color: '#ffffff', fontWeight: 600 }}>
                    Pełna Treść Pergaminu
                    {content && <span style={{ marginLeft: '0.5rem', fontSize: '0.72rem', color: '#6b7280' }}>({estimateReadTime(content)} czytania)</span>}
                  </label>
                </div>
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Napisz szczegółowy traktat..."
                  minHeight={280}
                  showRuneGlyphs
                />
              </div>

              {/* 9. Tagi */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gold-ancient)', marginBottom: '0.35rem' }}>Etykiety & Tagi</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                      ref={tagInputRef}
                      type="text"
                      placeholder="Wpisz tag i naciśnij Enter..."
                      value={tagInput}
                      onChange={(e) => { setTagInput(e.target.value); setShowTagSuggestions(true); }}
                      onKeyDown={handleAddTag}
                      onFocus={() => setShowTagSuggestions(true)}
                      className="gothic-input"
                      style={{ flex: 1, padding: '0.45rem 0.8rem' }}
                      autoComplete="off"
                    />
                    <button type="button" onClick={handleAddTag} className="btn-durmstrang-secondary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}>+ Dodaj Tag</button>
                  </div>
                  {showTagSuggestions && tagSuggestions.length > 0 && (
                    <div
                      ref={tagDropdownRef}
                      style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'rgba(10,14,22,0.98)', border: '1px solid rgba(164,200,225,0.3)', borderRadius: '6px', boxShadow: '0 8px 24px rgba(0,0,0,0.8)', overflow: 'hidden', marginTop: '2px' }}
                    >
                      <div style={{ padding: '0.35rem 0.6rem', fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        {tagInput.trim() ? 'Pasujące tagi' : 'Popularne tagi'}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', padding: '0.55rem 0.65rem' }}>
                        {tagSuggestions.map(suggestion => (
                          <button
                            key={suggestion}
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); handlePickSuggestion(suggestion); }}
                            style={{ background: 'rgba(164,200,225,0.08)', border: '1px solid rgba(164,200,225,0.2)', color: 'var(--ice-frost)', padding: '0.2rem 0.55rem', borderRadius: '10px', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.15s' }}
                            onMouseEnter={(e) => { e.target.style.background = 'rgba(164,200,225,0.2)'; e.target.style.borderColor = 'var(--ice-frost)'; e.target.style.color = '#fff'; }}
                            onMouseLeave={(e) => { e.target.style.background = 'rgba(164,200,225,0.08)'; e.target.style.borderColor = 'rgba(164,200,225,0.2)'; e.target.style.color = 'var(--ice-frost)'; }}
                          >
                            #{suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {tags.map(t => (
                    <span key={t} style={{ background: 'rgba(164,200,225,0.1)', border: '1px solid rgba(164,200,225,0.25)', color: 'var(--ice-frost)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      #{t}
                      <button type="button" onClick={() => handleRemoveTag(t)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: 0 }}>×</button>
                    </span>
                  ))}
                </div>
              </div>
            </form>
          ) : (
            /* PODGLĄD */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="contentBlock" style={{ background: 'rgba(15,20,30,0.95)', border: '1px solid rgba(164,200,225,0.35)', padding: '2rem' }}>
                <div style={{ marginBottom: '1.2rem' }}>
                  <CategoryBanner category={category} customText={bannerCustomText} height={140} />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                  {pinned && <span style={{ fontSize: '0.74rem', background: 'rgba(197,159,78,0.2)', color: 'var(--gold-glow)', padding: '0.2rem 0.65rem', borderRadius: '4px', border: '1px solid var(--gold-ancient)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontFamily: 'var(--font-heading)', letterSpacing: '0.06em', textTransform: 'uppercase' }}><Pin size={12} /> Edykt Główny</span>}
                  <span style={{ fontSize: '0.75rem', background: 'rgba(164,200,225,0.12)', color: 'var(--ice-crystal)', padding: '0.2rem 0.65rem', borderRadius: '4px', border: '1px solid rgba(164,200,225,0.3)', fontFamily: 'var(--font-heading)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{currentBannerObj.categoryName}</span>
                  {selectedHouseObj && <span style={{ fontSize: '0.75rem', color: selectedHouseObj.colors.secondary, display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'var(--font-heading)' }}>{selectedHouseObj.crestIcon} {selectedHouseObj.name}</span>}
                </div>
                <div className="contentTitle"><span style={{ textAlign: 'center', width: '100%' }}>{title || 'Tytuł Edyktu'}</span></div>
                <div className="contentMeta">
                  <span>Wykaligrafowane przez:</span>
                  <span className="author-badge">{author}</span>
                  <span style={{ opacity: 0.5 }}>•</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Calendar size={13} /> {new Date().toLocaleDateString('pl-PL')}</span>
                  <span style={{ opacity: 0.5 }}>•</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={13} /> {estimateReadTime(content || summary)} czytania</span>
                </div>
                {summary && (
                  <div style={{ background: 'rgba(164,200,225,0.05)', borderLeft: '3px solid var(--gold-ancient)', padding: '0.8rem 1rem', marginBottom: '1.2rem', fontStyle: 'italic', textAlign: 'justify', hyphens: 'auto' }}>{summary}</div>
                )}
                <RichTextRenderer
                  content={content || summary}
                  style={{ fontSize: '0.98rem' }}
                />

                {/* Podpis graficzny w podglądzie */}
                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', gap: '1rem', fontStyle: 'italic', color: 'var(--gold-glow)' }}>
                  {authorSignature && (
                    <img src={authorSignature} alt={`Podpis ${author}`} style={{ maxHeight: '56px', maxWidth: '200px', objectFit: 'contain', filter: 'brightness(1.1)' }} onError={(e) => { e.target.style.display = 'none'; }} />
                  )}
                  <div>
                    {authorRole || 'Rada Dyrekcji Cytadeli'},<br />
                    <strong style={{ color: '#ffffff' }}>{author}</strong>
                  </div>
                </div>

                {tags.length > 0 && (
                  <div style={{ marginTop: '1rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {tags.map(t => (
                      <span key={t} style={{ background: 'rgba(164,200,225,0.08)', border: '1px solid rgba(164,200,225,0.2)', color: 'var(--ice-frost)', padding: '0.15rem 0.5rem', borderRadius: '10px', fontSize: '0.7rem' }}>#{t}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '1.25rem 1.75rem', borderTop: '1px solid rgba(164,200,225,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(10,14,22,0.8)' }}>
          <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>
            {articleToEdit ? 'Modyfikacja istniejącego zwoju' : 'Nowy edykt zostanie ogłoszony w całej Cytadeli'}
          </div>
          <div style={{ display: 'flex', gap: '0.8rem' }}>
            <button type="button" onClick={onClose} className="btn-durmstrang-secondary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}>Anuluj</button>
            <button type="submit" form="news-editor-form" onClick={mode === 'preview' ? handleSubmit : undefined} className="btn-durmstrang" style={{ padding: '0.6rem 1.5rem', fontSize: '0.88rem' }}>
              <Scroll size={16} /> {articleToEdit ? 'Zapisz Zmiany' : 'Opublikuj Edykt'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
