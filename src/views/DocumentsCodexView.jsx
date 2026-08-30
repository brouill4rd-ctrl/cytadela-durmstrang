import React, { useState, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import { CustomPageEditorModal } from '../components/CustomPageEditorModal';
import { INITIAL_DOCUMENTS } from '../data/seedDocuments';
import {
  Scroll,
  Shield,
  ShieldAlert,
  Scale,
  MessageSquare,
  Gamepad2,
  BookOpen,
  Search,
  Plus,
  Edit3,
  Trash2,
  Copy,
  ExternalLink,
  Sparkles,
  Award,
  ChevronRight,
  Flame,
  CheckCircle,
  FileText,
  Printer,
  ArrowLeft,
  ClipboardCheck,
  Crown,
  UserCheck,
  Mail,
  Zap
} from 'lucide-react';

const CATEGORY_ICONS = {
  'all': FileText,
  'wladze': Crown,
  'dekrety': ShieldAlert,
  'wizytacje': ClipboardCheck,
  'statut': Scale,
  'regulamin-dc': MessageSquare,
  'zabawy': Gamepad2,
  'custom': Sparkles
};

export const DocumentsCodexView = () => {
  const {
    documents,
    activeDocumentSlug,
    setActiveDocumentSlug,
    activeDocumentCategory,
    setActiveDocumentCategory,
    deleteDocument,
    showNotification,
    currentUser,
    currentRole,
    setActiveView,
    users
  } = useSchool();

  const { playWandSwoosh, playRuneChime } = useSound();

  const [searchQuery, setSearchQuery] = useState('');
  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);

  // Combine stored documents with initial documents to ensure newly added ones are always present
  const allDocs = Array.from(
    new Map([
      ...INITIAL_DOCUMENTS.map(d => [d.slug || d.id, d]),
      ...(documents || []).map(d => [d.slug || d.id, d])
    ]).values()
  );

  // Sync hash routing on mount and on every hashchange event
  useEffect(() => {
    const syncHash = () => {
      const hash = window.location.hash;
      if (hash.includes('/dokument/') || hash.includes('/strona/')) {
        const slug = hash.split('/')[2];
        if (slug) {
          setActiveDocumentSlug(slug);
          const found = allDocs.find(d => d.slug === slug || d.id === slug);
          if (found && found.category) {
            setActiveDocumentCategory(found.category);
          }
        }
      } else if (hash.includes('/wladze') || hash.includes('/obowiazki') || hash.includes('/kompetencje')) {
        setActiveDocumentCategory('wladze');
        setActiveDocumentSlug('obowiazki-i-kompetencje-wladz-twierdzy');
      } else if (hash.includes('/dekrety')) {
        setActiveDocumentCategory('dekrety');
        setActiveDocumentSlug(null);
      } else if (hash.includes('/wizytacje') || hash.includes('/hospitacje')) {
        setActiveDocumentCategory('wizytacje');
        setActiveDocumentSlug(null);
      } else if (hash.includes('/regulamin-dc') || hash.includes('/regulamin-discord')) {
        setActiveDocumentCategory('regulamin-dc');
        setActiveDocumentSlug(null);
      } else if (hash.includes('/statut')) {
        setActiveDocumentCategory('statut');
        setActiveDocumentSlug(null);
      } else if (hash.includes('/zabawy') || hash.includes('/gry')) {
        setActiveDocumentCategory('zabawy');
        setActiveDocumentSlug(null);
      } else if (hash.includes('/dokumenty')) {
        setActiveDocumentCategory('all');
      }
    };

    syncHash();
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, []);

  const selectedCategory = activeDocumentCategory || 'all';

  // Filter documents
  const filteredDocs = allDocs.filter(doc => {
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory || (selectedCategory === 'custom' && doc.isCustom);
    const matchesSearch = !searchQuery ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.subtitle && doc.subtitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.summary && doc.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (Array.isArray(doc.tags) && doc.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCategory && matchesSearch;
  });

  // Active document resolution (if specific slug requested, always honor it)
  const docFromSlug = activeDocumentSlug ? allDocs.find(d => d.slug === activeDocumentSlug || d.id === activeDocumentSlug) : null;
  const activeDoc = docFromSlug || (filteredDocs[0] || allDocs[0]);

  // Auto-sync category tab if active document belongs to a category
  useEffect(() => {
    if (activeDoc && activeDoc.category && activeDocumentCategory !== 'all' && activeDocumentCategory !== activeDoc.category) {
      setActiveDocumentCategory(activeDoc.category);
    }
  }, [activeDoc?.id]);

  const handleSelectDoc = (doc) => {
    playWandSwoosh();
    setActiveDocumentSlug(doc.slug);
    window.location.hash = `#/dokument/${doc.slug}`;
  };

  const handleSelectCategory = (catId) => {
    playWandSwoosh();
    setActiveDocumentCategory(catId);
    setActiveDocumentSlug(null);
    if (catId === 'all') {
      window.location.hash = '#/dokumenty';
    } else {
      window.location.hash = `#/${catId}`;
    }
  };

  const copyDocLink = (doc) => {
    playRuneChime();
    const url = `${window.location.origin}${window.location.pathname}#/dokument/${doc.slug}`;
    navigator.clipboard.writeText(url);
    showNotification('Skopiowano Odnośnik', `Bezpośredni link do pergaminu „${doc.title}” został skopiowany.`, 'info');
  };

  const handleDelete = (doc) => {
    if (window.confirm(`Czy na pewno chcesz usunąć podstronę „${doc.title}”?`)) {
      deleteDocument(doc.id);
      playRuneChime();
      showNotification('Usunięto Dokument', `Podstrona „${doc.title}” została usunięta.`, 'info');
    }
  };

  const handlePrint = () => {
    playRuneChime();
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* =========================================================================
          HEADER SECTION: KANCELARIA DEKRETÓW & STATUTU
          ========================================================================= */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(14, 18, 26, 0.96), rgba(8, 10, 15, 0.98))',
          border: '1px solid rgba(197, 159, 78, 0.3)',
          borderRadius: '12px',
          padding: '2.2rem 2.5rem',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 15px 35px rgba(0, 0, 0, 0.6), inset 0 0 30px rgba(197, 159, 78, 0.05)'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            fontSize: '12rem',
            color: 'rgba(197, 159, 78, 0.03)',
            fontFamily: 'var(--font-nordic)',
            userSelect: 'none',
            pointerEvents: 'none'
          }}
        >
          ᛞ
        </div>

        <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
              <span style={{ color: 'var(--gold-ancient)', fontSize: '1.4rem' }}>ᛞ</span>
              <span style={{ color: 'var(--gold-ancient)', fontSize: '0.85rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
                Archiwum Państwowe & Kancelaria Cytadeli TMD
              </span>
            </div>
            <h1 style={{ fontSize: '2.3rem', color: '#ffffff', fontFamily: 'var(--font-heading)', margin: '0 0 0.8rem 0' }}>
              Dekrety, Regulaminy, Statut & Zabawy
            </h1>
            <p style={{ color: '#9ca3af', maxWidth: '780px', fontSize: '0.98rem', lineHeight: 1.6, margin: 0 }}>
              Oficjalny zbiór edyktów Dyrekcji, regulamin społeczności Discord (DC), Statut Twierdzy Magii Durmstrang oraz kompendium tradycyjnych gier i aktywności.
            </p>
          </div>

          {/* New Page Button - Admin Only */}
          {(currentUser?.role === 'admin' || currentRole === 'admin') && (
            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  playWandSwoosh();
                  setEditingDoc(null);
                  setEditorModalOpen(true);
                }}
                style={{
                  padding: '0.7rem 1.3rem',
                  background: 'linear-gradient(135deg, var(--gold-ancient) 0%, #9a7628 100%)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#000000',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-heading)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 15px rgba(197, 159, 78, 0.35)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Plus size={16} /> Stwórz Nową Podstronę / Dekret
              </button>
            </div>
          )}
        </div>

        {/* Global Live Search */}
        <div style={{ marginTop: '1.6rem', position: 'relative' }}>
          <Search size={18} color="var(--gold-ancient)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Przeszukaj dekrety, regulamin DC, statut, zasady gier lub własne podstrony..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.85rem 1rem 0.85rem 2.8rem',
              background: 'rgba(5, 7, 10, 0.85)',
              border: '1px solid rgba(197, 159, 78, 0.3)',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '0.92rem',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* =========================================================================
          CATEGORY SELECTOR BUTTONS
          ========================================================================= */}
      <div
        style={{
          display: 'flex',
          gap: '0.6rem',
          borderBottom: '1px solid rgba(197, 159, 78, 0.2)',
          paddingBottom: '0.6rem',
          flexWrap: 'wrap'
        }}
      >
        {[
          { id: 'all', label: 'Wszystkie Dokumenty', icon: FileText, count: allDocs.length },
          { id: 'wladze', label: 'Obowiązki Władz Twierdzy', icon: Crown, count: allDocs.filter(d => d.category === 'wladze').length },
          { id: 'dekrety', label: 'Dekrety Władz', icon: ShieldAlert, count: allDocs.filter(d => d.category === 'dekrety').length },
          { id: 'wizytacje', label: 'Wizytacje Nauczycieli', icon: ClipboardCheck, count: allDocs.filter(d => d.category === 'wizytacje').length },
          { id: 'statut', label: 'Statut Szkoły', icon: Scale, count: allDocs.filter(d => d.category === 'statut').length },
          { id: 'regulamin-dc', label: 'Regulamin DC', icon: MessageSquare, count: allDocs.filter(d => d.category === 'regulamin-dc').length },
          { id: 'zabawy', label: 'Opis Zabaw & Gier', icon: Gamepad2, count: allDocs.filter(d => d.category === 'zabawy').length },
          { id: 'custom', label: 'Własne Podstrony', icon: Sparkles, count: allDocs.filter(d => d.isCustom).length }
        ].map(cat => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => handleSelectCategory(cat.id)}
              style={{
                padding: '0.65rem 1.15rem',
                background: isActive ? 'rgba(197, 159, 78, 0.2)' : 'rgba(12, 16, 24, 0.6)',
                border: isActive ? '1px solid var(--gold-ancient)' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '6px',
                color: isActive ? '#ffffff' : '#9ca3af',
                fontFamily: 'var(--font-heading)',
                fontSize: '0.86rem',
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? '0 0 15px rgba(197, 159, 78, 0.15)' : 'none'
              }}
            >
              <Icon size={15} color={isActive ? 'var(--gold-ancient)' : '#9ca3af'} />
              <span>{cat.label}</span>
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  background: isActive ? 'var(--gold-ancient)' : 'rgba(255,255,255,0.08)',
                  color: isActive ? '#000000' : '#9ca3af',
                  fontWeight: 700
                }}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          HORIZONTAL SUBPAGE SELECTOR RIBBON (QUICK SWITCHER BETWEEN DOCS IN CATEGORY)
          ========================================================================= */}
      {filteredDocs.length > 1 && (
        <div
          style={{
            display: 'flex',
            gap: '0.6rem',
            overflowX: 'auto',
            padding: '0.4rem 0 0.8rem 0',
            scrollbarWidth: 'thin'
          }}
        >
          {filteredDocs.map(doc => {
            const isSelected = activeDoc?.id === doc.id;
            const IconComp = CATEGORY_ICONS[doc.category] || FileText;

            return (
              <button
                key={doc.id}
                onClick={() => handleSelectDoc(doc)}
                style={{
                  padding: '0.55rem 0.95rem',
                  background: isSelected ? 'rgba(197, 159, 78, 0.22)' : 'rgba(12, 16, 24, 0.75)',
                  border: isSelected ? '1px solid var(--gold-ancient)' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  color: isSelected ? '#ffffff' : '#9ca3af',
                  fontSize: '0.82rem',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 0 15px rgba(197, 159, 78, 0.15)' : 'none'
                }}
              >
                <IconComp size={13} color={isSelected ? 'var(--gold-ancient)' : '#6b7280'} />
                {doc.number && (
                  <span style={{ color: 'var(--gold-ancient)', fontWeight: 800 }}>[{doc.number}]</span>
                )}
                <span>{doc.title.length > 45 ? `${doc.title.slice(0, 45)}...` : doc.title}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          FULL-WIDTH MONUMENTAL DOCUMENT PARCHMENT CODEX (NO SQUISHED SIDE COLUMNS)
          ========================================================================= */}
      {activeDoc ? (
        <article
          style={{
            background: 'linear-gradient(180deg, rgba(14, 18, 26, 0.95) 0%, rgba(8, 11, 16, 0.98) 100%)',
            border: '1px solid rgba(197, 159, 78, 0.35)',
            borderRadius: '12px',
            padding: '2.5rem',
            position: 'relative',
            boxShadow: '0 15px 45px rgba(0,0,0,0.7), inset 0 0 35px rgba(197, 159, 78, 0.04)',
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          {/* Action Bar atop document */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(197, 159, 78, 0.2)', paddingBottom: '1.2rem', marginBottom: '1.8rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span
                style={{
                  padding: '0.35rem 0.75rem',
                  background: 'rgba(197, 159, 78, 0.15)',
                  border: '1px solid var(--gold-ancient)',
                  borderRadius: '4px',
                  color: 'var(--gold-ancient)',
                  fontSize: '0.78rem',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}
              >
                {activeDoc.categoryLabel || activeDoc.category}
              </span>

              {activeDoc.number && (
                <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
                  Sygnatura: <strong style={{ color: '#ffffff' }}>{activeDoc.number}</strong>
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => copyDocLink(activeDoc)}
                style={{
                  padding: '0.45rem 0.85rem',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(197, 159, 78, 0.3)',
                  borderRadius: '4px',
                  color: 'var(--gold-ancient)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
                title="Kopiuj bezpośredni odnośnik"
              >
                <Copy size={14} /> Link do podstrony
              </button>

              <button
                onClick={handlePrint}
                style={{
                  padding: '0.45rem 0.85rem',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '4px',
                  color: '#d1d5db',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Printer size={14} /> Drukuj Pergamin
              </button>

              {/* Edit & Delete if custom or admin */}
              {activeDoc.isCustom && (
                <>
                  <button
                    onClick={() => {
                      setEditingDoc(activeDoc);
                      setEditorModalOpen(true);
                    }}
                    style={{
                      padding: '0.45rem 0.85rem',
                      background: 'rgba(59, 130, 246, 0.15)',
                      border: '1px solid rgba(59, 130, 246, 0.4)',
                      borderRadius: '4px',
                      color: '#93c5fd',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <Edit3 size={14} /> Edytuj
                  </button>

                  <button
                    onClick={() => handleDelete(activeDoc)}
                    style={{
                      padding: '0.45rem 0.85rem',
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      borderRadius: '4px',
                      color: '#fca5a5',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <Trash2 size={14} /> Usuń
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Document Title & Meta */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#ffffff', fontFamily: 'var(--font-heading)', fontSize: '2.1rem', margin: '0 0 0.6rem 0', lineHeight: 1.25 }}>
              {activeDoc.title}
            </h2>

            {activeDoc.subtitle && (
              <p style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '1.1rem', margin: '0 0 1.2rem 0' }}>
                {activeDoc.subtitle}
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'rgba(8, 11, 16, 0.6)', padding: '1rem 1.4rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '0.9rem', color: '#d1d5db' }}>
                <span style={{ color: '#8c95a6' }}>Autor / Organ Wydający:</span> <strong style={{ color: '#ffffff' }}>{activeDoc.author}</strong> ({activeDoc.authorRole})
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--gold-ancient)', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
                {activeDoc.date}
              </div>
            </div>
          </div>

          {/* Summary Callout */}
          {activeDoc.summary && (
            <div style={{ padding: '1.2rem 1.6rem', background: 'rgba(197, 159, 78, 0.08)', borderLeft: '4px solid var(--gold-ancient)', borderRadius: '0 8px 8px 0', marginBottom: '2.2rem', color: '#e5e7eb', fontSize: '0.98rem', lineHeight: 1.65 }}>
              <div style={{ fontSize: '0.76rem', textTransform: 'uppercase', color: 'var(--gold-ancient)', fontWeight: 800, letterSpacing: '0.12em', marginBottom: '0.35rem' }}>
                Abstrakt i Cel Dokumentu
              </div>
              {activeDoc.summary}
            </div>
          )}

          {/* Structured Content Blocks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.6rem', color: '#d1d5db', fontSize: '1rem', lineHeight: 1.8 }}>
            {Array.isArray(activeDoc.content) && activeDoc.content.map((block, idx) => {
              if (block.type === 'heading') {
                return (
                  <h3
                    key={idx}
                    style={{
                      color: '#ffffff',
                      fontFamily: 'var(--font-heading)',
                      fontSize: '1.45rem',
                      margin: '1.5rem 0 0.4rem 0',
                      borderBottom: '1px solid rgba(197, 159, 78, 0.25)',
                      paddingBottom: '0.45rem'
                    }}
                  >
                    {block.text}
                  </h3>
                );
              }

              if (block.type === 'paragraph') {
                return <p key={idx} style={{ margin: 0 }}>{block.text}</p>;
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
                  <div
                    key={idx}
                    style={{
                      background: style.bg,
                      border: `1px solid ${style.border}`,
                      borderRadius: '8px',
                      padding: '1.3rem 1.6rem'
                    }}
                  >
                    {block.title && (
                      <h4 style={{ margin: '0 0 0.45rem 0', color: style.text, fontSize: '0.98rem', fontFamily: 'var(--font-heading)', letterSpacing: '0.05em' }}>
                        {block.title}
                      </h4>
                    )}
                    <p style={{ margin: 0, color: '#ffffff', fontSize: '0.95rem', lineHeight: 1.65 }}>{block.text}</p>
                  </div>
                );
              }

              if (block.type === 'list') {
                return (
                  <ul key={idx} style={{ paddingLeft: '1.6rem', margin: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {(block.items || []).map((item, j) => (
                      <li key={j} style={{ color: '#d1d5db' }}>{item}</li>
                    ))}
                  </ul>
                );
              }

              if (block.type === 'table') {
                return (
                  <div
                    key={idx}
                    style={{
                      overflowX: 'auto',
                      margin: '1.2rem 0',
                      borderRadius: '8px',
                      border: '1px solid rgba(197, 159, 78, 0.3)',
                      background: 'rgba(8, 11, 16, 0.85)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.5)'
                    }}
                  >
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.92rem' }}>
                      {block.headers && (
                        <thead>
                          <tr style={{ background: 'rgba(197, 159, 78, 0.18)', borderBottom: '1px solid rgba(197, 159, 78, 0.35)' }}>
                            {block.headers.map((h, hIdx) => (
                              <th
                                key={hIdx}
                                style={{
                                  padding: '0.9rem 1.1rem',
                                  color: 'var(--gold-ancient)',
                                  fontFamily: 'var(--font-heading)',
                                  fontSize: '0.86rem',
                                  letterSpacing: '0.06em',
                                  textTransform: 'uppercase',
                                  fontWeight: 700
                                }}
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                      )}
                      <tbody>
                        {(block.rows || []).map((row, rIdx) => (
                          <tr
                            key={rIdx}
                            style={{
                              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                              background: rIdx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
                              transition: 'background 0.2s ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(197, 159, 78, 0.08)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = rIdx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)'; }}
                          >
                            {row.map((cell, cIdx) => (
                              <td
                                key={cIdx}
                                style={{
                                  padding: '0.9rem 1.1rem',
                                  color: cIdx === 0 ? '#ffffff' : cIdx === 1 ? 'var(--gold-glow)' : '#d1d5db',
                                  fontWeight: cIdx === 0 ? 600 : 400,
                                  lineHeight: 1.55
                                }}
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              }

              if (block.type === 'quote') {
                return (
                  <blockquote
                    key={idx}
                    style={{
                      borderLeft: '4px solid var(--gold-ancient)',
                      margin: '1rem 0',
                      padding: '1rem 1.6rem',
                      color: 'var(--gold-glow)',
                      fontStyle: 'italic',
                      background: 'rgba(0,0,0,0.4)',
                      borderRadius: '0 8px 8px 0',
                      fontSize: '1.05rem'
                    }}
                  >
                    {block.text}
                  </blockquote>
                );
              }

              return null;
            })}

            {/* Special Interactive Authority Personnel Showcase when viewing Authorities category */}
            {activeDoc.category === 'wladze' && (
              <div style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid rgba(197, 159, 78, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
                  <Crown size={22} color="var(--gold-ancient)" />
                  <h3 style={{ color: '#ffffff', fontFamily: 'var(--font-heading)', fontSize: '1.4rem', margin: 0 }}>
                    Wizytówki & Bezpośredni Kontakt do Władz Twierdzy
                  </h3>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '1.25rem'
                  }}
                >
                  {[
                    {
                      name: 'Arcymistrzyni Constantine Aguilera',
                      role: 'Dyrekcja Naczelna • Strażniczka Paktu 1294',
                      office: 'Komnaty Najwyższej Wieży Durmstrang',
                      spec: 'Najwyższe dekrety, reprezentacja, budżet, pakt obronny',
                      badge: 'DYREKCJA',
                      badgeBg: '#b45309',
                      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
                      recipientId: 'usr-constantine'
                    },
                    {
                      name: 'Arcymistrz Ezra Camhi',
                      role: 'Dyrekcja Naczelna • Strażnik Paktu 1294',
                      office: 'Komnaty Najwyższej Wieży Durmstrang',
                      spec: 'Najwyższe dekrety, dyscyplina, obrona cytadeli, pakt obronny',
                      badge: 'DYREKCJA',
                      badgeBg: '#b45309',
                      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
                      recipientId: 'usr-ezra'
                    },
                    {
                      name: 'Prof. Gunnar Vargson',
                      role: 'Mistrz Straży & Dyscypliny • Opiekun Björnhall',
                      office: 'Twierdza Żelaznego Kręgu, Zbrojownia Północy',
                      spec: 'Godzina policyjna, areszty, pojedynki Hólmganga, poligon',
                      badge: 'STRAŻ & BJÖRNHALL',
                      badgeBg: '#991b1b',
                      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
                      recipientId: 'usr-gunnar'
                    },
                    {
                      name: 'Prof. Morana Vane',
                      role: 'Dziekan ds. Nauczania • Opiekunka Ravnheim',
                      office: 'Wieża Nocnych Szeptów, Sala Cienia IV',
                      spec: 'Katedry, hospitacje, dzienniki lekcyjne, Czarna Magia',
                      badge: 'DZIEKAN & RAVNHEIM',
                      badgeBg: '#581c87',
                      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
                      recipientId: 'usr-morana'
                    },
                    {
                      name: 'Prof. Sigrid Hällström',
                      role: 'Kancelaria Runiczna • Opiekunka Reinhall',
                      office: 'Komnata Runiczna pod Zachodnim Skrzydłem',
                      spec: 'Starożytne Runy, Futhark, egzaminy roczne, ceremonie',
                      badge: 'RUNY & REINHALL',
                      badgeBg: '#8b1e2d',
                      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
                      recipientId: 'usr-sigrid'
                    },
                    {
                      name: 'Prof. Klaus Lindqvist',
                      role: 'Nadzorca Laboratoriów • Opiekun Otergard',
                      office: 'Ogrody Lodowych Cieplic, Laboratorium Alchemii',
                      spec: 'Kotły alchemiczne, toksyny, aprowizacja drakkarów',
                      badge: 'ALCHEMIA & OTERGARD',
                      badgeBg: '#0f766e',
                      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
                      recipientId: 'usr-klaus'
                    },
                    {
                      name: 'Zarządca Banku Skirnirów',
                      role: 'Naczelny Skarbnik Cytadeli & Kaupangr',
                      office: 'Skarbiec Banku Skirnirów pod Bastionem',
                      spec: 'Konta adeptów, stypendia za oceny, licencje handlowe',
                      badge: 'SKARB & HANDEL',
                      badgeBg: '#a16207',
                      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
                      recipientId: null
                    }
                  ].map((auth, aIdx) => (
                    <div
                      key={aIdx}
                      style={{
                        background: 'rgba(10, 14, 22, 0.85)',
                        border: '1px solid rgba(197, 159, 78, 0.25)',
                        borderRadius: '10px',
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                        <img
                          src={auth.avatar}
                          alt={auth.name}
                          style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid var(--gold-ancient)',
                            flexShrink: 0
                          }}
                        />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                            <span
                              style={{
                                fontSize: '0.65rem',
                                background: auth.badgeBg,
                                color: '#ffffff',
                                padding: '0.1rem 0.4rem',
                                borderRadius: '4px',
                                fontWeight: 800,
                                letterSpacing: '0.05em'
                              }}
                            >
                              {auth.badge}
                            </span>
                          </div>
                          <h4 style={{ margin: '0 0 0.2rem 0', color: '#ffffff', fontSize: '1.05rem', fontFamily: 'var(--font-heading)' }}>
                            {auth.name}
                          </h4>
                          <div style={{ color: 'var(--gold-ancient)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                            {auth.role}
                          </div>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.82rem', color: '#9ca3af', lineHeight: 1.5, background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ color: '#d1d5db', marginBottom: '0.25rem' }}>
                          📍 <strong>Gabinet:</strong> {auth.office}
                        </div>
                        <div>
                          ⚖️ <strong>Kompetencje:</strong> {auth.spec}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          playWandSwoosh();
                          if (!currentUser) {
                            showNotification('Wymagane Logowanie', 'Zaloguj się, aby wysłać list za pośrednictwem Poczty Kruków.', 'warning');
                          } else {
                            setActiveView('raven-post');
                            showNotification('Poczta Kruków', `Przekierowano do skrzynki nadawczej. Wybierz odbiorcę: ${auth.name}`, 'info');
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '0.55rem',
                          background: 'rgba(197, 159, 78, 0.15)',
                          border: '1px solid var(--gold-ancient)',
                          borderRadius: '6px',
                          color: '#ffffff',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--gold-ancient)'; e.currentTarget.style.color = '#000000'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(197, 159, 78, 0.15)'; e.currentTarget.style.color = '#ffffff'; }}
                      >
                        <Mail size={14} /> Wyślij Pismo Krukiem (Hrafnapóstur)
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Official Seals & Tags */}
          <div style={{ marginTop: '3.5rem', paddingTop: '1.6rem', borderTop: '1px solid rgba(197, 159, 78, 0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {Array.isArray(activeDoc.tags) && activeDoc.tags.map((tag, tIdx) => (
                <span
                  key={tIdx}
                  style={{
                    fontSize: '0.76rem',
                    padding: '3px 9px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '4px',
                    color: '#9ca3af'
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--gold-ancient)', fontSize: '0.85rem', fontFamily: 'var(--font-heading)' }}>
              <span>ᛞ</span>
              <span>Zgodne z Pieczęcią Inkwizycji w Wiecznym Archiwum Cytadeli</span>
              <span>ᛞ</span>
            </div>
          </div>
        </article>
      ) : (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#9ca3af', background: 'rgba(10,13,18,0.6)', borderRadius: '8px' }}>
          Wybierz dokument z kategorii powyżej.
        </div>
      )}

      {/* =========================================================================
          OTHER DOCUMENTS IN CATEGORY (MAGNIFICENT CLEAN CARDS GRID BELOW READER)
          ========================================================================= */}
      {filteredDocs.length > 1 && (
        <div style={{ marginTop: '3rem' }}>
          <div style={{ fontSize: '1rem', color: 'var(--gold-ancient)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Scroll size={16} /> Pozostałe Pergaminy w tej Kategorii ({filteredDocs.length - 1}):
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.2rem'
            }}
          >
            {filteredDocs.filter(d => d.id !== activeDoc?.id).map(doc => {
              const IconComp = CATEGORY_ICONS[doc.category] || FileText;

              return (
                <div
                  key={doc.id}
                  onClick={() => {
                    handleSelectDoc(doc);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  style={{
                    padding: '1.2rem',
                    background: 'rgba(12, 16, 24, 0.75)',
                    border: '1px solid rgba(197, 159, 78, 0.2)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.75rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--gold-ancient)';
                    e.currentTarget.style.background = 'rgba(197, 159, 78, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(197, 159, 78, 0.2)';
                    e.currentTarget.style.background = 'rgba(12, 16, 24, 0.75)';
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <IconComp size={12} /> {doc.categoryLabel || doc.category}
                      </span>
                      {doc.number && (
                        <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontFamily: 'var(--font-heading)' }}>
                          {doc.number}
                        </span>
                      )}
                    </div>

                    <h4 style={{ margin: '0 0 0.45rem 0', color: '#ffffff', fontSize: '1rem', fontFamily: 'var(--font-heading)', lineHeight: 1.35 }}>
                      {doc.title}
                    </h4>

                    {doc.summary && (
                      <p style={{ margin: 0, color: '#8c95a6', fontSize: '0.82rem', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {doc.summary}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--gold-glow)', fontSize: '0.78rem', fontWeight: 600 }}>
                    <span>Otwórz pełny edykt</span>
                    <ChevronRight size={13} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Frontend Subpage & Decree Creator Modal */}
      <CustomPageEditorModal
        isOpen={editorModalOpen}
        onClose={() => setEditorModalOpen(false)}
        editingDoc={editingDoc}
      />
    </div>
  );
};
