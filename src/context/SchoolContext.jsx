import React, { createContext, useContext, useState, useEffect } from 'react';
import { tryParse, normalizePointValue } from './schoolUtils.js';
import { useNavigationState } from '../hooks/useNavigationState.js';
import { api } from '../api';
import { HOUSES } from '../data/seedHouses';
import { SUBJECTS } from '../data/seedSubjects';
import { STORE_ITEMS } from '../data/seedStore';
import { SEED_BANK_ACCOUNTS, SEED_BANK_TRANSACTIONS } from '../data/seedBank';
import { SEED_SHOPPING_LISTS } from '../data/seedShoppingLists';
import { SEED_LOTTERY_ROUNDS, SEED_LOTTERY_USER_TICKETS } from '../data/seedLottery';
import { LORE_ARCHIVES } from '../data/seedLore';
import { NEWS_ITEMS } from '../data/seedNews';
import { EVENTS } from '../data/seedEvents';
import { DEMO_ACCOUNTS, LEADERBOARD_STUDENTS, LEADERBOARD_STAFF, PENDING_APPLICATIONS } from '../data/seedStudents';
import { SEED_USERS } from '../data/seedUsers';
import { SECRETS } from '../data/seedSecrets';
import { SEED_LESSONS, SEED_POINT_TRANSACTIONS } from '../data/seedLessons';
import { SEED_TIMETABLE, DAYS_OF_WEEK, TIME_SLOTS } from '../data/seedTimetable';
import { CATEGORY_BANNERS } from '../data/categoryBanners';
import { DEFAULT_BLOCK_GRAPHICS, DURMSTRANG_PRESET_IMAGES, IMAGE_DIMENSIONS_GUIDE } from '../data/blockGraphics';
import { INITIAL_DOCUMENTS } from '../data/seedDocuments';

const SchoolContext = createContext();

