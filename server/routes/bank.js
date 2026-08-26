import { Router } from 'express';
import db, {
  dbBankAccountToFrontend,
  dbBankTransactionToFrontend,
  dbTeacherSalaryToFrontend,
  dbUserToFrontend
} from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/bank/account/:userId — get or create bank vault for user (zalogowani)
router.get('/account/:userId', requireAuth, (req, res) => {
  const { userId } = req.params;
  let row = db.prepare('SELECT * FROM bank_accounts WHERE user_id = ?').get(userId);

  if (!row) {
    // Check if user exists in users table
    const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!userRow) return res.status(404).json({ error: 'Użytkownik nie istnieje w Cytadeli' });

    const user = dbUserToFrontend(userRow);
    const vaultId = `vault-${user.username || Date.now()}`;
    const vaultNumber = `SKR-${Math.floor(100 + Math.random() * 900)}-${(user.house || 'NOV').toUpperCase().slice(0, 4)}`;
    const vaultTier = user.role === 'admin' ? 'Najwyższy Skarbiec Dyrekcji' : user.role === 'professor' ? 'Krypta Profesorska' : 'Skrytka Adepta';
    const balance = user.currency || 150;

    db.prepare(`
      INSERT INTO bank_accounts (id, user_id, user_name, vault_number, vault_tier, balance, security_level, rune_seal, guardian, interest_rate, opened_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      vaultId, user.id, user.fullName, vaultNumber, vaultTier, balance,
      'Maksymalny', 'Pieczęć Algiz & Sowilo', 'Górski Troll Granitowy', '2.5% rocznie'
    );

    row = db.prepare('SELECT * FROM bank_accounts WHERE user_id = ?').get(userId);
  }

  res.json(dbBankAccountToFrontend(row));
});

// GET /api/bank/accounts — list all bank vaults (Admin)
router.get('/accounts', requireAuth, requireRole('admin'), (req, res) => {
  const rows = db.prepare('SELECT * FROM bank_accounts ORDER BY balance DESC').all();
  res.json(rows.map(dbBankAccountToFrontend));
});

// POST /api/bank/transfer — transfer Skirnirs between users (zalogowani, walidacja sendera)
router.post('/transfer', requireAuth, (req, res) => {
  const { senderId, recipientId, amount, title, note } = req.body;
  const numAmount = parseInt(amount, 10);

  // Walidacja: sender musi być zalogowanym użytkownikiem
  if (senderId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Możesz wykonywać przelewy tylko z własnej skrytki.' });
  }

  if (!senderId || !recipientId || isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Nieprawidłowe dane przelewu. Kwota musi być większa od zera.' });
  }

  if (senderId === recipientId) {
    return res.status(400).json({ error: 'Nie możesz wykonać przelewu do samego siebie.' });
  }

  // Get sender user
  const senderRow = db.prepare('SELECT * FROM users WHERE id = ?').get(senderId);
  if (!senderRow) return res.status(404).json({ error: 'Nadawca nie istnieje w Cytadeli.' });
  const sender = dbUserToFrontend(senderRow);

  if ((sender.currency || 0) < numAmount) {
    return res.status(400).json({ error: `Niewystarczające środki w skrytce bankowej. Posiadasz: ${sender.currency} Skirnirów.` });
  }

  // Handle special targets (like house treasury or charity) vs normal users
  let recipientName = 'Odbiorca';
  let isSpecialTarget = false;

  if (recipientId.startsWith('house-treasury-')) {
    const houseKey = recipientId.replace('house-treasury-', '');
    recipientName = `Skarbiec Zakonu ${houseKey.toUpperCase()}`;
    isSpecialTarget = true;
  } else if (recipientId === 'cytadela-treasury') {
    recipientName = 'Skarbiec Główny Cytadeli';
    isSpecialTarget = true;
  } else {
    const recipientRow = db.prepare('SELECT * FROM users WHERE id = ?').get(recipientId);
    if (!recipientRow) return res.status(404).json({ error: 'Odbiorca przelewu nie istnieje.' });
    recipientName = recipientRow.full_name;
  }

  const txId = `tx-skr-${Date.now()}`;
  const refCode = `SKR-TX-${Math.floor(10000 + Math.random() * 90000)}`;
  const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

  // Execute database transaction
  const executeTransfer = db.transaction(() => {
    // 1. Deduct from sender
    db.prepare('UPDATE users SET currency = currency - ? WHERE id = ?').run(numAmount, senderId);
    db.prepare('UPDATE bank_accounts SET balance = balance - ? WHERE user_id = ?').run(numAmount, senderId);

    // 2. Add to recipient if regular user
    if (!isSpecialTarget) {
      db.prepare('UPDATE users SET currency = currency + ? WHERE id = ?').run(numAmount, recipientId);
      db.prepare('UPDATE bank_accounts SET balance = balance + ? WHERE user_id = ?').run(numAmount, recipientId);
    }

    // 3. Create bank transaction record
    db.prepare(`
      INSERT INTO bank_transactions (id, sender_id, sender_name, recipient_id, recipient_name, amount, type, category, title, note, status, reference_code, date, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      txId, sender.id, sender.fullName, recipientId, recipientName,
      numAmount, 'transfer', 'przelew', title || 'Przelew bankowy Skirnirów', note || '',
      'completed', refCode, nowStr
    );

    // 4. Send notification email to recipient if user
    if (!isSpecialTarget) {
      const recipientUserRow = db.prepare('SELECT username FROM users WHERE id = ?').get(recipientId);
      const recipientUsername = recipientUserRow ? recipientUserRow.username : recipientId;
      const emailId = `mail-bank-${Date.now()}`;
      db.prepare(`
        INSERT INTO emails (id, to_email, to_name, from_addr, from_name, subject, date, read, type, body)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'bank', ?)
      `).run(
        emailId,
        `${recipientUsername}@durmstrang.edu`,
        recipientName,
        'bank@kaupangr.durmstrang.edu',
        'Kaupangr Skírnisbanki',
        `[BANK] Wpływ na Twoją Skrytkę: +${numAmount} Skirnirów od ${sender.fullName}`,
        nowStr,
        `Szanowny Adept/Profesorze ${recipientName},

Do Twojej skrytki bankowej wpłynął oficjalny przelew waluty w Skirnirach:
- Kwota: +${numAmount} Skirnirów
- Nadawca: ${sender.fullName}
- Tytuł: ${title || 'Przelew bankowy'}
${note ? `- Notatka: „${note}”\n` : ''}- Kod transakcji: ${refCode}

Twoje saldo zostało zaktualizowane w księgach Banku Skirnirów.

Z pieczęcią krasnoludzkich mincerzy,
Główny Bankier Kaupangr Skírnisbanki`
      );
    }
  });

  executeTransfer();

  const senderUpdated = db.prepare('SELECT currency FROM users WHERE id = ?').get(senderId);
  const createdTx = db.prepare('SELECT * FROM bank_transactions WHERE id = ?').get(txId);

  res.json({
    success: true,
    newBalance: senderUpdated.currency,
    transaction: dbBankTransactionToFrontend(createdTx),
    message: `Pomyślnie przelano ${numAmount} Skirnirów do: ${recipientName}.`
  });
});

