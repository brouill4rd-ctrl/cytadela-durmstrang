import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db, { dbUserToFrontend, dbEmailToFrontend } from '../db.js';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'durmstrang-cytadela-tajny-klucz-1294';
const JWT_EXPIRY = '7d';

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const trimmedUser = (username || '').trim().toLowerCase();

  const row = db.prepare('SELECT * FROM users WHERE LOWER(username) = ?').get(trimmedUser);

  if (!row || !bcrypt.compareSync(password, row.password)) {
    return res.status(401).json({ error: 'Nieprawidłowa nazwa adepta lub hasło do archiwum.' });
  }

  const user = dbUserToFrontend(row);

  if (user.status === 'pending') {
    return res.status(403).json({
      error: user.role === 'professor'
        ? 'Twoja nominacja profesorska oczekuje na podpisanie dekretu przez Dyrekcję Cytadeli.'
        : 'Twoje podanie o przyjęcie do Cytadeli oczekuje na zatwierdzenie przez Radę Mistrzów.',
      status: 'pending'
    });
  }

  if (user.status === 'rejected') {
    return res.status(403).json({ error: 'Twoje podanie rekrutacyjne zostało odrzucone przez Radę Mistrzów.', status: 'rejected' });
  }

  const token = signToken(user);
  res.json({ user, token });
});

