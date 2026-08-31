import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import db, { dbUserToFrontend, dbEmailToFrontend } from '../db.js';
import { EMAIL_TYPES, HOUSE_EMAIL_THEMES } from '../email/emailTemplates.js';
import { deliverTransactionalEmail, queueTransactionalEmail } from '../email/transactionalEmailService.js';
import { discordBot } from '../discordBot.js';
import { JWT_EXPIRY, JWT_SECRET } from '../config/security.js';
import { validatePassword } from '../utils/passwordPolicy.js';
import { getMailRuntimeConfig, getMailTransport } from '../email/mailTransport.js';

const router = Router();

function signToken(user) {
  return jwt.sign({
    id: user.id,
    role: user.role,
    username: user.username,
    sessionVersion: Number(user.session_version || 0)
  }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

function setSessionCookie(res, token) {
  res.cookie('durmstrang_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 2 * 60 * 60 * 1000
  });
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

  const token = signToken(row);
  setSessionCookie(res, token);
  res.json({ user });
});

router.post('/logout', (_req, res) => {
  res.clearCookie('durmstrang_session', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });
  res.json({ success: true });
});

router.post('/password-recovery/request', (req, res) => {
  const identifier = String(req.body?.identifier || '').trim().toLowerCase();
  const genericResponse = { message: 'Jeśli konto istnieje, instrukcja odnowienia hasła została wysłana na przypisany adres e-mail.' };
  if (!identifier) return res.status(202).json(genericResponse);

  const user = db.prepare('SELECT id, email, full_name FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?').get(identifier, identifier);
  if (!user || !user.email) return res.status(202).json(genericResponse);

  const token = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const id = `pwd-${randomUUID()}`;
  db.transaction(() => {
    db.prepare("UPDATE password_reset_tokens SET used_at = datetime('now') WHERE user_id = ? AND used_at IS NULL").run(user.id);
    db.prepare('INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)').run(id, user.id, tokenHash, expiresAt);
  })();

  setImmediate(async () => {
    try {
      const config = getMailRuntimeConfig();
      const transport = getMailTransport();
      await transport.sendMail({
        from: { name: config.fromName, address: config.fromAddress },
        replyTo: config.replyTo || undefined,
        to: { name: user.full_name, address: user.email },
        subject: 'Twierdza Magii Durmstrang — kod odnowienia hasła',
        text: `Kod odnowienia hasła: ${token}\n\nKod jest jednorazowy i wygasa po 30 minutach. Jeśli nie proszono o zmianę hasła, zignoruj tę wiadomość.`,
        html: `<p>Kod odnowienia hasła:</p><p style="font:700 18px monospace;word-break:break-all">${token}</p><p>Kod jest jednorazowy i wygasa po 30 minutach. Jeśli nie proszono o zmianę hasła, zignoruj tę wiadomość.</p>`
      });
    } catch (error) {
      console.warn('[Auth] Nie udało się wysłać wiadomości odzyskiwania hasła:', error.message);
    }
  });

  res.status(202).json(genericResponse);
});

