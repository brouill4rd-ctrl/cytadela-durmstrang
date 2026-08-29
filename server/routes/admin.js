import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db, { dbUserToFrontend, dbPointTxToFrontend, dbBankTransactionToFrontend } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  awardPoints, deductPoints, awardHousePoints, deductHousePoints,
  reverseTransaction, getUserPointsTotal, getHousePointsTotal,
  recalculateUserPoints, recalculateAllUserPoints, backfillSchoolYear
} from '../services/pointsService.js';
import {
  credit as creditSkirnir, debit as debitSkirnir,
  reverse as reverseSkirnir,
  recalculateBalance, recalculateAllBalances
} from '../services/skirnirService.js';
import { validatePassword } from '../utils/passwordPolicy.js';

const router = Router();

// Wszystkie endpointy admina wymagają roli admin
router.use(requireAuth, requireRole('admin'));

// POST /api/admin/create-account — create admin account (only from CMS)
router.post('/create-account', (req, res) => {
  const data = req.body;
  const trimmedUsername = (data.username || '').trim().toLowerCase();

  if (!trimmedUsername) {
    return res.status(400).json({ error: 'Podaj unikalny login dla członka Dyrekcji.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE LOWER(username) = ?').get(trimmedUsername);
  if (existing) {
    return res.status(409).json({ error: 'Taki login już istnieje.' });
  }

  const passwordCheck = validatePassword(data.password);
  if (!passwordCheck.valid) {
    return res.status(400).json({ error: passwordCheck.error });
  }

  const newId = `usr-${Date.now()}`;
  const userEmail = (data.email || '').trim() || `${trimmedUsername}@durmstrang.edu`;

  db.prepare(`
    INSERT INTO users (id, username, password, email, name, surname, full_name, role, status, house, title, avatar, department, department_name, default_banner_category, office, specialization, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'admin', 'approved', NULL, ?, ?, 'edykty', 'Rada Dyrekcji Cytadeli', 'edykty', ?, 'Najwyższa Magia Północy, Starożytne Pieczęcie i Prawa Cytadeli', ?)
  `).run(
    newId, trimmedUsername, bcrypt.hashSync(data.password, 10), userEmail,
    (data.name || '').trim(), (data.surname || '').trim(),
    `${(data.name || '').trim()} ${(data.surname || '').trim()}`,
    data.title || 'Arcymistrz Cytadeli Durmstrang',
    data.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
    data.office || 'Komnaty Najwyższej Wieży Durmstrang',
    new Date().toISOString().split('T')[0]
  );

  // Audit log
  const adminName = req.user.fullName || 'Rada Dyrekcji';
  db.prepare(`
    INSERT INTO audit_logs (id, timestamp, admin, action, detail)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    `log-${Date.now()}`,
    new Date().toISOString(),
    adminName,
    `Mianowano członka Dyrekcji: ${(data.name || '').trim()} ${(data.surname || '').trim()}`,
    `Nadano uprawnienia Arcymistrzowskie dla @${trimmedUsername}`
  );

  const created = dbUserToFrontend(db.prepare('SELECT * FROM users WHERE id = ?').get(newId));
  res.status(201).json({ user: created });
});

// GET /api/admin/audit-logs
router.get('/audit-logs', (req, res) => {
  const rows = db.prepare('SELECT * FROM audit_logs ORDER BY rowid DESC LIMIT 200').all();
  res.json(rows);
});

// POST /api/admin/audit-logs — add manual audit log entry (admin)
router.post('/audit-logs', (req, res) => {
  const { action, detail } = req.body;
  if (!action) return res.status(400).json({ error: 'Pole action jest wymagane.' });

  const logId = `log-${Date.now()}`;
  const adminName = req.user.fullName || req.user.username || 'Dyrekcja';

  db.prepare(`
    INSERT INTO audit_logs (id, timestamp, admin, action, detail)
    VALUES (?, ?, ?, ?, ?)
  `).run(logId, new Date().toISOString(), adminName, action, detail || '');

  const row = db.prepare('SELECT * FROM audit_logs WHERE id = ?').get(logId);
  res.status(201).json(row);
});

// GET /api/admin/system-stats — Telemetry and counts for CMS
router.get('/system-stats', (req, res) => {
  try {
    const memory = process.memoryUsage();
    const uptimeSec = process.uptime();
    
    const countTable = (tableName) => {
      try {
        const row = db.prepare(`SELECT count(*) as total FROM ${tableName}`).get();
        return row ? row.total : 0;
      } catch {
        return 0;
      }
    };

    const stats = {
      serverTime: new Date().toISOString(),
      uptimeSeconds: Math.floor(uptimeSec),
      uptimeFormatted: `${Math.floor(uptimeSec / 3600)}h ${Math.floor((uptimeSec % 3600) / 60)}m ${Math.floor(uptimeSec % 60)}s`,
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        rssMB: (memory.rss / (1024 * 1024)).toFixed(2),
        heapUsedMB: (memory.heapUsed / (1024 * 1024)).toFixed(2),
        heapTotalMB: (memory.heapTotal / (1024 * 1024)).toFixed(2)
      },
      counts: {
        users: countTable('users'),
        lessons: countTable('lessons'),
        lessonMessages: countTable('lesson_messages'),
        pointTransactions: countTable('point_transactions'),
        news: countTable('news'),
        emails: countTable('emails'),
        subjects: countTable('subjects'),
        timetable: countTable('timetable_entries'),
        bankAccounts: countTable('bank_accounts'),
        bankTransactions: countTable('bank_transactions'),
        lotteryTickets: countTable('lottery_tickets'),
        documents: countTable('documents'),
        cmsBanners: countTable('cms_banners'),
        cmsBlocks: countTable('cms_block_graphics'),
        completedQuests: countTable('completed_quests'),
        secrets: countTable('discovered_secrets'),
        formulas: countTable('crafted_formulas'),
        homework: countTable('homework_submissions'),
        ravenMessages: countTable('raven_messages'),
        events: countTable('events'),
        auditLogs: countTable('audit_logs')
      },
      sqlite: {
        journalMode: 'WAL',
        dbEngine: 'better-sqlite3'
      }
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Nie udało się pobrać statystyk serwera: ' + err.message });
  }
});

// GET /api/admin/backup-export — Full JSON dump of all SQLite tables
router.get('/backup-export', (req, res) => {
  return res.status(410).json({
    error: 'Eksport JSON został wyłączony, ponieważ zawierał hashe haseł, dane osobowe i sekrety integracji. Użyj szyfrowanego backupu SQLite poza aplikacją.'
  });
  /* c8 ignore start -- kod legacy pozostawiony tymczasowo wyłącznie do migracji */
  try {
    const getAll = (tbl) => {
      try {
        return db.prepare(`SELECT * FROM ${tbl}`).all();
      } catch {
        return [];
      }
    };

    const backupData = {
      system: 'Cytadela Durmstrang — Pełna Kopia Zapasowa Archiwum',
      exportedAt: new Date().toISOString(),
      exportedBy: req.user.fullName,
      version: '2.0.0',
      database: {
        users: getAll('users'),
        news: getAll('news'),
        emails: getAll('emails'),
        events: getAll('events'),
        pending_applications: getAll('pending_applications'),
        audit_logs: getAll('audit_logs'),
        lessons: getAll('lessons'),
        lesson_messages: getAll('lesson_messages'),
        lesson_participants: getAll('lesson_participants'),
        point_transactions: getAll('point_transactions'),
        point_audit_logs: getAll('point_audit_logs'),
        subjects: getAll('subjects'),
        grade_categories: getAll('grade_categories'),
        grades: getAll('grades'),
        subject_achievements: getAll('subject_achievements'),
        timetable_entries: getAll('timetable_entries'),
        bank_accounts: getAll('bank_accounts'),
        bank_transactions: getAll('bank_transactions'),
        teacher_salaries: getAll('teacher_salaries'),
        store_items: getAll('store_items'),
        shopping_lists: getAll('shopping_lists'),
        user_shopping_lists: getAll('user_shopping_lists'),
        lottery_rounds: getAll('lottery_rounds'),
        lottery_tickets: getAll('lottery_tickets'),
        documents: getAll('documents'),
        cms_banners: getAll('cms_banners'),
        cms_block_graphics: getAll('cms_block_graphics'),
        completed_quests: getAll('completed_quests'),
        discovered_secrets: getAll('discovered_secrets'),
        crafted_formulas: getAll('crafted_formulas'),
        homework_submissions: getAll('homework_submissions'),
        raven_messages: getAll('raven_messages'),
        discord_bot_config: getAll('discord_bot_config'),
        school_config: getAll('school_config')
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="durmstrang-backup-${Date.now()}.json"`);
    res.json(backupData);
  } catch (err) {
    res.status(500).json({ error: 'Błąd generowania kopii zapasowej: ' + err.message });
  }
});

// POST /api/admin/backup-import — Restore entire SQLite database from JSON
router.post('/backup-import', (req, res) => {
  return res.status(410).json({
    error: 'Import JSON został wyłączony z powodu ryzyka częściowego i destrukcyjnego restore. Przywracaj zweryfikowany plik SQLite offline.'
  });
  /* c8 ignore start -- kod legacy pozostawiony tymczasowo wyłącznie do migracji */
  try {
    const { backup } = req.body;
    if (!backup || !backup.database) {
      return res.status(400).json({ error: 'Nieprawidłowa struktura pliku kopii zapasowej (brak sekcji database).' });
    }

    const d = backup.database;

    const restoreTable = (tableName, rows) => {
      if (!Array.isArray(rows) || rows.length === 0) return;
      try {
        db.prepare(`DELETE FROM ${tableName}`).run();
        const sample = rows[0];
        const cols = Object.keys(sample);
        const placeholders = cols.map(() => '?').join(', ');
        const insertStmt = db.prepare(`INSERT INTO ${tableName} (${cols.join(', ')}) VALUES (${placeholders})`);

        for (const row of rows) {
          const values = cols.map(c => row[c] !== undefined ? row[c] : null);
          insertStmt.run(...values);
        }
      } catch (tableErr) {
        console.warn(`[Restore] Ostrzeżenie przy przywracaniu tabeli ${tableName}:`, tableErr.message);
      }
    };

    const tx = db.transaction(() => {
      if (d.users) restoreTable('users', d.users);
      if (d.news) restoreTable('news', d.news);
      if (d.emails) restoreTable('emails', d.emails);
      if (d.events) restoreTable('events', d.events);
      if (d.pending_applications) restoreTable('pending_applications', d.pending_applications);
      if (d.audit_logs) restoreTable('audit_logs', d.audit_logs);
      if (d.lessons) restoreTable('lessons', d.lessons);
      if (d.lesson_messages) restoreTable('lesson_messages', d.lesson_messages);
      if (d.lesson_participants) restoreTable('lesson_participants', d.lesson_participants);
      if (d.point_transactions) restoreTable('point_transactions', d.point_transactions);
      if (d.point_audit_logs) restoreTable('point_audit_logs', d.point_audit_logs);
      if (d.subjects) restoreTable('subjects', d.subjects);
      if (d.grade_categories) restoreTable('grade_categories', d.grade_categories);
      if (d.grades) restoreTable('grades', d.grades);
      if (d.subject_achievements) restoreTable('subject_achievements', d.subject_achievements);
      if (d.timetable_entries) restoreTable('timetable_entries', d.timetable_entries);
      if (d.timetable) restoreTable('timetable_entries', d.timetable);
      if (d.bank_accounts) restoreTable('bank_accounts', d.bank_accounts);
      if (d.bank_transactions) restoreTable('bank_transactions', d.bank_transactions);
      if (d.teacher_salaries) restoreTable('teacher_salaries', d.teacher_salaries);
      if (d.store_items) restoreTable('store_items', d.store_items);
      if (d.shopping_lists) restoreTable('shopping_lists', d.shopping_lists);
      if (d.user_shopping_lists) restoreTable('user_shopping_lists', d.user_shopping_lists);
      if (d.lottery_rounds) restoreTable('lottery_rounds', d.lottery_rounds);
      if (d.lottery_tickets) restoreTable('lottery_tickets', d.lottery_tickets);
      if (d.lottery_user_tickets) restoreTable('lottery_tickets', d.lottery_user_tickets);
      if (d.documents) restoreTable('documents', d.documents);
      if (d.cms_banners) restoreTable('cms_banners', d.cms_banners);
      if (d.cms_block_graphics) restoreTable('cms_block_graphics', d.cms_block_graphics);
      if (d.completed_quests) restoreTable('completed_quests', d.completed_quests);
      if (d.discovered_secrets) restoreTable('discovered_secrets', d.discovered_secrets);
      if (d.crafted_formulas) restoreTable('crafted_formulas', d.crafted_formulas);
      if (d.homework_submissions) restoreTable('homework_submissions', d.homework_submissions);
      if (d.raven_messages) restoreTable('raven_messages', d.raven_messages);
      if (d.discord_bot_config) restoreTable('discord_bot_config', d.discord_bot_config);
      if (d.school_config) restoreTable('school_config', d.school_config);

      db.prepare(`
        INSERT INTO audit_logs (id, timestamp, admin, action, detail)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        `log-${Date.now()}`,
        new Date().toISOString(),
        req.user.fullName || 'Arcymistrz Dyrekcji',
        'Pełne Przywrócenie Bazy Danych z Kopii Zapasowej JSON',
        `Przywrócono bazę z pliku utworzonego: ${backup.exportedAt || 'nieznana data'}`
      );
    });

    tx();

    res.json({
      ok: true,
      message: 'Baza danych została pomyślnie i w 100% przywrócona z pliku kopii zapasowej!'
    });
  } catch (err) {
    res.status(500).json({ error: 'Błąd przywracania bazy danych: ' + err.message });
  }
});

// POST /api/admin/optimize-db — Vacuum & Optimize SQLite
router.post('/optimize-db', (req, res) => {
  try {
    db.pragma('optimize');
    db.exec('VACUUM');
    db.exec('ANALYZE');

    db.prepare(`
      INSERT INTO audit_logs (id, timestamp, admin, action, detail)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      `log-${Date.now()}`,
      new Date().toISOString(),
      req.user.fullName || 'Rada Dyrekcji (System)',
      'Optymalizacja Bazy Danych SQLite',
      'Wykonano PRAGMA optimize, VACUUM oraz ANALYZE.'
    );

    res.json({ ok: true, message: 'Baza danych została zoptymalizowana (VACUUM & ANALYZE).' });
  } catch (err) {
    res.status(500).json({ error: 'Błąd optymalizacji bazy danych: ' + err.message });
  }
});

// ==================== INTERAKTYWNY EKSPLORATOR & EDYTOR BAZY DANYCH ====================

// Helper: Get list of allowed user tables in SQLite
const getAllowedTables = () => {
  try {
    const rows = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
    return rows.map(r => r.name);
  } catch {
    return [];
  }
};

// GET /api/admin/db/tables — List of tables with row counts and columns
router.get('/db/tables', (req, res) => {
  try {
    const tableNames = getAllowedTables();
    const result = tableNames.map(name => {
      let count = 0;
      let columns = [];
      try {
        const countRow = db.prepare(`SELECT count(*) as total FROM "${name}"`).get();
        count = countRow ? countRow.total : 0;
        columns = db.prepare(`PRAGMA table_info("${name}")`).all();
      } catch (err) {
        console.warn(`[Admin DB] Błąd pobierania info o tabeli ${name}:`, err.message);
      }
      return {
        name,
        count,
        columns: columns.map(c => ({
          cid: c.cid,
          name: c.name,
          type: c.type,
          notnull: Boolean(c.notnull),
          dflt_value: c.dflt_value,
          pk: Boolean(c.pk)
        }))
      };
    });

    res.json({ ok: true, tables: result });
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania spisu tabel: ' + err.message });
  }
});

// GET /api/admin/db/table/:tableName — Fetch records with search, limit, offset
router.get('/db/table/:tableName', (req, res) => {
  try {
    const { tableName } = req.params;
    const allowed = getAllowedTables();
    if (!allowed.includes(tableName)) {
      return res.status(404).json({ error: `Tabela "${tableName}" nie istnieje w bazie danych.` });
    }

    const limit = Math.min(parseInt(req.query.limit || '100', 10), 500);
    const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);
    const search = (req.query.search || '').trim();

    const columns = db.prepare(`PRAGMA table_info("${tableName}")`).all();
    const countRow = db.prepare(`SELECT count(*) as total FROM "${tableName}"`).get();
    const totalCount = countRow ? countRow.total : 0;

    let rows = [];
    if (search && columns.length > 0) {
      // Build dynamic search query across text/char columns
      const textCols = columns.filter(c => ['TEXT', 'VARCHAR', 'CHAR', 'CLOB', ''].includes((c.type || '').toUpperCase()));
      if (textCols.length > 0) {
        const whereClauses = textCols.map(c => `CAST("${c.name}" AS TEXT) LIKE ?`).join(' OR ');
        const searchPattern = `%${search}%`;
        const searchParams = textCols.map(() => searchPattern);
        rows = db.prepare(`SELECT * FROM "${tableName}" WHERE ${whereClauses} LIMIT ? OFFSET ?`).all(...searchParams, limit, offset);
      } else {
        rows = db.prepare(`SELECT * FROM "${tableName}" LIMIT ? OFFSET ?`).all(limit, offset);
      }
    } else {
      rows = db.prepare(`SELECT * FROM "${tableName}" LIMIT ? OFFSET ?`).all(limit, offset);
    }

    res.json({
      ok: true,
      tableName,
      totalCount,
      limit,
      offset,
      columns,
      rows
    });
  } catch (err) {
    res.status(500).json({ error: 'Błąd odczytu tabeli: ' + err.message });
  }
});

// POST /api/admin/db/table/:tableName — disabled (use domain services instead)
router.post('/db/table/:tableName', (_req, res) => {
  res.status(410).json({ error: 'Bezpośrednie wstawianie rekordów przez DB Explorer jest wyłączone. Użyj właściwego API domeny.' });
});

// PUT /api/admin/db/table/:tableName/:id — disabled (use domain services instead)
router.put('/db/table/:tableName/:id', (_req, res) => {
  res.status(410).json({ error: 'Bezpośrednia edycja rekordów przez DB Explorer jest wyłączona. Użyj właściwego API domeny.' });
});

// DELETE /api/admin/db/table/:tableName/:id — disabled (use domain services instead)
router.delete('/db/table/:tableName/:id', (_req, res) => {
  res.status(410).json({ error: 'Bezpośrednie usuwanie rekordów przez DB Explorer jest wyłączone. Użyj właściwego API domeny.' });
});

// ==========================================
// DYREKCJA: Zarządzanie Punktami i Skirnirami
// ==========================================

// POST /api/admin/points/award — przyznaj punkty adeptowi
router.post('/points/award', (req, res) => {
  const { studentId, house, points, reason, source } = req.body;
  if (!house || !points || points <= 0) return res.status(400).json({ error: 'Wymagany Zakon i dodatnia liczba punktów.' });
  if (!reason) return res.status(400).json({ error: 'Powód jest obowiązkowy przy ręcznym przyznawaniu punktów.' });

  try {
    const userRow = studentId ? db.prepare('SELECT full_name FROM users WHERE id = ?').get(studentId) : null;
    const txId = awardPoints({
      studentId: studentId || null,
      studentName: userRow?.full_name || '',
      house,
      points: parseInt(points, 10),
      source: source || `Dyrekcja: ${reason}`,
      sourceType: 'ADMIN_AWARD',
      actorId: req.user.id,
      actorName: req.user.fullName || 'Dyrekcja',
      comment: reason,
      idempotencyKey: `admin-award-${req.user.id}-${Date.now()}`
    });

    db.prepare("INSERT INTO audit_logs (id, timestamp, admin, action, detail) VALUES (?, ?, ?, ?, ?)").run(
      `log-${Date.now()}`, new Date().toISOString(), req.user.fullName || 'Dyrekcja',
      'Przyznanie punktów (admin)', `${studentId || house}: +${points} pkt. Powód: ${reason}`
    );

    res.json({ success: true, txId, message: `Przyznano +${points} punktów.` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/admin/points/deduct — odejmij punkty adeptowi
router.post('/points/deduct', (req, res) => {
  const { studentId, house, points, reason, source } = req.body;
  if (!house || !points || points <= 0) return res.status(400).json({ error: 'Wymagany Zakon i dodatnia liczba punktów do odjęcia.' });
  if (!reason) return res.status(400).json({ error: 'Powód jest obowiązkowy przy odjęciu punktów.' });

  try {
    const userRow = studentId ? db.prepare('SELECT full_name FROM users WHERE id = ?').get(studentId) : null;
    const txId = deductPoints({
      studentId: studentId || null,
      studentName: userRow?.full_name || '',
      house,
      points: parseInt(points, 10),
      source: source || `Dyrekcja: ${reason}`,
      sourceType: 'ADMIN_DEDUCTION',
      actorId: req.user.id,
      actorName: req.user.fullName || 'Dyrekcja',
      comment: reason,
      idempotencyKey: `admin-deduct-${req.user.id}-${Date.now()}`
    });

    db.prepare("INSERT INTO audit_logs (id, timestamp, admin, action, detail) VALUES (?, ?, ?, ?, ?)").run(
      `log-${Date.now()}`, new Date().toISOString(), req.user.fullName || 'Dyrekcja',
      'Odjęcie punktów (admin)', `${studentId || house}: -${points} pkt. Powód: ${reason}`
    );

    res.json({ success: true, txId, message: `Odjęto -${points} punktów.` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/admin/points/award-house — przyznaj punkty zakonowi (bez adepata)
router.post('/points/award-house', (req, res) => {
  const { house, points, reason, source } = req.body;
  if (!house || !points || points <= 0) return res.status(400).json({ error: 'Wymagany Zakon i dodatnia liczba punktów.' });
  if (!reason) return res.status(400).json({ error: 'Powód jest obowiązkowy.' });

  try {
    const txId = awardHousePoints({
      house,
      points: parseInt(points, 10),
      source: source || `Dyrekcja: ${reason}`,
      sourceType: 'ADMIN_HOUSE_AWARD',
      actorId: req.user.id,
      actorName: req.user.fullName || 'Dyrekcja',
      comment: reason,
      idempotencyKey: `admin-house-award-${house}-${req.user.id}-${Date.now()}`
    });

    db.prepare("INSERT INTO audit_logs (id, timestamp, admin, action, detail) VALUES (?, ?, ?, ?, ?)").run(
      `log-${Date.now()}`, new Date().toISOString(), req.user.fullName || 'Dyrekcja',
      'Przyznanie punktów zakonowi (admin)', `${house}: +${points} pkt. Powód: ${reason}`
    );

    res.json({ success: true, txId, message: `Przyznano +${points} punktów dla ${house}.` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/admin/points/deduct-house — odejmij punkty zakonowi
router.post('/points/deduct-house', (req, res) => {
  const { house, points, reason, source } = req.body;
  if (!house || !points || points <= 0) return res.status(400).json({ error: 'Wymagany Zakon i dodatnia liczba punktów do odjęcia.' });
  if (!reason) return res.status(400).json({ error: 'Powód jest obowiązkowy.' });

  try {
    const txId = deductHousePoints({
      house,
      points: parseInt(points, 10),
      source: source || `Dyrekcja: ${reason}`,
      sourceType: 'ADMIN_HOUSE_DEDUCTION',
      actorId: req.user.id,
      actorName: req.user.fullName || 'Dyrekcja',
      comment: reason,
      idempotencyKey: `admin-house-deduct-${house}-${req.user.id}-${Date.now()}`
    });

    db.prepare("INSERT INTO audit_logs (id, timestamp, admin, action, detail) VALUES (?, ?, ?, ?, ?)").run(
      `log-${Date.now()}`, new Date().toISOString(), req.user.fullName || 'Dyrekcja',
      'Odjęcie punktów zakonowi (admin)', `${house}: -${points} pkt. Powód: ${reason}`
    );

    res.json({ success: true, txId, message: `Odjęto -${points} punktów od ${house}.` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/admin/points/reverse — wycofaj transakcję punktową
router.post('/points/reverse', (req, res) => {
  const { transactionId, reason } = req.body;
  if (!transactionId) return res.status(400).json({ error: 'Wymagane ID transakcji.' });
  if (!reason) return res.status(400).json({ error: 'Powód wycofania jest obowiązkowy.' });

  try {
    reverseTransaction(transactionId, req.user.id, req.user.fullName || 'Dyrekcja', reason);

    db.prepare("INSERT INTO audit_logs (id, timestamp, admin, action, detail) VALUES (?, ?, ?, ?, ?)").run(
      `log-${Date.now()}`, new Date().toISOString(), req.user.fullName || 'Dyrekcja',
      'Wycofanie transakcji punktowej', `TX: ${transactionId}. Powód: ${reason}`
    );

    res.json({ success: true, message: 'Transakcja wycofana.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/admin/skirniry/credit — dodaj Skirniry użytkownikowi
router.post('/skirniry/credit', (req, res) => {
  const { userId, amount, reason, category, title } = req.body;
  if (!userId || !amount || amount <= 0) return res.status(400).json({ error: 'Wymagane ID użytkownika i dodatnia kwota.' });
  if (!reason) return res.status(400).json({ error: 'Powód jest obowiązkowy przy ręcznym dodaniu Skirnirów.' });

  try {
    const userRow = db.prepare('SELECT full_name FROM users WHERE id = ?').get(userId);
    if (!userRow) return res.status(404).json({ error: 'Użytkownik nie istnieje.' });

    const result = creditSkirnir({
      userId,
      userName: userRow.full_name,
      amount: parseInt(amount, 10),
      category: category || 'admin',
      title: title || `Dyrekcja: ${reason}`,
      note: reason,
      sourceType: 'ADMIN_CREDIT',
      actorId: req.user.id,
      actorName: req.user.fullName || 'Dyrekcja',
      idempotencyKey: `admin-credit-${userId}-${req.user.id}-${Date.now()}`
    });

    db.prepare("INSERT INTO audit_logs (id, timestamp, admin, action, detail) VALUES (?, ?, ?, ?, ?)").run(
      `log-${Date.now()}`, new Date().toISOString(), req.user.fullName || 'Dyrekcja',
      'Dodanie Skirnirów (admin)', `${userId}: +${amount} ᛋ. Powód: ${reason}`
    );

    const updated = db.prepare('SELECT currency FROM users WHERE id = ?').get(userId);
    res.json({ success: true, txId: result.txId, newBalance: updated.currency, message: `Dodano +${amount} Skirnirów.` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/admin/skirniry/debit — odejmij Skirniry użytkownikowi
router.post('/skirniry/debit', (req, res) => {
  const { userId, amount, reason, category, title } = req.body;
  if (!userId || !amount || amount <= 0) return res.status(400).json({ error: 'Wymagane ID użytkownika i dodatnia kwota.' });
  if (!reason) return res.status(400).json({ error: 'Powód jest obowiązkowy przy odjęciu Skirnirów.' });

  try {
    const userRow = db.prepare('SELECT full_name FROM users WHERE id = ?').get(userId);
    if (!userRow) return res.status(404).json({ error: 'Użytkownik nie istnieje.' });

    const result = debitSkirnir({
      userId,
      userName: userRow.full_name,
      amount: parseInt(amount, 10),
      category: category || 'admin',
      title: title || `Dyrekcja: ${reason}`,
      note: reason,
      sourceType: 'ADMIN_DEBIT',
      actorId: req.user.id,
      actorName: req.user.fullName || 'Dyrekcja',
      idempotencyKey: `admin-debit-${userId}-${req.user.id}-${Date.now()}`
    });

    db.prepare("INSERT INTO audit_logs (id, timestamp, admin, action, detail) VALUES (?, ?, ?, ?, ?)").run(
      `log-${Date.now()}`, new Date().toISOString(), req.user.fullName || 'Dyrekcja',
      'Odjęcie Skirnirów (admin)', `${userId}: -${amount} ᛋ. Powód: ${reason}`
    );

    const updated = db.prepare('SELECT currency FROM users WHERE id = ?').get(userId);
    res.json({ success: true, txId: result.txId, newBalance: updated.currency, message: `Odjęto -${amount} Skirnirów.` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/admin/skirniry/reverse — wycofaj transakcję bankową
router.post('/skirniry/reverse', (req, res) => {
  const { transactionId, reason } = req.body;
  if (!transactionId) return res.status(400).json({ error: 'Wymagane ID transakcji.' });
  if (!reason) return res.status(400).json({ error: 'Powód wycofania jest obowiązkowy.' });

  try {
    const reverseTxId = reverseSkirnir(transactionId, req.user.id, req.user.fullName || 'Dyrekcja', reason);

    db.prepare("INSERT INTO audit_logs (id, timestamp, admin, action, detail) VALUES (?, ?, ?, ?, ?)").run(
      `log-${Date.now()}`, new Date().toISOString(), req.user.fullName || 'Dyrekcja',
      'Wycofanie transakcji bankowej', `TX: ${transactionId}. Powód: ${reason}`
    );

    res.json({ success: true, reverseTxId, message: 'Transakcja bankowa wycofana.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/admin/transactions/points — globalna historia transakcji punktowych
router.get('/transactions/points', (req, res) => {
  const { house, studentId, sourceType, schoolYear, limit = 100, offset = 0 } = req.query;

  let query = 'SELECT * FROM point_transactions WHERE 1=1';
  const params = [];

  if (house) { query += ' AND house = ?'; params.push(house.toLowerCase()); }
  if (studentId) { query += ' AND student_id = ?'; params.push(studentId); }
  if (sourceType) { query += ' AND source_type = ?'; params.push(sourceType); }
  if (schoolYear) { query += ' AND school_year = ?'; params.push(schoolYear); }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit, 10), parseInt(offset, 10));

  const rows = db.prepare(query).all(...params);
  const total = db.prepare(query.replace(/SELECT \* /, 'SELECT COUNT(*) as cnt ').replace(/ ORDER BY.*$/, '')).get(...params.slice(0, -2))?.cnt || 0;

  res.json({ transactions: rows.map(dbPointTxToFrontend), total });
});

// GET /api/admin/transactions/skirniry — globalna historia transakcji bankowych
router.get('/transactions/skirniry', (req, res) => {
  const { userId, category, sourceType, schoolYear, limit = 100, offset = 0 } = req.query;

  let query = 'SELECT * FROM bank_transactions WHERE 1=1';
  const params = [];

  if (userId) { query += ' AND (sender_id = ? OR recipient_id = ?)'; params.push(userId, userId); }
  if (category) { query += ' AND category = ?'; params.push(category); }
  if (sourceType) { query += ' AND source_type = ?'; params.push(sourceType); }
  if (schoolYear) { query += ' AND school_year = ?'; params.push(schoolYear); }

  query += ' ORDER BY date DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit, 10), parseInt(offset, 10));

  const rows = db.prepare(query).all(...params);
  res.json({ transactions: rows.map(dbBankTransactionToFrontend) });
});

// POST /api/admin/recalculate/points — przelicz punkty z ledgera
router.post('/recalculate/points', (req, res) => {
  const { userId } = req.body;
  try {
    if (userId) {
      const total = recalculateUserPoints(userId);
      res.json({ success: true, userId, newTotal: total, message: `Przeliczono punkty: ${total}.` });
    } else {
      const count = recalculateAllUserPoints();
      backfillSchoolYear();
      res.json({ success: true, usersUpdated: count, message: `Przeliczono punkty dla ${count} użytkowników.` });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/recalculate/skirniry — przelicz salda Skirnirów z ledgera
router.post('/recalculate/skirniry', (req, res) => {
  const { userId } = req.body;
  try {
    if (userId) {
      const balance = recalculateBalance(userId);
      res.json({ success: true, userId, newBalance: balance, message: `Przeliczono saldo: ${balance} ᛋ.` });
    } else {
      const count = recalculateAllBalances();
      res.json({ success: true, usersUpdated: count, message: `Przeliczono salda dla ${count} użytkowników.` });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/legacy-import — import sald legacy jako transakcje LEGACY_BALANCE_IMPORT
router.post('/legacy-import', (req, res) => {
  try {
    const users = db.prepare('SELECT id, full_name, house, points, currency FROM users').all();
    let pointImports = 0;
    let skirnirImports = 0;

    db.transaction(() => {
      for (const u of users) {
        if (u.points > 0 && u.house) {
          const existing = db.prepare("SELECT id FROM point_transactions WHERE idempotency_key = ?").get(`legacy-pts-${u.id}`);
          if (!existing) {
            awardPoints({
              studentId: u.id,
              studentName: u.full_name,
              house: u.house,
              points: u.points,
              source: 'Import salda z poprzedniego systemu',
              sourceType: 'LEGACY_BALANCE_IMPORT',
              actorId: req.user.id,
              actorName: req.user.fullName || 'Dyrekcja',
              comment: 'Jednorazowy import z poprzedniego systemu punktowego',
              idempotencyKey: `legacy-pts-${u.id}`
            });
            pointImports++;
          }
        }
        if (u.currency > 0) {
          const existing = db.prepare("SELECT id FROM bank_transactions WHERE idempotency_key = ?").get(`legacy-skr-${u.id}`);
          if (!existing) {
            creditSkirnir({
              userId: u.id,
              userName: u.full_name,
              amount: u.currency,
              category: 'legacy',
              title: 'Import salda z poprzedniego systemu',
              note: 'Jednorazowy import z poprzedniego systemu walutowego',
              sourceType: 'LEGACY_BALANCE_IMPORT',
              actorId: req.user.id,
              actorName: req.user.fullName || 'Dyrekcja',
              idempotencyKey: `legacy-skr-${u.id}`
            });
            skirnirImports++;
          }
        }
      }
    })();

    db.prepare("INSERT INTO audit_logs (id, timestamp, admin, action, detail) VALUES (?, ?, ?, ?, ?)").run(
      `log-${Date.now()}`, new Date().toISOString(), req.user.fullName || 'Dyrekcja',
      'Import sald legacy', `Punkty: ${pointImports}, Skirniry: ${skirnirImports}`
    );

    res.json({ success: true, pointImports, skirnirImports, message: `Zaimportowano ${pointImports} sald punktowych i ${skirnirImports} sald Skirnirów.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