// POST /api/auth/register
router.post('/register', (req, res) => {
  const data = req.body;
  const trimmedUsername = (data.username || '').trim().toLowerCase();

  if (!trimmedUsername) {
    return res.status(400).json({ error: 'Podaj unikalną nazwę użytkownika (login).' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE LOWER(username) = ?').get(trimmedUsername);
  if (existing) {
    return res.status(409).json({ error: 'Adept o takim loginie już figuruje w księdze Cytadeli.' });
  }

  const rawPassword = data.password || '123';
  const hashedPassword = bcrypt.hashSync(rawPassword, 10);

  const newId = `usr-${Date.now()}`;
  const userEmail = (data.email || '').trim() || `${trimmedUsername}@durmstrang.edu`;
  const role = data.role || 'student';
  const fullName = `${(data.name || '').trim()} ${(data.surname || '').trim()}`;

  const userFields = {
    id: newId,
    username: trimmedUsername,
    password: hashedPassword,
    email: userEmail,
    name: (data.name || '').trim(),
    surname: (data.surname || '').trim(),
    full_name: fullName,
    role,
    status: 'pending',
    // Przydział jest osobną ceremonią po przybyciu; prolog nie może ujawnić ani utrwalić Zakonu.
    house: role === 'professor' ? (data.house || 'ravnheim') : null,
    title: role === 'professor'
      ? `Kandydat na Profesora • ${data.departmentName || 'Katedra Magii'}`
      : 'Kandydat na Adepta',
    avatar: data.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    department: data.department || (role === 'professor' ? 'czarna-magia' : null),
    department_name: data.departmentName || (role === 'professor' ? 'Katedra Czarnej Magii' : null),
    default_banner_category: data.department || null,
    office: data.office || (role === 'professor' ? 'Wieża Nocnych Szeptów' : null),
    specialization: data.specialization || (role === 'professor' ? 'Teoria i Praktyka Magii Starożytnej' : null),
    class_year: data.classYear || (role === 'student' ? 'Klasa I • Fundamenty' : null),
    origin: data.origin || 'Skandynawia (Norwegia)',
    gender: data.gender || 'Kobieta',
    level: 1,
    xp: 0,
    next_level_xp: 500,
    points: role === 'student' ? 20 : 0,
    currency: role === 'student' ? 150 : 0,
    wand: data.wand || (role === 'student' ? 'Cis Arktyczny, Włókno Serca Smoka, 12 cali, Sztywna' : null),
    patronus: data.patronus || (role === 'student' ? 'Wilk Polarny' : null),
    companion: data.companion || (role === 'student' ? 'Puchacz Śnieżny' : null),
    appearance: data.appearance || (role === 'student' ? 'Młody adept w szacie podróżnej.' : null),
    backstory: data.backstory || (role === 'student' ? 'Przybysz z dalekich krain północy.' : role === 'professor' ? `Aplikacja na stanowisko profesora w Katedrze: ${data.departmentName}` : ''),
    taught_subject_ids: role === 'professor' ? JSON.stringify(data.taughtSubjectIds || [data.department || 'czarna-magia']) : '[]',
    grades: '[]',
    inventory: role === 'student' ? JSON.stringify([{ id: 'item-init-1', name: 'Standardowa Opończa Nowicjusza', category: 'robes', rarity: 'common', icon: '🧥', price: 50 }]) : '[]',
    created_at: new Date().toISOString().split('T')[0]
  };

  db.prepare(`
    INSERT INTO users (id, username, password, email, name, surname, full_name, role, status, house, title, avatar, department, department_name, default_banner_category, office, specialization, class_year, origin, gender, level, xp, next_level_xp, points, currency, wand, patronus, companion, appearance, backstory, taught_subject_ids, grades, inventory, created_at)
    VALUES (@id, @username, @password, @email, @name, @surname, @full_name, @role, @status, @house, @title, @avatar, @department, @department_name, @default_banner_category, @office, @specialization, @class_year, @origin, @gender, @level, @xp, @next_level_xp, @points, @currency, @wand, @patronus, @companion, @appearance, @backstory, @taught_subject_ids, @grades, @inventory, @created_at)
  `).run(userFields);

  db.prepare(`
    INSERT INTO character_prologues (user_id, stage, completed)
    VALUES (?, ?, ?)
  `).run(newId, role === 'student' ? 'LETTER_PENDING' : 'COMPLETED', role === 'student' ? 0 : 1);

  const appId = `app-${Date.now()}`;
  db.prepare(`
    INSERT INTO pending_applications (id, user_id, email, name, surname, role, department_name, origin, age, wand, patronus, companion, appearance, backstory, status, date_submitted)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
  `).run(
    appId, newId, userEmail,
    userFields.name, userFields.surname, role,
    userFields.department_name,
    userFields.origin, data.age ? `${data.age}` : '14',
    userFields.wand || 'Różdżka Adepta',
    userFields.patronus || 'Brak',
    userFields.companion || 'Brak',
    userFields.appearance || 'Kandydat w szacie podróżnej.',
    userFields.backstory || 'Podanie o przyjęcie.',
    userFields.created_at
  );

  const emailId = `mail-${Date.now()}`;
  const now = new Date();
  const dateStr = now.toLocaleDateString('pl-PL') + ' ' + now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });

  db.prepare(`
    INSERT INTO emails (id, to_email, to_name, from_addr, from_name, subject, date, read, type, body)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'registration_confirm', ?)
  `).run(
    emailId, userEmail, fullName,
    'kancelaria@durmstrang.edu', 'Kancelaria Cytadeli Durmstrang',
    `[DURMSTRANG] Potwierdzenie rejestracji podania (${role === 'professor' ? 'Katedra' : 'Adept'})`,
    dateStr,
    `Witaj ${fullName},\n\nKancelaria Cytadeli Durmstrang potwierdza pomyślne zarejestrowanie Twojego podania.\n\nPIECZĘĆ PODANIA: #${newId}\nADRES E-MAIL: ${userEmail}\nDATA ZGŁOSZENIA: ${now.toLocaleDateString('pl-PL')}\nSTATUS: Oczekuje na weryfikację przez Radę Dyrekcji.\n\nZ pieczęcią przymierza,\nKancelaria Rejestracji Paktu\nCytadela Durmstrang`
  );

  db.prepare(`
    INSERT INTO audit_logs (id, timestamp, admin, action, detail)
    VALUES (?, ?, 'Kancelaria Rekrutacji', ?, ?)
  `).run(
    `log-${Date.now()}`,
    now.toISOString(),
    `Złożono podanie (${role}): ${fullName}`,
    `Wysłano e-mail potwierdzający na adres: ${userEmail}`
  );

  const createdUser = dbUserToFrontend(db.prepare('SELECT * FROM users WHERE id = ?').get(newId));
  const confirmEmailRow = db.prepare('SELECT * FROM emails WHERE id = ?').get(emailId);
  const confirmEmail = dbEmailToFrontend(confirmEmailRow);

  res.status(201).json({ user: createdUser, email: confirmEmail });
});

export default router;
