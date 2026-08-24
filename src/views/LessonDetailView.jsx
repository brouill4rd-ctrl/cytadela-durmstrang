import React, { useState, useEffect, useRef } from 'react';
import { useSchool } from '../context/SchoolContext';
import {
  BookOpen,
  MessageSquare,
  ArrowLeft,
  Calendar,
  User,
  Users,
  Shield,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Download,
  Maximize2,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Share2,
  Trash2,
  HelpCircle,
  CornerDownRight,
  Bot,
  Zap,
  Flame,
  Info
} from 'lucide-react';

// =============================================================================
// DISCORD MARKDOWN & GFM FORMATTER HELPER
// =============================================================================

function formatItalicsAndSpoilers(str, keyPrefix) {
  if (!str) return null;
  if (str.includes('||')) {
    const parts = str.split(/\|\|([^|]+)\|\|/g);
    return (
      <React.Fragment key={keyPrefix}>
        {parts.map((p, i) => {
          if (i % 2 === 1) {
            return (
              <span
                key={i}
                onClick={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#ffffff';
                }}
                style={{
                  background: '#202225',
                  color: 'transparent',
                  padding: '0.1rem 0.35rem',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  userSelect: 'none',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
                title="Kliknij, aby odkryć spoiler"
              >
                {p}
              </span>
            );
          }
          return p;
        })}
      </React.Fragment>
    );
  }
  return str;
}

function formatSimpleFormatting(str, keyPrefix) {
  if (!str) return null;
  if (str.includes('**')) {
    const parts = str.split(/\*\*([^*]+)\*\*/g);
    return (
      <React.Fragment key={keyPrefix}>
        {parts.map((p, i) => (i % 2 === 1 ? <strong key={i} style={{ fontWeight: 800, color: '#ffffff' }}>{p}</strong> : formatItalicsAndSpoilers(p, `b-${i}`))) }
      </React.Fragment>
    );
  }
  return formatItalicsAndSpoilers(str, keyPrefix);
}

function formatInlineDiscord(text) {
  if (!text) return null;

  // Render Custom Discord Emojis (<a:name:id> or <:name:id>)
  const emojiRegex = /<(a)?:([a-zA-Z0-9_]+):([0-9]+)>/g;
  const elements = [];
  let lastIdx = 0;
  let match;

  while ((match = emojiRegex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      elements.push(text.slice(lastIdx, match.index));
    }
    const isAnimated = match[1] === 'a';
    const emojiName = match[2];
    const emojiId = match[3];
    const ext = isAnimated ? 'gif' : 'png';
    const url = `https://cdn.discordapp.com/emojis/${emojiId}.${ext}`;

    elements.push(
      <img
        key={`emoji-${emojiId}-${match.index}`}
        src={url}
        alt={`:${emojiName}:`}
        title={`:${emojiName}:`}
        style={{ height: '1.4em', width: 'auto', verticalAlign: 'middle', margin: '0 0.15em', display: 'inline-block' }}
      />
    );
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < text.length) {
    elements.push(text.slice(lastIdx));
  }

  // Format code `code` and bold
  return elements.map((item, keyIdx) => {
    if (typeof item !== 'string') return <React.Fragment key={keyIdx}>{item}</React.Fragment>;

    if (item.includes('`')) {
      const codeParts = item.split(/`([^`]+)`/g);
      return (
        <React.Fragment key={keyIdx}>
          {codeParts.map((cp, cIdx) => {
            if (cIdx % 2 === 1) {
              return (
                <code
                  key={cIdx}
                  style={{
                    background: '#1e2433',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#38bdf8',
                    padding: '0.12rem 0.4rem',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontSize: '0.85em'
                  }}
                >
                  {cp}
                </code>
              );
            }
            return formatSimpleFormatting(cp, `cp-${cIdx}`);
          })}
        </React.Fragment>
      );
    }

    return formatSimpleFormatting(item, keyIdx);
  });
}

function renderDiscordMarkdown(content) {
  if (!content) return null;

  // Split by code blocks ```
  const codeBlockRegex = /```(?:([a-zA-Z0-9_-]+)\n)?([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', text: content.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'codeblock', lang: match[1] || '', code: match[2] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: 'text', text: content.slice(lastIndex) });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.6rem' }}>
      {parts.map((part, pIdx) => {
        if (part.type === 'codeblock') {
          return (
            <div
              key={pIdx}
              style={{
                background: '#121622',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderLeft: '3px solid #5865F2',
                borderRadius: '6px',
                padding: '0.8rem 1rem',
                fontFamily: 'Consolas, Monaco, "Andale Mono", monospace',
                fontSize: '0.86rem',
                color: '#e2e8f0',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                margin: '0.4rem 0'
              }}
            >
              {part.lang && (
                <div style={{ fontSize: '0.68rem', color: '#818cf8', textTransform: 'uppercase', marginBottom: '0.4rem', fontWeight: 800 }}>
                  {part.lang}
                </div>
              )}
              <code>{part.code}</code>
            </div>
          );
        }

        const lines = part.text.split('\n');
        return (
          <div key={pIdx} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {lines.map((line, lIdx) => {
              if (!line.trim()) return <div key={lIdx} style={{ height: '0.3rem' }} />;

              // Subtext (-# text)
              if (line.startsWith('-# ')) {
                return (
                  <div key={lIdx} style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'normal', lineHeight: 1.4 }}>
                    {formatInlineDiscord(line.slice(3))}
                  </div>
                );
              }

              // Blockquotes (> text)
              if (line.startsWith('> ')) {
                return (
                  <blockquote
                    key={lIdx}
                    style={{
                      margin: '0.2rem 0',
                      paddingLeft: '0.8rem',
                      borderLeft: '3px solid #5865F2',
                      color: '#cbd5e1',
                      fontSize: '0.88rem',
                      fontStyle: 'italic'
                    }}
                  >
                    {formatInlineDiscord(line.slice(2))}
                  </blockquote>
                );
              }

              // Headers (# , ## , ### )
              if (line.startsWith('# ')) {
                return <h3 key={lIdx} style={{ margin: '0.4rem 0 0.2rem', color: '#ffffff', fontSize: '1.2rem', fontFamily: 'var(--font-heading)' }}>{formatInlineDiscord(line.slice(2))}</h3>;
              }
              if (line.startsWith('## ')) {
                return <h4 key={lIdx} style={{ margin: '0.3rem 0 0.2rem', color: 'var(--gold-glow)', fontSize: '1.05rem', fontFamily: 'var(--font-heading)' }}>{formatInlineDiscord(line.slice(3))}</h4>;
              }
              if (line.startsWith('### ')) {
                return <h5 key={lIdx} style={{ margin: '0.2rem 0 0.1rem', color: '#cbd5e1', fontSize: '0.95rem', fontWeight: 800 }}>{formatInlineDiscord(line.slice(4))}</h5>;
              }

              return (
                <div key={lIdx} style={{ color: '#f1f5f9', fontSize: '0.92rem', lineHeight: 1.6 }}>
                  {formatInlineDiscord(line)}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export const LessonDetailView = () => {
  const {
    activeLessonId,
    activeLessonTab,
    setActiveLessonTab,
    setActiveView,
    getLessonDetails,
    publishLesson,
    houses,
    currentUser,
    hasPermission
  } = useSchool();

  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [highlightedMsgId, setHighlightedMsgId] = useState(null);
  const [threadSearch, setThreadSearch] = useState('');
  const [showEditHistoryModal, setShowEditHistoryModal] = useState(null);
  const messageRefs = useRef({});

  useEffect(() => {
    let isMounted = true;

    const fetchDetails = async () => {
      if (!activeLessonId) return;
      const data = await getLessonDetails(activeLessonId);
      if (data && isMounted) {
        setLesson(data);
        setLoading(false);
      }
    };

    fetchDetails();

    // Auto-polling co 3 sekundy dla aktywnego dziennika, aby odbierać nowe wiadomości z Discorda na żywo
    const pollInterval = setInterval(() => {
      fetchDetails();
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [activeLessonId]);

  // Jump to referenced reply message with highlight effect
  const handleJumpToReply = (replyId) => {
    if (!replyId) return;
    const targetMsg = lesson?.messages?.find(m => m.discordMessageId === replyId || m.id === replyId);
    if (targetMsg) {
      setHighlightedMsgId(targetMsg.discordMessageId || targetMsg.id);
      const elem = messageRefs.current[targetMsg.discordMessageId || targetMsg.id];
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setTimeout(() => {
        setHighlightedMsgId(null);
      }, 3000);
    }
  };

  const handlePublish = async () => {
    if (!lesson) return;
    const published = await publishLesson(lesson.id);
    if (published) {
      setLesson(published);
    }
  };

  if (loading || !lesson) {
    return (
      <div className="view-container" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div style={{ color: 'var(--gold-ancient)', fontSize: '2rem', animation: 'spin 2s linear infinite', display: 'inline-block' }}>ᛞ</div>
        <p style={{ color: '#c5cdd9', marginTop: '1rem', fontFamily: 'var(--font-heading)' }}>
          Wczytywanie pieczęci dziennika lekcyjnego...
        </p>
      </div>
    );
  }

  const isDraft = lesson.status === 'draft';
  const canManage = hasPermission('canManageLessons');

  // Uczniowie i goście nie mają dostępu do szkiców
  if (isDraft && !canManage) {
    return (
      <div className="view-container animate-fade-in" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <div
          style={{
            maxWidth: '540px',
            margin: '0 auto',
            background: 'rgba(15, 20, 30, 0.95)',
            border: '1px solid var(--gold-ancient)',
            borderRadius: '12px',
            padding: '2.5rem',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)'
          }}
        >
          <Clock size={48} color="#eab308" style={{ marginBottom: '1rem' }} />
          <h2 style={{ color: '#ffffff', fontFamily: 'var(--font-heading)', fontSize: '1.4rem', marginBottom: '0.8rem' }}>
            Dziennik w Fazie Szkicu (DRAFT)
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Ten protokół lekcyjny oczekuje na oficjalną weryfikację i publikację przez Katedrę Dydaktyczną. Zapisy oraz punkty staną się widoczne w Kronice po zatwierdzeniu przez Profesora.
          </p>
          <button
            onClick={() => setActiveView('journals')}
            className="btn-durmstrang"
            style={{ padding: '0.6rem 1.4rem' }}
          >
            ← Wróć do Listy Dzienników
          </button>
        </div>
      </div>
    );
  }

  const participants = lesson.participants || [];
  const messages = lesson.messages || [];

  // Filter messages in thread if searching
  const filteredMessages = threadSearch.trim()
    ? messages.filter(m =>
        m.content?.toLowerCase().includes(threadSearch.toLowerCase()) ||
        m.authorDisplayName?.toLowerCase().includes(threadSearch.toLowerCase()) ||
        m.authorName?.toLowerCase().includes(threadSearch.toLowerCase())
      )
    : messages;

  // Calculate points summary by house
  const housePointsSummary = {};
  participants.forEach(p => {
    if (p.pointsAwarded > 0 && p.isPresent) {
      housePointsSummary[p.house] = (housePointsSummary[p.house] || 0) + p.pointsAwarded;
    }
  });

  return (
    <div className="view-container animate-fade-in" style={{ paddingBottom: '5rem' }}>
      {/* =========================================================================
          1. TOP NAVIGATION & VIEW SELECTOR TABS
          ========================================================================= */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid rgba(197, 159, 78, 0.25)'
        }}
      >
        <button
          onClick={() => setActiveView('journals')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'transparent',
            border: 'none',
            color: 'var(--gold-ancient)',
            fontSize: '0.88rem',
            fontFamily: 'var(--font-heading)',
            cursor: 'pointer',
            padding: '0.3rem 0.5rem'
          }}
        >
          <ArrowLeft size={16} /> Powrót do Katalogu Dzienników
        </button>

        {/* View Switcher: 📜 DZIENNIK vs 💬 PEŁNY ZAPIS LEKCJI */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(10, 14, 22, 0.9)',
            border: '1px solid var(--gold-ancient)',
            borderRadius: '30px',
            padding: '0.25rem',
            gap: '0.3rem'
          }}
        >
          <button
            onClick={() => setActiveLessonTab('journal')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.5rem 1.2rem',
              borderRadius: '24px',
              border: 'none',
              background: activeLessonTab === 'journal' ? 'linear-gradient(135deg, #c59f4e 0%, #9a7629 100%)' : 'transparent',
              color: activeLessonTab === 'journal' ? '#0a0d14' : '#c5cdd9',
              fontWeight: 800,
              fontSize: '0.84rem',
              fontFamily: 'var(--font-heading)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: activeLessonTab === 'journal' ? '0 4px 15px rgba(197, 159, 78, 0.4)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <BookOpen size={15} /> 📜 Dziennik Lekcji
          </button>

          <button
            onClick={() => setActiveLessonTab('log')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.5rem 1.2rem',
              borderRadius: '24px',
              border: 'none',
              background: activeLessonTab === 'log' ? 'linear-gradient(135deg, #5865F2 0%, #3b44a9 100%)' : 'transparent',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.84rem',
              fontFamily: 'var(--font-heading)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: activeLessonTab === 'log' ? '0 4px 15px rgba(88, 101, 242, 0.4)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <MessageSquare size={15} /> 💬 Pełny Zapis Wątku ({messages.length})
          </button>
        </div>

        {/* Professor Editor Shortcut */}
        {hasPermission('canManageLessons') && (
          <button
            onClick={() => setActiveView('professor-journal-editor')}
            className="btn-durmstrang"
            style={{ padding: '0.45rem 1rem', fontSize: '0.82rem', gap: '0.35rem' }}
          >
            ✏️ Edytuj w Panelu Profesora
          </button>
        )}
      </div>

      {/* =========================================================================
          TAB 1: 📜 DZIENNIK LEKCJI (OFFICIAL GOTHIC PARCHMENT VIEW)
          ========================================================================= */}
      {activeLessonTab === 'journal' && (
        <div className="animate-fade-in">
          {/* Draft Notification Banner */}
          {isDraft && (
            <div
              style={{
                background: 'rgba(234, 179, 8, 0.12)',
                border: '1px solid #eab308',
                borderRadius: '8px',
                padding: '1rem 1.5rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Clock size={20} color="#eab308" />
                <div>
                  <h4 style={{ margin: 0, color: '#facc15', fontSize: '0.92rem', fontFamily: 'var(--font-heading)' }}>
                    SZKIC DZIENNIKA (DRAFT) — OCZEKUJE NA PUBLIKACJĘ
                  </h4>
                  <p style={{ margin: '0.2rem 0 0', color: '#cbd5e1', fontSize: '0.82rem' }}>
                    Punkty nie zostały jeszcze doliczone do rankingu Zakonów. Zatwierdź dziennik, aby zaksięgować wyniki.
                  </p>
                </div>
              </div>

              {hasPermission('canManageLessons') && (
                <button
                  onClick={handlePublish}
                  className="btn-durmstrang"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    borderColor: '#10b981',
                    color: '#ffffff',
                    padding: '0.5rem 1.2rem',
                    fontSize: '0.85rem',
                    fontWeight: 800
                  }}
                >
                  <CheckCircle2 size={16} /> PUBLIKUJ DZIENNIK
                </button>
              )}
            </div>
          )}

          {/* Official Parchment Container */}
          <div
            style={{
              position: 'relative',
              background: 'linear-gradient(180deg, #161b26 0%, #0d111a 100%)',
              border: '2px solid var(--gold-ancient)',
              borderRadius: '12px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), inset 0 0 50px rgba(197, 159, 78, 0.05)',
              padding: '3rem 2.5rem',
              overflow: 'hidden'
            }}
          >
            {/* Top Seal & Inscription */}
            <div style={{ textAlign: 'center', marginBottom: '2.5rem', position: 'relative' }}>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  margin: '0 auto 0.8rem',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, #7a1818 0%, #3e0b0b 100%)',
                  border: '2px solid var(--gold-ancient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.8rem',
                  color: 'var(--gold-ancient)',
                  boxShadow: '0 0 25px rgba(197, 159, 78, 0.4)'
                }}
              >
                ᛞ
              </div>

              <div style={{ fontSize: '0.75rem', letterSpacing: '0.25em', color: 'var(--gold-ancient)', textTransform: 'uppercase', fontFamily: 'var(--font-heading)', fontWeight: 800 }}>
                TWIERDZA MAGII DURMSTRANG (TMD) • KATEDRA DYDAKTYCZNA
              </div>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '0.2rem' }}>
                OFICJALNY PROTOKÓŁ LEKCYJNY • PAKT 1294
              </div>

              <h1
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '2.3rem',
                  color: '#ffffff',
                  margin: '1.2rem 0 0.4rem',
                  letterSpacing: '0.04em',
                  textShadow: '0 2px 10px rgba(0,0,0,0.8)'
                }}
              >
                {lesson.topic}
              </h1>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.2rem', color: 'var(--gold-glow)', fontSize: '0.9rem', fontFamily: 'var(--font-heading)' }}>
                <span>⚗️ {lesson.subjectName}</span>
                <span>•</span>
                <span>{lesson.classYear}</span>
                <span>•</span>
                <span>{lesson.date}</span>
              </div>
            </div>

            {/* Professor Signature Block */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1.5rem',
                background: 'rgba(10, 14, 22, 0.75)',
                border: '1px solid rgba(197, 159, 78, 0.25)',
                borderRadius: '8px',
                padding: '1.2rem 1.5rem',
                marginBottom: '2rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                <img
                  src={lesson.professorAvatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80'}
                  alt={lesson.professorName}
                  style={{ width: '46px', height: '46px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--gold-ancient)' }}
                />
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Magister Prowadzący
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-heading)' }}>
                    {lesson.professorName}
                  </div>
                </div>
              </div>

              {/* Discord Thread Info */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.72rem', color: '#9ca3af', textTransform: 'uppercase' }}>
                  Źródło Wątku
                </div>
                <div style={{ fontSize: '0.85rem', color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MessageSquare size={14} /> Discord Thread #{lesson.discordThreadId || 'archiwalny'}
                </div>
              </div>
            </div>

            {/* Pedagogical Description */}
            <div style={{ marginBottom: '2.5rem' }}>
              <h4 style={{ color: 'var(--gold-glow)', fontFamily: 'var(--font-heading)', fontSize: '0.95rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
                Opis Przebiegu Zajęć i Cel Dydaktyczny:
              </h4>
              <p
                style={{
                  background: 'rgba(8, 11, 16, 0.6)',
                  borderLeft: '3px solid var(--gold-ancient)',
                  padding: '1.2rem 1.5rem',
                  borderRadius: '0 8px 8px 0',
                  color: '#e2e8f0',
                  fontSize: '0.95rem',
                  lineHeight: 1.7,
                  margin: 0,
                  fontStyle: 'italic'
                }}
              >
                „{lesson.description || 'Przebieg zajęć zarejestrowany w protokole Katedry Twierdzy Magii (TMD).'}”
              </p>
            </div>

            {/* House Points Summary Cards */}
            <div style={{ marginBottom: '2.5rem' }}>
              <h4 style={{ color: 'var(--gold-glow)', fontFamily: 'var(--font-heading)', fontSize: '0.95rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.8rem' }}>
                🏆 Zasilenie Punktacji Zakonów (Puchar Twierdzy):
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem' }}>
                {Object.keys(houses).map(hKey => {
                  const h = houses[hKey];
                  const pts = housePointsSummary[hKey] || 0;
                  return (
                    <div
                      key={hKey}
                      style={{
                        background: 'rgba(12, 16, 25, 0.85)',
                        border: `1px solid ${pts > 0 ? h.colors.border : 'rgba(255,255,255,0.06)'}`,
                        borderRadius: '8px',
                        padding: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: pts > 0 ? `0 0 15px ${h.colors.glow}` : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontSize: '1.4rem' }}>{h.crestIcon}</span>
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-heading)' }}>
                            {h.name}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                            {pts > 0 ? `${pts} pkt z lekcji` : 'Brak punktów'}
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: '1.25rem',
                          fontWeight: 800,
                          color: pts > 0 ? h.colors.secondary : '#6b7280',
                          fontFamily: 'var(--font-heading)'
                        }}
                      >
                        {pts > 0 ? `+${pts}` : '0'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Participants Table */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                <h4 style={{ color: 'var(--gold-glow)', fontFamily: 'var(--font-heading)', fontSize: '0.95rem', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
                  👥 Wykaz Obecności i Punktacja Adeptów ({participants.length}):
                </h4>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    textAlign: 'left',
                    background: 'rgba(8, 11, 16, 0.7)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid rgba(197, 159, 78, 0.2)'
                  }}
                >
                  <thead>
                    <tr style={{ background: 'rgba(197, 159, 78, 0.12)', borderBottom: '1px solid rgba(197, 159, 78, 0.3)' }}>
                      <th style={{ padding: '0.75rem 1rem', color: 'var(--gold-ancient)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Adept</th>
                      <th style={{ padding: '0.75rem 1rem', color: 'var(--gold-ancient)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Zakon</th>
                      <th style={{ padding: '0.75rem 1rem', color: 'var(--gold-ancient)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>Obecność</th>
                      <th style={{ padding: '0.75rem 1rem', color: 'var(--gold-ancient)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>Punkty</th>
                      <th style={{ padding: '0.75rem 1rem', color: 'var(--gold-ancient)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Komentarz Prowadzącego</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((p, idx) => {
                      const h = houses[p.house] || { name: p.house, crestIcon: '🛡️', colors: { secondary: '#c59f4e' } };
                      return (
                        <tr
                          key={p.id || idx}
                          style={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)'
                          }}
                        >
                          <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#ffffff', fontSize: '0.88rem' }}>
                            {p.studentName}
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: h.colors?.secondary || '#cbd5e1', fontSize: '0.82rem', fontWeight: 600 }}>
                              <span>{h.crestIcon}</span> {h.name}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                            {p.isPresent ? (
                              <span style={{ color: '#10b981', fontWeight: 800, fontSize: '0.9rem' }}>✓</span>
                            ) : (
                              <span style={{ color: '#ef4444', fontWeight: 800, fontSize: '0.9rem' }}>✗</span>
                            )}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '0.2rem 0.6rem',
                                borderRadius: '4px',
                                background: p.pointsAwarded > 0 ? 'rgba(46, 196, 182, 0.15)' : 'rgba(255,255,255,0.04)',
                                color: p.pointsAwarded > 0 ? '#2ec4b6' : '#9ca3af',
                                fontWeight: 800,
                                fontSize: '0.88rem',
                                fontFamily: 'var(--font-heading)'
                              }}
                            >
                              +{p.pointsAwarded}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: '#cbd5e1', fontSize: '0.82rem', fontStyle: p.comment ? 'italic' : 'normal' }}>
                            {p.comment || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Button to Discord Log */}
            <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
              <button
                onClick={() => setActiveLessonTab('log')}
                className="btn-durmstrang"
                style={{
                  padding: '0.75rem 2rem',
                  fontSize: '0.92rem',
                  gap: '0.5rem',
                  background: 'linear-gradient(135deg, #5865F2 0%, #3b44a9 100%)',
                  borderColor: '#7289da',
                  color: '#ffffff',
                  boxShadow: '0 4px 20px rgba(88, 101, 242, 0.35)'
                }}
              >
                <MessageSquare size={17} /> POKAŻ PEŁNY ZAPIS LEKCJI Z DISCORDA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: 💬 PEŁNY ZAPIS LEKCJI (ATMOSPHERIC DISCORD THREAD ARCHIVE)
          ========================================================================= */}
      {activeLessonTab === 'log' && (
        <div className="animate-fade-in">
          {/* Discord Header Bar */}
          <div
            style={{
              background: '#181b24',
              border: '1px solid rgba(88, 101, 242, 0.4)',
              borderRadius: '10px 10px 0 0',
              padding: '1rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              boxShadow: '0 5px 20px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#5865F2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff'
                }}
              >
                <MessageSquare size={18} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1rem', fontFamily: 'var(--font-heading)' }}>
                    #{lesson.discordThreadId || 'wątek-lekcji'}
                  </h3>
                  <span style={{ background: 'rgba(88, 101, 242, 0.2)', color: '#8ea1e1', fontSize: '0.68rem', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
                    DISCORD THREAD ARCHIVE
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {messages.length} wiadomości • {participants.length} uczestników • Pełna wierność cyfrowa
                </div>
              </div>
            </div>

            {/* Message Filter Search */}
            <div style={{ minWidth: '220px' }}>
              <input
                type="text"
                value={threadSearch}
                onChange={(e) => setThreadSearch(e.target.value)}
                placeholder="Filtruj wpisy w wątku..."
                style={{
                  width: '100%',
                  padding: '0.45rem 0.8rem',
                  background: '#0d1017',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '0.8rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Discord Thread Messages Body */}
          <div
            style={{
              background: '#0e121a',
              border: '1px solid rgba(88, 101, 242, 0.25)',
              borderTop: 'none',
              borderRadius: '0 0 10px 10px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.2rem',
              minHeight: '450px'
            }}
          >
            {filteredMessages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#6b7280' }}>
                <MessageSquare size={36} style={{ opacity: 0.4, marginBottom: '0.5rem' }} />
                <p>Brak wiadomości odpowiadających filtrowi.</p>
              </div>
            ) : (
              filteredMessages.map((msg, index) => {
                const isHighlighted = highlightedMsgId === (msg.discordMessageId || msg.id);
                const house = houses[msg.authorHouse] || null;

                return (
                  <div
                    key={msg.id || index}
                    ref={(el) => { messageRefs.current[msg.discordMessageId || msg.id] = el; }}
                    style={{
                      position: 'relative',
                      background: isHighlighted
                        ? 'rgba(197, 159, 78, 0.18)'
                        : msg.isCommand
                        ? 'rgba(46, 196, 182, 0.06)'
                        : 'rgba(18, 23, 33, 0.75)',
                      border: isHighlighted
                        ? '1px solid var(--gold-ancient)'
                        : msg.isDeleted
                        ? '1px dashed #ef4444'
                        : '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px',
                      padding: '1rem 1.2rem',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {/* Reply Reference Header if replying to someone */}
                    {msg.replyToId && (
                      <div
                        onClick={() => handleJumpToReply(msg.replyToId)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '4px',
                          padding: '0.2rem 0.55rem',
                          fontSize: '0.74rem',
                          color: '#93c5fd',
                          marginBottom: '0.6rem',
                          cursor: 'pointer',
                          transition: 'background 0.2s ease'
                        }}
                        title="Kliknij, aby przejść do wiadomości źródłowej"
                      >
                        <CornerDownRight size={12} />
                        <span>Odpowiedź do: <strong>@{msg.replyToAuthor || 'Profesor'}</strong></span>
                        {msg.replyToContent && (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            — „{msg.replyToContent}”
                          </span>
                        )}
                      </div>
                    )}

                    {/* Author Meta Row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        {/* Avatar */}
                        <img
                          src={msg.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                          alt={msg.authorDisplayName}
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: house ? `1.5px solid ${house.colors.secondary}` : '1.5px solid rgba(255,255,255,0.2)'
                          }}
                        />

                        {/* Name & Badges */}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span
                              style={{
                                fontWeight: 800,
                                fontSize: '0.92rem',
                                color: house ? house.colors.text : msg.isBot ? '#5865F2' : '#ffffff',
                                fontFamily: 'var(--font-heading)'
                              }}
                            >
                              {msg.authorDisplayName || msg.authorName}
                            </span>

                            {/* House Badge */}
                            {house && (
                              <span
                                style={{
                                  background: 'rgba(255,255,255,0.06)',
                                  border: `1px solid ${house.colors.border}`,
                                  color: house.colors.secondary,
                                  fontSize: '0.65rem',
                                  fontWeight: 800,
                                  padding: '0.1rem 0.4rem',
                                  borderRadius: '4px'
                                }}
                              >
                                {house.crestIcon} {house.name}
                              </span>
                            )}

                            {/* Bot Badge */}
                            {msg.isBot && (
                              <span
                                style={{
                                  background: '#5865F2',
                                  color: '#ffffff',
                                  fontSize: '0.62rem',
                                  fontWeight: 800,
                                  padding: '0.1rem 0.35rem',
                                  borderRadius: '3px',
                                  letterSpacing: '0.05em'
                                }}
                              >
                                🤖 BOT
                              </span>
                            )}

                            {/* System Badge */}
                            {msg.isSystem && (
                              <span
                                style={{
                                  background: '#475569',
                                  color: '#ffffff',
                                  fontSize: '0.62rem',
                                  fontWeight: 800,
                                  padding: '0.1rem 0.35rem',
                                  borderRadius: '3px'
                                }}
                              >
                                ⚙ SYSTEM
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Timestamp & Edit Indicator */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.74rem' }}>
                        {msg.isEdited && (
                          <span
                            onClick={() => setShowEditHistoryModal(msg)}
                            style={{ color: '#eab308', cursor: 'pointer', textDecoration: 'underline' }}
                            title="Zobacz historię edycji"
                          >
                            (edytowano)
                          </span>
                        )}
                        <span>{msg.timestamp}</span>
                      </div>
                    </div>

                    {/* Slash Command Special Event Badge */}
                    {msg.isCommand && msg.commandData?.name && (
                      <div
                        style={{
                          background: 'rgba(88, 101, 242, 0.12)',
                          border: '1px solid rgba(88, 101, 242, 0.35)',
                          borderRadius: '6px',
                          padding: '0.5rem 0.8rem',
                          marginBottom: '0.6rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.82rem',
                          color: '#c7d2fe'
                        }}
                      >
                        <Zap size={14} color="#818cf8" />
                        <span>
                          🤖 <strong>{msg.commandData.author || msg.authorDisplayName}</strong> użył slash command:
                          <code style={{ background: '#1e1e2e', padding: '0.15rem 0.4rem', borderRadius: '4px', color: '#38bdf8', marginLeft: '0.3rem' }}>
                            {msg.commandData.name}
                          </code>
                        </span>
                      </div>
                    )}

                    {/* Message Content */}
                    {msg.isDeleted ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          color: '#f87171',
                          fontStyle: 'italic',
                          fontSize: '0.85rem',
                          background: 'rgba(239, 68, 68, 0.1)',
                          padding: '0.5rem 0.8rem',
                          borderRadius: '4px'
                        }}
                      >
                        <Trash2 size={14} /> Wiadomość usunięta na Discordzie (zarchiwizowana w kronice)
                      </div>
                    ) : (
                      msg.content && renderDiscordMarkdown(msg.content)
                    )}

                    {/* Recreated Discord Embeds */}
                    {msg.embeds && msg.embeds.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.6rem' }}>
                        {msg.embeds.map((emb, eIdx) => (
                          <div
                            key={eIdx}
                            style={{
                              background: '#151923',
                              borderLeft: `4px solid ${emb.color || 'var(--gold-ancient)'}`,
                              borderRadius: '4px',
                              padding: '1rem',
                              maxWidth: '650px',
                              boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
                            }}
                          >
                            {/* Embed Author */}
                            {emb.author && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                                {emb.author.icon_url && (
                                  <img src={emb.author.icon_url} alt="" style={{ width: '18px', height: '18px', borderRadius: '50%' }} />
                                )}
                                <span>{emb.author.name}</span>
                              </div>
                            )}

                            {/* Embed Title */}
                            {emb.title && (
                              <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.95rem', fontFamily: 'var(--font-heading)', marginBottom: '0.4rem' }}>
                                {emb.title}
                              </div>
                            )}

                            {/* Embed Description */}
                            {emb.description && (
                              <div style={{ color: '#cbd5e1', fontSize: '0.86rem', lineHeight: 1.5, marginBottom: '0.6rem' }}>
                                {emb.description}
                              </div>
                            )}

                            {/* Embed Fields */}
                            {emb.fields && emb.fields.length > 0 && (
                              <div
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                                  gap: '0.6rem',
                                  margin: '0.6rem 0'
                                }}
                              >
                                {emb.fields.map((f, fIdx) => (
                                  <div key={fIdx} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--gold-ancient)', fontWeight: 700 }}>{f.name}</div>
                                    <div style={{ fontSize: '0.82rem', color: '#f8fafc', marginTop: '0.1rem' }}>{f.value}</div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Embed Footer */}
                            {emb.footer && (
                              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.6rem', paddingTop: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                {emb.footer.text}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Media Attachments & Image Gallery */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '0.75rem',
                          marginTop: '0.8rem'
                        }}
                      >
                        {msg.attachments.map((att, aIdx) => {
                          const isImg = (att.mimeType || '').startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(att.name || '');
                          const url = att.storageUrl || att.originalUrl;

                          return isImg ? (
                            <div
                              key={aIdx}
                              onClick={() => setLightboxImage(url)}
                              style={{
                                position: 'relative',
                                borderRadius: '6px',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                border: '1px solid rgba(197, 159, 78, 0.4)',
                                maxWidth: '340px',
                                maxHeight: '240px',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.6)'
                              }}
                            >
                              <img
                                src={url}
                                alt={att.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                              />
                              <div
                                style={{
                                  position: 'absolute',
                                  bottom: 0,
                                  left: 0,
                                  right: 0,
                                  padding: '0.3rem 0.6rem',
                                  background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.85) 100%)',
                                  color: '#ffffff',
                                  fontSize: '0.7rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between'
                                }}
                              >
                                <span>{att.name}</span>
                                <Maximize2 size={12} />
                              </div>
                            </div>
                          ) : (
                            <div
                              key={aIdx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.6rem',
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.12)',
                                borderRadius: '6px',
                                padding: '0.6rem 0.9rem',
                                color: '#ffffff',
                                fontSize: '0.82rem'
                              }}
                            >
                              <Download size={16} color="var(--gold-ancient)" />
                              <div>
                                <div style={{ fontWeight: 700 }}>{att.name}</div>
                                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                  {Math.round((att.size || 0) / 1024)} KB • Plik z lekcji
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Reactions Bar with Tooltip */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          marginTop: '0.8rem',
                          flexWrap: 'wrap'
                        }}
                      >
                        {msg.reactions.map((r, rIdx) => (
                          <div
                            key={rIdx}
                            title={`Reakcje od: ${(r.users || []).join(', ') || 'Uczestnicy'}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              background: 'rgba(255, 255, 255, 0.07)',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                              borderRadius: '6px',
                              padding: '0.15rem 0.45rem',
                              fontSize: '0.78rem',
                              color: '#cbd5e1',
                              cursor: 'default',
                              userSelect: 'none'
                            }}
                          >
                            <span>{r.emoji}</span>
                            <span style={{ fontWeight: 700, fontSize: '0.75rem' }}>{r.count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          LIGHTBOX MODAL (PHOTO GALLERY EXPANSION)
          ========================================================================= */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.92)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              border: '2px solid var(--gold-ancient)',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 0 50px rgba(0,0,0,0.9)'
            }}
          >
            <button
              onClick={() => setLightboxImage(null)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(0,0,0,0.75)',
                border: '1px solid var(--gold-ancient)',
                color: '#ffffff',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
            <img
              src={lightboxImage}
              alt="Załącznik Lekcji Cytadeli"
              style={{ maxWidth: '100%', maxHeight: '85vh', display: 'block', objectFit: 'contain' }}
            />
          </div>
        </div>
      )}

      {/* =========================================================================
          EDIT HISTORY MODAL
          ========================================================================= */}
      {showEditHistoryModal && (
        <div
          onClick={() => setShowEditHistoryModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#151923',
              border: '1px solid var(--gold-ancient)',
              borderRadius: '8px',
              padding: '1.5rem',
              width: '100%',
              maxWidth: '500px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.05rem', fontFamily: 'var(--font-heading)' }}>
                Historia Edycji Wiadomości
              </h3>
              <button onClick={() => setShowEditHistoryModal(null)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700, textTransform: 'uppercase' }}>Aktualna wersja:</div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.6rem', borderRadius: '4px', color: '#ffffff', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                  {showEditHistoryModal.content}
                </div>
              </div>

              {(showEditHistoryModal.editHistory || []).map((h, i) => (
                <div key={i}>
                  <div style={{ fontSize: '0.72rem', color: '#eab308', textTransform: 'uppercase' }}>
                    Wersja poprzednia ({h.timestamp || 'wcześniej'}):
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', borderLeft: '2px solid #eab308', padding: '0.6rem', color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                    {h.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
