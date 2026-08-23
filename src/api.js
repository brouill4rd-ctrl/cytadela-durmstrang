// API helper for communicating with the backend server
const API_BASE = '/api';

async function apiFetch(path, options = {}) {
  try {
    // Automatycznie dołącz nagłówek autoryzacji z aktualnie zalogowanego użytkownika
    const currentUserId = localStorage.getItem('durmstrang_current_user_id');
    const authHeaders = {};
    if (currentUserId && currentUserId !== 'guest' && currentUserId !== 'null') {
      authHeaders['X-User-Id'] = currentUserId;
    }

    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...authHeaders, ...options.headers },
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
  // Auth
  login: (username, password) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  register: (userData) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),

  // Users
  getUsers: () => apiFetch('/users'),
  getUser: (id) => apiFetch(`/users/${id}`),
  updateUser: (id, fields) => apiFetch(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(fields) }),
  approveUser: (id, adminName) => apiFetch(`/users/${id}/approve`, { method: 'PATCH', body: JSON.stringify({ adminName }) }),
  rejectUser: (id, adminName) => apiFetch(`/users/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ adminName }) }),
  resetPassword: (id, newPassword) => apiFetch(`/users/${id}/reset-password`, { method: 'PATCH', body: JSON.stringify({ newPassword }) }),
  getPendingApplications: () => apiFetch('/users/pending/applications'),

  // Emails
  getEmails: () => apiFetch('/emails'),
  sendEmail: (emailData) => apiFetch('/emails', { method: 'POST', body: JSON.stringify(emailData) }),
  markEmailRead: (id) => apiFetch(`/emails/${id}/read`, { method: 'PATCH' }),

  // News
  getNews: () => apiFetch('/news'),
  createNews: (newsData) => apiFetch('/news', { method: 'POST', body: JSON.stringify(newsData) }),
  updateNews: (id, newsData) => apiFetch(`/news/${id}`, { method: 'PUT', body: JSON.stringify(newsData) }),
  deleteNews: (id) => apiFetch(`/news/${id}`, { method: 'DELETE' }),
  seedNews: (items) => apiFetch('/news/seed', { method: 'POST', body: JSON.stringify(items) }),

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
  createLesson: (lessonData) => apiFetch('/lessons', { method: 'POST', body: JSON.stringify(lessonData) }),
  updateLesson: (id, lessonData) => apiFetch(`/lessons/${id}`, { method: 'PUT', body: JSON.stringify(lessonData) }),
  publishLesson: (id) => apiFetch(`/lessons/${id}/publish`, { method: 'POST' }),
  deleteLesson: (id) => apiFetch(`/lessons/${id}`, { method: 'DELETE' }),
  
  // House Rankings & Ledger
  getHouseRankings: (period = 'overall') => apiFetch(`/lessons/rankings/houses?period=${period}`),
  getPointLedger: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.house) params.append('house', filters.house);
    if (filters.studentId) params.append('studentId', filters.studentId);
    if (filters.lessonId) params.append('lessonId', filters.lessonId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(`/lessons/ledger/transactions${query}`);
  },
  getPointAuditLogs: () => apiFetch('/lessons/audit-logs'),
  correctPointTransaction: (data) => apiFetch('/lessons/ledger/correct', { method: 'POST', body: JSON.stringify(data) }),
  recalculateRankings: () => apiFetch('/lessons/recalculate-rankings', { method: 'POST' }),
  awardPoints: (data) => apiFetch('/lessons/points/award', { method: 'POST', body: JSON.stringify(data) }),
  getLessonStats: () => apiFetch('/lessons/stats/overview'),

  // Discord Bot & Thread Simulator
  getDiscordStatus: () => apiFetch('/discord/status'),
  updateDiscordConfig: (config) => apiFetch('/discord/config', { method: 'POST', body: JSON.stringify(config) }),
  startDiscordLesson: (data) => apiFetch('/discord/start-lesson', { method: 'POST', body: JSON.stringify(data) }),
  postDiscordMessage: (data) => apiFetch('/discord/post-message', { method: 'POST', body: JSON.stringify(data) }),
  endDiscordLesson: (data) => apiFetch('/discord/end-lesson', { method: 'POST', body: JSON.stringify(data) }),

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
  deleteGrade: (subjectId, gradeId) => apiFetch(`/subjects/${subjectId}/grades/${gradeId}`, { method: 'DELETE' }),
  addGradeCategory: (subjectId, data) => apiFetch(`/subjects/${subjectId}/categories`, { method: 'POST', body: JSON.stringify(data) }),
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
  buyStoreItem: (data) => apiFetch('/market/buy', { method: 'POST', body: JSON.stringify(data) }),
  getShoppingLists: (userId) => {
    const query = userId ? `?userId=${userId}` : '';
    return apiFetch(`/market/shopping-lists${query}`);
  },
  checkShoppingLists: (userId) => apiFetch('/market/shopping-lists/check', { method: 'POST', body: JSON.stringify({ userId }) }),

  // ==================== SKANDYNAWSKA LOTERIA ODYNA ====================
  getCurrentLottery: (userId) => {
    const query = userId ? `?userId=${userId}` : '';
    return apiFetch(`/lottery/current${query}`);
  },
  buyLotteryTicket: (data) => apiFetch('/lottery/buy-ticket', { method: 'POST', body: JSON.stringify(data) }),
  drawLottery: (data = {}) => apiFetch('/lottery/draw', { method: 'POST', body: JSON.stringify(data) }),
  getLotteryHistory: () => apiFetch('/lottery/history'),

  // Admin & System Diagnostics
  createAdminAccount: (adminData) => apiFetch('/admin/create-account', { method: 'POST', body: JSON.stringify(adminData) }),
  getAuditLogs: () => apiFetch('/admin/audit-logs'),
  getSystemStats: () => apiFetch('/admin/system-stats'),
  getDatabaseBackup: () => apiFetch('/admin/backup-export'),
  optimizeDatabase: () => apiFetch('/admin/optimize-db', { method: 'POST' }),

  // Health
  health: () => apiFetch('/health')
};

