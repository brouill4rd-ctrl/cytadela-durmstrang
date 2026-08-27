import { randomUUID } from 'crypto';

let _db;

export function initSkirnirService(db) {
  _db = db;

  // Migration: add idempotency_key and source columns to bank_transactions if missing
  const cols = db.pragma('table_info(bank_transactions)');
  const colNames = cols.map(c => c.name);

  if (!colNames.includes('idempotency_key')) {
    db.exec("ALTER TABLE bank_transactions ADD COLUMN idempotency_key TEXT DEFAULT ''");
  }
  if (!colNames.includes('source_type')) {
    db.exec("ALTER TABLE bank_transactions ADD COLUMN source_type TEXT DEFAULT 'LEGACY'");
  }
  if (!colNames.includes('source_id')) {
    db.exec("ALTER TABLE bank_transactions ADD COLUMN source_id TEXT DEFAULT ''");
  }
  if (!colNames.includes('actor_id')) {
    db.exec("ALTER TABLE bank_transactions ADD COLUMN actor_id TEXT DEFAULT ''");
  }
  if (!colNames.includes('actor_name')) {
    db.exec("ALTER TABLE bank_transactions ADD COLUMN actor_name TEXT DEFAULT ''");
  }
  if (!colNames.includes('school_year')) {
    db.exec("ALTER TABLE bank_transactions ADD COLUMN school_year TEXT DEFAULT ''");
  }

  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_bt_idempotency ON bank_transactions(idempotency_key) WHERE idempotency_key != ''");
}

function getSchoolYear() {
  return _db.prepare("SELECT value FROM school_config WHERE key='school_year'").get()?.value || 'XIX Rok Szkolny (2026/2027)';
}

function ensureBankAccount(userId) {
  const exists = _db.prepare('SELECT id FROM bank_accounts WHERE user_id = ?').get(userId);
  if (exists) return;

  const userRow = _db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!userRow) return;

  const vaultId = `vault-${userRow.username || Date.now()}`;
  const vaultNumber = `SKR-${Math.floor(100 + Math.random() * 900)}-${(userRow.house || 'NOV').toUpperCase().slice(0, 4)}`;
  const vaultTier = userRow.role === 'admin' ? 'Najwyższy Skarbiec Dyrekcji' : userRow.role === 'professor' ? 'Krypta Profesorska' : 'Skrytka Adepta';

  _db.prepare(`
    INSERT OR IGNORE INTO bank_accounts (id, user_id, user_name, vault_number, vault_tier, balance, security_level, rune_seal, guardian, interest_rate, opened_at)
    VALUES (?, ?, ?, ?, ?, ?, 'Maksymalny', 'Pieczęć Algiz & Sowilo', 'Górski Troll Granitowy', '2.5% rocznie', datetime('now'))
  `).run(vaultId, userId, userRow.full_name, vaultNumber, vaultTier, userRow.currency || 0);
}

/**
 * Credit Skirniry to a user. Creates a bank_transaction record and updates caches.
 */
