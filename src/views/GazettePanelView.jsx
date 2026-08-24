import React, { useState, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { api } from '../api';
import {
  Newspaper, Plus, Edit3, Trash2, Eye, Check, ChevronRight, Send, Users, FileText,
  BookOpen, Settings, BarChart2, Archive, Feather, MessageSquare, Image, Layers,
  CheckCircle, XCircle, Clock, AlertTriangle, GripVertical, ArrowLeft, Star, Layout
} from 'lucide-react';

const STATUS_LABELS = {
  idea: { label: 'Pomysł', icon: '💡', color: '#f59e0b' },
  draft: { label: 'Szkic', icon: '📝', color: '#6366f1' },
  review: { label: 'Korekta', icon: '🔍', color: '#8b5cf6' },
  pending_approval: { label: 'Do akceptacji', icon: '⏳', color: '#f97316' },
  approved: { label: 'Zaakceptowany', icon: '✅', color: '#22c55e' },
  in_issue: { label: 'W numerze', icon: '📰', color: '#06b6d4' },
  published: { label: 'Opublikowany', icon: '🌟', color: '#10b981' }
};

const ISSUE_STATUS_LABELS = {
  draft: { label: 'Szkic', color: '#6366f1' },
  editing: { label: 'W przygotowaniu', color: '#f59e0b' },
  ready: { label: 'Gotowy', color: '#22c55e' },
  published: { label: 'Opublikowany', color: '#10b981' },
  archived: { label: 'Zarchiwizowany', color: '#64748b' }
};

const GAZETTE_ROLES = {
  editor_in_chief: 'Redaktor Naczelny',
  editor: 'Redaktor',
  photographer: 'Fotograf',
  illustrator: 'Ilustrator',
  proofreader: 'Korektor'
};

const PAGE_TEMPLATES = [
  { id: 'cover', label: 'Okładka', icon: '📰' },
  { id: 'toc', label: 'Spis treści', icon: '📋' },
  { id: 'article-single', label: 'Artykuł (1 kol.)', icon: '📄' },
  { id: 'article-spread', label: 'Artykuł (2 kol.)', icon: '📰' },
  { id: 'article-3col', label: 'Artykuł (3 kol.)', icon: '📰' },
  { id: 'article-photo', label: 'Artykuł z foto', icon: '📸' },
  { id: 'interview', label: 'Wywiad', icon: '🎤' },
  { id: 'gallery', label: 'Galeria', icon: '🖼️' },
  { id: 'news-briefs', label: 'Wiadomości krótkie', icon: '📢' },
  { id: 'rankings', label: 'Ranking', icon: '🏆' },
  { id: 'games', label: 'Gry i zabawy', icon: '🎲' },
  { id: 'ad', label: 'Reklama', icon: '🪧' },
  { id: 'announcements', label: 'Ogłoszenia', icon: '📋' },
  { id: 'editorial', label: 'Stopka redakcyjna', icon: '🖋️' }
];

export const GazettePanelView = () => {
  const { currentUser, navigateToGazette, navigateToGazetteIssue, showNotification, users } = useSchool();
  const [activeTab, setActiveTab] = useState('issues');
  const [issues, setIssues] = useState([]);
  const [articles, setArticles] = useState([]);
  const [sections, setSections] = useState([]);
  const [staff, setStaff] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [issuePages, setIssuePages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [issueForm, setIssueForm] = useState({ number: 1, title: '', theme: '', schoolYear: '2026/2027', publicationDate: '', coverImage: '', description: '' });
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [articleForm, setArticleForm] = useState({ title: '', supertitle: '', subtitle: '', lead: '', content: '', sectionId: '', sectionName: '', featuredImage: '', featuredQuote: '', sources: '', isAnonymous: false });
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [staffForm, setStaffForm] = useState({ userId: '', gazetteRole: 'editor' });
  const [showPageForm, setShowPageForm] = useState(false);
  const [pageForm, setPageForm] = useState({ template: 'article-single', articleId: '', content: {} });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [issRes, artRes, secRes, staffRes, subRes] = await Promise.all([
      api.getGazetteIssuesAll(),
      api.getGazetteArticles(),
      api.getGazetteSections(),
      api.getGazetteStaff(),
      api.getGazetteSubmissions()
    ]);
    if (issRes.ok) setIssues(issRes.data || []);
    if (artRes.ok) setArticles(artRes.data || []);
    if (secRes.ok) setSections(secRes.data || []);
    if (staffRes.ok) setStaff(staffRes.data || []);
    if (subRes.ok) setSubmissions(subRes.data || []);
    setLoading(false);
  };

  const loadIssuePages = async (issueId) => {
    const res = await api.getGazettePages(issueId);
    if (res.ok) setIssuePages(res.data || []);
  };

  // Issue CRUD
  const handleCreateIssue = async () => {
    const res = await api.createGazetteIssue(issueForm);
    if (res.ok) {
      showNotification({ type: 'success', title: 'Sukces!', message: 'Wydanie utworzone.' });
      setShowIssueForm(false);
      setIssueForm({ number: (issues.length > 0 ? Math.max(...issues.map(i => i.number)) + 1 : 1), title: '', theme: '', schoolYear: '2026/2027', publicationDate: '', coverImage: '', description: '' });
      loadAll();
    }
  };

  const handleUpdateIssue = async () => {
    if (!selectedIssue) return;
    const res = await api.updateGazetteIssue(selectedIssue.id, issueForm);
    if (res.ok) {
      showNotification({ type: 'success', title: 'Zapisano', message: 'Wydanie zaktualizowane.' });
      loadAll();
      setSelectedIssue(res.data);
    }
  };

  const handlePublishIssue = async (issueId) => {
    const res = await api.publishGazetteIssue(issueId);
    if (res.ok) {
      showNotification({ type: 'success', title: '🎉 Opublikowano!', message: res.data.message || 'Numer jest teraz dostępny.' });
      loadAll();
    } else {
      showNotification({ type: 'error', title: 'Błąd', message: res.data?.details?.join(', ') || res.data?.error || 'Nie udało się opublikować.' });
    }
  };

  // Article CRUD
  const handleCreateArticle = async () => {
    const payload = { ...articleForm, issueId: selectedIssue?.id || '', authorId: currentUser?.id, authorName: currentUser?.fullName || currentUser?.username };
    const res = await api.createGazetteArticle(payload);
    if (res.ok) {
      showNotification({ type: 'success', title: 'Sukces!', message: 'Artykuł utworzony.' });
      setShowArticleForm(false);
      setArticleForm({ title: '', supertitle: '', subtitle: '', lead: '', content: '', sectionId: '', sectionName: '', featuredImage: '', featuredQuote: '', sources: '', isAnonymous: false });
      loadAll();
    }
  };

  const handleSaveArticle = async () => {
    if (!selectedArticle) return;
    const res = await api.updateGazetteArticle(selectedArticle.id, articleForm);
    if (res.ok) {
      showNotification({ type: 'success', title: 'Zapisano', message: 'Artykuł zaktualizowany.' });
      loadAll();
    }
  };

  const handleArticleStatus = async (articleId, status, comment = '') => {
    const res = await api.updateGazetteArticleStatus(articleId, { status, comment });
    if (res.ok) {
      showNotification({ type: 'success', title: 'Status zmieniony', message: `Artykuł: ${STATUS_LABELS[status]?.label}` });
      loadAll();
    }
  };

  const handleDeleteArticle = async (id) => {
    if (!confirm('Usunąć ten artykuł?')) return;
    await api.deleteGazetteArticle(id);
    loadAll();
  };

  // Staff CRUD
  const handleAddStaff = async () => {
    if (!staffForm.userId) return;
    const res = await api.addGazetteStaff(staffForm);
    if (res.ok) {
      showNotification({ type: 'success', title: 'Dodano!', message: 'Członek redakcji dodany.' });
      setShowStaffForm(false);
      loadAll();
    } else {
      showNotification({ type: 'error', title: 'Błąd', message: res.data?.error || 'Nie udało się dodać.' });
    }
  };

  const handleRemoveStaff = async (id) => {
    if (!confirm('Usunąć z redakcji?')) return;
    await api.removeGazetteStaff(id);
    loadAll();
  };

  // Page management
  const handleAddPage = async () => {
    if (!selectedIssue) return;
    const res = await api.createGazettePage({ issueId: selectedIssue.id, ...pageForm });
    if (res.ok) {
      showNotification({ type: 'success', title: 'Strona dodana', message: 'Nowa strona w numerze.' });
      setShowPageForm(false);
      loadIssuePages(selectedIssue.id);
    }
  };

  const handleDeletePage = async (id) => {
    if (!confirm('Usunąć stronę?')) return;
    await api.deleteGazettePage(id);
    if (selectedIssue) loadIssuePages(selectedIssue.id);
  };

  // Submission review
  const handleReviewSubmission = async (id, status, note = '') => {
    await api.reviewGazetteSubmission(id, { status, reviewerNote: note });
    loadAll();
  };

  const selectIssueForEdit = (issue) => {
    setSelectedIssue(issue);
    setIssueForm({
      number: issue.number, title: issue.title, theme: issue.theme,
      schoolYear: issue.schoolYear, publicationDate: issue.publicationDate,
      coverImage: issue.coverImage, description: issue.description
    });
    loadIssuePages(issue.id);
    setActiveTab('compose');
  };

  const selectArticleForEdit = (article) => {
    setSelectedArticle(article);
    setArticleForm({
      title: article.title, supertitle: article.supertitle, subtitle: article.subtitle,
      lead: article.lead, content: article.content, sectionId: article.sectionId,
      sectionName: article.sectionName, featuredImage: article.featuredImage,
      featuredQuote: article.featuredQuote, sources: article.sources,
      isAnonymous: article.isAnonymous
    });
    setActiveTab('article-edit');
  };

  if (loading) {
    return (
      <div className="gazette-panel-loading">
        <Feather size={32} className="gazette-spin" />
        <span>Ładowanie panelu redakcji...</span>
      </div>
    );
  }

  return (
    <div className="gazette-panel">
      {/* ═══════ HEADER ═══════ */}
      <div className="gazette-panel-header">
        <button className="gazette-panel-back" onClick={navigateToGazette}>
          <ArrowLeft size={18} /> Powrót
        </button>
        <div className="gazette-panel-title">
          <Feather size={22} />
          <span>Panel Redakcji — Żelazne Pióro</span>
        </div>
      </div>

      {/* ═══════ TABS ═══════ */}
      <div className="gazette-panel-tabs">
        {[
          { id: 'issues', label: 'Wydania', icon: <Newspaper size={16} /> },
          { id: 'articles', label: 'Artykuły', icon: <FileText size={16} /> },
          { id: 'compose', label: 'Skład', icon: <Layout size={16} />, disabled: !selectedIssue },
          { id: 'submissions', label: `Zgłoszenia (${submissions.filter(s => s.status === 'pending').length})`, icon: <Send size={16} /> },
          { id: 'staff', label: 'Redakcja', icon: <Users size={16} /> },
          { id: 'sections', label: 'Działy', icon: <Layers size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            className={`gazette-panel-tab ${activeTab === tab.id ? 'gazette-panel-tab--active' : ''} ${tab.disabled ? 'gazette-panel-tab--disabled' : ''}`}
            onClick={() => !tab.disabled && setActiveTab(tab.id)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════ TAB CONTENT ═══════ */}
      <div className="gazette-panel-content">

        {/* ── ISSUES TAB ── */}
        {activeTab === 'issues' && (
          <div className="gzp-tab-issues">
            <div className="gzp-tab-toolbar">
              <h2>Wydania Żelaznego Pióra</h2>
              <button className="gzp-btn gzp-btn--primary" onClick={() => {
                setShowIssueForm(true);
                setIssueForm(prev => ({ ...prev, number: issues.length > 0 ? Math.max(...issues.map(i => i.number)) + 1 : 1 }));
              }}>
                <Plus size={16} /> Nowe wydanie
              </button>
            </div>

            {showIssueForm && (
              <div className="gzp-form-card">
                <h3><Plus size={16} /> Nowe wydanie</h3>
                <div className="gzp-form-grid">
                  <label>Numer<input type="number" value={issueForm.number} onChange={e => setIssueForm(p => ({ ...p, number: parseInt(e.target.value) || 1 }))} /></label>
                  <label>Tytuł / główny nagłówek<input value={issueForm.title} onChange={e => setIssueForm(p => ({ ...p, title: e.target.value }))} placeholder="np. Powrót do Twierdzy" /></label>
                  <label>Temat numeru<input value={issueForm.theme} onChange={e => setIssueForm(p => ({ ...p, theme: e.target.value }))} placeholder="np. Nowy rok szkolny" /></label>
                  <label>Rok szkolny<input value={issueForm.schoolYear} onChange={e => setIssueForm(p => ({ ...p, schoolYear: e.target.value }))} /></label>
                  <label>Data publikacji<input type="date" value={issueForm.publicationDate} onChange={e => setIssueForm(p => ({ ...p, publicationDate: e.target.value }))} /></label>
                  <label>URL okładki<input value={issueForm.coverImage} onChange={e => setIssueForm(p => ({ ...p, coverImage: e.target.value }))} placeholder="https://..." /></label>
                </div>
                <label>Opis<textarea rows={3} value={issueForm.description} onChange={e => setIssueForm(p => ({ ...p, description: e.target.value }))} /></label>
                <div className="gzp-form-actions">
                  <button className="gzp-btn gzp-btn--primary" onClick={handleCreateIssue}><CheckCircle size={16} /> Utwórz</button>
                  <button className="gzp-btn" onClick={() => setShowIssueForm(false)}>Anuluj</button>
                </div>
              </div>
            )}

            <div className="gzp-issues-list">
              {issues.map(issue => (
                <div key={issue.id} className="gzp-issue-card">
                  <div className="gzp-issue-cover-mini">
                    {issue.coverImage ? <img src={issue.coverImage} alt="" /> : <Newspaper size={28} />}
                  </div>
                  <div className="gzp-issue-info">
                    <div className="gzp-issue-num">Nr {String(issue.number).padStart(2, '0')} / {issue.schoolYear || '2026'}</div>
                    <div className="gzp-issue-title">{issue.title || '(Bez tytułu)'}</div>
                    {issue.theme && <div className="gzp-issue-theme">„{issue.theme}"</div>}
                    <div className="gzp-issue-status" style={{ color: ISSUE_STATUS_LABELS[issue.status]?.color }}>
                      {ISSUE_STATUS_LABELS[issue.status]?.label}
                    </div>
                  </div>
                  <div className="gzp-issue-actions">
                    <button className="gzp-btn-icon" onClick={() => selectIssueForEdit(issue)} title="Edytuj / Składaj"><Edit3 size={16} /></button>
                    <button className="gzp-btn-icon" onClick={() => navigateToGazetteIssue(issue.id)} title="Podgląd"><Eye size={16} /></button>
                    {issue.status !== 'published' && (
                      <button className="gzp-btn-icon gzp-btn-icon--success" onClick={() => handlePublishIssue(issue.id)} title="Publikuj"><CheckCircle size={16} /></button>
                    )}
                  </div>
                </div>
              ))}
              {issues.length === 0 && <div className="gzp-empty">Brak wydań. Utwórz pierwszy numer!</div>}
            </div>
          </div>
        )}

        {/* ── ARTICLES TAB ── */}
        {activeTab === 'articles' && (
          <div className="gzp-tab-articles">
            <div className="gzp-tab-toolbar">
              <h2>Artykuły</h2>
              <button className="gzp-btn gzp-btn--primary" onClick={() => setShowArticleForm(true)}>
                <Plus size={16} /> Nowy artykuł
              </button>
            </div>

            {showArticleForm && (
              <div className="gzp-form-card">
                <h3><Plus size={16} /> Nowy artykuł</h3>
                <div className="gzp-form-grid">
                  <label>Tytuł<input value={articleForm.title} onChange={e => setArticleForm(p => ({ ...p, title: e.target.value }))} placeholder="Tytuł artykułu" /></label>
                  <label>Nadtytuł<input value={articleForm.supertitle} onChange={e => setArticleForm(p => ({ ...p, supertitle: e.target.value }))} placeholder="np. PILNE" /></label>
                  <label>Podtytuł<input value={articleForm.subtitle} onChange={e => setArticleForm(p => ({ ...p, subtitle: e.target.value }))} /></label>
                  <label>Dział
                    <select value={articleForm.sectionId} onChange={e => {
                      const sec = sections.find(s => s.id === e.target.value);
                      setArticleForm(p => ({ ...p, sectionId: e.target.value, sectionName: sec?.name || '' }));
                    }}>
                      <option value="">— Wybierz dział —</option>
                      {sections.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                    </select>
                  </label>
                </div>
                <label>Lead (wstęp)<textarea rows={2} value={articleForm.lead} onChange={e => setArticleForm(p => ({ ...p, lead: e.target.value }))} placeholder="Krótki wstęp..." /></label>
                <label>Treść artykułu<textarea rows={10} value={articleForm.content} onChange={e => setArticleForm(p => ({ ...p, content: e.target.value }))} placeholder="Użyj **pogrubienia**, *kursywy*, > cytatów..." /></label>
                <div className="gzp-form-grid">
                  <label>Zdjęcie główne (URL)<input value={articleForm.featuredImage} onChange={e => setArticleForm(p => ({ ...p, featuredImage: e.target.value }))} /></label>
                  <label>Cytat<input value={articleForm.featuredQuote} onChange={e => setArticleForm(p => ({ ...p, featuredQuote: e.target.value }))} /></label>
                </div>
                <label className="gzp-checkbox"><input type="checkbox" checked={articleForm.isAnonymous} onChange={e => setArticleForm(p => ({ ...p, isAnonymous: e.target.checked }))} /> Anonimowy autor</label>
                <div className="gzp-form-actions">
                  <button className="gzp-btn gzp-btn--primary" onClick={handleCreateArticle}><CheckCircle size={16} /> Utwórz</button>
                  <button className="gzp-btn" onClick={() => setShowArticleForm(false)}>Anuluj</button>
                </div>
              </div>
            )}

            <div className="gzp-articles-list">
              {articles.map(art => {
                const st = STATUS_LABELS[art.status] || {};
                return (
                  <div key={art.id} className="gzp-article-card">
                    <div className="gzp-article-status-badge" style={{ background: st.color }}>{st.icon}</div>
                    <div className="gzp-article-info">
                      <div className="gzp-article-title">{art.title}</div>
                      <div className="gzp-article-meta-line">
                        {art.authorName && <span>✎ {art.isAnonymous ? 'Anonimowy' : art.authorName}</span>}
                        {art.sectionName && <span> │ {art.sectionName}</span>}
                        <span className="gzp-article-status-text" style={{ color: st.color }}> │ {st.label}</span>
                      </div>
                    </div>
                    <div className="gzp-article-actions">
                      <button className="gzp-btn-icon" onClick={() => selectArticleForEdit(art)} title="Edytuj"><Edit3 size={14} /></button>
                      {art.status === 'draft' && <button className="gzp-btn-icon" onClick={() => handleArticleStatus(art.id, 'review')} title="Do korekty"><Eye size={14} /></button>}
                      {art.status === 'review' && <button className="gzp-btn-icon" onClick={() => handleArticleStatus(art.id, 'pending_approval')} title="Do akceptacji"><Send size={14} /></button>}
                      {art.status === 'pending_approval' && <button className="gzp-btn-icon gzp-btn-icon--success" onClick={() => handleArticleStatus(art.id, 'approved')} title="Akceptuj"><Check size={14} /></button>}
                      {art.status === 'approved' && <button className="gzp-btn-icon gzp-btn-icon--success" onClick={() => handleArticleStatus(art.id, 'in_issue')} title="Dodaj do numeru"><Newspaper size={14} /></button>}
                      <button className="gzp-btn-icon gzp-btn-icon--danger" onClick={() => handleDeleteArticle(art.id)} title="Usuń"><Trash2 size={14} /></button>
                    </div>
                  </div>
                );
              })}
              {articles.length === 0 && <div className="gzp-empty">Brak artykułów.</div>}
            </div>
          </div>
        )}

        {/* ── ARTICLE EDITOR TAB ── */}
        {activeTab === 'article-edit' && selectedArticle && (
          <div className="gzp-tab-article-edit">
            <div className="gzp-tab-toolbar">
              <h2><Edit3 size={18} /> Edycja: {selectedArticle.title}</h2>
              <button className="gzp-btn" onClick={() => { setActiveTab('articles'); setSelectedArticle(null); }}>
                <ArrowLeft size={16} /> Powrót
              </button>
            </div>

            <div className="gzp-editor-layout">
              <div className="gzp-editor-main">
                <div className="gzp-form-grid">
                  <label>Tytuł<input value={articleForm.title} onChange={e => setArticleForm(p => ({ ...p, title: e.target.value }))} /></label>
                  <label>Nadtytuł<input value={articleForm.supertitle} onChange={e => setArticleForm(p => ({ ...p, supertitle: e.target.value }))} /></label>
                  <label>Podtytuł<input value={articleForm.subtitle} onChange={e => setArticleForm(p => ({ ...p, subtitle: e.target.value }))} /></label>
                  <label>Dział
                    <select value={articleForm.sectionId} onChange={e => {
                      const sec = sections.find(s => s.id === e.target.value);
                      setArticleForm(p => ({ ...p, sectionId: e.target.value, sectionName: sec?.name || '' }));
                    }}>
                      <option value="">— Dział —</option>
                      {sections.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                    </select>
                  </label>
                </div>
                <label>Lead<textarea rows={3} value={articleForm.lead} onChange={e => setArticleForm(p => ({ ...p, lead: e.target.value }))} /></label>
                <label>Treść<textarea rows={15} value={articleForm.content} onChange={e => setArticleForm(p => ({ ...p, content: e.target.value }))} className="gzp-editor-content" /></label>
                <div className="gzp-form-grid">
                  <label>Zdjęcie główne<input value={articleForm.featuredImage} onChange={e => setArticleForm(p => ({ ...p, featuredImage: e.target.value }))} /></label>
                  <label>Cytat<input value={articleForm.featuredQuote} onChange={e => setArticleForm(p => ({ ...p, featuredQuote: e.target.value }))} /></label>
                  <label>Źródła<input value={articleForm.sources} onChange={e => setArticleForm(p => ({ ...p, sources: e.target.value }))} /></label>
                </div>
                <div className="gzp-form-actions">
                  <button className="gzp-btn gzp-btn--primary" onClick={handleSaveArticle}><CheckCircle size={16} /> Zapisz</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── COMPOSE (PAGE LAYOUT) TAB ── */}
        {activeTab === 'compose' && selectedIssue && (
          <div className="gzp-tab-compose">
            <div className="gzp-tab-toolbar">
              <h2><Layout size={18} /> Skład: Nr {selectedIssue.number} — „{selectedIssue.theme || selectedIssue.title || ''}"</h2>
              <div className="gzp-toolbar-right">
                <button className="gzp-btn" onClick={() => navigateToGazetteIssue(selectedIssue.id)}>
                  <Eye size={16} /> Podgląd
                </button>
                <button className="gzp-btn gzp-btn--primary" onClick={() => setShowPageForm(true)}>
                  <Plus size={16} /> Dodaj stronę
                </button>
              </div>
            </div>

            {/* Issue metadata */}
            <div className="gzp-compose-meta">
              <div className="gzp-form-grid">
                <label>Numer<input type="number" value={issueForm.number} onChange={e => setIssueForm(p => ({ ...p, number: parseInt(e.target.value) || 1 }))} /></label>
                <label>Tytuł<input value={issueForm.title} onChange={e => setIssueForm(p => ({ ...p, title: e.target.value }))} /></label>
                <label>Temat<input value={issueForm.theme} onChange={e => setIssueForm(p => ({ ...p, theme: e.target.value }))} /></label>
                <label>Okładka (URL)<input value={issueForm.coverImage} onChange={e => setIssueForm(p => ({ ...p, coverImage: e.target.value }))} /></label>
              </div>
              <button className="gzp-btn gzp-btn--small" onClick={handleUpdateIssue}><CheckCircle size={14} /> Zapisz dane wydania</button>
            </div>

            {/* Page form */}
            {showPageForm && (
              <div className="gzp-form-card">
                <h3><Plus size={16} /> Nowa strona</h3>
                <div className="gzp-form-grid">
                  <label>Szablon
                    <select value={pageForm.template} onChange={e => setPageForm(p => ({ ...p, template: e.target.value }))}>
                      {PAGE_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
                    </select>
                  </label>
                  <label>Artykuł (opcjonalnie)
                    <select value={pageForm.articleId} onChange={e => setPageForm(p => ({ ...p, articleId: e.target.value }))}>
                      <option value="">— Bez artykułu —</option>
                      {articles.filter(a => a.issueId === selectedIssue.id || !a.issueId || a.status === 'approved' || a.status === 'in_issue').map(a => (
                        <option key={a.id} value={a.id}>{a.title}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="gzp-form-actions">
                  <button className="gzp-btn gzp-btn--primary" onClick={handleAddPage}><Plus size={16} /> Dodaj</button>
                  <button className="gzp-btn" onClick={() => setShowPageForm(false)}>Anuluj</button>
                </div>
              </div>
            )}

            {/* Pages visual layout */}
            <div className="gzp-compose-pages">
              {issuePages.map((page, idx) => {
                const art = page.articleId ? articles.find(a => a.id === page.articleId) : null;
                const tmpl = PAGE_TEMPLATES.find(t => t.id === page.template);
                return (
                  <div key={page.id} className="gzp-compose-page-card">
                    <div className="gzp-compose-page-num">{String(page.pageNumber).padStart(2, '0')}</div>
                    <div className="gzp-compose-page-preview">
                      <div className="gzp-compose-page-template">{tmpl?.icon || '📄'} {tmpl?.label || page.template}</div>
                      {art && <div className="gzp-compose-page-article">{art.title}</div>}
                    </div>
                    <div className="gzp-compose-page-actions">
                      <button className="gzp-btn-icon gzp-btn-icon--danger" onClick={() => handleDeletePage(page.id)}><Trash2 size={14} /></button>
                    </div>
                  </div>
                );
              })}
              {issuePages.length === 0 && <div className="gzp-empty">Brak stron. Dodaj pierwszą stronę wydania.</div>}
            </div>

            {/* Publish button */}
            {selectedIssue.status !== 'published' && issuePages.length >= 2 && (
              <div className="gzp-compose-publish">
                <button className="gzp-btn gzp-btn--publish" onClick={() => handlePublishIssue(selectedIssue.id)}>
                  <Star size={18} /> PUBLIKUJ NUMER
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── SUBMISSIONS TAB ── */}
        {activeTab === 'submissions' && (
          <div className="gzp-tab-submissions">
            <h2><Send size={18} /> Zgłoszenia od uczniów</h2>
            <div className="gzp-submissions-list">
              {submissions.map(sub => (
                <div key={sub.id} className={`gzp-submission-card gzp-submission--${sub.status}`}>
                  <div className="gzp-submission-info">
                    <div className="gzp-submission-title">{sub.title || '(Bez tytułu)'}</div>
                    <div className="gzp-submission-meta">{sub.userName} • {sub.type} • {new Date(sub.createdAt).toLocaleDateString('pl-PL')}</div>
                    {sub.content && <div className="gzp-submission-preview">{sub.content.slice(0, 200)}...</div>}
                  </div>
                  <div className="gzp-submission-actions">
                    {sub.status === 'pending' && (
                      <>
                        <button className="gzp-btn-icon gzp-btn-icon--success" onClick={() => handleReviewSubmission(sub.id, 'accepted')} title="Akceptuj"><Check size={14} /></button>
                        <button className="gzp-btn-icon gzp-btn-icon--danger" onClick={() => handleReviewSubmission(sub.id, 'rejected', 'Odrzucone')} title="Odrzuć"><XCircle size={14} /></button>
                      </>
                    )}
                    <span className={`gzp-submission-status gzp-submission-status--${sub.status}`}>
                      {sub.status === 'pending' ? '⏳ Oczekuje' : sub.status === 'accepted' ? '✅ Przyjęte' : '❌ Odrzucone'}
                    </span>
                  </div>
                </div>
              ))}
              {submissions.length === 0 && <div className="gzp-empty">Brak zgłoszeń.</div>}
            </div>
          </div>
        )}

        {/* ── STAFF TAB ── */}
        {activeTab === 'staff' && (
          <div className="gzp-tab-staff">
            <div className="gzp-tab-toolbar">
              <h2><Users size={18} /> Redakcja Żelaznego Pióra</h2>
              <button className="gzp-btn gzp-btn--primary" onClick={() => setShowStaffForm(true)}>
                <Plus size={16} /> Dodaj do redakcji
              </button>
            </div>

            {showStaffForm && (
              <div className="gzp-form-card">
                <h3>Dodaj członka redakcji</h3>
                <div className="gzp-form-grid">
                  <label>Użytkownik
                    <select value={staffForm.userId} onChange={e => setStaffForm(p => ({ ...p, userId: e.target.value }))}>
                      <option value="">— Wybierz —</option>
                      {(users || []).map(u => <option key={u.id} value={u.id}>{u.fullName || u.username} ({u.role})</option>)}
                    </select>
                  </label>
                  <label>Rola w redakcji
                    <select value={staffForm.gazetteRole} onChange={e => setStaffForm(p => ({ ...p, gazetteRole: e.target.value }))}>
                      {Object.entries(GAZETTE_ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </label>
                </div>
                <div className="gzp-form-actions">
                  <button className="gzp-btn gzp-btn--primary" onClick={handleAddStaff}><CheckCircle size={16} /> Dodaj</button>
                  <button className="gzp-btn" onClick={() => setShowStaffForm(false)}>Anuluj</button>
                </div>
              </div>
            )}

            <div className="gzp-staff-list">
              {staff.map(member => (
                <div key={member.id} className="gzp-staff-card">
                  <div className="gzp-staff-avatar">
                    {member.avatar ? <img src={member.avatar} alt="" /> : <Users size={20} />}
                  </div>
                  <div className="gzp-staff-info">
                    <div className="gzp-staff-name">{member.fullName || member.userName}</div>
                    <div className="gzp-staff-role">{GAZETTE_ROLES[member.gazetteRole] || member.gazetteRole}</div>
                  </div>
                  <button className="gzp-btn-icon gzp-btn-icon--danger" onClick={() => handleRemoveStaff(member.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {staff.length === 0 && <div className="gzp-empty">Brak członków redakcji.</div>}
            </div>
          </div>
        )}

        {/* ── SECTIONS TAB ── */}
        {activeTab === 'sections' && (
          <div className="gzp-tab-sections">
            <h2><Layers size={18} /> Działy gazetki</h2>
            <div className="gzp-sections-list">
              {sections.map(sec => (
                <div key={sec.id} className="gzp-section-card">
                  <span className="gzp-section-icon">{sec.icon}</span>
                  <span className="gzp-section-name">{sec.name}</span>
                  <span className="gzp-section-order">#{sec.sortOrder}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