router.post('/password-recovery/confirm', (req, res) => {
  const token = String(req.body?.token || '').trim();
  const passwordCheck = validatePassword(req.body?.newPassword);
  if (!token || !passwordCheck.valid) return res.status(400).json({ error: passwordCheck.error || 'Podaj kod odnowienia.' });
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const record = db.prepare("SELECT * FROM password_reset_tokens WHERE token_hash = ? AND used_at IS NULL AND expires_at > datetime('now')").get(tokenHash);
  if (!record) return res.status(400).json({ error: 'Kod jest nieprawidłowy, wykorzystany albo wygasł.' });
  const passwordHash = bcrypt.hashSync(req.body.newPassword, 12);
  db.transaction(() => {
    const claimed = db.prepare("UPDATE password_reset_tokens SET used_at = datetime('now') WHERE id = ? AND used_at IS NULL").run(record.id);
    if (claimed.changes !== 1) throw new Error('Kod został już wykorzystany.');
    db.prepare('UPDATE users SET password = ?, session_version = session_version + 1 WHERE id = ?').run(passwordHash, record.user_id);
    db.prepare("UPDATE password_reset_tokens SET used_at = datetime('now') WHERE user_id = ? AND used_at IS NULL").run(record.user_id);
  })();
  res.json({ success: true, message: 'Hasło zostało bezpiecznie zmienione.' });
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const data = req.body;
  const trimmedUsername = (data.username || '').trim().toLowerCase();

  if (!trimmedUsername) {
    return res.status(400).json({ error: 'Podaj unikalną nazwę użytkownika (login).' });
  }
  if (!(data.name || '').trim() || !(data.surname || '').trim()) {
    return res.status(400).json({ error: 'Imię i nazwisko są wymagane do wpisu w księdze Twierdzy.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE LOWER(username) = ?').get(trimmedUsername);
  if (existing) {
    return res.status(409).json({ error: 'Adept o takim loginie już figuruje w księdze Cytadeli.' });
  }

  const userEmail = (data.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
    return res.status(400).json({ error: 'Podaj poprawny adres e-mail, na który Rada ma przesłać korespondencję.' });
  }

  const existingEmail = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(userEmail);
  if (existingEmail) {
    return res.status(409).json({ error: 'Podany adres e-mail jest już przypisany do istniejącego konta w Cytadeli.' });
  }

  const role = data.role === 'professor' ? 'professor' : 'student';
  const selectedHouse = String(data.house || '').toLowerCase();
  if (role === 'student' && !HOUSE_EMAIL_THEMES[selectedHouse]) {
    return res.status(400).json({ error: 'Rytuał Przydziału nie wskazał prawidłowego Zakonu.' });
  }

  const passwordCheck = validatePassword(data.password);
  if (!passwordCheck.valid) {
    return res.status(400).json({ error: passwordCheck.error });
  }

  const rawPassword = data.password;
  const hashedPassword = bcrypt.hashSync(rawPassword, 12);

  const newId = `usr-${randomUUID()}`;
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
    // Wynik obowiązkowego rytuału rejestracyjnego jest utrwalany i ujawniany w liście przyjęcia.
    house: role === 'student' ? selectedHouse : null,
    title: role === 'professor'
      ? `Kandydat na Profesora • ${data.departmentName || 'Katedra Magii'}`
      : 'Kandydat na Adepta',
    avatar: data.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    department: data.department || (role === 'professor' ? 'czarna-magia' : null),
    department_name: data.departmentName || (role === 'professor' ? 'Katedra Czarnej Magii' : null),
    default_banner_category: data.department || null,
    office: data.office || (role === 'professor' ? 'Wieża Nocnych Szeptów' : null),
    specialization: data.specialization || (role === 'professor' ? 'Teoria i Praktyka Magii Starożytnej' : null),
    class_year: role === 'student' ? (data.classYear || 'Klasa I • Fundamenty Magii (Nowicjusz)') : null,
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
    taught_subject_ids: '[]',
    grades: '[]',
    inventory: role === 'student' ? JSON.stringify([{ id: 'item-init-1', name: 'Standardowa Opończa Nowicjusza', category: 'robes', rarity: 'common', icon: '🧥', price: 50 }]) : '[]',
    created_at: new Date().toISOString().split('T')[0]
  };

  const appId = `app-${randomUUID()}`;
  const now = new Date();

  const createRegistration = db.transaction(() => {
    db.prepare(`
      INSERT INTO users (id, username, password, email, name, surname, full_name, role, status, house, title, avatar, department, department_name, default_banner_category, office, specialization, class_year, origin, gender, level, xp, next_level_xp, points, currency, wand, patronus, companion, appearance, backstory, taught_subject_ids, grades, inventory, created_at)
      VALUES (@id, @username, @password, @email, @name, @surname, @full_name, @role, @status, @house, @title, @avatar, @department, @department_name, @default_banner_category, @office, @specialization, @class_year, @origin, @gender, @level, @xp, @next_level_xp, @points, @currency, @wand, @patronus, @companion, @appearance, @backstory, @taught_subject_ids, @grades, @inventory, @created_at)
    `).run(userFields);

    const prologueRoles = ['student', 'teacher', 'professor'];
    db.prepare(`
      INSERT INTO character_prologues (user_id, stage, completed)
      VALUES (?, ?, ?)
    `).run(newId, prologueRoles.includes(role) ? 'LETTER_PENDING' : 'COMPLETED', prologueRoles.includes(role) ? 0 : 1);

    db.prepare(`
      INSERT INTO pending_applications (id, user_id, email, name, surname, role, department_name, origin, age, wand, patronus, companion, appearance, backstory, status, date_submitted)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `).run(
      appId, newId, userEmail,
      userFields.name, userFields.surname, role,
      userFields.department_name,
      userFields.origin, data.age && role === 'student' ? `${data.age}` : (role === 'student' ? '11' : '35'),
      userFields.wand || 'Różdżka Adepta',
      userFields.patronus || 'Brak',
      userFields.companion || 'Brak',
      userFields.appearance || 'Kandydat w szacie podróżnej.',
      userFields.backstory || 'Podanie o przyjęcie.',
      userFields.created_at
    );

    // Professor: create subject enrollment applications for requested subjects
    if (role === 'professor') {
      const requestedSubjects = data.taughtSubjectIds || [data.department].filter(Boolean);
      for (const subjectId of requestedSubjects) {
        const subject = db.prepare('SELECT id, name FROM subjects WHERE id = ?').get(subjectId);
        if (subject) {
          db.prepare(`
            INSERT INTO professor_subject_applications
              (id, professor_id, professor_name, professor_avatar, subject_id, subject_name, class_year, note, status)
            VALUES (?, ?, ?, ?, ?, ?, 'Klasa I', ?, 'pending')
          `).run(
            `psa-${randomUUID()}`,
            newId,
            fullName,
            userFields.avatar,
            subject.id,
            subject.name,
            `Automatyczne zgłoszenie z rejestracji profesora`
          );
        }
      }
    }

    queueTransactionalEmail(db, userFields, EMAIL_TYPES.ACCOUNT_CREATED);

    db.prepare(`
      INSERT INTO audit_logs (id, timestamp, admin, action, detail)
      VALUES (?, ?, 'Kancelaria Rekrutacji', ?, ?)
    `).run(
      `log-${randomUUID()}`,
      now.toISOString(),
      `Złożono podanie (${role}): ${fullName}`,
      `Zakolejkowano potwierdzenie zgłoszenia na adres: ${userEmail}`
    );
  });

  try {
    createRegistration();
  } catch (error) {
    if (String(error?.message || '').includes('UNIQUE constraint failed: users.username')) {
      return res.status(409).json({ error: 'Adept o takim loginie już figuruje w księdze Cytadeli.' });
    }
    throw error;
  }

  const requestedSubjects = role === 'professor'
    ? db.prepare('SELECT subject_name FROM professor_subject_applications WHERE professor_id = ? ORDER BY subject_name').all(newId).map(row => row.subject_name)
    : [];

  const [deliveryResult] = await Promise.all([
    deliverTransactionalEmail({
      database: db,
      userId: newId,
      emailType: EMAIL_TYPES.ACCOUNT_CREATED
    }),
    discordBot.announceRecruitmentApplication({
      applicationId: appId,
      submittedAt: now.toISOString(),
      role,
      fullName,
      username: trimmedUsername,
      email: userEmail,
      age: data.age,
      origin: userFields.origin,
      house: userFields.house,
      classYear: userFields.class_year,
      departmentName: userFields.department_name,
      requestedSubjects,
      specialization: userFields.specialization,
      office: userFields.office
    })
  ]);

  const createdUser = dbUserToFrontend(db.prepare('SELECT * FROM users WHERE id = ?').get(newId));
  const confirmEmailRow = db.prepare('SELECT * FROM emails WHERE delivery_id = ?').get(deliveryResult.delivery?.id);
  const confirmEmail = dbEmailToFrontend(confirmEmailRow);

  res.status(201).json({ user: createdUser, email: confirmEmail, emailDelivery: deliveryResult.delivery });
});

export default router;