export function credit({
  userId,
  userName = '',
  amount,
  category = 'nagroda',
  title = '',
  note = '',
  sourceType = 'MANUAL',
  sourceId = '',
  actorId = '',
  actorName = '',
  idempotencyKey = ''
}) {
  if (!userId || !amount || amount <= 0) {
    throw new Error('Wymagane userId i dodatnia kwota.');
  }

  if (idempotencyKey) {
    const existing = _db.prepare("SELECT id FROM bank_transactions WHERE idempotency_key = ?").get(idempotencyKey);
    if (existing) return { txId: existing.id, duplicate: true };
  }

  const absAmount = Math.abs(amount);
  const txId = `tx-${sourceType.toLowerCase()}-${Date.now()}-${randomUUID().slice(0, 6)}`;
  const refCode = `SKR-${sourceType.slice(0, 3)}-${Math.floor(10000 + Math.random() * 90000)}`;
  const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
  const schoolYear = getSchoolYear();

  if (!userName) {
    const userRow = _db.prepare('SELECT full_name FROM users WHERE id = ?').get(userId);
    userName = userRow?.full_name || 'Adept';
  }

  return _db.transaction(() => {
    ensureBankAccount(userId);

    // Update caches
    _db.prepare('UPDATE users SET currency = currency + ? WHERE id = ?').run(absAmount, userId);
    _db.prepare('UPDATE bank_accounts SET balance = balance + ? WHERE user_id = ?').run(absAmount, userId);

    // Insert ledger entry
    _db.prepare(`
      INSERT INTO bank_transactions (
        id, sender_id, sender_name, recipient_id, recipient_name,
        amount, type, category, title, note, status, reference_code,
        date, source_type, source_id, actor_id, actor_name,
        school_year, idempotency_key, created_at
      ) VALUES (?, 'cytadela-treasury', 'Skarbiec Cytadeli', ?, ?, ?, 'inflow', ?, ?, ?, 'completed', ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      txId, userId, userName,
      absAmount, category, title || 'Nagroda z aktywności', note || '',
      refCode, nowStr, sourceType, sourceId,
      actorId || 'system', actorName || 'System Cytadeli',
      schoolYear, idempotencyKey || ''
    );

    return { txId, duplicate: false };
  })();
}

/**
 * Debit Skirniry from a user. Checks balance first.
 */
export function debit({
  userId,
  userName = '',
  amount,
  category = 'wydatek',
  title = '',
  note = '',
  recipientId = '',
  recipientName = '',
  sourceType = 'MANUAL',
  sourceId = '',
  actorId = '',
  actorName = '',
  idempotencyKey = ''
}) {
  if (!userId || !amount || amount <= 0) {
    throw new Error('Wymagane userId i dodatnia kwota.');
  }

  if (idempotencyKey) {
    const existing = _db.prepare("SELECT id FROM bank_transactions WHERE idempotency_key = ?").get(idempotencyKey);
    if (existing) return { txId: existing.id, duplicate: true };
  }

  const absAmount = Math.abs(amount);
  const userRow = _db.prepare('SELECT currency, full_name FROM users WHERE id = ?').get(userId);
  if (!userRow) throw new Error('Użytkownik nie istnieje.');

  if ((userRow.currency || 0) < absAmount) {
    throw new Error(`Niewystarczające saldo Skirnirów. Posiadasz: ${userRow.currency || 0}, wymagane: ${absAmount}.`);
  }

  if (!userName) userName = userRow.full_name || 'Adept';

  const txId = `tx-${sourceType.toLowerCase()}-${Date.now()}-${randomUUID().slice(0, 6)}`;
  const refCode = `SKR-${sourceType.slice(0, 3)}-${Math.floor(10000 + Math.random() * 90000)}`;
  const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
  const schoolYear = getSchoolYear();

  return _db.transaction(() => {
    ensureBankAccount(userId);

    _db.prepare('UPDATE users SET currency = currency - ? WHERE id = ?').run(absAmount, userId);
    _db.prepare('UPDATE bank_accounts SET balance = balance - ? WHERE user_id = ?').run(absAmount, userId);

    _db.prepare(`
      INSERT INTO bank_transactions (
        id, sender_id, sender_name, recipient_id, recipient_name,
        amount, type, category, title, note, status, reference_code,
        date, source_type, source_id, actor_id, actor_name,
        school_year, idempotency_key, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'outflow', ?, ?, ?, 'completed', ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      txId, userId, userName,
      recipientId || 'cytadela-treasury', recipientName || 'Skarbiec Cytadeli',
      -absAmount, category, title || 'Wydatek', note || '',
      refCode, nowStr, sourceType, sourceId,
      actorId || userId, actorName || userName,
      schoolYear, idempotencyKey || ''
    );

    return { txId, duplicate: false };
  })();
}

/**
 * Transfer Skirniry between two users.
 */
export function transfer({
  senderId,
  senderName = '',
  recipientId,
  recipientName = '',
  amount,
  title = '',
  note = '',
  idempotencyKey = ''
}) {
  if (!senderId || !recipientId || !amount || amount <= 0) {
    throw new Error('Wymagane obie strony i dodatnia kwota.');
  }
  if (senderId === recipientId) {
    throw new Error('Nie można przelewać do samego siebie.');
  }

  if (idempotencyKey) {
    const existing = _db.prepare("SELECT id FROM bank_transactions WHERE idempotency_key = ?").get(idempotencyKey);
    if (existing) return { txId: existing.id, duplicate: true };
  }

  const senderRow = _db.prepare('SELECT currency, full_name FROM users WHERE id = ?').get(senderId);
  if (!senderRow) throw new Error('Nadawca nie istnieje.');
  if ((senderRow.currency || 0) < amount) {
    throw new Error(`Niewystarczające środki. Posiadasz: ${senderRow.currency} Skirnirów.`);
  }

  if (!senderName) senderName = senderRow.full_name;

  const isSpecialTarget = recipientId.startsWith('house-treasury-') || recipientId === 'cytadela-treasury';

  if (!isSpecialTarget) {
    const recipientRow = _db.prepare('SELECT full_name FROM users WHERE id = ?').get(recipientId);
    if (!recipientRow) throw new Error('Odbiorca nie istnieje.');
    if (!recipientName) recipientName = recipientRow.full_name;
  } else if (!recipientName) {
    recipientName = recipientId.startsWith('house-treasury-')
      ? `Skarbiec Zakonu ${recipientId.replace('house-treasury-', '').toUpperCase()}`
      : 'Skarbiec Główny Cytadeli';
  }

  const txId = `tx-transfer-${Date.now()}-${randomUUID().slice(0, 6)}`;
  const refCode = `SKR-TX-${Math.floor(10000 + Math.random() * 90000)}`;
  const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
  const schoolYear = getSchoolYear();

  return _db.transaction(() => {
    ensureBankAccount(senderId);

    _db.prepare('UPDATE users SET currency = currency - ? WHERE id = ?').run(amount, senderId);
    _db.prepare('UPDATE bank_accounts SET balance = balance - ? WHERE user_id = ?').run(amount, senderId);

    if (!isSpecialTarget) {
      ensureBankAccount(recipientId);
      _db.prepare('UPDATE users SET currency = currency + ? WHERE id = ?').run(amount, recipientId);
      _db.prepare('UPDATE bank_accounts SET balance = balance + ? WHERE user_id = ?').run(amount, recipientId);
    }

    _db.prepare(`
      INSERT INTO bank_transactions (
        id, sender_id, sender_name, recipient_id, recipient_name,
        amount, type, category, title, note, status, reference_code,
        date, source_type, source_id, actor_id, actor_name,
        school_year, idempotency_key, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'transfer', 'przelew', ?, ?, 'completed', ?, ?, 'TRANSFER', '', ?, ?, ?, ?, datetime('now'))
    `).run(
      txId, senderId, senderName, recipientId, recipientName,
      amount, title || 'Przelew bankowy Skirnirów', note || '',
      refCode, nowStr, senderId, senderName,
      schoolYear, idempotencyKey || ''
    );

    return { txId, duplicate: false, newBalance: (senderRow.currency || 0) - amount };
  })();
}

/**
 * Reverse a Skirnir transaction by creating a compensating entry.
 */
export function reverse(transactionId, actorId, actorName, reason) {
  const tx = _db.prepare('SELECT * FROM bank_transactions WHERE id = ?').get(transactionId);
  if (!tx) throw new Error('Transakcja bankowa nie istnieje.');

  const reverseAmount = -(tx.amount || 0);
  const isInflow = tx.type === 'inflow';

  return _db.transaction(() => {
    const txId = `tx-rev-${Date.now()}-${randomUUID().slice(0, 6)}`;
    const refCode = `SKR-REV-${Math.floor(10000 + Math.random() * 90000)}`;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    // Adjust user balances
    if (isInflow && tx.recipient_id && tx.recipient_id !== 'cytadela-treasury') {
      _db.prepare('UPDATE users SET currency = MAX(0, currency - ?) WHERE id = ?').run(Math.abs(tx.amount), tx.recipient_id);
      _db.prepare('UPDATE bank_accounts SET balance = MAX(0, balance - ?) WHERE user_id = ?').run(Math.abs(tx.amount), tx.recipient_id);
    } else if (!isInflow && tx.sender_id && tx.sender_id !== 'cytadela-treasury') {
      _db.prepare('UPDATE users SET currency = currency + ? WHERE id = ?').run(Math.abs(tx.amount), tx.sender_id);
      _db.prepare('UPDATE bank_accounts SET balance = balance + ? WHERE user_id = ?').run(Math.abs(tx.amount), tx.sender_id);
    }

    _db.prepare(`
      INSERT INTO bank_transactions (
        id, sender_id, sender_name, recipient_id, recipient_name,
        amount, type, category, title, note, status, reference_code,
        date, source_type, source_id, actor_id, actor_name,
        school_year, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'korekta', ?, ?, 'completed', ?, ?, 'REVERSAL', ?, ?, ?, ?, datetime('now'))
    `).run(
      txId, tx.sender_id, tx.sender_name, tx.recipient_id, tx.recipient_name,
      reverseAmount, isInflow ? 'outflow' : 'inflow',
      `Korekta transakcji ${transactionId}`,
      `Powód: ${reason}. Wycofanie operacji z ${tx.date}.`,
      refCode, nowStr, transactionId,
      actorId || 'system', actorName || 'System',
      getSchoolYear()
    );

    return txId;
  })();
}

/**
 * Get Skirnir balance for a user from the ledger.
 */
export function getBalance(userId) {
  const inflow = _db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM bank_transactions
    WHERE recipient_id = ? AND status = 'completed' AND amount > 0
  `).get(userId).total;

  const outflow = _db.prepare(`
    SELECT COALESCE(SUM(ABS(amount)), 0) as total FROM bank_transactions
    WHERE sender_id = ? AND status = 'completed' AND amount < 0
  `).get(userId).total;

  const transferOut = _db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM bank_transactions
    WHERE sender_id = ? AND type = 'transfer' AND status = 'completed' AND amount > 0
  `).get(userId).total;

  return inflow - outflow - transferOut;
}

