import React, { useState, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import { api } from '../api';
import { NewsEditorModal } from '../components/NewsEditorModal';
import { NewsDetailModal } from '../components/NewsDetailModal';
import { CategoryBanner } from '../components/CategoryBanner';
import { DatabaseExplorerPanel } from '../components/DatabaseExplorerPanel';
import { MemoryArchiveWizardTab } from './memory/MemoryArchiveWizardTab';
import { AdminWorldDirector } from '../components/AdminWorldDirector';
import { PrologueAdminPanel } from '../components/PrologueAdminPanel';
import { HOUSE_RUNIC_DATA, HOUSE_CREST_IMAGES } from '../components/HeraldicEmblems';
import { cleanPersonName } from '../context/schoolUtils';
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
  Maximize2,
  ShoppingBag,
  Store,
  Coins,
  Upload,
  Wand2,
  Crown,
  UserCheck,
  ShieldCheck,
  User
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
    staffRanking,
    fortressGuardian,
    updateFortressGuardian,
    updateHouseLeaders,
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
    imageDimensionsGuide,
    storeItems,
    shops,
    createStoreItem,
    updateStoreItem,
    deleteStoreItem,
    resetStoreItems
  } = useSchool();

  const { playWandSwoosh, playRuneChime, playCoinSound } = useSound();

  const [activeTab, setActiveTab] = useState('lessons'); // 'lessons' | 'store' | 'guardians' | 'graphics' | 'overview' | 'news' | 'candidates' | 'admins' | 'points' | 'logs' | 'subjects' | 'system'
  const [graphicsSubTab, setGraphicsSubTab] = useState('banners'); // 'banners' | 'blocks' | 'guide'
  const [selectedCatId, setSelectedCatId] = useState('edykty');
  const [selectedBlockId, setSelectedBlockId] = useState('identity');
  const [customBannerUrlInput, setCustomBannerUrlInput] = useState('');
  const [customBlockUrlInput, setCustomBlockUrlInput] = useState('');

  // ==================== STRAŻNICY & OPIEKUNOWIE CMS STATE ====================
  const [fgFormName, setFgFormName] = useState(fortressGuardian?.name || 'Valdemar Krag-Hansen');
  const [fgFormHouse, setFgFormHouse] = useState(fortressGuardian?.house || 'ravnheim');
  const [fgFormTitle, setFgFormTitle] = useState(fortressGuardian?.title || 'Strażnik Twierdzy Durmstrang');
  const [fgFormNote, setFgFormNote] = useState(fortressGuardian?.note || 'Wybrany jednogłośnie przez Radę Mistrzów Cytadeli.');
  const [fgSelectedStudentId, setFgSelectedStudentId] = useState('');

  const [housesEditState, setHousesEditState] = useState({
    reinhall: { headOfHouse: '', prefect: '' },
    bjornhall: { headOfHouse: '', prefect: '' },
    ravnheim: { headOfHouse: '', prefect: '' },
    otergard: { headOfHouse: '', prefect: '' }
  });

  useEffect(() => {
    if (fortressGuardian) {
      setFgFormName(cleanPersonName(fortressGuardian.name || ''));
      setFgFormHouse(fortressGuardian.house || 'ravnheim');
      setFgFormTitle(fortressGuardian.title || 'Strażnik Twierdzy Durmstrang');
      setFgFormNote(fortressGuardian.note || '');
    }
  }, [fortressGuardian]);

  useEffect(() => {
    if (houses) {
      setHousesEditState({
        reinhall: {
          headOfHouse: cleanPersonName(houses.reinhall?.headOfHouse || 'Sigrid Hällström'),
          prefect: cleanPersonName(houses.reinhall?.prefect || 'Magnus Blom')
        },
        bjornhall: {
          headOfHouse: cleanPersonName(houses.bjornhall?.headOfHouse || 'Gunnar Vargson'),
          prefect: cleanPersonName(houses.bjornhall?.prefect || 'Astrid Vargadottir')
        },
        ravnheim: {
          headOfHouse: cleanPersonName(houses.ravnheim?.headOfHouse || 'Morana Vane'),
          prefect: cleanPersonName(houses.ravnheim?.prefect || 'Valdemar Krag-Hansen')
        },
        otergard: {
          headOfHouse: cleanPersonName(houses.otergard?.headOfHouse || 'Klaus Lindqvist'),
          prefect: cleanPersonName(houses.otergard?.prefect || 'Sigrun Lindqvist')
        }
      });
    }
  }, [houses]);

  // ==================== STORE & MARKET CMS STATE ====================
  const [storeSearchQuery, setStoreSearchQuery] = useState('');
  const [storeSelectedShop, setStoreSelectedShop] = useState('all');
  const [storeSelectedCat, setStoreSelectedCat] = useState('all');
  const [storeSelectedRarity, setStoreSelectedRarity] = useState('all');
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Store Item Form State
  const [formName, setFormName] = useState('');
  const [formShopId, setFormShopId] = useState('wands-brokkur');
  const [formCategorySlug, setFormCategorySlug] = useState('wands');
  const [formPrice, setFormPrice] = useState(150);
  const [formIcon, setFormIcon] = useState('🪄');
  const [formHouseExclusive, setFormHouseExclusive] = useState('');
  const [formRarity, setFormRarity] = useState('Zwykły');
  const [formPlaceholderType, setFormPlaceholderType] = useState('wand_dark');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formLore, setFormLore] = useState('');

  // Quick Image Modal State
  const [quickImageModalOpen, setQuickImageModalOpen] = useState(false);
  const [quickImageTargetItem, setQuickImageTargetItem] = useState(null);
  const [quickImageUrlInput, setQuickImageUrlInput] = useState('');

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

  const [importingBackup, setImportingBackup] = useState(false);

  const handleImportBackupFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const backupJson = JSON.parse(event.target.result);
        if (!backupJson || !backupJson.database) {
          showNotification('Błąd Pliku', 'Wybrany plik nie zawiera poprawnej struktury bazy danych Cytadeli.', 'error');
          return;
        }

        if (!window.confirm(`⚠️ OSTRZEŻENIE: Czy na pewno chcesz NADPISAĆ całą bazę danych SQLite danymi z kopii zapasowej (${backupJson.system || 'Durmstrang'}) wyeksportowanej: ${backupJson.exportedAt || 'nieznany termin'} przez: ${backupJson.exportedBy || 'Admin'}? Wszystkie tabele zostaną zsynchronizowane.`)) {
          return;
        }

        setImportingBackup(true);
        const res = await api.importDatabaseBackup(backupJson);
        if (res.ok) {
          showNotification('Baza Przywrócona!', 'Pomyślnie i bezstratnie przywrócono stan bazy SQLite z pliku JSON! Trwa przeładowanie...', 'success');
          setTimeout(() => {
            window.location.reload();
          }, 1200);
        } else {
          showNotification('Błąd Przywracania', res.error || 'Nie udało się wgrać kopii.', 'error');
        }
      } catch (err) {
        showNotification('Błąd Odczytu Pliku', 'Nieprawidłowy plik JSON: ' + err.message, 'error');
      } finally {
        setImportingBackup(false);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
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

  // ==================== STORE & MARKET CMS HANDLERS ====================
  const STORE_ITEM_PRESETS = [
    { label: '🪄 Różdżka Hebanowa', url: 'https://images.unsplash.com/photo-1590422749897-47b19a16f2c2?auto=format&fit=crop&w=600&q=80' },
    { label: '🪄 Różdżka Cisu & Kelpie', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80' },
    { label: '🧥 Opończa z Wilczego Futra', url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80' },
    { label: '🛡️ Pancerz Runiczny', url: 'https://images.unsplash.com/photo-1599839575945-a9e5af0c3fa5?auto=format&fit=crop&w=600&q=80' },
    { label: '📖 Grimuar Cieni', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80' },
    { label: '📜 Kodeks Futharku', url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80' },
    { label: '🧪 Kociołek Alchemiczny', url: 'https://images.unsplash.com/photo-1514733670139-4d87a1941d55?auto=format&fit=crop&w=600&q=80' },
    { label: '🍷 Mikstura Szału', url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80' },
    { label: '🦅 Kruk Hrafn', url: 'https://images.unsplash.com/photo-1555169062-013468b47731?auto=format&fit=crop&w=600&q=80' },
    { label: '🦊 Lis Polarny', url: 'https://images.unsplash.com/photo-1516934024742-b461fba47600?auto=format&fit=crop&w=600&q=80' },
    { label: '💍 Amulet Odyna', url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80' },
    { label: '💎 Pierścień Runiczny', url: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=600&q=80' },
    { label: '⚔️ Rękawice Pojedynkowe', url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80' }
  ];

  const filteredStoreItems = (storeItems || []).filter(item => {
    const matchesShop = storeSelectedShop === 'all' || item.shopId === storeSelectedShop;
    const matchesCat = storeSelectedCat === 'all' || item.categorySlug === storeSelectedCat;
    const matchesRarity = storeSelectedRarity === 'all' || item.rarity === storeSelectedRarity;
    const matchesSearch = (item.name || '').toLowerCase().includes(storeSearchQuery.toLowerCase()) ||
                          (item.description || '').toLowerCase().includes(storeSearchQuery.toLowerCase()) ||
                          (item.shopName || '').toLowerCase().includes(storeSearchQuery.toLowerCase());
    return matchesShop && matchesCat && matchesRarity && matchesSearch;
  });

  const handleOpenCreateItem = () => {
    playWandSwoosh();
    setEditingItem(null);
    setFormName('');
    setFormShopId('wands-brokkur');
    setFormCategorySlug('wands');
    setFormPrice(150);
    setFormIcon('🪄');
    setFormHouseExclusive('');
    setFormRarity('Zwykły');
    setFormPlaceholderType('wand_dark');
    setFormImageUrl('');
    setFormDescription('');
    setFormLore('');
    setItemModalOpen(true);
  };

  const handleOpenEditItem = (item) => {
    playWandSwoosh();
    setEditingItem(item);
    setFormName(item.name || '');
    setFormShopId(item.shopId || 'wands-brokkur');
    setFormCategorySlug(item.categorySlug || 'wands');
    setFormPrice(item.price || 100);
    setFormIcon(item.icon || '📦');
    setFormHouseExclusive(item.houseExclusive || '');
    setFormRarity(item.rarity || 'Zwykły');
    setFormPlaceholderType(item.placeholderType || 'artifact_pendant');
    setFormImageUrl(item.imageUrl || item.image || '');
    setFormDescription(item.description || '');
    setFormLore(item.lore || '');
    setItemModalOpen(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Podaj nazwę przedmiotu.');
      return;
    }
    const matchedShop = (shops || []).find(s => s.id === formShopId);
    const itemData = {
      name: formName.trim(),
      shopId: formShopId,
      shopName: matchedShop ? matchedShop.name : 'Kram Kaupangr',
      categorySlug: formCategorySlug,
      category: formCategorySlug === 'wands' ? 'Różdżki' :
                formCategorySlug === 'robes' ? 'Szaty & Opończe' :
                formCategorySlug === 'books' ? 'Grimuary & Księgi' :
                formCategorySlug === 'potions' ? 'Eliksiry & Toksyny' :
                formCategorySlug === 'equipment' ? 'Wyposażenie Bojowe' :
                formCategorySlug === 'companions' ? 'Magiczni Towarzysze' : 'Artefakty & Talizmany',
      price: parseInt(formPrice, 10) || 50,
      icon: formIcon || '📦',
      houseExclusive: formHouseExclusive || null,
      rarity: formRarity || 'Zwykły',
      placeholderType: formPlaceholderType || 'artifact_pendant',
      imageUrl: formImageUrl.trim(),
      description: formDescription.trim(),
      lore: formLore.trim()
    };

    if (editingItem) {
      await updateStoreItem(editingItem.id, itemData);
    } else {
      await createStoreItem(itemData);
    }
    setItemModalOpen(false);
  };

  const handleDeleteItem = async (item) => {
    if (!window.confirm(`Czy na pewno chcesz usunąć przedmiot "${item.name}" z rynku?`)) return;
    playWandSwoosh();
    await deleteStoreItem(item.id);
  };

  const handleOpenQuickImage = (item) => {
    playRuneChime();
    setQuickImageTargetItem(item);
    setQuickImageUrlInput(item.imageUrl || item.image || '');
    setQuickImageModalOpen(true);
  };

  const handleSaveQuickImage = async () => {
    if (!quickImageTargetItem) return;
    playWandSwoosh();
    await updateStoreItem(quickImageTargetItem.id, {
      imageUrl: quickImageUrlInput.trim()
    });
    setQuickImageModalOpen(false);
  };

  const handleImageFileUpload = (e, callback) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert('Maksymalny rozmiar pliku wynosi 3MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const dataUrl = loadEvent.target.result;
      callback(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', width: '100%', maxWidth: '100%', minWidth: 0 }}>
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
            Zarządzanie dziennikami lekcyjnymi, księgą punktów Zakonów, asortymentem rynku, edyktami oraz kandydatami.
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
        <button onClick={() => setActiveTab('prologue')} className="btn-durmstrang-secondary" style={{padding:'0.65rem 1.2rem'}}>✉ Prolog postaci</button>
        <button onClick={() => { playWandSwoosh(); setActiveTab('world-director'); }} style={{padding:'0.65rem 1.2rem',background:activeTab==='world-director'?'rgba(139,106,56,.28)':'rgba(139,106,56,.1)',border:activeTab==='world-director'?'1px solid #c7b17d':'1px solid rgba(139,106,56,.45)',borderRadius:'4px',color:'#d7d0c5',fontFamily:'var(--font-heading)',fontSize:'.85rem',fontWeight:800,cursor:'pointer',display:'flex',alignItems:'center',gap:'.45rem'}}><span>☾</span> Magiczna Północ</button>
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
          onClick={() => { playWandSwoosh(); setActiveTab('store'); }}
          style={{
            padding: '0.65rem 1.2rem',
            background: activeTab === 'store' ? 'rgba(234, 179, 8, 0.22)' : 'rgba(234, 179, 8, 0.06)',
            border: activeTab === 'store' ? '1px solid #eab308' : '1px solid rgba(234, 179, 8, 0.25)',
            borderRadius: '4px',
            color: activeTab === 'store' ? '#fde047' : '#cbd5e1',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <ShoppingBag size={14} color="#fde047" />
          <span>Rynek & Sklepy (Kaupangr)</span>
          <span style={{ background: '#eab308', color: '#090d14', fontSize: '0.68rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '10px' }}>
            {storeItems.length}
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
          onClick={() => { playWandSwoosh(); setActiveTab('guardians'); }}
          style={{
            padding: '0.65rem 1.2rem',
            background: activeTab === 'guardians' ? 'rgba(56, 189, 248, 0.22)' : 'rgba(56, 189, 248, 0.06)',
            border: activeTab === 'guardians' ? '1px solid #38bdf8' : '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '4px',
            color: activeTab === 'guardians' ? '#7dd3fc' : '#cbd5e1',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <Shield size={14} color="#38bdf8" />
          <span>Strażnicy & Opiekunowie</span>
          <span style={{ background: '#38bdf8', color: '#090d14', fontSize: '0.65rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '10px' }}>
            ZAKONY
          </span>
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
          onClick={() => { playWandSwoosh(); setActiveTab('database'); }}
          style={{
            padding: '0.65rem 1.2rem',
            background: activeTab === 'database' ? 'rgba(56, 189, 248, 0.22)' : 'rgba(56, 189, 248, 0.06)',
            border: activeTab === 'database' ? '1px solid #38bdf8' : '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '4px',
            color: activeTab === 'database' ? '#7dd3fc' : '#cbd5e1',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <Database size={14} color="#38bdf8" />
          <span>Baza Danych & SQL</span>
          <span style={{ background: '#38bdf8', color: '#090d14', fontSize: '0.65rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '10px' }}>
            CRUD
          </span>
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

        <button
          onClick={() => { playWandSwoosh(); setActiveTab('memory-archive'); }}
          style={{
            padding: '0.65rem 1.2rem',
            background: activeTab === 'memory-archive' ? 'rgba(197, 159, 78, 0.25)' : 'rgba(197, 159, 78, 0.08)',
            border: activeTab === 'memory-archive' ? '1px solid var(--gold-ancient)' : '1px solid rgba(197, 159, 78, 0.25)',
            borderRadius: '4px',
            color: activeTab === 'memory-archive' ? '#ffffff' : '#f7dca0',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <span>🏛️</span> Izba Pamięci & Archiwizacja Roku
        </button>
      </div>

      {activeTab === 'world-director' && <AdminWorldDirector />}
      {activeTab === 'prologue' && <PrologueAdminPanel />}

      {/* =========================================================================
          TAB: 🏛️ IZBA PAMIĘCI & AUTOMATYCZNA ARCHIWIZACJA ROKU
          ========================================================================= */}
      {activeTab === 'memory-archive' && (
        <MemoryArchiveWizardTab
          onPublishedYear={(yearId) => {
            showNotification('Archiwum Opublikowane!', 'Rocznik został pomyślnie zarchiwizowany w Izbie Pamięci.', 'success');
            setActiveView('memory');
          }}
        />
      )}

      {/* =========================================================================
          TAB: 🗄️ BAZA DANYCH & INTERAKTYWNY EKSPLORATOR SQL (CRUD DLA DYREKCJI)
          ========================================================================= */}
      {activeTab === 'database' && <DatabaseExplorerPanel />}

      {/* =========================================================================
          TAB: 🛡️ STRAŻNICY I OPIEKUNOWIE ZAKONÓW ORAZ STRAŻNIK TWIERDZY
          ========================================================================= */}
      {activeTab === 'guardians' && (() => {
        const staffCandidates = (users || []).filter(u => ['professor', 'teacher', 'admin', 'headmaster'].includes(u.role));
        const studentCandidates = (users || []).filter(u => u.role === 'student' || (!['professor', 'teacher', 'admin', 'headmaster'].includes(u.role)));
        const getHouseStudents = (houseKey) => studentCandidates.filter(u => (u.house || u.house_id || u.houseId || '').toLowerCase() === houseKey.toLowerCase());

        const HOUSES_META = [
          {
            id: 'reinhall',
            name: 'Reinhall',
            sub: 'Zakon Renifera (Ordo Rangiferi)',
            element: 'Krew i Wieczna Zmarzlina',
            color: '#7a2632',
            colorSecondary: '#a8384b',
            border: 'rgba(122, 38, 50, 0.6)',
            glow: 'rgba(122, 38, 50, 0.35)',
            text: '#e8bfc6',
            crest: '/crest_stag.jpg',
            rune: 'ᚦ',
            founder: 'Eirik Krwawy Róg'
          },
          {
            id: 'bjornhall',
            name: 'Björnhall',
            sub: 'Zakon Niedźwiedzia (Ordo Ursi)',
            element: 'Żelazo i Pęknięta Skala',
            color: '#35536f',
            colorSecondary: '#5b8aaf',
            border: 'rgba(53, 83, 111, 0.6)',
            glow: 'rgba(53, 83, 111, 0.35)',
            text: '#c4d8e8',
            crest: '/crest_bear.jpg',
            rune: 'ᛉ',
            founder: 'Torvald Żelaznoręki'
          },
          {
            id: 'ravnheim',
            name: 'Ravnheim',
            sub: 'Zakon Kruka (Ordo Corvi)',
            element: 'Cień i Astralna Noc',
            color: '#42385f',
            colorSecondary: '#7a6ea0',
            border: 'rgba(66, 56, 95, 0.6)',
            glow: 'rgba(66, 56, 95, 0.35)',
            text: '#d0c8e2',
            crest: '/crest_raven.jpg',
            rune: 'ᚱ',
            founder: 'Morana Cień-Krocząca'
          },
          {
            id: 'otergard',
            name: 'Otergard',
            sub: 'Zakon Wydry (Ordo Lutrae)',
            element: 'Lodowcowe Wody i Toksyny',
            color: '#23615b',
            colorSecondary: '#3aaa9f',
            border: 'rgba(35, 97, 91, 0.6)',
            glow: 'rgba(35, 97, 91, 0.35)',
            text: '#b4e0da',
            crest: '/crest_otter.jpg',
            rune: 'ᛞ',
            founder: 'Astrid Złotooka'
          }
        ];

        const handleSaveFortressGuardian = async (e) => {
          e.preventDefault();
          if (!fgFormName.trim()) {
            showNotification('Błąd', 'Podaj imię i nazwisko Strażnika Twierdzy.', 'error');
            return;
          }
          playRuneChime();
          await updateFortressGuardian({
            name: fgFormName.trim(),
            house: fgFormHouse,
            title: fgFormTitle.trim() || 'Strażnik Twierdzy Durmstrang',
            note: fgFormNote.trim() || 'Mianowany z mocy dekretu Rady Mistrzów Cytadeli.',
            appointedAt: new Date().toISOString().split('T')[0]
          });
        };

        const handleSaveSingleHouse = async (houseId) => {
          playRuneChime();
          const current = housesEditState[houseId] || {};
          await updateHouseLeaders(houseId, {
            headOfHouse: current.headOfHouse?.trim() || '',
            prefect: current.prefect?.trim() || ''
          });
        };

        const handleSaveAllHouses = async () => {
          playRuneChime();
          for (const h of HOUSES_META) {
            const current = housesEditState[h.id] || {};
            await updateHouseLeaders(h.id, {
              headOfHouse: current.headOfHouse?.trim() || '',
              prefect: current.prefect?.trim() || ''
            });
          }
          showNotification('Zapisano Wszystkie Zakony', 'Zaktualizowano Opiekunów i Strażników dla wszystkich czterech Zakonów.', 'success');
        };

        const fgHouseMeta = HOUSES_META.find(h => h.id === fgFormHouse) || HOUSES_META[2];

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fade-in">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.45rem', color: '#ffffff', margin: 0, fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Shield size={24} color="#38bdf8" />
                  Zarządzanie Strażnikami i Opiekunami Cytadeli
                </h2>
                <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.86rem', color: '#94a3b8', maxWidth: '850px', lineHeight: 1.5 }}>
                  W Twierdzy Magii Durmstrang <strong>nie ma prefektów</strong> – ich tradycyjnymi odpowiednikami są <strong>Strażnicy Zakonów</strong> oraz naczelny <strong>Strażnik Twierdzy</strong>. 
                  Opiekunowie Zakonów powoływani są spośród Kadry Magicznej, a Strażnicy rekrutują się z grona Adeptów.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveAllHouses}
                className="btn-durmstrang"
                style={{ padding: '0.6rem 1.3rem', fontSize: '0.85rem', gap: '0.5rem', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' }}
              >
                <CheckCircle2 size={16} /> Zapisz Wszystkie Zakony
              </button>
            </div>

            {/* =========================================================================
                SEKCJA 1: 🏰 STRAŻNIK TWIERDZY (ODPOWIEDNIK PREFEKTA NACZELNEGO)
                ========================================================================= */}
            <div
              className="gothic-card runic-corners"
              style={{
                padding: '2rem',
                background: 'linear-gradient(135deg, rgba(16, 24, 39, 0.96) 0%, rgba(9, 14, 24, 0.98) 100%)',
                border: '1px solid var(--gold-ancient)',
                boxShadow: '0 12px 35px rgba(0,0,0,0.75)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid rgba(197, 159, 78, 0.25)', paddingBottom: '0.8rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Crown size={22} color="var(--gold-glow)" />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#ffffff', fontFamily: 'var(--font-heading)' }}>
                      Mianowanie Strażnika Twierdzy (Główny Strażnik Cytadeli)
                    </h3>
                    <div style={{ fontSize: '0.76rem', color: 'var(--gold-ancient)', marginTop: '0.15rem' }}>
                      Odpowiednik Prefekta Naczelnego • Zwierzchnik wszystkich Strażników Zakonnych i Rzecznik Społeczności Uczniowskiej
                    </div>
                  </div>
                </div>

                <span style={{ fontSize: '0.72rem', background: 'rgba(197, 159, 78, 0.15)', color: 'var(--gold-glow)', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(197, 159, 78, 0.3)', fontWeight: 700 }}>
                  URZĄD NACZELNY
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)', gap: '2rem', alignItems: 'start' }}>
                {/* Formularz Mianowania */}
                <form onSubmit={handleSaveFortressGuardian} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--gold-ancient)', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                      Szybki Wybór z Bazy Adeptów (Uczniów):
                    </label>
                    <select
                      value={fgSelectedStudentId}
                      onChange={(e) => {
                        const sId = e.target.value;
                        setFgSelectedStudentId(sId);
                        const matched = studentCandidates.find(u => u.id === sId);
                        if (matched) {
                          const fullName = `${matched.name || ''} ${matched.surname || ''}`.trim() || matched.username;
                          setFgFormName(fullName);
                          if (matched.house) setFgFormHouse(matched.house.toLowerCase());
                        }
                      }}
                      className="gothic-input"
                      style={{ width: '100%', padding: '0.55rem 0.8rem', fontSize: '0.85rem' }}
                    >
                      <option value="">-- Wybierz ucznia lub wpisz ręcznie poniżej --</option>
                      {studentCandidates.map(st => {
                        const nameStr = `${st.name || ''} ${st.surname || ''}`.trim() || st.username;
                        return (
                          <option key={st.id} value={st.id}>
                            {nameStr} ({st.house ? `Zakon ${st.house}` : 'Brak zakonu'} • {st.points || 0} pkt)
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                        Imię i Nazwisko Strażnika Twierdzy *
                      </label>
                      <input
                        type="text"
                        required
                        value={fgFormName}
                        onChange={(e) => setFgFormName(e.target.value)}
                        placeholder="np. Valdemar Krag-Hansen"
                        className="gothic-input"
                        style={{ width: '100%', padding: '0.55rem 0.8rem', fontSize: '0.88rem', fontWeight: 700 }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                        Zakon Macierzysty *
                      </label>
                      <select
                        value={fgFormHouse}
                        onChange={(e) => setFgFormHouse(e.target.value)}
                        className="gothic-input"
                        style={{ width: '100%', padding: '0.55rem 0.8rem', fontSize: '0.85rem' }}
                      >
                        <option value="reinhall">🦌 Reinhall (Renifer)</option>
                        <option value="bjornhall">🐻 Björnhall (Niedźwiedź)</option>
                        <option value="ravnheim">🦅 Ravnheim (Kruk)</option>
                        <option value="otergard">🦦 Otergard (Wydra)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                      Oficjalny Tytuł Honorowy:
                    </label>
                    <input
                      type="text"
                      value={fgFormTitle}
                      onChange={(e) => setFgFormTitle(e.target.value)}
                      placeholder="np. Strażnik Twierdzy Durmstrang"
                      className="gothic-input"
                      style={{ width: '100%', padding: '0.55rem 0.8rem', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                      Dekret Mianowania / Uzasadnienie Nominacji:
                    </label>
                    <textarea
                      rows={3}
                      value={fgFormNote}
                      onChange={(e) => setFgFormNote(e.target.value)}
                      placeholder="Uzasadnienie wpisane do Wiecznej Kroniki..."
                      className="gothic-input"
                      style={{ width: '100%', padding: '0.55rem 0.8rem', fontSize: '0.82rem', resize: 'vertical' }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-durmstrang"
                    style={{ padding: '0.65rem 1.2rem', fontSize: '0.88rem', gap: '0.5rem', marginTop: '0.5rem', justifyContent: 'center' }}
                  >
                    <ShieldCheck size={16} /> Mianuj i Zapisz Strażnika Twierdzy
                  </button>
                </form>

                {/* Podgląd Karty Strażnika Twierdzy na Żywo */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gold-ancient)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Podgląd Karty Strażnika Twierdzy na Żywo:
                  </div>

                  <div
                    style={{
                      background: `linear-gradient(145deg, ${fgHouseMeta.color}22 0%, rgba(10, 14, 22, 0.95) 100%)`,
                      border: `1px solid ${fgHouseMeta.colorSecondary}`,
                      borderRadius: '10px',
                      padding: '1.5rem',
                      boxShadow: `0 10px 30px rgba(0,0,0,0.8), 0 0 25px ${fgHouseMeta.glow}`,
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ position: 'absolute', right: '-15px', top: '-15px', fontSize: '5rem', opacity: 0.08, fontFamily: 'serif', pointerEvents: 'none', color: fgHouseMeta.colorSecondary }}>
                      {fgHouseMeta.rune}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                      <img
                        src={fgHouseMeta.crest}
                        alt="Herb Zakonu"
                        style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '50%',
                          border: `2px solid ${fgHouseMeta.colorSecondary}`,
                          objectFit: 'cover',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.7)'
                        }}
                      />
                      <div>
                        <span style={{ fontSize: '0.68rem', background: 'rgba(197, 159, 78, 0.2)', color: 'var(--gold-glow)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          🛡️ STRAŻNIK TWIERDZY
                        </span>
                        <h4 style={{ margin: '0.35rem 0 0 0', fontSize: '1.25rem', color: '#ffffff', fontFamily: 'var(--font-heading)' }}>
                          {fgFormName || 'Valdemar Krag-Hansen'}
                        </h4>
                        <div style={{ fontSize: '0.78rem', color: fgHouseMeta.text, marginTop: '0.1rem' }}>
                          {fgHouseMeta.sub}
                        </div>
                      </div>
                    </div>

                    <div style={{ background: 'rgba(0, 0, 0, 0.4)', borderRadius: '6px', padding: '0.85rem', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        Tytuł: <strong style={{ color: '#ffffff' }}>{fgFormTitle || 'Strażnik Twierdzy Durmstrang'}</strong>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        Dekret: <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>„{fgFormNote || 'Mianowany z mocy dekretu Rady Mistrzów Cytadeli.'}”</span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--gold-ancient)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.4rem', marginTop: '0.2rem' }}>
                        ᛞ Pieczęć Główna Twierdzy Magii Durmstrang ᛞ
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* =========================================================================
                SEKCJA 2: ⚔️ OPIEKUNOWIE I STRAŻNICY CZTERECH ZAKONÓW
                ========================================================================= */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.6rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#ffffff', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Shield size={18} color="var(--gold-ancient)" />
                    Władze Czterech Zakonów (Opiekun z Kadry & Strażnik z Uczniów)
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                    Wybierz Opiekuna spośród Kadry Profesorskiej oraz Strażnika Zakonu spośród zarejestrowanych Adeptów danego Zakonu.
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '1.5rem' }}>
                {HOUSES_META.map((h) => {
                  const houseState = housesEditState[h.id] || { headOfHouse: '', prefect: '' };
                  const houseStudents = getHouseStudents(h.id);

                  return (
                    <div
                      key={h.id}
                      className="gothic-card runic-corners"
                      style={{
                        padding: '1.5rem',
                        background: `linear-gradient(160deg, ${h.color}18 0%, rgba(10, 14, 22, 0.95) 100%)`,
                        border: `1px solid ${h.border}`,
                        boxShadow: `0 8px 24px rgba(0,0,0,0.65)`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.2rem'
                      }}
                    >
                      {/* House Card Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${h.border}`, paddingBottom: '0.8rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <img
                            src={h.crest}
                            alt={h.name}
                            style={{ width: '48px', height: '48px', borderRadius: '50%', border: `2px solid ${h.colorSecondary}`, objectFit: 'cover' }}
                          />
                          <div>
                            <div style={{ fontSize: '1.15rem', color: '#ffffff', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                              Zakon {h.name}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: h.text }}>
                              {h.element}
                            </div>
                          </div>
                        </div>
                        <span style={{ fontSize: '1.4rem', fontFamily: 'serif', color: h.colorSecondary, fontWeight: 700 }}>
                          {h.rune}
                        </span>
                      </div>

                      {/* 1. OPIEKUN ZAKONU (KADRA) */}
                      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.9rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <label style={{ fontSize: '0.75rem', color: 'var(--gold-ancient)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            🧙‍♂️ Opiekun Zakonu (Kadra):
                          </label>
                          <span style={{ fontSize: '0.62rem', background: 'rgba(197, 159, 78, 0.15)', color: 'var(--gold-glow)', padding: '0.05rem 0.35rem', borderRadius: '3px' }}>
                            KADRA
                          </span>
                        </div>

                        {/* Staff Select Dropdown */}
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              setHousesEditState(prev => ({
                                ...prev,
                                [h.id]: { ...prev[h.id], headOfHouse: cleanPersonName(e.target.value) }
                              }));
                            }
                          }}
                          className="gothic-input"
                          style={{ width: '100%', padding: '0.45rem 0.65rem', fontSize: '0.78rem' }}
                        >
                          <option value="">-- Wybierz z Kadry Naukowej --</option>
                          {staffCandidates.map(st => {
                            const nameOnly = cleanPersonName(`${st.name || ''} ${st.surname || ''}`.trim() || st.full_name || st.username);
                            const deptOrRole = st.departmentName || st.title || (st.role === 'admin' || st.role === 'headmaster' ? 'Dyrekcja' : 'Profesor');
                            return (
                              <option key={st.id} value={nameOnly}>
                                {nameOnly} ({deptOrRole})
                              </option>
                            );
                          })}
                        </select>

                        {/* Manual / Current Head Input */}
                        <input
                          type="text"
                          value={houseState.headOfHouse || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setHousesEditState(prev => ({
                              ...prev,
                              [h.id]: { ...prev[h.id], headOfHouse: val }
                            }));
                          }}
                          placeholder="Imię i nazwisko (np. Sigrid Hällström)"
                          className="gothic-input"
                          style={{ width: '100%', padding: '0.45rem 0.65rem', fontSize: '0.84rem', fontWeight: 600 }}
                        />
                      </div>

                      {/* 2. STRAŻNIK ZAKONU (UCZNIOWIE) */}
                      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.9rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <label style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            🛡️ Strażnik Zakonu (Adept):
                          </label>
                          <span style={{ fontSize: '0.62rem', background: 'rgba(56, 189, 248, 0.15)', color: '#7dd3fc', padding: '0.05rem 0.35rem', borderRadius: '3px' }}>
                            ADEPT
                          </span>
                        </div>

                        {/* Student Select Dropdown */}
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              setHousesEditState(prev => ({
                                ...prev,
                                [h.id]: { ...prev[h.id], prefect: cleanPersonName(e.target.value) }
                              }));
                            }
                          }}
                          className="gothic-input"
                          style={{ width: '100%', padding: '0.45rem 0.65rem', fontSize: '0.78rem' }}
                        >
                          <option value="">-- Wybierz Ucznia ({h.name}: {houseStudents.length}) --</option>
                          {houseStudents.map(st => {
                            const nameOnly = cleanPersonName(`${st.name || ''} ${st.surname || ''}`.trim() || st.full_name || st.username);
                            return (
                              <option key={st.id} value={nameOnly}>
                                {nameOnly} ({st.points || 0} pkt)
                              </option>
                            );
                          })}
                          {houseStudents.length === 0 && (
                            <option disabled value="">(Brak uczniów przypisanych do tego zakonu)</option>
                          )}
                        </select>

                        {/* Manual / Current Prefect Input */}
                        <input
                          type="text"
                          value={houseState.prefect || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setHousesEditState(prev => ({
                              ...prev,
                              [h.id]: { ...prev[h.id], prefect: val }
                            }));
                          }}
                          placeholder="Imię i nazwisko (np. Magnus Blom)"
                          className="gothic-input"
                          style={{ width: '100%', padding: '0.45rem 0.65rem', fontSize: '0.84rem', fontWeight: 600 }}
                        />
                      </div>

                      {/* Save Button for this House */}
                      <button
                        type="button"
                        onClick={() => handleSaveSingleHouse(h.id)}
                        className="btn-durmstrang"
                        style={{ width: '100%', padding: '0.5rem', fontSize: '0.82rem', justifyContent: 'center', gap: '0.4rem', marginTop: 'auto' }}
                      >
                        <Check size={14} /> Zapisz Zakon {h.name}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

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
          TAB: 🏪 RYNEK KAUPANGR & ZARZĄDZANIE PRZEDMIOTAMI
          ========================================================================= */}
      {activeTab === 'store' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fade-in">
          {/* Header Controls Bar */}
          <div
            style={{
              background: 'rgba(15, 20, 30, 0.95)',
              border: '1px solid rgba(234, 179, 8, 0.4)',
              borderRadius: '8px',
              padding: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1.2rem',
              boxShadow: '0 8px 30px rgba(0,0,0,0.6)'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                <ShoppingBag size={20} color="#fde047" />
                <h2 style={{ margin: 0, color: '#ffffff', fontSize: '1.35rem', fontFamily: 'var(--font-heading)' }}>
                  Magazyn Rynku Kaupangr ({storeItems.length} Przedmiotów)
                </h2>
              </div>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.86rem', maxWidth: '700px' }}>
                Kompletny rejestr asortymentu kramów Cytadeli. Dodawaj nowe artefakty, ustalaj ceny, przypisuj zdjęcia i grafiki oraz konfiguruj ograniczenia dla Zakonów.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={handleOpenCreateItem}
                className="btn-durmstrang"
                style={{
                  padding: '0.65rem 1.3rem',
                  fontSize: '0.85rem',
                  background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
                  color: '#090d14',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Plus size={16} /> Dodaj Nowy Przedmiot
              </button>

              <button
                onClick={() => {
                  if (window.confirm('Czy na pewno chcesz przywrócić domyślny katalog sklepu Kaupangr? Własne zmiany zostaną zresetowane.')) {
                    resetStoreItems();
                  }
                }}
                className="btn-durmstrang-secondary"
                style={{ padding: '0.65rem 1.1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <RefreshCw size={14} /> Przywróć Domyślny Katalog
              </button>
            </div>
          </div>

          {/* Filter & Search Toolbar */}
          <div
            className="gothic-card"
            style={{
              padding: '1.2rem 1.5rem',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(12, 16, 24, 0.9)'
            }}
          >
            <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', alignItems: 'center', flex: '1' }}>
              {/* Shop Selector */}
              <select
                value={storeSelectedShop}
                onChange={(e) => setStoreSelectedShop(e.target.value)}
                className="gothic-input"
                style={{ padding: '0.5rem 0.8rem', fontSize: '0.82rem', minWidth: '180px' }}
              >
                <option value="all">Wszystkie Kramy ({shops.length})</option>
                {shops.filter(s => s.id !== 'all').map(s => (
                  <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                ))}
              </select>

              {/* Category Selector */}
              <select
                value={storeSelectedCat}
                onChange={(e) => setStoreSelectedCat(e.target.value)}
                className="gothic-input"
                style={{ padding: '0.5rem 0.8rem', fontSize: '0.82rem', minWidth: '160px' }}
              >
                <option value="all">Wszystkie Kategorie</option>
                <option value="wands">Różdżki</option>
                <option value="robes">Szaty & Opończe</option>
                <option value="books">Grimuary & Księgi</option>
                <option value="potions">Eliksiry & Toksyny</option>
                <option value="equipment">Wyposażenie Bojowe</option>
                <option value="companions">Magiczni Towarzysze</option>
                <option value="artifacts">Artefakty & Talizmany</option>
              </select>

              {/* Rarity Selector */}
              <select
                value={storeSelectedRarity}
                onChange={(e) => setStoreSelectedRarity(e.target.value)}
                className="gothic-input"
                style={{ padding: '0.5rem 0.8rem', fontSize: '0.82rem', minWidth: '140px' }}
              >
                <option value="all">Wszystkie Rzadkości</option>
                <option value="Niezbędny">Niezbędny</option>
                <option value="Zwykły">Zwykły</option>
                <option value="Rzadki">Rzadki</option>
                <option value="Epicki">Epicki</option>
                <option value="Legendarne">Legendarne</option>
              </select>
            </div>

            {/* Search Bar */}
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={15} color="var(--gold-ancient)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Szukaj przedmiotu..."
                value={storeSearchQuery}
                onChange={(e) => setStoreSearchQuery(e.target.value)}
                className="gothic-input"
                style={{ width: '100%', paddingLeft: '2.2rem', fontSize: '0.82rem' }}
              />
            </div>
          </div>

          {/* Results Counter */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '0.84rem' }}>
            <div>
              Znaleziono: <strong style={{ color: '#ffffff' }}>{filteredStoreItems.length}</strong> z <strong style={{ color: '#ffffff' }}>{storeItems.length}</strong> artefaktów
            </div>
            {storeSearchQuery && (
              <button
                onClick={() => setStoreSearchQuery('')}
                style={{ background: 'none', border: 'none', color: 'var(--gold-ancient)', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}
              >
                Wyczyść szukanie
              </button>
            )}
          </div>

          {/* Store Items Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {filteredStoreItems.map(item => {
              const hasCustomImg = Boolean(item.imageUrl || item.image);
              return (
                <div
                  key={item.id}
                  className="gothic-card runic-corners"
                  style={{
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    background: 'rgba(12, 16, 24, 0.95)',
                    border: '1px solid rgba(197, 159, 78, 0.3)',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.5)'
                  }}
                >
                  <div>
                    {/* Visual Art / Photo Preview */}
                    <div
                      style={{ cursor: 'pointer', marginBottom: '0.8rem', position: 'relative' }}
                      onClick={() => handleOpenQuickImage(item)}
                      title="Kliknij, aby szybko zmienić grafikę/zdjęcie"
                    >
                      <ItemPlaceholder item={item} size="normal" />
                      <div
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: 'rgba(4,7,12,0.85)',
                          backdropFilter: 'blur(4px)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          border: '1px solid rgba(255,255,255,0.2)',
                          fontSize: '0.68rem',
                          color: hasCustomImg ? '#34d399' : '#cbd5e1',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          zIndex: 5
                        }}
                      >
                        <ImageIcon size={11} /> {hasCustomImg ? 'Własne zdjęcie' : 'Rycina SVG'}
                      </div>
                    </div>

                    {/* Metadata Pill Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Store size={12} color="var(--gold-ancient)" /> {item.shopName}
                      </span>
                      {item.houseExclusive && (
                        <span style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: 700, background: 'rgba(239, 68, 68, 0.12)', padding: '0.1rem 0.4rem', borderRadius: '3px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                          Zakon: {item.houseExclusive.toUpperCase()}
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '1.1rem', color: '#ffffff', marginBottom: '0.35rem', lineHeight: 1.3, fontFamily: 'var(--font-heading)' }}>
                      {item.name}
                    </h3>

                    <p style={{ color: '#b0b7c3', fontSize: '0.82rem', lineHeight: 1.45, marginBottom: '0.6rem' }}>
                      {item.description}
                    </p>

                    {item.lore && (
                      <div style={{ background: 'rgba(0,0,0,0.35)', padding: '0.4rem 0.65rem', borderRadius: '4px', borderLeft: '2px solid var(--gold-ancient)', fontSize: '0.75rem', color: '#cbd5e1', fontStyle: 'italic', marginBottom: '0.6rem' }}>
                        „{item.lore}”
                      </div>
                    )}
                  </div>

                  {/* Actions & Price Footer */}
                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: '#8c95a6', textTransform: 'uppercase' }}>Cena:</div>
                      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--gold-glow)' }}>
                        {item.price} ᛋ
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <button
                        onClick={() => handleOpenQuickImage(item)}
                        className="btn-durmstrang-secondary"
                        style={{ padding: '0.4rem 0.7rem', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        title="Zmień grafikę / wgraj zdjęcie"
                      >
                        <ImageIcon size={13} /> Zdjęcie
                      </button>

                      <button
                        onClick={() => handleOpenEditItem(item)}
                        className="btn-durmstrang-secondary"
                        style={{ padding: '0.4rem 0.7rem', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        title="Edytuj szczegóły przedmiotu"
                      >
                        <Edit size={13} /> Edytuj
                      </button>

                      <button
                        onClick={() => handleDeleteItem(item)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          borderRadius: '4px',
                          color: '#f87171',
                          padding: '0.4rem 0.6rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Usuń przedmiot"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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
                  minLength={12}
                  placeholder="Minimum 12 znaków..."
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

      {/* =========================================================================
          TAB: ⚙️ SYSTEM, BAZA DANYCH & KOPIA ZAPASOWA (DIAGNOSTYKA)
          ========================================================================= */}
      {activeTab === 'system' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', color: '#ffffff', margin: 0, fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Server size={22} color="#10b981" />
                Stan Silnika Bazy Danych & Diagnostyka Serwera
              </h2>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                Relacyjny silnik SQLite (better-sqlite3 w trybie WAL) — gwarancja 100% trwałości i odporności na awarie.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <button
                onClick={loadSystemStats}
                disabled={loadingStats}
                className="btn-durmstrang-secondary"
                style={{ padding: '0.5rem 0.9rem', fontSize: '0.8rem', gap: '0.4rem' }}
              >
                <RefreshCw size={14} className={loadingStats ? 'spin' : ''} />
                <span>Odśwież Telemetrię</span>
              </button>

              <button
                onClick={handleOptimizeDb}
                disabled={optimizingDb}
                className="btn-durmstrang-secondary"
                style={{ padding: '0.5rem 0.9rem', fontSize: '0.8rem', gap: '0.4rem', borderColor: '#10b981', color: '#6ee7b7' }}
              >
                <Database size={14} />
                <span>{optimizingDb ? 'Optymalizowanie...' : 'Optymalizuj SQLite (VACUUM)'}</span>
              </button>

              <button
                onClick={handleExportBackup}
                disabled={exportingBackup}
                className="btn-durmstrang"
                style={{ padding: '0.5rem 1.1rem', fontSize: '0.82rem', gap: '0.4rem', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}
              >
                <Download size={14} />
                <span>{exportingBackup ? 'Eksportowanie...' : 'Pobierz Kopię Zapasową (JSON)'}</span>
              </button>

              <label
                className="btn-durmstrang"
                style={{ padding: '0.5rem 1.1rem', fontSize: '0.82rem', gap: '0.4rem', background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)', cursor: 'pointer', display: 'flex', alignItems: 'center', margin: 0 }}
              >
                <Upload size={14} />
                <span>{importingBackup ? 'Przywracanie...' : 'Przywróć Bazę z Pliku (JSON)'}</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  style={{ display: 'none' }}
                  onChange={handleImportBackupFile}
                  disabled={importingBackup}
                />
              </label>
            </div>
          </div>

          {/* Engine & Resources Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div className="gothic-card runic-corners" style={{ padding: '1.25rem', background: 'rgba(10, 14, 22, 0.85)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.4rem' }}>
                <Database size={15} /> Silnik Relacyjny
              </div>
              <div style={{ fontSize: '1.25rem', color: '#ffffff', fontWeight: 800, fontFamily: 'monospace' }}>
                SQLite (better-sqlite3)
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                Tryb zapisu: <strong style={{ color: '#34d399' }}>WAL (Write-Ahead Logging)</strong> • Transakcje ACID
              </div>
            </div>

            <div className="gothic-card runic-corners" style={{ padding: '1.25rem', background: 'rgba(10, 14, 22, 0.85)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.4rem' }}>
                <Activity size={15} /> Czas Działania Serwera
              </div>
              <div style={{ fontSize: '1.25rem', color: '#ffffff', fontWeight: 800, fontFamily: 'monospace' }}>
                {systemStats?.uptimeFormatted || 'Wczytywanie...'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                Node: <strong style={{ color: '#7dd3fc' }}>{systemStats?.nodeVersion || process.version || 'v20+'}</strong> • Platforma: <strong>{systemStats?.platform || 'windows'}</strong>
              </div>
            </div>

            <div className="gothic-card runic-corners" style={{ padding: '1.25rem', background: 'rgba(10, 14, 22, 0.85)', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#eab308', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.4rem' }}>
                <Cpu size={15} /> Zużycie Pamięci RAM
              </div>
              <div style={{ fontSize: '1.25rem', color: '#ffffff', fontWeight: 800, fontFamily: 'monospace' }}>
                {systemStats?.memory?.rssMB ? `${systemStats.memory.rssMB} MB` : 'Brak danych'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                Heap: <strong>{systemStats?.memory?.heapUsedMB || 0} MB</strong> / {systemStats?.memory?.heapTotalMB || 0} MB
              </div>
            </div>
          </div>

          {/* Database Tables Census / Records Count */}
          <div className="gothic-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--gold-ancient)', margin: '0 0 1rem 0', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HardDrive size={18} /> Spis Rekordów we Wszystkich Tabelach Bazy Danych
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '0.85rem' }}>
              {[
                { label: 'Użytkownicy i Profile', count: systemStats?.counts?.users ?? users.length, icon: '🧙‍♂️', key: 'users' },
                { label: 'Protokoły Lekcyjne', count: systemStats?.counts?.lessons ?? lessons.length, icon: '📖', key: 'lessons' },
                { label: 'Transakcje Punktowe', count: systemStats?.counts?.pointTransactions ?? pointLedger.length, icon: '🏆', key: 'point_transactions' },
                { label: 'Wpisy w Kronice (News)', count: systemStats?.counts?.news ?? news.length, icon: '📜', key: 'news' },
                { label: 'Katedry Naukowe', count: systemStats?.counts?.subjects ?? (subjects || []).length, icon: '🏛️', key: 'subjects' },
                { label: 'Plan Lekcji & Zastępstwa', count: systemStats?.counts?.timetable ?? 0, icon: '📅', key: 'timetable_entries' },
                { label: 'Konta Bankowe', count: systemStats?.counts?.bankAccounts ?? 0, icon: '🏦', key: 'bank_accounts' },
                { label: 'Transakcje Skirnirów', count: systemStats?.counts?.bankTransactions ?? 0, icon: '💰', key: 'bank_transactions' },
                { label: 'Losy Loterii Odyna', count: systemStats?.counts?.lotteryTickets ?? 0, icon: 'ᛟ', key: 'lottery_tickets' },
                { label: 'Dokumenty & Dekrety', count: systemStats?.counts?.documents ?? 0, icon: '📑', key: 'documents' },
                { label: 'Banery CMS Kategorii', count: systemStats?.counts?.cmsBanners ?? (categoryBanners || []).length, icon: '🖼️', key: 'cms_banners' },
                { label: 'Grafiki Bloków Bocznych', count: systemStats?.counts?.cmsBlocks ?? (blockGraphics || []).length, icon: '🛡️', key: 'cms_block_graphics' },
                { label: 'Ukończone Questy Mapy', count: systemStats?.counts?.completedQuests ?? 0, icon: '🧭', key: 'completed_quests' },
                { label: 'Odkryte Sekrety & Lore', count: systemStats?.counts?.secrets ?? 0, icon: '🗝️', key: 'discovered_secrets' },
                { label: 'Wykute Formuły Runiczne', count: systemStats?.counts?.formulas ?? 0, icon: '⚡', key: 'crafted_formulas' },
                { label: 'Zadania Domowe', count: systemStats?.counts?.homework ?? 0, icon: '📝', key: 'homework_submissions' },
                { label: 'Wiadomości Kruczej Poczty', count: systemStats?.counts?.ravenMessages ?? 0, icon: '✉️', key: 'raven_messages' },
                { label: 'Wydarzenia w Kalendarzu', count: systemStats?.counts?.events ?? 0, icon: '📆', key: 'events' },
                { label: 'Logi Audytu Administracji', count: systemStats?.counts?.auditLogs ?? auditLogs.length, icon: '🛡️', key: 'audit_logs' }
              ].map((tbl, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.85rem 1rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>{tbl.icon}</span>
                    <div>
                      <div style={{ fontSize: '0.82rem', color: '#ffffff', fontWeight: 600 }}>{tbl.label}</div>
                      <div style={{ fontSize: '0.68rem', color: '#9ca3af', fontFamily: 'monospace' }}>{tbl.key}</div>
                    </div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 800, color: 'var(--gold-glow)' }}>
                    {tbl.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Backup & Disaster Recovery Guide */}
          <div className="gothic-card" style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#38bdf8', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Info size={16} /> Instrukcja Bezpieczeństwa & Kopia Zapasowa
            </h4>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.6 }}>
              Plik zrzutu JSON zawiera pełną kopię wszystkich 20 relacji w bazie SQLite (konta, hasła, przedmioty, postępy z mapy huncwotów, dzienniki lekcyjne, bank, krucza poczta, dekrety). Możesz go pobrać na dysk w dowolnym momencie jako kopię bezpieczeństwa oraz zaimportować z powrotem jednym kliknięciem.
            </p>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: 🪄 DODAWANIE & EDYCJA PRZEDMIOTU W SKLEPIE
          ========================================================================= */}
      {itemModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(3, 6, 11, 0.88)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            animation: 'fadeIn 0.2s ease'
          }}
          onClick={() => setItemModalOpen(false)}
        >
          <div
            className="gothic-card runic-corners"
            style={{
              width: '100%',
              maxWidth: '920px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'linear-gradient(135deg, rgba(14, 18, 28, 0.98) 0%, rgba(9, 12, 18, 0.99) 100%)',
              border: '1px solid var(--gold-ancient)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.95), 0 0 35px rgba(197, 159, 78, 0.25)',
              padding: '2rem',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(197, 159, 78, 0.2)', paddingBottom: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <ShoppingBag size={22} color="var(--gold-ancient)" />
                <h3 style={{ fontSize: '1.4rem', color: '#ffffff', fontFamily: 'var(--font-heading)', margin: 0 }}>
                  {editingItem ? `Edycja Artefaktu: ${editingItem.name}` : 'Dodaj Nowy Przedmiot do Rynku Kaupangr'}
                </h3>
              </div>

              <button
                onClick={() => setItemModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '0.4rem' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content: Form Left, Live Preview Right */}
            <form onSubmit={handleSaveItem} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '2rem' }}>
              {/* Form Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--gold-ancient)', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>
                    Nazwa Przedmiotu *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="np. Różdżka z Cisu i Włosa Kelpie"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="gothic-input"
                    style={{ width: '100%', padding: '0.55rem 0.8rem', fontSize: '0.88rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>
                      Kram / Sklep *
                    </label>
                    <select
                      value={formShopId}
                      onChange={(e) => setFormShopId(e.target.value)}
                      className="gothic-input"
                      style={{ width: '100%', padding: '0.55rem 0.8rem', fontSize: '0.82rem' }}
                    >
                      {shops.filter(s => s.id !== 'all').map(s => (
                        <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>
                      Kategoria *
                    </label>
                    <select
                      value={formCategorySlug}
                      onChange={(e) => setFormCategorySlug(e.target.value)}
                      className="gothic-input"
                      style={{ width: '100%', padding: '0.55rem 0.8rem', fontSize: '0.82rem' }}
                    >
                      <option value="wands">Różdżki</option>
                      <option value="robes">Szaty & Opończe</option>
                      <option value="books">Grimuary & Księgi</option>
                      <option value="potions">Eliksiry & Toksyny</option>
                      <option value="equipment">Wyposażenie Bojowe</option>
                      <option value="companions">Magiczni Towarzysze</option>
                      <option value="artifacts">Artefakty & Talizmany</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>
                      Cena (Skirniry ᛋ) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      className="gothic-input"
                      style={{ width: '100%', padding: '0.55rem 0.8rem', fontSize: '0.88rem', fontWeight: 700, color: 'var(--gold-glow)' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>
                      Rzadkość
                    </label>
                    <select
                      value={formRarity}
                      onChange={(e) => setFormRarity(e.target.value)}
                      className="gothic-input"
                      style={{ width: '100%', padding: '0.55rem 0.8rem', fontSize: '0.82rem' }}
                    >
                      <option value="Niezbędny">Niezbędny</option>
                      <option value="Zwykły">Zwykły</option>
                      <option value="Rzadki">Rzadki</option>
                      <option value="Epicki">Epicki</option>
                      <option value="Legendarne">Legendarne</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>
                      Zakon (Ograniczenie)
                    </label>
                    <select
                      value={formHouseExclusive}
                      onChange={(e) => setFormHouseExclusive(e.target.value)}
                      className="gothic-input"
                      style={{ width: '100%', padding: '0.55rem 0.8rem', fontSize: '0.82rem' }}
                    >
                      <option value="">Wszystkie Zakony</option>
                      <option value="reinhall">Tylko Reinhall</option>
                      <option value="bjornhall">Tylko Björnhall</option>
                      <option value="ravnheim">Tylko Ravnheim</option>
                      <option value="otergard">Tylko Otergard</option>
                    </select>
                  </div>
                </div>

                {/* Image / Graphic section */}
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '6px', border: '1px solid rgba(197, 159, 78, 0.2)' }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--gold-ancient)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                    <ImageIcon size={14} /> Zdjęcie / Grafika Przedmiotu (URL lub Wgranie z Dysku)
                  </label>

                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.6rem' }}>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/... lub wklej bezpośredni link"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      className="gothic-input"
                      style={{ flex: 1, padding: '0.45rem 0.75rem', fontSize: '0.82rem' }}
                    />
                    {formImageUrl && (
                      <button
                        type="button"
                        onClick={() => setFormImageUrl('')}
                        style={{ padding: '0.4rem 0.6rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                      >
                        Wyczyść
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <label
                      style={{
                        padding: '0.45rem 0.9rem',
                        background: 'rgba(56, 189, 248, 0.15)',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                        borderRadius: '4px',
                        color: '#7dd3fc',
                        fontSize: '0.76rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontWeight: 600
                      }}
                    >
                      <Upload size={13} /> Wgraj Plik z Dysku
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handleImageFileUpload(e, (url) => setFormImageUrl(url))}
                      />
                    </label>

                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      Rekomendowane proporcje: 1:1 lub 4:3 (JPG / WebP / PNG)
                    </div>
                  </div>

                  {/* Preset Quick Chips */}
                  <div style={{ marginTop: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.6rem' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                      Szybkie presety klimatycznych fotografii:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {STORE_ITEM_PRESETS.slice(0, 7).map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFormImageUrl(p.url)}
                          style={{
                            padding: '0.2rem 0.5rem',
                            background: formImageUrl === p.url ? 'rgba(197, 159, 78, 0.3)' : 'rgba(255,255,255,0.04)',
                            border: formImageUrl === p.url ? '1px solid var(--gold-ancient)' : '1px solid rgba(255,255,255,0.08)',
                            color: formImageUrl === p.url ? '#ffe8aa' : '#cbd5e1',
                            borderRadius: '3px',
                            fontSize: '0.7rem',
                            cursor: 'pointer'
                          }}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>
                      Ikona Emoji
                    </label>
                    <input
                      type="text"
                      value={formIcon}
                      onChange={(e) => setFormIcon(e.target.value)}
                      className="gothic-input"
                      style={{ width: '100%', padding: '0.5rem 0.8rem', fontSize: '1.1rem', textAlign: 'center' }}
                      maxLength={4}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>
                      Styl Ryciny Wektorowej SVG (Fallback)
                    </label>
                    <select
                      value={formPlaceholderType}
                      onChange={(e) => setFormPlaceholderType(e.target.value)}
                      className="gothic-input"
                      style={{ width: '100%', padding: '0.55rem 0.8rem', fontSize: '0.8rem' }}
                    >
                      <option value="wand_dark">Różdżka Mroku (wand_dark)</option>
                      <option value="wand_ancient">Różdżka Pradawna (wand_ancient)</option>
                      <option value="wand_runic">Różdżka Runiczna (wand_runic)</option>
                      <option value="wand_bone">Różdżka Kościana (wand_bone)</option>
                      <option value="robe_fur">Szata / Opończa Futrzana (robe_fur)</option>
                      <option value="robe_reindeer">Szata Renifera (robe_reindeer)</option>
                      <option value="robe_armor">Pancerz Bojowy (robe_armor)</option>
                      <option value="book_shadow">Grimuar Cieni (book_shadow)</option>
                      <option value="book_runic">Kodeks Runiczny (book_runic)</option>
                      <option value="potion_cauldron">Kociołek Alchemiczny (potion_cauldron)</option>
                      <option value="potion_phials">Fiolki Eliksirów (potion_phials)</option>
                      <option value="equipment_gauntlets">Rękawice Bojowe (equipment_gauntlets)</option>
                      <option value="pet_raven">Chowaniec / Kruk (pet_raven)</option>
                      <option value="artifact_pendant">Amulet / Talizman (artifact_pendant)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>
                    Krótki Opis Właściwości
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Opis magicznych właściwości, wymiarów i materiałów..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="gothic-input"
                    style={{ width: '100%', padding: '0.55rem 0.8rem', fontSize: '0.84rem', resize: 'vertical' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>
                    Lore / Cytat z Kronik Północy (Opcjonalnie)
                  </label>
                  <input
                    type="text"
                    placeholder="np. Wykuta w piecach Brokkura podczas koniunkcji planet."
                    value={formLore}
                    onChange={(e) => setFormLore(e.target.value)}
                    className="gothic-input"
                    style={{ width: '100%', padding: '0.55rem 0.8rem', fontSize: '0.82rem', fontStyle: 'italic' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                  <button
                    type="submit"
                    className="btn-durmstrang"
                    style={{ flex: 1, padding: '0.75rem', fontSize: '0.9rem', fontWeight: 800 }}
                  >
                    {editingItem ? 'Zapisz Zmiany w Artefakcie' : 'Dodaj Artefakt do Oferty Rynku'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setItemModalOpen(false)}
                    className="btn-durmstrang-secondary"
                    style={{ padding: '0.75rem 1.4rem', fontSize: '0.85rem' }}
                  >
                    Anuluj
                  </button>
                </div>
              </div>

              {/* Live Preview Column */}
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Sparkles size={13} /> Podgląd na Żywo Karty w Sklepie
                </div>

                <div
                  className="gothic-card runic-corners"
                  style={{
                    padding: '1.5rem',
                    background: 'rgba(13, 16, 23, 0.95)',
                    border: '1px solid var(--gold-ancient)',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.8)'
                  }}
                >
                  <div style={{ marginBottom: '1rem' }}>
                    <ItemPlaceholder
                      item={{
                        name: formName || 'Przykładowy Artefakt',
                        rarity: formRarity,
                        icon: formIcon,
                        placeholderType: formPlaceholderType,
                        imageUrl: formImageUrl,
                        image: formImageUrl
                      }}
                      size="normal"
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Store size={11} color="var(--gold-ancient)" />
                      {shops.find(s => s.id === formShopId)?.name || 'Kram Kaupangr'}
                    </span>
                    {formHouseExclusive && (
                      <span style={{ fontSize: '0.68rem', color: '#f87171', fontWeight: 600 }}>
                        Tylko: {formHouseExclusive.toUpperCase()}
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.15rem', color: '#ffffff', marginBottom: '0.4rem', lineHeight: 1.3, fontFamily: 'var(--font-heading)' }}>
                    {formName || 'Nazwa Artefaktu'}
                  </h3>

                  <p style={{ color: '#b0b7c3', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '0.8rem', minHeight: '40px' }}>
                    {formDescription || 'Tutaj pojawi się opis właściwości i zastosowania artefaktu...'}
                  </p>

                  {formLore && (
                    <div style={{ background: 'rgba(0,0,0,0.35)', padding: '0.5rem 0.75rem', borderRadius: '4px', borderLeft: '2px solid var(--gold-ancient)', fontSize: '0.78rem', color: '#cbd5e1', fontStyle: 'italic', marginBottom: '0.8rem' }}>
                      „{formLore}”
                    </div>
                  )}

                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#8c95a6', textTransform: 'uppercase' }}>Cena:</div>
                      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--gold-glow)' }}>
                        {formPrice || 0} ᛋ
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled
                      className="btn-durmstrang"
                      style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', opacity: 0.8 }}
                    >
                      <Coins size={12} /> Kup
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: 📸 SZYBKA ZMIANA ZDJĘCIA / GRAFIKI PRZEDMIOTU
          ========================================================================= */}
      {quickImageModalOpen && quickImageTargetItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(4, 7, 12, 0.88)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            animation: 'fadeIn 0.2s ease'
          }}
          onClick={() => setQuickImageModalOpen(false)}
        >
          <div
            className="gothic-card runic-corners"
            style={{
              width: '100%',
              maxWidth: '620px',
              background: 'linear-gradient(135deg, rgba(14, 18, 28, 0.98) 0%, rgba(9, 12, 18, 0.99) 100%)',
              border: '1px solid var(--gold-ancient)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.95), 0 0 35px rgba(197, 159, 78, 0.25)',
              padding: '2rem',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid rgba(197, 159, 78, 0.2)', paddingBottom: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ImageIcon size={20} color="var(--gold-ancient)" />
                <h3 style={{ fontSize: '1.25rem', color: '#ffffff', fontFamily: 'var(--font-heading)', margin: 0 }}>
                  Zmień Zdjęcie: {quickImageTargetItem.name}
                </h3>
              </div>
              <button
                onClick={() => setQuickImageModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Live Visual Preview */}
            <div style={{ marginBottom: '1.2rem' }}>
              <ItemPlaceholder
                item={{
                  ...quickImageTargetItem,
                  imageUrl: quickImageUrlInput,
                  image: quickImageUrlInput
                }}
                size="large"
              />
            </div>

            {/* Input URL */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.78rem', color: '#cbd5e1', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                Adres URL Zdjęcia (lub bezpośredni link):
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="https://..."
                  value={quickImageUrlInput}
                  onChange={(e) => setQuickImageUrlInput(e.target.value)}
                  className="gothic-input"
                  style={{ flex: 1, padding: '0.55rem 0.8rem', fontSize: '0.84rem' }}
                />
                {quickImageUrlInput && (
                  <button
                    type="button"
                    onClick={() => setQuickImageUrlInput('')}
                    style={{ padding: '0.4rem 0.7rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', borderRadius: '4px', cursor: 'pointer', fontSize: '0.78rem' }}
                  >
                    Wyczyść
                  </button>
                )}
              </div>
            </div>

            {/* File Upload Button */}
            <div style={{ marginBottom: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label
                style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  borderRadius: '4px',
                  color: '#7dd3fc',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontWeight: 600
                }}
              >
                <Upload size={14} /> Wgraj Zdjęcie z Dysku
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => handleImageFileUpload(e, (url) => setQuickImageUrlInput(url))}
                />
              </label>
              <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                Obsługiwane: JPG, PNG, WebP do 3MB
              </span>
            </div>

            {/* Presets Gallery */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--gold-ancient)', fontWeight: 700, marginBottom: '0.5rem' }}>
                Wybierz z gotowej galerii unikatowych fotografii:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {STORE_ITEM_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setQuickImageUrlInput(preset.url)}
                    style={{
                      padding: '0.3rem 0.6rem',
                      background: quickImageUrlInput === preset.url ? 'rgba(197, 159, 78, 0.3)' : 'rgba(255,255,255,0.04)',
                      border: quickImageUrlInput === preset.url ? '1px solid var(--gold-ancient)' : '1px solid rgba(255,255,255,0.08)',
                      color: quickImageUrlInput === preset.url ? '#ffe8aa' : '#cbd5e1',
                      borderRadius: '4px',
                      fontSize: '0.74rem',
                      cursor: 'pointer'
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
              <button
                onClick={handleSaveQuickImage}
                className="btn-durmstrang"
                style={{ flex: 1, padding: '0.75rem', fontSize: '0.88rem', fontWeight: 800 }}
              >
                Zapisz Grafikę Przedmiotu
              </button>
              <button
                onClick={() => setQuickImageModalOpen(false)}
                className="btn-durmstrang-secondary"
                style={{ padding: '0.75rem 1.4rem', fontSize: '0.85rem' }}
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
