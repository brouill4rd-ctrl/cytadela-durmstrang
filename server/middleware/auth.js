import db from '../db.js';

/**
 * Middleware autoryzacji Cytadeli Durmstrang
 * 
 * Prostą autoryzacja oparta na nagłówku X-User-Id.
 * Pobiera użytkownika z bazy i wstrzykuje req.user.
 */

/**
 * requireAuth — wymaga zalogowanego użytkownika.
 * Sprawdza nagłówek X-User-Id, pobiera usera z DB i wstrzykuje req.user.
 * Zwraca 401 jeśli brak nagłówka lub user nie istnieje.
 */
export function requireAuth(req, res, next) {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'Brak autoryzacji. Zaloguj się do Cytadeli.' });
  }

  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!row) {
    return res.status(401).json({ error: 'Nieprawidłowa tożsamość. Użytkownik nie istnieje.' });
  }

  if (row.status !== 'approved') {
    return res.status(403).json({ error: 'Twoje konto nie zostało jeszcze zatwierdzone przez Radę Mistrzów.' });
  }

  req.user = {
    id: row.id,
    username: row.username,
    role: row.role,
    status: row.status,
    house: row.house,
    fullName: row.full_name,
    department: row.department,
    taughtSubjectIds: (() => {
      try { return JSON.parse(row.taught_subject_ids || '[]'); } catch { return []; }
    })()
  };

  next();
}

/**
 * requireRole(...roles) — wymaga konkretnej roli.
 * Musi być użyty PO requireAuth.
 * np. requireRole('admin') lub requireRole('admin', 'professor')
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Brak autoryzacji.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Brak uprawnień. Wymagana rola: ${roles.join(' lub ')}. Twoja rola: ${req.user.role}.`
      });
    }

    next();
  };
}

/**
 * requireSelf — wymaga że req.user.id === req.params.id
 * Używane do operacji na własnym profilu/koncie.
 */
export function requireSelf(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Brak autoryzacji.' });
  }

  if (req.user.id !== req.params.id) {
    return res.status(403).json({ error: 'Nie masz uprawnień do modyfikacji cudzego profilu.' });
  }

  next();
}

/**
 * requireSelfOrRole(...roles) — pozwala na operację na sobie LUB jeśli masz odpowiednią rolę.
 * np. requireSelfOrRole('admin') — user edytuje siebie, albo admin edytuje kogokolwiek.
 */
export function requireSelfOrRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Brak autoryzacji.' });
    }

    if (req.user.id === req.params.id || roles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({ error: 'Nie masz uprawnień do tej operacji.' });
  };
}

/**
 * requireSubjectOwnerOrAdmin — pozwala profesorowi edytować TYLKO swój przedmiot, admin może wszystko.
 * Sprawdza req.params.id (subjectId) vs req.user.taughtSubjectIds.
 */
export function requireSubjectOwnerOrAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Brak autoryzacji.' });
  }

  if (req.user.role === 'admin') {
    return next();
  }

  if (req.user.role === 'professor') {
    const subjectId = req.params.id;
    // Check if professor teaches this subject
    if (req.user.taughtSubjectIds.includes(subjectId)) {
      return next();
    }
    // Also check subject's professor_id in DB
    const subject = db.prepare('SELECT professor_id FROM subjects WHERE id = ?').get(subjectId);
    if (subject && subject.professor_id === req.user.id) {
      return next();
    }
    return res.status(403).json({ error: 'Możesz edytować tylko przedmioty, które prowadzisz.' });
  }

  return res.status(403).json({ error: 'Brak uprawnień. Wymagana rola: admin lub profesor.' });
}
