import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db, { dbUserToFrontend } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

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

  const newId = `usr-${Date.now()}`;
  const userEmail = (data.email || '').trim() || `${trimmedUsername}@durmstrang.edu`;

  db.prepare(`
    INSERT INTO users (id, username, password, email, name, surname, full_name, role, status, house, title, avatar, department, department_name, default_banner_category, office, specialization, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'admin', 'approved', NULL, ?, ?, 'edykty', 'Rada Dyrekcji Cytadeli', 'edykty', ?, 'Najwyższa Magia Północy, Starożytne Pieczęcie i Prawa Cytadeli', ?)
  `).run(
    newId, trimmedUsername, bcrypt.hashSync(data.password || '123', 10), userEmail,
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

// POST /api/admin/db/table/:tableName — Insert new row
router.post('/db/table/:tableName', (req, res) => {
  try {
    const { tableName } = req.params;
    const allowed = getAllowedTables();
    if (!allowed.includes(tableName)) {
      return res.status(404).json({ error: `Tabela "${tableName}" nie istnieje.` });
    }

    const data = req.body || {};
    const columns = db.prepare(`PRAGMA table_info("${tableName}")`).all();
    const colNames = columns.map(c => c.name);

    // If ID is missing and table has an id column, generate one
    if (colNames.includes('id') && !data.id) {
      data.id = `${tableName.slice(0, 4)}-${Date.now()}`;
    }

    // Filter to valid columns only
    const validCols = Object.keys(data).filter(k => colNames.includes(k));
    if (validCols.length === 0) {
      return res.status(400).json({ error: 'Brak poprawnych pól do wstawienia.' });
    }

    const placeholders = validCols.map(() => '?').join(', ');
    const values = validCols.map(k => typeof data[k] === 'object' && data[k] !== null ? JSON.stringify(data[k]) : data[k]);

    const stmt = db.prepare(`INSERT INTO "${tableName}" (${validCols.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders})`);
    stmt.run(...values);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, timestamp, admin, action, detail)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      `log-${Date.now()}`,
      new Date().toISOString(),
      req.user.fullName || 'Dyrekcja Cytadeli',
      `Wstawiono rekord do tabeli [${tableName}]`,
      `Klucz: ${data.id || 'nowy rekord'}`
    );

    res.status(201).json({ ok: true, message: `Dodano rekord do tabeli ${tableName}`, data });
  } catch (err) {
    res.status(500).json({ error: 'Błąd dodawania rekordu: ' + err.message });
  }
});

// PUT /api/admin/db/table/:tableName/:id — Update row
router.put('/db/table/:tableName/:id', (req, res) => {
  try {
    const { tableName, id } = req.params;
    const allowed = getAllowedTables();
    if (!allowed.includes(tableName)) {
      return res.status(404).json({ error: `Tabela "${tableName}" nie istnieje.` });
    }

    const data = req.body || {};
    const columns = db.prepare(`PRAGMA table_info("${tableName}")`).all();
    const pkCol = (columns.find(c => c.pk) || columns.find(c => c.name === 'id') || { name: 'id' }).name;
    const colNames = columns.map(c => c.name);

    const validCols = Object.keys(data).filter(k => colNames.includes(k) && k !== pkCol);
    if (validCols.length === 0) {
      return res.status(400).json({ error: 'Brak pól do zaktualizowania.' });
    }

    const setClauses = validCols.map(c => `"${c}" = ?`).join(', ');
    const values = validCols.map(k => typeof data[k] === 'object' && data[k] !== null ? JSON.stringify(data[k]) : data[k]);

    const stmt = db.prepare(`UPDATE "${tableName}" SET ${setClauses} WHERE "${pkCol}" = ?`);
    const info = stmt.run(...values, id);

    if (info.changes === 0) {
      return res.status(404).json({ error: `Nie znaleziono rekordu o identyfikatorze "${id}" w tabeli ${tableName}.` });
    }

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, timestamp, admin, action, detail)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      `log-${Date.now()}`,
      new Date().toISOString(),
      req.user.fullName || 'Dyrekcja Cytadeli',
      `Zaktualizowano rekord w tabeli [${tableName}]`,
      `ID: ${id} • Zmodyfikowane pola: ${validCols.join(', ')}`
    );

    res.json({ ok: true, message: `Zaktualizowano rekord w tabeli ${tableName}`, changes: info.changes });
  } catch (err) {
    res.status(500).json({ error: 'Błąd edycji rekordu: ' + err.message });
  }
});

// DELETE /api/admin/db/table/:tableName/:id — Delete row
router.delete('/db/table/:tableName/:id', (req, res) => {
  try {
    const { tableName, id } = req.params;
    const allowed = getAllowedTables();
    if (!allowed.includes(tableName)) {
      return res.status(404).json({ error: `Tabela "${tableName}" nie istnieje.` });
    }

    const columns = db.prepare(`PRAGMA table_info("${tableName}")`).all();
    const pkCol = (columns.find(c => c.pk) || columns.find(c => c.name === 'id') || { name: 'id' }).name;

    const stmt = db.prepare(`DELETE FROM "${tableName}" WHERE "${pkCol}" = ?`);
    const info = stmt.run(id);

    if (info.changes === 0) {
      return res.status(404).json({ error: `Nie znaleziono rekordu o ID "${id}" do usunięcia.` });
    }

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, timestamp, admin, action, detail)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      `log-${Date.now()}`,
      new Date().toISOString(),
      req.user.fullName || 'Dyrekcja Cytadeli',
      `Usunięto rekord z tabeli [${tableName}]`,
      `ID: ${id}`
    );

    res.json({ ok: true, message: `Pomyślnie usunięto rekord o ID "${id}" z tabeli ${tableName}.` });
  } catch (err) {
    res.status(500).json({ error: 'Błąd usuwania rekordu: ' + err.message });
  }
});

export default router;


