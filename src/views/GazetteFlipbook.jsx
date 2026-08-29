import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSchool } from '../context/SchoolContext';
import { api } from '../api';
import {
  ChevronLeft, ChevronRight, X, BookOpen, List, Grid3X3, ZoomIn, ZoomOut,
  ChevronsLeft, ChevronsRight, Search, Volume2, VolumeX, Newspaper, Feather,
  Users, Calendar, Award, MessageSquare, Star, CheckCircle, ArrowLeft
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════
// PAGE TEMPLATES — render gazette page content by template type
// ═══════════════════════════════════════════════════════════

const renderPageContent = (page, issue, articles, quizzes, crosswords, secrets, interactiveState, setInteractiveState) => {
  const content = page.content || {};
  const article = page.articleId ? articles.find(a => a.id === page.articleId) : null;
  const template = page.template || 'article-single';

  switch (template) {
    case 'cover':
      return (
        <div className="gzp-cover">
          <div className="gzp-cover-ornament-top">═══════════════════</div>
          <div className="gzp-cover-masthead">ŻELAZNE PIÓRO</div>
          <div className="gzp-cover-subhead">GAZETA TWIERDZY DURMSTRANG</div>
          <div className="gzp-cover-number">Nr {issue?.number || '?'} / {issue?.publicationDate?.slice(0, 4) || '2026'}</div>
          {(content.coverImage || issue?.coverImage) && (
            <div className="gzp-cover-image">
              <img src={content.coverImage || issue?.coverImage} alt="" loading="lazy" />
            </div>
          )}
          {(content.mainHeadline || issue?.title) && (
            <div className="gzp-cover-headline">{content.mainHeadline || issue?.title}</div>
          )}
          {issue?.theme && <div className="gzp-cover-theme">„{issue.theme}"</div>}
          {content.headlines && content.headlines.map((h, i) => (
            <div key={i} className="gzp-cover-subheadline">{h}</div>
          ))}
          <div className="gzp-cover-ornament-bottom">═══════════════════</div>
        </div>
      );

    case 'toc':
      return (
        <div className="gzp-toc">
          <h2 className="gzp-toc-title">SPIS TREŚCI</h2>
          <div className="gzp-toc-rule">───────────────────</div>
          {(content.entries || []).map((entry, i) => (
            <div key={i} className="gzp-toc-entry" onClick={() => setInteractiveState(prev => ({ ...prev, goToPage: entry.page }))}>
              <span className="gzp-toc-page">{String(entry.page).padStart(2, '0')}</span>
              <span className="gzp-toc-separator">───</span>
              <span className="gzp-toc-label">{entry.title}</span>
            </div>
          ))}
        </div>
      );

    case 'article-single':
    case 'article-spread':
    case 'article-photo':
    case 'article-3col':
      return (
        <div className={`gzp-article gzp-article--${template}`}>
          {article?.supertitle && <div className="gzp-article-supertitle">{article.supertitle}</div>}
          <h2 className="gzp-article-title">{article?.title || content.title || 'Bez tytułu'}</h2>
          {article?.subtitle && <div className="gzp-article-subtitle">{article.subtitle}</div>}
          <div className="gzp-article-meta">
            {!article?.isAnonymous && article?.authorName && <span className="gzp-article-author">✎ {article.authorName}</span>}
            {article?.isAnonymous && <span className="gzp-article-author">✎ Anonimowy</span>}
            {article?.sectionName && <span className="gzp-article-section">│ {article.sectionName}</span>}
          </div>
          <div className="gzp-article-rule">────</div>
          {(article?.featuredImage || content.image) && (
            <div className="gzp-article-featured-img">
              <img src={article?.featuredImage || content.image} alt="" loading="lazy" />
              {content.imageCaption && <div className="gzp-article-caption">{content.imageCaption}</div>}
            </div>
          )}
          {article?.lead && <div className="gzp-article-lead">{article.lead}</div>}
          <div className={`gzp-article-body ${template === 'article-3col' ? 'gzp-cols-3' : template === 'article-spread' ? 'gzp-cols-2' : ''}`}>
            {renderTextContent(article?.content || content.body || '')}
          </div>
          {article?.featuredQuote && (
            <blockquote className="gzp-article-quote">
              „{article.featuredQuote}"
            </blockquote>
          )}
          {article?.additionalImages?.length > 0 && (
            <div className="gzp-article-gallery">
              {article.additionalImages.map((img, i) => (
                <img key={i} src={typeof img === 'string' ? img : img.url} alt="" loading="lazy" className="gzp-article-gallery-img" />
              ))}
            </div>
          )}
        </div>
      );

    case 'interview':
      return (
        <div className="gzp-interview">
          <div className="gzp-interview-label">WYWIAD</div>
          <h2 className="gzp-article-title">{article?.title || content.title || ''}</h2>
          {article && <div className="gzp-article-meta">✎ {article.isAnonymous ? 'Anonimowy' : article.authorName}</div>}
          <div className="gzp-article-rule">────</div>
          {(content.intervieweeImage || article?.featuredImage) && (
            <div className="gzp-interview-portrait">
              <img src={content.intervieweeImage || article?.featuredImage} alt="" loading="lazy" />
              {content.intervieweeName && <div className="gzp-interview-name">{content.intervieweeName}</div>}
            </div>
          )}
          <div className="gzp-interview-body">
            {renderTextContent(article?.content || content.body || '')}
          </div>
        </div>
      );

    case 'gallery':
      return (
        <div className="gzp-gallery">
          <h2 className="gzp-gallery-title">{content.title || 'GALERIA'}</h2>
          <div className="gzp-gallery-grid">
            {(content.images || []).map((img, i) => (
              <div key={i} className={`gzp-gallery-item ${img.magical ? 'gzp-gallery-magical' : ''}`}>
                {img.magical && img.url?.endsWith('.mp4') ? (
                  <video src={img.url} autoPlay loop muted playsInline className="gzp-gallery-video" />
                ) : (
                  <img src={typeof img === 'string' ? img : img.url} alt="" loading="lazy" />
                )}
                {img.caption && <div className="gzp-gallery-caption">{img.caption}</div>}
                {img.magical && <div className="gzp-gallery-magical-badge">✧ Magiczna</div>}
              </div>
            ))}
          </div>
        </div>
      );

    case 'news-briefs':
      return (
        <div className="gzp-briefs">
          <h2 className="gzp-briefs-title">{content.title || 'KRÓTKIE WIADOMOŚCI'}</h2>
          <div className="gzp-briefs-rule">───────────────────</div>
          {(content.items || []).map((item, i) => (
            <div key={i} className="gzp-briefs-item">
              <h3 className="gzp-briefs-headline">{item.headline}</h3>
              <p className="gzp-briefs-text">{item.text}</p>
              <div className="gzp-briefs-separator">◆</div>
            </div>
          ))}
        </div>
      );

    case 'rankings':
      return (
        <div className="gzp-rankings">
          <h2 className="gzp-rankings-title">{content.title || 'RANKING'}</h2>
          <div className="gzp-rankings-rule">───────────────────</div>
          {(content.entries || []).map((entry, i) => (
            <div key={i} className="gzp-rankings-entry">
              <span className="gzp-rankings-pos">{i + 1}.</span>
              <span className="gzp-rankings-name">{entry.name}</span>
              <span className="gzp-rankings-value">{entry.value}</span>
            </div>
          ))}
        </div>
      );

    case 'games':
      return (
        <div className="gzp-games">
          <h2 className="gzp-games-title">{content.title || 'GRY I ZABAWY'}</h2>
          {content.quizId && renderQuiz(quizzes.find(q => q.id === content.quizId), interactiveState, setInteractiveState)}
          {content.crosswordId && renderCrossword(crosswords.find(c => c.id === content.crosswordId), interactiveState, setInteractiveState)}
          {!content.quizId && !content.crosswordId && (
            <div className="gzp-games-placeholder">
              <p>{content.body || 'Strona zabaw'}</p>
            </div>
          )}
        </div>
      );

    case 'ad':
      return (
        <div className={`gzp-ad gzp-ad--${content.size || 'full'}`}>
          <div className="gzp-ad-border">
            {content.image && <img src={content.image} alt="" loading="lazy" className="gzp-ad-image" />}
            <div className="gzp-ad-name">{content.shopName || 'REKLAMA'}</div>
            <div className="gzp-ad-tagline">{content.tagline || ''}</div>
            {content.items && <div className="gzp-ad-items">{content.items}</div>}
            {content.offer && <div className="gzp-ad-offer">{content.offer}</div>}
          </div>
        </div>
      );

    case 'announcements':
      return (
        <div className="gzp-announcements">
          <h2 className="gzp-announcements-title">{content.title || 'OGŁOSZENIA'}</h2>
          <div className="gzp-article-rule">────</div>
          {(content.items || []).map((item, i) => (
            <div key={i} className="gzp-announcement-item">
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      );

    case 'editorial':
      return (
        <div className="gzp-editorial">
          <h2 className="gzp-editorial-title">ŻELAZNE PIÓRO</h2>
          <div className="gzp-editorial-issue">Nr {issue?.number || '?'} / {issue?.publicationDate?.slice(0, 4) || '2026'}</div>
          <div className="gzp-editorial-rule">───────────────────</div>
          {issue?.editorInChief && (
            <div className="gzp-editorial-section">
              <div className="gzp-editorial-label">REDAKTOR NACZELNY</div>
              <div className="gzp-editorial-person">{issue.editorInChief.fullName}</div>
            </div>
          )}
          {issue?.staff && (() => {
            const byRole = {};
            const roleLabels = {
              editor_in_chief: 'REDAKTOR NACZELNY',
              editor: 'REDAKCJA', photographer: 'FOTOGRAFIA',
              illustrator: 'ILUSTRACJE', proofreader: 'KOREKTA'
            };
            issue.staff.forEach(s => {
              if (s.gazetteRole === 'editor_in_chief') return;
              if (!byRole[s.gazetteRole]) byRole[s.gazetteRole] = [];
              byRole[s.gazetteRole].push(s);
            });
            return Object.entries(byRole).map(([role, members]) => (
              <div key={role} className="gzp-editorial-section">
                <div className="gzp-editorial-label">{roleLabels[role] || role.toUpperCase()}</div>
                {members.map(m => (
                  <div key={m.id} className="gzp-editorial-person">{m.fullName || m.userName}</div>
                ))}
              </div>
            ));
          })()}
          <div className="gzp-editorial-rule">───────────────────</div>
          <div className="gzp-editorial-publisher">
            <div>Wydawca:</div>
            <div>Twierdza Magii Durmstrang</div>
          </div>
        </div>
      );

    default:
      return (
        <div className="gzp-custom">
          {content.title && <h2 className="gzp-article-title">{content.title}</h2>}
          {content.image && <img src={content.image} alt="" loading="lazy" style={{ maxWidth: '100%' }} />}
          {content.body && <div className="gzp-article-body">{renderTextContent(content.body)}</div>}
        </div>
      );
  }
};

// Simple markdown-like text renderer (no dangerous HTML)
const renderTextContent = (text) => {
  if (!text) return null;
  const paragraphs = text.split(/\n\n+/);
  return paragraphs.map((para, i) => {
    if (para.startsWith('# ')) return <h3 key={i} className="gzp-text-h3">{para.slice(2)}</h3>;
    if (para.startsWith('## ')) return <h4 key={i} className="gzp-text-h4">{para.slice(3)}</h4>;
    if (para.startsWith('> ')) return <blockquote key={i} className="gzp-text-quote">{para.slice(2)}</blockquote>;
    if (para.startsWith('---')) return <hr key={i} className="gzp-text-hr" />;

    // Process inline formatting
    let html = para
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/~~(.+?)~~/g, '<del>$1</del>');

    return <p key={i} className="gzp-text-p" dangerouslySetInnerHTML={{ __html: html }} />;
  });
};

// Interactive Quiz renderer
const renderQuiz = (quiz, state, setState) => {
  if (!quiz) return null;
  const quizState = state.quizzes?.[quiz.id] || { answers: {}, submitted: false, score: 0 };

  const handleAnswer = (qIdx, answer) => {
    if (quizState.submitted) return;
    setState(prev => ({
      ...prev,
      quizzes: { ...prev.quizzes, [quiz.id]: { ...quizState, answers: { ...quizState.answers, [qIdx]: answer } } }
    }));
  };

  const submitQuiz = () => {
    let score = 0;
    quiz.questions.forEach((q, i) => {
      if (quizState.answers[i] === q.correct) score++;
    });
    const resultMsg = quiz.resultsMessages?.find(r => score >= (r.minScore || 0) && score <= (r.maxScore || 999));
    setState(prev => ({
      ...prev,
      quizzes: { ...prev.quizzes, [quiz.id]: { ...quizState, submitted: true, score, resultMessage: resultMsg?.message || '' } }
    }));
  };

  return (
    <div className="gzp-quiz">
      <h3 className="gzp-quiz-title">{quiz.title}</h3>
      <div className="gzp-quiz-rule">────</div>
      {quiz.questions.map((q, i) => (
        <div key={i} className="gzp-quiz-question">
          <div className="gzp-quiz-q-num">{i + 1}.</div>
          <div className="gzp-quiz-q-text">{q.question}</div>
          <div className="gzp-quiz-options">
            {q.options.map((opt, j) => (
              <button
                key={j}
                className={`gzp-quiz-option ${quizState.answers[i] === j ? 'gzp-quiz-option--selected' : ''} ${quizState.submitted && j === q.correct ? 'gzp-quiz-option--correct' : ''} ${quizState.submitted && quizState.answers[i] === j && j !== q.correct ? 'gzp-quiz-option--wrong' : ''}`}
                onClick={() => handleAnswer(i, j)}
                disabled={quizState.submitted}
              >
                <span className="gzp-quiz-letter">{String.fromCharCode(65 + j)}</span>
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}
      {!quizState.submitted ? (
        <button className="gzp-quiz-submit" onClick={submitQuiz} disabled={Object.keys(quizState.answers).length < quiz.questions.length}>
          <CheckCircle size={16} /> Sprawdź odpowiedzi
        </button>
      ) : (
        <div className="gzp-quiz-result">
          <div className="gzp-quiz-score">{quizState.score} / {quiz.questions.length}</div>
          {quizState.resultMessage && <div className="gzp-quiz-msg">{quizState.resultMessage}</div>}
        </div>
      )}
    </div>
  );
};

// Interactive Crossword renderer
const renderCrossword = (crossword, state, setState) => {
  if (!crossword) return null;
  const cwState = state.crosswords?.[crossword.id] || { cells: {}, checked: false };

  const handleCellChange = (row, col, value) => {
    if (cwState.checked) return;
    setState(prev => ({
      ...prev,
      crosswords: {
        ...prev.crosswords,
        [crossword.id]: {
          ...cwState,
          cells: { ...cwState.cells, [`${row}-${col}`]: value.toUpperCase().slice(0, 1) }
        }
      }
    }));
  };

  const checkCrossword = () => {
    setState(prev => ({
      ...prev,
      crosswords: { ...prev.crosswords, [crossword.id]: { ...cwState, checked: true } }
    }));
  };

  // Build grid from words
  const grid = Array.from({ length: crossword.gridHeight }, () =>
    Array.from({ length: crossword.gridWidth }, () => ({ letter: '', active: false, clueNum: null }))
  );

  crossword.words.forEach(word => {
    for (let i = 0; i < word.answer.length; i++) {
      const r = word.direction === 'down' ? word.row + i : word.row;
      const c = word.direction === 'across' ? word.col + i : word.col;
      if (r < crossword.gridHeight && c < crossword.gridWidth) {
        grid[r][c] = { letter: word.answer[i].toUpperCase(), active: true, clueNum: i === 0 ? word.number : grid[r][c].clueNum };
      }
    }
  });

  return (
    <div className="gzp-crossword">
      <h3 className="gzp-crossword-title">{crossword.title}</h3>
      <div className="gzp-crossword-grid" style={{ gridTemplateColumns: `repeat(${crossword.gridWidth}, 1fr)` }}>
        {grid.map((row, ri) =>
          row.map((cell, ci) => (
            <div key={`${ri}-${ci}`} className={`gzp-cw-cell ${cell.active ? 'gzp-cw-active' : 'gzp-cw-blocked'} ${cwState.checked && cell.active && cwState.cells[`${ri}-${ci}`] === cell.letter ? 'gzp-cw-correct' : ''} ${cwState.checked && cell.active && cwState.cells[`${ri}-${ci}`] && cwState.cells[`${ri}-${ci}`] !== cell.letter ? 'gzp-cw-wrong' : ''}`}>
              {cell.clueNum && <span className="gzp-cw-num">{cell.clueNum}</span>}
              {cell.active && (
                <input
                  className="gzp-cw-input"
                  maxLength={1}
                  value={cwState.cells[`${ri}-${ci}`] || ''}
                  onChange={e => handleCellChange(ri, ci, e.target.value)}
                  disabled={cwState.checked}
                />
              )}
            </div>
          ))
        )}
      </div>
      <div className="gzp-crossword-clues">
        <div className="gzp-cw-clue-group">
          <h4>Poziomo</h4>
          {crossword.words.filter(w => w.direction === 'across').map(w => (
            <div key={w.number} className="gzp-cw-clue">{w.number}. {w.clue}</div>
          ))}
        </div>
        <div className="gzp-cw-clue-group">
          <h4>Pionowo</h4>
          {crossword.words.filter(w => w.direction === 'down').map(w => (
            <div key={w.number} className="gzp-cw-clue">{w.number}. {w.clue}</div>
          ))}
        </div>
      </div>
      {!cwState.checked && (
        <button className="gzp-cw-check" onClick={checkCrossword}>
          <CheckCircle size={16} /> Sprawdź
        </button>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// MAIN FLIPBOOK COMPONENT
// ═══════════════════════════════════════════════════════════

export const GazetteFlipbook = () => {
  const { activeGazetteIssueId, navigateToGazette, showNotification } = useSchool();
  const [issue, setIssue] = useState(null);
  const [pages, setPages] = useState([]);
  const [articles, setArticles] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [crosswords, setCrosswords] = useState([]);
  const [secrets, setSecrets] = useState([]);
  const [currentSpread, setCurrentSpread] = useState(0); // index in spread pairs
  const [loading, setLoading] = useState(true);
  const [showToc, setShowToc] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [singlePage, setSinglePage] = useState(window.innerWidth < 768);
  const [flipping, setFlipping] = useState(null); // 'next' | 'prev' | null
  const [flipContent, setFlipContent] = useState(null); // { front: page, back: page, dir: string }
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [interactiveState, setInteractiveState] = useState({ quizzes: {}, crosswords: {}, goToPage: null });

  const reducedMotion = useMemo(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  , []);

  const bookRef = useRef(null);
  const touchStartRef = useRef(null);

  // Load issue data
  useEffect(() => {
    if (!activeGazetteIssueId) return;
    loadIssue();
  }, [activeGazetteIssueId]);

  const loadIssue = async () => {
    setLoading(true);
    const res = await api.getGazetteIssue(activeGazetteIssueId);
    if (res.ok && res.data) {
      setIssue(res.data);
      setPages(res.data.pages || []);
      setArticles(res.data.articles || []);
      setQuizzes(res.data.quizzes || []);
      setCrosswords(res.data.crosswords || []);
      setSecrets(res.data.secrets || []);
      // Log analytics
      api.logGazetteAnalytics({ issueId: activeGazetteIssueId, action: 'view' });
    }
    setLoading(false);
  };

  // Responsive: switch to single page on mobile
  useEffect(() => {
    const handleResize = () => setSinglePage(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); goPrev(); }
      if (e.key === 'Home') { e.preventDefault(); goToSpread(0); }
      if (e.key === 'End') { e.preventDefault(); goToSpread(maxSpread); }
      if (e.key === 'Escape') navigateToGazette();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [pages, currentSpread, singlePage]);

  // Handle goToPage from interactive elements
  useEffect(() => {
    if (interactiveState.goToPage !== null && interactiveState.goToPage !== undefined) {
      const targetPageIdx = pages.findIndex(p => p.pageNumber === interactiveState.goToPage);
      if (targetPageIdx >= 0) {
        const spreadIdx = singlePage ? targetPageIdx : Math.floor(targetPageIdx / 2);
        goToSpread(spreadIdx);
      }
      setInteractiveState(prev => ({ ...prev, goToPage: null }));
    }
  }, [interactiveState.goToPage]);

  // Touch handling
  const handleTouchStart = (e) => { touchStartRef.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (!touchStartRef.current) return;
    const diff = touchStartRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext(); else goPrev();
    }
    touchStartRef.current = null;
  };

  const maxSpread = singlePage ? pages.length - 1 : Math.floor((pages.length - 1) / 2);

  const playFlipSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 200 + Math.random() * 100;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch (_) {}
  };

  const FLIP_DURATION = reducedMotion ? 0 : 650;

  const goNext = useCallback(() => {
    if (currentSpread >= maxSpread || flipping) return;
    playFlipSound();

    if (!reducedMotion) {
      // Capture content for the flip overlay
      const nextSpread = currentSpread + 1;
      const frontIdx = singlePage ? currentSpread : currentSpread * 2 + 1;
      const backIdx  = singlePage ? nextSpread  : nextSpread * 2;
      const frontPage = pages[frontIdx];
      const backPage  = pages[backIdx];
      const dir = singlePage ? 'snext' : 'next';
      setFlipContent({ front: frontPage, back: backPage, dir });
    }

    setFlipping('next');
    setTimeout(() => {
      setCurrentSpread(prev => Math.min(prev + 1, maxSpread));
      setFlipping(null);
      setFlipContent(null);
      api.logGazetteAnalytics({ issueId: activeGazetteIssueId, action: 'page_view', pageNumber: currentSpread + 1 });
    }, FLIP_DURATION);
  }, [currentSpread, maxSpread, flipping, pages, singlePage, reducedMotion, soundEnabled]);

  const goPrev = useCallback(() => {
    if (currentSpread <= 0 || flipping) return;
    playFlipSound();

    if (!reducedMotion) {
      const prevSpread = currentSpread - 1;
      const frontIdx = singlePage ? currentSpread : currentSpread * 2;
      const backIdx  = singlePage ? prevSpread  : prevSpread * 2 + 1;
      const frontPage = pages[frontIdx];
      const backPage  = pages[backIdx];
      const dir = singlePage ? 'sprev' : 'prev';
      setFlipContent({ front: frontPage, back: backPage, dir });
    }

    setFlipping('prev');
    setTimeout(() => {
      setCurrentSpread(prev => Math.max(prev - 1, 0));
      setFlipping(null);
      setFlipContent(null);
    }, FLIP_DURATION);
  }, [currentSpread, flipping, pages, singlePage, reducedMotion, soundEnabled]);

  const goToSpread = (idx) => {
    const clamped = Math.max(0, Math.min(idx, maxSpread));
    setCurrentSpread(clamped);
  };

  // Get current visible pages
  const getVisiblePages = () => {
    if (singlePage) {
      return [pages[currentSpread]].filter(Boolean);
    }
    const leftIdx = currentSpread * 2;
    const rightIdx = leftIdx + 1;
    return [pages[leftIdx], pages[rightIdx]].filter(Boolean);
  };

  // Search within issue
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    const res = await api.searchGazette(searchQuery, activeGazetteIssueId);
    if (res.ok) setSearchResults(res.data || []);
  };

  // Current page numbers for display
  const visiblePages = getVisiblePages();
  const currentPageDisplay = singlePage
    ? `${currentSpread + 1}`
    : `${currentSpread * 2 + 1}${pages[currentSpread * 2 + 1] ? '–' + (currentSpread * 2 + 2) : ''}`;

  if (loading) {
    return (
      <div className="gazette-flipbook-loading">
        <Feather size={32} className="gazette-spin" />
        <span>Otwieranie numeru...</span>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="gazette-flipbook-error">
        <Newspaper size={48} />
        <p>Nie znaleziono tego wydania.</p>
        <button onClick={navigateToGazette}>Wróć do Żelaznego Pióra</button>
      </div>
    );
  }

  return (
    <div className="gazette-flipbook-wrapper">
      {/* ═══════ TOP BAR ═══════ */}
      <div className="gzfb-toolbar">
        <button className="gzfb-tool-btn" onClick={navigateToGazette} title="Wróć">
          <ArrowLeft size={18} />
        </button>
        <div className="gzfb-toolbar-title">
          ŻELAZNE PIÓRO — Nr {issue.number} / {issue.publicationDate?.slice(0, 4) || '2026'}
        </div>
        <div className="gzfb-toolbar-actions">
          <button className="gzfb-tool-btn" onClick={() => setShowToc(!showToc)} title="Spis treści">
            <List size={18} />
          </button>
          <button className="gzfb-tool-btn" onClick={() => setShowThumbnails(!showThumbnails)} title="Miniatury">
            <Grid3X3 size={18} />
          </button>
          <button className="gzfb-tool-btn" onClick={() => setShowSearch(!showSearch)} title="Szukaj">
            <Search size={18} />
          </button>
          <button className="gzfb-tool-btn" onClick={() => setZoom(z => Math.min(z + 0.15, 1.8))} title="Powiększ">
            <ZoomIn size={18} />
          </button>
          <button className="gzfb-tool-btn" onClick={() => setZoom(z => Math.max(z - 0.15, 0.6))} title="Pomniejsz">
            <ZoomOut size={18} />
          </button>
          <button className="gzfb-tool-btn" onClick={() => setSinglePage(!singlePage)} title={singlePage ? 'Rozkładówka' : 'Jedna strona'}>
            <BookOpen size={18} />
          </button>
          <button className="gzfb-tool-btn" onClick={() => setSoundEnabled(!soundEnabled)} title={soundEnabled ? 'Wyłącz dźwięk' : 'Włącz dźwięk'}>
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button className="gzfb-tool-btn gzfb-close-btn" onClick={navigateToGazette} title="Zamknij">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* ═══════ SEARCH PANEL ═══════ */}
      {showSearch && (
        <div className="gzfb-search-panel">
          <div className="gzfb-search-row">
            <Search size={16} />
            <input
              className="gzfb-search-input"
              placeholder="Szukaj w numerze..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <button className="gzfb-search-go" onClick={handleSearch}>Szukaj</button>
          </div>
          {searchResults.length > 0 && (
            <div className="gzfb-search-results">
              {searchResults.map((r, i) => (
                <div key={i} className="gzfb-search-result" onClick={() => {
                  if (r.pageNumber) {
                    setInteractiveState(prev => ({ ...prev, goToPage: r.pageNumber }));
                    setShowSearch(false);
                  }
                }}>
                  {r.pageNumber && <span className="gzfb-search-page">str. {r.pageNumber}</span>}
                  <span className="gzfb-search-title">{r.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════ TOC PANEL ═══════ */}
      {showToc && (
        <div className="gzfb-toc-panel">
          <h3 className="gzfb-toc-head">SPIS TREŚCI</h3>
          {pages.map((p, i) => {
            const art = p.articleId ? articles.find(a => a.id === p.articleId) : null;
            const label = p.template === 'cover' ? 'Okładka' :
              p.template === 'toc' ? 'Spis treści' :
              p.template === 'editorial' ? 'Stopka redakcyjna' :
              art?.title || p.content?.title || `Strona ${p.pageNumber}`;
            return (
              <div
                key={p.id}
                className="gzfb-toc-entry"
                onClick={() => {
                  const spreadIdx = singlePage ? i : Math.floor(i / 2);
                  goToSpread(spreadIdx);
                  setShowToc(false);
                }}
              >
                <span className="gzfb-toc-num">{String(p.pageNumber).padStart(2, '0')}</span>
                <span className="gzfb-toc-sep">───</span>
                <span className="gzfb-toc-label">{label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════ THUMBNAILS PANEL ═══════ */}
      {showThumbnails && (
        <div className="gzfb-thumbnails-panel">
          <h3 className="gzfb-thumb-head">STRONY</h3>
          <div className="gzfb-thumbnails-grid">
            {pages.map((p, i) => (
              <div
                key={p.id}
                className={`gzfb-thumb ${(singlePage ? currentSpread === i : Math.floor(i / 2) === currentSpread) ? 'gzfb-thumb--active' : ''}`}
                onClick={() => {
                  goToSpread(singlePage ? i : Math.floor(i / 2));
                  setShowThumbnails(false);
                }}
              >
                <div className="gzfb-thumb-label">{String(p.pageNumber).padStart(2, '0')}</div>
                <div className="gzfb-thumb-template">{p.template}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════ THE BOOK ═══════ */}
      <div
        className={`gzfb-book ${singlePage ? 'gzfb-book--single' : 'gzfb-book--spread'} ${flipping ? `gzfb-flipping-${flipping}` : ''}`}
        ref={bookRef}
        style={{ transform: `scale(${zoom})` }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Spine shadow */}
        {!singlePage && <div className="gzfb-spine" />}

        {/* Left navigation zone */}
        <div className="gzfb-click-zone gzfb-click-left" onClick={goPrev} />

        {/* Pages */}
        <div className={`gzfb-pages ${singlePage ? 'gzfb-pages--single' : 'gzfb-pages--double'}`}>
          {visiblePages.map((page, idx) => (
            <div
              key={page.id}
              className={`gzfb-page ${idx === 0 && !singlePage ? 'gzfb-page--left' : ''} ${idx === 1 ? 'gzfb-page--right' : ''} ${singlePage ? 'gzfb-page--single' : ''}`}
            >
              <div className="gzfb-page-texture" />
              <div className="gzfb-page-content">
                {renderPageContent(page, issue, articles, quizzes, crosswords, secrets, interactiveState, setInteractiveState)}
              </div>
              <div className="gzfb-page-number">— {page.pageNumber} —</div>
              {/* Corner fold hint */}
              {idx === (singlePage ? 0 : 1) && currentSpread < maxSpread && (
                <div className="gzfb-corner-fold" onClick={goNext} />
              )}
            </div>
          ))}
        </div>

        {/* Right navigation zone */}
        <div className="gzfb-click-zone gzfb-click-right" onClick={goNext} />

        {/* ═══ 3D FLIP OVERLAY ═══ */}
        {flipping && flipContent && !reducedMotion && (
          <div className={`gzfb-flip-overlay gzfb-flip-overlay--${flipContent.dir}`}>
            <div className="gzfb-flip-card">
              <div className="gzfb-flip-front">
                <div className="gzfb-flip-face-content">
                  {flipContent.front && renderPageContent(
                    flipContent.front, issue, articles, quizzes, crosswords, secrets,
                    interactiveState, () => {}
                  )}
                </div>
              </div>
              <div className="gzfb-flip-back">
                <div className="gzfb-flip-face-content">
                  {flipContent.back && renderPageContent(
                    flipContent.back, issue, articles, quizzes, crosswords, secrets,
                    interactiveState, () => {}
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════ BOTTOM NAV ═══════ */}
      <div className="gzfb-nav-bar">
        <button className="gzfb-nav-btn" onClick={() => goToSpread(0)} disabled={currentSpread === 0}>
          <ChevronsLeft size={18} />
        </button>
        <button className="gzfb-nav-btn gzfb-nav-prev" onClick={goPrev} disabled={currentSpread === 0}>
          <ChevronLeft size={20} />
        </button>
        <div className="gzfb-nav-info">
          {currentPageDisplay} / {pages.length}
        </div>
        <button className="gzfb-nav-btn gzfb-nav-next" onClick={goNext} disabled={currentSpread >= maxSpread}>
          <ChevronRight size={20} />
        </button>
        <button className="gzfb-nav-btn" onClick={() => goToSpread(maxSpread)} disabled={currentSpread >= maxSpread}>
          <ChevronsRight size={18} />
        </button>
      </div>
    </div>
  );
};
