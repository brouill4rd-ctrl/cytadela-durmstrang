import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { HOUSES } from '../data/seedHouses';
import { SUBJECTS } from '../data/seedSubjects';
import { SHOPS, STORE_ITEMS } from '../data/seedStore';
import { SEED_BANK_ACCOUNTS, SEED_BANK_TRANSACTIONS, TEACHER_SALARY_CONFIG } from '../data/seedBank';
import { SEED_SHOPPING_LISTS } from '../data/seedShoppingLists';
import { ELDER_FUTHARK_RUNES, SEED_LOTTERY_ROUNDS, SEED_LOTTERY_USER_TICKETS } from '../data/seedLottery';
import { LOCATIONS } from '../data/seedLocations';
import { LORE_ARCHIVES } from '../data/seedLore';
import { CEREMONY_QUESTIONS } from '../data/seedCeremonyQuestions';
import { NEWS_ITEMS } from '../data/seedNews';
import { EVENTS } from '../data/seedEvents';
import { DEMO_ACCOUNTS, LEADERBOARD_STUDENTS, PENDING_APPLICATIONS } from '../data/seedStudents';
import { SEED_USERS } from '../data/seedUsers';
import { SECRETS } from '../data/seedSecrets';
import { RUNES_CATALOG, RUNE_FORMULAS } from '../data/seedRunes';
import { SEED_LESSONS, SEED_POINT_TRANSACTIONS } from '../data/seedLessons';
import { SEED_TIMETABLE, DAYS_OF_WEEK, TIME_SLOTS } from '../data/seedTimetable';

const SchoolContext = createContext();

