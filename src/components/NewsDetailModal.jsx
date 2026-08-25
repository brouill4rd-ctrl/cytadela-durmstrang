import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import { CategoryBanner } from './CategoryBanner';
import {
  X,
  Calendar,
  Clock,
  ThumbsUp,
  Flame,
  Shield,
  Skull,
  Send,
  MessageSquare,
  Sparkles,
  Pin,
  Bookmark,
  Share2,
  Check
} from 'lucide-react';

export const NewsDetailModal = ({ article, isOpen, onClose }) => {
  if (!isOpen || !article) return null;

  const {
    news,
    currentRole,
    currentUser,
    studentProfile,
    houses,
    reactToNews,
    addNewsComment,
    showNotification
  } = useSchool();

  const { playWandSwoosh, playRuneChime } = useSound();

  const [commentText, setCommentText] = useState('');
  const [copied, setCopied] = useState(false);

  // Look up live article from news state to ensure real-time reactive comments and reactions
  const currentArticle = news.find(n => n.id === article.id) || article;
  const houseData = currentArticle.house ? houses[currentArticle.house] : null;

  const handleReactionClick = (reactionType) => {
    playRuneChime();
    reactToNews(currentArticle.id, reactionType);
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    playWandSwoosh();
    addNewsComment(currentArticle.id, commentText);
    setCommentText('');
  };

  const renderInline = (text) => {
    const parts = [];
    const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|\[(.+?)\]\((.+?)\))/g;
    let last = 0, m;
    while ((m = regex.exec(text)) !== null) {
      if (m.index > last) parts.push(text.slice(last, m.index));
      if (m[2]) parts.push(<strong key={m.index}>{m[2]}</strong>);
      else if (m[3]) parts.push(<em key={m.index}>{m[3]}</em>);
      else if (m[4]) parts.push(<a key={m.index} href={m[5]} style={{ color: 'var(--ice-frost)', textDecoration: 'underline' }} target="_blank" rel="noreferrer">{m[4]}</a>);
      last = m.index + m[0].length;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts.length > 0 ? parts : text;
  };

  const renderContent = (text) => {
    if (!text) return null;
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
          <div key={`w${i}`} style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.4)', borderLeft: '4px solid #f59e0b', borderRadius: '4px', padding: '0.75rem 1rem', marginBottom: '1rem', color: '#fbbf24' }}>
            <strong>⚠ Uwaga:</strong> {blockLines.join(' ')}
          </div>
        );
      } else if (line.startsWith(':::info')) {
        const blockLines = [];
        i++;
        while (i < lines.length && !lines[i].startsWith(':::')) { blockLines.push(lines[i]); i++; }
        elements.push(
          <div key={`info${i}`} style={{ background: 'rgba(164,200,225,0.1)', border: '1px solid rgba(164,200,225,0.3)', borderLeft: '4px solid var(--ice-frost)', borderRadius: '4px', padding: '0.75rem 1rem', marginBottom: '1rem', color: 'var(--ice-crystal)' }}>
            <strong>ℹ Info:</strong> {blockLines.join(' ')}
          </div>
        );
      } else if (line.startsWith('## ')) {
        elements.push(<h2 key={i} style={{ color: 'var(--gold-glow)', fontSize: '1.45rem', marginTop: '1.6rem', marginBottom: '0.5rem' }}>{renderInline(line.slice(3))}</h2>);
      } else if (line.startsWith('### ')) {
        elements.push(<h3 key={i} style={{ color: 'var(--gold-ancient)', fontSize: '1.2rem', marginTop: '1.3rem', marginBottom: '0.4rem' }}>{renderInline(line.slice(4))}</h3>);
      } else if (line.startsWith('> ')) {
        elements.push(
          <blockquote key={i} style={{ borderLeft: '3px solid var(--gold-ancient)', padding: '0.6rem 1rem', margin: '0.8rem 0', fontStyle: 'italic', color: '#d1d9e6', background: 'rgba(197,159,78,0.05)', borderRadius: '0 4px 4px 0' }}>
            {renderInline(line.slice(2))}
          </blockquote>
        );
      } else if (line.trim() === '---') {
        elements.push(<hr key={i} style={{ border: 0, height: '1px', background: 'rgba(164,200,225,0.2)', margin: '1.5rem 0' }} />);
      } else if (line.startsWith('* ') || line.startsWith('- ')) {
        const listItems = [];
        while (i < lines.length && (lines[i].startsWith('* ') || lines[i].startsWith('- '))) {
          listItems.push(lines[i].slice(2));
          i++;
        }
        elements.push(
          <ul key={`ul${i}`} style={{ paddingLeft: '1.5rem', marginBottom: '1rem', color: '#cfd7e4' }}>
            {listItems.map((li, j) => <li key={j} style={{ marginBottom: '0.3rem' }}>{renderInline(li)}</li>)}
          </ul>
        );
        continue;
      } else if (/^\d+\. /.test(line)) {
        const listItems = [];
        while (i < lines.length && /^\d+\. /.test(lines[i])) {
          listItems.push(lines[i].replace(/^\d+\. /, ''));
          i++;
        }
        elements.push(
          <ol key={`ol${i}`} style={{ paddingLeft: '1.5rem', marginBottom: '1rem', color: '#cfd7e4' }}>
            {listItems.map((li, j) => <li key={j} style={{ marginBottom: '0.3rem' }}>{renderInline(li)}</li>)}
          </ol>
        );
        continue;
      } else if (line.startsWith('![')) {
        const match = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
        if (match) {
          elements.push(<img key={i} src={match[2]} alt={match[1]} style={{ maxWidth: '100%', borderRadius: '6px', marginBottom: '1rem', border: '1px solid rgba(164,200,225,0.2)' }} />);
        }
      } else if (line.trim() !== '') {
        elements.push(
          <p key={i} style={{ marginBottom: '1.2rem', textAlign: 'justify', hyphens: 'auto', lineHeight: 1.8 }}>
            {renderInline(line)}
          </p>
        );
      }
      i++;
    }
    return elements;
  };

  const handleCopyLink = () => {
    playRuneChime();
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    showNotification('Pieczęć Skopiowana', 'Odnośnik do edyktu został skopiowany.', 'info');
    setTimeout(() => setCopied(false), 2500);
  };

  const waxSealClass = currentArticle.waxSeal === 'crimson'
    ? 'wax-seal-crimson'
    : currentArticle.waxSeal === 'shadow'
    ? 'wax-seal-shadow'
    : currentArticle.waxSeal === 'frost'
    ? 'wax-seal-frost'
    : 'wax-seal-gold';

  const waxSealRune = currentArticle.waxSeal === 'crimson'
    ? 'ᚦ'
    : currentArticle.waxSeal === 'shadow'
    ? 'ᛞ'
    : currentArticle.waxSeal === 'frost'
    ? 'ᛁ'
    : 'ᛟ';

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
        backgroundColor: 'rgba(3, 5, 8, 0.88)',
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
          background: 'linear-gradient(180deg, #0f141f 0%, #090c13 100%)',
          border: '1px solid rgba(164, 200, 225, 0.35)',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.95), 0 0 40px rgba(164, 200, 225, 0.15)',
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
            background: 'rgba(10, 14, 22, 0.7)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'var(--font-heading)' }}>
              ᛞ Oficjalny Zwój Twierdzy Magii Durmstrang (TMD) ᛞ
            </span>
            {currentArticle.pinned && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(197, 159, 78, 0.2)', border: '1px solid var(--gold-ancient)', color: 'var(--gold-glow)', fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                <Pin size={11} /> Przypięty
              </span>
            )}
          </div>

          <button
            onClick={() => {
              playWandSwoosh();
              onClose();
            }}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '4px',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '0.4rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            aria-label="Zamknij pergamin"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div
          style={{
            padding: '2rem 2.2rem',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '1.6rem'
          }}
        >
          {/* Panoramic Category Banner Above Title */}
          <div>
            <CategoryBanner
              category={currentArticle.categoryKey || currentArticle.category}
              customText={currentArticle.bannerCustomText}
              height={84}
            />
          </div>

          {/* Centered Badges Row */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
            {currentArticle.pinned && (
              <span style={{ fontSize: '0.74rem', background: 'rgba(197, 159, 78, 0.2)', color: 'var(--gold-glow)', padding: '0.2rem 0.65rem', borderRadius: '4px', border: '1px solid var(--gold-ancient)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontFamily: 'var(--font-heading)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                <Pin size={12} color="var(--gold-ancient)" /> Edykt Główny
              </span>
            )}
            <span
              style={{
                background: houseData ? `${houseData.colors?.primary}33` : 'rgba(164, 200, 225, 0.12)',
                border: `1px solid ${houseData ? houseData.colors?.secondary : 'var(--ice-border)'}`,
                color: houseData ? houseData.colors?.secondary : 'var(--ice-crystal)',
                padding: '0.2rem 0.65rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-heading)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase'
              }}
            >
              {currentArticle.category}
            </span>

            {houseData && (
              <span style={{ fontSize: '0.75rem', color: houseData.colors?.secondary, display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'var(--font-heading)' }}>
                <span>{houseData.crestIcon}</span> {houseData.name}
              </span>
            )}
          </div>

          {/* Centered Title & Seal Box */}
          <div style={{ position: 'relative', textAlign: 'center' }}>
            <h1 style={{ fontSize: '2.05rem', color: '#ffffff', lineHeight: 1.25, marginBottom: '0.8rem', textAlign: 'center' }}>
              {currentArticle.title}
            </h1>

            {/* Centered Meta information */}
            <div className="contentMeta" style={{ marginBottom: '0.5rem' }}>
              <span>Wykaligrafowane przez:</span>
              <span className="author-badge">{currentArticle.author}</span>
              <span style={{ opacity: 0.5 }}>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Calendar size={13} /> {currentArticle.date}
              </span>
              <span style={{ opacity: 0.5 }}>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Clock size={13} /> {currentArticle.readTime || '3 min'}
              </span>
            </div>
          </div>

          {/* Lead Summary Highlight Box */}
          {currentArticle.summary && (
            <div
              style={{
                background: 'rgba(164, 200, 225, 0.05)',
                borderLeft: '3px solid var(--gold-ancient)',
                padding: '1rem 1.25rem',
                borderRadius: '0 4px 4px 0',
                color: '#d1d9e6',
                fontSize: '0.95rem',
                fontStyle: 'italic',
                lineHeight: 1.7,
                textAlign: 'justify',
                textJustify: 'inter-word',
                hyphens: 'auto'
              }}
            >
              {currentArticle.summary}
            </div>
          )}

          {/* Formatted Article Body — rozszerzony renderer */}
          <div className="contentBody" style={{ color: '#cfd7e4', fontSize: '0.98rem', lineHeight: 1.8 }}>
            {currentArticle.content ? renderContent(currentArticle.content) : <p>{currentArticle.summary}</p>}
          </div>

          {/* Tags */}
          {currentArticle.tags && currentArticle.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', paddingTop: '0.25rem' }}>
              {currentArticle.tags.map(t => (
                <span key={t} style={{ background: 'rgba(164,200,225,0.08)', border: '1px solid rgba(164,200,225,0.2)', color: 'var(--ice-frost)', padding: '0.15rem 0.55rem', borderRadius: '10px', fontSize: '0.72rem' }}>#{t}</span>
              ))}
            </div>
          )}

          {/* Author Signature & Seal Box */}
          <div
            style={{
              marginTop: '1rem',
              padding: '1.25rem',
              background: 'rgba(8, 11, 16, 0.85)',
              border: '1px solid rgba(164, 200, 225, 0.15)',
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {currentArticle.authorSignature && (
                <img
                  src={currentArticle.authorSignature}
                  alt={`Podpis ${currentArticle.author}`}
                  style={{ maxHeight: '60px', maxWidth: '180px', objectFit: 'contain', filter: 'brightness(1.1)' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}
              <div>
                <div style={{ fontSize: '0.72rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Sygnatura Urzędowa:
                </div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', color: '#ffffff', marginTop: '0.15rem' }}>
                  {currentArticle.author}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--gold-ancient)' }}>
                  {currentArticle.authorRole || 'Rada Dyrekcji Cytadeli'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleCopyLink}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.4rem 0.8rem',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  color: '#9ca3af',
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                {copied ? <Check size={13} color="#22c55e" /> : <Share2 size={13} />}
                <span>{copied ? 'Skopiowano' : 'Kopiuj Odnośnik'}</span>
              </button>
            </div>
          </div>

          {/* Adept Reactions Bar */}
          <div
            style={{
              borderTop: '1px solid rgba(164, 200, 225, 0.15)',
              borderBottom: '1px solid rgba(164, 200, 225, 0.15)',
              padding: '1rem 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.8rem'
            }}
          >
            <div style={{ fontSize: '0.82rem', color: 'var(--ice-frost)', fontFamily: 'var(--font-heading)', letterSpacing: '0.08em' }}>
              ZŁÓŻ PIECZĘĆ ADEPTA:
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleReactionClick('admiration')}
                className="btn-reaction-seal"
                style={{ borderColor: 'rgba(164, 200, 225, 0.3)' }}
              >
                <ThumbsUp size={14} color="var(--ice-crystal)" />
                <span>Podziw ({currentArticle.reactions?.admiration || 0})</span>
              </button>

              <button
                onClick={() => handleReactionClick('honor')}
                className="btn-reaction-seal"
                style={{ borderColor: 'rgba(197, 159, 78, 0.3)' }}
              >
                <Shield size={14} color="var(--gold-ancient)" />
                <span>Honor ({currentArticle.reactions?.honor || 0})</span>
              </button>

              <button
                onClick={() => handleReactionClick('flame')}
                className="btn-reaction-seal"
                style={{ borderColor: 'rgba(234, 179, 8, 0.3)' }}
              >
                <Flame size={14} color="#f59e0b" />
                <span>Ogień ({currentArticle.reactions?.flame || 0})</span>
              </button>

              <button
                onClick={() => handleReactionClick('dread')}
                className="btn-reaction-seal"
                style={{ borderColor: 'rgba(192, 43, 43, 0.3)' }}
              >
                <Skull size={14} color="#ef4444" />
                <span>Groza ({currentArticle.reactions?.dread || 0})</span>
              </button>
            </div>
          </div>

          {/* Student Comments / Diegetic Scrolls Feed */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <MessageSquare size={16} color="var(--gold-ancient)" />
              <h3 style={{ fontSize: '1.2rem', color: '#ffffff' }}>
                Głosy Społeczności & Noty ({currentArticle.comments?.length || 0})
              </h3>
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleCommentSubmit} style={{ display: 'flex', gap: '0.8rem', marginBottom: '1.5rem' }}>
              <input
                type="text"
                placeholder="Złóż swój podpis lub komentarz pod edyktem..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="gothic-input"
                style={{ flex: 1, padding: '0.65rem 1rem' }}
              />
              <button
                type="submit"
                className="btn-durmstrang"
                style={{ padding: '0.65rem 1.2rem', fontSize: '0.85rem' }}
              >
                <Send size={14} /> Wyślij
              </button>
            </form>

            {/* Comments List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {currentArticle.comments && currentArticle.comments.length > 0 ? (
                currentArticle.comments.map((comm) => {
                  const commHouse = houses[comm.house];
                  return (
                    <div
                      key={comm.id}
                      style={{
                        padding: '0.9rem 1.1rem',
                        background: 'rgba(10, 14, 22, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '4px',
                        borderLeft: `3px solid ${commHouse ? commHouse.colors?.secondary : 'var(--gold-ancient)'}`
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {commHouse && <span>{commHouse.crestIcon}</span>}
                          <strong style={{ color: commHouse ? commHouse.colors?.secondary : '#ffffff', fontSize: '0.88rem' }}>
                            {comm.authorName}
                          </strong>
                          {commHouse && (
                            <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                              ({commHouse.name})
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                          {comm.date}
                        </span>
                      </div>
                      <p style={{ color: '#d1d9e6', fontSize: '0.88rem', lineHeight: 1.5 }}>
                        {comm.text}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: '#6b7280', fontSize: '0.85rem', fontStyle: 'italic' }}>
                  Brak głosów pod tym edyktem. Bądź pierwszym adeptem, który złoży swoją pieczęć!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
