import React, { useState, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import {
  X,
  Plus,
  Trash2,
  Eye,
  Edit3,
  Save,
  Sparkles,
  FileText,
  ShieldAlert,
  Scale,
  MessageSquare,
  Gamepad2,
  BookOpen,
  CheckCircle,
  HelpCircle,
  Flame,
  Award,
  ClipboardCheck
} from 'lucide-react';

const ICON_OPTIONS = [
  { id: 'FileText', label: 'Pergamin / Dokument', icon: FileText },
  { id: 'ShieldAlert', label: 'Dekret Władz / Edykt', icon: ShieldAlert },
  { id: 'ClipboardCheck', label: 'Wizytacja Nauczycielska', icon: ClipboardCheck },
  { id: 'Scale', label: 'Statut / Prawo', icon: Scale },
  { id: 'MessageSquare', label: 'Regulamin Discord (DC)', icon: MessageSquare },
  { id: 'Gamepad2', label: 'Zabawa / Turniej RPG', icon: Gamepad2 },
  { id: 'BookOpen', label: 'Księga / Nauczanie', icon: BookOpen },
  { id: 'Flame', label: 'Magia / Rytuał', icon: Flame },
  { id: 'Award', label: 'Puchar / Zasługa', icon: Award }
];

export const CustomPageEditorModal = ({ isOpen, onClose, editingDoc = null }) => {
  const { saveDocument, showNotification, currentUser } = useSchool();
  const { playWandSwoosh, playRuneChime } = useSound();

  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'preview'
  const [formData, setFormData] = useState({
    id: '',
    slug: '',
    category: 'custom',
    categoryLabel: 'Własna Podstrona',
    number: '',
    title: '',
    subtitle: '',
    author: '',
    authorRole: '',
    date: '',
    sealType: 'gold',
    iconName: 'FileText',
    severity: 'standard',
    summary: '',
    content: [
      { type: 'paragraph', text: '' }
    ],
    tags: ''
  });

  useEffect(() => {
    if (editingDoc) {
      setFormData({
        ...editingDoc,
        tags: Array.isArray(editingDoc.tags) ? editingDoc.tags.join(', ') : editingDoc.tags || ''
      });
    } else {
      const defaultAuthor = currentUser
        ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || currentUser.username || 'Adept Cytadeli'
        : 'Rada Kancelarii TMD';
      const defaultRole = currentUser?.role === 'admin'
        ? 'Arcymistrz Dyrekcji'
        : currentUser?.role === 'professor'
          ? 'Profesor Katedry'
          : 'Adept Północy';

      setFormData({
        id: `doc-${Date.now()}`,
        slug: '',
        category: 'custom',
        categoryLabel: 'Własna Podstrona',
        number: `ED/XIX/${Math.floor(Math.random() * 900 + 100)}`,
        title: '',
        subtitle: '',
        author: defaultAuthor,
        authorRole: defaultRole,
        date: `${new Date().toLocaleDateString('pl-PL')} • XIX Rok Szkolny`,
        sealType: 'gold',
        iconName: 'FileText',
        severity: 'standard',
        summary: '',
        content: [
          { type: 'callout', variant: 'gold', title: 'WPROWADZENIE', text: 'Oficjalny pergamin wprowadzony do archiwum Twierdzy Magii Durmstrang.' },
          { type: 'heading', text: 'Rozdział I. Przedmiot Ustanowienia' },
          { type: 'paragraph', text: 'Wpisz treść artykułu lub opisu nowej podstrony...' }
        ],
        tags: 'podstrona, dokument, durmstrang'
      });
    }
  }, [editingDoc, currentUser, isOpen]);

  // Handle ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const renderInline = (text) => {
    if (!text) return text;
    const parts = [];
    const regex = /(__(.+?)__|\*\*(.+?)\*\*|\*(.+?)\*|~~(.+?)~~|`(.+?)`)/g;
    let last = 0, m;
    while ((m = regex.exec(text)) !== null) {
      if (m.index > last) parts.push(text.slice(last, m.index));
      if (m[2])      parts.push(<u key={m.index}>{m[2]}</u>);
      else if (m[3]) parts.push(<strong key={m.index}>{m[3]}</strong>);
      else if (m[4]) parts.push(<em key={m.index}>{m[4]}</em>);
      else if (m[5]) parts.push(<s key={m.index}>{m[5]}</s>);
      else if (m[6]) parts.push(<code key={m.index} style={{ background: 'rgba(255,255,255,0.1)', padding: '0 3px', borderRadius: '3px', fontFamily: 'monospace', fontSize: '0.88em' }}>{m[6]}</code>);
      last = m.index + m[0].length;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts.length > 0 ? parts : text;
  };

  const insertIntoBlock = (idx, before, after = '') => {
    const ta = document.getElementById(`block-ta-${idx}`);
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const text = formData.content[idx]?.text || '';
    const selected = text.slice(start, end);
    const newText = text.slice(0, start) + before + selected + after + text.slice(end);
    updateContentBlock(idx, 'text', newText);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 10);
  };

  const miniToolbar = (idx) => {
    const bs = { padding: '0.18rem 0.32rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '3px', color: '#d1d5db', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '26px', height: '24px', fontSize: '12px' };
    const vsep = React.createElement('div', { style: { width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)', margin: '0 0.2rem', alignSelf: 'center' } });
    return React.createElement('div', { style: { display: 'flex', gap: '0.15rem', padding: '0.22rem 0.4rem', background: 'rgba(0,0,0,0.45)', borderRadius: '4px 4px 0 0', border: '1px solid rgba(255,255,255,0.07)', borderBottom: 'none', alignItems: 'center' } },
      React.createElement('button', { type: 'button', onClick: () => insertIntoBlock(idx, '**', '**'), title: 'Pogrubienie', style: bs }, React.createElement('strong', { style: { fontFamily: 'serif' } }, 'B')),
      React.createElement('button', { type: 'button', onClick: () => insertIntoBlock(idx, '*', '*'), title: 'Kursywa', style: bs }, React.createElement('em', { style: { fontFamily: 'serif' } }, 'I')),
      React.createElement('button', { type: 'button', onClick: () => insertIntoBlock(idx, '__', '__'), title: 'Podkreślenie', style: bs }, React.createElement('u', null, 'U')),
      React.createElement('button', { type: 'button', onClick: () => insertIntoBlock(idx, '~~', '~~'), title: 'Przekreślenie', style: bs }, React.createElement('s', null, 'S')),
      vsep,
      React.createElement('button', { type: 'button', onClick: () => insertIntoBlock(idx, String.fromCharCode(96), String.fromCharCode(96)), title: 'Kod', style: { ...bs, fontFamily: 'monospace', fontSize: '11px' } }, '</>'),
      vsep,
      React.createElement('span', { style: { fontSize: '0.62rem', color: '#6b7280', padding: '0 0.15rem', whiteSpace: 'nowrap' } }, '**B** *I* __U__ ~~S~~')
    );
  };

  const generateSlugFromTitle = (title) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e').replace(/ł/g, 'l')
      .replace(/ń/g, 'n').replace(/ó/g, 'o').replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({
      ...prev,
      title: val,
      slug: prev.slug && editingDoc ? prev.slug : generateSlugFromTitle(val)
    }));
  };

  const addContentBlock = (type) => {
    playWandSwoosh();
    let newBlock = { type, text: '' };
    if (type === 'callout') newBlock = { type: 'callout', variant: 'info', title: 'UWAGA', text: '' };
    if (type === 'list') newBlock = { type: 'list', items: ['Punkt 1...', 'Punkt 2...'] };
    if (type === 'heading') newBlock = { type: 'heading', text: 'Nowy Nagłówek Sekcji' };
    if (type === 'quote') newBlock = { type: 'quote', text: '„Cytat lub motto...”' };

    setFormData(prev => ({
      ...prev,
      content: [...prev.content, newBlock]
    }));
  };

  const removeContentBlock = (index) => {
    playWandSwoosh();
    setFormData(prev => ({
      ...prev,
      content: prev.content.filter((_, idx) => idx !== index)
    }));
  };

  const updateContentBlock = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.content];
      if (field === 'items' && typeof value === 'string') {
        updated[index] = { ...updated[index], items: value.split('\n').filter(Boolean) };
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return { ...prev, content: updated };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showNotification('Brak Tytułu', 'Wprowadź tytuł tworzonego dokumentu / podstrony.', 'warning');
      return;
    }

    const finalSlug = formData.slug.trim() || generateSlugFromTitle(formData.title) || `strona-${Date.now()}`;
    const tagsArray = typeof formData.tags === 'string'
      ? formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      : formData.tags;

    const docToSave = {
      ...formData,
      slug: finalSlug,
      tags: tagsArray,
      isCustom: true
    };

    saveDocument(docToSave);
    playRuneChime();
    showNotification('Zapisano Podstronę', `Dokument „${formData.title}” jest teraz dostępny pod adresem #/dokument/${finalSlug}`, 'success');
    onClose();
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
          background: 'linear-gradient(180deg, #131822 0%, #0a0c10 100%)',
          border: '2px solid var(--gold-ancient)',
          boxShadow: '0 15px 50px rgba(0, 0, 0, 0.95), 0 0 35px rgba(197, 159, 78, 0.25)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '920px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.25s ease-out'
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: 'rgba(197, 159, 78, 0.15)',
                border: '1px solid var(--gold-ancient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--gold-ancient)'
              }}
            >
              <Edit3 size={16} />
            </div>
            <div>
              <h3 style={{ margin: 0, color: '#ffffff', fontFamily: 'var(--font-heading)', fontSize: '1.15rem' }}>
                {editingDoc ? 'Edycja Dokumentu / Podstrony' : 'Kreator Nowej Podstrony i Dekretu'}
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                Twórz nowe podstrony, edykty, kodeksy lub regulaminy bezpośrednio z poziomu frontendu
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.5)', padding: '3px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                style={{
                  padding: '0.35rem 0.8rem',
                  background: activeTab === 'editor' ? 'rgba(197, 159, 78, 0.25)' : 'transparent',
                  border: activeTab === 'editor' ? '1px solid var(--gold-ancient)' : 'none',
                  borderRadius: '4px',
                  color: activeTab === 'editor' ? '#ffffff' : '#9ca3af',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <Edit3 size={13} /> Edytor
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                style={{
                  padding: '0.35rem 0.8rem',
                  background: activeTab === 'preview' ? 'rgba(197, 159, 78, 0.25)' : 'transparent',
                  border: activeTab === 'preview' ? '1px solid var(--gold-ancient)' : 'none',
                  borderRadius: '4px',
                  color: activeTab === 'preview' ? '#ffffff' : '#9ca3af',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <Eye size={13} /> Podgląd
              </button>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
                padding: '0.4rem',
                display: 'flex'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'editor' ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {/* Row 1: Title & Category */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--gold-ancient)', fontSize: '0.82rem', marginBottom: '0.35rem', fontFamily: 'var(--font-heading)' }}>
                    Tytuł Podstrony / Dokumentu *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={handleTitleChange}
                    placeholder="np. Dekret o Nowych Szatach Zakonnych..."
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: 'rgba(8, 11, 16, 0.8)',
                      border: '1px solid rgba(197, 159, 78, 0.3)',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '0.92rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: 'var(--gold-ancient)', fontSize: '0.82rem', marginBottom: '0.35rem', fontFamily: 'var(--font-heading)' }}>
                    Kategoria
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      const cat = e.target.value;
                      const labels = {
                        'dekrety': 'Dekret Władz',
                        'wizytacje': 'Wizytacja Nauczycielska',
                        'statut': 'Statut Instytutu',
                        'regulamin-dc': 'Regulamin DC',
                        'zabawy': 'Opis Zabaw & Gier',
                        'custom': 'Własna Podstrona'
                      };
                      setFormData(prev => ({ ...prev, category: cat, categoryLabel: labels[cat] || 'Dokument' }));
                    }}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: 'rgba(8, 11, 16, 0.8)',
                      border: '1px solid rgba(197, 159, 78, 0.3)',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '0.92rem',
                      outline: 'none'
                    }}
                  >
                    <option value="dekrety">Dekrety Władz</option>
                    <option value="wizytacje">Wizytacje Nauczycieli</option>
                    <option value="statut">Statut Instytutu</option>
                    <option value="regulamin-dc">Regulamin DC</option>
                    <option value="zabawy">Opis Zabaw & Gier</option>
                    <option value="custom">Własna Podstrona</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Subtitle & Slug */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                    Podtytuł / Krótkie Wyjaśnienie
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="np. Oficjalne wytyczne dotyczące ubioru adeptów"
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      background: 'rgba(8, 11, 16, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '0.88rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                    Adres URL (Slug): <code style={{ color: 'var(--gold-ancient)' }}>#/dokument/{formData.slug || '...'}</code>
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="unikalny-slug"
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      background: 'rgba(8, 11, 16, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '0.88rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Row 3: Author, Role, Number & Seal */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.78rem', marginBottom: '0.3rem' }}>
                    Autor
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      background: 'rgba(8, 11, 16, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.78rem', marginBottom: '0.3rem' }}>
                    Rola / Funkcja
                  </label>
                  <input
                    type="text"
                    value={formData.authorRole}
                    onChange={(e) => setFormData({ ...formData, authorRole: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      background: 'rgba(8, 11, 16, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.78rem', marginBottom: '0.3rem' }}>
                    Sygnatura / Numer
                  </label>
                  <input
                    type="text"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    placeholder="np. IV/XIX"
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      background: 'rgba(8, 11, 16, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.78rem', marginBottom: '0.3rem' }}>
                    Pieczęć
                  </label>
                  <select
                    value={formData.sealType}
                    onChange={(e) => setFormData({ ...formData, sealType: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      background: 'rgba(8, 11, 16, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '0.85rem'
                    }}
                  >
                    <option value="gold">Złota Pieczęć Dyrekcji</option>
                    <option value="ruby">Karmazynowa Pieczęć Krwi</option>
                    <option value="blue">Błękitna Pieczęć Astromancji</option>
                    <option value="emerald">Szmaragdowa Pieczęć Alchemii</option>
                  </select>
                </div>
              </div>

              {/* Summary */}
              <div>
                <label style={{ display: 'block', color: 'var(--gold-ancient)', fontSize: '0.82rem', marginBottom: '0.35rem', fontFamily: 'var(--font-heading)' }}>
                  Krótkie Podsumowanie / Abstrakt
                </label>
                <textarea
                  rows={2}
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="Krótki zarys dokumentu wyświetlany na liście i w wyszukiwarce..."
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: 'rgba(8, 11, 16, 0.8)',
                    border: '1px solid rgba(197, 159, 78, 0.25)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Dynamic Content Blocks Section */}
              <div style={{ borderTop: '1px solid rgba(197, 159, 78, 0.2)', paddingTop: '1.2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.6rem' }}>
                  <div style={{ fontFamily: 'var(--font-heading)', color: '#ffffff', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <BookOpen size={16} color="var(--gold-ancient)" /> Bloki Treści Podstrony ({formData.content.length})
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => addContentBlock('paragraph')}
                      style={{ padding: '0.35rem 0.65rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '4px', color: '#ffffff', fontSize: '0.78rem', cursor: 'pointer' }}
                    >
                      + Akapit
                    </button>
                    <button
                      type="button"
                      onClick={() => addContentBlock('heading')}
                      style={{ padding: '0.35rem 0.65rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '4px', color: '#ffffff', fontSize: '0.78rem', cursor: 'pointer' }}
                    >
                      + Nagłówek
                    </button>
                    <button
                      type="button"
                      onClick={() => addContentBlock('callout')}
                      style={{ padding: '0.35rem 0.65rem', background: 'rgba(197, 159, 78, 0.15)', border: '1px solid var(--gold-ancient)', borderRadius: '4px', color: 'var(--gold-ancient)', fontSize: '0.78rem', cursor: 'pointer' }}
                    >
                      + Ramka / Alert
                    </button>
                    <button
                      type="button"
                      onClick={() => addContentBlock('list')}
                      style={{ padding: '0.35rem 0.65rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '4px', color: '#ffffff', fontSize: '0.78rem', cursor: 'pointer' }}
                    >
                      + Lista Punktów
                    </button>
                    <button
                      type="button"
                      onClick={() => addContentBlock('quote')}
                      style={{ padding: '0.35rem 0.65rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '4px', color: '#ffffff', fontSize: '0.78rem', cursor: 'pointer' }}
                    >
                      + Cytat / Sento
                    </button>
                  </div>
                </div>

                {/* Rendered Block Editors */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {formData.content.map((block, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(6, 9, 13, 0.75)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '6px',
                        padding: '1rem',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                        <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--gold-ancient)', fontWeight: 600, letterSpacing: '0.08em' }}>
                          Blok #{idx + 1}: {block.type}
                        </span>
                        {formData.content.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeContentBlock(idx)}
                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex' }}
                            title="Usuń blok"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>

                      {block.type === 'heading' && (
                        <input
                          type="text"
                          value={block.text || ''}
                          onChange={(e) => updateContentBlock(idx, 'text', e.target.value)}
                          placeholder="Tytuł rozdziału / nagłówek..."
                          style={{ width: '100%', padding: '0.5rem 0.7rem', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(197, 159, 78, 0.3)', borderRadius: '4px', color: '#ffffff', fontWeight: 700 }}
                        />
                      )}

                      {block.type === 'paragraph' && (
                        <>
                          {miniToolbar(idx)}
                          <textarea
                            id={`block-ta-${idx}`}
                            rows={3}
                            value={block.text || ''}
                            onChange={(e) => updateContentBlock(idx, 'text', e.target.value)}
                            placeholder="Wpisz treść akapitu... (**pogrubienie** *kursywa* __podkreślenie__)"
                            style={{ width: '100%', padding: '0.5rem 0.7rem', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0 0 4px 4px', color: '#d1d5db', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.85rem' }}
                          />
                        </>
                      )}

                      {block.type === 'callout' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                            <input
                              type="text"
                              value={block.title || ''}
                              onChange={(e) => updateContentBlock(idx, 'title', e.target.value)}
                              placeholder="Tytuł ramki (np. WAŻNE OSTRZEŻENIE)"
                              style={{ padding: '0.45rem 0.6rem', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#ffffff' }}
                            />
                            <select
                              value={block.variant || 'gold'}
                              onChange={(e) => updateContentBlock(idx, 'variant', e.target.value)}
                              style={{ padding: '0.45rem 0.6rem', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#ffffff' }}
                            >
                              <option value="gold">Złoty (Oficjalny)</option>
                              <option value="danger">Czerwony (Ostrzeżenie)</option>
                              <option value="warning">Pomarańczowy (Uwaga)</option>
                              <option value="info">Niebieski (Informacja)</option>
                              <option value="success">Szmaragdowy (Sukces)</option>
                            </select>
                          </div>
                          <textarea
                            rows={2}
                            value={block.text || ''}
                            onChange={(e) => updateContentBlock(idx, 'text', e.target.value)}
                            placeholder="Treść wyróżnionej ramki..."
                            style={{ width: '100%', padding: '0.5rem 0.7rem', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#ffffff', resize: 'vertical' }}
                          />
                        </div>
                      )}

                      {block.type === 'list' && (
                        <div>
                          <span style={{ fontSize: '0.72rem', color: '#9ca3af', display: 'block', marginBottom: '0.2rem' }}>
                            Każda linia to jeden punkt listy:
                          </span>
                          <textarea
                            rows={4}
                            value={Array.isArray(block.items) ? block.items.join('\n') : ''}
                            onChange={(e) => updateContentBlock(idx, 'items', e.target.value)}
                            placeholder="Punkt pierwszy...&#10;Punkt drugi...&#10;Punkt trzeci..."
                            style={{ width: '100%', padding: '0.5rem 0.7rem', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#d1d5db', resize: 'vertical' }}
                          />
                        </div>
                      )}

                      {block.type === 'quote' && (
                        <>
                          {miniToolbar(idx)}
                          <textarea
                            id={`block-ta-${idx}`}
                            rows={2}
                            value={block.text || ''}
                            onChange={(e) => updateContentBlock(idx, 'text', e.target.value)}
                            placeholder="Cytat lub sentencja lub motto..."
                            style={{ width: '100%', padding: '0.5rem 0.7rem', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(197, 159, 78, 0.3)', borderRadius: '0 0 4px 4px', color: 'var(--gold-glow)', fontStyle: 'italic', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.85rem' }}
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                  Tagi (rozdzielone przecinkami)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="dekrety, prawo, dormitoria, bezpieczeństwo"
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    background: 'rgba(8, 11, 16, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              {/* Form Action Bar */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', paddingTop: '1rem', borderTop: '1px solid rgba(197, 159, 78, 0.25)' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '0.65rem 1.2rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '6px',
                    color: '#9ca3af',
                    cursor: 'pointer'
                  }}
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.65rem 1.4rem',
                    background: 'linear-gradient(135deg, var(--gold-ancient) 0%, #9a7628 100%)',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#000000',
                    fontWeight: 700,
                    fontFamily: 'var(--font-heading)',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 15px rgba(197, 159, 78, 0.35)'
                  }}
                >
                  <Save size={16} /> Zapisz i Opublikuj Podstronę
                </button>
              </div>
            </form>
          ) : (
            /* Live Preview Mode */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div
                style={{
                  background: 'rgba(14, 18, 26, 0.85)',
                  border: '1px solid rgba(197, 159, 78, 0.3)',
                  borderRadius: '10px',
                  padding: '2rem',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(197, 159, 78, 0.2)', paddingBottom: '1.2rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gold-ancient)', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
                      {formData.categoryLabel} • Sygnatura: {formData.number || 'XIX'}
                    </span>
                    <h2 style={{ color: '#ffffff', fontFamily: 'var(--font-heading)', fontSize: '1.6rem', margin: '0.4rem 0 0.3rem 0' }}>
                      {formData.title || 'Tytuł Dokumentu'}
                    </h2>
                    {formData.subtitle && (
                      <p style={{ color: '#9ca3af', margin: 0, fontSize: '0.95rem', fontStyle: 'italic' }}>
                        {formData.subtitle}
                      </p>
                    )}
                  </div>

                  <div style={{ textAlign: 'right', fontSize: '0.82rem', color: '#9ca3af' }}>
                    <div style={{ color: '#ffffff', fontWeight: 600 }}>{formData.author || 'Autor'}</div>
                    <div>{formData.authorRole || 'Rola'}</div>
                    <div style={{ color: 'var(--gold-ancient)', fontSize: '0.76rem', marginTop: '0.2rem' }}>{formData.date}</div>
                  </div>
                </div>

                {formData.summary && (
                  <div style={{ padding: '0.9rem 1.2rem', background: 'rgba(197, 159, 78, 0.08)', borderLeft: '3px solid var(--gold-ancient)', marginBottom: '1.5rem', color: '#d1d5db', fontSize: '0.92rem' }}>
                    {formData.summary}
                  </div>
                )}

                {/* Content rendering in preview */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  {formData.content.map((block, i) => {
                    if (block.type === 'heading') {
                      return <h3 key={i} style={{ color: '#ffffff', fontFamily: 'var(--font-heading)', fontSize: '1.25rem', margin: '0.8rem 0 0.2rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.4rem' }}>{block.text}</h3>;
                    }
                    if (block.type === 'paragraph') {
                      return <p key={i} style={{ color: '#d1d5db', fontSize: '0.94rem', lineHeight: 1.7, margin: 0 }}>{renderInline(block.text)}</p>;
                    }
                    if (block.type === 'callout') {
                      const colors = {
                        danger: { border: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', text: '#fca5a5' },
                        warning: { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', text: '#fde68a' },
                        info: { border: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', text: '#bfdbfe' },
                        success: { border: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', text: '#a7f3d0' },
                        gold: { border: 'var(--gold-ancient)', bg: 'rgba(197, 159, 78, 0.12)', text: 'var(--gold-glow)' }
                      };
                      const style = colors[block.variant] || colors.gold;
                      return (
                        <div key={i} style={{ background: style.bg, border: `1px solid ${style.border}`, borderRadius: '8px', padding: '1rem 1.2rem' }}>
                          {block.title && <h4 style={{ margin: '0 0 0.4rem 0', color: style.text, fontSize: '0.92rem', fontFamily: 'var(--font-heading)' }}>{block.title}</h4>}
                          <p style={{ margin: 0, color: '#ffffff', fontSize: '0.9rem', lineHeight: 1.6 }}>{block.text}</p>
                        </div>
                      );
                    }
                    if (block.type === 'list') {
                      return (
                        <ul key={i} style={{ color: '#d1d5db', fontSize: '0.92rem', lineHeight: 1.8, paddingLeft: '1.4rem', margin: 0 }}>
                          {(block.items || []).map((it, j) => <li key={j}>{it}</li>)}
                        </ul>
                      );
                    }
                    if (block.type === 'quote') {
                      return (
                        <blockquote key={i} style={{ borderLeft: '3px solid var(--gold-ancient)', margin: 0, padding: '0.6rem 1.2rem', color: 'var(--gold-glow)', fontStyle: 'italic', background: 'rgba(0,0,0,0.3)' }}>
                          {renderInline(block.text)}
                        </blockquote>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