export const SchoolProvider = ({ children }) => {
  // Navigation
  const [activeView, setActiveView] = useState('home');
  const [activeHouseTab, setActiveHouseTab] = useState(null);
  const [activeSubjectId, setActiveSubjectId] = useState(null);
  const [activeLessonId, setActiveLessonId] = useState(null);
  const [activeLessonTab, setActiveLessonTab] = useState('journal'); // 'journal' | 'log'

  // Users Database & Active Account
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('durmstrang_users_db');
    if (!saved) return SEED_USERS;
    try {
      const parsed = JSON.parse(saved);
      const existingIds = new Set(parsed.map(u => u.id));
      const missing = SEED_USERS.filter(s => !existingIds.has(s.id));
      return [...parsed, ...missing];
    } catch {
      return SEED_USERS;
    }
  });

  const [currentUserId, setCurrentUserId] = useState(() => {
    const saved = localStorage.getItem('durmstrang_current_user_id');
    if (saved === 'guest' || saved === 'null' || saved === '' || !saved) return null;
    return saved;
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [emailInboxOpen, setEmailInboxOpen] = useState(false);
  const [discordSimulatorOpen, setDiscordSimulatorOpen] = useState(false);

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
    const saved = localStorage.getItem('durmstrang_student');
    return saved ? JSON.parse(saved) : DEMO_ACCOUNTS.student;
  });

  const [professorProfile, setProfessorProfile] = useState(() => {
    const saved = localStorage.getItem('durmstrang_prof');
    return saved ? JSON.parse(saved) : DEMO_ACCOUNTS.professor;
  });

  const [adminProfile, setAdminProfile] = useState(() => {
    const saved = localStorage.getItem('durmstrang_admin');
    return saved ? JSON.parse(saved) : DEMO_ACCOUNTS.admin;
  });

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
    const saved = localStorage.getItem('durmstrang_point_audits');
    return saved ? JSON.parse(saved) : [];
  });

  const [rankingPeriod, setRankingPeriod] = useState('overall'); // 'overall' | 'school_year' | 'monthly' | 'weekly'

  // Dynamic calculation of house points from base + point transactions (Single Source of Truth)
  const [houseRankings, setHouseRankings] = useState(() => {
    return {
      period: 'overall',
      schoolYear: 'XIX Rok Szkolny (2026/2027)',
      term: 'Semestr Zimowy',
      standings: [
        { houseKey: 'reinhall', name: 'Reinhall', crestIcon: '🦌', color: '#7a1818', secondaryColor: '#c59f4e', basePoints: 480, lessonPoints: 30, totalPoints: 510, txCount: 2, momentum: 30, rank: 3 },
        { houseKey: 'bjornhall', name: 'Björnhall', crestIcon: '🐻', color: '#202530', secondaryColor: '#c02b2b', basePoints: 520, lessonPoints: 10, totalPoints: 530, txCount: 1, momentum: 10, rank: 2 },
        { houseKey: 'ravnheim', name: 'Ravnheim', crestIcon: '🐦', color: '#1c132e', secondaryColor: '#a77de0', basePoints: 510, lessonPoints: 30, totalPoints: 540, txCount: 2, momentum: 30, rank: 1 },
        { houseKey: 'otergard', name: 'Otergard', crestIcon: '🦦', color: '#0d2d33', secondaryColor: '#2ec4b6', basePoints: 495, lessonPoints: 10, totalPoints: 505, txCount: 1, momentum: 10, rank: 4 }
      ]
    };
  });

  // Houses state (derived from dynamic houseRankings so all views stay in sync)
  const [houses, setHouses] = useState(() => {
    const saved = localStorage.getItem('durmstrang_houses');
    return saved ? JSON.parse(saved) : HOUSES;
  });

  // ==================== PRZEDMIOTY (KATEDRY) ====================
  const [subjects, setSubjects] = useState(SUBJECTS); // Fallback: statyczne dane
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
    const saved = localStorage.getItem('durmstrang_events');
    return saved ? JSON.parse(saved) : EVENTS;
  });

  const [pendingApplications, setPendingApplications] = useState(() => {
    const saved = localStorage.getItem('durmstrang_apps');
    return saved ? JSON.parse(saved) : PENDING_APPLICATIONS;
  });

  const [students, setStudents] = useState(() => {
    const saved = localStorage.getItem('durmstrang_students');
    return saved ? JSON.parse(saved) : LEADERBOARD_STUDENTS;
  });

  // Runes & Workshop System
  const [userRunes, setUserRunes] = useState(() => {
    const saved = localStorage.getItem('durmstrang_runes');
    return saved ? JSON.parse(saved) : RUNES_CATALOG;
  });

  const [craftedFormulas, setCraftedFormulas] = useState(() => {
    const saved = localStorage.getItem('durmstrang_crafted_formulas');
    return saved ? JSON.parse(saved) : ['formula-blood-shield'];
  });

  // Homework & Submissions
  const [homeworkSubmissions, setHomeworkSubmissions] = useState(() => {
    const saved = localStorage.getItem('durmstrang_submissions');
    return saved ? JSON.parse(saved) : [
      {
        id: 'sub-demo-1',
        studentId: 'stud-2',
        studentName: 'Astrid Vargadottir',
        house: 'bjornhall',
        subjectId: 'klatwy-i-uroki',
        subjectName: 'Klątwy i Magia Bojowa',
        lessonId: 'ku-1',
        lessonTitle: 'Lekcja I: Tarcza Pękniętego Żelaza',
        content: 'W analizie taktycznej proponuję najpierw pochłonąć energię pierwszego uroku za pomocą rotacyjnego ruchu nadgarstka, a następnie skierować falę powrotną pod kątem 30 stopni ku ziemi.',
        status: 'submitted',
        submittedAt: '2026-09-10 14:30',
        grade: null,
        feedback: null
      }
    ];
  });

  // Raven Post Messages
  const [ravenMessages, setRavenMessages] = useState(() => {
    const saved = localStorage.getItem('durmstrang_messages');
    return saved ? JSON.parse(saved) : [
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
    const saved = localStorage.getItem('durmstrang_secrets');
    return saved ? JSON.parse(saved) : [];
  });

  // Admin Audit Log
  const [auditLogs, setAuditLogs] = useState(() => {
    const saved = localStorage.getItem('durmstrang_logs');
    return saved ? JSON.parse(saved) : [
      { id: 'log-1', timestamp: '2026-09-01 10:00', admin: 'Arcymistrzyni Valgerda Storm', action: 'Inauguracja XIX Roku Szkolnego', detail: 'Reset punktacji generalnej i przydział bazowy.' },
      { id: 'log-2', timestamp: '2026-09-05 16:20', admin: 'Prof. Gunnar Vargson', action: '+50 pkt dla Zakonu Björnhall', detail: 'Zwycięstwo w eliminacjach turnieju pojedynkowego.' }
    ];
  });

  // ==================== BANK CYTADELI (SKÍRNISBANKI) ====================
  const [bankAccount, setBankAccount] = useState(() => {
    const saved = localStorage.getItem('durmstrang_bank_account');
    return saved ? JSON.parse(saved) : SEED_BANK_ACCOUNTS[0];
  });

  const [bankTransactions, setBankTransactions] = useState(() => {
    const saved = localStorage.getItem('durmstrang_bank_tx');
    return saved ? JSON.parse(saved) : SEED_BANK_TRANSACTIONS;
  });

  const [teacherSalaries, setTeacherSalaries] = useState([]);

  // ==================== RYNEK KAUPANGR & SKLEPY ====================
  const [storeItems, setStoreItems] = useState(STORE_ITEMS);
  const [shoppingLists, setShoppingLists] = useState(() => {
    const saved = localStorage.getItem('durmstrang_shopping_lists');
    return saved ? JSON.parse(saved) : SEED_SHOPPING_LISTS;
  });
  const [selectedInspectorItem, setSelectedInspectorItem] = useState(null);

  // ==================== SKANDYNAWSKA LOTERIA ODYNA ====================
  const [currentLottery, setCurrentLottery] = useState(() => {
    const saved = localStorage.getItem('durmstrang_current_lottery');
    return saved ? JSON.parse(saved) : SEED_LOTTERY_ROUNDS[0];
  });

  const [userLotteryTickets, setUserLotteryTickets] = useState(() => {
    const saved = localStorage.getItem('durmstrang_lottery_tickets');
    return saved ? JSON.parse(saved) : SEED_LOTTERY_USER_TICKETS;
  });

  const [lotteryHistory, setLotteryHistory] = useState(() => {
    const saved = localStorage.getItem('durmstrang_lottery_history');
    return saved ? JSON.parse(saved) : [SEED_LOTTERY_ROUNDS[1]];
  });

  const [lotteryModalOpen, setLotteryModalOpen] = useState(false);

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
      if (usersRes.ok && usersRes.data.length > 0) {
        setUsers(usersRes.data);
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

      // Load pending applications
      const appsRes = await api.getPendingApplications();
      if (appsRes.ok) {
        setPendingApplications(appsRes.data);
      }

      // Load subjects (katedry) z backendu
      const subjectsRes = await api.getSubjects();
      if (subjectsRes.ok && subjectsRes.data.length > 0) {
        const mergedSubjects = subjectsRes.data.map(apiSubj => {
          const staticMatch = SUBJECTS.find(s => s.id === apiSubj.id);
          return {
            ...staticMatch,
            ...apiSubj,
            lessons: (apiSubj.lessons && apiSubj.lessons.length > 0) ? apiSubj.lessons : (staticMatch?.lessons || []),
            classYears: apiSubj.classYears || staticMatch?.classYears || ['Klasa I']
          };
        });
        setSubjects(mergedSubjects);
      }

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

      const salRes = await api.getTeacherSalaries();
      if (salRes.ok) setTeacherSalaries(salRes.data);

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
    };

    loadFromAPI();

    // Auto-polling co 3 sekundy, aby natychmiast synchronizować stan
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
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [rankingPeriod, currentUserId]);

  // Sync to LocalStorage (fallback persistence)
  useEffect(() => {
    localStorage.setItem('durmstrang_users_db', JSON.stringify(users));
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

  // Push UI Notification Banner
  const showNotification = (title, message, type = 'info') => {
    setNotification({ title, message, type, id: Date.now() });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const addNotification = (message, type = 'info') => {
    showNotification('Cytadela Durmstrang', message, type);
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
      try {
        localStorage.setItem('durmstrang_users_db', JSON.stringify(nextUsers));
      } catch (_) {}
      return nextUsers;
    });

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
          setUsers(prev => {
            const next = prev.map(u => u.id === targetId ? res.data : u);
            try {
              localStorage.setItem('durmstrang_users_db', JSON.stringify(next));
            } catch (_) {}
            return next;
          });
          if (currentUser?.role === 'student' || !currentUser) {
            setStudentProfile(res.data);
          }
          return res.data;
        }
      } catch (err) {
        console.error('Error updating user on backend:', err);
      }
    }
    return finalUpdates;
  };

  // Award House Points & Student XP from activities/games
  const awardHousePoints = (houseKey, points, reason, studentId = null) => {
    const targetHouse = houseKey || currentUser?.house || 'ravnheim';
    const targetStudentId = studentId || currentUser?.id || 'usr-valdemar';
    const targetStudentName = currentUser?.fullName || currentUser?.username || 'Valdemar Krag-Hansen';

    // 1. Update House Rankings standings
    setHouseRankings(prev => {
      const updatedStandings = (prev.standings || []).map(s => {
        if (s.houseKey === targetHouse) {
          const newLessonPts = (s.lessonPoints || 0) + points;
          const newTotalPts = (s.basePoints || 0) + newLessonPts;
          return { ...s, lessonPoints: newLessonPts, totalPoints: newTotalPts, txCount: (s.txCount || 0) + 1 };
        }
        return s;
      });
      // Re-rank standings
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
          points: (updated[targetHouse].points || 0) + points
        };
      }
      return updated;
    });

    // 3. Add transaction to point ledger
    const newTx = {
      id: `tx-act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      studentId: targetStudentId,
      studentName: targetStudentName,
      house: targetHouse,
      points: points,
      source: reason || 'Aktywność / Grywalizacja w Cytadeli',
      date: new Date().toISOString().slice(0, 10),
      isRevoked: false,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };
    setPointLedger(prev => [newTx, ...prev]);

    // 4. Update Current User points & XP
    if (currentUser) {
      const currentPts = currentUser.points || 0;
      const currentXp = currentUser.xp || 0;
      const nextXp = currentUser.nextLevelXp || 1000;
      const addedXp = points * 10;
      let newXp = currentXp + addedXp;
      let newLevel = currentUser.level || 1;

      if (newXp >= nextXp) {
        newLevel += 1;
        newXp = newXp - nextXp;
        showNotification('Awans Kręgu Magii!', `Osiągnąłeś Krąg ${newLevel} w hierarchii Durmstrang!`, 'success');
      }

      updateCurrentUser({
        points: currentPts + points,
        xp: newXp,
        level: newLevel
      });
    }

    // 5. Backend sync if available
    if (backendAvailable) {
      api.awardPoints({
        studentId: targetStudentId,
        studentName: targetStudentName,
        house: targetHouse,
        points: points,
        reason: reason
      }).catch(() => {});
    }
  };

  // Add Currency (Skirniry) to User & Bank
  const addCurrency = (amount, reason = 'Nagroda z aktywności') => {
    if (!currentUser || !amount) return;
    const currentCurr = currentUser.currency || 0;
    const newCurr = currentCurr + amount;

    updateCurrentUser({ currency: newCurr });
    setBankAccount(prev => ({
      ...prev,
      balance: (prev.balance || 0) + amount
    }));

    const newTx = {
      id: `tx-bank-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.fullName,
      amount: amount,
      type: 'deposit',
      title: reason,
      date: new Date().toISOString().slice(0, 10),
      balanceAfter: newCurr
    };
    setBankTransactions(prev => [newTx, ...prev]);
  };

  // Deduct Currency (Skirniry) from User & Bank
  const deductCurrency = (amount, reason = 'Wydatek') => {
    if (!currentUser || !amount) return false;
    const currentCurr = currentUser.currency || 0;
    if (currentCurr < amount) {
      showNotification('Brak Skirnirów', `Brakuje Ci ${amount - currentCurr} Skirnirów do wykonania tej transakcji.`, 'warning');
      return false;
    }
    const newCurr = currentCurr - amount;

    updateCurrentUser({ currency: newCurr });
    setBankAccount(prev => ({
      ...prev,
      balance: Math.max(0, (prev.balance || 0) - amount)
    }));

    const newTx = {
      id: `tx-bank-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.fullName,
      amount: -amount,
      type: 'withdrawal',
      title: reason,
      date: new Date().toISOString().slice(0, 10),
      balanceAfter: newCurr
    };
    setBankTransactions(prev => [newTx, ...prev]);
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
        setLessons(prev => prev.map(l => l.id === lessonId ? lesson : l));
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

    setLessons(prev => prev.map(l => l.id === lessonId ? publishedLesson : l));

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
      const res = await api.updateLesson(lessonId, lessonData);
      if (res.ok) {
        setLessons(prev => prev.map(l => l.id === lessonId ? res.data : l));
        showNotification('Szkic Zapisany', 'Zmiany w dzienniku lekcyjnym zostały zachowane na pergaminie.', 'info');
        return res.data;
      } else {
        showNotification('Błąd Zapisu', res.error || 'Nie udało się zapisać zmian.', 'warning');
        return null;
      }
    }

    // Fallback: local
    setLessons(prev => prev.map(l => l.id === lessonId ? { ...l, ...lessonData, updatedAt: new Date().toISOString() } : l));
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
    if (backendAvailable) {
      const res = await api.login(username, password);
      if (res.ok) {
        const user = res.data.user;
        setUsers(prev => {
          const exists = prev.find(u => u.id === user.id);
          return exists ? prev.map(u => u.id === user.id ? user : u) : [user, ...prev];
        });
        setCurrentUserId(user.id);
        showNotification('Wrota Cytadeli Otwarte', `Zalogowano jako: ${user.fullName} (${user.role === 'student' ? 'Adept' : user.role === 'professor' ? 'Profesor' : 'Arcymistrz'})`, 'success');
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
    }

    // Fallback
    const trimmedUser = (username || '').trim().toLowerCase();
    const found = users.find(u => u.username.toLowerCase() === trimmedUser && u.password === password);
    if (!found) {
      showNotification('Błąd Autoryzacji', 'Nieprawidłowa nazwa adepta lub hasło.', 'warning');
      return false;
    }
    setCurrentUserId(found.id);
    showNotification('Wrota Cytadeli Otwarte', `Zalogowano jako: ${found.fullName}`, 'success');
    return true;
  };

  const logoutUser = () => {
    setCurrentUserId(null);
    localStorage.setItem('durmstrang_current_user_id', 'guest');
    showNotification('Wylogowano z Cytadeli', 'Złożono pieczęć. Sesja została pomyślnie zamknięta.', 'info');
  };

  const switchUser = (userId) => {
    const found = users.find(u => u.id === userId);
    if (found) {
      setCurrentUserId(found.id);
      showNotification('Zmiana Tożsamości', `Aktywna postać: ${found.fullName}`, 'info');
    }
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
    if (backendAvailable) {
      const res = await api.register(userData);
      if (res.ok) {
        const { user, email } = res.data;
        setUsers(prev => [user, ...prev]);
        if (email) setEmails(prev => [email, ...prev]);
        showNotification('Podanie Złożone', `Wysłano potwierdzenie na e-mail: ${user.email}.`, 'success');
        return true;
      } else {
        showNotification('Błąd Rejestracji', res.error || 'Błąd rejestracji.', 'warning');
        return false;
      }
    }
    return false;
  };

  const approveUser = async (userId) => {
    if (backendAvailable) {
      const res = await api.approveUser(userId, currentUser?.fullName || 'Arcymistrzyni Valgerda Storm');
      if (res.ok) {
        const { user, email } = res.data;
        setUsers(prev => prev.map(u => u.id === userId ? user : u));
        if (email) setEmails(prev => [email, ...prev]);
        showNotification('Podanie Zatwierdzone', `Zatwierdzono: ${user.fullName}. List przyjęcia wysłany.`, 'success');
      }
    }
  };

  const rejectUser = async (userId) => {
    if (backendAvailable) {
      const res = await api.rejectUser(userId, currentUser?.fullName || 'Dyrekcja');
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'rejected' } : u));
        showNotification('Podanie Oddalone', 'Zgłoszenie zostało odrzucone.', 'info');
      }
    }
  };

  const resetPassword = async (username, newPassword) => {
    const user = users.find(u => u.username.toLowerCase() === (username || '').trim().toLowerCase());
    if (backendAvailable && user) {
      const res = await api.resetPassword(user.id, newPassword);
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, password: newPassword } : u));
        showNotification('Pieczęć Odnowiona', 'Hasło zostało zmienione.', 'success');
      }
    }
  };

  // Create Admin Account (from CMS)
  const createAdminAccount = async (adminData) => {
    if (backendAvailable) {
      const res = await api.createAdminAccount({
        ...adminData,
        adminName: currentUser?.fullName || 'Rada Dyrekcji'
      });
      if (res.ok && res.data.user) {
        setUsers(prev => [res.data.user, ...prev]);
        showNotification('Nowy Arcymistrz Mianowany', `Konto dla ${adminData.name} ${adminData.surname} zostało utworzone i przypieczętowane.`, 'success');
        return true;
      } else {
        showNotification('Błąd Tworzenia Konta', res.error || 'Nie udało się utworzyć konta.', 'warning');
        return false;
      }
    }

    // Fallback
    const newId = `usr-${Date.now()}`;
    const newAdmin = {
      id: newId,
      username: (adminData.username || '').trim().toLowerCase(),
      password: adminData.password || '123',
      name: (adminData.name || '').trim(),
      surname: (adminData.surname || '').trim(),
      fullName: `${(adminData.name || '').trim()} ${(adminData.surname || '').trim()}`,
      role: 'admin',
      status: 'approved',
      title: adminData.title || 'Arcymistrz Cytadeli Durmstrang',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
      office: adminData.office || 'Komnaty Najwyższej Wieży Durmstrang',
      email: `${(adminData.username || '').trim().toLowerCase()}@durmstrang.edu`,
      level: 10,
      xp: 9999,
      points: 500,
      currency: 1000
    };
    setUsers(prev => [newAdmin, ...prev]);
    showNotification('Nowy Arcymistrz Mianowany', `Konto dla ${newAdmin.fullName} zostało utworzone.`, 'success');
    return true;
  };

  const approveApplication = async (appId) => {
    const app = pendingApplications.find(a => a.id === appId || a.userId === appId);
    if (app && app.userId) {
      await approveUser(app.userId);
    } else if (app) {
      await approveUser(app.id);
    }
    setPendingApplications(prev => prev.filter(a => a.id !== appId && a.userId !== appId));
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
    const staticSubject = SUBJECTS.find(s => s.id === subjectId);
    setActiveSubjectDetail(staticSubject || null);
    return staticSubject || null;
  };

  const updateSubject = async (subjectId, fields) => {
    if (backendAvailable) {
      const res = await api.updateSubject(subjectId, fields);
      if (res.ok) {
        setSubjects(prev => prev.map(s => s.id === subjectId ? res.data : s));
        if (activeSubjectDetail?.id === subjectId) setActiveSubjectDetail(res.data);
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
    if (backendAvailable) {
      const res = await api.createTimetableEntry(entryData);
      if (res.ok) {
        setTimetable(prev => [...prev, res.data]);
        showNotification('Zajęcia Dodane', `${res.data.subjectName} dodano do planu (${res.data.dayName}, ${res.data.startTime}).`, 'success');
        return res.data;
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
    if (backendAvailable) {
      const res = await api.updateTimetableEntry(id, entryData);
      if (res.ok) {
        setTimetable(prev => prev.map(t => t.id === id ? res.data : t));
        showNotification('Plan Zaktualizowany', `Pomyślnie zaktualizowano zajęcia: ${res.data.subjectName}.`, 'success');
        return res.data;
      }
    }
    // Fallback local
    setTimetable(prev => prev.map(t => t.id === id ? { ...t, ...entryData, updatedAt: new Date().toISOString() } : t));
    showNotification('Plan Zaktualizowany', 'Zapisano zmiany w grafiku.', 'success');
    return true;
  };

  const substituteTimetableEntry = async (id, subData) => {
    if (backendAvailable) {
      const res = await api.substituteTimetableEntry(id, subData);
      if (res.ok) {
        setTimetable(prev => prev.map(t => t.id === id ? res.data : t));
        showNotification('Zastępstwo Wprowadzone', `Zastępca: ${res.data.substituteProfessorName} dla ${res.data.subjectName}.`, 'warning');
        return res.data;
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
    if (backendAvailable) {
      const res = await api.cancelTimetableEntry(id, reason);
      if (res.ok) {
        setTimetable(prev => prev.map(t => t.id === id ? res.data : t));
        showNotification('Zajęcia Odwołane', `Lekcja ${res.data.subjectName} została odwołana.`, 'warning');
        return res.data;
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
    if (backendAvailable) {
      const res = await api.restoreTimetableEntry(id);
      if (res.ok) {
        setTimetable(prev => prev.map(t => t.id === id ? res.data : t));
        showNotification('Zajęcia Przywrócone', `Lekcja ${res.data.subjectName} odbywa się normalnie według planu.`, 'success');
        return res.data;
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
    if (backendAvailable) {
      const res = await api.deleteTimetableEntry(id);
      if (res.ok) {
        setTimetable(prev => prev.filter(t => t.id !== id));
        showNotification('Zajęcia Usunięte', 'Wpis wymazano z planu lekcji.', 'info');
        return true;
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
        senderId: currentUser.id,
        recipientId,
        amount: numAmount,
        title,
        note
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

    // Local fallback
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

  // ==================== METODY SKANDYNAWSKIEJ LOTERII ====================

  const buyLotteryTicket = async (chosenRunes) => {
    if (!currentUser) {
      showNotification('Wymagane Logowanie', 'Zaloguj się do Cytadeli, aby wziąć udział w Loterii Odyna.', 'warning');
      return false;
    }
    if (!Array.isArray(chosenRunes) || chosenRunes.length !== 3) {
      showNotification('Wybierz 3 Runy', 'Musisz wybrać dokładnie 3 runy z alfabetu Futharku.', 'warning');
      return false;
    }
    const ticketPrice = currentLottery?.ticketPrice || 20;
    if ((currentUser.currency || 0) < ticketPrice) {
      showNotification('Brak Środków', `Los kosztuje ${ticketPrice} Skirnirów. Posiadasz: ${currentUser.currency || 0} ᛋ.`, 'warning');
      return false;
    }

    if (backendAvailable) {
      const res = await api.buyLotteryTicket({
        userId: currentUser.id,
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

    // Local fallback
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
    const winning = customWinningRunes || ['fehu', 'ansuz', 'algiz'];
    showNotification('Losowanie Zakończone!', `Wylosowano runy: ${winning.map(r => r.toUpperCase()).join(' • ')}!`, 'success');
    return { drawnRunes: winning };
  };

  return (
    <SchoolContext.Provider
      value={{
        activeView,
        setActiveView,
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
        hasPermission,
        authModalOpen,
        setAuthModalOpen,
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
        shops: SHOPS,
        storeItems,
        setStoreItems,
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
        salaryConfig: TEACHER_SALARY_CONFIG,
        // Skandynawska Loteria Odyna
        currentLottery,
        userLotteryTickets,
        lotteryHistory,
        buyLotteryTicket,
        drawLottery,
        lotteryModalOpen,
        setLotteryModalOpen,
        elderFutharkRunes: ELDER_FUTHARK_RUNES,
        locations: LOCATIONS,
        lore: LORE_ARCHIVES,
        news,
        setNews,
        events,
        setEvents,
        pendingApplications,
        students,
        userRunes,
        setUserRunes,
        craftedFormulas,
        runeFormulas: RUNE_FORMULAS,
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
        // Dzienniki Lekcyjne & Ranking API
        lessons,
        setLessons,
        houseRankings,
        pointLedger,
        pointAuditLogs,
        rankingPeriod,
        setRankingPeriod,
        fetchRankings,
        refreshLessons,
        getLessonDetails,
        publishLesson,
        saveLessonDraft,
        deleteLesson,
        correctPointTransaction,
        recalculateRankings
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
};

export const useSchool = () => useContext(SchoolContext);
