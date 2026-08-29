import jwt from 'jsonwebtoken';
import db, { isProfessorOfSubject } from '../db.js';
import { JWT_SECRET } from '../config/security.js';

export function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  let userId = null;
  const cookies = Object.fromEntries(String(req.headers.cookie || '').split(';').map(part => {
    const index = part.indexOf('=');
    return index === -1 ? ['', ''] : [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1))];
  }).filter(([key]) => key));
  const cookieToken = cookies.durmstrang_session;

  if ((authHeader && authHeader.startsWith('Bearer ')) || cookieToken) {
    const token = cookieToken || authHeader.slice(7);
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

  const taughtFromAssignments = db.prepare(
    `SELECT subject_id FROM teacher_subject_assignments WHERE professor_id = ? AND status = 'active'`
  ).all(row.id).map(r => r.subject_id);

  req.user = {
    id: row.id,
    username: row.username,
    role: row.role,
    status: row.status,
    house: row.house,
    fullName: row.full_name,
    full_name: row.full_name,
    avatar: row.avatar || '',
    department: row.department,
    taughtSubjectIds: taughtFromAssignments
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
    const subjectId = req.params.id || req.params.subjectId || req.body?.subjectId;
    if (isProfessorOfSubject(req.user.id, subjectId)) return next();
    return res.status(403).json({ error: 'Możesz edytować tylko przedmioty, które prowadzisz.' });
  }
  return res.status(403).json({ error: 'Brak uprawnień. Wymagana rola: admin lub profesor.' });
}
