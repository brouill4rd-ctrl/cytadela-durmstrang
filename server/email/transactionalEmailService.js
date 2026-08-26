import path from 'path';
import { fileURLToPath } from 'url';
import { getMailRuntimeConfig, getMailTransport } from './mailTransport.js';
import {
  EMAIL_TYPES,
  buildApplicationUrl,
  renderTransactionalEmail
} from './emailTemplates.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '../../public');
const DELIVERY_LOCK_MINUTES = 10;
export const EMAIL_RETRY_COOLDOWN_SECONDS = 60;

const DELIVERY_ASSETS = Object.freeze({
  herb: path.join(PUBLIC_DIR, 'tmd_herb.png'),
  signature: path.join(PUBLIC_DIR, 'podpisy', 'dyrekcja', 'at_czarny.png')
});

function deliveryId(userId, emailType) {
  return `txmail-${emailType}-${userId}`;
}

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function validateAbsoluteUrl(value, envName, { allowLocalhost = false } = {}) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${envName} musi być poprawnym adresem absolutnym.`);
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`${envName} musi używać protokołu http lub https.`);
  }
  if (!allowLocalhost && ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname)) {
    throw new Error(`${envName} nie może wskazywać localhost podczas rzeczywistej wysyłki.`);
  }
  return value.replace(/\/+$/, '');
}

export function queueTransactionalEmail(database, user, emailType) {
  if (!Object.values(EMAIL_TYPES).includes(emailType)) {
    throw new Error(`Nieobsługiwany typ wiadomości: ${emailType}`);
  }
  if (!user?.id) throw new Error('Brak użytkownika dla wiadomości transakcyjnej.');
  if (!validateEmail(user.email)) throw new Error('Użytkownik nie ma poprawnego adresu e-mail.');

  database.prepare(`
    INSERT OR IGNORE INTO transactional_email_deliveries
      (id, user_id, email_type, recipient_email, status)
    VALUES (?, ?, ?, ?, 'pending')
  `).run(deliveryId(user.id, emailType), user.id, emailType, user.email.trim());

  return database.prepare(
    'SELECT * FROM transactional_email_deliveries WHERE user_id = ? AND email_type = ?'
  ).get(user.id, emailType);
}

export function serializeDelivery(row) {
  if (!row) return null;
  return {
    id: row.id,
    type: row.email_type,
    recipientEmail: row.recipient_email,
    status: row.status,
    attemptCount: row.attempt_count,
    providerMessageId: row.provider_message_id || '',
    lastError: row.last_error || '',
    createdAt: row.created_at,
    lastAttemptAt: row.last_attempt_at,
    sentAt: row.sent_at
  };
}

export function getUserEmailDeliveries(database, userId) {
  const rows = database.prepare(
    'SELECT * FROM transactional_email_deliveries WHERE user_id = ? ORDER BY created_at'
  ).all(userId);
  return Object.fromEntries(rows.map(row => [row.email_type, serializeDelivery(row)]));
}

function claimDelivery(database, userId, emailType, { retry = false } = {}) {
  return database.transaction(() => {
    const row = database.prepare(
      'SELECT * FROM transactional_email_deliveries WHERE user_id = ? AND email_type = ?'
    ).get(userId, emailType);
    if (!row) throw new Error('Nie znaleziono zakolejkowanej wiadomości.');
    if (row.status === 'sent') return { row, claimed: false, reason: 'already_sent' };

    if (retry && row.status !== 'failed') {
      return { row, claimed: false, reason: 'not_failed' };
    }

    if (retry && row.last_attempt_at) {
      const elapsedSeconds = (Date.now() - new Date(`${row.last_attempt_at}Z`).getTime()) / 1000;
      if (Number.isFinite(elapsedSeconds) && elapsedSeconds < EMAIL_RETRY_COOLDOWN_SECONDS) {
        return { row, claimed: false, reason: 'cooldown' };
      }
    }

    const result = database.prepare(`
      UPDATE transactional_email_deliveries
      SET status = 'sending', attempt_count = attempt_count + 1,
          last_attempt_at = datetime('now'), last_error = ''
      WHERE id = ?
        AND (
          status IN ('pending', 'failed')
          OR (status = 'sending' AND last_attempt_at < datetime('now', ?))
        )
    `).run(row.id, `-${DELIVERY_LOCK_MINUTES} minutes`);

    const claimedRow = database.prepare(
      'SELECT * FROM transactional_email_deliveries WHERE id = ?'
    ).get(row.id);
    return { row: claimedRow, claimed: result.changes === 1, reason: result.changes === 1 ? 'claimed' : 'in_progress' };
  })();
}

function createTemplateData(user, emailType, runtimeConfig, { preview = false } = {}) {
  const appUrl = validateAbsoluteUrl(runtimeConfig.appUrl, 'APP_URL', { allowLocalhost: preview || runtimeConfig.transportMode === 'json' });
  const common = {
    herbSrc: preview ? `${appUrl}/tmd_herb.png` : 'cid:durmstrang-herb',
    signatureSrc: preview ? `${appUrl}/podpisy/dyrekcja/at_czarny.png` : 'cid:durmstrang-council-signature'
  };

  if (emailType === EMAIL_TYPES.ACCOUNT_CREATED) return common;

  if (!runtimeConfig.discordUrl) {
    throw new Error('Brak konfiguracji DISCORD_INVITE_URL dla listu przyjęcia.');
  }
  const discordUrl = validateAbsoluteUrl(runtimeConfig.discordUrl, 'DISCORD_INVITE_URL', { allowLocalhost: false });
  return {
    ...common,
    house: user.house,
    statuteUrl: buildApplicationUrl(appUrl, '#/statut'),
    discordUrl,
    vademecumUrl: buildApplicationUrl(appUrl, '#/przewodnik')
  };
}

function archiveRenderedEmail(database, delivery, user, rendered, runtimeConfig) {
  const archiveId = `mail-${delivery.email_type}-${user.id}`;
  database.prepare(`
    INSERT INTO emails
      (id, to_email, to_name, from_addr, from_name, subject, date, read, type, body, html_body, delivery_id)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'), 0, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      to_email = excluded.to_email,
      to_name = excluded.to_name,
      from_addr = excluded.from_addr,
      from_name = excluded.from_name,
      subject = excluded.subject,
      body = excluded.body,
      html_body = excluded.html_body,
      delivery_id = excluded.delivery_id
  `).run(
    archiveId,
    delivery.recipient_email,
    user.full_name,
    runtimeConfig.fromAddress || 'nieskonfigurowany@durmstrang.invalid',
    runtimeConfig.fromName,
    rendered.subject,
    delivery.email_type,
    rendered.text,
    rendered.html,
    delivery.id
  );
}

export async function deliverTransactionalEmail({
  database,
  userId,
  emailType,
  retry = false,
  transport,
  runtimeConfig = getMailRuntimeConfig()
}) {
  const claim = claimDelivery(database, userId, emailType, { retry });
  if (!claim.claimed) {
    return { delivery: serializeDelivery(claim.row), sent: false, reason: claim.reason };
  }

  const user = database.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) throw new Error('Nie znaleziono użytkownika dla zakolejkowanej wiadomości.');

  try {
    if (!validateEmail(claim.row.recipient_email)) {
      throw new Error('Adres odbiorcy nie jest poprawnym adresem e-mail.');
    }
    if (!runtimeConfig.fromAddress) {
      throw new Error('Brak konfiguracji MAIL_FROM_ADDRESS.');
    }

    const rendered = renderTransactionalEmail(
      emailType,
      createTemplateData(user, emailType, runtimeConfig)
    );
    archiveRenderedEmail(database, claim.row, user, rendered, runtimeConfig);

    const mailTransport = transport || getMailTransport();
    const messageDomain = runtimeConfig.fromAddress.split('@')[1] || 'durmstrang-mail.invalid';
    const info = await mailTransport.sendMail({
      from: { name: runtimeConfig.fromName, address: runtimeConfig.fromAddress },
      replyTo: runtimeConfig.replyTo || undefined,
      to: { name: user.full_name, address: claim.row.recipient_email },
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html,
      messageId: `<${claim.row.id}@${messageDomain}>`,
      attachments: [
        { filename: 'herb-twierdzy-durmstrang.png', path: DELIVERY_ASSETS.herb, cid: 'durmstrang-herb' },
        { filename: 'podpis-rady-arcymistrzow.png', path: DELIVERY_ASSETS.signature, cid: 'durmstrang-council-signature' }
      ]
    });

    database.prepare(`
      UPDATE transactional_email_deliveries
      SET status = 'sent', sent_at = datetime('now'), provider_message_id = ?, last_error = ''
      WHERE id = ? AND status = 'sending'
    `).run(String(info?.messageId || ''), claim.row.id);

    const sentRow = database.prepare('SELECT * FROM transactional_email_deliveries WHERE id = ?').get(claim.row.id);
    return { delivery: serializeDelivery(sentRow), sent: true, reason: 'sent' };
  } catch (error) {
    const diagnostic = String(error?.message || error || 'Nieznany błąd wysyłki').slice(0, 2000);
    database.prepare(`
      UPDATE transactional_email_deliveries
      SET status = 'failed', last_error = ?
      WHERE id = ? AND status = 'sending'
    `).run(diagnostic, claim.row.id);
    console.error('[TransactionalEmail] Nie udało się wysłać wiadomości.', {
      deliveryId: claim.row.id,
      userId,
      emailType,
      error: diagnostic
    });
    const failedRow = database.prepare('SELECT * FROM transactional_email_deliveries WHERE id = ?').get(claim.row.id);
    return { delivery: serializeDelivery(failedRow), sent: false, reason: 'failed' };
  }
}

export function renderEmailPreview(emailType, user, runtimeConfig = getMailRuntimeConfig()) {
  const previewConfig = {
    ...runtimeConfig,
    appUrl: runtimeConfig.appUrl || 'http://localhost:5173',
    discordUrl: runtimeConfig.discordUrl || 'https://discord.com'
  };
  return renderTransactionalEmail(
    emailType,
    createTemplateData(user, emailType, previewConfig, { preview: true })
  );
}
