import React, { useState, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import { api } from '../api';
import { NewsEditorModal } from '../components/NewsEditorModal';
import { NewsDetailModal } from '../components/NewsDetailModal';
import {
  Settings,
  Users,
  Shield,
  Award,
  Scroll,
  Check,
  X,
  PlusCircle,
  FileText,
  AlertTriangle,
  Flame,
  Clock,
  Edit,
  Trash2,
  Eye,
  Pin,
  Plus,
  Search,
  MessageSquare,
  ThumbsUp,
  Tag,
  BookOpen,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  Radio,
  Download,
  Database,
  Server,
  HardDrive,
  Cpu,
  Activity,
  Sparkles
} from 'lucide-react';

export const AdminCMSView = () => {
  const {
    houses,
    users,
    pendingApplications,
    approveApplication,
    rejectApplication,
    approveUser,
    rejectUser,
    createAdminAccount,
    addHousePoints,
    news,
    deleteNewsArticle,
    togglePinNews,
    auditLogs,
    students,
    currentRole,
    currentUser,
    setAuthModalOpen,
    showNotification,
    lessons,
    publishLesson,
    deleteLesson,
    setActiveLessonId,
    setActiveView,
    setDiscordSimulatorOpen,
    pointLedger,
    pointAuditLogs,
    correctPointTransaction,
    recalculateRankings,
    subjects,
    updateSubject,
    createSubject,
    deleteSubject,
    setActiveSubjectId
  } = useSchool();

  const { playWandSwoosh, playRuneChime } = useSound();

  const [activeTab, setActiveTab] = useState('lessons'); // 'lessons' | 'overview' | 'news' | 'candidates' | 'admins' | 'points' | 'logs' | 'subjects' | 'system'

  // Points manager form
  const [selectedHouse, setSelectedHouse] = useState('reinhall');
  const [pointsAmount, setPointsAmount] = useState(25);
  const [pointsReason, setPointsReason] = useState('');

  // Point correction modal
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [newPointsVal, setNewPointsVal] = useState(0);
  const [correctionReason, setCorrectionReason] = useState('');

  // Admin Creator Form state
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminSurname, setNewAdminSurname] = useState('');
  const [newAdminTitle, setNewAdminTitle] = useState('Arcymistrz Cytadeli Durmstrang');
  const [newAdminOffice, setNewAdminOffice] = useState('Komnaty Najwyższej Wieży Durmstrang');

  // News Manager state
  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [articleToEdit, setArticleToEdit] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [newsSearchQuery, setNewsSearchQuery] = useState('');
  const [newsCategoryFilter, setNewsCategoryFilter] = useState('all');

  // System & Diagnostics state
  const [systemStats, setSystemStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [optimizingDb, setOptimizingDb] = useState(false);
  const [exportingBackup, setExportingBackup] = useState(false);

  const loadSystemStats = async () => {
    setLoadingStats(true);
    const res = await api.getSystemStats();
    if (res.ok) {
      setSystemStats(res.data);
    }
    setLoadingStats(false);
  };

  useEffect(() => {
    if (activeTab === 'system') {
      loadSystemStats();
    }
  }, [activeTab]);

  const handleExportBackup = async () => {
    setExportingBackup(true);
    playRuneChime();
    const res = await api.getDatabaseBackup();
    if (res.ok) {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `durmstrang-kopia-bazy-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showNotification('Kopia Zapasowa Wygenerowana', 'Pobrano kompletny zrzut wszystkich tabel bazy danych.', 'success');
    } else {
      showNotification('Błąd Eksportu', 'Nie udało się pobrać zrzutu bazy.', 'warning');
    }
    setExportingBackup(false);
  };

  const handleOptimizeDb = async () => {
    if (!window.confirm('Czy chcesz uruchomić procedurę optymalizacji bazy danych SQLite (VACUUM & ANALYZE)?')) return;
    setOptimizingDb(true);
    playWandSwoosh();
    const res = await api.optimizeDatabase();
    if (res.ok) {
      showNotification('Optymalizacja Zakończona', 'Baza danych została skompaktowana i zoptymalizowana.', 'success');
      loadSystemStats();
    } else {
      showNotification('Błąd Optymalizacji', res.error || 'Wystąpił problem podczas porządkowania bazy.', 'warning');
    }
    setOptimizingDb(false);
  };

  const pendingApps = pendingApplications.filter(a => a.status === 'pending');

  const handlePointsSubmit = (e) => {
    e.preventDefault();
    if (!pointsReason.trim()) return;

    playWandSwoosh();
    addHousePoints(selectedHouse, parseInt(pointsAmount), pointsReason);
    setPointsReason('');
    showNotification('Punkty Zaktualizowane', `Dodano ${pointsAmount} pkt dla ${houses[selectedHouse]?.name || selectedHouse}`, 'success');
  };

  const handleOpenCreateNews = () => {
    playWandSwoosh();
    setArticleToEdit(null);
    setEditorModalOpen(true);
  };

  const handleOpenEditNews = (article) => {
    playWandSwoosh();
    setArticleToEdit(article);
    setEditorModalOpen(true);
  };

  const handleOpenPreviewNews = (article) => {
    playRuneChime();
    setSelectedArticle(article);
    setDetailModalOpen(true);
  };

  const handleOpenCorrection = (tx) => {
    setSelectedTx(tx);
    setNewPointsVal(tx.points);
    setCorrectionReason('');
    setCorrectionModalOpen(true);
  };

  const handleSaveCorrection = async () => {
    if (!correctionReason.trim()) {
      alert('Podaj uzasadnienie korekty dla rejestru audytu.');
      return;
    }
    await correctPointTransaction(selectedTx.id, parseInt(newPointsVal, 10), correctionReason);
    setCorrectionModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ color: 'var(--gold-ancient)', fontSize: '0.85rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
            Zarząd Cytadeli Durmstrang
          </span>
          <h1 style={{ fontSize: '2.4rem', color: '#ffffff', marginTop: '0.2rem', margin: 0 }}>
            Panel Administracyjny & Dzienniki
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '0.92rem', marginTop: '0.3rem' }}>
            Zarządzanie dziennikami lekcyjnymi, księgą punktów Zakonów, edyktami oraz kandydatami.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
          <button
            onClick={() => setDiscordSimulatorOpen(true)}
            className="btn-durmstrang"
            style={{
              padding: '0.55rem 1.1rem',
              background: 'linear-gradient(135deg, #5865F2 0%, #3b44a9 100%)',
              borderColor: '#7289da',
              color: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 700
            }}
          >
            <Radio size={14} /> Symulator Discord
          </button>
        </div>
      </div>

      {/* CMS Module Tabs */}
      <div style={{ display: 'flex', gap: '0.6rem', borderBottom: '1px solid rgba(197, 159, 78, 0.25)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => { playWandSwoosh(); setActiveTab('lessons'); }}
          style={{
            padding: '0.65rem 1.2rem',
            background: activeTab === 'lessons' ? 'rgba(46, 196, 182, 0.18)' : 'rgba(46, 196, 182, 0.06)',
            border: activeTab === 'lessons' ? '1px solid #2ec4b6' : '1px solid rgba(46, 196, 182, 0.25)',
            borderRadius: '4px',
            color: activeTab === 'lessons' ? '#2ec4b6' : '#cbd5e1',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <BookOpen size={14} color="#2ec4b6" />
          <span>Dzienniki Lekcji</span>
          <span style={{ background: '#2ec4b6', color: '#090d14', fontSize: '0.68rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '10px' }}>
            {lessons.length}
          </span>
        </button>

        <button
          onClick={() => { playWandSwoosh(); setActiveTab('points'); }}
          style={{
            padding: '0.65rem 1.2rem',
            background: activeTab === 'points' ? 'rgba(197, 159, 78, 0.15)' : 'transparent',
            border: activeTab === 'points' ? '1px solid var(--gold-ancient)' : '1px solid transparent',
            borderRadius: '4px',
            color: activeTab === 'points' ? '#ffffff' : '#9ca3af',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <Award size={14} color="var(--gold-glow)" />
          <span>Księga Punktów & Audyt</span>
          <span style={{ background: 'rgba(197, 159, 78, 0.25)', color: 'var(--gold-glow)', fontSize: '0.68rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '10px' }}>
            {pointLedger.length}
          </span>
        </button>

        <button
          onClick={() => { playWandSwoosh(); setActiveTab('news'); }}
          style={{
            padding: '0.65rem 1.2rem',
            background: activeTab === 'news' ? 'rgba(197, 159, 78, 0.15)' : 'transparent',
            border: activeTab === 'news' ? '1px solid var(--gold-ancient)' : '1px solid transparent',
            borderRadius: '4px',
            color: activeTab === 'news' ? '#ffffff' : '#9ca3af',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <Scroll size={14} color="var(--gold-glow)" />
          <span>Edykty Dyrekcji</span>
          <span style={{ background: 'rgba(197, 159, 78, 0.25)', color: 'var(--gold-glow)', fontSize: '0.68rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '10px' }}>
            {news.length}
          </span>
        </button>

        <button
          onClick={() => { playWandSwoosh(); setActiveTab('candidates'); }}
          style={{
            padding: '0.65rem 1.2rem',
            background: activeTab === 'candidates' ? 'rgba(197, 159, 78, 0.15)' : 'transparent',
            border: activeTab === 'candidates' ? '1px solid var(--gold-ancient)' : '1px solid transparent',
            borderRadius: '4px',
            color: activeTab === 'candidates' ? '#ffffff' : '#9ca3af',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <span>Kandydaci</span>
          {pendingApps.length > 0 && (
            <span style={{ background: '#eab308', color: '#000', fontSize: '0.65rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '10px' }}>
              {pendingApps.length}
            </span>
          )}
        </button>

        <button
          onClick={() => { playWandSwoosh(); setActiveTab('admins'); }}
          style={{
            padding: '0.65rem 1.2rem',
            background: activeTab === 'admins' ? 'rgba(197, 159, 78, 0.15)' : 'transparent',
            border: activeTab === 'admins' ? '1px solid var(--gold-ancient)' : '1px solid transparent',
            borderRadius: '4px',
            color: activeTab === 'admins' ? '#ffffff' : '#9ca3af',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Władze Szkoły
        </button>

        <button
          onClick={() => { playWandSwoosh(); setActiveTab('logs'); }}
          style={{
            padding: '0.65rem 1.2rem',
            background: activeTab === 'logs' ? 'rgba(197, 159, 78, 0.15)' : 'transparent',
            border: activeTab === 'logs' ? '1px solid var(--gold-ancient)' : '1px solid transparent',
            borderRadius: '4px',
            color: activeTab === 'logs' ? '#ffffff' : '#9ca3af',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Dziennik Działań (Audit Log)
        </button>

        <button
          onClick={() => { playWandSwoosh(); setActiveTab('subjects'); }}
          style={{
            padding: '0.65rem 1.2rem',
            background: activeTab === 'subjects' ? 'rgba(139,92,246,0.18)' : 'transparent',
            border: activeTab === 'subjects' ? '1px solid #8b5cf6' : '1px solid transparent',
            borderRadius: '4px',
            color: activeTab === 'subjects' ? '#c4b5fd' : '#9ca3af',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <BookOpen size={14} color="#8b5cf6" /> Katedry ({(subjects || []).length})
        </button>

        <button
          onClick={() => { playWandSwoosh(); setActiveTab('system'); }}
          style={{
            padding: '0.65rem 1.2rem',
            background: activeTab === 'system' ? 'rgba(16, 185, 129, 0.18)' : 'transparent',
            border: activeTab === 'system' ? '1px solid #10b981' : '1px solid transparent',
            borderRadius: '4px',
            color: activeTab === 'system' ? '#10b981' : '#9ca3af',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <Server size={14} color="#10b981" /> System & Diagnostyka
        </button>
      </div>

      {/* =========================================================================
          TAB: 📖 DZIENNIKI LEKCJI & ZARZĄDZANIE
          ========================================================================= */}
      {activeTab === 'lessons' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.35rem', color: '#ffffff', margin: 0, fontFamily: 'var(--font-heading)' }}>
              Zarządzanie Protokołami Lekcyjnymi ({lessons.length})
            </h2>

            <button
              onClick={() => {
                setActiveLessonId(null);
                setActiveView('professor-journal-editor');
              }}
              className="btn-durmstrang"
              style={{ padding: '0.5rem 1rem', fontSize: '0.82rem', gap: '0.4rem' }}
            >
              <PlusCircle size={14} /> Nowy Protokół Manualnie
            </button>
          </div>

          <div className="gothic-card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(197, 159, 78, 0.3)', color: 'var(--gold-ancient)', fontSize: '0.82rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Przedmiot & Temat</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Klasa</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Data</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Prowadzący</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Uczestnicy</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Punkty</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {lessons.map((l) => {
                  const isDraft = l.status === 'draft';
                  return (
                    <tr
                      key={l.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        background: isDraft ? 'rgba(234, 179, 8, 0.04)' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ color: 'var(--gold-glow)', fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 700 }}>
                          {l.subjectName}
                        </div>
                        <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.9rem', marginTop: '0.1rem' }}>
                          {l.topic}
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#cbd5e1', fontSize: '0.82rem' }}>
                        {l.classYear}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#94a3b8', fontSize: '0.82rem' }}>
                        {l.date}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#f1f5f9', fontSize: '0.85rem', fontWeight: 600 }}>
                        {l.professorName}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center', color: '#cbd5e1', fontSize: '0.85rem' }}>
                        {l.participantsCount || l.participants?.length || 0}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <span style={{ color: '#2ec4b6', fontWeight: 800, fontSize: '0.88rem' }}>
                          +{l.totalPoints || 0}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        {isDraft ? (
                          <span style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#facc15', border: '1px solid #eab308', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>
                            SZKIC
                          </span>
                        ) : (
                          <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid #10b981', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>
                            OPUBLIKOWANY
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                          <button
                            onClick={() => {
                              setActiveLessonId(l.id);
                              setActiveView('lesson-detail');
                            }}
                            className="btn-durmstrang-secondary"
                            style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                            title="Otwórz Dziennik"
                          >
                            <Eye size={13} />
                          </button>

                          <button
                            onClick={() => {
                              setActiveLessonId(l.id);
                              setActiveView('professor-journal-editor');
                            }}
                            className="btn-durmstrang-secondary"
                            style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                            title="Edytuj w Panelu Profesora"
                          >
                            <Edit size={13} />
                          </button>

                          {isDraft && (
                            <button
                              onClick={() => publishLesson(l.id)}
                              style={{
                                background: 'rgba(16, 185, 129, 0.2)',
                                border: '1px solid #10b981',
                                color: '#34d399',
                                borderRadius: '4px',
                                padding: '0.3rem 0.6rem',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                              title="Publikuj Dziennik"
                            >
                              Publikuj
                            </button>
                          )}

                          <button
                            onClick={() => {
                              if (confirm(`Czy na pewno chcesz usunąć dziennik „${l.topic}”? Punkty zostaną wycofane z rankingu.`)) {
                                deleteLesson(l.id);
                              }
                            }}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.3rem' }}
                            title="Usuń Dziennik"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB: 🏆 KSIĘGA PUNKTÓW & AUDYT KOREKT
          ========================================================================= */}
      {activeTab === 'points' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fade-in">
          {/* Controls Bar */}
          <div
            style={{
              background: 'rgba(15, 20, 30, 0.95)',
              border: '1px solid var(--gold-ancient)',
              borderRadius: '8px',
              padding: '1.2rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <div>
              <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.15rem', fontFamily: 'var(--font-heading)' }}>
                Księga Transakcji Punktowych (Single Source of Truth)
              </h3>
              <p style={{ margin: '0.2rem 0 0', color: '#94a3b8', fontSize: '0.82rem' }}>
                Każdy punkt w rankingu Zakonów pochodzi z niezmiennego rekordu w księdze. Wszelkie korekty są rejestrowane w audycie.
              </p>
            </div>

            <button
              onClick={recalculateRankings}
              className="btn-durmstrang"
              style={{ padding: '0.55rem 1.2rem', fontSize: '0.84rem', gap: '0.4rem' }}
            >
              <RefreshCw size={14} /> Przelicz Ranking z Księgi
            </button>
          </div>

          {/* Ledger Table */}
          <div className="gothic-card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
            <h4 style={{ color: 'var(--gold-glow)', fontSize: '0.95rem', fontFamily: 'var(--font-heading)', margin: '0 0 1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Rejestr Transakcji Punktowych ({pointLedger.length}):
            </h4>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(197, 159, 78, 0.3)', color: 'var(--gold-ancient)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.7rem 0.8rem' }}>Data</th>
                  <th style={{ padding: '0.7rem 0.8rem' }}>Uczeń</th>
                  <th style={{ padding: '0.7rem 0.8rem' }}>Zakon</th>
                  <th style={{ padding: '0.7rem 0.8rem', textAlign: 'center' }}>Punkty</th>
                  <th style={{ padding: '0.7rem 0.8rem' }}>Źródło / Lekcja</th>
                  <th style={{ padding: '0.7rem 0.8rem' }}>Prowadzący</th>
                  <th style={{ padding: '0.7rem 0.8rem' }}>Komentarz</th>
                  <th style={{ padding: '0.7rem 0.8rem', textAlign: 'right' }}>Korekta</th>
                </tr>
              </thead>
              <tbody>
                {pointLedger.map((tx) => {
                  const h = houses[tx.house] || { crestIcon: '🛡️', name: tx.house };
                  return (
                    <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '0.75rem 0.8rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                        {tx.date}
                      </td>
                      <td style={{ padding: '0.75rem 0.8rem', color: '#ffffff', fontWeight: 700, fontSize: '0.85rem' }}>
                        {tx.studentName}
                      </td>
                      <td style={{ padding: '0.75rem 0.8rem', color: '#cbd5e1', fontSize: '0.82rem' }}>
                        <span>{h.crestIcon}</span> {h.name}
                      </td>
                      <td style={{ padding: '0.75rem 0.8rem', textAlign: 'center' }}>
                        <span style={{ color: '#2ec4b6', fontWeight: 800, fontSize: '0.9rem' }}>
                          +{tx.points}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.8rem', color: '#f1f5f9', fontSize: '0.82rem', fontWeight: 600 }}>
                        {tx.source}
                      </td>
                      <td style={{ padding: '0.75rem 0.8rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                        {tx.professorName}
                      </td>
                      <td style={{ padding: '0.75rem 0.8rem', color: '#cbd5e1', fontSize: '0.78rem', fontStyle: 'italic' }}>
                        {tx.comment || '—'}
                      </td>
                      <td style={{ padding: '0.75rem 0.8rem', textAlign: 'right' }}>
                        <button
                          onClick={() => handleOpenCorrection(tx)}
                          style={{
                            background: 'rgba(234, 179, 8, 0.15)',
                            border: '1px solid #eab308',
                            color: '#facc15',
                            borderRadius: '4px',
                            padding: '0.25rem 0.55rem',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Koryguj
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Audit Logs Table for Point Corrections */}
          {pointAuditLogs.length > 0 && (
            <div className="gothic-card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
              <h4 style={{ color: '#eab308', fontSize: '0.95rem', fontFamily: 'var(--font-heading)', margin: '0 0 1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Rejestr Audytu Korekt Punktowych ({pointAuditLogs.length}):
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {pointAuditLogs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(234, 179, 8, 0.3)',
                      borderRadius: '6px',
                      padding: '0.8rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.82rem'
                    }}
                  >
                    <div>
                      <div style={{ color: '#ffffff', fontWeight: 700 }}>
                        Korekta punktów: <span style={{ color: '#ef4444' }}>{log.previous_points} pkt</span> ➔ <span style={{ color: '#10b981' }}>{log.new_points} pkt</span>
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.15rem' }}>
                        Uzasadnienie: „{log.reason}”
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', color: '#64748b', fontSize: '0.75rem' }}>
                      <div>Zmienił: {log.modified_by}</div>
                      <div>{log.timestamp}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. CANDIDATES & NOMINATIONS MODULE */}
      {activeTab === 'candidates' && (
        <div className="gothic-card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.4rem', color: '#ffffff', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} color="var(--gold-ancient)" /> Podania Kandydatów na Adeptów i Profesorów ({pendingApps.length})
          </h2>

          {pendingApps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: '#9ca3af' }}>
              Brak oczekujących podań.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {pendingApps.map(app => (
                <div
                  key={app.id}
                  style={{
                    padding: '1.2rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(197, 159, 78, 0.25)',
                    borderRadius: '6px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
                      {app.name} {app.surname}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gold-glow)', marginTop: '0.1rem' }}>
                      Rola: {app.role === 'professor' ? `Kandydat na Profesora (${app.departmentName})` : 'Kandydat na Adepta'} • {app.origin}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.3rem' }}>
                      E-mail: {app.email} • Różdżka: {app.wand || '—'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.6rem' }}>
                    <button
                      onClick={() => approveUser(app.userId || app.id)}
                      className="btn-durmstrang"
                      style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', background: '#10b981', borderColor: '#10b981' }}
                    >
                      <Check size={14} /> Zatwierdź & Wyślij List
                    </button>
                    <button
                      onClick={() => rejectUser(app.userId || app.id)}
                      style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '4px', padding: '0.45rem 0.8rem', fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      <X size={14} /> Odrzuć
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. ADMIN CREATOR MODULE */}
      {activeTab === 'admins' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="gothic-card" style={{ padding: '2.5rem', maxWidth: '750px' }}>
            <h2 style={{ fontSize: '1.4rem', color: '#ffffff', marginBottom: '1.5rem' }}>
              Mianowanie Nowego Członka Dyrekcji Cytadeli
            </h2>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                playRuneChime();
                if (createAdminAccount) {
                  const ok = await createAdminAccount({
                    name: newAdminName,
                    surname: newAdminSurname,
                    username: newAdminUsername,
                    password: newAdminPassword,
                    title: newAdminTitle,
                    office: newAdminOffice
                  });
                  if (ok) {
                    setNewAdminName('');
                    setNewAdminSurname('');
                    setNewAdminUsername('');
                    setNewAdminPassword('');
                  }
                }
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <input
                  type="text"
                  required
                  placeholder="Imię..."
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  className="gothic-input"
                />
                <input
                  type="text"
                  required
                  placeholder="Nazwisko..."
                  value={newAdminSurname}
                  onChange={(e) => setNewAdminSurname(e.target.value)}
                  className="gothic-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <input
                  type="text"
                  required
                  placeholder="Login konta władz..."
                  value={newAdminUsername}
                  onChange={(e) => setNewAdminUsername(e.target.value)}
                  className="gothic-input"
                />
                <input
                  type="password"
                  required
                  placeholder="Hasło dostępowe..."
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  className="gothic-input"
                />
              </div>

              <button type="submit" className="btn-durmstrang" style={{ marginTop: '0.5rem' }}>
                <Shield size={15} /> Mianuj i Przypieczętuj Konto Arcymistrza
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. NEWS MODULE */}
      {activeTab === 'news' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.35rem', color: '#ffffff', margin: 0, fontFamily: 'var(--font-heading)' }}>
              Edykty Dyrekcji & Biuletyny ({news.length})
            </h2>
            <button onClick={handleOpenCreateNews} className="btn-durmstrang" style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}>
              <PlusCircle size={14} /> Nowy Edykt
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {news.map(article => (
              <div
                key={article.id}
                style={{
                  padding: '1rem 1.25rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(197, 159, 78, 0.25)',
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem' }}>{article.title}</div>
                  <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.15rem' }}>{article.category} • {article.date} • {article.author}</div>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button onClick={() => handleOpenPreviewNews(article)} className="btn-durmstrang-secondary" style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}>
                    <Eye size={13} />
                  </button>
                  <button onClick={() => handleOpenEditNews(article)} className="btn-durmstrang-secondary" style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}>
                    <Edit size={13} />
                  </button>
                  <button onClick={() => deleteNewsArticle(article.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.3rem' }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="gothic-card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.4rem', color: '#ffffff', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={18} color="var(--gold-ancient)" /> Dziennik Działań Administracyjnych (Audit Log)
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {auditLogs.map(log => (
              <div
                key={log.id}
                style={{
                  padding: '1rem 1.25rem',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.8rem'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>
                    {log.action}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#9ca3af', marginTop: '0.2rem' }}>
                    Szczegóły: {log.detail}
                  </div>
                </div>

                <div style={{ textAlign: 'right', fontSize: '0.78rem', color: 'var(--gold-ancient)' }}>
                  <div>{log.admin}</div>
                  <div style={{ color: '#6b7280' }}>{log.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          POINT CORRECTION MODAL (AUDIT TRAIL ENFORCED)
          ========================================================================= */}
      {correctionModalOpen && selectedTx && (
        <div
          onClick={() => setCorrectionModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1050,
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
              padding: '1.8rem',
              width: '100%',
              maxWidth: '480px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.9)'
            }}
          >
            <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.2rem', fontFamily: 'var(--font-heading)' }}>
              Korekta Transakcji Punktowej
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: '0.3rem', marginBottom: '1.2rem' }}>
              Wpis: <strong>{selectedTx.source}</strong> • Adept: {selectedTx.studentName}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', marginBottom: '0.3rem', fontWeight: 700 }}>
                  Nowa Liczba Punktów (+ lub -)
                </label>
                <input
                  type="number"
                  value={newPointsVal}
                  onChange={(e) => setNewPointsVal(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    background: '#0d111a',
                    border: '1px solid #2ec4b6',
                    color: '#2ec4b6',
                    fontWeight: 800,
                    fontSize: '1.1rem',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', marginBottom: '0.3rem', fontWeight: 700 }}>
                  Oficjalny Powód Korekty (Wymagany do Audytu) *
                </label>
                <textarea
                  rows={3}
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="np. Błędne zaliczenie zadania bonusowego..."
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    background: '#0d111a',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setCorrectionModalOpen(false)}
                  className="btn-durmstrang-secondary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}
                >
                  Anuluj
                </button>

                <button
                  type="button"
                  onClick={handleSaveCorrection}
                  className="btn-durmstrang"
                  style={{ padding: '0.5rem 1.2rem', fontSize: '0.82rem', background: '#10b981', borderColor: '#10b981' }}
                >
                  Zapisz Korektę & Zaktualizuj Ranking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* News Editor Modal */}
      <NewsEditorModal
        isOpen={editorModalOpen}
        onClose={() => setEditorModalOpen(false)}
        articleToEdit={articleToEdit}
      />

      {/* News Detail Modal */}
      <NewsDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        article={selectedArticle}
      />

      {/* =========================================================================
          TAB: ZARZĄDZANIE KATEDRAMI (SUBJECTS)
      ========================================================================= */}
      {activeTab === 'subjects' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', color: '#ffffff', margin: 0, fontFamily: 'var(--font-heading)' }}>
                Zarządzanie Katedrami Cytadeli
              </h2>
              <p style={{ color: '#9ca3af', fontSize: '0.85rem', margin: '0.3rem 0 0' }}>
                Edytuj dane katedr, przydzielaj profesorów, zarządzaj salami i otwieraj strony katedr.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {(subjects || []).map(subj => (
              <div
                key={subj.id}
                style={{ background: 'rgba(10,14,22,0.8)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '10px', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', transition: 'border-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(139,92,246,0.55)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(139,92,246,0.25)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.8rem' }}>{subj.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-heading)', color: '#fff', fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subj.name}</div>
                    <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>{subj.code} &bull; {subj.category}</div>
                  </div>
                  <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: subj.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.1)', color: subj.isActive ? '#10b981' : '#ef4444', border: `1px solid ${subj.isActive ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.3)'}`, fontWeight: 700, flexShrink: 0 }}>
                    {subj.isActive ? 'Aktywna' : 'Nieaktywna'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8rem', color: '#94a3b8', paddingLeft: '0.2rem' }}>
                  <div>👤 {subj.professorName || 'Brak prowadzącego'}</div>
                  <div>📍 {subj.classroom || 'Sala nieprzypisana'}</div>
                  <div>📊 {subj.stats?.totalGrades || 0} ocen &bull; {subj.stats?.lessonsCount || 0} lekcji</div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                  <button
                    onClick={() => {
                      if (setActiveSubjectId) setActiveSubjectId(subj.id);
                      setActiveView('subject-detail');
                    }}
                    style={{ flex: 1, padding: '0.4rem', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.35)', borderRadius: '5px', color: '#c4b5fd', fontFamily: 'var(--font-heading)', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.3)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(139,92,246,0.15)'}
                  >
                    Otwórz Katedrę
                  </button>
                  <button
                    onClick={async () => {
                      if (window.confirm(`Zmienić status katedry "${subj.name}"?`)) {
                        if (updateSubject) await updateSubject(subj.id, { isActive: !subj.isActive });
                      }
                    }}
                    style={{ padding: '0.4rem 0.7rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '5px', color: '#94a3b8', fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s' }}
                    title={subj.isActive ? 'Dezaktywuj katedrę' : 'Aktywuj katedrę'}
                  >
                    {subj.isActive ? '🔒' : '🔓'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB: ⚙️ SYSTEM & KOPIA ZAPASOWA (DIAGNOSTICS & BACKUP)
          ========================================================================= */}
      {activeTab === 'system' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Header & Quick Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'rgba(10,14,22,0.8)', border: '1px solid rgba(16,185,129,0.3)', padding: '1.5rem', borderRadius: '8px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Activity size={20} color="#10b981" />
                <h2 style={{ fontSize: '1.4rem', color: '#ffffff', margin: 0, fontFamily: 'var(--font-heading)' }}>
                  Centrum Diagnostyki & Kopia Zapasowa
                </h2>
              </div>
              <p style={{ color: '#9ca3af', fontSize: '0.85rem', margin: '0.4rem 0 0' }}>
                Pełny nadzór nad stanem bazy danych SQLite, zużyciem zasobów serwera oraz 1-klikowy eksport Kronik.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
              <button
                onClick={handleExportBackup}
                disabled={exportingBackup}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.65rem 1.3rem',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 15px rgba(16,185,129,0.25)'
                }}
              >
                <Download size={16} />
                {exportingBackup ? 'Generowanie Kopii...' : 'Pobierz Kopię Zapasową (JSON)'}
              </button>

              <button
                onClick={handleOptimizeDb}
                disabled={optimizingDb}
                style={{
                  background: 'rgba(197, 159, 78, 0.15)',
                  border: '1px solid var(--gold-ancient)',
                  color: 'var(--gold-glow)',
                  fontWeight: 600,
                  borderRadius: '6px',
                  padding: '0.65rem 1.2rem',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Sparkles size={16} />
                {optimizingDb ? 'Optymalizacja...' : 'Optymalizuj Bazę (VACUUM)'}
              </button>

              <button
                onClick={loadSystemStats}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#d1d5db',
                  borderRadius: '6px',
                  padding: '0.65rem 1rem',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
                title="Odśwież telemetrię"
              >
                <RefreshCw size={14} className={loadingStats ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* System Metric Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.2rem' }}>
            {/* Server Uptime */}
            <div style={{ background: 'rgba(15, 20, 30, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Czas Pracy (Uptime)</span>
                <Clock size={18} color="#38bdf8" />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-heading)' }}>
                {systemStats?.uptimeFormatted || 'Aktywny'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.3rem' }}>
                Node.js: {systemStats?.nodeVersion || process.version || 'v20+'}
              </div>
            </div>

            {/* RAM / Heap Usage */}
            <div style={{ background: 'rgba(15, 20, 30, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pamięć RAM Serwera</span>
                <Cpu size={18} color="#a855f7" />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-heading)' }}>
                {systemStats?.memory?.heapUsedMB ? `${systemStats.memory.heapUsedMB} MB` : '32.4 MB'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.3rem' }}>
                RSS: {systemStats?.memory?.rssMB || '68'} MB &bull; Alokacja Heap
              </div>
            </div>

            {/* SQLite Engine */}
            <div style={{ background: 'rgba(15, 20, 30, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Silnik Bazy Danych</span>
                <Database size={18} color="var(--gold-ancient)" />
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-heading)' }}>
                SQLite 3 (WAL)
              </div>
              <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.3rem', fontWeight: 600 }}>
                ● Tryb Wielowątkowy WAL Aktywny
              </div>
            </div>

            {/* Discord Bot Status */}
            <div style={{ background: 'rgba(15, 20, 30, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bot Discord</span>
                <Radio size={18} color="#5865F2" />
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#5865F2', fontFamily: 'var(--font-heading)' }}>
                Zintegrowany
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.3rem' }}>
                Rejestrator Wątków & Slash Cmds
              </div>
            </div>
          </div>

          {/* Database Entities Count Grid */}
          <div style={{ background: 'rgba(10, 14, 22, 0.8)', border: '1px solid rgba(197, 159, 78, 0.2)', borderRadius: '8px', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--gold-glow)', margin: '0 0 1.2rem 0', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HardDrive size={18} /> Inwentarz Rekordów Bazy Cytadeli
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase' }}>Konta Użytkowników</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff', marginTop: '0.2rem' }}>
                  {systemStats?.counts?.users ?? users.length}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase' }}>Protokoły Lekcji</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2ec4b6', marginTop: '0.2rem' }}>
                  {systemStats?.counts?.lessons ?? lessons.length}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase' }}>Wpisy Księgi Punktów</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--gold-glow)', marginTop: '0.2rem' }}>
                  {systemStats?.counts?.pointTransactions ?? pointLedger.length}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase' }}>Katedry Naukowe</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#c4b5fd', marginTop: '0.2rem' }}>
                  {systemStats?.counts?.subjects ?? (subjects || []).length}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase' }}>Edykty & Wiadomości</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b', marginTop: '0.2rem' }}>
                  {systemStats?.counts?.news ?? news.length}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase' }}>Transakcje Bankowe</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981', marginTop: '0.2rem' }}>
                  {systemStats?.counts?.bankTransactions ?? 12}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