export const SchoolProvider = ({ children }) => {
  const {
    activeView, setActiveView,
    activeHouseTab, setActiveHouseTab,
    activeSubjectId, setActiveSubjectId,
    activeLessonId, setActiveLessonId,
    activeLessonTab, setActiveLessonTab,
    activeDocumentSlug, setActiveDocumentSlug,
    activeDocumentCategory, setActiveDocumentCategory,
    activeGazetteIssueId, setActiveGazetteIssueId,
    activeExamId, setActiveExamId,
    activeExamAttemptId, setActiveExamAttemptId,
    memoryTab, setMemoryTab,
    memoryYearId, setMemoryYearId,
    memoryPersonId, setMemoryPersonId,
    memoryHouseKey, setMemoryHouseKey,
    activeHomeworkId, setActiveHomeworkId,
    activeHomeworkSubId, setActiveHomeworkSubId,
    navigateTo,
    navigateToDocumentModule,
    navigateToMemory,
    navigateToMemoryYear,
    navigateToMemoryPerson,
    navigateToMemoryOrder,
    navigateToAbsenceChamber,
    navigateToGazette,
    navigateToGazetteIssue,
    navigateToGazettePanel,
    navigateToGazetteArchive,
    navigateToExams,
    navigateToExamTaking,
    navigateToExamResult,
    navigateToExamCreator,
    navigateToExamGrading,
    navigateToExamBank,
  } = useNavigationState();
  const [homeworkDraftLessonData, setHomeworkDraftLessonData] = useState(null);
  const [homeworkAssignments, setHomeworkAssignments] = useState([]);
  const [homeworkOverview, setHomeworkOverview] = useState(null);
  const [homeworkTemplates, setHomeworkTemplates] = useState([]);
  const [homeworkQuickComments, setHomeworkQuickComments] = useState([]);

  // Users Database & Active Account
  const [users, setUsers] = useState(() => {
    const sanitizeUsers = (list) => {
      return (list || []).map(u => {
        const sanitizedUser = { ...u, points: normalizePointValue(u.points) };

        if (u.role === 'professor' || u.role === 'teacher' || u.role === 'admin' || u.role === 'headmaster') {
          return { ...sanitizedUser, house: null };
        }
        return sanitizedUser;
      });
    };

    localStorage.removeItem('durmstrang_users_db');
    return sanitizeUsers(SEED_USERS);
  });

  const [currentUserId, setCurrentUserId] = useState(() => {
    const saved = localStorage.getItem('durmstrang_current_user_id');
    if (saved === 'guest' || saved === 'null' || saved === '' || !saved) return null;
    return saved;
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login'); // 'login' | 'register'
  const [emailInboxOpen, setEmailInboxOpen] = useState(false);
  const [discordSimulatorOpen, setDiscordSimulatorOpen] = useState(false);

  const openAuthModal = (tab = 'login') => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  const currentUser = (currentUserId && currentUserId !== 'guest')
    ? (users.find(u => u.id === currentUserId) || null)
    : null;
  const currentRole = currentUser ? currentUser.role : 'guest';

  // Helper to retrieve current user safely across views
  const getCurrentUser = () => currentUser;

  // Emails & Raven Post Database
  const [emails, setEmails] = useState(() => {
    const saved = localStorage.getItem('durmstrang_emails_db');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return [
      {
        id: 'mail-welcome-valdemar',
        toEmail: 'valdemar@nordic.no',
        toName: 'Valdemar Krag-Hansen',
        from: 'dyrekcja@durmstrang.edu',
        fromName: 'Arcymistrzyni Valgerda Storm',
        subject: '[DURMSTRANG] Oficjalny Dekret Przyjęcia do Cytadeli Durmstrang',
        date: '2026-08-01 09:00',
        read: true,
        type: 'acceptance',
        body: `Szanowny Adepcie Valdemarze Krag-Hansen,

Z upoważnienia Rady Mistrzów Cytadeli Durmstrang mamy zaszczyt poinformować, że Twoje podanie rekrutacyjne zostało oficjalnie ROZPATRZONE POZYTYWNIE.

Twoja tożsamość została wpisana do Wiecznej Księgi Paktu 1294. Zgłoś się do Wielkiej Sali Hrafnhöll na Ceremonię Przydziału przed Kamieniem Przysięgi.

Z magicznym pozdrowieniem,
Arcymistrzyni Valgerda Storm
Dyrektor Cytadeli Durmstrang`
      }
    ];
  });

  // Current active user profiles for backward compatibility
  const [studentProfile, setStudentProfile] = useState(() => {
    const profile = tryParse('durmstrang_student', DEMO_ACCOUNTS.student || {});
    return { ...profile, points: normalizePointValue(profile?.points) };
  });

  const [professorProfile, setProfessorProfile] = useState(() => {
    return tryParse('durmstrang_prof', DEMO_ACCOUNTS.professor || {});
  });

  const [adminProfile, setAdminProfile] = useState(() => {
    return tryParse('durmstrang_admin', DEMO_ACCOUNTS.admin || {});
  });

  // Category Banners & Block Graphics CMS
  const [categoryBanners, setCategoryBanners] = useState(() => {
    const saved = localStorage.getItem('durmstrang_category_banners');
    if (!saved) return CATEGORY_BANNERS;
    try {
      const parsed = JSON.parse(saved);
      const updated = CATEGORY_BANNERS.map(def => {
        const custom = parsed.find(p => p.id === def.id);
        if (!custom) return def;
        const resolvedBg = def.bgImage?.startsWith('/')
          ? def.bgImage
          : (custom.bgImage || def.bgImage);
        return { ...def, ...custom, bgImage: resolvedBg };
      });
      return updated;
    } catch {
      return CATEGORY_BANNERS;
    }
  });

  const [blockGraphics, setBlockGraphics] = useState(() => {
    const saved = localStorage.getItem('durmstrang_block_graphics');
    if (!saved) return DEFAULT_BLOCK_GRAPHICS;
    try {
      const parsed = JSON.parse(saved);
      const updated = DEFAULT_BLOCK_GRAPHICS.map(def => {
        const custom = parsed.find(p => p.id === def.id);
        if (!custom) return def;
        const resolvedBg = def.bgImage?.startsWith('/')
          ? def.bgImage
          : (custom.bgImage || def.bgImage);
        return { ...def, ...custom, bgImage: resolvedBg };
      });
      return updated;
    } catch {
      return DEFAULT_BLOCK_GRAPHICS;
    }
  });

  // Official Documents & Custom Subpages State
  const [documents, setDocuments] = useState(() => {
    const saved = localStorage.getItem('durmstrang_documents_db');
    if (!saved) return INITIAL_DOCUMENTS;
    try {
      const parsed = JSON.parse(saved);
      // Keep custom user pages
      const customPages = parsed.filter(d => d.isCustom);
      // Merge initial official documents with any custom documents
      const merged = [
        ...INITIAL_DOCUMENTS,
        ...customPages.filter(c => !INITIAL_DOCUMENTS.some(init => init.id === c.id))
      ];
      localStorage.setItem('durmstrang_documents_db', JSON.stringify(merged));
      return merged;
    } catch {
      return INITIAL_DOCUMENTS;
    }
  });

  const saveDocument = async (doc) => {
    // 1. Local state update
    setDocuments(prev => {
      const exists = prev.some(d => d.id === doc.id || d.slug === doc.slug);
      const updated = exists
        ? prev.map(d => (d.id === doc.id || d.slug === doc.slug) ? { ...d, ...doc } : d)
        : [doc, ...prev];
      try {
        localStorage.setItem('durmstrang_documents_db', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
    setActiveDocumentSlug(doc.slug);

    // 2. Backend SQLite persistence
    if (backendAvailable) {
      try {
        const existing = documents.find(d => d.id === doc.id || d.slug === doc.slug);
        if (existing && existing.id) {
          const res = await api.updateDocument(existing.id, doc);
          if (res.ok && res.data) {
            setDocuments(prev => prev.map(d => d.id === existing.id ? res.data : d));
            return res.data;
          }
        } else {
          const res = await api.createDocument(doc);
          if (res.ok && res.data) {
            setDocuments(prev => [res.data, ...prev.filter(d => d.id !== doc.id && d.slug !== doc.slug)]);
            return res.data;
          }
        }
      } catch (err) {
        console.error('Error saving document to backend:', err);
      }
    }
    return doc;
  };

  const deleteDocument = async (idOrSlug) => {
    setDocuments(prev => {
      const updated = prev.filter(d => d.id !== idOrSlug && d.slug !== idOrSlug);
      try {
        localStorage.setItem('durmstrang_documents_db', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    if (backendAvailable) {
      try {
        await api.deleteDocument(idOrSlug);
      } catch (err) {
        console.error('Error deleting document from backend:', err);
      }
    }
  };

  const createCategoryBanner = async (newCat) => {
    const slug = newCat.id || newCat.categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const catObject = {
      id: slug,
      categoryName: newCat.categoryName.trim(),
      defaultScript: newCat.defaultScript?.trim() || newCat.categoryName.toLowerCase().trim(),
      themeColor: newCat.themeColor || 'var(--gold-ancient)',
      description: newCat.description?.trim() || `Kategoria: ${newCat.categoryName}`,
      bgGradient: newCat.bgGradient || 'radial-gradient(circle at 50% 60%, rgba(38, 28, 12, 0.95) 0%, rgba(6, 6, 8, 0.98) 100%)',
      bgType: newCat.bgType || 'citadel',
      bgImage: newCat.bgImage?.trim() || ''
    };

    setCategoryBanners(prev => {
      const exists = prev.some(b => b.id === slug);
      const updated = exists ? prev.map(b => b.id === slug ? { ...b, ...catObject } : b) : [...prev, catObject];
      try {
        localStorage.setItem('durmstrang_category_banners', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    if (backendAvailable) {
      try {
        await api.createCmsBanner(catObject);
      } catch (err) {
        console.error('Error creating banner on backend:', err);
      }
    }

    showNotification('Nowa Kategoria Utworzona', `Dodano nową kategorię edyktów: ${catObject.categoryName}`, 'success');
    return catObject;
  };

  const deleteCategoryBanner = async (id) => {
    setCategoryBanners(prev => {
      const updated = prev.filter(b => b.id !== id);
      try {
        localStorage.setItem('durmstrang_category_banners', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    if (backendAvailable) {
      try {
        await api.deleteCmsBanner(id);
      } catch (err) {
        console.error('Error deleting banner on backend:', err);
      }
    }

    showNotification('Kategoria Usunięta', 'Pomyślnie usunięto kategorię z rejestru.', 'info');
  };

  const updateCategoryBanner = async (id, patch) => {
    setCategoryBanners(prev => {
      const updated = prev.map(b => b.id === id ? { ...b, ...patch } : b);
      try {
        localStorage.setItem('durmstrang_category_banners', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    if (backendAvailable) {
      try {
        await api.updateCmsBanner(id, patch);
      } catch (err) {
        console.error('Error updating banner on backend:', err);
      }
    }

    showNotification('Baner Zaktualizowany', 'Zaktualizowano konfigurację grafiki dla wybranej kategorii.', 'success');
  };

  const createBlockGraphic = async (newBlock) => {
    const slug = newBlock.id || newBlock.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const blockObject = {
      id: slug,
      title: newBlock.title.trim(),
      location: newBlock.location?.trim() || 'Panel Boczny',
      rune: newBlock.rune?.trim() || 'ᛟ',
      defaultIcon: newBlock.defaultIcon || 'Shield',
      color: newBlock.color || 'var(--gold-ancient)',
      bgImage: newBlock.bgImage?.trim() || '',
      description: newBlock.description?.trim() || `Nagłówek sekcji ${newBlock.title}`
    };

    setBlockGraphics(prev => {
      const exists = prev.some(b => b.id === slug);
      const updated = exists ? prev.map(b => b.id === slug ? { ...b, ...blockObject } : b) : [...prev, blockObject];
      try {
        localStorage.setItem('durmstrang_block_graphics', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    if (backendAvailable) {
      try {
        await api.createCmsBlock(blockObject);
      } catch (err) {
        console.error('Error creating block on backend:', err);
      }
    }

    showNotification('Blok Dodany', `Dodano konfigurację dla bloku: ${blockObject.title}`, 'success');
    return blockObject;
  };

  const deleteBlockGraphic = async (id) => {
    setBlockGraphics(prev => {
      const updated = prev.filter(b => b.id !== id);
      try {
        localStorage.setItem('durmstrang_block_graphics', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    if (backendAvailable) {
      try {
        await api.deleteCmsBlock(id);
      } catch (err) {
        console.error('Error deleting block on backend:', err);
      }
    }

    showNotification('Blok Usunięty', 'Usunięto konfigurację bloku.', 'info');
  };

  const updateBlockGraphic = async (id, patch) => {
    setBlockGraphics(prev => {
      const updated = prev.map(b => b.id === id ? { ...b, ...patch } : b);
      try {
        localStorage.setItem('durmstrang_block_graphics', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    if (backendAvailable) {
      try {
        await api.updateCmsBlock(id, patch);
      } catch (err) {
        console.error('Error updating block on backend:', err);
      }
    }

    showNotification('Grafika Bloku Zapisana', 'Zaktualizowano grafikę nagłówka wybranego bloku bocznego.', 'success');
  };

  const resetCategoryBanners = async () => {
    localStorage.removeItem('durmstrang_category_banners');
    setCategoryBanners(CATEGORY_BANNERS);
    if (backendAvailable) {
      for (const b of CATEGORY_BANNERS) {
        await api.createCmsBanner(b).catch(() => {});
      }
    }
    showNotification('Przywrócono Domyślne', 'Przywrócono oryginalne banery runiczne kategorii.', 'info');
  };

  const resetBlockGraphics = async () => {
    localStorage.removeItem('durmstrang_block_graphics');
    setBlockGraphics(DEFAULT_BLOCK_GRAPHICS);
    if (backendAvailable) {
      for (const blk of DEFAULT_BLOCK_GRAPHICS) {
        await api.createCmsBlock(blk).catch(() => {});
      }
    }
    showNotification('Przywrócono Domyślne', 'Przywrócono domyślne grafiki bloków bocznych.', 'info');
  };


  // ==================== DZIENNIKI LEKCYJNE, KSIĘGA PUNKTÓW & RANKING ====================

  const [lessons, setLessons] = useState(() => {
    const saved = localStorage.getItem('durmstrang_lessons');
    if (!saved) return SEED_LESSONS;
    try {
      const parsed = JSON.parse(saved);
      const existingIds = new Set(parsed.map(l => l.id));
      const missing = SEED_LESSONS.filter(s => !existingIds.has(s.id));
      return [...parsed, ...missing];
    } catch {
      return SEED_LESSONS;
    }
  });

  const [pointLedger, setPointLedger] = useState(() => {
    const saved = localStorage.getItem('durmstrang_point_ledger');
    if (!saved) return SEED_POINT_TRANSACTIONS;
    try {
      return JSON.parse(saved);
    } catch {
      return SEED_POINT_TRANSACTIONS;
    }
  });

  const [pointAuditLogs, setPointAuditLogs] = useState(() => {
    return tryParse('durmstrang_point_audits', []);
  });

  const [rankingPeriod, setRankingPeriod] = useState('overall'); // 'overall' | 'school_year' | 'monthly' | 'weekly'

  // Dynamic calculation of house points from base + point transactions (Single Source of Truth)
  const [houseRankings, setHouseRankings] = useState(() => {
    return {
      period: 'overall',
      schoolYear: 'XIX Rok Szkolny (2026/2027)',
      term: 'Semestr Zimowy',
      standings: [
        { houseKey: 'reinhall', name: 'Reinhall', crestIcon: 'ᚦ', color: '#7a2632', secondaryColor: '#a8384b', basePoints: 0, lessonPoints: 0, totalPoints: 0, txCount: 0, momentum: 0, rank: 1 },
        { houseKey: 'bjornhall', name: 'Björnhall', crestIcon: 'ᛉ', color: '#35536f', secondaryColor: '#5b8aaf', basePoints: 0, lessonPoints: 0, totalPoints: 0, txCount: 0, momentum: 0, rank: 2 },
        { houseKey: 'ravnheim', name: 'Ravnheim', crestIcon: 'ᚱ', color: '#42385f', secondaryColor: '#7a6ea0', basePoints: 0, lessonPoints: 0, totalPoints: 0, txCount: 0, momentum: 0, rank: 3 },
        { houseKey: 'otergard', name: 'Otergard', crestIcon: 'ᛞ', color: '#23615b', secondaryColor: '#3aaa9f', basePoints: 0, lessonPoints: 0, totalPoints: 0, txCount: 0, momentum: 0, rank: 4 }
      ]
    };
  });

  // Houses state (derived from dynamic houseRankings so all views stay in sync)
  const [houses, setHouses] = useState(() => {
    return tryParse('durmstrang_houses', HOUSES);
  });

  // Fortress Guardian (Strażnik Twierdzy - odpowiednik Prefekta Naczelnego)
  const [fortressGuardian, setFortressGuardian] = useState(() => {
    return tryParse('durmstrang_fortress_guardian', {
      name: 'Valdemar Krag-Hansen',
      house: 'ravnheim',
      title: 'Strażnik Twierdzy Durmstrang',
      appointedAt: '2026-09-01',
      note: 'Wybrany jednogłośnie przez Radę Mistrzów Cytadeli.'
    });
  });

  const updateFortressGuardian = async (guardianData) => {
    setFortressGuardian(guardianData);
    try {
      localStorage.setItem('durmstrang_fortress_guardian', JSON.stringify(guardianData));
    } catch (_) {}

    if (backendAvailable) {
      try {
        await api.updateFortressGuardian(guardianData);
      } catch (err) {
        console.error('Error updating fortress guardian on backend:', err);
      }
    }

    showNotification('Strażnik Twierdzy Mianowany', `Zaktualizowano Strażnika Twierdzy: ${guardianData.name}`, 'success');
  };

  const updateHouseLeaders = async (houseId, { headOfHouse, prefect }) => {
    setHouses(prev => {
      const current = prev[houseId] || {};
      const updatedHouse = {
        ...current,
        ...(headOfHouse !== undefined ? { headOfHouse } : {}),
        ...(prefect !== undefined ? { prefect } : {})
      };
      const updated = { ...prev, [houseId]: updatedHouse };
      try {
        localStorage.setItem('durmstrang_houses', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    if (backendAvailable) {
      try {
        await api.updateHouse(houseId, { headOfHouse, prefect });
      } catch (err) {
        console.error(`Error updating leaders for house ${houseId} on backend:`, err);
      }
    }

    showNotification('Zakon Zaktualizowany', `Zapisano Opiekuna i Strażnika dla Zakonu ${houses[houseId]?.name || houseId}.`, 'success');
  };

  const [locations, setLocations] = useState([]);
  const [shops, setShops] = useState([]);
  const [elderFutharkRunes, setElderFutharkRunes] = useState([]);
  const [runeFormulas, setRuneFormulas] = useState([]);
  const [ceremonyQuestions, setCeremonyQuestions] = useState([]);
  const [salaryConfig, setSalaryConfig] = useState({});

  // ==================== PRZEDMIOTY (KATEDRY) ====================
  const [subjects, setSubjects] = useState(SUBJECTS);
  const [activeSubjectDetail, setActiveSubjectDetail] = useState(null);

  // ==================== PLAN LEKCJI & HARMONOGRAM ====================
  const [timetable, setTimetable] = useState(() => {
    const saved = localStorage.getItem('durmstrang_timetable');
    if (!saved) return SEED_TIMETABLE;
    try {
      const parsed = JSON.parse(saved);
      return (parsed && parsed.length > 0) ? parsed : SEED_TIMETABLE;
    } catch {
      return SEED_TIMETABLE;
    }
  });

  // News, Events, Applications
  const [news, setNews] = useState(() => {
    const saved = localStorage.getItem('durmstrang_news');
    if (!saved) return NEWS_ITEMS;
    try {
      const parsed = JSON.parse(saved);
      const existingIds = new Set(parsed.map(p => p.id));
      const missingSeed = NEWS_ITEMS.filter(s => !existingIds.has(s.id));
      return [...parsed, ...missingSeed];
    } catch {
      return NEWS_ITEMS;
    }
  });

  const [events, setEvents] = useState(() => {
    return tryParse('durmstrang_events', EVENTS);
  });

  const [pendingApplications, setPendingApplications] = useState(() => {
    return tryParse('durmstrang_apps', PENDING_APPLICATIONS);
  });

  const [students, setStudents] = useState(() => {
    return tryParse('durmstrang_students', LEADERBOARD_STUDENTS)
      .map(student => ({ ...student, points: normalizePointValue(student.points) }));
  });

  const [staffRanking, setStaffRanking] = useState(() => {
    return tryParse('durmstrang_staff_ranking', LEADERBOARD_STAFF);
  });

  // Runes & Workshop System
  const [userRunes, setUserRunes] = useState(() => {
    return tryParse('durmstrang_runes', []);
  });

  const [craftedFormulas, setCraftedFormulas] = useState(() => {
    return tryParse('durmstrang_crafted_formulas', ['formula-blood-shield']);
  });

  // ==================== ZADANIA DOMOWE I WYPRACOWANIA (TMD) ====================
  const [homeworkSubmissions, setHomeworkSubmissions] = useState(() => {
    const saved = localStorage.getItem('durmstrang_submissions');
    if (saved) { try { return JSON.parse(saved); } catch {} }
    return [];
  });

  // Raven Post Messages
  const [ravenMessages, setRavenMessages] = useState(() => {
    const saved = localStorage.getItem('durmstrang_messages');
    if (saved) { try { return JSON.parse(saved); } catch {} }
    return [
      {
        id: 'msg-1',
        from: 'Arcymistrzyni Valgerda Storm',
        to: 'Wszyscy Kadeci',
        subject: 'Witaj w murach Cytadeli Durmstrang',
        date: '2026-09-01',
        read: false,
        body: 'Niech mróz hartuje twoją wolę, a płomień wiedzy rozświetla najciemniejsze noce. Pamiętaj: w tych murach nie ma miejsca na przeciętność. Odwiedź Katedry i zgłoś się na pierwszą lekcję.'
      },
      {
        id: 'msg-2',
        from: 'Prof. Morana Vane',
        to: 'Valdemar Krag-Hansen',
        subject: 'Zbadanie anomalii w Krypcie Szeptów',
        date: '2026-09-08',
        read: true,
        body: 'Valdemarze, twój ostatni esej o barierach cienia był zadowalający. Oczekuję cię dziś po gaszeniu zniczy w Krypcie Szeptów — omówimy manuskrypt Eirika.'
      }
    ];
  });

  // Discovered Secrets & Lore
  const [discoveredSecrets, setDiscoveredSecrets] = useState(() => {
    return tryParse('durmstrang_secrets', []);
  });

  // Admin Audit Log
  const [auditLogs, setAuditLogs] = useState(() => {
    const saved = localStorage.getItem('durmstrang_logs');
    if (saved) { try { return JSON.parse(saved); } catch {} }
    return [
      { id: 'log-1', timestamp: '2026-09-01 10:00', admin: 'Arcymistrzyni Valgerda Storm', action: 'Inauguracja XIX Roku Szkolnego', detail: 'Reset punktacji generalnej i przydział bazowy.' },
      { id: 'log-2', timestamp: '2026-09-05 16:20', admin: 'Prof. Gunnar Vargson', action: '+50 pkt dla Zakonu Björnhall', detail: 'Zwycięstwo w eliminacjach turnieju pojedynkowego.' }
    ];
  });

  // ==================== BANK CYTADELI (SKÍRNISBANKI) ====================
  const [bankAccount, setBankAccount] = useState(() => {
    return tryParse('durmstrang_bank_account', SEED_BANK_ACCOUNTS[0]);
  });

  const [bankTransactions, setBankTransactions] = useState(() => {
    return tryParse('durmstrang_bank_tx', SEED_BANK_TRANSACTIONS);
  });

  const [teacherSalaries, setTeacherSalaries] = useState([]);

  // ==================== RYNEK KAUPANGR & SKLEPY ====================
  const [storeItems, setStoreItems] = useState(() => {
    const saved = localStorage.getItem('durmstrang_store_items');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (_) {}
    }
    return STORE_ITEMS;
  });
  const [shoppingLists, setShoppingLists] = useState(() => {
    return tryParse('durmstrang_shopping_lists', SEED_SHOPPING_LISTS);
  });
  const [selectedInspectorItem, setSelectedInspectorItem] = useState(null);

  // ==================== SKANDYNAWSKA LOTERIA ODYNA ====================
  const DEFAULT_LOTTERY = {
    id: 'lottery-round-1',
    roundNumber: 1,
    title: 'Wielkie Losowanie Przesilenia',
    ticketPrice: 20,
    jackpot: 2500,
    bonusHousePoints: 100,
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    totalTicketsSold: 0,
    runeCount: 6
  };

  const [currentLottery, setCurrentLottery] = useState(() => {
    return tryParse('durmstrang_current_lottery', SEED_LOTTERY_ROUNDS[0] || DEFAULT_LOTTERY);
  });

  const [userLotteryTickets, setUserLotteryTickets] = useState(() => {
    return tryParse('durmstrang_lottery_tickets', SEED_LOTTERY_USER_TICKETS);
  });

  const [lotteryHistory, setLotteryHistory] = useState(() => {
    const parsed = tryParse('durmstrang_lottery_history', SEED_LOTTERY_ROUNDS.slice(1));
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  });

  const [lotteryModalOpen, setLotteryModalOpen] = useState(false);

  // Completed Quests from Marauder's Map
  const [completedQuests, setCompletedQuests] = useState(() => {
    return tryParse('durmstrang_completed_quests', []);
  });

  // Visual Atmosphere settings
  const [snowEnabled, setSnowEnabled] = useState(true);
  const [notification, setNotification] = useState(null);
  const [backendAvailable, setBackendAvailable] = useState(false);

  // Load data from backend API on mount (with localStorage fallback)
  useEffect(() => {
    const loadFromAPI = async () => {
      const health = await api.health();
      if (!health.ok) {
        console.warn('[SchoolContext] Backend niedostępny — używam trybu lokalnego.');
        setBackendAvailable(false);
        return;
      }

      setBackendAvailable(true);
      console.log('[SchoolContext] Backend API dostępny — ładuję dane z SQLite.');

      // Load users
      const usersRes = await api.getUsers();
      const apiUsers = usersRes.ok
        ? usersRes.data.map(user => ({ ...user, points: normalizePointValue(user.points) }))
        : null;
      if (usersRes.ok && usersRes.data.length > 0) {
        setUsers(apiUsers);
      }
      const loadedUsers = apiUsers || users;
      const freshCurrentUser = loadedUsers.find(u => u.id === currentUserId) || null;
      const isAdminSession = freshCurrentUser?.role === 'admin';

      // Build student ranking from loaded users
      const studentRanking = loadedUsers
        .filter(u => u.role === 'student' && u.status === 'approved')
        .sort((a, b) => (b.points || 0) - (a.points || 0));
      if (studentRanking.length > 0) {
        setStudents(studentRanking);
      }

      // Build staff ranking from loaded users
      const staffRankingData = loadedUsers
        .filter(u => ['professor', 'teacher', 'admin', 'headmaster'].includes(u.role))
        .sort((a, b) => (b.points || 0) - (a.points || 0));
      if (staffRankingData.length > 0) {
        setStaffRanking(staffRankingData);
      }

      // Load emails
      const emailsRes = await api.getEmails();
      if (emailsRes.ok) {
        setEmails(emailsRes.data);
      }

      // Load news
      const newsRes = await api.getNews();
      if (newsRes.ok && newsRes.data.length > 0) {
        setNews(newsRes.data);
      }

      // Load lessons
      const lessonsRes = await api.getLessons();
      if (lessonsRes.ok && lessonsRes.data.length > 0) {
        setLessons(lessonsRes.data);
      }

      // Load rankings
      const rankRes = await api.getHouseRankings(rankingPeriod);
      if (rankRes.ok && rankRes.data.standings) {
        setHouseRankings(rankRes.data);
        // Sync houses starting points
        setHouses(prev => {
          const updated = { ...prev };
          rankRes.data.standings.forEach(s => {
            if (updated[s.houseKey]) {
              updated[s.houseKey] = {
                ...updated[s.houseKey],
                startingPoints: s.totalPoints
              };
            }
          });
          return updated;
        });
      }

      // Load ledger
      const ledgerRes = await api.getPointLedger();
      if (ledgerRes.ok) {
        setPointLedger(ledgerRes.data);
      }

      // Load audit logs
      const auditsRes = await api.getPointAuditLogs();
      if (auditsRes.ok) {
        setPointAuditLogs(auditsRes.data);
      }

      // Load admin audit logs from DB
      if (isAdminSession) {
        const adminLogsRes = await api.getAuditLogs();
        if (adminLogsRes.ok && adminLogsRes.data) {
          setAuditLogs(adminLogsRes.data);
        }
      }

      // Load pending applications (admin only)
      if (isAdminSession) {
        const appsRes = await api.getPendingApplications();
        if (appsRes.ok) {
          setPendingApplications(appsRes.data);
        }
      }

      // Load subjects (katedry) z backendu
      const subjectsRes = await api.getSubjects();
      if (subjectsRes.ok && subjectsRes.data.length > 0) {
        setSubjects(subjectsRes.data);
      }

      // Load domain data z backendu
      const [housesRes, locationsRes, shopsRes, futharkRes, runeFormulasRes, ceremonyRes, salaryRes, fortressGuardianRes] = await Promise.all([
        api.getHouses(),
        api.getLocations(),
        api.getShops(),
        api.getLotteryRunes(),
        api.getRuneFormulas(),
        api.getCeremonyQuestions(),
        api.getSalaryConfig(),
        api.getFortressGuardian()
      ]);
      if (housesRes.ok && housesRes.data.length > 0) {
        const housesObj = {};
        for (const h of housesRes.data) housesObj[h.id] = h;
        setHouses(housesObj);
      }
      if (fortressGuardianRes.ok && fortressGuardianRes.data && fortressGuardianRes.data.name) {
        setFortressGuardian(fortressGuardianRes.data);
      }
      if (locationsRes.ok && locationsRes.data.length > 0) setLocations(locationsRes.data);
      if (shopsRes.ok && shopsRes.data.length > 0) setShops(shopsRes.data);
      if (futharkRes.ok && futharkRes.data.length > 0) setElderFutharkRunes(futharkRes.data);
      if (runeFormulasRes.ok && runeFormulasRes.data.length > 0) setRuneFormulas(runeFormulasRes.data);
      if (ceremonyRes.ok && ceremonyRes.data.length > 0) setCeremonyQuestions(ceremonyRes.data);
      if (salaryRes.ok && salaryRes.data) setSalaryConfig(salaryRes.data);

      // Load runes catalog
      const runesCatRes = await api.getRunesCatalog();
      if (runesCatRes.ok && runesCatRes.data.length > 0) setUserRunes(runesCatRes.data);

      // Load timetable (plan lekcji) z backendu
      const ttRes = await api.getTimetable();
      if (ttRes.ok && ttRes.data.length > 0) {
        setTimetable(ttRes.data);
      }

      // Load Bank Account & Transactions
      if (currentUserId && currentUserId !== 'guest') {
        const accRes = await api.getBankAccount(currentUserId);
        if (accRes.ok) setBankAccount(accRes.data);
      }

      const txRes = await api.getBankTransactions();
      if (txRes.ok && txRes.data.length > 0) {
        setBankTransactions(txRes.data);
      }

      if (isAdminSession) {
        const salRes = await api.getTeacherSalaries();
        if (salRes.ok) setTeacherSalaries(salRes.data);
      }

      // Load Store Items & Shopping Lists
      const itemsRes = await api.getStoreItems();
      if (itemsRes.ok && itemsRes.data.length > 0) {
        setStoreItems(itemsRes.data);
      }

      const slRes = await api.getShoppingLists(currentUserId);
      if (slRes.ok && slRes.data.length > 0) {
        setShoppingLists(slRes.data);
      }

      // Load Lottery
      const lotRes = await api.getCurrentLottery(currentUserId);
      if (lotRes.ok && lotRes.data.round) {
        setCurrentLottery(lotRes.data.round);
        setUserLotteryTickets(lotRes.data.userTickets || []);
      }

      const lotHistRes = await api.getLotteryHistory();
      if (lotHistRes.ok && lotHistRes.data.length > 0) {
        setLotteryHistory(lotHistRes.data);
      }

      // Load Documents
      const docsRes = await api.getDocuments();
      if (docsRes.ok && docsRes.data.length > 0) {
        setDocuments(docsRes.data);
      }

      // Load CMS Banners & Blocks — merge z defaults, preferując lokalne ścieżki
      const bannersRes = await api.getCmsBanners();
      if (bannersRes.ok && bannersRes.data.length > 0) {
        const defaultIds = new Set(CATEGORY_BANNERS.map(b => b.id));
        const merged = CATEGORY_BANNERS.map(def => {
          const backend = bannersRes.data.find(b => b.id === def.id);
          if (!backend) return def;
          const resolvedBg = def.bgImage?.startsWith('/')
            ? def.bgImage
            : (backend.bgImage || def.bgImage);
          return { ...def, ...backend, bgImage: resolvedBg };
        });
        const backendOnly = bannersRes.data.filter(b => !defaultIds.has(b.id));
        setCategoryBanners([...merged, ...backendOnly]);
      }

      const blocksRes = await api.getCmsBlocks();
      if (blocksRes.ok && blocksRes.data.length > 0) {
        const defaultIds = new Set(DEFAULT_BLOCK_GRAPHICS.map(b => b.id));
        const merged = DEFAULT_BLOCK_GRAPHICS.map(def => {
          const backend = blocksRes.data.find(b => b.id === def.id);
          if (!backend) return def;
          const resolvedBg = def.bgImage?.startsWith('/')
            ? def.bgImage
            : (backend.bgImage || def.bgImage);
          return { ...def, ...backend, bgImage: resolvedBg };
        });
        const backendOnly = blocksRes.data.filter(b => !defaultIds.has(b.id));
        setBlockGraphics([...merged, ...backendOnly]);
      }

      // Load Calendar Events
      const eventsRes = await api.getEvents();
      if (eventsRes.ok && eventsRes.data.length > 0) {
        setEvents(eventsRes.data);
      }

      // Load Raven Messages (requires auth)
      if (currentUserId && currentUserId !== 'guest') {
        const ravenRes = await api.getRavenMessages();
        if (ravenRes.ok && ravenRes.data.length > 0) {
          setRavenMessages(ravenRes.data);
        }
      }

      // Load Homework Assignments & Submissions
      const hwRes = await api.getHomework({ studentId: currentUserId });
      if (hwRes.ok && hwRes.data) {
        setHomeworkAssignments(hwRes.data);
      }
      if (currentUserId && currentUserId !== 'guest') {
        const hwOverviewRes = await api.getStudentHomeworkOverview();
        if (hwOverviewRes.ok && hwOverviewRes.data) {
          setHomeworkOverview(hwOverviewRes.data);
        }
      }

      // Load User Quests, Secrets & Formulas
      if (currentUserId && currentUserId !== 'guest') {
        const questsRes = await api.getCompletedQuests(currentUserId);
        if (questsRes.ok) {
          setCompletedQuests(questsRes.data);
        }

        const secretsRes = await api.getDiscoveredSecrets(currentUserId);
        if (secretsRes.ok) {
          setDiscoveredSecrets(secretsRes.data.map(s => s.secretId));
        }

        const formsRes = await api.getCraftedFormulas(currentUserId);
        if (formsRes.ok && formsRes.data.length > 0) {
          setCraftedFormulas(formsRes.data.map(f => f.formulaId));
        }
      }
    };

    loadFromAPI();

    // Auto-polling co 30 sekund
    const pollInterval = setInterval(async () => {
      const lessonsRes = await api.getLessons();
      if (lessonsRes.ok && lessonsRes.data) {
        setLessons(lessonsRes.data);
      }
      const rankRes = await api.getHouseRankings(rankingPeriod);
      if (rankRes.ok && rankRes.data.standings) {
        setHouseRankings(rankRes.data);
      }
      const ledgerRes = await api.getPointLedger();
      if (ledgerRes.ok && ledgerRes.data) {
        setPointLedger(ledgerRes.data);
      }
      const ttRes = await api.getTimetable();
      if (ttRes.ok && ttRes.data) {
        setTimetable(ttRes.data);
      }
      const txRes = await api.getBankTransactions();
      if (txRes.ok && txRes.data) {
        setBankTransactions(txRes.data);
      }
      const lotRes = await api.getCurrentLottery(currentUserId);
      if (lotRes.ok && lotRes.data.round) {
        setCurrentLottery(lotRes.data.round);
        setUserLotteryTickets(lotRes.data.userTickets || []);
      }
      if (currentUserId && currentUserId !== 'guest') {
        const ravenRes = await api.getRavenMessages();
        if (ravenRes.ok && ravenRes.data) {
          setRavenMessages(ravenRes.data);
        }
      }
      if (currentUserId && currentUserId !== 'guest') {
        const hwRes = await api.getHomework({ studentId: currentUserId });
        if (hwRes.ok && hwRes.data) {
          setHomeworkSubmissions(hwRes.data);
        }
      }
    }, 30000);

    return () => clearInterval(pollInterval);
  }, [rankingPeriod, currentUserId]);

  // Dane użytkowników są prywatne i pozostają wyłącznie w pamięci bieżącej sesji.
  useEffect(() => {
    localStorage.removeItem('durmstrang_users_db');
  }, [users]);

  useEffect(() => {
    localStorage.setItem('durmstrang_current_user_id', currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem('durmstrang_lessons', JSON.stringify(lessons));
  }, [lessons]);

  useEffect(() => {
    localStorage.setItem('durmstrang_point_ledger', JSON.stringify(pointLedger));
  }, [pointLedger]);

  useEffect(() => {
    localStorage.setItem('durmstrang_houses', JSON.stringify(houses));
  }, [houses]);

  useEffect(() => {
    localStorage.setItem('durmstrang_timetable', JSON.stringify(timetable));
  }, [timetable]);

  useEffect(() => {
    localStorage.setItem('durmstrang_bank_account', JSON.stringify(bankAccount));
  }, [bankAccount]);

  useEffect(() => {
    localStorage.setItem('durmstrang_bank_tx', JSON.stringify(bankTransactions));
  }, [bankTransactions]);

  useEffect(() => {
    localStorage.setItem('durmstrang_shopping_lists', JSON.stringify(shoppingLists));
  }, [shoppingLists]);

  useEffect(() => {
    localStorage.setItem('durmstrang_current_lottery', JSON.stringify(currentLottery));
  }, [currentLottery]);

  useEffect(() => {
    localStorage.setItem('durmstrang_lottery_tickets', JSON.stringify(userLotteryTickets));
  }, [userLotteryTickets]);

  useEffect(() => {
    localStorage.setItem('durmstrang_completed_quests', JSON.stringify(completedQuests));
  }, [completedQuests]);

  useEffect(() => {
    localStorage.setItem('durmstrang_secrets', JSON.stringify(discoveredSecrets));
  }, [discoveredSecrets]);

  useEffect(() => {
    localStorage.setItem('durmstrang_crafted_formulas', JSON.stringify(craftedFormulas));
  }, [craftedFormulas]);

  useEffect(() => {
    localStorage.setItem('durmstrang_messages', JSON.stringify(ravenMessages));
  }, [ravenMessages]);

  useEffect(() => {
    localStorage.setItem('durmstrang_submissions', JSON.stringify(homeworkSubmissions));
  }, [homeworkSubmissions]);

  useEffect(() => {
    localStorage.setItem('durmstrang_events', JSON.stringify(events));
  }, [events]);

  // Push UI Notification Banner
  const showNotification = (titleOrOptions, message, type = 'info') => {
    const notificationData = titleOrOptions && typeof titleOrOptions === 'object'
      ? {
          title: titleOrOptions.title || '',
          message: titleOrOptions.message || '',
          type: titleOrOptions.type || 'info'
        }
      : { title: titleOrOptions, message, type };

    setNotification({ ...notificationData, id: Date.now() });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const addNotification = (message, type = 'info') => {
    showNotification('Twierdza Magii Durmstrang (TMD)', message, type);
  };

  // Apply an authoritative user snapshot returned by an atomic server action
  // without sending a second PATCH that could duplicate or overwrite the action.
  const applyServerUserSnapshot = (user) => {
    if (!user?.id) return false;
    setUsers(prev => {
      const exists = prev.some(entry => entry.id === user.id);
      return exists ? prev.map(entry => entry.id === user.id ? user : entry) : [user, ...prev];
    });
    if (user.role === 'student') {
      setStudents(prev => {
        const exists = prev.some(s => s.id === user.id);
        return exists ? prev.map(s => s.id === user.id ? user : s) : prev;
      });
      if (user.id === currentUserId || user.id === currentUser?.id) setStudentProfile(user);
    } else if (['professor', 'teacher', 'admin', 'headmaster'].includes(user.role)) {
      setStaffRanking(prev => {
        const exists = prev.some(s => s.id === user.id);
        return exists ? prev.map(s => s.id === user.id ? user : s) : prev;
      });
    }
    if (user.id === currentUserId || user.id === currentUser?.id) {
      setBankAccount(prev => ({ ...prev, balance: user.currency ?? prev.balance }));
    }
    return true;
  };

  // Update current user fields (avatar, gender, name, surname, points, xp, currency, inventory, etc.)
  const updateCurrentUser = async (updates) => {
    const targetId = currentUser?.id || currentUserId || studentProfile?.id || 'usr-valdemar';
    const computedFullName = updates.name && updates.surname
      ? `${updates.name.trim()} ${updates.surname.trim()}`
      : (updates.fullName || updates.full_name);
    const finalUpdates = {
      ...updates,
      ...(computedFullName ? { fullName: computedFullName, full_name: computedFullName } : {})
    };

    // 1. Update users state & local storage
    setUsers(prev => {
      const exists = prev.some(u => u.id === targetId);
      const nextUsers = exists
        ? prev.map(u => u.id === targetId ? { ...u, ...finalUpdates } : u)
        : [{ ...(currentUser || studentProfile || {}), id: targetId, ...finalUpdates }, ...prev];
      return nextUsers;
    });

    // Sync students/staffRanking with optimistic update
    const optimisticRole = finalUpdates.role || currentUser?.role || studentProfile?.role;
    if (optimisticRole === 'student') {
      setStudents(prev => prev.map(s => s.id === targetId ? { ...s, ...finalUpdates } : s));
    } else if (['professor', 'teacher', 'admin', 'headmaster'].includes(optimisticRole)) {
      setStaffRanking(prev => prev.map(s => s.id === targetId ? { ...s, ...finalUpdates } : s));
    }

    // 2. Update studentProfile / demo profile
    setStudentProfile(prev => {
      const nextProf = { ...prev, ...finalUpdates };
      try {
        localStorage.setItem('durmstrang_student', JSON.stringify(nextProf));
      } catch (_) {}
      return nextProf;
    });

    // 3. Update backend API
    if (backendAvailable && targetId && targetId !== 'guest') {
      try {
        const res = await api.updateUser(targetId, finalUpdates);
        if (res.ok && res.data) {
          const saved = res.data;
          setUsers(prev => prev.map(u => u.id === targetId ? saved : u));
          if (saved.role === 'student') {
            setStudents(prev => prev.map(s => s.id === targetId ? saved : s));
            setStudentProfile(saved);
          } else if (['professor', 'teacher', 'admin', 'headmaster'].includes(saved.role)) {
            setStaffRanking(prev => prev.map(s => s.id === targetId ? saved : s));
          }
          return saved;
        }
      } catch (err) {
        console.error('Error updating user on backend:', err);
      }
    }
    return finalUpdates;
  };

  // Award House Points & Student XP from activities/games
  const awardHousePoints = (houseKey, points, reason, studentId = null) => {
    const numericPoints = Number(points);
    if (!Number.isFinite(numericPoints) || numericPoints <= 0) {
      console.error('[awardHousePoints] Odrzucono nieprawidłową wartość punktów:', points);
      return false;
    }

    if (currentUser?.role === 'admin' && backendAvailable && houseKey) {
      api.adminAwardHousePoints({ house: houseKey, points: numericPoints, reason })
        .then(res => {
          if (!res.ok) {
            showNotification('Nie zapisano punktów', res.error || 'Operacja została odrzucona.', 'warning');
            return;
          }
          api.getHouseRankings(rankingPeriod).then(rankRes => {
            if (rankRes.ok && rankRes.data) setHouseRankings(rankRes.data);
          });
        });
      return true;
    }

    showNotification(
      'Tryb treningowy',
      'Ta aktywność nie ma jeszcze serwerowej weryfikacji, dlatego nie przyznaje punktów.',
      'info'
    );
    return false;

    /* Stary optymistyczny mechanizm pozostaje poniżej tylko do czasu usunięcia wywołań legacy. */

    const isStaff = currentUser && currentUser.role !== 'student';
    // Kadra zdobywa punkty wyłącznie w osobnym rankingu osobistym.
    // Nawet jeśli stary profil lub dana gra przekaże Zakon, nie wolno go zasilać.
    const targetHouse = isStaff ? null : (houseKey || currentUser?.house || null);
    const targetStudentId = studentId || currentUser?.id || null;
    const targetStudentName = currentUser?.fullName || currentUser?.username || 'Adept';

    // 1. Update House Rankings standings (tylko jeśli zakon istnieje)
    if (targetHouse) {
      setHouseRankings(prev => {
        const updatedStandings = (prev.standings || []).map(s => {
          if (s.houseKey === targetHouse) {
            const newLessonPts = (s.lessonPoints || 0) + numericPoints;
            const newTotalPts = (s.basePoints || 0) + newLessonPts;
            return { ...s, lessonPoints: newLessonPts, totalPoints: newTotalPts, txCount: (s.txCount || 0) + 1 };
          }
          return s;
        });
        updatedStandings.sort((a, b) => b.totalPoints - a.totalPoints);
        updatedStandings.forEach((s, idx) => { s.rank = idx + 1; });
        return { ...prev, standings: updatedStandings };
      });

      // 2. Update Houses state
      setHouses(prev => {
        const updated = { ...prev };
        if (updated[targetHouse]) {
          updated[targetHouse] = {
            ...updated[targetHouse],
            points: (updated[targetHouse].points || 0) + numericPoints
          };
        }
        return updated;
      });
    }

    // 3. Add transaction to point ledger
    const newTx = {
      id: `tx-act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      studentId: targetStudentId,
      studentName: targetStudentName,
      house: targetHouse || null,
      points: numericPoints,
      source: reason || 'Aktywność / Grywalizacja w Cytadeli',
      date: new Date().toISOString().slice(0, 10),
      isRevoked: false,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };
    setPointLedger(prev => [newTx, ...prev]);

    // 4. Update Current User points & XP
    if (currentUser) {
      const currentPts = normalizePointValue(currentUser.points);
      const currentXp = currentUser.xp || 0;
      const nextXp = currentUser.nextLevelXp || 1000;
      const addedXp = numericPoints * 10;
      let newXp = currentXp + addedXp;
      let newLevel = currentUser.level || 1;

      if (newXp >= nextXp) {
        newLevel += 1;
        newXp = newXp - nextXp;
        showNotification('Awans Kręgu Magii!', `Osiągnąłeś Krąg ${newLevel} w hierarchii Durmstrang!`, 'success');
      }

      updateCurrentUser({
        points: currentPts + numericPoints,
        xp: newXp,
        level: newLevel
      });
    }

    // 5. Update personal ranking (adepci vs kadra osobno)
    if (isStaff) {
      setStaffRanking(prev => {
        const updated = prev.map(s =>
          s.id === targetStudentId ? { ...s, points: normalizePointValue(s.points) + numericPoints } : s
        );
        updated.sort((a, b) => (b.points || 0) - (a.points || 0));
        return updated;
      });
    } else {
      setStudents(prev => {
        const updated = prev.map(s =>
          s.id === targetStudentId ? { ...s, points: normalizePointValue(s.points) + numericPoints } : s
        );
        updated.sort((a, b) => (b.points || 0) - (a.points || 0));
        return updated;
      });
    }

    // 6. Backend sync if available
    if (backendAvailable && targetStudentId) {
      api.awardPoints({
        studentId: targetStudentId,
        studentName: targetStudentName,
        house: targetHouse || undefined,
        points: numericPoints,
        reason: reason
      }).catch(() => {});
    }

    return true;
  };

  // Add Currency (Skirniry) to User & Bank
  const addCurrency = async (amount, reason = 'Nagroda z aktywności') => {
    if (!currentUser || !amount) return;
    showNotification(
      'Tryb treningowy',
      'Ta aktywność nie ma jeszcze serwerowej weryfikacji, dlatego nie zmienia salda Skirnirów.',
      'info'
    );
    return false;

    /* Stary optymistyczny mechanizm pozostaje poniżej tylko do czasu usunięcia wywołań legacy. */
    const currentCurr = currentUser.currency || 0;
    const newCurr = currentCurr + amount;

    updateCurrentUser({ currency: newCurr });
    setBankAccount(prev => ({ ...prev, balance: (prev.balance || 0) + amount }));

    const optimisticTx = {
      id: `tx-bank-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.fullName,
      amount,
      type: 'deposit',
      title: reason,
      date: new Date().toISOString().slice(0, 10),
      balanceAfter: newCurr
    };
    setBankTransactions(prev => [optimisticTx, ...prev]);

    if (backendAvailable) {
      try {
        const res = await api.depositCurrency({
          userId: currentUser.id,
          amount,
          type: 'inflow',
          title: reason,
          category: 'nagroda'
        });
        if (res.ok && res.data?.transaction) {
          setBankTransactions(prev => [res.data.transaction, ...prev.filter(t => t.id !== optimisticTx.id)]);
          setBankAccount(prev => ({ ...prev, balance: res.data.newBalance }));
        }
      } catch (err) {
        console.error('[addCurrency] Backend error:', err);
      }
    }
  };

  // Deduct Currency (Skirniry) from User & Bank
  const deductCurrency = async (amount, reason = 'Wydatek') => {
    if (!currentUser || !amount) return false;
    showNotification(
      'Operacja niedostępna',
      'Ten starszy sklep nie ma bezpiecznego rozliczenia serwerowego. Użyj oficjalnego Rynku Cytadeli.',
      'warning'
    );
    return false;

    /* Stary optymistyczny mechanizm pozostaje poniżej tylko do czasu usunięcia wywołań legacy. */
    const currentCurr = currentUser.currency || 0;
    if (currentCurr < amount) {
      showNotification('Brak Skirnirów', `Brakuje Ci ${amount - currentCurr} Skirnirów do wykonania tej transakcji.`, 'warning');
      return false;
    }
    const newCurr = currentCurr - amount;

    updateCurrentUser({ currency: newCurr });
    setBankAccount(prev => ({ ...prev, balance: Math.max(0, (prev.balance || 0) - amount) }));

    const optimisticTx = {
      id: `tx-bank-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.fullName,
      amount: -amount,
      type: 'withdrawal',
      title: reason,
      date: new Date().toISOString().slice(0, 10),
      balanceAfter: newCurr
    };
    setBankTransactions(prev => [optimisticTx, ...prev]);

    if (backendAvailable) {
      try {
        const res = await api.depositCurrency({
          userId: currentUser.id,
          amount: -amount,
          type: 'outflow',
          title: reason,
          category: 'wydatek'
        });
        if (res.ok && res.data?.transaction) {
          setBankTransactions(prev => [res.data.transaction, ...prev.filter(t => t.id !== optimisticTx.id)]);
          setBankAccount(prev => ({ ...prev, balance: res.data.newBalance }));
        }
      } catch (err) {
        console.error('[deductCurrency] Backend error:', err);
      }
    }

    return true;
  };

  // Add Item to Inventory
  const addInventoryItem = (item) => {
    if (!currentUser || !item) return;
    const newItem = {
      id: item.id || `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: item.name || 'Magiczny Przedmiot',
      icon: item.icon || '📦',
      rarity: item.rarity || 'Artefakt',
      price: item.price || 50,
      description: item.description || item.desc || 'Zdobyty podczas aktywności w Cytadeli.'
    };

    const currentInventory = currentUser.inventory || [];
    const updatedInventory = [newItem, ...currentInventory];

    updateCurrentUser({ inventory: updatedInventory });
    showNotification('Nowy Przedmiot w Ekwipunku', `Zdobyto: ${newItem.name} (${newItem.rarity})!`, 'success');
  };

  // Remove Item from Inventory
  const removeInventoryItem = (itemId) => {
    if (!currentUser) return;
    const currentInventory = currentUser.inventory || [];
    const updatedInventory = currentInventory.filter(i => i.id !== itemId);
    updateCurrentUser({ inventory: updatedInventory });
  };

  // Set Active Buff
  const setActiveBuff = (buff) => {
    if (!currentUser) return;
    updateCurrentUser({ activeBuff: buff });
  };

  // Submit Application from Character Creation Modal
  const submitApplication = async (appData) => {
    const appId = `app-${Date.now()}`;
    const newApp = {
      id: appId,
      studentId: `stud-${Date.now().toString().slice(-4)}`,
      name: `${appData.name} ${appData.surname}`,
      house: appData.preferredHouse || 'reinhall',
      date: new Date().toISOString().split('T')[0],
      avatar: appData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      origin: appData.origin,
      wand: appData.wand,
      patronus: appData.patronus,
      companion: appData.companion,
      appearance: appData.appearance,
      backstory: appData.backstory,
      status: 'pending'
    };

    const nextApps = [newApp, ...pendingApplications];
    setPendingApplications(nextApps);
    try {
      localStorage.setItem('durmstrang_apps', JSON.stringify(nextApps));
    } catch (_) {}

    // Zapis do bazy
    if (backendAvailable) {
      try {
        await api.createApplication({
          id: appId,
          name: appData.name,
          surname: appData.surname,
          email: appData.email || '',
          role: appData.role || 'student',
          origin: appData.origin || '',
          wand: appData.wand || '',
          patronus: appData.patronus || '',
          companion: appData.companion || '',
          appearance: appData.appearance || '',
          backstory: appData.backstory || ''
        });
      } catch (err) {
        console.error('[submitApplication] Backend error:', err);
      }
    }

    // Send confirmation raven email
    const confirmationEmail = {
      id: `mail-app-${Date.now()}`,
      toEmail: `${appData.name.toLowerCase()}@durmstrang.edu`,
      toName: `${appData.name} ${appData.surname}`,
      from: 'rekrutacja@durmstrang.edu',
      fromName: 'Wrota Rekrutacji Cytadeli',
      subject: '[POTWIERDZENIE] Twoje podanie do Cytadeli Durmstrang zostało przyjęte',
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      read: false,
      type: 'system',
      body: `Witaj, ${appData.name} ${appData.surname}!\n\nTwoje podanie rekrutacyjne zostało pomyślnie złożone do Rady Mistrzów Cytadeli Durmstrang.\n\nWyposażenie: ${appData.wand}\nPatronus / Duch zwierzęcy: ${appData.patronus}\n\nOczekuj na oficjalny dekret Arcymistrzyni i wezwanie przed Kamień Przysięgi na Ceremonię Przydziału!`
    };

    const nextEmails = [confirmationEmail, ...emails];
    setEmails(nextEmails);
    try {
      localStorage.setItem('durmstrang_emails_db', JSON.stringify(nextEmails));
    } catch (_) {}

    showNotification('Podanie Złożone!', 'Twoja karta tożsamości została przekazana Radzie Mistrzów. Sprawdź Kruczą Pocztę!', 'success');
  };

  // Sort into House after Sorting Ceremony
  const sortIntoHouse = async (houseId) => {
    if (currentRole !== 'student') {
      showNotification(
        'Rytuał Niedostępny',
        'Ceremonia Przydziału jest przeznaczona wyłącznie dla adeptów. Profesorowie i Dyrekcja nie należą do Zakonów.',
        'warning'
      );
      return false;
    }

    const targetHouse = houseId?.toLowerCase() || 'reinhall';
    const houseObj = houses[targetHouse] || Object.values(houses).find(h => h.id === targetHouse);
    const houseName = houseObj?.name || targetHouse;

    if (currentUser) {
      const currentPoints = currentUser.points || 0;
      const currentXp = currentUser.xp || 0;
      const starterInventory = currentUser.inventory || [];
      const houseRelic = {
        id: `relic-${targetHouse}`,
        name: `Pieczęć Zakonu ${houseName}`,
        icon: houseObj?.crestIcon || '🛡️',
        rarity: 'Pradawny Relikt',
        price: 150,
        description: `Święty emblemat przynależności do Zakonu ${houseName}. Emanuje aurą ${houseObj?.element || 'Północy'}.`
      };

      const updated = {
        house: targetHouse,
        points: currentPoints + 25,
        xp: currentXp + 150,
        inventory: starterInventory.some(i => i.id === houseRelic.id) ? starterInventory : [houseRelic, ...starterInventory]
      };

      await updateCurrentUser(updated);
      awardHousePoints(targetHouse, 25, `Przysięga wierności Zakonowi ${houseName} (Ceremonia)`);
    } else {
      setStudentProfile(prev => ({
        ...prev,
        house: targetHouse
      }));
    }

    showNotification('Przydział Dokonany!', `Kamień Przysięgi ogłosił Twoją przynależność do Zakonu: ${houseName}! (+25 HP, +150 XP)`, 'success');
    return true;
  };

  // Craft Rune Formula on Galdrastofa Altar
  const craftRuneFormula = async (runeIds, catalyst = 'Krew Renifera') => {
    if (!runeIds || runeIds.length < 2) return null;
    const sortedRunes = [...runeIds].sort();

    const foundFormula = runeFormulas.find(f => {
      const fRunes = [...f.runes].sort();
      return fRunes.length === sortedRunes.length && fRunes.every((val, idx) => val.toLowerCase() === sortedRunes[idx].toLowerCase());
    });

    if (!foundFormula) {
      showNotification('Nieznana formuła', 'Tylko formuły z katalogu mogą zostać rozliczone przez Warsztat.', 'warning');
      return null;
    }
    if (!backendAvailable) {
      showNotification('Backend Niedostępny', 'Wykuwanie z nagrodą wymaga bezpiecznego połączenia z serwerem.', 'warning');
      return null;
    }

    const craftRes = await api.craftFormula({
      formulaId: foundFormula.id,
      catalyst,
      runes: sortedRunes
    });
    if (!craftRes.ok) {
      showNotification('Nie wykuto formuły', craftRes.error || 'Serwer odrzucił formułę.', 'warning');
      return null;
    }
    if (craftRes.data?.user) {
      setUsers(prev => prev.map(user => user.id === currentUserId ? craftRes.data.user : user));
    }
    if (!craftedFormulas.includes(foundFormula.id)) {
      setCraftedFormulas(prev => [foundFormula.id, ...prev]);
    }
    const securedResult = {
      ...foundFormula,
      catalyst,
      rewardPoints: craftRes.data?.formula?.rewardPoints || 0,
      rewardCurrency: craftRes.data?.formula?.rewardCurrency || 0,
      alreadyCrafted: !!craftRes.data?.alreadyCrafted
    };
    showNotification(
      craftRes.data?.alreadyCrafted ? 'Formuła już znana' : 'Ukuto Formułę Runiczną!',
      craftRes.data?.message || `Stworzono: ${foundFormula.name}`,
      craftRes.data?.alreadyCrafted ? 'info' : 'success'
    );
    return securedResult;

    /* Stary klientowski mechanizm nagród pozostaje poniżej tylko do czasu usunięcia kodu legacy. */

    const formulaId = foundFormula?.id || `formula-custom-${Date.now()}`;
    const formulaName = foundFormula?.name || `Formuła Runiczna ${sortedRunes.map(r => r.toUpperCase()).join('-')}`;
    const formulaType = foundFormula?.type || 'Bojowa / Ochronna';
    const formulaEffect = foundFormula?.effect || `Wzmocnienie aury adeptem przy użyciu katalizatora: ${catalyst}.`;

    if (!craftedFormulas.includes(formulaId)) {
      const nextCrafted = [formulaId, ...craftedFormulas];
      setCraftedFormulas(nextCrafted);
      try {
        localStorage.setItem('durmstrang_crafted_formulas', JSON.stringify(nextCrafted));
      } catch (_) {}
    }

    if (backendAvailable) {
      try {
        await api.craftFormula({
          formulaId,
          name: formulaName,
          type: formulaType,
          catalyst,
          runes: sortedRunes,
          rewardPoints: 15,
          rewardCurrency: 20
        });
      } catch (err) {
        console.error('Error crafting formula on backend:', err);
      }
    }

    awardHousePoints(null, 15, `Ukucie Formuły: ${formulaName}`);
    addCurrency(20, 'Nagroda za pracę rzemieślniczą (Galdrastofa)');

    const result = {
      id: formulaId,
      name: formulaName,
      type: formulaType,
      effect: formulaEffect,
      catalyst: catalyst,
      runes: sortedRunes,
      rewardPoints: 15,
      rewardCurrency: 20
    };

    showNotification('Ukuto Formułę Runiczną!', `Stworzono: ${formulaName} (+15 HP, +20 Skirnirów)!`, 'success');
    return result;
  };

  // Discover Hidden Secret Rune
  const discoverSecret = async (secretId) => {
    if (discoveredSecrets.includes(secretId)) {
      showNotification('Znana Tajemnica', 'Ta pradawna runa została już przez Ciebie odczytana.', 'info');
      return;
    }

    if (!backendAvailable) {
      showNotification('Backend Niedostępny', 'Odkrycie sekretu musi zostać potwierdzone przez serwer.', 'warning');
      return false;
    }
    const secretRes = await api.discoverSecret({ secretId });
    if (!secretRes.ok) {
      showNotification('Nieznana tajemnica', secretRes.error || 'Serwer odrzucił odkrycie.', 'warning');
      return false;
    }
    if (secretRes.data?.user) {
      setUsers(prev => prev.map(user => user.id === currentUserId ? secretRes.data.user : user));
    }
    setDiscoveredSecrets(prev => prev.includes(secretId) ? prev : [...prev, secretId]);
    showNotification(
      secretRes.data?.alreadyDiscovered ? 'Znana Tajemnica' : 'Tajemnica Odkryta! ᚱ',
      secretRes.data?.message || 'Odkrycie zostało zapisane przez Cytadelę.',
      secretRes.data?.alreadyDiscovered ? 'info' : 'success'
    );
    return true;

    /* Stary klientowski mechanizm nagród pozostaje poniżej tylko do czasu usunięcia kodu legacy. */

    const nextSecrets = [...discoveredSecrets, secretId];
    setDiscoveredSecrets(nextSecrets);
    try {
      localStorage.setItem('durmstrang_secrets', JSON.stringify(nextSecrets));
    } catch (_) {}

    if (backendAvailable) {
      try {
        await api.discoverSecret({ secretId, points: 10, currency: 15 });
      } catch (err) {
        console.error('Error discovering secret on backend:', err);
      }
    }

    awardHousePoints(null, 10, `Odkrycie Prastarej Runy Cytadeli (${secretId})`);
    addCurrency(15, 'Skarb ukryty w runicznej szczelinie');
    showNotification('Tajemnica Odkryta! ᚱ', 'Odczytałeś ukrytą runę Cytadeli! Zdobywasz +10 Punktów Domu i +15 Skirnirów!', 'success');
  };

  // Complete Quest from Marauder's Map
  const completeMapQuest = async (questData) => {
    showNotification(
      'Zadania Mapy w przebudowie',
      'Starsze zadania nie przyznają już nagród. Skorzystaj z serwerowo weryfikowanych Ekspedycji.',
      'info'
    );
    return false;

    /* Stary klientowski mechanizm nagród pozostaje poniżej tylko do czasu migracji na Ekspedycje. */
    const { questId, questTitle, locationId, locationName, rewardPoints = 20, rewardXp = 50, rewardGalleons = 15, rewardItem } = questData;
    
    if (completedQuests.some(q => q.questId === questId || q.id === questId)) {
      showNotification('Misja Ukończona', 'To zadanie zostało już zrealizowane w tej sesji roku szkolnego.', 'info');
      return;
    }

    const completionRecord = {
      id: `comp-${currentUserId}-${questId}-${Date.now()}`,
      userId: currentUserId,
      questId,
      questTitle: questTitle || questId,
      locationId: locationId || '',
      locationName: locationName || 'Twierdza Magii Durmstrang',
      rewardPoints,
      rewardXp,
      rewardGalleons,
      rewardItem: typeof rewardItem === 'object' ? (rewardItem?.name || 'Artefakt') : (rewardItem || 'Artefakt'),
      completedAt: new Date().toISOString()
    };

    setCompletedQuests(prev => [completionRecord, ...prev]);
    try {
      localStorage.setItem('durmstrang_completed_quests', JSON.stringify([completionRecord, ...completedQuests]));
    } catch (_) {}

    if (backendAvailable) {
      try {
        const res = await api.completeQuest({
          questId,
          questTitle,
          locationId,
          locationName,
          rewardPoints,
          rewardXp,
          rewardGalleons,
          rewardItem
        });
        if (res.ok && res.data?.user) {
          setUsers(prev => prev.map(u => u.id === currentUserId ? res.data.user : u));
        }
      } catch (err) {
        console.error('Error completing quest on backend:', err);
      }
    }

    awardHousePoints(null, rewardPoints, `Side Quest Mapy: ${questTitle || questId}`);
    addCurrency(rewardGalleons, `Nagroda za quest w lokacji: ${locationName || 'Twierdza'}`);
    showNotification('Misja z Mapy Ukończona! 🧭', `Brawo! Zdobywasz +${rewardPoints} pkt, +${rewardXp} XP i +${rewardGalleons} Skirnirów!`, 'success');
  };

  // Send Raven Post Message
  const sendRavenMessage = async (toRecipient, subject, body, tag = 'posłaniec') => {
    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: currentUser?.fullName || 'Adept Durmstrangu',
      senderRole: currentUser?.role === 'admin' ? 'Dyrekcja' : currentUser?.role === 'professor' ? 'Profesor' : 'Adept',
      senderAvatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      recipient: toRecipient,
      subject: subject,
      body: body,
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      read: false,
      starred: false,
      tag: tag
    };

    setRavenMessages(prev => [newMsg, ...prev]);
    try {
      localStorage.setItem('durmstrang_messages', JSON.stringify([newMsg, ...ravenMessages]));
    } catch (_) {}

    if (backendAvailable) {
      try {
        const res = await api.sendRavenMessage({
          recipient: toRecipient,
          subject,
          body,
          tag
        });
        if (res.ok && res.data?.messageData) {
          setRavenMessages(prev => [res.data.messageData, ...prev.filter(m => m.id !== newMsg.id)]);
        }
      } catch (err) {
        console.error('Error sending raven message to backend:', err);
      }
    }

    showNotification('Kruk Posłany!', `Twój pergamin z pieczęcią poleciał do: ${toRecipient}!`, 'success');
    return newMsg;
  };

  const markRavenRead = async (id) => {
    setRavenMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
    if (backendAvailable) {
      try {
        await api.markRavenRead(id);
      } catch (_) {}
    }
  };

  const toggleRavenStar = async (id) => {
    setRavenMessages(prev => prev.map(m => m.id === id ? { ...m, starred: !m.starred } : m));
    if (backendAvailable) {
      try {
        await api.toggleRavenStar(id);
      } catch (_) {}
    }
  };

  const deleteRavenMessage = async (id) => {
    setRavenMessages(prev => prev.filter(m => m.id !== id));
    if (backendAvailable) {
      try {
        await api.deleteRavenMessage(id);
      } catch (_) {}
    }
    showNotification('Wiadomość Usunięta', 'List został zniszczony.', 'info');
  };

  // ==================== ZADANIA DOMOWE I WYPRACOWANIA (TMD) ====================

  const loadHomework = async (filters = {}) => {
    try {
      const studentId = currentUser?.id || currentUserId;
      const res = await api.getHomework({ ...filters, studentId });
      if (res.ok && res.data) {
        setHomeworkAssignments(res.data);
        return res.data;
      }
    } catch (err) {
      console.error('Error loading homework:', err);
    }
    return [];
  };

  const loadStudentHomeworkOverview = async () => {
    try {
      const res = await api.getStudentHomeworkOverview();
      if (res.ok && res.data) {
        setHomeworkOverview(res.data);
        return res.data;
      }
    } catch (err) {
      console.error('Error loading student homework overview:', err);
    }
    return null;
  };

  const getHomeworkDetails = async (id) => {
    try {
      const res = await api.getHomeworkDetails(id);
      if (res.ok && res.data) {
        return res.data;
      }
    } catch (err) {
      console.error('Error fetching homework details:', err);
    }
    return null;
  };

  const createHomeworkAssignment = async (data) => {
    try {
      const res = await api.createHomework(data);
      if (res.ok && res.data?.homework) {
        setHomeworkAssignments(prev => [res.data.homework, ...prev]);
        showNotification('Praca Domowa Zadana!', `Pomyślnie opublikowano zadanie: „${res.data.homework.title}”.`, 'success');
        return res.data.homework;
      }
    } catch (err) {
      console.error('Error creating homework:', err);
      showNotification('Błąd', err.message || 'Nie udało się zadać pracy domowej.', 'error');
    }
    return null;
  };

  const updateHomeworkAssignment = async (id, data) => {
    try {
      const res = await api.updateHomework(id, data);
      if (res.ok && res.data?.homework) {
        setHomeworkAssignments(prev => prev.map(hw => hw.id === id ? res.data.homework : hw));
        showNotification('Zaktualizowano', 'Zmiany w zadaniu zostały zapisane.', 'success');
        return res.data.homework;
      }
    } catch (err) {
      console.error('Error updating homework:', err);
      showNotification('Błąd', err.message || 'Nie udało się zaktualizować pracy domowej.', 'error');
    }
    return null;
  };

  const deleteHomeworkAssignment = async (id) => {
    try {
      await api.deleteHomework(id);
      setHomeworkAssignments(prev => prev.filter(hw => hw.id !== id));
      showNotification('Usunięto', 'Zadanie domowe zostało usunięte.', 'info');
      return true;
    } catch (err) {
      console.error('Error deleting homework:', err);
      showNotification('Błąd', 'Nie udało się usunąć zadania.', 'error');
    }
    return false;
  };

  const duplicateHomeworkAssignment = async (id) => {
    try {
      const res = await api.duplicateHomework(id);
      if (res.ok && res.data?.homework) {
        setHomeworkAssignments(prev => [res.data.homework, ...prev]);
        showNotification('Zduplikowano', 'Utworzono kopię zadania domowego.', 'success');
        return res.data.homework;
      }
    } catch (err) {
      console.error('Error duplicating homework:', err);
      showNotification('Błąd', 'Nie udało się skopiować zadania.', 'error');
    }
    return null;
  };

  const saveHomeworkDraft = async (id, data) => {
    try {
      const res = await api.saveHomeworkDraft(id, data);
      if (res.ok && res.data?.submission) {
        return res.data;
      }
    } catch (err) {
      console.error('Error saving homework draft:', err);
      throw err;
    }
  };

  const submitHomework = async (idOrData, maybeData) => {
    let homeworkId = idOrData;
    let payload = maybeData;

    // Support both signatures: submitHomework(id, data) and legacy submitHomework({ subjectId, ... })
    if (typeof idOrData === 'object' && idOrData !== null) {
      homeworkId = idOrData.homeworkId || idOrData.id || `hw-${idOrData.subjectId}`;
      payload = idOrData;
    }

    try {
      const res = await api.submitHomework(homeworkId, payload);
      if (res.ok && res.data?.submission) {
        showNotification('Praca Zapieczętowana!', 'Twoja praca została zapieczętowana i przekazana profesorowi.', 'success');
        await loadStudentHomeworkOverview();
        return res.data.submission;
      }
    } catch (err) {
      console.error('Error submitting homework:', err);
      showNotification('Błąd', err.message || 'Nie udało się oddać pracy domowej.', 'error');
      throw err;
    }
  };

  const gradeHomeworkSubmission = async (subId, data) => {
    try {
      const res = await api.gradeHomeworkSubmission(subId, data);
      if (res.ok && res.data?.submission) {
        showNotification('Praca Oceniona!', res.data.message || 'Wystawiono ocenę i komentarz.', 'success');
        if (res.data.rankings) {
          setHouseRankings(res.data.rankings);
        }
        return res.data.submission;
      }
    } catch (err) {
      console.error('Error grading homework:', err);
      showNotification('Błąd', err.message || 'Nie udało się ocenić pracy.', 'error');
      throw err;
    }
  };

  const returnHomeworkForRevision = async (subId, data) => {
    try {
      const res = await api.returnHomeworkForRevision(subId, data);
      if (res.ok && res.data?.submission) {
        showNotification('Zwrócono do Poprawy', 'Praca została odesłana adeptowi z uwagami.', 'info');
        return res.data.submission;
      }
    } catch (err) {
      console.error('Error returning homework for revision:', err);
      showNotification('Błąd', err.message || 'Nie udało się zwrócić pracy.', 'error');
      throw err;
    }
  };

  const setHomeworkException = async (id, data) => {
    try {
      const res = await api.setHomeworkException(id, data);
      if (res.ok && res.data?.exception) {
        showNotification('Wyjątek Ustawiony', res.data.message || 'Zapisano indywidualne warunki dla adepta.', 'success');
        return res.data.exception;
      }
    } catch (err) {
      console.error('Error setting exception:', err);
      showNotification('Błąd', err.message || 'Nie udało się ustawić wyjątku.', 'error');
    }
    return null;
  };

  const deleteHomeworkException = async (id, studentId) => {
    try {
      await api.deleteHomeworkException(id, studentId);
      showNotification('Wyjątek Usunięty', 'Przywrócono standardowe terminy dla adepta.', 'info');
      return true;
    } catch (err) {
      console.error('Error deleting exception:', err);
    }
    return false;
  };

  const loadHomeworkTemplates = async () => {
    try {
      const res = await api.getHomeworkTemplates();
      if (res.ok && res.data) {
        setHomeworkTemplates(res.data);
        return res.data;
      }
    } catch (err) {
      console.error('Error loading templates:', err);
    }
    return [];
  };

  const createHomeworkTemplate = async (data) => {
    try {
      const res = await api.createHomeworkTemplate(data);
      if (res.ok && res.data) {
        setHomeworkTemplates(prev => [res.data, ...prev]);
        showNotification('Szablon Zapisany', 'Nowy szablon jest dostępny w kreatorze.', 'success');
        return res.data;
      }
    } catch (err) {
      console.error('Error creating template:', err);
    }
    return null;
  };

  const deleteHomeworkTemplate = async (id) => {
    try {
      await api.deleteHomeworkTemplate(id);
      setHomeworkTemplates(prev => prev.filter(t => t.id !== id));
      showNotification('Usunięto Szablon', 'Szablon został usunięty z biblioteki.', 'info');
      return true;
    } catch (err) {
      console.error('Error deleting template:', err);
    }
    return false;
  };

  const loadHomeworkQuickComments = async () => {
    try {
      const res = await api.getHomeworkQuickComments();
      if (res.ok && res.data) {
        setHomeworkQuickComments(res.data);
        return res.data;
      }
    } catch (err) {
      console.error('Error loading quick comments:', err);
    }
    return [];
  };

  const createHomeworkQuickComment = async (data) => {
    try {
      const res = await api.createHomeworkQuickComment(data);
      if (res.ok && res.data) {
        setHomeworkQuickComments(prev => [...prev, res.data]);
        showNotification('Komentarz Zapisany', 'Dodano do biblioteki szybkich uwag.', 'success');
        return res.data;
      }
    } catch (err) {
      console.error('Error creating quick comment:', err);
    }
    return null;
  };

  const deleteHomeworkQuickComment = async (id) => {
    try {
      await api.deleteHomeworkQuickComment(id);
      setHomeworkQuickComments(prev => prev.filter(c => c.id !== id));
      return true;
    } catch (err) {
      console.error('Error deleting quick comment:', err);
    }
    return false;
  };

  // Navigation helpers for Homework
  const navigateToHomeworkCenter = (tab = 'all') => {
    setActiveView('homework');
    window.location.hash = '#/prace-domowe';
  };

  const navigateToHomeworkDetail = (id) => {
    setActiveHomeworkId(id);
    setActiveView('homework-detail');
    window.location.hash = `#/praca-domowa/${id}`;
  };

  const navigateToHomeworkCreator = (lessonData = null) => {
    setHomeworkDraftLessonData(lessonData);
    setActiveView('homework-creator');
    window.location.hash = '#/zadaj-prace';
  };

  const navigateToHomeworkGrading = (id, subId = null) => {
    setActiveHomeworkId(id);
    setActiveHomeworkSubId(subId);
    setActiveView('homework-grading');
    window.location.hash = id ? `#/sprawdzaj-prace/${id}` : '#/prace-domowe';
  };

  const uploadHomeworkAttachment = async (data) => {
    try {
      const res = await api.uploadHomeworkAttachment(data);
      return res;
    } catch (err) {
      console.error('Error uploading homework attachment:', err);
      throw err;
    }
  };

  const gradeHomework = gradeHomeworkSubmission;
  const deleteHomework = deleteHomeworkAssignment;

  // Events (Kalendarz)
  const addEvent = async (eventData) => {
    const id = eventData.id || `event-${Date.now()}`;
    const ev = { ...eventData, id };
    setEvents(prev => [...prev, ev]);
    try {
      localStorage.setItem('durmstrang_events', JSON.stringify([...events, ev]));
    } catch (_) {}

    if (backendAvailable) {
      try {
        await api.createEvent(ev);
      } catch (err) {
        console.error('Error creating event on backend:', err);
      }
    }
    showNotification('Wydarzenie Dodane', `Dodano do kalendarza: ${ev.title}`, 'success');
  };

  const updateEvent = async (id, patch) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
    if (backendAvailable) {
      try {
        await api.updateEvent(id, patch);
      } catch (err) {
        console.error('Error updating event on backend:', err);
      }
    }
    showNotification('Wydarzenie Zaktualizowane', 'Zapisano zmiany w kalendarzu.', 'success');
  };

  const deleteEvent = async (id) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    if (backendAvailable) {
      try {
        await api.deleteEvent(id);
      } catch (err) {
        console.error('Error deleting event on backend:', err);
      }
    }
    showNotification('Wydarzenie Usunięte', 'Usunięto z kalendarza roku.', 'info');
  };

  // Full Database Import / Restore from JSON
  const importDatabaseBackup = async (backupJson) => {
    if (!backupJson) return { ok: false, error: 'Brak danych kopii zapasowej.' };
    if (backendAvailable) {
      try {
        const res = await api.importDatabaseBackup(backupJson);
        if (res.ok) {
          showNotification('Baza Danych Przywrócona!', 'Pomyślnie i w 100% przywrócono stan Cytadeli z kopii zapasowej JSON!', 'success');
          // Reload from backend
          setTimeout(() => {
            window.location.reload();
          }, 1200);
          return { ok: true };
        } else {
          showNotification('Błąd Przywracania', res.error || 'Nie udało się przywrócić bazy.', 'error');
          return { ok: false, error: res.error };
        }
      } catch (err) {
        return { ok: false, error: err.message };
      }
    }
    return { ok: false, error: 'Backend SQLite jest niedostępny.' };
  };

  // React to News
  const reactToNews = async (newsId, reactionType = 'admiration') => {
    // Optimistic local update
    setNews(prev => {
      const updated = prev.map(item => {
        if (item.id === newsId) {
          const currentReactions = item.reactions || { admiration: 0, awe: 0, fire: 0, skull: 0 };
          return {
            ...item,
            reactions: { ...currentReactions, [reactionType]: (currentReactions[reactionType] || 0) + 1 }
          };
        }
        return item;
      });
      try {
        localStorage.setItem('durmstrang_news', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    if (backendAvailable) {
      try {
        const res = await api.reactToNews(newsId, reactionType);
        if (res.ok && res.data?.reactions) {
          setNews(prev => prev.map(item =>
            item.id === newsId ? { ...item, reactions: res.data.reactions } : item
          ));
        }
      } catch (err) {
        console.error('[reactToNews] Backend error:', err);
      }
    }
  };

  const [passwordRecoveryModalOpen, setPasswordRecoveryModalOpen] = useState(false);

  // Refresh rankings by period
  const fetchRankings = async (period = 'overall') => {
    setRankingPeriod(period);
    if (backendAvailable) {
      const res = await api.getHouseRankings(period);
      if (res.ok && res.data.standings) {
        setHouseRankings(res.data);
        return res.data;
      }
    }
    return houseRankings;
  };

  // Refresh all user-related state from API (used after direct DB edits)
  const refreshUsersFromApi = async () => {
    if (!backendAvailable) return;
    const res = await api.getUsers();
    if (!res.ok) return;
    const fetched = res.data.map(u => ({ ...u, points: normalizePointValue(u.points) }));
    setUsers(fetched);
    setStudents(
      fetched
        .filter(u => u.role === 'student' && u.status === 'approved')
        .sort((a, b) => (b.points || 0) - (a.points || 0))
    );
    setStaffRanking(
      fetched
        .filter(u => ['professor', 'teacher', 'admin', 'headmaster'].includes(u.role))
        .sort((a, b) => (b.points || 0) - (a.points || 0))
    );
  };

  // Refresh lessons list
  const refreshLessons = async (filters = {}) => {
    if (backendAvailable) {
      const res = await api.getLessons(filters);
      if (res.ok) {
        setLessons(res.data);
        return res.data;
      }
    }
    return lessons;
  };

  // Fetch full details of a single lesson (messages, participants, embeds)
  const getLessonDetails = async (lessonId) => {
    if (backendAvailable) {
      const res = await api.getLesson(lessonId);
      if (res.ok) {
        return res.data;
      }
    }
    return lessons.find(l => l.id === lessonId) || null;
  };

  // Publish Lesson (Changes status to 'published' and commits points to Ledger)
  const publishLesson = async (lessonId) => {
    if (backendAvailable) {
      const res = await api.publishLesson(lessonId);
      if (res.ok) {
        const { lesson, rankings } = res.data;
        setLessons(prev => {
          const exists = prev.some(l => l.id === lessonId);
          return exists ? prev.map(l => l.id === lessonId ? lesson : l) : [lesson, ...prev];
        });
        if (rankings) {
          setHouseRankings(rankings);
          setHouses(prev => {
            const updated = { ...prev };
            rankings.standings.forEach(s => {
              if (updated[s.houseKey]) {
                updated[s.houseKey] = {
                  ...updated[s.houseKey],
                  startingPoints: s.totalPoints
                };
              }
            });
            return updated;
          });
        }
        // Refresh ledger
        const ledgerRes = await api.getPointLedger();
        if (ledgerRes.ok) setPointLedger(ledgerRes.data);
        // Punktacja osobista jest przechowywana na kontach użytkowników.
        // Odśwież ranking adeptów od razu po zaksięgowaniu lekcji.
        await refreshUsersFromApi();

        showNotification('Dziennik Opublikowany', `Lekcja „${lesson.topic}” została wpisana do ksiąg Cytadeli. Punkty zasiliły Puchar Zakonów!`, 'success');
        return lesson;
      } else {
        showNotification('Błąd Publikacji', res.error || 'Nie udało się opublikować dziennika.', 'warning');
        return null;
      }
    }

    // Fallback: local simulation
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return null;

    const publishedLesson = {
      ...lesson,
      status: 'published',
      publishedAt: new Date().toISOString()
    };

    setLessons(prev => {
      const exists = prev.some(l => l.id === lessonId);
      return exists ? prev.map(l => l.id === lessonId ? publishedLesson : l) : [publishedLesson, ...prev];
    });

    // Commit points to local ledger
    const newTx = (lesson.participants || []).filter(p => p.pointsAwarded > 0 && p.isPresent).map(p => ({
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      studentId: p.studentId,
      studentName: p.studentName,
      house: p.house,
      points: p.pointsAwarded,
      source: `${lesson.subjectName} — ${lesson.topic}`,
      lessonId: lesson.id,
      professorId: lesson.professorId,
      professorName: lesson.professorName,
      date: lesson.date,
      comment: p.comment || 'Udział w lekcji',
      isRevoked: false,
      createdAt: new Date().toISOString()
    }));

    setPointLedger(prev => [...newTx, ...prev]);

    showNotification('Dziennik Opublikowany', `Lekcja „${lesson.topic}” została wpisana do kronik.`, 'success');
    return publishedLesson;
  };

  // Save / Update Lesson Draft
  const saveLessonDraft = async (lessonId, lessonData) => {
    if (backendAvailable) {
      const isNew = !lessons.some(l => l.id === lessonId);
      const res = isNew
        ? await api.createLesson({ ...lessonData, id: lessonId })
        : await api.updateLesson(lessonId, lessonData);
      if (res.ok) {
        const saved = res.data;
        setLessons(prev => {
          const exists = prev.some(l => l.id === saved.id);
          return exists ? prev.map(l => l.id === saved.id ? saved : l) : [saved, ...prev];
        });
        showNotification('Szkic Zapisany', 'Zmiany w dzienniku lekcyjnym zostały zachowane na pergaminie.', 'info');
        return saved;
      } else {
        showNotification('Błąd Zapisu', res.error || 'Nie udało się zapisać zmian.', 'warning');
        return null;
      }
    }

    // Fallback: local
    setLessons(prev => {
      const exists = prev.some(l => l.id === lessonId);
      const updated = { ...(prev.find(l => l.id === lessonId) || {}), ...lessonData, id: lessonId, updatedAt: new Date().toISOString() };
      return exists ? prev.map(l => l.id === lessonId ? updated : l) : [updated, ...prev];
    });
    showNotification('Szkic Zapisany', 'Zmiany w dzienniku lekcyjnym zostały zachowane.', 'info');
  };

  // Delete Lesson
  const deleteLesson = async (lessonId) => {
    if (backendAvailable) {
      const res = await api.deleteLesson(lessonId);
      if (res.ok) {
        setLessons(prev => prev.filter(l => l.id !== lessonId));
        if (res.data.rankings) setHouseRankings(res.data.rankings);
        const ledgerRes = await api.getPointLedger();
        if (ledgerRes.ok) setPointLedger(ledgerRes.data);
        showNotification('Dziennik Usunięty', 'Dziennik został usunięty, a punkty wycofane z rankingu.', 'info');
        return true;
      }
    }

    setLessons(prev => prev.filter(l => l.id !== lessonId));
    setPointLedger(prev => prev.filter(tx => tx.lessonId !== lessonId));
    showNotification('Dziennik Usunięty', 'Dziennik został usunięty.', 'info');
    return true;
  };

  // Correct Point Transaction (Admin / Professor) with audit trail
  const correctPointTransaction = async (transactionId, newPoints, reason) => {
    if (backendAvailable) {
      const res = await api.correctPointTransaction({
        transactionId,
        newPoints,
        reason,
        modifiedBy: currentUser?.fullName || 'Dyrekcja Cytadeli'
      });
      if (res.ok) {
        setPointLedger(prev => prev.map(tx => tx.id === transactionId ? res.data.transaction : tx));
        if (res.data.rankings) setHouseRankings(res.data.rankings);
        const auditsRes = await api.getPointAuditLogs();
        if (auditsRes.ok) setPointAuditLogs(auditsRes.data);
        showNotification('Korekta Punktów Zapisana', res.data.message, 'success');
        return true;
      } else {
        showNotification('Błąd Korekty', res.error || 'Nie udało się skorygować punktów.', 'warning');
        return false;
      }
    }

    // Fallback: local
    setPointLedger(prev => prev.map(tx => tx.id === transactionId ? { ...tx, points: parseInt(newPoints, 10), comment: `${tx.comment} [Korekta: ${reason}]` } : tx));
    showNotification('Korekta Zapisana', `Skorygowano liczbę punktów na ${newPoints}.`, 'success');
    return true;
  };

  // Force recalculate rankings
  const recalculateRankings = async () => {
    if (backendAvailable) {
      const res = await api.recalculateRankings();
      if (res.ok) {
        setHouseRankings(res.data.rankings);
        showNotification('Ranking Przeliczony', 'Punkty wszystkich Zakonów zostały zsynchronizowane z księgą transakcji.', 'success');
        return;
      }
    }
    showNotification('Ranking Przeliczony', 'Zaktualizowano stan punktacji.', 'info');
  };

  // Login user by username and password with status check (API-first)
  const loginUser = async (username, password) => {
    const res = await api.login(username, password);
    if (res.ok) {
      const { user } = res.data;
      localStorage.removeItem('durmstrang_auth_token');
      setUsers(prev => {
        const exists = prev.find(u => u.id === user.id);
        return exists ? prev.map(u => u.id === user.id ? user : u) : [user, ...prev];
      });
      setCurrentUserId(user.id);
      showNotification('Wrota Cytadeli Otwarte', `Zalogowano jako: ${user.fullName} (${user.role === 'student' ? 'Adept' : user.role === 'professor' ? 'Profesor' : (user.gender === 'czarodziejka' ? 'Arcymistrzyni' : 'Arcymistrz')})`, 'success');
      return true;
    } else {
      if (res.data?.status === 'pending') {
        showNotification('Podanie w Toku Weryfikacji', res.error, 'warning');
      } else if (res.data?.status === 'rejected') {
        showNotification('Podanie Odrzucone', res.error, 'warning');
      } else {
        showNotification('Błąd Autoryzacji', res.error || 'Nieprawidłowa nazwa adepta lub hasło.', 'warning');
      }
      return false;
    }
  };

  const logoutUser = async () => {
    await api.logout();
    setCurrentUserId(null);
    localStorage.setItem('durmstrang_current_user_id', 'guest');
    localStorage.removeItem('durmstrang_auth_token');
    showNotification('Wylogowano z Cytadeli', 'Złożono pieczęć. Sesja została pomyślnie zamknięta.', 'info');
  };

  const switchUser = (userId) => {
    if (userId !== currentUserId) showNotification('Zmiana Niedostępna', 'Zmiana konta wymaga wylogowania i ponownego uwierzytelnienia.', 'warning');
  };

  const hasPermission = (permission) => {
    switch (permission) {
      case 'canPublishNews':
      case 'canGrade':
      case 'canManageLessons':
        return currentRole === 'admin' || currentRole === 'professor';
      case 'canManageSchool':
      case 'canAccessCMS':
      case 'canModifyPoints':
      case 'canApproveApplications':
        return currentRole === 'admin';
      case 'canSubmitHomework':
      case 'canJoinCeremony':
        return currentRole === 'student';
      default:
        return false;
    }
  };

  const registerUser = async (userData) => {
    const res = await api.register(userData);
    if (res.ok) {
      const { user, email, emailDelivery } = res.data;
      setUsers(prev => [user, ...prev]);
      if (user.role === 'student') {
        setStudents(prev => [user, ...prev]);
      } else if (['professor', 'teacher', 'admin', 'headmaster'].includes(user.role)) {
        setStaffRanking(prev => [user, ...prev]);
      }
      if (email) setEmails(prev => [email, ...prev]);
      if (emailDelivery?.status === 'sent') {
        showNotification('Podanie Złożone Pomyślnie! ᛞ', `Karta tożsamości zarejestrowana. Potwierdzenie wysłano na: ${user.email}.`, 'success');
      } else {
        showNotification('Podanie Złożone Pomyślnie! ᛞ', 'Karta tożsamości została bezpiecznie zapisana. Kancelaria odnotowała problem z doręczeniem potwierdzenia.', 'warning');
      }
      return true;
    } else if (res.offline) {
      showNotification('Brak Połączenia z Serwerem', 'Rejestracja wymaga połączenia z serwerem Cytadeli. Spróbuj ponownie za chwilę.', 'warning');
      return false;
    } else {
      showNotification('Błąd Rejestracji', res.error || 'Błąd rejestracji podania.', 'warning');
      return false;
    }
  };

  const approveUser = async (userId) => {
    if (backendAvailable) {
      const res = await api.approveUser(userId, currentUser?.fullName || 'Rada Arcymistrzów');
      if (res.ok) {
        const { user, email, emailDelivery } = res.data;
        setUsers(prev => prev.map(u => u.id === userId ? user : u));
        if (user.role === 'student') {
          setStudents(prev => {
            const exists = prev.some(s => s.id === user.id);
            const updated = exists ? prev.map(s => s.id === user.id ? user : s) : [...prev, user];
            return updated.sort((a, b) => (b.points || 0) - (a.points || 0));
          });
        } else if (['professor', 'teacher', 'admin', 'headmaster'].includes(user.role)) {
          setStaffRanking(prev => {
            const exists = prev.some(s => s.id === user.id);
            return exists ? prev.map(s => s.id === user.id ? user : s) : [...prev, user];
          });
        }
        setPendingApplications(prev => prev.filter(app => app.userId !== userId && app.id !== userId));
        if (email) setEmails(prev => [email, ...prev]);
        if (emailDelivery?.status === 'sent' || user.role !== 'student') {
          showNotification('Podanie Zatwierdzone', `Zatwierdzono: ${user.fullName}.${emailDelivery?.status === 'sent' ? ' List przyjęcia wysłany.' : ''}`, 'success');
        } else {
          showNotification('Podanie Zatwierdzone', `Zatwierdzono: ${user.fullName}. Dostarczenie listu przyjęcia wymaga ponownej próby.`, 'warning');
        }
        return true;
      } else {
        showNotification('Nie zatwierdzono podania', res.error || 'Rada nie mogła zakończyć weryfikacji konta.', 'warning');
      }
    }
    return false;
  };

  const retryTransactionalEmail = async (userId, type) => {
    const res = await api.retryTransactionalEmail(userId, type);
    if (!res.ok) {
      showNotification('Nie wysłano wiadomości', res.error || 'Ponowna próba nie powiodła się.', 'warning');
      return false;
    }
    setUsers(prev => prev.map(user => user.id === userId
      ? { ...user, transactionalEmails: { ...(user.transactionalEmails || {}), [type]: res.data.emailDelivery } }
      : user));
    const sent = res.data.emailDelivery?.status === 'sent';
    showNotification(
      sent ? 'Wiadomość wysłana' : 'Nie wysłano wiadomości',
      sent ? 'Korespondencja została doręczona providerowi pocztowemu.' : 'Błąd został zapisany do diagnostyki.',
      sent ? 'success' : 'warning'
    );
    return res.data.emailDelivery;
  };

  const rejectUser = async (userId) => {
    if (backendAvailable) {
      const res = await api.rejectUser(userId, currentUser?.fullName || 'Dyrekcja');
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'rejected' } : u));
        setStudents(prev => prev.map(s => s.id === userId ? { ...s, status: 'rejected' } : s));
        setStaffRanking(prev => prev.map(s => s.id === userId ? { ...s, status: 'rejected' } : s));
        showNotification('Podanie Oddalone', 'Zgłoszenie zostało odrzucone.', 'info');
      }
    }
  };

  const resetPassword = async (username, newPassword) => {
    void username;
    void newPassword;
    showNotification('Bezpieczne Odzyskiwanie', 'Użyj jednorazowego kodu wysłanego na przypisany adres e-mail.', 'info');
    return false;
  };

  // Create Admin Account (from CMS)
  const createAdminAccount = async (adminData) => {
    if (backendAvailable) {
      const res = await api.createAdminAccount({
        ...adminData,
        adminName: currentUser?.fullName || 'Rada Dyrekcji'
      });
      if (res.ok && res.data.user) {
        const newUser = res.data.user;
        setUsers(prev => [newUser, ...prev]);
        if (['professor', 'teacher', 'admin', 'headmaster'].includes(newUser.role)) {
          setStaffRanking(prev => [newUser, ...prev]);
        } else if (newUser.role === 'student') {
          setStudents(prev => [newUser, ...prev]);
        }
        showNotification('Nowy Arcymistrz Mianowany', `Konto dla ${adminData.name} ${adminData.surname} zostało utworzone i przypieczętowane.`, 'success');
        return true;
      } else {
        showNotification('Błąd Tworzenia Konta', res.error || 'Nie udało się utworzyć konta.', 'warning');
        return false;
      }
    }

    showNotification(
      'Backend Niedostępny',
      'Konta administratora nie można utworzyć lokalnie. Uruchom bezpieczne API i spróbuj ponownie.',
      'warning'
    );
    return false;
  };

  const approveApplication = async (appId) => {
    const app = pendingApplications.find(a => a.id === appId || a.userId === appId);
    let approved = false;
    if (app && app.userId) {
      approved = await approveUser(app.userId);
    } else if (app) {
      approved = await approveUser(app.id);
    }
    if (approved) setPendingApplications(prev => prev.filter(a => a.id !== appId && a.userId !== appId));
  };

  const rejectApplication = async (appId) => {
    const app = pendingApplications.find(a => a.id === appId || a.userId === appId);
    if (app && app.userId) {
      await rejectUser(app.userId);
    } else if (app) {
      await rejectUser(app.id);
    }
    setPendingApplications(prev => prev.filter(a => a.id !== appId && a.userId !== appId));
  };

  // addHousePoints alias to awardHousePoints for CMS
  const addHousePoints = (houseKey, points, reason) => {
    awardHousePoints(houseKey, points, reason);
  };

  // News CRUD functions
  const addNewsArticle = async (newsData) => {
    if (backendAvailable) {
      const res = await api.createNews(newsData);
      if (res.ok) {
        setNews(prev => [res.data, ...prev]);
        showNotification('Edykt Opublikowany', `Wiadomość „${newsData.title}” została ogłoszona w Cytadeli.`, 'success');
        return res.data;
      }
    }
    const newArt = {
      id: `news-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      ...newsData
    };
    setNews(prev => [newArt, ...prev]);
    showNotification('Edykt Opublikowany', `Wiadomość „${newsData.title}” została ogłoszona.`, 'success');
    return newArt;
  };

  const updateNewsArticle = async (id, newsData) => {
    if (backendAvailable) {
      const res = await api.updateNews(id, newsData);
      if (res.ok) {
        setNews(prev => prev.map(n => n.id === id ? res.data : n));
        showNotification('Edykt Zaktualizowany', 'Zmiany zostały zapisane na pergaminie.', 'success');
        return res.data;
      }
    }
    setNews(prev => prev.map(n => n.id === id ? { ...n, ...newsData } : n));
    showNotification('Edykt Zaktualizowany', 'Zmiany zostały zapisane.', 'success');
  };

  const deleteNewsArticle = async (id) => {
    if (backendAvailable) {
      const res = await api.deleteNews(id);
      if (res.ok) {
        setNews(prev => prev.filter(n => n.id !== id));
        showNotification('Edykt Wymazany', 'Biuletyn został usunięty z archiwum.', 'info');
        return true;
      }
    }
    setNews(prev => prev.filter(n => n.id !== id));
    showNotification('Edykt Wymazany', 'Biuletyn został usunięty.', 'info');
  };

  const togglePinNews = async (id) => {
    const existing = news.find(n => n.id === id);
    if (!existing) return;
    const newPinned = !existing.pinned;
    if (backendAvailable) {
      const res = await api.updateNews(id, { pinned: newPinned });
      if (res.ok) {
        setNews(prev => prev.map(n => n.id === id ? res.data : n));
        return;
      }
    }
    setNews(prev => prev.map(n => n.id === id ? { ...n, pinned: newPinned } : n));
  };

  // ==================== FUNKCJE ZARZĄDZANIA PRZEDMIOTAMI ====================

  const getSubjectDetails = async (subjectId) => {
    if (backendAvailable) {
      const res = await api.getSubject(subjectId);
      if (res.ok) {
        setActiveSubjectDetail(res.data);
        return res.data;
      }
    }
    const staticSubject = subjects.find(s => s.id === subjectId);
    setActiveSubjectDetail(staticSubject || null);
    return staticSubject || null;
  };

  const updateSubject = async (subjectId, fields) => {
    if (backendAvailable) {
      const res = await api.updateSubject(subjectId, fields);
      if (res.ok) {
        setSubjects(prev => prev.map(s => s.id === subjectId ? res.data : s));
        if (activeSubjectDetail?.id === subjectId) {
          setActiveSubjectDetail(prev => prev ? {
            ...prev,
            ...res.data,
            grades: prev.grades || [],
            recentLessons: prev.recentLessons || [],
            stats: prev.stats || {}
          } : prev);
        }
        showNotification('Katedra Zaktualizowana', 'Dane przedmiotu zostały zapisane.', 'success');
        return res.data;
      }
    }
    showNotification('Błąd Aktualizacji', 'Nie udało się zaktualizować przedmiotu.', 'warning');
    return null;
  };

  const createSubject = async (data) => {
    if (backendAvailable) {
      const res = await api.createSubject(data);
      if (res.ok) {
        setSubjects(prev => [...prev, res.data]);
        showNotification('Katedra Powołana', `Przedmiot „${res.data.name}" wpisany do ksiąg.`, 'success');
        return res.data;
      }
    }
    showNotification('Błąd', 'Nie udało się utworzyć przedmiotu.', 'warning');
    return null;
  };

  const deleteSubject = async (subjectId) => {
    if (backendAvailable) {
      const res = await api.deleteSubject(subjectId);
      if (res.ok) {
        setSubjects(prev => prev.filter(s => s.id !== subjectId));
        showNotification('Katedra Zamknięta', 'Przedmiot wymazany z ksiąg.', 'info');
        return true;
      }
    }
    return false;
  };

  const updateSyllabus = async (subjectId, syllabus) => {
    if (backendAvailable) {
      const res = await api.updateSyllabus(subjectId, syllabus);
      if (res.ok) {
        setSubjects(prev => prev.map(s => s.id === subjectId ? { ...s, syllabus } : s));
        if (activeSubjectDetail?.id === subjectId) setActiveSubjectDetail(prev => prev ? { ...prev, syllabus } : prev);
        showNotification('Plan Nauczania Zapisany', 'Syllabus katedry został zaktualizowany.', 'success');
        return true;
      }
    }
    showNotification('Błąd', 'Nie udało się zapisać planu nauczania.', 'warning');
    return false;
  };

  const updateRegulations = async (subjectId, regulations) => {
    if (backendAvailable) {
      const res = await api.updateRegulations(subjectId, regulations);
      if (res.ok) {
        setSubjects(prev => prev.map(s => s.id === subjectId ? { ...s, regulations } : s));
        if (activeSubjectDetail?.id === subjectId) setActiveSubjectDetail(prev => prev ? { ...prev, regulations } : prev);
        showNotification('Regulamin Zapisany', 'Regulamin zajęć zaktualizowany.', 'success');
        return true;
      }
    }
    showNotification('Błąd', 'Nie udało się zapisać regulaminu.', 'warning');
    return false;
  };

  const addGrade = async (subjectId, gradeData) => {
    if (backendAvailable) {
      const res = await api.addGrade(subjectId, gradeData);
      if (res.ok) {
        if (activeSubjectDetail?.id === subjectId) {
          const refreshed = await api.getSubject(subjectId);
          if (refreshed.ok) setActiveSubjectDetail(refreshed.data);
        }
        showNotification('Ocena Wystawiona', `Ocena ${res.data.gradeLabel} dla ${res.data.studentName} wpisana do księgi.`, 'success');
        return res.data;
      }
    }
    showNotification('Błąd', 'Nie udało się wystawić oceny.', 'warning');
    return null;
  };

  const deleteGrade = async (subjectId, gradeId) => {
    if (backendAvailable) {
      const res = await api.deleteGrade(subjectId, gradeId);
      if (res.ok) {
        if (activeSubjectDetail?.id === subjectId) {
          setActiveSubjectDetail(prev => prev ? { ...prev, grades: (prev.grades || []).filter(g => g.id !== gradeId) } : prev);
        }
        showNotification('Ocena Usunięta', 'Wpis wymazany z księgi ocen.', 'info');
        return true;
      }
    }
    return false;
  };

  const sendEmail = (emailData) => {
    const newMail = {
      id: `mail-${Date.now()}`,
      ...emailData,
      date: new Date().toLocaleDateString('pl-PL') + ' ' + new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
      read: false
    };
    setEmails(prev => [newMail, ...prev]);
    showNotification('Nowy E-mail w Skrzynce', `Odebrano: „${newMail.subject}”`, 'info');
  };

  // ==================== METODY PLANU LEKCJI & HARMONOGRAMU ====================
  const fetchTimetable = async (filters = {}) => {
    if (backendAvailable) {
      const res = await api.getTimetable(filters);
      if (res.ok) {
        setTimetable(res.data);
        return res.data;
      }
    }
    return timetable;
  };

  const addTimetableEntry = async (entryData) => {
    if (currentRole !== 'admin') {
      showNotification('Brak Uprawnień', 'Tylko Dyrekcja Cytadeli może dodawać nowe zajęcia do planu lekcji.', 'error');
      return null;
    }
    if (backendAvailable) {
      const res = await api.createTimetableEntry(entryData);
      if (res.ok) {
        setTimetable(prev => [...prev, res.data]);
        showNotification('Zajęcia Dodane', `${res.data.subjectName} dodano do planu (${res.data.dayName}, ${res.data.startTime}).`, 'success');
        return res.data;
      } else {
        showNotification('Błąd Dodawania', res.error || 'Nie udało się dodać zajęć do planu.', 'error');
        return null;
      }
    }
    // Fallback local
    const newEntry = {
      id: `tt-${Date.now()}`,
      ...entryData,
      status: entryData.status || 'scheduled',
      isActive: true,
      createdAt: new Date().toISOString()
    };
    setTimetable(prev => [...prev, newEntry]);
    showNotification('Zajęcia Dodane', `${newEntry.subjectName} (${newEntry.dayName}, ${newEntry.startTime}).`, 'success');
    return newEntry;
  };

  const updateTimetableEntry = async (id, entryData) => {
    if (currentRole !== 'admin') {
      showNotification('Brak Uprawnień', 'Tylko Dyrekcja Cytadeli może edytować zajęcia w planie.', 'error');
      return null;
    }
    if (backendAvailable) {
      const res = await api.updateTimetableEntry(id, entryData);
      if (res.ok) {
        setTimetable(prev => prev.map(t => t.id === id ? res.data : t));
        showNotification('Plan Zaktualizowany', `Pomyślnie zaktualizowano zajęcia: ${res.data.subjectName}.`, 'success');
        return res.data;
      } else {
        showNotification('Błąd Edycji', res.error || 'Nie udało się zaktualizować zajęć w planie.', 'error');
        return null;
      }
    }
    // Fallback local
    setTimetable(prev => prev.map(t => t.id === id ? { ...t, ...entryData, updatedAt: new Date().toISOString() } : t));
    showNotification('Plan Zaktualizowany', 'Zapisano zmiany w grafiku.', 'success');
    return true;
  };

  const substituteTimetableEntry = async (id, subData) => {
    if (currentRole !== 'admin') {
      showNotification('Brak Uprawnień', 'Tylko Dyrekcja Cytadeli może wyznaczać i wpisywać zastępstwa.', 'error');
      return null;
    }
    if (backendAvailable) {
      const res = await api.substituteTimetableEntry(id, subData);
      if (res.ok) {
        setTimetable(prev => prev.map(t => t.id === id ? res.data : t));
        showNotification('Zastępstwo Wprowadzone', `Zastępca: ${res.data.substituteProfessorName} dla ${res.data.subjectName}.`, 'warning');
        return res.data;
      } else {
        showNotification('Błąd Zastępstwa', res.error || 'Nie udało się wyznaczyć zastępstwa.', 'error');
        return null;
      }
    }
    // Fallback local
    setTimetable(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: 'substitution',
          originalProfessorName: t.originalProfessorName || t.professorName,
          substituteProfessorId: subData.substituteProfessorId || '',
          substituteProfessorName: subData.substituteProfessorName,
          substitutionReason: subData.substitutionReason || '',
          classroom: subData.classroom || t.classroom,
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    }));
    showNotification('Zastępstwo Wprowadzone', `Zastępca: ${subData.substituteProfessorName}`, 'warning');
    return true;
  };

  const cancelTimetableEntry = async (id, reason) => {
    const entry = timetable.find(t => t.id === id);
    const isDirector = currentRole === 'admin';
    const isOwnerProf = currentRole === 'professor' && entry && (
      (currentUser && entry.professorId === currentUser.id) ||
      (currentUser && entry.professorName && (
        (currentUser.fullName && entry.professorName.toLowerCase().includes(currentUser.fullName.toLowerCase())) ||
        (currentUser.name && entry.professorName.toLowerCase().includes(currentUser.name.toLowerCase())) ||
        (currentUser.surname && entry.professorName.toLowerCase().includes(currentUser.surname.toLowerCase()))
      ))
    );

    if (!isDirector && !isOwnerProf) {
      showNotification('Brak Uprawnień', 'Możesz odwołać wyłącznie swoje własne zajęcia lub wymagane są uprawnienia Dyrekcji.', 'error');
      return null;
    }

    if (backendAvailable) {
      const res = await api.cancelTimetableEntry(id, reason);
      if (res.ok) {
        setTimetable(prev => prev.map(t => t.id === id ? res.data : t));
        showNotification('Zajęcia Odwołane', `Lekcja ${res.data.subjectName} została odwołana.`, 'warning');
        return res.data;
      } else {
        showNotification('Błąd Odwołania', res.error || 'Nie udało się odwołać zajęć.', 'error');
        return null;
      }
    }
    // Fallback local
    setTimetable(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: 'cancelled',
          originalProfessorName: t.originalProfessorName || t.professorName,
          cancellationReason: reason || 'Zajęcia odwołane decyzją Dyrekcji Cytadeli.',
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    }));
    showNotification('Zajęcia Odwołane', 'Odwołano wybraną lekcję w grafiku.', 'warning');
    return true;
  };

  const restoreTimetableEntry = async (id) => {
    const entry = timetable.find(t => t.id === id);
    const isDirector = currentRole === 'admin';
    const isOwnerProf = currentRole === 'professor' && entry && (
      (currentUser && entry.professorId === currentUser.id) ||
      (currentUser && entry.professorName && (
        (currentUser.fullName && entry.professorName.toLowerCase().includes(currentUser.fullName.toLowerCase())) ||
        (currentUser.name && entry.professorName.toLowerCase().includes(currentUser.name.toLowerCase())) ||
        (currentUser.surname && entry.professorName.toLowerCase().includes(currentUser.surname.toLowerCase()))
      ))
    );

    if (!isDirector && !isOwnerProf) {
      showNotification('Brak Uprawnień', 'Możesz przywrócić wyłącznie swoje własne zajęcia lub wymagane są uprawnienia Dyrekcji.', 'error');
      return null;
    }

    if (backendAvailable) {
      const res = await api.restoreTimetableEntry(id);
      if (res.ok) {
        setTimetable(prev => prev.map(t => t.id === id ? res.data : t));
        showNotification('Zajęcia Przywrócone', `Lekcja ${res.data.subjectName} odbywa się normalnie według planu.`, 'success');
        return res.data;
      } else {
        showNotification('Błąd Przywracania', res.error || 'Nie udało się przywrócić zajęć.', 'error');
        return null;
      }
    }
    // Fallback local
    setTimetable(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: 'scheduled',
          substituteProfessorId: '',
          substituteProfessorName: '',
          substitutionReason: '',
          cancellationReason: '',
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    }));
    showNotification('Zajęcia Przywrócone', 'Zajęcia przywrócone do regularnego trybu.', 'success');
    return true;
  };

  const deleteTimetableEntry = async (id) => {
    if (currentRole !== 'admin') {
      showNotification('Brak Uprawnień', 'Tylko Dyrekcja Cytadeli może usuwać zajęcia z planu.', 'error');
      return false;
    }
    if (backendAvailable) {
      const res = await api.deleteTimetableEntry(id);
      if (res.ok) {
        setTimetable(prev => prev.filter(t => t.id !== id));
        showNotification('Zajęcia Usunięte', 'Wpis wymazano z planu lekcji.', 'info');
        return true;
      } else {
        showNotification('Błąd Usuwania', res.error || 'Nie udało się usunąć zajęć.', 'error');
        return false;
      }
    }
    // Fallback local
    setTimetable(prev => prev.filter(t => t.id !== id));
    showNotification('Zajęcia Usunięte', 'Usunięto zajęcia z lokalnego grafiku.', 'info');
    return true;
  };

  // ==================== METODY BANKU (SKÍRNISBANKI) ====================

  const transferFunds = async ({ recipientId, amount, title, note }) => {
    if (!currentUser) {
      showNotification('Wymagane Logowanie', 'Musisz być zalogowany, aby wykonać przelew.', 'warning');
      return false;
    }
    const numAmount = parseInt(amount, 10);
    if (isNaN(numAmount) || numAmount <= 0) {
      showNotification('Błąd Kwoty', 'Kwota przelewu musi być większa od zera.', 'warning');
      return false;
    }
    if ((currentUser.currency || 0) < numAmount) {
      showNotification('Brak Środków', `Niewystarczająca liczba Skirnirów w Twojej skrytce. Posiadasz: ${currentUser.currency || 0} ᛋ.`, 'warning');
      return false;
    }

    if (backendAvailable) {
      const res = await api.transferFunds({
        recipientId,
        amount: numAmount,
        title,
        note,
        idempotencyKey: globalThis.crypto?.randomUUID?.() || `web-${Date.now()}-${Math.random().toString(36).slice(2)}`
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => {
          if (u.id === currentUser.id) return { ...u, currency: u.currency - numAmount };
          if (u.id === recipientId) return { ...u, currency: (u.currency || 0) + numAmount };
          return u;
        }));
        setBankAccount(prev => ({ ...prev, balance: prev.balance - numAmount }));
        setBankTransactions(prev => [res.data.transaction, ...prev]);
        showNotification('Przelew Zrealizowany', res.data.message, 'success');
        return true;
      } else {
        showNotification('Błąd Przelewu', res.error || 'Nie udało się zrealizować przelewu.', 'warning');
        return false;
      }
    }

    showNotification('Bank Niedostępny', 'Przelewy wymagają bezpiecznego połączenia z serwerem.', 'warning');
    return false;

    // Nieaktywna pozostałość dawnego trybu lokalnego.
    const targetUser = users.find(u => u.id === recipientId);
    const recipientName = targetUser ? targetUser.fullName : recipientId;
    const tx = {
      id: `tx-skr-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.fullName,
      recipientId,
      recipientName,
      amount: numAmount,
      type: 'transfer',
      category: 'przelew',
      title: title || 'Przelew bankowy Skirnirów',
      note: note || '',
      status: 'completed',
      referenceCode: `SKR-TX-${Math.floor(10000 + Math.random() * 90000)}`,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) return { ...u, currency: u.currency - numAmount };
      if (u.id === recipientId) return { ...u, currency: (u.currency || 0) + numAmount };
      return u;
    }));
    setBankAccount(prev => ({ ...prev, balance: prev.balance - numAmount }));
    setBankTransactions(prev => [tx, ...prev]);
    showNotification('Przelew Zrealizowany', `Pomyślnie przelano ${numAmount} Skirnirów do: ${recipientName}.`, 'success');
    return true;
  };

  const fetchBankTransactions = async (filters = {}) => {
    if (backendAvailable) {
      const res = await api.getBankTransactions(filters);
      if (res.ok) {
        setBankTransactions(res.data);
        return res.data;
      }
    }
    return bankTransactions;
  };

  const payoutAllSalaries = async (amount = 500, period = 'Semestr Zimowy 2026/2027') => {
    if (backendAvailable) {
      const res = await api.payoutAllSalaries({ amount, period, adminName: currentUser?.fullName || 'Arcymistrzyni Valgerda Storm' });
      if (res.ok) {
        showNotification('Wypłaty Zrealizowane', res.data.message, 'success');
        const usersRes = await api.getUsers();
        if (usersRes.ok) setUsers(usersRes.data);
        const txRes = await api.getBankTransactions();
        if (txRes.ok) setBankTransactions(txRes.data);
        const salRes = await api.getTeacherSalaries();
        if (salRes.ok) setTeacherSalaries(salRes.data);
        return true;
      } else {
        showNotification('Błąd Wypłat', res.error || 'Błąd wypłat pensji.', 'warning');
        return false;
      }
    }
    showNotification('Wypłaty Zrealizowane', `Wypłacono pensje profesorom (${amount} ᛋ).`, 'success');
    return true;
  };

  const payoutLessonSalary = async (lessonId, lessonTopic, participantsCount = 5) => {
    if (!currentUser) return false;
    if (backendAvailable) {
      const res = await api.payoutLessonSalary({
        professorId: currentUser.id,
        lessonId,
        lessonTopic,
        participantsCount
      });
      if (res.ok) {
        showNotification('Honorarium Wypłacone', res.data.message, 'success');
        const usersRes = await api.getUsers();
        if (usersRes.ok) setUsers(usersRes.data);
        return true;
      }
    }
    return true;
  };

  // ==================== METODY RYNKU & WYPRAWEK ====================

  const buyStoreItem = async (item) => {
    if (!currentUser) {
      showNotification('Wymagane Logowanie', 'Zaloguj się do Cytadeli, aby dokonywać zakupów na rynku.', 'warning');
      return false;
    }
    if ((currentUser.currency || 0) < item.price) {
      showNotification('Brak Środków', `Przedmiot kosztuje ${item.price} Skirnirów. Posiadasz: ${currentUser.currency || 0} ᛋ.`, 'warning');
      return false;
    }
    if (item.houseExclusive && currentUser.house && item.houseExclusive !== currentUser.house) {
      showNotification('Brak Uprawnień', `Ten artefakt jest zastrzeżony dla innego Zakonu.`, 'warning');
      return false;
    }
    if ((currentUser.inventory || []).some(i => i.id === item.id)) {
      showNotification('Przedmiot w Ekwipunku', 'Posiadasz już ten unikatowy artefakt.', 'info');
      return false;
    }

    if (backendAvailable) {
      const res = await api.buyStoreItem({ userId: currentUser.id, itemId: item.id });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === currentUser.id ? res.data.user : u));
        setBankAccount(prev => ({ ...prev, balance: prev.balance - item.price }));
        if (res.data.rankings) setHouseRankings(res.data.rankings);

        showNotification('Zakup Sfinalizowany', `Zakupiono: ${item.name}! Przedmiot dodano do ekwipunku.`, 'success');

        // Check if any shopping list was completed
        if (res.data.completedLists && res.data.completedLists.length > 0) {
          res.data.completedLists.forEach(cl => {
            showNotification('🏆 Wyprawka Skompletowana!', `Ukończono listę: ${cl.title}! +${cl.rewardPoints} pkt dla Domu i +${cl.rewardSkirnirs} ᛋ!`, 'success');
          });
          const slRes = await api.getShoppingLists(currentUser.id);
          if (slRes.ok) setShoppingLists(slRes.data);
          const pRes = await api.getPointLedger();
          if (pRes.ok) setPointLedger(pRes.data);
        }
        return true;
      } else {
        showNotification('Błąd Zakupu', res.error || 'Nie udało się dokonać zakupu.', 'warning');
        return false;
      }
    }

    // Local fallback
    const updatedInv = [...(currentUser.inventory || []), item];
    const newCurrency = (currentUser.currency || 0) - item.price;
    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, currency: newCurrency, inventory: updatedInv } : u));
    setBankAccount(prev => ({ ...prev, balance: newCurrency }));

    const tx = {
      id: `tx-buy-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.fullName,
      recipientId: item.shopId || 'shop-general',
      recipientName: item.shopName || 'Kram Kaupangr',
      amount: item.price,
      type: 'outflow',
      category: 'zakup',
      title: `Zakup: ${item.name}`,
      note: `Kram: ${item.shopName || 'Kaupangr'}`,
      status: 'completed',
      referenceCode: `SKR-BUY-${Math.floor(10000 + Math.random() * 90000)}`,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };
    setBankTransactions(prev => [tx, ...prev]);
    showNotification('Zakup Sfinalizowany', `Zakupiono: ${item.name}!`, 'success');

    // Local check for shopping lists
    const ownedSet = new Set(updatedInv.map(i => i.id));
    setShoppingLists(prev => prev.map(list => {
      const isComplete = list.requiredItemIds.every(id => ownedSet.has(id));
      if (isComplete && !list.isCompleted) {
        if (currentUser.house) {
          const pt = {
            id: `pt-shop-${Date.now()}-${list.id}`,
            studentId: currentUser.id,
            studentName: currentUser.fullName,
            house: currentUser.house,
            points: list.rewardPoints,
            source: 'wyprawka',
            professorId: 'system',
            professorName: 'Rada Dyrekcji Durmstrang',
            date: new Date().toISOString().split('T')[0],
            comment: `Nagroda za skompletowanie Wyprawki: ${list.title}`,
            isRevoked: 0
          };
          setPointLedger(pl => [pt, ...pl]);
        }
        showNotification('🏆 Wyprawka Skompletowana!', `Ukończono: ${list.title}! +${list.rewardPoints} pkt dla Domu!`, 'success');
        return { ...list, isCompleted: true, ownedCount: list.totalCount, progressPercent: 100 };
      }
      return list;
    }));

    return true;
  };

  const fetchShoppingLists = async () => {
    if (backendAvailable && currentUser) {
      const res = await api.getShoppingLists(currentUser.id);
      if (res.ok) {
        setShoppingLists(res.data);
        return res.data;
      }
    }
    return shoppingLists;
  };

  const createStoreItem = async (newItemData) => {
    const slug = newItemData.id || `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const fullItem = {
      id: slug,
      name: newItemData.name?.trim() || 'Nowy Artefakt',
      category: newItemData.category || 'Artefakty & Talizmany',
      categorySlug: newItemData.categorySlug || 'artifacts',
      shopId: newItemData.shopId || 'vault-artifacts',
      shopName: newItemData.shopName || 'Skarbiec Artefaktów i Amuletów Odyna',
      price: parseInt(newItemData.price, 10) || 50,
      icon: newItemData.icon || '📦',
      houseExclusive: newItemData.houseExclusive || null,
      rarity: newItemData.rarity || 'Zwykły',
      description: newItemData.description?.trim() || '',
      lore: newItemData.lore?.trim() || '',
      placeholderType: newItemData.placeholderType || 'artifact_pendant',
      imageUrl: newItemData.imageUrl?.trim() || '',
      image: newItemData.imageUrl?.trim() || '',
      createdAt: new Date().toISOString()
    };

    setStoreItems(prev => {
      const updated = [fullItem, ...prev.filter(i => i.id !== fullItem.id)];
      localStorage.setItem('durmstrang_store_items', JSON.stringify(updated));
      return updated;
    });

    if (backendAvailable) {
      await api.createStoreItem(fullItem);
    }

    showNotification('Przedmiot Dodany', `Dodano nowy artefakt: ${fullItem.name} do asortymentu!`, 'success');
    return fullItem;
  };

  const updateStoreItem = async (id, patch) => {
    let updatedItem = null;
    setStoreItems(prev => {
      const updated = prev.map(item => {
        if (item.id === id) {
          updatedItem = {
            ...item,
            ...patch,
            imageUrl: patch.imageUrl !== undefined ? patch.imageUrl : item.imageUrl,
            image: patch.imageUrl !== undefined ? patch.imageUrl : item.image
          };
          return updatedItem;
        }
        return item;
      });
      localStorage.setItem('durmstrang_store_items', JSON.stringify(updated));
      return updated;
    });

    if (backendAvailable) {
      await api.updateStoreItem(id, patch);
    }

    showNotification('Przedmiot Zaktualizowany', `Pomyślnie zaktualizowano właściwości i grafikę artefaktu.`, 'success');
    return updatedItem;
  };

  const deleteStoreItem = async (id) => {
    setStoreItems(prev => {
      const updated = prev.filter(i => i.id !== id);
      localStorage.setItem('durmstrang_store_items', JSON.stringify(updated));
      return updated;
    });

    if (backendAvailable) {
      await api.deleteStoreItem(id);
    }

    showNotification('Przedmiot Usunięty', 'Usunięto artefakt z rejestru rynku.', 'info');
  };

  const resetStoreItems = () => {
    localStorage.removeItem('durmstrang_store_items');
    setStoreItems(STORE_ITEMS);
    showNotification('Przywrócono Domyślny Magazyn', 'Przywrócono oryginalną ofertę kramów Kaupangr.', 'info');
  };

  // ==================== METODY SKANDYNAWSKIEJ LOTERII ====================

  const buyLotteryTicket = async (chosenRunes) => {
    if (!currentUser) {
      showNotification('Wymagane Logowanie', 'Zaloguj się do Cytadeli, aby wziąć udział w Loterii Odyna.', 'warning');
      return false;
    }
    if (!Array.isArray(chosenRunes) || chosenRunes.length !== 6) {
      showNotification('Wybierz 6 Run', 'Musisz wybrać dokładnie 6 unikalnych run z alfabetu Futharku.', 'warning');
      return false;
    }
    const ticketPrice = currentLottery?.ticketPrice || 20;
    if ((currentUser.currency || 0) < ticketPrice) {
      showNotification('Brak Środków', `Los kosztuje ${ticketPrice} Skirnirów. Posiadasz: ${currentUser.currency || 0} ᛋ.`, 'warning');
      return false;
    }

    if (backendAvailable) {
      const res = await api.buyLotteryTicket({
        chosenRunes,
        roundId: currentLottery.id
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === currentUser.id ? res.data.user : u));
        setBankAccount(prev => ({ ...prev, balance: prev.balance - ticketPrice }));
        setCurrentLottery(res.data.round);
        setUserLotteryTickets(prev => [res.data.ticket, ...prev]);
        showNotification('Los Wykupiony!', res.data.message, 'success');
        return true;
      } else {
        showNotification('Błąd Zakupu Losu', res.error || 'Nie udało się kupić losu.', 'warning');
        return false;
      }
    }

    showNotification('Loteria Niedostępna', 'Zakup losu wymaga bezpiecznego połączenia z serwerem.', 'warning');
    return false;

    // Nieaktywna pozostałość dawnego trybu lokalnego.
    const newCurrency = (currentUser.currency || 0) - ticketPrice;
    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, currency: newCurrency } : u));
    setBankAccount(prev => ({ ...prev, balance: newCurrency }));

    const ticket = {
      id: `ticket-${currentUser.id}-${Date.now()}`,
      roundId: currentLottery.id,
      userId: currentUser.id,
      userName: currentUser.fullName,
      house: currentUser.house || 'ravnheim',
      chosenRunes,
      purchasedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      matchesCount: 0,
      prizeWon: 0,
      claimed: false
    };
    setUserLotteryTickets(prev => [ticket, ...prev]);
    setCurrentLottery(prev => ({
      ...prev,
      jackpot: prev.jackpot + Math.round(ticketPrice * 0.75),
      totalTicketsSold: (prev.totalTicketsSold || 0) + 1
    }));
    showNotification('Los Wykupiony!', `Zakupiono los z runami: ${chosenRunes.map(r => r.toUpperCase()).join(', ')}!`, 'success');
    return true;
  };

  const drawLottery = async (customWinningRunes = null) => {
    if (backendAvailable) {
      const res = await api.drawLottery({
        roundId: currentLottery.id,
        customWinningRunes
      });
      if (res.ok) {
        setCurrentLottery(res.data.newRound);
        setLotteryHistory(prev => [res.data.completedRound, ...prev]);
        if (res.data.rankings) setHouseRankings(res.data.rankings);

        const lotteryData = await api.getCurrentLottery(currentUser?.id);
        if (lotteryData.ok) {
          setUserLotteryTickets(lotteryData.data.userTickets || []);
        }
        const usersRes = await api.getUsers();
        if (usersRes.ok) setUsers(usersRes.data);
        const ledgerRes = await api.getPointLedger();
        if (ledgerRes.ok) setPointLedger(ledgerRes.data);

        showNotification('Losowanie Zakończone!', res.data.message, 'success');
        return res.data;
      } else {
        showNotification('Błąd Losowania', res.error || 'Nie udało się przeprowadzić losowania.', 'warning');
        return null;
      }
    }

    // Local fallback
    const winning = customWinningRunes || ['fehu', 'ansuz', 'algiz', 'raidho', 'kenaz', 'gebo'];
    showNotification('Losowanie Zakończone!', `Wylosowano runy: ${winning.map(r => r.toUpperCase()).join(' • ')}!`, 'success');
    return { drawnRunes: winning };
  };

  return (
    <SchoolContext.Provider
      value={{
        activeView,
        setActiveView,
        navigateTo,
        activeHouseTab,
        setActiveHouseTab,
        activeSubjectId,
        setActiveSubjectId,
        activeLessonId,
        setActiveLessonId,
        activeLessonTab,
        setActiveLessonTab,
        users,
        currentUser,
        currentRole,
        loginUser,
        registerUser,
        logoutUser,
        switchUser,
        updateCurrentUser,
        applyServerUserSnapshot,
        hasPermission,
        authModalOpen,
        setAuthModalOpen,
        authModalTab,
        setAuthModalTab,
        openAuthModal,
        passwordRecoveryModalOpen,
        setPasswordRecoveryModalOpen,
        emails,
        setEmails,
        sendEmail,
        emailInboxOpen,
        setEmailInboxOpen,
        discordSimulatorOpen,
        setDiscordSimulatorOpen,
        approveUser,
        rejectUser,
        retryTransactionalEmail,
        approveApplication,
        rejectApplication,
        createAdminAccount,
        addHousePoints,
        addNewsArticle,
        updateNewsArticle,
        deleteNewsArticle,
        togglePinNews,
        resetPassword,
        studentProfile: currentUser?.role === 'student' ? currentUser : studentProfile,
        setStudentProfile,
        professorProfile: currentUser?.role === 'professor' ? currentUser : professorProfile,
        adminProfile: currentUser?.role === 'admin' ? currentUser : adminProfile,
        houses,
        subjects,
        setSubjects,
        activeSubjectDetail,
        setActiveSubjectDetail,
        getSubjectDetails,
        updateSubject,
        createSubject,
        deleteSubject,
        updateSyllabus,
        updateRegulations,
        addGrade,
        deleteGrade,
        // Plan Lekcji & Harmonogram
        timetable,
        setTimetable,
        daysOfWeek: DAYS_OF_WEEK,
        timeSlots: TIME_SLOTS,
        fetchTimetable,
        addTimetableEntry,
        updateTimetableEntry,
        substituteTimetableEntry,
        cancelTimetableEntry,
        restoreTimetableEntry,
        deleteTimetableEntry,
        // Rynek & Sklepy
        shops,
        storeItems,
        setStoreItems,
        createStoreItem,
        updateStoreItem,
        deleteStoreItem,
        resetStoreItems,
        buyStoreItem,
        shoppingLists,
        setShoppingLists,
        fetchShoppingLists,
        selectedInspectorItem,
        setSelectedInspectorItem,
        // Bank Skirnirów (Skírnisbanki)
        bankAccount,
        setBankAccount,
        bankTransactions,
        setBankTransactions,
        transferFunds,
        fetchBankTransactions,
        payoutAllSalaries,
        payoutLessonSalary,
        teacherSalaries,
        salaryConfig,
        // Skandynawska Loteria Odyna
        currentLottery,
        userLotteryTickets,
        lotteryHistory,
        buyLotteryTicket,
        drawLottery,
        lotteryModalOpen,
        setLotteryModalOpen,
        elderFutharkRunes,
        locations,
        ceremonyQuestions,
        lore: LORE_ARCHIVES,
        news,
        setNews,
        events,
        setEvents,
        pendingApplications,
        students,
        setStudents,
        staffRanking,
        setStaffRanking,
        teachers: staffRanking,
        userRunes,
        setUserRunes,
        craftedFormulas,
        runeFormulas,
        homeworkSubmissions,
        ravenMessages,
        discoveredSecrets,
        auditLogs,
        snowEnabled,
        setSnowEnabled,
        notification,
        showNotification,
        addNotification,
        // Grywalizacja & Aktywności RPG
        awardHousePoints,
        addCurrency,
        deductCurrency,
        addInventoryItem,
        removeInventoryItem,
        setActiveBuff,
        submitApplication,
        sortIntoHouse,
        craftRuneFormula,
        discoverSecret,
        sendRavenMessage,
        reactToNews,
        // Dzienniki Lekcyjne & Ranking API
        lessons,
        setLessons,
        houseRankings,
        pointLedger,
        pointAuditLogs,
        rankingPeriod,
        setRankingPeriod,
        fetchRankings,
        refreshUsersFromApi,
        refreshLessons,
        getLessonDetails,
        publishLesson,
        saveLessonDraft,
        deleteLesson,
        correctPointTransaction,
        recalculateRankings,
        // CMS Mediów, Banery & Grafiki Bloków
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
        durmstrangPresets: DURMSTRANG_PRESET_IMAGES,
        imageDimensionsGuide: IMAGE_DIMENSIONS_GUIDE,
        // Dekrety, Regulamin DC, Statut, Opis Zabaw & Własne Podstrony
        documents,
        saveDocument,
        deleteDocument,
        activeDocumentSlug,
        setActiveDocumentSlug,
        activeDocumentCategory,
        setActiveDocumentCategory,
        navigateToDocumentModule,
        // Moduł Prac Domowych (TMD)
        homeworkAssignments,
        setHomeworkAssignments,
        activeHomeworkId,
        setActiveHomeworkId,
        activeHomeworkSubId,
        setActiveHomeworkSubId,
        homeworkDraftLessonData,
        setHomeworkDraftLessonData,
        homeworkOverview,
        setHomeworkOverview,
        homeworkTemplates,
        setHomeworkTemplates,
        homeworkQuickComments,
        setHomeworkQuickComments,
        loadHomework,
        loadStudentHomeworkOverview,
        getHomeworkDetails,
        createHomeworkAssignment,
        updateHomeworkAssignment,
        deleteHomeworkAssignment,
        duplicateHomeworkAssignment,
        saveHomeworkDraft,
        submitHomework,
        uploadHomeworkAttachment,
        gradeHomeworkSubmission,
        returnHomeworkForRevision,
        setHomeworkException,
        deleteHomeworkException,
        loadHomeworkTemplates,
        createHomeworkTemplate,
        deleteHomeworkTemplate,
        loadHomeworkQuickComments,
        createHomeworkQuickComment,
        deleteHomeworkQuickComment,
        navigateToHomeworkCenter,
        navigateToHomeworkDetail,
        navigateToHomeworkCreator,
        navigateToHomeworkGrading,
        // Zadania z Mapy, Poczta, Kalendarz, Kopia Zapasowa
        completedQuests,
        completeMapQuest,
        markRavenRead,
        toggleRavenStar,
        deleteRavenMessage,
        gradeHomework,
        deleteHomework,
        addEvent,
        updateEvent,
        deleteEvent,
        importDatabaseBackup,
        // Żelazne Pióro — Gazetka Szkolna
        activeGazetteIssueId,
        setActiveGazetteIssueId,
        navigateToGazette,
        navigateToGazetteIssue,
        navigateToGazettePanel,
        navigateToGazetteArchive,
        // Moduł Egzaminacyjny
        activeExamId,
        setActiveExamId,
        activeExamAttemptId,
        setActiveExamAttemptId,
        navigateToExams,
        navigateToExamTaking,
        navigateToExamResult,
        navigateToExamCreator,
        navigateToExamGrading,
        navigateToExamBank,
        // Izba Pamięci (Memorial Hall)
        memoryTab,
        setMemoryTab,
        memoryYearId,
        setMemoryYearId,
        memoryPersonId,
        setMemoryPersonId,
        memoryHouseKey,
        setMemoryHouseKey,
        navigateToMemory,
        navigateToMemoryYear,
        navigateToMemoryPerson,
        navigateToMemoryOrder,
        // Strażnicy i Opiekunowie Zakonów oraz Strażnik Twierdzy
        fortressGuardian,
        updateFortressGuardian,
        updateHouseLeaders,
        // Izba Przyjęć i Usprawiedliwień
        navigateToAbsenceChamber
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
};

export const useSchool = () => useContext(SchoolContext);
