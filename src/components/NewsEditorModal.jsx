import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import { CategoryBanner } from './CategoryBanner';
import { CATEGORY_BANNERS, getCategoryBanner } from '../data/categoryBanners';
import api from '../api';
import {
  X, Scroll, Eye, Edit3, Pin, Calendar,
  Clock, Image as ImageIcon,
  Type, Bold, Italic, Underline, Strikethrough, List, ListOrdered,
  Minus, Link, Quote, Hash, User, Palette, Highlighter,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Code, AlertTriangle, Info, ChevronDown
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
  { id: '', fullName: 'Rada Prefektów Durmstrang', departmentName: 'Przedstawicielstwo Adeptów', signaturePng: '', role: 'admin' }
];

function estimateReadTime(text) {
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min`;
}

export const NewsEditorModal = ({ isOpen, onClose, articleToEdit = null }) => {
  if (!isOpen) return null;

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
  const contentRef = useRef(null);

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

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showHeadingDropdown, setShowHeadingDropdown] = useState(false);
  const [showRuneRow, setShowRuneRow] = useState(false);
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

  // Toolbar insert helpers
  const insertAtCursor = (before, after = '') => {
    const textarea = contentRef.current;
    if (!textarea) { setContent(prev => prev + before + after); return; }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.slice(start, end);
    const newContent = content.slice(0, start) + before + selected + after + content.slice(end);
    setContent(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  };

  const insertLine = (snippet) => {
    const textarea = contentRef.current;
    if (!textarea) { setContent(prev => prev + '\n' + snippet + '\n'); return; }
    const start = textarea.selectionStart;
    const lineStart = content.lastIndexOf('\n', start - 1) + 1;
    const newContent = content.slice(0, lineStart) + snippet + '\n' + content.slice(lineStart);
    setContent(newContent);
    setTimeout(() => { textarea.focus(); }, 0);
  };

  const COLOR_PRESETS = [
    { label: 'Złoty', value: '#c59f4e' },
    { label: 'Lodowy', value: '#a4c8e1' },
    { label: 'Czerwony', value: '#ef4444' },
    { label: 'Szmaragd', value: '#2ec4b6' },
    { label: 'Purpurowy', value: '#b18cfe' },
    { label: 'Biały', value: '#ffffff' },
    { label: 'Ogień', value: '#f59e0b' },
    { label: 'Krew', value: '#b32626' },
  ];

  const insertColor = (color) => {
    insertAtCursor(`{color:${color}}`, '{/color}');
    setShowColorPicker(false);
  };

  const HIGHLIGHT_PRESETS = [
    { label: 'Żółty', value: 'rgba(255,230,0,0.4)' },
    { label: 'Zielony', value: 'rgba(0,200,100,0.3)' },
    { label: 'Różowy', value: 'rgba(255,80,130,0.35)' },
    { label: 'Niebieski', value: 'rgba(80,140,255,0.35)' },
    { label: 'Fioletowy', value: 'rgba(180,80,255,0.35)' },
    { label: 'Pomarańczowy', value: 'rgba(255,150,0,0.4)' },
  ];

  const insertHighlight = (color) => {
    insertAtCursor(`{mark:${color}}`, '{/mark}');
    setShowHighlightPicker(false);
  };

  const insertAlignment = (type) => {
    const textarea = contentRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const lineStart = content.lastIndexOf('\n', start - 1) + 1;
    const lineEndRaw = content.indexOf('\n', start);
    const lineEnd = lineEndRaw === -1 ? content.length : lineEndRaw;
    let lineText = content.slice(lineStart, lineEnd);
    ['{c}', '{r}', '{j}'].forEach(p => { if (lineText.startsWith(p)) lineText = lineText.slice(p.length); });
    const newLine = type === 'l' ? lineText : `{${type}}${lineText}`;
    setContent(content.slice(0, lineStart) + newLine + content.slice(lineEnd));
    setTimeout(() => textarea.focus(), 0);
  };

  const handleEditorKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') { e.preventDefault(); insertAtCursor('**', '**'); }
      else if (e.key === 'i') { e.preventDefault(); insertAtCursor('*', '*'); }
      else if (e.key === 'u') { e.preventDefault(); insertAtCursor('__', '__'); }
    }
  };

  const closeAllToolbarDropdowns = () => {
    setShowColorPicker(false);
    setShowHighlightPicker(false);
    setShowHeadingDropdown(false);
  };

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

  // Renderer podglądu — obsługa rozszerzonego markdown
  const renderPreviewContent = (text) => {
    if (!text) return <p style={{ fontStyle: 'italic', color: '#6b7280' }}>Treść edyktu pojawi się w tym miejscu.</p>;

    const lines = text.split('\n');
    const elements = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];

      if (line.startsWith(':::warning')) {
        const blockLines = [];
        i++;
        while (i < lines.length && !lines[i].startsWith(':::')) { blockLines.push(lines[i]); i++; }
        elements.push(
          <div key={i} style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.4)', borderLeft: '4px solid #f59e0b', borderRadius: '4px', padding: '0.75rem 1rem', marginBottom: '1rem', color: '#fbbf24' }}>
            <strong>⚠ Uwaga:</strong> {blockLines.join(' ')}
          </div>
        );
      } else if (line.startsWith(':::info')) {
        const blockLines = [];
        i++;
        while (i < lines.length && !lines[i].startsWith(':::')) { blockLines.push(lines[i]); i++; }
        elements.push(
          <div key={i} style={{ background: 'rgba(164,200,225,0.1)', border: '1px solid rgba(164,200,225,0.3)', borderLeft: '4px solid var(--ice-frost)', borderRadius: '4px', padding: '0.75rem 1rem', marginBottom: '1rem', color: 'var(--ice-crystal)' }}>
            <strong>ℹ Info:</strong> {blockLines.join(' ')}
          </div>
        );
      } else if (line.startsWith('```')) {
        const codeLines = [];
        i++;
        while (i < lines.length && !lines[i].startsWith('```')) { codeLines.push(lines[i]); i++; }
        elements.push(
          <pre key={i} style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '0.75rem 1rem', marginBottom: '1rem', overflowX: 'auto', fontFamily: 'monospace', fontSize: '0.88rem', color: '#a3e635', whiteSpace: 'pre-wrap' }}>
            <code>{codeLines.join('\n')}</code>
          </pre>
        );
      } else if (line.startsWith('# ') && !line.startsWith('## ')) {
        elements.push(<h1 key={i} style={{ color: '#ffffff', fontFamily: 'var(--font-heading)', fontSize: '1.65rem', marginTop: '1.6rem', marginBottom: '0.6rem', borderBottom: '1px solid rgba(197,159,78,0.3)', paddingBottom: '0.4rem' }}>{renderInline(line.slice(2))}</h1>);
      } else if (line.startsWith('## ')) {
        elements.push(<h2 key={i} style={{ color: 'var(--gold-glow)', fontSize: '1.35rem', marginTop: '1.4rem', marginBottom: '0.5rem' }}>{renderInline(line.slice(3))}</h2>);
      } else if (line.startsWith('### ')) {
        elements.push(<h3 key={i} style={{ color: 'var(--gold-ancient)', fontSize: '1.1rem', marginTop: '1.2rem', marginBottom: '0.4rem' }}>{renderInline(line.slice(4))}</h3>);
      } else if (line.startsWith('> ')) {
        elements.push(<blockquote key={i} style={{ borderLeft: '3px solid var(--gold-ancient)', padding: '0.5rem 1rem', margin: '0.8rem 0', fontStyle: 'italic', color: '#d1d9e6', background: 'rgba(197,159,78,0.05)' }}>{renderInline(line.slice(2))}</blockquote>);
      } else if (line.trim() === '---') {
        elements.push(<hr key={i} style={{ border: 0, height: '1px', background: 'rgba(164,200,225,0.2)', margin: '1.2rem 0' }} />);
      } else if (line.startsWith('* ') || line.startsWith('- ')) {
        const listItems = [];
        while (i < lines.length && (lines[i].startsWith('* ') || lines[i].startsWith('- '))) {
          listItems.push(lines[i].slice(2));
          i++;
        }
        elements.push(<ul key={i} style={{ paddingLeft: '1.5rem', marginBottom: '1rem', color: '#cfd7e4' }}>{listItems.map((li, j) => <li key={j} style={{ marginBottom: '0.25rem' }}>{renderInline(li)}</li>)}</ul>);
        continue;
      } else if (/^\d+\. /.test(line)) {
        const listItems = [];
        while (i < lines.length && /^\d+\. /.test(lines[i])) {
          listItems.push(lines[i].replace(/^\d+\. /, ''));
          i++;
        }
        elements.push(<ol key={i} style={{ paddingLeft: '1.5rem', marginBottom: '1rem', color: '#cfd7e4' }}>{listItems.map((li, j) => <li key={j} style={{ marginBottom: '0.25rem' }}>{renderInline(li)}</li>)}</ol>);
        continue;
      } else if (line.startsWith('![')) {
        const match = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
        if (match) {
          elements.push(<img key={i} src={match[2]} alt={match[1]} style={{ maxWidth: '100%', borderRadius: '4px', marginBottom: '1rem', border: '1px solid rgba(164,200,225,0.2)' }} />);
        }
      } else if (line.trim() !== '') {
        let alignStyle = {};
        let lineContent = line;
        if (line.startsWith('{c}')) { alignStyle = { textAlign: 'center' }; lineContent = line.slice(3); }
        else if (line.startsWith('{r}')) { alignStyle = { textAlign: 'right' }; lineContent = line.slice(3); }
        else if (line.startsWith('{j}')) { alignStyle = { textAlign: 'justify', hyphens: 'auto' }; lineContent = line.slice(3); }
        elements.push(<p key={i} style={{ marginBottom: '1rem', lineHeight: 1.8, ...alignStyle }}>{renderInline(lineContent)}</p>);
      }
      i++;
    }
    return elements;
  };

  const renderInline = (text) => {
    const parts = [];
    const regex = /(\{color:([^}]+)\}(.*?)\{\/color\}|\{mark:([^}]+)\}(.*?)\{\/mark\}|__(.+?)__|\*\*(.+?)\*\*|\*(.+?)\*|~~(.+?)~~|`(.+?)`|\[(.+?)\]\((.+?)\))/g;
    let last = 0, m;
    while ((m = regex.exec(text)) !== null) {
      if (m.index > last) parts.push(text.slice(last, m.index));
      if (m[2])       parts.push(<span key={m.index} style={{ color: m[2] }}>{m[3]}</span>);
      else if (m[4])  parts.push(<mark key={m.index} style={{ background: m[4], padding: '0 2px', borderRadius: '2px', color: 'inherit' }}>{m[5]}</mark>);
      else if (m[6])  parts.push(<u key={m.index}>{m[6]}</u>);
      else if (m[7])  parts.push(<strong key={m.index}>{m[7]}</strong>);
      else if (m[8])  parts.push(<em key={m.index}>{m[8]}</em>);
      else if (m[9])  parts.push(<s key={m.index}>{m[9]}</s>);
      else if (m[10]) parts.push(<code key={m.index} style={{ background: 'rgba(255,255,255,0.1)', padding: '0 4px', borderRadius: '3px', fontFamily: 'monospace', fontSize: '0.88em' }}>{m[10]}</code>);
      else if (m[11]) parts.push(<a key={m.index} href={m[12]} style={{ color: 'var(--ice-frost)', textDecoration: 'underline' }} target="_blank" rel="noreferrer">{m[11]}</a>);
      last = m.index + m[0].length;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts.length > 0 ? parts : text;
  };

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

              {/* 8. Treść z pełnym toolbarem */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.8rem', color: '#ffffff', fontWeight: 600 }}>
                    Pełna Treść Pergaminu
                    {content && <span style={{ marginLeft: '0.5rem', fontSize: '0.72rem', color: '#6b7280' }}>({estimateReadTime(content)} czytania)</span>}
                  </label>
                </div>

                {/* Toolbar Google Docs-style */}
                <div style={{ background: 'rgba(8,12,20,0.98)', border: '1px solid rgba(164,200,225,0.18)', borderBottom: 'none', borderRadius: '6px 6px 0 0', overflow: 'hidden' }}>
                  {/* Główny wiersz toolbara */}
                  <div style={{ padding: '0.3rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.1rem', flexWrap: 'wrap', rowGap: '0.3rem' }}>

                    {/* Styl akapitu */}
                    <div style={{ position: 'relative' }}>
                      <button type="button" onClick={() => { setShowHeadingDropdown(v => !v); setShowColorPicker(false); setShowHighlightPicker(false); }} style={{ padding: '0.25rem 0.55rem', background: showHeadingDropdown ? 'rgba(197,159,78,0.15)' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#d1d9e6', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', height: '28px', whiteSpace: 'nowrap' }}>
                        Styl akapitu <ChevronDown size={11} />
                      </button>
                      {showHeadingDropdown && (
                        <div style={{ position: 'absolute', top: 'calc(100% + 3px)', left: 0, zIndex: 40, background: '#0d1320', border: '1px solid rgba(197,159,78,0.3)', borderRadius: '6px', overflow: 'hidden', minWidth: '185px', boxShadow: '0 8px 24px rgba(0,0,0,0.9)' }}>
                          {[
                            { label: 'Normalny tekst', action: null, s: { fontSize: '0.88rem' } },
                            { label: 'Nagłówek 1', action: () => insertLine('# Nagłówek Główny'), s: { fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-heading)' } },
                            { label: 'Nagłówek 2', action: () => insertLine('## Nagłówek Sekcji'), s: { fontSize: '1rem', fontWeight: 700 } },
                            { label: 'Nagłówek 3', action: () => insertLine('### Podsekcja'), s: { fontSize: '0.9rem', fontWeight: 600, color: 'var(--gold-ancient)' } },
                          ].map((opt, hi) => (
                            <button key={hi} type="button" onClick={() => { opt.action?.(); setShowHeadingDropdown(false); }} style={{ display: 'block', width: '100%', padding: '0.55rem 0.9rem', background: 'transparent', border: 'none', color: '#e2e8f0', cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s', ...opt.s }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ width: '1px', height: '22px', background: 'rgba(255,255,255,0.1)', margin: '0 0.3rem' }} />

                    {/* Styl tekstu */}
                    {[
                      { icon: <Bold size={14} />, title: 'Pogrubienie (Ctrl+B)', action: () => insertAtCursor('**', '**') },
                      { icon: <Italic size={14} />, title: 'Kursywa (Ctrl+I)', action: () => insertAtCursor('*', '*') },
                      { icon: <Underline size={14} />, title: 'Podkreślenie (Ctrl+U)', action: () => insertAtCursor('__', '__') },
                      { icon: <Strikethrough size={14} />, title: 'Przekreślenie', action: () => insertAtCursor('~~', '~~') },
                    ].map((btn, bi) => (
                      <button key={bi} type="button" onClick={btn.action} title={btn.title} className="btn-editor-tool">{btn.icon}</button>
                    ))}

                    <div style={{ width: '1px', height: '22px', background: 'rgba(255,255,255,0.1)', margin: '0 0.3rem' }} />

                    {/* Kolor tekstu */}
                    <div style={{ position: 'relative' }}>
                      <button type="button" title="Kolor tekstu" onClick={() => { setShowColorPicker(v => !v); setShowHighlightPicker(false); setShowHeadingDropdown(false); }} className="btn-editor-tool" style={{ flexDirection: 'column', gap: '1px', height: '28px', color: showColorPicker ? 'var(--gold-ancient)' : undefined }}>
                        <Type size={12} style={{ marginTop: '1px' }} />
                        <div style={{ width: '14px', height: '3px', background: 'var(--gold-ancient)', borderRadius: '1px' }} />
                      </button>
                      {showColorPicker && (
                        <div style={{ position: 'absolute', top: 'calc(100% + 3px)', left: 0, zIndex: 40, background: 'rgba(10,14,22,0.97)', border: '1px solid rgba(164,200,225,0.25)', borderRadius: '6px', padding: '0.5rem', boxShadow: '0 4px 16px rgba(0,0,0,0.8)', width: '182px' }}>
                          <div style={{ fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Kolor tekstu</div>
                          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                            {COLOR_PRESETS.map(c => (
                              <button key={c.value} type="button" title={c.label} onClick={() => insertColor(c.value)} style={{ width: '28px', height: '28px', borderRadius: '4px', border: '2px solid rgba(255,255,255,0.15)', background: c.value, cursor: 'pointer', transition: 'transform 0.15s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Podświetlenie */}
                    <div style={{ position: 'relative' }}>
                      <button type="button" title="Podświetlenie tekstu" onClick={() => { setShowHighlightPicker(v => !v); setShowColorPicker(false); setShowHeadingDropdown(false); }} className="btn-editor-tool" style={{ flexDirection: 'column', gap: '1px', height: '28px', color: showHighlightPicker ? '#fde047' : undefined }}>
                        <Highlighter size={12} style={{ marginTop: '1px' }} />
                        <div style={{ width: '14px', height: '3px', background: '#fde047', borderRadius: '1px' }} />
                      </button>
                      {showHighlightPicker && (
                        <div style={{ position: 'absolute', top: 'calc(100% + 3px)', left: 0, zIndex: 40, background: 'rgba(10,14,22,0.97)', border: '1px solid rgba(164,200,225,0.25)', borderRadius: '6px', padding: '0.5rem', boxShadow: '0 4px 16px rgba(0,0,0,0.8)', width: '182px' }}>
                          <div style={{ fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Podświetlenie</div>
                          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                            {HIGHLIGHT_PRESETS.map(c => (
                              <button key={c.value} type="button" title={c.label} onClick={() => insertHighlight(c.value)} style={{ width: '28px', height: '28px', borderRadius: '4px', border: '2px solid rgba(255,255,255,0.15)', background: c.value, cursor: 'pointer', transition: 'transform 0.15s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ width: '1px', height: '22px', background: 'rgba(255,255,255,0.1)', margin: '0 0.3rem' }} />

                    {/* Wyrównanie */}
                    {[
                      { icon: <AlignLeft size={14} />, title: 'Do lewej', action: () => insertAlignment('l') },
                      { icon: <AlignCenter size={14} />, title: 'Wyśrodkuj', action: () => insertAlignment('c') },
                      { icon: <AlignRight size={14} />, title: 'Do prawej', action: () => insertAlignment('r') },
                      { icon: <AlignJustify size={14} />, title: 'Wyjustowanie', action: () => insertAlignment('j') },
                    ].map((btn, bi) => (
                      <button key={bi} type="button" onClick={btn.action} title={btn.title} className="btn-editor-tool">{btn.icon}</button>
                    ))}

                    <div style={{ width: '1px', height: '22px', background: 'rgba(255,255,255,0.1)', margin: '0 0.3rem' }} />

                    {/* Listy */}
                    {[
                      { icon: <List size={14} />, title: 'Lista punktowana', action: () => insertLine('* Punkt 1\n* Punkt 2\n* Punkt 3') },
                      { icon: <ListOrdered size={14} />, title: 'Lista numerowana', action: () => insertLine('1. Pierwszy\n2. Drugi\n3. Trzeci') },
                    ].map((btn, bi) => (
                      <button key={bi} type="button" onClick={btn.action} title={btn.title} className="btn-editor-tool">{btn.icon}</button>
                    ))}

                    <div style={{ width: '1px', height: '22px', background: 'rgba(255,255,255,0.1)', margin: '0 0.3rem' }} />

                    {/* Bloki specjalne */}
                    {[
                      { icon: <Quote size={14} />, title: 'Cytat', action: () => insertLine('> Cytat lub ważna uwaga') },
                      { icon: <AlertTriangle size={13} />, title: 'Blok ostrzeżenia', action: () => insertLine(':::warning\nTreść ostrzeżenia\n:::') },
                      { icon: <Info size={13} />, title: 'Blok informacyjny', action: () => insertLine(':::info\nTreść informacji\n:::') },
                      { icon: <Code size={13} />, title: 'Blok kodu', action: () => insertLine('```\nKod tutaj\n```') },
                    ].map((btn, bi) => (
                      <button key={bi} type="button" onClick={btn.action} title={btn.title} className="btn-editor-tool">{btn.icon}</button>
                    ))}

                    <div style={{ width: '1px', height: '22px', background: 'rgba(255,255,255,0.1)', margin: '0 0.3rem' }} />

                    {/* Wstawianie */}
                    {[
                      { icon: <Link size={14} />, title: 'Odnośnik', action: () => insertAtCursor('[', '](https://)') },
                      { icon: <ImageIcon size={14} />, title: 'Obraz z URL', action: () => insertLine('![opis](https://url-do-obrazu.jpg)') },
                      { icon: <Minus size={14} />, title: 'Linia rozdzielająca', action: () => insertLine('\n---\n') },
                    ].map((btn, bi) => (
                      <button key={bi} type="button" onClick={btn.action} title={btn.title} className="btn-editor-tool">{btn.icon}</button>
                    ))}

                    <div style={{ width: '1px', height: '22px', background: 'rgba(255,255,255,0.1)', margin: '0 0.3rem' }} />

                    {/* Przełącznik run */}
                    <button type="button" onClick={() => setShowRuneRow(v => !v)} title="Glify Runiczne Elder Futhark" style={{ padding: '0.25rem 0.5rem', background: showRuneRow ? 'rgba(197,159,78,0.2)' : 'rgba(255,255,255,0.04)', border: showRuneRow ? '1px solid rgba(197,159,78,0.4)' : '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', color: showRuneRow ? 'var(--gold-glow)' : '#9ca3af', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', height: '28px' }}>
                      ᚠ Runy
                    </button>
                  </div>

                  {/* Wiersz run (zwijany) */}
                  {showRuneRow && (
                    <div style={{ padding: '0.3rem 0.6rem', display: 'flex', flexWrap: 'wrap', gap: '0.15rem', background: 'rgba(197,159,78,0.04)', borderTop: '1px solid rgba(197,159,78,0.15)' }}>
                      <span style={{ fontSize: '0.68rem', color: 'var(--gold-ancient)', alignSelf: 'center', marginRight: '0.25rem', whiteSpace: 'nowrap' }}>Elder Fuþark:</span>
                      {RUNE_GLYPHS.map(rune => (
                        <button key={rune} type="button" onClick={() => { playRuneChime(); insertAtCursor(rune); }} className="rune-glyph-btn" title={`Wstaw runę ${rune}`}>{rune}</button>
                      ))}
                    </div>
                  )}
                </div>

                <textarea
                  ref={contentRef}
                  rows={10}
                  placeholder={`Napisz szczegółowy traktat...

Formatowanie (skróty: Ctrl+B, Ctrl+I, Ctrl+U):
**pogrubienie** | *kursywa* | __podkreślenie__ | ~~przekreślenie~~
# H1 | ## H2 | ### H3 | > Cytat | * Lista | 1. Numerowanie
{c}wyśrodkowany | {r}do prawej | {j}wyjustowany
{color:#c59f4e}kolor tekstu{/color} | {mark:rgba(255,220,0,0.4)}podświetlenie{/mark}
\`kod inline\` | \`\`\` blok kodu \`\`\` | --- linia | [link](url) | ![obraz](url)`}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={handleEditorKeyDown}
                  className="gothic-textarea"
                  style={{ borderRadius: '0 0 4px 4px', fontFamily: 'monospace', fontSize: '0.88rem' }}
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
                <div className="contentBody" style={{ color: '#cfd7e4', fontSize: '0.98rem', lineHeight: 1.8 }}>
                  {renderPreviewContent(content || summary)}
                </div>

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