// GET /api/bank/transactions — transaction history (zalogowani)
router.get('/transactions', requireAuth, (req, res) => {
  const { userId, category, type, search } = req.query;

  let query = 'SELECT * FROM bank_transactions WHERE 1=1';
  const params = [];

  if (userId) {
    query += ' AND (sender_id = ? OR recipient_id = ?)';
    params.push(userId, userId);
  }

  if (category && category !== 'all') {
    query += ' AND category = ?';
    params.push(category);
  }

  if (type && type !== 'all') {
    if (type === 'inflow' && userId) {
      query += ' AND recipient_id = ?';
      params.push(userId);
    } else if (type === 'outflow' && userId) {
      query += ' AND sender_id = ?';
      params.push(userId);
    }
  }

  if (search) {
    query += ' AND (title LIKE ? OR note LIKE ? OR sender_name LIKE ? OR recipient_name LIKE ? OR reference_code LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s, s);
  }

  query += ' ORDER BY date DESC LIMIT 100';

  const rows = db.prepare(query).all(...params);
  res.json(rows.map(dbBankTransactionToFrontend));
});

// POST /api/bank/salaries/payout-all — bulk teacher payroll by Director (Admin)
router.post('/salaries/payout-all', requireAuth, requireRole('admin'), (req, res) => {
  const { amount = 500, period = 'Semestr Zimowy 2026/2027' } = req.body;
  const adminName = req.user.fullName || 'Arcymistrzyni Valgerda Storm';
  const numAmount = parseInt(amount, 10);

  const professors = db.prepare("SELECT * FROM users WHERE role = 'professor' AND status = 'approved'").all();

  if (professors.length === 0) {
    return res.status(400).json({ error: 'Brak aktywnych profesorów w rejestrze Cytadeli.' });
  }

  const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
  const salaryResults = [];

  const executePayroll = db.transaction(() => {
    for (const prof of professors) {
      const salId = `sal-${prof.id}-${Date.now()}`;
      const txId = `tx-sal-${prof.id}-${Date.now()}`;
      const refCode = `SKR-SAL-${Math.floor(10000 + Math.random() * 90000)}`;

      // 1. Credit professor currency & vault
      db.prepare('UPDATE users SET currency = currency + ? WHERE id = ?').run(numAmount, prof.id);
      db.prepare('UPDATE bank_accounts SET balance = balance + ? WHERE user_id = ?').run(numAmount, prof.id);

      // 2. Insert salary record
      db.prepare(`
        INSERT INTO teacher_salaries (id, professor_id, professor_name, amount, period, source, status, paid_at)
        VALUES (?, ?, ?, ?, ?, ?, 'paid', datetime('now'))
      `).run(salId, prof.id, prof.full_name, numAmount, period, 'Budżet Dyrekcji Cytadeli');

      // 3. Insert bank transaction
      db.prepare(`
        INSERT INTO bank_transactions (id, sender_id, sender_name, recipient_id, recipient_name, amount, type, category, title, note, status, reference_code, date, created_at)
        VALUES (?, 'cytadela-treasury', 'Rada Dyrekcji Cytadeli', ?, ?, ?, 'inflow', 'pensja', ?, ?, 'completed', ?, ?, datetime('now'))
      `).run(
        txId, prof.id, prof.full_name, numAmount,
        `Uposażenie Profesorskie (${period})`,
        `Wypłata pensji zadekretowana przez: ${adminName}`,
        refCode, nowStr
      );

      // 4. Send official notification email
      const emailId = `mail-sal-${prof.id}-${Date.now()}`;
      db.prepare(`
        INSERT INTO emails (id, to_email, to_name, from_addr, from_name, subject, date, read, type, body)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'bank', ?)
      `).run(
        emailId,
        prof.email || `${prof.username}@durmstrang.edu`,
        prof.full_name,
        'kancelaria@durmstrang.edu',
        adminName,
        `[WYPŁATA] Dekret Uposażenia Profesorskiego: +${numAmount} Skirnirów (${period})`,
        nowStr,
        `Wielce Szanowny Profesorze ${prof.full_name},

Z upoważnienia Rady Dyrekcji Cytadeli Durmstrang na Twoją profesorską skrytkę bankową przekazano semestralne uposażenie w wysokości:
+${numAmount} Skirnirów.

Dziękujemy za nieustanny trud kształcenia adeptów Północy w arkanach magii bojowej, run i eliksirów.

Z wyrazami szacunku,
${adminName}
Dyrektor Cytadeli Durmstrang`
      );

      salaryResults.push({ professorName: prof.full_name, amount: numAmount });
    }
  });

  executePayroll();

  res.json({
    success: true,
    totalPaid: numAmount * professors.length,
    count: professors.length,
    salaries: salaryResults,
    message: `Wypłacono łącznie ${numAmount * professors.length} Skirnirów dla ${professors.length} profesorów.`
  });
});

