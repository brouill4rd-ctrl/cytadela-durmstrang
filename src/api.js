// API helper for communicating with the backend server
const API_BASE = '/api';

async function apiFetch(path, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return { ok: false, status: res.status, error: errorData.error || 'Błąd serwera', data: errorData };
    }
    
    const data = await res.json();
    return { ok: true, data };
  } catch (err) {
    console.warn('[API] Backend unavailable, using fallback:', err.message);
    return { ok: false, status: 0, error: 'Backend niedostępny', offline: true };
  }
}

export const api = {
  getOrderRoom: (orderId) => apiFetch(`/orders/${encodeURIComponent(orderId)}`),
  createOrderProject: (data) => apiFetch('/orders/projects', { method: 'POST', body: JSON.stringify(data) }),
  contributeToOrderProject: (projectId, data) => apiFetch(`/orders/projects/${encodeURIComponent(projectId)}/contributions`, { method: 'POST', body: JSON.stringify(data) }),
  createOrderCouncilRole: (data) => apiFetch('/orders/council/roles', { method: 'POST', body: JSON.stringify(data) }),
  assignOrderCouncilMember: (data) => apiFetch('/orders/council/memberships', { method: 'POST', body: JSON.stringify(data) }),
  getMyPrologue: () => apiFetch('/prologue/me'),
  advancePrologue: (stage, choiceId) => apiFetch('/prologue/advance', { method: 'POST', body: JSON.stringify({ stage, choiceId }) }),
  getPrologueAdmin: () => apiFetch('/prologue/admin'),
  setPrologueStage: (userId, stage) => apiFetch(`/prologue/admin/${userId}`, { method: 'PATCH', body: JSON.stringify({ stage }) }),
  getMyLineageDiscoveries: () => apiFetch('/prologue/lineage/me'),
  getMyWandBond: () => apiFetch('/prologue/wand/me'),
  // Magiczna Północ — centralny stan świata
  getWorldState: () => apiFetch('/world'),
  getWorldDirector: () => apiFetch('/world/director'),
  updateWorldBase: (data) => apiFetch('/world/base', { method: 'PUT', body: JSON.stringify(data) }),
  previewWorldState: (data) => apiFetch('/world/preview', { method: 'POST', body: JSON.stringify(data) }),
  createWorldOverride: (data) => apiFetch('/world/overrides', { method: 'POST', body: JSON.stringify(data) }),
  deleteWorldOverride: (id) => apiFetch(`/world/overrides/${id}`, { method: 'DELETE' }),
  createWorldSchedule: (data) => apiFetch('/world/schedules', { method: 'POST', body: JSON.stringify(data) }),
  deleteWorldSchedule: (id) => apiFetch(`/world/schedules/${id}`, { method: 'DELETE' }),
  createWorldEffect: (data) => apiFetch('/world/effects', { method: 'POST', body: JSON.stringify(data) }),
  createWorldScar: (data) => apiFetch('/world/scars', { method: 'POST', body: JSON.stringify(data) }),
  createWorldEvent: (data) => apiFetch('/world/events', { method: 'POST', body: JSON.stringify(data) }),
  closeWorldEventWithScar: (id, data) => apiFetch(`/world/events/${id}/close-with-scar`, { method: 'POST', body: JSON.stringify(data) }),
  // Turniej Szermierki Różdżkowej
  wandFencingStart: () => apiFetch('/minigames/wand-fencing/start', { method: 'POST' }),
  wandFencingComplete: (runId, actionLog) => apiFetch('/minigames/wand-fencing/complete', { method: 'POST', body: JSON.stringify({ runId, actionLog }) }),
  wandFencingAbandon: (runId) => apiFetch('/minigames/wand-fencing/abandon', { method: 'POST', body: JSON.stringify({ runId }) }),
  wandFencingDailyStatus: () => apiFetch('/minigames/wand-fencing/daily-status'),

  // Bestiariusz Północy
  getBestiaryCatalog: () => apiFetch('/bestiary/catalog'),
  getBestiaryStatus: () => apiFetch('/bestiary/status'),
  createBestiarySession: (runId, mode) => apiFetch('/bestiary/sessions', { method: 'POST', body: JSON.stringify({ runId, mode }) }),
  getBestiarySession: (sessionId) => apiFetch(`/bestiary/sessions/${encodeURIComponent(sessionId)}`),
  advanceBestiaryEncounter: (sessionId) => apiFetch(`/bestiary/sessions/${encodeURIComponent(sessionId)}/advance`, { method: 'POST' }),
  submitBestiaryIdentify: (sessionId, actionId, choiceId) => apiFetch(`/bestiary/sessions/${encodeURIComponent(sessionId)}/identify`, { method: 'POST', body: JSON.stringify({ actionId, choiceId }) }),
  submitBestiaryCountermeasure: (sessionId, actionId, choiceId) => apiFetch(`/bestiary/sessions/${encodeURIComponent(sessionId)}/countermeasure`, { method: 'POST', body: JSON.stringify({ actionId, choiceId }) }),
  completeBestiarySession: (sessionId) => apiFetch(`/bestiary/sessions/${encodeURIComponent(sessionId)}/complete`, { method: 'POST' }),
  abandonBestiarySession: (sessionId) => apiFetch(`/bestiary/sessions/${encodeURIComponent(sessionId)}/abandon`, { method: 'POST' }),

  // Auth
  login: (username, password) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logout: () => apiFetch('/auth/logout', { method: 'POST' }),
  requestPasswordRecovery: (identifier) => apiFetch('/auth/password-recovery/request', { method: 'POST', body: JSON.stringify({ identifier }) }),
  confirmPasswordRecovery: (token, newPassword) => apiFetch('/auth/password-recovery/confirm', { method: 'POST', body: JSON.stringify({ token, newPassword }) }),
  register: (userData) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),

  // Domain data
  getHouses: () => apiFetch('/houses'),
  updateHouse: (id, data) => apiFetch(`/houses/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
  getFortressGuardian: () => apiFetch('/houses/fortress-guardian'),
  updateFortressGuardian: (data) => apiFetch('/houses/fortress-guardian', { method: 'PUT', body: JSON.stringify(data) }),
  getLocations: () => apiFetch('/locations'),
  // Map system
  getMapLayers: () => apiFetch('/map/layers'),
  getMapState: (layerId) => apiFetch(`/map/${encodeURIComponent(layerId)}/state`),
  discoverLocation: (locationId) => apiFetch('/map/discover', { method: 'POST', body: JSON.stringify({ locationId }) }),
  trackLocation: (locationId) => apiFetch('/map/track', { method: 'POST', body: JSON.stringify({ locationId }) }),
  untrackLocation: () => apiFetch('/map/track', { method: 'DELETE' }),
  // Quest Engine
  getQuestJournal: () => apiFetch('/quest-engine/journal'),
  getLocationQuests: (locationId) => apiFetch(`/quest-engine/location/${encodeURIComponent(locationId)}`),
  getQuestState: (questId) => apiFetch(`/quest-engine/${encodeURIComponent(questId)}/state`),
  startQuest: (questId) => apiFetch(`/quest-engine/${encodeURIComponent(questId)}/start`, { method: 'POST' }),
  submitQuestAction: (questId, actionId) => apiFetch(`/quest-engine/${encodeURIComponent(questId)}/action`, {
    method: 'POST', body: JSON.stringify({ actionId })
  }),
  trackQuest: (questId) => apiFetch('/quest-engine/track', { method: 'POST', body: JSON.stringify({ questId }) }),
  untrackQuest: () => apiFetch('/quest-engine/track', { method: 'DELETE' }),
  // Map admin
  getAdminMarkers: (layerId) => apiFetch(`/map/admin/markers${layerId ? `?layerId=${encodeURIComponent(layerId)}` : ''}`),
  createMarker: (data) => apiFetch('/map/admin/markers', { method: 'POST', body: JSON.stringify(data) }),
  updateMarker: (id, data) => apiFetch(`/map/admin/markers/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMarker: (id) => apiFetch(`/map/admin/markers/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  getAdminLayers: () => apiFetch('/map/admin/layers'),
  createLayer: (data) => apiFetch('/map/admin/layers', { method: 'POST', body: JSON.stringify(data) }),
  updateLayer: (id, data) => apiFetch(`/map/admin/layers/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
  getRunesCatalog: () => apiFetch('/workshop/runes'),
  getRuneFormulas: () => apiFetch('/workshop/rune-formulas'),
  getCeremonyQuestions: () => apiFetch('/ceremony/questions'),
  getShops: () => apiFetch('/market/shops'),
  getLotteryRunes: () => apiFetch('/lottery/runes'),
  getSalaryConfig: () => apiFetch('/bank/salary-config'),

  // Users
  getUsers: () => apiFetch('/users'),
  getUser: (id) => apiFetch(`/users/${id}`),
  updateUser: (id, fields) => apiFetch(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(fields) }),
  approveUser: (id, adminName) => apiFetch(`/users/${id}/approve`, { method: 'PATCH', body: JSON.stringify({ adminName }) }),
  rejectUser: (id, adminName) => apiFetch(`/users/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ adminName }) }),
  retryTransactionalEmail: (id, type) => apiFetch(`/users/${id}/transactional-emails/${encodeURIComponent(type)}/retry`, { method: 'POST' }),
  resetPassword: (id, newPassword) => apiFetch(`/users/${id}/reset-password`, { method: 'PATCH', body: JSON.stringify({ newPassword }) }),
  getPendingApplications: () => apiFetch('/users/pending/applications'),
  createApplication: (appData) => apiFetch('/users/applications', { method: 'POST', body: JSON.stringify(appData) }),

  // Pas Adepta
  getBelt: () => apiFetch('/belt'),
  pinToBelt: (target, replaceSlot) => apiFetch('/belt', { method: 'POST', body: JSON.stringify({ ...target, replaceSlot }) }),
  reorderBelt: (items) => apiFetch('/belt/order', { method: 'PUT', body: JSON.stringify({ items }) }),
  unpinFromBelt: (targetType, targetId = '') => apiFetch(`/belt/${encodeURIComponent(targetType)}${targetId ? `/${encodeURIComponent(targetId)}` : ''}`, { method: 'DELETE' }),

  // Emails
  getEmails: () => apiFetch('/emails'),
  sendEmail: (emailData) => apiFetch('/emails', { method: 'POST', body: JSON.stringify(emailData) }),
  markEmailRead: (id) => apiFetch(`/emails/${id}/read`, { method: 'PATCH' }),

  // News
  getNews: () => apiFetch('/news'),
  getNewsAuthors: () => apiFetch('/news/authors'),
  createNews: (newsData) => apiFetch('/news', { method: 'POST', body: JSON.stringify(newsData) }),
  updateNews: (id, newsData) => apiFetch(`/news/${id}`, { method: 'PUT', body: JSON.stringify(newsData) }),
  deleteNews: (id) => apiFetch(`/news/${id}`, { method: 'DELETE' }),
  seedNews: (items) => apiFetch('/news/seed', { method: 'POST', body: JSON.stringify(items) }),
  reactToNews: (id, reactionType) => apiFetch(`/news/${id}/react`, { method: 'PATCH', body: JSON.stringify({ reactionType }) }),
  updateUserSignature: (userId, signaturePng) => apiFetch(`/users/${userId}`, { method: 'PUT', body: JSON.stringify({ signaturePng }) }),

  // Wyrocznia Przeznaczenia
  getOracleStatus: () => apiFetch('/oracle/status'),
  castOracleRitual: () => apiFetch('/oracle/cast', { method: 'POST' }),

  // Runiczna Strzelnica
  submitShootingRun: (data) => apiFetch('/shooting-range/finish', { method: 'POST', body: JSON.stringify(data) }),
  getShootingDailyStatus: () => apiFetch('/shooting-range/daily-status'),
  startHnefatafl: (data) => apiFetch('/hnefatafl/start', { method: 'POST', body: JSON.stringify(data) }),
  completeHnefatafl: (data) => apiFetch('/hnefatafl/complete', { method: 'POST', body: JSON.stringify(data) }),
  getHnefataflDailyStatus: () => apiFetch('/hnefatafl/daily-status'),

  // Runiczny Krąg Pojedynków
  getRunicDuelStatus: () => apiFetch('/runic-duels/status'),
  startRunicDuel: (data) => apiFetch('/runic-duels/start', { method: 'POST', body: JSON.stringify(data) }),
  getRunicDuel: (runId) => apiFetch(`/runic-duels/${encodeURIComponent(runId)}`),
  submitRunicDuelAction: (runId, data) => apiFetch(`/runic-duels/${encodeURIComponent(runId)}/actions`, { method: 'POST', body: JSON.stringify(data) }),
  abandonRunicDuel: (runId) => apiFetch(`/runic-duels/${encodeURIComponent(runId)}/abandon`, { method: 'POST' }),

  // Labirynt Tajemnic
  getDungeonStatus: () => apiFetch('/dungeon-escape/status'),
  startDungeon: () => apiFetch('/dungeon-escape/start', { method: 'POST' }),
  submitDungeonAnswer: (attemptId, answer) => apiFetch('/dungeon-escape/submit', { method: 'POST', body: JSON.stringify({ attemptId, answer }) }),
  getDungeonHint: (attemptId) => apiFetch('/dungeon-escape/hint', { method: 'POST', body: JSON.stringify({ attemptId }) }),
  abandonDungeon: (attemptId) => apiFetch('/dungeon-escape/abandon', { method: 'POST', body: JSON.stringify({ attemptId }) }),

  // Połów w Zamarzniętym Fjordzie
  getFishingStatus: () => apiFetch('/fishing/status'),
  startFishingSession: (runId, mode) => apiFetch('/fishing/sessions', {
    method: 'POST',
    body: JSON.stringify({ runId, mode })
  }),
  startFishingCast: (sessionId, cast) => apiFetch(`/fishing/sessions/${encodeURIComponent(sessionId)}/casts`, {
    method: 'POST',
    body: JSON.stringify(cast)
  }),
  completeFishingCast: (sessionId, castId, result) => apiFetch(`/fishing/sessions/${encodeURIComponent(sessionId)}/casts/${encodeURIComponent(castId)}/complete`, {
    method: 'POST',
    body: JSON.stringify(result)
  }),
  completeFishingSession: (sessionId) => apiFetch(`/fishing/sessions/${encodeURIComponent(sessionId)}/complete`, { method: 'POST' }),
  abandonFishingSession: (sessionId) => apiFetch(`/fishing/sessions/${encodeURIComponent(sessionId)}/abandon`, { method: 'POST' }),

  // ==================== DZIENNIKI LEKCYJNE & RANKINGI ====================
  getLessons: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.subject) params.append('subject', filters.subject);
    if (filters.classYear) params.append('classYear', filters.classYear);
    if (filters.professor) params.append('professor', filters.professor);
    if (filters.house) params.append('house', filters.house);
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(`/lessons${query}`);
  },

  getLesson: (id) => apiFetch(`/lessons/${id}`),
  getLessonMessages: (id) => apiFetch(`/lessons/${id}/messages`),
  createLesson: (lessonData) => apiFetch('/lessons', { method: 'POST', body: JSON.stringify(lessonData) }),
  updateLesson: (id, lessonData) => apiFetch(`/lessons/${id}`, { method: 'PUT', body: JSON.stringify(lessonData) }),
  publishLesson: (id) => apiFetch(`/lessons/${id}/publish`, { method: 'POST' }),
  deleteLesson: (id) => apiFetch(`/lessons/${id}`, { method: 'DELETE' }),
  deleteLessonDraft: (id) => apiFetch(`/lessons/${id}/draft`, { method: 'DELETE' }),
  
  // House Rankings & Ledger
  getHouseRankings: (period = 'overall') => apiFetch(`/lessons/rankings/houses?period=${period}`),
  getPointLedger: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.house) params.append('house', filters.house);
    if (filters.studentId) params.append('studentId', filters.studentId);
    if (filters.lessonId) params.append('lessonId', filters.lessonId);
    if (filters.limit) params.append('limit', filters.limit);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(`/lessons/ledger/transactions${query}`);
  },
  getPointAuditLogs: () => apiFetch('/lessons/audit-logs'),
  correctPointTransaction: (data) => apiFetch('/lessons/ledger/correct', { method: 'POST', body: JSON.stringify(data) }),
  recalculateRankings: () => apiFetch('/lessons/recalculate-rankings', { method: 'POST' }),
  awardPoints: (data) => apiFetch('/lessons/points/award', { method: 'POST', body: JSON.stringify(data) }),
  adminAwardHousePoints: (data) => apiFetch('/admin/points/award-house', { method: 'POST', body: JSON.stringify(data) }),
  getLessonStats: () => apiFetch('/lessons/stats/overview'),

  // Discord Bot & Verification
  getDiscordStatus: () => apiFetch('/discord/status'),
  updateDiscordConfig: (config) => apiFetch('/discord/config', { method: 'POST', body: JSON.stringify(config) }),
  startDiscordLesson: (data) => apiFetch('/discord/start-lesson', { method: 'POST', body: JSON.stringify(data) }),
  postDiscordMessage: (data) => apiFetch('/discord/post-message', { method: 'POST', body: JSON.stringify(data) }),
  endDiscordLesson: (data) => apiFetch('/discord/end-lesson', { method: 'POST', body: JSON.stringify(data) }),
  generateDiscordVerificationCode: () => apiFetch('/discord/verification/generate', { method: 'POST' }),
  getDiscordVerificationStatus: () => apiFetch('/discord/verification/status'),
  verifyDiscordManual: (data) => apiFetch('/discord/verification/verify-manual', { method: 'POST', body: JSON.stringify(data) }),
  unlinkDiscordAccount: () => apiFetch('/discord/verification/unlink', { method: 'POST' }),
  resyncDiscordRoles: () => apiFetch('/discord/verification/resync', { method: 'POST' }),
  getDiscordRoleMappings: () => apiFetch('/discord/role-mappings'),
  updateDiscordRoleMappings: (mappings) => apiFetch('/discord/role-mappings', { method: 'POST', body: JSON.stringify({ mappings }) }),
  getDiscordVerificationsHistory: () => apiFetch('/discord/verifications'),

  // ==================== MODUŁ PRZEDMIOTÓW (KATEDRY) ====================
  getSubjects: () => apiFetch('/subjects'),
  getSubject: (id) => apiFetch(`/subjects/${id}`),
  createSubject: (data) => apiFetch('/subjects', { method: 'POST', body: JSON.stringify(data) }),
  updateSubject: (id, data) => apiFetch(`/subjects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSubject: (id) => apiFetch(`/subjects/${id}`, { method: 'DELETE' }),
  updateSyllabus: (id, syllabus) => apiFetch(`/subjects/${id}/syllabus`, { method: 'PUT', body: JSON.stringify({ syllabus }) }),
  updateRegulations: (id, regulations) => apiFetch(`/subjects/${id}/regulations`, { method: 'PUT', body: JSON.stringify({ regulations }) }),
  getGrades: (subjectId, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.studentId) params.append('studentId', filters.studentId);
    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    if (filters.house) params.append('house', filters.house);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(`/subjects/${subjectId}/grades${query}`);
  },
  addGrade: (subjectId, gradeData) => apiFetch(`/subjects/${subjectId}/grades`, { method: 'POST', body: JSON.stringify(gradeData) }),
  batchAddGrades: (subjectId, batchData) => apiFetch(`/subjects/${subjectId}/grades/batch`, { method: 'POST', body: JSON.stringify(batchData) }),
  deleteGrade: (subjectId, gradeId) => apiFetch(`/subjects/${subjectId}/grades/${gradeId}`, { method: 'DELETE' }),
  addGradeCategory: (subjectId, data) => apiFetch(`/subjects/${subjectId}/categories`, { method: 'POST', body: JSON.stringify(data) }),
  updateGradeCategory: (subjectId, catId, data) => apiFetch(`/subjects/${subjectId}/categories/${catId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteGradeCategory: (subjectId, catId) => apiFetch(`/subjects/${subjectId}/categories/${catId}`, { method: 'DELETE' }),

  // ==================== MODUŁ PLANU LEKCJI & HARMONOGRAM ====================
  getTimetable: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.day !== undefined && filters.day !== 'all' && filters.day !== '') params.append('day', filters.day);
    if (filters.classYear && filters.classYear !== 'all') params.append('classYear', filters.classYear);
    if (filters.professor && filters.professor !== 'all') params.append('professor', filters.professor);
    if (filters.classroom && filters.classroom !== 'all') params.append('classroom', filters.classroom);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.house && filters.house !== 'all') params.append('house', filters.house);
    if (filters.search) params.append('search', filters.search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(`/timetable${query}`);
  },
  getTimetableStats: () => apiFetch('/timetable/stats'),
  getTimetableEntry: (id) => apiFetch(`/timetable/${id}`),
  createTimetableEntry: (data) => apiFetch('/timetable', { method: 'POST', body: JSON.stringify(data) }),
  updateTimetableEntry: (id, data) => apiFetch(`/timetable/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  substituteTimetableEntry: (id, data) => apiFetch(`/timetable/${id}/substitute`, { method: 'PATCH', body: JSON.stringify(data) }),
  cancelTimetableEntry: (id, cancellationReason) => apiFetch(`/timetable/${id}/cancel`, { method: 'PATCH', body: JSON.stringify({ cancellationReason }) }),
  restoreTimetableEntry: (id) => apiFetch(`/timetable/${id}/restore`, { method: 'PATCH' }),
  deleteTimetableEntry: (id) => apiFetch(`/timetable/${id}`, { method: 'DELETE' }),

  // ==================== MODUŁ BANKU CYTADELI (SKÍRNISBANKI) ====================
  depositCurrency: (data) => apiFetch('/bank/deposit', { method: 'POST', body: JSON.stringify(data) }),
  getBankAccount: (userId) => apiFetch(`/bank/account/${userId}`),
  getBankAccounts: () => apiFetch('/bank/accounts'),
  transferFunds: (data) => apiFetch('/bank/transfer', { method: 'POST', body: JSON.stringify(data) }),
  getBankTransactions: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.category && filters.category !== 'all') params.append('category', filters.category);
    if (filters.type && filters.type !== 'all') params.append('type', filters.type);
    if (filters.search) params.append('search', filters.search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(`/bank/transactions${query}`);
  },
  payoutAllSalaries: (data = {}) => apiFetch('/bank/salaries/payout-all', { method: 'POST', body: JSON.stringify(data) }),
  payoutLessonSalary: (data) => apiFetch('/bank/salaries/payout-lesson', { method: 'POST', body: JSON.stringify(data) }),
  getTeacherSalaries: () => apiFetch('/bank/salaries'),

  // ==================== MODUŁ RYNKU KAUPANGR & SKLEPÓW ====================
  getStoreItems: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.shopId && filters.shopId !== 'all') params.append('shopId', filters.shopId);
    if (filters.category && filters.category !== 'all') params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(`/market/items${query}`);
  },
  createStoreItem: (data) => apiFetch('/market/items', { method: 'POST', body: JSON.stringify(data) }),
  updateStoreItem: (id, data) => apiFetch(`/market/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteStoreItem: (id) => apiFetch(`/market/items/${id}`, { method: 'DELETE' }),
  buyStoreItem: (data) => apiFetch('/market/buy', { method: 'POST', body: JSON.stringify(data) }),
  getShoppingLists: (userId) => {
    const query = userId ? `?userId=${userId}` : '';
    return apiFetch(`/market/shopping-lists${query}`);
  },
  // ==================== SKANDYNAWSKA LOTERIA ODYNA ====================
  getCurrentLottery: () => apiFetch('/lottery/current'),
  buyLotteryTicket: (data) => apiFetch('/lottery/buy-ticket', { method: 'POST', body: JSON.stringify(data) }),
  drawLottery: (data = {}) => apiFetch('/lottery/draw', { method: 'POST', body: JSON.stringify(data) }),
  getLotteryHistory: () => apiFetch('/lottery/history'),

  // ==================== DOKUMENTY, DEKRETY & STATUT ====================
  getDocuments: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.category && filters.category !== 'all') params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);
    if (filters.officialOnly) params.append('officialOnly', 'true');
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(`/documents${query}`);
  },
  getDocument: (slugOrId) => apiFetch(`/documents/${slugOrId}`),
  createDocument: (docData) => apiFetch('/documents', { method: 'POST', body: JSON.stringify(docData) }),
  updateDocument: (id, docData) => apiFetch(`/documents/${id}`, { method: 'PUT', body: JSON.stringify(docData) }),
  deleteDocument: (id) => apiFetch(`/documents/${id}`, { method: 'DELETE' }),

  // ==================== CMS BANERY I GRAFIKI BLOKÓW ====================
  getCmsBanners: () => apiFetch('/cms/banners'),
  createCmsBanner: (data) => apiFetch('/cms/banners', { method: 'POST', body: JSON.stringify(data) }),
  updateCmsBanner: (id, data) => apiFetch(`/cms/banners/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCmsBanner: (id) => apiFetch(`/cms/banners/${id}`, { method: 'DELETE' }),

  getCmsBlocks: () => apiFetch('/cms/blocks'),
  createCmsBlock: (data) => apiFetch('/cms/blocks', { method: 'POST', body: JSON.stringify(data) }),
  updateCmsBlock: (id, data) => apiFetch(`/cms/blocks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCmsBlock: (id) => apiFetch(`/cms/blocks/${id}`, { method: 'DELETE' }),

  // ==================== KALENDARZ WYDARZEŃ ====================
  getEvents: () => apiFetch('/events'),
  createEvent: (data) => apiFetch('/events', { method: 'POST', body: JSON.stringify(data) }),
  updateEvent: (id, data) => apiFetch(`/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEvent: (id) => apiFetch(`/events/${id}`, { method: 'DELETE' }),

  // ==================== SIDE QUESTY Z MAPY & TAJEMNICE ====================
  getCompletedQuests: (userId) => {
    const query = userId ? `?userId=${userId}` : '';
    return apiFetch(`/quests/completed${query}`);
  },
  completeQuest: (data) => apiFetch('/quests/complete', { method: 'POST', body: JSON.stringify(data) }),
  getExpeditionStatus: () => apiFetch('/quests/expeditions/status'),
  startExpedition: (destinationId) => apiFetch('/quests/expeditions/start', {
    method: 'POST',
    body: JSON.stringify({ destinationId })
  }),
  completeExpedition: (attemptId, choices) => apiFetch('/quests/expeditions/complete', {
    method: 'POST',
    body: JSON.stringify({ attemptId, choices })
  }),

  getDiscoveredSecrets: (userId) => {
    const query = userId ? `?userId=${userId}` : '';
    return apiFetch(`/secrets${query}`);
  },
  discoverSecret: (data) => apiFetch('/secrets/discover', { method: 'POST', body: JSON.stringify(data) }),

  // ==================== WARSZTAT RUNICZNY I ALCHEMIA ====================
  getCraftedFormulas: (userId) => {
    const query = userId ? `?userId=${userId}` : '';
    return apiFetch(`/workshop/formulas${query}`);
  },
  craftFormula: (data) => apiFetch('/workshop/craft', { method: 'POST', body: JSON.stringify(data) }),

  // ==================== ZADANIA DOMOWE I WYPRACOWANIA (TMD) ====================
  getHomework: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.studentId) params.append('studentId', filters.studentId);
    if (filters.subjectId) params.append('subjectId', filters.subjectId);
    if (filters.classYear) params.append('classYear', filters.classYear);
    if (filters.schoolYear) params.append('schoolYear', filters.schoolYear);
    if (filters.status) params.append('status', filters.status);
    if (filters.type) params.append('type', filters.type);
    if (filters.search) params.append('search', filters.search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(`/homework${query}`);
  },
  getStudentHomeworkOverview: () => apiFetch('/homework/student/overview'),
  getHomeworkCalendar: () => apiFetch('/homework/calendar'),
  getHomeworkArchive: () => apiFetch('/homework/archive'),
  getHomeworkDetails: (id) => apiFetch(`/homework/${id}`),
  createHomework: (data) => apiFetch('/homework', { method: 'POST', body: JSON.stringify(data) }),
  updateHomework: (id, data) => apiFetch(`/homework/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteHomework: (id) => apiFetch(`/homework/${id}`, { method: 'DELETE' }),
  duplicateHomework: (id) => apiFetch(`/homework/${id}/duplicate`, { method: 'POST' }),
  getHomeworkSubmissions: (id, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.house) params.append('house', filters.house);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(`/homework/${id}/submissions${query}`);
  },
  getHomeworkSubmissionDetails: (subId) => apiFetch(`/homework/submissions/${subId}`),
  saveHomeworkDraft: (id, data) => apiFetch(`/homework/${id}/draft`, { method: 'POST', body: JSON.stringify(data) }),
  submitHomework: (id, data) => apiFetch(`/homework/${id}/submit`, { method: 'POST', body: JSON.stringify(data) }),
  gradeHomeworkSubmission: (subId, data) => apiFetch(`/homework/submissions/${subId}/grade`, { method: 'POST', body: JSON.stringify(data) }),
  returnHomeworkForRevision: (subId, data) => apiFetch(`/homework/submissions/${subId}/return`, { method: 'POST', body: JSON.stringify(data) }),
  setHomeworkException: (id, data) => apiFetch(`/homework/${id}/exceptions`, { method: 'POST', body: JSON.stringify(data) }),
  deleteHomeworkException: (id, studentId) => apiFetch(`/homework/${id}/exceptions/${studentId}`, { method: 'DELETE' }),
  getHomeworkTemplates: () => apiFetch('/homework/templates'),
  createHomeworkTemplate: (data) => apiFetch('/homework/templates', { method: 'POST', body: JSON.stringify(data) }),
  deleteHomeworkTemplate: (id) => apiFetch(`/homework/templates/${id}`, { method: 'DELETE' }),
  getHomeworkQuickComments: () => apiFetch('/homework/quick-comments'),
  createHomeworkQuickComment: (data) => apiFetch('/homework/quick-comments', { method: 'POST', body: JSON.stringify(data) }),
  deleteHomeworkQuickComment: (id) => apiFetch(`/homework/quick-comments/${id}`, { method: 'DELETE' }),
  uploadHomeworkAttachment: (data) => apiFetch('/homework/upload', { method: 'POST', body: JSON.stringify(data) }),

  // ==================== KRUCZA POCZTA & WIADOMOŚCI ====================
  getRavenMessages: () => apiFetch('/raven'),
  sendRavenMessage: (data) => apiFetch('/raven', { method: 'POST', body: JSON.stringify(data) }),
  markRavenRead: (id) => apiFetch(`/raven/${id}/read`, { method: 'PATCH' }),
  toggleRavenStar: (id) => apiFetch(`/raven/${id}/star`, { method: 'PATCH' }),
  deleteRavenMessage: (id) => apiFetch(`/raven/${id}`, { method: 'DELETE' }),

  // ==================== ŻELAZNE PIÓRO — GAZETKA SZKOLNA ====================
  getGazetteSections: () => apiFetch('/gazette/sections'),
  createGazetteSection: (data) => apiFetch('/gazette/sections', { method: 'POST', body: JSON.stringify(data) }),
  updateGazetteSection: (id, data) => apiFetch(`/gazette/sections/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteGazetteSection: (id) => apiFetch(`/gazette/sections/${id}`, { method: 'DELETE' }),

  getGazetteIssues: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.year) params.append('year', filters.year);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(`/gazette/issues${query}`);
  },
  getGazetteIssuesAll: () => apiFetch('/gazette/issues/all'),
  getGazetteIssueLatest: () => apiFetch('/gazette/issues/latest'),
  getGazetteIssue: (id) => apiFetch(`/gazette/issues/${id}`),
  createGazetteIssue: (data) => apiFetch('/gazette/issues', { method: 'POST', body: JSON.stringify(data) }),
  updateGazetteIssue: (id, data) => apiFetch(`/gazette/issues/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  publishGazetteIssue: (id) => apiFetch(`/gazette/issues/${id}/publish`, { method: 'POST' }),

  getGazetteArticles: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.issueId) params.append('issueId', filters.issueId);
    if (filters.status) params.append('status', filters.status);
    if (filters.authorId) params.append('authorId', filters.authorId);
    if (filters.sectionId) params.append('sectionId', filters.sectionId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(`/gazette/articles${query}`);
  },
  createGazetteArticle: (data) => apiFetch('/gazette/articles', { method: 'POST', body: JSON.stringify(data) }),
  updateGazetteArticle: (id, data) => apiFetch(`/gazette/articles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateGazetteArticleStatus: (id, data) => apiFetch(`/gazette/articles/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteGazetteArticle: (id) => apiFetch(`/gazette/articles/${id}`, { method: 'DELETE' }),
  getGazetteArticleComments: (id) => apiFetch(`/gazette/articles/${id}/comments`),
  addGazetteArticleComment: (id, data) => apiFetch(`/gazette/articles/${id}/comments`, { method: 'POST', body: JSON.stringify(data) }),

  getGazettePages: (issueId) => apiFetch(`/gazette/pages/${issueId}`),
  createGazettePage: (data) => apiFetch('/gazette/pages', { method: 'POST', body: JSON.stringify(data) }),
  updateGazettePage: (id, data) => apiFetch(`/gazette/pages/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteGazettePage: (id) => apiFetch(`/gazette/pages/${id}`, { method: 'DELETE' }),
  reorderGazettePages: (pages) => apiFetch('/gazette/pages/reorder', { method: 'PATCH', body: JSON.stringify({ pages }) }),

  getGazetteStaff: () => apiFetch('/gazette/staff'),
  addGazetteStaff: (data) => apiFetch('/gazette/staff', { method: 'POST', body: JSON.stringify(data) }),
  removeGazetteStaff: (id) => apiFetch(`/gazette/staff/${id}`, { method: 'DELETE' }),

  createGazetteQuiz: (data) => apiFetch('/gazette/quizzes', { method: 'POST', body: JSON.stringify(data) }),
  updateGazetteQuiz: (id, data) => apiFetch(`/gazette/quizzes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  createGazetteCrossword: (data) => apiFetch('/gazette/crosswords', { method: 'POST', body: JSON.stringify(data) }),
  updateGazetteCrossword: (id, data) => apiFetch(`/gazette/crosswords/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  submitToGazette: (data) => apiFetch('/gazette/submissions', { method: 'POST', body: JSON.stringify(data) }),
  getGazetteSubmissions: () => apiFetch('/gazette/submissions'),
  reviewGazetteSubmission: (id, data) => apiFetch(`/gazette/submissions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  createGazetteSecret: (data) => apiFetch('/gazette/secrets', { method: 'POST', body: JSON.stringify(data) }),

  logGazetteAnalytics: (data) => apiFetch('/gazette/analytics', { method: 'POST', body: JSON.stringify(data) }),
  getGazetteAnalytics: (issueId) => apiFetch(`/gazette/analytics/${issueId}`),

  getGazetteArchive: () => apiFetch('/gazette/archive'),
  searchGazette: (q, issueId) => {
    const params = new URLSearchParams();
    params.append('q', q);
    if (issueId) params.append('issueId', issueId);
    return apiFetch(`/gazette/search?${params.toString()}`);
  },

  // ==================== MODUŁ EGZAMINACYJNY ====================
  getExamGradingScales: () => apiFetch('/exams/scales'),
  createExamGradingScale: (data) => apiFetch('/exams/scales', { method: 'POST', body: JSON.stringify(data) }),
  updateExamGradingScale: (id, data) => apiFetch(`/exams/scales/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExamGradingScale: (id) => apiFetch(`/exams/scales/${id}`, { method: 'DELETE' }),

  getExamSessions: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.classYear) params.append('classYear', filters.classYear);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(`/exams/sessions${query}`);
  },
  getExamSession: (id) => apiFetch(`/exams/sessions/${id}`),
  createExamSession: (data) => apiFetch('/exams/sessions', { method: 'POST', body: JSON.stringify(data) }),
  updateExamSession: (id, data) => apiFetch(`/exams/sessions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExamSession: (id) => apiFetch(`/exams/sessions/${id}`, { method: 'DELETE' }),

  getQuestionBankCategories: (subjectId) => {
    const query = subjectId ? `?subjectId=${subjectId}` : '';
    return apiFetch(`/exams/question-categories${query}`);
  },
  createQuestionBankCategory: (data) => apiFetch('/exams/question-categories', { method: 'POST', body: JSON.stringify(data) }),
  updateQuestionBankCategory: (id, data) => apiFetch(`/exams/question-categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteQuestionBankCategory: (id) => apiFetch(`/exams/question-categories/${id}`, { method: 'DELETE' }),

  getQuestions: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.subjectId) params.append('subjectId', filters.subjectId);
    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    if (filters.difficulty) params.append('difficulty', filters.difficulty);
    if (filters.type) params.append('type', filters.type);
    if (filters.search) params.append('search', filters.search);
    if (filters.tags) params.append('tags', filters.tags);
    if (filters.includeArchived) params.append('includeArchived', '1');
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(`/exams/questions${query}`);
  },
  getQuestion: (id) => apiFetch(`/exams/questions/${id}`),
  createQuestion: (data) => apiFetch('/exams/questions', { method: 'POST', body: JSON.stringify(data) }),
  updateQuestion: (id, data) => apiFetch(`/exams/questions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteQuestion: (id) => apiFetch(`/exams/questions/${id}`, { method: 'DELETE' }),

  getExams: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.sessionId) params.append('sessionId', filters.sessionId);
    if (filters.subjectId) params.append('subjectId', filters.subjectId);
    if (filters.professorId) params.append('professorId', filters.professorId);
    if (filters.status) params.append('status', filters.status);
    if (filters.classYear) params.append('classYear', filters.classYear);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(`/exams/exams${query}`);
  },
  getExam: (id) => apiFetch(`/exams/exams/${id}`),
  createExam: (data) => apiFetch('/exams/exams', { method: 'POST', body: JSON.stringify(data) }),
  updateExam: (id, data) => apiFetch(`/exams/exams/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  publishExam: (id) => apiFetch(`/exams/exams/${id}/publish`, { method: 'POST' }),
  closeExam: (id) => apiFetch(`/exams/exams/${id}/close`, { method: 'POST' }),
  duplicateExam: (id) => apiFetch(`/exams/exams/${id}/duplicate`, { method: 'POST' }),
  saveExamAsTemplate: (id, data) => apiFetch(`/exams/exams/${id}/save-template`, { method: 'POST', body: JSON.stringify(data) }),
  monitorExam: (id) => apiFetch(`/exams/exams/${id}/monitor`),

  addExamSection: (examId, data) => apiFetch(`/exams/exams/${examId}/sections`, { method: 'POST', body: JSON.stringify(data) }),
  updateExamSection: (sectionId, data) => apiFetch(`/exams/sections/${sectionId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExamSection: (sectionId) => apiFetch(`/exams/sections/${sectionId}`, { method: 'DELETE' }),

  addExamQuestion: (examId, data) => apiFetch(`/exams/exams/${examId}/exam-questions`, { method: 'POST', body: JSON.stringify(data) }),
  addExamQuestionsBulk: (examId, data) => apiFetch(`/exams/exams/${examId}/exam-questions/bulk`, { method: 'POST', body: JSON.stringify(data) }),
  updateExamQuestion: (eqId, data) => apiFetch(`/exams/exam-questions/${eqId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExamQuestion: (eqId) => apiFetch(`/exams/exam-questions/${eqId}`, { method: 'DELETE' }),
  reorderExamQuestions: (examId, order) => apiFetch(`/exams/exams/${examId}/exam-questions/reorder`, { method: 'POST', body: JSON.stringify({ order }) }),

  setExamQuestionRubric: (eqId, data) => apiFetch(`/exams/exam-questions/${eqId}/rubric`, { method: 'POST', body: JSON.stringify(data) }),

  getExamTemplates: () => apiFetch('/exams/templates'),
  deleteExamTemplate: (id) => apiFetch(`/exams/templates/${id}`, { method: 'DELETE' }),

  getStudentExamCenter: () => apiFetch('/exams/student/center'),
  getStudentExamCard: (examId) => apiFetch(`/exams/student/exam/${examId}`),
  getStudentExamHistory: () => apiFetch('/exams/student/history'),
  getStudentExamResult: (attemptId) => apiFetch(`/exams/student/result/${attemptId}`),

  startExamAttempt: (examId) => apiFetch(`/exams/attempts/start/${examId}`, { method: 'POST' }),
  getExamAttempt: (attemptId) => apiFetch(`/exams/attempts/${attemptId}`),
  saveExamAnswer: (attemptId, data) => apiFetch(`/exams/attempts/${attemptId}/save`, { method: 'POST', body: JSON.stringify(data) }),
  flagExamQuestion: (attemptId, data) => apiFetch(`/exams/attempts/${attemptId}/flag`, { method: 'POST', body: JSON.stringify(data) }),
  submitExamAttempt: (attemptId) => apiFetch(`/exams/attempts/${attemptId}/submit`, { method: 'POST' }),

  getExamGradingOverview: (examId) => apiFetch(`/exams/grading/exam/${examId}`),
  getExamGradingAttempt: (attemptId) => apiFetch(`/exams/grading/attempt/${attemptId}`),
  gradeExamAnswer: (answerId, data) => apiFetch(`/exams/grading/answer/${answerId}`, { method: 'POST', body: JSON.stringify(data) }),
  approveExamResult: (attemptId, data) => apiFetch(`/exams/grading/attempt/${attemptId}/approve`, { method: 'POST', body: JSON.stringify(data) }),
  publishAllExamResults: (examId) => apiFetch(`/exams/grading/exam/${examId}/publish-all`, { method: 'POST' }),

  getExamStatistics: (examId) => apiFetch(`/exams/statistics/exam/${examId}`),

  createExamException: (data) => apiFetch('/exams/exceptions', { method: 'POST', body: JSON.stringify(data) }),
  getExamExceptions: (examId) => apiFetch(`/exams/exceptions/exam/${examId}`),
  deleteExamException: (id) => apiFetch(`/exams/exceptions/${id}`, { method: 'DELETE' }),

  extendAttemptTime: (attemptId, data) => apiFetch(`/exams/attempts/${attemptId}/extend-time`, { method: 'POST', body: JSON.stringify(data) }),
  extendExamTimeAll: (examId, data) => apiFetch(`/exams/exams/${examId}/extend-time-all`, { method: 'POST', body: JSON.stringify(data) }),

  getExamAuditLog: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.entityType) params.append('entityType', filters.entityType);
    if (filters.entityId) params.append('entityId', filters.entityId);
    if (filters.limit) params.append('limit', filters.limit);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(`/exams/audit${query}`);
  },

  // Admin & System Diagnostics & Interactive Database Explorer
  createAdminAccount: (adminData) => apiFetch('/admin/create-account', { method: 'POST', body: JSON.stringify(adminData) }),
  getAuditLogs: () => apiFetch('/admin/audit-logs'),
  addAuditLog: (data) => apiFetch('/admin/audit-logs', { method: 'POST', body: JSON.stringify(data) }),
  getSystemStats: () => apiFetch('/admin/system-stats'),
  getDatabaseBackup: () => apiFetch('/admin/backup-export'),
  importDatabaseBackup: (backup) => apiFetch('/admin/backup-import', { method: 'POST', body: JSON.stringify({ backup }) }),
  optimizeDatabase: () => apiFetch('/admin/optimize-db', { method: 'POST' }),

  // Database Explorer (CRUD for Dyrekcja)
  getDbTables: () => apiFetch('/admin/db/tables'),
  getDbTableRows: (tableName, params = {}) => {
    const q = new URLSearchParams();
    if (params.search) q.append('search', params.search);
    if (params.limit) q.append('limit', params.limit);
    if (params.offset) q.append('offset', params.offset);
    const query = q.toString() ? `?${q.toString()}` : '';
    return apiFetch(`/admin/db/table/${encodeURIComponent(tableName)}${query}`);
  },
  createDbTableRow: (tableName, data) => apiFetch(`/admin/db/table/${encodeURIComponent(tableName)}`, { method: 'POST', body: JSON.stringify(data) }),
  updateDbTableRow: (tableName, id, data) => apiFetch(`/admin/db/table/${encodeURIComponent(tableName)}/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDbTableRow: (tableName, id) => apiFetch(`/admin/db/table/${encodeURIComponent(tableName)}/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // Health
  health: () => apiFetch('/health'),

  // ==================== IZBA PAMIĘCI (MEMORIAL ARCHIVE) ====================
  getMemoryOverview: () => apiFetch('/memory/overview'),
  getMemoryYears: (includeDrafts = false) => apiFetch(`/memory/years${includeDrafts ? '?includeDrafts=true' : ''}`),
  getMemoryYear: (yearId) => apiFetch(`/memory/years/${encodeURIComponent(yearId)}`),
  getMemoryWallOfFame: () => apiFetch('/memory/wall-of-fame'),
  getMemoryTrophies: (house = 'all') => apiFetch(`/memory/trophies${house && house !== 'all' ? `?house=${house}` : ''}`),
  getMemoryDocuments: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.house) params.append('house', filters.house);
    if (filters.yearId) params.append('yearId', filters.yearId);
    if (filters.search) params.append('search', filters.search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(`/memory/documents${query}`);
  },
  getMemoryChronicle: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.yearId) params.append('yearId', filters.yearId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(`/memory/chronicle${query}`);
  },
  getMemoryPeople: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.role) params.append('role', filters.role);
    if (filters.house) params.append('house', filters.house);
    if (filters.yearId) params.append('yearId', filters.yearId);
    if (filters.search) params.append('search', filters.search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(`/memory/people${query}`);
  },
  getMemoryPerson: (identifier) => apiFetch(`/memory/person/${encodeURIComponent(identifier)}`),
  getMemoryOrderShowcase: (houseKey) => apiFetch(`/memory/order/${encodeURIComponent(houseKey)}`),
  searchMemory: (q) => apiFetch(`/memory/search?q=${encodeURIComponent(q)}`),
  previewYearArchive: (params = {}) => apiFetch('/memory/archive-year/preview', { method: 'POST', body: JSON.stringify(params) }),
  publishYearArchive: (payload) => apiFetch('/memory/archive-year/publish', { method: 'POST', body: JSON.stringify(payload) }),
  createMemoryCertificate: (cert) => apiFetch('/memory/certificates', { method: 'POST', body: JSON.stringify(cert) }),
  deleteMemoryCertificate: (id) => apiFetch(`/memory/certificates/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  createMemoryDiploma: (dipl) => apiFetch('/memory/diplomas', { method: 'POST', body: JSON.stringify(dipl) }),
  deleteMemoryDiploma: (id) => apiFetch(`/memory/diplomas/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  createMemoryAward: (aw) => apiFetch('/memory/awards', { method: 'POST', body: JSON.stringify(aw) }),
  deleteMemoryAward: (id) => apiFetch(`/memory/awards/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  createMemoryAchievement: (ach) => apiFetch('/memory/custom-achievements', { method: 'POST', body: JSON.stringify(ach) }),
  deleteMemoryAchievement: (id) => apiFetch(`/memory/custom-achievements/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // ==================== IZBA PRZYJĘĆ I USPRAWIEDLIWIEŃ ====================
  getAbsenceRequests: (filters = {}) => {
    const p = new URLSearchParams();
    if (filters.status) p.append('status', filters.status);
    if (filters.type) p.append('type', filters.type);
    const q = p.toString() ? `?${p.toString()}` : '';
    return apiFetch(`/absences${q}`);
  },
  getAbsenceQueue: () => apiFetch('/absences/queue'),
  getAbsenceStats: () => apiFetch('/absences/stats'),
  getUnexcusedAbsences: () => apiFetch('/absences/unexcused'),
  getAbsenceConfig: () => apiFetch('/absences/config'),
  updateAbsenceConfig: (data) => apiFetch('/absences/config', { method: 'PUT', body: JSON.stringify(data) }),
  getAbsenceRequest: (id) => apiFetch(`/absences/${id}`),
  createAbsenceRequest: (data) => apiFetch('/absences', { method: 'POST', body: JSON.stringify(data) }),
  updateAbsenceRequest: (id, data) => apiFetch(`/absences/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  cancelAbsenceRequest: (id) => apiFetch(`/absences/${id}`, { method: 'DELETE' }),
  reviewAbsenceRequest: (id, data) => apiFetch(`/absences/${id}/review`, { method: 'POST', body: JSON.stringify(data) }),
  getLessonParticipantsWithExcuse: (lessonId) => apiFetch(`/absences/lesson/${encodeURIComponent(lessonId)}/participants`),
  getTimetablePreviewForAbsence: (startAt, endAt) => apiFetch(`/absences/timetable-preview?startAt=${encodeURIComponent(startAt)}&endAt=${encodeURIComponent(endAt)}`),

  // ── Zapisy (Enrollment) ─────────────────────────────────────────────────────
  getEnrollmentConfig: () => apiFetch('/enrollments/config'),
  updateEnrollmentConfig: (data) => apiFetch('/enrollments/config', { method: 'PUT', body: JSON.stringify(data) }),
  getEnrollmentStats: () => apiFetch('/enrollments/stats'),
  getEnrolledProfessors: () => apiFetch('/enrollments/professors'),
  getEnrollmentApplications: () => apiFetch('/enrollments/applications'),
  applyForSubject: (data) => apiFetch('/enrollments/apply', { method: 'POST', body: JSON.stringify(data) }),
  reviewEnrollmentApplication: (id, data) => apiFetch(`/enrollments/applications/${id}/review`, { method: 'POST', body: JSON.stringify(data) }),
  cancelEnrollmentApplication: (id) => apiFetch(`/enrollments/applications/${id}`, { method: 'DELETE' }),
  removeProfessorSubject: (profId, subjectId) => apiFetch(`/enrollments/professors/${profId}/subjects/${subjectId}`, { method: 'DELETE' })
};

export default api;
