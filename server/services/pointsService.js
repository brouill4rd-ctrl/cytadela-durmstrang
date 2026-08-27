import { randomUUID } from 'crypto';

let _db;

export function initPointsService(db) {
  _db = db;

  // Migration: add school_year and actor_id columns if missing
  const cols = db.pragma('table_info(point_transactions)');
  const colNames = cols.map(c => c.name);

  if (!colNames.includes('school_year')) {
    db.exec("ALTER TABLE point_transactions ADD COLUMN school_year TEXT DEFAULT ''");
  }
  if (!colNames.includes('actor_id')) {
    db.exec("ALTER TABLE point_transactions ADD COLUMN actor_id TEXT DEFAULT ''");
  }
  if (!colNames.includes('actor_name')) {
    db.exec("ALTER TABLE point_transactions ADD COLUMN actor_name TEXT DEFAULT ''");
  }
  if (!colNames.includes('idempotency_key')) {
    db.exec("ALTER TABLE point_transactions ADD COLUMN idempotency_key TEXT DEFAULT ''");
  }
  if (!colNames.includes('source_type')) {
    db.exec("ALTER TABLE point_transactions ADD COLUMN source_type TEXT DEFAULT 'LEGACY'");
  }
  if (!colNames.includes('source_id')) {
    db.exec("ALTER TABLE point_transactions ADD COLUMN source_id TEXT DEFAULT ''");
  }

  // Create index on idempotency_key for fast dedup
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_pt_idempotency ON point_transactions(idempotency_key) WHERE idempotency_key != ''");
  // Index for school_year queries
  db.exec("CREATE INDEX IF NOT EXISTS idx_pt_school_year ON point_transactions(school_year, is_revoked)");
  // Index for house aggregation
  db.exec("CREATE INDEX IF NOT EXISTS idx_pt_house_active ON point_transactions(house, is_revoked)");
}

function getSchoolYear() {
  return _db.prepare("SELECT value FROM school_config WHERE key='school_year'").get()?.value || 'XIX Rok Szkolny (2026/2027)';
}

function getTermStart() {
  return _db.prepare("SELECT value FROM school_config WHERE key='term_start'").get()?.value || '2026-08-01';
}

/**
 * Award points to a student (and by extension their house).
 * This is the SINGLE entry point for all point awards.
 */
export function awardPoints({
  studentId = null,
  studentName,
  house,
  points,
  source,
  sourceType = 'MANUAL',
  sourceId = '',
  lessonId = null,
  actorId = '',
  actorName = '',
  comment = '',
  idempotencyKey = ''
}) {
  if (!house || !points || points <= 0) {
    throw new Error('Wymagany Zakon i dodatnia liczba punktów.');
  }

  // Idempotency check
  if (idempotencyKey) {
    const existing = _db.prepare("SELECT id FROM point_transactions WHERE idempotency_key = ?").get(idempotencyKey);
    if (existing) return existing.id;
  }

  const txId = `pt-${Date.now()}-${randomUUID().slice(0, 6)}`;
  const schoolYear = getSchoolYear();

  return _db.transaction(() => {
    _db.prepare(`
      INSERT INTO point_transactions (
        id, student_id, student_name, house, points, source, source_type, source_id,
        lesson_id, professor_id, professor_name, actor_id, actor_name,
        date, comment, is_revoked, school_year, idempotency_key, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, date('now'), ?, 0, ?, ?, datetime('now'))
    `).run(
      txId,
      studentId || null,
      studentName || 'Adept',
      house.toLowerCase(),
      points,
      source || 'Ręczne przyznanie',
      sourceType,
      sourceId,
      lessonId || null,
      actorId || 'system',
      actorName || 'System Cytadeli',
      actorId || 'system',
      actorName || 'System Cytadeli',
      comment || '',
      schoolYear,
      idempotencyKey || ''
    );

    // Update cached points on user (cache, not source of truth)
    if (studentId) {
      _db.prepare('UPDATE users SET points = points + ?, xp = xp + ? WHERE id = ?').run(points, points * 10, studentId);
    }

    return txId;
  })();
}

/**
 * Deduct points from a student/house.
 * Creates a negative transaction (points field is negative).
 */
