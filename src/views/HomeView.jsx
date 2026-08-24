import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import { SecretRune } from '../components/SecretRune';
import { NewsDetailModal } from '../components/NewsDetailModal';
import { NewsEditorModal } from '../components/NewsEditorModal';
import { CategoryBanner } from '../components/CategoryBanner';
import {
  Scroll,
  Sparkles,
  Shield,
  Award,
  BookOpen,
  ChevronRight,
  ExternalLink,
  Feather,
  Clock,
  ThumbsUp,
  Share2,
  Calendar,
  Layers,
  Search,
  Pin,
  Flame,
  Skull,
  MessageSquare,
  PlusCircle,
  Plus
} from 'lucide-react';

export const HomeView = () => {
  const {
    news,
    houses,
    currentRole,
    currentUser,
    reactToNews,
    setActiveView,
    setActiveSubjectId,
    showNotification
  } = useSchool();

  const { playWandSwoosh, playRuneChime } = useSound();

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  const handleReaction = (newsId, reactionType = 'admiration') => {
    playRuneChime();
    reactToNews(newsId, reactionType);
    showNotification('Pieczęć Złożona', 'Złożyłeś pieczęć uznania pod oficjalnym pergaminem.', 'info');
  };

  const handleOpenDetail = (article) => {
    playWandSwoosh();
    setSelectedArticle(article);
    setDetailModalOpen(true);
  };

  const handleOpenCreateModal = () => {
    playWandSwoosh();
    setEditorModalOpen(true);
  };

  // Filtered news
  const filteredNews = news.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory || item.categoryKey === activeCategory;
    const matchesSearch = !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.bannerCustomText && item.bannerCustomText.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.tags && item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCategory && matchesSearch;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredNews.length / itemsPerPage));
  const displayedNews = filteredNews.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const canCreateNews = currentRole === 'admin' || currentRole === 'professor';

  return (
    <div id="contentSmall">
      {/* Quick Guide & Rules Callout Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(20, 26, 38, 0.9), rgba(10, 14, 22, 0.95))',
          border: '1px solid rgba(197, 159, 78, 0.35)',
          borderRadius: '8px',
          padding: '1.1rem 1.4rem',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'rgba(197, 159, 78, 0.15)',
              border: '1px solid var(--gold-ancient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--gold-ancient)',
              fontSize: '1.2rem'
            }}
          >
            ⚖️
          </div>
          <div>
            <div style={{ color: '#ffffff', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.95rem' }}>
              Kodeks, Regulamin & Zasady Cytadeli Durmstrang
            </div>
            <div style={{ color: '#9ca3af', fontSize: '0.82rem' }}>
              Poznaj Pakt z 1294 roku, taryfikator punktów Pucharu Północy, system oceniania lekcji oraz FAQ.
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            playWandSwoosh();
            setActiveView('rules-guide');
          }}
          className="btn-durmstrang"
          style={{
            padding: '0.45rem 1rem',
            fontSize: '0.8rem',
            background: 'rgba(197, 159, 78, 0.2)',
            borderColor: 'var(--gold-ancient)',
            color: '#ffffff'
          }}
        >
          <Scroll size={14} color="var(--gold-ancient)" /> Otwórz Księgę Zasad <ChevronRight size={14} />
        </button>
      </div>

      {/* Category Pills & Quick Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {['all', 'Edykty Dyrekcji', 'Liga Bojowa', 'Wyniki Ocen', 'Zjawiska Astronomiczne', 'Eliksiry & Alchemia'].map(cat => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setCurrentPage(1);
              }}
              style={{
                padding: '0.35rem 0.8rem',
                borderRadius: '20px',
                border: activeCategory === cat ? '1px solid var(--ice-frost)' : '1px solid rgba(255,255,255,0.08)',
                background: activeCategory === cat ? 'rgba(164, 200, 225, 0.2)' : 'rgba(14, 18, 26, 0.6)',
                color: activeCategory === cat ? '#ffffff' : '#9ca3af',
                fontSize: '0.78rem',
                fontFamily: 'var(--font-heading)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {cat === 'all' ? 'Wszystkie Pergaminy' : cat}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          {canCreateNews && (
            <button
              onClick={handleOpenCreateModal}
              className="btn-durmstrang"
              style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}
            >
              <Plus size={13} /> + Nowy Edykt
            </button>
          )}

          <div style={{ fontSize: '0.75rem', color: '#8c95a6' }}>
            Pokazano: <strong>{filteredNews.length} edyktów</strong>
          </div>
        </div>
      </div>

      {/* Real-time Search Input */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          background: 'rgba(12, 16, 24, 0.7)',
          padding: '0.6rem 1rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid rgba(164, 200, 225, 0.15)',
          marginBottom: '0.5rem'
        }}
      >
        <Search size={15} color="var(--ice-frost)" />
        <input
          type="text"
          placeholder="Przeszukaj pergaminy, dekrety i wyniki turniejów..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="gothic-input"
          style={{ border: 'none', background: 'transparent', padding: '0.2rem', fontSize: '0.85rem', width: '100%' }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            Wyczyść
          </button>
        )}
      </div>

      {/* Dynamic News List */}
      {displayedNews.length === 0 ? (
        <div className="contentBlock" style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
          <Scroll size={32} color="var(--gold-ancient)" style={{ margin: '0 auto 0.8rem', opacity: 0.7 }} />
          <h3 style={{ fontSize: '1.2rem', color: '#ffffff', marginBottom: '0.4rem' }}>
            Brak pergaminów w tej kategorii
          </h3>
          <p style={{ fontSize: '0.85rem' }}>
            Spróbuj zmienić filtr lub wpisać inną frazę w wyszukiwarkę.
          </p>
        </div>
      ) : (
        displayedNews.map((article) => {
          const houseData = article.house ? houses[article.house] : null;
          const reactions = article.reactions || { admiration: 0, honor: 0, flame: 0, dread: 0 };
          const totalReactions = (reactions.admiration || 0) + (reactions.honor || 0) + (reactions.flame || 0) + (reactions.dread || 0);

          return (
            <article
              key={article.id}
              className={`contentBlock ${article.pinned ? 'pinned-glow' : ''}`}
              style={{
                borderColor: article.pinned ? 'rgba(197, 159, 78, 0.45)' : undefined
              }}
            >
              {/* =========================================================================
                  PANORAMIC CATEGORY BANNER DISPLAYED ABOVE TITLE
                  ========================================================================= */}
              <div style={{ marginBottom: '1.2rem' }}>
                <CategoryBanner
                  category={article.categoryKey || article.category}
                  customText={article.bannerCustomText}
                  height={78}
                />
              </div>

              {/* Centered Badges (Pinned / Category / House) */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                {article.pinned && (
                  <span style={{ fontSize: '0.74rem', background: 'rgba(197, 159, 78, 0.2)', color: 'var(--gold-glow)', padding: '0.2rem 0.65rem', borderRadius: '4px', border: '1px solid var(--gold-ancient)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontFamily: 'var(--font-heading)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    <Pin size={12} color="var(--gold-ancient)" /> Edykt Główny
                  </span>
                )}
                <span
                  style={{
                    fontSize: '0.75rem',
                    background: houseData ? `${houseData.colors?.primary}33` : 'rgba(164, 200, 225, 0.12)',
                    color: houseData ? houseData.colors?.secondary : 'var(--ice-crystal)',
                    padding: '0.2rem 0.65rem',
                    borderRadius: '4px',
                    border: `1px solid ${houseData ? houseData.colors?.secondary : 'rgba(164, 200, 225, 0.3)'}`,
                    fontFamily: 'var(--font-heading)',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase'
                  }}
                >
                  {article.category}
                </span>
                {houseData && (
                  <span style={{ fontSize: '0.75rem', color: houseData.colors?.secondary, display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'var(--font-heading)' }}>
                    {houseData.crestIcon} {houseData.name}
                  </span>
                )}
              </div>

              {/* Centered Majestic Title */}
              <div className="contentTitle">
                <span style={{ textAlign: 'center', width: '100%' }}>
                  {article.title}
                </span>
              </div>

              {/* Centered Meta information */}
              <div className="contentMeta">
                <span>Wykaligrafowane przez:</span>
                <span className="author-badge">{article.author}</span>
                <span style={{ opacity: 0.5 }}>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Calendar size={13} /> {article.date}
                </span>
                <span style={{ opacity: 0.5 }}>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Clock size={13} /> {article.readTime || '3 min'}
                </span>
              </div>

              {/* Article Content / Lead (Justified) */}
              <div className="contentBody">
                <p style={{ textAlign: 'justify', textJustify: 'inter-word', hyphens: 'auto', lineHeight: 1.8, marginBottom: '1.2rem', color: '#cfd7e4' }}>
                  {article.summary}
                </p>

                {/* If the article has standings (like Week #8 summary) */}
                {article.id === 'news-1' && (
                  <div
                    style={{
                      background: 'rgba(10, 13, 18, 0.85)',
                      border: '1px solid rgba(164, 200, 225, 0.25)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '1.25rem',
                      marginBottom: '1.4rem',
                      boxShadow: 'inset 0 0 20px rgba(0,0,0,0.6)'
                    }}
                  >
                    <h4 style={{ textAlign: 'center', color: '#ffffff', fontSize: '0.92rem', marginBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Klasyfikacja Generalna Pucharu Północy:
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.8rem' }}>
                      <div style={{ padding: '0.65rem', border: '1px solid #b32626', background: 'rgba(179,38,38,0.15)', borderRadius: '4px', textAlign: 'center' }}>
                        <span style={{ color: '#ff9e9e', fontWeight: 700, fontSize: '0.82rem' }}>ᛉ Björnhall:</span><br />
                        <strong style={{ color: '#ffffff', fontSize: '1.25rem', fontFamily: 'var(--font-heading)' }}>520 pkt</strong>
                      </div>
                      <div style={{ padding: '0.65rem', border: '1px solid #9b72cf', background: 'rgba(155,114,207,0.15)', borderRadius: '4px', textAlign: 'center' }}>
                        <span style={{ color: '#d8c2ff', fontWeight: 700, fontSize: '0.82rem' }}>ᚱ Ravnheim:</span><br />
                        <strong style={{ color: '#ffffff', fontSize: '1.25rem', fontFamily: 'var(--font-heading)' }}>510 pkt</strong>
                      </div>
                      <div style={{ padding: '0.65rem', border: '1px solid #2ec4b6', background: 'rgba(46,196,182,0.15)', borderRadius: '4px', textAlign: 'center' }}>
                        <span style={{ color: '#8cefe6', fontWeight: 700, fontSize: '0.82rem' }}>ᛞ Otergard:</span><br />
                        <strong style={{ color: '#ffffff', fontSize: '1.25rem', fontFamily: 'var(--font-heading)' }}>495 pkt</strong>
                      </div>
                      <div style={{ padding: '0.65rem', border: '1px solid #c59f4e', background: 'rgba(197,159,78,0.15)', borderRadius: '4px', textAlign: 'center' }}>
                        <span style={{ color: '#f7dca0', fontWeight: 700, fontSize: '0.82rem' }}>ᚦ Reinhall:</span><br />
                        <strong style={{ color: '#ffffff', fontSize: '1.25rem', fontFamily: 'var(--font-heading)' }}>480 pkt</strong>
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', fontStyle: 'italic', color: 'var(--ice-frost)', marginTop: '0.5rem' }}>
                  <div>
                    Z wyrazami szacunku,<br />
                    <strong style={{ color: '#ffffff' }}>{article.author}</strong>
                  </div>
                </div>
              </div>

              {/* Bottom Reactions & Expand Bar */}
              <div className="contentExpandLink">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleReaction(article.id, 'admiration')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.3rem 0.7rem',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '4px',
                      color: '#e5e7eb',
                      fontSize: '0.78rem',
                      cursor: 'pointer'
                    }}
                    title="Złóż Pieczęć Podziwu"
                  >
                    <ThumbsUp size={13} color="var(--ice-frost)" />
                    <span>Podziw ({reactions.admiration || 0})</span>
                  </button>

                  <button
                    onClick={() => handleReaction(article.id, 'honor')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.3rem 0.7rem',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '4px',
                      color: '#e5e7eb',
                      fontSize: '0.78rem',
                      cursor: 'pointer'
                    }}
                    title="Złóż Pieczęć Honoru"
                  >
                    <Shield size={13} color="var(--gold-ancient)" />
                    <span>Honor ({reactions.honor || 0})</span>
                  </button>

                  {article.comments && article.comments.length > 0 && (
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.3rem', marginLeft: '0.3rem' }}>
                      <MessageSquare size={13} /> {article.comments.length}
                    </span>
                  )}
                </div>

                <button onClick={() => handleOpenDetail(article)}>
                  Rozwiń pełny pergamin <ChevronRight size={14} />
                </button>
              </div>
            </article>
          );
        })
      )}

      {/* Secret Rune Embedded */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '0.5rem 0' }}>
        <SecretRune secretId="rune-fehu-home" />
      </div>

      {/* Modern Pagination Capsule */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '1.2rem',
            background: 'rgba(14, 18, 26, 0.7)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <span style={{ fontSize: '0.8rem', color: '#9ca3af', marginRight: '0.5rem' }}>Strony edyktów:</span>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              style={{
                padding: '0.3rem 0.7rem',
                borderRadius: '4px',
                background: currentPage === pageNum ? 'rgba(164, 200, 225, 0.25)' : 'transparent',
                border: currentPage === pageNum ? '1px solid var(--ice-frost)' : '1px solid rgba(255, 255, 255, 0.1)',
                color: currentPage === pageNum ? '#ffffff' : '#9ca3af',
                fontWeight: currentPage === pageNum ? 700 : 400,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              {pageNum}
            </button>
          ))}
          <button
            onClick={() => setActiveView('lore')}
            style={{
              padding: '0.3rem 0.9rem',
              borderRadius: '4px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(164, 200, 225, 0.3)',
              color: 'var(--ice-crystal)',
              fontSize: '0.8rem',
              fontFamily: 'var(--font-heading)',
              marginLeft: '0.8rem',
              cursor: 'pointer'
            }}
          >
            Archiwum Edyktów &gt;&gt;
          </button>
        </div>
      )}

      {/* News Detail Modal */}
      <NewsDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        article={selectedArticle}
      />

      {/* News Editor Modal (Quick Create) */}
      <NewsEditorModal
        isOpen={editorModalOpen}
        onClose={() => setEditorModalOpen(false)}
      />
    </div>
  );
};
