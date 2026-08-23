import { Router } from 'express';
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
    newId, trimmedUsername, data.password || '123', userEmail,
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
    new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
    adminName,
    `Mianowano członka Dyrekcji: ${(data.name || '').trim()} ${(data.surname || '').trim()}`,
    `Nadano uprawnienia Arcymistrzowskie dla @${trimmedUsername}`
  );

  const created = dbUserToFrontend(db.prepare('SELECT * FROM users WHERE id = ?').get(newId));
  res.status(201).json({ user: created });
});

// GET /api/admin/audit-logs
router.get('/audit-logs', (req, res) => {
  const rows = db.prepare('SELECT * FROM audit_logs ORDER BY rowid DESC LIMIT 100').all();
  res.json(rows);
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
        timetable: countTable('timetable'),
        bankAccounts: countTable('bank_accounts'),
        bankTransactions: countTable('bank_transactions'),
        lotteryTickets: countTable('lottery_user_tickets'),
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
      version: '1.0.0',
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
        subject_grade_categories: getAll('subject_grade_categories'),
        student_grades: getAll('student_grades'),
        timetable: getAll('timetable'),
        bank_accounts: getAll('bank_accounts'),
        bank_transactions: getAll('bank_transactions'),
        store_items: getAll('store_items'),
        shopping_lists: getAll('shopping_lists'),
        lottery_rounds: getAll('lottery_rounds'),
        lottery_user_tickets: getAll('lottery_user_tickets'),
        discord_config: getAll('discord_config')
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="durmstrang-backup-${Date.now()}.json"`);
    res.json(backupData);
  } catch (err) {
    res.status(500).json({ error: 'Błąd generowania kopii zapasowej: ' + err.message });
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
      new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
      req.user.fullName || 'Rada Dyrekcji (System)',
      'Optymalizacja Bazy Danych SQLite',
      'Wykonano PRAGMA optimize, VACUUM oraz ANALYZE.'
    );

    res.json({ ok: true, message: 'Baza danych została zoptymalizowana (VACUUM & ANALYZE).' });
  } catch (err) {
    res.status(500).json({ error: 'Błąd optymalizacji bazy: ' + err.message });
  }
});

export default router;