export function deductPoints({
  studentId = null,
  studentName,
  house,
  points,
  source,
  sourceType = 'PENALTY',
  sourceId = '',
  actorId,
  actorName,
  comment = '',
  idempotencyKey = ''
}) {
  if (!house || !points || points <= 0) {
    throw new Error('Wymagany Zakon i dodatnia liczba punktów do odjęcia.');
  }

  if (idempotencyKey) {
    const existing = _db.prepare("SELECT id FROM point_transactions WHERE idempotency_key = ?").get(idempotencyKey);
    if (existing) return existing.id;
  }

  const txId = `pt-ded-${Date.now()}-${randomUUID().slice(0, 6)}`;
  const schoolYear = getSchoolYear();

  return _db.transaction(() => {
    _db.prepare(`
      INSERT INTO point_transactions (
        id, student_id, student_name, house, points, source, source_type, source_id,
        lesson_id, professor_id, professor_name, actor_id, actor_name,
        date, comment, is_revoked, school_year, idempotency_key, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, date('now'), ?, 0, ?, ?, datetime('now'))
    `).run(
      txId,
      studentId || null,
      studentName || '',
      house.toLowerCase(),
      -Math.abs(points),
      source || 'Kara / Korekta',
      sourceType,
      sourceId,
      actorId || 'system',
      actorName || 'System Cytadeli',
      actorId || 'system',
      actorName || 'System Cytadeli',
      comment || '',
      schoolYear,
      idempotencyKey || ''
    );

    if (studentId) {
      _db.prepare('UPDATE users SET points = MAX(0, points - ?) WHERE id = ?').run(Math.abs(points), studentId);
    }

    return txId;
  })();
}

/**
 * Award points directly to a house (no student).
 */
export function awardHousePoints({
  house,
  points,
  source,
  sourceType = 'EVENT',
  sourceId = '',
  actorId,
  actorName,
  comment = '',
  idempotencyKey = ''
}) {
  return awardPoints({
    studentId: null,
    studentName: '',
    house,
    points,
    source,
    sourceType,
    sourceId,
    actorId,
    actorName,
    comment,
    idempotencyKey
  });
}

/**
 * Deduct points directly from a house (no student).
 */
export function deductHousePoints({
  house,
  points,
  source,
  sourceType = 'ADMIN_CORRECTION',
  sourceId = '',
  actorId,
  actorName,
  comment = '',
  idempotencyKey = ''
}) {
  return deductPoints({
    studentId: null,
    studentName: '',
    house,
    points,
    source,
    sourceType,
    sourceId,
    actorId,
    actorName,
    comment,
    idempotencyKey
  });
}

/**
 * Reverse (revoke) an existing transaction — does not delete, marks is_revoked=1.
 */
export function reverseTransaction(transactionId, actorId, actorName, reason) {
  const tx = _db.prepare('SELECT * FROM point_transactions WHERE id = ?').get(transactionId);
  if (!tx) throw new Error('Transakcja punktowa nie istnieje.');
  if (tx.is_revoked) throw new Error('Ta transakcja została już wycofana.');

  return _db.transaction(() => {
    _db.prepare("UPDATE point_transactions SET is_revoked = 1, comment = comment || ? WHERE id = ?").run(
      ` [WYCOFANO: ${reason}]`, transactionId
    );

    // Insert audit log
    _db.prepare(`
      INSERT INTO point_audit_logs (id, point_transaction_id, previous_points, new_points, modified_by, reason, lesson_id, timestamp)
      VALUES (?, ?, ?, 0, ?, ?, ?, datetime('now'))
    `).run(
      `audit-rev-${Date.now()}`, transactionId, tx.points, actorName || actorId, reason, tx.lesson_id
    );

    // Adjust cached user points
    if (tx.student_id && tx.points > 0) {
      _db.prepare('UPDATE users SET points = MAX(0, points - ?) WHERE id = ?').run(tx.points, tx.student_id);
    } else if (tx.student_id && tx.points < 0) {
      _db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(Math.abs(tx.points), tx.student_id);
    }

    return transactionId;
  })();
}

/**
 * Correct the value of an existing transaction.
 */