// POST /api/bank/salaries/payout-lesson — automatic payout per lesson (Admin / Profesor)
router.post('/salaries/payout-lesson', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  const { professorId, lessonId, lessonTopic, participantsCount = 5 } = req.body;

  const profRow = db.prepare('SELECT * FROM users WHERE id = ?').get(professorId);
  if (!profRow) return res.status(404).json({ error: 'Profesor nie istnieje.' });

  const baseRate = 200;
  const bonus = participantsCount >= 8 ? 50 : 0;
  const totalAmount = baseRate + bonus;

  const salId = `sal-les-${Date.now()}`;
  const txId = `tx-les-${Date.now()}`;
  const refCode = `SKR-LES-${Math.floor(10000 + Math.random() * 90000)}`;
  const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

  const executeLessonPayout = db.transaction(() => {
    db.prepare('UPDATE users SET currency = currency + ? WHERE id = ?').run(totalAmount, professorId);
    db.prepare('UPDATE bank_accounts SET balance = balance + ? WHERE user_id = ?').run(totalAmount, professorId);

    db.prepare(`
      INSERT INTO teacher_salaries (id, professor_id, professor_name, amount, period, source, lesson_id, status, paid_at)
      VALUES (?, ?, ?, ?, 'Lekcja Bieżąca', 'Honorarium Lekcyjne', ?, 'paid', datetime('now'))
    `).run(salId, professorId, profRow.full_name, totalAmount, lessonId || '');

    db.prepare(`
      INSERT INTO bank_transactions (id, sender_id, sender_name, recipient_id, recipient_name, amount, type, category, title, note, status, reference_code, date, created_at)
      VALUES (?, 'cytadela-treasury', 'Skarbiec Główny Cytadeli', ?, ?, ?, 'inflow', 'pensja', ?, ?, 'completed', ?, ?, datetime('now'))
    `).run(
      txId, professorId, profRow.full_name, totalAmount,
      `Honorarium za Lekcję: ${lessonTopic || 'Zajęcia Katedry'}`,
      `Automatyczne rozliczenie za poprowadzenie zajęć (${participantsCount} uczestników).`,
      refCode, nowStr
    );
  });

  executeLessonPayout();

  res.json({
    success: true,
    amount: totalAmount,
    message: `Wypłacono honorarium w wysokości ${totalAmount} Skirnirów dla: ${profRow.full_name}.`
  });
});

