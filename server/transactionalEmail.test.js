import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { EMAIL_TYPES, HOUSE_EMAIL_THEMES, renderAccountApprovedEmail } from './email/emailTemplates.js';
import {
  deliverTransactionalEmail,
  getUserEmailDeliveries,
  queueTransactionalEmail
} from './email/transactionalEmailService.js';

const runtimeConfig = {
  appUrl: 'http://localhost:5173',
  discordUrl: 'https://discord.gg/test-preview-only',
  fromAddress: 'kancelaria@example.test',
  fromName: 'Rada Arcymistrzów • Twierdza Magii Durmstrang',
  replyTo: '',
  transportMode: 'json',
  smtp: {}
};

function createDatabase() {
  const database = new Database(':memory:');
  database.pragma('foreign_keys = ON');
  database.exec(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      full_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      house TEXT,
      avatar TEXT DEFAULT ''
    );
    CREATE TABLE emails (
      id TEXT PRIMARY KEY,
      to_email TEXT NOT NULL,
      to_name TEXT NOT NULL,
      from_addr TEXT NOT NULL,
      from_name TEXT NOT NULL,
      subject TEXT NOT NULL,
      date TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0,
      type TEXT NOT NULL,
      body TEXT NOT NULL,
      html_body TEXT DEFAULT '',
      delivery_id TEXT DEFAULT ''
    );
    CREATE TABLE transactional_email_deliveries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      email_type TEXT NOT NULL,
      recipient_email TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      attempt_count INTEGER NOT NULL DEFAULT 0,
      provider_message_id TEXT DEFAULT '',
      last_error TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_attempt_at TEXT,
      sent_at TEXT,
      UNIQUE (user_id, email_type),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  return database;
}

function insertUser(database, overrides = {}) {
  const user = {
    id: 'usr-test',
    email: 'adept@example.test',
    full_name: 'Testowy Adept',
    status: 'pending',
    house: 'ravnheim',
    ...overrides
  };
  database.prepare('INSERT INTO users (id, email, full_name, status, house) VALUES (?, ?, ?, ?, ?)')
    .run(user.id, user.email, user.full_name, user.status, user.house);
  return user;
}

function successfulTransport(sendLog) {
  return {
    async sendMail(message) {
      sendLog.push(message);
      return { messageId: `<provider-${sendLog.length}@example.test>` };
    }
  };
}

test('scenariusz A: utworzenie użytkownika kolejkuje i wysyła wyłącznie mail rejestracyjny', async () => {
  const database = createDatabase();
  const user = insertUser(database);
  const sendLog = [];

  queueTransactionalEmail(database, user, EMAIL_TYPES.ACCOUNT_CREATED);
  await deliverTransactionalEmail({ database, userId: user.id, emailType: EMAIL_TYPES.ACCOUNT_CREATED, transport: successfulTransport(sendLog), runtimeConfig });

  assert.equal(database.prepare('SELECT COUNT(*) count FROM users').get().count, 1);
  assert.equal(sendLog.length, 1);
  assert.match(sendLog[0].subject, /Twoje zgłoszenie zostało przyjęte/);
  assert.equal(getUserEmailDeliveries(database, user.id)[EMAIL_TYPES.ACCOUNT_APPROVED], undefined);
  database.close();
});

test('scenariusze B, C i D: akceptacja używa Zakonu, późniejsza edycja i podwójna próba nie duplikują listu', async () => {
  const database = createDatabase();
  const user = insertUser(database, { house: 'bjornhall' });
  const sendLog = [];

  database.prepare("UPDATE users SET status = 'approved' WHERE id = ? AND status = 'pending'").run(user.id);
  queueTransactionalEmail(database, user, EMAIL_TYPES.ACCOUNT_APPROVED);
  await Promise.all([
    deliverTransactionalEmail({ database, userId: user.id, emailType: EMAIL_TYPES.ACCOUNT_APPROVED, transport: successfulTransport(sendLog), runtimeConfig }),
    deliverTransactionalEmail({ database, userId: user.id, emailType: EMAIL_TYPES.ACCOUNT_APPROVED, transport: successfulTransport(sendLog), runtimeConfig })
  ]);

  assert.equal(sendLog.length, 1);
  assert.match(sendLog[0].html, /Björnhall/i);
  assert.doesNotMatch(sendLog[0].html, />Ravnheim</i);

  database.prepare("UPDATE users SET avatar = 'nowy-avatar.png' WHERE id = ?").run(user.id);
  queueTransactionalEmail(database, user, EMAIL_TYPES.ACCOUNT_APPROVED);
  const afterEdit = await deliverTransactionalEmail({ database, userId: user.id, emailType: EMAIL_TYPES.ACCOUNT_APPROVED, transport: successfulTransport(sendLog), runtimeConfig });
  assert.equal(afterEdit.reason, 'already_sent');
  assert.equal(sendLog.length, 1);
  assert.equal(database.prepare("SELECT COUNT(*) count FROM transactional_email_deliveries WHERE email_type = 'account_approved'").get().count, 1);
  database.close();
});

test('scenariusz E: błąd providera nie usuwa użytkownika i zostaje zapisany diagnostycznie', async () => {
  const database = createDatabase();
  const user = insertUser(database);
  queueTransactionalEmail(database, user, EMAIL_TYPES.ACCOUNT_CREATED);

  const result = await deliverTransactionalEmail({
    database,
    userId: user.id,
    emailType: EMAIL_TYPES.ACCOUNT_CREATED,
    runtimeConfig,
    transport: { async sendMail() { throw new Error('SMTP timeout test'); } }
  });

  assert.equal(database.prepare('SELECT COUNT(*) count FROM users WHERE id = ?').get(user.id).count, 1);
  assert.equal(result.delivery.status, 'failed');
  assert.match(result.delivery.lastError, /SMTP timeout test/);
  database.close();
});

test('scenariusz F: każdy istniejący Zakon otrzymuje własną, dynamiczną sekcję decyzji', () => {
  for (const [houseId, theme] of Object.entries(HOUSE_EMAIL_THEMES)) {
    const rendered = renderAccountApprovedEmail({
      house: houseId,
      statuteUrl: 'https://example.test/#/statut',
      discordUrl: 'https://discord.gg/test-preview-only',
      vademecumUrl: 'https://example.test/#/przewodnik',
      herbSrc: 'cid:herb',
      signatureSrc: 'cid:signature'
    });
    assert.match(rendered.html, new RegExp(theme.name, 'i'));
    assert.match(rendered.html, new RegExp(theme.rune));
    assert.match(rendered.html, /Statut Twierdzy Magii Durmstrang/);
    assert.match(rendered.html, /Serwer Discord/);
    assert.match(rendered.html, /Vademecum Durmstrangu/);
  }
});
