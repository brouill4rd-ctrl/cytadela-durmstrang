import React, { useState, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import { api } from '../api';
import { NewsEditorModal } from '../components/NewsEditorModal';
import { NewsDetailModal } from '../components/NewsDetailModal';
import { CategoryBanner } from '../components/CategoryBanner';
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
  Sparkles,
  Image as ImageIcon,
  LayoutGrid,
  Palette,
  Sliders,
  Info,
  Copy,
  ExternalLink,
  HelpCircle,
  Maximize2
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
    setActiveSubjectId,
    categoryBanners,
    blockGraphics,
    createCategoryBanner,
    deleteCategoryBanner,
    updateCategoryBanner,
    createBlockGraphic,
    deleteBlockGraphic,
    updateBlockGraphic,
    resetCategoryBanners,
    resetBlockGraphics,
    durmstrangPresets,
    imageDimensionsGuide
  } = useSchool();

  const { playWandSwoosh, playRuneChime } = useSound();

  const [activeTab, setActiveTab] = useState('lessons'); // 'lessons' | 'graphics' | 'overview' | 'news' | 'candidates' | 'admins' | 'points' | 'logs' | 'subjects' | 'system'
  const [graphicsSubTab, setGraphicsSubTab] = useState('banners'); // 'banners' | 'blocks' | 'guide'
  const [selectedCatId, setSelectedCatId] = useState('edykty');
  const [selectedBlockId, setSelectedBlockId] = useState('identity');
  const [customBannerUrlInput, setCustomBannerUrlInput] = useState('');
  const [customBlockUrlInput, setCustomBlockUrlInput] = useState('');

  // Category creation modal
  const [showCreateCatModal, setShowCreateCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatScript, setNewCatScript] = useState('');
  const [newCatColor, setNewCatColor] = useState('#c59f4e');
  const [newCatImage, setNewCatImage] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Block creation modal
  const [showCreateBlockModal, setShowCreateBlockModal] = useState(false);
  const [newBlockTitle, setNewBlockTitle] = useState('');
  const [newBlockLocation, setNewBlockLocation] = useState('Lewy Panel');
  const [newBlockRune, setNewBlockRune] = useState('ᛟ');
  const [newBlockImage, setNewBlockImage] = useState('');
  const [newBlockDesc, setNewBlockDesc] = useState('');

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
          onClick={() => { playWandSwoosh(); setActiveTab('graphics'); }}
          style={{
            padding: '0.65rem 1.2rem',
            background: activeTab === 'graphics' ? 'rgba(236, 72, 153, 0.18)' : 'rgba(236, 72, 153, 0.06)',
            border: activeTab === 'graphics' ? '1px solid #ec4899' : '1px solid rgba(236, 72, 153, 0.25)',
            borderRadius: '4px',
            color: activeTab === 'graphics' ? '#f472b6' : '#cbd5e1',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <ImageIcon size={14} color="#ec4899" />
          <span>Grafiki & Banery</span>
          <span style={{ background: '#ec4899', color: '#090d14', fontSize: '0.65rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '10px' }}>
            MEDIA
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

      {/* =========================================================================
          TAB: 🖼️ GRAFIKI, BANERY & BLOKI BOCZNE
          ========================================================================= */}
      {activeTab === 'graphics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
          {/* Header Banner */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', color: '#ffffff', margin: 0, fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <ImageIcon size={22} color="#ec4899" />
                <span>Zarządzanie Grafikami, Banerami i Blokami</span>
              </h2>
              <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.82rem', color: '#9ca3af' }}>
                Dostosuj nagłówki kategorii, banery edyktów oraz grafiki w lewym i prawym pasku bocznym Cytadeli.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  playRuneChime();
                  const dataToExport = {
                    blockGraphics,
                    categoryBanners
                  };
                  navigator.clipboard.writeText(JSON.stringify(dataToExport, null, 2));
                  showNotification('Skopiowano Konfigurację Grafik', 'Wklej skopiowany tekst (JSON) w rozmowie z asystentem, a zapisze on grafiki na stałe w kodzie projektu!', 'success');
                }}
                className="btn-durmstrang"
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem', gap: '0.4rem', background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25) 0%, rgba(197, 159, 78, 0.25) 100%)', border: '1px solid #38bdf8' }}
                title="Kopiuje ustawione grafiki do schowka, aby asystent mógł je zapisać w plikach projektu"
              >
                <Copy size={13} />
                <span>Kopiuj Konfigurację Grafik (do wklejenia)</span>
              </button>

              <button
                onClick={() => {
                  if (window.confirm('Czy na pewno chcesz przywrócić domyślne banery kategorii i grafiki bloków?')) {
                    resetCategoryBanners();
                    resetBlockGraphics();
                  }
                }}
                className="btn-durmstrang-secondary"
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem', gap: '0.4rem' }}
              >
                <RefreshCw size={13} />
                <span>Przywróć Domyślne</span>
              </button>
            </div>
          </div>

          {/* Sub-tabs for Graphics Module */}
          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.6rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => { playWandSwoosh(); setGraphicsSubTab('banners'); }}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                border: graphicsSubTab === 'banners' ? '1px solid #ec4899' : '1px solid rgba(255, 255, 255, 0.1)',
                background: graphicsSubTab === 'banners' ? 'rgba(236, 72, 153, 0.15)' : 'rgba(0, 0, 0, 0.4)',
                color: graphicsSubTab === 'banners' ? '#f472b6' : '#9ca3af',
                fontFamily: 'var(--font-heading)',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Palette size={14} />
              <span>Bannery Kategorii & Edyktów ({categoryBanners.length})</span>
            </button>

            <button
              onClick={() => { playWandSwoosh(); setGraphicsSubTab('blocks'); }}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                border: graphicsSubTab === 'blocks' ? '1px solid var(--gold-ancient)' : '1px solid rgba(255, 255, 255, 0.1)',
                background: graphicsSubTab === 'blocks' ? 'rgba(197, 159, 78, 0.15)' : 'rgba(0, 0, 0, 0.4)',
                color: graphicsSubTab === 'blocks' ? 'var(--gold-glow)' : '#9ca3af',
                fontFamily: 'var(--font-heading)',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <LayoutGrid size={14} />
              <span>Grafiki Bloków Bocznych ({blockGraphics.length})</span>
            </button>

            <button
              onClick={() => { playWandSwoosh(); setGraphicsSubTab('guide'); }}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                border: graphicsSubTab === 'guide' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                background: graphicsSubTab === 'guide' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(0, 0, 0, 0.4)',
                color: graphicsSubTab === 'guide' ? '#38bdf8' : '#9ca3af',
                fontFamily: 'var(--font-heading)',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Info size={14} />
              <span>Wymiary Zdjęć & Przewodnik</span>
            </button>
          </div>

          {/* SUBTAB 1: BANNERY KATEGORII */}
          {graphicsSubTab === 'banners' && (
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem', alignItems: 'start' }}>
              {/* Category Selector List & Create Button */}
              <div style={{ background: 'rgba(10, 14, 22, 0.85)', border: '1px solid rgba(197, 159, 78, 0.25)', borderRadius: '8px', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--gold-ancient)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Kategorie Edyktów ({categoryBanners.length}):
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCreateCatModal(!showCreateCatModal)}
                  className="btn-durmstrang"
                  style={{ width: '100%', padding: '0.45rem', fontSize: '0.78rem', justifyContent: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}
                >
                  <Plus size={13} />
                  <span>+ Nowa Kategoria Edyktów</span>
                </button>

                {/* Inline Category Creator Box */}
                {showCreateCatModal && (
                  <div style={{ background: 'rgba(14, 18, 28, 0.98)', border: '1px solid #ec4899', borderRadius: '6px', padding: '0.85rem', marginBottom: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.8rem', color: '#f472b6', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                      <span>🪄 Tworzenie Kategorii</span>
                      <button onClick={() => setShowCreateCatModal(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>✕</button>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.68rem', color: '#9ca3af' }}>Nazwa Dziedziny:</label>
                      <input
                        type="text"
                        placeholder="np. Alchemia Bojowa"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        className="gothic-input"
                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.78rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.68rem', color: '#9ca3af' }}>Napis na Banerze:</label>
                      <input
                        type="text"
                        placeholder="np. alchemia bojowa"
                        value={newCatScript}
                        onChange={(e) => setNewCatScript(e.target.value)}
                        className="gothic-input"
                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.78rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.68rem', color: '#9ca3af' }}>URL Tła (Opcjonalnie):</label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={newCatImage}
                        onChange={(e) => setNewCatImage(e.target.value)}
                        className="gothic-input"
                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.78rem' }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!newCatName.trim()) {
                          showNotification('Błąd', 'Wprowadź nazwę nowej kategorii.', 'error');
                          return;
                        }
                        playRuneChime();
                        const created = createCategoryBanner({
                          categoryName: newCatName.trim(),
                          defaultScript: newCatScript.trim() || newCatName.trim().toLowerCase(),
                          themeColor: newCatColor,
                          bgImage: newCatImage.trim(),
                          description: newCatDesc.trim() || `Kategoria: ${newCatName.trim()}`
                        });
                        setSelectedCatId(created.id);
                        setCustomBannerUrlInput(created.bgImage || '');
                        setNewCatName('');
                        setNewCatScript('');
                        setNewCatImage('');
                        setShowCreateCatModal(false);
                      }}
                      className="btn-durmstrang"
                      style={{ width: '100%', padding: '0.4rem', fontSize: '0.75rem', marginTop: '0.2rem' }}
                    >
                      Utwórz Kategorię
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '420px', overflowY: 'auto' }}>
                  {categoryBanners.map(cat => {
                    const isSelected = (selectedCatId || 'edykty') === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          playWandSwoosh();
                          setSelectedCatId(cat.id);
                          setCustomBannerUrlInput(cat.bgImage || cat.imageUrl || '');
                        }}
                        style={{
                          padding: '0.6rem 0.8rem',
                          borderRadius: '5px',
                          border: isSelected ? '1px solid var(--gold-ancient)' : '1px solid rgba(255, 255, 255, 0.05)',
                          background: isSelected ? 'rgba(197, 159, 78, 0.18)' : 'rgba(255, 255, 255, 0.02)',
                          color: isSelected ? '#ffffff' : '#cbd5e1',
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: cat.themeColor || 'var(--gold-ancient)' }} />
                          <span style={{ fontSize: '0.82rem', fontWeight: isSelected ? 700 : 500 }}>{cat.categoryName}</span>
                        </div>
                        {cat.bgImage && (
                          <span style={{ fontSize: '0.62rem', background: '#ec4899', color: '#fff', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 800 }}>
                            FOTO
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category Editor */}
              {(() => {
                const currentCat = categoryBanners.find(c => c.id === (selectedCatId || 'edykty')) || categoryBanners[0];
                return (
                  <div style={{ background: 'rgba(10, 14, 22, 0.85)', border: '1px solid rgba(197, 159, 78, 0.25)', borderRadius: '8px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: 0, fontFamily: 'var(--font-heading)' }}>
                          Edycja Baneru: <span style={{ color: 'var(--gold-glow)' }}>{currentCat.categoryName}</span>
                        </h3>
                        <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: '#9ca3af' }}>
                          ID: <code style={{ color: '#38bdf8' }}>{currentCat.id}</code> • Rekomendowany wymiar tła: <strong style={{ color: 'var(--gold-glow)' }}>1200 x 300 px (4:1)</strong>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Czy na pewno chcesz usunąć kategorię „${currentCat.categoryName}”?`)) {
                            deleteCategoryBanner(currentCat.id);
                            setSelectedCatId(categoryBanners.find(c => c.id !== currentCat.id)?.id || 'edykty');
                          }
                        }}
                        className="btn-durmstrang-secondary"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', color: '#f87171' }}
                        title="Usuń tę kategorię edyktów"
                      >
                        <Trash2 size={13} />
                        <span>Usuń Kategorię</span>
                      </button>
                    </div>

                    {/* Real-time Banner Live Preview Box */}
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
                        Podgląd Baneru na Żywo:
                      </div>
                      <div style={{ border: '1px solid rgba(197, 159, 78, 0.3)', borderRadius: '6px', overflow: 'hidden', boxShadow: '0 8px 25px rgba(0,0,0,0.8)' }}>
                        <CategoryBanner category={currentCat.categoryName} customText={currentCat.defaultScript} height={85} />
                      </div>
                    </div>

                    {/* Image URL Input Form */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <label style={{ fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 600 }}>
                        Adres URL Własnego Tła / Grafiki (JPG, PNG, WebP):
                      </label>
                      <div style={{ display: 'flex', gap: '0.6rem' }}>
                        <input
                          type="url"
                          placeholder="https://images.unsplash.com/... lub /grafiki/twoj-baner.jpg"
                          value={customBannerUrlInput}
                          onChange={(e) => setCustomBannerUrlInput(e.target.value)}
                          className="gothic-input"
                          style={{ flex: 1, padding: '0.55rem 0.8rem', fontSize: '0.85rem' }}
                        />
                        <button
                          onClick={() => {
                            playRuneChime();
                            updateCategoryBanner(currentCat.id, { bgImage: customBannerUrlInput.trim() });
                          }}
                          className="btn-durmstrang"
                          style={{ padding: '0.55rem 1.1rem', fontSize: '0.82rem', gap: '0.4rem' }}
                        >
                          <Check size={14} />
                          <span>Zapisz Grafikę</span>
                        </button>
                        {currentCat.bgImage && (
                          <button
                            onClick={() => {
                              playWandSwoosh();
                              setCustomBannerUrlInput('');
                              updateCategoryBanner(currentCat.id, { bgImage: '' });
                            }}
                            className="btn-durmstrang-secondary"
                            style={{ padding: '0.55rem 0.9rem', fontSize: '0.82rem', color: '#f87171' }}
                            title="Usuń własną grafikę i przywróć domyślny mroczny gradient"
                          >
                            <Trash2 size={14} />
                            <span>Wyczyść</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Curated Presets Gallery */}
                    <div>
                      <div style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Sparkles size={14} color="var(--gold-ancient)" />
                        <span>Szybkie Gotowe Motywy Durmstrang (Kliknij, aby zastosować):</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.65rem' }}>
                        {durmstrangPresets.map((preset, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              playRuneChime();
                              setCustomBannerUrlInput(preset.url);
                              updateCategoryBanner(currentCat.id, { bgImage: preset.url });
                            }}
                            style={{
                              position: 'relative',
                              height: '75px',
                              borderRadius: '6px',
                              overflow: 'hidden',
                              border: currentCat.bgImage === preset.url ? '2px solid var(--gold-glow)' : '1px solid rgba(255,255,255,0.1)',
                              cursor: 'pointer',
                              backgroundImage: `url("${preset.url}")`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              boxShadow: '0 4px 10px rgba(0,0,0,0.6)',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 100%)', display: 'flex', alignItems: 'flex-end', padding: '0.4rem' }}>
                              <span style={{ fontSize: '0.7rem', color: '#ffffff', fontWeight: 700, textShadow: '0 1px 3px black' }}>
                                {preset.name}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Banner Text Customizer */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem' }}>
                      <div>
                        <label style={{ fontSize: '0.74rem', color: '#9ca3af', display: 'block', marginBottom: '0.25rem' }}>
                          Napis Kaligraficzny na Banerze:
                        </label>
                        <input
                          type="text"
                          value={currentCat.defaultScript || ''}
                          onChange={(e) => updateCategoryBanner(currentCat.id, { defaultScript: e.target.value })}
                          className="gothic-input"
                          style={{ padding: '0.45rem 0.65rem', fontSize: '0.82rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.74rem', color: '#9ca3af', display: 'block', marginBottom: '0.25rem' }}>
                          Opis / Podtytuł Katedry:
                        </label>
                        <input
                          type="text"
                          value={currentCat.description || ''}
                          onChange={(e) => updateCategoryBanner(currentCat.id, { description: e.target.value })}
                          className="gothic-input"
                          style={{ padding: '0.45rem 0.65rem', fontSize: '0.82rem' }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* SUBTAB 2: GRAFIKI BLOKÓW BOCZNYCH */}
          {graphicsSubTab === 'blocks' && (
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem', alignItems: 'start' }}>
              {/* Sidebar Block Selector List & Add Block Button */}
              <div style={{ background: 'rgba(10, 14, 22, 0.85)', border: '1px solid rgba(197, 159, 78, 0.25)', borderRadius: '8px', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--gold-ancient)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Wszystkie Bloki ({blockGraphics.length}):
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCreateBlockModal(!showCreateBlockModal)}
                  className="btn-durmstrang"
                  style={{ width: '100%', padding: '0.45rem', fontSize: '0.78rem', justifyContent: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}
                >
                  <Plus size={13} />
                  <span>+ Dodaj Własny Blok</span>
                </button>

                {/* Inline Block Creator Box */}
                {showCreateBlockModal && (
                  <div style={{ background: 'rgba(14, 18, 28, 0.98)', border: '1px solid var(--gold-ancient)', borderRadius: '6px', padding: '0.85rem', marginBottom: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gold-glow)', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                      <span>🛡️ Nowy Blok Portalu</span>
                      <button onClick={() => setShowCreateBlockModal(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>✕</button>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.68rem', color: '#9ca3af' }}>Tytuł Bloku:</label>
                      <input
                        type="text"
                        placeholder="np. Gildia Zielarzy"
                        value={newBlockTitle}
                        onChange={(e) => setNewBlockTitle(e.target.value)}
                        className="gothic-input"
                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.78rem' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px', gap: '0.4rem' }}>
                      <div>
                        <label style={{ fontSize: '0.68rem', color: '#9ca3af' }}>Lokalizacja:</label>
                        <input
                          type="text"
                          placeholder="np. Prawy Panel"
                          value={newBlockLocation}
                          onChange={(e) => setNewBlockLocation(e.target.value)}
                          className="gothic-input"
                          style={{ padding: '0.35rem 0.5rem', fontSize: '0.78rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.68rem', color: '#9ca3af' }}>Runa:</label>
                        <input
                          type="text"
                          value={newBlockRune}
                          onChange={(e) => setNewBlockRune(e.target.value)}
                          className="gothic-input"
                          style={{ padding: '0.35rem 0.5rem', fontSize: '0.88rem', textAlign: 'center', fontFamily: 'serif' }}
                          maxLength={2}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.68rem', color: '#9ca3af' }}>URL Zdjęcia Nagłówka:</label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={newBlockImage}
                        onChange={(e) => setNewBlockImage(e.target.value)}
                        className="gothic-input"
                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.78rem' }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!newBlockTitle.trim()) {
                          showNotification('Błąd', 'Podaj tytuł nowego bloku.', 'error');
                          return;
                        }
                        playRuneChime();
                        const created = createBlockGraphic({
                          title: newBlockTitle.trim(),
                          location: newBlockLocation.trim(),
                          rune: newBlockRune.trim() || 'ᛟ',
                          bgImage: newBlockImage.trim(),
                          description: newBlockDesc.trim() || `Blok ${newBlockTitle.trim()}`
                        });
                        setSelectedBlockId(created.id);
                        setCustomBlockUrlInput(created.bgImage || '');
                        setNewBlockTitle('');
                        setNewBlockImage('');
                        setShowCreateBlockModal(false);
                      }}
                      className="btn-durmstrang"
                      style={{ width: '100%', padding: '0.4rem', fontSize: '0.75rem', marginTop: '0.2rem' }}
                    >
                      Dodaj Blok
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '420px', overflowY: 'auto' }}>
                  {blockGraphics.map(blk => {
                    const isSelected = (selectedBlockId || 'identity') === blk.id;
                    return (
                      <button
                        key={blk.id}
                        onClick={() => {
                          playWandSwoosh();
                          setSelectedBlockId(blk.id);
                          setCustomBlockUrlInput(blk.bgImage || '');
                        }}
                        style={{
                          padding: '0.6rem 0.8rem',
                          borderRadius: '5px',
                          border: isSelected ? '1px solid var(--gold-ancient)' : '1px solid rgba(255, 255, 255, 0.05)',
                          background: isSelected ? 'rgba(197, 159, 78, 0.18)' : 'rgba(255, 255, 255, 0.02)',
                          color: isSelected ? '#ffffff' : '#cbd5e1',
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: isSelected ? 700 : 500 }}>{blk.title}</div>
                          <div style={{ fontSize: '0.68rem', color: '#9ca3af' }}>{blk.location}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          {blk.bgImage && <span style={{ fontSize: '0.55rem', background: '#ec4899', color: '#fff', padding: '0.05rem 0.25rem', borderRadius: '3px' }}>IMG</span>}
                          <span style={{ fontFamily: 'serif', fontSize: '1rem', color: 'var(--gold-ancient)' }}>
                            {blk.rune}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sidebar Block Editor */}
              {(() => {
                const currentBlock = blockGraphics.find(b => b.id === (selectedBlockId || 'identity')) || blockGraphics[0];
                return (
                  <div style={{ background: 'rgba(10, 14, 22, 0.85)', border: '1px solid rgba(197, 159, 78, 0.25)', borderRadius: '8px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: 0, fontFamily: 'var(--font-heading)' }}>
                          Nagłówek Bloku: <span style={{ color: 'var(--gold-glow)' }}>{currentBlock.title}</span>
                        </h3>
                        <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: '#9ca3af' }}>
                          Lokalizacja: <span style={{ color: 'var(--ice-crystal)' }}>{currentBlock.location}</span> • Rekomendowany wymiar: <strong style={{ color: 'var(--gold-glow)' }}>600 x 200 px (3:1, wys. 95px)</strong>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Czy na pewno chcesz usunąć konfigurację bloku „${currentBlock.title}”?`)) {
                            deleteBlockGraphic(currentBlock.id);
                            setSelectedBlockId(blockGraphics.find(b => b.id !== currentBlock.id)?.id || 'identity');
                          }
                        }}
                        className="btn-durmstrang-secondary"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', color: '#f87171' }}
                        title="Usuń ten blok"
                      >
                        <Trash2 size={13} />
                        <span>Usuń Blok</span>
                      </button>
                    </div>

                    {/* Real-time Block Header Live Preview Box */}
                    <div style={{ maxWidth: '320px' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
                        Podgląd Karty Bloku w Pasku Bocznym:
                      </div>
                      <div className="menuBlock" style={{ border: '1px solid var(--gold-ancient)', margin: 0 }}>
                        <div
                          className="menuBlockHeaderImage"
                          style={currentBlock.bgImage ? {
                            backgroundImage: `linear-gradient(rgba(4, 7, 12, 0.4), rgba(4, 7, 12, 0.7)), url("${currentBlock.bgImage}")`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          } : undefined}
                        >
                          <div className="frost-overlay" />
                          <div className="runic-watermark">{currentBlock.rune || 'ᛟ'}</div>
                          <Shield size={36} color="var(--gold-ancient)" style={{ position: 'relative', zIndex: 2, opacity: 0.85 }} />
                        </div>
                        <div className="menuBlockTitle" style={{ color: 'var(--gold-glow)' }}>
                          <span className="rune-bracket">ᛞ</span>
                          <span>{currentBlock.title}</span>
                          <span className="rune-bracket">ᛞ</span>
                        </div>
                      </div>
                    </div>

                    {/* Block Image URL Input */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <label style={{ fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 600 }}>
                        Adres URL Zdjęcia Nagłówka Bloku:
                      </label>
                      <div style={{ display: 'flex', gap: '0.6rem' }}>
                        <input
                          type="url"
                          placeholder="https://images.unsplash.com/... lub /grafiki/blok.jpg"
                          value={customBlockUrlInput}
                          onChange={(e) => setCustomBlockUrlInput(e.target.value)}
                          className="gothic-input"
                          style={{ flex: 1, padding: '0.55rem 0.8rem', fontSize: '0.85rem' }}
                        />
                        <button
                          onClick={() => {
                            playRuneChime();
                            updateBlockGraphic(currentBlock.id, { bgImage: customBlockUrlInput.trim() });
                          }}
                          className="btn-durmstrang"
                          style={{ padding: '0.55rem 1.1rem', fontSize: '0.82rem', gap: '0.4rem' }}
                        >
                          <Check size={14} />
                          <span>Zapisz Grafikę</span>
                        </button>
                        {currentBlock.bgImage && (
                          <button
                            onClick={() => {
                              playWandSwoosh();
                              setCustomBlockUrlInput('');
                              updateBlockGraphic(currentBlock.id, { bgImage: '' });
                            }}
                            className="btn-durmstrang-secondary"
                            style={{ padding: '0.55rem 0.9rem', fontSize: '0.82rem', color: '#f87171' }}
                            title="Usuń własne zdjęcie i przywróć gradient"
                          >
                            <Trash2 size={14} />
                            <span>Wyczyść</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Presets Gallery */}
                    <div>
                      <div style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Sparkles size={14} color="var(--gold-ancient)" />
                        <span>Szybki Wybór Gotowego Motywu:</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.65rem' }}>
                        {durmstrangPresets.map((preset, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              playRuneChime();
                              setCustomBlockUrlInput(preset.url);
                              updateBlockGraphic(currentBlock.id, { bgImage: preset.url });
                            }}
                            style={{
                              position: 'relative',
                              height: '75px',
                              borderRadius: '6px',
                              overflow: 'hidden',
                              border: currentBlock.bgImage === preset.url ? '2px solid var(--gold-glow)' : '1px solid rgba(255,255,255,0.1)',
                              cursor: 'pointer',
                              backgroundImage: `url("${preset.url}")`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              boxShadow: '0 4px 10px rgba(0,0,0,0.6)',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 100%)', display: 'flex', alignItems: 'flex-end', padding: '0.4rem' }}>
                              <span style={{ fontSize: '0.7rem', color: '#ffffff', fontWeight: 700, textShadow: '0 1px 3px black' }}>
                                {preset.name}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Watermark Rune Input */}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem', maxWidth: '280px' }}>
                      <label style={{ fontSize: '0.74rem', color: '#9ca3af', display: 'block', marginBottom: '0.25rem' }}>
                        Symbol Runiczny w Tle (Znak Wodny):
                      </label>
                      <input
                        type="text"
                        value={currentBlock.rune || ''}
                        onChange={(e) => updateBlockGraphic(currentBlock.id, { rune: e.target.value })}
                        className="gothic-input"
                        style={{ padding: '0.45rem 0.65rem', fontSize: '1rem', textAlign: 'center', fontFamily: 'serif' }}
                        maxLength={2}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* SUBTAB 3: PRZEWODNIK WYMIARÓW & FORMATÓW */}
          {graphicsSubTab === 'guide' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ background: 'rgba(10, 14, 22, 0.85)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '8px', padding: '1.25rem' }}>
                <h3 style={{ fontSize: '1.15rem', color: '#38bdf8', margin: '0 0 0.5rem 0', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Info size={18} /> Dokładne Wymiary & Wytyczne Grafik w Portalu Durmstrang
                </h3>
                <p style={{ margin: 0, fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.6 }}>
                  Aby zachować najwyższy mroczny kunszt wizualny, ostrość na ekranach Retina oraz szybkie ładowanie strony, przygotowuj grafiki zgodnie z poniższymi proporcjami. Rekomendujemy formaty <strong>WebP</strong> lub skompresowany <strong>JPG (80-85%)</strong>, a dla herbów i pieczęci <strong>PNG z przezroczystością</strong>.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {imageDimensionsGuide.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'rgba(12, 16, 26, 0.92)',
                      border: '1px solid rgba(197, 159, 78, 0.25)',
                      borderRadius: '8px',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.6)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#ffffff', fontFamily: 'var(--font-heading)' }}>
                        {item.target}
                      </h4>
                      <span style={{ fontSize: '0.7rem', background: 'rgba(197, 159, 78, 0.15)', color: 'var(--gold-glow)', padding: '0.15rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(197, 159, 78, 0.3)', fontWeight: 700 }}>
                        {item.aspectRatio}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: 'rgba(0,0,0,0.4)', padding: '0.75rem', borderRadius: '6px' }}>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#9ca3af', textTransform: 'uppercase' }}>Rekomendowany:</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--gold-ancient)', fontFamily: 'monospace' }}>
                          {item.recommendedSize}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#9ca3af', textTransform: 'uppercase' }}>Minimalny:</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#cbd5e1', fontFamily: 'monospace' }}>
                          {item.minSize}
                        </div>
                      </div>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.5 }}>
                      {item.description}
                    </p>

                    <div style={{ fontSize: '0.72rem', color: '#a4c8e1', display: 'flex', alignItems: 'center', gap: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.5rem' }}>
                      <span>Format pliku:</span>
                      <strong style={{ color: '#ffffff' }}>{item.format}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
