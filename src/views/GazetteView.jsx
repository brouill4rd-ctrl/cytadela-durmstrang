import React, { useState, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { api } from '../api';
import { Newspaper, BookOpen, Archive, Send, ChevronRight, Calendar, Users, Feather, Star, Eye } from 'lucide-react';

export const GazetteView = () => {
  const { currentUser, navigateToGazetteIssue, navigateToGazetteArchive, navigateToGazettePanel, showNotification } = useSchool();
  const [latestIssue, setLatestIssue] = useState(null);
  const [recentIssues, setRecentIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submissionOpen, setSubmissionOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionForm, setSubmissionForm] = useState({ type: 'article', title: '', content: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [latestRes, issuesRes] = await Promise.all([
      api.getGazetteIssueLatest(),
      api.getGazetteIssues()
    ]);
    if (latestRes.ok && latestRes.data) setLatestIssue(latestRes.data);
    if (issuesRes.ok) setRecentIssues(issuesRes.data || []);
    setLoading(false);
  };

  const handleSubmission = async () => {
    if (!submissionForm.title.trim()) {
      showNotification('Brak tytułu', 'Wpisz tytuł materiału przed wysłaniem.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.submitToGazette({
        ...submissionForm,
        title: submissionForm.title.trim(),
        content: submissionForm.content.trim()
      });

      if (res.ok) {
        showNotification('Wysłano!', 'Twój materiał trafił do redakcji Żelaznego Pióra.', 'success');
        setSubmissionOpen(false);
        setSubmissionForm({ type: 'article', title: '', content: '' });
      } else {
        showNotification('Nie udało się wysłać', res.error || 'Spróbuj ponownie za chwilę.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isStaff = currentUser && (currentUser.role === 'admin' || currentUser.role === 'professor');

  return (
    <div className="gazette-landing">
      {/* ═══════ MASTHEAD HERO ═══════ */}
      <div className="gazette-hero">
        <div className="gazette-hero-ornament">✦ ─── ⚜ ─── ✦</div>
        <div className="gazette-hero-masthead">
          <div className="gazette-hero-rune">ᛃ</div>
          <h1 className="gazette-hero-title">ŻELAZNE PIÓRO</h1>
          <div className="gazette-hero-subtitle">Gazeta Twierdzy Durmstrang</div>
          <div className="gazette-hero-rule">━━━━━━━━━━━━━━━━━━━━━━━━</div>
        </div>

        {loading ? (
          <div className="gazette-hero-loading">
            <Feather size={24} className="gazette-spin" />
            <span>Ładowanie najnowszego numeru...</span>
          </div>
        ) : latestIssue ? (
          <div className="gazette-hero-issue">
            <div className="gazette-cover-frame" onClick={() => navigateToGazetteIssue(latestIssue.id)}>
              {latestIssue.coverImage ? (
                <img src={latestIssue.coverImage} alt="Okładka" className="gazette-cover-img" />
              ) : (
                <div className="gazette-cover-placeholder">
                  <Newspaper size={64} />
                  <div className="gazette-cover-placeholder-title">ŻELAZNE PIÓRO</div>
                  <div className="gazette-cover-placeholder-num">Nr {latestIssue.number} / {latestIssue.publicationDate?.slice(0, 4) || '2026'}</div>
                  {latestIssue.theme && <div className="gazette-cover-placeholder-theme">„{latestIssue.theme}"</div>}
                  {latestIssue.title && <div className="gazette-cover-placeholder-headline">{latestIssue.title}</div>}
                </div>
              )}
              <div className="gazette-cover-overlay">
                <Eye size={20} />
                <span>Czytaj numer</span>
              </div>
            </div>

            <div className="gazette-hero-meta">
              <div className="gazette-hero-number">
                NUMER {String(latestIssue.number).padStart(2, '0')} / {latestIssue.publicationDate?.slice(0, 4) || '2026'}
              </div>
              {latestIssue.theme && (
                <div className="gazette-hero-theme">„{latestIssue.theme}"</div>
              )}
              {latestIssue.publicationDate && (
                <div className="gazette-hero-date">
                  <Calendar size={14} />
                  {new Date(latestIssue.publicationDate).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              )}
              {latestIssue.pages && (
                <div className="gazette-hero-stats">
                  {latestIssue.pages.length} stron • {latestIssue.articles?.length || 0} artykułów
                </div>
              )}
              <button className="gazette-read-btn" onClick={() => navigateToGazetteIssue(latestIssue.id)}>
                <BookOpen size={18} />
                CZYTAJ NUMER
              </button>
            </div>
          </div>
        ) : (
          <div className="gazette-hero-empty">
            <Feather size={40} />
            <p>Pierwszy numer Żelaznego Pióra jest w przygotowaniu...</p>
            <p className="gazette-hero-empty-sub">Redakcja pracuje nad premierowym wydaniem.</p>
          </div>
        )}
        <div className="gazette-hero-ornament">✦ ─── ⚜ ─── ✦</div>
      </div>

      {/* ═══════ OSTATNIE WYDANIA ═══════ */}
      {recentIssues.length > 1 && (
        <div className="gazette-recent">
          <h2 className="gazette-section-title">
            <span className="gazette-section-ornament">◆</span>
            Ostatnie wydania
            <span className="gazette-section-ornament">◆</span>
          </h2>
          <div className="gazette-recent-grid">
            {recentIssues.filter(i => i.id !== latestIssue?.id).slice(0, 6).map(issue => (
              <div key={issue.id} className="gazette-recent-card" onClick={() => navigateToGazetteIssue(issue.id)}>
                <div className="gazette-recent-cover">
                  {issue.coverImage ? (
                    <img src={issue.coverImage} alt={`Nr ${issue.number}`} />
                  ) : (
                    <div className="gazette-recent-cover-placeholder">
                      <Newspaper size={28} />
                      <span>Nr {issue.number}</span>
                    </div>
                  )}
                </div>
                <div className="gazette-recent-info">
                  <div className="gazette-recent-num">Nr {String(issue.number).padStart(2, '0')} / {issue.publicationDate?.slice(0, 4) || '2026'}</div>
                  {issue.theme && <div className="gazette-recent-theme">„{issue.theme}"</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════ AKCJE ═══════ */}
      <div className="gazette-actions">
        <button className="gazette-action-btn" onClick={navigateToGazetteArchive}>
          <Archive size={20} />
          <span>Archiwum Żelaznego Pióra</span>
          <ChevronRight size={16} />
        </button>

        {currentUser && (
          <button className="gazette-action-btn" onClick={() => setSubmissionOpen(!submissionOpen)}>
            <Send size={20} />
            <span>Prześlij do Żelaznego Pióra</span>
            <ChevronRight size={16} />
          </button>
        )}

        {isStaff && (
          <button className="gazette-action-btn gazette-action-editorial" onClick={navigateToGazettePanel}>
            <Feather size={20} />
            <span>Panel Redakcji</span>
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* ═══════ FORMULARZ ZGŁOSZEŃ ═══════ */}
      {submissionOpen && currentUser && (
        <div className="gazette-submission">
          <h3 className="gazette-submission-title">
            <Send size={18} />
            Prześlij materiał do Żelaznego Pióra
          </h3>
          <div className="gazette-submission-form">
            <label className="gazette-form-label">Typ materiału</label>
            <select
              className="gazette-form-select"
              value={submissionForm.type}
              onChange={e => setSubmissionForm(p => ({ ...p, type: e.target.value }))}
            >
              <option value="article">Artykuł</option>
              <option value="story">Opowiadanie</option>
              <option value="poem">Wiersz</option>
              <option value="photo">Fotografia</option>
              <option value="illustration">Ilustracja</option>
              <option value="gossip">Plotka</option>
              <option value="idea">Pomysł</option>
              <option value="announcement">Ogłoszenie</option>
            </select>

            <label className="gazette-form-label">Tytuł</label>
            <input
              className="gazette-form-input"
              placeholder="Tytuł materiału..."
              value={submissionForm.title}
              onChange={e => setSubmissionForm(p => ({ ...p, title: e.target.value }))}
            />

            <label className="gazette-form-label">Treść</label>
            <textarea
              className="gazette-form-textarea"
              placeholder="Napisz swoją treść tutaj..."
              rows={8}
              value={submissionForm.content}
              onChange={e => setSubmissionForm(p => ({ ...p, content: e.target.value }))}
            />

            <button className="gazette-form-submit" onClick={handleSubmission} disabled={submitting}>
              <Send size={16} />
              {submitting ? 'Wysyłanie...' : 'Wyślij do redakcji'}
            </button>
          </div>
        </div>
      )}

      {/* ═══════ KLIMAT ═══════ */}
      <div className="gazette-atmosphere">
        <div className="gazette-atmosphere-quote">
          „Kto kontroluje pióro, kontroluje historię."
        </div>
        <div className="gazette-atmosphere-source">— Stara nordycka mądrość</div>
      </div>
    </div>
  );
};
