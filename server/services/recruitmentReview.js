// Wspólna logika rozpatrywania podań rekrutacyjnych (akceptacja / odrzucenie).
// Używana zarówno przez trasę HTTP (routes/users.js), jak i przez przyciski bota Discord.
import { randomUUID } from 'node:crypto';
import db, { dbUserToFrontend } from '../db.js';
import { EMAIL_TYPES, HOUSE_EMAIL_THEMES } from '../email/emailTemplates.js';
import {
  deliverTransactionalEmail,
  queueTransactionalEmail
} from '../email/transactionalEmailService.js';

// Błąd walidacyjny z kodem, który wołający mapuje na status HTTP lub komunikat Discord.
export class RecruitmentReviewError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'RecruitmentReviewError';
    this.code = code;
  }
}

/**
 * Zatwierdza podanie rekrutacyjne wskazanego użytkownika.
 * @returns {Promise<{outcome:'approved'|'already_approved'|'already_processed', user:object, emailSent:boolean, emailDeliveryId:string|null}>}
 * @throws {RecruitmentReviewError} kody: not_found | not_pending | invalid_house
 */
export async function approveRecruitmentApplication({ userId, reviewerName, database = db } = {}) {
  const row = database.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!row) throw new RecruitmentReviewError('not_found', 'User not found');

  const user = dbUserToFrontend(row);

  if (user.status === 'approved') {
    return { outcome: 'already_approved', user, emailSent: false, emailDeliveryId: null };
  }
  if (user.status !== 'pending') {
    throw new RecruitmentReviewError('not_pending', `Konto nie oczekuje na akceptację (status: ${user.status}).`);
  }
  if (user.role === 'student' && !HOUSE_EMAIL_THEMES[String(user.house || '').toLowerCase()]) {
    throw new RecruitmentReviewError('invalid_house', 'Nie można zatwierdzić adepta bez prawidłowego Zakonu z Rytuału Przydziału.');
  }

  const newTitle = user.role === 'professor'
    ? `Profesor • ${user.departmentName}`
    : `Adept Zakonu ${HOUSE_EMAIL_THEMES[user.house].name}`;
  const now = new Date();
  const adminName = reviewerName || 'Rada Arcymistrzów';

  const approvePendingUser = database.transaction(() => {
    const update = database.prepare(
      "UPDATE users SET status = 'approved', title = ? WHERE id = ? AND status = 'pending'"
    ).run(newTitle, userId);
    if (update.changes !== 1) throw new RecruitmentReviewError('already_processed', 'Konto zostało już rozpatrzone przez inną operację.');

    if (user.role === 'student') {
      database.prepare("INSERT OR IGNORE INTO character_prologues (user_id, stage, completed, accepted_at) VALUES (?, 'LETTER_PENDING', 0, datetime('now'))").run(userId);
      database.prepare("UPDATE character_prologues SET accepted_at = COALESCE(accepted_at, datetime('now')), updated_at = datetime('now') WHERE user_id = ?").run(userId);
      queueTransactionalEmail(database, row, EMAIL_TYPES.ACCOUNT_APPROVED);
    }

    database.prepare("UPDATE pending_applications SET status = 'approved' WHERE user_id = ? AND status = 'pending'").run(userId);

    // Profesor: automatycznie zatwierdź oczekujące podania przedmiotowe i utwórz przydziały
    if (user.role === 'professor') {
      const pendingApps = database.prepare(
        `SELECT * FROM professor_subject_applications WHERE professor_id = ? AND status = 'pending'`
      ).all(userId);

      const schoolYear = database.prepare("SELECT value FROM school_config WHERE key = 'school_year'").get()?.value || 'XIX Rok Szkolny (2026/2027)';

      for (const app of pendingApps) {
        database.prepare(`
          UPDATE professor_subject_applications
          SET status = 'approved', reviewed_by = ?, reviewed_at = datetime('now'), updated_at = datetime('now')
          WHERE id = ?
        `).run(adminName, app.id);

        database.prepare(`
          INSERT OR IGNORE INTO teacher_subject_assignments (id, professor_id, subject_id, role, school_year, status, assigned_by)
          VALUES (?, ?, ?, 'primary', ?, 'active', ?)
        `).run(
          `tsa-${userId}-${app.subject_id}`,
          userId,
          app.subject_id,
          schoolYear,
          adminName
        );

        const subject = database.prepare('SELECT professor_id FROM subjects WHERE id = ?').get(app.subject_id);
        if (subject && !subject.professor_id) {
          database.prepare('UPDATE subjects SET professor_id = ?, professor_name = ? WHERE id = ?')
            .run(userId, user.fullName, app.subject_id);
        }
      }

      const assignedIds = database.prepare(
        `SELECT subject_id FROM teacher_subject_assignments WHERE professor_id = ? AND status = 'active'`
      ).all(userId).map(r => r.subject_id);
      database.prepare('UPDATE users SET taught_subject_ids = ? WHERE id = ?')
        .run(JSON.stringify(assignedIds), userId);
    }

    database.prepare(`
      INSERT INTO audit_logs (id, timestamp, admin, action, detail)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      `log-${randomUUID()}`,
      now.toISOString(),
      adminName,
      `Zatwierdzono podanie (${user.role}): ${user.fullName}`,
      user.role === 'student'
        ? `Zakolejkowano oficjalny list przyjęcia na adres: ${user.email}`
        : 'Zatwierdzono nominację profesorską; list przyjęcia adepta nie ma zastosowania.'
    );
  });

  try {
    approvePendingUser();
  } catch (error) {
    if (error instanceof RecruitmentReviewError && error.code === 'already_processed') {
      const current = dbUserToFrontend(database.prepare('SELECT * FROM users WHERE id = ?').get(userId));
      return { outcome: 'already_processed', user: current, emailSent: false, emailDeliveryId: null };
    }
    throw error;
  }

  const deliveryResult = user.role === 'student'
    ? await deliverTransactionalEmail({ database, userId: user.id, emailType: EMAIL_TYPES.ACCOUNT_APPROVED })
    : { delivery: null, sent: false, reason: 'not_applicable' };

  const updatedUser = dbUserToFrontend(database.prepare('SELECT * FROM users WHERE id = ?').get(userId));

  return {
    outcome: 'approved',
    user: updatedUser,
    emailSent: Boolean(deliveryResult.sent),
    emailDeliveryId: deliveryResult.delivery?.id || null
  };
}

/**
 * Odrzuca podanie rekrutacyjne wskazanego użytkownika.
 * @returns {{outcome:'rejected', user:object}}
 * @throws {RecruitmentReviewError} kody: not_found
 */
export function rejectRecruitmentApplication({ userId, reviewerName, database = db } = {}) {
  const row = database.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!row) throw new RecruitmentReviewError('not_found', 'User not found');

  const user = dbUserToFrontend(row);
  const adminName = reviewerName || 'Dyrekcja';

  const rejectPendingUser = database.transaction(() => {
    database.prepare("UPDATE users SET status = 'rejected' WHERE id = ?").run(userId);
    database.prepare("UPDATE pending_applications SET status = 'rejected' WHERE user_id = ?").run(userId);
    database.prepare(`
      INSERT INTO audit_logs (id, timestamp, admin, action, detail)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      `log-${randomUUID()}`,
      new Date().toISOString(),
      adminName,
      `Odrzucono podanie: ${user.fullName}`,
      `Zgłoszenie @${user.username} zostało oddalone.`
    );
  });

  rejectPendingUser();

  return { outcome: 'rejected', user };
}