/**
 * Get Skirnir transaction history for a user.
 */
export function getHistory(userId, { limit = 100, category = null } = {}) {
  let query = 'SELECT * FROM bank_transactions WHERE (sender_id = ? OR recipient_id = ?) AND status = \'completed\'';
  const params = [userId, userId];
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  query += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);
  return _db.prepare(query).all(...params);
}

/**
 * Recalculate user.currency and bank_accounts.balance from ledger.
 */
export function recalculateBalance(userId) {
  const userRow = _db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!userRow) return 0;

  // Sum all inflows to this user
  const inflows = _db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM bank_transactions
    WHERE recipient_id = ? AND status = 'completed' AND (type = 'inflow' OR (type = 'transfer' AND amount > 0))
  `).get(userId).total;

  // Sum all outflows from this user
  const outflows = _db.prepare(`
    SELECT COALESCE(SUM(ABS(amount)), 0) as total FROM bank_transactions
    WHERE sender_id = ? AND status = 'completed' AND (type = 'outflow' OR type = 'transfer')
  `).get(userId).total;

  const balance = Math.max(0, inflows - outflows);

  _db.transaction(() => {
    _db.prepare('UPDATE users SET currency = ? WHERE id = ?').run(balance, userId);
    _db.prepare('UPDATE bank_accounts SET balance = ? WHERE user_id = ?').run(balance, userId);
  })();

  return balance;
}

/**
 * Recalculate all users' Skirnir balances from ledger.
 */
export function recalculateAllBalances() {
  const users = _db.prepare('SELECT id FROM users').all();
  let count = 0;
  _db.transaction(() => {
    for (const u of users) {
      recalculateBalance(u.id);
      count++;
    }
  })();
  return count;
}