export function correctTransaction(transactionId, newPoints, actorId, actorName, reason) {
  const tx = _db.prepare('SELECT * FROM point_transactions WHERE id = ?').get(transactionId);
  if (!tx) throw new Error('Transakcja punktowa nie istnieje.');

  const prevPoints = tx.points;
  const diff = parseInt(newPoints, 10) - prevPoints;

  return _db.transaction(() => {
    _db.prepare('UPDATE point_transactions SET points = ?, comment = comment || ? WHERE id = ?').run(
      parseInt(newPoints, 10), ` [Korekta: ${reason}]`, transactionId
    );

    _db.prepare(`
      INSERT INTO point_audit_logs (id, point_transaction_id, previous_points, new_points, modified_by, reason, lesson_id, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      `audit-cor-${Date.now()}`, transactionId, prevPoints, parseInt(newPoints, 10),
      actorName || actorId, reason, tx.lesson_id
    );

    if (tx.student_id) {
      _db.prepare('UPDATE users SET points = MAX(0, points + ?) WHERE id = ?').run(diff, tx.student_id);
    }

    return { prevPoints, newPoints: parseInt(newPoints, 10), diff };
  })();
}

/**
 * Get total points for a user from the ledger.
 */
export function getUserPointsTotal(userId, schoolYear = null) {
  let query = 'SELECT COALESCE(SUM(points), 0) as total FROM point_transactions WHERE student_id = ? AND is_revoked = 0';
  const params = [userId];
  if (schoolYear) {
    query += ' AND school_year = ?';
    params.push(schoolYear);
  }
  return _db.prepare(query).get(...params).total;
}

/**
 * Get total points for a house from the ledger.
 */
export function getHousePointsTotal(house, schoolYear = null) {
  let query = 'SELECT COALESCE(SUM(points), 0) as total FROM point_transactions WHERE house = ? AND is_revoked = 0';
  const params = [house.toLowerCase()];
  if (schoolYear) {
    query += ' AND school_year = ?';
    params.push(schoolYear);
  }
  return _db.prepare(query).get(...params).total;
}

/**
 * Get point transaction history for a user.
 */
export function getUserPointHistory(userId, { limit = 100, schoolYear = null } = {}) {
  let query = 'SELECT * FROM point_transactions WHERE student_id = ? AND is_revoked = 0';
  const params = [userId];
  if (schoolYear) {
    query += ' AND school_year = ?';
    params.push(schoolYear);
  }
  query += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);
  return _db.prepare(query).all(...params);
}

/**
 * Get point transaction history for a house.
 */
export function getHousePointHistory(house, { limit = 100, schoolYear = null } = {}) {
  let query = 'SELECT * FROM point_transactions WHERE house = ? AND is_revoked = 0';
  const params = [house.toLowerCase()];
  if (schoolYear) {
    query += ' AND school_year = ?';
    params.push(schoolYear);
  }
  query += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);
  return _db.prepare(query).all(...params);
}

/**
 * Recalculate and sync user.points cache from ledger.
 */
export function recalculateUserPoints(userId) {
  const total = getUserPointsTotal(userId);
  _db.prepare('UPDATE users SET points = ? WHERE id = ?').run(Math.max(0, total), userId);
  return total;
}

/**
 * Recalculate all users' cached points from ledger.
 */
export function recalculateAllUserPoints() {
  const rows = _db.prepare(`
    SELECT student_id, COALESCE(SUM(points), 0) as total
    FROM point_transactions WHERE student_id IS NOT NULL AND is_revoked = 0
    GROUP BY student_id
  `).all();

  _db.transaction(() => {
    // Reset all to 0 first, then set from ledger
    _db.prepare("UPDATE users SET points = 0 WHERE role = 'student'").run();
    const update = _db.prepare('UPDATE users SET points = MAX(0, ?) WHERE id = ?');
    for (const r of rows) {
      update.run(r.total, r.student_id);
    }
  })();

  return rows.length;
}

/**
 * Delete all point_transactions for a lesson and recalculate affected users.
 * Used when a lesson is deleted or re-published.
 */
export function revokePointsForLesson(lessonId) {
  const txs = _db.prepare('SELECT DISTINCT student_id FROM point_transactions WHERE lesson_id = ? AND is_revoked = 0').all(lessonId);

  _db.transaction(() => {
    _db.prepare('DELETE FROM point_transactions WHERE lesson_id = ?').run(lessonId);
    // Recalculate affected users
    for (const { student_id } of txs) {
      if (student_id) {
        const total = _db.prepare('SELECT COALESCE(SUM(points), 0) as total FROM point_transactions WHERE student_id = ? AND is_revoked = 0').get(student_id).total;
        _db.prepare('UPDATE users SET points = MAX(0, ?) WHERE id = ?').run(total, student_id);
      }
    }
  })();
}

/**
 * Backfill school_year on old transactions that don't have it.
 */
export function backfillSchoolYear() {
  const schoolYear = getSchoolYear();
  const termStart = getTermStart();
  const result = _db.prepare("UPDATE point_transactions SET school_year = ? WHERE school_year = '' AND date >= ?").run(schoolYear, termStart);
  return result.changes;
}