// GET /api/bank/salaries — get salary records (Admin)
router.get('/salaries', requireAuth, requireRole('admin'), (req, res) => {
  const rows = db.prepare('SELECT * FROM teacher_salaries ORDER BY paid_at DESC LIMIT 50').all();
  res.json(rows.map(dbTeacherSalaryToFrontend));
});

// POST /api/bank/deposit — direct currency deposit/withdrawal for rewards & penalties (zalogowani)
// Używane przez: nagrody z gier, loteria, misje, sekrety, alkemia itp.
router.post('/deposit', requireAuth, (req, res) => {
  const { userId, amount, type = 'inflow', title, category = 'nagroda' } = req.body;
  const numAmount = parseInt(amount, 10);

  if (!userId || isNaN(numAmount) || numAmount === 0) {
    return res.status(400).json({ error: 'Nieprawidłowe dane depozytu.' });
  }

  // Tylko własne konto lub admin
  if (userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Brak uprawnień do modyfikacji cudzej skrytki.' });
  }

  const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!userRow) return res.status(404).json({ error: 'Użytkownik nie istnieje.' });

  const isDeposit = type === 'inflow' || numAmount > 0;
  const absAmount = Math.abs(numAmount);
  const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
  const txId = `tx-dep-${Date.now()}`;
  const refCode = `SKR-DEP-${Math.floor(10000 + Math.random() * 90000)}`;

  const execute = db.transaction(() => {
    if (isDeposit) {
      db.prepare('UPDATE users SET currency = currency + ? WHERE id = ?').run(absAmount, userId);
      db.prepare('UPDATE bank_accounts SET balance = balance + ? WHERE user_id = ?').run(absAmount, userId);
    } else {
      db.prepare('UPDATE users SET currency = MAX(0, currency - ?) WHERE id = ?').run(absAmount, userId);
      db.prepare('UPDATE bank_accounts SET balance = MAX(0, balance - ?) WHERE user_id = ?').run(absAmount, userId);
    }

    db.prepare(`
      INSERT INTO bank_transactions (id, sender_id, sender_name, recipient_id, recipient_name, amount, type, category, title, note, status, reference_code, date, created_at)
      VALUES (?, 'cytadela-treasury', 'Skarbiec Cytadeli', ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, datetime('now'))
    `).run(
      txId,
      userId, userRow.full_name,
      isDeposit ? absAmount : -absAmount,
      isDeposit ? 'inflow' : 'outflow',
      category,
      title || (isDeposit ? 'Nagroda z aktywności' : 'Opłata / Wydatek'),
      '',
      refCode, nowStr
    );
  });

  execute();

  const updatedUser = db.prepare('SELECT currency FROM users WHERE id = ?').get(userId);
  const tx = db.prepare('SELECT * FROM bank_transactions WHERE id = ?').get(txId);

  res.json({
    success: true,
    newBalance: updatedUser.currency,
    transaction: dbBankTransactionToFrontend(tx)
  });
});

export default router;
