import jwt from 'jsonwebtoken';
import db from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'durmstrang-cytadela-tajny-klucz-1294';

export function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  let userId = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      userId = payload.id;
    } catch {
      return res.status(401).json({ error: 'Sesja wygasła lub token nieprawidłowy. Zaloguj się ponownie.' });
    }
  } else {
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

// Aliasy zgodności dla starszych modułów tras (np. Izba Pamięci).
export const authenticateToken = requireAuth;
export const requireAdmin = requireRole('admin');

export function requireSelf(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Brak autoryzacji.' });
  }
  if (req.user.id !== req.params.id) {
    return res.status(403).json({ error: 'Nie masz uprawnień do modyfikacji cudzego profilu.' });
  }
  next();
}

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

export function requireSubjectOwnerOrAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Brak autoryzacji.' });
  }
  if (req.user.role === 'admin') return next();
  if (req.user.role === 'professor') {
    const subjectId = req.params.id;
    if (req.user.taughtSubjectIds.includes(subjectId)) return next();
    const subject = db.prepare('SELECT professor_id FROM subjects WHERE id = ?').get(subjectId);
    if (subject && subject.professor_id === req.user.id) return next();
    return res.status(403).json({ error: 'Możesz edytować tylko przedmioty, które prowadzisz.' });
  }
  return res.status(403).json({ error: 'Brak uprawnień. Wymagana rola: admin lub profesor.' });
}
